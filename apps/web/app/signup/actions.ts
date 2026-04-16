"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "your address";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!domain) return "your address";
  const safe =
    local.length <= 2 ? "**" : `${local[0]!}***${local.slice(-1)}`;
  return `${safe}@${domain}`;
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${baseUrl}/auth/callback`,
    },
  });

  if (error) {
    console.error("[auth signup] supabase error", {
      message: error.message,
      status: error.status,
      name: error.name,
    });
    const reason = encodeURIComponent(error.message.slice(0, 500));
    redirect(`/signup?error=1&reason=${reason}`);
  }

  console.log("[auth signup] success", {
    hasSession: !!data.session,
    hasUser: !!data.user,
    emailConfirmedAt: data.user?.email_confirmed_at ?? null,
    domain: email.includes("@") ? email.split("@")[1] : null,
  });

  if (data.session) {
    redirect("/bank");
  }

  const qs = new URLSearchParams({
    check_email: "1",
    api_ok: "1",
  });
  if (email) {
    qs.set("email_hint", encodeURIComponent(maskEmail(email)));
  }
  redirect(`/signup?${qs.toString()}`);
}
