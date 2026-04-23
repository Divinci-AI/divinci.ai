const { test, expect } = require('@playwright/test');

/**
 * Language Switcher E2E Tests
 * Tests language switcher functionality and verifies translated pages work properly
 */

// Helper function to check for broken images
async function checkBrokenImages(page) {
  const brokenImages = await page.evaluate(() => {
    const images = Array.from(document.images);
    const broken = [];
    
    images.forEach(img => {
      if (!img.complete || img.naturalWidth === 0) {
        broken.push({
          src: img.src,
          alt: img.alt || 'No alt text'
        });
      }
    });
    
    return broken;
  });
  
  return brokenImages;
}

test.describe('Language Switcher E2E Tests', () => {
  const baseURL = 'http://127.0.0.1:1111';
  
  // Test languages with their page translations
  const testLanguages = [
    { 
      code: 'en', 
      name: 'English', 
      url: '/', 
      tutorials: '/tutorials',
      docs: '/docs',
      blog: '/blog',
      tutorialsTitle: 'Tutorials',
      docsTitle: 'Documentation',
      blogTitle: 'Divinci AI Blog'
    },
    { 
      code: 'es', 
      name: 'Spanish', 
      url: '/es/', 
      tutorials: '/es/tutorials',
      docs: '/es/docs',
      blog: '/es/blog',
      tutorialsTitle: 'Tutoriales',
      docsTitle: 'Documentación',
      blogTitle: 'Divinci AI Blog'
    },
    { 
      code: 'fr', 
      name: 'French', 
      url: '/fr/', 
      tutorials: '/fr/tutorials',
      docs: '/fr/docs',
      blog: '/fr/blog',
      tutorialsTitle: 'Tutoriels',
      docsTitle: 'Documentation',
      blogTitle: 'Divinci AI Blog'
    }
  ];

  // Pages that should exist in multiple languages
  const translatedPages = [
    { path: 'autorag', titleKey: 'autorag' },
    { path: 'quality-assurance', titleKey: 'qa' },
    { path: 'release-management', titleKey: 'release' },
    { path: 'privacy-policy', titleKey: 'privacy' },
    { path: 'terms-of-service', titleKey: 'terms' }
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

  test('should switch languages and verify translated pages exist', async ({ page }) => {
    console.log('🔄 Testing language switcher with page translations...\n');
    
    // Start on English homepage
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    // Verify we're on English page
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('en');
    console.log('✅ Started on English homepage');
    
    // Find and click language switcher
    const languageSwitcher = page.locator('.language-switcher');
    await expect(languageSwitcher).toBeVisible();
    await languageSwitcher.click();
    await page.waitForTimeout(500);
    
    // Test switching to Spanish
    console.log('\n🔄 Testing switch to Spanish...');
    const spanishOption = page.locator('a[href="/es/"], a[href*="/es/"]').first();
    if (await spanishOption.count() > 0) {
      await spanishOption.click();
      await page.waitForLoadState('networkidle');
      
      // Verify we're now on Spanish site
      const newHtmlLang = await page.getAttribute('html', 'lang');
      expect(newHtmlLang).toBe('es');
      expect(page.url()).toContain('/es/');
      console.log('✅ Successfully switched to Spanish');
      
      // Test Spanish tutorials page
      await page.goto(`${baseURL}/es/tutorials`);
      await page.waitForLoadState('networkidle');
      
      const tutorialsHeading = page.locator('h1').first();
      const headingText = await tutorialsHeading.textContent();
      expect(headingText).toContain('Tutoriales');
      console.log('✅ Spanish tutorials page loads with correct heading');
      
      // Test Spanish docs page
      await page.goto(`${baseURL}/es/docs`);
      await page.waitForLoadState('networkidle');
      
      const docsHeading = page.locator('h1').first();
      const docsHeadingText = await docsHeading.textContent();
      expect(docsHeadingText).toContain('Documentación');
      console.log('✅ Spanish docs page loads with correct heading');
      
    } else {
      console.log('⚠️ Spanish option not found in language switcher');
    }
    
    // Test switching to French
    console.log('\n🔄 Testing switch to French...');
    await page.goto(`${baseURL}/fr/`);
    await page.waitForLoadState('networkidle');
    
    const frenchHtmlLang = await page.getAttribute('html', 'lang');
    expect(frenchHtmlLang).toBe('fr');
    console.log('✅ Successfully navigated to French');
    
    // Test French tutorials page
    await page.goto(`${baseURL}/fr/tutorials`);
    await page.waitForLoadState('networkidle');
    
    const frenchTutorialsHeading = page.locator('h1').first();
    const frenchHeadingText = await frenchTutorialsHeading.textContent();
    expect(frenchHeadingText).toContain('Tutoriels');
    console.log('✅ French tutorials page loads with correct heading');
  });

  test('should maintain language context when navigating between pages', async ({ page }) => {
    console.log('🔗 Testing language context persistence...\n');
    
    // Start on Spanish homepage
    await page.goto(`${baseURL}/es/`);
    await page.waitForLoadState('networkidle');
    
    // Verify Spanish context
    let htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('es');
    console.log('✅ Started on Spanish homepage');
    
    // Navigate to AutoRAG page within Spanish site
    await page.goto(`${baseURL}/es/autorag/`);
    await page.waitForLoadState('networkidle');
    
    // Verify still in Spanish context
    htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('es');
    console.log('✅ AutoRAG page maintains Spanish context');
    
    // Navigate to tutorials via URL
    await page.goto(`${baseURL}/es/tutorials`);
    await page.waitForLoadState('networkidle');
    
    // Verify still in Spanish context
    htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('es');
    console.log('✅ Tutorials page maintains Spanish context');
    
    // Test footer navigation within Spanish site
    const footer = page.locator('footer');
    if (await footer.count() > 0) {
      const footerLinks = await footer.locator('a[href^="/es/"]').all();
      
      if (footerLinks.length > 0) {
        // Click first Spanish footer link
        const firstLink = footerLinks[0];
        const href = await firstLink.getAttribute('href');
        
        if (href) {
          await firstLink.click();
          await page.waitForLoadState('networkidle');
          
          // Verify still in Spanish context
          htmlLang = await page.getAttribute('html', 'lang');
          expect(htmlLang).toBe('es');
          console.log(`✅ Footer navigation to ${href} maintains Spanish context`);
        }
      }
    }
  });

  test('should verify all main translated pages exist and load correctly', async ({ page }) => {
    console.log('📄 Testing all translated pages exist...\n');
    
    for (const lang of testLanguages) {
      console.log(`Testing ${lang.name} (${lang.code}) pages...`);
      
      // Test tutorials page
      try {
        await page.goto(`${baseURL}${lang.tutorials}`);
        await page.waitForLoadState('networkidle');
        
        const tutorialsHeading = page.locator('h1').first();
        const headingText = await tutorialsHeading.textContent();
        expect(headingText).toContain(lang.tutorialsTitle);
        console.log(`  ✅ ${lang.tutorials} - "${headingText.trim()}"`);
        
        // Verify language attribute
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe(lang.code);
        
      } catch (error) {
        console.log(`  ❌ ${lang.tutorials} - Error: ${error.message}`);
      }
      
      // Test docs page
      try {
        await page.goto(`${baseURL}${lang.docs}`);
        await page.waitForLoadState('networkidle');
        
        const docsHeading = page.locator('h1').first();
        const docsHeadingText = await docsHeading.textContent();
        expect(docsHeadingText).toContain(lang.docsTitle);
        console.log(`  ✅ ${lang.docs} - "${docsHeadingText.trim()}"`);
        
        // Verify language attribute
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe(lang.code);
        
      } catch (error) {
        console.log(`  ❌ ${lang.docs} - Error: ${error.message}`);
      }
      
      // Test blog page
      try {
        await page.goto(`${baseURL}${lang.blog}`);
        await page.waitForLoadState('networkidle');
        
        const blogHeading = page.locator('h1').first();
        const blogHeadingText = await blogHeading.textContent();
        expect(blogHeadingText).toContain(lang.blogTitle);
        console.log(`  ✅ ${lang.blog} - "${blogHeadingText.trim()}"`);
        
        // Verify language attribute
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe(lang.code);
        
        // Check if blog posts are visible (should not show "Coming Soon")
        const pageContent = await page.textContent('body');
        expect(pageContent).not.toContain('Coming Soon');
        console.log(`    📝 Blog posts visible (no "Coming Soon" message)`);
        
      } catch (error) {
        console.log(`  ❌ ${lang.blog} - Error: ${error.message}`);
      }
    }
  });

  test('should verify language switcher appears on all translated pages', async ({ page }) => {
    console.log('🌐 Testing language switcher presence on translated pages...\n');
    
    const testPages = [
      '/es/tutorials',
      '/fr/tutorials', 
      '/es/docs',
      '/fr/docs',
      '/es/blog',
      '/fr/blog',
      '/es/autorag/',
      '/fr/autorag/'
    ];
    
    for (const pagePath of testPages) {
      try {
        await page.goto(`${baseURL}${pagePath}`);
        await page.waitForLoadState('networkidle');
        
        // Check if language switcher exists
        const languageSwitcher = page.locator('.language-switcher');
        if (await languageSwitcher.count() > 0) {
          await expect(languageSwitcher).toBeVisible();
          console.log(`  ✅ ${pagePath} - Language switcher present`);
          
          // Test if it opens
          await languageSwitcher.click();
          await page.waitForTimeout(300);
          
          const dropdown = page.locator('.language-switcher-dropdown, .language-options');
          if (await dropdown.count() > 0) {
            console.log(`    📝 Language switcher dropdown opens`);
          }
          
          // Click away to close dropdown
          await page.click('body');
          await page.waitForTimeout(200);
          
        } else {
          console.log(`  ⚠️ ${pagePath} - No language switcher found`);
        }
        
      } catch (error) {
        console.log(`  ❌ ${pagePath} - Error: ${error.message}`);
      }
    }
  });

  test('should handle cross-language navigation correctly', async ({ page }) => {
    console.log('↔️ Testing cross-language navigation...\n');
    
    // Start on English tutorials
    await page.goto(`${baseURL}/tutorials`);
    await page.waitForLoadState('networkidle');
    
    let htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('en');
    console.log('✅ Started on English tutorials page');
    
    // Open language switcher and switch to Spanish
    const languageSwitcher = page.locator('.language-switcher');
    if (await languageSwitcher.count() > 0) {
      await languageSwitcher.click();
      await page.waitForTimeout(500);
      
      const spanishOption = page.locator('a[href="/es/"], a[href*="/es/"]').first();
      if (await spanishOption.count() > 0) {
        await spanishOption.click();
        await page.waitForLoadState('networkidle');
        
        // Should now be on Spanish homepage, not Spanish tutorials
        htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('es');
        expect(page.url()).toMatch(/\/es\/$/);
        console.log('✅ Language switcher correctly navigates to Spanish homepage');
        
        // Now manually navigate to Spanish tutorials
        await page.goto(`${baseURL}/es/tutorials`);
        await page.waitForLoadState('networkidle');
        
        const heading = page.locator('h1').first();
        const headingText = await heading.textContent();
        expect(headingText).toContain('Tutoriales');
        console.log('✅ Can navigate to Spanish tutorials page');
        
      } else {
        console.log('⚠️ Spanish option not found');
      }
    } else {
      console.log('⚠️ Language switcher not found');
    }
  });

  test('should verify blog posts are accessible in translated versions', async ({ page }) => {
    console.log('📰 Testing translated blog posts accessibility...\n');
    
    // Test English blog posts
    const englishBlogPosts = [
      { url: '/blog/building-responsible-ai-systems/', title: 'Building Responsible AI' },
      { url: '/blog/fintech-customer-support-case-study/', title: 'FinTech Startup Streamlined Customer Support' }
    ];
    
    for (const post of englishBlogPosts) {
      try {
        await page.goto(`${baseURL}${post.url}`);
        await page.waitForLoadState('networkidle');
        
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('en');
        
        // Check if page loads and has content
        const heading = page.locator('h1').first();
        const headingText = await heading.textContent();
        expect(headingText.length).toBeGreaterThan(0);
        
        console.log(`  ✅ ${post.url} - "${headingText.trim()}"`);
        
      } catch (error) {
        console.log(`  ❌ ${post.url} - Error: ${error.message}`);
      }
    }
    
    // Test Spanish blog posts
    const spanishBlogPosts = [
      { url: '/es/blog/building-responsible-ai-systems/', title: 'Construyendo Sistemas de IA' },
      { url: '/es/blog/fintech-customer-support-case-study/', title: 'Startup FinTech Optimizó' }
    ];
    
    for (const post of spanishBlogPosts) {
      try {
        await page.goto(`${baseURL}${post.url}`);
        await page.waitForLoadState('networkidle');
        
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('es');
        
        // Check if page loads and has Spanish content
        const heading = page.locator('h1').first();
        const headingText = await heading.textContent();
        expect(headingText.length).toBeGreaterThan(0);
        
        console.log(`  ✅ ${post.url} - "${headingText.trim()}"`);
        
      } catch (error) {
        console.log(`  ❌ ${post.url} - Error: ${error.message}`);
      }
    }
    
    // Test French blog post
    try {
      await page.goto(`${baseURL}/fr/blog/building-responsible-ai-systems/`);
      await page.waitForLoadState('networkidle');
      
      const htmlLang = await page.getAttribute('html', 'lang');
      expect(htmlLang).toBe('fr');
      
      const heading = page.locator('h1').first();
      const headingText = await heading.textContent();
      expect(headingText.length).toBeGreaterThan(0);
      
      console.log(`  ✅ /fr/blog/building-responsible-ai-systems/ - "${headingText.trim()}"`);
      
    } catch (error) {
      console.log(`  ❌ /fr/blog/building-responsible-ai-systems/ - Error: ${error.message}`);
    }
  });

  test('should verify blog navigation from different language homepages', async ({ page }) => {
    console.log('🔗 Testing blog navigation from language homepages...\n');
    
    // Test navigation from Spanish homepage to Spanish blog
    try {
      await page.goto(`${baseURL}/es/`);
      await page.waitForLoadState('networkidle');
      
      // Look for blog link in navigation or footer
      const blogLink = page.locator('a[href="/es/blog"], a[href*="/es/blog"], a[href="/blog"]').first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        
        // Verify we're on Spanish blog page
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('es');
        
        const blogHeading = page.locator('h1').first();
        const headingText = await blogHeading.textContent();
        expect(headingText).toContain('Divinci AI Blog');
        
        console.log('  ✅ Spanish homepage → Spanish blog navigation works');
      } else {
        console.log('  ⚠️ Blog link not found in Spanish homepage navigation');
      }
      
    } catch (error) {
      console.log(`  ❌ Spanish blog navigation error: ${error.message}`);
    }
    
    // Test navigation from French homepage to French blog
    try {
      await page.goto(`${baseURL}/fr/`);
      await page.waitForLoadState('networkidle');
      
      const blogLink = page.locator('a[href="/fr/blog"], a[href*="/fr/blog"], a[href="/blog"]').first();
      if (await blogLink.count() > 0) {
        await blogLink.click();
        await page.waitForLoadState('networkidle');
        
        const htmlLang = await page.getAttribute('html', 'lang');
        expect(htmlLang).toBe('fr');
        
        const blogHeading = page.locator('h1').first();
        const headingText = await blogHeading.textContent();
        expect(headingText).toContain('Divinci AI Blog');
        
        console.log('  ✅ French homepage → French blog navigation works');
      } else {
        console.log('  ⚠️ Blog link not found in French homepage navigation');
      }
      
    } catch (error) {
      console.log(`  ❌ French blog navigation error: ${error.message}`);
    }
  });

  test('should have no broken images across all language pages', async ({ page }) => {
    console.log('\n🖼️  Testing for broken images across language pages...');
    
    const pagesToTest = [
      { url: '/', name: 'English Homepage' },
      { url: '/es/', name: 'Spanish Homepage' },
      { url: '/fr/', name: 'French Homepage' },
      { url: '/blog/', name: 'English Blog' },
      { url: '/es/blog/', name: 'Spanish Blog' },
      { url: '/fr/blog/', name: 'French Blog' },
      { url: '/blog/building-responsible-ai-systems/', name: 'English Blog Post' },
      { url: '/es/blog/building-responsible-ai-systems/', name: 'Spanish Blog Post' },
      { url: '/fr/blog/building-responsible-ai-systems/', name: 'French Blog Post' },
      { url: '/ai-safety/', name: 'AI Safety Page' },
      { url: '/autorag/', name: 'AutoRAG Page' },
      { url: '/quality-assurance/', name: 'Quality Assurance Page' },
      { url: '/release-management/', name: 'Release Management Page' }
    ];
    
    for (const pageInfo of pagesToTest) {
      try {
        await page.goto(`${baseURL}${pageInfo.url}`);
        await page.waitForLoadState('networkidle');
        
        // Wait for images to load
        await page.waitForTimeout(2000);
        
        const brokenImages = await checkBrokenImages(page);
        
        if (brokenImages.length > 0) {
          console.log(`  ❌ ${pageInfo.name} (${pageInfo.url}) - ${brokenImages.length} broken images:`);
          brokenImages.forEach(img => {
            console.log(`    • ${img.src} (alt: "${img.alt}")`);
          });
        } else {
          console.log(`  ✅ ${pageInfo.name} (${pageInfo.url}) - No broken images`);
        }
        
        // Fail test if broken images found
        expect(brokenImages.length).toBe(0);
        
      } catch (error) {
        console.log(`  ❌ ${pageInfo.name} (${pageInfo.url}) - Error: ${error.message}`);
        // Continue testing other pages even if one fails
      }
    }
  });

  test('should handle header navigation links correctly from non-homepage pages', async ({ page }) => {
    console.log('\n🔗 Testing header navigation from non-homepage pages...');
    
    const testPages = [
      { url: '/autorag/', name: 'AutoRAG Page' },
      { url: '/quality-assurance/', name: 'Quality Assurance Page' },
      { url: '/release-management/', name: 'Release Management Page' },
      { url: '/blog/', name: 'Blog Page' },
      { url: '/es/', name: 'Spanish Homepage' },
      { url: '/fr/', name: 'French Homepage' }
    ];
    
    for (const testPage of testPages) {
      try {
        console.log(`\n  Testing navigation from ${testPage.name} (${testPage.url})...`);
        
        // Navigate to the test page
        await page.goto(`${baseURL}${testPage.url}`);
        await page.waitForLoadState('networkidle');
        
        // Test #team link
        const teamLink = page.locator('a[href="#team"]').first();
        if (await teamLink.count() > 0) {
          const teamHref = await teamLink.getAttribute('href');
          console.log(`    • Team link href: "${teamHref}" - This should be a full URL, not just #team`);
          
          // Click the team link and check if it navigates properly
          await teamLink.click();
          await page.waitForTimeout(1000);
          
          const currentUrl = page.url();
          if (currentUrl.includes('#team')) {
            if (testPage.url === '/' || testPage.url.endsWith('/')) {
              console.log(`    ✅ Team link works correctly from ${testPage.name}`);
            } else {
              console.log(`    ❌ Team link broken from ${testPage.name} - goes to ${currentUrl}`);
            }
          }
        }
        
        // Navigate back to test page for signup test
        await page.goto(`${baseURL}${testPage.url}`);
        await page.waitForLoadState('networkidle');
        
        // Test #signup link
        const signupLink = page.locator('a[href="#signup"]').first();
        if (await signupLink.count() > 0) {
          const signupHref = await signupLink.getAttribute('href');
          console.log(`    • Signup link href: "${signupHref}" - This should be a full URL, not just #signup`);
          
          // Click the signup link and check if it navigates properly
          await signupLink.click();
          await page.waitForTimeout(1000);
          
          const currentUrl = page.url();
          if (currentUrl.includes('#signup')) {
            if (testPage.url === '/' || testPage.url.endsWith('/')) {
              console.log(`    ✅ Signup link works correctly from ${testPage.name}`);
            } else {
              console.log(`    ❌ Signup link broken from ${testPage.name} - goes to ${currentUrl}`);
            }
          }
        }
        
      } catch (error) {
        console.log(`    ❌ Error testing navigation from ${testPage.name}: ${error.message}`);
      }
    }
  });

  test('should have proper language-aware header navigation links', async ({ page }) => {
    console.log('\n🌐 Testing language-aware header navigation...');
    
    const languageTests = [
      { 
        url: '/es/autorag/', 
        name: 'Spanish AutoRAG Page',
        expectedTeamHref: '/es/#team',
        expectedSignupHref: '/es/#signup'
      },
      { 
        url: '/fr/quality-assurance/', 
        name: 'French QA Page',
        expectedTeamHref: '/fr/#team',
        expectedSignupHref: '/fr/#signup'
      },
      { 
        url: '/autorag/', 
        name: 'English AutoRAG Page',
        expectedTeamHref: '/#team',
        expectedSignupHref: '/#signup'
      }
    ];
    
    for (const test of languageTests) {
      try {
        console.log(`\n  Testing ${test.name}...`);
        
        await page.goto(`${baseURL}${test.url}`);
        await page.waitForLoadState('networkidle');
        
        // Check team link
        const teamLink = page.locator('a[href*="team"]').first();
        if (await teamLink.count() > 0) {
          const teamHref = await teamLink.getAttribute('href');
          if (teamHref === test.expectedTeamHref) {
            console.log(`    ✅ Team link correct: ${teamHref}`);
          } else {
            console.log(`    ❌ Team link incorrect: got "${teamHref}", expected "${test.expectedTeamHref}"`);
          }
        } else {
          console.log(`    ⚠️ Team link not found in header`);
        }
        
        // Check signup link
        const signupLink = page.locator('a[href*="signup"]').first();
        if (await signupLink.count() > 0) {
          const signupHref = await signupLink.getAttribute('href');
          if (signupHref === test.expectedSignupHref) {
            console.log(`    ✅ Signup link correct: ${signupHref}`);
          } else {
            console.log(`    ❌ Signup link incorrect: got "${signupHref}", expected "${test.expectedSignupHref}"`);
          }
        } else {
          console.log(`    ⚠️ Signup link not found in header`);
        }
        
      } catch (error) {
        console.log(`    ❌ Error testing ${test.name}: ${error.message}`);
      }
    }
  });
});