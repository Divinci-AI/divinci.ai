+++
title = "Divinci AI で LLM CI/CD パイプラインを構築する方法"
description = "4段階の LLM リリースパイプライン: スライス単位の Spearman ゲート、p95 だけでなく出力品質を監視するカナリア、12 秒のアトミックロールバック、そしてすべての判断に対するコンプライアンスレシート。"
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Canary", "Rollback", "Evaluation Gates"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-veo31.webm"
hero_video_poster = "/images/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-hero-poster.webp"
reading_time = 10
summary = "従来の CI/CD パイプラインは、成果物が決定論的であることを前提としています。しかし、言語モデルはそうではありません。本記事では、Divinci AI で実際に運用しているパイプライン — 人間アンカー付きジャッジに対するスライス単位の Spearman ゲート、p95 だけでなく出力品質を監視するカナリア、約 12 秒のアトミックロールバック、そしてすべての判断に対するハッシュチェーン化されたリリースレシート(モデルがオープンウェイトの場合は vIndex ウェイトアテステーションを埋め込み)— を解説します。これら 4 つのうち 3 つは、2026 年時点でほかの LLM リリースツールではいずれも提供されていません。"
+++

*リリースサイクルからのノート — Part I*

---

LLM を通常の CI/CD パイプラインでリリースしようとした最初の試みでは、ビルドはグリーンに通り、デプロイは成功し、そして 7 分以内にカスタマーサポートにチケットが入り始めました。

「壊れた」ものは何もありません。4,200 件すべての統合テストはパスし、レイテンシも変わらず、200 OK のレートも安定していました。しかし、ある特定の種類の法務領域の質問について、新しいモデルがひっそりとヘッジを始めていたのです — 以前のバージョンが正しく答えていた質問にコミットせず、回答を避けるようになっていました。私たちはまだそのテストを書いていなかったため、どのテストもこれを検出できませんでした。

私たちはロールバックしましたが、そのロールバック自体がひとつのイベントでした。モデルアーティファクトは 3 つの場所に存在し、プロンプトテンプレートは 4 つ目の場所、ルーティングルールは 5 つ目の場所にあり、どれもお互いのことを知りませんでした。以前の良好な状態に戻すまでに 2 時間強かかりました。その間にヘッジ回答を受けた顧客は、お世辞にも満足したとは言えませんでした。

このパイプラインが存在する理由は、その障害にあります。以下は、私たち自身のリリースで実際に運用しているパイプラインであり、また顧客が自社のリリースに使えるよう Divinci API 経由で公開しているものです。**register、gate、roll、observe** の 4 段階で構成され、すべてのステップに、人間が起きていることを前提としないロールバック経路があります。

## 4 つの段階

<img src="/images/charts/divinci-cicd-pipeline.svg" alt="LLM 向け 4 段階 CI/CD パイプライン図。Stage 1 Register: モデルアーティファクト、プロンプトテンプレート、ルーティングルール、データセットバージョンを単一の署名済みリリースマニフェストにバンドル。Stage 2 Gate: scored-QA スイートに対する自動評価と、カテゴリ単位の Spearman しきい値ゲート。Stage 3 Roll: 5 → 25 → 100 パーセントのカナリアトラフィックランプ、各ステップでヘルスチェック。Stage 4 Observe: ドリフトモニター、出力品質モニター、しきい値違反時の自動ロールバック。各段階はリリース SHA で署名された監査ログエントリを発行。" width="900" height="380" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

各段階は意図的に厳格にしてあります。すべてのリリースは、この順序で各段階を通過します。評価をスキップする「ホットフィックス」経路は存在しません — 一度試して、結果は分かりました。

### Stage 1 — Register

リリースとは、モデルのウェイトファイル**ではありません**。リリースとは、以下をバンドルしたイミュータブルなマニフェストです:

- モデルアーティファクト(HF リポジトリ + コミット SHA、または vIndex パッチ)
- プロンプトテンプレート(すべての変数、すべてのシステムメッセージ)
- ルーティングルール(どのトラフィッククラスがどのバージョンに着地するか)
- ゲートしきい値の計算に使われたデータセットバージョン
- 直前のリリースの SHA(ロールバックを一意に決定するため)

```bash
curl -X POST https://api.divinci.ai/v1/releases \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{
    "model_ref": "Divinci-AI/gemma-4-e2b@a7c91f",
    "prompt_template_ref": "templates/legal-qa@v14",
    "routing": { "domain": "legal" },
    "dataset_version": "scored-qa-medical-v3",
    "previous_release": "rel_8f72b1"
  }'
# → { "release_id": "rel_a01c66", "manifest_sha256": "9abaeaf6..." }
```

マニフェスト SHA が、パイプライン内で誰もが扱う唯一のハンドルです。2 人が同じリリースだと思ってデプロイしようとしても、SHA が異なっていればパイプラインがそのデプロイを拒否します。このルールによって、これまでに 2 つのバグを未然に防ぎました。

### Stage 2 — Gate

ゲートこそ、ほとんどの CI パイプラインが取り違える部分です。Lighthouse 的なヒューリスティック — perplexity、BLEU、ROUGE — は、リグレッションがひとつのドメインに集中している場合、それをすり抜けさせてしまいます。集計スコアでは洗い流されてしまうのです。

Divinci のゲートは、リリースマニフェストとともに登録された scored-QA スイートを実行し、**カテゴリ単位**で Spearman しきい値を適用します:

<img src="/images/charts/divinci-cicd-gate-thresholds.svg" alt="6 つの法務サブドメインにおける、候補モデルとキャリブレーション済みの人間アンカー付きグレーダーとのカテゴリ単位 Spearman 順位相関を示す棒グラフ。契約書ドラフト 0.71、法令解釈 0.74、判例要約 0.69、規制コンプライアンス 0.66、管轄分析 0.62、IP ライセンス 0.41。点線のゲートしきい値は 0.65。IP ライセンスがしきい値を下回り、Gate-2 失敗をトリガー。6 カテゴリ全体の平均は 0.64 でわずかにしきい値以下だが、カテゴリ単位ビューによりどのサブドメインでリグレッションが起きたかが正確に特定できる。" width="900" height="420" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

上のチャートのリリースは、集計ゲートであれば通過してしまいます(平均 0.64 は「ほぼ十分」)。しかし Divinci のゲートでは失敗します。なぜなら IP ライセンスが従来の 0.68 から 0.41 へと急落しているからです — まさに、ノートブックでは決して捕捉できない局所的リグレッションです。

<aside style="background: rgba(184, 160, 128, 0.08); border-left: 3px solid #b8a080; padding: 0.7rem 1rem; margin: 0.8rem 0 1.5rem; font-size: 0.88rem; color: #4a4030;">
  <strong style="color: #1e3a2b;">チャートの数値について:</strong> サブドメイン単位の値は<em>形状を例示するためのもの</em>であり、公表された研究で測定された数値ではありません。ジャッジ対人間の Spearman ρ をこれらの特定の法務実務領域別に分解して報告している論文は公開されていません。近い参考として、<a href="https://arxiv.org/abs/2308.11462" target="_blank" rel="noopener">LegalBench (Guha et al., 2023)</a>(6 つの法的推論タイプにわたるタスク別精度)、および <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">MT-Bench (Zheng et al., 2023)</a>(全体で約 80% の GPT-4 対人間の一致、カテゴリ別には広い分散)を参照してください。独自の scored-QA スイートを運用する顧客は、自社のスライスに対する実数値を生成します。チャートの形状は、API が表面化する形を示しています。
</aside>

私たちは面白半分にスライス単位ゲートを発明したわけではありません。これは、現行の LLM ポストモーテムで直接名指しされている故障モードです。Tianpan の *"The Semver Lie"* の解説<sup><a href="#ref-6">[6]</a></sup>では、あるプロンプト変更が「コードレビューを通り、評価ゲートなしでデプロイされ、ユーザー単位の A/B なしで本番に到達し、自動ロールバックもトリガーされなかった」と記されています。このインシデントを単なる迷惑ではなく壊滅的なものにしたのは、リグレッションが集計では維持されていながら、ひとつのスライス — ひとつのユーザージャーニークラス — に集中していたことです。2026 年に調査したすべての LLM リリースツールは、単一のグローバルスコアでゲートを設けているか、まったくゲートしていないかのどちらかでした。ゲートをスライスしているものはひとつもありません。

ゲート失敗は、ソフトな警告では**ありません**。release_id は `gate_fail` としてマークされ、マニフェストはアーカイブされ、いかなる deploy コマンドもそれを受け付けません。コールドスタートのリリース — 比較対象となる過去の Spearman を持たない真新しいモデル — は、ワンタイムの `--force-gate-override` 経路を通り、そこには書面での理由付けが必須です。理由、ユーザー ID、`gate_override_sha256` がそのまま監査証跡に入ります。オーバーライドが存在するのは正当なケースがあるからで、監査証跡が存在するのは将来の自分がその理由を読む必要があるからです。

### Stage 3 — Roll

Divinci におけるカナリアとは、**5%、25%、100%** の 3 つのチェックポイントを意味します。各チェックポイントで、パイプラインは設定された滞留時間または設定されたリクエスト数のいずれか遅い方まで保持します。デフォルトは 5% で 4 分 / 1,000 リクエスト、25% で 15 分 / 10,000 リクエストです。

各チェックポイントで、3 つのモニターが基準を満たす必要があります:

1. **p95 レイテンシ**: 直前リリースの p95 の 1.2 倍以内
2. **5xx レート**: 直前リリースのレートの 1.5 倍以内
3. **出力品質モニター**: 最近の本番トレースを候補リリースに対して継続的にリプレイし、Stage 2 を駆動したのと同じキャリブレーション済みジャッジでスコアリング

3 つ目こそ、ほかのどのリリースパイプラインも提供していないものです。SageMaker、KServe、BentoML、Vertex AI — いずれもレイテンシとエラーレートを監視します。しかし、いま本番で問われている*実際の*質問に対する候補の出力をスコアリングするものはありません。候補はアクティブリリースが受け取ったのと同じプロンプトを受け取り、それを 5% のミラーで実行し、キャリブレーション済みグレーダーに対する候補回答の Spearman ρ を計測します。モデルが静かにヘッジしたり、拒否したり、ハルシネーションを起こしていても、5xx レートはクリーンなままになり得ます。実際にこれが起きるのを私たちは目撃しています。それを捕捉するのが、このトレースリプレイモニターです。

リプレイ集合には上限があり、コストを予測可能にするため、チェックポイントごとに各スライスにつき最近のトレースを 50 件に制限しています。5% トラフィック時点で、グレーディングには約 90 秒かかります。固定パーセンテージカナリアより遅く、顧客がチケットを起票するのを待つより速い、という塩梅です。

```bash
# roll コマンドは fire-and-forget です。パイプラインが自身で保持します。
curl -X POST https://api.divinci.ai/v1/releases/rel_a01c66/roll \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{ "strategy": "canary", "dwell_5pct_seconds": 240, "dwell_25pct_seconds": 900 }'
# → { "rollout_id": "rol_b3e2", "next_checkpoint_at": "2026-05-26T09:04:00Z" }
```

### Stage 4 — Observe、ロールバック、そしてレシート

この段階こそ、パイプラインの存在意義を成り立たせる段階です。

オブザーバーはロールアウト完了後も継続的に動作します。ローリング 5% のトレースリプレイサンプルで、分単位の出力品質スコアを計算します。スコアがロールバックしきい値(デフォルト: ゲートしきい値の 0.85 倍。ゲートが 0.65 なら 0.55)を 3 分連続で下回ると、ロールバックが自動的に発火します。ページャー呼び出しも、人間の判断も、議論もありません。

ロールバックそのものはひとつの命令です — ルーティングをマニフェストの `previous_release` に再ポイントすること。直前のリリースは完全にバンドルされたマニフェストだったため、ウェイト、プロンプト、ルーティング、データセット — すべてのコンポーネントがアトミックに切り替わります。

そしてレシートが発火します。

すべてのリリース判断 — register、gate-pass、gate-fail、gate-override、checkpoint-promote、checkpoint-hold、auto-rollback、manual-rollback — は、**リリースレシート**を発行します: JSON-with-SHA-256 形式のアーティファクトで、その顧客の前のレシート、およびそのリリースの前のレシートとハッシュチェーンで連結され、顧客が設定したスケジュールで外部に錨を打ち込みます。

リリースが**オープンウェイトモデル** — Gemma、Qwen、Llama、Mistral、GPT-OSS、ウェイトがアドレス指定可能で編集可能なあらゆるもの — に支えられている場合、レシートは [vIndex アテステーション](/ja/compliance/)を埋め込みます: 判断時点のアクティブなウェイトが、マニフェストに登録されたウェイトと一致することの暗号学的証明です。これが、より厳しいコンプライアンス要件(GDPR 第 17 条 忘れられる権利、EU AI Act の出所性)を満たす経路です。なぜなら、*何がデプロイされたか*だけでなく、*基盤となるウェイトが主張されたとおりのものであること*まで証明できるからです。

リリースが**クローズドウェイトモデル** — OpenAI、Anthropic、Google、不透明な API 経由でしか提供されないもの — に支えられている場合、レシートは引き続き判断の連鎖(どのマニフェスト、どのゲート結果、どのモニター読み取り値、どのユーザーがどのアクションをトリガーしたか)をカバーしますが、基盤ウェイトをアテストすることはできません。なぜなら、私たちにはそれが見えないからです。これはパイプラインの限界ではなく、プロバイダーがウェイトを公開しない場合に検証可能な範囲の限界です。この区別を重視する監査人は、レシート自体の中で正直な答えを得られます。

いずれにしても、現在の監査人はログを得ているだけです。このパイプラインを使えば、実際に証明可能なすべてに関する*証明*を得られます。市場でこれを提供している事業者はほかに見当たりませんでした。いずれは登場すると見ています — EU AI Act のタイムラインを考えれば、それは必然です。私たちはいま提供することを選びました。

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="ロールバック時間の水平棒グラフ、対数スケール(分)。Atlassian 2022 年 4 月の障害: サイト単位の復旧に 720 分(12 時間)。Cloudflare 2022 年 6 月 21 日の障害: リバートに 44 分。DORA エリートパフォーマーの障害デプロイ復旧しきい値: 60 分未満。AWS SageMaker カナリアデプロイメントガードレールのターミネーション待機デフォルト: 10 分。Divinci のリリースマニフェスト経由の自動ルーティングフリップ: 12 秒。各バーラベルは、以下の参考文献の番号付き出典へのリンク。" style="width: 100%; height: auto; display: block;">
  <title>ロールバック時間 — 一次出典から測定された数値</title>
  <rect width="900" height="380" fill="#faf8f5"/>
  <text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">ロールバック時間 — 一次出典から測定された数値</text>
  <text x="40" y="56" font-size="12" fill="#6b5d4f">具体的なインシデントとプラットフォーム文書化された上限。推定値ではありません。各バーは以下の参考文献の出典にリンクしています。</text>
  <g stroke="#d4c8b0" font-size="10" fill="#8a7d68">
    <line x1="280" y1="320" x2="280" y2="80" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="860" y2="320" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="280" y2="325"/><text x="280" y="340" text-anchor="middle">0.1</text>
    <line x1="406" y1="320" x2="406" y2="325"/><text x="406" y="340" text-anchor="middle">1</text>
    <line x1="531" y1="320" x2="531" y2="325"/><text x="531" y="340" text-anchor="middle">10</text>
    <line x1="657" y1="320" x2="657" y2="325"/><text x="657" y="340" text-anchor="middle">100</text>
    <line x1="782" y1="320" x2="782" y2="325"/><text x="782" y="340" text-anchor="middle">1000</text>
    <line x1="406" y1="320" x2="406" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="531" y1="320" x2="531" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="657" y1="320" x2="657" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="782" y1="320" x2="782" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
  </g>
  <text x="570" y="360" font-size="11" fill="#6b5d4f" text-anchor="middle">分(対数スケール)</text>
  <g>
    <text x="272" y="103" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Atlassian, 2022年4月</text>
    <text x="272" y="117" text-anchor="end" font-size="10" fill="#6b5d4f">サイト単位の復旧</text>
    <rect x="280" y="91" width="484" height="32" fill="#a04848" rx="2"/>
    <text x="774" y="113" font-size="11" font-weight="600" fill="#1e3a2b">720 分<a href="#ref-1"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[1]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="158" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Cloudflare, 2022年6月</text>
    <text x="272" y="172" text-anchor="end" font-size="10" fill="#6b5d4f">設定リバート</text>
    <rect x="280" y="146" width="332" height="32" fill="#c87b3c" rx="2"/>
    <text x="622" y="168" font-size="11" font-weight="600" fill="#1e3a2b">44 分<a href="#ref-2"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[2]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="213" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">DORA エリート</text>
    <text x="272" y="227" text-anchor="end" font-size="10" fill="#6b5d4f">パフォーマー閾値</text>
    <rect x="280" y="201" width="349" height="32" fill="#b8a080" rx="2" opacity="0.6"/>
    <text x="639" y="223" font-size="11" font-weight="600" fill="#1e3a2b">&lt; 60 分<a href="#ref-3"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[3]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="268" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">AWS SageMaker</text>
    <text x="272" y="282" text-anchor="end" font-size="10" fill="#6b5d4f">ターミネーション待機デフォルト</text>
    <rect x="280" y="256" width="251" height="32" fill="#7a9580" rx="2"/>
    <text x="541" y="278" font-size="11" font-weight="600" fill="#1e3a2b">10 分<a href="#ref-4"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[4]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="320" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="700">Divinci 自動</text>
    <text x="272" y="334" text-anchor="end" font-size="10" fill="#2d5a4f">マニフェスト経由のルーティングフリップ</text>
    <line x1="280" y1="328" x2="318" y2="328" stroke="#2d5a4f" stroke-width="14" stroke-linecap="butt"/>
    <text x="328" y="332" font-size="11" font-weight="700" fill="#2d5a4f">12 秒<a href="#ref-5"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[5]</tspan></a></text>
  </g>
</svg>
</figure>

これらは私たちの数値ではありません — 実際のポストモーテム、プラットフォーム文書、および DORA フレームワークの公開された一次出典の数値です。このコントラストこそが Divinci の設計を動機づけています。Atlassian の 2022 年 4 月の障害<sup><a href="#ref-1">[1]</a></sup>がサイトあたり 12 時間かかったのは、状態が複数のシステムにまたがって分散しており、それらを再び整合させるために調整が必要だったからです。Cloudflare の 2022 年 6 月の障害<sup><a href="#ref-2">[2]</a></sup>がリバートに 44 分かかったのは、彼ら自身の言葉によれば、エンジニアたちが互いのリバート作業を踏みつぶし合ったからです。AWS SageMaker のカナリアデプロイメントガードレール<sup><a href="#ref-4">[4]</a></sup>は、ロールバックが完全に完了するまでにデフォルトで 10 分のターミネーション待機を文書化しています。DORA<sup><a href="#ref-3">[3]</a></sup> の障害デプロイ復旧におけるエリートしきい値は「1 時間未満」 — これはハイパフォーマンスな組織が超えるべきバーであって、上限ではありません。

12 秒も魔法の数字ではありません。ルーティングレイヤーがインフライトのリクエストをドレインし、アクティブマニフェストをスワップし、新しい状態をリージョン間で ACK するのに必要な時間です。遅いのはインフライトドレインです。生成途中のレスポンスをドロップしない限り、これより速い経路はありません。

## ほかの LLM リリースツールにはなくて、これにはあるもの

このパイプラインを構築する前、2026 年に他の 12 のツールを調査しました — LangSmith Deployment、W&B Models、MLflow、SageMaker Deployment Guardrails、Vertex AI Endpoints、Seldon Core、BentoCloud、KServe、Humanloop、Braintrust、Patronus AI、Arize Phoenix。これらは、噛み合わない 2 つの陣営にクラスタリングされます。

**eval-CI 陣営** — Braintrust、Humanloop、Patronus — は、オフライン評価スコアで PR マージをゲートします。稼働中のサービスには一切触れません。本番でモデルの品質が落ちると警告は出しますが、ロールバックは別の誰かがやらなければなりません。

**serving-canary 陣営** — SageMaker Deployment Guardrails、KServe、Vertex AI、BentoCloud、Seldon Core — はトラフィックを分割し、自動ロールバックを行います。しかしいずれも、トリガーするのはインフラメトリクス、つまり p99 レイテンシ、エラーレート、CloudWatch アラームです。品質リグレッションで自動ロールバックするものはひとつもありません。彼らにはできません。なぜなら、本番出力に対してジャッジを走らせていないからです。

「PR マージ時に評価をパスした」と「実際に重要なユーザージャーニーで本番カナリアをスコアリングする」の間の縫い目は、現状すべてのチームが手作業で橋渡しせざるを得ない手動の引き継ぎです。冒頭のブログ記事は、これを 2026 年における支配的な故障モードだと指摘しています<sup><a href="#ref-6">[6]</a></sup>。私たちはそれを閉じました。具体的には:

1. **ゲートをスライス化している。** 単一のグローバルスコアではなく、人間アンカー付きグレーダーに対するドメイン単位の Spearman ρ。スライス盲目性こそ、ほかのすべてのゲートが抱える問題です。
2. **カナリアが p95 だけでなく出力品質を監視する。** 候補に対する継続的なトレースリプレイを、ゲートを駆動したのと同じジャッジでスコアリング。これが欠落していた縫い目です。
3. **すべての判断がリリースレシートを発行する。** ハッシュチェーン化され、外部に錨を打ち込み可能で、コンプライアンスページを支えるのと同じ JSON-with-SHA-256 形式。オープンウェイトモデルバッキング — Gemma、Qwen、Llama、Mistral、GPT-OSS — の場合、レシートは vIndex ウェイトアテステーションを埋め込み、監査人はライブのウェイトが実際に何であったかを証明できます。クローズド API バッキングの場合、レシートは判断の連鎖をカバーしますが、プロバイダーがウェイトを公開していないため、ウェイトの出所性を主張することはできません。いずれの場合も、監査人は単なるログではなく、実際に証明可能なものの証明を得ます。

それだけです。汎用カナリア、バージョンレジストリ、インフラメトリクスベースのロールバック — それらはコモディティです。私たちは汎用カナリアを書いたのではありません。

## このパイプラインが解決*しない*こと

正直な制約を 3 つ挙げます:

**ゲートはデータセットの良さ次第。** 顧客が実際に使っているドメインをカバーしていない scored-QA スイートは、そのドメインのリグレッションを捕捉できません。これを 2 度目撃しました。どちらの場合も、顧客の最初の動きはモデルを変えることではなく、新しい scored-QA スイートを出荷することでした。これが正しい動きです。

**ロールバックは直前リリースが良好であることを前提とする。** リグレッションが 3 リリース連続で本番にあり、誰も気付かなかった場合、1 リリース戻しても、わずかにマシなモデルを買えるだけです。監査証跡はここで役立ちます — SHA で任意の過去マニフェストにロールバックでき、N-1 に限定されません。

**コールドスタートのリリースはカナリアをバイパスする。** 比較対象の本番トラフィックを持たない真新しいモデルは、意味のあるカナリアができません。代わりに 24 時間のシャドウデプロイメントを強制し、出力を提供することなく観察します。これは時間がかかり、利便性も低い方法です。しかし、これが唯一の正直な答えでもあります。

## これを自前で動かす最小版

Divinci を使わずにこのようなものを立ち上げたい場合、最低限のバージョンはおおよそ次のとおりです:

1. モデル + プロンプト + ルーティング + データセットを単一のイミュータブルなアーティファクトとして保存し、コンテンツハッシュでアドレス指定するレジストリ
2. Spearman ρ で人間アンカーパネルに対してキャリブレーションされたジャッジ — そして、集計だけでなく*スライス単位*のスコアを参照するゲート判断
3. チェックポイントで保持し、新鮮度に上限のある品質モニターを参照するトラフィックスプリッター — モニターは合成サンプルではなく*最近の本番トレースを候補にリプレイ*する
4. ウェイトだけでなくプロンプトテンプレートも含めて状態をアトミックにスワップできるルーティングレイヤー
5. すべてのリリース判断について、ハッシュチェーン化され外部に錨を打ち込めるレシートを発行する監査ログ — モデルがオープンウェイトの場合はウェイトアテステーションを埋め込み(クローズド API のリリースはウェイトレベルで物理的にアテスト不可能なため)

ほとんどのチームはすでに (1) と (3) を持っています。痛みを伴うのは (2)、(4)、(5) です。Divinci が存在する理由は、私たちがまず自分たちのためにこの 5 つすべてを構築し、その後、ほかの誰もがこれを必要とすることになると気付いたからです。

ビルドをスキップしたい場合は、[API リファレンスはこちら](/ja/api/)で、「Release Management」セクションのリリースエンドポイントが、このパイプラインの全表面です。コンプライアンス面 — それらの vIndex レシートがどのように見え、EU AI Act、GDPR 第 17 条、HIPAA、NIST AI RMF にどうマッピングされるか — は[コンプライアンスページ](/ja/compliance/)にあります。本記事のすべてのコマンドは、実在するエンドポイントです。

## 参考文献

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>。記事より: 「加速された Restoration 2 アプローチでは、サイトの復旧に約 12 時間を要した」。883 件の顧客サイトの完全復旧には 14 日かかった。状態がインフラ、バックアップ、サイト単位の検証にまたがって分散していることが、サイト単位の数値を分ではなく時間単位に押し上げる。
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>。投稿に逐語的に引用されているタイムライン: 「06:58: 根本原因を特定し理解。問題のある変更のリバートを開始… 07:42: 最後のリバートが完了」。「何をリバートすべきか分かった」から「リバートが完了した」までに 44 分。一部は、エンジニアが互いのリバート作業を踏みつぶし合ったため。
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>。「障害デプロイ復旧時間」のエリートパフォーマー閾値は 1 時間未満として文書化されている。DORA の過去レポートでは、低パフォーマーは数週間から数ヶ月で計測される。
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a> および関連の <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener"><em>Auto-Rollback Configuration and Monitoring</em> ページ</a>。例示の <code>TerminationWaitInSeconds</code> は 600(10 分)、<code>MaximumExecutionTimeoutInSeconds</code> は 1800(30 分)で上限。ベイキングウィンドウ内でアラームが発火するとロールバックが起動: 「ベイキング期間中にアラームのいずれかが発火した場合、SageMaker AI はロールバックを開始し、すべてのトラフィックは Blue フリートに戻る」。
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    Divinci AI — リリースマニフェスト経由のアトミックなルーティングフリップ。12 秒は約 100 レプリカのサービスにおけるインフライトドレイン時間。マニフェストスワップ自体はサブ秒。この数値はベンチマークではなく自社サービス由来。これを可能にするアーキテクチャは、上記(Stage 1 — Register)で説明したバンドルマニフェスト。
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em> (April 2026)</a>。記事は故障パターンを直接名指ししている: 「コードレビューを通り、評価ゲートなしでデプロイされ、ユーザー単位の A/B なしで本番に到達し、自動ロールバックもトリガーされなかった」。関連記事 — <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a> — では、現状のポストモーテムが体系的に省いているスライス / ジャーニー / ユーザー単位のフィールドを列挙している。
  </li>
</ol>

このチャートに含まれていないものについてのメモ。Kubernetes の `kubectl rollout undo` 時間は、`maxSurge` / `maxUnavailable` の設定と Pod のウォームアップに支配され、コマンド自体ではありません。上記 4 つの出典のように測定された数値を公開している一次資料を見つけられなかったため、推定値で埋めるのではなく省きました。

---

*シリーズ次回:* **カスタム LM で捕捉した 10 件の CI/CD リリース失敗と、パイプラインのどの段階が各々を捕捉するか。** 10 件のうち 3 件は、集計ゲートが見逃したであろうスライス単位のリグレッションです。さらに 2 件は、インフラメトリクスベースのカナリアが昇格させてしまったであろうサイレントな品質低下です。残りは、どのリリースパイプラインも本来捕捉すべき種類の故障モードです — これらを並べるのは、集計ゲートのパイプラインでも実際に自力で捕捉できるものはどれか、を明言する価値があるためです。
