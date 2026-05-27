+++
title = "규제 산업에서 맞춤형 LM의 검증과 출시"
description = "EU AI Act, GDPR 제17조, HIPAA, NIST AI RMF — 맞춤형 LLM 출시 파이프라인에 능력별로 매핑합니다. 오픈 웨이트 / 폐쇄 API 분기점이 컴플라이언스 스토리가 실제로 갈라지는 지점입니다."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vindex"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "규제 산업의 맞춤형 언어 모델 컴플라이언스는 하나의 축을 따라 깔끔하게 갈라집니다: 오픈 웨이트 대 폐쇄 API입니다. 오픈 웨이트 백엔드의 경우, GDPR 제17조의 검증 가능한 삭제를 암호학적으로 충족하는 vindex 가중치 증명을 제공할 수 있습니다. 폐쇄 API 백엔드의 경우, 동일한 영수증이 의사결정 체인을 다루지만 가중치 출처는 주장할 수 없으며, 규제 당국은 그 구분을 영수증 자체에서 확인하게 됩니다. 본 글은 네 가지 규제 프레임워크(EU AI Act, GDPR, HIPAA, NIST AI RMF)를 우리가 제공하는 네 단계 파이프라인에 매핑하고, 실제 영수증 포맷을 보여줍니다."
+++

*릴리스 사이클 노트 — Part IV*

---

법무 총괄이 엔지니어링 리뷰에 들어옵니다. 그녀에게는 단 하나의 질문이 있습니다. *"내일 EU AI Act 제17조의 삭제권 요청이 들어와 특정 환자에 대해 우리 모델이 학습한 모든 사실을 제거해 달라고 한다면, 우리가 그것을 실제로 수행했다는 사실을 증명할 수 있습니까?"*

대부분의 팀이 솔직하게 내놓아야 하는 답은 이렇습니다. "우리는 모델이 잊도록 파인튜닝할 수 있습니다. 학습 실행 기록도 보여드릴 수 있습니다. 하지만 그 정보가 구조적으로 사라졌다는 것은 증명할 수 없습니다. 적절한 적대적 프롬프트 아래에서 다시 떠오를 수 있기 때문입니다."

그것은 컴플라이언스 답변이 아닙니다. 절차적 어깨 으쓱임을 동반한 비답변입니다.

본 글은 맞춤형 LLM에 대해 진정한 컴플라이언스 답변이 어떤 모습인지에 관한 것입니다 — 네 가지 규제 프레임워크(**EU AI Act, GDPR 제17조, HIPAA, NIST AI RMF**)를 가로지르며, 우리가 고객 출시를 위해 제공하는 네 단계 파이프라인([Register → Gate → Roll → Observe](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/))에 매핑합니다. 모든 규제 당국의 요구를 관통하는 핵심 긴장은 **오픈 웨이트 대 폐쇄 API**입니다. Gemma 4 파인튜닝에 대해 증명할 수 있는 것들은 불투명한 벤더 API 뒤에서 서빙되는 릴리스에 대해 증명할 수 있는 것들과 다릅니다. 우리가 사용하는 영수증 포맷은 그것을 한 줄 한 줄 명시적으로 말합니다. 그 정직함이야말로 영수증을 감사인에게 유용하게 만드는 요소입니다.

## 네 규제 당국과 각자가 실제로 원하는 것

컴플라이언스 논의는 흔히 "우리는 모든 것을 문서화했습니다"로 수렴됩니다. 그러한 프레이밍은 감사인 앞에서 실패합니다. 감사인이 원하는 것은 *당신의 인프라를 신뢰하지 않고도 검증할 수 있는 증거*입니다. 아래의 네 프레임워크는 모두 동일한 근본 요구에 대해 서로 다른 어휘를 사용합니다.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="네 가지 규제 프레임워크와 각각이 요구하는 검증 기본 단위. EU AI Act는 문서화된 로직과 인간 감독을 요구하며, 검증 기본 단위는 비트 단위로 정확한 메커니즘 문서화입니다. GDPR 제17조는 개인 데이터의 검증 가능한 삭제를 요구하며, 검증 기본 단위는 SHA-256 영수증을 포함한 가중치 수준의 DELETE 패치입니다. HIPAA는 접근 감사와 공개 추적을 요구하며, 검증 기본 단위는 요청별 서명된 의사결정 로그입니다. NIST AI RMF는 거버넌스, 매핑, 측정, 관리를 요구하며, 검증 기본 단위는 모든 출시 결정에 대한 해시 체인 영수증입니다.">
<title>네 규제 당국, 하나의 검증 요구</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">네 규제 당국, 하나의 근본 요구: 신뢰가 아닌 검증</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">각 프레임워크는 검증 기본 단위를 다르게 명명하지만, 본질은 같습니다: 감사인이 확인할 수 있는 암호학적 증명입니다.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">부속서 IV의 요구:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• 문서화된 로직</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• 학습 데이터 요약</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• 인간 감독 조치</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• 시판 후 모니터링</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">검증 기본 단위:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">vindex를 통한 비트 단위</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">메커니즘 문서화</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">위반 시 제재:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">전 세계 매출의</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">최대 7%</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR 제17조</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">삭제권의 요구:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• 검증 가능한 데이터 제거</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• 입증 가능한 망각</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• 적대적 프롬프트 하의</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  증명</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">검증 기본 단위:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">가중치 수준 DELETE</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">패치와 SHA-256 영수증</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">위반 시 제재:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">최대 2천만 유로 또는</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">매출의 4%</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">접근 통제의 요구:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• 접근 감사 추적</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• 공개 추적</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• 최소 필요 원칙에 따른</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  PHI 노출</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">검증 기본 단위:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">요청별 서명된</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">의사결정 로그</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">위반 시 제재:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">위반 유형당 연간</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">최대 190만 달러</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">네 핵심 기능:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• 거버넌스(govern)</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• 매핑(map)</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• 측정(measure)</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• 관리(manage)</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">검증 기본 단위:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">출시 결정별</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">해시 체인 영수증</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">위반 시 제재:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">자발적 프레임워크</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(그러나 사실상의</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">엔터프라이즈 기준선)</text>
</svg>
</figure>

제재 수치가 이 프레임워크들을 흥미롭게 만드는 요소는 아닙니다. 제재 수치는 그것들을 하중을 지탱하는 요소로 만들 뿐입니다. 흥미로운 부분은 **검증 기본 단위** — 각 프레임워크가 실제로 산출물에 요구하는 형태입니다. 네 프레임워크 중 셋은 서로 다른 어휘로 암호학적 수준의 증명을 요구합니다. 네 번째(NIST AI RMF)는 자발적이지만 엔터프라이즈 조달에서는 사실상 필수입니다. 그들은 동일한 형태로 수렴합니다: 감사인이 당신의 로그를 신뢰하지 않고도 검증할 수 있는 산출물입니다.

## 분기점: 오픈 웨이트 대 폐쇄 API

단계별 매핑에 앞서, 본 글 전체에서 가장 중요한 유의 사항입니다.

**오픈 웨이트 모델 백엔드 — Gemma, Qwen, Llama, Mistral, GPT-OSS 등 가중치가 주소 지정 및 편집 가능한 모든 경우 — 모든 Divinci 출시 결정은 **가중치 증명(weight-attestation)**을 포함한 vindex 영수증을 발행합니다. 결정 시점의 활성 가중치가 매니페스트에 등록된 가중치와 정확히 동일하다는 암호학적 증명입니다. 이것이 GDPR 제17조 검증 가능한 삭제를 가능하게 만드는 요소입니다. 가중치 공간에서 특정 엔티티-관계를 제거하는 [DELETE 패치](/blog/deleting-paris-from-a-language-model/)를 적용하면, 영수증이 전후 해시를 임베드하며, 감사인은 공개된 vindex에 대해 검증을 재실행함으로써 삭제가 발생했음을 확인할 수 있습니다.

**폐쇄 API 모델 백엔드 — 불투명한 API를 통한 OpenAI, Anthropic, Google — 동일한 영수증이 의사결정 체인(어느 매니페스트, 어느 게이트 결과, 어느 모니터 판독값, 어느 사용자가 어느 액션을 트리거했는지)을 다루지만, 제공자가 가중치를 노출하지 않으므로 **가중치 출처는 주장할 수 없습니다**. 영수증은 `weight_attestation: null` 필드에 그 이유를 설명하는 `note`와 함께 이를 명시적으로 기재합니다. 이는 격하된 컴플라이언스 자세가 아니라 — 검증 가능한 것의 한계를 정직하게 기록한 것입니다. 영수증을 읽는 감사인은 어떤 종류의 증명이 이루어지고 있고 어떤 것이 이루어지지 않는지를 정확히 이해합니다.

이 분기점은 아래 모든 규제 당국의 요구를 관통합니다. 어떤 프레임워크가 가중치 수준의 무언가를 요구할 때마다, 오픈 웨이트 경로는 그것을 충족할 수 있지만 폐쇄 API 경로는 그럴 수 없습니다. 우리는 전달할 수 없는 증명을 암시하기보다 영수증에 그렇게 기록합니다.

## 각 프레임워크가 네 파이프라인 단계에 어떻게 매핑되는가

파이프라인에는 네 단계가 있습니다. 각 규제 당국의 요구는 그중 하나 이상에 매핑됩니다. 아래 매트릭스가 실제 지도입니다.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="네 가지 규제 프레임워크를 네 단계 Divinci 출시 파이프라인에 매핑한 그림. EU AI Act 부속서 IV의 문서화된 로직과 학습 데이터 요약은 1단계 Register에 매핑됩니다. EU AI Act의 인간 감독과 시판 후 모니터링은 2단계 Gate와 4단계 Observe에 매핑됩니다. GDPR 제17조의 검증 가능한 삭제는 DELETE 패치를 통해 1단계 Register에, 영수증을 통해 4단계 Observe에 매핑됩니다. HIPAA의 접근 감사와 공개 추적은 1, 3, 4단계에 매핑됩니다. NIST AI RMF의 거버넌스, 매핑, 측정, 관리는 네 단계 모두에 걸쳐 매핑됩니다. 매트릭스의 다섯 셀이 오픈 웨이트 전용 검증 경로를 나타내기 위해 강조됩니다.">
<title>출시 파이프라인 단계에 매핑된 규제 프레임워크</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">어느 파이프라인 단계가 어느 규제 요구를 다루는가</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = 완전 커버리지. ◐ = 오픈 웨이트 전용(가중치 증명 필요). 폐쇄 API 경로는 의사결정 체인은 다루지만 가중치 수준 주장은 할 수 없습니다.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">프레임워크 / 요구</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">부속서 IV: 문서화된 로직</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">부속서 IV: 학습 데이터 요약</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">인간 감독 조치</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">시판 후 모니터링</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR 제17조</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">검증 가능한 삭제(DELETE 패치)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">삭제 영수증(해시 체인)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">요청별 접근 감사</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">공개 추적 + 최소 필요</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">거버넌스 · 매핑 · 측정 · 관리</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

두 개의 ◐ 셀은 GDPR 제17조 / 오픈 웨이트 전용 항목입니다 — 이것들은 폐쇄 API 경로가 완전히 충족할 수 없는 요구입니다. 나머지는 모두 양쪽 백엔드에 적용됩니다.

본 글의 나머지는 각 단계의 기여를 살펴봅니다.

## 1단계 — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">출시 매니페스트가 EU AI Act 부속서 IV의 기술 문서입니다.</span>
  </div>
</div>

Register 단계는 SHA-256으로 주소 지정되는 불변 JSON 매니페스트를 산출합니다. 규제 출시의 경우, 매니페스트는 부속서 IV<sup><a href="#ref-1">[1]</a></sup>가 요구하는 모든 것을 단일 산출물로 담습니다.

- 모델 아티팩트(HF 저장소 + 커밋 SHA, 또는 vindex 패치 참조)
- 프롬프트 템플릿(모든 변수, 모든 시스템 메시지 — 버전 관리됨)
- 라우팅 규칙(어느 트래픽 클래스가 어느 릴리스로 가는지)
- 게이트 임계값 계산에 사용된 데이터셋 버전(해시별 학습 데이터 요약)
- 이전 릴리스의 SHA(감사 체인이 끊기지 않도록)
- 공개 범위 — HIPAA 배포의 경우 모델이 수신할 수 있도록 허용된 PHI 카테고리

매니페스트가 곧 문서입니다. 감사인은 산문을 읽는 것이 아니라 매니페스트 해시를 읽고 번들을 검증합니다. 6개월 후에 작성된 산문 요약 같은 것은 필요 없습니다.

**오픈 웨이트 보너스.** 모델 아티팩트가 오픈 웨이트 모델을 참조할 때, 매니페스트는 `vindex_sha256`도 임베드합니다 — 모델의 공개된 [vindex](/ko/compliance/)의 암호학적 지문입니다. 그 지문이야말로 제3자가 우리의 배포 인프라를 신뢰할 필요 없이 활성 가중치를 검증할 수 있게 합니다.

**폐쇄 API 유의 사항.** 모델 아티팩트가 폐쇄 API 모델을 참조할 때, 매니페스트의 `vindex_sha256` 필드는 `null`이며, 매니페스트의 `weight_attestation_class`는 `decision_chain_only`입니다. 이것을 읽는 감사인은 무엇이 주장되고 무엇이 주장되지 않는지를 정확히 알게 됩니다.

## 2단계 — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">슬라이스별 품질 게이트가 EU AI Act 인간 감독 요구를 짊어집니다.</span>
  </div>
</div>

Gate 단계는 EU AI Act의 "인간 감독 조치"<sup><a href="#ref-1">[1]</a></sup>가 실제 운영으로 옮겨지는 곳입니다. EU AI Act를 읽고 "우리에게 필요한 것은 인간 승인 워크플로우다"라고 결론지은 규제 담당자는 핵심을 놓친 것입니다 — 더 어려운 요구는 *인간이 무엇에 대해 승인하는가*입니다. Gate 단계는 인간 앵커 기반 채점기<sup><a href="#ref-3">[3]</a></sup>에 대한 슬라이스별 Spearman ρ로 그 질문에 답합니다. 규제 자세에서 중요한 각 슬라이스(소아 종양학, IP 라이선스, 벨기에 프랑스어)는 자체 임계값을 갖습니다. 오버라이드 경로는 감사 추적에 들어가는 서면 사유를 요구합니다.

HIPAA 적용 배포의 경우, 여기가 "최소 필요" 공개 규칙이 살아 있는 곳이기도 합니다. 게이트의 채점 QA 스위트는 PHI 과다 노출에 대한 부정 테스트를 포함합니다 — 요청되지 않은 개인 식별자를 포함하는 답변입니다. 과다 노출 슬라이스에서 퇴보하는 릴리스는 다른 슬라이스의 성능과 관계없이 게이트를 통과하지 못합니다.

NIST AI RMF의 경우, Gate 단계는 "측정" 기능을 다룹니다 — 시스템이 구성된 허용치 내에서 작동하고 있음을 보여주는 슬라이스별 수치 증거입니다.

## 3단계 — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">카나리 체크포인트가 시판 후 모니터링 산출물이 됩니다.</span>
  </div>
</div>

EU AI Act의 시판 후 모니터링<sup><a href="#ref-1">[1]</a></sup>은 운영자가 AI 시스템이 실제 조건에서 어떻게 작동하는지에 대한 *지속적* — 단순히 출시 전이 아닌 — 관찰을 입증하도록 요구합니다. 5% → 25% → 100% 카나리를 품질 모니터 체크포인트와 함께 운용하는 것이 이를 충족하는 가장 자연스러운 방법입니다. 각 체크포인트에서의 유지 시간 및 그동안의 모니터 판독값이야말로 감사인이 보고자 하는 것입니다.

HIPAA의 경우, 카나리 단계는 요청별 감사 로깅이 엔드 투 엔드로 실습되는 곳이기도 합니다. 모든 체크포인트는 서명된 요청-응답 영수증의 샘플을 산출합니다. 그중 어느 하나라도 PHI 처리가 잘못 구성되어 있다면, 100%가 아닌 5% 트래픽에서 드러납니다.

## 4단계 — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">지속적인 모니터와 영수증 포맷이 GDPR 제17조를 검증 가능하게 만듭니다.</span>
  </div>
</div>

이 단계가 컴플라이언스 스토리를 완성하는 단계입니다. Observe 단계는 활성 릴리스를 통해 지속적인 트레이스 재현을 실행하며, Gate에서 사용된 동일한 인간 앵커 기반 판정기로 채점하고, 위반 시 자동 롤백을 트리거하는 품질 모니터를 갖춥니다.

모든 출시 결정 — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback, **그리고 모든 GDPR 제17조 DELETE 패치 적용** — 은 vindex 영수증을 발행합니다. 해당 고객의 이전 영수증과 해당 릴리스의 이전 영수증에 해시 체인으로 연결됩니다.

[컴플라이언스 페이지](/ko/compliance/)에 문서화된 포맷에서 직접 가져온 GDPR 제17조 DELETE 패치의 실제 영수증은 다음과 같습니다.

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

그 산출물은 검증 가능합니다. 감사인은 우리의 로그를 신뢰할 필요가 없습니다. `vindex_sha256_after`를 가져와 `huggingface.co/Divinci-AI`에서 해당 공개 vindex를 받아온 뒤, 레이어 27의 특성 11179가 상위 25에서 구조적으로 부재함을 검증합니다. `chain_signature`를 가져와 이전 영수증과 대조해 검증합니다. 전체 체인은 고객이 구성한 일정에 따라 외부에 앵커링됩니다.

**폐쇄 API 모델에 대한 동일 작업.** 위 영수증 필드는 세 가지 방식으로 바뀝니다: `operation.target`은 `provider_api_endpoint`가 되고, `verification`은 의사결정 체인 증거만을 다루는 다른 스키마가 되며, `weight_attestation_class`는 `decision_chain_only`가 됩니다. 폐쇄 API 모델 제공자는 가중치를 노출하지 않았으므로 영수증은 그렇게 기록합니다. 가중치 수준의 증명을 원하는 감사인은 이제 우리가 아니라 제공자에게 에스컬레이션해야 한다는 것을 압니다.

이것이 2026년에 누구도 출시하지 않는 차별화입니다. 평가-CI 진영(Braintrust, Humanloop, Patronus)은 트래픽 위에 앉지 않고 의사결정 영수증을 발행하지도 않습니다. 서빙-카나리 진영(SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon)은 인프라 메트릭 로그를 발행하지만 해시 체인 컴플라이언스 영수증은 발행하지 않습니다. 관측 가능성 진영(Arize, Phoenix, Confident, Deepchecks)은 출력을 관찰하지만 강제하지 않습니다.

## 감사인은 실제로 무엇을 검증하는가?

유용한 연습은 실제 감사인이 던질 질문들을 살펴보고, 어느 산출물이 각각에 답하는지를 점검하는 것입니다.

| 감사인의 질문 | 그 질문에 답하는 산출물 |
|---|---|
| *"3월 15일 14:22 UTC에 어느 모델 버전이 실행되고 있었습니까?"* | 그 타임스탬프에 대한 Observe 단계 영수증으로, 서명되고 해시 체인으로 연결되어 있습니다. |
| *"이 릴리스는 승격 전에 어떤 평가를 통과했습니까?"* | Gate 단계 영수증으로, 슬라이스별 Spearman ρ 표와 게이트가 실행된 데이터셋 SHA를 포함합니다. |
| *"환자 X에 대한 GDPR 제17조 삭제 요청이 실제로 적용되었습니까?"* | 위의 DELETE 패치 영수증입니다. 감사인은 `vindex_sha256_after`를 공개된 vindex와 대조해 검증합니다. |
| *"누가 이 릴리스를 승인했습니까? IP 라이선스 슬라이스 게이트를 오버라이드한 사유는 무엇이었습니까?"* | Gate 단계 영수증의 `override` 블록으로, 사용자 ID와 요구되는 자유 텍스트 사유를 포함합니다. |
| *"롤백은 얼마나 빨리 발사되었으며, 어떤 모니터 판독값이 그것을 트리거했습니까?"* | Observe 단계의 롤백 영수증으로, 세 번 연속된 임계값 미만 품질 판독값과 롤백 경과 시간을 포함합니다. |
| *"지난 90일간의 시판 후 모니터링 증거를 보여주십시오."* | Observe 단계 영수증 체인입니다. 고객이 구성한 일정에 따라 외부에 앵커링됩니다. |

감사인이 *하지 않아도 되는 것*: 우리의 Datadog을 신뢰하는 것. 우리의 CloudWatch를 신뢰하는 것. 스크린샷을 신뢰하는 것. 익스포트를 신뢰하는 것. 영수증 포맷의 핵심은 감사인이 그것을 독립적으로 검증할 수 있다는 것입니다.

## 이것이 해결하지 못하는 것

세 가지 정직한 한계입니다.

**GDPR 제17조 영역의 폐쇄 API 회귀는 플랫폼 계층에서 해결할 수 없습니다.** 폐쇄 API 모델 뒤에서 의료 어시스턴트를 서빙하고 있는데 환자가 제17조를 발동한다면, 플랫폼은 환자의 기록이 당신의 검색 저장소, 프롬프트 템플릿, 라우팅 규칙에서 제거되었음을 증명할 수 있지만 — 기저 모델 가중치가 환자의 데이터를 잊었음은 증명할 수 없습니다. 오픈 웨이트 백엔드 또는 가중치 수준 삭제에 대한 벤더의 약속이 필요합니다. 우리는 영수증에 그렇게 기록합니다.

**문서화는 필요하지만 충분하지 않습니다.** 모델이 임계값을 충족했음을 증명하는 영수증은 그 임계값이 옳은 임계값이었음을 증명하지는 않습니다. 채점 QA 스위트가 서비스에서 환자에게 실제로 중요한 슬라이스를 다루지 않는다면, 아무리 많은 영수증 체이닝도 그것을 고치지 못합니다. 규제 당국은 점점 이를 이해하고 있습니다. "평가를 통과했다"는 잘못된 평가였다면 더 이상 충분한 컴플라이언스 답변이 아닙니다.

**vindex 포맷은 단일 벤더입니다.** 우리는 그것을 사용합니다. 오늘날 가중치 수준 증명에 사용할 수 있는 가장 구체적인 암호학적 기본 단위이기 때문입니다. 업계가 다른 포맷에 정착한다면 — 해시가 포함된 모델 카드, NIST 공개 산출물 스키마 — 영수증 포맷은 그것으로 진화해야 합니다. 하중을 지탱하는 것은 본질(해시 체인, 외부 검증 가능, 가중치 증명 인식)이지 특정 스키마 이름이 아닙니다. 우리는 규제 및 표준 환경이 성숙함에 따라 이것이 변화할 것으로 예상합니다.

## FAQ

### AI 시스템에 대한 GDPR 제17조의 검증 가능한 삭제란 무엇입니까?

검증 가능한 삭제란 제3자가 당신의 로그를 신뢰할 필요 없이 데이터가 제거되었음을 검증할 수 있다는 것을 의미합니다. 특정 정보를 "잊도록" 모델을 파인튜닝하는 것은 이 기준을 충족하지 않습니다 — 정보는 적대적 프롬프트 아래에서 다시 떠오를 수 있으며, 감사인이 확인할 수 있는 암호학적 기본 단위가 없기 때문입니다. 공개된 전후 vindex 해시를 갖춘 가중치 수준 DELETE 패치는 이 기준을 *충족합니다*. 감사인이 공개 산출물에 대해 검증을 재실행할 수 있기 때문입니다.

### 폐쇄 API 모델은 왜 GDPR 제17조를 같은 방식으로 충족할 수 없습니까?

제공자가 가중치를 노출하지 않기 때문입니다. 가중치에 접근하지 못하면, 어떤 제3자도 — API를 사용하는 고객을 포함하여 — 가중치 수준의 삭제를 발행하거나 검증할 수 없습니다. 영수증의 의사결정 체인 부분(어떤 프롬프트 템플릿이 사용되었는지, 데이터가 어느 검색 저장소에서 왔는지, 어느 라우팅 규칙이 활성화되어 있었는지)은 여전히 검증 가능하지만, 가중치 수준의 주장은 그렇지 않습니다. 이는 가중치가 비공개일 때 검증 가능한 것의 한계이지, 컴플라이언스 프레임워크의 한계가 아닙니다.

### EU AI Act 부속서 IV는 평이한 언어로 무엇을 요구합니까?

부속서 IV는 시스템의 로직, 학습 데이터 요약, 의도된 사용, 인간 감독 조치, 시판 후 모니터링을 포괄하는 기술 문서를 요구합니다. 대부분의 팀이 빠지는 함정은 이를 다섯 개의 별도 문서로 취급하는 것입니다. 1단계의 출시 매니페스트는 처음 세 가지 요구를 단일 해시로 담아냅니다. Gate 단계가 네 번째를 다룹니다. Roll + Observe 단계가 다섯 번째를 다룹니다. 단일 파이프라인에서, 네 가지 요구가 정상 운영의 부산물로 충족됩니다.

### HIPAA 적용 배포에서 롤백은 얼마나 빨라야 합니까?

HIPAA는 롤백 시간을 명시하지 않지만, 침해 대응에 대한 HHS 지침은 봉쇄까지의 시간을 하중을 지탱하는 요소로 다룹니다. 초 단위 롤백(매니페스트 기반 전환에서의 인플라이트 드레인 — 우리의 수치는 약 12초)은 알람 전파에 의존하는 일반적인 인프라 메트릭 블루-그린보다 구조적으로 더 빠릅니다. 공개된 사후 분석과 비교하면, Cloudflare의 2022년 6월 사건<sup><a href="#ref-4">[4]</a></sup>은 엔지니어들이 서로의 되돌리기 위에 덧씌우는 바람에 되돌리는 데 44분이 걸렸습니다.

### NIST AI RMF는 출시 파이프라인에 어떻게 매핑됩니까?

NIST AI RMF의 네 핵심 기능 — Govern, Map, Measure, Manage — 은 단일 단계가 아니라 출시 수명 주기 전체에 걸쳐 있습니다. Govern은 문서화된 출시 정책과 게이트 오버라이드 사유 워크플로우입니다(Register + Gate 단계). Map은 슬라이스별 채점 QA 스위트입니다(Gate). Measure는 슬라이스별 Spearman 임계값과 지속적인 품질 모니터입니다(Gate + Observe). Manage는 롤백 경로와 영수증 체인입니다(Observe). 파이프라인이 전체 영수증 세트를 발행하면 네 가지 모두가 다루어집니다.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. 부속서 IV는 고위험 AI 시스템에 대한 기술 문서 요구사항을 정의합니다: 시스템 로직, 학습 데이터 요약, 인간 감독 조치, 시판 후 모니터링. 미준수 시 전 세계 매출의 최대 7%까지 벌금.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. 기본 <code>TerminationWaitInSeconds</code> 600, 최대 <code>MaximumExecutionTimeoutInSeconds</code> 1800. 4단계 품질 모니터와 대조되는 업계 표준 인프라 메트릭 카나리로 인용됩니다.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>보정된 LLM-as-judge 일치도.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). 전체 GPT-4 대 인간 일치도 &gt;80%, 카테고리별 분산은 코딩(86%)에서 작문(36–44%)까지. Gate 단계를 구동하는 슬라이스별 Spearman 보정의 앵커.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare 2022년 6월 장애.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "무엇을 되돌릴지 안다"에서 되돌림 완료까지 44분이 소요됨. 엔지니어들이 서로의 되돌리기 위에 덧씌웠기 때문. "매니페스트 기반 롤백은 그런 실패 모드를 가질 수 없다"라는 주장의 앵커.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. 자발적 프레임워크 — Govern, Map, Measure, Manage — 이지만 AI 거버넌스에 대한 사실상의 엔터프라이즈 조달 기준선이 되었습니다. 자발적이지만 고객 실사 질문지를 통해 실제로 강제됩니다.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. PHI를 다루는 모든 AI 시스템에 적용되는 최소 필요 공개, 접근 감사, 침해 대응 시간 요구사항. <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">2025년 CMP 인플레이션 조정</a>에 따라 위반 유형당 연간 최대 190만 달러의 민사 금전적 제재.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Article 17 (Right to Erasure).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. 정보 주체의 개인 데이터 삭제 요구권과, 제5조 (2)항 책임성에 따라 컨트롤러가 준수를 입증해야 하는 의무. 최대 2천만 유로 또는 연간 전 세계 매출의 4% 벌금.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — vindex 영수증 포맷.</strong> 본 글의 영수증 JSON은 <a href="/ko/compliance/">컴플라이언스 페이지</a>에 문서화되고 <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> 글에서 시연된 포맷에서 가져온 것입니다. 해시 체인은 <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>에 대한 SHA-256입니다. 고객이 구성한 일정에 따라 외부에 앵커링 가능합니다.
</li>
</ol>

---

*시리즈의 다음 글:* **자동화된 LLM CI/CD 파이프라인과 즉시 롤백.** 본 글은 감사인이 무엇을 원하는지 보여주었습니다. 다음 글은 영수증이 몇 주가 아닌 몇 초 안에 감사인의 책상에 도착하도록 만드는 운영 패턴 — 롤백이 스스로 발사될 때 무엇이 변하는지에 초점을 맞춘 네 단계 파이프라인의 자동화를 보여줍니다.
