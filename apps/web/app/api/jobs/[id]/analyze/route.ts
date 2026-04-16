import type { NextRequest } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runJobAnalysis } from "@/lib/analyze-job";
import { emptyCors, jsonWithCors } from "@/lib/api-cors";

export async function OPTIONS() {
  return emptyCors();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return jsonWithCors({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;
  const admin = createAdminClient();
  const { data: job, error } = await admin
    .from("jobs")
    .select("id, raw_jd_text")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  if (error || !job) {
    return jsonWithCors({ error: "Job not found" }, { status: 404 });
  }

  try {
    const result = await runJobAnalysis({
      userId,
      jobId: job.id,
      rawJdText: job.raw_jd_text,
    });
    return jsonWithCors(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analysis failed";
    const status =
      message.includes("Daily analysis limit") || message.includes("quota")
        ? 429
        : 500;
    return jsonWithCors({ error: message }, { status });
  }
}
