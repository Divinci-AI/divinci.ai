+++
title = "모든 커스텀 LLM 플랫폼이 갖추어야 할 12가지 QA 및 릴리스 관리 역량"
description = "LLM 릴리스 플랫폼을 평가하기 위한 역량별 체크리스트: 슬라이스 인식 게이트, 보정된 심판, 원자적 롤백, 해시 체인 영수증 — 무엇이 포화 상태이고, 무엇이 빠져 있으며, 진영이 어떻게 갈리는가."
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "마이크 무어링(Mike Mooring)"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "우리는 자체 릴리스 파이프라인을 구축하기에 앞서 12개의 LLM 릴리스 플랫폼을 조사했습니다. 시장은 서로 완전히 만나지 못하는 세 진영 — 평가 CI 도구, 서빙 카나리아 도구, 옵저버빌리티 도구 — 으로 갈라져 있으며, 그 사이에 비어 있는 이음새가 바로 고객 릴리스에 필요한 부분입니다. 이 글은 그 조사에서 도출된 역량 체크리스트입니다. 우리 플랫폼을 포함해 어떤 플랫폼에도 적용할 수 있는 12가지 구체적인 테스트입니다."
+++

*릴리스 사이클로부터의 메모 — 제3부*

---

1년 전, 자체 릴리스 파이프라인을 구축하기 전에 우리는 자리에 앉아 진지한 LLM 플랫폼이라면 갖추어야 한다고 생각한 모든 QA·릴리스 역량을 나열했습니다. 그런 다음 12개의 다른 플랫폼 — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core — 을 그 목록과 대조하여 평가했습니다. 12가지를 모두 갖춘 곳은 없었습니다. 실제로 출시된 조합은 서로 완전히 맞닿지 않는 세 진영으로 군집화되었습니다.

이 글은 그 결과로 도출된 역량 목록을 이식 가능한 형태로 정리한 것입니다. 각 역량이 우리의 네 가지 파이프라인 단계 — **등록(Register) → 게이트(Gate) → 롤(Roll) → 관측(Observe)** — 중 어디에 속하는지를 기준으로 구성되어 있어, 우리가 이전에 다룬 [파이프라인 아키텍처](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) 및 [실패 모드](/ko/blog/10-ci-cd-release-failures-in-custom-language-models/)와 깔끔하게 맞물립니다. 도구를 평가하고 있다면 후보 각각에 대해 위에서 아래로 목록을 적용해 보십시오. 가장 큰 격차가 어디에 있는지를 보면 그 도구가 어느 진영에 속하는지 알 수 있습니다.

## 세 진영(여러분이 무엇을 보고 있는지 알 수 있도록)

체크리스트 자체에 들어가기 전에, 2026년 시장의 형태는 다음과 같습니다.

- **평가 CI 진영** — Braintrust, Humanloop, Patronus. PR 머지 시점에 자동 평가기를 실행합니다. 불량 머지를 차단합니다. 라이브 트래픽에는 절대 손대지 않습니다. 역량 4~6에서 강하고, 7~12에서는 부재합니다.
- **서빙 카나리아 진영** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core. 트래픽을 분할하고, 인프라 지표를 모니터링하며, CloudWatch 스타일 알람에서 자동 롤백합니다. 1, 7, 9에서 강하고, 8의 품질 측면과 10~12에서는 부재합니다.
- **옵저버빌리티 진영** — Arize Phoenix, Confident AI, Deepchecks. 프로덕션을 관찰하고, 사람에게 경보를 보내고, 에스컬레이션합니다. 10(모니터링)에서 강하지만, 아무것도 강제하지 않습니다. 경보는 자동 롤백이 아닙니다.

이 진영들 사이의 격차 — "CI를 통과함"과 "지연 시간이 아니라 품질로 평가된 라이브 카나리아" 사이의 격차 — 는 모두가 수작업으로 메워야 하는 부분입니다. 그 격차를 닫는 것이 이 글의 핵심 주장입니다.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="세 LLM 플랫폼 진영의 벤다이어그램. 평가 CI 진영(Braintrust, Humanloop, Patronus)은 왼쪽에 위치하며 PR 머지 시점의 오프라인 평가를 담당합니다. 서빙 카나리아 진영(SageMaker, KServe, Vertex, BentoCloud, Seldon)은 오른쪽에 위치하며 인프라 지표 기반 롤백을 동반한 트래픽 분할을 담당합니다. 옵저버빌리티 진영(Arize, Phoenix, Confident, Deepchecks)은 아래쪽에 위치하며 강제 없는 모니터링과 경보를 담당합니다. 세 원은 좁은 영역에서 쌍별로 겹치지만 세 진영이 모두 만나는 중앙 영역은 비어 있습니다. 그 빈 중앙이 바로 이 글이 다루는 빠진 이음새입니다 — 슬라이스별 품질에 의해 주도되며, 라이브 트래픽에 원자적으로 강제되는 릴리스 결정.">
<title>세 진영과 빠진 중앙</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">완전히 만나지 못하는 세 진영</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">각 진영은 한 조각만을 담당합니다. 중앙은 모든 팀이 수작업으로 메우는 부분입니다.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">평가 CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">PR 머지 시점의</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">오프라인 평가 게이트</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">서빙 카나리아</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">트래픽 분할 +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">인프라 지표 롤백</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">옵저버빌리티</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">모니터링 + 경보 (강제 없음)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">빠진</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">이음새</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">빠진 이음새: 슬라이스별 품질 게이트 → 인프라 지표가 아니라 출력 품질에 의해 주도되는 원자적 롤백.</p>

## 단계 ① — 등록(Register)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">불변 매니페스트 레이어. SHA를 통한 실패 귀속.</span>
  </div>
</div>

### 역량 1. 콘텐츠 주소 지정 가능한 SHA를 가진 불변 릴리스 매니페스트

무엇인가: 릴리스는 모델 가중치 파일이 아닙니다. 릴리스는 모든 것 — 모델 아티팩트, 프롬프트 템플릿, 라우팅 규칙, 데이터셋 버전, 전처리 버전 — 을 묶은 불변 번들이며, 단일 SHA-256으로 주소가 지정됩니다. "같은 릴리스"를 배포하는 두 사람은 동일한 SHA를 생성해야 하며, 그렇지 않으면 파이프라인이 거부합니다.

왜 중요한가: 이것이 없으면 상태가 세 시스템에 분산되어 있을 때 "어떤 변경이 프로덕션을 망가뜨렸는가?"라는 질문에 답할 수 없습니다. 2022년 4월 Atlassian 장애<sup><a href="#ref-1">[1]</a></sup>는 상태가 독립적으로 버전 관리되는 시스템들에 분산되어 있었고 이를 다시 일치시켜야 했기 때문에 사이트당 복구에 12시간이 걸렸습니다.

누가 출시했는가: 서빙 카나리아 진영이 부분적으로(모델 + 라우팅), 모델 레지스트리(MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>)가 부분적으로(모델 아티팩트만) 제공합니다. **프롬프트 템플릿**을 SHA에 포함시키는 곳은 거의 없으며, 이것이 바로 가장 자주 바뀌는 필드입니다.

### 역량 2. 모든 릴리스 구성 요소에 걸친 원자적 버전 제어

무엇인가: 릴리스 A에서 릴리스 B로의 전환은 모든 것 — 가중치, 프롬프트, 라우팅, 데이터셋, 전처리 — 을 다섯 번의 별도 대시보드 편집이 아니라 하나의 명령으로 한 번에 뒤집습니다.

왜 중요한가: 부분적 전환은 정의되지 않은 동작 창을 만듭니다. 프롬프트는 업데이트되었지만 라우팅 규칙은 아직 그대로라면, 새 프롬프트와 이전 라우팅 클래스가 함께 적중하는 모든 요청은 누구도 계획하지 않은 상태에 놓이게 됩니다.

누가 출시했는가: 완전히 제공하는 곳은 없습니다. 서빙 카나리아 진영은 모델 이미지를 원자적으로 교체하지만, 프롬프트와 라우팅은 일반적으로 다른 곳에 위치합니다. 매니페스트 주도 전환은 Divinci의 원자적 롤백 주장<sup><a href="#ref-5">[5]</a></sup>의 출처입니다.

### 역량 3. 학습-서빙 환경 패리티

무엇인가: 게이트 평가 중에 사용되는 전처리 파이프라인은 프로덕션 서버가 사용하는 *동일한* 전처리입니다. 둘이 갈라지면 모든 오프라인 수치는 거짓말이 됩니다.

왜 중요한가: 학습-서빙 스큐는 우리가 이전에 다룬 [열 가지 릴리스 실패](/ko/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) 중 하나입니다. 증상은 "평가에서는 잘 작동하는데 프로덕션에서는 다른 모델처럼 동작한다"는 것입니다. 처방은 전처리를 매니페스트에 등록하고 프로덕션 전처리 버전에 대해 게이트를 적용하는 것입니다.

누가 출시했는가: 컨테이너화 프레임워크(BentoML, KServe)는 전처리를 서빙과 함께 배치함으로써 부분 점수를 받습니다. 그러나 이들 중 어느 것도 전처리를 평가 게이트 입력에 바인딩하지 않습니다.

## 단계 ② — 게이트(Gate)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">사람 기반 그레이더 대비 슬라이스별 Spearman ρ.</span>
  </div>
</div>

### 역량 4. 슬라이스별/도메인별 품질 게이트

무엇인가: 게이트 결정은 단일 집계가 아니라 슬라이스별 점수 — 계약서 작성, 법령 해석, IP 라이선싱 — 를 소비합니다. 어떤 단일 슬라이스라도 해당 임계값 아래로 떨어지면, 평균이 어떻게 보이든 릴리스는 `gate_fail`로 표시됩니다.

왜 중요한가: 집계 점수는 국지적 회귀를 씻어 버립니다. Tianpan의 *Semver Lie* 글<sup><a href="#ref-3">[3]</a></sup>은 이를 2026년의 지배적인 LLM 릴리스 실패 모드로 지목합니다. 평균적으로는 개선되면서 어느 한 사용자 여정 클래스에서 조용히 무너지는 모델 말입니다.

누가 출시했는가: **2026년에는 다른 어떤 곳도 출시하지 않았습니다.** 평가 CI 도구 — Braintrust, Humanloop, Patronus — 는 단일 글로벌 루브릭이나 평면적인 작업 목록에 대해 점수를 매깁니다. 슬라이스별 임계값이나 슬라이스 무시 오버라이드를 노출하지 않습니다. 이것이 진영들이 만나지 못하는 첫 번째 지점입니다.

### 역량 5. 사람 기반 보정 심판(사람 평가 대비 Spearman ρ)

무엇인가: 심판은 일반적인 LLM-as-judge가 아닙니다. 도메인 전문가 패널 대비 Spearman ρ가 측정되고 슬라이스별로 구성된 LLM 심판입니다. 심판은 평판이 좋아서가 아니라 그 순위가 사람의 순위와 일치하기 때문에 선택됩니다.

왜 중요한가: MT-Bench<sup><a href="#ref-6">[6]</a></sup>는 GPT-4-as-judge가 전체적으로 80%가 넘는 사람과의 일치도를 보이지만 카테고리별 분산은 코딩(86%)에서 글쓰기(36~44%)까지 다양함을 보여 줍니다. "전체적 일치도"는 심판이 신뢰할 수 없는 슬라이스들을 가립니다. 슬라이스별로 심판을 보정하는 것은 자동 채점을 신뢰할 수 있게 만드는 유일하게 정직한 방법입니다.

누가 출시했는가: Braintrust, Humanloop, Patronus는 심판 평가기를 실행합니다. 그러나 이들 중 어느 것도 슬라이스별 사람 기반 Spearman 보정을 요구하거나 노출하거나 영속화하지 않습니다. Divinci의 보정 파이프라인은 [AI 심판 보정하기](/ko/blog/calibrating-the-ai-judge/)에 문서화되어 있습니다.

### 역량 6. 서면 근거가 필수인 오버라이드 경로

무엇인가: 게이트 실패를 강제로 오버라이드하는 것은 허용되지만(콜드 스타트, 수용된 회귀 등), 두 개의 필드 — `forceGateOverride: true` AND `overrideReason: "..."` — 가 필요합니다. 근거는 사용자 ID와 함께 감사 추적에 기록됩니다. 익명 오버라이드는 없습니다.

왜 중요한가: 거버넌스 게이트는 별도의 컴플라이언스 기능이 아닙니다. 그것은 게이트 단계 자체의 속성입니다. 감사 추적은 "이 오버라이드가 사용되었는가?"뿐만 아니라 "당시의 근거가 무엇이었는가?"에도 답할 수 있어야 합니다. 미래의 여러분이 그것을 읽어야 하기 때문입니다.

누가 출시했는가: 평가 CI 도구에는 플래그가 있습니다. 그러나 그중 어느 것도 오버라이드의 구조적 일부로서 근거를 요구하지 않습니다.

## 단계 ③ — 롤(Roll)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">5% → 25% → 100% 카나리아, 각 단계마다 품질 모니터.</span>
  </div>
</div>

### 역량 7. 체류 시간이 있는 다중 체크포인트 카나리아

무엇인가: 트래픽은 최소 세 개의 체크포인트 — 일반적으로 **5% → 25% → 100%** — 를 거쳐 0%에서 프로덕션으로 이동하며, 각 단계에서 구성된 체류 시간이나 구성된 요청 수 중 *나중에* 도달하는 것까지 유지됩니다. 즉시 0% → 100%는 없습니다.

왜 중요한가: 롱테일 버그는 규모에서 드러납니다. 대화의 0.3%에 영향을 미치는 버그는 100개 프롬프트 평가에서는 보이지 않지만 프로덕션 트래픽의 5%에서는 명백합니다. 체류 시간은 카나리아가 롱테일을 볼 시간을 줍니다.

누가 출시했는가: 서빙 카나리아 진영이 출시합니다. AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup>는 기본 `TerminationWaitInSeconds`가 600(10분)으로 문서화되어 있습니다. KServe, BentoCloud, Seldon, Vertex 모두 유사한 다단계 카나리아 구성을 노출합니다. 이것은 포화된 역량입니다.

### 역량 8. 각 카나리아 체크포인트에서의 출력 품질 모니터

무엇인가: 각 체크포인트에서 파이프라인은 진행 전에 세 가지 모니터 — p95 지연 시간, 5xx 비율, **그리고** 역량 5의 동일한 보정 심판이 계산한 출력 품질 점수 — 를 확인합니다. 지연 시간과 5xx만으로는 충분하지 않습니다.

왜 중요한가: 이곳이 진영들이 다시 만나지 못하는 지점입니다. SageMaker, KServe, Vertex, BentoCloud, Seldon은 모두 지연 시간과 오류율을 관찰합니다. 그러나 이들 중 어느 것도 체크포인트별 출력 품질 모니터를 제공하지 않습니다. 점수를 매길 보정 심판이 없기 때문입니다. 평가 CI 도구는 심판은 있지만 트래픽 위에 있지 않습니다.

누가 출시했는가: 다리를 완성한 곳은 없습니다. 체류하는 카나리아 인프라는 서빙 진영에 존재하고, 보정 심판은 평가 CI 진영에 존재합니다. 둘을 연결한 곳은 본 적이 없습니다.

### 역량 9. 품질 위반 시 자동 중단

무엇인가: 출력 품질에서 실패하는 카나리아 체크포인트는 자동으로 중단됩니다. 승격은 진행되지 않습니다. 롤아웃을 멈추기 위해 사람을 호출할 필요가 없습니다.

왜 중요한가: 롤아웃이 진행되는 시간 프레임에서 사람은 루프 안에 없습니다. 고객 티켓이 도착할 즈음이면 25% 체크포인트는 끝났고 100% 승격이 발생했을 것입니다.

누가 출시했는가: 서빙 카나리아 진영은 인프라 지표에서 중단합니다. 품질 지표 중단은 역량 8이 존재해야 가능한 부분입니다.

## 단계 ④ — 관측(Observe)

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">지속적인 트레이스 리플레이 → 약 12초 만의 원자적 롤백.</span>
  </div>
</div>

### 역량 10. 후보를 통한 지속적인 프로덕션 트레이스 리플레이

무엇인가: 카나리아가 100%로 승격된 후에도 옵저버는 계속 실행됩니다. 최근의 프로덕션 트레이스를 샘플링하고, 이를 *후보*(현재 활성) 릴리스를 통해 리플레이하고, 보정 심판으로 점수를 매기고, 분당 품질 점수를 방출합니다. 주기적이 아니라 지속적으로 말입니다.

왜 중요한가: 조용한 품질 저하 — 모델이 얼버무리거나, 자신감 있게 날짜를 환각하거나, 거부해서는 안 될 때 거부하는 것 — 는 결코 지연 시간이나 5xx를 움직이지 않습니다. 이것들에 대해 얻을 수 있는 유일한 신호는 고객 티켓이며, 이는 가능한 최악의 신호입니다. 지속적인 품질 모니터는 이를 한 자릿수 분 단위로 잡아냅니다.

누가 출시했는가: **아무도 없습니다.** 옵저버빌리티 진영(Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>)은 프로덕션 출력을 모니터링하지만 강제하지는 않습니다. 서빙 카나리아 진영은 인프라를 관찰합니다. 평가 CI 진영은 트래픽 위에 있지 않습니다. 닫힌 루프 — 프로덕션 트레이스 → 보정 심판 → 강제 — 는 빠진 이음새입니다.

### 역량 11. 분 단위가 아닌 초 단위의 원자적 롤백

무엇인가: 옵저버가 트리거되면(예를 들어 3분 연속으로 임계값 아래일 때), 롤백이 자동으로 발화됩니다. 롤백은 매니페스트의 `previous_release`로 라우팅을 다시 가리킵니다. 이전 릴리스가 완전히 묶인 매니페스트였기 때문에 모든 구성 요소가 원자적으로 뒤집힙니다. 약 100개 레플리카 서비스에서 인플라이트 드레인을 포함한 종단 간 소요 시간: 약 12초<sup><a href="#ref-5">[5]</a></sup>.

왜 중요한가: 2022년 6월 Cloudflare 장애<sup><a href="#ref-8">[8]</a></sup>는 되돌리는 데 44분이 걸렸습니다. 원인은 되돌리기 자체가 아니라, 상태가 분산되어 있어 엔지니어들이 서로의 되돌리기를 덮어쓰는 일이 일어났기 때문입니다. 매니페스트 주도 롤백은 단일 명령이며, 그 실패 모드를 가질 수 없습니다.

누가 출시했는가: 서빙 카나리아 진영은 빠른 인프라 롤백(알람 트리거, 블루-그린 전환)을 출시합니다. 아키텍처적 차이는 *트리거*가 인프라 전용인지 아니면 품질 인식인지(역량 10)입니다.

### 역량 12. 해시 체인이 적용된, 외부 앵커링 가능한 컴플라이언스 영수증

무엇인가: 모든 릴리스 결정 — 등록, 게이트 통과, 게이트 실패, 게이트 오버라이드, 체크포인트 승격, 자동 롤백 — 은 JSON-with-SHA-256 영수증을 방출하며, 이 고객에 대한 이전 영수증과 이 릴리스에 대한 이전 영수증에 해시 체인으로 연결됩니다. 체인은 고객이 구성한 일정에 따라 외부에 앵커링됩니다.

**오픈 가중치 단서.** 릴리스가 오픈 가중치 모델(Gemma, Qwen, Llama, Mistral, GPT-OSS)에 의해 뒷받침되는 경우, 영수증은 [vIndex 가중치 증명](/ko/compliance/)을 임베드합니다. 이는 결정 시점의 활성 가중치가 매니페스트가 등록한 가중치라는 증명입니다. 릴리스가 비공개 API 모델(불투명한 API를 통한 OpenAI, Anthropic, Google)에 의해 뒷받침되는 경우, 영수증은 결정 체인을 다루지만 가중치 출처는 주장할 수 없습니다. 제공자가 가중치를 노출하지 않기 때문입니다. 영수증은 이를 명시적으로 밝힙니다. 이것이 검증 가능성의 한계입니다.

왜 중요한가: 규제 산업은 오늘날 *로그*를 받습니다. EU AI Act와 NIST AI RMF<sup><a href="#ref-9">[9]</a></sup>는 점점 더 *증명*을 요구합니다. 해시 체인 영수증은 "우리는 로그를 가지고 있다"와 "감사관이 우리 로그를 신뢰하지 않고도 체인을 검증할 수 있다" 사이의 차이입니다.

누가 출시했는가: 다른 곳은 없습니다. 이것은 Divinci의 기존 [컴플라이언스 페이지](/ko/compliance/)에 직접 매핑되는 차별화 요소입니다. 동일한 영수증 형식을 릴리스 결정으로 확장한 것입니다.

## 12가지 역량, 플랫폼 진영별

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="플랫폼 진영별 12가지 역량 매트릭스. Divinci는 12가지를 모두 갖추고 있습니다. 평가 CI 진영(Braintrust, Humanloop, Patronus)은 5와 6을 갖추고 있습니다. 서빙 카나리아 진영(SageMaker, KServe, BentoCloud, Vertex, Seldon)은 1 부분, 2 부분, 7, 9 그리고 인프라 지표 기반의 11을 갖추고 있습니다. 모델 레지스트리 진영(W&B Models, MLflow, LangSmith)은 1 부분과 2 부분을 갖추고 있습니다. 옵저버빌리티 진영(Arize, Phoenix, Confident, Deepchecks)은 모니터 전용 형태로 10을 갖추고 있습니다. 다른 어떤 곳도 4 슬라이스별 게이트, 5 사람 기반 보정 심판, 8 출력 품질 카나리아 모니터, 10 강제가 있는 닫힌 루프 트레이스 리플레이, 12 해시 체인 영수증을 갖추고 있지 않습니다.">
<title>12가지 역량, 진영별</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">어느 진영이 어느 역량을 출시하는가</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = 출시함. ◐ = 부분(인프라 전용 또는 레지스트리 전용). ✗ = 출시하지 않음. 여섯 가지 역량은 다른 모든 진영에 걸쳐 빠져 있습니다.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">역량</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">평가 CI</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">서빙</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">레지스트리</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">관측</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. 불변 매니페스트 SHA</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. 원자적 버전 전환(모든 구성 요소)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. 학습-서빙 환경 패리티</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. 슬라이스별/도메인별 품질 게이트</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. 사람 기반 보정 심판</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. 근거 필수 오버라이드 경로</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. 체류 시간 있는 다중 체크포인트 카나리아</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. 각 체크포인트에서의 출력 품질 모니터</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. 품질 위반 시 자동 중단</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. 닫힌 루프 프로덕션 트레이스 리플레이</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. 초 단위의 원자적 롤백</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. 해시 체인 컴플라이언스 영수증</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">강조된 역량 4, 5, 8, 10, 12: 이 다섯 가지는 이 조사에서 다른 어떤 출시도 없는 항목입니다. 나머지는 어느 한 진영에 군집화되어 있습니다.</text>
</svg>
</figure>

이 패턴이 핵심입니다. 다섯 가지 역량 — **슬라이스별 게이트, 보정 심판, 품질 카나리아 모니터, 닫힌 루프 리플레이, 해시 체인 영수증** — 은 다른 모든 진영에 걸쳐 ✗로 표시됩니다. 그것이 이음새입니다. 나머지 일곱 가지는 각 진영이 내부적으로는 일관되지만 상호적으로는 불완전하도록 진영들 사이에 분포되어 있습니다.

## 커스텀 언어 모델의 QA가 소프트웨어의 QA와 다른 점은 무엇인가?

LLM은 온도가 0이더라도 결정론적이지 않습니다. 배치와 하드웨어 차이가 출력 변동을 야기합니다. 그 단일 속성은 전통적 QA가 구축된 대부분의 가정을 깨뜨립니다.

- **`expect(output).toEqual(X)` 단언을 작성할 수 없습니다.** 픽스처에 대한 동등성이 아니라 사람 기반 그레이더에 대한 순위 상관을 소비하는 분포 인식 평가가 필요합니다. 이것이 역량 5입니다.
- **모델은 슬라이스에서 실패하면서도 집계 품질 검사를 통과할 수 있습니다.** 그래서 역량 4가 별도로 존재합니다. 평가가 슬라이스할 수 없다면 슬라이스 인식 회귀를 잡아낼 수 없습니다.
- **품질 실패는 인프라 계층에서 조용합니다.** 모델이 얼버무리거나 환각하는 동안 지연 시간과 5xx는 깨끗하게 유지됩니다. 어떤 인프라 측 모니터도 이를 볼 수 없기 때문에 역량 8과 10이 존재합니다.
- **롤백은 선택 사항이 아닙니다.** 실패 모드가 확률적이고 일부는 조용하기 때문에 롤백 경로는 백업 계획이 아니라 주요 인프라여야 합니다. 역량 11은 "12초"를 달성 가능하게 만드는 것이고, 역량 2는 그것을 올바르게 만드는 것입니다.

이 네 가지 사실을 고려하지 않은 QA·릴리스 플랫폼은 LLM 로고만 붙인 결정론적 소프트웨어 CI/CD를 출시하고 있는 셈입니다. 시장은 이를 자주 합니다.

## 감사 추적은 실제로 AI 컴플라이언스를 어떻게 지원하는가?

우리가 가장 흔히 보는 컴플라이언스 격차 — 배포 6개월 후에 감사관이 도착해 "3월 15일에 모델의 어느 버전이 실행되고 있었으며, 누가 그 릴리스를 승인했는가?"라고 물을 때 — 는 "우리는 로그가 없다"가 아닙니다. 그것은 "우리는 다섯 시스템에 걸쳐 로그를 가지고 있는데 타임라인이 맞지 않는다"입니다.

컴플라이언스 영수증(역량 12)은 로그 자체를 이식 가능한 아티팩트 — 해시 체인이 적용된, 단일 출처의, 외부에서 앵커링 가능한 — 로 만듦으로써 이를 해결합니다. 감사관은 우리 인프라를 신뢰하지 않고도 체인을 검증할 수 있습니다. 그것이 "우리는 기록을 가지고 있다"와 "기록이 증명 가능하다" 사이의 차이입니다.

오픈 가중치 모델 뒷받침의 경우 영수증은 가중치 증명도 포함합니다. 이는 활성 가중치가 매니페스트가 등록한 가중치라는 암호학적 증명입니다. 이는 더 어려운 요구(GDPR 제17조 삭제권, EU AI Act 출처)도 충족시킵니다. *무엇이 배포되었는지뿐만 아니라 기반 가중치가 주장하는 그대로라는 것을* 증명할 수 있기 때문입니다.

비공개 API 뒷받침의 경우 — 모델이 불투명한 API 뒤에서 서빙되고 가중치가 노출되지 않을 때 — 영수증은 결정 체인을 다루지만 가중치 출처를 주장할 수 없습니다. 우리는 제공할 수 없는 증명을 암시하는 대신 영수증에 이를 명시적으로 밝힙니다. 제공자가 가중치를 내부에 보관할 때 검증 가능성의 한계입니다.

## 이 체크리스트가 해결하지 못하는 것

세 가지 정직한 한계입니다.

**역량은 그 자체를 위한 체크박스가 아닙니다.** 12가지를 모두 형편없이 출시하는 플랫폼은 그중 여덟 가지를 잘 출시하는 플랫폼보다 못합니다. 체크리스트는 평가의 출발점이지, 벤더 RFP를 위한 점수표가 아닙니다.

**경쟁 스냅샷은 2026년의 것이며 바뀔 것입니다.** 6개월 후에는 위의 ✗ 표시 중 일부가 뒤집힐 것입니다. 경쟁사들은 사후 분석을 읽고 격차를 좁힐 것입니다. 2027년에 이 글을 읽고 있다면 표시를 믿기 전에 직접 감사해 보십시오.

**어떤 역량은 다른 역량에 의존합니다.** 역량 8(출력 품질 카나리아 모니터)은 역량 5(보정 심판)를 필요로 합니다. 역량 10(닫힌 루프 트레이스 리플레이)은 둘 다를 필요로 합니다. 5 없이 8을 출시하는 플랫폼은 위약을 출시하는 것입니다. 카나리아 모니터는 존재하지만 신뢰할 수 있는 어떤 것에도 근거하지 않습니다.

## FAQ

### 커스텀 LLM 릴리스에서 가장 중요한 QA 역량은 무엇입니까?

슬라이스별 품질 게이트(역량 4)입니다. 즉, 릴리스 결정이 단일 글로벌 집계가 아니라 사람 기반 그레이더 대비 도메인별 Spearman 점수를 소비한다는 의미입니다. 집계 점수는 국지적 회귀를 씻어 버리며, 국지적 회귀는 2026년의 지배적인 LLM 릴리스 실패 모드<sup><a href="#ref-3">[3]</a></sup>입니다. 이 목록에서 단 하나의 역량만 출시할 수 있다면 4를 출시하십시오. 그다음 5를 출시하십시오. 5가 4를 신뢰할 수 있게 만드는 것입니다.

### 6개월간 운영하지 않고도 LLM QA 플랫폼을 어떻게 평가합니까?

위의 12가지 역량 체크리스트를 벤더 문서에 적용하되, 두 가지 구체적인 테스트를 함께 적용하십시오. 첫째, 벤더에게 그들의 레퍼런스 고객 중 하나에 대한 *슬라이스별* 게이트 출력을 보여 달라고 요청하십시오. 집계 점수만 가지고 있다면 역량 4가 없는 것입니다. 둘째, 자동 롤백을 트리거하는 것이 무엇인지 물어보십시오. 답이 "지연 시간, 오류율, 그리고 우리의 알람"이라면 그들은 서빙 카나리아 진영에 있는 것이고 역량 10이 빠져 있는 것입니다.

### 평가 CI 도구와 릴리스 관리 도구의 차이는 무엇입니까?

평가 CI 도구(Braintrust, Humanloop, Patronus)는 PR 머지 시점에 자동 평가기를 실행하고 불량 머지를 차단합니다. 라이브 트래픽에는 절대 손대지 않습니다. 릴리스 관리 도구(이 범주)는 릴리스 매니페스트, 카나리아, 옵저버, 롤백 경로를 소유합니다. 평가 CI는 릴리스 관리 워크플로의 *일부*이지만 그것을 대체할 수는 없습니다. 많은 팀이 둘 중 하나만 출시한 후, CI를 통과한 회귀가 프로덕션에 조용히 도달했을 때 비로소 그 격차를 발견합니다.

### 롤백은 얼마나 빨라야 합니까?

분이 아니라 초 단위의 자릿수여야 합니다. Divinci 파이프라인의 평균 롤백 시간은 약 12초입니다. 그것은 약 100개 레플리카 서비스에서의 인플라이트 요청 드레인이지, 매니페스트 전환 자체가 아닙니다. 매니페스트 전환은 1초 미만입니다. 2022년 6월 Cloudflare 사고<sup><a href="#ref-8">[8]</a></sup>와 비교해 보십시오. 그 사고는 상태가 시스템에 분산되어 있었기 때문에 되돌리는 데 44분이 걸렸습니다. 분이 아닌 초를 가능하게 만드는 아키텍처적 결정은 번들된 릴리스 매니페스트(역량 1과 2)입니다.

### 컴플라이언스 영수증이 컴플라이언스 로그보다 더 중요한 이유는 무엇입니까?

로그는 여러분이 작성한 것입니다. 영수증은 감사관이 여러분을 신뢰하지 않고도 검증할 수 있는 것입니다. EU AI Act와 NIST AI RMF<sup><a href="#ref-9">[9]</a></sup>는 점점 더 둘을 구분합니다. "문서화됨"은 "증명 가능"과 같지 않으며, 규제의 방향은 후자로 향하고 있습니다. 해시 체인이 적용되고 외부에 앵커링된 영수증은 그 선을 넘기 위한 가장 단순한 기술입니다.

## 참고문헌

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." 역량 1에 대한 인용 — 시스템에 걸쳐 분산된 상태가 대규모로 어떻게 보이는지에 대한 사례입니다.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> 및 <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. 역량 1의 모델 아티팩트 전용 측면입니다. 어느 쪽도 프롬프트 템플릿 등록을 제공하지 않습니다.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (2026년 4월). 슬라이스 인식 회귀 실패 모드를 2026년의 지배적 패턴으로 지목합니다. 동반 글: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. 역량 4의 앵커입니다.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> 및 <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. 기본 <code>TerminationWaitInSeconds</code> 600(10분), 최대 1800(30분). 이 글이 역량 8과 10에서 대비하는 표준 인프라 지표 카나리아입니다.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>내부 — 릴리스 매니페스트를 통한 원자적 라우팅 전환.</strong> 약 12초의 롤백 시간은 약 100개 레플리카 서비스의 인플라이트 드레인이며, 매니페스트 전환 자체는 1초 미만입니다. 수치는 벤치마크가 아니라 자체 서비스에서 나온 것입니다. 이를 가능하게 하는 아키텍처는 역량 1의 번들된 매니페스트입니다.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). 전체 GPT-4 대 사람 일치도 80% 초과, 카테고리별 분산은 코딩(86%)에서 글쓰기(36~44%)까지. 역량 5의 앵커 — 보정 심판이 슬라이스별이어야 하는 이유입니다.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>옵저버빌리티 진영 비교.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Confident AI의 2026년 옵저버빌리티 도구 비교</a>. 모두 모니터링과 경보를 출시하지만 누구도 롤백을 강제하지 않습니다. 역량 10의 "강제 없는 모니터링" 프레이밍에 대한 앵커입니다.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." "무엇을 되돌릴지 안다"에서 되돌리기 완료까지 44분, 부분적으로 엔지니어들이 서로의 되돌리기를 덮어썼기 때문입니다. 상태가 분산되어 있었기 때문이기도 합니다. 역량 11의 앵커입니다.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. 거버넌스, 매핑, 측정, 관리 — 역량 12가 매핑되는 네 가지 핵심 기능입니다. 또한 <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>의 EU AI Act 출처 요구사항. 역량 12의 앵커입니다.
</li>
</ol>

---

*이 시리즈의 다음 글:* **규제 분야에서 커스텀 LM 검증 및 릴리스.** 위의 역량 체크리스트는 일반적입니다. 다음 글은 구체적입니다. EU AI Act, GDPR 제17조, HIPAA, NIST AI RMF — 각각이 릴리스 프로세스에 무엇을 요구하는지, 위의 어떤 역량이 어떤 요구사항을 다루는지, 그리고 오픈 가중치/비공개 가중치 분기가 실제로 컴플라이언스 이야기를 어디에서 바꾸는지.
