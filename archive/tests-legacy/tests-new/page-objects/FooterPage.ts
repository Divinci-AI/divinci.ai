/**
 * Footer Page Object for Divinci AI
 * 
 * Represents the footer section and handles footer link navigation testing
 */

import { Page, Locator, expect } from '@playwright/test';

export class FooterPage {
  readonly page: Page;
  readonly footer: Locator;
  readonly footerLinksColumns: Locator;
  readonly footerBottomLinks: Locator;
  readonly socialLinks: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.footer = page.locator('[role="contentinfo"]');
    this.footerLinksColumns = page.locator('.footer-links-column');
    this.footerBottomLinks = page.locator('.footer-bottom-links a');
    this.socialLinks = page.locator('.social-links a');
  }
  
  /**
   * Scroll to footer section
   */
  async scrollToFooter(): Promise<void> {
    await this.footer.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500); // Allow animations to complete
  }
  
  /**
   * Get all footer links (excluding social media links)
   */
  async getAllFooterLinks(): Promise<{ text: string; href: string; section: string }[]> {
    const links: { text: string; href: string; section: string }[] = [];
    
    // Get links from footer columns
    const columns = await this.footerLinksColumns.all();
    for (const column of columns) {
      const sectionTitle = await column.locator('h3').textContent() || 'Unknown';
      const columnLinks = await column.locator('a').all();
      
      for (const link of columnLinks) {
        const text = await link.textContent() || '';
        const href = await link.getAttribute('href') || '';
        links.push({ text: text.trim(), href, section: sectionTitle });
      }
    }
    
    // Get bottom footer links
    const bottomLinks = await this.footerBottomLinks.all();
    for (const link of bottomLinks) {
      const text = await link.textContent() || '';
      const href = await link.getAttribute('href') || '';
      links.push({ text: text.trim(), href, section: 'Bottom' });
    }
    
    return links;
  }

  /**
   * Get all social media links
   */
  async getAllSocialLinks(): Promise<{ href: string; 'aria-label': string }[]> {
    const socialLinks = await this.socialLinks.all();
    const links = [];
    for (const link of socialLinks) {
      const href = await link.getAttribute('href') || '';
      const ariaLabel = await link.getAttribute('aria-label') || '';
      links.push({ href, 'aria-label': ariaLabel });
    }
    return links;
  }

  /**
   * Test all footer links on the page
   * @param baseUrl The base URL of the page being tested
   */
  async testAllFooterLinks(baseUrl: string): Promise<{ broken: string[] }> {
    await this.footer.waitFor({ state: 'visible', timeout: 10000 });
    const allLinks = await this.getAllFooterLinks();
    const brokenLinks: string[] = [];

    for (const link of allLinks) {
      if (!link.href || link.href.startsWith('mailto:') || link.href.startsWith('tel:')) {
        continue;
      }

      const absoluteUrl = new URL(link.href, 'http://localhost:8001').toString();

      try {
        const response = await this.page.request.head(absoluteUrl);
        if (response.status() !== 200) {
          brokenLinks.push(`${absoluteUrl} (Status: ${response.status()})`);
        }
      } catch (error) {
        brokenLinks.push(`${absoluteUrl} (Error: ${error.message})`);
      }
    }

    return { broken: brokenLinks };
  }
}
