#!/usr/bin/env node

/**
 * Fix EOL Issue Script
 * 
 * This script removes the "EOL < /dev/null" line from all HTML files
 * that have this issue.
 */

const fs = require('fs');
const path = require('path');

// Function to recursively find all HTML files
function findHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            // Skip node_modules, .git, and other non-relevant directories
            if (!file.startsWith('.') && file !== 'node_modules' && file !== 'tests-new') {
                findHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Function to fix EOL issue in a file
function fixEolIssue(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if file has the EOL issue
        if (content.includes('EOL < /dev/null')) {
            console.log(`Fixing ${filePath}...`);
            
            // Remove the EOL line and any trailing whitespace
            const fixedContent = content
                .replace(/\nEOL < \/dev\/null\s*$/, '')
                .replace(/EOL < \/dev\/null\s*$/, '')
                .trimEnd() + '\n';
            
            fs.writeFileSync(filePath, fixedContent, 'utf8');
            console.log(`✓ Fixed ${filePath}`);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
        return false;
    }
}

// Main function
function main() {
    console.log('🔄 Fixing EOL < /dev/null issues in HTML files...\n');
    
    // Find all HTML files
    const htmlFiles = findHtmlFiles('.');
    console.log(`Found ${htmlFiles.length} HTML files to check.\n`);
    
    let fixedCount = 0;
    
    htmlFiles.forEach(filePath => {
        if (fixEolIssue(filePath)) {
            fixedCount++;
        }
    });
    
    console.log(`\n✅ Fixed ${fixedCount} files with EOL issues!`);
    
    if (fixedCount === 0) {
        console.log('🎉 No EOL issues found - all files are clean!');
    } else {
        console.log('\n📝 Next steps:');
        console.log('1. Test the sites by opening HTML files directly in a browser');
        console.log('2. Verify language switching works correctly');
        console.log('3. Run the inline-includes script if needed: npm run inline-includes');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { fixEolIssue, findHtmlFiles };
