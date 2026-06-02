// Function to generate an enhanced sacred geometry pattern inspired by the Tree of Life
function generateTreeOfLife() {
  const featuresSection = document.querySelector(".features-section");

  // Check if the SVG element already exists, if not create it
  let svgElement = document.getElementById("tree-of-life");
  if (!svgElement) {
    svgElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgElement.id = "tree-of-life";
    svgElement.classList.add("tree-of-life");
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
    filter.setAttribute("id", "tree-glow");
    filter.setAttribute("x", "-50%");
    filter.setAttribute("y", "-50%");
    filter.setAttribute("width", "200%");
    filter.setAttribute("height", "200%");

    const feGaussianBlur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
    feGaussianBlur.setAttribute("stdDeviation", "2.5");
    feGaussianBlur.setAttribute("result", "blur");

    const feColorMatrix = document.createElementNS("http://www.w3.org/2000/svg", "feColorMatrix");
    feColorMatrix.setAttribute("in", "blur");
    feColorMatrix.setAttribute("type", "matrix");
    feColorMatrix.setAttribute("values", "0 0 0 0 0 0 0 0 0 0.9 0 0 0 0 1 0 0 0 1 0");

    filter.appendChild(feGaussianBlur);
    filter.appendChild(feColorMatrix);
    svgElement.appendChild(filter);

    // Calculate dimensions for the pattern
    const centerX = sectionWidth / 2;
    const centerY = sectionHeight / 2;
    const scale = Math.min(sectionWidth, sectionHeight) * 0.45; // Scale factor for the pattern

    // Create a group for all the elements
    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.setAttribute("filter", "url(#tree-glow)");
    group.setAttribute("style", "z-index: 3;");
    svgElement.appendChild(group);

    // Create the Metatron's Cube base (which contains the Tree of Life)
    // First, create the 13 circles of Metatron's Cube
    const metatronCircles = [];

    // Center circle
    metatronCircles.push({ x: centerX, y: centerY });

    // Inner ring of 6 circles
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * scale * 0.5;
      const y = centerY + Math.sin(angle) * scale * 0.5;
      metatronCircles.push({ x, y });
    }

    // Outer ring of 6 circles
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60 + 30) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * scale * 0.866; // √3/2
      const y = centerY + Math.sin(angle) * scale * 0.866;
      metatronCircles.push({ x, y });
    }

    // Draw all 13 circles
    metatronCircles.forEach((circle, index) => {
      const size = index === 0 ? scale * 0.3 : scale * 0.25;
      createCircleOutline(group, circle.x, circle.y, size);
    });

    // Connect all circles to form Metatron's Cube
    for (let i = 0; i < metatronCircles.length; i++) {
      for (let j = i + 1; j < metatronCircles.length; j++) {
        createPath(group, metatronCircles[i].x, metatronCircles[i].y, metatronCircles[j].x, metatronCircles[j].y);
      }
    }

    // Now overlay the Tree of Life pattern
    // Define the positions of the 10 Sephirot (nodes) in the Tree of Life
    const sephirot = [
      { name: "Keter", x: 0.5, y: 0.05 },      // Crown
      { name: "Chokmah", x: 0.25, y: 0.15 },   // Wisdom
      { name: "Binah", x: 0.75, y: 0.15 },     // Understanding
      { name: "Chesed", x: 0.25, y: 0.35 },    // Mercy
      { name: "Geburah", x: 0.75, y: 0.35 },   // Severity
      { name: "Tiferet", x: 0.5, y: 0.45 },    // Beauty
      { name: "Netzach", x: 0.25, y: 0.65 },   // Victory
      { name: "Hod", x: 0.75, y: 0.65 },       // Splendor
      { name: "Yesod", x: 0.5, y: 0.75 },      // Foundation
      { name: "Malkuth", x: 0.5, y: 0.95 }     // Kingdom
    ];

    // Scale the coordinates to fit the section
    const scaledSephirot = sephirot.map(s => ({
      name: s.name,
      x: centerX + (s.x - 0.5) * scale * 1.8,
      y: centerY + (s.y - 0.5) * scale * 2.2
    }));

    // Define the connections between Sephirot (the 22 paths)
    const paths = [
      [0, 1], [0, 2], [1, 2], // Top triangle
      [1, 3], [2, 4], [3, 4], // Second triangle
      [3, 6], [4, 7], [6, 7], // Third triangle
      [6, 9], [7, 9], // Bottom connections
      [0, 5], [1, 5], [2, 5], // Connections to Tiferet from top
      [3, 5], [4, 5], // Connections to Tiferet from middle
      [5, 6], [5, 7], [5, 8], // Connections from Tiferet down
      [8, 6], [8, 7], [8, 9]  // Connections to Malkuth
    ];

    // Draw the paths (connections) with enhanced styling
    paths.forEach(path => {
      const start = scaledSephirot[path[0]];
      const end = scaledSephirot[path[1]];
      createEnhancedPath(group, start.x, start.y, end.x, end.y);
    });

    // Draw the Sephirot (nodes) with enhanced styling
    scaledSephirot.forEach((sephira, index) => {
      // Different sizes for different levels of the tree
      let nodeSize;
      if (index === 0) nodeSize = scale * 0.1; // Keter
      else if (index === 9) nodeSize = scale * 0.1; // Malkuth
      else if (index === 5) nodeSize = scale * 0.09; // Tiferet
      else nodeSize = scale * 0.08; // Others

      createEnhancedCircle(group, sephira.x, sephira.y, nodeSize);

      // Add a smaller inner circle for each Sephirot
      createCircleOutline(group, sephira.x, sephira.y, nodeSize * 0.6);
    });

    // Add the Flower of Life pattern in the background
    const flowerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    flowerGroup.classList.add("flower-element");
    group.appendChild(flowerGroup);

    // Create the central circle of the Flower of Life
    createFlowerElement(flowerGroup, centerX, centerY, scale * 0.2);

    // Create the first ring of 6 circles
    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * scale * 0.4;
      const y = centerY + Math.sin(angle) * scale * 0.4;
      createFlowerElement(flowerGroup, x, y, scale * 0.2);
    }

    // Create the second ring of 12 circles
    for (let i = 0; i < 12; i++) {
      const angle = (i * 30) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * scale * 0.8;
      const y = centerY + Math.sin(angle) * scale * 0.8;
      createFlowerElement(flowerGroup, x, y, scale * 0.2);
    }

    // Add the Seed of Life pattern (7 overlapping circles)
    const seedGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    seedGroup.classList.add("seed-element");
    group.appendChild(seedGroup);

    // Create the 7 circles of the Seed of Life
    createSeedElement(seedGroup, centerX, centerY, scale * 0.4); // Center circle

    for (let i = 0; i < 6; i++) {
      const angle = (i * 60) * Math.PI / 180;
      const x = centerX + Math.cos(angle) * scale * 0.4;
      const y = centerY + Math.sin(angle) * scale * 0.4;
      createSeedElement(seedGroup, x, y, scale * 0.4);
    }

    // Add the Sri Yantra triangles
    const yantraGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    yantraGroup.classList.add("yantra-element");
    group.appendChild(yantraGroup);

    // Create 9 interlocking triangles (4 pointing up, 5 pointing down)
    const triangleSize = scale * 1.2;

    // Downward-pointing triangles
    for (let i = 0; i < 5; i++) {
      const points = [
        { x: centerX, y: centerY - triangleSize * 0.5 + i * triangleSize * 0.1 },
        { x: centerX - triangleSize * 0.5 + i * triangleSize * 0.1, y: centerY + triangleSize * 0.4 - i * triangleSize * 0.1 },
        { x: centerX + triangleSize * 0.5 - i * triangleSize * 0.1, y: centerY + triangleSize * 0.4 - i * triangleSize * 0.1 }
      ];
      createTriangle(yantraGroup, points);
    }

    // Upward-pointing triangles
    for (let i = 0; i < 4; i++) {
      const points = [
        { x: centerX, y: centerY + triangleSize * 0.4 - i * triangleSize * 0.1 },
        { x: centerX - triangleSize * 0.45 + i * triangleSize * 0.1, y: centerY - triangleSize * 0.3 + i * triangleSize * 0.1 },
        { x: centerX + triangleSize * 0.45 - i * triangleSize * 0.1, y: centerY - triangleSize * 0.3 + i * triangleSize * 0.1 }
      ];
      createTriangle(yantraGroup, points);
    }

    // Add outer circles for visual effect
    for (let i = 1; i <= 5; i++) {
      createCircleOutline(group, centerX, centerY, scale * (0.5 + i * 0.3));
    }

    // Add the Vesica Piscis (two overlapping circles)
    const vesicaGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    vesicaGroup.classList.add("vesica-element");
    group.appendChild(vesicaGroup);

    createCircleOutline(vesicaGroup, centerX - scale * 0.3, centerY, scale * 0.6);
    createCircleOutline(vesicaGroup, centerX + scale * 0.3, centerY, scale * 0.6);
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
  circle.setAttribute("stroke", "rgba(0, 200, 255, 0.4)");
  circle.setAttribute("stroke-width", "0.7");
  circle.setAttribute("fill", "none");

  // Add a random animation delay for a more dynamic effect
  const animDelay = Math.random() * 8;
  circle.setAttribute("style", `animation-delay: ${animDelay}s; stroke-opacity: 0.4;`);
  parent.appendChild(circle);
}

// Helper function to create an enhanced circle with more visible styling
function createEnhancedCircle(parent, cx, cy, r) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("stroke", "rgba(0, 220, 255, 0.6)");
  circle.setAttribute("stroke-width", "1.2");
  circle.setAttribute("fill", "none");

  // Add a random animation delay for a more dynamic effect
  const animDelay = Math.random() * 6;
  circle.setAttribute("style", `animation-delay: ${animDelay}s; stroke-opacity: 0.6;`);
  parent.appendChild(circle);
}

// Helper function to create a path between two points
function createPath(parent, x1, y1, x2, y2) {
  const path = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  path.setAttribute("x1", x1);
  path.setAttribute("y1", y1);
  path.setAttribute("x2", x2);
  path.setAttribute("y2", y2);
  path.setAttribute("stroke", "rgba(0, 200, 255, 0.35)");
  path.setAttribute("stroke-width", "0.6");

  // Add a random animation delay for a more dynamic effect
  const animDelay = Math.random() * 10;
  path.setAttribute("style", `animation-delay: ${animDelay}s; stroke-opacity: 0.35;`);
  parent.appendChild(path);
}

// Helper function to create an enhanced path with more visible styling
function createEnhancedPath(parent, x1, y1, x2, y2) {
  const path = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "line"
  );
  path.setAttribute("x1", x1);
  path.setAttribute("y1", y1);
  path.setAttribute("x2", x2);
  path.setAttribute("y2", y2);
  path.setAttribute("stroke", "rgba(0, 220, 255, 0.5)");
  path.setAttribute("stroke-width", "1.0");

  // Add a random animation delay for a more dynamic effect
  const animDelay = Math.random() * 8;
  path.setAttribute("style", `animation-delay: ${animDelay}s; stroke-opacity: 0.5;`);
  parent.appendChild(path);
}

// Helper function to create a flower of life element
function createFlowerElement(parent, cx, cy, r) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("stroke", "rgba(0, 180, 255, 0.3)");
  circle.setAttribute("stroke-width", "0.5");
  circle.setAttribute("fill", "none");

  // Add a random animation delay for a more dynamic effect
  const animDelay = Math.random() * 12;
  circle.setAttribute("style", `animation-delay: ${animDelay}s; stroke-opacity: 0.3;`);
  parent.appendChild(circle);
}

// Helper function to create a seed of life element
function createSeedElement(parent, cx, cy, r) {
  const circle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "circle"
  );
  circle.setAttribute("cx", cx);
  circle.setAttribute("cy", cy);
  circle.setAttribute("r", r);
  circle.setAttribute("stroke", "rgba(0, 160, 255, 0.35)");
  circle.setAttribute("stroke-width", "0.6");
  circle.setAttribute("fill", "none");

  // Add a random animation delay for a more dynamic effect
  const animDelay = Math.random() * 10;
  circle.setAttribute("style", `animation-delay: ${animDelay}s; stroke-opacity: 0.35;`);
  parent.appendChild(circle);
}

// Helper function to create a triangle
function createTriangle(parent, points) {
  const triangle = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "polygon"
  );

  const pointsString = points.map(p => `${p.x},${p.y}`).join(' ');
  triangle.setAttribute("points", pointsString);
  triangle.setAttribute("stroke", "rgba(0, 200, 255, 0.4)");
  triangle.setAttribute("stroke-width", "0.7");
  triangle.setAttribute("fill", "none");

  // Add a random animation delay for a more dynamic effect
  const animDelay = Math.random() * 15;
  triangle.setAttribute("style", `animation-delay: ${animDelay}s; stroke-opacity: 0.4;`);
  parent.appendChild(triangle);
}

// Call this function on page load and window resize
document.addEventListener("DOMContentLoaded", function() {
  console.log("Generating Tree of Life");
  generateTreeOfLife();

  // Force another call after a delay to ensure it runs
  setTimeout(() => {
    console.log("Forcing another call to generateTreeOfLife");
    generateTreeOfLife();

    // Check if the SVG was created
    const svg = document.getElementById("tree-of-life");
    if (svg) {
      console.log("Tree of Life SVG created successfully");
      console.log("SVG dimensions:", {
        width: svg.getAttribute("width"),
        height: svg.getAttribute("height"),
        viewBox: svg.getAttribute("viewBox")
      });
      console.log("Number of elements:", {
        circles: svg.querySelectorAll("circle").length,
        lines: svg.querySelectorAll("line").length
      });
    } else {
      console.log("Failed to create Tree of Life SVG");
    }
  }, 1000);
});

window.addEventListener("resize", generateTreeOfLife);
