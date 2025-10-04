#!/usr/bin/env node

/**
 * Test Setup Validator
 * 
 * This script validates that all test suites and development hooks are properly configured.
 * Run this to ensure your development environment is ready for the Divinci AI project.
 * 
 * Usage: node scripts/validate-test-setup.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestSetupValidator {
  constructor() {
    this.results = [];
    this.errors = [];
  }

  log(message, status = 'info') {
    const symbols = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    console.log(`${symbols[status]} ${message}`);
    this.results.push({ message, status });
  }

  async validate() {
    console.log('🔍 Divinci AI Test Setup Validator');
    console.log('==================================\n');

    try {
      await this.checkDependencies();
      await this.checkUnitTests();
      await this.checkStyleGuideValidation();
      await this.checkPreCommitHooks();
      await this.checkTestScripts();
      await this.checkPlaywrightSetup();
      await this.printSummary();
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'error');
      return false;
    }

    return this.errors.length === 0;
  }

  async checkDependencies() {
    this.log('Checking dependencies...', 'info');
    
    try {
      // Check package.json exists
      const packagePath = path.join(process.cwd(), 'package.json');
      if (!fs.existsSync(packagePath)) {
        throw new Error('package.json not found');
      }
      
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check required dependencies
      const requiredDeps = ['@playwright/test', 'jest', 'glob'];
      const missingDeps = requiredDeps.filter(dep => 
        !pkg.dependencies?.[dep] && !pkg.devDependencies?.[dep]
      );
      
      if (missingDeps.length > 0) {
        this.log(`Missing dependencies: ${missingDeps.join(', ')}`, 'error');
        this.errors.push('dependencies');
      } else {
        this.log('All required dependencies found', 'success');
      }
      
    } catch (error) {
      this.log(`Dependency check failed: ${error.message}`, 'error');
      this.errors.push('dependencies');
    }
  }

  async checkUnitTests() {
    this.log('Checking unit tests...', 'info');
    
    try {
      const output = execSync('npm run test:unit:jest', { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000
      });
      
      if (output.includes('passed')) {
        this.log('Unit tests passing', 'success');
      } else {
        this.log('Unit tests may have issues', 'warning');
      }
      
    } catch (error) {
      this.log(`Unit test check failed: ${error.message}`, 'error');
      this.errors.push('unit-tests');
    }
  }

  async checkStyleGuideValidation() {
    this.log('Checking style guide validation...', 'info');
    
    try {
      // Check if validation script exists
      const scriptPath = path.join(process.cwd(), 'scripts', 'validate-style-guide.js');
      if (!fs.existsSync(scriptPath)) {
        throw new Error('Style guide validation script not found');
      }
      
      // Run quick validation check
      const output = execSync('node scripts/validate-style-guide.js', { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 60000
      });
      
      if (output.includes('Files checked:')) {
        this.log('Style guide validator working', 'success');
      } else {
        this.log('Style guide validator may have issues', 'warning');
      }
      
    } catch (error) {
      this.log(`Style guide validation failed: ${error.message}`, 'error');
      this.errors.push('style-guide');
    }
  }

  async checkPreCommitHooks() {
    this.log('Checking pre-commit hooks configuration...', 'info');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const preCommitScript = pkg.scripts?.['pre-commit'];
      const prePushScript = pkg.scripts?.['pre-push'];
      
      if (!preCommitScript) {
        this.log('Pre-commit hook not configured', 'error');
        this.errors.push('pre-commit');
      } else if (preCommitScript.includes('test:unit:jest') && preCommitScript.includes('style:validate')) {
        this.log('Pre-commit hook properly configured', 'success');
      } else {
        this.log('Pre-commit hook configuration may be incomplete', 'warning');
      }
      
      if (!prePushScript) {
        this.log('Pre-push hook not configured', 'error');
        this.errors.push('pre-push');
      } else if (prePushScript.includes('test') && prePushScript.includes('style')) {
        this.log('Pre-push hook properly configured', 'success');
      } else {
        this.log('Pre-push hook configuration may be incomplete', 'warning');
      }
      
    } catch (error) {
      this.log(`Hook configuration check failed: ${error.message}`, 'error');
      this.errors.push('hooks');
    }
  }

  async checkTestScripts() {
    this.log('Checking test scripts...', 'info');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      const requiredScripts = [
        'test:unit:jest',
        'style:validate',
        'style:test',
        'style:check'
      ];
      
      const missingScripts = requiredScripts.filter(script => !pkg.scripts?.[script]);
      
      if (missingScripts.length > 0) {
        this.log(`Missing test scripts: ${missingScripts.join(', ')}`, 'error');
        this.errors.push('test-scripts');
      } else {
        this.log('All required test scripts found', 'success');
      }
      
    } catch (error) {
      this.log(`Test script check failed: ${error.message}`, 'error');
      this.errors.push('test-scripts');
    }
  }

  async checkPlaywrightSetup() {
    this.log('Checking Playwright setup...', 'info');
    
    try {
      // Check if playwright config exists
      const configPath = path.join(process.cwd(), 'playwright.config.js');
      if (!fs.existsSync(configPath)) {
        throw new Error('playwright.config.js not found');
      }
      
      // Check if test files exist
      const testDir = path.join(process.cwd(), 'tests');
      if (!fs.existsSync(testDir)) {
        throw new Error('tests directory not found');
      }
      
      const testFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.spec.js'));
      
      if (testFiles.length === 0) {
        this.log('No Playwright test files found', 'warning');
      } else {
        this.log(`Found ${testFiles.length} Playwright test files`, 'success');
      }
      
    } catch (error) {
      this.log(`Playwright setup check failed: ${error.message}`, 'error');
      this.errors.push('playwright');
    }
  }

  async printSummary() {
    console.log('\n📊 Validation Summary');
    console.log('====================');
    
    const successCount = this.results.filter(r => r.status === 'success').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`✅ Successful checks: ${successCount}`);
    console.log(`❌ Failed checks: ${errorCount}`);
    console.log(`⚠️  Warnings: ${warningCount}`);
    
    if (this.errors.length === 0) {
      console.log('\n🎉 Your test setup is properly configured!');
      console.log('\nQuick commands to try:');
      console.log('  npm run test:unit:jest     # Run unit tests');
      console.log('  npm run style:validate     # Check style guide compliance');
      console.log('  npm run style:check        # Full style validation');
    } else {
      console.log('\n⚠️  Some issues need attention:');
      this.errors.forEach(error => {
        console.log(`  - ${error}`);
      });
      
      console.log('\nNext steps:');
      console.log('  1. Fix the issues listed above');
      console.log('  2. Run this validator again');
      console.log('  3. Check package.json scripts for missing configurations');
    }
    
    console.log('\n📖 For more information, see:');
    console.log('  - STYLE-GUIDE.md for style guide details');
    console.log('  - tests/ directory for test examples');
    console.log('  - package.json for all available scripts');
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  const validator = new TestSetupValidator();
  validator.validate().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = TestSetupValidator;