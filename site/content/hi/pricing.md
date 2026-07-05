+++
title = "मूल्य निर्धारण योजनाएँ"
description = "Divinci AI हर आकार के व्यवसाय के लिए लचीली मूल्य योजनाएं प्रदान करता है। अपने संगठन के लिए कस्टम AI समाधान बनाने के लिए हमारी Starter, Pro, और Enterprise योजनाओं में से चुनें।"
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
    background-color: var(--color-bg-primary, #f8f4f0) !important;
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
    background: var(--color-bg-primary, #f8f4f0);
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

/* Coming-soon overlay: scoped to individual PAID cards (checkout isn't wired
   to a live Stripe price yet), not the whole grid — Free sign-up is real and
   working today, so it stays uncovered. */
.pricing-card.coming-soon {
    position: relative;
}

.pricing-card.coming-soon::after {
    content: "Coming Soon — Contact Us for Early Access";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(248, 244, 240, 0.92);
    backdrop-filter: blur(6px);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Fraunces', serif;
    font-size: 1.4rem;
    font-weight: 400;
    color: var(--color-neutral-inverse, #2d5a4f);
    text-align: center;
    z-index: 5;
    border-radius: 12px;
    pointer-events: none;
}

.pricing-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.10);
    border-color: var(--color-accent-primary-20);
}

.pricing-card.featured {
    border-top: 4px solid var(--color-accent-primary);
    transform: scale(1.05);
    /* The "Most Popular" badge floats above the top edge — needs the card's
       own overflow to NOT clip it (unlike the other cards' corner circle). */
    overflow: visible;
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

/* Skip the decorative corner circle on the featured card — it would render
   fully visible (not corner-clipped) now that overflow is visible there,
   and the card already has the top accent border + badge for visual interest. */
.pricing-card.featured::before {
    display: none;
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

/* Floating pill badge, centered on the card's top edge — replaces the old
   diagonal corner-ribbon (magic-number geometry that only fit one specific
   card width and looked clipped/off-center at this card's actual size).
   Specificity + !important are required here: style.css has a broad
   `[class*="card"] > div { background-image: none !important; }` rule
   (anti-double-texture guard) that otherwise strips this badge's background
   — it's a direct-child div of .pricing-card and matches that selector. */
.pricing-card .pricing-popular {
    position: absolute;
    top: -14px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--gradient-secondary, var(--color-accent-primary)) !important;
    color: #fff;
    padding: 6px 18px;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    white-space: nowrap;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.18);
    z-index: 3;
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
    background-color: var(--color-bg-primary, #f8f4f0);
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
    color: #2d3c34;
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
    padding: 3rem 0 10rem;
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
    padding-bottom: 6rem;
}

.faq-item {
    margin-bottom: 1rem;
    border: 1px solid var(--color-border-medium);
    border-radius: 8px;
    overflow: hidden;
    background: var(--color-bg-primary, #f8f4f0);
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

/* Wide Enterprise panel — a horizontal card spanning the row instead of
   wrapping onto its own centered column (which is what a 4th flex item does
   when only 3 fit per row). Sits between the 3-card comparison and the
   "Need something bigger?" custom-deal banner: same light-card styling as
   the cards above (still reads as a real self-serve tier, priced) but full
   width, escalating naturally into the bolder gradient CTA below it. */
.pricing-enterprise-panel {
    width: 100%;
    max-width: 1100px;
    margin: 2.5rem auto 0;
    background: var(--color-bg-primary, #f8f4f0);
    border-radius: 12px;
    box-shadow: var(--shadow-large);
    border: 1px solid var(--color-border-light);
    padding: 2.5rem;
    position: relative;
    z-index: 1;
}

.ep-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2rem;
    flex-wrap: wrap;
    padding-bottom: 1.75rem;
    margin-bottom: 1.75rem;
    border-bottom: 1px solid var(--color-border-light);
}

.ep-title-group {
    flex: 1 1 240px;
}

.ep-title-group .pricing-description {
    margin-bottom: 0;
    min-height: 0;
}

.ep-price-group {
    flex: 0 0 auto;
}

.ep-price-group .pricing-price {
    margin-bottom: 0.25rem;
}

.ep-cta-wrap {
    flex: 0 0 auto;
    align-self: center;
}

.ep-cta-wrap .pricing-cta {
    display: inline-block;
    width: auto;
    white-space: nowrap;
    padding: 1rem 2rem;
}

.pricing-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
    gap: 0 2rem;
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

    .pricing-enterprise-panel {
        padding: 1.75rem;
    }

    .ep-cta-wrap {
        width: 100%;
    }

    .ep-cta-wrap .pricing-cta {
        width: 100%;
    }
}
</style>

<section class="pricing-section" style="padding-top: 6rem; padding-bottom: 6rem; background-color: #f8f4f0 !important; background-image: none !important;">
<div class="container">
<div class="pricing-header">
<h1 class="pricing-title">सरल, पारदर्शी मूल्य निर्धारण</h1>
<p class="pricing-subtitle">वह योजना चुनें जो आपके व्यवसाय के लिए सही हो। सभी योजनाओं में मुख्य सुविधाएँ, अपडेट और बुनियादी सहायता शामिल है।</p>

<div class="pricing-toggle">
<span class="monthly active">मासिक</span>
<label class="toggle-switch">
<input type="checkbox" id="pricingToggle">
<span class="toggle-slider"></span>
</label>
<span class="annual">वार्षिक <span class="has-text-success">(20% बचाएं)</span></span>
</div>
</div>

<div class="pricing-cards">
<!-- Free Plan — real, working sign-up today (not gated behind Stripe) -->
<div class="pricing-card">
<h2 class="pricing-plan">Free</h2>
<p class="pricing-description">बिना किसी लागत के Divinci के साथ निर्माण शुरू करें</p>

<div class="pricing-amount monthly active">
<div class="pricing-price">
<span class="currency">$</span>0<span class="period">/माह</span>
</div>
</div>

<div class="pricing-amount annual">
<div class="pricing-price">
<span class="currency">$</span>0<span class="period">/माह</span>
</div>
<div class="pricing-billed">हमेशा के लिए मुफ़्त</div>
</div>

<ul class="pricing-features">
<li>1 व्हाइट-लेबल रिलीज़</li>
<li>कम्युनिटी AI मॉडल (GPT, Gemini, Claude, Llama और अन्य)</li>
<li>बेसिक RAG — अपने स्वयं के दस्तावेज़ों पर आधारित उत्तर</li>
<li class="unavailable">स्कोर्ड QA मूल्यांकन सुइट</li>
<li class="unavailable">फाइन-ट्यूनिंग</li>
<li class="unavailable">Divinci ब्रांडिंग हटाएं</li>
<li class="unavailable">प्राथमिकता सहायता</li>
</ul>

<a href="https://chat.divinci.app/signup" class="pricing-cta" target="_blank" rel="noopener">मुफ़्त में साइन अप करें</a>
</div>

<!-- Starter Plan -->
<div class="pricing-card">
<h2 class="pricing-plan">Starter</h2>
<p class="pricing-description">छोटी टीमों और व्यक्तिगत प्रोजेक्ट्स के लिए एकदम सही</p>

<div class="pricing-amount monthly active">
<div class="pricing-price">
<span class="currency">$</span>29<span class="period">/माह</span>
</div>
</div>

<div class="pricing-amount annual">
<div class="pricing-price">
<span class="currency">$</span>24.17<span class="period">/माह</span>
</div>
<div class="pricing-billed">वार्षिक रूप से बिल किया गया ($290)</div>
</div>

<ul class="pricing-features">
<li>एकाधिक व्हाइट-लेबल रिलीज़</li>
<li>$5/माह की शामिल उपयोग क्रेडिट</li>
<li>कम्युनिटी + प्रीमियम AI मॉडल</li>
<li>बेसिक RAG — अपने स्वयं के दस्तावेज़ों पर आधारित उत्तर</li>
<li>स्कोर्ड QA मूल्यांकन सुइट</li>
<li>Divinci ब्रांडिंग हटाएं</li>
<li class="unavailable">एडवांस्ड RAG (मल्टी-इंडेक्स, रीरैंकिंग)</li>
<li class="unavailable">फाइन-ट्यूनिंग</li>
<li class="unavailable">प्राथमिकता सहायता</li>
</ul>

<a href="https://chat.divinci.app/user/wallet/subscription?plan=starter&billing=monthly" class="pricing-cta" data-plan="starter" target="_blank" rel="noopener">शुरू करें</a>
</div>

<!-- Pro Plan -->
<div class="pricing-card featured">
<div class="pricing-popular">सबसे लोकप्रिय</div>
<h2 class="pricing-plan">Pro</h2>
<p class="pricing-description">बढ़ते व्यवसायों और टीमों के लिए आदर्श</p>

<div class="pricing-amount monthly active">
<div class="pricing-price">
<span class="currency">$</span>99<span class="period">/माह</span>
</div>
</div>

<div class="pricing-amount annual">
<div class="pricing-price">
<span class="currency">$</span>82.50<span class="period">/माह</span>
</div>
<div class="pricing-billed">वार्षिक रूप से बिल किया गया ($990)</div>
</div>

<ul class="pricing-features">
<li>एकाधिक व्हाइट-लेबल रिलीज़</li>
<li>$25/माह की शामिल उपयोग क्रेडिट</li>
<li>कम्युनिटी + प्रीमियम AI मॉडल</li>
<li>एडवांस्ड RAG (मल्टी-इंडेक्स, रीरैंकिंग, उच्च सीमाएं)</li>
<li>स्कोर्ड QA मूल्यांकन सुइट</li>
<li>A/B रिलीज़ परीक्षण</li>
<li>RAG Arena — साथ-साथ मॉडल तुलना</li>
<li>फाइन-ट्यूनिंग</li>
<li>Divinci ब्रांडिंग हटाएं</li>
<li>प्राथमिकता सहायता</li>
</ul>

<a href="https://chat.divinci.app/user/wallet/subscription?plan=pro&billing=monthly" class="pricing-cta featured" data-plan="pro" target="_blank" rel="noopener">शुरू करें</a>
</div>

</div>

<!-- Enterprise Plan — a wide panel (not a 4th grid card) so it doesn't wrap
     onto its own orphaned column below a 3-across row. Self-serve, priced,
     still "Get Started" (not a contact-sales flow) — see the custom-deal
     callout below for anything beyond this tier. -->
<div class="pricing-enterprise-panel">
<div class="ep-header">
<div class="ep-title-group">
<h2 class="pricing-plan">Enterprise</h2>
<p class="pricing-description">उन्नत आवश्यकताओं वाली बड़ी टीमों के लिए</p>
</div>

<div class="ep-price-group">
<div class="pricing-amount monthly active">
<div class="pricing-price">
<span class="currency">$</span>499<span class="period">/माह</span>
</div>
</div>

<div class="pricing-amount annual">
<div class="pricing-price">
<span class="currency">$</span>415.83<span class="period">/माह</span>
</div>
<div class="pricing-billed">वार्षिक रूप से बिल किया गया ($4,990)</div>
</div>
</div>

<div class="ep-cta-wrap">
<a href="https://chat.divinci.app/user/wallet/subscription?plan=enterprise&billing=monthly" class="pricing-cta" data-plan="enterprise" target="_blank" rel="noopener">शुरू करें</a>
</div>
</div>

<ul class="pricing-features pricing-features-grid">
<li>असीमित व्हाइट-लेबल रिलीज़</li>
<li>$150/माह की शामिल उपयोग क्रेडिट</li>
<li>कम्युनिटी + प्रीमियम AI मॉडल</li>
<li>एडवांस्ड RAG (मल्टी-इंडेक्स, रीरैंकिंग, उच्च सीमाएं)</li>
<li>Scored QA, A/B परीक्षण, RAG Arena, फाइन-ट्यूनिंग</li>
<li>Divinci ब्रांडिंग हटाएं</li>
<li>प्राथमिकता सहायता</li>
<li>अपनी स्वयं की API कुंजियाँ लाएं (BYOK)</li>
<li>सिंगल साइन-ऑन (SSO)</li>
<li>कस्टम डोमेन</li>
<li>समर्पित सहायता</li>
</ul>
</div>

<!-- Custom-deal callout — for needs beyond the priced Enterprise tier above -->
<div class="enterprise-card">
<h2 class="enterprise-title">कुछ बड़ा चाहिए?</h2>
<p class="enterprise-text">उन संगठनों के लिए जिन्हें Enterprise योजना से भी अधिक की आवश्यकता है — कस्टम AI मॉडल डेवलपमेंट, ऑन-प्रिमाइसेस या समर्पित इंफ्रास्ट्रक्चर, कस्टम सुरक्षा नीतियां और परक्राम्य शर्तें — आइए बात करें।</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="enterprise-cta" target="_blank" rel="noopener">डेमो शेड्यूल करें</a>
</div>
</div>
</section>

<section class="faq-section" style="margin-top: 2rem; background-color: #f8f4f0 !important;">
<div class="container">
<h2 class="faq-title">अक्सर पूछे जाने वाले प्रश्न</h2>
<div class="faq-container">
<div class="faq-item">
<button class="faq-question">
सभी योजनाओं में क्या शामिल है?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>सभी योजनाओं में हमारे मुख्य Divinci AI प्लेटफ़ॉर्म तक पहुंच शामिल है, जो आपको कस्टम AI समाधान बनाने में सक्षम बनाता है। प्रत्येक योजना में बुनियादी दस्तावेज़ प्रोसेसिंग, ज्ञान निष्कर्षण क्षमताएं, नियमित अपडेट और हमारे सहायता संसाधनों तक पहुंच भी शामिल है।</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
उपयोग-आधारित बिलिंग कैसे काम करती है?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>भुगतान योजनाओं में एक मासिक क्रेडिट भत्ता शामिल है (ऊपर प्रत्येक योजना में दिखाया गया है) जो AI मॉडल उपयोग, RAG रिट्रीवल और अन्य मीटर्ड प्लेटफ़ॉर्म लागतों को कवर करता है। एक बार आपके शामिल क्रेडिट का उपयोग हो जाने के बाद, समान मीटर्ड दरों पर आपके वॉलेट बैलेंस से पे-एज़-यू-गो आधार पर उपयोग बिल किया जाता है।</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
क्या मैं अपनी योजना अपग्रेड या डाउनग्रेड कर सकता हूं?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>हां, आप किसी भी समय अपनी योजना अपग्रेड कर सकते हैं, और यह परिवर्तन तुरंत प्रभावी हो जाएगा। डाउनग्रेड के लिए, परिवर्तन आपके वर्तमान बिलिंग चक्र के अंत में प्रभावी होगा। अपग्रेड करते समय, आपको अपनी पिछली योजना पर किसी भी अप्रयुक्त समय के लिए आनुपातिक क्रेडिट प्राप्त होगा।</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
आप कौन से भुगतान तरीके स्वीकार करते हैं?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>हम सभी प्रमुख क्रेडिट कार्ड (Visa, Mastercard, American Express, Discover) और PayPal स्वीकार करते हैं। Enterprise योजनाओं के लिए, हम net-30 शर्तों के साथ इनवॉइसिंग विकल्प भी प्रदान करते हैं।</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
क्या कोई मुफ़्त ट्रायल उपलब्ध है?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>हां — हमारी Free योजना आपको बिना किसी क्रेडिट कार्ड और बिना किसी लागत के Divinci के साथ निर्माण शुरू करने देती है, ताकि आप भुगतान योजना चुनने से पहले प्लेटफ़ॉर्म को आज़मा सकें।</p>
</div>
</div>
</div>

<div class="faq-item">
<button class="faq-question">
यदि मैं रद्द करता हूं तो मेरे डेटा का क्या होगा?
<span class="faq-icon">+</span>
</button>
<div class="faq-answer">
<div class="faq-answer-content">
<p>रद्द करने के बाद आपका डेटा हमारे सिस्टम में 30 दिनों तक बना रहेगा, जिससे आपको जो भी चाहिए उसे एक्सपोर्ट करने का समय मिल जाएगा। 30 दिनों के बाद, हमारी डेटा रिटेंशन नीति के अनुसार सभी डेटा हमारे सिस्टम से स्थायी रूप से हटा दिया जाएगा।</p>
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

    // Keep each paid tier's "Get Started" deep link (?plan=X&billing=Y) in sync
    // with whichever billing cycle is currently toggled, so a visitor who
    // switches to Annual and clicks through lands on Stripe checkout for the
    // annual price, not monthly.
    const planCtaLinks = document.querySelectorAll('.pricing-cta[data-plan]');
    function syncPlanCtaBilling(cycle) {
        planCtaLinks.forEach(function(link) {
            try {
                const url = new URL(link.href);
                url.searchParams.set('billing', cycle);
                link.href = url.toString();
            } catch (e) { /* malformed href — leave as-is */ }
        });
    }

    pricingToggle.addEventListener('change', function() {
        if (this.checked) {
            // Annual pricing
            monthlySpan.classList.remove('active');
            annualSpan.classList.add('active');

            monthlyPrices.forEach(price => price.classList.remove('active'));
            annualPrices.forEach(price => price.classList.add('active'));
            syncPlanCtaBilling('annual');
        } else {
            // Monthly pricing
            monthlySpan.classList.add('active');
            annualSpan.classList.remove('active');

            monthlyPrices.forEach(price => price.classList.add('active'));
            annualPrices.forEach(price => price.classList.remove('active'));
            syncPlanCtaBilling('monthly');
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
