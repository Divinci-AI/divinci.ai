/**
 * Shared fixture for the public WWW-RAG directory API
 * (https://api.divinci.app/api/v1/www-rag-directory).
 *
 * Used by the jsdom unit tests and served to the browser by the Playwright
 * spec via page.route(), so both layers assert against exactly the same
 * payload — and so neither depends on the live corpus, which grows daily.
 *
 * Every row here earns its place by being awkward in a specific way:
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

const SITES = [
  {
    host: 'gamma.edu',
    title: 'gamma-edu',
    description: 'Course catalogue for gamma',
    pageCount: 20,
    fileCount: 0,
    chunkCount: null,
    totalBytes: null,
    lastCrawledAt: '2026-08-01T09:00:00.000Z',
    releaseId: 'rel-gamma',
    claimed: false,
    faviconUrl: null,
    modelCard: null,
  },
  {
    host: 'epsilon.io',
    title: 'epsilon-io',
    description: 'Engineering handbook for epsilon',
    pageCount: 3000,
    fileCount: 12,
    chunkCount: 50000,
    totalBytes: 200000000,
    lastCrawledAt: '2026-08-16T09:00:00.000Z',
    releaseId: 'rel-epsilon',
    claimed: false,
    faviconUrl: 'https://cdn.example/epsilon.png',
    modelCard: {
      languageModel: 'Gemini 2.5 Flash Lite',
      ragMemory: { fileCount: 12, totalBytes: 200000000, chunkCount: 50000, pageCount: 3000 },
      details: {
        chunkingTools: ['WWW-RAG Router'],
        documentParsers: [],
        vectorDatabase: 'Turso (libSQL)',
        embeddingModel: 'EmbeddingGemma 300M',
        createdAt: '2026-08-16T08:00:00.000Z',
        updatedAt: '2026-08-16T09:00:00.000Z',
        conversationCount: 4,
        rating: { up: 3, down: 1, percentPositive: 75 },
        fineTuned: false,
        fineTuneDatasetSize: null,
        tools: { voice: null, speechToText: null, webSearch: true, email: false, texting: false, other: [] },
      },
    },
  },
  {
    host: 'beta.org',
    title: 'beta-org',
    description: 'Field guides published by beta',
    pageCount: 100,
    fileCount: 3,
    chunkCount: 900,
    totalBytes: 1000000,
    lastCrawledAt: '2026-08-10T09:00:00.000Z',
    releaseId: 'rel-beta',
    claimed: true,
    faviconUrl: null,
    modelCard: null,
  },
  {
    host: 'alpha.gov',
    title: 'alpha-gov',
    description: 'Public filings and notices',
    pageCount: 500,
    fileCount: 0,
    chunkCount: 4000,
    totalBytes: 5000000,
    lastCrawledAt: '2026-08-12T09:00:00.000Z',
    releaseId: 'rel-alpha',
    claimed: false,
    faviconUrl: null,
    modelCard: null,
  },
  {
    host: 'delta.com',
    title: 'delta-com',
    description: 'Landing page for delta',
    pageCount: 1,
    fileCount: 0,
    chunkCount: 5,
    totalBytes: 1024,
    lastCrawledAt: '2026-07-20T09:00:00.000Z',
    releaseId: null,
    claimed: false,
    faviconUrl: null,
    modelCard: null,
  },
  {
    host: 'theta.example.museum',
    title: 'theta-example-museum',
    description: 'Collection notes',
    pageCount: 7,
    fileCount: 1,
    chunkCount: 40,
    totalBytes: 2048,
    lastCrawledAt: '2026-08-05T09:00:00.000Z',
    releaseId: 'rel-theta',
    claimed: false,
    faviconUrl: null,
    modelCard: null,
  },
  {
    host: 'evil.com',
    title: '<script>alert("title")</script>',
    description: '<img src=x onerror="alert(\'desc\')">',
    pageCount: 2,
    fileCount: 0,
    chunkCount: 10,
    totalBytes: 100,
    lastCrawledAt: '2026-08-02T09:00:00.000Z',
    releaseId: 'rel-evil',
    claimed: false,
    faviconUrl: null,
    modelCard: null,
  },
  {
    host: 'sheet.org',
    title: 'sheet-org',
    description: "=cmd|'/c calc'!A1",
    pageCount: 4,
    fileCount: 0,
    chunkCount: 20,
    totalBytes: 200,
    lastCrawledAt: '2026-08-03T09:00:00.000Z',
    releaseId: 'rel-sheet',
    claimed: false,
    faviconUrl: null,
    modelCard: null,
  },
  {
    host: 'constructor',
    title: 'constructor',
    description: 'A host that is also an Object.prototype key',
    pageCount: 0,
    fileCount: 0,
    chunkCount: null,
    totalBytes: null,
    lastCrawledAt: '2026-08-04T09:00:00.000Z',
    releaseId: 'rel-constructor',
    claimed: false,
    faviconUrl: null,
    modelCard: null,
  },
];

const PAYLOAD = {
  sites: SITES,
  totalSites: SITES.length,
  totalPages: 3634,
  totalFiles: 16,
  totalChunks: 54975,
  totalBytes: 206003372,
};

module.exports = { PAYLOAD, SITES };
