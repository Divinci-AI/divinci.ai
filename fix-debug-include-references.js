#!/usr/bin/env node

/**
 * Fix Debug Include References Script
 * 
 * This script replaces all references to debug-include.js with include-html.js
 * and adds the infinite reload fix script to prevent resource loading loops.
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
            // Skip node_modules, .git, and other common directories
            if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
                findHtmlFiles(filePath, fileList);
            }
        } else if (file.endsWith('.html')) {
            fileList.push(filePath);
        }
    });
    
    return fileList;
}

// Function to fix a single HTML file
function fixHtmlFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Replace debug-include.js with include-html.js
        if (content.includes('debug-include.js')) {
            console.log(`Fixing ${filePath}...`);
            
            // Replace all instances of debug-include.js with include-html.js
            content = content.replace(/debug-include\.js/g, 'js/include-html.js');
            
            // Add infinite reload fix script if not already present
            if (!content.includes('infinite-reload-fix.js')) {
                // Find the debug-include.js script tag and add the fix after it
                const scriptRegex = /<script\s+src="[^"]*js\/include-html\.js"[^>]*><\/script>/;
                const match = content.match(scriptRegex);
                
                if (match) {
                    const fixScript = '\n    <script src="js/infinite-reload-fix.js"></script>';
                    content = content.replace(match[0], match[0] + fixScript);
                    console.log(`  - Added infinite reload fix script`);
                }
            }
            
            modified = true;
        }
        
        // Write the file back if it was modified
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`  - Successfully updated ${filePath}`);
        }
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Main execution
console.log('Starting to fix debug-include.js references...');

// Find all HTML files
const htmlFiles = findHtmlFiles('.');

console.log(`Found ${htmlFiles.length} HTML files to check`);

// Process each file
htmlFiles.forEach(fixHtmlFile);

console.log('Finished fixing debug-include.js references');
