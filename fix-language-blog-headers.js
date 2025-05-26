#!/usr/bin/env node

/**
 * Fix Language Blog Headers Script
 * 
 * This script updates all language-specific blog headers to match
 * the main website header with proper translations.
 */

const fs = require('fs');
const path = require('path');

// Language configurations with translations
const languages = {
    'es': {
        name: 'Spanish',
        consumerTagline: '- Crea tu propia IA personalizada',
        companyTagline: '- Soluciones de IA Empresariales',
        consumerLabel: 'Consumidor',
        companyLabel: 'Empresa',
        featuresText: 'Características',
        teamText: 'Equipo',
        signUpText: 'Registrarse'
    },
    'fr': {
        name: 'French',
        consumerTagline: '- Créez votre propre IA personnalisée',
        companyTagline: '- Solutions IA d\'Entreprise',
        consumerLabel: 'Consommateur',
        companyLabel: 'Entreprise',
        featuresText: 'Fonctionnalités',
        teamText: 'Équipe',
        signUpText: 'S\'inscrire'
    },
    'ar': {
        name: 'Arabic',
        consumerTagline: '- أنشئ ذكاءك الاصطناعي المخصص',
        companyTagline: '- حلول الذكاء الاصطناعي للمؤسسات',
        consumerLabel: 'المستهلك',
        companyLabel: 'الشركة',
        featuresText: 'الميزات',
        teamText: 'الفريق',
        signUpText: 'التسجيل'
    }
};

function generateLanguageHeader(lang) {
    const t = languages[lang];
    
    return `        <!-- Header with Navigation -->
        <header role="banner">
            <nav class="navbar">
                <a href="../index.html" class="logo-link" id="logoHomeLink">
                    <div class="nav-logo">
                        <img
                            class="header-logo"
                            src="../../images/divinci_logo_inverted.svg"
                            alt="Divinci Heart Robot logo"
                        />
                    </div>
                    <div class="nav-title">
                        <span class="brand-name">Divinci ™</span>
                        <span class="mobile-hide consumer-view-content">&nbsp;${t.consumerTagline}</span>
                        <span class="mobile-hide company-view-content" style="display: none; opacity: 0;">&nbsp;${t.companyTagline}</span>
                    </div>
                </a>
                <!-- Toggle switch for customer/company view -->
                <div class="view-toggle-container mobile-hide">
                    <span style ="margin-right: 22px" class="view-label customer-view active" onclick="document.getElementById('viewToggle').checked = false; document.getElementById('viewToggle').dispatchEvent(new Event('change'));">${t.consumerLabel}</span>
                    <label class="switch">
                        <input type="checkbox" id="viewToggle">
                        <span class="slider round"></span>
                    </label>
                    <span class="view-label company-view" onclick="document.getElementById('viewToggle').checked = true; document.getElementById('viewToggle').dispatchEvent(new Event('change'));">${t.companyLabel}</span>
                </div>
                <div class="nav-menu">
                    <a href="../index.html#features" data-i18n="navigation.features">${t.featuresText}</a>
                    <a href="../index.html#team" data-i18n="navigation.team">${t.teamText}</a>
                    <a href="../index.html#signup" class="signup-link"><span class="signup-button" data-i18n="buttons.signUp">${t.signUpText}</span></a>
                    <div id="language-switcher-container" style="display: inline-block; margin-left: 15px;">
                        <!-- Language Switcher Component -->
                        <div class="language-switcher">
                            <div class="language-switcher-current">
                                <span class="language-icon" style="display:inline-flex; align-items:center;">
                                  <i class="fa-solid fa-language" style="font-size: 20px;"></i>
                                </span>
                                <span class="current-language">${languages[lang].name}</span>
                                <span class="dropdown-icon">▼</span>
                            </div>
                            <div class="language-switcher-dropdown">
                                <a href="../../blog/index.html" class="language-option" data-lang="en">
                                    <span class="language-name">English</span>
                                    <span class="language-native">English</span>
                                </a>
                                <a href="../blog/index.html" class="language-option" data-lang="es">
                                    <span class="language-name">Spanish</span>
                                    <span class="language-native">Español</span>
                                </a>
                                <a href="../../fr/blog/index.html" class="language-option" data-lang="fr">
                                    <span class="language-name">French</span>
                                    <span class="language-native">Français</span>
                                </a>
                                <a href="../../ar/blog/index.html" class="language-option" data-lang="ar">
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
                script.src = '../../js/language-switcher.js';
                document.head.appendChild(script);

                // Load the language switcher fix script
                const fixScript = document.createElement('script');
                fixScript.src = '../../js/language-switcher-fix.js';
                document.head.appendChild(fixScript);

                // Initialize view toggle
                const viewToggleScript = document.createElement('script');
                viewToggleScript.src = '../../js/view-toggle.js';
                viewToggleScript.defer = true;
                document.body.appendChild(viewToggleScript);

                // Initialize mobile menu
                const mobileMenuScript = document.createElement('script');
                mobileMenuScript.src = '../../js/mobile-menu.js';
                mobileMenuScript.defer = true;
                document.body.appendChild(mobileMenuScript);
            </script>
        </header>`;
}

function updateLanguageBlogHeader(lang) {
    const blogPath = path.join(lang, 'blog', 'index.html');
    
    if (!fs.existsSync(blogPath)) {
        console.log(`  ❌ Blog file does not exist: ${blogPath}`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(blogPath, 'utf8');
        let modified = false;
        
        // Add language switcher CSS if not present
        if (!content.includes('/* Language Switcher Styles */')) {
            const cssPattern = /(<link rel="stylesheet" href="\.\.\/\.\.\/css\/social-sharing\.css" \/>)/;
            if (cssPattern.test(content)) {
                const languageSwitcherCSS = `
        <!-- Language Switcher Styles -->
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
        </style>

`;
                content = content.replace(cssPattern, `$1\n${languageSwitcherCSS}`);
                modified = true;
                console.log(`  ✅ Added language switcher CSS to ${lang}`);
            }
        }
        
        // Replace the existing header with the translated header
        const headerPattern = /(\s*<!-- Header with Navigation -->\s*<header role="banner">)(.*?)(<\/header>)/s;
        if (headerPattern.test(content)) {
            const newHeader = generateLanguageHeader(lang);
            content = content.replace(headerPattern, newHeader);
            modified = true;
            console.log(`  ✅ Updated ${lang} header with translations`);
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
    console.log('🌍 Updating language blog headers to match main website...\n');

    let totalFixed = 0;
    let totalAttempted = 0;

    Object.keys(languages).forEach(lang => {
        console.log(`📝 Updating ${languages[lang].name} blog header:`);
        totalAttempted++;
        
        const success = updateLanguageBlogHeader(lang);
        if (success) {
            totalFixed++;
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 LANGUAGE BLOG HEADER UPDATE SUMMARY:');
    console.log('='.repeat(60));
    
    const successRate = Math.round((totalFixed / totalAttempted) * 100);
    console.log(`📈 Success Rate: ${totalFixed}/${totalAttempted} (${successRate}%)`);
    
    if (totalFixed === totalAttempted) {
        console.log('\n🎉 SUCCESS! All language blog headers now match main website!');
        console.log('\n✅ What was updated:');
        console.log('  • Added consumer/company view toggle with translations');
        console.log('  • Added language switcher with proper blog navigation');
        console.log('  • Added translated taglines for each language');
        console.log('  • Added translated navigation labels');
        console.log('  • Added language switcher CSS styles');
        console.log('  • Added JavaScript for functionality');
        
        console.log('\n🌍 Language-specific features:');
        console.log('  • Spanish: Consumer/Empresa toggle, translated navigation');
        console.log('  • French: Consommateur/Entreprise toggle, translated navigation');
        console.log('  • Arabic: المستهلك/الشركة toggle, translated navigation');
        
        console.log('\n🔗 Language switcher navigation:');
        console.log('  • Allows switching between blog languages');
        console.log('  • Maintains blog context when switching');
        console.log('  • Proper paths for each language blog');
        
    } else {
        console.log('\n⚠️  Some language blog headers could not be updated. Please check the output above.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { updateLanguageBlogHeader, generateLanguageHeader, languages };
