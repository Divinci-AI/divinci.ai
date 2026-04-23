const { test, expect } = require('@playwright/test');

/**
 * Site Comparison Test Suite
 * Compares content between original static site and new Zola site
 * Focuses on content parity while ignoring styling/branding differences
 */

// Configuration
const ORIGINAL_SITE_BASE = 'http://127.0.0.1:1025'; // Root static site
const NEW_SITE_BASE = 'http://127.0.0.1:1027';      // New Zola site

// Pages to compare (path mapping: original -> new)
const PAGE_MAPPINGS = {
  // Main pages
  '/': '/',
  '/autorag.html': '/autorag/',
  '/quality-assurance.html': '/quality-assurance/', 
  '/release-management.html': '/release-management/',
  '/terms-of-service.html': '/terms-of-service/',
  '/privacy-policy.html': '/privacy-policy/',
  
  // Language versions (Spanish)
  '/es/': '/es/',
  '/es/autorag.html': '/es/autorag/',
  '/es/quality-assurance.html': '/es/quality-assurance/',
  '/es/release-management.html': '/es/release-management/',
  
  // Language versions (French)
  '/fr/': '/fr/',
  '/fr/autorag.html': '/fr/autorag/',
  '/fr/quality-assurance.html': '/fr/quality-assurance/',
  '/fr/release-management.html': '/fr/release-management/',
  
  // Language versions (Arabic)
  '/ar/': '/ar/',
  '/ar/autorag.html': '/ar/autorag/',
  '/ar/quality-assurance.html': '/ar/quality-assurance/',
  '/ar/release-management.html': '/ar/release-management/',
};

// Content selectors to ignore during comparison (styling/branding elements)
const IGNORE_SELECTORS = [
  'style', 'link[rel="stylesheet"]', 'script',
  '.hero-image', '.hero-video', '.background-video',
  '[class*="animation"]', '[id*="animation"]',
  '.logo img', '.footer-logo img',
  '[style*="font-family"]', '[style*="color"]', '[style*="background"]'
];

// Helper function to clean content for comparison
function cleanContentForComparison(content) {
  return content
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .replace(/[\n\r\t]/g, ' ')      // Remove line breaks
    .replace(/\s{2,}/g, ' ')        // Multiple spaces to single
    .replace(/&nbsp;/g, ' ')        // Non-breaking spaces
    .replace(/[""'']/g, '"')        // Normalize quotes
    .trim()
    .toLowerCase();
}

// Helper function to extract and clean text content
async function extractCleanText(page, selector = 'body') {
  return await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (!element) return '';
    
    // Remove ignored elements
    const ignoreSelectors = [
      'style', 'script', 'noscript', 'svg',
      '.hero-image', '.hero-video', '.background-video',
      '[class*="animation"]', '[id*="animation"]',
      '.logo img', '.footer-logo img'
    ];
    
    ignoreSelectors.forEach(ignoreSel => {
      const elementsToRemove = element.querySelectorAll(ignoreSel);
      elementsToRemove.forEach(el => el.remove());
    });
    
    return element.textContent || element.innerText || '';
  }, selector);
}

// Helper function to extract structured content
async function extractStructuredContent(page) {
  return await page.evaluate(() => {
    const content = {};
    
    // Extract headings
    content.headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
      .map(h => ({
        level: h.tagName.toLowerCase(),
        text: h.textContent.trim(),
        id: h.id || null
      }));
    
    // Extract navigation links
    content.navigation = Array.from(document.querySelectorAll('nav a, header a'))
      .map(a => ({
        text: a.textContent.trim(),
        href: a.getAttribute('href'),
        className: a.className
      }))
      .filter(link => link.text && !link.text.match(/^(logo|divinci)$/i));
    
    // Extract main content paragraphs
    content.paragraphs = Array.from(document.querySelectorAll('main p, section p, article p'))
      .map(p => p.textContent.trim())
      .filter(text => text.length > 10); // Filter out short/empty paragraphs
    
    // Extract lists
    content.lists = Array.from(document.querySelectorAll('ul, ol'))
      .map(list => ({
        type: list.tagName.toLowerCase(),
        items: Array.from(list.querySelectorAll('li')).map(li => li.textContent.trim())
      }))
      .filter(list => list.items.length > 0);
    
    // Extract buttons/CTAs
    content.buttons = Array.from(document.querySelectorAll('button, .button, .cta-button, input[type="submit"]'))
      .map(btn => btn.textContent.trim())
      .filter(text => text.length > 0);
    
    // Extract meta information
    content.meta = {
      title: document.title,
      description: document.querySelector('meta[name="description"]')?.getAttribute('content') || '',
      lang: document.documentElement.lang || 'en'
    };
    
    return content;
  });
}

// Main comparison function
async function comparePages(originalUrl, newUrl, context) {
  console.log(`\\n🔍 Comparing: ${originalUrl} → ${newUrl}`);
  
  const [originalPage, newPage] = await Promise.all([
    context.newPage(),
    context.newPage()
  ]);
  
  try {
    // Navigate to both pages
    await Promise.all([
      originalPage.goto(ORIGINAL_SITE_BASE + originalUrl, { waitUntil: 'networkidle' }),
      newPage.goto(NEW_SITE_BASE + newUrl, { waitUntil: 'networkidle' })
    ]);
    
    // Wait for content to load
    await Promise.all([
      originalPage.waitForLoadState('domcontentloaded'),
      newPage.waitForLoadState('domcontentloaded')
    ]);
    
    // Extract structured content from both pages
    const [originalContent, newContent] = await Promise.all([
      extractStructuredContent(originalPage),
      extractStructuredContent(newPage)
    ]);
    
    const comparison = {
      url: { original: originalUrl, new: newUrl },
      meta: {
        original: originalContent.meta,
        new: newContent.meta
      },
      headings: {
        original: originalContent.headings,
        new: newContent.headings,
        missing: [],
        extra: []
      },
      navigation: {
        original: originalContent.navigation,
        new: newContent.navigation,
        missing: [],
        extra: []
      },
      content: {
        originalParagraphs: originalContent.paragraphs.length,
        newParagraphs: newContent.paragraphs.length,
        paragraphDiff: []
      },
      lists: {
        original: originalContent.lists,
        new: newContent.lists,
        missing: [],
        extra: []
      },
      buttons: {
        original: originalContent.buttons,
        new: newContent.buttons,
        missing: [],
        extra: []
      },
      issues: []
    };
    
    // Compare headings
    const originalHeadingTexts = originalContent.headings.map(h => cleanContentForComparison(h.text));
    const newHeadingTexts = newContent.headings.map(h => cleanContentForComparison(h.text));
    
    comparison.headings.missing = originalHeadingTexts.filter(h => !newHeadingTexts.includes(h));
    comparison.headings.extra = newHeadingTexts.filter(h => !originalHeadingTexts.includes(h));
    
    // Compare navigation
    const originalNavTexts = originalContent.navigation.map(n => cleanContentForComparison(n.text));
    const newNavTexts = newContent.navigation.map(n => cleanContentForComparison(n.text));
    
    comparison.navigation.missing = originalNavTexts.filter(n => !newNavTexts.includes(n));
    comparison.navigation.extra = newNavTexts.filter(n => !originalNavTexts.includes(n));
    
    // Compare paragraphs (sample for significant differences)
    const originalParaTexts = originalContent.paragraphs.map(p => cleanContentForComparison(p));
    const newParaTexts = newContent.paragraphs.map(p => cleanContentForComparison(p));
    
    const missingParagraphs = originalParaTexts.filter(p => 
      !newParaTexts.some(np => np.includes(p.substring(0, 50)) || p.includes(np.substring(0, 50)))
    );
    
    if (missingParagraphs.length > 0) {
      comparison.content.paragraphDiff = missingParagraphs.slice(0, 3); // Limit to first 3 for readability
    }
    
    // Compare buttons
    const originalButtonTexts = originalContent.buttons.map(b => cleanContentForComparison(b));
    const newButtonTexts = newContent.buttons.map(b => cleanContentForComparison(b));
    
    comparison.buttons.missing = originalButtonTexts.filter(b => !newButtonTexts.includes(b));
    comparison.buttons.extra = newButtonTexts.filter(b => !originalButtonTexts.includes(b));
    
    // Identify issues
    if (comparison.headings.missing.length > 0) {
      comparison.issues.push(`Missing headings: ${comparison.headings.missing.slice(0, 3).join(', ')}`);
    }
    if (comparison.navigation.missing.length > 0) {
      comparison.issues.push(`Missing navigation: ${comparison.navigation.missing.slice(0, 3).join(', ')}`);
    }
    if (comparison.content.paragraphDiff.length > 0) {
      comparison.issues.push(`Content differences detected in ${comparison.content.paragraphDiff.length} paragraphs`);
    }
    if (Math.abs(comparison.content.originalParagraphs - comparison.content.newParagraphs) > 2) {
      comparison.issues.push(`Significant paragraph count difference: ${comparison.content.originalParagraphs} → ${comparison.content.newParagraphs}`);
    }
    
    return comparison;
    
  } catch (error) {
    console.error(`❌ Error comparing ${originalUrl} → ${newUrl}:`, error.message);
    return {
      url: { original: originalUrl, new: newUrl },
      error: error.message,
      issues: [`Failed to load or compare pages: ${error.message}`]
    };
  } finally {
    await Promise.all([originalPage.close(), newPage.close()]);
  }
}

// Test suite
test.describe('Site Content Comparison', () => {
  test('should compare all mapped pages for content parity', async ({ browser }) => {
    const context = await browser.newContext();
    const results = [];
    
    console.log('\\n🚀 Starting comprehensive site comparison...\\n');
    console.log(`Original site: ${ORIGINAL_SITE_BASE}`);
    console.log(`New site: ${NEW_SITE_BASE}`);
    console.log(`Comparing ${Object.keys(PAGE_MAPPINGS).length} pages\\n`);
    
    // Compare each page mapping
    for (const [originalPath, newPath] of Object.entries(PAGE_MAPPINGS)) {
      const result = await comparePages(originalPath, newPath, context);
      results.push(result);
      
      // Log immediate results
      if (result.issues && result.issues.length > 0) {
        console.log(`⚠️  Issues found for ${originalPath}:`);
        result.issues.forEach(issue => console.log(`   - ${issue}`));
      } else if (!result.error) {
        console.log(`✅ ${originalPath} - Content matches`);
      }
    }
    
    await context.close();
    
    // Generate summary report
    console.log('\\n📊 COMPARISON SUMMARY\\n');
    console.log('='.repeat(50));
    
    const pagesWithIssues = results.filter(r => r.issues && r.issues.length > 0);
    const pagesWithErrors = results.filter(r => r.error);
    const pagesMatching = results.filter(r => !r.error && (!r.issues || r.issues.length === 0));
    
    console.log(`✅ Pages matching: ${pagesMatching.length}`);
    console.log(`⚠️  Pages with issues: ${pagesWithIssues.length}`);
    console.log(`❌ Pages with errors: ${pagesWithErrors.length}`);
    console.log(`📄 Total pages compared: ${results.length}`);
    
    if (pagesWithIssues.length > 0) {
      console.log('\\n🔍 DETAILED ISSUES:\\n');
      pagesWithIssues.forEach(result => {
        console.log(`\\n📄 ${result.url.original} → ${result.url.new}`);
        result.issues.forEach(issue => console.log(`   • ${issue}`));
        
        if (result.headings?.missing?.length > 0) {
          console.log(`   Missing headings: ${result.headings.missing.join(', ')}`);
        }
        if (result.navigation?.missing?.length > 0) {
          console.log(`   Missing navigation: ${result.navigation.missing.join(', ')}`);
        }
      });
    }
    
    if (pagesWithErrors.length > 0) {
      console.log('\\n❌ PAGES WITH ERRORS:\\n');
      pagesWithErrors.forEach(result => {
        console.log(`   ${result.url.original}: ${result.error}`);
      });
    }
    
    console.log('\\n' + '='.repeat(50));
    
    // Save detailed results to file for further analysis
    const fs = require('fs');
    const detailedReport = {
      timestamp: new Date().toISOString(),
      summary: {
        totalPages: results.length,
        matching: pagesMatching.length,
        issues: pagesWithIssues.length,
        errors: pagesWithErrors.length
      },
      results: results
    };
    
    fs.writeFileSync('site-comparison-report.json', JSON.stringify(detailedReport, null, 2));
    console.log('\\n💾 Detailed report saved to: site-comparison-report.json');
    
    // Test assertions
    expect(pagesWithErrors.length).toBe(0); // No pages should fail to load
    
    // Allow some content differences but flag if too many
    if (pagesWithIssues.length > results.length * 0.3) { // More than 30% of pages have issues
      console.log(`\\n⚠️  Warning: ${pagesWithIssues.length} pages have content differences`);
      console.log('Consider reviewing the detailed report for migration priorities.');
    }
    
    expect(pagesWithIssues.length).toBeLessThan(results.length); // At least some pages should match
  });
  
  test('should verify core page accessibility', async ({ page }) => {
    // Quick accessibility check for key pages
    const keyPages = ['/', '/autorag/', '/quality-assurance/', '/release-management/'];
    
    for (const pagePath of keyPages) {
      await page.goto(NEW_SITE_BASE + pagePath);
      
      // Check for basic accessibility elements
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('main, [role="main"]')).toBeVisible();
      await expect(page.locator('footer')).toBeVisible();
      
      // Check for language attributes
      const htmlLang = await page.locator('html').getAttribute('lang');
      expect(htmlLang).toBeTruthy();
      
      console.log(`✅ ${pagePath} - Basic accessibility check passed`);
    }
  });
});

test.describe('Content Migration Verification', () => {
  test('should verify key sections exist on main pages', async ({ page }) => {
    const pageChecks = {
      '/': {
        sections: ['hero', 'features', 'team', 'signup'],
        headings: ['AI releases', 'Enterprise AI', 'Meet our team']
      },
      '/autorag/': {
        sections: ['hero', 'feature-overview', 'feature-benefits'],
        headings: ['AutoRAG', 'What is AutoRAG', 'Key Benefits']
      },
      '/quality-assurance/': {
        sections: ['hero', 'feature-overview'],
        headings: ['Quality Assurance', 'What is AI Quality Assurance']
      },
      '/release-management/': {
        sections: ['hero', 'feature-overview'],
        headings: ['Release Management', 'What is AI Release Management']
      }
    };
    
    for (const [pagePath, checks] of Object.entries(pageChecks)) {
      await page.goto(NEW_SITE_BASE + pagePath);
      console.log(`\\n🔍 Verifying ${pagePath}...`);
      
      // Check sections exist
      for (const sectionId of checks.sections) {
        const section = page.locator(`#${sectionId}, .${sectionId}, section:has-text("${sectionId}")`);
        await expect(section).toBeVisible();
        console.log(`  ✅ Section found: ${sectionId}`);
      }
      
      // Check key headings exist
      for (const heading of checks.headings) {
        const headingEl = page.locator(`h1, h2, h3`).filter({ hasText: new RegExp(heading, 'i') });
        await expect(headingEl).toBeVisible();
        console.log(`  ✅ Heading found: ${heading}`);
      }
    }
  });
});