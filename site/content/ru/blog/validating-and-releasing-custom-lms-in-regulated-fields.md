+++
title = "Валидация и релиз кастомных языковых моделей в регулируемых областях"
description = "EU AI Act, GDPR Статья 17, HIPAA, NIST AI RMF — сопоставлены по возможностям с пайплайном релиза LLM. Где open- и closed-weights расходятся."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vindex"]

[extra]
author = "Майк Муринг"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "Комплаенс в регулируемых отраслях для кастомных языковых моделей чётко разделяется по одной оси: open-weights против closed-API. Для open-weights-бэкендов вы можете выпустить vindex weight-attestation, который криптографически удовлетворяет требование GDPR Статьи 17 о верифицируемом удалении. Для closed-API-бэкендов та же квитанция покрывает цепочку решений, но не может претендовать на provenance весов — и регулятор получает это разграничение прямо в квитанции. Этот пост сопоставляет четыре регуляторных фреймворка (EU AI Act, GDPR, HIPAA, NIST AI RMF) с четырьмя стадиями пайплайна, которые мы выпускаем, и показывает фактический формат квитанции."
+++

*Заметки из цикла релиза — Часть IV*

---

Главный юрисконсульт заходит на инженерный ревью. У неё один вопрос: *«Если завтра поступит запрос по EU AI Act Статья 17 о праве на удаление с требованием убрать каждый факт, который наша модель узнала о конкретном пациенте, сможем ли мы доказать, что мы это сделали?»*

Честный ответ, который большинство команд вынуждены давать, звучит так: «Мы можем дообучить модель, чтобы она забыла. Мы можем показать вам прогон обучения. Но мы не можем доказать, что информация структурно исчезла, потому что она может всплыть при правильно подобранном состязательном промпте.»

Это не ответ комплаенса. Это не-ответ с процедурным пожатием плеч.

Этот пост — о том, как выглядит настоящий ответ комплаенса для кастомных LLM — по четырём регуляторным фреймворкам (**EU AI Act, GDPR Статья 17, HIPAA, NIST AI RMF**), сопоставленным с четырёхстадийным пайплайном ([Register → Gate → Roll → Observe](/ru/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)), который мы выпускаем для клиентских релизов. Сквозное напряжение во всех запросах регуляторов — это **open-weights против closed-API**: то, что вы можете доказать о дообучении Gemma 4, — это не то же самое, что вы можете доказать о релизе, обслуживаемом за непрозрачным API вендора. Формат квитанции, который мы используем, говорит об этом явно, построчно. Именно эта честность делает квитанцию полезной для аудитора.

## Четыре регулятора и что каждый из них на самом деле хочет

Обсуждения комплаенса часто сводятся к «мы всё задокументировали». Эта формулировка не проходит проверку аудитора. Аудиторам нужно *доказательство, которое они могут верифицировать, не доверяя вашей инфраструктуре*. Все четыре фреймворка ниже используют разную лексику для одного и того же базового запроса.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Четыре регуляторных фреймворка и примитив верификации, которого требует каждый из них. EU AI Act требует документированной логики и человеческого надзора; примитив верификации — побитово точная механистическая документация. GDPR Статья 17 требует верифицируемого удаления персональных данных; примитив верификации — DELETE-патч на уровне весов с квитанцией SHA-256. HIPAA требует аудита доступа и отслеживания раскрытия; примитив верификации — подписанный журнал решений на каждый запрос. NIST AI RMF требует управления, картирования, измерения и менеджмента; примитив верификации — квитанции с хеш-цепочкой для каждого решения о релизе.">
<title>Четыре регулятора, один запрос верификации</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Четыре регулятора, один базовый запрос: верифицируй, а не доверяй</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Каждый фреймворк называет примитив верификации по-своему, но суть одна: криптографическое доказательство, которое аудитор может проверить.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Приложение IV требует:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• документированной логики</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• сводки обучающих данных</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• мер человеческого надзора</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• постмаркет-мониторинга</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Примитив верификации:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">побитово точная механистическая</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">документация через vindex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">Штраф за нарушение:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">до 7% глобального</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">оборота</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR Ст. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Право на удаление требует:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• верифицируемого удаления</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• доказуемого забывания</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• доказательства при</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  состязательных промптах</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Примитив верификации:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">DELETE-патч на уровне</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">весов с квитанцией SHA-256</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">Штраф за нарушение:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">до €20 млн или</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">4% оборота</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Контроль доступа требует:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• журнала аудита доступа</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• отслеживания раскрытия</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• минимально-необходимого</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  раскрытия PHI</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Примитив верификации:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">подписанный журнал</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">решений на запрос</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">Штраф за нарушение:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">до $1.9 млн /</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">тип нарушения / год</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Четыре основные функции:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• govern</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• map</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• measure</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• manage</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Примитив верификации:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">квитанция с хеш-цепочкой</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">на решение о релизе</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">Штраф за нарушение:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">добровольный фреймворк</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(но де-факто</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">корпоративный базис)</text>
</svg>
</figure>

Цифры штрафов — это не то, что делает эти фреймворки интересными. Цифры штрафов — это то, что делает их несущими. Интересная часть — это **примитив верификации**: то, как именно каждый фреймворк хочет, чтобы выглядел артефакт. Три из четырёх требуют криптографического уровня доказательства в разных формулировках. Четвёртый (NIST AI RMF) добровольный, но де-факто обязательный в корпоративных закупках. Все они сходятся к одной и той же форме: артефакту, который аудитор может верифицировать, не доверяя вашим логам.

## Разделение: open-weights против closed-API

Перед попунктным сопоставлением — самая важная оговорка во всём этом посте:

**Для бэкендов с открытыми весами (open-weights)** — Gemma, Qwen, Llama, Mistral, GPT-OSS, всё, где веса адресуемы и редактируемы — каждое решение о релизе Divinci эмитирует квитанцию vindex, включающую **weight-attestation**: криптографическое доказательство того, что активные веса на момент решения точно совпадают с весами, зарегистрированными в манифесте. Именно это делает возможным верифицируемое удаление по GDPR Статья 17. Вы применяете [DELETE-патч](/blog/deleting-paris-from-a-language-model/), который удаляет конкретную сущность-отношение из пространства весов, квитанция встраивает хеш до и после, и аудитор может верифицировать, что удаление произошло, повторно прогнав верификацию по публичному vindex.

**Для бэкендов с закрытыми API (closed-API)** — OpenAI, Anthropic, Google через непрозрачные API — та же квитанция покрывает цепочку решений (какой манифест, какой результат гейта, какие показания монитора, какой пользователь инициировал какое действие), но **не может претендовать на provenance весов**, потому что провайдер не раскрывает веса. Квитанция явно отмечает это в поле `weight_attestation: null` с `note`, объясняющим причину. Это не ухудшенная позиция комплаенса — это предел того, что верифицируемо, честно записанный. Аудитор, читающий квитанцию, понимает ровно, какой класс доказательства предъявляется и какой нет.

Это разделение проходит через каждый запрос регулятора ниже. Всякий раз, когда фреймворк требует чего-то на уровне весов, open-weights-путь может это удовлетворить, а closed-API-путь — нет. Мы пишем об этом в квитанции, а не подразумеваем доказательство, которое не можем предоставить.

## Как каждый фреймворк сопоставляется с четырьмя стадиями пайплайна

Пайплайн имеет четыре стадии. Запрос каждого регулятора сопоставляется с одной или несколькими из них. Матрица ниже — это фактическая карта.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Сопоставление четырёх регуляторных фреймворков с четырёхстадийным пайплайном релиза Divinci. EU AI Act Приложение IV — документированная логика и сводка обучения — сопоставлены со Стадией 1 Register. EU AI Act — человеческий надзор и постмаркет-мониторинг — сопоставлены со Стадиями 2 Gate и 4 Observe. GDPR Статья 17 — верифицируемое удаление — сопоставлено со Стадией 1 Register через DELETE-патч и Стадией 4 Observe через квитанцию. HIPAA — аудит доступа и отслеживание раскрытия — сопоставлено со Стадиями 1, 3 и 4. NIST AI RMF — govern map measure manage — сопоставлено со всеми четырьмя стадиями. Пять ячеек матрицы выделены, указывая на путь верификации, доступный только для open-weights.">
<title>Регуляторные фреймворки, сопоставленные со стадиями пайплайна</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Какая стадия пайплайна покрывает какой регуляторный запрос</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = полное покрытие. ◐ = только open-weights (требуется weight-attestation). Closed-API-путь покрывает цепочку решений, но не может предъявить заявление на уровне весов.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Фреймворк / запрос</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Приложение IV: документированная логика</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Приложение IV: сводка обучающих данных</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Меры человеческого надзора</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Постмаркет-мониторинг</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR Статья 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Верифицируемое удаление (DELETE-патч)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Квитанция удаления (хеш-цепочка)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Аудит доступа на каждый запрос</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Отслеживание раскрытия + minimum-necessary</text>
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

Две ячейки ◐ — это записи GDPR Статья 17 / только open-weights — это те запросы, которые closed-API-путь не может полностью удовлетворить. Всё остальное применимо к обоим бэкендам.

Остальная часть поста проходит по вкладу каждой стадии.

## Стадия ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Манифест релиза — это техническая документация по Приложению IV EU AI Act.</span>
  </div>
</div>

Стадия Register производит неизменяемый JSON-манифест, адресуемый по SHA-256. Для регулируемых релизов манифест несёт всё, что просит Приложение IV<sup><a href="#ref-1">[1]</a></sup>, в одном артефакте:

- Артефакт модели (HF-репозиторий + SHA коммита или ссылка на vindex-патч)
- Шаблон промпта (каждая переменная, каждое системное сообщение — под версионным контролем)
- Правила маршрутизации (какой класс трафика попадает на какой релиз)
- Версия датасета, использованная для расчёта порогов гейта (сводка обучающих данных по хешу)
- SHA предыдущего релиза (чтобы цепочка аудита была неразрывной)
- Объём раскрытия — для HIPAA-развертываний, какие категории PHI модели разрешено получать

Манифест — это и есть документация. Аудитор не читает прозу; он читает хеш манифеста и верифицирует бандл. Никакого резюме в прозе, написанного шесть месяцев спустя, не требуется.

**Бонус для open-weights.** Когда артефакт модели ссылается на модель с открытыми весами, манифест также встраивает `vindex_sha256` — криптографический отпечаток опубликованного [vindex](/ru/compliance/) модели. Этот отпечаток позволяет третьей стороне верифицировать активные веса, не доверяя нашей инфраструктуре развертывания.

**Оговорка для closed-API.** Когда артефакт модели ссылается на closed-API-модель, поле `vindex_sha256` манифеста равно `null`, а `weight_attestation_class` манифеста — `decision_chain_only`. Аудитор, читающий это, точно знает, что заявлено, а что нет.

## Стадия ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Посрезовые гейты качества несут требование EU AI Act о человеческом надзоре.</span>
  </div>
</div>

Стадия Gate — это место, где «меры человеческого надзора»<sup><a href="#ref-1">[1]</a></sup> EU AI Act операционализируются. Регулятор, который читает EU AI Act и заключает «нам нужен воркфлоу человеческого одобрения», упустил суть — более сложный запрос *против чего именно человек одобряет*. Стадия Gate отвечает на этот вопрос посрезовым Spearman ρ против оценщика, привязанного к человеку<sup><a href="#ref-3">[3]</a></sup>. Каждый срез, имеющий значение для вашей регуляторной позиции (детская онкология, лицензирование IP, бельгийский французский), получает свой собственный порог. Путь override требует письменного обоснования, которое попадает в аудиторский след.

Для HIPAA-развертываний это также место, где живёт правило раскрытия «minimum-necessary». Scored-QA-набор гейта включает негативные тесты на чрезмерное раскрытие PHI — ответы, содержащие персональные идентификаторы, когда о них не спрашивали. Релиз, который регрессирует на срезе чрезмерного раскрытия, проваливает гейт, независимо от того, как ведут себя его другие срезы.

Для NIST AI RMF стадия Gate покрывает функцию «measure» — посрезовое численное доказательство того, что система работает в пределах настроенных допусков.

## Стадия ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Канареечные контрольные точки становятся артефактом постмаркет-мониторинга.</span>
  </div>
</div>

Постмаркет-мониторинг EU AI Act<sup><a href="#ref-1">[1]</a></sup> требует от оператора демонстрировать *постоянное* — а не только предзапусковое — наблюдение за тем, как ИИ-система работает в реальных условиях. Канареечный раскат 5% → 25% → 100% с контрольными точками мониторинга качества — самый естественный способ удовлетворить это требование. Выдержка в каждой контрольной точке плюс показания монитора во время выдержки — это то, что аудитор хочет видеть.

Для HIPAA канареечная стадия — это также место, где end-to-end отрабатывается журналирование аудита на каждый запрос. Каждая контрольная точка производит выборку подписанных квитанций запрос-ответ; если в какой-то из них есть неправильно сконфигурированная обработка PHI, это всплывает на 5% трафика, а не на 100%.

## Стадия ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Непрерывный монитор + формат квитанции делают GDPR Статью 17 верифицируемой.</span>
  </div>
</div>

Это стадия, которая зарабатывает историю комплаенса. Стадия Observe прогоняет непрерывное воспроизведение трасс через активный релиз, оцениваемое тем же привязанным к человеку судьёй из Gate, с монитором качества, который запускает автоматический откат при пробое.

Каждое решение о релизе — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback, **и любое применение DELETE-патча по GDPR Статья 17** — эмитирует квитанцию vindex. Хеш-цепочка к предыдущей квитанции для этого клиента и предыдущей квитанции для этого релиза.

Вот как выглядит настоящая квитанция для DELETE-патча по GDPR Статья 17 — адаптирована напрямую из формата, задокументированного на [странице комплаенса](/ru/compliance/):

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

Этот артефакт верифицируем. Аудитору не нужно доверять нашим логам. Он берёт `vindex_sha256_after`, подтягивает соответствующий опубликованный vindex с `huggingface.co/Divinci-AI` и верифицирует, что фича 11179 в слое 27 структурно отсутствует в top-25. Он берёт `chain_signature` и верифицирует её против предыдущей квитанции. Вся цепочка якорится внешне по расписанию, которое клиент настраивает.

**Та же операция против closed-API-модели.** Поля квитанции выше меняются тремя способами: `operation.target` становится `provider_api_endpoint`, `verification` становится другой схемой, покрывающей только доказательства цепочки решений, а `weight_attestation_class` становится `decision_chain_only`. Провайдер closed-API-модели не раскрыл веса, поэтому квитанция говорит об этом. Аудитор, желающий доказательства на уровне весов, теперь знает, что ему нужно эскалировать к провайдеру, а не к нам.

Это дифференциация, которой никто другой в 2026 году не выпускает. Лагерь eval-CI (Braintrust, Humanloop, Patronus) не сидит на трафике и не эмитирует квитанции решений. Лагерь serving-canary (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) эмитирует логи инфраструктурных метрик, но не криптографически связанные квитанции комплаенса. Лагерь observability (Arize, Phoenix, Confident, Deepchecks) наблюдает выход, но не обеспечивает контроль.

## Что аудитор на самом деле верифицирует?

Полезное упражнение: пройтись по вопросам, которые задаст реальный аудитор, и какой артефакт отвечает на каждый.

| Вопрос аудитора | Артефакт, который отвечает на него |
|---|---|
| *«Какая версия модели работала 15 марта в 14:22 UTC?»* | Квитанция стадии Observe для этой временной метки, подписанная и связанная хешем. |
| *«Какую оценку прошёл этот релиз перед промоутом?»* | Квитанция стадии Gate с посрезовой таблицей Spearman ρ и SHA датасета, против которого прогонялся гейт. |
| *«Был ли запрос на удаление по GDPR Статья 17 для пациента X фактически применён?»* | Квитанция DELETE-патча выше. Аудитор верифицирует `vindex_sha256_after` против опубликованного vindex. |
| *«Кто одобрил этот релиз? Каково было его заявленное обоснование переопределения гейта среза лицензирования IP?»* | Блок `override` квитанции стадии Gate, включая ID пользователя и обязательное свободно-текстовое обоснование. |
| *«Как быстро сработал откат и какое показание монитора его запустило?»* | Квитанция отката стадии Observe с тремя последовательными показаниями качества ниже порога и временем, прошедшим до отката. |
| *«Покажите мне доказательство постмаркет-мониторинга за последние 90 дней.»* | Цепочка квитанций стадии Observe. Якорится внешне по настроенному клиентом расписанию. |

Чего аудитору *не нужно делать*: доверять нашему Datadog. Доверять нашему CloudWatch. Доверять скриншоту. Доверять экспорту. Вся суть формата квитанции в том, что аудитор может верифицировать её независимо.

## Чего это не решает

Три честных ограничения:

**Регрессии closed-API в зоне GDPR Статья 17 нерешаемы на уровне платформы.** Если вы обслуживаете медицинского ассистента за closed-API-моделью и пациент инициирует Статью 17, платформа может удостоверить, что запись пациента была удалена из вашего хранилища поиска, вашего шаблона промпта и ваших правил маршрутизации, — но не может удостоверить, что лежащие в основе веса модели забыли данные пациента. Вам нужен либо open-weights-бэкенд, либо обязательство вендора по удалению на уровне весов. Мы пишем об этом в квитанции.

**Документация необходима, но недостаточна.** Квитанция, доказывающая, что модель встретила порог, не доказывает, что порог был правильным. Если ваш scored-QA-набор не покрывает срез, который реально важен для пациента в вашем сервисе, никакое количество связывания квитанций это не исправит. Регуляторы всё больше это понимают; «мы прошли наш eval» больше не является достаточным ответом комплаенса, если eval был не тем eval.

**Формат vindex — это single-vendor.** Мы используем его, потому что это самый конкретный криптографический примитив, доступный сегодня для доказательства на уровне весов. Если индустрия остановится на другом формате — model-cards с хешами, схемы артефактов, опубликованные NIST, — формат квитанции должен эволюционировать к этому. Суть (хеш-цепочка, внешняя верифицируемость, осведомлённость о weight-attestation) — это то, что несущее, а не конкретное название схемы. Мы ожидаем, что это изменится по мере созревания регуляторного и стандартного ландшафта.

## FAQ

### Что такое верифицируемое удаление по GDPR Статья 17 для ИИ-систем?

Верифицируемое удаление означает, что третья сторона может верифицировать, что данные были удалены, не доверяя вашим логам. Дообучение модели, чтобы она «забыла» конкретную информацию, не соответствует этому стандарту — информация может всплыть при состязательном промптинге, и нет криптографического примитива, который аудитор мог бы проверить. DELETE-патч на уровне весов с опубликованным хешем vindex до и после *соответствует* стандарту, потому что аудитор может повторно прогнать верификацию против публичного артефакта.

### Почему closed-API-модели не могут удовлетворить GDPR Статья 17 тем же способом?

Потому что провайдер не раскрывает веса. Без доступа к весам никакая третья сторона — включая клиента, использующего API, — не может выпустить или верифицировать удаление на уровне весов. Часть квитанции с цепочкой решений (какой шаблон промпта использовался, из какого хранилища поиска пришли данные, какие правила маршрутизации были активны) по-прежнему верифицируема, но заявление на уровне весов — нет. Это предел того, что верифицируемо, когда веса приватны, а не предел фреймворка комплаенса.

### Что требует EU AI Act Приложение IV простым языком?

Приложение IV просит техническую документацию, охватывающую логику системы, сводку обучающих данных, предполагаемое использование, меры человеческого надзора и постмаркет-мониторинг. Ловушка, в которую попадает большинство команд, — это трактовать их как пять отдельных документов. Манифест релиза на Стадии 1 несёт первые три запроса как единый хеш; стадия Gate покрывает четвёртый; стадии Roll + Observe покрывают пятый. Один пайплайн; четыре запроса удовлетворены как побочный продукт обычных операций.

### Насколько быстрым должен быть откат для HIPAA-развертываний?

HIPAA не определяет время отката, но руководство HHS по реагированию на нарушения трактует время-до-локализации как несущее. Откат порядка секунд (in-flight-дренирование на манифест-управляемом переключении — наше число около 12 секунд) структурно быстрее типичного blue-green по инфраструктурным метрикам, который зависит от распространения тревоги. Сравните с публичными постмортемами: инцидент Cloudflare в июне 2022<sup><a href="#ref-4">[4]</a></sup> занял 44 минуты на откат, потому что инженеры наступали друг другу на откаты.

### Как NIST AI RMF сопоставляется с пайплайном релиза?

Четыре основные функции NIST AI RMF — Govern, Map, Measure, Manage — охватывают весь жизненный цикл релиза, а не одну стадию. Govern — это задокументированная политика релиза плюс воркфлоу обоснования gate-override (стадии Register + Gate). Map — это посрезовый scored-QA-набор (Gate). Measure — это посрезовые пороги Spearman и непрерывный монитор качества (Gate + Observe). Manage — это путь отката и цепочка квитанций (Observe). Все четыре покрываются, когда пайплайн эмитирует свой полный набор квитанций.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Приложение IV определяет требования к технической документации для ИИ-систем высокого риска: логика системы, сводка обучающих данных, меры человеческого надзора, постмаркет-мониторинг. Штрафы до 7% глобального оборота за нарушения.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. По умолчанию <code>TerminationWaitInSeconds</code> 600, максимум <code>MaximumExecutionTimeoutInSeconds</code> 1800. Цитируется как индустриальный стандарт канареечного раската по инфраструктурным метрикам, с которым контрастирует монитор качества Стадии 4.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Калиброванное согласие LLM-as-judge.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% общего согласия GPT-4-против-человека, с покатегорийной дисперсией от кодинга (86%) до письма (36–44%). Якорь для покалевой калибровки Spearman, которая управляет стадией Gate.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Сбой Cloudflare в июне 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 минуты от «мы знаем, что откатывать» до завершения отката, потому что инженеры наступали друг другу на откаты. Якорь для утверждения «манифест-управляемый откат не может иметь такой режим отказа».
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

*Следующий в этой серии:* **Автоматизированные пайплайны CI/CD для LLM с мгновенным откатом.** Этот пост показал, что хочет аудитор. Следующий покажет операционный паттерн, который заставляет квитанцию приходить на стол аудитора за секунды, а не за недели — автоматизация под четырёхстадийным пайплайном, с акцентом на то, что меняется, когда откат срабатывает сам по себе.
