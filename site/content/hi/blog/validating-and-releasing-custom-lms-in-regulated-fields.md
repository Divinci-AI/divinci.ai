+++
title = "विनियमित क्षेत्रों में Custom LMs का सत्यापन और रिलीज़"
description = "EU AI Act, GDPR अनुच्छेद 17, HIPAA, NIST AI RMF — LLM रिलीज़ pipeline पर capability-दर-capability mapped। जहाँ open और closed weights विभाजित होते हैं।"
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vindex"]

[extra]
author = "माइक मूरिंग"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "Custom language models के लिए regulated-industry compliance एक ही अक्ष पर साफ़-साफ़ बँटती है: open-weights बनाम closed-API। open-weights backings के लिए, आप एक vindex weight-attestation ship कर सकते हैं जो GDPR Article 17 के verifiable erasure को cryptographically संतुष्ट करता है। closed-API backings के लिए, वही receipt decision chain को cover करता है पर weight provenance का दावा नहीं कर सकता — और regulator को वह अंतर receipt में ही मिल जाता है। यह post चार regulatory frameworks (EU AI Act, GDPR, HIPAA, NIST AI RMF) को हमारे चार pipeline stages पर map करता है, और वास्तविक receipt format दिखाता है।"
+++

*Notes from the Release Cycle — भाग IV*

---

एक general counsel engineering review में आती हैं। उनका एक सवाल है: *"अगर कल EU AI Act Article 17 का right-to-erasure request आता है जिसमें कहा गया हो कि हमारा model किसी विशिष्ट patient के बारे में जो भी तथ्य सीखा है, उसे हटाएँ — तो क्या हम सिद्ध कर सकते हैं कि हमने ऐसा किया?"*

अधिकांश teams जो ईमानदार उत्तर देती हैं वह है: "हम model को भूलने के लिए fine-tune कर सकते हैं। हम आपको training run दिखा सकते हैं। पर हम सिद्ध नहीं कर सकते कि जानकारी संरचनात्मक रूप से चली गई है, क्योंकि वह सही adversarial prompt के तहत फिर से उभर सकती है।"

यह compliance का उत्तर नहीं है। यह एक procedural shrug के साथ दिया गया गैर-उत्तर है।

यह post इस बारे में है कि custom LLMs के लिए असली compliance उत्तर कैसा दिखता है — चार regulatory frameworks में (**EU AI Act, GDPR Article 17, HIPAA, NIST AI RMF**), जो उस चार-stage वाले pipeline ([Register → Gate → Roll → Observe](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)) पर mapped हैं जिसे हम customer releases के लिए ship करते हैं। हर regulator की माँग में एक केंद्रीय तनाव चलता है — **open-weights बनाम closed-API**: Gemma 4 के एक fine-tune के बारे में आप जो साबित कर सकते हैं वह वह नहीं है जो आप एक opaque vendor API के पीछे serve होने वाली release के बारे में साबित कर सकते हैं। हमारे द्वारा उपयोग किया जाने वाला receipt format यह स्पष्ट रूप से, पंक्ति-दर-पंक्ति कहता है। यही ईमानदारी receipt को auditor के लिए उपयोगी बनाती है।

## चार regulators और हर एक वास्तव में क्या चाहता है

Compliance चर्चाएँ अक्सर "हमने सब कुछ document किया" तक सिमट जाती हैं। यह framing एक auditor के सामने टिकता नहीं। Auditors जो चाहते हैं वह है *ऐसा evidence जिसे वे आपकी infrastructure पर भरोसा किए बिना verify कर सकें*। नीचे के चारों frameworks एक ही अंतर्निहित माँग के लिए अलग-अलग शब्दावलियाँ इस्तेमाल करते हैं।

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="चार regulatory frameworks और प्रत्येक द्वारा माँगा गया verification primitive। EU AI Act documented logic और human oversight माँगता है; verification primitive है bit-exact mechanistic documentation। GDPR Article 17 personal data के verifiable erasure की माँग करता है; verification primitive है SHA-256 receipt के साथ weight-level DELETE patch। HIPAA access audit और disclosure tracking की माँग करता है; verification primitive है per-request signed decision log। NIST AI RMF governance, mapping, measurement, और management माँगता है; verification primitive है हर release decision के लिए hash-chained receipts।">
<title>चार regulators, एक verification माँग</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">चार regulators, एक अंतर्निहित माँग: verify करें, भरोसा नहीं</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">प्रत्येक framework verification primitive को अलग नाम देता है, पर सार एक ही है: cryptographic proof जिसे auditor check कर सके।</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Annex IV माँगता है:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• documented logic</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• training-data सारांश</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• human oversight उपाय</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• post-market monitoring</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Verification primitive:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">vindex के द्वारा bit-exact</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">mechanistic documentation</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">गैर-अनुपालन पर दंड:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">वैश्विक turnover के</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">7% तक</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR Art. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Right-to-erasure माँगता है:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• verifiable data removal</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• demonstrable forgetting</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• adversarial prompting के</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  तहत proof</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Verification primitive:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">SHA-256 receipt के साथ</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">weight-level DELETE patch</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">गैर-अनुपालन पर दंड:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">€20M या turnover</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">के 4% तक</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Access controls माँगते हैं:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• access audit trail</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• disclosure tracking</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• न्यूनतम-आवश्यक</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  PHI exposure</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Verification primitive:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">per-request signed</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">decision log</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">गैर-अनुपालन पर दंड:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">$1.9M / violation-type</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">/ वर्ष तक</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">चार core functions:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• govern</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• map</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• measure</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• manage</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Verification primitive:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">हर release decision के</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">लिए hash-chained receipt</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">गैर-अनुपालन पर दंड:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">स्वैच्छिक framework</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(पर de facto</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">enterprise baseline)</text>
</svg>
</figure>

दंड के आँकड़े वह नहीं हैं जो इन frameworks को रोचक बनाते हैं। दंड के आँकड़े वह हैं जो इन्हें load-bearing बनाते हैं। रोचक हिस्सा है **verification primitive** — हर framework वास्तव में चाहता है कि artifact कैसा दिखे। चारों में से तीन अलग-अलग शब्दावलियों में cryptographic-grade proof माँगते हैं। चौथा (NIST AI RMF) स्वैच्छिक है पर enterprise procurement में de facto आवश्यक है। वे एक ही आकार पर अभिसरित होते हैं: एक ऐसा artifact जिसे auditor आपकी logs पर भरोसा किए बिना verify कर सके।

## विभाजन: open-weights बनाम closed-API

Per-stage mapping से पहले, इस पूरी post की सबसे महत्वपूर्ण चेतावनी:

**open-weights model backings के लिए** — Gemma, Qwen, Llama, Mistral, GPT-OSS, और कोई भी जहाँ weights addressable और editable हैं — हर Divinci release decision एक vindex receipt emit करता है जिसमें **weight-attestation** शामिल होता है: cryptographic proof कि decision time पर active weights ठीक वही weights हैं जो manifest ने register किए थे। यही वह चीज़ है जो GDPR Article 17 के verifiable erasure को संभव बनाती है। आप एक [DELETE patch](/blog/deleting-paris-from-a-language-model/) apply करते हैं जो weight space से एक विशिष्ट entity-relation को हटाता है, receipt before-and-after hash embed कर लेती है, और एक auditor public vindex के विरुद्ध verification को फिर से चलाकर deletion का होना verify कर सकता है।

**closed-API model backings के लिए** — OpenAI, Anthropic, Google opaque APIs के माध्यम से — वही receipt decision chain को cover करता है (कौन-सा manifest, कौन-सा gate result, कौन-सी monitor reading, किस user ने कौन-सी action trigger की) पर **weight provenance का दावा नहीं कर सकता**, क्योंकि provider weights expose नहीं करता। Receipt इसे स्पष्ट रूप से `weight_attestation: null` field में एक `note` के साथ नोट करता है जो बताता है कि क्यों। यह degraded compliance posture नहीं है — यह है verifiable क्या है उसकी सीमा, ईमानदारी से लिखी गई। एक auditor जो receipt पढ़ता है उसे ठीक-ठीक पता चलता है कि कौन-सी class का proof बन रहा है और कौन-सी नहीं।

यह विभाजन नीचे हर regulator की माँग में चलता है। जब भी कोई framework weight स्तर पर कुछ माँगता है, open-weights path उसे संतुष्ट कर सकता है और closed-API path नहीं कर सकता। हम receipt में ऐसा कहते हैं बजाय इसके कि किसी proof का संकेत दें जिसे हम deliver नहीं कर सकते।

## हर framework कैसे चार pipeline stages पर map होता है

Pipeline के चार stages हैं। हर regulator की माँग एक या अधिक stages पर map होती है। नीचे का matrix वास्तविक map है।

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="चार regulatory frameworks का चार-stage Divinci release pipeline पर mapping। EU AI Act Annex IV documented logic और training summary Stage 1 Register पर mapped। EU AI Act human oversight और post-market monitoring Stages 2 Gate और 4 Observe पर mapped। GDPR Article 17 verifiable erasure Stage 1 Register पर DELETE patch के माध्यम से और Stage 4 Observe पर receipt के माध्यम से mapped। HIPAA access audit और disclosure tracking Stages 1, 3, और 4 पर mapped। NIST AI RMF govern map measure manage सभी चार stages पर mapped। Matrix में पाँच cells highlighted हैं जो open-weights-only verification path को इंगित करती हैं।">
<title>Pipeline stages पर mapped regulatory frameworks</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">कौन-सा pipeline stage कौन-सी regulatory माँग को cover करता है</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = पूर्ण coverage। ◐ = open-weights-only (weight-attestation आवश्यक)। closed-API path decision chain को cover करता है पर weight-level दावा नहीं कर सकता।</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Framework / माँग</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Annex IV: documented logic</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Annex IV: training-data सारांश</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Human oversight उपाय</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Post-market monitoring</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR Article 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Verifiable erasure (DELETE patch)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Erasure receipt (hash-chained)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Per-request access audit</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Disclosure tracking + न्यूनतम-आवश्यक</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">Govern · Map · Measure · Manage</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

दोनों ◐ cells GDPR Article 17 / open-weights-only entries हैं — ये वे माँगें हैं जिन्हें closed-API path पूरी तरह संतुष्ट नहीं कर सकता। बाक़ी सब दोनों backings पर लागू होता है।

बाक़ी की post हर stage के योगदान का विवरण देती है।

## Stage ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Release manifest ही EU AI Act Annex IV का technical documentation है।</span>
  </div>
</div>

Register stage एक immutable JSON manifest उत्पन्न करता है, जो SHA-256 द्वारा addressed है। विनियमित releases के लिए manifest वह सब कुछ ले जाता है जो Annex IV<sup><a href="#ref-1">[1]</a></sup> एक ही artifact में माँगता है:

- Model artifact (HF repo + commit SHA, या एक vindex patch reference)
- Prompt template (हर variable, हर system message — version-controlled)
- Routing rules (कौन-सी traffic class कौन-सी release पर जाती है)
- Gate thresholds compute करने के लिए उपयोग किया गया dataset version (training-data सारांश hash के द्वारा)
- पिछली release का SHA (ताकि audit chain अटूट रहे)
- Disclosure scope — HIPAA deployments के लिए, model को कौन-सी PHI categories प्राप्त करने की अनुमति है

Manifest ही documentation है। एक auditor prose नहीं पढ़ता; वह manifest hash पढ़ता है और bundle को verify करता है। छह-महीने-बाद-लिखा गया कोई prose सारांश आवश्यक नहीं।

**Open-weights bonus.** जब model artifact किसी open-weights model का reference देता है, तो manifest `vindex_sha256` भी embed करता है — model की प्रकाशित [vindex](/hi/compliance/) का cryptographic fingerprint। वह fingerprint ही वह चीज़ है जो एक तीसरे पक्ष को हमारी deployment infrastructure पर कभी भरोसा किए बिना active weights verify करने देती है।

**Closed-API caveat.** जब model artifact किसी closed-API model का reference देता है, तो manifest का `vindex_sha256` field `null` होता है, और manifest का `weight_attestation_class` होता है `decision_chain_only`। इसे पढ़ने वाला auditor ठीक-ठीक जानता है कि क्या दावा किया जा रहा है और क्या नहीं।

## Stage ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Per-slice quality gates EU AI Act की human-oversight आवश्यकता को ले जाते हैं।</span>
  </div>
</div>

Gate stage वह जगह है जहाँ EU AI Act के "human oversight measures"<sup><a href="#ref-1">[1]</a></sup> operationalize होते हैं। जो regulator EU AI Act पढ़कर निष्कर्ष निकाले कि "हमें human approval workflow चाहिए" वह बात नहीं समझा — असली कठिन माँग है *human किसके विरुद्ध approve कर रहा है*। Gate stage उस सवाल का उत्तर देता है एक human-anchored grader<sup><a href="#ref-3">[3]</a></sup> के विरुद्ध per-slice Spearman ρ के साथ। आपकी regulatory posture में मायने रखने वाली हर slice (pediatric oncology, IP licensing, Belgian French) को अपना threshold मिलता है। Override path के लिए लिखित rationale आवश्यक होता है जो audit trail में जाता है।

HIPAA-covered deployments के लिए, यहीं "न्यूनतम-आवश्यक" disclosure rule भी रहता है। Gate के scored-QA suite में PHI over-exposure के लिए negative tests शामिल हैं — ऐसे उत्तर जिनमें personal identifiers आते हैं जब पूछा नहीं गया था। एक release जो over-exposure slice पर regress करती है gate fail करती है, बाक़ी slices चाहे कैसा भी प्रदर्शन करें।

NIST AI RMF के लिए, Gate stage "measure" function को cover करता है — per-slice संख्यात्मक evidence कि system configured tolerances के भीतर प्रदर्शन कर रहा है।

## Stage ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary checkpoints post-market monitoring artifact बन जाते हैं।</span>
  </div>
</div>

EU AI Act post-market monitoring<sup><a href="#ref-1">[1]</a></sup> operator से माँगता है कि वास्तविक स्थितियों में AI system कैसा प्रदर्शन करता है इसका *निरंतर* — सिर्फ pre-launch नहीं — observation दिखाए। एक 5% → 25% → 100% canary जिसमें quality-monitor checkpoints हों, इसे संतुष्ट करने का सबसे स्वाभाविक तरीक़ा है। हर checkpoint पर dwell, और dwell के दौरान monitor readings — यही वह चीज़ है जो auditor देखना चाहता है।

HIPAA के लिए, canary stage वह जगह भी है जहाँ per-request audit logging end-to-end exercise होता है। हर checkpoint signed request-response receipts का एक sample उत्पन्न करता है; अगर किसी की PHI handling misconfigured है, तो वह 100% traffic पर नहीं, 5% traffic पर ही सामने आ जाती है।

## Stage ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">निरंतर monitor + receipt format GDPR Article 17 को verifiable बनाते हैं।</span>
  </div>
</div>

यह वह stage है जो compliance की कहानी कमाता है। Observe stage active release के माध्यम से निरंतर trace replay चलाता है, जो Gate के उसी human-anchored judge द्वारा scored है, साथ में एक quality monitor जो breach होने पर automatic rollback trigger करता है।

हर release decision — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback, **और कोई भी GDPR Article 17 DELETE patch application** — एक vindex receipt emit करता है। इस customer के लिए पिछले receipt और इस release के लिए पिछले receipt से hash-chained।

GDPR Article 17 DELETE patch के लिए असली receipt कैसा दिखता है — सीधे [compliance page](/hi/compliance/) पर documented format से adapted:

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

वह artifact verifiable है। एक auditor को हमारी logs पर भरोसा नहीं करना पड़ता। वह `vindex_sha256_after` लेता है, `huggingface.co/Divinci-AI` से संबंधित published vindex pull करता है, और verify करता है कि layer 27 में feature 11179 top-25 से संरचनात्मक रूप से अनुपस्थित है। वह `chain_signature` लेता है और पिछले receipt के विरुद्ध verify करता है। पूरी chain customer द्वारा configure किए गए schedule पर externally anchored है।

**वही operation एक closed-API model के विरुद्ध।** ऊपर के receipt fields तीन तरह से बदलते हैं: `operation.target` बन जाता है `provider_api_endpoint`, `verification` एक अलग schema बन जाता है जो केवल decision-chain evidence को cover करता है, और `weight_attestation_class` बन जाता है `decision_chain_only`। Closed-API model provider ने weights expose नहीं किए हैं, तो receipt ऐसा कहता है। एक auditor जिसे weight-level proof चाहिए उसे अब पता है कि उन्हें provider के पास escalate करना है, हमारे पास नहीं।

यह वह differentiation है जो 2026 में और कोई ship नहीं करता। eval-CI camp (Braintrust, Humanloop, Patronus) traffic पर नहीं बैठता और decision receipts emit नहीं करता। serving-canary camp (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) infra-metric logs emit करता है पर hash-chained compliance receipts नहीं। observability camp (Arize, Phoenix, Confident, Deepchecks) output देखता है पर enforce नहीं करता।

## एक auditor वास्तव में क्या verify करता है?

एक उपयोगी अभ्यास: उन सवालों से गुज़रें जो एक असली auditor पूछेगा, और कौन-सा artifact हर एक का उत्तर देता है।

| Auditor का सवाल | वह artifact जो उत्तर देता है |
|---|---|
| *"15 March को 14:22 UTC पर कौन-सा model version चल रहा था?"* | उस timestamp के लिए Observe-stage receipt, signed और hash-chained। |
| *"Promote से पहले इस release ने कौन-सा evaluation pass किया?"* | Gate-stage receipt, per-slice Spearman ρ table और dataset SHA जिसके विरुद्ध gate चला, के साथ। |
| *"क्या patient X के लिए GDPR Article 17 erasure request वास्तव में apply हुआ था?"* | ऊपर वाला DELETE-patch receipt। Auditor `vindex_sha256_after` को published vindex के विरुद्ध verify करता है। |
| *"इस release को किसने approve किया? IP-licensing slice gate को override करने का उनका बताया गया rationale क्या था?"* | Gate-stage receipt का `override` block, user ID और आवश्यक free-text rationale सहित। |
| *"Rollback कितनी जल्दी fire हुआ, और किस monitor reading ने उसे trigger किया?"* | Observe-stage rollback receipt, तीन लगातार sub-threshold quality readings और rollback elapsed time के साथ। |
| *"पिछले 90 दिनों के लिए post-market monitoring evidence दिखाएँ।"* | Observe-stage receipt chain। Customer के configured schedule पर externally anchored। |

जो auditor को *नहीं करना पड़ता*: हमारे Datadog पर भरोसा। हमारे CloudWatch पर भरोसा। किसी screenshot पर भरोसा। किसी export पर भरोसा। Receipt format का पूरा मक़सद यही है कि auditor इसे स्वतंत्र रूप से verify कर सके।

## यह क्या हल नहीं करता

तीन ईमानदार सीमाएँ:

**GDPR Article 17 territory में closed-API regressions platform layer पर हल करने योग्य नहीं हैं।** अगर आप एक healthcare assistant को closed-API model के पीछे serve कर रहे हैं और कोई patient Article 17 invoke करता है, तो platform attest कर सकता है कि patient का record आपके retrieval store, prompt template, और routing rules से हटा दिया गया — पर attest नहीं कर सकता कि अंतर्निहित model weights patient का data भूल गए। आपको या तो एक open-weights backing चाहिए या weight-level erasure के लिए vendor commitment। हम receipt में ऐसा कहते हैं।

**Documentation आवश्यक है पर पर्याप्त नहीं।** एक receipt जो साबित करता है कि एक model एक threshold से मिला, यह साबित नहीं करता कि वह threshold ही सही threshold था। अगर आपका scored-QA suite उस slice को cover नहीं करता जो आपकी service में किसी patient के लिए वास्तव में मायने रखती है, तो कोई भी receipt-chaining इसे ठीक नहीं करती। Regulators इसे तेज़ी से समझ रहे हैं; "हमने अपना eval pass किया" अब एक पर्याप्त compliance उत्तर नहीं रहा अगर eval ग़लत eval था।

**Vindex format single-vendor है।** हम इसका उपयोग करते हैं क्योंकि यह आज weight-level proof के लिए उपलब्ध सबसे ठोस cryptographic primitive है। अगर उद्योग एक अलग format पर settle हो — model-cards-with-hashes, NIST-published artifact schemas — तो receipt format को उसी की ओर evolve होना चाहिए। सार (hash-chained, externally verifiable, weight-attestation-aware) load-bearing है, विशिष्ट schema नाम नहीं। हम उम्मीद करते हैं कि जैसे-जैसे regulatory और standards landscape परिपक्व होगा, यह बदलेगा।

## FAQ

### AI systems के लिए GDPR Article 17 के तहत verifiable erasure क्या है?

Verifiable erasure का मतलब है कि एक तीसरा पक्ष आपकी logs पर भरोसा किए बिना verify कर सके कि data हटाया गया था। एक model को विशिष्ट जानकारी "भूलने" के लिए fine-tune करना इस standard को पूरा नहीं करता — जानकारी adversarial prompting के तहत फिर से उभर सकती है, और कोई cryptographic primitive नहीं है जिसे auditor check कर सके। एक प्रकाशित before/after vindex hash के साथ weight-level DELETE patch standard को पूरा *करता* है, क्योंकि auditor public artifact के विरुद्ध verification फिर से चला सकता है।

### Closed-API models GDPR Article 17 को उसी तरह क्यों संतुष्ट नहीं कर सकते?

क्योंकि provider weights expose नहीं करता। Weights तक पहुँच के बिना, कोई भी तीसरा पक्ष — API का उपयोग करने वाला customer भी — weight-level erasure जारी या verify नहीं कर सकता। Receipt का decision-chain भाग (कौन-सा prompt template उपयोग हुआ, data किस retrieval store से आया, कौन-से routing rules सक्रिय थे) अभी भी verifiable है, पर weight-level दावा नहीं। यह compliance framework की सीमा नहीं है, बल्कि weights private होने पर verifiable क्या है उसकी सीमा है।

### सरल भाषा में EU AI Act Annex IV क्या माँगता है?

Annex IV technical documentation माँगता है जो system की logic, training data सारांश, इच्छित उपयोग, human oversight उपाय, और post-market monitoring को cover करे। अधिकांश teams जिस जाल में फँसती हैं वह है इन्हें पाँच अलग-अलग दस्तावेज़ों के रूप में मानना। Stage 1 पर release manifest पहली तीन माँगों को एक single hash के रूप में ले जाता है; Gate stage चौथी को cover करता है; Roll + Observe stages पाँचवीं को cover करते हैं। एक pipeline; चार माँगें सामान्य operations के byproduct के रूप में संतुष्ट।

### HIPAA-covered deployments के लिए rollback कितना तेज़ होना चाहिए?

HIPAA rollback time निर्दिष्ट नहीं करता, पर breach response पर HHS guidance time-to-containment को load-bearing मानती है। सेकंडों के क्रम में rollback (manifest-driven flip पर in-flight drain — हमारा आँकड़ा लगभग 12 सेकंड है) संरचनात्मक रूप से एक सामान्य infra-metric blue-green से तेज़ है जो alarm propagation पर निर्भर करता है। सार्वजनिक postmortems से तुलना करें: Cloudflare की June 2022 की घटना<sup><a href="#ref-4">[4]</a></sup> को revert होने में 44 मिनट लगे क्योंकि engineers एक-दूसरे के reverts पर चढ़ गए।

### NIST AI RMF एक release pipeline पर कैसे map होता है?

NIST AI RMF के चार core functions — Govern, Map, Measure, Manage — पूरे release lifecycle में फैले हैं, एक ही stage पर नहीं। Govern है documented release policy साथ में gate-override rationale workflow (Register + Gate stages)। Map है per-slice scored-QA suite (Gate)। Measure है per-slice Spearman thresholds और निरंतर quality monitor (Gate + Observe)। Manage है rollback path और receipt chain (Observe)। चारों cover होते हैं जब pipeline अपना पूरा receipt set emit करता है।

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Annex IV defines the technical documentation requirements for high-risk AI systems: system logic, training data summary, human oversight measures, post-market monitoring. Penalties up to 7% of global turnover for non-compliance.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> 600, max <code>MaximumExecutionTimeoutInSeconds</code> 1800. Cited as the industry-standard infra-metric canary that the Stage 4 quality monitor is contrasted against.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrated LLM-as-judge agreement.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) down to writing (36–44%). Anchor for the per-slice Spearman calibration that drives the Gate stage.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 minutes from "we know what to revert" to revert complete because engineers walked over each other's reverts. Anchor for the "manifest-driven rollback can't have that failure mode" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Voluntary framework — Govern, Map, Measure, Manage — that has become the de facto enterprise procurement baseline for AI governance. Voluntary but enforced in practice through customer due-diligence questionnaires.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Minimum-necessary disclosure, access audit, and breach response timing requirements applicable to any AI system that touches PHI. Civil monetary penalties up to $1.9M per violation-type per year per <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">CMP inflation adjustment, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Article 17 (Right to Erasure).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. The data subject's right to obtain erasure of personal data, and the controller's obligation to demonstrate compliance under Article 5(2) accountability. Penalties up to €20M or 4% of annual global turnover.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — vindex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/compliance/">compliance page</a> and demonstrated in the <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*इस श्रृंखला में अगला:* **Automated LLM CI/CD Pipelines With Instant Rollback.** यह post दिखाई कि auditor क्या चाहता है। अगली वह operational pattern दिखाती है जो receipt को auditor की मेज़ पर हफ़्तों के बजाय सेकंडों में पहुँचाता है — चार-stage pipeline के नीचे का automation, इस फ़ोकस के साथ कि क्या बदलता है जब rollback अपने आप fire करता है।
