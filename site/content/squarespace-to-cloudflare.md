+++
title = "Squarespace → Cloudflare + AI — Convert your site with Divinci"
description = "Turn your Squarespace site into a fast, self-hosted Cloudflare Workers site with a built-in AI chat assistant. Divinci's Site Converter screenshots your live page and regenerates clean, editable HTML with a vision model — then you own the code."
template = "feature.html"
[extra]
feature_category = "data-management"
+++

<style>
.section-padding { padding: 4rem 0; }

.section-heading {
    font-family: 'Fraunces', serif;
    font-size: 2.6rem;
    color: #1e3a2b;
    text-align: center;
    margin-top: 4rem;
    margin-bottom: 2.5rem;
    line-height: 1.2;
}
.section-subheading {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.1rem;
    color: #5a6862;
    text-align: center;
    max-width: 760px;
    margin: -1.5rem auto 3rem;
    line-height: 1.55;
}

/* Three-step flow */
.sq-steps {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 1rem;
}
.sq-step {
    background: #faf8f5;
    border: 1.5px solid #d8ccb6;
    border-radius: 12px;
    padding: 1.75rem 1.5rem;
    display: flex;
    flex-direction: column;
}
.sq-step .sq-num {
    font-family: 'DM Mono', monospace;
    font-weight: 700;
    color: #2d5a4f;
    font-size: 0.9rem;
    letter-spacing: 0.08em;
    margin-bottom: 0.6rem;
}
.sq-step h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.3rem;
    color: #1e3a2b;
    margin: 0 0 0.6rem;
}
.sq-step p {
    font-size: 0.98rem;
    color: #3a4a40;
    line-height: 1.6;
    margin: 0;
}

/* Feature grid */
.sq-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1.25rem;
    max-width: 980px;
    margin: 0 auto;
    padding: 0 1rem;
}
.sq-card {
    background: rgba(232, 221, 199, 0.25);
    border: 1px solid rgba(139, 118, 89, 0.2);
    border-radius: 12px;
    padding: 1.5rem 1.75rem;
}
.sq-card h4 {
    font-size: 1.05rem;
    color: #1e3a2b;
    margin: 0 0 0.5rem;
    font-weight: 700;
}
.sq-card p { font-size: 0.96rem; color: #3a4a40; line-height: 1.6; margin: 0; }

.sq-note {
    max-width: 820px;
    margin: 2.5rem auto 0;
    padding: 1.25rem 1.75rem;
    background: rgba(45, 90, 79, 0.06);
    border-left: 3px solid #2d5a4f;
    border-radius: 6px;
    font-size: 0.95rem;
    color: #3a4a40;
    line-height: 1.6;
}

@media (max-width: 900px) {
    .sq-steps { grid-template-columns: 1fr; }
    .sq-grid { grid-template-columns: 1fr; }
}
</style>

<section class="section-padding">
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">Squarespace → Cloudflare + AI</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 840px; margin: 0 auto 2rem; line-height: 1.55;">Own your site's code and add an AI assistant. Divinci's <strong>Site Converter</strong> screenshots your live Squarespace page and regenerates it as clean, editable HTML — ready to host on Cloudflare Workers, with a built-in Divinci chat widget trained on your content.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://app.divinci.app/signup" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Convert your site</a>
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Talk to us →</a>
  </p>
</section>

<h2 class="section-heading">How it works</h2>
<p class="section-subheading">Paste a URL. Get clean code back. Deploy it anywhere — with an AI assistant baked in.</p>

<div class="sq-steps">
  <div class="sq-step">
    <div class="sq-num">STEP 01</div>
    <h3>Paste your URL</h3>
    <p>Point Divinci at your live Squarespace page (single page or a whole sitemap). We screenshot it server-side — no plugin, no export dance, no account handoff.</p>
  </div>
  <div class="sq-step">
    <div class="sq-num">STEP 02</div>
    <h3>AI regenerates the HTML</h3>
    <p>A vision model reads the screenshot and reconstructs the page as clean, semantic HTML + Tailwind (or plain CSS / Bootstrap). Real images are cropped from the capture and hosted for you — no placeholder gray boxes.</p>
  </div>
  <div class="sq-step">
    <div class="sq-num">STEP 03</div>
    <h3>Deploy + add AI chat</h3>
    <p>Download the code and host it on Cloudflare Workers — fast, cheap, and yours. Drop in Divinci's chat widget so visitors can ask questions answered from your own content.</p>
  </div>
</div>

<h2 class="section-heading">What you get</h2>

<div class="sq-grid">
  <div class="sq-card">
    <h4>Code you own</h4>
    <p>Plain, editable HTML/CSS — no proprietary block system, no monthly platform lock-in. Edit it by hand, in any editor, or with an AI coding assistant.</p>
  </div>
  <div class="sq-card">
    <h4>Faster, cheaper hosting</h4>
    <p>Static assets on Cloudflare's edge load fast worldwide and cost a fraction of a hosted site-builder subscription.</p>
  </div>
  <div class="sq-card">
    <h4>A built-in AI assistant</h4>
    <p>Add Divinci's embeddable chat — grounded in your pages, products, and docs — so visitors get answers instead of a search box.</p>
  </div>
  <div class="sq-card">
    <h4>Multi-page in one pass</h4>
    <p>Give us a sitemap and we convert every page, stitching the navigation between them so the whole site comes across, not just the home page.</p>
  </div>
</div>

<div class="sq-note">
  <strong>Convert sites you own.</strong> The Site Converter is built for migrating <em>your</em> site — the one you're paying a site-builder subscription for — onto infrastructure and code you control. Please only convert pages you own or are authorized to reproduce.
</div>

<h2 class="section-heading">Ready to own your site?</h2>
<p class="section-subheading">Convert a page in a couple of minutes, or talk to us about migrating a full site plus an AI assistant.</p>
<p style="text-align: center; margin: 0 0 4rem;">
  <a href="https://app.divinci.app/signup" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Get started free</a>
  <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Book a demo →</a>
</p>
