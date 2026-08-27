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
  propose_claim: "proposals:write",
  stage_application_event: "proposals:write",
  stage_project_evidence: "proposals:write",
} as const satisfies Record<ChqBridgeOperation, ChqBridgeScope>;

export type ChqBridgeRequest = z.infer<typeof chqBridgeRequestSchema>;
export type ChqBridgeOperation = ChqBridgeRequest["operation"];
export type ChqBridgeScope = z.infer<typeof chqBridgeScopeSchema>;
