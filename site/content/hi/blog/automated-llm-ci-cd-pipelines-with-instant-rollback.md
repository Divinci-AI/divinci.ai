+++
title = "इंस्टैंट रोलबैक के साथ ऑटोमेटेड LLM CI/CD पाइपलाइन"
description = "चार-चरण रिलीज़ पाइपलाइन की ऑपरेशनल परत: कौन से निर्णय स्वचालित होते हैं, असली रोलबैक ड्रिल कैसी दिखती है, और MTTR नंबर।"
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
summary = "मानवीय अनुमोदन गेट्स के बीच, एक LLM रिलीज़ पाइपलाइन या तो ख़ुद चलती है या नहीं चलती। यह पोस्ट आर्किटेक्चर पोस्ट का ऑपरेशनल साथी है — यह ऑटोमेशन स्पेक्ट्रम खींचता है (कौन से निर्णय अपने आप फायर होते हैं, किनमें मानवीय हस्तक्षेप चाहिए, और किनमें हम तब तक हार्ड-स्टॉप करते हैं जब तक कोई ओवरराइड पर हस्ताक्षर न कर दे), असली रोलबैक ड्रिल कैसी दिखती है यह दिखाता है, और इसके दूसरी तरफ़ से जो MTTR नंबर निकलता है उसके साथ ख़त्म होता है।"
+++

*रिलीज़ साइकल से नोट्स — भाग V*

---

पिछली तिमाही में जो सबसे ज़्यादा उद्धृत पेज बाहर नहीं गया वह वही था जिसे हमारे observer ने 2:14 AM पर अपने आप फायर किया। कैंडिडेट रिलीज़ ने गेट पार कर लिया था, ज़रूरी चार मिनट तक 5% पर रुकी, 25% तक बढ़ी, और फिर वहीं अटक गई। प्रति-मिनट क्वालिटी मॉनिटर ने legal-domain स्लाइस पर लगातार तीन सब-थ्रेशोल्ड रीडिंग देखीं, रोलआउट रोक दिया, और routing को पिछली रिलीज़ पर वापस पॉइंट कर दिया। जब तक on-call इंजीनियर का notification फायर हुआ — रसीद के लिए, outage के लिए नहीं — तब तक प्रोडक्शन ट्रैफ़िक नौ मिनट से known-good रिलीज़ पर वापस था।

किसी को कुछ करने की ज़रूरत नहीं थी। [इस सीरीज़ की पहली पोस्ट](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) से आर्किटेक्चर बताती है कि चार चरण क्या हैं। यह पोस्ट इस बारे में है कि मानवीय अनुमोदनों के बीच क्या चलता है — आर्किटेक्चर के नीचे की ऑटोमेशन परत, वह सीमा जहाँ पाइपलाइन या तो अपने आप सही काम करती है या नहीं।

हेडलाइन दावा: **ज़्यादातर पाइपलाइन निर्णय ऑटोमेटेड होने चाहिए, लेकिन सभी नहीं**। सीमा मायने रखती है। जो पाइपलाइन सब कुछ ऑटोमेट करती है वह आख़िरकार ऐसी रिलीज़ को प्रमोट करेगी जिसे एक इंसान को पकड़ना चाहिए था; जो पाइपलाइन कुछ भी ऑटोमेट नहीं करती उसका कोई मक़सद नहीं है। सीमा सही ढंग से खींचना ही इस पोस्ट का विषय है।

## ऑटोमेशन स्पेक्ट्रम

हर पाइपलाइन निर्णय एक स्पेक्ट्रम पर कहीं बैठता है — *"अपने आप फायर हो जाता है, कोई मानवीय notification नहीं"* से लेकर *"बिना स्पष्ट हस्ताक्षरित अनुमोदन के आगे बढ़ने से इनकार कर देता है"* तक। नीचे दिखाया गया है कि हमारी शिप की गई पाइपलाइन में हर load-bearing पाइपलाइन action उस स्पेक्ट्रम पर कहाँ बैठती है।

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="ऑटोमेशन स्पेक्ट्रम। बाईं ओर पूरी तरह ऑटोमेटेड से लेकर दाईं ओर हमेशा मानवीय अनुमोदन आवश्यक। प्लॉट किए गए निर्णय: पूरी तरह-ऑटोमेटेड छोर पर, प्रति-मिनट क्वालिटी मॉनिटर मूल्यांकन, कैनरी चेकपॉइंट हेल्थ चेक, और ऑटो-रोलबैक ट्रिगर; बीच में, गेट-पास advance और कैनरी चेकपॉइंट प्रमोशन; मानवीय ओर, प्रोडक्शन डिप्लॉयमेंट रजिस्ट्रेशन और मैनिफ़ेस्ट कमिट; हमेशा-मानवीय छोर पर, गेट-फेल ओवरराइड निर्णय और cold-start रिलीज़ शैडो डिप्लॉयमेंट।">
<title>ऑटोमेशन स्पेक्ट्रम</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">ऑटोमेशन स्पेक्ट्रम</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">हर load-bearing पाइपलाइन निर्णय कहाँ बैठता है, पूरी तरह स्वायत्त (बाएँ) से हमेशा-मानवीय (दाएँ) तक।</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">पूरी तरह ऑटोमेटेड</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">अपने आप फायर,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">कोई notification नहीं</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">केवल-सूचना</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">अपने आप चलता है;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">रसीद + पेज</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">ठीक-हो-तो-आगे</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">मानव ज्ञात विंडो</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">में वीटो कर सकता है</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">मानव-शुरू</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">स्पष्ट यूज़र</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">action आवश्यक</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">हमेशा-मानव</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">हस्ताक्षरित कारण</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">बिना इनकार</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Observer प्रति-मिनट</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">क्वालिटी eval</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">5% trace sample पर</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">लगातार चलता है</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">कैनरी चेकपॉइंट</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">हेल्थ चेक</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">5/25/100 पर p95 +</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">5xx + output क्वालिटी</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">ऑटो-रोलबैक</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">ट्रिगर</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 लगातार मिनट</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">थ्रेशोल्ड से नीचे</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">गेट-पास advance</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">कैनरी तक</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">सभी स्लाइसें ≥ थ्रेशोल्ड</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ 5% पर ऑटो-स्टार्ट</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">चेकपॉइंट</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">dwell के दौरान मॉनिटर</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">टिकें तो आगे बढ़ता है</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">रिलीज़</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">रजिस्ट्रेशन</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">कस्टमर नया मैनिफ़ेस्ट</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">कमिट करता है</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">गेट-फेल ओवरराइड</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">ऑडिट लॉग में लिखित</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">कारण आवश्यक</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">लाल मार्कर</tspan> = वे दो निर्णय जहाँ पाइपलाइन व्यवहार असममित है: ऑटो-रोलबैक अपने आप फायर होता है और आपको opt out करने का विकल्प नहीं मिलता; गेट-फेल ओवरराइड आगे बढ़ने से इनकार करता है और आपको कारण skip करने का विकल्प नहीं मिलता।</text>
</svg>
</figure>

ऊपर के मार्करों में से दो अपने ज़ोन के रंग के बजाय लाल हैं। वे असममित निर्णय हैं — दो जगहें जहाँ पाइपलाइन एक मज़बूत पोज़िशन लेती है कि कौन क्या निर्णय ले सकता है। **ऑटो-रोलबैक ट्रिगर** बिना पूछे फायर होता है; आप इसे बंद कॉन्फ़िगर नहीं कर सकते, क्योंकि इसके होने का पूरा मक़सद ही यह है कि यह 2:14 AM पर काम करे। **गेट-फेल ओवरराइड** बिना लिखित कारण के आगे बढ़ने से इनकार कर देता है; आप उसे भी बंद कॉन्फ़िगर नहीं कर सकते, क्योंकि इसके होने का पूरा मक़सद यह है कि भविष्य का आप यह कारण पढ़ सके। बाक़ी पाइपलाइन का ज़्यादातर हिस्सा कॉन्फ़िगर करने योग्य है; ये दोनों नहीं हैं।

## ऑटो-रोलबैक असल में कैसे फायर होता है

ऑटो-रोलबैक के बारे में सबसे ज़्यादा पूछा गया सवाल है *"इसे ग़लत वजह से फायर होने से क्या रोकता है?"* ईमानदार उत्तर है: अकेले कुछ नहीं। सुरक्षा इस बात से आती है कि ट्रिगर कैसे वायर किया गया है।

Observe चरण एक प्रति-मिनट scoring loop चलाता है। हर मिनट यह:

1. सक्रिय रिलीज़ से हाल के production traces का एक छोटा सेट sample करता है।
2. हर trace को *सक्रिय मॉडल* (कैंडिडेट नहीं — हम वही score कर रहे हैं जो असल में serve हो रहा है) के माध्यम से replay करता है।
3. हर replay को उसी calibrated human-anchored judge से score करता है जिसने Gate-2 चलाया था<sup><a href="#ref-1">[1]</a></sup>।
4. sample पर एक single output-quality score compute करता है। उसे `CanaryHealthSample` में लिखता है।

रोलबैक तब फायर होता है जब **लगातार तीन प्रति-मिनट sample** रोलबैक थ्रेशोल्ड से नीचे गिरते हैं (default: गेट थ्रेशोल्ड का 0.85 — यानी 0.55 अगर गेट 0.65 था)। एक बुरा मिनट नहीं; तीन। तीन-मिनट का lockout noise filter है — एक अकेली असामान्य reading कुछ भी ट्रिगर नहीं करती, लेकिन निरंतर regression करता है।

जब lockout टूटता है, तो रोलबैक worker execute करता है:

```bash
# असर में — पाइपलाइन यह अपने आप चलाती है। कोई मानवीय ack नहीं।
POST /api/v1/releases/<previous_release_sha>/activate
# response <1s में; ~100-replica service पर in-flight drain ~12s में
```

एक रसीद फायर होती है। on-call इंजीनियर को Slack notification दिखती है *रसीद के लिए*, outage के लिए नहीं। वे रसीद खोलते हैं; उन्हें तीन सब-थ्रेशोल्ड readings, बीता समय, और `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup> hashes दिखते हैं। बारह सेकंड in-flight drain time है; swap ख़ुद sub-second का है। जब तक इंजीनियर इतना जाग जाता है कि पूछे "क्या मुझे कुछ करना है?" तब तक उत्तर है "नहीं, लेकिन आपको फिर भी देखना चाहिए कि गेट ने इसे क्यों पास होने दिया।"

## असली ऑटो-रोलबैक रसीद

production में रसीद ऐसी दिखती है। वही hash-chained format जो [compliance पेज](/hi/compliance/) पर documented है, ऑटो-रोलबैक event के लिए विशिष्ट अतिरिक्त fields के साथ:

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

रसीद ख़ुद on-call का पहला संपर्क बिंदु है। इसे पढ़ने से वे सवाल जवाब मिलते हैं जो एक आधा-जागा इंजीनियर असल में पूछेगा: क्या ट्रिगर किया, कौन सी स्लाइस फेल हुई, कितने से, swap कितना समय लगा, अभी क्या चल रहा है। अगला-action prompt वहाँ से आम तौर पर है *"जाओ और देखो कि गेट ने इसे पहले स्थान पर क्यों पास किया"* — जिसके लिए फेल होने वाली रिलीज़ की रसीद में पहले से प्रति-स्लाइस Spearman टेबल है।

## पाइपलाइन अपने आप क्या नहीं करती

"ऑटो-रोलबैक बिना पूछे फायर होता है" का पूरक यह है कि कुछ अन्य चीज़ें सक्रिय रूप से नहीं हो सकतीं। तीन स्पष्ट इनकार।

**यह बिना हस्ताक्षरित ओवरराइड के गेट फेल हुई रिलीज़ को प्रमोट नहीं करती।** एक गेट-फेल रिलीज़ को `gate_fail` के रूप में मार्क करता है; `/activate` endpoint मैनिफ़ेस्ट SHA स्वीकार करने से इनकार करता है; कोई command-line incantation इसके आसपास काम नहीं करती। आगे का एकमात्र रास्ता `forceGateOverride: true` AND `overrideReason: "<free text>"` के साथ force-override है। reason field आवश्यक है, free-text है, और user ID के साथ ऑडिट लॉग में जाता है। हमने इसे इस तरह डिज़ाइन किया है कि भविष्य का आप पढ़ सके कि वर्तमान के आप ने क्यों तय किया कि स्लाइस regression स्वीकार्य था। तीन लोगों ने ओवरराइड path को असली दुनिया में इस्तेमाल किया है। उनके कारण अभी भी ऑडिट लॉग में हैं।

**यह कैनरी से 100% तक तब नहीं बढ़ती जब कोई मॉनिटर degrade हो रहा हो।** अगर p95 latency, 5xx rate, OR output-quality score चेकपॉइंट dwell के अंत में अपने band के बाहर है, पाइपलाइन उस चेकपॉइंट पर रुकती है और पेज करती है। यह आगे बढ़कर बाद में माफ़ी नहीं माँगती।

**यह cold-start रिलीज़ को ऑटो-कैनरी नहीं करती।** एक रिलीज़ जिसका production traffic का कोई इतिहास नहीं है — जैसे एक नए dataset के ख़िलाफ़ नई fine-tune — के पास अपनी output क्वालिटी की तुलना करने के लिए कुछ नहीं है। पाइपलाइन cold-start रिलीज़ पर कैनरी शुरू करने से इनकार करती है। हमें पहले 24-घंटे की shadow deployment चाहिए, जो कैंडिडेट को असली production traces के ख़िलाफ़ observe करती है लेकिन उसके किसी जवाब को serve नहीं करती। 24 घंटों के बाद हमारे पास एक क्वालिटी baseline होती है; तब कैनरी आगे बढ़ सकती है। धीमा; ईमानदार; कॉन्फ़िगर करने योग्य नहीं।

## रिकवरी कितनी तेज़ है, end-to-end?

जो recovery time number हम publish करते हैं वह **12 सेकंड** है। यह ~100-replica service पर in-flight drain है। मैनिफ़ेस्ट swap ख़ुद sub-second का है। पाठक के लिए उपयोगी होने के लिए, 12 सेकंड को decompose करना ज़रूरी है:

- **रोलबैक से पहले 0–60 सेकंड:** लगातार तीन सब-थ्रेशोल्ड readings आती हैं। पहली सब-थ्रेशोल्ड reading lockout timer शुरू करती है। हर अगला मिनट lockout बढ़ाता है अगर क्वालिटी अभी भी थ्रेशोल्ड से नीचे है।
- **t = 0:** तीसरी सब-थ्रेशोल्ड reading `CanaryHealthSample` में लिखती है। रोलबैक worker तीसरी strike देखता है और `/activate previous_release` dispatch करता है।
- **t < 1 सेकंड:** routing layer का active-release pointer (Redis में) flip होता है। नई requests पिछली रिलीज़ पर hit करना शुरू करती हैं।
- **t = 1 से ~12 सेकंड:** कैंडिडेट रिलीज़ उन requests को serve करना जारी रखती है जो swap होने पर in flight थीं। In-flight drain। कुछ streaming responses को स्वाभाविक रूप से पूरा होने में 8–10 सेकंड लगते हैं, इसलिए cleanup tail एक सामान्य service पर लगभग 12s है।
- **t ≈ 13 सेकंड:** ऑडिट लॉग रसीद लिखी और signed होती है। notification फायर होती है।

जिन public postmortems को हम anchor के तौर पर उद्धृत करते रहते हैं उनकी तुलना में: Cloudflare के June 2022 outage<sup><a href="#ref-3">[3]</a></sup> को "हमें पता है क्या revert करना है" से "revert पूरा है" तक 44 मिनट लगे — और वह *infrastructure* tier था। Atlassian के April 2022 outage<sup><a href="#ref-4">[4]</a></sup> को प्रति site 12 घंटे लगे क्योंकि state कई systems में बंटी थी। DORA का<sup><a href="#ref-5">[5]</a></sup> failed-deployment recovery के लिए "elite performer" थ्रेशोल्ड एक घंटे से कम है। बारह सेकंड elite threshold से order-of-magnitude बेहतर नहीं है — यह तीन orders of magnitude बेहतर है। आर्किटेक्चरल निर्णय जो इसे संभव बनाता है वह [Stage 1](/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) से bundled release manifest है। मैनिफ़ेस्ट के बिना, आपके पास routing को re-point करने के लिए एक भी object नहीं है।

## रोलबैक ड्रिल — वह अनाकर्षक practice जिसे कोई नहीं चलाता

यहाँ वह हिस्सा है जिसे ज़्यादातर teams skip करती हैं: **एकमात्र विश्वसनीय संकेत कि आपका रोलबैक path काम करता है यह है कि आपने एक जानबूझकर, scheduled drill चलाई और confirm किया।** हर तिमाही हम एक चलाते हैं। ड्रिल इस तरह जाती है:

1. एक randomly-scheduled, weekday-business-hours समय चुनें। team को बताएँ कि यह आ रहा है, लेकिन विशिष्ट घंटा नहीं।
2. कैनरी स्लाइस पर एक synthetic quality regression inject करें। (हमारे पास एक test-mode flag है जो कैंडिडेट मॉडल को एक magic header के साथ "I refuse to answer" के साथ respond करने देता है — calibrated judge को fail करने की गारंटी।)
3. test रिलीज़ को गेट के माध्यम से push करें (यह पास होती है — हम रोलबैक test कर रहे हैं, गेट नहीं)। एक कैनरी शुरू करें।
4. Observer तीन सब-थ्रेशोल्ड readings देखता है। ऑटो-रोलबैक फायर होता है।
5. on-call इंजीनियर की प्रतिक्रिया का इंतज़ार करें। समय लें कि उन्हें कितनी देर लगती है। नोट करें कि क्या वे रसीद पर इतना भरोसा करते हैं कि alarmed पर वापस पेज *न* करें।
6. verify करें कि ऑडिट लॉग रोलबैक रसीद में test-mode flag दिखाता है, ताकि भविष्य के ऑडिट एक ड्रिल को असली incident से अलग कर सकें।

हमारी पहली ड्रिल end-to-end 19 सेकंड लगी (12s swap + एक 7s settling delay जिसे हमें fix करना पड़ा)। सबसे हाल की ड्रिल — Q1 2026 — को 12 सेकंड लगे। ड्रिल को skip करने का विकल्प कभी नहीं मिलता। हर तिमाही; हर customer cluster।

ज़्यादातर teams ने कभी जानबूझकर रोलबैक ड्रिल नहीं चलाई। पहली बार उनका रोलबैक path एक असली incident के दौरान चलता है, दबाव में, कई लोगों के साथ call में। ड्रिल ही वह है जो 12-सेकंड के number को aspirational के बजाय असली number बनाता है।

## यह क्या हल नहीं करता

तीन ईमानदार सीमाएँ:

**ऑटो-रोलबैक ping-pong कर सकता है।** अगर कैंडिडेट AND पिछली रिलीज़ दोनों बुरी हैं — कहें, पिछली रिलीज़ में भी एक धीरे-विकसित होती स्लाइस regression थी जिसे किसी ने नहीं पकड़ा — पाइपलाइन रोल बैक कर सकती है, फिर पिछली रिलीज़ भी अपना post-rollback observer fail करती है, और रोल बैक करने के लिए कोई तीसरी रिलीज़ नहीं है। पाइपलाइन thrash करने के बजाय traffic को maintenance पेज पर रोक देती है। fix यह है कि मैनिफ़ेस्ट chain में एक से अधिक पिछली healthy रिलीज़ indexed रखें ताकि रोलबैक target कॉन्फ़िगर करने योग्य हो।

**Observer inference cost जोड़ता है।** सक्रिय मॉडल के माध्यम से 5% sample पर production traces को replay करना inference spend में लगभग 5% जोड़ता है। हमें लगता है यह सही trade है। कुछ customers सोचते हैं कि low-margin workloads पर यह बहुत महँगा है और sample rate को कम dial करना चाहते हैं। dial मौजूद है।

**एक बुरा judge बिना judge से बुरा है।** अगर calibrated judge जो observer को drive करता है ख़ुद miscalibrated है — human anchor से drift कर गया है, या stale corpus पर trained है — observer ग़लत वजह से ऑटो-रोलबैक फायर कर सकता है। recalibration cadence मायने रखती है। Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup> piece procedure documents करता है; ऑपरेशनल आवश्यकता यह है कि आप वास्तव में इसे चलाएँ।

## FAQ

### रोलबैक ट्रिगर एक मिनट के बजाय लगातार तीन मिनट क्यों है?

क्योंकि LLM quality scores में noise floor होता है — एक अकेली असामान्य मिनट reading एक sampling quirk से आ सकती है (5% trace sample एक कठिन स्लाइस पर पड़ गया), असली regression से नहीं। तीन-मिनट का lockout सबसे सस्ता noise filter है जो अभी भी कुल reaction time को डेढ़ मिनट से कम रखता है। हमने दोनों तरह tune किया है; हमारे customers के सामान्य traffic shape के लिए तीन sweet spot है। dwell प्रति रिलीज़ कॉन्फ़िगर करने योग्य है अगर आपका traffic shape अलग है।

### क्या ऑटो-रोलबैक "off" तक कॉन्फ़िगर करने योग्य होना चाहिए?

हमारी शिप की गई पाइपलाइन में, नहीं। एक ऑटोमेटेड safety mechanism होने का मक़सद यह है कि यह 2:14 AM पर काम करे जब कोई नहीं देख रहा। configurable-off ऑटो-रोलबैक एक sticky note है जो कहता है "हमारे पास पहले एक safety net थी।" इसे configurable बनाने का तर्क यह है कि कुछ workloads किसी भी false-positive rollbacks को justify करने के लिए बहुत low-stakes हैं। हमें लगता है वह तर्क ग़लत जगह ले जाता है — अगर आपका workload ऑटो-रोलबैक के लिए बहुत low-stakes है, तो आपको release pipeline की भी ज़रूरत नहीं।

### आप उस मामले को कैसे handle करते हैं जब पिछली रिलीज़ भी बुरी थी?

रोलबैक target default रूप से `previous_release` है, लेकिन मैनिफ़ेस्ट chain केवल N-1 से अधिक history store करती है। Operators किसी भी historically-healthy मैनिफ़ेस्ट SHA पर रोलबैक re-target कर सकते हैं — `/api/v1/releases/<historically_good_sha>/activate` — जो manual-intervention path है जब automatic N-1 रोलबैक एक बुरी पुरानी रिलीज़ पर hit करता है। Escape valve वहाँ है। यह दुर्लभ है।

### सही metric optimize करने के लिए क्या है — MTTR या MTBF?

MTTR — Mean Time To Recovery — बड़े अंतर से, कम से कम LLM systems के लिए। MTBF (Mean Time Between Failures) "failure" की एक deterministic धारणा मानता है जो LLM workloads के पास नहीं है। Output क्वालिटी लगातार drift करती है; "failure" एक threshold call है। तेज़ recovery के लिए optimize करना उस जगह के लिए robust है जहाँ आप threshold खींचते हैं; कभी fail न होने के लिए optimize करना brittle और false है। DORA का elite threshold<sup><a href="#ref-5">[5]</a></sup> ख़ुद MTTR terms में framed है, जो सही framing है।

### क्या आप वास्तव में रोलबैक ड्रिल चलाते हैं?

हाँ — तिमाही, scheduled, रसीद में एक test-mode flag के साथ ताकि ऑडिट लॉग में ड्रिल को असली incident से अलग किया जा सके। हमने जो पहली ड्रिल चलाई उसने एक 7-सेकंड का settling delay उजागर किया जिसके बारे में हमें पता नहीं था कि वह वहाँ है। ड्रिल ही एकमात्र तरीक़ा है यह जानने का कि path वास्तव में काम करता है; runbook पढ़ना काफ़ी नहीं है। ज़्यादातर teams ने एक नहीं चलाई है, इसलिए ज़्यादातर teams के MTTR numbers मापे गए के बजाय aspirational हैं।

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge calibration.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). The anchor for why a calibrated judge is necessary and why per-slice agreement matters more than aggregate agreement. The observer's per-minute scoring loop depends on this.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vindex weight-attestation.</strong> Documented on the <a href="/hi/compliance/">Divinci compliance page</a> and walked through in the <a href="/hi/blog/validating-and-releasing-custom-lms-in-regulated-fields/">regulated-fields post</a>. The `vindex_sha256_before/after` fields in the auto-rollback receipt are the cryptographic anchor an auditor can verify without trusting our logs.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Forty-four minutes to revert at the infrastructure tier, in part because engineers walked over each other's reverts. Anchor for the "manifest-driven swap can't have that failure mode" claim.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian April 2022 outage.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 hours per site to restore, 14 days total for 883 sites, because state was split across independently-versioned systems. Anchor for the "bundled release manifest is the thing that makes seconds-not-hours possible" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>DORA failed-deployment recovery threshold.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. The "failed deployment recovery time" elite-performer threshold is documented as under one hour. The 12-second pipeline number is three orders of magnitude below the elite threshold, which is the right way to read the comparison.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrating the AI judge.</strong> Our companion post <a href="/hi/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. The procedure for keeping the human-anchored judge in calibration over time. The operational claim in this post — that auto-rollback only works as well as the judge driving it — only holds if the judge is in fact periodically recalibrated.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — Divinci pipeline reference.</strong> The architecture this automation layer sits under: the <a href="/hi/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">four-stage pipeline post</a>. The full API surface is documented at the <a href="/hi/api/">API reference</a>; the release-management section is the one this post is talking about.
</li>
</ol>

---

*इस सीरीज़ में अगला:* **2026 में Custom Language Models के लिए CI Testing।** यह पोस्ट मानवीय अनुमोदनों के बीच की ऑपरेशनल परत के बारे में है। अगली पाइपलाइन शुरू होने *से पहले* की परत है — pre-merge CI: PR समय पर क्या evaluate करना है, किस तरह की regressions आप वास्तव में गेट से पहले पकड़ते हैं, और किस तरह की नहीं पकड़ते।
