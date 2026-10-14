-- Security & data-integrity fixes from the 2026-10-14 audit (security-reviewer + code-reviewer).
-- Review before applying: see the pre-flight checks noted inline for the UNIQUE INDEX below.

-- ============================================================================
-- 1. CRITICAL: deleting a patient must not cascade-delete clinical history.
--    Find the real FK constraint names (don't assume the default naming) and
--    swap CASCADE for RESTRICT so patient_records/sessions block the delete.
-- ============================================================================
DO $$
DECLARE c record;
BEGIN
  FOR c IN
    SELECT con.conname, con.conrelid::regclass::text AS tbl
    FROM pg_constraint con
    JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
    WHERE con.contype = 'f' AND con.confrelid = 'public.patients'::regclass
      AND con.conrelid IN ('public.patient_records'::regclass, 'public.sessions'::regclass)
      AND att.attname = 'patient_id'
  LOOP
    EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', c.tbl, c.conname);
  END LOOP;
END $$;

ALTER TABLE public.patient_records
  ADD CONSTRAINT patient_records_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;
ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE RESTRICT;

-- ============================================================================
-- 2. HIGH: clinical sequence numbers must not be reusable mid-history, and an
--    approved evolution must become immutable. Only the most recent,
--    not-yet-approved record may still be deleted (fixing a mistaken entry).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.guard_clinical_record() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE owner uuid;
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.approved THEN RAISE EXCEPTION 'Evolução aprovada é imutável'; END IF;
  IF EXISTS (SELECT 1 FROM public.patient_records WHERE patient_id=OLD.patient_id AND sequence_no > OLD.sequence_no) THEN
   RAISE EXCEPTION 'Só é possível excluir a evolução mais recente, antes de aprovada';
  END IF;
  RETURN OLD;
 END IF;
 SELECT user_id INTO owner FROM public.patients WHERE id=NEW.patient_id FOR UPDATE;
 IF owner IS DISTINCT FROM NEW.user_id THEN RAISE EXCEPTION 'Paciente de outra conta'; END IF;
 IF TG_OP='INSERT' THEN
  SELECT coalesce(max(sequence_no),0)+1 INTO NEW.sequence_no FROM public.patient_records WHERE patient_id=NEW.patient_id;
 ELSE
  IF NEW.sequence_no IS DISTINCT FROM OLD.sequence_no OR NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
   RAISE EXCEPTION 'Identificação da evolução não pode ser alterada';
  END IF;
  IF OLD.approved AND (NEW.content IS DISTINCT FROM OLD.content OR NEW.clinical_sections IS DISTINCT FROM OLD.clinical_sections OR NEW.approved IS DISTINCT FROM OLD.approved) THEN
   RAISE EXCEPTION 'Evolução aprovada é imutável';
  END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS clinical_record_guard ON public.patient_records;
CREATE TRIGGER clinical_record_guard BEFORE INSERT OR UPDATE OR DELETE ON public.patient_records FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_record();

-- ============================================================================
-- 3. HIGH: fiscal receipt lock had a two-step bypass (untick -> edit -> retick).
--    Make receipt_issued one-way; add an explicit, justified reversal path.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.guard_financial_transaction() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.receipt_issued THEN RAISE EXCEPTION 'Recibo fiscal emitido: exclusão bloqueada'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Dono não pode ser alterado'; END IF;
  IF OLD.receipt_issued THEN
   IF NEW.receipt_issued=false AND coalesce(current_setting('app.allow_receipt_reversal', true),'0')<>'1' THEN
    RAISE EXCEPTION 'Recibo fiscal emitido não pode ser desfeito diretamente; use a função de reversão com justificativa';
   END IF;
   IF (to_jsonb(NEW)-'receipt_issued'-'version') IS DISTINCT FROM (to_jsonb(OLD)-'receipt_issued'-'version') THEN
    RAISE EXCEPTION 'Recibo fiscal emitido: alteração bloqueada';
   END IF;
  END IF;
  NEW.version=OLD.version+1;
 END IF;
 IF NEW.patient_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.patients WHERE id=NEW.patient_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Paciente de outra conta'; END IF;
 IF NEW.receipt_issued AND (NEW.status<>'Pago' OR NEW.type<>'receita') THEN RAISE EXCEPTION 'Recibo exige receita recebida'; END IF;
 IF NEW.amount<=0 THEN RAISE EXCEPTION 'Valor deve ser positivo'; END IF;
 IF NEW.status='Pago' THEN NEW.paid_at=coalesce(NEW.paid_at,current_date); ELSE NEW.paid_at=NULL; END IF;
 RETURN NEW;
END $$;

CREATE OR REPLACE FUNCTION public.reverse_receipt(_transaction_id uuid, _reason text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Não autenticado'; END IF;
 IF coalesce(trim(_reason),'')='' THEN RAISE EXCEPTION 'Informe o motivo da reversão'; END IF;
 PERFORM set_config('app.allow_receipt_reversal','1',true);
 UPDATE public.transactions SET receipt_issued=false WHERE id=_transaction_id AND user_id=auth.uid() AND receipt_issued=true;
 IF NOT FOUND THEN RAISE EXCEPTION 'Lançamento não encontrado ou recibo não emitido'; END IF;
 INSERT INTO public.financial_audit(user_id,transaction_id,operation,before_snapshot,after_snapshot)
  VALUES(auth.uid(),_transaction_id,'RECEIPT_REVERSAL',jsonb_build_object('reason',_reason),NULL);
END $$;
REVOKE ALL ON FUNCTION public.reverse_receipt(uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reverse_receipt(uuid,text) TO authenticated;

-- ============================================================================
-- 4. HIGH: creating/removing the charge for a session must be atomic and
--    server-side, not a racy two-step client insert. One charge per session.
--    PRE-FLIGHT: before applying, check for existing duplicates:
--      SELECT session_id, count(*) FROM public.transactions
--      WHERE session_id IS NOT NULL GROUP BY session_id HAVING count(*) > 1;
--    Resolve any duplicates first, or this UNIQUE INDEX will fail to create.
-- ============================================================================
CREATE UNIQUE INDEX IF NOT EXISTS transactions_session_id_unique ON public.transactions(session_id) WHERE session_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.sync_session_charge() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NEW.status='Realizada' AND OLD.status IS DISTINCT FROM 'Realizada' AND NEW.price>0
    AND NOT EXISTS (SELECT 1 FROM public.transactions WHERE session_id=NEW.id) THEN
  INSERT INTO public.transactions(user_id,type,description,amount,due_date,status,category,patient_id,session_id)
  VALUES (NEW.user_id,'receita','Sessão realizada',NEW.price,(NEW.starts_at AT TIME ZONE 'America/Sao_Paulo')::date,'Pendente','Sessão',NEW.patient_id,NEW.id)
  ON CONFLICT (session_id) WHERE session_id IS NOT NULL DO NOTHING;
 ELSIF OLD.status='Realizada' AND NEW.status IS DISTINCT FROM 'Realizada' THEN
  DELETE FROM public.transactions WHERE session_id=NEW.id AND status='Pendente' AND NOT receipt_issued;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS session_charge_sync ON public.sessions;
CREATE TRIGGER session_charge_sync AFTER UPDATE OF status ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.sync_session_charge();

-- ============================================================================
-- 5. HIGH: a cancelled/deleted session must free its public slot again.
--    guard_booking_availability currently forbids ANY un-booking forever.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.guard_booking_availability()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Dono não pode ser alterado'; END IF;
  IF OLD.booked AND (NEW.starts_at IS DISTINCT FROM OLD.starts_at OR NEW.duration_min IS DISTINCT FROM OLD.duration_min OR NEW.modality IS DISTINCT FROM OLD.modality) THEN RAISE EXCEPTION 'Horário reservado não pode ser alterado'; END IF;
  IF NEW.starts_at IS NOT DISTINCT FROM OLD.starts_at AND NEW.duration_min IS NOT DISTINCT FROM OLD.duration_min AND NEW.modality IS NOT DISTINCT FROM OLD.modality THEN RETURN NEW; END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text,0));
 IF NEW.starts_at <= now() OR NEW.duration_min < 1 OR NEW.duration_min > 480 OR NEW.modality NOT IN ('online','presencial') THEN RAISE EXCEPTION 'Informe horário futuro, duração e modalidade válidos'; END IF;
 IF EXISTS (SELECT 1 FROM public.availability_slots a WHERE a.user_id=NEW.user_id AND a.id<>NEW.id AND NOT a.booked AND a.starts_at < NEW.starts_at+make_interval(mins=>NEW.duration_min) AND a.starts_at+make_interval(mins=>a.duration_min)>NEW.starts_at)
 OR EXISTS (SELECT 1 FROM public.sessions s WHERE s.user_id=NEW.user_id AND s.status<>'Cancelada' AND s.starts_at < NEW.starts_at+make_interval(mins=>NEW.duration_min) AND s.starts_at+make_interval(mins=>s.duration_min)>NEW.starts_at)
 THEN RAISE EXCEPTION 'Este período já contém um horário aberto ou uma consulta'; END IF;
 RETURN NEW;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='availability_slots_session_id_fkey') THEN
    ALTER TABLE public.availability_slots
      ADD CONSTRAINT availability_slots_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.release_booked_slot() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  UPDATE public.availability_slots SET booked=false, session_id=NULL WHERE session_id=OLD.id AND booked=true;
  RETURN OLD;
 END IF;
 IF NEW.status='Cancelada' AND OLD.status IS DISTINCT FROM 'Cancelada' THEN
  UPDATE public.availability_slots SET booked=false, session_id=NULL WHERE session_id=NEW.id AND booked=true;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS release_slot_on_session_change ON public.sessions;
CREATE TRIGGER release_slot_on_session_change AFTER UPDATE OF status OR DELETE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.release_booked_slot();

-- ============================================================================
-- 6. LOW: has_role let anyone probe any user's role. Keep the signature/grants
--    (RLS policies call it as-is) but only reveal real answers for yourself,
--    or for anyone if the caller is already an admin.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
 IF _user_id IS DISTINCT FROM auth.uid() AND NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=auth.uid() AND role='admin') THEN
  RETURN false;
 END IF;
 RETURN EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
END $$;

-- ============================================================================
-- 7. LOW: admin auto-bootstrap must wait for email confirmation.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.assign_admin_role() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new.email_confirmed_at IS NOT NULL AND lower(new.email) = 'mateus.orezende@gmail.com' THEN
    INSERT INTO public.user_roles(user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING;
  END IF;
  RETURN new;
END $$;
DROP TRIGGER IF EXISTS on_auth_user_admin ON auth.users;
CREATE TRIGGER on_auth_user_admin AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_admin_role();

-- ============================================================================
-- 8. LOW: subscriptions are self-service (no payment gateway yet), so don't
--    revoke insert/update -- instead stop a user from ever claiming a paid
--    plan is "ativa" without going through payment (still none exists today).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.guard_subscription() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Dono não pode ser alterado'; END IF;
 IF NOT public.has_role(auth.uid(),'admin') THEN
  IF NEW.price < 0 THEN RAISE EXCEPTION 'Valor inválido'; END IF;
  IF NEW.price = 0 THEN
   IF NEW.status NOT IN ('ativa') THEN RAISE EXCEPTION 'Status inválido para plano gratuito'; END IF;
  ELSE
   IF NEW.status NOT IN ('trial','cancelada') THEN RAISE EXCEPTION 'Pagamento ainda não confirmado: apenas período de teste é permitido'; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS subscription_guard ON public.subscriptions;
CREATE TRIGGER subscription_guard BEFORE INSERT OR UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.guard_subscription();

-- ============================================================================
-- 9. LOW: bot tokens never expired and had no usage tracking.
-- ============================================================================
ALTER TABLE public.bot_tokens ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT now() + interval '180 days';
ALTER TABLE public.bot_tokens ADD COLUMN IF NOT EXISTS last_used_at timestamptz;

-- ============================================================================
-- 10. HIGH: the calendar worker's "oldest 100 jobs" window could fill up with
--     already-synced rows and starve new/pending jobs forever. Filter pending
--     jobs in SQL instead of fetching-then-filtering in JS.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_pending_calendar_jobs(_user_id uuid, _limit integer DEFAULT 200)
RETURNS SETOF public.calendar_sync_jobs LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT * FROM public.calendar_sync_jobs WHERE user_id=_user_id AND version<>synced_version ORDER BY updated_at LIMIT _limit
$$;
REVOKE ALL ON FUNCTION public.get_pending_calendar_jobs(uuid,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_calendar_jobs(uuid,integer) TO service_role;

-- ============================================================================
-- 10b. MEDIUM: every session/connection change woke the worker to resync ALL
--      connected users sequentially. Pass along which user actually changed
--      so the worker can target just that user (falling back to a full scan
--      only for callers that don't pass user_id, e.g. a future cron tick).
-- ============================================================================
CREATE OR REPLACE FUNCTION public.wake_calendar_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE config public.calendar_worker_secret; target_user uuid;
BEGIN
 IF TG_TABLE_NAME='calendar_sync_jobs' AND TG_OP='UPDATE' AND NEW.version=OLD.version THEN RETURN NEW; END IF;
 SELECT * INTO config FROM public.calendar_worker_secret WHERE id=1;
 IF config.endpoint IS NOT NULL THEN
  target_user := coalesce(NEW.user_id, OLD.user_id);
  PERFORM net.http_post(url:=config.endpoint,headers:=jsonb_build_object('Content-Type','application/json','X-Calendar-Worker',config.secret),body:=jsonb_build_object('action','worker','user_id',target_user));
 END IF;
 RETURN NEW;
END $$;

-- ============================================================================
-- 11. MEDIUM: Google Calendar OAuth "complete" step had no state/CSRF binding
--     to the user who started the flow. Short-lived, single-use state table.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.calendar_oauth_states (
  state uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '10 minutes'
);
GRANT ALL ON public.calendar_oauth_states TO service_role;
ALTER TABLE public.calendar_oauth_states ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 12. Used by the session-charge trigger above for a professional's local day;
--     also exposed so the frontend can stop guessing the timezone from UTC.
-- ============================================================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Sao_Paulo';

-- ============================================================================
-- 13. HIGH: AI-generated session reports had no professional-review gate --
--     an AI draft could be exported and filed without anyone confirming it
--     was read. Track review state; the frontend must require it before export.
-- ============================================================================
ALTER TABLE public.session_recordings ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.session_recordings ADD COLUMN IF NOT EXISTS reviewed_by uuid;
