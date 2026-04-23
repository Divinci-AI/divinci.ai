// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Language Switching E2E Test Suite
 * Tests bidirectional language navigation and translation completeness
 */

test.describe('Language Switching and Translation Tests', () => {

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', expectedTitle: 'Divinci AI - Excellence, every time' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', expectedTitle: 'Divinci AI - Excelencia, siempre' },
    { code: 'fr', name: 'French', nativeName: 'Français', expectedTitle: 'Divinci AI - Excellence, à chaque fois' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', expectedTitle: 'Divinci AI - التميز، في كل مرة', dir: 'rtl' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', expectedTitle: 'Divinci AI - 常に優秀' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', expectedTitle: 'Divinci AI - 卓越，每一次' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', expectedTitle: 'Divinci AI - Eccellenza, ogni volta' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', expectedTitle: 'Divinci AI - Совершенство, каждый раз' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', expectedTitle: 'Divinci AI - Exzellenz, jedes Mal' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português', expectedTitle: 'Divinci AI - Excelência, sempre' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', expectedTitle: 'Divinci AI - 매번 우수함' },
    { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', expectedTitle: 'Divinci AI - Uitmuntendheid, elke keer' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', expectedTitle: 'Divinci AI - हर बार उत्कृष्टता' }
  ];

  test.beforeEach(async ({ page }) => {
    // Start with English homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Language Switcher Functionality', () => {
    
    test('should display all 13 languages in the language switcher', async ({ page }) => {
      // Open language switcher
      const languageSwitcher = page.locator('.language-switcher');
      await languageSwitcher.click();
      
      // Verify all language options are present
      for (const lang of languages) {
        const languageOption = page.locator(`[data-lang="${lang.code}"]`);
        await expect(languageOption).toBeVisible();
        
        // Check that the native name is displayed
        const optionText = await languageOption.textContent();
        expect(optionText?.trim()).toContain(lang.nativeName);
      }
    });

    test('should show correct current language in switcher', async ({ page }) => {
      // Test starting language (English)
      const currentLanguage = page.locator('.current-language');
      await expect(currentLanguage).toContainText('English');
      
      // Switch to Spanish and verify
      await page.locator('.language-switcher').click();
      await page.locator('[data-lang="es"]').click();
      await page.waitForLoadState('networkidle');
      
      const updatedCurrentLanguage = page.locator('.current-language');
      await expect(updatedCurrentLanguage).toContainText('Español');
    });

    test('should maintain language switcher accessibility', async ({ page }) => {
      const languageSwitcher = page.locator('.language-switcher');
      
      // Test keyboard accessibility
      await languageSwitcher.focus();
      await expect(languageSwitcher).toBeFocused();
      
      // Test ARIA label
      const ariaLabel = await languageSwitcher.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      
      // Test dropdown functionality with keyboard
      await page.keyboard.press('Enter');
      const dropdown = page.locator('.language-dropdown');
      await expect(dropdown).toBeVisible();
    });
  });

  test.describe('Bidirectional Language Switching', () => {
    
    test('should switch from English to each language and back', async ({ page }) => {
      for (const targetLang of languages.slice(1, 6)) { // Test first 5 for performance
        // Navigate to target language
        await page.locator('.language-switcher').click();
        await page.locator(`[data-lang="${targetLang.code}"]`).click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're on the correct language page
        const url = page.url();
        if (targetLang.code === 'en') {
          expect(url).toMatch(/\/$|\/en\//);
        } else {
          expect(url).toContain(`/${targetLang.code}/`);
        }
        
        // Verify HTML lang attribute
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe(targetLang.code);
        
        // Verify page title is translated
        const pageTitle = await page.title();
        expect(pageTitle).toContain('Divinci AI');
        expect(pageTitle).not.toBe('Divinci AI - Excellence, every time'); // Not English
        
        // Switch back to English
        await page.locator('.language-switcher').click();
        await page.locator('[data-lang="en"]').click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're back to English
        const englishUrl = page.url();
        expect(englishUrl).toMatch(/\/$|\/en\//);
        
        const englishLang = await page.locator('html').getAttribute('lang');
        expect(englishLang).toBe('en');
      }
    });

    test('should preserve page state when switching languages', async ({ page }) => {
      // Scroll to a specific section
      await page.locator('#features').scrollIntoViewIfNeeded();
      
      // Switch to Spanish
      await page.locator('.language-switcher').click();
      await page.locator('[data-lang="es"]').click();
      await page.waitForLoadState('networkidle');
      
      // Verify the features section is still present (translated)
      const featuresSection = page.locator('#features');
      await expect(featuresSection).toBeVisible();
      
      // Switch back to English
      await page.locator('.language-switcher').click();
      await page.locator('[data-lang="en"]').click();
      await page.waitForLoadState('networkidle');
      
      // Verify features section is still there
      await expect(page.locator('#features')).toBeVisible();
    });

    test('should handle rapid language switching', async ({ page }) => {
      const testLanguages = ['es', 'fr', 'ja', 'en'];
      
      for (const langCode of testLanguages) {
        await page.locator('.language-switcher').click();
        await page.locator(`[data-lang="${langCode}"]`).click();
        await page.waitForLoadState('networkidle');
        
        // Quick verification that page loaded correctly
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe(langCode);
        
        // Verify main content is present
        const heroSection = page.locator('.hero');
        await expect(heroSection).toBeVisible();
      }
    });
  });

  test.describe('Translation Completeness Verification', () => {
    
    languages.forEach(({ code, name, expectedTitle, dir }) => {
      test(`should have complete translations for ${name}`, async ({ page }) => {
        // Navigate to language page
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Verify page title is translated
        const pageTitle = await page.title();
        expect(pageTitle).toBeTruthy();
        expect(pageTitle.length).toBeGreaterThan(0);
        
        // For non-English, verify it's actually translated
        if (code !== 'en') {
          expect(pageTitle).not.toBe('Divinci AI - Excellence, every time');
        }
        
        // Verify HTML attributes
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe(code);
        
        if (dir === 'rtl') {
          const htmlDir = await page.locator('html').getAttribute('dir');
          expect(htmlDir).toBe('rtl');
        }
        
        // Test navigation elements are translated
        const navLinks = page.locator('nav a');
        const navCount = await navLinks.count();
        expect(navCount).toBeGreaterThan(0);
        
        // Check specific navigation items
        const featuresLink = page.locator('nav a[href="#features"]');
        if (await featuresLink.count() > 0) {
          const featuresText = await featuresLink.textContent();
          expect(featuresText?.trim().length).toBeGreaterThan(0);
          
          // For non-English, verify it's translated
          if (code !== 'en') {
            expect(featuresText?.trim()).not.toBe('Features');
          }
        }
        
        // Test hero section content
        const heroHeading = page.locator('.hero h1, h1').first();
        if (await heroHeading.count() > 0) {
          const heroText = await heroHeading.textContent();
          expect(heroText?.trim().length).toBeGreaterThan(0);
          
          // Verify it contains content and is not just placeholder
          expect(heroText?.trim()).not.toBe('');
          expect(heroText?.trim()).not.toBe('undefined');
        }
        
        // Test main content sections exist
        const mainSections = ['.hero', '.features-section', '.team-section'];
        for (const sectionSelector of mainSections) {
          const section = page.locator(sectionSelector);
          if (await section.count() > 0) {
            await expect(section).toBeVisible();
          }
        }
        
        // Test footer content
        const footer = page.locator('footer');
        if (await footer.count() > 0) {
          const footerText = await footer.textContent();
          expect(footerText?.length).toBeGreaterThan(0);
        }
        
        // Test buttons and CTAs are translated
        const buttons = page.locator('button, .cta-button, .btn');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = buttons.nth(i);
          if (await button.isVisible()) {
            const buttonText = await button.textContent();
            expect(buttonText?.trim().length).toBeGreaterThan(0);
            
            // For non-English, verify common buttons are translated
            if (code !== 'en' && buttonText) {
              expect(buttonText.trim()).not.toBe('Request demo');
              expect(buttonText.trim()).not.toBe('Sign up');
              expect(buttonText.trim()).not.toBe('Learn more');
            }
          }
        }
      });
    });

    test('should have consistent content structure across all languages', async ({ page }) => {
      const contentChecks = [];
      
      // Collect content structure from each language
      for (const { code } of languages.slice(0, 8)) { // Test first 8 for performance
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        const structure = {
          language: code,
          hasHero: await page.locator('.hero, h1').count() > 0,
          hasNavigation: await page.locator('nav').count() > 0,
          hasFooter: await page.locator('footer').count() > 0,
          hasLanguageSwitcher: await page.locator('.language-switcher').count() > 0,
          buttonCount: await page.locator('button, .cta-button, .btn').count(),
          linkCount: await page.locator('a').count(),
          headingCount: await page.locator('h1, h2, h3').count()
        };
        
        contentChecks.push(structure);
      }
      
      // Verify all languages have consistent structure
      const baseStructure = contentChecks[0]; // English as reference
      
      for (const structure of contentChecks.slice(1)) {
        expect(structure.hasHero).toBe(baseStructure.hasHero);
        expect(structure.hasNavigation).toBe(baseStructure.hasNavigation);
        expect(structure.hasFooter).toBe(baseStructure.hasFooter);
        expect(structure.hasLanguageSwitcher).toBe(baseStructure.hasLanguageSwitcher);
        
        // Allow some variance in counts but they should be similar
        expect(Math.abs(structure.buttonCount - baseStructure.buttonCount)).toBeLessThanOrEqual(2);
        expect(Math.abs(structure.linkCount - baseStructure.linkCount)).toBeLessThanOrEqual(5);
        expect(Math.abs(structure.headingCount - baseStructure.headingCount)).toBeLessThanOrEqual(3);
      }
    });
  });

  test.describe('URL Routing and Persistence', () => {
    
    test('should maintain correct URLs for each language', async ({ page }) => {
      for (const { code, name } of languages.slice(0, 6)) { // Test subset
        const expectedUrl = code === 'en' ? '/' : `/${code}/`;
        
        await page.goto(expectedUrl);
        await page.waitForLoadState('networkidle');
        
        // Verify URL is correct
        const currentUrl = page.url();
        expect(currentUrl).toMatch(new RegExp(`${expectedUrl}$`));
        
        // Verify page loads correctly
        const heroSection = page.locator('.hero, h1');
        await expect(heroSection.first()).toBeVisible();
        
        // Verify language attribute matches
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe(code);
      }
    });

    test('should handle browser back/forward with language switching', async ({ page }) => {
      // Start with English
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Navigate to Spanish
      await page.goto('/es/');
      await page.waitForLoadState('networkidle');
      
      // Navigate to French
      await page.goto('/fr/');
      await page.waitForLoadState('networkidle');
      
      // Use browser back to Spanish
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      let htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('es');
      
      // Use browser back to English
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('en');
      
      // Use browser forward to Spanish
      await page.goForward();
      await page.waitForLoadState('networkidle');
      
      htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBe('es');
    });

    test('should handle direct URL access for all languages', async ({ page }) => {
      const directAccessTests = [
        { url: '/', expectedLang: 'en' },
        { url: '/es/', expectedLang: 'es' },
        { url: '/fr/', expectedLang: 'fr' },
        { url: '/ar/', expectedLang: 'ar' },
        { url: '/ja/', expectedLang: 'ja' }
      ];
      
      for (const { url, expectedLang } of directAccessTests) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Verify language is correct
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe(expectedLang);
        
        // Verify content loads
        const mainContent = page.locator('.hero, h1, main');
        await expect(mainContent.first()).toBeVisible();
        
        // Verify language switcher shows correct current language
        const currentLangText = await page.locator('.current-language').textContent();
        expect(currentLangText?.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Cross-Language Content Validation', () => {
    
    test('should have translated hero sections for all languages', async ({ page }) => {
      const heroTexts = {};
      
      // Collect hero text from each language
      for (const { code } of languages.slice(0, 8)) { // Test subset for performance
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        const heroHeading = page.locator('.hero h1, h1').first();
        if (await heroHeading.count() > 0) {
          const heroText = await heroHeading.textContent();
          heroTexts[code] = heroText?.trim() || '';
        }
      }
      
      // Verify each language has unique hero text
      const englishHero = heroTexts['en'];
      expect(englishHero.length).toBeGreaterThan(0);
      
      for (const [langCode, heroText] of Object.entries(heroTexts)) {
        if (langCode !== 'en') {
          expect(heroText.length).toBeGreaterThan(0);
          expect(heroText).not.toBe(englishHero); // Should be translated
        }
      }
    });

    test('should have working language switcher on all language pages', async ({ page }) => {
      for (const { code } of languages.slice(0, 6)) { // Test subset
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Test language switcher functionality
        const languageSwitcher = page.locator('.language-switcher');
        await expect(languageSwitcher).toBeVisible();
        
        // Test switching to another language from current page
        await languageSwitcher.click();
        
        const targetLang = code === 'en' ? 'es' : 'en';
        const targetOption = page.locator(`[data-lang="${targetLang}"]`);
        await expect(targetOption).toBeVisible();
        
        await targetOption.click();
        await page.waitForLoadState('networkidle');
        
        // Verify switch was successful
        const newLang = await page.locator('html').getAttribute('lang');
        expect(newLang).toBe(targetLang);
      }
    });
  });
});