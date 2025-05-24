
/**
 * Blog Page Object for Divinci AI
 * 
 * Represents the Blog page and Blog post pages with social sharing functionality
 */

import { Page, Locator } from '@playwright/test';

export class BlogPage {
  readonly page: Page;
  readonly socialShareButtons: Locator;
  readonly blogPostTitle: Locator;
  readonly blogPostContent: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.socialShareButtons = page.locator('.social-share-container .social-share-button');
    this.blogPostTitle = page.locator('article h1').first();
    this.blogPostContent = page.locator('article .content');
  }
  
  /**
   * Go to the blog index page
   */
  async goToBlogIndex(): Promise<void> {
    await this.page.goto('/blog/');
    await this.page.waitForSelector('h1', { timeout: 10000 });
  }
  
  /**
   * Go to a specific blog post by URL slug
   */
  async goToBlogPost(postSlug: string): Promise<void> {
    await this.page.goto(`/blog/posts/${postSlug}.html`);
    await this.page.waitForSelector('article', { timeout: 10000 });
  }
  
  /**
   * Get all available social share platform options
   */
  async getSocialSharePlatforms(): Promise<string[]> {
    const buttons = await this.socialShareButtons.all();
    const platforms = [];
    
    for (const button of buttons) {
      const className = await button.getAttribute('class') || '';
      const match = className.match(/social-share-(\w+)/);
      if (match && match[1]) {
        platforms.push(match[1]);
      }
    }
    
    return platforms;
  }
  
  /**
   * Click a social share button by platform name
   */
  async clickSocialShareButton(platform: string): Promise<void> {
    const button = this.page.locator(`.social-share-button.social-share-${platform}`);
    await button.click();
  }
  
  /**
   * Check if social share container is visible
   */
  async isSocialShareContainerVisible(): Promise<boolean> {
    const container = this.page.locator('.social-share-container');
    return await container.isVisible();
  }
  
  /**
   * Get blog post metadata (title, date, author)
   */
  async getBlogPostMetadata(): Promise<{ title: string; date?: string; author?: string }> {
    const title = await this.blogPostTitle.textContent() || '';
    const dateElement = this.page.locator('article .date').first();
    const authorElement = this.page.locator('article .author').first();
    
    const date = await dateElement.isVisible() ? await dateElement.textContent() || undefined : undefined;
    const author = await authorElement.isVisible() ? await authorElement.textContent() || undefined : undefined;
    
    return { title, date, author };
  }
}
