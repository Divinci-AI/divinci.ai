
/**
 * Signup Form Page Object for Divinci AI
 * 
 * Represents the newsletter signup form functionality
 */

import { Page, Locator } from '@playwright/test';

export class SignupForm {
  readonly page: Page;
  readonly formContainer: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;
  readonly successMessage: Locator;
  readonly errorMessage: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.formContainer = page.locator('#mc_embed_signup');
    this.emailInput = page.locator('#mc_embed_signup input[type="email"]');
    this.submitButton = page.locator('#mc-embedded-subscribe');
    this.successMessage = page.locator('#mce-success-response');
    this.errorMessage = page.locator('#mce-error-response');
  }
  
  /**
   * Scroll to the signup form
   */
  async scrollToSignupForm(): Promise<void> {
    await this.formContainer.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(500); // Allow animations to complete
  }
  
  /**
   * Fill in the email address
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }
  
  /**
   * Submit the form
   */
  async submitForm(): Promise<void> {
    await this.submitButton.click();
  }
  
  /**
   * Fill and submit the form
   */
  async subscribe(email: string): Promise<void> {
    await this.scrollToSignupForm();
    await this.fillEmail(email);
    await this.submitForm();
  }
  
  /**
   * Check if success message is displayed
   */
  async isSuccessMessageVisible(): Promise<boolean> {
    try {
      await this.successMessage.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Check if error message is displayed
   */
  async isErrorMessageVisible(): Promise<boolean> {
    try {
      await this.errorMessage.waitFor({ state: 'visible', timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Get the text of the success or error message
   */
  async getResponseMessage(): Promise<string> {
    if (await this.isSuccessMessageVisible()) {
      return (await this.successMessage.textContent()) || '';
    }
    if (await this.isErrorMessageVisible()) {
      return (await this.errorMessage.textContent()) || '';
    }
    return '';
  }
}
