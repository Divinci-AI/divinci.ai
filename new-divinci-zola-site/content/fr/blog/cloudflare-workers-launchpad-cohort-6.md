+++
title = "Divinci AI rejoint le Cloudflare Workers Launchpad Cohort #6"
date = 2025-10-05T10:00:00+00:00
description = "Nous sommes ravis d'annoncer que Divinci AI a été accepté dans le programme d'accélération Cloudflare Workers Launchpad, cohorte #6. Découvrez comment nous exploitons la plateforme d'edge computing de Cloudflare pour construire des pipelines RAG sophistiqués et une infrastructure IA."
[taxonomies]
tags = ["company-news", "cloudflare", "infrastructure", "rag"]
[extra]
author = "Divinci AI Team"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/Divinci-Workers-Launchpad.svg"
+++

<video muted loop playsinline webkit-playsinline preload="metadata" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/divinci-cloudflare-workers-launchpad-cohort-6.webm" type="video/webm">
</video>

Nous sommes ravis de partager que **Divinci AI a été accepté dans le [Cloudflare Workers Launchpad Cohort #6](https://blog.cloudflare.com/workers-launchpad-006/)** ! Ce programme d'accélération soutient les startups innovantes construisant sur la plateforme d'edge computing de Cloudflare, et nous sommes honorés de faire partie de cette cohorte exceptionnelle.

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3m.08 4h.01"/></svg> Pourquoi Cloudflare Workers ?

Chez Divinci AI, nous construisons la prochaine génération d'outils de collaboration IA d'entreprise en mettant l'accent sur la fiabilité, la sécurité et les performances. La plateforme d'edge computing de Cloudflare a été essentielle pour atteindre ces objectifs, nous permettant de fournir des capacités IA sophistiquées avec une latence minimale à travers le monde.

<video muted loop playsinline webkit-playsinline preload="metadata" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-celestial-globe.webm" type="video/webm">
</video>
<p style="text-align: center; font-style: italic; color: #666; margin-top: -1rem; margin-bottom: 2rem;">Déploiement global en périphérie permettant l'IA à la vitesse de la pensée</p>

## <svg class="heading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="display: inline-block; vertical-align: middle; margin-right: 0.5rem;"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg> Notre infrastructure alimentée par Cloudflare

Nous avons architecturé toute notre plateforme autour de la suite de produits Cloudflare, créant une infrastructure puissante et évolutive qui prend en charge nos pipelines RAG (génération augmentée par récupération) avancés :

### **Cloudflare Workers & Workflows**
L'épine dorsale de notre plateforme, Cloudflare Workers alimente notre couche de calcul sans serveur, gérant des millions de requêtes avec des temps de réponse inférieurs à la milliseconde. Nous utilisons **Cloudflare Workflows** pour orchestrer des pipelines RAG complexes en plusieurs étapes qui récupèrent, traitent et synthétisent intelligemment les informations provenant de plusieurs sources.

### **D1 pour le stockage de morceaux RAG**
Nous exploitons **Cloudflare D1**, leur base de données SQL distribuée, pour stocker et interroger nos morceaux RAG de manière efficace. L'architecture en périphérie de D1 garantit que les morceaux de documents sont stockés près de nos utilisateurs, réduisant considérablement la latence de récupération et améliorant la qualité de nos réponses IA.

<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/d1-rag-storage.svg" alt="Architecture de base de données distribuée D1" style="width: 100%; max-width: 800px; margin: 2rem auto; display: block;" loading="lazy">

### **Vectorize pour la recherche sémantique**
**Cloudflare Vectorize** sert comme l'une de nos options de base de données vectorielle, permettant une recherche sémantique ultra-rapide parmi des millions d'embeddings de documents. Cela permet à nos systèmes IA de trouver le contexte le plus pertinent pour toute requête, quelle que soit sa formulation.

### **Workers AI pour les modèles open-source**
Nous intégrons **Cloudflare Workers AI** pour fournir l'accès à des modèles de langage open-source de pointe depuis Hugging Face, incluant **Llama 3**, **Mistral** et d'autres modèles state-of-the-art. Cela donne à nos clients d'entreprise la flexibilité de choisir le bon modèle pour leurs cas d'usage spécifiques tout en maintenant la confidentialité et le contrôle des données.

<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/workers-ai-models.svg" alt="Modèles open source Workers AI" style="width: 100%; max-width: 800px; margin: 2rem auto; display: block;" loading="lazy">

### **R2 pour le stockage multimédia**
**Cloudflare R2** gère tous nos besoins de traitement audio, vidéo et de téléchargement de fichiers utilisateur. Avec zéro frais de sortie et des API compatibles S3, R2 fournit un stockage d'objets de niveau entreprise qui évolue de manière transparente avec notre base de clients croissante.

### **API Shield pour la sécurité**
Alors que nous nous préparons à lancer nos API publiques, **Cloudflare API Shield** fournit une protection essentielle contre les abus, la limitation de débit et la validation de schéma. Cela garantit que nos API restent sécurisées, performantes et fiables pour tous nos partenaires d'intégration.

### **Expérimentation avec Cloudflare Containers**
Nous explorons également **Cloudflare Containers** alors que nous travaillons à déplacer toute notre infrastructure pour qu'elle soit principalement basée sur Cloudflare. Cela nous permettra d'exécuter des charges de travail encore plus complexes en périphérie tout en maintenant les performances et la fiabilité attendues par nos clients.

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

<video muted loop playsinline webkit-playsinline preload="metadata" data-lazy-video style="width: 100%; border-radius: 8px; margin: 2rem 0;">
    <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/renaissance-workshop-leonardo.webm" type="video/webm">
</video>
<p style="text-align: center; font-style: italic; color: #666; margin-top: -1rem; margin-bottom: 2rem;">Innovation à travers les âges : Construire l'avenir avec des principes intemporels</p>

Vous voulez en savoir plus sur la façon dont Divinci AI peut transformer le flux de travail IA de votre équipe ? [Demandez une démo](https://meetings.hubspot.com/michael-mooring/divinci-ai) pour voir notre plateforme en action.

---

**À propos du Cloudflare Workers Launchpad**

Le Workers Launchpad est le programme de startups de Cloudflare qui fournit du financement, un support technique et des ressources de mise sur le marché aux entreprises construisant sur la plateforme Workers. En savoir plus sur [la cohorte #6 et les autres entreprises innovantes](https://blog.cloudflare.com/workers-launchpad-006/) rejoignant ce programme.
