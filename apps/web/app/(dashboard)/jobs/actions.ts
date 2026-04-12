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

  await runJobAnalysis({
    userId: user.id,
    jobId: job.id,
    rawJdText: job.raw_jd_text,
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
}
