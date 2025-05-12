// Keyboard Navigation JavaScript
// This file contains code for enhancing keyboard navigation accessibility

document.addEventListener('DOMContentLoaded', function() {
  console.log('Keyboard navigation script loaded');
  
  // Skip to content functionality
  const skipLinks = document.querySelectorAll('.skip-link');
  
  skipLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        targetElement.tabIndex = -1;
        targetElement.focus();
      }
    });
  });
  
  // Tab navigation for interactive elements
  const tabTriggers = document.querySelectorAll('.tab-trigger');
  
  if (tabTriggers.length > 0) {
    tabTriggers.forEach((tab, index) => {
      tab.addEventListener('keydown', function(e) {
        // Left arrow key
        if (e.keyCode === 37) {
          e.preventDefault();
          const prevTab = tabTriggers[index === 0 ? tabTriggers.length - 1 : index - 1];
          prevTab.focus();
          prevTab.click();
        }
        // Right arrow key
        else if (e.keyCode === 39) {
          e.preventDefault();
          const nextTab = tabTriggers[index === tabTriggers.length - 1 ? 0 : index + 1];
          nextTab.focus();
          nextTab.click();
        }
      });
    });
  }
  
  // Accordion keyboard navigation
  const accordionTriggers = document.querySelectorAll('.accordion-trigger');
  
  if (accordionTriggers.length > 0) {
    accordionTriggers.forEach((trigger, index) => {
      trigger.addEventListener('keydown', function(e) {
        // Up arrow key
        if (e.keyCode === 38) {
          e.preventDefault();
          const prevTrigger = accordionTriggers[index === 0 ? accordionTriggers.length - 1 : index - 1];
          prevTrigger.focus();
        }
        // Down arrow key
        else if (e.keyCode === 40) {
          e.preventDefault();
          const nextTrigger = accordionTriggers[index === accordionTriggers.length - 1 ? 0 : index + 1];
          nextTrigger.focus();
        }
      });
    });
  }
});
