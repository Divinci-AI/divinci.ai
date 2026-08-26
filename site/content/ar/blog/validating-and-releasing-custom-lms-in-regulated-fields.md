+++
title = "التحقق من النماذج اللغوية المخصصة وإطلاقها في المجالات الخاضعة للتنظيم"
description = "EU AI Act، GDPR المادة 17، HIPAA، NIST AI RMF — مُسقطة قدرة بقدرة على خط إصدار LLM. حيث تتباعد الأوزان المفتوحة عن المغلقة."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vIndex"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "ينقسم امتثال النماذج اللغوية المخصصة في الصناعات الخاضعة للتنظيم انقساماً واضحاً على محور واحد: الأوزان المفتوحة مقابل واجهات الـ API المغلقة. بالنسبة للنماذج ذات الأوزان المفتوحة، يمكنك إصدار شهادة وزن vIndex تستوفي شرط المحو القابل للتحقق المنصوص عليه في المادة 17 من GDPR تشفيرياً. أما بالنسبة للنماذج المغلقة عبر API، فإن نفس الإيصال يغطي سلسلة القرار لكنه لا يستطيع المطالبة بإثبات مصدر الأوزان — والجهة المنظمة تحصل على هذا التمييز في الإيصال نفسه. تُسقط هذه المقالة أربعة أطر تنظيمية (قانون الذكاء الاصطناعي للاتحاد الأوروبي، GDPR، HIPAA، NIST AI RMF) على المراحل الأربع لخط الإطلاق الذي نُصدِره، وتعرض صيغة الإيصال الفعلية."
+++

*ملاحظات من دورة الإطلاق — الجزء الرابع*

---

تدخل المستشارة العامة إلى مراجعة هندسية. لديها سؤال واحد: *"إذا وصل غداً طلب الحق في المحو بموجب المادة 17 من قانون الذكاء الاصطناعي للاتحاد الأوروبي يطلب منا إزالة كل حقيقة تعلمها نموذجنا عن مريض بعينه، فهل نستطيع إثبات أننا فعلنا ذلك؟"*

الجواب الصادق الذي تضطر معظم الفرق إلى تقديمه هو: "يمكننا ضبط النموذج لينسى. يمكننا أن نعرض لكم عملية التدريب. لكننا لا نستطيع إثبات أن المعلومات قد زالت هيكلياً، لأنها قد تظهر مجدداً تحت المُحفِّز العدائي المناسب."

هذا ليس جواباً امتثالياً. إنه لا-جواب مصحوب بهزة أكتاف إجرائية.

تتناول هذه المقالة الشكل الذي يبدو عليه جواب الامتثال الحقيقي للنماذج اللغوية المخصصة — عبر أربعة أطر تنظيمية (**قانون الذكاء الاصطناعي للاتحاد الأوروبي، المادة 17 من GDPR، HIPAA، NIST AI RMF**)، مُسقطةً على خط الإطلاق ذي المراحل الأربع ([التسجيل ← البوابة ← الطرح ← المراقبة](/ar/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)) الذي نُصدِره لإطلاقات العملاء. التوتر الجوهري الذي يسري في كل مطلب تنظيمي هو **الأوزان المفتوحة مقابل واجهات الـ API المغلقة**: الأشياء التي يمكنك إثباتها بشأن ضبط دقيق لـ Gemma 4 ليست الأشياء التي يمكنك إثباتها بشأن إطلاق يُقدَّم خلف API بائع معتم. صيغة الإيصال التي نستخدمها تقول ذلك صراحةً، سطراً بسطر. هذه الصراحة هي ما يجعل الإيصال مفيداً للمدقق.

## المنظمون الأربعة وما يريده كل منهم فعلياً

تنزع نقاشات الامتثال إلى الانهيار في عبارة "لقد وثَّقنا الأمور." هذا التأطير يفشل أمام مدقق. ما يريده المدققون هو *دليل يمكنهم التحقق منه دون الاضطرار إلى الثقة في بنيتكم التحتية*. الأطر الأربعة أدناه تستخدم جميعاً مفردات مختلفة للسؤال الجوهري ذاته.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="أربعة أطر تنظيمية والبنية الأولية للتحقق التي يطلبها كل منها. يطلب قانون الذكاء الاصطناعي للاتحاد الأوروبي توثيق المنطق والإشراف البشري؛ البنية الأولية للتحقق هي توثيق ميكانيكي دقيق على مستوى البت. تطلب المادة 17 من GDPR محواً قابلاً للتحقق للبيانات الشخصية؛ البنية الأولية للتحقق هي رقعة DELETE على مستوى الوزن مع إيصال SHA-256. يطلب HIPAA تدقيق الوصول وتتبع الإفصاح؛ البنية الأولية للتحقق هي سجل قرار موقَّع لكل طلب. يطلب NIST AI RMF الحوكمة والتخطيط والقياس والإدارة؛ البنية الأولية للتحقق هي إيصالات متسلسلة بالتجزئة لكل قرار إطلاق.">
<title>أربعة منظمين، طلب تحقق واحد</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">أربعة منظمين، طلب جوهري واحد: تحقَّق، ولا تثق</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">يُسمِّي كل إطار البنية الأولية للتحقق بشكل مختلف، لكن الجوهر واحد: إثبات تشفيري يستطيع المدقق فحصه.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">قانون الذكاء الاصطناعي الأوروبي</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">يطلب الملحق الرابع:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• توثيق المنطق</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• ملخص بيانات التدريب</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• تدابير الإشراف البشري</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• رصد ما بعد السوق</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">البنية الأولية للتحقق:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">توثيق ميكانيكي دقيق</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">على مستوى البت عبر vIndex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">عقوبة عدم الامتثال:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">حتى 7% من</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">الإيرادات العالمية</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR المادة 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">يطلب الحق في المحو:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• إزالة بيانات قابلة للتحقق</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• نسيان قابل للإثبات</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• إثبات تحت التحفيز</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  العدائي</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">البنية الأولية للتحقق:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">رقعة DELETE على مستوى الوزن</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">مع إيصال SHA-256</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">عقوبة عدم الامتثال:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">حتى 20 مليون يورو</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">أو 4% من الإيرادات</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">تتطلب ضوابط الوصول:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• مسار تدقيق الوصول</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• تتبع الإفصاح</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• الحد الأدنى الضروري</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  لكشف PHI</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">البنية الأولية للتحقق:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">سجل قرار موقَّع</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">لكل طلب</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">عقوبة عدم الامتثال:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">حتى 1.9 مليون دولار</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">لكل نوع مخالفة سنوياً</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">الوظائف الأساسية الأربع:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• الحوكمة</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• التخطيط</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• القياس</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• الإدارة</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">البنية الأولية للتحقق:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">إيصال متسلسل بالتجزئة</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">لكل قرار إطلاق</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">عقوبة عدم الامتثال:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">إطار طوعي</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(لكنه خط الأساس</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">الفعلي في المؤسسات)</text>
</svg>
</figure>

أرقام العقوبات ليست هي ما يجعل هذه الأطر مثيرة للاهتمام. أرقام العقوبات هي ما يجعلها حمَّالة الثقل. الجزء المثير للاهتمام هو **البنية الأولية للتحقق** — كيف يريد كل إطار أن يبدو الأثر فعلياً. ثلاثة من الأربعة تطلب إثباتاً بدرجة تشفيرية بمفردات مختلفة. أما الرابع (NIST AI RMF) فطوعي لكنه مطلوب بحكم الأمر الواقع في مشتريات المؤسسات. وتتلاقى جميعها في الشكل نفسه: أثر يستطيع المدقق التحقق منه دون الثقة في سجلاتكم.

## الانقسام: الأوزان المفتوحة مقابل واجهات الـ API المغلقة

قبل الإسقاط لكل مرحلة، أهم تحفُّظ في هذه المقالة بأكملها:

**بالنسبة للنماذج ذات الأوزان المفتوحة** — Gemma، Qwen، Llama، Mistral، GPT-OSS، أي نموذج تكون أوزانه قابلة للعنونة والتحرير — يُصدِر كل قرار إطلاق من Divinci إيصال vIndex يتضمن **شهادة وزن**: إثبات تشفيري بأن الأوزان النشطة وقت القرار هي تماماً الأوزان التي سجَّلها البيان. هذا ما يجعل المحو القابل للتحقق بموجب المادة 17 من GDPR ممكناً. تُطبِّق [رقعة DELETE](/blog/deleting-paris-from-a-language-model/) تُزيل علاقة كيان محددة من فضاء الوزن، ويُضمِّن الإيصال تجزئة الحالة قبل وبعد، ويستطيع المدقق التحقق من حدوث الحذف بإعادة تشغيل عملية التحقق مقابل vIndex العامة.

**بالنسبة للنماذج عبر API المغلقة** — OpenAI، Anthropic، Google عبر واجهات API معتمة — يغطي الإيصال نفسه سلسلة القرار (أي بيان، أي نتيجة بوابة، أي قراءة مراقب، أي مستخدم أطلق أي إجراء) لكنه **لا يستطيع المطالبة بإثبات مصدر الأوزان**، لأن المزوِّد لا يكشف عن الأوزان. يُشير الإيصال إلى ذلك صراحةً في حقل `weight_attestation: null` مع `note` يشرح السبب. هذا ليس وضعية امتثال متدنية — إنه حد ما يمكن التحقق منه، مُدوَّناً بصراحة. المدقق الذي يقرأ الإيصال يفهم تماماً أي فئة من الإثبات يُقدَّم وأيها لا يُقدَّم.

يسري هذا الانقسام في كل طلب تنظيمي أدناه. متى ما طلب إطار شيئاً على مستوى الوزن، يستطيع مسار الأوزان المفتوحة تلبيته ولا يستطيع مسار API المغلق ذلك. نقول ذلك في الإيصال بدلاً من إيحاء بإثبات لا نستطيع تقديمه.

## كيف يُسقَط كل إطار على مراحل خط الإطلاق الأربع

يضم خط الإطلاق أربع مراحل. يُسقَط طلب كل منظِّم على مرحلة أو أكثر. المصفوفة أدناه هي الإسقاط الفعلي.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="إسقاط أربعة أطر تنظيمية على خط إطلاق Divinci ذي المراحل الأربع. منطق موثَّق وملخص تدريب في الملحق الرابع لقانون الذكاء الاصطناعي للاتحاد الأوروبي مُسقَط على المرحلة 1 التسجيل. الإشراف البشري ورصد ما بعد السوق مُسقَطان على المرحلتين 2 البوابة و4 المراقبة. المحو القابل للتحقق في المادة 17 من GDPR مُسقَط على المرحلة 1 التسجيل عبر رقعة DELETE والمرحلة 4 المراقبة عبر الإيصال. تدقيق الوصول وتتبع الإفصاح في HIPAA مُسقَطان على المراحل 1 و3 و4. الحوكمة والتخطيط والقياس والإدارة في NIST AI RMF مُسقَطة عبر المراحل الأربع كلها. خمس خلايا في المصفوفة مُمَيَّزة للإشارة إلى مسار التحقق المخصص للأوزان المفتوحة فقط.">
<title>الأطر التنظيمية مُسقَطة على مراحل خط الإطلاق</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">أي مرحلة في خط الإطلاق تغطي أي طلب تنظيمي</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = تغطية كاملة. ◐ = للأوزان المفتوحة فقط (تتطلب شهادة وزن). يغطي مسار API المغلق سلسلة القرار لكنه لا يستطيع تقديم الادعاء على مستوى الوزن.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">الإطار / الطلب</text>
<text x="425" y="98" text-anchor="middle">① التسجيل</text>
<text x="555" y="98" text-anchor="middle">② البوابة</text>
<text x="685" y="98" text-anchor="middle">③ الطرح</text>
<text x="815" y="98" text-anchor="middle">④ المراقبة</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">قانون الذكاء الاصطناعي للاتحاد الأوروبي</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">الملحق الرابع: توثيق المنطق</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">الملحق الرابع: ملخص بيانات التدريب</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">تدابير الإشراف البشري</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">رصد ما بعد السوق</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR المادة 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">محو قابل للتحقق (رقعة DELETE)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">إيصال محو (متسلسل بالتجزئة)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">تدقيق وصول لكل طلب</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">تتبع الإفصاح + الحد الأدنى الضروري</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">حوكمة · تخطيط · قياس · إدارة</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

الخليتان المُعَلَّمتان بـ ◐ هما إدخالات المادة 17 من GDPR / المخصصة للأوزان المفتوحة فقط — هذه هي المطالب التي لا يستطيع مسار API المغلق تلبيتها بالكامل. كل ما عداها ينطبق على كلا النوعين.

تُسلِّط بقية المقالة الضوء على إسهام كل مرحلة.

## المرحلة ① — التسجيل

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">التسجيل</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">بيان الإطلاق هو التوثيق التقني للملحق الرابع من قانون الذكاء الاصطناعي للاتحاد الأوروبي.</span>
  </div>
</div>

تُنتِج مرحلة التسجيل بيان JSON غير قابل للتغيير، مُعنوناً بـ SHA-256. للإطلاقات الخاضعة للتنظيم يحمل البيان كل ما يطلبه الملحق الرابع<sup><a href="#ref-1">[1]</a></sup> في أثر واحد:

- أثر النموذج (مستودع HF + commit SHA، أو مرجع رقعة vIndex)
- قالب التحفيز (كل متغيِّر، كل رسالة نظام — تحت تحكم الإصدار)
- قواعد التوجيه (أي فئة حركة مرور تصل إلى أي إطلاق)
- إصدار مجموعة البيانات المستخدَم لحساب عتبات البوابة (ملخص بيانات التدريب بالتجزئة)
- SHA الإطلاق السابق (حتى تبقى سلسلة التدقيق متصلة)
- نطاق الإفصاح — لعمليات نشر HIPAA، أي فئات PHI يُسمح للنموذج بتلقّيها

البيان هو التوثيق. لا يقرأ المدقق نصاً نثرياً؛ بل يقرأ تجزئة البيان ويتحقق من الحزمة. لا حاجة إلى ملخص نثري كُتب بعد ستة أشهر.

**مكافأة الأوزان المفتوحة.** عندما يشير أثر النموذج إلى نموذج بأوزان مفتوحة، يُضمِّن البيان أيضاً `vindex_sha256` — البصمة التشفيرية لـ [vIndex](/ar/compliance/) المنشور للنموذج. هذه البصمة هي ما يتيح لطرف ثالث التحقق من الأوزان النشطة دون الاضطرار قط للثقة في بنيتنا التحتية للنشر.

**تحفُّظ API المغلق.** عندما يشير أثر النموذج إلى نموذج عبر API مغلق، يكون حقل `vindex_sha256` في البيان `null`، ويكون `weight_attestation_class` في البيان `decision_chain_only`. المدقق الذي يقرأ هذا يعرف تماماً ما يُدَّعى وما لا يُدَّعى.

## المرحلة ② — البوابة

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">البوابة</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">بوابات الجودة لكل شريحة تحمل متطلب الإشراف البشري في قانون الذكاء الاصطناعي للاتحاد الأوروبي.</span>
  </div>
</div>

مرحلة البوابة هي المكان الذي تتحول فيه "تدابير الإشراف البشري"<sup><a href="#ref-1">[1]</a></sup> في قانون الذكاء الاصطناعي للاتحاد الأوروبي إلى ممارسة. المنظم الذي يقرأ قانون الذكاء الاصطناعي للاتحاد الأوروبي ويستنتج "نحتاج إلى تدفق موافقة بشري" قد فاته جوهر الأمر — السؤال الأصعب هو *مقابل أي شيء يوافق البشري*. تُجيب مرحلة البوابة على هذا السؤال بمعامل سبيرمان ρ لكل شريحة مقابل مُقَيِّم مُرتكز بشرياً<sup><a href="#ref-3">[3]</a></sup>. كل شريحة مهمة في وضعيتك التنظيمية (طب أورام الأطفال، ترخيص الملكية الفكرية، الفرنسية البلجيكية) تحصل على عتبتها الخاصة. يتطلب مسار التجاوز مبرراً مكتوباً يدخل مسار التدقيق.

بالنسبة لعمليات النشر التي يشملها HIPAA، هذا أيضاً هو موضع قاعدة "الحد الأدنى الضروري" للإفصاح. تشمل مجموعة الـ QA المُقَيَّمة في البوابة اختبارات سلبية للإفراط في كشف PHI — إجابات تتضمن مُعرِّفات شخصية حين لم يُطلَب شيء منها. إطلاق يتراجع على شريحة الإفراط في الكشف يفشل في البوابة، بصرف النظر عن أداء شرائحه الأخرى.

بالنسبة لـ NIST AI RMF، تغطي مرحلة البوابة وظيفة "القياس" — الدليل العددي لكل شريحة على أن النظام يعمل ضمن نطاقات التحمل المُهَيَّأة.

## المرحلة ③ — الطرح

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">الطرح</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">تتحول نقاط فحص الكنري إلى أثر رصد ما بعد السوق.</span>
  </div>
</div>

يتطلب رصد ما بعد السوق في قانون الذكاء الاصطناعي للاتحاد الأوروبي<sup><a href="#ref-1">[1]</a></sup> من المُشَغِّل إثبات مراقبة *متواصلة* — وليس فقط ما قبل الإطلاق — لكيفية أداء نظام الذكاء الاصطناعي في الظروف الحقيقية. كنري 5% ← 25% ← 100% مع نقاط فحص لمراقب الجودة هو الطريقة الأكثر طبيعية لتلبية هذا الطلب. مدة المكوث عند كل نقطة فحص، إضافةً إلى قراءات المراقب أثناء المكوث، هي ما يريد المدقق رؤيته.

بالنسبة لـ HIPAA، مرحلة الكنري هي أيضاً المكان الذي يُمارَس فيه تسجيل تدقيق الطلب من الطرف إلى الطرف. تُنتِج كل نقطة فحص عيِّنة من إيصالات طلب-استجابة موقَّعة؛ إذا كان أي منها يحتوي على معالجة PHI مُهَيَّأة بشكل خاطئ، فإنها تظهر عند 5% من حركة المرور بدلاً من 100%.

## المرحلة ④ — المراقبة

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">المراقبة</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">المراقب المستمر + صيغة الإيصال تجعل المادة 17 من GDPR قابلة للتحقق.</span>
  </div>
</div>

هذه هي المرحلة التي تكسب فيها قصة الامتثال شرعيتها. تُجري مرحلة المراقبة إعادة تشغيل مستمر للتتبعات عبر الإطلاق النشط، مُقَيَّماً بالقاضي المُرتكز بشرياً نفسه من البوابة، مع مراقب جودة يُشغِّل إلغاء عودة تلقائياً إذا تجاوز الحد.

كل قرار إطلاق — تسجيل، نجاح بوابة، فشل بوابة، تجاوز بوابة، ترقية نقطة فحص، تعليق نقطة فحص، إلغاء عودة تلقائي، إلغاء عودة يدوي، **وأي تطبيق لرقعة DELETE بموجب المادة 17 من GDPR** — يُصدِر إيصال vIndex. مُسَلسَل بالتجزئة مع الإيصال السابق لهذا العميل والإيصال السابق لهذا الإطلاق.

إليك ما يبدو عليه إيصال حقيقي لرقعة DELETE بموجب المادة 17 من GDPR — مُعدَّل مباشرةً من الصيغة المُوَثَّقة على [صفحة الامتثال](/ar/compliance/):

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

هذا الأثر قابل للتحقق. لا يتعيَّن على المدقق الثقة في سجلاتنا. يأخذ `vindex_sha256_after`، ويسحب vIndex المنشور المقابل من `huggingface.co/Divinci-AI`، ويتحقق من أن الميزة 11179 في الطبقة 27 غائبة هيكلياً من أعلى 25. يأخذ `chain_signature` ويتحقق منه مقابل الإيصال السابق. السلسلة بأكملها مُثَبَّتة خارجياً وفق جدول زمني يُهَيِّئه العميل.

**نفس العملية مقابل نموذج عبر API مغلق.** تتغير حقول الإيصال أعلاه بثلاث طرق: يصبح `operation.target` هو `provider_api_endpoint`، ويصبح `verification` مخططاً مختلفاً يغطي دليل سلسلة القرار فقط، ويصبح `weight_attestation_class` هو `decision_chain_only`. مزوِّد النموذج عبر API المغلق لم يكشف عن الأوزان، فالإيصال يقول ذلك. المدقق الذي يريد إثباتاً على مستوى الوزن يعرف الآن أنه بحاجة إلى التصعيد إلى المزوِّد، لا إلينا.

هذا هو التمييز الذي لا يُصدِره أحد آخر في 2026. معسكر eval-CI (Braintrust وHumanloop وPatronus) لا يجلس على حركة المرور ولا يُصدِر إيصالات قرار. معسكر كنري التقديم (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>، KServe، Vertex، BentoCloud، Seldon) يُصدِر سجلات مقاييس بنية تحتية لكن ليس إيصالات امتثال مُتَسَلسَلة بالتجزئة. معسكر القابلية للمراقبة (Arize، Phoenix، Confident، Deepchecks) يراقب الخرج لكنه لا يُنفِّذ.

## ما الذي يتحقق منه المدقق فعلياً؟

تمرين مفيد: تجوَّل في الأسئلة التي سيطرحها مدقق حقيقي، وأي أثر يجيب على كل منها.

| سؤال المدقق | الأثر الذي يُجيب عليه |
|---|---|
| *"أي إصدار من النموذج كان يعمل في 15 مارس الساعة 14:22 UTC؟"* | إيصال مرحلة المراقبة لتلك الطابع الزمني، موقَّع ومُسَلسَل بالتجزئة. |
| *"أي تقييم اجتازه هذا الإطلاق قبل الترقية؟"* | إيصال مرحلة البوابة، مع جدول معامل سبيرمان ρ لكل شريحة وSHA مجموعة البيانات التي عملت البوابة مقابلها. |
| *"هل طُبِّق فعلياً طلب محو بموجب المادة 17 من GDPR للمريض س؟"* | إيصال رقعة DELETE أعلاه. يتحقق المدقق من `vindex_sha256_after` مقابل vIndex المنشور. |
| *"من وافق على هذا الإطلاق؟ ما المبرر المُعلَن لتجاوز بوابة شريحة ترخيص الملكية الفكرية؟"* | كتلة `override` في إيصال مرحلة البوابة، بما في ذلك مُعرِّف المستخدم والمبرر النصي المطلوب. |
| *"بأي سرعة أُطلِق إلغاء العودة، وأي قراءة مراقب أشعلته؟"* | إيصال إلغاء العودة في مرحلة المراقبة، مع القراءات الثلاث المتتالية تحت العتبة والوقت المنقضي لإلغاء العودة. |
| *"اعرض لي دليل رصد ما بعد السوق لآخر 90 يوماً."* | سلسلة إيصالات مرحلة المراقبة. مُثَبَّتة خارجياً وفق الجدول المُهَيَّأ من العميل. |

ما *لا يضطر المدقق إلى فعله*: الثقة في Datadog لدينا. الثقة في CloudWatch لدينا. الثقة في لقطة شاشة. الثقة في تصدير. الهدف من صيغة الإيصال هو أن يستطيع المدقق التحقق منها باستقلال.

## ما الذي لا تحلّه هذه الطريقة

ثلاثة حدود صادقة:

**تراجعات API المغلق في نطاق المادة 17 من GDPR ليست قابلة للحل على طبقة المنصة.** إذا كنت تُقَدِّم مساعداً صحياً خلف نموذج عبر API مغلق، واستدعى مريض المادة 17، فإن المنصة تستطيع شهادة أن سجل المريض قد أُزيل من مخزن الاسترجاع لديك، وقالب التحفيز لديك، وقواعد التوجيه لديك — لكنها لا تستطيع شهادة أن أوزان النموذج الأساسية قد نسيت بيانات المريض. تحتاج إما إلى نموذج بأوزان مفتوحة أو التزام من المزوِّد بالمحو على مستوى الوزن. نقول ذلك في الإيصال.

**التوثيق ضروري لكنه غير كافٍ.** إيصال يثبت أن نموذجاً قد استوفى عتبة لا يثبت أن العتبة كانت العتبة الصحيحة. إذا كانت مجموعة الـ QA المُقَيَّمة لديك لا تغطي الشريحة المهمة فعلياً لمريض في خدمتك، فلا قدر من تسلسل الإيصالات يُصلح ذلك. يفهم المنظمون هذا بشكل متزايد؛ "لقد اجتزنا تقييمنا" لم يعد جواب امتثال كافٍ إذا كان التقييم هو التقييم الخاطئ.

**صيغة vIndex مخصصة لبائع واحد.** نستخدمها لأنها أكثر بنية أولية تشفيرية ملموسة متاحة اليوم للإثبات على مستوى الوزن. إذا استقرت الصناعة على صيغة مختلفة — بطاقات نماذج مع تجزئات، أو مخططات أثر منشورة من NIST — فينبغي لصيغة الإيصال أن تتطور إلى ذلك. الجوهر (مُتَسَلسَل بالتجزئة، قابل للتحقق خارجياً، واعٍ بشهادة الوزن) هو ما يحمل الثقل، لا اسم المخطط بعينه. نتوقع أن يتغير هذا مع نضج المشهد التنظيمي والمعايير.

## الأسئلة الشائعة

### ما هو المحو القابل للتحقق بموجب المادة 17 من GDPR لأنظمة الذكاء الاصطناعي؟

المحو القابل للتحقق يعني أن طرفاً ثالثاً يستطيع التحقق من أن البيانات قد أُزيلت دون الاضطرار للثقة في سجلاتك. ضبط نموذج لـ "ينسى" معلومات معينة لا يستوفي هذا المعيار — يمكن أن تظهر المعلومات مجدداً تحت التحفيز العدائي، ولا توجد بنية أولية تشفيرية يستطيع المدقق فحصها. أما رقعة DELETE على مستوى الوزن مع تجزئة vIndex قبل/بعد منشورة *فإنها* تستوفي المعيار، لأن المدقق يستطيع إعادة تشغيل التحقق مقابل الأثر العام.

### لماذا لا تستطيع النماذج عبر API المغلق تلبية المادة 17 من GDPR بالطريقة نفسها؟

لأن المزوِّد لا يكشف عن الأوزان. بدون الوصول إلى الأوزان، لا يستطيع أي طرف ثالث — بما في ذلك العميل الذي يستخدم الـ API — إصدار أو التحقق من محو على مستوى الوزن. جزء سلسلة القرار من الإيصال (أي قالب تحفيز استُخدم، أي مخزن استرجاع جاءت منه البيانات، أي قواعد توجيه كانت نشطة) لا يزال قابلاً للتحقق، لكن الادعاء على مستوى الوزن ليس كذلك. هذا حد لما يمكن التحقق منه عندما تكون الأوزان خاصة، لا حد لإطار الامتثال.

### ماذا يتطلب الملحق الرابع من قانون الذكاء الاصطناعي للاتحاد الأوروبي، بلغة بسيطة؟

يطلب الملحق الرابع توثيقاً تقنياً يغطي منطق النظام، وملخص بيانات التدريب، والاستخدام المقصود، وتدابير الإشراف البشري، ورصد ما بعد السوق. الفخ الذي تقع فيه معظم الفرق هو معاملة هذه على أنها خمس وثائق منفصلة. يحمل بيان الإطلاق في المرحلة 1 المطالب الثلاثة الأولى كتجزئة واحدة؛ تغطي مرحلة البوابة الرابع؛ تغطي مرحلتا الطرح والمراقبة الخامس. خط إطلاق واحد؛ أربعة مطالب مُلَبَّاة كنتاج عرضي للعمليات الاعتيادية.

### ما السرعة التي ينبغي أن يكون عليها إلغاء العودة لعمليات النشر التي يشملها HIPAA؟

لا يحدد HIPAA وقت إلغاء عودة، لكن إرشادات HHS بشأن الاستجابة للخروقات تتعامل مع الوقت اللازم للاحتواء بوصفه حمَّال ثقل. إلغاء عودة في حدود الثواني (تصريف أثناء الطيران على تبديل مُدار بالبيان — رقمنا حوالي 12 ثانية) أسرع هيكلياً من blue-green التقليدي المعتمد على مقاييس البنية التحتية الذي يعتمد على انتشار الإنذار. قارن بمراجعات الحوادث العامة: حادث Cloudflare في يونيو 2022<sup><a href="#ref-4">[4]</a></sup> استغرق 44 دقيقة للعودة لأن المهندسين تجاوز بعضهم على عمليات عودة بعض.

### كيف يُسقَط NIST AI RMF على خط إطلاق؟

تمتد الوظائف الأساسية الأربع لـ NIST AI RMF — الحوكمة، التخطيط، القياس، الإدارة — عبر دورة حياة الإطلاق بأكملها، وليس مرحلة واحدة. الحوكمة هي سياسة الإطلاق المُوَثَّقة بالإضافة إلى تدفق مبرر تجاوز البوابة (مرحلتا التسجيل والبوابة). التخطيط هو مجموعة الـ QA المُقَيَّمة لكل شريحة (البوابة). القياس هو عتبات سبيرمان لكل شريحة ومراقب الجودة المستمر (البوابة والمراقبة). الإدارة هي مسار إلغاء العودة وسلسلة الإيصالات (المراقبة). تُغطى الوظائف الأربع جميعها حين يُصدِر خط الإطلاق مجموعة إيصالاته الكاملة.

## المراجع

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>قانون الذكاء الاصطناعي للاتحاد الأوروبي.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. يُحَدِّد الملحق الرابع متطلبات التوثيق التقني لأنظمة الذكاء الاصطناعي عالية المخاطر: منطق النظام، ملخص بيانات التدريب، تدابير الإشراف البشري، رصد ما بعد السوق. عقوبات تصل إلى 7% من الإيرادات العالمية لعدم الامتثال.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. القيمة الافتراضية لـ <code>TerminationWaitInSeconds</code> هي 600، والحد الأقصى لـ <code>MaximumExecutionTimeoutInSeconds</code> هو 1800. مُستشهَد به بوصفه كنري مقاييس البنية التحتية القياسي في الصناعة الذي يُقارَن به مراقب الجودة في المرحلة 4.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>اتفاق LLM-as-judge المُعَايَر.</strong> Zheng et al.، <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). اتفاق GPT-4 مع البشر إجمالاً يتجاوز 80%، مع تباين بحسب الفئة من البرمجة (86%) نزولاً إلى الكتابة (36–44%). مرتكز لمعايرة سبيرمان لكل شريحة التي تُحَرِّك مرحلة البوابة.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>انقطاع Cloudflare في يونيو 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 دقيقة من "نعرف ما الذي يتعين العودة عنه" إلى إتمام العودة لأن المهندسين تجاوزوا على عمليات عودة بعضهم. مرتكز لادعاء "إلغاء العودة المُدار بالبيان لا يمكن أن يكون له وضع الفشل ذاك".
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
<strong>Internal — vIndex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/compliance/">compliance page</a> and demonstrated in the <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*التالي في هذه السلسلة:* **خطوط CI/CD آلية للنماذج اللغوية مع إلغاء عودة فوري.** عرضت هذه المقالة ما يريده المدقق. تعرض المقالة التالية النمط التشغيلي الذي يجعل الإيصال يصل إلى مكتب المدقق في ثوانٍ بدلاً من أسابيع — الأتمتة تحت خط الإطلاق ذي المراحل الأربع، مع تركيز على ما يتغير حين يُشتعل إلغاء العودة من تلقاء نفسه.
