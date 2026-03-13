CREATE POLICY "Anyone can read public events"
ON public.events
FOR SELECT
TO anon
USING (squad_id IS NULL);