/**
 * Crawl the website to identify all pages for accessibility testing
 */
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Base URL of the website
const BASE_URL = 'http://localhost:8080';

// Pages to exclude from crawling (e.g., login pages, admin pages)
const EXCLUDE_PATTERNS = [
  '/admin',
  '/login',
  '/logout',
  '/signup',
  '/register',
  '/account',
  '/dashboard',
  '/api',
  '.pdf',
  '.zip',
  '.jpg',
  '.png',
  '.gif'
];

// Maximum number of pages to crawl
const MAX_PAGES = 100;

// Output file for the list of pages
const OUTPUT_FILE = path.join(__dirname, 'pages-to-test.json');

/**
 * Check if a URL should be excluded from crawling
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL should be excluded
 */
function shouldExclude(url) {
  // Exclude external links
  if (!url.startsWith(BASE_URL)) {
    return true;
  }
  
  // Exclude URLs matching exclude patterns
  for (const pattern of EXCLUDE_PATTERNS) {
    if (url.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Normalize a URL by removing trailing slashes and query parameters
 * @param {string} url - The URL to normalize
 * @returns {string} - The normalized URL
 */
function normalizeUrl(url) {
  // Remove query parameters
  const urlWithoutQuery = url.split('?')[0];
  
  // Remove hash fragments
  const urlWithoutHash = urlWithoutQuery.split('#')[0];
  
  // Remove trailing slash
  return urlWithoutHash.endsWith('/') ? urlWithoutHash.slice(0, -1) : urlWithoutHash;
}

/**
 * Crawl the website and collect all page URLs
 * @returns {Promise<string[]>} - A promise that resolves to an array of page URLs
 */
async function crawlWebsite() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Set a reasonable viewport size
  await page.setViewport({ width: 1280, height: 800 });
  
  // URLs to visit
  const urlsToVisit = [BASE_URL];
  
  // URLs already visited
  const visitedUrls = new Set();
  
  // URLs found but not yet visited
  const foundUrls = new Set([BASE_URL]);
  
  console.log(`Starting crawl from ${BASE_URL}`);
  
  while (urlsToVisit.length > 0 && visitedUrls.size < MAX_PAGES) {
    const url = urlsToVisit.shift();
    const normalizedUrl = normalizeUrl(url);
    
    // Skip if already visited
    if (visitedUrls.has(normalizedUrl)) {
      continue;
    }
    
    console.log(`Visiting ${normalizedUrl} (${visitedUrls.size + 1}/${MAX_PAGES})`);
    
    try {
      // Navigate to the page
      await page.goto(normalizedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Mark as visited
      visitedUrls.add(normalizedUrl);
      
      // Find all links on the page
      const links = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .map(a => a.href)
          .filter(href => href && !href.startsWith('javascript:') && !href.startsWith('mailto:') && !href.startsWith('tel:'));
      });
      
      // Process each link
      for (const link of links) {
        const normalizedLink = normalizeUrl(link);
        
        if (!shouldExclude(normalizedLink) && !visitedUrls.has(normalizedLink) && !foundUrls.has(normalizedLink)) {
          foundUrls.add(normalizedLink);
          urlsToVisit.push(normalizedLink);
        }
      }
    } catch (error) {
      console.error(`Error visiting ${normalizedUrl}: ${error.message}`);
    }
  }
  
  await browser.close();
  
  // Convert Set to Array
  const urlsArray = Array.from(visitedUrls);
  
  console.log(`Crawl complete. Found ${urlsArray.length} pages.`);
  
  return urlsArray;
}

/**
 * Main function
 */
async function main() {
  try {
    const urls = await crawlWebsite();
    
    // Write the URLs to a file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(urls, null, 2));
    
    console.log(`Wrote ${urls.length} URLs to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
