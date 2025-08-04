document.addEventListener("DOMContentLoaded", function() {
  const heroVideo = document.getElementById('hero-video');
  const heroVideo2 = document.getElementById('hero-video-2');
  const heroVideo3 = document.getElementById('hero-video-3');
  const heroPoster = document.getElementById('hero-poster');
  const soundToggle = document.getElementById('sound-toggle');
  
  // Performance optimization: Check for reduced motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Battery-aware loading for mobile devices
  const isMobile = window.innerWidth <= 768;
  let shouldOptimizeForBattery = false;
  
  // Add viewport change listener for dynamic mobile/desktop switching
  let currentViewportMode = isMobile ? 'mobile' : 'desktop';
  window.addEventListener('resize', function() {
    const newIsMobile = window.innerWidth <= 768;
    const newMode = newIsMobile ? 'mobile' : 'desktop';
    
    if (currentViewportMode !== newMode) {
      console.log(`Viewport changed from ${currentViewportMode} to ${newMode}`);
      currentViewportMode = newMode;
      
      // If switching TO mobile, hide videos 2&3 but keep them in DOM
      if (newMode === 'mobile') {
        const heroVideo2 = document.getElementById('hero-video-2');
        const heroVideo3 = document.getElementById('hero-video-3');
        if (heroVideo2) {
          heroVideo2.style.opacity = '0';
          heroVideo2.style.pointerEvents = 'none';
        }
        if (heroVideo3) {
          heroVideo3.style.opacity = '0';
          heroVideo3.style.pointerEvents = 'none';
        }
        window.isMobileVideoMode = true;
        console.log('Switched to mobile: videos 2&3 hidden');
      }
      // If switching TO desktop, show videos 2&3 and allow cycling
      else if (newMode === 'desktop') {
        const heroVideo2 = document.getElementById('hero-video-2');
        const heroVideo3 = document.getElementById('hero-video-3');
        if (heroVideo2) {
          heroVideo2.style.display = 'block';
          heroVideo2.style.opacity = '0'; // Let cycling system handle opacity
          heroVideo2.style.pointerEvents = 'auto';
        }
        if (heroVideo3) {
          heroVideo3.style.display = 'block';
          heroVideo3.style.opacity = '0'; // Let cycling system handle opacity
          heroVideo3.style.pointerEvents = 'auto';
        }
        window.isMobileVideoMode = false;
        console.log('Switched to desktop: videos 2&3 available for cycling');
      }
    }
  });
  
  // On mobile, disable video cycling but keep all videos available
  if (isMobile) {
    console.log('Mobile detected - keeping all videos but disabling cycling logic');
    shouldOptimizeForBattery = true;
    
    // Don't remove videos, just ensure they're hidden initially
    if (heroVideo2) {
      heroVideo2.style.opacity = '0';
      heroVideo2.style.display = 'block'; // Keep in DOM
      console.log('Mobile: heroVideo2 hidden but available');
    }
    if (heroVideo3) {
      heroVideo3.style.opacity = '0';
      heroVideo3.style.display = 'block'; // Keep in DOM
      console.log('Mobile: heroVideo3 hidden but available');
    }
    
    // Keep first video visible and playing
    if (heroVideo) {
      heroVideo.style.opacity = '1';
      heroVideo.style.display = 'block';
      console.log('Mobile: heroVideo1 visible and ready');
    }
    
    // Prevent video cycling logic from running
    window.isMobileVideoMode = true;
  }
  
  if ('getBattery' in navigator && isMobile) {
    navigator.getBattery().then(function(battery) {
      // Optimize for battery if level is low or not charging
      shouldOptimizeForBattery = battery.level < 0.3 || !battery.charging;
      
      if (shouldOptimizeForBattery) {
        console.log('Optimizing for battery life - reducing video usage');
        [heroVideo, heroVideo2, heroVideo3].forEach(video => {
          if (video) {
            video.setAttribute('data-battery-aware', 'true');
            video.preload = 'none';
          }
        });
      }
    }).catch(() => {
      // Battery API not supported, use conservative approach on mobile
      if (isMobile) {
        console.log('Battery API not supported - using conservative mobile approach');
        shouldOptimizeForBattery = true;
      }
    });
  }
  
  // Time-based lighting system removed
  
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

  // Ensure hero video starts playing when page loads and is in view
  if (heroVideo && !prefersReducedMotion && !shouldOptimizeForBattery) {
    // Check if hero is initially in view and start first video
    const heroRect = heroVideo.getBoundingClientRect();
    if (heroRect.top < window.innerHeight && heroRect.bottom > 0) {
      console.log('Starting initial hero video playback');
      heroVideo.play().catch(e => console.log('Initial hero video play failed:', e));
      
      // Show sound toggle for first video
      if (soundToggle) {
        soundToggle.style.display = 'block';
        soundToggle.textContent = heroVideo.muted ? 'Unmute' : 'Mute';
        console.log('Sound toggle shown for initial video, muted:', heroVideo.muted);
      }
    }
  }

  // Debug function to manually test video switching (desktop only)
  if (!isMobile) {
    window.testVideoSwitch = function() {
      console.log('Manual video switch triggered');
      switchToNextVideo();
    };
  }

  // Fallback timer to ensure video rotation starts even if ended event doesn't fire (desktop only)
  if (!isMobile) {
    setTimeout(() => {
      if (currentVideoIndex === 0 && isFirstPlaythrough && heroVideo) {
        console.log('Fallback: Starting video rotation after 30 seconds');
        isFirstPlaythrough = false;
        heroVideo.loop = false;
        setTimeout(() => switchToNextVideo(), 2000);
      }
    }, 30000); // 30 seconds fallback
  }

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

  // Hero video rotation system - disabled on mobile
  if (!isMobile && !window.isMobileVideoMode) {
    const heroVideos = [heroVideo, heroVideo2, heroVideo3];
    let currentVideoIndex = 0;
    let currentActiveHeroVideo = heroVideo;
    let isFirstPlaythrough = true;
    let isTransitioning = false; // Prevent duplicate transitions  
    let video1MuteState = true; // Track Video 1's mute state (default muted)

  function switchToNextVideo() {
    if (isTransitioning) {
      console.log('Transition already in progress, skipping');
      return;
    }
    
    isTransitioning = true;
    const currentVideo = heroVideos[currentVideoIndex];
    const nextIndex = (currentVideoIndex + 1) % heroVideos.length;
    const nextVideo = heroVideos[nextIndex];

    console.log(`Switching from video ${currentVideoIndex + 1} to video ${nextIndex + 1}`);

    if (!nextVideo) {
      console.error(`Next video at index ${nextIndex} not found!`);
      isTransitioning = false;
      return;
    }

    // Disable loop on current video to prevent it from continuing
    if (currentVideo) {
      currentVideo.loop = false;
      currentVideo.pause(); // Ensure current video stops
      console.log(`Disabled loop and paused video ${currentVideoIndex + 1}`);
    }

    // Immediately hide Video 1 if we're transitioning to Video 3 (prevents first-time flash)
    if (nextIndex === 2 && heroVideo) {
      heroVideo.style.opacity = '0';
      heroVideo.style.display = 'none';
      heroVideo.pause();
      console.log('Pre-emptively hiding Video 1 for Video 3 transition');
    }

    // Special handling for cycling back to video 1
    if (nextIndex === 0) {
      console.log('Cycling back to video 1 - resetting properties');
      nextVideo.currentTime = 0; // Reset to beginning
      nextVideo.loop = false; // Don't loop when cycling back
      nextVideo.removeAttribute('loop'); // Ensure loop attribute is removed
      // Reset first playthrough flag so it can start the cycle again
      isFirstPlaythrough = false;
    }

    // Lazy load the next video
    nextVideo.preload = 'metadata';
    nextVideo.load();
    console.log(`Loading video ${nextIndex + 1}`);

    // Add error handler for video loading
    nextVideo.addEventListener('error', function(e) {
      console.error(`Error loading video ${nextIndex + 1}:`, e);
    }, { once: true });

    const loadHandler = function() {
      console.log(`Video ${nextIndex + 1} loaded successfully`);
      
      // Hide current video immediately and ensure all other videos are hidden
      heroVideos.forEach((video, index) => {
        if (video && index !== nextIndex) {
          video.style.opacity = '0';
          video.style.display = 'none'; // Hide immediately, no delay
          video.pause(); // Make sure it's not playing
        }
      });
      
      // Show and fade in the next video
      nextVideo.style.display = 'block';
      nextVideo.style.opacity = '0'; // Start hidden
      
      setTimeout(() => {
        nextVideo.style.opacity = '1';
        nextVideo.play().then(() => {
          console.log(`Video ${nextIndex + 1} started playing`);
          currentActiveHeroVideo = nextVideo;
          currentVideoIndex = nextIndex;
          isTransitioning = false; // Allow next transition
          
          // Show/hide mute button and handle muting based on which video is active
          if (soundToggle) {
            if (nextIndex === 0) { // Video 1 is active
              soundToggle.style.display = 'block';
              // Always start Video 1 muted when cycling back (fresh state)
              nextVideo.muted = true;
              video1MuteState = true; // Reset to muted state
              soundToggle.textContent = 'Unmute';
              console.log(`Video 1 cycling back - reset to muted state`);
            } else {
              soundToggle.style.display = 'none';
              // Auto-mute Videos 2 & 3
              nextVideo.muted = true;
              console.log(`Auto-muted video ${nextIndex + 1}`);
            }
          }
          
          // Special handling: if we've cycled back to video 1, it should play once then continue cycle
          if (nextIndex === 0 && !isFirstPlaythrough) {
            console.log('Video 1 restarted in cycle - setting up for next transition');
            // Add a safety timeout in case the ended event doesn't fire
            setTimeout(() => {
              if (currentVideoIndex === 0 && !isTransitioning) {
                console.log('Safety timeout: forcing Video 1 transition');
                switchToNextVideo();
              }
            }, (nextVideo.duration + 0.5) * 1000); // Video duration + 0.5s buffer
          }
        }).catch(e => {
          console.error(`Hero video ${nextIndex + 1} play failed:`, e);
          isTransitioning = false; // Reset on error
        });
      }, 100); // Faster transition
    };

    // Check if video is already loaded
    if (nextVideo.readyState >= 2) { // HAVE_CURRENT_DATA or better
      console.log(`Video ${nextIndex + 1} already loaded`);
      loadHandler();
    } else {
      nextVideo.addEventListener('loadeddata', loadHandler, { once: true });
    }
  }

  if (heroVideo) {
    heroVideo.addEventListener('loadeddata', function() {
      if (heroPoster) heroPoster.style.display = 'none';
      heroVideo.style.display = 'block';
      if (soundToggle) {
        soundToggle.style.display = 'block'; // Always show for video 1 initially
      }
      
      // Start with loop enabled for initial playback
      heroVideo.loop = true;
    });

    // Set up individual video ended handlers
    if (heroVideo) {
      heroVideo.addEventListener('ended', function() {
        console.log('Video 1 ended, isFirstPlaythrough:', isFirstPlaythrough);
        if (isFirstPlaythrough) {
          console.log('First playthrough complete, starting cycle');
          isFirstPlaythrough = false;
          heroVideo.loop = false;
          switchToNextVideo();
        } else {
          console.log('Video 1 ended in cycle, continuing to next video');
          switchToNextVideo();
        }
      });
    }

    if (heroVideo2) {
      heroVideo2.addEventListener('ended', function() {
        console.log('Video 2 ended');
        switchToNextVideo();
      });
    }

    if (heroVideo3) {
      heroVideo3.addEventListener('ended', function() {
        console.log('Video 3 ended, switching back to video 1');
        switchToNextVideo();
      });
      
      // Add additional debugging for video 3
      heroVideo3.addEventListener('loadedmetadata', function() {
        console.log('Video 3 metadata loaded, duration:', heroVideo3.duration);
      });
      
      heroVideo3.addEventListener('timeupdate', function() {
        // Only log periodically, not every frame
        if (heroVideo3.currentTime > 0 && Math.floor(heroVideo3.currentTime * 4) % 4 === 0) {
          console.log(`Video 3 time: ${heroVideo3.currentTime.toFixed(2)}/${heroVideo3.duration.toFixed(2)}`);
        }
        
        // Fallback: if video is very close to end but hasn't fired ended event
        if (heroVideo3.duration > 0 && (heroVideo3.currentTime >= heroVideo3.duration - 0.1) && !isTransitioning) {
          console.log('Video 3 near end, triggering manual switch');
          setTimeout(() => {
            if (currentVideoIndex === 2 && !isTransitioning) { // Still on video 3 and not transitioning
              console.log('Manual switch triggered for video 3');
              switchToNextVideo();
            }
          }, 100);
        }
      });
      
      heroVideo3.addEventListener('stalled', function() {
        console.log('Video 3 stalled!');
      });
      
      heroVideo3.addEventListener('waiting', function() {
        console.log('Video 3 waiting for data...');
      });
    }
  }

  if (soundToggle && heroVideo) {
    soundToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (isMobile || window.isMobileVideoMode) {
        // On mobile, just toggle the single video's mute state
        console.log('Mobile: Sound toggle clicked, current mute state:', heroVideo.muted);
        
        // Try to play first to ensure user interaction
        heroVideo.play().then(() => {
          if (heroVideo.muted) {
            heroVideo.muted = false;
            heroVideo.volume = 1.0; // Ensure volume is at max
            soundToggle.textContent = 'Mute';
            console.log('Mobile: Video unmuted, volume set to:', heroVideo.volume);
          } else {
            heroVideo.muted = true;
            soundToggle.textContent = 'Unmute';
            console.log('Mobile: Video muted');
          }
          
          console.log('Mobile: Final video mute state:', heroVideo.muted, 'volume:', heroVideo.volume);
        }).catch(e => {
          console.log('Mobile: Play failed, trying direct mute toggle');
          if (heroVideo.muted) {
            heroVideo.muted = false;
            heroVideo.volume = 1.0;
            soundToggle.textContent = 'Mute';
          } else {
            heroVideo.muted = true;
            soundToggle.textContent = 'Unmute';
          }
        });
      } else {
        // Desktop video cycling behavior
        if (currentActiveHeroVideo === heroVideo) {
          if (heroVideo.muted) {
            heroVideo.muted = false;
            video1MuteState = false; // Save user preference
            soundToggle.textContent = 'Mute';
          } else {
            heroVideo.muted = true;
            video1MuteState = true; // Save user preference
            soundToggle.textContent = 'Unmute';
          }
          console.log('Video 1 mute state changed to:', video1MuteState);
          
          // Ensure video continues to cycle regardless of mute state
          // Don't re-enable loop when unmuting - let the cycle continue
          if (!isFirstPlaythrough) {
            heroVideo.loop = false; // Keep loop disabled for cycling
          }
        }
      }
    });
  }

  } // End of desktop video cycling system
  
  // Mobile-specific video handling
  if (isMobile && heroVideo) {
    console.log('Mobile: Setting up simple video loop');
    
    // Ensure first video is visible and plays on mobile
    heroVideo.style.opacity = '1';
    heroVideo.style.display = 'block';
    
    // Simple play on mobile when in view
    const mobileVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !prefersReducedMotion) {
          console.log('Mobile: Hero video in view, starting playback');
          heroVideo.play().catch(e => console.log('Mobile video play failed:', e));
          
          // Show sound toggle for mobile video
          if (soundToggle) {
            soundToggle.style.display = 'block';
            soundToggle.style.visibility = 'visible';
            soundToggle.style.pointerEvents = 'auto';
            soundToggle.textContent = heroVideo.muted ? 'Unmute' : 'Mute';
            console.log('Mobile: Sound toggle shown and enabled');
          }
        } else {
          heroVideo.pause();
        }
      });
    }, { threshold: 0.25 });
    
    mobileVideoObserver.observe(heroVideo);
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
      
      // Add active class to clicked page first to prevent flickering
      this.classList.add('active');
      
      // Remove active class from other pages
      journalPages.forEach(p => {
        if (p !== this) {
          p.classList.remove('active');
        }
      });
      
      // Animate page movement with paper-like effect
      if (currentActivePage && currentActivePage !== this) {
        // Add a paper flip effect to the clicked page
        this.style.transition = 'all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1)';
        setTimeout(() => {
          this.style.transition = 'all 0.4s ease';
        }, 500);
      }
      
      currentActivePage = this;
      
      // Immediately hide all feature contents and clear any pending timeouts
      featureContents.forEach(content => {
        content.classList.remove('active');
        content.style.opacity = '0';
        content.style.display = 'none';
      });
      
      // Show the selected feature content immediately
      const targetContent = document.querySelector(`.feature-content[data-feature="${targetFeature}"]`);
      if (targetContent) {
        // Force immediate update
        targetContent.style.display = 'block';
        targetContent.classList.add('active');
        // Use requestAnimationFrame for smooth transition
        requestAnimationFrame(() => {
          targetContent.style.opacity = '1';
        });
      }
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
  
  // Keyboard navigation with throttling
  let keyboardNavigationThrottle = false;
  document.addEventListener('keydown', function(e) {
    if (!currentActivePage || keyboardNavigationThrottle) return;
    
    const currentIndex = Array.from(journalPages).indexOf(currentActivePage);
    let newIndex = currentIndex;
    
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : journalPages.length - 1;
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      newIndex = currentIndex < journalPages.length - 1 ? currentIndex + 1 : 0;
    }
    
    if (newIndex !== currentIndex) {
      keyboardNavigationThrottle = true;
      journalPages[newIndex].click();
      
      // Reset throttle after animation completes
      setTimeout(() => {
        keyboardNavigationThrottle = false;
      }, 200); // Adjust timing as needed
    }
  });
}

// All lighting functions removed