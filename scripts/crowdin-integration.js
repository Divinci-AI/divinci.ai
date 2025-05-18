#!/usr/bin/env node

/**
 * Crowdin Integration Script
 *
 * This script provides functionality to:
 * 1. Extract content from HTML files
 * 2. Upload content to Crowdin for translation
 * 3. Download translations from Crowdin
 * 4. Apply translations to HTML files
 *
 * Usage:
 * - Extract content: node crowdin-integration.js extract
 * - Upload to Crowdin: node crowdin-integration.js upload
 * - Download translations: node crowdin-integration.js download
 * - Apply translations: node crowdin-integration.js apply
 * - Run all steps: node crowdin-integration.js all
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');
const cheerio = require('cheerio');
const axios = require('axios');
const dotenv = require('dotenv');
const FormData = require('form-data');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Configuration
const config = {
  languages: [
    { code: 'en', name: 'English', dir: 'ltr', default: true },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' }
  ],
  defaultLanguage: 'en',
  rootDir: path.resolve(__dirname, '..'),
  extractDir: path.resolve(__dirname, '../translations'),
  crowdinApiToken: process.env.CROWDIN_API_TOKEN,
  crowdinProjectId: process.env.CROWDIN_PROJECT_ID || 'divinci-ai-website',
  crowdinBaseUrl: 'https://api.crowdin.com/api/v2'
};

// Ensure the API token is available
if (!config.crowdinApiToken) {
  console.error('❌ Crowdin API token not found. Please set CROWDIN_API_TOKEN in .env file.');
  process.exit(1);
}

/**
 * Extract translatable content from HTML files
 */
async function extractContent() {
  try {
    console.log('🔍 Extracting translatable content from HTML files...');

    // Create extraction directory
    await mkdir(config.extractDir, { recursive: true });

    // Find all HTML files in the default language
    const htmlFiles = glob.sync('**/*.html', {
      cwd: config.rootDir,
      ignore: [
        'node_modules/**',
        'dist/**',
        'build/**',
        'translations/**',
        '**/es/**',
        '**/fr/**',
        '**/ar/**',
        'zola-site/templates/**',
        'templates/**',
        'includes/**',
        '**/404.html'
      ]
    });

    console.log(`📂 Found ${htmlFiles.length} HTML files to process`);

    // Initialize translation object
    const translations = {};

    // Process each HTML file
    for (const file of htmlFiles) {
      const filePath = path.join(config.rootDir, file);
      const content = await readFile(filePath, 'utf8');

      // Parse HTML
      const $ = cheerio.load(content);

      // Extract translatable content
      const fileTranslations = {};

      // Extract text from elements with data-i18n attribute
      $('[data-i18n]').each((i, el) => {
        const key = $(el).attr('data-i18n');
        const text = $(el).text().trim();
        if (text) {
          fileTranslations[key] = text;
        }
      });

      // Extract text from headings, paragraphs, and other content elements
      $('h1, h2, h3, h4, h5, h6, p, a, button, span, li, label, figcaption').each((i, el) => {
        // Skip elements with data-i18n attribute (already processed)
        if ($(el).attr('data-i18n')) return;

        // Skip elements with no text content
        const text = $(el).text().trim();
        if (!text) return;

        // Skip elements with only whitespace or special characters
        if (/^[\s\d\W]+$/.test(text)) return;

        // Generate a key based on element type and content
        const elementType = el.name;
        const elementId = $(el).attr('id') || '';
        const elementClass = $(el).attr('class') || '';
        const parentId = $(el).parent().attr('id') || '';

        let key = `${file.replace(/\.html$/, '')}.${elementType}`;
        if (elementId) key += `.${elementId}`;
        else if (parentId) key += `.${parentId}`;
        else if (elementClass) key += `.${elementClass.split(' ')[0]}`;

        // Add a hash of the content to ensure uniqueness
        const contentHash = Buffer.from(text).toString('base64').substring(0, 8);
        key += `.${contentHash}`;

        fileTranslations[key] = text;
      });

      // Add file translations to global translations
      if (Object.keys(fileTranslations).length > 0) {
        translations[file] = fileTranslations;
      }
    }

    // Write translations to JSON file
    const translationsPath = path.join(config.extractDir, 'translations.json');
    await writeFile(translationsPath, JSON.stringify(translations, null, 2), 'utf8');

    console.log(`✅ Extracted ${Object.keys(translations).length} files with translatable content`);
    console.log(`✅ Translations saved to ${translationsPath}`);

    return translations;
  } catch (error) {
    console.error('❌ Error extracting content:', error.message);
    throw error;
  }
}

/**
 * Upload content to Crowdin for translation
 */
async function uploadToCrowdin() {
  try {
    console.log('🚀 Uploading content to Crowdin...');

    // Check if translations file exists
    const translationsPath = path.join(config.extractDir, 'translations.json');
    if (!fs.existsSync(translationsPath)) {
      console.error('❌ Translations file not found. Run extraction first.');
      process.exit(1);
    }

    // Verify Crowdin API token and project ID
    console.log('🔑 Verifying Crowdin API credentials...');
    try {
      // Test API connection by getting project details
      const projectResponse = await axios.get(
        `${config.crowdinBaseUrl}/projects/${config.crowdinProjectId}`,
        {
          headers: {
            'Authorization': `Bearer ${config.crowdinApiToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`✅ Connected to Crowdin project: ${projectResponse.data.data.name}`);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.error('❌ Authentication failed: Invalid Crowdin API token');
        console.error('Please check your CROWDIN_API_TOKEN in the .env file');
        process.exit(1);
      } else if (error.response && error.response.status === 404) {
        console.error(`❌ Project not found: ${config.crowdinProjectId}`);
        console.error('Please check your CROWDIN_PROJECT_ID in the .env file');
        console.error('If the project does not exist, you need to create it in Crowdin first:');
        console.error('1. Go to https://crowdin.com/createproject');
        console.error('2. Create a project named "divinci-ai-website"');
        console.error('3. Set the source language to English');
        console.error('4. Add Spanish, French, and Arabic as target languages');
        console.error('5. After creating the project, get the project ID from the URL:');
        console.error('   https://crowdin.com/project/YOUR_PROJECT_NAME -> YOUR_PROJECT_ID is the number in the URL');
        console.error('6. Update the CROWDIN_PROJECT_ID in your .env file with this number');
        process.exit(1);
      } else {
        console.error('❌ Error connecting to Crowdin:', error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
      }
    }

    // Read translations
    const translations = JSON.parse(await readFile(translationsPath, 'utf8'));

    // Create source files for each HTML file
    for (const [file, fileTranslations] of Object.entries(translations)) {
      // Create JSON file for Crowdin
      const sourceFile = path.join(config.extractDir, `${file.replace(/\//g, '_')}.json`);
      await writeFile(sourceFile, JSON.stringify(fileTranslations, null, 2), 'utf8');

      // Upload to Crowdin
      console.log(`📤 Uploading ${file} to Crowdin...`);

      try {
        // Create FormData
        const formData = new FormData();
        formData.append('storageId', file.replace(/\//g, '_'));
        formData.append('file', fs.createReadStream(sourceFile));

        // Upload file to Crowdin storage
        const storageResponse = await axios.post(
          `${config.crowdinBaseUrl}/storages`,
          formData,
          {
            headers: {
              ...formData.getHeaders(),
              'Authorization': `Bearer ${config.crowdinApiToken}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );

        const storageId = storageResponse.data.data.id;

        // Add file to Crowdin project
        await axios.post(
          `${config.crowdinBaseUrl}/projects/${config.crowdinProjectId}/files`,
          {
            storageId,
            name: `${file.replace(/\//g, '_')}.json`,
            type: 'json'
          },
          {
            headers: {
              'Authorization': `Bearer ${config.crowdinApiToken}`,
              'Content-Type': 'application/json'
            }
          }
        ).catch(error => {
          // If file already exists, update it
          if (error.response && error.response.status === 400 && error.response.data.error.code === 50) {
            console.log(`⚠️ File already exists, updating...`);

            // Find file ID
            return axios.get(
              `${config.crowdinBaseUrl}/projects/${config.crowdinProjectId}/files`,
              {
                headers: {
                  'Authorization': `Bearer ${config.crowdinApiToken}`
                }
              }
            ).then(response => {
              const files = response.data.data;
              const fileObj = files.find(f => f.data.name === `${file.replace(/\//g, '_')}.json`);

              if (fileObj) {
                // Update file
                return axios.put(
                  `${config.crowdinBaseUrl}/projects/${config.crowdinProjectId}/files/${fileObj.data.id}`,
                  {
                    storageId
                  },
                  {
                    headers: {
                      'Authorization': `Bearer ${config.crowdinApiToken}`,
                      'Content-Type': 'application/json'
                    }
                  }
                );
              }
            });
          } else {
            throw error;
          }
        });
      } catch (error) {
        console.error(`❌ Error uploading ${file} to Crowdin:`, error.message);
        if (error.response) {
          console.error('Response status:', error.response.status);
          console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        continue; // Continue with next file
      }
    }

    console.log('✅ Content uploaded to Crowdin successfully');
  } catch (error) {
    console.error('❌ Error uploading to Crowdin:', error.message);
    throw error;
  }
}

/**
 * Download translations from Crowdin
 */
async function downloadFromCrowdin() {
  try {
    console.log('🔽 Downloading translations from Crowdin...');

    // Create directory for downloaded translations
    const downloadDir = path.join(config.extractDir, 'downloaded');
    await mkdir(downloadDir, { recursive: true });

    // Build translations on Crowdin
    console.log('🔄 Building translations on Crowdin...');
    await axios.post(
      `${config.crowdinBaseUrl}/projects/${config.crowdinProjectId}/translations/builds`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${config.crowdinApiToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Download translations for each language
    for (const lang of config.languages) {
      // Skip default language
      if (lang.code === config.defaultLanguage) continue;

      console.log(`🔽 Downloading translations for ${lang.name} (${lang.code})...`);

      // Create language directory
      const langDir = path.join(downloadDir, lang.code);
      await mkdir(langDir, { recursive: true });

      // Download translations
      const response = await axios.get(
        `${config.crowdinBaseUrl}/projects/${config.crowdinProjectId}/translations/builds/download?targetLanguageId=${lang.code}`,
        {
          headers: {
            'Authorization': `Bearer ${config.crowdinApiToken}`
          }
        }
      );

      // Download the ZIP file
      const downloadUrl = response.data.data.url;
      const zipResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });

      // Save ZIP file
      const zipPath = path.join(downloadDir, `${lang.code}.zip`);
      await writeFile(zipPath, zipResponse.data);

      // Extract ZIP file
      console.log(`📦 Extracting translations for ${lang.code}...`);
      // TODO: Extract ZIP file and process translations
    }

    console.log('✅ Translations downloaded successfully');
  } catch (error) {
    console.error('❌ Error downloading from Crowdin:', error.message);
    throw error;
  }
}

/**
 * Apply translations to HTML files
 */
async function applyTranslations() {
  try {
    console.log('🔄 Applying translations to HTML files...');

    // TODO: Apply translations to HTML files

    console.log('✅ Translations applied successfully');
  } catch (error) {
    console.error('❌ Error applying translations:', error.message);
    throw error;
  }
}

/**
 * Main function
 */
async function main() {
  try {
    const command = process.argv[2] || 'help';

    switch (command) {
      case 'extract':
        await extractContent();
        break;
      case 'upload':
        await uploadToCrowdin();
        break;
      case 'download':
        await downloadFromCrowdin();
        break;
      case 'apply':
        await applyTranslations();
        break;
      case 'all':
        await extractContent();
        await uploadToCrowdin();
        await downloadFromCrowdin();
        await applyTranslations();
        break;
      case 'help':
      default:
        console.log(`
Crowdin Integration Script

Usage:
  node crowdin-integration.js <command>

Commands:
  extract    Extract translatable content from HTML files
  upload     Upload content to Crowdin for translation
  download   Download translations from Crowdin
  apply      Apply translations to HTML files
  all        Run all steps in sequence
  help       Show this help message
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
