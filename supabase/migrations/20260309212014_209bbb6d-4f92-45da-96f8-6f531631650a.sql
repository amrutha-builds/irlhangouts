
-- Add squad_id column to rsvps
ALTER TABLE public.rsvps ADD COLUMN squad_id uuid REFERENCES public.squads(id) ON DELETE CASCADE;

-- Drop old unique constraint (event_id, user_id)
ALTER TABLE public.rsvps DROP CONSTRAINT IF EXISTS rsvps_event_id_user_id_key;

-- Create new unique constraint scoped by squad
ALTER TABLE public.rsvps ADD CONSTRAINT rsvps_event_squad_user_key UNIQUE (event_id, user_id, squad_id);
