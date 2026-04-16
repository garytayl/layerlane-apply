import Link from "next/link";
import { fieldInputLgClass } from "@/lib/form-classes";
import { createJob } from "../actions";

export default function NewJobPage() {
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground hover:underline">
          ← Jobs
        </Link>
        <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight">New job</h1>
        <p className="text-sm text-muted-foreground">
          Paste the job description. You can run analysis on the next screen.
        </p>
      </div>
      <form action={createJob} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-foreground">
          URL (optional)
          <input name="url" type="url" className={fieldInputLgClass} placeholder="https://..." />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm text-foreground">
            Title
            <input name="title" className={fieldInputLgClass} />
          </label>
          <label className="flex flex-col gap-1 text-sm text-foreground">
            Company
            <input name="company" className={fieldInputLgClass} />
          </label>
        </div>
        <label className="flex flex-col gap-1 text-sm text-foreground">
          Job description *
          <textarea
            name="raw_jd_text"
            required
            rows={14}
            className={`${fieldInputLgClass} font-mono`}
            placeholder="Paste full posting text…"
          />
        </label>
        <button
          type="submit"
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Save & continue
        </button>
      </form>
    </div>
  );
}
