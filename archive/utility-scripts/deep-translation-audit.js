#!/usr/bin/env node

/**
 * Deep Translation Audit Script
 * 
 * This script performs a detailed check of translation completeness
 * by examining specific content areas and footer presence.
 */

const fs = require('fs');
const path = require('path');

// Languages to audit
const languages = ['fr', 'es', 'ar'];

// Files to check
const filesToCheck = [
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

function deepAuditFile(lang, fileName) {
    const filePath = path.join(lang, fileName);
    const results = {
        file: filePath,
        exists: false,
        hasFooter: false,
        footerTranslated: false,
        headerTranslated: false,
        pageTitle: null,
        issues: [],
        translationStatus: 'unknown'
    };
    
    try {
        if (!fs.existsSync(filePath)) {
            results.issues.push('File does not exist');
            return results;
        }

        results.exists = true;
        const content = fs.readFileSync(filePath, 'utf8');

        // Check for footer presence
        if (content.includes('<footer') || content.includes('site-footer')) {
            results.hasFooter = true;
        }

        // Check for specific translations based on language
        if (lang === 'es') {
            // Spanish checks
            if (content.includes('Potenciando la colaboración humano-IA')) {
                results.footerTranslated = true;
            }
            if (content.includes('Crea tu propia IA personalizada')) {
                results.headerTranslated = true;
            }
            
            // Check for Spanish page titles
            const titleMatch = content.match(/<title>([^<]+)<\/title>/);
            if (titleMatch) {
                results.pageTitle = titleMatch[1];
                if (titleMatch[1].includes('Divinci AI') && 
                    (titleMatch[1].includes('Contáctenos') || 
                     titleMatch[1].includes('Política de Privacidad') ||
                     titleMatch[1].includes('Términos') ||
                     titleMatch[1].includes('Acerca de') ||
                     titleMatch[1].includes('Carreras') ||
                     titleMatch[1].includes('Prensa'))) {
                    results.translationStatus = 'good';
                } else if (titleMatch[1].includes('Divinci AI')) {
                    results.translationStatus = 'partial';
                } else {
                    results.translationStatus = 'poor';
                }
            }
        } else if (lang === 'fr') {
            // French checks
            if (content.includes('Renforcer la collaboration humain-IA')) {
                results.footerTranslated = true;
            }
            if (content.includes('Créez votre propre IA personnalisée')) {
                results.headerTranslated = true;
            }
            
            const titleMatch = content.match(/<title>([^<]+)<\/title>/);
            if (titleMatch) {
                results.pageTitle = titleMatch[1];
                if (titleMatch[1].includes('Divinci AI') && 
                    (titleMatch[1].includes('Contact') || 
                     titleMatch[1].includes('Politique de Confidentialité') ||
                     titleMatch[1].includes('Conditions') ||
                     titleMatch[1].includes('À Propos') ||
                     titleMatch[1].includes('Carrières'))) {
                    results.translationStatus = 'good';
                } else if (titleMatch[1].includes('Divinci AI')) {
                    results.translationStatus = 'partial';
                } else {
                    results.translationStatus = 'poor';
                }
            }
        } else if (lang === 'ar') {
            // Arabic checks
            if (content.includes('تمكين التعاون بين الإنسان والذكاء الاصطناعي')) {
                results.footerTranslated = true;
            }
            if (content.includes('أنشئ ذكاءك الاصطناعي المخصص')) {
                results.headerTranslated = true;
            }
            
            const titleMatch = content.match(/<title>([^<]+)<\/title>/);
            if (titleMatch) {
                results.pageTitle = titleMatch[1];
                if (titleMatch[1].includes('Divinci AI') && 
                    (titleMatch[1].includes('اتصل بنا') || 
                     titleMatch[1].includes('سياسة الخصوصية') ||
                     titleMatch[1].includes('شروط') ||
                     titleMatch[1].includes('من نحن') ||
                     titleMatch[1].includes('الوظائف'))) {
                    results.translationStatus = 'good';
                } else if (titleMatch[1].includes('Divinci AI')) {
                    results.translationStatus = 'partial';
                } else {
                    results.translationStatus = 'poor';
                }
            }
        }

        // Check for common issues
        if (content.includes('data-include=')) {
            results.issues.push('Contains data-include references');
        }
        if (content.includes('debug-include.js')) {
            results.issues.push('Contains debug-include.js reference');
        }
        if (content.includes('Failed to load:')) {
            results.issues.push('Contains "Failed to load" errors');
        }

    } catch (error) {
        results.issues.push(`Read error: ${error.message}`);
    }

    return results;
}

function generateDetailedReport(auditResults) {
    console.log('\n🔍 DETAILED TRANSLATION AUDIT REPORT\n');
    console.log('=' .repeat(80));

    languages.forEach(lang => {
        console.log(`\n🌍 ${lang.toUpperCase()} DETAILED AUDIT:`);
        console.log('-'.repeat(50));

        const langResults = auditResults[lang];
        let filesWithFooter = 0;
        let filesWithTranslatedFooter = 0;
        let filesWithTranslatedHeader = 0;
        let filesWithIssues = 0;

        langResults.forEach(result => {
            if (result.hasFooter) filesWithFooter++;
            if (result.footerTranslated) filesWithTranslatedFooter++;
            if (result.headerTranslated) filesWithTranslatedHeader++;
            if (result.issues.length > 0) filesWithIssues++;

            // Show details for files with issues or interesting status
            if (result.issues.length > 0 || result.translationStatus === 'poor' || !result.hasFooter) {
                console.log(`\n📄 ${result.file}:`);
                console.log(`  📋 Title: ${result.pageTitle || 'Not found'}`);
                console.log(`  🦶 Footer: ${result.hasFooter ? '✅' : '❌'}`);
                console.log(`  🌐 Footer Translated: ${result.footerTranslated ? '✅' : '❌'}`);
                console.log(`  📱 Header Translated: ${result.headerTranslated ? '✅' : '❌'}`);
                console.log(`  📊 Translation Status: ${result.translationStatus}`);
                
                if (result.issues.length > 0) {
                    console.log(`  ⚠️  Issues:`);
                    result.issues.forEach(issue => console.log(`     • ${issue}`));
                }
            }
        });

        // Language summary
        console.log(`\n📊 ${lang.toUpperCase()} STATISTICS:`);
        console.log(`  📁 Total Files: ${langResults.length}`);
        console.log(`  🦶 Files with Footer: ${filesWithFooter}/${langResults.length}`);
        console.log(`  🌐 Files with Translated Footer: ${filesWithTranslatedFooter}/${langResults.length}`);
        console.log(`  📱 Files with Translated Header: ${filesWithTranslatedHeader}/${langResults.length}`);
        console.log(`  ⚠️  Files with Issues: ${filesWithIssues}/${langResults.length}`);
        
        const footerScore = Math.round((filesWithFooter / langResults.length) * 100);
        const translationScore = Math.round((filesWithTranslatedFooter / langResults.length) * 100);
        console.log(`  🏆 Footer Coverage: ${footerScore}%`);
        console.log(`  🌍 Translation Score: ${translationScore}%`);
    });

    // Overall summary
    console.log('\n' + '='.repeat(80));
    console.log('🎯 DETAILED AUDIT CONCLUSIONS:');
    console.log('='.repeat(80));
    
    let totalFiles = 0;
    let totalWithFooter = 0;
    let totalTranslated = 0;
    let totalIssues = 0;

    languages.forEach(lang => {
        const langResults = auditResults[lang];
        totalFiles += langResults.length;
        totalWithFooter += langResults.filter(r => r.hasFooter).length;
        totalTranslated += langResults.filter(r => r.footerTranslated).length;
        totalIssues += langResults.filter(r => r.issues.length > 0).length;
    });

    console.log(`📊 Overall Statistics:`);
    console.log(`  • Total Files: ${totalFiles}`);
    console.log(`  • Files with Footer: ${totalWithFooter}/${totalFiles} (${Math.round((totalWithFooter/totalFiles)*100)}%)`);
    console.log(`  • Files with Translated Content: ${totalTranslated}/${totalFiles} (${Math.round((totalTranslated/totalFiles)*100)}%)`);
    console.log(`  • Files with Issues: ${totalIssues}/${totalFiles} (${Math.round((totalIssues/totalFiles)*100)}%)`);
    
    if (totalIssues === 0 && totalTranslated > totalFiles * 0.8) {
        console.log('\n🎉 EXCELLENT! Language websites are in great shape!');
    } else if (totalIssues === 0) {
        console.log('\n✅ GOOD! No critical issues, but some translations could be improved.');
    } else {
        console.log('\n🔧 NEEDS ATTENTION! Some issues found that should be addressed.');
    }
}

function main() {
    console.log('🔍 Starting detailed translation audit...\n');

    const auditResults = {};

    languages.forEach(lang => {
        console.log(`📁 Deep auditing ${lang.toUpperCase()} website...`);
        auditResults[lang] = [];
        
        filesToCheck.forEach(file => {
            const result = deepAuditFile(lang, file);
            auditResults[lang].push(result);
        });
    });

    generateDetailedReport(auditResults);
}

if (require.main === module) {
    main();
}

module.exports = { deepAuditFile };
