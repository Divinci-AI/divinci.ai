const { test, expect } = require('@playwright/test');

test.describe('Press Page Language Navigation', () => {
    const languages = [
        { code: 'en', name: 'English', url: '/press/' },
        { code: 'es', name: 'Spanish', url: '/es/press/' },
        { code: 'fr', name: 'French', url: '/fr/press/' },
        { code: 'ar', name: 'Arabic', url: '/ar/press/' },
        { code: 'ja', name: 'Japanese', url: '/ja/press/' },
        { code: 'zh', name: 'Chinese', url: '/zh/press/' },
        { code: 'de', name: 'German', url: '/de/press/' },
        { code: 'it', name: 'Italian', url: '/it/press/' },
        { code: 'pt', name: 'Portuguese', url: '/pt/press/' }
    ];

    test.beforeEach(async ({ page }) => {
        // Start from English press page
        await page.goto('http://127.0.0.1:1025/press/');
        await page.waitForLoadState('networkidle');
    });

    test('all language versions of press page should exist', async ({ page }) => {
        for (const lang of languages) {
            const response = await page.goto(`http://127.0.0.1:1025${lang.url}`);
            expect(response.status()).toBe(200);
            
            // Verify we're on the press page
            const title = await page.title();
            expect(title).toContain('Press');
        }
    });

    test('language switcher should navigate to correct language press page', async ({ page }) => {
        // Click on language switcher
        const toggleButton = page.locator('.language-switcher-current');
        await toggleButton.click();
        
        // Wait for dropdown to appear
        const dropdown = page.locator('.language-switcher-dropdown');
        await expect(dropdown).toBeVisible();
        
        // Click on Spanish option
        const spanishOption = page.locator('.language-option[data-lang="es"]');
        await spanishOption.click();
        
        // Wait for navigation
        await page.waitForURL('**/es/press/**');
        
        // Verify we're on Spanish press page
        const url = page.url();
        expect(url).toContain('/es/press/');
        
        // Verify page loaded correctly
        await expect(page.locator('.press-hero')).toBeVisible();
    });

    test('language context should be maintained when switching languages', async ({ page }) => {
        // Navigate to Spanish press page
        await page.goto('http://127.0.0.1:1025/es/press/');
        
        // Open language switcher
        const toggleButton = page.locator('.language-switcher-current');
        await toggleButton.click();
        
        // Switch to French
        const frenchOption = page.locator('.language-option[data-lang="fr"]');
        await frenchOption.click();
        
        // Should navigate to French press page (not homepage)
        await page.waitForURL('**/fr/press/**');
        expect(page.url()).toContain('/fr/press/');
    });

    test('press page should maintain consistent structure across languages', async ({ page }) => {
        for (const lang of languages.slice(0, 3)) { // Test first 3 languages
            await page.goto(`http://127.0.0.1:1025${lang.url}`);
            
            // Check main sections exist
            await expect(page.locator('.press-hero')).toBeVisible();
            await expect(page.locator('.press-section').first()).toBeVisible();
            
            // Check header exists
            await expect(page.locator('header')).toBeVisible();
            
            // Check footer exists
            await expect(page.locator('footer')).toBeVisible();
            
            // Check language switcher exists
            await expect(page.locator('.language-switcher')).toBeVisible();
        }
    });

    test('RTL layout should work for Arabic press page', async ({ page }) => {
        await page.goto('http://127.0.0.1:1025/ar/press/');
        
        // Check if HTML has RTL direction
        const htmlDir = await page.locator('html').getAttribute('dir');
        expect(htmlDir).toBe('rtl');
        
        // Verify page renders correctly
        await expect(page.locator('.press-hero')).toBeVisible();
    });
});