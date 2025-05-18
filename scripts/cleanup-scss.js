#!/usr/bin/env node

/**
 * SCSS Cleanup Script for Divinci AI
 * 
 * This script removes SCSS files that are no longer needed
 * as we've migrated to using native CSS nesting.
 * 
 * Usage:
 * node cleanup-scss.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'),
  sassDir: path.join(path.resolve(__dirname, '..'), 'assets/sass')
};

/**
 * Remove SCSS directory recursively
 */
function removeSassDir() {
  if (!fs.existsSync(config.sassDir)) {
    console.log(`🔍 Sass directory does not exist: ${config.sassDir}`);
    return;
  }
  
  console.log(`🔄 Removing Sass directory: ${config.sassDir}`);
  
  if (isDryRun) {
    console.log(`🔍 Would remove directory: ${config.sassDir}`);
  } else {
    try {
      // Use rimraf or fs.rm for directory removal
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${config.sassDir}"`, { stdio: 'ignore' });
      } else {
        execSync(`rm -rf "${config.sassDir}"`, { stdio: 'ignore' });
      }
      console.log(`✅ Removed Sass directory: ${config.sassDir}`);
    } catch (error) {
      console.error(`❌ Failed to remove Sass directory: ${error.message}`);
    }
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting SCSS cleanup...');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE: No files will be modified');
  }
  
  // Remove Sass directory
  removeSassDir();
  
  console.log('🎉 SCSS cleanup completed!');
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});