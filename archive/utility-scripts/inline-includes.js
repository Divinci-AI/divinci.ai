#!/usr/bin/env node

/**
 * Inline Includes Script
 *
 * This script processes HTML files and inlines the content from data-include attributes
 * to make the site work with static hosting (like Cloudflare Pages) without CORS issues.
 */

const fs = require('fs');
const path = require('path');

// Files to process
const filesToProcess = [
    'index.html',
    'fr/index.html',
    'es/index.html',
    'ar/index.html'
];

// Function to read file content
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
        return null;
    }
}

// Function to write file content
function writeFile(filePath, content) {
    try {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Updated ${filePath}`);
    } catch (error) {
        console.error(`Error writing file ${filePath}:`, error.message);
    }
}

// Function to resolve include path based on the HTML file location
function resolveIncludePath(htmlFilePath, includePath) {
    const htmlDir = path.dirname(htmlFilePath);

    // For relative paths, resolve them relative to the HTML file's directory
    if (includePath.startsWith('../') || includePath.startsWith('./')) {
        return path.resolve(htmlDir, includePath);
    }

    // For absolute paths starting with includes/, resolve relative to HTML file
    if (includePath.startsWith('includes/')) {
        if (htmlDir !== '.' && htmlDir !== '') {
            // We're in a subdirectory, so includes are at ../includes/
            return path.resolve(htmlDir, '..', includePath);
        } else {
            // We're in root directory
            return path.resolve(includePath);
        }
    }

    // Default: resolve relative to HTML file directory
    return path.resolve(htmlDir, includePath);
}

// Function to process includes in HTML content
function processIncludes(htmlContent, htmlFilePath) {
    // Match data-include attributes - handle both simple divs and divs with additional attributes
    const includeRegex = /<div[^>]*data-include="([^"]+)"[^>]*>[\s\S]*?<\/div>/g;

    return htmlContent.replace(includeRegex, (match, includePath) => {
        console.log(`  Processing include: ${includePath}`);

        // Resolve the actual file path
        const resolvedPath = resolveIncludePath(htmlFilePath, includePath);
        const includeContent = readFile(resolvedPath);

        if (!includeContent) {
            console.warn(`  Warning: Include file not found: ${resolvedPath}`);
            return `<!-- Include not found: ${includePath} -->`;
        }

        return includeContent;
    });
}

// Function to remove include-html.js script references
function removeIncludeScript(htmlContent) {
    // Remove script tags that load include-html.js
    return htmlContent
        .replace(/<script[^>]*src="[^"]*include-html[^"]*"[^>]*><\/script>/g, '')
        .replace(/<script[^>]*src="[^"]*include-html[^"]*"[^>]*><\/script>/g, '')
        // Remove the DOMContentLoaded event that calls includeHTML()
        .replace(/document\.addEventListener\('DOMContentLoaded',\s*function\(\)\s*\{\s*includeHTML\(\);\s*\}\);?/g, '')
        // Remove standalone includeHTML() calls
        .replace(/includeHTML\(\);?/g, '');
}

// Main function
function main() {
    console.log('🔄 Inlining includes for static site deployment...\n');

    filesToProcess.forEach(filePath => {
        console.log(`Processing ${filePath}...`);

        const htmlContent = readFile(filePath);
        if (!htmlContent) {
            console.error(`❌ Failed to read ${filePath}`);
            return;
        }

        // Process includes
        let processedContent = processIncludes(htmlContent, filePath);

        // Remove include-html.js script references since we're inlining everything
        processedContent = removeIncludeScript(processedContent);

        // Write the processed content back
        writeFile(filePath, processedContent);
    });

    console.log('\n✅ All includes have been inlined!');
    console.log('\n📝 Next steps:');
    console.log('1. Test the site by opening index.html directly in a browser');
    console.log('2. Verify language switching works correctly');
    console.log('3. Deploy to Cloudflare Pages');
    console.log('\n💡 Note: After making changes to include files, run this script again to update all HTML files.');
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { processIncludes, resolveIncludePath };
