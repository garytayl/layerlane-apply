import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { labelSourceKind } from "./kinds";

function statusStyle(status: string): string {
  switch (status) {
    case "ready":
      return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
    case "failed":
      return "bg-destructive/15 text-destructive";
    case "running":
      return "bg-amber-500/15 text-amber-900 dark:text-amber-100";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function SourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: docs } = await supabase
    .from("source_documents")
    .select("id, title, kind, extraction_status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">Sources</h1>
          <p className="text-sm text-muted-foreground">
            Paste or upload career text, run extraction, then promote rows into your evidence bank.
          </p>
        </div>
        <Link
          href="/sources/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Add source
        </Link>
      </div>

      <ul className="flex flex-col gap-2">
        {(docs ?? []).map((d) => (
          <li key={d.id}>
            <Link
              href={`/sources/${d.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 transition hover:bg-accent/50"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">{d.title ?? "Untitled"}</span>
                <time
                  className="mt-0.5 block text-xs text-muted-foreground"
                  dateTime={d.created_at ?? undefined}
                >
                  {d.created_at
                    ? new Date(d.created_at).toLocaleString(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : ""}
                </time>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <span className="rounded-full border border-border bg-background px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {labelSourceKind(d.kind)}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${statusStyle(d.extraction_status)}`}
                >
                  {d.extraction_status}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      {(!docs || docs.length === 0) && (
        <p className="text-sm text-muted-foreground">
          No sources yet. Add a resume paste or cover letter to get structured extractions.
        </p>
      )}
    </div>
  );
}
