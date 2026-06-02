/**
 * Simple Orbit Animation for Features Section
 * Features orbit around the center while scrolling, with fade effect
 * Completely disabled on mobile devices for better performance
 */

// Immediately check viewport width and set a global flag if not already set
if (typeof window.isMobileView === 'undefined') {
  window.isMobileView = window.innerWidth < 768;
}
console.log("Mobile view detection (from features-orbit): " + (window.isMobileView ? "MOBILE" : "DESKTOP") + " - Width: " + window.innerWidth + "px");

// Add a style tag to disable animations on mobile viewports
if (window.isMobileView) {
  const styleTag = document.createElement('style');
  styleTag.textContent = `
    /* Disable animations on mobile but don't hide elements */
    .feature, .orbital-element, .sacred-geometry-background,
    .sacred-flower, .sacred-hexagon, .sacred-triangle, .sacred-metatron,
    .hero-image-circle, .feature-card, .benefit-item {
      animation: none !important;
      transition: none !important;
    }

    /* Specific overrides for the features section */
    #features .feature {
      width: 350px !important;
      height: 350px !important;
      margin: 10px auto !important;
      position: relative !important;
      transform: none !important;
      left: auto !important;
      top: auto !important;
    }

    /* Only hide orbital elements in the features section on mobile, not other content */
    #features .orbital-element {
      display: none !important;
    }

    /* Ensure feature pages are visible on mobile */
    body, main, .feature-hero, .feature-overview, .feature-benefits,
    .feature-details, .feature-implementation {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
  `;
  document.head.appendChild(styleTag);
  console.log("Mobile animation disabling styles added (with fixes for feature pages)");
}

document.addEventListener('DOMContentLoaded', function() {
  // Get references to the main features section (not the team section)
  const featuresSection = document.querySelector('#features.features-section');
  const features = document.querySelectorAll('#features.features-section .feature');

  // If on mobile or no features found, don't initialize the animation
  if (window.isMobileView || !featuresSection || features.length === 0) {
    console.log('Animation not initialized: ' +
      (window.isMobileView ? 'Mobile view detected' : 'Features section or features not found'));
    return;
  }

  console.log(`Found ${features.length} features to animate`);

  // Store original positions of features
  const originalPositions = [];
  features.forEach(feature => {
    const rect = feature.getBoundingClientRect();
    originalPositions.push({
      element: feature,
      left: rect.left + rect.width / 2,
      top: rect.top + rect.height / 2
    });
  });

  // Calculate center of the viewport
  const viewportCenter = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2
  };

  // Function to calculate orbit position with consistent circular formation
  function calculateOrbitPosition(index, progress, radius) {
    // Distribute features evenly around the circle
    const baseAngle = (index / features.length) * Math.PI * 2;

    // Allow for multiple rotations as you scroll
    // Complete 3 full rotations (6π radians) over the scroll distance
    const rotations = 3;
    const rotationAngle = progress * Math.PI * 2 * rotations;

    // Combine base angle with rotation angle
    // Keep the base angle to maintain formation (features stay in relative positions)
    const angle = baseAngle + rotationAngle;

    // Calculate position on the circle
    const x = viewportCenter.x + Math.cos(angle) * radius;
    const y = viewportCenter.y + Math.sin(angle) * radius;

    return { x, y };
  }

  // Function to update feature positions based on scroll
  function updateFeaturePositions() {
    // Skip animation if window was resized to mobile dimensions
    if (window.innerWidth < 768) {
      // Reset all features to their original positions
      features.forEach(feature => {
        feature.style.position = '';
        feature.style.left = '';
        feature.style.top = '';
        feature.style.transform = '';
        feature.style.opacity = '';
        feature.style.transition = '';
      });
      return; // Exit the function early
    }

    const rect = featuresSection.getBoundingClientRect();

    // Start animation when features section is approaching the top of the viewport
    // Start fixing when the section is 200px away from the top
    const featureNearTop = rect.top <= 200;

    if (featureNearTop) { // Start when features section is approaching the top
      // Calculate how far we've scrolled through the section
      // Define a specific scroll distance for the fade (777px as requested)
      const fadeScrollDistance = 777; // Exact pixel distance for the fade to complete

      // Calculate how far we've scrolled since the section became fixed
      const scrollY = window.scrollY;
      const fixPoint = scrollY - rect.top; // The point where section became fixed

      // Calculate scroll progress based on how far we've scrolled since fixing
      const scrolledSinceFix = Math.max(0, scrollY - fixPoint);
      const sectionProgress = Math.min(1, scrolledSinceFix / fadeScrollDistance);

      // Store the last known scroll position and progress to handle rapid scrolling
      if (!window.lastKnownScrollY) {
        window.lastKnownScrollY = scrollY;
        window.lastKnownProgress = sectionProgress;
      }

      // Calculate the maximum allowed progress change per frame
      // This limits how much the rotation can change in a single update
      const maxProgressChangePerFrame = 0.01; // Limit to 1% change per frame

      // Calculate the actual progress to use for rotation
      // This smooths out the rotation during rapid scrolling
      let rotationProgress;
      if (Math.abs(sectionProgress - window.lastKnownProgress) > maxProgressChangePerFrame) {
        // If scrolling too fast, limit the progress change
        rotationProgress = window.lastKnownProgress +
          (Math.sign(sectionProgress - window.lastKnownProgress) * maxProgressChangePerFrame);
      } else {
        // Otherwise use the actual progress
        rotationProgress = sectionProgress;
      }

      // Update the last known values
      window.lastKnownScrollY = scrollY;
      window.lastKnownProgress = rotationProgress;

      // Base radius for the orbit
      const baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.555;

      features.forEach((feature, index) => {
        // Apply orbit animation with varying degrees based on progress
        // Use the smoothed rotation progress for consistent rotation
        const orbitPosition = calculateOrbitPosition(index, rotationProgress, baseRadius);

        // Always use fixed positioning when the section is at the top
        // This ensures features are fixed as soon as the section reaches the top
        feature.style.position = 'fixed';
        feature.style.left = `${orbitPosition.x}px`;
        feature.style.top = `${orbitPosition.y}px`;
        feature.style.transform = 'translate(-50%, -50%)';

        // Fade out very gradually over the full 777px scroll distance
        feature.style.opacity = Math.max(0, 1 - sectionProgress);

        // Add transition for smooth movement - slower at beginning, faster at end
        const transitionSpeed = 0.3 + (sectionProgress * 0.2);
        feature.style.transition = `left ${transitionSpeed}s ease-out, top ${transitionSpeed}s ease-out, opacity 0.5s ease-out`;
      });
    } else {
      // Reset all features to original positions when not in view or before hero section
      features.forEach(feature => {
        feature.style.position = '';
        feature.style.left = '';
        feature.style.top = '';
        feature.style.transform = '';
        feature.style.opacity = '';
        feature.style.transition = '';
      });
    }
  }

  // Update on scroll - only add event listener if on desktop
  window.addEventListener('scroll', updateFeaturePositions);

  // Update on resize
  window.addEventListener('resize', function() {
    // If resized to mobile, reset features and remove scroll listener
    if (window.innerWidth < 768) {
      features.forEach(feature => {
        feature.style.position = '';
        feature.style.left = '';
        feature.style.top = '';
        feature.style.transform = '';
        feature.style.opacity = '';
        feature.style.transition = '';
      });
      return;
    }

    // Recalculate viewport center
    viewportCenter.x = window.innerWidth / 2;
    viewportCenter.y = window.innerHeight / 2;

    // Update positions
    updateFeaturePositions();
  });

  console.log('Features orbit animation initialized for desktop');
});
