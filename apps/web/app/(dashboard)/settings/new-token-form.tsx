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
          className="w-fit rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-neutral-100 dark:text-neutral-900"
        >
          {pending ? "Creating…" : "Generate API token"}
        </button>
      </form>
      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state?.token ? (
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950">
          <p className="font-medium text-amber-900 dark:text-amber-100">Copy this token now</p>
          <p className="mt-1 break-all font-mono text-xs text-amber-950 dark:text-amber-50">
            {state.token}
          </p>
          <p className="mt-2 text-amber-800 dark:text-amber-200">
            It is only shown once. Use it in the extension as Bearer auth.
          </p>
        </div>
      ) : null}
    </div>
  );
}
