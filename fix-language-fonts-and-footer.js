#!/usr/bin/env node

/**
 * Fix Language Websites Fonts and Footer Script
 * 
 * This script adds missing Sora fonts and replaces basic footers with 
 * complete styled footers across all language-specific websites.
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

function fixLanguageWebsiteFontsAndFooter(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 1. Add missing Sora fonts if not present
        if (!content.includes('assets/css/fonts.css') || !content.includes('assets/css/sora-styles.css')) {
            // Find the Bulma CSS link and add fonts after it
            const bulmaPattern = /<link[^>]*bulma[^>]*>/;
            const bulmaMatch = content.match(bulmaPattern);
            
            if (bulmaMatch) {
                const fontLinks = `
        <link rel="stylesheet" href="../assets/css/fonts.css" />
        <link rel="stylesheet" href="../assets/css/sora-styles.css" />`;
                
                content = content.replace(bulmaPattern, bulmaMatch[0] + fontLinks);
                modified = true;
                console.log(`  ✅ Added Sora fonts to ${filePath}`);
            }
        }

        // 2. Ensure Google Fonts are loaded for Sora (if not already present)
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

        // 3. Replace basic footer with complete styled footer
        const basicFooterPattern = /<footer class="site-footer">[\s\S]*?<\/footer>/;
        if (basicFooterPattern.test(content)) {
            const completeFooter = getCompleteFooter(lang);
            content = content.replace(basicFooterPattern, completeFooter);
            modified = true;
            console.log(`  ✅ Upgraded footer to complete version in ${filePath}`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed fonts and footer for: ${filePath}`);
        } else {
            console.log(`ℹ️  No changes needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
}

function getCompleteFooter(lang) {
    // Get translated section headers
    const translations = {
        'es': {
            product: 'Producto',
            resources: 'Recursos', 
            company: 'Empresa',
            legal: 'Legal'
        },
        'fr': {
            product: 'Produit',
            resources: 'Ressources',
            company: 'Entreprise', 
            legal: 'Légal'
        },
        'ar': {
            product: 'المنتج',
            resources: 'الموارد',
            company: 'الشركة',
            legal: 'قانوني'
        }
    };

    const t = translations[lang] || translations['es']; // fallback to Spanish

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
                                <h3>${t.product}</h3>
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
                                <h3>${t.resources}</h3>
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
                                <h3>${t.company}</h3>
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
                                <h3>${t.legal}</h3>
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
}

function main() {
    console.log('🌍 Starting language website fonts and footer fixes...\n');

    languages.forEach(lang => {
        console.log(`\n📁 Fixing ${lang.toUpperCase()} website files:`);
        
        filesToFix.forEach(file => {
            fixLanguageWebsiteFontsAndFooter(lang, file);
        });
    });

    console.log('\n✨ Language website fonts and footer fixes complete!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('  ✅ Added Sora fonts (../assets/css/fonts.css & sora-styles.css)');
    console.log('  ✅ Added Google Fonts for Sora family');
    console.log('  ✅ Upgraded basic footers to complete styled footers');
    console.log('  ✅ Added sacred geometry background elements');
    console.log('  ✅ Added translated footer section headers');
    console.log('  ✅ Added social media links and branding');
}

if (require.main === module) {
    main();
}

module.exports = { fixLanguageWebsiteFontsAndFooter, getCompleteFooter };
