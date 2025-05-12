/**
 * Simple Orbit Animation for Features Section
 * A completely rewritten, simpler approach to feature orbiting
 */

document.addEventListener('DOMContentLoaded', function() {
  // Get references to the main features section (not the team section)
  const featuresSection = document.querySelector('#features.features-section');
  const features = document.querySelectorAll('#features.features-section .feature');

  if (!featuresSection || features.length === 0) {
    console.log('Features section or features not found');
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

  // Animation parameters
  const FADE_DISTANCE = 777; // Exact pixel distance for the fade to complete
  const TRIGGER_OFFSET = 200; // Start animation when section is this many pixels from top
  const ROTATION_ANGLE_INCREMENT = 0.025; // How much to rotate per scroll pixel (in degrees) - reduced by half for slower rotation

  // Track animation state
  let isFixed = false;
  let rotationAngle = 0;
  let lastScrollY = 0;

  // Function to update feature positions based on scroll
  function updateFeaturePositions() {
    const rect = featuresSection.getBoundingClientRect();
    const scrollY = window.scrollY;

    // Determine if we should start the animation
    const shouldBeFixed = rect.top <= TRIGGER_OFFSET;

    // Calculate center of the viewport
    const viewportCenter = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };

    // Handle animation start/stop
    if (shouldBeFixed && !isFixed) {
      // Animation just started - initialize
      isFixed = true;
      lastScrollY = scrollY;
      rotationAngle = 0;
      console.log('Animation started');
    } else if (!shouldBeFixed && isFixed) {
      // Animation just ended - reset
      isFixed = false;
      console.log('Animation ended');
    }

    if (isFixed) {
      // Calculate fade progress
      const scrolledSinceFix = Math.max(0, scrollY - (window.pageYOffset + rect.top - TRIGGER_OFFSET));
      const fadeProgress = Math.min(1, scrolledSinceFix / FADE_DISTANCE);

      // Update rotation angle based on scroll change
      // This creates a consistent rotation regardless of scroll speed
      const scrollDelta = scrollY - lastScrollY;
      rotationAngle += scrollDelta * ROTATION_ANGLE_INCREMENT;
      lastScrollY = scrollY;

      // Calculate base radius - use a larger percentage of the viewport size
      const baseRadius = Math.min(window.innerWidth, window.innerHeight) * 0.35;

      // Make radius grow as you scroll - start at baseRadius and grow up to 4x
      const growthFactor = 1 + (fadeProgress * 3); // Grows from 1x to 4x as you scroll
      const radius = baseRadius * growthFactor;

      // Occasionally log debug info
      if (Math.random() < 0.01) {
        console.log(`Scrolled: ${scrolledSinceFix}px of ${FADE_DISTANCE}px (${(fadeProgress * 100).toFixed(1)}%)`);
        console.log(`Rotation angle: ${rotationAngle.toFixed(1)}°`);
        console.log(`Opacity: ${Math.max(0, 1 - fadeProgress).toFixed(2)}`);
        console.log(`Radius growth: ${growthFactor.toFixed(2)}x (${baseRadius.toFixed(0)}px → ${radius.toFixed(0)}px)`);
        console.log(`Spiral factor: ${(fadeProgress * 0.6).toFixed(2)} (${((fadeProgress * 0.6) * 180).toFixed(1)}° extra rotation)`);
      }

      // Update each feature
      features.forEach((feature, index) => {
        // Check if this is the "Expert AIs" feature
        const isExpertAI = feature.id === 'expertAi';

        if (isExpertAI) {
          // Keep "Expert AIs" in the center
          feature.style.position = 'fixed';
          feature.style.left = `${viewportCenter.x}px`;
          feature.style.top = `${viewportCenter.y}px`;

          // Calculate size expansion - grow from 1x to 2.5x as it fades
          const sizeGrowthFactor = 1 + (fadeProgress * 1.5);

          // Apply transform with both centering and scaling
          feature.style.transform = `translate(-50%, -50%) scale(${sizeGrowthFactor})`;

          // Apply fade
          feature.style.opacity = Math.max(0, 1 - fadeProgress);

          // Add transition for smooth movement and scaling
          feature.style.transition = 'opacity 0.5s linear, transform 0.5s ease-out';

          // Log expansion occasionally
          if (Math.random() < 0.005) {
            console.log(`Expert AI size: ${sizeGrowthFactor.toFixed(2)}x original`);
          }
        } else {
          // For all other features, calculate position on the circle
          // We need to distribute the non-center features evenly
          const totalOrbitingFeatures = features.length - 1;

          // Use a simpler approach - just use the index directly
          // This will create a small gap where the expertAi would be, but that's fine
          const orbitIndex = index;
          const baseAngle = (orbitIndex / totalOrbitingFeatures) * 360;
          const angle = (baseAngle + rotationAngle) * (Math.PI / 180); // Convert to radians

          // Calculate spiral path
          // As the radius grows, we'll also adjust the angle to create a spiral effect
          // Add a spiral factor that increases the angle as the radius grows
          const spiralFactor = fadeProgress * 0.6; // Controls how much the spiral "winds" - reduced for slower spiral
          const spiralAngle = angle + (spiralFactor * Math.PI); // Add extra rotation based on progress

          // Calculate position using the spiral angle
          const x = viewportCenter.x + Math.cos(spiralAngle) * radius;
          const y = viewportCenter.y + Math.sin(spiralAngle) * radius;

          // Apply position
          feature.style.position = 'fixed';
          feature.style.left = `${x}px`;
          feature.style.top = `${y}px`;
          feature.style.transform = 'translate(-50%, -50%)';

          // Apply fade
          feature.style.opacity = Math.max(0, 1 - fadeProgress);

          // Add transition for smooth movement
          feature.style.transition = 'left 0.2s ease-out, top 0.2s ease-out, opacity 0.5s linear';
        }
      });
    } else {
      // Reset all features to original positions
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

  // Update on scroll
  window.addEventListener('scroll', updateFeaturePositions);

  // Update on resize
  window.addEventListener('resize', updateFeaturePositions);

  // Initial update
  updateFeaturePositions();

  console.log('Features orbit animation initialized (simple version)');
});
