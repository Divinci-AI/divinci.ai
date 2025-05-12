/**
 * Accordion Component
 * 
 * An accessible accordion component for FAQ sections and content organization.
 * Features include:
 * - Full keyboard navigation
 * - ARIA attribute management
 * - Screen reader announcements
 * - Multiple/single open item configuration
 * 
 * HTML Structure:
 * <div class="accordion" data-allow-multiple="true">
 *   <div class="accordion-item">
 *     <h3>
 *       <button class="accordion-trigger" aria-expanded="false" id="accordion-trigger-1">
 *         Accordion Title
 *       </button>
 *     </h3>
 *     <div class="accordion-panel" role="region" aria-labelledby="accordion-trigger-1" hidden>
 *       Accordion content
 *     </div>
 *   </div>
 * </div>
 */

document.addEventListener('DOMContentLoaded', () => {
  initAccordions();
});

/**
 * Initialize all accordions on the page
 */
function initAccordions() {
  const accordions = document.querySelectorAll('.accordion');
  
  accordions.forEach(accordion => {
    const triggers = accordion.querySelectorAll('.accordion-trigger');
    const allowMultiple = accordion.dataset.allowMultiple === 'true';
    
    // Set up each trigger button
    triggers.forEach(trigger => {
      // Set initial ARIA states if not already set
      if (!trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', 'false');
      }
      
      if (!trigger.id) {
        trigger.id = `accordion-trigger-${Math.random().toString(36).substring(2, 11)}`;
      }
      
      // Find the panel this trigger controls
      const panel = trigger.closest('.accordion-item').querySelector('.accordion-panel');
      
      if (panel) {
        panel.setAttribute('aria-labelledby', trigger.id);
        panel.setAttribute('role', 'region');
        
        if (trigger.getAttribute('aria-expanded') === 'false') {
          panel.hidden = true;
        }
        
        // Set up event listener
        trigger.addEventListener('click', (e) => {
          toggleAccordion(e, allowMultiple);
        });
        
        // Set up keyboard navigation
        trigger.addEventListener('keydown', handleAccordionKeydown);
      }
    });
  });
  
  // Create screen reader announcer if it doesn't exist
  if (!document.getElementById('accordion-change-announcer')) {
    const announcer = document.createElement('div');
    announcer.id = 'accordion-change-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('class', 'visually-hidden');
    document.body.appendChild(announcer);
  }
}

/**
 * Toggle accordion panel visibility
 * 
 * @param {Event} e - The event object
 * @param {boolean} allowMultiple - Whether multiple panels can be open simultaneously
 */
function toggleAccordion(e, allowMultiple) {
  const trigger = e.currentTarget;
  const accordionItem = trigger.closest('.accordion-item');
  const panel = accordionItem.querySelector('.accordion-panel');
  const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
  
  // If not allowing multiple open panels, close all other panels first
  if (!allowMultiple && !isExpanded) {
    const accordion = trigger.closest('.accordion');
    const allTriggers = accordion.querySelectorAll('.accordion-trigger');
    
    allTriggers.forEach(otherTrigger => {
      if (otherTrigger !== trigger) {
        otherTrigger.setAttribute('aria-expanded', 'false');
        const otherPanel = otherTrigger.closest('.accordion-item').querySelector('.accordion-panel');
        if (otherPanel) {
          otherPanel.hidden = true;
        }
      }
    });
  }
  
  // Toggle this panel
  trigger.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
  
  if (panel) {
    panel.hidden = isExpanded;
    
    // Announce state change to screen readers
    const action = isExpanded ? 'collapsed' : 'expanded';
    const title = trigger.textContent.trim();
    
    document.getElementById('accordion-change-announcer').textContent = 
      `${title} ${action}`;
    
    // If expanding, ensure the panel is focusable
    if (!isExpanded) {
      panel.tabIndex = 0;
    } else {
      panel.tabIndex = -1;
    }
  }
}

/**
 * Handle keyboard navigation for accordion
 * 
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleAccordionKeydown(e) {
  const trigger = e.target;
  const accordion = trigger.closest('.accordion');
  const triggers = Array.from(accordion.querySelectorAll('.accordion-trigger'));
  const currentIndex = triggers.indexOf(trigger);
  
  // Different keys for different actions
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      // Move to next accordion header
      if (currentIndex < triggers.length - 1) {
        triggers[currentIndex + 1].focus();
      }
      break;
      
    case 'ArrowUp':
      e.preventDefault();
      // Move to previous accordion header
      if (currentIndex > 0) {
        triggers[currentIndex - 1].focus();
      }
      break;
      
    case 'Home':
      e.preventDefault();
      // Move to first accordion header
      triggers[0].focus();
      break;
      
    case 'End':
      e.preventDefault();
      // Move to last accordion header
      triggers[triggers.length - 1].focus();
      break;
      
    case 'Enter':
    case ' ':
      e.preventDefault();
      // Trigger click event
      trigger.click();
      break;
  }
}

/**
 * Programmatically open an accordion panel by ID
 * 
 * @param {string} triggerId - The ID of the accordion trigger to open
 * @param {boolean} [focus=true] - Whether to focus the trigger after opening
 */
function openAccordionPanel(triggerId, focus = true) {
  const trigger = document.getElementById(triggerId);
  
  if (trigger && trigger.classList.contains('accordion-trigger')) {
    const isExpanded = trigger.getAttribute('aria-expanded') === 'true';
    
    if (!isExpanded) {
      // Check if we need to close other panels
      const accordion = trigger.closest('.accordion');
      const allowMultiple = accordion.dataset.allowMultiple === 'true';
      
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      });
      
      trigger.dispatchEvent(event);
      
      if (focus) {
        trigger.focus();
      }
    }
  }
}

/**
 * Close all accordion panels within a specific accordion
 * 
 * @param {string} accordionSelector - The selector for the accordion container
 */
function closeAllAccordionPanels(accordionSelector) {
  const accordion = document.querySelector(accordionSelector);
  
  if (accordion) {
    const triggers = accordion.querySelectorAll('.accordion-trigger[aria-expanded="true"]');
    
    triggers.forEach(trigger => {
      trigger.setAttribute('aria-expanded', 'false');
      const panel = trigger.closest('.accordion-item').querySelector('.accordion-panel');
      
      if (panel) {
        panel.hidden = true;
      }
    });
  }
}

// Export functions for external use
window.accordionComponent = {
  init: initAccordions,
  open: openAccordionPanel,
  closeAll: closeAllAccordionPanels
};