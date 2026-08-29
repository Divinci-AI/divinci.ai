#!/usr/bin/env node
/**
 * Source-level invariants for the Playwright specs.
 *
 * Unlike check-build-invariants.mjs, which reads built HTML in public/, this
 * reads the spec sources. It runs in CI's `guards` job, not in the deploy
 * chain: spec hygiene should fail a build, not block a deploy.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const TESTS_DIR = new URL("../tests/", import.meta.url).pathname;

function jsFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) jsFiles(full, out);
    else if (name.endsWith(".js")) out.push(full);
  }
  return out;
}

const failures = [];

/**
 * 1. No spec may wait for `networkidle`.
 *
 * It cannot succeed on this site. Cloudflare Turnstile opens a blob: request
 * and holds it for the life of the page, so the network never goes idle; on a
 * CI runner the third-party scripts do the same. Every such wait burns its
 * full 30s and then fails — deterministically, not flakily. 318 of these
 * across 44 files were what kept the E2E suite from gating anything.
 *
 * This is a source check rather than a runtime one because the failure mode is
 * a TIMEOUT: a test that waits for something unreachable looks identical to a
 * slow test until the budget runs out. Use 'domcontentloaded', or better, wait
 * for the specific locator the assertion is about.
 */
function checkNoNetworkidle(file, src) {
  src.split("\n").forEach((line, i) => {
    if (/^\s*(\/\/|\*)/.test(line)) return; // the ban is explained in comments
    if (/networkidle/.test(line)) {
      failures.push({
        check: "spec-waits-for-networkidle",
        file: relative(TESTS_DIR, file),
        detail: `line ${i + 1}: ${line.trim().slice(0, 80)}`,
      });
    }
  });
}

const files = jsFiles(TESTS_DIR);
for (const file of files) checkNoNetworkidle(file, readFileSync(file, "utf8"));

if (failures.length > 0) {
  console.error(`\n✘ spec invariants: ${failures.length} violation(s) across ${files.length} files\n`);
  for (const f of failures.slice(0, 20)) console.error(`  ${f.check}  ${f.file}: ${f.detail}`);
  if (failures.length > 20) console.error(`  … and ${failures.length - 20} more`);
  console.error("");
  process.exit(1);
}

console.log(`✓ spec invariants: 1 check clean across ${files.length} spec files`);
