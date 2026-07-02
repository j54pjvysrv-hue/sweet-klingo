
-- Achievements: remove privilege-escalation ALL policy
DROP POLICY IF EXISTS achievements_self ON public.achievements;
REVOKE INSERT, UPDATE, DELETE ON public.achievements FROM authenticated;

-- Chat messages: replace permissive ALL policy with scoped SELECT/INSERT/DELETE
DROP POLICY IF EXISTS messages_self_all ON public.chat_messages;

CREATE POLICY messages_select_own ON public.chat_messages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY messages_insert_own_thread ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.chat_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY messages_delete_own ON public.chat_messages
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Quiz results: allow authenticated users to insert their own rows
CREATE POLICY quiz_insert_own ON public.quiz_results
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
