// Keyboard Navigation and Accessibility Enhancements
document.addEventListener('DOMContentLoaded', function() {
  // ======= Toggle Switch Keyboard Accessibility =======
  const viewToggle = document.getElementById('viewToggle');
  const customerViewLabel = document.getElementById('customer-view-label');
  const companyViewLabel = document.getElementById('company-view-label');
  
  // Make the labels keyboard focusable
  if (customerViewLabel) {
    customerViewLabel.setAttribute('tabindex', '0');
    customerViewLabel.setAttribute('role', 'button');
    customerViewLabel.setAttribute('aria-pressed', 'true');
    
    // Add keyboard event handling
    customerViewLabel.addEventListener('keydown', function(e) {
      // Activate on Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (viewToggle.checked) {
          viewToggle.checked = false;
          viewToggle.dispatchEvent(new Event('change'));
          this.setAttribute('aria-pressed', 'true');
          companyViewLabel.setAttribute('aria-pressed', 'false');
        }
      }
    });
  }
  
  if (companyViewLabel) {
    companyViewLabel.setAttribute('tabindex', '0');
    companyViewLabel.setAttribute('role', 'button');
    companyViewLabel.setAttribute('aria-pressed', 'false');
    
    // Add keyboard event handling
    companyViewLabel.addEventListener('keydown', function(e) {
      // Activate on Enter or Space
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!viewToggle.checked) {
          viewToggle.checked = true;
          viewToggle.dispatchEvent(new Event('change'));
          this.setAttribute('aria-pressed', 'true');
          customerViewLabel.setAttribute('aria-pressed', 'false');
        }
      }
    });
  }
  
  // Add click events to labels for better touch/mouse interaction
  if (customerViewLabel) {
    customerViewLabel.addEventListener('click', function() {
      if (viewToggle.checked) {
        viewToggle.checked = false;
        viewToggle.dispatchEvent(new Event('change'));
      }
    });
  }
  
  if (companyViewLabel) {
    companyViewLabel.addEventListener('click', function() {
      if (!viewToggle.checked) {
        viewToggle.checked = true;
        viewToggle.dispatchEvent(new Event('change'));
      }
    });
  }
  
  // Update aria-pressed state when toggle changes
  if (viewToggle) {
    viewToggle.addEventListener('change', function() {
      if (this.checked) {
        customerViewLabel.setAttribute('aria-pressed', 'false');
        companyViewLabel.setAttribute('aria-pressed', 'true');
        this.setAttribute('aria-checked', 'true');
        // Announce the view change to screen readers
        const viewChangeAnnouncement = document.createElement('div');
        viewChangeAnnouncement.setAttribute('aria-live', 'polite');
        viewChangeAnnouncement.setAttribute('class', 'visually-hidden');
        viewChangeAnnouncement.textContent = 'Switched to Company view';
        document.body.appendChild(viewChangeAnnouncement);
        
        // Remove the announcement after it's been read
        setTimeout(() => {
          document.body.removeChild(viewChangeAnnouncement);
        }, 1000);
      } else {
        customerViewLabel.setAttribute('aria-pressed', 'true');
        companyViewLabel.setAttribute('aria-pressed', 'false');
        this.setAttribute('aria-checked', 'false');
        // Announce the view change to screen readers
        const viewChangeAnnouncement = document.createElement('div');
        viewChangeAnnouncement.setAttribute('aria-live', 'polite');
        viewChangeAnnouncement.setAttribute('class', 'visually-hidden');
        viewChangeAnnouncement.textContent = 'Switched to Client view';
        document.body.appendChild(viewChangeAnnouncement);
        
        // Remove the announcement after it's been read
        setTimeout(() => {
          document.body.removeChild(viewChangeAnnouncement);
        }, 1000);
      }
    });
  }
  
  // ======= Mobile Menu Accessibility =======
  // Create mobile menu button if it doesn't exist
  const header = document.querySelector('header');
  const navMenu = document.querySelector('.nav-menu');
  
  if (header && navMenu && !document.querySelector('.mobile-menu-button')) {
    const mobileMenuButton = document.createElement('button');
    mobileMenuButton.className = 'mobile-menu-button';
    mobileMenuButton.setAttribute('type', 'button');
    mobileMenuButton.setAttribute('aria-expanded', 'false');
    mobileMenuButton.setAttribute('aria-controls', 'main-nav-menu');
    mobileMenuButton.setAttribute('aria-label', 'Toggle navigation menu');
    mobileMenuButton.setAttribute('aria-haspopup', 'true');
    mobileMenuButton.setAttribute('aria-describedby', 'menu-button-description');
    
    // Create the menu icon
    const menuIcon = document.createElement('span');
    menuIcon.className = 'menu-icon';
    menuIcon.setAttribute('aria-hidden', 'true');
    mobileMenuButton.appendChild(menuIcon);
    
    // Add description for screen readers
    const menuDescription = document.createElement('span');
    menuDescription.id = 'menu-button-description';
    menuDescription.className = 'visually-hidden';
    menuDescription.textContent = 'Press to open or close the site navigation menu';
    mobileMenuButton.appendChild(menuDescription);
    
    // Add before nav-menu
    header.insertBefore(mobileMenuButton, navMenu);
    
    // Add ID to nav-menu for aria-controls reference
    navMenu.id = 'main-nav-menu';
    
    // Toggle mobile menu on button click
    mobileMenuButton.addEventListener('click', function() {
      const expanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', !expanded);
      navMenu.classList.toggle('active');
      
      // Create live announcement for screen readers
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.className = 'visually-hidden';
      
      if (!expanded) {
        // Opening the menu
        announcement.textContent = 'Navigation menu opened';
        document.body.appendChild(announcement);
        
        // Set focus on first nav item
        const firstNavLink = navMenu.querySelector('a');
        if (firstNavLink) {
          setTimeout(() => {
            firstNavLink.focus();
          }, 150);
        }
        
        // Set the role of the menu for screen readers
        navMenu.setAttribute('role', 'navigation');
        navMenu.setAttribute('aria-label', 'Site Navigation');
      } else {
        // Closing the menu
        announcement.textContent = 'Navigation menu closed';
        document.body.appendChild(announcement);
      }
      
      // Remove announcement after it's been read
      setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 1000);
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
      if (navMenu.classList.contains('active') && 
          !navMenu.contains(e.target) && 
          !mobileMenuButton.contains(e.target)) {
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('active');
      }
    });
    
    // Close menu when Escape key is pressed
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && navMenu.classList.contains('active')) {
        mobileMenuButton.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('active');
        mobileMenuButton.focus(); // Return focus to menu button
      }
    });
  }
  
  // ======= Enhance Keyboard Navigation for all Interactive Elements =======
  // Create nav roving tabindex system
  const navLinks = document.querySelectorAll('.nav-links a');
  
  // Set up the ARIA attributes for navigation menu
  const navMenuElement = document.querySelector('.nav-menu');
  if (navMenuElement) {
    navMenuElement.setAttribute('role', 'menubar');
    
    // Set up each nav link item
    const navLinkItems = navMenu.querySelectorAll('.nav-links li');
    navLinkItems.forEach(item => {
      item.setAttribute('role', 'none');
    });
  }
  
  if (navLinks.length > 0) {
    // Set initial state - first item is tabbable, others not
    navLinks.forEach((link, index) => {
      // Set the role for each link
      link.setAttribute('role', 'menuitem');
      link.setAttribute('tabindex', index === 0 ? '0' : '-1');
      // Add information about navigation position
      if (index === 0) {
        link.setAttribute('aria-posinset', '1');
        link.setAttribute('aria-setsize', navLinks.length);
      } else if (index === navLinks.length - 1) {
        link.setAttribute('aria-posinset', navLinks.length);
        link.setAttribute('aria-setsize', navLinks.length);
      } else {
        link.setAttribute('aria-posinset', index + 1);
        link.setAttribute('aria-setsize', navLinks.length);
      }
    });
    
    // Handle keyboard navigation within nav links
    navLinks.forEach((link, index) => {
      link.addEventListener('keydown', function(e) {
        // Handle arrow key navigation
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (index + 1) % navLinks.length;
          // Update tabindex
          this.setAttribute('tabindex', '-1');
          navLinks[nextIndex].setAttribute('tabindex', '0');
          navLinks[nextIndex].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (index - 1 + navLinks.length) % navLinks.length;
          // Update tabindex
          this.setAttribute('tabindex', '-1');
          navLinks[prevIndex].setAttribute('tabindex', '0');
          navLinks[prevIndex].focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          // Update tabindex
          this.setAttribute('tabindex', '-1');
          navLinks[0].setAttribute('tabindex', '0');
          navLinks[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          // Update tabindex
          this.setAttribute('tabindex', '-1');
          navLinks[navLinks.length - 1].setAttribute('tabindex', '0');
          navLinks[navLinks.length - 1].focus();
        }
      });
    });
  }
  
  // Add keyboard navigation to footer links
  const footerNav = document.querySelector('footer nav');
  const footerLinks = document.querySelectorAll('.footer-links a');
  
  // Set proper ARIA attributes on footer navigation
  if (footerNav) {
    footerNav.setAttribute('role', 'navigation');
  }
  
  // Set proper attributes on the footer links list
  const footerLinksList = document.querySelector('.footer-links');
  if (footerLinksList) {
    footerLinksList.setAttribute('role', 'list');
    
    // Set attributes on list items
    const footerLinkItems = footerLinksList.querySelectorAll('li');
    footerLinkItems.forEach(item => {
      item.setAttribute('role', 'listitem');
    });
  }
  
  if (footerLinks.length > 0) {
    // Set initial state - first item is tabbable, others not
    footerLinks.forEach((link, index) => {
      link.setAttribute('tabindex', index === 0 ? '0' : '-1');
      // Add information about navigation position
      link.setAttribute('aria-posinset', index + 1);
      link.setAttribute('aria-setsize', footerLinks.length);
    });
    
    // Handle keyboard navigation for footer links
    footerLinks.forEach((link, index) => {
      link.addEventListener('keydown', function(e) {
        // Handle arrow key navigation
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = (index + 1) % footerLinks.length;
          // Update tabindex
          this.setAttribute('tabindex', '-1');
          footerLinks[nextIndex].setAttribute('tabindex', '0');
          footerLinks[nextIndex].focus();
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          const prevIndex = (index - 1 + footerLinks.length) % footerLinks.length;
          // Update tabindex
          this.setAttribute('tabindex', '-1');
          footerLinks[prevIndex].setAttribute('tabindex', '0');
          footerLinks[prevIndex].focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          // Update tabindex
          this.setAttribute('tabindex', '-1');
          footerLinks[0].setAttribute('tabindex', '0');
          footerLinks[0].focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          // Update tabindex
          this.setAttribute('tabindex', '-1');
          footerLinks[footerLinks.length - 1].setAttribute('tabindex', '0');
          footerLinks[footerLinks.length - 1].focus();
        }
      });
    });
  }
  
  // Add dynamic ARIA live region for page updates
  const liveRegion = document.createElement('div');
  liveRegion.id = 'aria-live-announcer';
  liveRegion.className = 'visually-hidden';
  liveRegion.setAttribute('aria-live', 'polite');
  liveRegion.setAttribute('aria-atomic', 'true');
  document.body.appendChild(liveRegion);
  
  // Expose function to make announcements
  window.announceToScreenReader = function(message) {
    const liveRegion = document.getElementById('aria-live-announcer');
    if (liveRegion) {
      liveRegion.textContent = message;
      // Clear after a few seconds to prevent duplication
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  };
});