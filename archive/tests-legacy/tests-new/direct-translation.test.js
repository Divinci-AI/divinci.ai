/**
 * Direct Translation Tests
 *
 * This file contains tests for the direct translation implementation.
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

// Test that the content changes on the direct translation test page
test('Content should change on the direct translation test page', async ({ page }) => {
  // Go to the direct translation test page
  await page.goto(`${config.baseUrl}/direct-translation-test.html`);
  
  // Wait for the page to load
  await page.waitForSelector('#signup-text');
  
  // Get the initial text
  const initialSignUpText = await page.textContent('#signup-text');
  console.log('Initial Sign Up text:', initialSignUpText);
  
  // Click the Spanish button
  await page.click('button:has-text("Español")');
  
  // Wait for the language to change
  await page.waitForTimeout(500);
  
  // Get the text after changing the language
  const spanishSignUpText = await page.textContent('#signup-text');
  console.log('Spanish Sign Up text:', spanishSignUpText);
  
  // Verify that the text has changed
  expect(spanishSignUpText).not.toBe(initialSignUpText);
  expect(spanishSignUpText).toBe('Registrarse');
  
  // Check that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
  
  // Check other translations
  const featuresText = await page.textContent('#features-text');
  const teamText = await page.textContent('#team-text');
  
  expect(featuresText).toBe('Características');
  expect(teamText).toBe('Equipo');
});
