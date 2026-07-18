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

  function wireForm(form) {
    var input = form.querySelector("input");
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
      window.location.href =
        APP_ORIGIN + "/start/scan?url=" + encodeURIComponent(normalized);
    });
  }

  var hero = document.getElementById("scan-form");
  if (hero) wireForm(hero);
  document.querySelectorAll("[data-scan-form]").forEach(wireForm);
})();
