import "server-only";

import { PGlite } from "@electric-sql/pglite";
import { mkdir } from "node:fs/promises";
import path from "node:path";

export type LocalLedgerRecord = {
  id: string;
  kind: string;
  canonical_key: string;
  label: string;
  summary: string;
  verification_status: string;
  confidence: number;
  needs_review: boolean;
  updated_at: string;
  evidence: LocalLedgerEvidence[];
  verification_events: LocalVerificationEvent[];
};

export type LocalVerificationEvent = {
  id: string;
  ledger_record_id: string;
  previous_status: string | null;
  status: string;
  method: string;
  confidence: number;
  rationale: string;
  created_at: string;
};

export type LocalLedgerEvidence = {
  id: string;
  ledger_record_id: string;
  source_id: string | null;
  source_title: string | null;
  quote: string | null;
  note: string | null;
  supports: boolean;
  created_at: string;
};

export type LocalLedgerSource = {
  id: string;
  kind: string;
  title: string;
  content: string;
  external_ref: string | null;
  created_at: string;
};

export type LocalInboxItem = {
  id: string;
  batch_id: string;
  item_type: string;
  status: string;
  assertion_state: string;
  external_id: string | null;
  payload: Record<string, unknown>;
  source_type: string;
  source_title: string;
  source_ref: string | null;
  source_timestamp: string | null;
  review_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export type BridgeClient = {
  id: string;
  name: string;
  scopes: string[];
  expires_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  created_at: string;
};

export type BridgeRequestLog = {
  id: string;
  request_id: string;
  client_id: string | null;
  client_name: string | null;
  operation: string | null;
  outcome: string;
  status_code: number;
  source_type: string | null;
  source_ref: string | null;
  created_at: string;
};

type LocalLedgerGlobal = typeof globalThis & {
  __careerHqLocalDb?: Promise<PGlite>;
};

const globalForLedger = globalThis as LocalLedgerGlobal;

async function initializeLocalDb() {
  const dataDir =
    process.env.CHQ_LOCAL_DATA_DIR?.trim() ||
    path.join(process.env.LOCALAPPDATA || process.cwd(), "CareerHQ", "pglite");
  await mkdir(dataDir, { recursive: true });
  const db = await PGlite.create(dataDir);

  await db.exec(`
    create table if not exists career_ledger_records (
      id uuid primary key,
      kind text not null check (kind in (
        'identity', 'experience', 'education', 'project', 'skill',
        'achievement', 'credential', 'preference', 'claim'
      )),
      canonical_key text not null unique,
      label text not null,
      value jsonb not null default '{}'::jsonb,
      verification_status text not null default 'unverified' check (
        verification_status in ('unverified', 'supported', 'verified', 'disputed', 'stale')
      ),
      confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
      needs_review boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table career_ledger_records
      drop constraint if exists career_ledger_records_kind_check;
    alter table career_ledger_records
      add constraint career_ledger_records_kind_check check (kind in (
        'identity', 'experience', 'education', 'project', 'skill',
        'achievement', 'credential', 'preference', 'claim'
      ));
    alter table career_ledger_records
      add column if not exists needs_review boolean not null default true;

    create table if not exists local_sources (
      id uuid primary key,
      kind text not null,
      title text not null,
      content text not null,
      external_ref text,
      created_at timestamptz not null default now()
    );

    create table if not exists ledger_evidence (
      id uuid primary key,
      ledger_record_id uuid not null references career_ledger_records (id) on delete cascade,
      source_id uuid references local_sources (id) on delete set null,
      quote text,
      note text,
      supports boolean not null default true,
      created_at timestamptz not null default now(),
      check (quote is not null or note is not null)
    );
    alter table ledger_evidence
      add column if not exists source_id uuid references local_sources (id) on delete set null;

    create table if not exists ledger_verification_events (
      id uuid primary key,
      ledger_record_id uuid not null references career_ledger_records (id) on delete cascade,
      previous_status text,
      status text not null,
      method text not null,
      confidence numeric(4,3) not null,
      rationale text not null,
      created_at timestamptz not null default now()
    );

    create table if not exists chq_sync_batches (
      id uuid primary key,
      direction text not null check (direction in ('inbound', 'outbound')),
      format text not null check (format in ('json', 'csv', 'snapshot')),
      producer_type text not null,
      producer_name text,
      payload_hash text not null,
      item_count integer not null default 0,
      created_at timestamptz not null default now()
    );

    create table if not exists chq_inbox_items (
      id uuid primary key,
      batch_id uuid not null references chq_sync_batches (id) on delete cascade,
      item_type text not null check (item_type in ('career_claim', 'application_event', 'project_evidence')),
      status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected')),
      assertion_state text not null check (assertion_state in ('proposed', 'user_confirmed')),
      external_id text,
      payload jsonb not null,
      source_type text not null,
      source_title text not null,
      source_ref text,
      source_timestamp timestamptz,
      review_note text,
      created_at timestamptz not null default now(),
      reviewed_at timestamptz
    );

    create unique index if not exists chq_inbox_external_id_idx
      on chq_inbox_items (source_type, external_id) where external_id is not null;

    create table if not exists applications (
      id uuid primary key,
      company text not null,
      role text not null,
      current_status text not null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists application_status_events (
      id uuid primary key,
      application_id uuid not null references applications (id) on delete cascade,
      status text not null,
      occurred_at timestamptz not null,
      source_id uuid references local_sources (id) on delete set null,
      note text,
      created_at timestamptz not null default now()
    );

    create table if not exists chq_bridge_clients (
      id uuid primary key,
      name text not null,
      token_hash text not null unique,
      scopes text[] not null,
      expires_at timestamptz not null,
      revoked_at timestamptz,
      last_used_at timestamptz,
      created_at timestamptz not null default now()
    );

    create table if not exists chq_bridge_request_log (
      id uuid primary key,
      request_id uuid not null unique,
      client_id uuid references chq_bridge_clients (id) on delete set null,
      client_name text,
      operation text,
      outcome text not null,
      status_code integer not null,
      ip_hash text not null,
      source_type text,
      source_ref text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists chq_bridge_request_log_client_time_idx
      on chq_bridge_request_log (client_id, created_at desc);
    create index if not exists chq_bridge_request_log_ip_time_idx
      on chq_bridge_request_log (ip_hash, created_at desc);
  `);

  return db;
}

export function getLocalLedgerDb() {
  globalForLedger.__careerHqLocalDb ??= initializeLocalDb().catch((error) => {
    globalForLedger.__careerHqLocalDb = undefined;
    throw error;
  });
  return globalForLedger.__careerHqLocalDb;
}

export async function listLocalLedgerRecords(): Promise<LocalLedgerRecord[]> {
  const db = await getLocalLedgerDb();
  const records = await db.query<Omit<LocalLedgerRecord, "evidence" | "verification_events" | "summary"> & { value: unknown }>(`
    select id::text, kind, canonical_key, label, value, verification_status,
      confidence::float8 as confidence, needs_review, updated_at::text
    from career_ledger_records
    order by updated_at desc
  `);
  const evidence = await db.query<LocalLedgerEvidence>(`
    select e.id::text, e.ledger_record_id::text, e.source_id::text,
      s.title as source_title, e.quote, e.note, e.supports, e.created_at::text
    from ledger_evidence e
    left join local_sources s on s.id = e.source_id
    order by e.created_at desc
  `);
  const events = await db.query<LocalVerificationEvent>(`
    select id::text, ledger_record_id::text, previous_status, status, method,
      confidence::float8 as confidence, rationale, created_at::text
    from ledger_verification_events
    order by created_at desc
  `);

  return records.rows.map((record) => ({
    ...record,
    summary:
      typeof record.value === "object" && record.value !== null && "summary" in record.value
        ? String(record.value.summary ?? "")
        : "",
    evidence: evidence.rows.filter((item) => item.ledger_record_id === record.id),
    verification_events: events.rows.filter((item) => item.ledger_record_id === record.id),
  }));
}

export async function listLocalLedgerSources(): Promise<LocalLedgerSource[]> {
  const db = await getLocalLedgerDb();
  const sources = await db.query<LocalLedgerSource>(`
    select id::text, kind, title, content, external_ref, created_at::text
    from local_sources
    order by created_at desc
  `);
  return sources.rows;
}

export async function listLocalInboxItems(status = "pending"): Promise<LocalInboxItem[]> {
  const db = await getLocalLedgerDb();
  const result = await db.query<LocalInboxItem>(`
    select id::text, batch_id::text, item_type, status, assertion_state, external_id, payload,
      source_type, source_title, source_ref, source_timestamp::text,
      review_note, created_at::text, reviewed_at::text
    from chq_inbox_items
    where status = $1
    order by created_at asc
  `, [status]);
  return result.rows;
}

export async function listBridgeClients(): Promise<BridgeClient[]> {
  const db = await getLocalLedgerDb();
  const result = await db.query<BridgeClient>(`
    select id::text, name, scopes, expires_at::text, revoked_at::text,
      last_used_at::text, created_at::text
    from chq_bridge_clients order by created_at desc
  `);
  return result.rows;
}

export async function listBridgeRequestLogs(limit = 50): Promise<BridgeRequestLog[]> {
  const db = await getLocalLedgerDb();
  const result = await db.query<BridgeRequestLog>(`
    select id::text, request_id::text, client_id::text, client_name, operation,
      outcome, status_code, source_type, source_ref, created_at::text
    from chq_bridge_request_log order by created_at desc limit $1
  `, [Math.min(Math.max(limit, 1), 200)]);
  return result.rows;
}
