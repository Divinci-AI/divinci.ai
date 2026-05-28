+++
title = "توجيه RAG — واجهة برمجية واحدة، معماريات متعددة"
description = "يوزّع RAG Routing من Divinci كل استعلام إلى أرخص بَكِند قادر على الإجابة. عشرة محركات استرجاع خلف نقطة نهاية واحدة، بتوجيه متعلَّم لكل سؤال."
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
  <h1 style="font-family: 'Fraunces', serif; font-size: 3.4rem; color: #1e3a2b; text-align: center; margin: 0 0 1.25rem; line-height: 1.1;">توجيه RAG</h1>
  <p style="font-family: 'DM Sans', sans-serif; font-size: 1.25rem; color: #5a6862; text-align: center; max-width: 820px; margin: 0 auto 2rem; line-height: 1.55;">نقطة نهاية واحدة لواجهة برمجية. عشر معماريات استرجاع مدعومة. يتعلَّم الموجِّه من سجل حركة استعلاماتك ويوزِّع كل سؤال جديد إلى النظام الخلفي الأقدر على الإجابة عنه بشكل صحيح — بأقل تكلفة تظل ضمن معيار الجودة لديك.</p>
  <p style="text-align: center; margin: 0 0 3rem;">
    <a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; margin-right: 0.5rem;">تحدَّث إلينا</a>
    <a href="/blog/future-of-rag-systems/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">اقرأ التحليل المعمَّق ←</a>
  </p>
</section>

<h2 class="section-heading">المعماريات الثلاث، من حيث المفهوم</h2>

<p class="section-subheading">معظم أنظمة RAG في الإنتاج تشحن معمارية استرجاع واحدة وتعتبر المهمة منتهية. أمَّا نحن فنشحن موجِّهًا يختار بين منظومات متمايزة معماريًا — نادرًا ما يكون الخيار الصحيح هو ذاته لكل استعلام في مجموعتك النصية.</p>

<div class="rr-tier-grid">

<div class="rr-tier rr-tier-1">
  <div class="rr-tier-head">Tier 1 · RAG القائم على المتجهات المسطَّحة</div>
  <div class="rr-tier-body">
    <span class="rr-badge">FAST &amp; CHEAP</span>
    <div class="rr-flow">embed → cosine top-k<br>→ stuff context<br>→ generate</div>
    <h4>الأنسب لـ</h4>
    <p>الاستعلام عن معلومة واحدة، الاستعلامات على هيئة أسئلة شائعة، وأسئلة "ما هو X؟" على مجاميع نصوص مقسَّمة إلى مقاطع مسطَّحة.</p>
    <div class="rr-stats">
      <strong>زمن الاستجابة:</strong><span>&lt; 300 ms p95</span>
      <strong>التكلفة:</strong><span>قروش لكل استعلام</span>
      <strong>الأنظمة الخلفية:</strong><span>Qdrant · Cloudflare · Vertex · MongoDB · Redis</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-2">
  <div class="rr-tier-head">Tier 2 · هجين + إعادة ترتيب</div>
  <div class="rr-tier-body">
    <span class="rr-badge">BALANCED</span>
    <div class="rr-flow">BM25 lexical + dense vector<br>→ Reciprocal Rank Fusion<br>→ cross-encoder reranker<br>→ generate</div>
    <h4>الأنسب لـ</h4>
    <p>الاستعلامات التي تتعارض فيها الإشارات المعجمية والدلالية — الرموز، الأسماء، الاختصارات، المفردات التقنية، وسلاسل رسائل الخطأ.</p>
    <div class="rr-stats">
      <strong>زمن الاستجابة:</strong><span>~ 800 ms</span>
      <strong>التكلفة:</strong><span>لا تزال منخفضة</span>
      <strong>اليوم:</strong><span>عقدة قابلة للتركيب في سير العمل · الموجِّه التلقائي ضمن خارطة الطريق</span>
    </div>
  </div>
</div>

<div class="rr-tier rr-tier-3">
  <div class="rr-tier-head">Tier 3 · فهرس صفحات + وكيل</div>
  <div class="rr-tier-body">
    <span class="rr-badge">DEEP &amp; DELIBERATE</span>
    <div class="rr-flow">hierarchical TOC tree built<br>at ingest → agent walks tree<br>→ opens / reads sections<br>→ generate</div>
    <h4>الأنسب لـ</h4>
    <p>القراءة متعدِّدة القفزات لوثائق طويلة ومنظَّمة — العقود القانونية، نماذج 10-K المالية، وملفات PDF التقنية حيث يمتد السياق عبر أقسام غير متجاورة.</p>
    <div class="rr-stats">
      <strong>زمن الاستجابة:</strong><span>عدة ثوان</span>
      <strong>التكلفة:</strong><span>الأعلى — لكن فقط عند الحاجة</span>
      <strong>النظام الخلفي:</strong><span>PageIndex · RAPTOR · LightRAG · neo4j-hybrid</span>
    </div>
  </div>
</div>

</div>

<h2 class="section-heading">كيف يتَّخذ الموجِّه قراره فعليًا</h2>

<p class="section-subheading">معظم موجِّهات RAG المنشورة تصنِّف الاستعلام مسبقًا حسب درجة تعقيده. لكن موجِّهنا لا يفعل ذلك. نحن نستخدم <strong>التوجيه المتعلَّم</strong>: يُخزَّن كل استعلام ناجح مع النظام الخلفي الذي أجاب عنه، وتُطابَق الاستعلامات الجديدة مع هذا السجل عبر تشابه التضمين (embedding).</p>

<div class="rr-mechanism">
<h3>خوارزمية البحث — ما يجري على كل استعلام</h3>
<ol>
  <li><strong>تجزئة السؤال</strong> بـ SHA-256، مع اقتطاعه إلى مفتاح من 16 حرفًا، والبحث في مخزن التوجيه الخاص بكل عميل في Cloudflare KV عن مطابقة سابقة دقيقة. إذا سبقت الإجابة عنه، يُرسَل فورًا إلى النظام الخلفي الذي قدَّم أفضل أداء في المرة السابقة.</li>
  <li><strong>عند عدم وجود مطابقة، يُجرى تضمين السؤال</strong> والبحث بتشابه جيب التمام (cosine) في الفهرس المخزَّن لتضمينات الأسئلة التاريخية. إذا تجاوز تشابه أقرب جار <strong>0.88</strong>، يُرسَل إلى النظام الخلفي المرتبط به.</li>
  <li><strong>عند عدم وجود مطابقة فوق العتبة،</strong> يُرجَع إلى النظام الخلفي الافتراضي للعميل بالنسبة لتلك المجموعة النصية.</li>
  <li><strong>بعد تقديم الإجابة،</strong> تُكتَب الثلاثية (تجزئة السؤال، النظام الخلفي، درجة الجودة) في مخزن سجل التوجيه الخاص بالعميل، ممَّا يُغذِّي عمليات البحث المستقبلية.</li>
</ol>
<div class="rr-note">
  <strong>لماذا "متعلَّم" بدلًا من "مُصنَّف"؟</strong> تجريبيًا، يتصرَّف الشكل ذاته من الاستعلام بصورة مختلفة على مجاميع نصوص مختلفة. سؤال "قارن بين X عبر Y" على العقود القانونية يحتاج إلى تنقُّل Tier 3 ضمن فهرس الصفحات؛ أمَّا الشكل نفسه على مجموعة أسئلة شائعة مسطَّحة، فيكفي فيه Tier 1. السماح لنموذج التوجيه بتعلُّم هذا التمييز لكل مجموعة نصية اعتمادًا على الأدلة التاريخية، بدلًا من تخمينه من بنية الاستعلام، هو القرار التصميمي الذي شُحن فعليًا.
</div>
</div>

<h2 class="section-heading">الأنظمة الخلفية العشرة التي نوجِّه بينها اليوم</h2>

<p class="section-subheading">يوزِّع الموجِّه الاستعلامات إلى أحد عشرة أنظمة خلفية مسمَّاة. ثلاثة منها بهيئة "Tier 3" (هرمية أو معزَّزة بالرسوم البيانية)؛ والباقي محركات متَّجهات بحتة نعاملها بوصفها Tier 1 مع موازنات تشغيلية مختلفة.</p>

<div class="rr-backends">

<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-pageindex">PI</div>
  <div class="rr-backend-body"><strong>pageindex</strong><span>شجرة فهرس محتويات هرمية + تنقُّل وكيل ذكي. النموذج المثالي لـ Tier 3.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-raptor">RT</div>
  <div class="rr-backend-body"><strong>raptor</strong><span>استرجاع باجتياز الشجرة فوق هرميات وثائق مُلخَّصة بشكل تكراري (ICLR 2024).</span></div>
</div>
<div class="rr-backend-chip tier3">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/neo4j/008CC1" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>neo4j-hybrid</strong><span>استرجاع معزَّز بالرسم البياني يجمع بين تضمينات المتجهات والبنية الصريحة للكيانات والعلاقات.</span></div>
</div>
<div class="rr-backend-chip tier3">
  <div class="rr-backend-monogram mono-lightrag">LR</div>
  <div class="rr-backend-body"><strong>lightrag</strong><span>استرجاع ثنائي الوضع برسم بياني مسطَّح — بحث الكيانات والمجتمعات، وهو نهج LightRAG من جامعة هونغ كونغ.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/qdrant/DC244C" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>qdrant</strong><span>محرك متَّجهات كثيف يُستضاف ذاتيًا، لعمليات بحث عالية الإنتاجية ومنخفضة الكمون.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/cloudflare/F38020" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>cloudflare-v2</strong><span>Vectorize عند الحافة — أقل من 300 ms p95 من شبكة Cloudflare العالمية.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/couchbase/EA2328" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>couchbase-byok</strong><span>متجر متَّجهات Couchbase تأتي به بنفسك (BYO) للعملاء ذوي التبعيات التشغيلية القائمة.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/googlecloud/4285F4" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>vertex-ai-vector-search-v2</strong><span>بحث المتجهات في Vertex AI من Google Cloud للعملاء على منظومة بيانات Google.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/mongodb/47A248" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>mongodb-atlas</strong><span>Atlas Vector Search للعملاء الذين يديرون بيانات الوثائق على MongoDB.</span></div>
</div>
<div class="rr-backend-chip tier1">
  <img class="rr-backend-logo" src="https://cdn.simpleicons.org/redis/FF4438" alt="" loading="lazy" decoding="async">
  <div class="rr-backend-body"><strong>redis-vector-search</strong><span>بحث متَّجهات Redis لأحمال استرجاع في الذاكرة بكمون منخفض جدًا.</span></div>
</div>

</div>

<p style="max-width: 980px; margin: 1.5rem auto 0; text-align: center; font-size: 0.95rem; color: #5a6862;"><em>Tier 2 (BM25 + دمج كثيف + إعادة ترتيب بمشفِّر متقاطع) متوفِّر اليوم في لوحة سير العمل لدينا كعقدة قابلة للتركيب. وسيستهدفه الموجِّه التلقائي تاليًا بمجرَّد أن تبرِّر بيانات التوجيه لكل مجموعة نصية ذلك.</em></p>

<h2 class="section-heading">واجهة برمجية — نقطة نهاية واحدة، بشفافية على مستوى التدقيق</h2>

<p class="section-subheading">الموجِّه غير مرئي للمتصل بك. شكل طلب واحد؛ وتتضمَّن الاستجابة قرار التوجيه ليتسنَّى لك تدقيق أي نظام خلفي أجاب (ولماذا).</p>

<div class="rr-code-wrap">
<pre><code class="rr-code-block"><span class="rr-code-comment"># نقطة نهاية واحدة. الموجِّه هو من يقرِّر أي نظام خلفي يُستخدَم.</span>
curl -X POST https://api.divinci.app/v1/rag/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What clauses in the 2024 amendment override section 7.3?",
    "corpus":   "legal-contracts-q4"
  }'
<span class="rr-code-comment"># الاستجابة — المقاطع التي يحتاجها الوكيل لإسناد الإجابة.</span>
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
    "backend":      "pageindex",           <span class="rr-code-comment">// أُرسل إلى فهرس الصفحات من Tier 3</span>
    "match_source": "learned-history",     <span class="rr-code-comment">// arena · auto-fix · أو fallback</span>
    "similarity":   0.92,                  <span class="rr-code-comment">// عتبة ≥ 0.88</span>
    "ttl_remaining":"23d 14h"              <span class="rr-code-comment">// نافذة الحداثة قبل إعادة التقييم</span>
  }
}
</code></pre>
</div>

<p style="max-width: 980px; margin: 1rem auto 2rem; text-align: center; font-size: 0.92rem; color: #5a6862;"><em>تُسجَّل بيانات <code>routing</code> الوصفية داخليًا في الوقت الحالي وتُكشف عبر سجل التدقيق. وسيُطرح تسليمها داخل الاستجابة مباشرةً عبر الربع الثالث من 2026.</em></p>

<h2 class="section-heading">كيف يختلف هذا عن الموجِّهات القائمة</h2>

<p class="section-subheading">توجيه RAG ليس فكرة جديدة — فالموجِّهات الأكاديمية مثل Adaptive-RAG و Probing-RAG تصنِّف الاستعلامات بالفعل حسب التعقيد. ما يميِّزنا هو أن Divinci يوجِّه عبر <em>منظومات استرجاع متمايزة معماريًا</em>، متعلَّمة من حركتك الخاصة، خلف نقطة نهاية واحدة مُدارة.</p>

<div class="rr-vs">
<table>
<thead><tr><th>المنتج</th><th>ما يوجِّه بينه</th><th>محور التوجيه</th><th>مُدار؟</th></tr></thead>
<tbody>
<tr><td>Divinci RAG Routing</td><td>10 أنظمة خلفية (PageIndex، RAPTOR، LightRAG، neo4j، 6 محركات متَّجهات)</td><td>المعمارية · متعلَّمة من التاريخ</td><td>نعم — نقطة نهاية واحدة</td></tr>
<tr><td>LlamaIndex RouterRetriever</td><td>مستردِّات تأتي بها بنفسك</td><td>منتقي LLM/Pydantic</td><td>لا — مكتبة تُجمِّعها بنفسك</td></tr>
<tr><td>Adaptive-RAG (Jeong et al.)</td><td>لا استرجاع / خطوة واحدة / تكراري</td><td>العمق · مصنِّف تعقيد الاستعلام</td><td>بحث أكاديمي</td></tr>
<tr><td>Cloudflare AI Search (ex-AutoRAG)</td><td>خط أنابيب هجين واحد</td><td>لا توجيه</td><td>نعم</td></tr>
<tr><td>AWS Bedrock Knowledge Bases</td><td>خط أنابيب هجين واحد</td><td>لا توجيه</td><td>نعم</td></tr>
<tr><td>Azure AI Search Agentic Retrieval</td><td>هجين + وضع وكيل منفصل</td><td>المستخدم يختار الوضع يدويًا</td><td>نعم</td></tr>
<tr><td>VectifyAI PageIndex</td><td>معمارية واحدة (اجتياز هرمي)</td><td>لا توجيه</td><td>مفتوح المصدر مستقل</td></tr>
</tbody>
</table>
</div>

<p style="max-width: 980px; margin: 1.5rem auto 2rem; padding: 1.25rem 1.5rem; background: rgba(184, 160, 128, 0.1); border-left: 3px solid #b8a080; border-radius: 4px; color: #4a4030; font-size: 0.95rem;"><strong>نقطة الضعف الصادقة في عرضنا:</strong> توجيه RAG لكل استعلام كمفهوم ليس جديدًا. لم نخترع التوجيه. التمييز الحقيقي هو <em>تركيبة</em> (أ) التوجيه عبر منظومات متمايزة معماريًا بدلًا من متغيِّرات العمق، و(ب) إدراج الاجتياز الهرمي بأسلوب PageIndex / RAPTOR / LightRAG كنظام خلفي من الدرجة الأولى وليس منتجًا منفصلًا، و(ج) نقطة نهاية واحدة مُدارة بدلًا من مكتبة تُجمِّعها وتشغِّلها بنفسك.</p>

<h2 class="section-heading">كيف تُبذَر تفضيلات التوجيه</h2>

<p class="section-subheading">نموذج التوجيه لديك ليس مُدرَّبًا مسبقًا — بل يتعلَّم من <em>حركتك أنت</em>. ثلاث إشارات تغذِّي مخزن سجل التوجيه.</p>

<div class="rr-mechanism">
<ol>
  <li><strong>الاختيار من الحلبة (Arena).</strong> شغِّل استعلامًا عبر <a href="/ar/rag-arena/">RAG Arena</a> على أنظمة خلفية متعدِّدة، وقيِّم النسخ جنبًا إلى جنب، واختر الفائزة. يُسجَّل الزوج (السؤال، النظام الخلفي الفائز) في مخزن التوجيه.</li>
  <li><strong>مخرجات الإصلاح التلقائي.</strong> حين يُجري الإصلاح التلقائي لدينا عمليات استرجاع مقارَنة على استعلامات تمثيلية خلال الاستيعاب أو التدقيقات المجدولة، يُكتَب أفضل نظام خلفي أداءً لكل استعلام في المخزن ذاته.</li>
  <li><strong>تغذية راجعة من الإنتاج.</strong> الاستعلامات الناجحة (تلك التي حقَّقت درجة فوق عتبة الجودة لديك عبر بوابة التقييم الفورية لدينا — راجع <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">مقالة اختبار الانحدار</a>) تكتب زوجها (تجزئة السؤال، النظام الخلفي) في مخزن التوجيه في وقت الطلب، مع TTL مدَّته 30 يومًا حتى يظل نموذج التوجيه طازجًا مع تطوُّر مجموعتك النصية.</li>
</ol>
<div class="rr-note">
  <strong>أين هذا فعليًا على مستوى الإنتاج وأين هو ضمن خارطة الطريق:</strong> الخطوتان 1 و2 مشحونتان اليوم. حلقة التغذية الراجعة التلقائية في الخطوة 3 مشحونة جزئيًا — الاستعلامات الناجحة تكتب رجوعيًا، لكن Tier 2 (BM25 + RRF + معيد ترتيب) مُركَّب حاليًا كعقدة سير عمل وليس موجَّهًا تلقائيًا. سندمج Tier 2 في الموجِّه التلقائي حالما تُظهر بيانات التوجيه شروط فوز واضحة له.
</div>
</div>

<h2 class="section-heading">متى يكون هذا أكثر أهمية</h2>

<p class="section-subheading">المجموعة النصية المتجانسة بأشكال استعلامات موحَّدة تستفيد قليلًا — اختر نظامًا خلفيًا واحدًا يدويًا وانتهى الأمر. الميزة الحاسمة تظهر في المجاميع المختلطة وأشكال الاستعلامات المختلطة.</p>

<div style="max-width: 980px; margin: 2rem auto; padding: 0 1rem;">
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">فريق قانوني يطرح في الوقت ذاته سؤال "ما تعريف القوة القاهرة في عقدنا القياسي؟" (Tier 1، أقل من 300 ms) وسؤال "عبر عقود مورِّدينا الـ 47، أيُّها يحتوي بنود إنهاء غير قياسية وما هي الأنماط؟" (Tier 3، اجتياز فهرس صفحات يستغرق عدة ثوان) لا يرغب في اختيار نظام خلفي واحد. هو يريد أن يأتي السؤال البسيط بسرعة وبتكلفة منخفضة، وأن يأتي السؤال العميق بشكل صحيح حتى لو كلَّف أكثر — دون تشغيل منظومتين.</p>
<p style="font-size: 1.02rem; color: #2d3c34; line-height: 1.7;">هذه هي الحالة التي تُثبت فيها نقطة نهاية واحدة مُدارة توجِّه عبر أنظمة خلفية متمايزة معماريًا جدواها. إذا كانت حركتك موحَّدة فأنت لا تحتاج إليها. وإذا كانت حركتك مختلطة — كما هو حال معظم المجاميع النصية المؤسسية الحقيقية — فأنت تحتاج إليها.</p>
</div>

<div class="rr-cross-links">
<p style="font-size: 1.05rem; color: #2d3c34; margin: 0 0 1rem;"><strong>قراءات أعمق ومنتجات مجاورة</strong></p>
<p style="font-size: 0.98rem; color: #4a4030; line-height: 1.8; margin: 0;">
يقبع التحليل المعمَّق للمعمارية في تدوينتنا <a href="/blog/future-of-rag-systems/">The Future of RAG Systems: Beyond Simple Document Retrieval</a>. والحلبة التي تُشغِّل الخطوة 1 أعلاه موجودة في <a href="/ar/rag-arena/">RAG Arena &amp; Dynamic Routing</a>. تُرسى قرارات التوجيه عبر نمط بيان الإصدار ذاته الذي نستخدمه في المنصة كلها — راجع <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Validating and Releasing Custom LMs in Regulated Fields</a>. وإن أردت معرفة كيف نقيِّم جودة الاسترجاع فوريًا (الإشارة التي تغذِّي الخطوة 3 أعلاه)، فإن <a href="/blog/automated-regression-testing-for-custom-llms-in-2026/">مقالة اختبار الانحدار</a> هي المكان المناسب للبدء.
</p>
</div>
