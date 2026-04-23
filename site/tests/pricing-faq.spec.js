const { test, expect } = require('@playwright/test');

test.describe('Pricing Page FAQ Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
    await page.waitForLoadState('networkidle');
  });

  test('FAQ section should be visible', async ({ page }) => {
    const faqSection = await page.locator('.faq-section');
    await expect(faqSection).toBeVisible();
    
    const faqTitle = await page.locator('.faq-title');
    await expect(faqTitle).toHaveText('Frequently Asked Questions');
  });

  test('FAQ questions should be visible and clickable', async ({ page }) => {
    const faqQuestions = await page.locator('.faq-question');
    await expect(faqQuestions).toHaveCount(6);
    
    // Check that all FAQ questions are visible
    await expect(faqQuestions.nth(0)).toHaveText("What's included in all plans?");
    await expect(faqQuestions.nth(1)).toHaveText('How does token usage work?');
    await expect(faqQuestions.nth(2)).toHaveText('Can I upgrade or downgrade my plan?');
    await expect(faqQuestions.nth(3)).toHaveText('What payment methods do you accept?');
    await expect(faqQuestions.nth(4)).toHaveText('Is there a free trial available?');
    await expect(faqQuestions.nth(5)).toHaveText('What happens to my data if I cancel?');
  });

  test('FAQ answers should be hidden by default', async ({ page }) => {
    const faqAnswers = await page.locator('.faq-answer');
    
    // Check that all FAQ answers are initially hidden (max-height: 0)
    for (let i = 0; i < 6; i++) {
      const answer = faqAnswers.nth(i);
      await expect(answer).not.toHaveClass(/active/);
      
      // Check computed style shows it's collapsed
      const maxHeight = await answer.evaluate(el => getComputedStyle(el).maxHeight);
      expect(maxHeight).toBe('0px');
    }
  });

  test('clicking FAQ question should expand answer', async ({ page }) => {
    const firstQuestion = await page.locator('.faq-question').first();
    const firstAnswer = await page.locator('.faq-answer').first();
    
    // Initially, answer should be collapsed
    await expect(firstAnswer).not.toHaveClass(/active/);
    
    // Click the first question
    await firstQuestion.click();
    
    // Wait for animation and check that answer is now expanded
    await page.waitForTimeout(500); // Wait for CSS transition
    await expect(firstAnswer).toHaveClass(/active/);
    
    // Check that the answer content is visible
    const answerText = await firstAnswer.textContent();
    expect(answerText).toContain('All plans include access to our core Divinci AI platform');
  });

  test('clicking FAQ question twice should collapse answer', async ({ page }) => {
    const firstQuestion = await page.locator('.faq-question').first();
    const firstAnswer = await page.locator('.faq-answer').first();
    
    // Click to expand
    await firstQuestion.click();
    await page.waitForTimeout(500);
    await expect(firstAnswer).toHaveClass(/active/);
    
    // Click again to collapse
    await firstQuestion.click();
    await page.waitForTimeout(500);
    await expect(firstAnswer).not.toHaveClass(/active/);
  });

  test('multiple FAQ items can be open simultaneously', async ({ page }) => {
    const questions = await page.locator('.faq-question');
    const answers = await page.locator('.faq-answer');
    
    // Click first question
    await questions.nth(0).click();
    await page.waitForTimeout(300);
    
    // Click second question
    await questions.nth(1).click();
    await page.waitForTimeout(300);
    
    // Both answers should be expanded
    await expect(answers.nth(0)).toHaveClass(/active/);
    await expect(answers.nth(1)).toHaveClass(/active/);
  });

  test('FAQ question should show chevron rotation', async ({ page }) => {
    const firstQuestion = await page.locator('.faq-question').first();
    
    // Initially, question should not have active class
    await expect(firstQuestion).not.toHaveClass(/active/);
    
    // Click the question
    await firstQuestion.click();
    await page.waitForTimeout(300);
    
    // Question should now have active class for chevron rotation
    await expect(firstQuestion).toHaveClass(/active/);
  });

  test('JavaScript console should show FAQ debug messages', async ({ page }) => {
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log') {
        consoleLogs.push(msg.text());
      }
    });
    
    // Reload page to trigger JavaScript
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check that FAQ script found the questions
    const faqLog = consoleLogs.find(log => log.includes('Found FAQ questions:'));
    expect(faqLog).toBeTruthy();
    expect(faqLog).toContain('Found FAQ questions: 6');
    
    // Click a question to trigger click event
    const firstQuestion = await page.locator('.faq-question').first();
    await firstQuestion.click();
    
    // Wait a bit for console message
    await page.waitForTimeout(100);
    
    // Check that click was logged
    const clickLog = consoleLogs.find(log => log.includes('FAQ question clicked'));
    expect(clickLog).toBeTruthy();
  });
});