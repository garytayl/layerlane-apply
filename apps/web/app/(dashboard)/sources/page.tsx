import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

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
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border px-3 py-2 transition hover:bg-accent/50"
            >
              <span className="font-medium text-foreground">{d.title ?? "Untitled"}</span>
              <span className="text-xs text-muted-foreground">
                {d.kind} · {d.extraction_status}
              </span>
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
