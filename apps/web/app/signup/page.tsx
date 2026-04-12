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

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check_email?: string; msg?: string }>;
}) {
  const sp = await searchParams;
  const errMsg = typeof sp.msg === "string" ? sp.msg : undefined;

  if (sp.check_email) {
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
          <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
            <Link
              href="/login"
              className="font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 transition hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-neutral-100"
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
          <p className="text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
            The confirmation link expires after a while. If it does, request a new
            one by signing up again with the same email.
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
        <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-neutral-900 underline decoration-neutral-400 underline-offset-4 transition hover:decoration-neutral-900 dark:text-neutral-100 dark:decoration-neutral-600 dark:hover:decoration-neutral-100"
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
          <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-500">
            Choose a strong password you do not reuse elsewhere.
          </p>
        </div>
        {sp.error ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {errMsg ? (
              <span className="whitespace-pre-wrap">{errMsg}</span>
            ) : (
              <>
                We could not create your account. Try again, or sign in if you
                already registered.
              </>
            )}
          </div>
        ) : null}
        <AuthSubmitButton>Create account</AuthSubmitButton>
      </form>
    </AuthPageShell>
  );
}
