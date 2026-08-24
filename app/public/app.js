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

  function showAlreadyListed(form, host, claimed) {
    var existing = form.querySelector(".scan-directory-alert");
    if (existing) existing.remove();
    var alert = document.createElement("div");
    alert.className = "scan-directory-alert";
    alert.setAttribute("role", "alert");

    var span = document.createElement("span");
    span.textContent = host + " is already in the Divinci directory.";
    alert.appendChild(span);

    var actions = document.createElement("div");
    actions.className = "scan-directory-actions";
    var directoryOrigin = isStaging ? "https://staging.divinci.ai" : "https://divinci.ai";

    var buildLink = document.createElement("a");
    var buildUrl = new URL(directoryOrigin + "/www-rag/");
    buildUrl.searchParams.set("copy", host);
    buildLink.href = buildUrl.href;
    buildLink.textContent = "Build on it →";
    actions.appendChild(buildLink);

    if (!claimed) {
      var claimLink = document.createElement("a");
      var claimUrl = new URL(directoryOrigin + "/www-rag/");
      claimUrl.searchParams.set("claim", host);
      claimLink.href = claimUrl.href;
      claimLink.textContent = "Claim it →";
      actions.appendChild(claimLink);
    }

    alert.appendChild(actions);
    form.insertBefore(alert, form.firstChild);
  }

  function wireForm(form) {
    var input = form.querySelector("input");
    var button = form.querySelector("button[type=submit], button:not([type])");
    // Per-form memo so blur (fires first) and a follow-up submit don't both
    // hit the network for the same host — submit reuses blur's verdict.
    var lastCheckedHost = "";
    var lastCheckedListed = false;
    // The check currently in flight, so a submit that lands mid-check joins it
    // instead of firing a second request and racing its own verdict.
    var inFlightHost = "";
    var inFlight = null;

    /* `busy` disables the button and swaps its label for the duration. ONLY the
       submit path may pass it.

       The blur path MUST NOT — and this is the whole reason the funnel died.
       `blur` fires on the submit button's own MOUSEDOWN, before mouseup. So
       disabling the button from the blur handler disables it *mid-click*, and
       a browser dispatches no `click` (and therefore no `submit`) on a disabled
       button. The user's press on the primary CTA was swallowed outright: no
       navigation, no request, no console error, nothing to see. Measured
       2026-08-23 against production — 1000+ directory prechecks (this blur
       handler firing) against ZERO scan-website submits over 14 days.

       If you ever want busy feedback while the background check runs, show it
       on something that is not the button the user is in the middle of
       pressing. */
    function runCheck(host, busy) {
      if (busy && button) {
        button.disabled = true;
        button.dataset.origLabel = button.dataset.origLabel || button.textContent;
        button.textContent = "Checking…";
      }
      var settle = function () {
        if (busy && button) {
          button.disabled = false;
          if (button.dataset.origLabel) button.textContent = button.dataset.origLabel;
        }
        if (inFlightHost === host) { inFlight = null; inFlightHost = ""; }
      };
      var pending = checkDirectory(host).then(function (site) {
        settle();
        lastCheckedHost = host;
        // Only block on a PUBLICLY PUBLISHED listing — a still-draft release
        // (mid-crawl via the broader corpus pipeline) isn't "already
        // processed" from a visitor's point of view.
        lastCheckedListed = !!(site && site.published !== false);
        if (lastCheckedListed) {
          showAlreadyListed(form, site.host || host, !!site.claimed);
        } else {
          var existingAlert = form.querySelector(".scan-directory-alert");
          if (existingAlert) existingAlert.remove();
        }
        return lastCheckedListed;
      }, function () {
        // checkDirectory already fails open; this is belt-and-braces so a
        // rejection can never strand the button disabled or block a scan.
        settle();
        return false;
      });
      inFlightHost = host;
      inFlight = pending;
      return pending;
    }

    input.addEventListener("blur", function () {
      var normalized = normalizeUrl(input.value);
      if (!normalized) return;
      var host = new URL(normalized).hostname;
      if (host === lastCheckedHost) return;
      void runCheck(host, false);
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
      // Join a check the blur handler already started for this same host
      // rather than issuing a duplicate request.
      var check = (inFlight && inFlightHost === host) ? inFlight : runCheck(host, true);
      check.then(function (listed) {
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

/* "Ask Divinci" FAQ CTA — opens the chat panel via the widget's own bubble
   click handler (no public API on the widget; a synthetic click on the
   real button is the least-invasive way to trigger its internal toggle). */
(function () {
  "use strict";
  var cta = document.querySelector("[data-ask-divinci]");
  if (!cta) return;
  cta.addEventListener("click", function () {
    var bubble = document.querySelector(".dvc-bubble");
    if (bubble) bubble.click();
  });
})();

/* Scatter the hero proof-logo chips so they float at varied positions
   instead of sitting in a row. Each chip gets a random x and a random y
   inside its own vertical band (bands prevent overlap). */
(function () {
  "use strict";
  document.querySelectorAll(".hero-proof").forEach(function (zone) {
    var chips = zone.querySelectorAll("li");
    var band = 100 / chips.length;
    chips.forEach(function (chip, i) {
      var x = Math.random() * 65;                       // % of zone width
      var y = i * band + Math.random() * (band - 22);   // % within band, chip ≈22% tall
      chip.style.setProperty("--x", x.toFixed(1) + "%");
      chip.style.setProperty("--y", y.toFixed(1) + "%");
    });
  });
})();

/* Fixed ask bar → opens the Divinci chat panel (same mechanism as the FAQ
   CTA: click the widget's own bubble). The bar hides whenever the panel is
   open — watched via the widget root's dvc-chat-open class. */
(function () {
  "use strict";
  var bar = document.getElementById("ask-bar");
  if (!bar) return;

  function openPanel() {
    var bubble = document.querySelector(".dvc-bubble");
    if (bubble) bubble.click();
  }
  bar.addEventListener("click", openPanel);
  bar.querySelector("input").addEventListener("focus", openPanel);

  // The bar stays hidden until the visitor scrolls past the hero section,
  // and whenever the chat panel is open.
  var hero = document.querySelector(".hero");
  var footer = document.querySelector(".footer");
  var chatOpen = false;
  function pastHero() {
    if (!hero) return true;
    return window.scrollY > hero.offsetTop + hero.offsetHeight - 80;
  }
  function nearFooter() {
    if (!footer) return false;
    // Fade out once the footer starts entering the viewport.
    return footer.getBoundingClientRect().top < window.innerHeight;
  }
  function sync() {
    bar.classList.toggle("ask-bar-hidden", chatOpen || !pastHero() || nearFooter());
  }
  window.addEventListener("scroll", sync, { passive: true });

  function watchRoot() {
    var root = document.querySelector(".dvc-root");
    if (!root) { setTimeout(watchRoot, 500); return; }
    var update = function () {
      chatOpen = root.classList.contains("dvc-chat-open");
      sync();
    };
    new MutationObserver(update).observe(root, { attributes: true, attributeFilter: ["class"] });
    update();
  }
  watchRoot();
  sync();
})();

/* Lite YouTube embeds with promote-to-center: clicking any facade moves
   that video to the center slot, expands the trio to ~80% of the hero
   width (the other two peek from the sides), and starts playback. A
   previously playing video reverts to its thumbnail when demoted. */
(function () {
  "use strict";
  var container = document.querySelector(".hero-videos");
  if (!container) return;
  var POS = ["hero-video-left", "hero-video-center", "hero-video-right"];
  var wrappers = Array.prototype.slice.call(container.querySelectorAll(".hero-video"));
  wrappers.forEach(function (w) { w.__facade = w.querySelector(".yt-facade"); });

  function restoreFacade(w) {
    var iframe = w.querySelector("iframe");
    if (iframe) {
      iframe.remove();
      w.appendChild(w.__facade);
    }
  }

  function play(w) {
    var btn = w.__facade;
    var id = btn && btn.dataset.ytId;
    if (!id || w.querySelector("iframe")) return;
    var iframe = document.createElement("iframe");
    iframe.src = "https://www.youtube.com/embed/" + id +
      "?autoplay=1&loop=1&playlist=" + id + "&playsinline=1&rel=0&modestbranding=1";
    iframe.title = btn.dataset.ytTitle || "Divinci video";
    iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    iframe.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
    iframe.setAttribute("allowfullscreen", "");
    btn.remove();
    w.appendChild(iframe);
  }

  container.addEventListener("click", function (ev) {
    if (!ev.target.closest(".yt-facade")) return;
    var w = ev.target.closest(".hero-video");
    if (!w) return;
    var center = container.querySelector(".hero-video-center");
    if (w !== center) {
      var pos = POS.filter(function (c) { return w.classList.contains(c); })[0];
      w.classList.remove(pos);
      w.classList.add("hero-video-center");
      center.classList.remove("hero-video-center");
      center.classList.add(pos);
      restoreFacade(center);
    }
    container.classList.add("hero-videos-expanded");
    play(w);
  });
})();

/* Promo banner carousel: the coupon slide rotates through the 100+
   scanned WWW-RAG sites (favicon + host from the public directory API),
   re-surfacing the coupon message every few sites. */
(function () {
  "use strict";
  var banner = document.querySelector(".promo-banner");
  // The hero social-proof line is fed by the SAME fetch, and some pages
  // (e.g. /files/) carry one without a coupon carousel — so bail only when
  // neither consumer is present, or those pages keep a hardcoded count.
  var heroProof = document.querySelector(".hero-note-proof");
  if (!banner && !heroProof) return;
  var slidesWrap = banner ? (banner.querySelector(".promo-slides") || banner) : null;
  var host = window.location.hostname;
  var isStaging = host.endsWith(".workers.dev") || host.indexOf("stage") !== -1 ||
    host === "localhost" || host === "127.0.0.1";
  var API_ORIGIN = isStaging ? "https://api.stage.divinci.app" : "https://api.divinci.app";
  var DIR_ORIGIN = isStaging ? "https://staging.divinci.ai" : "https://divinci.ai";

  fetch(API_ORIGIN + "/api/v1/www-rag-directory?limit=150", { headers: { Accept: "application/json" } })
    .then(function (res) { return res.ok ? res.json() : null; })
    .then(function (data) {
      var sites = (data && data.sites) || [];
      if (!sites.length) return;

      // The denominator is the CORPUS size, not the page size. `limit=150`
      // above caps how many slides we build; using sites.length here said
      // "1 of 150" while the directory held 1,624 — understating the corpus
      // by 10x on the highest-traffic line of the funnel. totalSites/
      // totalChunks ride along in the same response, so this costs nothing.
      // Fall back to the page size only if the API omits them.
      var totalSites = (data && typeof data.totalSites === "number" && data.totalSites > 0)
        ? data.totalSites : sites.length;
      var totalChunks = (data && typeof data.totalChunks === "number" && data.totalChunks > 0)
        ? data.totalChunks : 0;
      var fmtInt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ","); };
      var fmtCompact = function (n) {
        if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
        if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
        if (n >= 1e3) return Math.round(n / 1e3) + "K";
        return String(n);
      };

      // slides[0] is the coupon slide the carousel always returns to. Pages
      // that ship a different promo banner (e.g. /files/, whose banner is a
      // single static cross-link) have no [data-promo-coupon], and every tick
      // would then throw on `prev.classList` — once per 3.8s, forever. Those
      // pages just keep whatever slide they rendered.
      // Replace the hardcoded "100+" / "300+" token with the live corpus size,
      // rounded DOWN to the nearest 100 so the claim stays conservative and
      // does not churn on every crawl. Regex-on-the-number rather than a
      // rewritten sentence: the same line exists in 13 locales and in two
      // different phrasings, and this preserves all of them (and any future
      // translation) while touching one file.
      if (heroProof && totalSites >= 100) {
        var rounded = Math.floor(totalSites / 100) * 100;
        heroProof.textContent = heroProof.textContent.replace(
          /\d[\d,]*\+/, fmtInt(rounded) + "+");
      }

      if (!banner) return;
      var couponSlide = banner.querySelector("[data-promo-coupon]");
      if (!couponSlide) return;
      var slides = [couponSlide];
      sites.forEach(function (site, i) {
        var slide = document.createElement("a");
        slide.className = "promo-slide";
        slide.href = DIR_ORIGIN + "/www-rag/?q=" + encodeURIComponent(site.host);
        if (site.faviconUrl) {
          var img = document.createElement("img");
          img.className = "promo-site-icon";
          img.src = site.faviconUrl;
          img.alt = "";
          img.loading = "lazy";
          slide.appendChild(img);
        }
        var label = document.createElement("span");
        label.textContent = site.host + " is already an AI — " + (i + 1) + " of " +
          fmtInt(totalSites) + " scanned sites" +
          (totalChunks ? " · " + fmtCompact(totalChunks) + " searchable chunks" : "");
        slide.appendChild(label);
        slidesWrap.appendChild(slide);
        slides.push(slide);
      });

      // A LIVE slide fed by the crawler's own activity feed (divinci.ai,
      // `access-control-allow-origin: *`, ~10s cache). The site slides above
      // describe the corpus as it stands; this one shows it growing. Appended
      // to slides[] so the existing rotation picks it up with no other change.
      // Entirely best-effort: any failure leaves the carousel exactly as it
      // was, which is why nothing below is awaited or retried.
      var liveSlide = null;
      var renderLive = function (a) {
        if (!a || a.stale || a.state !== "crawling") return;
        var host = (a.inFlight && a.inFlight[0]) || "";
        // ⚠️ NOT "done of seeds sites this pass" — see the long note in
        // site/public/js/www-rag-live.js. That phrasing shipped as
        // "5,509 of 5,509 sites this pass": both numbers were truncated at the
        // worker's listing cap, the two sets are disjoint (done is a tombstone
        // set, not a subset of the queue), and there is no pass. This banner
        // carried a vendored COPY of the same line, so it had the same bug.
        var recent = typeof a.sitesThisPass === "number" ? a.sitesThisPass : null;
        var text = host ? "Crawling " + host + " right now" : "Crawling the open web right now";
        if (recent) text += " — " + fmtInt(recent) + " sites in the last 24h";
        if (!liveSlide) {
          liveSlide = document.createElement("a");
          liveSlide.className = "promo-slide";
          liveSlide.href = DIR_ORIGIN + "/www-rag/";
          slidesWrap.appendChild(liveSlide);
          slides.push(liveSlide);
        }
        liveSlide.textContent = text;
      };
      var pollLive = function () {
        fetch(DIR_ORIGIN + "/api/www-rag/activity", { headers: { Accept: "application/json" } })
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(renderLive)
          .catch(function () { /* keep whatever the slide last showed */ });
      };
      pollLive();
      setInterval(pollLive, 30000);

      var current = 0;   // index into slides[] of the visible slide
      var siteIdx = 0;   // next site slide to show (1-based into slides[])
      var tick = 0;
      setInterval(function () {
        tick++;
        var prev = slides[current];
        // Every 7th tick re-surface the coupon; otherwise advance through
        // the full site list in order, wrapping.
        if (tick % 7 === 0) {
          current = 0;
        } else {
          siteIdx = (siteIdx % (slides.length - 1)) + 1;
          current = siteIdx;
        }
        var next = slides[current];
        if (next === prev) return;
        prev.classList.remove("promo-slide-active");
        prev.classList.add("promo-slide-leaving");
        setTimeout(function () { prev.classList.remove("promo-slide-leaving"); }, 500);
        next.classList.add("promo-slide-active");
      }, 3800);
    })
    .catch(function () { /* banner stays on the coupon slide */ });
})();

/* Hero cursor orb — reveals the ambient artwork under the pointer.
   Self-contained and independent of the funnel wiring above: it runs on all
   three funnels, which share one .hero-bg. */
(function () {
  "use strict";

  var bg = document.querySelector(".hero-bg");
  if (!bg || !window.matchMedia) return;

  /* ⚠️ Feature-detect the mask BEFORE enabling anything. .hero-bg::after is a
     full copy of the painting; the radial mask is the only thing making it a
     circle. On a browser without mask-image, setting --orb-o to 1 would lay the
     whole unmasked painting over the hero and bury the headline. Fail to the
     plain hero, never to the broken one. */
  var masks =
    window.CSS && CSS.supports &&
    (CSS.supports("mask-image", "radial-gradient(#000, transparent)") ||
      CSS.supports("-webkit-mask-image", "radial-gradient(#000, transparent)"));
  if (!masks) return;

  // Decorative motion, and there is no cursor to follow on a touch screen.
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  var cx = 0, cy = 0, seen = false, queued = false;

  function paint() {
    queued = false;
    // One rect read per frame, never per event: pointermove fires far faster
    // than the display refreshes, so the rAF gate is what keeps this cheap.
    var r = bg.getBoundingClientRect();
    if (cy < r.top || cy > r.bottom) {
      // Below the artwork band (usually: scrolled into the page body). Fade
      // out rather than pinning the orb to the last edge it saw.
      bg.style.setProperty("--orb-o", "0");
      return;
    }
    bg.style.setProperty("--orb-x", (cx - r.left) + "px");
    bg.style.setProperty("--orb-y", (cy - r.top) + "px");
    bg.style.setProperty("--orb-o", "1");
  }

  function queue() {
    if (!queued) { queued = true; requestAnimationFrame(paint); }
  }

  window.addEventListener("pointermove", function (e) {
    // A pen or a touch contact reports coordinates too; only a mouse hovers.
    if (e.pointerType && e.pointerType !== "mouse") return;
    cx = e.clientX; cy = e.clientY; seen = true;
    queue();
  }, { passive: true });

  /* Scrolling moves the artwork under a stationary cursor, so the orb has to
     re-resolve even with no pointer event. Guarded on `seen` so a page that is
     scrolled before the mouse ever moves does not flash an orb at (0,0). */
  window.addEventListener("scroll", function () { if (seen) queue(); }, { passive: true });

  function hide() { bg.style.setProperty("--orb-o", "0"); }
  document.documentElement.addEventListener("mouseleave", hide);
  window.addEventListener("blur", hide);
})();
