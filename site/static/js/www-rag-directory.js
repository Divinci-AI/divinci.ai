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
 * Model-card enrichment (2026-08): core counts (pages/files/chunks/size) up
 * front, with everything else — language model, chunking, vector DB, dates,
 * ratings, tools — inside a collapsed <details> panel. Only fields that
 * actually carry a value get a row, so cards stay quiet while the pipeline
 * is still backfilling. All fields are optional; older API responses still
 * render cleanly.
 *
 * The panel is a native <details>/<summary>. An earlier hand-rolled version
 * toggled the `hidden` attribute on a <dl> that CSS gave `display: grid` —
 * the class rule beat the UA `[hidden] { display: none }`, so the panel was
 * stuck open and the toggle appeared dead. Native <details> hides its own
 * content regardless of what `display` the children carry.
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
    if (!iso) return "";
    try {
      var d = new Date(iso);
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function formatRating(rating) {
    if (!rating) return "";
    var total = (rating.up || 0) + (rating.down || 0);
    if (total === 0) return "";
    if (rating.percentPositive === null || rating.percentPositive === undefined) {
      return rating.up + "↑ " + rating.down + "↓";
    }
    return rating.percentPositive + "% positive (" + rating.up + "↑ " + rating.down + "↓)";
  }

  function joinList(items) {
    if (!items || !items.length) return "";
    return items.join(", ");
  }

  function otherToolsLabel(tools) {
    if (!tools) return "";
    var parts = [];
    if (tools.webSearch) parts.push("Web search");
    if (tools.email) parts.push("Email");
    if (tools.texting) parts.push("Texting");
    if (tools.other && tools.other.length) {
      for (var i = 0; i < tools.other.length; i++) parts.push(tools.other[i]);
    }
    return parts.join(", ");
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  /**
   * Favicon backfill.
   *
   * Roughly half the directory has no pipeline-hosted faviconUrl (124 of 221
   * as of 2026-08-05), so the card falls back to the site's own
   * https://<host>/favicon.ico — the one location every browser probes by
   * convention — and finally to a generated monogram tile, which cannot fail.
   * No third-party icon service is used: every image request goes either to
   * our own asset host or to the site being listed, and `no-referrer` keeps
   * the visitor's page out of those requests.
   *
   * `host` is crawled third-party data, so it is parsed through URL() and
   * checked against a hostname whitelist before being interpolated — a host
   * of "evil.example/../" or with credentials can't be turned into an
   * arbitrary request.
   */
  var HOSTNAME_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/;

  function originFaviconUrl(host) {
    if (!host || typeof host !== "string") return null;
    var candidate = host.trim().toLowerCase();
    if (!HOSTNAME_RE.test(candidate)) return null;
    try {
      var url = new URL("https://" + candidate + "/favicon.ico");
      // Re-check after parsing: URL() normalises, and anything that shifted
      // the hostname away from the vetted string is rejected outright.
      if (url.hostname !== candidate) return null;
      return url.href;
    } catch (e) {
      return null;
    }
  }

  /** Stable hue per host so a site keeps the same tile colour across loads. */
  function monogramHue(host) {
    var hash = 0;
    for (var i = 0; i < host.length; i++) {
      hash = (hash << 5) - hash + host.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  }

  function monogramTile(host) {
    var safeHost = host || "?";
    var letter = "?";
    for (var i = 0; i < safeHost.length; i++) {
      if (/[a-z0-9]/i.test(safeHost[i])) {
        letter = safeHost[i].toUpperCase();
        break;
      }
    }
    var tile = el("span", "www-rag-card-favicon www-rag-card-monogram");
    var hue = monogramHue(safeHost);
    tile.style.background = "hsl(" + hue + ", 62%, 92%)";
    tile.style.color = "hsl(" + hue + ", 58%, 32%)";
    tile.setAttribute("aria-hidden", "true");
    tile.appendChild(el("span", "www-rag-card-monogram-letter", letter));
    return tile;
  }

  /**
   * Renders the favicon slot.
   *
   * The monogram tile is the *starting* state, not the fallback: the real
   * icon is layered on top and only revealed once it decodes. A card
   * therefore never shows an empty grey box, no matter how slow or broken
   * the icon behind it turns out to be.
   *
   * Icons load straight away rather than being deferred. Both deferral
   * mechanisms were measured against the live payload and neither delivered:
   * `loading="lazy"` resolved none of the 124 origin-fallback icons even
   * after scrolling the entire grid, and an IntersectionObserver assigned a
   * src to only 2 of 215 slots. Loading directly resolves them reliably, and
   * these are 24px icons on a page that already fetches ~100 of them — with
   * the monogram underneath there is no empty box and no layout shift while
   * they arrive.
   *
   * Each candidate URL gets one shot; `error` advances to the next, and
   * running out simply leaves the monogram in place.
   */
  function renderFavicon(site) {
    var host = site.host || "";
    var slot = monogramTile(host);

    var sources = [];
    if (site.faviconUrl) sources.push(site.faviconUrl);
    var origin = originFaviconUrl(host);
    if (origin && sources.indexOf(origin) === -1) sources.push(origin);
    if (!sources.length) return slot;

    var index = 0;
    var img = document.createElement("img");
    img.className = "www-rag-card-favicon-img";
    img.alt = "";
    img.decoding = "async";
    img.referrerPolicy = "no-referrer";

    img.addEventListener("error", function () {
      index += 1;
      if (index < sources.length) {
        img.src = sources[index];
        return;
      }
      if (img.parentNode) img.parentNode.removeChild(img);
    });

    // Some hosts answer /favicon.ico with a 200 HTML error page or a zero-byte
    // body; a decoded image always reports natural dimensions, so a 0x0
    // "success" is treated as a failure and falls through to the next
    // candidate rather than revealing an invisible icon over the monogram.
    img.addEventListener("load", function () {
      if (img.naturalWidth === 0 || img.naturalHeight === 0) {
        img.dispatchEvent(new Event("error"));
        return;
      }
      slot.classList.add("www-rag-card-favicon-loaded");
    });

    slot.appendChild(img);
    img.src = sources[0];
    return slot;
  }

  /**
   * Collapsed details panel. Rows are only emitted for fields that carry a
   * real value, so a site with nothing but a chunker and a vector DB shows
   * two rows rather than a column of em-dashes; if nothing qualifies, the
   * panel is omitted entirely.
   */
  function renderDetailsPanel(mc, details) {
    var rows = [];
    function row(label, value) {
      if (value) rows.push([label, value]);
    }

    if (mc) row("Language model", mc.languageModel);
    if (details) {
      row("Chunking", joinList(details.chunkingTools));
      row("Document parsing", joinList(details.documentParsers));
      row("Vector database", details.vectorDatabase);
      row("Embedding model", details.embeddingModel);
      row("Created", formatDate(details.createdAt));
      row("Updated", formatDate(details.updatedAt));
      if (details.conversationCount) row("Conversations", formatCount(details.conversationCount));
      row("Rating", formatRating(details.rating));
      if (details.fineTuned) {
        row(
          "Fine-tune data",
          details.fineTuneDatasetSize !== null && details.fineTuneDatasetSize !== undefined
            ? formatCount(details.fineTuneDatasetSize) + " training files"
            : "Fine-tuned",
        );
      }
      if (details.tools) {
        row("Voice", details.tools.voice);
        row("Speech-to-text", details.tools.speechToText);
        row("Other tools", otherToolsLabel(details.tools));
      }
    }

    if (!rows.length) return null;

    var panel = document.createElement("details");
    panel.className = "www-rag-card-details";
    panel.appendChild(el("summary", "www-rag-card-details-toggle", "Details"));

    var dl = el("dl", "www-rag-card-details-list");
    for (var i = 0; i < rows.length; i++) {
      var line = el("div", "www-rag-card-detail-row");
      line.appendChild(el("dt", "www-rag-card-detail-label", rows[i][0]));
      line.appendChild(el("dd", "www-rag-card-detail-value", rows[i][1]));
      dl.appendChild(line);
    }
    panel.appendChild(dl);
    return panel;
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

    // The language model moved into the details panel — every site currently
    // runs the same one, so a chip on every card carried no signal.
    var primary = el("div", "www-rag-card-primary");
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

    var panel = renderDetailsPanel(mc, details);
    if (panel) wrap.appendChild(panel);

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
    header.appendChild(renderFavicon(site));
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
