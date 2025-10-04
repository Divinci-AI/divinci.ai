/**
 * Critical Navigation Tests for Pre-Push Hook
 * Focuses on the key navigation fixes we implemented
 */

const { test, expect } = require('@playwright/test');

test.describe('Critical Language Navigation', () => {
    const baseUrl = 'http://127.0.0.1:1027';

    test('Header logo navigation maintains language context', async ({ page }) => {
        // Test Spanish documentation page - the original reported issue
        await page.goto(`${baseUrl}/es/docs/`);
        await page.waitForLoadState('networkidle');
        
        // Find the header logo link
        const logoLink = page.locator('.logo a').first();
        await expect(logoLink).toBeVisible();
        
        // Check the href attribute - should be /es/ not /
        const logoHref = await logoLink.getAttribute('href');
        expect(logoHref, 'Logo from Spanish docs should link to Spanish homepage').toBe('/es/');
    });

    test('Footer navigation maintains language context', async ({ page }) => {
        // Test Spanish contact page navigation
        await page.goto(`${baseUrl}/es/contact/`);
        await page.waitForLoadState('networkidle');
        
        // Check footer "About" link
        const aboutLink = page.locator('footer a[href*="about"]').first();
        if (await aboutLink.isVisible()) {
            const aboutHref = await aboutLink.getAttribute('href');
            expect(aboutHref, 'Footer About link should maintain Spanish context').toContain('/es/');
        }
        
        // Check footer "Press" link  
        const pressLink = page.locator('footer a[href*="press"]').first();
        if (await pressLink.isVisible()) {
            const pressHref = await pressLink.getAttribute('href');
            expect(pressHref, 'Footer Press link should maintain Spanish context').toContain('/es/');
        }
    });

    test('All template types have consistent navigation', async ({ page }) => {
        const templateTests = [
            { url: '/es/contact/', name: 'Contact (contact.html)' },
            { url: '/es/docs/', name: 'Documentation (page.html)' },
            { url: '/es/about/', name: 'About (about.html)' },
            { url: '/es/pricing/', name: 'Pricing (feature.html)' },
            { url: '/es/press/', name: 'Press (press.html)' }
        ];

        for (const testCase of templateTests) {
            console.log(`Testing ${testCase.name}...`);
            
            await page.goto(`${baseUrl}${testCase.url}`);
            await page.waitForLoadState('networkidle');
            
            // Check header logo navigation
            const logoLink = page.locator('.logo a').first();
            const logoHref = await logoLink.getAttribute('href');
            expect(logoHref, `${testCase.name} logo should link to /es/`).toBe('/es/');
            
            // Check HTML lang attribute
            const htmlLang = await page.locator('html').getAttribute('lang');
            expect(htmlLang, `${testCase.name} should have Spanish lang attribute`).toBe('es');
        }
    });
});