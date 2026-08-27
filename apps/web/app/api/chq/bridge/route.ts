import { BridgeHttpError, auditBridgeFailure, auditBridgeSuccess, authenticateBridgeRequest, bridgeOperationNames, executeBridgeRequest } from "@/lib/chq-bridge";
import { NextResponse } from "next/server";
import { ZodError } from "zod";

export const runtime = "nodejs";
const MAX_BODY_BYTES = 64 * 1024;

function operationFrom(value: unknown) {
  return typeof value === "object" && value !== null && "operation" in value ? String(value.operation).slice(0, 100) : undefined;
}

function errorResponse(error: BridgeHttpError) {
  return NextResponse.json({ error: error.message, request_id: error.requestId }, { status: error.status, headers: { "Cache-Control": "no-store" } });
}

export async function GET(request: Request) {
  try {
    const auth = await authenticateBridgeRequest(request, "describe_bridge");
    await auditBridgeSuccess(auth, "describe_bridge");
    return NextResponse.json({ name: "Career HQ External Dev Bridge", version: 1, operations: bridgeOperationNames,
      client: { name: auth.client.name, scopes: auth.client.scopes } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BridgeHttpError) return errorResponse(error);
    return NextResponse.json({ error: "Bridge request failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let auth: Awaited<ReturnType<typeof authenticateBridgeRequest>> | undefined;
  let operation: string | undefined;
  try {
    auth = await authenticateBridgeRequest(request);
    const length = Number(request.headers.get("content-length") || 0);
    if (length > MAX_BODY_BYTES) throw new BridgeHttpError(413, "Request body too large", auth.requestId);
    const text = await request.text();
    if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) throw new BridgeHttpError(413, "Request body too large", auth.requestId);
    const body: unknown = JSON.parse(text);
    operation = operationFrom(body);
    const result = await executeBridgeRequest(body, auth);
    return NextResponse.json({ ok: true, request_id: auth.requestId, result }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof BridgeHttpError) {
      if (auth && !error.audited) await auditBridgeFailure(auth, operation, error, error.status);
      return errorResponse(error);
    }
    const status = error instanceof SyntaxError || error instanceof ZodError ? 400 : 500;
    if (auth) await auditBridgeFailure(auth, operation, error, status);
    return NextResponse.json({ error: status === 400 ? "Invalid bridge request" : "Bridge request failed",
      request_id: auth?.requestId, ...(error instanceof ZodError ? { issues: error.issues } : {}) }, { status });
  }
}
