/**
 * Spanish Content Test
 *
 * This file contains a test to verify that the Spanish version of the website has the correct content.
 */

const { test, expect } = require('@playwright/test');

// Test that the Spanish version of the website has the correct content
test('Spanish version should have the correct content', async ({ page }) => {
  // Go to the Spanish version
  await page.goto('http://localhost:8001/es/');
  
  // Wait for the page to load
  await page.waitForSelector('.nav-menu');
  
  // Get the text of the navigation links
  const featuresText = await page.locator('.nav-menu a').nth(0).textContent();
  const teamText = await page.locator('.nav-menu a').nth(1).textContent();
  const signUpText = await page.locator('.signup-button').textContent();
  
  console.log('Spanish texts:', {
    features: featuresText,
    team: teamText,
    signUp: signUpText
  });
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/spanish-content.png' });
  
  // Verify that the Spanish text matches the expected translations
  expect(featuresText).toBe('Características');
  expect(teamText).toBe('Equipo');
  expect(signUpText).toBe('Registrarse');
  
  // Check that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
});
