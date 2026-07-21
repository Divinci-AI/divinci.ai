#!/usr/bin/env node
/**
 * Guard for assets whose URLs are pinned by EXTERNAL systems and therefore
 * must exist in public/ forever (or until the external reference is updated).
 *
 * Broke once (2026-07-20): the apex cutover to this worker dropped
 * /images/divinci_logo.png, which prod Auth0's Universal Login branding
 * (logo_url + tenant picture_url, set 2026-06-09) still referenced. The SPA
 * fallback served index.html with HTTP 200, so nothing obvious failed —
 * the login page just showed a broken logo.
 *
 * Modes:
 *   node check-pinned-assets.mjs          # local: files exist in public/
 *   node check-pinned-assets.mjs --live   # also verify live URLs serve the
 *                                         # right content-type (not the SPA
 *                                         # fallback's text/html)
 */
import { statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const PINNED_ASSETS = [
  {
    path: "images/divinci_logo.png",
    contentType: "image/png",
    pinnedBy: "prod Auth0 branding logo_url + tenant picture_url (divinci-prod.us.auth0.com)",
  },
];

const publicDir = join(dirname(fileURLToPath(import.meta.url)), "public");
const live = process.argv.includes("--live");
let failed = false;

for (const asset of PINNED_ASSETS) {
  const localPath = join(publicDir, asset.path);
  try {
    const st = statSync(localPath);
    if (st.size === 0) throw new Error("empty file");
    console.warn(`✓ public/${asset.path} (${st.size} bytes)`);
  } catch {
    failed = true;
    console.error(`✗ MISSING public/${asset.path} — pinned by: ${asset.pinnedBy}`);
  }
}

if (live) {
  for (const asset of PINNED_ASSETS) {
    const url = `https://divinci.app/${asset.path}`;
    const res = await fetch(url, { headers: { "cache-control": "no-cache" } });
    const ct = res.headers.get("content-type") ?? "";
    // The SPA fallback returns 200 text/html for missing files, so the
    // content-type check is the one that matters — status alone lies.
    if (!res.ok || !ct.startsWith(asset.contentType)) {
      failed = true;
      console.error(`✗ LIVE ${url} → ${res.status} ${ct} (expected ${asset.contentType}) — pinned by: ${asset.pinnedBy}`);
    } else {
      console.warn(`✓ LIVE ${url} → ${res.status} ${ct}`);
    }
  }
}

if (failed) {
  console.error("\nPinned-asset check FAILED. Do not deploy until fixed.");
  process.exit(1);
}
