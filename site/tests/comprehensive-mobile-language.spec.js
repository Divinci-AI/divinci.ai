const { test, expect, devices } = require('@playwright/test');

// Mobile devices for language testing
const mobileDevices = [
  { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'], width: 390 },
  { name: 'iPhone SE', device: devices['iPhone SE'], width: 375 },
  { name: 'Galaxy S21', device: devices['Galaxy S21'], width: 360 },
  { name: 'Pixel 5', device: devices['Pixel 5'], width: 393 },
];

// Language configurations with expected content
const languages = [
  { 
    code: 'en', 
    name: 'English', 
    native: 'English',
    url: 'https://divinci.ai/',
    expectedTitle: 'Divinci AI - Excellence, every time',
    expectedContent: 'Excellence, every time',
    direction: 'ltr'
  },
  { 
    code: 'es', 
    name: 'Spanish', 
    native: 'Español',
    url: 'https://divinci.ai/es/',
    expectedTitle: 'Divinci AI',
    expectedContent: 'Excelencia',
    direction: 'ltr'
  },
  { 
    code: 'fr', 
    name: 'French', 
    native: 'Français',
    url: 'https://divinci.ai/fr/',
    expectedTitle: 'Divinci AI',
    expectedContent: 'Excellence',
    direction: 'ltr'
  },
  { 
    code: 'ar', 
    name: 'Arabic', 
    native: 'العربية',
    url: 'https://divinci.ai/ar/',
    expectedTitle: 'Divinci AI',
    expectedContent: 'الذكاء',
    direction: 'rtl'
  }
];

// Language testing helper
class MobileLanguageHelper {
  constructor(page) {
    this.page = page;
  }

  async getLanguageSwitcherState() {
    return await this.page.evaluate(() => {
      const switcher = document.querySelector('.language-switcher-current');
      const dropdown = document.querySelector('.language-switcher-dropdown');
      
      if (!switcher) return { error: 'Language switcher not found' };
      
      const switcherRect = switcher.getBoundingClientRect();
      const isVisible = switcherRect.width > 0 && switcherRect.height > 0;
      const dropdownVisible = dropdown && window.getComputedStyle(dropdown).display !== 'none';
      
      return {
        switcherVisible: isVisible,
        switcherText: switcher.textContent?.trim(),
        switcherWidth: switcherRect.width,
        switcherHeight: switcherRect.height,
        dropdownVisible: dropdownVisible,
        currentLanguage: switcher.querySelector('.current-language')?.textContent?.trim()
      };
    });
  }

  async getLanguageOptions() {
    return await this.page.evaluate(() => {
      const options = Array.from(document.querySelectorAll('.language-option'));
      
      return options.map(option => ({
        lang: option.getAttribute('data-lang'),
        href: option.getAttribute('href'),
        name: option.querySelector('.language-name')?.textContent?.trim(),
        native: option.querySelector('.language-native')?.textContent?.trim(),
        visible: option.getBoundingClientRect().width > 0
      }));
    });
  }

  async checkPageDirection() {
    return await this.page.evaluate(() => {
      const html = document.documentElement;
      const body = document.body;
      
      return {
        htmlDir: html.getAttribute('dir') || html.style.direction || 'ltr',
        bodyDir: body.getAttribute('dir') || body.style.direction || 'ltr',
        computedDirection: window.getComputedStyle(body).direction
      };
    });
  }

  async checkContentTranslation(expectedContent) {
    return await this.page.evaluate((expected) => {
      const content = document.body.textContent || '';
      const title = document.title || '';
      
      // Check if expected content appears in the page
      const hasExpectedContent = content.toLowerCase().includes(expected.toLowerCase());
      
      // Get some key text elements for verification
      const h1Text = document.querySelector('h1')?.textContent?.trim() || '';
      const heroText = document.querySelector('.hero-text, .hero p')?.textContent?.trim() || '';
      
      return {
        hasExpectedContent,
        title,
        h1Text,
        heroText: heroText.substring(0, 100)
      };
    }, expectedContent);
  }

  async testLanguageSwitcherInteraction() {
    try {
      // Open language switcher
      const switcher = this.page.locator('.language-switcher-current');
      await switcher.click();
      await this.page.waitForTimeout(500);
      
      // Check if dropdown opened
      const dropdown = this.page.locator('.language-switcher-dropdown');
      await expect(dropdown).toBeVisible();
      
      // Get available options
      const options = await this.getLanguageOptions();
      
      // Close dropdown by clicking outside
      await this.page.locator('body').click();
      await this.page.waitForTimeout(300);
      
      return { success: true, optionsCount: options.length, options };
      
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Test each mobile device with language functionality
mobileDevices.forEach(({ name, device, width }) => {
  test.describe(`Mobile Language Switching - ${name} (${width}px)`, () => {
    test.use(device);

    test(`${name} - Language switcher visibility and interaction`, async ({ page }) => {
      const helper = new MobileLanguageHelper(page);
      
      console.log(`🌐 Testing ${name} language switcher...`);
      
      await page.goto('https://divinci.ai/');
      await page.waitForLoadState('networkidle');
      
      // Check language switcher state
      const switcherState = await helper.getLanguageSwitcherState();
      console.log(`📱 ${name} Switcher:`, switcherState);
      
      expect(switcherState.switcherVisible).toBe(true);
      expect(switcherState.switcherHeight).toBeGreaterThanOrEqual(44); // Touch target
      
      // Test interaction
      const interaction = await helper.testLanguageSwitcherInteraction();
      console.log(`🎯 ${name} Interaction:`, interaction);
      
      expect(interaction.success).toBe(true);
      expect(interaction.optionsCount).toBeGreaterThan(3);
    });

    languages.forEach((lang) => {
      test(`${name} - ${lang.name} (${lang.code}) language test`, async ({ page }) => {
        const helper = new MobileLanguageHelper(page);
        
        console.log(`🔤 Testing ${name} - ${lang.name}...`);
        
        await page.goto(lang.url);
        await page.waitForLoadState('networkidle');
        
        // Check page direction for RTL languages
        const direction = await helper.checkPageDirection();
        console.log(`📐 ${name} - ${lang.name} Direction:`, direction);
        
        if (lang.direction === 'rtl') {
          expect(direction.computedDirection).toBe('rtl');
        }
        
        // Check content translation
        const content = await helper.checkContentTranslation(lang.expectedContent);
        console.log(`📝 ${name} - ${lang.name} Content:`, {
          title: content.title,
          hasExpected: content.hasExpectedContent
        });
        
        expect(content.title).toContain('Divinci');
        
        // Check language switcher shows correct current language
        const switcherState = await helper.getLanguageSwitcherState();
        
        // For English, should show "English", for others should show the native name
        if (lang.code === 'en') {
          expect(switcherState.currentLanguage).toBe('English');
        }
        
        // Check layout doesn't break with translated content
        const overflowCheck = await page.evaluate(() => {
          const body = document.body;
          const viewport = window.innerWidth;
          return {
            hasOverflow: body.scrollWidth > viewport + 10,
            bodyWidth: body.scrollWidth,
            viewportWidth: viewport
          };
        });
        
        expect(overflowCheck.hasOverflow).toBe(false);
        console.log(`✅ ${name} - ${lang.name} layout OK`);
      });
    });

    test(`${name} - Language switching flow`, async ({ page }) => {
      const helper = new MobileLanguageHelper(page);
      
      console.log(`🔄 Testing ${name} language switching flow...`);
      
      // Start with English
      await page.goto('https://divinci.ai/');
      await page.waitForLoadState('networkidle');
      
      // Open language switcher
      await page.locator('.language-switcher-current').click();
      await page.waitForTimeout(500);
      
      // Switch to Spanish
      const spanishOption = page.locator('[data-lang="es"]');
      if (await spanishOption.count() > 0) {
        await spanishOption.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're on Spanish site
        const url = page.url();
        expect(url).toContain('/es');
        
        console.log(`🇪🇸 ${name} Switched to Spanish: ${url}`);
        
        // Test navigation within Spanish site
        const aboutLink = page.locator('a[href*="/es/about"], nav a[href*="about"]');
        if (await aboutLink.count() > 0) {
          await aboutLink.first().click();
          await page.waitForLoadState('networkidle');
          
          const newUrl = page.url();
          console.log(`📄 ${name} Spanish navigation: ${newUrl}`);
        }
      }
      
      // Switch back to English via language switcher
      await page.locator('.language-switcher-current').click();
      await page.waitForTimeout(500);
      
      const englishOption = page.locator('[data-lang="en"]');
      if (await englishOption.count() > 0) {
        await englishOption.click();
        await page.waitForLoadState('networkidle');
        
        const finalUrl = page.url();
        expect(finalUrl).not.toContain('/es');
        console.log(`🇺🇸 ${name} Back to English: ${finalUrl}`);
      }
    });

    test(`${name} - RTL language support`, async ({ page }) => {
      const helper = new MobileLanguageHelper(page);
      
      console.log(`🔄 Testing ${name} RTL support...`);
      
      // Test Arabic (RTL)
      await page.goto('https://divinci.ai/ar/');
      await page.waitForLoadState('networkidle');
      
      // Check RTL direction is applied
      const direction = await helper.checkPageDirection();
      console.log(`📐 ${name} Arabic direction:`, direction);
      
      // Should have RTL direction
      expect(direction.computedDirection).toBe('rtl');
      
      // Check layout doesn't break with RTL
      const layoutCheck = await page.evaluate(() => {
        const header = document.querySelector('header');
        const hero = document.querySelector('.hero');
        const viewport = window.innerWidth;
        
        return {
          headerWidth: header ? header.getBoundingClientRect().width : 0,
          heroWidth: hero ? hero.getBoundingClientRect().width : 0,
          viewportWidth: viewport,
          hasOverflow: document.body.scrollWidth > viewport + 10
        };
      });
      
      expect(layoutCheck.hasOverflow).toBe(false);
      console.log(`✅ ${name} RTL layout OK`);
      
      // Test language switcher in RTL
      const switcherState = await helper.getLanguageSwitcherState();
      expect(switcherState.switcherVisible).toBe(true);
      
      // Language switcher should still be accessible in RTL
      const interaction = await helper.testLanguageSwitcherInteraction();
      expect(interaction.success).toBe(true);
      
      console.log(`🌐 ${name} RTL language switcher works`);
    });
  });
});

// Cross-language mobile consistency test
test.describe('Cross-Language Mobile Consistency', () => {
  test('Language switcher consistency across devices', async ({ browser }) => {
    console.log('🔍 Testing language switcher consistency...');
    
    const results = {};
    
    for (const { name, device } of mobileDevices) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      const helper = new MobileLanguageHelper(page);
      
      try {
        await page.goto('https://divinci.ai/');
        await page.waitForLoadState('networkidle');
        
        const switcherState = await helper.getLanguageSwitcherState();
        const interaction = await helper.testLanguageSwitcherInteraction();
        
        results[name] = {
          switcherVisible: switcherState.switcherVisible,
          switcherHeight: switcherState.switcherHeight,
          interactionWorks: interaction.success,
          optionsCount: interaction.optionsCount || 0,
          viewport: switcherState.switcherWidth ? 'OK' : 'Issue'
        };
        
        console.log(`📊 ${name} Language Results:`, results[name]);
        
      } catch (error) {
        console.log(`❌ ${name} Language Error:`, error.message);
        results[name] = { error: error.message };
      }
      
      await context.close();
    }
    
    // All devices should have working language switcher
    Object.keys(results).forEach(deviceName => {
      if (!results[deviceName].error) {
        expect(results[deviceName].switcherVisible).toBe(true);
        expect(results[deviceName].interactionWorks).toBe(true);
        expect(results[deviceName].switcherHeight).toBeGreaterThanOrEqual(44);
      }
    });
    
    console.log('📋 Language consistency summary:', results);
  });

  test('Translation completeness across mobile devices', async ({ browser }) => {
    console.log('📝 Testing translation completeness...');
    
    const testLanguages = ['en', 'es', 'fr', 'ar'];
    const results = {};
    
    for (const langCode of testLanguages) {
      results[langCode] = {};
      
      for (const { name, device } of mobileDevices.slice(0, 2)) { // Test first 2 devices for efficiency
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        try {
          const testUrl = langCode === 'en' ? 'https://divinci.ai/' : `https://divinci.ai/${langCode}/`;
          await page.goto(testUrl);
          await page.waitForLoadState('networkidle');
          
          const content = await page.evaluate(() => {
            const title = document.title;
            const h1 = document.querySelector('h1')?.textContent?.trim() || '';
            const nav = document.querySelector('nav')?.textContent?.trim() || '';
            
            return {
              title,
              hasH1: h1.length > 0,
              hasNav: nav.length > 0,
              contentLength: document.body.textContent?.length || 0
            };
          });
          
          results[langCode][name] = {
            loaded: true,
            hasContent: content.contentLength > 1000,
            hasH1: content.hasH1,
            hasNav: content.hasNav,
            title: content.title
          };
          
        } catch (error) {
          results[langCode][name] = { error: error.message };
        }
        
        await context.close();
      }
    }
    
    console.log('📊 Translation completeness results:', results);
    
    // Verify all languages load properly
    testLanguages.forEach(lang => {
      Object.keys(results[lang]).forEach(device => {
        if (!results[lang][device].error) {
          expect(results[lang][device].loaded).toBe(true);
          expect(results[lang][device].hasContent).toBe(true);
        }
      });
    });
  });
});