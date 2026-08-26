+++
title = "RAG 라우팅 — 하나의 API, 여러 아키텍처"
description = "Divinci의 RAG 라우팅은 모든 쿼리를 정확히 답할 수 있는 가장 저렴한 백엔드로 보냅니다. 단일 엔드포인트 뒤에 10개 검색 엔진, 질문별 학습형 라우팅."
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
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">RAG 라우팅</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">하나의 API 엔드포인트, 열 개의 검색 아키텍처. 라우터는 과거 쿼리 트래픽으로부터 학습하여 새로 들어오는 모든 질문을 가장 정확히 답할 가능성이 높은 백엔드로 디스패치합니다 — 품질 기준은 충족하면서도 가장 낮은 비용으로요.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">문의하기</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">심층 분석 읽기 →</a>
  </p>
</section>

<h2 class="section-heading">세 가지 아키텍처, 개념적으로</h2>

<p class="section-subheading">대부분의 프로덕션 RAG 시스템은 하나의 검색 아키텍처를 배포하고 끝냅니다. 우리는 아키텍처적으로 서로 다른 스택들 사이에서 선택하는 라우터를 제공합니다 — 코퍼스 내 모든 쿼리에 동일한 선택이 최적인 경우는 거의 없기 때문입니다.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · 플랫 벡터 RAG</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">임베드 → 코사인 top-k<br>→ 컨텍스트 삽입<br>→ 생성</div>
    <h4>적합한 용도</h4>
    <p>단일 사실 조회, FAQ 형태의 쿼리, 평면 청크 코퍼스에서 "X가 무엇인가요?" 식의 질문.</p>
    <div class="rr-stats">
      <strong>지연 시간:</strong><span>&lt; 300 ms p95</span>
      <strong>비용:</strong><span>쿼리당 수 센트</span>
      <strong>백엔드:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · 하이브리드 + 재정렬</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ 생성</div>
    <h4>적합한 용도</h4>
    <p>어휘적 신호와 의미적 신호가 충돌하는 쿼리 — 코드, 이름, 약어, 기술 용어, 오류 문자열.</p>
    <div class="rr-stats">
      <strong>지연 시간:</strong><span>약 800 ms</span>
      <strong>비용:</strong><span>여전히 낮음</span>
      <strong>현재 상태:</strong><span>구성 가능한 워크플로 노드 · 자동 라우터 로드맵</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · Page-Index + 에이전트</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">수집 시 계층적 TOC 트리 구축<br>→ 에이전트가 트리를 탐색<br>→ 섹션을 열어 읽음<br>→ 생성</div>
    <h4>적합한 용도</h4>
    <p>구조화된 긴 문서의 멀티-홉 독해 — 법률 계약서, 재무 10-K, 컨텍스트가 인접하지 않은 섹션에 걸쳐 있는 기술 PDF.</p>
    <div class="rr-stats">
      <strong>지연 시간:</strong><span>수 초</span>
      <strong>비용:</strong><span>가장 높음 — 필요할 때만 사용</span>
      <strong>백엔드:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">라우터가 실제로 결정하는 방식</h2>

<p class="section-subheading">대부분의 공개된 RAG 라우터는 쿼리를 사전에 복잡도로 분류합니다. 우리는 그렇게 하지 않습니다. <strong>학습형 라우팅(learned routing)</strong>을 사용합니다 — 성공한 모든 쿼리는 답변한 백엔드와 함께 저장되며, 새 쿼리는 임베딩 유사도를 기준으로 그 이력과 매칭됩니다.</p>

<div class="rr-mechanism"><h3>조회 알고리즘 — 매 쿼리마다 실행되는 로직</h3>
<ol>
  <li><strong>질문을 해싱</strong>합니다 — SHA-256으로 해싱한 뒤 16자 키로 자르고, Cloudflare KV의 고객별 라우팅 저장소에서 동일한 사전 매치를 확인합니다. 이전에 답한 적이 있다면, 그때 가장 잘 수행한 백엔드로 즉시 디스패치합니다.</li>
  <li><strong>미스가 발생하면 질문을 임베드</strong>하여 캐시된 과거 질문 임베딩 인덱스에 대해 코사인 검색을 수행합니다. 최근접 이웃의 유사도가 <strong>0.88</strong>을 초과하면 연관된 백엔드로 디스패치합니다.</li>
  <li><strong>임계값을 넘는 매치가 없으면</strong> 해당 코퍼스에 대한 고객의 기본 백엔드로 폴백합니다.</li>
  <li><strong>답변이 렌더링된 후</strong>, (질문 해시, 백엔드, 품질 점수) 튜플이 고객별 라우팅 이력 저장소에 다시 기록되어 향후 조회의 시드가 됩니다.</li>
</ol>
<div class="rr-note">
  <strong>왜 "분류"가 아닌 "학습"인가?</strong> 실증적으로 같은 형태의 쿼리도 코퍼스마다 다르게 동작합니다. 법률 계약서에서 "Y에 걸쳐 X를 비교"하는 쿼리는 Tier 3 page-index 탐색을 원하지만, 평면 FAQ 코퍼스에서는 같은 형태의 쿼리도 Tier 1으로 충분합니다. 쿼리 구문에서 추측하는 대신, 코퍼스별 과거 증거로부터 라우팅 모델이 그 차이를 학습하도록 하는 것 — 그것이 실제로 출시된 설계 선택입니다.
</div>
</div>

<h2 class="section-heading">현재 라우팅 대상인 열 개의 백엔드</h2>

<p class="section-subheading">라우터는 명명된 열 개의 백엔드 중 하나로 디스패치합니다. 그중 세 개는 "Tier 3 형태"(계층적 또는 그래프 강화형)이고, 나머지는 운영상의 트레이드오프가 다른 순수 벡터 엔진으로 Tier 1으로 취급합니다.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>계층적 TOC 트리 + 에이전트형 탐색. Tier 3의 원형.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>재귀적으로 요약된 문서 계층에 대한 트리 탐색 검색 (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="Neo4j logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>벡터 임베딩과 명시적 엔티티/관계 구조를 결합한 그래프 강화형 검색.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>평면 그래프 듀얼 모드 검색 — 엔티티 + 커뮤니티 검색, HKU LightRAG 접근법.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="Qdrant logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>고처리량, 저지연 조회를 위한 자체 호스팅 dense-vector 엔진.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="Cloudflare logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>엣지의 Vectorize — Cloudflare 글로벌 네트워크에서 sub-300 ms p95.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="Couchbase logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>기존 운영 의존성을 가진 고객을 위한 BYO Couchbase 벡터 스토어.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="Google Cloud logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Google 데이터 스택을 사용하는 고객을 위한 Google Cloud Vertex AI 벡터 검색.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="MongoDB logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>MongoDB에서 문서 데이터를 운영하는 고객을 위한 Atlas Vector Search.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="Redis logo" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>초저지연 인메모리 검색 워크로드를 위한 Redis 벡터 검색.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2(BM25 + dense fusion + cross-encoder reranker)는 오늘 우리 워크플로 캔버스에서 구성 가능한 노드로 제공됩니다. 자동 라우터는 코퍼스별 라우팅 데이터가 이를 정당화하는 시점에 다음 대상으로 삼습니다.</em></p>

<h2 class="section-heading">API 표면 — 하나의 엔드포인트, 감사 등급의 투명성</h2>

<p class="section-subheading">라우터는 호출자에게 보이지 않습니다. 단일 요청 형태이며, 응답에는 라우팅 결정이 포함되어 어느 백엔드가 답했는지(그리고 왜인지)를 감사할 수 있습니다.</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># 하나의 엔드포인트. 라우터가 사용할 백엔드를 결정합니다.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># 응답 — 에이전트가 답변의 근거로 삼는 청크.</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// 디스패치된 tier-3 page-index</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · 또는 폴백</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// ≥ 0.88 임계값</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// 재벤치마크 전 신선도 윈도우</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em><code>routing</code> 메타데이터는 현재 내부적으로 로깅되며 감사 추적을 통해 노출됩니다. 인라인 응답 전달은 2026년 3분기 동안 순차 출시됩니다.</em></p>

<h2 class="section-heading">기존 라우터와 어떻게 다른가</h2>

<p class="section-subheading">RAG 라우팅은 새로운 아이디어가 아닙니다 — Adaptive-RAG, Probing-RAG 같은 학계의 라우터들은 이미 쿼리를 복잡도로 분류합니다. 차별점은 Divinci가 <em>아키텍처적으로 서로 다른 검색 스택들</em> 사이를 라우팅하고, 그것을 자체 트래픽으로부터 학습하며, 하나의 관리형 엔드포인트 뒤에 제공한다는 점입니다.</p>

<div class="rr-vs">
<table>
<thead><tr><th>제품</th><th>무엇 사이를 라우팅하는가</th><th>라우팅 축</th><th>관리형 여부</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10개 백엔드 (PageIndex, RAPTOR, LightRAG, neo4j, 6개 벡터 엔진)</td><td>아키텍처 · 이력으로부터 학습</td><td>예 — 단일 엔드포인트</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>BYO 리트리버</td><td>LLM/Pydantic 셀렉터</td><td>아니오 — 조립해 쓰는 라이브러리</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>비검색 / 단일 단계 / 반복</td><td>깊이 · 쿼리 복잡도 분류기</td><td>연구</td></tr>
<tr><td>Cloudflare AI Search (구 AutoRAG)</td><td>하나의 하이브리드 파이프라인</td><td>라우팅 없음</td><td>예</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>하나의 하이브리드 파이프라인</td><td>라우팅 없음</td><td>예</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>하이브리드 + 별도 에이전트 모드</td><td>사용자가 수동으로 모드 선택</td><td>예</td></tr>
<tr><td>VectifyAI PageIndex</td><td>단일 아키텍처 (계층적 탐색)</td><td>라우팅 없음</td><td>OSS 독립 실행</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>우리 피치의 솔직한 약점:</strong> 쿼리별 RAG 라우팅이라는 개념 자체는 새롭지 않습니다. 우리가 라우팅을 발명한 것은 아닙니다. 진정한 차별점은 (a) 깊이 변형이 아니라 아키텍처적으로 서로 다른 스택들 사이를 라우팅한다는 점, (b) PageIndex / RAPTOR / LightRAG 스타일의 계층적 탐색을 별개의 제품이 아닌 일등 백엔드로 포함한다는 점, (c) 직접 조립·운영해야 하는 라이브러리가 아닌 하나의 관리형 엔드포인트로 제공한다는 점 — 이 <em>조합</em>에 있습니다.</p>

<h2 class="section-heading">라우팅 선호도가 시드되는 방식</h2>

<p class="section-subheading">당신의 라우팅 모델은 사전 학습되어 있지 않습니다 — <em>당신의</em> 트래픽으로부터 학습합니다. 세 가지 신호가 라우팅 이력 저장소에 공급됩니다.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>아레나 선택.</strong> <a href="/ko/rag-arena/">RAG Arena</a>를 통해 여러 백엔드에 쿼리를 실행하고, 변형들을 나란히 평가한 뒤 승자를 선택합니다. (질문, 승리 백엔드) 쌍이 라우팅 저장소에 기록됩니다.</li>
  <li><strong>오토픽스 출력.</strong> 수집 또는 정기 감사 중에 오토픽스가 대표 쿼리들에 대해 비교 검색을 실행하면, 쿼리별 최고 성능 백엔드가 같은 저장소에 기록됩니다.</li>
  <li><strong>프로덕션 피드백.</strong> 성공한 쿼리들(우리의 온라인 평가 게이트를 통해 품질 임계값 이상을 기록한 것 — <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">회귀 테스트 글</a> 참고)은 요청 시점에 (질문 해시, 백엔드) 쌍을 라우팅 저장소에 다시 기록하며, 30일 TTL을 적용해 코퍼스가 진화함에 따라 라우팅 모델이 최신 상태를 유지하도록 합니다.</li>
</ol>
<div class="rr-note">
  <strong>어디까지 실제로 프로덕션 등급이고 어디서부터 로드맵인가:</strong> 1단계와 2단계는 오늘 출시되어 있습니다. 3단계의 자동 피드백 루프는 부분적으로 출시된 상태입니다 — 성공한 쿼리는 다시 기록되지만, Tier 2(BM25 + RRF + reranker)는 현재 자동 라우팅이 아닌 워크플로 노드로 구성됩니다. 라우팅 데이터가 명확한 승리 조건을 보일 때 Tier 2를 자동 라우터에 통합할 예정입니다.
</div>
</div>

<h2 class="section-heading">이것이 가장 중요해지는 순간</h2>

<p class="section-subheading">동질적인 코퍼스에 균일한 쿼리 형태가 들어오는 환경에서는 이점이 거의 없습니다 — 백엔드 하나를 수동으로 선택하면 끝입니다. 진가는 혼합 코퍼스와 혼합 쿼리 형태에서 드러납니다.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">"표준 계약서에서 불가항력의 정의는 무엇인가요?"(Tier 1, sub-300 ms)와 "47개의 벤더 계약 전체에서, 비표준 종료 조항이 있는 것은 무엇이며 그 패턴은 어떤가요?"(Tier 3, 수 초의 page-index 탐색)를 모두 묻는 법무 팀은 하나의 백엔드만 고르고 싶지 않습니다. 그들은 간단한 질문이 빠르고 저렴하게 돌아오고, 깊은 질문은 비용이 더 들더라도 정확히 돌아오기를 원합니다 — 두 개의 스택을 운영하지 않고서요.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">바로 그 지점이 아키텍처적으로 서로 다른 백엔드들 사이를 라우팅하는 단일 관리형 엔드포인트가 제 값을 하는 사례입니다. 트래픽이 균일하다면 필요하지 않습니다. 트래픽이 혼합되어 있다면 — 대부분의 실제 엔터프라이즈 코퍼스가 그렇습니다 — 필요합니다.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>심층 자료와 인접 제품</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
아키텍처 심층 분석은 블로그 글 <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>에 있습니다. 위의 1단계를 구동하는 아레나는 <a href="/ko/rag-arena/">RAG Arena &amp; Dynamic Routing</a>에 있습니다. 라우팅 결정은 우리가 플랫폼 전반에 사용하는 동일한 릴리스 매니페스트 패턴을 통해 감사 시점에 고정됩니다 — <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>를 참고하세요. 그리고 위의 3단계에 공급되는 신호인 검색 품질을 우리가 어떻게 온라인에서 평가하는지 알고 싶다면, <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">회귀 테스트 글</a>부터 시작하세요.
</p>
</div>
