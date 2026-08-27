import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getBridgeDiagnostics, getBridgeMode, isLoopbackHostname } from "@/lib/chq-bridge";
import { fieldCardClass } from "@/lib/form-classes";
import { NewClientForm } from "./new-client-form";
import { revokeClientAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function BridgeDiagnosticsPage() {
  const host = (await headers()).get("host") || "";
  const hostname = host ? new URL(`http://${host}`).hostname : "";
  if (getBridgeMode() !== "local" || !isLoopbackHostname(hostname)) notFound();
  const diagnostics = await getBridgeDiagnostics();
  const active = diagnostics.clients.filter((client) => !client.revoked_at && Date.parse(client.expires_at) > Date.now());
  return <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-4 py-10">
    <header className="flex flex-col gap-2 border-b border-border pb-6">
      <Link href="/local-ledger" className="text-sm text-primary underline">← Master Career Ledger</Link>
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">External Dev Bridge</p>
      <h1 className="font-display text-3xl font-semibold tracking-tight">Bridge diagnostics</h1>
      <p className="max-w-3xl text-sm text-muted-foreground">Local administration for scoped, expiring AI-client access. This page is never served to remote hosts.</p>
    </header>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className={fieldCardClass}><p className="text-xs text-muted-foreground">Status</p><p className="text-xl font-semibold text-emerald-600">Ready</p></div>
      <div className={fieldCardClass}><p className="text-xs text-muted-foreground">Mode</p><p className="text-xl font-semibold">{diagnostics.mode}</p></div>
      <div className={fieldCardClass}><p className="text-xs text-muted-foreground">Authenticated clients</p><p className="text-xl font-semibold">{active.length}</p></div>
      <div className={fieldCardClass}><p className="text-xs text-muted-foreground">Recent failed auth</p><p className="text-xl font-semibold">{diagnostics.failed_authorization_attempts}</p></div>
    </section>

    {diagnostics.mode === "remote" ? <section className="rounded border border-amber-500/50 bg-amber-500/10 p-4 text-sm"><strong>Remote mode is enabled.</strong> Keep CHQ behind an HTTPS reverse proxy or private tunnel; never forward the Next.js development port directly.</section> : null}

    <section className={`grid gap-4 ${fieldCardClass}`}><h2 className="text-lg font-medium">Create an authenticated client</h2><NewClientForm /></section>

    <section className="grid gap-4"><h2 className="text-lg font-medium">Clients</h2>
      {diagnostics.clients.length === 0 ? <p className={`${fieldCardClass} text-sm text-muted-foreground`}>No persistent clients yet.</p> : <div className="overflow-auto rounded border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted/50"><tr><th className="p-3">Name</th><th className="p-3">Scopes</th><th className="p-3">Expires</th><th className="p-3">Last used</th><th className="p-3">Status</th></tr></thead><tbody>{diagnostics.clients.map((client) => <tr key={client.id} className="border-t border-border"><td className="p-3 font-medium">{client.name}</td><td className="p-3 text-xs">{client.scopes.join(", ")}</td><td className="p-3">{new Date(client.expires_at).toLocaleString()}</td><td className="p-3">{client.last_used_at ? new Date(client.last_used_at).toLocaleString() : "Never"}</td><td className="p-3">{client.revoked_at ? "Revoked" : <form action={revokeClientAction}><input type="hidden" name="id" value={client.id} /><button className="text-destructive underline">Revoke</button></form>}</td></tr>)}</tbody></table></div>}
    </section>

    <section className="grid gap-4"><div><h2 className="text-lg font-medium">Recent remote requests</h2><p className="text-sm text-muted-foreground">Rate limit: {diagnostics.rate_limit_per_minute} requests per minute per client.</p></div>
      {diagnostics.requests.length === 0 ? <p className={`${fieldCardClass} text-sm text-muted-foreground`}>No bridge requests logged yet.</p> : <div className="overflow-auto rounded border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted/50"><tr><th className="p-3">Time</th><th className="p-3">Client</th><th className="p-3">Operation</th><th className="p-3">Outcome</th><th className="p-3">Source</th></tr></thead><tbody>{diagnostics.requests.map((request) => <tr key={request.id} className="border-t border-border"><td className="p-3">{new Date(request.created_at).toLocaleString()}</td><td className="p-3">{request.client_name || "Unknown"}</td><td className="p-3"><code>{request.operation || "—"}</code></td><td className="p-3">{request.status_code} · {request.outcome}</td><td className="p-3">{request.source_type || "—"}{request.source_ref ? ` · ${request.source_ref}` : ""}</td></tr>)}</tbody></table></div>}
    </section>
  </main>;
}
