+++
title = "Developer Tools & API | Divinci AI"
description = "Comprehensive developer documentation for Divinci AI — CLI, Server SDK, Client SDK, MCP SDK, Embed Client, and REST API reference."
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

/* Center all content sections within feature-page */
.feature-page .docs-hero,
.feature-page .sdk-chooser,
.feature-page .docs-section {
    margin-left: auto !important;
    margin-right: auto !important;
}

/* Docs page hero */
.docs-hero {
    text-align: center;
    padding: 5rem 2rem 3rem;
    max-width: 900px;
    margin: 0 auto;
}

.docs-hero h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(2.25rem, 4vw, 3.25rem);
    color: var(--color-neutral-primary);
    margin-bottom: 1rem;
    line-height: 1.15;
}

.docs-hero .subtitle {
    font-size: 1.15rem;
    color: var(--color-neutral-secondary);
    line-height: 1.7;
    max-width: 700px;
    margin: 0 auto 2.5rem;
}

.docs-hero .hero-links {
    display: flex;
    gap: 1rem;
    justify-content: center;
    flex-wrap: wrap;
}

.docs-hero .hero-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
    font-size: 0.95rem;
    transition: all 0.2s ease;
}

.docs-hero .link-primary {
    background: var(--color-neutral-inverse);
    color: white !important;
}

.docs-hero .link-primary:hover {
    background: var(--color-btn-primary-hover);
    transform: translateY(-1px);
}

.docs-hero .link-secondary {
    background: transparent;
    color: var(--color-neutral-primary) !important;
    border: 1.5px solid var(--color-border-medium);
}

.docs-hero .link-secondary:hover {
    border-color: var(--color-neutral-inverse);
    background: rgba(45, 90, 79, 0.05);
}

/* SDK chooser section */
.sdk-chooser {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 2rem var(--section-spacing);
}

.sdk-chooser h2 {
    font-family: 'Fraunces', serif;
    font-size: var(--text-h2);
    color: var(--color-neutral-primary);
    text-align: center;
    margin-bottom: 0.75rem;
}

.sdk-chooser .section-sub {
    text-align: center;
    color: var(--color-neutral-secondary);
    font-size: 1.05rem;
    margin-bottom: 2.5rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

/* Tool cards grid */
.tool-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
}

.tool-card {
    background: var(--color-surface-light);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 2rem;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
}

.tool-card:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
}

.tool-card-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
}

.tool-card-icon {
    width: 40px;
    height: 40px;
    background: rgba(61, 107, 79, 0.08);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-accent-tertiary);
    font-size: 1.1rem;
    flex-shrink: 0;
}

.tool-card h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.15rem;
    color: var(--color-neutral-primary);
    margin: 0;
}

.tool-card .pkg-name {
    font-family: 'Source Code Pro', monospace;
    font-size: 0.8rem;
    color: var(--color-accent-tertiary);
    background: rgba(61, 107, 79, 0.06);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    display: inline-block;
    margin-bottom: 0.75rem;
}

.tool-card p {
    color: var(--color-neutral-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    flex-grow: 1;
}

.tool-card .install-cmd {
    background: var(--color-neutral-dark, #1e3a2b);
    color: rgba(255,255,255,0.9);
    padding: 0.6rem 1rem;
    border-radius: 6px;
    font-family: 'Source Code Pro', monospace;
    font-size: 0.82rem;
    margin-bottom: 1rem;
    overflow-x: auto;
}

.tool-card .card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-neutral-inverse);
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
    margin-top: auto;
}

.tool-card .card-link:hover {
    text-decoration: underline;
}

/* Code example sections */
.docs-section {
    max-width: 1100px;
    margin: 0 auto;
    padding: var(--section-spacing) 2rem;
}

.docs-section h2 {
    font-family: 'Fraunces', serif;
    font-size: var(--text-h2);
    color: var(--color-neutral-primary);
    margin-bottom: 0.75rem;
}

.docs-section .section-sub {
    color: var(--color-neutral-secondary);
    font-size: 1.05rem;
    margin-bottom: 2rem;
    max-width: 700px;
}

.code-block {
    background: var(--color-neutral-dark, #1e3a2b);
    border-radius: var(--radius-medium);
    padding: 1.5rem 2rem;
    margin-bottom: 1.5rem;
    overflow-x: auto;
    position: relative;
}

.code-block .code-label {
    position: absolute;
    top: 0.6rem;
    right: 1rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255,255,255,0.4);
    font-weight: 600;
}

.code-block pre,
.code-block pre *,
.code-block code,
.code-block code * {
    margin: 0;
    color: rgba(255,255,255,0.88) !important;
    font-family: 'Source Code Pro', 'Courier New', monospace !important;
    font-size: 0.88rem !important;
    line-height: 1.6;
    white-space: pre;
    text-shadow: none !important;
    background: none !important;
    -webkit-text-fill-color: rgba(255,255,255,0.88) !important;
}

/* Also override on the code-block div itself for bare text */
.code-block {
    color: rgba(255,255,255,0.88) !important;
    -webkit-text-fill-color: rgba(255,255,255,0.88) !important;
}

.code-block .comment { color: rgba(255,255,255,0.4) !important; }
.code-block .keyword { color: #b8d4a0 !important; }
.code-block .string { color: #e8c88a !important; }
.code-block .func { color: #8cc4d4 !important; }

/* Auth card code blocks */
.auth-card .code-block pre,
.auth-card .code-block pre span {
    color: rgba(255,255,255,0.88) !important;
    text-shadow: none !important;
}

/* Comparison table */
.comparison-table {
    width: 100%;
    border-collapse: collapse;
    margin: 2rem 0;
    font-size: 0.9rem;
}

.comparison-table th {
    background: var(--color-bg-accent);
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 700;
    color: var(--color-neutral-primary);
    border-bottom: 2px solid var(--color-border-medium);
    font-family: 'Fraunces', serif;
}

.comparison-table td {
    padding: 0.65rem 1rem;
    border-bottom: 1px solid var(--color-border-light);
    color: var(--color-neutral-primary);
}

.comparison-table tr:hover {
    background: rgba(232, 221, 199, 0.15);
}

.check { color: var(--color-accent-tertiary); font-weight: 700; }
.dash { color: var(--color-neutral-secondary); }

/* Auth section */
.auth-methods {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    margin-top: 1.5rem;
}

.auth-card {
    background: var(--color-surface-light);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 1.5rem;
}

.auth-card h4 {
    font-family: 'Fraunces', serif;
    font-size: 1rem;
    color: var(--color-neutral-primary);
    margin-bottom: 0.5rem;
}

.auth-card p {
    color: var(--color-neutral-secondary);
    font-size: 0.88rem;
    line-height: 1.5;
    margin-bottom: 0.75rem;
}

/* API reference section */
.endpoint-card {
    background: var(--color-surface-light);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 1.5rem 2rem;
    margin-bottom: 1rem;
}

.endpoint-card .method {
    display: inline-block;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-family: 'Source Code Pro', monospace;
    font-size: 0.8rem;
    font-weight: 700;
    margin-right: 0.5rem;
}

.method-get { background: rgba(61, 107, 79, 0.1); color: var(--color-accent-tertiary); }
.method-post { background: rgba(184, 160, 128, 0.15); color: var(--color-accent-secondary); }
.method-put { background: rgba(45, 90, 79, 0.1); color: var(--color-neutral-inverse); }
.method-del { background: rgba(180, 80, 80, 0.1); color: #b45050; }

.endpoint-card .path {
    font-family: 'Source Code Pro', monospace;
    font-size: 0.9rem;
    color: var(--color-neutral-primary);
}

.endpoint-card .desc {
    color: var(--color-neutral-secondary);
    font-size: 0.88rem;
    margin-top: 0.5rem;
}

/* Responsive */
@media (max-width: 768px) {
    .tool-grid { grid-template-columns: 1fr; }
    .auth-methods { grid-template-columns: 1fr; }
}

@media (max-width: 1024px) {
    .tool-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>

<!-- Hero -->
<div class="docs-hero">
<h1>Developer Tools & API</h1>
<p class="subtitle">Everything you need to integrate Divinci AI into your applications. SDKs for every platform, a powerful CLI, and comprehensive REST API access.</p>
<div class="hero-links">
<a href="https://sdk.divinci.app" class="link-primary" target="_blank">SDK Documentation</a>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="link-secondary" target="_blank">Get API Keys</a>
</div>
</div>

<!-- SDK Chooser -->
<section class="sdk-chooser">
<h2>Choose Your Tool</h2>
<p class="section-sub">Pick the right integration for your use case — from terminal workflows to browser chat widgets.</p>

<div class="tool-grid">

<div class="tool-card" id="cli-reference">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg></div>
<h3>Divinci CLI</h3>
</div>
<div class="pkg-name">@divinci-ai/cli</div>
<p>Manage workspaces, chat with AI, search knowledge bases, and control releases from your terminal. Supports profiles, scripting, and CI/CD.</p>
<div class="install-cmd">npm install -g @divinci-ai/cli</div>
<a href="#cli-reference" class="card-link">View reference &rarr;</a>
</div>

<div class="tool-card" id="server-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
<h3>Server SDK</h3>
</div>
<div class="pkg-name">@divinci-ai/server</div>
<p>Full Node.js platform access — workspaces, releases, RAG operations, API key management, and x402 blockchain payments.</p>
<div class="install-cmd">npm install @divinci-ai/server</div>
<a href="#server-sdk" class="card-link">View reference &rarr;</a>
</div>

<div class="tool-card" id="client-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
<h3>Client SDK</h3>
</div>
<div class="pkg-name">@divinci-ai/client</div>
<p>Browser SDK for headless chat integration. Streaming responses, RAG context bubbles, thread management, and external user auth.</p>
<div class="install-cmd">npm install @divinci-ai/client</div>
<a href="#client-sdk" class="card-link">View reference &rarr;</a>
</div>

<div class="tool-card" id="mcp-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
<h3>MCP SDK</h3>
</div>
<div class="pkg-name">@divinci-ai/mcp</div>
<p>Model Context Protocol integration for Claude Desktop, Cursor, and other AI assistants. SSE transport, tool invocation, and x402 payments.</p>
<div class="install-cmd">npm install @divinci-ai/mcp</div>
<a href="#mcp-sdk" class="card-link">View reference &rarr;</a>
</div>

<div class="tool-card" id="embed-client">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
<h3>Embed Client</h3>
</div>
<div class="pkg-name">embed-script.js</div>
<p>Drop-in chat widget for any website. White-label customization, conversation starters, RAG context display, and product recommendations.</p>
<div class="install-cmd">&lt;script src="https://assets.divinci.app/embed-script.js"&gt;&lt;/script&gt;</div>
<a href="#embed-client" class="card-link">View reference &rarr;</a>
</div>

<div class="tool-card">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
<h3>REST API</h3>
</div>
<div class="pkg-name">api.divinci.ai/api/v1</div>
<p>Direct HTTP access to the Divinci platform. Manage workspaces, releases, RAG collections, API keys, and analytics via REST endpoints.</p>
<div class="install-cmd">curl -H "x-api-key: YOUR_KEY" https://api.divinci.ai/api/v1/</div>
<a href="#rest-api" class="card-link">View reference &rarr;</a>
</div>

</div>
</section>

<!-- Quick Start -->
<section class="docs-section">
<h2>Quick Start</h2>
<p class="section-sub">Get up and running in minutes with these examples.</p>

<div class="code-block">
<span class="code-label">Terminal — CLI</span>
<pre><span class="comment"># Install and authenticate</span>
<span class="keyword">npm install</span> -g @divinci-ai/cli
<span class="keyword">divinci</span> auth login

<span class="comment"># Start chatting</span>
<span class="keyword">divinci</span> workspace list
<span class="keyword">divinci</span> workspace use ws_abc123
<span class="keyword">divinci</span> chat</pre>
</div>

<div class="code-block">
<span class="code-label">TypeScript — Server SDK</span>
<pre><span class="keyword">import</span> { DivinciServer } <span class="keyword">from</span> <span class="string">"@divinci-ai/server"</span>;

<span class="keyword">const</span> divinci = <span class="keyword">new</span> <span class="func">DivinciServer</span>({
  apiKey: process.env.DIVINCI_API_KEY,
});

<span class="comment">// Upload documents to RAG</span>
<span class="keyword">await</span> divinci.rag.<span class="func">uploadDocument</span>({
  workspaceId: <span class="string">"ws_abc123"</span>,
  ragVectorId: <span class="string">"rag_xyz"</span>,
  file: fs.<span class="func">createReadStream</span>(<span class="string">"./knowledge.pdf"</span>),
});

<span class="comment">// Search the knowledge base</span>
<span class="keyword">const</span> results = <span class="keyword">await</span> divinci.rag.<span class="func">search</span>({
  workspaceId: <span class="string">"ws_abc123"</span>,
  query: <span class="string">"return policy"</span>,
});</pre>
</div>

<div class="code-block">
<span class="code-label">TypeScript — Client SDK</span>
<pre><span class="keyword">import</span> { DivinciClient } <span class="keyword">from</span> <span class="string">"@divinci-ai/client"</span>;

<span class="keyword">const</span> client = <span class="keyword">new</span> <span class="func">DivinciClient</span>({
  releaseId: <span class="string">"rel_abc123"</span>,
  apiKey: <span class="string">"divinci_key_..."</span>,
});

<span class="comment">// Stream a response</span>
<span class="keyword">for await</span> (<span class="keyword">const</span> chunk <span class="keyword">of</span> client.chat.<span class="func">stream</span>(<span class="string">"Tell me about your products"</span>)) {
  process.stdout.<span class="func">write</span>(chunk.content);
}</pre>
</div>

<div class="code-block">
<span class="code-label">TypeScript — MCP SDK</span>
<pre><span class="keyword">import</span> { McpClient } <span class="keyword">from</span> <span class="string">"@divinci-ai/mcp"</span>;

<span class="keyword">const</span> client = <span class="keyword">new</span> <span class="func">McpClient</span>({
  serverUrl: <span class="string">"https://mcp.divinci.app"</span>,
  apiKey: <span class="string">"divinci_key_..."</span>,
});

<span class="keyword">await</span> client.<span class="func">connect</span>();
<span class="keyword">const</span> tools = <span class="keyword">await</span> client.<span class="func">listTools</span>();
<span class="keyword">const</span> result = <span class="keyword">await</span> client.<span class="func">callTool</span>(<span class="string">"search_knowledge"</span>, { query: <span class="string">"return policy"</span> });</pre>
</div>
</section>

<!-- SDK Comparison -->
<section class="docs-section">
<h2>SDK Comparison</h2>
<p class="section-sub">Each SDK serves different use cases. Use this table to find the right fit.</p>

<table class="comparison-table">
<thead>
<tr><th>Feature</th><th>CLI</th><th>Client</th><th>Server</th><th>MCP</th></tr>
</thead>
<tbody>
<tr><td>Environment</td><td>Terminal</td><td>Browser</td><td>Node.js</td><td>Both</td></tr>
<tr><td>Chat Messages</td><td><span class="check">Yes</span></td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td></tr>
<tr><td>Streaming</td><td><span class="check">Yes</span></td><td><span class="check">Yes</span></td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Workspace Management</td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Release Management</td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td></tr>
<tr><td>RAG Operations</td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td><td><span class="check">Yes</span></td></tr>
<tr><td>API Key Management</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td></tr>
<tr><td>x402 Payments</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td><td><span class="check">Yes</span></td></tr>
<tr><td>Auth0 PKCE</td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td></tr>
<tr><td>MCP Protocol</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td></tr>
<tr><td>Raw API Access</td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td><td><span class="check">Yes</span></td><td><span class="dash">—</span></td></tr>
</tbody>
</table>
</section>

<!-- Authentication -->
<section class="docs-section">
<h2>Authentication</h2>
<p class="section-sub">Three authentication methods to fit your architecture.</p>

<div class="auth-methods">
<div class="auth-card">
<h4>API Key (Server)</h4>
<p>Best for backend services and CI/CD. Pass your key via environment variable or constructor.</p>
<div class="code-block" style="margin-bottom: 0;">
<pre><span class="keyword">const</span> divinci = <span class="keyword">new</span> <span class="func">DivinciServer</span>({
  apiKey: process.env.DIVINCI_API_KEY,
});</pre>
</div>
</div>

<div class="auth-card">
<h4>API Key + External User</h4>
<p>Best for embed clients that identify end users for personalized experiences.</p>
<div class="code-block" style="margin-bottom: 0;">
<pre><span class="keyword">const</span> client = <span class="keyword">new</span> <span class="func">DivinciClient</span>({
  releaseId: <span class="string">"rel_abc123"</span>,
  apiKey: <span class="string">"divinci_key_..."</span>,
  externalUser: { id: <span class="string">"user_123"</span> },
});</pre>
</div>
</div>

<div class="auth-card">
<h4>JWT Token (Browser)</h4>
<p>Best for browser apps with your own backend handling token exchange.</p>
<div class="code-block" style="margin-bottom: 0;">
<pre><span class="keyword">const</span> client = <span class="keyword">new</span> <span class="func">DivinciClient</span>({
  releaseId: <span class="string">"rel_abc123"</span>,
  getToken: <span class="keyword">async</span> () => {
    <span class="keyword">return</span> <span class="func">fetch</span>(<span class="string">"/api/token"</span>);
  },
});</pre>
</div>
</div>
</div>
</section>

<!-- REST API Reference — rendered by Redoc via template -->
<section class="docs-section" id="rest-api" style="max-width: 100%; padding: 0;">
<div id="redoc-container" style="min-height: 600px;"></div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Start building with Divinci AI</h2>
<p>Get your API key and integrate AI capabilities into your application in minutes.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Get API keys</a>
<a href="https://sdk.divinci.app" class="cta-secondary" target="_blank">Full SDK docs</a>
</div>
</section>
</div>
