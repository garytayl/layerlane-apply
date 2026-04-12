import "server-only";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NextRequest } from "next/server";
import { createHash } from "crypto";

export function hashApiToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Resolve user id from cookie session or `Authorization: Bearer` API token. */
export async function getUserIdFromRequest(
  request: NextRequest,
): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const raw = authHeader.slice(7).trim();
    if (!raw) return null;
    const tokenHash = hashApiToken(raw);
    const admin = createAdminClient();
    const { data: row } = await admin
      .from("api_tokens")
      .select("id, user_id")
      .eq("token_hash", tokenHash)
      .maybeSingle();
    if (!row?.user_id) return null;
    await admin
      .from("api_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", row.id);
    return row.user_id as string;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
