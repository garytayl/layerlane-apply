import { z } from "zod";

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const rankedBulletSchema = z.object({
  /** LLM may return a bank UUID, null for new text, or a bad string — normalize below. */
  bullet_id: z.union([z.string(), z.null()]).optional(),
  text: z.string(),
  relevance: z.string(),
});

export type RankedBullet = z.infer<typeof rankedBulletSchema>;

export const analysisResultSchema = z.object({
  fit_score: z.coerce.number().int().min(0).max(100),
  summary: z.string(),
  why_role: z.string(),
  ranked_bullets: z.array(rankedBulletSchema).max(32).default([]),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

/** System prompt for JD ↔ evidence-bank analysis (shared by web API and any future clients). */
export const JOB_ANALYSIS_SYSTEM_PROMPT = `You help a candidate evaluate fit for a job. You receive the candidate's structured evidence bank (with stable UUIDs in brackets) and a job description.

Return ONLY valid JSON with this shape:
{
  "fit_score": <integer 0-100>,
  "summary": <string, 2-4 sentences>,
  "why_role": <string, 2-5 sentences on why this role matches the candidate>,
  "ranked_bullets": [
    { "bullet_id": <uuid from bank OR null if new>, "text": <string to use or adapt>, "relevance": <one sentence> }
  ]
}

Pick at most 8 items for ranked_bullets. Prefer referencing existing bullet IDs from the bank when they apply; use bullet_id null only when proposing fresh wording.

If the user message includes a "Candidate preferences" section (tone, target roles), align the summary and suggested bullets with that tone and those targets when relevant.`;

/**
 * Normalize LLM JSON (already parsed as unknown) into a validated result.
 * Coerces missing fields; clamps fit_score.
 */
export function parseAnalysisResultFromLlmJson(data: unknown): AnalysisResult {
  const partial = analysisResultSchema.safeParse(data);
  if (!partial.success) {
    throw new Error(`Invalid analysis JSON: ${partial.error.message}`);
  }
  const ranked = partial.data.ranked_bullets.slice(0, 8).map((r) => {
    const raw = r.bullet_id;
    const bullet_id =
      raw == null || raw === ""
        ? null
        : typeof raw === "string" && uuidRe.test(raw)
          ? raw
          : null;
    return {
      bullet_id,
      text: r.text,
      relevance: r.relevance,
    };
  });
  return {
    fit_score: partial.data.fit_score,
    summary: partial.data.summary,
    why_role: partial.data.why_role,
    ranked_bullets: ranked,
  };
}
