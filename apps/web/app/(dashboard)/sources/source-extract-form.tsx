"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { runExtractionForm } from "./actions";

function SubmitLabel() {
  const { pending } = useFormStatus();
  return pending ? "Extracting…" : "Run AI extraction";
}

export function SourceExtractForm({ documentId }: { documentId: string }) {
  const [state, formAction] = useActionState(runExtractionForm, null);

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="id" value={documentId} />
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
      >
        <SubmitLabel />
      </button>
      {state?.error ? (
        <span className="text-sm text-destructive" role="alert">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
