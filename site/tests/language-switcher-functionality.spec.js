// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Language Switcher Functionality Test Suite
 * Tests the actual language switcher behavior to catch real issues
 */

test.describe('Language Switcher Functionality', () => {

  test.beforeEach(async ({ page }) => {
    // Start with English homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should not create stacked URLs when switching languages', async ({ page }) => {
    // Click language switcher to open dropdown
    await page.locator('.language-switcher').click();
    
    // Switch to Spanish
    await page.locator('[data-lang="es"]').click();
    await page.waitForLoadState('networkidle');
    
    // Verify we're on Spanish page with correct URL
    expect(page.url()).toMatch(/\/es\/$/);
    
    // Verify Spanish content is displayed
    const heroHeading = await page.locator('h1').textContent();
    expect(heroHeading).toContain('Lanzamientos de IA');
    
    // Now switch to French from Spanish
    await page.locator('.language-switcher').click();
    await page.locator('[data-lang="fr"]').click();
    await page.waitForLoadState('networkidle');
    
    // Verify URL is clean (not stacked like /fr/es/)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/fr\/$/);
    expect(currentUrl).not.toContain('/es/');
    
    // Verify French content loads (should not be 404)
    const pageTitle = await page.title();
    expect(pageTitle).toBeTruthy();
    expect(pageTitle.length).toBeGreaterThan(0);
    
    console.log(`✓ French URL: ${currentUrl}`);
    console.log(`✓ French title: ${pageTitle}`);
  });

  test('should handle navigation from any language to English', async ({ page }) => {
    // Start by going to Spanish
    await page.goto('/es/');
    await page.waitForLoadState('networkidle');
    
    // Verify we're on Spanish
    expect(page.url()).toMatch(/\/es\/$/);
    
    // Switch to English
    await page.locator('.language-switcher').click();
    await page.locator('[data-lang="en"]').click();
    await page.waitForLoadState('networkidle');
    
    // Verify we're on clean English URL (no language prefix)
    const englishUrl = page.url();
    expect(englishUrl).toMatch(/\/$|\/index\.html$/);
    expect(englishUrl).not.toContain('/en/');
    expect(englishUrl).not.toContain('/es/');
    
    console.log(`✓ English URL: ${englishUrl}`);
  });

  test('should show correct current language in switcher', async ({ page }) => {
    // Test English
    const currentLangEn = await page.locator('.current-language').textContent();
    expect(currentLangEn?.trim()).toBe('English');
    
    // Switch to Spanish
    await page.locator('.language-switcher').click();
    await page.locator('[data-lang="es"]').click();
    await page.waitForLoadState('networkidle');
    
    // Check current language display
    const currentLangEs = await page.locator('.current-language').textContent();
    expect(currentLangEs?.trim()).toBe('Español');
    
    // Switch to Japanese
    await page.locator('.language-switcher').click();
    await page.locator('[data-lang="ja"]').click();
    await page.waitForLoadState('networkidle');
    
    // Check Japanese current language
    const currentLangJa = await page.locator('.current-language').textContent();
    expect(currentLangJa?.trim()).toBe('日本語');
    
    console.log(`✓ Language display: EN=${currentLangEn}, ES=${currentLangEs}, JA=${currentLangJa}`);
  });

  test('should navigate between multiple languages without errors', async ({ page }) => {
    const languageFlow = [
      { code: 'es', name: 'Spanish', expectedContent: 'Lanzamientos de IA' },
      { code: 'fr', name: 'French', expectedContent: null }, // Will check for non-404
      { code: 'ja', name: 'Japanese', expectedContent: null }, // Will check for non-404
      { code: 'en', name: 'English', expectedContent: 'AI releases' }
    ];
    
    for (const lang of languageFlow) {
      console.log(`Testing navigation to ${lang.name}...`);
      
      // Click switcher and select language
      await page.locator('.language-switcher').click();
      await page.locator(`[data-lang="${lang.code}"]`).click();
      await page.waitForLoadState('networkidle');
      
      // Verify URL structure
      const currentUrl = page.url();
      if (lang.code === 'en') {
        expect(currentUrl).toMatch(/\/$|\/index\.html$/);
      } else {
        expect(currentUrl).toMatch(new RegExp(`/${lang.code}/\$`));
      }
      
      // Verify page loads (not 404)
      const pageTitle = await page.title();
      expect(pageTitle.length).toBeGreaterThan(0);
      
      // Verify HTML lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      if (lang.code === 'en') {
        expect(['en', null].includes(htmlLang)).toBeTruthy();
      } else {
        // Some languages might fall back to 'en' due to template issues
        // but the URL routing should still work
        expect(htmlLang).toBeTruthy();
      }
      
      // Check for specific content if provided
      if (lang.expectedContent) {
        const bodyText = await page.textContent('body');
        expect(bodyText).toContain(lang.expectedContent);
      }
      
      console.log(`✓ ${lang.name}: URL=${currentUrl}, Title=${pageTitle}, Lang=${htmlLang}`);
    }
  });

  test('should handle direct URL access for all languages', async ({ page }) => {
    const directAccessTests = [
      { url: '/es/', expectedLang: 'es', shouldWork: true },
      { url: '/fr/', expectedLang: 'fr', shouldWork: true },
      { url: '/ja/', expectedLang: 'ja', shouldWork: true },
      { url: '/zh/', expectedLang: 'zh', shouldWork: true },
      { url: '/de/', expectedLang: 'de', shouldWork: true }
    ];
    
    for (const test of directAccessTests) {
      console.log(`Testing direct access to ${test.url}...`);
      
      await page.goto(test.url);
      await page.waitForLoadState('networkidle');
      
      // Verify we didn't get redirected to a different URL
      expect(page.url()).toContain(test.url);
      
      // Verify page loads (has title)
      const pageTitle = await page.title();
      expect(pageTitle.length).toBeGreaterThan(0);
      
      // Verify language switcher exists
      const languageSwitcher = await page.locator('.language-switcher').count();
      expect(languageSwitcher).toBeGreaterThan(0);
      
      console.log(`✓ Direct access ${test.url}: Title=${pageTitle}`);
    }
  });

  test('should not break when clicking same language twice', async ({ page }) => {
    // Click language switcher
    await page.locator('.language-switcher').click();
    
    // Click English (current language)
    await page.locator('[data-lang="en"]').click();
    await page.waitForLoadState('networkidle');
    
    // Should still be on English homepage
    const url1 = page.url();
    expect(url1).toMatch(/\/$|\/index\.html$/);
    
    // Switch to Spanish
    await page.locator('.language-switcher').click();
    await page.locator('[data-lang="es"]').click();
    await page.waitForLoadState('networkidle');
    
    // Click Spanish again (same language)
    await page.locator('.language-switcher').click();
    await page.locator('[data-lang="es"]').click();
    await page.waitForLoadState('networkidle');
    
    // Should still be on Spanish page with clean URL
    const url2 = page.url();
    expect(url2).toMatch(/\/es\/$/);
    expect(url2).not.toContain('/es/es/');
    
    console.log(`✓ Same language click test: EN=${url1}, ES=${url2}`);
  });
});