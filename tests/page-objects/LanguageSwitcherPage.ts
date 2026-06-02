import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

/**
 * Supported languages configuration
 */
export interface LanguageConfig {
  code: string;
  name: string;
  path: string;
  dir: 'ltr' | 'rtl';
  expectedTitle?: string;
}

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  { code: 'en', name: 'English', path: '/', dir: 'ltr' },
  { code: 'es', name: 'Español', path: '/es/', dir: 'ltr' },
  { code: 'fr', name: 'Français', path: '/fr/', dir: 'ltr' },
  { code: 'ar', name: 'العربية', path: '/ar/', dir: 'rtl' },
];

/**
 * Language Switcher Page Object
 * Handles language selection and verification
 */
export class LanguageSwitcherPage extends BasePage {
  // Language switcher elements
  readonly languageSwitcher: Locator;
  readonly currentLanguage: Locator;
  readonly languageDropdown: Locator;
  readonly languageOptions: Locator;

  constructor(page: Page) {
    super(page);

    // Language switcher container
    this.languageSwitcher = page.locator('.language-switcher, [data-testid="language-switcher"], #language-switcher');
    this.currentLanguage = page.locator('.language-switcher-current, .current-language, [data-testid="current-language"]');
    this.languageDropdown = page.locator('.language-dropdown, .language-options, [data-testid="language-dropdown"]');
    this.languageOptions = page.locator('.language-option, .language-item, [data-testid="language-option"]');
  }

  /**
   * Check if language switcher is visible
   */
  async isLanguageSwitcherVisible(): Promise<boolean> {
    return this.languageSwitcher.isVisible();
  }

  /**
   * Open language dropdown
   */
  async openDropdown(): Promise<void> {
    await this.currentLanguage.click();
    await this.page.waitForTimeout(300); // Wait for animation
  }

  /**
   * Close language dropdown
   */
  async closeDropdown(): Promise<void> {
    // Click outside to close
    await this.page.locator('body').click({ position: { x: 0, y: 0 } });
    await this.page.waitForTimeout(300);
  }

  /**
   * Get current language code from HTML
   */
  async getCurrentLanguageCode(): Promise<string> {
    const lang = await this.getHtmlLang();
    return lang || 'en';
  }

  /**
   * Get text direction from HTML
   */
  async getTextDirection(): Promise<string> {
    const dir = await this.getHtmlDir();
    return dir || 'ltr';
  }

  /**
   * Select a language by code
   */
  async selectLanguage(languageCode: string): Promise<void> {
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    if (!langConfig) {
      throw new Error(`Unsupported language: ${languageCode}`);
    }

    // Try dropdown first
    const isDropdownAvailable = await this.languageSwitcher.isVisible();
    if (isDropdownAvailable) {
      await this.openDropdown();
      await this.languageOptions.filter({ hasText: langConfig.name }).click();
    } else {
      // Fallback to direct navigation
      await this.goto(langConfig.path);
    }

    await this.waitForPageLoad();
  }

  /**
   * Navigate directly to a language version
   */
  async navigateToLanguage(languageCode: string): Promise<void> {
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === languageCode);
    if (!langConfig) {
      throw new Error(`Unsupported language: ${languageCode}`);
    }
    await this.goto(langConfig.path);
  }

  /**
   * Verify current language is correct
   */
  async verifyLanguage(expectedCode: string): Promise<void> {
    const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === expectedCode);
    if (!langConfig) {
      throw new Error(`Unsupported language: ${expectedCode}`);
    }

    // Verify HTML lang attribute
    const currentLang = await this.getCurrentLanguageCode();
    expect(currentLang).toBe(expectedCode);

    // Verify text direction
    const dir = await this.getTextDirection();
    expect(dir).toBe(langConfig.dir);

    // Verify URL contains correct path
    const url = this.getUrl();
    if (expectedCode === 'en') {
      expect(url).not.toMatch(/\/(es|fr|ar)\//);
    } else {
      expect(url).toContain(`/${expectedCode}/`);
    }
  }

  /**
   * Get all available language options
   */
  async getAvailableLanguages(): Promise<string[]> {
    await this.openDropdown();
    const texts = await this.languageOptions.allTextContents();
    await this.closeDropdown();
    return texts;
  }

  /**
   * Test language switcher accessibility
   */
  async testAccessibility(): Promise<void> {
    // Check for aria-label or aria-labelledby
    const ariaLabel = await this.languageSwitcher.getAttribute('aria-label');
    const ariaLabelledBy = await this.languageSwitcher.getAttribute('aria-labelledby');
    expect(ariaLabel || ariaLabelledBy).toBeTruthy();

    // Check keyboard accessibility
    await this.languageSwitcher.focus();
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(300);

    // Verify dropdown opened
    const isDropdownVisible = await this.languageDropdown.isVisible();
    expect(isDropdownVisible).toBe(true);

    // Close with Escape
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(300);
  }

  /**
   * Verify hreflang tags are present
   */
  async verifyHreflangTags(): Promise<void> {
    for (const lang of SUPPORTED_LANGUAGES) {
      const hreflang = this.page.locator(`link[rel="alternate"][hreflang="${lang.code}"]`);
      await expect(hreflang).toHaveCount(1);
    }

    // Also check x-default
    const xDefault = this.page.locator('link[rel="alternate"][hreflang="x-default"]');
    await expect(xDefault).toHaveCount(1);
  }
}
