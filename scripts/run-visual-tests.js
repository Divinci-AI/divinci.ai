#!/usr/bin/env node

/**
 * Visual Testing Runner Script
 * Orchestrates visual testing across different configurations and generates reports
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class VisualTestRunner {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      startTime: new Date(),
      endTime: null,
      screenshots: [],
      errors: []
    };
  }

  async runTests(options = {}) {
    console.log('🎨 Starting Visual Testing Suite...\n');
    
    try {
      // Ensure test directories exist
      this.ensureDirectories();
      
      // Start local server if needed
      const serverProcess = await this.startServer();
      
      // Run visual tests
      await this.executeVisualTests(options);
      
      // Generate reports
      await this.generateReports();
      
      // Cleanup
      if (serverProcess) {
        serverProcess.kill();
      }
      
      this.testResults.endTime = new Date();
      this.printSummary();
      
    } catch (error) {
      console.error('❌ Visual testing failed:', error.message);
      process.exit(1);
    }
  }

  ensureDirectories() {
    const dirs = [
      'tests/visual',
      'visual-test-results',
      'visual-test-results/screenshots',
      'visual-test-results/reports'
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  async startServer() {
    console.log('🚀 Starting local server on port 8000...');
    
    try {
      // Check if server is already running
      execSync('curl -s http://localhost:8000 > /dev/null', { stdio: 'ignore' });
      console.log('✅ Server already running on port 8000');
      return null;
    } catch {
      // Server not running, start it
      const serverProcess = spawn('npx', ['serve', '.', '-p', '8000'], {
        stdio: 'pipe',
        detached: false
      });
      
      // Wait for server to start
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server startup timeout'));
        }, 10000);
        
        const checkServer = setInterval(() => {
          try {
            execSync('curl -s http://localhost:8000 > /dev/null', { stdio: 'ignore' });
            clearInterval(checkServer);
            clearTimeout(timeout);
            console.log('✅ Server started successfully');
            resolve();
          } catch {
            // Server not ready yet
          }
        }, 1000);
      });
      
      return serverProcess;
    }
  }

  async executeVisualTests(options) {
    console.log('📸 Running visual tests...\n');
    
    const testCommands = [
      {
        name: 'Homepage Visual Tests',
        command: 'npx playwright test tests/visual/homepage.visual.spec.ts --config=playwright.visual.config.js'
      },
      {
        name: 'Language Switcher Visual Tests',
        command: 'npx playwright test tests/visual/language-switcher.visual.spec.ts --config=playwright.visual.config.js'
      },
      {
        name: 'Cross-Language Visual Tests',
        command: 'npx playwright test tests/visual/cross-language.visual.spec.ts --config=playwright.visual.config.js'
      }
    ];

    for (const test of testCommands) {
      console.log(`🔍 Running: ${test.name}`);
      
      try {
        const result = execSync(test.command, { 
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        console.log(`✅ ${test.name} - PASSED`);
        this.testResults.passed++;
        
      } catch (error) {
        console.log(`❌ ${test.name} - FAILED`);
        this.testResults.failed++;
        this.testResults.errors.push({
          test: test.name,
          error: error.message
        });
        
        if (!options.continueOnFailure) {
          throw error;
        }
      }
      
      this.testResults.total++;
    }
  }

  async generateReports() {
    console.log('\n📊 Generating visual test reports...');
    
    // Generate HTML report
    try {
      execSync('npx playwright show-report --config=playwright.visual.config.js', {
        stdio: 'pipe'
      });
      console.log('✅ HTML report generated');
    } catch (error) {
      console.log('⚠️  HTML report generation failed:', error.message);
    }
    
    // Generate custom summary report
    this.generateSummaryReport();
  }

  generateSummaryReport() {
    const reportData = {
      ...this.testResults,
      duration: this.testResults.endTime - this.testResults.startTime,
      timestamp: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: process.platform,
        arch: process.arch
      }
    };

    const reportPath = 'visual-test-results/summary.json';
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    // Generate markdown report
    const markdownReport = this.generateMarkdownReport(reportData);
    fs.writeFileSync('visual-test-results/VISUAL-TEST-REPORT.md', markdownReport);
    
    console.log(`✅ Summary report saved to ${reportPath}`);
  }

  generateMarkdownReport(data) {
    const duration = Math.round(data.duration / 1000);
    const successRate = Math.round((data.passed / data.total) * 100);
    
    return `# Visual Testing Report

## 📊 Summary
- **Total Tests:** ${data.total}
- **Passed:** ${data.passed} ✅
- **Failed:** ${data.failed} ❌
- **Success Rate:** ${successRate}%
- **Duration:** ${duration} seconds
- **Timestamp:** ${data.timestamp}

## 🎯 Test Results

### Passed Tests
${data.passed > 0 ? `${data.passed} tests passed successfully` : 'No tests passed'}

### Failed Tests
${data.failed > 0 ? 
  data.errors.map(error => `- **${error.test}**: ${error.error}`).join('\n') : 
  'No test failures'}

## 🔧 Environment
- **Node.js:** ${data.environment.node}
- **Platform:** ${data.environment.platform}
- **Architecture:** ${data.environment.arch}

## 📸 Screenshots
Visual test screenshots are available in the \`visual-test-results\` directory.

## 🚀 Next Steps
${data.failed > 0 ? 
  '1. Review failed test screenshots\n2. Fix visual regressions\n3. Re-run tests' :
  '1. Review generated screenshots\n2. Update baselines if needed\n3. Deploy with confidence'}
`;
  }

  printSummary() {
    const duration = Math.round((this.testResults.endTime - this.testResults.startTime) / 1000);
    const successRate = Math.round((this.testResults.passed / this.testResults.total) * 100);
    
    console.log('\n' + '='.repeat(50));
    console.log('🎨 VISUAL TESTING SUMMARY');
    console.log('='.repeat(50));
    console.log(`📊 Total Tests: ${this.testResults.total}`);
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    console.log(`⏱️  Duration: ${duration} seconds`);
    console.log('='.repeat(50));
    
    if (this.testResults.failed > 0) {
      console.log('\n❌ Some tests failed. Check the reports for details.');
      process.exit(1);
    } else {
      console.log('\n🎉 All visual tests passed!');
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    continueOnFailure: args.includes('--continue-on-failure'),
    updateSnapshots: args.includes('--update-snapshots'),
    headed: args.includes('--headed')
  };
  
  const runner = new VisualTestRunner();
  runner.runTests(options);
}

module.exports = VisualTestRunner;
