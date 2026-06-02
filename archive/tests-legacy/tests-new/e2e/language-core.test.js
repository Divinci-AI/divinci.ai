
/**
 * Core Language Tests for Divinci AI
 * 
 * Tests the main language functionality focusing on the four supported languages:
 * - English (en)
 * - Spanish (es)
 * - French (fr)
 * - Arabic (ar)
 */

import { test, expect } from '@playwright/test';

// Configuration for language testing
const config = {
  baseUrl: 'http://localhost:8001',
  languages: [
    { code: 'en', name: 'English', default: true },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'ar', name: 'Arabic', rtl: true }
  ],
  // Core elements that should be translated in each language
  translatedElements: [
    {
      selector: '.nav-menu a[href="#features"]',
      property: 'textContent',
      expected: { en: 'Features', es: 'Características', fr: 'Fonctionnalités', ar: 'الميزات' }
    },
    {
      selector: '.nav-menu a[href="#team"]',
      property: 'textContent',
      expected: { en: 'Team', es: 'Equipo', fr: 'Équipe', ar: 'الفريق' }
    },
    {
      selector: '.signup-button',
      property: 'textContent',
      expected: { en: 'Sign Up', es: 'Regístrate', fr: "S'inscrire", ar: 'التسجيل' }
    }
  ]
};

// Test that all supported languages can be accessed directly
test('All supported languages should be accessible via direct URL', async ({ page }) => {
  for (const lang of config.languages) {
    console.log(`Testing direct URL access for: ${lang.name} (${lang.code})`);
    
    // Construct URL with language code (except for default language)
    const url = lang.default ? config.baseUrl : `${config.baseUrl}/${lang.code}/`;
    
    // Navigate to the language-specific version with longer timeout
    await page.goto(url, { timeout: 30000, waitUntil: 'domcontentloaded' });
    
    // Take a screenshot of the loaded page
    await page.screenshot({ path: `test-results/direct-url-${lang.code}.png` });
    
    // Wait for the page to load with proper selector
    await page.waitForSelector('nav.navbar', { timeout: 10000 });
    
    // Verify the page loaded by checking for key elements
    const heading = await page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 10000 });
    
    // Check for RTL direction if applicable
    if (lang.rtl) {
      const htmlDir = await page.evaluate(() => document.documentElement.dir);
      console.log(`HTML dir for ${lang.code}: ${htmlDir}`);
      expect(htmlDir).toBe('rtl');
    }
    
    // Verify language-specific content is loaded
    if (!lang.default) {
      // Check that the URL contains the language code
      const currentUrl = page.url();
      expect(currentUrl).toContain(`/${lang.code}/`);

      // Check HTML lang attribute
      const htmlLang = await page.evaluate(() => document.documentElement.lang || 'not-set');
      expect(htmlLang).toBe(lang.code);
    }

    // Verify core translated elements for each language
    for (const elem of config.translatedElements) {
      const locator = page.locator(elem.selector);
      await expect(locator).toHaveText(elem.expected[lang.code]);
    }
  }
});

// Test that the language switcher properly changes languages
test('Language switcher should change the page language', async ({ page }) => {
  // Start with English
  await page.goto(config.baseUrl);
  
  // Wait for the page to load - adjust selector to match actual page structure
  await page.waitForSelector('nav.navbar', { timeout: 10000 });
  
  // Open language switcher dropdown
  await page.locator('.language-switcher-current').click();
  
  // Wait for the language switcher to become active
  await page.waitForSelector('.language-switcher.active', { timeout: 5000 });
  
  // Verify the dropdown is visible
  const dropdown = page.locator('.language-switcher-dropdown');
  await expect(dropdown).toBeVisible();
  
  // Try each language
  for (const lang of config.languages) {
    if (lang.default) continue; // Skip default language
    
    console.log(`Testing language: ${lang.name} (${lang.code})`);
    
    // Click on language option - make sure we have a valid reference to a visible dropdown
    const langOption = page.locator(`.language-option[data-lang="${lang.code}"]`);
    await expect(langOption).toBeVisible();
    
    // Take a screenshot before clicking
    await page.screenshot({ path: `test-results/before-${lang.code}-click.png` });
    
    // Click the language option
    await langOption.click();
    
    // Wait for navigation to complete - this may take longer for initial page load
    await expect(page).toHaveURL(new RegExp(`.*${lang.code}`));
    
    // Take a screenshot after navigation
    await page.screenshot({ path: `test-results/after-${lang.code}-click.png` });
    
    // Check if we landed on the correct language page
    const currentUrl = page.url();
    expect(currentUrl).toContain(`/${lang.code}/`);

    // Verify HTML lang and dir attributes after switching
    const htmlLang = await page.evaluate(() => document.documentElement.lang || 'not-set');
    expect(htmlLang).toBe(lang.code);
    const htmlDir = await page.evaluate(() => document.documentElement.dir);
    if (lang.rtl) {
      expect(htmlDir).toBe('rtl');
    } else {
      expect(htmlDir).toBe('ltr');
    }
    
    // Go back to base URL to try next language
    if (lang !== config.languages[config.languages.length - 1]) {
      await page.goto(config.baseUrl, { timeout: 30000 });
      await page.waitForSelector('nav.navbar', { timeout: 10000 });
      
      // Open language switcher dropdown again
      await page.locator('.language-switcher-current').click();
      
      // Wait for the language switcher to become active
      await page.waitForSelector('.language-switcher.active', { timeout: 5000 });
    }
  }
});
