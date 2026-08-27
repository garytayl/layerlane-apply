# Career HQ MCP connectivity

`apps/chq-mcp` is a narrow Model Context Protocol adapter over the existing Career HQ bridge. It has no PGlite import, database credential, filesystem tool, generic URL fetcher, or generic proxy operation. The local ledger remains canonical and all three write tools only create Needs Review items.

## Security boundary

The adapter publishes exactly nine tools: the six bridge reads and the three staged writes documented in `chq-external-dev-bridge.md`. It authenticates to `/api/chq/bridge` with a scoped, expiring, revocable Career HQ client token. The token is never returned in tool output or logged by the adapter.

The default transport is stdio. It opens no listening socket. Optional HTTP mode is for local MCP Inspector testing only and is hard-bound to `127.0.0.1`; do not port-forward it or put it directly on the public internet.

The bridge URL also defaults to loopback. A non-loopback bridge requires both HTTPS and the explicit `CHQ_MCP_ALLOW_REMOTE_BRIDGE=true` escape hatch. Responses are time- and size-bounded, redirects are rejected, and every tool has a strict bounded input schema.

## Run locally

1. Start Career HQ and create a short-lived client on `http://127.0.0.1:3000/local-ledger/bridge`. Grant only the scopes the AI client needs.
2. Put `CHQ_MCP_BRIDGE_TOKEN` in the process environment. Do not commit it to `.env` or source control.
3. Build and start the adapter:

```powershell
npm run build:mcp
$env:CHQ_MCP_BRIDGE_TOKEN = "<expiring Career HQ client token>"
node apps/chq-mcp/dist/server.js
```

For MCP Inspector only:

```powershell
$env:CHQ_MCP_TRANSPORT = "http"
$env:CHQ_MCP_PORT = "3100"
node apps/chq-mcp/dist/server.js
```

The local Inspector endpoint is `http://127.0.0.1:3100/mcp`.

## Recommended ChatGPT developer connection

Use OpenAI Secure MCP Tunnel in developer mode. The tunnel is outbound-only and can launch this adapter over stdio, so neither the MCP endpoint nor the Next.js development server needs an inbound port.

After creating a Tunnel in the OpenAI Platform and installing its client, initialize a profile using the Platform-provided tunnel ID. Configure its MCP command to run the built adapter:

```powershell
tunnel-client init --profile chq-local --tunnel-id <platform-tunnel-id> --mcp-command "node C:\path\to\layerlane-apply\apps\chq-mcp\dist\server.js"
tunnel-client doctor --profile chq-local --explain
tunnel-client run --profile chq-local
```

Supply both the OpenAI tunnel runtime credential and `CHQ_MCP_BRIDGE_TOKEN` through a protected user/service environment or operating-system secret mechanism. Do not place either secret in the repository or command history. Then add the Tunnel-backed app in ChatGPT developer mode and verify the tool list before enabling it in a career conversation.

The remaining external prerequisites are OpenAI Platform access to create a Tunnel, a runtime API key with the required Tunnel permissions, access to ChatGPT developer mode, and association with the intended ChatGPT workspace. They are account-level setup, not CHQ code changes.

## Operating checklist

- Use a dedicated CHQ client for ChatGPT; keep its scopes minimal and expiry short.
- Revoke and replace the CHQ client immediately if its token is exposed.
- Confirm the MCP tool list contains only the nine named tools.
- Review Career HQ bridge audit logs and failed authorization attempts.
- Keep the app and bridge on loopback; the OpenAI tunnel should be the only remote path.
- Accept, correct, or reject every proposed write locally in Needs Review.
- Never describe a staged or user-confirmed claim as verified.
