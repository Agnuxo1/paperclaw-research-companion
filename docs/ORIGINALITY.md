# Original contribution and source audit

Audit date: September 30, 2026. Competition window began August 31, 2026. New companion implementation was started during that window. Existing checkouts are unchanged.

| Baseline | Verified state | Relationship to new work |
|---|---|---|
| Local `20_p2p-mcp-server` | commit `9c15bca3c6c440a6b9f32c276d08f7c8346ae9d5`, Feb 15; SDK 0.6, stdio and REST. Existing modified/untracked files preserved. Package declares MIT but no root license file found. | Historical baseline, not current remote capability. No copied code. |
| Current remote `Agnuxo1/p2pclaw-mcp-server` | HEAD `064e01217998c331620be5918ba8fcbfbf858871`, monorepo, SDK ^1.26, source already imports StreamableHTTPServerTransport. Package declares ISC, README points to Public Good license; linked LICENSE unavailable (404). | No relicensing. New read-only metadata adapter uses live `/api/dataset/papers`. Streamable HTTP itself is not claimed as a new ecosystem invention. |
| Local `93_paperclaw-extension` | commit `904ca6b1b4fc99b90fd97f05ce8d4af3104e0d62`, Apr 30; MIT, Francisco Angulo de Lafuente. Generates/publishes papers from user descriptions. | New product shifts from generating papers to investigating existing evidence. No source code copied. |
| Current remote `Agnuxo1/paperclaw-extension` | HEAD `68170aef725eed56fd49978c7d3359b112aae523`, additional browser/IDE work already present. | Those existing improvements are not claimed for this entry. |

## Before → after

Before: an IDE publishing client and a network gateway for scientific agents. After: an original browser research desk and MCP toolset that discovers external publications and P2PCLAW contributions, distinguishes publication provenance, compares scope and short evidence excerpts, keeps private reading collections and exports a reproducible cited brief.

The significant new conversational feature is a multi-step, stateful research workflow: question → clarify → retrieve → select → compare → save → return → export. Original contributions include the editorial UI, privacy boundaries, shared research service, three-provider adapter, extractive brief, collection schema, test suite and live client verification. Existing scientific results, code, agents, users and reviews are not represented as newly created.

## Name and rights

An exact web search for “PaperClaw Research Companion” was performed September 30, 2026; no exact conflicting product was returned. This limited search does not establish trademark clearance. PaperClaw already exists in the user's verified GitHub ecosystem, authored by Francisco Angulo de Lafuente. The companion uses original visuals and source code. No upstream LICENSE is altered. Dependencies are pinned with a lockfile and keep their own licenses. P2PCLAW content is not copied; only title, author and record identifiers are used. Brief snippets from external abstracts are attributed and intentionally short.

## Source links

- https://github.com/Agnuxo1/p2pclaw-mcp-server
- https://github.com/Agnuxo1/paperclaw-extension
- https://amazonappdev2026.devpost.com/rules
- https://amazonappdev2026.devpost.com/details/faqs

Final companion commit and tag are recorded in `evidence/release.json` once publication is complete. A local draft is not a competition submission.
