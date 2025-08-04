const { test, expect } = require('@playwright/test');

/**
 * Comprehensive style guide compliance test for Divinci AI website
 * 
 * This test ensures all pages follow the Renaissance-inspired design system with:
 * - Primary font color: #2d3c34 (dark green-gray)
 * - Primary tan/beige backgrounds: rgb(248, 244, 240), rgb(240, 235, 225)
 * - Accent tan colors: #8b7659, #a6946b 
 * - Light blue accents: #cfdcff (from homepage buttons)
 * - Secondary dark green text: #1e3a2b (from homepage)
 * - No unauthorized deep blue colors: #16214c, #254284, #5ce2e7
 */

// Define the approved color palette
const APPROVED_COLORS = {
  // Renaissance tan/beige theme
  backgrounds: [
    'rgb(248, 244, 240)', 
    'rgb(240, 235, 225)',
    '#f8f4f0',
    'rgba(139, 118, 89, 0.05)',
    'rgba(139, 118, 89, 0.15)',
    'rgba(139, 118, 89, 0.25)',
    'rgba(166, 148, 107, 0.05)'
  ],
  
  // Tan accent colors
  tans: [
    '#8b7659',
    '#a6946b', 
    '#7a6847',
    'rgba(139, 118, 89, 0.1)',
    'rgba(139, 118, 89, 0.2)',
    'rgba(139, 118, 89, 0.3)',
    'rgba(166, 148, 107, 0.1)',
    'rgba(166, 148, 107, 0.2)',
    'rgba(166, 148, 107, 0.3)'
  ],
  
  // Homepage light blue (approved)
  lightBlue: [
    '#cfdcff'
  ],
  
  // Primary font color (required)
  primaryFont: [
    '#2d3c34',
    'rgb(45, 60, 52)',
    'rgba(45, 60, 52, 1)',
    'rgba(45, 60, 52, 0.9)',
    'rgba(45, 60, 52, 0.8)'
  ],
  
  // Secondary dark greens (approved)
  darkGreens: [
    '#1e3a2b',
    '#2d5a4f',
    'rgba(30, 58, 43, 0.8)',
    'rgba(30, 58, 43, 0.9)',
    'rgba(45, 90, 79, 0.8)'
  ],
  
  // Standard neutral colors (always allowed)
  neutrals: [
    '#ffffff',
    '#fff',
    'white',
    '#000000',
    '#000',
    'black',
    '#444',
    '#666',
    '#888',
    '#999',
    '#aaa',
    '#ccc',
    '#ddd',
    '#eee',
    '#f5f5f5',
    '#f9f9f9',
    'transparent',
    'rgba(0, 0, 0, 0)',
    'rgba(255, 255, 255, 0)'
  ]
};

// Forbidden colors that should not appear
const FORBIDDEN_COLORS = [
  '#16214c', // Deep blue
  '#254284', // Medium blue  
  '#5ce2e7', // Cyan
  'rgb(22, 33, 76)', // Deep blue RGB
  'rgb(37, 66, 132)', // Medium blue RGB
  'rgb(92, 226, 231)' // Cyan RGB
];

// Pages to test
const PAGES_TO_TEST = [
  '/',
  '/autorag',
  '/quality-assurance', 
  '/release-management',
  '/ai-safety',
  '/careers',
  '/about',
  '/contact',
  '/pricing',
  '/tutorials',
  '/docs',
  '/changelog',
  '/press',
  '/support'
];

/**
 * Extract all color values from computed styles
 */
async function extractColorsFromElement(page, selector) {
  return await page.evaluate((sel) => {
    const elements = document.querySelectorAll(sel);
    const colors = new Set();
    
    elements.forEach(el => {
      const computed = window.getComputedStyle(el);
      
      // Extract colors from various CSS properties
      const colorProps = [
        'color', 'background-color', 'border-color', 
        'border-top-color', 'border-right-color', 
        'border-bottom-color', 'border-left-color',
        'box-shadow', 'text-shadow', 'outline-color'
      ];
      
      colorProps.forEach(prop => {
        const value = computed.getPropertyValue(prop);
        if (value && value !== 'none' && value !== 'initial' && value !== 'inherit') {
          // Extract color values from complex properties like box-shadow
          const colorMatches = value.match(/rgb\([^)]+\)|rgba\([^)]+\)|#[0-9a-fA-F]{3,6}|[a-zA-Z]+/g);
          if (colorMatches) {
            colorMatches.forEach(color => {
              colors.add(color.trim());
            });
          } else {
            colors.add(value.trim());
          }
        }
      });
      
      // Check background-image for gradients
      const bgImage = computed.getPropertyValue('background-image');
      if (bgImage && bgImage.includes('gradient')) {
        const gradientColors = bgImage.match(/rgb\([^)]+\)|rgba\([^)]+\)|#[0-9a-fA-F]{3,6}/g);
        if (gradientColors) {
          gradientColors.forEach(color => colors.add(color.trim()));
        }
      }
    });
    
    return Array.from(colors);
  }, selector);
}

/**
 * Check if a color is in the approved palette
 */
function isColorApproved(color) {
  // Normalize color for comparison
  const normalizedColor = color.toLowerCase().trim();
  
  // Check all approved color categories
  const allApprovedColors = [
    ...APPROVED_COLORS.backgrounds,
    ...APPROVED_COLORS.tans,
    ...APPROVED_COLORS.lightBlue,
    ...APPROVED_COLORS.primaryFont,
    ...APPROVED_COLORS.darkGreens,
    ...APPROVED_COLORS.neutrals
  ];
  
  return allApprovedColors.some(approvedColor => {
    const normalizedApproved = approvedColor.toLowerCase().trim();
    
    // Exact match
    if (normalizedColor === normalizedApproved) return true;
    
    // Handle rgba/rgb variations
    if (normalizedColor.startsWith('rgb') && normalizedApproved.startsWith('rgb')) {
      // Extract numbers for comparison
      const colorNums = normalizedColor.match(/[\d.]+/g);
      const approvedNums = normalizedApproved.match(/[\d.]+/g);
      if (colorNums && approvedNums && colorNums.length >= 3 && approvedNums.length >= 3) {
        // Compare RGB values with small tolerance for rounding
        const tolerance = 2;
        const rMatch = Math.abs(parseInt(colorNums[0]) - parseInt(approvedNums[0])) <= tolerance;
        const gMatch = Math.abs(parseInt(colorNums[1]) - parseInt(approvedNums[1])) <= tolerance;
        const bMatch = Math.abs(parseInt(colorNums[2]) - parseInt(approvedNums[2])) <= tolerance;
        if (rMatch && gMatch && bMatch) return true;
      }
    }
    
    return false;
  });
}

/**
 * Check if a color is specifically forbidden
 */
function isColorForbidden(color) {
  const normalizedColor = color.toLowerCase().trim();
  return FORBIDDEN_COLORS.some(forbidden => {
    const normalizedForbidden = forbidden.toLowerCase().trim();
    return normalizedColor === normalizedForbidden || 
           normalizedColor.includes(normalizedForbidden);
  });
}

test.describe('Style Guide Compliance', () => {
  PAGES_TO_TEST.forEach(pagePath => {
    test(`${pagePath} follows Renaissance design system`, async ({ page }) => {
      // Navigate to page
      await page.goto(pagePath);
      
      // Wait for page to fully load
      await page.waitForLoadState('networkidle');
      
      // Extract colors from all visible elements
      const allColors = await extractColorsFromElement(page, '*');
      
      // Filter out obviously transparent/empty values
      const meaningfulColors = allColors.filter(color => 
        color && 
        color !== 'rgba(0, 0, 0, 0)' && 
        color !== 'rgba(255, 255, 255, 0)' &&
        !color.includes('0, 0, 0, 0') &&
        !color.includes('255, 255, 255, 0')
      );
      
      // Track violations
      const violations = [];
      const forbiddenColorsFound = [];
      
      meaningfulColors.forEach(color => {
        // Check for forbidden colors first
        if (isColorForbidden(color)) {
          forbiddenColorsFound.push(color);
        }
        // Then check if it's approved
        else if (!isColorApproved(color)) {
          violations.push(color);
        }
      });
      
      // Report forbidden colors (these are critical failures)
      if (forbiddenColorsFound.length > 0) {
        console.log(`❌ CRITICAL: Forbidden colors found on ${pagePath}:`, forbiddenColorsFound);
        expect(forbiddenColorsFound).toHaveLength(0, 
          `Found forbidden deep blue/cyan colors on ${pagePath}: ${forbiddenColorsFound.join(', ')}. These must be replaced with approved Renaissance tan colors.`
        );
      }
      
      // Report unapproved colors (these are warnings but may be acceptable)
      if (violations.length > 0) {
        console.log(`⚠️  Unapproved colors on ${pagePath}:`, violations);
        console.log(`📋 Page ${pagePath} uses ${violations.length} colors not in approved palette. Review if these should be added to approved colors or replaced.`);
      }
      
      // Log approved colors for reference
      const approvedColorsUsed = meaningfulColors.filter(color => 
        isColorApproved(color) && !isColorForbidden(color)
      );
      console.log(`✅ ${pagePath} uses ${approvedColorsUsed.length} approved colors:`, [...new Set(approvedColorsUsed)]);
    });
  });
  
  test('Homepage contains required brand colors', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Extract colors from homepage
    const allColors = await extractColorsFromElement(page, '*');
    
    // Check for presence of key brand colors
    const hasLightBlue = allColors.some(color => 
      color.toLowerCase().includes('cfdcff') || 
      color.toLowerCase().includes('207, 220, 255')
    );
    
    const hasDarkGreen = allColors.some(color => 
      color.toLowerCase().includes('2d3c34') || 
      color.toLowerCase().includes('1e3a2b') ||
      color.includes('45, 60, 52') ||
      color.includes('30, 58, 43')
    );
    
    const hasTanColors = allColors.some(color => 
      color.toLowerCase().includes('8b7659') ||
      color.toLowerCase().includes('a6946b') ||
      color.includes('139, 118, 89') ||
      color.includes('166, 148, 107')
    );
    
    // Verify brand colors are present
    expect(hasLightBlue, 'Homepage should contain light blue accent color #cfdcff').toBe(true);
    expect(hasDarkGreen, 'Homepage should contain dark green text colors').toBe(true);
    expect(hasTanColors, 'Homepage should contain Renaissance tan accent colors').toBe(true);
    
    console.log('✅ Homepage contains all required brand colors');
  });
  
  test('All pages use primary font color #2d3c34', async ({ page }) => {
    for (const pagePath of PAGES_TO_TEST) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Check if the primary font color is being used
      const usesPrimaryFont = await page.evaluate(() => {
        const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, li, td, th, label, a');
        let foundPrimaryFont = false;
        
        elements.forEach(el => {
          const computed = window.getComputedStyle(el);
          const color = computed.getPropertyValue('color');
          
          // Check for primary font color #2d3c34 in various formats
          if (color.includes('45, 60, 52') || 
              color.toLowerCase().includes('2d3c34') ||
              color === 'rgb(45, 60, 52)') {
            foundPrimaryFont = true;
          }
        });
        
        return foundPrimaryFont;
      });
      
      expect(usesPrimaryFont, 
        `Page ${pagePath} should use primary font color #2d3c34 (rgb(45, 60, 52)) for text elements`
      ).toBe(true);
      
      console.log(`✅ ${pagePath} uses primary font color #2d3c34`);
    }
  });
  
  test('No pages use deprecated blue color scheme', async ({ page }) => {
    for (const pagePath of PAGES_TO_TEST) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      
      // Look specifically for the old blue color scheme
      const deprecatedColors = await page.evaluate(() => {
        const elements = document.querySelectorAll('*');
        const deprecated = [];
        
        elements.forEach(el => {
          const computed = window.getComputedStyle(el);
          const allStyles = [
            computed.color,
            computed.backgroundColor,
            computed.borderColor,
            computed.backgroundImage
          ].join(' ');
          
          // Check for old color scheme
          if (allStyles.includes('16214c') || 
              allStyles.includes('254284') || 
              allStyles.includes('5ce2e7') ||
              allStyles.includes('22, 33, 76') ||
              allStyles.includes('37, 66, 132') ||
              allStyles.includes('92, 226, 231')) {
            deprecated.push({
              element: el.tagName + (el.className ? '.' + el.className.split(' ')[0] : ''),
              color: allStyles
            });
          }
        });
        
        return deprecated;
      });
      
      if (deprecatedColors.length > 0) {
        console.log(`❌ Found deprecated blue colors on ${pagePath}:`, deprecatedColors);
        expect(deprecatedColors).toHaveLength(0, 
          `Page ${pagePath} still uses deprecated blue color scheme. Found: ${JSON.stringify(deprecatedColors)}`
        );
      }
    }
    
    console.log('✅ All pages have migrated from deprecated blue color scheme');
  });
});