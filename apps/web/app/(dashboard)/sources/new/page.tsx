import Link from "next/link";
import { fieldInputLgClass } from "@/lib/form-classes";
import { createSourceDocument } from "../actions";
import { SOURCE_KIND_OPTIONS } from "../kinds";

export default function NewSourcePage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <div>
        <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground">
          ← Sources
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">New source</h1>
        <p className="mt-1 max-w-lg text-sm text-muted-foreground">
          One paste (or a plain-text file). Save first—then run extraction on the next screen.
        </p>
      </div>

      <form action={createSourceDocument} className="flex flex-col gap-0 overflow-hidden rounded-xl border border-border bg-card/50 shadow-sm">
        <div className="border-b border-border bg-muted/30 px-4 py-4 sm:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
            <label className="min-w-0 flex-1 text-sm font-medium text-foreground">
              Name
              <input
                name="title"
                placeholder="e.g. Resume 2025"
                autoComplete="off"
                className={`mt-1.5 ${fieldInputLgClass} w-full`}
              />
            </label>
            <label className="w-full shrink-0 text-sm font-medium text-foreground sm:w-52">
              Type
              <select name="kind" className={`mt-1.5 ${fieldInputLgClass} w-full`} defaultValue="resume">
                {SOURCE_KIND_OPTIONS.map((k) => (
                  <option key={k.value} value={k.value}>
                    {k.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        <label className="block px-4 pb-2 pt-5 text-sm font-medium text-foreground sm:px-5">
          Text
          <textarea
            name="raw_text"
            rows={18}
            placeholder="Paste resume, LinkedIn dump, cover letter, referral note…"
            className={`mt-2 min-h-[280px] w-full resize-y ${fieldInputLgClass} font-[system-ui] leading-relaxed`}
          />
        </label>

        <details className="group border-t border-border px-4 py-3 sm:px-5">
          <summary className="cursor-pointer list-none text-sm font-medium text-muted-foreground transition hover:text-foreground [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <span className="text-primary">+</span>
              Upload a .txt file instead
            </span>
          </summary>
          <p className="mb-2 mt-3 text-xs text-muted-foreground">
            Or drop the paste above—this is optional if you already pasted.
          </p>
          <input
            name="file"
            type="file"
            accept=".txt,text/plain"
            className="w-full max-w-md text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
          />
        </details>

        <div className="flex flex-col gap-2 border-t border-border bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-muted-foreground">PDF and DOCX later—plain text only for now.</p>
          <button
            type="submit"
            className="w-full rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto"
          >
            Save source
          </button>
        </div>
      </form>
    </div>
  );
}
