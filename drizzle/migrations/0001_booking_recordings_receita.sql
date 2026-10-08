ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS payer_cpf text, ADD COLUMN IF NOT EXISTS receipt_opt_in boolean NOT NULL DEFAULT true;
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_issued boolean NOT NULL DEFAULT false;

CREATE TABLE public.availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  starts_at timestamptz NOT NULL,
  duration_min int NOT NULL DEFAULT 50,
  modality text NOT NULL DEFAULT 'online',
  booked boolean NOT NULL DEFAULT false,
  session_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.availability_slots TO authenticated;
GRANT SELECT ON public.availability_slots TO anon;
GRANT ALL ON public.availability_slots TO service_role;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages slots" ON public.availability_slots FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "public sees open slots" ON public.availability_slots FOR SELECT TO anon, authenticated USING (booked = false AND starts_at > now());

CREATE TABLE public.session_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'audio',
  media_path text,
  audio_path text NOT NULL,
  transcript text,
  report jsonb,
  status text NOT NULL DEFAULT 'gravado',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_recordings TO authenticated;
GRANT ALL ON public.session_recordings TO service_role;
ALTER TABLE public.session_recordings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages recordings" ON public.session_recordings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.public_professional(_user_id uuid)
RETURNS TABLE(full_name text, specialty text, crp text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT full_name, specialty, crp FROM public.profiles WHERE id = _user_id
$$;
GRANT EXECUTE ON FUNCTION public.public_professional(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.book_slot(_slot_id uuid, _name text, _phone text, _email text)
RETURNS timestamptz
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE s public.availability_slots; pid uuid; sid uuid; price numeric;
BEGIN
  IF coalesce(trim(_name),'') = '' OR length(_name) > 120 OR coalesce(trim(_phone),'') = '' OR length(_phone) > 30 THEN
    RAISE EXCEPTION 'Informe nome e telefone válidos';
  END IF;
  SELECT * INTO s FROM public.availability_slots WHERE id = _slot_id FOR UPDATE;
  IF s.id IS NULL OR s.booked OR s.starts_at <= now() THEN RAISE EXCEPTION 'Horário indisponível'; END IF;
  SELECT id, session_price INTO pid, price FROM public.patients WHERE user_id = s.user_id AND phone = _phone LIMIT 1;
  IF pid IS NULL THEN
    INSERT INTO public.patients(user_id, name, phone, email, status) VALUES (s.user_id, left(_name,120), left(_phone,30), nullif(left(_email,160),''), 'Novo') RETURNING id, session_price INTO pid, price;
  END IF;
  INSERT INTO public.sessions(user_id, patient_id, starts_at, duration_min, modality, price)
  VALUES (s.user_id, pid, s.starts_at, s.duration_min, s.modality, coalesce(price,0)) RETURNING id INTO sid;
  UPDATE public.availability_slots SET booked = true, session_id = sid WHERE id = s.id;
  RETURN s.starts_at;
END $$;
GRANT EXECUTE ON FUNCTION public.book_slot(uuid, text, text, text) TO anon, authenticated;

CREATE POLICY "own recordings read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own recordings insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own recordings delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'recordings' AND (storage.foldername(name))[1] = auth.uid()::text);