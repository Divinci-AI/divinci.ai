const { test, expect } = require('@playwright/test');
const { AxeBuilder } = require('@axe-core/playwright');

/**
 * WCAG 2.1 / 2.2 AA enforcement via axe-core.
 *
 * The other accessibility*.spec.js files in this repo are hand-rolled
 * heuristics — they check that headings exist, that images have alt, and so on.
 * They passed continuously while /blog/ shipped 22 unnamed links and /docs/
 * shipped code blocks no keyboard user could scroll. This file runs the actual
 * rule set instead.
 *
 * Two states matter and only one of them is reachable by scanning URLs:
 * the chat panel OPEN is a full-screen dialog on phones and had never been
 * audited at all, because nothing navigates to it.
 */

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const PAGES = ['/', '/docs/', '/cli/', '/contact/', '/support/', '/pricing/', '/blog/', '/ar/'];

/** Readable failure output — axe's default object dump is unusable in CI logs. */
function format(violations) {
  return violations.map((v) =>
    `[${v.impact}] ${v.id}: ${v.help}\n` +
    v.nodes.slice(0, 5).map((n) => `      ${n.target.join(' ')}`).join('\n') +
    `\n      ${v.helpUrl}`,
  ).join('\n\n');
}

async function scan(page) {
  return new AxeBuilder({ page }).withTags(TAGS).analyze();
}

for (const viewport of [
  { name: 'mobile', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
  { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
]) {
  test.describe(`WCAG AA — ${viewport.name}`, () => {
    test.use(viewport.use);

    for (const path of PAGES) {
      test(`${path} has no violations`, async ({ page }) => {
        await page.goto(path, { waitUntil: 'domcontentloaded' });
        // The chat widget and the code-block wiring both mount async; scanning
        // before they land would audit a page no visitor ever sees.
        await page.waitForTimeout(1500);
        const { violations } = await scan(page);
        expect(violations, `\n${format(violations)}\n`).toEqual([]);
      });
    }

    test('the chat dialog, open, has no violations', async ({ page }) => {
      await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
      await page.evaluate(() => document.querySelector('.dvc-bubble').click());
      await page.waitForSelector('.dvc-input', { timeout: 15000 });
      const { violations } = await scan(page);
      expect(violations, `\n${format(violations)}\n`).toEqual([]);
    });
  });
}

test.describe('chat dialog semantics and keyboard contract', () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  const open = async (page) => {
    await page.goto('/docs/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.dvc-bubble', { timeout: 15000 });
    await page.evaluate(() => document.querySelector('.dvc-bubble').click());
    await page.waitForSelector('.dvc-input', { timeout: 15000 });
  };

  test('is announced as a labelled modal dialog with a live transcript', async ({ page }) => {
    await open(page);
    expect(await page.evaluate(() => {
      const p = document.querySelector('.dvc-panel');
      const log = p.querySelector('[aria-live]');
      return {
        role: p.getAttribute('role'),
        modal: p.getAttribute('aria-modal'),
        labelledby: p.getAttribute('aria-labelledby'),
        labelText: document.getElementById(p.getAttribute('aria-labelledby'))?.textContent,
        logRole: log?.getAttribute('role'),
        logPoliteness: log?.getAttribute('aria-live'),
        expanded: document.querySelector('.dvc-bubble').getAttribute('aria-expanded'),
      };
    })).toEqual({
      role: 'dialog',
      modal: 'true',                 // full-screen layout => genuinely modal
      labelledby: 'dvc-panel-title',
      labelText: 'Ask Divinci',
      logRole: 'log',
      logPoliteness: 'polite',
      expanded: 'true',
    });
  });

  test('Escape closes it and focus returns to the launcher', async ({ page }) => {
    await open(page);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => ({
      hidden: document.querySelector('.dvc-panel').classList.contains('dvc-hidden'),
      expanded: document.querySelector('.dvc-bubble').getAttribute('aria-expanded'),
      focused: document.activeElement.className,
    }))).toMatchObject({ hidden: true, expanded: 'false' });
    expect(await page.evaluate(() => document.activeElement.className)).toContain('dvc-bubble');
  });

  test('Tab cannot escape the dialog', async ({ page }) => {
    await open(page);
    await page.evaluate(() => document.querySelector('.dvc-close').focus());
    // More presses than there are focusable children, so an untrapped dialog
    // would certainly have leaked into the page behind by the end.
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Tab');
      const inside = await page.evaluate(() =>
        document.querySelector('.dvc-panel').contains(document.activeElement));
      expect(inside, `focus left the dialog after ${i + 1} Tab press(es)`).toBe(true);
    }
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press('Shift+Tab');
      expect(await page.evaluate(() =>
        document.querySelector('.dvc-panel').contains(document.activeElement))).toBe(true);
    }
  });
});

test.describe('hero video theater', () => {
  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

    test('fills the screen, escapes its stacking context, and locks the page', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.evaluate(() => document.getElementById('hero-play').click());
      await page.waitForTimeout(1700);

      const s = await page.evaluate(() => {
        const t = document.getElementById('hero-theater');
        const r = t.getBoundingClientRect();
        return {
          parent: t.parentElement.tagName.toLowerCase(),
          position: getComputedStyle(t).position,
          coversViewport: r.top === 0 && r.left === 0 &&
                          Math.abs(r.width - window.innerWidth) < 1 &&
                          Math.abs(r.height - window.innerHeight) < 1,
          // #main-content is `z-index: 1`, a stacking context. Unless the dialog
          // is portalled out, the fixed site banner paints on top of the video.
          topOfScreen: document.elementFromPoint(window.innerWidth / 2, 8).id,
          modal: t.getAttribute('aria-modal'),
          rootOverflow: document.documentElement.style.overflow,
          iframes: t.querySelectorAll('iframe').length,
          focused: document.activeElement.className,
        };
      });

      expect(s.parent).toBe('body');
      expect(s.position).toBe('fixed');
      expect(s.coversViewport).toBe(true);
      expect(s.topOfScreen).toBe('hero-theater');
      expect(s.modal).toBe('true');
      expect(s.rootOverflow).toBe('hidden');
      expect(s.iframes).toBe(1);
      expect(s.focused).toContain('hero-theater-close');
    });

    test('a wheel over the video does not scroll the page behind it', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.evaluate(() => document.getElementById('hero-play').click());
      await page.waitForTimeout(1700);

      await page.mouse.move(195, 400);
      await page.mouse.wheel(0, 700);
      await page.waitForTimeout(250);
      expect(await page.evaluate(() => window.scrollY)).toBe(300);
    });

    test('closing restores the DOM, the scroll lock and the reading position', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      await page.evaluate(() => window.scrollTo(0, 300));
      await page.evaluate(() => document.getElementById('hero-play').click());
      await page.waitForTimeout(1700);
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1700);

      expect(await page.evaluate(() => {
        const t = document.getElementById('hero-theater');
        return {
          parent: t.parentElement.className.split(' ')[0],
          hidden: t.hidden,
          modal: t.getAttribute('aria-modal'),
          rootOverflow: document.documentElement.style.overflow,
          scrollY: window.scrollY,
          expanded: document.getElementById('hero-play').getAttribute('aria-expanded'),
          focused: document.activeElement.id,
        };
      })).toEqual({
        parent: 'hero',
        hidden: true,
        modal: null,
        rootOverflow: '',
        scrollY: 300,
        expanded: 'false',
        focused: 'hero-play',
      });
    });
  });

  test.describe('on a desktop', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('stays an inset panel and leaves the page alone', async ({ page }) => {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2500);
      await page.evaluate(() => document.getElementById('hero-play').click());
      await page.waitForTimeout(1700);

      expect(await page.evaluate(() => {
        const t = document.getElementById('hero-theater');
        return {
          position: getComputedStyle(t).position,
          parentIsBody: t.parentElement === document.body,
          // Not modal: the rest of the page is still visible and usable here,
          // so claiming modality would misrepresent it to assistive tech.
          modal: t.getAttribute('aria-modal'),
          rootOverflow: document.documentElement.style.overflow,
        };
      })).toEqual({
        position: 'absolute', parentIsBody: false, modal: null, rootOverflow: '',
      });
    });
  });
});
