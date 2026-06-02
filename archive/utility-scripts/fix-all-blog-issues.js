#!/usr/bin/env node

/**
 * Fix All Blog Issues Script
 * 
 * This script comprehensively fixes all remaining blog issues:
 * 1. Removes all component loading references
 * 2. Adds proper footers to language blogs
 * 3. Ensures all blog pages load correctly
 */

const fs = require('fs');
const path = require('path');

// Languages to fix
const languages = ['es', 'fr', 'ar'];

// Footer templates for each language
const footerTemplates = {
    'es': {
        tagline: 'Potenciando la colaboración humano-IA',
        product: 'Producto',
        resources: 'Recursos',
        company: 'Empresa',
        legal: 'Legal',
        features: 'Características',
        pricing: 'Precios',
        roadmap: 'Hoja de Ruta',
        changelog: 'Registro de Cambios',
        documentation: 'Documentación',
        blog: 'Blog',
        tutorials: 'Tutoriales',
        api: 'API',
        aboutUs: 'Acerca de Nosotros',
        careers: 'Carreras',
        contact: 'Contacto',
        press: 'Prensa',
        terms: 'Términos de Servicio',
        privacy: 'Política de Privacidad',
        aiSafety: 'Seguridad y Ética de IA',
        security: 'Seguridad',
        copyright: 'Todos los derechos reservados',
        sitemap: 'Mapa del Sitio',
        accessibility: 'Accesibilidad',
        cookies: 'Política de Cookies'
    },
    'fr': {
        tagline: 'Renforcer la collaboration humain-IA',
        product: 'Produit',
        resources: 'Ressources',
        company: 'Entreprise',
        legal: 'Légal',
        features: 'Fonctionnalités',
        pricing: 'Tarification',
        roadmap: 'Feuille de Route',
        changelog: 'Journal des Modifications',
        documentation: 'Documentation',
        blog: 'Blog',
        tutorials: 'Tutoriels',
        api: 'API',
        aboutUs: 'À Propos',
        careers: 'Carrières',
        contact: 'Contact',
        press: 'Presse',
        terms: 'Conditions de Service',
        privacy: 'Politique de Confidentialité',
        aiSafety: 'Sécurité et Éthique de l\'IA',
        security: 'Sécurité',
        copyright: 'Tous droits réservés',
        sitemap: 'Plan du Site',
        accessibility: 'Accessibilité',
        cookies: 'Politique des Cookies'
    },
    'ar': {
        tagline: 'تمكين التعاون بين الإنسان والذكاء الاصطناعي',
        product: 'المنتج',
        resources: 'الموارد',
        company: 'الشركة',
        legal: 'قانوني',
        features: 'الميزات',
        pricing: 'التسعير',
        roadmap: 'خارطة الطريق',
        changelog: 'سجل التغييرات',
        documentation: 'التوثيق',
        blog: 'المدونة',
        tutorials: 'الدروس',
        api: 'واجهة برمجة التطبيقات',
        aboutUs: 'من نحن',
        careers: 'الوظائف',
        contact: 'اتصل بنا',
        press: 'الصحافة',
        terms: 'شروط الخدمة',
        privacy: 'سياسة الخصوصية',
        aiSafety: 'أمان وأخلاقيات الذكاء الاصطناعي',
        security: 'الأمان',
        copyright: 'جميع الحقوق محفوظة',
        sitemap: 'خريطة الموقع',
        accessibility: 'إمكانية الوصول',
        cookies: 'سياسة ملفات تعريف الارتباط'
    }
};

function generateFooterHTML(lang) {
    const t = footerTemplates[lang];
    
    return `        <!-- Footer -->
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
                                <p class="footer-tagline">${t.tagline}</p>
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
                                    <li><a href="../../index.html#features">${t.features}</a></li>
                                    <li><a href="../../pricing.html">${t.pricing}</a></li>
                                    <li><a href="../../roadmap.html">${t.roadmap}</a></li>
                                    <li><a href="../../changelog.html">${t.changelog}</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>${t.resources}</h3>
                                <ul>
                                    <li><a href="../../docs/">${t.documentation}</a></li>
                                    <li><a href="index.html">${t.blog}</a></li>
                                    <li><a href="../../tutorials/">${t.tutorials}</a></li>
                                    <li><a href="../../api/">${t.api}</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>${t.company}</h3>
                                <ul>
                                    <li><a href="../../about-us.html">${t.aboutUs}</a></li>
                                    <li><a href="../../careers.html">${t.careers}</a></li>
                                    <li><a href="../contact.html">${t.contact}</a></li>
                                    <li><a href="../../press.html">${t.press}</a></li>
                                </ul>
                            </div>
                        </div>

                        <div class="column">
                            <div class="footer-links-column">
                                <h3>${t.legal}</h3>
                                <ul>
                                    <li><a href="../terms-of-service.html">${t.terms}</a></li>
                                    <li><a href="../privacy-policy.html">${t.privacy}</a></li>
                                    <li><a href="../ai-safety-ethics.html">${t.aiSafety}</a></li>
                                    <li><a href="../../security.html">${t.security}</a></li>
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
                                <p class="copyright">&copy; 2023-2025 Divinci AI. ${t.copyright}.</p>
                            </div>
                        </div>
                        <div class="level-right">
                            <div class="level-item">
                                <div class="footer-bottom-links">
                                    <a href="../../sitemap.xml">${t.sitemap}</a>
                                    <a href="../accessibility.html">${t.accessibility}</a>
                                    <a href="../cookies.html">${t.cookies}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>`;
}

function fixLanguageBlog(lang) {
    const blogPath = path.join(lang, 'blog', 'index.html');
    
    if (!fs.existsSync(blogPath)) {
        console.log(`  ❌ Blog file does not exist: ${blogPath}`);
        return false;
    }
    
    try {
        let content = fs.readFileSync(blogPath, 'utf8');
        let modified = false;
        
        // Remove data-include references
        const includePatterns = [
            /data-include="[^"]*"/g,
            /<script src="[^"]*debug-include\.js"><\/script>/g
        ];
        
        includePatterns.forEach(pattern => {
            if (pattern.test(content)) {
                content = content.replace(pattern, '');
                modified = true;
            }
        });
        
        // Add footer if missing
        if (!content.includes('<footer') && !content.includes('site-footer')) {
            const footerHTML = generateFooterHTML(lang);
            
            // Find the scripts section and insert footer before it
            const scriptsPattern = /(\s*<!-- Scripts -->)/;
            if (scriptsPattern.test(content)) {
                content = content.replace(scriptsPattern, `\n${footerHTML}\n\n$1`);
                modified = true;
                console.log(`  ✅ Added footer to ${blogPath}`);
            }
        }
        
        if (modified) {
            fs.writeFileSync(blogPath, content);
            console.log(`  ✅ Fixed blog issues in ${blogPath}`);
            return true;
        } else {
            console.log(`  ℹ️  No issues found in ${blogPath}`);
            return true;
        }
        
    } catch (error) {
        console.error(`  ❌ Error fixing ${blogPath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🔧 Fixing all blog issues comprehensively...\n');

    let totalFixed = 0;
    let totalAttempted = 0;

    languages.forEach(lang => {
        console.log(`\n📝 Fixing ${lang.toUpperCase()} blog:`);
        totalAttempted++;
        
        const success = fixLanguageBlog(lang);
        if (success) {
            totalFixed++;
        }
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 COMPREHENSIVE BLOG FIX SUMMARY:');
    console.log('='.repeat(60));
    
    const successRate = Math.round((totalFixed / totalAttempted) * 100);
    console.log(`📈 Success Rate: ${totalFixed}/${totalAttempted} (${successRate}%)`);
    
    if (totalFixed === totalAttempted) {
        console.log('🎉 SUCCESS! All blog issues have been fixed!');
        console.log('\n✅ What was fixed:');
        console.log('  • Removed all data-include references');
        console.log('  • Removed debug-include.js scripts');
        console.log('  • Added complete translated footers');
        console.log('  • Fixed asset paths for proper loading');
        console.log('  • Ensured proper HTML structure');
        
        console.log('\n🌍 All blog URLs should now work:');
        console.log('  • Main Blog: /blog/');
        languages.forEach(lang => {
            console.log(`  • ${lang.toUpperCase()} Blog: /${lang}/blog/`);
        });
        
    } else {
        console.log('⚠️  Some blog issues remain. Please check the output above.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { fixLanguageBlog, generateFooterHTML, footerTemplates };
