#!/usr/bin/env node

/**
 * Fix Header Consistency Script
 * 
 * This script adds the language switcher dropdown to all pages that are missing it
 * to ensure consistent header structure across the entire website.
 */

const fs = require('fs');
const path = require('path');

// Files that need header consistency fixes
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

// Language switcher CSS styles
const languageSwitcherCSS = `
        <style>
            /* Language Switcher Styles */
            .language-switcher {
                position: relative;
                display: inline-block;
                margin-left: 15px;
            }

            .language-switcher-current {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background-color: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
                color: white;
                font-size: 14px;
                font-weight: 500;
            }

            .language-switcher-current:hover {
                background-color: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }

            .language-icon {
                margin-right: 8px;
                display: flex;
                align-items: center;
            }

            .current-language {
                margin: 0 8px;
            }

            .dropdown-icon {
                font-size: 10px;
                transition: transform 0.3s ease;
            }

            .language-switcher.active .dropdown-icon {
                transform: rotate(180deg);
            }

            .language-switcher-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                opacity: 0;
                visibility: hidden;
                transform: translateY(-10px);
                transition: all 0.3s ease;
                z-index: 1000;
                min-width: 160px;
            }

            .language-switcher.active .language-switcher-dropdown {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            .language-option {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 12px;
                color: #333;
                text-decoration: none;
                transition: background-color 0.2s ease;
                border-bottom: 1px solid #f0f0f0;
            }

            .language-option:last-child {
                border-bottom: none;
            }

            .language-option:hover {
                background-color: #f8f9fa;
                color: #2863c2;
            }

            .language-name {
                font-size: 14px;
                font-weight: 500;
            }

            .language-native {
                font-size: 13px;
                color: #555;
                font-weight: 400;
            }

            .language-option:hover .language-native {
                color: #2863c2;
            }

            /* RTL Support */
            html[dir="rtl"] .language-switcher-dropdown {
                left: auto;
                right: 0;
            }

            html[dir="rtl"] .language-option {
                flex-direction: row-reverse;
            }

            html[dir="rtl"] .language-icon {
                margin-right: 0;
                margin-left: 5px;
            }

            html[dir="rtl"] .current-language {
                margin: 0 5px;
            }
        </style>`;

// Language switcher HTML structure
const languageSwitcherHTML = `                    <div id="language-switcher-container" style="display: inline-block; margin-left: 15px;">
                        <!-- Language Switcher Component -->
                        <div class="language-switcher">
                            <div class="language-switcher-current">
                                <span class="language-icon" style="display:inline-flex; align-items:center;">
                                  <i class="fa-solid fa-language" style="font-size: 20px;"></i>
                                </span>
                                <span class="current-language">English</span>
                                <span class="dropdown-icon">▼</span>
                            </div>
                            <div class="language-switcher-dropdown">
                                <a href="#" class="language-option" data-lang="en">
                                    <span class="language-name">English</span>
                                    <span class="language-native">English</span>
                                </a>
                                <a href="#" class="language-option" data-lang="es">
                                    <span class="language-name">Spanish</span>
                                    <span class="language-native">Español</span>
                                </a>
                                <a href="#" class="language-option" data-lang="fr">
                                    <span class="language-name">French</span>
                                    <span class="language-native">Français</span>
                                </a>
                                <a href="#" class="language-option" data-lang="ar">
                                    <span class="language-name">Arabic</span>
                                    <span class="language-native">العربية</span>
                                </a>
                            </div>
                        </div>
                    </div>`;

// Language switcher JavaScript
const languageSwitcherJS = `
            <!-- Load language switcher script -->
            <script>
                // Load the language switcher script
                const script = document.createElement('script');
                script.src = 'js/language-switcher.js';
                document.head.appendChild(script);

                // Load the language switcher fix script
                const fixScript = document.createElement('script');
                fixScript.src = 'js/language-switcher-fix.js';
                document.head.appendChild(fixScript);
            </script>`;

function fixHeaderConsistency(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Check if language switcher CSS is already present
        if (!content.includes('language-switcher-current')) {
            // Add language switcher CSS before </head>
            const headCloseIndex = content.indexOf('</head>');
            if (headCloseIndex !== -1) {
                content = content.slice(0, headCloseIndex) + languageSwitcherCSS + '\n    ' + content.slice(headCloseIndex);
                modified = true;
            }
        }

        // Check if language switcher HTML is already present
        if (!content.includes('language-switcher-container')) {
            // Find the nav-menu div and add language switcher before closing </div>
            const navMenuPattern = /<div class="nav-menu">([\s\S]*?)<\/div>/;
            const match = content.match(navMenuPattern);
            
            if (match) {
                const navMenuContent = match[1];
                const newNavMenuContent = navMenuContent + languageSwitcherHTML + '\n                ';
                content = content.replace(navMenuPattern, `<div class="nav-menu">${newNavMenuContent}</div>`);
                modified = true;
            }
        }

        // Check if language switcher JavaScript is already present
        if (!content.includes('language-switcher.js')) {
            // Add language switcher JavaScript after </header>
            const headerClosePattern = /<\/header>/;
            if (headerClosePattern.test(content)) {
                content = content.replace(headerClosePattern, '</header>' + languageSwitcherJS);
                modified = true;
            }
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed header consistency for ${filePath}`);
        } else {
            console.log(`ℹ️  No changes needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🔧 Starting header consistency fixes...\n');

    // Fix root directory files
    filesToFix.forEach(file => {
        fixHeaderConsistency(file);
    });

    // Fix language directory files
    const languages = ['fr', 'es', 'ar'];
    languages.forEach(lang => {
        filesToFix.forEach(file => {
            const langFile = path.join(lang, file);
            fixHeaderConsistency(langFile);
        });
    });

    console.log('\n✨ Header consistency fixes complete!');
}

if (require.main === module) {
    main();
}

module.exports = { fixHeaderConsistency };
