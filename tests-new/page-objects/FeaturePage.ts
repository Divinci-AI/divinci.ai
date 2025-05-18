
/**
 * Feature Page Object for Divinci AI
 * 
 * Represents the Feature section and Feature detail pages
 */

import { Page, Locator } from '@playwright/test';

export class FeaturePage {
  readonly page: Page;
  readonly featuresSection: Locator;
  readonly featureCards: Locator;
  readonly featureLinks: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.featuresSection = page.locator('#features');
    this.featureCards = page.locator('.feature');
    this.featureLinks = page.locator('.feature a');
  }
  
  /**
   * Go to the features section
   */
  async scrollToFeaturesSection(): Promise<void> {
    await this.featuresSection.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500); // Allow animations to complete
  }
  
  /**
   * Get all feature titles
   */
  async getFeatureTitles(): Promise<string[]> {
    const titles = await this.featureCards.locator('h3').allTextContents();
    return titles;
  }
  
  /**
   * Navigate to a specific feature detail page by name
   */
  async goToFeatureDetailPage(featureName: string): Promise<void> {
    // Find the feature card with the matching title
    const featureCard = this.featureCards.filter({ has: this.page.locator('h3', { hasText: featureName }) });
    
    // Find and click the link within that feature card
    const link = featureCard.locator('a').first();
    await link.click();
    
    // Wait for navigation to complete
    await this.page.waitForLoadState('networkidle');
  }
  
  /**
   * Check if we're on a feature detail page
   */
  async isFeatureDetailPage(): Promise<boolean> {
    const url = this.page.url();
    return url.includes('/features/');
  }
  
  /**
   * Go back to the homepage
   */
  async goBackToHomepage(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForSelector('#features', { timeout: 10000 });
  }
}
