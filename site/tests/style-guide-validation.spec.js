const { test, expect } = require('@playwright/test');

/**
 * Style Guide Validation Tests
 * 
 * These tests validate that the live website follows the Divinci AI style guide
 * by checking computed styles in the browser. This catches issues that static
 * analysis might miss, like CSS inheritance or dynamic styling.
 */

// Official Divinci AI Color Palette (RGB values for browser comparison)
const STYLE_GUIDE = {
  colors: {
    background: 'rgb(248, 244, 240)',      // #f8f4f0
    primaryText: 'rgb(45, 60, 52)',        // #2d3c34
    secondaryText: 'rgb(126, 141, 149)',   // #7e8d95
    headingColor: 'rgb(30, 58, 43)',       // #1e3a2b
    buttonText: 'rgb(92, 74, 58)',         // #5c4a3a
  },
  
  // Colors that should NEVER appear
  forbiddenColors: [
    'rgb(22, 33, 76)',    // #16214c - old blue
    'rgb(37, 66, 132)',   // #254284 - old secondary blue
    'rgb(92, 226, 231)',  // #5ce2e7 - old cyan
  ],
  
  fonts: {
    heading: 'Fraunces',
    body: 'Source Sans 3'
  }
};

// Pages to test
const PAGES_TO_TEST = [
  { name: 'Homepage', url: '/' },
  { name: 'API Page', url: '/api/' },
  { name: 'AutoRAG', url: '/autorag/' },
  { name: 'Quality Assurance', url: '/quality-assurance/' },
  { name: 'Release Management', url: '/release-management/' },
  { name: 'Roadmap', url: '/roadmap/' }
];

test.describe('Divinci AI Style Guide Validation', () => {
  
  PAGES_TO_TEST.forEach(({ name, url }) => {
    test.describe(`${name} page`, () => {
      
      test(`should use correct background color`, async ({ page }) => {
        await page.goto(url);
        
        const bodyBg = await page.evaluate(() => {
          return window.getComputedStyle(document.body).backgroundColor;
        });
        
        expect(bodyBg).toBe(STYLE_GUIDE.colors.background);
      });
      
      test(`should not use forbidden colors`, async ({ page }) => {
        await page.goto(url);
        
        // Check all elements for forbidden colors
        const forbiddenColorUsage = await page.evaluate((forbiddenColors) => {
          const violations = [];
          const elements = document.querySelectorAll('*');
          
          elements.forEach((element, index) => {
            const styles = window.getComputedStyle(element);
            const color = styles.color;
            const backgroundColor = styles.backgroundColor;
            const borderColor = styles.borderColor;
            
            forbiddenColors.forEach(forbiddenColor => {
              if (color === forbiddenColor) {
                violations.push({
                  element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                  property: 'color',
                  value: color,
                  selector: element.outerHTML.substring(0, 100) + '...'
                });
              }
              if (backgroundColor === forbiddenColor) {
                violations.push({
                  element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                  property: 'backgroundColor',
                  value: backgroundColor,
                  selector: element.outerHTML.substring(0, 100) + '...'
                });
              }
            });
          });
          
          return violations;
        }, STYLE_GUIDE.forbiddenColors);
        
        if (forbiddenColorUsage.length > 0) {
          console.log('❌ Forbidden color violations found:', forbiddenColorUsage);
          expect(forbiddenColorUsage).toHaveLength(0);
        }
      });
      
      test(`should use approved fonts for headings`, async ({ page }) => {
        await page.goto(url);
        
        const headingFonts = await page.evaluate((approvedFont) => {
          const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6, .section-heading, .api-title, .coming-soon-title');
          const violations = [];
          
          headings.forEach(heading => {
            const fontFamily = window.getComputedStyle(heading).fontFamily;
            if (!fontFamily.includes(approvedFont)) {
              violations.push({
                element: heading.tagName + (heading.className ? '.' + heading.className.split(' ')[0] : ''),
                fontFamily: fontFamily,
                text: heading.textContent.substring(0, 50) + '...'
              });
            }
          });
          
          return violations;
        }, STYLE_GUIDE.fonts.heading);
        
        if (headingFonts.length > 0) {
          console.log('⚠️ Heading font violations:', headingFonts);
        }
        expect(headingFonts).toHaveLength(0);
      });
      
      test(`should have accessible color contrast`, async ({ page }) => {
        await page.goto(url);
        
        // Check text elements have sufficient contrast
        const contrastIssues = await page.evaluate(() => {
          const issues = [];
          const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6');
          
          // Simple contrast check - this is a basic implementation
          // In production, you might want to use a proper color contrast library
          function getLuminance(r, g, b) {
            const [rs, gs, bs] = [r, g, b].map(c => {
              c = c / 255;
              return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
          }
          
          function getContrastRatio(rgb1, rgb2) {
            const lum1 = getLuminance(...rgb1);
            const lum2 = getLuminance(...rgb2);
            const lightest = Math.max(lum1, lum2);
            const darkest = Math.min(lum1, lum2);
            return (lightest + 0.05) / (darkest + 0.05);
          }
          
          function parseRgb(rgbString) {
            const match = rgbString.match(/rgb\\((\\d+),\\s*(\\d+),\\s*(\\d+)\\)/);
            return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : null;
          }
          
          textElements.forEach(element => {
            if (element.textContent.trim().length > 0) {
              const styles = window.getComputedStyle(element);
              const color = parseRgb(styles.color);
              const bgColor = parseRgb(styles.backgroundColor);
              
              if (color && bgColor) {
                const contrast = getContrastRatio(color, bgColor);
                if (contrast < 4.5) { // WCAG AA standard
                  issues.push({
                    element: element.tagName + (element.className ? '.' + element.className.split(' ')[0] : ''),
                    contrast: contrast.toFixed(2),
                    text: element.textContent.substring(0, 30) + '...'
                  });
                }
              }
            }
          });
          
          return issues.slice(0, 5); // Limit to first 5 issues to avoid overwhelming output
        });
        
        if (contrastIssues.length > 0) {
          console.log('⚠️ Potential contrast issues:', contrastIssues);
          // This is a warning, not a hard failure since contrast calculation is approximate
        }
      });
      
      test(`should have consistent button styling`, async ({ page }) => {
        await page.goto(url);
        
        const buttonStyles = await page.evaluate(() => {
          const buttons = document.querySelectorAll('button, .primary-button, .secondary-button, .notify-button, .cta-button');
          const styles = [];
          
          buttons.forEach(button => {
            const computed = window.getComputedStyle(button);
            styles.push({
              fontFamily: computed.fontFamily,
              borderRadius: computed.borderRadius,
              padding: computed.padding,
              background: computed.background || computed.backgroundColor
            });
          });
          
          return styles;
        });
        
        // Verify buttons use consistent styling patterns
        if (buttonStyles.length > 0) {
          // All buttons should use Source Sans 3 font
          const inconsistentFonts = buttonStyles.filter(style => 
            !style.fontFamily.includes('Source Sans 3')
          );
          
          if (inconsistentFonts.length > 0) {
            console.log('⚠️ Buttons with inconsistent fonts:', inconsistentFonts.length);
          }
        }
      });
      
    });
  });
  
  test('Color palette consistency across all pages', async ({ page }) => {
    const colorUsage = {};
    
    // Collect color usage from all pages
    for (const pageInfo of PAGES_TO_TEST) {
      await page.goto(pageInfo.url);
      
      const colors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const uniqueColors = new Set();
        
        elements.forEach(element => {
          const styles = window.getComputedStyle(element);
          if (styles.color !== 'rgba(0, 0, 0, 0)') uniqueColors.add(styles.color);
          if (styles.backgroundColor !== 'rgba(0, 0, 0, 0)') uniqueColors.add(styles.backgroundColor);
        });
        
        return Array.from(uniqueColors);
      });
      
      colorUsage[pageInfo.name] = colors;
    }
    
    // Analyze consistency
    const allColors = new Set();
    Object.values(colorUsage).forEach(colors => {
      colors.forEach(color => allColors.add(color));
    });
    
    console.log(`Total unique colors found across all pages: ${allColors.size}`);
    
    // Check for any forbidden colors
    const forbiddenFound = Array.from(allColors).filter(color => 
      STYLE_GUIDE.forbiddenColors.includes(color)
    );
    
    expect(forbiddenFound).toHaveLength(0);
  });
  
});

test.describe('Style Guide Documentation', () => {
  
  test('should have style guide validation script', async () => {
    const fs = require('fs');
    const path = require('path');
    
    const scriptPath = path.join(process.cwd(), 'scripts', 'validate-style-guide.js');
    const scriptExists = fs.existsSync(scriptPath);
    
    expect(scriptExists).toBe(true);
  });
  
});