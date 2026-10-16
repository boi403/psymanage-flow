-- MVP course catalog ("Especializações"): a real catalog + waitlist, not the
-- hardcoded fake courses that used to be in SpecializationsSection.tsx.
-- Scope deliberately excludes payment and video hosting for now (confirmed
-- with the user) -- "Inscrever-se" registers interest (course_interest),
-- it does not charge or grant access to content. Any professional can
-- propose a course; it stays pending until an admin approves it.

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  hours integer,
  level text NOT NULL DEFAULT 'Básico',
  price numeric(10,2), -- informational only for now; no payment flow yet
  status text NOT NULL DEFAULT 'pendente',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ADD CONSTRAINT courses_level_check CHECK (level IN ('Básico','Intermediário','Avançado'));
ALTER TABLE public.courses ADD CONSTRAINT courses_status_check CHECK (status IN ('pendente','aprovado','rejeitado'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT ON public.courses TO anon;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public sees approved courses" ON public.courses FOR SELECT TO anon, authenticated USING (status = 'aprovado');
CREATE POLICY "instructor sees own courses" ON public.courses FOR SELECT TO authenticated USING (instructor_id = auth.uid());
CREATE POLICY "admin sees all courses" ON public.courses FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "authenticated proposes course" ON public.courses FOR INSERT TO authenticated WITH CHECK (instructor_id = auth.uid());
CREATE POLICY "instructor or admin updates course" ON public.courses FOR UPDATE TO authenticated
  USING (instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (instructor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "instructor deletes own pending course or admin deletes any" ON public.courses FOR DELETE TO authenticated
  USING ((instructor_id = auth.uid() AND status = 'pendente') OR public.has_role(auth.uid(), 'admin'));

-- Prevents self-approval and editing after a decision has been made: an
-- instructor can tweak their own proposal while it's still "pendente", but
-- once an admin approves/rejects it, only an admin can change it further.
CREATE FUNCTION public.guard_course() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF TG_OP = 'INSERT' THEN
  IF NEW.instructor_id IS DISTINCT FROM auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
   RAISE EXCEPTION 'Instrutor deve ser você mesmo';
  END IF;
  NEW.status := 'pendente';
 ELSIF TG_OP = 'UPDATE' AND NOT public.has_role(auth.uid(), 'admin') THEN
  IF NEW.instructor_id IS DISTINCT FROM OLD.instructor_id THEN RAISE EXCEPTION 'Instrutor não pode ser alterado'; END IF;
  IF OLD.status <> 'pendente' THEN RAISE EXCEPTION 'Curso já avaliado não pode ser editado'; END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN RAISE EXCEPTION 'Apenas um administrador pode aprovar ou rejeitar cursos'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER course_guard BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.guard_course();

-- Waitlist / interest registration -- NOT an enrollment or a payment.
CREATE TABLE public.course_interest (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.course_interest TO authenticated;
GRANT ALL ON public.course_interest TO service_role;
ALTER TABLE public.course_interest ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own interest" ON public.course_interest FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "instructor sees interest in own courses" ON public.course_interest FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.courses c WHERE c.id = course_id AND c.instructor_id = auth.uid()));
CREATE POLICY "admin sees all interest" ON public.course_interest FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
