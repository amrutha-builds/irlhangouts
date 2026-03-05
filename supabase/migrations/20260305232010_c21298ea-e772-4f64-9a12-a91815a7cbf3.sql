-- Add unique constraint on rsvps for upsert
ALTER TABLE public.rsvps DROP CONSTRAINT IF EXISTS rsvps_event_id_user_id_key;
ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_event_id_user_id_key UNIQUE (event_id, user_id);

-- Enable pg_cron and pg_net for scheduled scraping
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;