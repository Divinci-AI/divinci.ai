+++
title = "Divinci AI Joins Cloudflare Workers Launchpad Cohort #6: Building AI at the Speed of Light"
description = "Divinci AI joined Cloudflare's Workers Launchpad Cohort #6. How edge compute delivers RAG-powered AI with sub-100ms latency. Updated with Demo Day pitch + monorepo deep-dive."
date = 2025-10-05T10:00:00+00:00
updated = 2026-05-27T10:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Company News"]
tags = ["cloudflare", "infrastructure", "edge-computing", "rag", "ai", "workers-launchpad"]

[extra]
math = true
pinned = true
author = "Divinci AI Team"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/cloudflare-renaissance-blueprint.webm"
featured_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/divinci-cloudflare-workers-launchpad-cohort-6.webm"
hero_video_poster = "/images/divinci-cloudflare-workers-launchpad-cohort-6-poster.webp"
reading_time = 12
summary = "Divinci AI joins Cloudflare Workers Launchpad Cohort #6, bringing enterprise AI collaboration to the edge. Learn how we're leveraging Cloudflare's global network to deliver RAG-powered intelligence with unprecedented speed, security, and scale."
x_post = "https://x.com/DivinciAi/status/1977450693100536167"
linkedin_post = "https://www.linkedin.com/feed/update/urn:li:activity:7383211765217751040/"
discord_post = "https://discord.com/channels/1425017107871039572/1425017109074808934/1427021907387088926"
instagram_post = "https://www.instagram.com/reel/DPuI8XLEl9G/?utm_source=ig_web_copy_link&igsh=MXN0M29uOGQzZWE0Nw=="
+++

<video muted loop playsinline webkit-playsinline preload="none" poster="/images/divinci-cloudflare-workers-launchpad-cohort-6-poster.webp" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/divinci-cloudflare-workers-launchpad-cohort-6.webm" type="video/webm">
</video>
<p style="text-align: center; font-style: italic; color: #666; margin-top: -1rem; margin-bottom: 2rem;">Building AI at the speed of light on Cloudflare's global edge network</p>

For over 15 years, we've trusted Cloudflare. Their ever-free tier grants you the world's fastest DNS without surveillance capitalism. They sell domains at cost. Their free compute tier is the most generous in this galaxy. They've earned trust through action, not marketing.

Today, we're honored to announce that **Divinci AI has been accepted into [Cloudflare Workers Launchpad Cohort #6](https://blog.cloudflare.com/workers-launchpad-006/)**—joining 25 other innovative startups building the future on Cloudflare's edge computing platform.

<aside style="background: linear-gradient(135deg, rgba(247, 145, 31, 0.10), rgba(247, 145, 31, 0.04)); border-left: 4px solid #f7911f; padding: 1.25rem 1.5rem; margin: 2rem 0; border-radius: 10px;">
  <strong style="color: #1e3a2b; display: block; margin-bottom: 0.5rem; font-size: 1.05rem;">📺 Update — Cohort #6 Demo Day pitch</strong>
  <p style="margin: 0 0 1rem; color: #4a4030; font-size: 0.96rem;">We pitched Divinci AI at Cloudflare's Workers Launchpad Cohort #6 Demo Day. The full pitch deck and a walkthrough of how we use the Cloudflare stack — Workers, Worker Workflows, Workers AI, and Vectorize — are now on YouTube. The full live broadcast from Cloudflare TV is also linked below.</p>
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 0 0 1rem; border-radius: 8px;">
    <iframe src="https://www.youtube.com/embed/0PQQKcreMpo" title="Divinci AI — Cloudflare Workers Launchpad Cohort #6 Demo Day pitch" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
  </div>
  <p style="margin: 0; color: #4a4030; font-size: 0.92rem;">▶︎ <a href="https://www.youtube.com/watch?v=0PQQKcreMpo" target="_blank" rel="noopener">Watch the pitch on YouTube</a> &nbsp;·&nbsp; 📡 <a href="https://cloudflare.tv/shows/workers-launchpad-demo-day/workers-launchpad-demo-day---cohort-6/1ZrX4ovO" target="_blank" rel="noopener">Cohort #6 Demo Day broadcast on Cloudflare TV</a></p>
</aside>

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/></svg> Why This Matters: Migration to Cloudflare

Joining the Workers Launchpad marks the beginning of our complete infrastructure migration to Cloudflare. Our architecture will cascade through resilience layers:

**Primary: Eco-Colo** → **Secondary: Cloudflare** → **Tertiary: GCP** → **Quaternary: AWS**

We estimate that when we scale, **most compute will run on Cloudflare Workers**. Why? Because their pricing structure enables something rare in tech: *profitable altruism*.

Cloudflare's economics allow us to expand our budget for supporting non-profits, causes, and organizations making the world better. Specifically, we're committing resources toward **Universal Basic Income research and advocacy** (see our [UBI blog post](/blog/universal-basic-income-2035)).

When infrastructure costs drop, mission-driven work becomes possible.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> The Edge Computing Revolution

Traditional cloud computing follows a centralized model: your data travels thousands of miles to a distant data center, gets processed, then returns. For AI applications requiring real-time intelligence, this creates unacceptable latency.

**Cloudflare's edge network changes the equation entirely:**

- **330+ cities globally**: Your code runs milliseconds from every internet user
- **298% faster than AWS Lambda**: Cloudflare Workers outperform traditional serverless by nearly 3x[^1]
- **Zero cold starts**: V8 isolates eliminate the container startup penalty
- **Sub-100ms global latency**: Achieving the responsiveness threshold for real-time AI

For Retrieval-Augmented Generation (RAG) systems—where every millisecond compounds through retrieval, embedding, ranking, and generation—edge deployment is transformative.

<video muted loop playsinline webkit-playsinline preload="none" data-lazy-video style="width: 50%; float: right; border-radius: 8px; margin: 0 0 1rem 1.5rem;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-celestial-globe.webm" type="video/webm">
</video>

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> RAG at the Edge: Why It's Game-Changing

Retrieval-Augmented Generation emerged in 2024 as the dominant strategy for grounding LLMs in authoritative, up-to-date knowledge. Over 1,200 RAG papers appeared on arXiv in 2024 alone—a 12x increase from 2023[^2].

**Traditional RAG architecture suffers from latency accumulation:**

1. **Embedding generation**: 50-200ms
2. **Vector search**: 20-100ms (regional database)
3. **Context retrieval**: 50-150ms (object storage)
4. **LLM generation**: 200-800ms
5. **Network round-trips**: 100-400ms (multi-region)

**Total latency: 420-1,650ms** for a single query.

**Edge-based RAG collapses these timelines:**

- Embedding, search, retrieval, and generation happen in the same data center
- Document chunks stored at the edge (D1 + Vectorize)
- Network overhead reduced by 60-80%
- **Achievable total latency: 100-400ms**

This isn't a minor optimization—it's the difference between *usable* and *frustrating*.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg> How Divinci Actually Uses Cloudflare — the Production Stack

We've avoided the trap of "Cloudflare-flavoured marketing prose" here. What follows is the actual stack as it ships in our monorepo: **29 production Workers, 3 Worker Workflows, 5 Workers AI models, 4 R2 buckets, 6 Queue types, Hyperdrive on Postgres, Durable-Object-backed Containers for PDF and audio, and 36 tail consumers** streaming structured logs to observability. The pieces are named after their real bindings and route domains so engineers reading this can grep for them.

<figure style="margin: 2.5rem 0;">
<svg viewBox="0 0 1200 760" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Divinci's Cloudflare production stack: edge workers, async pipelines, storage and data, AI and containers, observability">
<rect width="1200" height="760" fill="#faf8f5"/>
<text x="600" y="36" font-family="'DM Sans', -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1e3a2b" text-anchor="middle">Divinci's Cloudflare Production Stack</text>
<text x="600" y="62" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">29 Workers · 3 Workflows · 5 Workers AI models · 4 R2 buckets · 6 Queues · Hyperdrive · Containers · Email · Analytics</text>
<g transform="translate(40, 90)">
<rect x="0" y="0" width="1120" height="130" fill="#eae3d5" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#2d5a4f">Layer 1 · Edge HTTP — 5 core Workers</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="20" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="120" y="58" text-anchor="middle" font-weight="700">divinci-api</text>
<text x="120" y="76" text-anchor="middle" font-size="11" fill="#5a6862">api.divinci.app</text>
<text x="120" y="92" text-anchor="middle" font-size="11" fill="#5a6862">auth · routing · JWT</text>
<rect x="240" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="340" y="58" text-anchor="middle" font-weight="700">web-client-r2-server</text>
<text x="340" y="76" text-anchor="middle" font-size="11" fill="#5a6862">chat.divinci.app</text>
<text x="340" y="92" text-anchor="middle" font-size="11" fill="#5a6862">static frontend via R2</text>
<rect x="460" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="560" y="58" text-anchor="middle" font-weight="700">divinci-agent</text>
<text x="560" y="76" text-anchor="middle" font-size="11" fill="#5a6862">orchestrator</text>
<text x="560" y="92" text-anchor="middle" font-size="11" fill="#5a6862">answer composition</text>
<rect x="680" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="780" y="58" text-anchor="middle" font-weight="700">chunks-workflow</text>
<text x="780" y="76" text-anchor="middle" font-size="11" fill="#5a6862">rag-workflow.divinci.app</text>
<text x="780" y="92" text-anchor="middle" font-size="11" fill="#5a6862">RAG pipeline driver</text>
<rect x="900" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="1000" y="58" text-anchor="middle" font-weight="700">connector-sync-worker</text>
<text x="1000" y="76" text-anchor="middle" font-size="11" fill="#5a6862">Dropbox · Drive · etc.</text>
<text x="1000" y="92" text-anchor="middle" font-size="11" fill="#5a6862">external ingestion</text>
</g>
</g>
<g transform="translate(40, 240)">
<rect x="0" y="0" width="540" height="130" fill="#eae3d5" stroke="#7a4848" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#7a4848">Layer 2a · Worker Workflows (multi-step async)</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="100" y="58" text-anchor="middle" font-weight="700" font-size="12">ReindexWith­Version</text>
<text x="100" y="78" text-anchor="middle" fill="#5a6862">step.do(...)</text>
<text x="100" y="94" text-anchor="middle" fill="#5a6862">corpus re-embed</text>
<rect x="190" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="270" y="58" text-anchor="middle" font-weight="700" font-size="12">BrowserExtraction</text>
<text x="270" y="78" text-anchor="middle" fill="#5a6862">openparse · DOM</text>
<text x="270" y="94" text-anchor="middle" fill="#5a6862">PDF + HTML chunks</text>
<rect x="360" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="440" y="58" text-anchor="middle" font-weight="700" font-size="12">AudioToRag</text>
<text x="440" y="78" text-anchor="middle" fill="#5a6862">whisper · pyannote</text>
<text x="440" y="94" text-anchor="middle" fill="#5a6862">transcript chunks</text>
</g>
</g>
<g transform="translate(600, 240)">
<rect x="0" y="0" width="560" height="130" fill="#eae3d5" stroke="#b8a060" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#7a6020">Layer 2b · Queues (6 tuned for D1 single-thread)</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="38" width="125" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="82" y="53" text-anchor="middle">api-jobs · 10/5</text>
<rect x="150" y="38" width="125" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="212" y="53" text-anchor="middle">chunking · 10/5</text>
<rect x="280" y="38" width="125" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="342" y="53" text-anchor="middle">vectorize · 25/10</text>
<rect x="410" y="38" width="125" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="472" y="53" text-anchor="middle">reindex · 25/10</text>
<rect x="20" y="68" width="195" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="117" y="83" text-anchor="middle">d1-sync · serialised writes</text>
<rect x="220" y="68" width="195" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="317" y="83" text-anchor="middle">embed-chunks · batched</text>
<text x="20" y="106" font-style="italic" fill="#5a6862">batch / concurrency tuned per queue to protect D1's single-writer per-shard limit</text>
</g>
</g>
<g transform="translate(40, 390)">
<rect x="0" y="0" width="1120" height="160" fill="#eae3d5" stroke="#5a7a8f" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#5a7a8f">Layer 3 · Storage &amp; Data — R2 + D1 + KV + Hyperdrive</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<text x="20" y="50" font-weight="700" font-size="12" fill="#5a7a8f">R2 buckets (4)</text>
<rect x="20" y="58" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="73">FILES · RAG documents</text>
<rect x="20" y="84" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="99">AUDIO_FILES · workspace audio</text>
<rect x="20" y="110" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="125">PUBLIC_UPLOADS · chat attachments</text>
<rect x="20" y="136" width="220" height="14" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="146" font-size="10">TEMP_UPLOADS · presigned staging</text>
<text x="270" y="50" font-weight="700" font-size="12" fill="#5a7a8f">D1 (per-vector sharded)</text>
<rect x="270" y="58" width="270" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="280" y="73">per-tenant D1 shard · FTS5 fallback</text>
<rect x="270" y="84" width="270" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="280" y="99">chunk + metadata index per customer</text>
<text x="270" y="124" font-size="10" font-style="italic" fill="#5a6862">Each tenant gets its own D1 shard.</text>
<text x="270" y="138" font-size="10" font-style="italic" fill="#5a6862">Prevents CPU bottleneck on single-writer.</text>
<text x="570" y="50" font-weight="700" font-size="12" fill="#5a7a8f">KV (3 namespaces)</text>
<rect x="570" y="58" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="73">CACHE · JWT + config</text>
<rect x="570" y="84" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="99">EMBEDDING_CACHE · 30-day TTL</text>
<rect x="570" y="110" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="125">VECTORIZE_CACHE · embed lookup</text>
<text x="840" y="50" font-weight="700" font-size="12" fill="#5a7a8f">Hyperdrive → Postgres</text>
<rect x="840" y="58" width="260" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="850" y="73">HYPERDRIVE binding · edge pool</text>
<rect x="840" y="84" width="260" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="850" y="99">app-relational data fallback</text>
<text x="840" y="125" font-size="10" font-style="italic" fill="#5a6862">Avoids cold-start of opening</text>
<text x="840" y="138" font-size="10" font-style="italic" fill="#5a6862">a TCP connection per request.</text>
</g>
</g>
<g transform="translate(40, 570)">
<rect x="0" y="0" width="540" height="130" fill="#eae3d5" stroke="#a04848" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#a04848">Layer 4a · Workers AI — 5 models</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="36" width="240" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="30" y="51">@cf/openai/moderation-stable</text>
<rect x="270" y="36" width="250" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="280" y="51">@cf/huggingface/distilbert-sst-2</text>
<rect x="20" y="62" width="240" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="30" y="77">@cf/meta/llama-3-8b-instruct</text>
<rect x="270" y="62" width="250" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="280" y="77">@cf/google/gemma-3-12b-it-preview</text>
<rect x="20" y="88" width="500" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="30" y="103">@cf/openai/whisper-large-v3-turbo · audio transcription</text>
</g>
</g>
<g transform="translate(600, 570)">
<rect x="0" y="0" width="560" height="130" fill="#eae3d5" stroke="#7a8a4a" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#5a6c2a">Layer 4b · Containers · Email · Analytics · Tail · Cron</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="36" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="51">openparse-cf · PDF parser (DO container)</text>
<rect x="275" y="36" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="51">audio-services · ffmpeg + pyannote DO</text>
<rect x="20" y="62" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="77">divinci-send-notification-email</text>
<rect x="275" y="62" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="77">create-cf-email-destination · routing</text>
<rect x="20" y="88" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="103">Analytics Engine · structured-event sink</text>
<rect x="275" y="88" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="103">36 tail_consumers · structured log fanout</text>
</g>
</g>
<g transform="translate(40, 720)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="10" fill="#5a6862" font-style="italic">Cron triggers: every 30 min (prod, orphan cleanup) · every 10 min (stage, nightly-fix-all). All workers configured with nodejs_compat + compat_date 2024–2025.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">The actual production stack as it ships from the monorepo. Every named binding above appears in a wrangler.toml in the codebase.</figcaption>
</figure>

### Layer 1 — Five core Workers at the edge

Every HTTP request hits one of five custom-domain Workers:

- **`divinci-api`** at **`api.divinci.app`** — the REST boundary: auth, JWT validation, route resolution, fan-out to internal workers. Bindings include the FILES R2 bucket, the CACHE KV namespace, the D1 doc-elements database, Workers AI, Hyperdrive, Analytics Engine, and four named Queues. This is the worker that sees the request first.
- **`web-client-r2-server`** at **`chat.divinci.app`** — the static frontend, served directly from R2 through a thin Worker that handles Worker-side rewrites and routing into the SPA.
- **`divinci-agent`** — the answer-composition orchestrator. Pulls context from D1 + KV + R2, decides which Workers AI model to call (or whether to delegate to an external API via Hyperdrive), composes the response.
- **`chunks-workflow`** at **`rag-workflow.divinci.app`** — the Worker Workflows entrypoint; called whenever a long-running RAG pipeline needs to be kicked off.
- **`connector-sync-worker`** — the external-ingestion worker that syncs from Dropbox / Drive / similar third-party connectors into the RAG pipeline.

There are 24 more workers behind these five (tail consumers, internal microservices) — the five above are what's exposed to the public internet.

### Layer 2a — Worker Workflows (three multi-step async pipelines)

Cloudflare Workflows replaced our older Durable-Object-based job runners last year. Three workflows are in production today, all using the `step.do("name", async () => {…})` checkpoint pattern so each step is independently retried on failure without re-running the whole pipeline:

- **`ReindexWithVersionWorkflow`** — re-embeds an entire customer corpus when the embedding model version changes. Versions the resulting index so a roll-back is one binding swap.
- **`BrowserExtractionWorkflow`** — extracts text from uploaded documents via the **openparse-cf** Durable-Object container, then chunks + queues the chunks for embedding.
- **`AudioToRagWorkflow`** — transcribes audio with Workers AI Whisper, runs speaker diarization through the **audio-services** Container, chunks the transcript, and queues for embedding.

All three are declared in `wrangler.toml` like:

```toml
[[env.production.workflows]]
name = "reindex-with-version"
binding = "REINDEX_WITH_VERSION"
class_name = "ReindexWithVersionWorkflow"
```

### Layer 2b — Six Queues, tuned for D1's single-writer limit

Async work flows through six named Queues, each with `max_batch_size`, `max_concurrency`, and `max_retries` tuned to whatever bottleneck the downstream service has. The chunking and api-jobs queues run at 10-batch / 5-concurrency because they write to D1 (whose per-shard writer is single-threaded); the vectorize and reindex queues run hotter at 25/10 because they call external embedding APIs. The d1-sync queue serialises writes to the per-vector D1 shards so two workflows don't race on the same row.

The lesson we wish we'd learned earlier: **Queues are the only thing that keeps a per-customer-sharded D1 setup honest.** Without them, a single tenant with a big upload starves everyone else on the same shard until the request times out.

### Layer 3 — R2, D1, KV, and Hyperdrive

The storage layer is split across four primitives, each chosen for a different access pattern.

**R2 (four buckets per environment)** — the bindings are `FILES` (RAG documents), `AUDIO_FILES` (source audio for transcription pipelines), `PUBLIC_UPLOADS` (chat attachments served at signed-URL endpoints), and `TEMP_UPLOADS` (the presigned-upload landing pad). Zero egress fees are the headline reason, but the deeper one is **the same Worker can sign a URL, accept a multi-MB upload, kick off the BrowserExtractionWorkflow, and serve the resulting RAG context — all without a hop off Cloudflare's edge.**

**D1 (per-tenant sharded)** — each customer gets their own D1 database, with chunk + metadata in normal tables and a [FTS5 virtual table](https://www.sqlite.org/fts5.html) for text-only search. Sharding by customer was the only way to avoid the single-writer bottleneck on hot tenants. The cost is that we manage a fan-out across shards in the application layer; the benefit is one tenant's spike can't starve another's reads.

**KV (three namespaces)** — `CACHE` holds JWT validation results and tenant config; `EMBEDDING_CACHE` is the content-hash → embedding-bytes map with a 30-day TTL (this is the single biggest cost reduction we made — caching embeddings by content hash cut the daily embedding-API bill by an order of magnitude); `VECTORIZE_CACHE` is the wrapper layer the `vectorize-cache` worker uses to memoize vector lookups.

**Hyperdrive** — Postgres connection pooling at the edge. The `HYPERDRIVE` binding lets a Worker open a Postgres connection without paying the TCP handshake + auth cost on every request. We use it for the small slice of relational data (subscription state, org-level ACLs) that doesn't fit D1's sharded model.

### Layer 4a — Workers AI (five models in production)

Workers AI is the on-platform inference layer; we use it where the model is small enough that round-tripping to an external provider isn't worth the latency or cost:

| Model | Binding | What it does |
|---|---|---|
| `@cf/openai/moderation-stable` | content safety | gate every user input through a moderation pass before any other processing |
| `@cf/huggingface/distilbert-sst-2-int8` | sentiment | quick classification for routing + analytics |
| `@cf/meta/llama-3-8b-instruct` | text generation | the small-model fallback for low-stakes answer composition |
| `@cf/google/gemma-3-12b-it-preview` | text generation | the preview model we use to A/B fine-tunes against |
| `@cf/openai/whisper-large-v3-turbo` | audio transcription | called from the AudioToRagWorkflow for transcription |

For frontier-scale generation (Claude, GPT-4-class) we still route to external providers through Hyperdrive — Workers AI's catalog is growing but doesn't yet include the largest models we need for the hardest queries.

### Layer 4b — Containers, Email, Analytics, Tail Consumers

**Durable-Object Containers** are the newest piece of the stack: full Docker images running on the Workers runtime, scoped per DO instance. We run two:

- **`openparse-cf`** is a Python PDF parser packaged as a Container, called by the `BrowserExtractionWorkflow` for document chunking.
- **`audio-services-container`** runs ffmpeg + pyannote-audio for speaker diarization, called by the `AudioToRagWorkflow`. Memory-tier `standard-2` (6 GB) so the heavier models load without OOM.

**Email Workers** — a transactional-notification Worker sends product email, and a routing Worker manages inbound mail at `email.divinci.app/verified-emails`. Both use Cloudflare's Email Routing primitive instead of an external email API.

**Analytics Engine** — a Workers Analytics Engine dataset is the structured-event sink for product analytics. Anything we'd previously have sent to Segment/Amplitude lands here first, then forwards downstream.

**Tail Consumers (36 workers)** — every production worker has its `tail_consumers` list populated with a dedicated `*_tail` consumer. Each consumer parses the Worker's invocation logs and forwards structured events to our observability pipeline. The fan-out is what makes the eight-worker microservice topology debuggable.

**Cron Triggers** — production runs an orphan-cleanup job every 30 minutes; stage runs every 10 minutes for tighter feedback while we iterate on the cleanup logic.

### A note on Vectorize — what we don't use, and why

We evaluated Cloudflare **Vectorize** during the migration and ultimately did not adopt it as our primary vector store. The decision had nothing to do with Vectorize itself — it has improved significantly through 2025–2026. The reason we landed on **D1 FTS5 + an external embedding service** was that our retrieval architecture is hybrid (lexical + semantic with a calibrated re-ranker on top), and FTS5 in D1 gave us the lexical half of that for free, on the same shard as the document metadata. Adding Vectorize would have introduced a second consistency model — a separate index that has to stay in sync with D1 — for marginal recall improvement at the volumes we run. The `VECTORIZE_CACHE` KV namespace name is a leftover from the evaluation period; the worker behind it now caches embedding lookups, not Vectorize results.

If our retrieval model shifts toward dense-only retrieval at very large scale, Vectorize is the natural next step. Honest answer beats a marketing claim.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><path d="M12 6v12m-2-7h4a2 2 0 110 4H10"/></svg> The Workers Launchpad Program: What We're Gaining

Cloudflare's Workers Launchpad isn't just credits—it's a comprehensive accelerator program:

**Financial Support:**
- Up to **$250,000 in cloud credits** (one year)
- Eliminates infrastructure costs during critical growth phase
- Enables experimentation without budget constraints

**Technical Resources:**
- **Bootcamp sessions** with Cloudflare engineering teams
- **Early access** to beta products and features
- **Design support** for architecture optimization
- Direct access to product teams for feedback and bug reports

**Network & Growth:**
- **VC introductions** to Cloudflare's investor network
- **Partnership opportunities** with Cloudflare's enterprise customers
- **Co-marketing** potential with Cloudflare's brand

**Proven Track Record:**
Since launching in 2022, Workers Launchpad has supported **145 startups from 23 countries**. Notable alumni include:

- **Nefeli Networks**: Acquired by Cloudflare (2024)
- **Outerbase**: Acquired by Cloudflare (2024)
- Companies now processing **billions of monthly requests** on Workers

Nearly **1/3 of Cohort #5 were led by female founders**—evidence of Cloudflare's commitment to diverse entrepreneurship.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> What This Means for Our Customers

For enterprises using Divinci AI, joining Workers Launchpad translates to tangible benefits:

**Performance:**
- **Sub-100ms AI responses globally**: Edge computing eliminates regional bottlenecks
- **99.99% uptime SLA**: Cloudflare's network reliability becomes ours
- **Infinite scale**: No capacity planning—Workers auto-scale to billions of requests

**Privacy & Compliance:**
- **Data residency**: Process data at the edge closest to users
- **Zero-knowledge architecture**: Cloudflare can't decrypt customer data
- **GDPR/CCPA compliance**: Built-in privacy controls and data retention policies

**Innovation:**
- **Beta access**: Test cutting-edge features before public release
- **Custom integrations**: Deeper Cloudflare product integration
- **Rapid deployment**: Ship new features without infrastructure blockers

**Economics:**
- **Lower costs**: Cloudflare's pricing passes through to customers
- **Predictable billing**: No surprise egress charges or regional surcharges
- **Value reinvestment**: Savings redirected to product R&D and customer support

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><line x1="3" y1="12" x2="21" y2="12"/><circle cx="6" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="18" cy="12" r="2"/></svg> The Road Ahead: Building in Public

Over the coming months, we'll be documenting our infrastructure migration and lessons learned:

**Upcoming deep-dives:**
- **RAG at the edge**: Architecture patterns and performance benchmarks
- **D1 for vector metadata**: Scaling distributed SQL for AI workloads
- **Workflows orchestration**: Building multi-step AI pipelines
- **Cost analysis**: Cloudflare vs. AWS/GCP for AI infrastructure
- **Real-world latency**: P50/P95/P99 metrics from production traffic

We believe in **building in public** and sharing knowledge. If you're building on Cloudflare Workers or exploring edge computing for AI, we'd love to collaborate.

<video muted loop playsinline webkit-playsinline preload="none" data-lazy-video style="width: 50%; border-radius: 8px; margin: 2rem auto; display: block;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-workshop-leonardo.webm" type="video/webm">
</video>
<p style="text-align: center; font-style: italic; color: #666; margin-top: -1rem; margin-bottom: 2rem;">Innovation through the ages: Building the future with timeless principles</p>

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><polyline points="20 6 9 17 4 12"/></svg> Join Us on This Journey

We're incredibly excited about this partnership and the opportunities ahead. As we build the future of AI-powered enterprise collaboration, Cloudflare's platform will remain at the heart of our infrastructure—enabling us to deliver exceptional experiences to teams worldwide.

**Want to see it in action?**

- [Request a demo](https://meetings.hubspot.com/michael-mooring/divinci-ai) to explore Divinci AI's platform
- [Follow our blog](/blog) for technical deep-dives and updates
- [Join our community](https://discord.gg/divinci) to discuss edge AI architecture

**Building on Cloudflare Workers?**

If you're exploring edge computing for AI/ML workloads, we'd love to share lessons learned. Reach out at [hello@divinci.ai](mailto:hello@divinci.ai).

---

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/></svg> About Workers Launchpad

The **Cloudflare Workers Launchpad** is Cloudflare's startup accelerator program, providing funding, technical support, and go-to-market resources to companies building on the Workers platform.

Since 2022, the program has supported 145 startups across 23 countries, with two companies acquired by Cloudflare and dozens processing billions of monthly requests.

Learn more about [Cohort #6 and participating companies](https://blog.cloudflare.com/workers-launchpad-006/).

---

[^1]: [Serverless Performance: Cloudflare Workers, Lambda and Lambda@Edge](https://blog.cloudflare.com/serverless-performance-comparison-workers-lambda/) - Cloudflare Engineering Blog (2024)

[^2]: [The Rise and Evolution of RAG in 2024: A Year in Review](https://ragflow.io/blog/the-rise-and-evolution-of-rag-in-2024-a-year-in-review) - RAGFlow Research (2024)
