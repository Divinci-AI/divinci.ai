#!/usr/bin/env node

/**
 * Fix Language Font Paths Script
 * 
 * This script fixes incorrect font paths and missing footer CSS
 * across all language-specific websites.
 */

const fs = require('fs');
const path = require('path');

// Languages to fix
const languages = ['fr', 'es', 'ar'];

// Files that need fixes in each language directory
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

function fixLanguageFontPaths(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 1. Fix incorrect font paths (missing ../ prefix)
        const wrongFontPath1 = /href="assets\/css\/fonts\.css"/g;
        const wrongFontPath2 = /href="assets\/css\/sora-styles\.css"/g;
        
        if (wrongFontPath1.test(content)) {
            content = content.replace(wrongFontPath1, 'href="../assets/css/fonts.css"');
            modified = true;
            console.log(`  ✅ Fixed fonts.css path in ${filePath}`);
        }
        
        if (wrongFontPath2.test(content)) {
            content = content.replace(wrongFontPath2, 'href="../assets/css/sora-styles.css"');
            modified = true;
            console.log(`  ✅ Fixed sora-styles.css path in ${filePath}`);
        }

        // 2. Add missing footer CSS if not present
        if (!content.includes('styles-footer.css')) {
            // Find the main styles.css link and add footer CSS after it
            const stylesPattern = /<link rel="stylesheet" href="\.\.\/styles\.css" \/>/;
            if (stylesPattern.test(content)) {
                content = content.replace(stylesPattern, 
                    '<link rel="stylesheet" href="../styles.css" />\n        <link rel="stylesheet" href="../styles-footer.css" />');
                modified = true;
                console.log(`  ✅ Added footer CSS to ${filePath}`);
            }
        }

        // 3. Add Google Fonts if not present (for better font loading)
        if (!content.includes('fonts.googleapis.com')) {
            // Add Google Fonts link in the head section
            const headPattern = /<head>/;
            if (headPattern.test(content)) {
                const googleFontsLink = `<head>
        <!-- Google Fonts for Sora -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Sora:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet">`;
                
                content = content.replace(headPattern, googleFontsLink);
                modified = true;
                console.log(`  ✅ Added Google Fonts to ${filePath}`);
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed font paths and CSS for: ${filePath}`);
        } else {
            console.log(`ℹ️  No changes needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🔧 Starting language font path fixes...\n');

    languages.forEach(lang => {
        console.log(`\n📁 Fixing ${lang.toUpperCase()} website font paths:`);
        
        filesToFix.forEach(file => {
            fixLanguageFontPaths(lang, file);
        });
    });

    console.log('\n✨ Language font path fixes complete!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('  ✅ Fixed font paths to use ../assets/css/ prefix');
    console.log('  ✅ Added missing styles-footer.css links');
    console.log('  ✅ Added Google Fonts for better font loading');
    console.log('  ✅ Ensured proper CSS loading order');
}

if (require.main === module) {
    main();
}

module.exports = { fixLanguageFontPaths };
