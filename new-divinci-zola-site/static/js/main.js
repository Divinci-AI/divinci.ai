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

  if (heroVideo) {
    heroVideo.addEventListener('loadeddata', function() {
      if (heroPoster) heroPoster.style.display = 'none';
      heroVideo.style.display = 'block';
      if (soundToggle) soundToggle.style.display = 'block';
    });
  }

  if (soundToggle && heroVideo) {
    soundToggle.addEventListener('click', function() {
      if (heroVideo.muted) {
        heroVideo.muted = false;
        soundToggle.textContent = 'Mute';
      } else {
        heroVideo.muted = true;
        soundToggle.textContent = 'Unmute';
      }
    });
  }

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

  // Initialize FAQ accordion
  initializeFAQAccordion();
  
  // Initialize Playing Cards Feature Showcase
  initializePlayingCards();
});

// FAQ Accordion functionality
function initializeFAQAccordion() {
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', function() {
      const faqItem = this.parentElement;
      const faqAnswer = faqItem.querySelector('.faq-answer');
      const isActive = this.classList.contains('active');

      // Close all other FAQ items
      faqQuestions.forEach(otherQuestion => {
        if (otherQuestion !== this) {
          otherQuestion.classList.remove('active');
          const otherAnswer = otherQuestion.parentElement.querySelector('.faq-answer');
          if (otherAnswer) {
            otherAnswer.classList.remove('active');
          }
        }
      });

      // Toggle current FAQ item
      if (isActive) {
        this.classList.remove('active');
        faqAnswer.classList.remove('active');
      } else {
        this.classList.add('active');
        faqAnswer.classList.add('active');
      }
    });
  });
}

// Global function for FAQ toggle (called from HTML onclick)
function toggleFaq(element) {
  const faqItem = element.parentElement;
  const faqAnswer = faqItem.querySelector('.faq-answer');
  const isActive = element.classList.contains('active');

  // Close all other FAQ items
  const allQuestions = document.querySelectorAll('.faq-question');
  allQuestions.forEach(question => {
    if (question !== element) {
      question.classList.remove('active');
      const otherAnswer = question.parentElement.querySelector('.faq-answer');
      if (otherAnswer) {
        otherAnswer.classList.remove('active');
      }
    }
  });

  // Toggle current FAQ item
  if (isActive) {
    element.classList.remove('active');
    faqAnswer.classList.remove('active');
  } else {
    element.classList.add('active');
    faqAnswer.classList.add('active');
  }
}

// Da Vinci Journal Feature Showcase functionality
function initializePlayingCards() {
  const journalPages = document.querySelectorAll('.journal-page');
  const featureContents = document.querySelectorAll('.feature-content');
  let currentActivePage = null;

  // Set first page as active by default
  if (journalPages.length > 0) {
    const firstPage = journalPages[0];
    firstPage.classList.add('active');
    currentActivePage = firstPage;
  }

  journalPages.forEach((page, index) => {
    page.addEventListener('click', function() {
      const targetFeature = this.getAttribute('data-feature');
      
      // Remove active class from all pages
      journalPages.forEach(p => p.classList.remove('active'));
      
      // Add active class to clicked page
      this.classList.add('active');
      
      // Animate page movement with paper-like effect
      if (currentActivePage && currentActivePage !== this) {
        // Add a paper flip effect to the clicked page
        this.style.transition = 'all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
        setTimeout(() => {
          this.style.transition = 'all 0.4s ease';
        }, 500);
      }
      
      currentActivePage = this;
      
      // Hide all feature contents with fade out
      featureContents.forEach(content => {
        content.classList.remove('active');
        content.style.opacity = '0';
      });
      
      // Show the selected feature content with fade in
      setTimeout(() => {
        const targetContent = document.querySelector(`.feature-content[data-feature="${targetFeature}"]`);
        if (targetContent) {
          targetContent.classList.add('active');
          setTimeout(() => {
            targetContent.style.opacity = '1';
          }, 50);
        }
      }, 300);
    });
    
    // Add hover effect for non-active pages
    page.addEventListener('mouseenter', function() {
      if (!this.classList.contains('active')) {
        // Get current transform and add hover effect
        const currentTransform = window.getComputedStyle(this).transform;
        this.style.transform = currentTransform + ' translateY(-15px)';
      }
    });
    
    page.addEventListener('mouseleave', function() {
      if (!this.classList.contains('active')) {
        // Reset to original position
        const index = Array.from(journalPages).indexOf(this);
        // Reset will be handled by CSS
        this.style.transform = '';
      }
    });
  });
  
  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (!currentActivePage) return;
    
    const currentIndex = Array.from(journalPages).indexOf(currentActivePage);
    let newIndex = currentIndex;
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : journalPages.length - 1;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      newIndex = currentIndex < journalPages.length - 1 ? currentIndex + 1 : 0;
    }
    
    if (newIndex !== currentIndex) {
      journalPages[newIndex].click();
    }
  });
}