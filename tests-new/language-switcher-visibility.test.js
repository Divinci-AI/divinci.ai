/**
 * Language Switcher Visibility Test
 * 
 * Tests that the language switcher is visible on all language versions of the site
 */

import { test, expect } from '@playwright/test';

// Configuration for supported languages
const languages = [
  { code: 'en', name: 'English', path: '/' },
  { code: 'es', name: 'Spanish', path: '/es/' },
  { code: 'fr', name: 'French', path: '/fr/' },
  { code: 'ar', name: 'Arabic', path: '/ar/', rtl: true }
];

// Base URL for testing
const baseUrl = 'http://localhost:8001';

// Test that the language switcher is visible on all language versions
test('Language switcher should be visible on all language versions', async ({ page }) => {
  for (const lang of languages) {
    // Construct the full URL for this language
    const url = `${baseUrl}${lang.path}`;
    console.log(`Testing language switcher visibility on ${lang.name} site: ${url}`);
    
    // Navigate to the language-specific version
    await page.goto(url, { 
      timeout: 30000,
      waitUntil: 'domcontentloaded'
    });
    
    // Take a screenshot for debugging
    await page.screenshot({ 
      path: `test-results/language-switcher-${lang.code}.png`,
      fullPage: false 
    });
    
    // Check if language switcher is visible
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toBeVisible({ timeout: 5000 });
    
    // Check that the current language display is correct
    const currentLanguage = page.locator('.language-switcher-current .current-language');
    await expect(currentLanguage).toBeVisible({ timeout: 2000 });
    
    // Optional: Verify the language name is displayed correctly
    const languageNames = {
      'en': 'English',
      'es': 'Español',
      'fr': 'Français',
      'ar': 'العربية'
    };
    
    const expectedLanguage = languageNames[lang.code];
    const currentLangText = await currentLanguage.textContent();
    console.log(`Current language text: "${currentLangText}", Expected: "${expectedLanguage}"`);
    
    // Test clicking the language switcher opens the dropdown
    await languageSwitcher.locator('.language-switcher-current').click();
    
    // Verify the dropdown appears
    const dropdown = page.locator('.language-switcher-dropdown');
    await expect(dropdown).toBeVisible({ timeout: 3000 });
    
    // Take a screenshot with open dropdown for debugging
    await page.screenshot({ 
      path: `test-results/language-switcher-dropdown-${lang.code}.png`,
      fullPage: false 
    });
    
    // Check all language options are in the dropdown
    for (const option of languages) {
      const langOption = page.locator(`.language-option[data-lang="${option.code}"]`);
      await expect(langOption).toBeVisible({ timeout: 2000 });
    }
  }
});

// Test that clicking language options works on the current page
test('Clicking language options navigates to correct language version', async ({ page }) => {
  // Start with English
  await page.goto(`${baseUrl}/`, { 
    timeout: 30000,
    waitUntil: 'domcontentloaded'
  });
  
  // Open language switcher dropdown
  const languageSwitcher = page.locator('.language-switcher');
  await languageSwitcher.locator('.language-switcher-current').click();
  
  // Wait for dropdown to be visible
  const dropdown = page.locator('.language-switcher-dropdown');
  await expect(dropdown).toBeVisible({ timeout: 3000 });
  
  // Click Spanish language option
  await page.locator('.language-option[data-lang="es"]').click();
  
  // Verify URL contains Spanish path
  await page.waitForURL('**/es/**', { timeout: 30000 });
  expect(page.url()).toContain('/es/');
  
  // Check that Spanish language switcher is visible
  await expect(page.locator('.language-switcher')).toBeVisible({ timeout: 5000 });
  
  // Verify the current language display shows Spanish
  const currentLanguage = page.locator('.language-switcher-current .current-language');
  const currentLangText = await currentLanguage.textContent();
  console.log(`After navigation, current language text: "${currentLangText}"`);
});