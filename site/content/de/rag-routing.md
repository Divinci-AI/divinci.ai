+++
title = "RAG-Routing — Eine API, viele Architekturen"
description = "Divincis RAG-Routing leitet jede Anfrage ans günstigste Backend, das korrekt antwortet. Zehn Retrieval-Engines, ein Endpunkt, gelerntes Routing pro Frage."
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
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">RAG-Routing</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">Ein API-Endpunkt. Zehn unterstützte Retrieval-Architekturen. Der Router lernt aus dem historischen Anfrageverkehr und leitet jede neue Frage an das Backend, das sie am wahrscheinlichsten korrekt beantwortet — zu den niedrigsten Kosten, die Ihre Qualitätsanforderungen noch erfüllen.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Sprechen Sie mit uns</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Zur Tiefenanalyse →</a>
  </p>
</section>

<h2 class="section-heading">Die drei Architekturen, konzeptionell betrachtet</h2>

<p class="section-subheading">Die meisten produktiven RAG-Systeme liefern eine einzige Retrieval-Architektur aus und erklären die Sache für erledigt. Wir liefern einen Router, der zwischen architektonisch unterschiedlichen Stacks auswählt — die richtige Wahl ist selten für jede Anfrage in Ihrem Korpus dieselbe.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · Flat-Vector-RAG</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>Am besten geeignet für</h4>
    <p>Einzelfakten-Abfragen, FAQ-artige Anfragen, „Was ist X?"-Fragen auf flach geschnittenen Korpora.</p>
    <div class="rr-stats">
      <strong>Latenz:</strong><span>&lt; 300 ms p95</span>
      <strong>Kosten:</strong><span>Cents pro Anfrage</span>
      <strong>Backends:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · Hybrid + Rerank</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>Am besten geeignet für</h4>
    <p>Anfragen, bei denen lexikalische und semantische Signale divergieren — Codes, Namen, Akronyme, technisches Vokabular, Fehlermeldungen.</p>
    <div class="rr-stats">
      <strong>Latenz:</strong><span>~ 800 ms</span>
      <strong>Kosten:</strong><span>weiterhin gering</span>
      <strong>Heute:</strong><span>komponierbarer Workflow-Knoten · Auto-Router auf der Roadmap</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + Agent</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>Am besten geeignet für</h4>
    <p>Multi-Hop-Lektüre langer strukturierter Dokumente — Rechtsverträge, Finanzberichte (10-K), technische PDFs, deren Kontext sich über nicht benachbarte Abschnitte erstreckt.</p>
    <div class="rr-stats">
      <strong>Latenz:</strong><span>mehrere Sekunden</span>
      <strong>Kosten:</strong><span>am höchsten — aber nur bei Bedarf</span>
      <strong>Backend:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">Wie der Router tatsächlich entscheidet</h2>

<p class="section-subheading">Die meisten veröffentlichten RAG-Router klassifizieren die Anfrage vorab nach Komplexität. Unserer nicht. Wir setzen auf <strong>gelerntes Routing</strong>: Jede erfolgreiche Anfrage wird zusammen mit dem Backend, das sie beantwortet hat, gespeichert, und neue Anfragen werden über Embedding-Ähnlichkeit gegen diese Historie abgeglichen.</p>

<div class="rr-mechanism">
<h3>Der Lookup-Algorithmus — was bei jeder Anfrage ausgeführt wird</h3>
<ol>
  <li><strong>Hash der Frage</strong> mit SHA-256, gekürzt auf einen 16-Zeichen-Schlüssel, und prüfen Sie den kundenspezifischen Routing-Speicher in Cloudflare KV auf einen exakten früheren Treffer. Wurde sie schon einmal beantwortet, wird sie sofort an das Backend weitergeleitet, das es zuletzt am besten gemacht hat.</li>
  <li><strong>Bei einem Miss wird die Frage eingebettet</strong> und per Kosinus-Suche gegen den gecachten Index historischer Frage-Embeddings abgeglichen. Übersteigt die Ähnlichkeit des nächsten Nachbarn <strong>0.88</strong>, wird an das zugehörige Backend weitergeleitet.</li>
  <li><strong>Gibt es keinen Treffer oberhalb des Schwellenwerts,</strong> greift das Standard-Backend des Kunden für dieses Korpus.</li>
  <li><strong>Nachdem die Antwort gerendert wurde,</strong> wird das Tupel (Frage-Hash, Backend, Qualitätsbewertung) zurück in den kundenspezifischen Routing-Verlaufsspeicher geschrieben und versorgt so künftige Lookups.</li>
</ol>
<div class="rr-note">
  <strong>Warum „gelernt" statt „klassifiziert"?</strong> Empirisch verhält sich dieselbe Anfrageform auf unterschiedlichen Korpora unterschiedlich. „Vergleiche X über Y" auf Rechtsverträgen verlangt nach einer Tier-3-Page-Index-Traversierung; dieselbe Form auf einem flachen FAQ-Korpus läuft problemlos in Tier 1. Das Routing-Modell diese Unterscheidung korpusspezifisch aus historischen Belegen lernen zu lassen, anstatt aus der Anfragesyntax zu raten, ist die Designentscheidung, die wir tatsächlich ausgeliefert haben.
</div>
</div>

<h2 class="section-heading">Die zehn Backends, zwischen denen wir heute routen</h2>

<p class="section-subheading">Der Router leitet an eines von zehn benannten Backends weiter. Drei davon sind „Tier-3-förmig" (hierarchisch oder graph-erweitert); die übrigen sind reine Vektor-Engines, die wir als Tier 1 mit unterschiedlichen operativen Trade-offs behandeln.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>Hierarchischer Inhaltsverzeichnis-Baum + agentische Traversierung. Der Tier-3-Archetyp.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>Baumtraversierungs-Retrieval über rekursiv zusammengefassten Dokumenthierarchien (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="Neo4j logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>Graph-erweitertes Retrieval, das Vektor-Embeddings mit expliziter Entitäts- und Beziehungsstruktur kombiniert.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>Dual-Mode-Retrieval auf flachem Graphen — Entitäts- + Community-Suche, der LightRAG-Ansatz der HKU.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="Qdrant logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>Selbst gehostete Dense-Vector-Engine für Lookups mit hohem Durchsatz und niedriger Latenz.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="Cloudflare logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>Vectorize am Edge — Sub-300-ms-p95 aus Cloudflares globalem Netzwerk.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="Couchbase logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>BYO-Couchbase-Vektorspeicher für Kunden mit bestehenden operativen Abhängigkeiten.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="Google Cloud logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Google Cloud Vertex AI Vector Search für Kunden, die auf Googles Datenstack setzen.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="MongoDB logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>Atlas Vector Search für Kunden, die Dokumentdaten auf MongoDB betreiben.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="Redis logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>Redis Vector Search für In-Memory-Retrieval-Workloads mit ultraniedriger Latenz.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2 (BM25 + Dense-Fusion + Cross-Encoder-Reranker) wird heute in unserem Workflow-Canvas als komponierbarer Knoten ausgeliefert. Der Auto-Router nimmt ihn als Nächstes ins Visier, sobald die korpusspezifischen Routing-Daten dies rechtfertigen.</em></p>

<h2 class="section-heading">API-Oberfläche — ein Endpunkt, audittaugliche Transparenz</h2>

<p class="section-subheading">Der Router ist für Ihren Aufrufer unsichtbar. Eine einzige Anfrageform; die Antwort enthält die Routing-Entscheidung, sodass Sie auditieren können, welches Backend geantwortet hat (und warum).</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># Ein Endpunkt. Der Router entscheidet, welches Backend genutzt wird.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># Antwort — Chunks, die der Agent zur Verankerung der Antwort benötigt.</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// an Tier-3-Page-Index weitergeleitet</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// Arena · Auto-Fix · oder Fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// ≥ 0.88 Schwellenwert</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// Frischefenster vor erneutem Benchmark</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>Die <code>routing</code>-Metadaten werden derzeit intern protokolliert und über den Audit-Trail ausgewiesen. Die Inline-Auslieferung in der Response wird im Verlauf von Q3 2026 ausgerollt.</em></p>

<h2 class="section-heading">Wie sich das von bestehenden Routern unterscheidet</h2>

<p class="section-subheading">RAG-Routing ist keine neue Idee — akademische Router wie Adaptive-RAG und Probing-RAG klassifizieren Anfragen bereits nach Komplexität. Die Differenzierung liegt darin, dass Divinci über <em>architektonisch unterschiedliche Retrieval-Stacks</em> routet, gelernt aus Ihrem eigenen Traffic, hinter einem einzigen verwalteten Endpunkt.</p>

<div class="rr-vs">
<table>
<thead><tr><th>Angebot</th><th>Wozwischen geroutet wird</th><th>Routing-Achse</th><th>Verwaltet?</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 Backends (PageIndex, RAPTOR, LightRAG, neo4j, 6 Vektor-Engines)</td><td>Architektur · gelernt aus der Historie</td><td>Ja — einzelner Endpunkt</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>BYO-Retriever</td><td>LLM-/Pydantic-Selektor</td><td>Nein — Bibliothek zum Selbstzusammenbauen</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>kein Retrieval / Single-Step / iterativ</td><td>Tiefe · Klassifikator für Anfragekomplexität</td><td>Forschung</td></tr>
<tr><td>Cloudflare AI Search (vormals AutoRAG)</td><td>Eine hybride Pipeline</td><td>Kein Routing</td><td>Ja</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>Eine hybride Pipeline</td><td>Kein Routing</td><td>Ja</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>Hybrid + separater agentischer Modus</td><td>Modus wird manuell vom Nutzer gewählt</td><td>Ja</td></tr>
<tr><td>VectifyAI PageIndex</td><td>Einzelne Architektur (hierarchische Traversierung)</td><td>Kein Routing</td><td>OSS, eigenständig</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>Die ehrliche Schwäche in unserem Pitch:</strong> RAG-Routing pro Anfrage ist als Konzept nicht neu. Wir haben Routing nicht erfunden. Die echte Differenzierung ist die <em>Kombination</em> aus (a) Routing über architektonisch unterschiedliche Stacks statt nur über Tiefenvarianten, (b) PageIndex-/RAPTOR-/LightRAG-artige hierarchische Traversierung als erstklassiges Backend statt als separates Produkt und (c) einem verwalteten Endpunkt statt einer Bibliothek, die Sie selbst zusammenbauen und betreiben.</p>

<h2 class="section-heading">Wie Routing-Präferenzen befüllt werden</h2>

<p class="section-subheading">Ihr Routing-Modell ist nicht vortrainiert — es lernt aus <em>Ihrem</em> Traffic. Drei Signale speisen den Routing-Verlaufsspeicher.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>Arena-Auswahl.</strong> Schicken Sie eine Anfrage über <a href="/de/rag-arena/">RAG Arena</a> durch mehrere Backends, bewerten Sie die Varianten direkt nebeneinander und küren Sie den Sieger. Das Paar (Frage, Sieger-Backend) landet im Routing-Speicher.</li>
  <li><strong>Auto-Fix-Ergebnisse.</strong> Wenn unser Auto-Fix während des Ingests oder geplanter Audits vergleichende Retrievals auf repräsentativen Anfragen ausführt, wird das jeweils leistungsstärkste Backend pro Anfrage in denselben Speicher geschrieben.</li>
  <li><strong>Produktions-Feedback.</strong> Erfolgreiche Anfragen (jene, die über unser Online-Evaluations-Gate Ihre Qualitätsschwelle überschritten haben — siehe den <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">Beitrag zum Regressionstesten</a>) schreiben ihr Paar (Frage-Hash, Backend) zur Anfragezeit in den Routing-Speicher zurück, mit einer TTL von 30 Tagen, damit das Routing-Modell frisch bleibt, während sich Ihr Korpus weiterentwickelt.</li>
</ol>
<div class="rr-note">
  <strong>Wo dies wirklich produktionsreif ist und wo Roadmap:</strong> Schritte 1 und 2 sind heute ausgeliefert. Die automatische Feedback-Schleife in Schritt 3 ist teilweise ausgeliefert — erfolgreiche Anfragen schreiben zurück, doch Tier 2 (BM25 + RRF + Reranker) wird derzeit als Workflow-Knoten komponiert statt automatisch geroutet. Wir nehmen Tier 2 in den Auto-Router auf, sobald die Routing-Daten klare Gewinnbedingungen dafür zeigen.
</div>
</div>

<h2 class="section-heading">Wann das am wichtigsten ist</h2>

<p class="section-subheading">Ein homogenes Korpus mit einheitlichen Anfrageformen profitiert kaum — wählen Sie manuell ein Backend, und Sie sind fertig. Der Hebel sind gemischte Korpora und gemischte Anfrageformen.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Ein Rechtsteam, das sowohl „Wie lautet die Definition von höherer Gewalt in unserem Standardvertrag?" (Tier 1, unter 300 ms) als auch „Welche unserer 47 Lieferantenverträge enthalten nicht standardisierte Kündigungsklauseln und welche Muster gibt es?" (Tier 3, mehrsekündige Page-Index-Traversierung) fragt, möchte sich nicht auf ein Backend festlegen. Es will, dass die einfache Frage schnell und günstig zurückkommt und die tiefe Frage korrekt zurückkommt, auch wenn sie mehr kostet — ohne zwei Stacks betreiben zu müssen.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Das ist der Fall, in dem ein verwalteter Endpunkt, der über architektonisch unterschiedliche Backends routet, seinen Wert beweist. Ist Ihr Traffic einheitlich, brauchen Sie ihn nicht. Ist Ihr Traffic gemischt — und das ist bei den meisten echten Unternehmenskorpora der Fall —, schon.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>Weiterführende Lektüre und angrenzende Produkte</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
Die Architektur-Tiefenanalyse finden Sie in unserem Blogbeitrag <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>. Die Arena, die Schritt 1 oben antreibt, liegt unter <a href="/de/rag-arena/">RAG Arena &amp; Dynamic Routing</a>. Routing-Entscheidungen werden über dasselbe Release-Manifest-Muster audit-verankert, das wir plattformweit einsetzen — siehe <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>. Und wenn Sie wissen möchten, wie wir Retrieval-Qualität online evaluieren (das Signal, das Schritt 3 oben speist), ist der <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">Beitrag zum Regressionstesten</a> der richtige Einstieg.
</p>
</div>
