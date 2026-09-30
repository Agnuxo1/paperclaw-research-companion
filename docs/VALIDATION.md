# Validation evidence

Environment: Windows, Node.js 22.18.0, pinned MCP SDK 1.31.0, September 30, 2026. No paid service, general LLM or user study.

## Completed

- `npm test`: three integration/domain tests passed, including session isolation, persistence after reopen, exports, hostile Origin, CSRF, ambiguous inputs, empty search, provider failure and document instructions remaining inert.
- `npm run verify:mcp`: actual initialize negotiated 2025-11-25; official Client + StreamableHTTPClientTransport connected and executed discover, compare and cited brief. Resource listing/read, ping, close and unsupported GET/DELETE 405 checked. Unauthenticated writes are absent.
- Fresh directory install using lockfile with no prior modules/data; startup, tests, browser HTML and live search passed. See `evidence/clean-install.json`.
- Browser workflow: real search, select two sources, compare, save named collection, open it from My collections, export the actual brief into a visible review panel. Export text saved to `evidence/exported-brief.md`.
- One source record opened in a normal Chrome tab with matching title, DOI and PMID; `evidence/source-open-browser.jpg`. Europe PMC returned 403 to an automated Node GET but the record rendered in the browser.
- Responsive views inspected at 390×844, 820×1180 and 1280×800 plus normal desktop. No horizontal overflow at 390 and 820. Original screenshots are in `evidence/`.
- Voice features detect availability and preserve text fallback. Microphone speech recognition has not been tested on this device; no claim of successful voice interaction is made. Browser speech output is optional.

## Measured search results

| Topic/index | Sources | Cold search | In-memory repeat |
|---|---:|---:|---:|
| Microplastics removal / Europe PMC | 6 | 368 ms | 0.01 ms |
| Green space and mental health / Europe PMC | 6 | 224 ms | 0.01 ms |
| Battery recycling / Crossref | 6 | 687 ms | 0.01 ms |
| Routing / P2PCLAW | 4 | 4,032 ms | 0.01 ms |
| Deliberately nonexistent topic / Europe PMC | 0 | 171 ms | 0.02 ms |

Method: one sequential cold request and one cache repeat per topic, timed inside the research service. Cache numbers exclude HTTP/UI rendering and are not end-to-end latency. No statistical inference. Search relevance was inspected for the demo, not quantitatively scored. Raw measurements, date and link access observations: `evidence/benchmark.json`. An HTTP 200 redirect to an anti-bot page does not establish readable full text.

## Boundaries and outstanding checks

The web assistant is deterministic/extractive. Comparison highlights metadata and excerpt differences; it does not establish scientific agreement. Source title/type labels may contain incomplete provider metadata. Short excerpts retain author/publisher rights. We do not scrape or redistribute full papers. No independent evaluation of decision quality or time saved has been performed.

Local private workspace only: cookie ownership is not suitable Internet authentication. Clearing the browser cookie loses access to collections; retain the SQLite database for backups. The token-enabled MCP owner is separate from browser collections. Protocol compliance is verified for the used operations, not asserted as full formal conformance across every optional MCP feature.

The first download-event observation stalled, so the export UI was improved to show the entire actual brief before offering a Markdown file. This verifies export contents directly. A completed browser file save is recorded separately only if a real file is obtained.

Devpost presentation and video publication are not completed merely by creating these files. See the factual checkpoint for external account/declaration blockers.
