+++
title = "Las 12 capacidades de QA y release management que toda plataforma de LLM custom debería enviar"
description = "Checklist de capacidades para plataformas de release LLM: gates por slice, jueces calibrados, rollback atómico, recibos hash — qué se entrega, qué falta."
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
summary = "Evaluamos doce plataformas de release de LLM antes de construir la nuestra. El mercado se divide en tres campos que no terminan de encontrarse — herramientas de eval-CI, herramientas de canary de serving, y herramientas de observabilidad — y la costura faltante entre ellos es exactamente la que necesita el release de un cliente. Este post es el checklist de capacidades que salió de esa evaluación: 12 tests específicos que puedes aplicar a cualquier plataforma, incluyendo la nuestra."
+++

*Notas del Ciclo de Release — Parte III*

---

Hace un año, antes de empezar a construir nuestro propio pipeline de release, nos sentamos y enumeramos cada capacidad de QA y release que pensábamos que una plataforma seria de LLM debería enviar. Luego evaluamos doce otras plataformas contra la lista — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core. Nadie tenía las doce. Las combinaciones que *sí* se enviaban se agrupaban en tres campos que no se tocaban entre sí.

Este post es la lista de capacidades resultante, hecha portable. Está organizada por cuál de nuestras cuatro etapas del pipeline contiene cada capacidad — **Register → Gate → Roll → Observe** — para que componga limpiamente con la [arquitectura del pipeline](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) y los [modos de fallo](/es/blog/10-ci-cd-release-failures-in-custom-language-models/) sobre los que hemos escrito. Si estás evaluando herramientas, recorre la lista de arriba abajo contra cada candidato; las que tengan los huecos más profundos te dirán a qué campo pertenecen.

## Los tres campos (para que sepas qué estás mirando)

Antes del checklist en sí, la forma del mercado en 2026:

- **Campo Eval-CI** — Braintrust, Humanloop, Patronus. Ejecutan evaluadores automáticos al merge del PR. Bloquean merges malos. Nunca tocan tráfico en vivo. Fuertes en las capacidades 4–6; ausentes en 7–12.
- **Campo Canary de Serving** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core. Dividen tráfico, monitorean métricas de infraestructura, auto-rollback contra alarmas tipo CloudWatch. Fuertes en 1, 7, 9; ausentes en el lado de calidad de 8 y 10–12.
- **Campo Observabilidad** — Arize Phoenix, Confident AI, Deepchecks. Vigilan producción, alertan a humanos, escalan. Fuertes en 10 (monitoreo), pero no hacen cumplir nada — alertar no es auto-rollback.

El hueco entre estos campos — entre "pasó CI" y "canary en vivo puntuado por calidad, no solo por latencia" — es la parte que todos tienen que cruzar manualmente. Cerrar ese hueco es la afirmación que sostiene este post.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Diagrama de Venn de los tres campos de plataformas de LLM. El campo Eval-CI (Braintrust, Humanloop, Patronus) se sitúa a la izquierda y cubre evaluación offline al merge del PR. El campo Canary de Serving (SageMaker, KServe, Vertex, BentoCloud, Seldon) se sitúa a la derecha y cubre división de tráfico con rollback por métricas de infraestructura. El campo Observabilidad (Arize, Phoenix, Confident, Deepchecks) se sitúa abajo y cubre monitoreo y alertas sin enforcement. Los tres círculos se superponen por pares en franjas estrechas, pero la región central donde los tres se encuentran está vacía. Ese centro vacío es la costura faltante de la que trata este post — una decisión de release impulsada por calidad por slice, ejecutada atómicamente sobre tráfico en vivo.">
<title>Los tres campos y el centro faltante</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Los tres campos que no terminan de encontrarse</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">Cada campo posee una pieza. El centro es donde cada equipo cruza a mano.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">Eval-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">gates de eval offline</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">al merge del PR</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">Canary de serving</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">división de tráfico +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">rollback por métrica de infra</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">Observabilidad</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">monitorear + alertar (sin enforcement)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">costura</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">faltante</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">La costura faltante: gate de calidad por slice → rollback atómico impulsado por calidad del output, no por métricas de infra.</p>

## Etapa ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Capa de manifiesto inmutable. Atribución de fallo por SHA.</span>
  </div>
</div>

### Capacidad 1. Manifiesto de release inmutable con un SHA direccionable por contenido

Qué es: un release no es un archivo de pesos del modelo. Un release es un bundle inmutable de *todo* — artefacto del modelo, prompt template, reglas de routing, versión del dataset, versión del preprocesamiento — direccionado por un solo SHA-256. Dos personas desplegando "el mismo release" deben producir el mismo SHA, o el pipeline se niega.

Por qué importa: sin esto, "¿qué cambio rompió producción?" es incontestable cuando el estado está repartido entre tres sistemas. La caída de Atlassian de abril 2022<sup><a href="#ref-1">[1]</a></sup> tardó doce horas por sitio en recuperarse específicamente porque el estado vivía en sistemas versionados de forma independiente que tenían que coordinarse de vuelta hasta acordar.

Quién lo envía: el campo de canary de serving parcialmente (modelo + routing); los registros de modelos (MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>) parcialmente (solo artefacto del modelo). Casi nadie agrupa el **prompt template** dentro del SHA, que es exactamente el campo que cambia con más frecuencia.

### Capacidad 2. Control de versiones atómico a través de todos los componentes del release

Qué es: el cambio del release A al release B voltea *todo* en una sola instrucción — pesos y prompt y routing y dataset y preprocesamiento — no como cinco ediciones separadas en el dashboard.

Por qué importa: los cambios parciales crean ventanas de comportamiento indefinido. Si el prompt se actualiza pero la regla de routing no, cada request que pegue al nuevo prompt con la clase de routing vieja está en un estado que nadie planeó.

Quién lo envía: nadie completamente. El campo de canary de serving cambia atómicamente la imagen del modelo; el prompt y el routing típicamente viven en otro lado. El swap impulsado por manifiesto es de donde sale la afirmación de rollback atómico de Divinci<sup><a href="#ref-5">[5]</a></sup>.

### Capacidad 3. Paridad de entorno entre training y serving

Qué es: el pipeline de preprocesamiento usado durante la evaluación del gate es el *mismo* preprocesamiento que usa el servidor de producción. Si divergen, cada número offline es una mentira.

Por qué importa: el skew training-serving es uno de los [diez fallos de release](/es/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) sobre los que hemos escrito. El síntoma es "rinde bien en eval, se comporta como un modelo distinto en producción." La cura es registrar el preprocesamiento en el manifiesto y hacer gating contra la versión de preprocesamiento de producción.

Quién lo envía: los frameworks de contenedorización (BentoML, KServe) obtienen crédito parcial al colocalizar el preprocesamiento con el serving. Ninguno de ellos vincula el preprocesamiento al input del gate de eval.

## Etapa ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Spearman ρ por slice vs juez anclado por humanos.</span>
  </div>
</div>

### Capacidad 4. Gate de calidad por slice / por dominio

Qué es: la decisión del gate consume puntuaciones *por slice* — redacción de contratos, interpretación estatutaria, licenciamiento de IP — no un único agregado. Cualquier slice individual que caiga por debajo de su umbral marca el release como `gate_fail`, sin importar cómo se vea el promedio.

Por qué importa: las puntuaciones agregadas lavan las regresiones localizadas. El escrito *Semver Lie* de Tianpan<sup><a href="#ref-3">[3]</a></sup> nombra esto como el modo dominante de fallo de release de LLM de 2026: un modelo que mejora en promedio mientras colapsa silenciosamente en una clase de user journey.

Quién lo envía: **nadie más en 2026**. Las herramientas de eval-CI — Braintrust, Humanloop, Patronus — puntúan contra una sola rúbrica global o una lista plana de tareas. No exponen un umbral por slice ni un override ciego al slice. Aquí es donde los campos primero fallan en encontrarse.

### Capacidad 5. Juez calibrado anclado por humanos (Spearman ρ vs calificaciones humanas)

Qué es: el juez no es un LLM-as-judge genérico. Es un juez LLM cuyo Spearman ρ contra un panel de expertos del dominio se mide y configura por slice. El juez se selecciona porque sus rankings coinciden con los rankings del humano, no porque tenga buena reputación.

Por qué importa: MT-Bench<sup><a href="#ref-6">[6]</a></sup> muestra que GPT-4 como juez está de acuerdo con humanos en >80% en general, con varianza por categoría desde coding (86%) hasta writing (36–44%). El "acuerdo general" esconde los slices donde el juez no es confiable. Calibrar el juez por slice es la única manera honesta de hacer que la puntuación automatizada sea confiable.

Quién lo envía: Braintrust, Humanloop, Patronus ejecutan evaluadores de juez. Ninguno de ellos requiere, expone o persiste una calibración de Spearman anclada por humanos por slice. El pipeline de calibración de Divinci está documentado en [Calibrando el juez de IA](/blog/calibrating-the-ai-judge/).

### Capacidad 6. Ruta de override con justificación escrita obligatoria

Qué es: forzar el override de un fallo de gate está permitido (cold starts, regresiones aceptadas, etc.) pero requiere dos campos — `forceGateOverride: true` Y `overrideReason: "..."`. La razón va al audit trail junto al user ID. Sin overrides anónimos.

Por qué importa: los gates de governance no son una feature de cumplimiento separada; son una propiedad de la propia etapa de gate. El audit trail tiene que responder no solo "¿se usó este override?" sino "¿cuál fue la justificación en ese momento?" — porque el tú-del-futuro necesita leerla.

Quién lo envía: las herramientas de eval-CI tienen flags; ninguna de ellas requiere la justificación como parte estructural del override.

## Etapa ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary al 5% → 25% → 100% con un monitor de calidad en cada paso.</span>
  </div>
</div>

### Capacidad 7. Canary multi-checkpoint con dwell

Qué es: el tráfico se mueve del 0% a producción vía al menos tres checkpoints — típicamente **5% → 25% → 100%** — y se mantiene en cada uno por un tiempo de dwell configurado o un conteo de requests configurado, lo que ocurra *más tarde*. Sin saltos instantáneos de 0%→100%.

Por qué importa: los bugs de cola larga aparecen a escala. Un bug que afecta el 0.3% de las conversaciones es invisible en una eval de 100 prompts y obvio al 5% del tráfico de producción. El dwell es lo que le da al canary tiempo de ver la cola larga.

Quién lo envía: el campo de canary de serving envía esto. AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> documenta un `TerminationWaitInSeconds` por defecto de 600 (diez minutos). KServe, BentoCloud, Seldon y Vertex exponen todos configuraciones similares de canary multi-paso. Esta es la capacidad saturada.

### Capacidad 8. Monitor de calidad del output en cada checkpoint del canary

Qué es: en cada checkpoint, el pipeline revisa tres monitores antes de avanzar — latencia p95, tasa de 5xx, **y** una puntuación de calidad del output calculada por el mismo juez calibrado de la capacidad 5. La latencia y los 5xx solos no alcanzan.

Por qué importa: aquí es donde los campos vuelven a fallar en encontrarse. SageMaker, KServe, Vertex, BentoCloud, Seldon todos vigilan latencia y tasa de error. Ninguno de ellos envía un monitor de calidad del output por checkpoint — porque no tienen un juez calibrado contra el cual puntuar. Las herramientas de eval-CI tienen el juez pero no se sientan sobre el tráfico.

Quién lo envía: nadie completa el puente. La infraestructura de canary con dwell existe en el campo de serving; el juez calibrado existe en el campo de eval-CI; no hemos visto a nadie conectarlos.

### Capacidad 9. Halt automático ante incumplimiento de calidad

Qué es: un checkpoint del canary que falla en calidad del output se detiene automáticamente. La promoción no avanza. No se requiere paginar a un humano para detener el rollout.

Por qué importa: los humanos no están en el loop dentro del horizonte temporal en el que se mueven los rollouts. Para cuando llega un ticket de cliente, el checkpoint del 25% ya terminó y la promoción al 100% ya ocurrió.

Quién lo envía: el campo de canary de serving hace halt sobre métricas de infraestructura. El halt sobre métrica de calidad es la parte que requiere que exista la capacidad 8.

## Etapa ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Replay continuo de trazas → rollback atómico en ~12 s.</span>
  </div>
</div>

### Capacidad 10. Replay continuo de trazas de producción a través del candidato

Qué es: después de que el canary promueve al 100%, el observador sigue corriendo. Muestrea trazas recientes de producción, las replay-ea a través del release *candidato* (ahora activo), las puntúa con el juez calibrado, y emite una puntuación de calidad por minuto. Continuo, no periódico.

Por qué importa: las caídas silenciosas de calidad — el modelo evade, alucina una fecha con confianza, se niega donde no debería — nunca mueven la latencia ni los 5xx. La única señal que recibes para estas es el ticket del cliente, que es la peor señal posible. Un monitor continuo de calidad las captura en minutos de un solo dígito.

Quién lo envía: **nadie.** El campo de observabilidad (Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>) monitorea el output de producción pero no hace enforcement. El campo de canary de serving vigila la infra. El campo de eval-CI no se sienta sobre el tráfico. El loop cerrado — trazas de producción → juez calibrado → enforcement — es la costura faltante.

### Capacidad 11. Rollback atómico en segundos, no en minutos

Qué es: cuando el observador dispara (tres minutos consecutivos por debajo del umbral, digamos), el rollback se activa automáticamente. El rollback re-apunta el routing a `previous_release` desde el manifiesto. Como el release previo era un manifiesto completamente agrupado, cada componente voltea atómicamente. De punta a punta incluyendo drain de requests en vuelo en un servicio de ~100 réplicas: alrededor de 12 segundos<sup><a href="#ref-5">[5]</a></sup>.

Por qué importa: la caída de Cloudflare de junio 2022<sup><a href="#ref-8">[8]</a></sup> tardó 44 minutos en revertirse. La causa no fue el revert en sí — fue que los ingenieros pisaron los reverts de unos a otros porque el estado estaba repartido. El rollback impulsado por manifiesto es de una sola instrucción; no puede tener ese modo de fallo.

Quién lo envía: el campo de canary de serving envía rollback rápido de infraestructura (disparado por alarma, flip blue-green). La diferencia arquitectónica es si el *trigger* es solo de infra o consciente de la calidad (capacidad 10).

### Capacidad 12. Recibo de cumplimiento encadenado por hash y anclable externamente

Qué es: cada decisión de release — register, gate-pass, gate-fail, gate-override, checkpoint-promote, auto-rollback — emite un recibo JSON-con-SHA-256, encadenado por hash al recibo previo para este cliente y al recibo previo para este release. La cadena se ancla externamente en un calendario que el cliente configura.

**Salvedad de pesos abiertos.** Cuando el release está respaldado por un modelo de pesos abiertos (Gemma, Qwen, Llama, Mistral, GPT-OSS), el recibo embebe una [atestación de pesos vindex](/es/compliance/) — una prueba de que los pesos activos al momento de la decisión son los pesos que el manifiesto registró. Cuando el release está respaldado por un modelo de API cerrada (OpenAI, Anthropic, Google vía APIs opacas), el recibo cubre la cadena de decisión pero no puede afirmar procedencia de pesos, porque el proveedor no expone los pesos. El recibo lo dice explícitamente. Este es el límite de lo que es verificable.

Por qué importa: las industrias reguladas obtienen *logs* hoy. La EU AI Act y NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> piden cada vez más *pruebas*. Un recibo encadenado por hash es la diferencia entre "tenemos un log" y "un auditor puede verificar la cadena sin confiar en nuestro log."

Quién lo envía: nadie más. Esta es la parte de la diferenciación que mapea directamente a la [página de compliance](/es/compliance/) existente de Divinci — mismo formato de recibo, extendido a decisiones de release.

## Las 12 capacidades, por campo de plataforma

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matriz de las 12 capacidades por campo de plataforma. Divinci tiene las 12. El campo Eval-CI (Braintrust, Humanloop, Patronus) tiene 5 y 6. El campo Canary de Serving (SageMaker, KServe, BentoCloud, Vertex, Seldon) tiene 1 parcial, 2 parcial, 7, 9 y 11 sobre métricas de infraestructura. El campo Model-Registry (W&B Models, MLflow, LangSmith) tiene 1 parcial y 2 parcial. El campo Observabilidad (Arize, Phoenix, Confident, Deepchecks) tiene 10 en forma solo-monitor. Nadie más tiene 4 gate por slice, 5 juez calibrado anclado por humanos, 8 monitor de calidad del output en canary, 10 replay de trazas en loop cerrado con enforcement, ni 12 recibos encadenados por hash.">
<title>Las 12 capacidades, por campo</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Qué campo envía qué capacidad</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = la envía. ◐ = parcial (solo infra, o solo registro). ✗ = no la envía. Seis capacidades faltan en todos los demás campos.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">Capacidad</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">Eval-CI</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">Serving</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">Registro</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">Observ.</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. SHA de manifiesto inmutable</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. Swap atómico de versión (todos los componentes)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. Paridad de entorno training-serving</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. Gate de calidad por slice / por dominio</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. Juez calibrado anclado por humanos</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. Ruta de override con justificación obligatoria</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. Canary multi-checkpoint con dwell</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. Monitor de calidad del output en cada checkpoint</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. Auto-halt ante incumplimiento de calidad</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. Replay de trazas de producción en loop cerrado</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. Rollback atómico en segundos</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. Recibo de cumplimiento encadenado por hash</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">Capacidades 4, 5, 8, 10, 12 destacadas: estas son las cinco sin ningún otro envío en este scan. El resto se agrupa en un campo u otro.</text>
</svg>
</figure>

El patrón es el punto. Cinco capacidades — **gate por slice, juez calibrado, monitor de calidad del canary, replay en loop cerrado, recibo encadenado por hash** — aparecen como ✗ a través de cada otro campo. Esa es la costura. Las otras siete se distribuyen entre los campos de formas que hacen que cada campo sea internamente coherente pero mutuamente incompleto.

## ¿Qué hace que el QA sea distinto para modelos de lenguaje custom que para software?

Los LLMs no son deterministas, ni siquiera a temperatura cero — el batching y las diferencias de hardware causan variación en el output. Esa única propiedad rompe la mayoría de las suposiciones sobre las que se construyó el QA tradicional:

- **No puedes escribir aserciones `expect(output).toEqual(X)`.** Necesitas una evaluación consciente de la distribución que consuma correlación de rango contra un calificador anclado por humanos, no igualdad contra un fixture. Esto es lo que es la capacidad 5.
- **Un modelo puede pasar un chequeo agregado de calidad mientras falla en un slice.** Por eso la capacidad 4 existe por separado. Si tu eval no puede slicear, no puede atrapar regresiones conscientes del slice.
- **Los fallos de calidad son silenciosos en la capa de infraestructura.** La latencia y los 5xx se mantienen limpios mientras el modelo evade o alucina. Las capacidades 8 y 10 existen porque ningún monitor del lado de la infraestructura puede ver esto.
- **El rollback no es opcional.** Como los modos de fallo son probabilísticos y algunos son silenciosos, la ruta de rollback tiene que ser infraestructura primaria, no un plan de respaldo. La capacidad 11 es lo que hace que "12 segundos" sea alcanzable; la capacidad 2 es lo que lo hace correcto.

Una plataforma de QA y release que no contemple estos cuatro hechos está enviando CI/CD de software determinista con un logo de LLM pegado encima. El mercado hace esto mucho.

## ¿Cómo soportan los audit trails el cumplimiento de IA, en la práctica?

El gap de cumplimiento más común que vemos — cuando un auditor llega seis meses después del despliegue y pregunta "¿qué versión del modelo estaba corriendo el 15 de marzo, y quién aprobó ese release?" — no es "no tenemos logs." Es "tenemos logs en cinco sistemas y los timelines no cuadran."

Un recibo de cumplimiento (capacidad 12) resuelve esto haciendo que el log mismo sea un artefacto portable: encadenado por hash, fuente única, anclable externamente. Un auditor puede verificar la cadena sin confiar en nuestra infraestructura. Esa es la diferencia entre "tenemos registros" y "los registros son demostrables."

Para respaldos de modelos de pesos abiertos, el recibo también incluye una atestación de pesos — una prueba criptográfica de que los pesos activos son los pesos que el manifiesto registró. Esto satisface las exigencias más duras (derecho al olvido del Artículo 17 del GDPR, procedencia de la EU AI Act) porque puedes probar *no solo qué se desplegó* sino *que los pesos subyacentes son los que dicen ser*.

Para respaldos de API cerrada — cuando el modelo se sirve detrás de una API opaca y los pesos no están expuestos — el recibo cubre la cadena de decisión pero no puede afirmar procedencia de pesos. Lo decimos en el recibo explícitamente en lugar de implicar una prueba que no podemos entregar. Es el límite de lo que es verificable cuando el proveedor mantiene los pesos internos.

## Lo que este checklist no resuelve

Tres limitaciones honestas:

**Las capacidades no son checkboxes por su cuenta.** Una plataforma que envía las doce mal es peor que una que envía ocho bien. El checklist es un punto de partida para evaluación, no un scorecard para RFPs de proveedores.

**El snapshot competitivo es de 2026 y va a cambiar.** En seis meses algunos de los ✗ de arriba se voltearán — los competidores leerán postmortems y cerrarán huecos. Si lees este post en 2027, audita las marcas tú mismo antes de creerles.

**Algunas capacidades dependen de otras.** La capacidad 8 (monitor de calidad del canary) requiere la capacidad 5 (juez calibrado). La capacidad 10 (replay de trazas en loop cerrado) requiere ambas. Una plataforma que envía 8 sin 5 está enviando un placebo — el monitor del canary existe pero no está anclado contra nada confiable.

## FAQ

### ¿Cuál es la capacidad de QA más importante para releases de LLMs custom?

Un gate de calidad por slice (capacidad 4) — es decir, que la decisión de release consuma puntuaciones de Spearman por dominio contra un calificador anclado por humanos, no un único agregado global. Las puntuaciones agregadas lavan las regresiones localizadas, y las regresiones localizadas son el modo de fallo de release de LLM dominante de 2026<sup><a href="#ref-3">[3]</a></sup>. Si solo puedes enviar una capacidad de esta lista, envía la 4. Después envía la 5, que es lo que hace que la 4 sea confiable.

### ¿Cómo evalúas una plataforma de QA de LLM sin correrla durante seis meses?

Aplica el checklist de 12 capacidades de arriba a la documentación del proveedor, con dos tests específicos. Primero, pídele al proveedor que te muestre el output del gate *por slice* para uno de sus clientes de referencia — si solo tienen puntuaciones agregadas, no tienen la capacidad 4. Segundo, pregunta qué dispara su auto-rollback — si la respuesta es "latencia, tasa de error y nuestras alarmas," están en el campo de canary de serving y la capacidad 10 falta.

### ¿Cuál es la diferencia entre herramientas de eval-CI y herramientas de release management?

Las herramientas de eval-CI (Braintrust, Humanloop, Patronus) corren evaluadores automáticos al merge del PR y bloquean merges malos. Nunca tocan tráfico en vivo. Las herramientas de release management (esta categoría) poseen el manifiesto de release, el canary, el observador y la ruta de rollback. Eval-CI es *parte de* un workflow de release management pero no es un reemplazo de uno. Muchos equipos envían una de las dos y descubren el hueco cuando una regresión que pasó CI golpea producción silenciosamente.

### ¿Qué tan rápido debería ser el rollback?

Orden de magnitud de segundos, no de minutos. El tiempo medio de rollback en el pipeline de Divinci es de unos 12 segundos — eso es drain de requests en vuelo en un servicio de ~100 réplicas, no el swap del manifiesto en sí, que es sub-segundo. Compara con el incidente de Cloudflare de junio 2022<sup><a href="#ref-8">[8]</a></sup>, que tardó 44 minutos en revertirse porque el estado estaba repartido entre sistemas. La decisión arquitectónica que hace posible segundos-no-minutos es el manifiesto de release agrupado (capacidades 1 y 2).

### ¿Por qué los recibos de cumplimiento importan más que los logs de cumplimiento?

Un log es algo que tú escribiste. Un recibo es algo que un auditor puede verificar sin confiar en ti. La EU AI Act y NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> distinguen cada vez más entre los dos — "documentado" no es lo mismo que "demostrable," y la dirección regulatoria es hacia lo segundo. Un recibo encadenado por hash y anclado externamente es la tecnología disponible más simple para cruzar esa línea.

## Referencias

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>PIR de Atlassian de abril 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "El enfoque acelerado de Restauración 2 tomó aproximadamente 12 horas en restaurar un sitio." Citado para la capacidad 1 — cómo se ve el estado-repartido-entre-sistemas a escala.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Registros de W&amp;B Models / MLflow.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> y <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. El lado solo-artefacto-del-modelo de la capacidad 1. Ninguno envía registro de prompt templates.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (abril 2026). Nombra el modo de fallo de regresión consciente del slice como el patrón dominante de 2026. Compañero: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Ancla para la capacidad 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> y <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. <code>TerminationWaitInSeconds</code> por defecto de 600 (diez minutos), máximo 1800 (treinta minutos). El canary estándar por métrica de infraestructura con el que el post contrasta en las capacidades 8 y 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interno — flip de routing atómico vía manifiesto de release.</strong> El tiempo de rollback de ~12 segundos es drain de requests en vuelo en un servicio de ~100 réplicas; el swap del manifiesto en sí es sub-segundo. El número viene de nuestro propio servicio, no de un benchmark. La arquitectura que lo hace posible es el manifiesto agrupado de la capacidad 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Varianza por categoría de LLM-as-judge.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% de acuerdo general GPT-4-vs-humano, con varianza por categoría desde coding (86%) hasta writing (36–44%). Ancla para la capacidad 5 — por qué un juez calibrado tiene que ser por slice.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Comparación del campo de observabilidad.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">comparación de herramientas de observabilidad 2026 de Confident AI</a>. Todos envían monitoreo y alertas; ninguno hace cumplir rollback. Ancla para el marco de "monitor sin enforcement" de la capacidad 10.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Caída de Cloudflare de junio 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Causa raíz encontrada y entendida. Comienza el trabajo para revertir el cambio problemático… 07:42: El último de los reverts se ha completado." 44 minutos desde "sabemos qué revertir" hasta el revert completo, en parte porque los ingenieros pisaron los reverts de unos a otros. Ancla para la capacidad 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — las cuatro funciones core a las que mapea la capacidad 12. Más los requisitos de procedencia de la EU AI Act en <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Ancla para la capacidad 12.
</li>
</ol>

---

*Próximo en esta serie:* **Validando y desplegando LMs custom en campos regulados.** El checklist de capacidades de arriba es genérico. El próximo post es específico: la EU AI Act, el Artículo 17 del GDPR, HIPAA y NIST AI RMF — qué pide cada uno de un proceso de release, qué capacidades de arriba cubren qué requisito, y dónde la división entre pesos abiertos y pesos cerrados realmente cambia la historia del cumplimiento.
