+++
title = "Outils pour Développeurs & Documentation"
description = "Documentation complète pour les développeurs Divinci AI — CLI, SDK Serveur, SDK Client, SDK MCP, Client d'Intégration (Embed), et référence de l'API REST."
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
<h1>Outils pour Développeurs & Documentation</h1>
<p class="subtitle">Tout ce dont vous avez besoin pour intégrer Divinci AI dans vos applications. Des SDKs pour chaque plateforme, un CLI puissant, et un accès complet à l'API REST.</p>
<div class="hero-links">
<a href="https://sdk.divinci.ai" class="link-primary" target="_blank">Documentation du SDK</a>
<a href="/api/" class="link-secondary">Référence de l'API</a>
</div>
</div>

<!-- SDK Chooser -->
<section class="sdk-chooser">
<h2>Choisissez Votre Outil</h2>
<p class="section-sub">Choisissez l'intégration adaptée à votre cas d'usage — des workflows en terminal aux widgets de chat pour navigateur.</p>

<div class="tool-grid">

<div class="tool-card" id="cli-reference">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg></div>
<h3>Divinci CLI</h3>
</div>
<div class="pkg-name">@divinci-ai/cli</div>
<p>Gérez vos espaces de travail, discutez avec l'IA, effectuez des recherches dans vos bases de connaissances et contrôlez vos versions depuis votre terminal. Prend en charge les profils, le scripting et l'intégration CI/CD.</p>
<div class="install-cmd">npm install -g @divinci-ai/cli</div>
<a href="https://sdk.divinci.ai/cli/overview" class="card-link" target="_blank">Voir la doc du CLI &rarr;</a>
</div>

<div class="tool-card" id="server-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></div>
<h3>SDK Serveur</h3>
</div>
<div class="pkg-name">@divinci-ai/server</div>
<p>Accès complet à la plateforme depuis Node.js — espaces de travail, versions, opérations RAG, gestion des clés d'API, et paiements blockchain x402.</p>
<div class="install-cmd">npm install @divinci-ai/server</div>
<a href="https://sdk.divinci.ai/server/overview" class="card-link" target="_blank">Voir la référence &rarr;</a>
</div>

<div class="tool-card" id="client-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></div>
<h3>SDK Client</h3>
</div>
<div class="pkg-name">@divinci-ai/client</div>
<p>SDK navigateur pour une intégration de chat headless. Réponses en streaming, bulles de contexte RAG, gestion des fils de discussion, et authentification des utilisateurs externes.</p>
<div class="install-cmd">npm install @divinci-ai/client</div>
<a href="https://sdk.divinci.ai/client/overview" class="card-link" target="_blank">Voir la référence &rarr;</a>
</div>

<div class="tool-card" id="mcp-sdk">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></div>
<h3>SDK MCP</h3>
</div>
<div class="pkg-name">@divinci-ai/mcp</div>
<p>Intégration du Model Context Protocol pour Claude Desktop, Cursor et d'autres assistants IA. Transport SSE, invocation d'outils, et paiements x402.</p>
<div class="install-cmd">npm install @divinci-ai/mcp</div>
<a href="https://sdk.divinci.ai/mcp/overview" class="card-link" target="_blank">Voir la référence &rarr;</a>
</div>

<div class="tool-card" id="embed-client">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg></div>
<h3>Client d'Intégration (Embed)</h3>
</div>
<div class="pkg-name">embed-script.js</div>
<p>Widget de chat prêt à l'emploi pour n'importe quel site web. Personnalisation en marque blanche, suggestions de conversation, affichage du contexte RAG, recommandations de produits, et retour sur les messages (pouce levé/baissé). Activez les évaluations avec <code>message-feedback="true"</code> (ou <code>new DivinciChat({ messageFeedback: true })</code>).</p>
<div class="install-cmd">&lt;script src="https://assets.divinci.app/embed-script.js" divinci-release-id="rel_your-release-id" message-feedback="true"&gt;&lt;/script&gt;</div>
<a href="https://sdk.divinci.ai/embed/overview" class="card-link" target="_blank">Voir la référence &rarr;</a>
</div>

<div class="tool-card">
<div class="tool-card-header">
<div class="tool-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
<h3>API REST</h3>
</div>
<div class="pkg-name">api.divinci.ai/api/v1</div>
<p>Accès HTTP direct à la plateforme Divinci. Gérez vos espaces de travail, vos versions, vos collections RAG, vos clés d'API et vos analytiques via des points de terminaison REST.</p>
<div class="install-cmd">curl -H "x-api-key: YOUR_KEY" https://api.divinci.ai/api/v1/</div>
<a href="/api/" class="card-link">Voir la référence de l'API &rarr;</a>
</div>

</div>
</section>

<!-- Quick Start -->
<section class="docs-section">
<h2>Démarrage Rapide</h2>
<p class="section-sub">Soyez opérationnel en quelques minutes grâce à ces exemples.</p>

<div class="code-block">
<span class="code-label">Terminal — CLI</span>
<pre><span class="comment"># Installer et s'authentifier</span>
<span class="keyword">npm install</span> -g @divinci-ai/cli
<span class="keyword">divinci</span> auth login

<span class="comment"># Commencer à discuter</span>
<span class="keyword">divinci</span> workspace list
<span class="keyword">divinci</span> workspace use ws_abc123
<span class="keyword">divinci</span> chat</pre>
</div>

<div class="code-block">
<span class="code-label">TypeScript — SDK Serveur</span>
<pre><span class="keyword">import</span> { DivinciServer } <span class="keyword">from</span> <span class="string">"@divinci-ai/server"</span>;

<span class="keyword">const</span> divinci = <span class="keyword">new</span> <span class="func">DivinciServer</span>({
  apiKey: process.env.DIVINCI_API_KEY,
});

<span class="comment">// Téléverser des documents vers le RAG</span>
<span class="keyword">await</span> divinci.rag.<span class="func">uploadDocument</span>({
  workspaceId: <span class="string">"ws_abc123"</span>,
  ragVectorId: <span class="string">"rag_xyz"</span>,
  file: fs.<span class="func">createReadStream</span>(<span class="string">"./knowledge.pdf"</span>),
});

<span class="comment">// Rechercher dans la base de connaissances</span>
<span class="keyword">const</span> results = <span class="keyword">await</span> divinci.rag.<span class="func">search</span>({
  workspaceId: <span class="string">"ws_abc123"</span>,
  query: <span class="string">"return policy"</span>,
});</pre>
</div>

<div class="code-block">
<span class="code-label">TypeScript — SDK Client</span>
<pre><span class="keyword">import</span> { DivinciClient } <span class="keyword">from</span> <span class="string">"@divinci-ai/client"</span>;

<span class="keyword">const</span> client = <span class="keyword">new</span> <span class="func">DivinciClient</span>({
  releaseId: <span class="string">"rel_abc123"</span>,
  apiKey: <span class="string">"divinci_key_..."</span>,
});

<span class="comment">// Diffuser une réponse en streaming</span>
<span class="keyword">for await</span> (<span class="keyword">const</span> chunk <span class="keyword">of</span> client.chat.<span class="func">stream</span>(<span class="string">"Tell me about your products"</span>)) {
  process.stdout.<span class="func">write</span>(chunk.content);
}

<span class="comment">// Pouce levé/baissé + commentaire sur une réponse de l'assistant</span>
<span class="keyword">await</span> client.chat.<span class="func">submitMessageFeedback</span>(chatId, messageId, { sentiment: -<span class="number">1</span>, feedback: <span class="string">"missed the warranty terms"</span> });</pre>
</div>

<div class="code-block">
<span class="code-label">TypeScript — SDK MCP</span>
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
<h2>Comparaison des SDKs</h2>
<p class="section-sub">Chaque SDK répond à des cas d'usage différents. Utilisez ce tableau pour trouver celui qui vous convient.</p>

<table class="comparison-table">
<thead>
<tr><th>Fonctionnalité</th><th>CLI</th><th>Client</th><th>Serveur</th><th>MCP</th></tr>
</thead>
<tbody>
<tr><td>Environnement</td><td>Terminal</td><td>Navigateur</td><td>Node.js</td><td>Les deux</td></tr>
<tr><td>Messages de Chat</td><td><span class="check">Oui</span></td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td></tr>
<tr><td>Streaming</td><td><span class="check">Oui</span></td><td><span class="check">Oui</span></td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Gestion des Espaces de Travail</td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Gestion des Versions</td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Opérations RAG</td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td><td><span class="check">Oui</span></td></tr>
<tr><td>Gestion des Clés d'API</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td></tr>
<tr><td>Paiements x402</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td><td><span class="check">Oui</span></td></tr>
<tr><td>Auth0 PKCE</td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td></tr>
<tr><td>Protocole MCP</td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td></tr>
<tr><td>Accès API Brut</td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td><td><span class="check">Oui</span></td><td><span class="dash">—</span></td></tr>
</tbody>
</table>
</section>

<!-- Authentication -->
<section class="docs-section">
<h2>Authentification</h2>
<p class="section-sub">Trois méthodes d'authentification pour s'adapter à votre architecture.</p>

<div class="auth-methods">
<div class="auth-card">
<h4>Clé d'API (Serveur)</h4>
<p>Idéal pour les services backend et l'intégration CI/CD. Transmettez votre clé via une variable d'environnement ou le constructeur.</p>
<div class="code-block" style="margin-bottom: 0;">
<pre><span class="keyword">const</span> divinci = <span class="keyword">new</span> <span class="func">DivinciServer</span>({
  apiKey: process.env.DIVINCI_API_KEY,
});</pre>
</div>
</div>

<div class="auth-card">
<h4>Clé d'API + Utilisateur Externe</h4>
<p>Idéal pour les clients d'intégration qui identifient les utilisateurs finaux afin de proposer des expériences personnalisées.</p>
<div class="code-block" style="margin-bottom: 0;">
<pre><span class="keyword">const</span> client = <span class="keyword">new</span> <span class="func">DivinciClient</span>({
  releaseId: <span class="string">"rel_abc123"</span>,
  apiKey: <span class="string">"divinci_key_..."</span>,
  externalUser: { id: <span class="string">"user_123"</span> },
});</pre>
</div>
</div>

<div class="auth-card">
<h4>Jeton JWT (Navigateur)</h4>
<p>Idéal pour les applications navigateur avec votre propre backend gérant l'échange de jetons.</p>
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
<h2>Commencez à créer avec Divinci AI</h2>
<p>Obtenez votre clé d'API et intégrez des capacités d'IA à votre application en quelques minutes.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank">Obtenir des clés d'API</a>
<a href="/api/" class="cta-secondary">Référence complète de l'API</a>
</div>
</section>
</div>
