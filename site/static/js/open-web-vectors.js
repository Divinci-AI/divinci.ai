/**
 * Open Web Vector Initiative — live figures for /open-web-vectors/.
 *
 * The page's whole claim is "measured, not projected", which a hand-typed
 * number quietly stops being the week after it is typed. Every figure is
 * server-rendered from a dated snapshot so the page is complete without JS,
 * and this script re-reads all of them from the same public directory API
 * that backs the /www-rag/ grid — no key, no auth, one request.
 *
 * If the request fails, nothing is touched: the snapshot stays on screen with
 * its date, which is a truthful fallback rather than a row of dashes.
 *
 * Byte formatting matches www-rag-directory.js (binary units labelled GB/MB)
 * on purpose — the same corpus must not be quoted two different sizes on two
 * pages of the same site.
 */
(function () {
  "use strict";

  var API_URL = "https://api.divinci.app/api/v1/www-rag-directory";
  var CHAT_BASE = "https://chat.divinci.app/ai-release/";

  // Buckets shown in the composition bar; everything else falls into "other".
  // Deliberately shorter than www-rag-directory.js's filter list: this is a
  // five-segment bar that has to be readable at a glance, not a filter that
  // has to be useful for .io/.ai/.dev. Do not "align" the two lists.
  var NAMED_TLDS = ["com", "org", "gov", "edu"];
  // The three that make the public-interest point, in bar order.
  var PUBLIC_TLDS = ["org", "gov", "edu"];

  var statsEl = document.getElementById("owv-stats");
  if (!statsEl) return;

  function formatCount(n) {
    if (n === null || n === undefined || !isFinite(n)) return null;
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

  function setStat(name, value) {
    if (value === null || value === undefined) return;
    var node = document.querySelector('[data-owv-stat="' + name + '"]');
    if (node) node.textContent = value;
  }

  function tldOf(host) {
    var parts = String(host || "").toLowerCase().split(".");
    var last = parts[parts.length - 1] || "";
    return NAMED_TLDS.indexOf(last) !== -1 ? last : "other";
  }

  function median(values) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  function renderComposition(sites) {
    var counts = { com: 0, org: 0, gov: 0, edu: 0, other: 0 };
    for (var i = 0; i < sites.length; i++) counts[tldOf(sites[i].host)] += 1;
    var total = sites.length;
    if (!total) return;

    Object.keys(counts).forEach(function (key) {
      var seg = document.querySelector('[data-owv-seg="' + key + '"]');
      if (seg) seg.style.width = ((counts[key] / total) * 100).toFixed(1) + "%";
      var label = document.querySelector('[data-owv-count="' + key + '"]');
      if (label) label.textContent = formatCount(counts[key]);
    });

    var publicCount = 0;
    for (var j = 0; j < PUBLIC_TLDS.length; j++) publicCount += counts[PUBLIC_TLDS[j]];
    var share = document.querySelector("[data-owv-public-share]");
    if (share) share.textContent = Math.round((publicCount / total) * 100) + "%";
  }

  /** "a, b and c" — the copy reads as a sentence, not a comma list. */
  function joinHosts(hosts) {
    if (hosts.length <= 1) return hosts[0] || "";
    return hosts.slice(0, -1).join(", ") + " and " + hosts[hosts.length - 1];
  }

  function byDesc(field) {
    return function (a, b) { return (b[field] || 0) - (a[field] || 0); };
  }

  function renderFacts(sites) {
    var deepest = sites.slice().sort(byDesc("pageCount")).slice(0, 3);
    var node = document.querySelector('[data-owv-fact="deepest"]');
    if (node && deepest.length === 3) {
      var hosts = joinHosts(deepest.map(function (s) { return s.host; }));
      // "run past N" is only worth saying once N is a round number the third
      // site actually clears. Early in a crawl it would floor to 0 and the
      // sentence would read "run past 0 pages each".
      var floorK = Math.floor((deepest[2].pageCount || 0) / 1000) * 1000;
      node.textContent = floorK >= 1000
        ? hosts + " run past " + formatCount(floorK) + " pages each."
        : hosts + " are the deepest crawls in the index.";
    }

    var largest = sites.slice().sort(byDesc("totalBytes"))[0];
    var largestNode = document.querySelector('[data-owv-fact="largest"]');
    if (largestNode && largest && largest.totalBytes) {
      largestNode.textContent =
        largest.host + " — " + formatCount(largest.pageCount) + " pages, and " +
        formatBytes(largest.totalBytes) + " of extracted text: the densest corpus in the index.";
    }
  }

  /**
   * Three live examples, chosen by corpus size and filtered to hosts that
   * actually have a chat endpoint — a "see it working" card that links to a
   * release which isn't chat-enabled would be the one broken promise on a
   * page about keeping them.
   *
   * Host names come from crawled third-party pages, so every one of these is
   * written with textContent / attribute setters, never innerHTML.
   */
  function renderExamples(sites) {
    var wrap = document.getElementById("owv-examples");
    if (!wrap) return;
    var picks = sites
      .filter(function (s) { return s.releaseId && s.totalBytes; })
      .sort(byDesc("totalBytes"))
      .slice(0, 3);
    if (picks.length < 3) return; // keep the static fallback

    var frag = document.createDocumentFragment();
    picks.forEach(function (site) {
      var card = document.createElement("div");
      card.className = "owv-example";

      var host = document.createElement("span");
      host.className = "owv-example-host";
      host.textContent = site.host;
      card.appendChild(host);

      var meta = document.createElement("span");
      meta.className = "owv-example-meta";
      meta.textContent =
        formatCount(site.pageCount) + " pages · " +
        formatCount(site.chunkCount) + " chunks · " +
        formatBytes(site.totalBytes);
      card.appendChild(meta);

      var link = document.createElement("a");
      link.className = "owv-example-link";
      link.href = CHAT_BASE + encodeURIComponent(site.releaseId);
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = "Chat with it";
      card.appendChild(link);

      frag.appendChild(card);
    });
    wrap.innerHTML = "";
    wrap.appendChild(frag);
  }

  fetch(API_URL)
    .then(function (resp) {
      if (!resp.ok) throw new Error("directory request failed: " + resp.status);
      return resp.json();
    })
    .then(function (data) {
      var sites = data.sites || [];

      setStat("sites", formatCount(data.totalSites));
      setStat("pages", formatCount(data.totalPages));
      setStat("chunks", formatCount(data.totalChunks));
      setStat("bytes", formatBytes(data.totalBytes));
      setStat(
        "endpoints",
        formatCount(sites.filter(function (s) { return !!s.releaseId; }).length),
      );
      setStat(
        "median",
        formatCount(median(sites.map(function (s) { return s.pageCount; })
          .filter(function (n) { return typeof n === "number" && isFinite(n); }))),
      );

      var stamp = document.querySelector("[data-owv-asof]");
      if (stamp) stamp.textContent = "Read live just now.";

      if (sites.length) {
        renderComposition(sites);
        renderFacts(sites);
        renderExamples(sites);
      }
    })
    .catch(function (err) {
      // Leave the dated snapshot exactly as rendered — it is still true.
      console.warn("[open-web-vectors]", err);
    });
})();
