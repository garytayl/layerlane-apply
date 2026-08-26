"use server";

import {
  careerLedgerRecordKindSchema,
  verificationMethodSchema,
  verificationStatusSchema,
} from "@layerlane/core";
import { revalidatePath } from "next/cache";
import { getLocalLedgerDb } from "@/lib/local-ledger";

function required(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

export async function createLocalLedgerRecord(formData: FormData) {
  const db = await getLocalLedgerDb();
  const id = crypto.randomUUID();
  const kind = careerLedgerRecordKindSchema.parse(required(formData, "kind"));
  const canonicalKey = required(formData, "canonical_key");
  const label = required(formData, "label");
  const summary = required(formData, "summary");

  await db.query(
    `insert into career_ledger_records (id, kind, canonical_key, label, value)
     values ($1, $2, $3, $4, $5::jsonb)`,
    [id, kind, canonicalKey, label, JSON.stringify({ summary })],
  );
  revalidatePath("/local-ledger");
}

export async function updateLocalLedgerRecord(formData: FormData) {
  const db = await getLocalLedgerDb();
  const id = required(formData, "id");
  const kind = careerLedgerRecordKindSchema.parse(required(formData, "kind"));
  const label = required(formData, "label");
  const summary = required(formData, "summary");

  await db.query(
    `update career_ledger_records
     set kind = $2, label = $3, value = $4::jsonb, updated_at = now()
     where id = $1`,
    [id, kind, label, JSON.stringify({ summary })],
  );
  revalidatePath("/local-ledger");
}

export async function addLocalLedgerEvidence(formData: FormData) {
  const db = await getLocalLedgerDb();
  const ledgerRecordId = required(formData, "ledger_record_id");
  const quote = String(formData.get("quote") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  if (!quote && !note) throw new Error("Evidence needs a quote or note");

  await db.query(
    `insert into ledger_evidence (id, ledger_record_id, quote, note, supports)
     values ($1, $2, $3, $4, $5)`,
    [crypto.randomUUID(), ledgerRecordId, quote, note, formData.get("supports") === "true"],
  );
  revalidatePath("/local-ledger");
}

export async function verifyLocalLedgerRecord(formData: FormData) {
  const db = await getLocalLedgerDb();
  const id = required(formData, "id");
  const status = verificationStatusSchema.parse(required(formData, "verification_status"));
  const method = verificationMethodSchema.parse(required(formData, "method"));
  const rationale = required(formData, "rationale");
  const confidence = Number(formData.get("confidence"));
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error("confidence must be between 0 and 1");
  }

  await db.transaction(async (tx) => {
    const current = await tx.query<{ verification_status: string }>(
      "select verification_status from career_ledger_records where id = $1",
      [id],
    );
    if (!current.rows[0]) throw new Error("Ledger record not found");

    await tx.query(
      `insert into ledger_verification_events
        (id, ledger_record_id, previous_status, status, method, confidence, rationale)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        id,
        current.rows[0].verification_status,
        status,
        method,
        confidence,
        rationale,
      ],
    );
    await tx.query(
      `update career_ledger_records
       set verification_status = $2, confidence = $3, updated_at = now()
       where id = $1`,
      [id, status, confidence],
    );
  });

  revalidatePath("/local-ledger");
}
