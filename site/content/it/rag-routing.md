+++
title = "RAG Routing — Una sola API, molte architetture"
description = "Il RAG Routing di Divinci instrada ogni query al backend più economico che risponda. Dieci motori di retrieval su un endpoint, routing per domanda."
template = "feature.html"
[extra]
hero_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/hero-autorag.webp"
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
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">Un solo endpoint API. Dieci architetture di retrieval supportate. Il router impara dal traffico storico delle tue query e instrada ogni nuova domanda verso il backend con la maggiore probabilità di rispondere correttamente — al costo più basso che superi comunque la tua soglia di qualità.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Parla con noi</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Leggi l'approfondimento →</a>
  </p>
</section>

<h2 class="section-heading">Le tre architetture, a livello concettuale</h2>

<p class="section-subheading">La maggior parte dei sistemi RAG in produzione spedisce una sola architettura di retrieval e considera il lavoro concluso. Noi spediamo un router che sceglie tra stack architettonicamente distinti — la scelta giusta è raramente la stessa per ogni query del tuo corpus.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · RAG Flat-Vector</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>Ideale per</h4>
    <p>Lookup di singoli fatti, query in forma di FAQ, domande tipo "che cos'è X?" su corpora a chunk piatti.</p>
    <div class="rr-stats">
      <strong>Latenza:</strong><span>&lt; 300 ms p95</span>
      <strong>Costo:</strong><span>centesimi per query</span>
      <strong>Backend:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · Hybrid + Rerank</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>Ideale per</h4>
    <p>Query in cui segnali lessicali e semantici sono in disaccordo — codici, nomi, acronimi, vocabolario tecnico, stringhe di errore.</p>
    <div class="rr-stats">
      <strong>Latenza:</strong><span>~ 800 ms</span>
      <strong>Costo:</strong><span>ancora basso</span>
      <strong>Oggi:</strong><span>nodo workflow componibile · auto-router in roadmap</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + Agent</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>Ideale per</h4>
    <p>Lettura multi-hop di documenti lunghi e strutturati — contratti legali, 10-K finanziari, PDF tecnici dove il contesto si estende attraverso sezioni non adiacenti.</p>
    <div class="rr-stats">
      <strong>Latenza:</strong><span>secondi multipli</span>
      <strong>Costo:</strong><span>il più alto — ma solo quando serve</span>
      <strong>Backend:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">Come decide davvero il router</h2>

<p class="section-subheading">La maggior parte dei router RAG pubblicati classifica la query a priori in base alla complessità. Il nostro no. Usiamo il <strong>routing appreso</strong>: ogni query andata a buon fine viene memorizzata insieme al backend che ha risposto, e le nuove query vengono confrontate con quella storia tramite similarità di embedding.</p>

<div class="rr-mechanism">
<h3>L'algoritmo di lookup — cosa gira a ogni query</h3>
<ol>
  <li><strong>Hash della domanda</strong> con SHA-256, troncato a una chiave di 16 caratteri, e ricerca nello store di routing per cliente su Cloudflare KV per un match esatto precedente. Se la domanda ha già avuto risposta, dispatch immediato verso il backend che ha performato meglio l'ultima volta.</li>
  <li><strong>In caso di miss, embedding della domanda</strong> e ricerca per coseno sull'indice in cache degli embedding storici delle domande. Se la similarità del nearest neighbour supera <strong>0.88</strong>, dispatch verso il backend associato.</li>
  <li><strong>Senza match sopra soglia,</strong> fallback al backend di default del cliente per quel corpus.</li>
  <li><strong>Dopo che la risposta è stata renderizzata,</strong> la tupla (hash domanda, backend, punteggio di qualità) viene riscritta nello store cronologico di routing per cliente, alimentando i lookup futuri.</li>
</ol>
<div class="rr-note">
  <strong>Perché "appreso" invece di "classificato"?</strong> Empiricamente, la stessa forma di query si comporta diversamente su corpora diversi. "Confronta X tra Y" su contratti legali richiede la traversal page-index di Tier 3; la stessa forma su un corpus FAQ piatto va benissimo su Tier 1. Lasciare che il modello di routing apprenda questa distinzione per ogni corpus dall'evidenza storica, invece di indovinare dalla sintassi della query, è la scelta di design che è davvero finita in produzione.
</div>
</div>

<h2 class="section-heading">I dieci backend tra cui instradiamo oggi</h2>

<p class="section-subheading">Il router fa dispatch verso uno dei dieci backend nominati. Tre di loro hanno la "forma Tier 3" (gerarchici o graph-enhanced); gli altri sono motori puramente vettoriali che trattiamo come Tier 1 con tradeoff operativi diversi.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>Albero TOC gerarchico + traversal agentica. L'archetipo Tier 3.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>Retrieval tree-traversal su gerarchie di documenti ricorsivamente riassunte (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="Neo4j logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>Retrieval graph-enhanced che combina embedding vettoriali con struttura esplicita di entità e relazioni.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>Retrieval dual-mode flat-graph — ricerca per entità + community, l'approccio LightRAG di HKU.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="Qdrant logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>Motore dense-vector self-hosted per lookup ad alto throughput e bassa latenza.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="Cloudflare logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>Vectorize all'edge — sotto i 300 ms p95 dalla rete globale di Cloudflare.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="Couchbase logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>Vector store Couchbase BYO per clienti con dipendenze operative esistenti.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="Google Cloud logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Google Cloud Vertex AI vector search per clienti sullo stack dati Google.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="MongoDB logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>Atlas Vector Search per clienti che fanno girare dati documentali su MongoDB.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="Redis logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>Ricerca vettoriale Redis per carichi di retrieval in-memory a latenza ultra-bassa.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Il Tier 2 (BM25 + dense fusion + cross-encoder reranker) viene spedito oggi nel nostro workflow canvas come nodo componibile. L'auto-router lo punterà come prossimo obiettivo quando i dati di routing per corpus lo giustificheranno.</em></p>

<h2 class="section-heading">Superficie API — un solo endpoint, trasparenza audit-grade</h2>

<p class="section-subheading">Il router è invisibile a chi chiama. Una sola forma di richiesta; la risposta include la decisione di routing così puoi controllare quale backend ha risposto (e perché).</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># Un solo endpoint. Il router decide quale backend usare.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># Risposta — chunk di cui l'agente ha bisogno per fondare la risposta.</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// dispatched al page-index tier-3</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · oppure fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// soglia ≥ 0.88</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// finestra di freschezza prima del re-benchmark</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>I metadata di <code>routing</code> sono attualmente loggati internamente ed esposti tramite l'audit trail. La consegna inline nella risposta è in rollout nel Q3 2026.</em></p>

<h2 class="section-heading">In cosa differisce dai router esistenti</h2>

<p class="section-subheading">Il routing RAG non è un'idea nuova — router accademici come Adaptive-RAG e Probing-RAG classificano già le query per complessità. La differenziazione è che Divinci instrada attraverso <em>stack di retrieval architettonicamente distinti</em>, appresi dal tuo traffico, dietro un unico endpoint gestito.</p>

<div class="rr-vs">
<table>
<thead><tr><th>Offerta</th><th>Tra cosa instrada</th><th>Asse di routing</th><th>Gestito?</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 backend (PageIndex, RAPTOR, LightRAG, neo4j, 6 motori vettoriali)</td><td>Architettura · appreso dallo storico</td><td>Sì — endpoint unico</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>Retriever BYO</td><td>Selettore LLM/Pydantic</td><td>No — libreria che assembli</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>no-retrieval / single-step / iterative</td><td>Profondità · classificatore di complessità query</td><td>Ricerca</td></tr>
<tr><td>Cloudflare AI Search (ex-AutoRAG)</td><td>Una pipeline ibrida</td><td>Nessun routing</td><td>Sì</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>Una pipeline ibrida</td><td>Nessun routing</td><td>Sì</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>Ibrido + modalità agentica separata</td><td>L'utente sceglie la modalità manualmente</td><td>Sì</td></tr>
<tr><td>VectifyAI PageIndex</td><td>Singola architettura (traversal gerarchica)</td><td>Nessun routing</td><td>OSS standalone</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>Il punto debole onesto del nostro pitch:</strong> il routing RAG per query, come concetto, non è nuovo. Non abbiamo inventato il routing. La differenziazione genuina è la <em>combinazione</em> di (a) routing tra stack architettonicamente distinti invece che varianti di profondità, (b) traversal gerarchica in stile PageIndex / RAPTOR / LightRAG inclusa come backend di prima classe invece che come prodotto separato, e (c) un unico endpoint gestito invece di una libreria che assembli e operi da solo.</p>

<h2 class="section-heading">Come vengono seminate le preferenze di routing</h2>

<p class="section-subheading">Il tuo modello di routing non è pre-addestrato — impara dal <em>tuo</em> traffico. Tre segnali alimentano lo store cronologico di routing.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>Selezione in arena.</strong> Fai girare una query attraverso <a href="/it/rag-arena/">RAG Arena</a> su più backend, valuta le varianti fianco a fianco, scegli il vincitore. La coppia (domanda, backend vincente) finisce nello store di routing.</li>
  <li><strong>Output di auto-fix.</strong> Quando il nostro auto-fix esegue retrieval comparativi su query rappresentative durante l'ingestion o gli audit pianificati, il backend più performante per ciascuna query viene scritto nello stesso store.</li>
  <li><strong>Feedback dalla produzione.</strong> Le query andate a buon fine (quelle che hanno superato la tua soglia di qualità tramite il nostro gate di valutazione online — vedi il <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">post sul regression testing</a>) riscrivono la propria coppia (hash domanda, backend) nello store di routing al momento della richiesta, con un TTL di 30 giorni in modo che il modello di routing resti fresco mentre il tuo corpus evolve.</li>
</ol>
<div class="rr-note">
  <strong>Dove questo è genuinamente production-grade vs roadmap:</strong> i passi 1 e 2 sono già in produzione oggi. Il loop di feedback automatico del passo 3 è parzialmente spedito — le query andate a buon fine riscrivono nello store, ma il tier-2 (BM25 + RRF + reranker) è attualmente composto come nodo workflow piuttosto che instradato automaticamente. Ripiegheremo il Tier 2 dentro l'auto-router quando i dati di routing mostreranno chiare condizioni di vittoria per lui.
</div>
</div>

<h2 class="section-heading">Quando questo conta di più</h2>

<p class="section-subheading">Un corpus omogeneo con forme di query uniformi ne beneficia poco — scegli un backend manualmente e hai chiuso. Il cuneo sono i corpora misti e le forme di query miste.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Un team legale che chiede sia "qual è la definizione di forza maggiore nel nostro contratto standard?" (Tier 1, sotto i 300 ms) sia "tra i nostri 47 contratti con fornitori, quali hanno clausole di risoluzione non standard e quali sono i pattern?" (Tier 3, traversal page-index in più secondi) non vuole scegliere un solo backend. Vuole che la domanda semplice torni veloce ed economica, e che la domanda profonda torni corretta anche se costa di più — senza dover operare due stack.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Questo è il caso in cui un endpoint gestito unico che instrada attraverso backend architettonicamente distinti si guadagna lo stipendio. Se il tuo traffico è uniforme, non ti serve. Se il tuo traffico è misto — la maggior parte dei corpora enterprise reali lo è — sì.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>Letture di approfondimento e prodotti adiacenti</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
L'approfondimento architetturale vive nel nostro post sul blog <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>. L'arena che alimenta il passo 1 sopra si trova in <a href="/it/rag-arena/">RAG Arena &amp; Dynamic Routing</a>. Le decisioni di routing sono ancorate all'audit tramite lo stesso pattern di release-manifest che usiamo su tutta la piattaforma — vedi <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>. E se vuoi sapere come valutiamo la qualità del retrieval online (il segnale che alimenta il passo 3 sopra), il <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">post sul regression testing</a> è da dove partire.
</p>
</div>
