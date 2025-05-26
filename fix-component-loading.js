#!/usr/bin/env node

/**
 * Fix Component Loading Script
 * 
 * This script removes dynamic component loading that causes errors
 * and replaces them with hardcoded content where necessary.
 */

const fs = require('fs');
const path = require('path');

// Languages to fix
const languages = ['fr', 'es', 'ar'];

// Files that need component loading fixes in each language directory
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

function fixComponentLoading(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 1. Remove problematic meta-tags include
        const metaTagsInclude = /<div data-include="\.\.\/includes\/meta-tags\.html"><\/div>/g;
        if (metaTagsInclude.test(content)) {
            content = content.replace(metaTagsInclude, '');
            modified = true;
            console.log(`  ✅ Removed meta-tags include from ${fileName}`);
        }

        // 2. Remove problematic structured-data include
        const structuredDataInclude = /<div data-include="\.\.\/includes\/structured-data\.html"><\/div>/g;
        if (structuredDataInclude.test(content)) {
            content = content.replace(structuredDataInclude, '');
            modified = true;
            console.log(`  ✅ Removed structured-data include from ${fileName}`);
        }

        // 3. Replace footer include with hardcoded footer (if it exists)
        const footerInclude = /<div class="footer-wrapper" data-include="\.\.\/includes\/footer\.html"[^>]*><\/div>/g;
        if (footerInclude.test(content)) {
            // The footer is already hardcoded in these files, so just remove the include
            content = content.replace(footerInclude, '');
            modified = true;
            console.log(`  ✅ Removed footer include from ${fileName}`);
        }

        // 4. Remove debug-include.js script that causes errors
        const debugIncludeScript = /<script src="\.\.\/debug-include\.js"><\/script>/g;
        if (debugIncludeScript.test(content)) {
            content = content.replace(debugIncludeScript, '');
            modified = true;
            console.log(`  ✅ Removed debug-include.js script from ${fileName}`);
        }

        // 5. Remove any other problematic includes
        const genericIncludes = /<div[^>]*data-include[^>]*><\/div>/g;
        if (genericIncludes.test(content)) {
            content = content.replace(genericIncludes, '');
            modified = true;
            console.log(`  ✅ Removed generic includes from ${fileName}`);
        }

        // 6. Remove references to window.setMetaTags and window.addStructuredData that don't exist
        const metaTagsScript = /if \(window\.setMetaTags\) \{[\s\S]*?\}\s*\}/g;
        if (metaTagsScript.test(content)) {
            content = content.replace(metaTagsScript, '// Meta tags handled directly in HTML head');
            modified = true;
            console.log(`  ✅ Removed setMetaTags script from ${fileName}`);
        }

        const structuredDataScript = /if \(window\.addStructuredData\) \{[\s\S]*?\}\s*\}/g;
        if (structuredDataScript.test(content)) {
            content = content.replace(structuredDataScript, '// Structured data handled directly in HTML head');
            modified = true;
            console.log(`  ✅ Removed addStructuredData script from ${fileName}`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed component loading issues for ${filePath}`);
        } else {
            console.log(`ℹ️  No component loading issues found in ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing component loading in ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🔧 Starting component loading fixes...\n');

    languages.forEach(lang => {
        console.log(`\n📁 Fixing ${lang.toUpperCase()} component loading issues:`);
        
        filesToFix.forEach(file => {
            fixComponentLoading(lang, file);
        });
    });

    console.log('\n✨ Component loading fixes complete!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('  ✅ Removed problematic meta-tags includes');
    console.log('  ✅ Removed problematic structured-data includes');
    console.log('  ✅ Removed problematic footer includes');
    console.log('  ✅ Removed debug-include.js scripts');
    console.log('  ✅ Removed references to non-existent window functions');
    console.log('  ✅ Pages now work without web server dependency');
}

if (require.main === module) {
    main();
}

module.exports = { fixComponentLoading };
