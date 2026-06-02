/**
 * Navigation Page Object for Divinci AI
 *
 * Handles navigation testing including header nav, footer links, and internal navigation
 */

import { Page, Locator, expect } from '@playwright/test';

export interface LinkInfo {
  text: string;
  href: string;
  selector: string;
  isExternal: boolean;
  isAnchor: boolean;
}

export class NavigationPage {
  readonly page: Page;
  readonly headerNav: Locator;
  readonly footerNav: Locator;
  readonly footerLinks: Locator;
  readonly footerBottomLinks: Locator;
  readonly socialLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.headerNav = page.locator('nav.navbar');
    this.footerNav = page.locator('.site-footer');
    this.footerLinks = page.locator('.footer-links-column a');
    this.footerBottomLinks = page.locator('.footer-bottom-links a');
    this.socialLinks = page.locator('.social-links a');
  }

  /**
   * Get all footer links with their information
   */
  async getAllFooterLinks(): Promise<LinkInfo[]> {
    const links: LinkInfo[] = [];

    // Get main footer links
    const footerLinkElements = await this.footerLinks.all();
    for (const link of footerLinkElements) {
      const text = await link.textContent() || '';
      const href = await link.getAttribute('href') || '';
      const selector = await this.getElementSelector(link);

      links.push({
        text: text.trim(),
        href,
        selector,
        isExternal: href.startsWith('http'),
        isAnchor: href.startsWith('#')
      });
    }

    // Get footer bottom links
    const bottomLinkElements = await this.footerBottomLinks.all();
    for (const link of bottomLinkElements) {
      const text = await link.textContent() || '';
      const href = await link.getAttribute('href') || '';
      const selector = await this.getElementSelector(link);

      links.push({
        text: text.trim(),
        href,
        selector,
        isExternal: href.startsWith('http'),
        isAnchor: href.startsWith('#')
      });
    }

    return links;
  }

  /**
   * Get all social media links
   */
  async getSocialLinks(): Promise<LinkInfo[]> {
    const links: LinkInfo[] = [];
    const socialLinkElements = await this.socialLinks.all();

    for (const link of socialLinkElements) {
      const text = await link.getAttribute('aria-label') || '';
      const href = await link.getAttribute('href') || '';
      const selector = await this.getElementSelector(link);

      links.push({
        text: text.trim(),
        href,
        selector,
        isExternal: href.startsWith('http'),
        isAnchor: href.startsWith('#')
      });
    }

    return links;
  }

  /**
   * Check if a link is working (doesn't return 404)
   */
  async checkLinkStatus(href: string): Promise<{ status: number; ok: boolean; error?: string }> {
    try {
      // Handle relative URLs
      let fullUrl = href;
      if (!href.startsWith('http') && !href.startsWith('#')) {
        const baseUrl = new URL(this.page.url()).origin;
        fullUrl = new URL(href, baseUrl).toString();
      }

      // Skip anchor links for HTTP status check
      if (href.startsWith('#')) {
        return { status: 200, ok: true };
      }

      const response = await this.page.request.get(fullUrl);
      return {
        status: response.status(),
        ok: response.ok()
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Click a link and verify navigation
   */
  async clickLinkAndVerify(linkSelector: string, expectedUrlPattern?: string | RegExp): Promise<void> {
    const link = this.page.locator(linkSelector);
    await expect(link).toBeVisible();

    const href = await link.getAttribute('href');
    const isExternal = href?.startsWith('http') || false;
    const isAnchor = href?.startsWith('#') || false;

    if (isExternal) {
      // For external links, verify they open in new tab
      const [newPage] = await Promise.all([
        this.page.waitForEvent('popup'),
        link.click()
      ]);
      await newPage.waitForLoadState();
      expect(newPage.url()).toContain(href?.replace('https://', '').replace('http://', '') || '');
      await newPage.close();
    } else if (isAnchor) {
      // For anchor links, verify scroll to element
      await link.click();
      await this.page.waitForTimeout(500); // Allow scroll animation

      const targetId = href?.substring(1);
      if (targetId) {
        const targetElement = this.page.locator(`#${targetId}`);
        await expect(targetElement).toBeInViewport();
      }
    } else {
      // For internal links, verify navigation
      await link.click();
      await this.page.waitForLoadState('networkidle');

      if (expectedUrlPattern) {
        await expect(this.page).toHaveURL(expectedUrlPattern);
      }
    }
  }

  /**
   * Get a unique selector for an element
   */
  private async getElementSelector(element: Locator): Promise<string> {
    const text = await element.textContent();
    const href = await element.getAttribute('href');

    if (text) {
      return `text="${text.trim()}"`;
    } else if (href) {
      return `[href="${href}"]`;
    } else {
      return 'a'; // fallback
    }
  }

  /**
   * Verify all footer sections exist
   */
  async verifyFooterStructure(): Promise<void> {
    await expect(this.footerNav).toBeVisible();

    // Check footer sections - support multiple languages
    const currentUrl = this.page.url();
    let expectedSections: string[];

    if (currentUrl.includes('/fr/')) {
      expectedSections = ['Produit', 'Ressources', 'Entreprise', 'Légal'];
    } else if (currentUrl.includes('/es/')) {
      expectedSections = ['Producto', 'Recursos', 'Empresa', 'Legal'];
    } else if (currentUrl.includes('/ar/')) {
      expectedSections = ['المنتج', 'الموارد', 'الشركة', 'قانوني'];
    } else {
      expectedSections = ['Product', 'Resources', 'Company', 'Legal'];
    }

    for (const section of expectedSections) {
      await expect(this.page.locator('.footer-links-column h3', { hasText: section })).toBeVisible();
    }

    // Check social links
    await expect(this.socialLinks).toHaveCount(3); // Twitter, LinkedIn, GitHub

    // Check footer bottom
    await expect(this.page.locator('.footer-bottom')).toBeVisible();
    await expect(this.page.locator('.copyright')).toBeVisible();
  }
}
