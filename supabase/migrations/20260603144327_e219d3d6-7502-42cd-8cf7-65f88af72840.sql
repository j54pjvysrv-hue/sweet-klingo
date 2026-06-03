
-- ENUMS
create type public.app_role as enum ('admin', 'moderator', 'user');
create type public.learning_level as enum ('L1', 'L2', 'L3', 'L4', 'L5');

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  level learning_level not null default 'L1',
  daily_goal_min int not null default 10,
  streak_days int not null default 0,
  last_active_date date,
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_self_read" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_self_write" on public.profiles for update to authenticated using (auth.uid() = id);
create policy "profiles_self_insert" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Trigger to auto-create profile + welcome data on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  insert into public.user_roles (user_id, role) values (new.id, 'user');
  return new;
end;
$$;

-- USER ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "user_roles_self_read" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Attach trigger now that user_roles exists
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- CANDY PASSAGES (public read, AI generated)
create table public.candy_passages (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  level learning_level not null,
  topic text not null,
  category text not null, -- 'student_life' | 'topik' | 'daily_life' | 'kdrama' | 'career' | 'culture'
  emoji text,
  english_hint text,
  body jsonb not null, -- {lines: Token[][]} or {paragraphs: [{lines: Token[][]}]}
  reading_minutes int default 3,
  generated_by text default 'seed', -- 'seed' | 'ai'
  created_at timestamptz not null default now()
);
grant select on public.candy_passages to anon, authenticated;
grant all on public.candy_passages to service_role;
alter table public.candy_passages enable row level security;
create policy "passages_public_read" on public.candy_passages for select to anon, authenticated using (true);

create index candy_passages_level_cat_idx on public.candy_passages (level, category);

-- VOCAB SAVED
create table public.vocab_saved (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  korean text not null,
  romanization text,
  meaning text not null,
  pos text,
  grammar text,
  note text,
  source_passage_id uuid references public.candy_passages(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, korean)
);
grant select, insert, update, delete on public.vocab_saved to authenticated;
grant all on public.vocab_saved to service_role;
alter table public.vocab_saved enable row level security;
create policy "vocab_self_all" on public.vocab_saved for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- NOTES
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  passage_id uuid references public.candy_passages(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notes to authenticated;
grant all on public.notes to service_role;
alter table public.notes enable row level security;
create policy "notes_self_all" on public.notes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CHAT THREADS
create table public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New conversation',
  context jsonb, -- e.g. {passage_id, sentence}
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.chat_threads to authenticated;
grant all on public.chat_threads to service_role;
alter table public.chat_threads enable row level security;
create policy "threads_self_all" on public.chat_threads for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- CHAT MESSAGES
create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  parts jsonb not null,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.chat_messages to authenticated;
grant all on public.chat_messages to service_role;
alter table public.chat_messages enable row level security;
create policy "messages_self_all" on public.chat_messages for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index chat_messages_thread_idx on public.chat_messages (thread_id, created_at);

-- COURSES
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  level learning_level not null,
  title text not null,
  description text,
  emoji text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.courses to anon, authenticated;
grant all on public.courses to service_role;
alter table public.courses enable row level security;
create policy "courses_public_read" on public.courses for select to anon, authenticated using (true);

-- LESSONS
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  passage_id uuid references public.candy_passages(id) on delete set null,
  title text not null,
  summary text,
  sort_order int not null default 0,
  grammar_focus text,
  vocab_count int default 0,
  created_at timestamptz not null default now()
);
grant select on public.lessons to anon, authenticated;
grant all on public.lessons to service_role;
alter table public.lessons enable row level security;
create policy "lessons_public_read" on public.lessons for select to anon, authenticated using (true);

create index lessons_course_idx on public.lessons (course_id, sort_order);

-- USER PROGRESS
create table public.user_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed_at timestamptz,
  minutes_spent int default 0,
  unique (user_id, lesson_id)
);
grant select, insert, update, delete on public.user_progress to authenticated;
grant all on public.user_progress to service_role;
alter table public.user_progress enable row level security;
create policy "progress_self_all" on public.user_progress for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
