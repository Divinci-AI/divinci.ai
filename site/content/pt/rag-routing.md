+++
title = "Roteamento RAG — Uma API, Várias Arquiteturas"
description = "O Roteamento RAG da Divinci despacha cada consulta para o backend mais barato capaz de respondê-la corretamente. Dez mecanismos de recuperação suportados (PageIndex, neo4j-hybrid, RAPTOR, LightRAG, Qdrant, Cloudflare Vectorize, Couchbase, Vertex AI, MongoDB Atlas, Redis Vector) atrás de um único endpoint, com roteamento aprendido por pergunta."
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
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">Roteamento RAG</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">Um único endpoint de API. Dez arquiteturas de recuperação suportadas. O roteador aprende com o seu tráfego histórico de consultas e despacha cada nova pergunta para o backend com maior probabilidade de respondê-la corretamente — pelo menor custo que ainda atenda ao seu padrão de qualidade.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Fale conosco</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Leia o mergulho profundo →</a>
  </p>
</section>

<h2 class="section-heading">As três arquiteturas, conceitualmente</h2>

<p class="section-subheading">A maioria dos sistemas RAG em produção entrega uma única arquitetura de recuperação e considera o trabalho encerrado. Nós entregamos um roteador que escolhe entre stacks arquiteturalmente distintos — a escolha certa raramente é a mesma para cada consulta no seu corpus.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · RAG de Vetor Plano</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>Ideal para</h4>
    <p>Consultas de fato único, perguntas no formato FAQ, perguntas do tipo "o que é X?" em corpora com chunks planos.</p>
    <div class="rr-stats">
      <strong>Latência:</strong><span>&lt; 300 ms p95</span>
      <strong>Custo:</strong><span>centavos por consulta</span>
      <strong>Backends:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · Híbrido + Rerank</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>Ideal para</h4>
    <p>Consultas em que sinais léxicos e semânticos divergem — códigos, nomes, siglas, vocabulário técnico, strings de erro.</p>
    <div class="rr-stats">
      <strong>Latência:</strong><span>~ 800 ms</span>
      <strong>Custo:</strong><span>ainda baixo</span>
      <strong>Hoje:</strong><span>nó componível de workflow · roteador automático no roadmap</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + Agente</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>Ideal para</h4>
    <p>Leitura multi-hop de documentos longos e estruturados — contratos jurídicos, formulários financeiros 10-K, PDFs técnicos em que o contexto atravessa seções não adjacentes.</p>
    <div class="rr-stats">
      <strong>Latência:</strong><span>vários segundos</span>
      <strong>Custo:</strong><span>o mais alto — mas apenas quando necessário</span>
      <strong>Backend:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">Como o roteador realmente decide</h2>

<p class="section-subheading">A maioria dos roteadores RAG publicados classifica a consulta de antemão por complexidade. O nosso não. Usamos <strong>roteamento aprendido</strong>: cada consulta bem-sucedida é armazenada junto com o backend que a respondeu, e novas consultas são comparadas a esse histórico por similaridade de embedding.</p>

<div class="rr-mechanism">
<h3>O algoritmo de lookup — o que roda em cada consulta</h3>
<ol>
  <li><strong>Faça o hash da pergunta</strong> com SHA-256, truncado em uma chave de 16 caracteres, e consulte o armazenamento de roteamento por cliente no Cloudflare KV para encontrar uma correspondência exata anterior. Se já foi respondida antes, despache imediatamente para o backend que teve o melhor desempenho da última vez.</li>
  <li><strong>Em caso de miss, faça o embedding da pergunta</strong> e execute busca por cosseno contra o índice em cache de embeddings de perguntas históricas. Se a similaridade do vizinho mais próximo exceder <strong>0.88</strong>, despache para o backend associado.</li>
  <li><strong>Sem correspondência acima do limiar,</strong> faça fallback para o backend padrão do cliente para aquele corpus.</li>
  <li><strong>Após a resposta ser renderizada,</strong> a tupla (hash da pergunta, backend, score de qualidade) é gravada de volta no armazenamento de histórico de roteamento daquele cliente, alimentando lookups futuros.</li>
</ol>
<div class="rr-note">
  <strong>Por que "aprendido" em vez de "classificado"?</strong> Empiricamente, a mesma forma de consulta se comporta de modo diferente em corpora diferentes. "Compare X em Y" em contratos jurídicos pede traversal page-index de Tier 3; a mesma forma em um corpus plano de FAQ funciona bem em Tier 1. Deixar o modelo de roteamento aprender essa distinção por corpus a partir de evidências históricas, em vez de adivinhar pela sintaxe da consulta, foi a decisão de design que efetivamente entregamos.
</div>
</div>

<h2 class="section-heading">Os dez backends entre os quais roteamos hoje</h2>

<p class="section-subheading">O roteador despacha para um entre dez backends nomeados. Três deles têm "formato Tier 3" (hierárquicos ou enriquecidos por grafos); os demais são mecanismos puramente vetoriais que tratamos como Tier 1 com diferentes tradeoffs operacionais.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>Árvore hierárquica de sumário + traversal agêntico. O arquétipo do Tier 3.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>Recuperação por traversal de árvore sobre hierarquias de documentos sumarizadas recursivamente (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>Recuperação enriquecida por grafos combinando embeddings vetoriais com estrutura explícita de entidades e relações.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>Recuperação dual-mode em grafo plano — busca por entidade e por comunidade, a abordagem do LightRAG da HKU.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>Mecanismo denso-vetorial self-hosted para lookups de alta vazão e baixa latência.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>Vectorize na edge — sub-300 ms p95 a partir da rede global da Cloudflare.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>Vector store Couchbase BYO para clientes com dependências operacionais existentes.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Busca vetorial do Google Cloud Vertex AI para clientes no stack de dados do Google.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>Atlas Vector Search para clientes que rodam dados documentais no MongoDB.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>Busca vetorial Redis para cargas de recuperação in-memory com latência ultrabaixa.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>O Tier 2 (BM25 + fusão densa + cross-encoder reranker) já é entregue hoje no nosso canvas de workflow como um nó componível. O roteador automático o adiciona em seguida, conforme os dados de roteamento por corpus justifiquem.</em></p>

<h2 class="section-heading">Superfície da API — um endpoint, transparência em nível de auditoria</h2>

<p class="section-subheading">O roteador é invisível para quem chama. Um único formato de requisição; a resposta inclui a decisão de roteamento para que você possa auditar qual backend respondeu (e por quê).</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># Um único endpoint. O roteador decide qual backend usar.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># Resposta — chunks de que o agente precisa para fundamentar a resposta.</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// despachado para page-index tier-3</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · ou fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// ≥ 0.88 de limiar</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// janela de frescor antes de novo benchmark</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>Os metadados de <code>routing</code> são atualmente registrados internamente e expostos via trilha de auditoria. A entrega inline na resposta está sendo liberada gradualmente ao longo do Q3 de 2026.</em></p>

<h2 class="section-heading">Como isso se diferencia dos roteadores existentes</h2>

<p class="section-subheading">Roteamento RAG não é uma ideia nova — roteadores acadêmicos como Adaptive-RAG e Probing-RAG já classificam consultas por complexidade. A diferenciação é que a Divinci roteia entre <em>stacks de recuperação arquiteturalmente distintos</em>, aprendidos a partir do seu próprio tráfego, atrás de um único endpoint gerenciado.</p>

<div class="rr-vs">
<table>
<thead><tr><th>Oferta</th><th>O que ela roteia</th><th>Eixo de roteamento</th><th>Gerenciado?</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 backends (PageIndex, RAPTOR, LightRAG, neo4j, 6 mecanismos vetoriais)</td><td>Arquitetura · aprendido do histórico</td><td>Sim — endpoint único</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>Retrievers BYO</td><td>Seletor LLM/Pydantic</td><td>Não — biblioteca que você monta</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>sem recuperação / passo único / iterativo</td><td>Profundidade · classificador de complexidade de consulta</td><td>Pesquisa</td></tr>
<tr><td>Cloudflare AI Search (ex-AutoRAG)</td><td>Um pipeline híbrido</td><td>Sem roteamento</td><td>Sim</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>Um pipeline híbrido</td><td>Sem roteamento</td><td>Sim</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>Híbrido + modo agêntico separado</td><td>Usuário escolhe o modo manualmente</td><td>Sim</td></tr>
<tr><td>VectifyAI PageIndex</td><td>Arquitetura única (traversal hierárquico)</td><td>Sem roteamento</td><td>OSS standalone</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>A fraqueza honesta no nosso pitch:</strong> roteamento RAG por consulta como conceito não é novo. Não inventamos o roteamento. A diferenciação genuína está na <em>combinação</em> entre (a) rotear entre stacks arquiteturalmente distintos em vez de variantes de profundidade, (b) traversal hierárquico nos moldes de PageIndex / RAPTOR / LightRAG incluído como backend de primeira classe, e não como produto separado, e (c) um único endpoint gerenciado em vez de uma biblioteca que você monta e opera por conta própria.</p>

<h2 class="section-heading">Como as preferências de roteamento são alimentadas</h2>

<p class="section-subheading">Seu modelo de roteamento não é pré-treinado — ele aprende com o <em>seu</em> tráfego. Três sinais alimentam o armazenamento de histórico de roteamento.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>Seleção na arena.</strong> Execute uma consulta pelo <a href="/pt/rag-arena/">RAG Arena</a> em vários backends, pontue as variantes lado a lado e escolha a vencedora. O par (pergunta, backend vencedor) entra no armazenamento de roteamento.</li>
  <li><strong>Saídas do auto-fix.</strong> Quando nosso auto-fix executa recuperações comparativas sobre consultas representativas durante a ingestão ou auditorias agendadas, o backend de melhor desempenho por consulta é gravado no mesmo armazenamento.</li>
  <li><strong>Feedback de produção.</strong> Consultas bem-sucedidas (aquelas que ultrapassaram seu limiar de qualidade via nosso gate de avaliação online — veja o <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">post sobre testes de regressão</a>) gravam o par (hash da pergunta, backend) de volta no armazenamento de roteamento em tempo de requisição, com TTL de 30 dias para que o modelo de roteamento permaneça fresco à medida que seu corpus evolui.</li>
</ol>
<div class="rr-note">
  <strong>O que de fato está em produção vs no roadmap:</strong> os passos 1 e 2 já entregamos hoje. O loop de feedback automático do passo 3 está parcialmente entregue — consultas bem-sucedidas escrevem de volta, mas o tier-2 (BM25 + RRF + reranker) está atualmente composto como um nó de workflow em vez de ser auto-roteado. Vamos incorporar o Tier 2 ao roteador automático conforme os dados de roteamento mostrarem condições claras de vitória para ele.
</div>
</div>

<h2 class="section-heading">Quando isso importa mais</h2>

<p class="section-subheading">Um corpus homogêneo com formatos de consulta uniformes se beneficia pouco — escolha um backend manualmente e está pronto. A cunha está em corpora mistos e formatos de consulta mistos.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Um time jurídico que pergunta tanto "qual é a definição de força maior no nosso contrato padrão?" (Tier 1, abaixo de 300 ms) quanto "ao longo dos nossos 47 contratos com fornecedores, quais têm cláusulas de rescisão não-padrão e quais são os padrões?" (Tier 3, traversal page-index de vários segundos) não quer escolher um único backend. Eles querem que a pergunta simples volte rápida e barata, e que a pergunta profunda volte correta mesmo que custe mais — sem operar dois stacks.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">É nesse cenário que um endpoint único gerenciado roteando entre backends arquiteturalmente distintos compensa o investimento. Se o seu tráfego é uniforme, você não precisa disso. Se o seu tráfego é misto — e a maioria dos corpora corporativos reais é — você precisa.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>Leitura aprofundada e produtos adjacentes</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
O mergulho profundo na arquitetura está no nosso post <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>. A arena que alimenta o Passo 1 acima está em <a href="/pt/rag-arena/">RAG Arena &amp; Dynamic Routing</a>. As decisões de roteamento são ancoradas em auditoria pelo mesmo padrão de release-manifest que usamos em toda a plataforma — veja <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>. E, se você quer saber como avaliamos a qualidade da recuperação online (o sinal que alimenta o Passo 3 acima), o <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">post sobre testes de regressão</a> é o ponto de partida.
</p>
</div>
