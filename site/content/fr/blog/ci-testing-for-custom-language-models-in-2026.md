+++
title = "Tests CI pour les modèles de langage personnalisés en 2026"
description = "Tests de contrat, budget smoke, dimensionnement de flotte tenant compte des coûts, et CI fantôme. Comment maintenir une suite d'évaluation de 12 minutes praticable sur chaque PR sans ralentir l'équipe."
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
summary = "La suite de régression du post 7 coûte de l'argent réel à exécuter sur chaque PR. Voici comment nous conservons la même couverture pour une fraction du coût — tests de contrat infra-seconde, couche smoke de 90 secondes, cache d'embeddings + batching du juge, et fenêtre fantôme de 2 semaines avant qu'un gate ne commence à bloquer. Le post final de la série."
+++

*Notes du cycle de release — Partie 8 (finale)*

Vous livrez la suite de régression du [post 7](/fr/blog/automated-regression-testing-for-custom-llms-in-2026/). Elle fonctionne. Les gates conscients des tranches attrapent de vrais bugs. Le juge calibré tient bon.

Puis votre responsable d'ingénierie vous demande combien coûte son exécution sur chaque PR. Vous faites la multiplication : ~12 minutes d'inférence du juge par PR, 60 PR par jour, quatre dimensions × dix-sept tranches, et la facture est bien réelle. Pire encore, chaque développeur attend désormais 12 minutes pour une coche verte sur une coquille d'une ligne dans un prompt. La vélocité chute<sup><a href="#ref-1">[1]</a></sup>, l'équipe râle, quelqu'un propose « il n'y a qu'à lancer les gates la nuit » — ce qui est précisément la manière d'abandonner tout ce que les gates étaient censés faire.

La solution n'est pas moins de tests. La solution est **tester par couches, avec l'essentiel du signal qui arrive dans les quatre-vingt-dix premières secondes.** Ce post traite de ce qui tourne sous la suite de gates : tests de contrat infra-seconde, couche smoke serrée, flotte consciente des coûts, et fenêtre fantôme de deux semaines avant qu'un nouveau gate ne bloque qui que ce soit.

Ceci est le post 8, le dernier de cette série. À la fin, vous aurez la vue d'ensemble — du [pipeline en quatre étapes](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) jusqu'à la fixture de test de contrat qui s'exécute sur chaque commit.

## Que signifie la CI pour un modèle de langage personnalisé ?

La CI pour un LLM personnalisé, c'est le travail que la suite de gates n'a pas à refaire. Le gate note la qualité sémantique ; la CI attrape tout ce qui rendrait le score du gate sans signification avant que le gate ne dépense un seul token de juge.

Les tests de contrat tournent en millisecondes et vérifient que les templates de prompts s'affichent toujours, que les schémas d'appels d'outils se parsent toujours, que les index de retrieval répondent toujours, que le manifeste référence toujours des hashs qui existent réellement. Ils sont déterministes, gratuits, et la seule raison pour laquelle le reste du pipeline peut se permettre d'exister. Une pull request qui casse le template de prompt devrait échouer en 200 ms, pas après 12 minutes d'inférence du juge à scorer du n'importe quoi.

La couche contrat est la différence entre une facture CI qui croît linéairement avec le volume de PR et une qui ne croît pas. Le runner CI de Divinci dépense > 90 % de son budget juge en évaluation sémantique réelle, pas sur des PR qui auraient échoué à un check de schéma. Ce ratio est le chiffre phare.

## Pourquoi la CI traditionnelle échoue pour les LLM — à travers le prisme du coût

Les posts [1](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) et [7](/fr/blog/automated-regression-testing-for-custom-llms-in-2026/) ont couvert pourquoi la CI déterministe échoue pour un modèle génératif. La version de cette histoire qui nous intéresse ici porte sur le **coût** de ces quatre propriétés, pas sur leur existence.

| Propriété des LLM | Échec de la CI traditionnelle | Forme du coût |
|---|---|---|
| Sorties non déterministes | Les assertions d'égalité exacte sont instables | Les ré-exécutions amplifient le coût linéairement avec le taux d'instabilité |
| Qualité multidimensionnelle | Un booléen unique est non informatif | Chaque dimension est un appel juge séparé (payant) |
| Dérive du fournisseur | Un `gpt-4-2024-01-01` épinglé est silencieusement retiré | Pic de recalibration lorsqu'un fournisseur déprécie un checkpoint |
| Effets de prompt non locaux | Un test unitaire local ne peut pas attraper l'effet | Les changements de forme de distribution se produisent entre PR, pas en leur sein — il faut ré-exécuter toute la suite, pas un delta |

L'architecture CI doit rendre chacune de ces propriétés abordable. Les tests de contrat traitent les propriétés 1 et 3 à moindre coût. Les tests smoke traitent partiellement la propriété 4. Seule la suite complète traite la propriété 2 — et seulement sur les PR qui en ont vraiment besoin.

## Le mille-feuille CI — de l'infra-seconde aux vingt-cinq minutes

L'architecture que nous livrons comporte quatre couches, chacune gagnant son calcul en attrapant ce que les couches moins chères en dessous ne peuvent pas. Le cadrage conscient des tranches de chaque couche suit la même leçon que celle rendue explicite par le post-mortem [Semver Lie de Tianpan](/fr/blog/automated-regression-testing-for-custom-llms-in-2026/)<sup><a href="#ref-4">[4]</a></sup> : les signaux agrégés mentent ; les signaux par tranche attrapent ce que les agrégats cachent.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Architecture CI à quatre couches : tests de contrat infra-seconde, smoke 90 s, suite complète 12 minutes, replay de traces production 25 minutes">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Mille-feuille CI — chaque couche resserre l'entonnoir des PR atteignant la suivante</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">La plupart des PR ne touchent que les deux couches du haut. Les chiffres de coût par PR sont internes — mesurés sur la CI production de Divinci.</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① Contrat · chaque commit · &lt; 1 s · ~0,00 $</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">schéma · rendu template · denylist · intégrité manifeste · vivacité index</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100 % des commits</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② Smoke · chaque PR · ~90 s · ~0,05 $</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">20 à 30 cas critiques sur les 3 tranches du haut · tâche + sécurité uniquement</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100 % des PR</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ Suite complète · PR prompt / modèle / retrieval · ~12 min · ~0,80 $</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500 cas · 4 dimensions · toutes les tranches · gates Spearman par tranche</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~22 % des PR</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ Replay de traces production · candidats à la release · ~25 min · ~2,40 $</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">fenêtre de replay 14 jours · même juge calibré · analyse d'écart offline ↔ replay</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~4 % des PR</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">Coût agrégé par PR (pondéré par l'entonnoir) : ~0,27 $. Temps mur agrégé p95 : ~3,4 min.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Temps mur des couches, coût par couche et ratios d'entonnoir sont internes — mesurés sur la CI production Divinci pour un client représentatif (~500 cas de jeu de données golden, 17 tranches, ~60 PR/jour).</figcaption>
</figure>

La forme du coût est le design. ~74 % des PR ne dépensent jamais un token de juge — contrat ou smoke suffit. Les PR qui atteignent la suite complète sont celles qui ont touché un prompt, une config de modèle, un index de retrieval, ou du code d'évaluation — exactement les changements pour lesquels la suite de gates est le seul signal qui vaille la peine d'être cru. Les candidats à la release sont la petite part qui atteint la couche 4.

## Les tests de contrat — l'avantage déloyal

Les tests de contrat sont la première ligne, la plus économique, et celle que la plupart des équipes sautent parce qu'ils semblent indignes d'un « pipeline d'évaluation IA ». Ce sont aussi le lieu où 30 à 40 % des régressions potentielles échouent réellement dans les suites de nos clients, avant qu'un seul juge n'ait été appelé.

La couche contrat affirme cinq choses et rien d'autre :

1. **Rendu du template de prompt.** Chaque template s'affiche par rapport à une fixture canonique sans variables non liées, boucles incontrôlées ou inclusions de type Jinja cassées.
2. **Schéma d'appel d'outil.** Le schéma d'argument de chaque outil déclaré se parse, le JSONSchema est valide, et le prompt rendu référence effectivement tous les slots requis.
3. **Intégrité du manifeste.** Chaque SHA du manifeste de release — modèle, prompt, index de retrieval, juge, jeu de données — correspond à un artefact qui existe dans le registre. Les pointeurs orphelins échouent ici, pas trois couches plus loin.
4. **Vivacité de l'index.** L'index de retrieval répond à une requête connue dans les délais. Un index reconstruit qui a silencieusement cassé le retrieval remonte ici, pas en production.
5. **Denylist et budget de tokens.** Tout template de prompt qui introduit un token interdit, dépasse le budget de tokens par appel ou s'affiche au-delà de la fenêtre de contexte échoue ici. Le scoring de similarité sémantique heuristique<sup><a href="#ref-6">[6]</a></sup> est également suffisamment économique pour tourner à la couche contrat pour la couverture de denylist en correspondance floue lorsque le matching de chaîne littérale est insuffisant.

```bash
# Une invocation représentative de test de contrat — tourne en environ 600 ms
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

Aucun de ces appels n'appelle de juge. Aucun n'est non déterministe. Aucun ne coûte une somme mesurable. Et chacun d'eux écarte toute une classe d'alertes « la suite de gates dit que la tranche médicale a régressé » qui auraient gaspillé 12 minutes complètes d'inférence du juge à scorer des sorties que le modèle n'aurait jamais pu produire correctement en premier lieu.

## La couche smoke — 90 secondes, ~0,05 $ par PR

Si la couche contrat est l'avantage déloyal économique, la couche smoke est celle qui attrape effectivement les régressions pour moins que le prix d'un café. Vingt à trente cas tirés des tranches au plus fort volume, scorés sur **achèvement de tâche et sécurité uniquement**, pas de fidélité, pas de latence, pas de vérifications ancrées dans le retrieval. Chaque PR exécute cela. Cela prend environ 90 secondes parce que les cas sont batchés en un seul appel juge avec un schéma de sortie structurée, et parce que le juge est le juge calibré économique — pas celui de pleine qualité utilisé pour les candidats à la release.

Nous suivons quelle couche a attrapé chaque correctif livré dans un journal de régression, et l'histogramme est resté constant sur les six derniers mois dans les déploiements clients :

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Diagramme à barres montrant où les régressions sont attrapées : 31 % à la couche contrat, 27 % au smoke, 28 % à la suite complète, 11 % au replay, 3 % s'échappent en production">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Où les régressions sont attrapées — par couche, sur les 6 derniers mois sur les déploiements clients</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">La plupart des régressions meurent dans les couches les moins chères. Les couches coûteuses gagnent leur coût sur le résiduel.</text>
<g transform="translate(90, 100)">
<line x1="0" y1="200" x2="780" y2="200" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">40 %</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">30 %</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">20 %</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">10 %</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0 %</text>
</g>
<g>
<rect x="40" y="45" width="120" height="155" fill="#7a8a4a" stroke="#1e3a2b" stroke-width="1"/>
<text x="100" y="36" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">31 %</text>
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Contrat</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1 s · 0,00 $</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27 %</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Smoke</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90 s · 0,05 $</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28 %</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Suite complète</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12 min · 0,80 $</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11 %</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Replay</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25 min · 2,40 $</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3 %</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">Échappées</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ rollback</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Agrégat glissant sur six mois sur les déploiements CI Divinci actifs. Reporté comme le % de régressions confirmées où la couche nommée a été la première à échouer. Interne — mesuré par nous.</figcaption>
</figure>

Les 3 % qui s'échappent sont la raison pour laquelle [le rollback instantané du post 5](/fr/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) existe. Les gates ne promettent pas zéro échappée ; ils promettent une borne supérieure serrée et une récupération rapide pour ce qui passe à travers.

## Dimensionnement de la flotte CI — comment la suite de 12 minutes reste économique

La couche suite complète est l'endroit où le calcul doit fonctionner. Une implémentation naïve appelle le juge une fois par cas et par dimension, les exécute séquentiellement, et la facture croît linéairement avec le nombre de cas. Trois optimisations font l'essentiel du travail pour la garder praticable :

**Cache d'embeddings.** L'empreinte du contexte de retrieval pour chaque cas du jeu de données golden est hashée ; si le cas n'a pas changé et que l'index de retrieval n'a pas changé, l'embedding en cache reste valide et l'étape de retrieval est sautée. Le taux de hit après la première semaine stable est constamment supérieur à 90 % dans les déploiements de nos clients.

**Batching du juge.** Le juge calibré est appelé avec une sortie structurée, en batchant 8 à 16 cas par appel. Le coût par token du juge reste le même ; la surcharge par cas baisse parce que le prompt système est amorti sur le batch. Le seuil pour un batching sûr est fixé par l'accord calibré du juge lui-même à cette taille de batch<sup><a href="#ref-2">[2]</a></sup> — nous mesurons cela lors de la passe hebdomadaire de calibration du juge ([post 7](/fr/blog/automated-regression-testing-for-custom-llms-in-2026/)).

**Réutilisation du KV-cache entre cas.** Pour les modèles où le même prompt système et les mêmes définitions d'outils ouvrent chaque appel, le KV-cache pour ce préfixe est calculé une fois par exécution de suite, pas une fois par cas<sup><a href="#ref-3">[3]</a></sup>. Sur les déploiements open-weights c'est direct ; sur les modèles d'API fermés cela dépend du support de mise en cache de préfixe du fournisseur.

L'effet combiné amène la suite complète à environ les chiffres de coût montrés dans le diagramme du mille-feuille ci-dessus. Les chiffres exacts sont internes, mais le ratio est la revendication publique : **~74 % des PR dépensent zéro dollar de juge ; ~22 % dépensent des centimes ; les 4 % restants dépensent quelques dollars pour le signal de pré-déploiement de plus haute confiance que nous sachions produire.**

## CI fantôme — l'activer sans casser l'équipe

L'erreur unique que nous avons vue les équipes commettre le plus souvent est de basculer un nouveau gate de « off » à « bloquant » dès le premier jour. Les seuils étaient calés sur les données d'hier, le taux de faux positifs est inconnu, et la première fois que le gate se déclenche, l'équipe n'a aucune calibration pour savoir s'il est réel ou si c'est une fausse alerte. L'ingénieur d'évaluation d'astreinte est paginé, le gate est désactivé, la confiance est perdue, le projet est mort.

La solution est la *CI fantôme* : exécuter le nouveau gate en mode non bloquant pendant deux semaines, poster le résultat en commentaire de bot sur chaque PR, et examiner le taux de faux positifs chaque semaine avant de le basculer en mode bloquant. Le runner CI de Divinci a un flag `--shadow` exactement pour cela. Le commentaire de PR a la même apparence que la version bloquante éventuelle — même affichage du diff, même décomposition par tranche — sauf qu'il ne bloque pas le merge.

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

Lorsque le taux de faux positifs est inférieur à 5 % soutenu sur la fenêtre, nous le basculons. Quand il ne l'est pas, nous resserrons les seuils par tranche, recalibrons le juge, et relançons une fenêtre fantôme. Dans tous les cas, l'équipe ne s'est pas fait surprendre par un nouveau gate qui se déclenche dès le premier jour.

## Un workflow GitHub Actions qui compose réellement

La pièce qui relie le mille-feuille à votre CI existante se trouve dans `.github/workflows/llm-ci.yaml`. Les couches sont câblées pour que les économiques échouent rapidement et que les coûteuses ne tournent que quand elles en ont besoin — les chaînes `needs:` et les déclencheurs filtrés par chemin font le travail<sup><a href="#ref-5">[5]</a></sup>.

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

Trois choses à noter. Les couches s'enchaînent via `needs:`, donc smoke ne tourne pas sur un contrat cassé et full ne tourne pas sur un smoke cassé. Le job `full` est filtré par chemin sur les changements qui méritent réellement une exécution de 12 minutes — une correction de coquille dans le README ne déclenche pas la suite de gates. Le flag `--post-pr-comment` est ce qui rend le diff par tranche visible sans quitter GitHub.

## La boucle de débogage de PR en échec

L'autre moitié de « le gate s'est déclenché » est « montrez-moi pourquoi ». Une sortie de suite de régression du type `medical slice task-completion dropped 0.04` n'est pas exploitable sans les cas qui l'ont causée. Nous faisons remonter les cinq pires diffs par tranche dans le commentaire de PR, avec l'entrée originale, la sortie baseline, la sortie candidate, et la trace de raisonnement du juge. La boucle de débogage est censée prendre des secondes, pas des minutes :

```bash
# Récupérer les 5 pires cas qui ont déclenché le gate de la tranche médicale sur cette PR
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

C'est la même surface diagnostique que [l'arbre en sept étapes du post 6](/fr/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/), câblée dans la boucle de retour CI. L'ingénieur qui a ouvert la PR voit les preuves au niveau du cas sur la PR elle-même ; il n'a pas à aller ouvrir un tableau de bord d'évaluation séparé.

## Discipline de contrôle de version — prompts, jeux de données et juges comme code

Les templates de prompts, les jeux de données golden et les prompts de juge vivent tous dans le repo, épinglés par hash dans le manifeste de release. Le manifeste est l'objet unique qui relie la suite à un état reproductible spécifique :

```yaml
# manifests/staging.yaml — chaque exécution CI hashe ceci
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

Lorsqu'une exécution CI publie un score, le score est tagué avec ce hash de manifeste. Lorsqu'un score bouge, la question « quelle entrée a bougé » a une réponse directe : faire le diff du manifeste, et la couche qui s'est déclenchée vous dit quelle dimension regarder en premier. C'est la boucle que [le pipeline en quatre étapes du post 1](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) et [le reçu vindex du post 4](/fr/blog/validating-and-releasing-custom-lms-in-regulated-fields/) ferment ensemble : le manifeste est la primitive d'audit vers laquelle ces huit posts, sous des cadrages différents, ont tous construit.

## Ce que cela ne résout pas

Les mêmes trois limitations honnêtes que nous avons inscrites dans chaque post de cette série.

1. **La CI ne teste pas ce qui n'est pas dans la suite.** Quelle que soit l'astuce du mille-feuille, les seules régressions qu'il attrape sont celles qu'un cas du jeu de données golden aurait signalées. La couche de replay atténue cela pour la dérive de comportement, mais les requêtes nouvelles qui n'ont jamais été vues s'échappent toujours jusqu'à ce qu'elles apparaissent en production. Le système doit être associé à un monitoring en production.
2. **Les chiffres de coût se déplacent avec la tarification des modèles.** Chaque chiffre de coût dans ce post dépend de tarifs de tokens de juge, de tarifs d'embedding et de tarifs d'inférence qui dérivent trimestriellement. Les ratios — 74 % / 22 % / 4 %, 31 % / 27 % / 28 % / 11 % / 3 % — sont les revendications porteuses ; les chiffres en dollars sont illustratifs pour un moment dans le temps.
3. **Les changements de checkpoint côté fournisseur restent difficiles.** Quand un fournisseur d'API fermé met à jour silencieusement le modèle derrière un nom stable, la couche contrat ne peut pas l'attraper ; seule la suite de gates le peut, et seulement après coup. Nous atténuons en épinglant des identifiants de checkpoint explicites partout où le fournisseur le supporte, et en traitant le jour où un checkpoint est annoncé comme un événement déclencheur pour une re-baseline de la suite complète. Nous ne pouvons pas empêcher le problème sous-jacent.

## Conclusion de la série

Ceci est le post 8 sur 8. L'arc complet :

1. [Comment construire un pipeline CI/CD LLM avec Divinci AI](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — le pipeline en quatre étapes (Register / Gate / Roll / Observe) à l'intérieur duquel tout ce qui suit a vécu.
2. [10 échecs de release CI/CD dans les modèles de langage personnalisés](/fr/blog/10-ci-cd-release-failures-in-custom-language-models/) — les modes d'échec 2026 nommés, chacun mappé à l'étape qui aurait dû l'attraper.
3. [12 capacités de QA et de gestion de release pour LLM](/fr/blog/12-qa-and-release-management-capabilities-for-llms/) — la matrice de capacités et le diagramme de Venn à trois camps qui place Divinci face aux alternatives.
4. [Valider et livrer des LM personnalisés dans des domaines régulés](/fr/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — le deep-dive conformité, le mapping régulateur-étape, les reçus vindex.
5. [Pipelines CI/CD LLM automatisés avec rollback instantané](/fr/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — la couche opérationnelle, le spectre d'automatisation, le reçu d'auto-rollback.
6. [Comment diagnostiquer les échecs de QA LLM personnalisé en 7 étapes](/fr/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — l'arbre de décision diagnostique ; le modèle est la bonne réponse environ une alerte sur sept.
7. [Tests de régression automatisés pour LLM personnalisés en 2026](/fr/blog/automated-regression-testing-for-custom-llms-in-2026/) — gates Spearman conscients des tranches, juges calibrés, replay en boucle fermée de traces production.
8. **Ce post.** L'infrastructure CI qui rend tout ce qui précède praticable sur chaque PR.

Les pièces se composent : le [manifeste](/fr/api/) est la primitive d'audit, les gates sont la couche de sécurité, l'arbre diagnostique est la boucle de récupération, le [reçu vindex](/fr/compliance/) est l'ancre externe, et le mille-feuille est ce qui rend l'ensemble abordable à exécuter sur chaque commit. Si votre processus de release de LLM personnalisé n'a pas ces cinq éléments ensemble, l'écart est exactement ce dont ces huit posts ont traité.

## FAQ

**Quel est le test le moins cher que je puisse exécuter sur chaque commit ?**

Une vérification de rendu de template de prompt. Elle tourne en millisecondes, ne nécessite pas de juge, attrape une fraction surprenante des cassures, et ne coûte jamais un centime mesurable. Si vous ne l'exécutez pas encore, c'est la pièce de CI au plus fort ROI que nous sachions recommander.

**Combien dois-je m'attendre à ce que coûte un pipeline CI de LLM personnalisé ?**

Des centimes par PR typique, quelques dollars par PR de candidat à la release. Le ratio dépend de la tarification du juge et de la fraction de vos PR qui touchent les prompts ou la config du modèle. La part de 4 % de candidats à la release ci-dessus est typique ; pour les produits à itération fréquente sur les prompts la part monte et la moyenne grimpe en conséquence.

**Dois-je exécuter la suite complète sur chaque commit ?**

Non. Filtrez par chemin pour les PR qui touchent les prompts, la config du modèle, le retrieval ou le code d'évaluation. Pour tous les autres changements, contrat + smoke est suffisant, et une attente de 12 minutes sur une coquille de README vous fera perdre la confiance de l'équipe en un sprint. La suite complète est précieuse ; dépensez-la là où le changement peut plausiblement déplacer une dimension de qualité.

**Comment introduire un nouveau gate sans casser tout le monde ?**

Fenêtre fantôme de deux semaines, non bloquante. Calez les seuils sur le taux de faux positifs observé pendant la fenêtre fantôme. Basculez en mode bloquant uniquement lorsque le taux de faux positifs soutenu est inférieur à votre tolérance (nous utilisons 5 %). Tout le reste est la manière d'obtenir un gate que tout le monde a appris à ignorer.

**Quel est le chiffre unique à suivre si je n'en suis qu'un seul ?**

La fraction de régressions confirmées attrapées avant la production. L'histogramme de ce post la place à ~97 % dans les déploiements Divinci matures. Les 3 % qui s'échappent sont la raison pour laquelle le rollback instantané existe. Les 97 % sont la raison pour laquelle la suite existe.

## Références

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">« Accelerate State of DevOps — vélocité CI, taux d'échec de changement et temps de restauration de service. »</a> Les références transsectorielles qui rendent « 12 minutes par PR est trop lent » une affirmation défendable et non une opinion.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">« Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena. »</a> arXiv:2306.05685. La preuve empirique que les appels LLM-as-judge batchés peuvent préserver la calibration aux tailles de batch utilisées dans les couches smoke et complète — la raison pour laquelle les chiffres de coût de ce post sont atteignables.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">« Efficiently Scaling Transformer Inference. »</a> arXiv:2211.05102. Les techniques de réutilisation du KV-cache et de partage de préfixe citées dans la section sur le dimensionnement de la flotte CI.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">« The Semver Lie : comment une mise à jour LLM mineure a cassé la production. »</a> 29 avril 2026. Le mode d'échec 2026 nommé pour les suites de régression à signal agrégé uniquement ; la raison pour laquelle le mille-feuille CI est conscient des tranches de bout en bout.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">« GitHub Actions — enchaîner les jobs avec `needs:` et exécution conditionnelle. »</a> La primitive contre laquelle le .yaml de ce post se compose.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">« BERTScore : Evaluating Text Generation with BERT. »</a> arXiv:1904.09675. La métrique de similarité sémantique heuristique référencée comme alternative au LLM-as-judge pour les couches moins chères ; pas ce que nous exécutons au moment du gate, mais utile dans la couche contrat pour la détection de phrases interdites à grande échelle.
  </li>
</ol>
