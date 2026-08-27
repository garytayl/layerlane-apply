import assert from "node:assert/strict";

const baseUrl = process.env.CHQ_BRIDGE_TEST_URL || "http://127.0.0.1:3000/api/chq/bridge";
const token = process.env.CHQ_BRIDGE_TEST_TOKEN;
if (!token) throw new Error("CHQ_BRIDGE_TEST_TOKEN is required");

async function request(body, suppliedToken = token) {
  return fetch(baseUrl, { method: "POST", headers: { "content-type": "application/json", ...(suppliedToken ? { authorization: `Bearer ${suppliedToken}` } : {}) }, body: JSON.stringify(body) });
}

const authorizedRead = await request({ operation: "get_candidate_profile" });
assert.equal(authorizedRead.status, 200, "authorized reads work");

const externalId = `bridge-integration-${Date.now()}`;
const proposal = await request({ operation: "propose_claim", external_id: externalId,
  canonical_key: `claim:${externalId}`, label: "Bridge integration proposal",
  summary: "Synthetic proposal used by the isolated bridge integration test.",
  assertion_state: "proposed", source: { type: "chatgpt_library", title: "Bridge integration test", external_ref: externalId } });
assert.equal(proposal.status, 200, "authorized proposals stage correctly");
const proposalBody = await proposal.json();
assert.equal(proposalBody.result.status, "queued_for_review");

const review = await request({ operation: "list_needs_review" });
const reviewBody = await review.json();
assert.ok(reviewBody.result.inbox.some((item) => item.external_id === externalId), "proposal appears in Needs Review");

assert.equal((await request({ operation: "get_candidate_profile" }, "wrong-token")).status, 401, "unauthorized requests fail");
assert.equal((await request({ operation: "confirm_claim", claim_id: crypto.randomUUID(), rationale: "not allowed" })).status, 400, "remote verification fails");
assert.equal((await request({ operation: "sql", query: "select * from career_ledger_records" })).status, 400, "raw database access is not exposed");

console.log("CHQ bridge integration checks passed");
