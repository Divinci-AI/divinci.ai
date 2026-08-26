+++
title = "規制業界におけるカスタムLMの検証とリリース"
description = "EU AI法、GDPR第17条、HIPAA、NIST AI RMF — カスタムLLMのリリースパイプラインに対して、能力単位でマッピングします。コンプライアンスの本質的な分岐点は、オープンウェイトとクローズドAPIの分割にあります。"
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vIndex"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "規制業界におけるカスタム言語モデルのコンプライアンスは、ある軸できれいに二分されます。それがオープンウェイトとクローズドAPIです。オープンウェイトのバッキングなら、GDPR第17条の検証可能な消去要件を暗号学的に満たすvindex重み証明を出荷できます。クローズドAPIのバッキングでも同じレシートが決定チェーンをカバーしますが、重み出所の主張はできません。そしてその区別自体がレシートの中で監査人に伝わります。本投稿では、4つの規制フレームワーク(EU AI法、GDPR、HIPAA、NIST AI RMF)を、当社が出荷する4段階のパイプラインにマッピングし、実際のレシートフォーマットを示します。"
+++

*リリースサイクルからの覚書 — 第IV部*

---

法務顧問がエンジニアリングレビューに姿を現します。彼女の質問はひとつです。*「明日、EU AI法第17条の消去権リクエストが届き、特定の患者についてモデルが学習したあらゆる事実を削除せよと求められたら、私たちは実際に削除したことを証明できますか?」*

ほとんどのチームが正直に返せる答えはこうです。「モデルをファインチューニングして忘却させることはできます。学習ランも提示できます。しかし、その情報が構造的に消えていることは証明できません。敵対的なプロンプト次第で再浮上する可能性があるからです。」

これはコンプライアンスの答えではありません。手続き上の肩すくめで終わる、非回答です。

本投稿が扱うのは、カスタムLLMにとって本物のコンプライアンスの答えがどのような形をしているか、という点です。4つの規制フレームワーク(**EU AI法、GDPR第17条、HIPAA、NIST AI RMF**)を、顧客リリース向けに当社が出荷する4段階パイプライン([登録 → ゲート → ロール → 観察](/ja/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/))にマッピングします。すべての規制当局の要請を貫く根本的な緊張は、**オープンウェイトとクローズドAPI**の対立です。Gemma 4ファインチューンについて証明できることと、不透明なベンダーAPIの背後で提供されるリリースについて証明できることは別物です。当社が用いるレシートフォーマットは、その違いを一行ずつ明示的に述べます。その正直さこそが、レシートを監査人にとって有用なものにします。

## 4つの規制当局と、それぞれが実際に求めていること

コンプライアンスの議論は「文書化しました」で済まされがちです。その枠組みは監査人には通用しません。監査人が求めるのは、*あなたのインフラを信頼しなくても検証できる証拠*です。以下の4つのフレームワークは、同じ根本的な要請を異なる語彙で表現しています。

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="4つの規制フレームワークと、それぞれが要求する検証プリミティブ。EU AI法は文書化された論理と人間による監督を要求し、検証プリミティブはvindexによるビット単位の機構的文書化。GDPR第17条は個人データの検証可能な消去を要求し、検証プリミティブはSHA-256レシート付きの重みレベルDELETEパッチ。HIPAAはアクセス監査と開示追跡を要求し、検証プリミティブはリクエスト単位の署名済み決定ログ。NIST AI RMFはガバナンス、マッピング、測定、管理を要求し、検証プリミティブはすべてのリリース決定に対するハッシュ連結レシート。">
<title>4つの規制当局、共通する1つの要請</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">4つの規制当局、共通する1つの要請:信頼ではなく検証を</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">各フレームワークは検証プリミティブを異なる名前で呼びますが、本質は同じです。監査人が確認できる暗号学的証明です。</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI法</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">附属書IVの要求:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• 文書化された論理</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• 学習データの要約</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• 人間による監督措置</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• 市販後監視</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">検証プリミティブ:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">vIndexによるビット単位の</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">機構的文書化</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">違反時の制裁:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">全世界売上高の</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">最大7%</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR第17条</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">消去権の要求:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• 検証可能なデータ削除</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• 実証可能な忘却</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• 敵対的プロンプト下での</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  証明</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">検証プリミティブ:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">SHA-256レシート付き</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">重みレベルDELETEパッチ</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">違反時の制裁:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">最大2,000万ユーロまたは</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">売上高の4%</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">アクセス制御の要求:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• アクセス監査証跡</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• 開示追跡</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• 最小必要限度の</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  PHI露出</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">検証プリミティブ:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">リクエスト単位の</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">署名済み決定ログ</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">違反時の制裁:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">違反類型/年あたり</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">最大190万ドル</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">4つの中核機能:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• ガバナンス</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• マッピング</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• 測定</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• 管理</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">検証プリミティブ:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">リリース決定単位の</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">ハッシュ連結レシート</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">違反時の制裁:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">任意フレームワーク</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(ただし事実上の</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">企業標準)</text>
</svg>
</figure>

これらのフレームワークを興味深いものにしているのは、制裁金の数字ではありません。制裁金の数字は、これらを荷重を担う存在にしているだけです。興味深いのは**検証プリミティブ**、つまり各フレームワークが実際にアーティファクトに対して求める形です。4つのうち3つは異なる語彙で暗号学級の証明を要求します。4つ目(NIST AI RMF)は任意ですが、企業調達では事実上必須となっています。これらはすべて同じ形に収束します。あなたのログを信頼しなくても監査人が検証できるアーティファクトです。

## 分岐点:オープンウェイト対クローズドAPI

ステージ単位のマッピングに入る前に、本投稿全体で最も重要な留保事項を述べます。

**オープンウェイトのモデルバッキングについて** — Gemma、Qwen、Llama、Mistral、GPT-OSSなど、重みがアドレス可能で編集可能なものすべて — Divinciのリリース決定は、**重み証明**(decision timeにアクティブな重みが、マニフェストが登録した重みと厳密に一致することの暗号学的証明)を含むvindexレシートを発行します。これがGDPR第17条の検証可能な消去を可能にする仕組みです。重み空間から特定のエンティティ-関係を取り除く[DELETEパッチ](/blog/deleting-paris-from-a-language-model/)を適用し、レシートにbefore/afterハッシュを埋め込み、監査人は公開vindexに対して検証を再実行することで削除が実際に行われたことを確認できます。

**クローズドAPIのモデルバッキングについて** — OpenAI、Anthropic、Googleなど不透明なAPI経由のもの — 同じレシートが決定チェーン(どのマニフェスト、どのゲート結果、どのモニター読み取り、どのユーザーがどのアクションをトリガーしたか)をカバーしますが、**重みの出所を主張することはできません**。プロバイダーが重みを公開していないからです。レシートはこれを`weight_attestation: null`フィールドと、その理由を説明する`note`で明示的に示します。これはコンプライアンス姿勢の格下げではなく、検証可能なものの限界を正直に書き留めたものです。レシートを読む監査人は、どの種類の証明が行われていて、どれが行われていないかを正確に理解します。

この分岐は、以下のすべての規制当局の要請を貫いています。フレームワークが重みレベルで何かを要求するときはいつでも、オープンウェイト経路はそれを満たすことができ、クローズドAPI経路はできません。当社は提供できない証明を匂わせるのではなく、レシートでそう述べます。

## 各フレームワークが4つのパイプラインステージにどうマッピングされるか

パイプラインには4つのステージがあります。各規制当局の要請は、そのうち1つ以上にマッピングされます。以下のマトリクスが実際のマップです。

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="4つの規制フレームワークをDivinciの4段階リリースパイプラインにマッピング。EU AI法附属書IVの文書化された論理と学習要約はステージ1の登録に。EU AI法の人間による監督と市販後監視はステージ2のゲートとステージ4の観察に。GDPR第17条の検証可能な消去はステージ1の登録(DELETEパッチ経由)とステージ4の観察(レシート経由)に。HIPAAのアクセス監査と開示追跡はステージ1、3、4に。NIST AI RMFのガバナンス・マッピング・測定・管理は4ステージすべてに。マトリクスの5つのセルがハイライトされ、オープンウェイト専用の検証経路を示しています。">
<title>規制フレームワークとパイプラインステージのマッピング</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">どのパイプラインステージがどの規制要請をカバーするか</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = 完全カバー。◐ = オープンウェイト専用(重み証明が必要)。クローズドAPI経路は決定チェーンをカバーしますが、重みレベルの主張はできません。</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">フレームワーク / 要請</text>
<text x="425" y="98" text-anchor="middle">① 登録</text>
<text x="555" y="98" text-anchor="middle">② ゲート</text>
<text x="685" y="98" text-anchor="middle">③ ロール</text>
<text x="815" y="98" text-anchor="middle">④ 観察</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI法</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">附属書IV:文書化された論理</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">附属書IV:学習データ要約</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">人間による監督措置</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">市販後監視</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR第17条</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">検証可能な消去(DELETEパッチ)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">消去レシート(ハッシュ連結)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">リクエスト単位のアクセス監査</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">開示追跡 + 最小必要限度</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">ガバナンス・マッピング・測定・管理</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

2つの◐セルがGDPR第17条/オープンウェイト専用エントリです。これらはクローズドAPI経路が完全には満たせない要請です。それ以外はどちらのバッキングにも該当します。

本投稿の残りでは、各ステージの貢献を順に取り上げます。

## ステージ① — 登録

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">登録</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">リリースマニフェストがEU AI法附属書IVの技術文書になります。</span>
  </div>
</div>

登録ステージは、SHA-256でアドレス付けされたイミュータブルなJSONマニフェストを生成します。規制対象リリースの場合、マニフェストは附属書IV<sup><a href="#ref-1">[1]</a></sup>が求めるすべてを1つのアーティファクトに収めます。

- モデルアーティファクト(HFリポジトリ + コミットSHA、またはvindexパッチ参照)
- プロンプトテンプレート(すべての変数、すべてのシステムメッセージをバージョン管理)
- ルーティングルール(どのトラフィッククラスがどのリリースに着地するか)
- ゲートしきい値の計算に使用されたデータセットバージョン(学習データのハッシュによる要約)
- 直前リリースのSHA(監査チェーンが途切れないように)
- 開示範囲 — HIPAAデプロイメントの場合、モデルが受領を許可されているPHIカテゴリー

マニフェストが文書そのものです。監査人は散文を読むのではなく、マニフェストハッシュを読み、バンドルを検証します。半年後に書かれた散文要約は不要です。

**オープンウェイトの利点。** モデルアーティファクトがオープンウェイトモデルを参照する場合、マニフェストには`vindex_sha256`(モデルの公開[vIndex](/ja/compliance/)の暗号学的フィンガープリント)も埋め込まれます。このフィンガープリントによって、第三者は当社のデプロイメントインフラを信頼することなく、アクティブな重みを検証できます。

**クローズドAPIの留保。** モデルアーティファクトがクローズドAPIモデルを参照する場合、マニフェストの`vindex_sha256`フィールドは`null`、`weight_attestation_class`は`decision_chain_only`となります。これを読む監査人は、何が主張されていて何がそうでないかを正確に把握します。

## ステージ② — ゲート

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ゲート</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">スライス単位の品質ゲートがEU AI法の人間による監督要件を担います。</span>
  </div>
</div>

ゲートステージはEU AI法の「人間による監督措置」<sup><a href="#ref-1">[1]</a></sup>を運用化する場所です。EU AI法を読んで「人間の承認ワークフローが必要だ」と結論する規制担当者は要点を外しています。難しい問いは、*人間が何に対して承認するのか*です。ゲートステージはその問いに、人間アンカー付き採点者<sup><a href="#ref-3">[3]</a></sup>に対するスライス単位のスピアマンρで答えます。あなたの規制姿勢で重要なスライス(小児腫瘍、IPライセンシング、ベルギーフランス語)はそれぞれ独自のしきい値を持ちます。オーバーライド経路には、監査証跡に残る文書化された根拠が必要です。

HIPAA対象のデプロイメントでは、「最小必要限度」開示ルールもここに存在します。ゲートのスコア付きQAスイートには、PHI過剰露出の負例テスト — 何も求められていないのに個人識別子を含む回答 — が含まれます。過剰露出スライスで後退するリリースは、他のスライスのパフォーマンスにかかわらず、ゲートで失格となります。

NIST AI RMFについては、ゲートステージが「測定」機能をカバーします。システムが設定された許容範囲内で動作していることをスライス単位の数値証拠で示します。

## ステージ③ — ロール

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ロール</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">カナリアチェックポイントが市販後監視のアーティファクトになります。</span>
  </div>
</div>

EU AI法の市販後監視<sup><a href="#ref-1">[1]</a></sup>は、運用者がAIシステムの実環境でのパフォーマンスを*継続的に*(打ち上げ前だけでなく)観察していることを示すよう求めます。5% → 25% → 100%のカナリアと品質モニターチェックポイントの組み合わせは、これを満たす最も自然な方法です。各チェックポイントでの滞留時間と、滞留中のモニター読み取りこそが監査人が確認したいものです。

HIPAAについては、カナリアステージはリクエスト単位の監査ログがエンドツーエンドで実行される場所でもあります。各チェックポイントは署名済みリクエスト-レスポンスレシートのサンプルを生成します。いずれかでPHI処理の設定誤りがあれば、100%のトラフィックではなく5%のトラフィックで表面化します。

## ステージ④ — 観察

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">観察</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">継続モニターとレシートフォーマットによってGDPR第17条が検証可能になります。</span>
  </div>
</div>

このステージこそがコンプライアンスのストーリーを成立させます。観察ステージは、アクティブなリリースに対して継続的にトレースリプレイを実行し、ゲートと同じ人間アンカー付き判定者で採点し、しきい値を破ると自動ロールバックをトリガーする品質モニターを備えます。

すべてのリリース決定 — 登録、ゲート通過、ゲート失敗、ゲートオーバーライド、チェックポイント昇格、チェックポイント保留、自動ロールバック、手動ロールバック、**そしてあらゆるGDPR第17条DELETEパッチの適用** — がvindexレシートを発行します。この顧客の前のレシート、およびこのリリースの前のレシートとハッシュ連結されます。

以下は、GDPR第17条DELETEパッチに対する実際のレシートの姿です。[コンプライアンスページ](/ja/compliance/)に文書化されているフォーマットからそのまま引用しています。

```json
{
  "name": "gdpr-art17-patient-12348-removal",
  "version": 1,
  "base_model": "google/gemma-4-E2B-it",
  "manifest_sha256": "9abaeaf6c91f8b...",
  "previous_manifest_sha256": "8f72b1de4a93c5...",
  "created_at": "2026-05-29T03:17:42Z",
  "user_id": "compliance-officer-7c4e1a",
  "operation": {
    "op": "delete",
    "entity": "patient-record-12348",
    "relation": "diagnosis-association",
    "target": "weight-feature-11179-layer-27",
    "weight": -1.0
  },
  "verification": {
    "before_feature_11179_score": 17.34,
    "before_feature_11179_rank": 1,
    "after_feature_11179_score": null,
    "after_feature_11179_rank": "ABSENT_FROM_TOP_25",
    "perplexity_delta_wikitext103": "+0.02%",
    "vindex_sha256_before": "abc12...",
    "vindex_sha256_after":  "def34..."
  },
  "weight_attestation_class": "full",
  "chain_signature": "sha256(manifest || prev_manifest || user_id || created_at || prev_chain_signature)"
}
```

このアーティファクトは検証可能です。監査人は当社のログを信頼する必要がありません。`vindex_sha256_after`を取り、対応する公開vindexを`huggingface.co/Divinci-AI`から取得し、レイヤー27の特徴量11179が上位25から構造的に欠落していることを確認します。`chain_signature`を取り、前のレシートに対して検証します。チェーン全体が顧客の設定するスケジュールで外部にアンカーされます。

**クローズドAPIモデルに対する同じ操作。** 上記のレシートフィールドは3点で変わります。`operation.target`は`provider_api_endpoint`になり、`verification`は決定チェーン証拠のみをカバーする別のスキーマになり、`weight_attestation_class`は`decision_chain_only`になります。クローズドAPIモデルプロバイダーは重みを公開していないため、レシートはそう述べます。重みレベルの証明を望む監査人は、当社ではなくプロバイダーにエスカレーションすべきだと知ることになります。

これが2026年に他社が出荷していない差別化要因です。評価CI陣営(Braintrust、Humanloop、Patronus)はトラフィックに座らず、決定レシートを発行しません。サービングカナリア陣営(SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>、KServe、Vertex、BentoCloud、Seldon)はインフラメトリックログを発行しますが、ハッシュ連結されたコンプライアンスレシートではありません。可観測性陣営(Arize、Phoenix、Confident、Deepchecks)は出力を監視しますが、強制はしません。

## 監査人は実際に何を検証するのか?

有用な演習として、実際の監査人が問う質問と、それに答えるアーティファクトを順に追ってみましょう。

| 監査人の質問 | 答えとなるアーティファクト |
|---|---|
| *「3月15日14:22 UTCに動作していたのはどのモデルバージョンですか?」* | そのタイムスタンプに対応する観察ステージのレシート。署名済みでハッシュ連結。 |
| *「このリリースは昇格前にどの評価を通過しましたか?」* | ゲートステージのレシート。スライス単位のスピアマンρテーブルとゲートが対象としたデータセットSHAを含む。 |
| *「患者XのGDPR第17条消去要求は実際に適用されましたか?」* | 上記のDELETEパッチレシート。監査人は`vindex_sha256_after`を公開vindexに対して検証します。 |
| *「このリリースを誰が承認しましたか? IPライセンシングスライスのゲートをオーバーライドした根拠は何ですか?」* | ゲートステージのレシートの`override`ブロック。ユーザーIDと必須の自由記述根拠を含む。 |
| *「ロールバックはどれだけ速く発火し、どのモニター読み取りがトリガーしましたか?」* | 観察ステージのロールバックレシート。連続する3回のしきい値未満の品質読み取りとロールバック経過時間を含む。 |
| *「直近90日間の市販後監視証拠を見せてください。」* | 観察ステージのレシートチェーン。顧客の設定スケジュールで外部にアンカー済み。 |

監査人がする必要が*ない*こと: 当社のDatadogを信頼する。CloudWatchを信頼する。スクリーンショットを信頼する。エクスポートを信頼する。レシートフォーマットの要点は、監査人が独立して検証できる点にあります。

## これでは解決しないこと

正直な制約を3つ挙げます。

**GDPR第17条領域でのクローズドAPI後退は、プラットフォーム層では解決できません。** クローズドAPIモデルの背後で医療アシスタントを提供していて、患者が第17条を行使した場合、プラットフォームは患者の記録が検索ストア、プロンプトテンプレート、ルーティングルールから削除されたことを証明できますが、基盤モデルの重みが患者のデータを忘却したことは証明できません。オープンウェイトのバッキング、もしくはベンダーによる重みレベル消去のコミットメントが必要です。当社はそれをレシートで明示します。

**文書化は必要条件ですが、十分条件ではありません。** モデルがしきい値を満たしたことを証明するレシートは、そのしきい値が正しいしきい値だったことを証明しません。スコア付きQAスイートが、あなたのサービス内の患者にとって実際に重要なスライスをカバーしていなければ、いくらレシートを連結してもそれは直りません。規制当局はこれを次第に理解しつつあります。評価が間違った評価であった場合、「私たちは評価を通過しました」はもはや十分なコンプライアンスの答えではありません。

**vIndexフォーマットは単一ベンダー仕様です。** 当社はこれを採用しています。今日、重みレベル証明に利用可能な最も具体的な暗号学的プリミティブだからです。業界が別のフォーマット — ハッシュ付きモデルカード、NIST公開アーティファクトスキーマなど — に収束するなら、レシートフォーマットはそれに合わせて進化させるべきです。荷重を担うのは実体(ハッシュ連結、外部検証可能、重み証明対応)であって、特定のスキーマ名ではありません。規制と標準の地形が成熟するにつれ、これは変化することを予期しています。

## FAQ

### AIシステムにおけるGDPR第17条の検証可能な消去とは何ですか?

検証可能な消去とは、第三者があなたのログを信頼することなくデータが削除されたことを検証できることを意味します。モデルをファインチューニングして特定の情報を「忘却」させることは、この基準を満たしません。情報は敵対的プロンプト下で再浮上する可能性があり、監査人が確認できる暗号学的プリミティブが存在しないためです。before/afterのvindexハッシュを公開した重みレベルのDELETEパッチ*なら*この基準を満たします。監査人が公開アーティファクトに対して検証を再実行できるからです。

### なぜクローズドAPIモデルは同じ方法でGDPR第17条を満たせないのですか?

プロバイダーが重みを公開していないからです。重みにアクセスできなければ、APIを利用する顧客を含むいかなる第三者も、重みレベルの消去を発行または検証することはできません。レシートの決定チェーン部分(どのプロンプトテンプレートが使われたか、データはどの検索ストアから来たか、どのルーティングルールが有効だったか)は依然として検証可能ですが、重みレベルの主張は不可能です。これは重みが非公開のときに何が検証可能かの限界であり、コンプライアンスフレームワークの限界ではありません。

### EU AI法附属書IVは平易な言葉で言うと何を要求しますか?

附属書IVは、システムの論理、学習データの要約、意図された用途、人間による監督措置、市販後監視をカバーする技術文書を要求します。ほとんどのチームが陥る罠は、これらを5つの別個の文書として扱うことです。ステージ1のリリースマニフェストは最初の3つの要請を1つのハッシュとして担います。ゲートステージは4つ目をカバーします。ロールと観察のステージは5つ目をカバーします。1つのパイプライン、4つの要請が通常運用の副産物として満たされます。

### HIPAA対象デプロイメントのロールバックはどれくらい速くあるべきですか?

HIPAAはロールバック時間を規定していませんが、侵害対応に関するHHSのガイダンスは封じ込めまでの時間を荷重を担う指標として扱います。秒オーダーでのロールバック(マニフェスト駆動のフリップでイン-フライトをドレイン — 当社の数字は約12秒)は、アラーム伝播に依存する典型的なインフラメトリックブルーグリーンよりも構造的に高速です。公開ポストモーテムと比較してみましょう。Cloudflareの2022年6月のインシデント<sup><a href="#ref-4">[4]</a></sup>では、エンジニア同士が互いのリバートに踏み込んだため、リバートまでに44分を要しました。

### NIST AI RMFはリリースパイプラインにどうマッピングされますか?

NIST AI RMFの4つの中核機能 — ガバナンス、マッピング、測定、管理 — は単一ステージではなくリリースライフサイクル全体に及びます。ガバナンスは文書化されたリリースポリシーとゲートオーバーライドの根拠ワークフロー(登録 + ゲートステージ)です。マッピングはスライス単位のスコア付きQAスイート(ゲート)です。測定はスライス単位のスピアマンしきい値と継続品質モニター(ゲート + 観察)です。管理はロールバック経路とレシートチェーン(観察)です。パイプラインが完全なレシートセットを発行するとき、4つすべてがカバーされます。

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Annex IV defines the technical documentation requirements for high-risk AI systems: system logic, training data summary, human oversight measures, post-market monitoring. Penalties up to 7% of global turnover for non-compliance.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> 600, max <code>MaximumExecutionTimeoutInSeconds</code> 1800. Cited as the industry-standard infra-metric canary that the Stage 4 quality monitor is contrasted against.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrated LLM-as-judge agreement.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) down to writing (36–44%). Anchor for the per-slice Spearman calibration that drives the Gate stage.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 minutes from "we know what to revert" to revert complete because engineers walked over each other's reverts. Anchor for the "manifest-driven rollback can't have that failure mode" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Voluntary framework — Govern, Map, Measure, Manage — that has become the de facto enterprise procurement baseline for AI governance. Voluntary but enforced in practice through customer due-diligence questionnaires.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Minimum-necessary disclosure, access audit, and breach response timing requirements applicable to any AI system that touches PHI. Civil monetary penalties up to $1.9M per violation-type per year per <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">CMP inflation adjustment, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Article 17 (Right to Erasure).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. The data subject's right to obtain erasure of personal data, and the controller's obligation to demonstrate compliance under Article 5(2) accountability. Penalties up to €20M or 4% of annual global turnover.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — vIndex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/ja/compliance/">compliance page</a> and demonstrated in the <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*本シリーズの次回:* **インスタントロールバック付きの自動LLM CI/CDパイプライン。** 本投稿は監査人が求めるものを示しました。次回は、レシートが数週間ではなく数秒で監査人の机に届くことを可能にする運用パターン — 4段階パイプラインの下にある自動化、特にロールバックが自律的に発火したときに何が変わるかに焦点を当てた話 — を示します。
