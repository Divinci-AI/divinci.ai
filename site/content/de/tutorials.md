+++
title = "Tutorials"
description = "Schritt-für-Schritt-Tutorials für Divinci AI — veröffentlichen Sie Ihren ersten Assistenten, bauen Sie eine Wissensdatenbank auf, betten Sie Chat auf Ihrer Website ein, integrieren Sie SDK und CLI, führen Sie QA-Suiten aus und geben Sie Ihrem Assistenten eine Stimme."
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
<p class="subtitle">Praxisnahe Schritt-für-Schritt-Anleitungen für die Divinci-AI-Plattform — vom Veröffentlichen Ihres ersten Assistenten im Dashboard bis zu Entwickler-Integrationen, QA-Pipelines und Sprachausgabe.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>Hier starten</h2>
<p class="section-sub">Kein Code erforderlich. Diese Anleitungen nutzen durchgehend das Divinci-Dashboard.</p>

<div class="guide-block">
<h3>Ihren ersten Assistenten erstellen und veröffentlichen <span class="level-badge level-beginner">Einsteiger</span></h3>
<p class="guide-intro">Releases sind die Art, wie Divinci einen Assistenten paketiert: Sie konfigurieren einen Entwurf, veröffentlichen ihn, und jede spätere Änderung ist ein neuer Entwurf, der von einer veröffentlichten Version abgezweigt wird — so können Sie jederzeit zurückrollen.</p>
<ol>
<li>Melden Sie sich im Dashboard an und öffnen (oder erstellen) Sie einen Workspace.</li>
<li>Erstellen Sie ein neues <strong>Release im Entwurfsstatus</strong> — Entwürfe sind privat und vollständig bearbeitbar.</li>
<li>Wählen Sie das Modell, das Ihren Assistenten antreibt.</li>
<li>Konfigurieren Sie den Assistenten: Systemanweisungen, Gesprächseinstiege und jede Wissensdatenbank, die Sie anhängen möchten.</li>
<li>Testen Sie den Entwurf im integrierten Chat, bis die Antworten stimmen.</li>
<li><strong>Veröffentlichen</strong> Sie das Release, um es für Ihre Nutzer und Integrationen live zu schalten.</li>
<li>Für spätere Iterationen zweigen Sie das veröffentlichte Release als neuen Entwurf ab, ändern ihn und veröffentlichen erneut — frühere Versionen bleiben verfügbar.</li>
</ol>
<a href="/release-management/" class="card-link">Mehr über Release-Management erfahren &rarr;</a>
</div>

<div class="guide-block">
<h3>Eine Wissensdatenbank aus Ihren Dateien aufbauen <span class="level-badge level-beginner">Einsteiger</span></h3>
<p class="guide-intro">Verankern Sie Ihren Assistenten in Ihren eigenen Inhalten, damit er aus Ihren Dokumenten antwortet, statt zu raten.</p>
<ol>
<li>Öffnen Sie in Ihrem Workspace den Bereich Wissensdatenbank und erstellen Sie eine neue Sammlung.</li>
<li>Laden Sie Ihre Dokumente hoch — PDFs, Office-Dokumente und Textdateien funktionieren alle.</li>
<li>Warten Sie, bis die Indexierung abgeschlossen ist; jedes Dokument wird automatisch in Abschnitte zerlegt und eingebettet.</li>
<li>Hängen Sie die Sammlung an ein Release im Entwurfsstatus an.</li>
<li>Stellen Sie dem Entwurf eine Frage, die nur Ihre Dokumente beantworten können, um zu prüfen, dass der Abruf funktioniert — dann veröffentlichen.</li>
</ol>
<div class="guide-note">Über Datei-Uploads hinaus können Wissensdatenbanken Rohtext, Audioaufnahmen (automatisch transkribiert), Produktkataloge und Dateien aus Dropbox aufnehmen.</div>
</div>

<div class="guide-block">
<h3>Ihre Website per URL-Crawl aufnehmen <span class="level-badge level-beginner">Einsteiger</span></h3>
<p class="guide-intro">Richten Sie Divinci auf Ihre Website und verwandeln Sie deren Seiten in Assistenten-Wissen — ganz ohne Exporte.</p>
<ol>
<li>Wählen Sie in Ihrer Wissensdatenbank, eine Web-Quelle hinzuzufügen.</li>
<li>Geben Sie eine URL ein — erfassen Sie eine einzelne Seite, oder crawlen Sie die gesamte Website ab einer Start-URL.</li>
<li>Wenn der Crawl abgeschlossen ist, prüfen Sie die extrahierten Abschnitte und entfernen alles, was Sie nicht möchten.</li>
<li>Hängen Sie die Sammlung an Ihr Release an und testen Sie mit Fragen zu Inhalten Ihrer Website.</li>
</ol>
<div class="guide-note">Die Indexierung läuft im Hintergrund weiter, nachdem der Crawl selbst abgeschlossen ist — bei sehr großen Websites kann es etwas länger dauern, bis jede Seite durchsuchbar ist.</div>
</div>

<div class="guide-block">
<h3>Das Chat-Widget auf Ihrer Website einbetten <span class="level-badge level-beginner">Einsteiger</span></h3>
<p class="guide-intro">Sobald ein Release veröffentlicht ist, bringt ein einziges Script-Tag ein vollständig gebrandetes Chat-Widget auf jede Website:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">Das Widget streamt Antworten, zeigt RAG-Kontext und unterstützt White-Label-Anpassung — Farben, Position, Gesprächseinstiege und mehr.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">Dokumentation zum Embed-Widget &rarr;</a>
</div>

<div class="guide-block">
<h3>Anonyme Besucher chatten lassen — mit Kontingenten <span class="level-badge level-intermediate">Fortgeschritten</span></h3>
<p class="guide-intro">Öffnen Sie Ihren Assistenten für Besucher ohne Konto: Sie verifizieren eine E-Mail-Adresse, bestehen eine Cloudflare-Turnstile-Prüfung und chatten innerhalb täglicher Kontingente, die Sie festlegen — so behalten Sie Nutzung und Missbrauch unter Kontrolle.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">Beispiele für anonymen Besucher-Chat &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>Für Entwickler</h2>
<p class="section-sub">Bauen Sie auf der Plattform mit den SDKs, der CLI und MCP — die vollständigen Anleitungen finden Sie in der SDK-Dokumentation.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">Einsteiger</span>
<h3>Schnellstart: Streaming-Chat mit dem Client-SDK</h3>
<p>Installieren Sie <code>@divinci-ai/client</code>, authentifizieren Sie sich und streamen Sie in wenigen Minuten Ihre erste Assistenten-Antwort im Browser.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">Zum Schnellstart &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Einsteiger</span>
<h3>Alles vom Terminal aus verwalten</h3>
<p>Die Divinci CLI deckt Workspaces, Releases, Wissensdatenbanken und Chat ab — skriptfähig für CI/CD und den täglichen Workflow gleichermaßen.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">CLI-Überblick &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Einsteiger</span>
<h3>Claude oder Cursor mit Ihrem Assistenten verbinden (MCP)</h3>
<p>Fügen Sie <code>https://mcp.divinci.app/mcp</code> in der Connector-Oberfläche Ihres KI-Tools hinzu, autorisieren Sie per OAuth — und das Wissen sowie die Tools Ihres Assistenten stehen in Claude, Cursor und anderen MCP-Clients zur Verfügung.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">Über MCP verbinden &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Experte</span>
<h3>Gated Landing-Page-Chat auf Cloudflare Workers deployen</h3>
<p>Liefern Sie eine Landing-Page mit integriertem Assistenten-Chat hinter Ihrem eigenen Zugangsschutz aus — am Edge auf Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Cloudflare-Workers-Anleitung &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Experte</span>
<h3>Ihr Release als eigenen MCP-Server veröffentlichen</h3>
<p>Verwandeln Sie ein veröffentlichtes Release in einen White-Label-MCP-Server, den Ihre Kunden in ihre eigenen KI-Tools einbinden können.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">White-Label-MCP-Server &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>Qualität &amp; Vertrauen</h2>
<p class="section-sub">Messen Sie die Antworten Ihres Assistenten und steuern Sie, welche Modellanbieter sie liefern.</p>

<div class="guide-block">
<h3>Ihren Assistenten mit QA-Suiten und AutoFix bewerten <span class="level-badge level-intermediate">Fortgeschritten</span></h3>
<p class="guide-intro">QA-Suiten führen strukturierte Tests gegen ein Release aus und bewerten die Antworten — Qualität wird gemessen, nicht angenommen.</p>
<ol>
<li>Erstellen Sie eine QA-Suite, indem Sie Testfälle selbst schreiben oder Tests automatisch aus den Dateien Ihrer Wissensdatenbank generieren lassen.</li>
<li>Führen Sie die Suite gegen ein Release aus — Entwurf oder veröffentlicht.</li>
<li>Prüfen Sie die Bewertungen, um zu sehen, welche Fragen der Assistent gut beantwortet hat und wo er Schwächen zeigte.</li>
<li>Wenden Sie <strong>AutoFix</strong> an, damit Divinci Konfigurationsänderungen vorschlägt, die die Fehler beheben — und führen Sie die Suite erneut aus, um die Verbesserung zu bestätigen.</li>
</ol>
<a href="/quality-assurance/" class="card-link">Mehr über Qualitätssicherung erfahren &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA im Server-SDK &rarr;</a>
</div>

<div class="guide-block">
<h3>Eigene Modell-Keys mitbringen (BYOK) <span class="level-badge level-intermediate">Fortgeschritten</span></h3>
<p class="guide-intro">Nutzen Sie Ihre eigenen Anbieter-Konten — Ihre Rate-Limits, Ihre Abrechnung, Ihre Datenvereinbarungen — statt der gepoolten Keys von Divinci.</p>
<ol>
<li>Öffnen Sie Ihre Workspace-Einstellungen und gehen Sie zu den Modell-Keys.</li>
<li>Fügen Sie einen API-Key Ihres Anbieters hinzu (zum Beispiel OpenAI oder Anthropic).</li>
<li>Wählen Sie Ihren Key beim Konfigurieren eines Releases — Modellaufrufe für dieses Release laufen nun über Ihr Konto.</li>
<li>Rotieren oder entfernen Sie Keys jederzeit; Releases fallen auf Plattform-Keys zurück, wenn Sie Ihre entfernen.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>Sprachausgabe</h2>
<p class="section-sub">Assistenten müssen nicht auf Text beschränkt sein.</p>

<div class="guide-block">
<h3>Ihrem Assistenten eine Stimme geben <span class="level-badge level-intermediate">Fortgeschritten</span></h3>
<p class="guide-intro">Aktivieren Sie Text-to-Speech für ein Release, damit Antworten laut vorgelesen werden können.</p>
<ol>
<li>Öffnen Sie Ihre Release-Konfiguration und aktivieren Sie <strong>Text-to-Speech</strong>.</li>
<li>Wählen Sie eine Stimme aus den integrierten Optionen (Deepgram-Aura- und Cartesia-Stimmen sind verfügbar) — oder klonen Sie eine eigene Stimme.</li>
<li>Testen Sie im Dashboard-Chat und veröffentlichen Sie dann — Widget und SDK-Oberflächen können Antworten jetzt sprechen.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Bereit loszulegen?</h2>
<p>Erstellen Sie Ihren ersten Assistenten kostenlos — oder sprechen Sie mit uns über Ihren Anwendungsfall.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">Demo anfragen</a>
<a href="/docs/" class="cta-secondary">Entwicklerdokumentation</a>
</div>
</section>
</div>
