document.addEventListener("DOMContentLoaded", function() {
  const heroVideo = document.getElementById('hero-video');
  const heroPoster = document.getElementById('hero-poster');
  const soundToggle = document.getElementById('sound-toggle');
  
  // Initialize all main elements first to avoid reference errors
  const enterpriseAiSection = document.querySelector('.enterprise-ai');
  const panels = document.querySelectorAll('.panel');
  const backgroundVideos = document.querySelectorAll('.background-video');
  let currentActiveVideo = document.getElementById('background-video-default');

  // Intersection Observer for lazy video loading
  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        // Video is in view - start playing
        video.play().catch(e => console.log('Video play failed:', e));
      } else {
        // Video is out of view - pause
        video.pause();
      }
    });
  }, {
    threshold: 0.25 // Start playing when 25% visible
  });

  // Observe lazy videos (excluding background videos which we manage manually)
  document.querySelectorAll('[data-lazy-video]:not(.background-video)').forEach(video => {
    videoObserver.observe(video);
  });

  // Background video intersection observer - ensures they play when container is in view
  const backgroundVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Start the currently active video when container comes into view
        if (currentActiveVideo && currentActiveVideo.paused) {
          currentActiveVideo.play().catch(e => console.log('Background video play failed:', e));
        }
      } else {
        // Pause all background videos when container goes out of view
        backgroundVideos.forEach(video => video.pause());
      }
    });
  }, {
    threshold: 0.25
  });

  // Observe the video container
  const videoContainer = document.querySelector('.video-background-container');
  if (videoContainer) {
    backgroundVideoObserver.observe(videoContainer);
  }

  // Bottom panels parallax scroll effect
  const bottomPanels = document.querySelectorAll('.panels-container .panel:nth-child(3), .panels-container .panel:nth-child(4)');
  let parallaxStartPoint = null;
  let parallaxEndPoint = null;
  
  function initializeParallaxPoints() {
    if (bottomPanels.length > 0) {
      const firstBottomPanel = bottomPanels[0];
      const panelRect = firstBottomPanel.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Start parallax when 10px beyond bottom of panel is visible
      parallaxStartPoint = window.scrollY + panelRect.bottom - windowHeight + 10;
      
      // End parallax after scrolling about 50% of viewport height
      parallaxEndPoint = parallaxStartPoint + (windowHeight * 0.5);
    }
  }
  
  function handleParallaxScroll() {
    const scrollY = window.scrollY;
    
    // Initialize parallax points when panels are visible
    if (parallaxStartPoint === null && bottomPanels.length > 0) {
      const firstBottomPanel = bottomPanels[0];
      const panelRect = firstBottomPanel.getBoundingClientRect();
      
      // Only initialize when panel is visible on screen
      if (panelRect.top < window.innerHeight && panelRect.bottom > 0) {
        initializeParallaxPoints();
      }
    }
    
    // Apply parallax effect if within scroll range
    if (parallaxStartPoint !== null && parallaxEndPoint !== null) {
      if (scrollY >= parallaxStartPoint && scrollY <= parallaxEndPoint) {
        // Calculate progress from 0 to 1
        const progress = (scrollY - parallaxStartPoint) / (parallaxEndPoint - parallaxStartPoint);
        
        // Maximum movement of 50% of viewport height
        const maxMovement = window.innerHeight * 0.37;
        const currentMovement = progress * maxMovement;
        
        bottomPanels.forEach(panel => {
          panel.style.transform = `translateY(${currentMovement}px)`;
        });
        
      } else if (scrollY < parallaxStartPoint) {
        // Reset to initial position
        bottomPanels.forEach(panel => {
          panel.style.transform = 'translateY(0px)';
        });
        
      } else if (scrollY > parallaxEndPoint) {
        // Keep at maximum movement
        const maxMovement = window.innerHeight * 0.37;
        bottomPanels.forEach(panel => {
          panel.style.transform = `translateY(${maxMovement}px)`;
        });
      }
    }
  }
  
  // Optimized scroll handler with requestAnimationFrame
  let scrollTicking = false;
  window.addEventListener('scroll', () => {
    if (!scrollTicking) {
      requestAnimationFrame(() => {
        handleParallaxScroll();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  });
  
  // Initialize on load
  handleParallaxScroll();

  heroVideo.addEventListener('loadeddata', function() {
    heroPoster.style.display = 'none';
    heroVideo.style.display = 'block';
    soundToggle.style.display = 'block';
  });

  soundToggle.addEventListener('click', function() {
    if (heroVideo.muted) {
      heroVideo.muted = false;
      soundToggle.textContent = 'Mute';
    } else {
      heroVideo.muted = true;
      soundToggle.textContent = 'Unmute';
    }
  });

  // Preload video when needed
  function preloadVideo(video) {
    if (video.preload === 'none') {
      video.preload = 'metadata';
      video.load();
    }
  }

  // Switch active background video with smooth transition
  function switchBackgroundVideo(targetVideoId) {
    const targetVideo = document.getElementById(targetVideoId);
    
    if (targetVideo && targetVideo !== currentActiveVideo) {
      // Preload the target video if needed
      preloadVideo(targetVideo);
      
      // Pause current video and fade out
      currentActiveVideo.pause();
      currentActiveVideo.classList.remove('active');
      
      // Wait for fade out, then switch and fade in
      setTimeout(() => {
        // Start playing the new video and make it active
        targetVideo.play().catch(e => console.log('Video play failed:', e));
        targetVideo.classList.add('active');
        currentActiveVideo = targetVideo;
      }, 400); // Half of the 0.8s transition time for smooth crossfade
    }
  }

  panels.forEach((panel, index) => {
    panel.addEventListener('mouseenter', () => {
      enterpriseAiSection.classList.add(`hover-panel-${index + 1}`);
      
      // Switch to panel-specific video for panels 2 and 3
      if (index === 1) { // Panel 2 (0-based index)
        switchBackgroundVideo('background-video-panel2');
      } else if (index === 2) { // Panel 3 (0-based index)
        switchBackgroundVideo('background-video-panel3');
      }
    });

    panel.addEventListener('mouseleave', () => {
      enterpriseAiSection.classList.remove(`hover-panel-${index + 1}`);
      
      // Return to default video when leaving panels 2 or 3
      if (index === 1 || index === 2) {
        switchBackgroundVideo('background-video-default');
      }
    });
  });
});