+++
title = "Tutorials"
description = "Step-by-step tutorials for Divinci AI — publish your first assistant, build a knowledge base, embed chat on your site, integrate with the SDK and CLI, run QA suites, and give your assistant a voice."
template = "feature.html"
+++

<style>
/* Page-specific Leonardo journal background */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-api.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

.feature-page .tutorials-hero,
.feature-page .tutorials-section {
    margin-left: auto !important;
    margin-right: auto !important;
}

/* Hero */
.tutorials-hero {
    text-align: center;
    padding: 5rem 2rem 3rem;
    max-width: 900px;
    margin: 0 auto;
}

.tutorials-hero h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(2.25rem, 4vw, 3.25rem);
    color: var(--color-neutral-primary);
    margin-bottom: 1rem;
    line-height: 1.15;
}

.tutorials-hero .subtitle {
    font-size: 1.15rem;
    color: var(--color-neutral-secondary);
    line-height: 1.7;
    max-width: 700px;
    margin: 0 auto;
}

/* Sections */
.tutorials-section {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem 2rem;
}

.tutorials-section h2 {
    font-family: 'Fraunces', serif;
    font-size: var(--text-h2);
    color: var(--color-neutral-primary);
    margin-bottom: 0.75rem;
}

.tutorials-section .section-sub {
    color: var(--color-neutral-secondary);
    font-size: 1.05rem;
    margin-bottom: 2rem;
    max-width: 700px;
}

/* Difficulty badges */
.level-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    vertical-align: middle;
}

.level-beginner {
    background: rgba(61, 107, 79, 0.1);
    color: var(--color-accent-tertiary, #3d6b4f);
}

.level-intermediate {
    background: rgba(196, 148, 58, 0.14);
    color: #8a6519;
}

.level-advanced {
    background: rgba(140, 82, 60, 0.12);
    color: #8c523c;
}

/* Guide blocks (inline step-by-step walkthroughs) */
.guide-block {
    background: var(--color-bg-primary, #f8f4f0);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 2rem;
    margin-bottom: 1.5rem;
}

.guide-block h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.3rem;
    color: var(--color-neutral-primary);
    margin: 0 0 0.35rem;
}

.guide-block .guide-intro {
    color: var(--color-neutral-secondary);
    font-size: 0.95rem;
    line-height: 1.65;
    margin: 0.5rem 0 1rem;
}

.guide-block ol {
    margin: 0 0 1rem;
    padding-left: 1.4rem;
}

.guide-block ol li {
    color: var(--color-neutral-primary);
    font-size: 0.95rem;
    line-height: 1.7;
    margin-bottom: 0.5rem;
}

.guide-block .guide-note {
    color: var(--color-neutral-secondary);
    font-size: 0.88rem;
    line-height: 1.6;
    background: rgba(232, 221, 199, 0.35);
    border-left: 3px solid var(--color-border-medium);
    padding: 0.6rem 1rem;
    border-radius: 0 6px 6px 0;
    margin-bottom: 1rem;
}

.guide-block .card-link,
.tutorial-card .card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-neutral-inverse);
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
}

.guide-block .card-link:hover,
.tutorial-card .card-link:hover {
    text-decoration: underline;
}

.guide-block .card-link + .card-link {
    margin-left: 1.25rem;
}

/* Tutorial cards grid (link-out tutorials) */
.tutorial-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
}

.tutorial-card {
    background: var(--color-bg-primary, #f8f4f0);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 1.75rem;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
}

.tutorial-card:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
}

.tutorial-card h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    color: var(--color-neutral-primary);
    margin: 0.5rem 0 0.5rem;
}

.tutorial-card p {
    color: var(--color-neutral-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    flex-grow: 1;
}

.snippet {
    background: var(--color-neutral-dark, #1e3a2b);
    color: rgba(255,255,255,0.9);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-family: 'Source Code Pro', 'Courier New', monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    margin: 0.75rem 0 1rem;
    overflow-x: auto;
    white-space: pre;
}

/* Responsive */
@media (max-width: 1024px) {
    .tutorial-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .tutorial-grid { grid-template-columns: 1fr; }
    .guide-block { padding: 1.5rem; }
}
</style>

<!-- Hero -->
<div class="tutorials-hero">
<h1>Tutorials</h1>
<p class="subtitle">Practical, step-by-step guides for the Divinci AI platform — from publishing your first assistant in the dashboard to shipping developer integrations, QA pipelines, and voice.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>Start here</h2>
<p class="section-sub">No code required. These walkthroughs use the Divinci dashboard end to end.</p>

<div class="guide-block">
<h3>Create and publish your first assistant <span class="level-badge level-beginner">Beginner</span></h3>
<p class="guide-intro">Releases are how Divinci packages an assistant: you configure a draft, publish it, and every later change is a new draft forked from a published version — so you can always roll back.</p>
<ol>
<li>Sign in to the dashboard and open (or create) a workspace.</li>
<li>Create a new <strong>draft Release</strong> — drafts are private and fully editable.</li>
<li>Pick the model that powers your assistant.</li>
<li>Configure the assistant: system instructions, conversation starters, and any knowledge base you want attached.</li>
<li>Test the draft in the built-in chat until responses look right.</li>
<li><strong>Publish</strong> the release to make it live for your users and integrations.</li>
<li>To iterate later, fork the published release as a new draft, change it, and publish again — previous versions stay available.</li>
</ol>
<a href="/release-management/" class="card-link">Learn more about release management &rarr;</a>
</div>

<div class="guide-block">
<h3>Build a knowledge base from your files <span class="level-badge level-beginner">Beginner</span></h3>
<p class="guide-intro">Ground your assistant in your own content so it answers from your documents instead of guessing.</p>
<ol>
<li>In your workspace, open the knowledge base section and create a new collection.</li>
<li>Upload your documents — PDFs, office docs, and text files all work.</li>
<li>Wait for indexing to finish; each document is chunked and embedded automatically.</li>
<li>Attach the collection to a draft release.</li>
<li>Ask the draft a question only your documents can answer to confirm retrieval works, then publish.</li>
</ol>
<div class="guide-note">Beyond file uploads, knowledge bases can ingest raw text, audio recordings (auto-transcribed), product catalogs, and files from Dropbox.</div>
</div>

<div class="guide-block">
<h3>Ingest your website by URL crawl <span class="level-badge level-beginner">Beginner</span></h3>
<p class="guide-intro">Point Divinci at your website and turn its pages into assistant knowledge — no exports needed.</p>
<ol>
<li>In your knowledge base, choose to add a web source.</li>
<li>Enter a URL — scrape a single page, or crawl the whole site from a starting URL.</li>
<li>When the crawl completes, review the extracted chunks and remove anything you don't want.</li>
<li>Attach the collection to your release and test with questions from your site's content.</li>
</ol>
<div class="guide-note">Indexing continues in the background after the crawl itself completes — very large sites may take a little longer before every page is searchable.</div>
</div>

<div class="guide-block">
<h3>Embed the chat widget on your site <span class="level-badge level-beginner">Beginner</span></h3>
<p class="guide-intro">Once a release is published, one script tag puts a fully-branded chat widget on any website:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">The widget streams responses, shows RAG context, and supports white-label customization — colors, position, conversation starters, and more.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">Embed widget documentation &rarr;</a>
</div>

<div class="guide-block">
<h3>Let anonymous visitors chat, with quotas <span class="level-badge level-intermediate">Intermediate</span></h3>
<p class="guide-intro">Open your assistant to visitors who don't have an account: they verify an email address, pass a Cloudflare Turnstile check, and chat within daily quotas you set — so you stay in control of usage and abuse.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">Anonymous visitor chat examples &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>For developers</h2>
<p class="section-sub">Build on the platform with the SDKs, CLI, and MCP — full guides live in the SDK documentation.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">Beginner</span>
<h3>Quickstart: streaming chat with the Client SDK</h3>
<p>Install <code>@divinci-ai/client</code>, authenticate, and stream your first assistant response in the browser in a few minutes.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">Follow the quickstart &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Beginner</span>
<h3>Manage everything from the terminal</h3>
<p>The Divinci CLI covers workspaces, releases, knowledge bases, and chat — scriptable for CI/CD and daily workflows alike.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">CLI overview &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Beginner</span>
<h3>Connect Claude or Cursor to your assistant (MCP)</h3>
<p>Add <code>https://mcp.divinci.app/mcp</code> in your AI tool's connector UI, authorize with OAuth, and your assistant's knowledge and tools are available inside Claude, Cursor, and other MCP clients.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">Connect via MCP &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Advanced</span>
<h3>Deploy a gated landing-page chat on Cloudflare Workers</h3>
<p>Ship a landing page with built-in assistant chat behind your own gate, running at the edge on Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Cloudflare Workers guide &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Advanced</span>
<h3>Publish your release as its own MCP server</h3>
<p>Turn a published release into a white-label MCP server that your customers can add to their own AI tools.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">White-label MCP servers &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>Quality &amp; trust</h2>
<p class="section-sub">Measure your assistant's answers and control which model providers serve them.</p>

<div class="guide-block">
<h3>Score your assistant with QA suites and AutoFix <span class="level-badge level-intermediate">Intermediate</span></h3>
<p class="guide-intro">QA suites run structured tests against a release and score the answers, so quality is measured — not assumed.</p>
<ol>
<li>Create a QA suite by writing test cases yourself, or generate tests automatically from the files in your knowledge base.</li>
<li>Run the suite against a release — draft or published.</li>
<li>Review the scores to see which questions the assistant handled well and where it fell short.</li>
<li>Apply <strong>AutoFix</strong> to have Divinci propose configuration changes that address the failures, then re-run the suite to confirm the improvement.</li>
</ol>
<a href="/quality-assurance/" class="card-link">Learn more about quality assurance &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA in the Server SDK &rarr;</a>
</div>

<div class="guide-block">
<h3>Bring your own model keys (BYOK) <span class="level-badge level-intermediate">Intermediate</span></h3>
<p class="guide-intro">Use your own provider accounts — your rate limits, your billing, your data agreements — instead of Divinci's pooled keys.</p>
<ol>
<li>Open your workspace settings and go to model keys.</li>
<li>Add an API key for your provider (for example OpenAI or Anthropic).</li>
<li>Select your key when configuring a release — model calls for that release now run through your account.</li>
<li>Rotate or remove keys at any time; releases fall back to platform keys if you remove yours.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>Voice</h2>
<p class="section-sub">Assistants don't have to be text-only.</p>

<div class="guide-block">
<h3>Give your assistant a voice <span class="level-badge level-intermediate">Intermediate</span></h3>
<p class="guide-intro">Enable text-to-speech on a release so responses can be spoken aloud.</p>
<ol>
<li>Open your release configuration and enable <strong>text-to-speech</strong>.</li>
<li>Pick a voice from the built-in options (Deepgram Aura and Cartesia voices are available), or clone a custom voice.</li>
<li>Test in the dashboard chat, then publish — the widget and SDK surfaces can now speak responses.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Ready to build?</h2>
<p>Create your first assistant free, or talk to us about your use case.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">Request a demo</a>
<a href="/docs/" class="cta-secondary">Developer documentation</a>
</div>
</section>
</div>
