// @ts-check
const { test, expect } = require('@playwright/test');
const fs = require('fs');

/**
 * Translation Coverage Audit
 * Comprehensive test to identify missing translations across all languages
 */

test.describe('Translation Coverage Audit', () => {
  const baseLanguage = 'en';
  const supportedLanguages = ['en', 'es', 'fr', 'ar', 'ja', 'zh', 'it', 'ru', 'de', 'pt', 'ko', 'nl', 'hi'];
  
  test('should audit translation coverage for all languages', async () => {
    console.log('🔍 Starting comprehensive translation coverage audit...\n');
    
    // Load all translation files
    const translations = {};
    const loadErrors = [];
    
    for (const lang of supportedLanguages) {
      try {
        const filePath = `data/translations/${lang}.json`;
        const content = fs.readFileSync(filePath, 'utf8');
        translations[lang] = JSON.parse(content);
      } catch (error) {
        loadErrors.push({ lang, error: error.message });
      }
    }
    
    // Report loading errors
    if (loadErrors.length > 0) {
      console.log('❌ Translation file loading errors:');
      loadErrors.forEach(({ lang, error }) => {
        console.log(`  - ${lang}: ${error}`);
      });
    }
    
    // Use English as the reference
    const baseTranslation = translations[baseLanguage];
    expect(baseTranslation).toBeDefined();
    
    // Audit each language
    const auditResults = [];
    
    for (const lang of supportedLanguages) {
      if (lang === baseLanguage) continue;
      
      const targetTranslation = translations[lang];
      if (!targetTranslation) {
        auditResults.push({
          language: lang,
          status: 'missing_file',
          missing_keys: [],
          coverage: 0
        });
        continue;
      }
      
      const missingKeys = getMissingKeys(baseTranslation, targetTranslation);
      const totalKeys = countAllKeys(baseTranslation);
      const coverage = Math.round(((totalKeys - missingKeys.length) / totalKeys) * 100);
      
      auditResults.push({
        language: lang,
        status: missingKeys.length === 0 ? 'complete' : 'incomplete',
        missing_keys: missingKeys,
        coverage: coverage,
        missing_count: missingKeys.length,
        total_keys: totalKeys
      });
    }
    
    // Report results
    console.log('📊 Translation Coverage Report:\n');
    
    const completeLanguages = auditResults.filter(r => r.status === 'complete');
    const incompleteLanguages = auditResults.filter(r => r.status === 'incomplete');
    const missingFiles = auditResults.filter(r => r.status === 'missing_file');
    
    console.log(`✅ Complete translations: ${completeLanguages.length}`);
    completeLanguages.forEach(result => {
      console.log(`  - ${result.language}: ${result.coverage}% (${result.total_keys} keys)`);
    });
    
    console.log(`\n⚠️  Incomplete translations: ${incompleteLanguages.length}`);
    incompleteLanguages.forEach(result => {
      console.log(`  - ${result.language}: ${result.coverage}% (${result.missing_count}/${result.total_keys} missing)`);
      if (result.missing_keys.length <= 15) {
        result.missing_keys.forEach(key => console.log(`    - ${key}`));
      } else {
        result.missing_keys.slice(0, 10).forEach(key => console.log(`    - ${key}`));
        console.log(`    ... and ${result.missing_keys.length - 10} more`);
      }
      console.log('');
    });
    
    if (missingFiles.length > 0) {
      console.log(`\n❌ Missing translation files: ${missingFiles.length}`);
      missingFiles.forEach(result => {
        console.log(`  - ${result.language}`);
      });
    }
    
    // Summary recommendations
    console.log('\n🎯 Recommendations:');
    
    const highPriorityLanguages = incompleteLanguages.filter(r => r.coverage < 80);
    if (highPriorityLanguages.length > 0) {
      console.log(`📈 High priority updates needed for: ${highPriorityLanguages.map(r => r.language).join(', ')}`);
    }
    
    const mostCommonMissing = findMostCommonMissingKeys(incompleteLanguages);
    if (mostCommonMissing.length > 0) {
      console.log('\n🔄 Most commonly missing keys (should be prioritized):');
      mostCommonMissing.slice(0, 10).forEach(({ key, count }) => {
        console.log(`  - ${key} (missing in ${count} languages)`);
      });
    }
    
    // Test assertions
    expect(loadErrors).toHaveLength(0);
    
    // We expect at least Spanish and French to be complete
    const spanishResult = auditResults.find(r => r.language === 'es');
    const frenchResult = auditResults.find(r => r.language === 'fr');
    
    expect(spanishResult?.coverage).toBeGreaterThan(80);
    expect(frenchResult?.coverage).toBeGreaterThan(80);
    
    // Report if many languages are severely incomplete
    const severelyIncomplete = incompleteLanguages.filter(r => r.coverage < 50);
    if (severelyIncomplete.length > 0) {
      console.log(`\n🚨 Warning: ${severelyIncomplete.length} languages have less than 50% coverage`);
    }
  });
  
  test('should verify recent content additions are translated', async () => {
    const baseTranslation = JSON.parse(fs.readFileSync('data/translations/en.json', 'utf8'));
    
    // Check for recently added content that should be prioritized
    const recentAdditions = [
      'support',
      'contact',
      'expert_answers',
      'navigation.support_center',
      'features.journal_title'
    ];
    
    console.log('\n🆕 Checking recent content additions across languages...\n');
    
    const results = [];
    
    for (const lang of supportedLanguages) {
      if (lang === 'en') continue;
      
      try {
        const translation = JSON.parse(fs.readFileSync(`data/translations/${lang}.json`, 'utf8'));
        const missing = [];
        
        for (const key of recentAdditions) {
          if (!hasNestedKey(translation, key)) {
            missing.push(key);
          }
        }
        
        results.push({
          language: lang,
          missing_recent: missing,
          recent_coverage: Math.round(((recentAdditions.length - missing.length) / recentAdditions.length) * 100)
        });
        
        if (missing.length > 0) {
          console.log(`⚠️ ${lang}: Missing ${missing.length}/${recentAdditions.length} recent additions`);
          missing.forEach(key => console.log(`   - ${key}`));
        } else {
          console.log(`✅ ${lang}: All recent additions present`);
        }
        
      } catch (error) {
        console.log(`❌ ${lang}: Error reading translation file`);
      }
    }
    
    // High priority languages should have most recent content
    const highPriorityLangs = ['es', 'fr', 'ar'];
    for (const lang of highPriorityLangs) {
      const result = results.find(r => r.language === lang);
      expect(result?.recent_coverage).toBeGreaterThan(70);
    }
  });
});

// Helper functions
function getMissingKeys(source, target, path = '') {
  const missing = [];
  for (let key in source) {
    const newPath = path ? `${path}.${key}` : key;
    if (!(key in target)) {
      missing.push(newPath);
    } else if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      missing.push(...getMissingKeys(source[key], target[key] || {}, newPath));
    }
  }
  return missing;
}

function countAllKeys(obj, count = 0) {
  for (let key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count = countAllKeys(obj[key], count);
    } else {
      count++;
    }
  }
  return count;
}

function hasNestedKey(obj, path) {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return false;
    }
  }
  
  return true;
}

function findMostCommonMissingKeys(incompleteLanguages) {
  const keyCount = {};
  
  incompleteLanguages.forEach(lang => {
    lang.missing_keys.forEach(key => {
      keyCount[key] = (keyCount[key] || 0) + 1;
    });
  });
  
  return Object.entries(keyCount)
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}