import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeJobAction } from "../actions";
import { AnalyzeButton } from "./analyze-button";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!job) notFound();

  const { data: analyses } = await supabase
    .from("job_analyses")
    .select("*")
    .eq("job_id", id)
    .order("created_at", { ascending: false })
    .limit(1);

  const latest = analyses?.[0];

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div>
        <Link href="/jobs" className="text-sm text-neutral-600 hover:underline dark:text-neutral-400">
          ← Jobs
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{job.title ?? "Untitled role"}</h1>
        {job.company ? <p className="text-neutral-600 dark:text-neutral-400">{job.company}</p> : null}
        {job.url ? (
          <a href={job.url} className="text-sm text-blue-600 underline" target="_blank" rel="noreferrer">
            Open posting
          </a>
        ) : null}
      </div>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">Analysis</h2>
        {!latest ? (
          <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">No analysis yet.</p>
        ) : (
          <div className="mb-4 flex flex-col gap-3 rounded border border-neutral-200 p-4 dark:border-neutral-800">
            <p>
              <span className="text-neutral-500">Fit score:</span>{" "}
              <span className="text-lg font-semibold">{latest.fit_score ?? "—"}</span>
              <span className="text-neutral-500">/100</span>
            </p>
            <div>
              <p className="text-sm font-medium text-neutral-500">Summary</p>
              <p className="whitespace-pre-wrap">{latest.summary}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Why this role</p>
              <p className="whitespace-pre-wrap">{latest.why_role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-neutral-500">Ranked bullets</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5">
                {Array.isArray(latest.ranked_bullets)
                  ? (latest.ranked_bullets as { text?: string; relevance?: string }[]).map(
                      (b, i) => (
                        <li key={i}>
                          <p>{String(b.text ?? "")}</p>
                          <p className="text-sm text-neutral-500">{String(b.relevance ?? "")}</p>
                        </li>
                      ),
                    )
                  : null}
              </ol>
            </div>
          </div>
        )}
        <AnalyzeButton
          analyzeAction={analyzeJobAction.bind(null, id)}
          hasAnalysis={!!latest}
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-neutral-500">Raw JD</h2>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded border border-neutral-200 bg-neutral-50 p-4 text-sm dark:border-neutral-800 dark:bg-neutral-900">
          {job.raw_jd_text}
        </pre>
      </section>
    </div>
  );
}
