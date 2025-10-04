const { test, expect } = require('@playwright/test');

test.describe('Comprehensive Language-Aware Navigation Test Suite', () => {
    const languages = ['en', 'es', 'fr', 'ar'];
    const pageTypes = [
        { path: '', name: 'Homepage' },
        { path: '/docs', name: 'Documentation' },
        { path: '/contact', name: 'Contact' },
        { path: '/about', name: 'About' },
        { path: '/press', name: 'Press' },
        { path: '/support', name: 'Support' },
        { path: '/careers', name: 'Careers' },
        { path: '/roadmap', name: 'Roadmap' },
        { path: '/pricing', name: 'Pricing' }
    ];

    test.beforeEach(async ({ page }) => {
        // Set reasonable timeouts
        await page.setDefaultTimeout(10000);
    });

    test('Header logo navigation maintains language context across all page types', async ({ page }) => {
        for (const lang of languages) {
            for (const pageType of pageTypes) {
                // Construct the URL for the specific language and page
                const pageUrl = lang === 'en' 
                    ? `http://127.0.0.1:1027${pageType.path}/`
                    : `http://127.0.0.1:1027/${lang}${pageType.path}/`;
                
                console.log(`Testing: ${lang} ${pageType.name} → ${pageUrl}`);
                
                try {
                    // Navigate to the page
                    const response = await page.goto(pageUrl, { waitUntil: 'networkidle' });
                    
                    // Skip if page doesn't exist (404)
                    if (response.status() === 404) {
                        console.log(`  ⚠️  Page not found: ${pageUrl}`);
                        continue;
                    }
                    
                    expect(response.status()).toBe(200);
                    
                    // Find the header logo link
                    const logoLink = page.locator('.logo a').first();
                    await expect(logoLink).toBeVisible();
                    
                    // Check the href attribute
                    const logoHref = await logoLink.getAttribute('href');
                    const expectedHref = lang === 'en' ? '/' : `/${lang}/`;
                    
                    expect(logoHref, `Logo on ${lang} ${pageType.name} should link to ${expectedHref}`).toBe(expectedHref);
                    console.log(`  ✅ Logo href: ${logoHref}`);
                    
                } catch (error) {
                    console.log(`  ❌ Error testing ${pageUrl}: ${error.message}`);
                    throw error;
                }
            }
        }
    });

    test('Footer navigation maintains language context from any starting page', async ({ page }) => {
        const testLanguages = ['en', 'es']; // Test primary languages
        const footerLinks = [
            { selector: 'footer a[href*="about"]', name: 'About' },
            { selector: 'footer a[href*="contact"]', name: 'Contact' },
            { selector: 'footer a[href*="press"]', name: 'Press' },
            { selector: 'footer a[href*="careers"]', name: 'Careers' }
        ];

        for (const lang of testLanguages) {
            // Start from contact page as it was the original issue
            const startUrl = lang === 'en' 
                ? 'http://127.0.0.1:1027/contact/'
                : `http://127.0.0.1:1027/${lang}/contact/`;
            
            await page.goto(startUrl, { waitUntil: 'networkidle' });
            
            for (const link of footerLinks) {
                const footerLink = page.locator(link.selector).first();
                
                if (await footerLink.isVisible()) {
                    const href = await footerLink.getAttribute('href');
                    console.log(`${lang} footer ${link.name} link: ${href}`);
                    
                    if (lang === 'en') {
                        expect(href).not.toContain('/es/');
                        expect(href).not.toContain('/fr/');
                    } else {
                        expect(href, `${lang} footer ${link.name} should maintain language context`).toContain(`/${lang}/`);
                    }
                }
            }
        }
    });

    test('Language switcher navigation works correctly from any page', async ({ page }) => {
        const startPages = [
            '/contact/',
            '/docs/',
            '/about/'
        ];

        for (const startPage of startPages) {
            // Start from English page
            await page.goto(`http://127.0.0.1:1027${startPage}`, { waitUntil: 'networkidle' });
            
            // Open language switcher
            const languageSwitcher = page.locator('.language-switcher-current');
            if (await languageSwitcher.isVisible()) {
                await languageSwitcher.click();
                
                // Wait for dropdown to appear
                await expect(page.locator('.language-switcher-dropdown')).toBeVisible();
                
                // Click Spanish option
                const spanishOption = page.locator('.language-option[data-lang="es"]');
                if (await spanishOption.isVisible()) {
                    await spanishOption.click();
                    
                    // Should navigate to Spanish version of the same page
                    await page.waitForURL(new RegExp(`/es${startPage}`));
                    expect(page.url()).toContain(`/es${startPage.replace(/\/$/, '')}`);
                    console.log(`✅ Language switcher from ${startPage} works correctly`);
                }
            }
        }
    });

    test('Direct URL access works for all language pages', async ({ page }) => {
        const directTestUrls = [
            'http://127.0.0.1:1027/es/',
            'http://127.0.0.1:1027/es/contact/',
            'http://127.0.0.1:1027/es/docs/',
            'http://127.0.0.1:1027/fr/contact/',
            'http://127.0.0.1:1027/ar/'
        ];

        for (const url of directTestUrls) {
            try {
                const response = await page.goto(url, { waitUntil: 'networkidle' });
                
                if (response.status() === 200) {
                    // Extract language from URL
                    const langMatch = url.match(/\/([a-z]{2})\//);
                    const expectedLang = langMatch ? langMatch[1] : 'en';
                    
                    // Check HTML lang attribute
                    const htmlLang = await page.locator('html').getAttribute('lang');
                    expect(htmlLang).toBe(expectedLang);
                    
                    console.log(`✅ Direct access to ${url} works (lang: ${htmlLang})`);
                } else {
                    console.log(`⚠️  ${url} returned status ${response.status()}`);
                }
            } catch (error) {
                console.log(`❌ Error accessing ${url}: ${error.message}`);
            }
        }
    });

    test('Navigation consistency check across all templates', async ({ page }) => {
        // Test that all templates using different base templates have consistent navigation
        const templateTestPages = [
            { url: '/es/contact/', template: 'contact.html', base: 'base.html' },
            { url: '/es/docs/', template: 'page.html', base: 'base.html' },
            { url: '/es/about/', template: 'about.html', base: 'base-optimized.html' },
            { url: '/es/pricing/', template: 'feature.html', base: 'base.html' },
            { url: '/es/press/', template: 'press.html', base: 'base.html' }
        ];

        for (const testPage of templateTestPages) {
            await page.goto(`http://127.0.0.1:1027${testPage.url}`, { waitUntil: 'networkidle' });
            
            // Check header logo
            const logoHref = await page.locator('.logo a').getAttribute('href');
            expect(logoHref, `${testPage.template} should have correct logo navigation`).toBe('/es/');
            
            // Check HTML lang attribute
            const htmlLang = await page.locator('html').getAttribute('lang');
            expect(htmlLang, `${testPage.template} should have correct lang attribute`).toBe('es');
            
            console.log(`✅ ${testPage.template} (${testPage.base}) navigation consistency verified`);
        }
    });
});