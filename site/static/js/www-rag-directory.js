/**
 * WWW-RAG public directory widget for divinci.ai.
 *
 * Fetches the already-public, unauthenticated directory API and renders a
 * searchable grid. Each card links straight into an anonymous chat session
 * for that site's release — no sign-up required, mirroring the same
 * click-target pattern used by the logged-in directory at
 * chat.divinci.app/www-rag (PATH_WHITELABEL_RELEASE_ITEM = /ai-release/:releaseId).
 */
(function () {
  "use strict";

  var API_URL = "https://api.divinci.app/api/v1/www-rag-directory";
  var CHAT_BASE = "https://chat.divinci.app/ai-release/";

  var statusEl = document.getElementById("www-rag-status");
  var gridEl = document.getElementById("www-rag-grid");
  var statsEl = document.getElementById("www-rag-stats");
  var searchEl = document.getElementById("www-rag-search");

  if (!gridEl) return;

  var allSites = [];

  function formatCount(n) {
    return Number(n || 0).toLocaleString("en-US");
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  // Site data (host/description/faviconUrl) originates from crawled
  // third-party pages — untrusted content. Built via DOM methods
  // (textContent / attribute setters) rather than innerHTML so nothing a
  // crawled page's title/meta tags contain can ever be parsed as markup.
  function renderCard(site) {
    var card = document.createElement(site.releaseId ? "a" : "div");
    card.className = "www-rag-card";
    if (site.releaseId) {
      card.href = CHAT_BASE + encodeURIComponent(site.releaseId);
      card.target = "_blank";
      card.rel = "noopener";
    }

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

    var footer = el("div", "www-rag-card-footer");
    footer.appendChild(el("span", null, formatCount(site.chunkCount) + " chunks"));
    footer.appendChild(
      site.releaseId
        ? el("span", "www-rag-card-chat", "Chat →")
        : el("span", null, "Not yet chat-enabled"),
    );
    card.appendChild(footer);

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

  function applySearch() {
    var q = (searchEl.value || "").trim().toLowerCase();
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
        statsEl.textContent =
          formatCount(data.totalSites) + " curated sites · " + formatCount(data.totalChunks) + " searchable chunks";
      }
      renderGrid(allSites);
    })
    .catch(function (err) {
      statusEl.textContent = "Couldn't load the directory right now. Please try again shortly.";
      statusEl.classList.remove("hidden");
      console.warn("[www-rag-directory]", err);
    });
})();
