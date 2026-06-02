import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Navigation Page Object
 * Handles header navigation, mobile menu, and footer navigation
 */
export class NavigationPage extends BasePage {
  // Header elements
  readonly header: Locator;
  readonly logo: Locator;
  readonly navLinks: Locator;
  readonly mobileMenuButton: Locator;
  readonly mobileMenu: Locator;

  // Footer elements
  readonly footer: Locator;
  readonly footerLinks: Locator;
  readonly socialLinks: Locator;

  constructor(page: Page) {
    super(page);

    // Header
    this.header = page.locator('header, .navbar, nav[role="navigation"]').first();
    this.logo = page.locator('a.navbar-brand, .logo, a[href="/"]').first();
    this.navLinks = page.locator('nav a, .navbar-menu a, .nav-links a');
    this.mobileMenuButton = page.locator('.navbar-burger, .mobile-menu-toggle, [aria-label*="menu"]');
    this.mobileMenu = page.locator('.navbar-menu.is-active, .mobile-menu.open, [role="menu"]');

    // Footer
    this.footer = page.locator('footer');
    this.footerLinks = page.locator('footer a');
    this.socialLinks = page.locator('footer a[href*="twitter"], footer a[href*="linkedin"], footer a[href*="github"]');
  }

  /**
   * Check if header is visible
   */
  async isHeaderVisible(): Promise<boolean> {
    return this.header.isVisible();
  }

  /**
   * Check if footer is visible
   */
  async isFooterVisible(): Promise<boolean> {
    return this.footer.isVisible();
  }

  /**
   * Click on logo to go home
   */
  async clickLogo(): Promise<void> {
    await this.logo.click();
  }

  /**
   * Get all navigation link texts
   */
  async getNavLinkTexts(): Promise<string[]> {
    return this.navLinks.allTextContents();
  }

  /**
   * Click a navigation link by text
   */
  async clickNavLink(text: string): Promise<void> {
    await this.navLinks.filter({ hasText: text }).first().click();
  }

  /**
   * Open mobile menu
   */
  async openMobileMenu(): Promise<void> {
    const isMobileMenuVisible = await this.mobileMenuButton.isVisible();
    if (isMobileMenuVisible) {
      await this.mobileMenuButton.click();
      await this.page.waitForTimeout(300); // Wait for animation
    }
  }

  /**
   * Close mobile menu
   */
  async closeMobileMenu(): Promise<void> {
    const isMobileMenuOpen = await this.mobileMenu.isVisible();
    if (isMobileMenuOpen) {
      await this.mobileMenuButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Check if mobile menu is open
   */
  async isMobileMenuOpen(): Promise<boolean> {
    return this.mobileMenu.isVisible();
  }

  /**
   * Get all footer link hrefs
   */
  async getFooterLinkHrefs(): Promise<string[]> {
    const hrefs: string[] = [];
    const count = await this.footerLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await this.footerLinks.nth(i).getAttribute('href');
      if (href) hrefs.push(href);
    }
    return hrefs;
  }

  /**
   * Verify navigation links don't return 404
   */
  async verifyNavLinksAreValid(): Promise<{ valid: string[]; broken: string[] }> {
    const valid: string[] = [];
    const broken: string[] = [];

    const count = await this.navLinks.count();
    for (let i = 0; i < count; i++) {
      const href = await this.navLinks.nth(i).getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
        try {
          const response = await this.page.request.head(href);
          if (response.ok()) {
            valid.push(href);
          } else {
            broken.push(href);
          }
        } catch {
          broken.push(href);
        }
      }
    }

    return { valid, broken };
  }

  /**
   * Test keyboard navigation through nav links
   */
  async testKeyboardNavigation(): Promise<void> {
    // Focus on first nav link
    await this.navLinks.first().focus();

    // Tab through all links
    const count = await this.navLinks.count();
    for (let i = 0; i < count - 1; i++) {
      await this.page.keyboard.press('Tab');
    }

    // Verify last link is focused
    const lastLink = this.navLinks.last();
    await expect(lastLink).toBeFocused();
  }
}
