"use server";

import { revalidatePath } from "next/cache";
import { acceptInboxItem, importSyncEnvelope, parseSyncPayload, rejectInboxItem } from "@/lib/chq-sync";

function required(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  if (!value) throw new Error(`${key} is required`);
  return value;
}

function refresh() {
  revalidatePath("/local-ledger");
  revalidatePath("/local-ledger/review");
}

export async function importInboxFile(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a JSON or CSV file");
  if (file.size > 2_000_000) throw new Error("Import files are limited to 2 MB");
  const format = file.name.toLowerCase().endsWith(".csv") ? "csv" : "json";
  await importSyncEnvelope(parseSyncPayload(await file.text(), format), format);
  refresh();
}

export async function importInboxText(formData: FormData) {
  const format = required(formData, "format") as "json" | "csv";
  await importSyncEnvelope(parseSyncPayload(required(formData, "payload"), format), format);
  refresh();
}

export async function acceptInbox(formData: FormData) {
  const fields = Object.fromEntries([...formData.entries()].filter(([key]) => key !== "id" && key !== "review_note"));
  await acceptInboxItem({
    id: required(formData, "id"),
    fields,
    reviewNote: String(formData.get("review_note") ?? "").trim() || "Accepted after local review",
  });
  refresh();
}

export async function rejectInbox(formData: FormData) {
  await rejectInboxItem(required(formData, "id"), String(formData.get("review_note") ?? "").trim() || "Rejected after local review");
  refresh();
}
