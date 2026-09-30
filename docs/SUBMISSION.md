# Devpost submission copy — English

## Name
PaperClaw Research Companion

## Tagline
Follow the evidence. Keep what matters. A conversational research desk with real sources, careful comparisons and private reading collections.

## Inspiration and customer
An environmental researcher preparing a water-treatment briefing needs more than a quick answer. They need to find the actual publications, distinguish a preprint from a review, see what each source covers, and return to the evidence behind their decision. Today that trail often gets lost across browser tabs and notes.

PaperClaw already helped the P2PCLAW ecosystem create and publish research. We wanted a companion for the other side of that work: investigating existing evidence without confusing generated text with established findings.

## What it does
Ask a question by text or optional voice dictation. PaperClaw clarifies vague inputs and searches Europe PMC, Crossref or the P2PCLAW network. It returns real publication records with openable citations, publication dates and types, plus short, clearly attributed abstract excerpts when available. Select sources to compare their scope, dates and evidence. Save the useful sources into a private local collection, return to it later and export a Markdown evidence brief with references and known unknowns.

Our principle is deliberately visible: a citation is a starting point, not a substitute for reading. Author statements, metadata and assistant synthesis are separated. Topic overlap is not presented as agreement. P2PCLAW network contributions are labeled as potentially AI generated rather than independently peer reviewed.

## How we built it
A small, reproducible Node.js application serves an original editorial web interface, research tools and SQLite collections. The official MCP SDK 1.31.0 provides a real MCP 2025-11-25 endpoint over stateless Streamable HTTP. We verified the negotiated protocol on the wire and executed its tools with the official SDK client.

The browser experience is our independent Alexa+ conversational simulator. It runs the real shared research tools and keeps conversational state, using a deterministic intent router and extractive evidence handling. No private Amazon SDK, certified Echo integration or hosted generative model is claimed. An MCP-compatible assistant can use the same tools for further conversational reasoning.

Browser sessions isolate collections; CSRF checks protect writes, and MCP tools are read-only unless a local write token is explicitly configured. The server binds to loopback, validates Host and Origin and escapes untrusted document text. Every function works by text when browser voice is unavailable. The UI uses system fonts and original CSS, with keyboard controls, accessible status updates, responsive layouts and reduced-motion support.

## Original work during the hackathon
This companion is a new application created September 30, 2026. The before/after is a shift from the existing PaperClaw IDE publishing workflow and P2PCLAW gateway to a stateful, user-facing evidence workflow: question, clarify, search, inspect, compare, save, recover and export. The UI, research service, provider adapters, collection persistence, boundaries and validation were created for this entry. The current upstream P2PCLAW server already contained Streamable HTTP code; we do not claim to have invented or first added that capability to the ecosystem. No upstream source code or license was replaced.

## What we verified
Live searches returned six sources for microplastics removal and urban green-space research, six Crossref records for battery recycling, and four P2PCLAW network records for routing. In one sequential run on Node 22.18/Windows, cold search times were 368 ms, 224 ms, 687 ms and 4,032 ms respectively. A deliberately nonexistent topic returned zero records in 171 ms. These are single-run observations, not service guarantees, user productivity measurements or statistical comparisons.

Tests cover collection isolation, persistence and export, hostile Origins, CSRF, ambiguity, empty results, provider failures and document-instruction non-execution. The real browser workflow covers search, selection, comparison, saving and opening a collection. Live link checks revealed publisher/index anti-bot restrictions, so we do not equate a successful metadata retrieval or HTTP status with full-text access.

## Challenges and what we learned
The original Railway URL was unavailable, and the local P2PCLAW checkout lagged far behind GitHub. We checked the current code and used the live site's read-only metadata route. We also found conflicting upstream license indications; separating original code avoided relicensing anything. Protocol compatibility required an actual client handshake rather than assuming that an old stdio/SSE endpoint satisfied Streamable HTTP.

## Limits and next steps
The web assistant is extractive, not a general-purpose language model. It cannot establish scientific consensus, assess complete methods or recommend an intervention from metadata. Europe PMC has a life-science focus; Crossref provides bibliographic metadata. P2PCLAW title search covers the available first 500 records. Voice support depends on the browser. This is a local workspace, not a production multi-user hosted service. Planned improvements, not implemented results, include structured full-text appraisal under compatible licenses and a user-selected local model.

## Track and mini-challenges
Primary: Alexa+ — self-hosted MCP server with own independent web simulator.
AWS Builder: not entered; no AWS services were used.
Open Source: evaluate only after a separate qualifying public contribution exists. Publishing the primary-track app alone is not represented as a separate additional contribution.

## Links and final status
Repository: https://github.com/Agnuxo1/paperclaw-research-companion
Local demo: http://127.0.0.1:4317 (judges run the README)
Video: completed locally, 118.38 seconds, 1920x1080, English synthetic narration and SRT subtitles. Public YouTube publication awaits explicit account/file approval; do not submit a placeholder.
Code release: v0.1.0, commit d57cee8b6db46fd38e493f1be880ef8a7cdf5a83.
Devpost entry URL and submitted confirmation: pending; a prepared document is not submission.
