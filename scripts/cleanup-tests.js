#!/usr/bin/env node

/**
 * Test Cleanup Script for Divinci AI
 * 
 * This script refactors the Playwright E2E tests to focus only on core files directly
 * referenced in index.html, removing tests for non-essential files and language variants.
 * 
 * Usage:
 * node cleanup-tests.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'),
  testsDir: path.resolve(__dirname, '../tests'),
  outputDir: path.resolve(__dirname, '../tests-new'),
  
  // Tests to keep (core functionality based on index.html)
  keepTests: [
    // Core Navigation Tests
    'e2e/navigation.spec.ts',
    'e2e/header-navigation.test.js',
    'e2e/toggle-view.spec.ts',
    
    // Feature Section Tests
    'e2e/feature-links.spec.ts',
    'e2e/features.test.js',
    
    // Blog and Social Share Tests (keeping only blog post social share functionality)
    'e2e/blog-post.spec.ts',
    'e2e/blog-social-share.test.js',
    
    // Signup Form Tests
    'e2e/newsletter-signup.spec.ts',
    
    // Visual Comparison Tests
    'visual/homepage.visual.spec.ts',
    'visual/blog.visual.spec.ts',
    'visual/mobile-support.visual.spec.ts',
    
    // Essential Mobile Tests
    'e2e/mobile-navigation.spec.ts',
    'e2e/device-specific.spec.ts',
    
    // Language Tests - Keeping Only Main Languages
    'e2e/language-core.test.js',      // New core language test file to be created
    'direct-language-navigation.test.js',
    'direct-language-navigation-content.test.js',
    'main-website-translation.test.js',
    
    // Utility Files
    'utils/visual-testing.ts',
    'utils/PageNavigationHelper.ts',
    'utils/MobileDevices.ts',
    'utils/LanguageHelper.ts',      // New helper for language testing
    
    // Page Objects for Core Pages
    'page-objects/HomePage.ts',
    'page-objects/FeaturePage.ts',   // New page object
    'page-objects/BlogPage.ts',      // New page object
    'page-objects/SignupForm.ts'     // New page object
  ],
  
  // Tests to remove (non-essential or related to language variants)
  removeTests: [
    // Specific Language Tests (replaced by core language test)
    'language-content-change.test.js',
    'language-content-change-simple.test.js',
    'spanish-content.test.js',
    'spanish-navigation.test.js',
    'french-navigation.test.js',
    'arabic-navigation.test.js',
    'all-languages-navigation.test.js',
    'all-language-tests.js',
    'language-switching.test.js',
    'translation-workflow.test.js',
    
    // Detailed Language Switcher Tests (to be simplified)
    'language-switcher.test.js',
    'language-switcher-debug.test.js',
    'language-switcher-dropdown.test.js',
    
    // Non-Core Mobile Tests
    'e2e/mobile-blog.spec.ts',
    'e2e/mobile-case-studies.spec.ts',
    'e2e/mobile-legal.spec.ts',
    'e2e/mobile-api-docs.spec.ts',
    'e2e/mobile-partners.spec.ts',
    'e2e/mobile-careers.spec.ts',
    
    // Non-Core Page Tests
    'e2e/about-us.spec.ts',       // Keep visual test but remove E2E test
    'e2e/contact-form.spec.ts',   // Not in main index.html flow
    'e2e/pricing.spec.ts',        // Not in main index.html flow
    
    // Social Media Tests (except blog posts)
    'e2e/social-media-links.spec.ts',
    'e2e/social-good.spec.ts'
  ]
};

/**
 * Check if a test file should be kept
 * @param {string} filePath - Path to test file
 * @returns {boolean} - Whether to keep the test file
 */
function shouldKeepTest(filePath) {
  const relativePath = path.relative(config.testsDir, filePath);
  
  // Check if it's in the keep list
  if (config.keepTests.some(keepTest => relativePath.includes(keepTest))) {
    return true;
  }
  
  // Check if it's in the remove list
  if (config.removeTests.some(removeTest => relativePath.includes(removeTest))) {
    return false;
  }
  
  // By default, keep tests not explicitly marked for removal
  return true;
}

/**
 * Clean up imports in a test file to reference only the kept test files
 * @param {string} content - File content
 * @param {string} filePath - Path to the file being processed
 * @param {Array<string>} keptFiles - List of kept file paths
 * @returns {string} - Updated file content
 */
function cleanupImports(content, filePath, keptFiles) {
  // Find import statements
  const importRegex = /import\s+.*\s+from\s+['"](.*)['"]/g;
  let match;
  let updatedContent = content;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // Skip external imports
    if (!importPath.startsWith('.')) {
      continue;
    }
    
    // Resolve the absolute path of the imported file
    const currentDir = path.dirname(filePath);
    const importedFilePath = path.resolve(currentDir, importPath);
    const relativeToTestsDir = path.relative(config.testsDir, importedFilePath);
    
    // Check if the imported file is being kept
    const isKept = keptFiles.some(keptFile => 
      keptFile === relativeToTestsDir || 
      keptFile.replace(/\.ts$/, '') === relativeToTestsDir.replace(/\.ts$/, '')
    );
    
    if (!isKept) {
      // Comment out the import
      const importStatement = match[0];
      updatedContent = updatedContent.replace(
        importStatement, 
        `// REMOVED IMPORT: ${importStatement}`
      );
    }
  }
  
  return updatedContent;
}

/**
 * Create template files for new test files mentioned in keepTests but not yet existing
 */
async function createTemplateMissingFiles() {
  // Basic templates for new files
  const templates = {
    'e2e/language-core.test.js': `
/**
 * Core Language Tests for Divinci AI
 * 
 * Tests the main language functionality focusing on the four supported languages:
 * - English (en)
 * - Spanish (es)
 * - French (fr)
 * - Arabic (ar)
 */

import { test, expect } from '@playwright/test';

// Configuration for language testing
const config = {
  baseUrl: 'http://localhost:8001',
  languages: [
    { code: 'en', name: 'English', default: true },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'ar', name: 'Arabic', rtl: true }
  ],
  // Core elements that should be translated in each language
  translatedElements: [
    { selector: '.nav-menu a[href="#features"]', property: 'textContent' },
    { selector: '.nav-menu a[href="#team"]', property: 'textContent' },
    { selector: '.signup-button', property: 'textContent' }
  ]
};

// Test that all supported languages can be accessed directly
test('All supported languages should be accessible via direct URL', async ({ page }) => {
  for (const lang of config.languages) {
    // Construct URL with language code (except for default language)
    const url = lang.default ? config.baseUrl : \`\${config.baseUrl}/\${lang.code}/\`;
    
    // Navigate to the language-specific version
    await page.goto(url);
    
    // Wait for the page to load
    await page.waitForSelector('nav.navbar', { timeout: 10000 });
    
    // Verify the page loaded by checking for key elements
    const heading = await page.locator('h1').first();
    expect(await heading.isVisible()).toBe(true);
    
    // Check for RTL direction if applicable
    if (lang.rtl) {
      const htmlDir = await page.evaluate(() => document.documentElement.dir);
      expect(htmlDir).toBe('rtl');
    }
  }
});

// Test that the language switcher properly changes languages
test('Language switcher should change the page language', async ({ page }) => {
  // Start with English
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('nav.navbar', { timeout: 10000 });
  
  // Open language switcher dropdown
  await page.locator('.language-switcher-current').click();
  
  // Wait for dropdown to appear
  await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
  
  // Try each language
  for (const lang of config.languages) {
    if (lang.default) continue; // Skip default language
    
    // Click on language option
    await page.locator(\`.language-option[data-lang="\${lang.code}"]\`).click();
    
    // Wait for navigation
    await page.waitForURL(\`**/*\${lang.code}/*\`);
    
    // Check if we landed on the correct language page
    const currentUrl = page.url();
    expect(currentUrl).toContain(\`/\${lang.code}/\`);
    
    // Go back to base URL to try next language
    if (lang !== config.languages[config.languages.length - 1]) {
      await page.goto(config.baseUrl);
      await page.waitForSelector('nav.navbar', { timeout: 10000 });
      await page.locator('.language-switcher-current').click();
      await page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    }
  }
});
`,
    'utils/LanguageHelper.ts': `
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
    if (!lang) throw new Error(\`Language \${langCode} is not supported\`);
    
    const url = lang.default ? this.baseUrl : \`\${this.baseUrl}/\${lang.code}/\`;
    await this.page.goto(url);
    await this.page.waitForSelector('nav.navbar', { timeout: 10000 });
  }
  
  /**
   * Change language using the language switcher dropdown
   */
  async switchLanguage(langCode: string): Promise<void> {
    const lang = SUPPORTED_LANGUAGES.find(l => l.code === langCode);
    if (!lang) throw new Error(\`Language \${langCode} is not supported\`);
    
    // Open language switcher dropdown
    await this.page.locator('.language-switcher-current').click();
    await this.page.waitForSelector('.language-switcher-dropdown', { state: 'visible' });
    
    // Click on language option
    await this.page.locator(\`.language-option[data-lang="\${lang.code}"]\`).click();
    
    // Wait for navigation to complete
    if (lang.default) {
      await this.page.waitForURL(/\\/$|index\\.html$/);
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
`,
    'page-objects/FeaturePage.ts': `
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
`,
    'page-objects/BlogPage.ts': `
/**
 * Blog Page Object for Divinci AI
 * 
 * Represents the Blog page and Blog post pages with social sharing functionality
 */

import { Page, Locator } from '@playwright/test';

export class BlogPage {
  readonly page: Page;
  readonly socialShareButtons: Locator;
  readonly blogPostTitle: Locator;
  readonly blogPostContent: Locator;
  
  constructor(page: Page) {
    this.page = page;
    this.socialShareButtons = page.locator('.social-share-container .social-share-button');
    this.blogPostTitle = page.locator('article h1').first();
    this.blogPostContent = page.locator('article .content');
  }
  
  /**
   * Go to the blog index page
   */
  async goToBlogIndex(): Promise<void> {
    await this.page.goto('/blog/');
    await this.page.waitForSelector('h1', { timeout: 10000 });
  }
  
  /**
   * Go to a specific blog post by URL slug
   */
  async goToBlogPost(postSlug: string): Promise<void> {
    await this.page.goto(\`/blog/posts/\${postSlug}.html\`);
    await this.page.waitForSelector('article', { timeout: 10000 });
  }
  
  /**
   * Get all available social share platform options
   */
  async getSocialSharePlatforms(): Promise<string[]> {
    const buttons = await this.socialShareButtons.all();
    const platforms = [];
    
    for (const button of buttons) {
      const className = await button.getAttribute('class') || '';
      const match = className.match(/social-share-(\\w+)/);
      if (match && match[1]) {
        platforms.push(match[1]);
      }
    }
    
    return platforms;
  }
  
  /**
   * Click a social share button by platform name
   */
  async clickSocialShareButton(platform: string): Promise<void> {
    const button = this.page.locator(\`.social-share-button.social-share-\${platform}\`);
    await button.click();
  }
  
  /**
   * Check if social share container is visible
   */
  async isSocialShareContainerVisible(): Promise<boolean> {
    const container = this.page.locator('.social-share-container');
    return await container.isVisible();
  }
  
  /**
   * Get blog post metadata (title, date, author)
   */
  async getBlogPostMetadata(): Promise<{ title: string; date?: string; author?: string }> {
    const title = await this.blogPostTitle.textContent() || '';
    const dateElement = this.page.locator('article .date').first();
    const authorElement = this.page.locator('article .author').first();
    
    const date = await dateElement.isVisible() ? await dateElement.textContent() || undefined : undefined;
    const author = await authorElement.isVisible() ? await authorElement.textContent() || undefined : undefined;
    
    return { title, date, author };
  }
}
`,
    'page-objects/SignupForm.ts': `
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
`
  };

  if (!isDryRun) {
    // Create any missing template files that are in keepTests but don't exist
    for (const keepTest of config.keepTests) {
      if (templates[keepTest]) {
        const filePath = path.join(config.outputDir, keepTest);
        const dirPath = path.dirname(filePath);
        
        try {
          // Create directory if it doesn't exist
          await mkdir(dirPath, { recursive: true });
          
          // Write template file
          await writeFile(filePath, templates[keepTest]);
          console.log(`✅ Created template file: ${keepTest}`);
        } catch (error) {
          console.error(`❌ Error creating template file ${keepTest}: ${error.message}`);
        }
      }
    }
  } else {
    // Just log what would be created in dry run mode
    for (const keepTest of config.keepTests) {
      if (templates[keepTest]) {
        console.log(`🔍 Would create template file: ${keepTest}`);
      }
    }
  }
}

/**
 * Process all test files
 */
async function processTests() {
  // Create output directory
  if (!isDryRun) {
    try {
      await mkdir(config.outputDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        console.error(`❌ Error creating output directory: ${error.message}`);
        process.exit(1);
      }
    }
  }

  // Collect all test files
  const keptFiles = [];
  const removedFiles = [];
  
  async function collectTestFiles(dir) {
    const entries = await readdir(dir);
    
    for (const entry of entries) {
      const entryPath = path.join(dir, entry);
      const stats = await stat(entryPath);
      
      if (stats.isDirectory()) {
        await collectTestFiles(entryPath);
      } else if (stats.isFile() && (entryPath.endsWith('.ts') || entryPath.endsWith('.js'))) {
        const relativePath = path.relative(config.testsDir, entryPath);
        
        if (shouldKeepTest(entryPath)) {
          keptFiles.push(relativePath);
        } else {
          removedFiles.push(relativePath);
        }
      }
    }
  }
  
  await collectTestFiles(config.testsDir);
  
  // Copy and modify kept files, potentially removing imports to removed files
  for (const filePath of keptFiles) {
    const sourcePath = path.join(config.testsDir, filePath);
    const destPath = path.join(config.outputDir, filePath);
    
    // Create directory if it doesn't exist
    const destDir = path.dirname(destPath);
    if (!isDryRun) {
      try {
        await mkdir(destDir, { recursive: true });
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.error(`❌ Error creating directory ${destDir}: ${error.message}`);
          continue;
        }
      }
    }
    
    try {
      // Read the file
      const content = await readFile(sourcePath, 'utf8');
      
      // Clean up imports
      const updatedContent = cleanupImports(content, sourcePath, keptFiles);
      
      if (isDryRun) {
        console.log(`🔍 Would copy and modify: ${filePath}`);
      } else {
        await writeFile(destPath, updatedContent);
        console.log(`✅ Copied and modified: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}: ${error.message}`);
    }
  }
  
  // Create template files for new test files
  await createTemplateMissingFiles();
  
  // Log removed files
  console.log(`\n📋 Removed ${removedFiles.length} test files:`);
  for (const filePath of removedFiles) {
    console.log(`🗑️ ${filePath}`);
  }
  
  // Log kept files
  console.log(`\n📋 Kept ${keptFiles.length} test files:`);
  for (const filePath of keptFiles) {
    console.log(`✅ ${filePath}`);
  }
}

/**
 * Create new playwright.config.js file
 */
async function createNewPlaywrightConfig() {
  const configPath = path.join(config.rootDir, 'playwright.config.js');
  const newConfigPath = path.join(config.outputDir, '../playwright.config.refactored.js');
  
  try {
    // Read the existing config
    const content = await readFile(configPath, 'utf8');
    
    // Update testDir to point to the new directory
    let updatedContent = content.replace(
      /testDir:\s*['"]\.\/tests['"]/,
      `testDir: './tests-new'`
    );
    
    // Increase timeout for language tests
    updatedContent = updatedContent.replace(
      /timeout: (\d+) \* 1000/,
      `timeout: 60 * 1000 // Increased timeout for language tests`
    );
    
    if (isDryRun) {
      console.log(`🔍 Would create new Playwright config: ${newConfigPath}`);
    } else {
      await writeFile(newConfigPath, updatedContent);
      console.log(`✅ Created new Playwright config: ${newConfigPath}`);
    }
  } catch (error) {
    console.error(`❌ Error creating new Playwright config: ${error.message}`);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting test cleanup...');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE: No files will be modified');
  }
  
  // Process tests
  await processTests();
  
  // Create new Playwright config
  await createNewPlaywrightConfig();
  
  console.log('\n🎉 Test cleanup completed!');
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});