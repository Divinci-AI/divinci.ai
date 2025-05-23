# Test info

- Name: Signup Form >> should display the signup form and allow input
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/signup-form.test.ts:13:7

# Error details

```
Error: browserType.launch: Target page, context or browser has been closed
Browser logs:

<launching> /Users/mikeumus/Library/Caches/ms-playwright/firefox-1482/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /Users/mikeumus/Documents/divinci.ai/.tmp/playwright_firefoxdev_profile-lgGNWB -juggler-pipe -silent
<launched> pid=60605
[pid=60605][err] *** You are running in headless mode.
[pid=60605] <process did exit: exitCode=null, signal=SIGABRT>
[pid=60605] starting temporary directories cleanup
Call log:
  - <launching> /Users/mikeumus/Library/Caches/ms-playwright/firefox-1482/firefox/Nightly.app/Contents/MacOS/firefox -no-remote -headless -profile /Users/mikeumus/Documents/divinci.ai/.tmp/playwright_firefoxdev_profile-lgGNWB -juggler-pipe -silent
  - <launched> pid=60605
  - [pid=60605][err] *** You are running in headless mode.
  - [pid=60605] <process did exit: exitCode=null, signal=SIGABRT>
  - [pid=60605] starting temporary directories cleanup

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
> 13 |   test('should display the signup form and allow input', async () => {
     |       ^ Error: browserType.launch: Target page, context or browser has been closed
  14 |     expect(await signup.isFormVisible()).toBe(true);
  15 |     await signup.fillEmail('test@example.com');
  16 |     await expect(signup.emailInput).toHaveValue('test@example.com');
  17 |     await signup.clearEmail();
  18 |     await expect(signup.emailInput).toHaveValue('');
  19 |   });
  20 |
  21 |   test('submit button should be enabled', async () => {
  22 |     expect(await signup.isSubmitButtonEnabled()).toBe(true);
  23 |   });
  24 | });
```