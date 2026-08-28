/**
 * Click-to-play facade for an embedded video.
 *
 * The page renders a poster and a play button; nothing is requested from the
 * video host — and no cookie is set — until the visitor asks for it. On a page
 * arguing that you should be able to prove what a system does with data, an
 * iframe that phones home on page load is the wrong default.
 *
 * External rather than inline so the site's CSP does not need `unsafe-inline`
 * on our account. It already carries it for other reasons; this is one fewer
 * thing standing in the way of removing it.
 */
(function () {
  "use strict";

  var frame = document.getElementById("compliance-video-frame");
  if (!frame) return;

  var btn = frame.querySelector(".compliance-video-play");
  if (!btn || !frame.dataset.embed) return;

  btn.addEventListener("click", function () {
    if (frame.classList.contains("is-playing")) return;

    // Built inside the click handler, not after an animation: a cross-origin
    // iframe only inherits the user gesture if it is created during the
    // activation window. Created later, YouTube refuses to autoplay and sits
    // on a spinner.
    var iframe = document.createElement("iframe");
    iframe.src = frame.dataset.embed;
    iframe.title = btn.getAttribute("aria-label") || "Video";
    // Deliberately the same grant the home hero makes, and no wider.
    iframe.allow = "autoplay; encrypted-media; picture-in-picture";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    frame.appendChild(iframe);
    frame.classList.add("is-playing");
    iframe.focus();
  });
})();
