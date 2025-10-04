const { test, expect } = require('@playwright/test');

test.describe('Language-Aware Navigation Tests', () => {
    const languages = [
        { code: 'en', url: '', name: 'English' },
        { code: 'es', url: '/es', name: 'Spanish' },
        { code: 'fr', url: '/fr', name: 'French' },
        { code: 'ar', url: '/ar', name: 'Arabic' }
    ];

    test.beforeEach(async ({ page }) => {
        await page.goto('http://127.0.0.1:1025/');
        await page.waitForLoadState('networkidle');
    });

    test('navigation from press page should maintain language context', async ({ page }) => {
        for (const lang of languages) {
            // Navigate to press page in specific language
            const pressUrl = lang.code === 'en' ? '/press/' : `${lang.url}/press/`;
            await page.goto(`http://127.0.0.1:1025${pressUrl}`);
            
            console.log(`Testing ${lang.name} press page navigation: ${pressUrl}`);
            
            // Check that we're on the correct press page
            expect(page.url()).toContain('/press/');
            if (lang.code !== 'en') {
                expect(page.url()).toContain(`/${lang.code}/`);
            }
            
            // Test navigation to Contact page
            const contactLink = page.locator('nav a[href*="contact"], footer a[href*="contact"]').first();
            if (await contactLink.count() > 0) {
                await contactLink.click();
                await page.waitForLoadState('networkidle');
                
                // Verify we're on the correct language version of contact page
                if (lang.code === 'en') {
                    expect(page.url()).toMatch(/\/contact\/?$/);
                } else {
                    expect(page.url()).toContain(`/${lang.code}/contact`);
                }
                console.log(`✓ ${lang.name}: Contact navigation maintains language context`);
            }
            
            // Navigate back to press page for next test
            await page.goto(`http://127.0.0.1:1025${pressUrl}`);
            
            // Test navigation to Support page
            const supportLink = page.locator('nav a[href*="support"], footer a[href*="support"]').first();
            if (await supportLink.count() > 0) {
                await supportLink.click();
                await page.waitForLoadState('networkidle');
                
                // Verify we're on the correct language version of support page
                if (lang.code === 'en') {
                    expect(page.url()).toMatch(/\/support\/?$/);
                } else {
                    expect(page.url()).toContain(`/${lang.code}/support`);
                }
                console.log(`✓ ${lang.name}: Support navigation maintains language context`);
            }
            
            // Test homepage navigation
            await page.goto(`http://127.0.0.1:1025${pressUrl}`);
            const logoLink = page.locator('header .logo a, .footer-logo a').first();
            if (await logoLink.count() > 0) {
                await logoLink.click();
                await page.waitForLoadState('networkidle');
                
                // Verify we're on the correct language version of homepage
                if (lang.code === 'en') {
                    expect(page.url()).toMatch(/\/(index\.html)?$/);
                } else {
                    expect(page.url()).toContain(`/${lang.code}/`);
                }
                console.log(`✓ ${lang.name}: Homepage navigation maintains language context`);
            }
        }
    });

    test('footer navigation should maintain language context from press page', async ({ page }) => {
        // Test specifically from Spanish press page since that's where the issue was found
        await page.goto('http://127.0.0.1:1025/es/press/');
        
        // Check footer navigation links
        const footerLinks = [
            { selector: 'footer a[href*="contact"]', expectedPath: '/es/contact' },
            { selector: 'footer a[href*="about"]', expectedPath: '/es/about' },
            { selector: 'footer a[href*="careers"]', expectedPath: '/es/careers' },
            { selector: 'footer a[href*="support"]', expectedPath: '/es/support' },
            { selector: 'footer a[href*="privacy"]', expectedPath: '/es/privacy' },
            { selector: 'footer a[href*="terms"]', expectedPath: '/es/terms' }
        ];
        
        for (const link of footerLinks) {
            const linkElement = page.locator(link.selector).first();
            if (await linkElement.count() > 0) {
                const href = await linkElement.getAttribute('href');
                console.log(`Checking footer link: ${link.selector} -> ${href}`);
                
                // Click and verify URL
                await linkElement.click();
                await page.waitForLoadState('networkidle');
                
                expect(page.url()).toContain(link.expectedPath);
                console.log(`✓ Footer link maintains Spanish context: ${page.url()}`);
                
                // Go back to press page for next test
                await page.goto('http://127.0.0.1:1025/es/press/');
            }
        }
    });

    test('header navigation should maintain language context from press page', async ({ page }) => {
        // Test from French press page
        await page.goto('http://127.0.0.1:1025/fr/press/');
        
        // Check header navigation links
        const headerLinks = [
            { selector: 'nav a[href*="support"]', expectedPath: '/fr/support' },
            { selector: 'nav a[href*="blog"]', expectedPath: '/fr/blog' },
            { selector: 'nav a[href*="autorag"]', expectedPath: '/fr/autorag' },
            { selector: 'nav a[href*="quality"]', expectedPath: '/fr/quality' }
        ];
        
        for (const link of headerLinks) {
            const linkElement = page.locator(link.selector).first();
            if (await linkElement.count() > 0) {
                const href = await linkElement.getAttribute('href');
                console.log(`Checking header link: ${link.selector} -> ${href}`);
                
                // Click and verify URL  
                await linkElement.click();
                await page.waitForLoadState('networkidle');
                
                expect(page.url()).toContain('/fr/');
                console.log(`✓ Header link maintains French context: ${page.url()}`);
                
                // Go back to press page for next test
                await page.goto('http://127.0.0.1:1025/fr/press/');
            }
        }
    });

    test('press page internal links should maintain language context', async ({ page }) => {
        // Test internal press page links (like Read more, Download, etc.)
        await page.goto('http://127.0.0.1:1025/es/press/');
        
        // Check if any "Read more" or "Read article" links maintain context
        const internalLinks = page.locator('.news-link, .coverage-link, .asset-download').all();
        const links = await internalLinks;
        
        for (const link of links.slice(0, 3)) { // Test first 3 links
            const href = await link.getAttribute('href');
            if (href && href !== '#') {
                await link.click();
                await page.waitForLoadState('networkidle');
                
                // Should either stay on Spanish site or be external
                const currentUrl = page.url();
                if (currentUrl.includes('127.0.0.1:1025') && !currentUrl.includes('external')) {
                    expect(currentUrl).toContain('/es/');
                }
                console.log(`✓ Internal link context: ${currentUrl}`);
                
                // Go back for next test
                await page.goBack();
                await page.waitForLoadState('networkidle');
            }
        }
    });

    test('breadcrumb and context switching should work correctly', async ({ page }) => {
        // Test that language context is preserved when navigating between pages
        const testFlow = [
            'http://127.0.0.1:1025/es/',           // Spanish homepage
            'http://127.0.0.1:1025/es/press/',     // Spanish press page
            'http://127.0.0.1:1025/es/support/',   // Spanish support page
            'http://127.0.0.1:1025/es/contact/'    // Spanish contact page
        ];
        
        for (let i = 0; i < testFlow.length - 1; i++) {
            await page.goto(testFlow[i]);
            
            // Find a link that should go to the next page in our flow
            const nextPageName = testFlow[i + 1].split('/').pop() || 'home';
            const nextLink = page.locator(`nav a[href*="${nextPageName}"], footer a[href*="${nextPageName}"]`).first();
            
            if (await nextLink.count() > 0) {
                await nextLink.click();
                await page.waitForLoadState('networkidle');
                
                // Verify we're on the expected Spanish page
                expect(page.url()).toContain('/es/');
                console.log(`✓ Navigation flow step ${i + 1}: ${page.url()}`);
            }
        }
    });
});