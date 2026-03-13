-- Allow users to update their own squad memberships (folder, archive status)
CREATE POLICY "Users can update own memberships"
ON public.squad_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);