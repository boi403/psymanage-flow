-- Adds a real Google Meet link per session (auto-created by the calendar sync
-- worker once the professional has Google Calendar connected) and tracking for
-- the booking-confirmation e-mail. The CFP 06/2019 report structure change
-- (migration not required -- session_recordings.report is jsonb) lives in the
-- session-report edge function + frontend, not here.

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS meet_url text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS confirmation_email_sent_at timestamptz;

-- Internal Sala Virtual (room_code) stays as the fallback for professionals
-- who haven't connected Google Calendar -- meet_url is additive, not a
-- replacement column, so existing bookings/sessions are unaffected.
