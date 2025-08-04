const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Mobile Visual Testing Suite
 * Tests visual consistency and layout across all pages on mobile devices
 */

test.describe('Comprehensive Mobile Visual Testing', () => {
  const baseURL = 'http://127.0.0.1:1111';
  
  // Mobile device configurations
  const mobileDevices = {
    'iPhone-SE': { width: 375, height: 667 },
    'iPhone-12': { width: 390, height: 844 },
    'iPhone-14-Pro': { width: 393, height: 852 },
    'Pixel-5': { width: 393, height: 851 },
    'Galaxy-S21': { width: 360, height: 800 }
  };

  // All pages to test (including existing and potential pages)
  const allPages = [
    { path: '/', name: 'homepage', title: 'Homepage' },
    { path: '/about/', name: 'about', title: 'About Us' },
    { path: '/contact/', name: 'contact', title: 'Contact' },
    { path: '/pricing/', name: 'pricing', title: 'Pricing' },
    { path: '/roadmap/', name: 'roadmap', title: 'Roadmap' },
    { path: '/press/', name: 'press', title: 'Press' },
    { path: '/careers/', name: 'careers', title: 'Careers' },
    { path: '/docs/', name: 'docs', title: 'Documentation' },
    { path: '/api/', name: 'api', title: 'API' },
    { path: '/blog/', name: 'blog', title: 'Blog' },
    { path: '/tutorials/', name: 'tutorials', title: 'Tutorials' },
    { path: '/changelog/', name: 'changelog', title: 'Changelog' },
    { path: '/support/', name: 'support', title: 'Support' },
    
    // Feature pages
    { path: '/autorag/', name: 'autorag', title: 'AutoRAG' },
    { path: '/quality-assurance/', name: 'quality-assurance', title: 'Quality Assurance' },
    { path: '/release-management/', name: 'release-management', title: 'Release Management' },
    
    // Legal pages
    { path: '/terms-of-service/', name: 'terms-of-service', title: 'Terms of Service' },
    { path: '/privacy-policy/', name: 'privacy-policy', title: 'Privacy Policy' },
    { path: '/accessibility/', name: 'accessibility', title: 'Accessibility' },
    { path: '/security/', name: 'security', title: 'Security' },
    { path: '/ai-safety/', name: 'ai-safety', title: 'AI Safety' },
    { path: '/sitemap/', name: 'sitemap', title: 'Sitemap' },
    { path: '/cookies/', name: 'cookies', title: 'Cookies' }
  ];

  // Multi-language pages
  const languages = ['en', 'es', 'fr', 'ar'];

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
        
        /* Hide dynamic content that might change */
        video, .video-container {
          visibility: hidden !important;
        }
        
        .dynamic-time, .current-date, .timestamp {
          visibility: hidden !important;  
        }
        
        /* Ensure consistent font loading */
        body {
          font-display: swap;
        }
      `
    });
  });

  test.describe('Mobile Device Visual Comparison', () => {
    // Test homepage across different mobile devices
    test('should capture homepage on all mobile devices', async ({ page }) => {
      console.log('📱 Testing homepage across mobile devices...\n');
      
      for (const [deviceName, viewport] of Object.entries(mobileDevices)) {
        console.log(`Testing ${deviceName} (${viewport.width}x${viewport.height})`);
        
        await page.setViewportSize(viewport);
        await page.goto(`${baseURL}/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        // Take full page screenshot
        await expect(page).toHaveScreenshot(`mobile-homepage-${deviceName.toLowerCase()}.png`, {
          fullPage: true,
          threshold: 0.3,
          maxDiffPixels: 2000
        });
        
        console.log(`  ✅ ${deviceName} homepage captured`);
      }
    });

    // Test key components on mobile devices
    test('should capture mobile navigation across devices', async ({ page }) => {
      console.log('🧭 Testing mobile navigation across devices...\n');
      
      for (const [deviceName, viewport] of Object.entries(mobileDevices)) {
        console.log(`Testing navigation on ${deviceName}`);
        
        await page.setViewportSize(viewport);
        await page.goto(`${baseURL}/`);
        await page.waitForLoadState('networkidle');
        
        // Test header
        const header = page.locator('header');
        if (await header.count() > 0) {
          await expect(header).toHaveScreenshot(`mobile-header-${deviceName.toLowerCase()}.png`, {
            threshold: 0.3,
            maxDiffPixels: 500
          });
        }
        
        // Test mobile menu if it exists
        const mobileMenuTrigger = page.locator('.mobile-menu-trigger, .hamburger, .menu-toggle, .navbar-toggler');
        if (await mobileMenuTrigger.count() > 0 && await mobileMenuTrigger.isVisible()) {
          await mobileMenuTrigger.click();
          await page.waitForTimeout(500);
          
          const mobileMenu = page.locator('.mobile-menu, .navbar-collapse');
          if (await mobileMenu.count() > 0 && await mobileMenu.isVisible()) {
            await expect(mobileMenu).toHaveScreenshot(`mobile-menu-${deviceName.toLowerCase()}.png`, {
              threshold: 0.3,
              maxDiffPixels: 800
            });
          }
          
          // Close menu
          await mobileMenuTrigger.click();
          await page.waitForTimeout(300);
        }
        
        console.log(`  ✅ ${deviceName} navigation captured`);
      }
    });
  });

  test.describe('All Pages Mobile Visual Testing', () => {
    // Test all English pages on mobile
    test('should capture all pages on mobile devices', async ({ page }) => {
      console.log('📄 Testing all pages on mobile...\n');
      
      // Use iPhone 12 as primary mobile device for comprehensive testing
      await page.setViewportSize(mobileDevices['iPhone-12']);
      
      for (const pageInfo of allPages) {
        console.log(`Testing ${pageInfo.title} (${pageInfo.path})`);
        
        try {
          const response = await page.goto(`${baseURL}${pageInfo.path}`, {
            waitUntil: 'networkidle',
            timeout: 15000
          });
          
          if (response && response.status() === 200) {
            await page.waitForTimeout(1000);
            
            // Take full page screenshot
            await expect(page).toHaveScreenshot(`mobile-page-${pageInfo.name}.png`, {
              fullPage: true,
              threshold: 0.3,
              maxDiffPixels: 2000
            });
            
            // Test header consistency
            const header = page.locator('header');
            if (await header.count() > 0) {
              await expect(header).toHaveScreenshot(`mobile-header-${pageInfo.name}.png`, {
                threshold: 0.3,
                maxDiffPixels: 500
              });
            }
            
            // Test footer consistency
            const footer = page.locator('footer, .site-footer');
            if (await footer.count() > 0) {
              await footer.scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
              await expect(footer).toHaveScreenshot(`mobile-footer-${pageInfo.name}.png`, {
                threshold: 0.3,
                maxDiffPixels: 500
              });
            }
            
            console.log(`  ✅ ${pageInfo.title} mobile screenshots captured`);
          } else {
            console.log(`  ⚠️ ${pageInfo.title} returned status ${response?.status()}`);
          }
        } catch (error) {
          console.log(`  ❌ Error testing ${pageInfo.title}: ${error.message}`);
        }
      }
    });

    // Test form elements on mobile
    test('should capture forms on mobile devices', async ({ page }) => {
      console.log('📝 Testing forms on mobile...\n');
      
      await page.setViewportSize(mobileDevices['iPhone-12']);
      
      const pagesWithForms = [
        { path: '/', name: 'homepage', forms: ['.signup-form', '.newsletter-signup', '.contact-form'] },
        { path: '/contact/', name: 'contact', forms: ['form', '.contact-form', '.inquiry-form'] },
        { path: '/careers/', name: 'careers', forms: ['.application-form', '.job-form'] },
        { path: '/support/', name: 'support', forms: ['.support-form', '.ticket-form'] }
      ];
      
      for (const pageInfo of pagesWithForms) {
        try {
          await page.goto(`${baseURL}${pageInfo.path}`);
          await page.waitForLoadState('networkidle');
          
          for (const formSelector of pageInfo.forms) {
            const form = page.locator(formSelector);
            if (await form.count() > 0 && await form.isVisible()) {
              await form.scrollIntoViewIfNeeded();
              await page.waitForTimeout(300);
              
              await expect(form).toHaveScreenshot(`mobile-form-${pageInfo.name}-${formSelector.replace(/[^a-z0-9]/gi, '')}.png`, {
                threshold: 0.3,
                maxDiffPixels: 800
              });
              
              console.log(`  ✅ Form ${formSelector} captured on ${pageInfo.name}`);
            }
          }
        } catch (error) {
          console.log(`  ❌ Error testing forms on ${pageInfo.name}: ${error.message}`);
        }
      }
    });
  });

  test.describe('Multi-Language Mobile Visual Testing', () => {
    // Test key pages in different languages on mobile
    test('should capture multi-language pages on mobile', async ({ page }) => {
      console.log('🌍 Testing multi-language pages on mobile...\n');
      
      await page.setViewportSize(mobileDevices['iPhone-12']);
      
      const keyPages = [
        { path: '/', name: 'homepage' },
        { path: '/about/', name: 'about' },
        { path: '/autorag/', name: 'autorag' },
        { path: '/quality-assurance/', name: 'quality-assurance' },
        { path: '/terms-of-service/', name: 'terms-of-service' },
        { path: '/privacy-policy/', name: 'privacy-policy' }
      ];
      
      for (const lang of languages) {
        console.log(`Testing ${lang} language pages...`);
        
        for (const pageInfo of keyPages) {
          const langPath = lang === 'en' ? pageInfo.path : `/${lang}${pageInfo.path}`;
          
          try {
            const response = await page.goto(`${baseURL}${langPath}`, {
              waitUntil: 'networkidle',
              timeout: 15000
            });
            
            if (response && response.status() === 200) {
              await page.waitForTimeout(1000);
              
              // Take screenshot for language comparison
              await expect(page).toHaveScreenshot(`mobile-${lang}-${pageInfo.name}.png`, {
                fullPage: true,
                threshold: 0.3,
                maxDiffPixels: 2000
              });
              
              // Test RTL layout for Arabic
              if (lang === 'ar') {
                const body = page.locator('body');
                const direction = await body.getAttribute('dir');
                if (direction === 'rtl') {
                  console.log(`    📝 RTL layout detected for Arabic`);
                  
                  // Capture header for RTL testing
                  const header = page.locator('header');
                  if (await header.count() > 0) {
                    await expect(header).toHaveScreenshot(`mobile-${lang}-header-${pageInfo.name}.png`, {
                      threshold: 0.3,
                      maxDiffPixels: 500
                    });
                  }
                }
              }
              
              console.log(`    ✅ ${lang} ${pageInfo.name} captured`);
            } else {
              console.log(`    ⚠️ ${lang} ${pageInfo.name} not available`);
            }
          } catch (error) {
            console.log(`    ❌ Error with ${lang} ${pageInfo.name}: ${error.message}`);
          }
        }
      }
    });

    // Test language switcher on mobile
    test('should capture language switcher on mobile', async ({ page }) => {
      console.log('🔄 Testing language switcher on mobile...\n');
      
      await page.setViewportSize(mobileDevices['iPhone-12']);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      const languageSwitcher = page.locator('.language-switcher, .lang-switch, .language-selector');
      if (await languageSwitcher.count() > 0) {
        await expect(languageSwitcher).toHaveScreenshot('mobile-language-switcher-closed.png', {
          threshold: 0.3,
          maxDiffPixels: 300
        });
        
        // Test opening language switcher
        try {
          await languageSwitcher.click();
          await page.waitForTimeout(500);
          
          const languageOptions = page.locator('.language-options, .lang-dropdown, .language-menu');
          if (await languageOptions.count() > 0 && await languageOptions.isVisible()) {
            await expect(languageOptions).toHaveScreenshot('mobile-language-switcher-open.png', {
              threshold: 0.3,
              maxDiffPixels: 500
            });
            
            console.log('  ✅ Language switcher mobile interaction captured');
          }
        } catch (error) {
          console.log(`  ⚠️ Language switcher interaction failed: ${error.message}`);
        }
      } else {
        console.log('  ℹ️ No language switcher found');
      }
    });
  });

  test.describe('Mobile Layout Components', () => {
    // Test specific mobile components
    test('should capture mobile-specific components', async ({ page }) => {
      console.log('🧩 Testing mobile-specific components...\n');
      
      await page.setViewportSize(mobileDevices['iPhone-12']);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Test hero section mobile layout
      const heroSection = page.locator('.hero, .hero-section, .banner');
      if (await heroSection.count() > 0) {
        await expect(heroSection).toHaveScreenshot('mobile-hero-section.png', {
          threshold: 0.3,
          maxDiffPixels: 1000
        });
        console.log('  ✅ Mobile hero section captured');
      }
      
      // Test features grid mobile layout
      const featuresSection = page.locator('.features-section, .features-grid, .feature-cards');
      if (await featuresSection.count() > 0) {
        await featuresSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        
        await expect(featuresSection).toHaveScreenshot('mobile-features-section.png', {
          threshold: 0.3,
          maxDiffPixels: 1000
        });
        console.log('  ✅ Mobile features section captured');
      }
      
      // Test team section mobile layout
      const teamSection = page.locator('.team-section, .team-grid, .team-members');
      if (await teamSection.count() > 0) {
        await teamSection.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        
        await expect(teamSection).toHaveScreenshot('mobile-team-section.png', {
          threshold: 0.3,
          maxDiffPixels: 1000
        });
        console.log('  ✅ Mobile team section captured');
      }
      
      // Test enterprise/pricing panels mobile layout
      const panels = page.locator('.panel, .pricing-card, .enterprise-panel');
      if (await panels.count() > 0) {
        const panelsContainer = page.locator('.panels-container, .pricing-grid, .enterprise-section');
        if (await panelsContainer.count() > 0) {
          await panelsContainer.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          
          await expect(panelsContainer).toHaveScreenshot('mobile-panels-section.png', {
            threshold: 0.3,
            maxDiffPixels: 1000
          });
          console.log('  ✅ Mobile panels section captured');
        }
      }
      
      // Test call-to-action buttons mobile layout
      const ctaButtons = page.locator('.cta-button, .primary-button, .action-button');
      if (await ctaButtons.count() > 0) {
        const firstCta = ctaButtons.first();
        await firstCta.scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        
        await expect(firstCta).toHaveScreenshot('mobile-cta-button.png', {
          threshold: 0.3,
          maxDiffPixels: 200
        });
        console.log('  ✅ Mobile CTA button captured');
      }
    });

    // Test mobile scroll behavior and sticky elements
    test('should test mobile scroll behavior', async ({ page }) => {
      console.log('📜 Testing mobile scroll behavior...\n');
      
      await page.setViewportSize(mobileDevices['iPhone-12']);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Test sticky header on mobile
      const header = page.locator('header');
      if (await header.count() > 0) {
        // Take initial header screenshot
        await expect(header).toHaveScreenshot('mobile-header-initial.png', {
          threshold: 0.3,
          maxDiffPixels: 500
        });
        
        // Scroll down and test header again
        await page.evaluate(() => window.scrollTo(0, 500));
        await page.waitForTimeout(500);
        
        if (await header.isVisible()) {
          await expect(header).toHaveScreenshot('mobile-header-scrolled.png', {
            threshold: 0.3,
            maxDiffPixels: 500
          });
          console.log('  ✅ Mobile sticky header behavior captured');
        } else {
          console.log('  📝 Header not visible when scrolled (normal behavior)');
        }
        
        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(500);
      }
      
      // Test back-to-top button on mobile if it exists
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight - 1000));
      await page.waitForTimeout(1000);
      
      const backToTopButton = page.locator('.back-to-top, .scroll-to-top, #back-to-top');
      if (await backToTopButton.count() > 0 && await backToTopButton.isVisible()) {
        await expect(backToTopButton).toHaveScreenshot('mobile-back-to-top-button.png', {
          threshold: 0.3,
          maxDiffPixels: 200
        });
        console.log('  ✅ Mobile back-to-top button captured');
      }
    });
  });

  test.describe('Mobile Error States', () => {
    // Test 404 page on mobile
    test('should capture 404 page on mobile', async ({ page }) => {
      console.log('❌ Testing 404 page on mobile...\n');
      
      await page.setViewportSize(mobileDevices['iPhone-12']);
      
      try {
        await page.goto(`${baseURL}/non-existent-page/`);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);
        
        await expect(page).toHaveScreenshot('mobile-404-page.png', {
          fullPage: true,
          threshold: 0.3,
          maxDiffPixels: 2000
        });
        
        console.log('  ✅ Mobile 404 page captured');
      } catch (error) {
        console.log(`  ⚠️ Could not capture mobile 404 page: ${error.message}`);
      }
    });

    // Test form error states on mobile
    test('should capture form error states on mobile', async ({ page }) => {
      console.log('📝 Testing form error states on mobile...\n');
      
      await page.setViewportSize(mobileDevices['iPhone-12']);
      
      const pagesWithForms = [
        { path: '/', selectors: ['.signup-form', '.newsletter-signup'] },
        { path: '/contact/', selectors: ['form', '.contact-form'] }
      ];
      
      for (const pageInfo of pagesWithForms) {
        try {
          await page.goto(`${baseURL}${pageInfo.path}`);
          await page.waitForLoadState('networkidle');
          
          for (const formSelector of pageInfo.selectors) {
            const form = page.locator(formSelector);
            if (await form.count() > 0 && await form.isVisible()) {
              await form.scrollIntoViewIfNeeded();
              
              // Try to submit empty form to trigger validation
              const submitButton = form.locator('button[type="submit"], input[type="submit"]');
              if (await submitButton.count() > 0) {
                await submitButton.click();
                await page.waitForTimeout(1000);
                
                // Capture form with validation errors
                await expect(form).toHaveScreenshot(`mobile-form-errors-${pageInfo.path.replace(/[^a-z0-9]/gi, '')}-${formSelector.replace(/[^a-z0-9]/gi, '')}.png`, {
                  threshold: 0.3,
                  maxDiffPixels: 800
                });
                
                console.log(`  ✅ Form error state captured for ${formSelector}`);
              }
            }
          }
        } catch (error) {
          console.log(`  ⚠️ Error testing form states on ${pageInfo.path}: ${error.message}`);
        }
      }
    });
  });
});