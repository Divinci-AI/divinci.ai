+++
title = "Routage RAG — Une API, plusieurs architectures"
description = "Le Routage RAG de Divinci envoie chaque requête au backend le moins cher qui y réponde. Dix moteurs de récupération sur un endpoint, routage par question."
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
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">Un seul endpoint d'API. Dix architectures de récupération prises en charge. Le routeur apprend de votre historique de trafic et oriente chaque nouvelle question vers le backend le plus susceptible d'y répondre correctement — au coût le plus bas qui satisfait encore votre seuil de qualité.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Parlons-en</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Lire l'analyse approfondie →</a>
  </p>
</section>

<h2 class="section-heading">Les trois architectures, conceptuellement</h2>

<p class="section-subheading">La plupart des systèmes RAG en production livrent une seule architecture de récupération et considèrent l'affaire close. Nous livrons un routeur qui choisit parmi des stacks architecturalement distincts — le bon choix est rarement le même pour toutes les requêtes de votre corpus.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · RAG à vecteurs plats</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>Idéal pour</h4>
    <p>Recherches de faits ponctuels, requêtes en forme de FAQ, questions « qu'est-ce que X ? » sur des corpus à découpage plat.</p>
    <div class="rr-stats">
      <strong>Latence :</strong><span>&lt; 300 ms p95</span>
      <strong>Coût :</strong><span>centimes par requête</span>
      <strong>Backends :</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · Hybride + Rerank</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>Idéal pour</h4>
    <p>Requêtes où les signaux lexicaux et sémantiques divergent — codes, noms propres, acronymes, vocabulaire technique, chaînes d'erreur.</p>
    <div class="rr-stats">
      <strong>Latence :</strong><span>~ 800 ms</span>
      <strong>Coût :</strong><span>toujours faible</span>
      <strong>Aujourd'hui :</strong><span>nœud de workflow composable · routage automatique au roadmap</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + Agent</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>Idéal pour</h4>
    <p>Lecture multi-saut de longs documents structurés — contrats juridiques, 10-K financiers, PDF techniques où le contexte s'étend sur des sections non adjacentes.</p>
    <div class="rr-stats">
      <strong>Latence :</strong><span>plusieurs secondes</span>
      <strong>Coût :</strong><span>le plus élevé — mais seulement quand c'est nécessaire</span>
      <strong>Backend :</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">Comment le routeur décide réellement</h2>

<p class="section-subheading">La plupart des routeurs RAG publiés classifient la requête d'emblée selon sa complexité. Le nôtre, non. Nous utilisons un <strong>routage appris</strong> : chaque requête réussie est stockée avec le backend qui y a répondu, et les nouvelles requêtes sont rapprochées de cet historique par similarité d'embedding.</p>

<div class="rr-mechanism">
<h3>L'algorithme de lookup — ce qui s'exécute à chaque requête</h3>
<ol>
  <li><strong>Hacher la question</strong> en SHA-256, tronqué en clé de 16 caractères, puis interroger le store de routage par client dans Cloudflare KV à la recherche d'une correspondance exacte antérieure. Si elle a déjà reçu une réponse, dispatch immédiat vers le backend qui s'en est le mieux sorti la dernière fois.</li>
  <li><strong>En cas de miss, embedder la question</strong> et faire une recherche cosinus sur l'index mis en cache des embeddings de questions historiques. Si la similarité du plus proche voisin dépasse <strong>0.88</strong>, dispatch vers le backend associé.</li>
  <li><strong>S'il n'y a aucune correspondance au-dessus du seuil,</strong> repli sur le backend par défaut du client pour ce corpus.</li>
  <li><strong>Une fois la réponse rendue,</strong> le tuple (hash de question, backend, score de qualité) est réécrit dans le store d'historique de routage par client, alimentant les futurs lookups.</li>
</ol>
<div class="rr-note">
  <strong>Pourquoi « appris » plutôt que « classifié » ?</strong> Empiriquement, une même forme de requête se comporte différemment selon les corpus. « Comparer X à travers Y » sur des contrats juridiques veut une traversée page-index Tier 3 ; la même forme sur un corpus FAQ plat est très bien sur Tier 1. Laisser le modèle de routage apprendre cette distinction par corpus à partir de preuves historiques, plutôt que de la deviner à partir de la syntaxe, c'est le choix de conception qui a réellement été livré.
</div>
</div>

<h2 class="section-heading">Les dix backends entre lesquels nous routons aujourd'hui</h2>

<p class="section-subheading">Le routeur dispatche vers l'un de dix backends nommés. Trois d'entre eux sont de forme « Tier 3 » (hiérarchiques ou enrichis par graphe) ; les autres sont des moteurs purement vectoriels que nous traitons comme Tier 1 avec différents arbitrages opérationnels.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>Arbre de table des matières hiérarchique + traversée agentique. L'archétype Tier 3.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>Récupération par traversée d'arbre sur des hiérarchies de documents résumées récursivement (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="Neo4j logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>Récupération enrichie par graphe combinant embeddings vectoriels et structure explicite d'entités / relations.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>Récupération bi-mode sur graphe plat — recherche d'entités + de communautés, l'approche LightRAG de HKU.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="Qdrant logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>Moteur vectoriel dense auto-hébergé pour des lookups à fort débit et faible latence.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="Cloudflare logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>Vectorize en edge — p95 sous 300 ms depuis le réseau global de Cloudflare.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="Couchbase logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>Store vectoriel Couchbase BYO pour les clients ayant des dépendances opérationnelles existantes.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="Google Cloud logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Recherche vectorielle Google Cloud Vertex AI pour les clients sur la stack data de Google.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="MongoDB logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>Atlas Vector Search pour les clients exploitant des données documentaires sur MongoDB.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="Redis logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>Recherche vectorielle Redis pour les charges de récupération in-memory à très faible latence.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2 (BM25 + fusion dense + reranker cross-encoder) est livré comme nœud composable dans notre canvas de workflow aujourd'hui. Le routeur automatique le ciblera ensuite, à mesure que les données de routage par corpus le justifieront.</em></p>

<h2 class="section-heading">Surface API — un endpoint, transparence niveau audit</h2>

<p class="section-subheading">Le routeur est invisible pour l'appelant. Une seule forme de requête ; la réponse inclut la décision de routage pour que vous puissiez auditer quel backend a répondu (et pourquoi).</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># Un seul endpoint. Le routeur décide quel backend utiliser.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># Réponse — chunks dont l'agent a besoin pour fonder la réponse.</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// page-index tier-3 dispatché</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · ou fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// seuil ≥ 0.88</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// fenêtre de fraîcheur avant re-benchmark</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>Les métadonnées <code>routing</code> sont aujourd'hui journalisées en interne et exposées via la piste d'audit. La livraison inline dans la réponse est en cours de déploiement durant le Q3 2026.</em></p>

<h2 class="section-heading">En quoi cela diffère des routeurs existants</h2>

<p class="section-subheading">Le routage RAG n'est pas une idée neuve — des routeurs académiques comme Adaptive-RAG et Probing-RAG classifient déjà les requêtes par complexité. La différenciation, c'est que Divinci route entre des <em>stacks de récupération architecturalement distincts</em>, en apprenant à partir de votre propre trafic, derrière un seul endpoint managé.</p>

<div class="rr-vs">
<table>
<thead><tr><th>Offre</th><th>Entre quoi cela route</th><th>Axe de routage</th><th>Managé ?</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 backends (PageIndex, RAPTOR, LightRAG, neo4j, 6 moteurs vectoriels)</td><td>Architecture · appris depuis l'historique</td><td>Oui — endpoint unique</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>BYO retrievers</td><td>Sélecteur LLM/Pydantic</td><td>Non — bibliothèque que vous assemblez</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>sans récupération / single-step / itératif</td><td>Profondeur · classifieur de complexité</td><td>Recherche</td></tr>
<tr><td>Cloudflare AI Search (ex-AutoRAG)</td><td>Un pipeline hybride</td><td>Pas de routage</td><td>Oui</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>Un pipeline hybride</td><td>Pas de routage</td><td>Oui</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>Hybride + mode agentique séparé</td><td>L'utilisateur choisit le mode manuellement</td><td>Oui</td></tr>
<tr><td>VectifyAI PageIndex</td><td>Architecture unique (traversée hiérarchique)</td><td>Pas de routage</td><td>OSS autonome</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>La faiblesse honnête dans notre pitch :</strong> le routage RAG par requête, en tant que concept, n'est pas neuf. Nous n'avons pas inventé le routage. La vraie différenciation, c'est la <em>combinaison</em> de (a) router entre des stacks architecturalement distincts plutôt qu'entre des variantes de profondeur, (b) inclure la traversée hiérarchique de type PageIndex / RAPTOR / LightRAG comme backend de première classe plutôt que comme produit séparé, et (c) un seul endpoint managé au lieu d'une bibliothèque que vous assemblez et exploitez vous-même.</p>

<h2 class="section-heading">Comment les préférences de routage sont initialisées</h2>

<p class="section-subheading">Votre modèle de routage n'est pas pré-entraîné — il apprend de <em>votre</em> trafic. Trois signaux alimentent le store d'historique de routage.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>Sélection en arène.</strong> Faites passer une requête dans <a href="/fr/rag-arena/">RAG Arena</a> sur plusieurs backends, scorez les variantes côte à côte, désignez le gagnant. La paire (question, backend gagnant) atterrit dans le store de routage.</li>
  <li><strong>Sorties d'auto-fix.</strong> Quand notre auto-fix exécute des récupérations comparatives sur des requêtes représentatives lors de l'ingestion ou d'audits planifiés, le backend le plus performant par requête est écrit dans le même store.</li>
  <li><strong>Feedback en production.</strong> Les requêtes réussies (celles qui ont franchi votre seuil de qualité via notre porte d'évaluation en ligne — voir le <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">post sur le regression testing</a>) réécrivent leur paire (hash de question, backend) dans le store de routage au moment de la requête, avec un TTL de 30 jours pour que le modèle de routage reste frais à mesure que votre corpus évolue.</li>
</ol>
<div class="rr-note">
  <strong>Où c'est réellement production-grade vs roadmap :</strong> Les étapes 1 et 2 sont livrées aujourd'hui. La boucle de feedback automatique de l'étape 3 est partiellement livrée — les requêtes réussies réécrivent bien, mais le tier-2 (BM25 + RRF + reranker) est actuellement composé comme nœud de workflow plutôt que routé automatiquement. Nous intégrerons le Tier 2 dans le routeur automatique dès que les données de routage feront apparaître des conditions de victoire claires pour lui.
</div>
</div>

<h2 class="section-heading">Quand cela compte le plus</h2>

<p class="section-subheading">Un corpus homogène avec des formes de requêtes uniformes en tire peu de bénéfice — choisissez un backend manuellement et c'est plié. Le coin d'entrée, ce sont les corpus mixtes et les formes de requêtes mixtes.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Une équipe juridique qui pose à la fois « quelle est la définition de la force majeure dans notre contrat standard ? » (Tier 1, sous 300 ms) et « parmi nos 47 contrats fournisseurs, lesquels ont des clauses de résiliation non standards et quels sont les patterns ? » (Tier 3, traversée page-index de plusieurs secondes) ne veut pas choisir un seul backend. Elle veut que la question simple revienne vite et pas cher, et que la question profonde revienne correctement même si elle coûte plus — sans exploiter deux stacks.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">C'est le cas où un endpoint managé unique routant entre des backends architecturalement distincts gagne sa place. Si votre trafic est uniforme, vous n'en avez pas besoin. Si votre trafic est mixte — la plupart des vrais corpus d'entreprise le sont — vous en avez besoin.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>Lectures approfondies et produits adjacents</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
L'analyse approfondie d'architecture vit dans notre billet de blog <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>. L'arène qui alimente l'étape 1 ci-dessus se trouve sur <a href="/fr/rag-arena/">RAG Arena &amp; Dynamic Routing</a>. Les décisions de routage sont ancrées en audit via le même pattern de release-manifest que nous utilisons à travers la plateforme — voir <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>. Et si vous voulez savoir comment nous évaluons la qualité de récupération en ligne (le signal qui alimente l'étape 3 ci-dessus), le <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">post sur le regression testing</a> est le point de départ.
</p>
</div>
