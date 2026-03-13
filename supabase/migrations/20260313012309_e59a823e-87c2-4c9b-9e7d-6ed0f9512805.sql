-- Add policy to allow squad creators to rename their squads
CREATE POLICY "Creator can update own squads"
ON public.squads
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);