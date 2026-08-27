import Link from "next/link";
import { fieldCardClass, fieldInputClass, primaryButtonClass } from "@/lib/form-classes";
import { listLocalInboxItems } from "@/lib/local-ledger";
import { importInboxFile, importInboxText } from "./actions";
import { ReviewQueue } from "./review-queue";

export const dynamic = "force-dynamic";

export default async function NeedsReviewPage() {
  const items = await listLocalInboxItems();
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-3 py-4 pb-28 sm:gap-8 sm:px-6 sm:py-8 sm:pb-32 lg:px-8">
      <header className="overflow-hidden rounded-3xl border border-primary/15 bg-card/90 shadow-xl shadow-primary/5">
        <div className="grid gap-3 p-4 sm:gap-5 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><Link href="/local-ledger" className="text-sm font-semibold text-primary">← Master Career Ledger</Link>
          <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary sm:mt-6 sm:text-xs sm:tracking-[0.22em]">CHQ Inbox · local approval only</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight sm:mt-2 sm:text-5xl">Needs Review</h1>
          <p className="mt-2 hidden max-w-3xl text-sm leading-6 text-muted-foreground sm:block">
          External updates stop here. Accept, correct, or reject each item before it can affect the canonical local ledger.
          </p></div>
          <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 px-4 py-2.5 sm:rounded-2xl sm:px-5 sm:py-4 lg:block"><p className="text-2xl font-semibold text-amber-700 dark:text-amber-300 sm:text-3xl">{items.length}</p><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-xs">waiting on Gary</p></div>
        </div>
      </header>

      <details className="rounded-2xl border border-border/70 bg-card/60">
        <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold">Import data manually <span className="font-normal text-muted-foreground">· JSON, CSV, or pasted envelopes</span></summary>
        <section className="grid gap-5 border-t border-border/70 p-5 lg:grid-cols-2">
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
      </details>

      <ReviewQueue items={items} />
    </main>
  );
}
