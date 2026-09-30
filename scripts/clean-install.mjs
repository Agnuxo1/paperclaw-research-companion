import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import assert from "node:assert/strict";
const dir = resolve(".cache/clean-install");
mkdirSync(dir, { recursive: true });
for (const file of [
  "package.json",
  "package-lock.json",
  "server.mjs",
  "lib",
  "public",
  "test",
  "README.md",
])
  cpSync(file, resolve(dir, file), { recursive: true });
const installed = spawnSync(
  "npm.cmd",
  [
    "ci",
    "--ignore-scripts",
    "--no-audit",
    "--no-fund",
    "--cache",
    resolve(".cache/npm"),
  ],
  { cwd: dir, shell: true, encoding: "utf8" },
);
if (installed.status !== 0) throw new Error("Clean npm ci failed");
const tests = spawnSync(process.execPath, ["--test", "test/*.test.mjs"], {
  cwd: dir,
  encoding: "utf8",
});
if (tests.status !== 0) throw new Error(tests.stdout);
const server = spawn(process.execPath, ["server.mjs"], {
  cwd: dir,
  env: { ...process.env, PORT: "4318" },
  stdio: ["ignore", "pipe", "pipe"],
});
await new Promise((r, j) => {
  const timer = setTimeout(() => j(new Error("Startup timeout")), 15000);
  server.stdout.on("data", (d) => {
    if (d.toString().includes("PaperClaw ready")) {
      clearTimeout(timer);
      r();
    }
  });
  server.on("error", j);
});
try {
  const base = "http://127.0.0.1:4318";
  assert.equal((await fetch(base)).status, 200);
  const session = await fetch(base + "/api/session");
  const cookie = session.headers.get("set-cookie").split(";")[0];
  const { csrf } = await session.json();
  const r = await fetch(base + "/api/chat", {
    method: "POST",
    headers: {
      Cookie: cookie,
      "Content-Type": "application/json",
      "X-CSRF-Token": csrf,
    },
    body: JSON.stringify({ message: "microplastics removal drinking water" }),
  });
  const result = await r.json();
  assert.ok(result.result.papers.length >= 2);
  writeFileSync(
    "evidence/clean-install.json",
    JSON.stringify(
      {
        date: new Date().toISOString(),
        directory: dir,
        node: process.version,
        steps: [
          "Fresh source copy without node_modules or data",
          "npm ci --ignore-scripts",
          "npm test",
          "npm start equivalent: node server.mjs",
          "GET browser app",
          "New private session",
          "Live Europe PMC search",
        ],
        passed: true,
        sourceCount: result.result.papers.length,
      },
      null,
      2,
    ),
  );
  console.log("Clean install, tests, startup and live search passed.");
} finally {
  server.kill();
}
