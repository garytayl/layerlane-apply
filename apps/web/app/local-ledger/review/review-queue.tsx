"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { LocalInboxItem } from "@/lib/local-ledger";
import { fieldInputClass } from "@/lib/form-classes";
import { acceptInbox, rejectInbox } from "./actions";

const foundationalTypes = new Set(["profile_update", "education_proposal", "experience_proposal", "project_proposal", "skill_proposal"]);
const filters = ["all", "foundation", "career_claim", "application_event", "project_evidence"] as const;
type Filter = (typeof filters)[number];
type Direction = "left" | "right";
const value = (payload: Record<string, unknown>, key: string) => String(payload[key] ?? "");
const listValue = (payload: Record<string, unknown>, key: string) => Array.isArray(payload[key]) ? (payload[key] as unknown[]).join("\n") : value(payload, key);

function titleFor(item: LocalInboxItem) {
  const p = item.payload;
  return String(p.name || p.label || p.project_name || p.employer || p.institution || p.company || p.project_key || "Incoming update");
}

function detailFor(item: LocalInboxItem) {
  const p = item.payload;
  if (item.item_type === "profile_update") return [p.primary_email, p.phone, p.portfolio_url].filter(Boolean).join(" · ");
  if (item.item_type === "education_proposal") return [p.degree, p.major, p.concentration].filter(Boolean).join(" · ");
  if (item.item_type === "experience_proposal") return [p.title, p.employer, p.start_date, p.end_date || (p.is_current ? "Present" : null)].filter(Boolean).join(" · ");
  if (item.item_type === "project_proposal") return String(p.summary || p.project_status || "Project awaiting review");
  if (item.item_type === "skill_proposal") return listValue(p, "skills").replace(/\n/g, " · ");
  if (item.item_type === "application_event") return `${String(p.role || "Unknown role")} · ${String(p.status || "unknown status")}`;
  return String(p.summary || p.note || p.quote || "Update awaiting review");
}

function Field({ label, name, initial, required = false, type = "text" }: { label: string; name: string; initial: string; required?: boolean; type?: string }) {
  return <label className="grid gap-1 text-xs font-semibold text-muted-foreground"><span>{label}</span><input name={name} type={type} defaultValue={initial} required={required} className={fieldInputClass} /></label>;
}

function TypedFields({ item }: { item: LocalInboxItem }) {
  const p = item.payload;
  if (item.item_type === "profile_update") return <div className="grid gap-3 sm:grid-cols-2"><Field label="Name" name="name" initial={value(p, "name")} required /><Field label="Primary email" name="primary_email" initial={value(p, "primary_email")} type="email" /><Field label="Phone" name="phone" initial={value(p, "phone")} /><Field label="Portfolio" name="portfolio_url" initial={value(p, "portfolio_url")} /></div>;
  if (item.item_type === "education_proposal") return <div className="grid gap-3 sm:grid-cols-2"><Field label="School" name="institution" initial={value(p, "institution")} required /><Field label="Degree" name="degree" initial={value(p, "degree")} required /><Field label="Major" name="major" initial={value(p, "major")} /><Field label="Concentration" name="concentration" initial={value(p, "concentration")} /><Field label="Graduation date" name="graduation_date" initial={value(p, "graduation_date")} /><Field label="GPA" name="gpa" initial={value(p, "gpa")} /></div>;
  if (item.item_type === "experience_proposal") return <div className="grid gap-3 sm:grid-cols-2"><Field label="Employer" name="employer" initial={value(p, "employer")} required /><Field label="Title" name="title" initial={value(p, "title")} required /><Field label="Location" name="location" initial={value(p, "location")} /><Field label="Start date" name="start_date" initial={value(p, "start_date")} /><Field label="End date" name="end_date" initial={value(p, "end_date")} /><label className="flex min-h-11 items-center gap-2 self-end rounded-xl border border-border bg-card px-3 text-sm"><input type="checkbox" name="is_current" defaultChecked={Boolean(p.is_current)} />Current role</label><label className="grid gap-1 text-xs font-semibold text-muted-foreground sm:col-span-2">Responsibilities<textarea name="responsibilities" defaultValue={listValue(p, "responsibilities")} rows={3} className={fieldInputClass} /></label></div>;
  if (item.item_type === "project_proposal") return <div className="grid gap-3 sm:grid-cols-2"><Field label="Project" name="project_name" initial={value(p, "project_name")} required /><Field label="Status" name="project_status" initial={value(p, "project_status")} /><Field label="URL" name="project_url" initial={value(p, "project_url")} /><Field label="Technologies" name="technologies" initial={listValue(p, "technologies").replace(/\n/g, ", ")} /><label className="grid gap-1 text-xs font-semibold text-muted-foreground sm:col-span-2">Summary<textarea name="summary" defaultValue={value(p, "summary")} rows={3} className={fieldInputClass} /></label></div>;
  if (item.item_type === "skill_proposal") return <label className="grid gap-1 text-xs font-semibold text-muted-foreground">Skills · one per line<textarea name="skills" defaultValue={listValue(p, "skills")} rows={6} required className={fieldInputClass} /></label>;
  if (item.item_type === "career_claim") return <div className="grid gap-3"><Field label="Canonical key" name="canonical_key" initial={value(p, "canonical_key")} required /><Field label="Display label" name="label" initial={value(p, "label")} required /><label className="grid gap-1 text-xs font-semibold text-muted-foreground">Atomic career claim<textarea name="summary" defaultValue={value(p, "summary")} rows={3} required className={fieldInputClass} /></label></div>;
  return <pre className="max-h-56 overflow-auto rounded-xl bg-background p-4 text-xs leading-5">{JSON.stringify(p, null, 2)}</pre>;
}

function ReviewCard({ item, direction, onSwipe }: { item: LocalInboxItem; direction: Direction; onSwipe: (direction: Direction) => void }) {
  const pointerStart = useRef<number | null>(null);
  function beginSwipe(event: React.PointerEvent<HTMLDivElement>) { pointerStart.current = event.clientX; event.currentTarget.setPointerCapture(event.pointerId); }
  function finishSwipe(event: React.PointerEvent<HTMLDivElement>) { if (pointerStart.current === null) return; const distance = event.clientX - pointerStart.current; pointerStart.current = null; if (Math.abs(distance) >= 55) onSwipe(distance < 0 ? "left" : "right"); }
  return <article className={`overflow-hidden rounded-3xl border border-border/70 bg-card shadow-2xl shadow-black/10 ${direction === "left" ? "animate-review-card-in-right" : "animate-review-card-in-left"}`}>
    <div className="touch-pan-y select-none px-5 py-4 sm:px-6" onPointerDown={beginSwipe} onPointerUp={finishSwipe} onPointerCancel={() => { pointerStart.current = null; }}>
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wide"><span className="text-primary">{item.item_type.replaceAll("_", " ")}</span><span className="text-muted-foreground">·</span><span className="text-amber-700 dark:text-amber-300">{item.assertion_state}</span></div>
      <h3 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">{titleFor(item)}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{detailFor(item)}</p>
    </div>
    <form action={acceptInbox} className="grid gap-4 border-t border-border/70 bg-muted/15 p-5 sm:p-6">
      <input type="hidden" name="id" value={item.id} /><TypedFields item={item} />
      <details className="rounded-xl border border-border/70 bg-background/40"><summary className="cursor-pointer list-none px-4 py-3 text-xs font-bold text-muted-foreground">Source evidence · {item.source_title}</summary><div className="grid gap-2 border-t border-border/70 p-4 text-xs text-muted-foreground"><p>{item.source_type} · {new Date(item.source_timestamp || item.created_at).toLocaleString()}</p>{item.source_ref ? <p className="break-all">{item.source_ref}</p> : null}<p className="leading-5">Original payload and provenance remain in the audit trail.</p></div></details>
      <input name="review_note" placeholder="Optional review note or correction reason" className={fieldInputClass} />
      <div className="grid grid-cols-2 gap-3"><button formAction={rejectInbox} className="min-h-12 rounded-xl border border-destructive/40 text-sm font-bold text-destructive transition hover:bg-destructive hover:text-destructive-foreground">Reject</button><button className="min-h-12 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90">Accept</button></div>
    </form>
  </article>;
}

export function ReviewQueue({ items }: { items: LocalInboxItem[] }) {
  const [filter, setFilter] = useState<Filter>("all"); const [query, setQuery] = useState(""); const [index, setIndex] = useState(0); const [direction, setDirection] = useState<Direction>("left");
  const visible = useMemo(() => items.filter((item) => { const typeMatch = filter === "all" || (filter === "foundation" ? foundationalTypes.has(item.item_type) : item.item_type === filter); const haystack = `${titleFor(item)} ${detailFor(item)} ${item.source_title}`.toLowerCase(); return typeMatch && haystack.includes(query.toLowerCase()); }), [filter, items, query]);
  const current = visible[index];
  function navigate(next: Direction) { setDirection(next); setIndex((at) => next === "left" ? Math.min(at + 1, visible.length - 1) : Math.max(at - 1, 0)); }
  useEffect(() => { function keys(event: KeyboardEvent) { if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLSelectElement) return; if (event.key === "ArrowLeft") { setDirection("right"); setIndex((at) => Math.max(at - 1, 0)); } if (event.key === "ArrowRight") { setDirection("left"); setIndex((at) => Math.min(at + 1, visible.length - 1)); } } window.addEventListener("keydown", keys); return () => window.removeEventListener("keydown", keys); }, [visible.length]);
  const chooseFilter = (next: Filter) => { setFilter(next); setIndex(0); }; const search = (next: string) => { setQuery(next); setIndex(0); };
  return <section className="grid gap-4"><div className="sticky top-3 z-20 grid gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-xl md:grid-cols-[1fr_auto]"><input value={query} onChange={(event) => search(event.target.value)} placeholder="Search the review queue…" aria-label="Search review queue" className={fieldInputClass} /><div className="flex gap-2 overflow-x-auto pb-1">{filters.map((item) => <button key={item} type="button" onClick={() => chooseFilter(item)} className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold ${filter === item ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{item === "foundation" ? "Foundation" : item.replace("_", " ")}</button>)}</div></div>
    <div className="flex items-end justify-between"><div><h2 className="text-xl font-semibold">Decision deck</h2><p className="text-sm text-muted-foreground">Structured fields first. Swipe to browse.</p></div>{current ? <p className="text-sm font-bold text-primary">{index + 1} / {visible.length}</p> : null}</div>
    {!current ? <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No updates match this view.</div> : <><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-500" style={{ width: `${((index + 1) / visible.length) * 100}%` }} /></div><ReviewCard key={`${current.id}-${index}-${direction}`} item={current} direction={direction} onSwipe={navigate} /><nav className="sticky bottom-3 z-20 grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-2xl backdrop-blur-xl" aria-label="Review queue navigation"><button type="button" onClick={() => navigate("right")} disabled={index === 0} className="min-h-12 rounded-xl border border-border bg-background px-4 text-left font-bold disabled:opacity-30">← <span className="hidden sm:inline">Previous</span></button><span className="text-center text-xs text-muted-foreground"><strong className="block text-base text-foreground">{index + 1}</strong>of {visible.length}</span><button type="button" onClick={() => navigate("left")} disabled={index === visible.length - 1} className="min-h-12 rounded-xl border border-border bg-background px-4 text-right font-bold disabled:opacity-30"><span className="hidden sm:inline">Next</span> →</button></nav></>}
  </section>;
}
