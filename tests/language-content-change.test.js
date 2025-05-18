/**
 * Language Content Change Tests
 *
 * This file contains tests to verify that the content changes when switching languages.
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

// Test that the content changes when switching languages
test('Content should change when switching languages', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('h1');
  
  // Take a screenshot of the English version
  await page.screenshot({ path: 'test-results/content-english.png' });
  
  // Get the text of some elements in English
  const englishSignUpText = await page.textContent('.signup-button');
  const englishFeaturesText = await page.textContent('a[href="#features"]');
  
  console.log('English texts:', {
    signUp: englishSignUpText,
    features: englishFeaturesText
  });
  
  // Click the debug button to go to Spanish version
  await page.click('button:has-text("Go to Spanish Version")');
  
  // Wait for navigation to complete
  await page.waitForURL('**/es/**');
  
  // Wait for the page to load
  await page.waitForSelector('h1');
  
  // Take a screenshot of the Spanish version
  await page.screenshot({ path: 'test-results/content-spanish.png' });
  
  // Get the text of the same elements in Spanish
  const spanishSignUpText = await page.textContent('.signup-button');
  const spanishFeaturesText = await page.textContent('a[href="#features"]');
  
  console.log('Spanish texts:', {
    signUp: spanishSignUpText,
    features: spanishFeaturesText
  });
  
  // Verify that the text has changed
  expect(spanishSignUpText).not.toBe(englishSignUpText);
  expect(spanishFeaturesText).not.toBe(englishFeaturesText);
  
  // Verify that the Spanish text matches the expected translations
  expect(spanishSignUpText).toBe('Registrarse');
  expect(spanishFeaturesText).toBe('Características');
});

// Test that the content changes for all supported languages
test('Content should change for all supported languages', async ({ page }) => {
  // Expected translations for the Sign Up button
  const expectedTranslations = {
    en: 'Sign Up',
    es: 'Registrarse',
    fr: 'S\'inscrire',
    ar: 'التسجيل'
  };
  
  // Test each non-default language
  for (const lang of config.languages.filter(l => !l.default)) {
    // Go to the language-specific version
    await page.goto(`${config.baseUrl}/${lang.code}/`);
    
    // Wait for the page to load
    await page.waitForSelector('h1');
    
    // Take a screenshot
    await page.screenshot({ path: `test-results/content-${lang.code}.png` });
    
    // Get the text of the Sign Up button
    const signUpText = await page.textContent('.signup-button');
    
    console.log(`${lang.name} Sign Up text:`, signUpText);
    
    // Verify that the text matches the expected translation
    expect(signUpText).toBe(expectedTranslations[lang.code]);
    
    // Verify that the HTML lang attribute is set correctly
    const htmlLang = await page.evaluate(() => document.documentElement.lang);
    expect(htmlLang).toBe(lang.code);
    
    // Verify that the HTML dir attribute is set correctly
    const htmlDir = await page.evaluate(() => document.documentElement.dir);
    expect(htmlDir).toBe(lang.dir);
  }
});

// Test that the language switcher changes the content
test('Language switcher should change the content', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('h1');
  
  // Get the text of the Sign Up button in English
  const englishSignUpText = await page.textContent('.signup-button');
  
  // Click the language switcher to open the dropdown
  await page.click('button:has-text("Toggle Language Dropdown")');
  
  // Wait for the dropdown to appear
  await page.waitForSelector('.language-switcher-dropdown:visible');
  
  // Take a screenshot of the open dropdown
  await page.screenshot({ path: 'test-results/language-switcher-open.png' });
  
  // Click on the Spanish option
  await page.click('.language-option[data-lang="es"]');
  
  // Wait for navigation to complete
  await page.waitForURL('**/es/**');
  
  // Wait for the page to load
  await page.waitForSelector('h1');
  
  // Get the text of the Sign Up button in Spanish
  const spanishSignUpText = await page.textContent('.signup-button');
  
  // Verify that the text has changed
  expect(spanishSignUpText).not.toBe(englishSignUpText);
  expect(spanishSignUpText).toBe('Registrarse');
});
