import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  // Email confirm links sometimes hit the Site URL root (?code=...) instead of /auth/callback.
  // Forward so PKCE exchange runs in app/auth/callback/route.ts.
  const code = typeof sp.code === "string" ? sp.code : undefined;
  if (code) {
    const qs = new URLSearchParams({ code });
    const next = typeof sp.next === "string" ? sp.next : undefined;
    if (next) qs.set("next", next);
    redirect(`/auth/callback?${qs.toString()}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    redirect("/bank");
  }
  redirect("/login");
}
