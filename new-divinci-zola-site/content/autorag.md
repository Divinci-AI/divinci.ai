+++
title = "AutoRAG - Automated Retrieval Augmented Generation"
description = "Automatically find the optimal RAG pipeline for your data with Divinci AI's comprehensive AutoRAG solution"
template = "feature.html"
[extra]
feature_category = "data-management"
+++

<style>
/* Page-specific Leonardo journal background */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-autorag.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

/* Feature page specific styles matching original design */

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
    background: linear-gradient(135deg, rgba(30, 45, 102, 0.1), rgba(92, 226, 231, 0.1));
    border: 2px solid rgba(92, 226, 231, 0.3);
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
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(92, 226, 231, 0.2);
    border-radius: 50%;
    text-align: center;
    transition: all 0.3s ease;
    top: 50%;
    left: 50%;
}

.orbital-benefit:nth-child(2) { transform: translate(-50%, -50%) rotate(0deg) translateY(-400px) rotate(0deg); }
.orbital-benefit:nth-child(3) { transform: translate(-50%, -50%) rotate(72deg) translateY(-400px) rotate(-72deg); }
.orbital-benefit:nth-child(4) { transform: translate(-50%, -50%) rotate(144deg) translateY(-400px) rotate(-144deg); }
.orbital-benefit:nth-child(5) { transform: translate(-50%, -50%) rotate(216deg) translateY(-400px) rotate(-216deg); }
.orbital-benefit:nth-child(6) { transform: translate(-50%, -50%) rotate(288deg) translateY(-400px) rotate(-288deg); }

.orbital-benefit:nth-child(2):hover { transform: translate(-50%, -50%) rotate(0deg) translateY(-400px) rotate(0deg) scale(1.05); }
.orbital-benefit:nth-child(3):hover { transform: translate(-50%, -50%) rotate(72deg) translateY(-400px) rotate(-72deg) scale(1.05); }
.orbital-benefit:nth-child(4):hover { transform: translate(-50%, -50%) rotate(144deg) translateY(-400px) rotate(-144deg) scale(1.05); }
.orbital-benefit:nth-child(5):hover { transform: translate(-50%, -50%) rotate(216deg) translateY(-400px) rotate(-216deg) scale(1.05); }
.orbital-benefit:nth-child(6):hover { transform: translate(-50%, -50%) rotate(288deg) translateY(-400px) rotate(-288deg) scale(1.05); }

.orbital-benefit:hover {
    box-shadow: 0 8px 24px rgba(92, 226, 231, 0.3);
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
    border: 1px solid rgba(92, 226, 231, 0.2);
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
    background: rgba(255, 255, 255, 0.9);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(92, 226, 231, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.related-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.related-feature-card {
    background: rgba(255, 255, 255, 0.9);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(92, 226, 231, 0.2);
    text-align: center;
}

.accordion-item {
    border: 1px solid rgba(92, 226, 231, 0.2);
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
    background: white;
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
    color: #718096;
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
/* Hero section */
.feature-hero {
    position: relative;
    min-height: 480px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6rem 2rem 4rem;
    overflow: hidden;
}

.feature-hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
}

.feature-hero-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.feature-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(to bottom, rgba(248,244,240,0.15) 0%, rgba(248,244,240,0.5) 40%, rgba(248,244,240,0.95) 100%);
}

.feature-hero-inner {
    position: relative;
    z-index: 2;
    max-width: 800px;
}

.feature-hero-card {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: var(--radius-large, 16px);
    padding: 3rem 3.5rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.feature-hero h1 {
    font-family: 'Fraunces', serif !important;
    font-size: clamp(2rem, 4vw, 3rem) !important;
    color: var(--color-neutral-primary) !important;
    margin-bottom: 1rem !important;
    line-height: 1.15 !important;
    text-shadow: none !important;
    -webkit-text-fill-color: var(--color-neutral-primary) !important;
}

.feature-hero .subtitle {
    font-size: 1.05rem;
    color: var(--color-neutral-secondary);
    line-height: 1.7;
    max-width: 600px;
    margin: 0 auto 2rem;
    text-shadow: none !important;
}

.feature-hero .hero-ctas {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}
</style>

<!-- Hero Section -->
<div class="feature-hero">
<div class="feature-hero-bg">
<img src="/images/hero-autorag.webp" alt="AutoRAG - Automated Retrieval Augmented Generation">
</div>
<div class="feature-hero-inner">
<div class="feature-hero-card">
<h1>AutoRAG</h1>
<p class="subtitle">Automatically find the optimal RAG pipeline for your data. Evaluate multiple retrieval and generation strategies to maximize accuracy and minimize hallucinations.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Request demo</a>
<a href="/rag-arena/" class="cta-secondary">Explore RAG Arena</a>
</div>
</div>
</div>
</div>

<section id="feature-overview" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 3rem; margin-bottom: 3rem;">What is AutoRAG?</h2>

<div class="autorag-diagram-container" style="text-align: center; margin: 2rem 0;">
  <img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/autorag-diagram.svg" alt="AutoRAG Knowledge Base Connection Diagram" class="diagram-svg" style="width: 100%; max-width: 800px; height: auto;" />
</div>

<div class="overview-content">
<p style="font-size: 1.25rem; margin-bottom: 2rem;">AutoRAG is Divinci AI's comprehensive solution for automatically finding the optimal RAG pipeline for your specific data and use cases. Unlike generic RAG implementations, AutoRAG evaluates multiple combinations of retrieval and generation strategies to determine what works best with your unique content.</p>

<p>Traditional RAG implementations require extensive manual configuration, document preprocessing, and continuous tuning to remain effective. Many organizations struggle with selecting the right RAG modules and pipelines for their specific data, wasting valuable time and resources on suboptimal configurations. AutoRAG eliminates these barriers by automatically evaluating various RAG module combinations, handling document parsing, chunking optimization, retrieval strategy selection, and response generation—all while continuously learning and improving from evaluation metrics.</p>

<p>With AutoRAG, your enterprise AI applications gain instant access to your organization's proprietary information with unprecedented accuracy and relevance. The system automatically creates QA datasets from your corpus, evaluates multiple retrieval and generation strategies, and identifies the optimal pipeline configuration—significantly reducing hallucinations and providing fully-sourced responses that build trust with your users.</p>
</div>
</div>
</section>

<section id="feature-benefits" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 4rem; margin-bottom: 120px;">Key Benefits</h2>

<div style="display: flex; justify-content: center; align-items: center; width: 100%;">
<div class="benefits-circle-container">
<div class="center-benefit" style="width: 365px; height: 365px; padding: 40px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
<circle cx="50" cy="50" r="45" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<circle cx="50" cy="50" r="35" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.5" />
<path d="M30,50 L70,50" stroke="#4a7c8a" stroke-width="3" fill="none" />
<path d="M50,30 L50,70" stroke="#4a7c8a" stroke-width="3" fill="none" />
<circle cx="50" cy="50" r="15" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="r" values="15;20;15" dur="3s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>AutoRAG</h3>
<p>Automated Retrieval Augmented Generation that seamlessly connects your AI to your organization's knowledge with minimal setup and maximum accuracy.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,50 L70,50" stroke="#4a7c8a" stroke-width="3" fill="none" />
<path d="M50,30 L50,70" stroke="#4a7c8a" stroke-width="3" fill="none" />
<circle cx="50" cy="50" r="10" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="r" values="10;15;10" dur="3s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>Rapid Integration</h3>
<p>Connect your knowledge base in minutes, not months, with automatic document processing and indexing.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,50 C45,35 55,65 70,50" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="d" values="M30,50 C45,35 55,65 70,50;M30,50 C45,65 55,35 70,50;M30,50 C45,35 55,65 70,50" dur="6s" repeatCount="indefinite" />
</path>
<circle cx="30" cy="50" r="4" fill="#4a7c8a" opacity="0.7" />
<circle cx="70" cy="50" r="4" fill="#4a7c8a" opacity="0.7" />
</svg>
</div>
<h3>Adaptive Retrieval</h3>
<p>Our system automatically selects the optimal retrieval strategy for each query for maximum relevance.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,70 L70,30" stroke="#4a7c8a" stroke-width="2" fill="none" />
<circle cx="30" cy="70" r="5" fill="#4a7c8a" opacity="0.7" />
<circle cx="70" cy="30" r="5" fill="#4a7c8a" opacity="0.7" />
<path d="M30,30 L70,70" stroke="#4a7c8a" stroke-width="2" fill="none" stroke-dasharray="5,5" />
</svg>
</div>
<h3>Reduced Hallucinations</h3>
<p>Reduces AI hallucinations by up to 97% with accurate context and real-time fact-checking.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 35px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="d" values="M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30;M50,30 C75,35 75,65 50,70 C25,65 25,35 50,30;M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30" dur="8s" repeatCount="indefinite" />
</path>
<circle cx="50" cy="50" r="5" fill="#4a7c8a" opacity="0.7">
<animate attributeName="r" values="5;8;5" dur="4s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>Self-Improving Performance</h3>
<p>Continuously optimizes retrieval patterns and response generation based on user interactions.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,40 L70,40" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M30,60 L70,60" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M40,30 L40,70" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M60,30 L60,70" stroke="#4a7c8a" stroke-width="2" fill="none" />
</svg>
</div>
<h3>Multi-Format Support</h3>
<p>Processes diverse content types including documents, databases, wikis, and structured data sources.</p>
</div>
</div>
</div>
</div>
</section>

<section id="feature-details" class="feature-details section-padding" style="padding-top: 6rem;">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">How AutoRAG Works</h2>

<!-- Tab Interface for Details -->
<div class="details-tabs" role="tablist" aria-label="AutoRAG capabilities" style="display: flex; justify-content: center; margin-bottom: 3rem; border-bottom: 2px solid rgba(92, 226, 231, 0.2);">
    <button id="tab1-trigger" class="tab-trigger" role="tab" aria-selected="true" aria-controls="tab1-content" style="background: none; border: none; color: #1e3a2b; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid #5ce2e7; transition: all 0.3s ease;">Data Creation Process</button>
    <button id="tab2-trigger" class="tab-trigger" role="tab" aria-selected="false" aria-controls="tab2-content" style="background: none; border: none; color: #718096; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease;">Retrieval Evaluation</button>
    <button id="tab3-trigger" class="tab-trigger" role="tab" aria-selected="false" aria-controls="tab3-content" style="background: none; border: none; color: #718096; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease;">Generation Optimization</button>
</div>

<div class="tab-content-container">
<!-- Tab 1 Content -->
<div id="tab1-content" role="tabpanel" aria-labelledby="tab1-trigger" class="tab-content active">
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Smart Document Processing & Data Creation</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">AutoRAG's document processing pipeline transforms your raw content into optimized datasets through a comprehensive four-stage process: document parsing, intelligent chunking, corpus creation, and automated QA dataset generation.</p>

<!-- Document Processing Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<object data="/images/autorag-clean-test.svg" type="image/svg+xml" style="width: 100%; max-width: 800px; height: auto;">
<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/autorag-clean-test.svg" alt="AutoRAG Data Creation Process" style="width: 100%; max-width: 800px; height: auto;" />
</object>
<p style="text-align: center; margin-top: 10px; color: #8C9DB5; font-size: 14px;">AutoRAG's comprehensive data creation process transforms raw documents into optimized corpus and QA datasets</p>
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-file-alt"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Advanced Parsing Modules</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Multiple parsing methods for different document types including PDFMiner, PyPDF, Unstructured, and custom parsers for specialized formats</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-cut"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Intelligent Chunking</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Adaptive chunking strategies that preserve context while optimizing for retrieval accuracy</p>
</div>
</div>
</div>
</div>
</div>

<!-- Tab 2 Content -->
<div id="tab2-content" role="tabpanel" aria-labelledby="tab2-trigger" class="tab-content" hidden>
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Comprehensive Retrieval Evaluation</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">Our AutoRAG system automatically evaluates multiple retrieval strategies to find the optimal approach for your specific data and use case.</p>

<!-- Vector Embedding Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/autorag-vector-embedding.svg" alt="Vector Embedding Visualization" style="width: 100%; max-width: 600px; height: auto;" />
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-search"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Multiple Retrieval Methods</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Evaluates various retrieval approaches including BM25, dense retrievers, hybrid search, and reranking strategies</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-database"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Vector Database Integration</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Supports multiple vector databases and embedding models to find the optimal combination</p>
</div>
</div>
</div>
</div>
</div>

<!-- Tab 3 Content -->
<div id="tab3-content" role="tabpanel" aria-labelledby="tab3-trigger" class="tab-content" hidden>
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">Generation Optimization & Evaluation</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">AutoRAG's advanced optimization system evaluates multiple generation strategies to find the optimal configuration for your specific data and use case.</p>

<!-- Retrieval Optimization Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/autorag-retrieval-optimization.svg" alt="Retrieval Optimization Visualization" style="width: 100%; max-width: 600px; height: auto;" />
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-cogs"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Generation Optimization</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Automatically optimizes prompts and generation parameters for your specific use case</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-check-circle"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">Comprehensive Metrics</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">Evaluates performance using precision, recall, F1, MRR, NDCG, and hit rate metrics</p>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>

<script>
// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Tab script loaded'); // Debug log
  
  // Get all tab components on the page
  const tabLists = document.querySelectorAll('[role="tablist"]');
  console.log('Found tab lists:', tabLists.length); // Debug log
  
  // Set up each tabbed interface
  tabLists.forEach(tabList => {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
    
    console.log('Found tabs:', tabs.length, 'panels:', tabPanels.length); // Debug log
    
    // Add click event to each tab
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        console.log('Tab clicked:', e.currentTarget.id); // Debug log
        changeTabs(e);
      });
      
      // Handle keyboard events for accessibility
      tab.addEventListener('keydown', handleTabKeydown);
    });
    
    // Set initial state with the first tab active
    if (tabs.length > 0) {
      // Show the first panel and hide others initially
      tabPanels.forEach((panel, index) => {
        if (index === 0) {
          panel.hidden = false;
          panel.style.display = 'block';
        } else {
          panel.hidden = true;
          panel.style.display = 'none';
        }
      });
    }
  });
  
  /**
   * Change tabs when a tab is clicked
   */
  function changeTabs(e) {
    const target = e.currentTarget;
    const parent = target.parentNode;
    const grandparent = parent.parentNode;
    
    console.log('Changing tabs, target:', target.id); // Debug log
    
    // Get all tabs in this tablist
    const tabs = parent.querySelectorAll('[role="tab"]');
    
    // Hide all tabpanels
    const tabContainer = grandparent.parentNode;
    const tabPanels = tabContainer.querySelectorAll('[role="tabpanel"]');
    
    tabPanels.forEach(panel => {
      panel.hidden = true;
      panel.style.display = 'none';
      console.log('Hiding panel:', panel.id); // Debug log
    });
    
    // Set all tabs as unselected
    tabs.forEach(tab => {
      tab.setAttribute('aria-selected', 'false');
      tab.style.color = '#718096';
      tab.style.borderBottomColor = 'transparent';
    });
    
    // Set clicked tab as selected
    target.setAttribute('aria-selected', 'true');
    target.style.color = '#1e3a2b';
    target.style.borderBottomColor = '#5ce2e7';
    
    // Show the associated tabpanel
    const tabpanelID = target.getAttribute('aria-controls');
    const tabPanel = document.getElementById(tabpanelID);
    
    console.log('Showing panel:', tabpanelID, 'found:', !!tabPanel); // Debug log
    
    if (tabPanel) {
      tabPanel.hidden = false;
      tabPanel.style.display = 'block';
    }
  }
  
  /**
   * Handle keyboard navigation for tabs
   */
  function handleTabKeydown(e) {
    const target = e.currentTarget;
    const parent = target.parentNode;
    const tabs = Array.from(parent.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(target);
    
    // Define which keys we're handling
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < tabs.length - 1) {
          focusTab(tabs[currentIndex + 1]);
        } else {
          focusTab(tabs[0]); // Wrap to first tab
        }
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          focusTab(tabs[currentIndex - 1]);
        } else {
          focusTab(tabs[tabs.length - 1]); // Wrap to last tab
        }
        break;
        
      case 'Home':
        e.preventDefault();
        focusTab(tabs[0]); // Go to first tab
        break;
        
      case 'End':
        e.preventDefault();
        focusTab(tabs[tabs.length - 1]); // Go to last tab
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        target.click(); // Activate the tab
        break;
    }
  }
  
  /**
   * Focus and click on a tab
   */
  function focusTab(tab) {
    tab.focus();
  }
});
</script>

<style>
/* Tab styling */
.tab-trigger:hover {
    color: #1e3a2b !important;
    border-bottom-color: rgba(92, 226, 231, 0.5) !important;
}

.tab-trigger[aria-selected="true"] {
    color: #1e3a2b !important;
    border-bottom-color: #5ce2e7 !important;
}

.tab-trigger[aria-selected="false"] {
    color: #718096 !important;
    border-bottom-color: transparent !important;
}

.tab-content {
    padding: 2rem 0;
}

.tab-content[hidden] {
    display: none;
}

.tab-content.active {
    display: block;
}

/* Responsive tabs */
@media (max-width: 768px) {
    .details-tabs {
        flex-direction: column !important;
        align-items: center !important;
    }
    
    .tab-trigger {
        margin: 0.5rem 0 !important;
        padding: 0.75rem 1.5rem !important;
    }
}
</style>

<section id="feature-implementation" class="feature-implementation section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Implementation Process</h2>

<div class="implementation-timeline">
<div class="timeline-step">
<div class="step-number">1</div>
<div class="step-content">
<h3>Knowledge Source Connection</h3>
<p>Connect your existing knowledge repositories through our simple integration interface. AutoRAG supports direct connections to document storage systems, databases, knowledge bases, wikis, and internal tools via secure API connections or direct document uploads.</p>
</div>
</div>

<div class="timeline-step">
<div class="step-number">2</div>
<div class="step-content">
<h3>Data Creation & Pipeline Optimization</h3>
<p>Our system transforms your raw documents into optimized datasets through our comprehensive four-stage process: document parsing, intelligent chunking, corpus creation, and QA dataset generation. These datasets are then used to evaluate multiple RAG pipeline configurations, automatically identifying the optimal approach for your specific data and use case.</p>
</div>
</div>

<div class="timeline-step">
<div class="step-number">3</div>
<div class="step-content">
<h3>API Integration & Deployment</h3>
<p>Integrate AutoRAG with your existing applications through our REST API or use our pre-built connectors for popular LLM platforms. Simple configuration options let you customize retrieval settings, authentication, and user permission models to match your organizational requirements.</p>
</div>
</div>
</div>

<div style="text-align: center; margin-top: 3rem;">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="secondary-button" target="_blank">Request Implementation Guide</a>
</div>
</div>
</section>

<section id="case-studies" class="case-studies section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">Success Stories</h2>

<div style="background: rgba(255, 255, 255, 0.9); padding: 3rem; border-radius: 12px; border: 1px solid rgba(92, 226, 231, 0.2); margin-bottom: 3rem;">
<h3 style="color: #1e3a2b; font-size: 2rem; margin-bottom: 1rem;">Global Financial Services Firm</h3>
<p style="font-size: 1.25rem; color: #2d3c34; margin-bottom: 2rem; font-weight: 600;">87% reduction in AI hallucinations while handling 15,000+ client queries daily</p>
<p style="margin-bottom: 2rem;">A leading financial services firm needed to incorporate 200,000+ regulatory documents and internal policies into their client-facing AI assistant. Manual RAG implementation was estimated at 8+ months. Using AutoRAG, they completed the integration in 3 weeks and achieved unprecedented accuracy for regulatory compliance questions.</p>

<blockquote class="testimonial">
<p>"AutoRAG transformed our AI implementation timeline from quarters to weeks. The system's ability to accurately retrieve regulatory information while providing proper citations has been game-changing for our compliance team."</p>
<cite>— Sarah Chen, CTO, Financial Services Leader</cite>
</blockquote>

<div class="metrics-container" style="margin-top: 2rem;">
<div class="metric">
<span class="metric-value">87%</span>
<span class="metric-label">Reduction in Hallucinations</span>
</div>
<div class="metric">
<span class="metric-value">93%</span>
<span class="metric-label">Implementation Time Saved</span>
</div>
<div class="metric">
<span class="metric-value">15K+</span>
<span class="metric-label">Daily Queries Processed</span>
</div>
</div>
</div>

<div class="case-studies-grid">
<div class="case-study-card">
<h3>Healthcare Provider Network</h3>
<p>Integrated 50+ disparate knowledge bases in 2 weeks, enabling accurate medical information retrieval with 99.8% accuracy.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Request Details →</a>
</div>

<div class="case-study-card">
<h3>Manufacturing Conglomerate</h3>
<p>Reduced technical support resolution time by 73% by connecting AutoRAG to 15 years of equipment documentation and maintenance records.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">Request Details →</a>
</div>

<div class="case-study-card">
<h3>Global Legal Firm</h3>
<p>Enabled paralegals to process 3x more case research by implementing AutoRAG across 12M+ legal documents and precedents.</p>
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
<h3>Knowledge Base Integration</h3>
<p>Connect multiple knowledge sources with our specialized connectors for seamless data flow into your AI applications.</p>
<a href="/quality-assurance/" class="text-link">Learn More →</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="#4a7c8a" stroke-width="2"/>
<path d="M9,12 L11,14 L15,10" stroke="#4a7c8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</div>
<h3>LLM Quality Assurance</h3>
<p>Ensure accuracy and reliability with our comprehensive testing and monitoring for AI-generated content.</p>
<a href="/quality-assurance/" class="text-link">Learn More →</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<circle cx="12" cy="12" r="5" fill="none" stroke="#2d3c34" stroke-width="2"/>
<path d="M12,7 L12,5 M12,19 L12,17 M7,12 L5,12 M19,12 L17,12 M16.5,7.5 L18,6 M7.5,16.5 L6,18 M16.5,16.5 L18,18 M7.5,7.5 L6,6" stroke="#2d3c34" stroke-width="2" stroke-linecap="round"/>
</svg>
</div>
<h3>Release Cycle Management</h3>
<p>Streamline your AI application development with our specialized DevOps tools for LLM-based systems.</p>
<a href="/release-management/" class="text-link">Learn More →</a>
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
                        What types of documents and data sources can AutoRAG process?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG can process virtually any text-based content including PDFs, Word documents, PowerPoint presentations, Excel spreadsheets, HTML pages, Markdown files, code repositories, databases, wikis, knowledge bases, and structured data from APIs. The system also handles images with text content through OCR and can extract data from tables, diagrams, and other visual elements.</p>
<p>For specialized data formats or proprietary systems, our team can develop custom connectors to ensure seamless integration with your existing knowledge infrastructure.</p>
<div style="margin-top: 1rem;">
<span class="tag">PDF</span>
<span class="tag">Word</span>
<span class="tag">Excel</span>
<span class="tag">HTML</span>
<span class="tag">Markdown</span>
<span class="tag">Databases</span>
<span class="tag">API Data</span>
</div>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        How does AutoRAG handle data security and compliance requirements?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG is designed with enterprise-grade security at its core. All data processing occurs within your security perimeter, either in your cloud environment or on-premises. The system supports:</p>
<ul>
<li>End-to-end encryption for all data at rest and in transit</li>
<li>Role-based access controls for document visibility</li>
<li>Data residency options for regional compliance requirements</li>
<li>Audit logging for all system operations and data access</li>
<li>Compliance with GDPR, HIPAA, SOC 2, and other regulatory frameworks</li>
</ul>
<p>Additionally, our deployment options include air-gapped environments for the highest security requirements.</p>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        What LLM providers and models does AutoRAG support?
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG is model-agnostic and works with virtually any LLM, including:</p>
<ul>
<li>OpenAI models (GPT-4, GPT-3.5, etc.)</li>
<li>Anthropic models (Claude series)</li>
<li>Google models (Gemini series)</li>
<li>Meta models (Llama series)</li>
<li>Mistral models</li>
<li>Open source models (deployable on your infrastructure)</li>
<li>Custom fine-tuned models</li>
</ul>
<p>The system automatically optimizes its output for each model's specific context window limitations and capabilities. Our management console allows easy switching between models and A/B testing for optimal performance.</p>
</div>
</div>
</div>
</div>
</section>

<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Ready to get started?</h2>
<p>Transform your AI applications with AutoRAG's comprehensive solution for finding the optimal retrieval pipeline.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Request demo</a>
<a href="/quality-assurance/" class="cta-secondary">Explore Quality Assurance</a>
</div>
</section>
</div>