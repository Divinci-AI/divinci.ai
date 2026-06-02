#!/usr/bin/env node

/**
 * Fix Language Websites Script
 *
 * This script fixes header and footer issues across all language-specific websites
 * (Spanish, French, Arabic) to match the main English website functionality.
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

// Complete header content for language directories
const getHeaderContent = (lang, fileName) => `<!-- Header with Navigation -->
        <header role="banner">
            <nav class="navbar">
                <a href="../index.html" class="logo-link">
                    <div class="nav-logo">
                        <img
                            class="header-logo"
                            src="../images/divinci_logo_inverted.svg"
                            alt="Divinci Heart Robot logo"
                            onerror="this.onerror=null; this.src='../images/divinci_logo_inverted.svg';"
                        />
                    </div>
                    <div class="nav-title">
                        <span class="brand-name">Divinci ™</span>
                        <span class="mobile-hide">&nbsp;- Create your own custom AI</span>
                    </div>
                </a>
                <div class="nav-menu">
                    <a href="../index.html#features">Features</a>
                    <a href="../index.html#team">Team</a>
                    <a href="../index.html#signup" class="signup-link"><span class="signup-button">Sign Up</span></a>
                    <div id="language-switcher-container" style="display: inline-block; margin-left: 15px;">
                        <!-- Language Switcher Component -->
                        <div class="language-switcher">
                            <div class="language-switcher-current">
                                <span class="language-icon" style="display:inline-flex; align-items:center;">
                                  <i class="fa-solid fa-language" style="font-size: 20px;"></i>
                                </span>
                                <span class="current-language">${lang === 'es' ? 'Español' : lang === 'fr' ? 'Français' : 'العربية'}</span>
                                <span class="dropdown-icon">▼</span>
                            </div>
                            <div class="language-switcher-dropdown">
                                <a href="../${fileName}" class="language-option" data-lang="en">
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
        </header>`;

// Get footer content for language directories (using translated footer)
const getFooterContent = (lang) => {
    const footerFile = `${lang}/includes/footer.html`;
    if (fs.existsSync(footerFile)) {
        return fs.readFileSync(footerFile, 'utf8');
    }

    // Fallback to English footer with proper paths
    return `<!-- Footer -->
        <footer class="site-footer">
            <!-- Sacred Geometry Background Elements -->
            <div class="footer-sacred-pattern"></div>
            <div class="sacred-circle sacred-circle-1"></div>
            <div class="sacred-circle sacred-circle-2"></div>
            <div class="sacred-circle sacred-circle-3"></div>

            <div class="container">
                <div class="footer-content">
                    <!-- Top Section with Bulma Columns -->
                    <div class="columns is-footer-links">
                        <!-- Logo and Company Info -->
                        <div class="column is-one-quarter">
                            <div class="footer-brand">
                                <div class="footer-logo">
                                    <div class="heart">🖤</div>
                                    <span class="footer-brand-name">Divinci AI</span>
                                </div>
                                <p class="footer-tagline">Empowering human-AI collaboration</p>
                                <div class="social-links">
                                    <a href="https://twitter.com/DivinciAI" aria-label="Twitter" target="_blank"><i class="fab fa-x-twitter"></i></a>
                                    <a href="https://www.linkedin.com/company/divinci-ai" aria-label="LinkedIn" target="_blank"><i class="fab fa-linkedin"></i></a>
                                    <a href="https://github.com/Divinci-AI" aria-label="GitHub" target="_blank"><i class="fab fa-github"></i></a>
                                </div>
                            </div>
                        </div>

                        <!-- Navigation Links -->
                        <div class="column">
                            <div class="footer-links-column">
                                <h3>${lang === 'es' ? 'Producto' : lang === 'fr' ? 'Produit' : 'المنتج'}</h3>
                                <ul>
                                    <li><a href="../index.html#features">Features</a></li>
                                    <li><a href="../pricing.html">Pricing</a></li>
                                    <li><a href="../roadmap.html">Roadmap</a></li>
                                    <li><a href="../changelog.html">Changelog</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>${lang === 'es' ? 'Recursos' : lang === 'fr' ? 'Ressources' : 'الموارد'}</h3>
                                <ul>
                                    <li><a href="../docs/">Documentation</a></li>
                                    <li><a href="../blog/">Blog</a></li>
                                    <li><a href="../tutorials/">Tutorials</a></li>
                                    <li><a href="../api/">API</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>${lang === 'es' ? 'Empresa' : lang === 'fr' ? 'Entreprise' : 'الشركة'}</h3>
                                <ul>
                                    <li><a href="../about-us.html">About Us</a></li>
                                    <li><a href="../careers.html">Careers</a></li>
                                    <li><a href="../contact.html">Contact</a></li>
                                    <li><a href="../press.html">Press</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>${lang === 'es' ? 'Legal' : lang === 'fr' ? 'Légal' : 'قانوني'}</h3>
                                <ul>
                                    <li><a href="../terms-of-service.html">Terms of Service</a></li>
                                    <li><a href="../privacy-policy.html">Privacy Policy</a></li>
                                    <li><a href="../ai-safety-ethics.html">AI Safety & Ethics</a></li>
                                    <li><a href="../security.html">Security</a></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Bottom with Bulma Level -->
                <div class="footer-bottom">
                    <div class="level is-footer-bottom">
                        <div class="level-left">
                            <div class="level-item">
                                <p class="copyright">&copy; 2023-2025 Divinci AI. All rights reserved.</p>
                            </div>
                        </div>
                        <div class="level-right">
                            <div class="level-item">
                                <div class="footer-bottom-links">
                                    <a href="../sitemap.xml">Sitemap</a>
                                    <a href="../accessibility.html">Accessibility</a>
                                    <a href="../cookies.html">Cookie Policy</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>`;
};

// Language switcher JavaScript with correct paths
const getLanguageSwitcherJS = () => `
            <!-- Load language switcher script -->
            <script>
                // Ensure scripts load in correct order
                function loadLanguageSwitcherScripts() {
                    // Load the main language switcher script first
                    const script = document.createElement('script');
                    script.src = '../js/language-switcher.js';
                    script.onload = function() {
                        // Only load the fix script after the main script is loaded
                        const fixScript = document.createElement('script');
                        fixScript.src = '../js/language-switcher-fix.js';
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

function fixLanguageWebsite(lang, fileName) {
    const filePath = path.join(lang, fileName);

    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 1. Add missing footer CSS
        if (!content.includes('styles-footer.css')) {
            const stylesPattern = /<link rel="stylesheet" href="\.\.\/styles\.css" \/>/;
            if (stylesPattern.test(content)) {
                content = content.replace(stylesPattern,
                    '<link rel="stylesheet" href="../styles.css" />\n        <link rel="stylesheet" href="../styles-footer.css" />');
                modified = true;
                console.log(`  ✅ Added footer CSS to ${filePath}`);
            }
        }

        // 2. Replace data-include header with static content
        const headerIncludePattern = /<div data-include="\.\.\/includes\/header\.html"><\/div>/;
        if (headerIncludePattern.test(content)) {
            content = content.replace(headerIncludePattern, getHeaderContent(lang, fileName));
            modified = true;
            console.log(`  ✅ Fixed header include in ${filePath}`);
        }

        // 3. Replace data-include footer with static content
        const footerIncludePattern = /<div data-include="\.\.\/includes\/footer\.html"><\/div>/;
        if (footerIncludePattern.test(content)) {
            content = content.replace(footerIncludePattern, getFooterContent(lang));
            modified = true;
            console.log(`  ✅ Fixed footer include in ${filePath}`);
        }

        // 4. Fix JavaScript paths (missing ../ prefix)
        const jsPathPattern = /script\.src = 'js\/language-switcher\.js'/g;
        if (jsPathPattern.test(content)) {
            content = content.replace(jsPathPattern, "script.src = '../js/language-switcher.js'");
            content = content.replace(/fixScript\.src = 'js\/language-switcher-fix\.js'/, "fixScript.src = '../js/language-switcher-fix.js'");
            modified = true;
            console.log(`  ✅ Fixed JavaScript paths in ${filePath}`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed language website: ${filePath}`);
        } else {
            console.log(`ℹ️  No changes needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🌍 Starting language website fixes...\n');

    languages.forEach(lang => {
        console.log(`\n📁 Fixing ${lang.toUpperCase()} website files:`);

        filesToFix.forEach(file => {
            fixLanguageWebsite(lang, file);
        });
    });

    console.log('\n✨ Language website fixes complete!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('  ✅ Added missing footer CSS (styles-footer.css)');
    console.log('  ✅ Replaced data-include headers with static content');
    console.log('  ✅ Replaced data-include footers with static content');
    console.log('  ✅ Fixed JavaScript paths for language directories');
    console.log('  ✅ Added language switcher with proper paths');
    console.log('  ✅ Added translated footer sections');
}

if (require.main === module) {
    main();
}

module.exports = { fixLanguageWebsite, getHeaderContent, getFooterContent };
