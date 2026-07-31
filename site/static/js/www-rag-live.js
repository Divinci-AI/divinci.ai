/**
 * Live crawl status strip for /www-rag.
 *
 * Polls /api/www-rag/activity — a snapshot the laptop-local crawl daemon
 * pushes every ~20s — and renders what the crawler is doing right now:
 * which sites are being fetched, which just finished, and how far through
 * the pass it is.
 *
 * Two rules shape everything here:
 *
 *  1. NEVER IMPLY LIVE WORK THAT ISN'T HAPPENING. The daemon runs on a laptop
 *     and is often idle or off. The endpoint downgrades a stale snapshot to
 *     `offline` server-side; this file renders idle and offline plainly rather
 *     than leaving a "crawling" animation spinning over a dead feed.
 *  2. HOSTNAMES ARE UNTRUSTED. They reach the payload from crawled third-party
 *     pages (an outbound link becomes a discovered seed). The endpoint drops
 *     anything that isn't a plain DNS name; this file additionally only ever
 *     writes them via textContent, never innerHTML.
 */
(function () {
  "use strict";

  var API_URL = "/api/www-rag/activity";

  // Poll cadence by state. Work in progress is worth 15s; an idle daemon
  // changes on a multi-hour clock and doesn't deserve the requests.
  var INTERVAL_ACTIVE = 15000;
  var INTERVAL_IDLE = 60000;
  var INTERVAL_OFFLINE = 180000;
  var MAX_BACKOFF = 300000;

  var STATE_LABELS = {
    growing: "Discovering new sites",
    crawling: "Crawling now",
    embedding: "Embedding pages",
    publishing: "Publishing to the directory",
    idle: "Idle between passes",
    offline: "Crawler offline",
  };
  var ACTIVE_STATES = { growing: 1, crawling: 1, embedding: 1, publishing: 1 };

  var rootEl = document.getElementById("www-rag-live");
  if (!rootEl) return;

  var dotEl = document.getElementById("www-rag-live-dot");
  var headlineEl = document.getElementById("www-rag-live-headline");
  var detailEl = document.getElementById("www-rag-live-detail");
  var inFlightEl = document.getElementById("www-rag-live-inflight");
  var recentEl = document.getElementById("www-rag-live-recent");

  var timer = null;
  var failures = 0;

  function num(n) {
    return Number(n).toLocaleString("en-US");
  }

  /** "just now" / "20s ago" / "4m ago" / "2h 10m" — compact by design. */
  function relative(ms) {
    var s = Math.round(Math.abs(ms) / 1000);
    if (s < 10) return "just now";
    if (s < 60) return s + "s";
    var m = Math.round(s / 60);
    if (m < 60) return m + "m";
    var h = Math.floor(m / 60);
    var rem = m % 60;
    return rem ? h + "h " + rem + "m" : h + "h";
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  /** Headline detail: progress while working, timing while not. */
  function detailText(data) {
    if (data.state === "offline") {
      return typeof data.ageSeconds === "number"
        ? "last active " + relative(data.ageSeconds * 1000) + " ago"
        : "";
    }
    if (data.state === "idle") {
      if (typeof data.nextPassAt === "number") {
        var wait = data.nextPassAt - Date.now();
        // A pass that is already overdue is starting imminently; saying
        // "next pass in -4m" would just look broken.
        if (wait > 0) return "next pass in " + relative(wait);
        return "next pass starting";
      }
      return "";
    }
    if (typeof data.seeds === "number" && typeof data.done === "number") {
      return num(data.done) + " of " + num(data.seeds) + " sites this pass";
    }
    return "";
  }

  function renderInFlight(data) {
    clear(inFlightEl);
    var hosts = Array.isArray(data.inFlight) ? data.inFlight : [];
    if (data.state !== "crawling" || hosts.length === 0) {
      inFlightEl.hidden = true;
      return;
    }
    inFlightEl.hidden = false;
    inFlightEl.appendChild(el("span", "www-rag-live-label", "Fetching"));
    var shown = hosts.slice(0, 6);
    for (var i = 0; i < shown.length; i++) {
      inFlightEl.appendChild(el("span", "www-rag-live-host", shown[i]));
    }
    if (hosts.length > shown.length) {
      inFlightEl.appendChild(
        el("span", "www-rag-live-more", "+" + (hosts.length - shown.length) + " more")
      );
    }
  }

  function renderRecent(data) {
    clear(recentEl);
    var recent = Array.isArray(data.recent) ? data.recent : [];
    if (recent.length === 0) {
      recentEl.hidden = true;
      return;
    }
    recentEl.hidden = false;
    // "Just indexed" is only true while a pass is running. Between passes the
    // newest completion can be hours old, so the label has to change with it.
    recentEl.appendChild(
      el("div", "www-rag-live-label", ACTIVE_STATES[data.state] ? "Just indexed" : "Last indexed")
    );
    var list = el("ul", "www-rag-live-list");
    for (var i = 0; i < Math.min(recent.length, 6); i++) {
      var item = recent[i];
      if (!item || typeof item.host !== "string") continue;
      var li = el("li", "www-rag-live-item");
      li.appendChild(el("span", "www-rag-live-host", item.host));
      var bits = [];
      if (item.pages) bits.push(num(item.pages) + (item.pages === 1 ? " page" : " pages"));
      if (item.chunks) bits.push(num(item.chunks) + (item.chunks === 1 ? " chunk" : " chunks"));
      // The crawl is incremental, so a re-visited site legitimately finds
      // nothing new. That's still a completed unit of work worth showing —
      // but "0 pages · 0 chunks" reads like a failure, so name it plainly.
      li.appendChild(
        el("span", "www-rag-live-counts", bits.length ? bits.join(" · ") : "no new pages")
      );
      list.appendChild(li);
    }
    recentEl.appendChild(list);
  }

  function render(data) {
    var state = STATE_LABELS[data.state] ? data.state : "offline";

    // Nothing has ever been reported (fresh deploy, or the record aged out
    // entirely) — there is no honest thing to show, so show nothing.
    if (state === "offline" && typeof data.ageSeconds !== "number") {
      rootEl.hidden = true;
      return;
    }

    rootEl.hidden = false;
    rootEl.setAttribute("data-state", state);
    dotEl.className = "www-rag-live-dot www-rag-live-dot-" + state;
    headlineEl.textContent = STATE_LABELS[state];

    var detail = detailText(data);
    detailEl.textContent = detail;
    detailEl.hidden = !detail;

    renderInFlight(data);
    renderRecent(data);
  }

  function nextDelay(state) {
    if (failures > 0) {
      // Exponential backoff on a broken endpoint — a marketing page must not
      // hammer a failing origin from every open tab.
      return Math.min(INTERVAL_OFFLINE * Math.pow(2, failures - 1), MAX_BACKOFF);
    }
    if (ACTIVE_STATES[state]) return INTERVAL_ACTIVE;
    if (state === "idle") return INTERVAL_IDLE;
    return INTERVAL_OFFLINE;
  }

  function schedule(state) {
    if (timer) clearTimeout(timer);
    timer = setTimeout(poll, nextDelay(state));
  }

  function poll() {
    if (document.hidden) {
      // Don't poll a background tab; visibilitychange re-arms immediately.
      schedule("idle");
      return;
    }
    fetch(API_URL, { headers: { Accept: "application/json" } })
      .then(function (resp) {
        if (!resp.ok) throw new Error("activity request failed: " + resp.status);
        return resp.text();
      })
      .then(function (text) {
        var data = JSON.parse(text);
        failures = 0;
        render(data);
        schedule(data && data.state);
      })
      .catch(function (err) {
        failures++;
        // Leave whatever was last rendered in place. A transient network blip
        // should not flip a healthy "Crawling now" to "offline".
        if (failures === 1) console.warn("[www-rag-live]", err);
        schedule("offline");
      });
  }

  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) poll();
  });

  poll();
})();
