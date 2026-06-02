+++
title = "Divinci AI로 LLM CI/CD 파이프라인을 구축하는 방법"
description = "4단계 LLM 릴리스 파이프라인: 슬라이스 인식 Spearman 게이트, p95가 아닌 출력 품질을 감시하는 카나리, 12초 원자적 롤백, 그리고 모든 결정에 대한 컴플라이언스 영수증."
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
summary = "전통적인 CI/CD 파이프라인은 산출물이 결정론적이라고 가정합니다. 그러나 언어 모델은 그렇지 않습니다. 본 글은 Divinci AI에서 출시하는 파이프라인을 단계별로 안내합니다 — 인간 기반 판정자와의 슬라이스 인식 Spearman 게이트, p95가 아니라 출력 품질을 감시하는 카나리, 약 12초의 원자적 롤백, 그리고 모든 결정에 대한 해시 체인 릴리스 영수증(오픈 웨이트 모델인 경우 vIndex 가중치 어테스테이션이 내장됨)을 다룹니다. 이 중 세 가지는 2026년 다른 어떤 LLM 릴리스 도구도 제공하지 않는 기능입니다."
+++

*릴리스 사이클에서의 메모 — 1부*

---

저희가 처음으로 일반적인 CI/CD 파이프라인을 통해 LLM을 출시하려 했을 때, 빌드는 녹색이었고, 배포는 성공했으며, 고객 지원 부서는 7분 안에 티켓을 접수하기 시작했습니다.

아무것도 "고장 나지" 않았습니다. 4,200개의 통합 테스트가 모두 통과했습니다. 지연 시간은 변함이 없었습니다. 200 OK 비율도 안정적으로 유지되었습니다. 그러나 특정 부류의 법률 도메인 질문에서, 새 모델이 조용히 답변을 회피하기 시작했습니다 — 이전 버전이 올바르게 답했던 질문에 대해 단정적인 답변을 거부했습니다. 아직 작성하지 않은 테스트였기 때문에 어떤 테스트도 이를 잡아내지 못했습니다.

저희는 롤백했고, 그 롤백 자체가 하나의 사건이었습니다. 모델 산출물은 세 곳에 있었고, 프롬프트 템플릿은 네 번째 곳에, 라우팅 규칙은 다섯 번째 곳에 있었으며, 어느 것도 서로의 존재를 알지 못했습니다. 이전의 정상 상태로 돌아가는 데 두 시간이 조금 넘게 걸렸습니다. 그 사이에 회피성 답변을 제공받은 고객들은 만족하지 않았습니다.

그 장애가 이 파이프라인이 존재하는 이유입니다. 다음은 저희가 자체 릴리스를 진행하는 실제 파이프라인이며, Divinci API를 통해 고객들이 자신의 릴리스를 출시할 때 사용하도록 노출한 것이기도 합니다. 이 파이프라인은 4단계 — **등록, 게이트, 롤, 관측** — 로 구성되어 있으며, 모든 단계에는 사람이 깨어 있을 필요가 없는 롤백 경로가 있습니다.

## 4단계

<img src="/images/charts/divinci-cicd-pipeline.svg" alt="LLM을 위한 4단계 CI/CD 파이프라인 다이어그램. 1단계 등록: 모델 산출물, 프롬프트 템플릿, 라우팅 규칙, 데이터셋 버전이 하나의 서명된 릴리스 매니페스트로 묶입니다. 2단계 게이트: 점수화된 QA 스위트에 대한 자동 평가와 카테고리별 Spearman 임계값 게이트. 3단계 롤: 5에서 25에서 100퍼센트로 카나리 트래픽 증가, 각 단계마다 헬스 체크. 4단계 관측: 드리프트 모니터, 출력 품질 모니터, 임계값 위반 시 자동 롤백. 각 단계는 릴리스 SHA로 서명된 감사 로그 항목을 발행합니다." width="900" height="380" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

이 단계들은 의도적으로 경직되어 있습니다. 모든 릴리스는 이 순서대로 모든 단계를 통과합니다. 평가를 건너뛰는 "핫픽스" 경로는 존재하지 않습니다 — 저희는 한 번 시도해 봤습니다.

### 1단계 — 등록

릴리스는 모델 가중치 파일이 **아닙니다**. 릴리스는 다음을 묶은 불변의 매니페스트입니다.

- 모델 산출물 (HF 레포지토리 + 커밋 SHA, 또는 vIndex 패치)
- 프롬프트 템플릿 (모든 변수, 모든 시스템 메시지)
- 라우팅 규칙 (어떤 트래픽 클래스가 어떤 버전으로 가는지)
- 게이트 임계값을 계산하는 데 사용된 데이터셋 버전
- 이전 릴리스의 SHA, 이를 통해 롤백이 명확해집니다

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

매니페스트 SHA는 파이프라인의 누구든 사용하는 유일한 핸들입니다. 두 사람이 같은 릴리스라고 생각하는 것을 배포하려 했는데 SHA가 다르면, 파이프라인은 배포를 거부합니다. 저희는 이 규칙으로 이미 두 건의 버그를 잡았습니다.

### 2단계 — 게이트

게이트는 대부분의 CI 파이프라인이 잘못 처리하는 부분입니다. Lighthouse 스타일의 휴리스틱 — 펄플렉서티, BLEU, ROUGE — 은 회귀가 한 도메인에 집중되어 있는 경우 통과시켜 버립니다. 집계 점수가 이를 묻어 버리기 때문입니다.

Divinci의 게이트는 릴리스 매니페스트에 등록된 점수화된 QA 스위트를 실행하고, **카테고리별** Spearman 임계값을 적용합니다.

<img src="/images/charts/divinci-cicd-gate-thresholds.svg" alt="여섯 개의 법률 하위 도메인에 걸쳐 후보 모델과 보정된 인간 기반 채점자 사이의 카테고리별 Spearman 순위 상관관계를 보여주는 막대 차트. 계약 작성 0.71, 법령 해석 0.74, 판례 요약 0.69, 규제 컴플라이언스 0.66, 관할 분석 0.62, 지식재산 라이선싱 0.41. 점선으로 표시된 게이트 임계값은 0.65에 있습니다. 지식재산 라이선싱이 선 아래로 떨어져 게이트-2 실패를 트리거합니다. 여섯 카테고리 전체에 걸친 집계 평균은 0.64로 임계값보다 약간 낮지만, 카테고리별 뷰는 정확히 어떤 하위 도메인이 회귀했는지 보여줍니다." width="900" height="420" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

위 차트의 릴리스는 집계 게이트(평균 0.64는 "충분히 가까움")를 통과할 것입니다. 그러나 지식재산 라이선싱이 이전의 0.68에서 0.41로 급락하기 때문에 Divinci의 게이트는 실패합니다 — 정확히 노트북이 결코 잡아내지 못하는 종류의 국소적 회귀입니다.

<aside style="background: rgba(184, 160, 128, 0.08); border-left: 3px solid #b8a080; padding: 0.7rem 1rem; margin: 0.8rem 0 1.5rem; font-size: 0.88rem; color: #4a4030;">
  <strong style="color: #1e3a2b;">차트 수치에 관하여:</strong> 하위 도메인별 값은 측정된 수치가 아니라 <em>형태를 보여주기 위한 예시</em>입니다. 이러한 특정 법률 실무 영역별로 판정자 대 인간 Spearman ρ를 분류해 보고한 공개 논문은 없습니다. 인접 자료로는 <a href="https://arxiv.org/abs/2308.11462" target="_blank" rel="noopener">LegalBench (Guha 외, 2023)</a> — 여섯 가지 법률적 추론 유형에 걸친 과제별 정확도 — 와 <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">MT-Bench (Zheng 외, 2023)</a> 가 있으며, 후자는 카테고리별 편차가 큰 가운데 GPT-4와 인간의 전체 일치도를 약 80%로 보고합니다. 자체 점수화된 QA 스위트를 운영하는 고객은 자신만의 슬라이스에 대한 실제 수치를 산출하며, 차트의 형태가 바로 API가 노출하는 모습입니다.
</aside>

저희가 슬라이스 인식 게이팅을 재미로 발명한 것이 아닙니다. 이는 현재 LLM 사후 부검에서 직접적으로 거론되는 실패 모드입니다. Tianpan의 *"세버 거짓말(The Semver Lie)"* 글<sup><a href="#ref-6">[6]</a></sup>은 "코드 리뷰를 통과하고, 평가 게이트 없이 배포되었으며, 사용자별 A/B 없이 프로덕션에 진입했고, 자동 롤백을 트리거하지 않은" 프롬프트 변경 사례를 설명합니다. 그 사건을 단순한 불편함이 아니라 치명적인 것으로 만든 것은, 회귀가 하나의 슬라이스 — 단일 사용자 여정 클래스 — 에 집중되어 있었던 반면 집계는 유지되었다는 점이었습니다. 저희가 2026년에 조사한 모든 LLM 릴리스 도구는 단일 글로벌 점수에 게이팅을 걸거나, 아예 게이팅을 걸지 않거나 둘 중 하나였습니다. 그중 어느 것도 게이트를 슬라이스 단위로 나누지 않습니다.

게이트 실패는 **소프트 경고가 아닙니다**. release_id는 `gate_fail`로 표시되고, 매니페스트는 보관되며, 어떤 배포 명령도 이를 받아들이지 않습니다. 콜드 스타트 릴리스 — 비교할 과거 Spearman 데이터가 없는 완전히 새로운 모델 — 는 작성된 정당화 사유가 필요한 일회성 `--force-gate-override` 경로를 통과합니다. 그 정당화 사유, 사용자 ID, 그리고 `gate_override_sha256`이 곧바로 감사 추적에 들어갑니다. 오버라이드는 정당한 상황이 있기 때문에 존재하며, 감사 추적은 미래의 자기 자신이 그 정당화 사유를 읽어야 하기 때문에 존재합니다.

### 3단계 — 롤

Divinci에서 카나리는 세 개의 체크포인트를 의미합니다: **5%, 25%, 100%**. 각 체크포인트에서 파이프라인은 구성된 체류 시간 또는 구성된 요청 건수 중 더 늦은 쪽까지 대기합니다. 기본값은 5%에서 4분/1,000건, 25%에서 15분/10,000건입니다.

각 체크포인트에서 세 가지 모니터가 유지되어야 합니다.

1. 이전 릴리스 p95의 1.2배 이내의 **p95 지연 시간**
2. 이전 릴리스 비율의 1.5배 이내의 **5xx 비율**
3. **출력 품질 모니터**: 최근 프로덕션 트레이스를 후보 릴리스로 지속적으로 재생하여, 2단계를 구동한 동일한 보정 판정자가 채점

세 번째 항목은 다른 어떤 릴리스 파이프라인도 제공하지 않는 것입니다. SageMaker, KServe, BentoML, Vertex AI — 모두 지연 시간과 오류율을 감시합니다. 그러나 어느 것도 후보의 출력을 *실제로* 프로덕션이 지금 묻고 있는 질문과 비교하여 채점하지 않습니다. 후보는 활성 릴리스가 방금 받은 동일한 프롬프트를 받고, 5% 미러에서 실행되며, 저희는 후보의 답변과 보정된 채점자 사이의 Spearman ρ를 측정합니다. 5xx 비율은 깨끗하게 유지되더라도, 모델이 조용히 답변을 회피하거나, 거부하거나, 환각할 수 있습니다. 저희는 이런 일을 직접 목격했습니다. 트레이스 재생 모니터가 이를 잡아냅니다.

재생 셋은 제한적입니다 — 비용을 예측 가능하게 유지하기 위해 체크포인트당 슬라이스당 최근 50개 트레이스로 상한선을 둡니다. 5% 트래픽에서 채점에는 약 90초가 걸립니다. 단순한 비율 카나리보다는 느리지만, 고객이 티켓을 접수할 때까지 기다리는 것보다는 빠릅니다.

```bash
# roll 명령은 fire-and-forget 방식입니다. 파이프라인이 스스로 대기합니다.
curl -X POST https://api.divinci.ai/v1/releases/rel_a01c66/roll \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{ "strategy": "canary", "dwell_5pct_seconds": 240, "dwell_25pct_seconds": 900 }'
# → { "rollout_id": "rol_b3e2", "next_checkpoint_at": "2026-05-26T09:04:00Z" }
```

### 4단계 — 관측, 롤백, 그리고 영수증

이 단계가 파이프라인이 존재하는 이유를 증명하는 단계입니다.

관측자는 롤아웃이 완료된 후에도 지속적으로 실행됩니다. 분당 출력 품질 점수를 5%의 롤링 트레이스 재생 샘플에서 계산합니다. 점수가 3분 연속으로 롤백 임계값(기본값: 게이트 임계값의 0.85배, 따라서 게이트가 0.65였다면 0.55) 아래로 떨어지면 롤백이 자동으로 작동합니다. 페이지 호출도, 사람도, 논쟁도 없습니다.

롤백 자체는 단일 명령입니다: 라우팅을 매니페스트의 `previous_release`로 다시 가리키도록 하는 것입니다. 이전 릴리스가 완전히 묶인 매니페스트였기 때문에 모든 구성 요소 — 가중치, 프롬프트, 라우팅, 데이터셋 — 가 원자적으로 전환됩니다.

그런 다음 영수증이 발행됩니다.

모든 릴리스 결정 — 등록, 게이트 통과, 게이트 실패, 게이트 오버라이드, 체크포인트 승격, 체크포인트 보류, 자동 롤백, 수동 롤백 — 은 **릴리스 영수증**을 발행합니다. JSON-with-SHA-256 산출물로, 해당 고객의 이전 영수증과 이 릴리스의 이전 영수증에 해시 체인으로 연결되며, 고객이 구성한 일정에 따라 외부에 앵커링됩니다.

릴리스가 **오픈 웨이트 모델** — Gemma, Qwen, Llama, Mistral, GPT-OSS, 가중치를 주소 지정하고 편집할 수 있는 모든 것 — 로 뒷받침될 때, 영수증은 [vIndex 어테스테이션](/ko/compliance/)을 내장합니다: 결정 시점의 활성 가중치가 매니페스트가 등록한 가중치임을 증명하는 암호학적 증명입니다. 이것이 더 까다로운 컴플라이언스 요청(GDPR 제17조 삭제권, EU AI Act 출처 증명)을 충족하는 경로입니다. *무엇이 배포되었는지*뿐만 아니라 *기반 가중치가 주장하는 그대로인지*를 증명할 수 있기 때문입니다.

릴리스가 **클로즈드 웨이트 모델** — OpenAI, Anthropic, Google, 불투명한 API를 통해서만 제공되는 모든 것 — 로 뒷받침될 때, 영수증은 여전히 결정 체인(어떤 매니페스트, 어떤 게이트 결과, 어떤 모니터 판독값, 어떤 사용자가 어떤 동작을 트리거했는지)을 다루지만, 기반 가중치를 어테스트할 수는 없습니다. 가중치를 볼 수 없기 때문입니다. 이는 파이프라인의 한계가 아니라, 제공업체가 가중치를 노출하지 않을 때 검증 가능한 것의 한계입니다. 그 구분에 신경 쓰는 감사자는 영수증 자체에서 진실된 답을 얻습니다.

어느 쪽이든, 오늘날 감사자는 로그를 받습니다. 이 파이프라인을 통해서는 실제로 증명 가능한 모든 것에 대한 *증명*을 받습니다. 저희는 시장에서 이를 출시하는 누구도 보지 못했습니다. 결국에는 다른 곳에서도 출시할 것으로 예상합니다 — EU AI Act 일정상 결국 피할 수 없습니다. 저희는 지금 출시하기로 선택했습니다.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="롤백 시간을 분 단위 로그 스케일로 보여주는 가로 막대 차트. 2022년 4월 Atlassian 장애: 사이트당 복원 720분(12시간). 2022년 6월 21일 Cloudflare 장애: 되돌리는 데 44분. DORA 엘리트 퍼포머 실패 배포 복구 임계값: 60분 미만. AWS SageMaker 카나리 배포 가드레일 종료 대기 기본값: 10분. Divinci 릴리스 매니페스트를 통한 자동 라우팅 전환: 12초. 각 막대 레이블은 아래 참고문헌의 번호가 매겨진 출처에 대한 링크입니다." style="width: 100%; height: auto; display: block;">
  <title>롤백 시간 — 1차 출처에서 측정된 수치</title>
  <rect width="900" height="380" fill="#faf8f5"/>
  <text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">롤백 시간 — 1차 출처에서 측정된 수치</text>
  <text x="40" y="56" font-size="12" fill="#6b5d4f">추정치가 아닌 구체적인 사건과 플랫폼 문서화 한계. 각 막대는 아래 참고문헌의 출처에 링크됩니다.</text>
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
  <text x="570" y="360" font-size="11" fill="#6b5d4f" text-anchor="middle">분 (로그 스케일)</text>
  <g>
    <text x="272" y="103" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Atlassian, 2022년 4월</text>
    <text x="272" y="117" text-anchor="end" font-size="10" fill="#6b5d4f">사이트당 복원</text>
    <rect x="280" y="91" width="484" height="32" fill="#a04848" rx="2"/>
    <text x="774" y="113" font-size="11" font-weight="600" fill="#1e3a2b">720분<a href="#ref-1"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[1]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="158" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Cloudflare, 2022년 6월</text>
    <text x="272" y="172" text-anchor="end" font-size="10" fill="#6b5d4f">설정 되돌리기</text>
    <rect x="280" y="146" width="332" height="32" fill="#c87b3c" rx="2"/>
    <text x="622" y="168" font-size="11" font-weight="600" fill="#1e3a2b">44분<a href="#ref-2"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[2]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="213" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">DORA 엘리트</text>
    <text x="272" y="227" text-anchor="end" font-size="10" fill="#6b5d4f">퍼포머 임계값</text>
    <rect x="280" y="201" width="349" height="32" fill="#b8a080" rx="2" opacity="0.6"/>
    <text x="639" y="223" font-size="11" font-weight="600" fill="#1e3a2b">&lt; 60분<a href="#ref-3"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[3]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="268" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">AWS SageMaker</text>
    <text x="272" y="282" text-anchor="end" font-size="10" fill="#6b5d4f">종료 대기 기본값</text>
    <rect x="280" y="256" width="251" height="32" fill="#7a9580" rx="2"/>
    <text x="541" y="278" font-size="11" font-weight="600" fill="#1e3a2b">10분<a href="#ref-4"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[4]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="320" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="700">Divinci 자동화</text>
    <text x="272" y="334" text-anchor="end" font-size="10" fill="#2d5a4f">매니페스트를 통한 라우팅 전환</text>
    <line x1="280" y1="328" x2="318" y2="328" stroke="#2d5a4f" stroke-width="14" stroke-linecap="butt"/>
    <text x="328" y="332" font-size="11" font-weight="700" fill="#2d5a4f">12초<a href="#ref-5"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[5]</tspan></a></text>
  </g>
</svg>
</figure>

이는 저희의 수치가 아니라 — 실제 사후 부검, 플랫폼 문서, DORA 프레임워크에서 출간된 1차 출처 수치입니다. 이 대비가 Divinci의 설계 동기입니다. Atlassian의 2022년 4월 장애<sup><a href="#ref-1">[1]</a></sup>는 사이트당 12시간이 걸렸는데, 이는 상태가 여러 시스템에 분산되어 있어서 다시 일치하도록 조율해야 했기 때문입니다. Cloudflare의 2022년 6월 장애<sup><a href="#ref-2">[2]</a></sup>는 그들의 표현대로 엔지니어들이 서로의 되돌리기를 덮어쓰는 바람에 되돌리는 데 44분이 걸렸습니다. AWS SageMaker의 카나리 배포 가드레일<sup><a href="#ref-4">[4]</a></sup>은 롤백이 완전히 완료되기 전 기본 10분의 종료 대기 시간을 문서화하고 있습니다. DORA<sup><a href="#ref-3">[3]</a></sup>의 실패 배포 복구 엘리트 임계값은 "1시간 미만"입니다 — 이는 고성과 조직이 통과해야 하는 기준선이지 천장이 아닙니다.

12초도 마법의 숫자는 아닙니다. 라우팅 레이어가 처리 중인 요청을 드레인하고, 활성 매니페스트를 교체하며, 새 상태를 리전 전반에 걸쳐 ACK하는 데 필요한 시간입니다. 느린 부분은 처리 중 요청의 드레인입니다. 생성 도중 응답을 떨어뜨리지 않고 더 빠른 경로는 없습니다.

## 이 파이프라인이 다른 LLM 릴리스 도구와 다른 점

저희는 이를 구축하기 전인 2026년에 다른 12개 도구를 조사했습니다 — LangSmith Deployment, W&B Models, MLflow, SageMaker Deployment Guardrails, Vertex AI Endpoints, Seldon Core, BentoCloud, KServe, Humanloop, Braintrust, Patronus AI, Arize Phoenix. 이들은 서로 만나지 않는 두 진영으로 군집화됩니다.

**평가-CI 진영** — Braintrust, Humanloop, Patronus — 은 오프라인 평가 점수로 PR 머지를 게이팅합니다. 실행 중인 서비스에는 결코 손을 대지 않습니다. 모델이 프로덕션에 있고 품질이 떨어지면 알림을 보내며, 다른 누군가가 롤백해야 합니다.

**서빙-카나리 진영** — SageMaker Deployment Guardrails, KServe, Vertex AI, BentoCloud, Seldon Core — 은 트래픽을 분할하고 자동으로 롤백합니다. 그러나 모두 인프라 지표 — p99 지연 시간, 오류율, CloudWatch 알람 — 에서 트리거됩니다. 어느 것도 품질 회귀에서 자동으로 롤백하지 않습니다. 그럴 수 없는데, 프로덕션 출력에서 실행되는 판정자가 없기 때문입니다.

"PR 머지 시 평가 통과"와 "실제로 신경 쓰는 사용자 여정에서 채점되는 라이브 카나리" 사이의 이음새는 모든 팀이 현재 스스로 다리를 놓아야 하는 수동 인계입니다. 그 블로그 글이 이를 2026년의 지배적 실패 모드<sup><a href="#ref-6">[6]</a></sup>로 지목합니다. 저희는 그 이음새를 닫았습니다. 구체적으로 다음과 같습니다.

1. **게이트가 슬라이스되어 있습니다.** 단일 글로벌 점수가 아닌 인간 기반 채점자에 대한 도메인별 Spearman ρ입니다. 슬라이스 무지(slice-blindness)는 다른 모든 게이트가 가진 한계입니다.
2. **카나리가 p95뿐만 아니라 출력 품질을 감시합니다.** 후보를 통한 지속적인 트레이스 재생을, 게이트를 구동한 동일한 판정자가 채점합니다. 이것이 빠져 있던 이음새입니다.
3. **모든 결정이 릴리스 영수증을 발행합니다.** 해시 체인되고, 외부 앵커링 가능하며, 저희의 컴플라이언스 페이지를 뒷받침하는 JSON-with-SHA-256 형식입니다. 오픈 웨이트 모델 백킹의 경우 — Gemma, Qwen, Llama, Mistral, GPT-OSS — 영수증은 vIndex 가중치 어테스테이션을 내장하므로 감사자는 실제 활성 가중치가 무엇이었는지 증명할 수 있습니다. 클로즈드 API 백킹의 경우 영수증은 결정 체인을 다루지만 가중치 출처를 주장하지 않습니다. 제공업체가 가중치를 노출하지 않기 때문입니다. 어느 쪽이든 감사자는 단순한 로그가 아니라 실제로 증명 가능한 것에 대한 증명을 받습니다.

이것이 전부입니다. 일반적인 카나리, 버전 레지스트리, 인프라 지표 기반 롤백 — 이런 것들은 흔합니다. 저희는 일반적인 카나리를 작성하지 않았습니다.

## 이 파이프라인이 해결하지 못하는 것

세 가지 솔직한 한계가 있습니다.

**게이트는 데이터셋이 좋은 만큼만 좋습니다.** 고객이 실제로 사용하는 도메인을 커버하지 않는 점수화된 QA 스위트는 그 도메인의 회귀를 잡아내지 못합니다. 저희는 이를 두 번 보았습니다. 두 번 모두 고객의 첫 번째 조치는 모델을 바꾸는 것이 아니라 새로운 점수화된 QA 스위트를 출시하는 것이었습니다. 그것이 올바른 조치입니다.

**롤백은 이전 릴리스가 좋았다고 가정합니다.** 회귀가 3개의 릴리스 동안 라이브되었고 아무도 알아차리지 못했다면, 한 릴리스를 롤백하는 것은 약간 덜 나쁜 모델을 얻는 데 그칩니다. 감사 추적이 여기서 도움이 됩니다 — N-1뿐만 아니라 SHA로 어떤 이전 매니페스트로든 롤백할 수 있습니다.

**콜드 스타트 릴리스는 카나리를 건너뜁니다.** 비교할 프로덕션 트래픽이 없는 완전히 새로운 모델은 의미 있게 카나리할 수 없습니다. 대신 24시간 섀도우 배포를 강제합니다. 이는 출력을 서빙하지 않고 관측만 합니다. 더 느리고 덜 편리합니다. 또한 유일하게 솔직한 답이기도 합니다.

## 이 파이프라인을 실행할 수 있는 가장 작은 버전

Divinci를 사용하지 않고 이와 비슷한 것을 구축하고 싶다면, 최소 실행 가능 버전은 대략 다음과 같습니다.

1. 모델 + 프롬프트 + 라우팅 + 데이터셋을 콘텐츠 해시로 주소 지정되는 단일 불변 산출물로 저장하는 레지스트리
2. Spearman ρ를 통해 인간 기반 패널에 대해 보정된 판정자 — 그리고 집계가 아닌 *슬라이스별* 점수를 참조하는 게이트 결정
3. 체크포인트에서 대기하고, 신선도가 제한된 품질 모니터를 참조하는 트래픽 분할기 — 이때 모니터는 단순히 합성 트레이스를 샘플링하는 것이 아니라 *최근 프로덕션 트레이스를 재생*합니다
4. 가중치뿐만 아니라 프롬프트 템플릿을 포함하여 상태를 원자적으로 교체할 수 있는 라우팅 레이어
5. 모든 릴리스 결정에 대해 해시 체인되고 외부 앵커링 가능한 영수증을 발행하는 감사 로그 — 그리고 모델이 오픈 웨이트인 경우 가중치 어테스테이션 내장. 클로즈드 API 릴리스는 물리적으로 가중치 수준에서 어테스트할 수 없기 때문입니다

대부분의 팀은 이미 (1)과 (3)을 가지고 있습니다. 고통스러운 부분은 (2), (4), (5)입니다. Divinci가 존재하는 이유는, 저희가 먼저 저희 자신을 위해 다섯 가지를 모두 구축한 다음, 다른 모든 사람도 이를 필요로 하게 될 것임을 깨달았기 때문입니다.

구축을 건너뛰고 싶다면, [API 레퍼런스는 여기에 있으며](/ko/api/), "Release Management" 섹션의 릴리스 엔드포인트가 이 파이프라인의 전체 표면입니다. 컴플라이언스 측면 — 이 vIndex 영수증이 어떻게 생겼고 EU AI Act, GDPR 제17조, HIPAA, NIST AI RMF에 어떻게 매핑되는지 — 은 [컴플라이언스 페이지](/ko/compliance/)에 있습니다. 이 글의 모든 명령은 실제 엔드포인트입니다.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. 보고서 인용: "가속화된 복원 2 접근 방식은 한 사이트를 복원하는 데 약 12시간이 걸렸다." 883개 고객 사이트의 전체 복원에는 14일이 소요되었습니다. 인프라, 백업, 사이트별 검증에 걸쳐 분산된 상태가 사이트당 수치를 분이 아니라 시간 단위로 끌어올립니다.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. 글에서 그대로 인용된 타임라인: "06:58: 근본 원인이 발견되고 이해됨. 문제가 되는 변경을 되돌리는 작업 시작… 07:42: 마지막 되돌리기가 완료됨." "무엇을 되돌릴지 안다"에서 "되돌리기가 완료됨"까지 44분이 걸렸으며, 부분적으로는 엔지니어들이 서로의 되돌리기를 덮어쓰고 있었기 때문입니다.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. "실패한 배포 복구 시간" 엘리트 퍼포머 임계값은 1시간 미만으로 문서화됩니다. 저성과자는 DORA의 과거 보고서에서 몇 주에서 몇 달 단위로 측정됩니다.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a> 그리고 동반 <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener"><em>Auto-Rollback Configuration and Monitoring</em> 페이지</a>. 예시 <code>TerminationWaitInSeconds</code>는 600(10분)이며, <code>MaximumExecutionTimeoutInSeconds</code>는 1800(30분)으로 제한됩니다. 알람이 발동되면 베이킹 윈도우 내에서 롤백이 시작됩니다: "베이킹 기간 동안 어떤 알람이라도 발동되면, SageMaker AI는 롤백을 시작하고 모든 트래픽은 블루 플리트로 돌아간다."
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    Divinci AI — 릴리스 매니페스트를 통한 원자적 라우팅 전환. 12초는 약 100개 레플리카 서비스에서의 처리 중 요청 드레인 시간입니다. 매니페스트 교체 자체는 1초 미만입니다. 이 수치는 벤치마크가 아니라 저희 자체 서비스에서 나온 것이며, 이를 가능하게 하는 아키텍처는 위에서 설명한 묶인 매니페스트(1단계 — 등록)입니다.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em> (April 2026)</a>. 이 글은 실패 패턴을 직접 명명합니다: "코드 리뷰를 통과하고, 평가 게이트 없이 배포되었으며, 사용자별 A/B 없이 프로덕션에 진입했고, 자동 롤백을 트리거하지 않았다." 동반 글 — <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a> — 은 현재의 사후 부검이 체계적으로 누락하는 슬라이스 / 여정 / 사용자별 필드를 열거합니다.
  </li>
</ol>

이 차트에 없는 것에 대한 메모. Kubernetes `kubectl rollout undo` 시간은 `maxSurge` / `maxUnavailable` 설정과 파드 워밍업에 따라 결정되며, 명령 자체에 의해 결정되지 않습니다. 그리고 위 네 출처가 하듯이 측정된 수치를 게시하는 1차 출처를 찾을 수 없었으므로 — 추정치로 채우기보다는 제외했습니다.

---

*이 시리즈의 다음 편:* **저희가 커스텀 LM에서 잡아낸 10가지 CI/CD 릴리스 실패, 그리고 각각을 파이프라인의 어느 단계에서 잡아내는가.** 10가지 중 3가지는 집계 게이트가 출시했을 슬라이스 인식 회귀입니다. 두 가지는 인프라 지표 기반 카나리가 승격시켰을 조용한 품질 저하입니다. 나머지는 모든 릴리스 파이프라인이 잡아내도록 되어 있는 종류의 실패 모드입니다 — 집계 게이팅 파이프라인이 실제로 스스로 잡아내는 것이 무엇인지 큰 소리로 말해 둘 가치가 있어서 나열합니다.
