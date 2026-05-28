+++
title = "Divinci AI se une a Cloudflare Workers Launchpad Cohorte #6"
date = 2025-10-05T10:00:00+00:00
description = "Divinci AI se une al Workers Launchpad Cohorte #6 de Cloudflare. Edge-RAG sub-100ms, el pitch del Demo Day y un deep-dive de nuestro stack de producción."
[taxonomies]
tags = ["company-news", "cloudflare", "infrastructure", "rag"]
[extra]
author = "Divinci AI Team"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/Divinci-Workers-Launchpad.svg"
+++

<video muted loop playsinline webkit-playsinline preload="none" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/divinci-cloudflare-workers-launchpad-cohort-6.webm" type="video/webm">
</video>

Nos emociona compartir que **Divinci AI ha sido aceptado en [Cloudflare Workers Launchpad Cohorte #6](https://blog.cloudflare.com/workers-launchpad-006/)**! Este programa acelerador apoya a startups innovadoras que construyen sobre la plataforma de edge computing de Cloudflare, y nos sentimos honrados de ser parte de esta cohorte excepcional.

<aside style="background: linear-gradient(135deg, rgba(247, 145, 31, 0.10), rgba(247, 145, 31, 0.04)); border-left: 4px solid #f7911f; padding: 1.25rem 1.5rem; margin: 2rem 0; border-radius: 10px;">
  <strong style="color: #1e3a2b; display: block; margin-bottom: 0.5rem; font-size: 1.05rem;">📺 Actualización — Pitch del Demo Day Cohorte #6</strong>
  <p style="margin: 0 0 1rem; color: #4a4030; font-size: 0.96rem;">Presentamos Divinci AI en el Demo Day de Cloudflare Workers Launchpad Cohorte #6. La presentación completa y un recorrido por cómo usamos el stack de Cloudflare — Workers, Worker Workflows, Workers AI y Vectorize — ya están en YouTube. La transmisión en vivo completa de Cloudflare TV también está enlazada abajo.</p>
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 0 0 1rem; border-radius: 8px;">
    <iframe src="https://www.youtube.com/embed/0PQQKcreMpo" title="Divinci AI — Pitch del Demo Day Cloudflare Workers Launchpad Cohorte #6" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
  </div>
  <p style="margin: 0; color: #4a4030; font-size: 0.92rem;">▶︎ <a href="https://www.youtube.com/watch?v=0PQQKcreMpo" target="_blank" rel="noopener">Ver el pitch en YouTube</a> &nbsp;·&nbsp; 📡 <a href="https://cloudflare.tv/shows/workers-launchpad-demo-day/workers-launchpad-demo-day---cohort-6/1ZrX4ovO" target="_blank" rel="noopener">Transmisión del Demo Day Cohorte #6 en Cloudflare TV</a></p>
</aside>

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/></svg> ¿Por qué Cloudflare Workers?

En Divinci AI, estamos construyendo la próxima generación de herramientas de colaboración empresarial de IA con un enfoque en confiabilidad, seguridad y rendimiento. La plataforma de edge computing de Cloudflare ha sido fundamental para lograr estos objetivos, permitiéndonos ofrecer capacidades de IA sofisticadas con latencia mínima en todo el mundo.

<video muted loop playsinline webkit-playsinline preload="none" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-celestial-globe.mp4" type="video/mp4; codecs=av01.0.05M.08">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-celestial-globe.webm" type="video/webm">
</video>
<p style="text-align: center; font-style: italic; color: #666; margin-top: -1rem; margin-bottom: 2rem;">Despliegue global en el edge permitiendo IA a la velocidad del pensamiento</p>

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> Nuestra Infraestructura Impulsada por Cloudflare

Hemos arquitecturado toda nuestra plataforma alrededor del conjunto de productos de Cloudflare, creando una infraestructura poderosa y escalable que soporta nuestros pipelines avanzados de RAG (Generación Aumentada por Recuperación):

### **Cloudflare Workers & Workflows**
La columna vertebral de nuestra plataforma, Cloudflare Workers impulsa nuestra capa de cómputo serverless, manejando millones de solicitudes con tiempos de respuesta de sub-milisegundos. Usamos **Cloudflare Workflows** para orquestar pipelines RAG complejos de múltiples pasos que recuperan, procesan y sintetizan información de múltiples fuentes de manera inteligente.

### **D1 para Almacenamiento de Fragmentos RAG**
Aprovechamos **Cloudflare D1**, su base de datos SQL distribuida, para almacenar y consultar nuestros fragmentos RAG eficientemente. La arquitectura basada en edge de D1 asegura que los fragmentos de documentos se almacenen cerca de nuestros usuarios, reduciendo dramáticamente la latencia de recuperación y mejorando la calidad de nuestras respuestas de IA.

<img src="/images/d1-rag-storage.svg" alt="Arquitectura de Base de Datos Distribuida D1" style="width: 100%; max-width: 800px; margin: 2rem auto; display: block;" loading="lazy">

### **Vectorize para Búsqueda Semántica**
**Cloudflare Vectorize** sirve como una de nuestras opciones de base de datos vectorial, permitiendo búsqueda semántica ultrarrápida a través de millones de embeddings de documentos. Esto permite que nuestros sistemas de IA encuentren el contexto más relevante para cualquier consulta, independientemente de cómo esté formulada.

### **Workers AI para Modelos de Código Abierto**
Integramos **Cloudflare Workers AI** para proporcionar acceso a modelos de lenguaje de código abierto de vanguardia de Hugging Face, incluyendo **Llama 3**, **Mistral** y otros modelos de última generación. Esto brinda a nuestros clientes empresariales flexibilidad para elegir el modelo adecuado para sus casos de uso específicos mientras mantienen privacidad y control de datos.

<img src="/images/workers-ai-models.svg" alt="Modelos de Código Abierto de Workers AI" style="width: 100%; max-width: 800px; margin: 2rem auto; display: block;" loading="lazy">

### **R2 para Almacenamiento de Medios**
**Cloudflare R2** maneja todo nuestro procesamiento de audio, video y almacenamiento de carga de archivos de usuarios. Con cero tarifas de salida y APIs compatibles con S3, R2 proporciona almacenamiento de objetos de nivel empresarial que escala sin problemas con nuestra creciente base de clientes.

### **API Shield para Seguridad**
A medida que nos preparamos para lanzar nuestras APIs públicas, **Cloudflare API Shield** proporciona protección esencial contra el abuso, limitación de velocidad y validación de esquemas. Esto asegura que nuestras APIs permanezcan seguras, eficientes y confiables para todos nuestros socios de integración.

### **Experimentando con Cloudflare Containers**
También estamos explorando **Cloudflare Containers** mientras trabajamos para mover nuestra infraestructura completa para que sea principalmente basada en Cloudflare. Esto nos permitirá ejecutar cargas de trabajo aún más complejas en el edge mientras mantenemos el rendimiento y la confiabilidad que nuestros clientes esperan.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg> Cómo Divinci Realmente Usa Cloudflare — el Stack de Producción

Hemos evitado la trampa de la "prosa de marketing con sabor a Cloudflare" aquí. Lo que sigue es el stack real tal como se despliega en nuestro monorepo: **29 Workers en producción, 3 Worker Workflows, 5 modelos de Workers AI, 4 buckets de R2, 6 tipos de Queues, Hyperdrive sobre Postgres, Containers respaldados por Durable Objects para PDF y audio, y 36 tail consumers** transmitiendo logs estructurados a observabilidad. Las piezas están nombradas según sus bindings reales y dominios de ruta para que los ingenieros que lean esto puedan hacer grep sobre ellas.

<figure style="margin: 2.5rem 0;">
<svg viewBox="0 0 1200 760" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Stack de producción de Divinci en Cloudflare: workers en el edge, pipelines asíncronos, almacenamiento y datos, IA y containers, observabilidad">
<rect width="1200" height="760" fill="#faf8f5"/>
<text x="600" y="36" font-family="'DM Sans', -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1e3a2b" text-anchor="middle">Stack de Producción de Divinci en Cloudflare</text>
<text x="600" y="62" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">29 Workers · 3 Workflows · 5 modelos Workers AI · 4 buckets R2 · 6 Queues · Hyperdrive · Containers · Email · Analytics</text>
<g transform="translate(40, 90)">
<rect x="0" y="0" width="1120" height="130" fill="#eae3d5" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#2d5a4f">Capa 1 · HTTP en el Edge — 5 Workers principales</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="20" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="120" y="58" text-anchor="middle" font-weight="700">divinci-api</text>
<text x="120" y="76" text-anchor="middle" font-size="11" fill="#5a6862">api.divinci.app</text>
<text x="120" y="92" text-anchor="middle" font-size="11" fill="#5a6862">auth · enrutamiento · JWT</text>
<rect x="240" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="340" y="58" text-anchor="middle" font-weight="700">web-client-r2-server</text>
<text x="340" y="76" text-anchor="middle" font-size="11" fill="#5a6862">chat.divinci.app</text>
<text x="340" y="92" text-anchor="middle" font-size="11" fill="#5a6862">frontend estático vía R2</text>
<rect x="460" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="560" y="58" text-anchor="middle" font-weight="700">divinci-agent</text>
<text x="560" y="76" text-anchor="middle" font-size="11" fill="#5a6862">orquestador</text>
<text x="560" y="92" text-anchor="middle" font-size="11" fill="#5a6862">composición de respuesta</text>
<rect x="680" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="780" y="58" text-anchor="middle" font-weight="700">chunks-workflow</text>
<text x="780" y="76" text-anchor="middle" font-size="11" fill="#5a6862">rag-workflow.divinci.app</text>
<text x="780" y="92" text-anchor="middle" font-size="11" fill="#5a6862">driver del pipeline RAG</text>
<rect x="900" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="1000" y="58" text-anchor="middle" font-weight="700">connector-sync-worker</text>
<text x="1000" y="76" text-anchor="middle" font-size="11" fill="#5a6862">Dropbox · Drive · etc.</text>
<text x="1000" y="92" text-anchor="middle" font-size="11" fill="#5a6862">ingesta externa</text>
</g>
</g>
<g transform="translate(40, 240)">
<rect x="0" y="0" width="540" height="130" fill="#eae3d5" stroke="#7a4848" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#7a4848">Capa 2a · Worker Workflows (asíncronos multi-paso)</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="100" y="58" text-anchor="middle" font-weight="700" font-size="12">ReindexWith­Version</text>
<text x="100" y="78" text-anchor="middle" fill="#5a6862">step.do(...)</text>
<text x="100" y="94" text-anchor="middle" fill="#5a6862">re-embed del corpus</text>
<rect x="190" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="270" y="58" text-anchor="middle" font-weight="700" font-size="12">BrowserExtraction</text>
<text x="270" y="78" text-anchor="middle" fill="#5a6862">openparse · DOM</text>
<text x="270" y="94" text-anchor="middle" fill="#5a6862">chunks PDF + HTML</text>
<rect x="360" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="440" y="58" text-anchor="middle" font-weight="700" font-size="12">AudioToRag</text>
<text x="440" y="78" text-anchor="middle" fill="#5a6862">whisper · pyannote</text>
<text x="440" y="94" text-anchor="middle" fill="#5a6862">chunks de transcripción</text>
</g>
</g>
<g transform="translate(600, 240)">
<rect x="0" y="0" width="560" height="130" fill="#eae3d5" stroke="#b8a060" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#7a6020">Capa 2b · Queues (6 ajustadas para el hilo único de D1)</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="38" width="125" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="82" y="53" text-anchor="middle">api-jobs · 10/5</text>
<rect x="150" y="38" width="125" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="212" y="53" text-anchor="middle">chunking · 10/5</text>
<rect x="280" y="38" width="125" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="342" y="53" text-anchor="middle">vectorize · 25/10</text>
<rect x="410" y="38" width="125" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="472" y="53" text-anchor="middle">reindex · 25/10</text>
<rect x="20" y="68" width="195" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="117" y="83" text-anchor="middle">d1-sync · escrituras serializadas</text>
<rect x="220" y="68" width="195" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="317" y="83" text-anchor="middle">embed-chunks · por lotes</text>
<text x="20" y="106" font-style="italic" fill="#5a6862">batch / concurrencia ajustados por cola para proteger el límite de un escritor por shard en D1</text>
</g>
</g>
<g transform="translate(40, 390)">
<rect x="0" y="0" width="1120" height="160" fill="#eae3d5" stroke="#5a7a8f" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#5a7a8f">Capa 3 · Almacenamiento y Datos — R2 + D1 + KV + Hyperdrive</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<text x="20" y="50" font-weight="700" font-size="12" fill="#5a7a8f">Buckets R2 (4)</text>
<rect x="20" y="58" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="73">FILES · documentos RAG</text>
<rect x="20" y="84" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="99">AUDIO_FILES · audio del workspace</text>
<rect x="20" y="110" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="125">PUBLIC_UPLOADS · adjuntos de chat</text>
<rect x="20" y="136" width="220" height="14" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="146" font-size="10">TEMP_UPLOADS · staging presignado</text>
<text x="270" y="50" font-weight="700" font-size="12" fill="#5a7a8f">D1 (sharded por vector)</text>
<rect x="270" y="58" width="270" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="280" y="73">shard D1 por tenant · fallback FTS5</text>
<rect x="270" y="84" width="270" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="280" y="99">índice de chunk + metadatos por cliente</text>
<text x="270" y="124" font-size="10" font-style="italic" fill="#5a6862">Cada tenant tiene su propio shard D1.</text>
<text x="270" y="138" font-size="10" font-style="italic" fill="#5a6862">Evita el cuello de botella de CPU del escritor único.</text>
<text x="570" y="50" font-weight="700" font-size="12" fill="#5a7a8f">KV (3 namespaces)</text>
<rect x="570" y="58" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="73">CACHE · JWT + config</text>
<rect x="570" y="84" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="99">EMBEDDING_CACHE · TTL 30 días</text>
<rect x="570" y="110" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="125">VECTORIZE_CACHE · lookup de embeds</text>
<text x="840" y="50" font-weight="700" font-size="12" fill="#5a7a8f">Hyperdrive → Postgres</text>
<rect x="840" y="58" width="260" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="850" y="73">binding HYPERDRIVE · pool en el edge</text>
<rect x="840" y="84" width="260" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="850" y="99">fallback de datos relacionales</text>
<text x="840" y="125" font-size="10" font-style="italic" fill="#5a6862">Evita el arranque en frío de abrir</text>
<text x="840" y="138" font-size="10" font-style="italic" fill="#5a6862">una conexión TCP por request.</text>
</g>
</g>
<g transform="translate(40, 570)">
<rect x="0" y="0" width="540" height="130" fill="#eae3d5" stroke="#a04848" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#a04848">Capa 4a · Workers AI — 5 modelos</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="36" width="240" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="30" y="51">@cf/openai/moderation-stable</text>
<rect x="270" y="36" width="250" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="280" y="51">@cf/huggingface/distilbert-sst-2</text>
<rect x="20" y="62" width="240" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="30" y="77">@cf/meta/llama-3-8b-instruct</text>
<rect x="270" y="62" width="250" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="280" y="77">@cf/google/gemma-3-12b-it-preview</text>
<rect x="20" y="88" width="500" height="22" fill="#faf8f5" stroke="#a04848" stroke-width="1" rx="3"/>
<text x="30" y="103">@cf/openai/whisper-large-v3-turbo · transcripción de audio</text>
</g>
</g>
<g transform="translate(600, 570)">
<rect x="0" y="0" width="560" height="130" fill="#eae3d5" stroke="#7a8a4a" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#5a6c2a">Capa 4b · Containers · Email · Analytics · Tail · Cron</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="36" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="51">openparse-cf · parser de PDF (DO container)</text>
<rect x="275" y="36" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="51">audio-services · ffmpeg + pyannote DO</text>
<rect x="20" y="62" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="77">divinci-send-notification-email</text>
<rect x="275" y="62" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="77">create-cf-email-destination · enrutamiento</text>
<rect x="20" y="88" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="103">Analytics Engine · sink de eventos estructurados</text>
<rect x="275" y="88" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="103">36 tail_consumers · fanout de logs estructurados</text>
</g>
</g>
<g transform="translate(40, 720)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="10" fill="#5a6862" font-style="italic">Triggers cron: cada 30 min (prod, limpieza de huérfanos) · cada 10 min (stage, nightly-fix-all). Todos los workers configurados con nodejs_compat + compat_date 2024–2025.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">El stack real de producción tal como se despliega desde el monorepo. Cada binding nombrado arriba aparece en un wrangler.toml en el código base.</figcaption>
</figure>

### Capa 1 — Cinco Workers principales en el edge

Cada solicitud HTTP llega a uno de cinco Workers con dominio personalizado:

- **`divinci-api`** en **`api.divinci.app`** — la frontera REST: auth, validación JWT, resolución de rutas, fan-out a workers internos. Los bindings incluyen el bucket R2 FILES, el namespace KV CACHE, la base de datos D1 de doc-elements, Workers AI, Hyperdrive, Analytics Engine, y cuatro Queues nombradas. Este es el worker que ve la solicitud primero.
- **`web-client-r2-server`** en **`chat.divinci.app`** — el frontend estático, servido directamente desde R2 a través de un Worker delgado que maneja reescrituras del lado del Worker y enrutamiento hacia el SPA.
- **`divinci-agent`** — el orquestador de composición de respuestas. Extrae contexto de D1 + KV + R2, decide qué modelo de Workers AI llamar (o si delegar a una API externa vía Hyperdrive), y compone la respuesta.
- **`chunks-workflow`** en **`rag-workflow.divinci.app`** — el punto de entrada de Worker Workflows; invocado cada vez que se necesita iniciar un pipeline RAG de larga duración.
- **`connector-sync-worker`** — el worker de ingesta externa que sincroniza desde Dropbox / Drive / conectores de terceros similares hacia el pipeline RAG.

Hay 24 workers más detrás de estos cinco (tail consumers, microservicios internos) — los cinco anteriores son los expuestos a la internet pública.

### Capa 2a — Worker Workflows (tres pipelines asíncronos multi-paso)

Cloudflare Workflows reemplazó nuestros antiguos job runners basados en Durable Objects el año pasado. Tres workflows están en producción hoy, todos usando el patrón de checkpoint `step.do("name", async () => {…})` para que cada paso sea reintentado independientemente en caso de fallo sin re-ejecutar todo el pipeline:

- **`ReindexWithVersionWorkflow`** — re-embebe el corpus completo de un cliente cuando cambia la versión del modelo de embedding. Versiona el índice resultante para que un roll-back sea un cambio de un solo binding.
- **`BrowserExtractionWorkflow`** — extrae texto de documentos cargados vía el container Durable Object **openparse-cf**, luego trocea + encola los chunks para embedding.
- **`AudioToRagWorkflow`** — transcribe audio con Workers AI Whisper, ejecuta diarización de hablantes a través del Container **audio-services**, trocea la transcripción y la encola para embedding.

Los tres se declaran en `wrangler.toml` así:

```toml
[[env.production.workflows]]
name = "reindex-with-version"
binding = "REINDEX_WITH_VERSION"
class_name = "ReindexWithVersionWorkflow"
```

### Capa 2b — Seis Queues, ajustadas para el límite de escritor único de D1

El trabajo asíncrono fluye a través de seis Queues nombradas, cada una con `max_batch_size`, `max_concurrency` y `max_retries` ajustados al cuello de botella del servicio downstream. Las queues chunking y api-jobs corren a 10-batch / 5-concurrencia porque escriben a D1 (cuyo escritor por shard es de un solo hilo); las queues vectorize y reindex corren más calientes a 25/10 porque llaman a APIs externas de embedding. La queue d1-sync serializa las escrituras a los shards D1 por vector para que dos workflows no compitan por la misma fila.

La lección que ojalá hubiéramos aprendido antes: **Las Queues son lo único que mantiene honesto un setup de D1 sharded por cliente.** Sin ellas, un solo tenant con una carga grande mata de hambre a todos los demás en el mismo shard hasta que la solicitud expire.

### Capa 3 — R2, D1, KV y Hyperdrive

La capa de almacenamiento está dividida en cuatro primitivos, cada uno elegido para un patrón de acceso diferente.

**R2 (cuatro buckets por entorno)** — los bindings son `FILES` (documentos RAG), `AUDIO_FILES` (audio fuente para pipelines de transcripción), `PUBLIC_UPLOADS` (adjuntos de chat servidos en endpoints de URL firmada) y `TEMP_UPLOADS` (la zona de aterrizaje para uploads presignados). Cero tarifas de egreso son la razón principal, pero la más profunda es que **el mismo Worker puede firmar una URL, aceptar una carga de varios MB, iniciar el BrowserExtractionWorkflow y servir el contexto RAG resultante — todo sin salir del edge de Cloudflare.**

**D1 (sharded por tenant)** — cada cliente obtiene su propia base de datos D1, con chunks + metadatos en tablas normales y una [tabla virtual FTS5](https://www.sqlite.org/fts5.html) para búsqueda solo-texto. Sharding por cliente fue la única forma de evitar el cuello de botella del escritor único en tenants calientes. El costo es que manejamos un fan-out a través de shards en la capa de aplicación; el beneficio es que el pico de un tenant no puede matar de hambre las lecturas de otro.

**KV (tres namespaces)** — `CACHE` mantiene resultados de validación JWT y config del tenant; `EMBEDDING_CACHE` es el mapa hash-de-contenido → bytes-de-embedding con TTL de 30 días (esta es la mayor reducción de costo que hicimos — cachear embeddings por hash de contenido redujo la factura diaria de la API de embedding en un orden de magnitud); `VECTORIZE_CACHE` es la capa envoltura que usa el worker `vectorize-cache` para memorizar lookups de vectores.

**Hyperdrive** — pooling de conexiones Postgres en el edge. El binding `HYPERDRIVE` permite a un Worker abrir una conexión Postgres sin pagar el costo del handshake TCP + auth en cada solicitud. Lo usamos para la pequeña porción de datos relacionales (estado de suscripción, ACLs a nivel de organización) que no encaja en el modelo sharded de D1.

### Capa 4a — Workers AI (cinco modelos en producción)

Workers AI es la capa de inferencia en plataforma; la usamos donde el modelo es lo suficientemente pequeño para que el ida-y-vuelta a un proveedor externo no valga la latencia o el costo:

| Modelo | Binding | Qué hace |
|---|---|---|
| `@cf/openai/moderation-stable` | seguridad de contenido | filtra cada input de usuario por una pasada de moderación antes de cualquier otro procesamiento |
| `@cf/huggingface/distilbert-sst-2-int8` | sentimiento | clasificación rápida para enrutamiento + analítica |
| `@cf/meta/llama-3-8b-instruct` | generación de texto | el modelo pequeño de fallback para composición de respuesta de bajo riesgo |
| `@cf/google/gemma-3-12b-it-preview` | generación de texto | el modelo preview que usamos para hacer A/B contra fine-tunes |
| `@cf/openai/whisper-large-v3-turbo` | transcripción de audio | llamado desde el AudioToRagWorkflow para transcripción |

Para generación de escala frontera (Claude, clase GPT-4) todavía enrutamos a proveedores externos a través de Hyperdrive — el catálogo de Workers AI está creciendo pero todavía no incluye los modelos más grandes que necesitamos para las consultas más difíciles.

### Capa 4b — Containers, Email, Analytics, Tail Consumers

**Containers Durable Object** son la pieza más nueva del stack: imágenes Docker completas corriendo en el runtime de Workers, con scope por instancia DO. Ejecutamos dos:

- **`openparse-cf`** es un parser de PDF en Python empaquetado como Container, llamado por el `BrowserExtractionWorkflow` para troceo de documentos.
- **`audio-services-container`** ejecuta ffmpeg + pyannote-audio para diarización de hablantes, llamado por el `AudioToRagWorkflow`. Tier de memoria `standard-2` (6 GB) para que los modelos más pesados carguen sin OOM.

**Email Workers** — un Worker transaccional de notificación envía email de producto, y un Worker de enrutamiento gestiona el correo entrante en `email.divinci.app/verified-emails`. Ambos usan el primitivo de Email Routing de Cloudflare en lugar de una API de email externa.

**Analytics Engine** — un dataset de Workers Analytics Engine es el sink de eventos estructurados para analítica de producto. Cualquier cosa que antes hubiéramos enviado a Segment/Amplitude aterriza aquí primero, luego se reenvía downstream.

**Tail Consumers (36 workers)** — cada worker de producción tiene su lista `tail_consumers` poblada con un consumidor `*_tail` dedicado. Cada consumidor parsea los logs de invocación del Worker y reenvía eventos estructurados a nuestro pipeline de observabilidad. El fan-out es lo que hace depurable la topología de microservicios de ocho workers.

**Cron Triggers** — producción ejecuta un trabajo de limpieza de huérfanos cada 30 minutos; stage corre cada 10 minutos para feedback más ajustado mientras iteramos sobre la lógica de limpieza.

### Una nota sobre Vectorize — qué no usamos, y por qué

Evaluamos Cloudflare **Vectorize** durante la migración y finalmente no lo adoptamos como nuestro almacén vectorial principal. La decisión no tuvo nada que ver con Vectorize en sí — ha mejorado significativamente a través de 2025–2026. La razón por la que aterrizamos en **D1 FTS5 + un servicio de embedding externo** fue que nuestra arquitectura de recuperación es híbrida (léxica + semántica con un re-ranker calibrado encima), y FTS5 en D1 nos dio la mitad léxica de eso gratis, en el mismo shard que los metadatos del documento. Añadir Vectorize habría introducido un segundo modelo de consistencia — un índice separado que tiene que mantenerse en sincronía con D1 — por una mejora marginal de recall en los volúmenes en los que operamos. El nombre del namespace KV `VECTORIZE_CACHE` es un remanente del período de evaluación; el worker detrás de él ahora cachea lookups de embedding, no resultados de Vectorize.

Si nuestro modelo de recuperación se desplaza hacia recuperación solo-densa a muy gran escala, Vectorize es el siguiente paso natural. Una respuesta honesta supera a una afirmación de marketing.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> Qué Significa Esto para Nuestros Clientes

Ser parte del acelerador Workers Launchpad significa que tendremos una colaboración aún más profunda con el equipo de ingeniería de Cloudflare, acceso temprano a nuevas funciones y los recursos para empujar los límites de lo que es posible con edge computing e IA.

Para nuestros clientes, esto se traduce en:

- **Respuestas de IA más rápidas** con despliegue global en el edge
- **Confiabilidad mejorada** a través del SLA de uptime del 99.99% de Cloudflare
- **Mejor privacidad de datos** con procesamiento en el edge
- **Funciones innovadoras** impulsadas por productos de vanguardia de Cloudflare
- **Infraestructura escalable** que crece con tus necesidades

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Mirando Hacia Adelante

Estamos increíblemente emocionados por esta asociación y las oportunidades que trae. A medida que continuamos construyendo el futuro de la colaboración empresarial impulsada por IA, la plataforma de Cloudflare permanecerá en el corazón de nuestra infraestructura, permitiéndonos ofrecer experiencias excepcionales a equipos alrededor del mundo.

<video muted loop playsinline webkit-playsinline preload="none" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-workshop-leonardo.mp4" type="video/mp4; codecs=av01.0.05M.08">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-workshop-leonardo.webm" type="video/webm">
</video>
<p style="text-align: center; font-style: italic; color: #666; margin-top: -1rem; margin-bottom: 2rem;">Innovación a través de las eras: Construyendo el futuro con principios atemporales</p>

¿Quieres aprender más sobre cómo Divinci AI puede transformar el flujo de trabajo de IA de tu equipo? [Solicita una demo](https://meetings.hubspot.com/michael-mooring/divinci-ai) para ver nuestra plataforma en acción.

---

**Acerca del Cloudflare Workers Launchpad**

El Workers Launchpad es el programa de startups de Cloudflare que proporciona financiamiento, soporte técnico y recursos de comercialización a empresas que construyen sobre la plataforma Workers. Aprende más sobre [la Cohorte #6 y las otras empresas innovadoras](https://blog.cloudflare.com/workers-launchpad-006/) que se unen a este programa.
