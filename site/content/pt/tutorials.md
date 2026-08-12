+++
title = "Tutoriais"
description = "Tutoriais passo a passo do Divinci AI — publique seu primeiro assistente, construa uma base de conhecimento, incorpore o chat no seu site, integre com o SDK e a CLI, execute suítes de QA e dê voz ao seu assistente."
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
<h1>Tutoriais</h1>
<p class="subtitle">Guias práticos e passo a passo para a plataforma Divinci AI — desde publicar seu primeiro assistente no dashboard até entregar integrações para desenvolvedores, pipelines de QA e voz.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>Comece por aqui</h2>
<p class="section-sub">Sem necessidade de código. Estes passo a passo usam o dashboard da Divinci do início ao fim.</p>

<div class="guide-block">
<h3>Crie e publique seu primeiro assistente <span class="level-badge level-beginner">Iniciante</span></h3>
<p class="guide-intro">Releases são a forma como a Divinci empacota um assistente: você configura um rascunho, publica, e cada alteração posterior é um novo rascunho derivado de uma versão publicada — assim você sempre pode reverter.</p>
<ol>
<li>Entre no dashboard e abra (ou crie) um workspace.</li>
<li>Crie um novo <strong>Release em rascunho</strong> — rascunhos são privados e totalmente editáveis.</li>
<li>Escolha o modelo que vai alimentar seu assistente.</li>
<li>Configure o assistente: instruções de sistema, sugestões de início de conversa e qualquer base de conhecimento que você queira anexar.</li>
<li>Teste o rascunho no chat integrado até as respostas ficarem do jeito certo.</li>
<li><strong>Publique</strong> o release para deixá-lo no ar para seus usuários e integrações.</li>
<li>Para iterar depois, derive um novo rascunho a partir do release publicado, faça as alterações e publique novamente — as versões anteriores continuam disponíveis.</li>
</ol>
<a href="/release-management/" class="card-link">Saiba mais sobre release management &rarr;</a>
</div>

<div class="guide-block">
<h3>Construa uma base de conhecimento com seus arquivos <span class="level-badge level-beginner">Iniciante</span></h3>
<p class="guide-intro">Fundamente seu assistente no seu próprio conteúdo para que ele responda a partir dos seus documentos em vez de adivinhar.</p>
<ol>
<li>No seu workspace, abra a seção de base de conhecimento e crie uma nova coleção.</li>
<li>Envie seus documentos — PDFs, documentos de escritório e arquivos de texto funcionam.</li>
<li>Aguarde a indexação terminar; cada documento é dividido em trechos e vetorizado automaticamente.</li>
<li>Anexe a coleção a um release em rascunho.</li>
<li>Faça ao rascunho uma pergunta que só seus documentos podem responder para confirmar que a recuperação funciona e, então, publique.</li>
</ol>
<div class="guide-note">Além do upload de arquivos, as bases de conhecimento podem ingerir texto puro, gravações de áudio (transcritas automaticamente), catálogos de produtos e arquivos do Dropbox.</div>
</div>

<div class="guide-block">
<h3>Ingira seu site por crawl de URL <span class="level-badge level-beginner">Iniciante</span></h3>
<p class="guide-intro">Aponte a Divinci para o seu site e transforme as páginas em conhecimento do assistente — sem necessidade de exportações.</p>
<ol>
<li>Na sua base de conhecimento, escolha adicionar uma fonte web.</li>
<li>Insira uma URL — extraia uma única página ou rastreie o site inteiro a partir de uma URL inicial.</li>
<li>Quando o crawl terminar, revise os trechos extraídos e remova o que você não quiser.</li>
<li>Anexe a coleção ao seu release e teste com perguntas baseadas no conteúdo do seu site.</li>
</ol>
<div class="guide-note">A indexação continua em segundo plano depois que o crawl em si termina — sites muito grandes podem levar um pouco mais de tempo até que todas as páginas fiquem pesquisáveis.</div>
</div>

<div class="guide-block">
<h3>Incorpore o widget de chat no seu site <span class="level-badge level-beginner">Iniciante</span></h3>
<p class="guide-intro">Depois que um release é publicado, uma única tag de script coloca um widget de chat totalmente personalizado com a sua marca em qualquer site:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">O widget transmite respostas em streaming, mostra o contexto RAG e suporta personalização white-label — cores, posição, sugestões de início de conversa e muito mais.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">Documentação do widget de embed &rarr;</a>
</div>

<div class="guide-block">
<h3>Permita que visitantes anônimos conversem, com cotas <span class="level-badge level-intermediate">Intermediário</span></h3>
<p class="guide-intro">Abra seu assistente para visitantes que não têm conta: eles verificam um endereço de e-mail, passam por uma verificação do Cloudflare Turnstile e conversam dentro das cotas diárias que você define — assim você mantém o controle sobre uso e abuso.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">Exemplos de chat para visitantes anônimos &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>Para desenvolvedores</h2>
<p class="section-sub">Construa sobre a plataforma com os SDKs, a CLI e o MCP — os guias completos estão na documentação do SDK.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">Iniciante</span>
<h3>Início rápido: chat em streaming com o Client SDK</h3>
<p>Instale <code>@divinci-ai/client</code>, autentique-se e transmita a primeira resposta do seu assistente no navegador em poucos minutos.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">Siga o início rápido &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Iniciante</span>
<h3>Gerencie tudo pelo terminal</h3>
<p>A CLI da Divinci cobre workspaces, releases, bases de conhecimento e chat — automatizável tanto para CI/CD quanto para fluxos de trabalho do dia a dia.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">Visão geral da CLI &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Iniciante</span>
<h3>Conecte o Claude ou o Cursor ao seu assistente (MCP)</h3>
<p>Adicione <code>https://mcp.divinci.app/mcp</code> na interface de conectores da sua ferramenta de IA, autorize com OAuth, e o conhecimento e as ferramentas do seu assistente ficam disponíveis dentro do Claude, do Cursor e de outros clientes MCP.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">Conecte via MCP &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Avançado</span>
<h3>Implante um chat de landing page com acesso controlado no Cloudflare Workers</h3>
<p>Entregue uma landing page com chat de assistente integrado atrás do seu próprio controle de acesso, rodando na edge com Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Guia do Cloudflare Workers &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Avançado</span>
<h3>Publique seu release como um servidor MCP próprio</h3>
<p>Transforme um release publicado em um servidor MCP white-label que seus clientes podem adicionar às próprias ferramentas de IA.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">Servidores MCP white-label &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>Qualidade &amp; confiança</h2>
<p class="section-sub">Meça as respostas do seu assistente e controle quais provedores de modelo as atendem.</p>

<div class="guide-block">
<h3>Avalie seu assistente com suítes de QA e AutoFix <span class="level-badge level-intermediate">Intermediário</span></h3>
<p class="guide-intro">Suítes de QA executam testes estruturados contra um release e pontuam as respostas, para que a qualidade seja medida — não presumida.</p>
<ol>
<li>Crie uma suíte de QA escrevendo você mesmo os casos de teste, ou gere testes automaticamente a partir dos arquivos da sua base de conhecimento.</li>
<li>Execute a suíte contra um release — em rascunho ou publicado.</li>
<li>Revise as pontuações para ver quais perguntas o assistente respondeu bem e onde ele ficou aquém.</li>
<li>Aplique o <strong>AutoFix</strong> para que a Divinci proponha mudanças de configuração que resolvam as falhas e, em seguida, execute a suíte novamente para confirmar a melhoria.</li>
</ol>
<a href="/quality-assurance/" class="card-link">Saiba mais sobre garantia de qualidade &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA no Server SDK &rarr;</a>
</div>

<div class="guide-block">
<h3>Traga suas próprias chaves de modelo (BYOK) <span class="level-badge level-intermediate">Intermediário</span></h3>
<p class="guide-intro">Use suas próprias contas de provedor — seus limites de requisição, sua cobrança, seus acordos de dados — em vez das chaves compartilhadas da Divinci.</p>
<ol>
<li>Abra as configurações do seu workspace e vá para chaves de modelo.</li>
<li>Adicione uma chave de API do seu provedor (por exemplo, OpenAI ou Anthropic).</li>
<li>Selecione sua chave ao configurar um release — as chamadas de modelo desse release agora passam pela sua conta.</li>
<li>Rotacione ou remova chaves a qualquer momento; os releases voltam a usar as chaves da plataforma se você remover as suas.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>Voz</h2>
<p class="section-sub">Assistentes não precisam ser só texto.</p>

<div class="guide-block">
<h3>Dê voz ao seu assistente <span class="level-badge level-intermediate">Intermediário</span></h3>
<p class="guide-intro">Habilite text-to-speech em um release para que as respostas possam ser faladas em voz alta.</p>
<ol>
<li>Abra a configuração do seu release e habilite <strong>text-to-speech</strong>.</li>
<li>Escolha uma voz entre as opções integradas (vozes Deepgram Aura e Cartesia estão disponíveis) ou clone uma voz personalizada.</li>
<li>Teste no chat do dashboard e publique — o widget e as superfícies do SDK agora podem falar as respostas.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Pronto para construir?</h2>
<p>Crie seu primeiro assistente gratuitamente, ou fale com a gente sobre o seu caso de uso.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">Solicitar uma demo</a>
<a href="/docs/" class="cta-secondary">Documentação para desenvolvedores</a>
</div>
</section>
</div>
