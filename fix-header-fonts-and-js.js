#!/usr/bin/env node

/**
 * Fix Header Fonts and JavaScript Issues Script
 * 
 * This script fixes two critical issues:
 * 1. Adds missing Sora fonts to all pages
 * 2. Fixes JavaScript loading order for language switcher
 */

const fs = require('fs');
const path = require('path');

// Files that need header fixes
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

function fixHeaderIssues(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 1. Fix missing Sora fonts
        if (!content.includes('assets/css/fonts.css') && !content.includes('assets/css/sora-styles.css')) {
            // Find the Bulma CSS link and add fonts after it
            const bulmaPattern = /<link[^>]*bulma[^>]*>/;
            const bulmaMatch = content.match(bulmaPattern);
            
            if (bulmaMatch) {
                const fontLinks = `
        <link rel="stylesheet" href="assets/css/fonts.css" />
        <link rel="stylesheet" href="assets/css/sora-styles.css" />`;
                
                content = content.replace(bulmaPattern, bulmaMatch[0] + fontLinks);
                modified = true;
                console.log(`  ✅ Added Sora fonts to ${filePath}`);
            }
        }

        // 2. Fix JavaScript loading order - ensure language-switcher.js loads before language-switcher-fix.js
        if (content.includes('language-switcher-fix.js')) {
            // Replace the problematic script loading with a safer version
            const problematicScript = /<!-- Load language switcher script -->\s*<script>[\s\S]*?<\/script>/;
            
            if (problematicScript.test(content)) {
                const saferScript = `
            <!-- Load language switcher script -->
            <script>
                // Ensure scripts load in correct order
                function loadLanguageSwitcherScripts() {
                    // Load the main language switcher script first
                    const script = document.createElement('script');
                    script.src = 'js/language-switcher.js';
                    script.onload = function() {
                        // Only load the fix script after the main script is loaded
                        const fixScript = document.createElement('script');
                        fixScript.src = 'js/language-switcher-fix.js';
                        document.head.appendChild(fixScript);
                    };
                    script.onerror = function() {
                        console.warn('Could not load language-switcher.js');
                    };
                    document.head.appendChild(script);
                }

                // Load scripts when DOM is ready
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', loadLanguageSwitcherScripts);
                } else {
                    loadLanguageSwitcherScripts();
                }
            </script>`;

                content = content.replace(problematicScript, saferScript);
                modified = true;
                console.log(`  ✅ Fixed JavaScript loading order in ${filePath}`);
            }
        }

        // 3. Ensure Google Fonts are loaded for Sora
        if (!content.includes('fonts.googleapis.com') || !content.includes('Sora')) {
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
                console.log(`  ✅ Added Google Fonts for Sora to ${filePath}`);
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed header issues for ${filePath}`);
        } else {
            console.log(`ℹ️  No changes needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
}

function fixLanguageSwitcherJS() {
    // Fix the language-switcher-fix.js file to prevent the ReferenceError
    const fixFilePath = 'js/language-switcher-fix.js';
    
    try {
        if (!fs.existsSync(fixFilePath)) {
            console.log(`${fixFilePath} does not exist, skipping JS fix...`);
            return;
        }

        let content = fs.readFileSync(fixFilePath, 'utf8');
        
        // Replace the problematic line that references undefined loadLanguageSwitcher
        const problematicLine = 'document.removeEventListener(\'DOMContentLoaded\', loadLanguageSwitcher);';
        
        if (content.includes(problematicLine)) {
            const saferVersion = `// Safely remove event listener only if loadLanguageSwitcher exists
if (typeof loadLanguageSwitcher === 'function') {
    document.removeEventListener('DOMContentLoaded', loadLanguageSwitcher);
}`;
            
            content = content.replace(problematicLine, saferVersion);
            fs.writeFileSync(fixFilePath, content);
            console.log(`✅ Fixed JavaScript reference error in ${fixFilePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing ${fixFilePath}:`, error.message);
    }
}

function main() {
    console.log('🔧 Starting header fonts and JavaScript fixes...\n');

    // Fix the JavaScript file first
    fixLanguageSwitcherJS();
    console.log('');

    // Fix root directory files
    filesToFix.forEach(file => {
        fixHeaderIssues(file);
    });

    console.log('\n📁 Fixing language directory files...');
    
    // Fix language directory files
    const languages = ['fr', 'es', 'ar'];
    languages.forEach(lang => {
        console.log(`\n  ${lang.toUpperCase()} files:`);
        filesToFix.forEach(file => {
            const langFile = path.join(lang, file);
            fixHeaderIssues(langFile);
        });
    });

    console.log('\n✨ Header fonts and JavaScript fixes complete!');
    console.log('\n📋 Summary of fixes:');
    console.log('  ✅ Added Sora fonts (assets/css/fonts.css & sora-styles.css)');
    console.log('  ✅ Added Google Fonts for Sora');
    console.log('  ✅ Fixed JavaScript loading order for language switcher');
    console.log('  ✅ Fixed ReferenceError in language-switcher-fix.js');
}

if (require.main === module) {
    main();
}

module.exports = { fixHeaderIssues, fixLanguageSwitcherJS };
