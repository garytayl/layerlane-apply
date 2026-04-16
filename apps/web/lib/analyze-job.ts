import "server-only";

import OpenAI from "openai";
import {
  JOB_ANALYSIS_SYSTEM_PROMPT,
  formatEvidenceBankContext,
  parseAnalysisResultFromLlmJson,
  type AnalysisResult,
} from "@layerlane/core";
import { createAdminClient } from "@/lib/supabase/admin";

export type { AnalysisResult, RankedBullet } from "@layerlane/core";

export async function runJobAnalysis(params: {
  userId: string;
  jobId: string;
  rawJdText: string;
}): Promise<AnalysisResult & { model: string; raw_response: unknown }> {
  const admin = createAdminClient();

  const [facts, bullets, receipts] = await Promise.all([
    admin
      .from("experience_facts")
      .select("id, body, company, title")
      .eq("user_id", params.userId),
    admin.from("bullets").select("id, body, category").eq("user_id", params.userId),
    admin
      .from("project_receipts")
      .select("id, name, problem, action, outcome, tech")
      .eq("user_id", params.userId),
  ]);

  const bank = formatEvidenceBankContext({
    facts: facts.data ?? [],
    bullets: bullets.data ?? [],
    receipts: receipts.data ?? [],
  });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });
  const model = "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: JOB_ANALYSIS_SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: `Evidence bank:\n${bank}\n\nJob description:\n${params.rawJdText.slice(0, 32_000)}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty model response");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error("Model did not return valid JSON");
  }

  const result = parseAnalysisResultFromLlmJson(parsedJson);

  const { error } = await admin.from("job_analyses").insert({
    job_id: params.jobId,
    user_id: params.userId,
    fit_score: result.fit_score,
    summary: result.summary,
    why_role: result.why_role,
    ranked_bullets: result.ranked_bullets,
    model,
    raw_response: parsedJson as Record<string, unknown>,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { ...result, model, raw_response: parsedJson };
}
