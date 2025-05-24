/**
 * Main Website Translation Tests
 *
 * This file contains tests to verify that the content changes when switching languages on the main website.
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
  baseUrl: 'http://localhost:8001'
};

// Test that the content changes when switching languages using the debug button
test('Content should change when clicking the Spanish debug button', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('.signup-button');
  
  // Get the text of the Sign Up button in English
  const englishSignUpText = await page.textContent('.signup-button');
  console.log('English Sign Up text:', englishSignUpText);
  
  // Take a screenshot of the English version
  await page.screenshot({ path: 'test-results/main-website-english.png' });
  
  // Click the debug button to go to Spanish version
  await page.click('button:has-text("Go to Spanish Version")');
  
  // Wait for navigation to complete
  await page.waitForURL('**/es/**');
  
  // Wait for the page to load
  await page.waitForSelector('.signup-button');
  
  // Wait for translations to be applied
  await page.waitForTimeout(1000);
  
  // Take a screenshot of the Spanish version
  await page.screenshot({ path: 'test-results/main-website-spanish.png' });
  
  // Get the text of the Sign Up button in Spanish
  const spanishSignUpText = await page.textContent('.signup-button');
  console.log('Spanish Sign Up text:', spanishSignUpText);
  
  // Verify that the text has changed
  expect(spanishSignUpText).not.toBe(englishSignUpText);
  expect(spanishSignUpText).toBe('Registrarse');
  
  // Check that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
});

// Test that the content changes when using the language switcher
test('Content should change when using the language switcher', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('.signup-button');
  
  // Get the text of the Sign Up button in English
  const englishSignUpText = await page.textContent('.signup-button');
  console.log('English Sign Up text:', englishSignUpText);
  
  // Click the language switcher to open the dropdown
  await page.click('button:has-text("Toggle Language Dropdown")');
  
  // Wait for the dropdown to appear
  await page.waitForSelector('.language-switcher-dropdown:visible');
  
  // Take a screenshot of the open dropdown
  await page.screenshot({ path: 'test-results/main-website-language-switcher-open.png' });
  
  // Click on the Spanish option
  await page.click('.language-option[data-lang="es"]');
  
  // Wait for navigation to complete
  await page.waitForURL('**/es/**');
  
  // Wait for the page to load
  await page.waitForSelector('.signup-button');
  
  // Wait for translations to be applied
  await page.waitForTimeout(1000);
  
  // Get the text of the Sign Up button in Spanish
  const spanishSignUpText = await page.textContent('.signup-button');
  console.log('Spanish Sign Up text:', spanishSignUpText);
  
  // Verify that the text has changed
  expect(spanishSignUpText).not.toBe(englishSignUpText);
  expect(spanishSignUpText).toBe('Registrarse');
  
  // Check that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
});
