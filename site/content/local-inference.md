+++
title = "Divinci Local Inference — run AI in your browser, on your own GPU"
description = "A Chrome extension that runs open-weight models like Gemma 4 and Llama 3.2 entirely on your machine via WebGPU. Private by default, no API cost, works offline once loaded."
template = "feature.html"
[extra]
hero_poster = "images/local-inference-poster.png"
feature_category = "development-tools"
+++

<div class="feature-hero">
<div class="feature-hero-inner">
<div class="feature-hero-card">
<style>
/* Cycling model name in the hero. Pure CSS — no inline script, works with JS
   disabled, and degrades to the first item under reduced-motion. */
.li-rotator{display:block;position:relative;height:1.15em;margin-bottom:.1em}
.li-rotator .li-item{position:absolute;inset:0;display:flex;align-items:center;
  justify-content:center;gap:.35em;opacity:0;white-space:nowrap;
  animation:li-rotate 13s infinite}
.li-rotator .li-item:nth-child(1){animation-delay:0s}
.li-rotator .li-item:nth-child(2){animation-delay:2.6s}
.li-rotator .li-item:nth-child(3){animation-delay:5.2s}
.li-rotator .li-item:nth-child(4){animation-delay:7.8s}
.li-rotator .li-item:nth-child(5){animation-delay:10.4s}
/* The marks are light-on-transparent (drawn for dark UI), so they sit on a dark
   chip rather than being recoloured. */
.li-rotator .li-chip{display:inline-flex;align-items:center;justify-content:center;
  width:.95em;height:.95em;border-radius:.22em;background:#181f3b;flex:0 0 auto}
.li-rotator .li-chip img{width:72%;height:72%;object-fit:contain;display:block}
@keyframes li-rotate{
  0%,2%{opacity:0;transform:translateY(.12em)}
  5%,17%{opacity:1;transform:none}
  20%,100%{opacity:0;transform:translateY(-.12em)}
}
@media (prefers-reduced-motion:reduce){
  .li-rotator .li-item{animation:none;opacity:0}
  .li-rotator .li-item:nth-child(1){opacity:1}
}
</style>

<h1><span class="li-rotator" aria-hidden="true">
<span class="li-item"><span class="li-chip"><img src="/images/models/gemma.png" alt=""></span>Gemma 4</span>
<span class="li-item"><span class="li-chip"><img src="/images/models/spark.svg" alt=""></span>Qwen2.5</span>
<span class="li-item"><span class="li-chip"><img src="/images/models/spark.svg" alt=""></span>Llama 3.2</span>
<span class="li-item"><span class="li-chip"><img src="/images/models/spark.svg" alt=""></span>SmolLM2</span>
<span class="li-item"><span class="li-chip"><img src="/images/models/liquid.svg" alt=""></span>Liquid</span>
</span><span class="li-tail">on your machine</span></h1>
<span class="sr-only">Gemma 4, Qwen2.5, Llama 3.2, SmolLM2 and Liquid — on your machine.</span>
<p class="subtitle">Divinci Local Inference runs open-weight language models directly in Chrome, on your own GPU. Your conversations never leave your device — and once a model is loaded, it works with the network switched off.</p>
<div class="hero-ctas">
<a href="https://chromewebstore.google.com/detail/dmjdolijifmjncfdlakfampfenigahaj" class="cta-primary" target="_blank" rel="noopener">Get the extension</a>
<a href="https://github.com/Divinci-AI/gemma-gem" class="cta-secondary" target="_blank" rel="noopener">View the source</a>
</div>
</div>
</div>
</div>

<section id="local-inference-demo" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 3rem;">See it run with the internet off</h2>
<p>Nothing below is a mock-up. This is the extension answering from a model held in the browser's own memory — the second question is asked <em>after</em> the network has been disconnected.</p>
<video controls playsinline preload="metadata" poster="/images/local-inference-poster.png" style="width:100%;max-width:900px;height:auto;border-radius:12px;display:block;margin:2rem auto;box-shadow:0 12px 40px rgba(0,0,0,.12);">
<source src="/video/local-inference-demo.webm" type="video/webm">
<source src="/video/local-inference-demo.mp4" type="video/mp4">
Your browser cannot play this video. <a href="/video/local-inference-demo.mp4">Download it instead.</a>
</video>
</div>
</section>

<section id="local-inference-why" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 2rem;">Why run a model locally</h2>
<ul class="overview-content">
<li><strong>Your chats stay on your device.</strong> There is no server in the loop to send them to. Local conversations are not transmitted, logged, or trained on.</li>
<li><strong>No per-token cost.</strong> Inference runs on hardware you already own, so there is no API bill that scales with how much you use it.</li>
<li><strong>It works offline.</strong> Once a model is cached, it keeps answering on a plane, on hotel wifi, or with the network off entirely.</li>
<li><strong>Loads once, stays warm.</strong> The model is held in a single offscreen document per browser profile and shared across every tab — no reload when you change pages.</li>
</ul>
</div>
</section>

<section id="local-inference-models" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 2rem;">Pick a model that fits your machine</h2>
<p>Larger models write better; smaller ones start in seconds. The download happens once and is then cached.</p>
<table style="width:100%;max-width:900px;margin:2rem auto;border-collapse:collapse;">
<thead><tr><th style="text-align:left;padding:.6rem;">Model</th><th style="text-align:left;padding:.6rem;">Download</th><th style="text-align:left;padding:.6rem;">Good for</th></tr></thead>
<tbody>
<tr><td style="padding:.6rem;">Gemma 4 E2B</td><td style="padding:.6rem;">~2.9 GB</td><td style="padding:.6rem;">The default. Best general quality.</td></tr>
<tr><td style="padding:.6rem;">Gemma 4 E2B QAT</td><td style="padding:.6rem;">~3.2 GB</td><td style="padding:.6rem;">Best 4-bit quality, if you have the memory.</td></tr>
<tr><td style="padding:.6rem;">Llama 3.2 1B</td><td style="padding:.6rem;">~0.9 GB</td><td style="padding:.6rem;">A capable middle ground.</td></tr>
<tr><td style="padding:.6rem;">Qwen2.5 0.5B</td><td style="padding:.6rem;">~0.5 GB</td><td style="padding:.6rem;">Fast, light, surprisingly good.</td></tr>
<tr><td style="padding:.6rem;">SmolLM2 360M</td><td style="padding:.6rem;">~0.3 GB</td><td style="padding:.6rem;">Smallest and quickest to try.</td></tr>
</tbody>
</table>
<img src="/images/local-inference-models.png" alt="The extension's model picker, showing the available on-device models and their download sizes" style="width:100%;max-width:900px;height:auto;border-radius:12px;display:block;margin:2rem auto;" loading="lazy" decoding="async" width="1280" height="800">
</div>
</section>

<section id="local-inference-anywhere" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 2rem;">Use it anywhere, or inside Divinci</h2>
<p>Open the side panel on any page for an on-device assistant. Or pick the local model in <a href="https://chat.divinci.app">Divinci AI's chat</a> and have your own hardware answer instead of a cloud API — same interface, same conversation history, no API cost.</p>
</div>
</section>

<section id="local-inference-privacy" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 2rem;">Private by default</h2>
<p>Signed out, the extension sends nothing about your browsing anywhere. Signing in to a Divinci account is optional and adds two things you can turn off individually: page-aware answers, and chat saved to your account.</p>
<p>Even then, the content of the pages you visit is never transmitted — only a trimmed address and a one-way hash, and only while the panel is open. Banking, webmail, healthcare and sign-in pages are skipped entirely.</p>
<p>Read the <a href="/local-inference-privacy/">full privacy policy</a> for exactly what each feature sends.</p>
</div>
</section>

<section id="local-inference-requirements" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 2rem;">What you need</h2>
<ul class="overview-content">
<li>Chrome 113+, or another Chromium browser with WebGPU support</li>
<li>A GPU supporting shader-f16</li>
<li>Disk and memory to match the model you choose — from ~0.3 GB up to ~3.2 GB</li>
<li>A one-time download the first time you load a model</li>
</ul>
<p style="margin-top:2rem;">Apache-2.0 licensed, and the source is public at <a href="https://github.com/Divinci-AI/gemma-gem" target="_blank" rel="noopener">github.com/Divinci-AI/gemma-gem</a>. Forked from kessler/gemma-gem, with attribution preserved.</p>
</div>
</section>
