#!/usr/bin/env node

/**
 * Crowdin Upload Script
 *
 * This script uploads source files to Crowdin using the Crowdin API directly.
 *
 * Usage:
 * node crowdin-upload.js [--dry-run]
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const stat = promisify(fs.stat);

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

// Crowdin API configuration
const CROWDIN_API_KEY = '2dbd3a9f47ffc32607af62e1d677386c2ab67560859290214f97aa950e8c4cb92a8aa044d848e470';
const CROWDIN_PROJECT_NAME = 'divinci-ai-website';
const CROWDIN_API_BASE = 'https://api.crowdin.com/api/v2';

// Local paths
const LOCALES_DIR = path.resolve(__dirname, '..', 'locales');
const SOURCE_LOCALE = 'en';

/**
 * Make a request to the Crowdin API
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} endpoint - API endpoint
 * @param {Object|string} data - Request data (for POST/PUT requests)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Response data
 */
function crowdinRequest(method, endpoint, data = null, options = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'Authorization': `Bearer ${CROWDIN_API_KEY}`,
      'Content-Type': options.contentType || 'application/json'
    };

    // Add custom headers if provided
    if (options.headers) {
      Object.assign(headers, options.headers);
    }

    const requestOptions = {
      method,
      headers
    };

    const url = `${CROWDIN_API_BASE}${endpoint}`;
    console.log(`🌐 API ${method} ${url}`);

    if (isDryRun && (method !== 'GET')) {
      console.log(`🔍 DRY RUN: Would make ${method} request to ${url}`);
      if (data) {
        console.log(`🔍 With data: ${typeof data === 'string' ? data.substring(0, 100) + '...' : JSON.stringify(data, null, 2)}`);
      }
      resolve({ data: { id: 'dry-run-id' } });
      return;
    }

    const req = https.request(url, requestOptions, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          // Handle empty response
          if (!responseData.trim()) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({});
            } else {
              reject(new Error(`API request failed with status code: ${res.statusCode}`));
            }
            return;
          }

          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            reject(new Error(`API request failed: ${res.statusCode} ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}\nResponse: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`Request failed: ${error.message}`));
    });

    if (data) {
      if (typeof data === 'string') {
        req.write(data);
      } else {
        req.write(JSON.stringify(data));
      }
    }

    req.end();
  });
}

/**
 * Get or create a Crowdin project
 * @returns {Promise<string>} - Project ID
 */
async function getOrCreateProject() {
  try {
    // List all projects
    const projectsResponse = await crowdinRequest('GET', '/projects');
    const projects = projectsResponse.data || [];

    // Find the project by name
    const project = projects.find(project => project.data.name === CROWDIN_PROJECT_NAME);

    if (project) {
      console.log(`✅ Found existing project: ${CROWDIN_PROJECT_NAME} (ID: ${project.data.id})`);
      return project.data.id;
    }

    // Create a new project if it doesn't exist
    console.log(`🔄 Project ${CROWDIN_PROJECT_NAME} not found, creating...`);

    if (isDryRun) {
      console.log(`🔍 DRY RUN: Would create project ${CROWDIN_PROJECT_NAME}`);
      return 'dry-run-project-id';
    }

    const createResponse = await crowdinRequest('POST', '/projects', {
      name: CROWDIN_PROJECT_NAME,
      sourceLanguageId: 'en',
      targetLanguageIds: ['es', 'fr', 'ar']
    });

    console.log(`✅ Created new project: ${CROWDIN_PROJECT_NAME} (ID: ${createResponse.data.id})`);
    return createResponse.data.id;
  } catch (error) {
    console.error(`❌ Failed to get or create project: ${error.message}`);
    throw error;
  }
}

/**
 * Upload source files to Crowdin
 * @param {string} projectId - Crowdin project ID
 */
async function uploadSourceFiles(projectId) {
  console.log('📤 Uploading source files to Crowdin...');

  // Get all source files
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LOCALE);
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Error: Source directory ${sourceDir} does not exist.`);
    process.exit(1);
  }

  // Get all JSON files
  const files = await readdir(sourceDir);
  const jsonFiles = files.filter(file => file.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.warn(`⚠️ Warning: No source files found in ${sourceDir}`);
    return;
  }

  console.log(`📂 Found ${jsonFiles.length} source files to upload`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of jsonFiles) {
    const filePath = path.join(sourceDir, file);
    const fileContent = await readFile(filePath, 'utf8');
    const crowdinFilePath = `/${file}`;

    try {
      console.log(`📄 Processing ${file}...`);

      if (isDryRun) {
        console.log(`🔍 DRY RUN: Would upload file ${file} to Crowdin`);
        successCount++;
        continue;
      }

      // Upload to storage first
      const storageResponse = await crowdinRequest('POST', '/storages', {
        fileName: file
      }, {
        headers: {
          'Crowdin-API-FileName': file
        }
      });

      const storageId = storageResponse.data.id;

      // Upload file content to storage
      await crowdinRequest('PUT', `/storages/${storageId}`, fileContent, {
        contentType: 'application/octet-stream',
        headers: {
          'Crowdin-API-FileName': file
        }
      });

      // Check if file already exists in Crowdin
      const filesResponse = await crowdinRequest('GET', `/projects/${projectId}/files`);
      const files = filesResponse.data || [];
      const existingFile = files.find(f => f.data.name === file);

      if (existingFile) {
        // Update existing file
        await crowdinRequest('PUT', `/projects/${projectId}/files/${existingFile.data.id}`, {
          storageId
        });
        console.log(`✅ Successfully updated ${file}`);
      } else {
        // Add new file
        await crowdinRequest('POST', `/projects/${projectId}/files`, {
          storageId,
          name: file,
          type: 'json'
        });
        console.log(`✅ Successfully added ${file}`);
      }

      successCount++;
    } catch (error) {
      console.error(`❌ Failed to upload ${file}: ${error.message}`);
      errorCount++;
    }
  }

  console.log(`📊 Upload summary: ${successCount} succeeded, ${errorCount} failed`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting Crowdin upload process...');

    if (isDryRun) {
      console.log('🔍 DRY RUN MODE: No changes will be made to Crowdin');
    }

    // Get or create the project
    const projectId = await getOrCreateProject();

    // Upload source files
    await uploadSourceFiles(projectId);

    console.log('🎉 Crowdin upload process completed!');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the main function
main();
