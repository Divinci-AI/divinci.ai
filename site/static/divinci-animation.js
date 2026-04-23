document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded');

    try {
        // Register GSAP plugins if available
        if (typeof gsap !== 'undefined' && typeof MotionPathPlugin !== 'undefined') {
            gsap.registerPlugin(MotionPathPlugin);
        } else {
            console.log('GSAP or MotionPathPlugin not available');
            return; // Exit early if dependencies are missing
        }

        // Wait for the SVG to load
        const robotObject = document.getElementById('divinci-robot');
        console.log('Robot object:', robotObject);

        // Only proceed if robot object exists
        if (!robotObject) {
            console.log('Robot object not found, skipping animation');
            return;
        }

        robotObject.addEventListener('load', initAnimation);
        console.log('Added load event listener to robot object');

        // Create orbit paths for visual enhancement
        function createOrbitPaths() {
            const container = document.querySelector('.media-elements');
            if (!container) return;
            
            const centerX = container.offsetWidth / 2;
            const centerY = container.offsetHeight / 2;
            
            // Create multiple orbit paths at different distances
            const orbits = [150, 250, 350];
            
            orbits.forEach(radius => {
                const orbit = document.createElement('div');
                orbit.className = 'orbit-path';
                orbit.style.width = `${radius * 2}px`;
                orbit.style.height = `${radius * 2}px`;
                orbit.style.left = `${centerX - radius}px`;
                orbit.style.top = `${centerY - radius}px`;
                container.appendChild(orbit);
                
                // Animate orbit paths into view after a delay
                setTimeout(() => {
                    orbit.classList.add('visible');
                }, 500 + radius);
            });
        }

        // Enhanced particle effect function with circular particles
        function createParticles(x, y, count = 10) {
            const container = document.querySelector('.media-elements');
            if (!container) return;
            
            for (let i = 0; i < count; i++) {
                const size = Math.random() * 5 + 3; // Slightly larger particles
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.left = `${x}px`;
                particle.style.top = `${y}px`;
                container.appendChild(particle);
                
                // Calculate random direction for particle movement
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 50 + 30;
                const distance = Math.random() * 100 + 50;
                
                // Animate particle outward in a circular pattern
                setTimeout(() => {
                    particle.style.transform = `translate(
                        ${Math.cos(angle) * distance}px,
                        ${Math.sin(angle) * distance}px
                    )`;
                    particle.style.opacity = '0';
                }, 10);
                
                // Remove particle after animation completes
                setTimeout(() => {
                    particle.remove();
                }, 1000);
            }
        }

        // Add pulse effect when activating media elements
        function addPulseEffect(x, y) {
            const container = document.querySelector('.media-elements');
            if (!container) return;
            
            const pulse = document.createElement('div');
            pulse.className = 'pulse-circle';
            pulse.style.width = '50px';
            pulse.style.height = '50px';
            pulse.style.left = `${x - 25}px`;
            pulse.style.top = `${y - 25}px`;
            
            container.appendChild(pulse);
            
            // Remove pulse element after animation completes
            setTimeout(() => {
                pulse.remove();
            }, 2000);
        }

        // Initialize animation once SVG is loaded
        function initAnimation() {
            console.log('SVG loaded, initializing animation');

            try {
                // Get the SVG document
                const svgDoc = robotObject.contentDocument;
                if (!svgDoc) {
                    console.log('SVG document not found, skipping animation');
                    return;
                }
                
                console.log('SVG document:', svgDoc);

                // Get robot parts for animation
                const leftArm = svgDoc.getElementById('left-arm');
                const rightArm = svgDoc.getElementById('right-arm');
                const leftAntenna = svgDoc.getElementById('left-antenna');
                const rightAntenna = svgDoc.getElementById('right-antenna');
                const heart = svgDoc.getElementById('heart');

                // Check if all required elements exist
                if (!leftArm || !rightArm || !leftAntenna || !rightAntenna || !heart) {
                    console.log('Required robot parts missing, skipping animation');
                    return;
                }

                console.log('Robot parts:', {
                    leftArm,
                    rightArm,
                    leftAntenna,
                    rightAntenna,
                    heart
                });

                // Set transform origins for arms at their shoulder joints
                gsap.set(leftArm, { transformOrigin: "124px 224px" });  
                gsap.set(rightArm, { transformOrigin: "276px 224px" }); 

                // Get media elements
                const mediaElements = document.querySelectorAll('.media-element');
                console.log('Media elements:', mediaElements);

                // Note: Play button removed - animation runs automatically

                // Create GSAP timeline
                const timeline = gsap.timeline({ paused: true });

                // Add animations to timeline
                function animateMediaElements(timeline) {
                    // Calculate dynamic center position
                    const container = document.querySelector('.animation-container');
                    const robotContainer = document.querySelector('.robot-container');
                    if (!container || !robotContainer) return;
                    
                    const containerRect = container.getBoundingClientRect();
                    const robotRect = robotContainer.getBoundingClientRect();
                    
                    // Calculate the center of the robot's chest area relative to the container
                    const centerX = (robotRect.left + robotRect.width/2) - containerRect.left - 25; // Adjusted: -15 - 10 = -25px (more left)
                    const centerY = (robotRect.top + robotRect.height/2) - containerRect.top + 60;  // Adjusted: 50 + 10 = 60px down
                    
                    // Set initial positions based on data attributes
                    document.querySelectorAll('.media-element').forEach(element => {
                        const startX = element.getAttribute('data-start-x');
                        const startY = element.getAttribute('data-start-y');
                        
                        // Apply initial position
                        gsap.set(element, {
                            x: startX,
                            y: startY,
                            opacity: 0,
                            scale: 0.8
                        });
                    });

                    // Animate file elements (from left)
                    timeline.to('.media-element.file', {
                        x: centerX,
                        y: centerY,
                        opacity: 1,
                        scale: 1,
                        stagger: {
                            each: 0.15,
                            from: "random"
                        },
                        duration: 1.5,
                        ease: "power2.out",
                        onStart: () => {
                            document.querySelectorAll('.media-element.file').forEach((el, index) => {
                                if (index % 2 === 0) {
                                    el.classList.add('glowing');
                                }
                                
                                if (index % 3 === 0) {
                                    el.classList.add('small');
                                } else if (index % 3 === 1) {
                                    el.classList.add('large');
                                }
                            });
                        }
                    }, 0.5);

                    // Animate video elements (from top)
                    timeline.to('.media-element.video', {
                        x: centerX,
                        y: centerY,
                        opacity: 1,
                        scale: 1,
                        stagger: {
                            each: 0.2,
                            from: "random"
                        },
                        duration: 1.5,
                        ease: "back.out(1.2)",
                        onStart: () => {
                            document.querySelectorAll('.media-element.video').forEach((el, index) => {
                                if (index % 2 === 1) {
                                    el.classList.add('glowing');
                                }
                            });
                        }
                    }, 0.8);

                    // Animate audio elements (from right)
                    timeline.to('.media-element.audio', {
                        x: centerX,
                        y: centerY,
                        opacity: 1,
                        scale: 1,
                        stagger: {
                            each: 0.25,
                            from: "random"
                        },
                        duration: 1.5,
                        ease: "power3.out",
                        onStart: () => {
                            document.querySelectorAll('.media-element.audio').forEach((el, index) => {
                                if (index % 2 === 0) {
                                    el.classList.add('glowing');
                                }
                            });
                        }
                    }, 1.1);

                    // Add delay to fade out
                    timeline.to({}, { duration: 3 }, 1.5);

                    // Fade out all elements
                    timeline.to('.media-element', {
                        opacity: 0,
                        stagger: 0.1,
                        duration: 0.5,
                        ease: "power3.in",
                        onComplete: () => {
                            document.querySelectorAll('.media-element.glowing').forEach(el => {
                                el.classList.remove('glowing');
                            });
                        }
                    }, 4.5);
                }

                // Call the animateMediaElements function if it exists
                if (mediaElements && mediaElements.length > 0) {
                    animateMediaElements(timeline);
                }

                // Add robot animation only if all parts exist
                if (leftAntenna && rightAntenna && leftArm && rightArm && heart) {
                    // Divinci responds - antennas tilt outward
                    timeline.to(leftAntenna, {
                        rotate: -45,
                        duration: 1.5,
                        ease: "elastic.out(1, 0.5)"
                    }, 1);

                    timeline.to(rightAntenna, {
                        rotate: 45,
                        duration: 1.5,
                        ease: "elastic.out(1, 0.5)"
                    }, 1);

                    // Arms raise - natural lifting motion
                    timeline.to(leftArm, {
                        rotation: -30,
                        y: -40,
                        x: 10,
                        duration: 1.5,
                        ease: "power2.out"
                    }, 1.2);

                    timeline.to(rightArm, {
                        rotation: 30,
                        y: -40,
                        x: -10,
                        duration: 1.5,
                        ease: "power2.out"
                    }, 1.2);

                    // Media reception - elements shrink and fade
                    if (mediaElements && mediaElements.length > 0) {
                        timeline.to(mediaElements, {
                            scale: 0.1,
                            opacity: 0,
                            duration: 0.5,
                            stagger: 0.1,
                            ease: "power3.in"
                        }, 2.5);
                    }

                    // Heart pulses to indicate processing
                    timeline.to(heart, {
                        scale: 1.3,
                        fill: "#ff5555",
                        duration: 0.5,
                        repeat: 3,
                        yoyo: true,
                        ease: "sine.inOut"
                    }, 3);

                    // Add glow effect to the robot
                    timeline.to('.robot-container', {
                        className: '+=glow',
                        duration: 0.5
                    }, 3);

                    // Return to neutral position
                    timeline.to([leftAntenna, rightAntenna], {
                        rotate: 0,
                        duration: 1.5,
                        ease: "elastic.out(1, 0.5)"
                    }, 5);
                    
                    timeline.to(leftArm, {
                        rotation: 0,
                        x: 0,
                        y: 0,
                        duration: 1.5,
                        ease: "elastic.out(1, 0.5)"
                    }, 5);
                    
                    timeline.to(rightArm, {
                        rotation: 0,
                        x: 0,
                        y: 0,
                        duration: 1.5,
                        ease: "elastic.out(1, 0.5)"
                    }, 5);

                    // Remove glow effect
                    timeline.to('.robot-container', {
                        className: '-=glow',
                        duration: 0.5
                    }, 6);
                }

                // Function to play animation with auto-restart
                function playAnimationWithAutoRestart() {
                    timeline.play(0);
                    createOrbitPaths();
                    
                    // Set up next play after animation completes + 3 seconds
                    timeline.eventCallback("onComplete", () => {
                        setTimeout(() => {
                            playAnimationWithAutoRestart();
                        }, 3000); // 3 seconds after animation completes
                    });
                }

                // Start the auto-play cycle
                playAnimationWithAutoRestart();

                // Play button removed - animation runs automatically
            } catch (err) {
                console.error('Error in initAnimation:', err);
            }
        }
    } catch (err) {
        console.error('Error in divinci-animation.js:', err);
    }
});