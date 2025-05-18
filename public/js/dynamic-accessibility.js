/**
 * Dynamic content accessibility enhancements
 * This script adds ARIA live regions and improves focus management for dynamic content
 */

(function() {
  'use strict';

  // Wait for the DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    // Add ARIA live regions
    addAriaLiveRegions();
    
    // Enhance modals and dialogs
    enhanceModalsAndDialogs();
    
    // Enhance dynamic content updates
    enhanceDynamicContent();
    
    // Add event listeners for dynamic content
    addDynamicContentListeners();
    
    // Enhance form validation
    enhanceFormValidation();
    
    // Enhance notifications and alerts
    enhanceNotifications();
  });

  /**
   * Add ARIA live regions to the page
   */
  function addAriaLiveRegions() {
    // Create a polite live region for non-critical updates
    const politeLiveRegion = document.createElement('div');
    politeLiveRegion.setAttribute('aria-live', 'polite');
    politeLiveRegion.setAttribute('aria-atomic', 'true');
    politeLiveRegion.setAttribute('role', 'status');
    politeLiveRegion.className = 'sr-only live-region-polite';
    politeLiveRegion.id = 'live-region-polite';
    politeLiveRegion.style.position = 'absolute';
    politeLiveRegion.style.width = '1px';
    politeLiveRegion.style.height = '1px';
    politeLiveRegion.style.margin = '-1px';
    politeLiveRegion.style.padding = '0';
    politeLiveRegion.style.overflow = 'hidden';
    politeLiveRegion.style.clip = 'rect(0, 0, 0, 0)';
    politeLiveRegion.style.whiteSpace = 'nowrap';
    politeLiveRegion.style.border = '0';
    
    // Create an assertive live region for critical updates
    const assertiveLiveRegion = document.createElement('div');
    assertiveLiveRegion.setAttribute('aria-live', 'assertive');
    assertiveLiveRegion.setAttribute('aria-atomic', 'true');
    assertiveLiveRegion.setAttribute('role', 'alert');
    assertiveLiveRegion.className = 'sr-only live-region-assertive';
    assertiveLiveRegion.id = 'live-region-assertive';
    assertiveLiveRegion.style.position = 'absolute';
    assertiveLiveRegion.style.width = '1px';
    assertiveLiveRegion.style.height = '1px';
    assertiveLiveRegion.style.margin = '-1px';
    assertiveLiveRegion.style.padding = '0';
    assertiveLiveRegion.style.overflow = 'hidden';
    assertiveLiveRegion.style.clip = 'rect(0, 0, 0, 0)';
    assertiveLiveRegion.style.whiteSpace = 'nowrap';
    assertiveLiveRegion.style.border = '0';
    
    // Add the live regions to the body
    document.body.appendChild(politeLiveRegion);
    document.body.appendChild(assertiveLiveRegion);
    
    // Add utility functions to window object
    window.a11y = window.a11y || {};
    
    // Function to announce messages to screen readers (polite)
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
   * Add event listeners for dynamic content
   */
  function addDynamicContentListeners() {
    // Listen for AJAX requests (if using jQuery)
    if (typeof jQuery !== 'undefined') {
      jQuery(document).ajaxComplete(function(event, xhr, settings) {
        // Announce AJAX completion to screen readers
        window.a11y.announce('Content updated');
      });
    }
    
    // Listen for fetch requests (modern browsers)
    const originalFetch = window.fetch;
    
    window.fetch = function() {
      const fetchPromise = originalFetch.apply(this, arguments);
      
      fetchPromise.then(function() {
        // Announce fetch completion to screen readers
        window.a11y.announce('Content updated');
      });
      
      return fetchPromise;
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
})();
