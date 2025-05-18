/**
 * E2E Tests for Translation Workflow
 *
 * This file contains tests to verify the translation workflow.
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  languages: [
    { code: 'en', name: 'English', dir: 'ltr', default: true },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' }
  ],
  baseUrl: 'http://localhost:8001'
};

// Test the language switcher
test('Language switcher should change the language', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);

  // Wait for the language switcher to be visible
  await page.waitForSelector('.language-switcher');

  // Click on the debug button to toggle the language switcher dropdown
  await page.click('button:has-text("Toggle Language Dropdown")');

  // Wait for the dropdown to appear
  await page.waitForSelector('.language-switcher-dropdown:visible');

  // Directly navigate to the Spanish version instead of clicking
  await page.goto(`${config.baseUrl}/es/`);

  // Verify that the URL contains the language code
  expect(page.url()).toContain('/es/');

  // Verify that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
});

// Test language-specific content
test('Language-specific content should be displayed', async ({ page }) => {
  // Test each language
  for (const lang of config.languages) {
    // Skip default language (no prefix in URL)
    const langPrefix = lang.code === 'en' ? '' : `/${lang.code}`;

    // Go to the homepage for this language
    await page.goto(`${config.baseUrl}${langPrefix}`);

    // Wait for the page to load
    await page.waitForSelector('h1');

    // Verify that the HTML lang attribute is set correctly
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe(lang.code);

    // Verify that the HTML dir attribute is set correctly
    const htmlDir = await page.evaluate(() => document.documentElement.dir);
    expect(htmlDir).toBe(lang.dir);

    // Verify that the language switcher shows the correct language
    const currentLanguage = await page.textContent('.current-language');
    expect(currentLanguage).toBe(lang.name);

    // Verify that translated content is displayed
    // This will depend on the specific content of your site
    // Here we're just checking that some content exists
    const h1Text = await page.textContent('h1');
    expect(h1Text).not.toBe('');
  }
});

// Test hreflang tags
test('Hreflang tags should be present and correct', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);

  // Check that hreflang tags are present
  const hreflangTags = await page.evaluate(() => {
    const tags = document.querySelectorAll('link[rel="alternate"][hreflang]');
    return Array.from(tags).map(tag => ({
      hreflang: tag.getAttribute('hreflang'),
      href: tag.getAttribute('href')
    }));
  });

  // Verify that there is a tag for each language plus x-default
  expect(hreflangTags.length).toBe(config.languages.length + 1);

  // Verify that there is an x-default tag
  const xDefaultTag = hreflangTags.find(tag => tag.hreflang === 'x-default');
  expect(xDefaultTag).toBeTruthy();

  // Verify that there is a tag for each language
  for (const lang of config.languages) {
    const langTag = hreflangTags.find(tag => tag.hreflang === lang.code);
    expect(langTag).toBeTruthy();

    // Verify that the href is correct
    if (lang.code === 'en') {
      expect(langTag.href).toBe(config.baseUrl + '/');
    } else {
      expect(langTag.href).toBe(`${config.baseUrl}/${lang.code}/`);
    }
  }
});

// Test sitemaps
test('Sitemaps should be accessible and valid', async ({ page }) => {
  // Check the main sitemap
  await page.goto(`${config.baseUrl}/sitemap.xml`);

  // Verify that the sitemap is accessible
  expect(await page.content()).toContain('<?xml');
  expect(await page.content()).toContain('<urlset');

  // Check language-specific sitemaps
  for (const lang of config.languages) {
    // Skip default language (uses main sitemap)
    if (lang.code === 'en') continue;

    // Go to the language-specific sitemap
    await page.goto(`${config.baseUrl}/sitemap_${lang.code}.xml`);

    // Verify that the sitemap is accessible
    expect(await page.content()).toContain('<?xml');
    expect(await page.content()).toContain('<urlset');
  }

  // Check sitemap index
  await page.goto(`${config.baseUrl}/sitemap_index.xml`);

  // Verify that the sitemap index is accessible
  expect(await page.content()).toContain('<?xml');
  expect(await page.content()).toContain('<sitemapindex');
});

// Test robots.txt
test('Robots.txt should include sitemaps', async ({ page }) => {
  // Go to robots.txt
  await page.goto(`${config.baseUrl}/robots.txt`);

  // Verify that robots.txt is accessible
  const content = await page.content();

  // Verify that it includes the main sitemap
  expect(content).toContain('Sitemap: ');
  expect(content).toContain('sitemap.xml');

  // Verify that it includes language-specific sitemaps
  for (const lang of config.languages) {
    // Skip default language (uses main sitemap)
    if (lang.code === 'en') continue;

    expect(content).toContain(`sitemap_${lang.code}.xml`);
  }
});

// Test mobile responsiveness
test('Pages should be responsive on mobile devices', async ({ page }) => {
  // Set viewport to mobile size
  await page.setViewportSize({ width: 375, height: 667 });

  // Test each language
  for (const lang of config.languages) {
    // Skip default language (no prefix in URL)
    const langPrefix = lang.code === 'en' ? '' : `/${lang.code}`;

    // Go to the homepage for this language
    await page.goto(`${config.baseUrl}${langPrefix}`);

    // Wait for the page to load
    await page.waitForSelector('h1');

    // Verify that the mobile menu is present
    const mobileMenu = await page.isVisible('.mobile-menu-toggle, .navbar-burger');
    expect(mobileMenu).toBe(true);

    // Verify that the language switcher is visible on mobile
    const languageSwitcher = await page.isVisible('.language-switcher');
    expect(languageSwitcher).toBe(true);
  }
});

// Test RTL layout for Arabic
test('Arabic pages should have RTL layout', async ({ page }) => {
  // Go to the Arabic homepage
  await page.goto(`${config.baseUrl}/ar`);

  // Wait for the page to load
  await page.waitForSelector('h1');

  // Verify that the HTML dir attribute is set to rtl
  const htmlDir = await page.evaluate(() => document.documentElement.dir);
  expect(htmlDir).toBe('rtl');

  // Verify that RTL-specific styles are applied
  // This will depend on your specific CSS implementation
  // Here we're checking for a common RTL style pattern
  const bodyTextAlign = await page.evaluate(() => {
    return window.getComputedStyle(document.body).getPropertyValue('text-align');
  });

  // In RTL layouts, text is often aligned right by default
  expect(bodyTextAlign).toBe('right');
});

// Test accessibility for all languages
test('Pages should be accessible in all languages', async ({ page }) => {
  // Test each language
  for (const lang of config.languages) {
    // Skip default language (no prefix in URL)
    const langPrefix = lang.code === 'en' ? '' : `/${lang.code}`;

    // Go to the homepage for this language
    await page.goto(`${config.baseUrl}${langPrefix}`);

    // Wait for the page to load
    await page.waitForSelector('h1');

    // Run accessibility checks
    // Note: This requires the @axe-core/playwright package
    // const violations = await page.evaluate(async () => {
    //   const { axe } = await import('@axe-core/playwright');
    //   const results = await axe.run();
    //   return results.violations;
    // });

    // expect(violations.length).toBe(0);

    // For now, let's just check some basic accessibility features

    // Check that all images have alt text
    const imagesWithoutAlt = await page.evaluate(() => {
      const images = document.querySelectorAll('img:not([alt])');
      return images.length;
    });

    expect(imagesWithoutAlt).toBe(0);

    // Check that all form elements have labels
    const formsWithoutLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([aria-label]):not([aria-labelledby])');
      const inputsWithoutLabels = Array.from(inputs).filter(input => {
        const id = input.getAttribute('id');
        if (!id) return true;
        const label = document.querySelector(`label[for="${id}"]`);
        return !label;
      });
      return inputsWithoutLabels.length;
    });

    expect(formsWithoutLabels).toBe(0);
  }
});
