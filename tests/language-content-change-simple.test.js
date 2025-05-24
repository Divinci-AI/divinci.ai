/**
 * Simple Language Content Change Tests
 *
 * This file contains simplified tests to verify that the content changes when switching languages.
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
  
  // Click the debug button to go to Spanish version
  await page.click('button:has-text("Go to Spanish Version")');
  
  // Wait for the language to change
  await page.waitForTimeout(1000);
  
  // Get the text of the Sign Up button in Spanish
  const spanishSignUpText = await page.textContent('.signup-button');
  console.log('Spanish Sign Up text:', spanishSignUpText);
  
  // Verify that the text has changed
  expect(spanishSignUpText).not.toBe(englishSignUpText);
  expect(spanishSignUpText).toBe('Registrarse');
});

// Test that the content changes when using the translation test page
test('Content should change on the translation test page', async ({ page }) => {
  // Go to the translation test page
  await page.goto(`${config.baseUrl}/translation-test.html`);
  
  // Wait for the page to load
  await page.waitForSelector('[data-i18n="buttons.signUp"]');
  
  // Get the initial text
  const initialSignUpText = await page.textContent('[data-i18n="buttons.signUp"]');
  console.log('Initial Sign Up text:', initialSignUpText);
  
  // Click the Spanish button
  await page.click('button:has-text("Español")');
  
  // Wait for the language to change
  await page.waitForTimeout(1000);
  
  // Get the text after changing the language
  const spanishSignUpText = await page.textContent('[data-i18n="buttons.signUp"]');
  console.log('Spanish Sign Up text:', spanishSignUpText);
  
  // Verify that the text has changed
  expect(spanishSignUpText).not.toBe(initialSignUpText);
  expect(spanishSignUpText).toBe('Registrarse');
  
  // Check that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
});
