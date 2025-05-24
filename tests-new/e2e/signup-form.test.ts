import { test, expect } from '@playwright/test';
import { SignupForm } from '../page-objects/SignupForm';

test.describe('Signup Form', () => {
  let signup: SignupForm;

  test.beforeEach(async ({ page }) => {
    signup = new SignupForm(page);
    await page.goto('/');
    await signup.scrollToSignupForm();
  });

  test('should display the signup form and allow input', async () => {
    expect(await signup.isFormVisible()).toBe(true);
    await signup.fillEmail('test@example.com');
    await expect(signup.emailInput).toHaveValue('test@example.com');
    await signup.clearEmail();
    await expect(signup.emailInput).toHaveValue('');
  });

  test('submit button should be enabled', async () => {
    expect(await signup.isSubmitButtonEnabled()).toBe(true);
  });
});