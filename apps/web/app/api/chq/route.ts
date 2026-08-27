import { executeChqOperation } from "@/lib/chq-service";
import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { getBridgeMode, isLoopbackHostname } from "@/lib/chq-bridge";

export const runtime = "nodejs";

const operationNames = [
  "get_candidate_profile",
  "get_needs_review",
  "export_snapshot",
  "generate_resume_context",
  "list_experience",
  "search_evidence",
  "search_verified_evidence",
  "propose_career_claim",
  "record_application",
  "update_application_status",
  "add_project_evidence",
  "get_project_evidence",
  "list_unverified_claims",
  "list_conflicts",
  "ingest_source",
] as const;

function isAuthorized(request: Request) {
  if (getBridgeMode() !== "local") return false;
  if (!isLoopbackHostname(new URL(request.url).hostname)) return false;
  const expected = process.env.CHQ_TOOL_TOKEN?.trim();
  if (!expected) return false;
  const header = request.headers.get("authorization") || "";
  const supplied = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const expectedBytes = Buffer.from(expected);
  const suppliedBytes = Buffer.from(supplied);
  return (
    expectedBytes.length === suppliedBytes.length &&
    timingSafeEqual(expectedBytes, suppliedBytes)
  );
}

function unauthorizedResponse() {
  const configured = Boolean(process.env.CHQ_TOOL_TOKEN?.trim());
  return NextResponse.json(
    {
      error: configured ? "Unauthorized" : "CHQ tool API is disabled until CHQ_TOOL_TOKEN is configured",
    },
    { status: configured ? 401 : 503 },
  );
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  return NextResponse.json({
    name: "Career HQ tool API",
    version: 1,
    operations: operationNames,
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) return unauthorizedResponse();
  try {
    const body: unknown = await request.json();
    const operation = typeof body === "object" && body !== null && "operation" in body
      ? String(body.operation)
      : "";
    if (["confirm_claim", "reject_claim"].includes(operation)) {
      return NextResponse.json(
        { error: "Verification decisions are local-only and require the Needs Review workflow" },
        { status: 403 },
      );
    }
    const result = await executeChqOperation(body);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Invalid CHQ operation request", issues: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : "CHQ operation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
