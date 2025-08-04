/**
 * Test Suite Validator
 * Validates the entire E2E test infrastructure before deployment
 */

const fs = require('fs');
const path = require('path');

class TestSuiteValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
  }

  // Validate test file structure
  validateTestStructure() {
    const testDir = path.join(__dirname, '..');
    const requiredFiles = [
      'new-divinci-site.spec.js',
      'comprehensive-navigation-test.spec.js',
      'comprehensive-site-navigation.spec.js',
      'responsive-mobile.spec.js',
      'comprehensive-mobile-visual.spec.js',
      'mobile-navigation-comprehensive.spec.js',
      'visual-regression.spec.js',
      'accessibility-compliance.spec.js',
      'language-health-check.spec.js',
      'form-functionality.spec.js',
      'performance-assets.spec.js'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(testDir, file);
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Required test file missing: ${file}`);
        this.results.failed++;
      } else {
        this.results.passed++;
      }
    });
  }

  // Validate configuration files
  validateConfigurations() {
    const configFiles = [
      { file: '../../playwright.config.js', required: true },
      { file: '../../unit-tests.config.js', required: true },
      { file: '../../package.json', required: true }
    ];

    configFiles.forEach(({ file, required }) => {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        if (required) {
          this.errors.push(`Required configuration file missing: ${file}`);
          this.results.failed++;
        } else {
          this.warnings.push(`Optional configuration file missing: ${file}`);
          this.results.warnings++;
        }
      } else {
        this.results.passed++;
      }
    });
  }

  // Validate package.json test scripts
  validateTestScripts() {
    const packageJsonPath = path.join(__dirname, '../../package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      this.errors.push('package.json not found');
      this.results.failed++;
      return;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const requiredScripts = [
        'test',
        'test:mobile',
        'test:visual',
        'test:accessibility',
        'test:performance'
      ];

      const scripts = packageJson.scripts || {};

      requiredScripts.forEach(script => {
        if (!scripts[script]) {
          this.warnings.push(`Recommended script missing: ${script}`);
          this.results.warnings++;
        } else {
          this.results.passed++;
        }
      });

      // Validate Playwright dependency
      const devDeps = packageJson.devDependencies || {};
      if (!devDeps['@playwright/test']) {
        this.errors.push('Playwright test dependency missing');
        this.results.failed++;
      } else {
        this.results.passed++;
      }

    } catch (error) {
      this.errors.push(`Error reading package.json: ${error.message}`);
      this.results.failed++;
    }
  }

  // Validate directory structure
  validateDirectoryStructure() {
    const requiredDirs = [
      '../../tests',
      '../../tests/unit',
      '../../test-results'
    ];

    requiredDirs.forEach(dir => {
      const dirPath = path.join(__dirname, dir);
      if (!fs.existsSync(dirPath)) {
        // Try to create the directory
        try {
          fs.mkdirSync(dirPath, { recursive: true });
          this.warnings.push(`Created missing directory: ${dir}`);
          this.results.warnings++;
        } catch (error) {
          this.errors.push(`Cannot create required directory: ${dir}`);
          this.results.failed++;
        }
      } else {
        this.results.passed++;
      }
    });
  }

  // Validate test naming conventions
  validateNamingConventions() {
    const testDir = path.join(__dirname, '..');
    
    try {
      const files = fs.readdirSync(testDir);
      const testFiles = files.filter(file => file.endsWith('.spec.js') || file.endsWith('.test.js'));

      testFiles.forEach(file => {
        // Check naming convention
        if (!file.match(/^[a-z0-9-]+\.(spec|test)\.js$/)) {
          this.warnings.push(`File doesn't follow naming convention: ${file}`);
          this.results.warnings++;
        } else {
          this.results.passed++;
        }

        // Check for spaces in filename
        if (file.includes(' ')) {
          this.errors.push(`Filename contains spaces: ${file}`);
          this.results.failed++;
        }
      });
    } catch (error) {
      this.errors.push(`Error reading test directory: ${error.message}`);
      this.results.failed++;
    }
  }

  // Validate Playwright configuration
  validatePlaywrightConfig() {
    const configPath = path.join(__dirname, '../../playwright.config.js');
    
    if (!fs.existsSync(configPath)) {
      this.errors.push('playwright.config.js not found');
      this.results.failed++;
      return;
    }

    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      // Check for required configuration sections
      const requiredSections = [
        'testDir',
        'use',
        'projects',
        'expect',
        'webServer'
      ];

      requiredSections.forEach(section => {
        if (!configContent.includes(section)) {
          this.warnings.push(`Playwright config missing section: ${section}`);
          this.results.warnings++;
        } else {
          this.results.passed++;
        }
      });

      // Check for mobile projects
      if (!configContent.includes('Mobile-Chrome') || !configContent.includes('Mobile-Safari')) {
        this.warnings.push('Mobile browser projects may be missing');
        this.results.warnings++;
      } else {
        this.results.passed++;
      }

      // Check for visual testing projects
      if (!configContent.includes('Visual-Desktop') || !configContent.includes('Visual-Mobile')) {
        this.warnings.push('Visual testing projects may be missing');
        this.results.warnings++;
      } else {
        this.results.passed++;
      }

    } catch (error) {
      this.errors.push(`Error reading Playwright config: ${error.message}`);
      this.results.failed++;
    }
  }

  // Run all validations
  async validate() {
    console.log('🔍 Validating E2E test infrastructure...\n');

    this.validateTestStructure();
    this.validateConfigurations();
    this.validateTestScripts();
    this.validateDirectoryStructure();
    this.validateNamingConventions();
    this.validatePlaywrightConfig();

    return this.generateReport();
  }

  // Generate validation report
  generateReport() {
    const total = this.results.passed + this.results.failed + this.results.warnings;
    
    console.log('📊 VALIDATION RESULTS');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`⚠️  Warnings: ${this.results.warnings}`);
    console.log(`📈 Total: ${total}`);
    console.log('');

    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      this.errors.forEach(error => console.log(`   - ${error}`));
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      this.warnings.forEach(warning => console.log(`   - ${warning}`));
      console.log('');
    }

    const success = this.results.failed === 0;
    const passRate = total > 0 ? Math.round((this.results.passed / total) * 100) : 0;

    if (success) {
      console.log('🎉 All critical validations passed!');
      console.log(`📊 Success rate: ${passRate}%`);
      
      if (this.results.warnings === 0) {
        console.log('✨ Perfect score - ready for deployment!');
      } else {
        console.log('📝 Some warnings found - consider addressing before deployment');
      }
    } else {
      console.log('💥 Validation failed!');
      console.log(`📊 Success rate: ${passRate}%`);
      console.log('🔧 Please fix the errors above before proceeding with deployment');
    }

    return {
      success,
      passRate,
      errors: this.errors,
      warnings: this.warnings,
      results: this.results
    };
  }
}

// Export for use in tests
module.exports = TestSuiteValidator;

// Allow running directly
if (require.main === module) {
  const validator = new TestSuiteValidator();
  validator.validate().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}