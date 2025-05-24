/**
 * Spanish Navigation Test
 *
 * This file contains a test to verify that the Spanish version of the website has the correct navigation text.
 */

const { test, expect } = require('@playwright/test');

// Test that the Spanish version of the website has the correct navigation text
test('Spanish version should have the correct navigation text', async ({ page }) => {
  // Go to the Spanish version
  await page.goto('http://localhost:8001/es/');
  
  // Wait for the page to load
  await page.waitForSelector('nav.navbar');
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/spanish-navigation.png' });
  
  // Get the HTML content of the navigation menu
  const navMenuHTML = await page.evaluate(() => {
    const navMenu = document.querySelector('.nav-menu');
    return navMenu ? navMenu.innerHTML : '';
  });
  
  console.log('Spanish navigation menu HTML:', navMenuHTML);
  
  // Check if the navigation menu contains the Spanish text
  const containsCaracteristicas = navMenuHTML.includes('Características');
  const containsEquipo = navMenuHTML.includes('Equipo');
  const containsRegistrarse = navMenuHTML.includes('Registrarse');
  
  console.log('Contains Características:', containsCaracteristicas);
  console.log('Contains Equipo:', containsEquipo);
  console.log('Contains Registrarse:', containsRegistrarse);
  
  // Verify that the Spanish text is present in the navigation menu
  expect(containsCaracteristicas).toBe(true);
  expect(containsEquipo).toBe(true);
  expect(containsRegistrarse).toBe(true);
});
