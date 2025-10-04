#!/usr/bin/env node

/**
 * Enhanced Visual Test Runner Script
 * Provides organized commands for running different types of visual tests
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Test categories and their configurations
const testCategories = {
  'visual-quick': {
    description: 'Quick visual regression tests (core sections only)',
    projects: ['Visual-Desktop-Chrome', 'Visual-Mobile-Chrome'],
    testMatch: 'tests/new-divinci-visual.spec.js',
    timeout: 300000 // 5 minutes
  },
  'visual-comprehensive': {
    description: 'Comprehensive visual tests across all devices and languages',
    projects: ['Visual-Desktop-Chrome', 'Visual-Mobile-Chrome', 'Visual-Tablet-iPad'],
    testMatch: '**/comprehensive-visual-testing.spec.js',
    timeout: 1200000 // 20 minutes
  },
  'visual-cross-browser': {
    description: 'Cross-browser visual consistency tests',
    projects: ['Visual-Desktop-Chrome', 'Visual-Desktop-Firefox', 'Visual-Desktop-Safari'],
    testMatch: '**/new-divinci-visual.spec.js',
    timeout: 600000 // 10 minutes
  },
  'visual-mobile': {
    description: 'Mobile-specific visual tests across different devices',
    projects: ['Visual-Mobile-Chrome', 'Visual-Mobile-Safari', 'Visual-Mobile-iPhone13'],
    testMatch: '**/comprehensive-visual-testing.spec.js',
    timeout: 900000 // 15 minutes
  },
  'visual-performance': {
    description: 'Visual tests under various performance conditions',
    projects: ['Visual-Desktop-Chrome', 'Visual-Mobile-Chrome'],
    testMatch: '**/visual-performance-testing.spec.js',
    timeout: 900000 // 15 minutes
  },
  'visual-multilingual': {
    description: 'Multilingual visual consistency tests',
    projects: ['Visual-Desktop-Chrome', 'Visual-Mobile-Chrome'],
    testMatch: '**/comprehensive-visual-testing.spec.js',
    grep: 'Multilingual Visual Testing',
    timeout: 600000 // 10 minutes
  },
  'visual-accessibility': {
    description: 'Visual accessibility and contrast tests',
    projects: ['Visual-Desktop-Chrome'],
    testMatch: '**/comprehensive-visual-testing.spec.js',
    grep: 'Visual Accessibility Testing',
    timeout: 300000 // 5 minutes
  },
  'visual-responsive': {
    description: 'Responsive breakpoint visual tests',
    projects: ['Visual-Desktop-Chrome', 'Visual-Tablet-iPad', 'Visual-Tablet-Landscape'],
    testMatch: '**/comprehensive-visual-testing.spec.js',
    grep: 'Responsive breakpoint visual tests',
    timeout: 600000 // 10 minutes
  },
  'visual-all': {
    description: 'All visual tests (full suite)',
    projects: [
      'Visual-Desktop-Chrome', 'Visual-Desktop-Firefox', 'Visual-Desktop-Safari',
      'Visual-Mobile-Chrome', 'Visual-Mobile-Safari', 'Visual-Mobile-iPhone13',
      'Visual-Tablet-iPad', 'Visual-Tablet-Landscape'
    ],
    testMatch: '**/visual*.spec.js',
    timeout: 2400000 // 40 minutes
  }
};

// Helper functions
function printUsage() {
  console.log('\\n🎨 Enhanced Visual Test Runner');
  console.log('================================\\n');
  console.log('Usage: node scripts/visual-test-runner.js <category> [options]\\n');
  console.log('Available test categories:\\n');
  
  Object.entries(testCategories).forEach(([category, config]) => {
    console.log(`  ${category.padEnd(20)} - ${config.description}`);
  });
  
  console.log('\\nOptions:');
  console.log('  --update-snapshots   Update visual snapshots');
  console.log('  --headed            Run tests in headed mode');
  console.log('  --debug             Run in debug mode');
  console.log('  --reporter=<type>   Specify reporter (html, json, list)');
  console.log('  --workers=<num>     Number of parallel workers');
  console.log('\\nExamples:');
  console.log('  node scripts/visual-test-runner.js visual-quick');
  console.log('  node scripts/visual-test-runner.js visual-comprehensive --update-snapshots');
  console.log('  node scripts/visual-test-runner.js visual-cross-browser --headed');
  console.log('  node scripts/visual-test-runner.js visual-mobile --workers=2');
}

function validateCategory(category) {
  if (!testCategories[category]) {
    console.error(`❌ Unknown test category: ${category}`);
    printUsage();
    process.exit(1);
  }
}

function buildPlaywrightCommand(category, options) {
  const config = testCategories[category];
  const args = ['npx', 'playwright', 'test'];
  
  // Add project filters
  config.projects.forEach(project => {
    args.push('--project', project);
  });
  
  // Add test match pattern as final argument
  if (config.testMatch) {
    // Test match should be last, not treated as a project
    // We'll add it after other arguments
  }
  
  // Add grep filter if specified
  if (config.grep) {
    args.push('--grep', config.grep);
  }
  
  // Add test match pattern before options
  if (config.testMatch) {
    args.push(config.testMatch);
  }
  
  // Add timeout
  args.push('--timeout', config.timeout.toString());
  
  // Parse and add additional options
  options.forEach(option => {
    if (option === '--update-snapshots') {
      args.push('--update-snapshots');
    } else if (option === '--headed') {
      args.push('--headed');
    } else if (option === '--debug') {
      args.push('--debug');
    } else if (option.startsWith('--reporter=')) {
      const reporter = option.split('=')[1];
      args.push('--reporter', reporter);
    } else if (option.startsWith('--workers=')) {
      const workers = option.split('=')[1];
      args.push('--workers', workers);
    } else {
      args.push(option);
    }
  });
  
  return args;
}

function runTests(category, options) {
  const config = testCategories[category];
  const command = buildPlaywrightCommand(category, options);
  
  console.log(`\\n🚀 Running ${category} tests`);
  console.log(`📋 ${config.description}`);
  console.log(`⏱️  Timeout: ${Math.round(config.timeout / 60000)} minutes`);
  console.log(`🎯 Projects: ${config.projects.join(', ')}`);
  console.log(`\\n📝 Command: ${command.join(' ')}\\n`);
  
  const startTime = Date.now();
  
  const child = spawn(command[0], command.slice(1), {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });
  
  child.on('close', (code) => {
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    if (code === 0) {
      console.log(`\\n✅ Visual tests completed successfully in ${duration}s`);
      console.log('\\n📊 Check test-results/index.html for detailed results');
    } else {
      console.log(`\\n❌ Visual tests failed with exit code ${code} after ${duration}s`);
      console.log('\\n📊 Check test-results/index.html for failure details');
    }
    
    process.exit(code);
  });
  
  child.on('error', (error) => {
    console.error(`\\n❌ Failed to start visual tests: ${error.message}`);
    process.exit(1);
  });
}

function checkPrerequisites() {
  // Check if Playwright is installed
  try {
    require.resolve('@playwright/test');
  } catch (error) {
    console.error('❌ Playwright not found. Please install with: npm install @playwright/test');
    process.exit(1);
  }
  
  // Check if test files exist
  const testDir = path.join(__dirname, '..', 'tests');
  if (!fs.existsSync(testDir)) {
    console.error('❌ Tests directory not found');
    process.exit(1);
  }
  
  // Check if visual test files exist
  const requiredTestFiles = [
    'new-divinci-visual.spec.js',
    'comprehensive-visual-testing.spec.js',
    'visual-performance-testing.spec.js'
  ];
  
  for (const testFile of requiredTestFiles) {
    const testPath = path.join(testDir, testFile);
    if (!fs.existsSync(testPath)) {
      console.error(`❌ Required test file not found: ${testFile}`);
      process.exit(1);
    }
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    return;
  }
  
  const category = args[0];
  const options = args.slice(1);
  
  validateCategory(category);
  checkPrerequisites();
  runTests(category, options);
}

// Handle special commands
if (process.argv.includes('--list-categories')) {
  console.log('Available visual test categories:\\n');
  Object.keys(testCategories).forEach(category => {
    console.log(`  ${category}`);
  });
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = {
  testCategories,
  runTests,
  buildPlaywrightCommand
};