
-- Squad folders for organizing squads per user
CREATE TABLE public.squad_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.squad_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own folders" ON public.squad_folders
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders" ON public.squad_folders
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON public.squad_folders
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON public.squad_folders
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Add folder_id and archived_at to squad_members
ALTER TABLE public.squad_members
  ADD COLUMN folder_id uuid REFERENCES public.squad_folders(id) ON DELETE SET NULL,
  ADD COLUMN archived_at timestamp with time zone;
