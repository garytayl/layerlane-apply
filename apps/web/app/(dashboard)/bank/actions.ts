"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function insertExperienceFact(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("experience_facts").insert({
    user_id: user.id,
    company: String(formData.get("company") ?? "") || null,
    title: String(formData.get("title") ?? "") || null,
    body: String(formData.get("body") ?? "") || null,
    start_date: String(formData.get("start_date") ?? "") || null,
    end_date: String(formData.get("end_date") ?? "") || null,
    tags: parseTags(String(formData.get("tags") ?? "")),
  });
  revalidatePath("/bank");
}

export async function updateExperienceFact(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("experience_facts")
    .update({
      company: String(formData.get("company") ?? "") || null,
      title: String(formData.get("title") ?? "") || null,
      body: String(formData.get("body") ?? "") || null,
      start_date: String(formData.get("start_date") ?? "") || null,
      end_date: String(formData.get("end_date") ?? "") || null,
      tags: parseTags(String(formData.get("tags") ?? "")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/bank");
}

export async function deleteExperienceFact(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await supabase.from("experience_facts").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/bank");
}

export async function insertBullet(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("bullets").insert({
    user_id: user.id,
    body: String(formData.get("body") ?? ""),
    category: String(formData.get("category") ?? "") || null,
    tags: parseTags(String(formData.get("tags") ?? "")),
  });
  revalidatePath("/bank");
}

export async function updateBullet(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("bullets")
    .update({
      body: String(formData.get("body") ?? ""),
      category: String(formData.get("category") ?? "") || null,
      tags: parseTags(String(formData.get("tags") ?? "")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/bank");
}

export async function deleteBullet(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await supabase.from("bullets").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/bank");
}

export async function insertProjectReceipt(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("project_receipts").insert({
    user_id: user.id,
    name: String(formData.get("name") ?? ""),
    problem: String(formData.get("problem") ?? "") || null,
    action: String(formData.get("action") ?? "") || null,
    outcome: String(formData.get("outcome") ?? "") || null,
    tech: String(formData.get("tech") ?? "") || null,
    tags: parseTags(String(formData.get("tags") ?? "")),
  });
  revalidatePath("/bank");
}

export async function updateProjectReceipt(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("project_receipts")
    .update({
      name: String(formData.get("name") ?? ""),
      problem: String(formData.get("problem") ?? "") || null,
      action: String(formData.get("action") ?? "") || null,
      outcome: String(formData.get("outcome") ?? "") || null,
      tech: String(formData.get("tech") ?? "") || null,
      tags: parseTags(String(formData.get("tags") ?? "")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/bank");
}

export async function deleteProjectReceipt(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await supabase.from("project_receipts").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/bank");
}

export async function insertSavedAnswer(formData: FormData) {
  const { supabase, user } = await requireUser();
  await supabase.from("saved_answers").insert({
    user_id: user.id,
    prompt_type: String(formData.get("prompt_type") ?? "") || null,
    title: String(formData.get("title") ?? "") || null,
    body: String(formData.get("body") ?? ""),
    tags: parseTags(String(formData.get("tags") ?? "")),
  });
  revalidatePath("/bank");
}

export async function updateSavedAnswer(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await supabase
    .from("saved_answers")
    .update({
      prompt_type: String(formData.get("prompt_type") ?? "") || null,
      title: String(formData.get("title") ?? "") || null,
      body: String(formData.get("body") ?? ""),
      tags: parseTags(String(formData.get("tags") ?? "")),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);
  revalidatePath("/bank");
}

export async function deleteSavedAnswer(formData: FormData) {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  await supabase.from("saved_answers").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/bank");
}
