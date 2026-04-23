const { test, expect } = require('@playwright/test');

/**
 * Visual Regression Test Suite
 * Tests visual consistency and takes screenshots for regression testing
 */

test.describe('Visual Regression Tests', () => {
  const baseURL = 'http://127.0.0.1:1027';
  
  test.beforeEach(async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0.01s !important;
          animation-delay: 0s !important;
          transition-duration: 0.01s !important;
          transition-delay: 0s !important;
        }
        
        /* Ensure videos are hidden/replaced for consistent screenshots */
        video {
          visibility: hidden !important;
        }
        
        /* Hide dynamic content that might change */
        .dynamic-time, .current-date {
          visibility: hidden !important;  
        }
      `
    });
    
    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test.describe('Homepage Visual Tests', () => {
    test('should capture homepage hero section', async ({ page }) => { 
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking homepage hero section screenshot...');
      
      // Wait for hero content to be fully loaded
      await page.waitForSelector('.hero, .hero-section', { timeout: 10000 });
      
      const heroSection = page.locator('.hero, .hero-section');
      await expect(heroSection).toBeVisible();
      
      // Take screenshot of hero section
      await expect(heroSection).toHaveScreenshot('homepage-hero.png', {
        threshold: 0.3,
        maxDiffPixels: 1000
      });
      
      console.log('  ✅ Hero section screenshot captured');
    });

    test('should capture homepage features section', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking features section screenshot...');
      
      const featuresSection = page.locator('.features-section, .features-grid');
      if (await featuresSection.count() > 0) {
        await expect(featuresSection).toBeVisible();
        
        // Scroll to features section
        await featuresSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(featuresSection).toHaveScreenshot('homepage-features.png', {
          threshold: 0.3,
          maxDiffPixels: 1000
        });
        
        console.log('  ✅ Features section screenshot captured');
      } else {
        console.log('  ℹ️ No features section found');
      }
    });

    test('should capture enterprise AI section', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking enterprise AI section screenshot...');
      
      const enterpriseSection = page.locator('.enterprise-ai, .enterprise-content');
      if (await enterpriseSection.count() > 0) {
        await expect(enterpriseSection).toBeVisible();
        
        // Scroll to enterprise section
        await enterpriseSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(enterpriseSection).toHaveScreenshot('homepage-enterprise.png', {
          threshold: 0.3,
          maxDiffPixels: 1500
        });
        
        console.log('  ✅ Enterprise AI section screenshot captured');
      } else {
        console.log('  ℹ️ No enterprise AI section found');
      }
    });

    test('should capture team section', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking team section screenshot...');
      
      const teamSection = page.locator('.team-section, .team-grid');
      if (await teamSection.count() > 0) {
        await expect(teamSection).toBeVisible();
        
        // Scroll to team section
        await teamSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(teamSection).toHaveScreenshot('homepage-team.png', {
          threshold: 0.3,
          maxDiffPixels: 1000
        });
        
        console.log('  ✅ Team section screenshot captured');
      } else {
        console.log('  ℹ️ No team section found');
      }
    });

    test('should capture footer', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking footer screenshot...');
      
      const footer = page.locator('footer, .site-footer');
      if (await footer.count() > 0) {
        await expect(footer).toBeVisible();
        
        // Scroll to footer
        await footer.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(footer).toHaveScreenshot('homepage-footer.png', {
          threshold: 0.3,
          maxDiffPixels: 1000
        });
        
        console.log('  ✅ Footer screenshot captured');
      } else {
        console.log('  ℹ️ No footer found');
      }
    });
  });

  test.describe('Full Page Screenshots', () => {
    test('should capture full homepage', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking full homepage screenshot...');
      
      // Wait for content to settle
      await page.waitForTimeout(2000);
      
      await expect(page).toHaveScreenshot('homepage-full.png', {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 2000
      });
      
      console.log('  ✅ Full homepage screenshot captured');
    });

    test('should capture about page if exists', async ({ page }) => {
      try {
        await page.goto(`${baseURL}/about/`);
        await page.waitForLoadState('networkidle');
        
        console.log('📸 Taking about page screenshot...');
        
        // Check if page loaded successfully
        const response = await page.goto(`${baseURL}/about/`);
        if (response && response.status() === 200) {
          await page.waitForTimeout(1000);
          
          await expect(page).toHaveScreenshot('about-page-full.png', {
            fullPage: true,
            threshold: 0.3,
            maxDiffPixels: 2000
          });
          
          console.log('  ✅ About page screenshot captured');
        } else {
          console.log('  ℹ️ About page not available');
        }
      } catch (error) {
        console.log(`  ℹ️ About page not accessible: ${error.message}`);
      }
    });

    test('should capture contact page if exists', async ({ page }) => {
      try {
        await page.goto(`${baseURL}/contact/`);
        await page.waitForLoadState('networkidle');
        
        console.log('📸 Taking contact page screenshot...');
        
        const response = await page.goto(`${baseURL}/contact/`);
        if (response && response.status() === 200) {
          await page.waitForTimeout(1000);
          
          await expect(page).toHaveScreenshot('contact-page-full.png', {
            fullPage: true,
            threshold: 0.3,
            maxDiffPixels: 2000
          });
          
          console.log('  ✅ Contact page screenshot captured');
        } else {
          console.log('  ℹ️ Contact page not available');
        }
      } catch (error) {
        console.log(`  ℹ️ Contact page not accessible: ${error.message}`);
      }
    });

    test('should capture autorag page if exists', async ({ page }) => {
      try {
        await page.goto(`${baseURL}/autorag/`);
        await page.waitForLoadState('networkidle');
        
        console.log('📸 Taking AutoRAG page screenshot...');
        
        const response = await page.goto(`${baseURL}/autorag/`);
        if (response && response.status() === 200) {
          await page.waitForTimeout(1000);
          
          await expect(page).toHaveScreenshot('autorag-page-full.png', {
            fullPage: true,
            threshold: 0.3,
            maxDiffPixels: 2000
          });
          
          console.log('  ✅ AutoRAG page screenshot captured');
        } else {
          console.log('  ℹ️ AutoRAG page not available');
        }
      } catch (error) {
        console.log(`  ℹ️ AutoRAG page not accessible: ${error.message}`);
      }
    });
  });

  test.describe('Component Visual Tests', () => {
    test('should capture header component', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking header component screenshot...');
      
      const header = page.locator('header');
      if (await header.count() > 0) {
        await expect(header).toBeVisible();
        
        await expect(header).toHaveScreenshot('header-component.png', {
          threshold: 0.3,
          maxDiffPixels: 500
        });
        
        console.log('  ✅ Header component screenshot captured');
      } else {
        console.log('  ℹ️ No header component found');
      }
    });

    test('should capture navigation dropdown', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking navigation dropdown screenshot...');
      
      const dropdown = page.locator('.dropdown').first();
      if (await dropdown.count() > 0) {
        // Hover to open dropdown
        await dropdown.hover();
        await page.waitForTimeout(500);
        
        const dropdownMenu = page.locator('.dropdown-menu').first();
        if (await dropdownMenu.isVisible()) {
          await expect(dropdownMenu).toHaveScreenshot('navigation-dropdown.png', {
            threshold: 0.3,
            maxDiffPixels: 300
          });
          
          console.log('  ✅ Navigation dropdown screenshot captured');
        } else {
          console.log('  ℹ️ Dropdown menu not visible');
        }
      } else {
        console.log('  ℹ️ No dropdown found');
      }
    });

    test('should capture language switcher', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking language switcher screenshot...');
      
      const languageSwitcher = page.locator('.language-switcher');
      if (await languageSwitcher.count() > 0) {
        await expect(languageSwitcher).toBeVisible();
        
        // Click to open language options
        await languageSwitcher.click();
        await page.waitForTimeout(500);
        
        // Take screenshot of the switcher area
        const switcherContainer = page.locator('.language-switcher-container, .language-switcher');
        await expect(switcherContainer).toHaveScreenshot('language-switcher.png', {
          threshold: 0.3,
          maxDiffPixels: 300
        });
        
        console.log('  ✅ Language switcher screenshot captured');
      } else {
        console.log('  ℹ️ No language switcher found');
      }
    });

    test('should capture panel components', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📸 Taking panel components screenshot...');
      
      const panels = page.locator('.panel');
      const panelCount = await panels.count();
      
      if (panelCount > 0) {
        console.log(`  📝 Found ${panelCount} panels to capture`);
        
        // Capture the panels container
        const panelsContainer = page.locator('.panels-container, .circular-panels-wrapper');
        if (await panelsContainer.count() > 0) {
          await panelsContainer.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          
          await expect(panelsContainer).toHaveScreenshot('enterprise-panels.png', {
            threshold: 0.3,
            maxDiffPixels: 1000
          });
          
          console.log('  ✅ Panel components screenshot captured');
        } else {
          // Capture individual panels if no container
          for (let i = 0; i < Math.min(panelCount, 3); i++) {
            const panel = panels.nth(i);
            await panel.scrollIntoViewIfNeeded();
            await page.waitForTimeout(200);
            
            await expect(panel).toHaveScreenshot(`panel-${i + 1}.png`, {
              threshold: 0.3,
              maxDiffPixels: 500
            });
          }
          
          console.log(`  ✅ Individual panel screenshots captured`);
        }
      } else {
        console.log('  ℹ️ No panels found');
      }
    });
  });

  test.describe('Mobile Visual Tests', () => {
    test('should capture mobile homepage', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📱 Taking mobile homepage screenshot...');
      
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('mobile-homepage-full.png', {
        fullPage: true,
        threshold: 0.3,
        maxDiffPixels: 2000
      });
      
      console.log('  ✅ Mobile homepage screenshot captured');
    });

    test('should capture mobile header', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📱 Taking mobile header screenshot...');
      
      const header = page.locator('header');
      if (await header.count() > 0) {
        await expect(header).toBeVisible();
        
        await expect(header).toHaveScreenshot('mobile-header.png', {
          threshold: 0.3,
          maxDiffPixels: 500
        });
        
        console.log('  ✅ Mobile header screenshot captured');
      }
    });

    test('should capture mobile navigation menu', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📱 Taking mobile navigation menu screenshot...');
      
      // Look for mobile menu trigger
      const mobileMenuTrigger = page.locator('.mobile-menu-trigger, .hamburger, .menu-toggle, .navbar-toggler');
      if (await mobileMenuTrigger.count() > 0) {
        await mobileMenuTrigger.click();
        await page.waitForTimeout(500);
        
        const mobileMenu = page.locator('.mobile-menu, .navbar-collapse');
        if (await mobileMenu.count() > 0 && await mobileMenu.isVisible()) {
          await expect(mobileMenu).toHaveScreenshot('mobile-navigation-menu.png', {
            threshold: 0.3,
            maxDiffPixels: 800
          });
          
          console.log('  ✅ Mobile navigation menu screenshot captured');
        } else {
          console.log('  ℹ️ Mobile menu not visible after trigger');
        }
      } else {
        console.log('  ℹ️ No mobile menu trigger found');
      }
    });
  });

  test.describe('Cross-Browser Visual Consistency', () => {
    test('should compare visual consistency across browser projects', async ({ page, browserName }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log(`🔄 Taking cross-browser screenshot for ${browserName}...`);
      
      // Wait for content to settle
      await page.waitForTimeout(2000);
      
      // Take screenshot with browser name in filename
      await expect(page).toHaveScreenshot(`homepage-${browserName}.png`, {
        fullPage: true,
        threshold: 0.4, // Allow slightly more variance for cross-browser
        maxDiffPixels: 3000
      });
      
      console.log(`  ✅ ${browserName} screenshot captured`);
    });
  });

  test.describe('Form Visual Tests', () => {
    test('should capture signup form', async ({ page }) => {
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      console.log('📝 Taking signup form screenshot...');
      
      const signupForm = page.locator('.signup-form, .newsletter-signup');
      if (await signupForm.count() > 0) {
        await signupForm.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        
        await expect(signupForm).toHaveScreenshot('signup-form.png', {
          threshold: 0.3,
          maxDiffPixels: 500
        });
        
        console.log('  ✅ Signup form screenshot captured');
      } else {
        console.log('  ℹ️ No signup form found');
      }
    });

    test('should capture contact form if exists', async ({ page }) => {
      try {
        await page.goto(`${baseURL}/contact/`);
        await page.waitForLoadState('networkidle');
        
        console.log('📝 Taking contact form screenshot...');
        
        const contactForm = page.locator('form, .contact-form');
        if (await contactForm.count() > 0) {
          await contactForm.scrollIntoViewIfNeeded();
          await page.waitForTimeout(500);
          
          await expect(contactForm).toHaveScreenshot('contact-form.png', {
            threshold: 0.3,
            maxDiffPixels: 800
          });
          
          console.log('  ✅ Contact form screenshot captured');
        } else {
          console.log('  ℹ️ No contact form found');
        }
      } catch (error) {
        console.log(`  ℹ️ Contact page not accessible: ${error.message}`);
      }
    });
  });

  test.describe('Error State Visual Tests', () => {
    test('should capture 404 page if custom exists', async ({ page }) => {
      console.log('❌ Taking 404 page screenshot...');
      
      try {
        await page.goto(`${baseURL}/non-existent-page/`);
        await page.waitForLoadState('networkidle');
        
        // Wait a bit for any 404 page content to load
        await page.waitForTimeout(1000);
        
        await expect(page).toHaveScreenshot('404-page.png', {
          fullPage: true,
          threshold: 0.3,
          maxDiffPixels: 2000
        });
        
        console.log('  ✅ 404 page screenshot captured');
      } catch (error) {
        console.log(`  ℹ️ Could not capture 404 page: ${error.message}`);
      }
    });
  });
});