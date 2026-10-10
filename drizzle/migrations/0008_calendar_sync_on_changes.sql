ALTER TABLE public.calendar_worker_secret ADD COLUMN endpoint text;
CREATE OR REPLACE FUNCTION public.wake_calendar_sync() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE config public.calendar_worker_secret;
BEGIN
 IF TG_TABLE_NAME='calendar_sync_jobs' AND TG_OP='UPDATE' AND NEW.version=OLD.version THEN RETURN NEW; END IF;
 SELECT * INTO config FROM public.calendar_worker_secret WHERE id=1;
 IF config.endpoint IS NOT NULL THEN
 PERFORM net.http_post(url:=config.endpoint,headers:=jsonb_build_object('Content-Type','application/json','X-Calendar-Worker',config.secret),body:=jsonb_build_object('action','worker'));
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER wake_calendar_job AFTER INSERT OR UPDATE ON public.calendar_sync_jobs FOR EACH ROW EXECUTE FUNCTION public.wake_calendar_sync();
CREATE TRIGGER wake_calendar_connection AFTER INSERT OR UPDATE ON public.app_user_connections FOR EACH ROW EXECUTE FUNCTION public.wake_calendar_sync();