# Test info

- Name: Signup Form >> submit button should be enabled
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/signup-form.test.ts:21:7

# Error details

```
Error: browserType.launch: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge
Run "npx playwright install msedge"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { SignupForm } from '../page-objects/SignupForm';
   3 |
   4 | test.describe('Signup Form', () => {
   5 |   let signup: SignupForm;
   6 |
   7 |   test.beforeEach(async ({ page }) => {
   8 |     signup = new SignupForm(page);
   9 |     await page.goto('/');
  10 |     await signup.scrollToSignupForm();
  11 |   });
  12 |
  13 |   test('should display the signup form and allow input', async () => {
  14 |     expect(await signup.isFormVisible()).toBe(true);
  15 |     await signup.fillEmail('test@example.com');
  16 |     await expect(signup.emailInput).toHaveValue('test@example.com');
  17 |     await signup.clearEmail();
  18 |     await expect(signup.emailInput).toHaveValue('');
  19 |   });
  20 |
> 21 |   test('submit button should be enabled', async () => {
     |       ^ Error: browserType.launch: Chromium distribution 'msedge' is not found at /Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge
  22 |     expect(await signup.isSubmitButtonEnabled()).toBe(true);
  23 |   });
  24 | });
```