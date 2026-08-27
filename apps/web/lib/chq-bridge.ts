import "server-only";

import {
  chqBridgeRequestSchema,
  chqBridgeScopeByOperation,
  chqBridgeScopeSchema,
  type ChqBridgeScope,
} from "@layerlane/core";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { getLocalLedgerDb, listBridgeClients, listBridgeRequestLogs } from "@/lib/local-ledger";
import {
  getApplicationPipeline,
  getCandidateProfile,
  getNeedsReview,
  getProjectEvidence,
  listExperience,
  searchEvidence,
} from "@/lib/chq-service";
import { queueSyncItem } from "@/lib/chq-sync";

export const bridgeOperationNames = Object.keys(chqBridgeScopeByOperation) as Array<keyof typeof chqBridgeScopeByOperation>;

type AuthenticatedBridgeClient = { id: string | null; name: string; scopes: ChqBridgeScope[]; bootstrap: boolean };
type AuditInput = { requestId: string; client?: AuthenticatedBridgeClient; operation?: string; outcome: string; statusCode: number; ipHash: string; sourceType?: string; sourceRef?: string; metadata?: Record<string, unknown> };

export class BridgeHttpError extends Error {
  constructor(public status: number, message: string, public requestId: string, public audited = false) { super(message); }
}

export function getBridgeMode() {
  const requested = process.env.CHQ_BRIDGE_MODE?.trim().toLowerCase();
  if (requested === "remote" && process.env.CHQ_BRIDGE_REMOTE_ENABLED === "true") return "remote" as const;
  return "local" as const;
}

export function isLoopbackHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1" || hostname === "[::1]";
}

function digest(value: string) { return createHash("sha256").update(value).digest("hex"); }
function safeEqual(left: string, right: string) {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function requestIpHash(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  return digest(`${process.env.CHQ_BRIDGE_AUDIT_SALT || "local-development"}:${forwarded}`);
}

async function writeAudit(input: AuditInput) {
  const db = await getLocalLedgerDb();
  await db.query(
    `insert into chq_bridge_request_log
      (id, request_id, client_id, client_name, operation, outcome, status_code,
       ip_hash, source_type, source_ref, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)`,
    [crypto.randomUUID(), input.requestId, input.client?.id || null, input.client?.name || null,
      input.operation || null, input.outcome, input.statusCode, input.ipHash,
      input.sourceType || null, input.sourceRef || null, JSON.stringify(input.metadata || {})],
  );
}

async function isRateLimited(client: AuthenticatedBridgeClient | undefined, ipHash: string) {
  const limit = Math.min(Math.max(Number(process.env.CHQ_BRIDGE_RATE_LIMIT || 60), 5), 600);
  const db = await getLocalLedgerDb();
  const result = client?.id
    ? await db.query<{ count: number }>("select count(*)::int as count from chq_bridge_request_log where client_id = $1 and created_at > now() - interval '1 minute'", [client.id])
    : await db.query<{ count: number }>("select count(*)::int as count from chq_bridge_request_log where ip_hash = $1 and created_at > now() - interval '1 minute'", [ipHash]);
  return (result.rows[0]?.count || 0) >= limit;
}

export async function authenticateBridgeRequest(request: Request, operation?: string) {
  const requestId = crypto.randomUUID();
  const ipHash = requestIpHash(request);
  const mode = getBridgeMode();
  const url = new URL(request.url);

  if (mode === "local" && !isLoopbackHostname(url.hostname)) {
    await writeAudit({ requestId, operation, outcome: "local_mode_rejected", statusCode: 403, ipHash });
    throw new BridgeHttpError(403, "Bridge is in local-only mode", requestId, true);
  }
  if (mode === "remote" && request.headers.get("x-forwarded-proto") !== "https") {
    await writeAudit({ requestId, operation, outcome: "tls_required", statusCode: 403, ipHash });
    throw new BridgeHttpError(403, "Secure remote mode requires HTTPS", requestId, true);
  }

  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  let client: AuthenticatedBridgeClient | undefined;

  const bootstrap = process.env.CHQ_BRIDGE_BOOTSTRAP_TOKEN?.trim();
  const bootstrapExpiry = process.env.CHQ_BRIDGE_BOOTSTRAP_EXPIRES_AT?.trim();
  if (mode === "local" && bootstrap && bootstrapExpiry && Date.parse(bootstrapExpiry) > Date.now() && safeEqual(token, bootstrap)) {
    client = { id: null, name: "Local bootstrap client", scopes: chqBridgeScopeSchema.options, bootstrap: true };
  } else if (token.startsWith("chq_client_")) {
    const separator = token.indexOf(".");
    const id = separator > 11 ? token.slice(11, separator) : "";
    if (/^[0-9a-f-]{36}$/i.test(id)) {
      const db = await getLocalLedgerDb();
      const result = await db.query<{ id: string; name: string; token_hash: string; scopes: string[] }>(
        `select id::text, name, token_hash, scopes from chq_bridge_clients
         where id = $1 and revoked_at is null and expires_at > now()`, [id],
      );
      const stored = result.rows[0];
      if (stored && safeEqual(digest(token), stored.token_hash)) {
        client = { id: stored.id, name: stored.name, scopes: stored.scopes.map((scope) => chqBridgeScopeSchema.parse(scope)), bootstrap: false };
      }
    }
  }

  if (!client) {
    if (await isRateLimited(undefined, ipHash)) {
      await writeAudit({ requestId, operation, outcome: "rate_limited", statusCode: 429, ipHash });
      throw new BridgeHttpError(429, "Bridge rate limit exceeded", requestId, true);
    }
    await writeAudit({ requestId, operation, outcome: "unauthorized", statusCode: 401, ipHash });
    throw new BridgeHttpError(401, "Unauthorized bridge client", requestId, true);
  }
  if (await isRateLimited(client, ipHash)) {
    await writeAudit({ requestId, client, operation, outcome: "rate_limited", statusCode: 429, ipHash });
    throw new BridgeHttpError(429, "Bridge rate limit exceeded", requestId, true);
  }
  if (client.id) {
    const db = await getLocalLedgerDb();
    await db.query("update chq_bridge_clients set last_used_at = now() where id = $1", [client.id]);
  }
  return { requestId, ipHash, client };
}

export async function executeBridgeRequest(raw: unknown, auth: Awaited<ReturnType<typeof authenticateBridgeRequest>>) {
  const request = chqBridgeRequestSchema.parse(raw);
  const requiredScope = chqBridgeScopeByOperation[request.operation];
  if (!auth.client.scopes.includes(requiredScope)) {
    await writeAudit({ ...auth, operation: request.operation, outcome: "scope_denied", statusCode: 403 });
    throw new BridgeHttpError(403, `Client lacks ${requiredScope}`, auth.requestId, true);
  }

  let result: unknown;
  switch (request.operation) {
    case "get_candidate_profile": result = await getCandidateProfile(); break;
    case "list_experience": result = await listExperience(); break;
    case "search_evidence": result = await searchEvidence(request.query); break;
    case "get_project_evidence": result = await getProjectEvidence(request.project_id); break;
    case "list_needs_review": result = await getNeedsReview(); break;
    case "get_application_pipeline": result = await getApplicationPipeline(); break;
    case "propose_claim":
      result = await queueSyncItem({ type: "career_claim", external_id: request.external_id,
        canonical_key: request.canonical_key, label: request.label, summary: request.summary,
        assertion_state: request.assertion_state, supports: true, source: request.source }, "chatgpt", auth.client.name); break;
    case "stage_application_event":
      result = await queueSyncItem({ type: "application_event", external_id: request.external_id,
        company: request.company, role: request.role, status: request.status,
        occurred_at: request.occurred_at, assertion_state: "proposed", supports: true,
        source: request.source }, "chatgpt", auth.client.name); break;
    case "stage_project_evidence": {
      if (!request.quote && !request.note) throw new BridgeHttpError(400, "quote or note is required", auth.requestId);
      const db = await getLocalLedgerDb();
      const project = await db.query<{ canonical_key: string }>("select canonical_key from career_ledger_records where id = $1 and kind = 'project'", [request.project_id]);
      if (!project.rows[0]) throw new BridgeHttpError(404, "Project not found", auth.requestId);
      result = await queueSyncItem({ type: "project_evidence", external_id: request.external_id,
        project_key: project.rows[0].canonical_key, quote: request.quote, note: request.note,
        supports: request.supports, assertion_state: "proposed", source: request.source }, "chatgpt", auth.client.name); break;
    }
  }

  const source = "source" in request ? request.source : undefined;
  await writeAudit({ ...auth, operation: request.operation, outcome: "success", statusCode: 200,
    sourceType: source?.type, sourceRef: source?.external_ref,
    metadata: { bootstrap: auth.client.bootstrap, required_scope: requiredScope } });
  return result;
}

export async function auditBridgeFailure(auth: Awaited<ReturnType<typeof authenticateBridgeRequest>>, operation: string | undefined, error: unknown, statusCode: number) {
  await writeAudit({ ...auth, operation, outcome: "request_failed", statusCode,
    metadata: { error: error instanceof Error ? error.message.slice(0, 500) : "Unknown error" } });
}

export async function auditBridgeSuccess(auth: Awaited<ReturnType<typeof authenticateBridgeRequest>>, operation: string) {
  await writeAudit({ ...auth, operation, outcome: "success", statusCode: 200,
    metadata: { bootstrap: auth.client.bootstrap } });
}

export async function createBridgeClient(name: string, scopes: string[], ttlHours: number) {
  const parsedScopes = Array.from(new Set(scopes.map((scope) => chqBridgeScopeSchema.parse(scope))));
  if (!name.trim()) throw new Error("Client name is required");
  if (!parsedScopes.length) throw new Error("At least one scope is required");
  const ttl = Math.min(Math.max(ttlHours, 1), 720);
  const expiresAt = new Date(Date.now() + ttl * 3_600_000).toISOString();
  const id = crypto.randomUUID();
  const token = `chq_client_${id}.${randomBytes(32).toString("base64url")}`;
  const db = await getLocalLedgerDb();
  await db.query(
    `insert into chq_bridge_clients (id, name, token_hash, scopes, expires_at)
     values ($1, $2, $3, $4, $5)`,
    [id, name.trim().slice(0, 200), digest(token), parsedScopes, expiresAt],
  );
  return { token, expires_at: expiresAt };
}

export async function revokeBridgeClient(id: string) {
  const db = await getLocalLedgerDb();
  await db.query("update chq_bridge_clients set revoked_at = now() where id = $1 and revoked_at is null", [id]);
}

export async function getBridgeDiagnostics() {
  const [clients, requests] = await Promise.all([listBridgeClients(), listBridgeRequestLogs()]);
  return { mode: getBridgeMode(), remote_enabled: process.env.CHQ_BRIDGE_REMOTE_ENABLED === "true",
    rate_limit_per_minute: Number(process.env.CHQ_BRIDGE_RATE_LIMIT || 60), clients, requests,
    failed_authorization_attempts: requests.filter((request) => request.outcome === "unauthorized").length };
}
