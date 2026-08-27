import Link from "next/link";
import { fieldCardClass, fieldInputClass, primaryButtonClass } from "@/lib/form-classes";
import { listLocalInboxItems } from "@/lib/local-ledger";
import { acceptInbox, importInboxFile, importInboxText, rejectInbox } from "./actions";

export const dynamic = "force-dynamic";

export default async function NeedsReviewPage() {
  const items = await listLocalInboxItems();
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-4 py-10">
      <header className="flex flex-col gap-2 border-b border-border pb-6">
        <Link href="/local-ledger" className="text-sm text-primary underline">← Master Career Ledger</Link>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">CHQ Inbox</p>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Needs Review</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          External updates stop here. Accept, correct, or reject each item before it can affect the canonical local ledger.
        </p>
      </header>

      <section className="grid gap-5 lg:grid-cols-2">
        <form action={importInboxFile} className={`grid content-start gap-3 ${fieldCardClass}`}>
          <h2 className="font-medium">Import a CHQ update file</h2>
          <p className="text-sm text-muted-foreground">JSON envelopes and CSV files up to 2 MB are accepted.</p>
          <input name="file" type="file" accept=".json,.csv,application/json,text/csv" required className={fieldInputClass} />
          <button className={primaryButtonClass}>Queue file for review</button>
        </form>
        <form action={importInboxText} className={`grid content-start gap-3 ${fieldCardClass}`}>
          <h2 className="font-medium">Paste a structured update</h2>
          <select name="format" defaultValue="json" className={fieldInputClass}><option value="json">JSON</option><option value="csv">CSV</option></select>
          <textarea name="payload" required rows={7} className={fieldInputClass} placeholder='{"version":1,"producer":{"type":"chatgpt"},"items":[...]}' />
          <button className={primaryButtonClass}>Queue pasted update</button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div><h2 className="text-lg font-medium">Pending items</h2><p className="text-sm text-muted-foreground">{items.length} update{items.length === 1 ? "" : "s"} waiting.</p></div>
        {items.length === 0 ? <p className={`${fieldCardClass} text-sm text-muted-foreground`}>The inbox is clear.</p> : (
          <ul className="grid gap-4">
            {items.map((item) => {
              const payload = item.payload as Record<string, unknown>;
              return <li key={item.id} className={`grid gap-4 ${fieldCardClass}`}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div><p className="text-xs uppercase tracking-wide text-muted-foreground">{item.item_type} · {item.assertion_state}</p><h3 className="font-medium">{String(payload.label || payload.company || payload.project_key || "Incoming update")}</h3></div>
                  <div className="text-right text-xs text-muted-foreground"><p>{item.source_type}: {item.source_title}</p>{item.source_timestamp ? <p>{new Date(item.source_timestamp).toLocaleString()}</p> : null}</div>
                </div>
                <form action={acceptInbox} className="grid gap-2">
                  <input type="hidden" name="id" value={item.id} />
                  {item.item_type === "career_claim" ? <>
                    <input name="canonical_key" defaultValue={String(payload.canonical_key || "")} required placeholder="Canonical key" className={fieldInputClass} />
                    <input name="label" defaultValue={String(payload.label || "")} required placeholder="Label" className={fieldInputClass} />
                    <textarea name="summary" defaultValue={String(payload.summary || "")} required rows={3} className={fieldInputClass} />
                  </> : <pre className="overflow-auto rounded bg-muted/50 p-3 text-xs">{JSON.stringify(payload, null, 2)}</pre>}
                  <input name="review_note" required placeholder="Why you are accepting (and what you corrected)" className={fieldInputClass} />
                  <button className={primaryButtonClass}>Accept into CHQ</button>
                </form>
                <form action={rejectInbox} className="flex flex-col gap-2 border-t border-border pt-3 sm:flex-row">
                  <input type="hidden" name="id" value={item.id} />
                  <input name="review_note" required placeholder="Reason for rejection" className={`${fieldInputClass} flex-1`} />
                  <button className="rounded border border-destructive px-3 py-2 text-sm text-destructive">Reject</button>
                </form>
              </li>;
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
