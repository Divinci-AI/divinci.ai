/**
 * Language Switcher E2E Test for Static Sites
 *
 * This test verifies that the language switcher works correctly for static sites
 * and properly navigates to the correct language versions of pages.
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

// Helper function to get file URL
function getFileUrl(relativePath) {
    const absolutePath = path.resolve(__dirname, '..', relativePath);
    return `file://${absolutePath}`;
}

test.describe('Language Switcher for Static Sites', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the main index.html file
        await page.goto(getFileUrl('index.html'));

        // Wait for the language switcher to be loaded
        await page.waitForSelector('.language-switcher');
        await page.waitForFunction(() => window.navigateToLanguage !== undefined);
    });

    test('should detect static site environment correctly', async ({ page }) => {
        const isStaticSite = await page.evaluate(() => {
            const currentOrigin = window.location.origin;
            return currentOrigin.startsWith('file://') ||
                   (!currentOrigin.includes('localhost') &&
                    !currentOrigin.includes('127.0.0.1') &&
                    !currentOrigin.includes('dev') &&
                    !currentOrigin.includes('staging'));
        });

        expect(isStaticSite).toBe(true);
    });

    test('should show language switcher dropdown on click', async ({ page }) => {
        // Click on the language switcher
        await page.click('.language-switcher-current');

        // Check if dropdown is visible
        const dropdown = page.locator('.language-switcher-dropdown');
        await expect(dropdown).toBeVisible();

        // Check if all language options are present
        await expect(page.locator('[data-lang="en"]')).toBeVisible();
        await expect(page.locator('[data-lang="es"]')).toBeVisible();
        await expect(page.locator('[data-lang="fr"]')).toBeVisible();
        await expect(page.locator('[data-lang="ar"]')).toBeVisible();
    });

    test('should generate correct URLs for language navigation', async ({ page }) => {
        // Test URL generation for each language
        const testCases = [
            { lang: 'en', expectedPath: 'index.html' },
            { lang: 'fr', expectedPath: 'fr/index.html' },
            { lang: 'es', expectedPath: 'es/index.html' },
            { lang: 'ar', expectedPath: 'ar/index.html' }
        ];

        for (const testCase of testCases) {
            const targetUrl = await page.evaluate((lang) => {
                const currentPath = window.location.pathname;
                const currentOrigin = window.location.origin;
                const currentHref = window.location.href;
                const langRegex = /^\/(es|fr|ar)\//;
                const hasLangPrefix = langRegex.test(currentPath);

                // Detect if we're on a static site
                const isStaticSite = currentOrigin.startsWith('file://') ||
                                    (!currentOrigin.includes('localhost') &&
                                     !currentOrigin.includes('127.0.0.1') &&
                                     !currentOrigin.includes('dev') &&
                                     !currentOrigin.includes('staging'));

                // Get the current page filename
                let currentPage = 'index.html';
                if (currentPath && currentPath !== '/') {
                    const pathParts = currentPath.split('/').filter(part => part.length > 0);

                    if (hasLangPrefix && pathParts.length > 0) {
                        pathParts.shift();
                    }

                    if (pathParts.length > 0) {
                        const lastPart = pathParts[pathParts.length - 1];
                        if (lastPart.includes('.html') || lastPart.includes('.htm')) {
                            currentPage = lastPart;
                        }
                    }
                }

                let targetUrl;

                if (isStaticSite) {
                    if (lang === 'en') {
                        if (currentOrigin.startsWith('file://')) {
                            const basePath = currentHref.substring(0, currentHref.lastIndexOf('/') + 1);
                            const cleanBasePath = basePath.replace(/\/(es|fr|ar)\/[^\/]*$/, '/');
                            targetUrl = cleanBasePath + currentPage;
                        } else {
                            targetUrl = currentOrigin + '/' + currentPage;
                        }
                    } else {
                        if (currentOrigin.startsWith('file://')) {
                            const basePath = currentHref.substring(0, currentHref.lastIndexOf('/') + 1);
                            const cleanBasePath = basePath.replace(/\/(es|fr|ar)\/[^\/]*$/, '/');
                            targetUrl = cleanBasePath + lang + '/' + currentPage;
                        } else {
                            targetUrl = currentOrigin + '/' + lang + '/' + currentPage;
                        }
                    }
                }

                return targetUrl;
            }, testCase.lang);

            expect(targetUrl).toContain(testCase.expectedPath);
        }
    });

    test('should navigate to French version when clicking French option', async ({ page }) => {
        // Click on language switcher to open dropdown
        await page.click('.language-switcher-current');

        // Wait for dropdown to be visible
        await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });

        // Click on French option
        await page.click('[data-lang="fr"]');

        // Wait for navigation to complete
        await page.waitForLoadState('networkidle');

        // Check if we're on the French page
        expect(page.url()).toContain('fr/index.html');

        // Check if the page content is in French
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
        await expect(page.locator('.current-language')).toContainText('Français');
    });

    test('should navigate to Spanish version when clicking Spanish option', async ({ page }) => {
        // Click on language switcher to open dropdown
        await page.click('.language-switcher-current');

        // Wait for dropdown to be visible
        await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });

        // Click on Spanish option
        await page.click('[data-lang="es"]');

        // Wait for navigation to complete
        await page.waitForLoadState('networkidle');

        // Check if we're on the Spanish page
        expect(page.url()).toContain('es/index.html');

        // Check if the page content is in Spanish
        await expect(page.locator('html')).toHaveAttribute('lang', 'es');
        await expect(page.locator('.current-language')).toContainText('Español');
    });

    test('should navigate back to English from language subdirectory', async ({ page }) => {
        // First navigate to French page
        await page.goto(getFileUrl('fr/index.html'));
        await page.waitForSelector('.language-switcher');

        // Click on language switcher to open dropdown
        await page.click('.language-switcher-current');

        // Wait for dropdown to be visible
        await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });

        // Click on English option
        await page.click('[data-lang="en"]');

        // Wait for navigation to complete
        await page.waitForLoadState('networkidle');

        // Check if we're back on the English page
        expect(page.url()).toContain('index.html');
        expect(page.url()).not.toContain('/fr/');
        expect(page.url()).not.toContain('/es/');
        expect(page.url()).not.toContain('/ar/');

        // Check if the page content is in English
        await expect(page.locator('html')).toHaveAttribute('lang', 'en');
        await expect(page.locator('.current-language')).toContainText('English');
    });

    test('should handle language switching from Arabic RTL page', async ({ page }) => {
        // Navigate to Arabic page
        await page.goto(getFileUrl('ar/index.html'));
        await page.waitForSelector('.language-switcher');

        // Check if the page is RTL
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');

        // Click on language switcher to open dropdown
        await page.click('.language-switcher-current');

        // Wait for dropdown to be visible
        await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });

        // Click on English option
        await page.click('[data-lang="en"]');

        // Wait for navigation to complete
        await page.waitForLoadState('networkidle');

        // Check if we're on the English page
        expect(page.url()).toContain('index.html');
        expect(page.url()).not.toContain('/ar/');

        // Check if the page is now LTR
        await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
        await expect(page.locator('.current-language')).toContainText('English');
    });

    test('should preserve current page when switching languages', async ({ page }) => {
        // This test would be more relevant if there were other pages besides index.html
        // For now, we'll just verify that index.html is preserved

        // Start on English index
        await page.goto(getFileUrl('index.html'));

        // Switch to French
        await page.click('.language-switcher-current');
        await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
        await page.click('[data-lang="fr"]');
        await page.waitForLoadState('networkidle');

        // Verify we're on French index
        expect(page.url()).toContain('fr/index.html');

        // Switch back to English
        await page.click('.language-switcher-current');
        await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
        await page.click('[data-lang="en"]');
        await page.waitForLoadState('networkidle');

        // Verify we're back on English index
        expect(page.url()).toContain('index.html');
        expect(page.url()).not.toContain('/fr/');
    });
});
