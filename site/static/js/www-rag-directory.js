/**
 * WWW-RAG public directory widget for divinci.ai.
 *
 * Fetches the already-public, unauthenticated directory API and renders a
 * searchable grid. Each card links straight into an anonymous chat session
 * for that site's release — no sign-up required, mirroring the same
 * click-target pattern used by the logged-in directory at
 * chat.divinci.app/www-rag (PATH_WHITELABEL_RELEASE_ITEM = /ai-release/:releaseId).
 *
 * Each card also has "Build" and "Claim" — both deep-link into the signed-in
 * directory (chat.divinci.app/www-rag?copy=<host> / ?claim=<host>), which
 * auto-opens the matching modal for that host: Build copies chunks +
 * embeddings into a new RAG vector the visitor owns, to build their own
 * assistant on top of it; Claim starts DNS/file ownership verification to
 * take over the site's existing assistant. This static site has no auth
 * session of its own, so both actions always happen on the signed-in app.
 *
 * Model-card enrichment (2026-08): primary chips for language model + RAG
 * memory size, core counts (pages/files/chunks/size), and a "More details"
 * disclosure for chunking tool, vector DB, conversations, rating, etc.
 * All fields are optional — older API responses still render cleanly.
 */
(function () {
  "use strict";

  var API_URL = "https://api.divinci.app/api/v1/www-rag-directory";
  var CHAT_BASE = "https://chat.divinci.app/ai-release/";
  var BUILD_BASE = "https://chat.divinci.app/www-rag?copy=";
  var CLAIM_BASE = "https://chat.divinci.app/www-rag?claim=";

  var statusEl = document.getElementById("www-rag-status");
  var gridEl = document.getElementById("www-rag-grid");
  var statsEl = document.getElementById("www-rag-stats");
  var searchEl = document.getElementById("www-rag-search");

  if (!gridEl) return;

  var allSites = [];

  function formatCount(n) {
    if (n === null || n === undefined) return "—";
    return Number(n).toLocaleString("en-US");
  }

  function formatBytes(bytes) {
    if (bytes === null || bytes === undefined || !isFinite(bytes) || bytes < 0) return null;
    if (bytes === 0) return "0 B";
    var units = ["B", "KB", "MB", "GB", "TB"];
    var value = bytes;
    var unit = 0;
    while (value >= 1024 && unit < units.length - 1) {
      value /= 1024;
      unit += 1;
    }
    var rounded = value >= 10 || unit === 0 ? Math.round(value) : Math.round(value * 10) / 10;
    return rounded.toLocaleString("en-US") + " " + units[unit];
  }

  function formatDate(iso) {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return "—";
    }
  }

  function formatRating(rating) {
    if (!rating) return "—";
    var total = (rating.up || 0) + (rating.down || 0);
    if (total === 0) return "—";
    if (rating.percentPositive === null || rating.percentPositive === undefined) {
      return rating.up + "↑ " + rating.down + "↓";
    }
    return rating.percentPositive + "% positive (" + rating.up + "↑ " + rating.down + "↓)";
  }

  function joinList(items) {
    if (!items || !items.length) return "—";
    return items.join(", ");
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function appendDetail(dl, label, value) {
    var row = el("div", "www-rag-card-detail-row");
    row.appendChild(el("dt", "www-rag-card-detail-label", label));
    row.appendChild(el("dd", "www-rag-card-detail-value", value || "—"));
    dl.appendChild(row);
  }

  function otherToolsLabel(tools) {
    if (!tools) return "—";
    var parts = [];
    if (tools.webSearch) parts.push("Web search");
    if (tools.email) parts.push("Email");
    if (tools.texting) parts.push("Texting");
    if (tools.other && tools.other.length) {
      for (var i = 0; i < tools.other.length; i++) parts.push(tools.other[i]);
    }
    return parts.length ? parts.join(", ") : "—";
  }

  function renderModelCard(site) {
    var mc = site.modelCard || null;
    var rag = (mc && mc.ragMemory) || {
      fileCount: site.fileCount,
      totalBytes: site.totalBytes,
      chunkCount: site.chunkCount,
      pageCount: site.pageCount,
    };
    var details = (mc && mc.details) || null;
    var wrap = el("div", "www-rag-card-model");

    // Primary chips: language model + memory size
    var primary = el("div", "www-rag-card-primary");
    if (mc && mc.languageModel) {
      var modelChip = el("div", "www-rag-card-chip");
      modelChip.appendChild(el("span", "www-rag-card-chip-label", "Model"));
      modelChip.appendChild(el("span", "www-rag-card-chip-value", mc.languageModel));
      primary.appendChild(modelChip);
    }
    var sizeLabel = formatBytes(rag.totalBytes);
    if (sizeLabel) {
      var sizeChip = el("div", "www-rag-card-chip");
      sizeChip.appendChild(el("span", "www-rag-card-chip-label", "Memory"));
      sizeChip.appendChild(el("span", "www-rag-card-chip-value", sizeLabel));
      primary.appendChild(sizeChip);
    }
    if (primary.childNodes.length) wrap.appendChild(primary);

    // Core stats
    var stats = el("div", "www-rag-card-stats");
    function addStat(value, label) {
      var s = el("div", "www-rag-card-stat");
      s.appendChild(el("span", "www-rag-card-stat-value", value));
      s.appendChild(el("span", "www-rag-card-stat-label", label));
      stats.appendChild(s);
    }
    if (rag.pageCount !== null && rag.pageCount !== undefined) {
      addStat(formatCount(rag.pageCount), "Pages");
    }
    addStat(formatCount(rag.fileCount), "Files");
    addStat(formatCount(rag.chunkCount), "Chunks");
    if (sizeLabel) addStat(sizeLabel, "Size");
    wrap.appendChild(stats);

    // Details disclosure
    if (details) {
      var hasDetails =
        (details.chunkingTools && details.chunkingTools.length) ||
        (details.documentParsers && details.documentParsers.length) ||
        details.vectorDatabase ||
        details.embeddingModel ||
        details.createdAt ||
        details.updatedAt ||
        details.conversationCount !== null ||
        details.rating ||
        details.fineTuned ||
        (details.tools &&
          (details.tools.voice ||
            details.tools.speechToText ||
            details.tools.webSearch ||
            details.tools.email ||
            details.tools.texting ||
            (details.tools.other && details.tools.other.length)));

      if (hasDetails) {
        var detailsWrap = el("div", "www-rag-card-details");
        var toggle = el("button", "www-rag-card-details-toggle", "More details ▾");
        toggle.type = "button";
        toggle.setAttribute("aria-expanded", "false");
        var dl = el("dl", "www-rag-card-details-list");
        dl.hidden = true;

        appendDetail(dl, "Chunking", joinList(details.chunkingTools));
        appendDetail(dl, "Document parsing", joinList(details.documentParsers));
        appendDetail(dl, "Vector database", details.vectorDatabase || "—");
        appendDetail(dl, "Embedding model", details.embeddingModel || "—");
        appendDetail(dl, "Created", formatDate(details.createdAt));
        appendDetail(dl, "Updated", formatDate(details.updatedAt));
        appendDetail(dl, "Conversations", formatCount(details.conversationCount));
        appendDetail(dl, "Rating", formatRating(details.rating));
        if (details.fineTuned) {
          appendDetail(
            dl,
            "Fine-tune data",
            details.fineTuneDatasetSize !== null && details.fineTuneDatasetSize !== undefined
              ? formatCount(details.fineTuneDatasetSize) + " training files"
              : "Fine-tuned",
          );
        }
        if (details.tools) {
          appendDetail(dl, "Voice", details.tools.voice || "—");
          appendDetail(dl, "Speech-to-text", details.tools.speechToText || "—");
          appendDetail(dl, "Other tools", otherToolsLabel(details.tools));
        }

        toggle.addEventListener("click", function () {
          var open = dl.hidden;
          dl.hidden = !open;
          toggle.setAttribute("aria-expanded", open ? "true" : "false");
          toggle.textContent = open ? "Hide details ▴" : "More details ▾";
        });

        detailsWrap.appendChild(toggle);
        detailsWrap.appendChild(dl);
        wrap.appendChild(detailsWrap);
      }
    }

    return wrap;
  }

  // Site data (host/description/faviconUrl) originates from crawled
  // third-party pages — untrusted content. Built via DOM methods
  // (textContent / attribute setters) rather than innerHTML so nothing a
  // crawled page's title/meta tags contain can ever be parsed as markup.
  function renderCard(site) {
    // The card itself is a plain container now (not the chat link) — it
    // holds independent action links (Chat / Build / Claim) in the footer,
    // so it can't itself be an <a> without nesting anchors.
    var card = document.createElement("div");
    card.className = "www-rag-card";

    var header = el("div", "www-rag-card-header");
    if (site.faviconUrl) {
      var favicon = document.createElement("img");
      favicon.className = "www-rag-card-favicon";
      favicon.src = site.faviconUrl;
      favicon.alt = "";
      favicon.loading = "lazy";
      favicon.addEventListener("error", function () {
        favicon.style.visibility = "hidden";
      });
      header.appendChild(favicon);
    } else {
      header.appendChild(el("div", "www-rag-card-favicon"));
    }
    header.appendChild(el("div", "www-rag-card-host", site.host));
    card.appendChild(header);

    card.appendChild(el("div", "www-rag-card-desc", site.description || ""));
    card.appendChild(renderModelCard(site));

    var actions = el("div", "www-rag-card-actions");
    if (site.releaseId) {
      var chatLink = document.createElement("a");
      chatLink.className = "www-rag-card-action www-rag-card-chat";
      chatLink.href = CHAT_BASE + encodeURIComponent(site.releaseId);
      chatLink.target = "_blank";
      chatLink.rel = "noopener";
      chatLink.textContent = "Chat";
      actions.appendChild(chatLink);
    } else {
      actions.appendChild(el("span", "www-rag-card-pending", "Not chat-enabled"));
    }

    var buildLink = document.createElement("a");
    buildLink.className = "www-rag-card-action www-rag-card-build";
    buildLink.href = BUILD_BASE + encodeURIComponent(site.host);
    buildLink.target = "_blank";
    buildLink.rel = "noopener";
    buildLink.title = "Copy this site's chunks + embeddings into your own workspace and build an assistant on top of it";
    buildLink.textContent = "Build";
    actions.appendChild(buildLink);

    if (!site.claimed) {
      var claimLink = document.createElement("a");
      claimLink.className = "www-rag-card-action www-rag-card-claim";
      claimLink.href = CLAIM_BASE + encodeURIComponent(site.host);
      claimLink.target = "_blank";
      claimLink.rel = "noopener";
      claimLink.title = "Prove you own this site (DNS or file verification) and take over its assistant";
      claimLink.textContent = "Claim";
      actions.appendChild(claimLink);
    }
    card.appendChild(actions);

    return card;
  }

  function renderGrid(sites) {
    gridEl.innerHTML = "";
    if (sites.length === 0) {
      statusEl.textContent = "No sites match your search.";
      statusEl.classList.remove("hidden");
      return;
    }
    statusEl.classList.add("hidden");
    var frag = document.createDocumentFragment();
    for (var i = 0; i < sites.length; i++) {
      frag.appendChild(renderCard(sites[i]));
    }
    gridEl.appendChild(frag);
  }

  /** Prefer ?q=, accept ?search= as an alias (web app deep-links use q). */
  function readQueryFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search);
      return (params.get("q") || params.get("search") || "").trim();
    } catch (e) {
      return "";
    }
  }

  function writeQueryToUrl(q) {
    try {
      var url = new URL(window.location.href);
      if (q) {
        url.searchParams.set("q", q);
        url.searchParams.delete("search");
      } else {
        url.searchParams.delete("q");
        url.searchParams.delete("search");
      }
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch (e) {
      // ignore — history API unavailable
    }
  }

  function applySearch() {
    var q = (searchEl && searchEl.value ? searchEl.value : "").trim().toLowerCase();
    writeQueryToUrl(q);
    if (!q) {
      renderGrid(allSites);
      return;
    }
    var filtered = allSites.filter(function (site) {
      return (
        (site.host || "").toLowerCase().indexOf(q) !== -1 ||
        (site.title || "").toLowerCase().indexOf(q) !== -1 ||
        (site.description || "").toLowerCase().indexOf(q) !== -1
      );
    });
    renderGrid(filtered);
  }

  if (searchEl) {
    var initialQ = readQueryFromUrl();
    if (initialQ) searchEl.value = initialQ;
    searchEl.addEventListener("input", applySearch);
  }

  fetch(API_URL)
    .then(function (resp) {
      if (!resp.ok) throw new Error("directory request failed: " + resp.status);
      return resp.text();
    })
    .then(function (text) {
      var data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("directory response was not valid JSON");
      }
      allSites = data.sites || [];
      if (statsEl) {
        var totalSize = formatBytes(data.totalBytes);
        statsEl.textContent =
          formatCount(data.totalSites) + " curated sites · " +
          formatCount(data.totalPages) + " pages · " +
          formatCount(data.totalFiles) + " files · " +
          formatCount(data.totalChunks) + " searchable chunks" +
          (totalSize ? " · " + totalSize + " indexed" : "");
      }
      applySearch();
    })
    .catch(function (err) {
      statusEl.textContent = "Couldn't load the directory right now. Please try again shortly.";
      statusEl.classList.remove("hidden");
      console.warn("[www-rag-directory]", err);
    });
})();
