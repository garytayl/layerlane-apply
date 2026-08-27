import { z } from "zod";

export const chqBridgeScopeSchema = z.enum(["profile:read", "evidence:read", "review:read", "applications:read", "proposals:write"]);

const sourceSchema = z.object({
  type: z.enum(["chatgpt_library", "gmail", "github", "user", "other"]),
  title: z.string().trim().min(1).max(300),
  external_ref: z.string().trim().max(2_000).optional(),
  timestamp: z.string().datetime().optional(),
});

export const chqBridgeRequestSchema = z.discriminatedUnion("operation", [
  z.object({ operation: z.literal("get_candidate_profile") }),
  z.object({ operation: z.literal("list_experience") }),
  z.object({ operation: z.literal("search_evidence"), query: z.string().trim().min(1).max(200) }),
  z.object({ operation: z.literal("get_project_evidence"), project_id: z.string().uuid() }),
  z.object({ operation: z.literal("list_needs_review") }),
  z.object({ operation: z.literal("get_application_pipeline") }),
  z.object({ operation: z.literal("propose_profile_update"), external_id: z.string().trim().min(1).max(300), canonical_key: z.string().trim().min(1).max(500).default("identity:primary-profile"), name: z.string().trim().min(1).max(500), primary_email: z.string().email().max(500).optional(), phone: z.string().trim().max(100).optional(), portfolio_url: z.string().trim().max(2_000).optional(), source: sourceSchema }),
  z.object({ operation: z.literal("propose_education"), external_id: z.string().trim().min(1).max(300), canonical_key: z.string().trim().min(1).max(500), institution: z.string().trim().min(1).max(500), degree: z.string().trim().min(1).max(500), major: z.string().trim().max(500).optional(), concentration: z.string().trim().max(500).optional(), graduation_date: z.string().trim().max(100).optional(), gpa: z.string().trim().max(50).optional(), source: sourceSchema }),
  z.object({ operation: z.literal("propose_experience"), external_id: z.string().trim().min(1).max(300), canonical_key: z.string().trim().min(1).max(500), employer: z.string().trim().min(1).max(500), title: z.string().trim().min(1).max(500), location: z.string().trim().max(500).optional(), start_date: z.string().trim().max(100).optional(), end_date: z.string().trim().max(100).optional(), is_current: z.boolean().default(false), responsibilities: z.array(z.string().trim().min(1).max(2_000)).max(100).default([]), source: sourceSchema }),
  z.object({ operation: z.literal("propose_project"), external_id: z.string().trim().min(1).max(300), canonical_key: z.string().trim().min(1).max(500), project_name: z.string().trim().min(1).max(500), project_status: z.string().trim().max(200).optional(), project_url: z.string().trim().max(2_000).optional(), technologies: z.array(z.string().trim().min(1).max(200)).max(100).default([]), summary: z.string().trim().max(10_000).optional(), source: sourceSchema }),
  z.object({ operation: z.literal("propose_skills"), external_id: z.string().trim().min(1).max(300), canonical_key: z.string().trim().min(1).max(500).default("skills:proposed-set"), skills: z.array(z.string().trim().min(1).max(200)).min(1).max(100), source: sourceSchema }),
  z.object({
    operation: z.literal("propose_claim"),
    external_id: z.string().trim().min(1).max(300),
    canonical_key: z.string().trim().min(1).max(500),
    label: z.string().trim().min(1).max(500),
    summary: z.string().trim().min(1).max(10_000),
    assertion_state: z.enum(["proposed", "user_confirmed"]).default("proposed"),
    source: sourceSchema,
  }),
  z.object({
    operation: z.literal("stage_application_event"),
    external_id: z.string().trim().min(1).max(300),
    company: z.string().trim().min(1).max(500),
    role: z.string().trim().min(1).max(500),
    status: z.string().trim().min(1).max(200),
    occurred_at: z.string().datetime().optional(),
    source: sourceSchema,
  }),
  z.object({
    operation: z.literal("stage_project_evidence"),
    external_id: z.string().trim().min(1).max(300),
    project_id: z.string().uuid(),
    quote: z.string().trim().min(1).max(20_000).optional(),
    note: z.string().trim().min(1).max(10_000).optional(),
    supports: z.boolean().default(true),
    source: sourceSchema,
  }),
]);

export const chqBridgeScopeByOperation = {
  get_candidate_profile: "profile:read",
  list_experience: "profile:read",
  search_evidence: "evidence:read",
  get_project_evidence: "evidence:read",
  list_needs_review: "review:read",
  get_application_pipeline: "applications:read",
  propose_profile_update: "proposals:write",
  propose_education: "proposals:write",
  propose_experience: "proposals:write",
  propose_project: "proposals:write",
  propose_skills: "proposals:write",
  propose_claim: "proposals:write",
  stage_application_event: "proposals:write",
  stage_project_evidence: "proposals:write",
} as const satisfies Record<ChqBridgeOperation, ChqBridgeScope>;

export type ChqBridgeRequest = z.infer<typeof chqBridgeRequestSchema>;
export type ChqBridgeOperation = ChqBridgeRequest["operation"];
export type ChqBridgeScope = z.infer<typeof chqBridgeScopeSchema>;
