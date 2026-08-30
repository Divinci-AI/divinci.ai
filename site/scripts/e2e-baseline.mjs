#!/usr/bin/env node
/**
 * Gate the FULL E2E suite against a baseline of known failures.
 *
 * The suite carries ~70 failures that are test ROT — specs asserting an older
 * site. Waiting for those to be fixed before gating means not gating, and the
 * 219 tests that DO pass go unguarded in the meantime. So: record what fails
 * today, and fail the build on any CHANGE to that set.
 *
 *   a failure NOT in the baseline        -> FAIL (a regression)
 *   a baseline entry that now PASSES     -> FAIL (stale; delete the line)
 *   a failure that IS in the baseline    -> tolerated
 *
 * The second rule is the one that matters. Without it the file becomes a
 * dumping ground; with it, fixing a test FORCES the baseline to shrink, so the
 * debt can only go one way. (Same discipline as pytest's xfail_strict.)
 *
 * ⚠️ THE BASELINE MUST BE GENERATED FROM CI, NEVER FROM A LAPTOP.
 * Measured 2026-08-29: eight spec files were green twice in a row locally and
 * the gate built from them went red on its first CI run — www-rag-universe
 * renders its canvas at full size and leaves it at opacity 0 on a runner. A
 * baseline generated locally would encode the wrong failure set in both
 * directions: it would tolerate failures CI does not have, and flag as
 * regressions the ones only CI sees.
 *
 * Usage:
 *   node scripts/e2e-baseline.mjs --check                 (gate; default)
 *   node scripts/e2e-baseline.mjs --update --run-url URL  (regenerate)
 *   node scripts/e2e-baseline.mjs --check --report path/to/results.json
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const BASELINE = new URL("../tests/known-failures.txt", import.meta.url).pathname;
const DEFAULT_REPORT = new URL("../playwright-results.json", import.meta.url).pathname;

/**
 * A failure is identified by project + file + full title path — NOT by
 * file:line. Adding a comment to a spec shifts every line number in it; a
 * line-keyed baseline would report the whole file as regressed. That is not
 * hypothetical: comparing two runs by file:line during this work manufactured
 * 74 phantom regressions.
 */
export function collectTests(report) {
  const out = [];
  const walk = (suite, ancestors, file) => {
    const f = suite.file || file;
    for (const spec of suite.specs || []) {
      for (const test of spec.tests || []) {
        out.push({
          id: `${test.projectName} | ${f} | ${[...ancestors, spec.title].join(" › ")}`,
          status: test.status, // expected | unexpected | flaky | skipped
        });
      }
    }
    for (const nested of suite.suites || []) {
      walk(nested, [...ancestors, nested.title], f);
    }
  };
  for (const suite of report.suites || []) walk(suite, [], suite.file);
  return out;
}

/** `flaky` means it passed on a retry. Treat it as passing, not as failing. */
const isFailing = (t) => t.status === "unexpected";

export function compare(tests, baseline) {
  const failing = new Set(tests.filter(isFailing).map((t) => t.id));
  const known = new Set(baseline);
  const seen = new Set(tests.map((t) => t.id));

  return {
    regressions: [...failing].filter((id) => !known.has(id)).sort(),
    // Only entries whose test actually RAN can be called fixed. A baseline
    // line for a test that did not run is stale in a different way — the spec
    // was renamed or removed — and is reported separately so the two are not
    // confused.
    fixed: [...known].filter((id) => seen.has(id) && !failing.has(id)).sort(),
    vanished: [...known].filter((id) => !seen.has(id)).sort(),
    failingCount: failing.size,
    totalCount: tests.length,
  };
}

export function parseBaseline(text) {
  return text.split("\n").map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

export function baselineHeaderTotal(text) {
  const m = text.match(/^#\s*total_tests:\s*(\d+)/m);
  return m ? Number(m[1]) : null;
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i === -1 ? null : argv[i + 1];
  };
  const update = argv.includes("--update");
  const reportPath = arg("--report") || DEFAULT_REPORT;

  // A missing or unparseable report is a FAILURE, never a pass. The CI step
  // that produces it is allowed to exit non-zero (the suite has known
  // failures), so a crashed or never-started run would otherwise sail through
  // this gate as "no failures found".
  if (!existsSync(reportPath)) {
    console.error(`✘ no Playwright JSON report at ${reportPath}`);
    console.error("  The suite did not run, or the json reporter is misconfigured.");
    process.exit(1);
  }
  let report;
  try {
    report = JSON.parse(readFileSync(reportPath, "utf8"));
  } catch (e) {
    console.error(`✘ could not parse ${reportPath}: ${e.message}`);
    process.exit(1);
  }

  const tests = collectTests(report);
  if (tests.length === 0) {
    console.error("✘ the report contains zero tests — collection failed.");
    process.exit(1);
  }

  if (update) {
    const runUrl = arg("--run-url") || "UNKNOWN — regenerate from a CI run";
    const failing = tests.filter(isFailing).map((t) => t.id).sort();
    const header = [
      "# Known-failure baseline for the full Desktop-Chrome E2E suite.",
      "#",
      "# Every line is a test that FAILS TODAY and is accepted for now. The gate",
      "# fails on any change to this set — a new failure, or a line here that",
      "# starts passing. Fixing a test therefore REQUIRES deleting its line, so",
      "# this file can only shrink.",
      "#",
      "# Do not add a line to silence a test you just broke. Adding one is",
      "# accepting debt, and it shows up in review as exactly that.",
      "#",
      "# ⚠️ REGENERATE FROM CI ONLY:",
      "#     node scripts/e2e-baseline.mjs --update --report <ci results.json>",
      "#   A locally-generated baseline encodes the wrong failure set in both",
      "#   directions — see the note at the top of scripts/e2e-baseline.mjs.",
      "#",
      `# generated_from: ${runUrl}`,
      `# generated_at: ${new Date().toISOString().slice(0, 10)}`,
      `# total_tests: ${tests.length}`,
      "",
    ].join("\n");
    writeFileSync(BASELINE, header + failing.join("\n") + "\n");
    console.log(`✓ baseline written: ${failing.length} known failures of ${tests.length} tests`);
    console.log(`  source: ${runUrl}`);
    return;
  }

  if (!existsSync(BASELINE)) {
    console.error(`✘ no baseline at ${BASELINE}. Generate one from a CI run first.`);
    process.exit(1);
  }
  const raw = readFileSync(BASELINE, "utf8");
  const baseline = parseBaseline(raw);
  const expectedTotal = baselineHeaderTotal(raw);
  const r = compare(tests, baseline);

  // A suite that collected far fewer tests than the baseline was built from
  // has broken collection. Without this, a config change that silently stops
  // matching most specs makes the gate PASS — coverage-shaped nothing, which
  // is the exact failure this whole exercise exists to remove.
  if (expectedTotal && r.totalCount < expectedTotal * 0.9) {
    console.error(`✘ only ${r.totalCount} tests ran; baseline was built from ${expectedTotal}.`);
    console.error("  Collection is broken — this is not a pass.");
    process.exit(1);
  }

  let bad = false;
  if (r.regressions.length) {
    bad = true;
    console.error(`\n✘ ${r.regressions.length} NEW failure(s) — not in the baseline:\n`);
    for (const id of r.regressions) console.error(`    ${id}`);
  }
  if (r.fixed.length) {
    bad = true;
    console.error(`\n✘ ${r.fixed.length} baseline entr(y/ies) now PASS — delete these lines:\n`);
    for (const id of r.fixed) console.error(`    ${id}`);
  }
  if (r.vanished.length) {
    bad = true;
    console.error(`\n✘ ${r.vanished.length} baseline entr(y/ies) name a test that did not run`);
    console.error("  (renamed or deleted spec) — update the line or remove it:\n");
    for (const id of r.vanished) console.error(`    ${id}`);
  }

  if (bad) {
    console.error(`\n  ${r.failingCount} failing / ${r.totalCount} tests; baseline holds ${baseline.length}.\n`);
    process.exit(1);
  }
  console.log(`✓ e2e baseline: ${r.failingCount} known failures of ${r.totalCount} tests, unchanged`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
