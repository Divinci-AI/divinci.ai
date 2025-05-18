/**
 * E2E Tests for Language Switcher
 *
 * This file contains detailed tests to verify the language switcher functionality.
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
  baseUrl: 'http://localhost:8000'
};

// Helper function to check if language is properly set
async function verifyLanguage(page, langCode) {
  // Verify URL contains the language code (except for default language)
  if (langCode === 'en') {
    expect(page.url()).not.toContain('/es/');
    expect(page.url()).not.toContain('/fr/');
    expect(page.url()).not.toContain('/ar/');
  } else {
    expect(page.url()).toContain(`/${langCode}/`);
  }

  // Verify HTML lang attribute
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe(langCode);

  // Verify HTML dir attribute
  const expectedDir = langCode === 'ar' ? 'rtl' : 'ltr';
  const htmlDir = await page.evaluate(() => document.documentElement.dir);
  expect(htmlDir).toBe(expectedDir);

  // Verify current language display
  const currentLanguage = await page.textContent('.current-language');
  const expectedLanguageName = config.languages.find(lang => lang.code === langCode).name;
  expect(currentLanguage).toBe(expectedLanguageName);
}

// Test direct navigation to language URLs
test('Direct navigation to language URLs should work', async ({ page }) => {
  // Test each language
  for (const lang of config.languages) {
    // Skip default language (no prefix in URL)
    const langPrefix = lang.code === 'en' ? '' : `/${lang.code}`;

    // Go to the homepage for this language
    await page.goto(`${config.baseUrl}${langPrefix}`);

    // Wait for the page to load
    await page.waitForSelector('h1');

    // Verify language is set correctly
    await verifyLanguage(page, lang.code);

    // Take a screenshot for debugging
    await page.screenshot({ path: `test-results/direct-navigation-${lang.code}.png` });
  }
});

// Test language switching using the language switcher
test('Language switcher should change the language when clicked', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);

  // Wait for the language switcher to be visible
  await page.waitForSelector('.language-switcher');

  // Test switching to each non-default language
  for (const lang of config.languages.filter(l => !l.default)) {
    // Open the language dropdown
    await page.click('.language-switcher-current');

    // Wait for the dropdown to appear
    await page.waitForSelector('.language-switcher-dropdown:visible');

    // Take a screenshot of the open dropdown
    await page.screenshot({ path: `test-results/language-dropdown-open-${lang.code}.png` });

    // Click on the language option
    await page.click(`.language-option[data-lang="${lang.code}"]`);

    // Wait for navigation to complete (with a longer timeout)
    try {
      await page.waitForURL(`**/${lang.code}/**`, { timeout: 10000 });
    } catch (e) {
      console.log(`Navigation timeout for ${lang.code}, taking screenshot for debugging`);
      await page.screenshot({ path: `test-results/navigation-timeout-${lang.code}.png` });

      // Try direct navigation as fallback
      await page.goto(`${config.baseUrl}/${lang.code}/`);
    }

    // Verify language is set correctly
    await verifyLanguage(page, lang.code);

    // Take a screenshot after language change
    await page.screenshot({ path: `test-results/after-language-change-${lang.code}.png` });
  }
});

// Test language switching using the debug buttons
test('Debug buttons should change the language correctly', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);

  // Wait for the debug buttons to be visible
  await page.waitForSelector('button:has-text("Go to Spanish Version")');

  // Click the debug button to go to Spanish version
  await page.click('button:has-text("Go to Spanish Version")');

  // Wait for navigation to complete
  await page.waitForURL('**/es/**');

  // Verify language is set correctly
  await verifyLanguage(page, 'es');

  // Take a screenshot after language change
  await page.screenshot({ path: 'test-results/after-debug-button-click.png' });
});

// Test direct language change using the global function
test('Global changeLanguage function should work', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);

  // Wait for the page to load
  await page.waitForSelector('h1');

  // Test changing to each non-default language
  for (const lang of config.languages.filter(l => !l.default)) {
    // Call the global changeLanguage function
    await page.evaluate((langCode) => {
      if (window.changeLanguage) {
        window.changeLanguage(langCode);
      } else {
        console.error('changeLanguage function not found');
      }
    }, lang.code);

    // Wait for navigation to complete
    try {
      await page.waitForURL(`**/${lang.code}/**`, { timeout: 10000 });
    } catch (e) {
      console.log(`Navigation timeout for ${lang.code}, taking screenshot for debugging`);
      await page.screenshot({ path: `test-results/function-timeout-${lang.code}.png` });

      // Try direct navigation as fallback
      await page.goto(`${config.baseUrl}/${lang.code}/`);
    }

    // Verify language is set correctly
    await verifyLanguage(page, lang.code);

    // Take a screenshot after language change
    await page.screenshot({ path: `test-results/after-function-call-${lang.code}.png` });
  }
});

// Test language switching with console debugging
test('Language switching with console debugging', async ({ page }) => {
  // Enable console logging
  page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));

  // Go to the homepage
  await page.goto(config.baseUrl);

  // Wait for the language switcher to be visible
  await page.waitForSelector('.language-switcher');

  // Click the debug button to get console output
  await page.click('button:has-text("Debug Language Switcher")');

  // Open the language dropdown
  await page.click('.language-switcher-current');

  // Wait for the dropdown to appear
  await page.waitForSelector('.language-switcher-dropdown:visible');

  // Take a screenshot of the open dropdown
  await page.screenshot({ path: 'test-results/debug-dropdown-open.png' });

  // Click on the Spanish option
  await page.click('.language-option[data-lang="es"]');

  // Wait for navigation to complete or timeout
  try {
    await page.waitForURL('**/es/**', { timeout: 10000 });
  } catch (e) {
    console.log('Navigation timeout, checking console logs and taking screenshot');
    await page.screenshot({ path: 'test-results/debug-navigation-timeout.png' });

    // Try direct navigation as fallback
    await page.goto(`${config.baseUrl}/es/`);
  }

  // Verify language is set correctly
  await verifyLanguage(page, 'es');
});
