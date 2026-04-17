import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sourceExtractionResultSchema } from "@layerlane/core";
import { createClient } from "@/lib/supabase/server";
import {
  deleteSourceDocument,
  promoteBulletFromSource,
  promoteExperienceFromSource,
  promoteProjectFromSource,
  promoteSavedAnswerFromSource,
  promoteTestimonialFromSource,
} from "../actions";
import { labelSourceKind } from "../kinds";
import { SourceExtractForm } from "../source-extract-form";

function statusBadgeClass(status: string): string {
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

export default async function SourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: doc } = await supabase
    .from("source_documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!doc) notFound();

  const parsed = sourceExtractionResultSchema.safeParse(doc.extraction_payload);
  const extraction = parsed.success ? parsed.data : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground">
          ← Sources
        </Link>
        <div className="mt-3 flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              {doc.title ?? "Source"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full border border-border bg-background px-2 py-0.5 font-medium text-foreground">
                {labelSourceKind(doc.kind)}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 font-medium capitalize ${statusBadgeClass(doc.extraction_status)}`}
              >
                {doc.extraction_status}
              </span>
              {doc.model ? <span className="text-muted-foreground">{doc.model}</span> : null}
            </div>
          </div>
          <SourceExtractForm documentId={doc.id} />
        </div>
        {doc.extraction_error ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {doc.extraction_error}
          </p>
        ) : null}
        {doc.extraction_status === "ready" && doc.extraction_payload && !parsed.success ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            Stored extraction does not match the current format. Run extraction again.
          </p>
        ) : null}
      </div>

      <details className="rounded-lg border border-border bg-muted/20">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
          <span className="text-muted-foreground">Original text</span>
          <span className="ml-2 text-xs font-normal text-muted-foreground">(tap to expand)</span>
        </summary>
        <pre className="max-h-72 overflow-auto border-t border-border bg-background/50 px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          {doc.raw_text}
        </pre>
      </details>

      {doc.extraction_status === "ready" && extraction ? (
        <div className="flex flex-col gap-3">
          {extraction.skills.length > 0 ? (
            <div className="rounded-lg border border-border bg-card/50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</p>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground">{extraction.skills.join(" · ")}</p>
            </div>
          ) : null}

          <ExtractionSection
            title="Experience"
            documentId={doc.id}
            empty="No experience rows extracted."
            items={extraction.experiences.map((e, i) => ({
              key: `ex-${i}`,
              body: (
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    {(e.title ?? "Role") + (e.company ? ` · ${e.company}` : "")}
                  </p>
                  {(e.start_date || e.end_date) && (
                    <p className="text-xs text-muted-foreground">
                      {e.start_date ?? "?"} — {e.end_date ?? "?"}
                    </p>
                  )}
                  <p className="mt-1.5 whitespace-pre-wrap text-foreground/90">{e.body}</p>
                  {e.source_chunk_index != null && (
                    <p className="mt-1 text-[11px] text-muted-foreground">Chunk {e.source_chunk_index}</p>
                  )}
                </div>
              ),
              action: promoteExperienceFromSource,
              index: i,
            }))}
          />

          <ExtractionSection
            title="Projects"
            documentId={doc.id}
            empty="No project rows extracted."
            items={extraction.project_receipts.map((p, i) => ({
              key: `pr-${i}`,
              body: (
                <div className="text-sm">
                  <p className="font-medium text-foreground">{p.name}</p>
                  {[p.problem, p.action, p.outcome].map((line, idx) =>
                    line ? (
                      <p key={idx} className="mt-1 whitespace-pre-wrap text-foreground/90">
                        {line}
                      </p>
                    ) : null,
                  )}
                  {p.tech ? <p className="mt-1 text-xs text-muted-foreground">Tech: {p.tech}</p> : null}
                </div>
              ),
              action: promoteProjectFromSource,
              index: i,
            }))}
          />

          <ExtractionSection
            title="Bullets"
            documentId={doc.id}
            empty="No bullets extracted."
            items={extraction.bullets.map((b, i) => ({
              key: `bl-${i}`,
              body: (
                <p className="text-sm whitespace-pre-wrap text-foreground/90">
                  {b.category ? <span className="text-muted-foreground">[{b.category}] </span> : null}
                  {b.body}
                </p>
              ),
              action: promoteBulletFromSource,
              index: i,
            }))}
          />

          <ExtractionSection
            title="Answer snippets"
            documentId={doc.id}
            empty="No answer snippets extracted."
            items={extraction.saved_answers.map((a, i) => ({
              key: `sa-${i}`,
              body: (
                <div className="text-sm">
                  {(a.title || a.prompt_type) && (
                    <p className="font-medium text-foreground">{a.title ?? a.prompt_type}</p>
                  )}
                  <p className="mt-1 whitespace-pre-wrap text-foreground/90">{a.body}</p>
                </div>
              ),
              action: promoteSavedAnswerFromSource,
              index: i,
            }))}
          />

          {(extraction.testimonials?.length ?? 0) > 0 ? (
            <ExtractionSection
              title="Testimonials / referrals"
              documentId={doc.id}
              empty=""
              items={(extraction.testimonials ?? []).map((t, i) => ({
                key: `te-${i}`,
                body: (
                  <div className="text-sm">
                    {t.attribution ? <p className="font-medium text-foreground">{t.attribution}</p> : null}
                    <p className="mt-1 whitespace-pre-wrap text-foreground/90">{t.body}</p>
                  </div>
                ),
                action: promoteTestimonialFromSource,
                index: i,
              }))}
            />
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {doc.extraction_status === "pending" || doc.extraction_status === "running"
            ? "Run extraction to structure this source into your bank."
            : "Extraction is not available yet."}
        </p>
      )}

      <div className="border-t border-border pt-4">
        <form action={deleteSourceDocument}>
          <input type="hidden" name="id" value={doc.id} />
          <button type="submit" className="text-sm text-destructive/90 hover:underline">
            Delete this source
          </button>
        </form>
      </div>
    </div>
  );
}

function ExtractionSection({
  title,
  documentId,
  empty,
  items,
}: {
  title: string;
  documentId: string;
  empty: string;
  items: {
    key: string;
    body: ReactNode;
    action: (fd: FormData) => Promise<void>;
    index: number;
  }[];
}) {
  if (items.length === 0) {
    return empty ? (
      <p className="rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        {title}: {empty}
      </p>
    ) : null;
  }

  return (
    <details className="group rounded-lg border border-border bg-card/30 open:bg-card/50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
        <span>
          {title}
          <span className="ml-2 font-normal text-muted-foreground">({items.length})</span>
        </span>
        <span className="text-xs text-muted-foreground transition group-open:rotate-180">▼</span>
      </summary>
      <ul className="divide-y divide-border border-t border-border">
        {items.map((item) => (
          <li key={item.key} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0 flex-1">{item.body}</div>
            <form action={item.action} className="shrink-0 sm:pt-0.5">
              <input type="hidden" name="document_id" value={documentId} />
              <input type="hidden" name="index" value={String(item.index)} />
              <button
                type="submit"
                className="rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent"
              >
                Add to bank
              </button>
            </form>
          </li>
        ))}
      </ul>
    </details>
  );
}
