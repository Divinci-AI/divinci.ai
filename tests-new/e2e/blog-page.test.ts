import { test, expect } from '@playwright/test';
import { BlogPage } from '../page-objects/BlogPage';

test.describe('Blog Page', () => {
  let blog: BlogPage;

  test.beforeEach(async ({ page }) => {
    blog = new BlogPage(page);
    await page.goto('/blog/');
  });

  test('should list at least one post with title', async () => {
    const titles = await blog.getAllPostTitles();
    expect(titles.length).toBeGreaterThan(0);
    for (const title of titles) {
      expect(title).not.toBe('');
    }
  });

  test('should navigate to post detail when clicking a post link', async ({ page }) => {
    const titles = await blog.getAllPostTitles();
    const firstTitle = titles[0];
    await blog.clickPostByTitle(firstTitle);
    await expect(page).toHaveURL(/posts\//);
    await expect(page.locator('h1')).toHaveText(firstTitle);
  });

  test('should display categories and popular tags', async () => {
    const categories = await blog.getCategories();
    const tags = await blog.getPopularTags();
    expect(categories.length).toBeGreaterThan(0);
    expect(tags.length).toBeGreaterThan(0);
  });
});