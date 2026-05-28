+++
title = "Cómo diagnosticar fallos de QA en LLMs custom en 7 pasos"
description = "Casi todo 'fallo de QA' no es del modelo — son huecos de eval, mala calibración del juez o skew training-serving. Diagnóstico en 7 pasos que lo prueba."
date = 2026-05-31T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["QA", "Diagnostics", "Postmortems", "LLM Ops", "Evaluation", "Debugging"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-diagnose-custom-llm-qa-failures-in-7-steps-veo31.webm"
hero_video_poster = "/images/how-to-diagnose-custom-llm-qa-failures-in-7-steps-hero-poster.webp"
reading_time = 11
summary = "Cuando una alerta de QA se dispara en un LLM custom, el reflejo natural es culpar al modelo. En todos los rollouts que hemos ejecutado, el modelo es la respuesta correcta aproximadamente una vez de cada siete. Las otras seis veces, el bug está en el eval, en el juez, en el SHA del prompt, en el pipeline de preprocessing, en la versión del dataset o en el índice de retrieval. Este post es el árbol diagnóstico que de verdad recorremos — en orden, con la llamada de API exacta que responde a cada rama."
+++

*Notas del Ciclo de Release — Parte VI*

---

Una suite de scored-QA empezó a marcar el modelo de Q&A médico de un cliente. El número principal — calidad agregada en todos los slices — bajó 6 puntos de la noche a la mañana. El equipo pasó dos días depurando el modelo. Re-ejecutaron fine-tunes. Hicieron rollback al release anterior. Los números no se movieron.

La mañana del tercer día, alguien notó que la suite de eval había sido actualizada la misma noche en que empezó la regresión. Se habían añadido tres nuevos prompts de dosificación pediátrica al test set, y el modelo nunca había visto dosificación pediátrica en entrenamiento. El "fallo de QA" no era una regresión del modelo. Era un evento de cobertura de slice: el eval empezó a preguntar sobre algo que el modelo nunca se suponía que supiera.

A lo largo de nuestros rollouts con clientes, este es el patrón dominante. **Una alerta de "fallo de QA" es el síntoma. La causa es el modelo aproximadamente una vez de cada siete.** Las otras seis veces, el bug está en algún lugar aguas arriba: en el diseño del eval, en la calibración del juez, en el SHA del prompt, en el pipeline de preprocessing, en la versión del dataset o en el índice de retrieval. Cada una de esas clases de bug se ve idéntica desde la alerta — un número bajó — pero tiene una corrección completamente distinta.

Este post es el árbol diagnóstico que recorremos en orden cuando se dispara una alerta. Seis pasos que descartan causas no-modelo, antes de que el séptimo paso considere al modelo en sí. Cada paso tiene una llamada de API o consulta concreta que lo responde. Para cuando hayas completado los seis, o sabes exactamente qué arreglar, o te has ganado el derecho a mirar al modelo.

## El árbol de decisión

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Árbol de decisión diagnóstico para una alerta de fallo de QA. El paso 1 pregunta si el eval cubre este slice (si no, la alerta es un hueco de cobertura de eval). El paso 2 pregunta si el juez está calibrado contra humanos en este slice (si no, la alerta es mala calibración del juez). El paso 3 pregunta si el SHA del prompt template coincide con producción (si no, la alerta es drift de prompt). El paso 4 pregunta si el preprocessing coincide con producción (si no, la alerta es skew entrenamiento-serving). El paso 5 pregunta si el SHA del dataset coincide con producción (si no, la alerta es drift del dataset). El paso 6 pregunta si la versión del índice de retrieval coincide con producción (si no, la alerta es drift del índice RAG). Solo después de que los seis descartan una causa no-modelo, el paso 7 concluye que esto es realmente una regresión del modelo por slice.">
<title>El árbol diagnóstico de 7 pasos</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Cuando se dispara una alerta de QA, baja por el árbol — no entres al modelo</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">Seis pasos descartan causas no-modelo. Solo el séptimo culpa al modelo.</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  Se dispara la alerta de QA</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">¿El eval cubre este slice?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ si NO: hueco de cobertura de eval. Actualiza la suite, re-testea.</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">¿El juez está calibrado con humanos en este slice?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ si NO: mala calibración del juez. Recalibra ρ. Re-evalúa.</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">¿El SHA del prompt template coincide con producción?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ si NO: drift de prompt. Re-registra el manifiesto.</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">¿El pipeline de preprocessing coincide con producción?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ si NO: skew entrenamiento-serving. Fija el SHA de preprocess.</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">¿El SHA del dataset coincide con producción?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ si NO: drift del dataset. Re-registra con el SHA correcto.</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">¿Coincide el SHA del índice de retrieval?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ si NO: drift del índice RAG.</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">Si los 6 pasan:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">regresión real del modelo por slice.</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">Commit. Rollback. Reentrena.</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">Empíricamente el modelo</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">es la respuesta correcta</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">en aproximadamente 1 alerta de cada 7.</text>
</svg>
</figure>

El árbol es secuencial porque los pasos van de baratos a caros. El paso 1 es un `git diff` de la suite de eval; el paso 7 es un ciclo de fine-tune. Quieres gastar diez minutos en cada uno de los seis chequeos baratos antes de gastar una semana en el caro.

## Paso 1 — ¿El eval cubría este slice?

**El síntoma.** La calidad agregada baja, pero el desglose por slice muestra un slice desplomándose mientras los demás están planos. O — más confusamente — *cada* slice baja ligeramente, todos en cantidades similares.

**El diagnóstico.** Haz diff del SHA del manifiesto de la suite de eval contra el del release anterior. Si la suite de eval cambió y tú no cambiaste el modelo, la regresión está en el eval, no en el modelo.

```bash
# Compara el SHA del manifiesto de la suite de eval entre releases
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# ¿Diferente? Tu eval cambió. Audita qué se añadió.
```

**El arreglo.** O bien revierte el cambio de la suite de eval (si fue involuntario), o amplía la cobertura de entrenamiento para igualar al nuevo eval (si el nuevo slice es una preocupación real de producción). No envíes un fix de regresión de modelo para un problema de cobertura de eval — empeorarás el modelo en lo que de hecho solía hacer bien.

**Dónde se esconde esto en nuestro pipeline.** [Etapa 1 — Register](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) fija el SHA de la suite de eval dentro del manifiesto del release. El diagnóstico anterior es simplemente diffear dos manifiestos. La razón por la que el bug le costó dos días al equipo de Q&A médico es que no tenían diff a nivel de manifiesto — estaban comparando checkpoints del modelo, no manifiestos de release.

## Paso 2 — ¿El juez está calibrado con humanos en este slice?

**El síntoma.** Un slice que es *nuevo* en la suite de eval puntúa pobremente, pero la revisión humana de los outputs del modelo en ese slice los valora como aceptables. El juez piensa que el modelo está fallando; los humanos no.

**El diagnóstico.** Calcula la ρ de Spearman entre las calificaciones del juez LLM y una pequeña muestra valorada por humanos (50 ítems) en el slice que falla. Si ρ &lt; 0.4, el juez *no está midiendo* lo que los humanos miden en este slice.

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**El arreglo.** O bien selecciona un modelo juez distinto para este slice, o usa una cadena de jueces con un árbitro. MT-Bench<sup><a href="#ref-1">[1]</a></sup> muestra que GPT-4-como-juez coincide con humanos &gt;80% en promedio pero con varianza por categoría desde 86% (coding) hasta 36–44% (writing/humanities). La varianza es la cifra operativa; "bueno en promedio" oculta slices donde el juez se equivoca.

**Dónde se esconde esto en nuestro pipeline.** [Etapa 2 — Gate](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) exige un juez calibrado por slice. El post [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/) documenta el procedimiento. Si el slice se añadió al eval sin un paso de calibración, tienes un gate estructuralmente no confiable.

## Paso 3 — ¿El SHA del prompt template coincide con producción?

**El síntoma.** La calidad baja pero el model_ref y el dataset_ref están sin cambios. Nada sobre el entrenamiento cambió. El modelo es el mismo modelo. Y sin embargo.

**El diagnóstico.** Compara el SHA de `prompt_template_ref` en el manifiesto del release que falla contra el del release anterior. Una edición de 38 caracteres a un system prompt que "mejora la concisión" puede cambiar el comportamiento downstream más que un retraining completo.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# ¿Diferente? Saca el diff. Míralo con cuidado.
```

**El arreglo.** Trata los prompts como código. El [post de 10 fallos de release](/es/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) cubre el modo de fallo de edición en dashboard — el postmortem *Semver Lie* de Tianpan<sup><a href="#ref-2">[2]</a></sup> nombra esto como el patrón de fallo dominante de 2026. Si puedes probar que el prompt cambió, encontraste tu bug.

## Paso 4 — ¿El pipeline de preprocessing coincide con producción?

**El síntoma.** El modelo pasa el eval localmente. El mismo modelo falla el mismo eval en producción. Mismo model_ref, mismo prompt, mismo dataset.

**El diagnóstico.** Saca el SHA de `preprocessing_ref` del manifiesto de producción y verifica que el eval se ejecutó con el mismo. El caso clásico: el entrenamiento normaliza espacios en blanco y pasa a minúsculas; producción no. El eval corrió a través del preprocessing de producción; todo verificó. Hasta que alguien actualizó el preprocessing solo en un lado.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# Compara con el preprocessing que tu arnés de entrenamiento/eval realmente usó.
```

**El arreglo.** Containeriza el preprocessing como un artefacto versionado. Referéncialo desde el manifiesto. Niégate a desplegar si el SHA de preprocessing del gate difiere del de producción.

## Paso 5 — ¿El SHA del dataset coincide con producción?

**El síntoma.** Las puntuaciones del gate-eval del release que falla son distintas de las puntuaciones del gate-eval del *mismo* modelo el día anterior.

**El diagnóstico.** Haz diff del campo `dataset_version` entre los dos releases. La suite de eval se quedó con el mismo nombre, pero el contenido del dataset se actualizó y re-etiquetó. Mismo nombre, distinto SHA, distintas puntuaciones.

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**El arreglo.** Aplica content-hash a tus datasets. El nombre del dataset no es una versión; el SHA sí.

## Paso 6 — ¿El SHA del índice de retrieval coincide con producción?

**El síntoma.** Solo para cargas de trabajo RAG. La calidad baja en preguntas que dependen del contexto recuperado. Las preguntas de respuesta directa están sin cambios.

**El diagnóstico.** Saca el SHA de `retrieval_index_ref` del manifiesto. Compáralo contra el índice de retrieval de la evaluación del gate. El índice RAG se actualizó de la noche a la mañana (una nueva corrida de ingestión); la evaluación del gate cacheó un retrieval más viejo; el canary de producción usó el nuevo.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**El arreglo.** Fija el SHA del índice de retrieval dentro del manifiesto, exactamente como fijamos el preprocessing. La cadencia automatizada de rotación de índices de [AutoRAG](/es/autorag/) hace que esto sea especialmente valioso de chequear — el índice *se va a* actualizar sobre ti lo hayas autorizado o no, si no lo estás fijando.

## Paso 7 — El modelo en sí, por fin

Seis pasos adentro. El eval cubre el slice. El juez está calibrado. El SHA del prompt coincide. El preprocessing coincide. El dataset coincide. El índice de retrieval coincide.

Ahora — y solo ahora — te has ganado el derecho a mirar al modelo.

El diagnóstico para este paso es una comparación de Spearman por slice contra el release anterior, con ambos releases evaluados contra el *mismo* dataset, preprocessing y retrieval anclados por manifiesto. El número que produces es una señal limpia: una regresión real por slice, sin confundidores aguas arriba.

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

Si el delta confirma una regresión real: el [auto-rollback](/es/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) se dispara (si no lo invocaste ya manualmente), y el modelo que falla se reentrena contra un corpus de cobertura de slice ampliada. Si el gate que promovió este release se perdió el slice en primer lugar, [el gate también es el bug](/es/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — capacidad 4 ausente de tu pipeline de release.

## Cómo se ve realmente la distribución

El marco de "1 de cada 7" anterior no era un recurso retórico. Es aproximadamente la distribución que vemos a lo largo de los rollouts con clientes. De cada siete alertas de QA:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Gráfico circular de la distribución de causas raíz para alertas de QA. El hueco de cobertura de eval representa aproximadamente el 32 por ciento. La mala calibración del juez aproximadamente el 18 por ciento. El drift de prompt aproximadamente el 16 por ciento. El skew de preprocessing aproximadamente el 12 por ciento. El drift de dataset aproximadamente el 7 por ciento. El drift del índice RAG aproximadamente el 5 por ciento. La regresión real del modelo aproximadamente el 10 por ciento. Observación interna a lo largo de rollouts con clientes; no de un benchmark controlado.">
<title>Distribución de causas raíz de alertas de QA</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Dónde estaba el bug en realidad — a lo largo de rollouts con clientes</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Observación interna, no un benchmark controlado. El modelo es la respuesta correcta aproximadamente una vez cada siete alertas.</text>
<g transform="translate(220, 230)">
<path d="M 0 -120 A 120 120 0 0 1 113.7 -38.3 L 0 0 Z" fill="#2d5a4f"/>
<path d="M 113.7 -38.3 A 120 120 0 0 1 88.3 81.4 L 0 0 Z" fill="#7a9580"/>
<path d="M 88.3 81.4 A 120 120 0 0 1 -29.7 116.3 L 0 0 Z" fill="#b8a080"/>
<path d="M -29.7 116.3 A 120 120 0 0 1 -113.7 -38.3 L 0 0 Z" fill="#c87b3c"/>
<path d="M -113.7 -38.3 A 120 120 0 0 1 -101.1 -64.7 L 0 0 Z" fill="#d4c8b0"/>
<path d="M -101.1 -64.7 A 120 120 0 0 1 -75.6 -93.2 L 0 0 Z" fill="#a04848"/>
<path d="M -75.6 -93.2 A 120 120 0 0 1 0 -120 L 0 0 Z" fill="#1e3a2b"/>
</g>
<g font-size="11" fill="#1e3a2b">
<rect x="500" y="100" width="14" height="14" fill="#2d5a4f"/>
<text x="522" y="112" font-weight="600">1.  Hueco de cobertura de eval</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  Mala calibración del juez</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  Drift de prompt</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  Skew de preprocessing</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  Regresión real del modelo</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  Drift de dataset</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  Drift del índice RAG</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">Los pasos 1+2 solos explican la mitad de las alertas. Camina el eval antes de caminar el modelo.</text>
</svg>
</figure>

Los dos slices más grandes son el *hueco de cobertura de eval* y la *mala calibración del juez*. Juntos representan la mitad de las alertas de QA. Ninguno de los dos es un problema del modelo. Ambos son problemas de cómo mides al modelo.

## Lo que esto no resuelve

Tres limitaciones honestas:

**La distribución es la nuestra, no la tuya.** Los porcentajes anteriores vienen de nuestra cohorte de clientes y del tooling de nuestro pipeline. Si ejecutas un tipo distinto de workload — pesadamente multi-modal, pesadamente orquestado por agentes, pesadamente generativo single-shot — tu distribución se verá distinta. El orden diagnóstico debería seguir sosteniéndose; los números detrás de cada paso no.

**El "hueco de cobertura de eval" del paso 1 es el más difícil de arreglar.** Añadir el slice faltante a tu corpus de entrenamiento, construir un juez calibrado para él y re-ejecutar el canary es en sí mismo un proyecto de varias semanas. El diagnóstico es rápido; la remediación no.

**Una regresión real puede ir montada sobre un bug no-modelo.** Los casos en los que tienes *tanto* un drift de prompt COMO una regresión real del modelo son los peores, porque el paso 3 encuentra el drift de prompt, lo arreglas y la alerta vuelve a dispararse. El orden diagnóstico de este post los maneja pero suma tiempo transcurrido. No hay atajo para "el bug estaba en dos lugares a la vez."

## FAQ

### ¿Por qué mi LLM produce outputs distintos para prompts similares?

La sensibilidad al prompt es real, pero no siempre es la *causa* de una alerta de QA — a veces es un *síntoma* de un bug aguas arriba. Recorre el diagnóstico. Si el SHA del prompt template coincide y el preprocessing coincide y el dataset coincide, entonces sí — el modelo tiene varianza amplia en este slice y necesitas una ruta de decodificación más determinista o un juez diferente. Si algo cambió aguas arriba, arregla eso primero.

### ¿Con qué frecuencia deberías re-evaluar tus benchmarks de LLM?

Re-evalúa el *contenido* del benchmark cada vez que la forma del tráfico de un slice de producción cambie de forma significativa. Re-evalúa la *calibración del juez* del benchmark cada trimestre, como mínimo — los modelos juez derivan más rápido de lo que pensarías. La mayor fuente de falsas alertas de QA es un benchmark que fue validado por última vez hace 18 meses y ahora mide algo que tu producción ya no hace.

### ¿Qué causa las alucinaciones en modelos de lenguaje custom?

Las alucinaciones tienen múltiples causas aguas arriba — fallos de retrieval (paso 6 en el árbol de arriba), huecos de cobertura de entrenamiento (paso 1, indirectamente) y problemas de la ruta de decodificación (una preocupación real del modelo en el paso 7). [AutoRAG](/es/autorag/) aborda las causas del lado del retrieval fijando el índice de retrieval dentro del manifiesto del release y re-anclándolo en cada release. Las otras dos requieren arreglos a nivel de pipeline aguas arriba del modelo.

### ¿Cómo sabes si tu data de entrenamiento es el problema?

Si el SHA del dataset en el release que falla coincide con el SHA del dataset en el release bueno anterior (paso 5 del árbol), la data no es la causa *inmediata*. Si difieren, lo encontraste. La pregunta más difícil — "¿el dataset está *completo* para nuestra cobertura de slices de producción?" — es lo que el paso 1 testea. Un dataset que está completo para el eval pero incompleto para el tráfico de producción es un problema de cobertura de slice.

### ¿Puedes arreglar fallos de QA sin reentrenar el modelo entero?

Sí — seis de cada siete veces, el arreglo no es un reentrenamiento. Los pasos 1–6 del árbol tienen arreglos que no tocan el modelo: actualiza el eval, recalibra el juez, re-registra el SHA del prompt, arregla el preprocessing, re-fija el dataset o re-fija el índice de retrieval. El reentrenamiento es el paso 7, el arreglo más caro, reservado para regresiones reales del modelo. El [audit trail](/es/compliance/) del pipeline de release te deja hacer estos arreglos aguas arriba con la misma disciplina de procedencia que usarías para un cambio de modelo.

## Referencias

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Varianza por categoría de LLM-as-judge.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% de coincidencia global GPT-4-vs-humano con varianza por categoría desde coding (86%) hasta writing (36–44%). Ancla para el paso 2 — por qué la calibración del juez tiene que medirse por slice en vez de asumirse desde una cifra publicada de titular.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (abril 2026). El writeup dominante de modos de fallo de 2026. Nombra el drift de prompt por edición en dashboard como la causa más citada de incidentes de LLM en producción. Ancla para el paso 3.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — función Measure.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>. La función "Measure" cubre explícitamente la validez del benchmark y la cobertura de evaluación como parte de la gobernanza, no como una preocupación de ingeniería aparte. Citada como ancla institucional para tratar el diseño del eval como el primer paso diagnóstico.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — evaluación de generación aumentada por retrieval.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). El framework de referencia para evaluación del lado RAG. Ancla para el paso 6 — separar fallos de retrieval de fallos de generación requiere una disciplina de eval consciente del RAG.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interno — distribución de causas raíz a lo largo de rollouts con clientes.</strong> Los porcentajes en el gráfico circular son nuestra observación interna a lo largo de rollouts con clientes de Divinci, no de un benchmark controlado. Tu distribución variará según el tipo de workload, la cadencia de fine-tune y la disciplina del equipo. El orden relativo (pasos 1–2 dominando) es estable a lo largo de la cohorte que hemos medido; los porcentajes exactos no son portables a tu entorno sin tus propios datos.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>El pipeline de release de cuatro etapas.</strong> <a href="/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">Cómo construir un pipeline de CI/CD para LLM con Divinci AI</a>. Cada paso diagnóstico de este post corresponde a un campo del manifiesto fijado en la Etapa 1 — Register. Sin la disciplina del manifiesto aguas arriba, el diagnóstico pierde su agarre; no puedes diffear lo que no fijaste.
</li>
</ol>

---

*Siguiente en esta serie:* **Testing automatizado de regresión para LLMs custom en 2026.** Este post trata sobre el diagnóstico después de que se dispara una alerta de QA. El siguiente trata sobre la disciplina de regression-testing que disparó la alerta en primer lugar — qué poner en el eval, cómo mantenerlo honesto y qué hacer cuando el test de regresión empieza a estar en desacuerdo con tu juez.
