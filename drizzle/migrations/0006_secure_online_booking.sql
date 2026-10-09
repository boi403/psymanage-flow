GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_slots, public.sessions, public.patients TO authenticated;
GRANT ALL ON public.availability_slots, public.sessions, public.patients TO service_role;
REVOKE SELECT ON public.availability_slots FROM anon;
ALTER POLICY "public sees open slots" ON public.availability_slots TO anon;

CREATE OR REPLACE FUNCTION public.public_available_slots(_user_id uuid)
RETURNS TABLE(id uuid, starts_at timestamptz, duration_min integer, modality text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
 SELECT a.id, a.starts_at, a.duration_min, a.modality
 FROM public.availability_slots a
 WHERE a.user_id = _user_id AND NOT a.booked AND a.starts_at > now()
 AND NOT EXISTS (SELECT 1 FROM public.sessions s WHERE s.user_id=a.user_id AND s.status <> 'Cancelada'
 AND s.starts_at < a.starts_at + make_interval(mins => a.duration_min)
 AND s.starts_at + make_interval(mins => s.duration_min) > a.starts_at)
 ORDER BY a.starts_at
$$;
REVOKE ALL ON FUNCTION public.public_available_slots(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.public_available_slots(uuid) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.guard_booking_availability()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Dono não pode ser alterado'; END IF;
  IF OLD.booked AND (NEW.starts_at IS DISTINCT FROM OLD.starts_at OR NEW.duration_min IS DISTINCT FROM OLD.duration_min OR NEW.modality IS DISTINCT FROM OLD.modality OR NOT NEW.booked) THEN RAISE EXCEPTION 'Horário reservado não pode ser alterado'; END IF;
  IF NEW.starts_at IS NOT DISTINCT FROM OLD.starts_at AND NEW.duration_min IS NOT DISTINCT FROM OLD.duration_min AND NEW.modality IS NOT DISTINCT FROM OLD.modality THEN RETURN NEW; END IF;
 END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text,0));
 IF NEW.starts_at <= now() OR NEW.duration_min < 1 OR NEW.duration_min > 480 OR NEW.modality NOT IN ('online','presencial') THEN RAISE EXCEPTION 'Informe horário futuro, duração e modalidade válidos'; END IF;
 IF EXISTS (SELECT 1 FROM public.availability_slots a WHERE a.user_id=NEW.user_id AND a.id<>NEW.id AND NOT a.booked AND a.starts_at < NEW.starts_at+make_interval(mins=>NEW.duration_min) AND a.starts_at+make_interval(mins=>a.duration_min)>NEW.starts_at)
 OR EXISTS (SELECT 1 FROM public.sessions s WHERE s.user_id=NEW.user_id AND s.status<>'Cancelada' AND s.starts_at < NEW.starts_at+make_interval(mins=>NEW.duration_min) AND s.starts_at+make_interval(mins=>s.duration_min)>NEW.starts_at)
 THEN RAISE EXCEPTION 'Este período já contém um horário aberto ou uma consulta'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER booking_availability_guard BEFORE INSERT OR UPDATE ON public.availability_slots FOR EACH ROW EXECUTE FUNCTION public.guard_booking_availability();

CREATE OR REPLACE FUNCTION public.guard_session_booking()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN RAISE EXCEPTION 'Dono não pode ser alterado'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(NEW.user_id::text,0));
 IF NOT EXISTS (SELECT 1 FROM public.patients WHERE id=NEW.patient_id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Paciente de outra conta'; END IF;
 IF NEW.duration_min < 1 OR NEW.duration_min > 480 THEN RAISE EXCEPTION 'Duração inválida'; END IF;
 IF NEW.status<>'Cancelada' AND EXISTS (SELECT 1 FROM public.sessions s WHERE s.user_id=NEW.user_id AND s.id<>NEW.id AND s.status<>'Cancelada' AND s.starts_at < NEW.starts_at+make_interval(mins=>NEW.duration_min) AND s.starts_at+make_interval(mins=>s.duration_min)>NEW.starts_at) THEN RAISE EXCEPTION 'Já existe uma consulta neste período'; END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER session_booking_guard BEFORE INSERT OR UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.guard_session_booking();

CREATE OR REPLACE FUNCTION public.book_slot(_slot_id uuid, _name text, _phone text, _email text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.availability_slots; owner_id uuid; pid uuid; sid uuid; price numeric; phone_digits text;
BEGIN
 phone_digits := regexp_replace(coalesce(_phone,''),'[^0-9]','','g');
 IF coalesce(trim(_name),'')='' OR length(_name)>120 OR length(coalesce(_phone,''))>30 OR length(phone_digits) NOT BETWEEN 10 AND 15 OR coalesce(_phone,'') !~ '^[+0-9 ().-]+$' OR length(coalesce(_email,''))>160 OR (coalesce(trim(_email),'')<>'' AND trim(_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION 'Informe nome, WhatsApp com DDD e e-mail válidos'; END IF;
 SELECT user_id INTO owner_id FROM public.availability_slots WHERE id=_slot_id;
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Horário indisponível'; END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(owner_id::text,0));
 SELECT * INTO s FROM public.availability_slots WHERE id=_slot_id FOR UPDATE;
 IF s.id IS NULL OR s.booked OR s.starts_at<=now() THEN RAISE EXCEPTION 'Horário indisponível'; END IF;
 IF EXISTS (SELECT 1 FROM public.sessions x WHERE x.user_id=s.user_id AND x.status<>'Cancelada' AND x.starts_at < s.starts_at+make_interval(mins=>s.duration_min) AND x.starts_at+make_interval(mins=>x.duration_min)>s.starts_at) THEN RAISE EXCEPTION 'Horário indisponível'; END IF;
 SELECT id,session_price INTO pid,price FROM public.patients WHERE user_id=s.user_id AND regexp_replace(coalesce(phone,''),'[^0-9]','','g')=phone_digits AND lower(trim(name))=lower(trim(_name)) ORDER BY created_at LIMIT 1;
 IF pid IS NULL THEN
  SELECT default_session_price INTO price FROM public.profiles WHERE id=s.user_id;
  INSERT INTO public.patients(user_id,name,phone,email,status,modality,session_price)
  VALUES(s.user_id,trim(_name),phone_digits,nullif(trim(_email),''),'Ativo',CASE WHEN s.modality='online' THEN 'Online' ELSE 'Presencial' END,coalesce(price,0)) RETURNING id INTO pid;
 END IF;
 INSERT INTO public.sessions(user_id,patient_id,starts_at,duration_min,modality,price,status) VALUES(s.user_id,pid,s.starts_at,s.duration_min,s.modality,coalesce(price,0),'Agendada') RETURNING id INTO sid;
 UPDATE public.availability_slots SET booked=true,session_id=sid WHERE id=s.id;
 RETURN s.starts_at;
END $$;
REVOKE ALL ON FUNCTION public.book_slot(uuid,text,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.book_slot(uuid,text,text,text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.public_professional(uuid) TO anon, authenticated, service_role;