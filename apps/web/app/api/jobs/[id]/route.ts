import type { NextRequest } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { emptyCors, jsonWithCors } from "@/lib/api-cors";

export async function OPTIONS() {
  return emptyCors();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return jsonWithCors({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: job, error: jobError } = await admin
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (jobError || !job) {
    return jsonWithCors({ error: "Not found" }, { status: 404 });
  }

  const { data: analyses } = await admin
    .from("job_analyses")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  return jsonWithCors({ job, analyses: analyses ?? [] });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return jsonWithCors({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  let body: { status?: string; notes?: string | null };
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "Invalid JSON" }, { status: 400 });
  }

  const admin = createAdminClient();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.status !== undefined) updates.status = body.status;
  if (body.notes !== undefined) updates.notes = body.notes;

  const { error } = await admin
    .from("jobs")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return jsonWithCors({ error: error.message }, { status: 500 });
  }

  return jsonWithCors({ ok: true });
}
