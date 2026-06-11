CREATE TABLE IF NOT EXISTS public.vocabulary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  korean text NOT NULL UNIQUE,
  romanization text,
  meaning text NOT NULL,
  pos text,
  level text NOT NULL DEFAULT 'L1',
  topic text,
  example_kr text,
  example_en text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.vocabulary TO anon, authenticated;
GRANT ALL ON public.vocabulary TO service_role;

ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vocabulary_public_read" ON public.vocabulary
  FOR SELECT TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS vocabulary_level_idx ON public.vocabulary(level);
CREATE INDEX IF NOT EXISTS vocabulary_topic_idx ON public.vocabulary(topic);