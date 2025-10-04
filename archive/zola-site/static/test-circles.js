// Simple test script to verify SVG circle generation works
console.log("Test script loaded");

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM loaded, looking for SVG");
    
    const svgElement = document.querySelector(".flower-of-life");
    console.log("Found SVG element:", svgElement);
    
    if (svgElement) {
        // Clear any existing content
        svgElement.innerHTML = "";
        
        // Add a simple test circle
        const testCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        testCircle.setAttribute("cx", "400");
        testCircle.setAttribute("cy", "300");
        testCircle.setAttribute("r", "50");
        testCircle.setAttribute("stroke", "red");
        testCircle.setAttribute("stroke-width", "5");
        testCircle.setAttribute("fill", "yellow");
        svgElement.appendChild(testCircle);
        
        console.log("Added test circle to SVG");
        
        // Add a few more circles in a pattern
        const circles = [
            { cx: 300, cy: 200, r: 30, stroke: "blue", fill: "lightblue" },
            { cx: 500, cy: 200, r: 30, stroke: "green", fill: "lightgreen" },
            { cx: 300, cy: 400, r: 30, stroke: "purple", fill: "lavender" },
            { cx: 500, cy: 400, r: 30, stroke: "orange", fill: "lightyellow" }
        ];
        
        circles.forEach(circleData => {
            const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            circle.setAttribute("cx", circleData.cx);
            circle.setAttribute("cy", circleData.cy);
            circle.setAttribute("r", circleData.r);
            circle.setAttribute("stroke", circleData.stroke);
            circle.setAttribute("stroke-width", "3");
            circle.setAttribute("fill", circleData.fill);
            svgElement.appendChild(circle);
        });
        
        console.log("Added all test circles");
    } else {
        console.error("Could not find .flower-of-life SVG element");
    }
});
