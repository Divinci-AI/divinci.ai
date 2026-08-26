+++
title = "2026年におけるカスタム言語モデルのCIテスト"
description = "コントラクトテスト、スモークバジェット、コスト意識のあるフリートサイジング、シャドウCI。チームの速度を落とすことなく、12分間の評価スイートをすべてのPRで実行可能に保つ方法。"
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/ci-testing-for-custom-language-models-in-2026-hero.webp"
reading_time = 13
summary = "第7回のリグレッションスイートは、すべてのPRで実行するたびに実費がかかります。本稿は、同等のカバレッジを大幅に低いコストで維持する方法 — サブ秒のコントラクトテスト、90秒のスモーク層、埋め込みキャッシュ + ジャッジバッチング、そしてゲートがブロックを開始する前の2週間のシャドウウィンドウ — を解説します。本シリーズの最終回です。"
+++

*リリースサイクルからのノート — 第8回(最終回)*

[第7回](/ja/blog/automated-regression-testing-for-custom-llms-in-2026/)のリグレッションスイートをリリースします。動作します。スライス対応ゲートは実際のバグを捕捉します。較正済みジャッジは堅実に機能します。

その後、エンジニアリングリードから「すべてのPRで実行するコストはいくらか」と尋ねられます。掛け算してみます。PRあたり約12分のジャッジ推論、1日60件のPR、4次元 × 17スライス — 請求額は実費です。さらに悪いことに、開発者全員が1行のプロンプトのタイプミスでグリーンチェックを12分間待つことになります。ベロシティが落ち<sup><a href="#ref-1">[1]</a></sup>、チームから不満が出て、誰かが「ゲートは夜間だけ実行すればよい」と提案します — それはまさに、ゲートが本来果たすべきすべてを放棄する方法です。

解決策はテストを減らすことではありません。解決策は**層を分けてテストを行い、シグナルの大半を最初の90秒以内に届けること**です。本稿では、ゲートスイートの下層で動作するものを扱います。サブ秒のコントラクトテスト、引き締まったスモーク層、コスト意識のあるフリート、そして新しいゲートが誰かをブロックする前の2週間のシャドウウィンドウです。

本稿は第8回、本シリーズの最終回です。読み終える頃には、[4段階パイプライン](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)から、すべてのコミットで実行されるコントラクトテストのフィクスチャまでの全体像が把握できます。

## カスタム言語モデルにとってCIとは何を意味するのか?

カスタムLLMにとってのCIとは、ゲートスイートが繰り返す必要のない作業のことです。ゲートは意味的品質を採点します。CIは、ゲートが1つのジャッジトークンも消費する前に、ゲートのスコアを無意味にしてしまうあらゆる事柄を捕捉します。

コントラクトテストはミリ秒単位で実行され、プロンプトテンプレートが依然としてレンダリングされること、ツール呼び出しスキーマが依然としてパースされること、検索インデックスが依然として応答すること、マニフェストが依然として実在するハッシュを参照していることを検証します。これらは決定論的で、無料で、パイプラインの残りが存在を許される唯一の理由です。プロンプトテンプレートを壊すプルリクエストは、ジャッジ推論で12分かけて無意味な出力を採点した後ではなく、200ミリ秒で失敗すべきです。

コントラクト層は、PR量に対して線形にスケールするCIの請求額と、そうでないものとの違いを生みます。DivinciのCIランナーは、スキーマチェックで落ちていたはずのPRではなく、実際の意味的評価にジャッジ予算の90%超を費やします。その比率こそが、見出しの数字です。

## 従来のCIがLLMで破綻する理由 — コストの観点から

[第1回](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)と[第7回](/ja/blog/automated-regression-testing-for-custom-llms-in-2026/)では、生成モデルに対して決定論的CIが失敗する理由を扱いました。本稿で扱うのは、それら4つの特性の**コスト**の側面であり、その存在自体ではありません。

| LLMの特性 | 従来CIの失敗 | コストの形状 |
|---|---|---|
| 非決定論的な出力 | 完全一致アサーションがフレーキーになる | 再実行がフレーキー率に応じて線形にコストを増幅する |
| 多次元的な品質 | 単一のブール値では情報が不足 | 各次元が別個の(有料の)ジャッジ呼び出し |
| プロバイダーのドリフト | ピン止めした `gpt-4-2024-01-01` が静かに引退 | プロバイダーがチェックポイントを終息させると、再較正のバーストが発生 |
| 非局所的なプロンプト効果 | ローカル単体テストでは効果を捕捉不能 | 分布形状の変化はPR間で起き、PR内ではない — 差分ではなく全スイートの再実行が必要 |

CIアーキテクチャは、これらをそれぞれ手の届く価格で扱えるようにしなければなりません。コントラクトテストは特性1と3を安価に処理します。スモークテストは特性4を部分的に処理します。特性2を完全に処理できるのはフルスイートだけです — しかも実際に必要なPRに限ります。

## CIのレイヤーケーキ — サブ秒から25分まで

私たちが出荷するアーキテクチャは4層構成で、各層は下位のより安価な層では捕捉できないものを捕らえることで、自らの計算コストを正当化します。全層のスライス対応の枠組みは、[Tianpan氏のSemver Lieポストモーテム](/ja/blog/automated-regression-testing-for-custom-llms-in-2026/)が明示した教訓に従っています<sup><a href="#ref-4">[4]</a></sup>。集約シグナルは嘘をつき、スライスごとのシグナルが集約では見えないものを捕捉する、というものです。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="4層構成のCIアーキテクチャ:コントラクトテストはサブ秒、スモークは90秒、フルスイートは12分、本番トレースリプレイは25分">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">CIレイヤーケーキ — 各層が次の層に到達するPRを絞り込む</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">ほとんどのPRは上位2層のみに触れる。PRあたりのコスト数値は社内測定 — Divinci本番CIで計測</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① コントラクト · 全コミット · &lt; 1秒 · ~$0.00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">スキーマ · テンプレート描画 · 拒否リスト · マニフェスト整合性 · インデックス生存確認</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">コミットの100%</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② スモーク · 全PR · 約90秒 · ~$0.05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">上位3スライスの重要ケース20〜30件 · タスクと安全性のみ</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">PRの100%</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ フルスイート · プロンプト/モデル/検索PR · 約12分 · ~$0.80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500ケース · 4次元 · 全スライス · スライスごとSpearmanゲート</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">PRの約22%</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ 本番トレースリプレイ · リリース候補 · 約25分 · ~$2.40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">14日間のリプレイウィンドウ · 同一の較正済みジャッジ · オフライン↔リプレイ差分分析</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">PRの約4%</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">PRあたり集約コスト(ファネル加重):約$0.27。集約p95経過時間:約3.4分。</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">各層の経過時間、層別コスト、ファネル比率は社内測定 — 代表的な顧客環境のDivinci本番CIで計測(ゴールデンデータセット約500ケース、17スライス、1日約60PR)。</figcaption>
</figure>

コストの形状こそが設計です。PRの約74%はジャッジトークンを一切消費しません — コントラクトかスモークで十分です。フルスイートに到達するPRは、プロンプト、モデル設定、検索インデックス、または評価コードに触れたPRに限定されます — まさに、ゲートスイートだけが信頼に値するシグナルを提供する変更です。リリース候補は、第4層に到達する少数の割合を占めます。

## コントラクトテスト — 不公平な優位性

コントラクトテストは最前線であり、最も安価な防衛線であり、「AI評価パイプライン」の威厳に値しないと感じて多くのチームが省略してしまう線でもあります。しかし当社の顧客スイートでは、ジャッジが呼び出される前に、リグレッション候補の30〜40%が実際にここで失敗しています。

コントラクト層は、以下の5つだけを検証し、それ以外は何も行いません。

1. **プロンプトテンプレートの描画。** すべてのテンプレートが、未束縛変数、暴走ループ、壊れたJinja風 include なしに、正規のフィクスチャに対して描画されること。
2. **ツール呼び出しスキーマ。** 宣言された各ツールの引数スキーマがパース可能であること、JSONSchemaが有効であること、描画されたプロンプトが必須スロットを実際にすべて参照していること。
3. **マニフェスト整合性。** リリースマニフェスト内の全SHA — モデル、プロンプト、検索インデックス、ジャッジ、データセット — がレジストリに存在するアーティファクトに対応していること。ぶら下がりポインタは3層先ではなくここで失敗します。
4. **インデックス生存確認。** 検索インデックスが既知のクエリに予算内で応答すること。検索を密かに壊した再構築済みインデックスは、本番ではなくここで表面化します。
5. **拒否リストとトークンバジェット。** 禁止トークンを導入したり、呼び出しあたりのトークンバジェットを超過したり、コンテキストウィンドウを超えて描画したりしたプロンプトテンプレートはここで失敗します。ヒューリスティックな意味類似度スコアリング<sup><a href="#ref-6">[6]</a></sup>も十分安価なので、リテラル文字列マッチングでは不十分なファジー一致の拒否リストカバレッジ用にコントラクト層で実行可能です。

```bash
# 代表的なコントラクトテストの呼び出し例 — 約600 msで完了
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

これらのいずれも、ジャッジを呼び出しません。いずれも非決定論的ではありません。いずれも測定可能な金額のコストはかかりません。そして、いずれも「ゲートスイートが医療スライスのリグレッションを報告した」というアラート — そもそもモデルが正しく生成できなかったはずの出力を採点するのに丸12分のジャッジ推論を浪費していたであろうアラート — の一群を丸ごと除外します。

## スモーク層 — 90秒、PRあたり約$0.05

コントラクト層が安価で不公平な優位性なら、スモーク層はコーヒー1杯未満の値段で実際にリグレッションを捕捉する層です。最も処理量の多いスライスから抽出した20〜30ケースを、**タスク完了と安全性のみ**で採点します。忠実性も、レイテンシも、検索接地チェックもありません。すべてのPRがこれを実行します。約90秒で完了するのは、ケースが構造化出力スキーマで単一のジャッジ呼び出しにバッチ処理されているためであり、ジャッジがリリース候補で使う最高品質のものではなく、安価な較正済みジャッジであるためです。

私たちはリグレッションログで、出荷された各修正をどの層が捕捉したかを追跡しており、顧客導入環境における過去6か月のヒストグラムは一貫しています。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="リグレッションが捕捉される層の棒グラフ:コントラクト31%、スモーク27%、フルスイート28%、リプレイ11%、本番への流出3%">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">リグレッションはどこで捕まるか — 層別、顧客導入環境の過去6か月</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">ほとんどのリグレッションは最も安価な層で死ぬ。高価な層は残余でコストを正当化する</text>
<g transform="translate(90, 100)">
<line x1="0" y1="200" x2="780" y2="200" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">40%</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">30%</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">20%</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">10%</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0%</text>
</g>
<g>
<rect x="40" y="45" width="120" height="155" fill="#7a8a4a" stroke="#1e3a2b" stroke-width="1"/>
<text x="100" y="36" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">31%</text>
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">コントラクト</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1秒 · $0.00</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27%</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">スモーク</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90秒 · $0.05</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28%</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">フルスイート</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12分 · $0.80</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11%</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">リプレイ</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25分 · $2.40</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3%</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">流出</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ ロールバック</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">アクティブなDivinci CI導入環境の直近6か月の集計。確認されたリグレッションのうち、最初に失敗した層が当該層であった割合(%)として報告。社内測定 — 当社による計測。</figcaption>
</figure>

流出する3%は、[第5回の即時ロールバック](/ja/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)が存在する理由です。ゲートは流出ゼロを約束するのではなく、厳しい上限と、通過してしまったものに対する迅速な復旧を約束します。

## CIフリートのサイジング — 12分スイートを安価に保つ方法

フルスイート層は、計算が成立しなければならない場所です。素朴な実装はジャッジを「ケース × 次元」ごとに1回呼び出し、それらを逐次実行するため、請求額はケース数に対して線形にスケールします。3つの最適化が、これを手の届く範囲に保つ作業の大部分を担います。

**埋め込みキャッシュ。** 各ゴールデンデータセットケースの検索コンテキスト指紋はハッシュ化されます。ケースが変わっておらず検索インデックスも変わっていなければ、キャッシュされた埋め込みが有効と見なされ、検索ステップはスキップされます。最初の安定週以降のヒット率は、当社の顧客導入環境で一貫して90%超です。

**ジャッジバッチング。** 較正済みジャッジは構造化出力で呼び出され、1呼び出しあたり8〜16ケースをバッチ処理します。ジャッジのトークンあたりコストは変わりませんが、ケースあたりのオーバーヘッドは下がります。バッチ全体でシステムプロンプトが分散償却されるためです。安全なバッチングの閾値は、そのバッチサイズでのジャッジ自身の較正済み一致度<sup><a href="#ref-2">[2]</a></sup>によって設定されます — これを毎週のジャッジ較正パス([第7回](/ja/blog/automated-regression-testing-for-custom-llms-in-2026/))で計測します。

**ケース間でのKVキャッシュ再利用。** 全呼び出しの先頭に同一のシステムプロンプトとツール定義が来るモデルでは、そのプレフィックスのKVキャッシュはケースごとではなくスイート実行ごとに1回計算されます<sup><a href="#ref-3">[3]</a></sup>。オープンウェイト導入では簡単に実現できます。クローズドAPIモデルでは、プロバイダーのプレフィックスキャッシュ対応に依存します。

これらを組み合わせた効果により、フルスイートのコストは前述のレイヤーケーキ図に示した数値水準に収まります。正確な数字は社内情報ですが、公開できる主張は比率です。**PRの約74%はジャッジ費用ゼロ、約22%は数セント、残りの4%が、私たちが知る限り最も信頼度の高いリリース前シグナルのために数ドルを費やします。**

## シャドウCI — チームを壊さずに有効化する方法

私たちが最も頻繁に目撃してきたチームの単一最大の過ちは、新しいゲートを初日に「オフ」から「ブロッキング」へと切り替えることです。閾値は昨日のデータで調整されており、誤検知率は不明で、ゲートが最初に発火したときチームには、それが本物か誤報かを較正する基準がありません。オンコールの評価エンジニアが呼び出され、ゲートが無効化され、信頼が失われ、プロジェクトは死にます。

解決策は*シャドウCI*です。新しいゲートを2週間ノンブロッキングで実行し、結果をすべてのPRのbotコメントとして投稿し、ブロッキングに切り替える前に毎週誤検知率をレビューします。Divinci CIランナーには、まさにこのための `--shadow` フラグがあります。PRコメントは最終的なブロッキング版と同じ見た目になります — 同じ差分表示、同じスライス別の内訳 — ただしマージをゲートしません。

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

ウィンドウ全体で誤検知率が持続的に5%未満になれば、切り替えます。そうでなければ、スライス別の閾値を引き締め、ジャッジを再較正し、再度シャドウします。いずれにせよ、チームは初日に発火する新しいゲートに不意打ちされることはありません。

## 実際に組み合わさるGitHub Actionsワークフロー

レイヤーケーキを既存のCIに組み込む部分は `.github/workflows/llm-ci.yaml` で動作します。各層は配線されており、安価な層は早期に失敗し、高価な層は必要なときにだけ実行されます — `needs:` のチェーンとパスフィルタートリガーがその作業を担います<sup><a href="#ref-5">[5]</a></sup>。

```yaml
name: LLM CI
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'config/models.yaml'
      - 'eval/**'
      - 'retrieval/**'
      - 'manifests/**'
jobs:
  contract:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci contract --manifest manifests/staging.yaml --fail-fast
  smoke:
    needs: contract
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=smoke --post-pr-comment
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
  full:
    needs: smoke
    if: contains(steps.changes.outputs.paths, 'prompts/') || contains(steps.changes.outputs.paths, 'config/models.yaml')
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=full --post-pr-comment --gate
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
```

注目すべき点は3つあります。各層は `needs:` でチェーンされているため、コントラクトが壊れているとスモークは実行されず、スモークが壊れているとフルは実行されません。`full` ジョブは、12分間の実行に値する変更にパスフィルターでマッチングされます — READMEのタイプミス修正ではゲートスイートはトリガーされません。`--post-pr-comment` フラグは、GitHubを離れずにスライス別差分を可視化するためのものです。

## 失敗PRのデバッグループ

「ゲートが発火した」のもう半分は「理由を見せろ」です。`medical slice task-completion dropped 0.04` というリグレッションスイート出力は、原因となったケースなしには対処不能です。私たちはPRコメントに、スライス別の最悪差分5件を、元の入力、ベースライン出力、候補出力、ジャッジの推論トレースとともに表示します。デバッグループは数秒で済むべきもので、数分かかるものではありません。

```bash
# このPRでmedical-sliceゲートを発火させた最悪の5ケースを取得
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

これは[第6回の7ステップツリー](/ja/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)と同じ診断面を、CIフィードバックループに配線したものです。PRを開いたエンジニアは、ケースレベルの根拠をPR上で直接確認できます。別の評価ダッシュボードを開く必要はありません。

## バージョン管理の規律 — プロンプト、データセット、ジャッジをコードとして扱う

プロンプトテンプレート、ゴールデンデータセット、ジャッジプロンプトはすべてリポジトリ内に存在し、リリースマニフェストでハッシュ固定されます。マニフェストは、スイートを特定の再現可能な状態に結びつける唯一のオブジェクトです。

```yaml
# manifests/staging.yaml — すべてのCI実行はこれをハッシュ化する
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

CI実行がスコアを投稿すると、そのスコアはマニフェストハッシュでタグ付けされます。スコアが動いたとき、「どの入力が動いたか」という問いには直接の答えがあります。マニフェストを差分比較し、発火した層がまずどの次元を見るべきかを教えてくれます。これは[第1回の4段階パイプライン](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)と[第4回のvindexレシート](/ja/blog/validating-and-releasing-custom-lms-in-regulated-fields/)が共に閉じるループです。マニフェストは、本シリーズの8回すべてが異なる枠組みで構築してきた監査プリミティブです。

## 本稿が解決しないこと

本シリーズの全稿で書いてきたのと同じ3つの正直な制約です。

1. **CIはスイートに存在しないものはテストしない。** レイヤーケーキがどれほど巧妙でも、捕捉できるリグレッションは、ゴールデンデータセット内のいずれかのケースが警告したであろうものに限られます。リプレイ層は挙動ドリフトに対してこれを緩和しますが、これまで見られなかった新規クエリは本番に現れるまで流出し続けます。本システムは本番モニタリングと組み合わせる必要があります。
2. **コスト数値はモデル価格設定により変動する。** 本稿のすべてのコスト数値は、四半期ごとに変動するジャッジトークン料金、埋め込み料金、推論料金に依存します。比率 — 74% / 22% / 4%、31% / 27% / 28% / 11% / 3% — が荷重を支える主張であり、ドル金額はある時点での例示です。
3. **プロバイダー側のチェックポイント変更は依然として困難。** クローズドAPIプロバイダーが安定した名前の背後でモデルを密かに更新したとき、コントラクト層では捕捉できません。ゲートスイートだけが、しかも事後にしか捕捉できません。プロバイダーが対応している場所では明示的なチェックポイント識別子をピン止めし、チェックポイントが発表された日をフルスイート再ベースラインのトリガーイベントとして扱うことで緩和します。根本的な問題は防止できません。

## シリーズのまとめ

本稿は全8回の第8回です。全体の弧:

1. [Divinci AIでLLM CI/CDパイプラインを構築する方法](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — 以降のすべてが内側で動作してきた4段階パイプライン(登録/ゲート/ロール/観測)。
2. [カスタム言語モデルにおけるCI/CDリリース失敗の10事例](/ja/blog/10-ci-cd-release-failures-in-custom-language-models/) — 2026年の命名済み失敗モード、それぞれを捕捉すべき段階にマッピング。
3. [LLM向けQAおよびリリース管理の12機能](/ja/blog/12-qa-and-release-management-capabilities-for-llms/) — 機能マトリクスと、代替策に対してDivinciを位置づける3キャンプのベン図。
4. [規制対象分野におけるカスタムLMの検証とリリース](/ja/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — コンプライアンスのディープダイブ、規制当局から段階へのマッピング、vIndexレシート。
5. [即時ロールバック付き自動LLM CI/CDパイプライン](/ja/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — 運用層、自動化スペクトル、自動ロールバックレシート。
6. [7ステップでカスタムLLMのQA失敗を診断する方法](/ja/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — 診断意思決定ツリー。モデルが正解である頻度はおよそ7回に1回。
7. [2026年におけるカスタムLLMの自動リグレッションテスト](/ja/blog/automated-regression-testing-for-custom-llms-in-2026/) — スライス対応Spearmanゲート、較正済みジャッジ、クローズドループ本番トレースリプレイ。
8. **本稿。** 上記すべてをすべてのPRで現実的に運用可能にするCIインフラ。

各要素は組み合わさります。[マニフェスト](/ja/api/)は監査プリミティブ、ゲートは安全層、診断ツリーは復旧ループ、[vIndexレシート](/ja/compliance/)は外部アンカー、レイヤーケーキは全体を全コミットで運用可能にする手段です。あなたのカスタムLLMリリースプロセスにこれら5つが揃っていないなら、そのギャップこそが、これら8稿が扱ってきたものです。

## FAQ

**全コミットで実行できる最も安価なテストは何ですか?**

プロンプトテンプレートの描画チェックです。ミリ秒単位で実行され、ジャッジは不要で、驚くべき割合の破損を捕捉し、測定可能なコストは一切かかりません。まだ実行していないなら、私たちが推奨を知る限り、最もROIの高いCIの一手です。

**カスタムLLM CIパイプラインのコストはどの程度を見込むべきですか?**

典型的なPRで数セント、リリース候補PRで数ドル程度です。比率はジャッジ価格と、PRのうちプロンプトやモデル設定に触れる割合に依存します。上記の4%というリリース候補比率は典型的です。プロンプトを頻繁に反復する製品では比率が上昇し、平均額もそれに応じて上がります。

**フルスイートを全コミットで実行すべきですか?**

いいえ。プロンプト、モデル設定、検索、または評価コードに触れるPRにパスフィルターを適用してください。その他の変更にはコントラクト + スモークで十分であり、READMEのタイプミスで12分待たされれば、スプリント1回でチームの信頼を失います。フルスイートは貴重です。変更が品質次元を動かしうる場合に使ってください。

**全員を壊さずに新しいゲートを導入するには?**

2週間のシャドウウィンドウ、ノンブロッキングで行います。シャドウ期間中に観測される誤検知率に基づいて閾値を調整してください。誤検知率が許容範囲(当社では5%)未満で持続したときにのみブロッキングへ切り替えます。それ以外の方法では、全員が無視することを学んでしまうゲートが出来上がります。

**1つだけ追跡するなら、どの数値を追跡すべきですか?**

本番到達前に捕捉された確認済みリグレッションの割合です。本稿のヒストグラムでは、成熟したDivinci導入環境でこの値は約97%です。流出する3%が即時ロールバックの存在理由です。97%がスイートの目的そのものです。

## 参考文献

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — CI velocity, change-failure-rate and time-to-restore-service."</a> 「PRあたり12分は遅すぎる」を意見ではなく弁明可能な主張にする業界横断ベースライン。
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. スモーク層とフル層で使用するバッチサイズで、バッチ化されたLLM-as-judge呼び出しが較正を維持できるという実証的根拠 — 本稿のコスト数値が実現可能である理由。
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">"Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. CIフリートサイジングのセクションで引用したKVキャッシュ再利用とプレフィックス共有の手法。
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 2026年4月29日。集約のみのリグレッションスイートにおける2026年の命名済み失敗モード。CIレイヤーケーキを最初から最後までスライス対応にしている理由。
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">"GitHub Actions — chaining jobs with `needs:` and conditional execution."</a> 本稿の.yamlが組み立てに使うプリミティブ。
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">"BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. より安価な層でLLM-as-judgeの代替として参照したヒューリスティックな意味類似度メトリック。ゲート時には使用しないが、大規模な禁止フレーズ検出のためコントラクト層で有用。
  </li>
</ol>
