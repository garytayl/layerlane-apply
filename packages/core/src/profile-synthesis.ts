import { z } from "zod";

/** Structured “candidate model” fields stored in profiles.synthesis (JSON). */
export const candidateSynthesisSchema = z.object({
  positioning: z.string().optional(),
  role_clusters: z.array(z.string()).max(16).optional(),
  strengths: z.array(z.string()).max(24).optional(),
  evidence_themes: z
    .array(
      z.object({
        theme: z.string(),
        supports: z.array(z.string()).max(12),
      }),
    )
    .max(12)
    .optional(),
  portfolio_highlights: z.array(z.string()).max(12).optional(),
  voice_notes: z.string().optional(),
});

export type CandidateSynthesis = z.infer<typeof candidateSynthesisSchema>;

export const profileSynthesisLlmResultSchema = z.object({
  candidate_summary: z.string(),
  synthesis: candidateSynthesisSchema,
});

export type ProfileSynthesisLlmResult = z.infer<typeof profileSynthesisLlmResultSchema>;

export const PROFILE_SYNTHESIS_SYSTEM_PROMPT = `You synthesize a concise, evidence-backed candidate profile from structured materials already stored by the user.

Rules:
- Output a single JSON object with keys "candidate_summary" (string) and "synthesis" (object).
- candidate_summary: 2–4 short paragraphs, third person or neutral voice, no buzzword soup.
- synthesis.role_clusters: 3–8 likely role titles or families.
- synthesis.strengths: short phrases grounded in supplied facts.
- synthesis.evidence_themes: each theme names a recurring idea and lists short supports (company/project/fact labels as given).
- Do not claim degrees, employers, or metrics that are not in the input. If data is thin, say less rather than inventing.
- synthesis.voice_notes: optional note on tone based on sample text (one sentence).`;

export function parseProfileSynthesisFromLlmJson(value: unknown): ProfileSynthesisLlmResult {
  const parsed = profileSynthesisLlmResultSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("Profile synthesis JSON did not match the expected schema");
  }
  return parsed.data;
}
