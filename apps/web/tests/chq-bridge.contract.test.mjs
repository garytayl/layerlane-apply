import assert from "node:assert/strict";
import test from "node:test";
import { chqBridgeRequestSchema, chqBridgeScopeByOperation } from "../../../packages/core/src/chq-bridge.ts";

test("the external contract exposes only scoped Career HQ operations", () => {
  assert.deepEqual(Object.keys(chqBridgeScopeByOperation).sort(), [
    "get_application_pipeline", "get_candidate_profile", "get_project_evidence",
    "list_experience", "list_needs_review", "propose_claim", "propose_profile_update",
    "propose_education", "propose_experience", "propose_project", "propose_skills", "search_evidence",
    "stage_application_event", "stage_project_evidence",
  ].sort());
});

test("remote verification and raw database operations are impossible to parse", () => {
  assert.equal(chqBridgeRequestSchema.safeParse({ operation: "confirm_claim", claim_id: crypto.randomUUID() }).success, false);
  assert.equal(chqBridgeRequestSchema.safeParse({ operation: "sql", query: "select * from career_ledger_records" }).success, false);
  assert.equal(chqBridgeRequestSchema.safeParse({ operation: "delete_record", id: crypto.randomUUID() }).success, false);
});

test("remote proposal text is bounded and source attribution is required", () => {
  const base = { operation: "propose_claim", external_id: "conversation:1", canonical_key: "claim:test",
    label: "Test claim", assertion_state: "proposed", source: { type: "chatgpt_library", title: "Test conversation" } };
  assert.equal(chqBridgeRequestSchema.safeParse({ ...base, summary: "A" }).success, true);
  assert.equal(chqBridgeRequestSchema.safeParse({ ...base, summary: "A".repeat(10_001) }).success, false);
  assert.equal(chqBridgeRequestSchema.safeParse({ ...base, summary: "A", source: undefined }).success, false);
});

test("foundational data uses structured proposal operations", () => {
  const source = { type: "chatgpt_library", title: "Resume" };
  assert.equal(chqBridgeRequestSchema.safeParse({ operation: "propose_profile_update", external_id: "profile:1", name: "Gary Taylor", primary_email: "gary@example.com", source }).success, true);
  assert.equal(chqBridgeRequestSchema.safeParse({ operation: "propose_education", external_id: "education:1", canonical_key: "education:iu", institution: "Indiana University", degree: "Bachelor of Science", major: "Informatics", source }).success, true);
  assert.equal(chqBridgeRequestSchema.safeParse({ operation: "propose_experience", external_id: "experience:1", canonical_key: "experience:test", employer: "Example", title: "Engineer", responsibilities: ["Built a system"], source }).success, true);
  assert.equal(chqBridgeRequestSchema.safeParse({ operation: "propose_profile_update", external_id: "profile:bad", name: "Gary", primary_email: "not-an-email", source }).success, false);
});
