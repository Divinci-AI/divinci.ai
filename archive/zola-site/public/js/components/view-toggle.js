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

    
    const consumerLabels = document.querySelectorAll('.customer-view');
    const companyLabels = document.querySelectorAll('.company-view');

    function updateView(showCompany) {
        const bodyClassToAdd = showCompany ? 'company-view-active' : 'customer-view-active';
        const bodyClassToRemove = showCompany ? 'customer-view-active' : 'company-view-active';

        document.body.classList.remove(bodyClassToRemove);
        document.body.classList.add(bodyClassToAdd);

        viewToggle.checked = showCompany;

        try {
            localStorage.setItem('divinci_view_preference', showCompany ? 'company' : 'consumer');
        } catch (e) {
            console.warn('Could not save view preference:', e);
        }
    }

    // Load saved preference or default to company view
    try {
        const savedPreference = localStorage.getItem('divinci_view_preference');
        if (savedPreference === 'consumer') {
            updateView(false);
        } else {
            // Default to company view
            updateView(true);
        }
    } catch (e) {
        console.warn('Could not load view preference:', e);
        // Default to company view if localStorage fails
        updateView(true);
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
