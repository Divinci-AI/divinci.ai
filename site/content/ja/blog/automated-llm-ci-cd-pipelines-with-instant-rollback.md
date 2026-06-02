+++
title = "即時ロールバックを備えた LLM CI/CD パイプラインの自動化"
description = "4 段階リリースパイプラインの下層に位置する運用レイヤー — どの判断が自動的に発火し、どの判断に人間の介在が必要なのか、実際のロールバックドリルがどのようなものか、そして最終的に得られる MTTR の数値について解説します。"
date = 2026-05-30T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "CI/CD", "Automation", "Rollback", "MTTR", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-llm-ci-cd-pipelines-with-instant-rollback-veo31.webm"
hero_video_poster = "/images/automated-llm-ci-cd-pipelines-with-instant-rollback-hero-poster.webp"
reading_time = 11
summary = "人間の承認ゲートとゲートの間で、LLM リリースパイプラインは自律的に動作するか、しないかのどちらかです。本記事はアーキテクチャ記事の運用編であり、自動化のスペクトラム(どの判断が自動的に発火し、どの判断に人間が必要で、どの判断はオーバーライドに署名が入るまでハードストップするか)を整理し、実際のロールバックドリルがどのようなものかを示し、最終的に得られる MTTR の数値で締めくくります。"
+++

*リリースサイクルからのノート — Part V*

---

前四半期に最も引用されたのに公開されなかったページは、午前 2 時 14 分にオブザーバーが独自に発火させたものでした。候補リリースはゲートを通過し、必要な 4 分間 5% で滞留し、25% に進んだあと、そこで止まっていました。1 分ごとの品質モニターは法務領域スライスで連続 3 回の閾値未満の測定値を検知し、ロールアウトを停止して、ルーティングを以前のリリースに戻しました。オンコールエンジニアの通知が発火した時点 — 障害ではなくレシート用の通知 — では、本番トラフィックはすでに 9 分間、既知の良好なリリース上で動作していました。

誰も何もする必要はありませんでした。[本シリーズの第 1 回の記事](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)で述べたアーキテクチャは、4 つの段階が何であるかを記述しています。本記事は、人間の承認の合間で実際に何が動作するか — アーキテクチャの下層にある自動化レイヤー、すなわちパイプラインが自律的に正しい判断を下せるかどうかの境界 — についてです。

中心的な主張: **パイプラインの判断の大半は自動化されるべきだが、すべてではない**。境界が重要です。すべてを自動化するパイプラインは、いずれ人間が止めるべきリリースを昇格させてしまいます。何も自動化しないパイプラインは、存在意義がありません。その境界を正しく引くことが、本記事のテーマです。

## 自動化のスペクトラム

すべてのパイプラインの判断は、*「人間の通知なしで自律的に発火する」*から*「明示的な署名付き承認なしには進行を拒否する」*までのスペクトラム上のどこかに位置します。以下は、当社がリリース済みのパイプラインにおいて、負荷を担う各パイプライン動作がそのスペクトラム上のどこに位置するかを示したものです。

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="自動化のスペクトラム。左端の完全自動化から右端の常に人間の承認が必要までを示す。プロット対象の判断: 完全自動化側にはオブザーバーの 1 分ごと品質評価、カナリアチェックポイントのヘルスチェック、自動ロールバックトリガー。中央にはゲートパス進行とカナリアチェックポイントの昇格。人間側にはリリース登録とマニフェストコミット。常に人間側にはゲートフェイルオーバーライド判断とコールドスタートリリースのシャドーデプロイ。">
<title>自動化のスペクトラム</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">自動化のスペクトラム</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">負荷を担う各パイプライン判断の位置 — 完全自律(左)から常に人間(右)まで。</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">完全自動化</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">自律発火、</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">通知なし</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">通知のみ</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">自動実行、</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">レシート+ページ</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">問題なければ進行</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">既知の時間窓内で</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">人間が拒否可能</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">人間が起動</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">明示的な</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">ユーザー操作が必要</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">常に人間</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">署名済み根拠</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">なしには拒否</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">オブザーバー 1 分ごとの</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">品質評価</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">5% トレースサンプルで</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">継続実行</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">カナリアチェックポイント</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">ヘルスチェック</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">5/25/100 で p95 +</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">5xx + 出力品質</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">自動ロールバック</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">トリガー</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 分連続で</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">閾値未満</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">ゲートパス通過から</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">カナリアへ進行</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">全スライス ≥ 閾値</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ 5% で自動開始</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">チェックポイント</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">滞留中にモニターが</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">維持されれば進行</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">リリース</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">登録</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">顧客が新しい</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">マニフェストをコミット</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">ゲートフェイル</text>
<text x="830" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">オーバーライド</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">監査ログに書面の</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">根拠が必要</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">赤いマーカー</tspan> = パイプラインの挙動が非対称な 2 つの判断: 自動ロールバックは自律発火し、オプトアウトできない。ゲートフェイルオーバーライドは進行を拒否し、根拠の省略はできない。</text>
</svg>
</figure>

上の図のマーカーのうち 2 つは、ゾーンの色ではなく赤で示されています。これは非対称な判断 — パイプラインが「誰が何を呼び出してよいか」について強い立場を取る 2 つの場所 — です。**自動ロールバックトリガー**は問い合わせずに発火します。設定でオフにすることはできません。これを備えている目的そのものが、午前 2 時 14 分に機能することだからです。**ゲートフェイルオーバーライド**は書面の根拠なしには進行を拒否します。これも設定でオフにすることはできません。これを備えている目的そのものが、将来の自分がその理由を読む必要があることだからです。パイプラインのその他の部分の多くは設定可能ですが、この 2 つだけは違います。

## 自動ロールバックが実際にどう発火するか

自動ロールバックについて最もよく聞かれる質問は*「誤った理由で発火しないようにする仕組みは何か?」*です。正直な答えは「単独で防いでいる仕組みは何もない」です。保護は、このトリガーがどう配線されているかから生まれます。

Observe ステージは、1 分ごとのスコアリングループを実行します。毎分次を行います:

1. アクティブリリースから直近の本番トレースの小さなセットをサンプリング。
2. 各トレースを*アクティブモデル*で再生(候補ではなく — 実際に提供しているものをスコアリングしている)。
3. Gate-2<sup><a href="#ref-1">[1]</a></sup>を駆動したものと同じ、人間アンカー付きでキャリブレーションされたジャッジを使って各リプレイをスコアリング。
4. サンプル全体に対する単一の出力品質スコアを計算。これを `CanaryHealthSample` に書き込み。

ロールバックは、**1 分ごとのサンプルが連続 3 回**ロールバック閾値を下回ったときに発火します(既定値: ゲート閾値の 0.85 — つまりゲートが 0.65 なら 0.55)。1 分の悪化ではなく、3 分連続です。3 分間のロックアウトは最も安価なノイズフィルタであり、単発の異常値は何もトリガーしませんが、持続的な回帰は引き起こします。

ロックアウトが解除されると、ロールバックワーカーは次を実行します:

```bash
# 実際には — パイプラインが自律的にこれを実行する。人間の ack は不要。
POST /api/v1/releases/<previous_release_sha>/activate
# レスポンスは <1s; ~100 レプリカのサービスで処理中のドレインは ~12s
```

レシートが発火します。オンコールエンジニアは Slack の通知を*レシート用*に見るのであり、障害用ではありません。レシートを開くと、3 つの閾値未満の測定値、経過時間、そして `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup> のハッシュが見えます。12 秒は処理中のドレイン時間で、スワップ自体は 1 秒未満です。エンジニアが「自分で何かする必要があるか?」と尋ねられるほど目が覚める頃には、その答えは「いいえ、ただしゲートがこれを通した理由は確認すべきです」になっています。

## 実際の自動ロールバックレシート

これが本番でのレシートの見た目です。[コンプライアンスページ](/ja/compliance/)に記載されているのと同じハッシュチェーン形式で、自動ロールバックイベント固有の追加フィールドが付加されています:

```json
{
  "kind": "auto_rollback",
  "release_id": "rel_a01c66",
  "previous_release_id": "rel_8f72b1",
  "trigger_at": "2026-05-29T02:14:23Z",
  "completed_at": "2026-05-29T02:14:35Z",
  "elapsed_seconds": 12,
  "trigger_reason": "observer_quality_threshold_breach",
  "observer_readings": [
    { "minute_at": "2026-05-29T02:11:00Z", "quality_score": 0.523, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:12:00Z", "quality_score": 0.508, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:13:00Z", "quality_score": 0.491, "below_threshold": true,  "slice": "legal-IP-licensing" }
  ],
  "rollback_threshold": 0.55,
  "active_manifest_sha256_before": "9abaeaf6c91f8b...",
  "active_manifest_sha256_after":  "8f72b1de4a93c5...",
  "audit_chain_signature": "sha256(...)",
  "notified_users": ["oncall@customer.example"],
  "notification_sent_at": "2026-05-29T02:14:36Z"
}
```

レシートそのものが、オンコールにとっての最初の接点です。これを読めば、半分眠っているエンジニアが実際に尋ねるであろう質問 — 何がトリガーしたか、どのスライスが失敗したか、どれだけ失敗したか、スワップにどれだけかかったか、今何が動いているか — に答えが出ます。そこから次のアクションは通常*「そもそもゲートがこれを通した理由を確認しに行く」*になります — そして失敗したリリースのレシートにはスライス単位の Spearman テーブルがすでに含まれています。

## パイプラインが自律的に行わないこと

「自動ロールバックは問い合わせずに発火する」の系として、その他のいくつかの動作は能動的に行えないようになっています。3 つの明示的な拒否があります。

**ゲートに失敗したリリースを、署名付きオーバーライドなしには昇格させません。** ゲート失敗はリリースを `gate_fail` としてマークします。`/activate` エンドポイントはそのマニフェスト SHA を受け付けることを拒否します。これを回避するコマンドラインの呪文はありません。前進する唯一の道は、`forceGateOverride: true` AND `overrideReason: "<自由記述>"` による強制オーバーライドです。理由フィールドは必須で、自由記述、ユーザー ID と並んで監査ログに記録されます。将来の自分が、現在の自分がスライス回帰を許容と判断した理由を読めるよう設計されています。実際の運用でオーバーライドを使ったのは 3 人です。彼らの根拠は今も監査ログに残っています。

**いずれかのモニターが劣化している場合、カナリアから 100% へ進行しません。** チェックポイント滞留終了時に p95 レイテンシ、5xx レート、または出力品質スコアのいずれかが帯域から外れている場合、パイプラインはそのチェックポイントで停止しページします。先に進んで後で謝罪する、ということはしません。

**コールドスタートリリースを自動でカナリアに乗せません。** 本番トラフィックの履歴がないリリース — 新しいデータセットに対する新規ファインチューニングなど — は、出力品質を比較する対象を持ちません。パイプラインはコールドスタートリリースでカナリアを開始することを拒否します。まず 24 時間のシャドーデプロイメントが必要で、これは候補を実際の本番トレースに対して観察しますが、応答は一切提供しません。24 時間後には品質ベースラインが得られます。その後、カナリアを進められます。遅い、誠実、そして設定不可です。

## エンドツーエンドの復旧速度はどれくらいか

当社が公開している復旧時間の数値は **12 秒**です。これは ~100 レプリカのサービスでの処理中のドレイン時間です。マニフェストスワップ自体は 1 秒未満です。読者にとって有用にするためには、12 秒を分解する必要があります:

- **ロールバック前の 0〜60 秒:** 連続 3 回の閾値未満の測定値が到着します。最初の閾値未満の測定値がロックアウトタイマーを開始します。その後の毎分、品質が依然として閾値を下回っていればロックアウトが延長されます。
- **t = 0:** 3 回目の閾値未満の測定値が `CanaryHealthSample` に書き込まれます。ロールバックワーカーが 3 回目のストライクを検知し、`/activate previous_release` を発行します。
- **t < 1 秒:** ルーティング層のアクティブリリースポインタ(Redis 上)が切り替わります。新しいリクエストは以前のリリースに到達し始めます。
- **t = 1 〜 ~12 秒:** 候補リリースは、スワップ時点で処理中だったリクエストの応答を継続します。処理中のドレインです。一部のストリーミング応答は自然に完了するまで 8〜10 秒かかるため、典型的なサービスではクリーンアップの尾は約 12 秒です。
- **t ≈ 13 秒:** 監査ログレシートが書き込まれ、署名されます。通知が発火します。

参照点として引用し続けている公開ポストモーテムと比較すると、Cloudflare の 2022 年 6 月の障害<sup><a href="#ref-3">[3]</a></sup>は「何を戻すべきか分かった」から「戻し作業完了」まで 44 分を要しました — しかもそれは*インフラ*層での話です。Atlassian の 2022 年 4 月の障害<sup><a href="#ref-4">[4]</a></sup>は、ステートが複数のシステムに分かれていたため、サイトごとに 12 時間を要しました。DORA<sup><a href="#ref-5">[5]</a></sup>の「エリートパフォーマー」のデプロイ失敗復旧の閾値は 1 時間未満です。12 秒はエリート閾値より一桁優れているのではなく、三桁優れています。これを可能にするアーキテクチャ上の判断は、[Stage 1](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) のバンドル化されたリリースマニフェストです。マニフェストがなければ、ルーティングを再ポイントできる単一のオブジェクトが存在しません。

## ロールバックドリル — 誰も実行しない地味な実践

ここはほとんどのチームが省略する部分です: **ロールバック経路が機能するという唯一の信頼できるシグナルは、計画的にスケジュールされたドリルを実行して確認したことです。** 四半期ごとに 1 回実行しています。ドリルは次の通りです:

1. ランダムにスケジュールされた、平日の営業時間帯を選びます。チームには来ることは伝えますが、具体的な時間は伝えません。
2. カナリアスライスに合成的な品質回帰を注入します。(候補モデルがマジックヘッダーに対して「回答を拒否します」と応答できるテストモードフラグを用意しています — キャリブレーションされたジャッジで確実に失敗します。)
3. テストリリースをゲートを通して押し込みます(通過します — 私たちはロールバックを試験しているのであり、ゲートではありません)。カナリアを開始します。
4. オブザーバーが連続 3 回の閾値未満の測定値を検知します。自動ロールバックが発火します。
5. オンコールエンジニアが反応するのを待ちます。反応にかかる時間を計測します。アラーム状態にページバックしないほどレシートを信頼しているかをメモします。
6. 監査ログのロールバックレシートにテストモードフラグが表示されることを検証し、将来の監査でドリルと実際のインシデントを区別できるようにします。

私たちが初めて実行したドリルはエンドツーエンドで 19 秒かかりました(12 秒のスワップ + 修正が必要だった 7 秒の整定遅延)。最も最近のドリル — 2026 Q1 — は 12 秒でした。ドリルを省略することはできません。四半期ごと、すべての顧客クラスタで。

ほとんどのチームは計画的なロールバックドリルを実行したことがありません。彼らのロールバック経路が初めて動作するのは、実際のインシデントの最中、プレッシャーの下、複数の人がコールに参加している状況です。ドリルこそが、12 秒という数値を「願望」ではなく「実数」たらしめるものです。

## 本記事が解決しないこと

3 つの率直な制限事項:

**自動ロールバックはピンポンする可能性があります。** 候補リリースと以前のリリースの両方が悪い場合 — 例えば以前のリリースにも誰も気づかなかった緩やかなスライス回帰があった場合 — パイプラインはロールバックでき、その後以前のリリースもロールバック後オブザーバーで失敗し、ロールバック先となる第 3 のリリースが存在しなくなります。パイプラインは右往左往するのではなく、メンテナンスページにトラフィックを止めます。修正策は、マニフェストチェーンに 1 つを超える健全なリリースをインデックス化し、ロールバック先を設定可能にすることです。

**オブザーバーは推論コストを追加します。** 5% サンプルでアクティブモデルを通して本番トレースを再生することは、推論コストに約 5% を追加します。これは正しいトレードオフだと考えています。一部の顧客は低マージンワークロードでは高すぎると感じ、サンプルレートを下げたいと考えます。そのダイヤルは存在します。

**悪いジャッジはジャッジがないより悪いです。** オブザーバーを駆動するキャリブレーション済みジャッジ自体がミスキャリブレーションされている場合 — 人間アンカーから乖離している、または陳腐化したコーパスで訓練されている — オブザーバーは誤った理由で自動ロールバックを発火させる可能性があります。再キャリブレーションのケイデンスが重要です。Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup>の記事に手順が記載されています。運用上の要件は、実際にそれを実行することです。

## FAQ

### なぜロールバックトリガーは 1 分ではなく連続 3 分なのですか?

LLM の品質スコアにはノイズフロアがあるからです — 1 分の異常な測定値は、サンプリングの偶然(5% のトレースサンプルがたまたま難しいスライスに当たった)から来る可能性があり、必ずしも実際の回帰ではありません。3 分間のロックアウトは、総反応時間を 1 分半未満に保ちつつ最も安価なノイズフィルタです。両方向にチューニングした結果、3 分が当社の顧客の典型的なトラフィック形状に対するスイートスポットでした。トラフィック形状が異なる場合、滞留時間はリリースごとに設定可能です。

### 自動ロールバックは「オフ」に設定可能にすべきですか?

当社のリリース済みパイプラインでは、いいえ。自動安全機構を備える目的は、誰も見ていない午前 2 時 14 分に機能することです。オフに設定可能な自動ロールバックは、「以前は安全網がありました」と書かれた付箋紙です。設定可能にすべきという論拠は、一部のワークロードは偽陽性のロールバックを正当化するには低リスクすぎる、というものです。私たちはその論拠が誤った場所に行き着くと考えます — ワークロードが自動ロールバックには低リスクすぎるなら、リリースパイプライン自体も必要ありません。

### 以前のリリースも悪かった場合はどう扱いますか?

ロールバック先は既定で `previous_release` ですが、マニフェストチェーンは N-1 だけでなくより多くの履歴を保存しています。オペレーターはロールバックを過去に健全だった任意のマニフェスト SHA に再ターゲットできます — `/api/v1/releases/<historically_good_sha>/activate` — これが自動 N-1 ロールバックが悪い古いリリースに当たったときの手動介入経路です。逃げ道は用意されています。まれです。

### 最適化すべき正しい指標は MTTR ですか、それとも MTBF ですか?

MTTR — 平均復旧時間 — がはるかに正しい指標です。少なくとも LLM システムにとっては。MTBF(平均故障間隔)は、LLM ワークロードが持たない決定論的な「失敗」の概念を前提とします。出力品質は連続的にドリフトします。「失敗」は閾値の判断です。高速な復旧を最適化することは閾値をどこに引くかに対して頑健ですが、決して失敗しないことを最適化することは脆く誤りです。DORA のエリート閾値<sup><a href="#ref-5">[5]</a></sup>自体も MTTR の用語で枠組みされており、それが正しいフレーミングです。

### 実際にロールバックドリルを実行していますか?

はい — 四半期ごと、スケジュール済み、レシートにテストモードフラグを含めることで監査ログ上で実インシデントと区別できるようにしています。私たちが初めて実行したドリルは、気づいていなかった 7 秒の整定遅延を露呈しました。ドリルこそが、経路が実際に機能することを知る唯一の方法です。ランブックを読むだけでは十分ではありません。ほとんどのチームは一度も実行したことがありません。それが、ほとんどのチームの MTTR 数値が測定値ではなく願望である理由です。

## 参考文献

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge のキャリブレーション。</strong> Zheng ら、<a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a>(NeurIPS 2023)。なぜキャリブレーション済みジャッジが必要か、なぜスライス単位の一致が集約された一致より重要かの根拠。オブザーバーの 1 分ごとスコアリングループはこれに依存しています。
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vIndex ウェイトアテステーション。</strong> <a href="/ja/compliance/">Divinci コンプライアンスページ</a>に記載され、<a href="/ja/blog/validating-and-releasing-custom-lms-in-regulated-fields/">規制分野記事</a>で解説されています。自動ロールバックレシートの `vindex_sha256_before/after` フィールドは、当社のログを信頼することなく監査人が検証できる暗号学的アンカーです。
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare 2022 年 6 月の障害。</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>。「06:58: 根本原因を特定し理解。問題の変更を戻す作業を開始… 07:42: 最後の戻し作業が完了。」インフラ層で戻しに 44 分かかった理由の一部は、エンジニアが互いの戻し作業に踏み込んだことです。「マニフェスト駆動のスワップにはその障害モードがあり得ない」という主張の根拠。
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian 2022 年 4 月の障害。</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>。サイトごとに復旧に 12 時間、883 サイトの合計で 14 日。ステートが独立してバージョン管理されたシステムに分かれていたためです。「バンドル化されたリリースマニフェストこそが、時間ではなく秒単位を可能にする」という主張の根拠。
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>DORA のデプロイ失敗復旧閾値。</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>。「デプロイ失敗復旧時間」のエリートパフォーマー閾値は 1 時間未満と記載されています。12 秒のパイプライン数値はエリート閾値より三桁低く、これが比較を読む正しい方法です。
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AI ジャッジのキャリブレーション。</strong> 関連記事 <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>。人間アンカー付きジャッジを長期にわたってキャリブレーションに保つ手順。本記事の運用上の主張 — 自動ロールバックはそれを駆動するジャッジの良さの分だけ機能する — は、ジャッジが実際に定期的に再キャリブレーションされている場合にのみ成立します。
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>内部 — Divinci パイプラインリファレンス。</strong> この自動化レイヤーの基盤となるアーキテクチャ: <a href="/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">4 段階パイプラインの記事</a>。API サーフェスの全容は <a href="/ja/api/">API リファレンス</a>に記載されており、リリース管理セクションが本記事で言及している部分です。
</li>
</ol>

---

*本シリーズの次回:* **2026 年のカスタム言語モデル向け CI テスト。** 本記事は人間の承認の合間の運用レイヤーについてでした。次回はパイプラインが開始される*前*のレイヤー — マージ前 CI: PR 時点で何を評価するか、ゲートに到達する前に実際にどの種類の回帰を捕捉するか、どの種類を捕捉できないか — についてです。
