+++
title = "Hosted Hermes Agents — Your Own Hermes, Isolated in the Cloud"
description = "Run your own NousResearch Hermes agent inside Divinci: an isolated Cloudflare Sandbox container per agent, one Durable Object each. Chat in-app, or connect a local Hermes, the desktop app, or any OpenAI-compatible client through a per-agent proxy URL. Bring your own provider key."
template = "feature.html"
[extra]
hero_poster = "images/hero-autorag.webp"
feature_category = "ai-config"
+++

<style>
/* Reuse the Leonardo journal background art */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-autorag.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

.hs-section { padding: 3.5rem 0; }
.hs-heading {
    font-family: 'Fraunces', serif;
    font-size: 2.6rem;
    color: #1e3a2b;
    text-align: center;
    margin: 3.5rem 0 1rem;
    line-height: 1.2;
}
.hs-sub {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.1rem;
    color: #5a6862;
    text-align: center;
    max-width: 760px;
    margin: 0 auto 2.75rem;
    line-height: 1.6;
}

/* Three feature cards */
.hs-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    max-width: 1120px;
    margin: 0 auto;
    padding: 0 1rem;
}
.hs-card {
    background: #faf8f5;
    border-radius: 12px;
    border: 1.5px solid rgba(139, 118, 89, 0.28);
    padding: 1.75rem 1.6rem;
    display: flex;
    flex-direction: column;
}
.hs-card .hs-icon { font-size: 1.8rem; margin-bottom: 0.75rem; }
.hs-card h3 {
    font-family: 'Fraunces', serif;
    color: #1e3a2b;
    font-size: 1.35rem;
    margin: 0 0 0.6rem;
}
.hs-card p { color: #4a5852; font-size: 0.98rem; line-height: 1.6; margin: 0; }
@media (max-width: 900px) { .hs-grid { grid-template-columns: 1fr; } }

/* Mechanism / architecture box */
.hs-mech {
    max-width: 980px;
    margin: 2.25rem auto;
    padding: 2rem 2.25rem;
    background: rgba(232, 221, 199, 0.25);
    border-radius: 12px;
    border: 1px solid rgba(139, 118, 89, 0.2);
}
.hs-mech ol { padding-left: 1.5rem; color: #2d3c34; font-size: 1rem; line-height: 1.7; }
.hs-mech li { margin-bottom: 0.55rem; }
.hs-mech li strong { color: #1e3a2b; }
.hs-note {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(184, 160, 128, 0.12);
    border-left: 3px solid #b8a080;
    border-radius: 4px;
    font-size: 0.95rem;
    color: #4a4030;
}

/* Code block */
.hs-code {
    max-width: 860px;
    margin: 1.5rem auto;
    background: #0f1c17;
    color: #d7e4dc;
    border-radius: 10px;
    padding: 1.4rem 1.6rem;
    font-family: 'SF Mono', 'Fira Code', Menlo, monospace;
    font-size: 0.9rem;
    line-height: 1.7;
    overflow-x: auto;
}
.hs-code .c { color: #7fa08f; }
.hs-code .k { color: #b6d7c4; }

/* Security chips */
.hs-sec {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 0.85rem;
    max-width: 980px;
    margin: 1.5rem auto;
    padding: 0 1rem;
}
.hs-sec-chip {
    background: #faf8f5;
    border: 1.5px solid rgba(139, 118, 89, 0.3);
    border-radius: 10px;
    padding: 1rem 1.1rem;
}
.hs-sec-chip strong { display: block; color: #1e3a2b; font-size: 0.98rem; margin-bottom: 0.25rem; }
.hs-sec-chip span { color: #5a6862; font-size: 0.88rem; line-height: 1.5; }

/* Responsive 16:9 video embed */
.hs-video {
    max-width: 860px;
    margin: 0.5rem auto 0;
    padding: 0 1rem;
}
.hs-video-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 12px;
    overflow: hidden;
    border: 1.5px solid rgba(139, 118, 89, 0.3);
    box-shadow: 0 10px 30px rgba(30, 58, 43, 0.12);
    background: #0f1c17;
}
.hs-video-frame iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
.hs-video-cap { text-align: center; color: #5a6862; font-size: 0.85rem; margin-top: 0.75rem; }

/* Buttons */
.hs-btn {
    display: inline-block;
    padding: 0.85rem 2rem;
    border-radius: 50px;
    font-weight: 700;
    text-decoration: none;
    margin: 0.35rem 0.35rem;
}
.hs-btn-primary { background: #2d5a4f; color: #faf8f5; }
.hs-btn-ghost { background: transparent; color: #2d5a4f; border: 2px solid #2d5a4f; }
.hs-btn-deploy {
    background: #f6821f; color: #fff;
    display: inline-flex; align-items: center; gap: 0.5rem;
}
.hs-deploy-note { color: #5a6862; font-size: 0.82rem; max-width: 620px; margin: 0.75rem auto 0; line-height: 1.5; }
</style>

<section class="hs-section">
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">Hosted Hermes Agents</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 840px; margin: 0 auto 2rem; line-height: 1.55;">Run your own <strong>NousResearch Hermes</strong> agent inside Divinci — each one isolated in its own Cloudflare Sandbox container. Chat with it in the app, or connect a local Hermes, the desktop app, or any OpenAI-compatible client through a per-agent proxy URL. Bring your own provider key.</p>
  <p style="text-align: center; margin: 0 0 1rem;">
    <a class="hs-btn hs-btn-primary" href="https://app.divinci.app/signup">Create your Hermes agent →</a>
    <a class="hs-btn hs-btn-ghost" href="https://meetings.hubspot.com/michael-mooring/divinci-ai">Talk to us</a>
  </p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a class="hs-btn hs-btn-deploy" href="https://deploy.workers.cloudflare.com/?url=https://github.com/Divinci-AI/hermesworkers">⚡ Deploy your own on Cloudflare</a>
  </p>
  <p class="hs-deploy-note">Prefer to self-host? Hermes Agents are built on our open-source <a href="https://github.com/Divinci-AI/hermesworkers" style="color:#2d5a4f;">hermesworkers</a> Worker — deploy it to your own Cloudflare account. (Advanced: the container runtime needs Cloudflare Containers and a few secrets; see the repo README.)</p>
</section>

<figure style="max-width: 1000px; margin: 2.5rem auto 0; padding: 0 1rem;">
  <img src="/cdn-cgi/image/width=1000,format=auto,quality=82/images/hosted-hermes-on-cloudflare-hero.png" alt="A da Vinci notebook illustration: Hermes the messenger delivering a sealed scroll to a row of four isolated, walled study-cells — one agent per sandbox — beneath a cloud, with an hsk- key and padlock in the margin." width="1376" height="768" loading="eager" decoding="async" style="width:100%; height:auto; border-radius:12px; border:1.5px solid rgba(139,118,89,0.3); box-shadow:0 10px 30px rgba(30,58,43,0.12);" onerror="this.onerror=null;this.src='/images/hosted-hermes-on-cloudflare-hero.png';">
  <figcaption style="text-align:center; color:#5a6862; font-size:0.85rem; margin-top:0.75rem;">One agent, one sandbox — Hermes routes each request to its own isolated container.</figcaption>
</figure>

<h2 class="hs-heading">One agent, one sandbox</h2>
<p class="hs-sub">Every hosted agent is its own tenant. There is no shared process, no shared filesystem, and no way for one agent's traffic to reach another's container.</p>

<div class="hs-grid">
  <div class="hs-card">
    <div class="hs-icon">📦</div>
    <h3>Isolated by default</h3>
    <p>Each agent gets one Durable Object and one Cloudflare Sandbox container. The Hermes gateway runs as a non-root user; containers are lazy — provisioning is free until the first chat, and they sleep-evict when idle.</p>
  </div>
  <div class="hs-card">
    <div class="hs-icon">💬</div>
    <h3>Chat in-app</h3>
    <p>Give an agent a name, a model, and a persona. It streams OpenAI-style responses right inside the Divinci web app, metered to your workspace wallet. The Divinci Agent can even set one up for you.</p>
  </div>
  <div class="hs-card">
    <div class="hs-icon">🔌</div>
    <h3>Connect anything</h3>
    <p>Each agent has a proxy key (<code>hsk-…</code>) and an OpenAI-compatible URL. Point a local Hermes gateway, the Hermes desktop app, Open&nbsp;WebUI, LibreChat, or your own code at it — the full <code>/v1/*</code> surface is proxied to your container.</p>
  </div>
</div>

<h2 class="hs-heading">New to Hermes?</h2>
<p class="hs-sub">Hermes is NousResearch's open, tool-using agent — the open-weight models are the brain, the Hermes Agent CLI is the body. Here's the team behind it on running open models in production.</p>
<div class="hs-video">
  <div class="hs-video-frame">
    <iframe src="https://www.youtube-nocookie.com/embed/Y3NDtqk6ags" title="Nous Research's Hermes Agent: The Case for Open Models in Production" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>
  <p class="hs-video-cap">"Nous Research's Hermes Agent: The Case for Open Models in Production" — Arize&nbsp;Observe&nbsp;2026. Video&nbsp;© NousResearch.</p>
</div>

<h2 class="hs-heading">How it works</h2>
<p class="hs-sub">Two trust boundaries, both enforced server-side. Your proxy key identifies an agent; it never grants access to anyone else's.</p>

<div class="hs-mech">
<ol>
  <li><strong>You create an agent</strong> under your workspace. Divinci mints two credentials: a stable internal agent key (routed to the Worker) and a customer-facing proxy key (<code>hsk-…</code>) you can share with clients and revoke by regenerating.</li>
  <li><strong>A request arrives</strong> — from the in-app chat, or from any OpenAI-compatible client hitting <code>/api/v1/hermes-proxy</code> with your <code>hsk-</code> key.</li>
  <li><strong>Divinci resolves the agent from the key</strong>, server-side. The caller never supplies an agent ID, so there is no way to pivot into another tenant's container.</li>
  <li><strong>The request is forwarded</strong> to the hermesworkers Worker over a service-authenticated channel, which routes it to <em>your</em> agent's Durable Object and Sandbox container.</li>
  <li><strong>Hermes answers</strong> — using the platform provider key, or your own bring-your-own-key when you've set one. Usage is metered to your workspace wallet, attributed to the acting user.</li>
</ol>
<div class="hs-note">
  <strong>Why a container per agent?</strong> Hermes executes tools on behalf of prompts. Giving each agent its own sandbox means one customer's agent can never read another's files, sessions, or memory — isolation is structural, not a policy we hope holds.
</div>
</div>

<h2 class="hs-heading">Connect your local Hermes in two lines</h2>
<p class="hs-sub">The proxy speaks the OpenAI API. Anything that talks to OpenAI talks to your agent.</p>

<div class="hs-code">
<span class="c"># Point any OpenAI-compatible client at your hosted agent</span><br>
export OPENAI_BASE_URL=<span class="k">"https://api.divinci.app/api/v1/hermes-proxy"</span><br>
export OPENAI_API_KEY=<span class="k">"hsk-your-agent-proxy-key"</span><br>
<br>
<span class="c"># ...or drop the same URL + key into a local Hermes gateway</span><br>
export GATEWAY_PROXY_URL=<span class="k">"https://api.divinci.app/api/v1/hermes-proxy"</span>
</div>

<h2 class="hs-heading">Secure by construction</h2>
<p class="hs-sub">The boundaries that matter, enforced in code and covered by tests.</p>

<div class="hs-sec">
  <div class="hs-sec-chip"><strong>No cross-tenant access</strong><span>The proxy resolves your agent from the key alone; a client can never address another tenant's container.</span></div>
  <div class="hs-sec-chip"><strong>Keys encrypted at rest</strong><span>Bring-your-own provider keys are field-encrypted and never returned in API responses — only a "has a key" flag is.</span></div>
  <div class="hs-sec-chip"><strong>Path-locked proxy</strong><span>Forwarded paths are normalized and allowlisted to the Hermes API surface; crafted traversal can't escape the agent namespace.</span></div>
  <div class="hs-sec-chip"><strong>Non-root containers</strong><span>The Hermes gateway drops privileges at boot, so tool execution never runs as root.</span></div>
  <div class="hs-sec-chip"><strong>Per-workspace caps</strong><span>A ceiling on agents per workspace bounds cost and blast radius; keys are 160-bit and server-minted.</span></div>
  <div class="hs-sec-chip"><strong>Metered &amp; attributed</strong><span>Every turn escrows against your workspace wallet and reverses cleanly on failure — attributed to the acting user.</span></div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════════════
     HOW WE USE HERMES — stories section. Awaiting Hermes-drafted stories from
     the team. When they land, drop them into the grid below (one card each) and
     delete this comment wrapper:

<h2 class="hs-heading">How we use Hermes at Divinci</h2>
<p class="hs-sub">Real ways our own team puts hosted Hermes agents to work.</p>
<div class="hs-grid">
  <div class="hs-card"><h3>STORY TITLE</h3><p>STORY BODY…</p></div>
  <div class="hs-card"><h3>STORY TITLE</h3><p>STORY BODY…</p></div>
  <div class="hs-card"><h3>STORY TITLE</h3><p>STORY BODY…</p></div>
</div>
     ═══════════════════════════════════════════════════════════════════════════ -->

<section class="hs-section" style="text-align: center;">
  <h2 class="hs-heading" style="margin-bottom: 1.25rem;">Bring your own Hermes to the cloud</h2>
  <p style="text-align: center; margin: 0 0 1rem;">
    <a class="hs-btn hs-btn-primary" href="https://app.divinci.app/signup">Create your Hermes agent →</a>
    <a class="hs-btn hs-btn-ghost" href="https://meetings.hubspot.com/michael-mooring/divinci-ai">Talk to us</a>
  </p>
  <p style="text-align: center; margin: 0;">
    <a class="hs-btn hs-btn-deploy" href="https://deploy.workers.cloudflare.com/?url=https://github.com/Divinci-AI/hermesworkers">⚡ Deploy your own on Cloudflare</a>
  </p>
</section>
