import Link from "next/link";
import { fieldInputLgClass } from "@/lib/form-classes";
import { createSourceDocument } from "../actions";

const kinds = [
  { value: "resume", label: "Resume" },
  { value: "linkedin", label: "LinkedIn / about" },
  { value: "cover_letter", label: "Cover letter" },
  { value: "referral", label: "Referral / testimonial" },
  { value: "portfolio", label: "Portfolio / project writeup" },
  { value: "paste", label: "General paste" },
  { value: "other", label: "Other" },
];

export default function NewSourcePage() {
  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div>
        <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground">
          ← Sources
        </Link>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">Add source</h1>
        <p className="text-sm text-muted-foreground">
          Paste text or upload a plain <code className="rounded bg-muted px-1">.txt</code> file. PDF
          support can come later.
        </p>
      </div>

      <form action={createSourceDocument} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Title
          <input name="title" placeholder="e.g. Resume 2025" className={fieldInputLgClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Kind
          <select name="kind" className={fieldInputLgClass} defaultValue="resume">
            {kinds.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Text
          <textarea
            name="raw_text"
            rows={14}
            placeholder="Paste resume, LinkedIn export, cover letter, etc."
            className={fieldInputLgClass}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Or upload .txt
          <input name="file" type="file" accept=".txt,text/plain" className="text-sm" />
        </label>
        <button
          type="submit"
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Save source
        </button>
      </form>
    </div>
  );
}
