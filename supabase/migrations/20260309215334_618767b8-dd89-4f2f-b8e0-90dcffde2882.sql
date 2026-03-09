
-- Drop restrictive policies on events and recreate as permissive
DROP POLICY IF EXISTS "Authenticated users can read events" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events" ON public.events;

CREATE POLICY "Authenticated users can read events"
  ON public.events FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create events"
  ON public.events FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Fix profiles too
DROP POLICY IF EXISTS "Users can read all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can read all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Fix rsvps
DROP POLICY IF EXISTS "Authenticated users can read rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Users can manage own rsvps" ON public.rsvps;
DROP POLICY IF EXISTS "Users can update own rsvps" ON public.rsvps;

CREATE POLICY "Authenticated users can read rsvps"
  ON public.rsvps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can manage own rsvps"
  ON public.rsvps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rsvps"
  ON public.rsvps FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix squad_members
DROP POLICY IF EXISTS "Members can read squad members" ON public.squad_members;
DROP POLICY IF EXISTS "Users can join squads" ON public.squad_members;
DROP POLICY IF EXISTS "Users can leave squads" ON public.squad_members;

CREATE POLICY "Members can read squad members"
  ON public.squad_members FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can join squads"
  ON public.squad_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave squads"
  ON public.squad_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix squads
DROP POLICY IF EXISTS "Anyone authenticated can read squads" ON public.squads;
DROP POLICY IF EXISTS "Authenticated users can create squads" ON public.squads;

CREATE POLICY "Anyone authenticated can read squads"
  ON public.squads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create squads"
  ON public.squads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);
