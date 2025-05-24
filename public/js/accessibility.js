/**
 * Accessibility enhancements for the website
 * This script adds various accessibility improvements to meet WCAG 2.1 AA requirements
 */

(function() {
  'use strict';

  // Wait for the DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Add skip link if it doesn't exist
    addSkipLink();
    
    // Fix missing form labels
    fixFormLabels();
    
    // Fix missing alt text
    fixMissingAltText();
    
    // Fix links without discernible text
    fixLinksWithoutText();
    
    // Fix duplicate IDs
    fixDuplicateIds();
    
    // Enhance keyboard navigation
    enhanceKeyboardNavigation();
    
    // Fix document structure
    fixDocumentStructure();
    
    // Add ARIA attributes
    addAriaAttributes();
    
    // Implement keyboard shortcuts
    implementKeyboardShortcuts();
  });

  /**
   * Add a skip link to the page
   */
  function addSkipLink() {
    // Check if skip link already exists
    if (document.querySelector('.skip-link')) {
      return;
    }
    
    // Find the main content
    const main = document.querySelector('main, [role="main"], .main, .content, #content');
    
    if (main) {
      // Ensure the main element has an ID
      if (!main.id) {
        main.id = 'main-content';
      }
      
      // Create the skip link
      const skipLink = document.createElement('a');
      skipLink.href = '#' + main.id;
      skipLink.className = 'skip-link';
      skipLink.textContent = 'Skip to main content';
      
      // Add the skip link to the beginning of the body
      document.body.insertBefore(skipLink, document.body.firstChild);
    }
  }

  /**
   * Fix form elements without labels
   */
  function fixFormLabels() {
    // Find all form fields
    const formFields = document.querySelectorAll('input, select, textarea');
    
    formFields.forEach(function(field) {
      const id = field.id;
      
      // Skip if the field doesn't have an ID
      if (!id) {
        // Generate an ID if it doesn't have one
        const newId = 'field-' + Math.random().toString(36).substring(2, 9);
        field.id = newId;
        addLabelForField(field, newId);
        return;
      }
      
      // Check if there's already a label for this field
      const hasLabel = document.querySelector('label[for="' + id + '"]');
      
      if (!hasLabel) {
        addLabelForField(field, id);
      }
    });
  }

  /**
   * Add a label for a form field
   * @param {HTMLElement} field - The form field
   * @param {string} id - The ID of the form field
   */
  function addLabelForField(field, id) {
    // Skip certain types of fields
    if (field.type === 'hidden' || field.type === 'submit' || field.type === 'button' || field.type === 'reset') {
      return;
    }
    
    // Try to generate a label from various sources
    let labelText = '';
    
    // Try to get label text from placeholder
    if (field.placeholder) {
      labelText = field.placeholder;
    }
    // Try to get label text from aria-label
    else if (field.getAttribute('aria-label')) {
      labelText = field.getAttribute('aria-label');
    }
    // Try to get label text from name attribute
    else if (field.name) {
      labelText = field.name
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    }
    // Try to get label text from ID
    else if (id) {
      labelText = id
        .replace(/[_-]/g, ' ')
        .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
    }
    
    if (labelText) {
      // Special handling for checkboxes and radio buttons
      if (field.type === 'checkbox' || field.type === 'radio') {
        // Create a wrapper if it doesn't exist
        let wrapper = field.parentNode;
        if (wrapper.tagName !== 'LABEL') {
          // Create a label element
          const label = document.createElement('label');
          label.setAttribute('for', id);
          
          // Insert the label after the field
          field.parentNode.insertBefore(label, field.nextSibling);
          
          // Move the field into the label
          label.insertBefore(field, label.firstChild);
          
          // Add the label text
          const textNode = document.createTextNode(' ' + labelText);
          label.appendChild(textNode);
        }
      } else {
        // Create a label element
        const label = document.createElement('label');
        label.setAttribute('for', id);
        label.textContent = labelText;
        
        // Insert the label before the field
        field.parentNode.insertBefore(label, field);
      }
    }
  }

  /**
   * Fix images without alt text
   */
  function fixMissingAltText() {
    // Find all images without alt text
    const images = document.querySelectorAll('img:not([alt])');
    
    images.forEach(function(img) {
      // Try to generate alt text from various sources
      let altText = '';
      
      // Try to get alt text from title attribute
      if (img.title) {
        altText = img.title;
      }
      // Try to get alt text from aria-label
      else if (img.getAttribute('aria-label')) {
        altText = img.getAttribute('aria-label');
      }
      // Try to get alt text from file name
      else if (img.src) {
        const fileName = img.src.split('/').pop() || '';
        const nameWithoutExtension = fileName.split('.')[0] || '';
        
        // Convert file name to readable text (e.g., "profile-image" -> "Profile image")
        altText = nameWithoutExtension
          .replace(/[_-]/g, ' ')
          .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
      }
      
      // If we couldn't generate alt text, mark as decorative
      if (!altText) {
        img.alt = '';
        img.setAttribute('role', 'presentation');
      } else {
        img.alt = altText;
      }
    });
  }

  /**
   * Fix links without discernible text
   */
  function fixLinksWithoutText() {
    // Find all links
    const links = document.querySelectorAll('a');
    
    links.forEach(function(link) {
      // Check if the link has text content
      const hasText = link.textContent.trim() !== '';
      const hasAriaLabel = link.getAttribute('aria-label') !== null;
      const hasTitle = link.title !== '';
      
      // If the link doesn't have text content, aria-label, or title
      if (!hasText && !hasAriaLabel && !hasTitle) {
        // Check if the link has an image
        const img = link.querySelector('img');
        
        if (img) {
          // If the image has alt text, use it for the link's aria-label
          if (img.alt && img.alt !== '') {
            link.setAttribute('aria-label', img.alt);
          } else {
            // Try to generate a label from the URL
            const url = link.href;
            const urlParts = url.split('/');
            const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || '';
            
            const label = lastPart
              .replace(/[_-]/g, ' ')
              .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
            
            link.setAttribute('aria-label', label || 'Link');
          }
        } else {
          // Try to generate a label from the URL
          const url = link.href;
          const urlParts = url.split('/');
          const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || '';
          
          const label = lastPart
            .replace(/[_-]/g, ' ')
            .replace(/\b\w/g, function(c) { return c.toUpperCase(); });
          
          link.setAttribute('aria-label', label || 'Link');
        }
      }
    });
  }

  /**
   * Fix duplicate IDs
   */
  function fixDuplicateIds() {
    // Get all elements with IDs
    const elementsWithIds = document.querySelectorAll('[id]');
    const ids = {};
    
    // Check for duplicate IDs
    elementsWithIds.forEach(function(element) {
      const id = element.id;
      
      if (ids[id]) {
        // Generate a new unique ID
        const newId = id + '-' + Math.random().toString(36).substring(2, 9);
        
        // Update the ID
        element.id = newId;
        
        // Update any labels that reference the old ID
        const labels = document.querySelectorAll('label[for="' + id + '"]');
        labels.forEach(function(label) {
          label.setAttribute('for', newId);
        });
        
        // Update any aria-labelledby attributes that reference the old ID
        const labelledElements = document.querySelectorAll('[aria-labelledby*="' + id + '"]');
        labelledElements.forEach(function(element) {
          const labelledBy = element.getAttribute('aria-labelledby');
          element.setAttribute('aria-labelledby', labelledBy.replace(id, newId));
        });
        
        // Update any aria-describedby attributes that reference the old ID
        const describedElements = document.querySelectorAll('[aria-describedby*="' + id + '"]');
        describedElements.forEach(function(element) {
          const describedBy = element.getAttribute('aria-describedby');
          element.setAttribute('aria-describedby', describedBy.replace(id, newId));
        });
      } else {
        ids[id] = true;
      }
    });
  }

  /**
   * Enhance keyboard navigation
   */
  function enhanceKeyboardNavigation() {
    // Make non-focusable interactive elements focusable
    const interactiveElements = document.querySelectorAll('.button, .btn, [onclick]:not(button):not(a):not(input):not(select):not(textarea)');
    
    interactiveElements.forEach(function(element) {
      // If it's a div or span acting as a button, make it focusable
      if (element.tagName === 'DIV' || element.tagName === 'SPAN') {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
        
        // Add keyboard event listener for Enter key
        element.addEventListener('keydown', function(e) {
          if (e.key === 'Enter' || e.key === ' ') {
            element.click();
            e.preventDefault();
          }
        });
      }
    });
    
    // Fix tab order issues
    const elementsWithPositiveTabindex = document.querySelectorAll('[tabindex]:not([tabindex="-1"]):not([tabindex="0"])');
    
    elementsWithPositiveTabindex.forEach(function(element) {
      // Reset tabindex to 0
      element.setAttribute('tabindex', '0');
    });
  }

  /**
   * Fix document structure
   */
  function fixDocumentStructure() {
    // Add header if missing
    if (!document.querySelector('header, [role="banner"]')) {
      const possibleHeader = document.querySelector('.header, .site-header, nav:first-of-type');
      
      if (possibleHeader) {
        possibleHeader.setAttribute('role', 'banner');
      }
    }
    
    // Add main if missing
    if (!document.querySelector('main, [role="main"]')) {
      const possibleMain = document.querySelector('.main, .content, .main-content, #content');
      
      if (possibleMain) {
        possibleMain.setAttribute('role', 'main');
      }
    }
    
    // Add footer if missing
    if (!document.querySelector('footer, [role="contentinfo"]')) {
      const possibleFooter = document.querySelector('.footer, .site-footer');
      
      if (possibleFooter) {
        possibleFooter.setAttribute('role', 'contentinfo');
      }
    }
    
    // Check if there's an h1
    if (!document.querySelector('h1')) {
      // Look for a page title or logo
      const pageTitle = document.querySelector('.page-title, .site-title, .logo');
      
      if (pageTitle) {
        // Create an h1 and replace the element
        const h1 = document.createElement('h1');
        h1.innerHTML = pageTitle.innerHTML;
        h1.className = pageTitle.className;
        
        pageTitle.parentNode.replaceChild(h1, pageTitle);
      }
    }
  }

  /**
   * Add ARIA attributes
   */
  function addAriaAttributes() {
    // Add ARIA landmark roles
    const nav = document.querySelector('nav');
    if (nav && !nav.getAttribute('role')) {
      nav.setAttribute('role', 'navigation');
    }
    
    const search = document.querySelector('form[role="search"], form.search, .search form');
    if (search && !search.getAttribute('role')) {
      search.setAttribute('role', 'search');
    }
    
    // Add ARIA attributes to form fields
    const requiredFields = document.querySelectorAll('input[required], select[required], textarea[required]');
    requiredFields.forEach(function(field) {
      field.setAttribute('aria-required', 'true');
    });
    
    // Add ARIA attributes to error messages
    const errorMessages = document.querySelectorAll('.error, .form-error, .field-error');
    errorMessages.forEach(function(error) {
      error.setAttribute('role', 'alert');
      error.setAttribute('aria-live', 'assertive');
    });
  }

  /**
   * Implement keyboard shortcuts
   */
  function implementKeyboardShortcuts() {
    // Add keyboard shortcut for skip link
    document.addEventListener('keydown', function(e) {
      // Alt + 1: Skip to main content
      if (e.altKey && e.key === '1') {
        const main = document.querySelector('main, [role="main"], #main-content');
        if (main) {
          main.tabIndex = -1;
          main.focus();
          e.preventDefault();
        }
      }
      
      // Alt + 2: Skip to navigation
      if (e.altKey && e.key === '2') {
        const nav = document.querySelector('nav, [role="navigation"]');
        if (nav) {
          nav.tabIndex = -1;
          nav.focus();
          e.preventDefault();
        }
      }
      
      // Alt + 3: Skip to footer
      if (e.altKey && e.key === '3') {
        const footer = document.querySelector('footer, [role="contentinfo"]');
        if (footer) {
          footer.tabIndex = -1;
          footer.focus();
          e.preventDefault();
        }
      }
    });
  }
})();
