"use server";

import { chqSourceKindSchema } from "@layerlane/core";
import { revalidatePath } from "next/cache";
import {
  addLedgerEvidence,
  createLedgerRecord,
  ingestSource,
  recordVerificationDecision,
  updateLedgerRecord,
} from "@/lib/chq-service";

function required(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function refreshLedger() {
  revalidatePath("/local-ledger");
}

export async function createLocalLedgerRecord(formData: FormData) {
  await createLedgerRecord({
    kind: required(formData, "kind"),
    canonicalKey: required(formData, "canonical_key"),
    label: required(formData, "label"),
    summary: required(formData, "summary"),
  });
  refreshLedger();
}

export async function updateLocalLedgerRecord(formData: FormData) {
  await updateLedgerRecord({
    id: required(formData, "id"),
    kind: required(formData, "kind"),
    label: required(formData, "label"),
    summary: required(formData, "summary"),
    needsReview: formData.get("needs_review") === "on",
  });
  refreshLedger();
}

export async function addLocalLedgerEvidence(formData: FormData) {
  await addLedgerEvidence({
    ledgerRecordId: required(formData, "ledger_record_id"),
    sourceId: String(formData.get("source_id") ?? "") || undefined,
    quote: String(formData.get("quote") ?? ""),
    note: String(formData.get("note") ?? ""),
    supports: formData.get("supports") === "true",
  });
  refreshLedger();
}

export async function verifyLocalLedgerRecord(formData: FormData) {
  await recordVerificationDecision({
    id: required(formData, "id"),
    status: required(formData, "verification_status"),
    method: required(formData, "method"),
    confidence: Number(formData.get("confidence")),
    rationale: required(formData, "rationale"),
    needsReview: false,
  });
  refreshLedger();
}

export async function ingestLocalSource(formData: FormData) {
  await ingestSource({
    kind: chqSourceKindSchema.parse(required(formData, "source_kind")),
    title: required(formData, "source_title"),
    content: required(formData, "source_content"),
    externalRef: String(formData.get("external_ref") ?? "").trim() || undefined,
  });
  refreshLedger();
}
