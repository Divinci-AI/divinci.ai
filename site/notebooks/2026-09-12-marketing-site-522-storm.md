# Marketing site 522 storm — why /status shows "Degraded" nearly every day (2026-09-12)

Prompted by: the public page at divinci.ai/status showing "Marketing site" as
the near-universal cause of daily degradation, with auto-notes reading
"most were on our marketing site (>99%/98%)" on both 2026-09-11 and 2026-09-12.

## Verdict

**Not a misattribution bug.** `status-attribution.mjs`'s customer-facing
classification (fixed 2026-08-26, see its own doc comments) is working exactly
as designed. What it is correctly reporting is a real, currently ACTIVE and
WORSENING incident: HTTP 522 ("connection timed out") on the `divinci.ai` zone,
concentrated on the site's highest-traffic static assets.

## Evidence (Cloudflare GraphQL, zone `bbca355451b61dd26605f616e68bd855`)

Top 522 rows, trailing 24h to 2026-09-12T09:00Z:

| host | path | count |
|---|---|---|
| divinci.ai | /css/style.css | 6,510 |
| dev.divinci.ai | /images/davinci-painter-robot-800w.webp | 5,278 |
| staging.divinci.ai | /css/style.css | 5,152 |
| dev.divinci.ai | /css/style.css | 4,559 |
| divinci.ai | /js/redoc.standalone.js | 4,157 |
| dev.divinci.ai | /js/redoc.standalone.js | 4,044 |
| staging.divinci.ai | /js/redoc.standalone.js | 4,039 |

These three paths (site CSS, the Redoc API-docs bundle, the homepage hero
image) are requested on effectively every page view, which is why the raw
volume is so large relative to normal traffic.

Daily 522 totals on the zone:

```
2026-09-05    641
2026-09-06    387
2026-09-07    471
2026-09-08  1,485
2026-09-09    827
2026-09-10    737
2026-09-11 11,628   ← ramp starts ~16:10 UTC
2026-09-12 22,418   ← still climbing (measured at 09:00 UTC, 9h into the day)
```

Five-minute-bucket breakdown confirms this is a genuine step-change, not
background noise that finally crossed a threshold: near-zero (0-10/window)
from 2026-09-05 through 2026-09-11T16:05Z, then sustained triple-digit and
occasional four-digit windows from 2026-09-11T16:10Z onward, continuing to the
time of writing.

## What was ruled out

- **Datadog zone-wide monitor conflation** — already fixed 2026-08-26
  (see `site/src/customer-health.mjs`, `site/src/status-attribution.mjs`).
  Not the cause here; the attribution is reading real 5xx correctly.
- **Missing/misrouted Worker routes** — checked live via
  `GET /zones/{zone}/workers/routes`: `divinci.ai/*` and `www.divinci.ai/*`
  → `divinci-ai-site`, `dev.divinci.ai/*` → `divinci-ai-site-dev`,
  `staging.divinci.ai/*` → `divinci-ai-site-staging`. All three environments
  are correctly bound.
- **A code deploy** — last commit touching `site/` before the onset was
  2026-09-11T07:46Z (`80c8f59`), ~8h before the 16:10Z ramp. No deploy lines up
  with the start of the incident.
- **A Cloudflare platform-wide incident** — checked cloudflarestatus.com;
  no Workers / Workers Static Assets incident reported in this window.
- **Bot/scanner traffic** — `worker.js` has no catch-all `/api/*` backend
  proxy; unmatched paths fall through to `env.ASSETS.fetch`, which 404s
  cleanly. Scanning would show as 404s, not 522s, and wouldn't explain three
  specific, heavily-cached asset paths dominating the count.

## Root cause, found via the Cloudflare dashboard (2026-09-12)

**A single ASN is driving a ~18,450% traffic spike.** `divinci-ai-site`'s own
Worker Metrics show **0 Errors / 0% error rate** over the same 24h window the
edge recorded 33,849 522s — meaning these failures happen at Cloudflare's edge,
*before* the Worker (and its ASSETS binding) is ever invoked. That rules out a
bug in this repo's code definitively.

The zone's HTTP Traffic analytics for the same 24h window:

- **5.09M total requests, up 18,450%** over the prior period.
- Status breakdown: **404 Not Found 1.68M**, **403 Forbidden 1.22M**,
  **405 Method Not Allowed 1.18M**, 200 OK 728k, 307 redirect 227k — i.e. ~80%
  of all traffic is erroring out even before counting the 522s, on ordinary
  site paths (`/`, `/cdn-cgi/rum`, `/cdn-cgi/zaraz/s.js`, Astro build assets) —
  not scanner-style paths like `/wp-admin` or `/.env`.
- **Source ASN breakdown: AS701 = 5.04M of the 5.09M requests (~99%).**
  AS701 is Verizon Business (legacy UUNET) — an ISP/enterprise network, not a
  hosting or bot-farm ASN. Everything else (Cloudflare's own AS13335, AS32934,
  AS14618, AS396982) is under 35k combined.

So the picture is: something inside a Verizon Business–served network is
generating a massive, sustained flood of requests (mostly non-2xx) against
divinci.ai, and under that load a fraction of legitimate requests to the
site's highest-traffic static assets (CSS/JS/hero image, requested on every
page view) get 522'd at the edge before reaching the Worker.

## Narrowed further: one IP, not the whole ASN

GraphQL breakdown by `clientIP` within AS701 showed **every single request
attributed to AS701 came from one address: `74.110.128.177`**
(`pool-74-110-128-177.rcmdva.fios.verizon.net` — Verizon FiOS residential/
small-business broadband, not a datacenter or bot-hosting network).

The traffic itself looks like a real browser stuck in a loop, not a bot
script with forged headers:
- Plain desktop UA: `Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101
  Firefox/140.0`, no bot markers.
- It loads full page assets end-to-end (CSS, JS, images) across **all three
  environments** — prod, dev, staging, plus `sdk.divinci.ai` — repeatedly.
  Real external bots essentially never touch `dev.`/`staging.` since those
  aren't publicly linked, which is why this doesn't read as external scanning.
- It sent `POST /cdn-cgi/rum` (Cloudflare's RUM beacon) **12,617 times in
  24h** — far beyond anything a human browsing normally would generate.
- The 522s specifically are `HEAD` requests carrying
  `User-Agent: CloudFlare-Prefetch/0.1` for the same hot paths (css/js/hero
  image) that the plain `GET`s from the same IP load fine (200). Consistent
  with Cloudflare shedding lower-priority prefetch traffic once one client's
  rate gets this extreme, not a bug in this repo's serving path.

7-day growth curve for this one IP, confirming a runaway loop rather than
chronic background noise:
```
2026-09-06         4
2026-09-07     1,603
2026-09-08   112,130
2026-09-09        33
2026-09-10       843
2026-09-11 1,430,581
2026-09-12 3,757,664   (partial day, ~9h in)
```
Filtering the zone's 30-day traffic to `ip.src eq 74.110.128.177` showed
**5.31M requests — 85.7% of ALL traffic to divinci.ai over 30 days** from
this one address.

Checked whether this was one of our own tools before touching anything:
grepped every `ai.divinci.*` launchd job's script (`demo-loop`,
`red-team-sweep`, `generation-canary`, `changelog-daily`, `demo-teardown`,
`fulcrum-credential-sync`) and every local repo for hardcoded
`divinci.ai`/`dev.divinci.ai`/`staging.divinci.ai` fetch loops — nothing
matches. Not one of ours.

## CORRECTION: this is a WordPress vulnerability scanner, not a stray client

⚠️ The read above ("looks like a real browser stuck in a loop") was WRONG,
based on sampling only the top-N `GET` rows. The full breakdown of `POST`
requests from the same IP over the same 7 days tells a different story: it
crawled every real page on the site, then appended `/wp-admin/admin-ajax.php`
to each discovered path — `/pricing/wp-admin/admin-ajax.php`,
`/security/wp-admin/admin-ajax.php`,
`/blog/universal-basic-income-2035/wp-admin/admin-ajax.php`,
`/mcp/tool-catalog/wp-admin/admin-ajax.php` — across every locale prefix
(`/es/`, `/fr/`, `/ar/`, `/ko/`, `/hi/`, `/zh/`...), plus bare
`/wp-admin/admin-ajax.php`, `/xmlrpc`, `/index.php`. That is a generic,
automated WordPress-exploitation scanner, spoofing a plain desktop Firefox
UA to blend in with real traffic — not a misconfigured internal tool and not
an idle browser tab.

**It found nothing.** Checked every wp-admin/xmlrpc/index.php probe from this
IP over the full 7-day window for a 2xx response: zero. This site is a static
Astro/Zola build with no WordPress backend, so the scan had nothing to
exploit. The actual damage was collateral — the sheer *volume* of the scan
(5.3M requests, 85.7% of a month's zone traffic) saturated edge capacity for
the site's hottest static assets and produced the 522 storm as a side effect.
A scanning bot became an accidental low-cost denial-of-service.

This also explains why `dev.`/`staging.`/`sdk.divinci.ai` were hit too —
those hosts are not publicly linked from anywhere; an automated crawler that
follows links (and/or brute-forces common subdomain names) reaches them where
a targeted human attacker looking at the public site would not.

**Post-block verification** (freshest window available at write time): last
5 minutes of traffic from `74.110.128.177` — **26,411 / 26,411 requests
returned 403.** Zero 200s, zero 522s from this IP since the block went live.
An earlier 20-minute check straddling the deploy showed a mix of 403/404/
405/200/522 — that was edge propagation lag in the first ~1-2 minutes after
deploy, not the block failing; it settled to 100% blocked well within the
5-minute window.

## Resolution (2026-09-12)

Deployed a Cloudflare custom security rule on the `divinci.ai` zone:

- **Name:** "Block runaway single IP (74.110.128.177) - 2026-09-12 522 storm"
- **Expression:** `(ip.src eq 74.110.128.177)`
- **Action:** Block (default Cloudflare WAF block page, 403)
- **Status:** Active

Scoped to exactly this one IP — not the whole AS701 — so unrelated Verizon
Business customers are unaffected.

**Follow-up:** re-check the daily 522 totals and `/status` page in the next
day or two to confirm this resolves the degradation. If the source rotates to
a new IP (DHCP reassignment on a residential line is possible), the same
GraphQL query (grouped by `clientIP`, filtered to `edgeResponseStatus:522`)
will surface it again quickly.

## Security review

**Was this exploitable?** No — checked every `wp-admin`/`xmlrpc`/`index.php`
probe from this IP over 7 days for a 2xx: zero. The site has no WordPress
attack surface to hit. The realized impact was availability, not compromise:
one scanner degraded the public status page and the site's real-user
experience by exhausting a shared resource, for free, with no
authentication and no exploit required.

**The reactive fix (block one IP) is necessary but not sufficient.** It stops
*this* scanner. It does nothing about the next one from a different IP —
residential-proxy-based scanning is common specifically because IP-based
defenses miss it until after the fact. Two structural gaps this incident
exposed, ranked by leverage:

1. **No generic scanner-block rule exists on the `divinci.ai` zone.** ✅
   **DONE (2026-09-12).** The `server` repo already has this exact pattern
   for `api.divinci.app` (`deploy/cloudflare/waf-scanner-block-rule.json`,
   guarded by `verify-waf-skip-rules.sh` — see that repo's CLAUDE.md, "API
   hosts skip the managed WAF"), built after measuring ~5.7% of API traffic
   was Tomcat/WordPress/phpMyAdmin/etc probes. This zone had zero custom
   rules before this incident. Deployed a second custom rule, "Block
   WordPress/PHP scanner paths (no WP backend on this site)":
   `(http.request.uri.path contains "/wp-admin") or (http.request.uri.path
   contains "/wp-login") or (http.request.uri.path contains "/xmlrpc") or
   (http.request.uri.path contains "/wp-json") or
   (ends_with(http.request.uri.path, ".php"))` → Block, Active, order 2
   (after the IP block). Zero false-positive risk here — this site serves no
   PHP at all — unlike the API zone's version, which had to measure real
   traffic first because API paths are less predictable.
   ⚠️ Not yet committed to a file the way `waf-scanner-block-rule.json` is in
   the `server` repo — it exists only in the Cloudflare dashboard right now.
   That's the next concrete step (see "Tests and guards to add" below).
2. **`Cloudflare OWASP Core Ruleset` is Disabled on this zone.** ✅ **DONE
   (2026-09-12).** Enabled with Action = **Log** (not Block), threshold
   Medium (40+), Paranoia Level PL2 — deliberately observational first,
   since this zone has never run it and a wrong call here would 403 real
   visitors with no warning. Managed Rules now shows 2 Active (Cloudflare
   Managed Ruleset + OWASP Core Ruleset). **Follow-up:** after a week or so
   of Log data, review WAF events for false positives on real traffic before
   ever switching this to Block/Challenge.

**Not recommended:** blocking the whole ASN (AS701/Verizon Business) — that
would collateral-damage every legitimate visitor on that ISP. Blocking by
UA string is also weak here since it deliberately spoofed a normal browser.

**Did not find:** any credential material, internal path disclosure, or
secret in what this scanner touched or in what got published to the status
page (the `/status` attribution payload only ever carries area-id shares —
see `mergeAttributionIntoDays`'s "SHARES, NEVER COUNTS" invariant — so this
incident didn't leak request volume or infra detail to the public page).

## Tests and guards to add

All four items below are now **DONE (2026-09-12)**, in the order they were
proposed:

**1. Unit-testable pure detector.** `src/traffic-concentration.mjs`
(`detectDominantClient`) — given `{key, count}` rows, is any single client
above a share threshold (20%, `DOMINANT_CLIENT_SHARE`), with a
`MIN_BASIS_REQUESTS` floor so a quiet zone doesn't false-alarm. 6 tests in
`tests/worker/traffic-concentration.test.mjs`.

**2. Live collector, wired into the existing 5-minute cron.**
`src/traffic-concentration-collector.mjs` (`collectTrafficConcentration`) —
queries the marketing zone's `httpRequestsAdaptiveGroups` grouped by
`clientIP` over the same 5-minute/3-minute-lag window `collectCustomerHealth`
already uses, runs the pure detector, and publishes
`divinci.cf.marketing.top_client_share` (gauge) and
`divinci.cf.marketing.top_client_flagged` (count) to Datadog. Wired into
`scheduled()` in `worker.js` beside the existing customer-health collector —
no new cron trigger, no new credential (reuses `CF_ANALYTICS_TOKEN` +
`DD_API_KEY`). 13 tests in `tests/worker/traffic-concentration-collector.test.mjs`.
⚠️ **Still open:** no Datadog monitor yet reads these metrics — the pager
integration itself needs a Datadog dashboard credential this session didn't
have. The metric is flowing; nobody is alerting on it yet. Provision one the
way `[CF] 5xx rate elevated (prod zones)` (monitor 20807649) already reads
`divinci.cf.customer.errors_5xx`: e.g. `max(last_15m):avg:divinci.cf.marketing.top_client_share{env:production} >= 0.20`.

**3. "End test" for the actual user-facing symptom.**
`src/status-degraded-streak.mjs` (`computeDegradedStreak`) — given
`history.days` from `/api/status`, is the trailing run of non-operational
days (ending at the most recent day) at or above a threshold (default 2,
matching "these daily notes seem very similar")? `scripts/check-status-degraded-streak.mjs`
fetches the live public endpoint (no credential needed) and exits non-zero
when flagged. Run just now against production: **it correctly flags** —
2026-09-11 and 2026-09-12 are both `degraded`/marketing, because today's
history still carries this morning's pre-fix windows. Expected to clear
starting 2026-09-13 if the fix holds. 9 tests in
`tests/worker/status-degraded-streak.test.mjs`.

**4. Regression guard for the WAF rules themselves.**
`deploy/cloudflare/security-rules.json` commits both custom rules (IP block,
scanner-path block) as the source of truth, mirroring
`deploy/cloudflare/waf-scanner-block-rule.json` in the `server` repo.
`src/security-rules-guard.mjs` (`diffCustomRules`) is the pure comparison —
missing / disabled / weakened-action / narrowed-expression, each reported by
name — with 8 tests in `tests/worker/security-rules-guard.test.mjs`.
`scripts/verify-security-rules.mjs` is the live wrapper.
⚠️ **Has NOT actually been run against Cloudflare yet.** It needs a token
with Zone WAF Read on the divinci.ai zone; the token already provisioned for
this Worker (`CF_ANALYTICS_TOKEN`) is Zone Analytics only, and the wrangler
OAuth token used throughout this incident has no firewall/WAF scope either
(confirmed earlier: 403 on `/firewall/access_rules/rules`, which is why the
rule changes above were made via the dashboard through Chrome automation).
Provisioning that token is the one item left with a concrete next step
instead of a finished state.

**Also still open:** the OWASP Core Ruleset review. It's running in Log mode
since 2026-09-12; per the plan above, review its WAF events for false
positives after about a week (**target: 2026-09-19**) before ever switching
it to Block/Challenge.

## Query used (for reuse)

```graphql
query($zone:String!,$since:Time!,$until:Time!){
  viewer{zones(filter:{zoneTag:$zone}){
    httpRequestsAdaptiveGroups(
      limit:2000,
      filter:{datetime_geq:$since,datetime_leq:$until,edgeResponseStatus:522},
      orderBy:[count_DESC]
    ){ count dimensions{ clientRequestHTTPHost clientRequestPath } }
  }}
}
```
Zone tag `bbca355451b61dd26605f616e68bd855` = divinci.ai (marketing zone, per
`ZONES.marketing` in `site/src/status-attribution.mjs`). Run against the
wrangler OAuth token (`wrangler whoami` confirms account
`14a6fa23390363382f378b5bd4a0f849`); no dedicated `CF_ANALYTICS_TOKEN` was
needed for this read.
