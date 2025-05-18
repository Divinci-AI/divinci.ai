/**
 * Crowdin Sync Script
 *
 * This script synchronizes translation files with Crowdin:
 * 1. Uploads source files (English) to Crowdin
 * 2. Downloads translated files from Crowdin
 * 3. Manages translation workflow
 *
 * Usage:
 * - To upload source files: node crowdin-sync.js upload [--dry-run]
 * - To download translations: node crowdin-sync.js download [--dry-run]
 * - To pre-translate content: node crowdin-sync.js pre-translate [--dry-run]
 * - To check translation status: node crowdin-sync.js status
 * - To initialize config: node crowdin-sync.js init
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { exec } = require('child_process');
const readline = require('readline');

// Default configuration
const DEFAULT_CONFIG = {
  apiKey: '2dbd3a9f47ffc32607af62e1d677386c2ab67560859290214f97aa950e8c4cb92a8aa044d848e470',
  projectId: '', // Will be set during initialization
  apiBase: 'https://api.crowdin.com/api/v2',
  sourceLocale: 'en',
  targetLocales: ['es', 'fr'], // Default target languages
  localesDir: './locales',
  fileFormats: ['.json'], // Supported file formats
  excludeFiles: [] // Files to exclude from sync
};

// Config file path
const CONFIG_FILE_PATH = path.join(__dirname, 'crowdin-config.json');

// Load configuration
let config;
try {
  if (fs.existsSync(CONFIG_FILE_PATH)) {
    config = JSON.parse(fs.readFileSync(CONFIG_FILE_PATH, 'utf8'));
    console.log('Loaded configuration from crowdin-config.json');
  } else {
    config = { ...DEFAULT_CONFIG };
    console.log('Using default configuration. Run "node crowdin-sync.js init" to create a config file.');
  }
} catch (error) {
  console.error(`Error loading configuration: ${error.message}`);
  config = { ...DEFAULT_CONFIG };
}

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
if (isDryRun) {
  console.log('🔍 DRY RUN MODE: No changes will be made to Crowdin or local files');
}

// Validate configuration
if (!config.apiKey) {
  console.error('Error: Crowdin API key is not set. Please run "node crowdin-sync.js init" to configure.');
  process.exit(1);
}

// Constants from config
const CROWDIN_API_KEY = config.apiKey;
const CROWDIN_PROJECT_ID = config.projectId;
const CROWDIN_API_BASE = config.apiBase;

// Local paths
const LOCALES_DIR = path.resolve(config.localesDir);
const SOURCE_LOCALE = config.sourceLocale;

/**
 * Create a readline interface for user input
 * @returns {readline.Interface} - Readline interface
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask a question and get user input
 * @param {string} question - Question to ask
 * @param {readline.Interface} rl - Readline interface
 * @returns {Promise<string>} - User input
 */
function askQuestion(question, rl) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

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
 * Check if a file exists in Crowdin
 * @param {string} filePath - File path in Crowdin
 * @returns {Promise<boolean>} - Whether the file exists
 */
async function fileExistsInCrowdin(filePath) {
  try {
    const response = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}/files`);
    const files = response.data || [];
    return files.some(file => file.data.path === filePath);
  } catch (error) {
    console.error(`Error checking if file exists: ${error.message}`);
    return false;
  }
}

/**
 * Get file ID from Crowdin by path
 * @param {string} filePath - File path in Crowdin
 * @returns {Promise<string|null>} - File ID or null if not found
 */
async function getFileIdByPath(filePath) {
  try {
    const response = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}/files`);
    const files = response.data || [];
    const file = files.find(file => file.data.path === filePath);
    return file ? file.data.id : null;
  } catch (error) {
    console.error(`Error getting file ID: ${error.message}`);
    return null;
  }
}

/**
 * Upload source files to Crowdin
 */
async function uploadSourceFiles() {
  console.log('📤 Uploading source files to Crowdin...');

  if (!CROWDIN_PROJECT_ID) {
    console.error('❌ Error: Project ID is not set. Please run "node crowdin-sync.js init" to configure.');
    process.exit(1);
  }

  // Get all source files
  const sourceDir = path.join(LOCALES_DIR, SOURCE_LOCALE);
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Error: Source directory ${sourceDir} does not exist.`);
    process.exit(1);
  }

  // Get all files with supported extensions
  const files = fs.readdirSync(sourceDir)
    .filter(file => config.fileFormats.some(format => file.endsWith(format)))
    .filter(file => !config.excludeFiles.includes(file));

  if (files.length === 0) {
    console.warn(`⚠️ Warning: No source files found in ${sourceDir}`);
    return;
  }

  console.log(`📂 Found ${files.length} source files to upload`);

  let successCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const crowdinFilePath = `/${file}`;

    try {
      console.log(`📄 Processing ${file}...`);

      // Check if file already exists in Crowdin
      const fileId = await getFileIdByPath(crowdinFilePath);

      if (fileId) {
        console.log(`🔄 File ${file} already exists in Crowdin, updating...`);

        if (isDryRun) {
          console.log(`🔍 DRY RUN: Would update file ${file} in Crowdin`);
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

        // Update existing file
        await crowdinRequest('PUT', `/projects/${CROWDIN_PROJECT_ID}/files/${fileId}`, {
          storageId
        });

        console.log(`✅ Successfully updated ${file}`);
      } else {
        console.log(`➕ File ${file} does not exist in Crowdin, adding...`);

        if (isDryRun) {
          console.log(`🔍 DRY RUN: Would add file ${file} to Crowdin`);
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

        // Add file to project
        await crowdinRequest('POST', `/projects/${CROWDIN_PROJECT_ID}/files`, {
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
 * Download translated files from Crowdin
 */
async function downloadTranslations() {
  console.log('📥 Downloading translations from Crowdin...');

  if (!CROWDIN_PROJECT_ID) {
    console.error('❌ Error: Project ID is not set. Please run "node crowdin-sync.js init" to configure.');
    process.exit(1);
  }

  try {
    // 1. Build translations on Crowdin
    console.log('🔨 Building translations...');

    if (isDryRun) {
      console.log('🔍 DRY RUN: Would build translations on Crowdin');
      console.log('🔍 DRY RUN: Would download translations from Crowdin');
      return;
    }

    const buildResponse = await crowdinRequest('POST', `/projects/${CROWDIN_PROJECT_ID}/translations/builds`);

    const buildId = buildResponse.data.id;

    // Wait for build to complete
    console.log('⏳ Waiting for build to complete...');
    let buildStatus = 'inProgress';
    let dots = 0;

    while (buildStatus === 'inProgress') {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

      const statusResponse = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}/translations/builds/${buildId}`);
      buildStatus = statusResponse.data.status;

      // Show progress indicator
      process.stdout.write(`\r⏳ Build status: ${buildStatus} ${'.'.repeat(dots)}`);
      dots = (dots + 1) % 4;
    }

    console.log(''); // New line after progress indicator

    if (buildStatus !== 'finished') {
      throw new Error(`Build failed with status: ${buildStatus}`);
    }

    console.log('✅ Build completed successfully');

    // 2. Download translations
    console.log('📦 Downloading translations...');
    const downloadResponse = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}/translations/builds/${buildId}/download`);

    const downloadUrl = downloadResponse.data.url;

    // Download and extract the ZIP file
    const downloadDir = path.join(__dirname, 'crowdin-download');
    if (fs.existsSync(downloadDir)) {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    }

    fs.mkdirSync(downloadDir, { recursive: true });

    const zipPath = path.join(downloadDir, 'translations.zip');

    // Download the ZIP file using curl
    console.log(`📥 Downloading from ${downloadUrl}`);
    await new Promise((resolve, reject) => {
      exec(`curl -L "${downloadUrl}" -o "${zipPath}"`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Download failed: ${error.message}`));
          return;
        }
        resolve();
      });
    });

    // Extract the ZIP file
    console.log('📂 Extracting translations...');
    await new Promise((resolve, reject) => {
      exec(`unzip -o "${zipPath}" -d "${downloadDir}"`, (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`Extraction failed: ${error.message}`));
          return;
        }
        resolve();
      });
    });

    // 3. Copy translations to locales directory
    console.log('📋 Copying translations to locales directory...');

    // Get all language directories
    const languages = config.targetLocales;
    let successCount = 0;
    let errorCount = 0;

    for (const lang of languages) {
      const langDir = path.join(LOCALES_DIR, lang);

      // Create language directory if it doesn't exist
      if (!fs.existsSync(langDir)) {
        fs.mkdirSync(langDir, { recursive: true });
      }

      // Find the language directory in the downloaded files
      const langDirInZip = path.join(downloadDir, lang);

      if (!fs.existsSync(langDirInZip)) {
        console.warn(`⚠️ Warning: No translations found for language ${lang}`);
        continue;
      }

      // Copy all files with supported extensions
      const files = fs.readdirSync(langDirInZip)
        .filter(file => config.fileFormats.some(format => file.endsWith(format)))
        .filter(file => !config.excludeFiles.includes(file));

      for (const file of files) {
        try {
          const sourcePath = path.join(langDirInZip, file);
          const destPath = path.join(langDir, file);

          fs.copyFileSync(sourcePath, destPath);
          console.log(`✅ Copied ${lang}/${file}`);
          successCount++;
        } catch (error) {
          console.error(`❌ Failed to copy ${lang}/${file}: ${error.message}`);
          errorCount++;
        }
      }
    }

    // Clean up
    fs.rmSync(downloadDir, { recursive: true, force: true });

    console.log(`📊 Download summary: ${successCount} files copied, ${errorCount} failed`);
  } catch (error) {
    console.error(`❌ Failed to download translations: ${error.message}`);
  }
}

/**
 * Pre-translate content using Crowdin's machine translation
 */
async function preTranslateContent() {
  console.log('🤖 Pre-translating content using machine translation...');

  if (!CROWDIN_PROJECT_ID) {
    console.error('❌ Error: Project ID is not set. Please run "node crowdin-sync.js init" to configure.');
    process.exit(1);
  }

  try {
    // Get all files in the project
    const filesResponse = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}/files`);
    const files = filesResponse.data || [];

    if (files.length === 0) {
      console.warn('⚠️ Warning: No files found in the project. Upload source files first.');
      return;
    }

    console.log(`📂 Found ${files.length} files in the project`);

    // Get all target languages
    const languages = config.targetLocales;

    if (languages.length === 0) {
      console.warn('⚠️ Warning: No target languages configured.');
      return;
    }

    console.log(`🌐 Target languages: ${languages.join(', ')}`);

    if (isDryRun) {
      console.log(`🔍 DRY RUN: Would pre-translate ${files.length} files to ${languages.length} languages`);
      return;
    }

    // Create pre-translation job
    console.log('🔄 Creating pre-translation job...');
    const preTranslateResponse = await crowdinRequest('POST', `/projects/${CROWDIN_PROJECT_ID}/pre-translations`, {
      languageIds: languages,
      fileIds: files.map(file => file.data.id),
      method: 'mt',
      engineId: 1, // Google Translate
      autoApproveOption: 'all'
    });

    const preTranslateId = preTranslateResponse.data.identifier;

    // Wait for pre-translation to complete
    console.log('⏳ Waiting for pre-translation to complete...');
    let preTranslateStatus = 'created';
    let dots = 0;

    while (['created', 'inProgress'].includes(preTranslateStatus)) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

      const statusResponse = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}/pre-translations/${preTranslateId}`);
      preTranslateStatus = statusResponse.data.status;

      // Show progress indicator
      process.stdout.write(`\r⏳ Pre-translation status: ${preTranslateStatus} ${'.'.repeat(dots)}`);
      dots = (dots + 1) % 4;
    }

    console.log(''); // New line after progress indicator

    if (preTranslateStatus === 'finished') {
      console.log('✅ Pre-translation completed successfully');
    } else {
      console.error(`❌ Pre-translation failed with status: ${preTranslateStatus}`);
    }
  } catch (error) {
    console.error(`❌ Failed to pre-translate content: ${error.message}`);
  }
}

/**
 * Check translation status
 */
async function checkTranslationStatus() {
  console.log('📊 Checking translation status...');

  if (!CROWDIN_PROJECT_ID) {
    console.error('❌ Error: Project ID is not set. Please run "node crowdin-sync.js init" to configure.');
    process.exit(1);
  }

  try {
    // Get project details
    const projectResponse = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}`);
    const project = projectResponse.data;

    console.log(`📁 Project: ${project.name} (ID: ${project.id})`);

    // Get all files in the project
    const filesResponse = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}/files`);
    const files = filesResponse.data || [];

    console.log(`📂 Files: ${files.length}`);

    // Get all target languages
    const languages = config.targetLocales;
    console.log(`🌐 Target languages: ${languages.join(', ')}`);

    // Get translation progress for each language
    console.log('\n📈 Translation Progress:');
    console.log('======================');

    for (const lang of languages) {
      try {
        const progressResponse = await crowdinRequest('GET', `/projects/${CROWDIN_PROJECT_ID}/languages/${lang}/progress`);
        const progress = progressResponse.data || [];

        if (progress.length === 0) {
          console.log(`${lang}: No progress data available`);
          continue;
        }

        // Calculate overall progress
        const totalWords = progress.reduce((sum, item) => sum + item.data.words.total, 0);
        const translatedWords = progress.reduce((sum, item) => sum + item.data.words.translated, 0);
        const approvedWords = progress.reduce((sum, item) => sum + item.data.words.approved, 0);

        const translationProgress = totalWords > 0 ? Math.round((translatedWords / totalWords) * 100) : 0;
        const approvalProgress = totalWords > 0 ? Math.round((approvedWords / totalWords) * 100) : 0;

        console.log(`${lang}: ${translationProgress}% translated, ${approvalProgress}% approved (${translatedWords}/${totalWords} words)`);

        // Show progress for each file
        for (const item of progress) {
          const fileId = item.data.fileId;
          const file = files.find(f => f.data.id === fileId);
          const fileName = file ? file.data.name : `File ID ${fileId}`;
          const fileProgress = Math.round(item.data.translationProgress);

          console.log(`  - ${fileName}: ${fileProgress}% translated`);
        }

        console.log(''); // Empty line between languages
      } catch (error) {
        console.error(`❌ Failed to get progress for ${lang}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Failed to check translation status: ${error.message}`);
  }
}

/**
 * Initialize Crowdin configuration
 */
async function initConfig() {
  console.log('🔧 Initializing Crowdin configuration...');

  const rl = createReadlineInterface();

  try {
    // Ask for project ID
    const projectId = await askQuestion('Enter your Crowdin project ID: ', rl);
    if (!projectId.trim()) {
      console.error('❌ Project ID is required.');
      return;
    }

    // Ask for API key (use default if empty)
    const defaultApiKey = config.apiKey;
    const apiKey = await askQuestion(`Enter your Crowdin API key (press Enter to use existing key): `, rl);

    // Ask for source locale
    const defaultSourceLocale = config.sourceLocale;
    const sourceLocale = await askQuestion(`Enter source locale (press Enter for default "${defaultSourceLocale}"): `, rl);

    // Ask for target locales
    const defaultTargetLocales = config.targetLocales.join(', ');
    const targetLocalesInput = await askQuestion(`Enter target locales, comma-separated (press Enter for default "${defaultTargetLocales}"): `, rl);

    // Ask for locales directory
    const defaultLocalesDir = config.localesDir;
    const localesDir = await askQuestion(`Enter path to locales directory (press Enter for default "${defaultLocalesDir}"): `, rl);

    // Create new configuration
    const newConfig = {
      ...config,
      projectId: projectId.trim(),
      apiKey: apiKey.trim() || defaultApiKey,
      sourceLocale: sourceLocale.trim() || defaultSourceLocale,
      targetLocales: targetLocalesInput.trim() ? targetLocalesInput.split(',').map(lang => lang.trim()) : config.targetLocales,
      localesDir: localesDir.trim() || defaultLocalesDir
    };

    // Save configuration
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(newConfig, null, 2));

    console.log('✅ Configuration saved to crowdin-config.json');
    console.log('📝 You can edit this file directly to make further changes.');
  } catch (error) {
    console.error(`❌ Failed to initialize configuration: ${error.message}`);
  } finally {
    rl.close();
  }
}

/**
 * Main function
 */
async function main() {
  const command = process.argv[2];

  switch (command) {
    case 'upload':
      await uploadSourceFiles();
      break;
    case 'download':
      await downloadTranslations();
      break;
    case 'pre-translate':
      await preTranslateContent();
      break;
    case 'status':
      await checkTranslationStatus();
      break;
    case 'init':
      await initConfig();
      break;
    default:
      console.log('📚 Crowdin Sync Script');
      console.log('====================');
      console.log('Usage:');
      console.log('  node crowdin-sync.js init         - Initialize Crowdin configuration');
      console.log('  node crowdin-sync.js upload       - Upload source files to Crowdin');
      console.log('  node crowdin-sync.js download     - Download translations from Crowdin');
      console.log('  node crowdin-sync.js pre-translate - Pre-translate content using machine translation');
      console.log('  node crowdin-sync.js status       - Check translation status');
      console.log('\nOptions:');
      console.log('  --dry-run                        - Simulate actions without making changes');
      break;
  }
}

main().catch(error => {
  console.error(`❌ Error: ${error.message}`);
  process.exit(1);
});
