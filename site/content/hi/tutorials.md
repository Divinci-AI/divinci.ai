+++
title = "ट्यूटोरियल"
description = "Divinci AI के लिए चरण-दर-चरण ट्यूटोरियल — अपना पहला असिस्टेंट प्रकाशित करें, नॉलेज बेस बनाएँ, अपनी साइट पर चैट एम्बेड करें, SDK और CLI के साथ इंटीग्रेट करें, QA सूट चलाएँ, और अपने असिस्टेंट को आवाज़ दें।"
template = "feature.html"
+++

<style>
/* Page-specific Leonardo journal background */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-api.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

.feature-page .tutorials-hero,
.feature-page .tutorials-section {
    margin-left: auto !important;
    margin-right: auto !important;
}

/* Hero */
.tutorials-hero {
    text-align: center;
    padding: 5rem 2rem 3rem;
    max-width: 900px;
    margin: 0 auto;
}

.tutorials-hero h1 {
    font-family: 'Fraunces', serif;
    font-size: clamp(2.25rem, 4vw, 3.25rem);
    color: var(--color-neutral-primary);
    margin-bottom: 1rem;
    line-height: 1.15;
}

.tutorials-hero .subtitle {
    font-size: 1.15rem;
    color: var(--color-neutral-secondary);
    line-height: 1.7;
    max-width: 700px;
    margin: 0 auto;
}

/* Sections */
.tutorials-section {
    max-width: 1100px;
    margin: 0 auto;
    padding: 2.5rem 2rem;
}

.tutorials-section h2 {
    font-family: 'Fraunces', serif;
    font-size: var(--text-h2);
    color: var(--color-neutral-primary);
    margin-bottom: 0.75rem;
}

.tutorials-section .section-sub {
    color: var(--color-neutral-secondary);
    font-size: 1.05rem;
    margin-bottom: 2rem;
    max-width: 700px;
}

/* Difficulty badges */
.level-badge {
    display: inline-block;
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    vertical-align: middle;
}

.level-beginner {
    background: rgba(61, 107, 79, 0.1);
    color: var(--color-accent-tertiary, #3d6b4f);
}

.level-intermediate {
    background: rgba(196, 148, 58, 0.14);
    color: #8a6519;
}

.level-advanced {
    background: rgba(140, 82, 60, 0.12);
    color: #8c523c;
}

/* Guide blocks (inline step-by-step walkthroughs) */
.guide-block {
    background: var(--color-bg-primary, #f8f4f0);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 2rem;
    margin-bottom: 1.5rem;
}

.guide-block h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.3rem;
    color: var(--color-neutral-primary);
    margin: 0 0 0.35rem;
}

.guide-block .guide-intro {
    color: var(--color-neutral-secondary);
    font-size: 0.95rem;
    line-height: 1.65;
    margin: 0.5rem 0 1rem;
}

.guide-block ol {
    margin: 0 0 1rem;
    padding-left: 1.4rem;
}

.guide-block ol li {
    color: var(--color-neutral-primary);
    font-size: 0.95rem;
    line-height: 1.7;
    margin-bottom: 0.5rem;
}

.guide-block .guide-note {
    color: var(--color-neutral-secondary);
    font-size: 0.88rem;
    line-height: 1.6;
    background: rgba(232, 221, 199, 0.35);
    border-left: 3px solid var(--color-border-medium);
    padding: 0.6rem 1rem;
    border-radius: 0 6px 6px 0;
    margin-bottom: 1rem;
}

.guide-block .card-link,
.tutorial-card .card-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: var(--color-neutral-inverse);
    font-weight: 600;
    font-size: 0.9rem;
    text-decoration: none;
}

.guide-block .card-link:hover,
.tutorial-card .card-link:hover {
    text-decoration: underline;
}

.guide-block .card-link + .card-link {
    margin-left: 1.25rem;
}

/* Tutorial cards grid (link-out tutorials) */
.tutorial-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
}

.tutorial-card {
    background: var(--color-bg-primary, #f8f4f0);
    border: 1px solid var(--color-border-light);
    border-radius: var(--radius-medium);
    padding: 1.75rem;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
}

.tutorial-card:hover {
    box-shadow: var(--shadow-medium);
    transform: translateY(-2px);
}

.tutorial-card h3 {
    font-family: 'Fraunces', serif;
    font-size: 1.1rem;
    color: var(--color-neutral-primary);
    margin: 0.5rem 0 0.5rem;
}

.tutorial-card p {
    color: var(--color-neutral-secondary);
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1rem;
    flex-grow: 1;
}

.snippet {
    background: var(--color-neutral-dark, #1e3a2b);
    color: rgba(255,255,255,0.9);
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-family: 'Source Code Pro', 'Courier New', monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    margin: 0.75rem 0 1rem;
    overflow-x: auto;
    white-space: pre;
}

/* Responsive */
@media (max-width: 1024px) {
    .tutorial-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
    .tutorial-grid { grid-template-columns: 1fr; }
    .guide-block { padding: 1.5rem; }
}
</style>

<!-- Hero -->
<div class="tutorials-hero">
<h1>ट्यूटोरियल</h1>
<p class="subtitle">Divinci AI प्लेटफ़ॉर्म के लिए व्यावहारिक, चरण-दर-चरण गाइड — डैशबोर्ड में अपना पहला असिस्टेंट प्रकाशित करने से लेकर डेवलपर इंटीग्रेशन, QA पाइपलाइन और वॉइस शिप करने तक।</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>यहाँ से शुरू करें</h2>
<p class="section-sub">किसी कोड की ज़रूरत नहीं। ये वॉकथ्रू शुरू से अंत तक Divinci डैशबोर्ड का उपयोग करते हैं।</p>

<div class="guide-block">
<h3>अपना पहला असिस्टेंट बनाएँ और प्रकाशित करें <span class="level-badge level-beginner">शुरुआती</span></h3>
<p class="guide-intro">Release वह तरीका है जिससे Divinci एक असिस्टेंट को पैकेज करता है: आप एक ड्राफ़्ट कॉन्फ़िगर करते हैं, उसे प्रकाशित करते हैं, और आगे का हर बदलाव किसी प्रकाशित संस्करण से फ़ोर्क किया गया नया ड्राफ़्ट होता है — इसलिए आप हमेशा रोल बैक कर सकते हैं।</p>
<ol>
<li>डैशबोर्ड में साइन इन करें और कोई वर्कस्पेस खोलें (या बनाएँ)।</li>
<li>एक नया <strong>ड्राफ़्ट Release</strong> बनाएँ — ड्राफ़्ट निजी होते हैं और पूरी तरह संपादन योग्य होते हैं।</li>
<li>वह मॉडल चुनें जो आपके असिस्टेंट को शक्ति देता है।</li>
<li>असिस्टेंट को कॉन्फ़िगर करें: सिस्टम निर्देश, बातचीत शुरू करने वाले प्रश्न (conversation starters), और कोई भी नॉलेज बेस जिसे आप जोड़ना चाहते हैं।</li>
<li>बिल्ट-इन चैट में ड्राफ़्ट का परीक्षण करें, जब तक जवाब सही न लगने लगें।</li>
<li>Release को <strong>प्रकाशित</strong> करें ताकि वह आपके उपयोगकर्ताओं और इंटीग्रेशनों के लिए लाइव हो जाए।</li>
<li>बाद में बदलाव के लिए, प्रकाशित release को नए ड्राफ़्ट के रूप में फ़ोर्क करें, उसे बदलें, और फिर से प्रकाशित करें — पिछले संस्करण उपलब्ध बने रहते हैं।</li>
</ol>
<a href="/release-management/" class="card-link">रिलीज़ प्रबंधन के बारे में और जानें &rarr;</a>
</div>

<div class="guide-block">
<h3>अपनी फ़ाइलों से नॉलेज बेस बनाएँ <span class="level-badge level-beginner">शुरुआती</span></h3>
<p class="guide-intro">अपने असिस्टेंट को अपनी सामग्री पर आधारित करें, ताकि वह अनुमान लगाने के बजाय आपके दस्तावेज़ों से जवाब दे।</p>
<ol>
<li>अपने वर्कस्पेस में नॉलेज बेस सेक्शन खोलें और एक नया कलेक्शन बनाएँ।</li>
<li>अपने दस्तावेज़ अपलोड करें — PDF, ऑफ़िस दस्तावेज़ और टेक्स्ट फ़ाइलें, सभी काम करती हैं।</li>
<li>इंडेक्सिंग पूरी होने की प्रतीक्षा करें; हर दस्तावेज़ अपने आप chunk और embed किया जाता है।</li>
<li>कलेक्शन को किसी ड्राफ़्ट release से जोड़ें।</li>
<li>ड्राफ़्ट से ऐसा सवाल पूछें जिसका जवाब केवल आपके दस्तावेज़ों में हो, ताकि पुष्टि हो सके कि retrieval काम कर रहा है — फिर प्रकाशित करें।</li>
</ol>
<div class="guide-note">फ़ाइल अपलोड के अलावा, नॉलेज बेस में रॉ टेक्स्ट, ऑडियो रिकॉर्डिंग (स्वतः ट्रांसक्राइब), प्रोडक्ट कैटलॉग, और Dropbox से फ़ाइलें भी शामिल की जा सकती हैं।</div>
</div>

<div class="guide-block">
<h3>URL क्रॉल से अपनी वेबसाइट को शामिल करें <span class="level-badge level-beginner">शुरुआती</span></h3>
<p class="guide-intro">Divinci को अपनी वेबसाइट की ओर पॉइंट करें और उसके पेजों को असिस्टेंट के ज्ञान में बदल दें — किसी एक्सपोर्ट की ज़रूरत नहीं।</p>
<ol>
<li>अपने नॉलेज बेस में वेब स्रोत जोड़ने का विकल्प चुनें।</li>
<li>एक URL दर्ज करें — किसी एक पेज को स्क्रैप करें, या शुरुआती URL से पूरी साइट क्रॉल करें।</li>
<li>क्रॉल पूरा होने पर निकाले गए chunks की समीक्षा करें और जो कुछ नहीं चाहिए उसे हटा दें।</li>
<li>कलेक्शन को अपने release से जोड़ें और अपनी साइट की सामग्री से जुड़े सवालों के साथ परीक्षण करें।</li>
</ol>
<div class="guide-note">क्रॉल पूरा होने के बाद भी इंडेक्सिंग बैकग्राउंड में जारी रहती है — बहुत बड़ी साइटों पर हर पेज के खोज योग्य होने में थोड़ा अधिक समय लग सकता है।</div>
</div>

<div class="guide-block">
<h3>अपनी साइट पर चैट विजेट एम्बेड करें <span class="level-badge level-beginner">शुरुआती</span></h3>
<p class="guide-intro">Release प्रकाशित होने के बाद, केवल एक script टैग किसी भी वेबसाइट पर पूरी तरह ब्रांडेड चैट विजेट लगा देता है:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">विजेट जवाबों को स्ट्रीम करता है, RAG संदर्भ दिखाता है, और white-label कस्टमाइज़ेशन का समर्थन करता है — रंग, स्थिति, conversation starters, और बहुत कुछ।</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">एम्बेड विजेट दस्तावेज़ &rarr;</a>
</div>

<div class="guide-block">
<h3>अनाम विज़िटर्स को कोटा के साथ चैट करने दें <span class="level-badge level-intermediate">इंटरमीडिएट</span></h3>
<p class="guide-intro">अपने असिस्टेंट को उन विज़िटर्स के लिए खोलें जिनका खाता नहीं है: वे एक ईमेल पता सत्यापित करते हैं, Cloudflare Turnstile जाँच पास करते हैं, और आपके तय किए गए दैनिक कोटा के भीतर चैट करते हैं — ताकि उपयोग और दुरुपयोग पर नियंत्रण आपके हाथ में रहे।</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">अनाम विज़िटर चैट के उदाहरण &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>डेवलपर्स के लिए</h2>
<p class="section-sub">SDK, CLI और MCP के साथ प्लेटफ़ॉर्म पर बिल्ड करें — पूरी गाइड SDK दस्तावेज़ में उपलब्ध हैं।</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">शुरुआती</span>
<h3>क्विकस्टार्ट: Client SDK के साथ स्ट्रीमिंग चैट</h3>
<p><code>@divinci-ai/client</code> इंस्टॉल करें, प्रमाणीकरण करें, और कुछ ही मिनटों में ब्राउज़र में अपने असिस्टेंट का पहला जवाब स्ट्रीम करें।</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">क्विकस्टार्ट देखें &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">शुरुआती</span>
<h3>टर्मिनल से सब कुछ प्रबंधित करें</h3>
<p>Divinci CLI में वर्कस्पेस, release, नॉलेज बेस और चैट — सब कुछ शामिल है, और यह CI/CD तथा रोज़मर्रा के वर्कफ़्लो दोनों के लिए स्क्रिप्ट किया जा सकता है।</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">CLI अवलोकन &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">शुरुआती</span>
<h3>Claude या Cursor को अपने असिस्टेंट से जोड़ें (MCP)</h3>
<p>अपने AI टूल के कनेक्टर UI में <code>https://mcp.divinci.app/mcp</code> जोड़ें, OAuth से अधिकृत करें, और आपके असिस्टेंट का ज्ञान और टूल्स Claude, Cursor और अन्य MCP क्लाइंट्स के भीतर उपलब्ध हो जाते हैं।</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">MCP से कनेक्ट करें &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">उन्नत</span>
<h3>Cloudflare Workers पर गेटेड लैंडिंग-पेज चैट डिप्लॉय करें</h3>
<p>अपने स्वयं के गेट के पीछे बिल्ट-इन असिस्टेंट चैट के साथ एक लैंडिंग पेज शिप करें, जो Cloudflare Workers पर एज पर चलता है।</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">Cloudflare Workers गाइड &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">उन्नत</span>
<h3>अपने release को उसके अपने MCP सर्वर के रूप में प्रकाशित करें</h3>
<p>किसी प्रकाशित release को white-label MCP सर्वर में बदलें, जिसे आपके ग्राहक अपने स्वयं के AI टूल्स में जोड़ सकें।</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">White-label MCP सर्वर &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>गुणवत्ता और विश्वास</h2>
<p class="section-sub">अपने असिस्टेंट के जवाबों को मापें और नियंत्रित करें कि कौन-से मॉडल प्रोवाइडर उन्हें सर्व करते हैं।</p>

<div class="guide-block">
<h3>QA सूट और AutoFix से अपने असिस्टेंट को स्कोर करें <span class="level-badge level-intermediate">इंटरमीडिएट</span></h3>
<p class="guide-intro">QA सूट किसी release के विरुद्ध संरचित परीक्षण चलाते हैं और जवाबों को स्कोर करते हैं, ताकि गुणवत्ता मापी जाए — मान न ली जाए।</p>
<ol>
<li>स्वयं टेस्ट केस लिखकर QA सूट बनाएँ, या अपने नॉलेज बेस की फ़ाइलों से परीक्षण अपने आप जनरेट करें।</li>
<li>सूट को किसी release के विरुद्ध चलाएँ — ड्राफ़्ट हो या प्रकाशित।</li>
<li>स्कोर की समीक्षा करें और देखें कि असिस्टेंट ने किन सवालों को अच्छी तरह संभाला और कहाँ कमी रह गई।</li>
<li><strong>AutoFix</strong> लागू करें ताकि Divinci विफलताओं को दूर करने वाले कॉन्फ़िगरेशन बदलाव सुझाए, फिर सुधार की पुष्टि के लिए सूट दोबारा चलाएँ।</li>
</ol>
<a href="/quality-assurance/" class="card-link">गुणवत्ता आश्वासन के बारे में और जानें &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">Server SDK में QA &rarr;</a>
</div>

<div class="guide-block">
<h3>अपनी स्वयं की मॉडल keys लाएँ (BYOK) <span class="level-badge level-intermediate">इंटरमीडिएट</span></h3>
<p class="guide-intro">Divinci की साझा (pooled) keys के बजाय अपने स्वयं के प्रोवाइडर खाते इस्तेमाल करें — आपकी रेट लिमिट, आपकी बिलिंग, आपके डेटा अनुबंध।</p>
<ol>
<li>अपनी वर्कस्पेस सेटिंग्स खोलें और मॉडल keys पर जाएँ।</li>
<li>अपने प्रोवाइडर के लिए एक API key जोड़ें (उदाहरण के लिए OpenAI या Anthropic)।</li>
<li>Release कॉन्फ़िगर करते समय अपनी key चुनें — उस release के मॉडल कॉल अब आपके खाते से चलते हैं।</li>
<li>Keys को कभी भी रोटेट करें या हटाएँ; यदि आप अपनी key हटा दें तो release प्लेटफ़ॉर्म keys पर वापस चले जाते हैं।</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>वॉइस</h2>
<p class="section-sub">असिस्टेंट को केवल टेक्स्ट तक सीमित रहने की ज़रूरत नहीं।</p>

<div class="guide-block">
<h3>अपने असिस्टेंट को आवाज़ दें <span class="level-badge level-intermediate">इंटरमीडिएट</span></h3>
<p class="guide-intro">किसी release पर text-to-speech सक्षम करें ताकि जवाब बोलकर सुनाए जा सकें।</p>
<ol>
<li>अपने release का कॉन्फ़िगरेशन खोलें और <strong>text-to-speech</strong> सक्षम करें।</li>
<li>बिल्ट-इन विकल्पों में से कोई वॉइस चुनें (Deepgram Aura और Cartesia वॉइस उपलब्ध हैं), या कोई कस्टम वॉइस क्लोन करें।</li>
<li>डैशबोर्ड चैट में परीक्षण करें, फिर प्रकाशित करें — अब विजेट और SDK सतहें जवाब बोलकर सुना सकती हैं।</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>बिल्ड करने के लिए तैयार हैं?</h2>
<p>अपना पहला असिस्टेंट मुफ़्त में बनाएँ, या अपने उपयोग मामले के बारे में हमसे बात करें।</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">डेमो का अनुरोध करें</a>
<a href="/docs/" class="cta-secondary">डेवलपर दस्तावेज़</a>
</div>
</section>
</div>
