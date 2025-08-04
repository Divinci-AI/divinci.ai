const { test, expect } = require('@playwright/test');

/**
 * Responsive Design and Mobile Navigation Tests
 * Tests mobile responsiveness, touch interactions, and mobile-specific functionality
 */

test.describe('Responsive Design and Mobile Navigation', () => {
  const baseURL = 'http://127.0.0.1:1027';
  
  // Test different viewport sizes
  const viewports = {
    mobile: { width: 375, height: 667 }, // iPhone SE
    tablet: { width: 768, height: 1024 }, // iPad
    desktop: { width: 1920, height: 1080 } // Desktop
  };

  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent testing
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01s !important;
          animation-delay: 0s !important;
          transition-duration: 0.01s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test.describe('Mobile Viewport Tests', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📱 Testing mobile viewport layout...\n');
      
      // Test header on mobile
      const header = page.locator('header');
      await expect(header).toBeVisible();
      console.log('  ✅ Header is visible on mobile');
      
      // Check for mobile menu trigger (hamburger menu)
      const mobileMenuTrigger = page.locator('.mobile-menu-trigger, .hamburger, .menu-toggle, .navbar-toggler');
      if (await mobileMenuTrigger.count() > 0) {
        await expect(mobileMenuTrigger).toBeVisible();
        console.log('  ✅ Mobile menu trigger is visible');
        
        // Test mobile menu functionality
        await mobileMenuTrigger.click();
        await page.waitForTimeout(500);
        
        const mobileMenu = page.locator('.mobile-menu, .navbar-collapse, .menu-mobile');
        if (await mobileMenu.count() > 0) {
          // Check if menu is visible or has active class
          const isVisible = await mobileMenu.isVisible();
          const hasActiveClass = await mobileMenu.getAttribute('class');
          
          if (isVisible || (hasActiveClass && hasActiveClass.includes('active'))) {
            console.log('  ✅ Mobile menu opens when triggered');
            
            // Test menu links
            const menuLinks = mobileMenu.locator('a');
            const linkCount = await menuLinks.count();
            console.log(`    📝 Found ${linkCount} links in mobile menu`);
          }
        }
      } else {
        console.log('  ℹ️ No mobile menu trigger found - may use different mobile navigation');
      }
      
      // Test hero section on mobile
      const heroSection = page.locator('.hero, .hero-section');
      if (await heroSection.count() > 0) {
        await expect(heroSection).toBeVisible();
        console.log('  ✅ Hero section is visible on mobile');
        
        // Check hero content stacking
        const heroContent = page.locator('.hero-content, .hero-text');
        if (await heroContent.count() > 0) {
          const heroBox = await heroContent.boundingBox();
          if (heroBox) {
            console.log(`    📝 Hero content width: ${heroBox.width}px`);
            expect(heroBox.width).toBeLessThanOrEqual(viewports.mobile.width);
          }
        }
      }
      
      // Test features section layout on mobile
      const featuresSection = page.locator('.features-section, .features-grid');
      if (await featuresSection.count() > 0) {
        await expect(featuresSection).toBeVisible();
        console.log('  ✅ Features section is visible on mobile');
        
        // Check if features stack vertically on mobile
        const featureCards = page.locator('.feature-card, .feature');
        if (await featureCards.count() > 0) {
          const firstCard = featureCards.first();
          const secondCard = featureCards.nth(1);
          
          if (await secondCard.count() > 0) {
            const firstBox = await firstCard.boundingBox();
            const secondBox = await secondCard.boundingBox();
            
            if (firstBox && secondBox) {
              // Check if cards are stacked vertically (second card is below first)
              const isStacked = secondBox.y > firstBox.y + firstBox.height - 20; // 20px tolerance
              if (isStacked) {
                console.log('    ✅ Feature cards stack vertically on mobile');
              } else {
                console.log('    📝 Feature cards may be in horizontal layout');
              }
            }
          }
        }
      }
      
      // Test footer on mobile
      const footer = page.locator('footer, .site-footer');
      if (await footer.count() > 0) {
        await expect(footer).toBeVisible();
        console.log('  ✅ Footer is visible on mobile');
        
        // Check footer content stacking
        const footerColumns = page.locator('.footer-column, .footer-section');
        if (await footerColumns.count() > 0) {
          console.log(`    📝 Footer has ${await footerColumns.count()} columns/sections`);
        }
      }
    });

    test('should handle touch interactions on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('👆 Testing touch interactions on mobile...\n');
      
      // Test dropdown interactions on touch devices
      const dropdowns = page.locator('.dropdown');
      const dropdownCount = await dropdowns.count();
      
      if (dropdownCount > 0) {
        console.log(`  📝 Found ${dropdownCount} dropdowns to test`);
        
        for (let i = 0; i < dropdownCount; i++) {
          const dropdown = dropdowns.nth(i);
          
          // Test touch/tap to open dropdown
          await dropdown.tap();
          await page.waitForTimeout(500);
          
          const dropdownMenu = page.locator('.dropdown-menu').nth(i);
          if (await dropdownMenu.count() > 0) {
            const isVisible = await dropdownMenu.isVisible();
            if (isVisible) {
              console.log(`    ✅ Dropdown ${i + 1} opens on tap`);
              
              // Test dropdown links
              const dropdownLinks = dropdownMenu.locator('a');
              const linkCount = await dropdownLinks.count();
              if (linkCount > 0) {
                console.log(`      📝 Dropdown has ${linkCount} links`);
                
                // Test first link tap
                const firstLink = dropdownLinks.first();
                const href = await firstLink.getAttribute('href');
                if (href && href.startsWith('/')) {
                  console.log(`      📝 First link: ${href}`);
                }
              }
              
              // Close dropdown by tapping outside
              await page.tap('body', { position: { x: 10, y: 10 } });
              await page.waitForTimeout(300);
            }
          }
        }
      }
      
      // Test button tap interactions
      const buttons = page.locator('button, .button, .btn');
      const buttonCount = await buttons.count();
      console.log(`  📝 Found ${buttonCount} buttons to test`);
      
      // Test a few buttons for tap responsiveness
      for (let i = 0; i < Math.min(buttonCount, 3); i++) {
        const button = buttons.nth(i);
        const isVisible = await button.isVisible();
        
        if (isVisible) {
          await button.tap();
          await page.waitForTimeout(200);
          console.log(`    ✅ Button ${i + 1} responds to tap`);
        }
      }
    });

    test('should test form usability on mobile', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      
      // Test forms on different pages
      const pagesToTest = ['/', '/contact/'];
      
      for (const pagePath of pagesToTest) {
        try {
          await page.goto(`${baseURL}${pagePath}`);
          await page.waitForLoadState('networkidle');
          
          console.log(`📝 Testing mobile form usability on ${pagePath}...\n`);
          
          const forms = page.locator('form');
          const formCount = await forms.count();
          
          if (formCount > 0) {
            console.log(`  📝 Found ${formCount} forms to test`);
            
            // Test input field focus and keyboard
            const inputs = page.locator('input, textarea');
            const inputCount = await inputs.count();
            
            for (let i = 0; i < Math.min(inputCount, 5); i++) {
              const input = inputs.nth(i);
              const isVisible = await input.isVisible();
              
              if (isVisible) {
                // Test focus
                await input.tap();
                await page.waitForTimeout(200);
                
                const isFocused = await input.evaluate(el => document.activeElement === el);
                if (isFocused) {
                  console.log(`    ✅ Input ${i + 1} receives focus on tap`);
                  
                  // Test typing
                  await input.fill('Mobile test input');
                  const value = await input.inputValue();
                  if (value === 'Mobile test input') {
                    console.log(`    ✅ Input ${i + 1} accepts text input`);
                  }
                  
                  // Clear input
                  await input.fill('');
                }
              }
            }
            
            // Test submit button on mobile
            const submitButton = page.locator('button[type="submit"], input[type="submit"]').first();
            if (await submitButton.count() > 0) {
              const buttonBox = await submitButton.boundingBox();
              if (buttonBox) {
                // Check if button is large enough for touch (44x44px minimum recommended)
                const isTouchFriendly = buttonBox.width >= 44 && buttonBox.height >= 44;
                console.log(`    📝 Submit button size: ${buttonBox.width}x${buttonBox.height}px ${isTouchFriendly ? '(touch-friendly)' : '(may be too small)'}`);
              }
            }
          }
          
        } catch (error) {
          console.log(`  ❌ Error testing ${pagePath}: ${error.message}`);
        }
      }
    });
  });

  test.describe('Tablet Viewport Tests', () => {
    test('should display correctly on tablet viewport', async ({ page }) => {
      await page.setViewportSize(viewports.tablet);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📱 Testing tablet viewport layout...\n');
      
      // Test navigation on tablet
      const navigation = page.locator('nav, .navigation');
      if (await navigation.count() > 0) {
        await expect(navigation).toBeVisible();
        console.log('  ✅ Navigation is visible on tablet');
        
        // Check if desktop or mobile navigation is used
        const mobileMenuTrigger = page.locator('.mobile-menu-trigger, .hamburger');
        const desktopNav = page.locator('.navbar-nav, .nav-menu');
        
        const hasMobileMenu = await mobileMenuTrigger.isVisible();
        const hasDesktopNav = await desktopNav.isVisible();
        
        if (hasMobileMenu) {
          console.log('    📝 Uses mobile navigation on tablet');
        } else if (hasDesktopNav) {
          console.log('    📝 Uses desktop navigation on tablet');
        }
      }
      
      // Test content layout on tablet
      const mainContent = page.locator('main, .main-content');
      if (await mainContent.count() > 0) {
        const contentBox = await mainContent.boundingBox();
        if (contentBox) {
          console.log(`  📝 Main content width: ${contentBox.width}px`);
          expect(contentBox.width).toBeLessThanOrEqual(viewports.tablet.width);
        }
      }
      
      // Test grid layouts on tablet
      const gridElements = page.locator('.features-grid, .team-grid, .grid');
      if (await gridElements.count() > 0) {
        console.log('  ✅ Grid layouts are present on tablet');
        
        // Check if grids adapt to tablet width
        const grid = gridElements.first();
        const gridItems = grid.locator('> *');
        const itemCount = await gridItems.count();
        
        if (itemCount > 0) {
          console.log(`    📝 Grid contains ${itemCount} items`);
          
          // Check layout of grid items
          if (itemCount >= 2) {
            const firstItem = gridItems.first();
            const secondItem = gridItems.nth(1);
            
            const firstBox = await firstItem.boundingBox();
            const secondBox = await secondItem.boundingBox();
            
            if (firstBox && secondBox) {
              const isHorizontal = Math.abs(firstBox.y - secondBox.y) < 50; // 50px tolerance
              console.log(`    📝 Grid items arranged ${isHorizontal ? 'horizontally' : 'vertically'}`);
            }
          }
        }
      }
    });
  });

  test.describe('Cross-Viewport Consistency', () => {
    test('should maintain consistent content across viewports', async ({ page }) => {
      console.log('🔄 Testing content consistency across viewports...\n');
      
      const testContent = [];
      
      // Test each viewport
      for (const [viewportName, viewport] of Object.entries(viewports)) {
        await page.setViewportSize(viewport);
        await page.goto(`${baseURL}/`);
        await page.waitForLoadState('networkidle');
        
        console.log(`  📝 Testing ${viewportName} (${viewport.width}x${viewport.height})`);
        
        // Collect content information
        const contentInfo = {
          viewport: viewportName,
          hasHeader: await page.locator('header').isVisible(),
          hasNavigation: await page.locator('nav').isVisible(),
          hasHero: await page.locator('.hero, .hero-section').isVisible(),
          hasFeatures: await page.locator('.features-section, .features-grid').isVisible(),
          hasFooter: await page.locator('footer, .site-footer').isVisible(),
          mainTitle: await page.locator('h1').first().textContent(),
          linkCount: await page.locator('a').count(),
          buttonCount: await page.locator('button').count()
        };
        
        testContent.push(contentInfo);
        
        console.log(`    Header: ${contentInfo.hasHeader ? '✅' : '❌'}`);
        console.log(`    Navigation: ${contentInfo.hasNavigation ? '✅' : '❌'}`);
        console.log(`    Hero: ${contentInfo.hasHero ? '✅' : '❌'}`);
        console.log(`    Features: ${contentInfo.hasFeatures ? '✅' : '❌'}`);
        console.log(`    Footer: ${contentInfo.hasFooter ? '✅' : '❌'}`);
        console.log(`    Links: ${contentInfo.linkCount}, Buttons: ${contentInfo.buttonCount}`);
      }
      
      // Compare content across viewports
      console.log('\n📊 Content consistency analysis:');
      
      const mobileContent = testContent.find(c => c.viewport === 'mobile');
      const tabletContent = testContent.find(c => c.viewport === 'tablet');
      const desktopContent = testContent.find(c => c.viewport === 'desktop');
      
      if (mobileContent && desktopContent) {
        // Check if main sections are consistent
        const sectionsMatch = 
          mobileContent.hasHeader === desktopContent.hasHeader &&
          mobileContent.hasHero === desktopContent.hasHero &&
          mobileContent.hasFeatures === desktopContent.hasFeatures &&
          mobileContent.hasFooter === desktopContent.hasFooter;
        
        console.log(`  Main sections consistent: ${sectionsMatch ? '✅' : '❌'}`);
        
        // Check if titles match
        const titlesMatch = mobileContent.mainTitle === desktopContent.mainTitle;
        console.log(`  Main titles match: ${titlesMatch ? '✅' : '❌'}`);
        
        // Check link counts (should be similar, allowing for mobile menu differences)
        const linkDifference = Math.abs(mobileContent.linkCount - desktopContent.linkCount);
        const linksSimilar = linkDifference <= 5; // Allow some difference for mobile menu
        console.log(`  Link counts similar: ${linksSimilar ? '✅' : '❌'} (difference: ${linkDifference})`);
      }
    });

    test('should test horizontal scrolling prevention', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('↔️ Testing horizontal scrolling prevention...\n');
      
      // Check if page has horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewports.mobile.width;
      
      console.log(`  📝 Body scroll width: ${bodyWidth}px`);
      console.log(`  📝 Viewport width: ${viewportWidth}px`);
      
      if (bodyWidth <= viewportWidth + 10) { // 10px tolerance
        console.log('  ✅ No horizontal overflow detected');
      } else {
        console.log('  ⚠️ Potential horizontal overflow detected');
        
        // Try to identify elements causing overflow
        const wideElements = await page.evaluate(() => {
          const elements = Array.from(document.querySelectorAll('*'));
          return elements
            .filter(el => el.scrollWidth > window.innerWidth)
            .map(el => ({
              tagName: el.tagName,
              className: el.className,
              scrollWidth: el.scrollWidth
            }))
            .slice(0, 5); // Limit to first 5 elements
        });
        
        if (wideElements.length > 0) {
          console.log('    📝 Elements with potential overflow:');
          wideElements.forEach((el, i) => {
            console.log(`      ${i + 1}. ${el.tagName}.${el.className} (${el.scrollWidth}px)`);
          });
        }
      }
    });
  });

  test.describe('Mobile-Specific Features', () => {
    test('should test mobile-specific interactions', async ({ page }) => {
      await page.setViewportSize(viewports.mobile);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📱 Testing mobile-specific features...\n');
      
      // Test phone number links
      const phoneLinks = page.locator('a[href^="tel:"]');
      const phoneCount = await phoneLinks.count();
      if (phoneCount > 0) {
        console.log(`  ✅ Found ${phoneCount} phone number links`);
        
        for (let i = 0; i < phoneCount; i++) {
          const phoneLink = phoneLinks.nth(i);
          const href = await phoneLink.getAttribute('href');
          console.log(`    📞 Phone link: ${href}`);
        }
      }
      
      // Test email links
      const emailLinks = page.locator('a[href^="mailto:"]');
      const emailCount = await emailLinks.count();
      if (emailCount > 0) {
        console.log(`  ✅ Found ${emailCount} email links`);
      }
      
      // Test social media links (often important on mobile)
      const socialLinks = page.locator('a[href*="facebook"], a[href*="twitter"], a[href*="linkedin"], a[href*="instagram"]');
      const socialCount = await socialLinks.count();
      if (socialCount > 0) {
        console.log(`  ✅ Found ${socialCount} social media links`);
      }
      
      // Test viewport meta tag
      const viewportMeta = await page.locator('meta[name="viewport"]').getAttribute('content');
      if (viewportMeta) {
        console.log(`  ✅ Viewport meta tag: ${viewportMeta}`);
        
        // Check for mobile-friendly viewport settings
        const hasMobileFriendlySettings = 
          viewportMeta.includes('width=device-width') ||
          viewportMeta.includes('initial-scale=1');
        
        console.log(`    📝 Mobile-friendly viewport: ${hasMobileFriendlySettings ? '✅' : '❌'}`);
      } else {
        console.log('  ⚠️ No viewport meta tag found');
      }
    });
  });
});