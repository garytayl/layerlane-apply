# Career HQ tool API

## Local-first synchronization boundary

PGlite on the Windows machine is the canonical Career HQ store. External AI clients never receive database credentials and never submit SQL. They call the typed service boundary with a bearer token.

External writes are deliberately asymmetric:

1. A client submits a proposed claim, application event, or project evidence.
2. CHQ stores the complete payload in `chq_inbox_items`, including source type, title, external reference, source timestamp, assertion state, and import batch.
3. The desktop **Needs Review** screen is the only place that accepts, corrects, or rejects the update.
4. Accepted claims become `supported`, not `verified`. Verification remains a separate explicit decision with append-only history.
5. Rejected items remain in the inbox audit trail and do not enter the ledger.

JSON and CSV imports use the same boundary. Snapshot export is available locally at `/local-ledger/snapshot`; it contains sensitive career data and is restricted to loopback requests. A spreadsheet may consume this export, but it is never the source of truth.

## Sync envelope

```json
{
  "version": 1,
  "producer": { "type": "chatgpt", "name": "Career HQ conversation" },
  "items": [{
    "type": "career_claim",
    "external_id": "conversation-123:claim-1",
    "assertion_state": "user_confirmed",
    "canonical_key": "claim:goodwill:design-transfers",
    "label": "Goodwill design transfers",
    "summary": "Completed 3 design transfers.",
    "source": {
      "type": "chatgpt_library",
      "title": "Conversation with Gary",
      "external_ref": "conversation-123",
      "timestamp": "2026-08-26T01:00:00.000Z"
    }
  }]
}
```

CSV uses the corresponding headers: `type`, `external_id`, `assertion_state`, `canonical_key`, `label`, `summary`, `company`, `role`, `application_id`, `status`, `occurred_at`, `project_key`, `quote`, `note`, `supports`, `source_type`, `source_title`, `source_ref`, and `source_timestamp`.

Repeated `(source_type, external_id)` pairs are idempotent and are not queued twice.

## Security rules

- `CHQ_TOOL_TOKEN` is required and compared in constant time.
- The API exposes named operations only; no tables, SQL, filesystem paths, or arbitrary queries.
- `confirm_claim` and `reject_claim` are blocked at the HTTP boundary. Only the local review UI may make trust decisions.
- Imported ChatGPT data can be `proposed` or `user_confirmed`; neither state maps to `verified`.
- The future MCP server should be a thin adapter over this API/service contract, run with least privilege, TLS, token rotation, request-size limits, and an audit log. It must not access PGlite directly.

Career HQ has one backend and two intended clients: the local application/Codex and, later, ChatGPT through a narrow tool server. Neither client should query arbitrary tables. Both should call the typed operations in `packages/core/src/chq-service.ts`, implemented by `apps/web/lib/chq-service.ts`.

## Local API

The Next.js route `POST /api/chq` exposes the versioned operation contract. It is disabled unless `CHQ_TOOL_TOKEN` is configured and requires `Authorization: Bearer <token>`. The dashboard does not need this token because its Server Actions call the same service layer directly.

Example read:

```http
POST /api/chq
Authorization: Bearer <CHQ_TOOL_TOKEN>
Content-Type: application/json

{"operation":"search_evidence","query":"SQL"}
```

Example proposed claim:

```json
{
  "operation": "propose_career_claim",
  "canonical_key": "claim:goodwill:design-transfers",
  "label": "Goodwill design transfers",
  "summary": "Completed 3 design transfers.",
  "assertion_state": "user_confirmed",
  "source": { "type": "chatgpt_library", "title": "Conversation with Gary" }
}
```

Supported operations:

- `get_candidate_profile`
- `get_needs_review`
- `generate_resume_context`
- `export_snapshot`
- `list_experience`
- `search_evidence`
- `search_verified_evidence`
- `get_project_evidence`
- `list_unverified_claims`
- `list_conflicts`
- `propose_career_claim`
- `record_application`
- `update_application_status`
- `add_project_evidence`
- `ingest_source`

Write operations validate input, preserve provenance, and queue career updates for local review. The API never accepts raw SQL or table names. Internal `confirm_claim` and `reject_claim` service operations remain available to trusted local code but the HTTP route blocks them.

## Future MCP bridge

The MCP server should be a thin adapter over this service contract:

1. Define one MCP tool per stable CHQ operation.
2. Reuse the Zod request schemas from `@layerlane/core` for tool inputs.
3. Call the service directly when the MCP server runs beside CHQ, or call `/api/chq` with a scoped token when it runs remotely.
4. Expose verified reads and proposal tools. Keep acceptance, rejection, correction, and verification local to the desktop review UI.
5. Never expose database credentials, PGlite files, Supabase service keys, generic SQL, or generic CRUD tools.

For cross-device ChatGPT access later, put this same API behind HTTPS and a private authenticated tunnel or deployment. Do not expose the local Next.js development server directly to the public internet.

## Source of truth

Database rows are canonical career truth. Documents in ChatGPT Library are source material or generated artifacts. Ingestion copies their evidence into Career HQ with provenance; it does not make the Library a second database.
