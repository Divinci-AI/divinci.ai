const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Test French
  console.log('Testing French...');
  await page.goto('http://127.0.0.1:1111/fr/');
  const frenchTitle = await page.textContent('h1');
  console.log('French title:', frenchTitle);
  
  // Test Arabic
  console.log('\nTesting Arabic...');
  await page.goto('http://127.0.0.1:1111/ar/');
  const arabicTitle = await page.textContent('h1');
  console.log('Arabic title:', arabicTitle);
  
  // Test Russian
  console.log('\nTesting Russian...');
  await page.goto('http://127.0.0.1:1111/ru/');
  const russianTitle = await page.textContent('h1');
  console.log('Russian title:', russianTitle);
  
  // Test Hindi
  console.log('\nTesting Hindi...');
  await page.goto('http://127.0.0.1:1111/hi/');
  const hindiTitle = await page.textContent('h1');
  console.log('Hindi title:', hindiTitle);
  
  await browser.close();
})();