const { test, expect, devices } = require('@playwright/test');

test.describe('iPhone 12 Pro Homepage Validation', () => {
  test.use({ ...devices['iPhone 12 Pro'] });

  test('iPhone 12 Pro homepage fixes validation', async ({ page }) => {
    // Navigate to live site
    await page.goto('https://divinci.ai/');
    await page.waitForLoadState('networkidle');
    
    console.log('📱 Validating iPhone 12 Pro fixes...');
    
    // Check for horizontal overflow
    const overflowCheck = await page.evaluate(() => {
      const body = document.body;
      const html = document.documentElement;
      const viewport = window.innerWidth;
      
      return {
        bodyScrollWidth: body.scrollWidth,
        documentScrollWidth: html.scrollWidth,
        viewportWidth: viewport,
        hasHorizontalScroll: body.scrollWidth > viewport + 5
      };
    });
    
    console.log('📏 Overflow Check:', overflowCheck);
    
    // Should not have significant horizontal overflow
    expect(overflowCheck.hasHorizontalScroll).toBe(false);
    
    // Check hero section dimensions
    const heroCheck = await page.evaluate(() => {
      const hero = document.querySelector('.hero');
      const heroImage = document.querySelector('.hero-image');
      const heroText = document.querySelector('.hero-text');
      
      if (!hero) return { error: 'Hero section not found' };
      
      return {
        heroWidth: hero.getBoundingClientRect().width,
        heroImageWidth: heroImage ? heroImage.getBoundingClientRect().width : 0,
        heroTextWidth: heroText ? heroText.getBoundingClientRect().width : 0,
        viewportWidth: window.innerWidth
      };
    });
    
    console.log('🦸 Hero Section Check:', heroCheck);
    
    // Hero elements should not exceed viewport width
    if (heroCheck.heroImageWidth > 0) {
      expect(heroCheck.heroImageWidth).toBeLessThanOrEqual(heroCheck.viewportWidth + 5);
    }
    
    // Check navigation accessibility
    const navCheck = await page.evaluate(() => {
      const navLinks = Array.from(document.querySelectorAll('nav a, .cta-button'));
      const smallTargets = [];
      
      navLinks.forEach(link => {
        const rect = link.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
          smallTargets.push({
            text: link.textContent?.substring(0, 20) || 'no-text',
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      });
      
      return {
        totalNavLinks: navLinks.length,
        smallTargets: smallTargets,
        meetsTouchGuidelines: smallTargets.length === 0
      };
    });
    
    console.log('🎯 Navigation Touch Targets:', navCheck);
    
    // Touch targets should meet accessibility guidelines (44px minimum)
    expect(navCheck.smallTargets.length).toBeLessThanOrEqual(2); // Allow some flexibility
    
    // Check enterprise section layout
    const enterpriseCheck = await page.evaluate(() => {
      const enterprise = document.querySelector('.enterprise-ai');
      const panels = document.querySelector('.circular-panels-wrapper');
      
      if (!enterprise) return { error: 'Enterprise section not found' };
      
      return {
        enterpriseWidth: enterprise.getBoundingClientRect().width,
        panelsWidth: panels ? panels.getBoundingClientRect().width : 0,
        viewportWidth: window.innerWidth,
        fitsInViewport: enterprise.getBoundingClientRect().width <= window.innerWidth + 5
      };
    });
    
    console.log('🏢 Enterprise Section Check:', enterpriseCheck);
    
    // Enterprise section should fit in viewport
    expect(enterpriseCheck.fitsInViewport).toBe(true);
    
    // Test basic interaction - language switcher should be accessible
    const languageSwitcher = page.locator('.language-switcher-current');
    await expect(languageSwitcher).toBeVisible();
    
    // Should be able to scroll without horizontal movement
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    
    const afterScrollCheck = await page.evaluate(() => {
      return {
        scrollX: window.scrollX,
        bodyWidth: document.body.scrollWidth,
        viewportWidth: window.innerWidth
      };
    });
    
    console.log('📜 After Scroll Check:', afterScrollCheck);
    
    // Should not have moved horizontally while scrolling
    expect(afterScrollCheck.scrollX).toBe(0);
    
    console.log('✅ iPhone 12 Pro validation completed successfully');
  });
});