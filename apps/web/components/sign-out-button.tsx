"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type SignOutButtonProps = {
  className?: string;
};

export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={
        className ??
        "text-sm text-neutral-600 hover:underline dark:text-neutral-400"
      }
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
      }}
    >
      Sign out
    </button>
  );
}
