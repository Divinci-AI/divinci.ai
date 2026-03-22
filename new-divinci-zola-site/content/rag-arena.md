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
    padding: 0.625rem 1.25rem;
    font-size: 0.9rem;
    color: var(--color-neutral-primary);
    font-weight: 500;
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
<span class="arena-card-rag"><svg class="provider-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5"/><line x1="12" y1="22" x2="12" y2="15.5"/><polyline points="22 8.5 12 15.5 2 8.5"/></svg>Qdrant</span>
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
<span class="arena-card-rag"><svg class="provider-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 11.6c-.1-.5-.6-.9-1.1-.8l-8.5.6c-.1 0-.2.1-.2.1s-.1.1-.1.2c0 .1 0 .2.1.2.1.1.1.1.2.1l8.5-.6c.7 0 1.3-.5 1.5-1.2.2-.7.5-1.7.5-1.7 0-.1 0-.1 0-.2C16.6 5.2 13.8 3 10.5 3 7.8 3 5.4 4.5 4.4 6.8c-.5-.4-1.1-.6-1.8-.5C1.4 6.5.5 7.6.5 8.8v.3c-0 0 0 0 0 0C.5 9.1.3 12 2.6 12h13.3c.1 0 .3-.1.4-.1.1-.1.2-.2.2-.3z"/></svg>Cloudflare Vectorize</span>
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
</script>
</section>

<!-- How It Works -->
<section class="arena-section">
<h2>How RAG Arena Works</h2>
<p class="section-subtitle">A structured process for finding the best knowledge base configuration for every question type.</p>
<div class="how-it-works">
<div class="step-card">
<div class="step-number">1</div>
<h3>Configure Variants</h3>
<p>Set up 2-8 arena variants, each pointing to a different RAG vector or knowledge base.</p>
</div>
<div class="step-card">
<div class="step-number">2</div>
<h3>Run in Parallel</h3>
<p>Send questions to all variants simultaneously. Each retrieves context from its own knowledge base.</p>
</div>
<div class="step-card">
<div class="step-number">3</div>
<h3>Compare & Score</h3>
<p>View responses side-by-side with inline quality scores for relevance, hallucination, and completeness.</p>
</div>
<div class="step-card">
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
<div class="provider-badge">Qdrant</div>
<div class="provider-badge">Cloudflare Vectorize</div>
<div class="provider-badge">Couchbase</div>
<div class="provider-badge">MongoDB Atlas</div>
<div class="provider-badge">Custom Providers</div>
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
