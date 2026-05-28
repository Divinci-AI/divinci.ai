+++
title = "Tests de régression automatisés pour LLM personnalisés en 2026"
description = "Une suite de régression qui détecte la dérive dans l'évaluation, pas seulement dans le modèle. Gates par tranche, juges calibrés, rejeu de traces de prod."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "images/automated-regression-testing-for-custom-llms-in-2026-hero.png"
reading_time = 13
summary = "La plupart des « régressions » de LLM sont en réalité des dérives de la suite d'évaluation elle-même — calibration du juge, couverture des tranches, modèle de prompt, index de récupération. Voici la suite qui détecte ces dérives, scorée par tranche avec un juge calibré et rejouée contre des traces de production en direct."
+++

*Notes du Cycle de Release — Partie 7*

Vendredi 16h47, vous avez expédié un ajustement de prompt d'un seul caractère. Le score d'évaluation agrégé est passé de 0,873 à 0,871 — bien à l'intérieur du seuil de bruit. Lundi matin, votre file d'attente de support est en feu à propos d'une classe de requêtes que vous aviez cessé de surveiller il y a six mois parce qu'elles étaient stables.

Rien n'a régressé dans le modèle. Le modèle est le même modèle. **C'est l'évaluation qui a dérivé sous vos pieds.** Six mois de croissance lente dans un segment client ne sont jamais entrés dans le jeu de données de référence, le prompt du juge a été calibré pour la dernière fois contre des humains en octobre, et l'index de récupération s'est silencieusement reconstruit mercredi dernier sur un modèle d'embedding rafraîchi.

C'est ce que l'article 6 soulignait — [le modèle est la bonne réponse environ une alerte sur sept](/fr/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/). Cela signifie que votre suite de régression doit détecter la dérive en elle-même, pas seulement dans le modèle. Cet article, c'est cette suite.

## Qu'est-ce qu'un test de régression pour un LLM personnalisé, au juste ?

Les tests de régression logiciels affirment `output == expected` pour des entrées fixes. Ils fonctionnent parce que la fonction est déterministe.

Un modèle de langage n'est pas une fonction au même sens. Le même prompt à température > 0 produit une distribution de complétions valides, et « valide » est multidimensionnel : a-t-il répondu à la question, la réponse est-elle ancrée dans le contexte récupéré, est-il resté à l'intérieur de l'enveloppe de sécurité, est-il revenu dans le budget de latence. Tester la régression d'un LLM personnalisé signifie donc **mesurer la distribution du comportement par rapport à une distribution de référence figée** — sur les tranches qui comptent pour vous, avec des juges calibrés contre des humains, sur des entrées qui ressemblent à votre trafic de production.

Trois choses doivent être en place avant que tout cela n'ait du sens :

1. Un **jeu de données de référence** qui ressemble à la production au niveau de la tranche, pas dans l'agrégat.
2. Un **juge calibré** — pas « nous utilisons GPT-5 comme juge », mais « nous avons mesuré Spearman ρ ≥ 0,7 contre trois évaluateurs humains, rafraîchi la semaine dernière ».
3. Un **manifeste de référence** — les poids exacts du modèle, le modèle de prompt, l'index de récupération et la version du juge qui ont noté ce qu'ils ont noté. Sans cela, vous ne pouvez pas savoir si le score a bougé parce que le modèle a changé ou parce que la règle a changé.

Divinci exécute ces trois éléments en tant qu'objets de première classe, liés par hash, scorés à chaque commit. Le reste de cet article explique comment les assembler.

## Pourquoi la plupart des suites de régression LLM échouent à détecter les vraies régressions

Le mode d'échec dominant en 2026 pour les LLM personnalisés est ce que l'équipe Sigma Inference de Tianpan a nommé le *Semver Lie* dans son postmortem d'avril 2026<sup><a href="#ref-1">[1]</a></sup> : une métrique agrégée reste stable ou s'améliore, tandis qu'une ou deux tranches de production régressent silencieusement. La tranche représentait moins de 5 % du trafic lorsque le test a été conçu, elle n'est donc jamais entrée dans le jeu de données de référence ; six mois plus tard, elle représente 12 % du trafic, le modèle s'y est dégradé, et le chiffre agrégé n'allait jamais le remarquer.

Nous avons examiné tous les postmortems publics de releases LLM des dix-huit derniers mois et le schéma se répète : **la suite affichait vert parce qu'elle mesurait la mauvaise chose.** Plus précisément :

- Le jeu de données de référence a été rédigé à la main par l'équipe au lancement et n'a jamais été re-stratifié contre des distributions de trafic décalées.
- Le prompt LLM-as-judge a été défini une seule fois et jamais re-calibré contre des étiquettes humaines. L'accord du juge s'est dégradé silencieusement<sup><a href="#ref-2">[2]</a></sup>.
- Les scores de référence ont été stockés sous forme de nombres bruts, pas comme des tuples `(model_sha, prompt_sha, judge_sha, dataset_sha, score)` — alors quand quelque chose régressait, personne ne pouvait dire lequel des quatre avait bougé.

Une suite de régression qui ne résout pas ces trois problèmes n'est qu'une étape CI qui passe au vert au moment du déploiement et vous donne une fausse confiance. Le correctif n'est pas « plus de cas ». Le correctif est une mesure **consciente des tranches, ancrée à une version, calibrée par juge**, à chaque release.

## Construire un jeu de données de référence qui survit à l'analyse par tranches

La composition à quatre seaux que nous livrons par défaut — échantillons de production 60 %, adversariaux 15 %, cas limites curés par des experts 15 %, rejeux d'échecs 10 % — est un point de départ raisonnable. Ce qui lui permet réellement de détecter les régressions, ce sont les **métadonnées de tranche** attachées à chaque cas.

Chaque entrée du jeu de données porte : entrée, comportement attendu (grille d'évaluation, pas chaîne exacte), contexte de récupération (le cas échéant), et une étiquette `slice` — domaine, segment d'utilisateur, intention de requête, langue, tranche de longueur, quelles que soient les décompositions importantes pour votre produit. La suite score **par tranche**, et toute tranche qui descend en dessous de son seuil bloque la release, même si le score agrégé a augmenté.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Composition du jeu de données de référence : 60 % échantillon de production, 15 % adversarial, 15 % cas limites experts, 10 % rejeux d'échecs, tous stratifiés sur l'ensemble des tranches">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Composition du jeu de données de référence — stratifié par tranche sur chaque axe</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Dimensionné pour ~500 cas. Les segments de barre sont proportionnels. La couverture par tranche est l'exigence dure, pas le ratio agrégé.</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">Échantillon de production</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Adversarial</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">Cas limites experts</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Rejeux</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">traces de production stratifiées · rafraîchies trimestriellement</text>
<text x="513" y="90" text-anchor="middle">jailbreaks · injection</text>
<text x="627" y="90" text-anchor="middle">limites de domaine · longue traîne</text>
<text x="722" y="90" text-anchor="middle">rejeux de postmortems ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">Chaque cas porte des étiquettes de tranche — la suite score chaque combinaison séparément</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">domaine</tspan> · juridique / méd / général</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">intention</tspan> · how-to / fait / refus</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">langue</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">longueur</tspan> · court / moyen / long</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">segment</tspan> · entreprise / PME</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">récupération</tspan> · ancré / ouvert</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">outil</tspan> · 0 / 1 / multi-étapes</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">nouveauté</tspan> · vu / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">composition × tranches = grille de scoring</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Scoré par tranche à chaque release — Spearman ρ ≥ 0,7 vs référence, par tranche</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">Toute tranche qui franchit son seuil bloque la release. Le score agrégé est informatif uniquement.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Le diagramme est structurel. Les axes de stratification et les seuils par tranche sont configurés par produit dans le manifeste de release Divinci. Interne — défini dans nos propres déploiements.</figcaption>
</figure>

Deux règles opérationnelles que nous avons appris à appliquer :

**Rééchantillonner trimestriellement.** Les distributions de trafic de production se déplacent plus vite que la plupart des équipes ne le mesurent. Nous re-stratifions le seau d'échantillon de production contre les 90 derniers jours de trafic chaque trimestre ; si une tranche a dépassé 5 % du trafic et représentait moins de 2 % du jeu de données de référence, elle est rétroactivement comblée avant l'expédition de la prochaine release.

**Chaque postmortem ajoute un cas.** Une régression qui a atteint la production et qui n'a pas été détectée est un cas qui manquait au jeu de données. Nous l'ajoutons au seau de rejeux dans les 48 heures suivant le postmortem et l'étiquetons avec la tranche qui l'a fait remonter.

## Comment détecter la dérive avant les utilisateurs ?

Il existe quatre types distincts de dérive, et une suite de régression qui ne surveille que le dernier est une suite de régression qui manque la plupart des régressions.

| Type de dérive | Ce qui bouge | Signal de détection | Action |
|---|---|---|---|
| **Dérive de qualité** | Le score du juge pour une tranche fixe | Spearman ρ par tranche vs référence chute | Bloquer la release ; diagnostiquer selon [l'arbre de l'article 6](/fr/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) |
| **Dérive de couverture** | Distribution du trafic de production vs distribution du jeu de référence | Divergence KL entre proportions de tranches | Rééchantillonner le jeu de référence |
| **Dérive du juge** | Accord du modèle juge avec les humains | Spearman ρ vs un jeu d'audit étiqueté par des humains figé | Recalibrer le prompt du juge ou remplacer le juge |
| **Dérive de production** | Scores de production live vs scores hors ligne sur le même modèle | Écart de score lors du rejeu de traces de production | Investiguer la récupération / prétraitement / runtime |

La dérive de qualité est celle que la plupart des suites mesurent ; les trois autres sont là où se cachent généralement les régressions du vendredi après-midi. Divinci suit les quatre contre le manifeste de référence, avec la ventilation du score par tranche affichée sur chaque PR et un job hebdomadaire de calibration du juge qui signale la dérive avant qu'elle ne s'accumule.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Un graphique de 30 jours montrant le score agrégé d'achèvement de tâche restant stable à 0,87 tandis que la tranche du domaine médical chute silencieusement de 0,88 à 0,74">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Le Semver Lie, visualisé — 30 jours de score d'achèvement de tâche</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">L'agrégat (vert foncé) tient stable. La tranche médicale (rouge) régresse silencieusement. Les gates agrégées ne se déclenchent jamais.</text>
<g transform="translate(80, 100)">
<line x1="0" y1="0" x2="0" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<line x1="0" y1="250" x2="640" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">0,95</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">0,90</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">0,85</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">0,80</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0,75</text><line x1="-4" y1="200" x2="0" y2="200" stroke="#1e3a2b"/>
<text x="-10" y="254" text-anchor="end">0,70</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="0" y="268" text-anchor="middle">j-30</text>
<text x="160" y="268" text-anchor="middle">j-22</text>
<text x="320" y="268" text-anchor="middle">j-15</text>
<text x="480" y="268" text-anchor="middle">j-7</text>
<text x="640" y="268" text-anchor="middle">aujourd'hui</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">seuil de gate agrégée — 0,89</text>
<polyline points="0,40 50,42 100,38 150,40 200,42 250,38 300,40 350,38 400,40 450,42 500,38 550,40 600,42 640,40" fill="none" stroke="#5a7a8f" stroke-width="2"/>
<circle cx="640" cy="40" r="4" fill="#5a7a8f"/>
<polyline points="0,60 50,58 100,62 150,60 200,58 250,60 300,62 350,60 400,58 450,60 500,62 550,60 600,58 640,60" fill="none" stroke="#2d5a4f" stroke-width="3.5"/>
<circle cx="640" cy="60" r="5" fill="#2d5a4f"/>
<polyline points="0,72 50,74 100,70 150,72 200,76 250,72 300,74 350,72 400,70 450,72 500,74 550,72 600,76 640,74" fill="none" stroke="#7a8a4a" stroke-width="2"/>
<circle cx="640" cy="74" r="4" fill="#7a8a4a"/>
<polyline points="0,64 50,68 100,66 150,72 200,80 250,92 300,108 350,128 400,150 450,168 500,184 550,196 600,206 640,214" fill="none" stroke="#a04848" stroke-width="3.5"/>
<circle cx="640" cy="214" r="5" fill="#a04848"/>
<g font-family="'DM Sans', sans-serif" font-size="11">
<rect x="656" y="30" width="120" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="2"/>
<text x="664" y="46" font-weight="700" fill="#5a7a8f">tranche juridique</text>
<text x="722" y="46" fill="#5a7a8f">0,910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">agrégat</text>
<text x="722" y="72" fill="#2d5a4f">0,872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">général</text>
<text x="722" y="98" fill="#7a8a4a">0,863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">tranche médicale</text>
<text x="664" y="232" fill="#a04848">0,743 aujourd'hui · violation ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">la gate de tranche se déclencherait ici ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Reconstruction stylisée du schéma du postmortem Tianpan Sigma<sup><a href="#ref-1">[1]</a></sup> en utilisant la nomenclature interne de tranches Divinci. Les valeurs spécifiques sont illustratives.</figcaption>
</figure>

## Évaluation multidimensionnelle — scorer quatre choses à la fois, par tranche

Un score composite unique est un signal pire que quatre scores scalaires. Nous appliquons des gates sur quatre dimensions :

- **Achèvement de la tâche** — la réponse a-t-elle effectivement répondu à la question, scorée par un juge calibré contre une grille d'évaluation. Conscient des tranches.
- **Fidélité** — pour toute réponse qui a référencé un contexte récupéré, chaque affirmation est-elle ancrée dans ce contexte. L'hallucination apparaît ici en premier.
- **Sécurité** — exactitude des refus, résistance au jailbreak, exposition PII / politique. Presque toujours une gate à ≥ 0,99 taux de passage ; la sécurité est un mur dur, pas un compromis souple.
- **Budget de latence** — p95 dans le SLA de la tranche. Un changement de prompt qui a doublé les tokens par réponse est une régression même si la qualité a augmenté.

Chaque dimension a sa propre référence par tranche et son propre seuil par tranche. Nous ne les combinons jamais en un scalaire pondéré unique au moment de la gate ; nous affichons quatre scores par tranche et bloquons sur celui qui a dépassé son seuil en premier. Un modèle qui a gagné 4 points d'achèvement de tâche au coût d'un point de fidélité sur la tranche médicale reste une régression.

## Quelles gates doivent bloquer le déploiement d'un LLM personnalisé ?

Nous exécutons une architecture à trois couches, chaque couche bloquant une étape différente du pipeline ([voir l'article 1 pour la taxonomie des étapes](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)).

**Couche 1 — Smoke (à chaque commit, ~90 secondes).** Vingt à trente cas critiques tirés des tranches à plus fort impact. Détecte les régressions catastrophiques avant que la suite complète ne dépense du compute. Si le smoke échoue, le reste ne s'exécute pas.

**Couche 2 — Suite complète (à chaque PR, ~12 minutes).** Le jeu de données de référence complet, scoré par tranche sur les quatre dimensions. Spearman ρ conscient des tranches contre le manifeste de référence. Un dépassement de seuil bloque la fusion. Le commentaire de PR liste exactement quelle tranche sur quelle dimension a bougé de combien, avec cinq exemples de cas en échec.

**Couche 3 — Comparaison de référence (release candidates, ~25 minutes).** Le modèle candidat est rejoué contre les 14 derniers jours de traces de production — le *rejeu en boucle fermée de traces de production* que nous avons livré dans [l'article 1](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/). Le même juge calibré qui score le jeu de données de référence score aussi les sorties du rejeu. Toute tranche dont les scores rejoués divergent des scores hors ligne de plus que son seuil bloque la release. Cette couche est ce qui détecte la dérive que le jeu de données de référence ne connaît pas encore.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Arbre de décision de gate à trois couches : tests smoke à chaque commit, suite complète à chaque PR, rejeu de traces de production sur les release candidates">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Gate de régression à trois couches — chaque bloc échoue vite, chaque couche ajoute de la profondeur</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① Smoke · à chaque commit</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cas : 20–30 critiques</text>
<text x="14" y="82">Horloge : ~90 s</text>
<text x="14" y="102">Dims : tâche + sécurité seul.</text>
<text x="14" y="122">Tranches : top 3 par volume</text>
<text x="14" y="148" font-weight="600">Bloque :</text>
<text x="14" y="168">échecs catastrophiques</text>
<text x="14" y="186">sorties malformées</text>
<text x="14" y="204">violations du mur sécurité</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">fail-fast — suite complète</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② Suite complète · chaque PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cas : complet ~500</text>
<text x="14" y="82">Horloge : ~12 min</text>
<text x="14" y="102">Dims : tâche / fid / sécu / lat</text>
<text x="14" y="122">Tranches : toutes stratifiées</text>
<text x="14" y="148" font-weight="600">Bloque :</text>
<text x="14" y="168">ρ par tranche &lt; 0,7</text>
<text x="14" y="188">toute métrique sous le seuil</text>
<text x="14" y="208">accord du juge &lt; 0,65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">le commentaire PR liste où</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ Rejeu · release candidates</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cas : 14j de traces live</text>
<text x="14" y="82">Horloge : ~25 min</text>
<text x="14" y="102">Dims : les quatre · par tranche</text>
<text x="14" y="122">Source : magasin de traces prod</text>
<text x="14" y="148" font-weight="600">Bloque :</text>
<text x="14" y="168">écart score hors ligne ↔ rejeu</text>
<text x="14" y="188">dérive dans des tranches pas</text>
<text x="14" y="206">encore dans le jeu de référence</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">dernière gate avant rollout</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">Les trois couches scorent contre le même manifeste de référence — (model_sha, prompt_sha, retrieval_sha, judge_sha) — un score qui bouge identifie donc <tspan font-weight="600" fill="#1e3a2b">quelle</tspan> dimension a dérivé, pas seulement <tspan font-weight="600" fill="#1e3a2b">qu'il y a eu</tspan> dérive.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Les chiffres d'horloge sont internes — mesurés sur les runners CI de production de Divinci pour un client représentatif avec ~500 cas de jeu de référence et ~14 jours de traces de production.</figcaption>
</figure>

## Calibrer votre juge avant de faire confiance à un seul score qu'il produit

LLM-as-judge est ce qui permet à tout cela de passer à l'échelle au-delà de quelques centaines de cas. C'est aussi là qu'une suite de régression cesse silencieusement de fonctionner, parce que le juge n'a aucune obligation de rester calibré à mesure qu'il est mis à jour ou que votre distribution de données se déplace.

Nous calibrons chaque prompt de juge contre un jeu d'audit étiqueté par des humains figé d'au moins 100 cas stratifié sur les mêmes tranches que le jeu de données de référence, et nous relançons la calibration chaque semaine. La barre à laquelle nous expédions est **Spearman ρ ≥ 0,7** contre la médiane des évaluateurs humains, avec **κ de Cohen ≥ 0,6** sur les jugements binaires de sécurité. Les deux sont au-dessus du seuil où il a été démontré que les juges de style MT-Bench suivent les évaluateurs humains au niveau de l'accord inter-humains<sup><a href="#ref-2">[2]</a></sup>.

Lorsque la calibration hebdomadaire passe sous le seuil, le juge est automatiquement retiré et l'ingénieur d'évaluation de garde est appelé. Le pipeline de release maintient les candidats ouverts plutôt que de les bloquer sur un juge qui ne mesure plus ce qu'il mesurait auparavant.

```bash
# Exécuter le job hebdomadaire de calibration du juge
curl -X POST https://api.divinci.ai/v1/regression/judges/calibrate \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "judge_id":     "rubric-v7",
    "audit_set":    "human-labels-2026-04",
    "min_spearman": 0.70,
    "min_kappa":    0.60,
    "on_fail":      "retire_judge_and_page"
  }'
```

## Le différenciateur Divinci — rejeu en boucle fermée de traces de production

La gate de Couche 3 est la partie que la plupart des suites de régression n'ont pas. Le flux est le même que celui que nous avons livré dans l'article 1, avec une spécialisation pour les tests de régression : chaque release candidate voit son score sur le jeu de données de référence hors ligne comparé, tranche par tranche, à son score sur une fenêtre de 14 jours de traces de production rejouées. Le jeu de données de référence mesure ce que nous attendions du modèle. Le rejeu mesure ce que le modèle aurait effectivement fait la semaine dernière.

Lorsque ces deux scores divergent de plus que le budget d'écart par tranche, la release est bloquée. La discordance est le signal : soit le jeu de données de référence n'est plus représentatif (dérive de couverture), soit le candidat se comporte différemment sur des traces façonnées par le prétraitement et la récupération de production (dérive de production). Dans les deux cas, vous le découvrez avant les utilisateurs.

Le juge qui score l'exécution hors ligne est le même juge qui score l'exécution de rejeu. Le journal d'audit enregistre les deux ensembles de scores, les deux versions du juge, les ID de trace rejoués, et l'écart qui a déclenché le blocage. L'écart lui-même est le signal diagnostique le plus utile que nous ayons, et c'est ce qui est remis à celui qui reprend [l'arbre de diagnostic de l'article 6](/fr/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) ensuite.

## Ancrer le jeu de données de référence avec un reçu vindex

Chaque score dans la suite n'a aucun sens si vous ne pouvez pas le reproduire plus tard. Nous hachons le jeu de données de référence à chaque release et chaînons ce hash dans un reçu vindex aux côtés du SHA du modèle, du SHA du prompt, du SHA du juge et du registre de calibration. Le reçu est ancrable de manière externe — les auditeurs peuvent rejouer notre exécution de régression exacte six mois plus tard et vérifier les scores que nous avons revendiqués.

```json
{
  "release_id": "rel_3f1a-2026-05-26",
  "model": { "sha": "0c1f9…", "weights_uri": "r2://models/custom-v7.2", "open_weights": true },
  "prompt": { "sha": "c4a8e…", "template_id": "support-v3.4" },
  "retrieval": { "index_sha": "b21f0…", "embedder": "e5-mistral-7b-instruct" },
  "judge": { "sha": "d8e21…", "rubric_id": "rubric-v7", "spearman_vs_humans": 0.74 },
  "dataset": { "sha": "a90b1…", "n": 512, "slices": 17, "stratified_at": "2026-04-30" },
  "scores": { "aggregate": 0.872, "by_slice": { "/* … */": "/* scalaires par tranche */" } },
  "replay": { "trace_window_days": 14, "n_traces": 8430, "max_gap": 0.018 },
  "vindex_anchor": "sha256:f0bfd2…",
  "verifiable_at": "https://vindex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**Réserve sur les poids ouverts.** Le reçu ci-dessus porte la provenance des poids uniquement lorsque le modèle est à poids ouverts — vindex ancre les octets de poids réels. Pour les modèles à API fermée (modèles managés OpenAI / Anthropic / Google), le reçu porte toujours la chaîne de décision — chaque score de gate, chaque résultat de juge, le registre de calibration — mais le champ de poids est vide, et vous ne pouvez pas vérifier indépendamment l'artefact du modèle. Nous le disons dans le reçu et dans la [documentation de conformité](/fr/compliance/) pour ne pas donner une fausse impression aux auditeurs. Les releases qui bénéficient le plus d'une chaîne vindex complète sont celles où vous contrôlez les poids.

## Un calendrier d'implémentation en quatre phases que nous avons réellement livré

Les équipes qui essaient d'expédier l'architecture complète en semaine un calent sur l'outillage. L'ordre ci-dessous est celui qui fonctionne.

**Phase 1 — Référence (semaine 1).** Tirez un échantillon stratifié des 30 derniers jours de traces de production. Faites étiqueter à la main l'achèvement de tâche par deux ingénieurs sur 100 cas chacun. Calculez l'accord inter-évaluateurs (objectif κ de Cohen ≥ 0,6). Le chiffre que vous obtenez est votre référence humaine de départ ; tout le reste est calibré contre cela.

**Phase 2 — Harness (semaines 2–3).** Mettez en place le harness d'évaluation sur le jeu de données de 100 cas. Ajoutez un juge calibré contre vos étiquettes humaines. Vérifiez que le harness reproduit les scores humains à ρ ≥ 0,7. La plupart des équipes découvrent que leur premier prompt de juge échoue à ce test et le réécrivent deux fois — c'est normal.

**Phase 3 — Gates (semaines 3–4).** Câblez le harness dans CI comme avertissement, pas comme blocage. Observez-le pendant deux semaines. Les seuils que vous découvrez en observant les taux de faux positifs sont les seuls seuils qui survivent. Promouvez en blocage uniquement lorsque le taux de faux positifs est inférieur à 5 %.

**Phase 4 — Boucle de rejeu (en continu).** Une fois que les gates bloquent de manière fiable, activez la couche de rejeu de traces de production. C'est là que l'écart de couverture de tranche fait surface, et là où chaque postmortem commence à rajouter des cas dans le jeu de données de référence.

## Ce que cela ne résout pas

Trois limites honnêtes, de la même manière que nous les avons formulées à chaque article de cette série.

1. **La dérive de la suite est un travail sans fin.** Les tests de régression sont une infrastructure, pas un projet. Le jeu de données de référence doit être re-stratifié chaque trimestre, le juge re-calibré chaque semaine, les budgets de seuil re-ajustés à chaque postmortem. Il n'existe aucune version de cela où vous expédiez une suite et partez.
2. **Un juge parfaitement calibré reste un modèle.** Spearman ρ = 0,74 contre les évaluateurs humains signifie que grosso modo un quart des appels du juge sont en désaccord avec la médiane humaine. Ce désaccord résiduel est le seuil de bruit sur chaque score. Nous l'affichons explicitement dans chaque rapport de release ; les équipes qui oublient sa présence finiront par en être surprises.
3. **Les backings d'API fermée plafonnent ce que vous pouvez vérifier.** Avec un modèle d'API fermée, la suite de régression mesure le comportement mais ne peut pas vérifier la provenance des poids. Si vous avez besoin d'une reproductibilité complète — industries régulées, déploiements audités — le compromis se situe sur le choix du modèle, pas sur la suite.

## La suite

L'article 8, le dernier de cette série, boucle la boucle à l'intérieur de la CI. Là où cet article et l'article 5 portaient sur ce qui s'exécute aux gates, le suivant porte sur la couche CI qui produit les candidats que les gates notent en premier lieu — évaluation pré-merge, tests de contrat pour les modèles de prompt, et comment dimensionner la flotte CI pour une suite d'évaluation de 12 minutes sans faire exploser le budget. C'est la couche d'ingénierie sous tout ce dont nous avons parlé jusqu'ici.

## FAQ

**Quelle est la différence entre l'évaluation LLM et les tests de régression LLM ?**

L'évaluation mesure si un modèle atteint une barre de qualité à un instant donné, contre une grille absolue. Les tests de régression mesurent si un candidat se comporte de la même façon qu'une référence figée, par tranche, sur plusieurs dimensions. C'est la référence qui en fait un test de régression — Divinci livre les deux, et le mode régression épingle (model_sha, prompt_sha, judge_sha, dataset_sha) pour qu'un score qui bouge identifie quelle entrée a bougé.

**Combien de cas un jeu de données de référence doit-il contenir ?**

Moins que vous ne le pensez, mieux stratifiés que vous ne le pensez. Nous avons livré une couverture de régression utile avec 200 cas sur cinq tranches bien définies et vu des jeux de données de 5 000 cas qui rataient tout ce qui comptait parce qu'ils n'étaient pas stratifiés. Commencez à 200, stratifiés, puis faites croître le seau de rejeu cas par cas à partir des postmortems.

**Devrais-je utiliser des évaluateurs humains ou LLM-as-judge ?**

Les deux, avec les humains qui calibrent le juge. Les humains ne peuvent pas suivre le volume dont a besoin une gate CI de cycle de release. Le juge remplit le volume, les humains calibrent le juge — mesuré chaque semaine avec Spearman ρ ≥ 0,7. L'un ou l'autre seul est un mode d'échec.

**Comment tester des sorties non déterministes ?**

Scorer la distribution, pas la chaîne. Scorer avec une grille que le juge peut appliquer à travers les formulations, et exécuter chaque entrée trois à cinq fois à température > 0 afin que le score conscient des tranches porte sur une distribution de complétions plutôt que sur un échantillon unique. Resserrer la température uniquement pour les cas qui ont véritablement besoin de sorties déterministes (appels d'outils à sortie structurée, classification).

**Quelles métriques privilégier pour la première gate de qualité CI ?**

Achèvement de tâche et une gate de sécurité. Les deux par tranche. Ajouter plus de dimensions avant que les deux premières ne soient calibrées produit du bruit ; les équipes qui en expédient davantage finissent généralement par bloquer sur le bruit. Ajoutez la fidélité ensuite lorsque vous activez la récupération ; ajoutez la latence une fois que les deux premières sont stables.

## Références

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 avril 2026. Le mode d'échec nommé de 2026 pour l'analyse de régression consciente des tranches ; les scores agrégés tiennent stable tandis qu'une tranche à faible volume régresse silencieusement.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Preuve empirique que des juges LLM forts s'accordent avec les évaluateurs humains à des niveaux d'accord approximativement inter-humains (≈ 80 %) sur des tâches ouvertes, avec des modes d'échec rapportés que les audits de calibration contre les humains sont conçus pour détecter.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. Le résultat fondateur sur l'oubli catastrophique dans les réseaux neuronaux affinés — pourquoi un LLM personnalisé affiné doit être soumis à des tests de régression pour perte de capacité générale, pas seulement pour gain sur la tâche cible.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> Le contraste API fermée : gates sur les métriques d'infrastructure (latence, erreurs, CPU) plutôt que sur la qualité sémantique par tranche.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. Le coefficient de corrélation de rang qui ancre la gate consciente des tranches — robuste à la dérive de l'échelle de scoring du juge, ce qui est la propriété dont nous avions besoin.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> La référence inter-industrielle pour « à quelle fréquence les déploiements provoquent des incidents » et « à quelle vitesse vous récupérez ». Les suites de régression qui bloquent à la gate font baisser la première métrique ; le rollback instantané ([article 5](/fr/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) fait baisser la seconde.
  </li>
</ol>
