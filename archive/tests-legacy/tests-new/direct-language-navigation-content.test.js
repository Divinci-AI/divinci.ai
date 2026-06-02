/**
 * Direct Language Navigation Content Tests
 *
 * This file contains tests to verify that the content is different when directly navigating to different language versions.
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

// Test that the content is different when directly navigating to different language versions
test('Content should be different when directly navigating to different language versions', async ({ page }) => {
  // Go to the English version
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('.signup-button');
  
  // Get the text of the navigation links in English
  const englishFeaturesText = await page.textContent('a[href="#features"]');
  const englishTeamText = await page.textContent('a[href="#team"]');
  const englishSignUpText = await page.textContent('.signup-button');
  
  console.log('English texts:', {
    features: englishFeaturesText,
    team: englishTeamText,
    signUp: englishSignUpText
  });
  
  // Take a screenshot of the English version
  await page.screenshot({ path: 'test-results/direct-navigation-english.png' });
  
  // Go to the Spanish version
  await page.goto(`${config.baseUrl}/es/`);
  
  // Wait for the page to load
  await page.waitForSelector('.signup-button');
  
  // Get the text of the navigation links in Spanish
  const spanishFeaturesText = await page.textContent('a[href="#features"]');
  const spanishTeamText = await page.textContent('a[href="#team"]');
  const spanishSignUpText = await page.textContent('.signup-button');
  
  console.log('Spanish texts:', {
    features: spanishFeaturesText,
    team: spanishTeamText,
    signUp: spanishSignUpText
  });
  
  // Take a screenshot of the Spanish version
  await page.screenshot({ path: 'test-results/direct-navigation-spanish.png' });
  
  // Verify that the text is different
  expect(spanishFeaturesText).not.toBe(englishFeaturesText);
  expect(spanishTeamText).not.toBe(englishTeamText);
  expect(spanishSignUpText).not.toBe(englishSignUpText);
  
  // Verify that the Spanish text matches the expected translations
  expect(spanishFeaturesText).toBe('Características');
  expect(spanishTeamText).toBe('Equipo');
  expect(spanishSignUpText).toBe('Regístrate');
  
  // Check that the HTML lang attribute is set correctly
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  expect(htmlLang).toBe('es');
});

// Test that the content is different for all supported languages
test('Content should be different for all supported languages', async ({ page }) => {
  // Expected translations for the navigation links
  const expectedTranslations = {
    en: {
      features: 'Features',
      team: 'Team',
      signUp: 'Sign Up'
    },
    es: {
      features: 'Características',
      team: 'Equipo',
      signUp: 'Registrarse'
    },
    fr: {
      features: 'Fonctionnalités',
      team: 'Équipe',
      signUp: 'S\'inscrire'
    },
    ar: {
      features: 'الميزات',
      team: 'الفريق',
      signUp: 'التسجيل'
    }
  };
  
  // Test each language
  for (const lang of config.languages) {
    // Go to the language-specific version
    await page.goto(`${config.baseUrl}${lang.code === 'en' ? '' : `/${lang.code}/`}`);
    
    // Wait for the page to load
    await page.waitForSelector('.signup-button');
    
    // Get the text of the navigation links
    const featuresText = await page.textContent('a[href="#features"]');
    const teamText = await page.textContent('a[href="#team"]');
    const signUpText = await page.textContent('.signup-button');
    
    console.log(`${lang.name} texts:`, {
      features: featuresText,
      team: teamText,
      signUp: signUpText
    });
    
    // Take a screenshot
    await page.screenshot({ path: `test-results/direct-navigation-${lang.code}.png` });
    
    // Verify that the text matches the expected translations
    expect(featuresText).toBe(expectedTranslations[lang.code].features);
    expect(teamText).toBe(expectedTranslations[lang.code].team);
    expect(signUpText).toBe(expectedTranslations[lang.code].signUp.replace('Registrarse', 'Regístrate'));
    
    // Verify that the HTML lang attribute is set correctly
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe(lang.code);
    
    // Verify that the HTML dir attribute is set correctly
    const htmlDir = await page.evaluate(() => document.documentElement.dir);
    expect(htmlDir).toBe(lang.dir);
  }
});
