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

export const chqAssertionStateSchema = z.enum(["proposed", "user_confirmed"]);
export const chqInboxItemTypeSchema = z.enum([
  "profile_update",
  "education_proposal",
  "experience_proposal",
  "project_proposal",
  "skill_proposal",
  "career_claim",
  "application_event",
  "project_evidence",
]);

const syncSourceSchema = z.object({
  type: chqSourceKindSchema,
  title: z.string().min(1).max(300),
  external_ref: z.string().max(2_000).optional(),
  timestamp: z.string().datetime().optional(),
});

export const chqSyncItemSchema = z.object({
  type: chqInboxItemTypeSchema,
  external_id: z.string().max(300).optional(),
  assertion_state: chqAssertionStateSchema.default("proposed"),
  canonical_key: z.string().max(500).optional(),
  label: z.string().max(500).optional(),
  summary: z.string().max(10_000).optional(),
  name: z.string().max(500).optional(),
  primary_email: z.string().email().max(500).optional(),
  phone: z.string().max(100).optional(),
  portfolio_url: z.string().max(2_000).optional(),
  institution: z.string().max(500).optional(),
  degree: z.string().max(500).optional(),
  major: z.string().max(500).optional(),
  concentration: z.string().max(500).optional(),
  graduation_date: z.string().max(100).optional(),
  gpa: z.string().max(50).optional(),
  employer: z.string().max(500).optional(),
  title: z.string().max(500).optional(),
  location: z.string().max(500).optional(),
  start_date: z.string().max(100).optional(),
  end_date: z.string().max(100).optional(),
  is_current: z.boolean().optional(),
  responsibilities: z.array(z.string().max(2_000)).max(100).optional(),
  project_name: z.string().max(500).optional(),
  project_status: z.string().max(200).optional(),
  project_url: z.string().max(2_000).optional(),
  technologies: z.array(z.string().max(200)).max(100).optional(),
  skills: z.array(z.string().max(200)).max(100).optional(),
  company: z.string().max(500).optional(),
  role: z.string().max(500).optional(),
  application_id: z.string().uuid().optional(),
  status: z.string().max(200).optional(),
  occurred_at: z.string().datetime().optional(),
  project_key: z.string().max(500).optional(),
  quote: z.string().max(20_000).optional(),
  note: z.string().max(10_000).optional(),
  supports: z.boolean().default(true),
  source: syncSourceSchema,
});

export const chqSyncEnvelopeSchema = z.object({
  version: z.literal(1),
  producer: z.object({
    type: z.enum(["chatgpt", "codex", "user", "gmail", "github", "other"]),
    name: z.string().max(200).optional(),
  }),
  exported_at: z.string().datetime().optional(),
  items: z.array(chqSyncItemSchema).min(1).max(1_000),
});

export const chqOperationRequestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("get_candidate_profile") }),
  z.object({ operation: z.literal("get_needs_review") }),
  z.object({ operation: z.literal("export_snapshot") }),
  z.object({ operation: z.literal("generate_resume_context") }),
  z.object({ operation: z.literal("list_experience") }),
  z.object({
    operation: z.literal("search_evidence"),
    query: z.string().min(1).max(200),
  }),
  z.object({
    operation: z.literal("search_verified_evidence"),
    query: z.string().min(1).max(200),
  }),
  z.object({
    operation: z.literal("propose_career_claim"),
    external_id: z.string().max(300).optional(),
    canonical_key: z.string().min(1).max(500),
    label: z.string().min(1).max(500),
    summary: z.string().min(1).max(10_000),
    assertion_state: chqAssertionStateSchema.default("proposed"),
    source: syncSourceSchema,
  }),
  z.object({
    operation: z.literal("record_application"),
    external_id: z.string().max(300).optional(),
    company: z.string().min(1).max(500),
    role: z.string().min(1).max(500),
    status: z.string().min(1).max(200).default("applied"),
    occurred_at: z.string().datetime().optional(),
    source: syncSourceSchema,
  }),
  z.object({
    operation: z.literal("update_application_status"),
    external_id: z.string().max(300).optional(),
    application_id: z.string().uuid(),
    status: z.string().min(1).max(200),
    occurred_at: z.string().datetime().optional(),
    source: syncSourceSchema,
  }),
  z.object({
    operation: z.literal("add_project_evidence"),
    external_id: z.string().max(300).optional(),
    project_id: z.string().uuid(),
    quote: z.string().max(20_000).optional(),
    note: z.string().max(10_000).optional(),
    supports: z.boolean().default(true),
    source: syncSourceSchema,
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
export type ChqSyncEnvelope = z.infer<typeof chqSyncEnvelopeSchema>;
export type ChqSyncItem = z.infer<typeof chqSyncItemSchema>;
export type ChqOperationRequest = z.infer<typeof chqOperationRequestSchema>;
export type ChqOperationName = ChqOperationRequest["operation"];
