import {
  careerLedgerRecordKindSchema,
  chqSourceKindSchema,
  verificationMethodSchema,
  verificationStatusSchema,
} from "@layerlane/core";
import Link from "next/link";
import {
  fieldCardClass,
  fieldInputClass,
  listItemCardClass,
  primaryButtonClass,
} from "@/lib/form-classes";
import { getLedgerOverview, getNeedsReview, listConflicts } from "@/lib/chq-service";
import {
  addLocalLedgerEvidence,
  createLocalLedgerRecord,
  ingestLocalSource,
  updateLocalLedgerRecord,
  verifyLocalLedgerRecord,
} from "./actions";

const kinds = careerLedgerRecordKindSchema.options;
const statuses = verificationStatusSchema.options;
const methods = verificationMethodSchema.options;
const sourceKinds = chqSourceKindSchema.options;

export const dynamic = "force-dynamic";

export default async function LocalLedgerPage() {
  const [{ records, sources }, conflicts, needsReview] = await Promise.all([
    getLedgerOverview(),
    listConflicts(),
    getNeedsReview(),
  ]);
  const countKind = (kind: string) => records.filter((record) => record.kind === kind).length;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="overflow-hidden rounded-3xl border border-primary/15 bg-card/90 shadow-xl shadow-primary/5">
        <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_5px] shadow-emerald-500/10" /><p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Career HQ · local canonical store</p></div>
          <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl">Your career, with receipts.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">One durable ledger for experience, evidence, projects, and applications. Stored on this computer—not scattered across chats and résumés.</p></div>
          <div className="flex flex-wrap gap-3 text-sm lg:justify-end">
            <Link href="/local-ledger/review" className={primaryButtonClass}>Review inbox <span className="ml-1 rounded-full bg-primary-foreground/15 px-2 py-0.5">{needsReview.inbox.length}</span></Link>
            <Link href="/local-ledger/bridge" className="rounded-xl border border-border bg-background/70 px-4 py-2.5 font-semibold transition hover:border-primary/40">Bridge status</Link>
            <a href="/local-ledger/snapshot" className="rounded-xl border border-border bg-background/70 px-4 py-2.5 font-semibold transition hover:border-primary/40">Export</a>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Experience", countKind("experience")],
          ["Education", countKind("education")],
          ["Skills", countKind("skill")],
          ["Projects", countKind("project")],
          ["Claims", countKind("claim")],
          ["Needs Gary", needsReview.inbox.length + needsReview.ledger.length],
        ].map(([label, count]) => (
          <div key={label} className={`${fieldCardClass} relative overflow-hidden`}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">{count}</p>
            <span className="absolute -bottom-5 -right-5 h-16 w-16 rounded-full bg-primary/5" />
          </div>
        ))}
      </section>

      {conflicts.length > 0 ? (
        <section className="rounded border border-destructive/50 bg-destructive/5 p-4">
          <h2 className="font-medium text-destructive">Conflicts requiring attention</h2>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {conflicts.map((record) => <li key={record.id}>{record.label}</li>)}
          </ul>
        </section>
      ) : null}

      <details className="rounded-2xl border border-border/70 bg-card/60">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold">Sources and manual data entry <span className="font-normal text-muted-foreground">· {sources.length} stored sources</span></summary>
      <section className="grid gap-6 border-t border-border/70 p-5 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Evidence sources</h2>
          <form action={ingestLocalSource} className={`grid gap-3 ${fieldCardClass}`}>
            <div className="grid gap-3 sm:grid-cols-2">
              <select name="source_kind" defaultValue="user" className={fieldInputClass}>
                {sourceKinds.map((kind) => <option key={kind}>{kind}</option>)}
              </select>
              <input name="source_title" required placeholder="Source title" className={fieldInputClass} />
            </div>
            <input name="external_ref" placeholder="URL or external reference (optional)" className={fieldInputClass} />
            <textarea name="source_content" required rows={5} placeholder="Paste source text" className={fieldInputClass} />
            <button type="submit" className={primaryButtonClass}>Ingest source</button>
          </form>
        </div>
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Stored sources</h2>
          {sources.length === 0 ? (
            <p className={`${fieldCardClass} text-sm text-muted-foreground`}>No sources ingested yet.</p>
          ) : (
            <ul className="grid gap-2">
              {sources.map((source) => (
                <li key={source.id} className={listItemCardClass}>
                  <p className="text-xs uppercase text-muted-foreground">{source.kind}</p>
                  <p className="font-medium">{source.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{source.content}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <section className="flex flex-col gap-4 border-t border-border/70 p-5">
        <h2 className="text-lg font-semibold">Add a career fact manually</h2>
        <form action={createLocalLedgerRecord} className={`grid gap-3 ${fieldCardClass}`}>
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="kind" className={fieldInputClass} defaultValue="experience">
              {kinds.map((kind) => <option key={kind}>{kind}</option>)}
            </select>
            <input name="canonical_key" required placeholder="experience:amazon:role:2024" className={fieldInputClass} />
          </div>
          <input name="label" required placeholder="Short label" className={fieldInputClass} />
          <textarea name="summary" required rows={3} placeholder="The durable fact, in plain language" className={fieldInputClass} />
          <button type="submit" className={primaryButtonClass}>Add to ledger</button>
        </form>
      </section>
      </details>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Canonical data</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">Ledger records</h2><p className="text-sm text-muted-foreground">{records.length} career facts on this machine.</p></div>
          <p className="text-xs text-muted-foreground">Open a record only when you need to edit evidence or verification.</p>
        </div>

        {records.length === 0 ? (
          <p className={`${fieldCardClass} text-sm text-muted-foreground`}>
            The ledger is empty. Add one fact above to exercise the complete local workflow.
          </p>
        ) : (
          <ul className="grid gap-5 xl:grid-cols-2">
            {records.map((record) => (
              <li key={record.id} className={`${listItemCardClass} grid content-start gap-4 bg-card/80`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{record.kind}</p>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">{record.label}</h3>
                  </div>
                  <span className="rounded-full border border-border px-2 py-1 text-xs">
                    {record.verification_status} · {Math.round(record.confidence * 100)}%
                  </span>
                  {record.needs_review ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-1 text-xs text-amber-700 dark:text-amber-300">
                      Needs Gary review
                    </span>
                  ) : null}
                </div>

                <p className="text-sm leading-6 text-muted-foreground">{record.summary}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{record.evidence.length} evidence item{record.evidence.length === 1 ? "" : "s"}</span><span>·</span><span>Updated {new Date(record.updated_at).toLocaleDateString()}</span></div>

                <details className="rounded-xl border border-border/70 bg-muted/20">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-primary">Manage record <span aria-hidden="true">→</span></summary>
                <div className="grid gap-5 border-t border-border/70 p-4">
                <form action={updateLocalLedgerRecord} className="grid gap-2">
                  <input type="hidden" name="id" value={record.id} />
                  <div className="grid gap-2 sm:grid-cols-2">
                    <select name="kind" defaultValue={record.kind} className={fieldInputClass}>
                      {kinds.map((kind) => <option key={kind}>{kind}</option>)}
                    </select>
                    <input name="label" required defaultValue={record.label} className={fieldInputClass} />
                  </div>
                  <textarea name="summary" required rows={3} defaultValue={record.summary} className={fieldInputClass} />
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <input type="checkbox" name="needs_review" defaultChecked={record.needs_review} />
                    Needs Gary review
                  </label>
                  <button type="submit" className="w-fit text-sm text-primary underline">Save fact</button>
                </form>

                <div className="grid gap-4 border-t border-border pt-4">
                  <div className="grid gap-3">
                    <h4 className="text-sm font-medium">Evidence</h4>
                    {record.evidence.length > 0 ? (
                      <ul className="grid gap-2 text-sm">
                        {record.evidence.map((item) => (
                          <li key={item.id} className="rounded bg-muted/50 p-2">
                            <span className={item.supports ? "text-foreground" : "text-destructive"}>
                              {item.supports ? "Supports" : "Contradicts"}
                            </span>
                            {item.source_title ? <p className="text-xs text-muted-foreground">Source: {item.source_title}</p> : null}
                            {item.quote ? <blockquote className="mt-1 border-l-2 pl-2">“{item.quote}”</blockquote> : null}
                            {item.note ? <p className="mt-1 text-muted-foreground">{item.note}</p> : null}
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground">No evidence attached yet.</p>}
                    <form action={addLocalLedgerEvidence} className="grid gap-2">
                      <input type="hidden" name="ledger_record_id" value={record.id} />
                      <select name="source_id" defaultValue="" className={fieldInputClass}>
                        <option value="">Manual / no stored source</option>
                        {sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}
                      </select>
                      <textarea name="quote" rows={2} placeholder="Exact quote (optional)" className={fieldInputClass} />
                      <input name="note" placeholder="Source or review note" className={fieldInputClass} />
                      <select name="supports" defaultValue="true" className={fieldInputClass}>
                        <option value="true">Supports this fact</option>
                        <option value="false">Contradicts this fact</option>
                      </select>
                      <button type="submit" className="w-fit text-sm text-primary underline">Attach evidence</button>
                    </form>
                  </div>

                  <form action={verifyLocalLedgerRecord} className="grid content-start gap-2">
                    <h4 className="text-sm font-medium">Verification decision</h4>
                    <input type="hidden" name="id" value={record.id} />
                    <select name="verification_status" defaultValue={record.verification_status} className={fieldInputClass}>
                      {statuses.map((status) => <option key={status}>{status}</option>)}
                    </select>
                    <select name="method" defaultValue="manual_review" className={fieldInputClass}>
                      {methods.map((method) => <option key={method}>{method}</option>)}
                    </select>
                    <input name="confidence" type="number" min="0" max="1" step="0.05" defaultValue={record.confidence} className={fieldInputClass} />
                    <textarea name="rationale" required rows={2} placeholder="Why this status is justified" className={fieldInputClass} />
                    <button type="submit" className={primaryButtonClass}>Record decision</button>
                    {record.verification_events.length > 0 ? (
                      <div className="mt-2 border-t border-border pt-3">
                        <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">History</h5>
                        <ol className="mt-2 grid gap-2 text-xs">
                          {record.verification_events.map((event) => (
                            <li key={event.id} className="rounded bg-muted/50 p-2">
                              <p>{event.previous_status ?? "new"} → {event.status} · {Math.round(event.confidence * 100)}%</p>
                              <p className="text-muted-foreground">{event.method}: {event.rationale}</p>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </form>
                </div>
                </div>
                </details>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
