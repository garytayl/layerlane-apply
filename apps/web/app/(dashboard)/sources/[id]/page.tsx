import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sourceExtractionResultSchema } from "@layerlane/core";
import { listItemCardClass, primaryButtonClass } from "@/lib/form-classes";
import { createClient } from "@/lib/supabase/server";
import {
  deleteSourceDocument,
  promoteBulletFromSource,
  promoteExperienceFromSource,
  promoteProjectFromSource,
  promoteSavedAnswerFromSource,
  promoteTestimonialFromSource,
} from "../actions";
import { SourceExtractForm } from "../source-extract-form";

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
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground">
          ← Sources
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">{doc.title ?? "Source"}</h1>
            <p className="text-sm text-muted-foreground">
              {doc.kind} · {doc.extraction_status}
              {doc.model ? ` · ${doc.model}` : ""}
            </p>
          </div>
          <SourceExtractForm documentId={doc.id} />
        </div>
        {doc.extraction_error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {doc.extraction_error}
          </p>
        ) : null}
        {doc.extraction_status === "ready" && doc.extraction_payload && !parsed.success ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            Stored extraction does not match the current format. Run extraction again.
          </p>
        ) : null}
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Raw text</h2>
        <details className="rounded-lg border border-border bg-card/40 p-3">
          <summary className="cursor-pointer text-sm font-medium">Show full source</summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">
            {doc.raw_text}
          </pre>
        </details>
      </section>

      {doc.extraction_status === "ready" && extraction ? (
        <>
          {extraction.skills.length > 0 ? (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Skills (extracted)</h2>
              <p className="text-sm text-foreground">{extraction.skills.join(" · ")}</p>
            </section>
          ) : null}

          <ExtractionSection
            title="Experience"
            documentId={doc.id}
            empty="No experience rows extracted."
            items={extraction.experiences.map((e, i) => ({
              key: `ex-${i}`,
              body: (
                <div className="text-sm">
                  <p className="font-medium">
                    {(e.title ?? "Role") + (e.company ? ` · ${e.company}` : "")}
                  </p>
                  {(e.start_date || e.end_date) && (
                    <p className="text-muted-foreground">
                      {e.start_date ?? "?"} — {e.end_date ?? "?"}
                    </p>
                  )}
                  <p className="mt-1 whitespace-pre-wrap">{e.body}</p>
                  {e.source_chunk_index != null && (
                    <p className="mt-1 text-xs text-muted-foreground">Chunk {e.source_chunk_index}</p>
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
                  <p className="font-medium">{p.name}</p>
                  {[p.problem, p.action, p.outcome].map((line, idx) =>
                    line ? (
                      <p key={idx} className="mt-1 whitespace-pre-wrap">
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
                <p className="text-sm whitespace-pre-wrap">
                  {b.category ? <span className="text-muted-foreground">[{b.category}] </span> : null}
                  {b.body}
                </p>
              ),
              action: promoteBulletFromSource,
              index: i,
            }))}
          />

          <ExtractionSection
            title="Saved-answer style snippets"
            documentId={doc.id}
            empty="No answer snippets extracted."
            items={extraction.saved_answers.map((a, i) => ({
              key: `sa-${i}`,
              body: (
                <div className="text-sm">
                  {(a.title || a.prompt_type) && (
                    <p className="font-medium">
                      {a.title ?? a.prompt_type}
                    </p>
                  )}
                  <p className="mt-1 whitespace-pre-wrap">{a.body}</p>
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
                    {t.attribution ? <p className="font-medium">{t.attribution}</p> : null}
                    <p className="mt-1 whitespace-pre-wrap">{t.body}</p>
                  </div>
                ),
                action: promoteTestimonialFromSource,
                index: i,
              }))}
            />
          ) : null}
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {doc.extraction_status === "pending" || doc.extraction_status === "running"
            ? "Run extraction to structure this source into your bank."
            : "Extraction is not available yet."}
        </p>
      )}

      <form action={deleteSourceDocument} className="border-t border-border pt-6">
        <input type="hidden" name="id" value={doc.id} />
        <button type="submit" className="text-sm text-destructive hover:underline">
          Delete this source
        </button>
      </form>
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
      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">{title}</h2>
        <p className="text-sm text-muted-foreground">{empty}</p>
      </section>
    ) : null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium">{title}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.key} className={listItemCardClass}>
            {item.body}
            <form action={item.action} className="mt-3">
              <input type="hidden" name="document_id" value={documentId} />
              <input type="hidden" name="index" value={String(item.index)} />
              <button type="submit" className={primaryButtonClass}>
                Add to evidence bank
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
