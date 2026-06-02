+++
title = "القدرات الاثنتا عشرة لضمان الجودة وإدارة الإصدار التي يجب أن تشحنها كل منصة نماذج لغوية مخصّصة"
description = "قائمة قدرات لمنصّات إصدار LLM: بوّابات واعية بالشرائح، قُضاة معايَرون، استرجاع ذرّي، إيصالات تجزئة — ما الذي يُشحَن، وما الذي ينقص."
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "استعرضنا اثنتي عشرة منصّةً لإصدار النماذج اللغوية الكبيرة قبل أن نبني منصّتنا. ينقسم السوق إلى ثلاثة معسكرات لا يلتقي بعضها ببعض تمامًا — أدوات التقييم المستمرّ، وأدوات الكناري على الخدمة، وأدوات المراقبة — والوصلة المفقودة بينها هي بالضبط الوصلة التي يحتاجها إصدار العميل. هذه التدوينة هي قائمة التحقّق التي خرجت من ذلك الاستعراض: 12 اختبارًا محدّدًا يمكنك تطبيقها على أيّ منصّة، بما في ذلك منصّتنا."
+++

*ملاحظات من دورة الإصدار — الجزء الثالث*

---

قبل عامٍ، وقبل أن نبدأ في بناء خطّ إصدارنا الخاصّ، جلسنا وأدرجنا كلّ قدرة لضمان الجودة وإدارة الإصدار رأينا أنّه ينبغي على منصّة جادّة للنماذج اللغوية الكبيرة شحنها. ثمّ قيّمنا اثنتي عشرة منصّةً أخرى مقابل القائمة — LangSmith وMLflow وWeights & Biases وBraintrust وHumanloop وPatronus وArize وPhoenix وConfident وDeepchecks وSageMaker Deployment Guardrails وKServe وBentoCloud وVertex AI Endpoints وSeldon Core. لم تكن لدى أيّ جهةٍ جميع الاثنتي عشرة. والمجموعات التي *شُحنت* فعلًا تجمّعت في ثلاثة معسكرات لا تتلامس تمامًا.

هذه التدوينة هي قائمة القدرات الناتجة عن ذلك، مصاغةً بشكلٍ قابلٍ للنقل. وهي منظَّمة بحسب أيّ من المراحل الأربع في خطّنا تنتمي إليها كلّ قدرة — **التسجيل ← البوّابة ← الإطلاق ← المراقبة** — حتى تتراكب نظيفًا مع [بنية الخطّ](/ar/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) ومع [أنماط الفشل](/ar/blog/10-ci-cd-release-failures-in-custom-language-models/) التي كتبنا عنها. إن كنت تُقيّم أدواتٍ، فاعمل على القائمة من أعلى إلى أسفل مقابل كلّ مرشّحٍ؛ فالأدوات ذات الفجوات الأعمق ستخبرك إلى أيّ معسكرٍ تنتمي.

## المعسكرات الثلاثة (حتى تعرف ما الذي تنظر إليه)

قبل قائمة التحقّق نفسها، إليك شكل السوق في 2026:

- **معسكر التقييم المستمرّ (Eval-CI)** — Braintrust وHumanloop وPatronus. يشغّلون مقيّمات آليّة عند دمج الـPR. يحجبون عمليّات الدمج السيّئة. لا يلامسون حركة المرور الحيّة قطّ. أقوياء في القدرات 4–6؛ غائبون في 7–12.
- **معسكر الكناري على الخدمة** — SageMaker Deployment Guardrails وKServe وVertex AI Endpoints وBentoCloud وSeldon Core. يُقسّمون حركة المرور، ويرصدون مقاييس البنية التحتيّة، ويُعيدون الإصدار تلقائيًّا عند تنبيهاتٍ من نوع CloudWatch. أقوياء في 1 و7 و9؛ غائبون عن جانب الجودة في 8 و10–12.
- **معسكر المراقبة** — Arize Phoenix وConfident AI وDeepchecks. يراقبون الإنتاج، ويُنبّهون البشر، ويُصعّدون. أقوياء في 10 (المراقبة)، لكنّهم لا يفرضون شيئًا — التنبيه ليس استرجاعًا تلقائيًّا.

الفجوة بين هذه المعسكرات — بين "اجتاز الـCI" و"كناري حيّ يُقيَّم على الجودة لا على زمن الاستجابة فحسب" — هي الجزء الذي يضطرّ الجميع إلى تجسيره يدويًّا. وإغلاق هذه الفجوة هو الادّعاء الحامل في هذه التدوينة.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="مخطّط فن للمعسكرات الثلاثة لمنصّات النماذج اللغوية الكبيرة. معسكر التقييم المستمرّ (Braintrust وHumanloop وPatronus) إلى اليسار ويغطّي التقييم خارج الخطّ عند دمج الـPR. معسكر الكناري على الخدمة (SageMaker وKServe وVertex وBentoCloud وSeldon) إلى اليمين ويغطّي تقسيم حركة المرور مع استرجاع مبنيٍّ على مقاييس البنية التحتيّة. معسكر المراقبة (Arize وPhoenix وConfident وDeepchecks) في الأسفل ويغطّي المراقبة والتنبيه دون فرض. تتداخل الدوائر الثلاث ثُنائيًّا في شرائح ضيّقة، لكنّ المنطقة المركزيّة حيث تلتقي الثلاث جميعًا فارغة. ذلك المركز الفارغ هو الوصلة المفقودة التي تدور حولها هذه التدوينة — قرار إصدار يقوده قياس جودة لكلّ شريحة، يُفرَض ذرّيًّا على حركة المرور الحيّة.">
<title>المعسكرات الثلاثة والمركز المفقود</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">المعسكرات الثلاثة التي لا تلتقي تمامًا</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">كلّ معسكر يملك قطعةً واحدة. المركز هو ما يجسّره كلّ فريقٍ يدويًّا.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">التقييم المستمرّ</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust وHumanloop</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">وPatronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">بوّابات تقييم خارج الخطّ</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">عند دمج الـPR</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">الكناري على الخدمة</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker وKServe</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">وVertex وBentoCloud</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">وSeldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">تقسيم حركة المرور +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">استرجاع بمقاييس البنية</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">المراقبة</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize وPhoenix وConfident وDeepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">مراقبة + تنبيه (بلا فرض)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">الوصلة</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">المفقودة</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">الوصلة المفقودة: بوّابة جودةٍ لكلّ شريحة ← استرجاع ذرّي يقوده قياس جودة المخرجات، لا مقاييس البنية التحتيّة.</p>

## المرحلة ① — التسجيل

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">التسجيل</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">طبقة بيانٍ غير قابلة للتغيير. نسب الفشل بحسب الـSHA.</span>
  </div>
</div>

### القدرة 1. بيانُ إصدارٍ غير قابلٍ للتغيير بـSHA معنوَن بالمحتوى

ما هي: الإصدار ليس ملفّ أوزانٍ للنموذج. الإصدار حِزمة غير قابلة للتغيير من *كلّ شيء* — قطعة النموذج، وقالب التوجيه، وقواعد التوجيه، وإصدار مجموعة البيانات، وإصدار المعالجة المسبقة — مُعنوَنة بـSHA-256 وحيد. على شخصَين ينشران "الإصدار ذاته" أن يُنتجا الـSHA ذاته، وإلّا رفض الخطّ.

لمَ تهمّ: من دون ذلك، يصبح سؤال "أيّ تغييرٍ كسر الإنتاج؟" بلا إجابةٍ حين تكون الحالة موزّعة على ثلاثة أنظمة. انقطاع Atlassian في أبريل 2022<sup><a href="#ref-1">[1]</a></sup> استغرق اثنتي عشرة ساعةً لكلّ موقع تحديدًا لأنّ الحالة كانت تعيش في أنظمةٍ مُصدَّرة باستقلاليّةٍ تامّةٍ كان لا بدّ من تنسيقها لتعود إلى الاتّفاق.

من يشحنها: معسكر الكناري على الخدمة جزئيًّا (النموذج + التوجيه)؛ سجلّات النماذج (MLflow وW&B Models<sup><a href="#ref-2">[2]</a></sup>) جزئيًّا (قطعة النموذج فقط). لا يكاد أحدٌ يضمّ **قالب التوجيه** إلى الـSHA، وهو بالضبط الحقل الذي يتغيّر في معظم الأحيان.

### القدرة 2. تحكّم ذرّي في الإصدار عبر جميع مكوّنات الإصدار

ما هي: التبديل من الإصدار A إلى الإصدار B يقلب *كلّ شيء* في تعليمةٍ واحدة — الأوزان والتوجيه والتمرير ومجموعة البيانات والمعالجة المسبقة — لا في خمس تعديلات لوحةٍ منفصلة.

لمَ تهمّ: التبديلات الجزئيّة تخلق نوافذ سلوكٍ غير محدّدة. إذا حُدِّث قالب التوجيه ولم تُحدَّث قاعدة التمرير، فإنّ كلّ طلبٍ يضرب القالب الجديد بصنف التمرير القديم يقع في حالةٍ لم يُخطّط لها أحد.

من يشحنها: لا أحد بالكامل. معسكر الكناري على الخدمة يبدّل صورة النموذج ذرّيًّا؛ أمّا التوجيه والتمرير فيقطنان عادةً في مكانٍ آخر. التبديل المدفوع بالبيان هو من حيث يأتي ادّعاء Divinci بشأن الاسترجاع الذرّي<sup><a href="#ref-5">[5]</a></sup>.

### القدرة 3. تكافؤ بيئة التدريب والخدمة

ما هي: خطّ المعالجة المسبقة المستخدَم أثناء تقييم البوّابة هو *نفسه* المعالجة المسبقة التي يستخدمها خادم الإنتاج. إذا تباعدا، فكلّ رقمٍ خارج الخطّ هو كذبة.

لمَ تهمّ: انحراف التدريب-عن-الخدمة هو أحد [إخفاقات الإصدار العشرة](/ar/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) التي كتبنا عنها. العَرَض هو "يؤدّي جيّدًا في التقييم، ويتصرّف كنموذجٍ مختلف في الإنتاج". العلاج هو تسجيل المعالجة المسبقة في البيان وتقييد البوّابة مقابل إصدار المعالجة المسبقة في الإنتاج.

من يشحنها: تستحقّ أُطر التحويل إلى الحاويات (BentoML وKServe) بعض الفضل بإسكان المعالجة المسبقة مع الخدمة في الموقع نفسه. لا أحد منهم يربط المعالجة المسبقة بإدخال بوّابة التقييم.

## المرحلة ② — البوّابة

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">البوّابة</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">معامل Spearman ρ لكلّ شريحة مقابل مُصحّحٍ مُرسًى بشريًّا.</span>
  </div>
</div>

### القدرة 4. بوّابة جودةٍ لكلّ شريحة / لكلّ نطاق

ما هي: قرار البوّابة يستهلك درجاتٍ *لكلّ شريحة* — صياغة العقود، التفسير القانوني، ترخيص الملكيّة الفكريّة — لا متوسّطًا واحدًا. أيّ شريحةٍ واحدة تقع تحت عتبتها تُؤشّر الإصدار بـ`gate_fail`، بصرف النظر عن شكل المتوسّط.

لمَ تهمّ: المتوسّطات تطمس الانحدارات الموضعيّة. تكتب Tianpan في *Semver Lie*<sup><a href="#ref-3">[3]</a></sup> أنّ هذا هو نمط فشل إصدار النماذج اللغوية المهيمن لعام 2026: نموذجٌ يتحسّن في المتوسّط بينما ينهار بهدوءٍ على صنف رحلة مستخدمٍ واحد.

من يشحنها: **لا أحد آخر في 2026**. أدوات التقييم المستمرّ — Braintrust وHumanloop وPatronus — تُقيّم مقابل قاعدة تقييمٍ عامّةٍ واحدة أو قائمة مهامٍّ مسطّحة. لا تكشف عتبةً لكلّ شريحة ولا تجاوزًا أعمى للشرائح. هذه هي أوّل نقطةٍ تفشل فيها المعسكرات في اللقاء.

### القدرة 5. قاضٍ معايَر مُرسًى بشريًّا (Spearman ρ مقابل تقييمات البشر)

ما هي: القاضي ليس نموذجًا لغويًّا عامًّا بوصفه قاضيًا. هو قاضٍ نموذجٌ لغويّ يُقاس Spearman ρ الخاصّ به مقابل لجنة خبراءٍ في النطاق ويُكوَّن لكلّ شريحة. يُختار القاضي لأنّ ترتيبه يطابق ترتيب البشر، لا لأنّ له سمعةً قويّة.

لمَ تهمّ: تُظهر MT-Bench<sup><a href="#ref-6">[6]</a></sup> أنّ GPT-4 بوصفه قاضيًا يتّفق مع البشر بأكثر من 80% إجمالًا، مع تباينٍ بحسب الفئة من البرمجة (86%) نزولًا إلى الكتابة (36–44%). "الاتّفاق الإجمالي" يُخفي الشرائح التي يكون فيها القاضي غير موثوق. معايرة القاضي لكلّ شريحةٍ هي السبيل الأمين الوحيد لجعل التقييم الآليّ جديرًا بالثقة.

من يشحنها: تُشغّل Braintrust وHumanloop وPatronus مقيّمات قضاة. لا أحد منهم يشترط أو يكشف أو يحفظ معايرةً Spearman مُرسًى بشريًّا لكلّ شريحة. خطّ معايرة Divinci موثّق في [معايرة قاضي الذكاء الاصطناعي](/ar/blog/calibrating-the-ai-judge/).

### القدرة 6. مسار تجاوزٍ بمسوّغٍ مكتوبٍ مطلوب

ما هي: تجاوز فشل بوّابةٍ بالقوّة مسموح به (الإقلاع البارد، الانحدارات المقبولة، إلخ.) لكنّه يستلزم حقلَين — `forceGateOverride: true` و`overrideReason: "..."`. يدخل السبب في سجلّ التدقيق إلى جانب معرّف المستخدم. لا تجاوزات مجهولة.

لمَ تهمّ: بوّابات الحوكمة ليست ميزة امتثالٍ منفصلة؛ هي خاصّيّة من خصائص مرحلة البوّابة نفسها. على سجلّ التدقيق ألّا يجيب عن "هل استُخدم هذا التجاوز؟" فحسب، بل عن "ما المسوّغ في حينه؟" — لأنّ نفسك المستقبليّ سيحتاج إلى قراءته.

من يشحنها: لأدوات التقييم المستمرّ علاماتٌ؛ لا أحد منهم يشترط المسوّغ بوصفه جزءًا بنيويًّا من التجاوز.

## المرحلة ③ — الإطلاق

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">الإطلاق</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">كناري عند 5% ← 25% ← 100% بمراقب جودةٍ في كلّ خطوة.</span>
  </div>
</div>

### القدرة 7. كناري متعدّد نقاط التحقّق مع زمن مكوث

ما هي: تنتقل حركة المرور من 0% إلى الإنتاج عبر ثلاث نقاط تحقّقٍ على الأقلّ — عادةً **5% ← 25% ← 100%** — وتمكث عند كلّ نقطةٍ إمّا لزمن مكوثٍ مُكوَّن أو لعدد طلباتٍ مُكوَّن، أيّهما *أبعد*. لا قفز فوريّ من 0% إلى 100%.

لمَ تهمّ: تظهر علل الذيل الطويل عند مقاييس الإنتاج. علّةٌ تؤثّر على 0.3% من المحادثات لا تُرى في تقييمٍ من 100 طلب، وتكون بديهيّة عند 5% من حركة الإنتاج. زمن المكوث هو ما يمنح الكناري وقتًا لرؤية الذيل الطويل.

من يشحنها: معسكر الكناري على الخدمة يشحن هذا. يوثّق AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> قيمة `TerminationWaitInSeconds` الافتراضيّة عند 600 (عشر دقائق). وKServe وBentoCloud وSeldon وVertex جميعها تكشف تكاوين كناري متعدّدة الخطوات مماثلة. هذه هي القدرة التي بلغت التشبّع.

### القدرة 8. مراقب جودة مخرجاتٍ في كلّ نقطة تحقّق كناري

ما هي: عند كلّ نقطة تحقّق، يفحص الخطّ ثلاثة مراقبين قبل التقدّم — زمن الاستجابة p95، ومعدّل 5xx، **و**درجة جودة مخرجاتٍ يحسبها القاضي المعايَر ذاته من القدرة 5. زمن الاستجابة و5xx وحدهما لا يكفيان.

لمَ تهمّ: هذا هو المكان الذي تفشل فيه المعسكرات في اللقاء مجدّدًا. SageMaker وKServe وVertex وBentoCloud وSeldon جميعها ترصد زمن الاستجابة ومعدّل الأخطاء. لا أحد منهم يشحن مراقب جودة مخرجاتٍ في كلّ نقطة تحقّق — لأنّه ليس لديهم قاضٍ معايَر يُقيّمون مقابله. أدوات التقييم المستمرّ تملك القاضي لكنّها لا تقع على حركة المرور.

من يشحنها: لا أحد يُكمل الجسر. توجد بنية الكناري الماكثة في معسكر الخدمة؛ ويوجد القاضي المعايَر في معسكر التقييم المستمرّ؛ لكنّنا لم نرَ أحدًا يصلهما.

### القدرة 9. توقّف تلقائي عند خرق الجودة

ما هي: نقطة تحقّق كناري تفشل في جودة المخرجات تتوقّف تلقائيًّا. لا يتقدّم الترقّي. لا حاجة إلى استدعاء بشريٍّ لإيقاف الإطلاق.

لمَ تهمّ: البشر ليسوا في الحلقة في الإطار الزمنيّ الذي تتحرّك فيه الإطلاقات. بحلول وصول تذكرة عميل، تكون نقطة 25% قد انتهت وحدث ترقّي 100%.

من يشحنها: معسكر الكناري على الخدمة يتوقّف عند مقاييس البنية التحتيّة. توقّف مقياس الجودة هو الجزء الذي يستلزم وجود القدرة 8.

## المرحلة ④ — المراقبة

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">المراقبة</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">إعادة تشغيلٍ متواصلة لآثار الإنتاج ← استرجاع ذرّي في نحو 12 ثانية.</span>
  </div>
</div>

### القدرة 10. إعادة تشغيلٍ متواصلة لآثار الإنتاج عبر المرشّح

ما هي: بعد ترقّي الكناري إلى 100%، يستمرّ المراقب في العمل. يأخذ عيّناتٍ من آثار الإنتاج الأخيرة، ويعيد تشغيلها عبر الإصدار *المرشّح* (النشط الآن)، ويُقيّمها بالقاضي المعايَر، ويُصدر درجة جودةٍ لكلّ دقيقة. متواصلة، لا دوريّة.

لمَ تهمّ: انخفاضات الجودة الصامتة — تحوّط النموذج، أو هلوسة تاريخٍ بثقة، أو رفضٌ حيث لا ينبغي — لا تحرّك أبدًا زمن الاستجابة ولا 5xx. الإشارة الوحيدة التي تحصل عليها لهذه الحالات هي تذكرة العميل، وهي أسوأ إشارةٍ ممكنة. مراقبُ جودةٍ متواصل يقتنصها في دقائق أحاديّة.

من يشحنها: **لا أحد.** معسكر المراقبة (Arize وPhoenix وConfident وDeepchecks<sup><a href="#ref-7">[7]</a></sup>) يراقب مخرجات الإنتاج لكنّه لا يفرض. معسكر الكناري على الخدمة يرصد البنية. معسكر التقييم المستمرّ لا يقع على حركة المرور. الحلقة المغلقة — آثار الإنتاج ← القاضي المعايَر ← الفرض — هي الوصلة المفقودة.

### القدرة 11. استرجاع ذرّي في ثوانٍ لا في دقائق

ما هي: حين يُحفّز المراقب (ثلاث دقائق متتالية تحت العتبة، مثلًا)، ينطلق الاسترجاع تلقائيًّا. يعيد الاسترجاع توجيه التمرير إلى `previous_release` من البيان. ولأنّ الإصدار السابق كان بيانًا محزومًا بالكامل، يُقلَب كلّ مكوّنٍ ذرّيًّا. من البداية إلى النهاية بما في ذلك تصريف الطلبات الجارية على خدمةٍ بنحو 100 نسخة: نحو 12 ثانية<sup><a href="#ref-5">[5]</a></sup>.

لمَ تهمّ: استغرق انقطاع Cloudflare في يونيو 2022<sup><a href="#ref-8">[8]</a></sup> 44 دقيقةً للتراجع. السبب لم يكن التراجع نفسه — بل أنّ المهندسين داسوا تراجعات بعضهم البعض لأنّ الحالة كانت موزّعة. الاسترجاع المدفوع بالبيان هو تعليمةٌ واحدة؛ لا يمكن أن يُصاب بنمط الفشل ذاك.

من يشحنها: معسكر الكناري على الخدمة يشحن استرجاعًا سريعًا للبنية التحتيّة (مُحفَّزًا بإنذار، قلب أزرق-أخضر). الفارق المعماري هو ما إذا كان *المحفّز* بنية-تحتيّة-فقط أم واعيًا بالجودة (القدرة 10).

### القدرة 12. إيصال امتثالٍ مُسلسَل بالتجزئة قابلٌ للإرساء خارجيًّا

ما هي: كلّ قرار إصدار — تسجيل، اجتياز بوّابة، فشل بوّابة، تجاوز بوّابة، ترقية نقطة تحقّق، استرجاع تلقائيّ — يُصدر إيصالًا بصيغة JSON-بـSHA-256، مسلسلًا بالتجزئة إلى الإيصال السابق لهذا العميل والإيصال السابق لهذا الإصدار. تُرسى السلسلة خارجيًّا وفق جدولٍ يُكوّنه العميل.

**تحفّظ الأوزان المفتوحة.** حين يكون الإصدار مدعومًا بنموذجٍ بأوزانٍ مفتوحة (Gemma وQwen وLlama وMistral وGPT-OSS)، يُضمَّن الإيصال [توثيق وزن vIndex](/ar/compliance/) — برهانٌ بأنّ الأوزان النشطة في وقت القرار هي الأوزان التي سجّلها البيان. حين يكون الإصدار مدعومًا بنموذج واجهة برمجة تطبيقات مغلقة (OpenAI وAnthropic وGoogle عبر واجهات معتمة)، يُغطّي الإيصال سلسلة القرار لكنّه لا يستطيع ادّعاء مصدر الأوزان، لأنّ المزوّد لا يكشف الأوزان. ويقول الإيصال ذلك صراحةً. هذا هو حدّ ما يمكن التحقّق منه.

لمَ تهمّ: تحصل الصناعات المنظَّمة على *سجلّاتٍ* اليوم. ويتزايد طلب قانون الذكاء الاصطناعي الأوروبيّ وإطار إدارة مخاطر الذكاء الاصطناعي لـNIST<sup><a href="#ref-9">[9]</a></sup> *للبراهين*. الإيصال المُسلسَل بالتجزئة هو الفارق بين "لدينا سجلّ" و"يمكن لمدقّقٍ التحقّق من السلسلة دون أن يثق بسجلّنا".

من يشحنها: لا أحدَ غيرنا. هذا هو جزء التمييز الذي يُسقَط مباشرةً على [صفحة الامتثال](/ar/compliance/) الحاليّة لـDivinci — صيغة الإيصال نفسها، مُوسَّعةً لتشمل قرارات الإصدار.

## القدرات الاثنتا عشرة، بحسب معسكر المنصّة

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="مصفوفة القدرات الاثنتي عشرة بحسب معسكر المنصّة. Divinci لديه الاثنتا عشرة جميعًا. معسكر التقييم المستمرّ (Braintrust وHumanloop وPatronus) لديه 5 و6. معسكر الكناري على الخدمة (SageMaker وKServe وBentoCloud وVertex وSeldon) لديه 1 جزئيًّا و2 جزئيًّا و7 و9 و11 على مقاييس البنية التحتيّة. معسكر سجلّ النماذج (W&B Models وMLflow وLangSmith) لديه 1 جزئيًّا و2 جزئيًّا. معسكر المراقبة (Arize وPhoenix وConfident وDeepchecks) لديه 10 في شكل مراقبة فقط. لا أحد غيرهم لديه 4 بوّابة لكلّ شريحة، و5 قاضٍ معايَر مُرسًى بشريًّا، و8 مراقب جودة مخرجات في الكناري، و10 إعادة تشغيل آثار حلقةٍ مغلقة مع فرض، و12 إيصالات مسلسلة بالتجزئة.">
<title>القدرات الاثنتا عشرة، بحسب المعسكر</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">أيّ معسكرٍ يشحن أيّ قدرة</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = يشحنها. ◐ = جزئيّ (بنية-فقط، أو سجلّ-فقط). ✗ = لا يشحنها. ستّ قدراتٍ مفقودة في كلّ المعسكرات الأخرى.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">القدرة</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">تقييم مستمرّ</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">خدمة</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">سجلّ</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">مراقبة</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. SHA بيان غير قابل للتغيير</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. تبديل إصدار ذرّي (كلّ المكوّنات)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. تكافؤ بيئة التدريب-الخدمة</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. بوّابة جودة لكلّ شريحة / نطاق</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. قاضٍ معايَر مُرسًى بشريًّا</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. مسار تجاوز بمسوّغ مطلوب</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. كناري متعدّد نقاط التحقّق مع مكوث</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. مراقب جودة مخرجات في كلّ نقطة</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. توقّف تلقائي عند خرق الجودة</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. إعادة تشغيل آثار إنتاج بحلقة مغلقة</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. استرجاع ذرّي في ثوانٍ</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. إيصال امتثال مسلسَل بالتجزئة</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">القدرات 4 و5 و8 و10 و12 مُبرَزة: هي الخمسة التي لا تشحنها جهةٌ أخرى في هذا المسح. أمّا البقيّة فتتجمّع في معسكرٍ أو آخر.</text>
</svg>
</figure>

النمط هو المقصد. خمس قدراتٍ — **بوّابة لكلّ شريحة، وقاضٍ معايَر، ومراقب جودة كناري، وإعادة تشغيل بحلقةٍ مغلقة، وإيصال مُسلسَل بالتجزئة** — تظهر بعلامة ✗ عبر كلّ معسكرٍ آخر. تلك هي الوصلة. أمّا السبع الباقيات فتتوزّع على المعسكرات بطرقٍ تجعل كلّ معسكرٍ متماسكًا داخليًّا لكنّ جميعها ناقصةٌ بعضها لبعض.

## ما الذي يجعل ضمان الجودة مختلفًا للنماذج اللغوية المخصّصة عن البرمجيات؟

النماذج اللغوية ليست حتميّة، حتى عند درجة حرارةٍ تساوي صفرًا — يُسبّب التجميع والاختلافات في العتاد تباينًا في المخرجات. هذه الخاصّيّة وحدها تكسر معظم الافتراضات التي بُني عليها ضمان الجودة التقليديّ:

- **لا يمكنك كتابة تأكيدات `expect(output).toEqual(X)`.** تحتاج إلى تقييمٍ مدركٍ للتوزيع يستهلك ارتباط الرتب مقابل مُصحّحٍ مُرسًى بشريًّا، لا المساواة مقابل ثابتة. هذا ما تمثّله القدرة 5.
- **يمكن لنموذجٍ أن يجتاز فحص جودةٍ إجماليًّا بينما يفشل على شريحة.** لذلك توجد القدرة 4 بشكلٍ منفصل. إن لم يكن تقييمك قادرًا على التشريح، فلا يمكنه اقتناص الانحدارات المدركة للشرائح.
- **إخفاقات الجودة صامتة على طبقة البنية التحتيّة.** يبقى زمن الاستجابة و5xx نظيفَين بينما يتحوّط النموذج أو يهلوس. توجد القدرتان 8 و10 لأنّ لا مراقبًا من جانب البنية يمكنه رؤية ذلك.
- **الاسترجاع ليس اختياريًّا.** لأنّ أنماط الفشل احتماليّة وبعضها صامت، يجب أن يكون مسار الاسترجاع بنيةً تحتيّة أوّليّة، لا خطّة احتياط. القدرة 11 هي ما يُتيح "12 ثانية"؛ والقدرة 2 هي ما يجعلها صحيحة.

منصّة ضمان جودةٍ وإصدارٍ لا تأخذ في حسبانها هذه الحقائق الأربع تشحن CI/CD برمجيّاتٍ حتميّة بشعار نموذجٍ لغويّ مُلصَق. والسوق يفعل ذلك كثيرًا.

## كيف تدعم سجلّات التدقيق الامتثال للذكاء الاصطناعي عمليًّا؟

أكثر فجوات الامتثال شيوعًا التي نراها — حين يصل مدقّقٌ بعد ستّة أشهرٍ من النشر ويسأل "أيّ إصدارٍ من النموذج كان يعمل في 15 مارس، ومن وافق على ذلك الإصدار؟" — ليست "ليس لدينا سجلّات". بل "لدينا سجلّات عبر خمسة أنظمة والجداول الزمنيّة لا تتوافق".

إيصال امتثال (القدرة 12) يحلّ هذا بجعل السجلّ نفسه قطعةً قابلةً للنقل: مُسلسَلة بالتجزئة، ذات مصدرٍ واحد، قابلة للإرساء خارجيًّا. يمكن لمدقّقٍ التحقّق من السلسلة دون الثقة ببنيتنا التحتيّة. هذا هو الفارق بين "لدينا سجلّات" و"السجلّات قابلة للإثبات".

بالنسبة لإصداراتٍ مدعومةٍ بنماذج أوزانٍ مفتوحة، يضمّن الإيصال أيضًا توثيقًا للأوزان — برهانًا تشفيريًّا بأنّ الأوزان النشطة هي الأوزان التي سجّلها البيان. هذا يلبّي الطلبات الأصعب (المادّة 17 من اللائحة العامّة لحماية البيانات حول حقّ المحو، ومتطلّبات المصدر في قانون الذكاء الاصطناعي الأوروبيّ) لأنّ بإمكانك إثبات *ليس فقط ما الذي نُشر* بل *أنّ الأوزان الأساسيّة هي ما تدّعيه*.

أمّا بالنسبة لإصداراتٍ مدعومة بواجهات برمجة تطبيقات مغلقة — حين يُخدَّم النموذج خلف واجهةٍ معتمة ولا تُكشَف الأوزان — فإنّ الإيصال يُغطّي سلسلة القرار لكنّه لا يستطيع ادّعاء مصدر الأوزان. نقول ذلك في الإيصال صراحةً بدلًا من أن نُلمح إلى برهانٍ لا نستطيع تقديمه. هذا هو حدّ ما يمكن التحقّق منه حين يحتفظ المزوّد بالأوزان داخليًّا.

## ما الذي لا تحلّه هذه القائمة

ثلاث حدودٍ صريحة:

**القدرات ليست مربّعات تأشيرٍ لذاتها.** منصّة تشحن الاثنتي عشرة جميعًا بشكلٍ سيّئ أسوأ من واحدةٍ تشحن ثمانيًا منها بشكلٍ جيّد. القائمة نقطة انطلاقٍ للتقييم، لا بطاقة درجاتٍ لطلبات عروض المورّدين.

**اللقطة التنافسيّة هي 2026 وستتغيّر.** بعد ستّة أشهر، ستنقلب بعض علامات الـ✗ أعلاه — سيقرأ المنافسون التحليلات اللاحقة ويُسدّون الفجوات. إن قرأت هذه التدوينة في 2027، فدقّق العلامات بنفسك قبل تصديقها.

**بعض القدرات تعتمد على أخرى.** القدرة 8 (مراقب جودة مخرجات الكناري) تستلزم القدرة 5 (القاضي المعايَر). القدرة 10 (إعادة تشغيل آثارٍ بحلقةٍ مغلقة) تستلزم كلتيهما. منصّة تشحن 8 من دون 5 تشحن دواءً وهميًّا — يوجد مراقب الكناري لكنّه غير مُؤسَّسٍ مقابل شيءٍ جدير بالثقة.

## الأسئلة الشائعة

### ما أهمّ قدرة لضمان الجودة لإصدارات النماذج اللغوية المخصّصة؟

بوّابة جودةٍ لكلّ شريحة (القدرة 4) — أي أنّ قرار الإصدار يستهلك درجات Spearman لكلّ نطاق مقابل مُصحّحٍ مُرسًى بشريًّا، لا متوسّطًا عامًّا وحيدًا. المتوسّطات تطمس الانحدارات الموضعيّة، والانحدارات الموضعيّة هي نمط فشل إصدار النماذج اللغوية المهيمن لعام 2026<sup><a href="#ref-3">[3]</a></sup>. إن كنت تستطيع شحن قدرةٍ واحدة فقط من هذه القائمة، فاشحن 4. ثمّ اشحن 5، التي هي ما يجعل 4 جديرةً بالثقة.

### كيف تُقيّم منصّة ضمان جودة نماذج لغوية دون تشغيلها ستّة أشهر؟

طبّق قائمة التحقّق ذات الاثنتي عشرة قدرةً أعلاه على وثائق المورّد، مع اختبارَين محدّدَين. أوّلًا، اطلب من المورّد أن يُريك مخرج البوّابة *لكلّ شريحة* لأحد عملائه المرجعيّين — إن كانت لديهم درجاتٌ إجماليّة فحسب، فلا تتوفّر فيهم القدرة 4. ثانيًا، اسأل ما الذي يحفّز استرجاعهم التلقائيّ — إن كانت الإجابة "زمن الاستجابة، ومعدّل الأخطاء، وتنبيهاتنا"، فهم في معسكر الكناري على الخدمة والقدرة 10 مفقودة.

### ما الفارق بين أدوات التقييم المستمرّ وأدوات إدارة الإصدار؟

أدوات التقييم المستمرّ (Braintrust وHumanloop وPatronus) تُشغّل مقيّمات آليّة عند دمج الـPR وتحجب عمليّات الدمج السيّئة. لا تلامس حركة المرور الحيّة قطّ. أمّا أدوات إدارة الإصدار (هذه الفئة) فتمتلك بيان الإصدار، والكناري، والمراقب، ومسار الاسترجاع. التقييم المستمرّ *جزءٌ من* تدفّق إدارة إصدارٍ لكنّه ليس بديلًا عنه. تشحن كثيرٌ من الفِرَق إحداهما وتكتشف الفجوة حين يضرب انحدارٌ اجتاز الـCI الإنتاجَ بصمت.

### ما السرعة المطلوبة في الاسترجاع؟

بترتيب ثوانٍ، لا دقائق. متوسّط زمن الاسترجاع على خطّ Divinci نحو 12 ثانية — وهو تصريف الطلبات الجارية على خدمةٍ بنحو 100 نسخة، لا تبديل البيان نفسه، الذي يكون أقلّ من ثانية. قارن بحادثة Cloudflare في يونيو 2022<sup><a href="#ref-8">[8]</a></sup> التي استغرقت 44 دقيقةً للتراجع لأنّ الحالة كانت موزّعة عبر الأنظمة. القرار المعماريّ الذي يجعل ثوانيَ-لا-دقائق ممكنةً هو بيان الإصدار المحزوم (القدرتان 1 و2).

### لمَ تهمّ إيصالات الامتثال أكثر من سجلّات الامتثال؟

السجلّ شيءٌ كتبته أنت. الإيصال شيءٌ يستطيع مدقّقٌ التحقّق منه دون أن يثق بك. يُميّز قانون الذكاء الاصطناعي الأوروبيّ وإطار إدارة مخاطر الذكاء الاصطناعي لـNIST<sup><a href="#ref-9">[9]</a></sup> بينهما بشكلٍ متزايد — "موثَّق" ليس مساويًا لـ"قابل للإثبات"، والاتّجاه التنظيميّ يتّجه نحو الثاني. الإيصال المُسلسَل بالتجزئة والمُرسى خارجيًّا هو أبسط تقنيّةٍ متوفّرة لعبور هذا الخطّ.

## المراجع

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Cited for capability 1 — what state-spread-across-systems looks like at scale.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> and <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. The model-artifact-only side of capability 1. Neither ships prompt-template registration.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). Names the slice-aware regression failure mode as the dominant 2026 pattern. Companion: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Anchor for capability 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> and <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> of 600 (ten minutes), maximum 1800 (thirty minutes). The standard infrastructure-metric canary the post contrasts against on capabilities 8 and 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — atomic routing-flip via release manifest.</strong> The ~12-second rollback time is in-flight drain on a ~100-replica service; the manifest swap itself is sub-second. Number is from our own service, not a benchmark. The architecture that makes it possible is the bundled manifest from capability 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) to writing (36–44%). Anchor for capability 5 — why a calibrated judge has to be per-slice.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Observability camp comparison.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Confident AI's 2026 observability tools comparison</a>. All ship monitoring and alerting; none enforce rollback. Anchor for capability 10's "monitor without enforcement" framing.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." 44 minutes from "we know what to revert" to revert complete, in part because engineers walked over each other's reverts. Anchor for capability 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — the four core functions that capability 12 maps onto. Plus the EU AI Act provenance requirements at <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Anchor for capability 12.
</li>
</ol>

---

*التالي في هذه السلسلة:* **التحقّق من النماذج اللغوية المخصّصة وإصدارها في الميادين المنظَّمة.** قائمة القدرات أعلاه عامّة. التدوينة القادمة محدّدة: قانون الذكاء الاصطناعي الأوروبيّ، والمادّة 17 من اللائحة العامّة لحماية البيانات، وHIPAA، وإطار إدارة مخاطر الذكاء الاصطناعي لـNIST — ما الذي يطلبه كلٌّ منها من عمليّة إصدار، وأيّ القدرات أعلاه تُغطّي أيّ متطلّب، وأين يُغيّر انقسام الأوزان المفتوحة/المغلقة قصّة الامتثال فعلًا.
