const { test, expect } = require('@playwright/test');

test.describe('Press Page Language Switcher', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to the press page
        await page.goto('http://127.0.0.1:1025/press/');
        await page.waitForLoadState('networkidle');
    });

    test('language switcher should be visible on desktop', async ({ page }) => {
        // Check if language switcher is visible
        const languageSwitcher = page.locator('.language-switcher');
        await expect(languageSwitcher).toBeVisible();
        
        // Check if current language is displayed
        const currentLanguage = page.locator('.current-language');
        await expect(currentLanguage).toBeVisible();
        await expect(currentLanguage).toContainText('English');
    });

    test('language switcher dropdown should work on desktop', async ({ page }) => {
        // Click on language switcher
        const toggleButton = page.locator('.language-switcher-current');
        await toggleButton.click();
        
        // Check if dropdown is visible
        const dropdown = page.locator('.language-switcher-dropdown');
        await expect(dropdown).toBeVisible();
        
        // Check if language options are visible
        const spanishOption = page.locator('.language-option[data-lang="es"]');
        await expect(spanishOption).toBeVisible();
        
        // Click outside to close
        await page.locator('body').click({ position: { x: 10, y: 10 } });
        await expect(dropdown).not.toBeVisible();
    });

    test('language switcher should be visible on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Check if language switcher is visible
        const languageSwitcher = page.locator('.language-switcher');
        await expect(languageSwitcher).toBeVisible();
        
        // On mobile, current language text should be hidden
        const currentLanguage = page.locator('.current-language');
        const isHidden = await currentLanguage.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display === 'none';
        });
        expect(isHidden).toBe(true);
        
        // Icon should still be visible
        const icon = page.locator('.language-icon');
        await expect(icon).toBeVisible();
    });

    test('language switcher dropdown should work on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Click on language switcher
        const toggleButton = page.locator('.language-switcher-current');
        await toggleButton.click();
        
        // Wait for dropdown to appear
        const dropdown = page.locator('.language-switcher-dropdown, .language-switcher-dropdown-portal');
        await expect(dropdown).toBeVisible({ timeout: 5000 });
        
        // Check if language options are visible
        const languageOptions = page.locator('.language-option');
        const count = await languageOptions.count();
        expect(count).toBeGreaterThan(0);
        
        // Check specific languages
        const spanishOption = page.locator('.language-option[data-lang="es"]');
        await expect(spanishOption).toBeVisible();
        
        const frenchOption = page.locator('.language-option[data-lang="fr"]');
        await expect(frenchOption).toBeVisible();
    });

    test('language switcher should be positioned correctly on mobile', async ({ page }) => {
        // Set mobile viewport
        await page.setViewportSize({ width: 375, height: 667 });
        
        // Get positions of logo and language switcher
        const logo = page.locator('header .logo');
        const languageSwitcher = page.locator('.language-switcher');
        
        const logoBox = await logo.boundingBox();
        const switcherBox = await languageSwitcher.boundingBox();
        
        // Check they're on the same horizontal line (similar y position)
        expect(Math.abs(logoBox.y - switcherBox.y)).toBeLessThan(20);
        
        // Check language switcher is to the right of logo
        expect(switcherBox.x).toBeGreaterThan(logoBox.x + logoBox.width);
    });

    test('clicking language option should navigate to correct language', async ({ page }) => {
        // Click on language switcher
        const toggleButton = page.locator('.language-switcher-current');
        await toggleButton.click();
        
        // Click on Spanish option
        const spanishOption = page.locator('.language-option[data-lang="es"]');
        await spanishOption.click();
        
        // Wait for navigation
        await page.waitForURL('**/es/**', { timeout: 5000 });
        
        // Verify we're on Spanish version
        const url = page.url();
        expect(url).toContain('/es/');
    });

    test('language switcher should handle rapid clicks gracefully', async ({ page }) => {
        const toggleButton = page.locator('.language-switcher-current');
        const dropdown = page.locator('.language-switcher-dropdown, .language-switcher-dropdown-portal');
        
        // Rapid clicks
        await toggleButton.click();
        await toggleButton.click();
        await toggleButton.click();
        
        // After odd number of clicks, dropdown should be visible
        await expect(dropdown).toBeVisible();
        
        // One more click to close
        await toggleButton.click();
        await expect(dropdown).not.toBeVisible();
    });
});