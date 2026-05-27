+++
title = "RAG रूटिंग — एक API, अनेक आर्किटेक्चर"
description = "Divinci की RAG रूटिंग हर क्वेरी को उस सबसे सस्ते बैकएंड पर भेजती है जो उसका सही उत्तर दे सके। दस समर्थित रिट्रीवल इंजन (PageIndex, neo4j-hybrid, RAPTOR, LightRAG, Qdrant, Cloudflare Vectorize, Couchbase, Vertex AI, MongoDB Atlas, Redis Vector) एक ही एंडपॉइंट के पीछे, सीखी हुई प्रति-प्रश्न रूटिंग के साथ।"
template = "feature.html"
[extra]
hero_poster = "images/hero-autorag.webp"
feature_category = "data-management"
+++

<style>
/* Page-specific Leonardo journal background — reuses the AutoRAG art */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-autorag.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

.section-padding { padding: 4rem 0; }

.section-heading {
    font-family: 'Fraunces', serif;
    font-size: 2.6rem;
    color: #1e3a2b;
    text-align: center;
    margin-top: 4rem;
    margin-bottom: 2.5rem;
    line-height: 1.2;
}

.section-subheading {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.1rem;
    color: #5a6862;
    text-align: center;
    max-width: 760px;
    margin: -1.5rem auto 3rem;
    line-height: 1.55;
}

/* Tier cards (three across on desktop, stacked on mobile) */
.rr-tier-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1.5rem;
    max-width: 1180px;
    margin: 0 auto;
    padding: 0 1rem;
}

.rr-tier {
    background: #faf8f5;
    border-radius: 12px;
    overflow: hidden;
    border: 1.5px solid;
    display: flex;
    flex-direction: column;
}

.rr-tier .rr-tier-head {
    color: #faf8f5;
    font-weight: 700;
    font-size: 1.15rem;
    text-align: center;
    padding: 1rem 1.25rem;
}

.rr-tier .rr-tier-body { padding: 1.25rem 1.5rem 1.75rem; flex: 1; }
.rr-tier .rr-badge {
    display: inline-block;
    border-radius: 999px;
    padding: 0.25rem 0.85rem;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    margin-bottom: 1rem;
}
.rr-tier .rr-flow {
    font-family: 'DM Mono', monospace;
    color: #2d3c34;
    font-size: 0.92rem;
    line-height: 1.55;
    margin-bottom: 1rem;
}
.rr-tier h4 {
    font-size: 0.92rem;
    color: #1e3a2b;
    margin: 0.85rem 0 0.35rem;
    font-weight: 700;
}
.rr-tier p {
    font-size: 0.95rem;
    color: #3a4a40;
    line-height: 1.6;
    margin: 0 0 0.5rem;
}
.rr-tier .rr-stats {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.35rem 0.85rem;
    margin-top: 0.75rem;
    font-size: 0.92rem;
    color: #2d3c34;
}
.rr-tier .rr-stats strong { font-weight: 700; }

.rr-tier-1 { border-color: #7a8a4a; }
.rr-tier-1 .rr-tier-head { background: #7a8a4a; }
.rr-tier-1 .rr-badge { background: rgba(122,138,74,0.15); color: #5a6c2a; }

.rr-tier-2 { border-color: #5a7a8f; }
.rr-tier-2 .rr-tier-head { background: #5a7a8f; }
.rr-tier-2 .rr-badge { background: rgba(90,122,143,0.15); color: #3a5060; }

.rr-tier-3 { border-color: #2d5a4f; }
.rr-tier-3 .rr-tier-head { background: #2d5a4f; }
.rr-tier-3 .rr-badge { background: rgba(45,90,79,0.15); color: #1e3a2b; }

@media (max-width: 900px) {
    .rr-tier-grid { grid-template-columns: 1fr; }
}

/* Mechanism + backend sections */
.rr-mechanism {
    max-width: 980px;
    margin: 2.5rem auto;
    padding: 2rem 2.25rem;
    background: rgba(232, 221, 199, 0.25);
    border-radius: 12px;
    border: 1px solid rgba(139, 118, 89, 0.2);
}
.rr-mechanism h3 {
    font-family: 'Fraunces', serif;
    color: #1e3a2b;
    font-size: 1.6rem;
    margin: 0 0 1rem;
}
.rr-mechanism ol {
    padding-left: 1.5rem;
    color: #2d3c34;
    font-size: 1rem;
    line-height: 1.7;
}
.rr-mechanism li { margin-bottom: 0.5rem; }
.rr-mechanism li strong { color: #1e3a2b; }
.rr-mechanism .rr-note {
    margin-top: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(184, 160, 128, 0.12);
    border-left: 3px solid #b8a080;
    border-radius: 4px;
    font-size: 0.95rem;
    color: #4a4030;
}

/* Backend chip grid */
.rr-backends {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 0.85rem;
    max-width: 980px;
    margin: 1.5rem auto;
    padding: 0 1rem;
}
.rr-backend-chip {
    background: #faf8f5;
    border: 1.5px solid rgba(139, 118, 89, 0.3);
    border-radius: 10px;
    padding: 0.85rem 1rem;
    display: flex;
    gap: 0.75rem;
    align-items: flex-start;
}
.rr-backend-logo {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 6px;
    background: #f3ede0;
    padding: 4px;
    object-fit: contain;
    display: block;
}
.rr-backend-monogram {
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border-radius: 6px;
    color: #faf8f5;
    font-family: 'DM Sans', sans-serif;
    font-weight: 700;
    font-size: 0.78rem;
    letter-spacing: 0.5px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.rr-backend-monogram.mono-pageindex { background: #2d5a4f; }
.rr-backend-monogram.mono-raptor    { background: #5a8a6c; }
.rr-backend-monogram.mono-lightrag  { background: #7a8a4a; }
.rr-backend-body { flex: 1; min-width: 0; }
.rr-backend-chip strong {
    display: block;
    color: #1e3a2b;
    font-size: 0.95rem;
    margin-bottom: 0.15rem;
}
.rr-backend-chip span {
    color: #5a6862;
    font-size: 0.85rem;
    line-height: 1.45;
    display: block;
}
.rr-backend-chip.tier3 { border-color: #2d5a4f; }
.rr-backend-chip.tier1 { border-color: #7a8a4a; }
.rr-backend-chip.tier2-roadmap { border-color: #5a7a8f; border-style: dashed; }

/* Code example — explicit colors on every descendant so theme rules
   from base.html can't accidentally make text invisible on the dark
   background. Smart-quote conversion is disabled by wrapping in <code>. */
.rr-code-wrap {
    max-width: 980px;
    margin: 2rem auto;
    padding: 0 1rem;
}
.rr-code-wrap pre {
    background: #1e2a26 !important;
    border-radius: 10px;
    padding: 1.25rem 1.5rem;
    overflow-x: auto;
    margin: 0;
    color: #e8e3d8 !important;
}
.rr-code-wrap pre code.rr-code-block,
.rr-code-wrap pre code.rr-code-block * {
    color: #e8e3d8 !important;
    background: transparent !important;
    font-family: 'DM Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace !important;
    font-size: 0.88rem;
    line-height: 1.6;
    white-space: pre;
}
.rr-code-wrap pre code.rr-code-block .rr-code-comment {
    color: #b8a080 !important;
}

/* Competitor table */
.rr-vs {
    max-width: 1080px;
    margin: 2rem auto;
    padding: 0 1rem;
    overflow-x: auto;
}
.rr-vs table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.93rem;
}
.rr-vs th {
    background: #2d5a4f;
    color: #faf8f5;
    text-align: left;
    padding: 0.75rem 0.9rem;
    font-weight: 700;
}
.rr-vs td {
    padding: 0.75rem 0.9rem;
    border-bottom: 1px solid #d6c7a8;
}
.rr-vs tr:nth-child(even) td { background: rgba(232, 221, 199, 0.3); }
.rr-vs td:first-child { font-weight: 600; color: #1e3a2b; }

/* Cross-links footer */
.rr-cross-links {
    max-width: 980px;
    margin: 3rem auto 4rem;
    padding: 1.5rem 2rem;
    background: rgba(45, 90, 79, 0.06);
    border-radius: 12px;
    text-align: center;
}
.rr-cross-links a {
    color: #2d5a4f;
    font-weight: 600;
    text-decoration: none;
    border-bottom: 1px solid rgba(45, 90, 79, 0.3);
}
.rr-cross-links a:hover { border-bottom-color: #2d5a4f; }
</style>

<section class="section-padding">
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">RAG रूटिंग</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">एक API एंडपॉइंट। दस समर्थित रिट्रीवल आर्किटेक्चर। राउटर आपके ऐतिहासिक क्वेरी ट्रैफ़िक से सीखता है और हर नए प्रश्न को उस बैकएंड पर भेजता है जो उसका सही उत्तर देने की सबसे अधिक संभावना रखता है — उस सबसे कम लागत पर जो अभी भी आपके गुणवत्ता मानक को पूरा करती है।</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">हमसे बात करें</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">गहन विश्लेषण पढ़ें →</a>
  </p>
</section>

<h2 class="section-heading">तीनों आर्किटेक्चर, संकल्पनात्मक रूप से</h2>

<p class="section-subheading">अधिकांश प्रोडक्शन RAG सिस्टम एक रिट्रीवल आर्किटेक्चर शिप करते हैं और उसे ही पूर्ण मान लेते हैं। हम एक राउटर शिप करते हैं जो आर्किटेक्चरल रूप से भिन्न स्टैक्स में से चयन करता है — आपके कॉर्पस में हर क्वेरी के लिए सही विकल्प शायद ही कभी एक जैसा होता है।</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · फ़्लैट-वेक्टर RAG</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>किसके लिए सर्वोत्तम</h4>
    <p>एकल-तथ्य लुकअप, FAQ-आकार की क्वेरीज़, फ़्लैट-चंक किए गए कॉर्पस पर "X क्या है?" जैसे प्रश्न।</p>
    <div class="rr-stats">
      <strong>लेटेंसी:</strong><span>&lt; 300 ms p95</span>
      <strong>लागत:</strong><span>प्रति क्वेरी कुछ पैसे</span>
      <strong>बैकएंड्स:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · हाइब्रिड + रीरैंक</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>किसके लिए सर्वोत्तम</h4>
    <p>वे क्वेरीज़ जहाँ शाब्दिक और सिमेंटिक संकेत असहमत होते हैं — कोड, नाम, संक्षिप्ताक्षर, तकनीकी शब्दावली, एरर स्ट्रिंग्स।</p>
    <div class="rr-stats">
      <strong>लेटेंसी:</strong><span>~ 800 ms</span>
      <strong>लागत:</strong><span>अभी भी कम</span>
      <strong>आज:</strong><span>कंपोज़ेबल वर्कफ़्लो नोड · ऑटो-राउटर रोडमैप पर</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · पेज-इंडेक्स + एजेंट</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>किसके लिए सर्वोत्तम</h4>
    <p>लंबे संरचित दस्तावेज़ों का बहु-चरणीय (मल्टी-हॉप) पठन — कानूनी अनुबंध, वित्तीय 10-K, तकनीकी PDF जहाँ संदर्भ गैर-निकटवर्ती सेक्शनों में फैला होता है।</p>
    <div class="rr-stats">
      <strong>लेटेंसी:</strong><span>कई सेकंड</span>
      <strong>लागत:</strong><span>सर्वाधिक — पर तभी जब ज़रूरी हो</span>
      <strong>बैकएंड:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">राउटर वास्तव में कैसे निर्णय लेता है</h2>

<p class="section-subheading">अधिकांश प्रकाशित RAG राउटर क्वेरी को पहले से ही जटिलता के आधार पर वर्गीकृत करते हैं। हमारा नहीं करता। हम <strong>सीखी हुई रूटिंग</strong> का उपयोग करते हैं: हर सफल क्वेरी उस बैकएंड के साथ संग्रहीत की जाती है जिसने उसका उत्तर दिया, और नई क्वेरीज़ का मिलान एम्बेडिंग समानता द्वारा उस इतिहास से किया जाता है।</p>

<div class="rr-mechanism">
<h3>लुकअप एल्गोरिथम — हर क्वेरी पर जो चलता है</h3>
<ol>
  <li><strong>प्रश्न को हैश करें</strong> SHA-256 के साथ, 16-वर्ण की कुंजी तक संक्षिप्त करते हुए, और सटीक पूर्व मिलान के लिए Cloudflare KV में प्रति-ग्राहक रूटिंग स्टोर की जाँच करें। यदि इसका उत्तर पहले दिया जा चुका है, तो तुरंत उसी बैकएंड पर भेजें जिसने पिछली बार सबसे अच्छा प्रदर्शन किया था।</li>
  <li><strong>मिस होने पर, प्रश्न को एम्बेड करें</strong> और ऐतिहासिक प्रश्न एम्बेडिंग के कैश किए गए इंडेक्स के विरुद्ध cosine-सर्च करें। यदि निकटतम पड़ोसी की समानता <strong>0.88</strong> से अधिक है, तो उससे जुड़े बैकएंड पर भेजें।</li>
  <li><strong>थ्रेशोल्ड से ऊपर कोई मिलान न होने पर,</strong> उस कॉर्पस के लिए ग्राहक के डिफ़ॉल्ट बैकएंड पर फ़ॉलबैक करें।</li>
  <li><strong>उत्तर रेंडर होने के बाद,</strong> (प्रश्न हैश, बैकएंड, गुणवत्ता स्कोर) टपल को प्रति-ग्राहक रूटिंग-इतिहास स्टोर में वापस लिखा जाता है, जो भविष्य के लुकअप का बीज बनता है।</li>
</ol>
<div class="rr-note">
  <strong>"वर्गीकृत" के बजाय "सीखा हुआ" क्यों?</strong> अनुभवजन्य रूप से एक ही क्वेरी आकार विभिन्न कॉर्पस पर अलग-अलग व्यवहार करता है। कानूनी अनुबंधों पर "Y में X की तुलना करें" Tier 3 पेज-इंडेक्स ट्रैवर्सल चाहता है; वही आकार फ़्लैट FAQ कॉर्पस पर Tier 1 पर ठीक है। रूटिंग मॉडल को क्वेरी सिंटैक्स से अनुमान लगाने के बजाय ऐतिहासिक साक्ष्यों से प्रति-कॉर्पस उस अंतर को सीखने देना, वह डिज़ाइन विकल्प है जो वास्तव में शिप हुआ।
</div>
</div>

<h2 class="section-heading">वे दस बैकएंड्स जिनके बीच हम आज रूट करते हैं</h2>

<p class="section-subheading">राउटर दस नामित बैकएंड्स में से एक पर भेजता है। उनमें से तीन "Tier 3-आकार के" हैं (हायरार्किकल या ग्राफ़-वर्धित); अन्य शुद्ध-वेक्टर इंजन हैं जिन्हें हम विभिन्न परिचालन ट्रेडऑफ़ के साथ Tier 1 के रूप में मानते हैं।</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>हायरार्किकल TOC ट्री + एजेंटिक ट्रैवर्सल। Tier 3 का आर्किटाइप।</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>पुनरावर्ती सारांशित दस्तावेज़ हायरार्की पर ट्री-ट्रैवर्सल रिट्रीवल (ICLR 2024)।</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>ग्राफ़-वर्धित रिट्रीवल जो वेक्टर एम्बेडिंग को स्पष्ट एंटिटी / रिलेशनशिप संरचना के साथ जोड़ता है।</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>फ़्लैट-ग्राफ़ ड्यूल-मोड रिट्रीवल — एंटिटी + कम्युनिटी सर्च, HKU LightRAG दृष्टिकोण।</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>हाई-थ्रूपुट, लो-लेटेंसी लुकअप के लिए सेल्फ़-होस्टेड डेंस-वेक्टर इंजन।</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>एज पर Vectorize — Cloudflare के वैश्विक नेटवर्क से सब-300 ms p95।</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>मौजूदा परिचालन निर्भरताओं वाले ग्राहकों के लिए BYO Couchbase वेक्टर स्टोर।</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>Google के डेटा स्टैक पर ग्राहकों के लिए Google Cloud Vertex AI वेक्टर सर्च।</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>MongoDB पर डॉक्यूमेंट डेटा चलाने वाले ग्राहकों के लिए Atlas Vector Search।</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>अल्ट्रा-लो-लेटेंसी इन-मेमोरी रिट्रीवल वर्कलोड के लिए Redis वेक्टर सर्च।</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2 (BM25 + डेंस फ़्यूज़न + क्रॉस-एनकोडर रीरैंकर) आज एक कंपोज़ेबल नोड के रूप में हमारे वर्कफ़्लो कैनवस में शिप होता है। ऑटो-राउटर इसे अगले चरण में लक्ष्य बनाता है क्योंकि प्रति-कॉर्पस रूटिंग डेटा इसे न्यायसंगत बनाता है।</em></p>

<h2 class="section-heading">API सरफ़ेस — एक एंडपॉइंट, ऑडिट-ग्रेड पारदर्शिता</h2>

<p class="section-subheading">राउटर आपके कॉलर के लिए अदृश्य है। एक अनुरोध आकार; प्रतिक्रिया में रूटिंग निर्णय शामिल है ताकि आप ऑडिट कर सकें कि किस बैकएंड ने उत्तर दिया (और क्यों)।</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># एक एंडपॉइंट। राउटर तय करता है कि कौन-सा बैकएंड उपयोग करना है।</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># प्रतिक्रिया — वे चंक्स जो एजेंट को उत्तर को आधार बनाने के लिए चाहिए।</span>
{
  "items": [
    {
      "content":  "Section 7.3 is superseded by …",
      "metadata": { "doc": "amendment-2024.pdf", "section": "II.4.b" },
      "score":    0.91
    }
    /* … */
  ],
  "routing": {
    "backend":      "pageindex",           <span class="rr-code-comment">// dispatched tier-3 page-index</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · or fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// ≥ 0.88 threshold</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// re-benchmark से पहले freshness window</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em><code>routing</code> मेटाडेटा वर्तमान में आंतरिक रूप से लॉग किया जाता है और ऑडिट ट्रेल के माध्यम से उजागर किया जाता है। इनलाइन प्रतिक्रिया डिलीवरी Q3 2026 में रोल आउट हो रही है।</em></p>

<h2 class="section-heading">यह मौजूदा राउटरों से कैसे भिन्न है</h2>

<p class="section-subheading">RAG रूटिंग कोई नया विचार नहीं है — Adaptive-RAG और Probing-RAG जैसे शैक्षणिक राउटर पहले से ही क्वेरीज़ को जटिलता के आधार पर वर्गीकृत करते हैं। अंतर यह है कि Divinci <em>आर्किटेक्चरल रूप से भिन्न रिट्रीवल स्टैक्स</em> के बीच रूट करता है, आपके अपने ट्रैफ़िक से सीखा हुआ, एक प्रबंधित एंडपॉइंट के पीछे।</p>

<div class="rr-vs">
<table>
<thead><tr><th>उत्पाद</th><th>यह किनके बीच रूट करता है</th><th>रूटिंग अक्ष</th><th>प्रबंधित?</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 बैकएंड्स (PageIndex, RAPTOR, LightRAG, neo4j, 6 वेक्टर इंजन)</td><td>आर्किटेक्चर · इतिहास से सीखा हुआ</td><td>हाँ — एकल एंडपॉइंट</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>BYO रिट्रीवर्स</td><td>LLM/Pydantic सेलेक्टर</td><td>नहीं — एक लाइब्रेरी जिसे आप असेंबल करते हैं</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>no-retrieval / single-step / iterative</td><td>गहराई · क्वेरी जटिलता वर्गीकारक</td><td>शोध</td></tr>
<tr><td>Cloudflare AI Search (पूर्व AutoRAG)</td><td>एक हाइब्रिड पाइपलाइन</td><td>कोई रूटिंग नहीं</td><td>हाँ</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>एक हाइब्रिड पाइपलाइन</td><td>कोई रूटिंग नहीं</td><td>हाँ</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>हाइब्रिड + अलग एजेंटिक मोड</td><td>उपयोगकर्ता मैन्युअल रूप से मोड चुनता है</td><td>हाँ</td></tr>
<tr><td>VectifyAI PageIndex</td><td>एकल आर्किटेक्चर (हायरार्किकल ट्रैवर्सल)</td><td>कोई रूटिंग नहीं</td><td>OSS स्टैंडअलोन</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>हमारी पिच की ईमानदार कमज़ोरी:</strong> एक अवधारणा के रूप में प्रति-क्वेरी RAG रूटिंग नई नहीं है। हमने रूटिंग का आविष्कार नहीं किया। वास्तविक अंतर यह <em>संयोजन</em> है: (a) गहराई के विभिन्न रूपों के बजाय आर्किटेक्चरल रूप से भिन्न स्टैक्स के बीच रूटिंग, (b) PageIndex / RAPTOR / LightRAG-शैली का हायरार्किकल ट्रैवर्सल एक अलग उत्पाद के बजाय प्रथम-श्रेणी बैकएंड के रूप में शामिल, और (c) एक प्रबंधित एंडपॉइंट के बजाय एक लाइब्रेरी जिसे आप स्वयं असेंबल और संचालित करते हैं।</p>

<h2 class="section-heading">रूटिंग प्राथमिकताएँ कैसे सीडेड (बीजित) होती हैं</h2>

<p class="section-subheading">आपका रूटिंग मॉडल पहले से प्रशिक्षित नहीं है — यह <em>आपके</em> ट्रैफ़िक से सीखता है। तीन संकेत रूटिंग-इतिहास स्टोर को फ़ीड करते हैं।</p>

<div class="rr-mechanism">
<ol>
  <li><strong>एरीना चयन।</strong> कई बैकएंड्स पर <a href="/rag-arena/">RAG Arena</a> के माध्यम से एक क्वेरी चलाएँ, वेरिएंट्स को साथ-साथ स्कोर करें, विजेता चुनें। (प्रश्न, विजेता-बैकएंड) जोड़ी रूटिंग स्टोर में दर्ज होती है।</li>
  <li><strong>ऑटो-फ़िक्स आउटपुट।</strong> जब हमारा ऑटो-फ़िक्स इंजेस्ट या निर्धारित ऑडिट के दौरान प्रतिनिधि क्वेरीज़ पर तुलनात्मक रिट्रीवल चलाता है, तो प्रति-क्वेरी सर्वोत्तम-प्रदर्शन वाला बैकएंड उसी स्टोर में लिखा जाता है।</li>
  <li><strong>प्रोडक्शन फ़ीडबैक।</strong> सफल क्वेरीज़ (वे जो हमारे ऑनलाइन मूल्यांकन गेट के माध्यम से आपकी गुणवत्ता सीमा से ऊपर स्कोर करती हैं — <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">regression-testing पोस्ट</a> देखें) अनुरोध-समय पर अपनी (प्रश्न हैश, बैकएंड) जोड़ी को रूटिंग स्टोर में वापस लिखती हैं, 30-दिन के TTL के साथ ताकि आपके कॉर्पस के विकसित होने पर रूटिंग मॉडल ताज़ा बना रहे।</li>
</ol>
<div class="rr-note">
  <strong>यह वास्तव में कहाँ प्रोडक्शन-ग्रेड है बनाम रोडमैप पर:</strong> चरण 1 और 2 आज शिप होते हैं। चरण 3 का स्वचालित फ़ीडबैक लूप आंशिक रूप से शिप हुआ है — सफल क्वेरीज़ वापस लिखती हैं, लेकिन tier-2 (BM25 + RRF + reranker) वर्तमान में ऑटो-रूट किए जाने के बजाय एक वर्कफ़्लो नोड के रूप में संयोजित है। जैसे ही रूटिंग डेटा इसके लिए स्पष्ट जीत की शर्तें दिखाएगा, हम Tier 2 को ऑटो-राउटर में शामिल कर देंगे।
</div>
</div>

<h2 class="section-heading">यह सबसे अधिक कब मायने रखता है</h2>

<p class="section-subheading">समान क्वेरी आकारों वाला एकरूप कॉर्पस इससे बहुत कम लाभ उठाता है — एक बैकएंड मैन्युअल रूप से चुनें और काम पूरा। असली बढ़त मिश्रित कॉर्पस और मिश्रित क्वेरी आकारों में है।</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">एक कानूनी टीम जो "हमारे मानक अनुबंध में force majeure की परिभाषा क्या है?" (Tier 1, सब-300 ms) और "हमारे 47 विक्रेता अनुबंधों में, किनमें गैर-मानक समाप्ति खंड हैं और पैटर्न क्या हैं?" (Tier 3, कई-सेकंड पेज-इंडेक्स ट्रैवर्सल) दोनों पूछती है, वह एक बैकएंड चुनना नहीं चाहती। वे चाहते हैं कि सरल प्रश्न तेज़ और सस्ता वापस आए, और गहन प्रश्न सही तरीके से वापस आए भले ही उसमें अधिक लागत आए — दो स्टैक्स संचालित किए बिना।</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">यही वह स्थिति है जहाँ आर्किटेक्चरल रूप से भिन्न बैकएंड्स में रूट करने वाला एक प्रबंधित एंडपॉइंट अपनी जगह बनाता है। यदि आपका ट्रैफ़िक एकरूप है, तो आपको इसकी आवश्यकता नहीं है। यदि आपका ट्रैफ़िक मिश्रित है — अधिकांश वास्तविक एंटरप्राइज़ कॉर्पस ऐसे ही हैं — तो आपको इसकी आवश्यकता है।</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>गहन पठन और संबंधित उत्पाद</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
आर्किटेक्चर का गहन विश्लेषण हमारे ब्लॉग पोस्ट <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a> में है। ऊपर चरण 1 को संचालित करने वाला एरीना <a href="/rag-arena/">RAG Arena &amp; Dynamic Routing</a> पर है। रूटिंग निर्णय उसी रिलीज़-मैनिफ़ेस्ट पैटर्न के माध्यम से ऑडिट-एंकर किए जाते हैं जिसका हम प्लेटफ़ॉर्म में उपयोग करते हैं — देखें <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>। और यदि आप जानना चाहते हैं कि हम रिट्रीवल गुणवत्ता का ऑनलाइन मूल्यांकन कैसे करते हैं (वह संकेत जो ऊपर चरण 3 को फ़ीड करता है), तो <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">regression-testing पोस्ट</a> शुरुआत के लिए सही स्थान है।
</p>
</div>
