#!/usr/bin/env node

/**
 * Fix Header CSS Duplication Script
 * 
 * This script fixes the CSS duplication issue in header files by adding
 * safety checks to prevent duplicate CSS link elements from being created.
 */

const fs = require('fs');
const path = require('path');

// Find all header files
const headerFiles = [
    'fr/includes/custom-header.html',
    'es/includes/custom-header.html',
    'fr/includes/header.html',
    'es/includes/header.html',
    'ar/includes/header.html'
];

// Function to add safety checks to CSS link creation
function fixHeaderFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        console.log(`Fixing ${filePath}...`);

        // Pattern 1: Basic CSS link creation without ID check
        const patterns = [
            {
                // Fonts CSS
                search: /(\s+)(\/\/ Load fonts?\.css)\s*\n(\s+)(const fontStyles = document\.createElement\('link'\);)\s*\n(\s+)(fontStyles\.rel = 'stylesheet';)\s*\n(\s+)(fontStyles\.href = [^;]+;)\s*\n(\s+)(document\.head\.appendChild\(fontStyles\);)/g,
                replace: '$1$2 (only if not already loaded)\n$1const fontsId = \'divinci-fonts-css\';\n$1if (!document.getElementById(fontsId)) {\n$3$4\n$3fontStyles.id = fontsId;\n$5$6\n$7$8\n$9$10\n$1}'
            },
            {
                // Sora styles
                search: /(\s+)(\/\/ Load Sora styles)\s*\n(\s+)(const soraStyles = document\.createElement\('link'\);)\s*\n(\s+)(soraStyles\.rel = 'stylesheet';)\s*\n(\s+)(soraStyles\.href = [^;]+;)\s*\n(\s+)(document\.head\.appendChild\(soraStyles\);)/g,
                replace: '$1$2 (only if not already loaded)\n$1const soraId = \'divinci-sora-css\';\n$1if (!document.getElementById(soraId)) {\n$3$4\n$3soraStyles.id = soraId;\n$5$6\n$7$8\n$9$10\n$1}'
            },
            {
                // Mobile header styles
                search: /(\s+)(\/\/ Load mobile header styles)\s*\n(\s+)(const mobileHeaderStyles = document\.createElement\('link'\);)\s*\n(\s+)(mobileHeaderStyles\.rel = 'stylesheet';)\s*\n(\s+)(mobileHeaderStyles\.href = [^;]+;)\s*\n(\s+)(document\.head\.appendChild\(mobileHeaderStyles\);)/g,
                replace: '$1$2 (only if not already loaded)\n$1const mobileId = \'divinci-mobile-header-css\';\n$1if (!document.getElementById(mobileId)) {\n$3$4\n$3mobileHeaderStyles.id = mobileId;\n$5$6\n$7$8\n$9$10\n$1}'
            },
            {
                // Custom header styles
                search: /(\s+)(\/\/ Load custom header styles)\s*\n(\s+)(const headerStyles = document\.createElement\('link'\);)\s*\n(\s+)(headerStyles\.rel = 'stylesheet';)\s*\n(\s+)(headerStyles\.href = [^;]+;)\s*\n(\s+)(document\.head\.appendChild\(headerStyles\);)/g,
                replace: '$1$2 (only if not already loaded)\n$1const headerStylesId = \'divinci-header-styles-css\';\n$1if (!document.getElementById(headerStylesId)) {\n$3$4\n$3headerStyles.id = headerStylesId;\n$5$6\n$7$8\n$9$10\n$1}'
            }
        ];

        // Apply each pattern
        patterns.forEach((pattern, index) => {
            const originalContent = content;
            content = content.replace(pattern.search, pattern.replace);
            if (content !== originalContent) {
                modified = true;
                console.log(`  ✅ Applied pattern ${index + 1}`);
            }
        });

        // Fallback: Simple replacements for any remaining unprotected CSS additions
        const simpleReplacements = [
            {
                search: /document\.head\.appendChild\(fontStyles\);(?!\s*\n\s*})/g,
                replace: 'if (!document.getElementById(\'divinci-fonts-css\')) {\n            fontStyles.id = \'divinci-fonts-css\';\n            document.head.appendChild(fontStyles);\n        }'
            },
            {
                search: /document\.head\.appendChild\(soraStyles\);(?!\s*\n\s*})/g,
                replace: 'if (!document.getElementById(\'divinci-sora-css\')) {\n            soraStyles.id = \'divinci-sora-css\';\n            document.head.appendChild(soraStyles);\n        }'
            },
            {
                search: /document\.head\.appendChild\(mobileHeaderStyles\);(?!\s*\n\s*})/g,
                replace: 'if (!document.getElementById(\'divinci-mobile-header-css\')) {\n            mobileHeaderStyles.id = \'divinci-mobile-header-css\';\n            document.head.appendChild(mobileHeaderStyles);\n        }'
            },
            {
                search: /document\.head\.appendChild\(headerStyles\);(?!\s*\n\s*})/g,
                replace: 'if (!document.getElementById(\'divinci-header-styles-css\')) {\n            headerStyles.id = \'divinci-header-styles-css\';\n            document.head.appendChild(headerStyles);\n        }'
            }
        ];

        simpleReplacements.forEach((replacement, index) => {
            const originalContent = content;
            content = content.replace(replacement.search, replacement.replace);
            if (content !== originalContent) {
                modified = true;
                console.log(`  ✅ Applied simple replacement ${index + 1}`);
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  ✅ Successfully updated ${filePath}`);
        } else {
            console.log(`  ℹ️  No changes needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Main execution
console.log('Starting to fix header CSS duplication...');

headerFiles.forEach(fixHeaderFile);

console.log('Finished fixing header CSS duplication');
