+++
title = "Pruebas de regresión automatizadas para LLM personalizados en 2026"
description = "Cómo construir una suite de regresión que detecte la deriva en la evaluación — no solo en el modelo. Compuertas conscientes de segmentos, jueces calibrados, replay de trazas de producción."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "images/automated-regression-testing-for-custom-llms-in-2026-hero.png"
reading_time = 13
summary = "La mayoría de las 'regresiones' de LLM son deriva en la propia suite de evaluación — calibración del juez, cobertura de segmentos, plantilla de prompt, índice de recuperación. Esta es la suite que las detecta, puntuada por segmento con un juez calibrado y reproducida contra trazas de producción en vivo."
+++

*Notas del ciclo de releases — Parte 7*

El viernes a las 4:47 PM lanzaste un ajuste de un carácter en un prompt. La puntuación agregada de la evaluación pasó de 0.873 a 0.871 — bien dentro del piso de ruido. El lunes por la mañana tu cola de soporte está en llamas por una clase de consultas que dejaste de mirar hace seis meses porque eran estables.

Nada en el modelo regresionó. El modelo es el mismo modelo. **La evaluación se desplazó debajo de ti.** Seis meses de crecimiento lento en un segmento de clientes nunca llegaron al dataset dorado, el prompt del juez se calibró por última vez contra humanos en octubre, y el índice de recuperación se reconstruyó silenciosamente el miércoles pasado sobre un modelo de embedding actualizado.

Esto es lo que señalaba la entrada 6 — [el modelo es la respuesta correcta aproximadamente una alerta de cada siete](/es/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/). Lo que significa que tu suite de regresión tiene que detectar deriva en sí misma, no solo en el modelo. Esta entrada es la suite.

## ¿Qué son realmente las pruebas de regresión para un LLM personalizado?

Las pruebas de regresión de software afirman `output == expected` para entradas fijas. Funcionan porque la función es determinista.

Un modelo de lenguaje no es una función en el mismo sentido. El mismo prompt a temperatura > 0 produce una distribución de completaciones válidas, y "válido" es multidimensional: ¿respondió la pregunta?, ¿está la respuesta fundamentada en el contexto recuperado?, ¿se mantuvo dentro del marco de seguridad?, ¿volvió dentro del presupuesto de latencia? Entonces, hacer pruebas de regresión a un LLM personalizado significa **medir la distribución del comportamiento contra una distribución base congelada** — a través de los segmentos que te importan, con jueces calibrados contra humanos, sobre entradas que se parezcan a tu tráfico de producción.

Tres cosas tienen que estar en su sitio antes de que cualquiera de estas sea significativa:

1. Un **dataset dorado** que se parezca a producción a nivel de segmento, no en agregado.
2. Un **juez calibrado** — no "usamos GPT-5 como juez", sino "medimos Spearman ρ ≥ 0.7 frente a tres evaluadores humanos, refrescado la semana pasada".
3. Un **manifiesto base** — los pesos exactos del modelo, la plantilla del prompt, el índice de recuperación y la versión del juez que produjeron las puntuaciones registradas. Sin esto no puedes saber si la puntuación se movió porque cambió el modelo o porque cambió la regla.

Divinci ejecuta las tres como objetos de primera clase, encadenados por hash, puntuados en cada commit. El resto de esta entrada es cómo ensamblarlos.

## Por qué la mayoría de las suites de regresión de LLM no detectan regresiones reales

El modo de fallo dominante en 2026 para LLM personalizados es lo que el equipo de Sigma Inference de Tianpan llamó la *Mentira de Semver* en su postmortem de abril de 2026<sup><a href="#ref-1">[1]</a></sup>: una métrica agregada se mantiene plana o mejora, mientras uno o dos segmentos de producción regresionan silenciosamente. El segmento estaba por debajo del 5% del tráfico cuando se diseñó la prueba, así que nunca entró en el dataset dorado; seis meses después es el 12% del tráfico, el modelo se degradó sobre él, y el número agregado nunca iba a notarlo.

Hemos revisado todos los postmortem públicos de releases de LLM de los últimos dieciocho meses y el patrón se repite: **la suite estuvo en verde porque estaba puntuando lo equivocado.** Concretamente:

- El dataset dorado fue escrito a mano por el equipo en el lanzamiento y nunca se re-estratificó frente a distribuciones de tráfico desplazadas.
- El prompt LLM-as-judge se fijó una vez y nunca se recalibró contra etiquetas humanas. El acuerdo del juez decayó silenciosamente<sup><a href="#ref-2">[2]</a></sup>.
- Las puntuaciones base se almacenaron como números crudos, no como tuplas `(model_sha, prompt_sha, judge_sha, dataset_sha, score)` — así que cuando algo regresionó, nadie podía decir cuál de los cuatro se había movido.

Una suite de regresión que no resuelve las tres es solo un paso de CI que se pone verde al hacer deploy y te da confianza falsa. La solución no es "más casos". La solución es medición **consciente de segmentos, anclada a versión, con juez calibrado**, en cada release.

## Construye un dataset dorado que sobreviva al análisis consciente de segmentos

La composición de cuatro buckets que enviamos por defecto — muestras de producción 60%, adversarial 15%, casos extremos seleccionados por expertos 15%, replays de fallos 10% — es un punto de partida razonable. Lo que hace que efectivamente detecte regresiones son los **metadatos de segmento** adjuntos a cada caso.

Cada entrada del dataset lleva: entrada, comportamiento esperado (rúbrica, no cadena exacta), contexto de recuperación (si lo hay) y una etiqueta `slice` — dominio, segmento de usuario, intención de la consulta, idioma, bucket de longitud, las descomposiciones que importen para tu producto. La suite puntúa **por segmento**, y cualquier segmento que caiga por debajo de su umbral bloquea el release, incluso si la puntuación agregada subió.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Composición del dataset dorado: 60% muestra de producción, 15% adversarial, 15% casos extremos de expertos, 10% replays de fallos, todos estratificados por segmentos">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Composición del dataset dorado — estratificado por segmento en cada eje</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Dimensionado para ~500 casos. Los segmentos de barra son proporcionales. La cobertura por segmento es el requisito firme, no la proporción agregada.</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">Muestra de producción</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Adversarial</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">Bordes expertos</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Replays</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">trazas de producción estratificadas · refrescadas trimestralmente</text>
<text x="513" y="90" text-anchor="middle">jailbreaks · inyección</text>
<text x="627" y="90" text-anchor="middle">bordes de dominio · cola larga</text>
<text x="722" y="90" text-anchor="middle">replays de postmortem ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">Cada caso lleva etiquetas de segmento — la suite puntúa cada combinación por separado</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">dominio</tspan> · legal / méd / general</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">intención</tspan> · cómo / hecho / rechazo</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">idioma</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">longitud</tspan> · corta / media / larga</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">segmento</tspan> · enterprise / PYME</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">recuperación</tspan> · fundamentada / abierta</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">uso-herramientas</tspan> · 0 / 1 / multipaso</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">novedad</tspan> · vista / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">composición × segmentos = malla de puntuación</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Puntuado por segmento en cada release — Spearman ρ ≥ 0.7 vs base, por segmento</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">Cualquier segmento que cruce su umbral bloquea el release. La puntuación agregada es solo informativa.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">El diagrama es estructural. Los ejes de estratificación y los umbrales por segmento se configuran por producto en el manifiesto de release de Divinci. Interno — definido en nuestros propios despliegues.</figcaption>
</figure>

Dos reglas operativas que hemos aprendido a hacer cumplir:

**Remuestrea trimestralmente.** Las distribuciones de tráfico de producción cambian más rápido que lo que la mayoría de los equipos miden. Re-estratificamos el bucket de muestra de producción contra los últimos 90 días de tráfico cada trimestre; si algún segmento creció por encima del 5% del tráfico y estaba por debajo del 2% del dataset dorado, se rellena antes de que se lance el siguiente release.

**Cada postmortem añade un caso.** Una regresión que llegó a producción y no fue detectada es un caso que faltaba en el dataset. Lo añadimos al bucket de replays dentro de las 48 horas posteriores al postmortem y lo etiquetamos con el segmento que lo sacó a la superficie.

## ¿Cómo detectas la deriva antes que los usuarios?

Existen cuatro tipos distintos de deriva, y una suite de regresión que solo vigila el último es una suite de regresión que se pierde la mayoría de las regresiones.

| Tipo de deriva | Qué se mueve | Señal de detección | Acción |
|---|---|---|---|
| **Deriva de calidad** | La puntuación del juez para un segmento fijo | Spearman ρ por segmento vs base cae | Bloquea el release; diagnostica según [árbol de la entrada 6](/es/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) |
| **Deriva de cobertura** | Distribución del tráfico de producción vs distribución del dataset dorado | Divergencia KL entre proporciones de segmentos | Remuestrea el dataset dorado |
| **Deriva del juez** | Acuerdo del modelo juez con humanos | Spearman ρ vs un conjunto de auditoría humano-etiquetado congelado | Recalibra el prompt del juez o reemplaza el juez |
| **Deriva de producción** | Puntuaciones de producción en vivo vs puntuaciones offline en el mismo modelo | Brecha de puntuación del replay de trazas de producción | Investiga recuperación / preprocesamiento / runtime |

La deriva de calidad es la que la mayoría de las suites miden; las otras tres son donde las regresiones del viernes por la tarde suelen esconderse. Divinci hace seguimiento a las cuatro contra el manifiesto base, con el desglose de puntuación por segmento expuesto en cada PR y un job semanal de calibración del juez que marca la deriva antes de que se acumule.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Un gráfico de 30 días que muestra la puntuación agregada de completitud de tarea manteniéndose plana en 0.87 mientras el segmento de dominio médico baja silenciosamente de 0.88 a 0.74">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">La Mentira de Semver, visualizada — 30 días de puntuación de completitud de tarea</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">El agregado (verde oscuro) se mantiene plano. El segmento médico (rojo) regresiona silenciosamente. Las compuertas agregadas nunca disparan.</text>
<g transform="translate(80, 100)">
<line x1="0" y1="0" x2="0" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<line x1="0" y1="250" x2="640" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">0.95</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">0.90</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">0.85</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">0.80</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0.75</text><line x1="-4" y1="200" x2="0" y2="200" stroke="#1e3a2b"/>
<text x="-10" y="254" text-anchor="end">0.70</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="0" y="268" text-anchor="middle">d-30</text>
<text x="160" y="268" text-anchor="middle">d-22</text>
<text x="320" y="268" text-anchor="middle">d-15</text>
<text x="480" y="268" text-anchor="middle">d-7</text>
<text x="640" y="268" text-anchor="middle">hoy</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">umbral de compuerta agregada — 0.89</text>
<polyline points="0,40 50,42 100,38 150,40 200,42 250,38 300,40 350,38 400,40 450,42 500,38 550,40 600,42 640,40" fill="none" stroke="#5a7a8f" stroke-width="2"/>
<circle cx="640" cy="40" r="4" fill="#5a7a8f"/>
<polyline points="0,60 50,58 100,62 150,60 200,58 250,60 300,62 350,60 400,58 450,60 500,62 550,60 600,58 640,60" fill="none" stroke="#2d5a4f" stroke-width="3.5"/>
<circle cx="640" cy="60" r="5" fill="#2d5a4f"/>
<polyline points="0,72 50,74 100,70 150,72 200,76 250,72 300,74 350,72 400,70 450,72 500,74 550,72 600,76 640,74" fill="none" stroke="#7a8a4a" stroke-width="2"/>
<circle cx="640" cy="74" r="4" fill="#7a8a4a"/>
<polyline points="0,64 50,68 100,66 150,72 200,80 250,92 300,108 350,128 400,150 450,168 500,184 550,196 600,206 640,214" fill="none" stroke="#a04848" stroke-width="3.5"/>
<circle cx="640" cy="214" r="5" fill="#a04848"/>
<g font-family="'DM Sans', sans-serif" font-size="11">
<rect x="656" y="30" width="120" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="2"/>
<text x="664" y="46" font-weight="700" fill="#5a7a8f">segmento legal</text>
<text x="722" y="46" fill="#5a7a8f">0.910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">agregado</text>
<text x="722" y="72" fill="#2d5a4f">0.872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">general</text>
<text x="722" y="98" fill="#7a8a4a">0.863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">segmento médico</text>
<text x="664" y="232" fill="#a04848">0.743 hoy · brecha ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">compuerta de segmento dispararía aquí ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Reconstrucción estilizada del patrón del postmortem de Sigma de Tianpan<sup><a href="#ref-1">[1]</a></sup> usando la nomenclatura interna de segmentos de Divinci. Los valores específicos son ilustrativos.</figcaption>
</figure>

## Evaluación multidimensional — puntúa cuatro cosas a la vez, por segmento

Una sola puntuación compuesta es una señal peor que cuatro puntuaciones escalares. Aplicamos compuertas sobre cuatro dimensiones:

- **Completitud de tarea** — ¿la respuesta realmente respondió la pregunta?, puntuada por un juez calibrado contra una rúbrica. Consciente de segmentos.
- **Fidelidad** — para cualquier respuesta que haya referenciado contexto recuperado, ¿cada afirmación está fundamentada en ese contexto? La alucinación aparece aquí primero.
- **Seguridad** — corrección del rechazo, resistencia a jailbreak, exposición de PII / política. Casi siempre con compuerta en tasa de aprobación ≥ 0.99; la seguridad es un muro firme, no un compromiso flexible.
- **Presupuesto de latencia** — p95 dentro del SLA del segmento. Un cambio de prompt que duplicó los tokens por respuesta es una regresión incluso si la calidad subió.

Cada dimensión tiene su propia base por segmento y su propio umbral por segmento. Nunca las combinamos en un único escalar ponderado en el momento de la compuerta; las exponemos como cuatro puntuaciones por segmento y bloqueamos sobre la que primero cruza su umbral. Un modelo que ganó 4 puntos de completitud de tarea a costa de 1 punto de fidelidad en el segmento médico sigue siendo una regresión.

## ¿Qué compuertas deberían bloquear el despliegue de un LLM personalizado?

Ejecutamos una arquitectura de tres capas, cada capa con compuertas en una etapa diferente del pipeline ([ver la entrada 1 para la taxonomía de etapas](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)).

**Capa 1 — Smoke (cada commit, ~90 segundos).** Veinte a treinta casos críticos extraídos de los segmentos de mayor impacto. Detecta regresiones catastróficas antes de que la suite completa gaste cómputo. Si smoke falla, el resto no se ejecuta.

**Capa 2 — Suite completa (cada PR, ~12 minutos).** El dataset dorado completo, puntuado por segmento en las cuatro dimensiones. Spearman ρ consciente de segmentos contra el manifiesto base. La violación de umbral bloquea el merge. El comentario del PR lista exactamente qué segmento en qué dimensión se movió y cuánto, con cinco casos de fallo de ejemplo.

**Capa 3 — Comparación base (release candidates, ~25 minutos).** El modelo candidato se reproduce contra los últimos 14 días de trazas de producción — el *replay de trazas de producción de bucle cerrado* que lanzamos en [la entrada 1](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/). El mismo juez calibrado que puntúa el dataset dorado también puntúa las salidas del replay. Cualquier segmento cuyas puntuaciones de replay diverjan de las puntuaciones offline más allá de su umbral bloquea el release. Esta capa es la que detecta deriva que el dataset dorado aún no conoce.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Árbol de decisión de compuerta de tres capas: pruebas smoke en cada commit, suite completa en cada PR, replay de trazas de producción en release candidates">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Compuerta de regresión de tres capas — cada bloque falla rápido, cada capa añade profundidad</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① Smoke · cada commit</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casos: 20–30 críticos</text>
<text x="14" y="82">Tiempo de reloj: ~90 s</text>
<text x="14" y="102">Dims: tarea + seguridad</text>
<text x="14" y="122">Segmentos: top 3 por volumen</text>
<text x="14" y="148" font-weight="600">Bloquea:</text>
<text x="14" y="168">fallos catastróficos</text>
<text x="14" y="186">salidas malformadas</text>
<text x="14" y="204">violaciones del muro de seguridad</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">fail-fast — suite completa</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② Suite completa · cada PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casos: completos ~500</text>
<text x="14" y="82">Tiempo de reloj: ~12 min</text>
<text x="14" y="102">Dims: tarea / fidel / seg / lat</text>
<text x="14" y="122">Segmentos: todos estratificados</text>
<text x="14" y="148" font-weight="600">Bloquea:</text>
<text x="14" y="168">ρ por segmento &lt; 0.7</text>
<text x="14" y="188">cualquier métrica de segmento bajo umbral</text>
<text x="14" y="208">acuerdo del juez &lt; 0.65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">comentario del PR lista cuál</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ Replay · release candidates</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casos: 14d de trazas en vivo</text>
<text x="14" y="82">Tiempo de reloj: ~25 min</text>
<text x="14" y="102">Dims: las cuatro · por segmento</text>
<text x="14" y="122">Origen: almacén de trazas de producción</text>
<text x="14" y="148" font-weight="600">Bloquea:</text>
<text x="14" y="168">brecha de puntuación offline ↔ replay</text>
<text x="14" y="188">deriva en segmentos aún no en</text>
<text x="14" y="206">el dataset dorado</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">última compuerta antes del rollout</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASA</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASA</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">Las tres capas puntúan contra el mismo manifiesto base — (model_sha, prompt_sha, retrieval_sha, judge_sha) — para que una puntuación que se mueva identifique <tspan font-weight="600" fill="#1e3a2b">qué</tspan> dimensión derivó, no solo <tspan font-weight="600" fill="#1e3a2b">que</tspan> algo lo hizo.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Los números de tiempo de reloj son internos — medidos en los runners de CI de producción de Divinci para un cliente representativo con ~500 casos de dataset dorado y ~14 días de trazas de producción.</figcaption>
</figure>

## Calibra tu juez antes de confiar en una sola puntuación que produzca

LLM-as-judge es lo que hace que cualquier cosa de esto escale más allá de unos pocos cientos de casos. También es donde una suite de regresión deja de funcionar silenciosamente, porque el juez no tiene ninguna obligación de mantenerse calibrado a medida que se actualiza o a medida que la distribución de tus datos se mueve.

Calibramos cada prompt de juez contra un conjunto de auditoría humano-etiquetado congelado de al menos 100 casos estratificados a través de los mismos segmentos que el dataset dorado, y re-ejecutamos la calibración semanalmente. El listón con el que enviamos es **Spearman ρ ≥ 0.7** contra la mediana de los evaluadores humanos, con **κ de Cohen ≥ 0.6** sobre juicios binarios de seguridad. Ambos están por encima del umbral en el que se ha demostrado que jueces estilo MT-Bench siguen a los evaluadores humanos al nivel de acuerdo interhumano<sup><a href="#ref-2">[2]</a></sup>.

Cuando la calibración semanal cae por debajo del umbral, el juez se retira automáticamente y se localiza al ingeniero de evaluación de guardia. El pipeline de release mantiene los candidatos abiertos en lugar de aplicarles compuertas sobre un juez que ya no está midiendo lo que solía medir.

```bash
# Ejecuta el job semanal de calibración del juez
curl -X POST https://api.divinci.ai/v1/regression/judges/calibrate \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "judge_id":     "rubric-v7",
    "audit_set":    "human-labels-2026-04",
    "min_spearman": 0.70,
    "min_kappa":    0.60,
    "on_fail":      "retire_judge_and_page"
  }'
```

## El diferenciador de Divinci — replay de trazas de producción en bucle cerrado

La compuerta de capa 3 es la parte que la mayoría de las suites de regresión no tienen. El flujo es el mismo flujo que lanzamos en la entrada 1, con una especialización para pruebas de regresión: cada release candidate ve comparada su puntuación en el dataset dorado offline, segmento por segmento, con su puntuación en una ventana de 14 días de trazas de producción reproducidas. El dataset dorado mide lo que esperábamos que el modelo hiciera. El replay mide lo que el modelo habría hecho realmente la semana pasada.

Cuando esas dos puntuaciones divergen más allá del presupuesto de brecha por segmento, el release se bloquea. El desajuste es la señal: o bien el dataset dorado ya no es representativo (deriva de cobertura), o el candidato se comporta de forma diferente sobre trazas moldeadas por el preprocesamiento y la recuperación de producción (deriva de producción). De cualquier manera, te enteras antes que los usuarios.

El juez que puntúa la ejecución offline es el mismo juez que puntúa la ejecución de replay. El registro de auditoría guarda ambos conjuntos de puntuaciones, ambas versiones del juez, los IDs de traza que se reprodujeron y la brecha que disparó el bloqueo. La brecha en sí misma es la señal diagnóstica más útil que tenemos, y es lo que se entrega a quien continúe con [el árbol diagnóstico de la entrada 6](/es/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/).

## Ancla el dataset dorado con un recibo vindex

Cada puntuación en la suite carece de significado si no puedes reproducirla más tarde. Hasheamos el dataset dorado en cada release y encadenamos ese hash en un recibo vindex junto con el SHA del modelo, el SHA del prompt, el SHA del juez y el registro de calibración. El recibo es anclable externamente — los auditores pueden reproducir nuestra ejecución exacta de regresión seis meses después y verificar las puntuaciones que reportamos.

```json
{
  "release_id": "rel_3f1a-2026-05-26",
  "model": { "sha": "0c1f9…", "weights_uri": "r2://models/custom-v7.2", "open_weights": true },
  "prompt": { "sha": "c4a8e…", "template_id": "support-v3.4" },
  "retrieval": { "index_sha": "b21f0…", "embedder": "e5-mistral-7b-instruct" },
  "judge": { "sha": "d8e21…", "rubric_id": "rubric-v7", "spearman_vs_humans": 0.74 },
  "dataset": { "sha": "a90b1…", "n": 512, "slices": 17, "stratified_at": "2026-04-30" },
  "scores": { "aggregate": 0.872, "by_slice": { "/* … */": "/* escalares por segmento */" } },
  "replay": { "trace_window_days": 14, "n_traces": 8430, "max_gap": 0.018 },
  "vindex_anchor": "sha256:f0bfd2…",
  "verifiable_at": "https://vindex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**Advertencia open-weights.** El recibo de arriba lleva procedencia de pesos solo cuando el modelo es open-weights — vindex ancla los bytes reales de los pesos. Para backings de modelos cerrados de API (modelos gestionados de OpenAI / Anthropic / Google), el recibo aún lleva la cadena de decisión — cada puntuación de compuerta, cada resultado de juez, el registro de calibración — pero el campo de pesos está vacío, y no puedes verificar de forma independiente el artefacto del modelo. Lo decimos en el recibo y en la [documentación de cumplimiento](/es/compliance/) para que los auditores no se queden con una impresión falsa. Los releases que más se benefician de una cadena vindex completa son aquellos en los que tú controlas los pesos.

## Una cronología de implementación en cuatro fases que hemos enviado realmente

Los equipos que intentan enviar la arquitectura completa en la semana uno se atascan en herramientas. El orden de abajo es el orden que funciona.

**Fase 1 — Base (semana 1).** Extrae una muestra estratificada de los últimos 30 días de trazas de producción. Que dos ingenieros etiqueten a mano la completitud de tarea sobre 100 casos cada uno. Calcula el acuerdo entre evaluadores (objetivo κ de Cohen ≥ 0.6). El número que obtengas es tu línea base humana de partida; todo lo demás se calibra contra esto.

**Fase 2 — Harness (semanas 2–3).** Levanta el harness de evaluación sobre el dataset de 100 casos. Añade un juez calibrado contra tus etiquetas humanas. Verifica que el harness reproduce las puntuaciones humanas dentro de ρ ≥ 0.7. La mayoría de los equipos descubren que su primer prompt de juez falla esto y lo reescriben dos veces — esto es normal.

**Fase 3 — Compuertas (semanas 3–4).** Cablea el harness en CI como advertencia, no como bloqueo. Obsérvalo durante dos semanas. Los umbrales que descubres observando las tasas de falsos positivos son los únicos umbrales que sobreviven. Promueve a bloqueante solo cuando la tasa de falsos positivos esté por debajo del 5%.

**Fase 4 — Bucle de replay (continuo).** Una vez que las compuertas estén bloqueando de forma fiable, habilita la capa de replay de trazas de producción. Aquí es donde aparece la brecha de cobertura por segmentos, y donde cada postmortem empieza a añadir casos de vuelta al dataset dorado.

## Qué no resuelve esto

Tres limitaciones honestas, de la misma manera que las hemos enmarcado en cada entrada de esta serie.

1. **La deriva de la suite es trabajo sin fin.** Las pruebas de regresión son infraestructura, no un proyecto. El dataset dorado tiene que re-estratificarse cada trimestre, el juez recalibrarse cada semana, los presupuestos de umbral re-ajustarse cada postmortem. No hay versión de esto en la que envías una suite y te alejas.
2. **Un juez perfectamente calibrado sigue siendo un modelo.** Spearman ρ = 0.74 contra evaluadores humanos significa que aproximadamente una cuarta parte de las llamadas del juez discrepan con la mediana humana. Ese desacuerdo residual es el piso de ruido en cada puntuación. Lo exponemos explícitamente en cada informe de release; los equipos que olvidan que está ahí se sorprenderán por él eventualmente.
3. **Los backings cerrados de API limitan cuánto puedes verificar.** Con un modelo cerrado de API, la suite de regresión mide comportamiento pero no puede verificar la procedencia de los pesos. Si necesitas reproducibilidad completa — industrias reguladas, despliegues auditados — la compensación está en la elección del modelo, no en la suite.

## Próximamente

La entrada 8, la última de esta serie, cierra el bucle del interior de CI. Mientras esta entrada y la entrada 5 fueron sobre lo que se ejecuta en las compuertas, la siguiente trata sobre la capa de CI que produce los candidatos que las compuertas puntúan en primer lugar — evaluación pre-merge, pruebas de contrato para plantillas de prompt y cómo dimensionar la flota de CI para una suite de evaluación de 12 minutos sin reventar el presupuesto. Es la capa de ingeniería que está debajo de todo lo que hemos escrito hasta ahora.

## FAQ

**¿Cuál es la diferencia entre evaluación de LLM y pruebas de regresión de LLM?**

La evaluación mide si un modelo cumple un listón de calidad en un punto del tiempo, contra una rúbrica absoluta. Las pruebas de regresión miden si un candidato se comporta igual que una línea base congelada, por segmento, a través de múltiples dimensiones. La línea base es lo que la convierte en pruebas de regresión — Divinci envía ambas, y el modo de regresión fija (model_sha, prompt_sha, judge_sha, dataset_sha) para que una puntuación movida identifique qué entrada se movió.

**¿Cuántos casos debería tener un dataset dorado?**

Menos de los que crees, mejor estratificados de lo que crees. Hemos enviado cobertura útil de regresión con 200 casos sobre cinco segmentos bien definidos y hemos visto datasets de 5.000 casos que se perdieron todo lo que importaba porque no estaban estratificados. Empieza en 200, estratificados, luego haz crecer el bucket de replay caso a caso desde los postmortem.

**¿Debería usar revisores humanos o LLM-as-judge?**

Ambos, con humanos calibrando al juez. Los humanos no pueden seguir el ritmo del volumen que necesita puntuar una compuerta de CI en ciclo de release. El juez cubre el volumen, los humanos calibran al juez — medido semanalmente con Spearman ρ ≥ 0.7. Cualquiera por sí solo es un modo de fallo.

**¿Cómo pruebo salidas no deterministas?**

Puntúa la distribución, no la cadena. Puntúa con una rúbrica que el juez pueda aplicar a través de distintas formulaciones, y ejecuta cada entrada de tres a cinco veces a temperatura > 0 para que la puntuación consciente de segmentos sea sobre una distribución de completaciones en lugar de una única muestra. Aprieta la temperatura solo para casos que genuinamente necesiten salida determinista (llamadas a herramientas con salida estructurada, clasificación).

**¿Qué métricas debería priorizar para la primera compuerta de calidad en CI?**

Completitud de tarea y una compuerta de seguridad. Ambas por segmento. Añadir más dimensiones antes de que las dos primeras estén calibradas produce ruido; los equipos que envían más suelen terminar aplicando compuertas sobre el ruido. Añade fidelidad a continuación cuando enciendas la recuperación; añade latencia una vez que las dos primeras estén estables.

## Referencias

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 de abril de 2026. El modo de fallo nombrado en 2026 para el análisis de regresión consciente de segmentos; las puntuaciones agregadas se mantienen planas mientras un segmento de bajo volumen regresiona silenciosamente.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Evidencia empírica de que jueces LLM fuertes coinciden con evaluadores humanos aproximadamente al nivel de acuerdo interhumano (≈ 80%) en tareas abiertas, con modos de fallo reportados que las auditorías calibrar-contra-humanos están diseñadas para detectar.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. El resultado fundacional sobre olvido catastrófico en redes neuronales con fine-tuning — por qué un LLM personalizado con fine-tuning tiene que probarse en regresión para detectar pérdida de capacidad general, no solo ganancia en la tarea objetivo.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> El contraste con API cerrada: compuertas sobre métricas de infraestructura (latencia, errores, CPU) en lugar de sobre calidad semántica por segmento.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. El coeficiente de correlación por rangos que ancla la compuerta consciente de segmentos — robusto frente a deriva de escala de puntuación en el juez, que es la propiedad que necesitábamos.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> La línea base entre industrias para "con qué frecuencia los deploys causan incidentes" y "qué tan rápido te recuperas". Las suites de regresión que bloquean en la compuerta mueven la primera métrica hacia abajo; el rollback instantáneo ([entrada 5](/es/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) mueve la segunda.
  </li>
</ol>
