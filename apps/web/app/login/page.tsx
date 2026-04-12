import Link from "next/link";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const next = sp.next ?? "/bank";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">layerlane-apply</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Sign in to your account
        </p>
      </div>
      <form action={login} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next} />
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
            autoComplete="current-password"
          />
        </label>
        {sp.error ? (
          <p className="text-sm text-red-600">Could not sign you in.</p>
        ) : null}
        <button
          type="submit"
          className="rounded bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Sign in
        </button>
      </form>
      <p className="text-center text-sm text-neutral-600 dark:text-neutral-400">
        No account?{" "}
        <Link className="underline" href="/signup">
          Sign up
        </Link>
      </p>
    </div>
  );
}
