/**
 * Build-time guards for the per-page Divinci agent and for the two pages that
 * drive themselves off the public directory API.
 *
 * Why these run against `public/` rather than against source:
 *
 *   - The per-page agent config travels as JSON and prose inside <script>
 *     tags. Zola's `minify_html = true` rewrites the built HTML, and a
 *     mangled block does not throw — `readJsonConfig` swallows the parse
 *     error and silently falls back to the SITE-WIDE homepage starters. The
 *     page would look fine and answer as the wrong assistant.
 *
 *   - A blurb `selector` that matches nothing is also silent: the ambient
 *     bubble just never changes. Typos here are invisible in review and
 *     invisible in production.
 *
 *   - The widget bundle is a committed artifact. If a rebuild ever dropped
 *     the config ids, every page override would go inert with no error.
 *
 *   - The jsdom unit tests for www-rag-directory.js and open-web-vectors.js
 *     hand-roll their markup. Pinning the ids those scripts query against the
 *     real built page is what stops that copy from drifting into fiction.
 *
 * Run with: npm run test:guards   (requires a build; `zola build` first)
 */

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUBLIC = join(ROOT, 'public');

/** Ids the widget reads for per-page personality. */
const CONFIG_IDS = [
  'divinci-chat-starters',
  'divinci-chat-blurbs',
  'divinci-chat-greeting',
  'divinci-chat-speech',
  'divinci-chat-context',
];

function htmlFiles(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) htmlFiles(p, out);
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

/** Body of the <script> carrying `id`, or null. Attributes may be unquoted. */
function configBlock(html, id) {
  const re = new RegExp(
    `<script[^>]*\\sid=["']?${id}["']?[^>]*>([\\s\\S]*?)</script>`,
    'i'
  );
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

describe('per-page Divinci agent config', () => {
  let pages = [];
  before(() => {
    if (existsSync(PUBLIC)) pages = htmlFiles(PUBLIC);
  });

  test('public/ has been built', () => {
    assert.ok(existsSync(PUBLIC), 'public/ is missing — run `zola build` first');
    assert.ok(pages.length > 100, `only ${pages.length} built pages found`);
  });

  test('the committed bundle still reads every config id', () => {
    // A rebuild that dropped these would leave every page override inert,
    // with no error anywhere.
    const bundle = readFileSync(join(ROOT, 'static/js/divinci-chat.js'), 'utf8');
    for (const id of CONFIG_IDS) {
      assert.ok(
        bundle.includes(id),
        `static/js/divinci-chat.js does not reference "${id}" — the page ` +
        'overrides are dead. Re-run `npm run build:chat`.'
      );
    }
  });

  test('every starters block is valid JSON with usable prompts', () => {
    let found = 0;
    for (const file of pages) {
      const body = configBlock(readFileSync(file, 'utf8'), 'divinci-chat-starters');
      if (body === null) continue;
      found++;
      const where = relative(ROOT, file);
      let parsed;
      assert.doesNotThrow(
        () => { parsed = JSON.parse(body); },
        `${where}: divinci-chat-starters is not valid JSON in the BUILT output. ` +
        'The widget swallows this and silently serves the site-wide starters.'
      );
      assert.ok(Array.isArray(parsed) && parsed.length, `${where}: starters must be a non-empty array`);
      for (const s of parsed) {
        assert.equal(typeof s.label, 'string', `${where}: every starter needs a label`);
        assert.equal(typeof s.message, 'string', `${where}: every starter needs a message`);
        assert.ok(s.label.length <= 28, `${where}: starter label "${s.label}" will not fit the panel`);
        assert.ok(s.message.length > s.label.length, `${where}: "${s.label}" sends a message no fuller than its label`);
      }
    }
    assert.ok(found >= 2, `expected the directory and initiative pages to set starters, found ${found}`);
  });

  test('every blurb selector matches something on its own page', () => {
    let checked = 0;
    for (const file of pages) {
      const html = readFileSync(file, 'utf8');
      const body = configBlock(html, 'divinci-chat-blurbs');
      if (body === null) continue;
      const where = relative(ROOT, file);
      const blurbs = JSON.parse(body);
      const { window } = new JSDOM(html);
      for (const b of blurbs) {
        assert.equal(typeof b.blurb, 'string', `${where}: a blurb has no text`);
        let hit;
        assert.doesNotThrow(
          () => { hit = window.document.querySelector(b.selector); },
          `${where}: "${b.selector}" is not a valid CSS selector`
        );
        assert.ok(
          hit,
          `${where}: blurb selector "${b.selector}" matches nothing on the page, ` +
          'so that blurb can never be shown. (Renaming a section class is the usual cause.)'
        );
        checked++;
      }
      window.close();
    }
    assert.ok(checked >= 4, `expected several blurb selectors to check, saw ${checked}`);
  });

  test('greeting, speech and context blocks carry real prose', () => {
    for (const file of pages) {
      const html = readFileSync(file, 'utf8');
      const where = relative(ROOT, file);
      for (const id of ['divinci-chat-greeting', 'divinci-chat-speech', 'divinci-chat-context']) {
        const body = configBlock(html, id);
        if (body === null) continue;
        assert.ok(body.length > 10, `${where}: ${id} is empty or near-empty — it would fall back silently`);
        assert.ok(!body.includes('<'), `${where}: ${id} contains markup; it is rendered as text and would show the tags`);
      }
      // A page that reframes the assistant should say what it is reframing to.
      if (configBlock(html, 'divinci-chat-context') !== null) {
        assert.ok(
          configBlock(html, 'divinci-chat-greeting') !== null,
          `${where}: sets a page context but no greeting — the panel would open ` +
          'with the generic site-wide welcome over a re-pointed assistant.'
        );
      }
    }
  });

  test('the site-wide pages set no overrides at all', () => {
    // Emitting a page config from a shared template would re-point the
    // assistant on every page at once. The homepage is the canary.
    const home = readFileSync(join(PUBLIC, 'index.html'), 'utf8');
    for (const id of CONFIG_IDS) {
      assert.equal(
        configBlock(home, id), null,
        `the homepage emits ${id} — a per-page override has leaked into a shared template`
      );
    }
    assert.ok(home.includes('divinci-chat-js'), 'the homepage lost the chat widget entirely');
  });

  test('only pages that mean to override the agent do', () => {
    const overriding = pages
      .filter((f) => configBlock(readFileSync(f, 'utf8'), 'divinci-chat-context') !== null)
      .map((f) => relative(PUBLIC, f));

    // templates/www-rag.html backs every locale, so /de/www-rag/ and friends
    // carry the override too. That is correct — it is the same page — and the
    // config text is English on all of them, exactly as the widget's built-in
    // default greeting always has been. What must never happen is the config
    // leaking to an unrelated page via a shared template.
    const stray = overriding
      .filter((p) => !/^([a-z]{2}(-[a-z]+)?\/)?(www-rag|open-web-vectors)\/index\.html$/.test(p))
      .sort();
    assert.deepEqual(stray, [],
      'a per-page agent override appeared on a page that is not the directory ' +
      'or the initiative — check for an override added to a shared template');

    for (const page of ['www-rag/index.html', 'open-web-vectors/index.html']) {
      assert.ok(overriding.includes(page), `${page} lost its page-scoped agent`);
    }
  });
});

describe('API-driven pages match the scripts that drive them', () => {
  /** Ids a script looks up, read straight out of the script itself. */
  function idsQueriedBy(jsPath) {
    const src = readFileSync(join(ROOT, jsPath), 'utf8');
    return [...src.matchAll(/getElementById\("([^"]+)"\)/g)].map((m) => m[1]);
  }

  const CASES = [
    {
      page: 'www-rag/index.html',
      js: 'static/js/www-rag-directory.js',
      attributes: ['data-www-rag-view'],
    },
    {
      page: 'open-web-vectors/index.html',
      js: 'static/js/open-web-vectors.js',
      attributes: [
        'data-owv-stat', 'data-owv-seg', 'data-owv-count',
        'data-owv-fact', 'data-owv-asof', 'data-owv-public-share',
      ],
    },
  ];

  for (const { page, js, attributes } of CASES) {
    test(`${page} carries every hook ${js} looks for`, () => {
      const html = readFileSync(join(PUBLIC, page), 'utf8');
      const { window } = new JSDOM(html);

      assert.ok(
        html.includes(js.replace('static/', '')),
        `${page} does not load ${js}`
      );
      for (const id of idsQueriedBy(js)) {
        assert.ok(
          window.document.getElementById(id),
          `${page} has no #${id}, but ${js} queries it — the feature is dead on the page ` +
          'and the jsdom unit tests are asserting against markup that no longer exists.'
        );
      }
      for (const attr of attributes) {
        assert.ok(
          window.document.querySelector(`[${attr}]`),
          `${page} has no [${attr}], but ${js} writes to it`
        );
      }
      window.close();
    });
  }

  test('the directory table and toolbar controls are all present', () => {
    // These are the ids the jsdom suite hand-rolls; if the template drops one,
    // the unit tests keep passing against a fiction.
    const html = readFileSync(join(PUBLIC, 'www-rag/index.html'), 'utf8');
    const { window } = new JSDOM(html);
    const doc = window.document;

    for (const id of [
      'www-rag-search', 'www-rag-toolbar', 'www-rag-filter-tld',
      'www-rag-filter-status', 'www-rag-filter-docs', 'www-rag-sort',
      'www-rag-reset', 'www-rag-count', 'www-rag-export',
      'www-rag-status', 'www-rag-grid', 'www-rag-stats',
    ]) {
      assert.ok(doc.getElementById(id), `www-rag/ is missing #${id}`);
    }
    assert.equal(doc.querySelectorAll('[data-www-rag-view]').length, 2,
      'expected exactly two view-toggle buttons (cards and table)');
    // The sort <select> must keep a slot for orders the table headers can
    // produce but the list does not name, or those blank the control.
    const sort = doc.getElementById('www-rag-sort');
    assert.ok([...sort.options].some((o) => o.value === '' && o.disabled),
      'www-rag-sort has no disabled "" option — a header-driven sort order the ' +
      'list does not contain would blank the select instead of reading "Custom order"');
    window.close();
  });

  test('every figure on the initiative page comes from the measurement, not the template', () => {
    // The page's claim is that its numbers are measured. A hand-typed figure
    // that creeps back into the template would be invisible in review and
    // wrong within a day — the corpus added 38 sites in the 24 hours after
    // the original snapshot was typed.
    const measured = JSON.parse(readFileSync(join(ROOT, 'data/open-web-vectors.json'), 'utf8'));
    const html = readFileSync(join(PUBLIC, 'open-web-vectors/index.html'), 'utf8');
    const { window } = new JSDOM(html);
    const doc = window.document;

    for (const [key, value] of Object.entries(measured.stats)) {
      const node = doc.querySelector(`[data-owv-stat="${key}"]`);
      assert.ok(node, `the page has no [data-owv-stat="${key}"]`);
      assert.equal(node.textContent.trim(), value,
        `[data-owv-stat="${key}"] reads "${node.textContent.trim()}" but the measurement says "${value}" — ` +
        'a figure has been hardcoded back into the template');
    }

    for (const bucket of measured.composition.buckets) {
      const count = doc.querySelector(`[data-owv-count="${bucket.key}"]`);
      const seg = doc.querySelector(`[data-owv-seg="${bucket.key}"]`);
      assert.equal(count.textContent.trim(), bucket.count, `legend count for ${bucket.key}`);
      // Numeric, not textual: minify_html rewrites "34.0%" to "34%", and the
      // browser normalises the same way when the live refresh sets it, so the
      // two are the same width written two ways.
      const width = parseFloat((seg.getAttribute('style') || '').replace(/[^0-9.]/g, ''));
      assert.equal(width, parseFloat(bucket.width),
        `bar segment for ${bucket.key} is ${width}% but the measurement says ${bucket.width}%`);
    }
    assert.equal(
      doc.querySelector('[data-owv-public-share]').textContent.trim(),
      measured.composition.public_share);
    assert.equal(doc.querySelector('[data-owv-fact="deepest"]').textContent.trim(), measured.facts.deepest);
    assert.equal(doc.querySelector('[data-owv-fact="largest"]').textContent.trim(), measured.facts.largest);

    // The date is what makes a stale fallback honest rather than a lie, so it
    // has to be on the page beside the numbers it belongs to.
    assert.equal(
      doc.querySelector('[data-owv-asof]').textContent.trim(),
      `Measured ${measured.measured_label}.`);
    assert.match(measured.measured_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(new Date(measured.measured_at) <= new Date(),
      'the measurement is dated in the future');

    window.close();
  });

  test('the directory carries the same measured headline, in every locale', () => {
    const measured = JSON.parse(readFileSync(join(ROOT, 'data/open-web-vectors.json'), 'utf8'));
    // Locale directories only: public/tags/www-rag/ is the taxonomy page for
    // the "www-rag" tag, which shares a path shape and nothing else.
    const dirs = readdirSync(PUBLIC, { withFileTypes: true })
      .filter((e) => e.isDirectory() && /^[a-z]{2}(-[a-z]+)?$/.test(e.name))
      .map((e) => join(PUBLIC, e.name, 'www-rag', 'index.html'))
      .filter((f) => existsSync(f));
    const pages = [join(PUBLIC, 'www-rag', 'index.html'), ...dirs];
    assert.ok(pages.length > 5, `expected the directory in several locales, found ${pages.length}`);

    // What matters is that every locale carries the MEASUREMENT — not that it
    // carries the English sentence. The page is translated, so each locale
    // assembles those figures through its own pattern (see www_rag.stats in
    // data/translations/). English still has to match the generated headline
    // exactly: it is the wording the generator, the widget and the unit tests
    // all mirror, and drift between them is the bug this guards against.
    const figures = Object.entries(measured.directory_counts ?? {})
      .filter(([, value]) => value)
      .map(([name, value]) => ({ name, value }));
    assert.ok(figures.length >= 4, 'expected the measurement to carry its counts');

    for (const file of pages) {
      const { window } = new JSDOM(readFileSync(file, 'utf8'));
      const rendered = window.document.getElementById('www-rag-stats').textContent.trim();
      const where = relative(PUBLIC, file);
      if (where === 'www-rag/index.html') {
        assert.equal(rendered, measured.directory_headline,
          `${where} does not carry the measured headline`);
      }
      for (const { name, value } of figures) {
        assert.ok(rendered.includes(value),
          `${where} is missing the measured ${name} (${value}): ${rendered}`);
      }
      window.close();
    }
  });

  test('the measurement is refreshed by every build command, not by memory', () => {
    // The whole design rests on this running unattended. If it drops out of
    // the chain the page silently freezes at whatever it last measured.
    const script = 'scripts/build-open-web-vectors-data.py';
    const wrangler = readFileSync(join(ROOT, 'wrangler.jsonc'), 'utf8');
    const commands = [...wrangler.matchAll(/"command":\s*"([^"]+)"/g)].map((m) => m[1]);
    assert.ok(commands.length >= 3, `expected a build command per environment, found ${commands.length}`);
    for (const command of commands) {
      assert.ok(command.includes(script),
        `a wrangler build command does not run ${script}:\n  ${command}`);
      assert.ok(command.indexOf(script) < command.indexOf('zola build'),
        'the measurement must be stamped BEFORE zola build reads it');
    }
    const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
    assert.ok(pkg.scripts.build.includes(script), `npm run build does not run ${script}`);
  });

  test('the initiative page links to the directory and back', () => {
    const owv = readFileSync(join(PUBLIC, 'open-web-vectors/index.html'), 'utf8');
    const rag = readFileSync(join(PUBLIC, 'www-rag/index.html'), 'utf8');
    assert.ok(owv.includes('/www-rag/'), 'the initiative page does not link to the directory');
    assert.ok(rag.includes('/open-web-vectors/'), 'the directory does not link to the initiative');
  });
});
