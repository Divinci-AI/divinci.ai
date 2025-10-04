+++
title = "AutoRAG - التوليد المعزز بالاسترجاع الآلي"
description = "اعثر تلقائياً على خط أنابيب RAG الأمثل لبياناتك مع حل AutoRAG الشامل من Divinci AI"
template = "feature.html"
[extra]
feature_category = "data-management"
lang = "ar"
+++

<style>
/* Feature page specific styles matching original design */

.section-padding {
    padding: 4rem 0;
}

.section-heading {
    font-family: 'Fraunces', serif;
    font-size: 3rem;
    color: #1e3a2b;
    text-align: center;
    margin-top: 4rem;
    margin-bottom: 4rem;
}

.benefits-circle-container {
    position: relative;
    width: min(900px, 90vw);
    height: 1111px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: center;
}

/* Add more padding to the benefits section to accommodate the full circle */
.feature-benefits {
    padding: 8rem 0 12rem 0;
}

.center-benefit {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: linear-gradient(135deg, rgba(30, 45, 102, 0.1), rgba(92, 226, 231, 0.1));
    border: 2px solid rgba(92, 226, 231, 0.3);
    border-radius: 50%;
    text-align: center;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.orbital-benefit {
    position: absolute;
    background: rgba(255, 255, 255, 0.9);
    border: 2px solid rgba(92, 226, 231, 0.2);
    border-radius: 50%;
    text-align: center;
    transition: all 0.3s ease;
    top: 50%;
    left: 50%;
}

.orbital-benefit:nth-child(2) { transform: translate(-50%, -50%) rotate(0deg) translateY(-400px) rotate(0deg); }
.orbital-benefit:nth-child(3) { transform: translate(-50%, -50%) rotate(72deg) translateY(-400px) rotate(-72deg); }
.orbital-benefit:nth-child(4) { transform: translate(-50%, -50%) rotate(144deg) translateY(-400px) rotate(-144deg); }
.orbital-benefit:nth-child(5) { transform: translate(-50%, -50%) rotate(216deg) translateY(-400px) rotate(-216deg); }
.orbital-benefit:nth-child(6) { transform: translate(-50%, -50%) rotate(288deg) translateY(-400px) rotate(-288deg); }

.orbital-benefit:nth-child(2):hover { transform: translate(-50%, -50%) rotate(0deg) translateY(-400px) rotate(0deg) scale(1.05); }
.orbital-benefit:nth-child(3):hover { transform: translate(-50%, -50%) rotate(72deg) translateY(-400px) rotate(-72deg) scale(1.05); }
.orbital-benefit:nth-child(4):hover { transform: translate(-50%, -50%) rotate(144deg) translateY(-400px) rotate(-144deg) scale(1.05); }
.orbital-benefit:nth-child(5):hover { transform: translate(-50%, -50%) rotate(216deg) translateY(-400px) rotate(-216deg) scale(1.05); }
.orbital-benefit:nth-child(6):hover { transform: translate(-50%, -50%) rotate(288deg) translateY(-400px) rotate(-288deg) scale(1.05); }

.orbital-benefit:hover {
    box-shadow: 0 8px 24px rgba(92, 226, 231, 0.3);
}

.benefit-icon svg {
    width: 60px;
    height: 60px;
    margin-bottom: 1rem;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 25px;
}

.feature-item {
    background: rgba(30, 45, 102, 0.1);
    border-radius: 10px;
    padding: 20px;
    border: 1px solid rgba(92, 226, 231, 0.2);
}

.timeline-step {
    position: relative;
    padding-right: 80px;
    margin-bottom: 3rem;
    padding-bottom: 1rem;
}

.step-number {
    position: absolute;
    right: 0;
    top: 5px;
    width: 60px;
    height: 60px;
    background: linear-gradient(135deg, #1e3a2b, #2d3c34);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.5rem;
    font-weight: 700;
    z-index: 1;
}

.case-studies-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 3rem;
}

.case-study-card {
    background: rgba(255, 255, 255, 0.9);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(92, 226, 231, 0.2);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.related-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.related-feature-card {
    background: rgba(255, 255, 255, 0.9);
    padding: 2rem;
    border-radius: 12px;
    border: 1px solid rgba(92, 226, 231, 0.2);
    text-align: center;
}

.accordion-item {
    border: 1px solid rgba(92, 226, 231, 0.2);
    border-radius: 8px;
    margin-bottom: 1rem;
    overflow: hidden;
}

.accordion-trigger {
    width: 100%;
    padding: 1.5rem;
    background: rgba(30, 45, 102, 0.05);
    border: none;
    text-align: right;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.3s ease;
}

.accordion-trigger:hover {
    background: rgba(30, 45, 102, 0.1);
}

.accordion-panel {
    padding: 1.5rem;
    background: white;
}

.tag {
    display: inline-block;
    padding: 0.5rem 1rem;
    background: rgba(107, 70, 193, 0.1);
    color: #1e3a2b;
    border-radius: 20px;
    font-size: 0.9rem;
    margin: 0.25rem;
}

.text-link {
    color: #1e3a2b;
    text-decoration: none;
    font-weight: 600;
}

.text-link:hover {
    color: #2d3c34;
    text-decoration: underline;
}

.secondary-button {
    background-color: transparent;
    color: #1e3a2b;
    border: 2px solid #1e3a2b;
    padding: 12px 24px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
}

.secondary-button:hover {
    background-color: #1e3a2b;
    color: white;
}

.metrics-container {
    display: flex;
    justify-content: space-around;
    text-align: center;
}

.metric-value {
    display: block;
    font-size: 2.5rem;
    font-weight: 700;
    color: #1e3a2b;
}

.metric-label {
    display: block;
    font-size: 0.9rem;
    color: #718096;
    margin-top: 0.5rem;
}

.testimonial {
    border-right: 4px solid #1e3a2b;
    padding-right: 2rem;
    margin: 2rem 0;
    font-style: italic;
}

.testimonial cite {
    display: block;
    margin-top: 1rem;
    font-weight: 600;
    color: #2d3c34;
}
</style>


<section id="feature-overview" class="feature-overview section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">ما هو AutoRAG؟</h2>

<div class="autorag-diagram-container" style="text-align: center; margin: 2rem 0;">
  <img src="/images/autorag-diagram.svg" alt="مخطط توصيل قاعدة المعرفة AutoRAG" class="diagram-svg" style="width: 100%; max-width: 800px; height: auto;" />
</div>

<div class="overview-content">
<p style="font-size: 1.25rem; margin-bottom: 2rem;">AutoRAG هو الحل الشامل من Divinci AI للعثور تلقائياً على خط أنابيب RAG الأمثل لبياناتك المحددة وحالات الاستخدام. على عكس تطبيقات RAG العامة، يقيم AutoRAG مجموعات متعددة من استراتيجيات الاسترجاع والتوليد لتحديد ما يعمل بشكل أفضل مع محتواك الفريد.</p>

<p>تتطلب تطبيقات RAG التقليدية تكويناً يدوياً مكثفاً ومعالجة مسبقة للمستندات وضبطاً مستمراً للبقاء فعالة. تكافح العديد من المؤسسات مع اختيار وحدات وخطوط أنابيب RAG الصحيحة لبياناتها المحددة، مما يؤدي إلى إهدار وقت وموارد ثمينة على تكوينات دون المستوى الأمثل. يزيل AutoRAG هذه الحواجز من خلال تقييم مجموعات مختلفة من وحدات RAG تلقائياً، والتعامل مع تحليل المستندات، وتحسين التجزئة، واختيار استراتيجية الاسترجاع، وتوليد الاستجابات - كل ذلك أثناء التعلم والتحسن المستمر من مقاييس التقييم.</p>

<p>مع AutoRAG، تحصل تطبيقات الذكاء الاصطناعي المؤسسية على وصول فوري إلى المعلومات الملكية لمؤسستك بدقة وصلة لا مثيل لهما. ينشئ النظام تلقائياً مجموعات بيانات أسئلة وأجوبة من مجموعتك، ويقيم استراتيجيات استرجاع وتوليد متعددة، ويحدد التكوين الأمثل لخط الأنابيب - مما يقلل بشكل كبير من الهلوسات ويوفر إجابات مدعومة بالمصادر بالكامل تبني الثقة مع مستخدميك.</p>
</div>
</div>
</section>

<section id="feature-benefits" class="feature-benefits section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 4rem; margin-bottom: 120px;">المزايا الرئيسية</h2>

<div style="display: flex; justify-content: center; align-items: center; width: 100%;">
<div class="benefits-circle-container">
<div class="center-benefit" style="width: 365px; height: 365px; padding: 40px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="80" height="80">
<circle cx="50" cy="50" r="45" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<circle cx="50" cy="50" r="35" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.5" />
<path d="M30,50 L70,50" stroke="#4a7c8a" stroke-width="3" fill="none" />
<path d="M50,30 L50,70" stroke="#4a7c8a" stroke-width="3" fill="none" />
<circle cx="50" cy="50" r="15" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="r" values="15;20;15" dur="3s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>AutoRAG</h3>
<p>التوليد المعزز بالاسترجاع الآلي الذي يربط بسلاسة ذكاءك الاصطناعي بمعرفة مؤسستك مع الحد الأدنى من الإعداد والحد الأقصى من الدقة.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,50 L70,50" stroke="#4a7c8a" stroke-width="3" fill="none" />
<path d="M50,30 L50,70" stroke="#4a7c8a" stroke-width="3" fill="none" />
<circle cx="50" cy="50" r="10" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="r" values="10;15;10" dur="3s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>التكامل السريع</h3>
<p>قم بتوصيل قاعدة معرفتك في دقائق، وليس شهور، مع معالجة وفهرسة تلقائية للمستندات.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,50 C45,35 55,65 70,50" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="d" values="M30,50 C45,35 55,65 70,50;M30,50 C45,65 55,35 70,50;M30,50 C45,35 55,65 70,50" dur="6s" repeatCount="indefinite" />
</path>
<circle cx="30" cy="50" r="4" fill="#4a7c8a" opacity="0.7" />
<circle cx="70" cy="50" r="4" fill="#4a7c8a" opacity="0.7" />
</svg>
</div>
<h3>الاسترجاع التكيفي</h3>
<p>يختار نظامنا تلقائياً استراتيجية الاسترجاع المثلى لكل استعلام للحصول على أقصى صلة.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,70 L70,30" stroke="#4a7c8a" stroke-width="2" fill="none" />
<circle cx="30" cy="70" r="5" fill="#4a7c8a" opacity="0.7" />
<circle cx="70" cy="30" r="5" fill="#4a7c8a" opacity="0.7" />
<path d="M30,30 L70,70" stroke="#4a7c8a" stroke-width="2" fill="none" stroke-dasharray="5,5" />
</svg>
</div>
<h3>تقليل الهلوسات</h3>
<p>يقلل من هلوسات الذكاء الاصطناعي بنسبة تصل إلى 97% مع سياق دقيق والتحقق من الحقائق في الوقت الفعلي.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 35px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30" stroke="#4a7c8a" stroke-width="2" fill="none">
<animate attributeName="d" values="M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30;M50,30 C75,35 75,65 50,70 C25,65 25,35 50,30;M50,30 C70,30 70,70 50,70 C30,70 30,30 50,30" dur="8s" repeatCount="indefinite" />
</path>
<circle cx="50" cy="50" r="5" fill="#4a7c8a" opacity="0.7">
<animate attributeName="r" values="5;8;5" dur="4s" repeatCount="indefinite" />
</circle>
</svg>
</div>
<h3>أداء يتحسن ذاتياً</h3>
<p>يحسن أنماط الاسترجاع وتوليد الاستجابة بشكل مستمر بناءً على تفاعلات المستخدم.</p>
</div>

<div class="orbital-benefit" style="width: 305px; height: 305px; padding: 30px;">
<div class="benefit-icon">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="60" height="60">
<circle cx="50" cy="50" r="40" stroke="#4a7c8a" stroke-width="1" fill="none" opacity="0.3" />
<path d="M30,40 L70,40" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M30,60 L70,60" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M40,30 L40,70" stroke="#4a7c8a" stroke-width="2" fill="none" />
<path d="M60,30 L60,70" stroke="#4a7c8a" stroke-width="2" fill="none" />
</svg>
</div>
<h3>دعم متعدد التنسيقات</h3>
<p>يعالج أنواع محتوى متنوعة بما في ذلك المستندات وقواعد البيانات والويكي ومصادر البيانات المنظمة.</p>
</div>
</div>
</div>
</div>
</section>

<section id="feature-details" class="feature-details section-padding" style="padding-top: 6rem;">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">كيف يعمل AutoRAG</h2>

<!-- Tab Interface for Details -->
<div class="details-tabs" role="tablist" aria-label="قدرات AutoRAG" style="display: flex; justify-content: center; margin-bottom: 3rem; border-bottom: 2px solid rgba(92, 226, 231, 0.2);">
    <button id="tab1-trigger" class="tab-trigger" role="tab" aria-selected="true" aria-controls="tab1-content" style="background: none; border: none; color: #1e3a2b; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid #5ce2e7; transition: all 0.3s ease;">عملية إنشاء البيانات</button>
    <button id="tab2-trigger" class="tab-trigger" role="tab" aria-selected="false" aria-controls="tab2-content" style="background: none; border: none; color: #718096; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease;">تقييم الاسترجاع</button>
    <button id="tab3-trigger" class="tab-trigger" role="tab" aria-selected="false" aria-controls="tab3-content" style="background: none; border: none; color: #718096; font-size: 1.1rem; font-weight: 600; padding: 1rem 2rem; margin: 0 1rem; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.3s ease;">تحسين التوليد</button>
</div>

<div class="tab-content-container">
<!-- Tab 1 Content -->
<div id="tab1-content" role="tabpanel" aria-labelledby="tab1-trigger" class="tab-content active">
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">معالجة المستندات الذكية وإنشاء البيانات</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">تحول أنابيب معالجة المستندات في AutoRAG محتواك الخام إلى مجموعات بيانات محسنة من خلال عملية شاملة من أربع مراحل: تحليل المستندات، والتقسيم الذكي، وإنشاء المجموعة، وإنشاء مجموعة بيانات الأسئلة والأجوبة تلقائياً.</p>

<!-- Document Processing Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<object data="/images/autorag-clean-test.svg" type="image/svg+xml" style="width: 100%; max-width: 800px; height: auto;">
<img src="/images/autorag-clean-test.svg" alt="عملية إنشاء بيانات AutoRAG" style="width: 100%; max-width: 800px; height: auto;" />
</object>
<p style="text-align: center; margin-top: 10px; color: #8C9DB5; font-size: 14px;">عملية إنشاء البيانات الشاملة لـ AutoRAG تحول المستندات الخام إلى مجموعة محسنة ومجموعات بيانات الأسئلة والأجوبة</p>
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-file-alt"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">وحدات التحليل المتقدمة</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">طرق تحليل متعددة لأنواع مختلفة من المستندات بما في ذلك PDFMiner وPyPDF وUnstructured ومحللات مخصصة للتنسيقات المتخصصة</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-cut"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">التقسيم الذكي</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">استراتيجيات تقسيم تكيفية تحافظ على السياق مع تحسين دقة الاسترجاع</p>
</div>
</div>
</div>
</div>
</div>

<!-- Tab 2 Content -->
<div id="tab2-content" role="tabpanel" aria-labelledby="tab2-trigger" class="tab-content" hidden>
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">تقييم الاسترجاع الشامل</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">يقيم نظام AutoRAG الخاص بنا تلقائياً استراتيجيات استرجاع متعددة للعثور على النهج الأمثل لبياناتك المحددة وحالة الاستخدام.</p>

<!-- Vector Embedding Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<img src="/images/autorag-vector-embedding-adjusted.svg" alt="تصور التضمين المتجه" style="width: 100%; max-width: 600px; height: auto;" />
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-search"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">طرق استرجاع متعددة</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">يقيم أساليب استرجاع مختلفة بما في ذلك BM25 واسترجاع كثيف والبحث الهجين واستراتيجيات إعادة الترتيب</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-database"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">تكامل قاعدة البيانات المتجهة</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">يدعم قواعد بيانات متجهة متعددة ونماذج تضمين للعثور على التركيبة المثلى</p>
</div>
</div>
</div>
</div>
</div>

<!-- Tab 3 Content -->
<div id="tab3-content" role="tabpanel" aria-labelledby="tab3-trigger" class="tab-content" hidden>
<h3 style="color: #1e3a2b; font-size: 1.5rem; margin-bottom: 1rem;">تحسين التوليد والتقييم</h3>
<p style="font-size: 1.125rem; margin-bottom: 2rem; color: #4a5568;">يقيم نظام التحسين المتقدم في AutoRAG استراتيجيات توليد متعددة للعثور على التكوين الأمثل لبياناتك المحددة وحالة الاستخدام.</p>

<!-- Retrieval Optimization Visualization -->
<div style="text-align: center; margin: 2rem 0;">
<img src="/images/autorag-retrieval-optimization-adjusted.svg" alt="تصور تحسين الاسترجاع" style="width: 100%; max-width: 600px; height: auto;" />
</div>

<div class="feature-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; margin-top: 25px;">
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-cogs"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">تحسين التوليد</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">يحسن المطالبات ومعاملات التوليد تلقائياً لحالة الاستخدام المحددة الخاصة بك</p>
</div>
</div>
</div>
<div class="feature-item" style="background: rgba(30, 45, 102, 0.1); border-radius: 10px; padding: 20px; border: 1px solid rgba(92, 226, 231, 0.2);">
<div style="display: flex; align-items: flex-start;">
<div style="margin-right: 15px; color: #4a7c8a; font-size: 24px;">
<i class="fas fa-check-circle"></i>
</div>
<div>
<h4 style="font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e3a2b;">مقاييس شاملة</h4>
<p style="font-size: 14px; line-height: 1.5; margin: 0;">يقيم الأداء باستخدام الدقة والاستدعاء وF1 وMRR وNDCG ومقاييس معدل الإصابة</p>
</div>
</div>
</div>
</div>
</div>
</div>
</div>
</section>

<script>
// Tab functionality
document.addEventListener('DOMContentLoaded', function() {
  console.log('Tab script loaded'); // Debug log
  
  // Get all tab components on the page
  const tabLists = document.querySelectorAll('[role="tablist"]');
  console.log('Found tab lists:', tabLists.length); // Debug log
  
  // Set up each tabbed interface
  tabLists.forEach(tabList => {
    const tabs = tabList.querySelectorAll('[role="tab"]');
    const tabPanels = document.querySelectorAll('[role="tabpanel"]');
    
    console.log('Found tabs:', tabs.length, 'panels:', tabPanels.length); // Debug log
    
    // Add click event to each tab
    tabs.forEach(tab => {
      tab.addEventListener('click', function(e) {
        console.log('Tab clicked:', e.currentTarget.id); // Debug log
        changeTabs(e);
      });
      
      // Handle keyboard events for accessibility
      tab.addEventListener('keydown', handleTabKeydown);
    });
    
    // Set initial state with the first tab active
    if (tabs.length > 0) {
      // Show the first panel and hide others initially
      tabPanels.forEach((panel, index) => {
        if (index === 0) {
          panel.hidden = false;
          panel.style.display = 'block';
        } else {
          panel.hidden = true;
          panel.style.display = 'none';
        }
      });
    }
  });
  
  /**
   * Change tabs when a tab is clicked
   */
  function changeTabs(e) {
    const target = e.currentTarget;
    const parent = target.parentNode;
    const grandparent = parent.parentNode;
    
    console.log('Changing tabs, target:', target.id); // Debug log
    
    // Get all tabs in this tablist
    const tabs = parent.querySelectorAll('[role="tab"]');
    
    // Hide all tabpanels
    const tabContainer = grandparent.parentNode;
    const tabPanels = tabContainer.querySelectorAll('[role="tabpanel"]');
    
    tabPanels.forEach(panel => {
      panel.hidden = true;
      panel.style.display = 'none';
      console.log('Hiding panel:', panel.id); // Debug log
    });
    
    // Set all tabs as unselected
    tabs.forEach(tab => {
      tab.setAttribute('aria-selected', 'false');
      tab.style.color = '#718096';
      tab.style.borderBottomColor = 'transparent';
    });
    
    // Set clicked tab as selected
    target.setAttribute('aria-selected', 'true');
    target.style.color = '#1e3a2b';
    target.style.borderBottomColor = '#5ce2e7';
    
    // Show the associated tabpanel
    const tabpanelID = target.getAttribute('aria-controls');
    const tabPanel = document.getElementById(tabpanelID);
    
    console.log('Showing panel:', tabpanelID, 'found:', !!tabPanel); // Debug log
    
    if (tabPanel) {
      tabPanel.hidden = false;
      tabPanel.style.display = 'block';
    }
  }
  
  /**
   * Handle keyboard navigation for tabs
   */
  function handleTabKeydown(e) {
    const target = e.currentTarget;
    const parent = target.parentNode;
    const tabs = Array.from(parent.querySelectorAll('[role="tab"]'));
    const currentIndex = tabs.indexOf(target);
    
    // Define which keys we're handling
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        if (currentIndex < tabs.length - 1) {
          focusTab(tabs[currentIndex + 1]);
        } else {
          focusTab(tabs[0]); // Wrap to first tab
        }
        break;
        
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        if (currentIndex > 0) {
          focusTab(tabs[currentIndex - 1]);
        } else {
          focusTab(tabs[tabs.length - 1]); // Wrap to last tab
        }
        break;
        
      case 'Home':
        e.preventDefault();
        focusTab(tabs[0]); // Go to first tab
        break;
        
      case 'End':
        e.preventDefault();
        focusTab(tabs[tabs.length - 1]); // Go to last tab
        break;
        
      case 'Enter':
      case ' ':
        e.preventDefault();
        target.click(); // Activate the tab
        break;
    }
  }
  
  /**
   * Focus and click on a tab
   */
  function focusTab(tab) {
    tab.focus();
  }
});
</script>

<style>
/* Tab styling */
.tab-trigger:hover {
    color: #1e3a2b !important;
    border-bottom-color: rgba(92, 226, 231, 0.5) !important;
}

.tab-trigger[aria-selected="true"] {
    color: #1e3a2b !important;
    border-bottom-color: #5ce2e7 !important;
}

.tab-trigger[aria-selected="false"] {
    color: #718096 !important;
    border-bottom-color: transparent !important;
}

.tab-content {
    padding: 2rem 0;
}

.tab-content[hidden] {
    display: none;
}

.tab-content.active {
    display: block;
}

/* Responsive tabs */
@media (max-width: 768px) {
    .details-tabs {
        flex-direction: column !important;
        align-items: center !important;
    }
    
    .tab-trigger {
        margin: 0.5rem 0 !important;
        padding: 0.75rem 1.5rem !important;
    }
}
</style>

<section id="feature-implementation" class="feature-implementation section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">عملية التنفيذ</h2>

<div class="implementation-timeline">
<div class="timeline-step">
<div class="step-number">1</div>
<div class="step-content">
<h3>ربط مصادر المعرفة</h3>
<p>قم بتوصيل مستودعات المعرفة الموجودة لديك من خلال واجهة التكامل البسيطة الخاصة بنا. يدعم AutoRAG الاتصالات المباشرة بأنظمة تخزين المستندات وقواعد البيانات وقواعد المعرفة والويكي والأدوات الداخلية عبر اتصالات API الآمنة أو تحميلات المستندات المباشرة.</p>
</div>
</div>

<div class="timeline-step">
<div class="step-number">2</div>
<div class="step-content">
<h3>إنشاء البيانات وتحسين خط الأنابيب</h3>
<p>يحول نظامنا مستنداتك الخام إلى مجموعات بيانات محسنة من خلال عمليتنا الشاملة ذات الأربع مراحل: تحليل المستندات، والتقسيم الذكي، وإنشاء المجموعة، وإنشاء مجموعة بيانات الأسئلة والأجوبة. ثم تُستخدم مجموعات البيانات هذه لتقييم تكوينات خط أنابيب RAG المتعددة، وتحديد النهج الأمثل تلقائياً لبياناتك المحددة وحالة الاستخدام.</p>
</div>
</div>

<div class="timeline-step">
<div class="step-number">3</div>
<div class="step-content">
<h3>تكامل API والنشر</h3>
<p>قم بدمج AutoRAG مع تطبيقاتك الحالية من خلال واجهة برمجة التطبيقات REST API أو استخدم موصلاتنا المسبقة البناء لمنصات LLM الشائعة. تتيح لك خيارات التكوين البسيطة تخصيص إعدادات الاسترجاع والمصادقة ونماذج أذونات المستخدم لتتوافق مع متطلبات مؤسستك.</p>
</div>
</div>
</div>

<div style="text-align: center; margin-top: 3rem;">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="secondary-button" target="_blank">طلب دليل التنفيذ</a>
</div>
</div>
</section>

<section id="case-studies" class="case-studies section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">قصص النجاح</h2>

<div style="background: rgba(255, 255, 255, 0.9); padding: 3rem; border-radius: 12px; border: 1px solid rgba(92, 226, 231, 0.2); margin-bottom: 3rem;">
<h3 style="color: #1e3a2b; font-size: 2rem; margin-bottom: 1rem;">شركة خدمات مالية عالمية</h3>
<p style="font-size: 1.25rem; color: #2d3c34; margin-bottom: 2rem; font-weight: 600;">انخفاض بنسبة 87% في هلوسات الذكاء الاصطناعي أثناء معالجة أكثر من 15000 استعلام يومي من العملاء</p>
<p style="margin-bottom: 2rem;">احتاجت شركة خدمات مالية رائدة إلى دمج أكثر من 200000 وثيقة تنظيمية وسياسة داخلية في مساعد الذكاء الاصطناعي الموجه للعملاء. قُدر تنفيذ RAG اليدوي بأكثر من 8 أشهر. باستخدام AutoRAG، أكملوا التكامل في 3 أسابيع وحققوا دقة غير مسبوقة لأسئلة الامتثال التنظيمي.</p>

<blockquote class="testimonial">
<p>"حوّل AutoRAG الجدول الزمني لتنفيذ الذكاء الاصطناعي لدينا من أرباع إلى أسابيع. كانت قدرة النظام على استرجاع المعلومات التنظيمية بدقة مع توفير الاستشهادات المناسبة ثورية لفريق الامتثال لدينا."</p>
<cite>— سارة تشين، رئيسة قسم التكنولوجيا، رائدة في الخدمات المالية</cite>
</blockquote>

<div class="metrics-container" style="margin-top: 2rem;">
<div class="metric">
<span class="metric-value">87%</span>
<span class="metric-label">انخفاض في الهلوسات</span>
</div>
<div class="metric">
<span class="metric-value">93%</span>
<span class="metric-label">توفير في وقت التنفيذ</span>
</div>
<div class="metric">
<span class="metric-value">15 ألف+</span>
<span class="metric-label">استعلام يومي معالج</span>
</div>
</div>
</div>

<div class="case-studies-grid">
<div class="case-study-card">
<h3>شبكة مقدمي الرعاية الصحية</h3>
<p>دمج أكثر من 50 قاعدة معرفة متباينة في أسبوعين، مما يتيح استرجاع المعلومات الطبية الدقيقة بدقة 99.8%.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">طلب التفاصيل ←</a>
</div>

<div class="case-study-card">
<h3>تكتل التصنيع</h3>
<p>خفض وقت حل الدعم الفني بنسبة 73% من خلال ربط AutoRAG بـ 15 عاماً من وثائق المعدات وسجلات الصيانة.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">طلب التفاصيل ←</a>
</div>

<div class="case-study-card">
<h3>شركة محاماة عالمية</h3>
<p>تمكين المساعدين القانونيين من معالجة أبحاث الحالات بمعدل 3 أضعاف من خلال تنفيذ AutoRAG على أكثر من 12 مليون وثيقة قانونية وسابقة.</p>
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="text-link" target="_blank">طلب التفاصيل ←</a>
</div>
</div>
</div>
</section>

<section id="related-features" class="related-features section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">الميزات ذات الصلة</h2>

<div class="related-features-grid">
<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<path d="M7,12 H17 M7,8 H17 M7,16 H13" stroke="#1e3a2b" stroke-width="2" stroke-linecap="round"/>
<circle cx="17" cy="16" r="3" fill="none" stroke="#2d3c34" stroke-width="2"/>
<path d="M17,14 L17,18 M15,16 L19,16" stroke="#2d3c34" stroke-width="2" stroke-linecap="round"/>
</svg>
</div>
<h3>تكامل قاعدة المعرفة</h3>
<p>قم بتوصيل مصادر معرفة متعددة باستخدام موصلاتنا المتخصصة لتدفق البيانات السلس إلى تطبيقات الذكاء الاصطناعي الخاصة بك.</p>
<a href="/ar/quality-assurance/" class="text-link">اعرف المزيد ←</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<rect x="6" y="6" width="12" height="12" rx="2" fill="none" stroke="#4a7c8a" stroke-width="2"/>
<path d="M9,12 L11,14 L15,10" stroke="#4a7c8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
</div>
<h3>ضمان جودة LLM</h3>
<p>ضمان الدقة والموثوقية من خلال اختباراتنا الشاملة ومراقبة المحتوى المولد بواسطة الذكاء الاصطناعي.</p>
<a href="/ar/quality-assurance/" class="text-link">اعرف المزيد ←</a>
</div>

<div class="related-feature-card">
<div style="margin-bottom: 1rem;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64">
<circle cx="12" cy="12" r="11" fill="none" stroke="#1e3a2b" stroke-width="1" opacity="0.2"/>
<circle cx="12" cy="12" r="5" fill="none" stroke="#2d3c34" stroke-width="2"/>
<path d="M12,7 L12,5 M12,19 L12,17 M7,12 L5,12 M19,12 L17,12 M16.5,7.5 L18,6 M7.5,16.5 L6,18 M16.5,16.5 L18,18 M7.5,7.5 L6,6" stroke="#2d3c34" stroke-width="2" stroke-linecap="round"/>
</svg>
</div>
<h3>إدارة دورة الإطلاق</h3>
<p>قم بتبسيط تطوير تطبيقات الذكاء الاصطناعي الخاصة بك باستخدام أدوات DevOps المتخصصة لدينا للأنظمة القائمة على LLM.</p>
<a href="/ar/release-management/" class="text-link">اعرف المزيد ←</a>
</div>
</div>
</div>
</section>

<section id="faq" class="faq-section section-padding">
<div class="container">
<h2 class="section-heading" style="margin-top: 6rem; margin-bottom: 6rem;">الأسئلة الشائعة</h2>

<div class="accordion">
<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        ما أنواع المستندات ومصادر البيانات التي يمكن لـ AutoRAG معالجتها؟
</button>
</h3>
<div class="accordion-panel">
<p>يمكن لـ AutoRAG معالجة أي محتوى نصي تقريباً بما في ذلك ملفات PDF ومستندات Word وعروض PowerPoint وجداول بيانات Excel وصفحات HTML وملفات Markdown ومستودعات الأكواد وقواعد البيانات والويكي وقواعد المعرفة والبيانات المنظمة من واجهات برمجة التطبيقات. يتعامل النظام أيضاً مع الصور ذات المحتوى النصي من خلال التعرف البصري على الأحرف ويمكنه استخراج البيانات من الجداول والمخططات والعناصر المرئية الأخرى.</p>
<p>لتنسيقات البيانات المتخصصة أو الأنظمة الخاصة، يمكن لفريقنا تطوير موصلات مخصصة لضمان التكامل السلس مع البنية التحتية المعرفية الموجودة لديك.</p>
<div style="margin-top: 1rem;">
<span class="tag">PDF</span>
<span class="tag">Word</span>
<span class="tag">Excel</span>
<span class="tag">HTML</span>
<span class="tag">Markdown</span>
<span class="tag">قواعد البيانات</span>
<span class="tag">بيانات API</span>
</div>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        كيف يتعامل AutoRAG مع أمان البيانات ومتطلبات الامتثال؟
</button>
</h3>
<div class="accordion-panel">
<p>تم تصميم AutoRAG بأمان على مستوى المؤسسة في جوهره. تحدث جميع معالجة البيانات داخل محيط الأمان الخاص بك، سواء في بيئة السحابة الخاصة بك أو في الموقع. يدعم النظام:</p>
<ul>
<li>التشفير من طرف إلى طرف لجميع البيانات في حالة السكون والعبور</li>
<li>ضوابط الوصول القائمة على الأدوار لرؤية المستندات</li>
<li>خيارات إقامة البيانات لمتطلبات الامتثال الإقليمية</li>
<li>تسجيل التدقيق لجميع عمليات النظام والوصول إلى البيانات</li>
<li>الامتثال لـ GDPR وHIPAA وSOC 2 وأطر تنظيمية أخرى</li>
</ul>
<p>بالإضافة إلى ذلك، تتضمن خيارات النشر لدينا بيئات معزولة هوائياً لأعلى متطلبات الأمان.</p>
</div>
</div>

<div class="accordion-item">
<h3>
<button class="accordion-trigger">
                        ما هي موفري ونماذج LLM التي يدعمها AutoRAG؟
</button>
</h3>
<div class="accordion-panel">
<p>AutoRAG محايد للنموذج ويعمل مع أي LLM تقريباً، بما في ذلك:</p>
<ul>
<li>نماذج OpenAI (GPT-4، GPT-3.5، إلخ.)</li>
<li>نماذج Anthropic (سلسلة Claude)</li>
<li>نماذج Google (سلسلة Gemini)</li>
<li>نماذج Meta (سلسلة Llama)</li>
<li>نماذج Mistral</li>
<li>نماذج مفتوحة المصدر (قابلة للنشر على البنية التحتية الخاصة بك)</li>
<li>نماذج مخصصة مضبوطة بدقة</li>
</ul>
<p>يحسن النظام تلقائياً مخرجاته لقيود نافذة السياق والقدرات المحددة لكل نموذج. تتيح وحدة التحكم الإدارية لدينا التبديل السهل بين النماذج واختبار A/B للحصول على الأداء الأمثل.</p>
</div>
</div>
</div>
</div>
</section>

<section style="background: linear-gradient(135deg, rgba(107, 70, 193, 0.1), rgba(92, 226, 231, 0.1)); padding: 4rem 0;">
<div class="container" style="text-align: center;">
<h2 style="font-size: 2.5rem; color: #1e3a2b; margin-bottom: 1rem;">هل أنت مستعد للبدء؟</h2>
<p style="font-size: 1.25rem; margin-bottom: 2rem; color: #2d3c34;">حوّل تطبيقات الذكاء الاصطناعي الخاصة بك مع الحل الشامل لـ AutoRAG.</p>
<div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
<a href="https://meetings.hubspot.com/michael-mooring/divinci-ai" class="secondary-button" target="_blank">طلب عرض توضيحي</a>
<a href="https://docs.divinci.ai/autorag" class="text-link" style="padding: 12px 24px; border: 2px solid transparent;">عرض الوثائق</a>
</div>
</div>
</section>