-- Per-user daily cap for job analyses (enforced in app server with service role).

create table public.user_daily_analysis_counts (
  user_id uuid not null references auth.users (id) on delete cascade,
  bucket_utc date not null,
  analysis_count int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, bucket_utc)
);

create index user_daily_analysis_counts_bucket on public.user_daily_analysis_counts (bucket_utc);

alter table public.user_daily_analysis_counts enable row level security;

-- No user-facing policies: only server-side admin client reads/writes this table.
