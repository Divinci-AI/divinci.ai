+++
title = "2026년 커스텀 LLM을 위한 자동화된 회귀 테스트"
description = "모델뿐 아니라 평가 자체의 드리프트를 잡아내는 회귀 스위트를 구축하는 방법. 슬라이스 인식 게이트, 보정된 판정자, 프로덕션 트레이스 리플레이."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "마이크 무어링(Mike Mooring)"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "images/automated-regression-testing-for-custom-llms-in-2026-hero.png"
reading_time = 13
summary = "대부분의 LLM '회귀'는 사실 평가 스위트 자체의 드리프트입니다 — 판정자 보정, 슬라이스 커버리지, 프롬프트 템플릿, 검색 인덱스 모두 그렇습니다. 다음은 그것들을 잡아내는 스위트로, 보정된 판정자로 슬라이스별 점수를 매기고 실제 프로덕션 트레이스에 대해 리플레이됩니다."
+++

*릴리즈 사이클 노트 — 7부*

금요일 오후 4시 47분에 한 글자짜리 프롬프트 수정을 배포했습니다. 전체 평가 점수는 0.873에서 0.871로 움직였습니다 — 노이즈 플로어 한참 안쪽입니다. 월요일 아침이 되자, 6개월간 안정적이었기에 더 이상 들여다보지 않던 한 부류의 쿼리들 때문에 서포트 큐가 불타고 있습니다.

모델에서 회귀한 것은 아무것도 없습니다. 모델은 같은 모델입니다. **평가가 발밑에서 드리프트한 것입니다.** 6개월에 걸쳐 한 고객 세그먼트가 천천히 성장했지만 골든 데이터셋에는 한 번도 들어가지 못했고, 판정자 프롬프트는 10월에 마지막으로 사람과 보정되었으며, 검색 인덱스는 지난 수요일에 갱신된 임베딩 모델로 조용히 자체 재구축되었습니다.

이것이 6번째 글에서 짚었던 내용입니다 — [모델이 정답인 경우는 일곱 번의 경보 중 대략 한 번뿐](/ko/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)입니다. 즉, 회귀 스위트는 모델뿐 아니라 자기 자신의 드리프트도 감지해야 한다는 뜻입니다. 이 글이 바로 그 스위트입니다.

## 커스텀 LLM에 대한 회귀 테스트란 사실 무엇입니까?

소프트웨어 회귀 테스트는 고정된 입력에 대해 `output == expected`를 단언합니다. 함수가 결정적이기 때문에 동작합니다.

언어 모델은 같은 의미의 함수가 아닙니다. temperature > 0에서 동일한 프롬프트는 유효한 완성의 분포를 만들어내며, "유효함"은 다차원적입니다: 질문에 답했는가, 답이 검색된 컨텍스트에 근거하는가, 안전 영역 안에 머물렀는가, 지연 시간 예산 안에 돌아왔는가. 따라서 커스텀 LLM의 회귀 테스트는 **고정된 베이스라인 분포에 대한 동작 분포를 측정**하는 것입니다 — 여러분에게 중요한 슬라이스 전반에 걸쳐, 사람과 보정된 판정자를 사용해서, 프로덕션 트래픽처럼 보이는 입력 위에서.

이 모든 것이 의미를 가지려면 다음 세 가지가 먼저 갖춰져야 합니다:

1. **골든 데이터셋** — 집계 수준이 아니라 슬라이스 수준에서 프로덕션과 닮아 있어야 합니다.
2. **보정된 판정자** — "우리는 GPT-5를 판정자로 씁니다"가 아니라, "세 명의 인간 평가자에 대해 Spearman ρ ≥ 0.7을 측정했고, 지난주에 마지막으로 갱신했습니다"여야 합니다.
3. **베이스라인 매니페스트** — 점수를 만들어낸 정확한 모델 가중치, 프롬프트 템플릿, 검색 인덱스, 판정자 버전. 이것 없이는 점수가 움직인 이유가 모델이 변해서인지 자(尺)가 변해서인지 알 수 없습니다.

Divinci는 이 세 가지 모두를 1급 객체로 운영하며, 해시로 연결되어 모든 커밋에서 점수가 매겨집니다. 이 글의 나머지는 이것들을 어떻게 조립하는지에 관한 내용입니다.

## 대부분의 LLM 회귀 스위트가 실제 회귀를 잡지 못하는 이유

2026년 커스텀 LLM의 지배적인 실패 모드는 Tianpan의 Sigma Inference 팀이 2026년 4월 포스트모템에서 *Semver Lie*라 명명한 것입니다<sup><a href="#ref-1">[1]</a></sup>: 집계 메트릭은 평탄하거나 좋아지는데, 하나 또는 두 개의 프로덕션 슬라이스가 조용히 회귀합니다. 테스트가 설계될 당시 그 슬라이스는 트래픽의 5% 미만이었기에 골든 데이터셋에 들어가지 못했고, 6개월이 지나면 트래픽의 12%가 되어 모델이 그 슬라이스에서 열화되지만 집계 숫자는 결코 알아차리지 못합니다.

지난 18개월 동안의 공개 LLM 릴리즈 포스트모템을 모두 살펴본 결과, 패턴이 반복됩니다: **스위트가 잘못된 것을 점수 매겼기 때문에 초록색이 되었습니다.** 구체적으로:

- 골든 데이터셋은 출시 시점에 팀이 손으로 작성했고, 변화된 트래픽 분포에 대해 다시 층화되지 않았습니다.
- LLM-판정자 프롬프트는 한 번 설정된 뒤 인간 라벨에 대해 다시 보정되지 않았습니다. 판정자 일치도가 조용히 감소했습니다<sup><a href="#ref-2">[2]</a></sup>.
- 베이스라인 점수가 `(model_sha, prompt_sha, judge_sha, dataset_sha, score)` 튜플이 아니라 원시 숫자로 저장되었습니다 — 그래서 무언가 회귀했을 때, 그 넷 중 무엇이 움직였는지 아무도 알 수 없었습니다.

이 셋을 모두 해결하지 못하는 회귀 스위트는 그저 배포 시점에 초록색으로 바뀌어 거짓 자신감을 주는 CI 단계일 뿐입니다. 해법은 "케이스를 더 늘리는 것"이 아닙니다. 해법은 매 릴리즈마다 **슬라이스 인식, 버전 고정, 판정자 보정** 측정을 하는 것입니다.

## 슬라이스 인식 분석에서 살아남는 골든 데이터셋을 구축하라

기본으로 제공하는 4버킷 구성 — 프로덕션 샘플 60%, 적대적 15%, 전문가가 큐레이션한 엣지 케이스 15%, 실패 리플레이 10% — 는 합리적인 출발점입니다. 이것이 실제로 회귀를 잡게 만드는 것은 모든 케이스에 붙는 **슬라이스 메타데이터**입니다.

데이터셋의 모든 엔트리는 다음을 갖습니다: 입력, 기대 동작(정확한 문자열이 아닌 루브릭), 검색 컨텍스트(있다면), 그리고 `slice` 태그 — 도메인, 사용자 세그먼트, 쿼리 의도, 언어, 길이 버킷 등 제품에 의미 있는 분해 축. 스위트는 **슬라이스별로** 점수를 매기며, 임계치를 넘어 떨어지는 어떤 슬라이스든 — 집계 점수가 올라갔더라도 — 릴리즈를 차단합니다.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="골든 데이터셋 구성: 프로덕션 샘플 60%, 적대적 15%, 전문가 엣지 케이스 15%, 실패 리플레이 10%, 모두 슬라이스에 걸쳐 층화">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">골든 데이터셋 구성 — 모든 축에서 슬라이스 기준으로 층화</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">약 500 케이스 기준. 막대 세그먼트는 비례. 단단한 요구사항은 집계 비율이 아니라 슬라이스별 커버리지입니다.</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">프로덕션 샘플</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">적대적</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">전문가 엣지</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">리플레이</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">층화된 프로덕션 트레이스 · 분기별 갱신</text>
<text x="513" y="90" text-anchor="middle">탈옥 · 인젝션</text>
<text x="627" y="90" text-anchor="middle">도메인 엣지 · 롱테일</text>
<text x="722" y="90" text-anchor="middle">포스트모템 리플레이 ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">모든 케이스는 슬라이스 태그를 가집니다 — 스위트는 각 조합을 별도로 점수 매깁니다</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">도메인</tspan> · 법률 / 의료 / 일반</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">의도</tspan> · 방법 / 사실 / 거절</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">언어</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">길이</tspan> · 짧음 / 중간 / 김</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">세그먼트</tspan> · 엔터프라이즈 / SMB</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">검색</tspan> · 근거 / 오픈</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">도구 사용</tspan> · 0 / 1 / 다단계</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">신규성</tspan> · 기존 / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">구성 × 슬라이스 = 점수 그리드</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">매 릴리즈마다 슬라이스별 점수 — 슬라이스별 Spearman ρ ≥ 0.7 vs 베이스라인</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">임계치를 넘는 어떤 슬라이스든 릴리즈를 차단합니다. 집계 점수는 참고용일 뿐입니다.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">다이어그램은 구조도입니다. 층화 축과 슬라이스별 임계치는 Divinci 릴리즈 매니페스트에서 제품별로 구성됩니다. 내부 자료 — 자사 배포에서 정의됨.</figcaption>
</figure>

운영상 강제해야 함을 배운 두 가지 규칙입니다:

**분기별로 리샘플링하라.** 프로덕션 트래픽 분포는 대부분의 팀이 측정하는 속도보다 빠르게 이동합니다. 우리는 분기마다 직전 90일의 트래픽을 기준으로 프로덕션 샘플 버킷을 다시 층화합니다. 어떤 슬라이스가 트래픽의 5%를 넘었는데 골든 데이터셋의 2%에 못 미친다면, 다음 릴리즈 전에 백필됩니다.

**모든 포스트모템은 케이스를 추가한다.** 프로덕션까지 도달했으나 잡히지 않은 회귀는 곧 데이터셋에서 빠져 있던 케이스입니다. 포스트모템 후 48시간 안에 그것을 리플레이 버킷에 추가하고, 그것을 드러낸 슬라이스로 태깅합니다.

## 사용자보다 먼저 드리프트를 어떻게 감지합니까?

서로 다른 네 가지 종류의 드리프트가 있으며, 마지막 하나만 감시하는 회귀 스위트는 대부분의 회귀를 놓치는 회귀 스위트입니다.

| 드리프트 유형 | 무엇이 움직이는가 | 감지 시그널 | 조치 |
|---|---|---|---|
| **품질 드리프트** | 고정 슬라이스에 대한 판정자 점수 | 슬라이스별 Spearman ρ가 베이스라인 대비 하락 | 릴리즈 차단; [6번 글의 진단 트리](/ko/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)에 따라 진단 |
| **커버리지 드리프트** | 프로덕션 트래픽 분포 vs 골든 데이터셋 분포 | 슬라이스 비율 간 KL 다이버전스 | 골든 데이터셋 리샘플링 |
| **판정자 드리프트** | 판정자 모델의 인간 일치도 | 고정된 인간 라벨 감사 세트에 대한 Spearman ρ | 판정자 프롬프트 재보정 또는 판정자 교체 |
| **프로덕션 드리프트** | 동일 모델의 실 프로덕션 점수 vs 오프라인 점수 | 프로덕션 트레이스 리플레이 점수 갭 | 검색 / 전처리 / 런타임 조사 |

품질 드리프트는 대부분의 스위트가 측정하는 것이며, 나머지 셋은 보통 금요일 오후의 회귀가 숨는 곳입니다. Divinci는 이 네 가지 모두를 베이스라인 매니페스트에 대해 추적하며, 슬라이스별 점수 분해는 모든 PR에 표시되고, 드리프트가 쌓이기 전에 이를 표시하는 주간 판정자 보정 작업이 돌아갑니다.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="30일간 작업 완성도 점수가 집계로는 0.87에서 평탄한 동안 의료 도메인 슬라이스는 조용히 0.88에서 0.74로 하락하는 차트">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Semver Lie를 시각화 — 30일간의 작업 완성도 점수</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">집계(짙은 초록)는 평탄. 의료 슬라이스(빨강)는 조용히 회귀. 집계 게이트는 결코 발동하지 않습니다.</text>
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
<text x="640" y="268" text-anchor="middle">오늘</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">집계 게이트 임계치 — 0.89</text>
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
<text x="664" y="46" font-weight="700" fill="#5a7a8f">법률 슬라이스</text>
<text x="722" y="46" fill="#5a7a8f">0.910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">집계</text>
<text x="722" y="72" fill="#2d5a4f">0.872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">일반</text>
<text x="722" y="98" fill="#7a8a4a">0.863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">의료 슬라이스</text>
<text x="664" y="232" fill="#a04848">오늘 0.743 · 위반 ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">슬라이스 게이트가 여기서 발동 ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Tianpan Sigma 포스트모템 패턴<sup><a href="#ref-1">[1]</a></sup>의 양식화된 재현으로 Divinci 내부 슬라이스 명명을 사용. 구체 수치는 예시입니다.</figcaption>
</figure>

## 다차원 평가 — 네 가지를 동시에, 슬라이스별로 점수 매기기

단일 종합 점수는 네 개의 스칼라 점수보다 더 나쁜 시그널입니다. 우리는 네 가지 차원에서 게이팅합니다:

- **작업 완성도** — 응답이 실제로 질문에 답했는지를, 보정된 판정자가 루브릭에 대비하여 점수 매김. 슬라이스 인식.
- **충실성** — 검색된 컨텍스트를 참조한 모든 응답에서, 모든 주장이 그 컨텍스트에 근거하는지. 환각은 여기서 가장 먼저 나타납니다.
- **안전성** — 거절 정확도, 탈옥 저항, PII / 정책 노출. 거의 항상 ≥ 0.99 통과율에서 게이팅. 안전성은 부드러운 트레이드오프가 아니라 단단한 벽입니다.
- **지연 예산** — 슬라이스의 SLA 내 p95. 응답당 토큰을 두 배로 늘린 프롬프트 변경은 품질이 올라가도 회귀입니다.

각 차원은 자체 슬라이스별 베이스라인과 자체 슬라이스별 임계치를 가집니다. 게이트 시점에 결코 이를 단일 가중 스칼라로 결합하지 않으며, 슬라이스당 네 개의 점수로 표시하고 가장 먼저 임계치를 넘은 것을 기준으로 차단합니다. 의료 슬라이스에서 충실성 1포인트를 잃고 작업 완성도 4포인트를 얻은 모델은 여전히 회귀입니다.

## 어떤 게이트가 커스텀 LLM 배포를 차단해야 합니까?

우리는 3계층 아키텍처를 운영하며, 각 계층이 파이프라인의 서로 다른 단계를 게이팅합니다 ([단계 분류는 1번 글 참고](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)).

**계층 1 — 스모크 (매 커밋, 약 90초).** 영향이 가장 큰 슬라이스들에서 뽑은 20~30개의 핵심 케이스. 전체 스위트가 컴퓨트를 소비하기 전에 치명적 회귀를 잡습니다. 스모크가 실패하면 나머지는 돌지 않습니다.

**계층 2 — 전체 스위트 (매 PR, 약 12분).** 완전한 골든 데이터셋을 네 가지 차원 모두에서 슬라이스별로 점수 매김. 베이스라인 매니페스트 대비 슬라이스 인식 Spearman ρ. 임계치 위반은 머지를 차단합니다. PR 코멘트에는 어떤 슬라이스의 어떤 차원이 얼마나 움직였는지가 다섯 개의 실패 사례 예시와 함께 정확히 기재됩니다.

**계층 3 — 베이스라인 비교 (릴리즈 후보, 약 25분).** 후보 모델은 직전 14일의 프로덕션 트레이스에 대해 리플레이됩니다 — [1번 글에서 출시한](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) *클로즈드 루프 프로덕션 트레이스 리플레이*입니다. 골든 데이터셋을 점수 매기는 동일한 보정된 판정자가 리플레이 출력도 점수 매깁니다. 리플레이 점수가 오프라인 점수와 임계치 이상 벌어지는 슬라이스가 있으면 릴리즈가 차단됩니다. 이 계층이 골든 데이터셋이 아직 모르는 드리프트를 잡아내는 곳입니다.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="3계층 게이트 의사결정 트리: 매 커밋의 스모크 테스트, 매 PR의 전체 스위트, 릴리즈 후보의 프로덕션 트레이스 리플레이">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">3계층 회귀 게이트 — 각 블록은 빠르게 실패, 각 계층은 깊이를 더함</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① 스모크 · 매 커밋</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">케이스: 핵심 20–30</text>
<text x="14" y="82">소요 시간: ~90초</text>
<text x="14" y="102">차원: 작업 + 안전성만</text>
<text x="14" y="122">슬라이스: 볼륨 상위 3</text>
<text x="14" y="148" font-weight="600">차단 대상:</text>
<text x="14" y="168">치명적 실패</text>
<text x="14" y="186">잘못된 형식 출력</text>
<text x="14" y="204">안전성 벽 위반</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">빠른 실패 — 전체 스위트</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② 전체 스위트 · 매 PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">케이스: 전체 ~500</text>
<text x="14" y="82">소요 시간: ~12분</text>
<text x="14" y="102">차원: 작업 / 충실 / 안전 / 지연</text>
<text x="14" y="122">슬라이스: 층화된 전체</text>
<text x="14" y="148" font-weight="600">차단 대상:</text>
<text x="14" y="168">슬라이스별 ρ &lt; 0.7</text>
<text x="14" y="188">임계치 미만의 슬라이스 메트릭</text>
<text x="14" y="208">판정자 일치도 &lt; 0.65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">PR 코멘트가 무엇인지 명시</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ 리플레이 · 릴리즈 후보</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">케이스: 라이브 트레이스 14일</text>
<text x="14" y="82">소요 시간: ~25분</text>
<text x="14" y="102">차원: 네 가지 모두 · 슬라이스 인식</text>
<text x="14" y="122">출처: 프로덕션 트레이스 저장소</text>
<text x="14" y="148" font-weight="600">차단 대상:</text>
<text x="14" y="168">오프라인 ↔ 리플레이 점수 갭</text>
<text x="14" y="188">아직 골든 데이터셋에</text>
<text x="14" y="206">없는 슬라이스의 드리프트</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">롤아웃 전 마지막 게이트</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">세 계층 모두 동일한 베이스라인 매니페스트 — (model_sha, prompt_sha, retrieval_sha, judge_sha) — 에 대해 점수 매겨지므로, 점수의 이동은 단지 <tspan font-weight="600" fill="#1e3a2b">무언가가</tspan> 드리프트했다는 것이 아니라 <tspan font-weight="600" fill="#1e3a2b">어느</tspan> 차원이 드리프트했는지를 식별합니다.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">소요 시간 수치는 내부 수치 — 약 500개의 골든 데이터셋 케이스와 약 14일의 프로덕션 트레이스를 가진 대표 고객에 대해 Divinci 프로덕션 CI 러너에서 측정됨.</figcaption>
</figure>

## 어떤 단일 점수도 신뢰하기 전에 판정자를 보정하라

LLM-판정자는 이 모든 것을 수백 케이스를 넘어 확장 가능하게 만드는 요소입니다. 또한 회귀 스위트가 조용히 작동을 멈추는 지점이기도 합니다. 판정자가 갱신되거나 데이터 분포가 이동할 때 보정된 상태를 유지해야 할 의무가 없기 때문입니다.

우리는 골든 데이터셋과 동일한 슬라이스에 걸쳐 층화된 최소 100건 이상의 동결된 인간 라벨 감사 세트에 대해 모든 판정자 프롬프트를 보정하며, 보정은 주간으로 재실행합니다. 출시 기준은 인간 평가자 중앙값 대비 **Spearman ρ ≥ 0.7**이며, 이진 안전성 판정에 대해서는 **Cohen's κ ≥ 0.6**입니다. 두 수치 모두 MT-Bench 류의 판정자가 인간 간 일치도 수준으로 인간 평가자를 추적하는 것으로 입증된 임계치 위입니다<sup><a href="#ref-2">[2]</a></sup>.

주간 보정이 임계치 아래로 떨어지면 해당 판정자는 자동으로 폐기되고, 온콜 평가 엔지니어에게 페이지가 발송됩니다. 릴리즈 파이프라인은 더 이상 측정해야 할 것을 측정하지 못하는 판정자에 의해 후보를 게이팅하는 대신, 후보를 보류 상태로 열어 둡니다.

```bash
# 주간 판정자 보정 작업 실행
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

## Divinci의 차별점 — 클로즈드 루프 프로덕션 트레이스 리플레이

계층 3 게이트는 대부분의 회귀 스위트가 가지지 못한 부분입니다. 흐름은 1번 글에서 출시한 흐름과 같으며, 회귀 테스트를 위한 한 가지 특화가 더해집니다: 모든 릴리즈 후보는 오프라인 골든 데이터셋에서의 점수와, 리플레이된 14일치 프로덕션 트레이스에서의 점수를 슬라이스별로 비교합니다. 골든 데이터셋은 모델이 무엇을 하기를 기대했는지를 측정합니다. 리플레이는 지난주에 모델이 실제로 어떻게 행동했을지를 측정합니다.

두 점수가 슬라이스별 갭 예산 이상으로 벌어지면 릴리즈는 차단됩니다. 그 불일치가 시그널입니다: 골든 데이터셋이 더 이상 대표성을 갖지 못하거나(커버리지 드리프트), 후보가 프로덕션의 전처리·검색에 형성된 트레이스에서 다르게 행동하는 것입니다(프로덕션 드리프트). 어느 쪽이든, 사용자보다 먼저 알게 됩니다.

오프라인 실행을 점수 매기는 판정자는 리플레이 실행을 점수 매기는 판정자와 동일합니다. 감사 로그에는 두 점수 세트, 두 판정자 버전, 리플레이된 트레이스 ID, 차단을 발동한 갭이 모두 기록됩니다. 갭 자체가 우리가 가진 가장 유용한 진단 시그널이며, 다음 [6번 글의 진단 트리](/ko/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)를 이어받는 사람에게 전달되는 정보입니다.

## 골든 데이터셋을 vindex 영수증으로 앵커링하라

스위트의 모든 점수는 나중에 재현할 수 없다면 의미가 없습니다. 우리는 매 릴리즈마다 골든 데이터셋을 해시하고, 그 해시를 모델 SHA, 프롬프트 SHA, 판정자 SHA, 보정 기록과 함께 vindex 영수증에 체이닝합니다. 영수증은 외부적으로 앵커 가능합니다 — 감사자는 6개월 뒤에도 우리의 정확한 회귀 실행을 리플레이하여 우리가 주장한 점수를 검증할 수 있습니다.

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
  "verifiable_at": "https://vindex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**오픈 가중치 단서.** 위 영수증은 모델이 오픈 가중치일 때만 가중치 출처를 전달합니다 — vindex는 실제 가중치 바이트를 앵커링합니다. 클로즈드 API 모델 백엔드(OpenAI / Anthropic / Google 관리형 모델)의 경우, 영수증은 여전히 결정 체인 — 모든 게이트 점수, 모든 판정자 결과, 보정 기록 — 을 전달하지만, 가중치 필드는 비어 있고 모델 아티팩트를 독립적으로 검증할 수 없습니다. 우리는 이 사실을 영수증과 [컴플라이언스 문서](/ko/compliance/)에 명시하여 감사자가 잘못된 인상을 받지 않도록 합니다. 완전한 vindex 체인의 이점이 가장 큰 릴리즈는 가중치를 직접 통제하는 경우입니다.

## 실제로 출시해 본 4단계 구현 일정

전체 아키텍처를 첫 주에 출시하려는 팀은 도구에서 멈춥니다. 아래 순서가 실제로 작동하는 순서입니다.

**1단계 — 베이스라인 (1주차).** 직전 30일 프로덕션 트레이스의 층화 샘플을 끌어옵니다. 두 명의 엔지니어가 각각 100건의 케이스에 작업 완성도를 손으로 라벨링합니다. 라벨러 간 일치도를 계산합니다(목표 Cohen's κ ≥ 0.6). 얻은 수치가 출발 인간 베이스라인이며, 이후 모든 것이 이에 대비해 보정됩니다.

**2단계 — 하니스 (2~3주차).** 100건짜리 데이터셋 위에 평가 하니스를 세웁니다. 인간 라벨에 대해 보정된 판정자를 추가합니다. 하니스가 ρ ≥ 0.7 이내로 인간 점수를 재현하는지 검증합니다. 대부분의 팀은 첫 판정자 프롬프트가 이를 통과하지 못해 두 번 다시 작성합니다 — 정상입니다.

**3단계 — 게이트 (3~4주차).** 하니스를 차단이 아닌 경고로서 CI에 연결합니다. 2주간 관찰합니다. 거짓 양성 비율을 보면서 발견한 임계치만이 살아남는 임계치입니다. 거짓 양성 비율이 5% 미만이 되었을 때만 차단으로 승격하십시오.

**4단계 — 리플레이 루프 (지속).** 게이트가 안정적으로 차단을 수행하기 시작하면 프로덕션 트레이스 리플레이 계층을 켭니다. 여기서 슬라이스 커버리지 갭이 표면화되며, 모든 포스트모템이 골든 데이터셋에 케이스를 다시 추가하기 시작하는 지점입니다.

## 이 글이 해결하지 않는 것

이 시리즈의 모든 글에서 그래왔듯이, 솔직한 세 가지 한계입니다.

1. **스위트 드리프트는 끝없는 작업입니다.** 회귀 테스트는 인프라이지 프로젝트가 아닙니다. 골든 데이터셋은 분기별로 다시 층화되어야 하고, 판정자는 주간으로 재보정되어야 하며, 임계치 예산은 모든 포스트모템마다 다시 튜닝되어야 합니다. 스위트를 출시한 뒤 손을 떼는 버전은 없습니다.
2. **완벽하게 보정된 판정자도 여전히 모델입니다.** 인간 평가자 대비 Spearman ρ = 0.74라는 의미는 판정자 호출의 약 1/4이 인간 중앙값과 일치하지 않는다는 뜻입니다. 그 잔존하는 불일치가 모든 점수의 노이즈 플로어입니다. 우리는 모든 릴리즈 리포트에 이를 명시적으로 표시하며, 그것이 거기 있음을 잊는 팀은 결국 그것에 놀라게 됩니다.
3. **클로즈드 API 백엔드는 검증 가능한 범위를 제한합니다.** 클로즈드 API 모델로는 회귀 스위트가 동작을 측정할 수는 있어도 가중치 출처는 검증할 수 없습니다. 완전한 재현성이 필요하다면 — 규제 산업, 감사되는 배포 — 트레이드오프는 스위트가 아니라 모델 선택에서 발생합니다.

## 다음 글

이 시리즈의 마지막인 8번 글은 CI 내부의 루프를 닫습니다. 이 글과 5번 글이 게이트에서 무엇이 실행되는지에 관한 글이었다면, 다음 글은 게이트가 점수 매기는 후보를 처음에 만들어내는 CI 계층에 관한 글입니다 — 머지 전 평가, 프롬프트 템플릿용 컨트랙트 테스트, 그리고 12분짜리 평가 스위트를 위해 예산을 파산시키지 않으면서 CI 플릿 사이즈를 정하는 방법. 이는 지금까지 다룬 모든 것의 밑에 있는 엔지니어링 계층입니다.

## FAQ

**LLM 평가와 LLM 회귀 테스트의 차이는 무엇입니까?**

평가는 모델이 특정 시점에 절대적 루브릭에 대비해 품질 기준을 충족하는지를 측정합니다. 회귀 테스트는 후보가 동결된 베이스라인과 동일하게 행동하는지를 슬라이스별로, 여러 차원에 걸쳐 측정합니다. 베이스라인이 있어야 회귀 테스트입니다 — Divinci는 두 가지 모두를 제공하며, 회귀 모드는 (model_sha, prompt_sha, judge_sha, dataset_sha)를 고정해 움직인 점수가 어떤 입력이 움직였는지를 식별하게 합니다.

**골든 데이터셋은 몇 개의 케이스를 가져야 합니까?**

생각보다 적게, 생각보다 잘 층화해야 합니다. 잘 정의된 다섯 개의 슬라이스에 대해 200 케이스로 유용한 회귀 커버리지를 출시한 적도 있고, 층화되지 않아 중요한 것을 모두 놓친 5,000 케이스짜리 데이터셋을 본 적도 있습니다. 층화한 200 케이스에서 시작하여, 포스트모템을 통해 리플레이 버킷을 케이스 단위로 키워 가십시오.

**인간 리뷰어를 써야 합니까, 아니면 LLM-판정자를 써야 합니까?**

둘 다 사용하되, 인간이 판정자를 보정하게 하십시오. 인간은 릴리즈 사이클 CI 게이트가 점수 매겨야 하는 볼륨을 따라갈 수 없습니다. 판정자가 볼륨을 채우고, 인간이 판정자를 보정합니다 — 주간으로 Spearman ρ ≥ 0.7로 측정합니다. 어느 한쪽만으로는 실패 모드입니다.

**비결정적 출력은 어떻게 테스트합니까?**

문자열이 아니라 분포를 점수 매기십시오. 판정자가 여러 표현에 걸쳐 적용할 수 있는 루브릭으로 점수 매기고, 각 입력을 temperature > 0에서 3~5회 실행하여 슬라이스 인식 점수가 단일 샘플이 아닌 완성 분포에 대해 계산되도록 하십시오. 결정적 출력이 정말로 필요한 경우(구조화된 출력의 도구 호출, 분류)에만 temperature를 좁히십시오.

**첫 CI 품질 게이트에서 어떤 메트릭을 우선해야 합니까?**

작업 완성도와 안전성 게이트 하나. 둘 다 슬라이스별로. 처음 두 가지가 보정되기 전에 차원을 더 추가하면 노이즈를 만들고, 더 출시한 팀들은 보통 그 노이즈에 게이팅하게 됩니다. 다음으로 검색을 켤 때 충실성을 추가하고, 처음 두 가지가 안정되면 지연을 추가하십시오.

## 참고문헌

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 2026년 4월 29일. 슬라이스 인식 회귀 분석의 2026년 명명된 실패 모드; 집계 점수가 평탄한 동안 저볼륨 슬라이스가 조용히 회귀합니다.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. 강력한 LLM 판정자가 개방형 작업에서 인간 간 일치 수준(약 80%)으로 인간 평가자와 일치한다는 실증 증거이며, 인간 대비 보정 감사가 잡아내도록 설계된 보고된 실패 모드를 포함합니다.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. 파인튜닝된 신경망의 치명적 망각에 관한 기초 결과 — 파인튜닝된 커스텀 LLM이 목표 작업에서의 성취만이 아니라 일반 능력 손실에 대해서도 회귀 테스트되어야 하는 이유입니다.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> 클로즈드 API 대비점: 슬라이스별 의미 품질이 아니라 인프라 메트릭(지연, 오류, CPU)에 게이팅합니다.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. 슬라이스 인식 게이트를 앵커링하는 순위 상관 계수 — 판정자의 점수 스케일 드리프트에 강건하다는 점이 우리가 필요로 했던 속성입니다.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> "배포가 얼마나 자주 사고를 일으키는가"와 "얼마나 빨리 복구하는가"에 대한 산업 전반의 기준선. 게이트에서 차단하는 회귀 스위트는 첫 번째 지표를 낮추고, 즉시 롤백([5번 글](/ko/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/))은 두 번째 지표를 낮춥니다.
  </li>
</ol>
