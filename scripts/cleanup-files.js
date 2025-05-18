#!/usr/bin/env node

/**
 * Cleanup Script for Divinci AI
 * 
 * This script removes unnecessary files from the project,
 * keeping only files directly used in index.html and other essential files.
 * 
 * Usage:
 * node cleanup-files.js [--dry-run] [--list-only]
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const unlink = promisify(fs.unlink); // Fixed: Use unlink instead of unlinkSync
const rmdir = promisify(fs.rmdir);   // Fixed: Use rmdir instead of rmdirSync

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const listOnly = args.includes('--list-only');

// Configuration
const config = {
  rootDir: path.resolve(__dirname, '..'),
  // Add directories that should be completely excluded from cleanup
  excludeDirs: [
    'node_modules',
    '.git',
    'scripts',
    'images',
    'js',
    'assets',
    'includes',
    'features',
    'optimized',
    'locales',
    'blog',
    'docs',
    'api',
    'css',
    'templates'
  ],
  // Add files that should always be kept
  essentialFiles: [
    // HTML Core Files
    'index.html',
    'about-us.html',
    'careers.html',
    'contact.html',
    'pricing.html',
    'roadmap.html',
    'changelog.html',
    'support.html',
    'press.html',
    'security.html',
    'privacy-policy.html',
    'terms-of-service.html',
    'ai-safety-ethics.html',
    'cookies.html',
    'accessibility.html',
    'tutorials/index.html',
    
    // Feature Pages
    'features/data-management/autorag.html',
    'features/development-tools/release-cycle-management.html',
    'features/quality-assurance/llm-quality-assurance.html',
    
    // Include Files
    'includes/footer.html',
    'includes/meta-tags.html',
    'includes/structured-data.html',
    'includes/header.html',
    'includes/language-switcher.html',
    'includes/social-share.html',
    'includes/header-styles.css',
    'includes/section-content-fix.css',
    'includes/mobile-header.css',
    
    // JavaScript Core Files
    'js/structured-data.js',
    'js/language-switcher.js',
    'js/view-toggle.js',
    'js/mobile-menu.js',
    'js/enhanced-accessibility.js',
    'js/social-sharing.js',
    'js/apply-sora-to-divinci.js',
    'js/feature-circle-links.js',
    'js/direct-translations.js',
    'js/i18n.js',
    'debug-include.js',
    'script.js',
    'features-orbit-simple.js',
    'hybrid-bubbles.js',
    'divinci-animation.js',
    
    // CSS Core Files
    'assets/css/fonts.css',
    'assets/css/sora-styles.css',
    'assets/css/enhanced-accessibility.css',
    'styles.css',
    'features-orbit.css',
    'styles-footer.css',
    'css/social-sharing.css',
    
    // Configuration Files
    'package.json',
    'package-lock.json',
    'robots.txt',
    'sitemap.xml',
    'sitemap_index.xml',
    'sitemap_ar.xml',
    'sitemap_es.xml',
    'sitemap_fr.xml',
    'CLAUDE.md',
    'README.md',
    'favicon.ico',
    'apple-touch-icon.png',
    'FILE-CLEANUP.md'
  ],
  // Add file extensions that should always be kept
  keepExtensions: [
    '.html',
    '.js',
    '.css',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.avif',
    '.json'
  ]
};

// Collect files to remove
const filesToRemove = [];
const dirsToCheck = [];

/**
 * Check if a file or directory should be kept
 * @param {string} filePath - Path to check
 * @param {boolean} isDirectory - Whether the path is a directory
 * @returns {boolean} - Whether to keep the file/directory
 */
function shouldKeep(filePath, isDirectory) {
  const relativePath = path.relative(config.rootDir, filePath);
  
  // Always keep excluded directories
  if (isDirectory && config.excludeDirs.some(dir => 
    relativePath === dir || 
    relativePath.startsWith(dir + path.sep)
  )) {
    return true;
  }
  
  // Always keep essential files
  if (!isDirectory && config.essentialFiles.some(file => 
    relativePath === file || 
    // Handle Windows paths
    relativePath.replace(/\\/g, '/') === file
  )) {
    return true;
  }
  
  // Keep files with specific extensions
  if (!isDirectory) {
    const ext = path.extname(filePath).toLowerCase();
    if (config.keepExtensions.includes(ext)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Remove empty directories
 * @param {string} dirPath - Directory to check
 * @returns {Promise<boolean>} - Whether the directory was empty and removed
 */
async function removeEmptyDir(dirPath) {
  try {
    const files = await readdir(dirPath);
    
    if (files.length === 0) {
      const relPath = path.relative(config.rootDir, dirPath);
      
      // Don't process excluded dirs or the root directory
      if (relPath === '' || config.excludeDirs.some(dir => 
        relPath === dir || relPath.startsWith(dir + path.sep)
      )) {
        return false;
      }
      
      if (isDryRun || listOnly) {
        console.log(`🔍 Would remove empty directory: ${relPath}`);
        return true;
      } else {
        await rmdir(dirPath);
        console.log(`🗑️ Removed empty directory: ${relPath}`);
        return true;
      }
    }
    
    // Check if all subdirectories are empty
    let allEmpty = true;
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await stat(filePath);
      
      if (stats.isDirectory()) {
        const wasEmpty = await removeEmptyDir(filePath);
        if (!wasEmpty) {
          allEmpty = false;
        }
      } else {
        allEmpty = false;
      }
    }
    
    // If all subdirectories were empty and removed, check if this directory is now empty
    if (allEmpty) {
      const remainingFiles = await readdir(dirPath);
      if (remainingFiles.length === 0) {
        const relPath = path.relative(config.rootDir, dirPath);
        
        if (isDryRun || listOnly) {
          console.log(`🔍 Would remove now-empty directory: ${relPath}`);
          return true;
        } else {
          await rmdir(dirPath);
          console.log(`🗑️ Removed now-empty directory: ${relPath}`);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error checking directory ${dirPath}: ${error.message}`);
    return false;
  }
}

/**
 * Process a directory, finding unnecessary files
 * @param {string} dirPath - Directory to process
 * @returns {Promise<void>}
 */
async function processDirectory(dirPath) {
  try {
    const entries = await readdir(dirPath);
    
    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry);
      const stats = await stat(entryPath);
      
      if (stats.isDirectory()) {
        // Process subdirectory if it's not excluded
        if (!shouldKeep(entryPath, true)) {
          await processDirectory(entryPath);
          dirsToCheck.push(entryPath);
        }
      } else {
        // Check if file should be kept
        if (!shouldKeep(entryPath, false)) {
          filesToRemove.push(entryPath);
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error processing directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Remove files and directories
 */
async function removeFiles() {
  // First list all files that would be removed
  if (isDryRun || listOnly) {
    console.log(`\n📋 Found ${filesToRemove.length} files to remove:`);
    for (const file of filesToRemove) {
      console.log(`🔍 Would remove: ${path.relative(config.rootDir, file)}`);
    }
  }
  
  // Actually remove files if not in list-only or dry-run mode
  if (!isDryRun && !listOnly) {
    console.log(`\n🗑️ Removing ${filesToRemove.length} files...`);
    for (const file of filesToRemove) {
      try {
        await unlink(file);
        console.log(`✅ Removed: ${path.relative(config.rootDir, file)}`);
      } catch (error) {
        console.error(`❌ Error removing ${file}: ${error.message}`);
      }
    }
  }
  
  // Check and remove empty directories
  console.log('\n🔍 Checking for empty directories...');
  for (const dir of dirsToCheck) {
    await removeEmptyDir(dir);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 Starting cleanup process...');
  
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE: No files will be modified');
  } else if (listOnly) {
    console.log('📋 LIST ONLY MODE: Listing files that would be removed');
  }
  
  // Find files to remove
  await processDirectory(config.rootDir);
  
  // Remove files and empty directories
  await removeFiles();
  
  if (isDryRun) {
    console.log(`\n🔍 Dry run completed. Would remove ${filesToRemove.length} files.`);
  } else if (listOnly) {
    console.log(`\n📋 List completed. Found ${filesToRemove.length} files that would be removed.`);
  } else {
    console.log(`\n🎉 Cleanup completed! Removed ${filesToRemove.length} files.`);
  }
}

// Run the main function
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});