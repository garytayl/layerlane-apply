import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

function utcToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailyLimit(): number {
  const raw = process.env.DAILY_ANALYSIS_LIMIT_PER_USER;
  const n = raw ? Number.parseInt(raw, 10) : 80;
  return Number.isFinite(n) && n > 0 ? n : 80;
}

/** Throws if user has reached today's analysis quota. */
export async function assertUnderDailyAnalysisLimit(userId: string): Promise<void> {
  const limit = dailyLimit();
  const bucket = utcToday();
  const admin = createAdminClient();

  const { data: row, error } = await admin
    .from("user_daily_analysis_counts")
    .select("analysis_count")
    .eq("user_id", userId)
    .eq("bucket_utc", bucket)
    .maybeSingle();

  if (error) {
    throw new Error(`Analysis quota check failed: ${error.message}`);
  }

  const current = row?.analysis_count ?? 0;
  if (current >= limit) {
    throw new Error(
      `Daily analysis limit reached (${limit} per day). Try again tomorrow.`,
    );
  }
}

/** Call after a job analysis row is successfully stored. */
export async function incrementDailyAnalysisCount(userId: string): Promise<void> {
  const bucket = utcToday();
  const admin = createAdminClient();

  const { data: row, error: selErr } = await admin
    .from("user_daily_analysis_counts")
    .select("analysis_count")
    .eq("user_id", userId)
    .eq("bucket_utc", bucket)
    .maybeSingle();

  if (selErr) {
    console.error("[analysis allowance] read failed", selErr.message);
    return;
  }

  const next = (row?.analysis_count ?? 0) + 1;
  const { error: upsertErr } = await admin.from("user_daily_analysis_counts").upsert(
    {
      user_id: userId,
      bucket_utc: bucket,
      analysis_count: next,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,bucket_utc" },
  );

  if (upsertErr) {
    console.error("[analysis allowance] increment failed", upsertErr.message);
  }
}
