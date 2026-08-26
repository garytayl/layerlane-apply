# Career HQ: Master Career Ledger

The Master Career Ledger is the canonical layer between raw career material and any future generated output. The existing evidence bank and source documents remain useful ingestion/read models; records are promoted into the ledger only when they have a stable identity (`canonical_key`).

## Data flow

1. Ingest a resume, profile, portfolio, note, or manual entry into `source_documents` and `source_chunks`.
2. Extract candidate facts without treating extraction as verification.
3. Upsert a normalized fact into `career_ledger_records`.
4. Attach every supporting or contradicting source through `ledger_evidence`, including a quote or location when available.
5. Record each verification decision in `ledger_verification_events`. Events are append-only; the ledger row stores only the current status and confidence.
6. Future resume generation, coaching, and autofill may consume verified ledger records. Autofill is explicitly outside this sprint.

## Verification semantics

- `unverified`: extracted or entered, but no evidence decision has been made.
- `supported`: at least one source supports the fact; stronger review may still be needed.
- `verified`: confirmed by cross-source agreement, user attestation, or manual review.
- `disputed`: evidence conflicts or the user rejected the fact.
- `stale`: once-valid time-sensitive information needs review.

Confidence is a bounded `0..1` signal, not a substitute for status. A status change should always append an event with a method, rationale, and the evidence IDs used.

## Provenance rules

- Preserve raw sources. Never overwrite them with normalized text.
- Prefer source chunks plus a precise locator (`quote`, page/section, or character range).
- Record contradictory evidence with `supports = false`; do not silently discard it.
- User attestation is valid evidence, but label it as such in the verification method.
- Generated prose must reference ledger record IDs so claims can be traced before use.

## Canonical keys

Keys are user-scoped and deterministic. Examples: `experience:amazon:process-assistant:2024-06`, `skill:sql`, or `preference:target-role`. Renaming a display label must not change the key. If two records are discovered to represent the same fact, merge evidence onto one record and retire the duplicate in a later, explicit workflow.
