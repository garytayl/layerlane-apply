import Link from "next/link";
import {
  AuthFieldLabel,
  AuthInput,
  AuthPageShell,
  AuthSubmitButton,
} from "@/components/auth-page-shell";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/bank";

  return (
    <AuthPageShell
      eyebrow="Welcome back"
      title="Sign in to layerlane-apply"
      description="Your evidence bank, saved jobs, and analyses are tied to this account."
      footer={
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          No account yet?{" "}
          <Link
            href="/signup"
            className="font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 transition hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-neutral-100"
          >
            Create one
          </Link>
        </p>
      }
    >
      <form action={login} className="flex flex-col gap-5">
        <input type="hidden" name="next" value={next} />
        <div>
          <AuthFieldLabel htmlFor="login-email">Email</AuthFieldLabel>
          <AuthInput
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <AuthFieldLabel htmlFor="login-password">Password</AuthFieldLabel>
          <AuthInput
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="Your password"
          />
        </div>
        {sp.error ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            Those credentials did not work. Check your email and password, or
            create an account.
          </div>
        ) : null}
        <AuthSubmitButton>Sign in</AuthSubmitButton>
      </form>
    </AuthPageShell>
  );
}
