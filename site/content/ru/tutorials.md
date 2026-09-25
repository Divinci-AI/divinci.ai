+++
title = "Туториалы"
description = "Пошаговые туториалы по Divinci AI — опубликуйте первого ассистента, создайте базу знаний, встройте чат на свой сайт, интегрируйтесь через SDK и CLI, запускайте QA-наборы и дайте ассистенту голос."
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
<h1>Туториалы</h1>
<p class="subtitle">Практические пошаговые руководства по платформе Divinci AI — от публикации первого ассистента в панели управления до интеграций для разработчиков, QA-конвейеров и голоса.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>Начните здесь</h2>
<p class="section-sub">Без единой строки кода. Эти руководства полностью выполняются в панели управления Divinci.</p>

<div class="guide-block">
<h3>Создайте и опубликуйте первого ассистента <span class="level-badge level-beginner">Начальный</span></h3>
<p class="guide-intro">Release — это способ, которым Divinci упаковывает ассистента: вы настраиваете черновик, публикуете его, а каждое последующее изменение — новый черновик, ответвлённый от опубликованной версии, так что вы всегда можете откатиться.</p>
<ol>
<li>Войдите в панель управления и откройте (или создайте) рабочее пространство.</li>
<li>Создайте новый <strong>черновик Release</strong> — черновики приватны и полностью редактируемы.</li>
<li>Выберите модель, на которой будет работать ваш ассистент.</li>
<li>Настройте ассистента: системные инструкции, стартовые фразы для диалога и любую базу знаний, которую хотите подключить.</li>
<li>Тестируйте черновик во встроенном чате, пока ответы вас не устроят.</li>
<li><strong>Опубликуйте</strong> релиз, чтобы сделать его доступным вашим пользователям и интеграциям.</li>
<li>Чтобы внести изменения позже, ответвите опубликованный релиз в новый черновик, измените его и опубликуйте снова — предыдущие версии остаются доступными.</li>
</ol>
<a href="/release-management/" class="card-link">Подробнее об управлении релизами &rarr;</a>
</div>

<div class="guide-block">
<h3>Создайте базу знаний из ваших файлов <span class="level-badge level-beginner">Начальный</span></h3>
<p class="guide-intro">Обоприте ассистента на ваш собственный контент, чтобы он отвечал по вашим документам, а не гадал.</p>
<ol>
<li>В рабочем пространстве откройте раздел базы знаний и создайте новую коллекцию.</li>
<li>Загрузите документы — подходят PDF, офисные документы и текстовые файлы.</li>
<li>Дождитесь окончания индексации; каждый документ автоматически разбивается на фрагменты и векторизуется.</li>
<li>Подключите коллекцию к черновику релиза.</li>
<li>Задайте черновику вопрос, ответ на который есть только в ваших документах, чтобы убедиться, что поиск работает, — затем публикуйте.</li>
</ol>
<div class="guide-note">Помимо загрузки файлов, базы знаний могут принимать сырой текст, аудиозаписи (с автоматической транскрипцией), каталоги товаров и файлы из Dropbox.</div>
</div>

<div class="guide-block">
<h3>Импортируйте сайт через обход по URL <span class="level-badge level-beginner">Начальный</span></h3>
<p class="guide-intro">Укажите Divinci на ваш сайт и превратите его страницы в знания ассистента — без экспорта данных.</p>
<ol>
<li>В базе знаний выберите добавление веб-источника.</li>
<li>Введите URL — соберите одну страницу или обойдите весь сайт, начиная со стартового URL.</li>
<li>Когда обход завершится, просмотрите извлечённые фрагменты и удалите всё лишнее.</li>
<li>Подключите коллекцию к релизу и проверьте вопросами по содержимому вашего сайта.</li>
</ol>
<div class="guide-note">Индексация продолжается в фоне после завершения самого обхода — на очень крупных сайтах может пройти чуть больше времени, прежде чем каждая страница станет доступна для поиска.</div>
</div>

<div class="guide-block">
<h3>Встройте чат-виджет на свой сайт <span class="level-badge level-beginner">Начальный</span></h3>
<p class="guide-intro">Как только релиз опубликован, один тег script размещает полностью брендированный чат-виджет на любом сайте:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">Виджет транслирует ответы в потоке, показывает контекст RAG и поддерживает white-label-настройку — цвета, положение, стартовые фразы для диалога и многое другое.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">Документация по embed-виджету &rarr;</a>
</div>

<div class="guide-block">
<h3>Дайте анонимным посетителям чат с квотами <span class="level-badge level-intermediate">Средний</span></h3>
<p class="guide-intro">Откройте ассистента посетителям без учётной записи: они подтверждают адрес электронной почты, проходят проверку Cloudflare Turnstile и общаются в пределах заданных вами дневных квот — так вы контролируете использование и злоупотребления.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">Примеры чата для анонимных посетителей &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>Для разработчиков</h2>
<p class="section-sub">Стройте на платформе с помощью SDK, CLI и MCP — полные руководства находятся в документации SDK.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">Начальный</span>
<h3>Быстрый старт: потоковый чат с Client SDK</h3>
<p>Установите <code>@divinci-ai/client</code>, авторизуйтесь и получите первый потоковый ответ ассистента в браузере за несколько минут.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">Пройти быстрый старт &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Начальный</span>
<h3>Управляйте всем из терминала</h3>
<p>Divinci CLI охватывает рабочие пространства, релизы, базы знаний и чат — подходит и для скриптов в CI/CD, и для повседневной работы.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">Обзор CLI &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">Начальный</span>
<h3>Подключите Claude или Cursor к вашему ассистенту (MCP)</h3>
<p>Добавьте <code>https://mcp.divinci.app/mcp</code> в интерфейсе коннекторов вашего ИИ-инструмента, авторизуйтесь через OAuth — и знания и инструменты вашего ассистента станут доступны в Claude, Cursor и других MCP-клиентах.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">Подключение через MCP &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Продвинутый</span>
<h3>Разверните лендинг с чатом за собственным доступом на Cloudflare Workers</h3>
<p>Запустите лендинг со встроенным чатом ассистента за вашим собственным контролем доступа, работающий на границе сети на Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Руководство по Cloudflare Workers &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">Продвинутый</span>
<h3>Опубликуйте свой релиз как отдельный MCP-сервер</h3>
<p>Превратите опубликованный релиз в white-label MCP-сервер, который ваши клиенты смогут добавить в собственные ИИ-инструменты.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">White-label MCP-серверы &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>Качество и доверие</h2>
<p class="section-sub">Измеряйте ответы ассистента и управляйте тем, какие провайдеры моделей их обслуживают.</p>

<div class="guide-block">
<h3>Оценивайте ассистента с помощью QA-наборов и AutoFix <span class="level-badge level-intermediate">Средний</span></h3>
<p class="guide-intro">QA-наборы запускают структурированные тесты против релиза и выставляют оценки ответам — качество измеряется, а не предполагается.</p>
<ol>
<li>Создайте QA-набор, написав тест-кейсы самостоятельно, или сгенерируйте тесты автоматически из файлов вашей базы знаний.</li>
<li>Запустите набор против релиза — черновика или опубликованного.</li>
<li>Просмотрите оценки, чтобы увидеть, с какими вопросами ассистент справился хорошо, а где не дотянул.</li>
<li>Примените <strong>AutoFix</strong>, чтобы Divinci предложил изменения конфигурации, устраняющие провалы, затем повторно запустите набор и убедитесь в улучшении.</li>
</ol>
<a href="/quality-assurance/" class="card-link">Подробнее об обеспечении качества &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA в Server SDK &rarr;</a>
</div>

<div class="guide-block">
<h3>Используйте собственные ключи моделей (BYOK) <span class="level-badge level-intermediate">Средний</span></h3>
<p class="guide-intro">Работайте через собственные аккаунты провайдеров — ваши лимиты, ваш биллинг, ваши соглашения о данных — вместо общих ключей Divinci.</p>
<ol>
<li>Откройте настройки рабочего пространства и перейдите к ключам моделей.</li>
<li>Добавьте API-ключ вашего провайдера (например, OpenAI или Anthropic).</li>
<li>Выберите свой ключ при настройке релиза — вызовы моделей для этого релиза теперь идут через ваш аккаунт.</li>
<li>Ротируйте или удаляйте ключи в любой момент; при удалении вашего ключа релизы возвращаются к ключам платформы.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>Голос</h2>
<p class="section-sub">Ассистенты не обязаны быть только текстовыми.</p>

<div class="guide-block">
<h3>Дайте ассистенту голос <span class="level-badge level-intermediate">Средний</span></h3>
<p class="guide-intro">Включите синтез речи в релизе, чтобы ответы можно было озвучивать.</p>
<ol>
<li>Откройте конфигурацию релиза и включите <strong>синтез речи (text-to-speech)</strong>.</li>
<li>Выберите голос из встроенных вариантов (доступны голоса Deepgram Aura и Cartesia) или клонируйте собственный голос.</li>
<li>Протестируйте в чате панели управления и опубликуйте — виджет и SDK-интерфейсы теперь могут озвучивать ответы.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>Готовы строить?</h2>
<p>Создайте первого ассистента бесплатно или обсудите с нами ваш сценарий использования.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">Запросить демо</a>
<a href="/docs/" class="cta-secondary">Документация для разработчиков</a>
</div>
</section>
</div>
