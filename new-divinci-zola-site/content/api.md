+++
title = "API Reference | Divinci AI"
description = "Divinci AI API documentation provides comprehensive guides and reference material for integrating custom AI solutions into your applications."
template = "feature.html"
+++

<style>
/* API Page Styles */
.api-hero {
    background: linear-gradient(135deg, #2d3c34 0%, #1e3a2b 100%);
    color: white;
    padding: 6rem 0;
    position: relative;
    overflow: hidden;
}

.api-hero::before {
    content: '';
    position: absolute;
    top: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    border: 2px solid rgba(126, 141, 149, 0.15);
    opacity: 0.4;
    z-index: 0;
}

.api-hero::after {
    content: '';
    position: absolute;
    bottom: -150px;
    left: -150px;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    border: 2px solid rgba(126, 141, 149, 0.15);
    opacity: 0.3;
    z-index: 0;
}

.api-hero-content {
    position: relative;
    z-index: 1;
    text-align: center;
    max-width: 800px;
    margin: 0 auto;
}

.api-title {
    font-family: 'Fraunces', serif;
    font-size: 3.5rem;
    font-weight: 700;
    margin-bottom: 2rem;
    background: linear-gradient(90deg, #ffffff, #7e8d95);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: inline-block;
}

.api-subtitle {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 1.3rem;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 2.5rem;
    line-height: 1.6;
}

.api-section {
    padding: 5rem 0;
    position: relative;
}

.section-title {
    font-family: 'Fraunces', serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e3a2b;
    margin-bottom: 2rem;
    text-align: center;
}

.section-content {
    font-family: 'Source Sans 3', sans-serif;
    font-size: 1.1rem;
    line-height: 1.7;
    text-align: center;
    color: #2d3c34;
    max-width: 800px;
    margin: 0 auto 3rem;
}

.coming-soon {
    background: white;
    border-radius: 15px;
    padding: 3rem;
    text-align: center;
    margin-bottom: 4rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
    border: 1px solid rgba(126, 141, 149, 0.1);
}

.coming-soon-title {
    font-family: 'Fraunces', serif;
    font-size: 2rem;
    font-weight: 700;
    color: #1e3a2b;
    margin-bottom: 1rem;
}

.coming-soon-message {
    font-family: 'Source Sans 3', sans-serif;
    color: #2d3c34;
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto 2rem;
}

.notify-button {
    font-family: 'Source Sans 3', sans-serif;
    display: inline-flex;
    align-items: center;
    padding: 1rem 2rem;
    background: linear-gradient(135deg, #2d3c34, #1e3a2b);
    color: white;
    border-radius: 50px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s;
    border: none;
}

.notify-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 25px rgba(45, 60, 52, 0.3);
    color: white;
}

.notify-button i {
    margin-right: 0.75rem;
}

/* Coming Soon Overlay for API Content */
.api-content-wrapper {
    position: relative;
    min-height: 400px;
    margin-bottom: 8rem;
    padding-bottom: 4rem;
}

/* Position overlay at the top of the section */
.api-content-wrapper::after {
    content: "API Documentation Available Q3 2025" !important;
    position: absolute !important;
    top: 2rem !important;
    left: 50% !important;
    transform: translateX(-50%) rotate(-8deg) !important;
    width: 90% !important;
    max-width: 600px !important;
    padding: 2rem !important;
    background: rgba(248, 244, 240, 0.92) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 1.5rem !important;
    font-weight: 700 !important;
    color: #1e3a2b !important;
    text-align: center !important;
    z-index: 1 !important; /* Lower z-index so it doesn't cover content */
    border: none !important;
    border-radius: 12px !important;
    box-shadow: 0 8px 20px rgba(0,0,0,0.15) !important;
    pointer-events: none !important;
}

/* Mobile adjustments */
@media screen and (max-width: 768px) {
    .api-title {
        font-size: 2.5rem;
    }
    
    .api-hero {
        padding: 4rem 0;
    }
    
    .section-title {
        font-size: 2rem;
    }
    
    .api-content-wrapper {
        margin-bottom: 4rem;
        padding-bottom: 2rem;
        min-height: 300px;
    }
    
    .api-content-wrapper::after {
        font-size: 1.2rem !important;
        transform: translateX(-50%) rotate(-5deg) !important;
        width: 85% !important;
        max-width: 400px !important;
        padding: 1.5rem !important;
        top: 1rem !important;
    }
}

@media screen and (max-width: 480px) {
    .api-title {
        font-size: 2rem;
    }
    
    .coming-soon {
        margin: 0 1rem 3rem;
        padding: 2rem;
    }
    
    .api-content-wrapper {
        min-height: 250px;
        margin-bottom: 3rem;
        padding-bottom: 1rem;
    }
    
    .api-content-wrapper::after {
        font-size: 1rem !important;
        padding: 1rem !important;
        width: 80% !important;
        max-width: 280px !important;
        transform: translateX(-50%) rotate(-3deg) !important;
        bottom: 0.5rem !important;
    }
}
</style>

<section class="api-hero" style="padding-top: 6rem; padding-bottom: 6rem;">
<div class="container">
<div class="api-hero-content">
<h1 class="api-title">Complete API Documentation Coming Soon</h1>
<p class="api-subtitle">Integrate powerful AI capabilities into your applications with our comprehensive API. Build custom AI solutions that leverage RAG systems, vector embeddings, and document processing.</p>
</div>
</div>
</section>

<!-- API Content with Coming Soon Overlay -->
<div class="api-content-wrapper">

<!-- Coming Soon Section -->
<section class="api-section" style="margin-top: 6rem;">
    <div class="container">
        <div class="coming-soon">
            <h2 class="coming-soon-title">Complete API Documentation Coming Soon</h2>
            <p class="coming-soon-message">We're currently building comprehensive API documentation including reference guides, code examples, and SDK documentation. Check back soon for updates or subscribe to be notified when our API documentation is available.</p>
            <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="notify-button" target="_blank" style="color: white !important;"><i class="fas fa-bell"></i> Notify me of updates</a>
        </div>
    </div>
</section>

</div> <!-- End of api-content-wrapper -->