
-- HANJA dictionary (public)
CREATE TABLE IF NOT EXISTS public.hanja (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character text NOT NULL UNIQUE,
  korean_reading text NOT NULL,
  meaning text NOT NULL,
  romanization text,
  examples jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.hanja TO anon, authenticated;
GRANT ALL ON public.hanja TO service_role;
ALTER TABLE public.hanja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hanja_public_read" ON public.hanja FOR SELECT TO anon, authenticated USING (true);

-- Daily activity rollup
CREATE TABLE IF NOT EXISTS public.daily_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day date NOT NULL,
  minutes integer NOT NULL DEFAULT 0,
  words_saved integer NOT NULL DEFAULT 0,
  lessons_done integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_progress TO authenticated;
GRANT ALL ON public.daily_progress TO service_role;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_self" ON public.daily_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Achievements
CREATE TABLE IF NOT EXISTS public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  title text NOT NULL,
  description text,
  emoji text,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.achievements TO authenticated;
GRANT ALL ON public.achievements TO service_role;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "achievements_self" ON public.achievements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Quiz results (placement)
CREATE TABLE IF NOT EXISTS public.quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  score integer NOT NULL,
  total integer NOT NULL,
  suggested_level public.learning_level NOT NULL,
  answers jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quiz_results TO authenticated;
GRANT ALL ON public.quiz_results TO service_role;
ALTER TABLE public.quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_self" ON public.quiz_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- candy_passages: unique slug + signed-in INSERT for Generate Candy
CREATE UNIQUE INDEX IF NOT EXISTS candy_passages_slug_key ON public.candy_passages(slug);
CREATE INDEX IF NOT EXISTS candy_passages_level_idx ON public.candy_passages(level);
CREATE INDEX IF NOT EXISTS candy_passages_category_idx ON public.candy_passages(category);
DROP POLICY IF EXISTS "passages_authenticated_insert" ON public.candy_passages;
CREATE POLICY "passages_authenticated_insert" ON public.candy_passages FOR INSERT TO authenticated WITH CHECK (true);

-- vocab_saved: unique per user+korean (for upsert)
CREATE UNIQUE INDEX IF NOT EXISTS vocab_saved_user_korean_key ON public.vocab_saved(user_id, korean);

-- Seed common Hanja
INSERT INTO public.hanja (character, korean_reading, meaning, romanization, examples, notes) VALUES
('愛','애','love','ae','[{"word":"애정","reading":"애정","meaning":"affection"},{"word":"연애","reading":"연애","meaning":"romance"}]'::jsonb,'Used widely in romance vocabulary.'),
('家','가','house, family','ga','[{"word":"가족","reading":"가족","meaning":"family"},{"word":"국가","reading":"국가","meaning":"nation"}]'::jsonb,NULL),
('學','학','learning','hak','[{"word":"학교","reading":"학교","meaning":"school"},{"word":"학생","reading":"학생","meaning":"student"}]'::jsonb,NULL),
('生','생','life, birth','saeng','[{"word":"학생","reading":"학생","meaning":"student"},{"word":"인생","reading":"인생","meaning":"human life"}]'::jsonb,NULL),
('人','인','person','in','[{"word":"한국인","reading":"한국인","meaning":"Korean person"},{"word":"인기","reading":"인기","meaning":"popularity"}]'::jsonb,NULL),
('國','국','country','guk','[{"word":"한국","reading":"한국","meaning":"Korea"},{"word":"국민","reading":"국민","meaning":"citizen"}]'::jsonb,NULL),
('韓','한','Korea, great','han','[{"word":"한국","reading":"한국","meaning":"Korea"},{"word":"한식","reading":"한식","meaning":"Korean food"}]'::jsonb,NULL),
('日','일','day, sun','il','[{"word":"오늘","reading":"오늘","meaning":"today"},{"word":"일요일","reading":"일요일","meaning":"Sunday"}]'::jsonb,NULL),
('月','월','month, moon','wol','[{"word":"월요일","reading":"월요일","meaning":"Monday"},{"word":"개월","reading":"개월","meaning":"months (count)"}]'::jsonb,NULL),
('時','시','time, hour','si','[{"word":"시간","reading":"시간","meaning":"time"},{"word":"시계","reading":"시계","meaning":"clock"}]'::jsonb,NULL),
('心','심','heart, mind','sim','[{"word":"마음","reading":"마음","meaning":"heart"},{"word":"중심","reading":"중심","meaning":"center"}]'::jsonb,NULL),
('火','화','fire','hwa','[{"word":"화요일","reading":"화요일","meaning":"Tuesday"},{"word":"화재","reading":"화재","meaning":"fire (incident)"}]'::jsonb,NULL),
('水','수','water','su','[{"word":"수요일","reading":"수요일","meaning":"Wednesday"},{"word":"수영","reading":"수영","meaning":"swimming"}]'::jsonb,NULL),
('木','목','tree, wood','mok','[{"word":"목요일","reading":"목요일","meaning":"Thursday"},{"word":"나무","reading":"나무","meaning":"tree"}]'::jsonb,NULL),
('金','금','gold, money','geum','[{"word":"금요일","reading":"금요일","meaning":"Friday"},{"word":"금메달","reading":"금메달","meaning":"gold medal"}]'::jsonb,NULL),
('土','토','earth, soil','to','[{"word":"토요일","reading":"토요일","meaning":"Saturday"},{"word":"국토","reading":"국토","meaning":"national land"}]'::jsonb,NULL),
('山','산','mountain','san','[{"word":"등산","reading":"등산","meaning":"hiking"},{"word":"산책","reading":"산책","meaning":"walk"}]'::jsonb,NULL),
('海','해','sea','hae','[{"word":"바다","reading":"바다","meaning":"sea"},{"word":"해변","reading":"해변","meaning":"beach"}]'::jsonb,NULL),
('天','천','sky, heaven','cheon','[{"word":"하늘","reading":"하늘","meaning":"sky"},{"word":"천국","reading":"천국","meaning":"heaven"}]'::jsonb,NULL),
('地','지','ground, earth','ji','[{"word":"지구","reading":"지구","meaning":"Earth"},{"word":"지하철","reading":"지하철","meaning":"subway"}]'::jsonb,NULL),
('大','대','big, great','dae','[{"word":"대학","reading":"대학","meaning":"university"},{"word":"대단","reading":"대단","meaning":"great"}]'::jsonb,NULL),
('小','소','small','so','[{"word":"소년","reading":"소년","meaning":"boy"},{"word":"축소","reading":"축소","meaning":"reduction"}]'::jsonb,NULL),
('中','중','middle','jung','[{"word":"중간","reading":"중간","meaning":"middle"},{"word":"중국","reading":"중국","meaning":"China"}]'::jsonb,NULL),
('東','동','east','dong','[{"word":"동쪽","reading":"동쪽","meaning":"east side"},{"word":"동아시아","reading":"동아시아","meaning":"East Asia"}]'::jsonb,NULL),
('西','서','west','seo','[{"word":"서쪽","reading":"서쪽","meaning":"west"},{"word":"서울","reading":"서울","meaning":"Seoul"}]'::jsonb,'서울 actually pure Korean, but 西 still means west.'),
('南','남','south','nam','[{"word":"남쪽","reading":"남쪽","meaning":"south"},{"word":"남자","reading":"남자","meaning":"man"}]'::jsonb,NULL),
('北','북','north','buk','[{"word":"북쪽","reading":"북쪽","meaning":"north"},{"word":"북한","reading":"북한","meaning":"North Korea"}]'::jsonb,NULL),
('上','상','up, above','sang','[{"word":"상위","reading":"상위","meaning":"upper rank"},{"word":"인상","reading":"인상","meaning":"impression"}]'::jsonb,NULL),
('下','하','down, below','ha','[{"word":"하위","reading":"하위","meaning":"lower rank"},{"word":"지하","reading":"지하","meaning":"underground"}]'::jsonb,NULL),
('父','부','father','bu','[{"word":"부모","reading":"부모","meaning":"parents"},{"word":"부친","reading":"부친","meaning":"father (formal)"}]'::jsonb,NULL),
('母','모','mother','mo','[{"word":"부모","reading":"부모","meaning":"parents"},{"word":"모국","reading":"모국","meaning":"motherland"}]'::jsonb,NULL),
('男','남','male','nam','[{"word":"남자","reading":"남자","meaning":"man"},{"word":"남성","reading":"남성","meaning":"male"}]'::jsonb,NULL),
('女','여','female','yeo','[{"word":"여자","reading":"여자","meaning":"woman"},{"word":"여성","reading":"여성","meaning":"female"}]'::jsonb,NULL),
('子','자','child','ja','[{"word":"자식","reading":"자식","meaning":"offspring"},{"word":"여자","reading":"여자","meaning":"woman"}]'::jsonb,NULL),
('食','식','food, eat','sik','[{"word":"식사","reading":"식사","meaning":"meal"},{"word":"한식","reading":"한식","meaning":"Korean food"}]'::jsonb,NULL),
('飮','음','drink','eum','[{"word":"음료","reading":"음료","meaning":"beverage"},{"word":"음주","reading":"음주","meaning":"drinking"}]'::jsonb,NULL),
('行','행','go, conduct','haeng','[{"word":"여행","reading":"여행","meaning":"travel"},{"word":"행동","reading":"행동","meaning":"behavior"}]'::jsonb,NULL),
('車','차','car, vehicle','cha','[{"word":"자동차","reading":"자동차","meaning":"automobile"},{"word":"기차","reading":"기차","meaning":"train"}]'::jsonb,NULL),
('語','어','language','eo','[{"word":"한국어","reading":"한국어","meaning":"Korean language"},{"word":"외국어","reading":"외국어","meaning":"foreign language"}]'::jsonb,NULL),
('文','문','letter, writing','mun','[{"word":"문화","reading":"문화","meaning":"culture"},{"word":"문장","reading":"문장","meaning":"sentence"}]'::jsonb,NULL),
('化','화','change','hwa','[{"word":"문화","reading":"문화","meaning":"culture"},{"word":"변화","reading":"변화","meaning":"change"}]'::jsonb,NULL),
('安','안','peace, safe','an','[{"word":"안녕","reading":"안녕","meaning":"hello/peace"},{"word":"안전","reading":"안전","meaning":"safety"}]'::jsonb,NULL),
('全','전','whole','jeon','[{"word":"전체","reading":"전체","meaning":"whole"},{"word":"안전","reading":"안전","meaning":"safety"}]'::jsonb,NULL),
('愛','애','love','ae','[]'::jsonb,NULL) ON CONFLICT (character) DO NOTHING;
