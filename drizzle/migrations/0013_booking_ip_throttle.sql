-- Follow-up to the 2026-10-24 audit: migration 0010 already added a per-owner,
-- per-phone booking cooldown (F-05/F-10), but its own comment flags the gap the
-- audit re-found -- a scripted sweep that sends a *different* fake phone number
-- on every call never reuses a cooldown bucket, so it sails through untouched.
-- Add a second, IP-scoped throttle that catches exactly that case: the phone
-- number changes every call, but a single scripted source usually doesn't.
--
-- Caveat (documented, not silently assumed away): this reads the client IP from
-- the `x-forwarded-for` header PostgREST exposes via current_setting('request.headers').
-- We take the LAST comma-separated entry, on the assumption that Supabase's own
-- edge/gateway appends the real connecting IP as the final hop while anything
-- earlier in the list is caller-supplied and spoofable. If that assumption is
-- ever wrong for this project's specific network path, this throttle degrades
-- to "all callers share one bucket" -- a nuisance, not a hole, since the
-- per-phone cooldown above still applies independently. It is defense in depth,
-- not a replacement for a CAPTCHA, which remains the stronger mitigation if
-- abuse continues (same conclusion migration 0010 already reached).
CREATE TABLE IF NOT EXISTS public.booking_ip_throttle (
  ip text PRIMARY KEY,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 1
);
ALTER TABLE public.booking_ip_throttle ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.booking_ip_throttle FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.booking_ip_throttle TO service_role;

CREATE OR REPLACE FUNCTION public.book_slot(_slot_id uuid, _name text, _phone text, _email text, _consent boolean DEFAULT false)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- NOTE: the scalar variable is named v_phone_digits (not phone_digits) on purpose --
-- public.booking_cooldown has a column literally named phone_digits, and plpgsql
-- raises "ambiguous" for any bare reference once a same-named column is in scope.
DECLARE s public.availability_slots; owner_id uuid; pid uuid; sid uuid; price numeric; v_phone_digits text; cd_count integer; cd_start timestamptz; xff text; xff_parts text[]; req_ip text; ip_count integer; ip_start timestamptz;
BEGIN
 v_phone_digits := regexp_replace(coalesce(_phone,''),'[^0-9]','','g');
 IF coalesce(trim(_name),'')='' OR length(_name)>120 OR length(coalesce(_phone,''))>30 OR length(v_phone_digits) NOT BETWEEN 10 AND 15 OR coalesce(_phone,'') !~ '^[+0-9 ().-]+$' OR length(coalesce(_email,''))>160 OR (coalesce(trim(_email),'')<>'' AND trim(_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') THEN RAISE EXCEPTION 'Informe nome, WhatsApp com DDD e e-mail válidos'; END IF;
 IF NOT _consent THEN RAISE EXCEPTION 'É necessário concordar com o tratamento de dados para agendar'; END IF;
 SELECT user_id INTO owner_id FROM public.availability_slots WHERE id=_slot_id;
 IF owner_id IS NULL THEN RAISE EXCEPTION 'Horário indisponível'; END IF;

 -- IP throttle: at most 8 booking attempts per 10 minutes from the same
 -- source, across all professionals (see header comment above for the caveat
 -- on how the IP is derived). Runs before the per-phone cooldown so a sweep
 -- using random phone numbers still gets capped.
 xff := coalesce((current_setting('request.headers', true)::json)->>'x-forwarded-for', '');
 xff_parts := string_to_array(xff, ',');
 req_ip := coalesce(nullif(trim(xff_parts[array_length(xff_parts,1)]),''), 'unknown');
 SELECT bt.count, bt.window_start INTO ip_count, ip_start FROM public.booking_ip_throttle bt WHERE bt.ip=req_ip FOR UPDATE;
 IF ip_start IS NULL THEN
  INSERT INTO public.booking_ip_throttle(ip,window_start,count) VALUES(req_ip,now(),1) ON CONFLICT (ip) DO UPDATE SET window_start=now(), count=1;
 ELSIF ip_start < now() - interval '10 minutes' THEN
  UPDATE public.booking_ip_throttle bt SET window_start=now(), count=1 WHERE bt.ip=req_ip;
 ELSE
  IF ip_count >= 8 THEN RAISE EXCEPTION 'Muitas tentativas de agendamento. Aguarde alguns minutos e tente novamente.'; END IF;
  UPDATE public.booking_ip_throttle bt SET count=bt.count+1 WHERE bt.ip=req_ip;
 END IF;

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
 -- Known accepted risk (2026-10-24 audit): an existing patient is matched by
 -- name+phone alone, with no OTP/e-mail verification. Anyone who already knows
 -- a patient's full name and phone number can book a session "as" them through
 -- this public form. Documented and accepted for this business model rather
 -- than fixed -- do not "fix" this without a product decision first.
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
