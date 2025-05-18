# Crowdin Integration Scripts

This directory contains scripts for integrating with Crowdin for translations.

## Scripts

- **crowdin-sync.js**: Synchronizes translation files between your local project and Crowdin
- **crowdin-batch.js**: Runs a complete Crowdin workflow in a single command

## Features

- Upload source files to Crowdin
- Download translated files from Crowdin
- Pre-translate content using machine translation
- Check translation status
- Generate translated pages
- Interactive configuration setup
- Dry run mode for testing

## Prerequisites

- Node.js installed
- `curl` and `unzip` commands available
- A Crowdin account and project

## Installation

1. Make sure you have Node.js installed
2. Ensure `curl` and `unzip` commands are available in your environment
3. Run `node crowdin-sync.js init` to set up your configuration

## Usage

### Crowdin Sync Script

```bash
# Initialize configuration
node crowdin-sync.js init

# Upload source files to Crowdin
node crowdin-sync.js upload

# Download translations from Crowdin
node crowdin-sync.js download

# Pre-translate content using machine translation
node crowdin-sync.js pre-translate

# Check translation status
node crowdin-sync.js status

# Use dry run mode to simulate actions without making changes
node crowdin-sync.js upload --dry-run
```

### Crowdin Batch Script

```bash
# Run the complete workflow (upload, pre-translate, download, generate)
node crowdin-batch.js

# Run in dry run mode (simulate actions without making changes)
node crowdin-batch.js --dry-run

# Skip specific steps
node crowdin-batch.js --skip-upload
node crowdin-batch.js --skip-translate
node crowdin-batch.js --skip-download
node crowdin-batch.js --skip-generate

# Combine options
node crowdin-batch.js --skip-translate --dry-run
```

## Configuration

The script uses a configuration file (`crowdin-config.json`) with the following settings:

- `apiKey`: Your Crowdin API key
- `projectId`: Your Crowdin project ID
- `apiBase`: Crowdin API base URL
- `sourceLocale`: Source language code (e.g., "en")
- `targetLocales`: Array of target language codes (e.g., ["es", "fr"])
- `localesDir`: Path to your locales directory
- `fileFormats`: Array of supported file extensions (e.g., [".json"])
- `excludeFiles`: Array of files to exclude from sync

You can edit this file directly or run `node crowdin-sync.js init` to set up your configuration interactively.

## Workflow

### Initial Setup

1. Run `node crowdin-sync.js init` to configure the script
2. Run `node crowdin-sync.js upload` to upload your source files to Crowdin
3. Run `node crowdin-sync.js pre-translate` to generate initial translations using machine translation
4. Run `node crowdin-sync.js download` to download the translated files

### Ongoing Maintenance

1. When you update source files, run `node crowdin-sync.js upload` to update them in Crowdin
2. Run `node crowdin-sync.js status` to check translation progress
3. Run `node crowdin-sync.js download` to get the latest translations

## Troubleshooting

### API Errors

If you encounter API errors:
- Check that your API key is correct
- Verify that your project ID is correct
- Ensure you have the necessary permissions

### File Format Issues

If you have issues with file formats:
- Ensure your JSON files are valid
- Check that the file structure matches what Crowdin expects

### Download Issues

If you have issues downloading translations:
- Check that `curl` and `unzip` are installed and available in your PATH
- Ensure you have write permissions to the download directory
- Check your network connection

## Support

If you need help with this script, please contact your development team's internationalization lead.
