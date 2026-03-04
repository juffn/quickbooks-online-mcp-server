#!/usr/bin/env node

/**
 * HTTP MCP server for Cowork / remote clients.
 * Run with: node dist/http-server.js
 * Listens on MCP_HTTP_PORT (default 3100) at POST /mcp
 */

import http from "http";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { registerAllTools } from "./helpers/register-all-tools.js";

dotenv();

function dotenv() {
  // Load .env manually so this works without importing dotenv at top-level
  // (quickbooks-client.ts already calls dotenv.config() on import)
}

const port = parseInt(process.env.MCP_HTTP_PORT ?? "3100");

const httpServer = http.createServer(async (req, res) => {
  if (req.method === "POST" && (req.url === "/mcp" || req.url?.startsWith("/mcp?"))) {
    // Stateless: new server + transport per request
    const server = new McpServer({
      name: "QuickBooks Online MCP Server",
      version: "1.0.0",
      capabilities: { tools: {} },
    });
    registerAllTools(server);

    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
    });

    await server.connect(transport);
    await transport.handleRequest(req, res);
    await server.close();
  } else {
    res.writeHead(404).end("Not found");
  }
});

httpServer.listen(port, () => {
  console.log(`QBO MCP HTTP server running on http://localhost:${port}/mcp`);
});

httpServer.on("error", (err) => {
  console.error("HTTP server error:", err.message);
  process.exit(1);
});
