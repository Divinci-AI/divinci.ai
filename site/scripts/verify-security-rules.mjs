#!/usr/bin/env node
/**
 * Operational guard: are the divinci.ai zone's custom WAF rules still
 * present, Active, and unchanged from deploy/cloudflare/security-rules.json?
 *
 * Run on demand or on a schedule from a laptop — this is NOT wired into CI,
 * on purpose, for the same reason the `server` repo's WAF guards are
 * laptop-run: it needs a Cloudflare credential scoped to read this zone's
 * custom firewall ruleset, and that credential should not live in a GitHub
 * secret for a public repo's CI.
 *
 * ⚠️ REQUIRES a Cloudflare API token with "Zone WAF" Read (or Edit) on the
 * divinci.ai zone, in $CLOUDFLARE_API_TOKEN. The token already provisioned
 * for this Worker (CF_ANALYTICS_TOKEN, used by customer-health.mjs and
 * traffic-concentration-collector.mjs) is Zone Analytics only — verified
 * during the 2026-09-12 incident that the same-purpose wrangler OAuth token
 * (scopes: zone:read among others, no firewall/WAF scope) 403s on
 * `/firewall/access_rules/rules`, which is why that incident's rule changes
 * were made via the dashboard through Chrome automation rather than the API.
 * This script has NOT yet been run successfully — no token with the right
 * scope has been provisioned. Provision one (Cloudflare dashboard → My
 * Profile → API Tokens → Create Token → "Zone" / "Firewall Services" /
 * "Read", scoped to the divinci.ai zone) before relying on it.
 *
 * Usage:
 *   CLOUDFLARE_API_TOKEN=... node scripts/verify-security-rules.mjs
 *
 * Exit codes: 0 clean, 1 a rule drifted from the committed definition,
 * 2 missing/misconfigured credential (never conflated with 1 — a guard that
 * cannot check is a different failure than a guard that checked and failed).
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { diffCustomRules } from '../src/security-rules-guard.mjs';

const configPath = fileURLToPath(new URL('../deploy/cloudflare/security-rules.json', import.meta.url));
const config = JSON.parse(readFileSync(configPath, 'utf8'));

async function main() {
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!token) {
    console.error('[verify-security-rules] CLOUDFLARE_API_TOKEN is not set. '
      + 'Needs Zone WAF Read on the divinci.ai zone — see this file\'s header.');
    process.exit(2);
  }

  const url = `https://api.cloudflare.com/client/v4/zones/${config.zoneTag}`
    + '/rulesets/phases/http_request_firewall_custom/entrypoint';
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    console.error(`[verify-security-rules] non-JSON response (status ${res.status}): ${text.slice(0, 200)}`);
    process.exit(2);
  }
  if (!res.ok || body.success === false) {
    console.error(`[verify-security-rules] Cloudflare API error (status ${res.status}): `
      + `${JSON.stringify(body.errors ?? body).slice(0, 300)}`);
    process.exit(2);
  }

  const liveRules = body?.result?.rules;
  if (!Array.isArray(liveRules)) {
    console.error('[verify-security-rules] unexpected response shape — no result.rules array.');
    process.exit(2);
  }

  const problems = diffCustomRules(config.rules, liveRules);
  if (problems.length === 0) {
    console.log(`[verify-security-rules] OK — all ${config.rules.length} custom rules on `
      + `${config.zone} match deploy/cloudflare/security-rules.json.`);
    process.exit(0);
  }

  console.error(`[verify-security-rules] ${problems.length} problem(s) on ${config.zone}:`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

main().catch((e) => {
  console.error('[verify-security-rules] unexpected failure:', e?.message ?? e);
  process.exit(2);
});
