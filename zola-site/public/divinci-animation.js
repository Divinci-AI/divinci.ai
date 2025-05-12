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
            const container = document.querySelector('.media-container');
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
            const container = document.querySelector('.media-container');
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
            const container = document.querySelector('.media-container');
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
                // Adjusting the transform origin for better rotation mechanics
                gsap.set(leftArm, { transformOrigin: "124px 224px" });  // Left shoulder
                gsap.set(rightArm, { transformOrigin: "276px 224px" }); // Right shoulder

                // Get media elements
                const mediaElements = document.querySelectorAll('.media-element');
                console.log('Media elements:', mediaElements);

                // Get play button
                const playButton = document.getElementById('play-button');
                console.log('Play button:', playButton);

                // Create GSAP timeline
                const timeline = gsap.timeline({ paused: true });

                // Add animations to timeline
                // Media Elements Animation
                function animateMediaElements(timeline) {
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
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        stagger: {
                            each: 0.15,
                            from: "random"
                        },
                        duration: 1.5,
                        ease: "power2.out",
                        onStart: () => {
                            // Add glowing effect to some random file elements
                            document.querySelectorAll('.media-element.file').forEach((el, index) => {
                                if (index % 2 === 0) {
                                    el.classList.add('glowing');
                                }
                                
                                // Add slight randomness to size
                                if (index % 3 === 0) {
                                    el.classList.add('small');
                                } else if (index % 3 === 1) {
                                    el.classList.add('large');
                                }
                            });
                        }
                    }, 0.5);

                    // Only proceed with other animations if media elements exist
                    if (document.querySelectorAll('.media-element.video').length === 0 &&
                        document.querySelectorAll('.media-element.audio').length === 0) {
                        return;
                    }

                    // Animate video elements (from top)
                    timeline.to('.media-element.video', {
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        stagger: {
                            each: 0.2,
                            from: "random"
                        },
                        duration: 1.5,
                        ease: "back.out(1.2)",
                        onStart: () => {
                            // Add glowing effect to some random video elements
                            document.querySelectorAll('.media-element.video').forEach((el, index) => {
                                if (index % 2 === 1) {
                                    el.classList.add('glowing');
                                }
                            });
                        }
                    }, 0.8);

                    // Animate audio elements (from right)
                    timeline.to('.media-element.audio', {
                        x: 0,
                        y: 0,
                        opacity: 1,
                        scale: 1,
                        stagger: {
                            each: 0.25,
                            from: "random"
                        },
                        duration: 1.5,
                        ease: "power3.out",
                        onStart: () => {
                            // Add glowing effect to some random audio elements
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
                            // Remove glow effects
                            document.querySelectorAll('.media-element.glowing').forEach(el => {
                                el.classList.remove('glowing');
                            });
                        }
                    }, 4.5);
                }
            } catch (err) {
                console.error('Error in initAnimation:', err);
            }
        }
    } catch (err) {
        console.error('Error in divinci-animation.js:', err);
    }
});
