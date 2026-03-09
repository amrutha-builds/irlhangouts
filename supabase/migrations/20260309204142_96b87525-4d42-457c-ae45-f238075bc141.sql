
-- Squads table
CREATE TABLE public.squads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  invite_code text NOT NULL UNIQUE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Squad members table
CREATE TABLE public.squad_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(squad_id, user_id)
);

-- Enable RLS
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;

-- Squads policies
CREATE POLICY "Anyone authenticated can read squads" ON public.squads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create squads" ON public.squads FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);

-- Squad members policies
CREATE POLICY "Members can read squad members" ON public.squad_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join squads" ON public.squad_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave squads" ON public.squad_members FOR DELETE TO authenticated USING (auth.uid() = user_id);
