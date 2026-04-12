import Link from "next/link";
import { signup } from "./actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; check_email?: string }>;
}) {
  const sp = await searchParams;

  if (sp.check_email) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
        <h1 className="text-2xl font-semibold">Check your email</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Confirm the link we sent (if your project requires email confirmation).
          You can also try signing in after a moment.
        </p>
        <Link className="underline" href="/login">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Create account</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          layerlane-apply — local evidence bank + job analysis
        </p>
      </div>
      <form action={signup} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            className="rounded border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Password
          <input
            className="rounded border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900"
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </label>
        {sp.error ? (
          <p className="text-sm text-red-600">Could not create account.</p>
        ) : null}
        <button
          type="submit"
          className="rounded bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Sign up
        </button>
      </form>
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        Already have an account?{" "}
        <Link className="underline" href="/login">
          Sign in
        </Link>
      </p>
    </div>
  );
}
