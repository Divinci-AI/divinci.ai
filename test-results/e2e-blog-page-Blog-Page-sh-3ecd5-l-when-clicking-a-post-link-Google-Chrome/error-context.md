# Test info

- Name: Blog Page >> should navigate to post detail when clicking a post link
- Location: /Users/mikeumus/Documents/divinci.ai/tests-new/e2e/blog-page.test.ts:20:7

# Error details

```
Error: browserType.launch: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
Run "npx playwright install chrome"
```

# Test source

```ts
   1 | import { test, expect } from '@playwright/test';
   2 | import { BlogPage } from '../page-objects/BlogPage';
   3 |
   4 | test.describe('Blog Page', () => {
   5 |   let blog: BlogPage;
   6 |
   7 |   test.beforeEach(async ({ page }) => {
   8 |     blog = new BlogPage(page);
   9 |     await page.goto('/blog/');
  10 |   });
  11 |
  12 |   test('should list at least one post with title', async () => {
  13 |     const titles = await blog.getAllPostTitles();
  14 |     expect(titles.length).toBeGreaterThan(0);
  15 |     for (const title of titles) {
  16 |       expect(title).not.toBe('');
  17 |     }
  18 |   });
  19 |
> 20 |   test('should navigate to post detail when clicking a post link', async ({ page }) => {
     |       ^ Error: browserType.launch: Chromium distribution 'chrome' is not found at /Applications/Google Chrome.app/Contents/MacOS/Google Chrome
  21 |     const titles = await blog.getAllPostTitles();
  22 |     const firstTitle = titles[0];
  23 |     await blog.clickPostByTitle(firstTitle);
  24 |     await expect(page).toHaveURL(/posts\//);
  25 |     await expect(page.locator('h1')).toHaveText(firstTitle);
  26 |   });
  27 |
  28 |   test('should display categories and popular tags', async () => {
  29 |     const categories = await blog.getCategories();
  30 |     const tags = await blog.getPopularTags();
  31 |     expect(categories.length).toBeGreaterThan(0);
  32 |     expect(tags.length).toBeGreaterThan(0);
  33 |   });
  34 | });
```