+++
title = "즉시 롤백을 지원하는 자동화된 LLM CI/CD 파이프라인"
description = "4단계 릴리스 파이프라인 하단의 운영 계층 — 어떤 결정이 자동으로 실행되고, 어떤 결정이 사람의 입력을 요구하며, 실제 롤백 드릴이 어떻게 진행되는지, 그리고 그 결과로 나오는 MTTR 수치까지 다룹니다."
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
summary = "사람의 승인 게이트 사이에서 LLM 릴리스 파이프라인은 스스로 작동하거나, 그렇지 못합니다. 본 글은 아키텍처 글의 운영 측 동반자로, 자동화 스펙트럼(어떤 결정이 자동으로 실행되고, 어떤 결정이 사람을 요구하며, 누군가 명시적으로 오버라이드에 서명할 때까지 어떤 결정을 강제로 중단시키는지)을 그려내고, 실제 롤백 드릴이 어떻게 진행되는지 보여주며, 그 결과로 나오는 MTTR 수치로 마무리합니다."
+++

*릴리스 사이클에서의 메모 — Part V*

---

지난 분기에 가장 많이 인용되었지만 실제로 나가지 않은 페이지는, 새벽 2시 14분에 옵저버가 스스로 발사한 것이었습니다. 후보 릴리스는 게이트를 통과했고, 5%에서 요구되는 4분간 유지되었으며, 25%로 진행한 뒤 그 자리에 멈춰 섰습니다. 분당 품질 모니터는 법률 도메인 슬라이스에서 세 번 연속 임계값 미만 측정값을 감지했고, 롤아웃을 중단했으며, 라우팅을 이전 릴리스로 다시 가리키게 했습니다. 온콜 엔지니어의 알림이 발생했을 무렵 — 장애가 아니라 영수증을 위한 알림이었습니다 — 프로덕션 트래픽은 이미 9분간 정상 상태의 릴리스로 복귀해 있었습니다.

아무도 무언가를 할 필요가 없었습니다. [본 시리즈의 첫 번째 글](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)의 아키텍처는 4단계가 무엇인지 설명합니다. 본 글은 사람의 승인 사이에서 무엇이 실행되는지 — 즉, 아키텍처 하단의 자동화 계층, 파이프라인이 스스로 옳은 일을 하거나 못 하는 경계선에 관한 것입니다.

핵심 주장은 이것입니다. **대부분의 파이프라인 결정은 자동화되어야 하지만, 전부는 아닙니다.** 경계선이 중요합니다. 모든 것을 자동화하는 파이프라인은 결국 사람이 잡았어야 할 릴리스를 승격시키게 되고, 아무것도 자동화하지 않는 파이프라인은 존재 의미가 없습니다. 이 경계선을 올바르게 긋는 것이 본 글의 주제입니다.

## 자동화 스펙트럼

모든 파이프라인 결정은 *"사람에게 알리지 않고 스스로 실행되는 것"* 부터 *"명시적인 서명된 승인 없이는 진행을 거부하는 것"* 까지의 스펙트럼 어딘가에 위치합니다. 아래는 우리가 배포한 파이프라인에서 핵심 동작 각각이 그 스펙트럼 위 어디에 있는지를 보여줍니다.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="자동화 스펙트럼. 왼쪽의 완전 자동화부터 오른쪽의 항상 사람 승인 필요까지. 표시된 결정들: 완전 자동화 쪽에는 분당 품질 옵저버 평가, 카나리 체크포인트 헬스 체크, 자동 롤백 트리거; 중간에는 게이트 통과 진행과 카나리 체크포인트 승격; 사람 쪽으로는 프로덕션 배포 등록과 매니페스트 커밋; 항상 사람 쪽에는 게이트 실패 오버라이드 결정과 콜드 스타트 릴리스 섀도 배포.">
<title>자동화 스펙트럼</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">자동화 스펙트럼</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">핵심 파이프라인 결정이 완전 자율(왼쪽)부터 항상 사람(오른쪽)까지 어디에 위치하는지.</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">완전 자동화</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">스스로 실행,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">알림 없음</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">알림 전용</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">자동 실행;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">영수증 + 페이지</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">문제 없으면 진행</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">알려진 윈도에서</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">사람이 거부 가능</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">사람이 시작</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">명시적 사용자</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">동작 필요</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">항상 사람</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">서명된 근거 없이</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">진행 거부</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">옵저버 분당</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">품질 평가</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">5% 트레이스 샘플에서</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">지속 실행</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">카나리 체크포인트</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">헬스 체크</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + 출력</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">품질 5/25/100에서</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">자동 롤백</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">트리거</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3분 연속 임계값</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">미만</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">게이트 통과 후</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">카나리로 진행</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">모든 슬라이스 ≥ 임계값</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ 5%에서 자동 시작</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">체크포인트</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">대기 중 모니터가</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">유지되면 진행</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">릴리스</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">등록</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">고객이 새 매니페스트를</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">커밋</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">게이트 실패 오버라이드</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">감사 로그에 서면</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">근거 요구</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">빨간 표시</tspan> = 파이프라인 동작이 비대칭인 두 결정: 자동 롤백은 스스로 발사되며 옵트 아웃이 불가능하고, 게이트 실패 오버라이드는 진행을 거부하며 근거 작성을 건너뛸 수 없습니다.</text>
</svg>
</figure>

위의 마커 중 두 개는 해당 영역의 색이 아닌 빨간색입니다. 이들은 비대칭 결정 — 파이프라인이 누가 무엇을 결정할 수 있는지에 대해 강한 입장을 취하는 두 지점입니다. **자동 롤백 트리거**는 묻지 않고 발사됩니다. 이를 끄도록 설정할 수 없는 이유는, 이 기능을 갖는 핵심 목적이 새벽 2시 14분에도 작동하는 것이기 때문입니다. **게이트 실패 오버라이드**는 서면 근거 없이는 진행을 거부합니다. 이것 또한 끄도록 설정할 수 없는 이유는, 이 기능을 갖는 핵심 목적이 미래의 당신이 그 이유를 읽을 수 있어야 하기 때문입니다. 파이프라인의 나머지 대부분은 설정 가능하지만, 이 두 가지는 그렇지 않습니다.

## 자동 롤백은 실제로 어떻게 발사되는가

자동 롤백에 대해 가장 많이 받는 질문은 *"엉뚱한 이유로 발사되는 걸 무엇이 막아주는가?"* 입니다. 솔직한 답변은: 단독으로 막아주는 것은 아무것도 없습니다. 보호는 트리거가 어떻게 연결되어 있는지에서 나옵니다.

Observe 단계는 분당 채점 루프를 실행합니다. 매분마다 다음을 수행합니다.

1. 활성 릴리스에서 최근 프로덕션 트레이스의 소규모 집합을 샘플링합니다.
2. 각 트레이스를 *활성 모델*을 통해 재실행합니다(후보가 아닙니다 — 실제로 서빙 중인 것을 채점합니다).
3. Gate-2를 구동한 동일한 보정된 인간 앵커 기반 저지를 사용하여 각 재실행을 채점합니다<sup><a href="#ref-1">[1]</a></sup>.
4. 샘플 전체에 대한 단일 출력 품질 점수를 계산합니다. 이를 `CanaryHealthSample`에 기록합니다.

롤백은 **3분 연속 분당 샘플**이 롤백 임계값 미만일 때 발사됩니다(기본값: 게이트 임계값의 0.85 — 따라서 게이트가 0.65였다면 0.55). 한 번의 나쁜 분이 아니라 세 번입니다. 3분 잠금 시간은 노이즈 필터입니다. 단일 이상치 측정값은 아무것도 트리거하지 않지만, 지속적인 회귀는 트리거합니다.

잠금이 해제되면 롤백 워커가 실행됩니다.

```bash
# 실효적으로 — 파이프라인이 스스로 이를 실행합니다. 사람의 확인 없음.
POST /api/v1/releases/<previous_release_sha>/activate
# 응답은 1초 미만; ~100 레플리카 서비스에서 인플라이트 드레인은 ~12초
```

영수증이 발사됩니다. 온콜 엔지니어는 *영수증에 대한* Slack 알림을 받지, 장애에 대한 알림을 받지 않습니다. 영수증을 열어 보면 세 번의 임계값 미만 측정값, 경과 시간, 그리고 `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup> 해시를 확인합니다. 12초는 인플라이트 드레인 시간이며, 스왑 자체는 1초 미만입니다. 엔지니어가 잠에서 깨어 "내가 뭔가 해야 하나?"라고 물을 때쯤이면 답은 "아니요, 하지만 어떻게 게이트가 이걸 통과시켰는지는 살펴봐야 합니다"입니다.

## 실제 자동 롤백 영수증

프로덕션에서의 영수증은 이렇게 생겼습니다. [컴플라이언스 페이지](/ko/compliance/)에 문서화된 동일한 해시 체인 형식이며, 자동 롤백 이벤트 고유의 추가 필드가 있습니다.

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

영수증 자체가 온콜의 첫 접점입니다. 이를 읽으면 잠이 덜 깬 엔지니어가 실제로 물을 만한 질문들에 답할 수 있습니다. 무엇이 트리거했는가, 어느 슬라이스가 실패했는가, 얼마나 많이, 스왑은 얼마나 걸렸는가, 지금은 무엇이 실행되고 있는가. 이로부터의 다음 액션은 보통 *"애초에 게이트가 어떻게 이걸 통과시켰는지 확인해 보세요"* 인데 — 실패한 릴리스의 영수증에는 슬라이스별 스피어만 테이블이 이미 있습니다.

## 파이프라인이 스스로 하지 않는 것

"자동 롤백은 묻지 않고 발사된다"의 따름정리는, 어떤 다른 일들은 능동적으로 하지 않을 수 있다는 것입니다. 세 가지 명시적 거부.

**서명된 오버라이드 없이는 게이트에 실패한 릴리스를 승격시키지 않습니다.** 게이트 실패는 릴리스를 `gate_fail`로 표시합니다. `/activate` 엔드포인트는 해당 매니페스트 SHA를 받아들이기를 거부합니다. 어떤 커맨드라인 주문도 이를 우회하지 못합니다. 유일한 진행 경로는 `forceGateOverride: true` AND `overrideReason: "<자유 텍스트>"`를 갖춘 강제 오버라이드입니다. 사유 필드는 필수이고, 자유 텍스트이며, 사용자 ID와 함께 감사 로그에 기록됩니다. 우리는 미래의 당신이 현재의 당신이 왜 슬라이스 회귀를 허용할 만하다고 판단했는지 읽을 수 있도록 이렇게 설계했습니다. 실제 환경에서 오버라이드 경로를 사용한 사람은 세 명이 있습니다. 그들의 근거는 여전히 감사 로그에 남아 있습니다.

**모니터가 악화 중이면 카나리에서 100%로 진행하지 않습니다.** 체크포인트 대기 종료 시 p95 레이턴시, 5xx 비율, 또는 출력 품질 점수 중 하나라도 밴드 밖이면 파이프라인은 해당 체크포인트에서 멈추고 페이지를 보냅니다. 진행 후 나중에 사과하지 않습니다.

**콜드 스타트 릴리스는 자동 카나리 하지 않습니다.** 프로덕션 트래픽 이력이 없는 릴리스 — 예를 들어, 완전히 새로운 데이터셋에 대한 신규 파인 튜닝 — 는 출력 품질을 비교할 대상이 없습니다. 파이프라인은 콜드 스타트 릴리스에서 카나리를 시작하기를 거부합니다. 먼저 24시간 섀도 배포를 요구하는데, 이는 실제 프로덕션 트레이스에 대해 후보를 관찰하지만 응답을 서빙하지는 않습니다. 24시간 후에 품질 베이스라인이 생기고, 그러면 카나리가 진행될 수 있습니다. 더 느립니다. 정직합니다. 설정 불가능합니다.

## 복구는 얼마나 빠른가, 종단 간으로?

우리가 공개하는 복구 시간 수치는 **12초**입니다. ~100 레플리카 서비스에서의 인플라이트 드레인 시간입니다. 매니페스트 스왑 자체는 1초 미만입니다. 독자에게 유용하려면 이 12초를 분해해야 합니다.

- **롤백 60초 전 ~ 0초:** 3분 연속 임계값 미만 측정값이 도착합니다. 첫 번째 임계값 미만 측정값이 잠금 타이머를 시작합니다. 품질이 여전히 임계값 미만이면 이후 각 분이 잠금을 연장합니다.
- **t = 0:** 세 번째 임계값 미만 측정값이 `CanaryHealthSample`에 기록됩니다. 롤백 워커가 세 번째 스트라이크를 감지하고 `/activate previous_release`를 디스패치합니다.
- **t < 1초:** 라우팅 계층의 활성 릴리스 포인터(Redis 내)가 전환됩니다. 새 요청이 이전 릴리스에 도달하기 시작합니다.
- **t = 1초 ~ ~12초:** 후보 릴리스는 스왑 시점에 인플라이트였던 요청을 계속 서빙합니다. 인플라이트 드레인. 일부 스트리밍 응답은 자연스럽게 완료되는 데 8~10초가 걸리므로, 일반적인 서비스에서 정리 꼬리는 약 12초입니다.
- **t ≈ 13초:** 감사 로그 영수증이 작성되고 서명됩니다. 알림이 발사됩니다.

우리가 계속 앵커로 인용하는 공개 포스트모템과 비교해 봅시다. Cloudflare의 2022년 6월 장애<sup><a href="#ref-3">[3]</a></sup>는 "무엇을 되돌려야 하는지 안다"에서 "되돌리기 완료"까지 44분이 걸렸으며 — 그것도 *인프라* 계층이었습니다. Atlassian의 2022년 4월 장애<sup><a href="#ref-4">[4]</a></sup>는 상태가 여러 시스템에 분할되어 있었기 때문에 사이트당 12시간이 걸렸습니다. DORA의<sup><a href="#ref-5">[5]</a></sup> 실패 배포 복구에 대한 "엘리트 수행자" 임계값은 1시간 미만입니다. 12초는 엘리트 임계값보다 한 자릿수 더 빠른 것이 아닙니다 — 세 자릿수 더 빠른 것입니다. 이를 가능케 한 아키텍처적 결정은 [Stage 1](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register)의 번들된 릴리스 매니페스트입니다. 매니페스트가 없다면, 라우팅을 다시 가리킬 단일 객체가 없습니다.

## 롤백 드릴 — 아무도 실행하지 않는 매력 없는 관행

대부분의 팀이 건너뛰는 부분이 여기입니다. **롤백 경로가 작동한다는 신뢰 가능한 유일한 신호는, 의도적이고 일정이 잡힌 드릴을 실행하여 확인한 것입니다.** 매 분기마다 한 번 실행합니다. 드릴은 이렇게 진행됩니다.

1. 무작위로 일정이 잡힌 평일 업무 시간을 선택합니다. 팀에게 다가오고 있다고 알리되, 구체적인 시간은 알리지 않습니다.
2. 카나리 슬라이스에 합성 품질 회귀를 주입합니다. (후보 모델이 매직 헤더에 대해 "답변을 거부합니다"로 응답하게 하는 테스트 모드 플래그가 있으며 — 보정된 저지를 반드시 실패시킵니다.)
3. 테스트 릴리스를 게이트로 통과시킵니다(통과합니다 — 우리는 게이트가 아니라 롤백을 테스트하고 있습니다). 카나리를 시작합니다.
4. 옵저버가 세 번의 임계값 미만 측정값을 감지합니다. 자동 롤백이 발사됩니다.
5. 온콜 엔지니어가 반응할 때까지 기다립니다. 얼마나 걸리는지 측정합니다. 그들이 영수증을 충분히 신뢰해서 *놀란 상태로* 페이지를 보내지 *않는지* 기록합니다.
6. 감사 로그에 롤백 영수증의 테스트 모드 플래그가 표시되어 있는지 확인하여, 향후 감사가 드릴과 실제 사고를 구별할 수 있도록 합니다.

우리가 실행한 첫 번째 드릴은 종단 간 19초가 걸렸습니다(12초 스왑 + 우리가 수정해야 했던 7초의 안정화 지연). 가장 최근 드릴 — 2026년 1분기 — 은 12초가 걸렸습니다. 드릴은 결코 건너뛸 수 없습니다. 매 분기마다, 모든 고객 클러스터에서 실행합니다.

대부분의 팀은 의도적인 롤백 드릴을 한 번도 실행해 본 적이 없습니다. 그들의 롤백 경로가 처음 실행되는 때는 실제 사고 중, 압박 하에서, 여러 사람이 통화에 참여한 상태입니다. 12초라는 숫자가 열망적인 것이 아니라 실제 수치가 되도록 만드는 것이 바로 드릴입니다.

## 이것이 해결하지 못하는 것

세 가지 정직한 한계.

**자동 롤백은 핑퐁할 수 있습니다.** 후보 AND 이전 릴리스 둘 다 좋지 않다면 — 예를 들어, 이전 릴리스도 아무도 잡지 못한 천천히 진행 중인 슬라이스 회귀가 있었다면 — 파이프라인은 롤백할 수 있고, 그러면 이전 릴리스도 롤백 후 옵저버에서 실패하며, 롤백할 세 번째 릴리스가 없습니다. 파이프라인은 진동하지 않고 트래픽을 점검 페이지로 중단시킵니다. 해결책은 매니페스트 체인에 정상 작동 중인 이전 릴리스를 둘 이상 인덱싱해 두어 롤백 대상을 설정 가능하게 하는 것입니다.

**옵저버는 추론 비용을 추가합니다.** 5% 샘플에서 활성 모델을 통해 프로덕션 트레이스를 재실행하면 추론 지출에 약 5%가 더해집니다. 우리는 이것이 올바른 트레이드 오프라고 생각합니다. 일부 고객은 마진이 낮은 워크로드에서는 너무 비싸다고 보고 샘플링 비율을 낮추고 싶어 합니다. 다이얼은 존재합니다.

**나쁜 저지는 저지가 없는 것보다 더 나쁩니다.** 옵저버를 구동하는 보정된 저지 자체가 잘못 보정되어 있다면 — 인간 앵커에서 벗어났거나, 오래된 코퍼스로 훈련되었다면 — 옵저버는 잘못된 이유로 자동 롤백을 발사할 수 있습니다. 재보정 주기가 중요합니다. Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup> 글이 절차를 문서화하고 있으며, 운영적 요구 사항은 실제로 그것을 실행하는 것입니다.

## FAQ

### 왜 롤백 트리거가 1분이 아니라 3분 연속인가요?

LLM 품질 점수에는 노이즈 플로어가 있기 때문입니다 — 단일 이상치 분 측정값은 실제 회귀가 아니라 샘플링 변동(5% 트레이스 샘플이 어려운 슬라이스에 우연히 떨어진 것)에서 올 수 있습니다. 3분 잠금은 총 반응 시간을 1분 30초 미만으로 유지하면서도 가장 저렴한 노이즈 필터입니다. 양방향으로 튜닝해 봤습니다. 우리 고객의 일반적인 트래픽 형태에 대해 3분이 최적점입니다. 트래픽 형태가 다르다면 릴리스별로 대기 시간을 설정할 수 있습니다.

### 자동 롤백을 "꺼짐"으로 설정할 수 있어야 하나요?

우리가 배포한 파이프라인에서는, 아닙니다. 자동화된 안전 메커니즘을 갖는 핵심은 아무도 지켜보지 않는 새벽 2시 14분에 작동하는 것입니다. 설정으로 끌 수 있는 자동 롤백은 "안전망이 있었음"이라고 적힌 포스트잇과 같습니다. 설정 가능하게 만들자는 주장은 일부 워크로드가 거짓 양성 롤백을 정당화하기에는 너무 낮은 위험성이라는 것입니다. 우리는 그 주장이 잘못된 곳으로 이어진다고 봅니다 — 워크로드가 자동 롤백을 위해 너무 낮은 위험성이라면, 릴리스 파이프라인도 필요하지 않습니다.

### 이전 릴리스도 좋지 않은 경우는 어떻게 처리합니까?

롤백 대상은 기본적으로 `previous_release`지만, 매니페스트 체인은 N-1보다 더 많은 이력을 저장합니다. 운영자는 롤백을 과거에 정상 작동했던 어떤 매니페스트 SHA로도 재타겟할 수 있으며 — `/api/v1/releases/<historically_good_sha>/activate` — 이것이 자동 N-1 롤백이 더 이전의 나쁜 릴리스에 부딪힐 때의 수동 개입 경로입니다. 비상 밸브가 있습니다. 드뭅니다.

### 최적화해야 할 올바른 지표는 무엇입니까 — MTTR인가 MTBF인가?

MTTR — Mean Time To Recovery — 압도적인 차이로, 적어도 LLM 시스템에 대해서는 그렇습니다. MTBF(Mean Time Between Failures)는 LLM 워크로드가 갖지 않는 "실패"의 결정론적 개념을 가정합니다. 출력 품질은 지속적으로 드리프트합니다. "실패"는 임계값 판단입니다. 빠른 복구를 최적화하는 것은 임계값을 어디에 두는지에 견고하고, 절대 실패하지 않기 위해 최적화하는 것은 취약하고 거짓입니다. DORA의 엘리트 임계값<sup><a href="#ref-5">[5]</a></sup>도 MTTR 용어로 프레이밍되어 있는데, 그것이 올바른 프레이밍입니다.

### 실제로 롤백 드릴을 실행합니까?

네 — 분기별로, 일정에 따라, 영수증에 테스트 모드 플래그를 두어 감사 로그에서 드릴을 실제 사고와 구별할 수 있게 합니다. 우리가 실행한 첫 번째 드릴은 우리가 거기에 있는 줄 몰랐던 7초의 안정화 지연을 노출했습니다. 드릴은 경로가 실제로 작동하는지 알 수 있는 유일한 방법입니다. 런북을 읽는 것만으로는 충분하지 않습니다. 대부분의 팀은 한 번도 실행해 본 적이 없으며, 그것이 대부분의 팀 MTTR 수치가 측정된 것이 아니라 열망적인 이유입니다.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge calibration.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). 보정된 저지가 왜 필요한지, 그리고 슬라이스별 일치가 집계 일치보다 왜 더 중요한지에 대한 앵커. 옵저버의 분당 채점 루프는 이것에 의존합니다.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vindex 가중치 인증.</strong> <a href="/ko/compliance/">Divinci 컴플라이언스 페이지</a>에 문서화되어 있으며 <a href="/ko/blog/validating-and-releasing-custom-lms-in-regulated-fields/">규제 분야 글</a>에서 단계별로 다룹니다. 자동 롤백 영수증의 `vindex_sha256_before/after` 필드는 감사인이 우리 로그를 신뢰하지 않고도 검증할 수 있는 암호학적 앵커입니다.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare 2022년 6월 장애.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: 근본 원인 발견 및 이해. 문제가 된 변경을 되돌리는 작업 시작… 07:42: 마지막 되돌리기 완료." 인프라 계층에서 되돌리는 데 44분이 걸렸으며, 부분적으로는 엔지니어들이 서로의 되돌리기를 덮어쓴 것이 원인이었습니다. "매니페스트 기반 스왑은 그런 실패 모드를 가질 수 없다"는 주장의 앵커입니다.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian 2022년 4월 장애.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 사이트당 복원 12시간, 883개 사이트 전체에 14일이 걸렸는데, 이는 상태가 독립적으로 버전 관리되는 시스템들에 분할되어 있었기 때문입니다. "번들된 릴리스 매니페스트가 시간이 아닌 초 단위를 가능케 하는 것"이라는 주장의 앵커입니다.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>DORA 실패 배포 복구 임계값.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. "실패 배포 복구 시간" 엘리트 수행자 임계값은 1시간 미만으로 문서화되어 있습니다. 12초 파이프라인 수치는 엘리트 임계값보다 세 자릿수 아래이며, 이것이 비교를 읽는 올바른 방법입니다.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrating the AI judge.</strong> 동반 글 <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. 시간이 지남에 따라 인간 앵커 기반 저지를 보정 상태로 유지하기 위한 절차. 본 글의 운영적 주장 — 자동 롤백은 그것을 구동하는 저지만큼만 작동한다 — 은 저지가 실제로 주기적으로 재보정될 때만 성립합니다.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — Divinci pipeline reference.</strong> 이 자동화 계층이 위치한 아키텍처: <a href="/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">4단계 파이프라인 글</a>. 전체 API 표면은 <a href="/ko/api/">API 레퍼런스</a>에 문서화되어 있으며, 본 글이 다루는 것은 릴리스 관리 섹션입니다.
</li>
</ol>

---

*본 시리즈의 다음 글:* **CI Testing for Custom Language Models in 2026.** 본 글은 사람의 승인 사이에 있는 운영 계층에 관한 것입니다. 다음 글은 파이프라인이 시작되기 *전* 의 계층 — 머지 전 CI에 관한 것입니다. PR 시점에 무엇을 평가해야 하는지, 게이트가 보기 전에 실제로 어떤 회귀를 잡아내는지, 그리고 어떤 회귀는 잡지 못하는지.
