+++
title = "RAG 路由 — 一个 API，多种架构"
description = "Divinci 的 RAG 路由将每个查询分派到能够正确回答它的最便宜后端。十种受支持的检索引擎（PageIndex、neo4j-hybrid、RAPTOR、LightRAG、Qdrant、Cloudflare Vectorize、Couchbase、Vertex AI、MongoDB Atlas、Redis Vector）置于单个端点之后，并按问题学习路由。"
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
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">RAG 路由</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">一个 API 端点。十种受支持的检索架构。路由器从您的历史查询流量中学习，并将每个新问题分派到最有可能正确回答它的后端——以仍能通过您质量基线的最低成本完成。</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">与我们交流</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">阅读深度解析 →</a>
  </p>
</section>

<h2 class="section-heading">三种架构，从概念上看</h2>

<p class="section-subheading">大多数生产级 RAG 系统只发布一种检索架构，就此收工。我们发布的是一个能够在架构上截然不同的技术栈之间进行选择的路由器——对您语料库中的每个查询而言，正确选择很少是同一个。</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · 扁平向量 RAG</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>最适合</h4>
    <p>单一事实查找、FAQ 形式的查询，以及在扁平切块语料库上"X 是什么？"类型的问题。</p>
    <div class="rr-stats">
      <strong>延迟：</strong><span>&lt; 300 ms p95</span>
      <strong>成本：</strong><span>每次查询数美分</span>
      <strong>后端：</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · 混合 + 重排</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>最适合</h4>
    <p>词法信号与语义信号产生分歧的查询——代码、名称、首字母缩略词、技术词汇、错误字符串。</p>
    <div class="rr-stats">
      <strong>延迟：</strong><span>约 800 ms</span>
      <strong>成本：</strong><span>仍然较低</span>
      <strong>当前：</strong><span>可组合的工作流节点 · 自动路由在路线图上</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · 页面索引 + 智能体</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>最适合</h4>
    <p>对长篇结构化文档的多跳阅读——法律合同、财务 10-K、上下文跨越非相邻章节的技术 PDF。</p>
    <div class="rr-stats">
      <strong>延迟：</strong><span>数秒级</span>
      <strong>成本：</strong><span>最高——但仅在必要时使用</span>
      <strong>后端：</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">路由器实际上是如何决策的</h2>

<p class="section-subheading">大多数已发表的 RAG 路由器会预先按复杂度对查询进行分类。我们的不会。我们采用<strong>学习式路由</strong>：每个成功的查询都会与回答它的后端一起存储，新查询通过 embedding 相似度与该历史进行匹配。</p>

<div class="rr-mechanism">
<h3>查找算法——每次查询都会运行</h3>
<ol>
  <li><strong>对问题进行哈希</strong>，使用 SHA-256 截断为 16 字符的键，并在 Cloudflare KV 中按客户检查路由存储是否存在完全相同的先前匹配。如果之前已回答过，立即分派到上次表现最好的后端。</li>
  <li><strong>未命中时，对问题进行 embedding</strong>，并对历史问题 embedding 的缓存索引进行余弦搜索。如果最近邻的相似度超过 <strong>0.88</strong>，则分派到其关联的后端。</li>
  <li><strong>如果没有匹配项超过阈值，</strong>则回退到客户为该语料库设置的默认后端。</li>
  <li><strong>答案渲染完成后，</strong>（问题哈希、后端、质量分数）三元组将被写回该客户的路由历史存储，为后续查找播种。</li>
</ol>
<div class="rr-note">
  <strong>为什么用"学习"而不是"分类"？</strong>从经验上看，相同形式的查询在不同语料库上的表现并不一样。"跨 Y 比较 X"在法律合同上需要 Tier 3 页面索引遍历；同样的形式在扁平 FAQ 语料库上 Tier 1 就够用。让路由模型从历史证据出发按语料库学习这一区别，而不是从查询语法上猜测，才是真正可落地的设计选择。
</div>
</div>

<h2 class="section-heading">我们今天在十种后端之间路由</h2>

<p class="section-subheading">路由器会分派到十个命名后端之一。其中三个是"Tier 3 形态"（层级或图增强）；其余是纯向量引擎，我们视为具有不同运维取舍的 Tier 1。</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>层级 TOC 树 + 智能体遍历。Tier 3 的原型。</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>对递归摘要的文档层级进行树遍历检索（ICLR 2024）。</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>图增强检索，将向量 embedding 与显式的实体／关系结构相结合。</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>扁平图双模式检索——实体 + 社区搜索，源自港大 LightRAG 方法。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>自托管稠密向量引擎，面向高吞吐、低延迟查找。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>边缘端 Vectorize——来自 Cloudflare 全球网络的 sub-300 ms p95。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>面向已有运维依赖的客户的自带 Couchbase 向量存储。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>面向使用 Google 数据栈的客户的 Google Cloud Vertex AI 向量搜索。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>面向在 MongoDB 上运行文档数据的客户的 Atlas Vector Search。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>面向超低延迟内存检索负载的 Redis 向量搜索。</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2（BM25 + 稠密融合 + cross-encoder 重排）今天作为可组合节点在我们的工作流画布中上线。当按语料库的路由数据证明合理时，自动路由器将接下来对其支持。</em></p>

<h2 class="section-heading">API 表层——一个端点，审计级透明度</h2>

<p class="section-subheading">路由器对调用方是不可见的。一种请求形态；响应中包含路由决策，方便您审计是哪个后端回答（以及为什么）。</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># 一个端点。路由器决定使用哪个后端。</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># 响应——智能体用于支撑答案的文本块。</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// 分派至 tier-3 page-index</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · 或 fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// ≥ 0.88 阈值</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// 重新基准评估前的新鲜度窗口</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>目前 <code>routing</code> 元数据在内部记录，并通过审计轨迹对外暴露。内联响应交付将在 2026 年第三季度逐步推出。</em></p>

<h2 class="section-heading">与现有路由器的差异</h2>

<p class="section-subheading">RAG 路由并非新想法——Adaptive-RAG 和 Probing-RAG 这类学术路由器已经按复杂度对查询进行分类。差异之处在于 Divinci 在<em>架构上截然不同的检索栈</em>之间路由，从您自身的流量中学习，并置于单个托管端点之后。</p>

<div class="rr-vs">
<table>
<thead><tr><th>方案</th><th>在什么之间路由</th><th>路由轴</th><th>是否托管？</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 个后端（PageIndex、RAPTOR、LightRAG、neo4j、6 个向量引擎）</td><td>架构 · 从历史中学习</td><td>是——单一端点</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>自带检索器</td><td>LLM/Pydantic 选择器</td><td>否——需自行组装的库</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>无检索 / 单步 / 迭代</td><td>深度 · 查询复杂度分类器</td><td>研究项目</td></tr>
<tr><td>Cloudflare AI Search（前 AutoRAG）</td><td>一条混合流水线</td><td>无路由</td><td>是</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>一条混合流水线</td><td>无路由</td><td>是</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>混合 + 单独的智能体模式</td><td>用户手动选择模式</td><td>是</td></tr>
<tr><td>VectifyAI PageIndex</td><td>单一架构（层级遍历）</td><td>无路由</td><td>开源独立项目</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>我们叙述中的诚实弱点：</strong>按查询进行 RAG 路由作为一个概念并不新鲜。我们没有发明路由。真正的差异在于以下三点的<em>组合</em>：（a）在架构上截然不同的栈之间路由，而非深度变体；（b）将 PageIndex / RAPTOR / LightRAG 风格的层级遍历作为一等后端纳入，而非单独的产品；（c）一个托管端点，而非一个需要您自己组装并运维的库。</p>

<h2 class="section-heading">路由偏好是如何被播种的</h2>

<p class="section-subheading">您的路由模型不是预训练的——它从<em>您的</em>流量中学习。三种信号会写入路由历史存储。</p>

<div class="rr-mechanism">
<ol>
  <li><strong>Arena 选择。</strong>通过 <a href="/rag-arena/">RAG Arena</a> 在多个后端之间运行某个查询，对各变体并排打分，挑出获胜者。（问题、获胜后端）对将进入路由存储。</li>
  <li><strong>Auto-fix 输出。</strong>当我们的 auto-fix 在摄取或定期审计期间对代表性查询运行对比检索时，每个查询表现最好的后端会被写入同一存储。</li>
  <li><strong>生产反馈。</strong>成功的查询（即通过我们的在线评估闸门得分高于您质量阈值的查询——参见<a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">回归测试文章</a>）在请求时将其（问题哈希、后端）对写回路由存储，TTL 为 30 天，确保路由模型随语料库演进保持新鲜。</li>
</ol>
<div class="rr-note">
  <strong>哪些环节真正达到生产级，哪些仍在路线图上：</strong>第 1 步和第 2 步今天已上线。第 3 步的自动反馈循环已部分上线——成功的查询会写回，但 Tier 2（BM25 + RRF + reranker）目前作为工作流节点组合使用，尚未自动路由。当路由数据明显显示其胜出条件时，我们会将 Tier 2 纳入自动路由器。
</div>
</div>

<h2 class="section-heading">这项能力在什么时候最重要</h2>

<p class="section-subheading">查询形态统一的同质语料库收益有限——手动选一个后端就够了。真正的契入点在于混合语料库与混合查询形态。</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">一个法律团队既会问"我们标准合同中不可抗力的定义是什么？"（Tier 1，sub-300 ms），又会问"在我们 47 份供应商合同中，哪些有非标准的终止条款，模式是什么？"（Tier 3，多秒级 page-index 遍历），他们不想只选一个后端。他们希望简单问题快速且廉价地返回，深度问题即使代价更高也能正确返回——而无需运维两套栈。</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">这正是一个跨架构差异化后端进行路由的托管端点真正发挥价值的场景。如果您的流量是统一的，您并不需要它。如果您的流量是混合的——大多数真实企业语料库都是——那您需要它。</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>更深入的阅读与相关产品</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
架构深度解析见我们的博客文章 <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>。驱动上述第 1 步的竞技场位于 <a href="/rag-arena/">RAG Arena &amp; Dynamic Routing</a>。路由决策通过我们整个平台所用的同一种发布清单模式进行审计锚定——参见 <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>。如果您想了解我们如何在线评估检索质量（即驱动上述第 3 步的信号），<a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">回归测试文章</a>是起点。
</p>
</div>
