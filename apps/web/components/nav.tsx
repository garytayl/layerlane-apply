import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export async function Nav() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <Link
            className="font-medium text-foreground transition-colors hover:text-foreground/80"
            href="/bank"
          >
            Bank
          </Link>
          <Link
            className="text-muted-foreground transition-colors hover:text-foreground"
            href="/jobs"
          >
            Jobs
          </Link>
          <Link
            className="text-muted-foreground transition-colors hover:text-foreground"
            href="/settings"
          >
            Settings
          </Link>
        </div>
        <SignOutButton />
      </nav>
    </header>
  );
}
