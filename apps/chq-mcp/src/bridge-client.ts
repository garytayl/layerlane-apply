const MAX_RESPONSE_BYTES = 1_048_576;

export const bridgeOperations = [
  "get_candidate_profile", "list_experience", "search_evidence", "get_project_evidence",
  "list_needs_review", "propose_claim", "stage_application_event",
  "stage_project_evidence", "get_application_pipeline", "propose_profile_update",
  "propose_education", "propose_experience", "propose_project", "propose_skills",
] as const;

export type BridgeOperation = (typeof bridgeOperations)[number];
export type BridgeRequest = { operation: BridgeOperation } & Record<string, unknown>;
export interface BridgeClient { call(request: BridgeRequest): Promise<unknown>; }
export interface BridgeClientConfig { url: string; token: string; allowRemote?: boolean; timeoutMs?: number; }

export function validateBridgeUrl(value: string, allowRemote = false): URL {
  const url = new URL(value);
  const loopback = url.hostname === "127.0.0.1" || url.hostname === "localhost" || url.hostname === "[::1]";
  if (!loopback && (!allowRemote || url.protocol !== "https:")) {
    throw new Error("CHQ bridge must be loopback, or explicitly allowed with HTTPS");
  }
  if (loopback && url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("CHQ bridge URL must use HTTP or HTTPS");
  }
  return url;
}

export function createBridgeClient(config: BridgeClientConfig): BridgeClient {
  const url = validateBridgeUrl(config.url, config.allowRemote);
  if (!config.token.trim()) throw new Error("CHQ_MCP_BRIDGE_TOKEN is required");
  return {
    async call(request) {
      if (!bridgeOperations.includes(request.operation)) throw new Error("Unsupported CHQ bridge operation");
      const response = await fetch(url, {
        method: "POST",
        headers: { authorization: `Bearer ${config.token}`, "content-type": "application/json" },
        body: JSON.stringify(request), redirect: "error",
        signal: AbortSignal.timeout(config.timeoutMs ?? 10_000),
      });
      const advertisedSize = Number(response.headers.get("content-length") ?? "0");
      if (advertisedSize > MAX_RESPONSE_BYTES) throw new Error("CHQ bridge response exceeded the size limit");
      const text = await response.text();
      if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) throw new Error("CHQ bridge response exceeded the size limit");
      let body: unknown;
      try { body = text ? JSON.parse(text) : null; } catch { throw new Error("CHQ bridge returned invalid JSON"); }
      if (!response.ok) {
        const message = typeof body === "object" && body && "error" in body ? String(body.error) : `HTTP ${response.status}`;
        throw new Error(`CHQ bridge rejected the request: ${message}`);
      }
      return typeof body === "object" && body && "result" in body ? body.result : body;
    },
  };
}
