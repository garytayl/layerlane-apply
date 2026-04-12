import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function JobsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            Saved postings and analyses
          </p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900"
        >
          New job
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {(jobs ?? []).map((j) => (
          <li key={j.id}>
            <Link href={`/jobs/${j.id}`} className="block rounded border border-neutral-200 px-3 py-2 hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900">
              <span className="font-medium">{j.title ?? "Untitled role"}</span>
              {j.company ? <span className="text-neutral-600 dark:text-neutral-400"> — {j.company}</span> : null}
              <span className="ml-2 text-xs text-neutral-500">{j.status}</span>
            </Link>
          </li>
        ))}
      </ul>
      {(!jobs || jobs.length === 0) && (
        <p className="text-sm text-neutral-600 dark:text-neutral-400">No jobs yet. Paste a JD to get started.</p>
      )}
    </div>
  );
}
