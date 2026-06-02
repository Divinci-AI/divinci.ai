// Debug script to check sacred geometry connections
document.addEventListener('DOMContentLoaded', function() {
  console.log('Debug script loaded');

  // Check if the features section exists
  const featuresSection = document.querySelector('.features-section');
  console.log('Features section:', featuresSection);

  // Check if the sacred geometry overlay exists
  const sacredGeometryOverlay = document.querySelector('.sacred-geometry-overlay');
  console.log('Sacred geometry overlay:', sacredGeometryOverlay);

  // Check if the connection lines container exists
  const connectionLinesContainer = document.getElementById('connectionLines');
  console.log('Connection lines container:', connectionLinesContainer);

  // Check if the sacred orbit connections container exists
  const sacredOrbitConnections = document.getElementById('sacredOrbitConnections');
  console.log('Sacred orbit connections container:', sacredOrbitConnections);

  // Check if the geometry groups exist
  const geometryGroup = document.querySelector('.geometry-group');
  const geometryGroupOuter1 = document.querySelector('.geometry-group-outer1');
  const geometryGroupOuter2 = document.querySelector('.geometry-group-outer2');
  console.log('Geometry groups:', {
    geometryGroup,
    geometryGroupOuter1,
    geometryGroupOuter2
  });

  // Check if circles exist in each group
  if (geometryGroup) {
    const circles = geometryGroup.querySelectorAll('.circle');
    console.log('Circles in geometry-group:', circles.length);
  }

  if (geometryGroupOuter1) {
    const circles = geometryGroupOuter1.querySelectorAll('.circle');
    console.log('Circles in geometry-group-outer1:', circles.length);
  }

  if (geometryGroupOuter2) {
    const circles = geometryGroupOuter2.querySelectorAll('.circle');
    console.log('Circles in geometry-group-outer2:', circles.length);
  }

  // Check if the createSacredGeometryConnections function exists
  if (typeof createSacredGeometryConnections === 'function') {
    console.log('createSacredGeometryConnections function exists');

    // Call the function to create connections
    createSacredGeometryConnections();

    // Force another call after a delay to ensure it runs
    setTimeout(() => {
      console.log('Forcing another call to createSacredGeometryConnections');
      createSacredGeometryConnections();

      // Check if connections were created
      const connections = document.querySelectorAll('.sacred-orbit-connection');
      console.log('Sacred orbit connections created:', connections.length);

      // Log the style of each connection
      connections.forEach((connection, index) => {
        if (index < 5) { // Log only the first 5 to avoid console spam
          console.log(`Connection ${index} style:`, {
            width: connection.style.width,
            left: connection.style.left,
            top: connection.style.top,
            transform: connection.style.transform,
            zIndex: connection.style.zIndex || 'inherited',
            opacity: connection.style.opacity || 'inherited'
          });
        }
      });

      // Force connections to be visible
      connections.forEach(connection => {
        connection.style.zIndex = '4';
        connection.style.opacity = '1';
        connection.style.display = 'block';
      });
    }, 1000);
  } else {
    console.log('createSacredGeometryConnections function does NOT exist');
  }

  // Check CSS properties
  const checkCSSProperty = (selector, property) => {
    const element = document.querySelector(selector);
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      console.log(`${selector} ${property}:`, computedStyle.getPropertyValue(property));
    } else {
      console.log(`${selector} not found`);
    }
  };

  checkCSSProperty('.sacred-orbit-connection', 'z-index');
  checkCSSProperty('.sacred-orbit-connection', 'opacity');
  checkCSSProperty('.connection-lines-container', 'z-index');
  checkCSSProperty('.sacred-geometry-overlay', 'z-index');
  checkCSSProperty('.gradient-background', 'z-index');
  checkCSSProperty('.feature', 'z-index');
});
