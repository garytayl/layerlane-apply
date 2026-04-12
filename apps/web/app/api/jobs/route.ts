import type { NextRequest } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { emptyCors, jsonWithCors } from "@/lib/api-cors";

export async function OPTIONS() {
  return emptyCors();
}

export async function GET(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return jsonWithCors({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jobs")
    .select("id, url, title, company, status, notes, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return jsonWithCors({ error: error.message }, { status: 500 });
  }

  return jsonWithCors({ jobs: data ?? [] });
}

export async function POST(request: NextRequest) {
  const userId = await getUserIdFromRequest(request);
  if (!userId) {
    return jsonWithCors({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    url?: string | null;
    title?: string | null;
    company?: string | null;
    raw_jd_text: string;
  };
  try {
    body = await request.json();
  } catch {
    return jsonWithCors({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw_jd_text = String(body.raw_jd_text ?? "").trim();
  if (!raw_jd_text) {
    return jsonWithCors({ error: "raw_jd_text is required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("jobs")
    .insert({
      user_id: userId,
      url: body.url ?? null,
      title: body.title ?? null,
      company: body.company ?? null,
      raw_jd_text,
      status: "saved",
    })
    .select("id")
    .single();

  if (error || !data) {
    return jsonWithCors({ error: error?.message ?? "Insert failed" }, { status: 500 });
  }

  return jsonWithCors({ id: data.id });
}
