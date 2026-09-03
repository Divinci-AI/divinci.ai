+++
title = "Investor data room"
description = "Confidential investor data room for Divinci AI. Access is granted per email through Cloudflare Access."
template = "investors.html"

[extra]
hide_breadcrumbs = true
noindex = true
+++

<!--
  /investors is an ACCESS-GATED path. The gate is a Cloudflare Access
  application ("Divinci investor data room", self-hosted, domain
  divinci.ai/investors) in the Zero Trust dashboard, not anything in this
  repo. If that application is ever deleted, this page and everything under
  /investors/docs/ become public the moment the next deploy lands. Check
  Zero Trust → Access → Applications before deploying changes here.

  The page body is the investors.html template; the supporting documents live
  in static/investors/docs/ so they share the protected path prefix.
-->
