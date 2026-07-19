/* divinci.app funnel — hero/bottom forms hand the URL to the app's
   /start/scan deep-link (signup-safe; query survives Auth0 login).
   Staging previews (workers.dev / *.stage.*) target the staging app. */
(function () {
  "use strict";

  var host = window.location.hostname;
  var isStaging =
    host.endsWith(".workers.dev") ||
    host.indexOf("stage") !== -1 ||
    host === "localhost" ||
    host === "127.0.0.1";
  var APP_ORIGIN = isStaging
    ? "https://chat.stage.divinci.app"
    : "https://chat.divinci.app";
  var API_ORIGIN = isStaging
    ? "https://api.stage.divinci.app"
    : "https://api.divinci.app";

  // Point "Sign in" (and any data-app-link) at the right app origin.
  document.querySelectorAll("[data-app-link]").forEach(function (a) {
    a.href = APP_ORIGIN + a.getAttribute("data-app-link");
  });

  function normalizeUrl(raw) {
    var v = (raw || "").trim();
    if (!v) return "";
    if (!/^https?:\/\//i.test(v)) v = "https://" + v;
    try {
      var u = new URL(v);
      if (!u.hostname || u.hostname.indexOf(".") === -1) return "";
      return u.href;
    } catch (e) {
      return "";
    }
  }

  /** Same public, unauthenticated endpoint the directory search page uses
   *  (CORS already allows this origin). Bare host, matching the app-side
   *  ALREADY_LISTED check's own host normalization. Fails OPEN — a network
   *  hiccup or non-200/404 response must never block a legitimate scan. */
  function checkDirectory(hostname) {
    var url = API_ORIGIN + "/api/v1/www-rag-directory/" + encodeURIComponent(hostname);
    return fetch(url, { headers: { Accept: "application/json" } })
      .then(function (res) {
        if (res.status === 404) return null;
        if (!res.ok) return null;
        return res.json().catch(function () { return null; });
      })
      .catch(function () { return null; });
  }

  function showAlreadyListed(form, host) {
    var existing = form.querySelector(".scan-directory-alert");
    if (existing) existing.remove();
    var alert = document.createElement("div");
    alert.className = "scan-directory-alert";
    alert.setAttribute("role", "alert");

    var span = document.createElement("span");
    span.textContent = host + " is already in the Divinci directory.";

    var link = document.createElement("a");
    var directoryOrigin = isStaging ? "https://staging.divinci.ai" : "https://divinci.ai";
    var url = new URL(directoryOrigin + "/www-rag/");
    url.searchParams.set("q", host);
    link.href = url.href;
    link.textContent = "View listing & claim it →";

    alert.appendChild(span);
    alert.appendChild(document.createTextNode(" "));
    alert.appendChild(link);
    form.insertBefore(alert, form.firstChild);
  }

  function wireForm(form) {
    var input = form.querySelector("input");
    var button = form.querySelector("button[type=submit], button:not([type])");
    // Per-form memo so blur (fires first) and a follow-up submit don't both
    // hit the network for the same host — submit reuses blur's verdict.
    var lastCheckedHost = "";
    var lastCheckedListed = false;

    function runCheck(host) {
      if (button) { button.disabled = true; button.dataset.origLabel = button.dataset.origLabel || button.textContent; button.textContent = "Checking…"; }
      return checkDirectory(host).then(function (site) {
        if (button) { button.disabled = false; button.textContent = button.dataset.origLabel; }
        lastCheckedHost = host;
        lastCheckedListed = !!(site && site.listed !== false);
        if (lastCheckedListed) {
          showAlreadyListed(form, site.host || host);
        } else {
          var existingAlert = form.querySelector(".scan-directory-alert");
          if (existingAlert) existingAlert.remove();
        }
        return lastCheckedListed;
      });
    }

    input.addEventListener("blur", function () {
      var normalized = normalizeUrl(input.value);
      if (!normalized) return;
      var host = new URL(normalized).hostname;
      if (host === lastCheckedHost) return;
      void runCheck(host);
    });
    input.addEventListener("input", function () {
      // Host changed since the last check — clear the memo so blur/submit
      // re-checks instead of trusting a stale verdict.
      lastCheckedHost = "";
    });

    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var normalized = normalizeUrl(input.value);
      if (!normalized) {
        input.setCustomValidity("Enter your website address, like yourwebsite.com");
        input.reportValidity();
        input.addEventListener("input", function clear() {
          input.setCustomValidity("");
          input.removeEventListener("input", clear);
        });
        return;
      }
      var host = new URL(normalized).hostname;
      var proceed = function () {
        window.location.href =
          APP_ORIGIN + "/start/scan?url=" + encodeURIComponent(normalized);
      };
      if (host === lastCheckedHost) {
        if (!lastCheckedListed) proceed();
        return;
      }
      runCheck(host).then(function (listed) {
        if (!listed) proceed();
      });
    });
  }

  var hero = document.getElementById("scan-form");
  if (hero) wireForm(hero);
  document.querySelectorAll("[data-scan-form]").forEach(wireForm);
})();

/* Header language switcher (recycled from divinci.ai's language-switcher.js,
   simplified: absolute-positioned dropdown, toggle + outside-click close). */
(function () {
  "use strict";
  var sw = document.querySelector(".language-switcher");
  if (!sw) return;
  var btn = sw.querySelector(".language-switcher-current");
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    var open = sw.classList.toggle("active");
    btn.setAttribute("aria-expanded", open ? "true" : "false");
  });
  document.addEventListener("click", function (e) {
    if (!sw.contains(e.target)) {
      sw.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
    }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      sw.classList.remove("active");
      btn.setAttribute("aria-expanded", "false");
    }
  });
})();
