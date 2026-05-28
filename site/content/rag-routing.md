+++
title = "RAG Routing — One API, Many Architectures"
description = "Divinci's RAG Routing dispatches every query to the cheapest backend that can answer it correctly. Ten supported retrieval engines (PageIndex, neo4j-hybrid, RAPTOR, LightRAG, Qdrant, Cloudflare Vectorize, Couchbase, Vertex AI, MongoDB Atlas, Redis Vector) behind one endpoint, with learned per-question routing."
template = "feature.html"
[extra]
hero_poster = "images/hero-autorag.webp"
feature_category = "data-management"
+++

<style>
/* Page-specific Leonardo journal background — reuses the AutoRAG art */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-autorag.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

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

/* Tier cards (three across on desktop, stacked on mobile) */
.rr-tier-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 1rem;
}

.rr-tier {
    background: #faf8f5;
    border-radius: 12px;
    overflow: hidden;
    border: 1.5px solid;
    display: flex;
    flex-direction: column;
}

.rr-tier .rr-tier-head {
    color: #faf8f5;
    font-weight: 700;
    font-size: 1.15rem;
    text-align: center;
    padding: 1rem 1.25rem;
}

.rr-tier .rr-tier-body { padding: 1.25rem 1.5rem 1.75rem; flex: 1; }
.rr-tier .rr-badge {
    display: inline-block;
    border-radius: 999px;
    padding: 0.25rem 0.85rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
}
.rr-tier .rr-flow {
    font-family: 'DM Mono', monospace;
    color: #2d3c34;
    font-size: 0.92rem;
    line-height: 1.55;
    margin-bottom: 1rem;
}
.rr-tier h4 {
    font-size: 0.92rem;
    color: #1e3a2b;
    margin: 0.85rem 0 0.35rem;
    font-weight: 700;
}
.rr-tier p {
    font-size: 0.95rem;
    color: #3a4a40;
    line-height: 1.6;
    margin: 0 0 0.5rem;
}
.rr-tier .rr-stats {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.35rem 0.85rem;
    margin-top: 0.75rem;
    font-size: 0.92rem;
    color: #2d3c34;
}
.rr-tier .rr-stats strong { font-weight: 700; }

.rr-tier-1 { border-color: #7a8a4a; }
.rr-tier-1 .rr-tier-head { background: #7a8a4a; }
.rr-tier-1 .rr-badge { background: rgba(122,138,74,0.15); color: #5a6c2a; }

.rr-tier-2 { border-color: #5a7a8f; }
.rr-tier-2 .rr-tier-head { background: #5a7a8f; }
.rr-tier-2 .rr-badge { background: rgba(90,122,143,0.15); color: #3a5060; }

.rr-tier-3 { border-color: #2d5a4f; }
.rr-tier-3 .rr-tier-head { background: #2d5a4f; }
.rr-tier-3 .rr-badge { background: rgba(45,90,79,0.15); color: #1e3a2b; }

@media (max-width: 900px) {
    .rr-tier-grid { grid-template-columns: 1fr; }
}

/* Mechanism + backend sections */
.rr-mechanism {
    max-width: 980px;
    margin: 2.5rem auto;
    padding: 2rem 2.25rem;
    background: rgba(232, 221, 199, 0.25);
    border-radius: 12px;
    border: 1px solid rgba(139, 118, 89, 0.2);
}
.rr-mechanism h3 {
    font-family: 'Fraunces', serif;
    color: #1e3a2b;
    font-size: 1.6rem;
    margin: 0 0 1rem;
}
.rr-mechanism ol {
    padding-left: 1.5rem;
    color: #2d3c34;
    font-size: 1rem;
    line-height: 1.7;
}
.rr-mechanism li { margin-bottom: 0.5rem; }
.rr-mechanism li strong { color: #1e3a2b; }
.rr-mechanism .rr-note {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(184, 160, 128, 0.12);
    border-left: 3px solid #b8a080;
    border-radius: 4px;
    font-size: 0.95rem;
    color: #4a4030;
}

/* Backend chip grid */
.rr-backends {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.85rem;
    max-width: 980px;
    margin: 1.5rem auto;
    padding: 0 1rem;
}
.rr-backend-chip {
    background: #faf8f5;
    border: 1.5px solid rgba(139, 118, 89, 0.3);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
}
.rr-backend-logo {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 6px;
    background: #f3ede0;
    padding: 4px;
    object-fit: contain;
    display: block;
}
.rr-backend-monogram {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 6px;
    color: #faf8f5;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.rr-backend-monogram.mono-pageindex { background: #2d5a4f; }
.rr-backend-monogram.mono-raptor    { background: #5a8a6c; }
.rr-backend-monogram.mono-lightrag  { background: #7a8a4a; }
.rr-backend-body { flex: 1; min-width: 0; }
.rr-backend-chip strong {
    display: block;
    color: #1e3a2b;
    font-size: 0.95rem;
    margin-bottom: 0.15rem;
}
.rr-backend-chip span {
    color: #5a6862;
    font-size: 0.85rem;
    line-height: 1.45;
    display: block;
}
.rr-backend-chip.tier3 { border-color: #2d5a4f; }
.rr-backend-chip.tier1 { border-color: #7a8a4a; }
.rr-backend-chip.tier2-roadmap { border-color: #5a7a8f; border-style: dashed; }

/* Code example — explicit colors on every descendant so theme rules
   from base.html can't accidentally make text invisible on the dark
   background. Smart-quote conversion is disabled by wrapping in <code>. */
.rr-code-wrap {
    max-width: 980px;
    margin: 2rem auto;
    padding: 0 1rem;
}
.rr-code-wrap pre {
    background: #1e2a26 !important;
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    overflow-x: auto;
    margin: 0;
    color: #e8e3d8 !important;
}
.rr-code-wrap pre code.rr-code-block,
.rr-code-wrap pre code.rr-code-block * {
    color: #e8e3d8 !important;
    background: transparent !important;
    font-family: 'DM Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace !important;
    font-size: 0.88rem;
    line-height: 1.6;
    white-space: pre;
}
.rr-code-wrap pre code.rr-code-block .rr-code-comment {
    color: #b8a080 !important;
}

/* Competitor table */
.rr-vs {
    max-width: 1080px;
    margin: 2rem auto;
    padding: 0 1rem;
    overflow-x: auto;
}
.rr-vs table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.93rem;
}
.rr-vs th {
    background: #2d5a4f;
    color: #faf8f5;
    text-align: left;
    padding: 0.75rem 0.9rem;
    font-weight: 700;
}
.rr-vs td {
    padding: 0.75rem 0.9rem;
    border-bottom: 1px solid #d6c7a8;
}
.rr-vs tr:nth-child(even) td { background: rgba(232, 221, 199, 0.3); }
.rr-vs td:first-child { font-weight: 600; color: #1e3a2b; }

/* Cross-links footer */
.rr-cross-links {
    max-width: 980px;
    margin: 3rem auto 4rem;
    padding: 1.5rem 2rem;
    background: rgba(45, 90, 79, 0.06);
    border-radius: 12px;
    text-align: center;
}
.rr-cross-links a {
    color: #2d5a4f;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1px solid rgba(45, 90, 79, 0.3);
}
.rr-cross-links a:hover { border-bottom-color: #2d5a4f; }
</style>

<section class="section-padding">
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">RAG Routing</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">One API endpoint. Ten supported retrieval architectures. The router learns from your historical query traffic and dispatches each new question to the backend most likely to answer it correctly — at the lowest cost that still passes your quality bar.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Talk to us</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Read the deep-dive →</a>
  </p>
</section>

<h2 class="section-heading">The three architectures, conceptually</h2>

<p class="section-subheading">Most production RAG systems ship one retrieval architecture and call it done. We ship a router that picks across architecturally distinct stacks — the right choice is rarely the same for every query in your corpus.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · Flat-Vector RAG</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>Best for</h4>
    <p>Single-fact lookups, FAQ-shaped queries, "what is X?" questions on flat-chunked corpora.</p>
    <div class="rr-stats">
      <strong>Latency:</strong><span>&lt; 300 ms p95</span>
      <strong>Cost:</strong><span>cents per query</span>
      <strong>Backends:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · Hybrid + Rerank</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>Best for</h4>
    <p>Queries where lexical and semantic signals disagree — codes, names, acronyms, technical vocabulary, error strings.</p>
    <div class="rr-stats">
      <strong>Latency:</strong><span>~ 800 ms</span>
      <strong>Cost:</strong><span>still low</span>
      <strong>Today:</strong><span>composable workflow node · auto-router roadmap</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + Agent</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>Best for</h4>
    <p>Multi-hop reading of long structured documents — legal contracts, financial 10-Ks, technical PDFs where context spans non-adjacent sections.</p>
    <div class="rr-stats">
      <strong>Latency:</strong><span>multi-second</span>
      <strong>Cost:</strong><span>highest — but only when needed</span>
      <strong>Backend:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">How the router actually decides</h2>

<p class="section-subheading">Most published RAG routers classify the query upfront by complexity. Ours doesn't. We use <strong>learned routing</strong>: every successful query is stored with the backend that answered it, and new queries are matched against that history by embedding similarity.</p>

<div class="rr-mechanism">
<h3>The lookup algorithm — what runs on every query</h3>
<ol>
  <li><strong>Hash the question</strong> with SHA-256, truncated to a 16-character key, and check the per-customer routing store in Cloudflare KV for an exact prior match. If it's been answered before, dispatch immediately to the backend that did best last time.</li>
  <li><strong>On miss, embed the question</strong> and cosine-search against the cached index of historical question embeddings. If the nearest neighbour's similarity exceeds <strong>0.88</strong>, dispatch to its associated backend.</li>
  <li><strong>On no match above threshold,</strong> fall back to the customer's default backend for that corpus.</li>
  <li><strong>After the answer is rendered,</strong> the (question hash, backend, quality score) tuple is written back into the per-customer routing-history store, seeding future lookups.</li>
</ol>
<div class="rr-note">
  <strong>Why "learned" instead of "classified"?</strong> Empirically the same query shape behaves differently on different corpora. "Compare X across Y" on legal contracts wants Tier 3 page-index traversal; the same shape on a flat FAQ corpus is fine on Tier 1. Letting the routing model learn that distinction per-corpus from historical evidence, rather than guessing from query syntax, is the design choice that actually shipped.
</div>
</div>

<h2 class="section-heading">The ten backends we route between today</h2>

<p class="section-subheading">The router dispatches to one of ten named backends. Three of them are "Tier 3-shaped" (hierarchical or graph-enhanced); the others are pure-vector engines we treat as Tier 1 with different operational tradeoffs.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>Hierarchical TOC tree + agentic traversal. The Tier 3 archetype.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>Tree-traversal retrieval over recursively summarised document hierarchies (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="Neo4j logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>Graph-enhanced retrieval combining vector embeddings with explicit entity / relationship structure.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>Flat-graph dual-mode retrieval — entity + community search, the HKU LightRAG approach.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="Qdrant logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>Self-hosted dense-vector engine for high-throughput, low-latency lookups.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="Cloudflare logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>Vectorize at the edge — sub-300 ms p95 from Cloudflare's global network.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="Couchbase logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>BYO Couchbase vector store for customers with existing operational dependencies.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="Google Cloud logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Google Cloud Vertex AI vector search for customers on Google's data stack.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="MongoDB logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>Atlas Vector Search for customers running document data on MongoDB.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="Redis logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>Redis vector search for ultra-low-latency in-memory retrieval workloads.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2 (BM25 + dense fusion + cross-encoder reranker) ships in our workflow canvas as a composable node today. The auto-router targets it next as the per-corpus routing data justifies.</em></p>

<h2 class="section-heading">API surface — one endpoint, audit-grade transparency</h2>

<p class="section-subheading">The router is invisible to your caller. One request shape; the response includes the routing decision so you can audit which backend answered (and why).</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># One endpoint. The router decides which backend to use.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># Response — chunks the agent needs to ground the answer.</span>
{
  "items": [
    {
      "content":  "Section 7.3 is superseded by …",
      "metadata": { "doc": "amendment-2024.pdf", "section": "II.4.b" },
      "score":    0.91
    }
    /* … */
  ],
  "routing": {
    "backend":      "pageindex",           <span class="rr-code-comment">// dispatched tier-3 page-index</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · or fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// ≥ 0.88 threshold</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// freshness window before re-benchmark</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>The <code>routing</code> metadata is currently logged internally and surfaced via the audit trail. Inline response delivery is rolling out across Q3 2026.</em></p>

<h2 class="section-heading">How this differs from existing routers</h2>

<p class="section-subheading">RAG routing isn't a new idea — academic routers like Adaptive-RAG and Probing-RAG already classify queries by complexity. The differentiation is that Divinci routes across <em>architecturally distinct retrieval stacks</em>, learned from your own traffic, behind one managed endpoint.</p>

<div class="rr-vs">
<table>
<thead><tr><th>Offering</th><th>What it routes between</th><th>Routing axis</th><th>Managed?</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 backends (PageIndex, RAPTOR, LightRAG, neo4j, 6 vector engines)</td><td>Architecture · learned from history</td><td>Yes — single endpoint</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>BYO retrievers</td><td>LLM/Pydantic selector</td><td>No — library you assemble</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>no-retrieval / single-step / iterative</td><td>Depth · query complexity classifier</td><td>Research</td></tr>
<tr><td>Cloudflare AI Search (ex-AutoRAG)</td><td>One hybrid pipeline</td><td>No routing</td><td>Yes</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>One hybrid pipeline</td><td>No routing</td><td>Yes</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>Hybrid + separate agentic mode</td><td>User picks mode manually</td><td>Yes</td></tr>
<tr><td>VectifyAI PageIndex</td><td>Single architecture (hierarchical traversal)</td><td>No routing</td><td>OSS standalone</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>The honest weakness in our pitch:</strong> per-query RAG routing as a concept isn't new. We didn't invent routing. The genuine differentiation is the <em>combination</em> of (a) routing across architecturally distinct stacks rather than depth variants, (b) PageIndex / RAPTOR / LightRAG-style hierarchical traversal included as a first-class backend rather than a separate product, and (c) one managed endpoint instead of a library you assemble and operate yourself.</p>

<h2 class="section-heading">How routing preferences get seeded</h2>

<p class="section-subheading">Your routing model isn't pre-trained — it learns from <em>your</em> traffic. Three signals feed the routing-history store.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>Arena selection.</strong> Run a query through <a href="/rag-arena/">RAG Arena</a> across multiple backends, score the variants side-by-side, pick the winner. The (question, winning-backend) pair lands in the routing store.</li>
  <li><strong>Auto-fix outputs.</strong> When our auto-fix runs comparative retrievals on representative queries during ingestion or scheduled audits, the best-performing backend per query is written into the same store.</li>
  <li><strong>Production feedback.</strong> Successful queries (those that scored above your quality threshold via our online evaluation gate — see the <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">regression-testing post</a>) write their (question hash, backend) pair back into the routing store at request-time, with a 30-day TTL so the routing model stays fresh as your corpus evolves.</li>
</ol>
<div class="rr-note">
  <strong>Where this is genuinely production-grade vs roadmap:</strong> Steps 1 and 2 ship today. Step 3's automatic feedback loop is partially shipped — successful queries write back, but tier-2 (BM25 + RRF + reranker) is currently composed as a workflow node rather than auto-routed. We'll fold Tier 2 into the auto-router as the routing data shows clear win conditions for it.
</div>
</div>

<h2 class="section-heading">When this matters most</h2>

<p class="section-subheading">A homogeneous corpus with uniform query shapes benefits little — pick one backend manually and you're done. The wedge is mixed corpora and mixed query shapes.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">A legal team that asks both "what is the definition of force majeure in our standard contract?" (Tier 1, sub-300 ms) and "across our 47 vendor contracts, which ones have non-standard termination clauses and what are the patterns?" (Tier 3, multi-second page-index traversal) doesn't want to pick one backend. They want the simple question to come back fast and cheap, and the deep question to come back correctly even if it costs more — without operating two stacks.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">That's the case where one managed endpoint routing across architecturally distinct backends earns its keep. If your traffic is uniform, you don't need it. If your traffic is mixed — most real enterprise corpora are — you do.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>Deeper reading and adjacent products</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
The architecture deep-dive lives in our blog post <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>. The arena that powers Step 1 above is at <a href="/rag-arena/">RAG Arena &amp; Dynamic Routing</a>. Routing decisions are audit-anchored via the same release-manifest pattern we use across the platform — see <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>. And if you want to know how we evaluate retrieval quality online (the signal that feeds Step 3 above), the <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">regression-testing post</a> is where to start.
</p>
</div>
