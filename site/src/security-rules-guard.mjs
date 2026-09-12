/**
 * Pure diff logic for scripts/verify-security-rules.mjs: does the zone's
 * LIVE custom WAF ruleset still match deploy/cloudflare/security-rules.json?
 *
 * WHY THIS EXISTS (2026-09-12). Both custom rules on the divinci.ai zone
 * (the runaway-IP block and the WordPress/PHP scanner block) exist ONLY in
 * the Cloudflare dashboard — nothing in the repo asserted they stayed there.
 * A future "cleanup" of custom rules (this zone had zero before this
 * incident, so there is no established convention protecting a rule from
 * looking like clutter) could silently remove either one with nothing
 * noticing until the next scanner shows up. Mirrors the `server` repo's
 * `verify-waf-skip-rules.sh` / `waf-scanner-block-rule.json` pattern.
 *
 * Split into a pure module (this file) and a thin live-fetching script
 * (verify-security-rules.mjs) for the same reason customer-health.mjs splits
 * fetchZone5xx from summarize(): the comparison logic is what's worth
 * testing without a network call, and it can be tested without a Cloudflare
 * credential this repo does not have provisioned yet (see that script's
 * header for the exact scope needed).
 */

/** Normalize an expression string for comparison — whitespace only, never semantics. */
function normalizeExpression(expr) {
  return String(expr ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * @param {Array<{order:number, description:string, expression:string, action:string, enabled:boolean}>} expected
 * @param {Array<{description?:string, expression?:string, action?:string, enabled?:boolean}>} live
 *   Cloudflare's `rulesets/phases/http_request_firewall_custom/entrypoint` `result.rules`.
 * @returns {Array<string>} human-readable problems; empty means the live ruleset matches.
 */
export function diffCustomRules(expected, live) {
  const problems = [];
  const liveByDescription = new Map((live ?? []).map((r) => [String(r?.description ?? ''), r]));

  for (const rule of expected ?? []) {
    const match = liveByDescription.get(rule.description);
    if (!match) {
      problems.push(`MISSING: "${rule.description}" is not present in the live custom ruleset at all.`);
      continue;
    }
    if (match.enabled !== true) {
      problems.push(`DISABLED: "${rule.description}" exists but enabled=${match.enabled}.`);
    }
    if (String(match.action ?? '').toLowerCase() !== rule.action.toLowerCase()) {
      problems.push(`ACTION CHANGED: "${rule.description}" is action="${match.action}", expected "${rule.action}".`);
    }
    if (normalizeExpression(match.expression) !== normalizeExpression(rule.expression)) {
      problems.push(`EXPRESSION CHANGED: "${rule.description}" expression no longer matches the committed one.\n`
        + `  expected: ${normalizeExpression(rule.expression)}\n`
        + `  live:     ${normalizeExpression(match.expression)}`);
    }
  }
  return problems;
}
