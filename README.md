# PaperClaw Research Companion

**Follow the evidence. Keep what matters.** A private research desk that turns a question into real publications, a careful comparison, and a saved, exportable reading trail.

Built for the Alexa+ track of Build, Ship, Shape: Amazon Developer Hackathon. The project contains a real **MCP 2025-11-25 server over Streamable HTTP**, plus its own web-based conversational simulator. It is an independent prototype with no certified connection to Alexa or Echo. No gated Amazon SDK is used.

## Run locally

Requirements: Node.js 22.18 or newer, npm, Internet access for live publication searches. No API keys, account registration, hosted model or paid service is required.

```sh
git clone https://github.com/Agnuxo1/paperclaw-research-companion.git
cd paperclaw-research-companion
npm ci --ignore-scripts
npm start
```

Open **http://127.0.0.1:4317**. On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`. To keep the npm cache on D:, use `npm.cmd --cache D:/PROJECTS/npm-cache ci --ignore-scripts`.

1. Choose Europe PMC for life sciences, Crossref for wider bibliographic search, or P2PCLAW for network contributions.
2. Try “microplastics removal drinking water”. The assistant retrieves up to six real source records.
3. Open a source. Inspect publication type and date. Abstract excerpts are labeled as author statements.
4. Select two to four sources and compare their metadata, scope and short excerpts.
5. Select relevant sources, save a named collection, open My collections and export a Markdown evidence brief.

You can also type “compare sources”, “save as Water evidence”, or “show my collections”. Ambiguous short inputs trigger clarification. Voice dictation requires browser support and microphone permission; it may use the browser vendor's speech service. Dictated text is reviewed before submission. Speech output is optional. Every research operation works by text.

## Architecture and limits

Plain browser ES modules and original CSS → Express 5 → a shared research service → Europe PMC, Crossref or read-only P2PCLAW metadata. Collections use SQLite, isolated by a persistent browser cookie. CSRF tokens protect browser writes. Documents are treated as data; no text from them executes or authorizes actions.

The web assistant is deterministic and extractive, with an intent router. It does not pretend to provide LLM reasoning. An external MCP-compatible assistant can use the real tools for broader conversational reasoning. Shared terms indicate topic overlap, **not agreement**. Full-text quality assessment, quantified effect sizes, scientific consensus and decision recommendations are outside this version. Crossref returns metadata only. P2PCLAW contributions may be AI generated and are not independently peer reviewed. Europe PMC emphasizes biomedical/life-science coverage. The project is an evidence collection aid, not a systematic review engine.

The server binds to loopback and validates Host and Origin. It is intended for one local machine. **Do not expose it to the Internet** without HTTPS, real authentication, per-user identity, durable session controls and deployment review. The browser cookie controls access to its local collections; clearing it loses access. Back up `data/collections.sqlite` together with its WAL files while stopped. No telemetry or network publishing operations exist. Searches send the question to the selected index.

## MCP client

Endpoint: `http://127.0.0.1:4317/mcp`. Stateless Streamable HTTP with JSON responses, protocol `2025-11-25`. GET and DELETE return 405, as permitted for this transport mode. Read-only tools:

- `discover_sources(query, provider)`
- `compare_sources(ids)`
- `create_evidence_brief(query, ids)`

Resource: `paperclaw://method`. Source IDs must come from a recent search on this running server. Restarting clears the search cache but not saved browser collections.

For an explicitly authorized local MCP collection client, set **MCP_WRITE_TOKEN** in the server environment and pass `Authorization: Bearer <same token>` in the client's HTTP request headers. This enables `save_collection`, `list_collections`, and `export_collection` for a dedicated MCP owner, separated from browser collections. Never put the token in a repository, browser code or video. Default MCP tools cannot write collections.

## Verify

With the server running:

```sh
npm test
npm run verify:mcp
npm run benchmark
```

Tests cover document-instruction non-execution, ownership isolation and persistence, export, empty results, provider failures, CSRF and hostile origins. MCP verification uses the official SDK client plus a wire handshake asserting the actual protocol version. Live measurements and links are saved under `evidence/`; they are observations, not targets or proof of user productivity gains. See [validation](docs/VALIDATION.md), [original contribution](docs/ORIGINALITY.md), [feedback](docs/FEEDBACK.md), and [submission materials](docs/SUBMISSION.md).

## Configuration

`PORT` defaults to `4317`. `DATA_DIR` defaults to `data`. `MCP_WRITE_TOKEN` is optional. No model credentials are required. Node's built-in SQLite is experimental in Node 22 and prints a warning.

## Rights

Original companion code and visual assets: MIT, © 2026 Francisco Angulo de Lafuente. No upstream source code, logo, image, font or audio is copied into this app. System fonts and original CSS are used. The existing PaperClaw name belongs to the user's ecosystem; the companion descriptor is new. This is not a trademark clearance opinion. Third-party dependencies keep their licenses. Publication metadata and brief attributed excerpts retain their respective rights; do not republish full documents without permission.
