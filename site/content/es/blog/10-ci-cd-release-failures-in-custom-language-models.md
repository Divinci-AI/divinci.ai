+++
title = "10 fallos de release de CI/CD en modelos de lenguaje custom — y qué etapa del pipeline atrapa cada uno"
description = "Diez modos de fallo reales en releases de LMs custom, cada uno mapeado a la etapa del pipeline Divinci — Register, Gate, Roll, Observe — que los atrapa."
date = 2026-05-27T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Postmortems", "Evaluation Gates", "Rollback"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/10-ci-cd-release-failures-in-custom-language-models-veo31.webm"
hero_video_poster = "/images/10-ci-cd-release-failures-in-custom-language-models-hero-poster.webp"
reading_time = 11
summary = "Hemos enviado suficientes releases de LM custom a través del pipeline de cuatro etapas de Divinci como para tener una lista de los diez modos de fallo más dañinos contra los que solíamos chocar. Tres de ellos son regresiones conscientes del slice que un gate agregado habría enviado. Dos más son caídas silenciosas de calidad que un canary por métrica de infraestructura habría promovido. El resto son el tipo de error que cada pipeline de release se supone que debe atrapar — los listamos porque vale la pena decir en voz alta cuáles, de hecho, atrapa por sí mismo un pipeline con gate agregado."
+++

*Notas del Ciclo de Release — Parte II*

---

El [primer post de esta serie](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) recorrió el pipeline de release de cuatro etapas que enviamos — **Register → Gate → Roll → Observe**. Este post son los recibos: diez modos de fallo específicos que ya hemos cazado con él, cómo se vio cada uno en la práctica, y qué etapa del pipeline impidió que llegara a producción.

La lista está organizada por etapa, no por severidad, porque la etapa te dice *dónde invertir* si estás construyendo algo así por tu cuenta. Si tu gate es el eslabón débil, seis de los diez fallos de abajo van a seguir chocándote. Si tu observador es el eslabón débil, dos de ellos te chocarán silenciosamente — lo que significa que la única señal que jamás vas a recibir es una queja de cliente, que es la peor señal posible.

Un pipeline que atrape los diez no es una lista de features. Es un pequeño número de decisiones arquitectónicas tomadas consistentemente. Cada fallo abajo nombra qué decisión aplica.

## Cómo leer esta lista

Cada fallo está etiquetado con la etapa que lo atrapa:

- **① REGISTER** — la capa del manifiesto. Detiene fallos donde no podías decir qué cambio rompió producción porque el estado estaba esparcido entre sistemas.
- **② GATE** — Spearman por dominio contra un juez calibrado anclado por humanos. Detiene fallos que se esconden dentro de puntuaciones agregadas.
- **③ ROLL** — canary al 5% → 25% → 100% con un monitor de calidad en cada checkpoint. Detiene fallos que solo aparecen a escala.
- **④ OBSERVE** — replay continuo de trazas a través del candidato, puntuado por el juez del gate. Detiene caídas silenciosas de calidad que la latencia y los 5xx nunca notan.

Cada sección termina con el **fix** — la configuración exacta que enviamos en Divinci, más qué construir tú mismo si no nos estás usando.

---

## Etapa ① — Register

### 1. Co-desplegar modelo + prompt + routing en un único bundle y no saber cuál de los tres lo rompió

**Qué pasó.** Cambiamos tres cosas en el mismo release: subimos el modelo base de Gemma 4 E2B a Gemma 4 26B-A4B, editamos el system prompt del dominio legal para añadir una instrucción de "cita el estatuto", y ajustamos la regla de routing que decide qué clase de tráfico aterriza en qué modelo. La precisión en redacción de contratos cayó 7 puntos. Ninguno de los tres cambios había sido probado de forma independiente. Depurarlo requirió revertir una variable a la vez a lo largo de dos días.

**Por qué el pipeline lo atrapa ahora.** Un release de Divinci es un manifiesto inmutable que empaqueta model_ref, prompt_template_ref, routing y dataset_version en un único artefacto direccionado por SHA-256. El pipeline rechaza desplegar un manifiesto que empaquete más de un cambio *a menos que* el SHA del release anterior se referencie como la baseline de comparación. Si quieres enviar tres cambios a la vez, tienes que reconocerlo en el manifiesto, y la ruta de atribución de fallos se mantiene limpia porque el siguiente release es forzado de vuelta a una-variable-a-la-vez.

**Fix.** No dejes que humanos ensamblen releases a mano. El manifiesto de release debería ser generado por un pipeline que *no pueda* empaquetar silenciosamente. Ver [Etapa 1 — Register](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) para la API.

### 2. Editar un system prompt en un dashboard y enviarlo sin revisión de código

**Qué pasó.** Alguien retocó el system prompt en una UI de admin para "hacer el modelo menos verboso." Parecía una edición de una palabra. El prompt resultante era 38 caracteres más corto, lo que lo dejó por debajo de un umbral de longitud que el prompt-rewriter downstream usaba para decidir si añadir el boilerplate de seguridad. Dos horas después el modelo estaba respondiendo preguntas que debería haber rechazado.

**Por qué el pipeline lo atrapa ahora.** Los prompts son parte del manifiesto registrado. Editar uno en un dashboard significa cortar un nuevo manifiesto, lo que significa generar un nuevo SHA, lo que significa que el gate corre contra el cambio. Aún puedes editar prompts en un dashboard. Simplemente no puedes enviarlos sin que el gate los vea.

**Fix.** Trata los prompts como código: versiónalos con un hash de contenido, regístralos como parte del release, hazles gate sobre la suite de scored-QA. El writeup de Tianpan *Semver Lie*<sup><a href="#ref-1">[1]</a></sup> describe exactamente este modo de fallo ocurriendo en la naturaleza — un cambio de prompt que "pasó la revisión de código, se desplegó sin eval gates, llegó a producción sin A/B por usuario, y no disparó ningún rollback automático."

### 3. Skew de preprocesamiento entre entrenamiento y serving

**Qué pasó.** El pipeline de entrenamiento normalizaba el whitespace y pasaba a minúsculas un campo en particular. El pipeline de serving no. Mismo modelo, mismo prompt, mismo routing — entradas distintas a nivel de bytes. En las fixtures de dev todo pasaba. En tráfico real el modelo se comportaba como si hubiera sido re-entrenado sobre datos más ruidosos, porque desde su perspectiva, así había sido.

**Por qué el pipeline lo atrapa ahora.** El manifiesto registra un `preprocessing_ref` junto al model_ref. La evaluación del gate corre a través del mismo preprocesamiento que usa el stack de serving de producción. Si los dos divergen, los números offline del gate ya no coinciden con producción, y la Spearman por slice cae de un modo que es medible antes del promote.

**Fix.** Containeriza el preprocesamiento como un artefacto versionado. Refiérelo desde el manifiesto. Rechaza desplegar si el gate fue computado contra una versión de preprocesamiento distinta a la que producción va a usar.

---

## Etapa ② — Gate

Los cuatro fallos de abajo son los que un gate de puntuación agregada habría enviado. **La razón por la que un gate agregado los pierde es estructural, no de tuning de parámetros** — promediar a través de slices destruye exactamente la señal que usarías para atrapar una regresión que está localizada en un slice.

### 4. El colapso de licencias de IP (regresión consciente del slice #1)

**Qué pasó.** Un fine-tune QLoRA mejoró la precisión de Q&A legal en cinco subdominios y reventó licencias de IP — redacción de contratos 0,71, interpretación estatutaria 0,74, resumen de casos 0,69, cumplimiento regulatorio 0,66, análisis jurisdiccional 0,62, **licencias de IP 0,41**. La Spearman ρ agregada a lo largo de los seis era 0,64. El umbral del gate era 0,65. Por una única puntuación agregada, el release estaba por un pelo bajo la línea. Por la vista por slice, un subdominio se había colapsado 27 puntos.

**Por qué el pipeline lo atrapa ahora.** El umbral del gate es por slice, no agregado. Cualquier slice individual cayendo por debajo de su umbral marca el release como `gate_fail`, sin importar cómo se vea la media. El [gráfico de umbrales del gate en el post #1](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) es la visualización real que el pipeline produce para releases como este.

**Fix.** Trocea el gate. Los slices que importan son los subdominios de tus segmentos de cliente, no cualquier taxonomía que esté en el framework de eval que importaste.

### 5. Regresión del slice de oncología pediátrica (regresión consciente del slice #2)

**Qué pasó.** Un modelo de Q&A médica fue fine-tuneado sobre datos adicionales de cardiología de adultos. La precisión médica agregada mejoró 4 puntos. La precisión de oncología pediátrica cayó 11 puntos — aparentemente los nuevos datos de entrenamiento desenfatizaron sutilmente los ajustes de dosificación pediátrica. El gate agregado lo habría promovido.

**Por qué el pipeline lo atrapa ahora.** Oncología pediátrica era uno de los slices configurados por el cliente cuando registró la suite de scored-QA. La evaluación del Gate-2 produjo una Spearman ρ por slice que cayó de 0,72 a 0,61, por debajo del umbral de oncología pediátrica de 0,68. Marcado como `gate_fail`. Sin deploy.

**Fix.** Slices definidos por el cliente, no definidos por la plataforma. La plataforma debería dejar al cliente añadir un slice y un umbral por slice sin escribir código — porque nadie en Divinci conoce los bordes del dominio de tu cliente tan bien como tu cliente.

### 6. Drift sub-lingüístico multilingüe (regresión consciente del slice #3)

**Qué pasó.** Un modelo multilingüe fine-tuneado para mejorar respuestas en francés. La precisión de francés agregada mejoró 3 puntos. Dentro de "francés," sin embargo, el modelo ahora rendía peor en las variantes regionales de francés belga y francés suizo — el corpus de entrenamiento había sido pesado en francés parisino. Un gate agregado de francés lo habría enviado.

**Por qué el pipeline lo atrapa ahora.** Las variantes de locale son sub-slices del slice de idioma. La Spearman por sub-slice atrapó la regresión en la variante belga antes del promote. El release fue devuelto para (a) datos de entrenamiento más diversos o (b) un force-override con una justificación escrita ("estamos aceptando la regresión regional porque la mejora agregada en francés importa más en este rollout") — y el override va al audit trail.

**Fix.** La profundidad del slice importa. "Francés" es demasiado grueso. "Francés belga" es el nivel donde realmente se esconden las regresiones.

### 7. Saltarse el gate sin una justificación de override escrita

**Qué pasó.** Una ventana de release a alta presión. El gate falló en un slice — no crítico, en el juicio del equipo. Alguien echó mano del flag de force-override. En una versión anterior del pipeline, force-override era un único booleano. El flag se volcó, el release se envió, y tres semanas después nadie podía reconstruir quién decidió qué sobre qué slice.

**Por qué el pipeline lo atrapa ahora.** Force-override es un gate de dos campos: `forceGateOverride: true` AND `overrideReason: "..."`. La razón es un string libre requerido que se escribe en el audit log junto al ID del usuario y el resultado del gate por slice que fue overrideado. El pipeline rechaza el override sin la razón. Aún puedes overridear — simplemente no puedes overridear anónimamente.

**Fix.** Los gates de gobernanza no son una etapa separada. Son una propiedad de la etapa del gate: cada override es un recibo firmado con texto de justificación.

---

## Etapa ③ — Roll

### 8. Pasar del 0% al 100% del tráfico en un solo paso

**Qué pasó.** Un modelo pasó el gate limpiamente. Fue empujado al 100% del tráfico inmediatamente. Por un quirk en la longitud de la conversación, el nuevo modelo entraba en timeout en respuestas más largas que ~2.400 tokens — un comportamiento que no afloró en el set de evaluación de 100 preguntas del gate porque cada prompt de prueba era corto. El 15% de los usuarios recibió un timeout durante 18 minutos antes de que alguien hiciera rollback manualmente.

**Por qué el pipeline lo atrapa ahora.** La etapa Roll se mantiene al 5% durante `dwell_5pct_seconds` (por defecto 240) O `requests_5pct` (por defecto 1.000), lo que ocurra *después*. Al 5% de tráfico, los timeouts de conversación larga afloran en el monitor de tasa de 5xx dentro de ~3 minutos. El pipeline rechaza avanzar más allá del 5% si cualquier monitor del checkpoint rebasa su banda. El mean time to halt fue de 4 minutos; el mean time a un rollback completo fue de aproximadamente 12 segundos después del halt.

**Fix.** Canary en tres pasos con un monitor de *calidad*, no solo latencia y 5xx. El patrón de "cinco por ciento durante veinte segundos y hemos terminado" es el peligroso. El patrón de cinco-por-ciento-durante-cuatro-minutos es el seguro.

---

## Etapa ④ — Observe

Los dos fallos de abajo son los que un canary por métrica de infraestructura habría promovido. **La razón por la que las métricas de infraestructura los pierden también es estructural** — la latencia y los 5xx pueden mantenerse perfectamente limpios mientras el modelo silenciosamente evade, rechaza o alucina.

### 9. Hedging silencioso en consultas legales (caída silenciosa de calidad #1)

**Qué pasó.** Una actualización de modelo safety-tuned hizo al asistente del dominio legal notablemente más conservador. Misma latencia, misma tasa de 5xx, mismo uso de tokens. Pero donde la versión anterior había respondido "el estatuto de limitaciones es de X años," la nueva versión decía "deberías consultar a un abogado." Los clientes lo notaron en horas. Los dashboards nunca se movieron.

**Por qué el pipeline lo atrapa ahora.** El observador de la Etapa 4 corre replay continuo de trazas de producción a través del modelo activo y las puntúa con el mismo juez calibrado que alimentó el Gate-2. El hedging aparece inmediatamente porque el juez calibrado — anclado a calificaciones humanas de cómo se ve una "buena" respuesta legal — penaliza el rechazo-cuando-se-esperaba-una-respuesta. El monitor de calidad de output cayó por debajo de su banda durante tres minutos consecutivos y el pipeline hizo auto-rollback. Tiempo total transcurrido: menos de cinco minutos.

**Fix.** No monitorices solo latencia y 5xx. Monitoriza una puntuación de *calidad* derivada de un juez calibrado contra trazas reales de producción. Las deployment guardrails de SageMaker<sup><a href="#ref-2">[2]</a></sup> hacen auto-rollback sobre alarmas de CloudWatch — útil para infraestructura, pero la alarma tiene que dispararse sobre una métrica, y "el modelo está haciendo hedging" no es una métrica que CloudWatch vea.

### 10. Fechas alucinadas tras un fine-tune (caída silenciosa de calidad #2)

**Qué pasó.** Un fine-tune de un scheduling-assistant empezó a insertar con confianza fechas que no existían en la entrada. "Tu reunión es el jueves 32 de marzo." Latencia sin cambios. Tasa de 5xx sin cambios. Las alucinaciones pasaban el filtro de seguridad porque nada flaggeaba "32 de marzo" como dañino — solo como imposible.

**Por qué el pipeline lo atrapa ahora.** El juez calibrado del observador — corriendo sobre trazas reales de scheduling de producción, no sintéticas — le da a las respuestas confiadas-pero-erróneas una puntuación peor que a los rechazos apropiados de "no lo sé." La caída de la clase de alucinación disparó el umbral por minuto del observador dentro de dos minutos. El auto-rollback se disparó.

**Fix.** Un juez calibrado contra expertise de dominio. Un LLM-as-judge genérico va a perder "jueves 32 de marzo" del mismo modo en que humanos escaneando lo perderán. Jueces calibrados por dominio — anclados contra calificaciones de expertos del dominio — no.

---

## Los 10 fallos mapeados al pipeline

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matriz que mapea los diez modos de fallo a las cuatro etapas del pipeline. La Etapa 1 Register atrapa los fallos 1 (cambios co-desplegados), 2 (prompts sin versionar) y 3 (skew entre entrenamiento y serving). La Etapa 2 Gate atrapa los fallos 4 (regresión del slice de licencias de IP), 5 (regresión del slice de oncología pediátrica), 6 (drift sub-lingüístico multilingüe) y 7 (saltarse el gate sin justificación de override). La Etapa 3 Roll atrapa el fallo 8 (rollout en un solo paso). La Etapa 4 Observe atrapa los fallos 9 (hedging silencioso) y 10 (fechas alucinadas).">
<title>Modos de fallo por etapa del pipeline</title>
<rect width="900" height="420" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Dónde se atrapa cada fallo</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Tres regresiones conscientes del slice aterrizan en Gate. Dos caídas silenciosas de calidad aterrizan en Observe. El resto se distribuye entre Register y Roll.</text>
<g>
<rect x="40" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="140" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">① REGISTER</text>
<rect x="250" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="350" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">② GATE</text>
<rect x="460" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="560" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">③ ROLL</text>
<rect x="670" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="770" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">④ OBSERVE</text>
</g>
<g>
<rect x="40" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="163" font-size="11" font-weight="700" fill="#1e3a2b">1. Cambios co-desplegados</text>
<text x="50" y="178" font-size="10" fill="#6b5d4f">modelo + prompt + routing</text>
<text x="50" y="191" font-size="10" fill="#6b5d4f">empaquetados silenciosamente</text>
<rect x="40" y="210" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="228" font-size="11" font-weight="700" fill="#1e3a2b">2. Prompts sin versionar</text>
<text x="50" y="243" font-size="10" fill="#6b5d4f">edición en dashboard</text>
<text x="50" y="256" font-size="10" fill="#6b5d4f">se salta el gate</text>
<rect x="40" y="275" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="293" font-size="11" font-weight="700" fill="#1e3a2b">3. Skew train-serving</text>
<text x="50" y="308" font-size="10" fill="#6b5d4f">preprocesamiento diverge</text>
<text x="50" y="321" font-size="10" fill="#6b5d4f">entre offline + online</text>
</g>
<g>
<rect x="250" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="163" font-size="11" font-weight="700" fill="#a04848">4. Slice de licencias IP</text>
<text x="260" y="178" font-size="10" fill="#6b5d4f">slice 0,41, agregado 0,64</text>
<text x="260" y="191" font-size="10" fill="#6b5d4f">el agregado lo enviaría</text>
<rect x="250" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="228" font-size="11" font-weight="700" fill="#a04848">5. Oncología pediátrica</text>
<text x="260" y="243" font-size="10" fill="#6b5d4f">slice cae 11 puntos</text>
<text x="260" y="256" font-size="10" fill="#6b5d4f">el agregado lo enviaría</text>
<rect x="250" y="275" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="293" font-size="11" font-weight="700" fill="#a04848">6. Sub-drift multilingüe</text>
<text x="260" y="308" font-size="10" fill="#6b5d4f">francés belga retrocede</text>
<text x="260" y="321" font-size="10" fill="#6b5d4f">el agregado lo enviaría</text>
<rect x="250" y="340" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="260" y="358" font-size="11" font-weight="700" fill="#1e3a2b">7. Bypass de override</text>
<text x="260" y="373" font-size="10" fill="#6b5d4f">exige justificación escrita</text>
<text x="260" y="386" font-size="10" fill="#6b5d4f">+ entrada de audit</text>
</g>
<g>
<rect x="460" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="470" y="163" font-size="11" font-weight="700" fill="#1e3a2b">8. Rollout 0% → 100%</text>
<text x="470" y="178" font-size="10" fill="#6b5d4f">sin dwell de checkpoint</text>
<text x="470" y="191" font-size="10" fill="#6b5d4f">bugs de cola larga a escala</text>
</g>
<g>
<rect x="670" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="163" font-size="11" font-weight="700" fill="#a04848">9. Hedging silencioso</text>
<text x="680" y="178" font-size="10" fill="#6b5d4f">latencia + 5xx sin cambios</text>
<text x="680" y="191" font-size="10" fill="#6b5d4f">el juez lo atrapa</text>
<rect x="670" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="228" font-size="11" font-weight="700" fill="#a04848">10. Fechas alucinadas</text>
<text x="680" y="243" font-size="10" fill="#6b5d4f">"32 de marzo"</text>
<text x="680" y="256" font-size="10" fill="#6b5d4f">el juez de dominio lo atrapa</text>
</g>
</svg>
</figure>

Las barras coloreadas en rojo son los fallos que encontramos *mientras* enviábamos este pipeline — son la razón por la que terminamos construyendo específicamente el gate consciente del slice y el observador de replay de trazas, en lugar de enviar un canary genérico con métricas de infra como hacen todos los demás.

## ¿Qué hace que el CI/CD de LLM sea distinto del CI/CD de software?

La versión corta: un release de LLM no es un artefacto determinista. El mismo prompt produce salidas distintas entre ejecuciones. El mismo set de evaluación produce puntuaciones distintas entre hardware. El mismo modelo puede pasar un chequeo agregado de calidad mientras silenciosamente falla en un slice que no incluiste en la eval. La mayoría de las asunciones sobre las que se construyó el CI/CD tradicional no sobreviven al contacto con un sistema probabilístico.

Tres consecuencias concretas:

1. **No puedes escribir asserts del tipo `expect(output).toEqual(X)`.** Necesitas una evaluación consciente de la distribución que consuma correlación de rangos contra un grader anclado por humanos, no igualdad contra una fixture.
2. **Un modelo "que pasó CI" puede enviar comportamiento roto.** Los pases de CI significan que el código corre. No significan que el modelo esté en lo correcto. El pipeline de release necesita imponer un gate de *calidad* encima del gate de *corrección* que provee CI.
3. **El rollback no es opcional y no es lento.** Porque los modos de fallo son probabilísticos — y porque algunos son silenciosos en la capa de infraestructura — la ruta de rollback tiene que ser infraestructura primaria, no un plan de backup. El manifiesto de release existe específicamente para hacer el rollback atómico.

El primer post de esta serie describe la arquitectura de cuatro etapas que responde a estas consecuencias. Este post describe los fallos que atrapa.

## ¿Cómo se construye un pipeline de CI/CD resistente a fallos para LMs custom?

La respuesta honesta: aceptas que los fallos van a ocurrir y minimizas el tiempo entre el *fallo ocurriendo* y el *tráfico de producción volviendo a una versión conocida-buena*. El pipeline de cuatro etapas de arriba es una implementación específica de ese principio, pero el principio en sí mismo es lo que importa.

Si no estás usando Divinci y quieres construir algo equivalente, las piezas que cargan el peso son:

- **Un manifiesto de release inmutable** que empaqueta modelo + prompt + routing + dataset + preprocesamiento en un único SHA. Esto es lo que hace que 1, 2 y 3 sean atrapables. ([Etapa 1](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register))
- **Un gate por slice** con umbrales definidos por los dueños del dominio, no los dueños de la plataforma. Esto es lo que hace que 4, 5, 6 sean atrapables. ([Etapa 2](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate))
- **Un canary con monitorización de calidad en cada checkpoint**, no solo latencia y 5xx. Esto es lo que hace que 8 sea atrapable y lo que hace que 9 y 10 sean *sobrevivibles* una vez que llegan a producción. ([Etapa 3](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-3-roll))
- **Un observador continuo** que puntúa trazas reales de producción a través del modelo activo con el mismo juez calibrado que alimentó el gate. Esto es lo que hace que 9 y 10 sean atrapables. ([Etapa 4](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-4-observe-rollback-and-the-receipt))
- **Un recibo de audit firmado para cada decisión.** Encadenado por hash, anclable externamente. Para respaldos de modelos de pesos abiertos, el recibo embebe una [atestación de pesos vindex](/es/compliance/) probando que los pesos activos son los que el manifiesto registró. Para respaldos de API cerrada, el recibo cubre la cadena de decisión pero no puede reclamar procedencia de pesos — y el audit trail lo dice explícitamente.

Las piezas no son novedosas individualmente. Cada plataforma de MLOps tiene una o dos. La combinación — gate consciente del slice + observador de trazas de producción + rollback atómico + recibo demostrable — es la parte que nadie más envía en 2026.

## A dónde ir después

- El post complementario — **[Cómo construir un pipeline de CI/CD para LLM con Divinci AI](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)** — cubre la arquitectura y la API.
- La **[página de compliance](/es/compliance/)** documenta el formato de recibo vindex que respalda cada decisión de release y cómo mapea al EU AI Act, Artículo 17 del GDPR, HIPAA y NIST AI RMF.
- La **[página de producto de AutoRAG](/es/autorag/)** cubre la reducción de alucinaciones del lado del RAG que se empareja naturalmente con el juez calibrado que conduce el Gate-2 y el observador de la Etapa 4.
- La **[referencia de la API](/es/api/)** — cada comando referenciado en esta serie es un endpoint real.

## FAQ

### ¿Cuál es el fallo de CI/CD más común para modelos de lenguaje custom?

A lo largo de los releases que hemos enviado, el fallo más dañino con diferencia es **una regresión consciente del slice que pasa un gate agregado** — un modelo que mejora en promedio mientras silenciosamente colapsa en un subdominio específico (fallos 4, 5 y 6 arriba). Es más común que un rollback que falta, más común que el drift de prompts, y más difícil de detectar que cualquiera de los dos. El fix es estructural, no de tuning de parámetros: haz gate por slice, no sobre el promedio.

### ¿Qué tan rápido deberías poder hacer rollback de un release malo de LLM?

Orden de magnitud de segundos, no minutos. El tiempo medio de rollback en el pipeline de Divinci es de aproximadamente 12 segundos — eso es drenaje de requests en vuelo en un servicio de ~100 réplicas, no el intercambio del manifiesto en sí, que es sub-segundo. La decisión arquitectónica que hace esto posible es el manifiesto de release empaquetado: porque cada componente (pesos, prompt, routing, dataset) se referencia desde un único SHA, el rollback es un único re-apuntado atómico. Compara esto con postmortems públicos: el incidente de Cloudflare de junio 2022<sup><a href="#ref-3">[3]</a></sup> tardó 44 minutos en revertirse porque los ingenieros se pisaban entre sí los reverts; el outage de Atlassian de abril 2022<sup><a href="#ref-4">[4]</a></sup> tardó 12 horas por sitio afectado en restaurarse porque el estado estaba esparcido entre múltiples sistemas.

### ¿Por qué los cambios de prompt causan tantos outages en producción?

Porque los prompts se editan rutinariamente fuera del pipeline de CI/CD — en dashboards, en UIs de admin, a veces por gente sin revisión de ingeniería. Se tratan como configuración, pero se comportan como código. Una edición de 38 caracteres en un system prompt puede cambiar el comportamiento del modelo downstream más que un re-entrenamiento del modelo. El fix es registrar los prompts como parte del manifiesto de release y exigir que pasen el mismo gate que pasa el modelo.

### ¿Cómo se detecta la degradación silenciosa de calidad en outputs de LLM?

No con métricas de infraestructura. Latencia, tasa de 5xx y uso de tokens no van a atrapar el hedging, el rechazo-cuando-se-esperaba-una-respuesta, ni las fechas alucinadas. La señal de detección tiene que venir de una puntuación de *calidad* computada por un juez calibrado contra trazas reales de producción. El observador de la Etapa 4 en el pipeline de Divinci reproduce una muestra rodante de trazas de producción a través del modelo activo, las puntúa con el mismo juez Spearman anclado por humanos que alimentó el Gate-2, y dispara rollback automático cuando la puntuación de calidad cae por debajo del umbral durante tres minutos consecutivos.

### ¿Qué requisitos de audit trail aplican a los despliegues de modelos de IA?

El EU AI Act, Artículo 17 del GDPR (derecho de borrado), HIPAA, y el NIST AI Risk Management Framework todos exigen que las organizaciones mantengan registros de versiones de modelo, resultados de evaluación, decisiones de aprobación y rollouts. El requisito no explícito debajo de los cuatro es que los registros tienen que ser *verificables* — auditable significa más que "tenemos un log." Los recibos vindex de Divinci están encadenados por hash y son anclables externamente, lo que significa que un auditor puede verificar la cadena sin confiar en nuestros logs. Para respaldos de modelos de pesos abiertos el recibo también embebe una atestación de pesos; para respaldos de API cerrada el recibo nota explícitamente que la procedencia de los pesos no se reclama.

## Referencias

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (abril 2026). Nombra el modo de fallo de la edición de prompt en dashboard directamente. Complementario: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a>. El auto-rollback estándar conducido por métricas de infraestructura. Comparación útil para lo que la Etapa 4 Observe está haciendo de forma distinta (puntuación de calidad, no alarmas de CloudWatch).
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Revert de 44 minutos porque los ingenieros se pisaban entre sí los reverts. Citado como el ancla de "el rollback es su propio tipo de incidente."
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. 12 horas por sitio para restaurar. El modo de fallo del estado-esparcido-entre-sistemas en su peor forma.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. El umbral elite-performer para "tiempo de recuperación de deploy fallido" está documentado como menos de una hora. Encuadre útil para "qué tan rápido es lo suficientemente rápido" en el rollback.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">Zheng et al., <em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (arXiv:2306.05685, 2023). La referencia para por qué LLM-as-judge puede igualar calificaciones humanas globalmente pero variar ampliamente por categoría — que es exactamente el patrón que hace que el gating por slice sea necesario.
  </li>
</ol>

---

*Próximo en esta serie:* **Validar y enviar LMs custom en campos regulados.** El pipeline de arriba es la arquitectura. La vía de compliance es la práctica de usarlo. EU AI Act, Artículo 17 del GDPR, HIPAA y NIST AI RMF — qué le pide cada uno a un proceso de release, y qué campos del recibo vindex cubren qué requisito.
