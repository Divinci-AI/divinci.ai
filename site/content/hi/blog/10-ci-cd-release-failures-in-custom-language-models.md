+++
title = "कस्टम LM में 10 CI/CD रिलीज़ फ़ेलियर — कौन-सा चरण किसे पकड़ता है"
description = "कस्टम LM रिलीज़ के दस वास्तविक failure modes, हर एक Divinci चरण — Register, Gate, Roll, Observe — पर मैप, जो उपयोगकर्ताओं से पहले पकड़ ले।"
date = 2026-05-27T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Postmortems", "Evaluation Gates", "Rollback"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/10-ci-cd-release-failures-in-custom-language-models-veo31.webm"
hero_video_poster = "/images/10-ci-cd-release-failures-in-custom-language-models-hero-poster.webp"
reading_time = 11
summary = "हमने Divinci की चार-चरण पाइपलाइन के माध्यम से इतनी कस्टम LM रिलीज़ शिप की हैं कि अब हमारे पास उन दस सबसे विनाशकारी failure modes की सूची है जिनसे हम बार-बार टकराते थे। इनमें से तीन स्लाइस-अवेयर रिग्रेशन हैं जिन्हें एक एग्रीगेट गेट शिप कर देता। दो और साइलेंट गुणवत्ता गिरावटें हैं जिन्हें एक इंफ्रास्ट्रक्चर-मेट्रिक कैनरी प्रमोट कर देता। बाक़ी वैसी ग़लतियाँ हैं जिन्हें हर रिलीज़ पाइपलाइन को पकड़ना चाहिए — हम उन्हें इसलिए सूचीबद्ध करते हैं क्योंकि यह स्पष्ट रूप से कहने योग्य है कि एक एग्रीगेट-गेटेड पाइपलाइन वास्तव में किन्हें स्वयं ही पकड़ लेती है।"
+++

*Notes from the Release Cycle — भाग II*

---

[इस सीरीज़ की पहली पोस्ट](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) हमारे द्वारा शिप की जाने वाली चार-चरण रिलीज़ पाइपलाइन — **Register → Gate → Roll → Observe** — को विस्तार से बताती है। यह पोस्ट रसीदें हैं: दस विशिष्ट failure modes जिन्हें हमने अब इसके साथ पकड़ा है, हर एक व्यवहार में कैसा दिखा, और पाइपलाइन के किस चरण ने उसे प्रोडक्शन तक पहुँचने से रोका।

सूची चरण के अनुसार व्यवस्थित है, गंभीरता के अनुसार नहीं, क्योंकि चरण आपको बताता है कि *कहाँ निवेश करें* यदि आप स्वयं ऐसा कुछ बना रहे हैं। यदि आपका गेट कमज़ोर कड़ी है, तो नीचे की दस में से छह विफलताएँ आपको लगातार चोट पहुँचाती रहेंगी। यदि आपका observer कमज़ोर कड़ी है, तो दो विफलताएँ आपको चुपचाप चोट पहुँचाएंगी — मतलब एकमात्र संकेत जो आपको कभी मिलेगा वह है ग्राहक की शिकायत, जो सबसे ख़राब संभव संकेत है।

एक पाइपलाइन जो दसों को पकड़ती है वह फ़ीचर्स की सूची नहीं है। यह कुछ आर्किटेक्चरल निर्णयों का छोटा सेट है जो लगातार लिए गए हैं। नीचे हर विफलता बताती है कि कौन-सा निर्णय लागू होता है।

## इस सूची को कैसे पढ़ें

हर विफलता को उस चरण से टैग किया गया है जो उसे पकड़ता है:

- **① REGISTER** — मेनिफ़ेस्ट परत। उन विफलताओं को रोकती है जहाँ आप यह नहीं बता पाते थे कि प्रोडक्शन को कौन-से परिवर्तन ने तोड़ा क्योंकि state कई सिस्टमों में बँटा हुआ था।
- **② GATE** — कैलिब्रेटेड मानव-एंकर्ड judge के विरुद्ध प्रति-डोमेन Spearman। उन विफलताओं को रोकती है जो एग्रीगेट स्कोर के अंदर छिप जाती हैं।
- **③ ROLL** — 5% → 25% → 100% पर कैनरी, हर चेकपॉइंट पर एक गुणवत्ता मॉनिटर के साथ। उन विफलताओं को रोकती है जो केवल स्केल पर सामने आती हैं।
- **④ OBSERVE** — कैंडिडेट के माध्यम से प्रोडक्शन ट्रेस का निरंतर रीप्ले, गेट के judge द्वारा स्कोर किया गया। साइलेंट गुणवत्ता गिरावटों को रोकती है जिन्हें latency और 5xx कभी नहीं देखते।

हर सेक्शन **fix** के साथ समाप्त होता है — Divinci पर हम जो सटीक कॉन्फ़िगरेशन शिप करते हैं, साथ ही यदि आप हमारा उपयोग नहीं कर रहे हैं तो आपको स्वयं क्या बनाना होगा।

---

## चरण ① — Register

### 1. एक ही बंडल में model + prompt + routing को सह-डिप्लॉय करना और यह न जानना कि किसने उसे तोड़ा

**क्या हुआ।** हमने एक ही रिलीज़ पर तीन चीज़ें बदलीं: बेस मॉडल को Gemma 4 E2B से Gemma 4 26B-A4B पर बंप किया, "cite the statute" निर्देश जोड़ने के लिए legal-domain सिस्टम प्रॉम्प्ट संपादित किया, और उस राउटिंग नियम को समायोजित किया जो तय करता है कि कौन-सा ट्रैफ़िक क्लास किस मॉडल पर जाता है। कॉन्ट्रैक्ट ड्राफ़्टिंग पर सटीकता 7 अंक गिर गई। तीनों में से किसी भी परिवर्तन का स्वतंत्र रूप से परीक्षण नहीं किया गया था। इसे डीबग करने के लिए दो दिनों के दौरान एक-एक करके वेरिएबल को वापस करना पड़ा।

**अब पाइपलाइन इसे क्यों पकड़ती है।** एक Divinci रिलीज़ एक अपरिवर्तनीय मेनिफ़ेस्ट है जो model_ref, prompt_template_ref, routing, और dataset_version को एक सिंगल SHA-256-एड्रेस्ड आर्टिफ़ैक्ट में बंडल करता है। पाइपलाइन एक ऐसे मेनिफ़ेस्ट को डिप्लॉय करने से इनकार करती है जो एक से अधिक परिवर्तन को बंडल करता है, *जब तक कि* पिछली रिलीज़ का SHA तुलना बेसलाइन के रूप में संदर्भित न किया गया हो। यदि आप एक साथ तीन परिवर्तन शिप करना चाहते हैं, तो आपको इसे मेनिफ़ेस्ट में स्वीकार करना होगा, और failure-attribution पथ साफ़ रहता है क्योंकि अगली रिलीज़ को एक बार में एक-वेरिएबल पर वापस लौटा दिया जाता है।

**Fix.** मनुष्यों को रिलीज़ हाथ से असेंबल न करने दें। रिलीज़ मेनिफ़ेस्ट एक ऐसी पाइपलाइन द्वारा उत्पन्न होना चाहिए जो *चुपचाप बंडल नहीं कर सकती*। API के लिए [Stage 1 — Register](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) देखें।

### 2. एक डैशबोर्ड में सिस्टम प्रॉम्प्ट को संपादित करना और बिना कोड रिव्यू के शिप करना

**क्या हुआ।** किसी ने "मॉडल को कम वर्बोज़ बनाने" के लिए एक admin UI में सिस्टम प्रॉम्प्ट को tweak किया। यह एक-शब्द का संपादन जैसा लग रहा था। परिणामी प्रॉम्प्ट 38 अक्षर छोटा हो गया, जिसने उसे एक लंबाई थ्रेशोल्ड के नीचे गिरा दिया जिसका उपयोग downstream prompt-rewriter यह तय करने के लिए करता था कि क्या safety boilerplate जोड़ा जाए। दो घंटे बाद मॉडल उन प्रश्नों के उत्तर दे रहा था जिन्हें मना करना चाहिए था।

**अब पाइपलाइन इसे क्यों पकड़ती है।** प्रॉम्प्ट्स रजिस्टर्ड मेनिफ़ेस्ट का हिस्सा हैं। डैशबोर्ड में एक को संपादित करने का मतलब है एक नया मेनिफ़ेस्ट काटना, जिसका मतलब है एक नया SHA उत्पन्न करना, जिसका मतलब है कि गेट परिवर्तन के विरुद्ध चलता है। आप अभी भी डैशबोर्ड में प्रॉम्प्ट संपादित कर सकते हैं। आप बस उन्हें गेट देखे बिना शिप नहीं कर सकते।

**Fix.** प्रॉम्प्ट्स के साथ कोड की तरह व्यवहार करें: उन्हें content hash के साथ संस्करण दें, उन्हें रिलीज़ के हिस्से के रूप में रजिस्टर करें, उन्हें scored-QA सूट पर गेट करें। Tianpan का *Semver Lie* लेख<sup><a href="#ref-1">[1]</a></sup> इस सटीक failure mode को असल दुनिया में होते हुए वर्णित करता है — एक प्रॉम्प्ट परिवर्तन जो "कोड रिव्यू पास हुआ, eval गेट्स के बिना डिप्लॉय हुआ, बिना प्रति-उपयोगकर्ता A/B के प्रोडक्शन में पहुँचा, और किसी भी ऑटोमैटिक रोलबैक को ट्रिगर नहीं किया।"

### 3. Training-serving preprocessing skew

**क्या हुआ।** ट्रेनिंग पाइपलाइन एक विशेष फ़ील्ड के whitespace को normalize करती और lowercase करती थी। सर्विंग पाइपलाइन नहीं करती थी। वही मॉडल, वही प्रॉम्प्ट, वही राउटिंग — byte स्तर पर अलग-अलग input। dev fixtures पर सब कुछ पास हुआ। वास्तविक ट्रैफ़िक पर मॉडल ऐसे व्यवहार कर रहा था जैसे उसे शोरगुल वाले डेटा पर फिर से ट्रेन किया गया हो, क्योंकि उसके दृष्टिकोण से उसे फिर से ट्रेन किया गया था।

**अब पाइपलाइन इसे क्यों पकड़ती है।** मेनिफ़ेस्ट model_ref के साथ-साथ एक `preprocessing_ref` रजिस्टर करता है। गेट मूल्यांकन उसी preprocessing के माध्यम से चलता है जिसका उपयोग प्रोडक्शन सर्विंग स्टैक करता है। यदि दोनों अलग होते हैं, तो गेट के ऑफ़लाइन नंबर प्रोडक्शन से मेल नहीं खाते, और प्रति-स्लाइस Spearman ऐसे तरीक़े से गिरता है जो promote से पहले मापने योग्य होता है।

**Fix.** Preprocessing को एक versioned artifact के रूप में containerize करें। उसे मेनिफ़ेस्ट से reference करें। डिप्लॉय करने से इनकार करें यदि गेट की गणना उस preprocessing संस्करण के विरुद्ध की गई थी जो प्रोडक्शन उपयोग करेगा उससे अलग है।

---

## चरण ② — Gate

नीचे की चार विफलताएँ वही हैं जिन्हें एक एग्रीगेट-स्कोर गेट शिप कर देता। **एक एग्रीगेट गेट उन्हें मिस करने का कारण structural है, पैरामीटर-ट्यूनिंग नहीं** — स्लाइसों में औसत निकालना ठीक उसी सिग्नल को नष्ट कर देता है जिसका उपयोग आप एक ऐसे रिग्रेशन को पकड़ने के लिए करते जो एक स्लाइस तक स्थानीयकृत है।

### 4. IP-licensing कोलैप्स (slice-aware regression #1)

**क्या हुआ।** एक QLoRA fine-tune ने पाँच उप-डोमेनों पर legal Q&A सटीकता में सुधार किया और IP-licensing को क्रैश कर दिया — contract drafting 0.71, statutory interpretation 0.74, case summarization 0.69, regulatory compliance 0.66, jurisdictional analysis 0.62, **IP licensing 0.41**। छहों में एग्रीगेट Spearman ρ 0.64 था। गेट थ्रेशोल्ड 0.65 था। एकल एग्रीगेट स्कोर से, रिलीज़ रेखा से बाल भर नीचे थी। प्रति-स्लाइस दृश्य से, एक उप-डोमेन 27 अंकों से कोलैप्स हो चुका था।

**अब पाइपलाइन इसे क्यों पकड़ती है।** गेट का थ्रेशोल्ड प्रति-स्लाइस है, एग्रीगेट नहीं। कोई भी एकल स्लाइस जो अपने थ्रेशोल्ड से नीचे गिरता है, रिलीज़ को `gate_fail` के रूप में चिह्नित करता है, चाहे औसत कैसा भी दिखे। [पोस्ट #1 का gate-thresholds चार्ट](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) इस तरह की रिलीज़ के लिए पाइपलाइन द्वारा निर्मित वास्तविक विज़ुअलाइज़ेशन है।

**Fix.** गेट को स्लाइस करें। जो स्लाइस मायने रखते हैं वे आपके कस्टमर-सेगमेंट उप-डोमेन हैं, न कि वह taxonomy जो आपने इम्पोर्ट किए गए eval framework में है।

### 5. Pediatric oncology स्लाइस रिग्रेशन (slice-aware regression #2)

**क्या हुआ।** एक medical Q&A मॉडल अतिरिक्त adult cardiology डेटा पर fine-tune किया गया। एग्रीगेट medical सटीकता में 4 अंक सुधार हुआ। Pediatric oncology सटीकता 11 अंक गिर गई — स्पष्ट रूप से नए ट्रेनिंग डेटा ने सूक्ष्मता से pediatric dosage समायोजनों को de-emphasize कर दिया था। एक एग्रीगेट गेट इसे promote कर देता।

**अब पाइपलाइन इसे क्यों पकड़ती है।** Pediatric oncology उन स्लाइसों में से एक था जो ग्राहक ने scored-QA सूट रजिस्टर करते समय कॉन्फ़िगर किया था। Gate-2 मूल्यांकन ने एक प्रति-स्लाइस Spearman ρ उत्पन्न किया जो 0.72 से 0.61 पर गिर गया, pediatric-oncology थ्रेशोल्ड 0.68 के नीचे। `gate_fail` के रूप में चिह्नित। कोई डिप्लॉय नहीं।

**Fix.** कस्टमर-डिफ़ाइन्ड स्लाइस, प्लेटफ़ॉर्म-डिफ़ाइन्ड नहीं। प्लेटफ़ॉर्म को ग्राहक को कोड लिखे बिना एक स्लाइस और एक प्रति-स्लाइस थ्रेशोल्ड जोड़ने देना चाहिए — क्योंकि Divinci में कोई भी आपके कस्टमर के डोमेन किनारों को आपके कस्टमर जितना अच्छी तरह नहीं जानता।

### 6. Multilingual sub-language drift (slice-aware regression #3)

**क्या हुआ।** एक multilingual मॉडल को French responses में सुधार के लिए fine-tune किया गया। एग्रीगेट French सटीकता में 3 अंक सुधार हुआ। हालाँकि, "French" के भीतर, मॉडल अब Belgian French और Swiss French regional variants पर बदतर प्रदर्शन कर रहा था — ट्रेनिंग कॉर्पस Parisian-French-heavy था। एक एग्रीगेट French गेट इसे शिप कर देता।

**अब पाइपलाइन इसे क्यों पकड़ती है।** Locale variants language स्लाइस के sub-slices हैं। प्रति-sub-slice Spearman ने promote से पहले Belgian variant में रिग्रेशन पकड़ लिया। रिलीज़ को इनमें से किसी एक के लिए वापस किया गया (a) अधिक विविध ट्रेनिंग डेटा या (b) एक लिखित औचित्य के साथ force-override ("हम क्षेत्रीय रिग्रेशन स्वीकार कर रहे हैं क्योंकि इस rollout में एग्रीगेट French सुधार अधिक मायने रखता है") — और ओवरराइड audit trail में चला जाता है।

**Fix.** स्लाइस की गहराई मायने रखती है। "French" बहुत मोटा है। "Belgian French" वह स्तर है जहाँ रिग्रेशन वास्तव में छिपते हैं।

### 7. लिखित ओवरराइड औचित्य के बिना गेट को bypass करना

**क्या हुआ।** एक high-pressure रिलीज़ विंडो। गेट एक स्लाइस पर फ़ेल हुआ — टीम के निर्णय में, non-critical। किसी ने force-override फ़्लैग के लिए हाथ बढ़ाया। पाइपलाइन के पहले के संस्करण में, force-override एक सिंगल boolean था। फ़्लैग फ़्लिप हुआ, रिलीज़ शिप हुई, और तीन हफ़्ते बाद कोई भी पुनर्निर्माण नहीं कर सकता था कि किसने किस स्लाइस के बारे में क्या तय किया।

**अब पाइपलाइन इसे क्यों पकड़ती है।** Force-override एक दो-फ़ील्ड गेट है: `forceGateOverride: true` AND `overrideReason: "..."`. कारण एक आवश्यक free-text string है जो user ID और जिस प्रति-स्लाइस गेट परिणाम को ओवरराइड किया गया था उसके साथ audit log में लिखा जाता है। कारण के बिना पाइपलाइन ओवरराइड को अस्वीकार करती है। आप अभी भी ओवरराइड कर सकते हैं — आप बस anonymously ओवरराइड नहीं कर सकते।

**Fix.** गवर्नेंस गेट्स एक अलग चरण नहीं हैं। वे गेट चरण की एक property हैं: हर ओवरराइड एक साइन्ड रसीद है जिसमें rationale text है।

---

## चरण ③ — Roll

### 8. एक चरण में 0% से 100% ट्रैफ़िक पर जाना

**क्या हुआ।** एक मॉडल साफ़-साफ़ गेट पास हुआ। उसे तुरंत 100% ट्रैफ़िक पर पुश कर दिया गया। बातचीत की लंबाई की एक quirk पर, नया मॉडल ~2,400 tokens से लंबे responses पर timeout हो गया — एक व्यवहार जो गेट के 100-प्रश्न मूल्यांकन सेट पर surface नहीं हुआ क्योंकि हर test prompt छोटा था। किसी के manually rollback करने से पहले 18 मिनट तक 15% उपयोगकर्ताओं को timeout मिला।

**अब पाइपलाइन इसे क्यों पकड़ती है।** Roll चरण 5% पर `dwell_5pct_seconds` (default 240) OR `requests_5pct` (default 1,000) के लिए रुकता है, जो भी *बाद में* हो। 5% ट्रैफ़िक पर, long-conversation timeouts ~3 मिनट के भीतर 5xx-rate मॉनिटर में surface हो जाते हैं। यदि कोई चेकपॉइंट मॉनिटर अपनी बैंड का उल्लंघन करता है तो पाइपलाइन 5% से आगे बढ़ने से इनकार करती है। Mean time to halt 4 मिनट था; halt के बाद full rollback का mean time लगभग 12 सेकंड था।

**Fix.** तीन चरणों में कैनरी, एक *quality* मॉनिटर के साथ, केवल latency और 5xx नहीं। "बीस सेकंड में पाँच प्रतिशत और हम कर चुके हैं" पैटर्न ख़तरनाक है। "चार मिनट के लिए पाँच प्रतिशत" पैटर्न सुरक्षित है।

---

## चरण ④ — Observe

नीचे की दो विफलताएँ वही हैं जिन्हें एक इंफ्रास्ट्रक्चर-मेट्रिक कैनरी promote कर देता। **इंफ्रास्ट्रक्चर मेट्रिक्स के उन्हें मिस करने का कारण भी structural है** — latency और 5xx पूरी तरह साफ़ रह सकते हैं जबकि मॉडल चुपचाप hedge करता है, मना करता है, या hallucinate करता है।

### 9. क़ानूनी प्रश्नों पर साइलेंट hedging (silent quality drop #1)

**क्या हुआ।** एक safety-tuned मॉडल अपडेट ने legal-domain असिस्टेंट को उल्लेखनीय रूप से अधिक conservative बना दिया। वही latency, वही 5xx rate, वही token उपयोग। लेकिन जहाँ पिछले संस्करण ने "the statute of limitations is X years" कहा था, वहाँ नए संस्करण ने कहा "you should consult an attorney।" ग्राहकों ने घंटों में नोटिस किया। डैशबोर्ड कभी नहीं हिले।

**अब पाइपलाइन इसे क्यों पकड़ती है।** Stage 4 observer सक्रिय मॉडल के माध्यम से प्रोडक्शन ट्रेस का निरंतर replay चलाता है और उन्हें उसी कैलिब्रेटेड judge के साथ स्कोर करता है जिसने Gate-2 को संचालित किया था। Hedging तुरंत सामने आती है क्योंकि कैलिब्रेटेड judge — एक "अच्छे" क़ानूनी उत्तर के मानव rating पर anchored — refusal-when-an-answer-was-expected को penalize करता है। आउटपुट-गुणवत्ता मॉनिटर लगातार तीन मिनट के लिए अपनी बैंड के नीचे गिरा और पाइपलाइन ने auto-rollback कर दिया। कुल बीता समय: पाँच मिनट से कम।

**Fix.** केवल latency और 5xx मॉनिटर न करें। वास्तविक प्रोडक्शन ट्रेस के विरुद्ध एक कैलिब्रेटेड judge से derived एक *quality* score मॉनिटर करें। SageMaker के deployment guardrails<sup><a href="#ref-2">[2]</a></sup> CloudWatch alarms पर auto-rollback करते हैं — इंफ्रास्ट्रक्चर के लिए उपयोगी, लेकिन alarm को एक metric पर fire करना होता है, और "model is hedging" वह metric नहीं है जो CloudWatch देखता है।

### 10. Fine-tune के बाद hallucinated dates (silent quality drop #2)

**क्या हुआ।** एक scheduling-assistant fine-tune confidently उन dates को insert करना शुरू कर दिया जो input में मौजूद नहीं थे। "Your meeting is on Thursday March 32nd।" Latency अपरिवर्तित। 5xx rate अपरिवर्तित। Hallucinations safety filter से पास हो गए क्योंकि किसी ने "March 32nd" को harmful के रूप में flag नहीं किया — बस impossible।

**अब पाइपलाइन इसे क्यों पकड़ती है।** observer का कैलिब्रेटेड judge — वास्तविक प्रोडक्शन scheduling ट्रेस पर चल रहा, synthetic पर नहीं — confidently-but-wrong उत्तरों को उपयुक्त "I don't know" refusals से बदतर स्कोर देता है। Hallucination-class drop ने दो मिनट के भीतर per-minute observer threshold को trigger किया। Auto-rollback fire हुआ।

**Fix.** एक judge जो domain expertise के विरुद्ध कैलिब्रेटेड हो। Generic LLM-as-judge "Thursday March 32nd" को उसी तरह miss करेगा जैसे skimming करते मनुष्य उसे miss करेंगे। Domain-कैलिब्रेटेड judges — domain expert ratings के विरुद्ध anchored — नहीं करेंगे।

---

## 10 विफलताएँ पाइपलाइन पर मैप की गईं

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="मैट्रिक्स जो दस failure modes को चार पाइपलाइन चरणों पर मैप करता है। Stage 1 Register विफलताओं 1 (सह-डिप्लॉय किए गए परिवर्तन), 2 (unversioned prompts), और 3 (training-serving skew) को पकड़ता है। Stage 2 Gate विफलताओं 4 (IP licensing slice regression), 5 (pediatric oncology slice regression), 6 (multilingual sub-language drift), और 7 (ओवरराइड औचित्य के बिना गेट को bypass करना) को पकड़ता है। Stage 3 Roll विफलता 8 (एक-चरण rollout) को पकड़ता है। Stage 4 Observe विफलताओं 9 (साइलेंट hedging) और 10 (hallucinated dates) को पकड़ता है।">
<title>पाइपलाइन चरण के अनुसार Failure modes</title>
<rect width="900" height="420" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">हर विफलता कहाँ पकड़ी जाती है</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">तीन स्लाइस-अवेयर रिग्रेशन Gate पर पहुँचते हैं। दो साइलेंट गुणवत्ता गिरावटें Observe पर पहुँचती हैं। बाक़ी Register और Roll के बीच वितरित हैं।</text>
<g>
<rect x="40" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="140" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">① REGISTER</text>
<rect x="250" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="350" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">② GATE</text>
<rect x="460" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="560" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">③ ROLL</text>
<rect x="670" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="770" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">④ OBSERVE</text>
</g>
<g>
<rect x="40" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="163" font-size="11" font-weight="700" fill="#1e3a2b">1. सह-डिप्लॉय किए गए परिवर्तन</text>
<text x="50" y="178" font-size="10" fill="#6b5d4f">model + prompt + routing</text>
<text x="50" y="191" font-size="10" fill="#6b5d4f">चुपचाप बंडल किए गए</text>
<rect x="40" y="210" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="228" font-size="11" font-weight="700" fill="#1e3a2b">2. Unversioned prompts</text>
<text x="50" y="243" font-size="10" fill="#6b5d4f">डैशबोर्ड संपादन</text>
<text x="50" y="256" font-size="10" fill="#6b5d4f">गेट को bypass करता है</text>
<rect x="40" y="275" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="293" font-size="11" font-weight="700" fill="#1e3a2b">3. Training-serving skew</text>
<text x="50" y="308" font-size="10" fill="#6b5d4f">preprocessing अलग होता है</text>
<text x="50" y="321" font-size="10" fill="#6b5d4f">ऑफ़लाइन + ऑनलाइन के बीच</text>
</g>
<g>
<rect x="250" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="163" font-size="11" font-weight="700" fill="#a04848">4. IP licensing slice</text>
<text x="260" y="178" font-size="10" fill="#6b5d4f">slice 0.41, aggregate 0.64</text>
<text x="260" y="191" font-size="10" fill="#6b5d4f">aggregate शिप कर देता</text>
<rect x="250" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="228" font-size="11" font-weight="700" fill="#a04848">5. Pediatric oncology</text>
<text x="260" y="243" font-size="10" fill="#6b5d4f">slice 11 अंक गिरता है</text>
<text x="260" y="256" font-size="10" fill="#6b5d4f">aggregate शिप कर देता</text>
<rect x="250" y="275" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="293" font-size="11" font-weight="700" fill="#a04848">6. Multilingual sub-drift</text>
<text x="260" y="308" font-size="10" fill="#6b5d4f">Belgian French रिग्रेस होता है</text>
<text x="260" y="321" font-size="10" fill="#6b5d4f">aggregate शिप कर देता</text>
<rect x="250" y="340" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="260" y="358" font-size="11" font-weight="700" fill="#1e3a2b">7. Override bypass</text>
<text x="260" y="373" font-size="10" fill="#6b5d4f">लिखित औचित्य +</text>
<text x="260" y="386" font-size="10" fill="#6b5d4f">audit entry आवश्यक</text>
</g>
<g>
<rect x="460" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="470" y="163" font-size="11" font-weight="700" fill="#1e3a2b">8. 0% → 100% rollout</text>
<text x="470" y="178" font-size="10" fill="#6b5d4f">कोई checkpoint dwell नहीं</text>
<text x="470" y="191" font-size="10" fill="#6b5d4f">long-tail bugs स्केल पर हिट करते हैं</text>
</g>
<g>
<rect x="670" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="163" font-size="11" font-weight="700" fill="#a04848">9. साइलेंट hedging</text>
<text x="680" y="178" font-size="10" fill="#6b5d4f">latency + 5xx अपरिवर्तित</text>
<text x="680" y="191" font-size="10" fill="#6b5d4f">judge इसे पकड़ता है</text>
<rect x="670" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="228" font-size="11" font-weight="700" fill="#a04848">10. Hallucinated dates</text>
<text x="680" y="243" font-size="10" fill="#6b5d4f">"March 32nd"</text>
<text x="680" y="256" font-size="10" fill="#6b5d4f">domain judge इसे पकड़ता है</text>
</g>
</svg>
</figure>

लाल रंग में रंगे बार वे विफलताएँ हैं जिन्हें हमने इस पाइपलाइन को शिप करते *समय* खोजा — वे ही कारण हैं कि हमने एक generic कैनरी को infra metrics के साथ शिप करने के बजाय विशेष रूप से slice-aware गेट और trace-replay observer बनाने का निर्णय लिया, जैसा हर कोई दूसरा करता है।

## LLM CI/CD सॉफ़्टवेयर CI/CD से अलग क्यों है?

संक्षिप्त संस्करण: एक LLM रिलीज़ एक deterministic artifact नहीं है। वही प्रॉम्प्ट runs में अलग-अलग आउटपुट उत्पन्न करता है। वही मूल्यांकन सेट हार्डवेयर में अलग-अलग स्कोर उत्पन्न करता है। वही मॉडल एक एग्रीगेट गुणवत्ता जाँच पास कर सकता है जबकि एक स्लाइस पर चुपचाप फ़ेल होता है जिसे आपने eval में शामिल नहीं किया था। पारंपरिक CI/CD जिन धारणाओं पर बनी थी उनमें से अधिकांश एक probabilistic सिस्टम के संपर्क में आते ही टिक नहीं पातीं।

तीन ठोस परिणाम:

1. **आप `expect(output).toEqual(X)` assertions नहीं लिख सकते।** आपको एक distribution-aware मूल्यांकन की आवश्यकता है जो किसी मानव-एंकर्ड grader के विरुद्ध rank correlation consume करे, fixture के विरुद्ध equality नहीं।
2. **एक "passed CI" मॉडल टूटा हुआ व्यवहार शिप कर सकता है।** CI पास होने का मतलब है कि code चलता है। इसका मतलब यह नहीं है कि मॉडल सही है। रिलीज़ पाइपलाइन को CI द्वारा प्रदान की गई *correctness* गेट के ऊपर एक *quality* गेट लागू करना होगा।
3. **Rollback वैकल्पिक नहीं है और धीमा नहीं है।** क्योंकि failure modes probabilistic हैं — और क्योंकि उनमें से कुछ इंफ्रास्ट्रक्चर परत पर साइलेंट हैं — rollback पथ को primary infrastructure होना चाहिए, backup plan नहीं। रिलीज़ मेनिफ़ेस्ट विशेष रूप से इसलिए मौजूद है ताकि rollback atomic हो।

इस सीरीज़ की पहली पोस्ट उन चार-चरण आर्किटेक्चर का वर्णन करती है जो इन परिणामों का जवाब देती है। यह पोस्ट उन विफलताओं का वर्णन करती है जिन्हें वह पकड़ती है।

## कस्टम LMs के लिए failure-resistant CI/CD पाइपलाइन कैसे बनाएँ?

ईमानदार उत्तर: आप स्वीकार करते हैं कि विफलताएँ होंगी और आप *विफलता होने* और *प्रोडक्शन ट्रैफ़िक के ज्ञात-अच्छे संस्करण पर लौटने* के बीच का समय कम से कम करते हैं। ऊपर की चार-चरण पाइपलाइन उस सिद्धांत का एक विशिष्ट कार्यान्वयन है, लेकिन सिद्धांत स्वयं वह है जो मायने रखता है।

यदि आप Divinci का उपयोग नहीं कर रहे हैं और कुछ समतुल्य बनाना चाहते हैं, तो load-bearing टुकड़े हैं:

- **एक अपरिवर्तनीय रिलीज़ मेनिफ़ेस्ट** जो model + prompt + routing + dataset + preprocessing को एक SHA में बंडल करता है। यही 1, 2, और 3 को catchable बनाता है। ([Stage 1](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register))
- **एक प्रति-स्लाइस गेट** जिसके थ्रेशोल्ड domain owners द्वारा परिभाषित हों, platform owners द्वारा नहीं। यही 4, 5, 6 को catchable बनाता है। ([Stage 2](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate))
- **हर checkpoint पर quality monitoring वाला एक कैनरी**, केवल latency और 5xx नहीं। यही 8 को catchable बनाता है और 9 तथा 10 को प्रोडक्शन में हिट करने पर *survivable* बनाता है। ([Stage 3](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-3-roll))
- **एक निरंतर observer** जो सक्रिय मॉडल के माध्यम से वास्तविक प्रोडक्शन ट्रेस को उसी कैलिब्रेटेड judge के साथ स्कोर करता है जिसने गेट को संचालित किया था। यही 9 और 10 को catchable बनाता है। ([Stage 4](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-4-observe-rollback-and-the-receipt))
- **हर निर्णय के लिए एक साइन्ड audit रसीद।** Hash-chained, बाहरी रूप से anchorable। open-weights मॉडल backings के लिए, रसीद एक [vindex weight-attestation](/hi/compliance/) embed करती है जो साबित करता है कि सक्रिय weights वही हैं जो मेनिफ़ेस्ट ने रजिस्टर किए। closed-API backings के लिए, रसीद decision chain को कवर करती है लेकिन weight provenance का दावा नहीं कर सकती — और audit trail इसे स्पष्ट रूप से कहता है।

टुकड़े व्यक्तिगत रूप से नए नहीं हैं। हर MLOps प्लेटफ़ॉर्म में उनमें से एक या दो हैं। संयोजन — slice-aware गेट + production-trace observer + atomic rollback + provable रसीद — वह हिस्सा है जिसे 2026 में कोई और शिप नहीं करता।

## अगला कहाँ जाएँ

- साथी पोस्ट — **[Divinci AI के साथ LLM CI/CD पाइपलाइन कैसे बनाएं](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)** — आर्किटेक्चर और API को कवर करती है।
- **[compliance पेज](/hi/compliance/)** हर रिलीज़ निर्णय का समर्थन करने वाले vindex रसीद फ़ॉर्मेट को दस्तावेज़ित करता है और यह कैसे EU AI Act, GDPR Article 17, HIPAA, और NIST AI RMF पर मैप होता है।
- **[AutoRAG प्रोडक्ट पेज](/hi/autorag/)** उस RAG-side hallucination reduction को कवर करता है जो Gate-2 और Stage-4 observer को संचालित करने वाले कैलिब्रेटेड judge के साथ स्वाभाविक रूप से जुड़ता है।
- **[API reference](/hi/api/)** — इस सीरीज़ में संदर्भित हर command एक वास्तविक endpoint है।

## FAQ

### कस्टम लैंग्वेज मॉडलों के लिए सबसे सामान्य CI/CD विफलता क्या है?

हमने जो रिलीज़ शिप की हैं उनमें, एकमात्र सबसे विनाशकारी विफलता है **एक स्लाइस-अवेयर रिग्रेशन जो एक एग्रीगेट गेट से पास हो जाती है** — एक मॉडल जो औसत पर सुधार करता है जबकि एक विशिष्ट उप-डोमेन पर चुपचाप कोलैप्स कर जाता है (ऊपर विफलताएँ 4, 5, और 6)। यह missing rollback से अधिक सामान्य है, prompt drift से अधिक सामान्य है, और दोनों से पकड़ना अधिक कठिन है। फ़िक्स structural है, पैरामीटर-ट्यूनिंग नहीं: प्रति स्लाइस गेट करें, औसत पर नहीं।

### एक खराब LLM रिलीज़ को रोलबैक करने में आपको कितना तेज़ होना चाहिए?

Order-of-magnitude सेकंड, मिनट नहीं। Divinci पाइपलाइन पर mean rollback समय लगभग 12 सेकंड है — यह ~100-replica service पर in-flight request drain है, मेनिफ़ेस्ट swap स्वयं नहीं, जो sub-second है। आर्किटेक्चरल निर्णय जो इसे संभव बनाता है वह bundled रिलीज़ मेनिफ़ेस्ट है: क्योंकि हर component (weights, prompt, routing, dataset) एक SHA से referenced है, rollback एक सिंगल atomic re-point है। इसकी तुलना सार्वजनिक postmortems से करें: Cloudflare के जून 2022 incident<sup><a href="#ref-3">[3]</a></sup> को revert करने में 44 मिनट लगे क्योंकि engineers एक-दूसरे के reverts पर step कर रहे थे; Atlassian के अप्रैल 2022 outage<sup><a href="#ref-4">[4]</a></sup> को प्रति प्रभावित site को restore करने में 12 घंटे लगे क्योंकि state कई सिस्टमों में फैला हुआ था।

### प्रॉम्प्ट परिवर्तन इतने प्रोडक्शन आउटेज क्यों पैदा करते हैं?

क्योंकि प्रॉम्प्ट्स को नियमित रूप से CI/CD पाइपलाइन के बाहर संपादित किया जाता है — डैशबोर्ड में, admin UIs में, कभी-कभी engineering review के बिना लोगों द्वारा। उनके साथ configuration की तरह व्यवहार किया जाता है, लेकिन वे code की तरह व्यवहार करते हैं। एक सिस्टम प्रॉम्प्ट में 38-अक्षर का संपादन downstream मॉडल व्यवहार को एक मॉडल retraining से अधिक बदल सकता है। फ़िक्स प्रॉम्प्ट्स को रिलीज़ मेनिफ़ेस्ट के हिस्से के रूप में रजिस्टर करना और उन्हें उसी गेट को पास करने की आवश्यकता है जिसे मॉडल पास करता है।

### LLM आउटपुट में साइलेंट क्वालिटी गिरावट का पता कैसे लगाते हैं?

इंफ्रास्ट्रक्चर metrics के साथ नहीं। Latency, 5xx rate, और token उपयोग hedging, refusal-when-an-answer-was-expected, या hallucinated dates को नहीं पकड़ेंगे। पहचान सिग्नल को वास्तविक प्रोडक्शन ट्रेस के विरुद्ध एक कैलिब्रेटेड judge द्वारा गणना किए गए *quality* score से आना चाहिए। Divinci की पाइपलाइन में Stage 4 observer सक्रिय मॉडल के माध्यम से प्रोडक्शन ट्रेस के एक rolling sample को replay करता है, उन्हें उसी मानव-एंकर्ड Spearman judge के साथ स्कोर करता है जिसने Gate-2 को संचालित किया था, और जब quality score लगातार तीन मिनट के लिए threshold से नीचे गिरता है तो automatic rollback ट्रिगर करता है।

### AI मॉडल डिप्लॉयमेंट पर कौन सी ऑडिट ट्रेल आवश्यकताएँ लागू होती हैं?

EU AI Act, GDPR Article 17 (right to erasure), HIPAA, और NIST AI Risk Management Framework सभी संगठनों से मॉडल संस्करणों, मूल्यांकन परिणामों, अनुमोदन निर्णयों, और rollouts के रिकॉर्ड बनाए रखने की अपेक्षा करते हैं। इन चारों के नीचे की अनकही आवश्यकता यह है कि रिकॉर्ड *verifiable* होने चाहिए — auditable का मतलब "हमारे पास एक log है" से अधिक है। Divinci की vindex रसीदें hash-chained और बाहरी रूप से anchorable हैं, जिसका अर्थ है कि एक auditor हमारे logs पर भरोसा किए बिना chain को verify कर सकता है। open-weights मॉडल backings के लिए रसीद एक weight-attestation भी embed करती है; closed-API backings के लिए रसीद स्पष्ट रूप से नोट करती है कि weight provenance का दावा नहीं किया गया है।

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (अप्रैल 2026)। dashboard-prompt-edit failure mode को सीधे नाम देता है। Companion: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>।
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a>। मानक इंफ्रास्ट्रक्चर-metric-driven auto-rollback। Stage 4 Observe क्या अलग कर रहा है (quality score, CloudWatch alarms नहीं) इसके लिए उपयोगी तुलना।
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>। 44-मिनट का revert क्योंकि engineers एक-दूसरे के reverts पर चले। "rollback is its own kind of incident" anchor के रूप में cited।
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>। प्रति site restore करने में 12 घंटे। State-spread-across-systems failure mode अपने सबसे बुरे रूप में।
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>। "failed deployment recovery time" elite-performer threshold एक घंटे से कम दस्तावेज़ित है। rollback पर "how fast is fast enough" के लिए उपयोगी framing।
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">Zheng et al., <em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (arXiv:2306.05685, 2023)। LLM-as-judge कुल मिलाकर human ratings से मेल खा सकता है लेकिन प्रति category में व्यापक रूप से भिन्न हो सकता है — जो ठीक वही pattern है जो प्रति-स्लाइस gating आवश्यक बनाता है — के लिए reference।
  </li>
</ol>

---

*इस सीरीज़ में अगला:* **विनियमित क्षेत्रों में कस्टम LMs को validate और release करना।** ऊपर की पाइपलाइन आर्किटेक्चर है। Compliance pathway इसका उपयोग करने का अभ्यास है। EU AI Act, GDPR Article 17, HIPAA, और NIST AI RMF — हर एक एक रिलीज़ प्रक्रिया से क्या माँगता है, और कौन-से vindex रसीद फ़ील्ड कौन-सी आवश्यकता को कवर करते हैं।
