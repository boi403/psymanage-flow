ALTER TABLE public.sessions ADD COLUMN notes text NOT NULL DEFAULT '', ADD COLUMN notes_report jsonb, ADD COLUMN notes_report_source text;
CREATE TABLE public.app_user_connections (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, connector_id text NOT NULL, connection_key_ciphertext text NOT NULL, reconnect_required boolean NOT NULL DEFAULT false, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(user_id,connector_id));
GRANT ALL ON public.app_user_connections TO service_role;
ALTER TABLE public.app_user_connections ENABLE ROW LEVEL SECURITY;
CREATE TABLE public.calendar_sync_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL, session_id uuid NOT NULL, starts_at timestamptz NOT NULL, duration_min integer NOT NULL, cancelled boolean NOT NULL DEFAULT false, version integer NOT NULL DEFAULT 1, synced_version integer NOT NULL DEFAULT 0, last_error text, updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(session_id));
GRANT SELECT ON public.calendar_sync_jobs TO authenticated;
GRANT ALL ON public.calendar_sync_jobs TO service_role;
ALTER TABLE public.calendar_sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY own_calendar_jobs ON public.calendar_sync_jobs FOR SELECT TO authenticated USING(user_id=auth.uid());
CREATE TABLE public.calendar_worker_secret (id integer PRIMARY KEY DEFAULT 1, secret text NOT NULL DEFAULT encode(gen_random_bytes(32),'hex'));
GRANT ALL ON public.calendar_worker_secret TO service_role;
ALTER TABLE public.calendar_worker_secret ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.enqueue_calendar_session() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.starts_at IS NOT DISTINCT FROM OLD.starts_at AND NEW.duration_min IS NOT DISTINCT FROM OLD.duration_min AND NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;
 IF TG_OP='DELETE' THEN
 INSERT INTO public.calendar_sync_jobs(user_id,session_id,starts_at,duration_min,cancelled) VALUES(OLD.user_id,OLD.id,OLD.starts_at,OLD.duration_min,true) ON CONFLICT(session_id) DO UPDATE SET cancelled=true,version=calendar_sync_jobs.version+1,updated_at=now(); RETURN OLD;
 END IF;
 INSERT INTO public.calendar_sync_jobs(user_id,session_id,starts_at,duration_min,cancelled) VALUES(NEW.user_id,NEW.id,NEW.starts_at,NEW.duration_min,NEW.status='Cancelada') ON CONFLICT(session_id) DO UPDATE SET starts_at=EXCLUDED.starts_at,duration_min=EXCLUDED.duration_min,cancelled=EXCLUDED.cancelled,version=calendar_sync_jobs.version+1,updated_at=now(); RETURN NEW;
END $$;
CREATE TRIGGER calendar_session_queue AFTER INSERT OR UPDATE OR DELETE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.enqueue_calendar_session();
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;