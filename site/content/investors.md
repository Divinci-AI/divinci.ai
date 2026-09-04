+++
title = "Investor data room"
description = "Confidential investor data room for Divinci AI, shared by direct link. Not indexed."
template = "investors.html"

[extra]
hide_breadcrumbs = true
noindex = true
+++

<!--
  /investors is served OPEN on divinci.ai (the Cloudflare Access application that gated it
  was removed 2026-09-04 at the founders' request). It is noindex, and the worker 404s the
  prefix on staging/dev so only the canonical copy exists. If it ever needs gating again,
  recreate the Access application (self-hosted, domain divinci.ai/investors) and restore the
  Cf-Access-Jwt-Assertion check in src/worker.js (see git history, commit 5e3f0e5).

  The page body is the investors.html template; the supporting documents live
  in static/investors/docs/ so they share the path prefix.
-->
