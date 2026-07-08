+++
title = "البرامج التعليمية"
description = "برامج تعليمية خطوة بخطوة لـ Divinci AI — انشر مساعدك الأول، وابنِ قاعدة معرفة، وضمّن الدردشة في موقعك، وتكامل مع SDK وCLI، وشغّل حزم QA، وامنح مساعدك صوتًا."
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
<h1>البرامج التعليمية</h1>
<p class="subtitle">أدلة عملية خطوة بخطوة لمنصة Divinci AI — من نشر مساعدك الأول في لوحة التحكم إلى إطلاق تكاملات المطورين وخطوط أنابيب QA والصوت.</p>
</div>

<!-- Section 1: Start here -->
<section class="tutorials-section">
<h2>ابدأ من هنا</h2>
<p class="section-sub">دون أي برمجة. تستخدم هذه الأدلة لوحة تحكم Divinci من البداية إلى النهاية.</p>

<div class="guide-block">
<h3>أنشئ مساعدك الأول وانشره <span class="level-badge level-beginner">مبتدئ</span></h3>
<p class="guide-intro">الإصدارات (Releases) هي طريقة Divinci لتغليف المساعد: تقوم بتكوين مسودة ثم تنشرها، وكل تغيير لاحق هو مسودة جديدة متفرعة من نسخة منشورة — بحيث يمكنك دائمًا التراجع.</p>
<ol>
<li>سجّل الدخول إلى لوحة التحكم وافتح (أو أنشئ) مساحة عمل.</li>
<li>أنشئ <strong>مسودة Release</strong> جديدة — المسودات خاصة وقابلة للتحرير بالكامل.</li>
<li>اختر النموذج الذي يشغّل مساعدك.</li>
<li>قم بتكوين المساعد: تعليمات النظام، وبادئات المحادثة، وأي قاعدة معرفة تريد إرفاقها.</li>
<li>اختبر المسودة في الدردشة المدمجة حتى تبدو الإجابات صحيحة.</li>
<li><strong>انشر</strong> الإصدار ليصبح متاحًا لمستخدميك وتكاملاتك.</li>
<li>للتحسين لاحقًا، افرع الإصدار المنشور كمسودة جديدة، وعدّلها، ثم انشر مجددًا — تبقى النسخ السابقة متاحة.</li>
</ol>
<a href="/release-management/" class="card-link">تعرّف على المزيد حول إدارة الإصدارات &rarr;</a>
</div>

<div class="guide-block">
<h3>ابنِ قاعدة معرفة من ملفاتك <span class="level-badge level-beginner">مبتدئ</span></h3>
<p class="guide-intro">ارسِ مساعدك على محتواك الخاص ليجيب من مستنداتك بدلًا من التخمين.</p>
<ol>
<li>في مساحة عملك، افتح قسم قاعدة المعرفة وأنشئ مجموعة جديدة.</li>
<li>ارفع مستنداتك — ملفات PDF والمستندات المكتبية والملفات النصية كلها مدعومة.</li>
<li>انتظر اكتمال الفهرسة؛ يُقسَّم كل مستند إلى مقاطع ويُضمَّن تلقائيًا.</li>
<li>أرفق المجموعة بمسودة إصدار.</li>
<li>اسأل المسودة سؤالًا لا يمكن الإجابة عنه إلا من مستنداتك للتأكد من عمل الاسترجاع، ثم انشر.</li>
</ol>
<div class="guide-note">إلى جانب رفع الملفات، يمكن لقواعد المعرفة استيعاب النصوص الخام والتسجيلات الصوتية (تُنسخ تلقائيًا) وكتالوجات المنتجات والملفات من Dropbox.</div>
</div>

<div class="guide-block">
<h3>استوعب موقعك عبر زحف URL <span class="level-badge level-beginner">مبتدئ</span></h3>
<p class="guide-intro">وجّه Divinci إلى موقعك الإلكتروني وحوّل صفحاته إلى معرفة للمساعد — دون الحاجة إلى أي تصدير.</p>
<ol>
<li>في قاعدة معرفتك، اختر إضافة مصدر ويب.</li>
<li>أدخل عنوان URL — اكشط صفحة واحدة، أو ازحف على الموقع بأكمله انطلاقًا من عنوان بداية.</li>
<li>عند اكتمال الزحف، راجع المقاطع المستخرجة واحذف أي شيء لا تريده.</li>
<li>أرفق المجموعة بإصدارك واختبر بأسئلة من محتوى موقعك.</li>
</ol>
<div class="guide-note">تستمر الفهرسة في الخلفية بعد اكتمال الزحف نفسه — قد تستغرق المواقع الكبيرة جدًا وقتًا أطول قليلًا قبل أن تصبح كل صفحة قابلة للبحث.</div>
</div>

<div class="guide-block">
<h3>ضمّن أداة الدردشة في موقعك <span class="level-badge level-beginner">مبتدئ</span></h3>
<p class="guide-intro">بمجرد نشر الإصدار، يكفي وسم script واحد لوضع أداة دردشة كاملة العلامة التجارية على أي موقع:</p>
<div class="snippet">&lt;script src="https://assets.divinci.app/embed-script.js"
        divinci-release-id="rel_your-release-id"&gt;&lt;/script&gt;</div>
<p class="guide-intro">تبثّ الأداة الإجابات تدفقيًا، وتعرض سياق RAG، وتدعم التخصيص بعلامتك البيضاء — الألوان والموضع وبادئات المحادثة والمزيد.</p>
<a href="https://sdk.divinci.ai/embed/overview/" class="card-link" target="_blank" rel="noopener">وثائق أداة التضمين &rarr;</a>
</div>

<div class="guide-block">
<h3>اسمح للزوار المجهولين بالدردشة، مع حصص استخدام <span class="level-badge level-intermediate">متوسط</span></h3>
<p class="guide-intro">افتح مساعدك للزوار الذين لا يملكون حسابًا: يتحققون من عنوان بريد إلكتروني، ويجتازون فحص Cloudflare Turnstile، ويتحادثون ضمن حصص يومية تحددها أنت — فتبقى متحكمًا في الاستخدام ومنع إساءة الاستعمال.</p>
<a href="https://sdk.divinci.ai/embed/examples/" class="card-link" target="_blank" rel="noopener">أمثلة دردشة الزوار المجهولين &rarr;</a>
</div>
</section>

<!-- Section 2: Developers -->
<section class="tutorials-section">
<h2>للمطورين</h2>
<p class="section-sub">ابنِ على المنصة باستخدام SDKs وCLI وMCP — الأدلة الكاملة موجودة في وثائق SDK.</p>

<div class="tutorial-grid">

<div class="tutorial-card">
<span class="level-badge level-beginner">مبتدئ</span>
<h3>بداية سريعة: دردشة تدفقية مع Client SDK</h3>
<p>ثبّت <code>@divinci-ai/client</code>، وصادق، وابثّ أول استجابة من مساعدك في المتصفح خلال دقائق قليلة.</p>
<a href="https://sdk.divinci.ai/getting-started/quickstart/" class="card-link" target="_blank" rel="noopener">اتبع دليل البداية السريعة &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">مبتدئ</span>
<h3>أدر كل شيء من الطرفية</h3>
<p>يغطي Divinci CLI مساحات العمل والإصدارات وقواعد المعرفة والدردشة — قابل للبرمجة النصية لـ CI/CD وسير العمل اليومي على حد سواء.</p>
<a href="https://sdk.divinci.ai/cli/overview/" class="card-link" target="_blank" rel="noopener">نظرة عامة على CLI &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-beginner">مبتدئ</span>
<h3>اربط Claude أو Cursor بمساعدك (MCP)</h3>
<p>أضف <code>https://mcp.divinci.app/mcp</code> في واجهة الموصلات بأداة الذكاء الاصطناعي لديك، وصادق عبر OAuth، فتصبح معرفة مساعدك وأدواته متاحة داخل Claude وCursor وعملاء MCP الآخرين.</p>
<a href="https://sdk.divinci.ai/mcp/connect-assistant/" class="card-link" target="_blank" rel="noopener">الربط عبر MCP &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">متقدم</span>
<h3>انشر دردشة صفحة هبوط مقيّدة على Cloudflare Workers</h3>
<p>أطلق صفحة هبوط بدردشة مساعد مدمجة خلف بوابتك الخاصة، تعمل على الحافة عبر Cloudflare Workers.</p>
<a href="https://sdk.divinci.ai/guides/cloudflare-workers/" class="card-link" target="_blank" rel="noopener">دليل Cloudflare Workers &rarr;</a>
</div>

<div class="tutorial-card">
<span class="level-badge level-advanced">متقدم</span>
<h3>انشر إصدارك كخادم MCP مستقل</h3>
<p>حوّل إصدارًا منشورًا إلى خادم MCP بعلامة بيضاء يمكن لعملائك إضافته إلى أدوات الذكاء الاصطناعي الخاصة بهم.</p>
<a href="https://sdk.divinci.ai/mcp/whitelabel-servers/" class="card-link" target="_blank" rel="noopener">خوادم MCP بالعلامة البيضاء &rarr;</a>
</div>

</div>
</section>

<!-- Section 3: Quality & trust -->
<section class="tutorials-section">
<h2>الجودة والثقة</h2>
<p class="section-sub">قِس إجابات مساعدك وتحكم في مزودي النماذج الذين يقدمونها.</p>

<div class="guide-block">
<h3>قيّم مساعدك بحزم QA وميزة AutoFix <span class="level-badge level-intermediate">متوسط</span></h3>
<p class="guide-intro">تشغّل حزم QA اختبارات منظمة على إصدار ما وتقيّم الإجابات، فتصبح الجودة مُقاسة — لا مفترضة.</p>
<ol>
<li>أنشئ حزمة QA بكتابة حالات الاختبار بنفسك، أو ولّد الاختبارات تلقائيًا من ملفات قاعدة معرفتك.</li>
<li>شغّل الحزمة على إصدار — مسودة أو منشور.</li>
<li>راجع الدرجات لترى الأسئلة التي أجاب عنها المساعد جيدًا وأين قصّر.</li>
<li>طبّق <strong>AutoFix</strong> ليقترح Divinci تغييرات في التكوين تعالج الإخفاقات، ثم أعد تشغيل الحزمة لتأكيد التحسن.</li>
</ol>
<a href="/quality-assurance/" class="card-link">تعرّف على المزيد حول ضمان الجودة &rarr;</a>
<a href="https://sdk.divinci.ai/server/qa/" class="card-link" target="_blank" rel="noopener">QA في Server SDK &rarr;</a>
</div>

<div class="guide-block">
<h3>استخدم مفاتيح النماذج الخاصة بك (BYOK) <span class="level-badge level-intermediate">متوسط</span></h3>
<p class="guide-intro">استخدم حسابات المزودين الخاصة بك — حدود الاستخدام الخاصة بك، وفوترتك، واتفاقيات بياناتك — بدلًا من مفاتيح Divinci المشتركة.</p>
<ol>
<li>افتح إعدادات مساحة عملك وانتقل إلى مفاتيح النماذج.</li>
<li>أضف مفتاح API لمزودك (مثل OpenAI أو Anthropic).</li>
<li>اختر مفتاحك عند تكوين إصدار — تمر استدعاءات النماذج لذلك الإصدار الآن عبر حسابك.</li>
<li>بدّل المفاتيح أو احذفها في أي وقت؛ تعود الإصدارات إلى مفاتيح المنصة إذا حذفت مفاتيحك.</li>
</ol>
</div>
</section>

<!-- Section 4: Voice -->
<section class="tutorials-section">
<h2>الصوت</h2>
<p class="section-sub">لا يشترط أن تكون المساعدات نصية فقط.</p>

<div class="guide-block">
<h3>امنح مساعدك صوتًا <span class="level-badge level-intermediate">متوسط</span></h3>
<p class="guide-intro">فعّل تحويل النص إلى كلام على إصدار ما لتُنطق الإجابات بصوت مسموع.</p>
<ol>
<li>افتح تكوين إصدارك وفعّل <strong>تحويل النص إلى كلام</strong>.</li>
<li>اختر صوتًا من الخيارات المدمجة (أصوات Deepgram Aura وCartesia متاحة)، أو استنسخ صوتًا مخصصًا.</li>
<li>اختبر في دردشة لوحة التحكم، ثم انشر — تستطيع الأداة وواجهات SDK الآن نطق الإجابات.</li>
</ol>
</div>
</section>

<!-- CTA -->
<div class="arena-cta-wrapper">
<section class="arena-cta">
<h2>هل أنت مستعد للبناء؟</h2>
<p>أنشئ مساعدك الأول مجانًا، أو تحدث إلينا عن حالة الاستخدام الخاصة بك.</p>
<div class="hero-ctas">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="cta-primary" target="_blank" rel="noopener">اطلب عرضًا توضيحيًا</a>
<a href="/docs/" class="cta-secondary">وثائق المطورين</a>
</div>
</section>
</div>
