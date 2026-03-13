
CREATE POLICY "Creator can delete own squads" ON public.squads
  FOR DELETE TO authenticated USING (auth.uid() = created_by);
