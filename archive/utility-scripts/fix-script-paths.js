#!/usr/bin/env node

/**
 * Fix Script Paths
 * 
 * This script fixes the paths to the JavaScript files based on the file location
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

// Function to determine the correct path prefix based on file location
function getPathPrefix(filePath) {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    // Count directory depth
    const depth = normalizedPath.split('/').length - 1;
    
    if (normalizedPath.includes('/features/')) {
        return '../../';
    } else if (normalizedPath.match(/^\.\/(fr|es|ar)\//)) {
        return '../';
    } else if (normalizedPath.includes('/blog/')) {
        return '../../';
    } else {
        return '';
    }
}

// Function to fix script paths in a single HTML file
function fixScriptPaths(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        const pathPrefix = getPathPrefix(filePath);
        
        // Fix include-html.js path
        const includeRegex = /<script\s+src="[^"]*js\/include-html\.js"[^>]*><\/script>/g;
        if (content.match(includeRegex)) {
            const correctPath = pathPrefix + 'js/include-html.js';
            content = content.replace(includeRegex, `<script src="${correctPath}"></script>`);
            modified = true;
        }
        
        // Fix infinite-reload-fix.js path
        const fixRegex = /<script\s+src="[^"]*js\/infinite-reload-fix\.js"[^>]*><\/script>/g;
        if (content.match(fixRegex)) {
            const correctPath = pathPrefix + 'js/infinite-reload-fix.js';
            content = content.replace(fixRegex, `<script src="${correctPath}"></script>`);
            modified = true;
        }
        
        // Fix resource-loading-debugger.js path
        const debuggerRegex = /<script\s+src="[^"]*js\/resource-loading-debugger\.js"[^>]*><\/script>/g;
        if (content.match(debuggerRegex)) {
            const correctPath = pathPrefix + 'js/resource-loading-debugger.js';
            content = content.replace(debuggerRegex, `<script src="${correctPath}"></script>`);
            modified = true;
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Fixed script paths in ${filePath} (prefix: "${pathPrefix}")`);
        }
        
    } catch (error) {
        console.error(`Error processing ${filePath}:`, error.message);
    }
}

// Main execution
console.log('Starting to fix script paths...');

// Find all HTML files
const htmlFiles = findHtmlFiles('.');

console.log(`Found ${htmlFiles.length} HTML files to check`);

// Process each file
htmlFiles.forEach(fixScriptPaths);

console.log('Finished fixing script paths');
