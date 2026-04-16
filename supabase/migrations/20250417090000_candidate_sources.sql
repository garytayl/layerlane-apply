-- Candidate intelligence: raw sources, chunks for traceability, profile synthesis columns,
-- and optional link from evidence-bank rows back to a source document.

-- --- Source documents (resume paste, cover letter, etc.) ---
create table public.source_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null default 'other'
    check (kind in ('resume', 'paste', 'cover_letter', 'linkedin', 'referral', 'portfolio', 'other')),
  title text,
  raw_text text not null,
  extraction_status text not null default 'pending'
    check (extraction_status in ('pending', 'running', 'ready', 'failed')),
  extraction_payload jsonb,
  extraction_error text,
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index source_documents_user_created on public.source_documents (user_id, created_at desc);

-- --- Chunks (for citation / future RAG); MVP: split from raw_text ---
create table public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.source_documents (id) on delete cascade,
  chunk_index int not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index source_chunks_document on public.source_chunks (document_id);

-- --- Living profile fields (synthesis from bank + sources) ---
alter table public.profiles
  add column if not exists candidate_summary text,
  add column if not exists synthesis jsonb not null default '{}'::jsonb,
  add column if not exists synthesis_updated_at timestamptz;

-- --- Traceability: bank rows may originate from a source ---
alter table public.experience_facts
  add column if not exists source_document_id uuid references public.source_documents (id) on delete set null;

alter table public.bullets
  add column if not exists source_document_id uuid references public.source_documents (id) on delete set null;

alter table public.project_receipts
  add column if not exists source_document_id uuid references public.source_documents (id) on delete set null;

alter table public.saved_answers
  add column if not exists source_document_id uuid references public.source_documents (id) on delete set null;

create index if not exists experience_facts_source_doc on public.experience_facts (source_document_id)
  where source_document_id is not null;
create index if not exists bullets_source_doc on public.bullets (source_document_id)
  where source_document_id is not null;
create index if not exists project_receipts_source_doc on public.project_receipts (source_document_id)
  where source_document_id is not null;
create index if not exists saved_answers_source_doc on public.saved_answers (source_document_id)
  where source_document_id is not null;

-- --- RLS ---
alter table public.source_documents enable row level security;
alter table public.source_chunks enable row level security;

create policy "source_documents_all_own" on public.source_documents
  for all using (auth.uid() = user_id);

create policy "source_chunks_all_own" on public.source_chunks
  for all using (
    exists (
      select 1 from public.source_documents d
      where d.id = source_chunks.document_id and d.user_id = auth.uid()
    )
  );
