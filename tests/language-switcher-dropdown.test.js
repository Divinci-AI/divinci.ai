/**
 * Language Switcher Dropdown Tests
 *
 * This file contains tests to verify the language switcher dropdown functionality.
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

// Test language switcher dropdown visibility
test('Language switcher dropdown should be visible when clicked', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('h1');
  
  // Take a screenshot before clicking
  await page.screenshot({ path: 'test-results/language-switcher-before-click.png' });
  
  // Check if the language switcher is visible
  const languageSwitcherVisible = await page.isVisible('.language-switcher');
  expect(languageSwitcherVisible).toBe(true);
  
  // Click the debug button to toggle the dropdown
  await page.click('button:has-text("Toggle Language Dropdown")');
  
  // Wait a moment for the dropdown to appear
  await page.waitForTimeout(500);
  
  // Take a screenshot after clicking
  await page.screenshot({ path: 'test-results/language-switcher-after-click.png' });
  
  // Check if the dropdown is visible
  const dropdownVisible = await page.isVisible('.language-switcher-dropdown');
  expect(dropdownVisible).toBe(true);
});

// Test direct navigation using the debug button
test('Debug button should navigate to Spanish version', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('h1');
  
  // Take a screenshot before clicking
  await page.screenshot({ path: 'test-results/before-spanish-button-click.png' });
  
  // Click the debug button to go to Spanish version
  await page.click('button:has-text("Go to Spanish Version")');
  
  // Wait for navigation to complete
  await page.waitForURL('**/es/**');
  
  // Take a screenshot after navigation
  await page.screenshot({ path: 'test-results/after-spanish-button-click.png' });
  
  // Verify that the URL contains the language code
  expect(page.url()).toContain('/es/');
  
  // Verify that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
});
