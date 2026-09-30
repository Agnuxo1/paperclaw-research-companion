import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import assert from "node:assert/strict";
const token = randomBytes(32).toString("hex");
mkdirSync(".cache/mcp-write-test", { recursive: true });
const server = spawn(process.execPath, ["server.mjs"], {
  env: {
    ...process.env,
    PORT: "4319",
    DATA_DIR: ".cache/mcp-write-test",
    MCP_WRITE_TOKEN: token,
  },
  stdio: ["ignore", "pipe", "pipe"],
});
await new Promise((r, j) => {
  const t = setTimeout(() => j(new Error("Startup timeout")), 10000);
  server.stdout.on("data", (d) => {
    if (d.toString().includes("PaperClaw ready")) {
      clearTimeout(t);
      r();
    }
  });
  server.on("error", j);
});
const client = new Client({ name: "paperclaw-write-verifier", version: "1.0" });
try {
  await client.connect(
    new StreamableHTTPClientTransport(new URL("http://127.0.0.1:4319/mcp"), {
      requestInit: { headers: { Authorization: `Bearer ${token}` } },
    }),
  );
  const tools = await client.listTools();
  assert.equal(tools.tools.length, 6);
  const r = await client.callTool({
    name: "discover_sources",
    arguments: { query: "microplastics drinking water" },
  });
  const papers = JSON.parse(r.content[0].text).papers;
  const save = await client.callTool({
    name: "save_collection",
    arguments: {
      title: "Explicit verifier collection",
      query: "microplastics drinking water",
      ids: papers.slice(0, 2).map((p) => p.id),
    },
  });
  assert.ok(!save.isError);
  const id = JSON.parse(save.content[0].text).id;
  const list = await client.callTool({
    name: "list_collections",
    arguments: {},
  });
  assert.ok(JSON.parse(list.content[0].text).some((c) => c.id === id));
  const exported = await client.callTool({
    name: "export_collection",
    arguments: { id },
  });
  assert.match(JSON.parse(exported.content[0].text), /https:\/\/europepmc.org/);
  writeFileSync(
    "evidence/mcp-writes.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        passed: true,
        checks: [
          "token-configured tool exposure",
          "live discover",
          "explicit save",
          "list saved collection",
          "export referenced brief",
        ],
        secretsStored: false,
      },
      null,
      2,
    ),
  );
  console.log("Authenticated local MCP save/list/export passed.");
} finally {
  await client.close();
  server.kill();
}
