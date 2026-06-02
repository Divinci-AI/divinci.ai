#!/usr/bin/env node

/**
 * Fix Blog Header Consistency Script
 * 
 * This script updates the blog header to match the main website header exactly,
 * including the consumer/company toggle, language switcher, and proper styling.
 */

const fs = require('fs');
const path = require('path');

function generateMainWebsiteHeader() {
    return `        <!-- Header with Navigation -->
        <header role="banner">
            <nav class="navbar">
                <a href="../index.html" class="logo-link" id="logoHomeLink">
                    <div class="nav-logo">
                        <img
                            class="header-logo"
                            src="../images/divinci_logo_inverted.svg"
                            alt="Divinci Heart Robot logo"
                        />
                    </div>
                    <div class="nav-title">
                        <span class="brand-name">Divinci ™</span>
                        <span class="mobile-hide consumer-view-content">&nbsp;- Create your own custom AI</span>
                        <span class="mobile-hide company-view-content" style="display: none; opacity: 0;">&nbsp;- Enterprise AI Solutions</span>
                    </div>
                </a>
                <!-- Toggle switch for customer/company view -->
                <div class="view-toggle-container mobile-hide">
                    <span style ="margin-right: 22px" class="view-label customer-view active" onclick="document.getElementById('viewToggle').checked = false; document.getElementById('viewToggle').dispatchEvent(new Event('change'));">Consumer</span>
                    <label class="switch">
                        <input type="checkbox" id="viewToggle">
                        <span class="slider round"></span>
                    </label>
                    <span class="view-label company-view" onclick="document.getElementById('viewToggle').checked = true; document.getElementById('viewToggle').dispatchEvent(new Event('change'));">Company</span>
                </div>
                <div class="nav-menu">
                    <a href="../index.html#features" data-i18n="navigation.features">Features</a>
                    <a href="../index.html#team" data-i18n="navigation.team">Team</a>
                    <a href="../index.html#signup" class="signup-link"><span class="signup-button" data-i18n="buttons.signUp">Sign Up</span></a>
                    <div id="language-switcher-container" style="display: inline-block; margin-left: 15px;">
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
                    </div>
                </div>
            </nav>

            <!-- Load language switcher script -->
            <script>
                // Load the language switcher script
                const script = document.createElement('script');
                script.src = '../js/language-switcher.js';
                document.head.appendChild(script);

                // Load the language switcher fix script
                const fixScript = document.createElement('script');
                fixScript.src = '../js/language-switcher-fix.js';
                document.head.appendChild(fixScript);

                // Initialize view toggle
                const viewToggleScript = document.createElement('script');
                viewToggleScript.src = '../js/view-toggle.js';
                viewToggleScript.defer = true;
                document.body.appendChild(viewToggleScript);

                // Initialize mobile menu
                const mobileMenuScript = document.createElement('script');
                mobileMenuScript.src = '../js/mobile-menu.js';
                mobileMenuScript.defer = true;
                document.body.appendChild(mobileMenuScript);
            </script>
        </header>`;
}

function addLanguageSwitcherCSS() {
    return `        <!-- Language Switcher Styles -->
        <style>
            /* Language Switcher Styles */
            .language-switcher {
                position: relative;
                font-family: 'Inter', sans-serif;
                z-index: 1000;
                margin-left: 10px;
            }

            .language-switcher-current {
                display: flex;
                align-items: center;
                cursor: pointer;
                padding: 5px 10px;
                border-radius: 4px;
                background-color: rgba(255, 255, 255, 0.1);
                transition: background-color 0.3s;
            }

            .language-switcher-current:hover {
                background-color: rgba(255, 255, 255, 0.2);
            }

            .language-icon {
                margin-right: 5px;
                font-size: 16px;
            }

            .current-language {
                margin: 0 5px;
                font-size: 14px;
            }

            .dropdown-icon {
                font-size: 10px;
                transition: transform 0.3s;
            }

            .language-switcher.active .dropdown-icon {
                transform: rotate(180deg);
            }

            .language-switcher-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                width: 180px;
                background-color: #fff;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                overflow: hidden;
                display: none;
                z-index: 1001;
            }

            .language-switcher.active .language-switcher-dropdown {
                display: block;
            }

            .language-option {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                text-decoration: none;
                color: #1a1a1a;
                transition: all 0.2s ease;
                border-bottom: 1px solid rgba(0, 0, 0, 0.05);
            }

            .language-option:last-child {
                border-bottom: none;
            }

            .language-option:hover {
                background-color: #e8f4fd;
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
        </style>

`;
}

function updateBlogHeader() {
    const blogPath = 'blog/index.html';
    
    if (!fs.existsSync(blogPath)) {
        console.log(`❌ Blog file does not exist: ${blogPath}`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(blogPath, 'utf8');
        let modified = false;
        
        // Add language switcher CSS after the existing styles
        if (!content.includes('/* Language Switcher Styles */')) {
            const cssPattern = /(<link rel="stylesheet" href="\.\.\/css\/social-sharing\.css" \/>)/;
            if (cssPattern.test(content)) {
                const languageSwitcherCSS = addLanguageSwitcherCSS();
                content = content.replace(cssPattern, `$1\n\n${languageSwitcherCSS}`);
                modified = true;
                console.log(`  ✅ Added language switcher CSS`);
            }
        }
        
        // Replace the existing header with the main website header
        const headerPattern = /(\s*<!-- Header with Navigation -->\s*<header role="banner">)(.*?)(<\/header>)/s;
        if (headerPattern.test(content)) {
            const newHeader = generateMainWebsiteHeader();
            content = content.replace(headerPattern, newHeader);
            modified = true;
            console.log(`  ✅ Updated header to match main website`);
        }
        
        // Remove the custom header CSS we added earlier since we'll use the main website styles
        const customHeaderCSSPattern = /\s*\/\* Header styles for blog \*\/.*?\/\* Blog specific styles \*/s;
        if (customHeaderCSSPattern.test(content)) {
            content = content.replace(customHeaderCSSPattern, '\n            /* Blog specific styles */');
            modified = true;
            console.log(`  ✅ Removed custom header CSS`);
        }
        
        // Add the proper CSS includes
        const stylesPattern = /(<link rel="stylesheet" href="\.\.\/styles-footer\.css" \/>)/;
        if (stylesPattern.test(content) && !content.includes('header-styles.min.css')) {
            const headerStylesLink = '\n        <link rel="stylesheet" href="../optimized/css/includes/header-styles.min.css" />';
            content = content.replace(stylesPattern, `$1${headerStylesLink}`);
            modified = true;
            console.log(`  ✅ Added header styles CSS link`);
        }
        
        if (modified) {
            fs.writeFileSync(blogPath, content);
            return true;
        } else {
            console.log(`  ℹ️  No changes needed for ${blogPath}`);
            return true;
        }
        
    } catch (error) {
        console.error(`  ❌ Error updating ${blogPath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🔄 Updating blog header to match main website...\n');

    console.log('📝 Updating main blog header:');
    const success = updateBlogHeader();

    console.log('\n' + '='.repeat(60));
    console.log('📊 BLOG HEADER CONSISTENCY UPDATE:');
    console.log('='.repeat(60));
    
    if (success) {
        console.log('🎉 SUCCESS! Blog header now matches main website!');
        console.log('\n✅ What was updated:');
        console.log('  • Added consumer/company view toggle');
        console.log('  • Added language switcher with dropdown');
        console.log('  • Added proper taglines for consumer/company views');
        console.log('  • Added language switcher CSS styles');
        console.log('  • Added header styles CSS link');
        console.log('  • Added JavaScript for functionality');
        
        console.log('\n🎯 Header now includes:');
        console.log('  • Divinci logo linking to main website');
        console.log('  • Consumer/Company toggle switch');
        console.log('  • Dynamic taglines based on view mode');
        console.log('  • Features and Team navigation links');
        console.log('  • Sign Up button');
        console.log('  • Language switcher dropdown');
        console.log('  • Proper styling matching main website');
        
        console.log('\n📋 Next steps:');
        console.log('  1. Test the blog header in a browser');
        console.log('  2. Verify consumer/company toggle works');
        console.log('  3. Test language switcher functionality');
        console.log('  4. Ensure navigation links work correctly');
        
    } else {
        console.log('⚠️  Blog header update failed. Please check the output above.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { updateBlogHeader, generateMainWebsiteHeader, addLanguageSwitcherCSS };
