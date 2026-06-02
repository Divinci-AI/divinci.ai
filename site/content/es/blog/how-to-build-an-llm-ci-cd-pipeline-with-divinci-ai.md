+++
title = "Cómo construir un pipeline de CI/CD para LLM con Divinci AI"
description = "Pipeline LLM en cuatro etapas: gates de Spearman por slice, canary sobre calidad de output, rollback atómico en 12s, recibo de cumplimiento por decisión."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Canary", "Rollback", "Evaluation Gates"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-veo31.webm"
hero_video_poster = "/images/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-hero-poster.webp"
reading_time = 10
summary = "Un pipeline tradicional de CI/CD asume que el artefacto es determinista. Un modelo de lenguaje no lo es. Este recorre el pipeline que nosotros enviamos en Divinci AI — gates de Spearman conscientes del slice contra un juez anclado por humanos, canary que observa la calidad del output (no solo el p95), rollback atómico en aproximadamente doce segundos, y un recibo de release encadenado por hash para cada decisión (con una atestación de pesos vIndex embebida cuando el modelo es de pesos abiertos). Tres de esas son cosas que ninguna otra herramienta de release para LLM envía en 2026."
+++

*Notas del Ciclo de Release — Parte I*

---

La primera vez que intentamos enviar un LLM por un pipeline de CI/CD normal, el build salió verde, el deploy tuvo éxito, y el equipo de soporte al cliente empezó a abrir tickets en siete minutos.

Nada se había "roto." Los 4.200 tests de integración pasaron. La latencia no había cambiado. La tasa de 200 OK se mantenía estable. Pero en una clase específica de preguntas del dominio legal, el nuevo modelo había empezado silenciosamente a evadir — negándose a comprometerse con una respuesta que la versión anterior había contestado correctamente. Ningún test lo capturó porque todavía no habíamos escrito uno.

Hicimos rollback, y el rollback en sí mismo fue un evento. El artefacto del modelo vivía en tres lugares, el prompt template vivía en un cuarto, las reglas de routing vivían en un quinto, y ninguno sabía nada de los otros. Tardamos algo más de dos horas en volver al estado bueno previo. Los clientes que recibieron una respuesta evasiva durante esa ventana no quedaron impresionados.

Ese incidente es la razón por la que existe este pipeline. Lo que sigue es el real que usamos para enviar nuestros propios releases, y el que exponemos a través de la API de Divinci para los clientes que envían los suyos. Tiene cuatro etapas — **register, gate, roll, observe** — y cada paso tiene una ruta de rollback que no depende de que un humano esté despierto.

## Las cuatro etapas

<img src="/images/charts/divinci-cicd-pipeline.svg" alt="Diagrama de pipeline de CI/CD en cuatro etapas para LLMs. Etapa 1 Register: el artefacto del modelo, el prompt template, las reglas de routing y la versión del dataset se empaquetan en un único manifiesto de release firmado. Etapa 2 Gate: evaluación automática contra la suite de scored-QA, con un gate de umbral Spearman por categoría. Etapa 3 Roll: rampa de tráfico canary del 5 al 25 al 100 por ciento con chequeos de salud en cada paso. Etapa 4 Observe: monitor de drift, monitor de calidad de output y auto-rollback al superar el umbral. Cada etapa emite una entrada en el audit-log firmada con el SHA del release." width="900" height="380" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

Las etapas son intencionalmente rígidas. Cada release pasa por cada etapa en este orden. Una ruta de "hotfix" que se salte la evaluación no existe — intentamos eso una vez.

### Etapa 1 — Register

Un release **no** es un archivo de pesos del modelo. Un release es un manifiesto inmutable que empaqueta:

- El artefacto del modelo (repo de HF + commit SHA, o un patch de vIndex)
- El prompt template (cada variable, cada system message)
- Las reglas de routing (qué clase de tráfico aterriza en qué versión)
- La versión del dataset usada para calcular los umbrales del gate
- El SHA del release anterior, para que el rollback sea inequívoco

```bash
curl -X POST https://api.divinci.ai/v1/releases \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{
    "model_ref": "Divinci-AI/gemma-4-e2b@a7c91f",
    "prompt_template_ref": "templates/legal-qa@v14",
    "routing": { "domain": "legal" },
    "dataset_version": "scored-qa-medical-v3",
    "previous_release": "rel_8f72b1"
  }'
# → { "release_id": "rel_a01c66", "manifest_sha256": "9abaeaf6..." }
```

El SHA del manifiesto es el único handle que cualquiera en el pipeline llega a usar. Si dos personas despliegan lo que creen que es el mismo release y los SHAs difieren, el pipeline rechaza el deploy. Ya hemos cazado dos bugs con esta regla.

### Etapa 2 — Gate

El gate es la parte que la mayoría de los pipelines de CI hacen mal. Las heurísticas tipo Lighthouse — perplejidad, BLEU, ROUGE — dejarán pasar una regresión si la regresión está concentrada en un dominio. Las puntuaciones agregadas la diluyen.

El gate de Divinci ejecuta la suite de scored-QA con la que se registró el manifiesto del release, y aplica un umbral Spearman **por categoría**:

<img src="/images/charts/divinci-cicd-gate-thresholds.svg" alt="Gráfico de barras que muestra la correlación de rangos Spearman por categoría entre el modelo candidato y el evaluador calibrado anclado por humanos, a lo largo de seis subdominios legales. Redacción de contratos en 0,71, interpretación estatutaria en 0,74, resumen de casos en 0,69, cumplimiento regulatorio en 0,66, análisis jurisdiccional en 0,62 y licencias de IP en 0,41. La línea discontinua del umbral del gate está en 0,65. Licencias de IP cae por debajo de la línea, disparando un fallo Gate-2. La media agregada de las seis categorías es 0,64, justo por debajo del umbral, pero la vista por categoría muestra exactamente qué subdominio retrocedió." width="900" height="420" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

El release del gráfico anterior pasaría un gate agregado (media 0,64 es "lo bastante cerca"). Falla el gate de Divinci porque licencias de IP se desploma de un 0,68 previo a 0,41 — exactamente el tipo de regresión localizada que un notebook nunca atrapa.

<aside style="background: rgba(184, 160, 128, 0.08); border-left: 3px solid #b8a080; padding: 0.7rem 1rem; margin: 0.8rem 0 1.5rem; font-size: 0.88rem; color: #4a4030;">
  <strong style="color: #1e3a2b;">Sobre los números del gráfico:</strong> los valores por subdominio son <em>ilustrativos de la forma</em>, no mediciones de un estudio publicado. Ningún paper público reporta Spearman ρ juez-vs-humano desglosado por estas áreas específicas de práctica legal. Para una adyacencia aproximada véase <a href="https://arxiv.org/abs/2308.11462" target="_blank" rel="noopener">LegalBench (Guha et al., 2023)</a> — precisión por tarea a lo largo de seis tipos de razonamiento legal — y <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">MT-Bench (Zheng et al., 2023)</a>, que reporta ~80% de concordancia global GPT-4-vs-humano con amplia varianza por categoría. Los clientes que corren su propia suite de scored-QA producen números reales para sus propios slices; la forma del gráfico es lo que la API expondría.
</aside>

No inventamos el gating consciente del slice por diversión. Es el modo de fallo nombrado directamente en la cosecha actual de postmortems de LLM. El writeup de Tianpan *"The Semver Lie"*<sup><a href="#ref-6">[6]</a></sup> describe un cambio de prompt que "pasó la revisión de código, se desplegó sin eval gates, llegó a producción sin A/B por usuario, y no disparó ningún rollback automático." Lo que hizo que ese incidente fuera catastrófico en lugar de meramente molesto fue que la regresión estaba concentrada en un slice — una única clase de user-journey — mientras el agregado se mantenía. Cada herramienta de release de LLM que estudiamos en 2026 o bien hace gate sobre una única puntuación global, o no hace gate en absoluto. Ninguna trocea el gate.

Un fallo de gate **no** es una advertencia suave. El release_id se marca como `gate_fail`, el manifiesto se archiva, y ningún comando de deploy lo aceptará. Releases de arranque en frío — un modelo completamente nuevo sin Spearman histórico contra el que comparar — pasan por una ruta única `--force-gate-override` que exige una justificación escrita; la justificación, el ID de usuario y un `gate_override_sha256` van directamente al audit trail. El override existe porque hay situaciones legítimas para él; el audit trail existe porque tu yo futuro necesita poder leer la justificación.

### Etapa 3 — Roll

Un canary en Divinci significa tres checkpoints: **5%, 25%, 100%**. En cada checkpoint, el pipeline retiene durante el dwell time configurado o el conteo de requests configurado, lo que ocurra después. Por defecto son 4 minutos / 1.000 requests al 5%, 15 minutos / 10.000 requests al 25%.

En cada checkpoint, tres monitores deben aguantar:

1. **Latencia p95** dentro de 1,2× la p95 del release anterior
2. **Tasa de 5xx** dentro de 1,5× la tasa del release anterior
3. **Monitor de calidad de output**: una reproducción continua de trazas recientes de producción a través del release candidato, puntuadas por el mismo juez calibrado que alimentó la Etapa 2

El tercero es el que ningún otro pipeline de release envía. SageMaker, KServe, BentoML, Vertex AI — todos vigilan latencia y tasa de error. Ninguno puntúa los outputs del candidato contra las preguntas *reales* que producción está haciendo ahora mismo. El candidato recibe los mismos prompts que el release activo acaba de recibir, los ejecuta en un mirror del 5%, y medimos la Spearman ρ de las respuestas del candidato contra el evaluador calibrado. La tasa de 5xx puede mantenerse limpia mientras el modelo silenciosamente evade, rechaza o alucina. Hemos visto esto ocurrir. El monitor de replay de trazas es lo que lo atrapa.

El conjunto de replay está acotado — limitamos a 50 trazas recientes por slice por checkpoint para que el coste sea predecible. La evaluación tarda unos 90 segundos al 5% de tráfico. Más lento que un canary plano por porcentaje, más rápido que esperar a que un cliente abra un ticket.

```bash
# El comando roll es fire-and-forget. El pipeline se sostiene a sí mismo.
curl -X POST https://api.divinci.ai/v1/releases/rel_a01c66/roll \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{ "strategy": "canary", "dwell_5pct_seconds": 240, "dwell_25pct_seconds": 900 }'
# → { "rollout_id": "rol_b3e2", "next_checkpoint_at": "2026-05-26T09:04:00Z" }
```

### Etapa 4 — Observe, rollback y el recibo

Esta es la etapa que justifica la existencia del pipeline.

El observador corre continuamente después de que el rollout completa. Calcula una puntuación de calidad de output por minuto sobre una muestra rodante del 5% de replay de trazas. Si la puntuación cae por debajo del umbral de rollback (por defecto: 0,85 del umbral del gate, así que 0,55 si el gate era 0,65) durante tres minutos consecutivos, el rollback se dispara automáticamente. Sin página, sin humano, sin debate.

El rollback en sí mismo es una única instrucción: re-apuntar el routing al `previous_release` del manifiesto. Porque el release anterior era un manifiesto completamente empaquetado, cada componente — pesos, prompt, routing, dataset — vuelca atómicamente.

Luego se dispara el recibo.

Cada decisión de release — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback — emite un **recibo de release**: un artefacto JSON-con-SHA-256, encadenado por hash al recibo anterior de este cliente y al recibo anterior de este release, anclado externamente en una programación que el cliente configura.

Cuando el release está respaldado por un **modelo de pesos abiertos** — Gemma, Qwen, Llama, Mistral, GPT-OSS, cualquier cosa donde los pesos sean direccionables y editables — el recibo embebe una [atestación de vIndex](/es/compliance/): una prueba criptográfica de que los pesos activos en el momento de la decisión son los pesos que el manifiesto registró. Esa es la ruta que satisface las preguntas más duras de compliance (Artículo 17 del GDPR derecho de borrado, procedencia del EU AI Act) porque puedes demostrar no solo *qué fue desplegado* sino *que los pesos subyacentes son lo que dicen ser*.

Cuando el release está respaldado por un **modelo de pesos cerrados** — OpenAI, Anthropic, Google, cualquier cosa servida solo vía una API opaca — el recibo sigue cubriendo la cadena de decisión (qué manifiesto, qué resultado de gate, qué lectura de monitor, qué usuario disparó qué acción) pero no puede atestar los pesos subyacentes, porque no los podemos ver. Eso no es un límite del pipeline; es un límite de lo que es verificable cuando el proveedor no expone los pesos. Los auditores a quienes les importa esa distinción reciben la respuesta honesta en el propio recibo.

De cualquier modo, los auditores hoy reciben logs. Con este pipeline, reciben *pruebas* de todo lo que es realmente demostrable. No vimos a nadie más en el mercado enviando esto. Esperamos que lo hagan — los plazos del EU AI Act lo hacen eventualmente inevitable. Nosotros elegimos enviarlo ahora.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Gráfico de barras horizontales del tiempo de rollback, escala logarítmica en minutos. Outage de Atlassian de abril 2022: 720 minutos (12 horas) de restauración por sitio. Outage de Cloudflare del 21 de junio 2022: 44 minutos para revertir. Umbral DORA de recuperación de deploy fallido para elite-performer: menos de 60 minutos. Espera por defecto de terminación de canary deployment-guardrail de AWS SageMaker: 10 minutos. Flip de routing automatizado de Divinci vía release manifest: 12 segundos. Cada etiqueta de barra es un enlace a su fuente numerada en las referencias abajo." style="width: 100%; height: auto; display: block;">
  <title>Tiempo de rollback — números medidos de fuentes primarias</title>
  <rect width="900" height="380" fill="#faf8f5"/>
  <text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Tiempo de rollback — números medidos de fuentes primarias</text>
  <text x="40" y="56" font-size="12" fill="#6b5d4f">Incidentes específicos y límites documentados por la plataforma, no estimaciones. Cada barra enlaza a su fuente en las referencias abajo.</text>
  <g stroke="#d4c8b0" font-size="10" fill="#8a7d68">
    <line x1="280" y1="320" x2="280" y2="80" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="860" y2="320" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="280" y2="325"/><text x="280" y="340" text-anchor="middle">0,1</text>
    <line x1="406" y1="320" x2="406" y2="325"/><text x="406" y="340" text-anchor="middle">1</text>
    <line x1="531" y1="320" x2="531" y2="325"/><text x="531" y="340" text-anchor="middle">10</text>
    <line x1="657" y1="320" x2="657" y2="325"/><text x="657" y="340" text-anchor="middle">100</text>
    <line x1="782" y1="320" x2="782" y2="325"/><text x="782" y="340" text-anchor="middle">1000</text>
    <line x1="406" y1="320" x2="406" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="531" y1="320" x2="531" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="657" y1="320" x2="657" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="782" y1="320" x2="782" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
  </g>
  <text x="570" y="360" font-size="11" fill="#6b5d4f" text-anchor="middle">minutos (escala log)</text>
  <g>
    <text x="272" y="103" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Atlassian, abr 2022</text>
    <text x="272" y="117" text-anchor="end" font-size="10" fill="#6b5d4f">restauración por sitio</text>
    <rect x="280" y="91" width="484" height="32" fill="#a04848" rx="2"/>
    <text x="774" y="113" font-size="11" font-weight="600" fill="#1e3a2b">720 min<a href="#ref-1"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[1]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="158" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Cloudflare, jun 2022</text>
    <text x="272" y="172" text-anchor="end" font-size="10" fill="#6b5d4f">revertir config</text>
    <rect x="280" y="146" width="332" height="32" fill="#c87b3c" rx="2"/>
    <text x="622" y="168" font-size="11" font-weight="600" fill="#1e3a2b">44 min<a href="#ref-2"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[2]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="213" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">DORA elite</text>
    <text x="272" y="227" text-anchor="end" font-size="10" fill="#6b5d4f">umbral performer</text>
    <rect x="280" y="201" width="349" height="32" fill="#b8a080" rx="2" opacity="0.6"/>
    <text x="639" y="223" font-size="11" font-weight="600" fill="#1e3a2b">&lt; 60 min<a href="#ref-3"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[3]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="268" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">AWS SageMaker</text>
    <text x="272" y="282" text-anchor="end" font-size="10" fill="#6b5d4f">espera de terminación por defecto</text>
    <rect x="280" y="256" width="251" height="32" fill="#7a9580" rx="2"/>
    <text x="541" y="278" font-size="11" font-weight="600" fill="#1e3a2b">10 min<a href="#ref-4"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[4]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="320" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="700">Divinci automatizado</text>
    <text x="272" y="334" text-anchor="end" font-size="10" fill="#2d5a4f">flip de routing vía manifiesto</text>
    <line x1="280" y1="328" x2="318" y2="328" stroke="#2d5a4f" stroke-width="14" stroke-linecap="butt"/>
    <text x="328" y="332" font-size="11" font-weight="700" fill="#2d5a4f">12 s<a href="#ref-5"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[5]</tspan></a></text>
  </g>
</svg>
</figure>

Estos no son nuestros números — son números publicados de fuentes primarias provenientes de postmortems reales, documentación de plataformas y el framework DORA. El contraste es lo que motiva el diseño de Divinci. El outage de Atlassian de abril 2022<sup><a href="#ref-1">[1]</a></sup> tardó doce horas por sitio porque el estado estaba esparcido entre múltiples sistemas que tenían que ser coordinados de vuelta al acuerdo. El outage de Cloudflare de junio 2022<sup><a href="#ref-2">[2]</a></sup> tardó cuarenta y cuatro minutos en revertirse porque, en sus propias palabras, los ingenieros se pisaban entre sí los reverts. Las deployment guardrails de canary de AWS SageMaker<sup><a href="#ref-4">[4]</a></sup> documentan una espera de terminación por defecto de diez minutos antes de que el rollback complete por completo. El umbral elite de DORA<sup><a href="#ref-3">[3]</a></sup> para recuperación de deploy fallido es "menos de una hora" — esa es la barra que se espera que una org de alto rendimiento supere, no el techo.

Doce segundos tampoco es un número mágico. Es el tiempo requerido para que la capa de routing drene los requests en vuelo, intercambie el manifiesto activo y confirme el nuevo estado entre regiones. La parte lenta es el drenaje en vuelo. No hay ruta más rápida que no descarte respuestas a mitad de generación.

## Qué es esto, que otras herramientas de release de LLM no son

Estudiamos otras doce herramientas en 2026 antes de construir esta — LangSmith Deployment, W&B Models, MLflow, SageMaker Deployment Guardrails, Vertex AI Endpoints, Seldon Core, BentoCloud, KServe, Humanloop, Braintrust, Patronus AI, Arize Phoenix. Se agrupan en dos campamentos que no acaban de encontrarse.

El **campamento de eval-CI** — Braintrust, Humanloop, Patronus — hace gate de merges de PR sobre puntuaciones de eval offline. Nunca tocan el servicio en ejecución. Cuando el modelo está en producción y la calidad cae, alertan; alguien más tiene que hacer el rollback.

El **campamento de serving-canary** — SageMaker Deployment Guardrails, KServe, Vertex AI, BentoCloud, Seldon Core — divide tráfico y hace auto-rollback. Pero todos ellos disparan sobre métricas de infraestructura: latencia p99, tasa de error, alarmas de CloudWatch. Ninguno hace auto-rollback sobre una regresión de calidad. No pueden, porque no tienen un juez corriendo sobre el output de producción.

La costura entre "pasó el eval en el merge del PR" y "canary en vivo puntuado sobre los user journeys que realmente nos importan" es un handoff manual que cada equipo tiene actualmente que salvar por sí mismo. El blog post llama eso el modo de fallo dominante de 2026<sup><a href="#ref-6">[6]</a></sup>. Nosotros lo cerramos. Específicamente:

1. **El gate está troceado.** Spearman ρ por dominio contra un evaluador anclado por humanos, no una única puntuación global. La ceguera al slice es lo que cada otro gate tiene.
2. **El canary observa la calidad del output, no solo el p95.** Replay continuo de trazas a través del candidato, puntuado por el mismo juez que alimentó el gate. Esta es la costura faltante.
3. **Cada decisión emite un recibo de release.** Encadenado por hash, anclable externamente, en el formato JSON-con-SHA-256 que respalda nuestras páginas de compliance. Para respaldos de modelos de pesos abiertos — Gemma, Qwen, Llama, Mistral, GPT-OSS — el recibo embebe una atestación de pesos vIndex para que los auditores puedan demostrar cuáles fueron realmente los pesos en vivo. Para respaldos de API cerrada, el recibo cubre la cadena de decisión pero no reclama procedencia de pesos, porque el proveedor no expone los pesos. De cualquier modo, los auditores reciben pruebas de lo que es realmente demostrable, no solo logs.

Eso es todo. Canary genérico, registry de versiones, rollback por métrica de infra — esos son commodity. No escribimos un canary genérico.

## Lo que esto no resuelve

Tres limitaciones honestas:

**El gate solo es tan bueno como el dataset.** Una suite de scored-QA que no cubre el dominio que un cliente realmente usa no atrapará regresiones en ese dominio. Hemos visto esto dos veces. Las dos veces, el primer movimiento del cliente fue enviar una nueva suite de scored-QA, no cambiar el modelo. Ese es el movimiento correcto.

**El rollback asume que el release anterior era bueno.** Si una regresión ha estado en vivo por tres releases y nadie se dio cuenta, hacer rollback de un release solo te compra un modelo ligeramente menos malo. El audit trail ayuda aquí — puedes hacer rollback a cualquier manifiesto previo por SHA, no solo a N-1.

**Los releases de arranque en frío saltan el canary.** Un modelo completamente nuevo sin tráfico de producción contra el que comparar no puede ser canary-eado de forma significativa. Forzamos en su lugar un shadow deployment de 24 horas, que observa los outputs sin servirlos. Es más lento y menos conveniente. También es la única respuesta honesta.

## La versión más pequeña de esto que puedes correr

Si quieres levantar algo como esto sin usar Divinci, la versión mínima viable es aproximadamente:

1. Un registry que almacene modelo + prompt + routing + dataset como un único artefacto inmutable, direccionado por hash de contenido
2. Un juez calibrado contra un panel anclado por humanos vía Spearman ρ — y una decisión de gate que consulte puntuaciones *por slice*, no solo el agregado
3. Un splitter de tráfico que retenga en checkpoints y consulte un monitor de calidad acotado por frescura — donde el monitor *reproduzca trazas recientes de producción* a través del candidato, no solo muestree sintéticas
4. Una capa de routing cuyo estado pueda ser intercambiado atómicamente — incluyendo el prompt template, no solo los pesos
5. Un audit log que emita un recibo encadenado por hash y anclable externamente para cada decisión de release — más una atestación de pesos embebida cuando el modelo es de pesos abiertos, ya que los releases de API cerrada físicamente no pueden ser atestados a nivel de pesos

La mayoría de los equipos ya tienen (1) y (3). Las partes dolorosas son (2), (4) y (5). La razón por la que Divinci existe es que construimos los cinco para nosotros primero, luego nos dimos cuenta de que todos los demás también iban a necesitarlos.

Si quieres saltarte la construcción, [la referencia de la API está aquí](/es/api/), y los endpoints de release en la sección "Release Management" son toda la superficie de este pipeline. El lado del compliance — cómo lucen esos recibos vIndex y cómo mapean al EU AI Act, Artículo 17 del GDPR, HIPAA y NIST AI RMF — está en [la página de compliance](/es/compliance/). Cada comando en este post es un endpoint real.

## Referencias

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. Del writeup: "El enfoque acelerado de Restauración 2 tardó aproximadamente 12 horas en restaurar un sitio." La restauración completa de 883 sitios de clientes tardó 14 días. El estado esparcido entre infraestructura, backups y validación por sitio empuja el número por sitio a horas en lugar de minutos.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Línea temporal citada textualmente en el post: "06:58: Causa raíz encontrada y comprendida. Comienza el trabajo para revertir el cambio problemático… 07:42: El último de los reverts se ha completado." Cuarenta y cuatro minutos desde "sabemos qué revertir" hasta "el revert está hecho", en parte porque los ingenieros se estaban pisando entre sí los reverts.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. El umbral elite-performer para "tiempo de recuperación de deploy fallido" está documentado como menos de una hora. Los low performers se miden en semanas-a-meses en los reportes históricos de DORA.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a> y la página complementaria <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener"><em>Auto-Rollback Configuration and Monitoring</em></a>. El ejemplo de <code>TerminationWaitInSeconds</code> es 600 (diez minutos); <code>MaximumExecutionTimeoutInSeconds</code> está acotado en 1800 (treinta minutos). El rollback se dispara dentro de la ventana de baking una vez que una alarma se activa: "Si alguna de las alarmas se activa durante el período de baking, entonces SageMaker AI inicia un rollback y todo el tráfico vuelve a la flota azul."
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    Divinci AI — flip de routing atómico vía release manifest. Doce segundos es el tiempo de drenaje en vuelo en un servicio de ~100 réplicas; el intercambio del manifiesto en sí es sub-segundo. El número viene de nuestro propio servicio, no de un benchmark; la arquitectura que lo hace posible es el manifiesto empaquetado descrito arriba (Etapa 1 — Register).
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em> (April 2026)</a>. El writeup nombra el patrón de fallo directamente: "pasó la revisión de código, se desplegó sin eval gates, llegó a producción sin A/B por usuario, y no disparó ningún rollback automático." Un post complementario — <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a> — enumera los campos de slice / journey / por usuario que los postmortems actuales omiten sistemáticamente.
  </li>
</ol>

Una nota sobre lo que no está en este gráfico. El tiempo de `kubectl rollout undo` de Kubernetes está gobernado por tus ajustes de `maxSurge` / `maxUnavailable` y el warm-up de los pods, no por el comando en sí, y no pudimos encontrar una fuente primaria que publique un número medido del modo en que las cuatro fuentes de arriba lo hacen — así que lo dejamos fuera en lugar de rellenarlo con una estimación.

---

*Próximo en esta serie:* **10 fallos de release de CI/CD que hemos cazado en LMs custom, y qué etapa del pipeline atrapa cada uno.** Tres de los diez son regresiones conscientes del slice que un gate agregado habría enviado. Dos más son caídas silenciosas de calidad que un canary por métrica de infra habría promovido. El resto son el tipo de modo de fallo que cada pipeline de release se supone que debe atrapar — los listamos porque vale la pena decir en voz alta cuáles, de hecho, atrapa un pipeline con gate agregado por sí mismo.
