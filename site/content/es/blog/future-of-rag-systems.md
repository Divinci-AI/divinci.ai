+++
title = "El Futuro de los Sistemas RAG: Más Allá de la Simple Recuperación de Documentos"
description = "Hacia dónde va RAG: routing por QA scored, arenas vectoriales, evaluación competitiva en vivo. Mayo 2026 — RAG es un problema de routing, no de pipeline."
date = 2025-05-01T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Artificial Intelligence"]
tags = ["RAG Systems", "AI Architecture", "Vector Embeddings", "LLMs", "Document Retrieval"]

[extra]
author = "Michael Mooring"
author_avatar = "images/Michael-Mooring.png"
featured_image = "images/autorag-still.png"
reading_time = 8
summary = "Los sistemas de Generación Aumentada por Recuperación (RAG) han revolucionado cómo los modelos de IA acceden y razonan sobre grandes conjuntos de datos. En este artículo, exploramos la próxima generación de tecnología RAG y cómo está permitiendo aplicaciones de IA más sofisticadas que van más allá de la simple recuperación de documentos."
+++

La Generación Aumentada por Recuperación (RAG) ha emergido como una de las aplicaciones más transformadoras de los Modelos de Lenguaje Grande (LLMs), permitiendo que los sistemas de IA accedan y razonen sobre vastas bases de conocimiento que se extienden mucho más allá de sus datos de entrenamiento. Sin embargo, a medida que las organizaciones despliegan sistemas RAG a escala, las limitaciones de los enfoques de primera generación se están haciendo cada vez más evidentes.

## 📰 Actualización de mayo de 2026 — RAG ahora es un problema de enrutamiento y orquestación, no de ingeniería de pipelines

Este artículo se publicó por primera vez en mayo de 2025. En el año transcurrido, el centro de gravedad del RAG se ha desplazado de *qué hay en el pipeline* a *qué hay en el router que elige el pipeline*. Los componentes que describimos — recuperación en múltiples etapas, jerarquías estilo RAPTOR, descomposición de consultas, recuperación recursiva — siguen siendo primitivos correctos. Ahora son subrutinas dentro de sistemas más grandes que **los envuelven en agentes, los puntúan con críticos de reflexión en tiempo de ejecución y los despachan contra una cartera de recuperadores (vector plano, grafo de conocimiento, documento visual y contexto largo de 2M tokens) por consulta y no por sistema**[^rag-survey-2026]. A continuación, lo que ha aterrizado desde la publicación y qué retirar del encuadre original.

<figure style="margin: 2rem 0; overflow-x: auto;">
<table style="width: 100%; border-collapse: collapse; font-size: 0.92rem;">
<thead>
<tr style="background: #2d5a4f; color: #faf8f5;">
<th style="padding: 0.7rem 0.9rem; text-align: left;">Primitivo RAG (encuadre de mayo 2025)</th>
<th style="padding: 0.7rem 0.9rem; text-align: left;">Estado a mediados de 2026</th>
</tr>
</thead>
<tbody>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Pipelines de recuperación en múltiples etapas</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Sigue siendo el caballo de batalla. La <strong>Recuperación Contextual</strong> de Anthropic + híbrido BM25 / vector / reranker es la nueva línea base asumida[^contextual-retrieval-2024].</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Recuperación recursiva / RAPTOR</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Subsumida en <strong>RAG Agéntico</strong> — la recursión ahora la dirige un agente de planificación, no un pipeline fijo[^rag-survey-2026][^sok-agentic-2026].</td></tr>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Descomposición de consultas</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Generalizada a <strong>RAG de razonamiento Sistema-1/Sistema-2</strong> — el agente decide cuándo, qué y cómo recuperar[^reasoning-rag-2025].</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>RAG multimodal</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">RAG de documento visual mediante <strong>ColPali / ColQwen</strong>[^colpali-2024][^vidore-v2-2025] y embeddings unificados de texto + imagen + video + audio + PDF mediante <strong>gemini-embedding-2</strong> (marzo de 2026)[^gemini-embedding-2] — los índices vectoriales de Divinci consumen ambos.</td></tr>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><em>(No estaba en el artículo original — emergió después.)</em></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Graph RAG</strong>: Microsoft <strong>LazyGraphRAG</strong> + GraphRAG 1.0 reducen la indexación a ~0,1% del coste de grafo completo[^lazy-graphrag-2024][^graphrag-1-2025]. <strong>LightRAG</strong> (HKU) y <strong>HippoRAG</strong> son las alternativas más baratas / rápidas.</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem;"><em>(No estaba en el artículo original — se resolvió este año.)</em></td><td style="padding: 0.7rem 0.9rem;">Debate de <strong>contexto largo vs RAG</strong>: resuelto a favor del <em>enrutamiento</em>. RAG para consultas simples; contexto largo (Gemini 3 Pro Deep Think, 2M tokens) para multi-hop complejas. Los benchmarks multi-aguja aún quedan 15–40 puntos por detrás de los de aguja única[^u-niah-2025].</td></tr>
</tbody>
</table>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">Un año de cambio arquitectónico, resumido. Las citas enlazan a las fuentes primarias al final de este artículo.</figcaption>
</figure>

### Lo que más cambió: RAG Agéntico como arquitectura con nombre propio

El desarrollo más consecuente desde mayo de 2025 es la consolidación del *RAG Agéntico* de patrón difuso a arquitectura con nombre propio, con su propia taxonomía y literatura de encuestas. "Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG" de Singh et al.[^rag-survey-2026] taxonomiza el espacio por **cardinalidad de agentes, estructura de control, autonomía y representación del conocimiento**, integrando reflexión, planificación, uso de herramientas y colaboración multi-agente en un único marco analítico. La continuación "SoK: Agentic Retrieval-Augmented Generation"[^sok-agentic-2026] añade una sistematización en torno a mecanismos de planificación, orquestación de recuperación, paradigmas de memoria y comportamientos de invocación de herramientas.

Lo que esto significa en concreto: en lugar de escribir *un* pipeline RAG y ajustarlo, los sistemas de producción a mediados de 2026 escriben un *planificador* que selecciona entre varios recuperadores, decide si recuperar o no (a veces el modelo sabe lo suficiente) y vuelve a consultar cuando la primera recuperación fue débil. LangGraph ha emergido como el runtime de facto para este patrón.

### RAG autocorrectivo llevado a producción

La discusión del artículo sobre "re-ranking contextual" se generalizó a la autocorrección en tiempo de ejecución. **Self-RAG** (Asai et al., 2023[^self-rag-2023]) introdujo tokens de reflexión que permiten al modelo criticar sus propias recuperaciones; **CRAG** (Corrective RAG, Yan et al.[^crag-2024]) añadió un evaluador de recuperación externo ligero con tres rutas correctivas (correcta / incorrecta / ambigua). En 2025–2026 el patrón pasó de investigación a producción: enrutar cada recuperación por un nodo crítico, volver a consultar sobre fragmentos de baja confianza y retroalimentar puntuaciones estilo RAGAS a la compuerta en tiempo de ejecución, no solo offline.

Esta es la misma lógica que nuestro [artículo sobre pruebas de regresión automatizadas](/blog/automated-regression-testing-for-custom-llms-in-2026/) describe para *evaluar* sistemas RAG — pero aquí corre **dentro** del bucle de recuperación, no solo en CI.

### Graph RAG fue lo que más maduró

De cualquier subárea, la recuperación con grafos de conocimiento avanzó más rápido en los últimos doce meses. **Microsoft LazyGraphRAG**[^lazy-graphrag-2024] (ahora en Azure / Microsoft Discovery) difiere la sumarización por comunidades hasta el momento de la consulta, reduciendo el coste de indexación a aproximadamente **0,1% del GraphRAG completo** manteniendo la calidad. **GraphRAG 1.0**[^graphrag-1-2025] es la versión con ergonomía de grado producción. **LightRAG** (HKU) ofrece recuperación dual-modo de grafo plano a aproximadamente el 1% del coste de GraphRAG; la memoria de inspiración neurobiológica de **HippoRAG** reduce los costes de razonamiento multi-hop entre 10–30×. **GraphRAG-Bench** (ICLR 2026, arXiv:2506.05690) da la regla de decisión empírica: **el valor del grafo escala con la complejidad de la consulta**[^graphrag-bench-2026].

Para la mayoría de los despliegues RAG de producción a la escala que vemos, la respuesta correcta en 2026 es un híbrido: vector plano para la larga cola de búsquedas simples, recuperación con grafos para la pequeña parte de consultas multi-hop complejas que justifican el sobrecoste de indexación.

### Contexto largo vs RAG: resuelto como enrutamiento, no como reemplazo

Cuando se publicó el artículo de mayo de 2025, la pregunta abierta era si las ventanas de contexto de 2M tokens dejarían obsoleto al RAG. **El debate está resuelto — a favor del enrutamiento.** Gemini 3 Pro Deep Think llega a 2M tokens y a puntuaciones competitivas en aguja única, pero las puntuaciones multi-aguja todavía quedan 15–40 puntos por detrás de las de aguja única en los benchmarks U-NIAH[^u-niah-2025], y la economía es decisiva: aproximadamente **$1,25 por consulta Gemini de 500K tokens frente a céntimos para RAG**. El prompt caching reduce la brecha en torno al 90% pero no la cierra. El modo de fallo "lost in the middle" se replica en todas las grandes familias de modelos a lo largo de 2025.

La arquitectura a mediados de 2026 es por tanto: **enrutar las consultas simples a RAG; enrutar las consultas multi-hop complejas o no estructuradas a contexto largo; enrutar las consultas de documento visual a ColPali**[^colpali-2024]**; enrutar las consultas de grafo de conocimiento a GraphRAG.** El encuadre del artículo original sobre "el problema de optimización que reemplaza a 'elegir una arquitectura RAG'" es exactamente correcto — la optimización ahora abarca más recuperadores que entonces.

### El RAG de documento visual pasó a producción — y aterrizaron los embeddings de modalidad unificada

**ColPali**[^colpali-2024] (Faysse et al., 2024) introdujo embeddings de interacción tardía VLM directamente sobre páginas renderizadas de documentos, eliminando por completo el paso de ingesta / OCR. **ViDoRe Benchmark V2** (mayo de 2025[^vidore-v2-2025]) elevó el listón en recuperación visual. **ColQwen2** promedia alrededor del 90% en ViDoRe, y **REAL-MM-RAG** (feb 2025) añadió un benchmark multimodal del mundo real. Para corpus densos en PDFs o tablas, el RAG de documento visual es ahora el valor por defecto de producción; el pipeline OCR-luego-fragmentar que el artículo original sugería ya no es estado del arte.

En marzo de 2026, **gemini-embedding-2** de Google[^gemini-embedding-2] colapsó la división visual / video / audio / texto en un único espacio de embeddings — el modelo acepta texto hasta 8.192 tokens, hasta seis imágenes por solicitud, video hasta 120 segundos, audio nativo y PDFs de hasta seis páginas, y produce un embedding de 3.072 dimensiones (escalable a 1.536 o 768 mediante Matryoshka Representation Learning). Se distribuye a través de la Gemini API y de Vertex AI, con integraciones de primera parte en LangChain, LlamaIndex, Haystack, Weaviate, Qdrant, ChromaDB y Vertex Vector Search. El anuncio de Google lo posiciona como <q>superando a los modelos líderes en tareas de texto, imagen y video</q>, con Paramount Skydance reportando Text-to-Video Recall@1 del 85,3% en su benchmark interno.

Para Divinci en concreto, la consecuencia práctica es que nuestros índices vectoriales pueden ingerir texto, imagen, video y audio en un único espacio de recuperación — distribuimos `gemini-embedding-2` como opción de embedding en los mismos diez backends que lista nuestra página de [RAG Routing](/es/rag-routing/), lo que significa que un corpus de modalidad mixta de un cliente (p. ej., un equipo legal que tiene PDFs de contratos, escaneos de contratos firmados y llamadas de negociación grabadas en el mismo workspace) puede consultarse a través de una sola llamada de recuperación en lugar de tres.

La recuperación de video y audio ya no está en fase de investigación — comparten ahora un espacio de embeddings con el texto.

### Patrones de RAG en producción — servicios gestionados y recuperación contextual

El otro gran cambio de 2025–2026 es que los equipos de producción consumen RAG cada vez más como servicio gestionado en lugar de construirlo por su cuenta.

- **Cloudflare AutoRAG** entró en beta abierta en abril de 2025 y se renombró como **Cloudflare AI Search** más tarde ese año[^cloudflare-autorag-2025][^cloudflare-ai-search-2026], ofreciendo ingesta → fragmentación → embedding → Vectorize → generación con Workers AI gestionados. En Divinci usamos una combinación distinta — D1 con FTS5 más APIs externas de embeddings — pero el mercado más amplio se está consolidando en torno a ofertas gestionadas (también AWS Bedrock Knowledge Bases, Vertex AI Search).
- **Anthropic Contextual Retrieval** (anunciado en septiembre de 2024 y ampliamente desplegado a lo largo de 2025[^contextual-retrieval-2024]) convirtió el *contexto explicativo por fragmento antepuesto antes del embedding* en la línea base asumida. El híbrido BM25 + vector denso + reranker ya no es "avanzado"; es lo que un equipo RAG competente lanza el primer día.

### La evaluación pasó de RAGAS offline a compuertas de autoevaluación online

El artículo pedía mejor evaluación de RAG. En 2025–2026 el campo respondió. **MIRAGE** (Findings de NAACL 2025[^mirage-2025]) introdujo 7.560 instancias de evaluación de recuperación sobre un pool de 37.800 entradas, con métricas para vulnerabilidad al ruido, aceptabilidad del contexto, insensibilidad al contexto y mala interpretación del contexto. **MIRAGE-Bench** (NAACL 2025[^mirage-bench-2025]) añadió cobertura multilingüe en 18 idiomas. **RAGAS** sigue siendo el valor por defecto de producción para fidelidad, relevancia y precisión del contexto — pero el patrón de 2026 es ejecutar RAGAS como una compuerta de recuperación *online*, no solo evaluación offline. Es el mismo patrón que describimos en nuestro [artículo de pruebas de regresión](/blog/automated-regression-testing-for-custom-llms-in-2026/) y operacionalizamos en el [artículo de pruebas CI](/blog/ci-testing-for-custom-language-models-in-2026/).

### Qué retirar del artículo original

El encuadre de mayo de 2025 envejeció mejor de lo que esperábamos, pero hay dos puntos específicos que necesitan actualización:

1. **"Las estrategias de recuperación estáticas son la mayoría de las implementaciones RAG"** — cierto hace un año, mucho menos cierto ahora. El despacho agéntico es el nuevo valor por defecto para cualquier equipo que construya más allá de la fase de prueba de concepto.
2. **La suposición implícita de que OCR-luego-fragmentar es como funcionan los corpus densos en PDFs** — superada por la recuperación visual ColPali / ColQwen en los despliegues líderes.

Las secciones originales sobre pipelines de múltiples etapas, descomposición de consultas y recuperación recursiva siguen siendo correctas. Ahora están envueltas en agentes, puntuadas online y elegidas por consulta desde una cartera en lugar de configuradas una vez por sistema.

### La arquitectura RAG de mediados de 2026, resumida

Un sistema RAG de producción a mediados de 2026 se ve así:

1. Un **planificador / router** (orquestado con LangGraph) que clasifica la consulta entrante.
2. Una **cartera de recuperadores** — vector plano (con línea base híbrida BM25 + denso + reranker), recuperación con grafos (LazyGraphRAG / LightRAG / HippoRAG para la cola compleja), documento visual (ColPali / ColQwen) y contexto largo (Gemini / Claude para las consultas no estructuradas donde la recuperación no aplica).
3. Un **crítico en tiempo de ejecución** (estilo Self-RAG / CRAG) que puntúa cada recuperación y dispara la re-consulta en baja confianza.
4. Una **compuerta de evaluación online** (RAGAS / MIRAGE) que aflora métricas de fidelidad / alucinación en producción, no solo en CI.
5. Un **juez calibrado** para cualquier puntuación LLM-as-judge que alimente la compuerta, refrescado semanalmente contra etiquetas humanas.

El artículo de mayo de 2025 describía una de estas piezas (el pipeline). La realidad de mediados de 2026 es la orquestación a su alrededor.

## 🧭 RAG Routing de Divinci — Una API, tres stacks arquitectónicamente distintos

Si la arquitectura RAG de mediados de 2026 es *enrutamiento y orquestación*, la pregunta clave pasa a ser: **¿entre qué elige realmente el router?** Esta es la pieza en la que nuestro enfoque diverge de la literatura publicada.

Cada router RAG con nombre que examinamos enruta por el **eje de profundidad**: ¿debo recuperar una vez, varias veces o no recuperar en absoluto? Adaptive-RAG[^adaptive-rag-2024], Probing-RAG[^probing-rag-2025], R2RAG[^r2rag-2025], LTRR (Learning to Rank Retrievers)[^ltrr-2025] y RAGRouter-Bench[^ragrouter-bench-2026] clasifican todas las consultas por complejidad de razonamiento y despachan a variantes más profundas o más superficiales de *la misma arquitectura de recuperación*. La plantilla "Adaptive RAG" de LangGraph enruta entre *no-recuperación / vector / búsqueda web* — de nuevo, por fuente y profundidad.

**El eje de enrutamiento RAG de Divinci es ortogonal: enrutamos entre tres stacks de recuperación arquitectónicamente distintos, seleccionados por la forma de la consulta, detrás de un único endpoint de API.**

<figure style="margin: 2.5rem 0;">
<svg viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Enrutamiento RAG de tres niveles: vector plano, híbrido BM25+denso+rerank, page-index + travesía agéntica">
<rect width="1200" height="600" fill="#faf8f5"/>
<text x="600" y="36" font-family="'DM Sans', -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1e3a2b" text-anchor="middle">Enrutamiento RAG de Divinci — tres arquitecturas, un endpoint</text>
<text x="600" y="60" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">El router clasifica la consulta y la despacha al nivel más barato capaz de responderla correctamente</text>
<g transform="translate(60, 88)">
<rect x="0" y="0" width="1080" height="60" fill="#1e3a2b" rx="6"/>
<text x="540" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Consulta entrante → Router (clasificador de forma de consulta)</text>
<text x="540" y="46" font-family="'DM Sans', sans-serif" font-size="11" fill="#c8d8d0" text-anchor="middle">¿factual? ¿señal híbrida? ¿multi-hop / documento largo?  →  elige el nivel más barato que la maneje</text>
</g>
<g transform="translate(60, 175)">
<path d="M 180 0 L 180 30" stroke="#7a8a4a" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
<path d="M 540 0 L 540 30" stroke="#5a7a8f" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
<path d="M 900 0 L 900 30" stroke="#2d5a4f" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
</g>
<g transform="translate(60, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#7a8a4a" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Nivel 1 · RAG de Vector Plano</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#5a6c2a" text-anchor="middle">RÁPIDO Y BARATO</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">embeber consulta → similitud coseno</text>
<text x="20" y="128">recuperar top-k → componer contexto</text>
<text x="20" y="146">→ generar</text>
<text x="20" y="186" font-weight="700">Ideal para:</text>
<text x="20" y="204" font-size="11">búsquedas de hecho único,</text>
<text x="20" y="220" font-size="11">"¿qué es X?", consultas tipo FAQ</text>
<text x="20" y="236" font-size="11">sobre corpus planos</text>
<text x="20" y="270" font-weight="700">Latencia:</text>
<text x="105" y="270">&lt; 300 ms</text>
<text x="20" y="290" font-weight="700">Coste:</text>
<text x="105" y="290">céntimos por consulta</text>
</g>
</g>
<g transform="translate(430, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#5a7a8f" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Nivel 2 · Híbrido + Rerank</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#3a5060" text-anchor="middle">EQUILIBRADO</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">BM25 léxico &nbsp;+ vector denso</text>
<text x="20" y="128">→ Reciprocal Rank Fusion</text>
<text x="20" y="146">→ reranker cross-encoder</text>
<text x="20" y="164">→ generar</text>
<text x="20" y="200" font-weight="700">Ideal para:</text>
<text x="20" y="218" font-size="11">consultas donde lo léxico y</text>
<text x="20" y="234" font-size="11">lo semántico discrepan —</text>
<text x="20" y="250" font-size="11">códigos, nombres, acrónimos,</text>
<text x="20" y="266" font-size="11">vocabulario técnico</text>
<text x="20" y="290" font-weight="700">Latencia:</text>
<text x="105" y="290">~ 800 ms</text>
<text x="20" y="310" font-weight="700">Coste:</text>
<text x="105" y="310">aún bajo</text>
</g>
</g>
<g transform="translate(800, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#2d5a4f" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Nivel 3 · Page-Index + Agente</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#1e3a2b" text-anchor="middle">PROFUNDO Y DELIBERADO</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">árbol jerárquico de tabla</text>
<text x="20" y="128">de contenidos construido al ingerir</text>
<text x="20" y="146">→ el agente recorre el árbol</text>
<text x="20" y="164">→ abre / lee secciones</text>
<text x="20" y="182">→ generar</text>
<text x="20" y="218" font-weight="700">Ideal para:</text>
<text x="20" y="236" font-size="11">lectura multi-hop de documentos</text>
<text x="20" y="252" font-size="11">largos y estructurados —</text>
<text x="20" y="268" font-size="11">PDFs legales, financieros, técnicos</text>
<text x="20" y="284" font-size="11">donde el contexto cruza páginas</text>
<text x="20" y="306" font-weight="700">Coste:</text>
<text x="105" y="306">el más alto — pero solo</text>
<text x="105" y="320">se gasta cuando es necesario</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">Los tres niveles son stacks arquitectónicamente diferentes, no variantes de profundidad del mismo. El router elige uno por consulta.</figcaption>
</figure>

### Nivel 1 — RAG de vector plano (la vía rápida / barata)

Para consultas factuales claras con una única respuesta que vive en un único fragmento: embeber la consulta, recuperar el top-k por similitud coseno, componer el contexto, generar. La arquitectura RAG clásica que el artículo original de 2025 describía como "primera generación" — utilizada aquí como vía de *primer recurso* para las consultas que genuinamente no necesitan nada más. Latencia p95 inferior a 300 ms, céntimos por consulta, sin sobrecoste de reranker.

### Nivel 2 — Híbrido BM25 + fusión densa + reranking

Para consultas donde las señales léxica y semántica discrepan. BM25 captura las necesidades de coincidencia exacta (códigos de producto, nombres de persona, acrónimos técnicos, cadenas de error); los vectores densos capturan la paráfrasis y la sinonimia. **Reciprocal Rank Fusion** fusiona las dos listas de resultados; un **reranker cross-encoder** puntúa el top-N fusionado y reordena por relevancia conjunta consulta-documento. Es la arquitectura que Anthropic publicó como **Contextual Retrieval**[^contextual-retrieval-2024] y lo que la mayoría de los equipos RAG competentes de 2026 envían como su valor por defecto. Divinci la trata como el nivel *intermedio* — la respuesta correcta para la mayoría de las consultas, pero ni la vía más barata ni la más profunda.

### Nivel 3 — Page-index + travesía agéntica de documentos

Para consultas que requieren lectura multi-hop de documentos largos y estructurados — los contratos legales, los 10-K financieros y las especificaciones técnicas donde la respuesta requiere sintetizar contexto que abarca secciones no adyacentes.

En el momento de la ingesta, construimos un *árbol jerárquico de tabla de contenidos* sobre el documento: encabezados, sub-encabezados, pies de figura, notas al pie — un índice estructural sin vectores con un breve resumen generado por LLM en cada nodo. En el momento de la consulta, un agente recorre el árbol, decide qué subárbol es relevante, abre esas secciones, lee y decide qué consultar a continuación. **PageIndex de VectifyAI**[^pageindex-2025] es la implementación open-source independiente de esta idea y una sólida validación de que el tercer nivel es real — distribuyen exactamente esto como producto independiente. Divinci lo trata como el *tercer nivel* de un router en lugar de como única opción, porque la mayoría de las consultas no lo necesitan y pagar su coste en cada consulta es un desperdicio.

### Por qué este eje de enrutamiento es diferente al de los demás

Adaptive-RAG[^adaptive-rag-2024] (Jeong et al., NAACL 2024) enruta entre **no-recuperación / un único paso / recuperación iterativa** — el eje de profundidad. Las continuaciones de 2025 — Probing-RAG[^probing-rag-2025], R2RAG[^r2rag-2025], LTRR[^ltrr-2025], RAGRouter-Bench[^ragrouter-bench-2026], "Query Routing for Retrieval-Augmented Language Models"[^query-routing-2505] — extienden todas el mismo eje: ¿*cuánta* recuperación necesita esta consulta? Enrutan entre variantes más profundas o más superficiales de una única arquitectura de recuperación.

**Divinci enruta a lo largo del eje de arquitectura.** La misma consulta que una implementación de Adaptive-RAG clasificaría como "iterativa" podría ser Nivel 2 híbrido (si la consulta se beneficia de la fusión léxico+semántica) o Nivel 3 page-index (si necesita lectura multi-hop de un documento largo) — son respuestas arquitectónicamente diferentes, no variantes de profundidad. Los dos ejes son ortogonales: la profundidad te dice *cuántos pases*, la arquitectura te dice *qué tipo de recuperación debe ser cada pase*.

### En qué es más débil el discurso, siendo honestos

El *concepto* de enrutamiento RAG por consulta está bien establecido. No inventamos el enrutamiento. La diferenciación genuina es: **enrutar entre stacks arquitectónicamente distintos, en un endpoint gestionado, con travesía nivel-3 estilo PageIndex incluida.** Ningún hyperscaler distribuye esa combinación hoy. **Cloudflare AI Search**[^cloudflare-ai-search-2026], **AWS Bedrock Knowledge Bases**[^bedrock-hybrid-2025], **Azure AI Search**[^azure-agentic-retrieval-2025] y **OpenAI Assistants File Search**[^openai-file-search] envían todos un único pipeline híbrido (a veces con un modo agéntico separado que se selecciona manualmente). **LlamaIndex RouterRetriever / RouterQueryEngine**[^llamaindex-router] es la coincidencia conceptual más cercana pero es una biblioteca que los clientes deben ensamblar, calibrar y operar por su cuenta.

### Cómo se ve en la superficie de la API

El router es invisible para quien llama. Un endpoint, una forma de solicitud, la respuesta te dice qué nivel respondió para que puedas auditarlo:

```bash
curl -X POST https://api.divinci.app/v1/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query":  "¿Qué cláusulas de la enmienda de 2024 anulan la sección 7.3?",
    "corpus": "legal-contracts-q4"
  }'

# Respuesta (anotada)
{
  "answer": "...",
  "routing": {
    "tier_used":    "page-index-agentic",       # nivel 3
    "tier_reason":  "corpus legal multi-hop, ≥3 saltos detectados",
    "alt_considered": ["hybrid"],
    "tier_costs": { "tier1": 0.003, "tier2": 0.018, "tier3": 0.124 }
  },
  "citations": [ /* … */ ]
}
```

El cliente no elige un stack; no ejecuta tres. El router lo hace. La transparencia de grado auditoría sobre qué nivel respondió es parte de la respuesta, no se entierra en métricas — la misma ética de auditabilidad que construimos en el [recibo vIndex](/blog/validating-and-releasing-custom-lms-in-regulated-fields/) y en el [manifiesto de release](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) para nuestro stack de CI/CD.

### Cómo decide el router en realidad — enrutamiento aprendido, no un clasificador codificado a mano

La versión de este router que se distribuye hoy *no* usa características de forma de consulta codificadas a mano. El mecanismo es **enrutamiento aprendido vía similitud de embeddings contra pares históricos de pregunta→backend**, y funciona así:

1. **Hashear la pregunta entrante** (SHA-256, truncado a una clave de 16 caracteres).
2. **Búsqueda exacta KV** contra el almacén de enrutamiento por cliente — si esta pregunta exacta se ha respondido antes, despachar de inmediato al backend que lo hizo mejor la última vez.
3. **En caso de fallo, embeber la pregunta y hacer búsqueda coseno** contra un índice cacheado de embeddings históricos de preguntas. Si el vecino más cercano supera un **umbral de 0,88 coseno**, despachar a su backend.
4. **Si no hay coincidencia por encima del umbral, hacer fallback** al backend por defecto configurado para el corpus.

Las entradas de enrutamiento llevan un **TTL de 30 días**; las entradas obsoletas disparan re-benchmarking en la próxima búsqueda, así es como el modelo de enrutamiento se mantiene fresco a medida que evolucionan el corpus y la mezcla de tráfico. La señal de "qué funcionó mejor la última vez" se sembra a partir de dos fuentes upstream: selecciones explícitas estilo arena A/B por parte del cliente y la salida de nuestro auto-fix interno que compara recuperaciones entre backends sobre consultas representativas. Ambas escriben en el almacén de historial de enrutamiento por cliente; el router consume cualquiera.

Esto es significativamente distinto a los routers académicos publicados ([Adaptive-RAG](https://aclanthology.org/2024.naacl-long.389/) y continuaciones), que clasifican la consulta *de antemano* por complejidad. Nuestro enfoque aprendido **confía en la evidencia histórica más que en la heurística de forma de consulta**, porque empíricamente la misma forma de consulta se comporta diferente en corpus diferentes — una consulta de "comparar X entre Y" sobre contratos legales quiere travesía page-index de Nivel 3; la misma forma de consulta sobre un corpus FAQ plano va bien en Nivel 1. Dejar que el modelo de enrutamiento aprenda esa distinción por corpus, en lugar de adivinarla desde la sintaxis de la consulta, es la decisión de diseño que efectivamente se distribuye.

**Una nota sobre los tres niveles conceptuales vs la lista real de backends.** Los tres niveles anteriores son un *espectro conceptual* útil (barato-rápido / equilibrado / profundo-deliberado). El propio router despacha a uno de **un conjunto más amplio de backends con nombre** — `pageindex` (forma de Nivel 3), `neo4j-hybrid` (recuperación mejorada con grafo), `raptor` (travesía de árbol), `lightrag` (búsqueda de entidades + comunidades) y motores vectoriales puros en `qdrant` / `cloudflare-v2` / `couchbase-byok` / `vertex-ai-vector-search-v2` / `mongodb-atlas` / `redis-vector-search`. El híbrido de Nivel 2 (BM25 + fusión densa + reranker cross-encoder) se distribuye hoy en nuestro **lienzo de workflow** como un nodo componible, y está en la hoja de ruta como backend auto-enrutable; si Nivel 2 es la respuesta correcta para tu corpus ahora mismo, lo compones como un workflow, no como un objetivo de enrutamiento. Lo integraremos en el auto-router a medida que los datos de enrutamiento por corpus lo justifiquen.

La decisión del router se registra hoy y se expone vía el rastro de auditoría; los metadatos completos de enrutamiento en el payload de respuesta (los campos `routing.tier_used` / `tier_reason` / `tier_costs` mostrados arriba) son un ítem de hoja de ruta — el patrón de **CI sombra** de nuestro [artículo de pruebas CI](/blog/ci-testing-for-custom-language-models-in-2026/) es cómo validaremos el cambio antes de activarlo.

### Cuándo importa más esto

Un cliente con un corpus homogéneo y forma de consulta uniforme obtiene un nivel óptimo y se beneficia poco del enrutamiento — podría elegir Nivel 2 manualmente y listo. La cuña son las empresas con **corpus mixtos y formas de consulta mixtas**: un equipo legal que pregunta tanto "¿cuál es la definición de fuerza mayor en nuestro contrato estándar?" (Nivel 1) como "a lo largo de nuestros 47 contratos con proveedores, ¿cuáles tienen cláusulas de terminación no estándar y cuáles son los patrones?" (Nivel 3). Enrutar entre arquitecturas es lo que permite que un único endpoint sirva bien a ambos sin pagar costes de Nivel 3 en la consulta de Nivel 1.

Ese es el caso donde un endpoint gestionado con tres stacks arquitectónicamente distintos detrás se gana el sueldo.

## La Promesa y las Limitaciones del RAG de Primera Generación

Los sistemas RAG tradicionales siguen un patrón directo: incrustar documentos en el espacio vectorial, recuperar fragmentos relevantes basándose en similitud semántica e inyectar este contexto en el prompt del LLM. Si bien este enfoque ha demostrado ser efectivo para escenarios básicos de preguntas y respuestas, enfrenta varios desafíos fundamentales:

### Restricciones de Ventana de Contexto

Incluso con LLMs modernos que soportan ventanas de contexto de más de 100K tokens, el desafío no es solo sobre ajustar más contenido—es sobre mantener coherencia y relevancia a través de diversas fuentes de información. Al tratar con consultas complejas que requieren sintetizar información de múltiples documentos, la simple concatenación a menudo conduce a sobrecarga de información en lugar de perspicacia.

### Limitaciones de Búsqueda Semántica

La búsqueda por similitud vectorial, aunque poderosa, puede perder relaciones matizadas entre conceptos. Una consulta sobre "evaluación de riesgo financiero" podría no recuperar documentos que discuten "swaps de incumplimiento crediticio" si el espacio de embedding no captura efectivamente estas conexiones semánticas.

### Estrategias de Recuperación Estáticas

La mayoría de las implementaciones RAG usan patrones de recuperación fijos que no se adaptan a la complejidad de la consulta o al contexto. Una pregunta factual simple requiere una lógica de recuperación diferente que una solicitud analítica compleja, sin embargo, la mayoría de los sistemas los tratan de manera idéntica.

![[Advanced RAG Architecture]](/images/autorag-still.png)
*Los sistemas RAG modernos emplean pipelines sofisticados de recuperación y razonamiento en múltiples etapas*

## La Evolución de la Arquitectura RAG

La próxima generación de sistemas RAG aborda estas limitaciones a través de varias innovaciones clave:

### Pipelines de Recuperación en Múltiples Etapas

En lugar de un único paso de recuperación, los sistemas RAG avanzados emplean pipelines de múltiples etapas que refinan y expanden progresivamente el espacio de búsqueda:

1. **Análisis de Consulta**: Comprender la intención de la consulta, complejidad y tipos de información requeridos
2. **Recuperación Inicial**: Búsqueda semántica amplia para identificar documentos candidatos
3. **Expansión de Contexto**: Seguir citas, documentos relacionados y referencias cruzadas
4. **Filtrado de Relevancia**: Aplicar filtrado específico de consulta para eliminar ruido
5. **Síntesis de Contexto**: Organizar la información recuperada en contexto coherente y estructurado

### Transformación y Descomposición de Consultas

Las consultas complejas a menudo requieren descomposición en sub-preguntas que pueden abordarse independientemente antes de la síntesis. Por ejemplo:

```python
# Ejemplo de Transformación de Consulta
original_query = "¿Cómo impactan los avances en computación cuántica la seguridad de las criptomonedas?"

decomposed_queries = [
    "¿Cuáles son los últimos avances en computación cuántica?",
    "¿Cómo amenaza la computación cuántica los métodos criptográficos actuales?",
    "¿Qué medidas de seguridad de criptomonedas son resistentes a lo cuántico?",
    "Cronología para que las computadoras cuánticas rompan el cifrado actual"
]
```

### Recuperación y Razonamiento Recursivo

![[Recursive Retrieval Process]](/images/autorag-retrieval-optimization.svg)
*La recuperación recursiva permite una exploración más profunda de las redes de información*

Los sistemas RAG avanzados pueden explorar recursivamente redes de información, siguiendo pistas y conexiones para construir una comprensión integral. Este enfoque imita cómo los investigadores humanos trabajan naturalmente—comenzando con fuentes iniciales y siguiendo conexiones relevantes.

## Más Allá de la Recuperación de Documentos: Aplicaciones Emergentes

A medida que los sistemas RAG maduran, están permitiendo categorías completamente nuevas de aplicaciones de IA:

### Sistemas de Conocimiento Mejorados con Razonamiento

En lugar de simplemente recuperar y presentar información, los sistemas RAG de próxima generación pueden:

- **Identificar Brechas de Conocimiento**: Reconocer cuando la información disponible es insuficiente para respuestas confiables
- **Validación por Referencias Cruzadas**: Verificar consistencia entre múltiples fuentes
- **Razonamiento Temporal**: Comprender cómo la validez de la información cambia con el tiempo
- **Análisis Causal**: Rastrear relaciones de causa y efecto a través de colecciones de documentos

### Navegación Dinámica de Grafos de Conocimiento

Los sistemas RAG se están integrando cada vez más con grafos de conocimiento, permitiendo la exploración dinámica de relaciones de entidades y conexiones semánticas que la búsqueda vectorial pura podría perder.

### RAG Multimodal

Extendiendo más allá del texto para incorporar imágenes, gráficos, tablas y otros tipos de medios en el proceso de recuperación y razonamiento. Esto es particularmente valioso para documentación técnica, informes financieros y literatura científica.

## Desafíos y Direcciones Futuras

A pesar de estos avances, persisten varios desafíos:

### Complejidad Computacional

La recuperación en múltiples etapas y el razonamiento recursivo aumentan significativamente los requisitos computacionales. Optimizar estos sistemas para el despliegue en producción requiere atención cuidadosa a las estrategias de caché, procesamiento incremental y activación selectiva de características avanzadas.

### Aseguramiento de Calidad

Con el aumento de la complejidad del sistema viene el desafío de asegurar la calidad y confiabilidad de la salida. Las métricas tradicionales de evaluación para sistemas RAG no capturan adecuadamente las características de rendimiento matizadas de los pipelines de razonamiento en múltiples etapas.

### Complejidad de Integración

Las organizaciones necesitan herramientas que puedan integrar sin problemas las capacidades RAG avanzadas en los flujos de trabajo existentes sin requerir una amplia experiencia en IA.

![[AutoRAG Optimization Process]](/images/autorag-diagram.svg)
*La optimización RAG automatizada reduce la complejidad del despliegue mientras mejora el rendimiento*

## La Solución AutoRAG de Divinci AI

En Divinci AI, hemos desarrollado **AutoRAG**—un sistema automatizado que optimiza los pipelines RAG para casos de uso y conjuntos de datos específicos. AutoRAG aborda los desafíos clave del despliegue RAG de próxima generación:

- **Selección Automatizada de Arquitectura**: Elegir estrategias de recuperación óptimas basadas en características de documentos y patrones de consulta
- **Optimización Dinámica de Parámetros**: Ajustar continuamente los parámetros del sistema basándose en retroalimentación del usuario y métricas de rendimiento
- **Integración de Aseguramiento de Calidad**: Evaluación y monitoreo integrados para asegurar calidad de salida consistente
- **Integración Fluida**: APIs simples que abstraen la complejidad mientras proporcionan acceso a capacidades avanzadas

## Conclusión

El futuro de los sistemas RAG no radica en la simple recuperación de documentos, sino en sistemas de razonamiento sofisticados que pueden navegar paisajes de información complejos, sintetizar fuentes diversas y proporcionar perspectivas matizadas. A medida que estos sistemas maduran, pasarán de ser motores de búsqueda glorificados a convertirse en verdaderos socios de conocimiento que aumentan las capacidades de razonamiento humano.

Las organizaciones que tengan éxito en este nuevo panorama serán aquellas que puedan desplegar y optimizar efectivamente estos sistemas RAG avanzados—convirtiendo sus activos de información en ventajas competitivas a través de aplicaciones de IA inteligentes y conscientes del contexto.

Para las organizaciones que buscan ir más allá de las implementaciones RAG de primera generación, la clave es comenzar con una base sólida que pueda evolucionar. Enfócate en la calidad de los datos, establece criterios de evaluación claros y elige plataformas que puedan crecer con tus necesidades.

**¿Listo para explorar RAG de próxima generación para tu organización?** [Contacta a nuestro equipo](https://divinci.ai/contact) para aprender cómo AutoRAG puede transformar tus procesos de gestión del conocimiento y toma de decisiones.

## Referencias

[^rag-survey-2026]: Singh et al. "Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG." arXiv:2501.09136 (ene 2025, actualizado hasta 2026). Taxonomía del RAG agéntico por cardinalidad de agentes, estructura de control, autonomía y representación del conocimiento. <https://arxiv.org/abs/2501.09136>

[^sok-agentic-2026]: "SoK: Agentic Retrieval-Augmented Generation." arXiv:2603.07379 (2026). Sistematización del conocimiento sobre planificación, orquestación de recuperación, memoria e invocación de herramientas en RAG agéntico. <https://arxiv.org/abs/2603.07379>

[^reasoning-rag-2025]: "Reasoning RAG via System 1 or System 2." arXiv:2506.10408 (jun 2025). Formaliza el cambio de pipelines estáticos a recuperación dirigida por razonamiento dinámico que decide cuándo, qué y cómo recuperar. <https://arxiv.org/html/2506.10408v1>

[^self-rag-2023]: Asai et al. "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection." arXiv:2310.11511. El marco de tokens de reflexión que ancló la línea de trabajo de RAG autocorrectivo. <https://arxiv.org/pdf/2310.11511>

[^crag-2024]: Yan et al. "Corrective Retrieval Augmented Generation." arXiv:2401.15884 (v3, 2024). Evaluador externo ligero de recuperación con tres rutas correctivas (correcta / incorrecta / ambigua). <https://arxiv.org/html/2401.15884v3>

[^lazy-graphrag-2024]: Microsoft Research. "LazyGraphRAG: Setting a New Standard for Quality and Cost." Nov 2024; integrado en Azure / Microsoft Discovery el 6 de junio de 2025. Coste de indexación reducido a ~0,1% del GraphRAG completo. <https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/>

[^graphrag-1-2025]: Microsoft Research. "Moving to GraphRAG 1.0: Streamlining Ergonomics for Developers and Users." 2025. Versión con ergonomía de grado producción. <https://www.microsoft.com/en-us/research/blog/moving-to-graphrag-1-0-streamlining-ergonomics-for-developers-and-users/>

[^graphrag-bench-2026]: "When to Use Graphs in RAG (GraphRAG-Bench)." arXiv:2506.05690 (ICLR 2026). Regla de decisión empírica: el valor del grafo escala con la complejidad de la consulta. <https://arxiv.org/html/2506.05690v3>

[^u-niah-2025]: "U-NIAH: A Unified Framework for Long-Context Needle-in-a-Haystack Evaluation." arXiv:2503.00353 (mar 2025). Las puntuaciones multi-aguja aún quedan 15–40 puntos por detrás de las de aguja única; RULER queda 10–25 puntos por detrás de NIAH-2. <https://arxiv.org/html/2503.00353v1>

[^mirage-2025]: "MIRAGE: A Multi-Instance Retrieval-Augmented Generation Evaluation Framework." Findings de NAACL 2025, arXiv:2504.17137. 7.560 instancias sobre un pool de recuperación de 37.800 entradas. <https://aclanthology.org/2025.findings-naacl.157/>

[^mirage-bench-2025]: "MIRAGE-Bench: Automatic Multilingual RAG Arena Benchmark." NAACL 2025. Evaluación RAG multilingüe en 18 idiomas. <https://aclanthology.org/2025.naacl-long.14/>

[^colpali-2024]: Faysse et al. "ColPali: Efficient Document Retrieval with Vision Language Models." arXiv:2407.01449 (2024). Embeddings de interacción tardía VLM directamente sobre páginas renderizadas de documentos; elimina el paso de OCR. <https://arxiv.org/abs/2407.01449>

[^vidore-v2-2025]: "ViDoRe Benchmark V2." arXiv:2505.17166 (may 2025). Benchmark v2 de recuperación de documento visual. <https://arxiv.org/pdf/2505.17166>

[^gemini-embedding-2]: Google. "Introducing gemini-embedding-2." Google Blog, 10 de marzo de 2026. Modelo de embeddings unificado de texto + imagen + video + audio + PDF. 3.072-dim por defecto (1.536 / 768 vía Matryoshka). Límites: 8.192 tokens de texto · 6 imágenes / solicitud · 120 s de video · audio nativo · PDFs de 6 páginas. Disponible a través de la Gemini API y Vertex AI; integraciones de primera parte con LangChain, LlamaIndex, Haystack, Weaviate, Qdrant, ChromaDB y Vertex Vector Search. <https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/>

[^contextual-retrieval-2024]: Anthropic. "Introducing Contextual Retrieval." Blog de Anthropic, sep 2024. Contexto explicativo por fragmento antepuesto antes del embedding; el híbrido embedding + BM25 + reranker es ahora el stack de producción por defecto. Patrones de despliegue de producción documentados en casos de estudio de AWS Bedrock (jun 2025). <https://aws.amazon.com/blogs/machine-learning/contextual-retrieval-in-anthropic-using-amazon-bedrock-knowledge-bases/>

[^cloudflare-autorag-2025]: Cloudflare. "Introducing AutoRAG on Cloudflare." Blog de Cloudflare, abril de 2025. Pipeline RAG gestionado: ingesta → fragmentación → embedding → Vectorize → generación con Workers AI. <https://blog.cloudflare.com/introducing-autorag-on-cloudflare/>

[^cloudflare-ai-search-2026]: Cloudflare Developers. "AI Search release notes." 2026. AutoRAG renombrado como AI Search. <https://developers.cloudflare.com/ai-search/platform/release-note/>

[^pageindex-2025]: VectifyAI. "PageIndex — índice jerárquico de tabla de contenidos con recuperación por búsqueda en árbol mediante LLM." Repositorio de GitHub, 2025. Implementación independiente de la arquitectura del tercer nivel (travesía agéntica jerárquica sin vectores). <https://github.com/VectifyAI/PageIndex>

[^llamaindex-router]: LlamaIndex. "Router Retriever / RouterQueryEngine." Selector LLM/Pydantic que elige uno o más recuperadores registrados por consulta. El bloque conceptual más cercano a un router de arquitectura, pero una biblioteca (BYO-stacks). <https://docs.llamaindex.ai/en/stable/examples/retrievers/router_retriever/>

[^adaptive-rag-2024]: Jeong et al. "Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity." NAACL 2024. Enruta por complejidad de consulta entre no-recuperación / un paso / recuperación iterativa — el router canónico del *eje de profundidad*. <https://aclanthology.org/2024.naacl-long.389/>

[^probing-rag-2025]: "Probing-RAG: Self-Probing to Guide Language Models in Selective Document Retrieval." NAACL 2025. Continuación de 2025 que extiende el enrutamiento por eje de profundidad de Adaptive-RAG.

[^r2rag-2025]: "R2RAG: Reasoning-Aware Routing for Retrieval-Augmented Generation." NeurIPS 2025 (artículo ganador). Enrutamiento por eje de profundidad con clasificación consciente del razonamiento.

[^ltrr-2025]: "LTRR: Learning To Rank Retrievers." arXiv:2506.13743 (2025). Aprende a clasificar recuperadores por consulta — por el eje de profundidad, no el de arquitectura. <https://arxiv.org/pdf/2506.13743>

[^ragrouter-bench-2026]: "Lightweight Query Routing for RAG / RAGRouter-Bench." arXiv:2604.03455 (2026). Benchmark de enrutamiento — de nuevo, variantes por eje de profundidad de una única arquitectura. <https://arxiv.org/html/2604.03455v1>

[^query-routing-2505]: "Query Routing for Retrieval-Augmented Language Models." arXiv:2505.23052 (2025). <https://arxiv.org/abs/2505.23052>

[^bedrock-hybrid-2025]: AWS. "Bedrock Knowledge Bases — búsqueda híbrida con Aurora PostgreSQL y MongoDB Atlas." Lanzamiento de abril de 2025. Un único pipeline híbrido; sin router de arquitectura. <https://aws.amazon.com/about-aws/whats-new/2025/04/amazon-bedrock-knowledge-bases-hybrid-search-aurora-postgresql-mongo-db-atlas-vector-stores/>

[^azure-agentic-retrieval-2025]: Microsoft. "Azure AI Search — Agentic Retrieval overview." 2025. La oferta hyperscaler más cercana a un pipeline de recuperación multi-modo, pero el usuario selecciona el modo en lugar de que un router elija por consulta. <https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview>

[^openai-file-search]: OpenAI. "Assistants API — File Search." Híbrido palabra clave + semántico con reescritura de consultas y reranking; pipeline único ajustable. <https://developers.openai.com/api/docs/assistants/tools/file-search>
