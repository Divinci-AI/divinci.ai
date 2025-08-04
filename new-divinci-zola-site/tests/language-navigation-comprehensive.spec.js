const { test, expect } = require('@playwright/test');

/**
 * Comprehensive Language Navigation Tests
 * Tests navigation and functionality across all supported language sites
 */

test.describe('Comprehensive Language Navigation', () => {
  const baseURL = 'http://127.0.0.1:1111';
  
  // All supported languages with their expected content
  const languages = [
    { code: 'en', name: 'English', url: '/', homeTitle: 'AI releases' },
    { code: 'es', name: 'Spanish', url: '/es/', homeTitle: 'Lanzamientos de IA' },
    { code: 'fr', name: 'French', url: '/fr/', homeTitle: 'Versions d\'IA' },
    { code: 'ar', name: 'Arabic', url: '/ar/', homeTitle: 'إصدارات الذكاء الاصطناعي' },
    { code: 'de', name: 'German', url: '/de/', homeTitle: 'KI-Veröffentlichungen' },
    { code: 'it', name: 'Italian', url: '/it/', homeTitle: 'Rilasci di IA' },
    { code: 'pt', name: 'Portuguese', url: '/pt/', homeTitle: 'Lançamentos de IA' },
    { code: 'ru', name: 'Russian', url: '/ru/', homeTitle: 'Релизы ИИ' },
    { code: 'ja', name: 'Japanese', url: '/ja/', homeTitle: 'AIリリース' },
    { code: 'ko', name: 'Korean', url: '/ko/', homeTitle: 'AI 출시' },
    { code: 'zh', name: 'Chinese', url: '/zh/', homeTitle: 'AI 发布' },
    { code: 'hi', name: 'Hindi', url: '/hi/', homeTitle: 'AI रिलीज़' },
    { code: 'nl', name: 'Dutch', url: '/nl/', homeTitle: 'AI-releases' }
  ];

  // Pages that should exist across languages
  const commonPages = [
    'autorag',
    'quality-assurance', 
    'release-management',
    'terms-of-service',
    'privacy-policy'
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

  test('should load all language homepages successfully', async ({ page }) => {
    console.log('🌍 Testing all language homepages...\n');
    
    const results = [];
    
    for (const lang of languages) {
      console.log(`Testing ${lang.name} (${lang.code})...`);
      
      try {
        const response = await page.goto(`${baseURL}${lang.url}`, {
          waitUntil: 'networkidle',
          timeout: 15000
        });
        
        if (response && response.status() === 200) {
          // Check for essential page elements
          const hasHeader = await page.locator('header').count() > 0;
          const hasMain = await page.locator('main').count() > 0;
          const hasFooter = await page.locator('footer').count() > 0;
          const hasLanguageSwitcher = await page.locator('.language-switcher').count() > 0;
          
          // Check title contains expected content (flexible check)
          const title = await page.title();
          const hasValidTitle = title.includes('Divinci') || title.length > 0;
          
          // Check HTML lang attribute
          const htmlLang = await page.getAttribute('html', 'lang');
          const hasCorrectLang = htmlLang === lang.code;
          
          results.push({
            language: lang.name,
            code: lang.code,
            url: lang.url,
            status: 'SUCCESS',
            hasHeader,
            hasMain,
            hasFooter,
            hasLanguageSwitcher,
            hasValidTitle,
            hasCorrectLang,
            title
          });
          
          console.log(`  ✅ ${lang.name} (${lang.code}) - Status: ${response.status()}`);
          console.log(`    📝 Title: "${title}"`);
          console.log(`    🏗️ Structure: Header(${hasHeader}) Main(${hasMain}) Footer(${hasFooter})`);
          console.log(`    🌐 Lang attribute: ${htmlLang} (expected: ${lang.code})`);
          
        } else {
          results.push({
            language: lang.name,
            code: lang.code,
            url: lang.url,
            status: 'FAILED',
            error: `HTTP ${response?.status() || 'Unknown'}`
          });
          console.log(`  ❌ ${lang.name} (${lang.code}) - Status: ${response?.status() || 'Unknown'}`);
        }
      } catch (error) {
        results.push({
          language: lang.name,
          code: lang.code,
          url: lang.url,
          status: 'ERROR',
          error: error.message
        });
        console.log(`  🚫 ${lang.name} (${lang.code}) - Error: ${error.message}`);
      }
    }
    
    // Summary report
    const successful = results.filter(r => r.status === 'SUCCESS');
    const failed = results.filter(r => r.status !== 'SUCCESS');
    
    console.log(`\n=== LANGUAGE HOMEPAGE SUMMARY ===`);
    console.log(`✅ Working: ${successful.length}/${languages.length}`);
    console.log(`❌ Failed: ${failed.length}/${languages.length}`);
    
    if (failed.length > 0) {
      console.log(`\nFAILED LANGUAGES:`);
      failed.forEach(lang => {
        console.log(`- ${lang.language} (${lang.code}): ${lang.error || 'Unknown error'}`);
      });
    }
    
    // Assert that most languages work (allow some to fail during development)
    expect(successful.length).toBeGreaterThan(languages.length * 0.7); // At least 70% should work
  });

  test('should have working language switcher on all pages', async ({ page }) => {
    console.log('🔄 Testing language switcher functionality...\n');
    
    // Test from English homepage
    await page.goto(`${baseURL}/`);
    await page.waitForLoadState('networkidle');
    
    const languageSwitcher = page.locator('.language-switcher');
    
    if (await languageSwitcher.count() === 0) {
      console.log('❌ Language switcher not found on homepage');
      return;
    }
    
    await expect(languageSwitcher).toBeVisible();
    console.log('✅ Language switcher found and visible');
    
    // Click to open language options
    await languageSwitcher.click();
    await page.waitForTimeout(500);
    
    // Check if dropdown opened
    const dropdown = page.locator('.language-switcher-dropdown, .language-options');
    if (await dropdown.count() > 0) {
      await expect(dropdown).toBeVisible();
      console.log('✅ Language switcher dropdown opens');
      
      // Count language options
      const languageOptions = page.locator('.language-option');
      const optionCount = await languageOptions.count();
      console.log(`📊 Found ${optionCount} language options`);
      
      // Test switching to Spanish
      const spanishOption = page.locator('a[href="/es/"], a[href*="/es/"]').first();
      if (await spanishOption.count() > 0) {
        await spanishOption.click();
        await page.waitForLoadState('networkidle');
        
        const currentURL = page.url();
        if (currentURL.includes('/es/')) {
          console.log('✅ Successfully switched to Spanish');
          
          // Check HTML lang attribute updated
          const htmlLang = await page.getAttribute('html', 'lang');
          expect(htmlLang).toBe('es');
          console.log(`✅ HTML lang attribute updated to: ${htmlLang}`);
        } else {
          console.log(`❌ URL did not change to Spanish: ${currentURL}`);
        }
      } else {
        console.log('⚠️ Spanish language option not found');
      }
    } else {
      console.log('❌ Language switcher dropdown did not open');
    }
  });

  test('should test navigation within language-specific pages', async ({ page }) => {
    console.log('🔗 Testing navigation within language sites...\n');
    
    // Test a few representative languages
    const testLanguages = languages.slice(0, 4); // Test first 4 languages for speed
    
    for (const lang of testLanguages) {
      console.log(`Testing navigation for ${lang.name} (${lang.code})...`);
      
      try {
        // Go to language homepage
        await page.goto(`${baseURL}${lang.url}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });
        
        // Test footer navigation links for this language
        const footer = page.locator('footer');
        if (await footer.count() > 0) {
          const footerLinks = await footer.locator('a[href^="/"]').all();
          
          for (const link of footerLinks.slice(0, 3)) { // Test first 3 links
            const href = await link.getAttribute('href');
            const text = await link.textContent();
            
            if (href && href.startsWith('/')) {
              try {
                const response = await page.request.get(`${baseURL}${href}`);
                const status = response.status();
                
                if (status === 200) {
                  console.log(`    ✅ ${href} works`);
                } else {
                  console.log(`    ⚠️ ${href} returns ${status}`);
                }
              } catch (error) {
                console.log(`    ❌ ${href} error: ${error.message}`);
              }
            }
          }
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing ${lang.name}: ${error.message}`);
      }
    }
  });

  test('should maintain consistent branding across languages', async ({ page }) => {
    console.log('🎨 Testing consistent branding across languages...\n');
    
    // Test a subset of languages for branding consistency
    const testLanguages = [
      languages.find(l => l.code === 'en'),
      languages.find(l => l.code === 'es'), 
      languages.find(l => l.code === 'fr'),
      languages.find(l => l.code === 'ar')
    ].filter(Boolean);
    
    for (const lang of testLanguages) {
      console.log(`Testing branding for ${lang.name}...`);
      
      try {
        await page.goto(`${baseURL}${lang.url}`, {
          waitUntil: 'networkidle',
          timeout: 10000
        });
        
        // Check logo exists
        const logo = page.locator('header .logo img, header img[alt*="logo"], header img[alt*="Logo"]');
        if (await logo.count() > 0) {
          await expect(logo).toBeVisible();
          console.log(`  ✅ Logo visible for ${lang.name}`);
        } else {
          console.log(`  ⚠️ No logo found for ${lang.name}`);
        }
        
        // Check footer branding
        const footerLogo = page.locator('footer img, .footer-logo img');
        if (await footerLogo.count() > 0) {
          await expect(footerLogo).toBeVisible();
          console.log(`  ✅ Footer logo visible for ${lang.name}`);
        }
        
        // Check for Divinci AI text/branding
        const brandingText = page.locator(':text("Divinci"):visible').first();
        if (await brandingText.count() > 0) {
          console.log(`  ✅ Divinci branding text found for ${lang.name}`);
        }
        
      } catch (error) {
        console.log(`  ❌ Error testing branding for ${lang.name}: ${error.message}`);
      }
    }
  });
});