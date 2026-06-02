/**
 * Fix common accessibility issues identified in the accessibility report
 */
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// Path to the accessibility report
const REPORT_FILE = path.join(process.cwd(), 'accessibility-report.md');

// Directory containing the website files
const WEBSITE_DIR = process.cwd();

// Files to exclude from fixing
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'test-results',
  'tests'
];

// Map of file extensions to content types
const CONTENT_TYPES = {
  '.html': 'html',
  '.htm': 'html',
  '.js': 'js',
  '.jsx': 'js',
  '.ts': 'js',
  '.tsx': 'js',
  '.css': 'css',
  '.scss': 'css',
  '.sass': 'css',
  '.less': 'css'
};

/**
 * Check if a file should be excluded from fixing
 * @param {string} filePath - The file path to check
 * @returns {boolean} - Whether the file should be excluded
 */
function shouldExclude(filePath) {
  for (const pattern of EXCLUDE_PATTERNS) {
    if (filePath.includes(pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Get the content type of a file
 * @param {string} filePath - The file path
 * @returns {string|null} - The content type or null if unknown
 */
function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return CONTENT_TYPES[ext] || null;
}

/**
 * Find all files in a directory recursively
 * @param {string} dir - The directory to search
 * @param {string[]} fileList - The list of files found
 * @returns {string[]} - The list of files found
 */
function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    
    if (shouldExclude(filePath)) {
      return;
    }
    
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else {
      const contentType = getContentType(filePath);
      
      if (contentType) {
        fileList.push({
          path: filePath,
          type: contentType
        });
      }
    }
  });
  
  return fileList;
}

/**
 * Fix HTML accessibility issues
 * @param {string} filePath - The file path
 * @param {string} content - The file content
 * @returns {string} - The fixed content
 */
function fixHtmlIssues(filePath, content) {
  const dom = new JSDOM(content);
  const { document } = dom.window;
  let modified = false;
  
  // Fix 1: Add lang attribute to html element
  const html = document.querySelector('html');
  if (html && !html.getAttribute('lang')) {
    html.setAttribute('lang', 'en');
    console.log(`Fixed: Added lang attribute to html element in ${filePath}`);
    modified = true;
  }
  
  // Fix 2: Add title to document if missing
  const head = document.querySelector('head');
  if (head) {
    const title = head.querySelector('title');
    if (!title) {
      const newTitle = document.createElement('title');
      newTitle.textContent = path.basename(filePath, '.html') || 'Document';
      head.appendChild(newTitle);
      console.log(`Fixed: Added title element to ${filePath}`);
      modified = true;
    }
  }
  
  // Fix 3: Add alt text to images
  const images = document.querySelectorAll('img:not([alt])');
  images.forEach(img => {
    const src = img.getAttribute('src') || '';
    const fileName = path.basename(src, path.extname(src));
    const altText = fileName
      .replace(/[_-]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
    
    img.setAttribute('alt', altText || '');
    console.log(`Fixed: Added alt text to image in ${filePath}`);
    modified = true;
  });
  
  // Fix 4: Add labels to form controls
  const formControls = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
  formControls.forEach(control => {
    const id = control.getAttribute('id');
    
    if (id) {
      const hasLabel = document.querySelector(`label[for="${id}"]`);
      
      if (!hasLabel) {
        const label = document.createElement('label');
        label.setAttribute('for', id);
        
        // Try to generate a label text
        let labelText = '';
        
        // Try to get label text from placeholder
        if (control.getAttribute('placeholder')) {
          labelText = control.getAttribute('placeholder');
        }
        // Try to get label text from name attribute
        else if (control.getAttribute('name')) {
          labelText = control.getAttribute('name')
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        }
        // Try to get label text from ID
        else {
          labelText = id
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase());
        }
        
        label.textContent = labelText;
        
        // Insert the label before the control
        control.parentNode.insertBefore(label, control);
        console.log(`Fixed: Added label to form control in ${filePath}`);
        modified = true;
      }
    } else {
      // Generate an ID if the control doesn't have one
      const newId = `control-${Math.random().toString(36).substring(2, 9)}`;
      control.setAttribute('id', newId);
      
      const label = document.createElement('label');
      label.setAttribute('for', newId);
      
      // Try to generate a label text
      let labelText = '';
      
      // Try to get label text from placeholder
      if (control.getAttribute('placeholder')) {
        labelText = control.getAttribute('placeholder');
      }
      // Try to get label text from name attribute
      else if (control.getAttribute('name')) {
        labelText = control.getAttribute('name')
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());
      }
      // Use a generic label if all else fails
      else {
        labelText = 'Input';
      }
      
      label.textContent = labelText;
      
      // Insert the label before the control
      control.parentNode.insertBefore(label, control);
      console.log(`Fixed: Added ID and label to form control in ${filePath}`);
      modified = true;
    }
  });
  
  // Fix 5: Add text to links without discernible text
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    const hasText = link.textContent.trim() !== '';
    const hasAriaLabel = link.hasAttribute('aria-label');
    const hasTitle = link.hasAttribute('title');
    
    if (!hasText && !hasAriaLabel && !hasTitle) {
      const href = link.getAttribute('href') || '';
      const fileName = path.basename(href, path.extname(href));
      const linkText = fileName
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      
      if (linkText) {
        link.setAttribute('aria-label', linkText);
        console.log(`Fixed: Added aria-label to link in ${filePath}`);
        modified = true;
      }
    }
  });
  
  // Fix 6: Add main landmark if missing
  const hasMain = document.querySelector('main, [role="main"]');
  if (!hasMain) {
    const content = document.querySelector('.content, .main-content, #content, #main-content');
    
    if (content) {
      content.setAttribute('role', 'main');
      console.log(`Fixed: Added main landmark to ${filePath}`);
      modified = true;
    }
  }
  
  // Fix 7: Add skip link if missing
  const hasSkipLink = document.querySelector('.skip-link, a[href="#main-content"], a[href="#content"]');
  if (!hasSkipLink && document.body) {
    const skipLink = document.createElement('a');
    skipLink.className = 'skip-link';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    
    document.body.insertBefore(skipLink, document.body.firstChild);
    console.log(`Fixed: Added skip link to ${filePath}`);
    modified = true;
  }
  
  // Fix 8: Fix duplicate IDs
  const elementsWithIds = document.querySelectorAll('[id]');
  const ids = {};
  
  elementsWithIds.forEach(element => {
    const id = element.getAttribute('id');
    
    if (ids[id]) {
      const newId = `${id}-${Math.random().toString(36).substring(2, 9)}`;
      element.setAttribute('id', newId);
      console.log(`Fixed: Changed duplicate ID "${id}" to "${newId}" in ${filePath}`);
      modified = true;
    } else {
      ids[id] = true;
    }
  });
  
  // Return the fixed content if modified
  if (modified) {
    return dom.serialize();
  }
  
  return content;
}

/**
 * Fix CSS accessibility issues
 * @param {string} filePath - The file path
 * @param {string} content - The file content
 * @returns {string} - The fixed content
 */
function fixCssIssues(filePath, content) {
  let modified = false;
  let fixedContent = content;
  
  // Fix 1: Add focus styles
  if (!fixedContent.includes(':focus') && !fixedContent.includes('outline:')) {
    fixedContent += `
/* Accessibility focus styles */
a:focus,
button:focus,
input:focus,
select:focus,
textarea:focus,
[tabindex]:focus {
  outline: 3px solid #4d90fe;
  outline-offset: 2px;
}
`;
    console.log(`Fixed: Added focus styles to ${filePath}`);
    modified = true;
  }
  
  // Fix 2: Add skip link styles if missing
  if (!fixedContent.includes('.skip-link')) {
    fixedContent += `
/* Skip link for keyboard users */
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 9999;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
`;
    console.log(`Fixed: Added skip link styles to ${filePath}`);
    modified = true;
  }
  
  // Return the fixed content if modified
  if (modified) {
    return fixedContent;
  }
  
  return content;
}

/**
 * Fix JavaScript accessibility issues
 * @param {string} filePath - The file path
 * @param {string} content - The file content
 * @returns {string} - The fixed content
 */
function fixJsIssues(filePath, content) {
  let modified = false;
  let fixedContent = content;
  
  // Fix 1: Add keyboard event handlers for click events
  if (fixedContent.includes('addEventListener') && 
      fixedContent.includes('click') && 
      !fixedContent.includes('keydown') && 
      !fixedContent.includes('keypress') && 
      !fixedContent.includes('keyup')) {
    
    // This is a simple pattern match and might not work for all cases
    fixedContent = fixedContent.replace(
      /(\w+)\.addEventListener\(\s*['"]click['"]\s*,\s*function\s*\((.*?)\)\s*\{/g,
      (match, element, args) => {
        return `${element}.addEventListener('click', function(${args}) {
  // Original click handler
` + match.slice(match.indexOf('{') + 1);
      }
    );
    
    // Add a comment about keyboard accessibility
    fixedContent += `
// TODO: Ensure all interactive elements are keyboard accessible
// Add keyboard event handlers for click events
// Example:
// element.addEventListener('keydown', function(e) {
//   if (e.key === 'Enter' || e.key === ' ') {
//     e.preventDefault();
//     element.click();
//   }
// });
`;
    
    console.log(`Fixed: Added keyboard accessibility comment to ${filePath}`);
    modified = true;
  }
  
  // Return the fixed content if modified
  if (modified) {
    return fixedContent;
  }
  
  return content;
}

/**
 * Fix accessibility issues in a file
 * @param {Object} file - The file object
 */
function fixFile(file) {
  try {
    const content = fs.readFileSync(file.path, 'utf8');
    let fixedContent = content;
    
    switch (file.type) {
      case 'html':
        fixedContent = fixHtmlIssues(file.path, content);
        break;
      case 'css':
        fixedContent = fixCssIssues(file.path, content);
        break;
      case 'js':
        fixedContent = fixJsIssues(file.path, content);
        break;
    }
    
    if (fixedContent !== content) {
      fs.writeFileSync(file.path, fixedContent);
      console.log(`Updated ${file.path}`);
    }
  } catch (error) {
    console.error(`Error fixing ${file.path}: ${error.message}`);
  }
}

/**
 * Main function
 */
function main() {
  console.log('Starting accessibility fixes...');
  
  // Find all files to fix
  const files = findFiles(WEBSITE_DIR);
  console.log(`Found ${files.length} files to check.`);
  
  // Fix each file
  files.forEach(fixFile);
  
  console.log('Accessibility fixes complete.');
}

// Run the main function
main();
