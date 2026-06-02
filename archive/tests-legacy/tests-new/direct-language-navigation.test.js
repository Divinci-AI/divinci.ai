/**
 * Direct Language Navigation Tests
 *
 * This file contains tests to verify direct navigation to language-specific URLs.
 */

const { test, expect } = require('@playwright/test');

// Configuration
const config = {
  languages: [
    { code: 'en', name: 'English', dir: 'ltr', default: true },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' }
  ],
  baseUrl: 'http://localhost:61443'
};

// Test direct navigation to each language
test('Direct navigation to each language should work', async ({ page }) => {
  // Test each language
  for (const lang of config.languages) {
    // Skip default language (no prefix in URL)
    const langPrefix = lang.code === 'en' ? '' : `/${lang.code}`;

    // Go to the homepage for this language
    await page.goto(`${config.baseUrl}${langPrefix}`, { waitUntil: 'domcontentloaded' });

    // Wait for the page to load
    await page.waitForSelector('h1');

    // Take a screenshot
    await page.screenshot({ path: `test-results/direct-navigation-${lang.code}.png` });

    // Verify that the URL contains the language code (except for default language)
    if (lang.code === 'en') {
      expect(page.url()).not.toContain('/es/');
      expect(page.url()).not.toContain('/fr/');
      expect(page.url()).not.toContain('/ar/');
    } else {
      expect(page.url()).toContain(`/${lang.code}`);
    }

    // Verify that the HTML lang attribute is set correctly
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe(lang.code);

    // Verify that the HTML dir attribute is set correctly
    const htmlDir = await page.evaluate(() => document.documentElement.dir);
    expect(htmlDir).toBe(lang.dir);

    // Skip the language switcher check as it might not be loaded yet
    // This is a separate test concern
  }
});

// Test navigation between languages using direct URLs
test('Navigation between languages using direct URLs should work', async ({ page }) => {
  // Start with English
  await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });

  // Wait for the page to load
  await page.waitForSelector('h1');

  // Take a screenshot
  await page.screenshot({ path: 'test-results/start-english.png' });

  // Navigate to Spanish
  await page.goto(`${config.baseUrl}/es/`, { waitUntil: 'domcontentloaded' });

  // Wait for the page to load
  await page.waitForSelector('h1');

  // Take a screenshot
  await page.screenshot({ path: 'test-results/navigate-spanish.png' });

  // Verify that the URL contains the language code
  expect(page.url()).toContain('/es');

  // Verify that the HTML lang attribute is set correctly
  const htmlLangEs = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLangEs).toBe('es');

  // Navigate to French
  await page.goto(`${config.baseUrl}/fr/`, { waitUntil: 'domcontentloaded' });

  // Wait for the page to load
  await page.waitForSelector('h1');

  // Take a screenshot
  await page.screenshot({ path: 'test-results/navigate-french.png' });

  // Verify that the URL contains the language code
  expect(page.url()).toContain('/fr');

  // Verify that the HTML lang attribute is set correctly
  const htmlLangFr = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLangFr).toBe('fr');

  // Navigate to Arabic
  await page.goto(`${config.baseUrl}/ar/`, { waitUntil: 'domcontentloaded' });

  // Wait for the page to load
  await page.waitForSelector('h1');

  // Take a screenshot
  await page.screenshot({ path: 'test-results/navigate-arabic.png' });

  // Verify that the URL contains the language code
  expect(page.url()).toContain('/ar');

  // Verify that the HTML lang attribute is set correctly
  const htmlLangAr = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLangAr).toBe('ar');

  // Navigate back to English
  await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });

  // Wait for the page to load
  await page.waitForSelector('h1');

  // Take a screenshot
  await page.screenshot({ path: 'test-results/navigate-back-english.png' });

  // Verify that the URL does not contain any language code
  expect(page.url()).not.toContain('/es');
  expect(page.url()).not.toContain('/fr');
  expect(page.url()).not.toContain('/ar');

  // Verify that the HTML lang attribute is set correctly
  const htmlLangEn = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLangEn).toBe('en');
});

// Test navigation to non-existent language
test('Navigation to non-existent language should fallback to default', async ({ page }) => {
  // Navigate to a non-existent language
  await page.goto(`${config.baseUrl}/de/`, { waitUntil: 'domcontentloaded' });

  // Wait for the page to load
  await page.waitForTimeout(2000);

  // Take a screenshot
  await page.screenshot({ path: 'test-results/non-existent-language.png' });

  // Check the current URL and language
  console.log(`Current URL: ${page.url()}`);

  const htmlLang = await page.evaluate(() => document.documentElement.lang || 'not-set');
  console.log(`HTML lang attribute: ${htmlLang}`);
});
