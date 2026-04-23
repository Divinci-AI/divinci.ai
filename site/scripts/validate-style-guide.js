#!/usr/bin/env node

/**
 * Divinci AI Style Guide Validator
 * 
 * This script validates that all content files follow the official Divinci AI style guide.
 * It checks for:
 * - Correct color usage (tan/beige and dark blue-green palette)
 * - Proper font family declarations
 * - Consistent styling patterns
 * 
 * Usage: node scripts/validate-style-guide.js
 * Exit codes: 0 = success, 1 = violations found
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Official Divinci AI Color Palette
const APPROVED_COLORS = {
  // Primary colors
  background: '#f8f4f0',           // tan/beige background
  primaryText: '#2d3c34',          // dark blue-green text
  secondaryText: '#7e8d95',        // muted blue-gray
  headingColor: '#1e3a2b',         // darker blue-green for headings
  
  // Button colors
  buttonGradientStart: '#f5f0e6',  // tan gradient start
  buttonGradientEnd: '#e8ddc7',    // tan gradient end
  buttonText: '#5c4a3a',           // brown button text
  
  // Accent colors (allowed in small doses)
  accentBorder: '#d4c4a0',         // tan border
  lightAccent: '#cfdcff',          // very light blue (for special cases)
  
  // Transparency versions (rgba equivalents are allowed)
  primaryTextRgba: 'rgba(45, 60, 52',     // #2d3c34 in rgba format
  headingColorRgba: 'rgba(30, 58, 43',    // #1e3a2b in rgba format
  secondaryTextRgba: 'rgba(126, 141, 149' // #7e8d95 in rgba format
};

// Colors that should NEVER appear (old blue palette)
const FORBIDDEN_COLORS = [
  '#16214c',  // old primary blue
  '#254284',  // old secondary blue
  '#5ce2e7',  // old cyan accent
  'rgba(22, 33, 76',    // old blue in rgba
  'rgba(37, 66, 132',   // old secondary blue in rgba
  'rgba(92, 226, 231'   // old cyan in rgba
];

// Required font families
const APPROVED_FONTS = [
  "'Fraunces', serif",           // For headings
  "'Source Sans 3', sans-serif"  // For body text
];

class StyleGuideValidator {
  constructor() {
    this.violations = [];
    this.warnings = [];
    this.filesChecked = 0;
  }

  /**
   * Main validation function
   */
  async validate() {
    console.log('🎨 Divinci AI Style Guide Validator');
    console.log('====================================\n');

    // Find all content files
    const contentFiles = glob.sync('content/**/*.md', { cwd: process.cwd() });
    const templateFiles = glob.sync('templates/**/*.html', { cwd: process.cwd() });
    const cssFiles = glob.sync('static/css/**/*.css', { cwd: process.cwd() });

    console.log(`📁 Found ${contentFiles.length} content files`);
    console.log(`📁 Found ${templateFiles.length} template files`);
    console.log(`📁 Found ${cssFiles.length} CSS files\n`);

    // Validate each file type
    for (const file of contentFiles) {
      await this.validateFile(file, 'content');
    }
    
    for (const file of templateFiles) {
      await this.validateFile(file, 'template');
    }
    
    for (const file of cssFiles) {
      await this.validateFile(file, 'css');
    }

    this.printResults();
    return this.violations.length === 0;
  }

  /**
   * Validate a single file
   */
  async validateFile(filePath, fileType) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      this.filesChecked++;

      // Check for forbidden colors
      this.checkForbiddenColors(filePath, content);
      
      // Check for proper font usage (in content and template files)
      if (fileType === 'content' || fileType === 'template') {
        this.checkFontUsage(filePath, content);
      }
      
      // Check for style consistency
      this.checkStyleConsistency(filePath, content);
      
      // Check for missing approved colors in styled content
      if (this.hasCustomStyles(content)) {
        this.checkApprovedColorUsage(filePath, content);
      }

    } catch (error) {
      this.addViolation(filePath, 'FILE_READ_ERROR', `Failed to read file: ${error.message}`);
    }
  }

  /**
   * Check for forbidden colors
   */
  checkForbiddenColors(filePath, content) {
    FORBIDDEN_COLORS.forEach(color => {
      const regex = new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = content.match(regex);
      
      if (matches) {
        this.addViolation(
          filePath, 
          'FORBIDDEN_COLOR', 
          `Found forbidden color "${color}" (${matches.length} occurrence${matches.length > 1 ? 's' : ''})`
        );
      }
    });
  }

  /**
   * Check for proper font family usage
   */
  checkFontUsage(filePath, content) {
    // Look for font-family declarations
    const fontFamilyRegex = /font-family\s*:\s*([^;]+)/gi;
    const matches = [...content.matchAll(fontFamilyRegex)];
    
    matches.forEach(match => {
      const fontDeclaration = match[1].trim();
      const isApproved = APPROVED_FONTS.some(font => 
        fontDeclaration.includes(font.replace(/'/g, ''))
      );
      
      if (!isApproved && !this.isGenericFont(fontDeclaration)) {
        this.addWarning(
          filePath,
          'UNAPPROVED_FONT',
          `Font family "${fontDeclaration}" is not in the approved list. Use 'Fraunces' for headings or 'Source Sans 3' for body text.`
        );
      }
    });
  }

  /**
   * Check if font is a generic fallback
   */
  isGenericFont(fontDeclaration) {
    const genericFonts = ['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'];
    return genericFonts.some(generic => fontDeclaration.toLowerCase().includes(generic));
  }

  /**
   * Check for consistent styling patterns
   */
  checkStyleConsistency(filePath, content) {
    // Check for inconsistent gradient patterns
    const gradientRegex = /linear-gradient\([^)]+\)/gi;
    const gradients = [...content.matchAll(gradientRegex)];
    
    gradients.forEach(match => {
      const gradient = match[0];
      if (gradient.includes('#') && !this.isApprovedGradient(gradient)) {
        this.addWarning(
          filePath,
          'INCONSISTENT_GRADIENT',
          `Gradient may not follow style guide: ${gradient}`
        );
      }
    });
  }

  /**
   * Check if gradient uses approved colors
   */
  isApprovedGradient(gradient) {
    const approvedGradients = [
      APPROVED_COLORS.buttonGradientStart,
      APPROVED_COLORS.buttonGradientEnd,
      APPROVED_COLORS.primaryText,
      APPROVED_COLORS.headingColor
    ];
    
    return approvedGradients.some(color => gradient.includes(color));
  }

  /**
   * Check if file has custom styles
   */
  hasCustomStyles(content) {
    return content.includes('<style>') || content.includes('color:') || content.includes('background:');
  }

  /**
   * Check for approved color usage
   */
  checkApprovedColorUsage(filePath, content) {
    // This is a positive check - ensuring styled content uses approved colors
    const hasStyles = content.includes('<style>');
    const hasInlineStyles = /style\s*=\s*"[^"]*color:/i.test(content);
    
    if (hasStyles || hasInlineStyles) {
      // Check if it uses any approved colors
      const usesApprovedColors = Object.values(APPROVED_COLORS).some(color => 
        content.includes(color)
      );
      
      if (!usesApprovedColors) {
        this.addWarning(
          filePath,
          'NO_APPROVED_COLORS',
          'File contains custom styling but does not use any approved colors from the style guide'
        );
      }
    }
  }

  /**
   * Add a violation (critical error)
   */
  addViolation(filePath, type, message) {
    this.violations.push({ filePath, type, message, severity: 'error' });
  }

  /**
   * Add a warning (non-critical)
   */
  addWarning(filePath, type, message) {
    this.warnings.push({ filePath, type, message, severity: 'warning' });
  }

  /**
   * Print validation results
   */
  printResults() {
    console.log(`\n📊 Validation Results`);
    console.log(`=====================`);
    console.log(`Files checked: ${this.filesChecked}`);
    console.log(`Violations: ${this.violations.length}`);
    console.log(`Warnings: ${this.warnings.length}\n`);

    if (this.violations.length > 0) {
      console.log('❌ VIOLATIONS (must be fixed):');
      this.violations.forEach(violation => {
        console.log(`   ${violation.filePath}`);
        console.log(`   └─ [${violation.type}] ${violation.message}\n`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS (should be reviewed):');
      this.warnings.forEach(warning => {
        console.log(`   ${warning.filePath}`);
        console.log(`   └─ [${warning.type}] ${warning.message}\n`);
      });
    }

    if (this.violations.length === 0 && this.warnings.length === 0) {
      console.log('✅ All files pass style guide validation!');
    }

    // Print style guide summary
    console.log('\n📋 Style Guide Summary:');
    console.log('====================');
    console.log('Approved Colors:');
    Object.entries(APPROVED_COLORS).forEach(([name, color]) => {
      console.log(`  ${name}: ${color}`);
    });
    console.log('\nApproved Fonts:');
    APPROVED_FONTS.forEach(font => {
      console.log(`  ${font}`);
    });
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new StyleGuideValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = StyleGuideValidator;