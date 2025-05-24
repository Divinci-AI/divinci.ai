#!/usr/bin/env node

/**
 * Add Hreflang Tags to All HTML Files
 *
 * This script adds hreflang tags to all HTML files in the website.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

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
 * Add hreflang tags to an HTML file
 * @param {string} filePath - Path to the HTML file
 */
async function addHreflangTags(filePath) {
  try {
    // Read the file
    const content = await readFile(filePath, 'utf8');

    // Skip if the file already has hreflang tags
    if (content.includes('hreflang=')) {
      console.log(`⏩ Skipping ${filePath} (already has hreflang tags)`);
      return;
    }

    // Get the relative path from the root directory
    const relativePath = path.relative(config.rootDir, filePath);

    // Generate hreflang tags
    const hreflangTags = generateHreflangTags(relativePath);

    // Add hreflang tags to the file
    let updatedContent = content;

    // Check if the file has a viewport meta tag
    if (content.includes('<meta name="viewport"')) {
      updatedContent = content.replace(
        /<meta name="viewport"[^>]*>/,
        match => `${match}\n\n    <!-- Hreflang tags for language alternatives -->\n    ${hreflangTags}`
      );
    } else if (content.includes('</head>')) {
      updatedContent = content.replace(
        /<\/head>/,
        `    <!-- Hreflang tags for language alternatives -->\n    ${hreflangTags}\n</head>`
      );
    } else {
      console.warn(`⚠️ Could not add hreflang tags to ${filePath} (no head tag found)`);
      return;
    }

    // Write the updated file
    await writeFile(filePath, updatedContent, 'utf8');
    console.log(`✅ Added hreflang tags to ${filePath}`);
  } catch (error) {
    console.error(`❌ Error adding hreflang tags to ${filePath}:`, error.message);
  }
}

/**
 * Create language-specific versions of HTML files
 * @param {string} filePath - Path to the HTML file
 */
async function createLanguageVersions(filePath) {
  try {
    // Skip index.html (already handled by generate-language-pages.js)
    if (filePath.endsWith('index.html')) {
      return;
    }

    // Skip files in language directories
    for (const lang of config.languages) {
      if (filePath.includes(`/${lang.code}/`)) {
        return;
      }
    }

    // Read the file
    const content = await readFile(filePath, 'utf8');

    // Get the relative path from the root directory
    const relativePath = path.relative(config.rootDir, filePath);

    // Create language-specific versions
    for (const lang of config.languages) {
      // Skip default language (already exists)
      if (lang.code === config.defaultLanguage) {
        continue;
      }

      // Create language directory if it doesn't exist
      const langDir = path.join(config.rootDir, lang.code, path.dirname(relativePath));
      await mkdir(langDir, { recursive: true });

      // Replace language attributes
      let langContent = content
        .replace(/<html[^>]*lang="[^"]*"[^>]*>/, `<html lang="${lang.code}" dir="${lang.dir}">`)
        .replace(/<title>([^<]*)<\/title>/, `<title>$1 - ${lang.name}</title>`);

      // Add hreflang tags
      const hreflangTags = generateHreflangTags(relativePath);

      if (langContent.includes('<meta name="viewport"')) {
        langContent = langContent.replace(
          /<meta name="viewport"[^>]*>/,
          match => `${match}\n\n    <!-- Hreflang tags for language alternatives -->\n    ${hreflangTags}`
        );
      } else if (langContent.includes('</head>')) {
        langContent = langContent.replace(
          /<\/head>/,
          `    <!-- Hreflang tags for language alternatives -->\n    ${hreflangTags}\n</head>`
        );
      }

      // Add language initialization script
      langContent = langContent.replace(
        /<\/head>/,
        `    <!-- Set default language -->\n    <script>\n        document.addEventListener('DOMContentLoaded', function() {\n            if (window.i18n && window.i18n.changeLanguage) {\n                window.i18n.changeLanguage('${lang.code}');\n            }\n        });\n    </script>\n</head>`
      );

      // Fix relative paths for language subdirectories
      langContent = langContent
        .replace(/href="(?!http|\/\/|#)([^"]+)"/g, (match, p1) => {
          // Don't modify anchors or absolute URLs
          if (p1.startsWith('#') || p1.startsWith('http') || p1.startsWith('//')) {
            return match;
          }

          // Calculate the correct relative path
          const depth = relativePath.split('/').length - 1;
          const prefix = depth > 0 ? '../'.repeat(depth) : '../';
          return `href="${prefix}${p1}"`;
        })
        .replace(/src="(?!http|\/\/|#)([^"]+)"/g, (match, p1) => {
          // Don't modify anchors or absolute URLs
          if (p1.startsWith('#') || p1.startsWith('http') || p1.startsWith('//')) {
            return match;
          }

          // Calculate the correct relative path
          const depth = relativePath.split('/').length - 1;
          const prefix = depth > 0 ? '../'.repeat(depth) : '../';
          return `src="${prefix}${p1}"`;
        })
        .replace(/data-include="([^"]+)"/g, (match, p1) => {
          // Calculate the correct relative path
          const depth = relativePath.split('/').length - 1;
          const prefix = depth > 0 ? '../'.repeat(depth) : '../';
          return `data-include="${prefix}${p1}"`;
        });

      // Write the language-specific file
      const langFilePath = path.join(config.rootDir, lang.code, relativePath);
      await writeFile(langFilePath, langContent, 'utf8');
      console.log(`✅ Created ${lang.code} version of ${relativePath}`);
    }
  } catch (error) {
    console.error(`❌ Error creating language versions for ${filePath}:`, error.message);
  }
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Adding hreflang tags to all HTML files...');

    // Find all HTML files
    const htmlFiles = glob.sync('**/*.html', {
      cwd: config.rootDir,
      ignore: ['node_modules/**', 'dist/**', 'build/**', '**/es/**', '**/fr/**', '**/ar/**']
    });

    console.log(`📂 Found ${htmlFiles.length} HTML files`);

    // Add hreflang tags to all HTML files
    for (const file of htmlFiles) {
      const filePath = path.join(config.rootDir, file);
      await addHreflangTags(filePath);
    }

    // Create language-specific versions of all HTML files
    console.log('🚀 Creating language-specific versions of HTML files...');

    for (const file of htmlFiles) {
      const filePath = path.join(config.rootDir, file);
      await createLanguageVersions(filePath);
    }

    console.log('🎉 Hreflang tags added successfully!');
  } catch (error) {
    console.error('❌ Error adding hreflang tags:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
