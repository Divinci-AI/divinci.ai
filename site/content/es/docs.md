+++
title = "Herramientas para Desarrolladores y Documentación"
description = "Documentación completa para desarrolladores de Divinci AI — CLI, Server SDK, Client SDK, MCP SDK, Embed Client y referencia de la API REST."
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
    background: var(--color-bg-primary, #f8f4f0);
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
    font-family: 'Source Code Pro', 'Courier New', monospace;
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
    cursor: pointer;
    transition: box-shadow 0.18s ease, transform 0.18s ease;
    color: rgba(255,255,255,0.88);
    -webkit-text-fill-color: rgba(255,255,255,0.88);
}

.code-block:hover {
    box-shadow: 0 6px 20px rgba(0,0,0,0.18);
}

.code-block:active {
    transform: translateY(1px);
}

.code-block:focus-visible {
    outline: 2px solid var(--color-accent-tertiary, #8cc4d4);
    outline-offset: 3px;
}

.code-block .code-label {
    position: absolute;
    top: 0.6rem;
    right: 3rem;
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: rgba(255,255,255,0.4);
    font-weight: 600;
    pointer-events: none;
}

.code-block pre,
.code-block code {
    margin: 0;
    font-family: 'Source Code Pro', 'Courier New', monospace !important;
    font-size: 0.88rem !important;
    line-height: 1.6;
    white-space: pre;
    text-shadow: none !important;
    background: none !important;
}

.code-block pre,
.code-block code {
    color: rgba(255,255,255,0.88);
    -webkit-text-fill-color: rgba(255,255,255,0.88);
}

/* Syntax color tokens (no global override — these must win) */
.code-block .comment {
    color: rgba(200, 220, 200, 0.55) !important;
    -webkit-text-fill-color: rgba(200, 220, 200, 0.55) !important;
    font-style: italic;
}
.code-block .keyword {
    color: #b8d4a0 !important;
    -webkit-text-fill-color: #b8d4a0 !important;
    font-weight: 600;
}
.code-block .string {
    color: #e8c88a !important;
    -webkit-text-fill-color: #e8c88a !important;
}
.code-block .func {
    color: #8cc4d4 !important;
    -webkit-text-fill-color: #8cc4d4 !important;
}

/* Copy button */
.code-copy-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.6rem;
    background: rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7);
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s ease;
    padding: 0;
    -webkit-text-fill-color: rgba(255,255,255,0.7);
}
.code-copy-btn:hover {
    background: rgba(255,255,255,0.14);
    color: rgba(255,255,255,0.95);
    -webkit-text-fill-color: rgba(255,255,255,0.95);
}
.code-copy-btn svg { width: 16px; height: 16px; }
.code-copy-btn .copy-feedback {
    position: absolute;
    right: calc(100% + 6px);
    top: 50%;
    transform: translateY(-50%);
    background: rgba(232, 200, 138, 0.95);
    color: #1e3a2b;
    -webkit-text-fill-color: #1e3a2b;
    font-size: 0.72rem;
    font-weight: 700;
    padding: 0.2rem 0.55rem;
    border-radius: 4px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s ease;
}
.code-copy-btn.copied .copy-feedback { opacity: 1; }
.code-copy-btn.copied {
    background: rgba(184, 212, 160, 0.18);
    border-color: rgba(184, 212, 160, 0.4);
    color: #b8d4a0;
    -webkit-text-fill-color: #b8d4a0;
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
    background: var(--color-bg-primary, #f8f4f0);
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
<h1>Herramientas para Desarrolladores y Documentación</h1>
<p class="subtitle">Todo lo que necesitas para integrar Divinci AI en tus aplicaciones. SDKs para cada plataforma, un potente CLI y acceso completo a la API REST.</p>
<div class="hero-links">
<a href="https://sdk.divinci.ai" class="link-primary" target="_blank">Documentación del SDK</a>
<a href="/api/" class="link-secondary">Referencia de la API</a>
</div>
</div>

<!-- SDK Chooser -->
<section class="sdk-chooser">
<h2>Elige tu Herramienta</h2>
<p class="section-sub">Elige la integración adecuada para tu caso de uso — desde flujos de trabajo en terminal hasta widgets de chat en el navegador.</p>

<div class="tool-grid">

<div class="tool-card" id="cli-reference">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg></div>
<h3>Divinci CLI</h3>
</div>
<div class="pkg-name">@divinci-ai/cli</div>
<p>Gestiona espacios de trabajo, chatea con IA, busca en bases de conocimiento y controla versiones desde tu terminal. Soporta perfiles, scripting y CI/CD.</p>
<div class="install-cmd">npm install -g @divinci-ai/cli</div>
<a href="https://sdk.divinci.ai/cli/overview" class="card-link" target="_blank">Ver documentación del CLI &rarr;</a>
</div>

<div class="tool-card" id="server-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
<h3>Server SDK</h3>
</div>
<div class="pkg-name">@divinci-ai/server</div>
<p>Acceso completo a la plataforma desde Node.js — espacios de trabajo, versiones, operaciones RAG, gestión de claves de API y pagos blockchain x402.</p>
<div class="install-cmd">npm install @divinci-ai/server</div>
<a href="https://sdk.divinci.ai/server/overview" class="card-link" target="_blank">Ver referencia &rarr;</a>
</div>

<div class="tool-card" id="client-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
<h3>Client SDK</h3>
</div>
<div class="pkg-name">@divinci-ai/client</div>
<p>SDK para navegador diseñado para integración de chat headless. Respuestas en streaming, burbujas de contexto RAG, gestión de hilos y autenticación de usuarios externos.</p>
<div class="install-cmd">npm install @divinci-ai/client</div>
<a href="https://sdk.divinci.ai/client/overview" class="card-link" target="_blank">Ver referencia &rarr;</a>
</div>

<div class="tool-card" id="mcp-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
<h3>MCP SDK</h3>
</div>
<div class="pkg-name">@divinci-ai/mcp</div>
<p>Integración del Model Context Protocol para Claude Desktop, Cursor y otros asistentes de IA. Transporte SSE, invocación de herramientas y pagos x402.</p>
<div class="install-cmd">npm install @divinci-ai/mcp</div>
<a href="https://sdk.divinci.ai/mcp/overview" class="card-link" target="_blank">Ver referencia &rarr;</a>
</div>

<div class="tool-card" id="embed-client">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
<h3>Embed Client</h3>
</div>
<div class="pkg-name">embed-script.js</div>
<p>Widget de chat listo para insertar en cualquier sitio web. Personalización white-label, sugerencias de conversación, visualización de contexto RAG, recomendaciones de productos y comentarios sobre mensajes (pulgar arriba/abajo). Activa las valoraciones con <code>message-feedback="true"</code> (o <code>new DivinciChat({ messageFeedback: true })</code>).</p>
<div class="install-cmd">&lt;script src="https://assets.divinci.app/embed-script.js" divinci-release-id="rel_your-release-id" message-feedback="true"&gt;&lt;/script&gt;</div>
<a href="https://sdk.divinci.ai/embed/overview" class="card-link" target="_blank">Ver referencia &rarr;</a>
</div>

<div class="tool-card">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
<h3>API REST</h3>
</div>
<div class="pkg-name">api.divinci.ai/api/v1</div>
<p>Acceso HTTP directo a la plataforma Divinci. Gestiona espacios de trabajo, versiones, colecciones RAG, claves de API y analíticas mediante endpoints REST.</p>
<div class="install-cmd">curl -H "x-api-key: YOUR_KEY" https://api.divinci.ai/api/v1/</div>
<a href="/api/" class="card-link">Ver referencia de la API &rarr;</a>
</div>

</div>
</section>

<!-- Quick Start -->
<section class="docs-section">
<h2>Inicio Rápido</h2>
<p class="section-sub">Ponte en marcha en minutos con estos ejemplos.</p>

<div class="code-block">
<span class="code-label">Terminal — CLI</span>
<pre><span class="comment"># Instalar y autenticarse</span>
<span class="keyword">npm install</span> -g @divinci-ai/cli
<span class="keyword">divinci</span> auth login

<span class="comment"># Empezar a chatear</span>
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

<span class="comment">// Subir documentos al RAG</span>
<span class="keyword">await</span> divinci.rag.<span class="func">uploadDocument</span>({
  workspaceId: <span class="string">"ws_abc123"</span>,
  ragVectorId: <span class="string">"rag_xyz"</span>,
  file: fs.<span class="func">createReadStream</span>(<span class="string">"./knowledge.pdf"</span>),
});

<span class="comment">// Buscar en la base de conocimiento</span>
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

<span class="comment">// Transmitir una respuesta en streaming</span>
<span class="keyword">for await</span> (<span class="keyword">const</span> chunk <span class="keyword">of</span> client.chat.<span class="func">stream</span>(<span class="string">"Tell me about your products"</span>)) {
  process.stdout.<span class="func">write</span>(chunk.content);
}

<span class="comment">// Pulgar arriba/abajo + comentarios sobre una respuesta del asistente</span>
<span class="keyword">await</span> client.chat.<span class="func">submitMessageFeedback</span>(chatId, messageId, { sentiment: -<span class="number">1</span>, feedback: <span class="string">"missed the warranty terms"</span> });</pre>
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
<h2>Comparación de SDKs</h2>
<p class="section-sub">Cada SDK sirve para un caso de uso distinto. Usa esta tabla para encontrar el más adecuado.</p>

<table class="comparison-table">
<thead>
<tr><th>Característica</th><th>CLI</th><th>Client</th><th>Server</th><th>MCP</th></tr>
</thead>
<tbody>
<tr><td>Entorno</td><td>Terminal</td><td>Navegador</td><td>Node.js</td><td>Ambos</td></tr>
<tr><td>Mensajes de Chat</td><td><span class="check">Sí</span></td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td></tr>
<tr><td>Streaming</td><td><span class="check">Sí</span></td><td><span class="check">Sí</span></td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Gestión de Espacios de Trabajo</td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Gestión de Versiones</td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Operaciones RAG</td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td><td><span class="check">Sí</span></td></tr>
<tr><td>Gestión de Claves de API</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Pagos x402</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td><td><span class="check">Sí</span></td></tr>
<tr><td>Auth0 PKCE</td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td></tr>
<tr><td>Protocolo MCP</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td></tr>
<tr><td>Acceso Directo a la API</td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td><td><span class="check">Sí</span></td><td><span class="dash">—</span></td></tr>
</tbody>
</table>
</section>

<!-- Authentication -->
<section class="docs-section">
<h2>Autenticación</h2>
<p class="section-sub">Tres métodos de autenticación para adaptarse a tu arquitectura.</p>

<div class="auth-methods">
<div class="auth-card">
<h4>Clave de API (Server)</h4>
<p>Ideal para servicios de backend y CI/CD. Pasa tu clave mediante una variable de entorno o el constructor.</p>
<div class="code-block" style="margin-bottom: 0;">
<pre><span class="keyword">const</span> divinci = <span class="keyword">new</span> <span class="func">DivinciServer</span>({
  apiKey: process.env.DIVINCI_API_KEY,
});</pre>
</div>
</div>

<div class="auth-card">
<h4>Clave de API + Usuario Externo</h4>
<p>Ideal para clientes embebidos que identifican a los usuarios finales para experiencias personalizadas.</p>
<div class="code-block" style="margin-bottom: 0;">
<pre><span class="keyword">const</span> client = <span class="keyword">new</span> <span class="func">DivinciClient</span>({
  releaseId: <span class="string">"rel_abc123"</span>,
  apiKey: <span class="string">"divinci_key_..."</span>,
  externalUser: { id: <span class="string">"user_123"</span> },
});</pre>
</div>
</div>

<div class="auth-card">
<h4>Token JWT (Navegador)</h4>
<p>Ideal para aplicaciones de navegador con tu propio backend gestionando el intercambio de tokens.</p>
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

<script>
(function () {
  const COPY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
  const CHECK_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  function getCodeText(block) {
    const pre = block.querySelector('pre, code');
    if (!pre) return block.innerText.trim();
    const clone = pre.cloneNode(true);
    clone.querySelectorAll('.code-copy-btn, .code-label').forEach(n => n.remove());
    return clone.innerText.trim();
  }

  async function copyBlock(block, btn) {
    // Optional catch bindings (no `(err)`) are load-bearing here, not style.
    // Zola's minify_html renames identifiers per script and will rename BOTH a
    // catch parameter and a lexical declaration inside that catch block to the
    // same short name, emitting `catch(a){const a=...}` — a SyntaxError that
    // kills this whole script. With no parameter there is nothing to collide.
    try {
      await navigator.clipboard.writeText(getCodeText(block));
    } catch {
      const ta = document.createElement('textarea');
      ta.value = getCodeText(block);
      ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch { /* clipboard unavailable */ }
      document.body.removeChild(ta);
    }
    if (!btn) return;
    btn.classList.add('copied');
    btn.querySelector('.icon').innerHTML = CHECK_ICON;
    btn.setAttribute('aria-label', 'Copied');
    setTimeout(function () {
      btn.classList.remove('copied');
      btn.querySelector('.icon').innerHTML = COPY_ICON;
      btn.setAttribute('aria-label', 'Copy code');
    }, 1600);
  }

  document.querySelectorAll('.code-block').forEach(function (block) {
    if (block.querySelector('.code-copy-btn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'code-copy-btn';
    btn.setAttribute('aria-label', 'Copy code');
    btn.innerHTML = '<span class="icon">' + COPY_ICON + '</span><span class="copy-feedback">Copied!</span>';
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      copyBlock(block, btn);
    });
    block.appendChild(btn);

    // tabindex only — deliberately NOT role="button". These blocks scroll
    // horizontally, so they must be focusable or a keyboard user cannot reach
    // the code that overflows (WCAG 2.1.1). But role="button" on a container
    // that holds a real <button> is nested-interactive (WCAG 4.1.2), and worse,
    // the button role makes the block's own descendants presentational — the
    // code itself stops being readable to a screen reader. Naming it would hit
    // the same problem: an aria-label on the container replaces the code text
    // in the announcement. The nested .code-copy-btn is the accessible copy
    // control; click and Enter/Space on the block stay as a convenience.
    block.setAttribute('tabindex', '0');
    block.addEventListener('click', function (e) {
      if (e.target.closest('.code-copy-btn')) return;
      if (window.getSelection && String(window.getSelection()).length > 0) return;
      copyBlock(block, btn);
    });
    block.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        copyBlock(block, btn);
      }
    });
  });
})();
</script>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Empieza a construir con Divinci AI</h2>
<p>Consigue tu clave de API e integra capacidades de IA en tu aplicación en minutos.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Obtener claves de API</a>
<a href="/api/" class="cta-secondary">Referencia completa de la API</a>
</div>
</section>
</div>
