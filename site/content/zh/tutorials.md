+++
title = "教程"
description = "Divinci AI 分步教程 — 发布您的第一个助手、构建知识库、在您的网站嵌入聊天、集成 SDK 与 CLI、运行 QA 测试套件,并为您的助手赋予语音。"
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
<h1>教程</h1>
<p class="subtitle">Divinci AI 平台实用的分步指南 — 从在控制台发布您的第一个助手,到交付开发者集成、QA 流水线和语音功能。</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>从这里开始</h2>
<p class="section-sub">无需编写代码。以下教程全程使用 Divinci 控制台完成。</p>

<div class="guide-block">
<h3>创建并发布您的第一个助手 <span class="level-badge level-beginner">入门</span></h3>
<p class="guide-intro">发布版本(Release)是 Divinci 打包助手的方式:您先配置一个草稿,然后发布;之后的每次改动都是从已发布版本分叉出的新草稿 — 因此您随时可以回滚。</p>
<ol>
<li>登录控制台,打开(或创建)一个工作区。</li>
<li>创建一个新的<strong>草稿发布版本</strong> — 草稿是私有的,可自由编辑。</li>
<li>选择驱动您助手的模型。</li>
<li>配置助手:系统指令、对话开场白,以及您想挂载的知识库。</li>
<li>在内置聊天中测试草稿,直到回答符合预期。</li>
<li><strong>发布</strong>该版本,让您的用户和集成即刻可用。</li>
<li>后续迭代时,将已发布版本分叉为新草稿,修改后再次发布 — 之前的版本始终保留可用。</li>
</ol>
<a href="/release-management/" class="card-link">进一步了解发布管理 &rarr;</a>
</div>

<div class="guide-block">
<h3>用您的文件构建知识库 <span class="level-badge level-beginner">入门</span></h3>
<p class="guide-intro">让助手立足于您自己的内容,基于您的文档作答,而不是凭空猜测。</p>
<ol>
<li>在您的工作区中,打开知识库板块并创建一个新的集合。</li>
<li>上传您的文档 — PDF、办公文档和文本文件均可。</li>
<li>等待索引完成;每份文档都会自动分块并生成向量。</li>
<li>将该集合挂载到一个草稿发布版本上。</li>
<li>向草稿提出一个只有您的文档才能回答的问题,确认检索正常后即可发布。</li>
</ol>
<div class="guide-note">除文件上传外,知识库还可以摄取原始文本、音频录音(自动转写)、产品目录,以及来自 Dropbox 的文件。</div>
</div>

<div class="guide-block">
<h3>通过 URL 抓取导入您的网站 <span class="level-badge level-beginner">入门</span></h3>
<p class="guide-intro">让 Divinci 指向您的网站,将其页面转化为助手知识 — 无需任何导出操作。</p>
<ol>
<li>在您的知识库中,选择添加网页来源。</li>
<li>输入一个 URL — 可以抓取单个页面,也可以从起始 URL 爬取整个站点。</li>
<li>爬取完成后,检查提取的内容分块,移除您不需要的部分。</li>
<li>将该集合挂载到您的发布版本上,并用您网站内容中的问题进行测试。</li>
</ol>
<div class="guide-note">爬取本身完成后,索引仍会在后台继续进行 — 超大型站点可能需要更长时间,所有页面才可被检索。</div>
</div>

<div class="guide-block">
<h3>在您的网站嵌入聊天组件 <span class="level-badge level-beginner">入门</span></h3>
<p class="guide-intro">发布版本上线后,只需一个 script 标签,即可在任意网站放置一个完全品牌化的聊天组件:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">该组件支持流式响应、展示 RAG 上下文,并支持白标定制 — 颜色、位置、对话开场白等均可配置。</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">嵌入组件文档 &rarr;</a>
</div>

<div class="guide-block">
<h3>让匿名访客在配额内聊天 <span class="level-badge level-intermediate">进阶</span></h3>
<p class="guide-intro">向没有账号的访客开放您的助手:他们验证电子邮箱、通过 Cloudflare Turnstile 校验,并在您设定的每日配额内聊天 — 让用量和滥用始终在您的掌控之中。</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">匿名访客聊天示例 &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>面向开发者</h2>
<p class="section-sub">使用 SDK、CLI 和 MCP 在平台上构建 — 完整指南请见 SDK 文档。</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">入门</span>
<h3>快速上手:用 Client SDK 实现流式聊天</h3>
<p>安装 <code>@divinci-ai/client</code>,完成身份验证,几分钟内即可在浏览器中流式获取您的第一条助手响应。</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">跟随快速上手指南 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">入门</span>
<h3>在终端中管理一切</h3>
<p>Divinci CLI 覆盖工作区、发布版本、知识库和聊天 — 可脚本化,适用于 CI/CD 和日常工作流。</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">CLI 概览 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">入门</span>
<h3>将 Claude 或 Cursor 连接到您的助手(MCP)</h3>
<p>在您的 AI 工具的连接器界面中添加 <code>https://mcp.divinci.app/mcp</code>,通过 OAuth 授权后,您助手的知识和工具即可在 Claude、Cursor 及其他 MCP 客户端中使用。</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">通过 MCP 连接 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">高级</span>
<h3>在 Cloudflare Workers 上部署带访问门槛的落地页聊天</h3>
<p>交付一个内置助手聊天的落地页,置于您自己的访问门槛之后,在 Cloudflare Workers 边缘节点运行。</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Cloudflare Workers 指南 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">高级</span>
<h3>将您的发布版本发布为独立 MCP 服务器</h3>
<p>把已发布的版本变成白标 MCP 服务器,让您的客户可以将其添加到他们自己的 AI 工具中。</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">白标 MCP 服务器 &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>质量与信任</h2>
<p class="section-sub">量化评估助手的回答,并掌控由哪些模型提供商来提供服务。</p>

<div class="guide-block">
<h3>用 QA 测试套件和 AutoFix 为助手打分 <span class="level-badge level-intermediate">进阶</span></h3>
<p class="guide-intro">QA 测试套件针对发布版本运行结构化测试并为回答打分,让质量有据可依 — 而非凭感觉假设。</p>
<ol>
<li>创建 QA 测试套件:可以自己编写测试用例,也可以基于知识库中的文件自动生成测试。</li>
<li>针对某个发布版本运行套件 — 草稿或已发布版本均可。</li>
<li>查看得分,了解助手哪些问题答得好、哪些还有差距。</li>
<li>应用 <strong>AutoFix</strong>,让 Divinci 针对失败项提出配置修改建议,然后重新运行套件确认效果提升。</li>
</ol>
<a href="/quality-assurance/" class="card-link">进一步了解质量保证 &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">Server SDK 中的 QA &rarr;</a>
</div>

<div class="guide-block">
<h3>使用您自己的模型密钥(BYOK) <span class="level-badge level-intermediate">进阶</span></h3>
<p class="guide-intro">使用您自己的提供商账户 — 您的速率限制、您的账单、您的数据协议 — 而不是 Divinci 的共享密钥。</p>
<ol>
<li>打开工作区设置,进入模型密钥页面。</li>
<li>为您的提供商添加 API 密钥(例如 OpenAI 或 Anthropic)。</li>
<li>在配置发布版本时选择您的密钥 — 该版本的模型调用将通过您的账户进行。</li>
<li>随时轮换或移除密钥;如果您移除自己的密钥,发布版本会自动回退到平台密钥。</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>语音</h2>
<p class="section-sub">助手不必只有文字。</p>

<div class="guide-block">
<h3>为您的助手赋予语音 <span class="level-badge level-intermediate">进阶</span></h3>
<p class="guide-intro">在发布版本上启用文本转语音,让回答可以朗读出来。</p>
<ol>
<li>打开发布版本配置,启用<strong>文本转语音</strong>。</li>
<li>从内置选项中选择一个语音(可选 Deepgram Aura 和 Cartesia 语音),或克隆自定义语音。</li>
<li>在控制台聊天中测试,然后发布 — 聊天组件和 SDK 各端即可朗读回答。</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>准备好开始构建了吗?</h2>
<p>免费创建您的第一个助手,或与我们聊聊您的使用场景。</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">申请演示</a>
<a href="/docs/" class="cta-secondary">开发者文档</a>
</div>
</section>
</div>
