import Link from "next/link";
import {
  AuthFieldLabel,
  AuthInput,
  AuthPageShell,
  AuthSubmitButton,
} from "@/components/auth-page-shell";
import { signup } from "./actions";

function MailIcon() {
  return (
    <svg
      className="h-7 w-7 text-emerald-600 dark:text-emerald-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
      />
    </svg>
  );
}

function decodeReason(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    check_email?: string;
    reason?: string;
    api_ok?: string;
    email_hint?: string;
  }>;
}) {
  const sp = await searchParams;
  const errorDetail = decodeReason(sp.reason);

  if (sp.check_email) {
    const apiOk = sp.api_ok === "1";
    const emailHint = sp.email_hint ? decodeReason(sp.email_hint) : null;

    return (
      <AuthPageShell
        eyebrow="Almost there"
        title="Confirm your email"
        description={
          <>
            We sent you a link. Open it on this device to activate your account,
            then come back and sign in. If nothing arrives in a minute or two,
            check your spam folder.
          </>
        }
        footer={
          <p className="text-center text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
            >
              Back to sign in
            </Link>
          </p>
        }
      >
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/12 ring-1 ring-emerald-600/20 dark:bg-emerald-400/10 dark:ring-emerald-400/25">
            <MailIcon />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The confirmation link expires after a while. If it does, request a new
            one by signing up again with the same email.
          </p>
        </div>

        <div className="mt-6 rounded-lg border border-border bg-muted/40 p-4 text-left text-sm text-muted-foreground">
          <p className="font-medium text-foreground">What we know from the app</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>
              Sign-up request to Supabase:{" "}
              <span className="font-medium text-foreground">
                {apiOk ? "succeeded (no API error)" : "unknown — try signing up again"}
              </span>
              .
            </li>
            {emailHint ? (
              <li>
                Address used: <span className="font-mono text-foreground">{emailHint}</span>
              </li>
            ) : null}
            <li>
              The confirmation email is sent by{" "}
              <strong className="text-foreground">Supabase Auth</strong>, not this Next.js
              app. If the step above succeeded, delivery is on Supabase/email provider (spam,
              rate limits, SMTP).
            </li>
          </ul>
          <p className="mt-3 text-xs leading-relaxed">
            In the Supabase dashboard: open{" "}
            <strong className="text-foreground">Logs</strong> in the left sidebar →{" "}
            <strong className="text-foreground">Auth</strong> (GoTrue / mailer errors). For
            signup events, use{" "}
            <strong className="text-foreground">Authentication</strong> →{" "}
            <strong className="text-foreground">Audit Logs</strong> (under Configuration) —
            look for <code className="text-foreground">user_confirmation_requested</code> or
            errors. Custom SMTP:{" "}
            <strong className="text-foreground">Project Settings → Authentication</strong>.
            See{" "}
            <a
              className="text-primary underline underline-offset-2"
              href="https://supabase.com/docs/guides/platform/logs"
              target="_blank"
              rel="noreferrer"
            >
              Supabase logging docs
            </a>
            .
          </p>
        </div>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      eyebrow="Create an account"
      title="Start tracking roles with context"
      description="Use your evidence bank and job analyses from the dashboard or the browser extension."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition hover:decoration-primary"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form action={signup} className="flex flex-col gap-5">
        <div>
          <AuthFieldLabel htmlFor="signup-email">Email</AuthFieldLabel>
          <AuthInput
            id="signup-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <AuthFieldLabel htmlFor="signup-password">Password</AuthFieldLabel>
          <AuthInput
            id="signup-password"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            placeholder="At least 6 characters"
          />
          <p className="mt-1.5 text-xs text-muted-foreground">
            Choose a strong password you do not reuse elsewhere.
          </p>
        </div>
        {sp.error ? (
          <div
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">Could not create your account</p>
            {errorDetail ? (
              <p className="mt-1 whitespace-pre-wrap break-words text-destructive/95">
                {errorDetail}
              </p>
            ) : (
              <p className="mt-1">
                Try again, or sign in if you already registered.
              </p>
            )}
          </div>
        ) : null}
        <AuthSubmitButton>Create account</AuthSubmitButton>
      </form>
    </AuthPageShell>
  );
}
