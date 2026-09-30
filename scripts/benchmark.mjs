import { Research } from "../lib/research.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
const research = new Research({ directory: ".cache/benchmark" });
const rows = [];
for (const [query, provider] of [
  ["microplastics removal drinking water", "europepmc"],
  ["urban green space mental health", "europepmc"],
  ["lithium battery recycling", "crossref"],
  ["routing", "p2pclaw"],
  ["zzzxxyyunknownpaperclawzz", "europepmc"],
]) {
  const start = performance.now();
  try {
    const r = await research.search(query, provider);
    const cold = performance.now() - start;
    const hot = performance.now();
    await research.search(query, provider);
    const cached = performance.now() - hot;
    const links = [];
    for (const p of r.papers.slice(0, 2)) {
      try {
        const l = await fetch(p.url, {
          redirect: "follow",
          signal: AbortSignal.timeout(12000),
        });
        const resolved = new URL(l.url);
        const challenge = /validate\.|perfdrive/.test(resolved.hostname);
        resolved.search = "";
        resolved.hash = "";
        links.push({ url: p.url, status: l.status, finalUrl: resolved.toString(), ...(challenge ? { access: "Anti-bot challenge; HTTP 200 does not establish readable publication" } : {}) });
        await l.body?.cancel();
      } catch (e) {
        links.push({ url: p.url, error: e.name });
      }
    }
    rows.push({
      query,
      provider,
      coldMs: Math.round(cold),
      cachedMs: Math.round(cached * 100) / 100,
      count: r.papers.length,
      links,
    });
  } catch (e) {
    rows.push({
      query,
      provider,
      error: e.message,
      elapsedMs: Math.round(performance.now() - start),
    });
  }
}
research.db.close();
mkdirSync("evidence", { recursive: true });
writeFileSync(
  "evidence/benchmark.json",
  JSON.stringify(
    {
      date: new Date().toISOString(),
      runtime: process.version,
      method:
        "Sequential cold provider search followed by in-memory cache hit; first two source links checked with live GET. One run per topic, no statistical inference or user study.",
      rows,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify(
    rows.map(({ query, provider, coldMs, count, error }) => ({
      query,
      provider,
      coldMs,
      count,
      error,
    })),
  ),
);
