+++
title = "12 QA और रिलीज़ मैनेजमेंट क्षमताएँ जो हर कस्टम-LLM प्लेटफ़ॉर्म को शिप करनी चाहिए"
description = "LLM रिलीज़ प्लेटफ़ॉर्म्स का मूल्यांकन करने के लिए क्षमता-दर-क्षमता चेकलिस्ट: slice-aware gates, calibrated judges, atomic rollback, hash-chained receipts — क्या saturated है, क्या मिसिंग है, और camps कैसे बँटे हैं।"
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "अपना खुद का बनाने से पहले हमने बारह LLM रिलीज़ प्लेटफ़ॉर्म्स का सर्वेक्षण किया। बाज़ार तीन camps में बँटा है जो एक-दूसरे से पूरी तरह नहीं मिलते — eval-CI tools, serving-canary tools, और observability tools — और इनके बीच जो seam गायब है, ठीक वही एक customer release को चाहिए। यह पोस्ट उसी सर्वेक्षण से निकली capability checklist है: 12 specific tests जिन्हें आप किसी भी प्लेटफ़ॉर्म पर — हमारे सहित — लागू कर सकते हैं।"
+++

*रिलीज़ साइकल से नोट्स — भाग III*

---

एक साल पहले, अपनी खुद की रिलीज़ पाइपलाइन बनाना शुरू करने से पहले, हम बैठे और हर उस QA-और-रिलीज़ क्षमता को सूचीबद्ध किया जो हमें लगा एक गंभीर LLM प्लेटफ़ॉर्म को शिप करनी चाहिए। फिर हमने उस सूची के विरुद्ध बारह अन्य प्लेटफ़ॉर्म्स का मूल्यांकन किया — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core। किसी के पास सभी बारह नहीं थे। जो combinations *शिप* किए गए थे, वे तीन camps में clustered थे जो एक-दूसरे को पूरी तरह छूते नहीं थे।

यह पोस्ट उसी से निकली capability list है, portable रूप में। इसे इस आधार पर व्यवस्थित किया गया है कि हमारी चार पाइपलाइन stages में से किसमें प्रत्येक क्षमता रहती है — **Register → Gate → Roll → Observe** — ताकि यह [pipeline architecture](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) और [failure modes](/hi/blog/10-ci-cd-release-failures-in-custom-language-models/) के साथ साफ़-सुथरे ढंग से compose हो, जिनके बारे में हमने पहले लिखा है। अगर आप tools का मूल्यांकन कर रहे हैं, तो हर candidate के विरुद्ध सूची को ऊपर से नीचे काम करें; जिनमें सबसे गहरी gaps होंगी, वे आपको बताएँगी कि वे किस camp में हैं।

## तीन camps (ताकि आप जानें कि आप क्या देख रहे हैं)

चेकलिस्ट से पहले, 2026 में बाज़ार का आकार:

- **Eval-CI camp** — Braintrust, Humanloop, Patronus। PR merge पर automated evaluators चलाते हैं। ख़राब merges ब्लॉक करते हैं। Live traffic को कभी नहीं छूते। क्षमताओं 4–6 पर मज़बूत; 7–12 पर अनुपस्थित।
- **Serving-canary camp** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core। Traffic split करते हैं, infrastructure metrics monitor करते हैं, CloudWatch-शैली के alarms पर auto-rollback करते हैं। 1, 7, 9 पर मज़बूत; 8 और 10–12 के quality पक्ष पर अनुपस्थित।
- **Observability camp** — Arize Phoenix, Confident AI, Deepchecks। Production देखते हैं, humans को alert करते हैं, escalate करते हैं। 10 (monitoring) पर मज़बूत, लेकिन वे किसी चीज़ को enforce नहीं करते — alerting auto-rollback नहीं है।

इन camps के बीच का gap — "CI पास हुआ" और "live canary जो quality पर scored है, सिर्फ़ latency पर नहीं" के बीच — वही हिस्सा है जिसे हर किसी को manually bridge करना पड़ता है। उस gap को बंद करना ही इस पोस्ट का load-bearing दावा है।

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="तीन LLM-प्लेटफ़ॉर्म camps का Venn diagram। Eval-CI camp (Braintrust, Humanloop, Patronus) बाईं ओर है और PR merge पर offline evaluation कवर करता है। Serving-canary camp (SageMaker, KServe, Vertex, BentoCloud, Seldon) दाईं ओर है और infrastructure-metric rollback के साथ traffic-splitting कवर करता है। Observability camp (Arize, Phoenix, Confident, Deepchecks) नीचे है और enforcement के बिना monitoring और alerting कवर करता है। तीनों circles संकीर्ण slivers में जोड़ीदार overlap करते हैं, लेकिन central region जहाँ तीनों मिलते हैं वह खाली है। वह खाली केंद्र ही missing seam है जिसके बारे में यह पोस्ट है — एक release decision जो per-slice quality से चलता है, live traffic पर atomically enforced है।">
<title>तीन camps और missing center</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">तीन camps जो पूरी तरह नहीं मिलते</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">हर camp एक हिस्से का मालिक है। केंद्र वहाँ है जहाँ हर टीम हाथ से bridge करती है।</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">Eval-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">PR merge पर</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">offline eval gates</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">Serving canary</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">traffic split +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">infra-metric rollback</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">Observability</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">monitor + alert (enforcement नहीं)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">missing</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">seam</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">Missing seam: per-slice quality gate → output quality से चलने वाला atomic rollback, infra metrics से नहीं।</p>

## Stage ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Immutable manifest layer। SHA द्वारा failure-attribution।</span>
  </div>
</div>

### क्षमता 1. Content-addressable SHA के साथ immutable release manifest

यह क्या है: एक release कोई model weight file नहीं है। एक release *हर चीज़* का एक immutable bundle है — model artifact, prompt template, routing rules, dataset version, preprocessing version — एक एकल SHA-256 द्वारा addressed। दो लोग जो "वही release" deploy कर रहे हैं, उन्हें वही SHA produce करना होगा, वरना pipeline मना कर देगी।

यह क्यों मायने रखता है: इसके बिना, "production किस change ने तोड़ा?" का उत्तर तब असंभव है जब state तीन systems में बँटा हो। Atlassian के अप्रैल 2022 outage<sup><a href="#ref-1">[1]</a></sup> को प्रति site recover होने में बारह घंटे विशेष रूप से इसलिए लगे क्योंकि state independently-versioned systems में रहता था जिन्हें agreement में वापस coordinate करना पड़ा।

कौन शिप करता है: serving-canary camp आंशिक रूप से (model + routing); model registries (MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>) आंशिक रूप से (केवल model artifact)। लगभग कोई **prompt template** को SHA में bundle नहीं करता, और यही वह field है जो सबसे अधिक बदलता है।

### क्षमता 2. सभी release components में atomic version control

यह क्या है: release A से release B में swap *हर चीज़* को एक instruction में flip करता है — weights और prompt और routing और dataset और preprocessing — पाँच अलग dashboard edits के रूप में नहीं।

यह क्यों मायने रखता है: Partial swaps undefined-behavior windows बनाते हैं। अगर prompt update हो जाता है लेकिन routing rule नहीं हुआ है, तो हर request जो नए prompt पर पुरानी routing class के साथ हिट कर रही है, उस state में है जिसकी किसी ने योजना नहीं बनाई।

कौन शिप करता है: पूरी तरह कोई नहीं। Serving-canary camp model image को atomically swap करता है; prompt और routing आमतौर पर कहीं और रहते हैं। Manifest-driven swap वहाँ है जहाँ Divinci का atomic-rollback दावा<sup><a href="#ref-5">[5]</a></sup> आता है।

### क्षमता 3. Training-serving environment parity

यह क्या है: Gate evaluation के दौरान उपयोग की जाने वाली preprocessing pipeline *वही* preprocessing है जो production server उपयोग करता है। अगर वे diverge करते हैं, तो हर offline number एक झूठ है।

यह क्यों मायने रखता है: training-serving skew उन [दस release failures](/hi/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) में से एक है जिनके बारे में हमने लिखा है। लक्षण है "eval में ठीक performs करता है, production में किसी अलग model की तरह व्यवहार करता है।" इलाज है manifest में preprocessing register करना और production preprocessing version के विरुद्ध gating करना।

कौन शिप करता है: Containerization frameworks (BentoML, KServe) को preprocessing को serving के साथ colocate करके आंशिक credit मिलता है। उनमें से कोई भी preprocessing को eval-gate input में bind नहीं करता।

## Stage ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Per-slice Spearman ρ vs human-anchored grader।</span>
  </div>
</div>

### क्षमता 4. Per-slice / per-domain quality gate

यह क्या है: Gate decision *per-slice* scores consume करता है — contract drafting, statutory interpretation, IP licensing — एकल aggregate नहीं। कोई भी एकल slice जो अपने threshold से नीचे गिरती है, release को `gate_fail` mark करती है, चाहे average कैसा भी दिखे।

यह क्यों मायने रखता है: Aggregate scores localized regressions को धो देते हैं। Tianpan के *Semver Lie* writeup<sup><a href="#ref-3">[3]</a></sup> इसे 2026 का dominant LLM release failure mode बताता है: एक model जो average पर सुधर रहा है जबकि चुपचाप एक user-journey class पर collapse कर रहा है।

कौन शिप करता है: **2026 में और कोई नहीं**। Eval-CI tools — Braintrust, Humanloop, Patronus — एक एकल global rubric या एक flat task list के विरुद्ध score करते हैं। वे per-slice threshold या slice-blind override expose नहीं करते। यह पहली जगह है जहाँ camps मिलने में विफल होते हैं।

### क्षमता 5. Human-anchored calibrated judge (Spearman ρ vs human ratings)

यह क्या है: Judge कोई generic LLM-as-judge नहीं है। यह एक LLM judge है जिसका domain-expert panel के विरुद्ध Spearman ρ measured है और per slice configured है। Judge इसलिए चुना जाता है क्योंकि उसकी ranks human की ranks से match करती हैं, इसलिए नहीं कि उसकी मज़बूत प्रतिष्ठा है।

यह क्यों मायने रखता है: MT-Bench<sup><a href="#ref-6">[6]</a></sup> दिखाता है कि GPT-4-as-judge humans के साथ कुल मिलाकर >80% सहमत है, per-category variance के साथ coding (86%) से writing (36–44%) तक। "Overall agreement" उन slices को छुपाता है जहाँ judge अविश्वसनीय है। Per slice judge को calibrate करना ही automated scoring को trustworthy बनाने का एकमात्र ईमानदार तरीक़ा है।

कौन शिप करता है: Braintrust, Humanloop, Patronus judge evaluators चलाते हैं। उनमें से कोई भी per-slice human-anchored Spearman calibration require, expose, या persist नहीं करता। Divinci calibration pipeline [Calibrating the AI Judge](/hi/blog/calibrating-the-ai-judge/) में documented है।

### क्षमता 6. आवश्यक लिखित rationale के साथ override path

यह क्या है: Gate failure को force-override करना allowed है (cold starts, accepted regressions, आदि) लेकिन इसके लिए दो fields की आवश्यकता है — `forceGateOverride: true` और `overrideReason: "..."`। कारण user ID के साथ audit trail में जाता है। कोई anonymous overrides नहीं।

यह क्यों मायने रखता है: Governance gates कोई अलग compliance feature नहीं हैं; वे gate stage की ही एक property हैं। Audit trail को न केवल यह उत्तर देना है "क्या यह override उपयोग किया गया था?" बल्कि "उस समय rationale क्या था?" — क्योंकि भविष्य में आपको इसे पढ़ना होगा।

कौन शिप करता है: Eval-CI tools के पास flags हैं; उनमें से कोई भी override के एक structural हिस्से के रूप में rationale require नहीं करता।

## Stage ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">हर step पर quality monitor के साथ canary 5% → 25% → 100%।</span>
  </div>
</div>

### क्षमता 7. Dwell के साथ multi-checkpoint canary

यह क्या है: Traffic 0% से production तक कम-से-कम तीन checkpoints के माध्यम से जाता है — आमतौर पर **5% → 25% → 100%** — और हर एक पर या तो एक configured dwell time या एक configured request count तक रुकता है, जो भी *बाद* में हो। कोई instant 0%→100% नहीं।

यह क्यों मायने रखता है: Long-tail bugs scale पर surface होते हैं। एक bug जो 0.3% conversations को प्रभावित करता है, 100-prompt eval पर invisible है और production traffic के 5% पर obvious है। Dwell वही है जो canary को long tail देखने का समय देता है।

कौन शिप करता है: Serving-canary camp इसे शिप करता है। AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> 600 (दस मिनट) के default `TerminationWaitInSeconds` को document करता है। KServe, BentoCloud, Seldon, और Vertex सभी समान multi-step canary configurations expose करते हैं। यह saturated क्षमता है।

### क्षमता 8. हर canary checkpoint पर output-quality monitor

यह क्या है: हर checkpoint पर, pipeline आगे बढ़ने से पहले तीन monitors check करती है — p95 latency, 5xx rate, **और** क्षमता 5 के उसी calibrated judge द्वारा computed एक output-quality score। केवल Latency और 5xx पर्याप्त नहीं हैं।

यह क्यों मायने रखता है: यहाँ camps फिर से मिलने में विफल होते हैं। SageMaker, KServe, Vertex, BentoCloud, Seldon सभी latency और error rate देखते हैं। उनमें से कोई भी per-checkpoint output-quality monitor शिप नहीं करता — क्योंकि उनके पास score करने के लिए कोई calibrated judge नहीं है। Eval-CI tools के पास judge है लेकिन वे traffic पर नहीं बैठते।

कौन शिप करता है: कोई भी bridge पूरा नहीं करता। Dwelling-canary infrastructure serving camp में मौजूद है; calibrated judge eval-CI camp में मौजूद है; हमने किसी को उन्हें connect करते नहीं देखा।

### क्षमता 9. Quality breach पर automatic halt

यह क्या है: एक canary checkpoint जो output quality पर fail होता है, auto-halts। Promotion आगे नहीं बढ़ती। Rollout रोकने के लिए कोई human page आवश्यक नहीं है।

यह क्यों मायने रखता है: Humans उस timeframe में loop में नहीं हैं जिसमें rollouts चलते हैं। जब तक एक customer ticket आता है, 25% checkpoint ख़त्म हो चुका है और 100% promote हो चुका है।

कौन शिप करता है: Serving-canary camp infrastructure metrics पर halt करता है। Quality-metric halt वह हिस्सा है जिसके लिए क्षमता 8 का अस्तित्व आवश्यक है।

## Stage ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">सतत trace replay → ~12 s में atomic rollback।</span>
  </div>
</div>

### क्षमता 10. Candidate के माध्यम से सतत production-trace replay

यह क्या है: Canary 100% पर promote होने के बाद, observer चलता रहता है। यह हाल के production traces का sample लेता है, उन्हें *candidate* (अब-active) release के माध्यम से replay करता है, calibrated judge के साथ score करता है, और प्रति मिनट एक quality score emit करता है। सतत, आवधिक नहीं।

यह क्यों मायने रखता है: Silent quality drops — model hedges, confidently एक date hallucinate करता है, refuse करता है जहाँ नहीं करना चाहिए — कभी latency या 5xx नहीं हिलाते। इनके लिए आपको मिलने वाला एकमात्र signal customer ticket है, जो सबसे बुरा संभावित signal है। एक सतत quality monitor इन्हें single-digit मिनटों में पकड़ता है।

कौन शिप करता है: **कोई नहीं।** Observability camp (Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>) production output को monitor करता है लेकिन enforce नहीं करता। Serving-canary camp infra देखता है। Eval-CI camp traffic पर नहीं बैठता। Closed loop — production traces → calibrated judge → enforcement — missing seam है।

### क्षमता 11. Seconds में atomic rollback, minutes में नहीं

यह क्या है: जब observer trigger करता है (कहें, तीन लगातार मिनट threshold के नीचे), rollback automatically fires। Rollback routing को manifest से `previous_release` की ओर re-point करता है। चूँकि previous release एक पूरी तरह bundled manifest था, हर component atomically flips। ~100-replica service पर in-flight drain सहित end-to-end: लगभग 12 seconds<sup><a href="#ref-5">[5]</a></sup>।

यह क्यों मायने रखता है: Cloudflare के जून 2022 outage<sup><a href="#ref-8">[8]</a></sup> को revert होने में 44 मिनट लगे। कारण revert ख़ुद नहीं था — कारण यह था कि engineers एक-दूसरे के reverts पर चले क्योंकि state split था। Manifest-driven rollback single-instruction है; इसमें वह failure mode हो ही नहीं सकती।

कौन शिप करता है: Serving-canary camp तेज़ infrastructure rollback शिप करता है (alarm-triggered, blue-green flip)। Architectural अंतर यह है कि *trigger* infra-only है या quality-aware (क्षमता 10)।

### क्षमता 12. Hash-chained, externally-anchorable compliance receipt

यह क्या है: हर release decision — register, gate-pass, gate-fail, gate-override, checkpoint-promote, auto-rollback — एक JSON-with-SHA-256 receipt emit करता है, इस customer के पिछले receipt और इस release के पिछले receipt से hash-chained। Chain customer द्वारा configured schedule पर externally anchored है।

**Open-weights caveat।** जब release एक open-weights model (Gemma, Qwen, Llama, Mistral, GPT-OSS) द्वारा backed है, तो receipt एक [vindex weight-attestation](/hi/compliance/) embed करता है — एक proof कि decision time पर active weights वही weights हैं जो manifest ने register किए। जब release एक closed-API model (OpenAI, Anthropic, Google opaque APIs के माध्यम से) द्वारा backed है, तो receipt decision chain को cover करता है लेकिन weight provenance का दावा नहीं कर सकता, क्योंकि provider weights expose नहीं करता। Receipt स्पष्ट रूप से ऐसा कहता है। यह verifiable की सीमा है।

यह क्यों मायने रखता है: Regulated industries को आज *logs* मिलते हैं। EU AI Act और NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> increasingly *proofs* माँगते हैं। एक hash-chained receipt "हमारे पास एक log है" और "एक auditor हमारे log पर भरोसा किए बिना chain को verify कर सकता है" के बीच का अंतर है।

कौन शिप करता है: और कोई नहीं। यह differentiation का वह हिस्सा है जो सीधे Divinci के मौजूदा [compliance page](/hi/compliance/) पर map करता है — वही receipt format, release decisions तक extended।

## 12 क्षमताएँ, प्लेटफ़ॉर्म camp के अनुसार

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="प्लेटफ़ॉर्म camp के अनुसार 12 क्षमताओं का matrix। Divinci के पास सभी 12 हैं। Eval-CI camp (Braintrust, Humanloop, Patronus) के पास 5 और 6 हैं। Serving-canary camp (SageMaker, KServe, BentoCloud, Vertex, Seldon) के पास 1 partial, 2 partial, 7, 9, और infrastructure metrics पर 11 है। Model-registry camp (W&B Models, MLflow, LangSmith) के पास 1 partial और 2 partial है। Observability camp (Arize, Phoenix, Confident, Deepchecks) के पास monitor-only रूप में 10 है। और कोई के पास 4 per-slice gate, 5 human-anchored calibrated judge, 8 output-quality canary monitor, 10 enforcement के साथ closed-loop trace replay, या 12 hash-chained receipts नहीं हैं।">
<title>12 क्षमताएँ, camp के अनुसार</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">कौन सा camp कौन सी क्षमता शिप करता है</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = शिप करता है। ◐ = partial (infra-only, या registry-only)। ✗ = शिप नहीं करता। हर दूसरे camp में छह क्षमताएँ missing हैं।</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">क्षमता</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">Eval-CI</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">Serving</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">Registry</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">Observe</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. Immutable manifest SHA</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. Atomic version swap (सभी components)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. Training-serving env parity</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. Per-slice / per-domain quality gate</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. Human-anchored calibrated judge</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. आवश्यक rationale के साथ override path</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. Dwell के साथ multi-checkpoint canary</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. हर checkpoint पर output-quality monitor</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. Quality breach पर auto-halt</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. Closed-loop production-trace replay</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. Seconds में atomic rollback</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. Hash-chained compliance receipt</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">क्षमताएँ 4, 5, 8, 10, 12 highlighted: ये पाँच हैं जिनके लिए इस scan में कोई दूसरा ship नहीं है। बाक़ी किसी न किसी camp में cluster करते हैं।</text>
</svg>
</figure>

Pattern ही मुद्दा है। पाँच क्षमताएँ — **per-slice gate, calibrated judge, quality canary monitor, closed-loop replay, hash-chained receipt** — हर दूसरे camp में ✗ के रूप में दिखती हैं। यही seam है। बाक़ी सात camps में इस तरह distribute होती हैं कि हर camp internally coherent है लेकिन mutually incomplete।

## Custom language models के लिए QA software से अलग क्या बनाता है?

LLMs deterministic नहीं हैं, यहाँ तक कि temperature zero पर भी — batching और hardware अंतर output variation का कारण बनते हैं। यह एक property उन अधिकांश assumptions को तोड़ देती है जिन पर traditional QA बनाया गया था:

- **आप `expect(output).toEqual(X)` assertions नहीं लिख सकते।** आपको एक distribution-aware evaluation चाहिए जो human-anchored grader के विरुद्ध rank correlation consume करे, fixture के विरुद्ध equality नहीं। यही क्षमता 5 है।
- **एक model एक aggregate quality check पास कर सकता है जबकि एक slice पर fail हो सकता है।** यही कारण है कि क्षमता 4 अलग से मौजूद है। अगर आपका eval slice नहीं कर सकता, तो वह slice-aware regressions नहीं पकड़ सकता।
- **Quality failures infrastructure layer पर silent होते हैं।** Latency और 5xx साफ़ रहते हैं जबकि model hedges या hallucinate करता है। क्षमताएँ 8 और 10 इसलिए मौजूद हैं क्योंकि कोई infrastructure-side monitor इसे नहीं देख सकता।
- **Rollback optional नहीं है।** क्योंकि failure modes probabilistic हैं और कुछ silent हैं, rollback path को primary infrastructure होना चाहिए, backup plan नहीं। क्षमता 11 वह है जो "12 seconds" को achievable बनाती है; क्षमता 2 वह है जो उसे correct बनाती है।

एक QA-और-release प्लेटफ़ॉर्म जो इन चार facts का हिसाब नहीं रखता, वह LLM logo चिपकाकर deterministic-software CI/CD शिप कर रहा है। बाज़ार में ऐसा बहुत होता है।

## Audit trails व्यवहार में AI compliance को कैसे support करते हैं?

सबसे आम compliance gap जो हम देखते हैं — जब एक auditor deployment के छह महीने बाद आता है और पूछता है "मार्च 15 को model का कौन सा version चल रहा था, और उस release को किसने approve किया?" — वह "हमारे पास logs नहीं हैं" नहीं है। वह "हमारे पास पाँच systems में logs हैं और timelines मेल नहीं खाते" है।

एक compliance receipt (क्षमता 12) इसे log को ही एक portable artifact बनाकर solve करती है: hash-chained, single-source, externally anchorable। एक auditor हमारे infrastructure पर भरोसा किए बिना chain को verify कर सकता है। यही "हमारे पास records हैं" और "records provable हैं" के बीच का अंतर है।

Open-weights model backings के लिए, receipt में एक weight-attestation भी शामिल है — एक cryptographic proof कि active weights वही weights हैं जो manifest ने register किए। यह कठिन माँगों (GDPR Article 17 right-to-erasure, EU AI Act provenance) को satisfy करता है क्योंकि आप साबित कर सकते हैं *न केवल क्या deploy हुआ* बल्कि *यह कि underlying weights वही हैं जो दावा करते हैं*।

Closed-API backings के लिए — जब model एक opaque API के पीछे serve होता है और weights expose नहीं होते — receipt decision chain को cover करता है लेकिन weight provenance का दावा नहीं कर सकता। हम receipt में स्पष्ट रूप से ऐसा कहते हैं बजाय एक proof imply करने के जो हम deliver नहीं कर सकते। यह तब verifiable की सीमा है जब provider weights को internal रखता है।

## यह चेकलिस्ट क्या solve नहीं करती

तीन ईमानदार limitations:

**क्षमताएँ अपने आप में checkboxes नहीं हैं।** एक प्लेटफ़ॉर्म जो सभी बारह को ख़राब तरीक़े से शिप करता है, उसकी तुलना में ख़राब है जो उनमें से आठ को अच्छी तरह से शिप करता है। चेकलिस्ट evaluation के लिए एक starting point है, vendor RFPs के लिए एक scorecard नहीं।

**Competitive snapshot 2026 का है और बदलेगा।** अब से छह महीने बाद ऊपर के कुछ ✗ marks flip हो जाएँगे — competitors postmortems पढ़ेंगे और gaps बंद करेंगे। अगर आप यह पोस्ट 2027 में पढ़ रहे हैं, तो marks पर विश्वास करने से पहले उन्हें ख़ुद audit करें।

**कुछ क्षमताएँ अन्य पर निर्भर करती हैं।** क्षमता 8 (output-quality canary monitor) को क्षमता 5 (calibrated judge) चाहिए। क्षमता 10 (closed-loop trace replay) को दोनों चाहिए। एक प्लेटफ़ॉर्म जो 5 के बिना 8 शिप करता है, वह एक placebo शिप कर रहा है — canary monitor मौजूद है लेकिन किसी trustworthy चीज़ के विरुद्ध grounded नहीं है।

## FAQ

### Custom LLM releases के लिए सबसे महत्वपूर्ण QA क्षमता क्या है?

एक per-slice quality gate (क्षमता 4) — अर्थात्, release decision human-anchored grader के विरुद्ध per-domain Spearman scores consume करता है, एक एकल global aggregate नहीं। Aggregate scores localized regressions को धो देते हैं, और localized regressions 2026 का dominant LLM release failure mode<sup><a href="#ref-3">[3]</a></sup> हैं। अगर आप इस सूची से केवल एक क्षमता शिप कर सकते हैं, तो 4 शिप करें। फिर 5 शिप करें, जो 4 को trustworthy बनाती है।

### बिना छह महीने तक चलाए आप एक LLM QA प्लेटफ़ॉर्म का मूल्यांकन कैसे करते हैं?

ऊपर की 12-capability चेकलिस्ट को vendor documentation पर लागू करें, दो specific tests के साथ। पहले, vendor से अपने एक reference customer के लिए *per-slice* gate output दिखाने को कहें — अगर उनके पास केवल aggregate scores हैं, तो उनके पास क्षमता 4 नहीं है। दूसरे, पूछें कि उनके auto-rollback को क्या trigger करता है — अगर उत्तर "latency, error rate, और हमारे alarms" है, तो वे serving-canary camp में हैं और क्षमता 10 missing है।

### Eval-CI tools और release-management tools के बीच क्या अंतर है?

Eval-CI tools (Braintrust, Humanloop, Patronus) PR merge पर automated evaluators चलाते हैं और ख़राब merges ब्लॉक करते हैं। वे live traffic को कभी नहीं छूते। Release-management tools (यह category) release manifest, canary, observer, और rollback path के मालिक हैं। Eval-CI एक release-management workflow का *हिस्सा* है लेकिन उसका replacement नहीं है। कई teams दोनों में से एक शिप करती हैं और तब gap खोजती हैं जब एक regression जो CI पास हुआ था, चुपचाप production में hit करता है।

### Rollback कितना तेज़ होना चाहिए?

Order-of-magnitude seconds, minutes नहीं। Divinci pipeline पर mean rollback time लगभग 12 seconds है — यह ~100-replica service पर in-flight request drain है, manifest swap ख़ुद नहीं, जो sub-second है। Cloudflare के जून 2022 incident<sup><a href="#ref-8">[8]</a></sup> से तुलना करें, जिसे revert होने में 44 मिनट लगे क्योंकि state systems में बँटा था। Architectural decision जो seconds-not-minutes को संभव बनाता है, वह है bundled release manifest (क्षमताएँ 1 और 2)।

### Compliance receipts compliance logs से अधिक क्यों मायने रखते हैं?

एक log कुछ है जो आपने लिखा। एक receipt कुछ है जिसे एक auditor आप पर भरोसा किए बिना verify कर सकता है। EU AI Act और NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> increasingly दोनों के बीच भेद करते हैं — "documented" "provable" के समान नहीं है, और regulatory दिशा बाद वाले की ओर है। एक hash-chained, externally-anchored receipt उस line को पार करने के लिए उपलब्ध सबसे सरल technology है।

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." क्षमता 1 के लिए cited — scale पर state-spread-across-systems कैसा दिखता है।
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> और <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. क्षमता 1 का model-artifact-only पक्ष। कोई भी prompt-template registration शिप नहीं करता।
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (अप्रैल 2026)। Slice-aware regression failure mode को 2026 के dominant pattern के रूप में नाम देता है। Companion: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. क्षमता 4 के लिए anchor।
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> और <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. 600 (दस मिनट) का default <code>TerminationWaitInSeconds</code>, अधिकतम 1800 (तीस मिनट)। मानक infrastructure-metric canary जिसके विरुद्ध पोस्ट क्षमताओं 8 और 10 पर contrast करती है।
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — release manifest के माध्यम से atomic routing-flip।</strong> ~12-second rollback time ~100-replica service पर in-flight drain है; manifest swap ख़ुद sub-second है। Number हमारी अपनी service से है, benchmark नहीं। Architecture जो इसे संभव बनाता है, वह है क्षमता 1 का bundled manifest।
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023)। &gt;80% overall GPT-4-vs-human agreement, per-category variance के साथ coding (86%) से writing (36–44%) तक। क्षमता 5 के लिए anchor — calibrated judge को per-slice क्यों होना चाहिए।
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Observability camp comparison.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Confident AI's 2026 observability tools comparison</a>. सभी monitoring और alerting शिप करते हैं; कोई rollback enforce नहीं करता। क्षमता 10 के "monitor without enforcement" framing के लिए anchor।
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare जून 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." "हम जानते हैं कि क्या revert करना है" से revert complete तक 44 मिनट, आंशिक रूप से क्योंकि engineers एक-दूसरे के reverts पर चले क्योंकि state split था। क्षमता 11 के लिए anchor।
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — चार core functions जिन पर क्षमता 12 map करती है। साथ ही <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a> पर EU AI Act provenance requirements। क्षमता 12 के लिए anchor।
</li>
</ol>

---

*इस श्रृंखला में अगला:* **Regulated Fields में Custom LMs को Validate और Release करना।** ऊपर की capability चेकलिस्ट generic है। अगली पोस्ट specific है: EU AI Act, GDPR Article 17, HIPAA, और NIST AI RMF — हर एक एक release process से क्या माँगता है, ऊपर की कौन सी क्षमताएँ कौन सी requirement cover करती हैं, और open-weights / closed-weights split वास्तव में compliance story को कहाँ बदलता है।
