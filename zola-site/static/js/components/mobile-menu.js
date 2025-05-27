/**
 * Mobile Menu Component
 * Handles mobile navigation menu functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
});

function initializeMobileMenu() {
    // Create mobile menu toggle button if it doesn't exist
    const navbar = document.querySelector('.navbar');
    if (!navbar) {
        console.log('Navbar not found');
        return;
    }

    let mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (!mobileToggle) {
        // Create mobile menu toggle
        mobileToggle = document.createElement('button');
        mobileToggle.className = 'mobile-menu-toggle';
        mobileToggle.setAttribute('aria-label', 'Toggle mobile menu');
        mobileToggle.innerHTML = `
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
        `;
        
        // Insert before nav-menu
        const navMenu = navbar.querySelector('.nav-menu');
        if (navMenu) {
            navbar.insertBefore(mobileToggle, navMenu);
        }
    }

    const navMenu = navbar.querySelector('.nav-menu');
    if (!navMenu) {
        console.log('Nav menu not found');
        return;
    }

    let isMenuOpen = false;

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
            navMenu.classList.add('mobile-menu-open');
            mobileToggle.classList.add('active');
            document.body.classList.add('mobile-menu-active');
            mobileToggle.setAttribute('aria-expanded', 'true');
        } else {
            navMenu.classList.remove('mobile-menu-open');
            mobileToggle.classList.remove('active');
            document.body.classList.remove('mobile-menu-active');
            mobileToggle.setAttribute('aria-expanded', 'false');
        }
    }

    function closeMenu() {
        if (isMenuOpen) {
            toggleMenu();
        }
    }

    // Toggle menu on button click
    mobileToggle.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        toggleMenu();
    });

    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (isMenuOpen && !navbar.contains(e.target)) {
            closeMenu();
        }
    });

    // Close menu on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
            closeMenu();
        }
    });

    // Close menu when clicking on nav links (mobile)
    const navLinks = navMenu.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Small delay to allow navigation to start
            setTimeout(closeMenu, 100);
        });
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && isMenuOpen) {
            closeMenu();
        }
    });

    // Add mobile menu styles if not already present
    if (!document.querySelector('#mobile-menu-styles')) {
        const styles = document.createElement('style');
        styles.id = 'mobile-menu-styles';
        styles.textContent = `
            .mobile-menu-toggle {
                display: none;
                flex-direction: column;
                justify-content: space-around;
                width: 30px;
                height: 30px;
                background: transparent;
                border: none;
                cursor: pointer;
                padding: 0;
                z-index: 10001;
            }

            .hamburger-line {
                width: 100%;
                height: 3px;
                background-color: white;
                transition: all 0.3s ease;
                transform-origin: center;
            }

            .mobile-menu-toggle.active .hamburger-line:nth-child(1) {
                transform: rotate(45deg) translate(6px, 6px);
            }

            .mobile-menu-toggle.active .hamburger-line:nth-child(2) {
                opacity: 0;
            }

            .mobile-menu-toggle.active .hamburger-line:nth-child(3) {
                transform: rotate(-45deg) translate(6px, -6px);
            }

            @media (max-width: 768px) {
                .mobile-menu-toggle {
                    display: flex;
                }

                .nav-menu {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100vh;
                    background-color: rgba(0, 0, 0, 0.95);
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                    z-index: 10000;
                }

                .nav-menu.mobile-menu-open {
                    transform: translateX(0);
                }

                .nav-menu a {
                    font-size: 1.5rem;
                    margin: 1rem 0;
                    color: white;
                    text-decoration: none;
                }

                .view-toggle-container {
                    margin: 2rem 0;
                }

                #language-switcher-container {
                    margin: 2rem 0;
                }

                body.mobile-menu-active {
                    overflow: hidden;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    console.log('Mobile menu initialized');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeMobileMenu };
}
