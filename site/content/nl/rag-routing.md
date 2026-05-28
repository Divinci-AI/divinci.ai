+++
title = "RAG Routing — Eén API, Meerdere Architecturen"
description = "Divinci's RAG Routing stuurt elke vraag naar de goedkoopste backend die correct antwoordt. Tien retrieval-engines achter één endpoint, geleerd per vraag."
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
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">Eén API-endpoint. Tien ondersteunde retrieval-architecturen. De router leert van uw historische queryverkeer en stuurt elke nieuwe vraag naar de backend die er het meest waarschijnlijk correct op kan antwoorden — tegen de laagste kosten die nog steeds aan uw kwaliteitsdrempel voldoen.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Neem contact op</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Lees de deep-dive →</a>
  </p>
</section>

<h2 class="section-heading">De drie architecturen, conceptueel</h2>

<p class="section-subheading">De meeste productie-RAG-systemen leveren één retrieval-architectuur en noemen het klaar. Wij leveren een router die kiest tussen architectonisch verschillende stacks — de juiste keuze is zelden dezelfde voor elke vraag in uw corpus.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · Flat-Vector RAG</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>Het best voor</h4>
    <p>Opzoeken van enkele feiten, FAQ-achtige vragen, "wat is X?"-vragen over corpora met platte chunks.</p>
    <div class="rr-stats">
      <strong>Latency:</strong><span>&lt; 300 ms p95</span>
      <strong>Kosten:</strong><span>centen per query</span>
      <strong>Backends:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · Hybrid + Rerank</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>Het best voor</h4>
    <p>Queries waarbij lexicale en semantische signalen het oneens zijn — codes, namen, afkortingen, technische terminologie, foutmeldingen.</p>
    <div class="rr-stats">
      <strong>Latency:</strong><span>~ 800 ms</span>
      <strong>Kosten:</strong><span>nog steeds laag</span>
      <strong>Vandaag:</strong><span>composable workflow node · auto-router op de roadmap</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + Agent</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>Het best voor</h4>
    <p>Multi-hop lezen van lange gestructureerde documenten — juridische contracten, financiële 10-Ks, technische PDF's waarbij context over niet-aangrenzende secties verspreid is.</p>
    <div class="rr-stats">
      <strong>Latency:</strong><span>meerdere seconden</span>
      <strong>Kosten:</strong><span>hoogste — maar alleen wanneer nodig</span>
      <strong>Backend:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">Hoe de router daadwerkelijk beslist</h2>

<p class="section-subheading">De meeste gepubliceerde RAG-routers classificeren de query vooraf op complexiteit. De onze niet. Wij gebruiken <strong>geleerde routing</strong>: elke succesvolle query wordt opgeslagen samen met de backend die hem heeft beantwoord, en nieuwe queries worden gematcht tegen die historie op basis van embedding-similariteit.</p>

<div class="rr-mechanism">
<h3>Het opzoek-algoritme — wat er bij elke query draait</h3>
<ol>
  <li><strong>Hash de vraag</strong> met SHA-256, ingekort tot een sleutel van 16 tekens, en controleer de routing-store per klant in Cloudflare KV op een eerdere exacte match. Als de vraag al eerder is beantwoord, wordt deze onmiddellijk doorgestuurd naar de backend die het de vorige keer het beste deed.</li>
  <li><strong>Bij een miss wordt de vraag geëmbed</strong> en cosinus-doorzocht tegen de gecachte index van historische vraag-embeddings. Als de similariteit van de naaste buur groter is dan <strong>0.88</strong>, wordt doorgestuurd naar de bijbehorende backend.</li>
  <li><strong>Als er geen match boven de drempel is,</strong> valt het systeem terug op de standaard-backend van de klant voor dat corpus.</li>
  <li><strong>Nadat het antwoord is gegenereerd,</strong> wordt de tupel (vraaghash, backend, kwaliteitsscore) teruggeschreven naar de routing-historie per klant, ter voeding van toekomstige opzoekingen.</li>
</ol>
<div class="rr-note">
  <strong>Waarom "geleerd" in plaats van "geclassificeerd"?</strong> Empirisch gedraagt dezelfde queryvorm zich anders op verschillende corpora. "Vergelijk X over Y" op juridische contracten wil Tier 3 page-index-traversal; dezelfde vorm op een plat FAQ-corpus is prima op Tier 1. Het routing-model dat onderscheid per corpus laten leren uit historisch bewijs, in plaats van het te raden uit de querysyntaxis, is de ontwerpkeuze die daadwerkelijk in productie is gegaan.
</div>
</div>

<h2 class="section-heading">De tien backends waartussen we vandaag routen</h2>

<p class="section-subheading">De router stuurt door naar één van tien benoemde backends. Drie ervan zijn "Tier 3-vormig" (hiërarchisch of grafiek-versterkt); de andere zijn pure vector-engines die we behandelen als Tier 1 met andere operationele afwegingen.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>Hiërarchische TOC-boom + agentische traversal. Het archetype van Tier 3.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>Tree-traversal retrieval over recursief samengevatte documenthiërarchieën (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="Neo4j logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>Grafiek-versterkte retrieval die vector-embeddings combineert met expliciete entiteit-/relatiestructuur.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>Platte-grafiek dual-mode retrieval — entiteit- + community-zoekopdracht, de LightRAG-aanpak van HKU.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="Qdrant logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>Self-hosted dense-vector engine voor opzoekingen met hoge doorvoer en lage latency.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="Cloudflare logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>Vectorize aan de edge — sub-300 ms p95 vanuit het wereldwijde netwerk van Cloudflare.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="Couchbase logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>BYO Couchbase vector store voor klanten met bestaande operationele afhankelijkheden.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="Google Cloud logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Google Cloud Vertex AI vector search voor klanten op de datastack van Google.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="MongoDB logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>Atlas Vector Search voor klanten die documentdata op MongoDB draaien.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="Redis logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>Redis vector search voor in-memory retrieval-workloads met ultralage latency.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2 (BM25 + dense fusion + cross-encoder reranker) is vandaag beschikbaar in ons workflow-canvas als composable node. De auto-router pakt dit als volgende op zodra de routing-data per corpus dit rechtvaardigt.</em></p>

<h2 class="section-heading">API-oppervlak — één endpoint, audit-grade transparantie</h2>

<p class="section-subheading">De router is onzichtbaar voor uw caller. Eén request-vorm; het antwoord bevat de routing-beslissing, zodat u kunt auditen welke backend heeft geantwoord (en waarom).</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># Eén endpoint. De router beslist welke backend gebruikt wordt.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># Response — chunks die de agent nodig heeft om het antwoord te onderbouwen.</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// doorgestuurd naar tier-3 page-index</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · of fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// ≥ 0.88 drempel</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// versheidsvenster voor herbenchmark</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>De <code>routing</code>-metadata wordt momenteel intern gelogd en zichtbaar gemaakt via het audit-spoor. Inline-respons-aflevering wordt gedurende Q3 2026 uitgerold.</em></p>

<h2 class="section-heading">Hoe dit verschilt van bestaande routers</h2>

<p class="section-subheading">RAG-routing is geen nieuw idee — academische routers zoals Adaptive-RAG en Probing-RAG classificeren queries al op complexiteit. Het onderscheidende is dat Divinci routeert tussen <em>architectonisch verschillende retrieval-stacks</em>, geleerd van uw eigen verkeer, achter één managed endpoint.</p>

<div class="rr-vs">
<table>
<thead><tr><th>Aanbieding</th><th>Waar tussen wordt geroute</th><th>Routing-as</th><th>Managed?</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 backends (PageIndex, RAPTOR, LightRAG, neo4j, 6 vector-engines)</td><td>Architectuur · geleerd uit historie</td><td>Ja — één endpoint</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>BYO retrievers</td><td>LLM/Pydantic-selector</td><td>Nee — bibliotheek die u zelf samenstelt</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>no-retrieval / single-step / iteratief</td><td>Diepte · query-complexiteitsclassificatie</td><td>Onderzoek</td></tr>
<tr><td>Cloudflare AI Search (ex-AutoRAG)</td><td>Eén hybride pipeline</td><td>Geen routing</td><td>Ja</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>Eén hybride pipeline</td><td>Geen routing</td><td>Ja</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>Hybride + aparte agentische modus</td><td>Gebruiker kiest modus handmatig</td><td>Ja</td></tr>
<tr><td>VectifyAI PageIndex</td><td>Eén architectuur (hiërarchische traversal)</td><td>Geen routing</td><td>OSS standalone</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>De eerlijke zwakte in onze pitch:</strong> per-query RAG-routing als concept is niet nieuw. We hebben routing niet uitgevonden. Het echte onderscheid is de <em>combinatie</em> van (a) routen tussen architectonisch verschillende stacks in plaats van diepte-varianten, (b) PageIndex- / RAPTOR- / LightRAG-achtige hiërarchische traversal als first-class backend in plaats van een apart product, en (c) één managed endpoint in plaats van een bibliotheek die u zelf samenstelt en beheert.</p>

<h2 class="section-heading">Hoe routing-voorkeuren worden gevoed</h2>

<p class="section-subheading">Uw routing-model is niet voorgetraind — het leert van <em>uw</em> verkeer. Drie signalen voeden de routing-historie-store.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>Arena-selectie.</strong> Stuur een query door <a href="/nl/rag-arena/">RAG Arena</a> over meerdere backends, scoor de varianten naast elkaar, kies de winnaar. Het paar (vraag, winnende-backend) belandt in de routing-store.</li>
  <li><strong>Auto-fix-uitvoer.</strong> Wanneer onze auto-fix vergelijkende retrievals uitvoert op representatieve queries tijdens ingestie of geplande audits, wordt de best presterende backend per query naar dezelfde store geschreven.</li>
  <li><strong>Productiefeedback.</strong> Succesvolle queries (die boven uw kwaliteitsdrempel scoorden via onze online evaluatie-gate — zie de <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">regressietestpost</a>) schrijven hun paar (vraaghash, backend) op request-time terug in de routing-store, met een TTL van 30 dagen, zodat het routing-model fris blijft naarmate uw corpus evolueert.</li>
</ol>
<div class="rr-note">
  <strong>Waar dit echt productiewaardig is vs. roadmap:</strong> Stappen 1 en 2 zijn vandaag live. De automatische feedback-loop van stap 3 is gedeeltelijk live — succesvolle queries schrijven terug, maar Tier 2 (BM25 + RRF + reranker) is momenteel samengesteld als workflow-node in plaats van auto-geroute. We vouwen Tier 2 in de auto-router zodra de routing-data duidelijke winsituaties ervoor laat zien.
</div>
</div>

<h2 class="section-heading">Wanneer dit het meest uitmaakt</h2>

<p class="section-subheading">Een homogeen corpus met uniforme queryvormen heeft hier weinig baat bij — kies handmatig één backend en u bent klaar. De wedge ligt bij gemengde corpora en gemengde queryvormen.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Een juridisch team dat zowel "wat is de definitie van overmacht in ons standaardcontract?" stelt (Tier 1, sub-300 ms) als "in onze 47 leverancierscontracten, welke hebben niet-standaard opzeggingsclausules en wat zijn de patronen?" (Tier 3, page-index-traversal van meerdere seconden) wil niet één backend kiezen. Ze willen dat de eenvoudige vraag snel en goedkoop terugkomt, en dat de diepe vraag correct terugkomt zelfs als die meer kost — zonder twee stacks te hoeven beheren.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Dat is de situatie waarin één managed endpoint dat routeert tussen architectonisch verschillende backends zijn investering waard maakt. Als uw verkeer uniform is, heeft u dit niet nodig. Als uw verkeer gemengd is — wat de meeste echte enterprise-corpora zijn — wel.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>Verdere lectuur en gerelateerde producten</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
De architectuur-deep-dive leeft in onze blogpost <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>. De arena die stap 1 hierboven aandrijft staat op <a href="/nl/rag-arena/">RAG Arena &amp; Dynamic Routing</a>. Routing-beslissingen worden audit-verankerd via hetzelfde release-manifest-patroon dat we over het hele platform gebruiken — zie <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>. En als u wilt weten hoe we de kwaliteit van retrieval online evalueren (het signaal dat stap 3 hierboven voedt), is de <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">regressietestpost</a> de plek om te beginnen.
</p>
</div>
