import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BridgeClient, BridgeRequest } from "./bridge-client.js";

const source = {
  type: z.enum(["chatgpt_library", "gmail", "github", "user", "other"]),
  title: z.string().trim().min(1).max(300),
  external_ref: z.string().trim().max(2_000).optional(),
  timestamp: z.string().datetime().optional(),
};
const readAnnotations = { readOnlyHint: true, destructiveHint: false, openWorldHint: false } as const;
const stageAnnotations = { readOnlyHint: false, destructiveHint: false, openWorldHint: false } as const;
const wrap = (value: unknown) => ({
  content: [{ type: "text" as const, text: JSON.stringify(value) }],
  structuredContent: { result: value },
});

export function createCareerHqMcpServer(bridge: BridgeClient): McpServer {
  const server = new McpServer(
    { name: "career-hq", version: "0.1.0" },
    { instructions: "Career HQ is canonical. Read tools retrieve career data. Write tools only stage proposed items for local Needs Review. Never claim staged data is verified. No deletion, verification, autofill, raw database, filesystem, or generic proxy capability is available." },
  );
  const read = (name: string, description: string, inputSchema: Record<string, z.ZodTypeAny>, make: (args: Record<string, unknown>) => BridgeRequest) =>
    server.registerTool(name, { description, inputSchema, annotations: readAnnotations }, async (args) => wrap(await bridge.call(make(args))));
  const stage = (name: string, description: string, inputSchema: Record<string, z.ZodTypeAny>, make: (args: Record<string, unknown>) => BridgeRequest) =>
    server.registerTool(name, { description, inputSchema, annotations: stageAnnotations }, async (args) => wrap(await bridge.call(make(args))));

  read("get_candidate_profile", "Get the canonical candidate profile.", {}, () => ({ operation: "get_candidate_profile" }));
  read("list_experience", "List canonical work experience records.", {}, () => ({ operation: "list_experience" }));
  read("search_evidence", "Search bounded Career HQ evidence text.", { query: z.string().trim().min(1).max(200) }, (a) => ({ operation: "search_evidence", ...a }));
  read("get_project_evidence", "Get evidence for one project by UUID.", { project_id: z.string().uuid() }, (a) => ({ operation: "get_project_evidence", ...a }));
  read("list_needs_review", "List staged items awaiting local review.", {}, () => ({ operation: "list_needs_review" }));
  read("get_application_pipeline", "Get applications and their status history.", {}, () => ({ operation: "get_application_pipeline" }));
  stage("propose_claim", "Stage a career claim for local Needs Review; this never verifies it.", {
    external_id: z.string().trim().min(1).max(300), canonical_key: z.string().trim().min(1).max(500),
    label: z.string().trim().min(1).max(500), summary: z.string().trim().min(1).max(10_000),
    assertion_state: z.enum(["proposed", "user_confirmed"]).default("proposed"), source: z.object(source).strict(),
  }, (a) => ({ operation: "propose_claim", ...a }));
  stage("stage_application_event", "Stage an application event for local Needs Review; this does not directly update the pipeline.", {
    external_id: z.string().trim().min(1).max(300), company: z.string().trim().min(1).max(500),
    role: z.string().trim().min(1).max(500), status: z.string().trim().min(1).max(200),
    occurred_at: z.string().datetime().optional(), source: z.object(source).strict(),
  }, (a) => ({ operation: "stage_application_event", ...a }));
  stage("stage_project_evidence", "Stage project evidence for local Needs Review; this never verifies it.", {
    external_id: z.string().trim().min(1).max(300), project_id: z.string().uuid(),
    quote: z.string().trim().min(1).max(20_000).optional(), note: z.string().trim().min(1).max(10_000).optional(),
    supports: z.boolean().default(true), source: z.object(source).strict(),
  }, (a) => ({ operation: "stage_project_evidence", ...a }));
  return server;
}
