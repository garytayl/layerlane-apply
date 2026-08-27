"use client";

import { useActionState } from "react";
import { chqBridgeScopeSchema } from "@layerlane/core";
import { fieldInputClass, primaryButtonClass } from "@/lib/form-classes";
import { createClientAction, type NewClientState } from "./actions";

const initialState: NewClientState = {};

export function NewClientForm() {
  const [state, action, pending] = useActionState(createClientAction, initialState);
  return <form action={action} className="grid gap-3">
    <input name="name" required maxLength={200} placeholder="Client name, e.g. ChatGPT development" className={fieldInputClass} />
    <label className="grid gap-1 text-sm"><span>Credential lifetime (hours, maximum 720)</span><input name="ttl_hours" type="number" min="1" max="720" defaultValue="24" className={fieldInputClass} /></label>
    <fieldset className="grid gap-2"><legend className="mb-1 text-sm font-medium">Allowed scopes</legend>
      {chqBridgeScopeSchema.options.map((scope) => <label key={scope} className="flex items-center gap-2 text-sm"><input type="checkbox" name="scopes" value={scope} defaultChecked />{scope}</label>)}
    </fieldset>
    <button disabled={pending} className={primaryButtonClass}>{pending ? "Creating…" : "Create revocable client"}</button>
    {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
    {state.token ? <div className="rounded border border-amber-500/50 bg-amber-500/10 p-3 text-sm">
      <p className="font-medium">Copy this token now. CHQ stores only its hash.</p>
      <code className="mt-2 block break-all select-all">{state.token}</code>
      <p className="mt-2 text-xs text-muted-foreground">Expires {state.expiresAt}</p>
    </div> : null}
  </form>;
}
