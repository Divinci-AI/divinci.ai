/**
 * Test to verify that includes have been properly inlined
 * and there are no more CORS errors from include loading
 */

const { test, expect } = require('@playwright/test');
const path = require('path');

// Helper function to get file URL
function getFileUrl(relativePath) {
    const absolutePath = path.resolve(__dirname, '..', relativePath);
    return `file://${absolutePath}`;
}

test.describe('Inlined Includes for Static Sites', () => {
    test('should not have include loading errors on English page', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto(getFileUrl('index.html'));
        await page.waitForLoadState('networkidle');

        // Filter out unrelated errors and focus on include-related errors
        const includeErrors = consoleErrors.filter(error =>
            error.includes('include') ||
            error.includes('meta-tags.html') ||
            error.includes('structured-data.html') ||
            error.includes('footer.html') ||
            error.includes('Component Loading Error')
        );

        expect(includeErrors).toHaveLength(0);
    });

    test('should not have include loading errors on French page', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto(getFileUrl('fr/index.html'));
        await page.waitForLoadState('networkidle');

        // Filter out unrelated errors and focus on include-related errors
        const includeErrors = consoleErrors.filter(error =>
            error.includes('include') ||
            error.includes('meta-tags.html') ||
            error.includes('structured-data.html') ||
            error.includes('footer.html') ||
            error.includes('Component Loading Error')
        );

        expect(includeErrors).toHaveLength(0);
    });

    test('should not have include loading errors on Spanish page', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto(getFileUrl('es/index.html'));
        await page.waitForLoadState('networkidle');

        // Filter out unrelated errors and focus on include-related errors
        const includeErrors = consoleErrors.filter(error =>
            error.includes('include') ||
            error.includes('meta-tags.html') ||
            error.includes('structured-data.html') ||
            error.includes('footer.html') ||
            error.includes('Component Loading Error')
        );

        expect(includeErrors).toHaveLength(0);
    });

    test('should not have include loading errors on Arabic page', async ({ page }) => {
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        await page.goto(getFileUrl('ar/index.html'));
        await page.waitForLoadState('networkidle');

        // Filter out unrelated errors and focus on include-related errors
        const includeErrors = consoleErrors.filter(error =>
            error.includes('include') ||
            error.includes('meta-tags.html') ||
            error.includes('structured-data.html') ||
            error.includes('footer.html') ||
            error.includes('Component Loading Error')
        );

        expect(includeErrors).toHaveLength(0);
    });

    test('should have footer content properly inlined', async ({ page }) => {
        await page.goto(getFileUrl('index.html'));
        await page.waitForLoadState('networkidle');

        // Check that footer content is present (not just the data-include div)
        await expect(page.locator('.site-footer')).toBeVisible();
        await expect(page.locator('.footer-brand')).toBeVisible();
        await expect(page.locator('.footer-links-column').first()).toBeVisible();

        // Check that the footer contains actual content, not just the include placeholder
        const footerText = await page.locator('.site-footer').textContent();
        expect(footerText).toContain('Divinci AI');
        expect(footerText).toContain('Product');
        expect(footerText).toContain('Resources');
    });

    test('should have meta tags properly inlined', async ({ page }) => {
        await page.goto(getFileUrl('index.html'));
        await page.waitForLoadState('networkidle');

        // Check that meta tags are present
        const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
        const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content');
        const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');

        expect(ogTitle).toBeTruthy();
        expect(ogDescription).toBeTruthy();
        expect(canonical).toBeTruthy();
    });

    test('should have structured data properly inlined', async ({ page }) => {
        await page.goto(getFileUrl('index.html'));
        await page.waitForLoadState('networkidle');

        // Check that structured data scripts are present
        const structuredDataScripts = await page.locator('script[type="application/ld+json"]').count();
        expect(structuredDataScripts).toBeGreaterThan(0);

        // Check that the structured data contains expected content
        const firstScript = await page.locator('script[type="application/ld+json"]').first().textContent();
        expect(firstScript).toContain('Divinci AI');
        expect(firstScript).toContain('schema.org');
    });
});
