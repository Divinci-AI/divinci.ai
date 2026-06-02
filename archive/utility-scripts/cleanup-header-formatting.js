#!/usr/bin/env node

/**
 * Cleanup Header Formatting Script
 * 
 * This script cleans up the formatting in header files after the CSS duplication fix.
 */

const fs = require('fs');

const headerFiles = [
    'includes/header.html',
    'ar/includes/custom-header.html',
    'fr/includes/custom-header.html',
    'es/includes/custom-header.html',
    'fr/includes/header.html',
    'es/includes/header.html',
    'ar/includes/header.html'
];

function cleanupHeaderFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        
        // Remove excessive blank lines
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
        
        // Fix indentation issues
        content = content.replace(/^(\s+)const (fontsId|soraId|mobileId|headerStylesId) = /gm, '        const $2 = ');
        content = content.replace(/^(\s+)if \(!document\.getElementById\(/gm, '        if (!document.getElementById(');
        content = content.replace(/^(\s+)(fontStyles|soraStyles|mobileHeaderStyles|headerStyles)\./gm, '            $2.');
        content = content.replace(/^(\s+)document\.head\.appendChild\(/gm, '            document.head.appendChild(');
        content = content.replace(/^(\s+)}\s*$/gm, '        }');
        
        // Ensure proper spacing around blocks
        content = content.replace(/(\s+\/\/ Load [^(]+\(only if not already loaded\))\n\n\n(\s+const)/g, '$1\n$2');
        content = content.replace(/(\s+})\n\n(\s+\/\/ Load)/g, '$1\n\n$2');
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Cleaned up formatting in ${filePath}`);

    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

console.log('Starting header formatting cleanup...');
headerFiles.forEach(cleanupHeaderFile);
console.log('Finished header formatting cleanup');
