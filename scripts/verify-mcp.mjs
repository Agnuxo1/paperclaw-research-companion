import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { writeFileSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
const endpoint = process.env.ENDPOINT || "http://127.0.0.1:4317/mcp";
const initialize = await fetch(endpoint, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  },
  body: JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "paperclaw-wire-verifier", version: "1.0" },
    },
  }),
});
const handshake = await initialize.json();
assert.equal(handshake.result.protocolVersion, "2025-11-25");
const client = new Client({
  name: "paperclaw-real-sdk-client",
  version: "1.0",
});
await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
const tools = await client.listTools();
assert.equal(tools.tools.length, 3);
assert.ok(!tools.tools.some((t) => t.name === "save_collection"));
const sources = await client.callTool({
  name: "discover_sources",
  arguments: {
    query: "microplastics removal drinking water",
    provider: "europepmc",
  },
});
assert.ok(!sources.isError);
const result = JSON.parse(sources.content[0].text);
assert.ok(result.papers.length >= 2);
const ids = result.papers.slice(0, 2).map((p) => p.id);
const comparison = await client.callTool({
  name: "compare_sources",
  arguments: { ids },
});
assert.ok(!comparison.isError);
const brief = await client.callTool({
  name: "create_evidence_brief",
  arguments: { query: result.query, ids },
});
assert.ok(!brief.isError);
const resources = await client.listResources();
assert.ok(resources.resources.some((r) => r.uri === "paperclaw://method"));
const resource = await client.readResource({ uri: "paperclaw://method" });
assert.ok(resource.contents.length);
await client.ping();
await client.close();
const get = await fetch(endpoint);
assert.equal(get.status, 405);
const del = await fetch(endpoint, { method: "DELETE" });
assert.equal(del.status, 405);
const evidence = {
  date: new Date().toISOString(),
  endpoint,
  protocol: handshake.result.protocolVersion,
  transport: "Streamable HTTP, stateless JSON response mode",
  client:
    "@modelcontextprotocol/sdk 1.31.0 Client + StreamableHTTPClientTransport",
  tools: tools.tools.map((t) => t.name),
  papers: result.papers.map((p) => ({ id: p.id, title: p.title, url: p.url })),
  checks: [
    "initialize wire version",
    "SDK client connect",
    "listTools",
    "discover_sources live",
    "compare_sources",
    "create_evidence_brief",
    "listResources",
    "readResource",
    "ping",
    "close",
    "GET/DELETE 405",
    "writes absent without authorization",
  ],
};
mkdirSync("evidence", { recursive: true });
writeFileSync(
  "evidence/mcp-verification.json",
  JSON.stringify(evidence, null, 2),
);
console.log(
  JSON.stringify({
    passed: true,
    protocol: evidence.protocol,
    tools: evidence.tools,
    sourceCount: result.papers.length,
  }),
);
