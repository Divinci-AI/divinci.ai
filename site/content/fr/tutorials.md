+++
title = "Tutoriels"
description = "Tutoriels pas à pas pour Divinci AI — publiez votre premier assistant, construisez une base de connaissances, intégrez le chat sur votre site, développez avec le SDK et la CLI, exécutez des suites QA et donnez une voix à votre assistant."
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
<h1>Tutoriels</h1>
<p class="subtitle">Des guides pratiques, pas à pas, pour la plateforme Divinci AI — de la publication de votre premier assistant dans le tableau de bord jusqu'aux intégrations développeur, aux pipelines QA et à la voix.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>Commencez ici</h2>
<p class="section-sub">Aucun code requis. Ces parcours utilisent le tableau de bord Divinci de bout en bout.</p>

<div class="guide-block">
<h3>Créez et publiez votre premier assistant <span class="level-badge level-beginner">Débutant</span></h3>
<p class="guide-intro">Les Releases sont la façon dont Divinci package un assistant : vous configurez un brouillon, vous le publiez, et chaque modification ultérieure est un nouveau brouillon dérivé d'une version publiée — vous pouvez donc toujours revenir en arrière.</p>
<ol>
<li>Connectez-vous au tableau de bord et ouvrez (ou créez) un espace de travail.</li>
<li>Créez une nouvelle <strong>Release en brouillon</strong> — les brouillons sont privés et entièrement modifiables.</li>
<li>Choisissez le modèle qui alimente votre assistant.</li>
<li>Configurez l'assistant : instructions système, amorces de conversation, et toute base de connaissances que vous souhaitez y rattacher.</li>
<li>Testez le brouillon dans le chat intégré jusqu'à ce que les réponses vous conviennent.</li>
<li><strong>Publiez</strong> la release pour la mettre en ligne pour vos utilisateurs et vos intégrations.</li>
<li>Pour itérer ensuite, dérivez la release publiée en un nouveau brouillon, modifiez-le, puis publiez à nouveau — les versions précédentes restent disponibles.</li>
</ol>
<a href="/release-management/" class="card-link">En savoir plus sur la gestion des releases &rarr;</a>
</div>

<div class="guide-block">
<h3>Construisez une base de connaissances à partir de vos fichiers <span class="level-badge level-beginner">Débutant</span></h3>
<p class="guide-intro">Ancrez votre assistant dans votre propre contenu afin qu'il réponde à partir de vos documents au lieu de deviner.</p>
<ol>
<li>Dans votre espace de travail, ouvrez la section base de connaissances et créez une nouvelle collection.</li>
<li>Importez vos documents — les PDF, les documents bureautiques et les fichiers texte sont tous pris en charge.</li>
<li>Attendez la fin de l'indexation ; chaque document est découpé en fragments et vectorisé automatiquement.</li>
<li>Rattachez la collection à une release en brouillon.</li>
<li>Posez au brouillon une question à laquelle seuls vos documents peuvent répondre pour vérifier que la récupération fonctionne, puis publiez.</li>
</ol>
<div class="guide-note">Au-delà des fichiers importés, les bases de connaissances peuvent ingérer du texte brut, des enregistrements audio (transcrits automatiquement), des catalogues produits et des fichiers depuis Dropbox.</div>
</div>

<div class="guide-block">
<h3>Ingérez votre site web par crawl d'URL <span class="level-badge level-beginner">Débutant</span></h3>
<p class="guide-intro">Pointez Divinci vers votre site web et transformez ses pages en connaissances pour votre assistant — sans aucun export.</p>
<ol>
<li>Dans votre base de connaissances, choisissez d'ajouter une source web.</li>
<li>Saisissez une URL — extrayez une seule page, ou crawlez le site entier à partir d'une URL de départ.</li>
<li>Une fois le crawl terminé, passez en revue les fragments extraits et supprimez ce que vous ne souhaitez pas conserver.</li>
<li>Rattachez la collection à votre release et testez avec des questions issues du contenu de votre site.</li>
</ol>
<div class="guide-note">L'indexation se poursuit en arrière-plan après la fin du crawl lui-même — pour les très grands sites, il peut falloir un peu plus de temps avant que chaque page soit interrogeable.</div>
</div>

<div class="guide-block">
<h3>Intégrez le widget de chat sur votre site <span class="level-badge level-beginner">Débutant</span></h3>
<p class="guide-intro">Une fois une release publiée, une seule balise script suffit pour placer un widget de chat entièrement à votre marque sur n'importe quel site web :</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">Le widget diffuse les réponses en streaming, affiche le contexte RAG et prend en charge la personnalisation en marque blanche — couleurs, position, amorces de conversation, et plus encore.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">Documentation du widget d'intégration &rarr;</a>
</div>

<div class="guide-block">
<h3>Laissez les visiteurs anonymes discuter, avec des quotas <span class="level-badge level-intermediate">Intermédiaire</span></h3>
<p class="guide-intro">Ouvrez votre assistant aux visiteurs qui n'ont pas de compte : ils vérifient une adresse e-mail, passent un contrôle Cloudflare Turnstile et discutent dans la limite des quotas quotidiens que vous définissez — vous gardez ainsi la maîtrise de l'usage et des abus.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">Exemples de chat pour visiteurs anonymes &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>Pour les développeurs</h2>
<p class="section-sub">Développez sur la plateforme avec les SDK, la CLI et MCP — les guides complets se trouvent dans la documentation du SDK.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">Débutant</span>
<h3>Démarrage rapide : chat en streaming avec le SDK Client</h3>
<p>Installez <code>@divinci-ai/client</code>, authentifiez-vous et diffusez votre première réponse d'assistant dans le navigateur en quelques minutes.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">Suivre le démarrage rapide &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Débutant</span>
<h3>Gérez tout depuis le terminal</h3>
<p>La CLI Divinci couvre les espaces de travail, les releases, les bases de connaissances et le chat — scriptable aussi bien pour le CI/CD que pour vos workflows quotidiens.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">Vue d'ensemble de la CLI &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Débutant</span>
<h3>Connectez Claude ou Cursor à votre assistant (MCP)</h3>
<p>Ajoutez <code>https://mcp.divinci.app/mcp</code> dans l'interface de connecteurs de votre outil IA, autorisez via OAuth, et les connaissances et outils de votre assistant deviennent disponibles dans Claude, Cursor et les autres clients MCP.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">Se connecter via MCP &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Avancé</span>
<h3>Déployez un chat de page d'atterrissage à accès contrôlé sur Cloudflare Workers</h3>
<p>Livrez une page d'atterrissage avec un chat d'assistant intégré derrière votre propre contrôle d'accès, exécuté en périphérie sur Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Guide Cloudflare Workers &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Avancé</span>
<h3>Publiez votre release comme serveur MCP à part entière</h3>
<p>Transformez une release publiée en serveur MCP en marque blanche que vos clients peuvent ajouter à leurs propres outils IA.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">Serveurs MCP en marque blanche &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>Qualité &amp; confiance</h2>
<p class="section-sub">Mesurez les réponses de votre assistant et contrôlez quels fournisseurs de modèles les servent.</p>

<div class="guide-block">
<h3>Évaluez votre assistant avec les suites QA et AutoFix <span class="level-badge level-intermediate">Intermédiaire</span></h3>
<p class="guide-intro">Les suites QA exécutent des tests structurés contre une release et notent les réponses, pour que la qualité soit mesurée — et non supposée.</p>
<ol>
<li>Créez une suite QA en rédigeant vous-même les cas de test, ou générez les tests automatiquement à partir des fichiers de votre base de connaissances.</li>
<li>Exécutez la suite contre une release — brouillon ou publiée.</li>
<li>Passez en revue les scores pour voir quelles questions l'assistant a bien traitées et où il a échoué.</li>
<li>Appliquez <strong>AutoFix</strong> pour que Divinci propose des modifications de configuration corrigeant les échecs, puis relancez la suite pour confirmer l'amélioration.</li>
</ol>
<a href="/quality-assurance/" class="card-link">En savoir plus sur l'assurance qualité &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA dans le SDK Serveur &rarr;</a>
</div>

<div class="guide-block">
<h3>Apportez vos propres clés de modèles (BYOK) <span class="level-badge level-intermediate">Intermédiaire</span></h3>
<p class="guide-intro">Utilisez vos propres comptes fournisseurs — vos limites de débit, votre facturation, vos accords de traitement des données — au lieu des clés mutualisées de Divinci.</p>
<ol>
<li>Ouvrez les paramètres de votre espace de travail et accédez aux clés de modèles.</li>
<li>Ajoutez une clé API pour votre fournisseur (par exemple OpenAI ou Anthropic).</li>
<li>Sélectionnez votre clé lors de la configuration d'une release — les appels de modèles pour cette release passent désormais par votre compte.</li>
<li>Faites tourner ou supprimez vos clés à tout moment ; les releases reviennent aux clés de la plateforme si vous supprimez les vôtres.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>Voix</h2>
<p class="section-sub">Les assistants ne sont pas obligés de se limiter au texte.</p>

<div class="guide-block">
<h3>Donnez une voix à votre assistant <span class="level-badge level-intermediate">Intermédiaire</span></h3>
<p class="guide-intro">Activez la synthèse vocale sur une release pour que les réponses puissent être lues à voix haute.</p>
<ol>
<li>Ouvrez la configuration de votre release et activez la <strong>synthèse vocale</strong>.</li>
<li>Choisissez une voix parmi les options intégrées (les voix Deepgram Aura et Cartesia sont disponibles), ou clonez une voix personnalisée.</li>
<li>Testez dans le chat du tableau de bord, puis publiez — le widget et les surfaces SDK peuvent désormais énoncer les réponses.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Prêt à construire ?</h2>
<p>Créez votre premier assistant gratuitement, ou parlez-nous de votre cas d'usage.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">Demander une démo</a>
<a href="/docs/" class="cta-secondary">Documentation développeur</a>
</div>
</section>
</div>
