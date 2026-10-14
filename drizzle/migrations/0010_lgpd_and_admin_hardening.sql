-- Follow-up fixes from the 2026-10-14 external security/LGPD report (F-02, F-04, F-05, F-09, F-10, F-14).
-- F-01/F-02(partial)/F-03/F-06/F-08/F-11/F-12/F-13 are addressed elsewhere (migration 0009, edge
-- functions, or frontend-only changes) or deliberately deferred -- see the chat summary for which.

-- ============================================================================
-- F-02: remove the e-mail-based admin auto-bootstrap entirely (account takeover
-- of that one Gmail address would otherwise grant instant admin on signup).
-- Promote the current admin manually, once, instead.
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_admin ON auth.users;
DROP FUNCTION IF EXISTS public.assign_admin_role();

INSERT INTO public.user_roles(user_id, role)
SELECT id, 'admin' FROM auth.users WHERE lower(email) = 'mateus.orezende@gmail.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- F-04: app_user_connections had RLS enabled but no SELECT policy at all, so a
-- future direct query against it (bypassing the calendar-connect edge function,
-- which is the only intended access path today) would silently return nothing
-- rather than fail loudly, which is confusing but not itself exploitable. Add
-- the missing owner-scoped policy so the table behaves like every other one.
-- ============================================================================
CREATE POLICY "own connections" ON public.app_user_connections FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================================================
-- F-05 + F-10: public booking hardening -- per-phone cooldown (anti-spam) and
-- recorded consent at the moment of booking. book_slot() keeps its existing
-- 4-argument call sites working ("_consent" defaults to false, which the
-- function then rejects with a clear message, rather than silently treating
-- old callers as consenting).
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.booking_cooldown (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  phone_digits text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, phone_digits)
);
GRANT ALL ON public.booking_cooldown TO service_role;
ALTER TABLE public.booking_cooldown ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS booking_consent_at timestamptz;

CREATE OR REPLACE FUNCTION public.book_slot(_slot_id uuid, _name text, _phone text, _email text, _consent boolean DEFAULT false)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- NOTE: the scalar variable is named v_phone_digits (not phone_digits) on purpose --
-- public.booking_cooldown has a column literally named phone_digits, and plpgsql
-- raises "ambiguous" for any bare reference once a same-named column is in scope.
DECLARE s public.availability_slots; owner_id uuid; pid uuid; sid uuid; price numeric; v_phone_digits text; cd_count integer; cd_start timestamptz;
BEGIN
 v_phone_digits := regexp_replace(coalesce(_phone,''),'[^0-9]','','g');
 IF coalesce(trim(_name),'')='' OR length(_name)>120 OR length(coalesce(_phone,''))>30 OR length(v_phone_digits) NOT BETWEEN 10 AND 15 OR coalesce(_phone,'') !~ '^[+0-9 ().-]+$' OR length(coalesce(_email,''))>160 OR (coalesce(trim(_email),'')<>'' AND trim(_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION 'Informe nome, WhatsApp com DDD e e-mail válidos'; END IF;
 IF NOT _consent THEN RAISE EXCEPTION 'É necessário concordar com o tratamento de dados para agendar'; END IF;
 SELECT user_id INTO owner_id FROM public.availability_slots WHERE id=_slot_id;
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Horário indisponível'; END IF;

 -- Per-owner, per-phone cooldown: at most 5 booking attempts per hour. This
 -- doesn't require a CAPTCHA/third-party key, but also doesn't fully stop a
 -- distributed bot (one phone number per attempt); a CAPTCHA remains the
 -- stronger mitigation if abuse continues.
 SELECT bc.count, bc.window_start INTO cd_count, cd_start FROM public.booking_cooldown bc WHERE bc.user_id=owner_id AND bc.phone_digits=v_phone_digits FOR UPDATE;
 IF cd_start IS NULL THEN
  INSERT INTO public.booking_cooldown(user_id,phone_digits,window_start,count) VALUES(owner_id,v_phone_digits,now(),1);
 ELSIF cd_start < now() - interval '1 hour' THEN
  UPDATE public.booking_cooldown bc SET window_start=now(), count=1 WHERE bc.user_id=owner_id AND bc.phone_digits=v_phone_digits;
 ELSE
  IF cd_count >= 5 THEN RAISE EXCEPTION 'Muitas tentativas de agendamento com este telefone. Tente novamente mais tarde.'; END IF;
  UPDATE public.booking_cooldown bc SET count=bc.count+1 WHERE bc.user_id=owner_id AND bc.phone_digits=v_phone_digits;
 END IF;

 PERFORM pg_advisory_xact_lock(hashtextextended(owner_id::text,0));
 SELECT * INTO s FROM public.availability_slots WHERE id=_slot_id FOR UPDATE;
 IF s.id IS NULL OR s.booked OR s.starts_at<=now() THEN RAISE EXCEPTION 'Horário indisponível'; END IF;
 IF EXISTS (SELECT 1 FROM public.sessions x WHERE x.user_id=s.user_id AND x.status<>'Cancelada' AND x.starts_at < s.starts_at+make_interval(mins=>s.duration_min) AND x.starts_at+make_interval(mins=>x.duration_min)>s.starts_at) THEN RAISE EXCEPTION 'Horário indisponível'; END IF;
 SELECT id,session_price INTO pid,price FROM public.patients WHERE user_id=s.user_id AND regexp_replace(coalesce(phone,''),'[^0-9]','','g')=v_phone_digits AND lower(trim(name))=lower(trim(_name)) ORDER BY created_at LIMIT 1;
 IF pid IS NULL THEN
  SELECT default_session_price INTO price FROM public.profiles WHERE id=s.user_id;
  INSERT INTO public.patients(user_id,name,phone,email,status,modality,session_price,booking_consent_at)
  VALUES(s.user_id,trim(_name),v_phone_digits,nullif(trim(_email),''),'Ativo',CASE WHEN s.modality='online' THEN 'Online' ELSE 'Presencial' END,coalesce(price,0),now()) RETURNING id INTO pid;
 ELSE
  UPDATE public.patients SET booking_consent_at=now() WHERE id=pid;
 END IF;
 INSERT INTO public.sessions(user_id,patient_id,starts_at,duration_min,modality,price,status) VALUES(s.user_id,pid,s.starts_at,s.duration_min,s.modality,coalesce(price,0),'Agendada') RETURNING id INTO sid;
 UPDATE public.availability_slots SET booked=true,session_id=sid WHERE id=s.id;
 RETURN s.starts_at;
END $$;

-- ============================================================================
-- F-10 (recordings): the session-recording consent checkbox already exists in
-- the UI but was never persisted. Add a column for the frontend to write to.
-- ============================================================================
ALTER TABLE public.session_recordings ADD COLUMN IF NOT EXISTS consent_at timestamptz;

-- ============================================================================
-- F-09 (LGPD art. 15/16): technical infrastructure for the "right to erasure"
-- request, balanced against the professional's legal obligation (CFP) to keep
-- the clinical record itself. Anonymizes identifying fields on the patient row;
-- deliberately does NOT touch patient_records/sessions/session_recordings,
-- which must be retained for the mandatory record-keeping period -- that
-- retention window is a policy decision for you/your legal counsel, not
-- something this migration can decide on its own.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.anonymize_patient(_patient_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id=_patient_id AND user_id=auth.uid()) THEN RAISE EXCEPTION 'Paciente não encontrado'; END IF;
 UPDATE public.patients SET
  name = 'Paciente ' || substr(_patient_id::text,1,8),
  email = NULL, phone = '', cpf = NULL, payer_cpf = NULL, birth_date = NULL, notes = NULL, telegram_chat_id = NULL
 WHERE id=_patient_id;
END $$;
REVOKE ALL ON FUNCTION public.anonymize_patient(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.anonymize_patient(uuid) TO authenticated;

-- ============================================================================
-- F-14: cap the recordings bucket's max file size at the database level too,
-- matching the 24MB already enforced in the frontend and in session-report.
-- No-op (0 rows updated) if the bucket hasn't been created yet.
-- ============================================================================
UPDATE storage.buckets SET file_size_limit = 25165824 WHERE id = 'recordings';
