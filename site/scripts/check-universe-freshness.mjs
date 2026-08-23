#!/usr/bin/env node
/**
 * Refuse to build a site whose RAG-Universe figures are ancient.
 *
 * The poster caption carries its capture DATE, so an old poster is merely old —
 * it says so. The unfurl card's figures strip does not: it states "N sites ·
 * N links · N semantic ties" with no date at all, and that line is what every
 * share of /www-rag/ carries. A six-month-old strip is not stale, it is wrong,
 * and nothing on the card admits it.
 *
 * So freshness is checked where it can still matter — at BUILD time, which is
 * the only moment the card can still be corrected before people see it. This
 * runs in the wrangler build command for every environment. It needs no
 * network: it compares a committed date against today.
 *
 * WARN_DAYS is a nudge. STALE_DAYS stops the build, because a warning printed
 * into a build log during a deploy is a warning nobody reads.
 *
 *     npm run refresh:universe     # the fix, one command
 *     UNIVERSE_FRESHNESS=off       # the escape hatch, for an urgent deploy
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const FIGURES = join(HERE, "og-assets", "figures.json");

const WARN_DAYS = 30;
const STALE_DAYS = 45;

if (process.env.UNIVERSE_FRESHNESS === "off") {
  console.log("universe-freshness: SKIPPED (UNIVERSE_FRESHNESS=off)");
  process.exit(0);
}

let figures;
try {
  figures = JSON.parse(await readFile(FIGURES, "utf8"));
} catch (err) {
  // Unreadable is not the same as stale, and a build that cannot measure
  // something must not decide it is broken. Say so and continue.
  console.warn(`universe-freshness: cannot read figures.json (${err.message}) — not checking`);
  process.exit(0);
}

const capturedAt = figures["www-rag"]?.capturedAt;
if (!capturedAt) {
  console.warn("universe-freshness: no www-rag capture date — not checking");
  process.exit(0);
}

const days = Math.floor((Date.now() - Date.parse(`${capturedAt}T12:00:00Z`)) / 86400000);
if (!Number.isFinite(days)) {
  console.warn(`universe-freshness: unparseable capture date ${capturedAt} — not checking`);
  process.exit(0);
}

const line = figures["www-rag"].line;

if (days >= STALE_DAYS) {
  console.error(
    `\nuniverse-freshness: the /www-rag/ unfurl card claims "${line}"\n` +
    `  and that figure was captured ${days} days ago (${capturedAt}).\n` +
    `  The card shows no date, so it does not read as old — it reads as current.\n\n` +
    `  Fix:  npm run refresh:universe\n` +
    `  Skip: UNIVERSE_FRESHNESS=off (urgent deploys only)\n`,
  );
  process.exit(1);
}

if (days >= WARN_DAYS) {
  console.warn(
    `universe-freshness: figures are ${days} days old (${capturedAt}) — ` +
    `run \`npm run refresh:universe\` before this hits ${STALE_DAYS}`,
  );
} else {
  console.log(`universe-freshness: ${days} day(s) old — ok`);
}
