/**
 * Orbital Elements Initialization Script
 * Ensures orbital elements form a proper geometric shape around the animation frame
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize orbital elements
    initOrbitalElements();
    
    // Create orbit paths
    createOrbitPaths();
});

/**
 * Initializes orbital animations for feature elements
 */
function initOrbitalElements() {
    const orbitalElements = document.querySelectorAll('.orbital-element');
    
    // If no orbital elements found, exit
    if (orbitalElements.length === 0) return;
    
    // Check if we're on mobile
    if (window.innerWidth < 768) {
        // On mobile, just make them visible without animation
        orbitalElements.forEach(element => {
            element.style.position = 'static';
            element.style.transform = 'none';
            element.style.margin = '10px auto';
            element.style.opacity = '1';
        });
        return;
    }
    
    // On desktop, set up orbital animations
    orbitalElements.forEach((element, index) => {
        // Calculate orbit parameters
        const orbitRadius = 180 + (index * 40); // Increased spacing between orbits
        const orbitDuration = 25 + (index * 5);
        const startAngle = (index * 72) % 360; // Evenly distribute around 360 degrees (72 = 360/5)
        
        // Set animation properties
        element.style.setProperty('--orbit-radius', `${orbitRadius}px`);
        element.style.setProperty('--orbit-duration', `${orbitDuration}s`);
        element.style.setProperty('--start-angle', `${startAngle}deg`);
        
        // Make sure the element is visible
        element.style.opacity = '1';
        
        // Add hover effect
        element.addEventListener('mouseenter', function() {
            this.style.transform = `translate(-50%, -50%) rotate(${startAngle}deg) translateX(${orbitRadius}px) rotate(-${startAngle}deg) scale(1.1)`;
            this.style.boxShadow = '0 0 30px rgba(92, 226, 231, 0.4)';
            this.style.backgroundColor = 'rgba(92, 226, 231, 0.3)';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.transform = `translate(-50%, -50%) rotate(${startAngle}deg) translateX(${orbitRadius}px) rotate(-${startAngle}deg)`;
            this.style.boxShadow = '0 0 15px rgba(92, 226, 231, 0.1)';
            this.style.backgroundColor = '';
        });
    });
}

/**
 * Creates orbit paths for visual enhancement
 */
function createOrbitPaths() {
    const container = document.querySelector('.hero-animation-container');
    if (!container) return;
    
    // Check if we're on mobile
    if (window.innerWidth < 768) return;
    
    // Get existing orbit paths
    const orbitPath1 = container.querySelector('.orbit-path-1');
    const orbitPath2 = container.querySelector('.orbit-path-2');
    const orbitPath3 = container.querySelector('.orbit-path-3');
    
    // If orbit paths exist, make them visible
    if (orbitPath1) orbitPath1.style.opacity = '1';
    if (orbitPath2) orbitPath2.style.opacity = '1';
    if (orbitPath3) orbitPath3.style.opacity = '1';
}

// Handle window resize
window.addEventListener('resize', function() {
    // Reinitialize orbital elements on resize
    initOrbitalElements();
    
    // Update orbit paths
    createOrbitPaths();
});
