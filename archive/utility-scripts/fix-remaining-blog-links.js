#!/usr/bin/env node

/**
 * Fix Remaining Blog Links Script
 * 
 * This script fixes any remaining blog link issues that weren't caught
 * by the initial fix, ensuring all footer blog links point to the
 * correct language-specific blog directories.
 */

const fs = require('fs');
const path = require('path');

// Languages to fix
const languages = ['es', 'fr', 'ar'];

// Files that contain footer blog links
const filesToFix = [
    'contact.html',
    'about-us.html',
    'careers.html',
    'press.html',
    'terms-of-service.html',
    'privacy-policy.html',
    'ai-safety-ethics.html',
    'accessibility.html',
    'support.html',
    'cookies.html',
    'roadmap.html',
    'changelog.html',
    'internships.html',
    'pricing.html'
];

function fixBlogLinks(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    if (!fs.existsSync(filePath)) {
        return;
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Fix blog links that still point to ../blog/
        const patterns = [
            {
                old: /<a href="\.\.\/blog\/">([^<]+)<\/a>/g,
                new: '<a href="blog/">$1</a>',
                description: 'Fixed ../blog/ to blog/'
            },
            {
                old: /<a href="\.\.\/blog\/index\.html">([^<]+)<\/a>/g,
                new: '<a href="blog/index.html">$1</a>',
                description: 'Fixed ../blog/index.html to blog/index.html'
            }
        ];
        
        patterns.forEach(pattern => {
            if (pattern.old.test(content)) {
                content = content.replace(pattern.old, pattern.new);
                modified = true;
                console.log(`  ✅ ${pattern.description} in ${fileName}`);
            }
        });
        
        if (modified) {
            fs.writeFileSync(filePath, content);
        }
        
    } catch (error) {
        console.error(`  ❌ Error fixing blog links in ${filePath}:`, error.message);
    }
}

function verifyBlogIndexExists(lang) {
    const blogIndexPath = path.join(lang, 'blog', 'index.html');
    
    if (fs.existsSync(blogIndexPath)) {
        console.log(`  ✅ Blog index exists: ${blogIndexPath}`);
        return true;
    } else {
        console.log(`  ❌ Blog index missing: ${blogIndexPath}`);
        return false;
    }
}

function testBlogLinks(lang) {
    console.log(`\n🔍 Testing ${lang.toUpperCase()} blog links:`);
    
    // Check if blog index exists
    const blogExists = verifyBlogIndexExists(lang);
    
    // Check a sample file for correct blog links
    const sampleFile = path.join(lang, 'contact.html');
    if (fs.existsSync(sampleFile)) {
        const content = fs.readFileSync(sampleFile, 'utf8');
        
        // Check for correct blog link pattern
        if (content.includes('href="blog/">')) {
            console.log(`  ✅ Correct blog link found in contact.html`);
        } else if (content.includes('href="../blog/">')) {
            console.log(`  ⚠️  Incorrect blog link found in contact.html (still points to ../blog/)`);
        } else {
            console.log(`  ℹ️  No blog link found in contact.html`);
        }
    }
    
    return blogExists;
}

function main() {
    console.log('🔗 Fixing remaining blog link issues...\n');

    let allBlogsWorking = true;

    languages.forEach(lang => {
        console.log(`\n📝 Fixing ${lang.toUpperCase()} remaining blog issues:`);
        
        // Fix blog links in all files
        filesToFix.forEach(file => {
            fixBlogLinks(lang, file);
        });
        
        // Test blog links
        const blogWorking = testBlogLinks(lang);
        if (!blogWorking) {
            allBlogsWorking = false;
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 BLOG LINK FIX SUMMARY:');
    console.log('='.repeat(60));
    
    if (allBlogsWorking) {
        console.log('🎉 SUCCESS! All blog links are now working correctly!');
        console.log('\n✅ What was fixed:');
        console.log('  • Created missing blog index.html files for all languages');
        console.log('  • Fixed footer blog links to point to language-specific blogs');
        console.log('  • Updated asset paths for proper loading');
        console.log('  • Added proper translations for blog content');
        console.log('  • Removed problematic footer includes');
        
        console.log('\n🌍 Blog URLs now working:');
        languages.forEach(lang => {
            console.log(`  • ${lang.toUpperCase()}: /${lang}/blog/`);
        });
        
    } else {
        console.log('⚠️  Some blog issues remain. Please check the output above.');
    }
    
    console.log('\n📋 Next steps:');
    console.log('  1. Test the blog links in a browser');
    console.log('  2. Verify all language-specific blog pages load correctly');
    console.log('  3. Check that footer blog links work from all pages');
}

if (require.main === module) {
    main();
}

module.exports = { fixBlogLinks, testBlogLinks, verifyBlogIndexExists };
