+++
title = "Validar y publicar LMs custom en sectores regulados"
description = "EU AI Act, GDPR Artículo 17, HIPAA, NIST AI RMF — mapeados capacidad por capacidad a un pipeline de release LLM. Donde divergen pesos abiertos y cerrados."
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
summary = "El cumplimiento en industrias reguladas para modelos de lenguaje custom se parte limpiamente sobre un eje: open-weights vs closed-API. Para respaldos open-weights, puedes enviar un weight-attestation de vIndex que satisface criptográficamente el borrado verificable del Artículo 17 del GDPR. Para respaldos closed-API, el mismo recibo cubre la cadena de decisión pero no puede reclamar procedencia de pesos — y el regulador recibe esa distinción dentro del propio recibo. Este post mapea cuatro marcos regulatorios (EU AI Act, GDPR, HIPAA, NIST AI RMF) sobre las cuatro etapas del pipeline que enviamos, y muestra el formato de recibo real."
+++

*Notas del Ciclo de Release — Parte IV*

---

Una abogada general entra a la revisión de ingeniería. Trae una sola pregunta: *"Si mañana aterriza una solicitud del derecho al borrado del Artículo 17 del EU AI Act pidiéndonos remover cada hecho que nuestro modelo aprendió sobre un paciente específico, ¿podemos probar que lo hicimos?"*

La respuesta honesta que la mayoría de equipos tiene que dar es: "Podemos hacer fine-tuning del modelo para que olvide. Podemos mostrarte el training run. Pero no podemos probar que la información esté estructuralmente fuera, porque podría reaparecer bajo el prompt adversarial correcto."

Eso no es una respuesta de cumplimiento. Es una no-respuesta con un encogimiento de hombros procedimental.

Este post trata de cómo se ve una respuesta real de cumplimiento para LLMs custom — a través de cuatro marcos regulatorios (**EU AI Act, GDPR Artículo 17, HIPAA, NIST AI RMF**), mapeados al pipeline de cuatro etapas ([Register → Gate → Roll → Observe](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)) que enviamos para releases de cliente. La tensión titular que atraviesa la petición de cada regulador es **open-weights vs closed-API**: las cosas que puedes probar sobre un fine-tune de Gemma 4 no son las cosas que puedes probar sobre un release servido detrás de una API opaca de proveedor. El formato de recibo que usamos lo dice explícitamente, línea por línea. Esa honestidad es lo que hace al recibo útil para un auditor.

## Los cuatro reguladores y lo que cada uno realmente quiere

Las discusiones de cumplimiento tienden a colapsar en "documentamos cosas". Ese enfoque falla ante un auditor. Lo que los auditores quieren es *evidencia que pueden verificar sin confiar en tu infraestructura*. Los cuatro marcos a continuación usan vocabularios distintos para la misma petición subyacente.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Cuatro marcos regulatorios y la primitiva de verificación que cada uno exige. EU AI Act exige lógica documentada y supervisión humana; la primitiva de verificación es documentación mecanicista bit-exacta. GDPR Artículo 17 exige borrado verificable de datos personales; la primitiva de verificación es un parche DELETE a nivel de pesos con recibo SHA-256. HIPAA exige auditoría de acceso y trazabilidad de divulgación; la primitiva de verificación es un log de decisión firmado por petición. NIST AI RMF exige gobernanza, mapeo, medición y gestión; la primitiva de verificación son recibos encadenados por hash para cada decisión de release.">
<title>Cuatro reguladores, una verificación subyacente</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Cuatro reguladores, una misma petición subyacente: verificar, no confiar</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Cada marco nombra la primitiva de verificación de forma distinta, pero la sustancia es la misma: prueba criptográfica que un auditor puede verificar.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">El Anexo IV pide:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• lógica documentada</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• resumen de datos de training</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• medidas de supervisión humana</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• monitoreo post-mercado</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Primitiva de verificación:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">documentación mecanicista</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">bit-exacta vía vIndex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">Sanción por incumplimiento:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">hasta 7% de la</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">facturación global</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR Art. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">El derecho al borrado pide:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• eliminación verificable</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• olvido demostrable</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• prueba bajo prompting</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  adversarial</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Primitiva de verificación:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">parche DELETE a nivel</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">de pesos con recibo SHA-256</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">Sanción por incumplimiento:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">hasta €20M o</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">4% de la facturación</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Los controles de acceso piden:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• rastro de auditoría de acceso</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• trazabilidad de divulgación</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• exposición mínima</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  necesaria de PHI</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Primitiva de verificación:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">log de decisión firmado</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">por petición</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">Sanción por incumplimiento:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">hasta $1.9M /</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">tipo-de-violación / año</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Cuatro funciones núcleo:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• gobernar</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• mapear</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• medir</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• gestionar</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Primitiva de verificación:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">recibo encadenado por hash</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">por decisión de release</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">Sanción por incumplimiento:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">marco voluntario</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(pero la línea base</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">empresarial de facto)</text>
</svg>
</figure>

Los números de sanción no son lo que hace interesantes a estos marcos. Los números de sanción son lo que los vuelve estructurales. La parte interesante es la **primitiva de verificación** — cómo cada marco realmente quiere que se vea el artefacto. Tres de los cuatro piden prueba de grado criptográfico en vocabularios distintos. El cuarto (NIST AI RMF) es voluntario pero de facto requerido en la procura empresarial. Convergen en la misma forma: un artefacto que un auditor puede verificar sin confiar en tus logs.

## El corte: open-weights vs closed-API

Antes del mapeo por etapas, la advertencia más importante de todo este post:

**Para respaldos de modelo open-weights** — Gemma, Qwen, Llama, Mistral, GPT-OSS, cualquier cosa donde los pesos sean direccionables y editables — cada decisión de release de Divinci emite un recibo de vIndex que incluye un **weight-attestation**: prueba criptográfica de que los pesos activos en el momento de la decisión son exactamente los pesos que el manifest registró. Esto es lo que hace posible el borrado verificable del Artículo 17 del GDPR. Aplicas un [parche DELETE](/blog/deleting-paris-from-a-language-model/) que remueve una relación-entidad específica del espacio de pesos, el recibo embebe el hash antes-y-después, y un auditor puede verificar que el borrado ocurrió volviendo a correr la verificación contra el vIndex público.

**Para respaldos de modelo closed-API** — OpenAI, Anthropic, Google vía APIs opacas — el mismo recibo cubre la cadena de decisión (qué manifest, qué resultado de gate, qué lectura de monitor, qué usuario disparó qué acción) pero **no puede reclamar procedencia de pesos**, porque el proveedor no expone pesos. El recibo lo nota explícitamente en un campo `weight_attestation: null` con una `note` explicando por qué. Eso no es una postura de cumplimiento degradada — es el límite de lo que es verificable, escrito honestamente. Un auditor que lea el recibo entiende exactamente qué clase de prueba se está y no se está haciendo.

Este corte atraviesa la petición de cada regulador a continuación. Cada vez que un marco exige algo a nivel de pesos, el camino open-weights puede satisfacerlo y el camino closed-API no. Lo decimos en el recibo en lugar de implicar una prueba que no podemos entregar.

## Cómo cada marco mapea a las cuatro etapas del pipeline

El pipeline tiene cuatro etapas. La petición de cada regulador mapea a una o más de ellas. La matriz de abajo es el mapa real.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Mapeo de cuatro marcos regulatorios a las cuatro etapas del pipeline de release de Divinci. La lógica documentada y el resumen de training del Anexo IV del EU AI Act mapean a la Etapa 1 Register. La supervisión humana y el monitoreo post-mercado del EU AI Act mapean a las Etapas 2 Gate y 4 Observe. El borrado verificable del Artículo 17 del GDPR mapea a la Etapa 1 Register vía parche DELETE y a la Etapa 4 Observe vía recibo. La auditoría de acceso y trazabilidad de divulgación de HIPAA mapean a las Etapas 1, 3 y 4. Las funciones Govern, Map, Measure, Manage de NIST AI RMF mapean a través de las cuatro etapas. Cinco celdas de la matriz están destacadas para indicar el camino de verificación solo open-weights.">
<title>Marcos regulatorios mapeados a las etapas del pipeline</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Qué etapa del pipeline cubre qué petición regulatoria</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = cobertura completa. ◐ = solo open-weights (weight-attestation requerido). El camino closed-API cubre la cadena de decisión pero no puede hacer la afirmación a nivel de pesos.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Marco / petición</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Anexo IV: lógica documentada</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Anexo IV: resumen de datos de training</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Medidas de supervisión humana</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Monitoreo post-mercado</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR Artículo 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Borrado verificable (parche DELETE)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Recibo de borrado (encadenado por hash)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Auditoría de acceso por petición</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Trazabilidad de divulgación + mínimo-necesario</text>
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

Las dos celdas ◐ son las entradas de GDPR Artículo 17 / solo open-weights — estas son las peticiones que el camino closed-API no puede satisfacer completamente. Todo lo demás aplica a ambos respaldos.

El resto del post recorre la contribución de cada etapa.

## Etapa ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">El manifest de release es la documentación técnica del Anexo IV del EU AI Act.</span>
  </div>
</div>

La etapa Register produce un manifest JSON inmutable, direccionado por SHA-256. Para releases regulados el manifest lleva todo lo que el Anexo IV<sup><a href="#ref-1">[1]</a></sup> pide en un solo artefacto:

- El artefacto del modelo (repo HF + commit SHA, o una referencia de parche vIndex)
- La plantilla de prompt (cada variable, cada system message — versionada)
- Las reglas de routing (qué clase de tráfico aterriza en qué release)
- La versión del dataset usada para computar los umbrales del gate (resumen de datos de training por hash)
- El SHA del release previo (para que la cadena de auditoría sea ininterrumpida)
- El alcance de divulgación — para despliegues HIPAA, qué categorías de PHI el modelo tiene permitido recibir

El manifest es la documentación. Un auditor no lee prosa; lee el hash del manifest y verifica el bundle. No se requiere resumen en prosa escrito-seis-meses-después.

**Bonus open-weights.** Cuando el artefacto del modelo referencia un modelo open-weights, el manifest también embebe el `vindex_sha256` — la huella criptográfica del [vIndex](/es/compliance/) publicado del modelo. Esa huella es lo que le permite a un tercero verificar los pesos activos sin nunca tener que confiar en nuestra infraestructura de despliegue.

**Advertencia closed-API.** Cuando el artefacto del modelo referencia un modelo closed-API, el campo `vindex_sha256` del manifest es `null`, y el `weight_attestation_class` del manifest es `decision_chain_only`. El auditor que lee esto sabe exactamente qué se afirma y qué no.

## Etapa ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Los gates de calidad por slice cargan el requisito de supervisión humana del EU AI Act.</span>
  </div>
</div>

La etapa Gate es donde las "medidas de supervisión humana"<sup><a href="#ref-1">[1]</a></sup> del EU AI Act se operacionalizan. Un regulador que lea el EU AI Act y concluya "necesitamos un workflow de aprobación humana" ha errado el punto — la petición más difícil es *contra qué está aprobando el humano*. La etapa Gate responde esa pregunta con un Spearman ρ por slice contra un grader anclado en humano<sup><a href="#ref-3">[3]</a></sup>. Cada slice que importa en tu postura regulatoria (oncología pediátrica, licenciamiento de IP, francés belga) recibe su propio umbral. El camino de override requiere un razonamiento escrito que va al rastro de auditoría.

Para despliegues cubiertos por HIPAA, esto también es donde vive la regla de divulgación "mínima-necesaria". La suite de QA puntuada del gate incluye tests negativos para sobreexposición de PHI — respuestas que incluyen identificadores personales cuando ninguno fue pedido. Un release que regresa en el slice de sobreexposición falla el gate, sin importar cómo se desempeñen sus otros slices.

Para NIST AI RMF, la etapa Gate cubre la función "measure" — la evidencia numérica por slice de que el sistema está desempeñándose dentro de las tolerancias configuradas.

## Etapa ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Los checkpoints de canary se convierten en el artefacto de monitoreo post-mercado.</span>
  </div>
</div>

El monitoreo post-mercado<sup><a href="#ref-1">[1]</a></sup> del EU AI Act requiere que el operador demuestre observación *continua* — no solo previa al lanzamiento — de cómo el sistema de IA se desempeña en condiciones reales. Un canary 5% → 25% → 100% con checkpoints de monitor de calidad es la forma más natural de satisfacer esto. El dwell en cada checkpoint, más las lecturas del monitor durante el dwell, es lo que un auditor quiere ver.

Para HIPAA, la etapa canary también es donde el logging de auditoría por petición se ejercita end-to-end. Cada checkpoint produce una muestra de recibos firmados de petición-respuesta; si alguno de ellos tiene un manejo de PHI mal configurado, sale a flote a 5% de tráfico en lugar de a 100%.

## Etapa ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">El monitor continuo + el formato de recibo hacen verificable el Artículo 17 del GDPR.</span>
  </div>
</div>

Esta es la etapa que se gana la historia de cumplimiento. La etapa Observe corre replay continuo de trazas a través del release activo, puntuado por el mismo juez anclado en humano de Gate, con un monitor de calidad que dispara rollback automático si rompe el umbral.

Cada decisión de release — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback, **y cualquier aplicación de parche DELETE del Artículo 17 del GDPR** — emite un recibo de vIndex. Encadenado por hash al recibo previo para este cliente y al recibo previo para este release.

Así es la forma de un recibo para un parche DELETE del Artículo 17 del GDPR — un ejemplo trabajado con identificadores y cifras de marcador de posición, en el formato documentado en la [página de compliance](/es/compliance/):

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

Un recibo en este formato es verificable. Un auditor no tiene que confiar en nuestros logs. Toman el `vindex_sha256_after`, jalan el vIndex publicado correspondiente de `huggingface.co/Divinci-AI`, y verifican que la feature 11179 en la layer 27 está estructuralmente ausente del top-25. Toman el `chain_signature` y lo verifican contra el recibo anterior. Toda la cadena está anclada externamente en una agenda que el cliente configura.

**La misma operación contra un modelo closed-API.** Los campos del recibo de arriba cambian de tres formas: `operation.target` se vuelve `provider_api_endpoint`, `verification` se vuelve un esquema distinto cubriendo solo evidencia de cadena de decisión, y `weight_attestation_class` se vuelve `decision_chain_only`. El proveedor del modelo closed-API no ha expuesto pesos, así que el recibo lo dice. Un auditor que quiera prueba a nivel de pesos ahora sabe que tiene que escalar al proveedor, no a nosotros.

Esta es la diferenciación que nadie más envía en 2026. El campo de eval-CI (Braintrust, Humanloop, Patronus) no se sienta sobre tráfico y no emite recibos de decisión. El campo de canary de serving (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) emite logs de métricas de infraestructura pero no recibos de cumplimiento encadenados por hash. El campo de observabilidad (Arize, Phoenix, Confident, Deepchecks) observa el output pero no hace cumplir.

## ¿Qué verifica realmente un auditor?

Un ejercicio útil: caminar por las preguntas que un auditor real hará, y qué artefacto responde a cada una.

| Pregunta del auditor | Artefacto que la responde |
|---|---|
| *"¿Qué versión del modelo estaba corriendo el 15 de marzo a las 14:22 UTC?"* | El recibo de etapa Observe para ese timestamp, firmado y encadenado por hash. |
| *"¿Qué evaluación pasó este release antes del promote?"* | El recibo de etapa Gate, con la tabla de Spearman ρ por slice y el SHA del dataset contra el que corrió el gate. |
| *"¿Una solicitud de borrado del Artículo 17 del GDPR para el paciente X se aplicó realmente?"* | El recibo del parche DELETE de arriba. El auditor verifica el `vindex_sha256_after` contra el vIndex publicado. |
| *"¿Quién aprobó este release? ¿Cuál fue su razonamiento declarado para anular el gate del slice de licenciamiento de IP?"* | El bloque `override` del recibo de etapa Gate, incluyendo el ID de usuario y el razonamiento de texto libre requerido. |
| *"¿Qué tan rápido disparó el rollback, y qué lectura del monitor lo activó?"* | El recibo de rollback de etapa Observe, con las tres lecturas de calidad consecutivas bajo el umbral y el tiempo transcurrido del rollback. |
| *"Muéstrame la evidencia de monitoreo post-mercado de los últimos 90 días."* | La cadena de recibos de etapa Observe. Anclada externamente en la agenda configurada del cliente. |

Lo que el auditor *no tiene que hacer*: confiar en nuestro Datadog. Confiar en nuestro CloudWatch. Confiar en un screenshot. Confiar en un export. El punto entero del formato de recibo es que el auditor pueda verificarlo independientemente.

## Lo que esto no resuelve

Tres limitaciones honestas:

**Las regresiones closed-API en territorio del Artículo 17 del GDPR no son resolubles a nivel de plataforma.** Si estás sirviendo un asistente sanitario detrás de un modelo closed-API y un paciente invoca el Artículo 17, la plataforma puede atestiguar que el registro del paciente fue removido de tu store de retrieval, tu plantilla de prompt y tus reglas de routing — pero no puede atestiguar que los pesos del modelo subyacente olvidaron los datos del paciente. Necesitas o bien un respaldo open-weights o un compromiso del proveedor para borrado a nivel de pesos. Lo decimos en el recibo.

**La documentación es necesaria pero no suficiente.** Un recibo que prueba que un modelo cumplió un umbral no prueba que el umbral fuera el umbral correcto. Si tu suite de QA puntuada no cubre el slice que realmente le importa a un paciente en tu servicio, ninguna cantidad de encadenamiento de recibos arregla eso. Los reguladores entienden esto cada vez más; "pasamos nuestro eval" ya no es una respuesta de cumplimiento suficiente si el eval era el eval equivocado.

**El formato vIndex es de un solo proveedor.** Lo usamos porque es la primitiva criptográfica más concreta disponible hoy para prueba a nivel de pesos. Si la industria se asienta en un formato distinto — model-cards-con-hashes, esquemas de artefacto publicados por NIST — el formato de recibo debería evolucionar a eso. La sustancia (encadenado por hash, verificable externamente, consciente del weight-attestation) es lo estructural, no el nombre específico del esquema. Esperamos que eso cambie conforme el paisaje regulatorio y de estándares madure.

## FAQ

### ¿Qué es el borrado verificable bajo el Artículo 17 del GDPR para sistemas de IA?

Borrado verificable significa que un tercero puede verificar que los datos fueron removidos sin tener que confiar en tus logs. Hacer fine-tuning de un modelo para que "olvide" información específica no cumple este estándar — la información puede reaparecer bajo prompting adversarial, y no hay primitiva criptográfica que un auditor pueda verificar. Un parche DELETE a nivel de pesos con un hash de vIndex antes/después publicado *sí* cumple el estándar, porque el auditor puede volver a correr la verificación contra el artefacto público.

### ¿Por qué los modelos closed-API no pueden satisfacer el Artículo 17 del GDPR de la misma forma?

Porque el proveedor no expone pesos. Sin acceso a los pesos, ningún tercero — incluyendo al cliente que usa la API — puede emitir o verificar un borrado a nivel de pesos. La parte de cadena de decisión del recibo (qué plantilla de prompt se usó, de qué store de retrieval vinieron los datos, qué reglas de routing estaban activas) sigue siendo verificable, pero la afirmación a nivel de pesos no. Esto es un límite de lo que es verificable cuando los pesos son privados, no un límite del marco de cumplimiento.

### ¿Qué requiere el Anexo IV del EU AI Act, en castellano llano?

El Anexo IV pide documentación técnica que cubra la lógica del sistema, el resumen de datos de training, el uso previsto, las medidas de supervisión humana y el monitoreo post-mercado. La trampa en la que cae la mayoría de equipos es tratar estos como cinco documentos separados. El manifest de release en la Etapa 1 carga las primeras tres peticiones como un solo hash; la etapa Gate cubre la cuarta; las etapas Roll + Observe cubren la quinta. Un solo pipeline; cuatro peticiones satisfechas como subproducto de operaciones normales.

### ¿Qué tan rápido debería ser el rollback para despliegues cubiertos por HIPAA?

HIPAA no especifica un tiempo de rollback, pero la guía del HHS sobre respuesta a brechas trata el tiempo-hasta-contención como estructural. Un rollback en el orden de segundos (drenado en vuelo sobre un flip impulsado por manifest — nuestro número anda alrededor de 12 segundos) es estructuralmente más rápido que un blue-green típico de métricas de infraestructura que depende de propagación de alarmas. Compara con postmortems públicos: el incidente de Cloudflare de junio de 2022<sup><a href="#ref-4">[4]</a></sup> tardó 44 minutos en revertirse porque los ingenieros se pisaron las reversiones unos a otros.

### ¿Cómo mapea NIST AI RMF a un pipeline de release?

Las cuatro funciones núcleo de NIST AI RMF — Govern, Map, Measure, Manage — abarcan todo el ciclo de vida del release, no una sola etapa. Govern es la política de release documentada más el workflow de razonamiento de override del gate (etapas Register + Gate). Map es la suite de QA puntuada por slice (Gate). Measure son los umbrales de Spearman por slice y el monitor continuo de calidad (Gate + Observe). Manage es el camino de rollback y la cadena de recibos (Observe). Las cuatro están cubiertas cuando el pipeline emite su conjunto completo de recibos.

## Referencias

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. El Anexo IV define los requisitos de documentación técnica para sistemas de IA de alto riesgo: lógica del sistema, resumen de datos de training, medidas de supervisión humana, monitoreo post-mercado. Sanciones de hasta 7% de la facturación global por incumplimiento.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. <code>TerminationWaitInSeconds</code> por defecto 600, <code>MaximumExecutionTimeoutInSeconds</code> máximo 1800. Citado como el canary de métricas de infraestructura estándar de la industria contra el que se contrasta el monitor de calidad de la Etapa 4.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Acuerdo calibrado de LLM-como-juez.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% de acuerdo global GPT-4-vs-humano, con varianza por categoría desde coding (86%) hasta writing (36–44%). Ancla para la calibración de Spearman por slice que impulsa la etapa Gate.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Caída de Cloudflare de junio de 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 minutos desde "sabemos qué revertir" hasta revertido completo porque los ingenieros se pisaron las reversiones unos a otros. Ancla para la afirmación "un rollback impulsado por manifest no puede tener ese modo de fallo".
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Marco voluntario — Govern, Map, Measure, Manage — que se ha vuelto la línea base de facto en procura empresarial para gobernanza de IA. Voluntario pero enforced en la práctica vía cuestionarios de due-diligence del cliente.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Requisitos de divulgación mínima-necesaria, auditoría de acceso y tiempos de respuesta a brechas aplicables a cualquier sistema de IA que toque PHI. Sanciones monetarias civiles de hasta $1.9M por tipo-de-violación por año según <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">CMP inflation adjustment, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Artículo 17 (Derecho al borrado).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. El derecho del titular de datos a obtener el borrado de datos personales, y la obligación del controlador de demostrar cumplimiento bajo la responsabilidad del Artículo 5(2). Sanciones de hasta €20M o 4% de la facturación global anual.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interno — formato de recibo vIndex.</strong> El JSON del recibo en este post se adapta del formato documentado en la <a href="/es/compliance/">página de compliance</a> y demostrado en el post <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a>. La cadena de hash es SHA-256 sobre <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Anclable externamente en una agenda configurada por el cliente.
</li>
</ol>

---

*Siguiente en esta serie:* **Pipelines automatizados de CI/CD de LLM con rollback instantáneo.** Este post mostró qué quiere un auditor. El siguiente muestra el patrón operativo que hace llegar el recibo al escritorio del auditor en segundos en lugar de semanas — la automatización bajo el pipeline de cuatro etapas, con foco en qué cambia cuando el rollback dispara por sí solo.
