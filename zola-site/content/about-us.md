+++
title = "About Us | Divinci AI"
description = "Divinci AI is building the future of human-AI collaboration. Learn about our mission, vision, team, and the story behind our innovative AI platform."
template = "page.html"
+++

<style>
/* About page specific styles */
.about-hero {
    background: linear-gradient(135deg, #16214c 0%, #254284 100%);
    color: white;
    padding: 6rem 0;
    position: relative;
    overflow: hidden;
}

.about-hero::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    border: 2px solid rgba(92, 226, 231, 0.15);
    opacity: 0.4;
    z-index: 0;
}

.about-hero::after {
    content: '';
    position: absolute;
    bottom: -150px;
    left: -150px;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    border: 2px solid rgba(92, 226, 231, 0.15);
    opacity: 0.3;
    z-index: 0;
}

.about-hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
}

.about-title {
    font-size: 3rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: white;
}

.about-subtitle {
    font-size: 1.2rem;
    max-width: 800px;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.9);
    line-height: 1.6;
}

.mission-section, .vision-section, .team-section, .values-section {
    padding: 5rem 0;
    position: relative;
}

.story-section {
    padding: 5rem 0;
    position: relative;
    background: linear-gradient(135deg, #16214c 0%, #254284 100%);
    color: white;
}

.story-timeline {
    position: relative;
    max-width: 1200px;
    margin: 3rem auto 0;
}

.story-timeline::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 2px;
    height: 100%;
    background: linear-gradient(to bottom, #16214c, #5ce2e7);
    transform: translateX(-50%);
}

.timeline-item {
    position: relative;
    width: 50%;
    padding: 0 2.5rem 4rem;
}

.timeline-item:nth-child(even) {
    margin-left: 50%;
}

.timeline-item::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #5ce2e7;
    transform: translateX(-50%);
}

.timeline-item:nth-child(even)::before {
    left: -2.5rem;
}

.timeline-date {
    display: inline-block;
    padding: 0.5rem 1rem;
    background-color: rgba(92, 226, 231, 0.1);
    border-radius: 20px;
    font-weight: 600;
    color: #16214c;
    margin-bottom: 1rem;
    border: 1px solid rgba(92, 226, 231, 0.3);
}

.story-section .timeline-date {
    color: white;
    background-color: rgba(92, 226, 231, 0.2);
    border: 1px solid rgba(92, 226, 231, 0.5);
}

.timeline-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #16214c;
    margin-bottom: 1rem;
}

.story-section .timeline-title {
    color: white;
}

.timeline-content {
    background-color: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
}

.timeline-content p {
    color: #444;
}

.section-title {
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 2rem;
    background: linear-gradient(to right, #ffffff, #5ce2e7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: inline-block;
    text-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
}

.section-content {
    font-size: 1.1rem;
    line-height: 1.7;
    color: #444;
}

/* Ensure text is visible on dark backgrounds */
.story-section .section-content,
.join-team-section .section-content {
    color: rgba(255, 255, 255, 0.9) !important;
}

/* Make sure the section content directly below section titles is visible */
.story-section h2.section-title + p.section-content {
    color: rgba(255, 255, 255, 0.9) !important;
    font-weight: 500;
}

.mission-vision-container {
    display: flex;
    flex-wrap: wrap;
    gap: 2rem;
}

.mission-card, .vision-card {
    flex: 1;
    min-width: 300px;
    background-color: white;
    border-radius: 12px;
    padding: 2.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    position: relative;
    overflow: hidden;
}

.mission-card::before, .vision-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 5px;
    height: 100%;
    background: linear-gradient(to bottom, #16214c, #5ce2e7);
}

.card-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #16214c;
    margin-bottom: 1.5rem;
}

.card-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: rgba(92, 226, 231, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    color: #16214c;
    font-size: 1.5rem;
}

.values-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.value-card {
    background-color: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    transition: transform 0.3s ease;
    display: flex;
    flex-direction: column;
    height: 100%;
}

.value-card:hover {
    transform: translateY(-5px);
}

.value-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: rgba(92, 226, 231, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.5rem;
    color: #16214c;
    font-size: 1.5rem;
}

.value-title {
    font-size: 1.2rem;
    font-weight: 700;
    color: #16214c;
    margin-bottom: 1rem;
}

.value-description {
    font-size: 0.95rem;
    color: #444;
    line-height: 1.6;
    flex-grow: 1;
}

.team-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.team-member {
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.team-member:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.12);
}

.member-image {
    width: 100%;
    height: 250px;
    object-fit: cover;
    border-bottom: 3px solid #5ce2e7;
}

.member-info {
    padding: 1.5rem;
}

.member-name {
    font-size: 1.2rem;
    font-weight: 700;
    color: #16214c;
    margin-bottom: 0.5rem;
}

.member-title {
    color: #666;
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.member-bio {
    font-size: 0.9rem;
    color: #444;
    line-height: 1.6;
}

.member-social {
    display: flex;
    gap: 0.75rem;
    margin-top: 1rem;
}

.member-social a {
    width: 35px;
    height: 35px;
    border-radius: 50%;
    background-color: rgba(92, 226, 231, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #16214c;
    transition: all 0.3s ease;
}

.member-social a:hover {
    background-color: #16214c;
    color: white;
}

.join-team-section {
    background: linear-gradient(135deg, #16214c 0%, #254284 100%);
    color: white;
    padding: 4rem 0;
    text-align: center;
    position: relative;
    overflow: hidden;
}

.join-title {
    font-size: 2.2rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: white;
}

.join-description {
    font-size: 1.1rem;
    max-width: 800px;
    margin: 0 auto 2rem;
    color: rgba(255, 255, 255, 0.9);
}

.join-button {
    display: inline-block;
    padding: 1rem 2rem;
    background-color: white;
    color: #16214c;
    border-radius: 50px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
    border: none;
}

.join-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
    color: #16214c;
}

/* Responsive adjustments */
@media screen and (max-width: 768px) {
    .about-title {
        font-size: 2.2rem;
    }

    .section-title {
        font-size: 1.8rem;
    }

    .timeline-item {
        width: 100%;
        margin-left: 0 !important;
        padding: 0 0 4rem 2.5rem;
    }

    .story-timeline::before {
        left: 0;
    }

    .timeline-item::before {
        left: 0;
        transform: none;
    }

    .timeline-item:nth-child(even)::before {
        left: 0;
    }
}
</style>

<!-- Hero Section -->
<section class="about-hero">
    <div class="container">
        <div class="about-hero-content">
            <h1 class="about-title">About Divinci AI</h1>
            <p class="about-subtitle">We're building the future of human-AI collaboration, empowering organizations to create custom AI solutions that transform how we learn, work, and innovate.</p>
        </div>
    </div>
</section>

<!-- Mission & Vision Section -->
<section class="mission-section">
    <div class="container">
        <div class="mission-vision-container">
            <div class="mission-card">
                <div class="card-icon">
                    <i class="fas fa-rocket"></i>
                </div>
                <h2 class="card-title">Our Mission</h2>
                <p class="section-content">
                    At Divinci AI, our mission is to democratize artificial intelligence by making it accessible, customizable, and valuable for businesses of all sizes. We're dedicated to accelerating human discovery through innovative AI solutions that enhance learning, creativity, and decision-making.
                </p>
            </div>

            <div class="vision-card">
                <div class="card-icon">
                    <i class="fas fa-eye"></i>
                </div>
                <h2 class="card-title">Our Vision</h2>
                <p class="section-content">
                    We envision a future where AI amplifies human potential rather than replacing it. Our platform enables organizations to create purpose-built AI applications that solve specific challenges, driving innovation and efficiency while maintaining the human touch that makes businesses unique.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Values Section -->
<section class="values-section">
    <div class="container">
        <h2 class="section-title">Our Core Values</h2>
        <p class="section-content">
            These principles guide everything we do at Divinci AI, from product development to customer relationships.
        </p>

        <div class="values-grid">
            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-user-shield"></i>
                </div>
                <h3 class="value-title">Human-Centered AI</h3>
                <p class="value-description">
                    We design AI systems that enhance human capabilities rather than replace them, focusing on collaboration between people and technology.
                </p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <h3 class="value-title">Innovation with Purpose</h3>
                <p class="value-description">
                    We pursue technological advancement not for its own sake, but to solve real problems and create meaningful impact for our customers.
                </p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-shield-alt"></i>
                </div>
                <h3 class="value-title">Responsible AI</h3>
                <p class="value-description">
                    We're committed to developing AI responsibly, with strong ethical guidelines, transparency, and safeguards against potential harms.
                </p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-users"></i>
                </div>
                <h3 class="value-title">Inclusive Design</h3>
                <p class="value-description">
                    We build for everyone, ensuring our technology is accessible, understandable, and beneficial across diverse user groups and use cases.
                </p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-lock"></i>
                </div>
                <h3 class="value-title">Security First</h3>
                <p class="value-description">
                    Data protection and privacy are foundational to our platform, with enterprise-grade security built into every layer of our technology.
                </p>
            </div>

            <div class="value-card">
                <div class="value-icon">
                    <i class="fas fa-handshake"></i>
                </div>
                <h3 class="value-title">Customer Partnership</h3>
                <p class="value-description">
                    We view our relationships with customers as long-term partnerships, collaborating closely to ensure their success with our platform.
                </p>
            </div>
        </div>
    </div>
</section>

<!-- Team Section -->
<section class="team-section">
    <div class="container">
        <h2 class="section-title">Meet Our Team</h2>
        <p class="section-content">
            Divinci AI is built by a diverse team of AI researchers, software engineers, product designers, and industry experts committed to making AI accessible and valuable for businesses.
        </p>

        <div class="team-grid">
            <div class="team-member">
                <img src="/images/Michael-Mooring.jpeg" alt="Michael Mooring" class="member-image">
                <div class="member-info">
                    <h3 class="member-name">Michael Mooring</h3>
                    <p class="member-title">Founder & CEO</p>
                    <p class="member-bio">
                        Michael brings over 15 years of experience in software development and AI research. He founded Divinci AI with a mission to democratize AI for businesses of all sizes.
                    </p>
                    <div class="member-social">
                        <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                    </div>
                </div>
            </div>

            <div class="team-member">
                <img src="/images/sam-tobia.jpg" alt="Samuel Tobia" class="member-image">
                <div class="member-info">
                    <h3 class="member-name">Samuel Tobia</h3>
                    <p class="member-title">CTO</p>
                    <p class="member-bio">
                        Sam leads Divinci AI's technical strategy and development, with over 15 years of software experience and expertise in machine learning, natural language processing, and scalable systems.
                    </p>
                    <div class="member-social">
                        <a href="https://www.linkedin.com/in/sam-tobia-1aa2762b/" aria-label="LinkedIn" target="_blank"><i class="fab fa-linkedin-in"></i></a>
                        <a href="#" aria-label="GitHub"><i class="fab fa-github"></i></a>
                    </div>
                </div>
            </div>

            <div class="team-member">
                <img src="/images/sierra-hooshiari.jpeg" alt="Sierra Hooshiari" class="member-image">
                <div class="member-info">
                    <h3 class="member-name">Sierra Hooshiari</h3>
                    <p class="member-title">VP of Customer Success</p>
                    <p class="member-bio">
                        Sierra leads our customer success team, ensuring organizations achieve their goals with Divinci AI and receive exceptional support throughout their journey.
                    </p>
                    <div class="member-social">
                        <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Our Story Section -->
<section class="story-section">
    <div class="container">
        <h2 class="section-title">Our Story</h2>
        <p class="section-content">
            The journey of Divinci AI from concept to reality, driven by our passion for making AI accessible and valuable.
        </p>

        <div class="story-timeline">
            <div class="timeline-item">
                <span class="timeline-date">2023</span>
                <h3 class="timeline-title">The Beginning</h3>
                <div class="timeline-content">
                    <p>Divinci AI was founded with a clear vision: to democratize AI technology for businesses of all sizes. After experiencing the transformative potential of large language models, our founders recognized that many organizations lacked the expertise to implement custom AI solutions effectively.</p>
                </div>
            </div>

            <div class="timeline-item">
                <span class="timeline-date">Q3 2023</span>
                <h3 class="timeline-title">First Prototype</h3>
                <div class="timeline-content">
                    <p>The development of our core technology began, focusing on building a platform that would make creating and deploying custom AI solutions intuitive and accessible without requiring deep technical expertise in machine learning.</p>
                </div>
            </div>

            <div class="timeline-item">
                <span class="timeline-date">Q1 2024</span>
                <h3 class="timeline-title">Beta Launch</h3>
                <div class="timeline-content">
                    <p>We launched our closed beta program with a select group of partner companies across various industries. Their valuable feedback helped us refine our platform and understand the diverse needs of different business sectors.</p>
                </div>
            </div>

            <div class="timeline-item">
                <span class="timeline-date">Q3 2024</span>
                <h3 class="timeline-title">Official Launch</h3>
                <div class="timeline-content">
                    <p>After extensive testing and refinement, Divinci AI officially launched to the public. Our platform's intuitive interface and powerful capabilities quickly gained traction among businesses looking to implement custom AI solutions.</p>
                </div>
            </div>

            <div class="timeline-item">
                <span class="timeline-date">Today</span>
                <h3 class="timeline-title">Growing and Evolving</h3>
                <div class="timeline-content">
                    <p>Divinci AI continues to grow and evolve, with new features and capabilities being added regularly. We're working with organizations of all sizes to transform their operations through custom AI, while building a community of forward-thinking businesses driving innovation in their industries.</p>
                </div>
            </div>
        </div>
    </div>
</section>

<!-- Join Our Team Section -->
<section class="join-team-section">
    <div class="container">
        <h2 class="join-title">Join Our Team</h2>
        <p class="join-description">
            We're always looking for talented individuals passionate about AI and its potential to transform businesses. Join us in building the future of human-AI collaboration.
        </p>
        <a href="/careers" class="join-button">View Open Positions</a>
    </div>
</section>
