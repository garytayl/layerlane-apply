import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { Request, Response } from "express";
import { createBridgeClient } from "./bridge-client.js";
import { createCareerHqMcpServer } from "./mcp.js";

const bridge = createBridgeClient({
  url: process.env.CHQ_MCP_BRIDGE_URL ?? "http://127.0.0.1:3000/api/chq/bridge",
  token: process.env.CHQ_MCP_BRIDGE_TOKEN ?? "",
  allowRemote: process.env.CHQ_MCP_ALLOW_REMOTE_BRIDGE === "true",
});

if ((process.env.CHQ_MCP_TRANSPORT ?? "stdio") === "http") {
  const port = Number(process.env.CHQ_MCP_PORT ?? "3100");
  const app = createMcpExpressApp({ host: "127.0.0.1" });
  app.post("/mcp", async (req: Request, res: Response) => {
    const server = createCareerHqMcpServer(bridge);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on("close", () => { void transport.close(); void server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
  app.listen(port, "127.0.0.1", () => process.stderr.write(`Career HQ MCP listening locally at http://127.0.0.1:${port}/mcp\n`));
} else {
  const server = createCareerHqMcpServer(bridge);
  await server.connect(new StdioServerTransport());
}
