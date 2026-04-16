-- Same schema as 20250412130000_init.sql but safe to run if objects already exist.
-- Use this in the Supabase SQL editor when a full re-run fails with "already exists".

-- Tables
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  prefs jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.experience_facts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company text,
  title text,
  body text,
  start_date text,
  end_date text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bullets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null,
  category text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  problem text,
  action text,
  outcome text,
  tech text,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_type text,
  title text,
  body text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  url text,
  title text,
  company text,
  raw_jd_text text not null,
  status text not null default 'saved',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.job_analyses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  fit_score int,
  summary text,
  why_role text,
  ranked_bullets jsonb not null default '[]'::jsonb,
  model text,
  raw_response jsonb,
  created_at timestamptz not null default now()
);

create index if not exists job_analyses_job_id_created_at on public.job_analyses (job_id, created_at desc);

create table if not exists public.api_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token_hash text not null,
  label text,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create unique index if not exists api_tokens_token_hash on public.api_tokens (token_hash);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.experience_facts enable row level security;
alter table public.bullets enable row level security;
alter table public.project_receipts enable row level security;
alter table public.saved_answers enable row level security;
alter table public.jobs enable row level security;
alter table public.job_analyses enable row level security;
alter table public.api_tokens enable row level security;

-- Policies (drop first so re-run does not error)
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

drop policy if exists "experience_facts_all_own" on public.experience_facts;
drop policy if exists "bullets_all_own" on public.bullets;
drop policy if exists "project_receipts_all_own" on public.project_receipts;
drop policy if exists "saved_answers_all_own" on public.saved_answers;
drop policy if exists "jobs_all_own" on public.jobs;
drop policy if exists "job_analyses_all_own" on public.job_analyses;
drop policy if exists "api_tokens_all_own" on public.api_tokens;

create policy "experience_facts_all_own" on public.experience_facts for all using (auth.uid() = user_id);
create policy "bullets_all_own" on public.bullets for all using (auth.uid() = user_id);
create policy "project_receipts_all_own" on public.project_receipts for all using (auth.uid() = user_id);
create policy "saved_answers_all_own" on public.saved_answers for all using (auth.uid() = user_id);
create policy "jobs_all_own" on public.jobs for all using (auth.uid() = user_id);
create policy "job_analyses_all_own" on public.job_analyses for all using (auth.uid() = user_id);
create policy "api_tokens_all_own" on public.api_tokens for all using (auth.uid() = user_id);
