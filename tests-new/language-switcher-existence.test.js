/**
 * Language Switcher Existence Test
 * 
 * Tests that the language switcher exists and is visible on all language versions of the site
 */

import { test, expect } from '@playwright/test';

// Configuration for supported languages
const languages = [
  { code: 'en', name: 'English', path: '/' },
  { code: 'es', name: 'Spanish', path: '/es/' },
  { code: 'fr', name: 'French', path: '/fr/' },
  { code: 'ar', name: 'Arabic', path: '/ar/' }
];

// Test that the language switcher exists on all language versions
test('Language switcher should exist on all language versions', async ({ page }) => {
  // Check each language version
  for (const lang of languages) {
    // Construct the URL
    const url = `http://localhost:61443${lang.path}`;
    console.log(`Testing language switcher existence on ${lang.name} site: ${url}`);
    
    // Navigate to the language version
    await page.goto(url, { 
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    });
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: `test-results/language-switcher-${lang.code}.png`,
      fullPage: false 
    });
    
    // Check if the language switcher exists - both with class and ID selectors 
    // as implementations might differ
    const languageSwitcherByClass = page.locator('.language-switcher');
    const languageSwitcherById = page.locator('#language-switcher');
    
    // Log what we find
    const classExists = await languageSwitcherByClass.count() > 0;
    const idExists = await languageSwitcherById.count() > 0;
    console.log(`Lang: ${lang.code} - By class exists: ${classExists}, By ID exists: ${idExists}`);
    
    // Check the HTML structure for debugging
    const htmlContent = await page.content();
    const hasLanguageSwitcherText = htmlContent.includes('language-switcher');
    console.log(`HTML contains 'language-switcher' text: ${hasLanguageSwitcherText}`);
    
    // Assert that at least one selector finds the language switcher
    expect(classExists || idExists).toBeTruthy();
    
    // Check if any element with data-include attribute for language switcher exists
    const includeElement = page.locator('[data-include*="language-switcher.html"]');
    const includeExists = await includeElement.count() > 0;
    console.log(`Element with data-include for language switcher exists: ${includeExists}`);
    
    // Check which scripts related to language switching are loaded
    const scripts = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('script'))
        .map(script => script.src)
        .filter(src => src.includes('language') || src.includes('include'))
        .map(src => src.split('/').pop());
    });
    console.log(`Language-related scripts loaded: ${scripts.join(', ') || 'none'}`);
  }
});

// Test that the current language text in the switcher is correct
test('Current language in switcher should match page language', async ({ page }) => {
  for (const lang of languages) {
    // Navigate to the language version
    const url = `http://localhost:61443${lang.path}`;
    await page.goto(url, { timeout: 30000 });
    
    // Expected display text for the current language
    const expectedLanguageNames = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'ar': 'العربية'
    };
    
    // Try to find the current language element
    const currentLanguage = page.locator('.language-switcher-current .current-language');
    if (await currentLanguage.count() > 0) {
      // Get the displayed text
      const displayedText = await currentLanguage.textContent();
      console.log(`${lang.code}: Current language text is "${displayedText}"`);
      
      // Check if the language name contains the expected language name
      // The comparison is loose to handle cases where the format might differ slightly
      const expectedText = expectedLanguageNames[lang.code];
      
      // Check if one contains the other (case insensitive)
      const isMatch = 
        displayedText.toLowerCase().includes(expectedText.toLowerCase()) ||
        expectedText.toLowerCase().includes(displayedText.toLowerCase());
        
      expect(isMatch).toBeTruthy();
    } else {
      console.log(`${lang.code}: No current language element found`);
      // Taking a screenshot for debugging
      await page.screenshot({ path: `test-results/missing-language-text-${lang.code}.png` });
      
      // This is a failure case
      expect(false).toBeTruthy();
    }
  }
});