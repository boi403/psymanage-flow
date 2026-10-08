ALTER TABLE public.patients ADD COLUMN modality text NOT NULL DEFAULT 'Online', ADD COLUMN billing_mode text NOT NULL DEFAULT 'por sessão', ADD COLUMN due_day integer NOT NULL DEFAULT 10;
ALTER TABLE public.profiles ADD COLUMN city text, ADD COLUMN default_session_price numeric NOT NULL DEFAULT 0, ADD COLUMN approach_templates jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.patient_records ADD COLUMN sequence_no integer, ADD COLUMN clinical_sections jsonb NOT NULL DEFAULT '{}'::jsonb, ADD COLUMN approved boolean NOT NULL DEFAULT false;
UPDATE public.patient_records r SET sequence_no = n.seq FROM (SELECT id, row_number() OVER (PARTITION BY patient_id ORDER BY created_at,id)::integer seq FROM public.patient_records) n WHERE r.id=n.id;
CREATE UNIQUE INDEX patient_record_sequence ON public.patient_records(patient_id,sequence_no);
ALTER TABLE public.transactions ADD COLUMN paid_at date, ADD COLUMN version integer NOT NULL DEFAULT 1;
UPDATE public.transactions SET paid_at=due_date WHERE status='Pago';
CREATE TABLE public.financial_audit(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, transaction_id uuid NOT NULL, operation text NOT NULL, before_snapshot jsonb, after_snapshot jsonb, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT ON public.financial_audit TO authenticated;
GRANT ALL ON public.financial_audit TO service_role;
ALTER TABLE public.financial_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_audit ON public.financial_audit FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.psychological_documents(id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL DEFAULT auth.uid(), patient_id uuid NOT NULL REFERENCES public.patients(id), kind text NOT NULL DEFAULT 'Declaração', title text NOT NULL, content text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'rascunho', source_id uuid REFERENCES public.psychological_documents(id), finalized_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,UPDATE,DELETE ON public.psychological_documents TO authenticated;
GRANT ALL ON public.psychological_documents TO service_role;
ALTER TABLE public.psychological_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_documents ON public.psychological_documents FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE FUNCTION public.guard_clinical_record() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
DECLARE owner uuid;
BEGIN
 SELECT user_id INTO owner FROM public.patients WHERE id=NEW.patient_id FOR UPDATE;
 IF owner IS DISTINCT FROM NEW.user_id THEN RAISE EXCEPTION 'Paciente de outra conta'; END IF;
 IF TG_OP='INSERT' THEN SELECT coalesce(max(sequence_no),0)+1 INTO NEW.sequence_no FROM public.patient_records WHERE patient_id=NEW.patient_id;
 ELSIF NEW.sequence_no IS DISTINCT FROM OLD.sequence_no OR NEW.patient_id IS DISTINCT FROM OLD.patient_id OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Identificação da evolução não pode ser alterada'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER clinical_record_guard BEFORE INSERT OR UPDATE ON public.patient_records FOR EACH ROW EXECUTE FUNCTION public.guard_clinical_record();
CREATE FUNCTION public.guard_psychological_document() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP IN ('UPDATE','DELETE') AND OLD.status='final' THEN RAISE EXCEPTION 'Documento final é imutável; duplique para nova versão'; END IF;
 IF TG_OP='DELETE' THEN RETURN OLD; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.patients WHERE id=NEW.patient_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Paciente de outra conta'; END IF;
 IF NEW.status NOT IN ('rascunho','final') THEN RAISE EXCEPTION 'Status inválido'; END IF;
 IF NEW.kind NOT IN ('Declaração','Atestado','Relatório','Laudo','Parecer') THEN RAISE EXCEPTION 'Tipo inválido'; END IF;
 IF NEW.status='final' THEN
  IF length(trim(NEW.content))=0 THEN RAISE EXCEPTION 'Documento vazio'; END IF;
  NEW.finalized_at=now();
 ELSE NEW.finalized_at=NULL; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER psychological_document_guard BEFORE INSERT OR UPDATE OR DELETE ON public.psychological_documents FOR EACH ROW EXECUTE FUNCTION public.guard_psychological_document();
CREATE FUNCTION public.guard_financial_transaction() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN
  IF OLD.receipt_issued THEN RAISE EXCEPTION 'Recibo fiscal emitido: exclusão bloqueada'; END IF;
  RETURN OLD;
 END IF;
 IF TG_OP='UPDATE' THEN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Dono não pode ser alterado'; END IF;
  IF OLD.receipt_issued AND ((to_jsonb(NEW)-'receipt_issued'-'version') IS DISTINCT FROM (to_jsonb(OLD)-'receipt_issued'-'version')) THEN RAISE EXCEPTION 'Recibo fiscal emitido: alteração bloqueada'; END IF;
  IF OLD.receipt_issued AND NEW.receipt_issued=false AND ((to_jsonb(NEW)-'receipt_issued'-'version') IS DISTINCT FROM (to_jsonb(OLD)-'receipt_issued'-'version')) THEN RAISE EXCEPTION 'Desmarque o recibo antes de editar'; END IF;
  NEW.version=OLD.version+1;
 END IF;
 IF NEW.patient_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.patients WHERE id=NEW.patient_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Paciente de outra conta'; END IF;
 IF NEW.receipt_issued AND (NEW.status<>'Pago' OR NEW.type<>'receita') THEN RAISE EXCEPTION 'Recibo exige receita recebida'; END IF;
 IF NEW.amount<=0 THEN RAISE EXCEPTION 'Valor deve ser positivo'; END IF;
 IF NEW.status='Pago' THEN NEW.paid_at=coalesce(NEW.paid_at,current_date); ELSE NEW.paid_at=NULL; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER financial_transaction_guard BEFORE INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.guard_financial_transaction();
CREATE FUNCTION public.audit_financial_transaction() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 INSERT INTO public.financial_audit(user_id,transaction_id,operation,before_snapshot,after_snapshot) VALUES(coalesce(NEW.user_id,OLD.user_id),coalesce(NEW.id,OLD.id),TG_OP,CASE WHEN TG_OP='INSERT' THEN NULL ELSE to_jsonb(OLD) END,CASE WHEN TG_OP='DELETE' THEN NULL ELSE to_jsonb(NEW) END);
 RETURN coalesce(NEW,OLD);
END $$;
CREATE TRIGGER financial_transaction_audit AFTER INSERT OR UPDATE OR DELETE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.audit_financial_transaction();
CREATE FUNCTION public.settle_transactions(_ids uuid[],_paid boolean) RETURNS integer LANGUAGE plpgsql SECURITY INVOKER SET search_path=public AS $$
DECLARE n integer;
BEGIN
 IF auth.uid() IS NULL OR coalesce(array_length(_ids,1),0)=0 OR array_length(_ids,1)>200 THEN RAISE EXCEPTION 'Seleção inválida'; END IF;
 PERFORM id FROM public.transactions WHERE id=ANY(_ids) AND user_id=auth.uid() ORDER BY id FOR UPDATE;
 SELECT count(*) INTO n FROM public.transactions WHERE id=ANY(_ids) AND user_id=auth.uid();
 IF n<>(SELECT count(DISTINCT x) FROM unnest(_ids) x) THEN RAISE EXCEPTION 'Lançamento não encontrado'; END IF;
 IF EXISTS(SELECT 1 FROM public.transactions WHERE id=ANY(_ids) AND receipt_issued) THEN RAISE EXCEPTION 'Seleção contém recibo fiscal emitido'; END IF;
 UPDATE public.transactions SET status=CASE WHEN _paid THEN 'Pago' ELSE 'Pendente' END,paid_at=CASE WHEN _paid THEN current_date ELSE NULL END WHERE id=ANY(_ids) AND user_id=auth.uid();
 RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.settle_transactions(uuid[],boolean) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.settle_transactions(uuid[],boolean) TO authenticated;