# Career HQ tool API

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

Example user confirmation:

```json
{
  "operation": "confirm_claim",
  "claim_id": "00000000-0000-0000-0000-000000000000",
  "rationale": "Gary confirmed this against his employment records.",
  "confidence": 1
}
```

Supported operations:

- `get_candidate_profile`
- `list_experience`
- `search_evidence`
- `get_project_evidence`
- `list_unverified_claims`
- `list_conflicts`
- `confirm_claim`
- `reject_claim`
- `ingest_source`

Write operations validate input, preserve raw source content, and route verification changes through append-only history. The API never accepts raw SQL or table names.

## Future MCP bridge

The MCP server should be a thin adapter over this service contract:

1. Define one MCP tool per stable CHQ operation.
2. Reuse the Zod request schemas from `@layerlane/core` for tool inputs.
3. Call the service directly when the MCP server runs beside CHQ, or call `/api/chq` with a scoped token when it runs remotely.
4. Expose read tools broadly; require explicit user confirmation in the ChatGPT client before `confirm_claim`, `reject_claim`, or `ingest_source` writes.
5. Never expose database credentials, PGlite files, Supabase service keys, generic SQL, or generic CRUD tools.

For cross-device ChatGPT access later, put this same API behind HTTPS and a private authenticated tunnel or deployment. Do not expose the local Next.js development server directly to the public internet.

## Source of truth

Database rows are canonical career truth. Documents in ChatGPT Library are source material or generated artifacts. Ingestion copies their evidence into Career HQ with provenance; it does not make the Library a second database.
