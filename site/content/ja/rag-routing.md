+++
title = "RAGルーティング — 1つのAPI、複数のアーキテクチャ"
description = "DivinciのRAGルーティングは、すべてのクエリを正しく回答できる最も安価なバックエンドへ振り分けます。10種類の検索エンジン（PageIndex、neo4j-hybrid、RAPTOR、LightRAG、Qdrant、Cloudflare Vectorize、Couchbase、Vertex AI、MongoDB Atlas、Redis Vector）を1つのエンドポイントの背後に統合し、質問ごとに学習型ルーティングを行います。"
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
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">RAGルーティング</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">1つのAPIエンドポイント。10種類の検索アーキテクチャをサポート。ルーターはお客様の過去のクエリトラフィックから学習し、新しい質問ごとに「正しく回答できる可能性が最も高いバックエンド」へ、品質基準を満たす範囲内で最も低コストな選択肢に振り分けます。</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">お問い合わせ</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">詳細な解説を読む →</a>
  </p>
</section>

<h2 class="section-heading">3つのアーキテクチャ — コンセプト概要</h2>

<p class="section-subheading">多くの本番RAGシステムは、1つの検索アーキテクチャを出荷してそれで完結としています。私たちは、アーキテクチャ的に異なるスタック間で選択するルーターを提供します。コーパス内のすべてのクエリに対して最適な選択肢が同じであることは、ほとんどありません。</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · フラットベクトルRAG</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>最適な用途</h4>
    <p>単一事実の検索、FAQ型のクエリ、フラットチャンク化されたコーパス上での「Xとは何か？」型の質問。</p>
    <div class="rr-stats">
      <strong>レイテンシ:</strong><span>&lt; 300 ms p95</span>
      <strong>コスト:</strong><span>クエリあたり数セント</span>
      <strong>バックエンド:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · ハイブリッド + 再ランキング</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>最適な用途</h4>
    <p>字句的シグナルと意味的シグナルが一致しないクエリ — コード、固有名、略語、技術用語、エラー文字列など。</p>
    <div class="rr-stats">
      <strong>レイテンシ:</strong><span>~ 800 ms</span>
      <strong>コスト:</strong><span>依然として低い</span>
      <strong>現状:</strong><span>コンポーザブルなワークフローノード · 自動ルーターへの組み込みはロードマップ</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + エージェント</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>最適な用途</h4>
    <p>長い構造化文書のマルチホップ読解 — 法務契約書、財務10-K、コンテキストが隣接していないセクションにまたがる技術PDFなど。</p>
    <div class="rr-stats">
      <strong>レイテンシ:</strong><span>数秒オーダー</span>
      <strong>コスト:</strong><span>最も高い — ただし必要な時のみ</span>
      <strong>バックエンド:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">ルーターが実際にどのように判断するか</h2>

<p class="section-subheading">公開されている多くのRAGルーターは、クエリを事前に複雑さで分類します。私たちのものは違います。<strong>学習型ルーティング</strong>を採用しており、成功したクエリはすべて、それに回答したバックエンドとともに保存され、新しいクエリは埋め込み類似度によってその履歴と照合されます。</p>

<div class="rr-mechanism">
<h3>ルックアップアルゴリズム — 各クエリで実行される処理</h3>
<ol>
  <li><strong>質問をハッシュ化</strong>します。SHA-256で計算し、16文字のキーに切り詰め、Cloudflare KV内の顧客ごとのルーティングストアで完全一致を検索します。過去に回答済みであれば、その時に最良だったバックエンドへ即座に振り分けます。</li>
  <li><strong>ミスした場合、質問を埋め込み</strong>、過去の質問埋め込みのキャッシュインデックスに対してコサイン検索を行います。最近傍の類似度が<strong>0.88</strong>を超えていれば、そのバックエンドへ振り分けます。</li>
  <li><strong>閾値以上の一致がない場合は、</strong>そのコーパスに対する顧客のデフォルトバックエンドにフォールバックします。</li>
  <li><strong>回答がレンダリングされた後、</strong>（質問ハッシュ、バックエンド、品質スコア）のタプルが顧客ごとのルーティング履歴ストアに書き戻され、将来のルックアップのための種データとなります。</li>
</ol>
<div class="rr-note">
  <strong>なぜ「分類」ではなく「学習」なのか？</strong> 経験的に、同じ形式のクエリでもコーパスによって挙動が異なります。法務契約書での「YにわたるXを比較」はTier 3のページインデックス走査を求めますが、フラットなFAQコーパス上での同じ形式はTier 1で十分です。クエリ構文から推測するのではなく、過去の実績からコーパスごとにその違いをルーティングモデルに学習させること — これが実際に出荷された設計上の選択です。
</div>
</div>

<h2 class="section-heading">現在ルーティング対象としている10のバックエンド</h2>

<p class="section-subheading">ルーターは10種類の名前付きバックエンドのいずれかへ振り分けます。そのうち3つは「Tier 3型」（階層的またはグラフ拡張型）です。残りはピュアベクトルエンジンで、運用上のトレードオフが異なるTier 1として扱われます。</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>階層的TOCツリー + エージェント型走査。Tier 3のアーキタイプ。</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>再帰的に要約された文書階層上のツリー走査型検索（ICLR 2024）。</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>ベクトル埋め込みと明示的なエンティティ／関係構造を組み合わせたグラフ拡張型検索。</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>フラットグラフのデュアルモード検索 — エンティティ検索とコミュニティ検索、香港大学のLightRAGアプローチ。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>高スループット・低レイテンシ検索のためのセルフホスト型dense-vectorエンジン。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>エッジ上のVectorize — Cloudflareのグローバルネットワークからp95でサブ300ms。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>既存の運用依存があるお客様向けのBYO Couchbaseベクトルストア。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Googleデータスタックを利用するお客様向けのGoogle Cloud Vertex AIベクトル検索。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>MongoDB上でドキュメントデータを運用するお客様向けのAtlas Vector Search。</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>超低レイテンシのインメモリ検索ワークロード向けのRedisベクトル検索。</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2（BM25 + dense fusion + cross-encoder reranker）は、現在ワークフローキャンバス上でコンポーザブルなノードとして提供されています。自動ルーターは、コーパスごとのルーティングデータが正当化するにつれ、次に同レイヤーを取り込みます。</em></p>

<h2 class="section-heading">APIサーフェス — 1つのエンドポイント、監査グレードの透明性</h2>

<p class="section-subheading">ルーターは呼び出し側からは見えません。リクエスト形式は1つで、レスポンスにはルーティング判断が含まれるため、どのバックエンドが回答したか（そしてその理由）を監査できます。</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># 1つのエンドポイント。ルーターがどのバックエンドを使用するか判断します。</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># レスポンス — エージェントが回答の根拠とするためのチャンク。</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// 振り分け先はtier-3のpage-index</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · またはフォールバック</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// ≥ 0.88の閾値</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// 再ベンチマークまでの鮮度ウィンドウ</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>現在、<code>routing</code>メタデータは内部でログ記録され、監査証跡を通じて参照可能です。レスポンスへのインライン配信は2026年Q3にかけて段階的に展開されます。</em></p>

<h2 class="section-heading">既存のルーターとの違い</h2>

<p class="section-subheading">RAGルーティングは新しいアイデアではありません。Adaptive-RAGやProbing-RAGなどの学術的ルーターは、既にクエリを複雑さで分類しています。差別化要因は、Divinciが1つのマネージドエンドポイントの背後で、お客様自身のトラフィックから学習しながら、<em>アーキテクチャ的に異なる検索スタック</em>間でルーティングする点にあります。</p>

<div class="rr-vs">
<table>
<thead><tr><th>提供サービス</th><th>ルーティング対象</th><th>ルーティング軸</th><th>マネージド？</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10バックエンド（PageIndex、RAPTOR、LightRAG、neo4j、6つのベクトルエンジン）</td><td>アーキテクチャ · 履歴から学習</td><td>はい — 単一エンドポイント</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>BYOリトリーバー</td><td>LLM／Pydanticセレクター</td><td>いいえ — 自前で組み立てるライブラリ</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>no-retrieval / single-step / iterative</td><td>深さ · クエリ複雑度の分類器</td><td>研究</td></tr>
<tr><td>Cloudflare AI Search (旧AutoRAG)</td><td>単一のハイブリッドパイプライン</td><td>ルーティングなし</td><td>はい</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>単一のハイブリッドパイプライン</td><td>ルーティングなし</td><td>はい</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>ハイブリッド + 別途エージェント型モード</td><td>ユーザーが手動でモード選択</td><td>はい</td></tr>
<tr><td>VectifyAI PageIndex</td><td>単一アーキテクチャ（階層的走査）</td><td>ルーティングなし</td><td>OSSスタンドアロン</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>私たちの提案における正直な弱点：</strong>クエリごとのRAGルーティングというコンセプト自体は新しくありません。私たちがルーティングを発明したわけではありません。本当の差別化要因は、(a)深さのバリエーションではなくアーキテクチャ的に異なるスタック間でルーティングすること、(b)PageIndex／RAPTOR／LightRAG型の階層的走査を別製品ではなくファーストクラスのバックエンドとして組み込んでいること、そして(c)自前で組み立てて運用するライブラリではなく1つのマネージドエンドポイントであること — この<em>組み合わせ</em>にあります。</p>

<h2 class="section-heading">ルーティング設定の種データはどのように投入されるか</h2>

<p class="section-subheading">ルーティングモデルは事前学習されていません — <em>お客様自身</em>のトラフィックから学習します。3種類のシグナルがルーティング履歴ストアに供給されます。</p>

<div class="rr-mechanism">
<ol>
  <li><strong>アリーナでの選択。</strong>クエリを<a href="/ja/rag-arena/">RAG Arena</a>を通じて複数のバックエンドで実行し、結果を並べてスコアリングし、勝者を選びます。（質問、勝利したバックエンド）のペアがルーティングストアに登録されます。</li>
  <li><strong>自動修正の出力。</strong>当社の自動修正機能が、取り込み時または定期監査の際に代表的なクエリで比較検索を実行すると、クエリごとに最も性能の高いバックエンドが同じストアに書き込まれます。</li>
  <li><strong>本番フィードバック。</strong>成功したクエリ（オンライン評価ゲートを通じて品質閾値を超えてスコアリングされたもの — <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">リグレッションテスト記事</a>を参照）は、リクエスト時に（質問ハッシュ、バックエンド）のペアをルーティングストアに書き戻し、コーパスの進化に応じてルーティングモデルが鮮度を保つよう30日間のTTLを設定します。</li>
</ol>
<div class="rr-note">
  <strong>実際の本番グレードとロードマップの境目：</strong> ステップ1と2は本日時点で出荷されています。ステップ3の自動フィードバックループは部分的に出荷されています — 成功したクエリは書き戻されますが、Tier 2（BM25 + RRF + reranker）は現在自動ルーティングではなくワークフローノードとして構成されています。ルーティングデータが明確な勝利条件を示し次第、Tier 2を自動ルーターに組み込みます。
</div>
</div>

<h2 class="section-heading">最も価値を発揮する場面</h2>

<p class="section-subheading">同質なコーパスで一様なクエリ形式しか扱わない場合、恩恵はわずかです — 手動で1つのバックエンドを選べば終わりです。本当の強みは、混在したコーパスと混在したクエリ形式にあります。</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">「標準契約書における不可抗力の定義は何か？」（Tier 1、300ms未満）と、「当社の47件のベンダー契約全体で、非標準の解約条項を含むのはどれで、そのパターンは何か？」（Tier 3、数秒のページインデックス走査）の両方を尋ねる法務チームは、どちらか一方のバックエンドを選びたくはありません。シンプルな質問は速くて安く返ってきてほしく、深い質問は多少コストがかかっても正しく返ってきてほしい — それも2つのスタックを運用することなく。</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">これこそが、アーキテクチャ的に異なるバックエンド間でルーティングする1つのマネージドエンドポイントがその価値を発揮するケースです。トラフィックが一様なら、不要です。トラフィックが混在しているなら — 実際のエンタープライズコーパスのほとんどがそうですが — 必要になります。</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>関連する詳細解説と隣接製品</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
アーキテクチャの詳細な解説はブログ記事<a href="/blog/future-of-rag-systems/">RAGシステムの未来：シンプルなドキュメント検索を超えて</a>でご覧いただけます。上記ステップ1を支えるアリーナは<a href="/ja/rag-arena/">RAG Arena &amp; Dynamic Routing</a>にあります。ルーティング判断は、プラットフォーム全体で利用しているリリースマニフェストパターンと同じ仕組みで監査アンカーされています — <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">規制業界におけるカスタムLMの検証とリリース</a>を参照してください。そして、検索品質をオンラインでどのように評価しているか（上記ステップ3に供給されるシグナル）を知りたい場合は、<a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">リグレッションテスト記事</a>から始めるのがおすすめです。
</p>
</div>
