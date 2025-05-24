/**
 * Enhanced Accessibility for Divinci AI
 * Comprehensive accessibility improvements to meet WCAG 2.1 AA requirements
 */

(function() {
  'use strict';

  // Wait for the DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Enhanced accessibility script loaded');

    // Fix meta viewport tag to allow zooming
    fixMetaViewport();

    // Add ARIA live regions
    addAriaLiveRegions();

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

    // Enhance modals and dialogs
    enhanceModalsAndDialogs();

    // Enhance dynamic content updates
    enhanceDynamicContent();

    // Enhance form validation
    enhanceFormValidation();

    // Enhance notifications and alerts
    enhanceNotifications();

    // Implement keyboard shortcuts
    implementKeyboardShortcuts();
  });

  // Also run immediately in case the DOMContentLoaded event has already fired
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('Enhanced accessibility script running immediately');

    // Fix meta viewport tag to allow zooming
    fixMetaViewport();

    // Fix document structure
    fixDocumentStructure();
  }

  /**
   * Fix meta viewport tag to allow zooming for accessibility
   */
  function fixMetaViewport() {
    // First, check if there's an existing meta viewport tag
    let metaViewport = document.querySelector('meta[name="viewport"]');

    // If it exists, fix it
    if (metaViewport) {
      // Remove user-scalable=no and maximum-scale restrictions
      let content = metaViewport.getAttribute('content');
      content = content.replace(/user-scalable=no/gi, '');
      content = content.replace(/maximum-scale=[0-9\.]+/gi, '');

      // Ensure we have width and initial-scale
      if (!content.includes('width=device-width')) {
        content = 'width=device-width, ' + content;
      }
      if (!content.includes('initial-scale=')) {
        content = content + ', initial-scale=1.0';
      }

      // Clean up any extra commas
      content = content.replace(/,\s*,/g, ',').replace(/,\s*$/g, '');

      // Set the updated content
      metaViewport.setAttribute('content', content);
      console.log('Meta viewport updated for accessibility:', content);
    } else {
      // If no meta viewport tag exists, create one
      const head = document.querySelector('head');
      if (head) {
        metaViewport = document.createElement('meta');
        metaViewport.setAttribute('name', 'viewport');
        metaViewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        head.appendChild(metaViewport);
        console.log('Meta viewport tag added for accessibility');
      }
    }

    // Set up a MutationObserver to watch for changes to the meta viewport tag
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'content') {
          const content = metaViewport.getAttribute('content');

          // Check if the content has been changed to disable zooming
          if (content.includes('user-scalable=no') || content.includes('maximum-scale=1')) {
            console.log('Meta viewport tag was modified to disable zooming, fixing it again');

            // Fix it again
            let newContent = content;
            newContent = newContent.replace(/user-scalable=no/gi, '');
            newContent = newContent.replace(/maximum-scale=[0-9\.]+/gi, '');

            // Clean up any extra commas
            newContent = newContent.replace(/,\s*,/g, ',').replace(/,\s*$/g, '');

            // Set the updated content
            metaViewport.setAttribute('content', newContent);
            console.log('Meta viewport re-updated for accessibility:', newContent);
          }
        }
      });
    });

    // Start observing the meta viewport tag
    if (metaViewport) {
      observer.observe(metaViewport, { attributes: true });
      console.log('Now monitoring meta viewport tag for changes');
    }

    // Also check for any new meta viewport tags that might be added later
    const headObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            if (node.nodeName === 'META' && node.getAttribute('name') === 'viewport') {
              console.log('New meta viewport tag detected, fixing it');

              // Fix the new meta viewport tag
              let content = node.getAttribute('content');
              content = content.replace(/user-scalable=no/gi, '');
              content = content.replace(/maximum-scale=[0-9\.]+/gi, '');

              // Clean up any extra commas
              content = content.replace(/,\s*,/g, ',').replace(/,\s*$/g, '');

              // Set the updated content
              node.setAttribute('content', content);
              console.log('New meta viewport tag updated for accessibility:', content);

              // Start observing the new meta viewport tag
              observer.observe(node, { attributes: true });
              console.log('Now monitoring new meta viewport tag for changes');
            }
          });
        }
      });
    });

    // Start observing the head for new meta viewport tags
    const head = document.querySelector('head');
    if (head) {
      headObserver.observe(head, { childList: true, subtree: true });
      console.log('Now monitoring head for new meta viewport tags');
    }
  }

  /**
   * Add ARIA live regions to the page
   */
  function addAriaLiveRegions() {
    // Check if live regions already exist
    if (document.getElementById('live-region-polite') && document.getElementById('live-region-assertive')) {
      return;
    }

    // Create a polite live region for non-critical updates
    const politeLiveRegion = document.createElement('div');
    politeLiveRegion.setAttribute('aria-live', 'polite');
    politeLiveRegion.setAttribute('aria-atomic', 'true');
    politeLiveRegion.setAttribute('role', 'status');
    politeLiveRegion.className = 'sr-only live-region-polite';
    politeLiveRegion.id = 'live-region-polite';

    // Create an assertive live region for critical updates
    const assertiveLiveRegion = document.createElement('div');
    assertiveLiveRegion.setAttribute('aria-live', 'assertive');
    assertiveLiveRegion.setAttribute('aria-atomic', 'true');
    assertiveLiveRegion.setAttribute('role', 'alert');
    assertiveLiveRegion.className = 'sr-only live-region-assertive';
    assertiveLiveRegion.id = 'live-region-assertive';

    // Add the live regions to the body
    document.body.appendChild(politeLiveRegion);
    document.body.appendChild(assertiveLiveRegion);

    // Add utility functions to window object
    window.a11y = window.a11y || {};

    // Function to announce messages to screen readers
    window.a11y.announce = function(message, options = {}) {
      const liveRegion = options.assertive ?
        document.getElementById('live-region-assertive') :
        document.getElementById('live-region-polite');

      if (liveRegion) {
        liveRegion.textContent = '';

        // Use setTimeout to ensure the change is registered by screen readers
        setTimeout(function() {
          liveRegion.textContent = message;
        }, 50);
      }
    };
  }

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

      // Create the skip links container if it doesn't exist
      let skipLinksContainer = document.querySelector('.skip-links');
      if (!skipLinksContainer) {
        skipLinksContainer = document.createElement('div');
        skipLinksContainer.className = 'skip-links';
        document.body.insertBefore(skipLinksContainer, document.body.firstChild);
      }

      // Create the skip link
      const skipLink = document.createElement('a');
      skipLink.href = '#' + main.id;
      skipLink.className = 'skip-link';
      skipLink.textContent = 'Skip to main content';

      // Add the skip link to the container
      skipLinksContainer.appendChild(skipLink);
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

    // Fix heading structure to be sequential
    fixHeadingStructure();
  }

  /**
   * Fix heading structure to be sequential (no skipping levels)
   */
  function fixHeadingStructure() {
    // Get all headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const headingLevels = Array.from(headings).map(el => parseInt(el.tagName.substring(1)));

    // Check if heading levels are sequential
    let isSequential = true;
    let currentLevel = 0;
    let firstHeadingLevel = headingLevels.length > 0 ? headingLevels[0] : 0;

    // If the first heading is not h1, we need to fix the structure
    if (firstHeadingLevel > 1) {
      isSequential = false;
    }

    for (let i = 0; i < headingLevels.length; i++) {
      const level = headingLevels[i];

      // If we skip a level (e.g., h1 to h3), we need to fix the structure
      if (i > 0 && level > headingLevels[i-1] + 1) {
        isSequential = false;
        break;
      }

      currentLevel = Math.max(currentLevel, level);
    }

    // If the heading structure is not sequential, fix it
    if (!isSequential) {
      console.log('Fixing non-sequential heading structure');

      // Create a mapping of original heading levels to new heading levels
      const levelMapping = {};
      let expectedLevel = 1;

      for (let i = 0; i < headings.length; i++) {
        const heading = headings[i];
        const level = parseInt(heading.tagName.substring(1));

        // If this is the first heading or a heading that's one level deeper than the previous
        if (i === 0 || level > parseInt(headings[i-1].tagName.substring(1))) {
          levelMapping[level] = expectedLevel++;
        } else if (level === parseInt(headings[i-1].tagName.substring(1))) {
          // If this is a heading at the same level as the previous
          levelMapping[level] = levelMapping[level];
        } else {
          // If this is a heading at a higher level than the previous (going back up)
          // Find the closest previous heading with this level
          for (let j = i - 1; j >= 0; j--) {
            if (parseInt(headings[j].tagName.substring(1)) === level) {
              levelMapping[level] = levelMapping[level] || levelMapping[parseInt(headings[j].tagName.substring(1))];
              break;
            }
          }

          // If we couldn't find a previous heading with this level, use the expected level
          if (!levelMapping[level]) {
            levelMapping[level] = expectedLevel++;
          }
        }
      }

      // Apply the new heading levels
      for (const heading of headings) {
        const originalLevel = parseInt(heading.tagName.substring(1));
        const newLevel = levelMapping[originalLevel];

        if (originalLevel !== newLevel) {
          // Create a new heading element with the correct level
          const newHeading = document.createElement(`h${newLevel}`);

          // Copy all attributes
          for (const attr of heading.attributes) {
            newHeading.setAttribute(attr.name, attr.value);
          }

          // Copy the content
          newHeading.innerHTML = heading.innerHTML;

          // Add an aria-level attribute to maintain the semantic meaning
          newHeading.setAttribute('aria-level', originalLevel);

          // Replace the old heading with the new one
          heading.parentNode.replaceChild(newHeading, heading);

          console.log(`Changed h${originalLevel} to h${newLevel}`);
        }
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
   * Enhance modals and dialogs for accessibility
   */
  function enhanceModalsAndDialogs() {
    // Find all modals and dialogs
    const modals = document.querySelectorAll('.modal, [role="dialog"], [aria-modal="true"]');

    modals.forEach(function(modal) {
      // Ensure the modal has the correct ARIA attributes
      if (!modal.hasAttribute('role')) {
        modal.setAttribute('role', 'dialog');
      }

      if (!modal.hasAttribute('aria-modal')) {
        modal.setAttribute('aria-modal', 'true');
      }

      // Ensure the modal has a label
      if (!modal.hasAttribute('aria-labelledby') && !modal.hasAttribute('aria-label')) {
        // Look for a heading inside the modal
        const heading = modal.querySelector('h1, h2, h3, h4, h5, h6');

        if (heading) {
          // Generate an ID if the heading doesn't have one
          if (!heading.id) {
            heading.id = 'modal-heading-' + Math.random().toString(36).substring(2, 9);
          }

          modal.setAttribute('aria-labelledby', heading.id);
        } else {
          // If no heading, use a generic label
          modal.setAttribute('aria-label', 'Dialog');
        }
      }

      // Find the close button
      const closeButton = modal.querySelector('.close, .close-button, [data-dismiss="modal"], [aria-label="Close"]');

      if (closeButton) {
        // Ensure the close button has the correct attributes
        if (!closeButton.hasAttribute('aria-label')) {
          closeButton.setAttribute('aria-label', 'Close');
        }

        // Add keyboard event listener for Escape key
        modal.addEventListener('keydown', function(e) {
          if (e.key === 'Escape') {
            closeButton.click();
          }
        });
      }

      // Find all focusable elements in the modal
      const focusableElements = modal.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');

      if (focusableElements.length > 0) {
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];

        // Add event listener to trap focus within the modal
        modal.addEventListener('keydown', function(e) {
          if (e.key === 'Tab') {
            // If Shift+Tab on first element, move to last element
            if (e.shiftKey && document.activeElement === firstFocusable) {
              e.preventDefault();
              lastFocusable.focus();
            }
            // If Tab on last element, move to first element
            else if (!e.shiftKey && document.activeElement === lastFocusable) {
              e.preventDefault();
              firstFocusable.focus();
            }
          }
        });
      }

      // Store the element that had focus before the modal was opened
      let previouslyFocused = null;

      // Add event listeners to modal triggers
      const modalTriggers = document.querySelectorAll(`[data-toggle="modal"][data-target="#${modal.id}"], [data-open="${modal.id}"]`);

      modalTriggers.forEach(function(trigger) {
        trigger.addEventListener('click', function() {
          // Store the element that had focus before the modal was opened
          previouslyFocused = document.activeElement;

          // Focus the first focusable element in the modal
          if (focusableElements.length > 0) {
            setTimeout(function() {
              focusableElements[0].focus();
            }, 100);
          }
        });
      });

      // Add event listener to return focus when modal is closed
      if (closeButton) {
        closeButton.addEventListener('click', function() {
          if (previouslyFocused) {
            setTimeout(function() {
              previouslyFocused.focus();
            }, 100);
          }
        });
      }
    });

    // Add utility functions to window object
    window.a11y = window.a11y || {};

    // Function to open a modal accessibly
    window.a11y.openModal = function(modalId) {
      const modal = document.getElementById(modalId);

      if (modal) {
        // Store the element that had focus before the modal was opened
        window.a11y.previouslyFocused = document.activeElement;

        // Show the modal (implementation depends on the modal library)
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          // Bootstrap modal
          const bsModal = new bootstrap.Modal(modal);
          bsModal.show();
        } else {
          // Generic implementation
          modal.style.display = 'block';
          modal.setAttribute('aria-hidden', 'false');
          document.body.classList.add('modal-open');
        }

        // Focus the first focusable element in the modal
        const focusableElements = modal.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])');

        if (focusableElements.length > 0) {
          setTimeout(function() {
            focusableElements[0].focus();
          }, 100);
        }

        // Announce the modal to screen readers
        window.a11y.announce('Dialog opened', { assertive: true });
      }
    };

    // Function to close a modal accessibly
    window.a11y.closeModal = function(modalId) {
      const modal = document.getElementById(modalId);

      if (modal) {
        // Hide the modal (implementation depends on the modal library)
        if (typeof bootstrap !== 'undefined' && bootstrap.Modal) {
          // Bootstrap modal
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) {
            bsModal.hide();
          }
        } else {
          // Generic implementation
          modal.style.display = 'none';
          modal.setAttribute('aria-hidden', 'true');
          document.body.classList.remove('modal-open');
        }

        // Return focus to the element that had focus before the modal was opened
        if (window.a11y.previouslyFocused) {
          setTimeout(function() {
            window.a11y.previouslyFocused.focus();
          }, 100);
        }

        // Announce the modal closure to screen readers
        window.a11y.announce('Dialog closed');
      }
    };
  }

  /**
   * Enhance dynamic content updates
   */
  function enhanceDynamicContent() {
    // Find elements that are likely to be updated dynamically
    const dynamicElements = document.querySelectorAll('[data-dynamic], .dynamic-content, [id*="update"], [id*="refresh"], [id*="result"]');

    dynamicElements.forEach(function(element) {
      // Add appropriate ARIA attributes
      if (!element.hasAttribute('aria-live')) {
        element.setAttribute('aria-live', 'polite');
      }

      if (!element.hasAttribute('aria-atomic')) {
        element.setAttribute('aria-atomic', 'true');
      }
    });

    // Add utility functions to window object
    window.a11y = window.a11y || {};

    // Function to update content accessibly
    window.a11y.updateContent = function(elementId, content, options = {}) {
      const element = document.getElementById(elementId);

      if (element) {
        // Update the content
        element.innerHTML = content;

        // Announce the update to screen readers if specified
        if (options.announce) {
          window.a11y.announce(options.announceText || 'Content updated', {
            assertive: options.assertive || false
          });
        }

        // Focus the element if specified
        if (options.focus) {
          element.tabIndex = -1;
          element.focus();

          // Remove tabindex after focus to avoid leaving unnecessary tab stops
          setTimeout(function() {
            element.removeAttribute('tabindex');
          }, 1000);
        }
      }
    };
  }

  /**
   * Enhance form validation for accessibility
   */
  function enhanceFormValidation() {
    // Find all forms
    const forms = document.querySelectorAll('form');

    forms.forEach(function(form) {
      form.addEventListener('submit', function(e) {
        // Check for invalid fields
        const invalidFields = form.querySelectorAll(':invalid');

        if (invalidFields.length > 0) {
          e.preventDefault();

          // Focus the first invalid field
          invalidFields[0].focus();

          // Announce validation errors to screen readers
          window.a11y.announce(`Form has ${invalidFields.length} validation errors`, { assertive: true });
        }
      });

      // Add event listeners for input validation
      const inputs = form.querySelectorAll('input, select, textarea');

      inputs.forEach(function(input) {
        input.addEventListener('invalid', function() {
          // Create or update error message
          let errorId = input.id + '-error';
          let errorElement = document.getElementById(errorId);

          if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = errorId;
            errorElement.className = 'error-message';
            errorElement.setAttribute('role', 'alert');

            // Insert error message after the input
            input.parentNode.insertBefore(errorElement, input.nextSibling);
          }

          // Set the error message
          errorElement.textContent = input.validationMessage;

          // Associate the error message with the input
          input.setAttribute('aria-describedby', errorId);

          // Add error class to the input
          input.classList.add('error');
        });

        // Clear error message when input changes
        input.addEventListener('input', function() {
          const errorId = input.id + '-error';
          const errorElement = document.getElementById(errorId);

          if (errorElement) {
            errorElement.textContent = '';
          }

          // Remove error class from the input
          input.classList.remove('error');
        });
      });
    });
  }

  /**
   * Enhance notifications and alerts
   */
  function enhanceNotifications() {
    // Find all notifications and alerts
    const notifications = document.querySelectorAll('.notification, .alert, .toast, .message');

    notifications.forEach(function(notification) {
      // Ensure the notification has the correct ARIA attributes
      if (!notification.hasAttribute('role')) {
        notification.setAttribute('role', 'alert');
      }

      if (!notification.hasAttribute('aria-live')) {
        notification.setAttribute('aria-live', 'assertive');
      }

      // Find the close button
      const closeButton = notification.querySelector('.close, .close-button, [data-dismiss]');

      if (closeButton) {
        // Ensure the close button has the correct attributes
        if (!closeButton.hasAttribute('aria-label')) {
          closeButton.setAttribute('aria-label', 'Close notification');
        }
      }
    });

    // Add utility functions to window object
    window.a11y = window.a11y || {};

    // Function to show a notification accessibly
    window.a11y.showNotification = function(message, options = {}) {
      // Create notification element
      const notification = document.createElement('div');
      notification.className = options.className || 'notification';
      notification.setAttribute('role', 'alert');
      notification.setAttribute('aria-live', options.assertive ? 'assertive' : 'polite');

      // Add the message
      notification.textContent = message;

      // Add close button if specified
      if (options.dismissible !== false) {
        const closeButton = document.createElement('button');
        closeButton.className = 'close-button';
        closeButton.setAttribute('aria-label', 'Close notification');
        closeButton.innerHTML = '&times;';

        closeButton.addEventListener('click', function() {
          notification.remove();
        });

        notification.appendChild(closeButton);
      }

      // Add the notification to the page
      document.body.appendChild(notification);

      // Remove the notification after a delay if specified
      if (options.duration) {
        setTimeout(function() {
          notification.remove();
        }, options.duration);
      }

      // Return the notification element
      return notification;
    };
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
