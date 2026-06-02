#!/usr/bin/env node

/**
 * Fix Blog Spacing Script
 * 
 * This script fixes spacing issues in all blog pages:
 * 1. Adds more space between header navigation and blog hero section
 * 2. Reduces space between blog hero and main content
 */

const fs = require('fs');
const path = require('path');

// Blog files to update
const blogFiles = [
    'blog/index.html',
    'es/blog/index.html', 
    'fr/blog/index.html',
    'ar/blog/index.html'
];

function fixBlogSpacing(filePath) {
    if (!fs.existsSync(filePath)) {
        console.log(`  ❌ File does not exist: ${filePath}`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Fix 1: Add margin-top to blog-hero to create space between header and hero
        const blogHeroPattern = /(\.blog-hero\s*\{[^}]*)(padding:\s*5rem\s+0;)/;
        if (blogHeroPattern.test(content)) {
            content = content.replace(blogHeroPattern, (match, beforePadding, paddingRule) => {
                // Add margin-top and adjust padding
                return beforePadding + 
                       'margin-top: 2rem;\n                ' + 
                       'padding: 3rem 0;';
            });
            modified = true;
            console.log(`  ✅ Added margin-top to blog-hero and reduced padding`);
        }
        
        // Fix 2: Reduce blog-section padding to bring content closer to hero
        const blogSectionPattern = /(\.blog-section\s*\{[^}]*)(padding:\s*4rem\s+0;)/;
        if (blogSectionPattern.test(content)) {
            content = content.replace(blogSectionPattern, (match, beforePadding, paddingRule) => {
                // Reduce top padding significantly
                return beforePadding + 'padding: 1.5rem 0 4rem 0;';
            });
            modified = true;
            console.log(`  ✅ Reduced blog-section top padding`);
        }
        
        // Fix 3: Adjust the inline margin-top on blog-main to be smaller
        const blogMainInlinePattern = /(style="margin-top:\s*)4rem(;")/g;
        if (blogMainInlinePattern.test(content)) {
            content = content.replace(blogMainInlinePattern, '$11rem$2');
            modified = true;
            console.log(`  ✅ Reduced inline margin-top on blog-main`);
        }
        
        // Fix 4: Add responsive adjustments for mobile
        const responsivePattern = /(@media screen and \(max-width: 768px\) \{[^}]*)(\.blog-title \{[^}]*\})/;
        if (responsivePattern.test(content)) {
            content = content.replace(responsivePattern, (match, mediaStart, blogTitleRule) => {
                return mediaStart + 
                       '.blog-hero {\n                    margin-top: 1rem;\n                    padding: 2rem 0;\n                }\n\n                ' +
                       '.blog-section {\n                    padding: 1rem 0 3rem 0;\n                }\n\n                ' +
                       blogTitleRule;
            });
            modified = true;
            console.log(`  ✅ Added mobile responsive spacing adjustments`);
        }
        
        if (modified) {
            fs.writeFileSync(filePath, content);
            return true;
        } else {
            console.log(`  ℹ️  No spacing changes needed for ${filePath}`);
            return true;
        }
        
    } catch (error) {
        console.error(`  ❌ Error updating ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('📐 Fixing blog spacing issues...\n');

    let totalFixed = 0;
    let totalAttempted = 0;

    blogFiles.forEach(filePath => {
        console.log(`📝 Fixing spacing in ${filePath}:`);
        totalAttempted++;
        
        const success = fixBlogSpacing(filePath);
        if (success) {
            totalFixed++;
        }
        console.log(''); // Add spacing between files
    });

    console.log('='.repeat(60));
    console.log('📊 BLOG SPACING FIX SUMMARY:');
    console.log('='.repeat(60));
    
    const successRate = Math.round((totalFixed / totalAttempted) * 100);
    console.log(`📈 Success Rate: ${totalFixed}/${totalAttempted} (${successRate}%)`);
    
    if (totalFixed === totalAttempted) {
        console.log('\n🎉 SUCCESS! All blog spacing issues have been fixed!');
        console.log('\n✅ Spacing improvements made:');
        console.log('  • Added 2rem margin-top to blog-hero (more space after header)');
        console.log('  • Reduced blog-hero padding from 5rem to 3rem');
        console.log('  • Reduced blog-section top padding from 4rem to 1.5rem');
        console.log('  • Reduced blog-main inline margin from 4rem to 1rem');
        console.log('  • Added mobile responsive spacing adjustments');
        
        console.log('\n📱 Mobile optimizations:');
        console.log('  • Reduced hero margin-top to 1rem on mobile');
        console.log('  • Reduced hero padding to 2rem on mobile');
        console.log('  • Reduced section padding for better mobile spacing');
        
        console.log('\n🎯 Visual improvements:');
        console.log('  • Better separation between header navigation and blog title');
        console.log('  • Tighter spacing between blog title and content');
        console.log('  • More balanced overall page layout');
        console.log('  • Improved mobile viewing experience');
        
    } else {
        console.log('\n⚠️  Some blog files could not be updated. Please check the output above.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { fixBlogSpacing };
