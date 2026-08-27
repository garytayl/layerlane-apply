"use client";

import { useMemo, useState } from "react";
import type { LocalInboxItem } from "@/lib/local-ledger";
import { fieldInputClass, primaryButtonClass } from "@/lib/form-classes";
import { acceptInbox, rejectInbox } from "./actions";

const filters = ["all", "career_claim", "application_event", "project_evidence"] as const;

function titleFor(item: LocalInboxItem) {
  return String(item.payload.label || item.payload.company || item.payload.project_key || "Incoming update");
}

function detailFor(item: LocalInboxItem) {
  const payload = item.payload;
  if (item.item_type === "career_claim") return String(payload.summary || "No summary provided.");
  if (item.item_type === "application_event") return `${String(payload.role || "Unknown role")} · ${String(payload.status || "unknown status")}`;
  return String(payload.note || payload.quote || "Project evidence awaiting review.");
}

function QueueCard({ item }: { item: LocalInboxItem }) {
  const payload = item.payload;
  const isClaim = item.item_type === "career_claim";
  return (
    <article className="group overflow-hidden rounded-2xl border border-border/70 bg-card/85 shadow-sm transition hover:border-primary/30 hover:shadow-md">
      <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">{item.item_type.replace("_", " ")}</span>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{item.assertion_state}</span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight">{titleFor(item)}</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">{detailFor(item)}</p>
        </div>
        <div className="min-w-48 text-xs text-muted-foreground lg:text-right">
          <p className="font-medium text-foreground">{item.source_type}</p>
          <p className="mt-1 max-w-64 lg:ml-auto">{item.source_title}</p>
          <p className="mt-2">{new Date(item.source_timestamp || item.created_at).toLocaleString()}</p>
        </div>
      </div>

      <details className="border-t border-border/70 bg-muted/20">
        <summary className="cursor-pointer list-none px-5 py-3 text-sm font-semibold text-primary hover:bg-primary/5">Review and decide <span aria-hidden="true">→</span></summary>
        <div className="grid gap-5 border-t border-border/60 p-5 lg:grid-cols-[1fr_18rem]">
          <form action={acceptInbox} className="grid gap-3">
            <input type="hidden" name="id" value={item.id} />
            {isClaim ? <>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Canonical key<input name="canonical_key" defaultValue={String(payload.canonical_key || "")} required className={fieldInputClass} /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Display label<input name="label" defaultValue={String(payload.label || "")} required className={fieldInputClass} /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Career fact<textarea name="summary" defaultValue={String(payload.summary || "")} required rows={4} className={fieldInputClass} /></label>
            </> : <pre className="max-h-64 overflow-auto rounded-xl bg-background/80 p-4 text-xs leading-5">{JSON.stringify(payload, null, 2)}</pre>}
            <input name="review_note" required placeholder="Why this is accurate, including any correction" className={fieldInputClass} />
            <button className={primaryButtonClass}>Accept into Career HQ</button>
          </form>
          <form action={rejectInbox} className="grid content-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4">
            <input type="hidden" name="id" value={item.id} />
            <div><p className="text-sm font-semibold text-destructive">Reject this update</p><p className="mt-1 text-xs text-muted-foreground">It stays in the audit trail but never reaches the canonical ledger.</p></div>
            <textarea name="review_note" required rows={3} placeholder="Why this should not be used" className={fieldInputClass} />
            <button className="rounded-xl border border-destructive/40 px-4 py-2.5 text-sm font-semibold text-destructive transition hover:bg-destructive hover:text-destructive-foreground">Reject update</button>
          </form>
        </div>
      </details>
    </article>
  );
}

export function ReviewQueue({ items }: { items: LocalInboxItem[] }) {
  const [filter, setFilter] = useState<(typeof filters)[number]>("all");
  const [query, setQuery] = useState("");
  const visible = useMemo(() => items.filter((item) => {
    const matchesType = filter === "all" || item.item_type === filter;
    const haystack = `${titleFor(item)} ${detailFor(item)} ${item.source_title}`.toLowerCase();
    return matchesType && haystack.includes(query.toLowerCase());
  }), [filter, items, query]);
  const careerCount = items.filter((item) => item.item_type === "career_claim").length;
  const applicationCount = items.filter((item) => item.item_type === "application_event").length;

  return <section className="grid gap-5">
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-sm md:grid-cols-[1fr_auto] md:items-center">
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search names, employers, sources, or claims…" className={fieldInputClass} />
      <div className="flex flex-wrap gap-2">
        {filters.map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-full px-3 py-2 text-xs font-semibold transition ${filter === value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{value === "all" ? `All ${items.length}` : value === "career_claim" ? `Career ${careerCount}` : value === "application_event" ? `Applications ${applicationCount}` : "Evidence"}</button>)}
      </div>
    </div>
    <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold tracking-tight">Pending decisions</h2><p className="text-sm text-muted-foreground">Showing {visible.length} of {items.length} updates.</p></div><p className="hidden text-xs text-muted-foreground sm:block">Open one record at a time. Nothing is bulk-approved.</p></div>
    {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No updates match this view.</div> : <div className="grid gap-4">{visible.map((item) => <QueueCard key={item.id} item={item} />)}</div>}
  </section>;
}
