// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Language Health Check Test Suite
 * Quickly identifies which language sites have issues
 */

test.describe('Language Site Health Check', () => {

  const languages = [
    { code: 'en', name: 'English', url: '/' },
    { code: 'es', name: 'Spanish', url: '/es/' },
    { code: 'fr', name: 'French', url: '/fr/' },
    { code: 'ar', name: 'Arabic', url: '/ar/' },
    { code: 'ja', name: 'Japanese', url: '/ja/' },
    { code: 'zh', name: 'Chinese', url: '/zh/' },
    { code: 'it', name: 'Italian', url: '/it/' },
    { code: 'ru', name: 'Russian', url: '/ru/' },
    { code: 'de', name: 'German', url: '/de/' },
    { code: 'pt', name: 'Portuguese', url: '/pt/' },
    { code: 'ko', name: 'Korean', url: '/ko/' },
    { code: 'nl', name: 'Dutch', url: '/nl/' },
    { code: 'hi', name: 'Hindi', url: '/hi/' }
  ];

  test('quick health check - all language sites load', async ({ page }) => {
    const results = [];
    
    for (const lang of languages) {
      try {
        console.log(`Testing ${lang.name} (${lang.code})...`);
        
        await page.goto(lang.url);
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        
        // Basic checks
        const htmlLang = await page.locator('html').getAttribute('lang');
        const pageTitle = await page.title();
        const hasHero = await page.locator('h1, .hero').count() > 0;
        const hasNav = await page.locator('nav').count() > 0;
        const hasLanguageSwitcher = await page.locator('.language-switcher').count() > 0;
        
        // Check if content is translated (not English)
        const bodyText = await page.textContent('body');
        const isTranslated = lang.code === 'en' || !bodyText?.includes('Excellence, every time');
        
        const status = {
          language: lang.name,
          code: lang.code,
          url: lang.url,
          loads: true,
          htmlLangCorrect: htmlLang === lang.code,
          hasTitle: pageTitle && pageTitle.length > 0,
          hasHero,
          hasNav,
          hasLanguageSwitcher,
          isTranslated,
          title: pageTitle
        };
        
        results.push(status);
        console.log(`✓ ${lang.name}: OK`);
        
      } catch (error) {
        results.push({
          language: lang.name,
          code: lang.code,
          url: lang.url,
          loads: false,
          error: error.message
        });
        console.log(`✗ ${lang.name}: FAILED - ${error.message}`);
      }
    }
    
    // Report results
    console.log('\n=== LANGUAGE SITE HEALTH REPORT ===');
    const working = results.filter(r => r.loads && r.htmlLangCorrect && r.hasHero);
    const broken = results.filter(r => !r.loads || !r.htmlLangCorrect || !r.hasHero);
    const untranslated = results.filter(r => r.loads && !r.isTranslated);
    
    console.log(`Working sites: ${working.length}/${languages.length}`);
    console.log(`Broken sites: ${broken.length}`);
    console.log(`Untranslated sites: ${untranslated.length}`);
    
    if (broken.length > 0) {
      console.log('\nBROKEN SITES:');
      broken.forEach(site => {
        console.log(`- ${site.language} (${site.code}): ${site.error || 'Missing elements'}`);
      });
    }
    
    if (untranslated.length > 0) {
      console.log('\nUNTRANSLATED SITES:');
      untranslated.forEach(site => {
        console.log(`- ${site.language} (${site.code}): Still showing English content`);
      });
    }
    
    // Assertions
    expect(working.length).toBeGreaterThan(8); // At least 8 should work
    expect(broken.length).toBeLessThan(5); // No more than 4 should be broken
  });

  test('detailed language switcher functionality check', async ({ page }) => {
    // Start with English
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    const switcherProblems = [];
    
    // Test if language switcher exists and is clickable
    const languageSwitcher = page.locator('.language-switcher');
    
    if (await languageSwitcher.count() === 0) {
      switcherProblems.push('Language switcher not found on page');
    } else {
      try {
        await languageSwitcher.click();
        
        // Check if all language options appear
        for (const lang of languages) {
          const option = page.locator(`[data-lang="${lang.code}"]`);
          if (await option.count() === 0) {
            switcherProblems.push(`Missing option for ${lang.name} (${lang.code})`);
          }
        }
        
        // Test switching to Spanish
        const spanishOption = page.locator('[data-lang="es"]');
        if (await spanishOption.count() > 0) {
          await spanishOption.click();
          await page.waitForLoadState('networkidle');
          
          const newUrl = page.url();
          const newLang = await page.locator('html').getAttribute('lang');
          
          if (!newUrl.includes('/es/')) {
            switcherProblems.push('URL did not change to Spanish route');
          }
          
          if (newLang !== 'es') {
            switcherProblems.push('HTML lang attribute not updated to Spanish');
          }
        }
        
      } catch (error) {
        switcherProblems.push(`Language switcher error: ${error.message}`);
      }
    }
    
    // Report switcher problems
    if (switcherProblems.length > 0) {
      console.log('\nLANGUAGE SWITCHER PROBLEMS:');
      switcherProblems.forEach(problem => console.log(`- ${problem}`));
    } else {
      console.log('\n✓ Language switcher working correctly');
    }
    
    expect(switcherProblems.length).toBe(0);
  });

  languages.forEach(({ code, name, url }) => {
    test(`${name} site basic functionality`, async ({ page }) => {
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      
      // Essential checks for each language
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe(code);
      
      const pageTitle = await page.title();
      expect(pageTitle).toBeTruthy();
      expect(pageTitle.length).toBeGreaterThan(0);
      
      // Check main content exists
      const heroContent = page.locator('h1, .hero h1');
      await expect(heroContent.first()).toBeVisible();
      
      // Check navigation exists
      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();
      
      // Check language switcher exists
      const languageSwitcher = page.locator('.language-switcher');
      await expect(languageSwitcher).toBeVisible();
      
      // For non-English, verify content is not just English
      if (code !== 'en') {
        const bodyText = await page.textContent('body');
        // Should not contain the English hero text
        expect(bodyText).not.toContain('Excellence, every time');
      }
    });
  });
});