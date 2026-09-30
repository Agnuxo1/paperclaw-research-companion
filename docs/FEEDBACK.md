# Product feedback and observed friction

Date: September 30, 2026. These are observed development findings, not feedback attributed to invented users.

## MCP TypeScript SDK 1.31.0
Used: server tools/resource, StreamableHTTPServerTransport and the real Client/StreamableHTTPClientTransport verifier.
Worked well: stateless JSON mode made a small localhost server easy to integrate; schemas and tool annotations are explicit; the client exercised tools and resource reads successfully.
Needs work: old ecosystem examples describe stdio/SSE while the competition requires a precise newer protocol. A minimal contest-ready sample should expose negotiated protocol and an executable conformance check.
Onboarding: installed from npm with a pinned version, reviewed official v1 examples, verified the actual initialize response.
Build again: yes, for portable tools that can be tested independently of a UI or gated platform.

## Europe PMC REST API
Used: live publication metadata and short attributed abstract excerpts. No full text is scraped.
Worked well: core JSON records include identifiers, publication types and abstracts; queries worked without an API key.
Needs work: record pages returned 403 to our automated link checks even though the REST search succeeded. A machine-readable resolver/access field would make link verification easier.
Onboarding: a single REST request produced useful records, followed by explicit provider limits in the UI.
Build again: yes, for life-science discovery, with full-text access checked separately.

## Crossref REST API
Used: broader journal-article bibliographic search; abstracts are not reused.
Worked well: DOI records and bibliographic metadata required no paid service or API key.
Needs work: relevance can favor a broad or conference-like item; DOI redirects may lead to publisher anti-bot pages. HTTP 200 alone is insufficient to validate readability.
Onboarding: small URL query and normalization into the common source schema.
Build again: yes, for identifiers and metadata, not as an independent findings database.

## P2PCLAW dataset API
Used: read-only public title/author/identifier metadata, labeled as network contributions.
Worked well: the current website's `/api/dataset/papers` returned real stored records.
Needs work: legacy README/extension Railway URL returned 404; `/api/la-rueda` from the remote README was unavailable while `/api/wheel` returned an empty array. Current source and docs should list the supported base URL and endpoint schema consistently. License references also need a resolvable canonical file.
Onboarding: inspected both original checkouts and current GitHub revisions; verified live routes.
Build again: yes for network discovery, with provenance labels and no implication of academic peer review.

## Express 5 and Node.js SQLite
Used: backend routing/security and local collection persistence.
Worked well: minimal dependencies; SQLite survived reopen with ownership constraints; tests exercised browser write protection.
Needs work: built-in SQLite is experimental in Node 22, which complicates long-term compatibility expectations. Runtime pinning and clear upgrade checks are necessary.
Onboarding: Node 22.18, npm lockfile, prepared statements and fresh-directory test.
Build again: yes for a small local application; choose a stable persistence driver for production hosting.

## Browser speech APIs
Used: optional question dictation and brief read-aloud.
Worked well: text remains the universal route; dictated text is reviewed before submitting.
Needs work: availability and permissions differ by browser; speech recognition may use an external vendor service. Product should show availability and privacy implications before recording.
Onboarding: feature detection and error recovery; no paid service.
Build again: yes as an optional convenience. Microphone input is not yet verified on this device; do not claim a measured voice success rate.

## Development tool feedback
Codex: used to implement, inspect and test original code. Tool-assisted exact checks produced concrete artifacts. Local Windows PowerShell utility-module failures required Python or direct commands. Browser download observation stalled without yielding a result; this was a tooling failure, not evidence that a collection exported. Build again: yes, with explicit timeouts and factual checkpoints.
GitHub: used to inspect current upstream revisions and publish original source. Browser naming check confirmed the new repository slug was available. Build again: yes; keep source audit and license evidence attached to releases.
JEV: used for the architecture decision, not inside the delivered app. Sandbox doctor failed; remote query succeeded under the authorized user profile and verified provenance/status/exit code. Build again: yes for bounded recommendations with real execution verified separately.

## Friction log

| Task | Reproduction | Expected vs actual | Severity | Workaround and suggestion |
|---|---|---|---|---|
| Use legacy P2PCLAW gateway | GET extension's configured Railway URL | Live gateway; got Application not found/404 | Important | Verify current website API; publish a stable canonical API URL and deprecation notice. |
| Follow P2PCLAW README collection route | GET `/api/la-rueda` | Collection; got 404 | Important | Inspect current source routes; add route tests tied to README examples. |
| Verify publication links | REST search, then GET returned Europe PMC record URL | Readable record; got 403 | Important | Verify separately in normal browser; provide a documented API record resolver. |
| Validate DOI landing page | Follow DOI redirect | Publication; one redirected to anti-bot challenge with HTTP 200 | Important | Keep canonical DOI; distinguish HTTP response from readable content; suggest structured access metadata. |
| Get Alexa+ private SDK | Read hackathon FAQ | Participants cannot apply for preview tools | Important | Use own simulator and real MCP. Provide a public minimal simulator sample aligned with current rules. |
| Observe browser export download | Browser UI export with tool download listener | A local file path; listener stalled | Important | Backend export tests pass; save a user-visible fallback. Tool should report download failure promptly. |

## Feature requests
MCP/competition docs: a tiny maintained protocol-verification harness — Important.
Alexa+ track resources: an ungated reference simulator with text and voice fallback — Important.
Publication indexes: explicit link access and retraction metadata — Important.
P2PCLAW: canonical supported base URL, endpoint schema and resolvable license — Critical for downstream integration.
