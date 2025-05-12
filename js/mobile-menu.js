/**
 * Mobile Menu Functionality for Divinci AI
 * Handles hamburger menu toggle and navigation
 */

document.addEventListener('DOMContentLoaded', function() {
    // We're not using the mobile menu toggle for now
    // Instead, we're showing the regular menu on mobile
    function setupMobileMenu() {
        // Get the navbar
        const navbar = document.querySelector('.navbar');

        if (!navbar) {
            console.error('Navigation elements not found');
            return;
        }

        // Make sure the nav-menu is visible on mobile
        const navMenu = document.querySelector('.nav-menu');
        if (navMenu) {
            navMenu.style.display = 'flex';
        }

        // No toggle functionality needed since we're showing the regular menu
    }

    // Run setup after a short delay to ensure DOM is fully processed
    setTimeout(setupMobileMenu, 100);
});