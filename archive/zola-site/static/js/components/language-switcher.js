/**
 * Language Switcher Component
 * Handles language switching functionality for the Divinci AI website
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeLanguageSwitchers();
});

function initializeLanguageSwitchers() {
    const languageSwitchers = document.querySelectorAll('.language-switcher');
    
    if (languageSwitchers.length === 0) {
        console.log('No language switchers found');
        return;
    }

    // Initialize each switcher
    languageSwitchers.forEach(switcher => {
        // Skip already initialized switchers
        if (switcher.hasAttribute('data-initialized')) return;

        // Mark as initialized
        switcher.setAttribute('data-initialized', 'true');

        // Set up toggle behavior
        const toggleButton = switcher.querySelector('.language-switcher-current');
        if (toggleButton) {
            toggleButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Close other switchers
                document.querySelectorAll('.language-switcher.active').forEach(s => {
                    if (s !== switcher) s.classList.remove('active');
                });

                // Toggle this switcher
                switcher.classList.toggle('active');
            });
        }

        // Set up click handlers for language options
        const languageOptions = switcher.querySelectorAll('.language-option');
        languageOptions.forEach(option => {
            option.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                const href = this.getAttribute('href');
                if (href) {
                    // Close the dropdown
                    switcher.classList.remove('active');

                    // Navigate to the new language
                    window.location.href = href;
                }
            });
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.language-switcher')) {
            document.querySelectorAll('.language-switcher.active').forEach(switcher => {
                switcher.classList.remove('active');
            });
        }
    });

    // Close dropdowns on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.language-switcher.active').forEach(switcher => {
                switcher.classList.remove('active');
            });
        }
    });

    console.log(`Initialized ${languageSwitchers.length} language switcher(s)`);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeLanguageSwitchers };
}
