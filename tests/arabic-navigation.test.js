/**
 * Arabic Navigation Test
 *
 * This file contains a test to verify that the Arabic version of the website has the correct navigation text.
 */

const { test, expect } = require('@playwright/test');

// Test that the Arabic version of the website has the correct navigation text
test('Arabic version should have the correct navigation text', async ({ page }) => {
  // Go to the Arabic version
  await page.goto('http://localhost:8001/ar/');
  
  // Wait for the page to load
  await page.waitForSelector('nav.navbar');
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/arabic-navigation.png' });
  
  // Get the HTML content of the navigation menu
  const navMenuHTML = await page.evaluate(() => {
    const navMenu = document.querySelector('.nav-menu');
    return navMenu ? navMenu.innerHTML : '';
  });
  
  console.log('Arabic navigation menu HTML:', navMenuHTML);
  
  // Check if the navigation menu contains the Arabic text
  const containsFeatures = navMenuHTML.includes('الميزات');
  const containsTeam = navMenuHTML.includes('الفريق');
  const containsSignUp = navMenuHTML.includes('التسجيل');
  
  console.log('Contains الميزات:', containsFeatures);
  console.log('Contains الفريق:', containsTeam);
  console.log('Contains التسجيل:', containsSignUp);
  
  // Verify that the Arabic text is present in the navigation menu
  expect(containsFeatures).toBe(true);
  expect(containsTeam).toBe(true);
  expect(containsSignUp).toBe(true);
  
  // Check that the HTML dir attribute is set to rtl
  const htmlDir = await page.evaluate(() => document.documentElement.dir);
  expect(htmlDir).toBe('rtl');
});
