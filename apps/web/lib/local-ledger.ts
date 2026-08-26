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
  updated_at: string;
  evidence: LocalLedgerEvidence[];
};

export type LocalLedgerEvidence = {
  id: string;
  ledger_record_id: string;
  quote: string | null;
  note: string | null;
  supports: boolean;
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
        'achievement', 'credential', 'preference'
      )),
      canonical_key text not null unique,
      label text not null,
      value jsonb not null default '{}'::jsonb,
      verification_status text not null default 'unverified' check (
        verification_status in ('unverified', 'supported', 'verified', 'disputed', 'stale')
      ),
      confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create table if not exists ledger_evidence (
      id uuid primary key,
      ledger_record_id uuid not null references career_ledger_records (id) on delete cascade,
      quote text,
      note text,
      supports boolean not null default true,
      created_at timestamptz not null default now(),
      check (quote is not null or note is not null)
    );

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
  const records = await db.query<Omit<LocalLedgerRecord, "evidence" | "summary"> & { value: unknown }>(`
    select id::text, kind, canonical_key, label, value, verification_status,
      confidence::float8 as confidence, updated_at::text
    from career_ledger_records
    order by updated_at desc
  `);
  const evidence = await db.query<LocalLedgerEvidence>(`
    select id::text, ledger_record_id::text, quote, note, supports, created_at::text
    from ledger_evidence
    order by created_at desc
  `);

  return records.rows.map((record) => ({
    ...record,
    summary:
      typeof record.value === "object" && record.value !== null && "summary" in record.value
        ? String(record.value.summary ?? "")
        : "",
    evidence: evidence.rows.filter((item) => item.ledger_record_id === record.id),
  }));
}
