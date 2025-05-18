#!/usr/bin/env node

/**
 * SEO Keyword Research Tool
 * 
 * This script helps with language-specific SEO keyword research by:
 * 1. Extracting existing keywords from HTML files
 * 2. Suggesting related keywords for each language
 * 3. Generating a keyword optimization report
 * 
 * Usage:
 * - Extract keywords: node seo-keyword-research.js extract
 * - Suggest keywords: node seo-keyword-research.js suggest
 * - Generate report: node seo-keyword-research.js report
 * - Run all steps: node seo-keyword-research.js all
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const glob = require('glob');
const cheerio = require('cheerio');
const axios = require('axios');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Promisify fs functions
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

// Configuration
const config = {
  languages: [
    { code: 'en', name: 'English', dir: 'ltr', default: true },
    { code: 'es', name: 'Español', dir: 'ltr' },
    { code: 'fr', name: 'Français', dir: 'ltr' },
    { code: 'ar', name: 'العربية', dir: 'rtl' }
  ],
  defaultLanguage: 'en',
  rootDir: path.resolve(__dirname, '..'),
  seoDir: path.resolve(__dirname, '../seo'),
  // Add your SEO API keys here
  serpApiKey: process.env.SERP_API_KEY,
  semrushApiKey: process.env.SEMRUSH_API_KEY,
  // Primary keywords for each language
  primaryKeywords: {
    en: ['ai chat', 'multiplayer ai', 'custom ai', 'ai collaboration', 'chatgpt alternative'],
    es: ['chat de ia', 'ia multijugador', 'ia personalizada', 'colaboración de ia', 'alternativa a chatgpt'],
    fr: ['chat ia', 'ia multijoueur', 'ia personnalisée', 'collaboration ia', 'alternative à chatgpt'],
    ar: ['دردشة الذكاء الاصطناعي', 'ذكاء اصطناعي متعدد اللاعبين', 'ذكاء اصطناعي مخصص', 'تعاون الذكاء الاصطناعي', 'بديل شات جي بي تي']
  }
};

/**
 * Extract existing keywords from HTML files
 */
async function extractKeywords() {
  try {
    console.log('🔍 Extracting existing keywords from HTML files...');
    
    // Create SEO directory
    await mkdir(config.seoDir, { recursive: true });
    
    // Initialize keywords object
    const keywords = {};
    
    // Process each language
    for (const lang of config.languages) {
      console.log(`🔍 Processing ${lang.name} (${lang.code})...`);
      
      // Find HTML files for this language
      const pattern = lang.code === config.defaultLanguage
        ? '**/*.html'
        : `${lang.code}/**/*.html`;
      
      const htmlFiles = glob.sync(pattern, {
        cwd: config.rootDir,
        ignore: [
          'node_modules/**',
          'dist/**',
          'build/**',
          'seo/**',
          'translations/**',
          'zola-site/templates/**',
          'templates/**',
          'includes/**',
          '**/404.html'
        ]
      });
      
      console.log(`📂 Found ${htmlFiles.length} HTML files for ${lang.code}`);
      
      // Initialize language keywords
      keywords[lang.code] = {
        pages: {},
        allKeywords: new Set()
      };
      
      // Process each HTML file
      for (const file of htmlFiles) {
        const filePath = path.join(config.rootDir, file);
        const content = await readFile(filePath, 'utf8');
        
        // Parse HTML
        const $ = cheerio.load(content);
        
        // Extract meta keywords
        const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
        const keywordsList = metaKeywords.split(',').map(k => k.trim()).filter(Boolean);
        
        // Extract title
        const title = $('title').text().trim();
        
        // Extract meta description
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        
        // Extract headings
        const headings = [];
        $('h1, h2, h3').each((i, el) => {
          headings.push($(el).text().trim());
        });
        
        // Extract main content text
        const mainContent = $('main, article, .content, #content').text().trim();
        
        // Store page data
        const pageData = {
          title,
          metaDescription,
          keywords: keywordsList,
          headings,
          wordCount: mainContent.split(/\s+/).length,
          path: file
        };
        
        // Add to language keywords
        keywords[lang.code].pages[file] = pageData;
        
        // Add to all keywords
        keywordsList.forEach(keyword => {
          keywords[lang.code].allKeywords.add(keyword);
        });
      }
      
      // Convert Set to Array
      keywords[lang.code].allKeywords = Array.from(keywords[lang.code].allKeywords);
    }
    
    // Write keywords to JSON file
    const keywordsPath = path.join(config.seoDir, 'existing-keywords.json');
    await writeFile(keywordsPath, JSON.stringify(keywords, null, 2), 'utf8');
    
    console.log(`✅ Extracted keywords saved to ${keywordsPath}`);
    
    return keywords;
  } catch (error) {
    console.error('❌ Error extracting keywords:', error.message);
    throw error;
  }
}

/**
 * Suggest related keywords for each language
 */
async function suggestKeywords() {
  try {
    console.log('🔍 Suggesting related keywords for each language...');
    
    // Check if existing keywords file exists
    const existingKeywordsPath = path.join(config.seoDir, 'existing-keywords.json');
    let existingKeywords = {};
    
    if (fs.existsSync(existingKeywordsPath)) {
      existingKeywords = JSON.parse(await readFile(existingKeywordsPath, 'utf8'));
    } else {
      console.log('⚠️ Existing keywords file not found. Running extraction first...');
      existingKeywords = await extractKeywords();
    }
    
    // Initialize suggested keywords object
    const suggestedKeywords = {};
    
    // Process each language
    for (const lang of config.languages) {
      console.log(`🔍 Suggesting keywords for ${lang.name} (${lang.code})...`);
      
      // Initialize language suggested keywords
      suggestedKeywords[lang.code] = {
        primaryKeywords: config.primaryKeywords[lang.code] || [],
        relatedKeywords: {},
        longTailKeywords: {}
      };
      
      // Get primary keywords for this language
      const primaryKeywords = config.primaryKeywords[lang.code] || [];
      
      // For each primary keyword, get related keywords
      for (const keyword of primaryKeywords) {
        console.log(`🔍 Finding related keywords for "${keyword}"...`);
        
        // If we have a SERP API key, use it to get related keywords
        if (config.serpApiKey) {
          try {
            const response = await axios.get('https://serpapi.com/search', {
              params: {
                q: keyword,
                api_key: config.serpApiKey,
                engine: 'google',
                gl: lang.code === 'en' ? 'us' : lang.code,
                hl: lang.code
              }
            });
            
            // Extract related searches
            const relatedSearches = response.data.related_searches || [];
            const relatedKeywords = relatedSearches.map(item => item.query);
            
            // Add to suggested keywords
            suggestedKeywords[lang.code].relatedKeywords[keyword] = relatedKeywords;
            
            // Get "People also ask" questions for long-tail keywords
            const peopleAlsoAsk = response.data.related_questions || [];
            const longTailKeywords = peopleAlsoAsk.map(item => item.question);
            
            // Add to suggested keywords
            suggestedKeywords[lang.code].longTailKeywords[keyword] = longTailKeywords;
          } catch (error) {
            console.error(`❌ Error getting related keywords for "${keyword}":`, error.message);
          }
        } else {
          // If no API key, use a simple approach to generate related keywords
          const relatedKeywords = generateSimpleRelatedKeywords(keyword, lang.code);
          suggestedKeywords[lang.code].relatedKeywords[keyword] = relatedKeywords;
          
          // Generate simple long-tail keywords
          const longTailKeywords = generateSimpleLongTailKeywords(keyword, lang.code);
          suggestedKeywords[lang.code].longTailKeywords[keyword] = longTailKeywords;
        }
        
        // Add a delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Write suggested keywords to JSON file
    const suggestedKeywordsPath = path.join(config.seoDir, 'suggested-keywords.json');
    await writeFile(suggestedKeywordsPath, JSON.stringify(suggestedKeywords, null, 2), 'utf8');
    
    console.log(`✅ Suggested keywords saved to ${suggestedKeywordsPath}`);
    
    return suggestedKeywords;
  } catch (error) {
    console.error('❌ Error suggesting keywords:', error.message);
    throw error;
  }
}

/**
 * Generate a simple set of related keywords without using an API
 */
function generateSimpleRelatedKeywords(keyword, langCode) {
  const relatedTerms = {
    en: ['best', 'top', 'free', 'online', 'app', 'tool', 'software', 'platform', 'service'],
    es: ['mejor', 'top', 'gratis', 'en línea', 'aplicación', 'herramienta', 'software', 'plataforma', 'servicio'],
    fr: ['meilleur', 'top', 'gratuit', 'en ligne', 'application', 'outil', 'logiciel', 'plateforme', 'service'],
    ar: ['أفضل', 'أعلى', 'مجاني', 'عبر الإنترنت', 'تطبيق', 'أداة', 'برنامج', 'منصة', 'خدمة']
  };
  
  const terms = relatedTerms[langCode] || relatedTerms.en;
  
  return terms.map(term => `${term} ${keyword}`);
}

/**
 * Generate a simple set of long-tail keywords without using an API
 */
function generateSimpleLongTailKeywords(keyword, langCode) {
  const questionPrefixes = {
    en: ['how to use', 'what is', 'why use', 'how does', 'is it worth'],
    es: ['cómo usar', 'qué es', 'por qué usar', 'cómo funciona', 'vale la pena'],
    fr: ['comment utiliser', 'qu\'est-ce que', 'pourquoi utiliser', 'comment fonctionne', 'est-ce que ça vaut'],
    ar: ['كيفية استخدام', 'ما هو', 'لماذا تستخدم', 'كيف يعمل', 'هل يستحق']
  };
  
  const prefixes = questionPrefixes[langCode] || questionPrefixes.en;
  
  return prefixes.map(prefix => `${prefix} ${keyword}`);
}

/**
 * Generate a keyword optimization report
 */
async function generateReport() {
  try {
    console.log('📊 Generating keyword optimization report...');
    
    // Check if existing keywords file exists
    const existingKeywordsPath = path.join(config.seoDir, 'existing-keywords.json');
    const suggestedKeywordsPath = path.join(config.seoDir, 'suggested-keywords.json');
    
    if (!fs.existsSync(existingKeywordsPath)) {
      console.error('❌ Existing keywords file not found. Run extraction first.');
      process.exit(1);
    }
    
    if (!fs.existsSync(suggestedKeywordsPath)) {
      console.error('❌ Suggested keywords file not found. Run suggestion first.');
      process.exit(1);
    }
    
    // Read keywords files
    const existingKeywords = JSON.parse(await readFile(existingKeywordsPath, 'utf8'));
    const suggestedKeywords = JSON.parse(await readFile(suggestedKeywordsPath, 'utf8'));
    
    // Initialize report object
    const report = {};
    
    // Process each language
    for (const lang of config.languages) {
      console.log(`📊 Generating report for ${lang.name} (${lang.code})...`);
      
      // Initialize language report
      report[lang.code] = {
        summary: {
          totalPages: Object.keys(existingKeywords[lang.code]?.pages || {}).length,
          totalKeywords: existingKeywords[lang.code]?.allKeywords?.length || 0,
          primaryKeywords: suggestedKeywords[lang.code]?.primaryKeywords || [],
          suggestedKeywordsCount: Object.values(suggestedKeywords[lang.code]?.relatedKeywords || {})
            .reduce((total, keywords) => total + keywords.length, 0)
        },
        pageRecommendations: {}
      };
      
      // Generate recommendations for each page
      const pages = existingKeywords[lang.code]?.pages || {};
      
      for (const [pagePath, pageData] of Object.entries(pages)) {
        // Find the most relevant primary keyword for this page
        const primaryKeyword = findMostRelevantKeyword(
          pageData.title + ' ' + pageData.metaDescription,
          suggestedKeywords[lang.code]?.primaryKeywords || []
        );
        
        // Get related keywords for this primary keyword
        const relatedKeywords = suggestedKeywords[lang.code]?.relatedKeywords?.[primaryKeyword] || [];
        
        // Get long-tail keywords for this primary keyword
        const longTailKeywords = suggestedKeywords[lang.code]?.longTailKeywords?.[primaryKeyword] || [];
        
        // Check if primary keyword is in title
        const primaryKeywordInTitle = pageData.title.toLowerCase().includes(primaryKeyword.toLowerCase());
        
        // Check if primary keyword is in meta description
        const primaryKeywordInDescription = pageData.metaDescription.toLowerCase().includes(primaryKeyword.toLowerCase());
        
        // Check if primary keyword is in headings
        const primaryKeywordInHeadings = pageData.headings.some(heading => 
          heading.toLowerCase().includes(primaryKeyword.toLowerCase())
        );
        
        // Generate recommendations
        const recommendations = [];
        
        if (!primaryKeywordInTitle) {
          recommendations.push(`Add primary keyword "${primaryKeyword}" to the page title`);
        }
        
        if (!primaryKeywordInDescription) {
          recommendations.push(`Add primary keyword "${primaryKeyword}" to the meta description`);
        }
        
        if (!primaryKeywordInHeadings) {
          recommendations.push(`Add primary keyword "${primaryKeyword}" to at least one heading`);
        }
        
        // Check if any related keywords are used
        const usedRelatedKeywords = relatedKeywords.filter(keyword => 
          pageData.title.toLowerCase().includes(keyword.toLowerCase()) ||
          pageData.metaDescription.toLowerCase().includes(keyword.toLowerCase()) ||
          pageData.headings.some(heading => heading.toLowerCase().includes(keyword.toLowerCase()))
        );
        
        if (usedRelatedKeywords.length === 0 && relatedKeywords.length > 0) {
          recommendations.push(`Add some related keywords to the content: ${relatedKeywords.slice(0, 3).join(', ')}`);
        }
        
        // Add page to report
        report[lang.code].pageRecommendations[pagePath] = {
          title: pageData.title,
          primaryKeyword,
          currentKeywords: pageData.keywords,
          recommendedKeywords: [
            primaryKeyword,
            ...relatedKeywords.slice(0, 5),
            ...longTailKeywords.slice(0, 3)
          ],
          recommendations
        };
      }
    }
    
    // Write report to JSON file
    const reportPath = path.join(config.seoDir, 'keyword-optimization-report.json');
    await writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
    
    // Generate HTML report
    const htmlReport = generateHtmlReport(report);
    const htmlReportPath = path.join(config.seoDir, 'keyword-optimization-report.html');
    await writeFile(htmlReportPath, htmlReport, 'utf8');
    
    console.log(`✅ Keyword optimization report saved to ${reportPath}`);
    console.log(`✅ HTML report saved to ${htmlReportPath}`);
    
    return report;
  } catch (error) {
    console.error('❌ Error generating report:', error.message);
    throw error;
  }
}

/**
 * Find the most relevant keyword from a list for a given text
 */
function findMostRelevantKeyword(text, keywords) {
  if (!keywords || keywords.length === 0) return '';
  
  // Convert text to lowercase for case-insensitive matching
  const lowerText = text.toLowerCase();
  
  // Check if any keywords are in the text
  for (const keyword of keywords) {
    if (lowerText.includes(keyword.toLowerCase())) {
      return keyword;
    }
  }
  
  // If no keywords are found, return the first one
  return keywords[0];
}

/**
 * Generate an HTML report from the report data
 */
function generateHtmlReport(report) {
  // HTML template
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Keyword Optimization Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
    h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
    h2 { color: #2980b9; margin-top: 30px; }
    h3 { color: #3498db; }
    .language-section { margin-bottom: 40px; }
    .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
    .summary p { margin: 5px 0; }
    .page { background-color: #fff; border: 1px solid #ddd; border-radius: 5px; padding: 15px; margin-bottom: 15px; }
    .page h4 { margin-top: 0; color: #2c3e50; }
    .recommendations { background-color: #f0f7fb; padding: 10px; border-left: 5px solid #3498db; }
    .recommendations li { margin-bottom: 5px; }
    .keywords { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 10px; }
    .keyword { background-color: #e1f0fa; padding: 3px 8px; border-radius: 3px; font-size: 0.9em; }
    .tabs { display: flex; margin-bottom: 20px; }
    .tab { padding: 10px 15px; cursor: pointer; background-color: #f1f1f1; border: none; }
    .tab.active { background-color: #3498db; color: white; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
  </style>
</head>
<body>
  <h1>Keyword Optimization Report</h1>
  
  <div class="tabs">
`;

  // Add tabs for each language
  for (const lang of config.languages) {
    html += `    <button class="tab ${lang.code === 'en' ? 'active' : ''}" onclick="openTab(event, '${lang.code}')">${lang.name}</button>\n`;
  }

  html += `  </div>\n`;

  // Add content for each language
  for (const [langCode, langData] of Object.entries(report)) {
    const lang = config.languages.find(l => l.code === langCode);
    
    html += `
  <div id="${langCode}" class="tab-content ${langCode === 'en' ? 'active' : ''}">
    <div class="language-section">
      <h2>${lang.name} (${lang.code})</h2>
      
      <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Pages:</strong> ${langData.summary.totalPages}</p>
        <p><strong>Total Existing Keywords:</strong> ${langData.summary.totalKeywords}</p>
        <p><strong>Primary Keywords:</strong> ${langData.summary.primaryKeywords.join(', ')}</p>
        <p><strong>Suggested Keywords Count:</strong> ${langData.summary.suggestedKeywordsCount}</p>
      </div>
      
      <h3>Page Recommendations</h3>
`;

    // Add page recommendations
    for (const [pagePath, pageData] of Object.entries(langData.pageRecommendations)) {
      html += `
      <div class="page">
        <h4>${pageData.title}</h4>
        <p><strong>Page:</strong> ${pagePath}</p>
        <p><strong>Primary Keyword:</strong> ${pageData.primaryKeyword}</p>
        
        <div>
          <strong>Current Keywords:</strong>
          <div class="keywords">
            ${pageData.currentKeywords.map(kw => `<span class="keyword">${kw}</span>`).join('')}
          </div>
        </div>
        
        <div>
          <strong>Recommended Keywords:</strong>
          <div class="keywords">
            ${pageData.recommendedKeywords.map(kw => `<span class="keyword">${kw}</span>`).join('')}
          </div>
        </div>
        
        <div class="recommendations">
          <strong>Recommendations:</strong>
          ${pageData.recommendations.length > 0 
            ? `<ul>${pageData.recommendations.map(rec => `<li>${rec}</li>`).join('')}</ul>` 
            : '<p>No recommendations - page is well optimized!</p>'}
        </div>
      </div>
`;
    }

    html += `    </div>\n  </div>\n`;
  }

  // Add JavaScript for tabs
  html += `
  <script>
    function openTab(evt, langCode) {
      // Hide all tab content
      const tabContents = document.getElementsByClassName("tab-content");
      for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
      }
      
      // Remove active class from all tabs
      const tabs = document.getElementsByClassName("tab");
      for (let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove("active");
      }
      
      // Show the selected tab content and add active class to the button
      document.getElementById(langCode).classList.add("active");
      evt.currentTarget.classList.add("active");
    }
  </script>
</body>
</html>
`;

  return html;
}

/**
 * Main function
 */
async function main() {
  try {
    const command = process.argv[2] || 'help';
    
    switch (command) {
      case 'extract':
        await extractKeywords();
        break;
      case 'suggest':
        await suggestKeywords();
        break;
      case 'report':
        await generateReport();
        break;
      case 'all':
        await extractKeywords();
        await suggestKeywords();
        await generateReport();
        break;
      case 'help':
      default:
        console.log(`
SEO Keyword Research Tool

Usage:
  node seo-keyword-research.js <command>

Commands:
  extract    Extract existing keywords from HTML files
  suggest    Suggest related keywords for each language
  report     Generate a keyword optimization report
  all        Run all steps in sequence
  help       Show this help message
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the main function
main();
