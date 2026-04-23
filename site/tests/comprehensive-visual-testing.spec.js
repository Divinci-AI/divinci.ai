const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Visual Testing Suite
 * Enhanced visual regression testing for desktop, mobile, and tablet
 * Covers all major sections, responsive breakpoints, and multilingual support
 */

test.describe('Comprehensive Visual Testing - All Devices', () => {
  const baseURL = 'http://localhost:1111';
  
  // Device configurations
  const devices = [
    { name: 'desktop', width: 1920, height: 1080 },
    { name: 'laptop', width: 1366, height: 768 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'mobile-large', width: 414, height: 896 },
    { name: 'mobile-medium', width: 375, height: 667 },
    { name: 'mobile-small', width: 320, height: 568 }
  ];

  // Major languages to test
  const languages = [
    { code: 'en', name: 'english' },
    { code: 'es', name: 'spanish' },
    { code: 'fr', name: 'french' },
    { code: 'ar', name: 'arabic' },
    { code: 'zh', name: 'chinese' },
    { code: 'ja', name: 'japanese' }
  ];

  test.beforeEach(async ({ page }) => {
    // Disable animations and videos for consistent visual testing
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
          scroll-behavior: auto !important;
        }
        video {
          display: none !important;
        }
        .background-video {
          display: none !important;
        }
        img {
          animation: none !important;
        }
        .gsap-timeline, .gsap-animation {
          animation: none !important;
          transform: none !important;
        }
      `
    });
  });

  // Full page visual tests across all devices
  devices.forEach(device => {
    test(`Full homepage visual test - ${device.name}`, async ({ page }) => {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000); // Wait for images and fonts to load
      
      await expect(page).toHaveScreenshot(`homepage-full-${device.name}.png`, {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 2000
      });
    });
  });

  // Section-specific visual tests for key breakpoints
  ['desktop', 'mobile-medium'].forEach(deviceName => {
    const device = devices.find(d => d.name === deviceName);
    
    test.describe(`Section visual tests - ${deviceName}`, () => {
      test.beforeEach(async ({ page }) => {
        await page.setViewportSize({ width: device.width, height: device.height });
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      });

      test(`Header and navigation - ${deviceName}`, async ({ page }) => {
        const header = page.locator('header');
        await expect(header).toHaveScreenshot(`header-${deviceName}.png`, {
          threshold: 0.3
        });
      });

      test(`Hero section - ${deviceName}`, async ({ page }) => {
        const hero = page.locator('.hero');
        await expect(hero).toHaveScreenshot(`hero-section-${deviceName}.png`, {
          threshold: 0.3
        });
      });

      test(`Enterprise AI section - ${deviceName}`, async ({ page }) => {
        await page.locator('.enterprise-ai').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const enterprise = page.locator('.enterprise-ai');
        await expect(enterprise).toHaveScreenshot(`enterprise-ai-${deviceName}.png`, {
          threshold: 0.3
        });
      });

      test(`Features section - ${deviceName}`, async ({ page }) => {
        await page.locator('.features-section').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const features = page.locator('.features-section');
        await expect(features).toHaveScreenshot(`features-section-${deviceName}.png`, {
          threshold: 0.3
        });
      });

      test(`Team section - ${deviceName}`, async ({ page }) => {
        await page.locator('.team-section').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const team = page.locator('.team-section');
        await expect(team).toHaveScreenshot(`team-section-${deviceName}.png`, {
          threshold: 0.3
        });
      });

      test(`Signup section - ${deviceName}`, async ({ page }) => {
        await page.locator('.signup-section').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const signup = page.locator('.signup-section');
        await expect(signup).toHaveScreenshot(`signup-section-${deviceName}.png`, {
          threshold: 0.3
        });
      });

      test(`AI for Good section - ${deviceName}`, async ({ page }) => {
        await page.locator('.ai-for-good-section').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const aiForGood = page.locator('.ai-for-good-section');
        await expect(aiForGood).toHaveScreenshot(`ai-for-good-${deviceName}.png`, {
          threshold: 0.3
        });
      });

      test(`Footer - ${deviceName}`, async ({ page }) => {
        await page.locator('.site-footer').scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        const footer = page.locator('.site-footer');
        await expect(footer).toHaveScreenshot(`footer-${deviceName}.png`, {
          threshold: 0.3
        });
      });
    });
  });

  // Interactive state visual tests
  test.describe('Interactive state visual tests - Desktop', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(baseURL);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
    });

    test('Language switcher dropdown open', async ({ page }) => {
      await page.locator('.language-switcher').click();
      await page.waitForTimeout(500);
      
      const dropdown = page.locator('.language-switcher');
      await expect(dropdown).toHaveScreenshot('language-switcher-open-desktop.png', {
        threshold: 0.3
      });
    });

    test('Mobile navigation menu open', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if mobile menu trigger exists and click it
      const menuTrigger = page.locator('.mobile-menu-trigger, .hamburger, .menu-toggle');
      if (await menuTrigger.count() > 0) {
        await menuTrigger.click();
        await page.waitForTimeout(500);
        
        const mobileNav = page.locator('nav, .mobile-menu, .navigation');
        await expect(mobileNav).toHaveScreenshot('mobile-navigation-open.png', {
          threshold: 0.3
        });
      }
    });

    test('Feature panels in different states', async ({ page }) => {
      await page.locator('.enterprise-ai').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      // Test different panel states if they exist
      const panels = page.locator('.panel');
      const panelCount = await panels.count();
      
      for (let i = 0; i < Math.min(panelCount, 4); i++) {
        await panels.nth(i).click();
        await page.waitForTimeout(500);
        
        const enterpriseSection = page.locator('.enterprise-ai');
        await expect(enterpriseSection).toHaveScreenshot(`enterprise-panel-${i}-desktop.png`, {
          threshold: 0.3
        });
      }
    });
  });

  // Cross-browser visual consistency tests
  test.describe('Cross-browser visual consistency', () => {
    const criticalSections = [
      { selector: '.hero', name: 'hero' },
      { selector: '.enterprise-ai', name: 'enterprise' },
      { selector: '.features-section', name: 'features' },
      { selector: '.site-footer', name: 'footer' }
    ];

    criticalSections.forEach(section => {
      test(`${section.name} section consistency - desktop`, async ({ page, browserName }) => {
        await page.setViewportSize({ width: 1920, height: 1080 });
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.locator(section.selector).scrollIntoViewIfNeeded();
        await page.waitForTimeout(1000);
        
        const element = page.locator(section.selector);
        await expect(element).toHaveScreenshot(`${section.name}-${browserName}-desktop.png`, {
          threshold: 0.3
        });
      });
    });
  });

  // Responsive breakpoint visual tests
  test.describe('Responsive breakpoint visual tests', () => {
    const breakpoints = [
      { width: 1920, name: 'xl-desktop' },
      { width: 1366, name: 'lg-desktop' },
      { width: 1024, name: 'tablet-landscape' },
      { width: 768, name: 'tablet-portrait' },
      { width: 414, name: 'mobile-large' },
      { width: 375, name: 'mobile-medium' },
      { width: 320, name: 'mobile-small' }
    ];

    breakpoints.forEach(breakpoint => {
      test(`Header responsiveness at ${breakpoint.width}px`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: 800 });
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const header = page.locator('header');
        await expect(header).toHaveScreenshot(`header-${breakpoint.name}.png`, {
          threshold: 0.3
        });
      });

      test(`Hero section responsiveness at ${breakpoint.width}px`, async ({ page }) => {
        await page.setViewportSize({ width: breakpoint.width, height: 800 });
        await page.goto(baseURL);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const hero = page.locator('.hero');
        await expect(hero).toHaveScreenshot(`hero-responsive-${breakpoint.name}.png`, {
          threshold: 0.3
        });
      });
    });
  });
});

test.describe('Multilingual Visual Testing', () => {
  const baseURL = 'http://localhost:1111';
  
  // Priority languages for visual testing
  const priorityLanguages = [
    { code: 'en', name: 'english', url: '' },
    { code: 'es', name: 'spanish', url: '/es' },
    { code: 'fr', name: 'french', url: '/fr' },
    { code: 'ar', name: 'arabic', url: '/ar' },
    { code: 'zh', name: 'chinese', url: '/zh' }
  ];

  test.beforeEach(async ({ page }) => {
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
        video { display: none !important; }
      `
    });
  });

  priorityLanguages.forEach(lang => {
    test(`${lang.name} homepage visual - desktop`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${baseURL}${lang.url}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot(`homepage-${lang.name}-desktop.png`, {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 2000
      });
    });

    test(`${lang.name} homepage visual - mobile`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseURL}${lang.url}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      await expect(page).toHaveScreenshot(`homepage-${lang.name}-mobile.png`, {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 2000
      });
    });

    test(`${lang.name} footer visual test`, async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto(`${baseURL}${lang.url}/`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      await page.locator('.site-footer').scrollIntoViewIfNeeded();
      await page.waitForTimeout(1000);
      
      const footer = page.locator('.site-footer');
      await expect(footer).toHaveScreenshot(`footer-${lang.name}.png`, {
        threshold: 0.3
      });
    });
  });

  // RTL language specific tests
  test('Arabic RTL layout visual test', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`${baseURL}/ar/`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Test specific RTL elements
    const hero = page.locator('.hero');
    await expect(hero).toHaveScreenshot('hero-arabic-rtl.png', {
      threshold: 0.3
    });
    
    const features = page.locator('.features-section');
    await features.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await expect(features).toHaveScreenshot('features-arabic-rtl.png', {
      threshold: 0.3
    });
  });
});

test.describe('Visual Accessibility Testing', () => {
  const baseURL = 'http://localhost:1111';

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('High contrast mode visual test', async ({ page }) => {
    // Simulate high contrast mode
    await page.addStyleTag({
      content: `
        @media (prefers-contrast: high) {
          * {
            background: black !important;
            color: white !important;
            border-color: white !important;
          }
        }
      `
    });
    
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
      fullPage: true,
      threshold: 0.4
    });
  });

  test('Reduced motion visual test', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addStyleTag({
      content: `
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `
    });
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveScreenshot('homepage-reduced-motion.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('Focus states visual test', async ({ page }) => {
    // Test keyboard navigation focus states
    const focusableElements = [
      '.language-switcher',
      'nav a',
      '.cta-button',
      '.primary-button',
      '.secondary-button'
    ];

    for (const selector of focusableElements) {
      const element = page.locator(selector).first();
      if (await element.count() > 0) {
        await element.focus();
        await page.waitForTimeout(300);
        
        await expect(element).toHaveScreenshot(`focus-${selector.replace(/[^a-zA-Z0-9]/g, '-')}.png`, {
          threshold: 0.3
        });
      }
    }
  });
});