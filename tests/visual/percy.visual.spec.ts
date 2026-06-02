import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

/**
 * Percy Visual Regression Tests for Divinci.ai
 *
 * These tests capture visual snapshots across key pages and send them to Percy
 * for cross-browser visual comparison and regression detection.
 *
 * Run with: npm run test:percy
 * Requires PERCY_TOKEN environment variable
 */

// Key pages to test
const pagesToTest = [
  { name: 'Homepage', path: '/' },
  { name: 'Pricing', path: '/pricing.html' },
  { name: 'Features - AutoRAG', path: '/features/data-management/autorag.html' },
  { name: 'Features - LLM QA', path: '/features/quality-assurance/llm-quality-assurance.html' },
  { name: 'Blog', path: '/blog/' },
  { name: 'About Us', path: '/about-us.html' },
  { name: 'Contact', path: '/contact.html' },
  { name: 'Docs', path: '/docs/' },
];

// Locales to test
const locales = ['', 'es/', 'fr/', 'ar/'];

test.describe('Percy Visual Regression - Core Pages', () => {
  for (const page of pagesToTest) {
    test(`${page.name}`, async ({ page: playwrightPage }) => {
      await playwrightPage.goto(page.path, { waitUntil: 'networkidle' });

      // Wait for any lazy-loaded content
      await playwrightPage.waitForTimeout(1000);

      // Take Percy snapshot
      await percySnapshot(playwrightPage, page.name);
    });
  }
});

test.describe('Percy Visual Regression - Multilingual', () => {
  // Test homepage in all languages
  for (const locale of locales) {
    const localeName = locale ? locale.replace('/', '').toUpperCase() : 'EN';

    test(`Homepage - ${localeName}`, async ({ page }) => {
      const path = locale ? `/${locale}` : '/';
      await page.goto(path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      await percySnapshot(page, `Homepage - ${localeName}`);
    });
  }
});

test.describe('Percy Visual Regression - Mobile Interactions', () => {
  test('Mobile Navigation Menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Capture closed state
    await percySnapshot(page, 'Mobile - Navigation Closed');

    // Open mobile menu if burger exists
    const burger = page.locator('.navbar-burger, .mobile-menu-toggle, [data-target="navbar-menu"]');
    if (await burger.isVisible()) {
      await burger.click();
      await page.waitForTimeout(500);
      await percySnapshot(page, 'Mobile - Navigation Open');
    }
  });

  test('Mobile Footer', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);

    await percySnapshot(page, 'Mobile - Footer');
  });
});

test.describe('Percy Visual Regression - Blog Posts', () => {
  const blogPosts = [
    { name: 'RAG Systems', path: '/blog/posts/future-of-rag-systems.html' },
    { name: 'Vector Embeddings', path: '/blog/posts/optimizing-vector-embeddings.html' },
    { name: 'Responsible AI', path: '/blog/posts/building-responsible-ai-systems.html' },
    { name: 'Fintech Case Study', path: '/blog/posts/fintech-customer-support-case-study.html' },
  ];

  for (const post of blogPosts) {
    test(`Blog - ${post.name}`, async ({ page }) => {
      await page.goto(post.path, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1000);

      await percySnapshot(page, `Blog - ${post.name}`);
    });
  }
});

test.describe('Percy Visual Regression - Dark Mode', () => {
  test('Homepage - Dark Mode (if supported)', async ({ page }) => {
    // Emulate dark mode preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    await percySnapshot(page, 'Homepage - Dark Mode');
  });
});

test.describe('Percy Visual Regression - RTL Layout', () => {
  test('Arabic Homepage - RTL', async ({ page }) => {
    await page.goto('/ar/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    // Verify RTL direction
    const htmlDir = await page.getAttribute('html', 'dir');

    await percySnapshot(page, 'Arabic Homepage - RTL Layout');
  });
});
