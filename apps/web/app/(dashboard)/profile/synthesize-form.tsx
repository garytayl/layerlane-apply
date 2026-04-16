"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { synthesizeProfileAction } from "../sources/actions";

function SubmitLabel() {
  const { pending } = useFormStatus();
  return pending ? "Synthesizing…" : "Regenerate profile";
}

export function SynthesizeForm() {
  const [state, formAction] = useActionState(synthesizeProfileAction, null);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">
        Uses your evidence bank and settings preferences. Edit the bank first, then regenerate.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          <SubmitLabel />
        </button>
        {state?.error ? (
          <span className="text-sm text-destructive" role="alert">
            {state.error}
          </span>
        ) : null}
      </div>
    </form>
  );
}
