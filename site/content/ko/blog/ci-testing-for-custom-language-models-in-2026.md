+++
title = "2026년 커스텀 언어 모델을 위한 CI 테스트"
description = "계약 테스트, 스모크 예산, 비용 인지형 플릿 사이징, 섀도우 CI. 팀의 속도를 늦추지 않으면서 모든 PR에서 12분짜리 평가 스위트를 감당 가능한 수준으로 유지하는 방법."
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "images/ci-testing-for-custom-language-models-in-2026-hero.png"
reading_time = 13
summary = "7편의 회귀 스위트는 모든 PR에서 실행하기에 실제로 비용이 듭니다. 동일한 커버리지를 훨씬 더 적은 비용으로 유지하는 방법을 다룹니다 — 1초 미만의 계약 테스트, 90초짜리 스모크 계층, 임베딩 캐시 + 저지 배치 처리, 그리고 어떤 게이트든 차단을 시작하기 전에 두는 2주 섀도우 윈도우. 시리즈의 마지막 글입니다."
+++

*릴리스 사이클 노트 — 8편 (최종)*

[7편](/ko/blog/automated-regression-testing-for-custom-llms-in-2026/)의 회귀 스위트를 출시합니다. 잘 작동합니다. 슬라이스 인지형 게이트가 실제 버그를 잡아냅니다. 보정된 저지가 흔들리지 않습니다.

그런데 엔지니어링 리드가 모든 PR에서 실행할 때 비용이 얼마인지 묻습니다. 곱셈을 해봅니다 — PR당 약 12분의 저지 추론, 하루 60건의 PR, 4개 차원 × 17개 슬라이스. 청구서는 실제 돈입니다. 더 나쁜 것은, 이제 모든 개발자가 한 줄짜리 프롬프트 오타에 대해 녹색 체크를 받기 위해 12분을 기다린다는 사실입니다. 속도가 떨어지고<sup><a href="#ref-1">[1]</a></sup>, 팀은 불평하며, 누군가 "그냥 야간에만 게이트를 돌리자"고 제안합니다 — 이는 곧 게이트가 본래 하기로 했던 모든 것을 포기하는 방법입니다.

해결책은 테스트를 줄이는 것이 아닙니다. 해결책은 **계층화된 테스트, 신호의 대부분을 처음 90초 안에 받는 것**입니다. 이 글은 게이트 스위트 아래에서 돌아가는 내용을 다룹니다 — 1초 미만의 계약 테스트, 단단한 스모크 계층, 비용 인지형 플릿, 그리고 새로운 게이트가 누구든 차단하기 전에 두는 2주 섀도우 윈도우.

이 글은 시리즈의 마지막인 8편입니다. 글을 다 읽고 나면 [4단계 파이프라인](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)부터 모든 커밋에서 실행되는 계약 테스트 픽스처에 이르기까지 전체 그림을 갖게 됩니다.

## 커스텀 언어 모델에 CI란 무엇을 의미합니까?

커스텀 LLM의 CI란 게이트 스위트가 반복할 필요가 없는 작업입니다. 게이트는 의미적 품질을 채점합니다. CI는 게이트가 저지 토큰을 단 하나라도 소비하기 전에 게이트의 점수를 무의미하게 만들 만한 모든 것을 잡아냅니다.

계약 테스트는 밀리초 단위로 실행되며 프롬프트 템플릿이 여전히 렌더링되는지, 툴 호출 스키마가 여전히 파싱되는지, 리트리벌 인덱스가 여전히 응답하는지, 매니페스트가 실제로 존재하는 해시를 여전히 참조하는지 검증합니다. 결정론적이고, 무료이며, 파이프라인의 나머지가 존재할 수 있는 유일한 이유입니다. 프롬프트 템플릿을 깨뜨리는 풀 리퀘스트는 12분에 걸친 저지 추론이 헛소리를 채점한 후가 아니라 200ms 안에 실패해야 합니다.

계약 계층은 PR 볼륨에 선형으로 확장되는 CI 청구서와 그렇지 않은 청구서의 차이입니다. Divinci의 CI 러너는 저지 예산의 90% 이상을 실제 의미 평가에 쓰며, 스키마 검사에서 실패했어야 할 PR에 쓰지 않습니다. 그 비율이 헤드라인 수치입니다.

## 왜 전통적인 CI는 LLM에서 무너지는가 — 비용 관점에서

[1편](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)과 [7편](/ko/blog/automated-regression-testing-for-custom-llms-in-2026/)은 결정론적 CI가 생성 모델에서 실패하는 이유를 다뤘습니다. 이 글이 다루는 버전은 그 네 가지 속성의 **존재**가 아니라 그것들의 **비용**입니다.

| LLM의 속성 | 전통적 CI 실패 | 비용 형태 |
|---|---|---|
| 비결정론적 출력 | 정확 일치 단언이 불안정 | 재실행이 비용을 결함률에 선형 비례로 증폭 |
| 다차원 품질 | 단일 불리언은 정보가 부족 | 각 차원이 별도의 (유료) 저지 호출 |
| 프로바이더 드리프트 | 핀 고정된 `gpt-4-2024-01-01`이 조용히 폐기 | 프로바이더가 체크포인트를 일몰하면 재보정 폭증 |
| 비국소적 프롬프트 영향 | 로컬 단위 테스트가 영향을 잡을 수 없음 | 분포 형태가 PR들 사이에서 변하지, PR 내에서 변하지 않음 — 델타가 아닌 전체 스위트 재실행 필요 |

CI 아키텍처는 이 각각을 감당 가능하게 만들어야 합니다. 계약 테스트는 속성 1과 3을 저렴하게 처리합니다. 스모크 테스트는 속성 4를 부분적으로 처리합니다. 속성 2는 오직 전체 스위트만이 처리할 수 있으며 — 그것도 실제로 그게 필요한 PR에서만입니다.

## CI 레이어 케이크 — 1초 미만에서 25분까지

우리가 출시하는 아키텍처는 4개 계층이며, 각 계층은 그 아래의 더 저렴한 계층이 잡을 수 없는 것을 잡음으로써 자기 컴퓨트 비용을 정당화합니다. 모든 계층의 슬라이스 인지형 프레이밍은 [Tianpan Semver Lie 사후 분석](/ko/blog/automated-regression-testing-for-custom-llms-in-2026/)이 명시적으로 보여준 동일한 교훈을 따릅니다<sup><a href="#ref-4">[4]</a></sup>: 집계 신호는 거짓말을 하며, 슬라이스별 신호는 집계가 숨기는 것을 잡아냅니다.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="4계층 CI 아키텍처: 계약 테스트 1초 미만, 스모크 90초, 전체 스위트 12분, 프로덕션 트레이스 리플레이 25분">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">CI 레이어 케이크 — 각 계층이 다음 계층에 도달하는 PR의 깔때기를 좁힙니다</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">대부분의 PR은 상위 두 계층만 거칩니다. PR당 비용 수치는 내부 측정값 — Divinci 프로덕션 CI에서 측정.</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① 계약 · 모든 커밋 · &lt; 1초 · ~$0.00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">스키마 · 템플릿 렌더 · 금지어 목록 · 매니페스트 무결성 · 인덱스 응답성</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">커밋의 100%</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② 스모크 · 모든 PR · ~90초 · ~$0.05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">상위 3개 슬라이스의 20~30개 핵심 케이스 · 태스크 + 안전성만</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">PR의 100%</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ 전체 스위트 · 프롬프트 / 모델 / 리트리벌 PR · ~12분 · ~$0.80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500개 케이스 · 4개 차원 · 모든 슬라이스 · 슬라이스별 Spearman 게이트</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">PR의 ~22%</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ 프로덕션 트레이스 리플레이 · 릴리스 후보 · ~25분 · ~$2.40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">14일 리플레이 윈도우 · 동일한 보정 저지 · 오프라인 ↔ 리플레이 갭 분석</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">PR의 ~4%</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">PR당 집계 비용(깔때기 가중): ~$0.27. 집계 p95 월클록: ~3.4분.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">계층 월클록, 계층별 비용, 깔때기 비율은 내부 수치 — 대표 고객(~500개 골든 데이터셋 케이스, 17개 슬라이스, 하루 ~60 PR)을 대상으로 Divinci 프로덕션 CI에서 측정.</figcaption>
</figure>

비용 형태가 곧 설계입니다. PR의 ~74%는 저지 토큰을 단 하나도 쓰지 않습니다 — 계약 또는 스모크로 충분합니다. 전체 스위트에 도달하는 PR은 프롬프트, 모델 설정, 리트리벌 인덱스, 또는 평가 코드를 건드린 PR입니다 — 정확히 게이트 스위트가 신뢰할 만한 유일한 신호인 변경 사항입니다. 릴리스 후보는 계층 4에 도달하는 작은 비중입니다.

## 계약 테스트 — 불공정한 우위

계약 테스트는 첫 번째 라인이자, 가장 저렴한 라인이며, 대부분의 팀이 "AI 평가 파이프라인"의 격에 어울리지 않는다는 느낌 때문에 건너뛰는 라인입니다. 또한 우리 고객들의 스위트에서 회귀가 될 뻔한 사례의 30~40%가, 저지가 단 한 번도 호출되기 전에 실제로 실패하는 곳이기도 합니다.

계약 계층은 다섯 가지를 검증하며 그 이상은 검증하지 않습니다:

1. **프롬프트 템플릿 렌더링.** 모든 템플릿이 정규 픽스처에 대해 미바인딩 변수, 폭주 루프, 깨진 Jinja 스타일 include 없이 렌더링됩니다.
2. **툴 호출 스키마.** 선언된 모든 툴의 인자 스키마가 파싱되고, JSONSchema가 유효하며, 렌더링된 프롬프트가 실제로 필수 슬롯을 모두 참조합니다.
3. **매니페스트 무결성.** 릴리스 매니페스트의 모든 SHA — 모델, 프롬프트, 리트리벌 인덱스, 저지, 데이터셋 — 가 레지스트리에 실제로 존재하는 아티팩트에 대응합니다. 댕글링 포인터는 세 계층 안쪽이 아니라 여기서 실패합니다.
4. **인덱스 응답성.** 리트리벌 인덱스가 예산 안에서 알려진 쿼리에 응답합니다. 조용히 리트리벌을 깨뜨린 재구축 인덱스는 프로덕션이 아니라 여기서 드러납니다.
5. **금지어 목록 및 토큰 예산.** 금지된 토큰을 도입했거나, 호출당 토큰 예산을 초과했거나, 컨텍스트 윈도우를 넘어 렌더링한 프롬프트 템플릿은 여기서 실패합니다. 휴리스틱 의미 유사도 점수<sup><a href="#ref-6">[6]</a></sup>도 문자열 그대로의 매칭이 부족한 퍼지 매치 금지어 커버리지를 위해 계약 계층에서 실행할 수 있을 만큼 저렴합니다.

```bash
# 대표적인 계약 테스트 호출 — 약 600ms에 실행됨
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

이 중 어느 것도 저지를 호출하지 않습니다. 어느 것도 비결정론적이지 않습니다. 어느 것도 의미 있는 비용이 들지 않습니다. 그리고 이 각각이 "게이트 스위트가 의료 슬라이스가 회귀했다고 말했다"는 부류의 알림 전체를 사전에 배제합니다 — 모델이 애초에 제대로 만들 수 없었던 출력을 채점하는 데 12분의 저지 추론을 낭비할 뻔한 그 알림 말입니다.

## 스모크 계층 — 90초, PR당 ~$0.05

계약 계층이 저렴한 불공정 우위라면, 스모크 계층은 커피 한 잔 가격보다 적은 비용으로 실제로 회귀를 잡아내는 계층입니다. 가장 볼륨이 큰 슬라이스에서 추출한 20~30개의 케이스를 **태스크 완료와 안전성만** 채점합니다. 충실성, 지연시간, 리트리벌 그라운디드 검사는 없습니다. 모든 PR이 이를 실행합니다. 케이스가 구조화된 출력 스키마와 함께 단일 저지 호출로 배치 처리되고, 저지가 릴리스 후보용 풀 품질 저지가 아니라 저렴한 보정 저지이기 때문에 약 90초가 걸립니다.

우리는 각 출시된 수정이 어느 계층에서 잡혔는지를 회귀 로그에 추적하며, 그 히스토그램은 지난 6개월간 고객 배포에서 일관성을 유지해왔습니다:

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="회귀가 잡히는 곳을 보여주는 막대 차트: 계약 계층 31%, 스모크 27%, 전체 스위트 28%, 리플레이 11%, 프로덕션으로 빠져나간 것 3%">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">회귀가 잡히는 곳 — 계층별, 고객 배포 전반 지난 6개월</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">대부분의 회귀는 가장 저렴한 계층에서 죽습니다. 비싼 계층은 잔여분에 대해 비용을 정당화합니다.</text>
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
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">계약</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1초 · $0.00</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27%</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">스모크</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90초 · $0.05</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28%</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">전체 스위트</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12분 · $0.80</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11%</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">리플레이</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25분 · $2.40</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3%</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">빠져나감</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ 롤백</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">활성 Divinci CI 배포 전반의 6개월 롤링 집계. 명시된 계층이 가장 먼저 실패한 확인된 회귀의 비율(%)로 보고. 내부 — 우리가 측정.</figcaption>
</figure>

빠져나간 3%가 [5편의 즉시 롤백](/ko/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)이 존재하는 이유입니다. 게이트는 0건의 누출을 약속하지 않습니다. 게이트는 단단한 상한선과 빠져나간 것에 대한 빠른 복구를 약속합니다.

## CI 플릿 사이징 — 12분 스위트가 저렴하게 유지되는 방법

전체 스위트 계층은 산수가 맞아야 하는 지점입니다. 순진한 구현은 케이스당 차원당 한 번씩 저지를 호출하고, 이를 순차적으로 실행하며, 청구서는 케이스 수에 선형으로 비례합니다. 세 가지 최적화가 이를 감당 가능한 수준으로 유지하는 대부분의 일을 합니다:

**임베딩 캐시.** 각 골든 데이터셋 케이스의 리트리벌 컨텍스트 지문은 해시화됩니다. 케이스가 변경되지 않고 리트리벌 인덱스도 변경되지 않았다면, 캐시된 임베딩이 유효하고 리트리벌 단계는 생략됩니다. 안정된 첫 주가 지난 후의 히트율은 우리 고객 배포에서 지속적으로 90%를 넘습니다.

**저지 배치 처리.** 보정된 저지는 구조화된 출력으로 호출되며, 호출당 8~16개 케이스를 배치 처리합니다. 저지의 토큰당 비용은 동일하게 유지되지만, 시스템 프롬프트가 배치 전체에 분할 상각되기 때문에 케이스당 오버헤드가 떨어집니다. 안전한 배치 처리의 임계값은 그 배치 크기에서 저지 자신의 보정된 일치도에 의해 설정되며<sup><a href="#ref-2">[2]</a></sup>, 우리는 주간 저지 보정 패스([7편](/ko/blog/automated-regression-testing-for-custom-llms-in-2026/)) 동안 이를 측정합니다.

**케이스 전반의 KV 캐시 재사용.** 동일한 시스템 프롬프트와 툴 정의가 모든 호출의 앞에 오는 모델의 경우, 그 접두사에 대한 KV 캐시는 케이스당 한 번이 아니라 스위트 실행당 한 번 계산됩니다<sup><a href="#ref-3">[3]</a></sup>. 오픈 웨이트 배포에서는 간단하지만, 클로즈드 API 모델에서는 프로바이더의 접두사 캐싱 지원에 따라 달라집니다.

이 세 가지의 결합된 효과는 전체 스위트의 비용을 위 레이어 케이크 도식에 표시된 수치 부근에 안착시킵니다. 정확한 수치는 내부 자료이지만, 비율이 공개적인 주장입니다: **PR의 ~74%는 저지 비용을 0달러 씁니다. ~22%는 푼돈을 씁니다. 나머지 4%는 우리가 만들어낼 수 있는 가장 높은 신뢰도의 사전 롤아웃 신호를 위해 몇 달러를 씁니다.**

## 섀도우 CI — 팀을 깨뜨리지 않고 켜는 법

우리가 팀들이 가장 자주 저지르는 것을 보아온 단 하나의 실수는, 1일차에 새 게이트를 "꺼짐"에서 "차단"으로 전환하는 것입니다. 임계값은 어제의 데이터로 튜닝되었고, 거짓 양성률은 알 수 없으며, 게이트가 처음 발동되었을 때 팀에는 그것이 진짜인지 거짓 경보인지 판단할 보정 기준이 없습니다. 평가 엔지니어 온콜이 호출되고, 게이트는 비활성화되고, 신뢰는 사라지고, 프로젝트는 끝납니다.

해결책은 *섀도우 CI*입니다 — 새 게이트를 2주간 비차단 모드로 실행하고, 모든 PR에 봇 코멘트로 결과를 게시하며, 차단으로 전환하기 전에 매주 거짓 양성률을 검토합니다. Divinci CI 러너에는 정확히 이를 위한 `--shadow` 플래그가 있습니다. PR 코멘트는 최종 차단 버전과 동일하게 보입니다 — 동일한 차이 표시, 동일한 슬라이스별 분해 — 다만 머지를 게이트하지 않을 뿐입니다.

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

거짓 양성률이 윈도우 전반에 걸쳐 5% 미만으로 지속될 때 우리는 전환합니다. 그렇지 않을 때는 슬라이스별 임계값을 조이고, 저지를 재보정하고, 다시 섀도우합니다. 어느 쪽이든 팀은 1일차에 발동되는 새 게이트에 매복당하지 않았습니다.

## 실제로 조립되는 GitHub Actions 워크플로우

레이어 케이크를 기존 CI에 연결하는 부분은 `.github/workflows/llm-ci.yaml`에서 실행됩니다. 계층들은 저렴한 것이 빠르게 실패하고 비싼 것은 필요할 때만 실행되도록 배선되어 있습니다 — `needs:` 체인과 경로 필터링 트리거가 그 일을 합니다<sup><a href="#ref-5">[5]</a></sup>.

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

주목할 세 가지입니다. 계층들이 `needs:`를 통해 체인되므로 스모크는 깨진 계약 위에서 실행되지 않고, 전체는 깨진 스모크 위에서 실행되지 않습니다. `full` 잡은 12분 실행을 실제로 정당화하는 변경에 대해서만 경로 필터링됩니다 — README의 오타 수정은 게이트 스위트를 트리거하지 않습니다. `--post-pr-comment` 플래그는 GitHub을 벗어나지 않고도 슬라이스별 차이를 볼 수 있게 만드는 부분입니다.

## 실패한 PR 디버그 루프

"게이트가 발동했다"의 나머지 절반은 "왜인지 보여달라"입니다. `medical slice task-completion dropped 0.04`라는 회귀 스위트 출력은 그것을 일으킨 케이스 없이는 조치 가능하지 않습니다. 우리는 PR 코멘트에 슬라이스별 최악의 차이 5개를 노출합니다 — 원본 입력, 베이스라인 출력, 후보 출력, 그리고 저지의 추론 트레이스와 함께. 디버그 루프는 분이 아니라 초 단위로 진행되어야 합니다:

```bash
# 이 PR에서 의료 슬라이스 게이트를 발동시킨 최악의 5개 케이스를 가져옴
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

이는 [6편의 7단계 트리](/ko/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)와 동일한 진단 표면이며, CI 피드백 루프에 연결되어 있습니다. PR을 연 엔지니어는 PR 자체에서 케이스 수준 증거를 봅니다. 별도의 평가 대시보드를 열러 갈 필요가 없습니다.

## 버전 관리 규율 — 프롬프트, 데이터셋, 저지를 코드로

프롬프트 템플릿, 골든 데이터셋, 그리고 저지 프롬프트는 모두 리포지토리에 살며, 릴리스 매니페스트에 해시 고정됩니다. 매니페스트는 스위트를 특정한 재현 가능 상태에 묶는 단일 객체입니다:

```yaml
# manifests/staging.yaml — 모든 CI 실행이 이를 해시함
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

CI 실행이 점수를 게시할 때, 그 점수는 해당 매니페스트 해시로 태깅됩니다. 점수가 움직일 때 "어떤 입력이 움직였는지"라는 질문에 직접적인 답이 있습니다 — 매니페스트를 diff하면, 발동한 계층이 먼저 봐야 할 차원을 알려줍니다. 이것이 [1편의 4단계 파이프라인](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)과 [4편의 vIndex 영수증](/ko/blog/validating-and-releasing-custom-lms-in-regulated-fields/)이 함께 닫는 루프입니다. 매니페스트는 이 여덟 편의 글이 서로 다른 프레이밍으로 모두 향해 쌓아온 감사 프리미티브입니다.

## 이것이 해결하지 못하는 것

이 시리즈의 모든 글에 적어온 동일한 세 가지 정직한 한계입니다.

1. **CI는 스위트에 없는 것을 테스트하지 않는다.** 레이어 케이크가 아무리 영리해도, 그것이 잡는 회귀는 골든 데이터셋의 어떤 케이스가 플래그했을 것들뿐입니다. 리플레이 계층은 행동 드리프트에 대해 이를 완화하지만, 본 적이 없는 새로운 쿼리는 프로덕션에 나타날 때까지 여전히 빠져나갑니다. 시스템은 프로덕션 모니터링과 짝지어져야 합니다.
2. **비용 수치는 모델 가격과 함께 변한다.** 이 글의 모든 비용 수치는 저지 토큰 요율, 임베딩 요율, 추론 요율에 의존하며 이들은 분기마다 표류합니다. 비율 — 74% / 22% / 4%, 31% / 27% / 28% / 11% / 3% — 이 하중을 지탱하는 주장이며, 달러 수치는 특정 시점의 예시입니다.
3. **프로바이더 측 체크포인트 변경은 여전히 어렵다.** 클로즈드 API 프로바이더가 안정적인 이름 뒤에서 모델을 조용히 업데이트할 때, 계약 계층은 그것을 잡을 수 없습니다. 오직 게이트 스위트만이, 그것도 사후에만 잡을 수 있습니다. 우리는 프로바이더가 지원하는 곳마다 명시적인 체크포인트 식별자를 핀 고정하고, 체크포인트가 발표된 날을 전체 스위트 재기준선 설정의 트리거 이벤트로 취급함으로써 완화합니다. 근본 문제 자체는 막을 수 없습니다.

## 시리즈 마무리

이 글은 8편 중 8편입니다. 전체 아크:

1. [Divinci AI로 LLM CI/CD 파이프라인을 구축하는 방법](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — 그 이후 모든 것이 그 안에 살아온 4단계 파이프라인(Register / Gate / Roll / Observe).
2. [커스텀 언어 모델에서의 10가지 CI/CD 릴리스 실패](/ko/blog/10-ci-cd-release-failures-in-custom-language-models/) — 이름 붙은 2026년 실패 모드들, 각각이 잡아냈어야 할 단계에 매핑.
3. [LLM을 위한 12가지 QA 및 릴리스 관리 역량](/ko/blog/12-qa-and-release-management-capabilities-for-llms/) — 역량 매트릭스와 대안과 비교해 Divinci를 위치시키는 3개 진영 벤다이어그램.
4. [규제 분야에서 커스텀 LM의 검증 및 출시](/ko/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — 컴플라이언스 심층 분석, 규제 기관-단계 매핑, vIndex 영수증.
5. [즉시 롤백을 갖춘 자동화된 LLM CI/CD 파이프라인](/ko/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — 운영 계층, 자동화 스펙트럼, 자동 롤백 영수증.
6. [7단계로 커스텀 LLM QA 실패를 진단하는 방법](/ko/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — 진단 의사결정 트리. 모델이 정답인 경우는 대략 일곱 번의 알림 중 한 번.
7. [2026년 커스텀 LLM을 위한 자동화된 회귀 테스트](/ko/blog/automated-regression-testing-for-custom-llms-in-2026/) — 슬라이스 인지형 Spearman 게이트, 보정된 저지, 폐루프 프로덕션 트레이스 리플레이.
8. **이 글.** 위의 모든 것을 모든 PR에서 감당 가능하게 만드는 CI 인프라.

조각들이 조립됩니다: [매니페스트](/ko/api/)는 감사 프리미티브이고, 게이트들은 안전 계층이며, 진단 트리는 복구 루프이고, [vIndex 영수증](/ko/compliance/)은 외부 앵커이며, 레이어 케이크는 그 전체를 모든 커밋에서 실행할 만큼 저렴하게 만드는 부분입니다. 여러분의 커스텀 LLM 릴리스 프로세스가 이 다섯 가지를 함께 갖추고 있지 않다면, 그 격차가 바로 이 여덟 편의 글이 다뤄온 주제입니다.

## FAQ

**모든 커밋에서 실행할 수 있는 가장 저렴한 테스트는 무엇입니까?**

프롬프트 템플릿 렌더 검사입니다. 밀리초 단위로 실행되고, 저지가 필요 없으며, 놀랄 만한 비율의 깨짐을 잡아내고, 측정 가능한 비용이 들지 않습니다. 아직 이것을 실행하고 있지 않다면, 우리가 추천할 수 있는 가장 높은 ROI를 가진 단일 CI 조각입니다.

**커스텀 LLM CI 파이프라인의 비용은 어느 정도를 예상해야 합니까?**

일반적인 PR당 몇 센트, 릴리스 후보 PR당 한 자릿수 달러입니다. 비율은 저지 가격과 PR 중 프롬프트 또는 모델 설정을 건드리는 비율에 따라 다릅니다. 위의 4% 릴리스 후보 비중은 일반적입니다. 프롬프트 반복이 잦은 제품의 경우 그 비중이 올라가고 평균도 그에 따라 상승합니다.

**모든 커밋에서 전체 스위트를 실행해야 합니까?**

아니요. 프롬프트, 모델 설정, 리트리벌, 또는 평가 코드를 건드리는 PR로 경로 필터링하십시오. 다른 모든 변경에는 계약 + 스모크로 충분하며, README 오타에 대한 12분 대기는 한 스프린트 안에 팀의 신뢰를 잃게 합니다. 전체 스위트는 귀합니다. 변경이 품질 차원을 그럴듯하게 움직일 수 있는 곳에 그것을 쓰십시오.

**모두를 깨뜨리지 않고 새 게이트를 도입하려면 어떻게 합니까?**

2주 섀도우 윈도우, 비차단 모드. 섀도우 중 관찰된 거짓 양성률로 임계값을 튜닝하십시오. 지속되는 거짓 양성률이 여러분의 허용치 미만일 때만 차단으로 전환하십시오(우리는 5%를 사용합니다). 다른 방식은 모두가 무시하도록 학습된 게이트를 갖게 되는 길입니다.

**단 하나만 추적해야 한다면 어떤 수치를 추적해야 합니까?**

프로덕션 이전에 잡힌 확인된 회귀의 비율입니다. 이 글의 히스토그램은 성숙한 Divinci 배포에서 그 수치를 약 97%로 보여줍니다. 빠져나가는 3%가 즉시 롤백이 존재하는 이유입니다. 97%가 바로 그 스위트가 존재하는 이유입니다.

## 참고자료

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — CI velocity, change-failure-rate and time-to-restore-service."</a> "PR당 12분은 너무 느리다"는 주장을 의견이 아니라 방어 가능한 주장으로 만드는 산업 횡단 기준선.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. 배치 처리된 LLM-as-judge 호출이 스모크 및 전체 계층에서 사용되는 배치 크기에서 보정을 유지할 수 있다는 실증적 증거 — 이 글의 비용 수치가 달성 가능한 이유.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">"Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. CI 플릿 사이징 섹션에서 인용된 KV 캐시 재사용 및 접두사 공유 기법.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 2026년 4월 29일. 집계 전용 회귀 스위트에 대한 2026년 명명 실패 모드. CI 레이어 케이크가 끝까지 슬라이스 인지형인 이유.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">"GitHub Actions — chaining jobs with `needs:` and conditional execution."</a> 이 글의 .yaml이 그것에 대해 조립되는 프리미티브.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">"BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. 더 저렴한 계층에 대해 LLM-as-judge의 대안으로 참조된 휴리스틱 의미 유사도 지표. 게이트 시점에는 실행하지 않지만, 대규모 금지 구문 탐지를 위해 계약 계층에서 유용함.
  </li>
</ol>
