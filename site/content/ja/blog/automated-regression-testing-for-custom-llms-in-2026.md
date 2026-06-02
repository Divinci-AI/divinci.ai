+++
title = "2026年におけるカスタムLLMの自動リグレッションテスト"
description = "モデルだけでなく、評価そのもののドリフトを捕捉するリグレッションスイートの構築方法。スライス対応ゲート、キャリブレーション済みジャッジ、本番トレースのリプレイ。"
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "images/automated-regression-testing-for-custom-llms-in-2026-hero.png"
reading_time = 13
summary = "LLMの「リグレッション」の多くは、評価スイート自体のドリフト――ジャッジのキャリブレーション、スライスカバレッジ、プロンプトテンプレート、検索インデックスのドリフトです。本稿では、それらを捕捉するスイートを、キャリブレーション済みジャッジによるスライス別スコアリングと、ライブ本番トレースに対するリプレイとともに紹介します。"
+++

*リリースサイクルからの覚書 — 第7回*

金曜日の午後4時47分、あなたはプロンプトをわずか一文字だけ調整してリリースしました。集約評価スコアは0.873から0.871へ動きました――ノイズフロアに十分収まる範囲です。月曜日の朝、サポートキューは、6か月前から安定していたために監視を止めていたクエリのクラスをめぐって炎上しています。

モデルにリグレッションは起きていません。モデルは同じモデルです。**評価のほうがあなたの足元からドリフトしていったのです。** ある顧客セグメントで6か月かけて緩やかに成長してきた挙動は、ゴールデンデータセットに一度も組み込まれず、ジャッジプロンプトは10月に人間と最後にキャリブレーションされたきりで、検索インデックスは先週の水曜日、更新された埋め込みモデル上で密かに再構築されていました。

これは第6回で指摘した通りです――[モデルが正解であるのは、おおよそ7件のアラートに1件](/ja/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)。つまりリグレッションスイートは、モデルだけでなく、スイート自身のドリフトも検出しなければなりません。本稿はそのためのスイートです。

## カスタムLLMにとってのリグレッションテストとは何か

ソフトウェアのリグレッションテストは、固定された入力に対して `output == expected` を表明します。関数が決定論的だからこそ成立します。

言語モデルは同じ意味での関数ではありません。同じプロンプトでも温度 > 0 では妥当な補完の分布を生成し、「妥当」は多次元です――質問に答えたか、検索したコンテキストに基づいているか、安全エンベロープの内側にとどまったか、レイテンシ予算内に応答が戻ってきたか。したがってカスタムLLMのリグレッションテストとは、**凍結したベースライン分布に対して挙動の分布を測定すること**を意味します――重要なスライスごとに、人間に対してキャリブレーション済みのジャッジで、本番トラフィックに似た入力に対して。

これが意味を持つには、まず3つの要素が整っている必要があります。

1. 集約ではなく**スライスレベルで本番に似たゴールデンデータセット**。
2. **キャリブレーション済みのジャッジ**――「GPT-5をジャッジに使っている」ではなく、「3名のヒューマンレーターに対してSpearman ρ ≥ 0.7 を測定し、先週リフレッシュした」というレベル。
3. **ベースラインマニフェスト**――そのスコアを記録したときの正確なモデル重み、プロンプトテンプレート、検索インデックス、ジャッジバージョン。これがなければ、スコアが動いたのはモデルが変わったからなのか、物差しが変わったからなのか判別できません。

Divinciはこの3つすべてをファーストクラスのオブジェクトとして扱い、ハッシュでリンクし、コミットごとにスコアリングします。本稿の残りは、それらの組み立て方です。

## なぜほとんどのLLMリグレッションスイートは本物のリグレッションを捕捉できないのか

2026年のカスタムLLMにおける主たる失敗モードは、TianpanのSigma Inferenceチームが2026年4月のポストモーテムで *Semver Lie*<sup><a href="#ref-1">[1]</a></sup> と名付けたものです。集約メトリクスはフラットまたは改善する一方で、1つか2つの本番スライスが密かにリグレッションするというパターンです。当該スライスはテスト設計時にはトラフィックの5%未満で、ゴールデンデータセットに入っていませんでした。6か月後にはトラフィックの12%に成長し、モデルはそこで劣化していましたが、集約値ではそもそも気づける構造になっていなかったのです。

直近18か月の公開LLMリリースポストモーテムをすべて精査したところ、同じパターンが繰り返されています――**スイートがグリーンになったのは、間違ったものをスコアリングしていたからです。** 具体的には:

- ゴールデンデータセットはローンチ時にチームが手書きしたきりで、シフトしたトラフィック分布に対して再層化されていなかった。
- LLM-as-judgeのプロンプトは一度設定されたまま、人間ラベルに対して再キャリブレーションされていなかった。ジャッジの一致度は静かに減衰していった<sup><a href="#ref-2">[2]</a></sup>。
- ベースラインスコアは生の数値として保存され、`(model_sha, prompt_sha, judge_sha, dataset_sha, score)` のタプルとしては保存されていなかった。だからリグレッションが起きても、4つのうちどれが動いたのか誰にも分からなかった。

この3つすべてを解決しないリグレッションスイートは、デプロイ時にグリーンになって誤った安心感を与えるだけのCIステップにすぎません。修正は「ケースを増やすこと」ではありません。修正は、リリースごとに**スライス対応・バージョン固定・ジャッジキャリブレーション済み**の測定を行うことです。

## スライス対応分析に耐えるゴールデンデータセットを構築する

弊社が既定で出荷している4バケット構成――本番サンプル60%、敵対的15%、専門家がキュレートしたエッジケース15%、失敗リプレイ10%――は妥当な出発点です。本当にリグレッションを捕捉できるようにするのは、各ケースに紐づく**スライスメタデータ**です。

データセットの各エントリは以下を持ちます: 入力、期待される挙動(完全一致文字列ではなくルーブリック)、検索コンテキスト(あれば)、`slice` タグ――ドメイン、ユーザーセグメント、クエリ意図、言語、長さバケット、その他あなたのプロダクトにとって意味のある分解軸。スイートは**スライスごとに**スコアリングし、しきい値を下回ったスライスがあれば、たとえ集約スコアが上昇していてもリリースをブロックします。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="ゴールデンデータセット構成: 本番サンプル60%、敵対的15%、専門家エッジケース15%、失敗リプレイ10%、すべてスライス層化済み">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">ゴールデンデータセット構成 — 全軸でスライス層化</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">約500ケース規模。バー比率は構成比。集約比ではなく、スライス別カバレッジが必須条件。</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">本番サンプル</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">敵対的</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">専門家エッジ</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">リプレイ</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">層化本番トレース・四半期ごとに更新</text>
<text x="513" y="90" text-anchor="middle">ジェイルブレイク・インジェクション</text>
<text x="627" y="90" text-anchor="middle">ドメイン端・ロングテール</text>
<text x="722" y="90" text-anchor="middle">ポストモーテム由来 ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">各ケースにスライスタグ — スイートは組み合わせごとに別個にスコアリング</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">ドメイン</tspan> · 法務 / 医療 / 一般</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">意図</tspan> · 手順 / 事実 / 拒否</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">言語</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">長さ</tspan> · 短 / 中 / 長</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">セグメント</tspan> · 大企業 / SMB</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">検索</tspan> · グラウンデッド / オープン</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">ツール利用</tspan> · 0 / 1 / 多段</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">新規性</tspan> · 既知 / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">構成比 × スライス = スコアリンググリッド</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">リリースごとにスライス別スコアリング — ベースライン比 Spearman ρ ≥ 0.7、スライス別</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">しきい値を超えたスライスはリリースをブロック。集約スコアは情報用のみ。</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">図は構造的なもの。層化軸とスライス別しきい値は、Divinciのリリースマニフェスト内でプロダクトごとに設定されます。内部仕様――弊社のデプロイで定義されたもの。</figcaption>
</figure>

実運用で守るようになった2つのルール:

**四半期ごとに再サンプリング。** 本番トラフィック分布は、ほとんどのチームが測定するより速くシフトします。本番サンプルバケットは、直近90日のトラフィックに対して四半期ごとに再層化しています。あるスライスがトラフィックの5%超に成長し、ゴールデンデータセットでは2%未満だった場合、次のリリースまでにバックフィルします。

**ポストモーテムごとにケースを追加。** 本番に到達して捕捉できなかったリグレッションは、データセットに欠けていたケースです。ポストモーテムから48時間以内にリプレイバケットへ追加し、それを浮上させたスライスでタグ付けします。

## ユーザーより先にドリフトを検出するには

ドリフトには明確に4種類あり、最後の1つしか監視しないリグレッションスイートは、ほとんどのリグレッションを取りこぼします。

| ドリフト種別 | 何が動くか | 検出シグナル | アクション |
|---|---|---|---|
| **品質ドリフト** | 固定スライスに対するジャッジのスコア | スライス別 Spearman ρ がベースライン比で低下 | リリースをブロックし、[第6回の診断ツリー](/ja/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)に従って診断 |
| **カバレッジドリフト** | 本番トラフィック分布とゴールデンデータセット分布 | スライス比率間のKLダイバージェンス | ゴールデンデータセットを再サンプリング |
| **ジャッジドリフト** | ジャッジモデルと人間との一致度 | 凍結された人間ラベル監査セットに対する Spearman ρ | ジャッジプロンプトを再キャリブレーション、またはジャッジを置き換え |
| **本番ドリフト** | 同一モデルにおけるライブ本番スコアとオフラインスコア | 本番トレースリプレイのスコア乖離 | 検索 / 前処理 / ランタイムを調査 |

ほとんどのスイートが測定するのは品質ドリフトです。金曜午後のリグレッションが潜むのは、たいてい残りの3つです。Divinciは4種類すべてをベースラインマニフェストに対して追跡し、PRごとにスライス別スコア内訳を表示し、ドリフトが蓄積する前に検出する週次ジャッジキャリブレーションジョブを備えています。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="30日のチャート。集約タスク完了スコアは0.87で平坦を保ちつつ、医療ドメインスライスが0.88から0.74へ静かに低下">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Semver Lie を可視化 — 30日間のタスク完了スコア</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">集約(濃緑)は平坦を維持。医療スライス(赤)は静かにリグレッション。集約ゲートは発火しない。</text>
<g transform="translate(80, 100)">
<line x1="0" y1="0" x2="0" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<line x1="0" y1="250" x2="640" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">0.95</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">0.90</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">0.85</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">0.80</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0.75</text><line x1="-4" y1="200" x2="0" y2="200" stroke="#1e3a2b"/>
<text x="-10" y="254" text-anchor="end">0.70</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="0" y="268" text-anchor="middle">d-30</text>
<text x="160" y="268" text-anchor="middle">d-22</text>
<text x="320" y="268" text-anchor="middle">d-15</text>
<text x="480" y="268" text-anchor="middle">d-7</text>
<text x="640" y="268" text-anchor="middle">本日</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">集約ゲートしきい値 — 0.89</text>
<polyline points="0,40 50,42 100,38 150,40 200,42 250,38 300,40 350,38 400,40 450,42 500,38 550,40 600,42 640,40" fill="none" stroke="#5a7a8f" stroke-width="2"/>
<circle cx="640" cy="40" r="4" fill="#5a7a8f"/>
<polyline points="0,60 50,58 100,62 150,60 200,58 250,60 300,62 350,60 400,58 450,60 500,62 550,60 600,58 640,60" fill="none" stroke="#2d5a4f" stroke-width="3.5"/>
<circle cx="640" cy="60" r="5" fill="#2d5a4f"/>
<polyline points="0,72 50,74 100,70 150,72 200,76 250,72 300,74 350,72 400,70 450,72 500,74 550,72 600,76 640,74" fill="none" stroke="#7a8a4a" stroke-width="2"/>
<circle cx="640" cy="74" r="4" fill="#7a8a4a"/>
<polyline points="0,64 50,68 100,66 150,72 200,80 250,92 300,108 350,128 400,150 450,168 500,184 550,196 600,206 640,214" fill="none" stroke="#a04848" stroke-width="3.5"/>
<circle cx="640" cy="214" r="5" fill="#a04848"/>
<g font-family="'DM Sans', sans-serif" font-size="11">
<rect x="656" y="30" width="120" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="2"/>
<text x="664" y="46" font-weight="700" fill="#5a7a8f">法務スライス</text>
<text x="722" y="46" fill="#5a7a8f">0.910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">集約</text>
<text x="722" y="72" fill="#2d5a4f">0.872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">一般</text>
<text x="722" y="98" fill="#7a8a4a">0.863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">医療スライス</text>
<text x="664" y="232" fill="#a04848">本日 0.743・違反 ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">スライスゲートはここで発火 ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Tianpan Sigma のポストモーテムパターン<sup><a href="#ref-1">[1]</a></sup>を、Divinci社内のスライス命名法で再構成。値は説明用です。</figcaption>
</figure>

## 多次元評価 — スライスごとに4つを同時にスコアリング

単一の合成スコアは、4つのスカラースコアより劣るシグナルです。弊社は次の4次元でゲートします:

- **タスク完了** — レスポンスが実際に質問に答えたか。ルーブリックに対してキャリブレーション済みジャッジでスコアリング。スライス対応。
- **忠実性** — 検索コンテキストを参照したレスポンスについて、すべての主張がそのコンテキストに基づいているか。ハルシネーションはここに最初に現れます。
- **安全性** — 拒否の正しさ、ジェイルブレイク耐性、PII / ポリシー露出。ほぼ常に合格率 ≥ 0.99 でゲート。安全性は柔軟なトレードオフではなく、ハードウォールです。
- **レイテンシ予算** — スライスのSLA内における p95。レスポンスあたりトークン数が倍増したプロンプト変更は、品質が上がってもリグレッションです。

各次元はスライス別のベースラインとしきい値を持ちます。ゲート時に単一の加重スカラーへまとめることは絶対にしません。スライスごとに4つのスコアとして表示し、最初にしきい値を超えた指標でブロックします。医療スライスで忠実性を1ポイント犠牲にしてタスク完了を4ポイント獲得したモデルは、依然リグレッションです。

## カスタムLLMのデプロイをブロックすべきゲートは何か

弊社は3層アーキテクチャを運用し、各層がパイプラインの異なる段階をゲートします([段階分類は第1回を参照](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/))。

**第1層 — スモーク(コミットごと、約90秒)。** インパクトの大きいスライスから抽出した20〜30件のクリティカルケース。フルスイートが計算リソースを消費する前に、壊滅的なリグレッションを捕捉します。スモークが失敗すれば、残りは実行されません。

**第2層 — フルスイート(PRごと、約12分)。** 完全なゴールデンデータセットを、4次元すべてでスライス別にスコアリング。ベースラインマニフェストに対するスライス対応の Spearman ρ。しきい値違反はマージをブロックします。PRコメントには、どのスライスのどの次元がどれだけ動いたかと、失敗ケースの例5件が列挙されます。

**第3層 — ベースライン比較(リリース候補、約25分)。** 候補モデルを直近14日の本番トレースに対してリプレイします――[第1回](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)で出荷した*クローズドループの本番トレースリプレイ*です。ゴールデンデータセットをスコアリングするのと同じキャリブレーション済みジャッジが、リプレイ出力もスコアリングします。リプレイスコアがオフラインスコアからしきい値以上に乖離したスライスがあれば、リリースをブロックします。この層こそ、ゴールデンデータセットがまだ把握していないドリフトを捕捉する場所です。

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="3層ゲート判定ツリー: コミットごとのスモークテスト、PRごとのフルスイート、リリース候補での本番トレースリプレイ">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">3層リグレッションゲート — 各ブロックは早期失敗、各層が深さを追加</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① スモーク・コミットごと</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">ケース数: 20〜30件 重要</text>
<text x="14" y="82">所要時間: 約90秒</text>
<text x="14" y="102">次元: タスク + 安全のみ</text>
<text x="14" y="122">スライス: 量上位3</text>
<text x="14" y="148" font-weight="600">ブロック対象:</text>
<text x="14" y="168">壊滅的な失敗</text>
<text x="14" y="186">不正な出力形式</text>
<text x="14" y="204">安全ウォール違反</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">早期失敗 — 後続フルスイート</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② フルスイート・PRごと</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">ケース数: 約500件 全数</text>
<text x="14" y="82">所要時間: 約12分</text>
<text x="14" y="102">次元: タスク/忠実/安全/遅延</text>
<text x="14" y="122">スライス: 全層化</text>
<text x="14" y="148" font-weight="600">ブロック対象:</text>
<text x="14" y="168">スライス別 ρ &lt; 0.7</text>
<text x="14" y="188">スライス指標がしきい値以下</text>
<text x="14" y="208">ジャッジ一致 &lt; 0.65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">PRコメントが内訳を提示</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ リプレイ・リリース候補</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">ケース: 14日分のライブトレース</text>
<text x="14" y="82">所要時間: 約25分</text>
<text x="14" y="102">次元: 4次元全て・スライス対応</text>
<text x="14" y="122">ソース: 本番トレース蓄積</text>
<text x="14" y="148" font-weight="600">ブロック対象:</text>
<text x="14" y="168">オフライン ↔ リプレイ乖離</text>
<text x="14" y="188">ゴールデン未収載スライスの</text>
<text x="14" y="206">ドリフト</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">ロールアウト直前の最終ゲート</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">合格</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">合格</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">3層すべてが同じベースラインマニフェスト――(model_sha, prompt_sha, retrieval_sha, judge_sha)――に対してスコアリングするため、スコアが動いたとき<tspan font-weight="600" fill="#1e3a2b">どの</tspan>次元がドリフトしたかが特定できる。単に<tspan font-weight="600" fill="#1e3a2b">何かが</tspan>動いたという情報にとどまらない。</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">所要時間は社内値――約500件のゴールデンデータセットと約14日の本番トレースを持つ代表顧客について、Divinciの本番CIランナーで実測。</figcaption>
</figure>

## ジャッジを信用する前にキャリブレーションする

LLM-as-judge は、これらすべてを数百ケースを超えてスケールさせる仕組みです。同時に、ジャッジが更新されたりデータ分布が動いたりしてもキャリブレーションを維持する義務は何もないため、リグレッションスイートが密かに機能停止する場所でもあります。

弊社は、ゴールデンデータセットと同じスライスで層化した、少なくとも100ケースの凍結された人間ラベル監査セットに対して、すべてのジャッジプロンプトをキャリブレーションし、毎週再実行します。出荷基準は **Spearman ρ ≥ 0.7**(ヒューマンレーター中央値に対して)、安全性のバイナリ判定では **Cohen's κ ≥ 0.6** です。両者は、MT-Bench型のジャッジが人間間一致レベルで人間レーターを追跡するとされるしきい値<sup><a href="#ref-2">[2]</a></sup>を上回ります。

週次キャリブレーションがしきい値を下回ると、ジャッジは自動的に引退させられ、オンコール評価エンジニアにページが飛びます。リリースパイプラインは、もはや測りたいものを測れていないジャッジでゲートするのではなく、候補を保留状態にします。

```bash
# 週次ジャッジキャリブレーションジョブを実行
curl -X POST https://api.divinci.ai/v1/regression/judges/calibrate \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "judge_id":     "rubric-v7",
    "audit_set":    "human-labels-2026-04",
    "min_spearman": 0.70,
    "min_kappa":    0.60,
    "on_fail":      "retire_judge_and_page"
  }'
```

## Divinci の差別化要因 — クローズドループの本番トレースリプレイ

第3層ゲートは、ほとんどのリグレッションスイートが持っていない部分です。フローは第1回で出荷したものと同じで、リグレッションテスト向けに一点だけ特化しています――すべてのリリース候補について、オフラインのゴールデンデータセットでのスコアと、14日間ウィンドウでリプレイした本番トレースでのスコアを、スライスごとに比較します。ゴールデンデータセットはモデルにこうあってほしかった姿を測ります。リプレイは、モデルが先週実際にどう振る舞っていたであろうかを測ります。

両者がスライス別の乖離許容量を超えて開くと、リリースはブロックされます。その不一致がシグナルです――ゴールデンデータセットがもはや代表的でない(カバレッジドリフト)か、候補が本番の前処理と検索によって形作られたトレース上で異なる振る舞いをしている(本番ドリフト)か、いずれにせよ、ユーザーより先に把握できます。

オフライン実行をスコアリングするジャッジと、リプレイ実行をスコアリングするジャッジは同一です。監査ログには、両方のスコアセット、両方のジャッジバージョン、リプレイされたトレースID、ブロックを発火させた乖離量が記録されます。乖離量そのものが、弊社が持つ最も有用な診断シグナルであり、[第6回の診断ツリー](/ja/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)を次に引き継ぐ担当者の手に渡されます。

## vIndex レシートでゴールデンデータセットをアンカーする

スイート内のあらゆるスコアは、後で再現できなければ無意味です。弊社はリリースごとにゴールデンデータセットをハッシュ化し、そのハッシュをモデルSHA、プロンプトSHA、ジャッジSHA、キャリブレーション記録とともに vIndex レシートにチェーン化します。レシートは外部からアンカー可能で、監査人は6か月後でも弊社の正確なリグレッション実行を再現し、申告したスコアを検証できます。

```json
{
  "release_id": "rel_3f1a-2026-05-26",
  "model": { "sha": "0c1f9…", "weights_uri": "r2://models/custom-v7.2", "open_weights": true },
  "prompt": { "sha": "c4a8e…", "template_id": "support-v3.4" },
  "retrieval": { "index_sha": "b21f0…", "embedder": "e5-mistral-7b-instruct" },
  "judge": { "sha": "d8e21…", "rubric_id": "rubric-v7", "spearman_vs_humans": 0.74 },
  "dataset": { "sha": "a90b1…", "n": 512, "slices": 17, "stratified_at": "2026-04-30" },
  "scores": { "aggregate": 0.872, "by_slice": { "/* … */": "/* per-slice scalars */" } },
  "replay": { "trace_window_days": 14, "n_traces": 8430, "max_gap": 0.018 },
  "vindex_anchor": "sha256:f0bfd2…",
  "verifiable_at": "https://vIndex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**オープンウェイトに関する但し書き。** 上記レシートが重みの来歴を保証するのは、モデルがオープンウェイトの場合に限られます――vIndex は実際の重みバイトをアンカーします。クローズドAPIのモデル基盤(OpenAI / Anthropic / Google のマネージドモデル)では、レシートには引き続き意思決定チェーンが記録されます――各ゲートスコア、各ジャッジ結果、キャリブレーション記録――が、重みフィールドは空となり、モデルアーティファクトを独立に検証することはできません。これはレシート内および[コンプライアンスドキュメント](/ja/compliance/)で明記し、監査人に誤った印象を与えないようにしています。完全な vIndex チェーンの恩恵が最大化されるのは、自分で重みを管理しているリリースです。

## 弊社が実際に出荷してきた4フェーズの実装タイムライン

初週でアーキテクチャを丸ごと出荷しようとするチームは、ツール選定で足踏みします。以下は、実際にうまくいく順序です。

**フェーズ1 — ベースライン(第1週)。** 直近30日分の本番トレースから層化サンプルを抽出。エンジニア2名にそれぞれ100ケースずつタスク完了を手動ラベリングしてもらいます。レーター間一致度(目標 Cohen's κ ≥ 0.6)を算出します。その値が出発点となるヒューマンベースラインで、他のあらゆるものはこれに対してキャリブレーションされます。

**フェーズ2 — ハーネス(第2〜3週)。** 100ケースのデータセット上で評価ハーネスを立ち上げます。人間ラベルに対してキャリブレーション済みのジャッジを追加。ハーネスが ρ ≥ 0.7 の範囲で人間スコアを再現することを検証します。多くのチームは、最初のジャッジプロンプトでこれに失敗し、2度書き直すことになります――これは普通のことです。

**フェーズ3 — ゲート(第3〜4週)。** ハーネスをCIにブロックではなく警告として接続。2週間観察します。誤検知率を見ながら発見されたしきい値だけが、生き残るしきい値です。誤検知率が5%を下回ってからブロッキングに昇格させます。

**フェーズ4 — リプレイループ(継続)。** ゲートが安定してブロックするようになったら、本番トレースリプレイ層を有効化します。ここでスライスカバレッジのギャップが浮上し、すべてのポストモーテムがゴールデンデータセットにケースを戻し始めるようになります。

## これで解決できないこと

本シリーズの各回と同じ姿勢で、誠実な制限を3点。

1. **スイートのドリフト対応は終わりのない作業。** リグレッションテストはプロジェクトではなくインフラです。ゴールデンデータセットは四半期ごとに再層化、ジャッジは毎週再キャリブレーション、しきい値予算はポストモーテムごとに再チューニングが必要です。「スイートを出荷したら歩み去る」というバージョンはありません。
2. **完璧にキャリブレーションされたジャッジでも結局はモデル。** 人間レーターに対する Spearman ρ = 0.74 は、ジャッジの判定の約4分の1が人間中央値と不一致であることを意味します。その残余不一致が、すべてのスコアにおけるノイズフロアです。リリースレポートで明示的に提示しますが、その存在を忘れたチームはいずれ驚くことになります。
3. **クローズドAPI基盤は検証可能範囲を制限する。** クローズドAPIモデルでは、リグレッションスイートは挙動を測定できますが、重みの来歴は検証できません。完全な再現性が必要な場合――規制業種、監査対象デプロイ――トレードオフはモデル選択にあり、スイートにはありません。

## 次回

シリーズ最終回となる第8回は、CI内部のループを閉じます。本回と第5回がゲートで何を動かすかの話だったのに対し、次回はゲートがスコアリングする候補そのものを生み出すCIレイヤー――マージ前評価、プロンプトテンプレートの契約テスト、12分間の評価スイートを予算を破綻させずに回すためのCIフリートのサイジング――を扱います。これまで書いてきたすべての下にあるエンジニアリングレイヤーです。

## FAQ

**LLM評価とLLMリグレッションテストの違いは?**

評価は、絶対的なルーブリックに照らして、モデルがある時点で品質基準を満たしているかを測定します。リグレッションテストは、候補が凍結されたベースラインと同じ挙動をしているかを、スライス別・多次元で測定します。ベースラインの存在こそがリグレッションテストたる所以であり――Divinciは両モードを出荷し、リグレッションモードでは (model_sha, prompt_sha, judge_sha, dataset_sha) を固定するため、スコアが動いたときにどの入力が動いたのかを特定できます。

**ゴールデンデータセットには何件あればよいですか?**

思っているより少なく、思っているより上手く層化することです。明確に定義した5スライスについて200ケースで有用なリグレッションカバレッジを出荷したこともありますし、層化されていなかったために重要なものを全く捕捉できなかった5,000ケースのデータセットも目にしてきました。まずは層化された200件から始め、ポストモーテムを通じてリプレイバケットを一件ずつ育てるのがよいでしょう。

**人間レビュアーと LLM-as-judge のどちらを使うべきですか?**

両方を、人間がジャッジをキャリブレーションする形で使います。人間はリリースサイクルのCIゲートが必要とするスコアリング量に追いつけません。ジャッジが量をこなし、人間がジャッジをキャリブレーションする――週次で Spearman ρ ≥ 0.7 を測定します。どちらか片方だけでは失敗モードです。

**非決定論的な出力はどうテストすればよいですか?**

文字列ではなく分布をスコアリングします。表現の揺れを跨いでジャッジが適用できるルーブリックでスコアリングし、各入力を温度 > 0 で3〜5回実行することで、スライス対応スコアが単一サンプルではなく補完の分布の上で算出されるようにします。決定論的出力が真に必要なケース(構造化出力のツールコール、分類)に限って、温度を絞ります。

**最初のCI品質ゲートではどのメトリクスを優先すべきですか?**

タスク完了と、安全ゲートを1つ。いずれもスライス別に。最初の2つがキャリブレーションされる前に次元を増やすとノイズが発生します。多く出荷しすぎたチームは、結局そのノイズでゲートする羽目になります。検索を有効化するときに忠実性を追加し、最初の2つが安定したらレイテンシを追加します。

## 参考文献

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 2026年4月29日。スライス対応リグレッション分析における2026年の代表的失敗モードの命名元。集約スコアは平坦のまま、低ボリュームスライスが密かにリグレッションする。
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685。強力なLLMジャッジがオープンエンドタスクにおいて、ほぼ人間間一致レベル(約80%)で人間レーターと一致するという実証的証拠。報告された失敗モードは、人間に対するキャリブレーション監査が検出を狙うものでもある。
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796。ファインチューニングされたニューラルネットワークにおける破滅的忘却の基礎的成果――ファインチューンされたカスタムLLMが、目標タスクでのゲインだけでなく、汎用能力の損失についてもリグレッションテストされなければならない理由。
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> クローズドAPIとの対比: スライス別のセマンティック品質ではなく、インフラメトリクス(レイテンシ、エラー、CPU)でゲートする。
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904年。スライス対応ゲートを支える順位相関係数――ジャッジのスコアリングスケールのドリフトに対して頑健であり、まさにそれが必要としていた性質。
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> 「デプロイがインシデントを引き起こす頻度」と「復旧速度」の業界横断ベースライン。ゲートでブロックするリグレッションスイートは前者を下げ、即時ロールバック([第5回](/ja/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/))は後者を下げる。
  </li>
</ol>
