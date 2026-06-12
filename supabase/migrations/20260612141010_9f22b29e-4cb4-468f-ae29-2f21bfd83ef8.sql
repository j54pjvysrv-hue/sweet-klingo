
-- 1) Achievements: prevent users from self-granting. Only allow SELECT to self; writes via service_role.
DROP POLICY IF EXISTS "achievements_self_all" ON public.achievements;
DROP POLICY IF EXISTS "achievements_self_write" ON public.achievements;
DROP POLICY IF EXISTS "Users can manage their own achievements" ON public.achievements;
DROP POLICY IF EXISTS "achievements_self_read" ON public.achievements;

CREATE POLICY "achievements_self_read"
  ON public.achievements
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Revoke write privileges from authenticated; service_role retains ALL via prior grants.
REVOKE INSERT, UPDATE, DELETE ON public.achievements FROM authenticated;
GRANT SELECT ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;

-- 2) Candy passages: add author attribution column for moderation/abuse tracking.
ALTER TABLE public.candy_passages
  ADD COLUMN IF NOT EXISTS generated_by_user_id uuid;

CREATE INDEX IF NOT EXISTS candy_passages_generated_by_user_id_idx
  ON public.candy_passages (generated_by_user_id);
