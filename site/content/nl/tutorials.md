+++
title = "Tutorials"
description = "Stapsgewijze tutorials voor Divinci AI — publiceer uw eerste assistent, bouw een kennisbank, embed chat op uw website, integreer met de SDK en CLI, voer QA-suites uit en geef uw assistent een stem."
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
<h1>Tutorials</h1>
<p class="subtitle">Praktische, stapsgewijze gidsen voor het Divinci AI-platform — van het publiceren van uw eerste assistent in het dashboard tot het opleveren van developer-integraties, QA-pipelines en spraak.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>Begin hier</h2>
<p class="section-sub">Geen code nodig. Deze walkthroughs gebruiken van begin tot eind het Divinci-dashboard.</p>

<div class="guide-block">
<h3>Maak en publiceer uw eerste assistent <span class="level-badge level-beginner">Beginner</span></h3>
<p class="guide-intro">Releases zijn de manier waarop Divinci een assistent verpakt: u configureert een concept, publiceert het, en elke latere wijziging is een nieuw concept dat is afgesplitst van een gepubliceerde versie — zodat u altijd kunt terugdraaien.</p>
<ol>
<li>Log in op het dashboard en open (of maak) een workspace.</li>
<li>Maak een nieuwe <strong>concept-Release</strong> — concepten zijn privé en volledig bewerkbaar.</li>
<li>Kies het model dat uw assistent aandrijft.</li>
<li>Configureer de assistent: systeeminstructies, gespreksstarters en elke kennisbank die u wilt koppelen.</li>
<li>Test het concept in de ingebouwde chat totdat de antwoorden goed zijn.</li>
<li><strong>Publiceer</strong> de release om deze live te zetten voor uw gebruikers en integraties.</li>
<li>Om later te itereren, splitst u de gepubliceerde release af als nieuw concept, past u het aan en publiceert u opnieuw — eerdere versies blijven beschikbaar.</li>
</ol>
<a href="/release-management/" class="card-link">Meer over release management &rarr;</a>
</div>

<div class="guide-block">
<h3>Bouw een kennisbank op basis van uw bestanden <span class="level-badge level-beginner">Beginner</span></h3>
<p class="guide-intro">Veranker uw assistent in uw eigen content, zodat deze antwoordt vanuit uw documenten in plaats van te gokken.</p>
<ol>
<li>Open in uw workspace de kennisbanksectie en maak een nieuwe collectie.</li>
<li>Upload uw documenten — PDF's, office-documenten en tekstbestanden werken allemaal.</li>
<li>Wacht tot het indexeren klaar is; elk document wordt automatisch opgedeeld en van embeddings voorzien.</li>
<li>Koppel de collectie aan een concept-release.</li>
<li>Stel het concept een vraag die alleen uw documenten kunnen beantwoorden om te bevestigen dat retrieval werkt, en publiceer daarna.</li>
</ol>
<div class="guide-note">Naast bestandsuploads kunnen kennisbanken ook platte tekst, audio-opnamen (automatisch getranscribeerd), productcatalogi en bestanden uit Dropbox innemen.</div>
</div>

<div class="guide-block">
<h3>Neem uw website op via URL-crawl <span class="level-badge level-beginner">Beginner</span></h3>
<p class="guide-intro">Wijs Divinci naar uw website en maak van de pagina's assistentkennis — geen exports nodig.</p>
<ol>
<li>Kies in uw kennisbank voor het toevoegen van een webbron.</li>
<li>Voer een URL in — scrape één pagina, of crawl de hele site vanaf een start-URL.</li>
<li>Wanneer de crawl klaar is, controleert u de geëxtraheerde chunks en verwijdert u alles wat u niet wilt.</li>
<li>Koppel de collectie aan uw release en test met vragen over de content van uw site.</li>
</ol>
<div class="guide-note">Het indexeren gaat op de achtergrond door nadat de crawl zelf is voltooid — bij zeer grote sites kan het iets langer duren voordat elke pagina doorzoekbaar is.</div>
</div>

<div class="guide-block">
<h3>Embed de chatwidget op uw website <span class="level-badge level-beginner">Beginner</span></h3>
<p class="guide-intro">Zodra een release is gepubliceerd, zet één script-tag een volledig gebrande chatwidget op elke website:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">De widget streamt antwoorden, toont RAG-context en ondersteunt white-label-aanpassing — kleuren, positie, gespreksstarters en meer.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">Documentatie embed-widget &rarr;</a>
</div>

<div class="guide-block">
<h3>Laat anonieme bezoekers chatten, met quota <span class="level-badge level-intermediate">Gemiddeld</span></h3>
<p class="guide-intro">Stel uw assistent open voor bezoekers zonder account: zij verifiëren een e-mailadres, doorstaan een Cloudflare Turnstile-check en chatten binnen de dagelijkse quota die u instelt — zodat u de controle houdt over gebruik en misbruik.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">Voorbeelden van anonieme bezoekerschat &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>Voor developers</h2>
<p class="section-sub">Bouw op het platform met de SDK's, CLI en MCP — de volledige gidsen staan in de SDK-documentatie.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">Beginner</span>
<h3>Quickstart: streaming chat met de Client SDK</h3>
<p>Installeer <code>@divinci-ai/client</code>, authenticeer en stream binnen enkele minuten uw eerste assistentantwoord in de browser.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">Volg de quickstart &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Beginner</span>
<h3>Beheer alles vanuit de terminal</h3>
<p>De Divinci CLI dekt workspaces, releases, kennisbanken en chat — scriptbaar voor zowel CI/CD als dagelijkse workflows.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">CLI-overzicht &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Beginner</span>
<h3>Verbind Claude of Cursor met uw assistent (MCP)</h3>
<p>Voeg <code>https://mcp.divinci.app/mcp</code> toe in de connector-UI van uw AI-tool, autoriseer met OAuth, en de kennis en tools van uw assistent zijn beschikbaar in Claude, Cursor en andere MCP-clients.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">Verbinden via MCP &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Gevorderd</span>
<h3>Deploy een afgeschermde landingspagina-chat op Cloudflare Workers</h3>
<p>Lever een landingspagina op met ingebouwde assistentchat achter uw eigen toegangspoort, draaiend aan de edge op Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Cloudflare Workers-gids &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Gevorderd</span>
<h3>Publiceer uw release als eigen MCP-server</h3>
<p>Maak van een gepubliceerde release een white-label MCP-server die uw klanten aan hun eigen AI-tools kunnen toevoegen.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">White-label MCP-servers &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>Kwaliteit &amp; vertrouwen</h2>
<p class="section-sub">Meet de antwoorden van uw assistent en bepaal welke modelproviders ze leveren.</p>

<div class="guide-block">
<h3>Beoordeel uw assistent met QA-suites en AutoFix <span class="level-badge level-intermediate">Gemiddeld</span></h3>
<p class="guide-intro">QA-suites voeren gestructureerde tests uit op een release en geven de antwoorden een score, zodat kwaliteit wordt gemeten — niet aangenomen.</p>
<ol>
<li>Maak een QA-suite door zelf testcases te schrijven, of genereer tests automatisch op basis van de bestanden in uw kennisbank.</li>
<li>Voer de suite uit op een release — concept of gepubliceerd.</li>
<li>Bekijk de scores om te zien welke vragen de assistent goed heeft afgehandeld en waar het tekortschoot.</li>
<li>Pas <strong>AutoFix</strong> toe om Divinci configuratiewijzigingen te laten voorstellen die de fouten aanpakken, en voer de suite opnieuw uit om de verbetering te bevestigen.</li>
</ol>
<a href="/quality-assurance/" class="card-link">Meer over quality assurance &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA in de Server SDK &rarr;</a>
</div>

<div class="guide-block">
<h3>Gebruik uw eigen modelsleutels (BYOK) <span class="level-badge level-intermediate">Gemiddeld</span></h3>
<p class="guide-intro">Gebruik uw eigen provideraccounts — uw rate limits, uw facturering, uw dataovereenkomsten — in plaats van de gedeelde sleutels van Divinci.</p>
<ol>
<li>Open uw workspace-instellingen en ga naar modelsleutels.</li>
<li>Voeg een API-sleutel toe voor uw provider (bijvoorbeeld OpenAI of Anthropic).</li>
<li>Selecteer uw sleutel bij het configureren van een release — modelaanroepen voor die release lopen nu via uw account.</li>
<li>Roteer of verwijder sleutels op elk moment; releases vallen terug op platformsleutels als u de uwe verwijdert.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>Spraak</h2>
<p class="section-sub">Assistenten hoeven niet alleen tekst te zijn.</p>

<div class="guide-block">
<h3>Geef uw assistent een stem <span class="level-badge level-intermediate">Gemiddeld</span></h3>
<p class="guide-intro">Schakel tekst-naar-spraak in op een release, zodat antwoorden hardop kunnen worden uitgesproken.</p>
<ol>
<li>Open uw releaseconfiguratie en schakel <strong>tekst-naar-spraak</strong> in.</li>
<li>Kies een stem uit de ingebouwde opties (Deepgram Aura- en Cartesia-stemmen zijn beschikbaar), of kloon een eigen stem.</li>
<li>Test in de dashboardchat en publiceer daarna — de widget en SDK-oppervlakken kunnen antwoorden nu uitspreken.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Klaar om te bouwen?</h2>
<p>Maak gratis uw eerste assistent, of praat met ons over uw use case.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">Vraag een demo aan</a>
<a href="/docs/" class="cta-secondary">Developer-documentatie</a>
</div>
</section>
</div>
