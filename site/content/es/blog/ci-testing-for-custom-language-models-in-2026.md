+++
title = "Pruebas de CI para modelos de lenguaje personalizados en 2026"
description = "Pruebas de contrato, smoke budget, fleet sizing consciente del coste y shadow CI. Cómo mantener una suite de eval de 12 min tratable en cada PR."
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "images/ci-testing-for-custom-language-models-in-2026-hero.png"
reading_time = 13
summary = "La suite de regresión del post 7 cuesta dinero real ejecutarla en cada PR. Así es como mantenemos la misma cobertura a una fracción del coste — pruebas de contrato de subsegundo, una capa de smoke de 90 segundos, caché de embeddings + batching del juez, y una ventana de sombra de 2 semanas antes de que cualquier gate empiece a bloquear. El post final de la serie."
+++

*Notas del ciclo de release — Parte 8 (final)*

Despliegas la suite de regresión del [post 7](/es/blog/automated-regression-testing-for-custom-llms-in-2026/). Funciona. Los gates conscientes de slice atrapan bugs reales. El juez calibrado se mantiene.

Entonces tu lead de ingeniería pregunta cuánto cuesta ejecutarla en cada PR. Haces la multiplicación: ~12 minutos de inferencia del juez por PR, 60 PRs al día, cuatro dimensiones × diecisiete slices, y la factura es dinero real. Peor aún, cada desarrollador está esperando 12 minutos para un check verde sobre un typo de prompt de una línea. La velocidad cae<sup><a href="#ref-1">[1]</a></sup>, el equipo refunfuña, alguien propone "ejecutar los gates solo cada noche" — que es exactamente cómo renuncias a todo lo que los gates debían hacer.

La solución no es menos testing. La solución es **testing en capas, con la mayor parte de la señal llegando en los primeros noventa segundos.** Este post trata de lo que corre debajo de la suite de gates: pruebas de contrato de subsegundo, una capa de smoke ajustada, una flota consciente del coste, y una ventana de sombra de dos semanas antes de que un gate nuevo bloquee a nadie.

Este es el post 8, el último de esta serie. Al final tendrás la imagen completa — desde el [pipeline de cuatro etapas](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) hasta el fixture de prueba de contrato que corre en cada commit.

## ¿Qué significa CI para un modelo de lenguaje personalizado?

CI para un LLM personalizado es el trabajo que la suite de gates no tiene que repetir. El gate puntúa la calidad semántica; CI atrapa todo lo que haría que la puntuación del gate fuera irrelevante antes de que el gate gaste un solo token de juez.

Las pruebas de contrato corren en milisegundos y verifican que las plantillas de prompt todavía rendericen, que los esquemas de tool-call todavía parseen, que los índices de retrieval todavía respondan, que el manifest todavía referencie hashes que existen de verdad. Son deterministas, gratuitas, y la única razón por la que el resto del pipeline puede permitirse existir. Un pull request que rompe la plantilla de prompt debe fallar en 200 ms, no después de 12 minutos de inferencia del juez puntuando tonterías.

La capa de contrato es la diferencia entre una factura de CI que escala linealmente con el volumen de PRs y una que no. El runner de CI de Divinci gasta > 90% de su presupuesto de juez en evaluación semántica real, no en PRs que habrían fallado un check de esquema. Esa ratio es la cifra titular.

## Por qué el CI tradicional se rompe para LLMs — a través del lente del coste

Los posts [1](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) y [7](/es/blog/automated-regression-testing-for-custom-llms-in-2026/) cubrieron por qué el CI determinista falla para un modelo generativo. La versión de esa historia de la que trata este post es el **coste** de esas cuatro propiedades, no su existencia.

| Propiedad de los LLMs | Fallo del CI tradicional | Forma del coste |
|---|---|---|
| Salidas no deterministas | Las aserciones de coincidencia exacta se vuelven inestables | Los re-runs amplifican el coste linealmente con la tasa de flake |
| Calidad multidimensional | Un único booleano no informa | Cada dimensión es una llamada (pagada) separada al juez |
| Drift del proveedor | Un `gpt-4-2024-01-01` fijado se retira silenciosamente | Pico de recalibración cuando un proveedor jubila un checkpoint |
| Efectos no locales del prompt | El test unitario local no puede atrapar el efecto | La forma de la distribución cambia entre PRs, no dentro de ellos — requiere re-run de la suite completa, no delta |

La arquitectura de CI tiene que hacer asequible cada una de estas. Las pruebas de contrato manejan las propiedades 1 y 3 de forma barata. Las pruebas de smoke manejan la propiedad 4 parcialmente. Solo la suite completa maneja la propiedad 2 — y solo en los PRs que realmente la necesitan.

## El pastel de capas de CI — de subsegundo a veinticinco minutos

La arquitectura que enviamos son cuatro capas, cada una ganándose su cómputo atrapando lo que las capas más baratas debajo no pueden. El enfoque consciente de slice de cada capa sigue la misma lección que el [postmortem de la Mentira Semver de Tianpan](/es/blog/automated-regression-testing-for-custom-llms-in-2026/) hizo explícita<sup><a href="#ref-4">[4]</a></sup>: las señales agregadas mienten; las señales por slice atrapan lo que los agregados esconden.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Arquitectura de CI de cuatro capas: pruebas de contrato subsegundo, smoke 90s, suite completa 12 minutos, replay de trazas de producción 25 minutos">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Pastel de capas de CI — cada capa estrecha el embudo de PRs que llegan a la siguiente</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">La mayoría de PRs solo tocan las dos capas superiores. Las cifras de coste-por-PR son internas — medidas en el CI de producción de Divinci.</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① Contrato · cada commit · &lt; 1 s · ~$0.00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">esquema · render de plantilla · denylist · integridad del manifest · liveness del índice</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% de commits</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② Smoke · cada PR · ~90 s · ~$0.05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">20–30 casos críticos en los 3 slices principales · solo tarea + seguridad</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% de PRs</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ Suite completa · PRs de prompt / modelo / retrieval · ~12 min · ~$0.80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500 casos · 4 dimensiones · todos los slices · gates Spearman por slice</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~22% de PRs</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ Replay de trazas de producción · candidatos a release · ~25 min · ~$2.40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">ventana de replay de 14 días · mismo juez calibrado · análisis de brecha offline ↔ replay</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~4% de PRs</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">Coste agregado por PR (ponderado por embudo): ~$0.27. Wall-clock p95 agregado: ~3.4 min.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Wall-clock por capa, coste por capa y ratios del embudo son internos — medidos en el CI de producción de Divinci para un cliente representativo (~500 casos del golden-dataset, 17 slices, ~60 PRs/día).</figcaption>
</figure>

La forma del coste es el diseño. ~74% de los PRs nunca gastan un token de juez — contrato o smoke basta. Los PRs que sí llegan a la suite completa son los que tocaron un prompt, una config de modelo, un índice de retrieval, o código de evaluación — exactamente los cambios donde la suite de gates es la única señal en la que vale la pena confiar. Los candidatos a release son la pequeña proporción que llega a la Capa 4.

## Pruebas de contrato — la ventaja injusta

Las pruebas de contrato son la primera línea, la línea más barata, y la línea que la mayoría de equipos saltan porque les parecen por debajo de la dignidad de un "pipeline de evaluación de IA". También son donde el 30–40% de las posibles regresiones realmente fallan en las suites de nuestros clientes, antes de que se haya llamado a un solo juez.

La capa de contrato asegura cinco cosas y nada más:

1. **Render de la plantilla de prompt.** Cada plantilla renderiza contra un fixture canónico sin variables no enlazadas, bucles desbocados, ni includes estilo Jinja rotos.
2. **Esquema de tool-call.** El esquema de argumentos de cada tool declarada parsea, el JSONSchema es válido, y el prompt renderizado realmente referencia todos los slots requeridos.
3. **Integridad del manifest.** Cada SHA en el manifest de release — modelo, prompt, índice de retrieval, juez, dataset — corresponde a un artefacto que existe en el registry. Los punteros colgantes fallan aquí, no tres capas más adentro.
4. **Liveness del índice.** El índice de retrieval responde a una query conocida dentro del presupuesto. Un índice reconstruido que rompió silenciosamente el retrieval aflora aquí, no en producción.
5. **Denylist y presupuesto de tokens.** Cualquier plantilla de prompt que introdujo un token prohibido, reventó el presupuesto de tokens por llamada, o renderizó más allá de la ventana de contexto falla aquí. El scoring heurístico de similitud semántica<sup><a href="#ref-6">[6]</a></sup> también es lo bastante barato como para correr en la capa de contrato para cobertura de denylist con matching difuso donde el matching literal de cadenas es insuficiente.

```bash
# Una invocación representativa de prueba de contrato — corre en aproximadamente 600 ms
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

Ninguna de estas llama a un juez. Ninguna es no determinista. Ninguna cuesta dinero medible. Y cada una de ellas descarta toda una clase de alertas tipo "la suite de gates dijo que el slice médico regresó" que habrían desperdiciado 12 minutos completos de inferencia del juez puntuando salida que el modelo nunca podría haber producido correctamente en primer lugar.

## La capa de smoke — 90 segundos, ~$0.05 por PR

Si la capa de contrato es la ventaja injusta barata, la capa de smoke es la que realmente atrapa regresiones por menos del precio de un café. Veinte a treinta casos sacados de los slices de mayor volumen, puntuados solo en **completitud de tarea y seguridad**, sin faithfulness, sin latencia, sin checks de retrieval-grounded. Cada PR ejecuta esto. Tarda unos 90 segundos porque los casos se agrupan en una sola llamada al juez con un esquema de salida estructurada, y porque el juez es el juez calibrado barato — no el de calidad completa usado para candidatos a release.

Hacemos seguimiento de qué capa atrapó cada fix enviado en un log de regresión, y el histograma ha sido consistente durante los últimos seis meses en los deployments de clientes:

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Gráfico de barras que muestra dónde se atrapan las regresiones: 31 por ciento en la capa de contrato, 27 por ciento en smoke, 28 por ciento en la suite completa, 11 por ciento en replay, 3 por ciento escapan a producción">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Dónde se atrapan las regresiones — por capa, últimos 6 meses en deployments de clientes</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">La mayoría de las regresiones mueren en las capas más baratas. Las capas caras se ganan su coste con el residuo.</text>
<g transform="translate(90, 100)">
<line x1="0" y1="200" x2="780" y2="200" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">40%</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">30%</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">20%</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">10%</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0%</text>
</g>
<g>
<rect x="40" y="45" width="120" height="155" fill="#7a8a4a" stroke="#1e3a2b" stroke-width="1"/>
<text x="100" y="36" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">31%</text>
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Contrato</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1 s · $0.00</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27%</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Smoke</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90 s · $0.05</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28%</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Suite completa</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12 min · $0.80</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11%</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Replay</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25 min · $2.40</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3%</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">Escapadas</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ rollback</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Agregado móvil de seis meses a través de deployments de CI de Divinci activos. Reportado como el % de regresiones confirmadas donde la capa nombrada fue la primera en fallar. Interno — medido por nosotros.</figcaption>
</figure>

El 3% que escapa es por qué existe [el rollback instantáneo del post 5](/es/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/). Los gates no prometen cero escapes; prometen un límite superior ajustado y una recuperación rápida para lo que se cuela.

## Dimensionamiento de flota de CI — cómo la suite de 12 minutos se mantiene barata

La capa de suite completa es donde las cuentas tienen que cuadrar. Una implementación ingenua llama al juez una vez por caso-por-dimensión, los ejecuta secuencialmente, y la factura escala linealmente con el número de casos. Tres optimizaciones hacen la mayor parte del trabajo para mantenerla tratable:

**Caché de embeddings.** La huella digital del contexto de retrieval para cada caso del golden-dataset se hashea; si el caso no ha cambiado y el índice de retrieval no ha cambiado, el embedding cacheado se mantiene y el paso de retrieval se omite. La tasa de aciertos después de la primera semana estable está consistentemente por encima del 90% en los deployments de nuestros clientes.

**Batching del juez.** El juez calibrado se llama con salida estructurada, agrupando 8–16 casos por llamada. El coste por token del juez se mantiene igual; el overhead por caso baja porque el system prompt se amortiza a través del batch. El umbral para batching seguro lo establece el propio acuerdo calibrado del juez a ese tamaño de batch<sup><a href="#ref-2">[2]</a></sup> — medimos esto durante la pasada semanal de calibración del juez ([post 7](/es/blog/automated-regression-testing-for-custom-llms-in-2026/)).

**Reutilización de KV-cache entre casos.** Para modelos donde el mismo system prompt y las definiciones de tools encabezan cada llamada, la KV cache para ese prefijo se computa una vez por ejecución de suite, no una vez por caso<sup><a href="#ref-3">[3]</a></sup>. En deployments de pesos abiertos esto es directo; en modelos de API cerrada depende del soporte del proveedor para caché de prefijos.

El efecto combinado deja la suite completa en aproximadamente las cifras de coste mostradas en el diagrama del pastel de capas de arriba. Las cifras exactas son internas, pero la ratio es la afirmación pública: **~74% de los PRs gastan cero dólares de juez; ~22% gastan céntimos; el 4% restante gasta un par de dólares por la señal pre-rollout de mayor confianza que sabemos producir.**

## CI en sombra — actívalo sin romper al equipo

El único error que hemos visto que los equipos cometen con más frecuencia es pasar un gate nuevo de "off" a "blocking" el día uno. Los umbrales se afinaron con datos de ayer, la tasa de falsos positivos es desconocida, y la primera vez que el gate dispara el equipo no tiene calibración sobre si es real o una falsa alarma. El ingeniero de eval de guardia recibe un page, el gate se desactiva, la confianza se pierde, el proyecto está muerto.

La solución es *CI en sombra*: ejecuta el nuevo gate sin bloquear durante dos semanas, postea el resultado como comentario de bot en cada PR, y revisa la tasa de falsos positivos semanalmente antes de pasarlo a bloqueante. El runner de CI de Divinci tiene un flag `--shadow` precisamente para esto. El comentario de PR se ve igual que la eventual versión bloqueante — mismo despliegue de diff, mismo desglose por slice — excepto que no gateaa el merge.

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

Cuando la tasa de falsos positivos está por debajo del 5% sostenida a lo largo de la ventana, lo pasamos. Cuando no, ajustamos los umbrales por slice, recalibramos el juez, y volvemos a sombra. De cualquier forma, al equipo no lo emboscó un gate nuevo que dispara el día uno.

## Un workflow de GitHub Actions que realmente compone

La pieza que ata el pastel de capas a tu CI existente corre en `.github/workflows/llm-ci.yaml`. Las capas están cableadas para que las baratas fallen rápido y las caras solo corran cuando necesitan — las cadenas `needs:` y los triggers filtrados por path hacen el trabajo<sup><a href="#ref-5">[5]</a></sup>.

```yaml
name: LLM CI
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'config/models.yaml'
      - 'eval/**'
      - 'retrieval/**'
      - 'manifests/**'
jobs:
  contract:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci contract --manifest manifests/staging.yaml --fail-fast
  smoke:
    needs: contract
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=smoke --post-pr-comment
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
  full:
    needs: smoke
    if: contains(steps.changes.outputs.paths, 'prompts/') || contains(steps.changes.outputs.paths, 'config/models.yaml')
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=full --post-pr-comment --gate
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
```

Tres cosas a notar. Las capas se encadenan vía `needs:`, así smoke no corre con un contrato roto y full no corre con un smoke roto. El job `full` está filtrado por path a los cambios que realmente justifican una ejecución de 12 minutos — un fix de typo en el README no dispara la suite de gates. El flag `--post-pr-comment` es lo que hace visible el diff por slice sin salir de GitHub.

## El bucle de debug de PR fallido

La otra mitad de "el gate disparó" es "muéstrame por qué". Una salida de la suite de regresión de `task-completion del slice médico cayó 0.04` es inaccionable sin los casos que la causaron. Mostramos los cinco peores diffs por slice en el comentario del PR, con el input original, la salida baseline, la salida candidata, y la traza de razonamiento del juez. El bucle de debug está pensado para tardar segundos, no minutos:

```bash
# Tira los 5 peores casos que dispararon el gate del slice médico en este PR
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

Esta es la misma superficie diagnóstica que [el árbol de siete pasos del post 6](/es/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/), cableada al bucle de feedback del CI. El ingeniero que abrió el PR ve la evidencia a nivel de caso en el propio PR; no tiene que ir a abrir un dashboard de eval por separado.

## Disciplina de control de versiones — prompts, datasets, jueces como código

Las plantillas de prompt, los golden datasets, y los prompts del juez todos viven en el repo, fijados por hash en el manifest de release. El manifest es el objeto único que ata la suite a un estado reproducible específico:

```yaml
# manifests/staging.yaml — cada ejecución de CI hashea esto
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

Cuando una ejecución de CI publica una puntuación, la puntuación se etiqueta con ese hash de manifest. Cuando una puntuación se mueve, la pregunta "qué input se movió" tiene una respuesta directa: diff el manifest, y la capa que disparó te dice qué dimensión mirar primero. Este es el bucle que [el pipeline de cuatro etapas del post 1](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) y [el recibo de vIndex del post 4](/es/blog/validating-and-releasing-custom-lms-in-regulated-fields/) cierran juntos: el manifest es la primitiva de auditoría hacia la que los ocho de estos posts han estado, en distintos enfoques, construyendo.

## Lo que esto no resuelve

Las mismas tres limitaciones honestas que hemos estado escribiendo en cada post de esta serie.

1. **CI no testea lo que no está en la suite.** No importa lo ingenioso que sea el pastel de capas, las únicas regresiones que atrapa son las que algún caso del golden dataset habría marcado. La capa de replay mitiga esto para el drift de comportamiento, pero las consultas nuevas que nunca se han visto siguen escapando hasta que aparecen en producción. El sistema tiene que emparejarse con monitoreo de producción.
2. **Las cifras de coste cambian con el pricing de modelos.** Cada cifra de coste en este post depende de tarifas de tokens del juez, tarifas de embeddings, y tarifas de inferencia que cambian trimestralmente. Las ratios — 74% / 22% / 4%, 31% / 27% / 28% / 11% / 3% — son las afirmaciones que soportan el peso; las cifras en dólares son ilustrativas para un momento en el tiempo.
3. **Los cambios de checkpoint del lado del proveedor siguen siendo difíciles.** Cuando un proveedor de API cerrada actualiza silenciosamente el modelo detrás de un nombre estable, la capa de contrato no puede atraparlo; solo la suite de gates puede, y solo a posteriori. Mitigamos fijando identificadores explícitos de checkpoint donde el proveedor lo soporte, y tratando el día que se anuncia un checkpoint como un evento disparador para una re-baseline de suite completa. No podemos prevenir el problema subyacente.

## Cerrando la serie

Este es el post 8 de 8. El arco completo:

1. [Cómo construir un pipeline de CI/CD para LLM con Divinci AI](/es/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — el pipeline de cuatro etapas (Register / Gate / Roll / Observe) dentro del cual ha vivido todo desde entonces.
2. [10 fallos de release de CI/CD en modelos de lenguaje personalizados](/es/blog/10-ci-cd-release-failures-in-custom-language-models/) — los modos de fallo nombrados de 2026, cada uno mapeado a la etapa que debería haberlo atrapado.
3. [12 capacidades de QA y gestión de release para LLMs](/es/blog/12-qa-and-release-management-capabilities-for-llms/) — la matriz de capacidades y el Venn de tres campos que posiciona a Divinci frente a las alternativas.
4. [Validando y desplegando LMs personalizados en campos regulados](/es/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — la inmersión profunda en compliance, mapeo de regulador a etapa, recibos de vIndex.
5. [Pipelines automatizados de CI/CD para LLM con rollback instantáneo](/es/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — la capa operacional, espectro de automatización, recibo de auto-rollback.
6. [Cómo diagnosticar fallos de QA en LLM personalizado en 7 pasos](/es/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — el árbol de decisión diagnóstico; el modelo es la respuesta correcta aproximadamente una alerta de cada siete.
7. [Pruebas de regresión automatizadas para LLMs personalizados en 2026](/es/blog/automated-regression-testing-for-custom-llms-in-2026/) — gates Spearman conscientes de slice, jueces calibrados, replay de trazas de producción en bucle cerrado.
8. **Este post.** La infraestructura de CI que hace tratable todo lo anterior en cada PR.

Las piezas componen: el [manifest](/es/api/) es la primitiva de auditoría, los gates son la capa de seguridad, el árbol diagnóstico es el bucle de recuperación, el [recibo de vIndex](/es/compliance/) es el ancla externa, y el pastel de capas es lo que hace que todo el conjunto sea asequible de correr en cada commit. Si tu proceso de release de LLM personalizado no tiene estos cinco juntos, la brecha es de lo que han tratado estos ocho posts.

## FAQ

**¿Cuál es la prueba más barata que puedo ejecutar en cada commit?**

Un check de render de plantilla de prompt. Corre en milisegundos, no requiere juez, atrapa una fracción sorprendente de roturas, y nunca cuesta un céntimo medible. Si todavía no lo estás ejecutando, es la pieza de CI con mayor ROI que sabemos recomendar.

**¿Cuánto debería esperar que cueste un pipeline de CI para LLM personalizado?**

Céntimos por PR típico, dólares de un solo dígito por PR candidato a release. La ratio depende del pricing del juez y de qué fracción de tus PRs tocan prompts o config de modelo. La proporción del 4% de candidatos a release de arriba es típica; para productos con iteración frecuente de prompts la proporción sube y la media trepa en consecuencia.

**¿Debería ejecutar la suite completa en cada commit?**

No. Filtra por path a los PRs que tocan prompts, config de modelo, retrieval, o código de eval. Para todos los demás cambios, contrato + smoke es suficiente y una espera de 12 minutos en un typo de README te perderá la confianza del equipo en un sprint. La suite completa es preciosa; gástala donde el cambio pueda plausiblemente mover una dimensión de calidad.

**¿Cómo introduzco un nuevo gate sin romper a todos?**

Ventana de sombra de dos semanas, sin bloquear. Afina umbrales sobre la tasa de falsos positivos observada durante la sombra. Pásalo a bloqueante solo cuando la tasa sostenida de falsos positivos esté por debajo de tu tolerancia (nosotros usamos 5%). Cualquier otra cosa es cómo consigues un gate que todos han aprendido a ignorar.

**¿Cuál es el único número que debería seguir si solo sigo uno?**

La fracción de regresiones confirmadas atrapadas antes de producción. El histograma de este post pone eso en ~97% en deployments maduros de Divinci. El 3% que escapa es por qué existe el rollback instantáneo. El 97% es para lo que sirve la suite.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — CI velocity, change-failure-rate and time-to-restore-service."</a> Los baselines cruzados de la industria que hacen que "12 minutos por PR es demasiado lento" sea una afirmación defendible y no una opinión.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. La evidencia empírica de que las llamadas LLM-as-judge agrupadas pueden preservar la calibración en los tamaños de batch usados en las capas de smoke y completa — la razón por la que las cifras de coste de este post son alcanzables.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">"Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. Las técnicas de reutilización de KV-cache y prefix-sharing citadas en la sección de dimensionamiento de flota de CI.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 de abril de 2026. El modo de fallo nombrado de 2026 para suites de regresión solo agregadas; la razón por la que el pastel de capas de CI es consciente de slice de principio a fin.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">"GitHub Actions — chaining jobs with `needs:` and conditional execution."</a> La primitiva contra la que compone el .yaml de este post.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">"BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. La métrica heurística de similitud semántica referenciada como alternativa a LLM-as-judge para las capas más baratas; no es lo que ejecutamos en tiempo de gate, pero es útil en la capa de contrato para detección a escala de frases prohibidas.
  </li>
</ol>
