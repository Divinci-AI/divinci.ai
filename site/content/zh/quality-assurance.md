+++
title = "LLM 质量保证"
description = "针对 AI 应用程序的企业级测试和验证。自动化幻觉检测、偏见监控和持续质量评分。"
template = "feature.html"

[extra]
hero_poster = "images/hero-qa.webp"
+++

# LLM 质量保证

*此页面的完整版本以下为英语版本。*

<style>
/* Page-specific Leonardo journal background */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-qa.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

/* Quality Assurance page specific styles matching original design */

.section-padding {
    padding: 4rem 0;
}

.section-heading {
    font-family: 'Fraunces', serif;
    font-size: 3rem;
    color: #1e3a2b;
    text-align: center;
    margin-top: 4rem;
    margin-bottom: 4rem;
}

.benefits-circle-container {
    position: relative;
    width: min(900px, 90vw);
    height: 1111px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Add more padding to the benefits section to accommodate the full circle */
.feature-benefits {
    padding: 8rem 0 12rem 0;
}

.center-benefit {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(30, 45, 102, 0.1), rgba(184, 160, 128, 0.1));
    border: 2px solid rgba(184, 160, 128, 0.3);
    border-radius: 50%;
    text-align: center;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.orbital-benefit {
    position: absolute;
    background: rgba(248, 244, 240, 0.9);
    border: 2px solid rgba(184, 160, 128, 0.2);
    border-radius: 50%;
    text-align: center;
    transition: all 0.3s ease;
    top: 50%;
    left: 50%;
}

.orbital-benefit:nth-child(2) { transform: translate(-50%, -50%) rotate(0deg) translateY(-420px) rotate(0deg); }
.orbital-benefit:nth-child(3) { transform: translate(-50%, -50%) rotate(72deg) translateY(-420px) rotate(-72deg); }
.orbital-benefit:nth-child(4) { transform: translate(-50%, -50%) rotate(144deg) translateY(-420px) rotate(-144deg); }
.orbital-benefit:nth-child(5) { transform: translate(-50%, -50%) rotate(216deg) translateY(-420px) rotate(-216deg); }
.orbital-benefit:nth-child(6) { transform: translate(-50%, -50%) rotate(288deg) translateY(-420px) rotate(-288deg); }

.orbital-benefit:nth-child(2):hover { transform: translate(-50%, -50%) rotate(0deg) translateY(-420px) rotate(0deg) scale(1.05); }
.orbital-benefit:nth-child(3):hover { transform: translate(-50%, -50%) rotate(72deg) translateY(-420px) rotate(-72deg) scale(1.05); }
.orbital-benefit:nth-child(4):hover { transform: translate(-50%, -50%) rotate(144deg) translateY(-420px) rotate(-144deg) scale(1.05); }
.orbital-benefit:nth-child(5):hover { transform: translate(-50%, -50%) rotate(216deg) translateY(-420px) rotate(-216deg) scale(1.05); }
.orbital-benefit:nth-child(6):hover { transform: translate(-50%, -50%) rotate(288deg) translateY(-420px) rotate(-288deg) scale(1.05); }

.orbital-benefit:hover {
    box-shadow: 0 8px 24px rgba(184, 160, 128, 0.3);
}

.benefit-icon svg {
    width: 60px;
    height: 60px;
    margin-bottom: 1rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 25px;
}

.feature-item {
    background: rgba(30, 45, 102, 0.1);
    border-radius: 10px;
    padding: 20px;
    border: 1px solid rgba(184, 160, 128, 0.2);
}

.timeline-step {
    position: relative;
    padding-left: 80px;
    margin-bottom: 3rem;
    padding-bottom: 1rem;
}

.step-number {
    position: absolute;
    left: 0;
    top: 5px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #1e3a2b, #2d3c34);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    z-index: 1;
}

.case-studies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.case-study-card {
    background: rgba(248, 244, 240, 0.9);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(184, 160, 128, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.related-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.related-feature-card {
    background: rgba(248, 244, 240, 0.9);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(184, 160, 128, 0.2);
    text-align: center;
}

.accordion-item {
    border: 1px solid rgba(184, 160, 128, 0.2);
    border-radius: 8px;
    margin-bottom: 1rem;
    overflow: hidden;
}

.accordion-trigger {
    width: 100%;
    padding: 1.5rem;
    background: rgba(30, 45, 102, 0.05);
    border: none;
    text-align: left;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.accordion-trigger:hover {
    background: rgba(30, 45, 102, 0.1);
}

.accordion-panel {
    padding: 1.5rem;
    background: var(--color-bg-primary, #f8f4f0);
}

.tag {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(107, 70, 193, 0.1);
    color: #1e3a2b;
    border-radius: 20px;
    font-size: 0.9rem;
    margin: 0.25rem;
}

.text-link {
    color: #1e3a2b;
    text-decoration: none;
    font-weight: 600;
}

.text-link:hover {
    color: #2d3c34;
    text-decoration: underline;
}

.secondary-button {
    background-color: transparent;
    color: #1e3a2b;
    border: 2px solid #1e3a2b;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.secondary-button:hover {
    background-color: #1e3a2b;
    color: white;
}

.metrics-container {
    display: flex;
    justify-content: space-around;
    text-align: center;
}

.metric-value {
    display: block;
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e3a2b;
}

.metric-label {
    display: block;
    font-size: 0.9rem;
    color: #8b7659;
    margin-top: 0.5rem;
}

.testimonial {
    border-left: 4px solid #1e3a2b;
    padding-left: 2rem;
    margin: 2rem 0;
    font-style: italic;
}

.testimonial cite {
    display: block;
    margin-top: 1rem;
    font-weight: 600;
    color: #2d3c34;
}

.pipeline-container {
    background: rgba(248, 244, 240, 0.9);
    padding: 3rem;
    border-radius: 12px;
    border: 1px solid rgba(184, 160, 128, 0.2);
    margin: 3rem 0;
}

.pipeline-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.pipeline-step {
    text-align: center;
    padding: 2rem;
    background: rgba(107, 70, 193, 0.05);
    border-radius: 12px;
    border: 2px solid rgba(184, 160, 128, 0.2);
    position: relative;
}

.step-icon {
    width: 60px;
    height: 60px;
    margin: 0 auto 1rem;
    background: linear-gradient(135deg, #1e3a2b, #2d3c34);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
}
</style>

<!-- Hero Section -->
<div class="feature-hero">
<div class="feature-hero-bg">
<img src="/images/hero-qa.webp" alt="Quality assurance hero illustration" loading="eager" fetchpriority="high" decoding="async">
<video autoplay muted loop playsinline data-hero-video>
<source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/hero-qa-video.webm" type="video/webm">
<source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/hero-qa-video.mp4" type="video/mp4">
</video>
</div>
<div class="feature-hero-inner">
<div class="feature-hero-card">
<h1>LLM Quality Assurance</h1>
<p class="subtitle">Enterprise testing and validation for AI applications. Automated hallucination detection, bias monitoring, and continuous quality scoring.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Request demo</a>
<a href="/autorag/" class="cta-secondary">Explore AutoRAG</a>
</div>
</div>
</div>
</div>

<section id="feature-overview" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 3rem; margin-bottom: 3rem;">What is LLM Quality Assurance?</h2>

<div class="qa-diagram-container" style="text-align: center; margin: 2rem 0;">
  <img src="/images/qa-pipeline-diagram.svg" alt="LLM Quality Assurance Pipeline" class="diagram-svg" style="width: 100%; max-width: 900px; height: auto;"  loading="lazy"/ width="900" height="550">
</div>

<div class="overview-content">
<p style="font-size: 1.25rem; margin-bottom: 2rem;">Divinci AI's Quality Assurance platform ensures enterprise-grade reliability and safety for your LLM applications. Our comprehensive testing and validation pipeline catches issues before they reach production, maintaining the highest standards of accuracy and compliance.</p>

<p>Traditional quality assurance approaches fall short with AI systems due to their non-deterministic nature and the complexity of evaluating generated content. Our platform addresses these unique challenges with automated testing frameworks, content validation engines, and continuous monitoring systems specifically designed for LLM applications.</p>

<p>With comprehensive test generation, real-time validation, and intelligent monitoring, our platform ensures your AI applications deliver consistent, accurate, and safe responses while maintaining regulatory compliance and building user trust.</p>
</div>
</div>
</section>

<section id="feature-benefits" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 4rem; margin-bottom: 160px;">Key Benefits</h2>

<div style="display: flex; justify-content: center; align-items: center; width: 100%;">
<div class="benefits-circle-container">
<div class="center-benefit" style="width: 365px; height: 365px; padding: 40px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
<circle cx="50" cy="50" r="45" stroke="#2d5a4f" stroke-width="1" fill="none" opacity="0.3" />
<circle cx="50" cy="50" r="35" stroke="#2d5a4f" stroke-width="1" fill="none" opacity="0.5" />
<path d="M30,50 L70,50" stroke="#2d5a4f" stroke-width="3" fill="none" />
<path d="M50,30 L50,70" stroke="#2d5a4f" stroke-width="3" fill="none" />
<circle cx="50" cy="50" r="15" stroke="#2d5a4f" stroke-width="2" fill="none">
<animate attributeName="r" values="15;20;15" dur="3s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>Quality Assurance</h3>
<p>Comprehensive testing and validation pipeline that ensures enterprise-grade reliability and safety for your LLM applications with automated quality control.</p>
</div>

<div class="orbital-benefit" style="width: 350px; height: 350px; padding: 35px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#2d5a4f" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,50 L70,50" stroke="#2d5a4f" stroke-width="3" fill="none" />
<path d="M50,30 L50,70" stroke="#2d5a4f" stroke-width="3" fill="none" />
<circle cx="50" cy="50" r="10" stroke="#2d5a4f" stroke-width="2" fill="none">
<animate attributeName="r" values="10;15;10" dur="3s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>Automated Testing</h3>
<p>Generate comprehensive test scenarios automatically including edge cases, regression tests, and red teaming for thorough validation.</p>
</div>

<div class="orbital-benefit" style="width: 350px; height: 350px; padding: 35px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#2d5a4f" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,50 C45,35 55,65 70,50" stroke="#2d5a4f" stroke-width="2" fill="none">
<animate attributeName="d" values="M30,50 C45,35 55,65 70,50;M30,50 C45,65 55,35 70,50;M30,50 C45,35 55,65 70,50" dur="6s" repeatCount="indefinite" />
</path>
<circle cx="30" cy="50" r="4" fill="#2d5a4f" opacity="0.7" />
<circle cx="70" cy="50" r="4" fill="#2d5a4f" opacity="0.7" />
</svg>
</div>
<h3>Content Validation</h3>
<p>Advanced validation engine with fact checking, bias detection, and toxicity filtering to maintain content quality and safety standards.</p>
</div>

<div class="orbital-benefit" style="width: 350px; height: 350px; padding: 35px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#2d5a4f" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,70 L70,30" stroke="#2d5a4f" stroke-width="2" fill="none" />
<circle cx="30" cy="70" r="5" fill="#2d5a4f" opacity="0.7" />
<circle cx="70" cy="30" r="5" fill="#2d5a4f" opacity="0.7" />
<path d="M30,30 L70,70" stroke="#2d5a4f" stroke-width="2" fill="none" stroke-dasharray="5,5" />
</svg>
</div>
<h3>Continuous Monitoring</h3>
<p>Real-time performance monitoring, anomaly detection, and drift detection to maintain optimal AI performance over time.</p>
</div>

<div class="orbital-benefit" style="width: 350px; height: 350px; padding: 35px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#2d5a4f" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,40 L70,40" stroke="#2d5a4f" stroke-width="2" fill="none" />
<path d="M30,60 L70,60" stroke="#2d5a4f" stroke-width="2" fill="none" />
<path d="M40,30 L40,70" stroke="#2d5a4f" stroke-width="2" fill="none" />
<path d="M60,30 L60,70" stroke="#2d5a4f" stroke-width="2" fill="none" />
</svg>
</div>
<h3>Enterprise Compliance</h3>
<p>Maintain regulatory compliance with comprehensive audit trails, data governance, and industry-specific validation requirements.</p>
</div>

<div class="orbital-benefit" style="width: 350px; height: 350px; padding: 35px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#2d5a4f" stroke-width="1" fill="none" opacity="0.3" />
<path d="M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30" stroke="#2d5a4f" stroke-width="2" fill="none">
<animate attributeName="d" values="M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30;M50,30 C75,35 75,65 50,70 C25,65 25,35 50,30;M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30" dur="8s" repeatCount="indefinite" />
</path>
<circle cx="50" cy="50" r="5" fill="#2d5a4f" opacity="0.7">
<animate attributeName="r" values="5;8;5" dur="4s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>Self-Improving Analytics</h3>
<p>Continuously learns and optimizes quality assessment patterns based on validation results and user feedback.</p>
</div>
</div>
</div>
</div>
</section>

<section id="feature-details" class="feature-details section-padding" style="padding-top: 6rem;">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">How Quality Assurance Works</h2>

<div class="feature-grid">
<div class="feature-item">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #2d5a4f; font-size: 24px;">
<i class="fas fa-vial"></i>
</div>
<div>
<h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Automated Test Generation</h3>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Generate comprehensive test scenarios including user scenarios, edge cases, regression tests, and red teaming to ensure reliability</p>
</div>
</div>
</div>

<div class="feature-item">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #2d5a4f; font-size: 24px;">
<i class="fas fa-shield-alt"></i>
</div>
<div>
<h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Content Validation</h3>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Advanced validation with fact checking, hallucination detection, bias detection, and toxicity filtering</p>
</div>
</div>
</div>

<div class="feature-item">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #2d5a4f; font-size: 24px;">
<i class="fas fa-chart-line"></i>
</div>
<div>
<h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Quality Analytics</h3>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Evaluate relevance, consistency, completeness, and compliance to ensure enterprise requirements</p>
</div>
</div>
</div>

<div class="feature-item">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #2d5a4f; font-size: 24px;">
<i class="fas fa-eye"></i>
</div>
<div>
<h3 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Continuous Monitoring</h3>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Real-time monitoring with performance analytics, anomaly detection, and user feedback collection</p>
</div>
</div>
</div>
</div>
</div>
</section>

<section id="qa-pipeline" class="pipeline section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Quality Assurance Pipeline</h2>

<div class="pipeline-container">
<h3 style="color: #1e3a2b; margin-bottom: 2rem; text-align: center;">End-to-End LLM Quality Validation</h3>

<div class="pipeline-steps">
<div class="pipeline-step">
<div class="step-icon">1</div>
<h4>Automated Testing</h4>
<p>Generate comprehensive test scenarios including user scenarios, edge cases, regression tests, and red teaming to validate LLM reliability.</p>
</div>

<div class="pipeline-step">
<div class="step-icon">2</div>
<h4>Content Validation</h4>
<p>Advanced validation engine performs fact checking, hallucination detection, bias detection, and toxicity filtering for content quality.</p>
</div>

<div class="pipeline-step">
<div class="step-icon">3</div>
<h4>Quality Analysis</h4>
<p>Analytics engine evaluates relevance, consistency, completeness, and compliance to ensure enterprise-grade requirements.</p>
</div>

<div class="pipeline-step">
<div class="step-icon">4</div>
<h4>Continuous Monitoring</h4>
<p>Real-time performance monitoring, anomaly detection, user feedback collection, and drift detection for ongoing optimization.</p>
</div>
</div>
</div>
</div>
</section>

<style>
/* Scoring + calibration internals section */
.qa-internals { background: linear-gradient(180deg, rgba(248,244,240,0) 0%, rgba(232,221,199,0.18) 30%, rgba(232,221,199,0.18) 70%, rgba(248,244,240,0) 100%); padding: 5rem 1rem 6rem; }
.qa-internals .container { max-width: 1180px; margin: 0 auto; }
.qa-internals .subheading { text-align: center; color: #5a6862; font-size: 1.1rem; max-width: 760px; margin: -1rem auto 3rem; line-height: 1.6; }
.qa-stack-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem; max-width: 1080px; margin: 0 auto; }
@media (max-width: 880px) { .qa-stack-grid { grid-template-columns: 1fr; } }
.qa-card { background: #faf8f5; border-radius: 12px; padding: 1.75rem 2rem; border-left: 4px solid #b8a080; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); }
.qa-card.calibration { border-left-color: #2d5a4f; }
.qa-card.autofix { border-left-color: #7a8a4a; }
.qa-card.arena { border-left-color: #5a7a8f; }
.qa-card.audit { border-left-color: #a04848; }
.qa-card h3 { font-family: 'Fraunces', serif; color: #1e3a2b; font-size: 1.5rem; margin: 0 0 0.85rem; }
.qa-card .qa-meta { display: inline-block; font-size: 0.78rem; font-weight: 700; letter-spacing: 0.05em; padding: 0.2rem 0.7rem; border-radius: 999px; margin-bottom: 0.8rem; }
.qa-card.calibration .qa-meta { background: rgba(45,90,79,0.12); color: #1e3a2b; }
.qa-card.autofix .qa-meta { background: rgba(122,138,74,0.15); color: #5a6c2a; }
.qa-card.arena .qa-meta { background: rgba(90,122,143,0.15); color: #3a5060; }
.qa-card.audit .qa-meta { background: rgba(160,72,72,0.15); color: #7a3030; }
.qa-card p, .qa-card li { color: #3a4a40; font-size: 0.98rem; line-height: 1.65; }
.qa-card ul { padding-left: 1.2rem; margin: 0.5rem 0 0; }
.qa-card li { margin-bottom: 0.4rem; }
.qa-card code { background: #eae3d5; padding: 0.1rem 0.4rem; border-radius: 4px; font-size: 0.85em; color: #2d3c34; font-family: 'DM Mono', monospace; }
.qa-scorers { max-width: 1080px; margin: 3rem auto 2rem; background: #1e2a26; border-radius: 14px; padding: 2rem 2.25rem; color: #e8e3d8; }
.qa-scorers h3 { font-family: 'Fraunces', serif; color: #faf8f5; margin: 0 0 0.5rem; font-size: 1.6rem; }
.qa-scorers .qa-scorers-sub { color: #b8a080; font-size: 0.95rem; margin: 0 0 1.5rem; line-height: 1.55; }
.qa-scorers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 0.85rem; }
.qa-scorer-chip { background: rgba(232, 221, 199, 0.08); border: 1px solid rgba(184, 160, 128, 0.3); border-radius: 8px; padding: 0.7rem 0.85rem; }
.qa-scorer-chip strong { color: #faf8f5 !important; display: block; font-size: 0.92rem; margin-bottom: 0.2rem; font-family: 'DM Mono', monospace; }
.qa-scorer-chip span { color: #c8c0ad !important; font-size: 0.83rem; line-height: 1.45; display: block; }
.qa-framework-row { display: flex; flex-wrap: wrap; gap: 0.6rem; justify-content: center; margin: 2rem auto 0; max-width: 1080px; }
.qa-framework-chip { background: #faf8f5; border: 1.5px solid rgba(139, 118, 89, 0.4); border-radius: 999px; padding: 0.5rem 1.15rem; font-family: 'DM Mono', monospace; font-size: 0.88rem; color: #2d3c34; }
.qa-cross-links { max-width: 1080px; margin: 3rem auto 0; padding: 1.5rem 2rem; background: rgba(45, 90, 79, 0.06); border-radius: 12px; text-align: center; }
.qa-cross-links a { color: #2d5a4f; font-weight: 600; text-decoration: none; border-bottom: 1px solid rgba(45, 90, 79, 0.3); }
.qa-cross-links a:hover { border-bottom-color: #2d5a4f; }
</style>

<section class="qa-internals">
<div class="container">
<h2 class="section-heading" style="margin-top: 0; margin-bottom: 1.5rem;">深入评分引擎 —— 校准实际上是如何工作的</h2>
<p class="subheading">大多数"AI 测试"工具只是给模型输出打分，然后就到此为止。Divinci 的评分式 QA 套件建立在一个不同的前提之上：<strong>你的评分准则需要根据领域专家进行校准，其分数才值得信任。</strong>以下是该流程当前的运作方式。</p>

<div class="qa-stack-grid">

<div class="qa-card calibration">
<span class="qa-meta">CALIBRATION · SHIPPED</span>
<h3>以人工锚定的评分准则校准</h3>
<p>领域专家在分层金标数据集上使用与 LLM 评判员相同的评分准则进行打分 —— 每个分数（0 / 0.25 / 0.5 / 0.75 / 1.0）都会被记录下来，并附带可选的推理说明以及可选的 <code>editedResponse</code> 字段，该字段同时也可作为有监督微调的信号。每条评分都会记录评分者身份、评分准则版本以及实际耗时。LLM 评判员与专家评分者之间的 Spearman ρ 会被持续计算；ρ 值最高的评判员将成为默认评判员。</p>
<ul>
  <li><strong>多评分者一致性：</strong>当多位专家对同一项进行评分时，会计算评分者间的 ρ 值，以便我们既能检测评分者之间的分歧，也能检测评判员与人类之间的分歧。</li>
  <li><strong>按套件的校准目标：</strong>每个评分式 QA 套件都带有 <code>rhoLowerTarget</code> + <code>rhoTargetN</code> —— 校准必须达到的下限值，以及在评判员获得信任之前必须通过的样本量。</li>
  <li><strong>主动学习：</strong>预评分流水线会优先呈现高方差的项目（即 LLM 评判员之间分歧最大的项目）供专家审阅，这样有限的专家预算就能优先校准嘈杂的决策边界。</li>
</ul>
</div>

<div class="qa-card autofix">
<span class="qa-meta">AUTO-FIX · SHIPPED</span>
<h3>带有明确自主级别的自动修复循环</h3>
<p>套件一经校准，自动修复循环便开始迭代：它对候选项打分，应用一次小幅的改写或检索配置变更，重新评分，并不断重复，直到达到四种终止状态之一。自主级别决定了迭代之间是否需要人工批准。</p>
<ul>
  <li><code>full-auto</code> —— 无人工把关地运行至收敛。</li>
  <li><code>checkpoint-every-iteration</code> —— 人工批准每一次候选变更。</li>
  <li><code>checkpoint-on-deploy</code> —— 在无人值守的情况下运行，但在提升到生产环境前会暂停以等待人工签字。</li>
  <li><strong>终止状态：</strong><code>high-scores</code>、<code>target-reached</code>、<code>max-iterations</code> 或 <code>running</code>。模式：<code>autofix</code> 用于提示词/检索调优，<code>autorag</code> 用于检索流水线重配置。</li>
</ul>
</div>

<div class="qa-card arena">
<span class="qa-meta">ARENA · SHIPPED</span>
<h3>RAG Arena —— 套件级规模的变体对比</h3>
<p>一次 API 调用即可将整个套件分发到多种 RAG 配置之上 —— 不同的检索后端（<a href="/zh/rag-routing/">RAG Routing</a> 的十个目标）、不同的 LLM、不同的提示词模板 —— 并使用校准过的评判员对每一对（变体 × 测试）进行打分。结果是按变体的排名、按测试的最佳变体获胜者，以及一份 Markdown 报告。</p>
<p>Arena 也是我们<a href="/zh/rag-routing/">学习式路由模型</a>的上游数据源：当客户选择某个 arena 获胜者时，该（问题，获胜后端）对就会作为种子数据进入路由历史存储。</p>
<p><strong>接口：</strong><code>POST /api/v1/qa/suites/:suiteId/arena-run</code>，参数为 <code>{ arenaPresetId, testIds?, maxTestsPerVariant? }</code>。</p>
</div>

<div class="qa-card audit">
<span class="qa-meta">AUDIT · SHIPPED</span>
<h3>审计级评分凭证</h3>
<p>系统中的每个分数都会连同你数月后为其辩护所需的信息一同被记录下来。每条测试结果都携带一份按评分器划分的分数映射 —— 每个评分器一个 0–1 的分数，外加一个聚合的总体分数。每条校准评分都会与评分者身份、所使用评分准则提示词的内容哈希、评分本身、可选的推理说明、实际耗时以及（如果提供的话）编辑后的回复一起被存储。</p>
<ul>
  <li><strong>评分准则版本化：</strong>我们使用 SHA-256 对评分准则提示词进行内容哈希，并取 16 个字符的前缀作为版本 ID —— 任何对评分准则的编辑都会自动产生一个新版本；旧分数仍然绑定在旧的评分准则上。</li>
  <li><strong>阈值门控：</strong>按套件的 <code>minScore</code> 下限 + <code>maxDrift</code> 回归阈值会在被突破时触发 webhook / 邮件，并使用所配置的监控节奏（每小时 / 每日 / 每周 / 手动）。</li>
  <li><strong>可编辑的评分者反馈：</strong>由评分者提供的 <code>editedResponse</code> 会作为下游 SFT 信号被保留 —— 校准同时也是免费的训练数据。</li>
</ul>
</div>

</div>

<div class="qa-scorers">
<h3>我们默认搭载的八个 LLM 评判员评分器</h3>
<p class="qa-scorers-sub">每个评分式 QA 测试默认都会通过这一整套评分器。每个评分器都是一次针对参数化评分准则提示词的独立 LLM 调用；对评分准则的编辑会生成新的 <code>rubricVersion</code> 哈希，因此历史分数仍然有意义。客户可以按套件禁用任何评分器，或提供自己的评分器。</p>
<div class="qa-scorers-grid">
  <div class="qa-scorer-chip"><strong>correctness</strong><span>将生成的回复与参考答案/金标答案直接对比。</span></div>
  <div class="qa-scorer-chip"><strong>factual-consistency-vs-reference</strong><span>对生成断言逐条与金标答案进行核实；捕获被臆造出来的新增内容。</span></div>
  <div class="qa-scorer-chip"><strong>completeness-coverage</strong><span>参考答案中的信息有多少出现在了生成的回复里。</span></div>
  <div class="qa-scorer-chip"><strong>relevance</strong><span>回复是否针对实际问题，而非一个仅有切线相关性的问题。</span></div>
  <div class="qa-scorer-chip"><strong>hallucination</strong><span>逐条断言进行接地检查 —— 标记任何不被所检索上下文支持的断言。</span></div>
  <div class="qa-scorer-chip"><strong>context-conflict</strong><span>标记与所检索上下文相矛盾的回复（这是一种与幻觉不同的失效模式）。</span></div>
  <div class="qa-scorer-chip"><strong>question-addressed</strong><span>实际的用户问题是否得到了回答（即使只是部分回答）—— 与<em>relevance</em>分开，以便更细粒度地进行诊断。</span></div>
  <div class="qa-scorer-chip"><strong>system-message-adherence</strong><span>回复是否遵守了系统消息约束（格式、人设、安全护栏）。</span></div>
</div>
</div>

<p class="subheading" style="margin-top: 3rem;">此外，还提供与客户已在使用的开源及商业框架的一流集成：</p>
<div class="qa-framework-row">
  <span class="qa-framework-chip">Ragas</span>
  <span class="qa-framework-chip">DeepEval</span>
  <span class="qa-framework-chip">Patronus Lynx</span>
  <span class="qa-framework-chip">Braintrust</span>
  <span class="qa-framework-chip">Evidently AI</span>
</div>

<div class="qa-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>评分引擎如何与平台其余部分相连接</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
经过校准的评判员驱动着我们用于变体对比的 <a href="/zh/rag-arena/">RAG Arena</a>，并为 <a href="/zh/rag-routing/">RAG Routing</a> 的学习式历史存储供料，由其针对每条查询挑选最佳后端。关于评判员校准的完整深入剖析，请参阅博文 <a href="/blog/calibrating-the-ai-judge/">Calibrating the Judge: The Grader Gets Graded</a>；arena 与路由的完整故事汇总在 <a href="/blog/inside-the-rag-arena-scored-qa-routing/">Inside the RAG Arena: When the Judges Don't Agree</a>。要了解这一切如何融入完整的发布流水线，请参阅<a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">回归测试博文</a>与 <a href="/blog/ci-testing-for-custom-language-models-in-2026/">CI 测试博文</a>。
</p>
</div>

</div>
</section>

<section id="case-studies" class="case-studies section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Success Stories</h2>

<div style="background: rgba(248, 244, 240, 0.9); padding: 3rem; border-radius: 12px; border: 1px solid rgba(184, 160, 128, 0.2); margin-bottom: 3rem;">
<h3 style="color: #1e3a2b; font-size: 2rem; margin-bottom: 1rem;">Global Healthcare Provider</h3>
<p style="font-size: 1.25rem; color: #2d3c34; margin-bottom: 2rem; font-weight: 600;">95% reduction in AI hallucinations while processing 50,000+ medical queries daily</p>
<p style="margin-bottom: 2rem;">A leading healthcare provider needed to ensure medical AI responses met the highest safety standards. Using our Quality Assurance platform, they implemented comprehensive testing and validation, achieving unprecedented accuracy for patient-facing AI systems while maintaining regulatory compliance.</p>

<blockquote class="testimonial">
<p>"Divinci AI's Quality Assurance platform gave us the confidence to deploy AI in critical healthcare scenarios. The comprehensive testing and real-time validation ensure our patients receive accurate, safe information every time."</p>
<cite>— Dr. Maria Rodriguez, Chief Medical Officer, Healthcare Leader</cite>
</blockquote>

<div class="metrics-container" style="margin-top: 2rem;">
<div class="metric">
<span class="metric-value">95%</span>
<span class="metric-label">Hallucination Reduction</span>
</div>
<div class="metric">
<span class="metric-value">99.8%</span>
<span class="metric-label">Content Safety Rating</span>
</div>
<div class="metric">
<span class="metric-value">50K+</span>
<span class="metric-label">Daily Queries Validated</span>
</div>
</div>
</div>

<div class="case-studies-grid">
<div class="case-study-card">
<h3>Financial Services Firm</h3>
<p>Achieved 99.9% compliance rate for regulatory queries with automated bias detection and fact-checking across 25,000+ daily customer interactions.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Request Details →</a>
</div>

<div class="case-study-card">
<h3>Legal Technology Platform</h3>
<p>Reduced manual review time by 85% while maintaining 99.5% accuracy for legal document analysis across 100+ law firms.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Request Details →</a>
</div>

<div class="case-study-card">
<h3>Educational Institution</h3>
<p>Ensured content safety and accuracy for 500,000+ student interactions with comprehensive toxicity filtering and educational content validation.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Request Details →</a>
</div>
</div>
</div>
</section>

<section id="related-features" class="related-features section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Related Features</h2>

<div class="related-features-grid">
<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<path d="M7,12 H17 M7,8 H17 M7,16 H13" stroke="#1e3a2b" stroke-width="2" stroke-linecap="round"/>
<circle cx="17" cy="16" r="3" fill="none" stroke="#2d3c34" stroke-width="2"/>
<path d="M17,14 L17,18 M15,16 L19,16" stroke="#2d3c34" stroke-width="2" stroke-linecap="round"/>
</svg>
</div>
<h3>AutoRAG Integration</h3>
<p>Seamlessly integrate quality assurance with your AutoRAG pipeline for comprehensive knowledge base validation.</p>
<a href="/autorag/" class="text-link">Learn More →</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<circle cx="12" cy="12" r="5" fill="none" stroke="#2d3c34" stroke-width="2"/>
<path d="M12,7 L12,5 M12,19 L12,17 M7,12 L5,12 M19,12 L17,12 M16.5,7.5 L18,6 M7.5,16.5 L6,18 M16.5,16.5 L18,18 M7.5,7.5 L6,6" stroke="#2d3c34" stroke-width="2" stroke-linecap="round"/>
</svg>
</div>
<h3>Release Management</h3>
<p>Integrate quality gates into your AI deployment pipeline with our comprehensive release management platform.</p>
<a href="/release-management/" class="text-link">Learn More →</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="#2d5a4f" stroke-width="2"/>
<path d="M9,12 L11,14 L15,10" stroke="#2d5a4f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</div>
<h3>Compliance Monitoring</h3>
<p>Ensure regulatory compliance with continuous monitoring and audit trails for enterprise AI deployments.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Learn More →</a>
</div>
</div>
</div>
</section>

<section id="faq" class="faq-section section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Frequently Asked Questions</h2>

<div class="accordion">
<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        How does AI quality assurance differ from traditional software testing?
</button>
</h3>
<div class="accordion-panel">
<p>AI quality assurance addresses unique challenges that traditional testing approaches can't handle. While traditional software testing focuses on deterministic outcomes, AI systems generate variable responses that require content-aware validation, bias detection, and contextual accuracy assessment.</p>
<p>Our platform evaluates not just functional correctness but also content quality, safety, compliance, and ethical considerations that are critical for enterprise AI deployments.</p>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        What types of validation does the platform perform?
</button>
</h3>
<div class="accordion-panel">
<p>Our comprehensive validation engine performs multiple types of quality checks:</p>
<ul>
<li><strong>Fact Checking:</strong> Validates factual accuracy against reliable knowledge sources</li>
<li><strong>Hallucination Detection:</strong> Identifies when AI generates false or unsupported information</li>
<li><strong>Bias Detection:</strong> Scans for unfair bias in AI responses across protected categories</li>
<li><strong>Toxicity Filtering:</strong> Prevents harmful, offensive, or inappropriate content</li>
<li><strong>Compliance Validation:</strong> Ensures responses meet industry-specific regulatory requirements</li>
<li><strong>Consistency Checking:</strong> Validates that similar queries receive consistent responses</li>
</ul>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        How does continuous monitoring work for deployed AI systems?
</button>
</h3>
<div class="accordion-panel">
<p>Our continuous monitoring system tracks AI performance in real-time through multiple channels:</p>
<ul>
<li><strong>Performance Analytics:</strong> Monitor response accuracy, latency, and user satisfaction metrics</li>
<li><strong>Anomaly Detection:</strong> Automatically identify unusual patterns that may indicate model degradation</li>
<li><strong>Drift Detection:</strong> Track changes in model behavior over time and alert on significant shifts</li>
<li><strong>User Feedback Integration:</strong> Collect and analyze user feedback to identify quality issues</li>
<li><strong>Automated Alerting:</strong> Instant notifications when quality thresholds are breached</li>
</ul>
<p>The system maintains detailed audit logs and provides dashboards for real-time visibility into AI system health and performance trends.</p>
</div>
</div>
</div>
</div>
</section>

<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Ready to transform AI quality?</h2>
<p>Ensure enterprise-grade reliability and safety for your LLM applications with automated testing and validation.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Request demo</a>
<a href="/release-management/" class="cta-secondary">Explore Release Management</a>
</div>
</section>
</div>