#!/usr/bin/env node

/**
 * Comprehensive Language Website Audit Script
 * 
 * This script crawls all language websites to check for:
 * - Header translation completeness
 * - Footer translation completeness
 * - Component loading errors
 * - Missing translations
 * - Broken includes
 */

const fs = require('fs');
const path = require('path');

// Languages to audit
const languages = ['fr', 'es', 'ar'];

// All files to check in each language directory
const allFiles = [
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

// Expected translations for each language
const expectedTranslations = {
    'es': {
        headerTagline: 'Crea tu propia IA personalizada',
        navItems: ['Características', 'Equipo', 'Registrarse'],
        footerTagline: 'Potenciando la colaboración humano-IA',
        footerSections: ['Producto', 'Recursos', 'Empresa', 'Legal'],
        copyright: 'Todos los derechos reservados'
    },
    'fr': {
        headerTagline: 'Créez votre propre IA personnalisée',
        navItems: ['Fonctionnalités', 'Équipe', 'S\'inscrire'],
        footerTagline: 'Renforcer la collaboration humain-IA',
        footerSections: ['Produit', 'Ressources', 'Entreprise', 'Légal'],
        copyright: 'Tous droits réservés'
    },
    'ar': {
        headerTagline: 'أنشئ ذكاءك الاصطناعي المخصص',
        navItems: ['الميزات', 'الفريق', 'التسجيل'],
        footerTagline: 'تمكين التعاون بين الإنسان والذكاء الاصطناعي',
        footerSections: ['المنتج', 'الموارد', 'الشركة', 'قانوني'],
        copyright: 'جميع الحقوق محفوظة'
    }
};

// Issues to check for
const issueChecks = [
    {
        name: 'Footer Include Error',
        pattern: /data-include="[^"]*footer\.html"/,
        severity: 'ERROR'
    },
    {
        name: 'Meta Tags Include Error',
        pattern: /data-include="[^"]*meta-tags\.html"/,
        severity: 'ERROR'
    },
    {
        name: 'Debug Include Script',
        pattern: /<script src="[^"]*debug-include\.js"><\/script>/,
        severity: 'ERROR'
    },
    {
        name: 'English Header Tagline',
        pattern: /Create your own custom AI/,
        severity: 'WARNING'
    },
    {
        name: 'English Footer Tagline',
        pattern: /Empowering human-AI collaboration/,
        severity: 'WARNING'
    },
    {
        name: 'English Navigation Items',
        pattern: /href="[^"]*">Features<\/a>|href="[^"]*">Team<\/a>|href="[^"]*">Sign Up<\/a>/,
        severity: 'WARNING'
    },
    {
        name: 'English Footer Sections',
        pattern: /<h3>Product<\/h3>|<h3>Resources<\/h3>|<h3>Company<\/h3>/,
        severity: 'WARNING'
    },
    {
        name: 'English Copyright',
        pattern: /All rights reserved/,
        severity: 'WARNING'
    }
];

function auditFile(lang, fileName) {
    const filePath = path.join(lang, fileName);
    const results = {
        file: filePath,
        exists: false,
        errors: [],
        warnings: [],
        translations: {
            header: false,
            footer: false,
            content: false
        }
    };
    
    try {
        if (!fs.existsSync(filePath)) {
            results.errors.push('File does not exist');
            return results;
        }

        results.exists = true;
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for issues
        issueChecks.forEach(check => {
            if (check.pattern.test(content)) {
                if (check.severity === 'ERROR') {
                    results.errors.push(check.name);
                } else {
                    results.warnings.push(check.name);
                }
            }
        });

        // Check for expected translations
        const expected = expectedTranslations[lang];
        if (expected) {
            // Check header translations
            if (content.includes(expected.headerTagline)) {
                results.translations.header = true;
            }

            // Check footer translations
            if (content.includes(expected.footerTagline) && 
                expected.footerSections.some(section => content.includes(`<h3>${section}</h3>`))) {
                results.translations.footer = true;
            }

            // Check for any translated content
            if (expected.navItems.some(item => content.includes(item)) ||
                content.includes(expected.copyright)) {
                results.translations.content = true;
            }
        }

    } catch (error) {
        results.errors.push(`Read error: ${error.message}`);
    }

    return results;
}

function generateReport(auditResults) {
    console.log('\n📊 COMPREHENSIVE LANGUAGE WEBSITE AUDIT REPORT\n');
    console.log('=' .repeat(80));

    let totalFiles = 0;
    let totalErrors = 0;
    let totalWarnings = 0;
    let filesWithIssues = 0;

    languages.forEach(lang => {
        console.log(`\n🌍 ${lang.toUpperCase()} LANGUAGE WEBSITE AUDIT:`);
        console.log('-'.repeat(50));

        const langResults = auditResults[lang];
        let langErrors = 0;
        let langWarnings = 0;
        let langFilesWithIssues = 0;

        langResults.forEach(result => {
            totalFiles++;
            
            if (result.errors.length > 0 || result.warnings.length > 0) {
                filesWithIssues++;
                langFilesWithIssues++;
                
                console.log(`\n📄 ${result.file}:`);
                
                if (result.errors.length > 0) {
                    langErrors += result.errors.length;
                    totalErrors += result.errors.length;
                    console.log(`  ❌ ERRORS (${result.errors.length}):`);
                    result.errors.forEach(error => console.log(`     • ${error}`));
                }
                
                if (result.warnings.length > 0) {
                    langWarnings += result.warnings.length;
                    totalWarnings += result.warnings.length;
                    console.log(`  ⚠️  WARNINGS (${result.warnings.length}):`);
                    result.warnings.forEach(warning => console.log(`     • ${warning}`));
                }

                // Translation status
                const headerStatus = result.translations.header ? '✅' : '❌';
                const footerStatus = result.translations.footer ? '✅' : '❌';
                const contentStatus = result.translations.content ? '✅' : '❌';
                
                console.log(`  📝 TRANSLATIONS: Header ${headerStatus} | Footer ${footerStatus} | Content ${contentStatus}`);
            }
        });

        // Language summary
        const cleanFiles = langResults.length - langFilesWithIssues;
        console.log(`\n📋 ${lang.toUpperCase()} SUMMARY:`);
        console.log(`  • Total Files: ${langResults.length}`);
        console.log(`  • Clean Files: ${cleanFiles} ✅`);
        console.log(`  • Files with Issues: ${langFilesWithIssues} ${langFilesWithIssues > 0 ? '⚠️' : '✅'}`);
        console.log(`  • Total Errors: ${langErrors} ${langErrors > 0 ? '❌' : '✅'}`);
        console.log(`  • Total Warnings: ${langWarnings} ${langWarnings > 0 ? '⚠️' : '✅'}`);
    });

    // Overall summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 OVERALL AUDIT SUMMARY:');
    console.log('='.repeat(80));
    console.log(`📊 Total Files Audited: ${totalFiles}`);
    console.log(`✅ Clean Files: ${totalFiles - filesWithIssues}`);
    console.log(`⚠️  Files with Issues: ${filesWithIssues}`);
    console.log(`❌ Total Errors: ${totalErrors}`);
    console.log(`⚠️  Total Warnings: ${totalWarnings}`);
    
    const healthScore = Math.round(((totalFiles - filesWithIssues) / totalFiles) * 100);
    console.log(`🏆 Website Health Score: ${healthScore}%`);
    
    if (totalErrors === 0 && totalWarnings === 0) {
        console.log('\n🎉 EXCELLENT! All language websites are clean and properly translated!');
    } else if (totalErrors === 0) {
        console.log('\n✅ GOOD! No critical errors found. Only minor translation warnings.');
    } else {
        console.log('\n🔧 ACTION NEEDED! Critical errors found that need fixing.');
    }
}

function main() {
    console.log('🔍 Starting comprehensive language website audit...\n');

    const auditResults = {};

    languages.forEach(lang => {
        console.log(`📁 Auditing ${lang.toUpperCase()} website...`);
        auditResults[lang] = [];
        
        allFiles.forEach(file => {
            const result = auditFile(lang, file);
            auditResults[lang].push(result);
        });
    });

    generateReport(auditResults);
}

if (require.main === module) {
    main();
}

module.exports = { auditFile, expectedTranslations, issueChecks };
