-- Career HQ: canonical Master Career Ledger with evidence and verification audit history.
-- This migration does not replace the existing bank tables. They remain input/read models
-- while new workflows progressively promote durable facts into the ledger.

create table public.career_ledger_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in (
    'identity', 'experience', 'education', 'project', 'skill',
    'achievement', 'credential', 'preference'
  )),
  canonical_key text not null,
  label text not null,
  value jsonb not null default '{}'::jsonb,
  verification_status text not null default 'unverified' check (verification_status in (
    'unverified', 'supported', 'verified', 'disputed', 'stale'
  )),
  confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
  valid_from date,
  valid_to date,
  last_verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, canonical_key),
  check (valid_to is null or valid_from is null or valid_to >= valid_from)
);

create index career_ledger_records_user_kind
  on public.career_ledger_records (user_id, kind, updated_at desc);

create table public.ledger_evidence (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ledger_record_id uuid not null references public.career_ledger_records (id) on delete cascade,
  source_document_id uuid references public.source_documents (id) on delete set null,
  source_chunk_id uuid references public.source_chunks (id) on delete set null,
  locator jsonb not null default '{}'::jsonb,
  supports boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  check (source_document_id is not null or source_chunk_id is not null or note is not null)
);

create index ledger_evidence_record on public.ledger_evidence (ledger_record_id, created_at);
create index ledger_evidence_source_document on public.ledger_evidence (source_document_id)
  where source_document_id is not null;

-- Append-only audit events explain who/what changed a verification decision and why.
create table public.ledger_verification_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  ledger_record_id uuid not null references public.career_ledger_records (id) on delete cascade,
  previous_status text check (previous_status is null or previous_status in (
    'unverified', 'supported', 'verified', 'disputed', 'stale'
  )),
  status text not null check (status in (
    'unverified', 'supported', 'verified', 'disputed', 'stale'
  )),
  method text not null check (method in (
    'source_match', 'cross_source_match', 'user_attestation', 'manual_review'
  )),
  confidence numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  rationale text not null,
  actor text not null default 'system' check (actor in ('system', 'user')),
  created_at timestamptz not null default now()
);

create index ledger_verification_events_record
  on public.ledger_verification_events (ledger_record_id, created_at desc);

create table public.ledger_verification_event_evidence (
  event_id uuid not null references public.ledger_verification_events (id) on delete cascade,
  evidence_id uuid not null references public.ledger_evidence (id) on delete cascade,
  primary key (event_id, evidence_id)
);

alter table public.career_ledger_records enable row level security;
alter table public.ledger_evidence enable row level security;
alter table public.ledger_verification_events enable row level security;
alter table public.ledger_verification_event_evidence enable row level security;

create policy "career_ledger_records_all_own" on public.career_ledger_records
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "ledger_evidence_all_own" on public.ledger_evidence
  for all using (
    auth.uid() = user_id and exists (
      select 1 from public.career_ledger_records r
      where r.id = ledger_evidence.ledger_record_id and r.user_id = auth.uid()
    )
  ) with check (
    auth.uid() = user_id and exists (
      select 1 from public.career_ledger_records r
      where r.id = ledger_evidence.ledger_record_id and r.user_id = auth.uid()
    ) and (
      source_document_id is null or exists (
        select 1 from public.source_documents d
        where d.id = ledger_evidence.source_document_id and d.user_id = auth.uid()
      )
    ) and (
      source_chunk_id is null or exists (
        select 1 from public.source_chunks c
        join public.source_documents d on d.id = c.document_id
        where c.id = ledger_evidence.source_chunk_id and d.user_id = auth.uid()
      )
    )
  );

create policy "ledger_verification_events_select_own" on public.ledger_verification_events
  for select using (auth.uid() = user_id);

create policy "ledger_verification_events_insert_own" on public.ledger_verification_events
  for insert with check (
    auth.uid() = user_id and exists (
      select 1 from public.career_ledger_records r
      where r.id = ledger_verification_events.ledger_record_id and r.user_id = auth.uid()
    )
  );

create policy "ledger_verification_event_evidence_select_own"
  on public.ledger_verification_event_evidence for select using (
    exists (
      select 1 from public.ledger_verification_events v
      where v.id = ledger_verification_event_evidence.event_id and v.user_id = auth.uid()
    )
  );

create policy "ledger_verification_event_evidence_insert_own"
  on public.ledger_verification_event_evidence for insert with check (
    exists (
      select 1
      from public.ledger_verification_events v
      join public.ledger_evidence e on e.id = ledger_verification_event_evidence.evidence_id
      where v.id = ledger_verification_event_evidence.event_id
        and v.user_id = auth.uid()
        and e.user_id = auth.uid()
        and v.ledger_record_id = e.ledger_record_id
    )
  );

comment on table public.career_ledger_records is
  'Canonical career facts; the source of truth for future generation and autofill.';
comment on table public.ledger_evidence is
  'Fine-grained provenance linking a canonical fact to source text or a manual note.';
comment on table public.ledger_verification_events is
  'Append-only audit history for verification decisions; updates and deletes are intentionally disallowed by RLS.';
comment on table public.ledger_verification_event_evidence is
  'Evidence used by a verification decision, constrained to the same user and ledger record by RLS.';
