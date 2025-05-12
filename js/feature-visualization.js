// Feature Visualization JavaScript
// This file contains code for visualizing features on feature pages

document.addEventListener('DOMContentLoaded', function() {
  console.log('Feature visualization script loaded');

  // Add orbit animation keyframes
  addOrbitKeyframes();

  // Create orbital elements
  createOrbitalElements();
});

/**
 * Adds keyframe animation for orbiting elements
 */
function addOrbitKeyframes() {
  // Check if the keyframes already exist
  if (document.getElementById('orbit-keyframes')) return;

  // Create a style element for the keyframes
  const style = document.createElement('style');
  style.id = 'orbit-keyframes';

  // Define the keyframes
  const keyframes = `
    @keyframes orbit {
      0% {
        transform: translate(-50%, -50%) rotate(var(--start-angle)) translateX(var(--orbit-radius)) rotate(calc(-1 * var(--start-angle)));
      }
      100% {
        transform: translate(-50%, -50%) rotate(calc(var(--start-angle) + 360deg)) translateX(var(--orbit-radius)) rotate(calc(-1 * (var(--start-angle) + 360deg)));
      }
    }
  `;

  // Add the keyframes to the style element
  style.textContent = keyframes;

  // Add the style element to the head
  document.head.appendChild(style);

  console.log('Added orbit keyframes');
}

// Function to update orbital container position
function updateOrbitalPosition() {
  const orbitalContainer = document.getElementById('orbital-container');
  if (!orbitalContainer) return;

  const heroImageCircle = document.querySelector('.hero-image-circle');
  if (heroImageCircle) {
    const heroRect = heroImageCircle.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Position 100px below the hero image
    orbitalContainer.style.top = (heroRect.top + scrollTop + heroRect.height + 100) + 'px';
    console.log(`Updated orbital container position: ${heroRect.top + scrollTop + heroRect.height + 100}px from top`);
  }
}

// Wait for window to fully load before initializing animations
window.addEventListener('load', function() {
  console.log('Window loaded, initializing orbital elements');

  // Check if we're on mobile - if so, don't initialize orbital elements
  if (window.innerWidth < 768) {
    console.log('Mobile view detected, skipping orbital elements initialization');
    return;
  }

  // Check if we're on the AutoRAG page - if so, remove any existing orbital elements
  if (window.location.pathname.includes('/features/data-management/autorag')) {
    cleanupOrbitalElements();
    console.log('Cleaned up orbital elements on AutoRAG page');
    return;
  }

  // Initialize orbital animations after window is fully loaded
  initOrbitalElements();

  // Add debug button
  addDebugButton();

  // Update position on resize
  window.addEventListener('resize', updateOrbitalPosition);

  // Update position on scroll
  window.addEventListener('scroll', function() {
    // Use requestAnimationFrame to limit updates during scroll
    requestAnimationFrame(updateOrbitalPosition);
  });
});

/**
 * Cleans up any orbital elements that might have been created inappropriately
 */
function cleanupOrbitalElements() {
  // Remove orbital container if it exists
  const orbitalContainer = document.getElementById('orbital-container');
  if (orbitalContainer) {
    orbitalContainer.remove();
    console.log('Removed existing orbital container');
  }

  // Remove any orbital elements directly in the document
  const orbitalElements = document.querySelectorAll('.orbital-element');
  orbitalElements.forEach(element => {
    // Don't remove orbital elements that are part of the page structure (like in AutoRAG)
    if (!element.closest('.feature-hero')) {
      element.remove();
      console.log('Removed orbital element');
    } else {
      console.log('Preserved page structure orbital element');
    }
  });

  // Remove any existing orbital elements that might have been added directly to the page
  const inlineOrbitalElements = document.querySelectorAll('.feature-hero > .orbital-element:not([style*="--orbit"])');
  if (inlineOrbitalElements.length > 0) {
    console.log(`Removing ${inlineOrbitalElements.length} inline orbital elements`);
    inlineOrbitalElements.forEach(element => element.remove());
  }
}

/**
 * Placeholder for future debugging functionality if needed
 * Debug button removed as requested
 */
function addDebugButton() {
  // Debug button removed
  console.log('Debug functionality disabled');
}

/**
 * Creates orbital elements in the hero section
 */
function createOrbitalElements() {
  console.log('Creating orbital elements');

  // First, check if we're on a feature page
  if (!document.querySelector('.feature-hero')) {
    console.log('Not on a feature page, skipping orbital elements');
    return;
  }

  // Skip if we're on mobile
  if (window.innerWidth < 768) {
    console.log('On mobile, skipping orbital creation for performance');
    return;
  }

  // Skip if we're on the AutoRAG page to prevent conflicts with the benefits-circle layout
  if (window.location.pathname.includes('/features/data-management/autorag')) {
    console.log('On AutoRAG page, skipping orbital creation to prevent conflicts');
    return;
  }

  // Create a direct container in the body for maximum visibility
  let orbitalContainer = document.getElementById('orbital-container');

  // Remove any existing container to avoid duplicates
  if (orbitalContainer) {
    orbitalContainer.remove();
  }

  // Create a new container
  orbitalContainer = document.createElement('div');
  orbitalContainer.id = 'orbital-container';

  // Find the hero image circle to position the orbitals around it
  const heroImageCircle = document.querySelector('.hero-image-circle');

  // Style the container to position it relative to the hero image
  if (heroImageCircle) {
    // Get the position of the hero image circle
    const heroRect = heroImageCircle.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    // Position the container below the hero image circle
    orbitalContainer.style.position = 'absolute';
    orbitalContainer.style.top = (heroRect.top + scrollTop + heroRect.height + 100) + 'px'; // Position 100px below the hero image
    orbitalContainer.style.left = '0';
    orbitalContainer.style.width = '100%';
    orbitalContainer.style.height = '700px'; // Increased height for better visibility
    orbitalContainer.style.overflow = 'visible';
    orbitalContainer.style.zIndex = '1';

    // Allow pointer events for interactive elements
    orbitalContainer.style.pointerEvents = 'auto';

    console.log(`Positioned orbital container below hero image: ${heroRect.top + scrollTop + heroRect.height + 100}px from top`);
  } else {
    // Fallback if hero image circle not found
    orbitalContainer.style.position = 'absolute';
    orbitalContainer.style.top = '700px'; // Position much lower on the page
    orbitalContainer.style.left = '0';
    orbitalContainer.style.width = '100%';
    orbitalContainer.style.height = '700px'; // Increased height for better visibility
    orbitalContainer.style.overflow = 'visible';
    orbitalContainer.style.zIndex = '1';

    // Allow pointer events for interactive elements
    orbitalContainer.style.pointerEvents = 'auto';

    console.log('Hero image circle not found, using fallback position');
  }

  // Add the container to the body
  document.body.appendChild(orbitalContainer);

  // Define emoji mapping for orbital elements
  const orbitalEmojis = [
    "💡", // Innovative AI solutions
    "🚀", // Accelerate your AI projects
    "🔍", // Discover new AI capabilities
    "📈", // Scale your AI operations
    "🔗"  // Connect your AI ecosystem
  ];

  // Special case for AutoRAG page
  if (window.location.pathname.includes('/features/data-management/autorag')) {
    orbitalEmojis[0] = "📚"; // Knowledge sources
    orbitalEmojis[1] = "🔍"; // Search & retrieval
    orbitalEmojis[2] = "💾"; // Data storage
    orbitalEmojis[3] = "🧠"; // AI processing
    orbitalEmojis[4] = "🤖"; // Automation
  }

  // Define orbital feature themes
  const orbitalThemes = [
    "Innovative AI",
    "Accelerate",
    "Discover",
    "Scale",
    "Connect"
  ];

  // Special case for AutoRAG page
  if (window.location.pathname.includes('/features/data-management/autorag')) {
    orbitalThemes[0] = "Knowledge Sources";
    orbitalThemes[1] = "Search & Retrieval";
    orbitalThemes[2] = "Data Storage";
    orbitalThemes[3] = "AI Processing";
    orbitalThemes[4] = "Automation";
  }

  // Create 5 orbital elements
  for (let i = 0; i < 5; i++) {
    const orbitalElement = document.createElement('div');
    orbitalElement.className = 'orbital-element';
    orbitalElement.id = `orbital-${i+1}`;

    // Style the orbital element - larger and more visible
    orbitalElement.style.position = 'absolute';
    orbitalElement.style.width = '100px';
    orbitalElement.style.height = '100px';
    orbitalElement.style.borderRadius = '50%';
    orbitalElement.style.backgroundColor = 'rgba(92, 226, 231, 0.2)';
    orbitalElement.style.border = '2px solid rgba(92, 226, 231, 0.3)';
    orbitalElement.style.boxShadow = '0 0 20px rgba(92, 226, 231, 0.2)';
    orbitalElement.style.display = 'flex';
    orbitalElement.style.alignItems = 'center';
    orbitalElement.style.justifyContent = 'center';
    orbitalElement.style.top = '50%';
    orbitalElement.style.left = '50%';
    orbitalElement.style.transform = 'translate(-50%, -50%)';

    // Make elements interactive
    orbitalElement.style.cursor = 'pointer';
    orbitalElement.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease, background-color 0.3s ease';

    // Add hover effects
    orbitalElement.addEventListener('mouseenter', function() {
      this.style.transform = 'translate(-50%, -50%) scale(1.1)';
      this.style.boxShadow = '0 0 30px rgba(92, 226, 231, 0.4)';
      this.style.backgroundColor = 'rgba(92, 226, 231, 0.3)';
    });

    orbitalElement.addEventListener('mouseleave', function() {
      this.style.transform = 'translate(-50%, -50%)';
      this.style.boxShadow = '0 0 20px rgba(92, 226, 231, 0.2)';
      this.style.backgroundColor = 'rgba(92, 226, 231, 0.2)';
    });

    // Add inner circle - larger and more visible
    const innerCircle = document.createElement('div');
    innerCircle.className = 'orbital-inner-circle';
    innerCircle.style.width = '24px';
    innerCircle.style.height = '24px';
    innerCircle.style.borderRadius = '50%';
    innerCircle.style.backgroundColor = 'rgba(92, 226, 231, 0.8)';
    innerCircle.style.boxShadow = '0 0 15px rgba(92, 226, 231, 0.6)';

    // Add content with emoji
    const content = document.createElement('div');
    content.className = 'orbital-content';
    content.style.position = 'absolute';
    content.style.width = '100%';
    content.style.height = '100%';
    content.style.display = 'flex';
    content.style.alignItems = 'center';
    content.style.justifyContent = 'center';
    content.style.color = 'rgba(92, 226, 231, 0.9)';
    content.style.fontSize = '24px'; // Increased font size for emoji
    content.style.fontFamily = '"Outfit", sans-serif';
    content.style.fontWeight = '600';
    content.innerHTML = `<span>${orbitalEmojis[i]}</span>`;

    // Add a hidden theme text (for accessibility and SEO)
    const themeText = document.createElement('span');
    themeText.style.position = 'absolute';
    themeText.style.width = '1px';
    themeText.style.height = '1px';
    themeText.style.overflow = 'hidden';
    themeText.style.clip = 'rect(0, 0, 0, 0)';
    themeText.textContent = orbitalThemes[i];
    content.appendChild(themeText);

    // Add elements to the DOM
    orbitalElement.appendChild(innerCircle);
    orbitalElement.appendChild(content);
    orbitalContainer.appendChild(orbitalElement);

    console.log(`Created orbital element ${i+1} with emoji ${orbitalEmojis[i]}`);
  }
}

/**
 * Initializes orbital animations for elements
 */
function initOrbitalElements() {
  console.log('Initializing orbital animations');

  // Skip if we're on mobile
  if (window.innerWidth < 768) {
    console.log('On mobile, skipping orbital animations for performance');
    return;
  }

  // Skip if we're on the AutoRAG page to prevent conflicts with the benefits-circle layout
  if (window.location.pathname.includes('/features/data-management/autorag')) {
    console.log('On AutoRAG page, skipping orbital initialization to prevent conflicts');
    return;
  }

  // First, make sure we have orbital elements
  if (document.querySelectorAll('.orbital-element').length === 0) {
    console.log('No orbital elements found, creating them now');
    createOrbitalElements();
  }

  const orbitalElements = document.querySelectorAll('.orbital-element');
  console.log(`Found ${orbitalElements.length} orbital elements`);

  // Get the orbital container
  const orbitalContainer = document.getElementById('orbital-container');
  if (!orbitalContainer) {
    console.error('Orbital container not found');
    return;
  }

  // Create a custom animation style with larger orbit radius
  const styleElement = document.createElement('style');
  styleElement.textContent = `
    @keyframes customOrbit1 {
      0% { transform: translate(-50%, -50%) rotate(0deg) translateY(250px) rotate(0deg); }
      100% { transform: translate(-50%, -50%) rotate(360deg) translateY(250px) rotate(-360deg); }
    }
    @keyframes customOrbit2 {
      0% { transform: translate(-50%, -50%) rotate(72deg) translateY(300px) rotate(-72deg); }
      100% { transform: translate(-50%, -50%) rotate(432deg) translateY(300px) rotate(-432deg); }
    }
    @keyframes customOrbit3 {
      0% { transform: translate(-50%, -50%) rotate(144deg) translateY(350px) rotate(-144deg); }
      100% { transform: translate(-50%, -50%) rotate(504deg) translateY(350px) rotate(-504deg); }
    }
    @keyframes customOrbit4 {
      0% { transform: translate(-50%, -50%) rotate(216deg) translateY(400px) rotate(-216deg); }
      100% { transform: translate(-50%, -50%) rotate(576deg) translateY(400px) rotate(-576deg); }
    }
    @keyframes customOrbit5 {
      0% { transform: translate(-50%, -50%) rotate(288deg) translateY(450px) rotate(-288deg); }
      100% { transform: translate(-50%, -50%) rotate(648deg) translateY(450px) rotate(-648deg); }
    }
  `;
  document.head.appendChild(styleElement);

  // Create a center point for the orbits
  let centerPoint = document.getElementById('orbit-center-point');
  if (!centerPoint) {
    centerPoint = document.createElement('div');
    centerPoint.id = 'orbit-center-point';
    centerPoint.style.position = 'absolute';
    centerPoint.style.left = '50%';
    centerPoint.style.top = '50%';
    centerPoint.style.width = '20px';
    centerPoint.style.height = '20px';
    centerPoint.style.borderRadius = '50%';
    centerPoint.style.backgroundColor = 'rgba(92, 226, 231, 0.7)';
    centerPoint.style.boxShadow = '0 0 15px rgba(92, 226, 231, 0.5)';
    centerPoint.style.transform = 'translate(-50%, -50%)';
    centerPoint.style.zIndex = '10';
    orbitalContainer.appendChild(centerPoint);

    // Add a pulsing animation to the center point
    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
      @keyframes pulse {
        0% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
        50% { transform: translate(-50%, -50%) scale(1.2); opacity: 0.9; }
        100% { transform: translate(-50%, -50%) scale(1); opacity: 0.7; }
      }
    `;
    document.head.appendChild(pulseStyle);

    centerPoint.style.animation = 'pulse 3s ease-in-out infinite';
  }

  // Position the orbital elements around the center point
  orbitalElements.forEach((element, index) => {
    // Calculate orbit parameters - using larger radius values
    const orbitRadius = 220 + (index * 40); // Larger radius for bigger orbits
    const orbitDuration = 30 + (index * 10); // Slower orbits for more graceful movement
    const startAngle = (index * 72) % 360; // Distribute evenly (360/5 = 72 degrees apart)

    // Make sure the element is visible
    element.style.opacity = '1';
    element.style.visibility = 'visible';
    element.style.display = 'flex';

    // Make elements larger
    element.style.width = '100px';
    element.style.height = '100px';

    // Position the element relative to the center point
    element.style.position = 'absolute';
    element.style.left = '50%';
    element.style.top = '50%';

    // Set initial position
    const angle = startAngle * (Math.PI / 180);
    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius;
    element.style.transform = `translate(-50%, -50%) rotate(${startAngle}deg) translateY(${orbitRadius}px) rotate(-${startAngle}deg)`;

    // Add animation with custom keyframes for each element
    element.style.animation = `customOrbit${index + 1} ${orbitDuration}s linear infinite`;

    console.log(`Initialized orbital element ${index+1} with radius ${orbitRadius}px and duration ${orbitDuration}s`);
  });
}
