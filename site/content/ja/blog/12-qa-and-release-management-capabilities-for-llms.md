+++
title = "カスタムLLMプラットフォームが備えるべき12のQA・リリース管理機能"
description = "LLMリリースプラットフォームを評価するための機能別チェックリスト。スライス対応ゲート、キャリブレーション済みジャッジ、アトミックロールバック、ハッシュチェーンレシート ― 飽和している領域、欠けている領域、そして陣営がどう分かれているか。"
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "私たちは自社のリリースパイプラインを構築する前に、12のLLMリリースプラットフォームを調査しました。市場は3つの陣営に分かれており、それぞれが完全には噛み合っていません ― 評価CIツール、サービングカナリアツール、可観測性ツール ― そしてその間にある欠けたシームこそが、まさに顧客向けリリースが必要としているものです。本記事は、その調査から生まれた機能チェックリストです。当社を含むあらゆるプラットフォームに適用できる、12の具体的なテストを紹介します。"
+++

*リリースサイクルからのノート ― 第3部*

---

1年前、私たちは自社のリリースパイプラインを構築する前に座って、本格的なLLMプラットフォームが備えるべきQA・リリース管理機能をすべて書き出しました。そして、そのリストに対して他の12のプラットフォームを評価しました ― LangSmith、MLflow、Weights & Biases、Braintrust、Humanloop、Patronus、Arize、Phoenix、Confident、Deepchecks、SageMaker Deployment Guardrails、KServe、BentoCloud、Vertex AI Endpoints、Seldon Coreです。12機能すべてを備えているところはありませんでした。実際に提供されている機能の組み合わせは、互いに完全には接していない3つの陣営にクラスタリングされていました。

本記事は、その結果として生まれた機能リストを汎用化したものです。各機能が4つのパイプラインステージのどこに属するか ― **登録 → ゲート → ロール → 観測** ― で整理されており、これまで書いてきた[パイプラインアーキテクチャ](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)と[障害モード](/ja/blog/10-ci-cd-release-failures-in-custom-language-models/)とすっきり組み合わせられます。ツールを評価する際には、このリストを上から下まで各候補に当てはめて作業してください。最も大きなギャップがあるものを見れば、それがどの陣営に属するかが分かります。

## 3つの陣営(何を見ているのかを知るために)

チェックリスト自体に入る前に、2026年の市場の姿を整理します。

- **評価CI陣営** ― Braintrust、Humanloop、Patronus。PRマージ時に自動評価器を実行し、悪いマージをブロックします。本番トラフィックには触れません。機能4〜6で強く、7〜12は欠けています。
- **サービングカナリア陣営** ― SageMaker Deployment Guardrails、KServe、Vertex AI Endpoints、BentoCloud、Seldon Core。トラフィックを分割し、インフラ指標を監視し、CloudWatch形式のアラームで自動ロールバックします。機能1、7、9で強く、機能8の品質側と機能10〜12は欠けています。
- **可観測性陣営** ― Arize Phoenix、Confident AI、Deepchecks。本番を監視し、人間にアラートを上げ、エスカレーションします。機能10(モニタリング)は強いものの、強制力はありません ― アラートは自動ロールバックではないからです。

これらの陣営の間 ― 「CIをパスした」と「品質ではなくレイテンシだけでなく品質でスコアリングされたライブカナリア」の間 ― は、誰もが手動で橋渡しせざるを得ない部分です。そのギャップを埋めることが、本記事における主要な主張です。

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="3つのLLMプラットフォーム陣営のベン図。評価CI陣営(Braintrust、Humanloop、Patronus)は左に位置し、PRマージ時のオフライン評価をカバーします。サービングカナリア陣営(SageMaker、KServe、Vertex、BentoCloud、Seldon)は右に位置し、インフラ指標ロールバックによるトラフィック分割をカバーします。可観測性陣営(Arize、Phoenix、Confident、Deepchecks)は下部に位置し、強制なしのモニタリングとアラートをカバーします。3つの円はペアごとに細い領域で重なりますが、3つすべてが交わる中央領域は空です。その空の中心が本記事の対象である欠けたシーム ― スライス単位の品質に基づき、ライブトラフィックでアトミックに強制されるリリース判断 ― です。">
<title>3つの陣営と欠けた中心</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">完全には噛み合わない3つの陣営</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">各陣営は1つの領域を担い、中心はすべてのチームが手で橋渡しする部分。</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">評価CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">PRマージ時の</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">オフライン評価ゲート</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">サービングカナリア</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">トラフィック分割 +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">インフラ指標ロールバック</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">可観測性</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">監視 + アラート(強制なし)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">欠けた</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">シーム</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">欠けたシーム:スライス単位の品質ゲート → インフラ指標ではなく出力品質によって駆動されるアトミックロールバック。</p>

## ステージ① ― 登録(Register)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">不変のマニフェスト層。SHAによる障害原因の特定。</span>
  </div>
</div>

### 機能1. コンテンツアドレッサブルなSHAを持つ不変のリリースマニフェスト

何か:リリースとはモデルの重みファイルではありません。リリースとは、*すべて* ― モデル成果物、プロンプトテンプレート、ルーティングルール、データセットバージョン、前処理バージョン ― を1つのSHA-256でアドレス指定する不変のバンドルです。「同じリリース」をデプロイする2人は、同じSHAを生成しなければならず、さもなければパイプラインは拒否します。

なぜ重要か:これがなければ、状態が3つのシステムに分割されている場合、「どの変更が本番を壊したのか?」に答えられません。Atlassianの2022年4月の障害<sup><a href="#ref-1">[1]</a></sup>では、まさに状態が独立してバージョン管理されたシステムに分散していて、再び合意状態に調整する必要があったため、サイトごとに復旧に12時間かかりました。

誰が提供しているか:サービングカナリア陣営が部分的に(モデル+ルーティング)、モデルレジストリ(MLflow、W&B Models<sup><a href="#ref-2">[2]</a></sup>)が部分的に(モデル成果物のみ)。**プロンプトテンプレート**をSHAにバンドルしているところはほぼ皆無であり、これはまさに最も頻繁に変更されるフィールドです。

### 機能2. すべてのリリースコンポーネントにわたるアトミックなバージョン管理

何か:リリースAからリリースBへの切り替えは、5回の別々のダッシュボード編集としてではなく、1つの命令で*すべて* ― 重み、プロンプト、ルーティング、データセット、前処理 ― を切り替えます。

なぜ重要か:部分的な切り替えは未定義動作のウィンドウを生み出します。プロンプトが更新されてもルーティングルールが更新されていない場合、新しいプロンプトと古いルーティングクラスでヒットするすべてのリクエストは、誰も計画していない状態にあります。

誰が提供しているか:完全には誰も。サービングカナリア陣営はモデルイメージをアトミックに切り替えますが、プロンプトとルーティングは通常別の場所にあります。マニフェスト駆動の切り替えこそが、Divinciのアトミックロールバック主張<sup><a href="#ref-5">[5]</a></sup>の根拠です。

### 機能3. 学習と提供環境のパリティ

何か:ゲート評価中に使用される前処理パイプラインは、本番サーバーが使用するのと*同じ*前処理です。これらが乖離すれば、すべてのオフライン数値は嘘になります。

なぜ重要か:学習・提供スキューは、私たちが書いてきた[10のリリース障害](/ja/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew)の1つです。症状は「評価では問題ないのに、本番では別のモデルのように動作する」というものです。治療法は、前処理をマニフェストに登録し、本番の前処理バージョンに対してゲートを行うことです。

誰が提供しているか:コンテナ化フレームワーク(BentoML、KServe)は、前処理をサービングと同居させることで部分的なクレジットを得ます。いずれも前処理を評価ゲート入力にバインドしていません。

## ステージ② ― ゲート(Gate)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">人間アンカーグレーダーに対するスライス単位のスピアマンρ。</span>
  </div>
</div>

### 機能4. スライス単位/ドメイン単位の品質ゲート

何か:ゲート判断は、単一の集約スコアではなく、*スライス単位*のスコア ― 契約書作成、法令解釈、IPライセンシングなど ― を消費します。1つのスライスでもしきい値を下回れば、平均がどう見えるかにかかわらず、リリースは`gate_fail`としてマークされます。

なぜ重要か:集約スコアは局所的なリグレッションを洗い流してしまいます。Tianpanの*セマンティックバージョニングの嘘*の記事<sup><a href="#ref-3">[3]</a></sup>では、これを2026年のLLMリリースにおける主要な障害モードと呼んでいます ― 平均では改善しているのに、ユーザージャーニーの1クラスで静かに崩壊しているモデルです。

誰が提供しているか:**2026年に他に提供しているところはありません**。評価CIツール ― Braintrust、Humanloop、Patronus ― は、単一のグローバルルーブリックまたはフラットなタスクリストに対してスコアリングします。スライス単位のしきい値もスライスブラインドのオーバーライドも公開していません。これが陣営が噛み合わない最初の場所です。

### 機能5. 人間アンカーキャリブレーション済みジャッジ(人間評価に対するスピアマンρ)

何か:このジャッジは汎用のLLM-as-judgeではありません。ドメイン専門家パネルに対するスピアマンρが、スライスごとに測定・設定されたLLMジャッジです。ジャッジは、評判が高いからではなく、その順位が人間の順位と一致するから選ばれます。

なぜ重要か:MT-Bench<sup><a href="#ref-6">[6]</a></sup>では、GPT-4-as-judgeは人間と全体で80%以上一致しますが、コーディング(86%)からライティング(36〜44%)まで、カテゴリーごとに分散があります。「全体的な一致」は、ジャッジが信頼できないスライスを隠してしまいます。スライスごとにジャッジをキャリブレーションすることこそが、自動スコアリングを信頼できるものにする唯一の誠実な方法です。

誰が提供しているか:Braintrust、Humanloop、Patronusはジャッジ評価器を実行します。しかし、いずれもスライス単位の人間アンカースピアマンキャリブレーションを要求・公開・永続化していません。Divinciのキャリブレーションパイプラインは[AIジャッジのキャリブレーション](/ja/blog/calibrating-the-ai-judge/)で文書化されています。

### 機能6. 必須の書面による理由付きのオーバーライドパス

何か:ゲート失敗の強制オーバーライド(コールドスタート、許容されるリグレッションなど)は許可されますが、`forceGateOverride: true` AND `overrideReason: "..."`の2つのフィールドを必要とします。理由はユーザーIDと共に監査証跡に記録されます。匿名のオーバーライドはありません。

なぜ重要か:ガバナンスゲートは別のコンプライアンス機能ではなく、ゲートステージそのものの特性です。監査証跡は「このオーバーライドが使われたか?」だけでなく、「その時点での理由は何だったか?」にも答えなければなりません ― 将来の自分がそれを読む必要があるからです。

誰が提供しているか:評価CIツールはフラグを持っていますが、いずれもオーバーライドの構造的な一部として理由を要求していません。

## ステージ③ ― ロール(Roll)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">5% → 25% → 100%のカナリア、各ステップに品質モニター。</span>
  </div>
</div>

### 機能7. 滞留時間付きのマルチチェックポイントカナリア

何か:トラフィックは少なくとも3つのチェックポイント ― 通常**5% → 25% → 100%** ― を経て0%から本番に移動し、各チェックポイントで、設定された滞留時間または設定されたリクエスト数のいずれか*後*の時点まで保持されます。0%から100%への即時切り替えはありません。

なぜ重要か:ロングテールのバグはスケール時に表面化します。会話の0.3%に影響するバグは、100プロンプトの評価では見えませんが、本番トラフィックの5%では明らかになります。滞留時間こそがカナリアにロングテールを観察する時間を与えるものです。

誰が提供しているか:サービングカナリア陣営が提供しています。AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup>はデフォルトの`TerminationWaitInSeconds`を600秒(10分)と文書化しています。KServe、BentoCloud、Seldon、Vertexはすべて同様のマルチステップカナリア設定を公開しています。これは飽和した機能です。

### 機能8. 各カナリアチェックポイントでの出力品質モニター

何か:各チェックポイントで、パイプラインは進行する前に3つのモニター ― p95レイテンシ、5xx率、**そして**機能5の同じキャリブレーション済みジャッジが計算する出力品質スコア ― をチェックします。レイテンシと5xxだけでは十分ではありません。

なぜ重要か:ここで陣営が再び噛み合いません。SageMaker、KServe、Vertex、BentoCloud、Seldonはすべてレイテンシとエラー率を監視しますが、チェックポイントごとの出力品質モニターは提供していません ― スコアリングするためのキャリブレーション済みジャッジを持っていないからです。評価CIツールはジャッジを持っていますが、トラフィック上にいません。

誰が提供しているか:橋渡しを完了している人はいません。滞留カナリアインフラはサービング陣営に存在し、キャリブレーション済みジャッジは評価CI陣営に存在しますが、両者を接続しているところは見たことがありません。

### 機能9. 品質違反時の自動停止

何か:出力品質で失敗するカナリアチェックポイントは自動停止します。プロモーションは進行しません。ロールアウトを止めるために人間のページングは不要です。

なぜ重要か:ロールアウトが進む時間枠では人間はループに入りません。顧客チケットが到着する頃には、25%チェックポイントは終わり、100%プロモートが起きています。

誰が提供しているか:サービングカナリア陣営はインフラ指標で停止します。品質指標停止は、機能8の存在を必要とする部分です。

## ステージ④ ― 観測(Observe)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">継続的なトレース再生 → 約12秒のアトミックロールバック。</span>
  </div>
</div>

### 機能10. 候補リリースを通じた本番トレースの継続的な再生

何か:カナリアが100%にプロモートされた後も、オブザーバーは実行を続けます。最近の本番トレースをサンプリングし、*候補*(現在アクティブな)リリースを通じて再生し、キャリブレーション済みジャッジでスコアリングし、分単位の品質スコアを出力します。定期的ではなく、継続的です。

なぜ重要か:静かな品質低下 ― モデルがヘッジする、自信を持って日付をハルシネートする、すべきでないところで拒否する ― は、レイテンシも5xxも動かしません。これらに対して得られる唯一の信号は顧客チケットであり、これは最悪の信号です。継続的な品質モニターはこれらを1桁の分数で捕捉します。

誰が提供しているか:**誰も**。可観測性陣営(Arize、Phoenix、Confident、Deepchecks<sup><a href="#ref-7">[7]</a></sup>)は本番出力を監視しますが、強制しません。サービングカナリア陣営はインフラを監視します。評価CI陣営はトラフィック上にいません。閉じたループ ― 本番トレース → キャリブレーション済みジャッジ → 強制 ― が欠けたシームです。

### 機能11. 数分ではなく数秒でのアトミックロールバック

何か:オブザーバーがトリガーすると(例えば、しきい値を下回る3分連続)、ロールバックが自動的に発火します。ロールバックはマニフェストの`previous_release`にルーティングを再ポイントします。前のリリースが完全にバンドルされたマニフェストだったため、すべてのコンポーネントがアトミックに切り替わります。約100レプリカのサービスでのインフライトドレインを含めたエンドツーエンドで、約12秒<sup><a href="#ref-5">[5]</a></sup>です。

なぜ重要か:Cloudflareの2022年6月の障害<sup><a href="#ref-8">[8]</a></sup>では、リバートに44分かかりました。原因はリバート自体ではなく、状態が分割されていたためにエンジニアたちが互いのリバートを上書きしてしまったことでした。マニフェスト駆動のロールバックは単一命令であり、その障害モードを持つことはできません。

誰が提供しているか:サービングカナリア陣営は高速なインフラロールバック(アラームトリガー、ブルーグリーン切り替え)を提供しています。アーキテクチャ的な違いは、*トリガー*がインフラのみか、品質を意識しているか(機能10)です。

### 機能12. ハッシュチェーン化された、外部アンカー可能なコンプライアンスレシート

何か:すべてのリリース判断 ― 登録、ゲート通過、ゲート失敗、ゲートオーバーライド、チェックポイントプロモート、自動ロールバック ― は、SHA-256付きのJSONレシートを発行し、この顧客の前のレシートとこのリリースの前のレシートにハッシュチェーンされます。チェーンは顧客が設定するスケジュールで外部にアンカーされます。

**オープンウェイトに関する注意。** リリースがオープンウェイトモデル(Gemma、Qwen、Llama、Mistral、GPT-OSS)に基づく場合、レシートには[vIndex重み証明](/ja/compliance/) ― 判断時点でのアクティブな重みがマニフェストが登録した重みであることの証明 ― が埋め込まれます。リリースがクローズドAPIモデル(OpenAI、Anthropic、不透明なAPI経由のGoogle)に基づく場合、レシートは判断チェーンをカバーしますが、プロバイダーが重みを公開していないため、重みのプロベナンスを主張することはできません。レシートはそのことを明示します。これが検証可能性の限界です。

なぜ重要か:規制業界は今日、*ログ*を取得しています。EU AI ActおよびNIST AI RMF<sup><a href="#ref-9">[9]</a></sup>はますます*証明*を要求するようになっています。ハッシュチェーンレシートは、「ログがある」と「監査人が当社のログを信頼せずにチェーンを検証できる」の違いです。

誰が提供しているか:他に提供しているところはありません。これはDivinciの既存の[コンプライアンスページ](/ja/compliance/)に直接マッピングされる差別化の部分です ― 同じレシートフォーマットを、リリース判断に拡張しています。

## 12の機能を、プラットフォーム陣営別に

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="プラットフォーム陣営別の12機能のマトリックス。Divinciは12個すべてを備えています。評価CI陣営(Braintrust、Humanloop、Patronus)は5と6を備えています。サービングカナリア陣営(SageMaker、KServe、BentoCloud、Vertex、Seldon)は1の部分、2の部分、7、9、そしてインフラ指標における11を備えています。モデルレジストリ陣営(W&B Models、MLflow、LangSmith)は1の部分と2の部分を備えています。可観測性陣営(Arize、Phoenix、Confident、Deepchecks)は監視のみの形で10を備えています。他には誰も4のスライス単位ゲート、5の人間アンカーキャリブレーション済みジャッジ、8の出力品質カナリアモニター、10の強制付き閉ループトレース再生、12のハッシュチェーンレシートを備えていません。">
<title>陣営別12機能</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">どの陣営がどの機能を提供しているか</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = 提供。◐ = 部分的(インフラのみ、またはレジストリのみ)。✗ = 未提供。6つの機能は他のすべての陣営で欠けている。</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">機能</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">評価CI</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">サービング</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">レジストリ</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">観測</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. 不変マニフェストSHA</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. アトミックなバージョン切替(全部品)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. 学習・提供環境パリティ</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. スライス/ドメイン単位の品質ゲート</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. 人間アンカーのキャリブレーション済みジャッジ</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. 理由必須のオーバーライドパス</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. 滞留付きマルチチェックポイントカナリア</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. 各チェックポイントの出力品質モニター</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. 品質違反時の自動停止</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. 閉ループの本番トレース再生</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. 数秒でのアトミックロールバック</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. ハッシュチェーンのコンプライアンスレシート</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">機能4、5、8、10、12を強調表示:このスキャンで他に提供がない5つ。残りはどこかの陣営にクラスタリングされる。</text>
</svg>
</figure>

このパターンが要点です。5つの機能 ― **スライス単位ゲート、キャリブレーション済みジャッジ、品質カナリアモニター、閉ループ再生、ハッシュチェーンレシート** ― は、他のどの陣営でも✗として示されています。それがシームです。残りの7つは陣営に分散し、各陣営は内部的には一貫しているものの、相互には不完全です。

## カスタム言語モデルのQAは、ソフトウェアのQAとどう違うのか?

LLMは、温度ゼロでも決定論的ではありません ― バッチングとハードウェアの違いが出力のばらつきを引き起こします。その単一の特性が、従来のQAが構築されていた前提のほとんどを壊します。

- **`expect(output).toEqual(X)`のアサーションは書けません。** フィクスチャに対する等価性ではなく、人間アンカーグレーダーに対する順位相関を消費する分布対応の評価が必要です。これが機能5です。
- **モデルは集約品質チェックをパスしながら、あるスライスで失敗することがあります。** だから機能4が別途存在するのです。評価がスライスできなければ、スライス対応のリグレッションを捕捉できません。
- **品質障害はインフラ層では沈黙しています。** モデルがヘッジしたりハルシネートしたりしても、レイテンシと5xxはきれいなままです。インフラ側のモニターはこれを見ることができないため、機能8と10が存在します。
- **ロールバックはオプションではありません。** 障害モードが確率的であり、その一部が沈黙しているため、ロールバックパスはバックアッププランではなくプライマリインフラでなければなりません。機能11は「12秒」を達成可能にするものであり、機能2はそれを正しいものにします。

これら4つの事実を考慮していないQA・リリースプラットフォームは、決定論的ソフトウェアCI/CDにLLMロゴを貼り付けただけのものを出荷しています。市場はそれを頻繁に行っています。

## 監査証跡は、実際にどのようにAIコンプライアンスを支えるのか?

私たちが最もよく目にするコンプライアンスのギャップは ― デプロイから6か月後に監査人が到着し、「3月15日に動作していたのはどのバージョンのモデルで、誰がそのリリースを承認したのか?」と尋ねるとき ― 「ログがない」ではありません。それは「5つのシステムにログがあり、タイムラインが一致しない」というものです。

コンプライアンスレシート(機能12)は、ログ自体を可搬な成果物 ― ハッシュチェーン、単一ソース、外部アンカー可能 ― にすることでこれを解決します。監査人は当社のインフラを信頼せずにチェーンを検証できます。これが「記録がある」と「記録が証明可能である」の違いです。

オープンウェイトモデルバッキングについては、レシートには重み証明も含まれます ― アクティブな重みがマニフェストが登録した重みであることの暗号学的な証明です。これは、*デプロイされたもの*だけでなく*基となる重みが主張する通りのものであること*を証明できるため、より厳しい要件(GDPR第17条の削除権、EU AI Actのプロベナンス)を満たします。

クローズドAPIバッキング ― モデルが不透明なAPIの背後で提供され、重みが公開されない場合 ― については、レシートは判断チェーンをカバーしますが、重みのプロベナンスを主張することはできません。提供できない証明を暗示するのではなく、レシートで明示的にそう述べます。プロバイダーが重みを内部に保持している場合の、検証可能性の限界です。

## このチェックリストが解決しないこと

3つの正直な制限があります。

**機能はそれ自体のためのチェックボックスではありません。** 12個すべてを貧弱に提供するプラットフォームは、そのうち8個を上手に提供するプラットフォームよりも悪いものです。チェックリストは評価の出発点であり、ベンダーRFP用のスコアカードではありません。

**競合スナップショットは2026年のものであり、変化します。** 6か月後には、上記の✗マークの一部は反転するでしょう ― 競合他社がポストモーテムを読みギャップを埋めるからです。2027年にこの記事を読むなら、信じる前に自分でマークを監査してください。

**一部の機能は他の機能に依存します。** 機能8(出力品質カナリアモニター)は機能5(キャリブレーション済みジャッジ)を必要とします。機能10(閉ループトレース再生)は両方を必要とします。機能5なしで機能8を提供するプラットフォームはプラセボを提供しています ― カナリアモニターは存在しますが、信頼できる何かに対して接地されていません。

## FAQ

### カスタムLLMリリースで最も重要なQA機能は何ですか?

スライス単位の品質ゲート(機能4)です ― つまり、リリース判断は、単一のグローバル集約ではなく、人間アンカーグレーダーに対するドメイン単位のスピアマンスコアを消費します。集約スコアは局所的なリグレッションを洗い流し、局所的なリグレッションこそが2026年のLLMリリースにおける主要な障害モード<sup><a href="#ref-3">[3]</a></sup>です。このリストから1つしか提供できないのであれば、機能4を提供してください。次に機能5を提供してください ― それが機能4を信頼できるものにするからです。

### 6か月間運用せずに、LLM QAプラットフォームをどう評価するのですか?

上記の12機能チェックリストをベンダーのドキュメントに適用してください。2つの具体的なテストがあります。第一に、ベンダーに参照顧客のうちの1つの*スライス単位*のゲート出力を見せてくれるよう依頼してください ― 集約スコアしか持っていない場合、機能4を持っていません。第二に、何が自動ロールバックをトリガーするかを尋ねてください ― 答えが「レイテンシ、エラー率、当社のアラーム」であれば、サービングカナリア陣営にいて、機能10が欠けています。

### 評価CIツールとリリース管理ツールの違いは何ですか?

評価CIツール(Braintrust、Humanloop、Patronus)は、PRマージ時に自動評価器を実行し、悪いマージをブロックします。本番トラフィックには触れません。リリース管理ツール(このカテゴリー)は、リリースマニフェスト、カナリア、オブザーバー、ロールバックパスを所有します。評価CIはリリース管理ワークフローの*一部*ですが、その代替ではありません。多くのチームは2つのうち1つを提供し、CIをパスしたリグレッションが本番に静かに到達したときにギャップに気付きます。

### ロールバックはどれくらい速くあるべきですか?

数分ではなく、数秒のオーダーです。Divinciパイプラインの平均ロールバック時間は約12秒です ― これは約100レプリカのサービスでのインフライトリクエストドレインであり、マニフェスト切り替え自体は1秒未満です。Cloudflareの2022年6月のインシデント<sup><a href="#ref-8">[8]</a></sup>と比較してください ― 状態がシステム間で分割されていたため、リバートに44分かかりました。「数分ではなく数秒」を可能にするアーキテクチャ上の決定は、バンドルされたリリースマニフェスト(機能1と2)です。

### なぜコンプライアンスレシートはコンプライアンスログより重要なのですか?

ログはあなたが書いたものです。レシートは監査人があなたを信頼せずに検証できるものです。EU AI ActとNIST AI RMF<sup><a href="#ref-9">[9]</a></sup>はますますこの2つを区別するようになっています ― 「文書化されている」は「証明可能である」と同じではなく、規制の方向は後者へと向かっています。ハッシュチェーンで外部アンカーされたレシートは、その一線を越えるための最もシンプルな利用可能技術です。

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Cited for capability 1 — what state-spread-across-systems looks like at scale.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> and <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. The model-artifact-only side of capability 1. Neither ships prompt-template registration.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). Names the slice-aware regression failure mode as the dominant 2026 pattern. Companion: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Anchor for capability 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> and <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> of 600 (ten minutes), maximum 1800 (thirty minutes). The standard infrastructure-metric canary the post contrasts against on capabilities 8 and 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — atomic routing-flip via release manifest.</strong> The ~12-second rollback time is in-flight drain on a ~100-replica service; the manifest swap itself is sub-second. Number is from our own service, not a benchmark. The architecture that makes it possible is the bundled manifest from capability 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) to writing (36–44%). Anchor for capability 5 — why a calibrated judge has to be per-slice.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Observability camp comparison.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Confident AI's 2026 observability tools comparison</a>. All ship monitoring and alerting; none enforce rollback. Anchor for capability 10's "monitor without enforcement" framing.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." 44 minutes from "we know what to revert" to revert complete, in part because engineers walked over each other's reverts. Anchor for capability 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — the four core functions that capability 12 maps onto. Plus the EU AI Act provenance requirements at <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Anchor for capability 12.
</li>
</ol>

---

*本シリーズの次回:* **規制分野におけるカスタムLMの検証とリリース。** 上記の機能チェックリストは汎用的なものです。次回の記事は具体的です ― EU AI Act、GDPR第17条、HIPAA、そしてNIST AI RMF ― それぞれがリリースプロセスに何を求めているか、上記のどの機能がどの要件をカバーするか、そしてオープンウェイト/クローズドウェイトの分岐が実際にどこでコンプライアンスストーリーを変えるか。
