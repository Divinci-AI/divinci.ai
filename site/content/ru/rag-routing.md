+++
title = "Маршрутизация RAG — один API, множество архитектур"
description = "Маршрутизация RAG от Divinci направляет каждый запрос к самому дешёвому бэкенду, способному ответить на него корректно. Десять поддерживаемых движков извлечения (PageIndex, neo4j-hybrid, RAPTOR, LightRAG, Qdrant, Cloudflare Vectorize, Couchbase, Vertex AI, MongoDB Atlas, Redis Vector) за одной конечной точкой, с обученной маршрутизацией для каждого вопроса."
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
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">Маршрутизация RAG</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">Одна конечная точка API. Десять поддерживаемых архитектур извлечения. Маршрутизатор учится на исторических данных вашего трафика и направляет каждый новый вопрос к бэкенду, который с наибольшей вероятностью ответит на него корректно — по минимальной цене, всё ещё проходящей вашу планку качества.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">Связаться с нами</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Прочитать подробный разбор →</a>
  </p>
</section>

<h2 class="section-heading">Три архитектуры — концептуально</h2>

<p class="section-subheading">Большинство продакшен-систем RAG поставляют одну архитектуру извлечения и считают задачу решённой. Мы поставляем маршрутизатор, который выбирает между архитектурно различными стеками — правильный выбор редко одинаков для всех запросов в вашем корпусе.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · Плоско-векторный RAG</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">эмбеддинг → косинусный top-k<br>→ заполнение контекста<br>→ генерация</div>
    <h4>Лучше всего подходит для</h4>
    <p>Поиска отдельных фактов, запросов в форме FAQ, вопросов «что такое X?» по корпусам с плоской разбивкой на чанки.</p>
    <div class="rr-stats">
      <strong>Задержка:</strong><span>&lt; 300 мс p95</span>
      <strong>Стоимость:</strong><span>центы за запрос</span>
      <strong>Бэкенды:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · Гибрид + реранкинг</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 лексический + плотный вектор<br>→ Reciprocal Rank Fusion<br>→ cross-encoder реранкер<br>→ генерация</div>
    <h4>Лучше всего подходит для</h4>
    <p>Запросов, в которых лексические и семантические сигналы расходятся — коды, имена, аббревиатуры, технический словарь, строки ошибок.</p>
    <div class="rr-stats">
      <strong>Задержка:</strong><span>~ 800 мс</span>
      <strong>Стоимость:</strong><span>по-прежнему низкая</span>
      <strong>Сегодня:</strong><span>композируемый узел воркфлоу · авто-маршрутизатор в дорожной карте</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + агент</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">иерархическое дерево оглавления<br>строится при загрузке → агент обходит дерево<br>→ открывает / читает разделы<br>→ генерация</div>
    <h4>Лучше всего подходит для</h4>
    <p>Многошагового чтения длинных структурированных документов — юридических договоров, финансовых отчётов 10-K, технических PDF, где контекст разнесён по несмежным разделам.</p>
    <div class="rr-stats">
      <strong>Задержка:</strong><span>несколько секунд</span>
      <strong>Стоимость:</strong><span>самая высокая — но только когда нужно</span>
      <strong>Бэкенд:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">Как маршрутизатор на самом деле принимает решения</h2>

<p class="section-subheading">Большинство опубликованных маршрутизаторов RAG классифицируют запрос заранее по сложности. Наш — нет. Мы используем <strong>обучаемую маршрутизацию</strong>: каждый успешный запрос сохраняется вместе с бэкендом, который на него ответил, и новые запросы сопоставляются с этой историей по сходству эмбеддингов.</p>

<div class="rr-mechanism">
<h3>Алгоритм поиска — что выполняется на каждом запросе</h3>
<ol>
  <li><strong>Захешировать вопрос</strong> с помощью SHA-256, обрезать до 16-символьного ключа и проверить хранилище маршрутизации Cloudflare KV для конкретного клиента на точное прежнее совпадение. Если на вопрос уже отвечали раньше, немедленно направить его на бэкенд, который в прошлый раз справился лучше всех.</li>
  <li><strong>При промахе — построить эмбеддинг вопроса</strong> и выполнить косинусный поиск по кэшированному индексу исторических эмбеддингов вопросов. Если сходство ближайшего соседа превышает <strong>0.88</strong>, направить на ассоциированный с ним бэкенд.</li>
  <li><strong>При отсутствии совпадения выше порога</strong> — откатиться к бэкенду по умолчанию клиента для данного корпуса.</li>
  <li><strong>После того как ответ сформирован,</strong> кортеж (хеш вопроса, бэкенд, оценка качества) записывается обратно в хранилище истории маршрутизации клиента, формируя основу для будущих поисков.</li>
</ol>
<div class="rr-note">
  <strong>Почему «обучаемая», а не «классифицированная»?</strong> Эмпирически один и тот же тип запроса ведёт себя по-разному на разных корпусах. «Сравните X между Y» на юридических договорах требует обхода Tier 3 page-index; та же форма запроса на плоском FAQ-корпусе прекрасно работает на Tier 1. Позволять модели маршрутизации учить это различие для каждого корпуса по историческим данным, а не угадывать по синтаксису запроса — это конструкторское решение, которое действительно дошло до продакшена.
</div>
</div>

<h2 class="section-heading">Десять бэкендов, между которыми мы сегодня маршрутизируем</h2>

<p class="section-subheading">Маршрутизатор направляет запросы к одному из десяти именованных бэкендов. Три из них «в стиле Tier 3» (иерархические или граф-расширенные); остальные — чисто векторные движки, которые мы рассматриваем как Tier 1 с разными операционными компромиссами.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>Иерархическое дерево оглавления + агентный обход. Архетип Tier 3.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>Извлечение обходом дерева по рекурсивно резюмированным иерархиям документов (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>Граф-расширенное извлечение, объединяющее векторные эмбеддинги с явной структурой сущностей и отношений.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>Плоско-графовое извлечение в двойном режиме — поиск по сущностям и сообществам, подход HKU LightRAG.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>Self-hosted движок плотных векторов для высокопропускных поисков с низкой задержкой.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>Vectorize на эдже — менее 300 мс p95 из глобальной сети Cloudflare.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>BYO-хранилище векторов Couchbase для клиентов с существующими операционными зависимостями.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Векторный поиск Google Cloud Vertex AI для клиентов на дата-стеке Google.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>Atlas Vector Search для клиентов, хранящих документные данные в MongoDB.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>Векторный поиск Redis для рабочих нагрузок извлечения с ультранизкой задержкой в памяти.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2 (BM25 + слияние плотных векторов + cross-encoder реранкер) поставляется сегодня в нашем canvas-воркфлоу как композируемый узел. Авто-маршрутизатор подключит его следующим, когда данные маршрутизации по корпусу это оправдают.</em></p>

<h2 class="section-heading">API-поверхность — одна конечная точка, аудитная прозрачность</h2>

<p class="section-subheading">Маршрутизатор невидим для вызывающего кода. Один формат запроса; ответ включает решение о маршрутизации, чтобы вы могли проаудировать, какой бэкенд ответил (и почему).</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># Одна конечная точка. Маршрутизатор решает, какой бэкенд использовать.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># Ответ — чанки, нужные агенту для обоснования ответа.</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// направлено на tier-3 page-index</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · или fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// порог ≥ 0.88</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// окно свежести до переоценки</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>Метаданные <code>routing</code> сегодня логируются внутренне и доступны через аудит-трейл. Инлайн-доставка в ответе раскатывается в течение Q3 2026.</em></p>

<h2 class="section-heading">Чем это отличается от существующих маршрутизаторов</h2>

<p class="section-subheading">Маршрутизация RAG не является новой идеей — академические маршрутизаторы вроде Adaptive-RAG и Probing-RAG уже классифицируют запросы по сложности. Дифференциация в том, что Divinci маршрутизирует между <em>архитектурно различными стеками извлечения</em>, обучаясь на вашем собственном трафике, за одной управляемой конечной точкой.</p>

<div class="rr-vs">
<table>
<thead><tr><th>Предложение</th><th>Между чем маршрутизирует</th><th>Ось маршрутизации</th><th>Управляемый?</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 бэкендов (PageIndex, RAPTOR, LightRAG, neo4j, 6 векторных движков)</td><td>Архитектура · обучение на истории</td><td>Да — одна конечная точка</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>BYO-ретриверы</td><td>LLM/Pydantic-селектор</td><td>Нет — библиотека, которую вы собираете</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>без извлечения / однократно / итеративно</td><td>Глубина · классификатор сложности запроса</td><td>Исследование</td></tr>
<tr><td>Cloudflare AI Search (ex-AutoRAG)</td><td>Один гибридный пайплайн</td><td>Без маршрутизации</td><td>Да</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>Один гибридный пайплайн</td><td>Без маршрутизации</td><td>Да</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>Гибрид + отдельный агентный режим</td><td>Пользователь выбирает режим вручную</td><td>Да</td></tr>
<tr><td>VectifyAI PageIndex</td><td>Одна архитектура (иерархический обход)</td><td>Без маршрутизации</td><td>Open-source standalone</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>Честная слабая сторона нашего питча:</strong> маршрутизация RAG как концепция сама по себе не нова. Мы не изобрели маршрутизацию. Подлинная дифференциация — это <em>сочетание</em> (a) маршрутизации между архитектурно различными стеками, а не вариантами по глубине, (b) включения иерархического обхода в стиле PageIndex / RAPTOR / LightRAG как полноправного бэкенда, а не отдельного продукта, и (c) одной управляемой конечной точки вместо библиотеки, которую вы сами собираете и обслуживаете.</p>

<h2 class="section-heading">Как формируются предпочтения маршрутизации</h2>

<p class="section-subheading">Ваша модель маршрутизации не предобучена — она учится на <em>вашем</em> трафике. В хранилище истории маршрутизации поступают три сигнала.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>Выбор в Arena.</strong> Прогоните запрос через <a href="/rag-arena/">RAG Arena</a> по нескольким бэкендам, оцените варианты бок о бок и выберите победителя. Пара (вопрос, бэкенд-победитель) попадает в хранилище маршрутизации.</li>
  <li><strong>Выходы auto-fix.</strong> Когда наш auto-fix выполняет сравнительные извлечения по репрезентативным запросам во время загрузки или плановых аудитов, лучший бэкенд по каждому запросу записывается в то же хранилище.</li>
  <li><strong>Обратная связь из продакшена.</strong> Успешные запросы (те, что прошли вашу планку качества через наш онлайн-гейт оценки — см. <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">пост про регрессионное тестирование</a>) записывают свою пару (хеш вопроса, бэкенд) обратно в хранилище маршрутизации в момент запроса, с TTL 30 дней, чтобы модель маршрутизации оставалась свежей по мере эволюции вашего корпуса.</li>
</ol>
<div class="rr-note">
  <strong>Что здесь действительно продакшен-уровня, а что — дорожная карта:</strong> шаги 1 и 2 поставлены сегодня. Автоматическая петля обратной связи шага 3 поставлена частично — успешные запросы пишутся обратно, но Tier 2 (BM25 + RRF + реранкер) сейчас оформлен как узел воркфлоу, а не авто-маршрутизируется. Мы включим Tier 2 в авто-маршрутизатор, когда данные маршрутизации покажут чёткие условия победы для него.
</div>
</div>

<h2 class="section-heading">Когда это важнее всего</h2>

<p class="section-subheading">Однородный корпус с единообразными формами запросов выигрывает мало — выберите один бэкенд вручную, и дело сделано. Точка опоры — это смешанные корпуса и смешанные формы запросов.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Юридическая команда, которая задаёт и «каково определение форс-мажора в нашем стандартном договоре?» (Tier 1, менее 300 мс), и «по нашим 47 договорам с поставщиками — какие из них содержат нестандартные условия расторжения и каковы паттерны?» (Tier 3, многосекундный обход page-index), не хочет выбирать один бэкенд. Они хотят, чтобы простой вопрос возвращался быстро и дёшево, а глубокий — корректно, даже если он стоит дороже — без необходимости эксплуатировать два стека.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">Именно в этом случае одна управляемая конечная точка, маршрутизирующая между архитектурно различными бэкендами, оправдывает себя. Если ваш трафик однороден — вам это не нужно. Если ваш трафик смешан — а большинство реальных корпоративных корпусов именно такие — нужно.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>Углублённое чтение и смежные продукты</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
Подробный архитектурный разбор находится в нашем блог-посте <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>. Арена, на которой основан шаг 1 выше, находится по адресу <a href="/rag-arena/">RAG Arena &amp; Dynamic Routing</a>. Решения о маршрутизации привязываются к аудит-якорю по тому же паттерну release-manifest, который мы используем по всей платформе — см. <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>. А если вы хотите узнать, как мы оцениваем качество извлечения в онлайне (тот самый сигнал, что питает шаг 3 выше), начните с <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">поста про регрессионное тестирование</a>.
</p>
</div>
