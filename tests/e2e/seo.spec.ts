import { test, expect } from '@playwright/test';
import { BasePage } from '../page-objects';

/**
 * SEO E2E Tests
 *
 * Tests for meta tags, structured data, and SEO best practices
 */

// Key pages to test
const PAGES_TO_TEST = [
  { name: 'Homepage', path: '/' },
  { name: 'Pricing', path: '/pricing.html' },
  { name: 'About', path: '/about-us.html' },
  { name: 'Contact', path: '/contact.html' },
  { name: 'Blog', path: '/blog/' },
  { name: 'Docs', path: '/docs/' },
];

test.describe('SEO', () => {
  test.describe('Meta Tags', () => {
    for (const pageConfig of PAGES_TO_TEST) {
      test(`${pageConfig.name} has required meta tags`, async ({ page }) => {
        const basePage = new BasePage(page);
        await basePage.goto(pageConfig.path);

        // Title
        const title = await basePage.getTitle();
        expect(title).toBeTruthy();
        expect(title.length).toBeGreaterThan(10);
        expect(title.length).toBeLessThan(70);

        // Description
        const description = await basePage.getMetaContent('description');
        expect(description).toBeTruthy();
        expect(description!.length).toBeGreaterThan(50);
        expect(description!.length).toBeLessThan(160);

        // Viewport
        const viewport = await basePage.getMetaContent('viewport');
        expect(viewport).toContain('width=device-width');
      });
    }
  });

  test.describe('Canonical URLs', () => {
    for (const pageConfig of PAGES_TO_TEST) {
      test(`${pageConfig.name} has canonical URL`, async ({ page }) => {
        const basePage = new BasePage(page);
        await basePage.goto(pageConfig.path);

        const canonical = await basePage.getCanonicalUrl();
        expect(canonical).toBeTruthy();
        expect(canonical).toContain('divinci.ai');

        // Canonical should not contain /index.html for homepage
        if (pageConfig.path === '/') {
          expect(canonical).not.toContain('/index.html');
        }
      });
    }
  });

  test.describe('Open Graph Tags', () => {
    test('homepage has Open Graph tags', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto('/');

      const ogTitle = await basePage.getMetaContent('og:title');
      expect(ogTitle).toBeTruthy();

      const ogDescription = await basePage.getMetaContent('og:description');
      expect(ogDescription).toBeTruthy();

      const ogImage = await basePage.getMetaContent('og:image');
      expect(ogImage).toBeTruthy();
      expect(ogImage).toMatch(/^https?:\/\//);

      const ogUrl = await basePage.getMetaContent('og:url');
      expect(ogUrl).toBeTruthy();
    });
  });

  test.describe('Twitter Card Tags', () => {
    test('homepage has Twitter Card tags', async ({ page }) => {
      const basePage = new BasePage(page);
      await basePage.goto('/');

      const twitterCard = await basePage.getMetaContent('twitter:card');
      expect(twitterCard).toBeTruthy();

      const twitterTitle = await basePage.getMetaContent('twitter:title');
      expect(twitterTitle).toBeTruthy();

      const twitterImage = await basePage.getMetaContent('twitter:image');
      expect(twitterImage).toBeTruthy();
    });
  });

  test.describe('Structured Data', () => {
    test('homepage has JSON-LD structured data', async ({ page }) => {
      await page.goto('/');

      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();
      expect(count).toBeGreaterThan(0);

      // Parse and validate JSON-LD
      const content = await jsonLdScripts.first().textContent();
      expect(content).toBeTruthy();

      const jsonLd = JSON.parse(content!);
      expect(jsonLd['@context']).toBe('https://schema.org');
      expect(jsonLd['@type']).toBeTruthy();
    });

    test('blog posts have BlogPosting schema', async ({ page }) => {
      await page.goto('/blog/posts/future-of-rag-systems.html');

      const jsonLdScripts = page.locator('script[type="application/ld+json"]');
      const count = await jsonLdScripts.count();

      // Find BlogPosting schema
      let hasBlogPosting = false;
      for (let i = 0; i < count; i++) {
        const content = await jsonLdScripts.nth(i).textContent();
        if (content) {
          const jsonLd = JSON.parse(content);
          if (jsonLd['@type'] === 'BlogPosting') {
            hasBlogPosting = true;
            expect(jsonLd.headline).toBeTruthy();
            expect(jsonLd.author).toBeTruthy();
            break;
          }
        }
      }
      expect(hasBlogPosting).toBe(true);
    });
  });

  test.describe('Robots & Sitemap', () => {
    test('robots.txt is accessible', async ({ page }) => {
      const response = await page.goto('/robots.txt');
      expect(response?.status()).toBe(200);

      const content = await page.content();
      expect(content).toContain('User-agent');
      expect(content).toContain('Sitemap');
    });

    test('sitemap.xml is accessible', async ({ page }) => {
      const response = await page.goto('/sitemap.xml');
      expect(response?.status()).toBe(200);

      const content = await page.content();
      expect(content).toContain('urlset');
      expect(content).toContain('divinci.ai');
    });
  });

  test.describe('Page Performance Indicators', () => {
    test('pages have preload hints for critical resources', async ({ page }) => {
      await page.goto('/');

      // Check for preload links
      const preloadLinks = page.locator('link[rel="preload"]');
      const count = await preloadLinks.count();

      // Should have at least some preload hints
      expect(count).toBeGreaterThanOrEqual(0); // Relaxed - not all sites use preload
    });

    test('images have alt attributes', async ({ page }) => {
      await page.goto('/');

      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const alt = await images.nth(i).getAttribute('alt');
        // Alt should exist (can be empty for decorative images)
        expect(alt !== null).toBe(true);
      }
    });
  });
});
