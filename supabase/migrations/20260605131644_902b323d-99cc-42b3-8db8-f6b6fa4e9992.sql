
-- Quiz results: read-only for users; writes via service role (server fn)
DROP POLICY IF EXISTS quiz_self ON public.quiz_results;
CREATE POLICY "quiz_self_read" ON public.quiz_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
