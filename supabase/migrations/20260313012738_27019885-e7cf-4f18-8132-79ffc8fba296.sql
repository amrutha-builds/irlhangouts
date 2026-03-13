-- Add squad_id to events table
ALTER TABLE public.events ADD COLUMN squad_id uuid REFERENCES public.squads(id) ON DELETE CASCADE;

-- Drop old SELECT policy
DROP POLICY IF EXISTS "Authenticated users can read events" ON public.events;

-- New SELECT policy: only see events in squads you're a member of (non-archived), or events with no squad (scraped)
CREATE POLICY "Users can read events in their squads"
ON public.events
FOR SELECT
TO authenticated
USING (
  squad_id IS NULL
  OR EXISTS (
    SELECT 1 FROM public.squad_members
    WHERE squad_members.squad_id = events.squad_id
      AND squad_members.user_id = auth.uid()
      AND squad_members.archived_at IS NULL
  )
);

-- Update INSERT policy to also allow squad_id
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;
CREATE POLICY "Authenticated users can create events"
ON public.events
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = created_by
  AND (
    squad_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.squad_members
      WHERE squad_members.squad_id = events.squad_id
        AND squad_members.user_id = auth.uid()
        AND squad_members.archived_at IS NULL
    )
  )
);