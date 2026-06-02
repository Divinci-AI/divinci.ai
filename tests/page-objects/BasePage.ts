import { Page, Locator, expect } from '@playwright/test';

/**
 * Base Page Object with common functionality
 * All page objects should extend this class
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a path relative to baseURL
   */
  async goto(path: string = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'networkidle' });
  }

  /**
   * Wait for page to be fully loaded
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Get the current page title
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get the current URL
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Check if an element is visible
   */
  async isVisible(locator: Locator): Promise<boolean> {
    return locator.isVisible();
  }

  /**
   * Wait for an element to be visible
   */
  async waitForVisible(locator: Locator, timeout?: number): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout });
  }

  /**
   * Get meta tag content
   */
  async getMetaContent(name: string): Promise<string | null> {
    const meta = this.page.locator(`meta[name="${name}"], meta[property="${name}"]`);
    return meta.getAttribute('content');
  }

  /**
   * Get the lang attribute of the HTML element
   */
  async getHtmlLang(): Promise<string | null> {
    return this.page.locator('html').getAttribute('lang');
  }

  /**
   * Get the dir attribute of the HTML element
   */
  async getHtmlDir(): Promise<string | null> {
    return this.page.locator('html').getAttribute('dir');
  }

  /**
   * Check canonical URL
   */
  async getCanonicalUrl(): Promise<string | null> {
    return this.page.locator('link[rel="canonical"]').getAttribute('href');
  }

  /**
   * Take a screenshot with a descriptive name
   */
  async screenshot(name: string): Promise<Buffer> {
    return this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Scroll to bottom of page
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(500); // Allow for lazy loading
  }

  /**
   * Scroll to top of page
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
  }
}
