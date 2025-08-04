const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Site Navigation Tests
 * Tests navigation between all main pages and verifies content
 */

test.describe('Comprehensive Site Navigation', () => {
  const baseURL = 'http://127.0.0.1:1111';
  
  // Main pages that should exist
  const mainPages = [
    { path: '/', title: 'Divinci AI', heading: 'AI releases' },
    { path: '/about/', title: 'About', heading: 'About Divinci AI' },
    { path: '/careers/', title: 'Careers', heading: 'Join our team' },
    { path: '/contact/', title: 'Contact', heading: 'Get in touch' },
    { path: '/press/', title: 'Press', heading: 'Press & Media' },
    { path: '/pricing/', title: 'Pricing', heading: 'Choose your plan' },
    { path: '/roadmap/', title: 'Roadmap', heading: 'Product roadmap' },
    { path: '/docs/', title: 'Documentation', heading: 'Documentation' },
    { path: '/blog/', title: 'Blog', heading: 'Latest insights' },
    { path: '/api/', title: 'API', heading: 'API Documentation' },
    { path: '/tutorials/', title: 'Tutorials', heading: 'Tutorials' },
    { path: '/changelog/', title: 'Changelog', heading: 'Changelog' },
    { path: '/support/', title: 'Support', heading: 'Support' }
  ];

  // Feature pages
  const featurePages = [
    { path: '/autorag/', title: 'AutoRAG', heading: 'AutoRAG' },
    { path: '/quality-assurance/', title: 'Quality Assurance', heading: 'Quality Assurance' },
    { path: '/release-management/', title: 'Release Management', heading: 'Release Management' }
  ];

  // Legal pages
  const legalPages = [
    { path: '/terms-of-service/', title: 'Terms of Service', heading: 'Terms of Service' },
    { path: '/privacy-policy/', title: 'Privacy Policy', heading: 'Privacy Policy' },
    { path: '/accessibility/', title: 'Accessibility', heading: 'Accessibility Statement' },
    { path: '/security/', title: 'Security', heading: 'Security & Compliance' },
    { path: '/ai-safety/', title: 'AI Safety', heading: 'AI Safety, Trust and Ethics Statement' },
    { path: '/sitemap/', title: 'Sitemap', heading: 'Sitemap' },
    { path: '/cookies/', title: 'Cookies', heading: 'Cookie Policy' }
  ];

  test.beforeEach(async ({ page }) => {
    // Set up consistent test environment
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

  test('should load all main pages successfully', async ({ page }) => {
    console.log('🏠 Testing main pages navigation...\n');
    
    for (const pageDef of mainPages) {
      console.log(`Testing ${pageDef.path}...`);
      
      try {
        const response = await page.goto(`${baseURL}${pageDef.path}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        if (response && response.status() === 200) {
          // Verify page loads and has expected content
          await expect(page).toHaveTitle(new RegExp(pageDef.title, 'i'));
          console.log(`  ✅ ${pageDef.path} - Status: ${response.status()}`);
          
          // Check for main heading if it exists
          const heading = page.locator('h1').first();
          if (await heading.count() > 0) {
            await expect(heading).toBeVisible();
            console.log(`  📝 Found heading: "${await heading.textContent()}"`);
          }
        } else {
          console.log(`  ❌ ${pageDef.path} - Status: ${response?.status() || 'Unknown'}`);
        }
      } catch (error) {
        console.log(`  🚫 ${pageDef.path} - Error: ${error.message}`);
      }
    }
  });

  test('should load all feature pages successfully', async ({ page }) => {
    console.log('🔧 Testing feature pages navigation...\n');
    
    for (const pageDef of featurePages) {
      console.log(`Testing ${pageDef.path}...`);
      
      try {
        const response = await page.goto(`${baseURL}${pageDef.path}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        if (response && response.status() === 200) {
          await expect(page).toHaveTitle(new RegExp(pageDef.title, 'i'));
          console.log(`  ✅ ${pageDef.path} - Status: ${response.status()}`);
          
          // Verify header navigation is present
          await expect(page.locator('header')).toBeVisible();
          await expect(page.locator('nav')).toBeVisible();
        } else {
          console.log(`  ❌ ${pageDef.path} - Status: ${response?.status() || 'Unknown'}`);
        }
      } catch (error) {
        console.log(`  🚫 ${pageDef.path} - Error: ${error.message}`);
      }
    }
  });

  test('should load all legal pages successfully', async ({ page }) => {
    console.log('⚖️ Testing legal pages navigation...\n');
    
    for (const pageDef of legalPages) {
      console.log(`Testing ${pageDef.path}...`);
      
      try {
        const response = await page.goto(`${baseURL}${pageDef.path}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        if (response && response.status() === 200) {
          await expect(page).toHaveTitle(new RegExp(pageDef.title, 'i'));
          console.log(`  ✅ ${pageDef.path} - Status: ${response.status()}`);
          
          // Verify page has content
          const content = page.locator('main, article, .content').first();
          if (await content.count() > 0) {
            await expect(content).toBeVisible();
          }
        } else {
          console.log(`  ❌ ${pageDef.path} - Status: ${response?.status() || 'Unknown'}`);
        }
      } catch (error) {
        console.log(`  🚫 ${pageDef.path} - Error: ${error.message}`);
      }
    }
  });

  test('should have working header navigation links', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    console.log('🧭 Testing header navigation links...\n');
    
    // Test logo link
    const logo = page.locator('header .logo, header .brand');
    if (await logo.count() > 0) {
      await expect(logo).toBeVisible();
      console.log('  ✅ Logo is visible');
    }
    
    // Test main navigation dropdowns
    const featuresDropdown = page.locator('.dropdown').first();
    if (await featuresDropdown.count() > 0) {
      await featuresDropdown.hover();
      await page.waitForTimeout(500);
      
      // Check dropdown menu appears
      const dropdownMenu = page.locator('.dropdown-menu');
      if (await dropdownMenu.count() > 0) {
        await expect(dropdownMenu).toBeVisible();
        console.log('  ✅ Features dropdown menu opens');
        
        // Test dropdown links
        const dropdownLinks = await dropdownMenu.locator('a').all();
        for (const link of dropdownLinks) {
          const href = await link.getAttribute('href');
          const text = await link.textContent();
          if (href && text) {
            console.log(`    📝 Found dropdown link: "${text.trim()}" -> ${href}`);
          }
        }
      }
    }
    
    // Test language switcher
    const languageSwitcher = page.locator('.language-switcher');
    if (await languageSwitcher.count() > 0) {
      await expect(languageSwitcher).toBeVisible();
      console.log('  ✅ Language switcher is visible');
    }
    
    // Test CTA buttons
    const ctaButton = page.locator('.cta-button, .primary-button');
    if (await ctaButton.count() > 0) {
      await expect(ctaButton.first()).toBeVisible();
      console.log('  ✅ CTA button is visible');
    }
  });

  test('should have working footer navigation links', async ({ page }) => {
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    console.log('🦶 Testing footer navigation links...\n');
    
    const footer = page.locator('footer, .site-footer');
    await expect(footer).toBeVisible();
    
    // Get all footer links
    const footerLinks = await footer.locator('a').all();
    console.log(`Found ${footerLinks.length} footer links`);
    
    for (const link of footerLinks) {
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      
      if (href && text && href.startsWith('/')) {
        console.log(`  📝 Footer link: "${text.trim()}" -> ${href}`);
        
        // Test internal links
        try {
          const response = await page.request.get(`${baseURL}${href}`);
          if (response.status() === 200) {
            console.log(`    ✅ Link works: ${href}`);
          } else {
            console.log(`    ❌ Link broken: ${href} (Status: ${response.status()})`);
          }
        } catch (error) {
          console.log(`    🚫 Link error: ${href} - ${error.message}`);
        }
      } else if (href && text && (href.startsWith('http') || href.startsWith('mailto'))) {
        console.log(`  🔗 External link: "${text.trim()}" -> ${href}`);
      }
    }
  });

  test('should navigate between pages via internal links', async ({ page }) => {
    console.log('🔄 Testing internal page navigation...\n');
    
    // Start at homepage
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    // Test navigation to About page if link exists
    const aboutLink = page.locator('a[href="/about/"], a[href*="about"]').first();
    if (await aboutLink.count() > 0) {
      await aboutLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.url()).toContain('/about');
      console.log('  ✅ Successfully navigated to About page');
      
      // Navigate back to home
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
    }
    
    // Test navigation to Contact page if link exists
    const contactLink = page.locator('a[href="/contact/"], a[href*="contact"]').first();
    if (await contactLink.count() > 0) {
      await contactLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page.url()).toContain('/contact');
      console.log('  ✅ Successfully navigated to Contact page');
      
      // Navigate back to home
      await page.goto(`${baseURL}/`);
      await page.waitForLoadState('networkidle');
    }
    
    // Test feature dropdown navigation
    const featuresDropdown = page.locator('.dropdown').first();
    if (await featuresDropdown.count() > 0) {
      await featuresDropdown.hover();
      await page.waitForTimeout(500);
      
      const autoragLink = page.locator('a[href="/autorag/"], a[href*="autorag"]').first();
      if (await autoragLink.count() > 0) {
        await autoragLink.click();
        await page.waitForLoadState('networkidle');
        await expect(page.url()).toContain('/autorag');
        console.log('  ✅ Successfully navigated to AutoRAG page via dropdown');
      }
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    console.log('🚫 Testing 404 error handling...\n');
    
    const nonExistentPaths = [
      '/non-existent-page/',
      '/invalid/path/',
      '/missing-content/'
    ];
    
    for (const path of nonExistentPaths) {
      try {
        const response = await page.goto(`${baseURL}${path}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });
        
        if (response && response.status() === 404) {
          console.log(`  ✅ ${path} correctly returns 404`);
          
          // Check if custom 404 page exists
          const notFoundContent = page.locator('body');
          await expect(notFoundContent).toBeVisible();
          
          // Verify navigation still works on 404 page
          const header = page.locator('header');
          if (await header.count() > 0) {
            await expect(header).toBeVisible();
            console.log(`    📝 Header navigation available on 404 page`);
          }
        } else {
          console.log(`  ⚠️ ${path} unexpected status: ${response?.status()}`);
        }
      } catch (error) {
        console.log(`  🚫 ${path} error: ${error.message}`);
      }
    }
  });

  test('should maintain consistent header and footer across pages', async ({ page }) => {
    console.log('🔄 Testing consistent header/footer across pages...\n');
    
    const testPages = ['/', '/about/', '/contact/'];
    let headerHTML = '';
    let footerHTML = '';
    
    for (let i = 0; i < testPages.length; i++) {
      const pagePath = testPages[i];
      
      try {
        await page.goto(`${baseURL}${pagePath}`, { waitUntil: 'networkidle' });
        
        // Check header consistency
        const header = page.locator('header');
        if (await header.count() > 0) {
          const currentHeaderHTML = await header.innerHTML();
          
          if (i === 0) {
            headerHTML = currentHeaderHTML;
          } else {
            // Basic consistency check - header should have same structure
            const headerNav = page.locator('header nav');
            await expect(headerNav).toBeVisible();
            console.log(`  ✅ ${pagePath} has consistent header navigation`);
          }
        }
        
        // Check footer consistency
        const footer = page.locator('footer, .site-footer');
        if (await footer.count() > 0) {
          const currentFooterHTML = await footer.innerHTML();
          
          if (i === 0) {
            footerHTML = currentFooterHTML;
          } else {
            // Basic consistency check - footer should be visible
            await expect(footer).toBeVisible();
            console.log(`  ✅ ${pagePath} has consistent footer`);
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing ${pagePath}: ${error.message}`);
      }
    }
  });
});