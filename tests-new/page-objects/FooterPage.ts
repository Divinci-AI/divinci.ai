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
    this.footer = page.locator('footer, .site-footer');
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
  async getSocialLinks(): Promise<{ text: string; href: string }[]> {
    const links: { text: string; href: string }[] = [];
    const socialLinks = await this.socialLinks.all();
    
    for (const link of socialLinks) {
      const ariaLabel = await link.getAttribute('aria-label') || '';
      const href = await link.getAttribute('href') || '';
      links.push({ text: ariaLabel, href });
    }
    
    return links;
  }
  
  /**
   * Click a footer link by text
   */
  async clickFooterLinkByText(linkText: string): Promise<void> {
    const link = this.footer.locator('a', { hasText: linkText });
    await expect(link).toBeVisible();
    await link.click();
    await this.page.waitForLoadState('networkidle');
  }
  
  /**
   * Click a footer link by href
   */
  async clickFooterLinkByHref(href: string): Promise<void> {
    const link = this.footer.locator(`a[href="${href}"]`);
    await expect(link).toBeVisible();
    await link.click();
    await this.page.waitForLoadState('networkidle');
  }
  
  /**
   * Test if a link is working (returns 200 status)
   */
  async testLinkStatus(href: string, baseUrl: string): Promise<{ status: number; url: string; error?: string }> {
    try {
      // Handle relative URLs
      let fullUrl = href;
      if (href.startsWith('#')) {
        // Anchor links - use current page URL
        fullUrl = this.page.url() + href;
      } else if (href.startsWith('/')) {
        // Absolute path
        fullUrl = baseUrl + href;
      } else if (!href.startsWith('http')) {
        // Relative path
        const currentUrl = this.page.url();
        const currentPath = new URL(currentUrl).pathname;
        const basePath = currentPath.endsWith('/') ? currentPath : currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
        fullUrl = baseUrl + basePath + href;
      }
      
      // For anchor links, just check if the element exists on the page
      if (href.startsWith('#')) {
        const targetElement = this.page.locator(href);
        const exists = await targetElement.count() > 0;
        return { status: exists ? 200 : 404, url: fullUrl };
      }
      
      // For external links, make a request
      if (href.startsWith('http')) {
        const response = await this.page.request.get(href);
        return { status: response.status(), url: href };
      }
      
      // For internal links, navigate and check
      const response = await this.page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
      return { status: response?.status() || 0, url: fullUrl };
      
    } catch (error) {
      return { status: 0, url: href, error: error instanceof Error ? error.message : String(error) };
    }
  }
  
  /**
   * Test all footer links and return results
   */
  async testAllFooterLinks(baseUrl: string): Promise<{
    working: { text: string; href: string; section: string; status: number }[];
    broken: { text: string; href: string; section: string; status: number; error?: string }[];
  }> {
    const allLinks = await this.getAllFooterLinks();
    const working: { text: string; href: string; section: string; status: number }[] = [];
    const broken: { text: string; href: string; section: string; status: number; error?: string }[] = [];
    
    for (const link of allLinks) {
      if (!link.href || link.href === '#') {
        continue; // Skip empty or placeholder links
      }
      
      const result = await this.testLinkStatus(link.href, baseUrl);
      
      if (result.status >= 200 && result.status < 400) {
        working.push({ ...link, status: result.status });
      } else {
        broken.push({ ...link, status: result.status, error: result.error });
      }
    }
    
    return { working, broken };
  }
  
  /**
   * Take a screenshot of the footer
   */
  async takeFooterScreenshot(filename: string): Promise<void> {
    await this.scrollToFooter();
    await this.footer.screenshot({ path: `test-results/${filename}` });
  }
}
