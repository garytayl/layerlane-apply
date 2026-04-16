import { z } from "zod";

/**
 * Structured extraction from pasted/uploaded career text.
 * The model should only infer what is supported by the source; use empty arrays when unsure.
 */
export const extractedExperienceSchema = z.object({
  company: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  body: z.string(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  /** Which source chunk (0-based) most supports this row, if applicable */
  source_chunk_index: z.number().int().min(0).optional(),
});

export const extractedProjectReceiptSchema = z.object({
  name: z.string(),
  problem: z.string().nullable().optional(),
  action: z.string().nullable().optional(),
  outcome: z.string().nullable().optional(),
  tech: z.string().nullable().optional(),
  source_chunk_index: z.number().int().min(0).optional(),
});

export const extractedBulletSchema = z.object({
  body: z.string(),
  category: z.string().nullable().optional(),
  source_chunk_index: z.number().int().min(0).optional(),
});

export const extractedSavedAnswerSchema = z.object({
  prompt_type: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  body: z.string(),
  source_chunk_index: z.number().int().min(0).optional(),
});

export const extractedTestimonialSchema = z.object({
  body: z.string(),
  attribution: z.string().nullable().optional(),
  source_chunk_index: z.number().int().min(0).optional(),
});

export const sourceExtractionResultSchema = z.object({
  experiences: z.array(extractedExperienceSchema).max(40),
  project_receipts: z.array(extractedProjectReceiptSchema).max(30),
  bullets: z.array(extractedBulletSchema).max(60),
  saved_answers: z.array(extractedSavedAnswerSchema).max(30),
  skills: z.array(z.string()).max(80),
  testimonials: z.array(extractedTestimonialSchema).max(20).optional(),
});

export type SourceExtractionResult = z.infer<typeof sourceExtractionResultSchema>;
export type ExtractedExperience = z.infer<typeof extractedExperienceSchema>;

export const SOURCE_EXTRACTION_SYSTEM_PROMPT = `You extract structured career evidence from raw text (resume, LinkedIn dump, cover letter, referral note, etc.).

Rules:
- Output a single JSON object matching the schema. No markdown fences.
- Do not invent employers, dates, metrics, or projects that are not clearly implied by the source. Prefer omission to hallucination.
- Split long work history into multiple experience objects when appropriate.
- "body" under experiences should be concrete accomplishments and scope, not generic fluff.
- skills: tools and technologies explicitly mentioned or clearly implied.
- testimonials: only quoted or clearly labeled recommendation/referral content.
- source_chunk_index: when a row mainly rests on one chunk, set its index (0-based) from the provided chunk list; omit if unclear.

Return JSON with keys: experiences, project_receipts, bullets, saved_answers, skills, testimonials (optional arrays).`;

export function parseSourceExtractionFromLlmJson(value: unknown): SourceExtractionResult {
  const parsed = sourceExtractionResultSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("Extraction JSON did not match the expected schema");
  }
  return parsed.data;
}
