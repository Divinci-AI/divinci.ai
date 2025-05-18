/**
 * Generate a comprehensive accessibility report from test results
 */
const fs = require('fs');
const path = require('path');

// Directory containing the test results
const RESULTS_DIR = path.join(process.cwd(), 'test-results', 'accessibility');

// Output file for the report
const OUTPUT_FILE = path.join(process.cwd(), 'accessibility-report.md');

// Categories of accessibility issues
const CATEGORIES = {
  'aria': 'ARIA',
  'color-contrast': 'Color Contrast',
  'forms': 'Forms',
  'keyboard': 'Keyboard Navigation',
  'language': 'Language',
  'name-role-value': 'Name, Role, Value',
  'parsing': 'Parsing',
  'semantics': 'Semantics',
  'sensory-and-visual-cues': 'Sensory and Visual Cues',
  'structure': 'Structure',
  'tables': 'Tables',
  'text-alternatives': 'Text Alternatives',
  'time-and-media': 'Time and Media',
};

/**
 * Get all JSON result files in the results directory
 * @returns {string[]} - Array of file paths
 */
function getResultFiles() {
  if (!fs.existsSync(RESULTS_DIR)) {
    console.error(`Results directory not found: ${RESULTS_DIR}`);
    return [];
  }
  
  return fs.readdirSync(RESULTS_DIR)
    .filter(file => file.endsWith('.json') && !file.endsWith('_summary.json'))
    .map(file => path.join(RESULTS_DIR, file));
}

/**
 * Parse a result file and extract violations
 * @param {string} filePath - Path to the result file
 * @returns {Object} - Parsed violations
 */
function parseResultFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = JSON.parse(content);
    
    // Extract the URL from the filename
    const filename = path.basename(filePath, '.json');
    const url = filename
      .replace(/_/g, '/')
      .replace(/localhost_8080/, 'http://localhost:8080');
    
    return {
      url,
      violations: result.violations || []
    };
  } catch (error) {
    console.error(`Error parsing result file ${filePath}: ${error.message}`);
    return {
      url: 'Unknown',
      violations: []
    };
  }
}

/**
 * Categorize violations by type
 * @param {Object[]} allViolations - Array of violations from all pages
 * @returns {Object} - Violations categorized by type
 */
function categorizeViolations(allViolations) {
  const categorized = {};
  
  allViolations.forEach(({ url, violations }) => {
    violations.forEach(violation => {
      // Determine the category based on tags
      let category = 'other';
      for (const tag of violation.tags) {
        if (CATEGORIES[tag]) {
          category = tag;
          break;
        }
      }
      
      // Initialize the category if it doesn't exist
      if (!categorized[category]) {
        categorized[category] = [];
      }
      
      // Add the violation to the category
      categorized[category].push({
        url,
        id: violation.id,
        impact: violation.impact,
        help: violation.help,
        description: violation.description,
        helpUrl: violation.helpUrl,
        nodes: violation.nodes
      });
    });
  });
  
  return categorized;
}

/**
 * Generate a markdown report from categorized violations
 * @param {Object} categorizedViolations - Violations categorized by type
 * @returns {string} - Markdown report
 */
function generateReport(categorizedViolations) {
  let report = `# Accessibility Audit Report\n\n`;
  
  // Add a timestamp
  report += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  // Add a summary
  const totalViolations = Object.values(categorizedViolations)
    .reduce((sum, violations) => sum + violations.length, 0);
  
  report += `## Summary\n\n`;
  report += `Total violations found: ${totalViolations}\n\n`;
  
  // Add a table of contents
  report += `## Table of Contents\n\n`;
  
  for (const category in categorizedViolations) {
    if (categorizedViolations[category].length > 0) {
      const displayName = CATEGORIES[category] || category.charAt(0).toUpperCase() + category.slice(1);
      report += `- [${displayName} (${categorizedViolations[category].length})](${displayName.toLowerCase().replace(/\s+/g, '-')})\n`;
    }
  }
  
  report += `\n`;
  
  // Add detailed violations by category
  for (const category in categorizedViolations) {
    if (categorizedViolations[category].length > 0) {
      const displayName = CATEGORIES[category] || category.charAt(0).toUpperCase() + category.slice(1);
      report += `## ${displayName}\n\n`;
      
      // Group violations by ID
      const violationsByID = {};
      
      categorizedViolations[category].forEach(violation => {
        if (!violationsByID[violation.id]) {
          violationsByID[violation.id] = [];
        }
        
        violationsByID[violation.id].push(violation);
      });
      
      // Add each violation type
      for (const id in violationsByID) {
        const violations = violationsByID[id];
        const firstViolation = violations[0];
        
        report += `### ${firstViolation.help}\n\n`;
        report += `**Impact:** ${firstViolation.impact}\n\n`;
        report += `**Description:** ${firstViolation.description}\n\n`;
        report += `**Help:** [${firstViolation.helpUrl}](${firstViolation.helpUrl})\n\n`;
        report += `**Occurrences:** ${violations.length}\n\n`;
        
        // Add affected pages
        report += `**Affected Pages:**\n\n`;
        
        const affectedPages = new Set();
        violations.forEach(violation => {
          affectedPages.add(violation.url);
        });
        
        Array.from(affectedPages).forEach(url => {
          report += `- ${url}\n`;
        });
        
        report += `\n`;
        
        // Add example of affected elements
        report += `**Example Elements:**\n\n`;
        
        const exampleViolation = violations[0];
        const exampleNodes = exampleViolation.nodes.slice(0, 3); // Show up to 3 examples
        
        exampleNodes.forEach(node => {
          report += `\`\`\`html\n${node.html}\n\`\`\`\n\n`;
        });
        
        // Add fix recommendations
        report += `**Fix Recommendations:**\n\n`;
        
        switch (id) {
          case 'color-contrast':
            report += `- Increase the contrast ratio between the foreground and background colors\n`;
            report += `- Use the enhanced-accessibility.css file to apply better contrast\n`;
            break;
          case 'document-title':
            report += `- Add a descriptive title to the document\n`;
            break;
          case 'html-has-lang':
            report += `- Add a lang attribute to the html element\n`;
            break;
          case 'image-alt':
            report += `- Add alt text to images that convey information\n`;
            report += `- Use empty alt text (alt="") for decorative images\n`;
            break;
          case 'label':
            report += `- Add labels to form controls\n`;
            report += `- Associate labels with form controls using the for attribute\n`;
            break;
          case 'link-name':
            report += `- Add text content to links\n`;
            report += `- Use aria-label or aria-labelledby for links without text\n`;
            break;
          case 'list':
            report += `- Use proper list markup (ul, ol, li) for lists\n`;
            break;
          case 'landmark-one-main':
            report += `- Add a main landmark to the page\n`;
            report += `- Use <main> or role="main" to identify the main content\n`;
            break;
          case 'region':
            report += `- Ensure all content is contained within landmarks\n`;
            break;
          case 'button-name':
            report += `- Add text content to buttons\n`;
            report += `- Use aria-label or aria-labelledby for buttons without text\n`;
            break;
          case 'aria-required-attr':
            report += `- Add required ARIA attributes to elements with ARIA roles\n`;
            break;
          case 'aria-required-children':
            report += `- Add required child elements to elements with certain ARIA roles\n`;
            break;
          case 'aria-required-parent':
            report += `- Add required parent elements to elements with certain ARIA roles\n`;
            break;
          case 'aria-roles':
            report += `- Use valid ARIA roles\n`;
            break;
          case 'aria-valid-attr':
            report += `- Use valid ARIA attributes\n`;
            break;
          case 'aria-valid-attr-value':
            report += `- Use valid values for ARIA attributes\n`;
            break;
          case 'duplicate-id':
            report += `- Ensure all IDs are unique\n`;
            break;
          case 'frame-title':
            report += `- Add title attributes to frames and iframes\n`;
            break;
          case 'heading-order':
            report += `- Use headings in a logical order (h1, h2, h3, etc.)\n`;
            break;
          case 'meta-viewport':
            report += `- Ensure the viewport meta tag doesn't disable zooming\n`;
            break;
          default:
            report += `- See the help link for specific recommendations\n`;
        }
        
        report += `\n`;
      }
    }
  }
  
  return report;
}

/**
 * Main function
 */
function main() {
  // Get all result files
  const resultFiles = getResultFiles();
  
  if (resultFiles.length === 0) {
    console.error('No result files found. Run the accessibility tests first.');
    process.exit(1);
  }
  
  console.log(`Found ${resultFiles.length} result files.`);
  
  // Parse all result files
  const allViolations = resultFiles.map(parseResultFile);
  
  // Categorize violations
  const categorizedViolations = categorizeViolations(allViolations);
  
  // Generate the report
  const report = generateReport(categorizedViolations);
  
  // Write the report to a file
  fs.writeFileSync(OUTPUT_FILE, report);
  
  console.log(`Report generated: ${OUTPUT_FILE}`);
}

// Run the main function
main();
