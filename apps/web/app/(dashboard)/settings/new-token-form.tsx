"use client";

import { useActionState } from "react";
import { createApiToken } from "./actions";

export function NewTokenForm() {
  const [state, formAction, pending] = useActionState(createApiToken, null);

  return (
    <div className="flex flex-col gap-3">
      <form action={formAction} className="flex flex-col gap-2">
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Generate API token"}
        </button>
      </form>
      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state?.token ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <p className="font-medium text-amber-950 dark:text-amber-100">Copy this token now</p>
          <p className="mt-1 break-all font-mono text-xs text-amber-950 dark:text-amber-50">
            {state.token}
          </p>
          <p className="mt-2 text-amber-900/90 dark:text-amber-200/90">
            It is only shown once. Use it in the extension as Bearer auth.
          </p>
        </div>
      ) : null}
    </div>
  );
}
