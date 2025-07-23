const { test, expect } = require('@playwright/test');

test.describe('Translation Verification', () => {
  test('Spanish translation is complete', async ({ page }) => {
    await page.goto('/es/');
    const content = await page.textContent('body');
    
    // Should have Spanish content
    expect(content).toContain('Lanzamientos de IA');
    expect(content).toContain('Excelencia, siempre');
    expect(content).toContain('Características');
    
    // Should NOT have English navigation
    expect(content).not.toContain('Features');
    expect(content).not.toContain('Sign Up');
    
    console.log('✅ Spanish translation verified');
  });

  test('French translation is complete', async ({ page }) => {
    await page.goto('/fr/');
    const content = await page.textContent('body');
    
    // Should have French content
    expect(content).toContain('Versions d\'IA');
    expect(content).toContain('Excellence, à chaque fois');
    expect(content).toContain('Fonctionnalités');
    
    // Should NOT have English navigation
    expect(content).not.toContain('Features');
    expect(content).not.toContain('Sign Up');
    
    console.log('✅ French translation verified');
  });

  test('Korean translation is complete', async ({ page }) => {
    await page.goto('/ko/');
    const content = await page.textContent('body');
    
    // Should have Korean content
    expect(content).toContain('AI 릴리스');
    expect(content).toContain('완벽함 매번');
    expect(content).toContain('기능');
    
    // Should NOT have English navigation
    expect(content).not.toContain('Features');
    expect(content).not.toContain('Sign Up');
    
    console.log('✅ Korean translation verified');
  });

  test('Portuguese translation is complete', async ({ page }) => {
    await page.goto('/pt/');
    const content = await page.textContent('body');
    
    // Should have Portuguese content
    expect(content).toContain('Releases de IA');
    expect(content).toContain('Excelência sempre');
    expect(content).toContain('Recursos');
    
    // Should NOT have English navigation
    expect(content).not.toContain('Features');
    expect(content).not.toContain('Sign Up');
    
    console.log('✅ Portuguese translation verified');
  });

  test('All 13 languages are accessible', async ({ page }) => {
    const languages = [
      { code: 'en', url: '/' },
      { code: 'es', url: '/es/' },
      { code: 'fr', url: '/fr/' },
      { code: 'ar', url: '/ar/' },
      { code: 'ja', url: '/ja/' },
      { code: 'zh', url: '/zh/' },
      { code: 'it', url: '/it/' },
      { code: 'ru', url: '/ru/' },
      { code: 'de', url: '/de/' },
      { code: 'pt', url: '/pt/' },
      { code: 'ko', url: '/ko/' },
      { code: 'nl', url: '/nl/' },
      { code: 'hi', url: '/hi/' }
    ];

    for (const lang of languages) {
      const response = await page.goto(lang.url);
      expect(response.status()).toBe(200);
      
      // Check HTML lang attribute
      if (lang.code !== 'en') {
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe(lang.code);
      }
    }
    
    console.log('✅ All 13 languages are accessible');
  });
});