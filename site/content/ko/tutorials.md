+++
title = "튜토리얼"
description = "Divinci AI 단계별 튜토리얼 — 첫 어시스턴트 게시, 지식 베이스 구축, 사이트에 채팅 임베드, SDK 및 CLI 통합, QA 스위트 실행, 어시스턴트에 음성 부여까지."
template = "feature.html"
+++

<style>
/* Page-specific Leonardo journal background */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-api.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

.feature-page .tutorials-hero,
.feature-page .tutorials-section {
    margin-left: auto !important;
    margin-right: auto !important;
}

/* Hero */
.tutorials-hero {
    text-align: center;
    padding: 5rem 2rem 3rem;
    max-width: 900px;
    margin: 0 auto;
}

.tutorials-hero h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(2.25rem, 4vw, 3.25rem);
    color: var(--color-neutral-primary);
    margin-bottom: 1rem;
    line-height: 1.15;
}

.tutorials-hero .subtitle {
    font-size: 1.15rem;
    color: var(--color-neutral-secondary);
    line-height: 1.7;
    max-width: 700px;
    margin: 0 auto;
}

/* Sections */
.tutorials-section {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem 2rem;
}

.tutorials-section h2 {
    font-family: 'Fraunces', serif;
    font-size: var(--text-h2);
    color: var(--color-neutral-primary);
    margin-bottom: 0.75rem;
}

.tutorials-section .section-sub {
    color: var(--color-neutral-secondary);
    font-size: 1.05rem;
    margin-bottom: 2rem;
    max-width: 700px;
}

/* Difficulty badges */
.level-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    vertical-align: middle;
}

.level-beginner {
    background: rgba(61, 107, 79, 0.1);
    color: var(--color-accent-tertiary, #3d6b4f);
}

.level-intermediate {
    background: rgba(196, 148, 58, 0.14);
    color: #8a6519;
}

.level-advanced {
    background: rgba(140, 82, 60, 0.12);
    color: #8c523c;
}

/* Guide blocks (inline step-by-step walkthroughs) */
.guide-block {
    background: var(--color-bg-primary, #f8f4f0);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 2rem;
    margin-bottom: 1.5rem;
}

.guide-block h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.3rem;
    color: var(--color-neutral-primary);
    margin: 0 0 0.35rem;
}

.guide-block .guide-intro {
    color: var(--color-neutral-secondary);
    font-size: 0.95rem;
    line-height: 1.65;
    margin: 0.5rem 0 1rem;
}

.guide-block ol {
    margin: 0 0 1rem;
    padding-left: 1.4rem;
}

.guide-block ol li {
    color: var(--color-neutral-primary);
    font-size: 0.95rem;
    line-height: 1.7;
    margin-bottom: 0.5rem;
}

.guide-block .guide-note {
    color: var(--color-neutral-secondary);
    font-size: 0.88rem;
    line-height: 1.6;
    background: rgba(232, 221, 199, 0.35);
    border-left: 3px solid var(--color-border-medium);
    padding: 0.6rem 1rem;
    border-radius: 0 6px 6px 0;
    margin-bottom: 1rem;
}

.guide-block .card-link,
.tutorial-card .card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-neutral-inverse);
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
}

.guide-block .card-link:hover,
.tutorial-card .card-link:hover {
    text-decoration: underline;
}

.guide-block .card-link + .card-link {
    margin-left: 1.25rem;
}

/* Tutorial cards grid (link-out tutorials) */
.tutorial-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
}

.tutorial-card {
    background: var(--color-bg-primary, #f8f4f0);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 1.75rem;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
}

.tutorial-card:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
}

.tutorial-card h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    color: var(--color-neutral-primary);
    margin: 0.5rem 0 0.5rem;
}

.tutorial-card p {
    color: var(--color-neutral-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    flex-grow: 1;
}

.snippet {
    background: var(--color-neutral-dark, #1e3a2b);
    color: rgba(255,255,255,0.9);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-family: 'Source Code Pro', 'Courier New', monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    margin: 0.75rem 0 1rem;
    overflow-x: auto;
    white-space: pre;
}

/* Responsive */
@media (max-width: 1024px) {
    .tutorial-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .tutorial-grid { grid-template-columns: 1fr; }
    .guide-block { padding: 1.5rem; }
}
</style>

<!-- Hero -->
<div class="tutorials-hero">
<h1>튜토리얼</h1>
<p class="subtitle">Divinci AI 플랫폼을 위한 실용적인 단계별 가이드 — 대시보드에서 첫 어시스턴트를 게시하는 것부터 개발자 통합, QA 파이프라인, 음성 기능 출시까지.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>여기서 시작하세요</h2>
<p class="section-sub">코드가 필요 없습니다. 이 워크스루는 처음부터 끝까지 Divinci 대시보드만 사용합니다.</p>

<div class="guide-block">
<h3>첫 어시스턴트 만들고 게시하기 <span class="level-badge level-beginner">초급</span></h3>
<p class="guide-intro">Release는 Divinci가 어시스턴트를 패키징하는 방식입니다. 드래프트를 구성하고 게시하면, 이후의 모든 변경은 게시된 버전에서 포크된 새 드래프트가 됩니다 — 언제든 롤백할 수 있습니다.</p>
<ol>
<li>대시보드에 로그인하고 워크스페이스를 열거나 새로 만드세요.</li>
<li>새 <strong>드래프트 Release</strong>를 만드세요 — 드래프트는 비공개이며 자유롭게 편집할 수 있습니다.</li>
<li>어시스턴트를 구동할 모델을 선택하세요.</li>
<li>어시스턴트를 구성하세요: 시스템 지시문, 대화 시작 문구, 연결할 지식 베이스를 설정합니다.</li>
<li>내장 채팅에서 응답이 만족스러울 때까지 드래프트를 테스트하세요.</li>
<li>Release를 <strong>게시</strong>하여 사용자와 통합에 실제로 제공하세요.</li>
<li>이후 반복 개선할 때는 게시된 Release를 새 드래프트로 포크하고, 수정한 뒤 다시 게시하세요 — 이전 버전은 그대로 유지됩니다.</li>
</ol>
<a href="/release-management/" class="card-link">Release 관리 자세히 알아보기 &rarr;</a>
</div>

<div class="guide-block">
<h3>내 파일로 지식 베이스 구축하기 <span class="level-badge level-beginner">초급</span></h3>
<p class="guide-intro">어시스턴트를 여러분의 콘텐츠에 기반하도록 만들어, 추측이 아닌 여러분의 문서에서 답변하게 하세요.</p>
<ol>
<li>워크스페이스에서 지식 베이스 섹션을 열고 새 컬렉션을 만드세요.</li>
<li>문서를 업로드하세요 — PDF, 오피스 문서, 텍스트 파일 모두 지원됩니다.</li>
<li>인덱싱이 완료될 때까지 기다리세요. 각 문서는 자동으로 청크 분할되고 임베딩됩니다.</li>
<li>컬렉션을 드래프트 Release에 연결하세요.</li>
<li>여러분의 문서만 답할 수 있는 질문을 드래프트에 물어 검색이 잘 작동하는지 확인한 뒤 게시하세요.</li>
</ol>
<div class="guide-note">파일 업로드 외에도 지식 베이스는 원시 텍스트, 오디오 녹음(자동 전사), 제품 카탈로그, Dropbox 파일을 수집할 수 있습니다.</div>
</div>

<div class="guide-block">
<h3>URL 크롤링으로 웹사이트 수집하기 <span class="level-badge level-beginner">초급</span></h3>
<p class="guide-intro">Divinci에 웹사이트를 지정하면 페이지들이 어시스턴트의 지식으로 변환됩니다 — 별도의 내보내기가 필요 없습니다.</p>
<ol>
<li>지식 베이스에서 웹 소스 추가를 선택하세요.</li>
<li>URL을 입력하세요 — 단일 페이지를 스크래핑하거나, 시작 URL부터 사이트 전체를 크롤링할 수 있습니다.</li>
<li>크롤링이 완료되면 추출된 청크를 검토하고 원치 않는 내용은 제거하세요.</li>
<li>컬렉션을 Release에 연결하고 사이트 콘텐츠에 관한 질문으로 테스트하세요.</li>
</ol>
<div class="guide-note">크롤링 자체가 끝난 뒤에도 인덱싱은 백그라운드에서 계속됩니다 — 매우 큰 사이트는 모든 페이지가 검색 가능해지기까지 시간이 조금 더 걸릴 수 있습니다.</div>
</div>

<div class="guide-block">
<h3>내 사이트에 채팅 위젯 임베드하기 <span class="level-badge level-beginner">초급</span></h3>
<p class="guide-intro">Release가 게시되면 스크립트 태그 하나로 어떤 웹사이트에든 완전히 브랜딩된 채팅 위젯을 넣을 수 있습니다:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">위젯은 응답을 스트리밍하고, RAG 컨텍스트를 표시하며, 화이트라벨 커스터마이징을 지원합니다 — 색상, 위치, 대화 시작 문구 등.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">임베드 위젯 문서 &rarr;</a>
</div>

<div class="guide-block">
<h3>익명 방문자에게 쿼터 기반 채팅 허용하기 <span class="level-badge level-intermediate">중급</span></h3>
<p class="guide-intro">계정이 없는 방문자에게도 어시스턴트를 개방하세요. 방문자는 이메일 주소를 인증하고 Cloudflare Turnstile 검사를 통과한 뒤, 여러분이 설정한 일일 쿼터 안에서 채팅합니다 — 사용량과 남용을 항상 통제할 수 있습니다.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">익명 방문자 채팅 예제 &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>개발자를 위한 가이드</h2>
<p class="section-sub">SDK, CLI, MCP로 플랫폼 위에 구축하세요 — 전체 가이드는 SDK 문서에 있습니다.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">초급</span>
<h3>퀵스타트: Client SDK로 스트리밍 채팅</h3>
<p><code>@divinci-ai/client</code>를 설치하고 인증한 뒤, 몇 분 만에 브라우저에서 첫 어시스턴트 응답을 스트리밍하세요.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">퀵스타트 따라하기 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">초급</span>
<h3>터미널에서 모든 것 관리하기</h3>
<p>Divinci CLI는 워크스페이스, Release, 지식 베이스, 채팅을 모두 다룹니다 — CI/CD와 일상 워크플로우 모두에서 스크립트로 활용할 수 있습니다.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">CLI 개요 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">초급</span>
<h3>Claude 또는 Cursor를 어시스턴트에 연결하기 (MCP)</h3>
<p>AI 도구의 커넥터 UI에 <code>https://mcp.divinci.app/mcp</code>를 추가하고 OAuth로 인증하면, 어시스턴트의 지식과 도구를 Claude, Cursor 및 다른 MCP 클라이언트 안에서 바로 사용할 수 있습니다.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">MCP로 연결하기 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">고급</span>
<h3>Cloudflare Workers에 게이트형 랜딩 페이지 채팅 배포하기</h3>
<p>자체 게이트 뒤에 어시스턴트 채팅이 내장된 랜딩 페이지를 Cloudflare Workers 엣지에서 실행하세요.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Cloudflare Workers 가이드 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">고급</span>
<h3>Release를 독립 MCP 서버로 게시하기</h3>
<p>게시된 Release를 화이트라벨 MCP 서버로 전환하여, 고객이 자신의 AI 도구에 직접 추가할 수 있게 하세요.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">화이트라벨 MCP 서버 &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>품질과 신뢰</h2>
<p class="section-sub">어시스턴트의 답변을 측정하고, 답변을 제공하는 모델 프로바이더를 직접 제어하세요.</p>

<div class="guide-block">
<h3>QA 스위트와 AutoFix로 어시스턴트 채점하기 <span class="level-badge level-intermediate">중급</span></h3>
<p class="guide-intro">QA 스위트는 Release를 대상으로 구조화된 테스트를 실행하고 답변을 채점합니다 — 품질을 가정하지 않고 측정합니다.</p>
<ol>
<li>테스트 케이스를 직접 작성하거나, 지식 베이스의 파일에서 테스트를 자동 생성하여 QA 스위트를 만드세요.</li>
<li>드래프트든 게시본이든 Release를 대상으로 스위트를 실행하세요.</li>
<li>점수를 검토하여 어시스턴트가 잘 처리한 질문과 부족했던 부분을 확인하세요.</li>
<li><strong>AutoFix</strong>를 적용하면 Divinci가 실패를 해결하는 구성 변경을 제안합니다. 스위트를 다시 실행해 개선을 확인하세요.</li>
</ol>
<a href="/quality-assurance/" class="card-link">품질 보증 자세히 알아보기 &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">Server SDK의 QA &rarr;</a>
</div>

<div class="guide-block">
<h3>자체 모델 키 사용하기 (BYOK) <span class="level-badge level-intermediate">중급</span></h3>
<p class="guide-intro">Divinci의 공용 키 대신 자체 프로바이더 계정을 사용하세요 — 여러분의 요청 한도, 여러분의 청구, 여러분의 데이터 계약으로.</p>
<ol>
<li>워크스페이스 설정을 열고 모델 키로 이동하세요.</li>
<li>프로바이더(예: OpenAI 또는 Anthropic)의 API 키를 추가하세요.</li>
<li>Release를 구성할 때 여러분의 키를 선택하세요 — 해당 Release의 모델 호출은 이제 여러분의 계정을 통해 실행됩니다.</li>
<li>키는 언제든 교체하거나 제거할 수 있습니다. 키를 제거하면 Release는 플랫폼 키로 대체됩니다.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>음성</h2>
<p class="section-sub">어시스턴트가 텍스트에만 머물 필요는 없습니다.</p>

<div class="guide-block">
<h3>어시스턴트에 음성 부여하기 <span class="level-badge level-intermediate">중급</span></h3>
<p class="guide-intro">Release에 텍스트 음성 변환을 활성화하여 응답을 소리 내어 읽어주게 하세요.</p>
<ol>
<li>Release 구성을 열고 <strong>텍스트 음성 변환(TTS)</strong>을 활성화하세요.</li>
<li>내장 옵션에서 목소리를 선택하거나(Deepgram Aura 및 Cartesia 목소리 제공), 커스텀 목소리를 클로닝하세요.</li>
<li>대시보드 채팅에서 테스트한 뒤 게시하세요 — 위젯과 SDK 화면에서 이제 응답을 음성으로 들려줄 수 있습니다.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>시작할 준비가 되셨나요?</h2>
<p>첫 어시스턴트를 무료로 만들거나, 여러분의 사용 사례에 대해 상담해 보세요.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">데모 요청하기</a>
<a href="/docs/" class="cta-secondary">개발자 문서</a>
</div>
</section>
</div>
