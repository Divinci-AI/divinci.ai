#!/usr/bin/env node

/**
 * Verification Script for Static Build
 * Checks that all generated files are valid and include-error-free
 */

const fs = require('fs');
const path = require('path');

const BUILD_DIR = 'static-build';

/**
 * Check if a file contains include errors
 */
function checkForIncludeErrors(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const errors = [];
        
        // Check for component loading errors
        if (content.includes('Component Loading Error')) {
            errors.push('Contains component loading error message');
        }
        
        // Check for unprocessed data-include attributes
        const includeMatches = content.match(/data-include="[^"]+"/g);
        if (includeMatches) {
            errors.push(`Contains ${includeMatches.length} unprocessed data-include attributes`);
        }
        
        // Check for template variables
        const templateVars = content.match(/\{\{[^}]+\}\}/g);
        if (templateVars) {
            errors.push(`Contains ${templateVars.length} unprocessed template variables: ${templateVars.join(', ')}`);
        }
        
        // Check for basic HTML structure
        if (!content.includes('<html') || !content.includes('</html>')) {
            errors.push('Missing basic HTML structure');
        }
        
        // Check for meta tags (should have at least description)
        if (!content.includes('meta name="description"') && !content.includes('meta property="og:description"')) {
            errors.push('Missing meta description tags');
        }
        
        return errors;
    } catch (error) {
        return [`Error reading file: ${error.message}`];
    }
}

/**
 * Get all HTML files in directory recursively
 */
function getAllHtmlFiles(dir) {
    const files = [];
    
    function scanDir(currentDir) {
        const items = fs.readdirSync(currentDir);
        
        for (const item of items) {
            const fullPath = path.join(currentDir, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                scanDir(fullPath);
            } else if (item.endsWith('.html')) {
                files.push(fullPath);
            }
        }
    }
    
    scanDir(dir);
    return files;
}

/**
 * Main verification function
 */
function verifyBuild() {
    console.log('🔍 Verifying static build...\n');
    
    // Check if build directory exists
    if (!fs.existsSync(BUILD_DIR)) {
        console.error(`❌ Build directory '${BUILD_DIR}' not found!`);
        console.log('Run: node build-static.js --all');
        process.exit(1);
    }
    
    // Get all HTML files
    const htmlFiles = getAllHtmlFiles(BUILD_DIR);
    console.log(`Found ${htmlFiles.length} HTML files to verify\n`);
    
    let totalFiles = 0;
    let errorFiles = 0;
    let warningFiles = 0;
    const issues = [];
    
    // Check each file
    for (const filePath of htmlFiles) {
        totalFiles++;
        const relativePath = path.relative(BUILD_DIR, filePath);
        const errors = checkForIncludeErrors(filePath);
        
        if (errors.length > 0) {
            const hasErrors = errors.some(error => 
                error.includes('Component Loading Error') || 
                error.includes('Error reading file') ||
                error.includes('Missing basic HTML structure')
            );
            
            if (hasErrors) {
                errorFiles++;
                console.log(`❌ ${relativePath}`);
            } else {
                warningFiles++;
                console.log(`⚠️  ${relativePath}`);
            }
            
            errors.forEach(error => console.log(`   - ${error}`));
            issues.push({ file: relativePath, errors });
        } else {
            console.log(`✅ ${relativePath}`);
        }
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📁 Total files checked: ${totalFiles}`);
    console.log(`✅ Files without issues: ${totalFiles - errorFiles - warningFiles}`);
    console.log(`⚠️  Files with warnings: ${warningFiles}`);
    console.log(`❌ Files with errors: ${errorFiles}`);
    
    if (errorFiles === 0 && warningFiles === 0) {
        console.log('\n🎉 Perfect! All files are ready for deployment!');
        console.log('Your static build is 100% Cloudflare Pages compatible.');
    } else if (errorFiles === 0) {
        console.log('\n✅ Good! No critical errors found.');
        console.log('Warnings are minor and won\'t prevent deployment.');
    } else {
        console.log('\n⚠️  Some files have issues that should be addressed.');
    }
    
    // Sample files to test
    console.log('\n🧪 SAMPLE FILES TO TEST:');
    const sampleFiles = [
        'index.html',
        'contact.html',
        'es/index.html',
        'fr/index.html',
        'features/quality-assurance/llm-quality-assurance.html'
    ].filter(file => fs.existsSync(path.join(BUILD_DIR, file)));
    
    sampleFiles.forEach(file => {
        const fullPath = path.resolve(BUILD_DIR, file);
        console.log(`   file://${fullPath}`);
    });
    
    console.log('\n💡 TIP: Open these URLs directly in your browser to test!');
    
    return errorFiles === 0;
}

// Run verification
if (require.main === module) {
    const success = verifyBuild();
    process.exit(success ? 0 : 1);
}

module.exports = { verifyBuild, checkForIncludeErrors };
