/**
 * Feature Circle Links
 * Makes entire feature circles clickable when they contain links
 */

document.addEventListener('DOMContentLoaded', function() {
    // Find all feature circles
    const features = document.querySelectorAll('.features-section .feature');
    
    // Process each feature
    features.forEach(feature => {
        // Check if the feature has an h3 with a link
        const h3 = feature.querySelector('h3');
        if (h3) {
            const link = h3.querySelector('a');
            if (link) {
                // Get the href and target attributes
                const href = link.getAttribute('href');
                const target = link.getAttribute('target') || '_self';
                
                // Make the entire feature clickable
                feature.addEventListener('click', function(e) {
                    // Only trigger if the click wasn't on the link itself
                    // This prevents double navigation
                    if (!e.target.closest('a')) {
                        if (target === '_blank') {
                            window.open(href, '_blank');
                        } else {
                            window.location.href = href;
                        }
                    }
                });
                
                // Add a class to indicate it's clickable
                feature.classList.add('clickable-feature');
            }
        }
    });
});
