+++
title = "커스텀 LLM QA 실패를 진단하는 7단계 방법"
description = "대부분의 'QA 실패'는 모델 실패가 아닙니다 — 평가 커버리지 격차, 저지(judge) 보정 오류, 또는 학습-서빙 스큐입니다. 모델을 탓하기 전에 모델이 아닌 6가지 원인을 배제하는 7단계 진단법입니다."
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
summary = "커스텀 LLM에서 QA 경보가 울리면, 자연스러운 반사 작용은 모델을 탓하는 것입니다. 우리가 진행한 롤아웃 전반에서, 모델이 실제 정답인 경우는 대략 일곱 번에 한 번 정도입니다. 나머지 여섯 번은 버그가 평가에, 저지에, 프롬프트 SHA에, 전처리 파이프라인에, 데이터셋 버전에, 또는 검색 인덱스에 있습니다. 이 글은 우리가 실제로 따라가는 진단 트리입니다 — 순서대로, 각 분기를 답하는 정확한 API 호출과 함께 정리했습니다."
+++

*릴리스 사이클 노트 — 제6부*

---

스코어드 QA 스위트가 어느 고객사의 의료 Q&A 모델에 플래그를 올리기 시작했습니다. 헤드라인 숫자 — 모든 슬라이스 전반의 종합 품질 — 가 하룻밤 사이에 6점 떨어졌습니다. 팀은 이틀 동안 모델을 디버깅했습니다. 파인튜닝을 재실행했습니다. 이전 릴리스로 롤백했습니다. 숫자는 움직이지 않았습니다.

사흘째 아침, 누군가 회귀가 시작된 바로 그날 밤 평가 스위트가 업데이트되었다는 사실을 알아챘습니다. 소아 용량 관련 프롬프트 세 개가 테스트 세트에 새로 추가되었고, 모델은 학습 과정에서 소아 용량을 본 적이 없었습니다. "QA 실패"는 모델 회귀가 아니었습니다. 슬라이스 커버리지 이벤트였습니다. 평가가 모델이 애초에 알아야 할 의무가 없는 무언가에 대해 묻기 시작한 것입니다.

저희가 진행한 고객 롤아웃 전반에서, 이것이 지배적인 패턴입니다. **"QA 실패" 경보는 증상입니다. 원인이 모델인 경우는 대략 일곱 번에 한 번꼴입니다.** 나머지 여섯 번은 버그가 더 상류 어딘가에 있습니다 — 평가 설계에, 저지 보정에, 프롬프트 SHA에, 전처리 파이프라인에, 데이터셋 버전에, 또는 검색 인덱스에 있습니다. 이 각 버그 부류는 경보에서 보면 모두 동일하게 보입니다 — 어떤 숫자가 떨어졌습니다 — 하지만 해결 방법은 완전히 다릅니다.

이 글은 경보가 울릴 때 우리가 순서대로 따라가는 진단 트리입니다. 모델이 아닌 원인을 배제하는 여섯 단계, 그다음 일곱 번째 단계에서야 모델 자체를 검토합니다. 각 단계마다 그것에 답할 수 있는 구체적인 API 호출이나 쿼리가 있습니다. 여섯 단계를 모두 마칠 즈음에는, 무엇을 고쳐야 할지 정확히 알게 되거나, 모델을 들여다볼 자격을 얻게 됩니다.

## 의사결정 트리

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="QA 실패 경보에 대한 진단 의사결정 트리. 1단계는 평가가 이 슬라이스를 포함하는지 묻습니다(아니라면 경보는 평가 커버리지 격차입니다). 2단계는 저지가 이 슬라이스에서 사람과 보정되어 있는지 묻습니다(아니라면 경보는 저지 보정 오류입니다). 3단계는 프롬프트 템플릿 SHA가 프로덕션과 일치하는지 묻습니다(아니라면 경보는 프롬프트 드리프트입니다). 4단계는 전처리가 프로덕션과 일치하는지 묻습니다(아니라면 경보는 학습-서빙 스큐입니다). 5단계는 데이터셋 SHA가 프로덕션과 일치하는지 묻습니다(아니라면 경보는 데이터셋 드리프트입니다). 6단계는 검색 인덱스 버전이 프로덕션과 일치하는지 묻습니다(아니라면 경보는 RAG 인덱스 드리프트입니다). 여섯 단계 모두 모델이 아닌 원인을 배제한 뒤에야 7단계에서 실제로 슬라이스별 모델 회귀라고 결론짓습니다.">
<title>7단계 진단 트리</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">QA 경보가 울리면 — 안으로 파고들지 말고, 아래로 내려가십시오</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">여섯 단계가 모델이 아닌 원인을 배제합니다. 일곱 번째 단계만이 모델을 탓합니다.</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  QA 경보 발생</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">평가가 이 슬라이스를 포함합니까?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ 아니라면: 평가 커버리지 격차. 스위트를 업데이트하고 재테스트합니다.</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">저지가 이 슬라이스에서 사람과 보정되어 있습니까?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ 아니라면: 저지 보정 오류. ρ를 재보정하고 재평가합니다.</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">프롬프트 템플릿 SHA가 프로덕션과 일치합니까?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ 아니라면: 프롬프트 드리프트. 매니페스트를 재등록합니다.</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">전처리 파이프라인이 프로덕션과 일치합니까?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ 아니라면: 학습-서빙 스큐. 전처리 SHA를 바인딩합니다.</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">데이터셋 SHA가 프로덕션과 일치합니까?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ 아니라면: 데이터셋 드리프트. 올바른 SHA로 재등록합니다.</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">검색 인덱스 SHA가 일치합니까?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ 아니라면: RAG 인덱스 드리프트.</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">여섯 단계 모두 통과한다면:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">실제 슬라이스별 모델 회귀입니다.</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">커밋하고, 롤백하고, 재학습합니다.</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">경험적으로 모델이</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">정답인 경우는 일곱 번</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">중 약 한 번입니다.</text>
</svg>
</figure>

이 트리는 순차적입니다. 단계가 비용이 낮은 것에서 높은 순으로 정렬되어 있기 때문입니다. 1단계는 평가 스위트의 `git diff`이고, 7단계는 파인튜닝 사이클입니다. 일주일이 걸리는 비싼 검사 하나에 들이기 전에, 비용이 낮은 여섯 개 검사 각각에 10분씩 쓰는 것이 좋습니다.

## 1단계 — 평가가 이 슬라이스를 포함했는가?

**증상.** 종합 품질이 떨어지지만, 슬라이스별 분석을 보면 한 슬라이스만 폭락하고 나머지는 평탄합니다. 또는 — 더 혼란스럽게도 — *모든* 슬라이스가 비슷한 정도로 약간씩 떨어집니다.

**진단.** 평가 스위트 매니페스트 SHA를 이전 릴리스의 것과 비교합니다(diff). 평가 스위트가 바뀌었는데 모델은 변경하지 않았다면, 회귀는 모델이 아니라 평가에 있습니다.

```bash
# 릴리스 간 평가 스위트 매니페스트 SHA를 비교합니다
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# 다른가요? 평가가 변경된 것입니다. 무엇이 추가되었는지 감사하십시오.
```

**해결책.** 평가 스위트 변경이 의도되지 않은 것이었다면 되돌리거나, 새 슬라이스가 실제 프로덕션 관심사라면 학습 커버리지를 확장해 새 평가에 맞추십시오. 평가 커버리지 문제에 모델 회귀 수정을 출시하지 마십시오 — 모델이 원래 잘하던 일에서 더 나빠지게 만듭니다.

**이것이 우리 파이프라인 어디에 숨어 있는가.** [Stage 1 — Register](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register)는 평가 스위트 SHA를 릴리스 매니페스트에 바인딩합니다. 위 진단은 단지 두 매니페스트를 비교하는 것일 뿐입니다. 의료 Q&A 팀이 이 버그를 잡는 데 이틀이 걸린 이유는, 그들에게 매니페스트 수준의 diff가 없었기 때문입니다. 그들은 모델 체크포인트를 비교하고 있었지, 릴리스 매니페스트를 비교하고 있지 않았습니다.

## 2단계 — 저지가 이 슬라이스에서 사람과 보정되어 있는가?

**증상.** 평가 스위트에 *새로* 추가된 슬라이스의 점수가 낮지만, 사람이 해당 슬라이스에서 모델의 출력을 검토하면 괜찮다고 평가합니다. 저지는 모델이 실패한다고 생각하지만, 사람은 그렇게 생각하지 않습니다.

**진단.** 실패하는 슬라이스에서 LLM 저지의 평가와 소규모 사람 평가 샘플(50개 항목) 간의 Spearman ρ를 계산합니다. ρ &lt; 0.4이면, 저지는 이 슬라이스에서 사람이 측정하는 것을 *측정하고 있지 않은* 것입니다.

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**해결책.** 이 슬라이스에 대해 다른 저지 모델을 선택하거나, 중재자(arbiter)가 포함된 저지 체인을 사용하십시오. MT-Bench<sup><a href="#ref-1">[1]</a></sup>는 GPT-4-as-judge가 평균적으로 사람과 80% 넘게 일치하지만, 카테고리별 편차가 86%(코딩)에서 36–44%(글쓰기/인문학)까지 있음을 보여줍니다. 작동에 의미가 있는 숫자는 이 편차입니다. "평균적으로 좋다"라는 말은 저지가 틀린 슬라이스를 가립니다.

**이것이 우리 파이프라인 어디에 숨어 있는가.** [Stage 2 — Gate](/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate)는 슬라이스마다 보정된 저지를 요구합니다. [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/) 글에서 절차를 문서화합니다. 슬라이스가 보정 단계 없이 평가에 추가되었다면, 구조적으로 신뢰할 수 없는 게이트를 갖고 있는 것입니다.

## 3단계 — 프롬프트 템플릿 SHA가 프로덕션과 일치하는가?

**증상.** 품질이 떨어지지만 model_ref와 dataset_ref는 변하지 않았습니다. 학습에 관한 어떤 것도 바뀌지 않았습니다. 모델은 같은 모델입니다. 그런데도 그렇습니다.

**진단.** 실패한 릴리스 매니페스트의 `prompt_template_ref` SHA를 이전 릴리스의 것과 비교합니다. "간결성을 개선하기 위한" 시스템 프롬프트에 대한 38자 편집이 전체 재학습보다 다운스트림 동작을 더 많이 바꿀 수 있습니다.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# 다른가요? diff를 가져와 자세히 살펴보십시오.
```

**해결책.** 프롬프트를 코드로 다루십시오. [10 release failures 글](/ko/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review)은 대시보드 편집 실패 모드를 다룹니다 — Tianpan의 *Semver Lie* 사후 분석<sup><a href="#ref-2">[2]</a></sup>은 이를 2026년의 지배적인 실패 패턴으로 지목합니다. 프롬프트가 변경되었음을 증명할 수 있다면, 버그를 찾은 것입니다.

## 4단계 — 전처리 파이프라인이 프로덕션과 일치하는가?

**증상.** 모델이 로컬에서는 평가를 통과합니다. 같은 모델이 같은 평가를 프로덕션에서 실패합니다. 같은 model_ref, 같은 프롬프트, 같은 데이터셋인데 말입니다.

**진단.** 프로덕션 매니페스트에서 `preprocessing_ref` SHA를 가져와 평가가 동일한 SHA로 실행되었는지 확인합니다. 전형적인 사례는 다음과 같습니다. 학습은 공백을 정규화하고 소문자로 변환하는데, 프로덕션은 그렇지 않습니다. 평가는 프로덕션 전처리를 통해 실행되었고 모든 것이 확인되었습니다. 누군가 한쪽만 전처리를 업데이트하기 전까지는요.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# 학습/평가 하네스가 실제로 사용한 전처리와 비교하십시오.
```

**해결책.** 전처리를 버전 관리되는 아티팩트로 컨테이너화하십시오. 매니페스트에서 이를 참조하십시오. 게이트의 전처리 SHA가 프로덕션과 다르면 배포를 거부하십시오.

## 5단계 — 데이터셋 SHA가 프로덕션과 일치하는가?

**증상.** 실패한 릴리스의 게이트 평가 점수가 *전날의 동일* 모델 게이트 평가 점수와 다릅니다.

**진단.** 두 릴리스 간 `dataset_version` 필드를 비교합니다(diff). 평가 스위트는 같은 이름을 유지했지만, 데이터셋 내용이 업데이트되고 재태깅되었습니다. 같은 이름, 다른 SHA, 다른 점수.

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**해결책.** 데이터셋을 콘텐츠 해싱하십시오. 데이터셋 이름은 버전이 아닙니다. SHA가 버전입니다.

## 6단계 — 검색 인덱스 SHA가 프로덕션과 일치하는가?

**증상.** RAG 워크로드에만 해당합니다. 검색된 컨텍스트에 의존하는 질문에서 품질이 떨어집니다. 직답형 질문은 변함없습니다.

**진단.** 매니페스트에서 `retrieval_index_ref` SHA를 가져옵니다. 게이트 평가의 검색 인덱스와 비교합니다. RAG 인덱스가 밤사이 업데이트되었고(새로운 인제스션 실행), 게이트 평가는 더 오래된 검색을 캐싱했으며, 프로덕션 카나리는 새 것을 사용했을 수 있습니다.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**해결책.** 검색 인덱스 SHA를 매니페스트에 바인딩하십시오 — 전처리를 바인딩하는 방식과 똑같이. [AutoRAG](/ko/autorag/)의 자동화된 인덱스 로테이션 주기는 이 검사를 특히 가치 있게 만듭니다. 인덱스를 핀(pin)하지 않으면, 당신이 권한을 주었든 아니든 인덱스는 *반드시* 업데이트됩니다.

## 7단계 — 마침내, 모델 자체

여섯 단계를 거쳤습니다. 평가가 슬라이스를 포함합니다. 저지가 보정되어 있습니다. 프롬프트 SHA가 일치합니다. 전처리가 일치합니다. 데이터셋이 일치합니다. 검색 인덱스가 일치합니다.

이제 — 그리고 오직 이제서야 — 모델을 들여다볼 자격을 얻었습니다.

이 단계의 진단은 이전 릴리스 대비 슬라이스별 Spearman 비교입니다. 두 릴리스 모두 *동일한* 매니페스트에 핀된 데이터셋, 전처리, 검색에 대해 평가합니다. 생산되는 숫자는 깨끗한 신호입니다 — 상류 교란 변수가 없는 실제 슬라이스별 회귀입니다.

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

델타가 실제 회귀를 확정한다면, [자동 롤백](/ko/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)이 트리거됩니다(이미 수동으로 실행하지 않았다면). 그리고 실패한 모델은 확장된 슬라이스 커버리지 코퍼스에 대해 재학습됩니다. 이 릴리스를 승격시킨 게이트가 애초에 그 슬라이스를 놓쳤다면, [게이트 또한 버그](/ko/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate)입니다 — 릴리스 파이프라인에서 빠진 4번 역량입니다.

## 분포가 실제로 어떻게 보이는가

앞에서 언급한 "7번에 1번" 프레임은 수사적 장치가 아니었습니다. 우리가 고객 롤아웃 전반에서 보는 대략적인 분포입니다. QA 경보 7번 중:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="QA 경보의 근본 원인 분포 파이 차트. 평가 커버리지 격차가 약 32%를 차지합니다. 저지 보정 오류가 약 18%. 프롬프트 드리프트가 약 16%. 전처리 스큐가 약 12%. 데이터셋 드리프트가 약 7%. RAG 인덱스 드리프트가 약 5%. 실제 모델 회귀가 약 10%. 고객 롤아웃 전반의 내부 관찰이며, 통제된 벤치마크에서 나온 것이 아닙니다.">
<title>QA 경보 근본 원인 분포</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">버그가 실제로 있었던 곳 — 고객 롤아웃 전반</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">내부 관찰이며, 통제된 벤치마크가 아닙니다. 모델이 정답인 경우는 경보 7번에 약 한 번입니다.</text>
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
<text x="522" y="112" font-weight="600">1.  평가 커버리지 격차</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  저지 보정 오류</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  프롬프트 드리프트</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  전처리 스큐</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  실제 모델 회귀</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  데이터셋 드리프트</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  RAG 인덱스 드리프트</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">1단계와 2단계만으로 경보의 절반을 차지합니다. 모델을 살피기 전에 평가를 먼저 살피십시오.</text>
</svg>
</figure>

가장 큰 두 조각은 *평가 커버리지 격차*와 *저지 보정 오류*입니다. 둘이 합쳐 QA 경보의 절반을 차지합니다. 어느 것도 모델 문제가 아닙니다. 둘 다 모델을 어떻게 측정하느냐의 문제입니다.

## 이 방법이 해결하지 못하는 것

세 가지 정직한 한계가 있습니다.

**이 분포는 우리 것이지, 당신 것이 아닙니다.** 위의 백분율은 우리 고객 집단과 우리 파이프라인 도구의 데이터입니다. 다른 종류의 워크로드를 운영한다면 — 멀티모달이 무겁거나, 에이전트 오케스트레이션이 많거나, 단일 생성 중심이라면 — 분포가 다르게 보일 것입니다. 진단 순서는 여전히 유효하지만, 각 단계 뒤의 숫자는 그렇지 않습니다.

**1단계의 "평가 커버리지 격차"가 가장 고치기 어렵습니다.** 누락된 슬라이스를 학습 코퍼스에 추가하고, 그에 맞는 보정된 저지를 구축하고, 카나리를 다시 실행하는 것 자체가 몇 주짜리 프로젝트입니다. 진단은 빠르지만, 교정은 그렇지 않습니다.

**실제 회귀가 모델 이외의 버그에 올라타 함께 올 수 있습니다.** 프롬프트 드리프트와 실제 모델 회귀가 *동시에* 있는 경우가 가장 나쁜 사례입니다. 3단계가 프롬프트 드리프트를 찾고, 당신이 그것을 고치고, 경보가 다시 발화하기 때문입니다. 이 글의 진단 순서는 이를 처리하지만 경과 시간이 더 늘어납니다. "버그가 두 곳에 동시에 있었다"에 대한 지름길은 없습니다.

## FAQ

### 왜 제 LLM은 비슷한 프롬프트에 다른 출력을 만들어내나요?

프롬프트 민감도는 실재하지만, 항상 QA 경보의 *원인*은 아닙니다 — 때로는 상류 버그의 *증상*입니다. 진단을 따라가십시오. 프롬프트 템플릿 SHA가 일치하고 전처리가 일치하고 데이터셋도 일치한다면, 그렇습니다 — 모델이 이 슬라이스에서 분산이 크니, 보다 결정적인 디코딩 경로나 다른 저지가 필요합니다. 상류에서 어떤 것이라도 바뀌었다면, 먼저 그것을 고치십시오.

### LLM 벤치마크는 얼마나 자주 재평가해야 하나요?

프로덕션 슬라이스의 트래픽 형태가 의미 있게 변할 때마다 벤치마크 *콘텐츠*를 재평가하십시오. 벤치마크의 *저지 보정*은 최소 분기마다 재평가하십시오 — 저지 모델은 생각보다 빠르게 드리프트합니다. 거짓 QA 경보의 가장 큰 원인은 18개월 전에 마지막으로 검증되어, 이제는 프로덕션이 더 이상 하지 않는 일을 측정하고 있는 벤치마크입니다.

### 커스텀 언어 모델에서 환각(hallucination)은 무엇이 원인인가요?

환각은 여러 상류 원인이 있습니다 — 검색 실패(위 트리의 6단계), 학습 커버리지 격차(1단계, 간접적으로), 그리고 디코딩 경로 문제(7단계의 실제 모델 관심사). [AutoRAG](/ko/autorag/)는 검색 인덱스를 릴리스 매니페스트에 바인딩하고 매 릴리스마다 다시 핀하여 검색 측 원인을 다룹니다. 나머지 두 원인은 모델 상류의 파이프라인 수준 수정이 필요합니다.

### 학습 데이터가 문제인지 어떻게 알 수 있나요?

실패한 릴리스의 데이터셋 SHA가 이전의 정상 릴리스의 데이터셋 SHA와 일치한다면(트리의 5단계), 데이터는 *직접적인* 원인이 아닙니다. 다르다면, 원인을 찾은 것입니다. 더 어려운 질문 — "데이터셋이 프로덕션 슬라이스 커버리지에 대해 *완전한가*?" — 는 1단계가 테스트하는 것입니다. 평가에는 완전하지만 프로덕션 트래픽에는 불완전한 데이터셋은 슬라이스 커버리지 문제입니다.

### 모델 전체를 재학습하지 않고도 QA 실패를 해결할 수 있나요?

네 — 일곱 번 중 여섯 번은, 해결책이 재학습이 아닙니다. 트리의 1–6단계는 모델을 건드리지 않는 해결책들을 갖고 있습니다. 평가 업데이트, 저지 재보정, 프롬프트 SHA 재등록, 전처리 수정, 데이터셋 재핀, 또는 검색 인덱스 재핀. 재학습은 7단계로, 가장 비싼 해결책이며 실제 모델 회귀에만 사용됩니다. 릴리스 파이프라인의 [감사 기록(audit trail)](/ko/compliance/)을 통해 모델 변경에 적용했을 동일한 출처(provenance) 규율로 이러한 상류 수정을 수행할 수 있습니다.

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
<strong>The four-stage release pipeline.</strong> <a href="/ko/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Each diagnostic step in this post corresponds to a manifest field bound at Stage 1 — Register. Without the manifest discipline upstream, the diagnostic loses its grip; you can't diff what you didn't bind.
</li>
</ol>

---

*이 시리즈의 다음 글:* **Automated Regression Testing for Custom LLMs in 2026.** 이 글은 QA 경보가 발생한 후의 진단에 관한 것입니다. 다음 글은 그 경보를 처음에 발생시킨 회귀 테스트 규율에 관한 것입니다 — 평가에 무엇을 넣을지, 어떻게 정직하게 유지할지, 그리고 회귀 테스트가 저지와 의견이 갈리기 시작할 때 어떻게 해야 할지에 대해 다룹니다.
