/**
 * Sacred Geometry Generator for Divinci Feature Pages
 * Creates dynamic sacred geometry patterns and animations
 */

// Initialize sacred geometry elements when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create flower of life pattern
    createFlowerOfLife();

    // Create connection lines between elements
    createSacredGeometryConnections();

    // Initialize orbital animations
    initOrbitalElements();
});

/**
 * Creates a flower of life sacred geometry pattern
 */
function createFlowerOfLife() {
    const container = document.getElementById('flowerOfLife');
    if (!container) return;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    // Center coordinates
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;

    // Base circle radius
    const baseRadius = Math.min(containerWidth, containerHeight) * 0.1;

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${containerWidth} ${containerHeight}`);
    svg.classList.add("sacred-geometry-svg");

    // Create central circle
    createCircle(svg, centerX, centerY, baseRadius);

    // Create first ring of circles
    const firstRingRadius = baseRadius * 2;
    for (let angle = 0; angle < 360; angle += 60) {
        const x = centerX + firstRingRadius * Math.cos(angle * Math.PI / 180);
        const y = centerY + firstRingRadius * Math.sin(angle * Math.PI / 180);
        createCircle(svg, x, y, baseRadius);
    }

    // Create second ring of circles
    const secondRingRadius = baseRadius * 4;
    for (let angle = 0; angle < 360; angle += 30) {
        const x = centerX + secondRingRadius * Math.cos(angle * Math.PI / 180);
        const y = centerY + secondRingRadius * Math.sin(angle * Math.PI / 180);
        createCircle(svg, x, y, baseRadius);
    }

    // Append SVG to container
    container.appendChild(svg);
}

/**
 * Creates a circle element in the SVG
 */
function createCircle(svg, cx, cy, radius) {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", cx);
    circle.setAttribute("cy", cy);
    circle.setAttribute("r", radius);
    circle.setAttribute("stroke", "rgba(255, 255, 255, 0.1)");
    circle.setAttribute("stroke-width", "1");
    circle.setAttribute("fill", "none");
    svg.appendChild(circle);
}

/**
 * Creates connection lines between feature elements
 */
function createSacredGeometryConnections() {
    const container = document.getElementById('connectionLines');
    if (!container) return;

    const features = document.querySelectorAll('.feature');
    if (features.length < 2) return;

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.classList.add("connection-lines-svg");

    // Create lines between features
    for (let i = 0; i < features.length; i++) {
        for (let j = i + 1; j < features.length; j++) {
            if (Math.random() > 0.7) continue; // Only create some connections

            const feature1 = features[i].getBoundingClientRect();
            const feature2 = features[j].getBoundingClientRect();

            const containerRect = container.getBoundingClientRect();

            const x1 = feature1.left + feature1.width/2 - containerRect.left;
            const y1 = feature1.top + feature1.height/2 - containerRect.top;
            const x2 = feature2.left + feature2.width/2 - containerRect.left;
            const y2 = feature2.top + feature2.height/2 - containerRect.top;

            createLine(svg, x1, y1, x2, y2);
        }
    }

    // Append SVG to container
    container.appendChild(svg);
}

/**
 * Creates a line element in the SVG
 */
function createLine(svg, x1, y1, x2, y2) {
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "rgba(92, 226, 231, 0.2)");
    line.setAttribute("stroke-width", "1");
    line.classList.add("sacred-connection-line");

    // Add animation
    const animate = document.createElementNS("http://www.w3.org/2000/svg", "animate");
    animate.setAttribute("attributeName", "opacity");
    animate.setAttribute("values", "0.1;0.3;0.1");
    animate.setAttribute("dur", "3s");
    animate.setAttribute("repeatCount", "indefinite");

    line.appendChild(animate);
    svg.appendChild(line);
}

/**
 * Initializes orbital animations for feature elements
 */
function initOrbitalElements() {
    const orbitalElements = document.querySelectorAll('.orbital-element');

    orbitalElements.forEach((element, index) => {
        // Calculate orbit parameters
        const orbitRadius = 150 + (index * 30);
        const orbitDuration = 20 + (index * 5);
        const startAngle = (index * 40) % 360;

        // Set animation properties
        element.style.setProperty('--orbit-radius', `${orbitRadius}px`);
        element.style.setProperty('--orbit-duration', `${orbitDuration}s`);
        element.style.setProperty('--start-angle', `${startAngle}deg`);

        // Add animation class
        element.classList.add('animate-orbit');
    });
}

/**
 * Creates a dynamic sacred geometry background
 */
function createSacredGeometryBackground() {
    const container = document.querySelector('.sacred-geometry-background');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create SVG element
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.classList.add("sacred-geometry-bg-svg");

    // Create grid of circles
    const spacing = 50;
    for (let x = spacing; x < width; x += spacing) {
        for (let y = spacing; y < height; y += spacing) {
            if (Math.random() > 0.7) {
                const radius = 5 + Math.random() * 15;
                createCircle(svg, x, y, radius);
            }
        }
    }

    // Append SVG to container
    container.appendChild(svg);
}

// Call background creation on resize
window.addEventListener('resize', function() {
    const container = document.getElementById('flowerOfLife');
    const connectionContainer = document.getElementById('connectionLines');

    if (container) {
        container.innerHTML = '';
        createFlowerOfLife();
    }

    if (connectionContainer) {
        connectionContainer.innerHTML = '';
        createConnectionLines();
    }
});
