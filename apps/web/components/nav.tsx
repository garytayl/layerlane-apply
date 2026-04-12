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
    <header className="border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <nav className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link className="font-medium hover:underline" href="/bank">
            Bank
          </Link>
          <Link className="hover:underline" href="/jobs">
            Jobs
          </Link>
          <Link className="hover:underline" href="/settings">
            Settings
          </Link>
        </div>
        <SignOutButton />
      </nav>
    </header>
  );
}
