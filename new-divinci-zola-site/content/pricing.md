+++
title = "Pricing Plans | Divinci AI"
description = "Divinci AI offers flexible pricing plans for businesses of all sizes. Choose from our Starter, Pro, and Enterprise plans to create custom AI solutions for your organization."
template = "feature.html"
+++

<style>
/* Page-specific Leonardo journal background */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-pricing.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

/* Variables are loaded via base template, no need to import here */

/* Pricing-specific styles - Force tan background */
.pricing-section {
    background-color: #f8f4f0 !important; /* Force tan background */
    background-image: none !important; /* Remove any background images */
    padding: 5rem 0;
    position: relative;
    overflow: hidden;
}

/* More specific targeting */
main.feature-page .pricing-section {
    background-color: #f8f4f0 !important;
}

/* Override any body/html dark styles */
html, body {
    background-color: #f8f4f0 !important;
}

/* Force background colors specifically where needed */
html, body, main, .feature-page {
    background-color: #f8f4f0 !important;
}

/* Ensure specific components have proper backgrounds and text colors */
.pricing-card, .faq-item, .faq-section {
    background-color: white !important;
    color: #2d3c34 !important;
}

.pricing-features li {
    color: #2d3c34 !important;
}

.pricing-features li.unavailable {
    color: #999 !important;
}

.enterprise-card {
    background: linear-gradient(135deg, #2d5a4f, #7ba8d1) !important;
    color: white !important;
}

/* Ensure proper background colors without affecting header */
.feature-page main {
    background-color: var(--color-bg-primary, #f8f4f0);
}

/* Override dark mode specifically for pricing content */
@media (prefers-color-scheme: dark) {
    .pricing-section,
    .faq-section {
        background-color: var(--color-bg-primary, #f8f4f0) !important;
        color: var(--color-text-primary, #2d3c34) !important;
    }
}

/* Subtle background sketches like homepage */
.pricing-section::before {
    content: '';
    position: absolute;
    top: 100px;
    right: 10%;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    border: 1px solid var(--color-border-accent);
    opacity: 0.08;
    z-index: 0;
}

.pricing-section::after {
    content: '';
    position: absolute;
    bottom: 150px;
    left: 5%;
    width: 250px;
    height: 250px;
    border-radius: 50%;
    border: 1px solid var(--color-accent-primary-20);
    opacity: 0.06;
    z-index: 0;
}

/* Additional subtle geometric elements inspired by Leonardo's sketches */
.pricing-cards::before {
    content: '';
    position: absolute;
    top: -50px;
    left: 20%;
    width: 150px;
    height: 150px;
    border: 1px solid var(--color-accent-primary-10);
    border-radius: 12px;
    transform: rotate(15deg);
    opacity: 0.04;
    z-index: 0;
}

/* Removed conflicting pseudo-element */

/* Very subtle texture overlay like homepage */
.pricing-section {
    position: relative;
}

.pricing-section .pricing-header::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 200px;
    height: 200px;
    transform: translate(-50%, -50%) rotate(45deg);
    border: 1px solid var(--color-accent-primary-10);
    border-radius: 20px;
    opacity: 0.02;
    z-index: 0;
}

.pricing-header {
    text-align: center;
    margin-bottom: 4rem;
    position: relative;
    z-index: 1;
}

.pricing-title {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-neutral-inverse, #2d5a4f);
    margin-bottom: 1rem;
    background: var(--gradient-primary, linear-gradient(135deg, #2d5a4f, #7ba8d1));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    display: inline-block;
}

.pricing-subtitle {
    font-size: 1.2rem;
    color: var(--color-text-tertiary, #666);
    max-width: 700px;
    margin: 0 auto;
}

.pricing-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 2rem 0;
}

.pricing-toggle span {
    font-size: 1rem;
    color: var(--color-text-tertiary, #666);
    cursor: pointer;
    transition: all 0.3s ease;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    user-select: none;
}

.pricing-toggle span:hover {
    background-color: rgba(123, 168, 209, 0.1);
}

.pricing-toggle span.active {
    color: var(--color-neutral-inverse, #2d5a4f);
    font-weight: 600;
    background-color: rgba(123, 168, 209, 0.15);
}

.toggle-switch {
    position: relative;
    display: inline-block;
    width: 80px;
    height: 40px;
    margin: 0 15px;
    cursor: pointer;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-text-muted);
    transition: .4s;
    border-radius: 40px;
}

.toggle-slider:before {
    position: absolute;
    content: "";
    height: 32px;
    width: 32px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

input:checked + .toggle-slider {
    background-color: var(--color-accent-primary);
}

input:checked + .toggle-slider:before {
    transform: translateX(40px);
}

.pricing-cards {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 30px;
    position: relative;
    z-index: 1;
}

.pricing-card {
    background: var(--color-surface-light, #ffffff);
    border-radius: 12px;
    box-shadow: var(--shadow-large);
    padding: 2.5rem;
    flex: 1;
    min-width: 280px;
    max-width: 350px;
    transition: var(--transition-medium);
    position: relative;
    overflow: hidden;
    border: 1px solid var(--color-border-light);
}

/* Pricing cards container */
.pricing-cards {
    position: relative;
}

.pricing-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.10);
    border-color: var(--color-accent-primary-20);
}

.pricing-card.featured {
    border-top: 5px solid var(--color-accent-primary);
    transform: scale(1.05);
}

.pricing-card.featured:hover {
    transform: scale(1.05) translateY(-5px);
}

.pricing-card::before {
    content: '';
    position: absolute;
    top: -30px;
    right: -30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    border: 1px solid var(--color-accent-primary-10);
    opacity: 0.08;
    z-index: 0;
}

.pricing-plan {
    font-size: 1.3rem;
    font-weight: 700;
    color: var(--color-neutral-inverse, #2d5a4f);
    margin-bottom: 0.5rem;
}

.pricing-description {
    color: var(--color-text-tertiary, #666);
    font-size: 0.9rem;
    margin-bottom: 2rem;
    min-height: 40px;
}

.pricing-price {
    font-size: 2.5rem;
    font-weight: 700;
    color: var(--color-neutral-inverse, #2d5a4f);
    margin-bottom: 0.5rem;
}

.pricing-price .currency {
    font-size: 1.5rem;
    vertical-align: super;
    margin-right: 0.25rem;
}

.pricing-price .period {
    font-size: 1rem;
    color: var(--color-text-tertiary, #666);
    font-weight: 400;
}

.pricing-popular {
    position: absolute;
    top: 15px;
    right: -30px;
    background: var(--gradient-secondary);
    color: white;
    padding: 5px 40px;
    font-size: 0.8rem;
    font-weight: 600;
    transform: rotate(45deg);
}

.pricing-features {
    margin: 2rem 0;
    padding: 0;
    list-style-type: none;
}

.pricing-features li {
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--color-border-light);
    color: var(--color-text-primary);
    font-size: 0.95rem;
    padding-left: 30px;
    position: relative;
}

.pricing-features li:last-child {
    border-bottom: none;
}

.pricing-features li::before {
    content: '\f00c';
    font-family: 'Font Awesome 6 Free';
    font-weight: 900;
    color: var(--color-accent-primary, #7ba8d1);
    position: absolute;
    left: 0;
}

.pricing-features li.unavailable {
    color: var(--color-text-muted);
}

.pricing-features li.unavailable::before {
    content: '\f00d';
    color: var(--color-text-muted);
}

/* Feature dropdown styles */
.pricing-features li.feature-dropdown {
    cursor: pointer;
    position: relative;
}

.feature-main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    font-weight: 600;
}

.feature-arrow {
    font-size: 0.7rem;
    color: var(--color-accent-primary, #7ba8d1);
    transition: transform 0.3s ease;
    margin-left: auto;
}

.feature-dropdown.active .feature-arrow {
    transform: rotate(90deg);
}

.feature-details-wrapper {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease-out;
    width: 100%;
    box-sizing: border-box;
}

.feature-dropdown.active .feature-details-wrapper {
    max-height: 250px;
}

.feature-details {
    background-color: white;
    border-radius: 6px;
    margin: 0.5rem 0 0 0;
    padding: 0.75rem;
    border-left: 3px solid var(--color-accent-primary, #7ba8d1);
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
}

.feature-detail {
    margin: 0.3rem 0;
    font-size: 0.85rem;
    color: #333;
    line-height: 1.4;
    position: relative;
    padding-left: 1rem;
    display: block;
    width: 100%;
    word-wrap: break-word;
    overflow-wrap: break-word;
    flex-shrink: 0;
}

.feature-detail::before {
    content: '•';
    color: var(--color-accent-primary, #7ba8d1);
    position: absolute;
    left: 0;
    font-weight: bold;
}

.feature-detail:first-child {
    margin-top: 0;
}

.feature-detail:last-child {
    margin-bottom: 0;
}

.pricing-cta {
    display: block;
    width: 100%;
    padding: 1rem;
    background: #2d5a4f !important;
    color: white !important;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    text-align: center;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.3s ease;
}

.pricing-cta:hover {
    background: #1e3d35 !important;
    color: white !important;
}

.pricing-cta.featured {
    background: var(--gradient-secondary) !important;
    color: white !important;
}

.pricing-cta.featured:hover {
    background: linear-gradient(135deg, var(--color-accent-secondary), var(--color-accent-tertiary)) !important;
    color: white !important;
}

.enterprise-card {
    background: var(--gradient-primary, linear-gradient(135deg, #2d5a4f, #7ba8d1));
    color: white;
    padding: 3rem;
    border-radius: 12px;
    text-align: center;
    margin-top: 4rem;
    position: relative;
    overflow: hidden;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

.enterprise-card::before {
    content: '';
    position: absolute;
    top: -80px;
    right: -80px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    opacity: 0.2;
}

.enterprise-card::after {
    content: '';
    position: absolute;
    bottom: -60px;
    left: -60px;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    opacity: 0.1;
}

.enterprise-title {
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: white;
    display: inline-block;
}

.enterprise-text {
    font-size: 1.1rem;
    max-width: 700px;
    margin: 0 auto 2rem;
    opacity: 0.9;
    color: white;
}

.enterprise-cta {
    display: inline-block;
    padding: 1rem 2rem;
    background: white !important;
    color: #2d5a4f !important;
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.3s ease;
}

.enterprise-cta:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
    background: white !important;
    color: #2d5a4f !important;
}

.faq-section {
    padding: 3rem 0 6rem;
    background: #f8f4f0 !important; /* Match tan background */
    position: relative;
}

.faq-title {
    text-align: center;
    font-size: 2rem;
    font-weight: 700;
    color: var(--color-neutral-inverse, #2d5a4f);
    margin-bottom: 3rem;
}

.faq-container {
    max-width: 800px;
    margin: 0 auto;
}

.faq-item {
    margin-bottom: 1rem;
    border: 1px solid var(--color-border-medium);
    border-radius: 8px;
    overflow: hidden;
    background: white;
}

.faq-question {
    width: 100%;
    padding: 1.5rem;
    background: none;
    border: none;
    text-align: left;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--color-neutral-inverse, #2d5a4f);
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: background-color 0.2s ease;
}

.faq-question:hover {
    background-color: var(--color-surface-gray);
}

.faq-icon {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--color-accent-primary, #7ba8d1);
    transition: transform 0.3s ease;
}

.faq-question.active .faq-icon {
    transform: rotate(45deg);
}

.faq-answer {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
    background-color: var(--color-surface-warm);
}

.faq-answer.open {
    max-height: 200px;
}

.faq-answer-content {
    padding: 1.5rem;
    border-top: 1px solid var(--color-border-medium);
}

.faq-answer p {
    margin: 0;
    color: var(--color-text-tertiary, #666);
    line-height: 1.6;
}

/* Annual/Monthly toggle display */
.pricing-amount {
    display: none;
}

.pricing-amount.active {
    display: block;
}

/* Responsive adjustments */
@media screen and (max-width: 768px) {
    .pricing-card {
        max-width: 100%;
        margin-bottom: 2rem;
    }

    .pricing-card.featured {
        transform: none;
    }

    .pricing-card.featured:hover {
        transform: translateY(-5px);
    }

    .enterprise-card {
        padding: 2rem;
    }
}
</style>

<section class="pricing-section" style="padding-top: 6rem; padding-bottom: 6rem; background-color: #f8f4f0 !important; background-image: none !important;">
<div class="container">
<div class="pricing-header">
<h1 class="pricing-title">Simple, Transparent Pricing</h1>
<p class="pricing-subtitle">Choose the plan that's right for your business. All plans include core features, updates, and basic support.</p>

<div class="pricing-toggle">
<span class="monthly active">Monthly</span>
<label class="toggle-switch">
<input type="checkbox" id="pricingToggle">
<span class="toggle-slider"></span>
</label>
<span class="annual">Annual <span class="has-text-success">(Save 20%)</span></span>
</div>
</div>

<div class="pricing-cards">
<!-- Starter Plan -->
<div class="pricing-card">
<h2 class="pricing-plan">Starter</h2>
<p class="pricing-description">Perfect for small teams and individual projects</p>

<div class="pricing-amount monthly active">
<div class="pricing-price">
<span class="currency">$</span>20<span class="period">/mo</span>
</div>
</div>

<div class="pricing-amount annual">
<div class="pricing-price">
<span class="currency">$</span>16<span class="period">/mo</span>
</div>
<div class="pricing-billed">Billed annually ($192)</div>
</div>

<ul class="pricing-features">
<li>Up to 3 users</li>
<li class="feature-dropdown" data-feature="basic-rag">
<span class="feature-main">Basic RAG capabilities <i class="fas fa-chevron-right feature-arrow"></i></span>
<div class="feature-details-wrapper">
<div class="feature-details">
<div class="feature-detail">Document ingestion and indexing</div>
<div class="feature-detail">Basic semantic search</div>
<div class="feature-detail">Simple Q&A functionality</div>
<div class="feature-detail">PDF and text file support</div>
</div>
</div>
</li>
<li class="feature-dropdown" data-feature="basic-fine-tuning">
<span class="feature-main">Fine tuning <i class="fas fa-chevron-right feature-arrow"></i></span>
<div class="feature-details-wrapper">
<div class="feature-details">
<div class="feature-detail">Basic model customization</div>
<div class="feature-detail">Pre-built templates</div>
<div class="feature-detail">Standard training datasets</div>
<div class="feature-detail">Community model library access</div>
</div>
</div>
</li>
<li>10GB document storage</li>
<li>100K tokens/day</li>
<li>Basic analytics</li>
<li>Email support</li>
<li class="unavailable">Advanced security features</li>
<li class="unavailable">API access</li>
<li class="unavailable">Custom integrations</li>
</ul>

<a href="#signup" class="pricing-cta">Get Started</a>
</div>

<!-- Pro Plan -->
<div class="pricing-card featured">
<div class="pricing-popular">Most Popular</div>
<h2 class="pricing-plan">Pro</h2>
<p class="pricing-description">Ideal for growing businesses and teams</p>

<div class="pricing-amount monthly active">
<div class="pricing-price">
<span class="currency">$</span>100<span class="period">/mo</span>
</div>
</div>

<div class="pricing-amount annual">
<div class="pricing-price">
<span class="currency">$</span>80<span class="period">/mo</span>
</div>
<div class="pricing-billed">Billed annually ($960)</div>
</div>

<ul class="pricing-features">
<li>Up to 10 users</li>
<li class="feature-dropdown" data-feature="advanced-rag">
<span class="feature-main">Advanced RAG capabilities <i class="fas fa-chevron-right feature-arrow"></i></span>
<div class="feature-details-wrapper">
<div class="feature-details">
<div class="feature-detail">Multi-modal document processing</div>
<div class="feature-detail">Advanced semantic search with filters</div>
<div class="feature-detail">Context-aware responses</div>
<div class="feature-detail">Custom embeddings</div>
<div class="feature-detail">Real-time data syncing</div>
</div>
</div>
</li>
<li class="feature-dropdown" data-feature="advanced-fine-tuning">
<span class="feature-main">Advanced fine tuning <i class="fas fa-chevron-right feature-arrow"></i></span>
<div class="feature-details-wrapper">
<div class="feature-details">
<div class="feature-detail">Custom model architectures</div>
<div class="feature-detail">Advanced training parameters</div>
<div class="feature-detail">Custom dataset upload</div>
<div class="feature-detail">Model versioning and rollback</div>
<div class="feature-detail">Performance optimization tools</div>
</div>
</div>
</li>
<li>50GB document storage</li>
<li>500K tokens/day</li>
<li>Full analytics dashboard</li>
<li>Priority support</li>
<li>Advanced security features</li>
<li>API access</li>
<li class="unavailable">Custom integrations</li>
</ul>

<a href="#signup" class="pricing-cta featured">Get Started</a>
</div>

<!-- Business Plan -->
<div class="pricing-card">
<h2 class="pricing-plan">Business</h2>
<p class="pricing-description">For larger teams with advanced needs</p>

<div class="pricing-amount monthly active">
<div class="pricing-price">
<span class="currency">$</span>200<span class="period">/mo</span>
</div>
</div>

<div class="pricing-amount annual">
<div class="pricing-price">
<span class="currency">$</span>160<span class="period">/mo</span>
</div>
<div class="pricing-billed">Billed annually ($1,920)</div>
</div>

<ul class="pricing-features">
<li>Up to 25 users</li>
<li class="feature-dropdown" data-feature="premium-rag">
<span class="feature-main">Premium RAG capabilities <i class="fas fa-chevron-right feature-arrow"></i></span>
<div class="feature-details-wrapper">
<div class="feature-details">
<div class="feature-detail">Enterprise-grade document processing</div>
<div class="feature-detail">Advanced AI reasoning and inference</div>
<div class="feature-detail">Multi-language support</div>
<div class="feature-detail">Custom knowledge graphs</div>
<div class="feature-detail">Real-time collaboration features</div>
<div class="feature-detail">Advanced security and compliance</div>
</div>
</div>
</li>
<li class="feature-dropdown" data-feature="premium-fine-tuning">
<span class="feature-main">Premium fine tuning <i class="fas fa-chevron-right feature-arrow"></i></span>
<div class="feature-details-wrapper">
<div class="feature-details">
<div class="feature-detail">Enterprise model development</div>
<div class="feature-detail">Custom training pipelines</div>
<div class="feature-detail">Advanced hyperparameter optimization</div>
<div class="feature-detail">Multi-GPU training support</div>
<div class="feature-detail">Federated learning capabilities</div>
<div class="feature-detail">Dedicated model infrastructure</div>
</div>
</div>
</li>
<li>200GB document storage</li>
<li>2M tokens/day</li>
<li>Advanced analytics & reporting</li>
<li>24/7 priority support</li>
<li>Enterprise-grade security</li>
<li>Full API access</li>
<li>Standard integrations</li>
</ul>

<a href="#signup" class="pricing-cta">Get Started</a>
</div>
</div>

<!-- Enterprise Section -->
<div class="enterprise-card">
<h2 class="enterprise-title">Enterprise</h2>
<p class="enterprise-text">Need a custom solution for your large organization? Our Enterprise plan includes custom AI model development, dedicated support, SSO, custom security policies, and more.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="enterprise-cta" target="_blank" rel="noopener">Schedule Demo</a>
</div>
</div>
</section>

<section class="faq-section" style="margin-top: 2rem; background-color: #f8f4f0 !important;">
<div class="container">
<h2 class="faq-title">Frequently Asked Questions</h2>
<div class="faq-container">
<div class="faq-item">
<button class="faq-question">
What's included in all plans?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>All plans include access to our core Divinci AI platform, which enables you to create custom AI solutions. Every plan also includes basic document processing, knowledge extraction capabilities, regular updates, and access to our support resources.</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
How does token usage work?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>Tokens are the units of text processing for AI models. Each plan includes a daily token allowance that resets every 24 hours. Token usage is calculated for both input (prompts, documents) and output (AI responses). If you exceed your daily limit, you can purchase additional tokens or upgrade to a higher plan.</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
Can I upgrade or downgrade my plan?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>Yes, you can upgrade your plan at any time, and the change will take effect immediately. For downgrades, the change will take effect at the end of your current billing cycle. You'll receive a prorated credit for any unused time on your previous plan when upgrading.</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
What payment methods do you accept?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>We accept all major credit cards (Visa, Mastercard, American Express, Discover) and PayPal. For Enterprise plans, we also offer invoicing options with net-30 terms.</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
Is there a free trial available?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>Yes, we offer a 14-day free trial on our Starter and Pro plans. No credit card is required to start your trial. You'll have full access to all features included in the plan during your trial period.</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
What happens to my data if I cancel?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>Your data will remain in our system for 30 days after cancellation, giving you time to export anything you need. After 30 days, all data will be permanently deleted from our systems in accordance with our data retention policy.</p>
</div>
</div>
</div>
</div>
</div>
</section>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Pricing toggle
    const pricingToggle = document.getElementById('pricingToggle');
    const monthlySpan = document.querySelector('.pricing-toggle .monthly');
    const annualSpan = document.querySelector('.pricing-toggle .annual');
    const monthlyPrices = document.querySelectorAll('.pricing-amount.monthly');
    const annualPrices = document.querySelectorAll('.pricing-amount.annual');

    pricingToggle.addEventListener('change', function() {
        if (this.checked) {
            // Annual pricing
            monthlySpan.classList.remove('active');
            annualSpan.classList.add('active');

            monthlyPrices.forEach(price => price.classList.remove('active'));
            annualPrices.forEach(price => price.classList.add('active'));
        } else {
            // Monthly pricing
            monthlySpan.classList.add('active');
            annualSpan.classList.remove('active');

            monthlyPrices.forEach(price => price.classList.add('active'));
            annualPrices.forEach(price => price.classList.remove('active'));
        }
    });

    // Monthly/Annual text click also toggles
    monthlySpan.addEventListener('click', function() {
        pricingToggle.checked = false;
        pricingToggle.dispatchEvent(new Event('change'));
    });

    annualSpan.addEventListener('click', function() {
        pricingToggle.checked = true;
        pricingToggle.dispatchEvent(new Event('change'));
    });

    // Feature dropdown functionality
    const featureDropdowns = document.querySelectorAll('.feature-dropdown');
    console.log('Found feature dropdowns:', featureDropdowns.length);
    
    featureDropdowns.forEach((dropdown, index) => {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            console.log(`Feature dropdown ${index} clicked`);
            const isCurrentlyOpen = this.classList.contains('active');
            
            // Toggle this dropdown
            if (isCurrentlyOpen) {
                this.classList.remove('active');
                console.log('Closed feature dropdown');
            } else {
                this.classList.add('active');
                console.log('Opened feature dropdown');
            }
        });
    });

    // FAQ accordion functionality
    const faqQuestions = document.querySelectorAll('.faq-question');
    console.log('Found FAQ questions:', faqQuestions.length);
    
    faqQuestions.forEach((question, index) => {
        question.addEventListener('click', function() {
            console.log(`FAQ question ${index} clicked`);
            const faqAnswer = this.nextElementSibling;
            const isCurrentlyOpen = this.classList.contains('active');
            
            console.log('Question element:', this);
            console.log('Answer element:', faqAnswer);
            console.log('Is currently open:', isCurrentlyOpen);
            
            // Close all FAQ items first (including this one)
            faqQuestions.forEach((otherQuestion, otherIndex) => {
                otherQuestion.classList.remove('active');
                const otherAnswer = otherQuestion.nextElementSibling;
                if (otherAnswer) {
                    otherAnswer.classList.remove('open');
                    console.log(`Closed FAQ item ${otherIndex}`);
                }
            });
            
            // If this FAQ was closed, open it
            if (!isCurrentlyOpen) {
                this.classList.add('active');
                faqAnswer.classList.add('open');
                console.log('Opened current FAQ item');
            } else {
                console.log('FAQ item stays closed (was clicked to close)');
            }
        });
    });
});
</script>