"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { hashApiToken } from "@/lib/auth";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return { supabase, user };
}

export async function updatePrefs(formData: FormData) {
  const { supabase, user } = await requireUser();
  const tone = String(formData.get("tone") ?? "");
  const target_roles = String(formData.get("target_roles") ?? "");
  const prefs = {
    tone: tone || undefined,
    target_roles: target_roles
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean),
  };
  await supabase
    .from("profiles")
    .update({ prefs, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  revalidatePath("/settings");
}

export async function createApiToken(
  _prev: { token?: string; error?: string } | null,
  _formData: FormData,
): Promise<{ token?: string; error?: string }> {
  void _prev;
  void _formData;
  try {
    const { user } = await requireUser();
    const raw = randomBytes(32).toString("hex");
    const token_hash = hashApiToken(raw);
    const admin = createAdminClient();
    const { error } = await admin.from("api_tokens").insert({
      user_id: user.id,
      token_hash,
      label: "Browser extension",
    });
    if (error) {
      return { error: error.message };
    }
    revalidatePath("/settings");
    return { token: raw };
  } catch {
    return { error: "Could not create token" };
  }
}

export async function deleteApiToken(formData: FormData) {
  const { user } = await requireUser();
  const id = String(formData.get("id") ?? "");
  const admin = createAdminClient();
  await admin.from("api_tokens").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/settings");
}
