/**
 * Shared fixture for the public WWW-RAG directory API
 * (https://api.divinci.app/api/v1/www-rag-directory).
 *
 * The payload itself lives in www-rag-directory.json so that BOTH sides of the
 * page can be tested against one source of truth: the jsdom/Playwright suites
 * load it through this module, and scripts/test_build_open_web_vectors_data.py
 * reads the same file. The initiative page's figures are derived twice — once
 * in Python at build time for the HTML, once in JS at runtime for the live
 * refresh — and the two must agree exactly. Pinning both suites to one fixture
 * is what makes a drift between them fail a test instead of shipping two
 * different numbers for the same corpus.
 *
 * Every row in it earns its place by being awkward in a specific way:
 *
 *   gamma.edu             chunkCount / totalBytes null — "unmeasured", which
 *                         must never sort or export as zero
 *   delta.com             no releaseId — not chat-enabled
 *   beta.org              claimed by its owner
 *   theta.example.museum  a TLD with no filter option of its own
 *   evil.com              title + description carrying HTML
 *   sheet.org             a description that Excel would run as a formula
 *   constructor           a host that collides with Object.prototype, and one
 *                         with no dot at all (no origin favicon is derivable)
 *
 * The three deepest crawls here are 3,000 / 500 / 100 pages, which floors to
 * "past 0 pages" — the case that used to produce a nonsense sentence on the
 * Open Web Vector Initiative page.
 */

const PAYLOAD = require('./www-rag-directory.json');

module.exports = { PAYLOAD, SITES: PAYLOAD.sites };
