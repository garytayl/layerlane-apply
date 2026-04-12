import "server-only";

import OpenAI from "openai";
import { createAdminClient } from "@/lib/supabase/admin";

export type RankedBullet = {
  bullet_id: string | null;
  text: string;
  relevance: string;
};

export type AnalysisResult = {
  fit_score: number;
  summary: string;
  why_role: string;
  ranked_bullets: RankedBullet[];
};

const MAX_CONTEXT_CHARS = 24_000;

function buildBankContext(rows: {
  facts: { id: string; body: string | null; company: string | null; title: string | null }[];
  bullets: { id: string; body: string; category: string | null }[];
  receipts: {
    id: string;
    name: string;
    problem: string | null;
    action: string | null;
    outcome: string | null;
    tech: string | null;
  }[];
}): string {
  const parts: string[] = [];
  parts.push("## Experience facts");
  for (const f of rows.facts) {
    parts.push(`- [${f.id}] ${f.company ?? ""} ${f.title ?? ""}: ${f.body ?? ""}`);
  }
  parts.push("\n## Bullets");
  for (const b of rows.bullets) {
    parts.push(`- [${b.id}] (${b.category ?? "general"}) ${b.body}`);
  }
  parts.push("\n## Project receipts");
  for (const r of rows.receipts) {
    parts.push(
      `- [${r.id}] ${r.name}: problem=${r.problem ?? ""} action=${r.action ?? ""} outcome=${r.outcome ?? ""} tech=${r.tech ?? ""}`,
    );
  }
  let text = parts.join("\n");
  if (text.length > MAX_CONTEXT_CHARS) {
    text = text.slice(0, MAX_CONTEXT_CHARS) + "\n…(truncated)";
  }
  return text;
}

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

  const bank = buildBankContext({
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
        content: `You help a candidate evaluate fit for a job. You receive the candidate's structured evidence bank (with stable UUIDs in brackets) and a job description.

Return ONLY valid JSON with this shape:
{
  "fit_score": <integer 0-100>,
  "summary": <string, 2-4 sentences>,
  "why_role": <string, 2-5 sentences on why this role matches the candidate>,
  "ranked_bullets": [
    { "bullet_id": <uuid from bank OR null if new>, "text": <string to use or adapt>, "relevance": <one sentence> }
  ]
}

Pick at most 8 items for ranked_bullets. Prefer referencing existing bullet IDs from the bank when they apply; use bullet_id null only when proposing fresh wording.`,
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

  const parsed = JSON.parse(raw) as AnalysisResult;
  const fit_score = Math.min(100, Math.max(0, Number(parsed.fit_score) || 0));

  const result: AnalysisResult = {
    fit_score,
    summary: String(parsed.summary ?? ""),
    why_role: String(parsed.why_role ?? ""),
    ranked_bullets: Array.isArray(parsed.ranked_bullets)
      ? parsed.ranked_bullets.map((r) => ({
          bullet_id: r.bullet_id ?? null,
          text: String(r.text ?? ""),
          relevance: String(r.relevance ?? ""),
        }))
      : [],
  };

  const { error } = await admin.from("job_analyses").insert({
    job_id: params.jobId,
    user_id: params.userId,
    fit_score: result.fit_score,
    summary: result.summary,
    why_role: result.why_role,
    ranked_bullets: result.ranked_bullets,
    model,
    raw_response: parsed as unknown as Record<string, unknown>,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { ...result, model, raw_response: parsed };
}
