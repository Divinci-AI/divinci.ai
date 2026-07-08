+++
title = "Tutoriales"
description = "Tutoriales paso a paso de Divinci AI — publique su primer asistente, construya una base de conocimiento, integre el chat en su sitio, use el SDK y la CLI, ejecute suites de QA y dele voz a su asistente."
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
<h1>Tutoriales</h1>
<p class="subtitle">Guías prácticas, paso a paso, para la plataforma Divinci AI — desde publicar su primer asistente en el panel de control hasta lanzar integraciones para desarrolladores, pipelines de QA y voz.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>Empiece aquí</h2>
<p class="section-sub">Sin necesidad de código. Estos recorridos usan el panel de Divinci de principio a fin.</p>

<div class="guide-block">
<h3>Cree y publique su primer asistente <span class="level-badge level-beginner">Principiante</span></h3>
<p class="guide-intro">Los Releases son la forma en que Divinci empaqueta un asistente: usted configura un borrador, lo publica, y cada cambio posterior es un nuevo borrador derivado de una versión publicada — así siempre puede volver atrás.</p>
<ol>
<li>Inicie sesión en el panel y abra (o cree) un espacio de trabajo.</li>
<li>Cree un nuevo <strong>Release en borrador</strong> — los borradores son privados y totalmente editables.</li>
<li>Elija el modelo que impulsará su asistente.</li>
<li>Configure el asistente: instrucciones de sistema, iniciadores de conversación y cualquier base de conocimiento que desee adjuntar.</li>
<li>Pruebe el borrador en el chat integrado hasta que las respuestas sean las adecuadas.</li>
<li><strong>Publique</strong> el release para que esté disponible para sus usuarios e integraciones.</li>
<li>Para iterar más adelante, derive el release publicado como un nuevo borrador, modifíquelo y publíquelo de nuevo — las versiones anteriores siguen disponibles.</li>
</ol>
<a href="/release-management/" class="card-link">Más sobre la gestión de releases &rarr;</a>
</div>

<div class="guide-block">
<h3>Construya una base de conocimiento a partir de sus archivos <span class="level-badge level-beginner">Principiante</span></h3>
<p class="guide-intro">Fundamente su asistente en su propio contenido para que responda a partir de sus documentos en lugar de adivinar.</p>
<ol>
<li>En su espacio de trabajo, abra la sección de base de conocimiento y cree una nueva colección.</li>
<li>Suba sus documentos — funcionan PDFs, documentos de oficina y archivos de texto.</li>
<li>Espere a que termine la indexación; cada documento se fragmenta y vectoriza automáticamente.</li>
<li>Adjunte la colección a un release en borrador.</li>
<li>Haga al borrador una pregunta que solo sus documentos puedan responder para confirmar que la recuperación funciona, y luego publique.</li>
</ol>
<div class="guide-note">Además de la carga de archivos, las bases de conocimiento pueden ingerir texto sin formato, grabaciones de audio (transcritas automáticamente), catálogos de productos y archivos desde Dropbox.</div>
</div>

<div class="guide-block">
<h3>Ingiera su sitio web mediante rastreo de URL <span class="level-badge level-beginner">Principiante</span></h3>
<p class="guide-intro">Apunte Divinci a su sitio web y convierta sus páginas en conocimiento para el asistente — sin necesidad de exportaciones.</p>
<ol>
<li>En su base de conocimiento, elija añadir una fuente web.</li>
<li>Introduzca una URL — extraiga una sola página, o rastree el sitio completo desde una URL inicial.</li>
<li>Cuando el rastreo termine, revise los fragmentos extraídos y elimine lo que no desee.</li>
<li>Adjunte la colección a su release y pruébelo con preguntas sobre el contenido de su sitio.</li>
</ol>
<div class="guide-note">La indexación continúa en segundo plano después de que el rastreo termina — en sitios muy grandes puede tardar un poco más hasta que todas las páginas sean localizables.</div>
</div>

<div class="guide-block">
<h3>Integre el widget de chat en su sitio <span class="level-badge level-beginner">Principiante</span></h3>
<p class="guide-intro">Una vez publicado un release, una sola etiqueta de script coloca un widget de chat con su marca en cualquier sitio web:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">El widget transmite las respuestas en streaming, muestra el contexto RAG y admite personalización white-label — colores, posición, iniciadores de conversación y más.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">Documentación del widget embebido &rarr;</a>
</div>

<div class="guide-block">
<h3>Permita chatear a visitantes anónimos, con cuotas <span class="level-badge level-intermediate">Intermedio</span></h3>
<p class="guide-intro">Abra su asistente a visitantes que no tienen cuenta: verifican una dirección de correo, pasan una comprobación de Cloudflare Turnstile y chatean dentro de cuotas diarias que usted define — para que mantenga el control del uso y el abuso.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">Ejemplos de chat para visitantes anónimos &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>Para desarrolladores</h2>
<p class="section-sub">Construya sobre la plataforma con los SDKs, la CLI y MCP — las guías completas están en la documentación del SDK.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">Principiante</span>
<h3>Inicio rápido: chat en streaming con el Client SDK</h3>
<p>Instale <code>@divinci-ai/client</code>, autentíquese y transmita su primera respuesta del asistente en el navegador en pocos minutos.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">Siga el inicio rápido &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Principiante</span>
<h3>Gestione todo desde la terminal</h3>
<p>La CLI de Divinci cubre espacios de trabajo, releases, bases de conocimiento y chat — programable tanto para CI/CD como para el trabajo diario.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">Visión general de la CLI &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Principiante</span>
<h3>Conecte Claude o Cursor a su asistente (MCP)</h3>
<p>Añada <code>https://mcp.divinci.app/mcp</code> en la interfaz de conectores de su herramienta de IA, autorice con OAuth, y el conocimiento y las herramientas de su asistente estarán disponibles dentro de Claude, Cursor y otros clientes MCP.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">Conectar vía MCP &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Avanzado</span>
<h3>Despliegue un chat de landing page con acceso controlado en Cloudflare Workers</h3>
<p>Lance una landing page con chat de asistente integrado detrás de su propio control de acceso, ejecutándose en el edge sobre Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Guía de Cloudflare Workers &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Avanzado</span>
<h3>Publique su release como su propio servidor MCP</h3>
<p>Convierta un release publicado en un servidor MCP white-label que sus clientes pueden añadir a sus propias herramientas de IA.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">Servidores MCP white-label &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>Calidad y confianza</h2>
<p class="section-sub">Mida las respuestas de su asistente y controle qué proveedores de modelos las sirven.</p>

<div class="guide-block">
<h3>Evalúe su asistente con suites de QA y AutoFix <span class="level-badge level-intermediate">Intermedio</span></h3>
<p class="guide-intro">Las suites de QA ejecutan pruebas estructuradas contra un release y puntúan las respuestas, de modo que la calidad se mide — no se supone.</p>
<ol>
<li>Cree una suite de QA escribiendo los casos de prueba usted mismo, o genere las pruebas automáticamente a partir de los archivos de su base de conocimiento.</li>
<li>Ejecute la suite contra un release — en borrador o publicado.</li>
<li>Revise las puntuaciones para ver qué preguntas manejó bien el asistente y dónde se quedó corto.</li>
<li>Aplique <strong>AutoFix</strong> para que Divinci proponga cambios de configuración que corrijan los fallos, y vuelva a ejecutar la suite para confirmar la mejora.</li>
</ol>
<a href="/quality-assurance/" class="card-link">Más sobre aseguramiento de calidad &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA en el Server SDK &rarr;</a>
</div>

<div class="guide-block">
<h3>Use sus propias claves de modelo (BYOK) <span class="level-badge level-intermediate">Intermedio</span></h3>
<p class="guide-intro">Utilice sus propias cuentas de proveedor — sus límites de uso, su facturación, sus acuerdos de datos — en lugar de las claves compartidas de Divinci.</p>
<ol>
<li>Abra la configuración de su espacio de trabajo y vaya a claves de modelo.</li>
<li>Añada una clave de API de su proveedor (por ejemplo OpenAI o Anthropic).</li>
<li>Seleccione su clave al configurar un release — las llamadas al modelo de ese release ahora pasan por su cuenta.</li>
<li>Rote o elimine claves en cualquier momento; los releases vuelven a las claves de la plataforma si usted elimina las suyas.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>Voz</h2>
<p class="section-sub">Los asistentes no tienen por qué ser solo de texto.</p>

<div class="guide-block">
<h3>Dele voz a su asistente <span class="level-badge level-intermediate">Intermedio</span></h3>
<p class="guide-intro">Active la conversión de texto a voz en un release para que las respuestas puedan reproducirse en voz alta.</p>
<ol>
<li>Abra la configuración de su release y active <strong>texto a voz</strong>.</li>
<li>Elija una voz entre las opciones integradas (hay voces de Deepgram Aura y Cartesia disponibles), o clone una voz personalizada.</li>
<li>Pruebe en el chat del panel y luego publique — el widget y las superficies del SDK ya pueden pronunciar las respuestas.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>¿Listo para construir?</h2>
<p>Cree su primer asistente gratis, o hable con nosotros sobre su caso de uso.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">Solicitar una demo</a>
<a href="/docs/" class="cta-secondary">Documentación para desarrolladores</a>
</div>
</section>
</div>
