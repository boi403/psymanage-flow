CREATE TABLE public.signup_invites(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),code uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),email text,created_by uuid NOT NULL DEFAULT auth.uid(),used_by uuid,expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days',created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,DELETE ON public.signup_invites TO authenticated; GRANT ALL ON public.signup_invites TO service_role;
ALTER TABLE public.signup_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY admin_invites ON public.signup_invites FOR ALL TO authenticated USING(public.has_role(auth.uid(),'admin')) WITH CHECK(public.has_role(auth.uid(),'admin'));
CREATE TABLE public.telegram_links(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL DEFAULT auth.uid(),patient_id uuid NOT NULL REFERENCES public.patients(id),code uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),expires_at timestamptz NOT NULL DEFAULT now()+interval '15 minutes',used_at timestamptz,created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,INSERT,DELETE ON public.telegram_links TO authenticated; GRANT ALL ON public.telegram_links TO service_role;
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_link ON public.telegram_links FOR ALL TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid() AND expires_at<=now()+interval '15 minutes' AND used_at IS NULL AND EXISTS(SELECT 1 FROM public.patients p WHERE p.id=patient_id AND p.user_id=auth.uid()));
ALTER TABLE public.patients ADD COLUMN telegram_chat_id text;
CREATE TABLE public.bot_tokens(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),user_id uuid NOT NULL DEFAULT auth.uid(),token_hash text NOT NULL UNIQUE,label text NOT NULL DEFAULT 'Bot',created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT,DELETE ON public.bot_tokens TO authenticated; GRANT ALL ON public.bot_tokens TO service_role;
ALTER TABLE public.bot_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY owner_bot ON public.bot_tokens FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE POLICY owner_delete_bot ON public.bot_tokens FOR DELETE TO authenticated USING(user_id=auth.uid());
CREATE FUNCTION public.bot_operation(_owner uuid,_action text,_code uuid DEFAULT NULL,_chat text DEFAULT NULL,_patient uuid DEFAULT NULL,_content text DEFAULT NULL,_count integer DEFAULT NULL,_amount numeric DEFAULT NULL) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE l public.telegram_links; p public.patients; t public.transactions; ids uuid[]='{}'; total numeric=0; n integer=0;
BEGIN
IF _action='link' THEN
 SELECT * INTO l FROM public.telegram_links WHERE code=_code AND user_id=_owner FOR UPDATE;
 IF l.id IS NULL OR l.used_at IS NOT NULL OR l.expires_at<=now() OR coalesce(_chat,'')='' THEN RAISE EXCEPTION 'Código inválido ou expirado'; END IF;
 UPDATE public.patients SET telegram_chat_id=_chat WHERE id=l.patient_id AND user_id=_owner RETURNING * INTO p;
 IF p.id IS NULL THEN RAISE EXCEPTION 'Paciente não encontrado'; END IF;
 UPDATE public.telegram_links SET used_at=now() WHERE id=l.id;
 RETURN jsonb_build_object('patient_id',p.id);
END IF;
SELECT * INTO p FROM public.patients WHERE user_id=_owner AND ((_patient IS NOT NULL AND id=_patient) OR (_patient IS NULL AND telegram_chat_id=_chat)) LIMIT 1 FOR UPDATE;
IF p.id IS NULL THEN RAISE EXCEPTION 'Paciente não encontrado'; END IF;
IF _action='record' THEN
 IF coalesce(trim(_content),'')='' OR length(_content)>60000 THEN RAISE EXCEPTION 'Registro inválido'; END IF;
 INSERT INTO public.patient_records(user_id,patient_id,content) VALUES(_owner,p.id,_content);
 RETURN jsonb_build_object('registered',true);
ELSIF _action='pending' THEN
 RETURN jsonb_build_object('patient_id',p.id,'pending',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'amount',amount,'due_date',due_date) ORDER BY due_date,created_at,id) FROM public.transactions WHERE user_id=_owner AND patient_id=p.id AND type='receita' AND status='Pendente'),'[]'::jsonb));
ELSIF _action='settle' THEN
 IF (_count IS NULL)=(_amount IS NULL) OR (_count IS NOT NULL AND (_count<1 OR _count>200)) OR (_amount IS NOT NULL AND _amount<=0) THEN RAISE EXCEPTION 'Informe quantidade ou valor positivo'; END IF;
 FOR t IN SELECT * FROM public.transactions WHERE user_id=_owner AND patient_id=p.id AND type='receita' AND status='Pendente' ORDER BY due_date,created_at,id FOR UPDATE LOOP
  IF t.receipt_issued THEN RAISE EXCEPTION 'Recibo fiscal emitido'; END IF;
  IF (_count IS NOT NULL AND n=_count) OR (_amount IS NOT NULL AND total=_amount) THEN EXIT; END IF;
  IF _amount IS NOT NULL AND total+t.amount>_amount THEN RAISE EXCEPTION 'Valor não corresponde a lançamentos completos'; END IF;
  ids=array_append(ids,t.id);total=total+t.amount;n=n+1;
  IF n>200 THEN RAISE EXCEPTION 'Limite de 200 lançamentos'; END IF;
 END LOOP;
 IF (_count IS NOT NULL AND n<>_count) OR (_amount IS NOT NULL AND total<>_amount) THEN RAISE EXCEPTION 'Pendências insuficientes ou valor incompatível'; END IF;
 UPDATE public.transactions SET status='Pago',paid_at=current_date WHERE id=ANY(ids) AND user_id=_owner;
 RETURN jsonb_build_object('settled',n,'amount',total);
END IF;
RAISE EXCEPTION 'Ação inválida';
END $$;
REVOKE ALL ON FUNCTION public.bot_operation(uuid,text,uuid,text,uuid,text,integer,numeric) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bot_operation(uuid,text,uuid,text,uuid,text,integer,numeric) TO service_role;
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE i public.signup_invites;
BEGIN
IF coalesce(new.raw_user_meta_data->>'invite_code','')<>'' THEN
 SELECT * INTO i FROM public.signup_invites WHERE code::text=new.raw_user_meta_data->>'invite_code' FOR UPDATE;
 IF i.id IS NULL OR i.used_by IS NOT NULL OR i.expires_at<=now() OR (i.email IS NOT NULL AND lower(i.email)<>lower(new.email)) THEN RAISE EXCEPTION 'Convite inválido, expirado ou destinado a outro e-mail'; END IF;
 UPDATE public.signup_invites SET used_by=new.id WHERE id=i.id;
END IF;
insert into public.profiles (id, full_name, crp, specialty, phone, email) values (new.id, new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'crp',new.raw_user_meta_data->>'specialty',new.raw_user_meta_data->>'phone',new.email);
RETURN new;
END $$;