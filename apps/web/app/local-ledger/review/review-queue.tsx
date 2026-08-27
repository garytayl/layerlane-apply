"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LocalInboxItem } from "@/lib/local-ledger";
import { fieldInputClass } from "@/lib/form-classes";
import { acceptInbox, rejectInbox } from "./actions";

const foundationalTypes = new Set(["profile_update", "education_proposal", "experience_proposal", "project_proposal", "skill_proposal"]);
const filters = ["all", "foundation", "career_claim", "application_event"] as const;
type Filter = (typeof filters)[number];
type Direction = "left" | "right";
type FieldSpec = { label: string; name: string; value: string; formValue?: string; required?: boolean; multiline?: boolean; checked?: boolean };
const text = (payload: Record<string, unknown>, key: string) => String(payload[key] ?? "");
const list = (payload: Record<string, unknown>, key: string) => Array.isArray(payload[key]) ? (payload[key] as unknown[]).join("\n") : text(payload, key);

function titleFor(item: LocalInboxItem) {
  const p = item.payload;
  return String(p.name || p.label || p.project_name || p.employer || p.institution || p.company || p.project_key || "Incoming update");
}

function fieldsFor(item: LocalInboxItem): FieldSpec[] {
  const p = item.payload;
  if (item.item_type === "profile_update") return [{ label: "Name", name: "name", value: text(p, "name"), required: true }, { label: "Email", name: "primary_email", value: text(p, "primary_email") }, { label: "Phone", name: "phone", value: text(p, "phone") }, { label: "Portfolio", name: "portfolio_url", value: text(p, "portfolio_url") }];
  if (item.item_type === "education_proposal") return [{ label: "School", name: "institution", value: text(p, "institution"), required: true }, { label: "Degree", name: "degree", value: text(p, "degree"), required: true }, { label: "Major", name: "major", value: text(p, "major") }, { label: "Concentration", name: "concentration", value: text(p, "concentration") }, { label: "Graduation", name: "graduation_date", value: text(p, "graduation_date") }, { label: "GPA", name: "gpa", value: text(p, "gpa") }];
  if (item.item_type === "experience_proposal") return [{ label: "Employer", name: "employer", value: text(p, "employer"), required: true }, { label: "Title", name: "title", value: text(p, "title"), required: true }, { label: "Location", name: "location", value: text(p, "location") }, { label: "Start", name: "start_date", value: text(p, "start_date") }, { label: "End", name: "end_date", value: text(p, "end_date") || (p.is_current ? "Present" : ""), formValue: text(p, "end_date") }, { label: "Current role", name: "is_current", value: p.is_current ? "Yes" : "No", checked: Boolean(p.is_current) }, { label: "Responsibilities", name: "responsibilities", value: list(p, "responsibilities"), multiline: true }];
  if (item.item_type === "project_proposal") return [{ label: "Project", name: "project_name", value: text(p, "project_name"), required: true }, { label: "Status", name: "project_status", value: text(p, "project_status") }, { label: "URL", name: "project_url", value: text(p, "project_url") }, { label: "Technologies", name: "technologies", value: list(p, "technologies").replace(/\n/g, ", ") }, { label: "Summary", name: "summary", value: text(p, "summary"), multiline: true }];
  if (item.item_type === "skill_proposal") return [{ label: "Skills", name: "skills", value: list(p, "skills"), required: true, multiline: true }];
  if (item.item_type === "career_claim") return [{ label: "Key", name: "canonical_key", value: text(p, "canonical_key"), required: true }, { label: "Label", name: "label", value: text(p, "label"), required: true }, { label: "Claim", name: "summary", value: text(p, "summary"), required: true, multiline: true }];
  if (item.item_type === "application_event") return [{ label: "Company", name: "company", value: text(p, "company") }, { label: "Role", name: "role", value: text(p, "role") }, { label: "Status", name: "status", value: text(p, "status") }, { label: "When", name: "occurred_at", value: text(p, "occurred_at") }];
  return [{ label: "Update", name: "payload_preview", value: text(p, "note") || text(p, "quote") || "Project evidence", multiline: true }];
}

function FieldGrid({ fields, editing }: { fields: FieldSpec[]; editing: boolean }) {
  if (!editing) return <dl className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-background/50">{fields.map((field) => <div key={field.name} className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-3 sm:grid-cols-[8rem_1fr]"><dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{field.label}</dt><dd className={`min-w-0 whitespace-pre-line break-words text-sm font-medium ${field.value ? "text-foreground" : "italic text-muted-foreground"}`}>{field.value || "Not provided"}</dd>{field.checked !== undefined ? <input type="hidden" name={field.name} value={field.checked ? "on" : ""} /> : <input type="hidden" name={field.name} value={field.formValue ?? field.value} />}</div>)}</dl>;
  return <div className="grid gap-3 sm:grid-cols-2">{fields.map((field) => field.checked !== undefined ? <label key={field.name} className="flex min-h-12 items-center gap-3 rounded-xl border border-border bg-card px-3 text-sm font-semibold"><input type="checkbox" name={field.name} defaultChecked={field.checked} />{field.label}</label> : <label key={field.name} className={`grid gap-1 text-xs font-bold text-muted-foreground ${field.multiline ? "sm:col-span-2" : ""}`}><span>{field.label}</span>{field.multiline ? <textarea name={field.name} defaultValue={field.formValue ?? field.value} required={field.required} rows={field.name === "summary" ? 5 : 3} className={fieldInputClass} /> : <input name={field.name} defaultValue={field.formValue ?? field.value} required={field.required} className={fieldInputClass} />}</label>)}</div>;
}

function ReviewCard({ item, direction, onBrowse }: { item: LocalInboxItem; direction: Direction; onBrowse: (direction: Direction) => void }) {
  const [editing, setEditing] = useState(false);
  const [drag, setDrag] = useState(0);
  const pointerStart = useRef<number | null>(null);
  const fields = fieldsFor(item);
  function pointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (editing || (event.target as HTMLElement).closest("button, input, textarea, select, summary, a")) return;
    pointerStart.current = event.clientX;
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: React.PointerEvent<HTMLDivElement>) { if (pointerStart.current !== null && !editing) setDrag(Math.max(-130, Math.min(130, event.clientX - pointerStart.current))); }
  function pointerUp() { if (Math.abs(drag) > 75) onBrowse(drag < 0 ? "left" : "right"); pointerStart.current = null; setDrag(0); }
  const typeLabel = item.item_type.replaceAll("_", " ");
  return <div className="relative mx-auto w-full max-w-xl">
    <div className="absolute inset-x-5 top-4 -bottom-3 -z-20 rounded-[2rem] border border-border/30 bg-card/35" aria-hidden="true" />
    <div className="absolute inset-x-3 top-2 -bottom-1 -z-10 rounded-[2rem] border border-border/50 bg-card/60" aria-hidden="true" />
    <article style={{ transform: `translateX(${drag}px) rotate(${drag / 28}deg)` }} className={`overflow-hidden rounded-[2rem] border border-border/80 bg-card shadow-[0_28px_80px_-28px_rgba(0,0,0,.65)] transition-transform ${drag ? "duration-0" : "duration-300"} ${direction === "left" ? "animate-review-card-in-right" : "animate-review-card-in-left"}`}>
      <div className="relative touch-pan-y select-none px-5 pb-4 pt-5 sm:px-7" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>
        <div className="pointer-events-none absolute inset-y-0 left-0 flex w-28 items-center justify-center bg-gradient-to-r from-rose-500/25 to-transparent text-xl font-black text-rose-400 transition-opacity" style={{ opacity: Math.max(0, -drag / 90) }}>BACK</div>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex w-28 items-center justify-center bg-gradient-to-l from-emerald-500/25 to-transparent text-xl font-black text-emerald-400 transition-opacity" style={{ opacity: Math.max(0, drag / 90) }}>NEXT</div>
        <div className="relative"><div className="flex items-center justify-between gap-3"><span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-primary">{typeLabel}</span><button type="button" onClick={() => setEditing((open) => !open)} className="rounded-full border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:border-primary/50 hover:text-foreground">{editing ? "Done" : "Edit"}</button></div><h3 className="mt-4 text-2xl font-semibold tracking-tight sm:text-3xl">{titleFor(item)}</h3><p className="mt-1 text-xs text-muted-foreground">Proposed from {item.source_title}</p></div>
      </div>
      <form action={acceptInbox} className="grid gap-4 px-5 pb-5 sm:px-7 sm:pb-7"><input type="hidden" name="id" value={item.id} /><FieldGrid fields={fields} editing={editing} />
        <details className="rounded-xl border border-border/60"><summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold text-muted-foreground">View source evidence</summary><div className="border-t border-border/60 p-4 text-xs leading-5 text-muted-foreground">{item.source_type} · {new Date(item.source_timestamp || item.created_at).toLocaleString()}<br />Original proposal and provenance remain in the audit trail.</div></details>
        {editing ? <input name="review_note" placeholder="Optional note about your correction" className={fieldInputClass} /> : <input type="hidden" name="review_note" value="" />}
        <div className="flex items-start justify-center gap-8 pt-1"><div className="grid justify-items-center gap-2"><button formAction={rejectInbox} aria-label="Reject proposal" className="grid h-16 w-16 place-items-center rounded-full border-2 border-rose-400/50 bg-rose-500/10 text-3xl text-rose-400 shadow-lg shadow-rose-500/10 transition hover:scale-110 hover:bg-rose-500 hover:text-white active:scale-95">×</button><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reject</span></div><div className="grid justify-items-center gap-2"><button aria-label="Accept proposal" className="grid h-16 w-16 place-items-center rounded-full border-2 border-emerald-400/50 bg-emerald-500/10 text-2xl text-emerald-400 shadow-lg shadow-emerald-500/10 transition hover:scale-110 hover:bg-emerald-500 hover:text-white active:scale-95">✓</button><span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Accept</span></div></div>
      </form>
    </article>
  </div>;
}

export function ReviewQueue({ items }: { items: LocalInboxItem[] }) {
  const [filter, setFilter] = useState<Filter>("all"); const [query, setQuery] = useState(""); const [index, setIndex] = useState(0); const [direction, setDirection] = useState<Direction>("left");
  const visible = useMemo(() => items.filter((item) => { const typeMatch = filter === "all" || (filter === "foundation" ? foundationalTypes.has(item.item_type) : item.item_type === filter); return typeMatch && `${titleFor(item)} ${item.source_title}`.toLowerCase().includes(query.toLowerCase()); }), [filter, items, query]);
  const current = visible[index];
  function browse(next: Direction) { setDirection(next); setIndex((at) => next === "left" ? Math.min(at + 1, visible.length - 1) : Math.max(at - 1, 0)); }
  useEffect(() => { function keys(event: KeyboardEvent) { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return; if (event.key === "ArrowLeft") { setDirection("right"); setIndex((at) => Math.max(at - 1, 0)); } if (event.key === "ArrowRight") { setDirection("left"); setIndex((at) => Math.min(at + 1, visible.length - 1)); } } window.addEventListener("keydown", keys); return () => window.removeEventListener("keydown", keys); }, [visible.length]);
  function choose(next: Filter) { setFilter(next); setIndex(0); }
  return <section className="grid gap-4"><div className="mx-auto flex w-full max-w-xl items-center gap-2"><input value={query} onChange={(event) => { setQuery(event.target.value); setIndex(0); }} placeholder="Search proposals" aria-label="Search proposals" className={`${fieldInputClass} min-w-0 flex-1`} /><span className="shrink-0 text-sm font-black tabular-nums text-primary">{current ? `${index + 1}/${visible.length}` : "0"}</span></div>
    <div className="mx-auto flex w-full max-w-xl gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item} type="button" onClick={() => choose(item)} className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-black capitalize transition ${filter === item ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:text-foreground"}`}>{item.replace("_", " ")}</button>)}</div>
    <div className="mx-auto grid w-full max-w-xl grid-cols-[2.75rem_1fr_2.75rem] items-center gap-2"><button type="button" onClick={() => browse("right")} disabled={index === 0} aria-label="Previous proposal" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-lg transition hover:border-primary disabled:opacity-20">←</button><div className="h-1 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: current ? `${((index + 1) / visible.length) * 100}%` : "0%" }} /></div><button type="button" onClick={() => browse("left")} disabled={!current || index === visible.length - 1} aria-label="Next proposal" className="grid h-11 w-11 place-items-center rounded-full border border-border bg-card text-lg transition hover:border-primary disabled:opacity-20">→</button></div>
    {current ? <ReviewCard key={`${current.id}-${index}`} item={current} direction={direction} onBrowse={browse} /> : <div className="mx-auto w-full max-w-xl rounded-3xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">No proposals match this view.</div>}
    <p className="text-center text-[11px] font-semibold text-muted-foreground">Drag the card or use ← → to browse · decisions happen only with the buttons</p>
  </section>;
}
