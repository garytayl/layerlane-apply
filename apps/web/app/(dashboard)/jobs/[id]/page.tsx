import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { analyzeJobAction } from "../actions";
import { AnalyzeButton } from "./analyze-button";
import { JobPipelineForm } from "./job-pipeline-form";

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
        <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
          ← Jobs
        </Link>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">
          {job.title ?? "Untitled role"}
        </h1>
        {job.company ? <p className="text-muted-foreground">{job.company}</p> : null}
        {job.url ? (
          <a
            href={job.url}
            className="text-sm text-primary underline underline-offset-4"
            target="_blank"
            rel="noreferrer"
          >
            Open posting
          </a>
        ) : null}
      </div>

      <JobPipelineForm
        jobId={id}
        initialStatus={job.status ?? "saved"}
        initialNotes={job.notes}
      />

      <section>
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Analysis</h2>
        {!latest ? (
          <p className="mb-4 text-sm text-muted-foreground">No analysis yet.</p>
        ) : (
          <div className="mb-4 flex flex-col gap-3 rounded-lg border border-border bg-card/50 p-4">
            <p>
              <span className="text-muted-foreground">Fit score:</span>{" "}
              <span className="text-lg font-semibold text-foreground">{latest.fit_score ?? "—"}</span>
              <span className="text-muted-foreground">/100</span>
            </p>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Summary</p>
              <p className="whitespace-pre-wrap text-foreground">{latest.summary}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Why this role</p>
              <p className="whitespace-pre-wrap text-foreground">{latest.why_role}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Ranked bullets</p>
              <ol className="mt-2 list-decimal space-y-2 pl-5 text-foreground">
                {Array.isArray(latest.ranked_bullets)
                  ? (latest.ranked_bullets as { text?: string; relevance?: string }[]).map(
                      (b, i) => (
                        <li key={i}>
                          <p>{String(b.text ?? "")}</p>
                          <p className="text-sm text-muted-foreground">{String(b.relevance ?? "")}</p>
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
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-muted-foreground">Raw JD</h2>
        <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-lg border border-border bg-muted/50 p-4 text-sm text-foreground">
          {job.raw_jd_text}
        </pre>
      </section>
    </div>
  );
}
