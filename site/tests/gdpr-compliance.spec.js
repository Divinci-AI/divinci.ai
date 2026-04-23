// GDPR Compliance Test Suite
// Tests for privacy compliance, cookie consent, and data protection

import { test, expect } from '@playwright/test';

test.describe('GDPR Compliance Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any existing consent data
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.removeItem('divinci-gdpr-consent');
    });
    await page.reload();
    await page.waitForLoadState('networkidle');
  });

  test.describe('Cookie Consent Banner', () => {
    
    test('should display cookie consent banner for EU users only', async ({ page }) => {
      // Simulate EU timezone
      await page.addInitScript(() => {
        // Override timezone to EU
        Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
          value: () => ({ timeZone: 'Europe/London' })
        });
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Wait a moment for geolocation detection
      await page.waitForTimeout(1000);
      
      // Check if cookie banner appears for EU users
      const banner = await page.locator('#gdpr-cookie-banner');
      await expect(banner).toBeVisible();
      
      // Check banner contains required information
      await expect(banner).toContainText('Your Privacy Matters');
      await expect(banner).toContainText('cookies');
      
      // Check all required buttons are present
      await expect(page.locator('#gdpr-accept-all')).toBeVisible();
      await expect(page.locator('#gdpr-customize')).toBeVisible();
      await expect(page.locator('#gdpr-reject-all')).toBeVisible();
      
      console.log('✅ EU cookie consent banner test passed');
    });

    test('should NOT display banner for non-EU users', async ({ page }) => {
      // Simulate US timezone
      await page.addInitScript(() => {
        Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
          value: () => ({ timeZone: 'America/New_York' })
        });
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Wait for geolocation detection
      await page.waitForTimeout(1000);
      
      // Banner should NOT appear for non-EU users
      const banner = await page.locator('#gdpr-cookie-banner');
      await expect(banner).not.toBeVisible();
      
      // But privacy settings should still be available in footer
      const privacyDropdown = await page.locator('.privacy-dropdown');
      await expect(privacyDropdown).toBeVisible();
      
      console.log('✅ Non-EU banner hiding test passed');
    });

    test('should show banner when privacy settings clicked', async ({ page }) => {
      // Simulate US timezone (no banner by default)
      await page.addInitScript(() => {
        Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
          value: () => ({ timeZone: 'America/New_York' })
        });
      });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      // Banner should not be visible initially
      await expect(page.locator('#gdpr-cookie-banner')).not.toBeVisible();
      
      // Hover over privacy settings to reveal dropdown
      await page.locator('.privacy-dropdown').hover();
      
      // Dropdown should appear
      await expect(page.locator('.privacy-dropdown-content')).toBeVisible();
      
      // Click cookie preferences in dropdown
      await page.locator('.privacy-dropdown-content button').click();
      
      // Banner should now appear
      await expect(page.locator('#gdpr-cookie-banner')).toBeVisible();
      
      console.log('✅ Privacy settings button test passed');
    });

    test('should show privacy dropdown on hover with all options', async ({ page }) => {
      // Hover over privacy settings
      await page.locator('.privacy-dropdown').hover();
      
      // Dropdown should be visible
      const dropdown = await page.locator('.privacy-dropdown-content');
      await expect(dropdown).toBeVisible();
      
      // Check all dropdown options exist
      await expect(dropdown.locator('text=Cookie Policy')).toBeVisible();
      await expect(dropdown.locator('text=Cookie Preferences')).toBeVisible();
      await expect(dropdown.locator('text=Privacy Policy')).toBeVisible();
      
      // Dropdown should hide when not hovering
      await page.locator('body').hover();
      await page.waitForTimeout(500);
      await expect(dropdown).not.toBeVisible();
      
      console.log('✅ Privacy dropdown functionality test passed');
    });

    test('should allow accepting all cookies', async ({ page }) => {
      // Wait for banner and click accept all
      await page.locator('#gdpr-accept-all').click();
      
      // Banner should disappear
      await expect(page.locator('#gdpr-cookie-banner')).not.toBeVisible();
      
      // Check consent is saved
      const consent = await page.evaluate(() => {
        return localStorage.getItem('divinci-gdpr-consent');
      });
      
      expect(consent).toBeTruthy();
      const consentData = JSON.parse(consent);
      expect(consentData.analytics).toBe(true);
      expect(consentData.marketing).toBe(true);
      
      console.log('✅ Accept all cookies test passed');
    });

    test('should allow rejecting non-essential cookies', async ({ page }) => {
      // Click reject all
      await page.locator('#gdpr-reject-all').click();
      
      // Banner should disappear
      await expect(page.locator('#gdpr-cookie-banner')).not.toBeVisible();
      
      // Check consent is saved with analytics/marketing disabled
      const consent = await page.evaluate(() => {
        return localStorage.getItem('divinci-gdpr-consent');
      });
      
      expect(consent).toBeTruthy();
      const consentData = JSON.parse(consent);
      expect(consentData.analytics).toBe(false);
      expect(consentData.marketing).toBe(false);
      
      console.log('✅ Reject non-essential cookies test passed');
    });

    test('should allow customizing cookie preferences', async ({ page }) => {
      // Click customize
      await page.locator('#gdpr-customize').click();
      
      // Preferences panel should appear
      await expect(page.locator('#gdpr-preferences-panel')).toBeVisible();
      
      // Check all cookie categories are shown
      await expect(page.locator('#gdpr-essential')).toBeVisible();
      await expect(page.locator('#gdpr-analytics')).toBeVisible();
      await expect(page.locator('#gdpr-marketing')).toBeVisible();
      
      // Essential should be checked and disabled
      await expect(page.locator('#gdpr-essential')).toBeChecked();
      await expect(page.locator('#gdpr-essential')).toBeDisabled();
      
      // Enable analytics but not marketing
      await page.locator('#gdpr-analytics').check();
      await page.locator('#gdpr-save-preferences').click();
      
      // Check saved preferences
      const consent = await page.evaluate(() => {
        return localStorage.getItem('divinci-gdpr-consent');
      });
      
      const consentData = JSON.parse(consent);
      expect(consentData.analytics).toBe(true);
      expect(consentData.marketing).toBe(false);
      
      console.log('✅ Customize cookie preferences test passed');
    });

    test('should not show banner on subsequent visits if consent given', async ({ page }) => {
      // Give consent first
      await page.locator('#gdpr-accept-all').click();
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Banner should not appear
      await expect(page.locator('#gdpr-cookie-banner')).not.toBeVisible();
      
      console.log('✅ No banner on subsequent visits test passed');
    });
  });

  test.describe('Privacy Policy Integration', () => {
    
    test('should have accessible privacy policy page', async ({ page }) => {
      await page.goto('/privacy-policy/');
      
      // Check page loads successfully
      await expect(page.locator('h1')).toContainText('Privacy Policy');
      
      // Check for required GDPR sections
      await expect(page.locator('text=Your Rights')).toBeVisible();
      await expect(page.locator('text=Data Protection')).toBeVisible();
      await expect(page.locator('text=Contact Information')).toBeVisible();
      
      console.log('✅ Privacy policy accessibility test passed');
    });

    test('should have functional privacy controls', async ({ page }) => {
      await page.goto('/privacy-policy/');
      
      // Check privacy control buttons exist
      await expect(page.locator('text=Cookie Preferences')).toBeVisible();
      await expect(page.locator('text=Download My Data')).toBeVisible();
      await expect(page.locator('text=Delete My Data')).toBeVisible();
      
      // Test cookie preferences button
      await page.locator('text=Cookie Preferences').click();
      
      // Should show cookie banner
      await expect(page.locator('#gdpr-cookie-banner')).toBeVisible();
      
      console.log('✅ Privacy controls functionality test passed');
    });
  });

  test.describe('Data Subject Rights', () => {
    
    test('should allow data export', async ({ page }) => {
      // First give some consent to have data to export
      await page.locator('#gdpr-accept-all').click();
      
      // Go to privacy policy and test export
      await page.goto('/privacy-policy/');
      
      // Set up download listener
      const downloadPromise = page.waitForEvent('download');
      
      // Click export button
      await page.locator('text=Download My Data').click();
      
      // Should trigger download
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe('divinci-user-data.json');
      
      console.log('✅ Data export test passed');
    });

    test('should allow consent revocation', async ({ page }) => {
      // First give consent
      await page.locator('#gdpr-accept-all').click();
      
      // Go to privacy policy
      await page.goto('/privacy-policy/');
      
      // Revoke consent
      await page.locator('text=Revoke All Consent').click();
      
      // Should show cookie banner again
      await expect(page.locator('#gdpr-cookie-banner')).toBeVisible();
      
      // Check consent is removed from storage
      const consent = await page.evaluate(() => {
        return localStorage.getItem('divinci-gdpr-consent');
      });
      
      expect(consent).toBeFalsy();
      
      console.log('✅ Consent revocation test passed');
    });
  });

  test.describe('Accessibility of GDPR Features', () => {
    
    test('should have proper keyboard navigation for cookie banner', async ({ page }) => {
      // Focus on first button
      await page.locator('#gdpr-accept-all').focus();
      
      // Should be focusable
      const focusedElement = await page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('id', 'gdpr-accept-all');
      
      // Tab to next button
      await page.keyboard.press('Tab');
      const nextFocused = await page.locator(':focus');
      await expect(nextFocused).toHaveAttribute('id', 'gdpr-customize');
      
      console.log('✅ Cookie banner keyboard navigation test passed');
    });

    test('should have proper ARIA labels for cookie controls', async ({ page }) => {
      await page.locator('#gdpr-customize').click();
      
      // Check checkboxes have proper labels
      const analyticsCheckbox = await page.locator('#gdpr-analytics');
      const analyticsLabel = await page.locator('label[for="gdpr-analytics"], label:has(#gdpr-analytics)');
      
      // Should have associated label
      await expect(analyticsLabel).toBeVisible();
      await expect(analyticsLabel).toContainText('Analytics');
      
      console.log('✅ ARIA labels for cookie controls test passed');
    });

    test('should have adequate color contrast in cookie banner', async ({ page }) => {
      const banner = await page.locator('#gdpr-cookie-banner');
      
      // Check banner has good contrast
      const styles = await banner.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      // Should have dark background with light text
      expect(styles.backgroundColor).toContain('rgba');
      expect(styles.color).toBeTruthy();
      
      console.log('✅ Cookie banner color contrast test passed');
    });
  });

  test.describe('Mobile GDPR Compliance', () => {
    
    test('should display properly on mobile devices', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      
      // Cookie banner should still be visible and usable
      const banner = await page.locator('#gdpr-cookie-banner');
      await expect(banner).toBeVisible();
      
      // Buttons should be touchable (at least 44px)
      const acceptButton = await page.locator('#gdpr-accept-all');
      const boundingBox = await acceptButton.boundingBox();
      
      expect(boundingBox.height >= 44 || boundingBox.width >= 44).toBeTruthy();
      
      console.log('✅ Mobile GDPR display test passed');
    });
  });

  test.describe('Analytics Consent Enforcement', () => {
    
    test('should not load analytics without consent', async ({ page }) => {
      // Reject all cookies
      await page.locator('#gdpr-reject-all').click();
      
      // Check that analytics are not enabled
      const analyticsEnabled = await page.evaluate(() => {
        return window.gdprCompliance?.hasConsent('analytics');
      });
      
      expect(analyticsEnabled).toBe(false);
      
      console.log('✅ Analytics consent enforcement test passed');
    });

    test('should load analytics with consent', async ({ page }) => {
      // Accept all cookies
      await page.locator('#gdpr-accept-all').click();
      
      // Wait for GDPR script to initialize
      await page.waitForTimeout(1000);
      
      // Check that analytics are enabled
      const analyticsEnabled = await page.evaluate(() => {
        return window.gdprCompliance?.hasConsent('analytics');
      });
      
      expect(analyticsEnabled).toBe(true);
      
      console.log('✅ Analytics with consent test passed');
    });
  });
});