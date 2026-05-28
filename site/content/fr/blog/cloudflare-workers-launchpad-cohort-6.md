+++
title = "Divinci AI rejoint le Cloudflare Workers Launchpad Cohort #6"
date = 2025-10-05T10:00:00+00:00
description = "Divinci AI rejoint la cohorte #6 du Workers Launchpad de Cloudflare. Edge-RAG sous 100 ms, le pitch du Demo Day, et un deep-dive sur notre stack de prod."
[taxonomies]
tags = ["company-news", "cloudflare", "infrastructure", "rag"]
[extra]
author = "Divinci AI Team"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/Divinci-Workers-Launchpad.svg"
+++

<video muted loop playsinline webkit-playsinline preload="none" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/divinci-cloudflare-workers-launchpad-cohort-6.webm" type="video/webm">
</video>

Nous sommes ravis de partager que **Divinci AI a été accepté dans le [Cloudflare Workers Launchpad Cohort #6](https://blog.cloudflare.com/workers-launchpad-006/)** ! Ce programme d'accélération soutient les startups innovantes construisant sur la plateforme d'edge computing de Cloudflare, et nous sommes honorés de faire partie de cette cohorte exceptionnelle.

<aside style="background: linear-gradient(135deg, rgba(247, 145, 31, 0.10), rgba(247, 145, 31, 0.04)); border-left: 4px solid #f7911f; padding: 1.25rem 1.5rem; margin: 2rem 0; border-radius: 10px;">
  <strong style="color: #1e3a2b; display: block; margin-bottom: 0.5rem; font-size: 1.05rem;">📺 Mise à jour — Pitch du Demo Day Cohort #6</strong>
  <p style="margin: 0 0 1rem; color: #4a4030; font-size: 0.96rem;">Nous avons pitché Divinci AI lors du Demo Day du Cloudflare Workers Launchpad Cohort #6. Le pitch deck complet et une visite guidée de la façon dont nous utilisons la stack Cloudflare — Workers, Worker Workflows, Workers AI et Vectorize — sont désormais sur YouTube. La diffusion en direct intégrale depuis Cloudflare TV est également liée ci-dessous.</p>
  <div style="position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; max-width: 100%; margin: 0 0 1rem; border-radius: 8px;">
    <iframe src="https://www.youtube.com/embed/0PQQKcreMpo" title="Divinci AI — Cloudflare Workers Launchpad Cohort #6 Demo Day pitch" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>
  </div>
  <p style="margin: 0; color: #4a4030; font-size: 0.92rem;">▶︎ <a href="https://www.youtube.com/watch?v=0PQQKcreMpo" target="_blank" rel="noopener">Regarder le pitch sur YouTube</a> &nbsp;·&nbsp; 📡 <a href="https://cloudflare.tv/shows/workers-launchpad-demo-day/workers-launchpad-demo-day---cohort-6/1ZrX4ovO" target="_blank" rel="noopener">Diffusion du Demo Day Cohort #6 sur Cloudflare TV</a></p>
</aside>

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/></svg> Pourquoi Cloudflare Workers ?

Chez Divinci AI, nous construisons la prochaine génération d'outils de collaboration IA d'entreprise en mettant l'accent sur la fiabilité, la sécurité et les performances. La plateforme d'edge computing de Cloudflare a été essentielle pour atteindre ces objectifs, nous permettant de fournir des capacités IA sophistiquées avec une latence minimale à travers le monde.

<video muted loop playsinline webkit-playsinline preload="none" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-celestial-globe.webm" type="video/webm">
</video>
<p style="text-align: center; font-style: italic; color: #666; margin-top: -1rem; margin-bottom: 2rem;">Déploiement global en périphérie permettant l'IA à la vitesse de la pensée</p>

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> Notre infrastructure alimentée par Cloudflare

Nous avons architecturé toute notre plateforme autour de la suite de produits Cloudflare, créant une infrastructure puissante et évolutive qui prend en charge nos pipelines RAG (génération augmentée par récupération) avancés :

### **Cloudflare Workers & Workflows**
L'épine dorsale de notre plateforme, Cloudflare Workers alimente notre couche de calcul sans serveur, gérant des millions de requêtes avec des temps de réponse inférieurs à la milliseconde. Nous utilisons **Cloudflare Workflows** pour orchestrer des pipelines RAG complexes en plusieurs étapes qui récupèrent, traitent et synthétisent intelligemment les informations provenant de plusieurs sources.

### **D1 pour le stockage de morceaux RAG**
Nous exploitons **Cloudflare D1**, leur base de données SQL distribuée, pour stocker et interroger nos morceaux RAG de manière efficace. L'architecture en périphérie de D1 garantit que les morceaux de documents sont stockés près de nos utilisateurs, réduisant considérablement la latence de récupération et améliorant la qualité de nos réponses IA.

<img src="/images/d1-rag-storage.svg" alt="Architecture de base de données distribuée D1" style="width: 100%; max-width: 800px; margin: 2rem auto; display: block;" loading="lazy">

### **Vectorize pour la recherche sémantique**
**Cloudflare Vectorize** sert comme l'une de nos options de base de données vectorielle, permettant une recherche sémantique ultra-rapide parmi des millions d'embeddings de documents. Cela permet à nos systèmes IA de trouver le contexte le plus pertinent pour toute requête, quelle que soit sa formulation.

### **Workers AI pour les modèles open-source**
Nous intégrons **Cloudflare Workers AI** pour fournir l'accès à des modèles de langage open-source de pointe depuis Hugging Face, incluant **Llama 3**, **Mistral** et d'autres modèles state-of-the-art. Cela donne à nos clients d'entreprise la flexibilité de choisir le bon modèle pour leurs cas d'usage spécifiques tout en maintenant la confidentialité et le contrôle des données.

<img src="/images/workers-ai-models.svg" alt="Modèles open source Workers AI" style="width: 100%; max-width: 800px; margin: 2rem auto; display: block;" loading="lazy">

### **R2 pour le stockage multimédia**
**Cloudflare R2** gère tous nos besoins de traitement audio, vidéo et de téléchargement de fichiers utilisateur. Avec zéro frais de sortie et des API compatibles S3, R2 fournit un stockage d'objets de niveau entreprise qui évolue de manière transparente avec notre base de clients croissante.

### **API Shield pour la sécurité**
Alors que nous nous préparons à lancer nos API publiques, **Cloudflare API Shield** fournit une protection essentielle contre les abus, la limitation de débit et la validation de schéma. Cela garantit que nos API restent sécurisées, performantes et fiables pour tous nos partenaires d'intégration.

### **Expérimentation avec Cloudflare Containers**
Nous explorons également **Cloudflare Containers** alors que nous travaillons à déplacer toute notre infrastructure pour qu'elle soit principalement basée sur Cloudflare. Cela nous permettra d'exécuter des charges de travail encore plus complexes en périphérie tout en maintenant les performances et la fiabilité attendues par nos clients.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg> Comment Divinci utilise concrètement Cloudflare — la stack de production

Nous avons évité ici le piège de la « prose marketing aux saveurs Cloudflare ». Ce qui suit, c'est la stack réelle telle qu'elle est livrée dans notre monorepo : **29 Workers en production, 3 Worker Workflows, 5 modèles Workers AI, 4 buckets R2, 6 types de Queues, Hyperdrive sur Postgres, des Containers adossés à des Durable Objects pour le PDF et l'audio, et 36 tail consumers** qui transmettent des logs structurés vers l'observabilité. Les pièces portent le nom de leurs vrais bindings et domaines de route afin que les ingénieurs qui lisent ceci puissent grep dessus.

<figure style="margin: 2.5rem 0;">
<svg viewBox="0 0 1200 760" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Stack de production Cloudflare de Divinci : edge workers, pipelines async, stockage et données, IA et conteneurs, observabilité">
<rect width="1200" height="760" fill="#faf8f5"/>
<text x="600" y="36" font-family="'DM Sans', -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1e3a2b" text-anchor="middle">Stack de production Cloudflare de Divinci</text>
<text x="600" y="62" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">29 Workers · 3 Workflows · 5 modèles Workers AI · 4 buckets R2 · 6 Queues · Hyperdrive · Containers · Email · Analytics</text>
<g transform="translate(40, 90)">
<rect x="0" y="0" width="1120" height="130" fill="#eae3d5" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#2d5a4f">Couche 1 · Edge HTTP — 5 Workers principaux</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="20" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="120" y="58" text-anchor="middle" font-weight="700">divinci-api</text>
<text x="120" y="76" text-anchor="middle" font-size="11" fill="#5a6862">api.divinci.app</text>
<text x="120" y="92" text-anchor="middle" font-size="11" fill="#5a6862">auth · routage · JWT</text>
<rect x="240" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="340" y="58" text-anchor="middle" font-weight="700">web-client-r2-server</text>
<text x="340" y="76" text-anchor="middle" font-size="11" fill="#5a6862">chat.divinci.app</text>
<text x="340" y="92" text-anchor="middle" font-size="11" fill="#5a6862">frontend statique via R2</text>
<rect x="460" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="560" y="58" text-anchor="middle" font-weight="700">divinci-agent</text>
<text x="560" y="76" text-anchor="middle" font-size="11" fill="#5a6862">orchestrateur</text>
<text x="560" y="92" text-anchor="middle" font-size="11" fill="#5a6862">composition des réponses</text>
<rect x="680" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="780" y="58" text-anchor="middle" font-weight="700">chunks-workflow</text>
<text x="780" y="76" text-anchor="middle" font-size="11" fill="#5a6862">rag-workflow.divinci.app</text>
<text x="780" y="92" text-anchor="middle" font-size="11" fill="#5a6862">moteur de pipeline RAG</text>
<rect x="900" y="38" width="200" height="70" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="1000" y="58" text-anchor="middle" font-weight="700">connector-sync-worker</text>
<text x="1000" y="76" text-anchor="middle" font-size="11" fill="#5a6862">Dropbox · Drive · etc.</text>
<text x="1000" y="92" text-anchor="middle" font-size="11" fill="#5a6862">ingestion externe</text>
</g>
</g>
<g transform="translate(40, 240)">
<rect x="0" y="0" width="540" height="130" fill="#eae3d5" stroke="#7a4848" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#7a4848">Couche 2a · Worker Workflows (async multi-étapes)</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="100" y="58" text-anchor="middle" font-weight="700" font-size="12">ReindexWith­Version</text>
<text x="100" y="78" text-anchor="middle" fill="#5a6862">step.do(...)</text>
<text x="100" y="94" text-anchor="middle" fill="#5a6862">re-embed du corpus</text>
<rect x="190" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="270" y="58" text-anchor="middle" font-weight="700" font-size="12">BrowserExtraction</text>
<text x="270" y="78" text-anchor="middle" fill="#5a6862">openparse · DOM</text>
<text x="270" y="94" text-anchor="middle" fill="#5a6862">chunks PDF + HTML</text>
<rect x="360" y="38" width="160" height="70" fill="#faf8f5" stroke="#7a4848" stroke-width="1" rx="4"/>
<text x="440" y="58" text-anchor="middle" font-weight="700" font-size="12">AudioToRag</text>
<text x="440" y="78" text-anchor="middle" fill="#5a6862">whisper · pyannote</text>
<text x="440" y="94" text-anchor="middle" fill="#5a6862">chunks de transcription</text>
</g>
</g>
<g transform="translate(600, 240)">
<rect x="0" y="0" width="560" height="130" fill="#eae3d5" stroke="#b8a060" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#7a6020">Couche 2b · Queues (6, calibrées pour le mono-thread D1)</text>
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
<text x="117" y="83" text-anchor="middle">d1-sync · écritures sérialisées</text>
<rect x="220" y="68" width="195" height="22" fill="#faf8f5" stroke="#b8a060" stroke-width="1" rx="3"/>
<text x="317" y="83" text-anchor="middle">embed-chunks · par batch</text>
<text x="20" y="106" font-style="italic" fill="#5a6862">batch / concurrence calibrés par queue pour protéger la limite single-writer par shard de D1</text>
</g>
</g>
<g transform="translate(40, 390)">
<rect x="0" y="0" width="1120" height="160" fill="#eae3d5" stroke="#5a7a8f" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#5a7a8f">Couche 3 · Stockage &amp; Données — R2 + D1 + KV + Hyperdrive</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<text x="20" y="50" font-weight="700" font-size="12" fill="#5a7a8f">Buckets R2 (4)</text>
<rect x="20" y="58" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="73">FILES · documents RAG</text>
<rect x="20" y="84" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="99">AUDIO_FILES · audio de l'espace de travail</text>
<rect x="20" y="110" width="220" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="125">PUBLIC_UPLOADS · pièces jointes du chat</text>
<rect x="20" y="136" width="220" height="14" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="30" y="146" font-size="10">TEMP_UPLOADS · zone de presign</text>
<text x="270" y="50" font-weight="700" font-size="12" fill="#5a7a8f">D1 (shardé par vecteur)</text>
<rect x="270" y="58" width="270" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="280" y="73">shard D1 par locataire · fallback FTS5</text>
<rect x="270" y="84" width="270" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="280" y="99">index chunk + métadonnées par client</text>
<text x="270" y="124" font-size="10" font-style="italic" fill="#5a6862">Chaque locataire a son propre shard D1.</text>
<text x="270" y="138" font-size="10" font-style="italic" fill="#5a6862">Évite le goulot CPU sur le single-writer.</text>
<text x="570" y="50" font-weight="700" font-size="12" fill="#5a7a8f">KV (3 namespaces)</text>
<rect x="570" y="58" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="73">CACHE · JWT + config</text>
<rect x="570" y="84" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="99">EMBEDDING_CACHE · TTL 30 jours</text>
<rect x="570" y="110" width="240" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="580" y="125">VECTORIZE_CACHE · lookup d'embeddings</text>
<text x="840" y="50" font-weight="700" font-size="12" fill="#5a7a8f">Hyperdrive → Postgres</text>
<rect x="840" y="58" width="260" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="850" y="73">binding HYPERDRIVE · pool en périphérie</text>
<rect x="840" y="84" width="260" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="3"/>
<text x="850" y="99">fallback données relationnelles app</text>
<text x="840" y="125" font-size="10" font-style="italic" fill="#5a6862">Évite le cold-start d'ouverture</text>
<text x="840" y="138" font-size="10" font-style="italic" fill="#5a6862">d'une connexion TCP par requête.</text>
</g>
</g>
<g transform="translate(40, 570)">
<rect x="0" y="0" width="540" height="130" fill="#eae3d5" stroke="#a04848" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#a04848">Couche 4a · Workers AI — 5 modèles</text>
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
<text x="30" y="103">@cf/openai/whisper-large-v3-turbo · transcription audio</text>
</g>
</g>
<g transform="translate(600, 570)">
<rect x="0" y="0" width="560" height="130" fill="#eae3d5" stroke="#7a8a4a" stroke-width="1.5" rx="6"/>
<text x="20" y="24" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#5a6c2a">Couche 4b · Containers · Email · Analytics · Tail · Cron</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#1e3a2b">
<rect x="20" y="36" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="51">openparse-cf · parser PDF (container DO)</text>
<rect x="275" y="36" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="51">audio-services · ffmpeg + pyannote DO</text>
<rect x="20" y="62" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="77">divinci-send-notification-email</text>
<rect x="275" y="62" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="77">create-cf-email-destination · routage</text>
<rect x="20" y="88" width="245" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="30" y="103">Analytics Engine · sink d'événements structurés</text>
<rect x="275" y="88" width="265" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="3"/>
<text x="285" y="103">36 tail_consumers · fanout de logs structurés</text>
</g>
</g>
<g transform="translate(40, 720)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="10" fill="#5a6862" font-style="italic">Déclencheurs Cron : toutes les 30 min (prod, nettoyage des orphelins) · toutes les 10 min (stage, nightly-fix-all). Tous les workers configurés avec nodejs_compat + compat_date 2024–2025.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">La vraie stack de production telle qu'elle est livrée depuis le monorepo. Chaque binding nommé ci-dessus apparaît dans un wrangler.toml du codebase.</figcaption>
</figure>

### Couche 1 — Cinq Workers principaux à l'edge

Chaque requête HTTP atterrit sur l'un de cinq Workers à domaine personnalisé :

- **`divinci-api`** sur **`api.divinci.app`** — la frontière REST : auth, validation JWT, résolution de routes, fan-out vers les workers internes. Les bindings incluent le bucket R2 FILES, le namespace KV CACHE, la base D1 des doc-elements, Workers AI, Hyperdrive, Analytics Engine et quatre Queues nommées. C'est le worker qui voit la requête en premier.
- **`web-client-r2-server`** sur **`chat.divinci.app`** — le frontend statique, servi directement depuis R2 via un Worker léger qui gère la réécriture côté Worker et le routage dans la SPA.
- **`divinci-agent`** — l'orchestrateur de composition des réponses. Tire le contexte depuis D1 + KV + R2, décide quel modèle Workers AI appeler (ou s'il faut déléguer à une API externe via Hyperdrive), compose la réponse.
- **`chunks-workflow`** sur **`rag-workflow.divinci.app`** — le point d'entrée Worker Workflows ; appelé chaque fois qu'un pipeline RAG de longue durée doit être déclenché.
- **`connector-sync-worker`** — le worker d'ingestion externe qui synchronise depuis Dropbox / Drive / connecteurs tiers similaires vers le pipeline RAG.

Il y a 24 autres workers derrière ces cinq-là (tail consumers, microservices internes) — les cinq ci-dessus sont ce qui est exposé à l'internet public.

### Couche 2a — Worker Workflows (trois pipelines async multi-étapes)

Cloudflare Workflows a remplacé nos anciens job-runners basés sur Durable Objects l'an dernier. Trois workflows sont en production aujourd'hui, tous utilisant le pattern de checkpoint `step.do("name", async () => {…})` pour que chaque étape soit retentée indépendamment en cas d'échec, sans rejouer tout le pipeline :

- **`ReindexWithVersionWorkflow`** — re-embed un corpus client entier lorsque la version du modèle d'embedding change. Versionne l'index résultant pour qu'un rollback se fasse par un simple échange de binding.
- **`BrowserExtractionWorkflow`** — extrait le texte des documents téléversés via le container Durable Object **openparse-cf**, puis chunke + met en queue les chunks pour embedding.
- **`AudioToRagWorkflow`** — transcrit l'audio avec Workers AI Whisper, exécute la diarisation des locuteurs via le Container **audio-services**, chunke la transcription et met en queue pour embedding.

Les trois sont déclarés dans `wrangler.toml` comme suit :

```toml
[[env.production.workflows]]
name = "reindex-with-version"
binding = "REINDEX_WITH_VERSION"
class_name = "ReindexWithVersionWorkflow"
```

### Couche 2b — Six Queues, calibrées pour la limite single-writer de D1

Le travail asynchrone passe par six Queues nommées, chacune avec `max_batch_size`, `max_concurrency` et `max_retries` calibrés selon le goulot d'étranglement du service en aval. Les queues chunking et api-jobs tournent à batch 10 / concurrence 5 car elles écrivent dans D1 (dont l'écrivain par shard est mono-thread) ; les queues vectorize et reindex tournent plus chaudes à 25/10 parce qu'elles appellent des API d'embedding externes. La queue d1-sync sérialise les écritures vers les shards D1 par vecteur pour que deux workflows ne courent pas après la même ligne.

La leçon qu'on aurait aimé apprendre plus tôt : **les Queues sont la seule chose qui maintient honnête un setup D1 shardé par client.** Sans elles, un seul locataire avec un gros upload affame tous les autres sur le même shard jusqu'au timeout de la requête.

### Couche 3 — R2, D1, KV et Hyperdrive

La couche de stockage est répartie sur quatre primitives, chacune choisie pour un pattern d'accès différent.

**R2 (quatre buckets par environnement)** — les bindings sont `FILES` (documents RAG), `AUDIO_FILES` (audio source pour les pipelines de transcription), `PUBLIC_UPLOADS` (pièces jointes du chat servies via des endpoints d'URL signées) et `TEMP_UPLOADS` (la zone d'atterrissage des uploads présignés). Les frais d'egress à zéro sont la raison d'affiche, mais la plus profonde est que **le même Worker peut signer une URL, accepter un upload de plusieurs Mo, lancer le BrowserExtractionWorkflow et servir le contexte RAG résultant — le tout sans sortir de l'edge Cloudflare.**

**D1 (shardé par locataire)** — chaque client a sa propre base D1, avec chunk + métadonnées dans des tables normales et une [table virtuelle FTS5](https://www.sqlite.org/fts5.html) pour la recherche texte-uniquement. Le sharding par client était la seule façon d'éviter le goulot single-writer sur les locataires chauds. Le coût est qu'on gère un fan-out à travers les shards dans la couche applicative ; le bénéfice est qu'un pic d'un locataire ne peut pas affamer les lectures d'un autre.

**KV (trois namespaces)** — `CACHE` héberge les résultats de validation JWT et la config locataire ; `EMBEDDING_CACHE` est la map content-hash → bytes-d'embedding avec un TTL de 30 jours (c'est la plus grosse réduction de coût que nous ayons faite — cacher les embeddings par hash de contenu a diminué la facture quotidienne de l'API d'embedding d'un ordre de grandeur) ; `VECTORIZE_CACHE` est la couche wrapper que le worker `vectorize-cache` utilise pour mémoriser les lookups vectoriels.

**Hyperdrive** — pooling de connexions Postgres à l'edge. Le binding `HYPERDRIVE` permet à un Worker d'ouvrir une connexion Postgres sans payer le coût du handshake TCP + auth à chaque requête. Nous l'utilisons pour la petite tranche de données relationnelles (état d'abonnement, ACL au niveau organisation) qui ne rentre pas dans le modèle shardé de D1.

### Couche 4a — Workers AI (cinq modèles en production)

Workers AI est la couche d'inférence sur la plateforme ; nous l'utilisons là où le modèle est assez petit pour qu'un aller-retour vers un fournisseur externe ne vaille pas la latence ou le coût :

| Modèle | Binding | Ce qu'il fait |
|---|---|---|
| `@cf/openai/moderation-stable` | sûreté du contenu | filtrer chaque entrée utilisateur par une passe de modération avant tout autre traitement |
| `@cf/huggingface/distilbert-sst-2-int8` | sentiment | classification rapide pour le routage + l'analytics |
| `@cf/meta/llama-3-8b-instruct` | génération de texte | le fallback petit-modèle pour la composition de réponses à faible enjeu |
| `@cf/google/gemma-3-12b-it-preview` | génération de texte | le modèle preview que nous utilisons pour A/B-tester les fine-tunes |
| `@cf/openai/whisper-large-v3-turbo` | transcription audio | appelé depuis l'AudioToRagWorkflow pour la transcription |

Pour la génération à l'échelle frontière (classe Claude, GPT-4) nous routons toujours vers des fournisseurs externes via Hyperdrive — le catalogue Workers AI grandit mais n'inclut pas encore les plus grands modèles dont nous avons besoin pour les requêtes les plus difficiles.

### Couche 4b — Containers, Email, Analytics, Tail Consumers

**Les Containers Durable Object** sont la pièce la plus récente de la stack : des images Docker complètes tournant sur le runtime Workers, scopées par instance DO. Nous en exécutons deux :

- **`openparse-cf`** est un parser PDF en Python empaqueté en Container, appelé par le `BrowserExtractionWorkflow` pour le chunking de documents.
- **`audio-services-container`** exécute ffmpeg + pyannote-audio pour la diarisation des locuteurs, appelé par l'`AudioToRagWorkflow`. Tier mémoire `standard-2` (6 Go) pour que les modèles les plus lourds se chargent sans OOM.

**Workers Email** — un Worker de notifications transactionnelles envoie les emails produit, et un Worker de routage gère le courrier entrant à `email.divinci.app/verified-emails`. Les deux utilisent la primitive Email Routing de Cloudflare plutôt qu'une API email externe.

**Analytics Engine** — un dataset Workers Analytics Engine sert de sink d'événements structurés pour l'analytics produit. Tout ce que nous aurions auparavant envoyé à Segment/Amplitude atterrit ici d'abord, puis est forwardé en aval.

**Tail Consumers (36 workers)** — chaque worker de production a sa liste `tail_consumers` peuplée d'un consumer `*_tail` dédié. Chaque consumer parse les logs d'invocation du Worker et forwarde les événements structurés vers notre pipeline d'observabilité. C'est ce fanout qui rend la topologie microservices à huit workers débogable.

**Déclencheurs Cron** — la production exécute un job de nettoyage des orphelins toutes les 30 minutes ; le stage tourne toutes les 10 minutes pour un feedback plus serré pendant qu'on itère sur la logique de nettoyage.

### Une note sur Vectorize — ce que nous n'utilisons pas, et pourquoi

Nous avons évalué Cloudflare **Vectorize** pendant la migration et nous ne l'avons finalement pas adopté comme magasin vectoriel principal. La décision n'avait rien à voir avec Vectorize lui-même — il s'est considérablement amélioré au cours de 2025–2026. La raison pour laquelle nous avons atterri sur **D1 FTS5 + un service d'embedding externe** était que notre architecture de récupération est hybride (lexicale + sémantique avec un re-ranker calibré au-dessus), et FTS5 dans D1 nous donnait la moitié lexicale gratuitement, sur le même shard que les métadonnées du document. Ajouter Vectorize aurait introduit un second modèle de cohérence — un index séparé qui doit rester en sync avec D1 — pour une amélioration marginale du recall aux volumes que nous opérons. Le nom du namespace KV `VECTORIZE_CACHE` est un reste de la période d'évaluation ; le worker derrière cache désormais des lookups d'embeddings, pas des résultats Vectorize.

Si notre modèle de récupération bascule vers une récupération dense-uniquement à très grande échelle, Vectorize est la prochaine étape naturelle. Une réponse honnête vaut mieux qu'une affirmation marketing.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> Ce que cela signifie pour nos clients

Faire partie de l'accélérateur Workers Launchpad signifie que nous aurons une collaboration encore plus approfondie avec l'équipe d'ingénierie de Cloudflare, un accès anticipé aux nouvelles fonctionnalités et les ressources pour repousser les limites du possible avec l'edge computing et l'IA.

Pour nos clients, cela se traduit par :

- **Réponses IA plus rapides** avec un déploiement global en périphérie
- **Fiabilité améliorée** grâce au SLA de disponibilité de 99,99% de Cloudflare
- **Meilleure confidentialité des données** avec traitement en périphérie
- **Fonctionnalités innovantes** alimentées par les produits Cloudflare de pointe
- **Infrastructure évolutive** qui grandit avec vos besoins

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Perspectives

Nous sommes incroyablement enthousiastes à propos de ce partenariat et des opportunités qu'il apporte. Alors que nous continuons à construire l'avenir de la collaboration d'entreprise alimentée par l'IA, la plateforme de Cloudflare restera au cœur de notre infrastructure, nous permettant d'offrir des expériences exceptionnelles aux équipes du monde entier.

<video muted loop playsinline webkit-playsinline preload="none" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-workshop-leonardo.webm" type="video/webm">
</video>
<p style="text-align: center; font-style: italic; color: #666; margin-top: -1rem; margin-bottom: 2rem;">Innovation à travers les âges : Construire l'avenir avec des principes intemporels</p>

Vous voulez en savoir plus sur la façon dont Divinci AI peut transformer le flux de travail IA de votre équipe ? [Demandez une démo](https://meetings.hubspot.com/michael-mooring/divinci-ai) pour voir notre plateforme en action.

---

**À propos du Cloudflare Workers Launchpad**

Le Workers Launchpad est le programme de startups de Cloudflare qui fournit du financement, un support technique et des ressources de mise sur le marché aux entreprises construisant sur la plateforme Workers. En savoir plus sur [la cohorte #6 et les autres entreprises innovantes](https://blog.cloudflare.com/workers-launchpad-006/) rejoignant ce programme.
