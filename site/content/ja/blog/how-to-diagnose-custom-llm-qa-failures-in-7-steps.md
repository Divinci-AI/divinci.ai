+++
title = "カスタム LLM の QA 失敗を 7 ステップで診断する方法"
description = "「QA 失敗」のほとんどはモデルの失敗ではなく、評価カバレッジのギャップ、ジャッジの誤キャリブレーション、または学習・推論時のスキューです。モデルを責める前に、モデル以外の 6 つの原因を排除する 7 ステップの診断手順をご紹介します。"
date = 2026-05-31T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["QA", "Diagnostics", "Postmortems", "LLM Ops", "Evaluation", "Debugging"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-diagnose-custom-llm-qa-failures-in-7-steps-veo31.webm"
hero_video_poster = "/images/how-to-diagnose-custom-llm-qa-failures-in-7-steps-hero-poster.webp"
reading_time = 11
summary = "カスタム LLM で QA アラートが発火したとき、最初の反射的な反応はモデルを責めることです。しかし当社が実施してきたロールアウトを通じて見ると、モデルが正解である割合はおよそ 7 回に 1 回です。残りの 6 回では、バグは評価、ジャッジ、プロンプト SHA、前処理パイプライン、データセットのバージョン、あるいは検索インデックスにあります。本記事は、当社が実際にたどっている診断ツリーを順を追って示し、各分岐に答える具体的な API コールを掲載しています。"
+++

*リリースサイクルからのノート — 第 VI 回*

---

スコア付き QA スイートが、あるお客様の医療 Q&A モデルにフラグを立て始めました。すべてのスライスにわたる集計品質という見出し指標が、一晩で 6 ポイント低下したのです。チームは 2 日間モデルのデバッグに費やしました。ファインチューニングを再実行しました。直前のリリースにロールバックしました。それでも数値は動きませんでした。

3 日目の朝、誰かが評価スイートがリグレッションの始まった同じ夜に更新されていたことに気づきました。3 つの小児用量プロンプトがテストセットに新しく追加されていて、モデルは学習時に小児用量を一度も見たことがありませんでした。「QA 失敗」はモデルのリグレッションではなかったのです。スライスカバレッジのイベント、つまり評価が、モデルが知っているはずのないことを尋ね始めていたのです。

当社のお客様のロールアウトを通じて、これが支配的なパターンです。**「QA 失敗」アラートは症状です。原因がモデルである割合はおよそ 7 回に 1 回です。** 残りの 6 回は、バグはどこかしら上流、つまり評価の設計、ジャッジのキャリブレーション、プロンプト SHA、前処理パイプライン、データセットのバージョン、または検索インデックスのいずれかにあります。これらのバグのクラスはアラートからは同一に見えます — 数値が下がった — が、それぞれ修正方法はまったく異なります。

本記事は、アラートが発火したときに当社が順番にたどる診断ツリーです。最初の 6 ステップでモデル以外の原因を排除してから、7 番目のステップでモデル自体を検討します。各ステップには、それに答える具体的な API コールまたはクエリがあります。6 つを完了する頃には、何を修正すべきかが正確にわかっているか、モデルを見る権利を獲得しているかのいずれかです。

## 意思決定ツリー

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="QA 失敗アラートの診断意思決定ツリー。ステップ 1 では評価がこのスライスをカバーしているかを問う(NO ならアラートは評価カバレッジのギャップ)。ステップ 2 ではジャッジがこのスライスで人間に対してキャリブレーションされているかを問う(NO ならアラートはジャッジの誤キャリブレーション)。ステップ 3 ではプロンプトテンプレート SHA が本番と一致するかを問う(NO ならアラートはプロンプトドリフト)。ステップ 4 では前処理が本番と一致するかを問う(NO ならアラートは学習・推論時スキュー)。ステップ 5 ではデータセット SHA が本番と一致するかを問う(NO ならアラートはデータセットドリフト)。ステップ 6 では検索インデックスのバージョンが本番と一致するかを問う(NO ならアラートは RAG インデックスドリフト)。6 つすべてがモデル以外の原因を排除した場合にのみ、ステップ 7 が実際のスライス別モデルリグレッションであると結論する。">
<title>7 ステップの診断ツリー</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">QA アラートが発火したら、下へたどる — 中へ踏み込まない</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">6 ステップでモデル以外の原因を排除。7 番目だけがモデルを責める。</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  QA アラート発火</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">評価はこのスライスをカバーしているか?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ NO の場合: 評価カバレッジのギャップ。スイートを更新し再テスト。</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">ジャッジは人間にキャリブレーションされているか?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ NO の場合: ジャッジの誤キャリブレーション。ρ を再校正し再評価。</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">プロンプトテンプレート SHA は本番と一致するか?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ NO の場合: プロンプトドリフト。マニフェストを再登録。</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">前処理パイプラインは本番と一致するか?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ NO の場合: 学習・推論時スキュー。前処理 SHA を束縛。</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">データセット SHA は本番と一致するか?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ NO の場合: データセットドリフト。正しい SHA で再登録。</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">検索インデックス SHA は一致するか?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ NO の場合: RAG インデックスドリフト。</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">6 つすべてが通過した場合:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">実際のスライス別モデルリグレッション。</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">コミット。ロールバック。再学習。</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">経験的にモデルが</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">正解となるのは</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">アラート 7 回中 1 回。</text>
</svg>
</figure>

ツリーが逐次的なのは、各ステップが安価から高価へと並んでいるためです。ステップ 1 は評価スイートの `git diff` で済みますが、ステップ 7 はファインチューニングサイクルそのものです。高価な作業に 1 週間を費やす前に、6 つの安価なチェックそれぞれに 10 分を費やすのが賢明です。

## ステップ 1 — 評価はこのスライスをカバーしていたか?

**症状。** 集計品質が低下しているが、スライス別の内訳を見ると 1 つのスライスが急落し、ほかは横ばい。あるいは — もっと紛らわしく — *すべての* スライスがわずかに、似たような幅で低下している。

**診断。** 評価スイートのマニフェスト SHA を直前のリリースと比較してください。評価スイートが変更されていて、モデルを変更していないのであれば、リグレッションは評価にあり、モデルにはありません。

```bash
# リリース間で評価スイートのマニフェスト SHA を比較
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# 異なる? 評価が変わっています。何が追加されたかを監査してください。
```

**修正方法。** 評価スイートの変更を元に戻す(意図せぬ変更だった場合)か、新しい評価に合わせて学習カバレッジを拡大する(新しいスライスが実際の本番上の懸念事項である場合)かのいずれかです。評価カバレッジの問題に対してモデルのリグレッション修正を出荷してはいけません — モデルがこれまで得意としていた事柄に対してかえって悪化させてしまいます。

**当社のパイプラインでこれがどこに隠れるか。** [ステージ 1 — 登録](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) は、評価スイート SHA をリリースマニフェストに束縛します。上記の診断は単に 2 つのマニフェストを差分するだけです。医療 Q&A チームのバグが 2 日かかった理由は、マニフェストレベルの diff を持っていなかったためです — 彼らはリリースマニフェストではなくモデルのチェックポイントを比較していたのです。

## ステップ 2 — ジャッジはこのスライスで人間にキャリブレーションされているか?

**症状。** 評価スイートにとって *新しい* スライスがスコアが低いが、そのスライスでモデルの出力を人間がレビューすると問題ないと評価する。ジャッジはモデルが失敗していると考えるが、人間はそう思わない。

**診断。** 失敗しているスライス上で、LLM ジャッジの評価と少量の人間評価サンプル(50 件)との間の Spearman ρ を計算します。ρ &lt; 0.4 であれば、ジャッジはこのスライスで人間が測定しているものを *測定していない* ことになります。

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**修正方法。** このスライスのために別のジャッジモデルを選定するか、アービターを備えたチェーン・オブ・ジャッジを使用してください。MT-Bench<sup><a href="#ref-1">[1]</a></sup> によれば、GPT-4 をジャッジとした場合、平均で 80% 超の人間との合意がありますが、カテゴリー別の分散はコーディングの 86% から、ライティング・人文系の 36〜44% まで広がります。問題となるのはこの分散です。「平均では良い」は、ジャッジが誤っているスライスを覆い隠します。

**当社のパイプラインでこれがどこに隠れるか。** [ステージ 2 — ゲート](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) は、スライスごとのキャリブレーション済みジャッジを要求します。[AI ジャッジのキャリブレーション](/ja/blog/calibrating-the-ai-judge/) の記事にはその手順を記載しています。キャリブレーションステップを経ずにスライスを評価に追加した場合、構造的に信頼できないゲートが出来上がっていることになります。

## ステップ 3 — プロンプトテンプレート SHA は本番と一致するか?

**症状。** 品質が低下しているが、model_ref と dataset_ref は変更されていない。学習に関する変更は何もない。モデルは同じモデルである。にもかかわらず。

**診断。** 失敗したリリースマニフェストの `prompt_template_ref` SHA を、直前のリリースのものと比較してください。「簡潔さを改善する」ためにシステムプロンプトに加えた 38 文字の編集が、フルリトレーニング以上に下流の挙動を変化させ得ます。

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# 異なる? diff を取得してください。注意深く見てください。
```

**修正方法。** プロンプトをコードとして扱ってください。[10 件のリリース失敗の記事](/ja/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) でダッシュボード編集の失敗モードを取り上げています — Tianpan の *Semver Lie* ポストモーテム<sup><a href="#ref-2">[2]</a></sup> は、これを 2026 年の支配的な失敗パターンと名付けています。プロンプトが変わったことを証明できれば、バグを発見したことになります。

## ステップ 4 — 前処理パイプラインは本番と一致するか?

**症状。** モデルはローカルで評価をパスする。同じモデルが本番で同じ評価に失敗する。同じ model_ref、同じプロンプト、同じデータセット。

**診断。** 本番マニフェストから `preprocessing_ref` SHA を取得し、評価が同じものを使用して実行されたことを確認してください。古典的なケース: 学習側ではホワイトスペースを正規化し小文字化していたが、本番ではしていなかった。評価は本番の前処理を経由していたためすべてチェックが通っていた。片方だけ前処理を更新する人が現れるまでは。

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# 学習・評価ハーネスが実際に使用した前処理と比較してください。
```

**修正方法。** 前処理をバージョン付きアーティファクトとしてコンテナ化してください。マニフェストから参照してください。ゲートの前処理 SHA が本番と異なる場合はデプロイを拒否してください。

## ステップ 5 — データセット SHA は本番と一致するか?

**症状。** 失敗したリリースのゲート評価スコアが、*同じ* モデルの前日のゲート評価スコアと異なる。

**診断。** 2 つのリリース間で `dataset_version` フィールドを差分してください。評価スイートは同じ名前のままだが、データセットの内容が更新され再タグ付けされていた、というケースです。同じ名前、異なる SHA、異なるスコア。

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**修正方法。** データセットをコンテンツハッシュしてください。データセット名はバージョンではありません。SHA がバージョンです。

## ステップ 6 — 検索インデックス SHA は本番と一致するか?

**症状。** RAG ワークロードに限った話です。検索コンテキストに依存する質問で品質が低下する。直接回答型の質問は変わらない。

**診断。** マニフェストから `retrieval_index_ref` SHA を取得してください。ゲート評価の検索インデックスと比較してください。RAG インデックスが一晩で更新され(新規取り込みラン)、ゲート評価では古い検索結果がキャッシュされていて、本番カナリアは新しい方を使用した、というケースです。

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**修正方法。** 前処理を束縛するのとまったく同じやり方で、検索インデックス SHA をマニフェストに束縛してください。[AutoRAG](/ja/autorag/) の自動インデックス更新のサイクルがあるため、これは特に確認する価値があります — ピン止めしていない限り、インデックスは承認しようがしまいが必ず更新されます。

## ステップ 7 — そしてついにモデル自体

6 ステップ進みました。評価はスライスをカバーしている。ジャッジはキャリブレーション済み。プロンプト SHA は一致。前処理は一致。データセットは一致。検索インデックスは一致。

ここで — そして今ここでだけ — モデルを見る権利を獲得したことになります。

このステップの診断は、直前のリリースに対するスライスごとの Spearman 比較で、両方のリリースを *同じ* マニフェスト固定のデータセット、前処理、検索に対して評価します。算出される数値はクリーンなシグナルです: 上流の交絡因子のない、実際のスライス別リグレッションです。

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

差分が実際のリグレッションを確認した場合、[自動ロールバック](/ja/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) が発火し(手動で発動済みでなければ)、失敗したモデルは拡張されたスライスカバレッジのコーパスに対して再学習されます。このリリースを昇格させたゲートがそもそもこのスライスを見逃していた場合、[ゲートもまたバグです](/ja/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — リリースパイプラインから機能 4 が欠落していることになります。

## 分布の実際の姿

先ほど挙げた「7 回に 1 回」というフレーミングは修辞ではありません。これがお客様のロールアウト全体で当社が見ているおおよその分布です。QA アラート 7 件あたり:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="QA アラートの根本原因分布の円グラフ。評価カバレッジのギャップが約 32%。ジャッジの誤キャリブレーションが約 18%。プロンプトドリフトが約 16%。前処理スキューが約 12%。データセットドリフトが約 7%。RAG インデックスドリフトが約 5%。実際のモデルリグレッションが約 10%。お客様ロールアウト全体からの内部観察であり、管理されたベンチマークによるものではない。">
<title>QA アラートの根本原因の分布</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">バグが実際にあった場所 — お客様ロールアウト全体</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">内部観察であり、管理されたベンチマークではありません。モデルが正解となるのはアラート 7 件中およそ 1 件です。</text>
<g transform="translate(220, 230)">
<path d="M 0 -120 A 120 120 0 0 1 113.7 -38.3 L 0 0 Z" fill="#2d5a4f"/>
<path d="M 113.7 -38.3 A 120 120 0 0 1 88.3 81.4 L 0 0 Z" fill="#7a9580"/>
<path d="M 88.3 81.4 A 120 120 0 0 1 -29.7 116.3 L 0 0 Z" fill="#b8a080"/>
<path d="M -29.7 116.3 A 120 120 0 0 1 -113.7 -38.3 L 0 0 Z" fill="#c87b3c"/>
<path d="M -113.7 -38.3 A 120 120 0 0 1 -101.1 -64.7 L 0 0 Z" fill="#d4c8b0"/>
<path d="M -101.1 -64.7 A 120 120 0 0 1 -75.6 -93.2 L 0 0 Z" fill="#a04848"/>
<path d="M -75.6 -93.2 A 120 120 0 0 1 0 -120 L 0 0 Z" fill="#1e3a2b"/>
</g>
<g font-size="11" fill="#1e3a2b">
<rect x="500" y="100" width="14" height="14" fill="#2d5a4f"/>
<text x="522" y="112" font-weight="600">1.  評価カバレッジのギャップ</text>
<text x="700" y="112" text-anchor="end" font-weight="700">約 32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  ジャッジの誤キャリブレーション</text>
<text x="700" y="136" text-anchor="end" font-weight="700">約 18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  プロンプトドリフト</text>
<text x="700" y="160" text-anchor="end" font-weight="700">約 16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  前処理スキュー</text>
<text x="700" y="184" text-anchor="end" font-weight="700">約 12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  実際のモデルリグレッション</text>
<text x="700" y="208" text-anchor="end" font-weight="700">約 10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  データセットドリフト</text>
<text x="700" y="232" text-anchor="end" font-weight="700">約 7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  RAG インデックスドリフト</text>
<text x="700" y="256" text-anchor="end" font-weight="700">約 5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">ステップ 1+2 だけでアラートの半分を占める。モデルを歩く前に評価を歩け。</text>
</svg>
</figure>

最も大きな 2 つのスライスは *評価カバレッジのギャップ* と *ジャッジの誤キャリブレーション* です。両者を合わせると QA アラートの半分を占めます。どちらもモデルの問題ではありません。両者ともモデルをどう測定するかの問題です。

## これが解決できないこと

正直に述べる 3 つの制約:

**この分布は当社のものであり、お客様のものではありません。** 上記のパーセンテージは当社のお客様コホートと当社のパイプライン上のツールから得たものです。異なる種類のワークロード — 重いマルチモーダル、重いエージェントオーケストレーション、重い単発生成型 — を運用している場合、分布は異なって見えるでしょう。診断の順序は依然として有効ですが、各ステップの背後にある数値は当てはまりません。

**ステップ 1 の「評価カバレッジのギャップ」が最も修正しにくい。** 不足しているスライスを学習コーパスに追加し、そのためのキャリブレーション済みジャッジを構築し、カナリアを再実行すること自体が数週間に及ぶプロジェクトです。診断は速いが、修復はそうではありません。

**実際のリグレッションがモデル以外のバグに乗ることがあります。** プロンプトドリフトと実際のモデルリグレッションの *両方* が同時に発生しているケースが最悪です。なぜなら、ステップ 3 でプロンプトドリフトを発見し、それを修正しても、アラートは再発火するからです。本記事の診断順序はそれらを処理できますが、所要時間は増えます。「バグが 2 箇所に同時に存在した」ことへの近道はありません。

## FAQ

### なぜ LLM は類似したプロンプトに対して異なる出力を生成するのですか?

プロンプト感受性は実在しますが、それが常に QA アラートの *原因* とは限りません — ときには上流のバグの *症状* です。診断を順に進めてください。プロンプトテンプレート SHA が一致し、前処理が一致し、データセットが一致するのであれば、その場合は確かにモデルがこのスライスで広い分散を持っており、より決定論的なデコーディングパスや別のジャッジが必要です。上流で何かが変わっているのであれば、まずそれを修正してください。

### LLM のベンチマークをどのくらいの頻度で再評価すべきですか?

ベンチマークの *内容* は、本番スライスのトラフィック形状が実質的に変わるたびに再評価してください。ベンチマークの *ジャッジキャリブレーション* は、少なくとも四半期ごとに再評価してください — ジャッジモデルは想像以上に速くドリフトします。誤った QA アラートの最大の発生源は、18 か月前に最後に検証されたベンチマークで、本番がもう行っていないことを今も測定しているケースです。

### カスタム言語モデルにおけるハルシネーションの原因は何ですか?

ハルシネーションには複数の上流原因があります — 検索の失敗(上のツリーのステップ 6)、学習カバレッジのギャップ(ステップ 1、間接的に)、デコーディングパスの問題(ステップ 7 における実際のモデル上の懸念)です。[AutoRAG](/ja/autorag/) は、検索インデックスをリリースマニフェストに束縛しリリースごとに再ピン止めすることで、検索側の原因に対処します。残りの 2 つは、モデルの上流におけるパイプラインレベルの修正を必要とします。

### 学習データが問題かどうかをどう判断しますか?

失敗したリリースのデータセット SHA が、直前の良好なリリースのデータセット SHA と一致するのであれば(ツリーのステップ 5)、データは *直接の* 原因ではありません。異なっていれば、見つけたことになります。より難しい問い — 「データセットは当社の本番スライスカバレッジに対して *完備* しているか?」 — がステップ 1 でテストするものです。評価には完備していても、本番トラフィックには不完備なデータセットは、スライスカバレッジの問題です。

### モデル全体を再学習せずに QA 失敗を修正できますか?

はい — 7 回のうち 6 回は、修正は再学習ではありません。ツリーのステップ 1〜6 には、モデルに触れない修正方法があります: 評価を更新する、ジャッジを再校正する、プロンプト SHA を再登録する、前処理を修正する、データセットを再ピン止めする、または検索インデックスを再ピン止めする。再学習はステップ 7 で、最も高価な修正であり、実際のモデルリグレッションのために確保されています。リリースパイプラインの[監査証跡](/ja/compliance/)があれば、モデル変更に対するのと同じプロビナンス規律でこれらの上流修正を行えます。

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement with per-category variance from coding (86%) down to writing (36–44%). Anchor for step 2 — why judge calibration has to be measured per slice rather than assumed from a published headline number.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). The dominant 2026 failure-mode writeup. Names dashboard-edit prompt drift as the most-cited cause of production LLM incidents. Anchor for step 3.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — Measure function.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>. The "Measure" function explicitly covers benchmark-validity and evaluation-coverage as part of governance, not as a separate engineering concern. Cited as the institutional anchor for treating eval design as the first diagnostic step.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — retrieval-augmented generation evaluation.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). The reference framework for RAG-side evaluation. Anchor for step 6 — separating retrieval failures from generation failures requires a RAG-aware eval discipline.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — root-cause distribution across customer rollouts.</strong> The percentages in the pie chart are our internal observation across Divinci customer rollouts, not from a controlled benchmark. Your distribution will vary by workload type, fine-tune cadence, and team discipline. The relative ordering (steps 1–2 dominating) is stable across the cohort we've measured; the exact percentages are not portable to your environment without your own data.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The four-stage release pipeline.</strong> <a href="/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Each diagnostic step in this post corresponds to a manifest field bound at Stage 1 — Register. Without the manifest discipline upstream, the diagnostic loses its grip; you can't diff what you didn't bind.
</li>
</ol>

---

*本シリーズ次回:* **2026 年のカスタム LLM の自動回帰テスト。** 本記事は QA アラートが発火した後の診断に関するものでした。次回は、そもそもアラートを駆動した回帰テストの規律 — 評価に何を入れるか、それを正直に保つ方法、そして回帰テストがジャッジと食い違い始めたときに何をすべきか — について述べます。
