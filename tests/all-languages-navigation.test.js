/**
 * All Languages Navigation Test
 *
 * This file contains tests to verify that all language versions of the website have the correct navigation text.
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

// Test that all language versions of the website have the correct navigation text
test('All language versions should have the correct navigation text', async ({ page }) => {
  // Test each language
  for (const lang of config.languages) {
    console.log(`Testing ${lang.name} (${lang.code}) navigation...`);
    
    // Go to the language-specific version
    const url = lang.default ? config.baseUrl : `${config.baseUrl}/${lang.code}/`;
    await page.goto(url);
    
    // Wait for the page to load
    await page.waitForSelector('nav.navbar');
    
    // Take a screenshot
    await page.screenshot({ path: `test-results/${lang.code}-navigation.png` });
    
    // Get the HTML content of the navigation menu
    const navMenuHTML = await page.evaluate(() => {
      const navMenu = document.querySelector('.nav-menu');
      return navMenu ? navMenu.innerHTML : '';
    });
    
    console.log(`${lang.name} navigation menu HTML:`, navMenuHTML);
    
    // Check if the navigation menu contains the translated text
    const containsFeatures = navMenuHTML.includes(lang.translations.features);
    const containsTeam = navMenuHTML.includes(lang.translations.team);
    const containsSignUp = navMenuHTML.includes(lang.translations.signUp);
    
    console.log(`Contains ${lang.translations.features}:`, containsFeatures);
    console.log(`Contains ${lang.translations.team}:`, containsTeam);
    console.log(`Contains ${lang.translations.signUp}:`, containsSignUp);
    
    // Verify that the translated text is present in the navigation menu
    expect(containsFeatures).toBe(true);
    expect(containsTeam).toBe(true);
    expect(containsSignUp).toBe(true);
    
    // Check that the HTML lang attribute is set correctly
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe(lang.code);
    
    // Check that the HTML dir attribute is set correctly
    const htmlDir = await page.evaluate(() => document.documentElement.dir);
    expect(htmlDir).toBe(lang.dir);
  }
});
