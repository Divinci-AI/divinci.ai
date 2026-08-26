+++
title = "2026 में कस्टम LLMs के लिए स्वचालित रिग्रेशन टेस्टिंग"
description = "एक ऐसा रिग्रेशन सूट कैसे बनाएँ जो ड्रिफ्ट को पकड़े — सिर्फ़ मॉडल में नहीं, बल्कि eval में भी। स्लाइस-अवेयर गेट्स, कैलिब्रेटेड जजेस, प्रोडक्शन-ट्रेस रिप्ले।"
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "माइक मूरिंग"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-regression-testing-for-custom-llms-in-2026-hero.webp"
reading_time = 13
summary = "ज़्यादातर LLM 'रिग्रेशन' असल में eval सूट के भीतर ही ड्रिफ्ट होते हैं — जज कैलिब्रेशन, स्लाइस कवरेज, प्रॉम्प्ट टेम्पलेट, रिट्रीवल इंडेक्स। यहाँ वही सूट है जो उन्हें पकड़ता है, कैलिब्रेटेड जज के साथ प्रति-स्लाइस स्कोर किया गया और लाइव प्रोडक्शन ट्रेसेज़ के विरुद्ध रिप्ले किया गया।"
+++

*Notes from the Release Cycle — भाग 7*

शुक्रवार शाम 4:47 पर आपने एक-कैरेक्टर का प्रॉम्प्ट ट्वीक शिप किया। एग्रीगेट eval स्कोर 0.873 से 0.871 पर चला गया — नॉइज़ फ़्लोर के पूरी तरह अंदर। सोमवार सुबह आपका सपोर्ट क्यू उन क्वेरीज़ की एक श्रेणी पर भड़का हुआ है जिन्हें आपने छह महीने पहले देखना बंद कर दिया था क्योंकि वे स्थिर थीं।

मॉडल में कुछ भी रिग्रेस नहीं हुआ। मॉडल वही मॉडल है। **eval ही आपके नीचे से ड्रिफ्ट हो गया।** एक ग्राहक सेगमेंट में छह महीने की धीमी वृद्धि कभी golden dataset में नहीं पहुँची, जज प्रॉम्प्ट आख़िरी बार अक्टूबर में मनुष्यों के विरुद्ध कैलिब्रेट हुआ था, और रिट्रीवल इंडेक्स ने पिछले बुधवार चुपचाप ख़ुद को एक रिफ्रेश्ड embedding मॉडल पर rebuild कर लिया।

यही वह बात है जिसे पोस्ट 6 ने उठाया था — [मॉडल लगभग सात अलर्ट में से एक में सही जवाब होता है](/hi/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/)। इसका मतलब है कि आपके रिग्रेशन सूट को ख़ुद अपने भीतर ड्रिफ्ट को पकड़ना होगा, सिर्फ़ मॉडल में नहीं। यह पोस्ट वही सूट है।

## कस्टम LLM के लिए रिग्रेशन टेस्टिंग वास्तव में है क्या?

सॉफ़्टवेयर रिग्रेशन टेस्ट `output == expected` को निश्चित इनपुट्स के लिए assert करते हैं। वे इसलिए काम करते हैं क्योंकि function deterministic होता है।

एक language model उस अर्थ में function नहीं है। एक ही प्रॉम्प्ट temperature > 0 पर वैध completions का एक distribution उत्पन्न करता है, और "वैध" बहु-आयामी है: क्या उसने प्रश्न का उत्तर दिया, क्या उत्तर retrieved context में grounded है, क्या वह safety envelope के भीतर रहा, क्या वह latency budget के अंदर वापस आया। तो एक कस्टम LLM की रिग्रेशन टेस्टिंग का अर्थ है — **एक frozen baseline distribution के विरुद्ध behaviour के distribution को मापना** — उन स्लाइसेज़ पर जो आपके लिए मायने रखती हैं, ऐसे जजेस के साथ जो मनुष्यों के विरुद्ध कैलिब्रेट किए गए हैं, ऐसे इनपुट्स पर जो आपके प्रोडक्शन ट्रैफ़िक जैसे दिखते हैं।

इसमें से कुछ भी सार्थक होने से पहले तीन चीज़ें मौजूद होनी चाहिए:

1. एक **golden dataset** जो प्रोडक्शन से स्लाइस-स्तर पर मिलता हो, समग्र रूप से नहीं।
2. एक **कैलिब्रेटेड जज** — सिर्फ़ "हम GPT-5 को जज के रूप में इस्तेमाल करते हैं" नहीं, बल्कि "हमने तीन human raters के विरुद्ध Spearman ρ ≥ 0.7 मापा, आख़िरी बार पिछले हफ़्ते refresh किया।"
3. एक **baseline manifest** — वही exact model weights, prompt template, retrieval index, और judge version जिन्होंने वह scored किया जो उन्होंने scored किया। इसके बिना आप यह नहीं बता सकते कि स्कोर इसलिए हिला क्योंकि मॉडल बदला या क्योंकि रूलर बदला।

Divinci इन तीनों को first-class objects के रूप में चलाता है, hash-linked, हर commit पर scored। बाकी पोस्ट यह बताती है कि उन्हें कैसे assemble करें।

## क्यों ज़्यादातर LLM रिग्रेशन सूट असली रिग्रेशन पकड़ने में नाकाम होते हैं

2026 में कस्टम LLMs के लिए प्रमुख failure mode वही है जिसे Tianpan की Sigma Inference टीम ने अप्रैल 2026 के अपने postmortem में *Semver Lie* नाम दिया<sup><a href="#ref-1">[1]</a></sup>: एक एग्रीगेट metric flat रहता है या सुधरता है, जबकि एक या दो प्रोडक्शन स्लाइसेज़ चुपचाप regress होते हैं। जब टेस्ट डिज़ाइन किया गया था तब स्लाइस ट्रैफ़िक के 5% से नीचे थी, इसलिए वह कभी golden dataset में नहीं पहुँची; छह महीने बाद वह ट्रैफ़िक का 12% है, मॉडल उस पर degrade हो गया है, और एग्रीगेट संख्या उसे कभी notice करने वाली नहीं थी।

हमने पिछले अठारह महीनों के हर सार्वजनिक LLM-रिलीज़ postmortem को देखा है और pattern दोहराता है: **सूट हरा scored हुआ क्योंकि उसने ग़लत चीज़ scored की।** ख़ास तौर पर:

- Golden dataset को launch पर टीम ने hand-write किया था और कभी shifted ट्रैफ़िक distributions के विरुद्ध re-stratify नहीं किया गया।
- LLM-as-judge प्रॉम्प्ट एक बार set किया गया था और कभी human labels के विरुद्ध re-calibrate नहीं हुआ। जज agreement चुपचाप decay हो गया<sup><a href="#ref-2">[2]</a></sup>।
- Baseline scores raw numbers के रूप में stored थे, `(model_sha, prompt_sha, judge_sha, dataset_sha, score)` tuples के रूप में नहीं — तो जब कुछ regressed हुआ, कोई नहीं बता सकता था कि चारों में से कौन हिला।

एक रिग्रेशन सूट जो इन तीनों को हल नहीं करता, वह बस एक CI step है जो deploy time पर हरा हो जाता है और आपको false confidence देता है। फ़िक्स "और cases" नहीं है। फ़िक्स है **स्लाइस-अवेयर, version-anchored, judge-calibrated** measurement, हर रिलीज़ पर।

## एक ऐसा golden dataset बनाएँ जो स्लाइस-अवेयर analysis में टिके

चार-bucket composition जो हम default से ship करते हैं — production samples 60%, adversarial 15%, expert-curated edge cases 15%, failure replays 10% — एक उचित शुरुआती बिंदु है। इसे वास्तव में रिग्रेशन पकड़ने वाला बनाता है हर case से जुड़ा **slice metadata**।

Dataset में हर entry यह carry करती है: input, expected behaviour (rubric, exact string नहीं), retrieval context (यदि कोई हो), और एक `slice` tag — domain, user segment, query intent, language, length bucket, जो भी decompositions आपके product के लिए मायने रखें। सूट **प्रति स्लाइस** score करता है, और कोई भी स्लाइस जो अपनी threshold से नीचे गिर जाए वह रिलीज़ को block कर देती है, भले ही एग्रीगेट स्कोर ऊपर गया हो।

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Golden dataset रचना: 60% production sample, 15% adversarial, 15% expert edge cases, 10% failure replays, सभी स्लाइसेज़ में stratified">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Golden dataset रचना — हर axis पर slice के अनुसार stratified</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">~500 cases के लिए तय। Bar segments proportional हैं। प्रति-slice coverage कठोर requirement है, aggregate ratio नहीं।</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">Production sample</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Adversarial</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">Expert edges</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Replays</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">stratified production traces · हर तिमाही refresh</text>
<text x="513" y="90" text-anchor="middle">jailbreaks · injection</text>
<text x="627" y="90" text-anchor="middle">domain edges · long tail</text>
<text x="722" y="90" text-anchor="middle">postmortem replays ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">हर case slice tags carry करता है — सूट हर combination को अलग-अलग score करता है</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">domain</tspan> · legal / med / general</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">intent</tspan> · how-to / fact / refuse</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">language</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">length</tspan> · short / mid / long</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">segment</tspan> · enterprise / SMB</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">retrieval</tspan> · grounded / open</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">tool-use</tspan> · 0 / 1 / multi-step</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">novelty</tspan> · seen / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">composition × slices = scoring grid</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">हर रिलीज़ पर प्रति slice scored — Spearman ρ ≥ 0.7 vs baseline, प्रति slice</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">कोई भी स्लाइस जो अपनी threshold पार करे, रिलीज़ को block करती है। Aggregate score केवल जानकारी के लिए है।</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">डायग्राम संरचनात्मक है। Stratification axes और प्रति-slice thresholds Divinci release manifest में हर product के अनुसार configured होते हैं। आंतरिक — हमारी अपनी deployments में परिभाषित।</figcaption>
</figure>

दो operational नियम जो हमने enforce करना सीखा है:

**तिमाही resample करें।** Production ट्रैफ़िक distributions ज़्यादातर टीमों के मापने से तेज़ी से shift होते हैं। हम production-sample bucket को पिछले 90 दिनों के ट्रैफ़िक के विरुद्ध हर तिमाही re-stratify करते हैं; यदि कोई स्लाइस ट्रैफ़िक के 5% से अधिक हो गई और golden dataset के 2% से नीचे थी, तो अगला रिलीज़ ship होने से पहले उसे backfill किया जाता है।

**हर postmortem एक case जोड़ता है।** एक रिग्रेशन जो प्रोडक्शन तक पहुँचा और पकड़ा नहीं गया, वह एक case है जो dataset से missing था। हम उसे postmortem के 48 घंटों के अंदर replays bucket में जोड़ देते हैं और उसे उस स्लाइस से tag करते हैं जिसने उसे surface किया।

## उपयोगकर्ताओं से पहले आप ड्रिफ्ट कैसे detect करते हैं?

ड्रिफ्ट के चार अलग-अलग प्रकार हैं, और एक रिग्रेशन सूट जो केवल आख़िरी को देखता है वह एक ऐसा सूट है जो ज़्यादातर रिग्रेशन miss कर देता है।

| Drift type | क्या हिलता है | Detection signal | कार्रवाई |
|---|---|---|---|
| **Quality drift** | एक निश्चित स्लाइस के लिए जज का स्कोर | प्रति-slice Spearman ρ vs baseline गिरता है | रिलीज़ block करें; [post 6 के tree](/hi/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) के अनुसार diagnose करें |
| **Coverage drift** | Production ट्रैफ़िक distribution vs golden dataset distribution | Slice proportions के बीच KL-divergence | Golden dataset resample करें |
| **Judge drift** | जज मॉडल का मनुष्यों के साथ agreement | एक frozen human-labelled audit set के विरुद्ध Spearman ρ | जज प्रॉम्प्ट recalibrate करें या जज बदलें |
| **Production drift** | उसी मॉडल पर live production scores vs offline scores | Production-trace replay score gap | Retrieval / preprocessing / runtime की जाँच करें |

Quality drift वह है जिसे ज़्यादातर सूट मापते हैं; अन्य तीन वहाँ हैं जहाँ शुक्रवार-दोपहर के रिग्रेशन आमतौर पर छिपते हैं। Divinci चारों को baseline manifest के विरुद्ध track करता है, हर PR पर प्रति-slice score breakdown surfaced के साथ, और एक साप्ताहिक judge-calibration job जो ड्रिफ्ट के जमा होने से पहले उसे flag करती है।

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="30-दिन का चार्ट दिखाता है कि aggregate task-completion स्कोर 0.87 पर flat रहता है जबकि medical-domain स्लाइस चुपचाप 0.88 से 0.74 तक गिरती है">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Semver Lie, visualised — task-completion स्कोर के 30 दिन</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Aggregate (गहरा हरा) flat रहता है। Medical स्लाइस (लाल) चुपचाप regress होती है। Aggregate gates कभी fire नहीं होते।</text>
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
<text x="640" y="268" text-anchor="middle">आज</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">aggregate gate threshold — 0.89</text>
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
<text x="664" y="46" font-weight="700" fill="#5a7a8f">legal slice</text>
<text x="722" y="46" fill="#5a7a8f">0.910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">aggregate</text>
<text x="722" y="72" fill="#2d5a4f">0.872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">general</text>
<text x="722" y="98" fill="#7a8a4a">0.863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">medical slice</text>
<text x="664" y="232" fill="#a04848">0.743 आज · breach ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">slice gate यहाँ fire होगा ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">आंतरिक Divinci slice nomenclature का उपयोग करके Tianpan Sigma postmortem pattern<sup><a href="#ref-1">[1]</a></sup> का stylised पुनर्निर्माण। विशिष्ट मान केवल उदाहरण के लिए हैं।</figcaption>
</figure>

## बहु-आयामी evaluation — एक साथ चार चीज़ें score करें, प्रति slice

एक single composite score चार scalar scores से बदतर signal है। हम चार dimensions पर gate करते हैं:

- **Task completion** — क्या response ने वास्तव में प्रश्न का उत्तर दिया, एक rubric के विरुद्ध कैलिब्रेटेड जज द्वारा scored। Slice-aware।
- **Faithfulness** — किसी भी response के लिए जिसने retrieved context का संदर्भ दिया, क्या हर claim उस context में grounded है। Hallucination यहाँ पहले दिखता है।
- **Safety** — refusal correctness, jailbreak resistance, PII / policy exposure। लगभग हमेशा ≥ 0.99 pass-rate पर gate करता है; safety एक hard wall है, soft trade-off नहीं।
- **Latency budget** — स्लाइस के SLA के अंदर p95। एक prompt change जिसने tokens-per-response को दोगुना कर दिया, वह एक रिग्रेशन है भले ही quality ऊपर गई हो।

प्रत्येक dimension की अपनी प्रति-slice baseline और अपनी प्रति-slice threshold है। हम कभी भी gate time पर उन्हें एक single weighted scalar में combine नहीं करते; हम उन्हें प्रति slice चार scores के रूप में surface करते हैं और जो भी पहले अपनी threshold पार करे उस पर block करते हैं। एक मॉडल जिसने medical स्लाइस पर 1 point faithfulness की क़ीमत पर 4 points task completion gained किए, वह अभी भी रिग्रेशन है।

## कस्टम LLM deployment को कौन से gates block करने चाहिए?

हम एक three-layer architecture चलाते हैं, प्रत्येक layer पाइपलाइन के एक अलग चरण को gate करती है ([चरण taxonomy के लिए post 1 देखें](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/))।

**Layer 1 — Smoke (हर commit, ~90 सेकंड)।** उच्चतम-impact स्लाइसेज़ से लिए गए बीस से तीस critical cases। पूरे सूट द्वारा compute खर्च करने से पहले catastrophic regressions पकड़ता है। यदि smoke fail होता है, बाकी नहीं चलता।

**Layer 2 — पूरा सूट (हर PR, ~12 मिनट)।** पूरा golden dataset, सभी चार dimensions पर प्रति slice scored। Baseline manifest के विरुद्ध slice-aware Spearman ρ। Threshold breach merge को block करता है। PR comment ठीक उन्हें list करता है कि किस dimension पर कौन सी स्लाइस कितनी हिली, पाँच example failing cases के साथ।

**Layer 3 — Baseline comparison (release candidates, ~25 मिनट)।** Candidate मॉडल को पिछले 14 दिनों के production traces के विरुद्ध replay किया जाता है — *closed-loop production-trace replay* जिसे हमने [post 1](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) में shipped किया था। वही कैलिब्रेटेड जज जो golden dataset को score करता है, replay outputs को भी score करता है। कोई भी स्लाइस जिसके replayed scores offline scores से अपनी threshold से ज़्यादा divergent हों, रिलीज़ को block करती है। यह layer वही है जो उस ड्रिफ्ट को पकड़ता है जिसके बारे में golden dataset को अभी पता नहीं है।

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="तीन-layer gate decision tree: हर commit पर smoke tests, हर PR पर पूरा सूट, release candidates पर production-trace replay">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">तीन-layer रिग्रेशन gate — हर block तेज़ी से fail होता है, हर layer गहराई जोड़ती है</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① Smoke · हर commit</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: 20–30 critical</text>
<text x="14" y="82">Wall-clock: ~90 s</text>
<text x="14" y="102">Dims: task + safety only</text>
<text x="14" y="122">Slices: top 3 by volume</text>
<text x="14" y="148" font-weight="600">Blocks:</text>
<text x="14" y="168">catastrophic failures</text>
<text x="14" y="186">malformed outputs</text>
<text x="14" y="204">safety wall breaches</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">fail-fast — पूरा सूट</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② पूरा सूट · हर PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: full ~500</text>
<text x="14" y="82">Wall-clock: ~12 min</text>
<text x="14" y="102">Dims: task / faith / safety / lat</text>
<text x="14" y="122">Slices: all stratified</text>
<text x="14" y="148" font-weight="600">Blocks:</text>
<text x="14" y="168">प्रति-slice ρ &lt; 0.7</text>
<text x="14" y="188">कोई भी slice metric thr से नीचे</text>
<text x="14" y="208">judge agreement &lt; 0.65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">PR comment लिस्ट करता है कौन सा</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ Replay · release candidates</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: 14d live traces</text>
<text x="14" y="82">Wall-clock: ~25 min</text>
<text x="14" y="102">Dims: सभी चार · slice-aware</text>
<text x="14" y="122">Source: production-trace store</text>
<text x="14" y="148" font-weight="600">Blocks:</text>
<text x="14" y="168">offline ↔ replay score gap</text>
<text x="14" y="188">उन slices में drift जो अभी golden</text>
<text x="14" y="206">dataset में नहीं हैं</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">rollout से पहले आख़िरी gate</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">तीनों layers एक ही baseline manifest के विरुद्ध score करती हैं — (model_sha, prompt_sha, retrieval_sha, judge_sha) — तो एक स्कोर के हिलने से पता चलता है <tspan font-weight="600" fill="#1e3a2b">कौन सा</tspan> dimension drift हुआ, सिर्फ़ यह नहीं कि <tspan font-weight="600" fill="#1e3a2b">कुछ</tspan> हिला।</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Wall-clock संख्याएँ आंतरिक हैं — Divinci के production CI runners पर लगभग 500 golden-dataset cases और लगभग 14 दिनों के production traces वाले एक प्रतिनिधि ग्राहक के लिए मापी गई।</figcaption>
</figure>

## अपने जज द्वारा उत्पन्न एक भी score पर भरोसा करने से पहले उसे कैलिब्रेट करें

LLM-as-judge ही है जो इस सब को कुछ सौ cases से आगे scale करता है। यह भी वही जगह है जहाँ एक रिग्रेशन सूट चुपचाप काम करना बंद कर देता है, क्योंकि जज की कोई बाध्यता नहीं है कि वह update होने पर या आपके data distribution के हिलने पर calibrated बना रहे।

हम हर judge prompt को कम-से-कम 100 cases के एक frozen human-labelled audit set के विरुद्ध कैलिब्रेट करते हैं जो उन्हीं स्लाइसेज़ में stratified होते हैं जैसा golden dataset, और हम कैलिब्रेशन को साप्ताहिक re-run करते हैं। हम जिस bar पर ship करते हैं वह है **Spearman ρ ≥ 0.7** human-rater median के विरुद्ध, **Cohen's κ ≥ 0.6** के साथ binary safety judgments पर। ये दोनों उस threshold से ऊपर हैं जहाँ MT-Bench-शैली के judges human raters को inter-human agreement के स्तर पर ट्रैक करते हुए दिखाए गए हैं<sup><a href="#ref-2">[2]</a></sup>।

जब साप्ताहिक कैलिब्रेशन threshold से नीचे गिरती है, तो जज स्वचालित रूप से retire हो जाता है और on-call eval engineer को page किया जाता है। रिलीज़ पाइपलाइन उन्हें ऐसे जज पर gate करने के बजाय candidates को खुला रखती है जो अब वह माप नहीं रहा जो वह पहले मापता था।

```bash
# Run the weekly judge calibration job
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

## Divinci differentiator — closed-loop production-trace replay

Layer 3 gate वह हिस्सा है जो ज़्यादातर रिग्रेशन सूट के पास नहीं है। प्रवाह वही प्रवाह है जिसे हमने post 1 में shipped किया था, रिग्रेशन टेस्टिंग के लिए एक specialisation के साथ: हर release candidate के offline golden dataset पर score की तुलना slice-by-slice 14-दिन की window के replayed production traces पर उसके score से की जाती है। Golden dataset यह मापता है कि हमने मॉडल से क्या उम्मीद की थी। Replay मापता है कि मॉडल पिछले हफ़्ते वास्तव में क्या करता।

जब वे दो scores प्रति-slice gap budget से ज़्यादा divergent होते हैं, तो रिलीज़ block हो जाती है। मिसमैच ही signal है: या तो golden dataset अब प्रतिनिधि नहीं है (coverage drift), या candidate production preprocessing और retrieval द्वारा आकारित traces पर अलग व्यवहार करता है (production drift)। किसी भी तरह, आप उपयोगकर्ताओं से पहले पता लगा लेते हैं।

जज जो offline run को score करता है वही जज है जो replay run को score करता है। Audit log दोनों score sets, दोनों judge versions, replay किए गए trace IDs, और वह gap जो block को fire किया, सब रिकॉर्ड करता है। Gap ही सबसे उपयोगी diagnostic signal है जो हमारे पास है, और यही [post 6 diagnostic tree](/hi/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) को आगे जिसे सौंपा जाता है उसे दिया जाता है।

## Golden dataset को vIndex receipt से anchor करें

सूट में हर score निरर्थक है यदि आप उसे बाद में पुन: उत्पन्न नहीं कर सकते। हम हर रिलीज़ पर golden dataset को hash करते हैं और उस hash को model SHA, prompt SHA, judge SHA, और कैलिब्रेशन रिकॉर्ड के साथ एक vIndex receipt में chain करते हैं। रसीद externally anchorable है — auditors छह महीने बाद हमारे exact regression run को replay कर सकते हैं और उन scores को verify कर सकते हैं जिनका हमने दावा किया।

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
  "verifiable_at": "https://vIndex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**Open-weights चेतावनी।** ऊपर की रसीद वज़न provenance तभी carry करती है जब मॉडल open-weights हो — vIndex वास्तविक वज़न bytes को anchor करता है। Closed-API मॉडल backings (OpenAI / Anthropic / Google managed models) के लिए, रसीद अभी भी decision chain carry करती है — हर gate score, हर judge result, कैलिब्रेशन रिकॉर्ड — लेकिन weight field खाली है, और आप मॉडल artefact को स्वतंत्र रूप से verify नहीं कर सकते। हम यह रसीद में और [compliance documentation](/hi/compliance/) में कहते हैं ताकि auditors को ग़लत impression न मिले। पूरी vIndex chain से सबसे ज़्यादा लाभ वही रिलीज़ें पाती हैं जहाँ आप weights को नियंत्रित करते हैं।

## एक चार-चरणीय implementation timeline जो हमने वास्तव में shipped की है

जो टीमें पहले ही हफ़्ते में पूरा architecture ship करने की कोशिश करती हैं, वे tooling पर अटक जाती हैं। नीचे का क्रम वही क्रम है जो काम करता है।

**Phase 1 — Baseline (हफ़्ता 1)।** पिछले 30 दिनों के production traces का एक stratified sample खींचें। दो engineers के पास 100-100 cases पर task completion को hand-label कराएँ। Inter-rater agreement की गणना करें (लक्ष्य Cohen's κ ≥ 0.6)। आपको जो संख्या मिलती है वह आपकी शुरुआती human-baseline है; बाकी सब इसके विरुद्ध कैलिब्रेट होता है।

**Phase 2 — Harness (हफ़्ते 2–3)।** 100-case dataset पर evaluation harness खड़ा करें। अपने human labels के विरुद्ध एक कैलिब्रेटेड जज जोड़ें। Verify करें कि harness human scores को ρ ≥ 0.7 के भीतर पुन: उत्पन्न करता है। ज़्यादातर टीमें खोजती हैं कि उनका पहला judge prompt इसमें fail होता है और उसे दो बार re-write करती हैं — यह सामान्य है।

**Phase 3 — Gates (हफ़्ते 3–4)।** Harness को CI में एक warning के रूप में wire करें, block के रूप में नहीं। दो हफ़्ते उसे देखें। False-positive rates देखकर आप जो thresholds खोजते हैं, वही thresholds टिकते हैं। केवल तब blocking में promote करें जब false-positive rate 5% से नीचे हो।

**Phase 4 — Replay loop (निरंतर)।** एक बार gates विश्वसनीय रूप से block कर रहे हों, production-trace replay layer enable करें। यहीं slice-coverage gap surface होता है, और यहीं हर postmortem cases को golden dataset में वापस जोड़ना शुरू करता है।

## यह क्या हल नहीं करता

तीन ईमानदार सीमाएँ, जिस तरह हमने इस सीरीज़ के हर पोस्ट में framed किया है।

1. **सूट drift अंतहीन काम है।** रिग्रेशन टेस्टिंग infrastructure है, project नहीं। Golden dataset को हर तिमाही re-stratify करना होगा, judge को हर हफ़्ते re-calibrate करना होगा, threshold budgets को हर postmortem पर re-tune करना होगा। इसका कोई संस्करण नहीं है जिसमें आप एक सूट ship करें और चले जाएँ।
2. **एक पूरी तरह कैलिब्रेटेड जज भी एक मॉडल है।** Human raters के विरुद्ध Spearman ρ = 0.74 का अर्थ है कि लगभग एक चौथाई judge calls human median से असहमत हैं। वह residual असहमति हर score पर noise floor है। हम इसे हर रिलीज़ रिपोर्ट में स्पष्ट रूप से surface करते हैं; जो टीमें भूल जाती हैं कि यह वहाँ है, वे अंततः इससे चौंकेंगी।
3. **Closed-API backings सीमित करते हैं कि आप कितना verify कर सकते हैं।** Closed-API मॉडल के साथ, रिग्रेशन सूट व्यवहार मापता है लेकिन वज़न provenance verify नहीं कर सकता। यदि आपको पूर्ण reproducibility चाहिए — regulated industries, audited deployments — तो trade-off मॉडल चुनाव पर है, सूट पर नहीं।

## आगे क्या

पोस्ट 8, इस सीरीज़ का आख़िरी, CI के अंदर loop को पूरा करता है। जहाँ यह पोस्ट और post 5 इस बारे में थे कि gates पर क्या चलता है, अगला उस CI layer के बारे में है जो उन candidates को उत्पन्न करता है जिन्हें gates score करते हैं — pre-merge evaluation, prompt templates के लिए contract tests, और 12-मिनट के eval सूट के लिए CI fleet का आकार बजट bankrupt किए बिना कैसे तय करें। यह engineering layer है जिस पर हमने अब तक जो कुछ लिखा है वह सब टिका है।

## FAQ

**LLM evaluation और LLM regression testing में क्या अंतर है?**

Evaluation मापता है कि क्या मॉडल एक समय बिंदु पर एक quality bar को पूरा करता है, एक absolute rubric के विरुद्ध। Regression testing मापता है कि क्या candidate एक frozen baseline की तरह व्यवहार करता है, प्रति slice, कई dimensions में। Baseline ही उसे regression testing बनाता है — Divinci दोनों ship करता है, और regression mode (model_sha, prompt_sha, judge_sha, dataset_sha) को pin करता है ताकि एक हिला हुआ score पहचाने कि कौन सा input हिला।

**एक golden dataset में कितने cases होने चाहिए?**

जितने आप सोचते हैं उससे कम, और जितना आप सोचते हैं उससे बेहतर stratified। हमने पाँच अच्छी तरह परिभाषित स्लाइसेज़ पर 200 cases के साथ उपयोगी regression coverage ship की है और 5,000-case datasets देखे हैं जिन्होंने वह सब कुछ miss कर दिया जो मायने रखता था क्योंकि वे unstratified थे। 200 stratified से शुरू करें, फिर replay bucket को postmortems से case-by-case बढ़ाएँ।

**क्या मुझे human reviewers या LLM-as-judge का उपयोग करना चाहिए?**

दोनों, जजों को मनुष्यों के साथ कैलिब्रेट करते हुए। मनुष्य उस volume के साथ नहीं चल सकते जिसे एक release-cycle CI gate score करने की ज़रूरत है। जज volume भरता है, मनुष्य जज को कैलिब्रेट करते हैं — साप्ताहिक रूप से Spearman ρ ≥ 0.7 के साथ मापा गया। दोनों में से कोई एक अकेले failure mode है।

**मैं non-deterministic outputs के लिए कैसे test करूँ?**

Distribution को score करें, string को नहीं। एक ऐसी rubric के साथ score करें जिसे जज phrasings के पार लागू कर सके, और हर input को temperature > 0 पर तीन से पाँच बार चलाएँ ताकि slice-aware score एक single sample के बजाय completions के distribution पर हो। केवल उन cases के लिए temperature कसें जिन्हें वास्तव में deterministic output की आवश्यकता है (structured-output tool calls, classification)।

**पहले CI quality gate के लिए मुझे किन metrics को प्राथमिकता देनी चाहिए?**

Task completion और एक safety gate। दोनों प्रति-slice। पहले दो कैलिब्रेटेड होने से पहले अधिक dimensions जोड़ने से noise उत्पन्न होता है; जो टीमें अधिक ship करती हैं वे आमतौर पर noise पर gate करने में समाप्त होती हैं। Retrieval ON करने पर faithfulness आगे जोड़ें; पहले दो स्थिर होने पर latency जोड़ें।

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 April 2026. The named 2026 failure mode for slice-aware regression analysis; aggregate scores hold flat while a low-volume slice silently regresses.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Empirical evidence that strong LLM judges agree with human raters at roughly inter-human-agreement levels (≈ 80%) on open-ended tasks, with reported failure modes that calibrate-against-humans audits are designed to detect.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. The foundational result on catastrophic forgetting in fine-tuned neural networks — why a fine-tuned custom LLM has to be regression-tested for general capability loss, not just gain on the target task.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> The closed-API contrast: gates on infrastructure metrics (latency, errors, CPU) rather than on per-slice semantic quality.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. The rank-correlation coefficient that anchors the slice-aware gate — robust to scoring-scale drift in the judge, which is the property we needed.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> The cross-industry baseline for "how often deploys cause incidents" and "how fast you recover." Regression suites that block at the gate move the first metric down; instant rollback ([post 5](/hi/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) moves the second.
  </li>
</ol>
