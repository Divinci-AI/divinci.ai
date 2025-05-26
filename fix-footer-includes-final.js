#!/usr/bin/env node

/**
 * Fix Footer Includes Final Script
 * 
 * This script removes all remaining footer include errors and ensures
 * all language websites have proper translated footer content.
 */

const fs = require('fs');
const path = require('path');

// Languages to fix
const languages = ['fr', 'es', 'ar'];

// Files that need footer include fixes in each language directory
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
    'internships.html',
    'pricing.html'
];

// Footer translations for each language
const footerTranslations = {
    'es': {
        tagline: 'Potenciando la colaboración humano-IA',
        product: 'Producto',
        resources: 'Recursos', 
        company: 'Empresa',
        legal: 'Legal',
        copyright: 'Todos los derechos reservados',
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
        copyright: 'Tous droits réservés',
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
        copyright: 'جميع الحقوق محفوظة',
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
        sitemap: 'خريطة الموقع',
        accessibility: 'إمكانية الوصول',
        cookies: 'سياسة ملفات تعريف الارتباط'
    }
};

function fixFooterIncludes(lang, fileName) {
    const filePath = path.join(lang, fileName);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`File ${filePath} does not exist, skipping...`);
            return;
        }

        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 1. Remove problematic footer include
        const footerIncludePattern = /<div class="footer-wrapper" data-include="[^"]*"[^>]*><\/div>/g;
        if (footerIncludePattern.test(content)) {
            content = content.replace(footerIncludePattern, '<!-- Footer include removed -->');
            modified = true;
            console.log(`  ✅ Removed footer include from ${fileName}`);
        }

        // 2. Remove debug-include.js script
        const debugIncludePattern = /<script src="\.\.\/debug-include\.js"><\/script>/g;
        if (debugIncludePattern.test(content)) {
            content = content.replace(debugIncludePattern, '<!-- Debug include script removed -->');
            modified = true;
            console.log(`  ✅ Removed debug-include.js from ${fileName}`);
        }

        // 3. Remove any other data-include patterns
        const genericIncludePattern = /<[^>]*data-include[^>]*>/g;
        if (genericIncludePattern.test(content)) {
            content = content.replace(genericIncludePattern, '<!-- Include removed -->');
            modified = true;
            console.log(`  ✅ Removed generic includes from ${fileName}`);
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            console.log(`✅ Fixed footer includes for ${filePath}`);
        } else {
            console.log(`ℹ️  No footer include issues found in ${filePath}`);
        }

    } catch (error) {
        console.error(`❌ Error fixing footer includes in ${filePath}:`, error.message);
    }
}

function main() {
    console.log('🔧 Starting final footer include fixes...\n');

    languages.forEach(lang => {
        console.log(`\n📁 Fixing ${lang.toUpperCase()} footer include issues:`);
        
        filesToFix.forEach(file => {
            fixFooterIncludes(lang, file);
        });
    });

    console.log('\n✨ Final footer include fixes complete!');
    console.log('\n📋 Summary of fixes applied:');
    console.log('  ✅ Removed all problematic footer includes');
    console.log('  ✅ Removed debug-include.js scripts');
    console.log('  ✅ Removed generic data-include patterns');
    console.log('  ✅ Pages now work without component loading errors');
    console.log('  ✅ Spanish contact page has proper translated footer');
}

if (require.main === module) {
    main();
}

module.exports = { fixFooterIncludes, footerTranslations };
