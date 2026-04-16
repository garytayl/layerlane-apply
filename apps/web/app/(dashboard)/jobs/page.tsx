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
          <h1 className="font-display text-2xl font-semibold tracking-tight">Jobs</h1>
          <p className="text-sm text-muted-foreground">Saved postings and analyses</p>
        </div>
        <Link
          href="/jobs/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          New job
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {(jobs ?? []).map((j) => (
          <li key={j.id}>
            <Link
              href={`/jobs/${j.id}`}
              className="block rounded-lg border border-border px-3 py-2 transition hover:bg-accent/50"
            >
              <span className="font-medium text-foreground">{j.title ?? "Untitled role"}</span>
              {j.company ? (
                <span className="text-muted-foreground"> — {j.company}</span>
              ) : null}
              <span className="ml-2 text-xs text-muted-foreground">{j.status}</span>
            </Link>
          </li>
        ))}
      </ul>
      {(!jobs || jobs.length === 0) && (
        <p className="text-sm text-muted-foreground">No jobs yet. Paste a JD to get started.</p>
      )}
    </div>
  );
}
