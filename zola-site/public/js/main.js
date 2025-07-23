/**
 * Main JavaScript file for Divinci AI website
 * Coordinates all components and handles global functionality
 */

// Global configuration
window.DivinciAI = {
    config: {
        debug: false,
        version: '1.0.0'
    },
    components: {},
    utils: {}
};

// Utility functions
window.DivinciAI.utils = {
    /**
     * Debounce function to limit function calls
     */
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction() {
            const context = this;
            const args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },

    /**
     * Check if element is in viewport
     */
    isInViewport: function(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },

    /**
     * Smooth scroll to element
     */
    smoothScrollTo: function(element, offset = 0) {
        const elementPosition = element.offsetTop - offset;
        window.scrollTo({
            top: elementPosition,
            behavior: 'smooth'
        });
    },

    /**
     * Log debug messages
     */
    log: function(message, type = 'info') {
        if (window.DivinciAI.config.debug) {
            console[type]('[DivinciAI]', message);
        }
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeWebsite();
    initializeOrbitalFeatures();
});

function initializeWebsite() {
    window.DivinciAI.utils.log('Initializing Divinci AI website');

    // Initialize core functionality
    initializeAccessibility();
    initializeScrollBehavior();
    initializeFormHandling();
    initializeAnalytics();

    window.DivinciAI.utils.log('Website initialization complete');
}

/**
 * Initialize accessibility features
 */
function initializeAccessibility() {
    // Skip links functionality
    const skipLinks = document.querySelectorAll('.skip-link');
    skipLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.focus();
                window.DivinciAI.utils.smoothScrollTo(target);
            }
        });
    });

    // Keyboard navigation for dropdowns
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Close any open dropdowns
            document.querySelectorAll('.dropdown.is-active, .language-switcher.active').forEach(dropdown => {
                dropdown.classList.remove('is-active', 'active');
            });
        }
    });

    window.DivinciAI.utils.log('Accessibility features initialized');
}

/**
 * Initialize orbital features animation
 */
function initializeOrbitalFeatures() {
    const featuresSection = document.querySelector('.features-section');
    const features = document.querySelectorAll('.feature');

    if (featuresSection && features.length > 0) {
        // Show the features section
        featuresSection.style.display = 'block';

        // Make features visible with orbital animation
        features.forEach((feature, index) => {
            setTimeout(() => {
                feature.style.opacity = '1';
            }, index * 200); // Stagger the appearance
        });
    }

    window.DivinciAI.utils.log('Orbital features initialized');
}

/**
 * Initialize scroll behavior and animations
 */
function initializeScrollBehavior() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.DivinciAI.utils.smoothScrollTo(target, 80);
            }
        });
    });

    // Scroll-based animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements with animation classes
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    window.DivinciAI.utils.log('Scroll behavior initialized');
}

/**
 * Initialize form handling
 */
function initializeFormHandling() {
    const forms = document.querySelectorAll('form[data-form-type]');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const formType = this.getAttribute('data-form-type');
            
            // Add loading state
            const submitButton = this.querySelector('button[type="submit"]');
            if (submitButton) {
                submitButton.classList.add('is-loading');
                submitButton.disabled = true;
            }

            // Handle different form types
            switch (formType) {
                case 'signup':
                    handleSignupForm(this, e);
                    break;
                case 'contact':
                    handleContactForm(this, e);
                    break;
                default:
                    window.DivinciAI.utils.log('Unknown form type: ' + formType, 'warn');
            }
        });
    });

    window.DivinciAI.utils.log('Form handling initialized');
}

/**
 * Handle signup form submission
 */
function handleSignupForm(form, event) {
    event.preventDefault();
    
    const email = form.querySelector('input[type="email"]').value;
    
    // Basic email validation
    if (!email || !email.includes('@')) {
        showFormMessage(form, 'Please enter a valid email address.', 'error');
        resetFormButton(form);
        return;
    }

    // Simulate API call
    setTimeout(() => {
        showFormMessage(form, 'Thank you for signing up! We\'ll notify you when we launch.', 'success');
        form.reset();
        resetFormButton(form);
        
        // Track signup event
        if (window.gtag) {
            window.gtag('event', 'signup', {
                'event_category': 'engagement',
                'event_label': 'email_signup'
            });
        }
    }, 1000);
}

/**
 * Handle contact form submission
 */
function handleContactForm(form, event) {
    event.preventDefault();
    
    // Simulate API call
    setTimeout(() => {
        showFormMessage(form, 'Thank you for your message! We\'ll get back to you soon.', 'success');
        form.reset();
        resetFormButton(form);
        
        // Track contact event
        if (window.gtag) {
            window.gtag('event', 'contact', {
                'event_category': 'engagement',
                'event_label': 'contact_form'
            });
        }
    }, 1000);
}

/**
 * Show form message
 */
function showFormMessage(form, message, type) {
    let messageEl = form.querySelector('.form-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'form-message';
        form.appendChild(messageEl);
    }
    
    messageEl.textContent = message;
    messageEl.className = `form-message ${type}`;
    messageEl.style.display = 'block';
    
    // Hide message after 5 seconds
    setTimeout(() => {
        messageEl.style.display = 'none';
    }, 5000);
}

/**
 * Reset form button state
 */
function resetFormButton(form) {
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.classList.remove('is-loading');
        submitButton.disabled = false;
    }
}

/**
 * Initialize analytics
 */
function initializeAnalytics() {
    // Track page view
    if (window.gtag) {
        window.gtag('event', 'page_view', {
            'page_title': document.title,
            'page_location': window.location.href
        });
    }

    // Track scroll depth
    let maxScroll = 0;
    const trackScrollDepth = window.DivinciAI.utils.debounce(function() {
        const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            if (maxScroll >= 25 && maxScroll < 50) {
                trackEvent('scroll_depth', '25_percent');
            } else if (maxScroll >= 50 && maxScroll < 75) {
                trackEvent('scroll_depth', '50_percent');
            } else if (maxScroll >= 75) {
                trackEvent('scroll_depth', '75_percent');
            }
        }
    }, 1000);

    window.addEventListener('scroll', trackScrollDepth);

    window.DivinciAI.utils.log('Analytics initialized');
}

/**
 * Track custom events
 */
function trackEvent(action, label, value) {
    if (window.gtag) {
        window.gtag('event', action, {
            'event_category': 'engagement',
            'event_label': label,
            'value': value
        });
    }
    window.DivinciAI.utils.log(`Event tracked: ${action} - ${label}`);
}

// Export for use in other modules
window.DivinciAI.trackEvent = trackEvent;

// Handle page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'visible') {
        window.DivinciAI.utils.log('Page became visible');
    } else {
        window.DivinciAI.utils.log('Page became hidden');
    }
});

window.DivinciAI.utils.log('Main JavaScript loaded');
