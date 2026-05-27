+++
title = "कस्टम LLM QA विफलताओं का निदान 7 चरणों में कैसे करें"
description = "अधिकांश 'QA विफलताएँ' मॉडल विफलताएँ नहीं हैं — वे eval-कवरेज अंतराल, judge गलत-कैलिब्रेशन, या training-serving skew हैं। एक 7-चरण निदान जो मॉडल को दोष देने से पहले छह गैर-मॉडल कारणों को बाहर करता है।"
date = 2026-05-31T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["QA", "Diagnostics", "Postmortems", "LLM Ops", "Evaluation", "Debugging"]

[extra]
author = "माइक मूरिंग"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-diagnose-custom-llm-qa-failures-in-7-steps-veo31.webm"
hero_video_poster = "/images/how-to-diagnose-custom-llm-qa-failures-in-7-steps-hero-poster.webp"
reading_time = 11
summary = "जब एक कस्टम LLM पर QA अलर्ट सक्रिय होता है, तो स्वाभाविक प्रतिक्रिया मॉडल को दोष देना है। हमने जो rollouts चलाए हैं, उनमें मॉडल लगभग सात में से एक बार सही उत्तर होता है। अन्य छह बार, बग eval में, judge में, prompt SHA में, preprocessing pipeline में, dataset version में, या retrieval index में होता है। यह पोस्ट वह डायग्नोस्टिक ट्री है जिसे हम वास्तव में चलाते हैं — क्रम में, सटीक API कॉल के साथ जो प्रत्येक शाखा का उत्तर देता है।"
+++

*रिलीज़ साइकल से नोट्स — भाग VI*

---

एक scored-QA सूट ने एक ग्राहक के मेडिकल-Q&A मॉडल को फ़्लैग करना शुरू किया। हेडलाइन संख्या — सभी slices में समग्र गुणवत्ता — रातोंरात 6 अंक गिर गई। टीम ने मॉडल को डिबग करने में दो दिन बिताए। उन्होंने fine-tunes फिर से चलाए। उन्होंने पिछले रिलीज़ पर रोलबैक किया। संख्याएँ नहीं बदलीं।

तीसरे दिन की सुबह, किसी ने देखा कि eval सूट उसी रात अपडेट किया गया था जब regression शुरू हुआ। तीन नए pediatric-dosage prompts test set में जोड़े गए थे, और मॉडल ने training में कभी pediatric dosage नहीं देखा था। "QA विफलता" मॉडल regression नहीं थी। यह एक slice-कवरेज इवेंट था: eval ने कुछ ऐसा पूछना शुरू किया जो मॉडल को कभी जानना नहीं था।

हमारे ग्राहक rollouts में, यह प्रमुख पैटर्न है। **एक "QA विफलता" अलर्ट लक्षण है। कारण लगभग सात में से एक बार मॉडल होता है।** अन्य छह बार, बग कहीं upstream होता है: eval डिज़ाइन में, judge कैलिब्रेशन में, prompt SHA में, preprocessing pipeline में, dataset version में, या retrieval index में। उन प्रत्येक प्रकार के बग अलर्ट से समान दिखते हैं — एक संख्या नीचे गई — लेकिन उनका पूरी तरह से अलग fix होता है।

यह पोस्ट वह डायग्नोस्टिक ट्री है जिसे हम अलर्ट सक्रिय होने पर क्रम में चलाते हैं। छह चरण जो गैर-मॉडल कारणों को बाहर करते हैं, इससे पहले कि सातवाँ चरण मॉडल पर ही विचार करे। प्रत्येक चरण में एक concrete API कॉल या query है जो इसका उत्तर देता है। जब तक आप छह पूरे कर लेते हैं, तब तक आप या तो ठीक से जानते हैं कि क्या ठीक करना है, या आपने मॉडल को देखने का अधिकार अर्जित कर लिया है।

## निर्णय ट्री

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="QA विफलता अलर्ट के लिए डायग्नोस्टिक निर्णय ट्री। चरण 1 पूछता है कि क्या eval इस slice को कवर करता है (यदि नहीं, तो अलर्ट eval-कवरेज अंतराल है)। चरण 2 पूछता है कि क्या judge इस slice पर मनुष्यों के विरुद्ध कैलिब्रेटेड है (यदि नहीं, तो अलर्ट judge गलत-कैलिब्रेशन है)। चरण 3 पूछता है कि क्या prompt template SHA production से मेल खाता है (यदि नहीं, तो अलर्ट prompt drift है)। चरण 4 पूछता है कि क्या preprocessing production से मेल खाता है (यदि नहीं, तो अलर्ट training-serving skew है)। चरण 5 पूछता है कि क्या dataset SHA production से मेल खाता है (यदि नहीं, तो अलर्ट dataset drift है)। चरण 6 पूछता है कि क्या retrieval index version production से मेल खाता है (यदि नहीं, तो अलर्ट RAG-index drift है)। केवल जब सभी छह गैर-मॉडल कारण को बाहर करते हैं, तब चरण 7 निष्कर्ष निकालता है कि यह वास्तव में per-slice मॉडल regression है।">
<title>7-चरण डायग्नोस्टिक ट्री</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">जब QA अलर्ट सक्रिय हो, नीचे चलें — अंदर नहीं</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">छह चरण गैर-मॉडल कारणों को बाहर करते हैं। केवल सातवाँ मॉडल को दोष देता है।</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  QA अलर्ट सक्रिय</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">क्या eval इस slice को कवर करता है?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ यदि नहीं: eval-कवरेज अंतराल। सूट अपडेट करें, पुनः परीक्षण करें।</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">क्या judge इस slice पर मनुष्यों के लिए कैलिब्रेटेड है?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ यदि नहीं: judge गलत-कैलिब्रेशन। ρ पुनः कैलिब्रेट करें। पुनः eval करें।</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">क्या prompt template SHA production से मेल खाता है?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ यदि नहीं: prompt drift। manifest फिर से रजिस्टर करें।</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">क्या preprocessing pipeline production से मेल खाता है?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ यदि नहीं: training-serving skew। preprocess SHA बाँधें।</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">क्या dataset SHA production से मेल खाता है?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ यदि नहीं: dataset drift। सही SHA के साथ फिर से रजिस्टर करें।</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">Retrieval index SHA मेल खाता है?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ यदि नहीं: RAG-index drift।</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">यदि सभी 6 पास हों:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">वास्तविक per-slice मॉडल regression।</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">कमिट। रोलबैक। पुनः ट्रेन।</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">अनुभवजन्य रूप से मॉडल</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">7 में से लगभग 1 अलर्ट का</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">सही उत्तर होता है।</text>
</svg>
</figure>

ट्री क्रमिक है क्योंकि चरण सस्ते-से-महंगे हैं। चरण 1 eval सूट का एक `git diff` है; चरण 7 एक fine-tune चक्र है। आप छह सस्ती जाँचों में से प्रत्येक पर दस मिनट खर्च करना चाहते हैं, इससे पहले कि महंगी पर एक सप्ताह खर्च करें।

## चरण 1 — क्या eval ने इस slice को कवर किया?

**लक्षण.** समग्र गुणवत्ता गिरती है, लेकिन per-slice ब्रेकडाउन दिखाता है कि एक slice गिर रहा है जबकि अन्य स्थिर हैं। या — अधिक भ्रामक रूप से — *हर* slice थोड़ा गिरता है, सभी समान मात्रा में।

**निदान.** eval सूट manifest SHA को पिछले रिलीज़ के साथ diff करें। यदि eval सूट बदला और आपने मॉडल नहीं बदला, तो regression eval में है, मॉडल में नहीं।

```bash
# रिलीज़ के बीच eval-suite manifest SHA की तुलना करें
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# अलग? आपका eval बदला। ऑडिट करें कि क्या जोड़ा गया।
```

**Fix.** या तो eval-सूट परिवर्तन को वापस करें (यदि यह अनजाने में था), या नए eval से मेल खाने के लिए training कवरेज बढ़ाएँ (यदि नया slice एक वास्तविक production चिंता है)। eval कवरेज समस्या के लिए मॉडल regression fix शिप न करें — आप मॉडल को उस चीज़ पर बदतर बना देंगे जो वह वास्तव में अच्छा करता था।

**यह हमारे pipeline में कहाँ छिपता है.** [Stage 1 — Register](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) eval-सूट SHA को रिलीज़ manifest में बाँधता है। ऊपर का निदान बस दो manifests को diff करना है। बग ने मेडिकल-Q&A टीम को दो दिन क्यों लिए, इसका कारण यह है कि उनके पास manifest-स्तरीय diff नहीं था — वे model checkpoints की तुलना कर रहे थे, रिलीज़ manifests की नहीं।

## चरण 2 — क्या judge इस slice पर मनुष्यों के लिए कैलिब्रेटेड है?

**लक्षण.** एक slice जो eval सूट के लिए *नया* है, खराब स्कोर करता है, लेकिन उस slice पर मॉडल के outputs की मानवीय समीक्षा उन्हें ठीक मानती है। judge सोचता है कि मॉडल विफल हो रहा है; मनुष्य नहीं सोचते।

**निदान.** विफल slice पर LLM judge की रेटिंग और एक छोटे मानव-रेटेड नमूने (50 आइटम) के बीच Spearman ρ की गणना करें। यदि ρ &lt; 0.4, तो judge इस slice पर वह *नहीं माप रहा* है जो मनुष्य मापते हैं।

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**Fix.** या तो इस slice के लिए एक अलग judge मॉडल चुनें, या एक arbiter के साथ chain-of-judges का उपयोग करें। MT-Bench<sup><a href="#ref-1">[1]</a></sup> दिखाता है कि GPT-4-as-judge औसतन मनुष्यों के साथ &gt;80% सहमत होता है लेकिन per-category variance 86% (coding) से 36–44% (writing/humanities) तक होती है। variance वह संचालन संख्या है; "औसत पर अच्छा" उन slices को छुपाता है जहाँ judge गलत है।

**यह हमारे pipeline में कहाँ छिपता है.** [Stage 2 — Gate](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) प्रति slice एक कैलिब्रेटेड judge की माँग करता है। [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/) पोस्ट प्रक्रिया का दस्तावेज़ीकरण करती है। यदि slice को कैलिब्रेशन चरण के बिना eval में जोड़ा गया था, तो आपके पास संरचनात्मक रूप से अविश्वसनीय gate है।

## चरण 3 — क्या prompt template SHA production से मेल खाता है?

**लक्षण.** गुणवत्ता गिरती है लेकिन model_ref और dataset_ref अपरिवर्तित हैं। training के बारे में कुछ नहीं बदला। मॉडल वही मॉडल है। और फिर भी।

**निदान.** विफल रिलीज़ manifest में `prompt_template_ref` SHA की पिछले रिलीज़ के साथ तुलना करें। एक system prompt में 38-वर्ण का संपादन जो "संक्षिप्तता में सुधार करता है" downstream behavior को पूरे retrain से अधिक बदल सकता है।

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# अलग? diff निकालें। ध्यान से देखें।
```

**Fix.** prompts को code के रूप में मानें। [10 release failures पोस्ट](/hi/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) dashboard-संपादन विफलता मोड को कवर करती है — Tianpan का *Semver Lie* postmortem<sup><a href="#ref-2">[2]</a></sup> इसे 2026 के प्रमुख विफलता पैटर्न के रूप में नाम देता है। यदि आप साबित कर सकते हैं कि prompt बदला, तो आपने अपना बग खोज लिया।

## चरण 4 — क्या preprocessing pipeline production से मेल खाता है?

**लक्षण.** मॉडल स्थानीय रूप से eval पास करता है। वही मॉडल production में वही eval विफल करता है। वही model_ref, वही prompt, वही dataset।

**निदान.** production manifest से `preprocessing_ref` SHA निकालें और सत्यापित करें कि eval उसी के साथ चला। क्लासिक मामला: training whitespace को सामान्यीकृत करता है और lowercase करता है; production नहीं करता। eval production preprocessing के माध्यम से चला; सब कुछ जाँचा गया। जब तक किसी ने preprocessing को केवल एक तरफ अपडेट नहीं किया।

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# उस preprocessing से तुलना करें जिसे आपका training/eval harness वास्तव में उपयोग करता है।
```

**Fix.** preprocessing को versioned artifact के रूप में containerize करें। इसे manifest से रेफरेंस करें। deploy करने से इनकार करें यदि gate का preprocessing SHA production से अलग है।

## चरण 5 — क्या dataset SHA production से मेल खाता है?

**लक्षण.** विफल रिलीज़ से Gate-eval scores उसी मॉडल के एक दिन पहले के gate-eval scores से अलग हैं।

**निदान.** दो रिलीज़ के बीच `dataset_version` फ़ील्ड को diff करें। eval सूट का नाम वही रहा, लेकिन dataset content अपडेट और फिर से tag किया गया। वही नाम, अलग SHA, अलग scores।

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**Fix.** अपने datasets को content-hash करें। dataset का नाम version नहीं है; SHA है।

## चरण 6 — क्या retrieval index SHA production से मेल खाता है?

**लक्षण.** केवल RAG workloads के लिए। उन प्रश्नों पर गुणवत्ता गिरती है जो retrieved context पर निर्भर करते हैं। प्रत्यक्ष-उत्तर प्रश्न अपरिवर्तित हैं।

**निदान.** manifest से `retrieval_index_ref` SHA निकालें। gate evaluation के retrieval-index के साथ तुलना करें। RAG index रात भर अपडेट हुआ (एक नया ingestion रन); gate evaluation ने एक पुराना retrieval cache किया; production canary ने नया उपयोग किया।

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**Fix.** retrieval index SHA को manifest में बाँधें, ठीक उसी तरह जैसे हम preprocessing बाँधते हैं। [AutoRAG का](/hi/autorag/) automated index rotation cadence इसे विशेष रूप से जाँचने योग्य बनाता है — index *आप पर अपडेट होगा* चाहे आपने इसे अधिकृत किया हो या नहीं, यदि आप इसे pin नहीं कर रहे हैं।

## चरण 7 — मॉडल स्वयं, अंततः

छह चरण पूरे हो गए। eval slice को कवर करता है। judge कैलिब्रेटेड है। prompt SHA मेल खाता है। preprocessing मेल खाता है। dataset मेल खाता है। retrieval index मेल खाता है।

अब — और केवल अब — आपने मॉडल को देखने का अधिकार अर्जित किया है।

इस चरण का निदान पिछले रिलीज़ के विरुद्ध एक per-slice Spearman तुलना है, जिसमें दोनों रिलीज़ का मूल्यांकन *समान* manifest-pinned dataset, preprocessing, और retrieval के विरुद्ध किया जाता है। आपके द्वारा उत्पन्न संख्या एक स्वच्छ संकेत है: कोई upstream confounders नहीं के साथ एक वास्तविक per-slice regression।

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

यदि delta एक वास्तविक regression की पुष्टि करता है: [auto-rollback](/hi/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) सक्रिय होता है (यदि आपने पहले से मैन्युअल रूप से इसे invoke नहीं किया है), और विफल मॉडल को एक विस्तारित slice-कवरेज corpus के विरुद्ध फिर से training दी जाती है। यदि इस रिलीज़ को promote करने वाले gate ने पहले स्थान पर slice को miss किया, तो [gate भी बग है](/hi/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — आपके रिलीज़ pipeline से capability 4 गायब है।

## वितरण वास्तव में कैसा दिखता है

पहले की "7 में से 1" फ्रेमिंग एक अलंकारिक उपकरण नहीं थी। यह मोटे तौर पर वह वितरण है जो हम ग्राहक rollouts में देखते हैं। हर सात QA अलर्ट में से:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="QA अलर्ट के लिए root-cause वितरण का पाई चार्ट। Eval कवरेज अंतराल लगभग 32 प्रतिशत के लिए जिम्मेदार है। Judge गलत-कैलिब्रेशन लगभग 18 प्रतिशत। Prompt drift लगभग 16 प्रतिशत। Preprocessing skew लगभग 12 प्रतिशत। Dataset drift लगभग 7 प्रतिशत। RAG index drift लगभग 5 प्रतिशत। वास्तविक मॉडल regression लगभग 10 प्रतिशत। ग्राहक rollouts में आंतरिक अवलोकन; नियंत्रित benchmark से नहीं।">
<title>QA अलर्ट root cause का वितरण</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">बग वास्तव में कहाँ था — ग्राहक rollouts में</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">आंतरिक अवलोकन, नियंत्रित benchmark नहीं। मॉडल सात अलर्ट में लगभग एक बार सही उत्तर होता है।</text>
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
<text x="522" y="112" font-weight="600">1.  Eval कवरेज अंतराल</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  Judge गलत-कैलिब्रेशन</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  Prompt drift</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  Preprocessing skew</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  वास्तविक मॉडल regression</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  Dataset drift</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  RAG index drift</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">केवल चरण 1+2 ही आधे अलर्ट के लिए जिम्मेदार हैं। मॉडल पर चलने से पहले eval पर चलें।</text>
</svg>
</figure>

दो सबसे बड़े slices *eval कवरेज अंतराल* और *judge गलत-कैलिब्रेशन* हैं। एक साथ वे QA अलर्ट के आधे के लिए जिम्मेदार हैं। न तो मॉडल समस्या है। दोनों इस बारे में समस्याएँ हैं कि आप मॉडल को कैसे मापते हैं।

## यह क्या नहीं हल करता

तीन ईमानदार सीमाएँ:

**वितरण हमारा है, आपका नहीं.** ऊपर के प्रतिशत हमारे ग्राहक cohort और हमारे pipeline के tooling से हैं। यदि आप एक अलग प्रकार का workload चलाते हैं — heavy multi-modal, heavy agent-orchestrated, heavy single-shot generative — आपका वितरण अलग दिखेगा। निदान क्रम अभी भी रखना चाहिए; प्रत्येक चरण के पीछे की संख्याएँ नहीं।

**चरण 1 का "eval कवरेज अंतराल" ठीक करना सबसे कठिन है.** अपने training corpus में लापता slice जोड़ना, उसके लिए एक कैलिब्रेटेड judge बनाना, और canary को फिर से चलाना स्वयं एक बहु-सप्ताह की परियोजना है। निदान तेज़ है; उपचार नहीं।

**एक वास्तविक regression एक गैर-मॉडल बग पर सवारी कर सकता है.** वे मामले जहाँ आपके पास *दोनों* एक prompt drift और एक वास्तविक मॉडल regression है, सबसे खराब हैं, क्योंकि चरण 3 prompt drift पाता है, आप इसे ठीक करते हैं, और अलर्ट फिर से सक्रिय हो जाता है। इस पोस्ट में निदान क्रम उन्हें संभालता है लेकिन elapsed समय जोड़ता है। "बग एक साथ दो जगहों पर था" के लिए कोई shortcut नहीं है।

## FAQ

### मेरा LLM समान prompts के लिए अलग outputs क्यों उत्पन्न करता है?

Prompt sensitivity वास्तविक है, लेकिन यह हमेशा QA अलर्ट का *कारण* नहीं होता — कभी-कभी यह एक upstream बग का *लक्षण* होता है। निदान चलाएँ। यदि prompt template SHA मेल खाता है और preprocessing मेल खाता है और dataset मेल खाता है, तो हाँ — मॉडल में इस slice पर wide variance है और आपको एक अधिक deterministic decoding path या एक अलग judge की आवश्यकता है। यदि upstream कुछ बदला, तो पहले उसे ठीक करें।

### आपको अपने LLM benchmarks का कितनी बार पुनर्मूल्यांकन करना चाहिए?

जब भी एक production slice का traffic आकार सार्थक रूप से बदलता है, benchmark *सामग्री* का पुनर्मूल्यांकन करें। benchmark के *judge कैलिब्रेशन* का हर तिमाही पुनर्मूल्यांकन करें, कम से कम — judge मॉडल आपकी सोच से तेज़ drift करते हैं। झूठे QA अलर्ट का सबसे बड़ा स्रोत एक benchmark है जिसे अंतिम बार 18 महीने पहले validate किया गया था और अब वह कुछ माप रहा है जो आपका production अब नहीं करता।

### कस्टम language models में hallucinations का क्या कारण होता है?

Hallucinations के कई upstream कारण हैं — retrieval विफलताएँ (ऊपर ट्री में चरण 6), training-कवरेज अंतराल (चरण 1, अप्रत्यक्ष रूप से), और decoding-path मुद्दे (चरण 7 में एक वास्तविक मॉडल चिंता)। [AutoRAG](/hi/autorag/) रिलीज़ manifest में retrieval index को बाँधकर और हर रिलीज़ पर फिर से pin करके retrieval-side कारणों को संबोधित करता है। अन्य दो को मॉडल के upstream pipeline-स्तरीय fixes की आवश्यकता है।

### आप कैसे जानते हैं कि आपका training data समस्या है?

यदि विफल रिलीज़ में dataset SHA पिछले अच्छे रिलीज़ में dataset SHA से मेल खाता है (ट्री का चरण 5), तो data *तत्काल* कारण नहीं है। यदि वे अलग हैं, तो आपने इसे पाया है। कठिन प्रश्न — "क्या dataset हमारे production slice कवरेज के लिए *पूर्ण* है?" — वह है जो चरण 1 परीक्षण करता है। एक dataset जो eval के लिए पूर्ण है लेकिन production traffic के लिए अधूरा है, एक slice-कवरेज समस्या है।

### क्या आप पूरे मॉडल को retrain किए बिना QA विफलताओं को ठीक कर सकते हैं?

हाँ — सात में से छह बार, fix retrain नहीं है। ट्री में चरण 1–6 में fixes हैं जो मॉडल को नहीं छूते: eval अपडेट करें, judge को पुनः कैलिब्रेट करें, prompt SHA फिर से रजिस्टर करें, preprocessing ठीक करें, dataset फिर से pin करें, या retrieval index फिर से pin करें। Retraining चरण 7 है, सबसे महंगा fix, वास्तविक मॉडल regressions के लिए आरक्षित। रिलीज़ pipeline का [audit trail](/hi/compliance/) आपको उसी provenance discipline के साथ ये upstream fixes करने देता है जिसे आप मॉडल परिवर्तन के लिए उपयोग करते।

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement with per-category variance from coding (86%) down to writing (36–44%). चरण 2 के लिए anchor — क्यों judge कैलिब्रेशन को प्रति slice मापा जाना चाहिए, न कि प्रकाशित हेडलाइन संख्या से माना जाना चाहिए।
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (अप्रैल 2026)। 2026 का प्रमुख विफलता-मोड लेख। dashboard-संपादन prompt drift को production LLM घटनाओं के सबसे अधिक उद्धृत कारण के रूप में नाम देता है। चरण 3 के लिए anchor।
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — Measure function.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>। "Measure" फ़ंक्शन स्पष्ट रूप से benchmark-validity और evaluation-कवरेज को governance के हिस्से के रूप में कवर करता है, न कि एक अलग इंजीनियरिंग चिंता के रूप में। eval डिज़ाइन को पहले डायग्नोस्टिक चरण के रूप में मानने के लिए संस्थागत anchor के रूप में उद्धृत।
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — retrieval-augmented generation evaluation.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217)। RAG-side मूल्यांकन के लिए reference framework। चरण 6 के लिए anchor — retrieval विफलताओं को generation विफलताओं से अलग करने के लिए एक RAG-aware eval discipline की आवश्यकता होती है।
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>आंतरिक — ग्राहक rollouts में root-cause वितरण.</strong> पाई चार्ट में प्रतिशत Divinci ग्राहक rollouts में हमारे आंतरिक अवलोकन हैं, न कि एक नियंत्रित benchmark से। आपका वितरण workload प्रकार, fine-tune cadence, और टीम अनुशासन के अनुसार भिन्न होगा। सापेक्ष क्रम (चरण 1–2 हावी) उस cohort में स्थिर है जिसे हमने मापा है; सटीक प्रतिशत आपके अपने data के बिना आपके पर्यावरण में portable नहीं हैं।
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>चार-चरण रिलीज़ pipeline.</strong> <a href="/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>। इस पोस्ट में प्रत्येक डायग्नोस्टिक चरण Stage 1 — Register पर बाँधे गए एक manifest फ़ील्ड से मेल खाता है। upstream manifest discipline के बिना, निदान अपनी पकड़ खो देता है; आप जो नहीं बाँधा उसका diff नहीं कर सकते।
</li>
</ol>

---

*इस श्रृंखला में अगला:* **Automated Regression Testing for Custom LLMs in 2026।** यह पोस्ट QA अलर्ट सक्रिय होने के बाद निदान के बारे में है। अगला regression-testing अनुशासन के बारे में है जिसने पहले स्थान पर अलर्ट को संचालित किया — eval में क्या रखें, इसे ईमानदार कैसे रखें, और जब regression test आपके judge से असहमत होने लगे तो क्या करें।
