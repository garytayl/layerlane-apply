import Link from "next/link";
import { createJob } from "../actions";

export default function NewJobPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/jobs" className="text-sm text-neutral-600 hover:underline dark:text-neutral-400">
          ← Jobs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">New job</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Paste the job description. You can run analysis on the next screen.
        </p>
      </div>
      <form action={createJob} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          URL (optional)
          <input name="url" type="url" className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900" placeholder="https://..." />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input name="title" className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Company
            <input name="company" className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900" />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm">
          Job description *
          <textarea
            name="raw_jd_text"
            required
            rows={14}
            className="rounded border border-neutral-300 px-3 py-2 font-mono text-sm dark:border-neutral-600 dark:bg-neutral-900"
            placeholder="Paste full posting text…"
          />
        </label>
        <button
          type="submit"
          className="w-fit rounded bg-neutral-900 px-4 py-2 text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          Save & continue
        </button>
      </form>
    </div>
  );
}
