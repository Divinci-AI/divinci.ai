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
 *
 * Browsing controls (2026-08): the free-text search is joined by domain /
 * status / content filters, a sort selector, a cards-vs-table view toggle
 * and a CSV export. All of it is client-side over the single directory
 * payload — the API has no query parameters, and 472 rows is small enough
 * that filtering in memory beats a round trip. Every control is mirrored
 * into the query string (?q=&view=&tld=&status=&docs=&sort=) so a filtered
 * view is linkable, and the export writes whatever is currently on screen,
 * which for an untouched page is the whole directory.
 */
(function () {
  "use strict";

  var API_URL = "https://api.divinci.app/api/v1/www-rag-directory";
  var CHAT_BASE = "https://chat.divinci.app/ai-release/";
  var BUILD_BASE = "https://chat.divinci.app/www-rag?copy=";
  var CLAIM_BASE = "https://chat.divinci.app/www-rag?claim=";

  // The page ships in thirteen languages, and the server already rendered the
  // stats line in the visitor's. Without the same pattern here, the first
  // successful refresh would quietly rewrite it back into English. The block
  // is optional: no block, or an unparseable one, and the English defaults
  // below apply — which is what every test fixture exercises.
  var I18N = (function () {
    var el = document.getElementById("www-rag-i18n");
    if (!el) return {};
    try {
      return JSON.parse(el.textContent) || {};
    } catch (err) {
      return {};
    }
  })();

  var STATS_PATTERN =
    I18N.stats || "{sites} curated sites · {pages} pages · {files} files · {chunks} searchable chunks";
  var STATS_INDEXED = I18N.statsIndexed || "{size} indexed";

  // Fills {name} placeholders. Deliberately not a regex over the whole string:
  // a translated pattern is data, and a stray {…} in one should render as
  // itself rather than disappear.
  function fill(pattern, values) {
    return Object.keys(values).reduce(function (out, key) {
      return out.split("{" + key + "}").join(values[key]);
    }, pattern);
  }

  // The header omits the corpus size below this, for two independent reasons.
  //
  // Correctness: the header SUMS per-site totalBytes, and a missing value
  // contributes 0 rather than "unknown" — so a corpus nobody has measured
  // renders as a confident "0 B". The per-site chips have no such problem;
  // they take null and simply hide.
  //
  // Presentation: ~1 GB is a true number that undersells 660k chunks, since it
  // counts extracted text and none of the embeddings (another ~2 GB of float32
  // at 768 dims). The size is not the headline until it is genuinely large, so
  // the floor is set where it would start to impress rather than deflate.
  //
  // This is a display threshold, never a data one — the value is still
  // measured on every publish, still on every card, and still in the API.
  var MIN_HEADER_BYTES = 100 * 1024 * 1024 * 1024; // 100 GB

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

  /**
   * Vet an icon URL the API handed us.
   *
   * `faviconUrl` is derived from the crawled page's own <link rel="icon">, so
   * the site being listed chooses it. Assigning it straight to img.src is not
   * an XSS route — an <img> will not run a javascript: URL and will not
   * execute script inside an SVG — but it does mean any listed site can point
   * every directory visitor's browser at a URL of its choosing, which is a
   * tracking beacon that logs visitor IP and timing on our page.
   *
   * Absolute https only: relative values are rejected rather than resolved
   * against our own origin, and http would be blocked as mixed content here
   * anyway. This is the same treatment originFaviconUrl() already gave the
   * URL it derives; trusting the supplied one and not the derived one was
   * backwards.
   */
  function safeIconUrl(value) {
    if (!value || typeof value !== "string") return null;
    try {
      var url = new URL(value);
      return url.protocol === "https:" ? url.href : null;
    } catch (e) {
      return null;
    }
  }

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
  /**
   * One slot element per host, reused across renders.
   *
   * Every filter keystroke, sort click and view switch rebuilds the whole
   * list, and each rebuild used to construct a fresh <img> per row and assign
   * its src — up to 472 requests to 472 third-party origins per keystroke.
   * Re-appending the existing node moves it instead, so a favicon is fetched
   * at most once per host per page load and an already-decoded icon does not
   * flicker back to its monogram.
   *
   * Null-prototype map: hosts are crawled third-party strings, and a host of
   * "constructor" or "__proto__" would otherwise collide with Object.prototype.
   */
  var faviconSlots = Object.create(null);

  function renderFavicon(site) {
    var host = site.host || "";
    if (faviconSlots[host]) return faviconSlots[host];
    var slot = monogramTile(host);
    faviconSlots[host] = slot;

    var sources = [];
    var supplied = safeIconUrl(site.faviconUrl);
    if (supplied) sources.push(supplied);
    var origin = originFaviconUrl(host);
    if (origin && sources.indexOf(origin) === -1) sources.push(origin);
    if (!sources.length) return slot; // monogram only; still cached above

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
    // The request is deferred until the row is near the viewport. Half the
    // catalogue has no pipeline-hosted icon and falls back to the listed
    // site's OWN origin, so every drawn row is a GET to a third party that
    // learns the visitor's IP. Deferring means a visitor pings only the
    // hosts they actually looked at, rather than all several hundred.
    //
    // An earlier attempt at this reached only 2 of 215 slots, and the reason
    // is now fixed rather than worked around: every keystroke rebuilt the
    // grid, so observed elements were detached before they ever intersected.
    // Slots are cached per host and re-appended now, so an observation
    // survives re-rendering.
    slot.loadIcon = function () {
      slot.loadIcon = null; // once per host, ever
      img.src = sources[0];
    };
    if (iconObserver) iconObserver.observe(slot);
    else slot.loadIcon();
    return slot;
  }

  /**
   * Loads a slot's icon the first time it approaches the viewport. Created
   * once for the page: slots outlive any single render, so the observer must
   * too. Without IntersectionObserver every icon simply loads immediately,
   * which is the behaviour this replaced.
   */
  var iconObserver = typeof IntersectionObserver === "function"
    ? new IntersectionObserver(function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (!entries[i].isIntersecting) continue;
          var slot = entries[i].target;
          iconObserver.unobserve(slot);
          if (slot.loadIcon) slot.loadIcon();
        }
      }, { rootMargin: "400px" })
    : null;

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

    // No chip row: the language model moved into the details panel (every
    // site runs the same one), and the RAG memory size is not shown at all —
    // it was duplicated as both a "Memory" chip and a "Size" tile, and the
    // per-site byte counts are too small to be worth the space.

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

    card.appendChild(actionLinks(site, "card"));

    return card;
  }

  /* ── Table view ───────────────────────────────────────────────────────
   *
   * Same rows, denser presentation. Built with DOM methods for the same
   * reason the cards are: host/title/description are crawled third-party
   * text and must never reach an HTML parser.
   */
  var TABLE_COLUMNS = [
    { key: "host", label: "Site", sortable: true, numeric: false },
    { key: "description", label: "Description", sortable: false },
    { key: "pageCount", label: "Pages", sortable: true, numeric: true },
    { key: "fileCount", label: "Files", sortable: true, numeric: true },
    { key: "chunkCount", label: "Chunks", sortable: true, numeric: true },
    { key: "totalBytes", label: "Size", sortable: true, numeric: true },
    { key: "lastCrawledAt", label: "Crawled", sortable: true, numeric: true },
    { key: "status", label: "Status", sortable: false },
    // Header text is for screen readers only — a visible "Actions" label over
    // three buttons is noise, but an empty <th> leaves the column unnamed.
    { key: "actions", label: "Actions", sortable: false, srOnly: true },
  ];

  function actionLinks(site, variant) {
    var actions = el("div", "www-rag-" + variant + "-actions");
    if (site.releaseId) {
      var chatLink = document.createElement("a");
      chatLink.className = "www-rag-card-action www-rag-card-chat";
      chatLink.href = CHAT_BASE + encodeURIComponent(site.releaseId);
      chatLink.target = "_blank";
      chatLink.rel = "noopener";
      chatLink.textContent = "Chat";
      actions.appendChild(chatLink);
    } else if (variant === "card") {
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
    return actions;
  }

  /**
   * Two orthogonal facts, always both stated: is there a chat endpoint, and
   * has an owner taken the site over. An earlier version also emitted a
   * "Docs" chip, which only repeated the Files column and — because it was
   * checked before the fallback — silently suppressed "Live" on any site
   * that happened to carry documents.
   */
  function statusChips(site) {
    var wrap = el("div", "www-rag-row-status");
    wrap.appendChild(
      site.releaseId
        ? el("span", "www-rag-chip www-rag-chip-ok", "Live")
        : el("span", "www-rag-chip www-rag-chip-pending", "No chat"),
    );
    if (site.claimed) wrap.appendChild(el("span", "www-rag-chip www-rag-chip-claimed", "Claimed"));
    return wrap;
  }

  function tableHead() {
    var thead = document.createElement("thead");
    var headRow = document.createElement("tr");
    TABLE_COLUMNS.forEach(function (col) {
      var th = document.createElement("th");
      th.scope = "col";
      th.className = "www-rag-th" + (col.numeric ? " www-rag-num" : "");
      if (!col.sortable) {
        if (col.srOnly) th.appendChild(el("span", "sr-only", col.label));
        else th.textContent = col.label;
      } else {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "www-rag-sort-btn";
        btn.textContent = col.label;
        var active = sortKey === col.key;
        th.setAttribute("aria-sort", active ? (sortDir === "asc" ? "ascending" : "descending") : "none");
        if (active) {
          btn.classList.add("is-active");
          btn.appendChild(el("span", "www-rag-sort-caret", sortDir === "asc" ? "▲" : "▼"));
        }
        btn.addEventListener("click", function () {
          if (sortKey === col.key) {
            sortDir = sortDir === "asc" ? "desc" : "asc";
          } else {
            sortKey = col.key;
            sortDir = defaultDirFor(col.key);
          }
          setSortSelect();
          syncUrl();
          render();
        });
        th.appendChild(btn);
      }
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    return thead;
  }

  function tableRow(site) {
    var tr = document.createElement("tr");

    var nameCell = document.createElement("td");
    var nameWrap = el("div", "www-rag-row-site");
    nameWrap.appendChild(renderFavicon(site));
    nameWrap.appendChild(el("span", "www-rag-row-host", site.host));
    nameCell.appendChild(nameWrap);
    tr.appendChild(nameCell);

    tr.appendChild(el("td", "www-rag-row-desc", site.description || ""));
    tr.appendChild(el("td", "www-rag-num", formatCount(site.pageCount)));
    tr.appendChild(el("td", "www-rag-num", formatCount(site.fileCount)));
    tr.appendChild(el("td", "www-rag-num", formatCount(site.chunkCount)));
    tr.appendChild(el("td", "www-rag-num", formatBytes(site.totalBytes) || "—"));
    tr.appendChild(el("td", "www-rag-num", formatDate(site.lastCrawledAt) || "—"));

    var statusCell = document.createElement("td");
    statusCell.appendChild(statusChips(site));
    tr.appendChild(statusCell);

    var actionCell = document.createElement("td");
    actionCell.appendChild(actionLinks(site, "row"));
    tr.appendChild(actionCell);

    return tr;
  }

  /**
   * A view that can be filled a slice at a time.
   *
   * Both views build their container once and then take rows in chunks, so
   * `render()` never has to decide how much of the list exists yet — see
   * drawNextChunk() for why the list is not drawn all at once.
   */
  function cardsPager() {
    var grid = el("div", "www-rag-grid");
    return {
      root: grid,
      append: function (sites, from, to) {
        var frag = document.createDocumentFragment();
        for (var i = from; i < to; i++) frag.appendChild(renderCard(sites[i]));
        grid.appendChild(frag);
      },
    };
  }

  function tablePager() {
    var table = el("table", "www-rag-table");
    table.appendChild(tableHead());
    var tbody = document.createElement("tbody");
    table.appendChild(tbody);

    var scroller = el("div", "www-rag-table-wrap");
    scroller.setAttribute("tabindex", "0");
    scroller.setAttribute("role", "region");
    scroller.setAttribute("aria-label", "WWW-RAG directory table");
    scroller.appendChild(table);

    return {
      root: scroller,
      append: function (sites, from, to) {
        var frag = document.createDocumentFragment();
        for (var i = from; i < to; i++) frag.appendChild(tableRow(sites[i]));
        tbody.appendChild(frag);
      },
    };
  }

  /* ── Filtering, sorting, view state ───────────────────────────────── */

  var toolbarEl = document.getElementById("www-rag-toolbar");
  var tldEl = document.getElementById("www-rag-filter-tld");
  var statusFilterEl = document.getElementById("www-rag-filter-status");
  var docsEl = document.getElementById("www-rag-filter-docs");
  var sortEl = document.getElementById("www-rag-sort");
  var countEl = document.getElementById("www-rag-count");
  var exportEl = document.getElementById("www-rag-export");
  var resetEl = document.getElementById("www-rag-reset");
  var viewButtons = [].slice.call(document.querySelectorAll("[data-www-rag-view]"));

  // TLDs worth their own option; everything else lands in "Other".
  var NAMED_TLDS = ["com", "org", "gov", "edu", "io", "ai", "net", "co", "dev"];

  var view = "cards";
  var sortKey = "chunkCount";
  var sortDir = "desc";
  var visible = [];

  /**
   * Mirrors the active sort into the select. Table headers can produce an
   * order the select has no option for (fewest pages, oldest crawl), and
   * assigning an absent value to a <select> silently blanks it — so those
   * land on the disabled "Custom order" entry instead of an empty box.
   */
  function setSortSelect() {
    if (!sortEl) return;
    var target = sortKey + ":" + sortDir;
    sortEl.value = target;
    if (sortEl.value !== target) sortEl.value = "";
  }

  function defaultDirFor(key) {
    // Names read best A→Z; every numeric/date column is most interesting big-first.
    return key === "host" ? "asc" : "desc";
  }

  function tldOf(site) {
    var host = (site.host || "").toLowerCase();
    var parts = host.split(".");
    var last = parts[parts.length - 1] || "";
    return NAMED_TLDS.indexOf(last) !== -1 ? last : "other";
  }

  function readFilters() {
    return {
      tld: tldEl ? tldEl.value : "",
      status: statusFilterEl ? statusFilterEl.value : "",
      docs: docsEl ? docsEl.value : "",
    };
  }

  function matchesFilters(site, f) {
    if (f.tld && tldOf(site) !== f.tld) return false;

    if (f.status === "chat" && !site.releaseId) return false;
    if (f.status === "nochat" && site.releaseId) return false;
    if (f.status === "claimed" && !site.claimed) return false;
    if (f.status === "unclaimed" && site.claimed) return false;

    if (f.docs === "files" && !site.fileCount) return false;
    if (f.docs === "pages" && !!site.fileCount) return false;

    return true;
  }

  function matchesQuery(site, q) {
    if (!q) return true;
    return (
      (site.host || "").toLowerCase().indexOf(q) !== -1 ||
      (site.title || "").toLowerCase().indexOf(q) !== -1 ||
      (site.description || "").toLowerCase().indexOf(q) !== -1
    );
  }

  /**
   * Sort key for one row, or null when the site simply has no value for it —
   * 103 sites have no chunk count and 158 no byte count, and "unknown" is not
   * "zero". sortSites keeps nulls last in BOTH directions, so "fewest pages"
   * leads with a site that really has few pages rather than with every site
   * nobody has measured yet.
   */
  function sortValue(site, key) {
    if (key === "host") return (site.host || "").toLowerCase();
    if (key === "lastCrawledAt") {
      var t = Date.parse(site.lastCrawledAt || "");
      return isNaN(t) ? null : t;
    }
    var n = site[key];
    return typeof n === "number" && isFinite(n) ? n : null;
  }

  function sortSites(sites) {
    var dir = sortDir === "asc" ? 1 : -1;
    return sites.slice().sort(function (a, b) {
      var av = sortValue(a, sortKey);
      var bv = sortValue(b, sortKey);
      if (av === null || bv === null) {
        if (av !== bv) return av === null ? 1 : -1;
      } else {
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
      }
      // Host is the tiebreaker so equal counts don't shuffle between renders.
      var ah = (a.host || "").toLowerCase();
      var bh = (b.host || "").toLowerCase();
      return ah < bh ? -1 : ah > bh ? 1 : 0;
    });
  }

  function currentQuery() {
    return (searchEl && searchEl.value ? searchEl.value : "").trim().toLowerCase();
  }

  function updateCount(total) {
    if (!countEl) return;
    var all = allSites.length;
    countEl.textContent =
      total === all
        ? formatCount(all) + " sites"
        : formatCount(total) + " of " + formatCount(all) + " sites";
    if (exportEl) {
      exportEl.textContent = "Export CSV (" + formatCount(total) + ")";
      exportEl.disabled = total === 0;
    }
  }

  /* ── Drawing the list in chunks ─────────────────────────────────────
   *
   * `visible` is the answer to the query; how much of it currently exists as
   * DOM is a separate question. The catalogue is continuous and self-feeding
   * — it grew from 221 to 472 sites in a month — so "build every row up
   * front" has a ceiling it will reach on its own. Rows are drawn a chunk at
   * a time and topped up as a sentinel below the list comes into view.
   *
   * Everything that is ABOUT the result set — the count, the export, the
   * empty state — reads `visible`, never what has been drawn. A visitor who
   * exports without scrolling still gets every matching row.
   *
   * Without IntersectionObserver the whole list is drawn at once, which is
   * exactly the old behaviour.
   */
  var RENDER_CHUNK = 120;
  var drawn = 0;
  var pager = null;
  var sentinelEl = null;
  var chunkObserver = null;

  function teardownChunks() {
    if (chunkObserver) {
      chunkObserver.disconnect();
      chunkObserver = null;
    }
    if (sentinelEl && sentinelEl.parentNode) sentinelEl.parentNode.removeChild(sentinelEl);
    sentinelEl = null;
    pager = null;
    drawn = 0;
  }

  function drawNextChunk() {
    if (!pager || drawn >= visible.length) return;
    var next = sentinelEl ? Math.min(drawn + RENDER_CHUNK, visible.length) : visible.length;
    pager.append(visible, drawn, next);
    drawn = next;
    if (drawn >= visible.length && sentinelEl) {
      if (chunkObserver) chunkObserver.disconnect();
      sentinelEl.parentNode.removeChild(sentinelEl);
      sentinelEl = null;
      chunkObserver = null;
    }
  }

  function startChunks() {
    if (typeof IntersectionObserver !== "function") return; // draw it all
    sentinelEl = el("div", "www-rag-sentinel");
    sentinelEl.setAttribute("aria-hidden", "true");
    gridEl.appendChild(sentinelEl);
    chunkObserver = new IntersectionObserver(function (entries, observer) {
      // A callback can outlive the render that armed it: notifications are
      // queued as tasks, and changing a filter tears the whole list down in
      // between. Anything from a previous render is dropped rather than
      // being applied to the current one.
      if (observer !== chunkObserver || !sentinelEl) return;
      if (!entries.some(function (e) { return e.isIntersecting; })) return;
      // Re-observing is what makes a second chunk load when the sentinel is
      // STILL on screen afterwards: an element that never leaves the
      // intersection never fires the callback again on its own.
      observer.unobserve(sentinelEl);
      drawNextChunk();
      if (chunkObserver === observer && sentinelEl) observer.observe(sentinelEl);
    }, { rootMargin: "900px" });
  }

  function render() {
    var q = currentQuery();
    var filters = readFilters();
    visible = sortSites(
      allSites.filter(function (site) {
        return matchesQuery(site, q) && matchesFilters(site, filters);
      }),
    );

    updateCount(visible.length);
    viewButtons.forEach(function (btn) {
      var on = btn.getAttribute("data-www-rag-view") === view;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    teardownChunks();
    gridEl.innerHTML = "";
    if (!visible.length) {
      statusEl.textContent = "No sites match your search and filters.";
      statusEl.classList.remove("hidden");
      return;
    }
    statusEl.classList.add("hidden");
    pager = view === "table" ? tablePager() : cardsPager();
    gridEl.appendChild(pager.root);
    startChunks();
    drawNextChunk();
    if (chunkObserver && sentinelEl) chunkObserver.observe(sentinelEl);
  }

  /* ── URL state ────────────────────────────────────────────────────── */

  var URL_KEYS = ["q", "view", "tld", "status", "docs", "sort"];

  function syncUrl() {
    try {
      var url = new URL(window.location.href);
      var q = currentQuery();
      var state = {
        q: q,
        view: view === "table" ? "table" : "",
        tld: tldEl ? tldEl.value : "",
        status: statusFilterEl ? statusFilterEl.value : "",
        docs: docsEl ? docsEl.value : "",
        sort: sortKey === "chunkCount" && sortDir === "desc" ? "" : sortKey + ":" + sortDir,
      };
      URL_KEYS.forEach(function (key) {
        if (state[key]) url.searchParams.set(key, state[key]);
        else url.searchParams.delete(key);
      });
      url.searchParams.delete("search"); // legacy alias, folded into ?q=
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch (e) {
      // ignore — history API unavailable
    }
  }

  function readUrlState() {
    var params;
    try {
      params = new URLSearchParams(window.location.search);
    } catch (e) {
      return;
    }
    var q = (params.get("q") || params.get("search") || "").trim();
    if (q && searchEl) searchEl.value = q;
    if (params.get("view") === "table") view = "table";
    setSelect(tldEl, params.get("tld"));
    setSelect(statusFilterEl, params.get("status"));
    setSelect(docsEl, params.get("docs"));
    var sort = params.get("sort");
    if (sort) {
      var bits = sort.split(":");
      var key = bits[0];
      if (TABLE_COLUMNS.some(function (c) { return c.sortable && c.key === key; })) {
        sortKey = key;
        sortDir = bits[1] === "asc" ? "asc" : "desc";
      }
    }
    setSortSelect();
  }

  function setSelect(select, value) {
    if (!select || !value) return;
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === value) {
        select.value = value;
        return;
      }
    }
  }

  /* ── CSV export ───────────────────────────────────────────────────────
   *
   * Everything the API gives us, one row per site, in whatever order and
   * filtering the visitor is currently looking at — so "export" always
   * matches what is on screen, and an untouched page exports the whole
   * directory.
   */
  var CSV_COLUMNS = [
    ["Host", function (s) { return s.host; }],
    ["Title", function (s) { return s.title; }],
    ["Description", function (s) { return s.description; }],
    ["Pages", function (s) { return s.pageCount; }],
    ["Files", function (s) { return s.fileCount; }],
    ["Chunks", function (s) { return s.chunkCount; }],
    ["Bytes", function (s) { return s.totalBytes; }],
    ["Size", function (s) { return formatBytes(s.totalBytes); }],
    ["Last crawled", function (s) { return s.lastCrawledAt; }],
    ["Chat enabled", function (s) { return s.releaseId ? "yes" : "no"; }],
    ["Claimed", function (s) { return s.claimed ? "yes" : "no"; }],
    ["Theme available", function (s) { return s.themeAvailable ? "yes" : "no"; }],
    ["Chat URL", function (s) { return s.releaseId ? CHAT_BASE + s.releaseId : ""; }],
    ["Language model", function (s, mc) { return mc.languageModel; }],
    ["Embedding model", function (s, mc, d) { return d.embeddingModel; }],
    ["Vector database", function (s, mc, d) { return d.vectorDatabase; }],
    ["Chunking tools", function (s, mc, d) { return joinList(d.chunkingTools); }],
    ["Document parsers", function (s, mc, d) { return joinList(d.documentParsers); }],
    ["Created", function (s, mc, d) { return d.createdAt; }],
    ["Updated", function (s, mc, d) { return d.updatedAt; }],
    ["Conversations", function (s, mc, d) { return d.conversationCount; }],
    ["Rating up", function (s, mc, d) { return d.rating && d.rating.up; }],
    ["Rating down", function (s, mc, d) { return d.rating && d.rating.down; }],
    ["Rating % positive", function (s, mc, d) { return d.rating && d.rating.percentPositive; }],
    ["Fine-tuned", function (s, mc, d) { return d.fineTuned ? "yes" : "no"; }],
    ["Fine-tune dataset size", function (s, mc, d) { return d.fineTuneDatasetSize; }],
    ["Voice", function (s, mc, d) { return d.tools && d.tools.voice; }],
    ["Speech-to-text", function (s, mc, d) { return d.tools && d.tools.speechToText; }],
    ["Other tools", function (s, mc, d) { return d.tools ? otherToolsLabel(d.tools) : ""; }],
  ];

  /**
   * Quotes every field, doubling embedded quotes, and neutralises the
   * spreadsheet formula-injection vector: descriptions are crawled
   * third-party text, and a value starting =, +, - or @ is executed as a
   * formula when the CSV is opened in Excel or Sheets.
   */
  function csvCell(value) {
    if (value === null || value === undefined || value === false) return '""';
    var text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replace(/"/g, '""') + '"';
  }

  function buildCsv(sites) {
    var lines = [CSV_COLUMNS.map(function (c) { return csvCell(c[0]); }).join(",")];
    sites.forEach(function (site) {
      var mc = site.modelCard || {};
      var d = mc.details || {};
      lines.push(
        CSV_COLUMNS.map(function (c) {
          return csvCell(c[1](site, mc, d));
        }).join(","),
      );
    });
    return lines.join("\r\n") + "\r\n";
  }

  function exportCsv() {
    if (!visible.length) return;
    // BOM first: without it Excel reads the file as the system codepage and
    // mangles every non-ASCII site title.
    var blob = new Blob(["﻿" + buildCsv(visible)], { type: "text/csv;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "divinci-www-rag-directory.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    // Revoked on the next tick — Safari aborts the download if the object URL
    // disappears in the same task as the click.
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 0);
  }

  /* ── Wiring ───────────────────────────────────────────────────────── */

  function onControlChange() {
    syncUrl();
    render();
  }

  if (searchEl) searchEl.addEventListener("input", onControlChange);
  [tldEl, statusFilterEl, docsEl].forEach(function (select) {
    if (select) select.addEventListener("change", onControlChange);
  });
  if (sortEl) {
    sortEl.addEventListener("change", function () {
      var bits = sortEl.value.split(":");
      sortKey = bits[0];
      sortDir = bits[1] === "asc" ? "asc" : "desc";
      onControlChange();
    });
  }
  viewButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      view = btn.getAttribute("data-www-rag-view") === "table" ? "table" : "cards";
      onControlChange();
    });
  });
  if (exportEl) exportEl.addEventListener("click", exportCsv);
  if (resetEl) {
    resetEl.addEventListener("click", function () {
      if (searchEl) searchEl.value = "";
      [tldEl, statusFilterEl, docsEl].forEach(function (select) {
        if (select) select.value = "";
      });
      sortKey = "chunkCount";
      sortDir = "desc";
      setSortSelect();
      onControlChange();
    });
  }

  readUrlState();

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
        var totalSize =
          typeof data.totalBytes === "number" && data.totalBytes >= MIN_HEADER_BYTES
            ? formatBytes(data.totalBytes)
            : null;
        statsEl.textContent =
          fill(STATS_PATTERN, {
            sites: formatCount(data.totalSites),
            pages: formatCount(data.totalPages),
            files: formatCount(data.totalFiles),
            chunks: formatCount(data.totalChunks),
          }) +
          (totalSize ? " · " + fill(STATS_INDEXED, { size: totalSize }) : "");
      }
      // Only offer TLD options the catalog actually contains, so the filter
      // never leads to a guaranteed-empty result.
      if (tldEl) {
        var present = Object.create(null);
        allSites.forEach(function (site) { present[tldOf(site)] = true; });
        [].slice.call(tldEl.options).forEach(function (opt) {
          if (opt.value && !present[opt.value]) opt.remove();
        });
        // Removing the selected option silently resets the select to "all".
        // Re-sync so a shared ?tld=… link cannot claim a filter the page is
        // no longer applying.
        syncUrl();
      }
      if (toolbarEl) toolbarEl.hidden = false;
      render();
    })
    .catch(function (err) {
      statusEl.textContent = "Couldn't load the directory right now. Please try again shortly.";
      statusEl.classList.remove("hidden");
      console.warn("[www-rag-directory]", err);
    });
})();
