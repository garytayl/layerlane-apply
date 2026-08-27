import Link from "next/link";
import { fieldCardClass, fieldInputClass, primaryButtonClass } from "@/lib/form-classes";
import { listLocalInboxItems } from "@/lib/local-ledger";
import { importInboxFile, importInboxText } from "./actions";
import { ReviewQueue } from "./review-queue";

export const dynamic = "force-dynamic";

export default async function NeedsReviewPage() {
  const items = await listLocalInboxItems();
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-4 px-3 py-4 pb-12 sm:gap-6 sm:px-6 sm:py-6">
      <header className="flex items-center justify-between gap-4 px-1"><div><Link href="/local-ledger" className="text-xs font-bold text-primary">← Career HQ</Link><h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">Review deck</h1></div><div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-xl font-black text-primary">{items.length}</div></header>

      <details className="rounded-xl border border-border/60 bg-card/40">
        <summary className="cursor-pointer list-none px-4 py-2.5 text-xs font-semibold text-muted-foreground">Import JSON or CSV</summary>
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
