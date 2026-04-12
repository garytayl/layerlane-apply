"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function errRedirect(message: string) {
  const q = new URLSearchParams();
  q.set("error", "1");
  if (message) q.set("msg", message.slice(0, 400));
  redirect(`/signup?${q.toString()}`);
}

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${appUrl}/auth/callback`,
    },
  });

  if (error) {
    errRedirect(error.message);
  }

  // Email confirmations disabled in Supabase → session returned immediately; no email is sent.
  if (data.session) {
    redirect("/bank");
  }

  redirect("/signup?check_email=1");
}
