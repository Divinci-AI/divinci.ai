#!/usr/bin/env node

/**
 * Generate Language-Specific Pages
 * 
 * This script creates language-specific versions of the index.html file
 * and adds hreflang tags to all pages.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const copyFile = promisify(fs.copyFile);

// Configuration
const config = {
  languages: [
    { code: 'en', name: 'English', dir: 'ltr' },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' }
  ],
  defaultLanguage: 'en',
  baseUrl: 'https://divinci.ai',
  rootDir: path.resolve(__dirname, '..')
};

/**
 * Generate hreflang tags for a page
 * @param {string} pagePath - Relative path to the page
 * @returns {string} - HTML with hreflang tags
 */
function generateHreflangTags(pagePath) {
  const tags = [];
  
  // Add x-default tag
  tags.push(`<link rel="alternate" href="${config.baseUrl}/${pagePath}" hreflang="x-default" />`);
  
  // Add language-specific tags
  for (const lang of config.languages) {
    const langPath = lang.code === config.defaultLanguage 
      ? pagePath 
      : `${lang.code}/${pagePath}`;
    
    tags.push(`<link rel="alternate" href="${config.baseUrl}/${langPath}" hreflang="${lang.code}" />`);
  }
  
  return tags.join('\n    ');
}

/**
 * Create language-specific directory
 * @param {string} langCode - Language code
 */
async function createLanguageDirectory(langCode) {
  if (langCode === config.defaultLanguage) return;
  
  const langDir = path.join(config.rootDir, langCode);
  
  try {
    await mkdir(langDir, { recursive: true });
    console.log(`✅ Created directory for ${langCode}`);
  } catch (error) {
    if (error.code !== 'EEXIST') {
      console.error(`❌ Error creating directory for ${langCode}:`, error.message);
    }
  }
}

/**
 * Create language-specific version of index.html
 * @param {string} langCode - Language code
 * @param {string} langName - Language name
 * @param {string} langDir - Language direction (ltr or rtl)
 * @param {string} indexContent - Content of the index.html file
 */
async function createLanguageIndex(langCode, langName, langDir, indexContent) {
  try {
    // Replace language attributes
    let langContent = indexContent
      .replace(/<html lang="en"/, `<html lang="${langCode}" dir="${langDir}"`)
      .replace(/<title>Divinci™ Multiplayer AI Chat<\/title>/, `<title>Divinci™ Multiplayer AI Chat - ${langName}</title>`);
    
    // Add hreflang tags
    const hreflangTags = generateHreflangTags('index.html');
    langContent = langContent.replace(
      /<meta name="viewport" content="width=device-width, initial-scale=1.0" \/>/,
      `<meta name="viewport" content="width=device-width, initial-scale=1.0" />\n\n    <!-- Hreflang tags for language alternatives -->\n    ${hreflangTags}`
    );
    
    // Add language initialization script
    langContent = langContent.replace(
      /<\/head>/,
      `    <!-- Set default language -->\n    <script>\n        document.addEventListener('DOMContentLoaded', function() {\n            if (window.i18n && window.i18n.changeLanguage) {\n                window.i18n.changeLanguage('${langCode}');\n            }\n        });\n    </script>\n</head>`
    );
    
    // Fix relative paths for language subdirectories
    if (langCode !== config.defaultLanguage) {
      langContent = langContent
        .replace(/href="(?!http|\/\/|#)([^"]+)"/g, (match, p1) => {
          // Don't modify anchors or absolute URLs
          if (p1.startsWith('#') || p1.startsWith('http') || p1.startsWith('//')) {
            return match;
          }
          return `href="../${p1}"`;
        })
        .replace(/src="(?!http|\/\/|#)([^"]+)"/g, (match, p1) => {
          // Don't modify anchors or absolute URLs
          if (p1.startsWith('#') || p1.startsWith('http') || p1.startsWith('//')) {
            return match;
          }
          return `src="../${p1}"`;
        })
        .replace(/data-include="([^"]+)"/g, (match, p1) => {
          return `data-include="../${p1}"`;
        });
    }
    
    // Write the language-specific index.html
    const outputPath = langCode === config.defaultLanguage
      ? path.join(config.rootDir, 'index.html')
      : path.join(config.rootDir, langCode, 'index.html');
    
    await writeFile(outputPath, langContent, 'utf8');
    console.log(`✅ Created ${langCode} version of index.html`);
  } catch (error) {
    console.error(`❌ Error creating ${langCode} version of index.html:`, error.message);
  }
}

/**
 * Add hreflang tags to all HTML files
 */
async function addHreflangToAllPages() {
  // TODO: Implement this function to add hreflang tags to all HTML files
  console.log('⚠️ Adding hreflang tags to all HTML files is not implemented yet.');
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Generating language-specific pages...');
    
    // Read the index.html file
    const indexPath = path.join(config.rootDir, 'index.html');
    const indexContent = await readFile(indexPath, 'utf8');
    
    // Create language directories
    for (const lang of config.languages) {
      await createLanguageDirectory(lang.code);
    }
    
    // Create language-specific index.html files
    for (const lang of config.languages) {
      await createLanguageIndex(lang.code, lang.name, lang.dir, indexContent);
    }
    
    // Add hreflang tags to all HTML files
    await addHreflangToAllPages();
    
    console.log('🎉 Language-specific pages generated successfully!');
  } catch (error) {
    console.error('❌ Error generating language-specific pages:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
