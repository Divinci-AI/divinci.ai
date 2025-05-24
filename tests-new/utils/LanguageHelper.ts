
/**
 * LanguageHelper Utility for Divinci AI
 * 
 * Provides helper functions for language-related testing
 */

import { Page } from '@playwright/test';

// Supported languages configuration
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', default: true },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'ar', name: 'Arabic', rtl: true }
];

export class LanguageHelper {
  private page: Page;
  private baseUrl: string;
  
  constructor(page: Page, baseUrl: string = 'http://localhost:8001') {
    this.page = page;
    this.baseUrl = baseUrl;
  }
  
  /**
   * Navigate to a specific language version
   */
  async goToLanguage(langCode: string): Promise<void> {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (!lang) throw new Error(`Language ${langCode} is not supported`);
    
    const url = lang.default ? this.baseUrl : `${this.baseUrl}/${lang.code}/`;
    await this.page.goto(url);
    await this.page.waitForSelector('nav.navbar', { timeout: 10000 });
  }
  
  /**
   * Change language using the language switcher dropdown
   */
  async switchLanguage(langCode: string): Promise<void> {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (!lang) throw new Error(`Language ${langCode} is not supported`);
    
    // Open language switcher dropdown
    await this.page.locator('.language-switcher-current').click();
    await this.page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    
    // Click on language option
    await this.page.locator(`.language-option[data-lang="${lang.code}"]`).click();
    
    // Wait for navigation to complete
    if (lang.default) {
      await this.page.waitForURL(/\/$|index\.html$/);
    } else {
      await this.page.waitForURL('**/' + lang.code + '/**');
    }
  }
  
  /**
   * Get the text content of an element in the current language
   */
  async getTranslatedText(selector: string): Promise<string> {
    const element = await this.page.locator(selector).first();
    return element.textContent() || '';
  }
  
  /**
   * Check if the page has RTL direction
   */
  async isRtl(): Promise<boolean> {
    return await this.page.evaluate(() => document.documentElement.dir === 'rtl');
  }
}
