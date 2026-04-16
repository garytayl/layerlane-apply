import Link from "next/link";
import {
  AuthFieldLabel,
  AuthInput,
  AuthPageShell,
  AuthSubmitButton,
} from "@/components/auth-page-shell";
import { login } from "./actions";

function decodeReason(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reason?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/bank";
  const errorDetail = decodeReason(sp.reason);

  return (
    <AuthPageShell
      eyebrow="Welcome back"
      title="Sign in to layerlane-apply"
      description="Your evidence bank, saved jobs, and analyses are tied to this account."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          No account yet?{" "}
          <Link
            href="/signup"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
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
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">Sign in failed</p>
            {errorDetail ? (
              <p className="mt-1 whitespace-pre-wrap break-words text-destructive/95">
                {errorDetail}
              </p>
            ) : (
              <p className="mt-1">
                Check your email and password, or create an account.
              </p>
            )}
          </div>
        ) : null}
        <AuthSubmitButton>Sign in</AuthSubmitButton>
      </form>
    </AuthPageShell>
  );
}
