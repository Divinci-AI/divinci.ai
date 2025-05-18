/**
 * French Navigation Test
 *
 * This file contains a test to verify that the French version of the website has the correct navigation text.
 */

const { test, expect } = require('@playwright/test');

// Test that the French version of the website has the correct navigation text
test('French version should have the correct navigation text', async ({ page }) => {
  // Go to the French version
  await page.goto('http://localhost:8001/fr/');
  
  // Wait for the page to load
  await page.waitForSelector('nav.navbar');
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/french-navigation.png' });
  
  // Get the HTML content of the navigation menu
  const navMenuHTML = await page.evaluate(() => {
    const navMenu = document.querySelector('.nav-menu');
    return navMenu ? navMenu.innerHTML : '';
  });
  
  console.log('French navigation menu HTML:', navMenuHTML);
  
  // Check if the navigation menu contains the French text
  const containsFonctionnalites = navMenuHTML.includes('Fonctionnalités');
  const containsEquipe = navMenuHTML.includes('Équipe');
  const containsInscrire = navMenuHTML.includes('S\'inscrire');
  
  console.log('Contains Fonctionnalités:', containsFonctionnalites);
  console.log('Contains Équipe:', containsEquipe);
  console.log('Contains S\'inscrire:', containsInscrire);
  
  // Verify that the French text is present in the navigation menu
  expect(containsFonctionnalites).toBe(true);
  expect(containsEquipe).toBe(true);
  expect(containsInscrire).toBe(true);
});
