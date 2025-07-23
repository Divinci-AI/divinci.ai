// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Simple Language Test - Quick validation
 */

test.describe('Simple Language Validation', () => {

  const languages = [
    { code: 'en', name: 'English', working: true },
    { code: 'es', name: 'Spanish', working: true },
    { code: 'fr', name: 'French', working: true },
    { code: 'ar', name: 'Arabic', working: true },
    { code: 'ja', name: 'Japanese', working: false }, // Template missing
    { code: 'zh', name: 'Chinese', working: false }, // Template missing
    { code: 'it', name: 'Italian', working: false }, // Template missing
    { code: 'ru', name: 'Russian', working: false }, // Template missing
    { code: 'de', name: 'German', working: false }, // Template missing
    { code: 'pt', name: 'Portuguese', working: false }, // Template missing
    { code: 'ko', name: 'Korean', working: false }, // Template missing
    { code: 'nl', name: 'Dutch', working: false }, // Template missing
    { code: 'hi', name: 'Hindi', working: false } // Template missing
  ];

  test('verify working languages', async ({ page }) => {
    const workingLangs = languages.filter(l => l.working);
    const results = [];
    
    for (const lang of workingLangs) {
      const url = lang.code === 'en' ? '/' : `/${lang.code}/`;
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      
      const htmlLang = await page.locator('html').getAttribute('lang');
      const hasHero = await page.locator('h1').count() > 0;
      
      results.push({
        language: lang.name,
        code: lang.code,
        htmlLangCorrect: htmlLang === lang.code,
        hasHero
      });
      
      console.log(`✓ ${lang.name}: lang=${htmlLang}, hero=${hasHero}`);
    }
    
    // All working languages should have correct lang attributes
    const correctLang = results.filter(r => r.htmlLangCorrect);
    expect(correctLang.length).toBe(workingLangs.length);
  });

  test('identify template-missing languages', async ({ page }) => {
    const nonWorkingLangs = languages.filter(l => !l.working);
    const results = [];
    
    for (const lang of nonWorkingLangs.slice(0, 5)) { // Test first 5
      const url = `/${lang.code}/`;
      await page.goto(url);
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      
      const htmlLang = await page.locator('html').getAttribute('lang');
      const title = await page.title();
      
      results.push({
        language: lang.name,
        code: lang.code,
        htmlLang,
        fallsBackToEnglish: htmlLang === 'en',
        title
      });
      
      console.log(`⚠ ${lang.name}: expected=${lang.code}, actual=${htmlLang}, fallback=${htmlLang === 'en'}`);
    }
    
    // All should fall back to English due to missing templates
    const fallbacks = results.filter(r => r.fallsBackToEnglish);
    expect(fallbacks.length).toBeGreaterThan(0);
    console.log(`Found ${fallbacks.length} languages falling back to English - this confirms the template issue`);
  });
});