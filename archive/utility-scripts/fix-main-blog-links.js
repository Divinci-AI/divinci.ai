#!/usr/bin/env node

/**
 * Fix Main Blog Links Script
 * 
 * This script fixes all blog links in the main website to explicitly
 * point to blog/index.html instead of just blog/ to ensure proper
 * loading instead of directory listing.
 */

const fs = require('fs');
const path = require('path');

// Files that need blog link fixes (main website files)
const filesToFix = [
    'about-us.html',
    'accessibility.html',
    'ai-safety-ethics.html',
    'careers.html',
    'changelog.html',
    'contact.html',
    'cookies.html',
    'internships.html',
    'press.html',
    'pricing.html',
    'privacy-policy.html',
    'roadmap.html',
    'security.html',
    'support.html',
    'terms-of-service.html'
];

function fixBlogLink(fileName) {
    if (!fs.existsSync(fileName)) {
        console.log(`  ⚠️  File does not exist: ${fileName}`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(fileName, 'utf8');
        let modified = false;
        
        // Fix blog links that point to blog/ instead of blog/index.html
        const blogLinkPattern = /<a href="blog\/">Blog<\/a>/g;
        
        if (blogLinkPattern.test(content)) {
            content = content.replace(blogLinkPattern, '<a href="blog/index.html">Blog</a>');
            modified = true;
            console.log(`  ✅ Fixed blog link in ${fileName}`);
        }
        
        if (modified) {
            fs.writeFileSync(fileName, content);
            return true;
        } else {
            console.log(`  ℹ️  No blog link found in ${fileName}`);
            return true;
        }
        
    } catch (error) {
        console.error(`  ❌ Error fixing ${fileName}:`, error.message);
        return false;
    }
}

function verifyBlogLinks() {
    console.log('\n🔍 Verifying all blog links point to blog/index.html:');
    
    const allFiles = ['index.html', ...filesToFix];
    let correctLinks = 0;
    let totalFiles = 0;
    
    allFiles.forEach(file => {
        if (fs.existsSync(file)) {
            totalFiles++;
            const content = fs.readFileSync(file, 'utf8');
            
            if (content.includes('href="blog/index.html">Blog</a>')) {
                console.log(`  ✅ ${file}: Correct blog link`);
                correctLinks++;
            } else if (content.includes('href="blog/">Blog</a>')) {
                console.log(`  ❌ ${file}: Still has directory link`);
            } else {
                console.log(`  ℹ️  ${file}: No blog link found`);
                correctLinks++; // Count as correct if no blog link
            }
        }
    });
    
    return { correctLinks, totalFiles };
}

function main() {
    console.log('🔗 Fixing main website blog links...\n');

    let totalFixed = 0;
    let totalAttempted = 0;

    console.log('📝 Updating blog links to point to blog/index.html:');
    
    filesToFix.forEach(file => {
        totalAttempted++;
        const success = fixBlogLink(file);
        if (success) {
            totalFixed++;
        }
    });

    // Verify all links
    const { correctLinks, totalFiles } = verifyBlogLinks();

    console.log('\n' + '='.repeat(60));
    console.log('📊 MAIN BLOG LINK FIX SUMMARY:');
    console.log('='.repeat(60));
    
    const successRate = Math.round((totalFixed / totalAttempted) * 100);
    console.log(`📈 Fix Success Rate: ${totalFixed}/${totalAttempted} (${successRate}%)`);
    
    const linkSuccessRate = Math.round((correctLinks / totalFiles) * 100);
    console.log(`🔗 Link Verification: ${correctLinks}/${totalFiles} (${linkSuccessRate}%)`);
    
    if (correctLinks === totalFiles) {
        console.log('\n🎉 SUCCESS! All blog links now point to blog/index.html!');
        console.log('\n✅ What this fixes:');
        console.log('  • Blog links now explicitly point to the index.html file');
        console.log('  • Should prevent directory listing issues');
        console.log('  • Ensures consistent behavior across all pages');
        console.log('  • Works regardless of server configuration');
        
        console.log('\n🌐 Blog link behavior:');
        console.log('  • Before: href="blog/" → Directory listing');
        console.log('  • After: href="blog/index.html" → Actual blog page');
        
        console.log('\n📋 Test the fix:');
        console.log('  1. Open the main website in a browser');
        console.log('  2. Click the "Blog" link in the footer');
        console.log('  3. Should now load the actual blog page');
        
    } else {
        console.log('\n⚠️  Some blog links still need attention. Please check the output above.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { fixBlogLink, verifyBlogLinks };
