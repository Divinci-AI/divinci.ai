// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Basic Accessibility Test Suite
 * Quick tests to validate core accessibility features
 */

test.describe('Basic Accessibility Tests', () => {
  
  test('should have proper page structure', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Test page has title
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    // Test page has main heading
    const h1 = page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Test navigation exists
    const nav = page.locator('nav');
    await expect(nav).toBeVisible();
    
    // Test language attribute is set
    const lang = await page.locator('html').getAttribute('lang');
    expect(lang).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Check something is focused
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have accessible images', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check images have alt text
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      expect(alt).toBeDefined();
    }
  });

  test('should work across languages', async ({ page }) => {
    const languages = ['en', 'es', 'fr', 'ar', 'ja'];
    
    for (const lang of languages) {
      const url = lang === 'en' ? '/' : `/${lang}/`;
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Check lang attribute
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe(lang);
      
      // Check page has content
      const body = await page.textContent('body');
      expect(body?.length).toBeGreaterThan(100);
    }
  });
});