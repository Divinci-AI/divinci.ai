// Execute immediately to catch mobile detection early

document.addEventListener("DOMContentLoaded", function() {
  const heroVideo = document.getElementById('hero-video');
  const heroVideo2 = document.getElementById('hero-video-2');
  const heroVideo3 = document.getElementById('hero-video-3');
  const heroPoster = document.getElementById('hero-poster');
  const soundToggle = document.getElementById('sound-toggle');

  // TBT fast path: this 33KB file is loaded site-wide via <script defer>
  // but ~95% of it is hero-video-specific logic (cycling, sound toggle,
  // viewport mode, battery detection, parallax). Non-home pages have no
  // #hero-video and were paying the full script-parse cost on every nav,
  // contributing to the 48-page TBT recommendation.
  // Bail early. Pages with a `data-lazy-video` element (blog posts) still
  // need an IntersectionObserver to play/pause those on scroll — do that
  // minimal setup inline before returning.
  if (!heroVideo) {
    const lazyVids = document.querySelectorAll('[data-lazy-video]:not(.background-video)');
    if (lazyVids.length) {
      const io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) e.target.play().catch(function () {});
          else e.target.pause();
        });
      }, { threshold: 0.25 });
      lazyVids.forEach(function (v) { io.observe(v); });
    }
    return;
  }
  
  // Performance optimization: Check for reduced motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Enhanced device and connection detection
  const isMobile = window.innerWidth <= 768;
  let shouldOptimizeForBattery = false;
  let shouldLoadVideos = false;
  let connectionQuality = 'unknown';
  let currentVideoIndex = 0;

  // Connection speed and data saver detection
  const detectConnectionQuality = () => {
    // Check for explicit data saver preference
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        if (connection.saveData) {
          connectionQuality = 'slow';
          return;
        }
        
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;

        // Determine connection quality
        if (effectiveType === '4g' && downlink > 5) {
          connectionQuality = 'fast';
        } else if (effectiveType === '4g' || (effectiveType === '3g' && downlink > 2)) {
          connectionQuality = 'medium';
        } else {
          connectionQuality = 'slow';
        }
      }
    }
    
    // Fallback: Check memory constraints
    if ('deviceMemory' in navigator && navigator.deviceMemory < 4) {
      connectionQuality = 'slow';
    }
  };
  
  // Apply static image fallback for hero and enterprise videos
  const applyStaticImageFallback = () => {
    // Hide all hero videos and show poster image
    const heroVideos = [heroVideo, heroVideo2, heroVideo3];
    heroVideos.forEach(video => {
      if (video) {
        video.style.display = 'none';
        video.pause();
      }
    });
    
    // Show hero poster image
    if (heroPoster) {
      heroPoster.style.display = 'block';
      heroPoster.style.opacity = '1';
    }
    
    // Hide all background videos in enterprise section
    const backgroundVideos = document.querySelectorAll('.background-video');
    backgroundVideos.forEach(video => {
      video.style.display = 'none';
      video.pause();
    });
    
    // Add static background class to enterprise section for CSS styling
    const enterpriseSection = document.querySelector('.enterprise-ai');
    if (enterpriseSection) {
      enterpriseSection.classList.add('static-images-mode');
    }
    
    // Hide sound toggle since no videos are playing
    if (soundToggle) {
      soundToggle.style.display = 'none';
      soundToggle.style.visibility = 'hidden';
      soundToggle.style.opacity = '0';
    }
  };
  
  // Determine if we should load videos
  const shouldLoadVideoContent = () => {
    detectConnectionQuality();

    // On mobile, always use static images for better performance
    if (isMobile) {
      return false;
    }

    // On desktop, check connection quality
    if (connectionQuality === 'slow') {
      return false;
    }

    // Good connection on desktop - load videos
    return true;
  };
  
  shouldLoadVideos = shouldLoadVideoContent();

  // Apply static image fallback if videos shouldn't load
  if (!shouldLoadVideos) {
    applyStaticImageFallback();
  }
  
  // Add viewport change listener for dynamic mobile/desktop switching
  let currentViewportMode = isMobile ? 'mobile' : 'desktop';
  window.addEventListener('resize', function() {
    const newIsMobile = window.innerWidth <= 768;
    const newMode = newIsMobile ? 'mobile' : 'desktop';
    
    if (currentViewportMode !== newMode) {
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
      }
    }
  });
  
  // On mobile, disable video cycling but keep all videos available
  if (isMobile) {
    shouldOptimizeForBattery = true;

    // Don't remove videos, just ensure they're hidden initially
    if (heroVideo2) {
      heroVideo2.style.opacity = '0';
      heroVideo2.style.display = 'block'; // Keep in DOM
    }
    if (heroVideo3) {
      heroVideo3.style.opacity = '0';
      heroVideo3.style.display = 'block'; // Keep in DOM
    }

    // Keep first video visible and playing
    if (heroVideo) {
      heroVideo.style.opacity = '1';
      heroVideo.style.display = 'block';
    }
    
    // Prevent video cycling logic from running
    window.isMobileVideoMode = true;
  }
  
  // Additional battery optimization for all devices
  if ('getBattery' in navigator) {
    navigator.getBattery().then(function(battery) {
      // If very low battery, force static images even on desktop with good connection
      if (battery.level < 0.2 && !battery.charging && shouldLoadVideos) {
        applyStaticImageFallback();
      }
    }).catch(() => {});
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
        video.play().catch(() => {});
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
      heroVideo.play().catch(() => {});

      // Show sound toggle for first video
      if (soundToggle) {
        soundToggle.style.display = 'block';
        soundToggle.textContent = heroVideo.muted ? 'Unmute' : 'Mute';
      }
    }
  }

  // Enhanced background video intersection observer for iOS compatibility
  const backgroundVideoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // iOS-specific video loading approach
        if (isMobile && /iPhone|iPad/.test(navigator.userAgent)) {
          // On real iOS devices, be more aggressive with video loading
          backgroundVideos.forEach(video => {
            if (video.readyState < 2) { // HAVE_CURRENT_DATA
              video.load(); // Force load on iOS
            }
          });

          // Try to start the currently active video with multiple attempts
          if (currentActiveVideo) {
            const tryPlayVideo = (attempts = 0) => {
              if (attempts > 3) {
                return;
              }

              currentActiveVideo.play()
                .then(() => {})
                .catch(() => {
                  // Retry after a short delay
                  setTimeout(() => tryPlayVideo(attempts + 1), 500);
                });
            };

            if (currentActiveVideo.paused) {
              tryPlayVideo();
            }
          }
        } else {
          // Standard approach for other devices
          if (currentActiveVideo && currentActiveVideo.paused) {
            currentActiveVideo.play().catch(() => {});
          }
        }
      } else {
        // Pause all background videos when container goes out of view
        backgroundVideos.forEach(video => video.pause());
      }
    });
  }, {
    threshold: 0.1, // Lower threshold for mobile devices
    rootMargin: '50px 0px' // Start loading before fully in view
  });

  // Observe the video container
  const videoContainer = document.querySelector('.video-background-container');
  if (videoContainer) {
    backgroundVideoObserver.observe(videoContainer);
  }

  // iOS-specific background video initialization after user interaction
  if (isMobile && /iPhone|iPad/.test(navigator.userAgent)) {
    let iosVideoInitialized = false;

    const initializeIOSBackgroundVideos = () => {
      if (iosVideoInitialized) return;
      iosVideoInitialized = true;

      backgroundVideos.forEach((video) => {
        // Force load each video
        video.load();

        video.addEventListener('canplay', () => {
          // If this is the default/active video and it's in view, try to play it
          if (video === currentActiveVideo) {
            const container = document.querySelector('.video-background-container');
            if (container) {
              const rect = container.getBoundingClientRect();
              if (rect.top < window.innerHeight && rect.bottom > 0) {
                video.play().catch(() => {});
              }
            }
          }
        });
      });
    };
    
    // Initialize after any user interaction with the page
    const userInteractionEvents = ['touchstart', 'touchend', 'click', 'scroll'];
    
    const initOnInteraction = () => {
      initializeIOSBackgroundVideos();
      // Remove listeners after first interaction
      userInteractionEvents.forEach(event => {
        document.removeEventListener(event, initOnInteraction, { passive: true });
      });
    };
    
    userInteractionEvents.forEach(event => {
      document.addEventListener(event, initOnInteraction, { passive: true });
    });
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
    // Disable parallax effect on mobile devices or reduced motion
    if (isMobile || prefersReducedMotion) {
      bottomPanels.forEach(panel => {
        panel.style.transform = '';
      });
      return;
    }
    
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
    let currentActiveHeroVideo = heroVideo;
    let isFirstPlaythrough = true;
    let isTransitioning = false; // Prevent duplicate transitions
    let video1MuteState = true; // Track Video 1's mute state (default muted)

    // Fallback: if the ended event doesn't fire for some reason, check periodically
    const fallbackCheck = setInterval(() => {
      if (heroVideo && heroVideo.duration > 0 && heroVideo.currentTime >= heroVideo.duration - 0.5 && !isTransitioning && currentVideoIndex === 0) {
        clearInterval(fallbackCheck);
        isFirstPlaythrough = false;
        switchToNextVideo();
      }
    }, 1000);

  function switchToNextVideo() {
    if (isTransitioning) {
      return;
    }
    
    isTransitioning = true;
    const currentVideo = heroVideos[currentVideoIndex];
    const nextIndex = (currentVideoIndex + 1) % heroVideos.length;
    const nextVideo = heroVideos[nextIndex];

    if (!nextVideo) {
      console.error(`Next video at index ${nextIndex} not found!`);
      isTransitioning = false;
      return;
    }

    // Disable loop on current video to prevent it from continuing
    if (currentVideo) {
      currentVideo.loop = false;
      currentVideo.pause(); // Ensure current video stops
    }

    // Immediately hide Video 1 if we're transitioning to Video 3 (prevents first-time flash)
    if (nextIndex === 2 && heroVideo) {
      heroVideo.style.opacity = '0';
      heroVideo.style.display = 'none';
      heroVideo.pause();
    }

    // Special handling for cycling back to video 1
    if (nextIndex === 0) {
      nextVideo.currentTime = 0; // Reset to beginning
      nextVideo.loop = false; // Don't loop when cycling back
      nextVideo.removeAttribute('loop'); // Ensure loop attribute is removed
      // Reset first playthrough flag so it can start the cycle again
      isFirstPlaythrough = false;
    }

    // Lazy load the next video
    nextVideo.preload = 'metadata';
    nextVideo.load();

    // Add error handler for video loading
    nextVideo.addEventListener('error', function(e) {
      console.error(`Error loading video ${nextIndex + 1}:`, e);
    }, { once: true });

    const loadHandler = function() {
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
            } else {
              soundToggle.style.display = 'none';
              // Auto-mute Videos 2 & 3
              nextVideo.muted = true;
            }
          }
          
          // Special handling: if we've cycled back to video 1, it should play once then continue cycle
          if (nextIndex === 0 && !isFirstPlaythrough) {
            // Add a safety timeout in case the ended event doesn't fire
            setTimeout(() => {
              if (currentVideoIndex === 0 && !isTransitioning) {
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
      loadHandler();
    } else {
      // Race loadeddata against a 3s timeout. If the video fetch stalls
      // (R2 slow, transient network, autoplay throttle), loadeddata never
      // fires and the cycle would freeze on the previous video's last
      // frame forever. The timeout lets the visual transition happen
      // anyway — the <video poster=…> attribute keeps the area filled
      // while the data is still in-flight.
      var ran = false;
      var runOnce = function () { if (!ran) { ran = true; loadHandler(); } };
      nextVideo.addEventListener('loadeddata', runOnce, { once: true });
      setTimeout(runOnce, 3000);
    }
  }

  if (heroVideo) {
    heroVideo.addEventListener('loadeddata', function() {
      if (heroPoster) heroPoster.style.display = 'none';
      heroVideo.style.display = 'block';
      if (soundToggle) {
        soundToggle.style.display = 'block'; // Always show for video 1 initially
      }

      // Don't set loop - let the video end naturally so the 'ended' event fires
      // and triggers the transition to the next video
      heroVideo.loop = false;
    });

    // Set up individual video ended handlers
    if (heroVideo) {
      heroVideo.addEventListener('ended', function() {
        if (isFirstPlaythrough) {
          isFirstPlaythrough = false;
          heroVideo.loop = false;
          switchToNextVideo();
        } else {
          switchToNextVideo();
        }
      });
    }

    if (heroVideo2) {
      heroVideo2.addEventListener('ended', function() {
        switchToNextVideo();
      });
    }

    if (heroVideo3) {
      heroVideo3.addEventListener('ended', function() {
        switchToNextVideo();
      });

      heroVideo3.addEventListener('timeupdate', function() {
        // Fallback: if video is very close to end but hasn't fired ended event
        if (heroVideo3.duration > 0 && (heroVideo3.currentTime >= heroVideo3.duration - 0.1) && !isTransitioning) {
          setTimeout(() => {
            if (currentVideoIndex === 2 && !isTransitioning) { // Still on video 3 and not transitioning
              switchToNextVideo();
            }
          }, 100);
        }
      });
    }
  }

  if (soundToggle && heroVideo) {
    soundToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      if (isMobile || window.isMobileVideoMode) {
        // iOS-specific video mute handling
        const currentMuteState = heroVideo.muted;
        
        try {
          // Direct mute toggle - more reliable on iOS
          if (currentMuteState) {
            heroVideo.muted = false;
            heroVideo.volume = 1.0;
            soundToggle.textContent = 'Mute';
          } else {
            heroVideo.muted = true;
            soundToggle.textContent = 'Unmute';
          }
          
          // Force video to start playing if it's not already (iOS requirement)
          if (heroVideo.paused) {
            heroVideo.play().catch(() => {});
          }

        } catch (error) {
          console.error('Mobile: Direct mute toggle failed:', error);
          // Fallback - try the play-then-mute approach
          heroVideo.play().then(() => {
            heroVideo.muted = !currentMuteState;
            heroVideo.volume = currentMuteState ? 1.0 : 0;
            soundToggle.textContent = currentMuteState ? 'Mute' : 'Unmute';
          }).catch(() => {});
        }
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
    // Ensure first video is visible and plays on mobile
    heroVideo.style.opacity = '1';
    heroVideo.style.display = 'block';
    
    // Simple play on mobile when in view
    const mobileVideoObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !prefersReducedMotion) {
          heroVideo.play().catch(() => {});

          // Show sound toggle for mobile video
          if (soundToggle) {
            soundToggle.style.display = 'block';
            soundToggle.style.visibility = 'visible';
            soundToggle.style.pointerEvents = 'auto';
            soundToggle.textContent = heroVideo.muted ? 'Unmute' : 'Mute';
          }
        } else {
          heroVideo.pause();
        }
      });
    }, { threshold: 0.25 });
    
    mobileVideoObserver.observe(heroVideo);
  }

  // Hero play button -> expanding video theater.
  // Replaces the old mute/unmute control (hero video 1 is now a silent encode).
  // CSS owns the hover reveal and the liquid blob growth; this only handles
  // opening and closing the theater.
  const heroPlay = document.getElementById('hero-play');
  const heroTheater = document.getElementById('hero-theater');

  // Runs on touch and on the desktop static-image fallback too, not just when the
  // cycling videos load: the panel plays a YouTube film the visitor explicitly
  // asks for, so it is worth offering wherever the hero renders at all.
  if (heroPlay && heroTheater) {
    const heroImage = heroPlay.closest('.hero-image');
    const stage = heroTheater.querySelector('.hero-theater-stage');
    const closeBtn = heroTheater.querySelector('.hero-theater-close');
    let isOpen = false;
    let revealRadius = 0;
    // Bumped on every open/close so a deferred callback from a superseded
    // transition can tell it is stale and bail out.
    let generation = 0;

    // The cycling videos are deliberately left running behind the theater. They
    // are silent and fully covered by an opaque panel, and the cycle is driven by
    // `ended` events plus timeout fallbacks — pausing it desyncs currentVideoIndex
    // from the visible video and the rotation never recovers.

    // Arms the CSS reveal: desktop fades the button in on hover/focus of the video
    // area, mobile shows it permanently over the static poster. Added from JS so
    // the button never appears on a page where the handlers did not bind.
    if (heroImage) heroImage.classList.add('hero-play-ready');

    // Point the reveal circle at the play button and return the radius that
    // reaches the theater's farthest corner, so the growth covers the whole box.
    function positionReveal() {
      const btn = heroPlay.getBoundingClientRect();
      const box = heroTheater.getBoundingClientRect();
      const cx = btn.left + btn.width / 2 - box.left;
      const cy = btn.top + btn.height / 2 - box.top;
      heroTheater.style.setProperty('--hero-theater-x', cx + 'px');
      heroTheater.style.setProperty('--hero-theater-y', cy + 'px');
      return Math.hypot(Math.max(cx, box.width - cx), Math.max(cy, box.height - cy));
    }

    // Matches the full-screen breakpoint in style.css. Only in that layout does
    // the theater actually cover the page, so only there is it truly modal.
    function isFullScreenTheater() {
      return typeof window.matchMedia === 'function' &&
             window.matchMedia('(max-width: 768px), (max-height: 480px)').matches;
    }

    // Focusable children of the dialog. The cross-origin iframe is included on
    // purpose: it is where the visitor tabs to reach YouTube's own controls.
    function theaterFocusables() {
      return Array.prototype.slice.call(
        heroTheater.querySelectorAll('button:not([disabled]), iframe, [href], [tabindex]:not([tabindex="-1"])')
      );
    }

    function onKeydown(e) {
      if (e.key === 'Escape') { closeTheater(); return; }
      // role="dialog" is a promise that focus stays inside. Without this, Tab
      // walks straight out of a full-screen overlay into the page behind it,
      // which a screen reader or keyboard user cannot see is still there.
      if (e.key !== 'Tab') return;
      var items = theaterFocusables();
      if (!items.length) return;
      var first = items[0];
      var last = items[items.length - 1];
      if (!heroTheater.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    // Scroll lock for the full-screen layout. Saves the prior inline value
    // rather than deleting the property, so it composes with anything else that
    // might lock scroll later. Deliberately overflow-on-body and not the
    // position:fixed trick, which resets scrollTop and would drop the visitor
    // back at the top of the page when the video closes.
    // The lock must go on <html>, not just <body>. The viewport takes its
    // overflow from the root element and only falls through to <body> when the
    // root is `overflow: visible` — and mobile-fixes.css sets
    // `html { overflow-x: hidden }` site-wide, so that fallthrough is off and a
    // body-only lock does nothing at all here.
    // The theater lives inside #main-content, which is `position: relative;
    // z-index: 1` — a stacking context. z-index inside it is only compared
    // against its siblings, so no value however large can lift the theater
    // above the fixed banner (z-index 100002) that sits outside it. The only
    // way out of a stacking context is to leave it, so for the full-screen
    // layout the dialog is portalled to <body> for the duration.
    //
    // The move MUST happen before the iframe is created: re-parenting a node
    // that contains an iframe reloads that iframe, which would restart the
    // video (and burn the user-gesture that lets YouTube autoplay with sound).
    // Closing tears the iframe down first, so the move back is safe too.
    var originalParent = null;
    var originalNextSibling = null;
    function portalToBody() {
      if (!isFullScreenTheater() || originalParent) return;
      originalParent = heroTheater.parentNode;
      originalNextSibling = heroTheater.nextSibling;
      document.body.appendChild(heroTheater);
    }
    function restorePortal() {
      if (!originalParent) return;
      originalParent.insertBefore(heroTheater, originalNextSibling);
      originalParent = null;
      originalNextSibling = null;
    }

    var priorOverflow = null;
    function lockPage() {
      if (!isFullScreenTheater() || priorOverflow !== null) return;
      priorOverflow = {
        root: document.documentElement.style.overflow,
        body: document.body.style.overflow
      };
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      heroTheater.setAttribute('aria-modal', 'true');
    }
    function unlockPage() {
      heroTheater.removeAttribute('aria-modal');
      if (priorOverflow === null) return;
      document.documentElement.style.overflow = priorOverflow.root;
      document.body.style.overflow = priorOverflow.body;
      priorOverflow = null;
    }

    // Run fn once the clip-path transition settles, or on a timeout if
    // transitionend never arrives. Skipped if another open/close superseded us.
    function afterReveal(token, fn) {
      let ran = false;
      const run = function (e) {
        if (ran) return;
        // Ignore bubbled transitions from the close button's opacity fade.
        if (e && (e.target !== heroTheater || e.propertyName !== 'clip-path')) return;
        ran = true;
        heroTheater.removeEventListener('transitionend', run);
        if (token === generation) fn();
      };
      heroTheater.addEventListener('transitionend', run);
      setTimeout(run, 1100);
    }

    function openTheater() {
      if (isOpen) return;
      isOpen = true;
      const token = ++generation;

      // Before the iframe exists — see portalToBody() for why the order matters.
      portalToBody();

      // Mounted synchronously inside the click handler, not after the reveal:
      // a cross-origin iframe only inherits the user gesture if it is created
      // during the activation window, and without it YouTube refuses to autoplay
      // unmuted and just sits on a spinner. Nothing is fetched before this point.
      if (!stage.firstElementChild) {
        const frame = document.createElement('iframe');
        frame.src = heroTheater.dataset.embed;
        frame.title = heroPlay.getAttribute('aria-label') || 'Video';
        frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        frame.allowFullscreen = true;
        frame.referrerPolicy = 'strict-origin-when-cross-origin';
        stage.appendChild(frame);
      }

      heroTheater.hidden = false;
      heroTheater.classList.remove('is-revealed');
      revealRadius = positionReveal();
      heroTheater.style.setProperty('--hero-theater-r', '0px');
      // Flush synchronously rather than waiting a frame: requestAnimationFrame is
      // paused while the tab is backgrounded or occluded, which would leave the
      // panel unopened until the tab is next painted. Reading offsetWidth commits
      // the 0px start value so the grow transitions instead of snapping.
      void heroTheater.offsetWidth;
      heroTheater.classList.add('is-open');
      heroTheater.style.setProperty('--hero-theater-r', revealRadius + 'px');

      heroPlay.setAttribute('aria-expanded', 'true');
      document.addEventListener('keydown', onKeydown);
      lockPage();
      if (closeBtn) closeBtn.focus();

      // Drop the clip once the reveal lands. Chrome renders a stale raster of the
      // clip circle for a live cross-origin iframe, so leaving clip-path on would
      // freeze the player as a small circle for the whole watch. During the growth
      // itself the player is still black, so the clipped frames cost nothing.
      afterReveal(token, function () {
        heroTheater.classList.add('is-revealed');
      });
    }

    function closeTheater() {
      if (!isOpen) return;
      isOpen = false;
      const token = ++generation;

      // Tear the player down first — it stops playback immediately, and it keeps
      // the iframe out of the collapsing (clipped) layer for the same reason as
      // the deferred mount above.
      stage.textContent = '';

      heroTheater.classList.remove('is-open');
      // Restore the clip at full radius and commit it before collapsing:
      // `none` → `circle()` is not interpolable, so without the reflow the panel
      // would snap out of existence instead of retracting into the play button.
      heroTheater.classList.remove('is-revealed');
      heroTheater.style.setProperty('--hero-theater-r', revealRadius + 'px');
      void heroTheater.offsetWidth;
      heroTheater.style.setProperty('--hero-theater-r', '0px');

      heroPlay.setAttribute('aria-expanded', 'false');
      document.removeEventListener('keydown', onKeydown);
      unlockPage();
      afterReveal(token, function () {
        heroTheater.hidden = true;
        // Only after the collapse has finished and the iframe is long gone.
        restorePortal();
      });
      heroPlay.focus();
    }

    heroPlay.addEventListener('click', function (e) {
      e.preventDefault();
      openTheater();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeTheater);

    // Keep the collapse target aimed at the play button if the hero reflows
    // mid-playback. Harmless while .is-revealed has the clip switched off.
    window.addEventListener('resize', function () {
      if (!isOpen) return;
      revealRadius = positionReveal();
      heroTheater.style.setProperty('--hero-theater-r', revealRadius + 'px');
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
        targetVideo.play().catch(() => {});
        targetVideo.classList.add('active');
        currentActiveVideo = targetVideo;
      }, 400); // Half of the 0.8s transition time for smooth crossfade
    }
  }

  panels.forEach((panel, index) => {
    panel.addEventListener('mouseenter', () => {
      enterpriseAiSection.classList.add(`hover-panel-${index + 1}`);
    });

    panel.addEventListener('mouseleave', () => {
      enterpriseAiSection.classList.remove(`hover-panel-${index + 1}`);
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
          otherQuestion.setAttribute('aria-expanded', 'false');
          const otherAnswer = otherQuestion.parentElement.querySelector('.faq-answer');
          if (otherAnswer) {
            otherAnswer.classList.remove('active');
          }
        }
      });

      // Toggle current FAQ item
      if (isActive) {
        this.classList.remove('active');
        this.setAttribute('aria-expanded', 'false');
        faqAnswer.classList.remove('active');
      } else {
        this.classList.add('active');
        this.setAttribute('aria-expanded', 'true');
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
    
    // Also set the first feature content as active
    const firstFeature = firstPage.getAttribute('data-feature');
    if (firstFeature) {
      const firstContent = document.querySelector(`.feature-content[data-feature="${firstFeature}"]`);
      if (firstContent) {
        firstContent.classList.add('active');
      }
    }
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
      
      // Simple class-based transitions - let CSS handle the animations
      featureContents.forEach(content => {
        content.classList.remove('active');
      });
      
      // Show the selected feature content with a small delay for smooth transition
      const targetContent = document.querySelector(`.feature-content[data-feature="${targetFeature}"]`);
      if (targetContent) {
        // Small delay to allow previous content to start fading out
        setTimeout(() => {
          targetContent.classList.add('active');
        }, 100);
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
  
  // Navigation button functionality
  function navigateToPage(direction) {
    if (!currentActivePage) return;
    
    const currentIndex = Array.from(journalPages).indexOf(currentActivePage);
    let newIndex = currentIndex;
    
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : journalPages.length - 1;
    } else if (direction === 'next') {
      newIndex = currentIndex < journalPages.length - 1 ? currentIndex + 1 : 0;
    }
    
    if (newIndex !== currentIndex) {
      journalPages[newIndex].click();
    }
  }
  
  // Add event listeners for navigation buttons
  const prevButtons = document.querySelectorAll('.nav-prev');
  const nextButtons = document.querySelectorAll('.nav-next');
  
  prevButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      navigateToPage('prev');
    });
  });
  
  nextButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      navigateToPage('next');
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

// Video Memory Management - Clean up videos when leaving page or hiding tab
(function() {
  function cleanupVideos() {
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(video => {
      // Pause video
      video.pause();

      // Remove source to release memory
      video.removeAttribute('src');
      video.load(); // This releases the memory
    });
  }

  function pauseAllVideos() {
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(video => {
      video.pause();
    });
  }

  // Handle tab visibility changes (switching tabs)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pauseAllVideos();
    }
  });

  // Handle page unload (navigation away, closing tab/window)
  window.addEventListener('pagehide', cleanupVideos);
  window.addEventListener('beforeunload', cleanupVideos);

  // Also handle back/forward cache (bfcache) on Safari/Firefox
  window.addEventListener('freeze', cleanupVideos);
})();