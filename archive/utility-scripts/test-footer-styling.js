#!/usr/bin/env node

/**
 * Test Footer Styling Script
 * 
 * This script verifies that the footer CSS is properly loaded on the problematic pages
 */

const fs = require('fs');

const pagesToCheck = [
    'terms-of-service.html',
    'privacy-policy.html', 
    'ai-safety-ethics.html'
];

function checkFooterCSS(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            console.log(`❌ File ${filePath} does not exist`);
            return false;
        }

        const content = fs.readFileSync(filePath, 'utf8');
        
        // Check if styles-footer.css is included
        const hasFooterCSS = content.includes('styles-footer.css');
        
        // Check if footer has sacred geometry elements
        const hasSacredGeometry = content.includes('footer-sacred-pattern') && 
                                 content.includes('sacred-circle');
        
        // Check if footer has proper structure
        const hasFooterStructure = content.includes('site-footer') && 
                                  content.includes('footer-brand') &&
                                  content.includes('footer-links-column');

        console.log(`\n📄 ${filePath}:`);
        console.log(`   Footer CSS: ${hasFooterCSS ? '✅' : '❌'}`);
        console.log(`   Sacred Geometry: ${hasSacredGeometry ? '✅' : '❌'}`);
        console.log(`   Footer Structure: ${hasFooterStructure ? '✅' : '❌'}`);
        
        const allGood = hasFooterCSS && hasSacredGeometry && hasFooterStructure;
        console.log(`   Overall: ${allGood ? '✅ GOOD' : '❌ NEEDS FIX'}`);
        
        return allGood;

    } catch (error) {
        console.error(`❌ Error checking ${filePath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🔍 Testing Footer Styling on Problematic Pages...\n');

    let allPassed = true;
    
    pagesToCheck.forEach(page => {
        const result = checkFooterCSS(page);
        if (!result) {
            allPassed = false;
        }
    });

    console.log('\n' + '='.repeat(50));
    if (allPassed) {
        console.log('🎉 All pages have proper footer styling!');
    } else {
        console.log('⚠️  Some pages still need footer styling fixes.');
    }
    console.log('='.repeat(50));
}

if (require.main === module) {
    main();
}

module.exports = { checkFooterCSS };
