// Function to generate a line-based flower of life pattern for the features section
function generateFeaturesFlowerOfLife() {
  const featuresSection = document.querySelector(".features-section");

  // Check if the SVG element already exists, if not create it
  let svgElement = document.getElementById("features-flower-of-life");
  if (!svgElement) {
    svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.id = "features-flower-of-life";
    svgElement.classList.add("features-flower-of-life");
    svgElement.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Add the SVG to the sacred-geometry-overlay
    const sacredGeometryOverlay = document.querySelector(".sacred-geometry-overlay");
    if (sacredGeometryOverlay) {
      sacredGeometryOverlay.appendChild(svgElement);
    } else {
      featuresSection.appendChild(svgElement);
    }
  }

  if (featuresSection && svgElement) {
    const sectionWidth = featuresSection.offsetWidth;
    const sectionHeight = featuresSection.offsetHeight;

    // Set SVG dimensions
    svgElement.setAttribute("width", "100%");
    svgElement.setAttribute("height", "100%");
    svgElement.setAttribute("viewBox", `0 0 ${sectionWidth} ${sectionHeight}`);
    svgElement.setAttribute("style", "z-index: 3; position: absolute; top: 0; left: 0;");

    // Clear previous SVG content
    svgElement.innerHTML = "";

    // Create a filter for the glow effect
    const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
    filter.setAttribute("id", "line-glow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("stdDeviation", "2");
    feGaussianBlur.setAttribute("result", "blur");

    const feColorMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
    feColorMatrix.setAttribute("in", "blur");
    feColorMatrix.setAttribute("type", "matrix");
    feColorMatrix.setAttribute("values", "0 0 0 0 0 0 0 0 0 0.8 0 0 0 0 1 0 0 0 0.9 0");

    filter.appendChild(feGaussianBlur);
    filter.appendChild(feColorMatrix);
    svgElement.appendChild(filter);

    // Calculate dimensions for the flower of life pattern
    const centerX = sectionWidth / 2;
    const centerY = sectionHeight / 2;
    const baseRadius = Math.max(sectionWidth, sectionHeight) * 0.25; // Larger base radius to cover the entire screen

    // Create a group for all the circles
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("filter", "url(#line-glow)");
    group.setAttribute("style", "z-index: 3;");
    svgElement.appendChild(group);

    // Draw the central circle
    createCircleOutline(group, centerX, centerY, baseRadius);

    // Draw the first ring of 6 circles
    const firstRingRadius = baseRadius;
    const firstRingAngles = [0, 60, 120, 180, 240, 300]; // Angles for hexagonal pattern

    firstRingAngles.forEach(angle => {
      const rad = (Math.PI * angle) / 180;
      const cx = centerX + firstRingRadius * Math.cos(rad);
      const cy = centerY + firstRingRadius * Math.sin(rad);
      createCircleOutline(group, cx, cy, baseRadius);
    });

    // Draw the second ring (intersections of first ring)
    const secondRingRadius = baseRadius * 1.73; // √3 * baseRadius
    const secondRingAngles = [30, 90, 150, 210, 270, 330];

    secondRingAngles.forEach(angle => {
      const rad = (Math.PI * angle) / 180;
      const cx = centerX + secondRingRadius * Math.cos(rad);
      const cy = centerY + secondRingRadius * Math.sin(rad);
      createCircleOutline(group, cx, cy, baseRadius);
    });

    // Draw the third ring
    const thirdRingRadius = baseRadius * 2;
    const thirdRingAngles = [];
    for (let i = 0; i < 12; i++) {
      thirdRingAngles.push(i * 30);
    }

    thirdRingAngles.forEach(angle => {
      const rad = (Math.PI * angle) / 180;
      const cx = centerX + thirdRingRadius * Math.cos(rad);
      const cy = centerY + thirdRingRadius * Math.sin(rad);
      createCircleOutline(group, cx, cy, baseRadius);
    });

    // Add some additional circles for a more complete pattern
    const fourthRingRadius = baseRadius * 2.65;
    const fourthRingAngles = [];
    for (let i = 0; i < 12; i++) {
      fourthRingAngles.push(i * 30 + 15);
    }

    fourthRingAngles.forEach(angle => {
      const rad = (Math.PI * angle) / 180;
      const cx = centerX + fourthRingRadius * Math.cos(rad);
      const cy = centerY + fourthRingRadius * Math.sin(rad);
      createCircleOutline(group, cx, cy, baseRadius);
    });

    // Add a fifth ring for even more coverage
    const fifthRingRadius = baseRadius * 3.3;
    const fifthRingAngles = [];
    for (let i = 0; i < 18; i++) {
      fifthRingAngles.push(i * 20);
    }

    fifthRingAngles.forEach(angle => {
      const rad = (Math.PI * angle) / 180;
      const cx = centerX + fifthRingRadius * Math.cos(rad);
      const cy = centerY + fifthRingRadius * Math.sin(rad);
      createCircleOutline(group, cx, cy, baseRadius);
    });

    // Add a sixth ring for complete coverage
    const sixthRingRadius = baseRadius * 4;
    const sixthRingAngles = [];
    for (let i = 0; i < 24; i++) {
      sixthRingAngles.push(i * 15 + 7.5);
    }

    sixthRingAngles.forEach(angle => {
      const rad = (Math.PI * angle) / 180;
      const cx = centerX + sixthRingRadius * Math.cos(rad);
      const cy = centerY + sixthRingRadius * Math.sin(rad);
      createCircleOutline(group, cx, cy, baseRadius);
    });
  }
}

// Helper function to create a circle outline (just the stroke, no fill)
function createCircleOutline(parent, cx, cy, r) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("stroke", "rgba(0, 200, 255, 0.2)");
  circle.setAttribute("stroke-width", "0.5");
  circle.setAttribute("fill", "none");

  // Add a random animation delay for a more dynamic effect
  const animDelay = Math.random() * 5;
  circle.setAttribute("style", `animation-delay: ${animDelay}s; stroke-opacity: 0.2;`);
  parent.appendChild(circle);
}

// Call this function on page load and window resize
document.addEventListener("DOMContentLoaded", function() {
  console.log("Generating features flower of life");
  generateFeaturesFlowerOfLife();

  // Force another call after a delay to ensure it runs
  setTimeout(() => {
    console.log("Forcing another call to generateFeaturesFlowerOfLife");
    generateFeaturesFlowerOfLife();

    // Check if the SVG was created
    const svg = document.getElementById("features-flower-of-life");
    if (svg) {
      console.log("Features flower of life SVG created successfully");
      console.log("SVG dimensions:", {
        width: svg.getAttribute("width"),
        height: svg.getAttribute("height"),
        viewBox: svg.getAttribute("viewBox")
      });
      console.log("Number of circles:", svg.querySelectorAll("circle").length);
    } else {
      console.log("Failed to create features flower of life SVG");
    }
  }, 1000);
});

window.addEventListener("resize", generateFeaturesFlowerOfLife);
