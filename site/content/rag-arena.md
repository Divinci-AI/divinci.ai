+++
title = "RAG Arena & Dynamic Routing"
description = "Compare knowledge bases side-by-side and automatically route questions to the best-performing RAG vector with Divinci AI's intelligent arena system"
template = "feature.html"
[extra]
feature_category = "data-management"
+++

<style>
/* RAG Arena Page Styles - Renaissance Warm Palette */

/* Page-specific Leonardo journal background */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-rag-arena.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important; /* opacity is controlled within the SVG itself */
}

.arena-hero {
    position: relative;
    min-height: 560px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 6rem 2rem 4rem;
    overflow: hidden;
}

.arena-hero-bg {
    position: absolute;
    inset: 0;
    z-index: 0;
}

.arena-hero-bg video,
.arena-hero-bg img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.arena-hero::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background: linear-gradient(to bottom, rgba(248,244,240,0.1) 0%, rgba(248,244,240,0.45) 40%, rgba(248,244,240,0.92) 100%);
}

.arena-hero-inner {
    position: relative;
    z-index: 2;
    max-width: 800px;
}

.arena-hero-card {
    background: rgba(255, 255, 255, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-radius: var(--radius-large);
    padding: 3rem 3.5rem;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
}

.arena-hero h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(2.25rem, 4vw, 3.25rem);
    color: var(--color-neutral-primary);
    margin-bottom: 1.25rem;
    line-height: 1.15;
}

.arena-hero .subtitle {
    font-size: 1.1rem;
    color: var(--color-neutral-secondary);
    line-height: 1.7;
    max-width: 600px;
    margin: 0 auto 2rem;
}

.arena-hero .hero-ctas {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.arena-hero .cta-primary {
    display: inline-flex;
    align-items: center;
    padding: 0.875rem 2rem;
    background: var(--color-neutral-inverse);
    color: white;
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    transition: var(--transition-medium);
}

.arena-hero .cta-primary:hover {
    background: var(--color-btn-primary-hover);
    transform: translateY(-1px);
}

.arena-hero .cta-secondary {
    display: inline-flex;
    align-items: center;
    padding: 0.875rem 2rem;
    background: transparent;
    color: var(--color-neutral-primary);
    border: 1.5px solid var(--color-border-medium);
    border-radius: 6px;
    text-decoration: none;
    font-weight: 600;
    transition: var(--transition-medium);
}

.arena-hero .cta-secondary:hover {
    border-color: var(--color-neutral-inverse);
    background: rgba(45, 90, 79, 0.05);
}

/* Section styling */
.feature-page .arena-section {
    max-width: 1200px;
    margin: 0 auto !important;
}

/* Override feature-page section reset */
.feature-page .arena-section,
.feature-page .arena-cta,
.feature-page .routing-section {
    padding: var(--section-spacing) 2rem !important;
}

.feature-page .arena-hero {
    padding: 6rem 2rem 4rem !important;
    max-width: 100% !important;
    margin: 0 !important;
}

.feature-page .arena-section h2,
.feature-page .arena-cta h2 {
    font-family: 'Fraunces', serif;
    font-size: var(--text-h2);
    color: var(--color-neutral-primary);
    text-align: center;
    margin-bottom: 1rem;
}

/* Ensure CTA links keep button styling */
.feature-page .cta-primary,
.feature-page .cta-secondary {
    text-decoration: none !important;
}

.feature-page .cta-primary:hover,
.feature-page .cta-secondary:hover {
    text-decoration: none !important;
}

.arena-section .section-subtitle {
    text-align: center;
    color: var(--color-neutral-secondary);
    font-size: 1.1rem;
    max-width: 650px;
    margin: 0 auto 3rem;
    line-height: 1.6;
}

/* Arena Demo Visualization */
.arena-demo {
    background: var(--color-surface-light);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-large);
    padding: 2.5rem;
    margin: 0 auto 4rem;
    max-width: 1000px;
    box-shadow: var(--shadow-large);
}

.arena-demo-header {
    text-align: center;
    margin-bottom: 2rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--color-border-light);
}

.arena-demo-header .question {
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    color: var(--color-neutral-primary);
    background: var(--color-bg-accent);
    padding: 1rem 1.5rem;
    border-radius: var(--radius-medium);
    display: inline-block;
}

.arena-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 1.5rem;
}

.arena-card {
    border: 1.5px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 1.5rem;
    position: relative;
    transition: var(--transition-medium);
}

.arena-card:hover {
    border-color: var(--color-accent-primary);
    box-shadow: var(--shadow-medium);
}

.arena-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--color-border-light);
}

.arena-card-label {
    font-weight: 700;
    color: var(--color-neutral-primary);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.arena-card-rag {
    font-size: 0.8rem;
    color: var(--color-neutral-secondary);
    background: var(--color-bg-primary);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
}

.arena-card-rag .provider-icon {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    object-fit: contain;
}

.arena-card-body {
    color: var(--color-neutral-primary);
    line-height: 1.65;
    font-size: 0.95rem;
    min-height: 100px;
}

.arena-card-footer {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--color-border-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.arena-card-score {
    display: flex;
    gap: 0.75rem;
    font-size: 0.8rem;
    color: var(--color-neutral-secondary);
}

.arena-card-score span {
    background: rgba(61, 107, 79, 0.08);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
}

.arena-choose-btn {
    padding: 0.5rem 1.25rem;
    background: var(--color-neutral-inverse);
    color: white;
    border: none;
    border-radius: var(--radius-small);
    font-weight: 600;
    font-size: 0.85rem;
    cursor: pointer;
    transition: var(--transition-fast);
}

.arena-choose-btn:hover {
    background: var(--color-btn-primary-hover);
}

/* Arena loading spinner */
.arena-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100px;
    gap: 1rem;
}

.arena-spinner .spinner {
    width: 28px;
    height: 28px;
    border: 3px solid var(--color-border-light);
    border-top-color: var(--color-accent-primary);
    border-radius: 50%;
    animation: arena-spin 0.8s linear infinite;
}

@keyframes arena-spin {
    to { transform: rotate(360deg); }
}

.arena-spinner .spinner-label {
    font-size: 0.82rem;
    color: var(--color-neutral-secondary);
    font-style: italic;
}

/* Arena card states */
.arena-card.is-loading .arena-card-body,
.arena-card.is-loading .arena-card-footer {
    display: none;
}

.arena-card.is-loading .arena-spinner {
    display: flex;
}

.arena-card:not(.is-loading) .arena-spinner {
    display: none;
}

/* Typewriter reveal */
.arena-card .arena-card-body {
    overflow: hidden;
}

.arena-card.is-revealing .arena-card-body {
    animation: arena-fadeIn 0.4s ease-out;
}

@keyframes arena-fadeIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}

.arena-card.is-revealing .arena-card-footer {
    animation: arena-fadeIn 0.3s ease-out 0.2s both;
}

/* Response time badge */
.arena-response-time {
    font-size: 0.8rem;
    color: var(--color-accent-secondary);
    background: rgba(184, 160, 128, 0.12);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-variant-numeric: tabular-nums;
}

/* Chosen / dimmed states */
.arena-card.is-chosen {
    border-color: #b8860b !important;
    box-shadow: 0 0 0 2px rgba(184, 134, 11, 0.25), var(--shadow-medium) !important;
    background: rgba(184, 134, 11, 0.04);
}

.arena-card.is-chosen .arena-choose-btn {
    background: #b8860b;
    pointer-events: none;
}

.arena-card.is-chosen .arena-card-label {
    color: #b8860b;
}

.arena-card.is-dimmed {
    opacity: 0.45;
    pointer-events: none;
    filter: grayscale(0.3);
    transition: opacity 0.4s ease, filter 0.4s ease;
}

.arena-card.is-dimmed .arena-choose-btn {
    background: #999;
}

/* Reset button */
.arena-reset-btn {
    display: none;
    margin: 1rem auto 0;
    padding: 0.4rem 1rem;
    background: transparent;
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-small);
    color: var(--color-neutral-secondary);
    font-size: 0.82rem;
    cursor: pointer;
    transition: var(--transition-fast);
}

.arena-reset-btn:hover {
    border-color: var(--color-neutral-inverse);
    color: var(--color-neutral-primary);
}

.arena-demo.has-chosen .arena-reset-btn {
    display: block;
}

/* How It Works */
.how-it-works {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 2rem;
    margin-top: 2rem;
}

.step-card {
    text-align: center;
    padding: 2rem 1.5rem;
    background: var(--color-surface-light);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    position: relative;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.5s ease, transform 0.5s ease;
}

.step-card.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.step-card .step-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 1rem;
    color: var(--color-accent-primary);
}

.step-card .step-icon svg {
    width: 100%;
    height: 100%;
}

.step-number {
    width: 40px;
    height: 40px;
    background: var(--color-neutral-inverse);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 1.1rem;
    margin: 0 auto 1.25rem;
}

.step-card h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.15rem;
    color: var(--color-neutral-primary);
    margin-bottom: 0.75rem;
}

.step-card p {
    color: var(--color-neutral-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
}

/* Feature Grid */
.feature-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
    margin-top: 2rem;
}

.feature-card {
    background: var(--color-surface-light);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 2rem;
    transition: var(--transition-medium);
}

.feature-card:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
}

.feature-card-icon {
    width: 48px;
    height: 48px;
    background: rgba(61, 107, 79, 0.08);
    border-radius: var(--radius-medium);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
    color: var(--color-accent-tertiary);
    font-size: 1.4rem;
}

.feature-card h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    color: var(--color-neutral-primary);
    margin-bottom: 0.5rem;
}

.feature-card p {
    color: var(--color-neutral-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
}

/* Routing Section */
.routing-section {
    background: var(--color-bg-accent);
    padding: var(--section-spacing) 2rem;
    margin: var(--section-spacing) 0;
}

.routing-inner {
    max-width: 1200px;
    margin: 0 auto;
}

.routing-flow {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin: 3rem auto;
    max-width: 900px;
    flex-wrap: wrap;
}

.routing-node {
    background: var(--color-surface-light);
    border: 1.5px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 1.25rem 1.5rem;
    text-align: center;
    min-width: 160px;
    box-shadow: var(--shadow-small);
}

.routing-node.question {
    background: var(--color-neutral-inverse);
    color: white;
    border-color: var(--color-neutral-inverse);
}

.routing-node.question .node-label {
    color: rgba(255,255,255,0.7);
}

.routing-node.winner {
    border-color: var(--color-accent-tertiary);
    background: rgba(61, 107, 79, 0.05);
}

.node-label {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-neutral-secondary);
    margin-bottom: 0.35rem;
    font-weight: 600;
}

.node-value {
    font-family: 'Fraunces', serif;
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-neutral-primary);
}

.routing-node.question .node-value {
    color: white;
}

.routing-arrow {
    color: var(--color-accent-primary);
    font-size: 1.5rem;
    font-weight: 700;
}

/* Routing flow animation */
.routing-node, .routing-arrow {
    opacity: 0;
    transform: translateX(-15px);
    transition: opacity 0.4s ease, transform 0.4s ease;
}

.routing-flow.is-animated .routing-node,
.routing-flow.is-animated .routing-arrow {
    opacity: 1;
    transform: translateX(0);
}

.routing-flow.is-animated .routing-node:nth-child(1) { transition-delay: 0s; }
.routing-flow.is-animated .routing-arrow:nth-child(2) { transition-delay: 0.3s; }
.routing-flow.is-animated .routing-node:nth-child(3) { transition-delay: 0.6s; }
.routing-flow.is-animated .routing-arrow:nth-child(4) { transition-delay: 0.9s; }
.routing-flow.is-animated .routing-node:nth-child(5) { transition-delay: 1.2s; }
.routing-flow.is-animated .routing-arrow:nth-child(6) { transition-delay: 1.5s; }
.routing-flow.is-animated .routing-node:nth-child(7) { transition-delay: 1.8s; }

/* Pulse on the winner node after animation */
.routing-flow.is-animated .routing-node.winner {
    animation: winner-pulse 2s ease-in-out 2.2s infinite;
}

@keyframes winner-pulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(61, 107, 79, 0.2); }
    50% { box-shadow: 0 0 0 8px rgba(61, 107, 79, 0); }
}

/* Providers */
.providers-grid {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-top: 2rem;
}

.provider-badge {
    background: var(--color-surface-light);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-small);
    padding: 0.75rem 1.5rem;
    font-size: 0.9rem;
    color: var(--color-neutral-primary);
    font-weight: 500;
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    transition: var(--transition-medium);
}

.provider-badge:hover {
    border-color: var(--color-accent-primary);
    box-shadow: var(--shadow-small);
    transform: translateY(-2px);
}

.provider-badge img {
    width: 22px;
    height: 22px;
    object-fit: contain;
}

/* RAG Architecture Cards */
.architectures-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1.5rem;
    margin-top: 2rem;
    max-width: 1000px;
    margin-left: auto;
    margin-right: auto;
}

.arch-card {
    background: var(--color-surface-light);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 1.5rem;
    transition: var(--transition-medium);
    opacity: 0;
    transform: translateY(16px);
}

.arch-card.is-visible {
    opacity: 1;
    transform: translateY(0);
}

.arch-card:hover {
    border-color: var(--color-accent-primary);
    box-shadow: var(--shadow-medium);
}

.arch-diagram {
    margin-bottom: 1rem;
    padding: 0.5rem 0;
}

.arch-diagram svg {
    width: 100%;
    height: auto;
}

.arch-card h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    color: var(--color-neutral-primary);
    margin-bottom: 0.5rem;
}

.arch-card p {
    font-size: 0.88rem;
    color: var(--color-neutral-secondary);
    line-height: 1.6;
}

@media (max-width: 640px) {
    .architectures-grid { grid-template-columns: 1fr; }
}

/* CTA Section — refined card on warm parchment */
.feature-page .arena-cta-wrapper {
    position: relative;
    padding: var(--section-spacing) 2rem !important;
    margin: 0 !important;
    max-width: 100% !important;
    overflow: visible;
    background: transparent !important;
}

.arena-cta {
    text-align: center !important;
    padding: 4rem 3.5rem !important;
    max-width: 800px !important;
    margin: 0 auto !important;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: var(--color-neutral-inverse, #2d5a4f) !important;
    border-radius: var(--radius-large, 16px) !important;
    box-shadow:
        0 4px 24px rgba(30, 58, 43, 0.12),
        0 12px 48px rgba(30, 58, 43, 0.06) !important;
}

/* Subtle sacred geometry ring behind the card */
.feature-page .arena-cta-wrapper::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 600px;
    height: 600px;
    border: 1px solid rgba(184, 160, 128, 0.1);
    border-radius: 50%;
    pointer-events: none;
}

.feature-page .arena-cta-wrapper::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(30deg);
    width: 480px;
    height: 480px;
    border: 1px solid rgba(184, 160, 128, 0.07);
    border-radius: 50%;
    pointer-events: none;
}

.arena-cta h2 {
    font-family: 'Fraunces', serif;
    font-size: var(--text-h2);
    color: var(--color-surface-light, #faf8f5) !important;
    margin-bottom: 1rem;
    text-shadow: none !important;
    position: relative;
    z-index: 1;
}

.arena-cta p {
    color: rgba(255,255,255,0.75);
    font-size: 1.05rem;
    line-height: 1.7;
    margin-bottom: 2rem;
    text-shadow: none !important;
    max-width: 550px;
    position: relative;
    z-index: 1;
}

.arena-cta .hero-ctas {
    display: flex !important;
    gap: 1rem !important;
    justify-content: center !important;
    flex-wrap: wrap !important;
    position: relative;
    z-index: 1;
}

.arena-cta .cta-primary {
    display: inline-flex !important;
    align-items: center !important;
    padding: 0.875rem 2rem !important;
    background: var(--color-surface-light, #faf8f5) !important;
    color: var(--color-neutral-primary, #2d3c34) !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    text-decoration: none !important;
    transition: all 0.2s ease !important;
}

.arena-cta .cta-primary:hover {
    background: white !important;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.arena-cta .cta-secondary {
    display: inline-flex !important;
    align-items: center !important;
    padding: 0.875rem 2rem !important;
    background: transparent !important;
    border: 1.5px solid rgba(255,255,255,0.3) !important;
    color: var(--color-surface-light, #faf8f5) !important;
    border-radius: 6px !important;
    font-weight: 600 !important;
    text-decoration: none !important;
    transition: all 0.2s ease !important;
}

.arena-cta .cta-secondary:hover {
    background: rgba(255,255,255,0.08) !important;
    border-color: rgba(255,255,255,0.5) !important;
}

/* Responsive */
@media (max-width: 768px) {
    .arena-cards {
        grid-template-columns: 1fr;
    }
    .how-it-works {
        grid-template-columns: 1fr 1fr;
    }
    .feature-grid {
        grid-template-columns: 1fr;
    }
    .routing-flow {
        flex-direction: column;
    }
    .routing-arrow {
        transform: rotate(90deg);
    }
}

@media (max-width: 480px) {
    .how-it-works {
        grid-template-columns: 1fr;
    }
}
</style>

<div class="arena-hero">
<div class="arena-hero-bg">
<video autoplay muted loop playsinline poster="/images/rag-arena-hero.png">
<source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/rag-arena-battle.webm" type="video/webm">
<source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/rag-arena-battle.mp4" type="video/mp4">
</video>
</div>
<div class="arena-hero-inner">
<div class="arena-hero-card">
<h1>RAG Arena &<br>Dynamic Routing</h1>
<p class="subtitle">Compare multiple knowledge bases side-by-side, discover which performs best for each question type, and let the system automatically route future queries to the winning source.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Request demo</a>
<a href="/autorag/" class="cta-secondary">Explore AutoRAG</a>
</div>
</div>
</div>
</div>

<!-- Arena Demo -->
<section class="arena-section">
<h2>Side-by-Side Knowledge Comparison</h2>
<p class="section-subtitle">Send a question to multiple RAG configurations simultaneously. See how different knowledge bases respond, then pick the winner.</p>
<div class="arena-demo">
<div class="arena-demo-header">
<div class="question">"What are the recommended dosing guidelines for this medication?"</div>
</div>
<div class="arena-cards" id="arena-cards">
<div class="arena-card is-loading" data-variant="a" data-time="1.2">
<div class="arena-card-header">
<span class="arena-card-label">Variant A</span>
<span class="arena-card-rag"><img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/qdrant-logomark.svg" alt="Qdrant" class="provider-icon" width="16" height="16">Qdrant</span>
</div>
<div class="arena-spinner"><div class="spinner"></div><span class="spinner-label">Retrieving context...</span></div>
<div class="arena-card-body">
Based on the clinical documentation, the recommended starting dose is 10mg daily, with titration up to 40mg based on patient response. Key monitoring parameters include...
</div>
<div class="arena-card-footer">
<div class="arena-card-score">
<span>Relevance: 0.94</span>
<span>Hallucination: 0.02</span>
<span class="arena-response-time">1.2s</span>
</div>
<button class="arena-choose-btn" onclick="arenaChoose(this)">Choose</button>
</div>
</div>
<div class="arena-card is-loading" data-variant="b" data-time="2.1">
<div class="arena-card-header">
<span class="arena-card-label">Variant B</span>
<span class="arena-card-rag"><img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/Cloudflare-logo.svg" alt="Cloudflare" class="provider-icon" width="16" height="16">Cloudflare Vectorize</span>
</div>
<div class="arena-spinner"><div class="spinner"></div><span class="spinner-label">Retrieving context...</span></div>
<div class="arena-card-body">
Dosing should begin at the lowest effective dose. The product label indicates 10-20mg as the typical range. Patients should be monitored for adverse effects during the first two weeks...
</div>
<div class="arena-card-footer">
<div class="arena-card-score">
<span>Relevance: 0.87</span>
<span>Hallucination: 0.05</span>
<span class="arena-response-time">2.1s</span>
</div>
<button class="arena-choose-btn" onclick="arenaChoose(this)">Choose</button>
</div>
</div>
</div>
<button class="arena-reset-btn" onclick="arenaReset()">Try again</button>
</div>

<script>
// Arena demo — loading animation + choose interaction
(function() {
  var triggered = false;

  function revealCard(card, delay) {
    setTimeout(function() {
      card.classList.remove('is-loading');
      card.classList.add('is-revealing');
      setTimeout(function() { card.classList.remove('is-revealing'); }, 800);
    }, delay);
  }

  function onVisible() {
    if (triggered) return;
    var demo = document.getElementById('arena-cards');
    if (!demo) return;
    var rect = demo.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.8 && rect.bottom > 0) {
      triggered = true;
      var cards = demo.querySelectorAll('.arena-card');
      // Variant A arrives after 1.2s, Variant B after 2.1s
      if (cards[0]) revealCard(cards[0], 1200);
      if (cards[1]) revealCard(cards[1], 2100);
      window.removeEventListener('scroll', onVisible);
    }
  }

  window.addEventListener('scroll', onVisible, { passive: true });
  // Check on load in case already in view
  setTimeout(onVisible, 500);
})();

function arenaChoose(btn) {
  var chosen = btn.closest('.arena-card');
  var demo = chosen.closest('.arena-demo');
  var cards = demo.querySelectorAll('.arena-card');
  demo.classList.add('has-chosen');
  cards.forEach(function(c) {
    if (c === chosen) {
      c.classList.add('is-chosen');
      c.querySelector('.arena-choose-btn').textContent = 'Winner';
    } else {
      c.classList.add('is-dimmed');
    }
  });
}

function arenaReset() {
  var demo = document.querySelector('.arena-demo');
  var cards = demo.querySelectorAll('.arena-card');
  demo.classList.remove('has-chosen');
  cards.forEach(function(c) {
    c.classList.remove('is-chosen', 'is-dimmed', 'is-loading', 'is-revealing');
    c.querySelector('.arena-choose-btn').textContent = 'Choose';
  });
}

// Step cards — staggered scroll reveal
(function() {
  var stepsTriggered = false;
  function checkSteps() {
    if (stepsTriggered) return;
    var container = document.getElementById('how-it-works');
    if (!container) return;
    var rect = container.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      stepsTriggered = true;
      var cards = container.querySelectorAll('.step-card');
      cards.forEach(function(card, i) {
        setTimeout(function() { card.classList.add('is-visible'); }, i * 200);
      });
      window.removeEventListener('scroll', checkSteps);
    }
  }
  window.addEventListener('scroll', checkSteps, { passive: true });
  setTimeout(checkSteps, 600);
})();

// Routing flow — sequential reveal
(function() {
  var routingTriggered = false;
  function checkRouting() {
    if (routingTriggered) return;
    var flow = document.querySelector('.routing-flow');
    if (!flow) return;
    var rect = flow.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      routingTriggered = true;
      flow.classList.add('is-animated');
      window.removeEventListener('scroll', checkRouting);
    }
  }
  window.addEventListener('scroll', checkRouting, { passive: true });
  setTimeout(checkRouting, 600);
})();

// Architecture cards — staggered scroll reveal
(function() {
  var archTriggered = false;
  function checkArch() {
    if (archTriggered) return;
    var grid = document.getElementById('arch-grid');
    if (!grid) return;
    var rect = grid.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      archTriggered = true;
      var cards = grid.querySelectorAll('.arch-card');
      cards.forEach(function(card, i) {
        setTimeout(function() { card.classList.add('is-visible'); }, i * 200);
      });
      window.removeEventListener('scroll', checkArch);
    }
  }
  window.addEventListener('scroll', checkArch, { passive: true });
  setTimeout(checkArch, 600);
})();
</script>
</section>

<!-- How It Works -->
<section class="arena-section">
<h2>How RAG Arena Works</h2>
<p class="section-subtitle">A structured process for finding the best knowledge base configuration for every question type.</p>
<div class="how-it-works" id="how-it-works">
<div class="step-card">
<div class="step-icon"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="8" y="12" width="20" height="28" rx="3"/><rect x="36" y="12" width="20" height="28" rx="3"/><line x1="14" y1="20" x2="22" y2="20"/><line x1="14" y1="26" x2="22" y2="26"/><line x1="42" y1="20" x2="50" y2="20"/><line x1="42" y1="26" x2="50" y2="26"/><path d="M18 44 L18 50 L46 50 L46 44" stroke-dasharray="3 3"/><circle cx="32" cy="54" r="4" fill="none"/></svg></div>
<div class="step-number">1</div>
<h3>Configure Variants</h3>
<p>Set up 2-8 arena variants, each pointing to a different RAG vector or knowledge base.</p>
</div>
<div class="step-card">
<div class="step-icon"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="32" cy="14" r="6"/><path d="M32 20 L12 36"/><path d="M32 20 L32 36"/><path d="M32 20 L52 36"/><rect x="4" y="36" width="16" height="12" rx="2"/><rect x="24" y="36" width="16" height="12" rx="2"/><rect x="44" y="36" width="16" height="12" rx="2"/><line x1="8" y1="42" x2="16" y2="42"/><line x1="28" y1="42" x2="36" y2="42"/><line x1="48" y1="42" x2="56" y2="42"/></svg></div>
<div class="step-number">2</div>
<h3>Run in Parallel</h3>
<p>Send questions to all variants simultaneously. Each retrieves context from its own knowledge base.</p>
</div>
<div class="step-card">
<div class="step-icon"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="6" y="14" width="24" height="36" rx="3"/><rect x="34" y="14" width="24" height="36" rx="3"/><line x1="12" y1="22" x2="24" y2="22"/><line x1="12" y1="28" x2="24" y2="28"/><line x1="40" y1="22" x2="52" y2="22"/><line x1="40" y1="28" x2="52" y2="28"/><path d="M12 38 L24 38" stroke="rgba(61,107,79,0.6)"/><circle cx="14" cy="44" r="2" fill="currentColor" opacity="0.3"/><circle cx="20" cy="44" r="2" fill="currentColor" opacity="0.3"/><circle cx="26" cy="44" r="0.5" fill="currentColor" opacity="0.15"/><path d="M40 38 L48 38" stroke="rgba(184,160,128,0.6)"/><circle cx="42" cy="44" r="2" fill="currentColor" opacity="0.2"/><circle cx="48" cy="44" r="2" fill="currentColor" opacity="0.2"/></svg></div>
<div class="step-number">3</div>
<h3>Compare & Score</h3>
<p>View responses side-by-side with inline quality scores for relevance, hallucination, and completeness.</p>
</div>
<div class="step-card">
<div class="step-icon"><svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="32" cy="20" r="10" stroke-dasharray="4 3"/><path d="M32 30 L32 42"/><path d="M26 48 L32 42 L38 48"/><path d="M22 54 L32 48 L42 54" stroke-dasharray="3 3"/><circle cx="22" cy="56" r="3"/><circle cx="42" cy="56" r="3"/><polyline points="28 18 31 22 38 14" stroke-width="2"/></svg></div>
<div class="step-number">4</div>
<h3>Learn & Route</h3>
<p>The system learns which knowledge base wins for each question type and routes future queries automatically.</p>
</div>
</div>
</section>

<!-- Dynamic Routing -->
<div class="routing-section">
<div class="routing-inner">
<section class="arena-section" style="padding-left: 0; padding-right: 0;">
<h2>Dynamic RAG Routing</h2>
<p class="section-subtitle">Once arena results establish preferences, incoming questions are automatically routed to the best-performing knowledge base — no manual configuration needed.</p>
<div class="routing-flow">
<div class="routing-node question">
<div class="node-label">Incoming</div>
<div class="node-value">User Question</div>
</div>
<div class="routing-arrow">&#8594;</div>
<div class="routing-node">
<div class="node-label">Semantic Match</div>
<div class="node-value">Route Lookup</div>
</div>
<div class="routing-arrow">&#8594;</div>
<div class="routing-node winner">
<div class="node-label">Best Match</div>
<div class="node-value">Qdrant (0.94)</div>
</div>
<div class="routing-arrow">&#8594;</div>
<div class="routing-node">
<div class="node-label">Response</div>
<div class="node-value">Optimized Answer</div>
</div>
</div>
</section>
</div>
</div>

<!-- Features -->
<section class="arena-section">
<h2>Built for Enterprise RAG</h2>
<p class="section-subtitle">Everything you need to optimize retrieval quality at scale.</p>
<div class="feature-grid">
<div class="feature-card">
<div class="feature-card-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
</div>
<h3>Multi-Provider Support</h3>
<p>Compare across Qdrant, Cloudflare Vectorize, Couchbase, MongoDB Atlas, and more in a single arena experiment.</p>
</div>
<div class="feature-card">
<div class="feature-card-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
</div>
<h3>Inline Quality Scoring</h3>
<p>Every response is scored for relevance, hallucination, correctness, and completeness in real time.</p>
</div>
<div class="feature-card">
<div class="feature-card-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
</div>
<h3>Auto-Fix Integration</h3>
<p>Arena results feed into the QA auto-fix loop, automatically learning optimal routing with quality thresholds.</p>
</div>
<div class="feature-card">
<div class="feature-card-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
</div>
<h3>Full Audit Trail</h3>
<p>Every routing decision is tracked with source (arena, auto-fix, or manual), scores, and timestamps in MongoDB.</p>
</div>
<div class="feature-card">
<div class="feature-card-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
</div>
<h3>Fast Routing via KV</h3>
<p>Learned preferences stored in Cloudflare KV for sub-millisecond lookups. MongoDB maintains the full history.</p>
</div>
<div class="feature-card">
<div class="feature-card-icon">
<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
</div>
<h3>Arena Presets</h3>
<p>Save, name, and reuse arena configurations. Export as portable JSON for sharing across teams.</p>
</div>
</div>
</section>

<!-- Supported Providers -->
<section class="arena-section">
<h2>Supported Vector Providers</h2>
<p class="section-subtitle">Run arena experiments across any combination of vector databases.</p>
<div class="providers-grid">
<div class="provider-badge"><img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/qdrant-logomark.svg" alt="Qdrant">Qdrant</div>
<div class="provider-badge"><img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/Cloudflare-logo.svg" alt="Cloudflare">Cloudflare Vectorize</div>
<div class="provider-badge"><img src="https://pub-67b9e94061a04db7a525d7b025776d27.r2.dev/couchbase-icon.svg" alt="Couchbase">Couchbase</div>
<div class="provider-badge"><img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/Google_Favicon_2025.svg.png" alt="Google">Vertex AI Vector Search</div>
<div class="provider-badge"><svg width="22" height="22" viewBox="0 0 24 24" fill="#47A248" stroke="none"><path d="M17.193 9.555c-1.264-5.58-4.252-7.414-4.573-8.115-.28-.394-.53-.954-.735-1.44-.036.495-.055.685-.523 1.184-.723.566-4.438 3.682-4.74 10.02-.282 5.912 4.27 9.435 4.888 9.884l.07.05A73.49 73.49 0 0111.91 24h.481c.114-1.032.284-2.056.51-3.07.417-.296.604-.463.85-.693a11.342 11.342 0 003.639-8.464c.01-.814-.103-1.662-.197-2.218zm-5.336 8.195s0-8.291.275-8.29c.213 0 .49 10.695.49 10.695-.381-.045-.765-1.76-.765-2.405z"/></svg>MongoDB Atlas</div>
<div class="provider-badge"><svg width="22" height="22" viewBox="0 0 24 24" fill="#DC382D" stroke="none"><path d="M22.71 13.145c-1.66 2.092-3.452 4.483-7.038 4.483-3.203 0-4.397-2.825-4.48-5.12.701 1.484 2.073 2.685 4.214 2.63 4.117-.133 6.94-3.852 6.94-7.239 0-4.05-3.022-6.972-8.268-6.972-3.752 0-8.4 1.428-11.455 3.685C2.59 6.937 3.885 9.958 4.35 9.626c2.648-1.904 4.748-3.13 6.784-3.744C8.12 9.244.886 17.05 0 18.425c.1 1.261 1.66 4.648 2.424 4.648.232 0 .431-.133.664-.365a100.49 100.49 0 005.54-6.765c.222 3.104 1.748 6.898 6.014 6.898 3.819 0 7.604-2.756 9.33-8.965.2-.764-.73-1.361-1.261-.73zm-4.349-5.013c0 1.959-1.926 2.922-3.685 2.922-.941 0-1.664-.247-2.235-.568 1.051-1.592 2.092-3.225 3.21-4.973 1.972.334 2.71 1.43 2.71 2.619z"/></svg>Redis</div>
<div class="provider-badge"><img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/pageindex-logo.png" alt="PageIndex">PageIndex</div>
</div>
</section>

<!-- RAG Architectures -->
<section class="arena-section">
<h2>RAG Retrieval Architectures</h2>
<p class="section-subtitle">Route queries to different retrieval strategies based on question type. Each architecture optimizes for different use cases.</p>
<div class="architectures-grid" id="arch-grid">

<div class="arch-card">
<div class="arch-diagram">
<svg viewBox="0 0 200 80" fill="none" stroke-linecap="round">
<text x="10" y="12" font-size="8" fill="#8b7659" font-family="sans-serif">VECTOR SEARCH</text>
<circle cx="30" cy="40" r="12" stroke="#b8a080" stroke-width="1.5"/>
<text x="26" y="44" font-size="10" fill="#2d3c34" font-family="serif">Q</text>
<line x1="42" y1="40" x2="70" y2="40" stroke="#b8a080" stroke-width="1" stroke-dasharray="4 3"/>
<rect x="70" y="28" width="60" height="24" rx="4" stroke="#3d6b4f" stroke-width="1.5" fill="rgba(61,107,79,0.06)"/>
<text x="82" y="44" font-size="9" fill="#2d3c34" font-family="sans-serif">Embed</text>
<line x1="130" y1="40" x2="155" y2="30" stroke="#b8a080" stroke-width="1"/>
<line x1="130" y1="40" x2="155" y2="40" stroke="#b8a080" stroke-width="1"/>
<line x1="130" y1="40" x2="155" y2="50" stroke="#b8a080" stroke-width="1"/>
<circle cx="162" cy="30" r="5" stroke="#3d6b4f" stroke-width="1" fill="rgba(61,107,79,0.1)"/>
<circle cx="162" cy="40" r="5" stroke="#3d6b4f" stroke-width="1" fill="rgba(61,107,79,0.1)"/>
<circle cx="162" cy="50" r="5" stroke="#3d6b4f" stroke-width="1" fill="rgba(61,107,79,0.1)"/>
<line x1="167" y1="30" x2="185" y2="40" stroke="#b8a080" stroke-width="1"/>
<line x1="167" y1="40" x2="185" y2="40" stroke="#b8a080" stroke-width="1"/>
<line x1="167" y1="50" x2="185" y2="40" stroke="#b8a080" stroke-width="1"/>
<circle cx="190" cy="40" r="6" stroke="#2d5a4f" stroke-width="1.5" fill="rgba(45,90,79,0.1)"/>
<text x="186" y="43" font-size="8" fill="#2d5a4f" font-family="serif">R</text>
</svg>
</div>
<h3>Vector Search</h3>
<p>Semantic similarity matching via dense embeddings. Best for natural language questions and conceptual lookups.</p>
</div>

<div class="arch-card">
<div class="arch-diagram">
<svg viewBox="0 0 200 80" fill="none" stroke-linecap="round">
<text x="10" y="12" font-size="8" fill="#8b7659" font-family="sans-serif">HYBRID SEARCH</text>
<circle cx="30" cy="40" r="12" stroke="#b8a080" stroke-width="1.5"/>
<text x="26" y="44" font-size="10" fill="#2d3c34" font-family="serif">Q</text>
<line x1="42" y1="35" x2="70" y2="25" stroke="#b8a080" stroke-width="1" stroke-dasharray="4 3"/>
<line x1="42" y1="45" x2="70" y2="55" stroke="#b8a080" stroke-width="1" stroke-dasharray="4 3"/>
<rect x="70" y="15" width="50" height="20" rx="3" stroke="#3d6b4f" stroke-width="1.2" fill="rgba(61,107,79,0.06)"/>
<text x="78" y="29" font-size="8" fill="#2d3c34" font-family="sans-serif">Vector</text>
<rect x="70" y="45" width="50" height="20" rx="3" stroke="#8b7659" stroke-width="1.2" fill="rgba(184,160,128,0.08)"/>
<text x="80" y="59" font-size="8" fill="#2d3c34" font-family="sans-serif">BM25</text>
<line x1="120" y1="25" x2="145" y2="40" stroke="#b8a080" stroke-width="1"/>
<line x1="120" y1="55" x2="145" y2="40" stroke="#b8a080" stroke-width="1"/>
<rect x="145" y="28" width="30" height="24" rx="4" stroke="#2d5a4f" stroke-width="1.5" fill="rgba(45,90,79,0.08)"/>
<text x="150" y="44" font-size="7" fill="#2d5a4f" font-family="sans-serif">RRF</text>
<line x1="175" y1="40" x2="190" y2="40" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="193" cy="40" r="4" fill="#2d5a4f" opacity="0.2"/>
</svg>
</div>
<h3>Hybrid (BM25 + Vector)</h3>
<p>Combines keyword matching with semantic search using Reciprocal Rank Fusion. Best for precise technical queries.</p>
</div>

<div class="arch-card">
<div class="arch-diagram">
<svg viewBox="0 0 200 80" fill="none" stroke-linecap="round">
<text x="10" y="12" font-size="8" fill="#8b7659" font-family="sans-serif">RERANKING</text>
<circle cx="20" cy="40" r="10" stroke="#b8a080" stroke-width="1.5"/>
<text x="17" y="44" font-size="9" fill="#2d3c34" font-family="serif">Q</text>
<line x1="30" y1="40" x2="50" y2="40" stroke="#b8a080" stroke-width="1" stroke-dasharray="4 3"/>
<rect x="50" y="25" width="40" height="30" rx="3" stroke="#3d6b4f" stroke-width="1.2" fill="rgba(61,107,79,0.06)"/>
<text x="55" y="44" font-size="7" fill="#2d3c34" font-family="sans-serif">Retrieve</text>
<line x1="90" y1="32" x2="115" y2="28" stroke="#b8a080" stroke-width="1"/>
<line x1="90" y1="37" x2="115" y2="37" stroke="#b8a080" stroke-width="1"/>
<line x1="90" y1="42" x2="115" y2="42" stroke="#b8a080" stroke-width="1"/>
<line x1="90" y1="47" x2="115" y2="47" stroke="#b8a080" stroke-width="1"/>
<line x1="90" y1="52" x2="115" y2="52" stroke="#b8a080" stroke-width="1"/>
<rect x="115" y="20" width="45" height="40" rx="3" stroke="#8b7659" stroke-width="1.5" fill="rgba(184,160,128,0.06)"/>
<text x="118" y="35" font-size="7" fill="#2d3c34" font-family="sans-serif">Cross-</text>
<text x="118" y="45" font-size="7" fill="#2d3c34" font-family="sans-serif">encoder</text>
<text x="118" y="55" font-size="7" fill="#8b7659" font-family="sans-serif">rerank</text>
<line x1="160" y1="40" x2="178" y2="40" stroke="#2d5a4f" stroke-width="1.5"/>
<rect x="178" y="32" width="16" height="16" rx="2" stroke="#2d5a4f" stroke-width="1.5" fill="rgba(45,90,79,0.1)"/>
<text x="182" y="43" font-size="7" fill="#2d5a4f" font-family="sans-serif">3</text>
</svg>
</div>
<h3>Reranking</h3>
<p>Initial retrieval followed by cross-encoder reranking for precision. Best for high-stakes answers requiring accuracy.</p>
</div>

<div class="arch-card">
<div class="arch-diagram">
<svg viewBox="0 0 200 80" fill="none" stroke-linecap="round">
<text x="10" y="12" font-size="8" fill="#8b7659" font-family="sans-serif">AGENTIC RAG</text>
<circle cx="20" cy="45" r="10" stroke="#b8a080" stroke-width="1.5"/>
<text x="17" y="49" font-size="9" fill="#2d3c34" font-family="serif">Q</text>
<line x1="30" y1="45" x2="50" y2="45" stroke="#b8a080" stroke-width="1" stroke-dasharray="4 3"/>
<rect x="50" y="30" width="40" height="30" rx="4" stroke="#2d5a4f" stroke-width="1.5" fill="rgba(45,90,79,0.08)"/>
<text x="55" y="43" font-size="7" fill="#2d3c34" font-family="sans-serif">Agent</text>
<text x="55" y="53" font-size="7" fill="#3d6b4f" font-family="sans-serif">Router</text>
<path d="M90 38 L110 25" stroke="#3d6b4f" stroke-width="1"/>
<path d="M90 45 L110 45" stroke="#3d6b4f" stroke-width="1"/>
<path d="M90 52 L110 65" stroke="#3d6b4f" stroke-width="1"/>
<rect x="110" y="17" width="35" height="16" rx="2" stroke="#b8a080" stroke-width="1" fill="rgba(184,160,128,0.06)"/>
<text x="115" y="28" font-size="7" fill="#2d3c34" font-family="sans-serif">KB 1</text>
<rect x="110" y="37" width="35" height="16" rx="2" stroke="#b8a080" stroke-width="1" fill="rgba(184,160,128,0.06)"/>
<text x="115" y="48" font-size="7" fill="#2d3c34" font-family="sans-serif">KB 2</text>
<rect x="110" y="57" width="35" height="16" rx="2" stroke="#b8a080" stroke-width="1" fill="rgba(184,160,128,0.06)"/>
<text x="115" y="68" font-size="7" fill="#2d3c34" font-family="sans-serif">Tools</text>
<path d="M145 25 L165 40 M145 45 L165 40 M145 65 L165 40" stroke="#b8a080" stroke-width="1"/>
<rect x="165" y="30" width="28" height="20" rx="3" stroke="#2d5a4f" stroke-width="1.5" fill="rgba(45,90,79,0.1)"/>
<text x="170" y="44" font-size="7" fill="#2d5a4f" font-family="sans-serif">Syn</text>
</svg>
</div>
<h3>Agentic RAG</h3>
<p>LLM-driven routing across multiple knowledge bases and tools. Best for complex multi-step questions requiring synthesis.</p>
</div>

</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Find your optimal RAG configuration</h2>
<p>Stop guessing which knowledge base performs best. Let RAG Arena show you the data, then let Dynamic Routing handle the rest.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Request demo</a>
<a href="/quality-assurance/" class="cta-secondary">Explore Quality Assurance</a>
</div>
</section>
</div>
