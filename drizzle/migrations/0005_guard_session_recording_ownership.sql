CREATE OR REPLACE FUNCTION public.guard_session_recording() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM public.sessions WHERE id = NEW.session_id AND user_id = NEW.user_id) THEN RAISE EXCEPTION 'Sessão de outra conta'; END IF;
 IF split_part(NEW.audio_path, '/', 1) IS DISTINCT FROM NEW.user_id::text OR (NEW.media_path IS NOT NULL AND split_part(NEW.media_path, '/', 1) IS DISTINCT FROM NEW.user_id::text) THEN RAISE EXCEPTION 'Arquivo de outra conta'; END IF;
 IF TG_OP = 'UPDATE' AND (NEW.user_id IS DISTINCT FROM OLD.user_id OR NEW.session_id IS DISTINCT FROM OLD.session_id OR NEW.audio_path IS DISTINCT FROM OLD.audio_path OR NEW.media_path IS DISTINCT FROM OLD.media_path) THEN RAISE EXCEPTION 'Vínculo da gravação não pode ser alterado'; END IF;
 IF NEW.kind NOT IN ('audio', 'video') THEN RAISE EXCEPTION 'Tipo de gravação inválido'; END IF;
 RETURN NEW;
END;
$$;
CREATE TRIGGER session_recording_owner_guard BEFORE INSERT OR UPDATE ON public.session_recordings FOR EACH ROW EXECUTE FUNCTION public.guard_session_recording();