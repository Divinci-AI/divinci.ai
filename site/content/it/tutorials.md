+++
title = "Tutorial"
description = "Tutorial passo dopo passo per Divinci AI — pubblica il tuo primo assistente, costruisci una knowledge base, integra la chat sul tuo sito, lavora con SDK e CLI, esegui suite di QA e dai una voce al tuo assistente."
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
<h1>Tutorial</h1>
<p class="subtitle">Guide pratiche e passo dopo passo per la piattaforma Divinci AI — dalla pubblicazione del tuo primo assistente nella dashboard fino alle integrazioni per sviluppatori, alle pipeline di QA e alla voce.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>Inizia da qui</h2>
<p class="section-sub">Nessun codice richiesto. Queste guide usano la dashboard di Divinci dall'inizio alla fine.</p>

<div class="guide-block">
<h3>Crea e pubblica il tuo primo assistente <span class="level-badge level-beginner">Principiante</span></h3>
<p class="guide-intro">Le Release sono il modo in cui Divinci confeziona un assistente: configuri una bozza, la pubblichi, e ogni modifica successiva è una nuova bozza derivata da una versione pubblicata — così puoi sempre tornare indietro.</p>
<ol>
<li>Accedi alla dashboard e apri (o crea) un workspace.</li>
<li>Crea una nuova <strong>Release in bozza</strong> — le bozze sono private e completamente modificabili.</li>
<li>Scegli il modello che alimenta il tuo assistente.</li>
<li>Configura l'assistente: istruzioni di sistema, spunti di conversazione ed eventuali knowledge base da collegare.</li>
<li>Testa la bozza nella chat integrata finché le risposte non ti soddisfano.</li>
<li><strong>Pubblica</strong> la release per renderla attiva per i tuoi utenti e le tue integrazioni.</li>
<li>Per iterare in seguito, deriva una nuova bozza dalla release pubblicata, modificala e pubblica di nuovo — le versioni precedenti restano disponibili.</li>
</ol>
<a href="/release-management/" class="card-link">Scopri di più sul release management &rarr;</a>
</div>

<div class="guide-block">
<h3>Costruisci una knowledge base dai tuoi file <span class="level-badge level-beginner">Principiante</span></h3>
<p class="guide-intro">Ancora il tuo assistente ai tuoi contenuti, così risponde a partire dai tuoi documenti invece di tirare a indovinare.</p>
<ol>
<li>Nel tuo workspace, apri la sezione knowledge base e crea una nuova raccolta.</li>
<li>Carica i tuoi documenti — PDF, documenti office e file di testo funzionano tutti.</li>
<li>Attendi la fine dell'indicizzazione; ogni documento viene suddiviso in chunk e trasformato in embedding automaticamente.</li>
<li>Collega la raccolta a una release in bozza.</li>
<li>Poni alla bozza una domanda a cui solo i tuoi documenti possono rispondere per verificare che il retrieval funzioni, poi pubblica.</li>
</ol>
<div class="guide-note">Oltre al caricamento di file, le knowledge base possono acquisire testo grezzo, registrazioni audio (trascritte automaticamente), cataloghi di prodotti e file da Dropbox.</div>
</div>

<div class="guide-block">
<h3>Acquisisci il tuo sito web con il crawling degli URL <span class="level-badge level-beginner">Principiante</span></h3>
<p class="guide-intro">Punta Divinci al tuo sito web e trasforma le sue pagine in conoscenza per l'assistente — senza bisogno di esportazioni.</p>
<ol>
<li>Nella tua knowledge base, scegli di aggiungere una fonte web.</li>
<li>Inserisci un URL — acquisisci una singola pagina, oppure fai il crawling dell'intero sito partendo da un URL iniziale.</li>
<li>Al termine del crawling, rivedi i chunk estratti e rimuovi tutto ciò che non desideri.</li>
<li>Collega la raccolta alla tua release e verifica con domande basate sui contenuti del tuo sito.</li>
</ol>
<div class="guide-note">L'indicizzazione prosegue in background anche dopo la fine del crawling — per i siti molto grandi può servire un po' più di tempo prima che ogni pagina sia ricercabile.</div>
</div>

<div class="guide-block">
<h3>Integra il widget di chat sul tuo sito <span class="level-badge level-beginner">Principiante</span></h3>
<p class="guide-intro">Una volta pubblicata una release, un solo tag script inserisce un widget di chat completamente personalizzato su qualsiasi sito web:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">Il widget trasmette le risposte in streaming, mostra il contesto RAG e supporta la personalizzazione white-label — colori, posizione, spunti di conversazione e altro ancora.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">Documentazione del widget embed &rarr;</a>
</div>

<div class="guide-block">
<h3>Consenti la chat ai visitatori anonimi, con quote <span class="level-badge level-intermediate">Intermedio</span></h3>
<p class="guide-intro">Apri il tuo assistente ai visitatori che non hanno un account: verificano un indirizzo email, superano un controllo Cloudflare Turnstile e chattano entro le quote giornaliere che imposti — così mantieni il controllo su utilizzo e abusi.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">Esempi di chat per visitatori anonimi &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>Per gli sviluppatori</h2>
<p class="section-sub">Costruisci sulla piattaforma con gli SDK, la CLI e MCP — le guide complete si trovano nella documentazione degli SDK.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">Principiante</span>
<h3>Quickstart: chat in streaming con il Client SDK</h3>
<p>Installa <code>@divinci-ai/client</code>, autenticati e ricevi in streaming la prima risposta del tuo assistente nel browser in pochi minuti.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">Segui il quickstart &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Principiante</span>
<h3>Gestisci tutto dal terminale</h3>
<p>La CLI di Divinci copre workspace, release, knowledge base e chat — scriptabile sia per il CI/CD sia per i flussi di lavoro quotidiani.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">Panoramica della CLI &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Principiante</span>
<h3>Collega Claude o Cursor al tuo assistente (MCP)</h3>
<p>Aggiungi <code>https://mcp.divinci.app/mcp</code> nell'interfaccia connettori del tuo strumento AI, autorizza con OAuth, e la conoscenza e gli strumenti del tuo assistente saranno disponibili in Claude, Cursor e altri client MCP.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">Collega via MCP &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Avanzato</span>
<h3>Distribuisci una chat con accesso controllato su Cloudflare Workers</h3>
<p>Pubblica una landing page con chat dell'assistente integrata dietro il tuo controllo di accesso, in esecuzione all'edge su Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Guida a Cloudflare Workers &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Avanzato</span>
<h3>Pubblica la tua release come server MCP dedicato</h3>
<p>Trasforma una release pubblicata in un server MCP white-label che i tuoi clienti possono aggiungere ai loro strumenti AI.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">Server MCP white-label &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>Qualità e affidabilità</h2>
<p class="section-sub">Misura le risposte del tuo assistente e controlla quali provider di modelli le servono.</p>

<div class="guide-block">
<h3>Valuta il tuo assistente con le suite di QA e AutoFix <span class="level-badge level-intermediate">Intermedio</span></h3>
<p class="guide-intro">Le suite di QA eseguono test strutturati su una release e assegnano un punteggio alle risposte, così la qualità viene misurata — non data per scontata.</p>
<ol>
<li>Crea una suite di QA scrivendo tu stesso i casi di test, oppure genera i test automaticamente dai file della tua knowledge base.</li>
<li>Esegui la suite su una release — in bozza o pubblicata.</li>
<li>Rivedi i punteggi per capire quali domande l'assistente ha gestito bene e dove è rimasto indietro.</li>
<li>Applica <strong>AutoFix</strong> per far proporre a Divinci modifiche di configurazione che risolvano i fallimenti, poi riesegui la suite per confermare il miglioramento.</li>
</ol>
<a href="/quality-assurance/" class="card-link">Scopri di più sulla quality assurance &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA nel Server SDK &rarr;</a>
</div>

<div class="guide-block">
<h3>Porta le tue chiavi dei modelli (BYOK) <span class="level-badge level-intermediate">Intermedio</span></h3>
<p class="guide-intro">Usa i tuoi account provider — i tuoi rate limit, la tua fatturazione, i tuoi accordi sui dati — invece delle chiavi condivise di Divinci.</p>
<ol>
<li>Apri le impostazioni del tuo workspace e vai alle chiavi dei modelli.</li>
<li>Aggiungi una chiave API per il tuo provider (ad esempio OpenAI o Anthropic).</li>
<li>Seleziona la tua chiave durante la configurazione di una release — le chiamate ai modelli per quella release passeranno ora dal tuo account.</li>
<li>Ruota o rimuovi le chiavi in qualsiasi momento; se rimuovi le tue, le release tornano alle chiavi della piattaforma.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>Voce</h2>
<p class="section-sub">Gli assistenti non devono limitarsi al testo.</p>

<div class="guide-block">
<h3>Dai una voce al tuo assistente <span class="level-badge level-intermediate">Intermedio</span></h3>
<p class="guide-intro">Abilita la sintesi vocale su una release così le risposte possono essere pronunciate ad alta voce.</p>
<ol>
<li>Apri la configurazione della tua release e abilita il <strong>text-to-speech</strong>.</li>
<li>Scegli una voce tra le opzioni integrate (sono disponibili le voci Deepgram Aura e Cartesia), oppure clona una voce personalizzata.</li>
<li>Testa nella chat della dashboard, poi pubblica — il widget e le superfici SDK possono ora pronunciare le risposte.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Pronto a costruire?</h2>
<p>Crea gratuitamente il tuo primo assistente, oppure parla con noi del tuo caso d'uso.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">Richiedi una demo</a>
<a href="/docs/" class="cta-secondary">Documentazione per sviluppatori</a>
</div>
</section>
</div>
