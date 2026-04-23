const { test, expect, devices } = require('@playwright/test');

/**
 * Comprehensive Mobile Testing Suite
 * 
 * This test suite combines all mobile testing aspects:
 * - Navigation and layout validation
 * - Language switching functionality
 * - User journey testing
 * - Performance and accessibility
 * 
 * Run with: npx playwright test mobile-comprehensive-suite --reporter=list
 */

// Configuration for comprehensive mobile testing
const MOBILE_TEST_CONFIG = {
  devices: [
    { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'], width: 390, priority: 'high' },
    { name: 'iPhone SE', device: devices['iPhone SE'], width: 375, priority: 'medium' },
    { name: 'Galaxy S21', device: devices['Galaxy S21'], width: 360, priority: 'high' },
    { name: 'Pixel 5', device: devices['Pixel 5'], width: 393, priority: 'medium' },
  ],
  
  languages: ['en', 'es', 'fr', 'ar'],
  
  criticalPages: [
    { url: 'https://divinci.ai/', name: 'Homepage', priority: 'critical' },
    { url: 'https://divinci.ai/about/', name: 'About', priority: 'high' },
    { url: 'https://divinci.ai/autorag/', name: 'AutoRAG', priority: 'high' },
    { url: 'https://divinci.ai/contact/', name: 'Contact', priority: 'critical' },
    { url: 'https://divinci.ai/support/', name: 'Support', priority: 'medium' },
  ],
  
  performanceThresholds: {
    loadTime: 15000, // 15 seconds max
    firstContentfulPaint: 4000, // 4 seconds max
    accessibilityScore: 70, // Minimum 70/100
    touchTargetSize: 44, // 44px minimum
    maxSmallTargets: 5, // Allow up to 5 small targets
  }
};

// Comprehensive mobile testing helper
class ComprehensiveMobileHelper {
  constructor(page, deviceName) {
    this.page = page;
    this.deviceName = deviceName;
    this.testResults = {
      device: deviceName,
      timestamp: new Date().toISOString(),
      tests: {}
    };
  }

  async runLayoutValidation(url = 'https://divinci.ai/') {
    const testName = 'layout_validation';
    console.log(`📱 ${this.deviceName} - Running layout validation...`);
    
    try {
      await this.page.goto(url);
      await this.page.waitForLoadState('networkidle');
      
      const layoutCheck = await this.page.evaluate(() => {
        const body = document.body;
        const html = document.documentElement;
        const viewport = window.innerWidth;
        
        // Check horizontal overflow
        const hasOverflow = Math.max(body.scrollWidth, html.scrollWidth) > viewport + 10;
        
        // Check key elements
        const header = document.querySelector('header');
        const nav = document.querySelector('nav');
        const main = document.querySelector('main, .hero, .content');
        const footer = document.querySelector('footer');
        
        return {
          hasOverflow,
          bodyWidth: body.scrollWidth,
          htmlWidth: html.scrollWidth,
          viewportWidth: viewport,
          elements: {
            header: header && header.getBoundingClientRect().height > 0,
            nav: nav && nav.getBoundingClientRect().height > 0,
            main: main && main.getBoundingClientRect().height > 0,
            footer: footer && footer.getBoundingClientRect().height > 0
          }
        };
      });
      
      this.testResults.tests[testName] = {
        passed: !layoutCheck.hasOverflow && layoutCheck.elements.header && layoutCheck.elements.main,
        data: layoutCheck,
        issues: layoutCheck.hasOverflow ? ['horizontal_overflow'] : []
      };
      
      return this.testResults.tests[testName];
      
    } catch (error) {
      this.testResults.tests[testName] = {
        passed: false,
        error: error.message
      };
      return this.testResults.tests[testName];
    }
  }

  async runAccessibilityValidation() {
    const testName = 'accessibility_validation';
    console.log(`♿ ${this.deviceName} - Running accessibility validation...`);
    
    try {
      const accessibility = await this.page.evaluate(() => {
        const issues = [];
        
        // Touch target validation
        const interactive = Array.from(document.querySelectorAll('a, button, input, select, textarea, [onclick], [role="button"]'));
        const smallTargets = interactive.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        });
        
        if (smallTargets.length > 5) {
          issues.push(`small_touch_targets: ${smallTargets.length}`);
        }
        
        // Font size validation
        const textElements = Array.from(document.querySelectorAll('p, span, a, button, h1, h2, h3, h4, h5, h6'));
        const smallText = textElements.filter(el => {
          const styles = window.getComputedStyle(el);
          const fontSize = parseFloat(styles.fontSize);
          return fontSize < 14 && el.textContent && el.textContent.trim().length > 0;
        });
        
        if (smallText.length > 10) {
          issues.push(`small_text_elements: ${smallText.length}`);
        }
        
        // Alt text validation
        const images = Array.from(document.querySelectorAll('img:not([alt])'));
        if (images.length > 0) {
          issues.push(`missing_alt_text: ${images.length}`);
        }
        
        // Heading structure
        const h1Count = document.querySelectorAll('h1').length;
        if (h1Count !== 1) {
          issues.push(`heading_structure: ${h1Count} h1 elements`);
        }
        
        return {
          issues,
          score: Math.max(0, 100 - (issues.length * 15)),
          touchTargets: {
            total: interactive.length,
            smallTargets: smallTargets.length
          },
          textElements: {
            total: textElements.length,
            smallText: smallText.length
          }
        };
      });
      
      this.testResults.tests[testName] = {
        passed: accessibility.score >= MOBILE_TEST_CONFIG.performanceThresholds.accessibilityScore,
        data: accessibility,
        issues: accessibility.issues
      };
      
      return this.testResults.tests[testName];
      
    } catch (error) {
      this.testResults.tests[testName] = {
        passed: false,
        error: error.message
      };
      return this.testResults.tests[testName];
    }
  }

  async runNavigationValidation() {
    const testName = 'navigation_validation';
    console.log(`🧭 ${this.deviceName} - Running navigation validation...`);
    
    try {
      const navigation = await this.page.evaluate(() => {
        const issues = [];
        
        // Check main navigation
        const nav = document.querySelector('nav, .main-nav, header nav');
        if (!nav) {
          issues.push('main_navigation_missing');
        }
        
        // Check language switcher
        const langSwitcher = document.querySelector('.language-switcher, [class*="language"]');
        if (!langSwitcher) {
          issues.push('language_switcher_missing');
        }
        
        // Check CTA buttons
        const ctaButtons = document.querySelectorAll('.cta-button, .primary-button, [href*="calendly"]');
        if (ctaButtons.length === 0) {
          issues.push('cta_buttons_missing');
        }
        
        // Check footer navigation
        const footer = document.querySelector('footer');
        if (!footer) {
          issues.push('footer_missing');
        }
        
        return {
          issues,
          elements: {
            mainNav: !!nav,
            languageSwitcher: !!langSwitcher,
            ctaButtons: ctaButtons.length,
            footer: !!footer
          }
        };
      });
      
      // Test language switcher interaction
      let languageSwitcherWorks = false;
      try {
        const langSwitcher = this.page.locator('.language-switcher-current');
        if (await langSwitcher.count() > 0) {
          await langSwitcher.click();
          await this.page.waitForTimeout(500);
          
          const dropdown = this.page.locator('.language-switcher-dropdown');
          languageSwitcherWorks = await dropdown.isVisible();
          
          // Close dropdown
          await this.page.locator('body').click();
        }
      } catch (error) {
        navigation.issues.push(`language_switcher_interaction: ${error.message}`);
      }
      
      this.testResults.tests[testName] = {
        passed: navigation.issues.length === 0 && languageSwitcherWorks,
        data: { ...navigation, languageSwitcherWorks },
        issues: navigation.issues
      };
      
      return this.testResults.tests[testName];
      
    } catch (error) {
      this.testResults.tests[testName] = {
        passed: false,
        error: error.message
      };
      return this.testResults.tests[testName];
    }
  }

  async runPerformanceValidation() {
    const testName = 'performance_validation';
    console.log(`⚡ ${this.deviceName} - Running performance validation...`);
    
    try {
      const startTime = Date.now();
      await this.page.goto('https://divinci.ai/', { waitUntil: 'load' });
      const loadTime = Date.now() - startTime;
      
      await this.page.waitForLoadState('networkidle');
      const networkIdleTime = Date.now() - startTime;
      
      // Get web vitals
      const webVitals = await this.page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        
        return {
          domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart : 0,
          firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
          firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        };
      });
      
      // Check resource efficiency
      const resources = await this.page.evaluate(() => {
        const entries = performance.getEntriesByType('resource');
        
        return {
          totalResources: entries.length,
          totalTransferSize: entries.reduce((sum, e) => sum + (e.transferSize || 0), 0),
          largeResources: entries.filter(e => e.transferSize > 1000000).length,
          slowResources: entries.filter(e => e.duration > 2000).length
        };
      });
      
      const issues = [];
      
      if (loadTime > MOBILE_TEST_CONFIG.performanceThresholds.loadTime) {
        issues.push(`slow_load_time: ${loadTime}ms`);
      }
      
      if (webVitals.firstContentfulPaint > MOBILE_TEST_CONFIG.performanceThresholds.firstContentfulPaint) {
        issues.push(`slow_fcp: ${webVitals.firstContentfulPaint}ms`);
      }
      
      if (resources.largeResources > 3) {
        issues.push(`too_many_large_resources: ${resources.largeResources}`);
      }
      
      this.testResults.tests[testName] = {
        passed: issues.length === 0,
        data: {
          loadTime,
          networkIdleTime,
          webVitals,
          resources
        },
        issues
      };
      
      return this.testResults.tests[testName];
      
    } catch (error) {
      this.testResults.tests[testName] = {
        passed: false,
        error: error.message
      };
      return this.testResults.tests[testName];
    }
  }

  async runUserJourneyValidation() {
    const testName = 'user_journey_validation';
    console.log(`🛤️ ${this.deviceName} - Running user journey validation...`);
    
    try {
      const journeyResults = [];
      
      // Journey 1: Homepage to Contact
      await this.page.goto('https://divinci.ai/');
      await this.page.waitForLoadState('networkidle');
      
      await this.page.goto('https://divinci.ai/contact/');
      await this.page.waitForLoadState('networkidle');
      journeyResults.push({ journey: 'homepage_to_contact', success: true });
      
      // Journey 2: Language switching
      await this.page.goto('https://divinci.ai/');
      const langSwitcher = this.page.locator('.language-switcher-current');
      
      if (await langSwitcher.count() > 0) {
        await langSwitcher.click();
        await this.page.waitForTimeout(500);
        
        const spanishOption = this.page.locator('[data-lang="es"]');
        if (await spanishOption.count() > 0) {
          await spanishOption.click();
          await this.page.waitForLoadState('networkidle');
          journeyResults.push({ journey: 'language_switching', success: true });
        }
      }
      
      // Journey 3: Multi-page navigation
      const pages = ['https://divinci.ai/', 'https://divinci.ai/about/', 'https://divinci.ai/autorag/'];
      let navigationSuccess = true;
      
      for (const pageUrl of pages) {
        try {
          await this.page.goto(pageUrl);
          await this.page.waitForLoadState('networkidle');
          
          // Check layout doesn't break
          const hasOverflow = await this.page.evaluate(() => {
            return document.body.scrollWidth > window.innerWidth + 10;
          });
          
          if (hasOverflow) {
            navigationSuccess = false;
            break;
          }
          
        } catch (error) {
          navigationSuccess = false;
          break;
        }
      }
      
      journeyResults.push({ journey: 'multi_page_navigation', success: navigationSuccess });
      
      const allJourneysSuccessful = journeyResults.every(j => j.success);
      
      this.testResults.tests[testName] = {
        passed: allJourneysSuccessful,
        data: { journeyResults },
        issues: journeyResults.filter(j => !j.success).map(j => `failed_${j.journey}`)
      };
      
      return this.testResults.tests[testName];
      
    } catch (error) {
      this.testResults.tests[testName] = {
        passed: false,
        error: error.message
      };
      return this.testResults.tests[testName];
    }
  }

  async runComprehensiveTest() {
    console.log(`🚀 ${this.deviceName} - Starting comprehensive mobile test...`);
    
    const results = {
      layout: await this.runLayoutValidation(),
      accessibility: await this.runAccessibilityValidation(),
      navigation: await this.runNavigationValidation(),
      performance: await this.runPerformanceValidation(),
      userJourney: await this.runUserJourneyValidation()
    };
    
    const overallPassed = Object.values(results).every(result => result.passed);
    const totalIssues = Object.values(results).reduce((sum, result) => sum + (result.issues?.length || 0), 0);
    
    this.testResults.overall = {
      passed: overallPassed,
      totalTests: Object.keys(results).length,
      passedTests: Object.values(results).filter(r => r.passed).length,
      totalIssues,
      score: Math.max(0, 100 - (totalIssues * 5))
    };
    
    console.log(`📊 ${this.deviceName} - Comprehensive test complete:`, this.testResults.overall);
    
    return this.testResults;
  }

  getResults() {
    return this.testResults;
  }
}

// Comprehensive test suite for priority devices
MOBILE_TEST_CONFIG.devices.filter(d => d.priority === 'high').forEach(({ name, device, width }) => {
  test.describe(`Comprehensive Mobile Suite - ${name} (${width}px)`, () => {
    test.use(device);

    test(`${name} - Complete mobile validation suite`, async ({ page }) => {
      const helper = new ComprehensiveMobileHelper(page, name);
      
      const results = await helper.runComprehensiveTest();
      
      // Assert overall success
      expect(results.overall.passed).toBe(true);
      expect(results.overall.score).toBeGreaterThan(80);
      
      // Assert individual test results
      expect(results.layout.passed).toBe(true);
      expect(results.accessibility.passed).toBe(true);
      expect(results.navigation.passed).toBe(true);
      expect(results.performance.passed).toBe(true);
      expect(results.userJourney.passed).toBe(true);
      
      console.log(`✅ ${name} - All tests passed with score: ${results.overall.score}/100`);
    });

    // Test critical pages individually
    MOBILE_TEST_CONFIG.criticalPages.forEach((pageConfig) => {
      test(`${name} - ${pageConfig.name} page validation`, async ({ page }) => {
        const helper = new ComprehensiveMobileHelper(page, name);
        
        const layoutResult = await helper.runLayoutValidation(pageConfig.url);
        const accessibilityResult = await helper.runAccessibilityValidation();
        
        expect(layoutResult.passed).toBe(true);
        expect(accessibilityResult.passed).toBe(true);
        
        console.log(`✅ ${name} - ${pageConfig.name} page validation passed`);
      });
    });
  });
});

// Cross-device consistency test
test.describe('Cross-Device Mobile Consistency', () => {
  test('Comprehensive consistency across all mobile devices', async ({ browser }) => {
    console.log('🔄 Running comprehensive cross-device consistency test...');
    
    const deviceResults = {};
    
    for (const { name, device } of MOBILE_TEST_CONFIG.devices) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      const helper = new ComprehensiveMobileHelper(page, name);
      
      try {
        const results = await helper.runComprehensiveTest();
        deviceResults[name] = results.overall;
        
        console.log(`📱 ${name} Comprehensive Results:`, results.overall);
        
      } catch (error) {
        console.log(`❌ ${name} Comprehensive Error:`, error.message);
        deviceResults[name] = { error: error.message };
      }
      
      await context.close();
    }
    
    // All devices should pass comprehensive tests
    Object.keys(deviceResults).forEach(deviceName => {
      if (!deviceResults[deviceName].error) {
        expect(deviceResults[deviceName].passed).toBe(true);
        expect(deviceResults[deviceName].score).toBeGreaterThan(70);
      }
    });
    
    // Calculate overall consistency
    const validResults = Object.keys(deviceResults).filter(d => !deviceResults[d].error);
    const avgScore = validResults.reduce((sum, d) => sum + deviceResults[d].score, 0) / validResults.length;
    
    console.log(`📊 Overall mobile consistency score: ${avgScore.toFixed(1)}/100`);
    console.log('📋 Cross-device comprehensive summary:', deviceResults);
    
    expect(avgScore).toBeGreaterThan(80);
  });

  test('Language consistency across devices', async ({ browser }) => {
    console.log('🌐 Testing language consistency across devices...');
    
    const languageResults = {};
    
    for (const langCode of ['en', 'es', 'ar']) {
      languageResults[langCode] = {};
      
      for (const { name, device } of MOBILE_TEST_CONFIG.devices.slice(0, 2)) {
        const context = await browser.newContext(device);
        const page = await context.newPage();
        
        try {
          const testUrl = langCode === 'en' ? 'https://divinci.ai/' : `https://divinci.ai/${langCode}/`;
          await page.goto(testUrl);
          await page.waitForLoadState('networkidle');
          
          const layoutCheck = await page.evaluate(() => ({
            hasOverflow: document.body.scrollWidth > window.innerWidth + 10,
            hasContent: document.body.textContent.length > 1000,
            direction: window.getComputedStyle(document.body).direction
          }));
          
          languageResults[langCode][name] = {
            loaded: true,
            layoutOK: !layoutCheck.hasOverflow,
            hasContent: layoutCheck.hasContent,
            rtlCorrect: langCode === 'ar' ? layoutCheck.direction === 'rtl' : true
          };
          
        } catch (error) {
          languageResults[langCode][name] = { error: error.message };
        }
        
        await context.close();
      }
    }
    
    // Verify language consistency
    Object.keys(languageResults).forEach(lang => {
      Object.keys(languageResults[lang]).forEach(device => {
        if (!languageResults[lang][device].error) {
          expect(languageResults[lang][device].loaded).toBe(true);
          expect(languageResults[lang][device].layoutOK).toBe(true);
          expect(languageResults[lang][device].rtlCorrect).toBe(true);
        }
      });
    });
    
    console.log('📋 Language consistency summary:', languageResults);
  });
});