/**
 * Link Checker Utility for Divinci AI
 * 
 * Provides utilities for comprehensive link checking and validation
 */

import { Page } from '@playwright/test';

export interface LinkCheckResult {
  url: string;
  status: number;
  ok: boolean;
  error?: string;
  redirectUrl?: string;
}

export interface PageLinkSummary {
  totalLinks: number;
  internalLinks: number;
  externalLinks: number;
  anchorLinks: number;
  brokenLinks: LinkCheckResult[];
  workingLinks: LinkCheckResult[];
}

export class LinkChecker {
  private page: Page;
  private baseUrl: string;
  
  constructor(page: Page) {
    this.page = page;
    this.baseUrl = new URL(page.url()).origin;
  }
  
  /**
   * Get all links on the current page
   */
  async getAllLinks(): Promise<string[]> {
    return await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.map(link => (link as HTMLAnchorElement).href);
    });
  }
  
  /**
   * Get all links with their text content
   */
  async getAllLinksWithText(): Promise<Array<{ href: string; text: string; selector: string }>> {
    return await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      return links.map((link, index) => ({
        href: (link as HTMLAnchorElement).href,
        text: link.textContent?.trim() || '',
        selector: `a:nth-of-type(${index + 1})`
      }));
    });
  }
  
  /**
   * Check the status of a single link
   */
  async checkLink(url: string): Promise<LinkCheckResult> {
    try {
      // Skip checking anchor links and javascript links
      if (url.startsWith('#') || url.startsWith('javascript:') || url.startsWith('mailto:') || url.startsWith('tel:')) {
        return {
          url,
          status: 200,
          ok: true
        };
      }
      
      const response = await this.page.request.get(url, {
        timeout: 10000,
        ignoreHTTPSErrors: true
      });
      
      return {
        url,
        status: response.status(),
        ok: response.ok(),
        redirectUrl: response.url() !== url ? response.url() : undefined
      };
    } catch (error) {
      return {
        url,
        status: 0,
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Check all links on the current page
   */
  async checkAllLinks(): Promise<LinkCheckResult[]> {
    const links = await this.getAllLinks();
    const results: LinkCheckResult[] = [];
    
    // Check links in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < links.length; i += batchSize) {
      const batch = links.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(link => this.checkLink(link))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      await this.page.waitForTimeout(100);
    }
    
    return results;
  }
  
  /**
   * Get a summary of all links on the page
   */
  async getPageLinkSummary(): Promise<PageLinkSummary> {
    const results = await this.checkAllLinks();
    
    const summary: PageLinkSummary = {
      totalLinks: results.length,
      internalLinks: 0,
      externalLinks: 0,
      anchorLinks: 0,
      brokenLinks: [],
      workingLinks: []
    };
    
    for (const result of results) {
      if (result.url.startsWith('#')) {
        summary.anchorLinks++;
      } else if (result.url.startsWith(this.baseUrl)) {
        summary.internalLinks++;
      } else {
        summary.externalLinks++;
      }
      
      if (result.ok) {
        summary.workingLinks.push(result);
      } else {
        summary.brokenLinks.push(result);
      }
    }
    
    return summary;
  }
  
  /**
   * Check specific footer links
   */
  async checkFooterLinks(): Promise<LinkCheckResult[]> {
    const footerLinks = await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('.footer-links-column a, .footer-bottom-links a'));
      return links.map(link => (link as HTMLAnchorElement).href);
    });
    
    const results: LinkCheckResult[] = [];
    for (const link of footerLinks) {
      const result = await this.checkLink(link);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Check navigation links
   */
  async checkNavigationLinks(): Promise<LinkCheckResult[]> {
    const navLinks = await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('nav a[href]'));
      return links.map(link => (link as HTMLAnchorElement).href);
    });
    
    const results: LinkCheckResult[] = [];
    for (const link of navLinks) {
      const result = await this.checkLink(link);
      results.push(result);
    }
    
    return results;
  }
  
  /**
   * Validate that anchor links point to existing elements
   */
  async validateAnchorLinks(): Promise<Array<{ href: string; exists: boolean; element?: string }>> {
    const anchorLinks = await this.page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href^="#"]'));
      return links.map(link => (link as HTMLAnchorElement).href);
    });
    
    const results = [];
    for (const link of anchorLinks) {
      const hash = new URL(link).hash;
      const targetId = hash.substring(1);
      
      if (targetId) {
        const exists = await this.page.locator(`#${targetId}`).count() > 0;
        results.push({
          href: link,
          exists,
          element: targetId
        });
      }
    }
    
    return results;
  }
}
