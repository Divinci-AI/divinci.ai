/**
 * Circular Benefits Layout JavaScript
 * Creates connection lines between benefits and handles animations
 */

// Wait for window to fully load to ensure all elements are rendered properly
window.addEventListener('load', function() {
    initCircularBenefits();
});

// Initialize circular benefits layout
function initCircularBenefits() {
    // Check if the benefits circle container exists
    const benefitsContainer = document.querySelector('.benefits-circle-container');
    if (!benefitsContainer) return;

    const centerBenefit = document.querySelector('.center-benefit');
    const orbitalBenefits = document.querySelectorAll('.orbital-benefit');

    console.log('Found center benefit:', centerBenefit);
    console.log('Found orbital benefits:', orbitalBenefits.length);

    // Ensure orbital benefits are properly positioned
    orbitalBenefits.forEach((benefit, index) => {
        console.log(`Orbital benefit ${index + 1}:`, benefit.id);
    });

    // Create connection lines between center and orbital benefits
    if (centerBenefit && orbitalBenefits.length > 0) {
        // Use setTimeout with a longer delay to ensure elements are fully rendered with correct positions
        setTimeout(() => {
            createConnectionLines(centerBenefit, orbitalBenefits);
        }, 300);
    }

    // Add hover effects
    orbitalBenefits.forEach((benefit, index) => {
        benefit.addEventListener('mouseenter', function() {
            // Highlight connection lines related to this benefit
            const relatedLines = document.querySelectorAll(`.benefit-connection-line[data-target="${benefit.id}"]`);
            relatedLines.forEach(line => {
                if (index === 4) { // Deployment Strategies (5th element)
                    line.style.opacity = '0.9';
                    line.style.height = '3px';
                    line.style.background = 'linear-gradient(to right, rgba(92, 226, 231, 0.2), rgba(92, 226, 231, 0.7), rgba(92, 226, 231, 0.2))';
                } else {
                    line.style.opacity = '0.8';
                    line.style.height = '2px';
                }
            });
        });

        benefit.addEventListener('mouseleave', function() {
            // Reset connection lines
            const relatedLines = document.querySelectorAll(`.benefit-connection-line[data-target="${benefit.id}"]`);
            relatedLines.forEach(line => {
                if (index === 4) { // Deployment Strategies (5th element)
                    line.style.opacity = '0.6';
                    line.style.height = '2px';
                    line.style.background = 'linear-gradient(to right, rgba(92, 226, 231, 0.1), rgba(92, 226, 231, 0.5), rgba(92, 226, 231, 0.1))';
                } else {
                    line.style.opacity = '0.4';
                    line.style.height = '1px';
                }
            });
        });
    });
}

/**
 * Creates connection lines between center benefit and orbital benefits
 */
function createConnectionLines(center, orbitals) {
    try {
        // Make sure all required elements exist
        const container = document.querySelector('.benefits-circle-container');
        if (!container || !center || !orbitals || orbitals.length === 0) {
            console.warn('Missing required elements for creating connection lines');
            return;
        }

        console.log('Creating connection lines between center and orbital benefits');

        // Get bounding rectangles
        const centerRect = center.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        if (!centerRect || !containerRect) {
            console.warn('Could not get bounding rectangles');
            return;
        }

        console.log('Container rect:', containerRect);
        console.log('Center benefit rect:', centerRect);

        // Calculate center point relative to container
        const centerX = centerRect.left + centerRect.width / 2 - containerRect.left;
        const centerY = centerRect.top + centerRect.height / 2 - containerRect.top;

        console.log('Center point:', centerX, centerY);

        // Remove any existing connection lines
        const existingLines = container.querySelectorAll('.benefit-connection-line');
        existingLines.forEach(line => line.remove());

        // Create connection lines
        orbitals.forEach((orbital, index) => {
            if (!orbital || !orbital.id) {
                console.warn('Invalid orbital element', orbital);
                return; // Skip this orbital
            }

            const orbitalRect = orbital.getBoundingClientRect();
            if (!orbitalRect) return;

            console.log(`Orbital ${index + 1} rect:`, orbitalRect);

            const orbitalX = orbitalRect.left + orbitalRect.width / 2 - containerRect.left;
            const orbitalY = orbitalRect.top + orbitalRect.height / 2 - containerRect.top;

            console.log(`Orbital ${index + 1} point:`, orbitalX, orbitalY);

            // Calculate line length and angle
            const deltaX = orbitalX - centerX;
            const deltaY = orbitalY - centerY;
            const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;

            console.log(`Line ${index + 1} - length: ${length}, angle: ${angle}`);

            // Create line element
            const line = document.createElement('div');
            line.className = 'benefit-connection-line';
            line.setAttribute('data-target', orbital.id);
            line.style.width = `${length}px`;
            line.style.left = `${centerX}px`;
            line.style.top = `${centerY}px`;
            line.style.transform = `rotate(${angle}deg)`;

            // Special styling for the top point (Deployment Strategies)
            if (index === 4) { // 5th element (0-based index is 4)
                line.style.opacity = '0.6'; // More visible
                line.style.height = '2px'; // Thicker line
                line.style.background = 'linear-gradient(to right, rgba(92, 226, 231, 0.1), rgba(92, 226, 231, 0.5), rgba(92, 226, 231, 0.1))';
            } else {
                line.style.opacity = '0.4';
            }

            // Add animation delay based on index
            line.style.animationDelay = `${index * 0.5}s`;

            container.appendChild(line);
            console.log(`Added connection line for orbital ${index + 1}`);
        });
    } catch (error) {
        console.error('Error creating connection lines:', error);
    }
}
