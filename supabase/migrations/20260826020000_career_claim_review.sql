-- Extend the hosted canonical ledger to match the local Career HQ review model.
-- Hosted Supabase can remain paused; this migration is for future parity.

alter table public.career_ledger_records
  drop constraint if exists career_ledger_records_kind_check;

alter table public.career_ledger_records
  add constraint career_ledger_records_kind_check check (kind in (
    'identity', 'experience', 'education', 'project', 'skill',
    'achievement', 'credential', 'preference', 'claim'
  ));

alter table public.career_ledger_records
  add column if not exists needs_review boolean not null default true;

create index if not exists career_ledger_records_needs_review
  on public.career_ledger_records (user_id, updated_at desc)
  where needs_review;
