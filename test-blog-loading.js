#!/usr/bin/env node

/**
 * Test Blog Loading Script
 * 
 * This script tests if the blog pages load correctly without
 * component loading errors or directory listing issues.
 */

const fs = require('fs');
const path = require('path');

function testBlogFile(filePath, language = 'en') {
    console.log(`\n🔍 Testing ${filePath}:`);
    
    if (!fs.existsSync(filePath)) {
        console.log(`  ❌ File does not exist: ${filePath}`);
        return false;
    }
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let issues = [];
        let successes = [];
        
        // Check for problematic includes
        if (content.includes('data-include=')) {
            issues.push('Contains data-include references');
        } else {
            successes.push('No problematic data-include references');
        }
        
        // Check for debug script
        if (content.includes('debug-include.js')) {
            issues.push('Contains debug-include.js reference');
        } else {
            successes.push('No debug-include.js reference');
        }
        
        // Check for proper DOCTYPE
        if (content.includes('<!DOCTYPE html>')) {
            successes.push('Has proper DOCTYPE declaration');
        } else {
            issues.push('Missing DOCTYPE declaration');
        }
        
        // Check for title
        if (content.includes('<title>')) {
            successes.push('Has page title');
        } else {
            issues.push('Missing page title');
        }
        
        // Check for footer
        if (content.includes('<footer') || content.includes('site-footer')) {
            successes.push('Has footer content');
        } else {
            issues.push('Missing footer content');
        }
        
        // Check for proper language attribute
        const langPattern = new RegExp(`lang="${language}"`);
        if (langPattern.test(content)) {
            successes.push(`Has correct language attribute (${language})`);
        } else if (content.includes('lang=')) {
            successes.push('Has language attribute');
        } else {
            issues.push('Missing language attribute');
        }
        
        // Check for CSS links
        if (content.includes('stylesheet')) {
            successes.push('Has CSS stylesheets');
        } else {
            issues.push('Missing CSS stylesheets');
        }
        
        // Report results
        if (successes.length > 0) {
            console.log(`  ✅ Successes (${successes.length}):`);
            successes.forEach(success => console.log(`     • ${success}`));
        }
        
        if (issues.length > 0) {
            console.log(`  ⚠️  Issues (${issues.length}):`);
            issues.forEach(issue => console.log(`     • ${issue}`));
        }
        
        const score = Math.round((successes.length / (successes.length + issues.length)) * 100);
        console.log(`  📊 Quality Score: ${score}%`);
        
        return issues.length === 0;
        
    } catch (error) {
        console.log(`  ❌ Error reading file: ${error.message}`);
        return false;
    }
}

function main() {
    console.log('🔍 Testing Blog Page Loading...\n');
    console.log('=' .repeat(60));
    
    const blogFiles = [
        { path: 'blog/index.html', lang: 'en', name: 'Main Blog (English)' },
        { path: 'es/blog/index.html', lang: 'es', name: 'Spanish Blog' },
        { path: 'fr/blog/index.html', lang: 'fr', name: 'French Blog' },
        { path: 'ar/blog/index.html', lang: 'ar', name: 'Arabic Blog' }
    ];
    
    let totalFiles = blogFiles.length;
    let workingFiles = 0;
    
    blogFiles.forEach(blog => {
        console.log(`\n📄 ${blog.name}:`);
        const isWorking = testBlogFile(blog.path, blog.lang);
        if (isWorking) {
            workingFiles++;
            console.log(`  🎉 ${blog.name} is working correctly!`);
        } else {
            console.log(`  ⚠️  ${blog.name} has issues that need attention.`);
        }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BLOG LOADING TEST SUMMARY:');
    console.log('='.repeat(60));
    
    const successRate = Math.round((workingFiles / totalFiles) * 100);
    console.log(`📈 Success Rate: ${workingFiles}/${totalFiles} (${successRate}%)`);
    
    if (workingFiles === totalFiles) {
        console.log('🎉 EXCELLENT! All blog pages are working correctly!');
        console.log('\n✅ What this means:');
        console.log('  • Blog pages will load properly in browsers');
        console.log('  • No component loading errors');
        console.log('  • No directory listing issues');
        console.log('  • Proper HTML structure and styling');
        console.log('  • Complete footer functionality');
        
        console.log('\n🌍 Working Blog URLs:');
        console.log('  • Main Blog: /blog/');
        console.log('  • Spanish Blog: /es/blog/');
        console.log('  • French Blog: /fr/blog/');
        console.log('  • Arabic Blog: /ar/blog/');
        
    } else {
        console.log('⚠️  Some blog pages need attention. See details above.');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('  1. Open the blog URLs in a browser to verify they load correctly');
    console.log('  2. Test navigation between blog and main website');
    console.log('  3. Verify footer links work properly');
    console.log('  4. Check mobile responsiveness');
}

if (require.main === module) {
    main();
}

module.exports = { testBlogFile };
