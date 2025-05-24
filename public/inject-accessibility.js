/**
 * Inject accessibility improvements into the website
 * This script can be used as a bookmarklet or included in the page
 */

(function() {
  'use strict';
  
  // Check if accessibility improvements are already injected
  if (document.querySelector('#accessibility-css') || document.querySelector('#accessibility-js')) {
    console.log('Accessibility improvements already injected');
    return;
  }
  
  // Add accessibility CSS
  const css = document.createElement('link');
  css.id = 'accessibility-css';
  css.rel = 'stylesheet';
  css.href = '/css/accessibility.css';
  document.head.appendChild(css);
  
  // Add accessibility JS
  const js = document.createElement('script');
  js.id = 'accessibility-js';
  js.src = '/js/accessibility.js';
  document.body.appendChild(js);
  
  // Create a notification to inform the user
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '20px';
  notification.style.right = '20px';
  notification.style.padding = '15px';
  notification.style.background = '#4CAF50';
  notification.style.color = '#fff';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  notification.style.zIndex = '9999';
  notification.style.maxWidth = '300px';
  notification.style.transition = 'opacity 0.5s';
  notification.textContent = 'Accessibility improvements have been applied to this page.';
  
  // Add a close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.style.background = 'none';
  closeButton.style.border = 'none';
  closeButton.style.color = '#fff';
  closeButton.style.fontSize = '20px';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.cursor = 'pointer';
  closeButton.setAttribute('aria-label', 'Close notification');
  
  closeButton.addEventListener('click', function() {
    document.body.removeChild(notification);
  });
  
  notification.appendChild(closeButton);
  document.body.appendChild(notification);
  
  // Automatically hide the notification after 5 seconds
  setTimeout(function() {
    notification.style.opacity = '0';
    setTimeout(function() {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 5000);
  
  console.log('Accessibility improvements injected');
})();
