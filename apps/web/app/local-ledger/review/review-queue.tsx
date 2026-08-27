"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LocalInboxItem } from "@/lib/local-ledger";
import { fieldInputClass, primaryButtonClass } from "@/lib/form-classes";
import { acceptInbox, rejectInbox } from "./actions";

const filters = ["all", "career_claim", "application_event", "project_evidence"] as const;
type Filter = (typeof filters)[number];
type Direction = "left" | "right";

function titleFor(item: LocalInboxItem) {
  return String(item.payload.label || item.payload.company || item.payload.project_key || "Incoming update");
}

function detailFor(item: LocalInboxItem) {
  const payload = item.payload;
  if (item.item_type === "career_claim") return String(payload.summary || "No summary provided.");
  if (item.item_type === "application_event") return `${String(payload.role || "Unknown role")} · ${String(payload.status || "unknown status")}`;
  return String(payload.note || payload.quote || "Project evidence awaiting review.");
}

function filterLabel(value: Filter, total: number, career: number, applications: number) {
  if (value === "all") return `All ${total}`;
  if (value === "career_claim") return `Career ${career}`;
  if (value === "application_event") return `Applications ${applications}`;
  return "Evidence";
}

function ReviewCard({ item, direction, onSwipe }: { item: LocalInboxItem; direction: Direction; onSwipe: (direction: Direction) => void }) {
  const payload = item.payload;
  const isClaim = item.item_type === "career_claim";
  const pointerStart = useRef<number | null>(null);

  function beginSwipe(event: React.PointerEvent<HTMLDivElement>) {
    pointerStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishSwipe(event: React.PointerEvent<HTMLDivElement>) {
    if (pointerStart.current === null) return;
    const distance = event.clientX - pointerStart.current;
    pointerStart.current = null;
    if (Math.abs(distance) >= 55) onSwipe(distance < 0 ? "left" : "right");
  }

  return (
    <article className={`overflow-hidden rounded-[1.75rem] border border-border/70 bg-card shadow-2xl shadow-black/10 ${direction === "left" ? "animate-review-card-in-right" : "animate-review-card-in-left"}`}>
      <div className="touch-pan-y select-none p-5 sm:p-7" onPointerDown={beginSwipe} onPointerUp={finishSwipe} onPointerCancel={() => { pointerStart.current = null; }}>
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-border sm:hidden" aria-hidden="true" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-primary">{item.item_type.replace("_", " ")}</span>
          <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300">{item.assertion_state}</span>
        </div>
        <h3 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">{titleFor(item)}</h3>
        <p className="mt-3 text-base leading-7 text-muted-foreground">{detailFor(item)}</p>
        <div className="mt-6 grid gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground sm:grid-cols-2">
          <div><span className="font-semibold text-foreground">Source</span><p className="mt-1">{item.source_type} · {item.source_title}</p></div>
          <div className="sm:text-right"><span className="font-semibold text-foreground">Received</span><p className="mt-1">{new Date(item.source_timestamp || item.created_at).toLocaleString()}</p></div>
        </div>
      </div>

      <details className="group/decision border-t border-border/70 bg-muted/20" open>
        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-bold text-primary transition hover:bg-primary/5 sm:px-7">Review, correct, and decide<span className="transition group-open/decision:rotate-90" aria-hidden="true">→</span></summary>
        <div className="grid gap-5 border-t border-border/60 p-5 sm:p-7 lg:grid-cols-[1fr_19rem]">
          <form action={acceptInbox} className="grid min-w-0 gap-3">
            <input type="hidden" name="id" value={item.id} />
            {isClaim ? <>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Canonical key<input name="canonical_key" defaultValue={String(payload.canonical_key || "")} required className={fieldInputClass} /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Display label<input name="label" defaultValue={String(payload.label || "")} required className={fieldInputClass} /></label>
              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Career fact<textarea name="summary" defaultValue={String(payload.summary || "")} required rows={4} className={fieldInputClass} /></label>
            </> : <pre className="max-h-64 max-w-full overflow-auto rounded-xl bg-background p-4 text-xs leading-5">{JSON.stringify(payload, null, 2)}</pre>}
            <input name="review_note" required placeholder="Why this is accurate, including any correction" className={fieldInputClass} />
            <button className={`${primaryButtonClass} min-h-12 w-full justify-center sm:w-fit`}>✓ Accept into Career HQ</button>
          </form>
          <form action={rejectInbox} className="grid content-start gap-3 rounded-2xl border border-destructive/25 bg-destructive/5 p-4">
            <input type="hidden" name="id" value={item.id} />
            <div><p className="text-sm font-bold text-destructive">Reject this update</p><p className="mt-1 text-xs leading-5 text-muted-foreground">It remains in the audit trail but never reaches the canonical ledger.</p></div>
            <textarea name="review_note" required rows={3} placeholder="Why this should not be used" className={fieldInputClass} />
            <button className="min-h-12 rounded-xl border border-destructive/40 px-4 py-2.5 text-sm font-bold text-destructive transition hover:bg-destructive hover:text-destructive-foreground">✕ Reject update</button>
          </form>
        </div>
      </details>
    </article>
  );
}

export function ReviewQueue({ items }: { items: LocalInboxItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<Direction>("left");
  const visible = useMemo(() => items.filter((item) => {
    const matchesType = filter === "all" || item.item_type === filter;
    const haystack = `${titleFor(item)} ${detailFor(item)} ${item.source_title}`.toLowerCase();
    return matchesType && haystack.includes(query.toLowerCase());
  }), [filter, items, query]);
  const careerCount = items.filter((item) => item.item_type === "career_claim").length;
  const applicationCount = items.filter((item) => item.item_type === "application_event").length;
  const current = visible[index];

  function navigate(nextDirection: Direction) {
    setDirection(nextDirection);
    setIndex((currentIndex) => nextDirection === "left" ? Math.min(currentIndex + 1, visible.length - 1) : Math.max(currentIndex - 1, 0));
  }

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return;
      if (event.key === "ArrowLeft") {
        setDirection("right");
        setIndex((currentIndex) => Math.max(currentIndex - 1, 0));
      }
      if (event.key === "ArrowRight") {
        setDirection("left");
        setIndex((currentIndex) => Math.min(currentIndex + 1, visible.length - 1));
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [visible.length]);

  function chooseFilter(value: Filter) { setFilter(value); setIndex(0); setDirection("left"); }
  function search(value: string) { setQuery(value); setIndex(0); setDirection("left"); }

  return <section className="grid gap-5">
    <div className="sticky top-3 z-20 grid gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-4 md:grid-cols-[1fr_auto] md:items-center">
      <input value={query} onChange={(event) => search(event.target.value)} placeholder="Search the review queue…" aria-label="Search review queue" className={fieldInputClass} />
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        {filters.map((value) => <button key={value} type="button" onClick={() => chooseFilter(value)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition ${filter === value ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{filterLabel(value, items.length, careerCount, applicationCount)}</button>)}
      </div>
    </div>
    <div className="flex items-end justify-between gap-4"><div><h2 className="text-xl font-semibold tracking-tight">Decision deck</h2><p className="text-sm text-muted-foreground">Swipe or use the arrows. Decisions still require an explicit button.</p></div>{visible.length > 0 ? <p className="shrink-0 text-sm font-bold tabular-nums text-primary">{index + 1} / {visible.length}</p> : null}</div>
    {visible.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No updates match this view.</div> : <>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-label={`${index + 1} of ${visible.length}`}><div className="h-full rounded-full bg-primary transition-[width] duration-500 ease-out" style={{ width: `${((index + 1) / visible.length) * 100}%` }} /></div>
      <div className="relative"><div className="absolute inset-x-4 top-3 -bottom-3 -z-10 rounded-[1.75rem] border border-border/40 bg-card/50" aria-hidden="true" /><ReviewCard key={`${current.id}-${index}-${direction}`} item={current} direction={direction} onSwipe={navigate} /></div>
      <nav className="sticky bottom-3 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl shadow-black/20 backdrop-blur-xl" aria-label="Review queue navigation">
        <button type="button" onClick={() => navigate("right")} disabled={index === 0} className="min-h-12 rounded-xl border border-border bg-background px-4 text-left text-sm font-bold transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-35"><span aria-hidden="true">←</span> <span className="hidden sm:inline">Previous</span></button>
        <span className="text-center text-xs font-semibold text-muted-foreground"><span className="block text-base text-foreground">{index + 1}</span>of {visible.length}</span>
        <button type="button" onClick={() => navigate("left")} disabled={index === visible.length - 1} className="min-h-12 rounded-xl border border-border bg-background px-4 text-right text-sm font-bold transition hover:border-primary/50 disabled:cursor-not-allowed disabled:opacity-35"><span className="hidden sm:inline">Next</span> <span aria-hidden="true">→</span></button>
      </nav>
    </>}
  </section>;
}
