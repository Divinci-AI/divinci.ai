/**
 * Language Switching Test
 *
 * This file contains tests to verify that the language switching functionality works correctly.
 */

const { test, expect } = require('@playwright/test');

// Configuration
const config = {
  languages: [
    { 
      code: 'en', 
      name: 'English', 
      dir: 'ltr', 
      default: true,
      translations: {
        features: 'Features',
        team: 'Team',
        signUp: 'Sign Up'
      }
    },
    { 
      code: 'es', 
      name: 'Español', 
      dir: 'ltr',
      translations: {
        features: 'Características',
        team: 'Equipo',
        signUp: 'Registrarse'
      }
    },
    { 
      code: 'fr', 
      name: 'Français', 
      dir: 'ltr',
      translations: {
        features: 'Fonctionnalités',
        team: 'Équipe',
        signUp: 'S\'inscrire'
      }
    },
    { 
      code: 'ar', 
      name: 'العربية', 
      dir: 'rtl',
      translations: {
        features: 'الميزات',
        team: 'الفريق',
        signUp: 'التسجيل'
      }
    }
  ],
  baseUrl: 'http://localhost:8001'
};

// Test that clicking on the language switcher navigates to the correct language version
test('Clicking on the language switcher should navigate to the correct language version', async ({ page }) => {
  // Go to the English version
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('nav.navbar');
  
  // Take a screenshot of the English version
  await page.screenshot({ path: 'test-results/language-switching-english.png' });
  
  // Click on the "Go to Spanish Version" button
  await page.click('button:has-text("Go to Spanish Version")');
  
  // Wait for the Spanish version to load
  await page.waitForSelector('nav.navbar');
  
  // Take a screenshot of the Spanish version
  await page.screenshot({ path: 'test-results/language-switching-spanish.png' });
  
  // Get the current URL
  const url = page.url();
  
  // Verify that the URL contains the Spanish language code
  expect(url).toContain('/es/');
  
  // Get the HTML content of the navigation menu
  const navMenuHTML = await page.evaluate(() => {
    const navMenu = document.querySelector('.nav-menu');
    return navMenu ? navMenu.innerHTML : '';
  });
  
  console.log('Spanish navigation menu HTML after switching:', navMenuHTML);
  
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
  
  // Check that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
});
