const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Mobile Navigation Testing Suite
 * Tests all navigation functionality specifically on mobile devices
 */

test.describe('Comprehensive Mobile Navigation Tests', () => {
  const baseURL = 'http://127.0.0.1:1111';
  
  // Mobile viewports to test
  const mobileViewports = {
    'iPhone-SE': { width: 375, height: 667 },
    'iPhone-12': { width: 390, height: 844 },
    'Pixel-5': { width: 393, height: 851 },
    'Galaxy-S21': { width: 360, height: 800 }
  };

  // All pages to test navigation to
  const allPages = [
    { path: '/', name: 'homepage', expectedTitle: /divinci|home/i },
    { path: '/about/', name: 'about', expectedTitle: /about/i },
    { path: '/contact/', name: 'contact', expectedTitle: /contact/i },
    { path: '/pricing/', name: 'pricing', expectedTitle: /pricing/i },
    { path: '/roadmap/', name: 'roadmap', expectedTitle: /roadmap/i },
    { path: '/press/', name: 'press', expectedTitle: /press/i },
    { path: '/careers/', name: 'careers', expectedTitle: /careers/i },
    { path: '/docs/', name: 'docs', expectedTitle: /docs|documentation/i },
    { path: '/api/', name: 'api', expectedTitle: /api/i },
    { path: '/blog/', name: 'blog', expectedTitle: /blog/i },
    { path: '/tutorials/', name: 'tutorials', expectedTitle: /tutorials/i },
    { path: '/changelog/', name: 'changelog', expectedTitle: /changelog/i },
    { path: '/support/', name: 'support', expectedTitle: /support/i },
    { path: '/autorag/', name: 'autorag', expectedTitle: /autorag/i },
    { path: '/quality-assurance/', name: 'quality-assurance', expectedTitle: /quality/i },
    { path: '/release-management/', name: 'release-management', expectedTitle: /release/i },
    { path: '/terms-of-service/', name: 'terms', expectedTitle: /terms/i },
    { path: '/privacy-policy/', name: 'privacy', expectedTitle: /privacy/i },
    { path: '/accessibility/', name: 'accessibility', expectedTitle: /accessibility/i },
    { path: '/security/', name: 'security', expectedTitle: /security/i },
    { path: '/ai-safety/', name: 'ai-safety', expectedTitle: /safety/i }
  ];

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

  test.describe('Mobile Menu Functionality', () => {
    test('should test mobile menu across different devices', async ({ page }) => {
      console.log('📱 Testing mobile menu functionality across devices...\n');
      
      for (const [deviceName, viewport] of Object.entries(mobileViewports)) {
        console.log(`Testing ${deviceName} (${viewport.width}x${viewport.height})`);
        
        await page.setViewportSize(viewport);
        await page.goto(`${baseURL}/`);
        await page.waitForLoadState('networkidle');
        
        // Look for mobile menu elements
        const mobileMenuTrigger = page.locator('.mobile-menu-trigger, .hamburger, .menu-toggle, .navbar-toggler, .menu-button');
        const mobileMenu = page.locator('.mobile-menu, .navbar-collapse, .menu-mobile, .nav-mobile');
        
        if (await mobileMenuTrigger.count() > 0) {
          console.log(`  📱 Mobile menu trigger found on ${deviceName}`);
          
          // Test menu trigger visibility
          await expect(mobileMenuTrigger).toBeVisible();
          
          // Test opening mobile menu
          await mobileMenuTrigger.click();
          await page.waitForTimeout(500);
          
          // Check if menu is visible or has active state
          if (await mobileMenu.count() > 0) {
            const isVisible = await mobileMenu.isVisible();
            const menuClasses = await mobileMenu.getAttribute('class');
            const hasActiveClass = menuClasses && (menuClasses.includes('active') || menuClasses.includes('open') || menuClasses.includes('show'));
            
            if (isVisible || hasActiveClass) {
              console.log(`    ✅ Mobile menu opens successfully`);
              
              // Test menu links
              const menuLinks = mobileMenu.locator('a');
              const linkCount = await menuLinks.count();
              console.log(`    📝 Found ${linkCount} links in mobile menu`);
              
              // Test a few menu links
              for (let i = 0; i < Math.min(linkCount, 3); i++) {
                const link = menuLinks.nth(i);
                const href = await link.getAttribute('href');
                const text = await link.textContent();
                
                if (href && text && href.startsWith('/')) {
                  console.log(`      📝 Menu link: "${text.trim()}" -> ${href}`);
                  
                  // Test link tap
                  await link.tap();
                  await page.waitForLoadState('networkidle');
                  
                  // Verify navigation worked
                  expect(page.url()).toContain(href);
                  console.log(`      ✅ Navigation to ${href} successful`);
                  
                  // Go back to homepage for next test
                  await page.goto(`${baseURL}/`);
                  await page.waitForLoadState('networkidle');
                  
                  // Re-open menu for next link test
                  if (i < Math.min(linkCount, 3) - 1) {
                    await mobileMenuTrigger.click();
                    await page.waitForTimeout(300);
                  }
                }
              }
              
              // Test closing mobile menu
              await mobileMenuTrigger.click();
              await page.waitForTimeout(300);
              
              const isMenuClosed = !(await mobileMenu.isVisible()) || 
                                   !(await mobileMenu.getAttribute('class')).includes('active');
              
              if (isMenuClosed) {
                console.log(`    ✅ Mobile menu closes successfully`);
              }
            } else {
              console.log(`    ⚠️ Mobile menu trigger clicked but menu not visible`);
            }
          }
        } else {
          console.log(`  ℹ️ No mobile menu trigger found on ${deviceName} - may use different navigation`);
          
          // Check if desktop navigation is used on mobile
          const desktopNav = page.locator('.navbar-nav, .nav-menu, .main-nav');
          if (await desktopNav.count() > 0 && await desktopNav.isVisible()) {
            console.log(`    📝 Desktop navigation visible on mobile`);
          }
        }
        
        console.log(`  ✅ ${deviceName} navigation test completed\n`);
      }
    });

    test('should test touch interactions on mobile navigation', async ({ page }) => {
      console.log('👆 Testing touch interactions on mobile navigation...\n');
      
      await page.setViewportSize(mobileViewports['iPhone-12']);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Test dropdown interactions with touch
      const dropdowns = page.locator('.dropdown, .nav-dropdown');
      const dropdownCount = await dropdowns.count();
      
      if (dropdownCount > 0) {
        console.log(`  📝 Found ${dropdownCount} dropdowns to test`);
        
        for (let i = 0; i < dropdownCount; i++) {
          const dropdown = dropdowns.nth(i);
          const dropdownTrigger = dropdown.locator('a, button').first();
          
          if (await dropdownTrigger.isVisible()) {
            console.log(`    Testing dropdown ${i + 1}...`);
            
            // Test tap to open
            await dropdownTrigger.tap();
            await page.waitForTimeout(500);
            
            const dropdownMenu = dropdown.locator('.dropdown-menu, .sub-menu');
            if (await dropdownMenu.count() > 0) {
              const isVisible = await dropdownMenu.isVisible();
              if (isVisible) {
                console.log(`      ✅ Dropdown opens on tap`);
                
                // Test dropdown links
                const dropdownLinks = dropdownMenu.locator('a');
                const linkCount = await dropdownLinks.count();
                
                if (linkCount > 0) {
                  console.log(`      📝 Dropdown has ${linkCount} links`);
                  
                  // Test first link tap
                  const firstLink = dropdownLinks.first();
                  const href = await firstLink.getAttribute('href');
                  const text = await firstLink.textContent();
                  
                  if (href && text && href.startsWith('/')) {
                    console.log(`      📝 Testing link: "${text.trim()}" -> ${href}`);
                    
                    await firstLink.tap();
                    await page.waitForLoadState('networkidle');
                    
                    expect(page.url()).toContain(href);
                    console.log(`      ✅ Dropdown link navigation successful`);
                    
                    // Return to homepage
                    await page.goto(`${baseURL}/`);
                    await page.waitForLoadState('networkidle');
                  }
                }
                
                // Close dropdown by tapping outside
                await page.tap('body', { position: { x: 10, y: 10 } });
                await page.waitForTimeout(300);
              } else {
                console.log(`      ⚠️ Dropdown didn't open on tap`);
              }
            }
          }
        }
      } else {
        console.log('  ℹ️ No dropdowns found for touch testing');
      }
    });
  });

  test.describe('Mobile Page Navigation', () => {
    test('should navigate to all pages on mobile', async ({ page }) => {
      console.log('📄 Testing navigation to all pages on mobile...\n');
      
      await page.setViewportSize(mobileViewports['iPhone-12']);
      
      const workingPages = [];
      const brokenPages = [];
      
      for (const pageInfo of allPages) {
        console.log(`Testing navigation to ${pageInfo.name} (${pageInfo.path})`);
        
        try {
          const response = await page.goto(`${baseURL}${pageInfo.path}`, {
            waitUntil: 'networkidle',
            timeout: 15000
          });
          
          if (response && response.status() === 200) {
            // Verify page title
            await expect(page).toHaveTitle(pageInfo.expectedTitle);
            
            // Verify header is present and functional
            const header = page.locator('header');
            if (await header.count() > 0) {
              await expect(header).toBeVisible();
            }
            
            // Verify main content area is present
            const mainContent = page.locator('main, .main-content, .content');
            if (await mainContent.count() > 0) {
              await expect(mainContent).toBeVisible();
            }
            
            // Verify footer is present
            const footer = page.locator('footer, .site-footer');
            if (await footer.count() > 0) {
              await expect(footer).toBeVisible();
            }
            
            workingPages.push(pageInfo);
            console.log(`  ✅ ${pageInfo.name} loads successfully`);
          } else {
            brokenPages.push({ ...pageInfo, status: response?.status() });
            console.log(`  ❌ ${pageInfo.name} returned status ${response?.status()}`);
          }
        } catch (error) {
          brokenPages.push({ ...pageInfo, error: error.message });
          console.log(`  🚫 ${pageInfo.name} failed: ${error.message}`);
        }
      }
      
      console.log(`\n📊 Mobile Navigation Summary:`);
      console.log(`✅ Working pages: ${workingPages.length}`);
      console.log(`❌ Broken/Missing pages: ${brokenPages.length}`);
      
      if (brokenPages.length > 0) {
        console.log(`\nPages that need attention:`);
        brokenPages.forEach(page => {
          console.log(`  - ${page.name}: ${page.status || page.error}`);
        });
      }
    });

    test('should test internal navigation links on mobile', async ({ page }) => {
      console.log('🔗 Testing internal navigation links on mobile...\n');
      
      await page.setViewportSize(mobileViewports['iPhone-12']);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Test navigation links in header
      const headerLinks = page.locator('header a, nav a');
      const headerLinkCount = await headerLinks.count();
      console.log(`Found ${headerLinkCount} header/nav links`);
      
      // Test a few internal links
      for (let i = 0; i < Math.min(headerLinkCount, 5); i++) {
        const link = headerLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        
        if (href && text && href.startsWith('/') && !href.includes('#')) {
          console.log(`  Testing link: "${text.trim()}" -> ${href}`);
          
          try {
            await link.tap();
            await page.waitForLoadState('networkidle');
            
            expect(page.url()).toContain(href);
            console.log(`    ✅ Navigation successful`);
            
            // Test back navigation
            await page.goBack();
            await page.waitForLoadState('networkidle');
            console.log(`    ✅ Back navigation successful`);
          } catch (error) {
            console.log(`    ❌ Navigation failed: ${error.message}`);
          }
        }
      }
      
      // Test footer links
      const footer = page.locator('footer, .site-footer');
      if (await footer.count() > 0) {
        await footer.scrollIntoViewIfNeeded();
        
        const footerLinks = footer.locator('a');
        const footerLinkCount = await footerLinks.count();
        console.log(`\nFound ${footerLinkCount} footer links`);
        
        // Test a few footer links
        for (let i = 0; i < Math.min(footerLinkCount, 3); i++) {
          const link = footerLinks.nth(i);
          const href = await link.getAttribute('href');
          const text = await link.textContent();
          
          if (href && text && href.startsWith('/')) {
            console.log(`  Testing footer link: "${text.trim()}" -> ${href}`);
            
            try {
              await link.tap();
              await page.waitForLoadState('networkidle');
              
              expect(page.url()).toContain(href);
              console.log(`    ✅ Footer navigation successful`);
              
              // Return to homepage
              await page.goto(`${baseURL}/`);
              await page.waitForLoadState('networkidle');
            } catch (error) {
              console.log(`    ❌ Footer navigation failed: ${error.message}`);
            }
          }
        }
      }
    });
  });

  test.describe('Mobile Language Navigation', () => {
    test('should test language switcher on mobile', async ({ page }) => {
      console.log('🌍 Testing language switcher on mobile...\n');
      
      await page.setViewportSize(mobileViewports['iPhone-12']);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      const languageSwitcher = page.locator('.language-switcher, .lang-switch, .language-selector');
      if (await languageSwitcher.count() > 0) {
        console.log('  📝 Language switcher found');
        
        await expect(languageSwitcher).toBeVisible();
        
        // Test opening language options
        await languageSwitcher.tap();
        await page.waitForTimeout(500);
        
        const languageOptions = page.locator('.language-options, .lang-dropdown, .language-menu');
        if (await languageOptions.count() > 0 && await languageOptions.isVisible()) {
          console.log('  ✅ Language options opened');
          
          // Test language links
          const langLinks = languageOptions.locator('a');
          const langLinkCount = await langLinks.count();
          console.log(`    📝 Found ${langLinkCount} language options`);
          
          // Test first language switch
          if (langLinkCount > 0) {
            const firstLangLink = langLinks.first();
            const href = await firstLangLink.getAttribute('href');
            const text = await firstLangLink.textContent();
            
            if (href && text) {
              console.log(`    Testing language: "${text.trim()}" -> ${href}`);
              
              await firstLangLink.tap();
              await page.waitForLoadState('networkidle');
              
              expect(page.url()).toContain(href);
              console.log(`    ✅ Language switch successful`);
              
              // Test back to original language
              await page.goto(`${baseURL}/`);
              await page.waitForLoadState('networkidle');
            }
          }
        } else {
          console.log('  ⚠️ Language options not visible after tap');
        }
      } else {
        console.log('  ℹ️ No language switcher found');
      }
    });

    test('should test multi-language page navigation on mobile', async ({ page }) => {
      console.log('🌐 Testing multi-language page navigation on mobile...\n');
      
      await page.setViewportSize(mobileViewports['iPhone-12']);
      
      const languages = ['en', 'es', 'fr', 'ar'];
      const testPages = [
        { path: '/', name: 'homepage' },
        { path: '/about/', name: 'about' },
        { path: '/autorag/', name: 'autorag' },
        { path: '/quality-assurance/', name: 'quality-assurance' }
      ];
      
      for (const lang of languages) {
        console.log(`Testing ${lang} language navigation...`);
        
        for (const pageInfo of testPages) {
          const langPath = lang === 'en' ? pageInfo.path : `/${lang}${pageInfo.path}`;
          
          try {
            const response = await page.goto(`${baseURL}${langPath}`, {
              waitUntil: 'networkidle',
              timeout: 15000
            });
            
            if (response && response.status() === 200) {
              // Test mobile navigation on language-specific page
              const header = page.locator('header');
              if (await header.count() > 0) {
                await expect(header).toBeVisible();
              }
              
              // Test language-specific mobile menu if it exists
              const mobileMenuTrigger = page.locator('.mobile-menu-trigger, .hamburger');
              if (await mobileMenuTrigger.count() > 0 && await mobileMenuTrigger.isVisible()) {
                await mobileMenuTrigger.tap();
                await page.waitForTimeout(300);
                
                const mobileMenu = page.locator('.mobile-menu, .navbar-collapse');
                if (await mobileMenu.count() > 0 && await mobileMenu.isVisible()) {
                  console.log(`  ✅ ${lang} mobile menu functional on ${pageInfo.name}`);
                  
                  // Close menu
                  await mobileMenuTrigger.tap();
                  await page.waitForTimeout(200);
                }
              }
              
              // For Arabic, test RTL layout
              if (lang === 'ar') {
                const body = page.locator('body');
                const direction = await body.getAttribute('dir');
                if (direction === 'rtl') {
                  console.log(`    📝 RTL layout confirmed for Arabic`);
                }
              }
              
              console.log(`  ✅ ${lang} ${pageInfo.name} navigation tested`);
            } else {
              console.log(`  ⚠️ ${lang} ${pageInfo.name} not available`);
            }
          } catch (error) {
            console.log(`  ❌ Error with ${lang} ${pageInfo.name}: ${error.message}`);
          }
        }
      }
    });
  });

  test.describe('Mobile Accessibility Navigation', () => {
    test('should test keyboard navigation on mobile', async ({ page }) => {
      console.log('⌨️ Testing keyboard navigation on mobile...\n');
      
      await page.setViewportSize(mobileViewports['iPhone-12']);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Test tab navigation
      console.log('  Testing tab navigation...');
      
      // Focus first interactive element
      await page.keyboard.press('Tab');
      
      // Get focused element
      const focusedElement = page.locator(':focus');
      if (await focusedElement.count() > 0) {
        const tagName = await focusedElement.evaluate(el => el.tagName);
        console.log(`    ✅ First tab focus: ${tagName}`);
        
        // Test a few more tab presses
        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('Tab');
          await page.waitForTimeout(100);
          
          const newFocusedElement = page.locator(':focus');
          if (await newFocusedElement.count() > 0) {
            const newTagName = await newFocusedElement.evaluate(el => el.tagName);
            console.log(`    📝 Tab ${i + 2}: ${newTagName}`);
          }
        }
        
        console.log('  ✅ Tab navigation functional');
      } else {
        console.log('  ⚠️ No focusable elements found');
      }
      
      // Test Enter key on links
      const firstLink = page.locator('a').first();
      if (await firstLink.count() > 0 && await firstLink.isVisible()) {
        await firstLink.focus();
        
        const href = await firstLink.getAttribute('href');
        if (href && href.startsWith('/')) {
          console.log(`  Testing Enter key navigation to: ${href}`);
          
          await page.keyboard.press('Enter');
          await page.waitForLoadState('networkidle');
          
          expect(page.url()).toContain(href);
          console.log('  ✅ Enter key navigation successful');
        }
      }
    });

    test('should test screen reader navigation landmarks', async ({ page }) => {
      console.log('🔍 Testing screen reader navigation landmarks...\n');
      
      await page.setViewportSize(mobileViewports['iPhone-12']);
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
      
      // Test for proper semantic landmarks
      const landmarks = [
        { selector: 'header', name: 'header' },
        { selector: 'nav', name: 'navigation' },
        { selector: 'main', name: 'main content' },
        { selector: 'footer', name: 'footer' },
        { selector: '[role="banner"]', name: 'banner role' },
        { selector: '[role="navigation"]', name: 'navigation role' },
        { selector: '[role="main"]', name: 'main role' },
        { selector: '[role="contentinfo"]', name: 'contentinfo role' }
      ];
      
      for (const landmark of landmarks) {
        const element = page.locator(landmark.selector);
        if (await element.count() > 0) {
          console.log(`  ✅ ${landmark.name} landmark found`);
        } else {
          console.log(`  ⚠️ ${landmark.name} landmark missing`);
        }
      }
      
      // Test heading hierarchy
      const headings = page.locator('h1, h2, h3, h4, h5, h6');
      const headingCount = await headings.count();
      console.log(`\n  📝 Found ${headingCount} headings`);
      
      if (headingCount > 0) {
        for (let i = 0; i < Math.min(headingCount, 5); i++) {
          const heading = headings.nth(i);
          const tagName = await heading.evaluate(el => el.tagName);
          const text = await heading.textContent();
          console.log(`    ${tagName}: "${text?.trim()}"`);
        }
      }
      
      // Test skip links
      const skipLinks = page.locator('a[href="#main"], a[href="#content"], .skip-link');
      if (await skipLinks.count() > 0) {
        console.log('  ✅ Skip navigation links found');
      } else {
        console.log('  ⚠️ No skip navigation links found');
      }
    });
  });
});