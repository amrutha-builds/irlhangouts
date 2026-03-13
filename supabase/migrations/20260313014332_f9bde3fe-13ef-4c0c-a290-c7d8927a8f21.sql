-- Allow event creators to delete their own events
CREATE POLICY "Creator can delete own events"
ON public.events
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);