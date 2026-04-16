"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { runJobAnalysis } from "@/lib/analyze-job";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function createJob(formData: FormData) {
  const { supabase, user } = await requireUser();
  const raw_jd_text = String(formData.get("raw_jd_text") ?? "");
  if (!raw_jd_text.trim()) {
    throw new Error("Job description is required");
  }

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      user_id: user.id,
      url: String(formData.get("url") ?? "") || null,
      title: String(formData.get("title") ?? "") || null,
      company: String(formData.get("company") ?? "") || null,
      raw_jd_text,
      status: "saved",
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create job");
  }

  revalidatePath("/jobs");
  redirect(`/jobs/${data.id}`);
}

export async function analyzeJobAction(jobId: string) {
  const { supabase, user } = await requireUser();
  const { data: job } = await supabase
    .from("jobs")
    .select("id, raw_jd_text")
    .eq("id", jobId)
    .eq("user_id", user.id)
    .single();

  if (!job) {
    throw new Error("Job not found");
  }

  try {
    await runJobAnalysis({
      userId: user.id,
      jobId: job.id,
      rawJdText: job.raw_jd_text,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Analysis failed";
    throw new Error(msg);
  }

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}

export async function updateJobPipeline(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const id = String(formData.get("job_id") ?? "");
  if (!id) return { error: "Missing job" };

  const status = String(formData.get("status") ?? "").trim() || "saved";
  const notesRaw = formData.get("notes");
  const notes = notesRaw === null || notesRaw === undefined ? null : String(notesRaw);

  const { error } = await supabase
    .from("jobs")
    .update({
      status,
      notes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs");
  return {};
}
