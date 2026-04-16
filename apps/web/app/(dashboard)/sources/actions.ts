"use server";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sourceExtractionResultSchema } from "@layerlane/core";
import { createClient } from "@/lib/supabase/server";
import { runSourceExtraction } from "@/lib/extract-source-document";
import { runCandidateProfileSynthesis } from "@/lib/synthesize-candidate-profile";

const KINDS = new Set([
  "resume",
  "paste",
  "cover_letter",
  "linkedin",
  "referral",
  "portfolio",
  "other",
]);

function normalizeKind(raw: string): string {
  return KINDS.has(raw) ? raw : "other";
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createSourceDocument(formData: FormData) {
  const { supabase, user } = await requireUser();
  const title = String(formData.get("title") ?? "").trim() || "Untitled source";
  const kind = normalizeKind(String(formData.get("kind") ?? "paste"));
  let raw_text = String(formData.get("raw_text") ?? "").trim();
  const file = formData.get("file");

  if (file instanceof File && file.size > 0) {
    if (file.type && file.type !== "text/plain") {
      throw new Error("Only plain text (.txt) uploads are supported for now.");
    }
    raw_text = await file.text();
  }

  if (!raw_text) {
    throw new Error("Paste text or upload a .txt file.");
  }
  if (raw_text.length > 120_000) {
    throw new Error("Text is too long (max 120k characters). Trim and try again.");
  }

  const { data, error } = await supabase
    .from("source_documents")
    .insert({
      user_id: user.id,
      title,
      kind,
      raw_text,
      extraction_status: "pending",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Could not save source");
  }

  revalidatePath("/sources");
  redirect(`/sources/${data.id}`);
}

export async function runExtractionForm(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  void _prev;
  try {
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing source id" };
    await runSourceExtraction(id);
    revalidatePath(`/sources/${id}`);
    revalidatePath("/sources");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Extraction failed" };
  }
}

export async function deleteSourceDocument(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Missing id");
  await supabase.from("source_documents").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/sources");
  redirect("/sources");
}

export async function synthesizeProfileAction(
  _prev: { error?: string } | null,
  _formData: FormData,
): Promise<{ error?: string }> {
  void _prev;
  void _formData;
  try {
    await runCandidateProfileSynthesis();
    revalidatePath("/profile");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Synthesis failed" };
  }
}

async function loadExtraction(supabase: SupabaseClient, userId: string, docId: string) {
  const { data: doc } = await supabase
    .from("source_documents")
    .select("extraction_payload")
    .eq("id", docId)
    .eq("user_id", userId)
    .single();

  const parsed = sourceExtractionResultSchema.safeParse(doc?.extraction_payload);
  if (!parsed.success) return null;
  return parsed.data;
}

export async function promoteExperienceFromSource(formData: FormData) {
  const { supabase, user } = await requireUser();
  const documentId = String(formData.get("document_id") ?? "");
  const index = Number.parseInt(String(formData.get("index") ?? ""), 10);
  if (!documentId || Number.isNaN(index)) {
    throw new Error("Invalid promotion request");
  }

  const extraction = await loadExtraction(supabase, user.id, documentId);
  const row = extraction?.experiences[index];
  if (!row) throw new Error("That extracted row no longer exists");

  const { error } = await supabase.from("experience_facts").insert({
    user_id: user.id,
    company: row.company ?? null,
    title: row.title ?? null,
    body: row.body,
    start_date: row.start_date ?? null,
    end_date: row.end_date ?? null,
    tags: [],
    source_document_id: documentId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bank");
  revalidatePath(`/sources/${documentId}`);
}

export async function promoteProjectFromSource(formData: FormData) {
  const { supabase, user } = await requireUser();
  const documentId = String(formData.get("document_id") ?? "");
  const index = Number.parseInt(String(formData.get("index") ?? ""), 10);
  if (!documentId || Number.isNaN(index)) throw new Error("Invalid promotion request");

  const extraction = await loadExtraction(supabase, user.id, documentId);
  const row = extraction?.project_receipts[index];
  if (!row) throw new Error("That extracted row no longer exists");

  const { error } = await supabase.from("project_receipts").insert({
    user_id: user.id,
    name: row.name,
    problem: row.problem ?? null,
    action: row.action ?? null,
    outcome: row.outcome ?? null,
    tech: row.tech ?? null,
    tags: [],
    source_document_id: documentId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bank");
  revalidatePath(`/sources/${documentId}`);
}

export async function promoteBulletFromSource(formData: FormData) {
  const { supabase, user } = await requireUser();
  const documentId = String(formData.get("document_id") ?? "");
  const index = Number.parseInt(String(formData.get("index") ?? ""), 10);
  if (!documentId || Number.isNaN(index)) throw new Error("Invalid promotion request");

  const extraction = await loadExtraction(supabase, user.id, documentId);
  const row = extraction?.bullets[index];
  if (!row) throw new Error("That extracted row no longer exists");

  const { error } = await supabase.from("bullets").insert({
    user_id: user.id,
    body: row.body,
    category: row.category ?? null,
    tags: [],
    source_document_id: documentId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bank");
  revalidatePath(`/sources/${documentId}`);
}

export async function promoteSavedAnswerFromSource(formData: FormData) {
  const { supabase, user } = await requireUser();
  const documentId = String(formData.get("document_id") ?? "");
  const index = Number.parseInt(String(formData.get("index") ?? ""), 10);
  if (!documentId || Number.isNaN(index)) throw new Error("Invalid promotion request");

  const extraction = await loadExtraction(supabase, user.id, documentId);
  const row = extraction?.saved_answers[index];
  if (!row) throw new Error("That extracted row no longer exists");

  const { error } = await supabase.from("saved_answers").insert({
    user_id: user.id,
    prompt_type: row.prompt_type ?? null,
    title: row.title ?? null,
    body: row.body,
    tags: [],
    source_document_id: documentId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bank");
  revalidatePath(`/sources/${documentId}`);
}

export async function promoteTestimonialFromSource(formData: FormData) {
  const { supabase, user } = await requireUser();
  const documentId = String(formData.get("document_id") ?? "");
  const index = Number.parseInt(String(formData.get("index") ?? ""), 10);
  if (!documentId || Number.isNaN(index)) throw new Error("Invalid promotion request");

  const extraction = await loadExtraction(supabase, user.id, documentId);
  const row = extraction?.testimonials?.[index];
  if (!row) throw new Error("That extracted row no longer exists");

  const { error } = await supabase.from("saved_answers").insert({
    user_id: user.id,
    prompt_type: "testimonial",
    title: row.attribution ?? "Referral / testimonial",
    body: row.body,
    tags: [],
    source_document_id: documentId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bank");
  revalidatePath(`/sources/${documentId}`);
}
