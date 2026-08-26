import { z } from "zod";

export const chqSourceKindSchema = z.enum([
  "resume",
  "chatgpt_library",
  "gmail",
  "github",
  "user",
  "linkedin_export",
  "indeed_export",
  "other",
]);

export const chqOperationRequestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("get_candidate_profile") }),
  z.object({ operation: z.literal("list_experience") }),
  z.object({
    operation: z.literal("search_evidence"),
    query: z.string().min(1).max(200),
  }),
  z.object({
    operation: z.literal("get_project_evidence"),
    project_id: z.string().uuid(),
  }),
  z.object({ operation: z.literal("list_unverified_claims") }),
  z.object({ operation: z.literal("list_conflicts") }),
  z.object({
    operation: z.literal("confirm_claim"),
    claim_id: z.string().uuid(),
    rationale: z.string().min(1).max(2_000),
    confidence: z.number().min(0).max(1).default(1),
  }),
  z.object({
    operation: z.literal("reject_claim"),
    claim_id: z.string().uuid(),
    rationale: z.string().min(1).max(2_000),
  }),
  z.object({
    operation: z.literal("ingest_source"),
    kind: chqSourceKindSchema,
    title: z.string().min(1).max(300),
    content: z.string().min(1).max(500_000),
    external_ref: z.string().max(2_000).optional(),
  }),
]);

export type ChqSourceKind = z.infer<typeof chqSourceKindSchema>;
export type ChqOperationRequest = z.infer<typeof chqOperationRequestSchema>;
export type ChqOperationName = ChqOperationRequest["operation"];
