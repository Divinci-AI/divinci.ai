// Animated chat bubbles that follow the emoji circles
document.addEventListener('DOMContentLoaded', function() {
  console.log('Animated chat bubbles script loaded');
  
  // Enhanced marketing-style feature messages for the chat bubbles
  const featureMessages = [
    "🚀 Staged model releases for safe deployments",
    "🧪 A/B test model behavior with confidence",
    "⚖️ Advanced bias detection & mitigation",
    "📊 Enterprise-grade monitoring & logging",
    "🔄 Custom RLHF pipelines for your needs",
    "🛡️ Powerful guardrails & content filters",
    "📝 Seamless model versioning & rollbacks",
    "✅ Automated evaluations for quality",
    "👥 Human feedback loop integration",
    "🔍 Expert red teaming for your models",
    "🔒 Advanced jailbreak prevention",
    "⚔️ Custom safety filters for your brand",
    "🤖 Auto-RAG for smarter responses",
    "⚡ Enterprise RAG APIs with scale",
    "🧠 Fine-Tuning APIs for domain expertise",
    "🌐 Access 100+ LLMs to build atop!",
    "📋 Transparent AI safety reporting",
    "💰 Cost-efficient inference options",
    "🖼️ Multi-modal model support",
    "📝 Customizable prompt templates"
  ];

  // Reactions/responses for the other circles
  const reactionMessages = [
    "Love that! 😍",
    "Perfecto 🤌",
    "Wow! 🤩",
    "Game changer! 🚀",
    "That's genius! 💡",
    "Need this! ✅",
    "So cool! ❄️",
    "Amazing! ⭐",
    "This is the way 🧙‍♂️",
    "Chef's kiss 👨‍🍳",
    "Brilliant! ✨",
    "Next level! 🔥",
    "Facts! 💯",
    "Based ✌️",
    "Take my money! 💸",
    "Mind blown! 🤯"
  ];
  
  let currentFeatureIndex = 0;
  let currentReactionIndex = 0;
  
  // Arrays to store emoji circles from each group
  const allCircleGroups = [];
  let lastGroupUsed = -1; // Keep track of which group showed a feature last time
  
  // Keep track of active bubbles and their parent circles
  let activeBubbleData = [];
  
  // Cache emoji circles from the DOM
  function cacheCircles() {
    // Define AI logo selectors to exclude
    const aiLogoSelectors = [
      '.circle01.ai-logo', // ChatGPT
      '.circle03.ai-logo', // Claude
      '.circle21.ai-logo', // Google Gemini
      '.circle23.ai-logo', // Grok
      '.circle27.ai-logo'  // Perplexity
    ];
    
    // Helper function to filter out AI logo circles
    function filterOutAILogos(circles) {
      return Array.from(circles).filter(circle => {
        // Check if this circle has the ai-logo class
        if (circle.classList.contains('ai-logo')) {
          return false; // Skip AI logo circles
        }
        return true;
      });
    }
    
    // Group 1: Grab the first orbit circles
    const group1 = document.querySelectorAll('.geometry-group .circle');
    if (group1.length > 0) allCircleGroups.push(filterOutAILogos(group1));
    
    // Group 2: Grab the outer1 circles
    const group2 = document.querySelectorAll('.geometry-group-outer1 .circle');
    if (group2.length > 0) allCircleGroups.push(filterOutAILogos(group2));
    
    // Group 3: Grab the outer2 circles
    const group3 = document.querySelectorAll('.geometry-group-outer2 .circle');
    if (group3.length > 0) allCircleGroups.push(filterOutAILogos(group3));
    
    console.log(`Found ${allCircleGroups.length} circle groups with total of ${allCircleGroups.reduce((sum, group) => sum + group.length, 0)} circles`);
  }
  
  // Create a chat bubble and attach it to an emoji circle
  function createBubble(circle, isFeature) {
    const bubble = document.createElement('div');
    const bubbleId = `bubble-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    // Set basic properties
    bubble.id = bubbleId;
    bubble.className = isFeature ? 'chat-bubble feature-bubble' : 'chat-bubble reaction-bubble';
    bubble.textContent = isFeature ? featureMessages[currentFeatureIndex] : reactionMessages[currentReactionIndex];
    
    // Style it directly
    Object.assign(bubble.style, {
      position: 'absolute',
      top: '-67px', // Moved up by 7px from -60px to -67px
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '10000',
      padding: isFeature ? '10px 20px' : '8px 16px',
      backgroundColor: isFeature ? 'white' : 'rgba(0, 0, 67, 0.8)',
      color: isFeature ? 'black' : 'white',
      borderRadius: '20px',
      boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
      border: isFeature ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(0,0,0,0.2)',
      fontSize: isFeature ? '16px' : '14px',
      fontWeight: 'bold',
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      opacity: '1',
      display: 'flex'
    });
    
    // Update indices
    if (isFeature) {
      currentFeatureIndex = (currentFeatureIndex + 1) % featureMessages.length;
    } else {
      currentReactionIndex = (currentReactionIndex + 1) % reactionMessages.length;
    }
    
    // Create a pointer/stem
    const pointer = document.createElement('div');
    Object.assign(pointer.style, {
      content: "''",
      position: 'absolute',
      bottom: '-6px',
      left: '50%',
      marginLeft: '-6px',
      width: '12px',
      height: '12px',
      background: isFeature ? 'white' : 'rgba(0, 0, 67, 0.8)',
      transform: 'rotate(45deg)',
      border: isFeature ? '1px solid rgba(0,0,0,0.1)' : '1px solid rgba(0,0,0,0.2)',
      borderLeft: 'none',
      borderTop: 'none',
      zIndex: '-1'
    });
    
    bubble.appendChild(pointer);
    
    // Add it to the circle
    circle.appendChild(bubble);
    
    // Keep track of the bubble and its circle
    activeBubbleData.push({
      bubble: bubble,
      circle: circle,
      isFeature: isFeature
    });
    
    return bubble;
  }
  
  // Create and show chat bubbles on selected circles
  function showChatBubbles() {
    console.log('Showing chat bubbles attached to circles');
    
    // Clear any existing bubbles
    clearBubbles();
    
    // If we don't have circles cached yet, do it now
    if (allCircleGroups.length === 0) {
      cacheCircles();
      if (allCircleGroups.length === 0) {
        console.error('No circle groups found');
        return;
      }
    }
    
    // Pick a group for feature bubble (different from last time)
    let featureGroupIndex;
    do {
      featureGroupIndex = Math.floor(Math.random() * allCircleGroups.length);
    } while (featureGroupIndex === lastGroupUsed && allCircleGroups.length > 1);
    
    lastGroupUsed = featureGroupIndex;
    const featureGroup = allCircleGroups[featureGroupIndex];
    
    if (!featureGroup || featureGroup.length === 0) {
      console.error('Feature group is empty');
      return;
    }
    
    // Pick a random circle from the feature group
    const featureCircleIndex = Math.floor(Math.random() * featureGroup.length);
    const featureCircle = featureGroup[featureCircleIndex];
    
    // Create feature bubble
    const featureBubble = createBubble(featureCircle, true);
    
    // Show reaction bubbles on circles from other groups
    const otherGroups = allCircleGroups.filter((_, index) => index !== featureGroupIndex);
    
    // Show reaction bubbles if we have other groups available
    if (otherGroups.length > 0) {
      setTimeout(() => {
        // First reaction
        const reaction1Group = otherGroups[0];
        if (reaction1Group && reaction1Group.length > 0) {
          const reaction1CircleIndex = Math.floor(Math.random() * reaction1Group.length);
          const reaction1Circle = reaction1Group[reaction1CircleIndex];
          createBubble(reaction1Circle, false);
        }
        
        // Second reaction (if we have enough groups)
        setTimeout(() => {
          if (otherGroups.length > 1) {
            const reaction2Group = otherGroups[1];
            if (reaction2Group && reaction2Group.length > 0) {
              const reaction2CircleIndex = Math.floor(Math.random() * reaction2Group.length);
              const reaction2Circle = reaction2Group[reaction2CircleIndex];
              createBubble(reaction2Circle, false);
            }
          }
        }, 1000); // 1 second after first reaction
      }, 1500); // 1.5 seconds after feature bubble
    }
    
    // Remove bubbles after a delay
    setTimeout(clearBubbles, 6000);
  }
  
  // Clear all active bubbles
  function clearBubbles() {
    activeBubbleData.forEach(data => {
      if (data.bubble.parentNode) {
        data.bubble.parentNode.removeChild(data.bubble);
      }
    });
    activeBubbleData = [];
  }
  
  // Start showing bubbles
  let bubbleInterval;
  
  function startBubbles() {
    // Show immediately
    showChatBubbles();
    
    // Set up interval
    bubbleInterval = setInterval(showChatBubbles, 9000);
    
    // Handle visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        if (!bubbleInterval) {
          showChatBubbles();
          bubbleInterval = setInterval(showChatBubbles, 9000);
        }
      } else {
        clearInterval(bubbleInterval);
        bubbleInterval = null;
      }
    });
  }
  
  // Add CSS directly to ensure bubbles are visible
  const style = document.createElement('style');
  style.textContent = `
    .chat-bubble {
      z-index: 10000 !important;
      display: flex !important;
      visibility: visible !important;
      opacity: 1 !important;
    }
    .feature-bubble {
      background-color: white !important;
      color: black !important;
    }
    .reaction-bubble {
      background-color: rgba(0, 0, 67, 0.8) !important;
      color: white !important;
    }
  `;
  document.head.appendChild(style);
  
  // Wait a bit to make sure all animations are loaded and running
  setTimeout(startBubbles, 2000);
});