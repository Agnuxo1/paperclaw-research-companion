const $ = (s) => document.querySelector(s);
let csrf = "",
  current = null,
  selected = new Set();
const escape = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
async function api(path, body) {
  const r = await fetch(path, {
    method: body ? "POST" : "GET",
    headers: body
      ? { "Content-Type": "application/json", "X-CSRF-Token": csrf }
      : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || "Request failed.");
  return j;
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").classList.add("visible");
  setTimeout(() => $("#toast").classList.remove("visible"), 4500);
}
function message(text, user = false) {
  const el = document.createElement("div");
  el.className = user ? "user-message" : "assistant-message";
  if (!user) {
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.textContent = "P";
    el.append(avatar);
  }
  const p = document.createElement("div");
  p.textContent = text;
  el.append(p);
  $("#conversation").append(el);
  $("#conversation").scrollTop = $("#conversation").scrollHeight;
}
function busy(v) {
  document.body.classList.toggle("busy", v);
  $("#submit").disabled = v;
  $("#status").textContent = v
    ? "Finding your evidence…"
    : "Ready for your next step";
}
function paperMarkup(p, i, selectable = true) {
  return `<article class="paper"><div class="paper-header">${selectable ? `<input type="checkbox" aria-label="Select source ${i + 1}" data-id="${escape(p.id)}" ${selected.has(p.id) ? "checked" : ""}>` : ""}<div><div class="source-label">SOURCE ${i + 1} · ${escape(p.provider)}</div><h4><a href="${escape(p.url)}" target="_blank" rel="noopener noreferrer">${escape(p.title)} ↗</a></h4><p class="metadata">${escape(p.authors)}<br>${escape(p.year || "Date unknown")} · ${escape(p.venue)} · ${escape(p.kind)}</p></div></div>${p.excerpt ? `<div class="source-label">AUTHOR STATEMENT · SHORT ABSTRACT EXCERPT</div><blockquote class="excerpt">${escape(p.excerpt)}</blockquote>` : '<p class="metadata">Metadata only. No scientific finding inferred.</p>'}<div class="paper-bottom"><span>${p.doi ? "DOI: " + escape(p.doi) : "Indexed publication record"}</span><a href="${escape(p.url)}" target="_blank" rel="noopener noreferrer">Inspect source ↗</a></div>${p.retracted ? '<p class="error">The index marks this publication as retracted.</p>' : ""}</article>`;
}
function renderResult(r) {
  $("#result").hidden = false;
  selected = new Set(r.papers.slice(0, 2).map((p) => p.id));
  $("#result").innerHTML =
    `<div class="result-top"><div><h3>A trail worth following.</h3><p>${r.papers.length} sources · ${escape(r.provider === "p2pclaw" ? "P2PCLAW" : r.provider === "europepmc" ? "Europe PMC" : "Crossref")} · ${r.cached ? "cached, retrieved " + escape(new Date(r.retrievedAt).toLocaleTimeString()) : "retrieved just now"}</p></div><span class="badge">TRACEABLE SOURCES</span></div><div class="limitations"><strong>ASSISTANT SYNTHESIS · EXTRACTIVE</strong><br>${escape(current.brief.summary)}</div>${r.papers.length ? r.papers.map((p, i) => paperMarkup(p, i)).join("") : '<div class="empty">No sources found. Try a more specific topic, fewer words, or the other publication index.</div>'}<div class="limitations"><strong>What remains unknown</strong><br>${escape(r.limitations)}</div>${r.papers.length ? '<div class="toolbar"><button id="compare" class="secondary">Compare selected sources</button><button id="save" class="primary">Save a collection ↗</button><button id="read" class="secondary">Read brief aloud</button></div><div id="comparison"></div><div id="save-area"></div>' : ""}`;
  $("#result").scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "start",
  });
  $("#result")
    .querySelectorAll("input[data-id]")
    .forEach((el) =>
      el.addEventListener("change", () =>
        el.checked
          ? selected.add(el.dataset.id)
          : selected.delete(el.dataset.id),
      ),
    );
  $("#compare")?.addEventListener("click", () =>
    chat("Compare selected sources", { action: "compare", ids: [...selected] }),
  );
  $("#save")?.addEventListener("click", showSave);
  $("#read")?.addEventListener("click", () => {
    if (!("speechSynthesis" in window)) {
      toast("Speech output is unavailable. The complete brief is on screen.");
      return;
    }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(
      current.brief.summary + " Unknowns: " + current.brief.unknowns.join(" "),
    );
    u.lang = "en-US";
    u.onerror = () =>
      toast("Speech output failed. You can read the brief on screen.");
    speechSynthesis.speak(u);
  });
}
function renderComparison(c) {
  $("#comparison").innerHTML =
    `<div class="compare"><div class="source-label">METADATA & EXCERPT COMPARISON</div><h3>Same topic, different lenses.</h3><div class="compare-grid">${c.differences.map((p, i) => `<article class="compare-card"><span class="source-label">SOURCE ${i + 1} · ${escape(p.year || "Unknown date")}</span><strong>${escape(p.title)}</strong><small>${escape(p.scope)}</small><p>${escape(p.excerpt)}</p></article>`).join("")}</div><div class="limitations"><strong>Topic overlap:</strong> ${escape(c.sharedTerms.join(", ") || "No shared terms found in these excerpts.")}<br>${escape(c.agreement)}<br><br>${escape(c.limitations)}</div></div>`;
}
function showSave() {
  if (!selected.size) {
    toast("Select at least one source to save.");
    return;
  }
  $("#save-area").innerHTML =
    '<form class="save-form" id="save-form"><input id="collection-title" aria-label="Collection title" placeholder="Name your collection" maxlength="100" required><button class="primary">Save selected sources</button></form>';
  $("#collection-title").value = current.brief.query.slice(0, 100);
  $("#collection-title").focus();
  $("#save-area").scrollIntoView({
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth",
    block: "center",
  });
  $("#save-form").addEventListener("submit", (e) => {
    e.preventDefault();
    chat("Save my collection", {
      action: "save",
      title: $("#collection-title").value,
      ids: [...selected],
    });
  });
}
async function chat(text, extra = {}) {
  busy(true);
  message(text, true);
  try {
    const r = await api("/api/chat", {
      message: text,
      provider: $("#provider").value,
      ...extra,
    });
    message(r.reply);
    if (r.action === "search") {
      current = r;
      renderResult(r.result);
    }
    if (r.comparison) {
      if (!current) {
        toast("Search first.");
        return;
      }
      renderComparison(r.comparison);
      $("#comparison").scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center",
      });
    }
    if (r.saved) {
      toast(r.reply);
      $("#save-area").innerHTML = "";
      await count();
    }
    if (r.action === "collections") await showCollections();
  } catch (e) {
    message(e.message + " You can edit your question and try again.");
    toast(e.message);
  } finally {
    busy(false);
  }
}
$("#ask").addEventListener("submit", (e) => {
  e.preventDefault();
  const q = $("#question").value.trim();
  if (!q) return;
  $("#question").value = "";
  chat(q);
});
$("#question").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("#ask").requestSubmit();
  }
});
document
  .querySelectorAll("[data-query]")
  .forEach((b) => b.addEventListener("click", () => chat(b.dataset.query)));
async function count() {
  const c = await api("/api/collections");
  $("#count").textContent = c.length;
  return c;
}
async function showCollections() {
  try {
    const list = await count();
    $(".workspace").hidden = true;
    $(".intro").hidden = true;
    $("#saved-view").hidden = false;
    $("#collections").classList.add("active");
    $("#new").classList.remove("active");
    $("#saved-detail").innerHTML = "";
    $("#saved-list").innerHTML = list.length
      ? list
          .map(
            (c) =>
              `<article class="collection"><div><h3>${escape(c.title)}</h3><small>Saved ${escape(new Date(c.created).toLocaleDateString())}</small></div><button class="secondary" data-open="${escape(c.id)}">Open collection</button><button class="secondary" data-export="${escape(c.id)}">Export brief ↓</button></article>`,
          )
          .join("")
      : '<div class="empty">Your first collection starts with a question. Search, select a few sources and save a reading trail.</div>';
    document.querySelectorAll("[data-export]").forEach((b) =>
      b.addEventListener("click", async () => {
        try {
          const response = await fetch(
            "/api/collections/" +
              encodeURIComponent(b.dataset.export) +
              "/export",
          );
          if (!response.ok)
            throw new Error("Export failed. Reopen your collection.");
          const text = await response.text();
          const blob = URL.createObjectURL(
            new Blob([text], { type: "text/markdown" }),
          );
          $("#saved-detail").innerHTML =
            '<h2>Your portable evidence brief</h2><p class="muted">Review the references below, then save the Markdown file.</p><a class="secondary" id="download-brief" download="paperclaw-brief.md">Save Markdown file ↓</a><pre class="export-preview" id="export-text"></pre>';
          $("#export-text").textContent = text;
          $("#download-brief").href = blob;
          setTimeout(() => URL.revokeObjectURL(blob), 300000);
        } catch (e) {
          toast(e.message);
        }
      }),
    );
    document.querySelectorAll("[data-open]").forEach((b) =>
      b.addEventListener("click", async () => {
        try {
          const c = await api(
            "/api/collections/" + encodeURIComponent(b.dataset.open),
          );
          $("#saved-detail").innerHTML =
            `<h2>${escape(c.title)}</h2><div class="limitations">${escape(c.brief.summary)}<br>${escape(c.brief.method)}</div>${c.brief.papers.map((p, i) => paperMarkup(p, i, false)).join("")}<div class="limitations">${c.brief.unknowns.map(escape).join("<br>")}</div>`;
        } catch (e) {
          toast(e.message);
        }
      }),
    );
  } catch (e) {
    toast(e.message);
  }
}
function desk() {
  $(".workspace").hidden = false;
  $(".intro").hidden = false;
  $("#saved-view").hidden = true;
  $("#collections").classList.remove("active");
  $("#new").classList.add("active");
  $("#question").focus();
}
$("#collections").addEventListener("click", showCollections);
$("#new").addEventListener("click", desk);
$("#back").addEventListener("click", desk);
const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (!Speech) {
  $("#voice").disabled = true;
  $("#voice").title = "Voice input is unavailable in this browser. Use text.";
  $("#voice-note").textContent =
    "Voice input is unavailable in this browser. All research tools work by text.";
} else {
  recognition = new Speech();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.onstart = () => {
    $("#voice").classList.add("listening");
    $("#status").textContent = "Listening…";
  };
  recognition.onend = () => {
    $("#voice").classList.remove("listening");
    $("#status").textContent = "Ready when you are";
  };
  recognition.onresult = (e) => {
    $("#question").value = e.results[0][0].transcript;
    $("#question").focus();
    toast("Dictation ready. Review your words, then Explore.");
  };
  recognition.onerror = () =>
    toast(
      "Voice is unavailable or permission was denied. You can type your question.",
    );
  $("#voice").addEventListener("click", () => {
    try {
      recognition.start();
    } catch (e) {
      toast("Voice could not start. Try text.");
    }
  });
}
try {
  const s = await api("/api/session");
  csrf = s.csrf;
  await count();
} catch (e) {
  $("#status").textContent = "Workspace could not connect";
  toast(e.message);
}
