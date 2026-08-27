import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { bridgeOperations, createBridgeClient, validateBridgeUrl } from "../dist/bridge-client.js";
import { createCareerHqMcpServer } from "../dist/mcp.js";

async function connectedClient() {
  const calls = [];
  const server = createCareerHqMcpServer({ call: async (request) => { calls.push(request); return { accepted: true, request }; } });
  const client = new Client({ name: "chq-mcp-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server, calls };
}

test("publishes only the nine narrow CHQ tools with safe annotations", async () => {
  const { client, server } = await connectedClient();
  try {
    const tools = (await client.listTools()).tools;
    assert.deepEqual(tools.map((tool) => tool.name).sort(), [...bridgeOperations].sort());
    for (const tool of tools) {
      assert.equal(tool.annotations?.destructiveHint, false);
      assert.equal(tool.annotations?.openWorldHint, false);
      assert.equal(tool.annotations?.readOnlyHint, !tool.name.startsWith("stage_") && tool.name !== "propose_claim");
    }
    assert.equal(tools.some((tool) => /sql|verify|delete|proxy/i.test(tool.name)), false);
  } finally { await client.close(); await server.close(); }
});

test("authorized reads map to a fixed bridge operation", async () => {
  const { client, server, calls } = await connectedClient();
  try {
    const response = await client.callTool({ name: "search_evidence", arguments: { query: "TypeScript" } });
    assert.deepEqual(calls, [{ operation: "search_evidence", query: "TypeScript" }]);
    assert.equal(response.structuredContent.result.accepted, true);
  } finally { await client.close(); await server.close(); }
});

test("claim proposals preserve attribution and stage through the bridge", async () => {
  const { client, server, calls } = await connectedClient();
  try {
    await client.callTool({ name: "propose_claim", arguments: {
      external_id: "chat-123:claim-1", canonical_key: "claim:goodwill:transfers",
      label: "Goodwill design transfers", summary: "Completed three design transfers.",
      assertion_state: "user_confirmed", source: { type: "chatgpt_library", title: "Career conversation", external_ref: "chat-123" },
    } });
    assert.equal(calls[0].operation, "propose_claim");
    assert.equal(calls[0].source.type, "chatgpt_library");
    assert.equal(calls[0].assertion_state, "user_confirmed");
  } finally { await client.close(); await server.close(); }
});

test("invalid and privileged-shaped input never reaches the bridge", async () => {
  const { client, server, calls } = await connectedClient();
  try {
    const response = await client.callTool({ name: "propose_claim", arguments: { operation: "verify_claim" } });
    assert.equal(response.isError, true);
    assert.equal(calls.length, 0);
    const unavailable = await client.callTool({ name: "verify_claim", arguments: {} });
    assert.equal(unavailable.isError, true);
  } finally { await client.close(); await server.close(); }
});

test("bridge client defaults to loopback and forwards no arbitrary operation", async () => {
  assert.equal(validateBridgeUrl("http://127.0.0.1:3000/api/chq/bridge").hostname, "127.0.0.1");
  assert.throws(() => validateBridgeUrl("http://example.com/api/chq/bridge"));
  assert.throws(() => validateBridgeUrl("https://example.com/api/chq/bridge"));
  assert.equal(validateBridgeUrl("https://example.com/api/chq/bridge", true).hostname, "example.com");
  const bridge = createBridgeClient({ url: "http://127.0.0.1:3000/api/chq/bridge", token: "test" });
  await assert.rejects(bridge.call({ operation: "raw_sql", sql: "select 1" }), /Unsupported/);
});
