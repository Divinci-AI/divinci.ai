/* divinci.app/connect/ — assistant picker, copy button, and the ?site= callout.
 *
 * No framework, no build step, same as the rest of this funnel. */
(function () {
  "use strict";

  /* ── The assistant picker ──────────────────────────────────────────────
   * Tabs are progressive enhancement: the markup ships every panel visible and
   * this hides all but one. With JS off the page is longer but COMPLETE — every
   * instruction is still readable, which for an install guide is the only
   * acceptable degradation. */
  var tabs = [].slice.call(document.querySelectorAll(".client-tab"));
  var panels = [].slice.call(document.querySelectorAll(".client-panel"));
  if (tabs.length && panels.length) {
    var select = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-client") === id;
        t.setAttribute("aria-selected", on ? "true" : "false");
        // Roving tabindex: one stop for the whole group, arrows move within it.
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      panels.forEach(function (p) {
        p.hidden = p.getAttribute("data-client") !== id;
      });
      try {
        localStorage.setItem("divinci-connect-client", id);
      } catch (e) { /* private window, or site data blocked — not worth failing over */ }
    };

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { select(t.getAttribute("data-client")); });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var next = tabs[(i + d + tabs.length) % tabs.length];
        select(next.getAttribute("data-client"), true);
      });
    });

    /* Remember the last choice: someone who comes back to re-read the steps is
     * almost always on the same assistant. Falls back to the markup's default. */
    var remembered = null;
    try { remembered = localStorage.getItem("divinci-connect-client"); } catch (e) { /* see above */ }
    var known = tabs.some(function (t) { return t.getAttribute("data-client") === remembered; });
    select(known ? remembered : tabs[0].getAttribute("data-client"));
  }

  /* ── Copy the server URL ───────────────────────────────────────────────
   * Every path on this page — all three assistants and the CLI — needs this one
   * string typed correctly. Copy is the actual product of the page. */
  var btn = document.querySelector(".mcp-copy");
  var urlEl = document.querySelector(".mcp-url code");
  if (btn && urlEl) {
    btn.addEventListener("click", function () {
      var text = urlEl.textContent.trim();
      var done = function (ok) {
        btn.textContent = ok ? "Copied" : "Press ⌘C";
        btn.setAttribute("data-copied", ok ? "true" : "false");
        setTimeout(function () {
          btn.textContent = "Copy";
          btn.removeAttribute("data-copied");
        }, 2000);
      };
      /* navigator.clipboard needs a secure context AND permission, and it
       * rejects silently in some embedded webviews. Selecting the text is the
       * fallback that always leaves the user one keystroke away rather than
       * with a button that appeared to do nothing. */
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { selectFallback(); });
      } else {
        selectFallback();
      }
      function selectFallback() {
        try {
          var r = document.createRange();
          r.selectNodeContents(urlEl);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(r);
          done(false);
        } catch (e) { done(false); }
      }
    });
  }

  /* ── "We already have your site" ───────────────────────────────────────
   * Rendered only when ?site= is present. The value is put in the page as TEXT
   * (never innerHTML) and is also used to build a link, so it is validated as a
   * hostname first — this parameter arrives from an outreach email, i.e. from
   * outside, and a bare `location.search` value reaching either sink is how a
   * marketing page becomes an XSS or an open redirect. */
  var params = new URLSearchParams(window.location.search);
  var site = (params.get("site") || "").trim().toLowerCase();
  // Hostname shape only: labels of a-z0-9/hyphen, at least one dot, no scheme,
  // no path, no userinfo, no port. Anything else is dropped silently.
  var HOST = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
  var banner = document.querySelector(".claim-banner");
  if (banner && site && HOST.test(site)) {
    var slot = banner.querySelector("[data-site]");
    if (slot) slot.textContent = site;
    var link = banner.querySelector("[data-claim-link]");
    /* The directory page consumes `?claim=<host>` and opens that site's claim
     * modal directly. NOT `/claim?site=` — that route does not exist, and the
     * web client is served with SPA not-found handling, so a wrong path returns
     * 200 with the app shell and a status-code check calls it healthy. Verified
     * against the router, not against curl. */
    if (link) link.href = link.getAttribute("data-claim-base") + "?claim=" + encodeURIComponent(site);
    banner.hidden = false;
  }
})();
