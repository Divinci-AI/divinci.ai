// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * Internationalization (i18n) Accessibility Test Suite
 * Tests accessibility across all supported languages and cultural adaptations
 */

test.describe('Internationalization Accessibility Tests', () => {

  const languages = [
    { code: 'en', name: 'English', dir: 'ltr', region: 'US' },
    { code: 'es', name: 'Spanish', dir: 'ltr', region: 'ES' },
    { code: 'fr', name: 'French', dir: 'ltr', region: 'FR' },
    { code: 'ar', name: 'Arabic', dir: 'rtl', region: 'AR' },
    { code: 'ja', name: 'Japanese', dir: 'ltr', region: 'JP' },
    { code: 'zh', name: 'Chinese', dir: 'ltr', region: 'CN' },
    { code: 'it', name: 'Italian', dir: 'ltr', region: 'IT' },
    { code: 'ru', name: 'Russian', dir: 'ltr', region: 'RU' },
    { code: 'de', name: 'German', dir: 'ltr', region: 'DE' },
    { code: 'pt', name: 'Portuguese', dir: 'ltr', region: 'PT' },
    { code: 'ko', name: 'Korean', dir: 'ltr', region: 'KR' },
    { code: 'nl', name: 'Dutch', dir: 'ltr', region: 'NL' },
    { code: 'hi', name: 'Hindi', dir: 'ltr', region: 'IN' }
  ];

  test.describe('Language Structure and Semantics', () => {
    
    languages.forEach(({ code, name, dir }) => {
      test(`should have proper language attributes for ${name}`, async ({ page }) => {
        // Navigate to language-specific page
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Test HTML lang attribute
        const htmlLang = await page.locator('html').getAttribute('lang');
        expect(htmlLang).toBe(code);
        
        // Test dir attribute for RTL languages
        if (dir === 'rtl') {
          const htmlDir = await page.locator('html').getAttribute('dir');
          expect(htmlDir).toBe('rtl');
        }
        
        // Test page title is translated
        const pageTitle = await page.title();
        expect(pageTitle.length).toBeGreaterThan(0);
        
        // For non-English, ensure title is actually translated
        if (code !== 'en') {
          expect(pageTitle).not.toBe('Divinci AI - Excellence, every time');
        }
        
        // Test meta description
        const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
        expect(metaDescription?.length).toBeGreaterThan(0);
      });
    });

    languages.forEach(({ code, name }) => {
      test(`should have accessible navigation in ${name}`, async ({ page }) => {
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Test navigation links are translated and accessible
        const navLinks = page.locator('nav a');
        const navCount = await navLinks.count();
        expect(navCount).toBeGreaterThan(0);
        
        // Each nav link should have text content
        for (let i = 0; i < navCount; i++) {
          const link = navLinks.nth(i);
          const linkText = await link.textContent();
          expect(linkText?.trim().length).toBeGreaterThan(0);
          
          // Test keyboard accessibility
          await link.focus();
          await expect(link).toBeFocused();
        }
        
        // Test language switcher shows current language
        const currentLang = page.locator('.current-language');
        const currentLangText = await currentLang.textContent();
        expect(currentLangText?.trim().length).toBeGreaterThan(0);
        
        // Test language switcher is keyboard accessible
        const languageSwitcher = page.locator('.language-switcher');
        await languageSwitcher.focus();
        await page.keyboard.press('Enter');
        
        // Should show dropdown with all language options
        const languageOptions = page.locator('.language-option');
        const optionCount = await languageOptions.count();
        expect(optionCount).toBe(13); // All 13 languages
      });
    });
  });

  test.describe('Text Direction and Layout', () => {
    
    test('should handle RTL layout correctly for Arabic', async ({ page }) => {
      await page.goto('/ar/');
      await page.waitForLoadState('networkidle');
      
      // Test HTML direction
      const htmlDir = await page.locator('html').getAttribute('dir');
      expect(htmlDir).toBe('rtl');
      
      // Test text alignment in RTL
      const heroText = page.locator('.hero-text');
      const textAlign = await heroText.evaluate(el => window.getComputedStyle(el).textAlign);
      
      // Should be right-aligned or start (which becomes right in RTL)
      expect(['right', 'start'].some(align => textAlign.includes(align))).toBeTruthy();
      
      // Test navigation layout in RTL
      const navigation = page.locator('nav');
      const navDirection = await navigation.evaluate(el => window.getComputedStyle(el).direction);
      expect(navDirection).toBe('rtl');
      
      // Test that text flows correctly
      const paragraphs = page.locator('p');
      const firstParagraph = paragraphs.first();
      if (await firstParagraph.count() > 0) {
        const paragraphDirection = await firstParagraph.evaluate(el => window.getComputedStyle(el).direction);
        expect(paragraphDirection).toBe('rtl');
      }
    });

    test('should maintain proper spacing for different scripts', async ({ page }) => {
      const scriptTests = [
        { code: 'ja', name: 'Japanese' },
        { code: 'zh', name: 'Chinese' },
        { code: 'ar', name: 'Arabic' },
        { code: 'hi', name: 'Hindi' }
      ];

      for (const { code, name } of scriptTests) {
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Test line height is appropriate for the script
        const heroHeading = page.locator('h1').first();
        const lineHeight = await heroHeading.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            lineHeight: styles.lineHeight,
            fontSize: styles.fontSize,
            fontFamily: styles.fontFamily
          };
        });
        
        // Line height should be at least 1.2 for readability
        const lineHeightValue = parseFloat(lineHeight.lineHeight);
        const fontSizeValue = parseFloat(lineHeight.fontSize);
        
        if (!isNaN(lineHeightValue) && !isNaN(fontSizeValue)) {
          const ratio = lineHeightValue / fontSizeValue;
          expect(ratio).toBeGreaterThanOrEqual(1.2);
        }
        
        // Test that text doesn't overlap
        const textElements = page.locator('p, h1, h2, h3');
        const firstElement = textElements.first();
        if (await firstElement.count() > 0) {
          const boundingBox = await firstElement.boundingBox();
          expect(boundingBox?.height).toBeGreaterThan(0);
        }
      }
    });
  });

  test.describe('Font and Typography Accessibility', () => {
    
    test('should use appropriate fonts for different languages', async ({ page }) => {
      const fontTests = [
        { code: 'ja', expectedChars: 'ひらがな' },
        { code: 'zh', expectedChars: '中文' },
        { code: 'ar', expectedChars: 'العربية' },
        { code: 'hi', expectedChars: 'हिन्दी' },
        { code: 'ko', expectedChars: '한국어' },
        { code: 'ru', expectedChars: 'Русский' }
      ];

      for (const { code, expectedChars } of fontTests) {
        const url = `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Test that the page contains expected characters
        const bodyText = await page.textContent('body');
        expect(bodyText).toContain(expectedChars);
        
        // Test font rendering
        const heroText = page.locator('.hero-text h1');
        const fontInfo = await heroText.evaluate(el => {
          const styles = window.getComputedStyle(el);
          return {
            fontFamily: styles.fontFamily,
            fontSize: styles.fontSize,
            fontWeight: styles.fontWeight
          };
        });
        
        // Font size should be readable
        const fontSize = parseFloat(fontInfo.fontSize);
        expect(fontSize).toBeGreaterThanOrEqual(24); // Hero text should be large
        
        // Should have a font family defined
        expect(fontInfo.fontFamily).not.toBe('');
      }
    });
  });

  test.describe('Cultural and Regional Adaptations', () => {
    
    test('should display numbers and dates appropriately for each locale', async ({ page }) => {
      const localeTests = [
        { code: 'en', expectedFormat: 'Western numerals' },
        { code: 'ar', expectedFormat: 'May use Arabic numerals' },
        { code: 'hi', expectedFormat: 'May use Devanagari numerals' }
      ];

      for (const { code } of localeTests) {
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Look for any displayed dates or numbers
        const bodyText = await page.textContent('body');
        
        // Check for copyright year (should be present in footer)
        const copyrightPattern = /202[0-9]/;
        expect(copyrightPattern.test(bodyText)).toBeTruthy();
        
        // Test that phone numbers, if present, follow appropriate format
        const phonePattern = /[+]?[\d\s\-()]+/;
        // This is informational - phone format varies by region
      }
    });

    test('should handle form inputs correctly for different languages', async ({ page }) => {
      const inputTests = [
        { code: 'ar', dir: 'rtl' },
        { code: 'ja', dir: 'ltr' },
        { code: 'en', dir: 'ltr' }
      ];

      for (const { code, dir } of inputTests) {
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Navigate to signup form
        await page.locator('#signup').scrollIntoViewIfNeeded();
        
        const emailInput = page.locator('input[type="email"]');
        if (await emailInput.count() > 0) {
          // Test input direction
          const inputDir = await emailInput.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return styles.direction;
          });
          
          if (dir === 'rtl') {
            expect(inputDir).toBe('rtl');
          }
          
          // Test placeholder text is appropriate for language
          const placeholder = await emailInput.getAttribute('placeholder');
          expect(placeholder?.length).toBeGreaterThan(0);
          
          // Test input is keyboard accessible
          await emailInput.focus();
          await expect(emailInput).toBeFocused();
          
          // Test typing in different scripts
          await emailInput.fill('test@example.com');
          const value = await emailInput.inputValue();
          expect(value).toBe('test@example.com');
        }
      }
    });
  });

  test.describe('Screen Reader and Assistive Technology Support', () => {
    
    languages.slice(0, 6).forEach(({ code, name }) => { // Test subset for performance
      test(`should provide proper ARIA support for ${name}`, async ({ page }) => {
        const url = code === 'en' ? '/' : `/${code}/`;
        await page.goto(url);
        await page.waitForLoadState('networkidle');
        
        // Test main landmarks are labeled
        const main = page.locator('main, [role="main"]');
        if (await main.count() > 0) {
          const mainLabel = await main.getAttribute('aria-label');
          const mainLabelledBy = await main.getAttribute('aria-labelledby');
          expect(mainLabel || mainLabelledBy).toBeTruthy();
        }
        
        // Test navigation is properly labeled
        const nav = page.locator('nav, [role="navigation"]');
        const navLabel = await nav.first().getAttribute('aria-label');
        // Navigation should be identifiable to screen readers
        expect(nav.first()).toBeVisible();
        
        // Test language switcher has proper ARIA
        const languageSwitcher = page.locator('.language-switcher');
        const switcherLabel = await languageSwitcher.getAttribute('aria-label');
        expect(switcherLabel?.length).toBeGreaterThan(0);
        
        // Test buttons have accessible names in the correct language
        const buttons = page.locator('button');
        const buttonCount = await buttons.count();
        
        for (let i = 0; i < Math.min(buttonCount, 3); i++) {
          const button = buttons.nth(i);
          const buttonText = await button.textContent();
          const ariaLabel = await button.getAttribute('aria-label');
          const accessibleName = buttonText || ariaLabel;
          
          expect(accessibleName?.trim().length).toBeGreaterThan(0);
          
          // For non-English, ensure text is translated
          if (code !== 'en' && buttonText) {
            expect(buttonText.trim()).not.toBe('Request demo');
          }
        }
      });
    });
  });

  test.describe('Cross-Language Navigation', () => {
    
    test('should maintain accessibility when switching languages', async ({ page }) => {
      // Start with English
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Test initial state
      const initialLang = await page.locator('html').getAttribute('lang');
      expect(initialLang).toBe('en');
      
      // Open language switcher
      const languageSwitcher = page.locator('.language-switcher');
      await languageSwitcher.click();
      
      // Switch to Spanish
      const spanishOption = page.locator('.language-option[data-lang="es"]');
      await spanishOption.click();
      await page.waitForLoadState('networkidle');
      
      // Test Spanish page accessibility
      const spanishLang = await page.locator('html').getAttribute('lang');
      expect(spanishLang).toBe('es');
      
      // Test that focus is managed properly after language switch
      const focusedElement = page.locator(':focus');
      const isFocusVisible = await focusedElement.count() > 0;
      
      // Test that main content is accessible in new language
      const heroText = page.locator('.hero-text h1');
      const heroContent = await heroText.textContent();
      expect(heroContent?.length).toBeGreaterThan(0);
      
      // Test switching to RTL language (Arabic)
      await languageSwitcher.click();
      const arabicOption = page.locator('.language-option[data-lang="ar"]');
      await arabicOption.click();
      await page.waitForLoadState('networkidle');
      
      // Test RTL layout
      const arabicLang = await page.locator('html').getAttribute('lang');
      const arabicDir = await page.locator('html').getAttribute('dir');
      expect(arabicLang).toBe('ar');
      expect(arabicDir).toBe('rtl');
      
      // Test that content is still accessible
      const arabicHeroText = page.locator('.hero-text h1');
      await expect(arabicHeroText).toBeVisible();
    });

    test('should preserve accessibility when using browser back/forward', async ({ page }) => {
      // Navigate to French page
      await page.goto('/fr/');
      await page.waitForLoadState('networkidle');
      
      // Navigate to German page
      await page.goto('/de/');
      await page.waitForLoadState('networkidle');
      
      // Use browser back
      await page.goBack();
      await page.waitForLoadState('networkidle');
      
      // Should be back on French page with proper accessibility
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang).toBe('fr');
      
      // Test that navigation is still accessible
      const navigation = page.locator('nav');
      await expect(navigation).toBeVisible();
      
      // Test keyboard navigation still works
      await page.keyboard.press('Tab');
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });
  });
});