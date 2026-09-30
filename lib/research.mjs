import { randomUUID } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

export const plain = (s) =>
  String(s ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(
      /&(?:amp|lt|gt|quot|apos);/g,
      (m) =>
        ({
          "&amp;": "&",
          "&lt;": "<",
          "&gt;": ">",
          "&quot;": '"',
          "&apos;": "'",
        })[m],
    )
    .replace(/\s+/g, " ")
    .trim();
const words = (s) =>
  plain(s)
    .toLowerCase()
    .match(/[a-z]{4,}/g) || [];
const stop = new Set(
  "this that with from have were been their these study studies results using used also into between research patients effects which more than through after before about could should would".split(
    " ",
  ),
);
const terms = (s) => [...new Set(words(s).filter((w) => !stop.has(w)))];
export class Research {
  constructor({ directory = "data", fetcher = fetch } = {}) {
    mkdirSync(directory, { recursive: true });
    this.fetcher = fetcher;
    this.cache = new Map();
    this.inflight = new Map();
    this.db = new DatabaseSync(resolve(directory, "collections.sqlite"));
    this.db.exec(
      "PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS collections (id TEXT PRIMARY KEY, owner TEXT NOT NULL, title TEXT NOT NULL, brief TEXT NOT NULL, created TEXT NOT NULL)",
    );
  }
  async json(url) {
    const r = await this.fetcher(url, {
      signal: AbortSignal.timeout(16000),
      headers: {
        "User-Agent":
          "PaperClawResearchCompanion/0.1 (public research metadata)",
      },
    });
    if (!r.ok) throw new Error(`Provider returned HTTP ${r.status}`);
    return r.json();
  }
  async search(query, provider = "europepmc") {
    query = plain(query);
    if (query.length < 3 || query.length > 350)
      throw new Error("Use a research topic between 3 and 350 characters.");
    const key = provider + ":" + query.toLowerCase();
    const old = this.cache.get(key);
    if (old && Date.now() - old.stamp < 300000)
      return { ...old.value, cached: true };
    if (this.inflight.has(key)) return this.inflight.get(key);
    const task = this.retrieve(query, provider);
    this.inflight.set(key, task);
    try {
      const value = await task;
      this.cache.set(key, { stamp: Date.now(), value });
      if (this.cache.size > 100)
        this.cache.delete(this.cache.keys().next().value);
      return value;
    } finally {
      this.inflight.delete(key);
    }
  }
  async retrieve(query, provider) {
    let papers = [];
    if (provider === "crossref") {
      const u = new URL("https://api.crossref.org/works");
      u.searchParams.set("query.title", query);
      u.searchParams.set("rows", "6");
      u.searchParams.set("filter", "type:journal-article");
      const j = await this.json(u);
      papers = (j.message?.items || []).map((p) => ({
        id: `doi:${p.DOI}`,
        title: plain(p.title?.[0]),
        authors: (p.author || [])
          .slice(0, 4)
          .map((a) => plain(`${a.given || ""} ${a.family || ""}`))
          .join(", "),
        year: p.published?.["date-parts"]?.[0]?.[0] || null,
        venue: plain(p["container-title"]?.[0]),
        url: `https://doi.org/${encodeURIComponent(p.DOI)}`,
        doi: p.DOI,
        excerpt: "",
        evidence: "Bibliographic metadata only",
        kind: p.type,
        provider: "Crossref",
        retrievedAt: new Date().toISOString(),
      }));
    } else if (provider === "europepmc") {
      const u = new URL(
        "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
      );
      u.searchParams.set("query", query);
      u.searchParams.set("format", "json");
      u.searchParams.set("resultType", "core");
      u.searchParams.set("pageSize", "6");
      const j = await this.json(u);
      papers = (j.resultList?.result || []).map((p) => {
        const abstract = plain(p.abstractText);
        const sentences = abstract.match(/[^.!?]+[.!?]*/g) || [];
        const ranked = sentences
          .map((s) => ({
            s,
            score: terms(query).filter((t) => s.toLowerCase().includes(t))
              .length,
          }))
          .sort((a, b) => b.score - a.score);
        const snippet = (ranked[0]?.s || "")
          .trim()
          .split(/\s+/)
          .slice(0, 35)
          .join(" ");
        return {
          id: `${p.source}:${p.id}`,
          title: plain(p.title),
          authors: plain(p.authorString),
          year: p.pubYear ? Number(p.pubYear) : null,
          venue: plain(p.journalInfo?.journal?.title),
          url: `https://europepmc.org/article/${encodeURIComponent(p.source)}/${encodeURIComponent(p.id)}`,
          doi: p.doi || null,
          excerpt: snippet ? snippet + " …" : "",
          evidence: snippet
            ? "Short abstract excerpt"
            : "Metadata only; no abstract",
          kind: plain(p.pubTypeList?.pubType?.join(", ") || "Publication"),
          provider: "Europe PMC",
          retrievedAt: new Date().toISOString(),
          retracted: !!p.isRetracted && p.isRetracted === "Y",
        };
      });
    } else if (provider === "p2pclaw") {
      const j = await this.json(
        "https://www.p2pclaw.com/api/dataset/papers?limit=500",
      );
      papers = (j.papers || [])
        .filter((p) =>
          terms(query).some((t) => plain(p.title).toLowerCase().includes(t)),
        )
        .slice(0, 6)
        .filter((p) => /^paper-[a-zA-Z0-9-]+$/.test(p.id))
        .map((p) => ({
          id: "p2p:" + p.id,
          title: plain(p.title),
          authors: plain(p.author),
          year: p.timestamp
            ? new Date(Number(p.timestamp)).getFullYear()
            : null,
          venue: "P2PCLAW research network",
          url: "https://www.p2pclaw.com/app/papers/" + encodeURIComponent(p.id),
          doi: null,
          excerpt: "",
          evidence: "Network metadata; not independently peer reviewed",
          kind: "Network contribution; may be AI generated",
          provider: "P2PCLAW",
          retrievedAt: new Date().toISOString(),
        }));
    } else throw new Error("Choose Europe PMC, Crossref or P2PCLAW.");
    papers = papers.filter((p) => p.title && p.url);
    for (const paper of papers) {
      this.cache.set("paper:" + paper.id, { stamp: Date.now(), value: paper });
    }
    return {
      query,
      provider,
      papers,
      cached: false,
      retrievedAt: new Date().toISOString(),
      limitations:
        provider === "p2pclaw"
          ? "Search covers the first 500 available network records by title. P2PCLAW contributions may be AI generated; network validation is not independent academic peer review. Only bibliographic metadata is reused."
          : provider === "europepmc"
            ? "Europe PMC emphasizes life sciences. Excerpts are author statements, not independent verification. Read the full papers before deciding."
            : "Crossref search provides bibliographic metadata. It cannot establish scientific findings or agreement.",
    };
  }
  paper(id) {
    const p = this.cache.get("paper:" + id)?.value;
    if (!p?.id)
      throw new Error(
        "This source is no longer available in this session. Search again.",
      );
    return p;
  }
  compare(ids) {
    if (!Array.isArray(ids) || ids.length < 2 || ids.length > 4)
      throw new Error("Select two to four sources.");
    const papers = [...new Set(ids)].map((id) => this.paper(id));
    if (papers.length < 2) throw new Error("Select two different sources.");
    const shared = terms(papers[0].title + " " + papers[0].excerpt)
      .filter((t) =>
        papers
          .slice(1)
          .every((p) => terms(p.title + " " + p.excerpt).includes(t)),
      )
      .slice(0, 8);
    return {
      papers,
      sharedTerms: shared,
      agreement:
        "Shared wording indicates topic overlap, not agreement on results.",
      differences: papers.map((p) => ({
        id: p.id,
        title: p.title,
        year: p.year,
        scope: p.kind,
        excerpt: p.excerpt || "No findings available from metadata.",
      })),
      limitations:
        "This comparison uses titles, publication types and short abstract excerpts. Study quality, effect sizes, populations and contradictory findings require full-text review. No claim of scientific consensus is made.",
    };
  }
  brief(query, ids) {
    const papers = ids.map((id) => this.paper(id));
    return {
      query: plain(query),
      papers,
      created: new Date().toISOString(),
      method: "Extractive evidence brief; no generated scientific claims",
      summary: papers.length
        ? `Found ${papers.length} traceable sources for “${plain(query)}”. Review their scope and excerpts, compare the evidence, then keep the sources relevant to your decision.`
        : "No matching publications were returned. Try a narrower topic or switch index.",
      unknowns: [
        "Full-text methods and study quality have not been reviewed.",
        "Search relevance is not proof of a finding.",
        "No recommendation can be established from metadata alone.",
      ],
    };
  }
  save(owner, title, brief) {
    if (!title?.trim() || title.length > 100)
      throw new Error("Give your collection a title (1–100 characters).");
    const id = randomUUID();
    this.db
      .prepare("INSERT INTO collections VALUES (?,?,?,?,?)")
      .run(
        id,
        owner,
        plain(title),
        JSON.stringify(brief),
        new Date().toISOString(),
      );
    return { id, title: plain(title) };
  }
  list(owner) {
    return this.db
      .prepare(
        "SELECT id,title,created FROM collections WHERE owner=? ORDER BY created DESC",
      )
      .all(owner);
  }
  get(owner, id) {
    const r = this.db
      .prepare("SELECT * FROM collections WHERE owner=? AND id=?")
      .get(owner, id);
    if (!r) throw new Error("Collection not found.");
    return {
      id: r.id,
      title: r.title,
      created: r.created,
      brief: JSON.parse(r.brief),
    };
  }
  export(owner, id) {
    const c = this.get(owner, id);
    return (
      `# ${c.title}\n\nQuestion: ${c.brief.query}\n\n${c.brief.summary}\n\nMethod: ${c.brief.method}\n\n## Sources\n\n` +
      c.brief.papers
        .map(
          (p, i) =>
            `[${i + 1}] ${p.title}\n${p.authors} · ${p.year || "Date unknown"} · ${p.venue}\n${p.url}\nDOI: ${p.doi || "Not available"}\nRetrieved: ${p.retrievedAt}\n${p.excerpt ? `Short abstract excerpt (author statement): “${p.excerpt}”` : "Metadata only; no finding inferred."}\n`,
        )
        .join("\n") +
      "\n## Unknowns\n\n" +
      c.brief.unknowns.map((s) => "- " + s).join("\n") +
      "\n"
    );
  }
}
