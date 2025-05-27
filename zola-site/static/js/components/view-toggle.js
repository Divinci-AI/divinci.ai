/**
 * View Toggle Component
 * Handles switching between Consumer and Company views
 */

document.addEventListener('DOMContentLoaded', function() {
    initializeViewToggle();
});

function initializeViewToggle() {
    const viewToggle = document.getElementById('viewToggle');
    if (!viewToggle) {
        console.log('View toggle not found');
        return;
    }

    // Initialize view state
    let isCompanyView = false;

    // Get all view-specific elements
    const consumerElements = document.querySelectorAll('.consumer-view-content');
    const companyElements = document.querySelectorAll('.company-view-content');
    const consumerLabels = document.querySelectorAll('.customer-view');
    const companyLabels = document.querySelectorAll('.company-view');

    function updateView(showCompany) {
        isCompanyView = showCompany;
        
        if (showCompany) {
            // Show company view
            consumerElements.forEach(el => {
                el.style.display = 'none';
                el.style.opacity = '0';
            });
            companyElements.forEach(el => {
                el.style.display = 'block';
                setTimeout(() => el.style.opacity = '1', 50);
            });
            
            // Update labels
            consumerLabels.forEach(el => el.classList.remove('active'));
            companyLabels.forEach(el => el.classList.add('active'));
        } else {
            // Show consumer view
            companyElements.forEach(el => {
                el.style.display = 'none';
                el.style.opacity = '0';
            });
            consumerElements.forEach(el => {
                el.style.display = 'block';
                setTimeout(() => el.style.opacity = '1', 50);
            });
            
            // Update labels
            companyLabels.forEach(el => el.classList.remove('active'));
            consumerLabels.forEach(el => el.classList.add('active'));
        }

        // Update toggle state
        viewToggle.checked = showCompany;
        
        // Store preference
        try {
            localStorage.setItem('divinci_view_preference', showCompany ? 'company' : 'consumer');
        } catch (e) {
            console.warn('Could not save view preference:', e);
        }
    }

    // Load saved preference
    try {
        const savedPreference = localStorage.getItem('divinci_view_preference');
        if (savedPreference === 'company') {
            updateView(true);
        }
    } catch (e) {
        console.warn('Could not load view preference:', e);
    }

    // Handle toggle change
    viewToggle.addEventListener('change', function() {
        updateView(this.checked);
    });

    // Handle label clicks
    consumerLabels.forEach(label => {
        label.addEventListener('click', () => updateView(false));
    });

    companyLabels.forEach(label => {
        label.addEventListener('click', () => updateView(true));
    });

    console.log('View toggle initialized');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { initializeViewToggle };
}
