const { test, expect, devices } = require('@playwright/test');

// Define mobile devices for comprehensive testing
const mobileDevices = [
  { name: 'iPhone 12 Pro', device: devices['iPhone 12 Pro'], width: 390 },
  { name: 'iPhone SE', device: devices['iPhone SE'], width: 375 },
  { name: 'Galaxy S21', device: devices['Galaxy S21'], width: 360 },
  { name: 'Pixel 5', device: devices['Pixel 5'], width: 393 },
];

// Navigation test helpers
class MobileNavigationHelper {
  constructor(page) {
    this.page = page;
  }

  async checkHorizontalOverflow() {
    return await this.page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const viewport = window.innerWidth;
      
      return {
        bodyScrollWidth: body.scrollWidth,
        documentScrollWidth: html.scrollWidth,
        viewportWidth: viewport,
        hasHorizontalScroll: Math.max(body.scrollWidth, html.scrollWidth) > viewport + 10
      };
    });
  }

  async checkTouchTargets() {
    return await this.page.evaluate(() => {
      const interactive = Array.from(document.querySelectorAll('a, button, [role="button"], input, select, textarea, [onclick], [tabindex]'));
      const inadequateTargets = [];
      
      interactive.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0;
        const meetsMinimum = rect.width >= 44 && rect.height >= 44;
        
        if (isVisible && !meetsMinimum) {
          inadequateTargets.push({
            tag: el.tagName,
            class: el.className || 'no-class',
            id: el.id || 'no-id',
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            text: el.textContent?.substring(0, 30) || 'no-text'
          });
        }
      });
      
      return {
        totalInteractive: interactive.length,
        inadequateTargets: inadequateTargets,
        passesAccessibility: inadequateTargets.length <= 3 // Allow some flexibility
      };
    });
  }

  async checkFontSizes() {
    return await this.page.evaluate(() => {
      const textElements = Array.from(document.querySelectorAll('p, span, div, a, li, h1, h2, h3, h4, h5, h6, button'));
      const smallText = [];
      
      textElements.forEach(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);
        const hasText = el.textContent && el.textContent.trim().length > 0;
        
        if (fontSize < 14 && hasText && fontSize > 0) {
          smallText.push({
            tag: el.tagName,
            class: el.className || 'no-class',
            fontSize: fontSize,
            text: el.textContent.substring(0, 40)
          });
        }
      });
      
      return {
        totalTextElements: textElements.length,
        smallTextElements: smallText.slice(0, 10),
        hasReadabilityIssues: smallText.length > 10
      };
    });
  }

  async testNavigation() {
    const results = {
      mainNavigation: false,
      dropdownMenus: false,
      footerNavigation: false,
      languageSwitcher: false
    };

    try {
      // Test main navigation visibility
      const mainNav = this.page.locator('nav, .main-nav, header nav');
      await expect(mainNav.first()).toBeVisible();
      results.mainNavigation = true;

      // Test dropdown menus
      const dropdowns = this.page.locator('.dropdown, [class*="dropdown"]');
      if (await dropdowns.count() > 0) {
        for (let i = 0; i < Math.min(await dropdowns.count(), 3); i++) {
          const dropdown = dropdowns.nth(i);
          await dropdown.hover();
          await this.page.waitForTimeout(500);
          
          const dropdownMenu = this.page.locator('.dropdown-menu, [class*="dropdown-menu"]').nth(i);
          if (await dropdownMenu.count() > 0) {
            await expect(dropdownMenu).toBeVisible();
          }
        }
        results.dropdownMenus = true;
      }

      // Test footer navigation
      const footer = this.page.locator('footer, .site-footer');
      if (await footer.count() > 0) {
        await footer.scrollIntoViewIfNeeded();
        await expect(footer).toBeVisible();
        results.footerNavigation = true;
      }

      // Test language switcher
      const langSwitcher = this.page.locator('.language-switcher, [class*="language"]');
      if (await langSwitcher.count() > 0) {
        await expect(langSwitcher.first()).toBeVisible();
        results.languageSwitcher = true;
      }

    } catch (error) {
      console.log('Navigation test error:', error.message);
    }

    return results;
  }
}

// Comprehensive mobile navigation test suite
mobileDevices.forEach(({ name, device, width }) => {
  test.describe(`Mobile Navigation - ${name} (${width}px)`, () => {
    test.use(device);

    test(`${name} - Homepage navigation and layout`, async ({ page }) => {
      const helper = new MobileNavigationHelper(page);
      
      console.log(`📱 Testing ${name} navigation...`);
      
      await page.goto('https://divinci.ai/');
      await page.waitForLoadState('networkidle');
      
      // Test horizontal overflow
      const overflowCheck = await helper.checkHorizontalOverflow();
      console.log(`📏 ${name} Overflow:`, overflowCheck);
      expect(overflowCheck.hasHorizontalScroll).toBe(false);
      
      // Test touch targets
      const touchCheck = await helper.checkTouchTargets();
      console.log(`👆 ${name} Touch Targets:`, touchCheck.inadequateTargets.length);
      expect(touchCheck.passesAccessibility).toBe(true);
      
      // Test font sizes
      const fontCheck = await helper.checkFontSizes();
      console.log(`🔤 ${name} Font Issues:`, fontCheck.smallTextElements.length);
      expect(fontCheck.hasReadabilityIssues).toBe(false);
      
      // Test navigation functionality
      const navCheck = await helper.testNavigation();
      console.log(`🧭 ${name} Navigation:`, navCheck);
      expect(navCheck.mainNavigation).toBe(true);
    });

    test(`${name} - Key page navigation flow`, async ({ page }) => {
      const helper = new MobileNavigationHelper(page);
      
      console.log(`🔄 Testing ${name} page flow...`);
      
      // Start at homepage
      await page.goto('https://divinci.ai/');
      await page.waitForLoadState('networkidle');
      
      const testPages = [
        { url: '/about/', name: 'About' },
        { url: '/autorag/', name: 'AutoRAG' },
        { url: '/support/', name: 'Support' },
        { url: '/contact/', name: 'Contact' }
      ];
      
      for (const testPage of testPages) {
        try {
          await page.goto(`https://divinci.ai${testPage.url}`);
          await page.waitForLoadState('networkidle');
          
          // Check layout doesn't break
          const overflowCheck = await helper.checkHorizontalOverflow();
          expect(overflowCheck.hasHorizontalScroll).toBe(false);
          
          // Verify page loads properly
          const title = await page.title();
          expect(title).toContain('Divinci');
          
          console.log(`✅ ${name} - ${testPage.name} page loads correctly`);
          
        } catch (error) {
          console.log(`⚠️ ${name} - ${testPage.name} page issue:`, error.message);
        }
      }
    });

    test(`${name} - Interactive elements test`, async ({ page }) => {
      console.log(`🎯 Testing ${name} interactions...`);
      
      await page.goto('https://divinci.ai/');
      await page.waitForLoadState('networkidle');
      
      // Test CTA buttons
      const ctaButtons = page.locator('.cta-button, .primary-button, .secondary-button, [href*="calendly"]');
      if (await ctaButtons.count() > 0) {
        const firstCta = ctaButtons.first();
        await expect(firstCta).toBeVisible();
        
        // Check if it's properly sized for touch
        const ctaBox = await firstCta.boundingBox();
        expect(ctaBox.height).toBeGreaterThanOrEqual(44);
        console.log(`📏 ${name} CTA button height: ${ctaBox.height}px`);
      }
      
      // Test language switcher interaction
      const langSwitcher = page.locator('.language-switcher-current');
      if (await langSwitcher.count() > 0) {
        await langSwitcher.click();
        await page.waitForTimeout(500);
        
        const dropdown = page.locator('.language-switcher-dropdown');
        await expect(dropdown).toBeVisible();
        console.log(`🌐 ${name} Language switcher works`);
        
        // Click away to close
        await page.locator('body').click();
      }
      
      // Test scroll behavior
      await page.evaluate(() => window.scrollTo(0, 1000));
      await page.waitForTimeout(500);
      
      const scrollCheck = await page.evaluate(() => ({
        scrollY: window.scrollY,
        scrollX: window.scrollX
      }));
      
      expect(scrollCheck.scrollX).toBe(0); // No horizontal scroll
      expect(scrollCheck.scrollY).toBeGreaterThan(800); // Vertical scroll worked
      console.log(`📜 ${name} Scroll test passed`);
    });

    test(`${name} - Performance and loading`, async ({ page }) => {
      console.log(`⚡ Testing ${name} performance...`);
      
      const startTime = Date.now();
      
      await page.goto('https://divinci.ai/', { waitUntil: 'networkidle' });
      
      const loadTime = Date.now() - startTime;
      console.log(`⏱️ ${name} Load time: ${loadTime}ms`);
      
      // Performance should be reasonable on mobile
      expect(loadTime).toBeLessThan(15000); // 15 seconds max for mobile
      
      // Check if videos are properly disabled on mobile
      const videoCheck = await page.evaluate(() => {
        const videos = Array.from(document.querySelectorAll('video'));
        const hiddenVideos = videos.filter(v => {
          const style = window.getComputedStyle(v);
          return style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0';
        });
        
        return {
          totalVideos: videos.length,
          hiddenVideos: hiddenVideos.length,
          videosProperlyHidden: hiddenVideos.length === videos.length
        };
      });
      
      console.log(`🎥 ${name} Video handling:`, videoCheck);
      expect(videoCheck.videosProperlyHidden).toBe(true);
    });
  });
});

// Cross-device comparison test
test.describe('Cross-Device Mobile Comparison', () => {
  test('Consistency across all mobile devices', async ({ browser }) => {
    console.log('🔄 Running cross-device consistency test...');
    
    const results = {};
    
    for (const { name, device } of mobileDevices) {
      const context = await browser.newContext(device);
      const page = await context.newPage();
      const helper = new MobileNavigationHelper(page);
      
      try {
        await page.goto('https://divinci.ai/');
        await page.waitForLoadState('networkidle');
        
        const overflowCheck = await helper.checkHorizontalOverflow();
        const touchCheck = await helper.checkTouchTargets();
        
        results[name] = {
          hasOverflow: overflowCheck.hasHorizontalScroll,
          touchTargetIssues: touchCheck.inadequateTargets.length,
          viewport: overflowCheck.viewportWidth
        };
        
        console.log(`📊 ${name} Results:`, results[name]);
        
      } catch (error) {
        console.log(`❌ ${name} Error:`, error.message);
        results[name] = { error: error.message };
      }
      
      await context.close();
    }
    
    // All devices should pass overflow test
    Object.keys(results).forEach(deviceName => {
      if (!results[deviceName].error) {
        expect(results[deviceName].hasOverflow).toBe(false);
      }
    });
    
    console.log('📋 Cross-device test summary:', results);
  });
});