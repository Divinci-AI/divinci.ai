/**
 * Keyboard Navigation Enhancement
 * Improves accessibility for keyboard users
 */

document.addEventListener('DOMContentLoaded', function() {
  // Add focus styles for keyboard navigation
  const skipLink = document.querySelector('.skip-link');
  
  if (skipLink) {
    skipLink.addEventListener('focus', function() {
      this.style.transform = 'translateY(0)';
      this.style.opacity = '1';
    });
    
    skipLink.addEventListener('blur', function() {
      this.style.transform = 'translateY(-100%)';
      this.style.opacity = '0';
    });
  }
  
  // Add keyboard navigation for dropdown menus
  const dropdownTriggers = document.querySelectorAll('.has-dropdown');
  
  dropdownTriggers.forEach(trigger => {
    trigger.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.classList.toggle('is-active');
      }
    });
  });
});
