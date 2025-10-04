// Debug script to test if the first geometry group is moving
document.addEventListener("DOMContentLoaded", () => {
  console.log("🔍 Starting first group movement test...");
  
  const firstGroup = document.querySelector('.geometry-group');
  if (!firstGroup) {
    console.error("❌ First group (.geometry-group) not found!");
    return;
  }
  
  const firstCircle = firstGroup.querySelector('.circle');
  if (!firstCircle) {
    console.error("❌ No circles found in first group!");
    return;
  }
  
  console.log("✅ Found first group and first circle");
  console.log("First circle classes:", firstCircle.className);
  console.log("First circle computed styles:");
  
  const computedStyle = window.getComputedStyle(firstCircle);
  console.log("- animation:", computedStyle.animation);
  console.log("- transform:", computedStyle.transform);
  console.log("- position:", computedStyle.position);
  console.log("- top:", computedStyle.top);
  console.log("- left:", computedStyle.left);
  console.log("- opacity:", computedStyle.opacity);
  
  // Record initial position
  const initialRect = firstCircle.getBoundingClientRect();
  console.log("Initial position:", { x: initialRect.x, y: initialRect.y });
  
  // Check position after 3 seconds
  setTimeout(() => {
    const newRect = firstCircle.getBoundingClientRect();
    const moved = Math.abs(newRect.x - initialRect.x) > 5 || Math.abs(newRect.y - initialRect.y) > 5;
    
    console.log("Position after 3 seconds:", { x: newRect.x, y: newRect.y });
    console.log("Distance moved:", { 
      x: Math.abs(newRect.x - initialRect.x), 
      y: Math.abs(newRect.y - initialRect.y) 
    });
    
    if (moved) {
      console.log("✅ SUCCESS: First group is moving!");
    } else {
      console.log("❌ PROBLEM: First group is NOT moving!");
      
      // Additional debugging
      console.log("Checking for CSS conflicts...");
      const allRules = [];
      for (let sheet of document.styleSheets) {
        try {
          for (let rule of sheet.cssRules) {
            if (rule.selectorText && rule.selectorText.includes('circle')) {
              allRules.push({
                selector: rule.selectorText,
                cssText: rule.cssText
              });
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      }
      
      console.log("CSS rules affecting circles:", allRules);
      
      // Check if animation is actually applied
      const animationName = computedStyle.animationName;
      console.log("Animation name:", animationName);
      console.log("Animation duration:", computedStyle.animationDuration);
      console.log("Animation timing function:", computedStyle.animationTimingFunction);
      console.log("Animation iteration count:", computedStyle.animationIterationCount);
    }
  }, 3000);
});
