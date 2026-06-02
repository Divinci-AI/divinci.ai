#!/usr/bin/env node

/**
 * Fix Includes Script
 *
 * This script fixes all HTML files that are using data-include or include-html
 * by replacing them with static HTML content for static hosting compatibility.
 */

const fs = require('fs');
const path = require('path');

// Files that need to be fixed (based on the documentation)
const filesToFix = [
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
    'internships.html'
];

// Header content (simplified for static pages)
const headerContent = `<!-- Header with Navigation -->
        <header role="banner">
            <nav class="navbar">
                <a href="index.html" class="logo-link">
                    <div class="nav-logo">
                        <img
                            class="header-logo"
                            src="images/divinci_logo_inverted.svg"
                            alt="Divinci Heart Robot logo"
                            onerror="this.onerror=null; this.src='images/divinci_logo_inverted.svg';"
                        />
                    </div>
                    <div class="nav-title">
                        <span class="brand-name">Divinci ™</span>
                        <span class="mobile-hide">&nbsp;- Create your own custom AI</span>
                    </div>
                </a>
                <div class="nav-menu">
                    <a href="index.html#features">Features</a>
                    <a href="index.html#team">Team</a>
                    <a href="index.html#signup" class="signup-link"><span class="signup-button">Sign Up</span></a>
                </div>
            </nav>
        </header>`;

// Footer content (complete with sacred geometry elements)
const footerContent = `<!-- Footer -->
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
                                <h3>Product</h3>
                                <ul>
                                    <li><a href="index.html#features">Features</a></li>
                                    <li><a href="pricing.html">Pricing</a></li>
                                    <li><a href="roadmap.html">Roadmap</a></li>
                                    <li><a href="changelog.html">Changelog</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>Resources</h3>
                                <ul>
                                    <li><a href="docs/">Documentation</a></li>
                                    <li><a href="blog/">Blog</a></li>
                                    <li><a href="tutorials/">Tutorials</a></li>
                                    <li><a href="api/">API</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>Company</h3>
                                <ul>
                                    <li><a href="about-us.html">About Us</a></li>
                                    <li><a href="careers.html">Careers</a></li>
                                    <li><a href="contact.html">Contact</a></li>
                                    <li><a href="press.html">Press</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>Legal</h3>
                                <ul>
                                    <li><a href="terms-of-service.html">Terms of Service</a></li>
                                    <li><a href="privacy-policy.html">Privacy Policy</a></li>
                                    <li><a href="ai-safety-ethics.html">AI Safety & Ethics</a></li>
                                    <li><a href="security.html">Security</a></li>
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
                                    <a href="sitemap.xml">Sitemap</a>
                                    <a href="accessibility.html">Accessibility</a>
                                    <a href="cookies.html">Cookie Policy</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>`;

function fixFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Replace header includes
        const headerPatterns = [
            /<div\s+data-include="includes\/header\.html"><\/div>/g,
            /<div\s+include-html="includes\/header\.html"><\/div>/g,
            /<div\s+include-html="\.\.\/includes\/header\.html"><\/div>/g,
            /<header[^>]*>\s*<div\s+data-include="includes\/header\.html"><\/div>\s*<\/header>/g
        ];

        headerPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, headerContent);
                modified = true;
            }
        });

        // Replace footer includes
        const footerPatterns = [
            /<div\s+data-include="includes\/footer\.html"[^>]*><\/div>/g,
            /<div\s+include-html="includes\/footer\.html"><\/div>/g,
            /<div\s+include-html="\.\.\/includes\/footer\.html"><\/div>/g,
            /<div\s+class="footer-wrapper"\s+data-include="includes\/footer\.html"[^>]*><\/div>/g
        ];

        footerPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, footerContent);
                modified = true;
            }
        });

        // Remove include scripts
        const scriptPatterns = [
            /<script\s+src="js\/include-html\.js"[^>]*><\/script>/g,
            /<script\s+src="debug-include\.js"[^>]*><\/script>/g,
            /<script\s+src="\.\.\/js\/include-html\.js"[^>]*><\/script>/g
        ];

        scriptPatterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, '');
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed ${filePath}`);
        } else {
            console.log(`ℹ️  No changes needed for ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🔧 Starting to fix include issues in HTML files...\n');

    // Fix root directory files
    filesToFix.forEach(file => {
        fixFile(file);
    });

    // Fix language directory files
    const languages = ['fr', 'es', 'ar'];
    languages.forEach(lang => {
        filesToFix.forEach(file => {
            const langFile = path.join(lang, file);
            fixFile(langFile);
        });
    });

    console.log('\n✨ Include fixing complete!');
}

if (require.main === module) {
    main();
}

module.exports = { fixFile, headerContent, footerContent };
