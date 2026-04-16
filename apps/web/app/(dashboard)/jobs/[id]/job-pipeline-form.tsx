"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateJobPipeline } from "../actions";

const STATUS_OPTIONS = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offered", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "withdrawn", label: "Withdrawn" },
  { value: "archived", label: "Archived" },
] as const;

function SaveStatus() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save tracking"}
    </button>
  );
}

export function JobPipelineForm({
  jobId,
  initialStatus,
  initialNotes,
}: {
  jobId: string;
  initialStatus: string;
  initialNotes: string | null;
}) {
  const [state, formAction] = useActionState(updateJobPipeline, null);

  const inList = STATUS_OPTIONS.some((o) => o.value === initialStatus);
  const statusValue = inList ? initialStatus : "saved";
  const customStatus = !inList && initialStatus ? initialStatus : null;

  return (
    <form
      key={`${jobId}-${initialStatus}-${initialNotes ?? ""}`}
      action={formAction}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card/40 p-4"
    >
      <input type="hidden" name="job_id" value={jobId} />
      <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Tracking</h2>
      <label className="flex flex-col gap-1 text-sm text-foreground">
        Status
        <select
          name="status"
          defaultValue={customStatus ?? statusValue}
          className="rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
          {customStatus ? (
            <option value={customStatus}>{customStatus} (current)</option>
          ) : null}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-foreground">
        Notes
        <textarea
          name="notes"
          defaultValue={initialNotes ?? ""}
          rows={4}
          placeholder="Next steps, contacts, links…"
          className="rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground"
        />
      </label>
      {state?.error ? (
        <p className="text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : state && !state.error ? (
        <p className="text-sm text-muted-foreground" role="status">
          Saved.
        </p>
      ) : null}
      <SaveStatus />
    </form>
  );
}
