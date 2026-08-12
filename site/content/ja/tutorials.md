+++
title = "チュートリアル"
description = "Divinci AI のステップバイステップチュートリアル — 最初のアシスタントの公開、ナレッジベースの構築、サイトへのチャット埋め込み、SDK・CLI との統合、QA スイートの実行、アシスタントへの音声機能の追加。"
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
<h1>チュートリアル</h1>
<p class="subtitle">Divinci AI プラットフォームの実践的なステップバイステップガイド — ダッシュボードでの最初のアシスタント公開から、開発者向け統合、QA パイプライン、音声機能の実装まで。</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>まずはここから</h2>
<p class="section-sub">コードは不要です。これらのウォークスルーは Divinci ダッシュボードだけで完結します。</p>

<div class="guide-block">
<h3>最初のアシスタントを作成して公開する <span class="level-badge level-beginner">初級</span></h3>
<p class="guide-intro">Divinci ではアシスタントを「リリース」としてパッケージ化します。ドラフトを設定して公開し、その後の変更はすべて公開済みバージョンからフォークした新しいドラフトになるため、いつでもロールバックできます。</p>
<ol>
<li>ダッシュボードにサインインし、ワークスペースを開きます(または新規作成します)。</li>
<li>新しい<strong>ドラフトリリース</strong>を作成します — ドラフトは非公開で、自由に編集できます。</li>
<li>アシスタントを動かすモデルを選択します。</li>
<li>アシスタントを設定します。システムインストラクション、会話スターター、必要に応じてナレッジベースを添付します。</li>
<li>組み込みのチャットでドラフトをテストし、期待どおりの応答になるまで調整します。</li>
<li>リリースを<strong>公開</strong>して、ユーザーや統合先で利用できるようにします。</li>
<li>後で改善する場合は、公開済みリリースを新しいドラフトとしてフォークし、変更して再度公開します — 以前のバージョンはそのまま残ります。</li>
</ol>
<a href="/release-management/" class="card-link">リリース管理の詳細はこちら &rarr;</a>
</div>

<div class="guide-block">
<h3>自分のファイルからナレッジベースを構築する <span class="level-badge level-beginner">初級</span></h3>
<p class="guide-intro">アシスタントを自社のコンテンツに基づかせることで、推測ではなくドキュメントの内容から回答できるようになります。</p>
<ol>
<li>ワークスペースでナレッジベースのセクションを開き、新しいコレクションを作成します。</li>
<li>ドキュメントをアップロードします — PDF、オフィス文書、テキストファイルに対応しています。</li>
<li>インデックス作成の完了を待ちます。各ドキュメントは自動的にチャンク分割・埋め込み処理されます。</li>
<li>コレクションをドラフトリリースに添付します。</li>
<li>ドキュメントにしか答えられない質問をドラフトに投げて検索が機能することを確認し、公開します。</li>
</ol>
<div class="guide-note">ファイルアップロード以外にも、ナレッジベースは生テキスト、音声録音(自動文字起こし)、商品カタログ、Dropbox のファイルを取り込めます。</div>
</div>

<div class="guide-block">
<h3>URL クロールでウェブサイトを取り込む <span class="level-badge level-beginner">初級</span></h3>
<p class="guide-intro">Divinci に自社のウェブサイトを指定するだけで、ページの内容をアシスタントの知識に変換できます — エクスポート作業は不要です。</p>
<ol>
<li>ナレッジベースで、ウェブソースの追加を選択します。</li>
<li>URL を入力します — 単一ページのスクレイピングも、開始 URL からのサイト全体のクロールも可能です。</li>
<li>クロールが完了したら、抽出されたチャンクを確認し、不要なものを削除します。</li>
<li>コレクションをリリースに添付し、サイトの内容に関する質問でテストします。</li>
</ol>
<div class="guide-note">クロール自体が完了した後もインデックス作成はバックグラウンドで継続します — 非常に大規模なサイトでは、すべてのページが検索可能になるまで少し時間がかかる場合があります。</div>
</div>

<div class="guide-block">
<h3>チャットウィジェットをサイトに埋め込む <span class="level-badge level-beginner">初級</span></h3>
<p class="guide-intro">リリースを公開したら、script タグ 1 つで、どんなウェブサイトにもフルブランド対応のチャットウィジェットを設置できます。</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">ウィジェットは応答のストリーミング、RAG コンテキストの表示に対応し、カラー・配置・会話スターターなどのホワイトラベルカスタマイズが可能です。</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">埋め込みウィジェットのドキュメント &rarr;</a>
</div>

<div class="guide-block">
<h3>匿名の訪問者にクォータ付きでチャットを開放する <span class="level-badge level-intermediate">中級</span></h3>
<p class="guide-intro">アカウントを持たない訪問者にもアシスタントを開放できます。訪問者はメールアドレスを確認し、Cloudflare Turnstile チェックを通過したうえで、設定した 1 日あたりのクォータ内でチャットします — 利用量と不正利用を常にコントロールできます。</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">匿名訪問者チャットの実装例 &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>開発者向け</h2>
<p class="section-sub">SDK、CLI、MCP でプラットフォーム上に構築しましょう — 詳細なガイドは SDK ドキュメントにあります。</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">初級</span>
<h3>クイックスタート: Client SDK でストリーミングチャット</h3>
<p><code>@divinci-ai/client</code> をインストールして認証し、数分でブラウザ上に最初のアシスタント応答をストリーミングします。</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">クイックスタートを見る &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">初級</span>
<h3>ターミナルからすべてを管理する</h3>
<p>Divinci CLI はワークスペース、リリース、ナレッジベース、チャットをカバーし、CI/CD にも日常のワークフローにもスクリプトで組み込めます。</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">CLI 概要 &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">初級</span>
<h3>Claude や Cursor をアシスタントに接続する (MCP)</h3>
<p>お使いの AI ツールのコネクタ UI に <code>https://mcp.divinci.app/mcp</code> を追加し、OAuth で認可すれば、アシスタントの知識とツールを Claude、Cursor などの MCP クライアント内で利用できます。</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">MCP で接続する &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">上級</span>
<h3>Cloudflare Workers にゲート付きランディングページチャットをデプロイする</h3>
<p>独自のゲートの内側にアシスタントチャットを組み込んだランディングページを、Cloudflare Workers のエッジ上で公開します。</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Cloudflare Workers ガイド &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">上級</span>
<h3>リリースを独自の MCP サーバーとして公開する</h3>
<p>公開済みリリースをホワイトラベルの MCP サーバーに変え、顧客が自分の AI ツールに追加できるようにします。</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">ホワイトラベル MCP サーバー &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>品質と信頼</h2>
<p class="section-sub">アシスタントの回答を計測し、それを提供するモデルプロバイダーをコントロールしましょう。</p>

<div class="guide-block">
<h3>QA スイートと AutoFix でアシスタントをスコアリングする <span class="level-badge level-intermediate">中級</span></h3>
<p class="guide-intro">QA スイートはリリースに対して構造化されたテストを実行し、回答をスコアリングします。品質を思い込みではなく、計測で確かめられます。</p>
<ol>
<li>テストケースを自分で書くか、ナレッジベース内のファイルからテストを自動生成して、QA スイートを作成します。</li>
<li>リリース(ドラフトでも公開済みでも)に対してスイートを実行します。</li>
<li>スコアを確認し、アシスタントがうまく答えられた質問と不十分だった箇所を把握します。</li>
<li><strong>AutoFix</strong> を適用すると、Divinci が失敗を解消する設定変更を提案します。その後スイートを再実行して改善を確認します。</li>
</ol>
<a href="/quality-assurance/" class="card-link">品質保証の詳細はこちら &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">Server SDK での QA &rarr;</a>
</div>

<div class="guide-block">
<h3>独自のモデルキーを持ち込む (BYOK) <span class="level-badge level-intermediate">中級</span></h3>
<p class="guide-intro">Divinci の共有キーの代わりに、自社のプロバイダーアカウントを使えます — レート制限、請求、データ契約をすべて自社のものにできます。</p>
<ol>
<li>ワークスペース設定を開き、モデルキーのセクションに移動します。</li>
<li>プロバイダー(例: OpenAI や Anthropic)の API キーを追加します。</li>
<li>リリースの設定時に自分のキーを選択します — そのリリースのモデル呼び出しは自社アカウント経由で実行されるようになります。</li>
<li>キーはいつでもローテーションや削除が可能です。キーを削除した場合、リリースはプラットフォームのキーにフォールバックします。</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>音声</h2>
<p class="section-sub">アシスタントはテキストだけにとどまりません。</p>

<div class="guide-block">
<h3>アシスタントに声を与える <span class="level-badge level-intermediate">中級</span></h3>
<p class="guide-intro">リリースでテキスト読み上げ(text-to-speech)を有効にすると、応答を音声で読み上げられるようになります。</p>
<ol>
<li>リリース設定を開き、<strong>テキスト読み上げ</strong>を有効にします。</li>
<li>組み込みのボイス(Deepgram Aura と Cartesia のボイスが利用可能)から選択するか、カスタムボイスをクローンします。</li>
<li>ダッシュボードのチャットでテストしてから公開します — ウィジェットと SDK の各サーフェスで応答の読み上げが可能になります。</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>構築を始めませんか?</h2>
<p>最初のアシスタントを無料で作成するか、ユースケースについてぜひご相談ください。</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">デモをリクエスト</a>
<a href="/docs/" class="cta-secondary">開発者ドキュメント</a>
</div>
</section>
</div>
