/**
 * View Toggle - Switches between Consumer and Company content
 * This script handles toggling content visibility and storing the preference
 */

// Use an IIFE to avoid polluting the global namespace and prevent multiple initializations
(function() {
    // Check if the script has already been initialized
    if (window.viewToggleInitialized) {
        console.log('View toggle already initialized, skipping');
        return;
    }

    // Mark as initialized
    window.viewToggleInitialized = true;

    console.log('Initializing view toggle script');

    // Function to initialize the toggle
    function initViewToggle() {
        console.log('Setting up view toggle');

        // Get the view toggle element
        const viewToggle = document.getElementById('viewToggle');
        if (!viewToggle) {
            console.error('View toggle element not found, exiting script');
            return; // Exit if toggle doesn't exist
        }
        console.log('View toggle element found');

        // Get all content elements that should be toggled
        const consumerElements = document.querySelectorAll('.consumer-view-content');
        const companyElements = document.querySelectorAll('.company-view-content');
        console.log('Content elements found:', {
            consumerElements: consumerElements.length,
            companyElements: companyElements.length
        });

        // Labels for visual feedback
        const customerLabel = document.querySelector('.view-label.customer-view');
        const companyLabel = document.querySelector('.view-label.company-view');

        // For accessibility
        if (customerLabel) {
            customerLabel.setAttribute('id', 'customer-view-label');
            customerLabel.setAttribute('tabindex', '0');
            customerLabel.setAttribute('role', 'button');
        }

        if (companyLabel) {
            companyLabel.setAttribute('id', 'company-view-label');
            companyLabel.setAttribute('tabindex', '0');
            companyLabel.setAttribute('role', 'button');
        }

        // Function to update content visibility
        function updateContentVisibility(isCompanyView) {
            console.log('Updating content visibility, isCompanyView =', isCompanyView);

            // Update labels
            if (customerLabel) {
                customerLabel.classList.toggle('active', !isCompanyView);
                customerLabel.setAttribute('aria-pressed', !isCompanyView);
            }

            if (companyLabel) {
                companyLabel.classList.toggle('active', isCompanyView);
                companyLabel.setAttribute('aria-pressed', isCompanyView);
            }

            // Update body class for central circle styling
            document.body.classList.toggle('company-view-active', isCompanyView);

            

            // Save preference to localStorage
            localStorage.setItem('divinciContentView', isCompanyView ? 'company' : 'consumer');

            // Dispatch a custom event that can be listened to by other scripts
            document.dispatchEvent(new CustomEvent('viewToggled', {
                detail: { isCompanyView }
            }));
        }

        // Check if there's a saved preference
        const savedView = localStorage.getItem('divinciContentView');

        // Apply the saved preference if it exists
        if (savedView === 'company') {
            viewToggle.checked = true;
            // Set the body class for central circle styling
            document.body.classList.add('company-view-active');
        } else {
            viewToggle.checked = false;
            // Remove the body class for central circle styling
            document.body.classList.remove('company-view-active');
        }

        // Initialize content visibility based on toggle state
        updateContentVisibility(viewToggle.checked);

        // Remove any existing event listeners (in case this is called multiple times)
        viewToggle.removeEventListener('change', handleToggleChange);

        // Add event listener for the toggle
        viewToggle.addEventListener('change', handleToggleChange);

        // Handler function for toggle changes
        function handleToggleChange() {
            const isCompanyView = this.checked;
            console.log('Toggle changed, isCompanyView =', isCompanyView);
            updateContentVisibility(isCompanyView);
        }

        // Add click handler for the central circle
        const centralCircle = document.querySelector('.central');
        if (centralCircle) {
            centralCircle.removeEventListener('click', handleCentralCircleClick);
            centralCircle.addEventListener('click', handleCentralCircleClick);

            function handleCentralCircleClick() {
                // Toggle the view
                viewToggle.checked = !viewToggle.checked;
                // Trigger the change event
                const changeEvent = new Event('change', { bubbles: true });
                viewToggle.dispatchEvent(changeEvent);
            }
        }

        // Click handlers for the labels
        if (customerLabel) {
            // Remove existing event listeners
            customerLabel.removeEventListener('click', handleCustomerLabelClick);

            // Add new event listener
            customerLabel.addEventListener('click', handleCustomerLabelClick);

            function handleCustomerLabelClick() {
                viewToggle.checked = false;
                const changeEvent = new Event('change', { bubbles: true });
                viewToggle.dispatchEvent(changeEvent);
            }

            // Keyboard support
            customerLabel.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCustomerLabelClick();
                }
            });
        }

        if (companyLabel) {
            // Remove existing event listeners
            companyLabel.removeEventListener('click', handleCompanyLabelClick);

            // Add new event listener
            companyLabel.addEventListener('click', handleCompanyLabelClick);

            function handleCompanyLabelClick() {
                viewToggle.checked = true;
                const changeEvent = new Event('change', { bubbles: true });
                viewToggle.dispatchEvent(changeEvent);
            }

            // Keyboard support
            companyLabel.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleCompanyLabelClick();
                }
            });
        }

        // Add CSS for transitions if not already present
        if (!document.getElementById('view-toggle-styles')) {
            const styleEl = document.createElement('style');
            styleEl.id = 'view-toggle-styles';
            styleEl.textContent = `
                .consumer-view-content, .company-view-content {
                    transition: opacity 0.2s ease-in-out;
                }
            `;
            document.head.appendChild(styleEl);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initViewToggle);
    } else {
        // DOM is already ready, call the function directly
        initViewToggle();
    }

    // Also initialize when the header is loaded (for cases where the script is loaded before the header)
    document.addEventListener('headerLoaded', initViewToggle);

    // Dispatch a custom event to notify that the view toggle script has been loaded
    document.dispatchEvent(new CustomEvent('viewToggleScriptLoaded'));
})();
