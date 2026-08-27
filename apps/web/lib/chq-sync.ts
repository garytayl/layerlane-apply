import "server-only";

import {
  chqSyncEnvelopeSchema,
  type ChqSyncEnvelope,
  type ChqSyncItem,
} from "@layerlane/core";
import { createHash } from "node:crypto";
import { getLocalLedgerDb, listLocalInboxItems } from "@/lib/local-ledger";
import { addLedgerEvidence, ingestSource } from "@/lib/chq-service";

function csvRows(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(field); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); field = "";
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
    } else field += char;
  }
  row.push(field);
  if (row.some((value) => value.trim())) rows.push(row);
  return rows;
}

function parseCsv(text: string): ChqSyncEnvelope {
  const [headers, ...rows] = csvRows(text);
  if (!headers) throw new Error("CSV needs a header row");
  const keys = headers.map((header) => header.trim());
  const items = rows.map((values) => {
    const row = Object.fromEntries(keys.map((key, index) => [key, values[index]?.trim() || undefined]));
    return {
      type: row.type,
      external_id: row.external_id,
      assertion_state: row.assertion_state || "proposed",
      canonical_key: row.canonical_key,
      label: row.label,
      summary: row.summary,
      company: row.company,
      role: row.role,
      application_id: row.application_id,
      status: row.status,
      occurred_at: row.occurred_at,
      project_key: row.project_key,
      quote: row.quote,
      note: row.note,
      supports: row.supports ? row.supports.toLowerCase() !== "false" : true,
      source: {
        type: row.source_type || "other",
        title: row.source_title || "CSV import",
        external_ref: row.source_ref,
        timestamp: row.source_timestamp,
      },
    };
  });
  return chqSyncEnvelopeSchema.parse({
    version: 1,
    producer: { type: "other", name: "CSV import" },
    items,
  });
}

export function parseSyncPayload(text: string, format: "json" | "csv") {
  return format === "json"
    ? chqSyncEnvelopeSchema.parse(JSON.parse(text))
    : parseCsv(text);
}

export async function importSyncEnvelope(envelope: ChqSyncEnvelope, format: "json" | "csv") {
  const parsed = chqSyncEnvelopeSchema.parse(envelope);
  const db = await getLocalLedgerDb();
  const batchId = crypto.randomUUID();
  const hash = createHash("sha256").update(JSON.stringify(parsed)).digest("hex");
  let imported = 0;
  let duplicates = 0;

  await db.transaction(async (tx) => {
    await tx.query(
      `insert into chq_sync_batches
        (id, direction, format, producer_type, producer_name, payload_hash, item_count)
       values ($1, 'inbound', $2, $3, $4, $5, $6)`,
      [batchId, format, parsed.producer.type, parsed.producer.name || null, hash, parsed.items.length],
    );
    for (const item of parsed.items) {
      const result = await tx.query(
        `insert into chq_inbox_items
          (id, batch_id, item_type, assertion_state, external_id, payload,
           source_type, source_title, source_ref, source_timestamp)
         values ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10)
         on conflict (source_type, external_id) where external_id is not null do nothing
         returning id`,
        [crypto.randomUUID(), batchId, item.type, item.assertion_state, item.external_id || null,
          JSON.stringify(item), item.source.type, item.source.title,
          item.source.external_ref || null, item.source.timestamp || null],
      );
      if (result.rows.length) imported += 1; else duplicates += 1;
    }
  });
  return { batch_id: batchId, imported, duplicates, status: "queued_for_review" as const };
}

export async function queueSyncItem(item: ChqSyncItem, producerType = "chatgpt", producerName?: string) {
  return importSyncEnvelope(chqSyncEnvelopeSchema.parse({
    version: 1,
    producer: { type: producerType, name: producerName },
    items: [item],
  }), "json");
}

export async function rejectInboxItem(id: string, note: string) {
  const db = await getLocalLedgerDb();
  const result = await db.query(
    `update chq_inbox_items set status = 'rejected', review_note = $2,
       reviewed_at = now() where id = $1 and status = 'pending' returning id`,
    [id, note],
  );
  if (!result.rows[0]) throw new Error("Pending inbox item not found");
}

async function createSourceForItem(item: Awaited<ReturnType<typeof listLocalInboxItems>>[number]) {
  return ingestSource({
    kind: item.source_type as Parameters<typeof ingestSource>[0]["kind"],
    title: item.source_title,
    content: JSON.stringify(item.payload),
    externalRef: item.source_ref || undefined,
  });
}

export async function acceptInboxItem(input: {
  id: string; label?: string; summary?: string; canonicalKey?: string; reviewNote: string;
}) {
  const db = await getLocalLedgerDb();
  const pending = (await listLocalInboxItems()).find((item) => item.id === input.id);
  if (!pending) throw new Error("Pending inbox item not found");
  const payload = pending.payload as ChqSyncItem;
  const source = await createSourceForItem(pending);

  if (pending.item_type === "career_claim") {
    const label = input.label?.trim() || payload.label;
    const summary = input.summary?.trim() || payload.summary;
    const canonicalKey = input.canonicalKey?.trim() || payload.canonical_key;
    if (!label || !summary || !canonicalKey) throw new Error("Claim needs canonical key, label, and summary");
    const recordId = crypto.randomUUID();
    await db.query(
      `insert into career_ledger_records
        (id, kind, canonical_key, label, value, verification_status, confidence, needs_review)
       values ($1, 'claim', $2, $3, $4::jsonb, 'supported', $5, false)
       on conflict (canonical_key) do update set label = excluded.label, value = excluded.value,
         verification_status = 'supported', needs_review = false, updated_at = now()`,
      [recordId, canonicalKey, label, JSON.stringify({ summary }), pending.assertion_state === "user_confirmed" ? 0.8 : 0.5],
    );
    const found = await db.query<{ id: string }>("select id::text from career_ledger_records where canonical_key = $1", [canonicalKey]);
    await addLedgerEvidence({ ledgerRecordId: found.rows[0].id, sourceId: source.source_id, note: `Accepted from CHQ Inbox: ${input.reviewNote}`, supports: true });
    await db.query("update career_ledger_records set needs_review = false where id = $1", [found.rows[0].id]);
  } else if (pending.item_type === "application_event") {
    let applicationId = payload.application_id;
    if (!applicationId) {
      if (!payload.company || !payload.role) throw new Error("Application event needs company and role");
      applicationId = crypto.randomUUID();
      await db.query(
        `insert into applications (id, company, role, current_status) values ($1, $2, $3, $4)`,
        [applicationId, payload.company, payload.role, payload.status || "applied"],
      );
    } else {
      await db.query("update applications set current_status = $2, updated_at = now() where id = $1", [applicationId, payload.status || "updated"]);
    }
    await db.query(
      `insert into application_status_events (id, application_id, status, occurred_at, source_id, note)
       values ($1, $2, $3, $4, $5, $6)`,
      [crypto.randomUUID(), applicationId, payload.status || "applied", payload.occurred_at || new Date().toISOString(), source.source_id, input.reviewNote],
    );
  } else {
    if (!payload.project_key) throw new Error("Project evidence needs project_key");
    const project = await db.query<{ id: string }>("select id::text from career_ledger_records where canonical_key = $1 and kind = 'project'", [payload.project_key]);
    if (!project.rows[0]) throw new Error("Matching project not found");
    await addLedgerEvidence({ ledgerRecordId: project.rows[0].id, sourceId: source.source_id, quote: payload.quote, note: payload.note || input.reviewNote, supports: payload.supports });
  }

  await db.query(
    `update chq_inbox_items set status = 'accepted', review_note = $2,
       reviewed_at = now() where id = $1 and status = 'pending'`,
    [input.id, input.reviewNote],
  );
}

export async function exportChqSnapshot() {
  const db = await getLocalLedgerDb();
  const [records, evidence, sources, applications, events] = await Promise.all([
    db.query("select * from career_ledger_records order by updated_at desc"),
    db.query("select * from ledger_evidence order by created_at desc"),
    db.query("select * from local_sources order by created_at desc"),
    db.query("select * from applications order by updated_at desc"),
    db.query("select * from application_status_events order by occurred_at desc"),
  ]);
  return { version: 1, exported_at: new Date().toISOString(), canonical_store: "local_pglite", records: records.rows, evidence: evidence.rows, sources: sources.rows, applications: applications.rows, application_events: events.rows };
}
