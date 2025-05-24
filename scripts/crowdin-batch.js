#!/usr/bin/env node

/**
 * Crowdin Batch Process
 * 
 * This script runs a complete Crowdin workflow:
 * 1. Upload source files
 * 2. Pre-translate content
 * 3. Download translations
 * 4. Generate translated pages
 * 
 * Usage:
 * node crowdin-batch.js [--skip-upload] [--skip-translate] [--skip-download] [--skip-generate] [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  skipUpload: args.includes('--skip-upload'),
  skipTranslate: args.includes('--skip-translate'),
  skipDownload: args.includes('--skip-download'),
  skipGenerate: args.includes('--skip-generate'),
  dryRun: args.includes('--dry-run')
};

// Load configuration
let config;
try {
  const configPath = path.join(__dirname, 'crowdin-config.json');
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error(`❌ Error loading configuration: ${error.message}`);
  process.exit(1);
}

/**
 * Run a command and return its output
 * @param {string} command - Command to run
 * @param {string[]} args - Command arguments
 * @param {boolean} silent - Whether to suppress output
 * @returns {Promise<string>} - Command output
 */
async function runCommand(command, args, silent = false) {
  return new Promise((resolve, reject) => {
    const cmd = spawn(command, args, { stdio: silent ? 'pipe' : 'inherit' });
    
    let output = '';
    if (silent) {
      cmd.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      cmd.stderr.on('data', (data) => {
        output += data.toString();
      });
    }
    
    cmd.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    cmd.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Upload source files to Crowdin
 */
async function uploadSourceFiles() {
  console.log('\n🚀 Step 1: Uploading source files to Crowdin...');
  
  const args = ['crowdin-sync.js', 'upload'];
  if (options.dryRun) {
    args.push('--dry-run');
  }
  
  try {
    await runCommand('node', args);
    console.log('✅ Source files uploaded successfully');
    return true;
  } catch (error) {
    console.error(`❌ Failed to upload source files: ${error.message}`);
    return false;
  }
}

/**
 * Pre-translate content using machine translation
 */
async function preTranslateContent() {
  console.log('\n🚀 Step 2: Pre-translating content...');
  
  const args = ['crowdin-sync.js', 'pre-translate'];
  if (options.dryRun) {
    args.push('--dry-run');
  }
  
  try {
    await runCommand('node', args);
    console.log('✅ Content pre-translated successfully');
    return true;
  } catch (error) {
    console.error(`❌ Failed to pre-translate content: ${error.message}`);
    return false;
  }
}

/**
 * Download translations from Crowdin
 */
async function downloadTranslations() {
  console.log('\n🚀 Step 3: Downloading translations...');
  
  const args = ['crowdin-sync.js', 'download'];
  if (options.dryRun) {
    args.push('--dry-run');
  }
  
  try {
    await runCommand('node', args);
    console.log('✅ Translations downloaded successfully');
    return true;
  } catch (error) {
    console.error(`❌ Failed to download translations: ${error.message}`);
    return false;
  }
}

/**
 * Generate translated pages
 */
async function generateTranslatedPages() {
  console.log('\n🚀 Step 4: Generating translated pages...');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN: Would generate translated pages');
    return true;
  }
  
  try {
    // Get all target languages
    const languages = config.targetLocales;
    
    if (languages.length === 0) {
      console.warn('⚠️ Warning: No target languages configured.');
      return false;
    }
    
    console.log(`🌐 Target languages: ${languages.join(', ')}`);
    
    // Get the locales directory
    const localesDir = path.resolve(__dirname, '..', config.localesDir.replace(/^\.\//, ''));
    
    // Check if i18n-test.html exists
    const testPagePath = path.resolve(__dirname, '..', 'i18n-test.html');
    if (!fs.existsSync(testPagePath)) {
      console.warn('⚠️ Warning: i18n-test.html not found. Skipping page generation.');
      return false;
    }
    
    // Read the test page
    const testPageContent = fs.readFileSync(testPagePath, 'utf8');
    
    // Generate a translated page for each language
    for (const lang of languages) {
      console.log(`🔄 Generating page for ${lang}...`);
      
      // Create a language-specific page
      const langPagePath = path.resolve(__dirname, '..', `i18n-test-${lang}.html`);
      
      // Modify the page to use the specific language
      let langPageContent = testPageContent;
      
      // Set the language in the HTML tag
      langPageContent = langPageContent.replace(/<html lang="en">/, `<html lang="${lang}">`);
      
      // Add a language parameter to the i18n.js script
      langPageContent = langPageContent.replace(
        /<script src="js\/i18n.js"><\/script>/,
        `<script src="js/i18n.js"></script>
    <script>
      // Force language to ${lang}
      document.addEventListener('DOMContentLoaded', () => {
        window.i18n.changeLanguage('${lang}');
      });
    </script>`
      );
      
      // Write the language-specific page
      fs.writeFileSync(langPagePath, langPageContent);
      console.log(`✅ Generated ${langPagePath}`);
    }
    
    console.log('✅ Translated pages generated successfully');
    return true;
  } catch (error) {
    console.error(`❌ Failed to generate translated pages: ${error.message}`);
    return false;
  }
}

/**
 * Run the batch process
 */
async function runBatchProcess() {
  console.log('🚀 Starting Crowdin batch process...');
  
  if (options.dryRun) {
    console.log('🔍 DRY RUN MODE: No changes will be made to Crowdin or local files');
  }
  
  let success = true;
  
  // Step 1: Upload source files
  if (!options.skipUpload) {
    success = await uploadSourceFiles();
    if (!success && !options.dryRun) {
      console.error('❌ Failed to upload source files. Stopping batch process.');
      return;
    }
  } else {
    console.log('\n⏩ Skipping source file upload (--skip-upload)');
  }
  
  // Step 2: Pre-translate content
  if (!options.skipTranslate) {
    success = await preTranslateContent();
    if (!success && !options.dryRun) {
      console.error('❌ Failed to pre-translate content. Stopping batch process.');
      return;
    }
  } else {
    console.log('\n⏩ Skipping content pre-translation (--skip-translate)');
  }
  
  // Step 3: Download translations
  if (!options.skipDownload) {
    success = await downloadTranslations();
    if (!success && !options.dryRun) {
      console.error('❌ Failed to download translations. Stopping batch process.');
      return;
    }
  } else {
    console.log('\n⏩ Skipping translation download (--skip-download)');
  }
  
  // Step 4: Generate translated pages
  if (!options.skipGenerate) {
    success = await generateTranslatedPages();
    if (!success && !options.dryRun) {
      console.error('❌ Failed to generate translated pages.');
    }
  } else {
    console.log('\n⏩ Skipping page generation (--skip-generate)');
  }
  
  console.log('\n🎉 Crowdin batch process completed!');
}

// Run the batch process
runBatchProcess().catch(error => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});
