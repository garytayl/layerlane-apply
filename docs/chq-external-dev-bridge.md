# Career HQ external development bridge

The bridge at `POST /api/chq/bridge` is a narrow adapter over Career HQ's typed service layer. PGlite remains the only canonical store. Remote callers never receive a database path, database credential, table name, generic CRUD operation, or SQL capability.

## Safe defaults

- `npm run dev` binds Next.js to `127.0.0.1`.
- `CHQ_BRIDGE_MODE` defaults to `local`; non-loopback requests are rejected and audited.
- Remote mode requires both `CHQ_BRIDGE_MODE=remote` and `CHQ_BRIDGE_REMOTE_ENABLED=true`.
- Remote mode rejects requests unless the trusted reverse proxy reports HTTPS with `X-Forwarded-Proto: https`.
- The request body is limited to 64 KiB and all fields are parsed by strict, bounded Zod schemas before reaching services.
- Rate limiting defaults to 60 requests per minute per authenticated client. Failed authentication is limited and audited by a salted IP hash.

Do not port-forward the Next.js development server. For development outside this computer, use a private authenticated tunnel or an HTTPS reverse proxy that terminates TLS, restricts ingress, and forwards only `/api/chq/bridge`. The diagnostics page and client-administration actions are loopback-only.

## Credentials

Create a client from `http://127.0.0.1:3000/local-ledger/bridge`. CHQ displays the token once and stores only its SHA-256 hash. Every client has explicit scopes, an expiry no longer than 30 days, and immediate revocation.

The optional `CHQ_BRIDGE_BOOTSTRAP_TOKEN` works only in local mode and only until `CHQ_BRIDGE_BOOTSTRAP_EXPIRES_AT`. It exists for isolated tests and initial tooling—not normal remote access.

## External operations

| Operation | Scope | Behavior |
| --- | --- | --- |
| `get_candidate_profile` | `profile:read` | Reads the candidate profile |
| `list_experience` | `profile:read` | Reads experience records |
| `search_evidence` | `evidence:read` | Searches bounded evidence text |
| `get_project_evidence` | `evidence:read` | Reads one project's evidence |
| `list_needs_review` | `review:read` | Reads the staged review queue |
| `get_application_pipeline` | `applications:read` | Reads applications and status history |
| `propose_claim` | `proposals:write` | Stages a claim in the Inbox |
| `stage_application_event` | `proposals:write` | Stages an application event |
| `stage_project_evidence` | `proposals:write` | Stages project evidence |

There is intentionally no verify, accept, reject, delete, export-all, SQL, filesystem, or generic update operation. Every write records the authenticated client name in the sync batch and preserves the caller's source attribution. It remains pending until reviewed locally.

The older `/api/chq` development prototype and local snapshot route are retained for local compatibility but are disabled whenever bridge remote mode is active. They are not alternative remote entry points.

## Request example

```http
POST /api/chq/bridge HTTP/1.1
Authorization: Bearer chq_client_<id>.<secret>
Content-Type: application/json

{
  "operation": "propose_claim",
  "external_id": "conversation-123:claim-1",
  "canonical_key": "claim:goodwill:design-transfers",
  "label": "Goodwill design transfers",
  "summary": "Completed 3 design transfers.",
  "assertion_state": "user_confirmed",
  "source": {
    "type": "chatgpt_library",
    "title": "Conversation with Gary",
    "external_ref": "conversation-123"
  }
}
```

## ChatGPT / MCP path

The thin stateless MCP translator now lives in `apps/chq-mcp`. It publishes one tool per operation above and calls only this bridge with a scoped, expiring client token. See `chq-mcp-connectivity.md` for local testing and the recommended outbound-only OpenAI Secure MCP Tunnel setup. It does not embed PGlite access or a generic HTTP proxy.

Before remote use, add operating-system secret storage for the client token, a trusted HTTPS tunnel/reverse proxy, token rotation, log retention controls, and backup/recovery for the local ledger. This sprint does not create a public or multi-user service.
