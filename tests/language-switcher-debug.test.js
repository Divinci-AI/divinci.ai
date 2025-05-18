/**
 * Diagnostic Tests for Language Switcher
 *
 * This file contains tests to diagnose issues with the language switcher.
 */

const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  languages: [
    { code: 'en', name: 'English', dir: 'ltr', default: true },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' }
  ],
  baseUrl: 'http://localhost:8001'
};

// Test to diagnose language switcher script loading
test('Diagnose language switcher script loading', async ({ page }) => {
  // Enable console logging
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`);
  });
  
  // Enable request logging
  const requests = [];
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      resourceType: request.resourceType()
    });
  });
  
  // Enable response logging
  const responses = [];
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      ok: response.ok()
    });
  });
  
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the language switcher to be visible
  await page.waitForSelector('.language-switcher');
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/language-switcher-initial.png' });
  
  // Check if the language-switcher.js script was loaded
  const scriptLoaded = requests.some(req => 
    req.url.includes('language-switcher.js') && req.resourceType === 'script'
  );
  
  // Check if the script was loaded successfully
  const scriptLoadedSuccessfully = responses.some(res => 
    res.url.includes('language-switcher.js') && res.ok
  );
  
  // Log the results
  console.log(`Script requested: ${scriptLoaded}`);
  console.log(`Script loaded successfully: ${scriptLoadedSuccessfully}`);
  
  // Check if the global changeLanguage function exists
  const changeLanguageExists = await page.evaluate(() => {
    return typeof window.changeLanguage === 'function';
  });
  
  console.log(`changeLanguage function exists: ${changeLanguageExists}`);
  
  // Save diagnostic information to a file
  const diagnosticInfo = {
    consoleMessages,
    requests: requests.filter(req => req.resourceType === 'script'),
    responses: responses.filter(res => res.url.includes('.js')),
    changeLanguageExists
  };
  
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results', 'language-switcher-diagnostic.json'),
    JSON.stringify(diagnosticInfo, null, 2)
  );
  
  // Try to debug the language switcher
  await page.click('button:has-text("Debug Language Switcher")');
  
  // Take another screenshot
  await page.screenshot({ path: 'test-results/language-switcher-after-debug.png' });
  
  // Try to toggle the dropdown
  await page.click('button:has-text("Toggle Language Dropdown")');
  
  // Take a screenshot of the dropdown
  await page.screenshot({ path: 'test-results/language-switcher-dropdown.png' });
  
  // Check if the dropdown is visible
  const dropdownVisible = await page.isVisible('.language-switcher-dropdown');
  console.log(`Dropdown visible: ${dropdownVisible}`);
  
  // Try to click on the Spanish option
  if (dropdownVisible) {
    await page.click('.language-option[data-lang="es"]');
    
    // Wait a moment and take a screenshot
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/after-language-option-click.png' });
    
    // Check if navigation occurred
    console.log(`Current URL: ${page.url()}`);
  }
});

// Test to check HTML structure and event handlers
test('Check HTML structure and event handlers', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the language switcher to be visible
  await page.waitForSelector('.language-switcher');
  
  // Get the HTML structure of the language switcher
  const languageSwitcherHTML = await page.evaluate(() => {
    const switcher = document.querySelector('.language-switcher');
    return switcher ? switcher.outerHTML : 'Not found';
  });
  
  // Save the HTML structure to a file
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results', 'language-switcher-html.txt'),
    languageSwitcherHTML
  );
  
  // Check if the language options have onclick handlers
  const optionsWithHandlers = await page.evaluate(() => {
    const options = document.querySelectorAll('.language-option');
    return Array.from(options).map(option => ({
      lang: option.getAttribute('data-lang'),
      href: option.getAttribute('href'),
      hasOnClick: option.onclick !== null,
      innerHTML: option.innerHTML
    }));
  });
  
  // Save the options information to a file
  fs.writeFileSync(
    path.join(process.cwd(), 'test-results', 'language-options.json'),
    JSON.stringify(optionsWithHandlers, null, 2)
  );
  
  // Try to manually trigger the onclick handler for Spanish
  const navigationOccurred = await page.evaluate(() => {
    const option = document.querySelector('.language-option[data-lang="es"]');
    if (option && option.onclick) {
      // Save the current URL
      const currentUrl = window.location.href;
      
      // Call the onclick handler
      option.onclick({ preventDefault: () => {} });
      
      // Check if the URL changed
      return window.location.href !== currentUrl;
    }
    return false;
  });
  
  console.log(`Navigation occurred after manual trigger: ${navigationOccurred}`);
  
  // If navigation didn't occur, try direct navigation
  if (!navigationOccurred) {
    await page.goto(`${config.baseUrl}/es/`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/after-manual-trigger.png' });
});

// Test to try alternative navigation methods
test('Try alternative navigation methods', async ({ page }) => {
  // Go to the homepage
  await page.goto(config.baseUrl);
  
  // Wait for the page to load
  await page.waitForSelector('h1');
  
  // Try to navigate using window.location.href
  await page.evaluate(() => {
    window.location.href = '/es/';
  });
  
  // Wait a moment and take a screenshot
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/after-direct-location-change.png' });
  
  // Check if navigation occurred
  console.log(`Current URL after direct location change: ${page.url()}`);
  
  // Go back to the homepage
  await page.goto(config.baseUrl);
  
  // Try to navigate using the Go to Spanish Version button
  await page.click('button:has-text("Go to Spanish Version")');
  
  // Wait a moment and take a screenshot
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/after-spanish-button-click.png' });
  
  // Check if navigation occurred
  console.log(`Current URL after Spanish button click: ${page.url()}`);
});
