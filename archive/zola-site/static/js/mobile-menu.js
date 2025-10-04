/**
 * Mobile Menu Handler
 * Manages the mobile navigation menu
 */

document.addEventListener('DOMContentLoaded', function() {
  // Create mobile menu button if it doesn't exist
  if (!document.querySelector('.mobile-menu-button')) {
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
      const menuButton = document.createElement('button');
      menuButton.className = 'mobile-menu-button';
      menuButton.setAttribute('aria-label', 'Toggle mobile menu');
      menuButton.innerHTML = `
        <span class="bar"></span>
        <span class="bar"></span>
        <span class="bar"></span>
      `;
      
      navbar.appendChild(menuButton);
      
      // Create mobile menu container if it doesn't exist
      if (!document.querySelector('.mobile-menu-container')) {
        const menuContainer = document.createElement('div');
        menuContainer.className = 'mobile-menu-container';
        
        // Clone the nav menu for mobile
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
          menuContainer.appendChild(navMenu.cloneNode(true));
        }
        
        document.body.appendChild(menuContainer);
      }
      
      // Add event listener to toggle menu
      menuButton.addEventListener('click', function() {
        this.classList.toggle('active');
        document.querySelector('.mobile-menu-container').classList.toggle('active');
        document.body.classList.toggle('menu-open');
      });
    }
  }
});
