+++
title = "Comment diagnostiquer les échecs de QA d'un LLM personnalisé en 7 étapes"
description = "La plupart des « échecs de QA » ne sont pas des défaillances du modèle — ce sont des lacunes de couverture d'évaluation, des problèmes de calibration du juge ou un écart entraînement-production. Un diagnostic en 7 étapes qui élimine les six causes non liées au modèle avant de le blâmer."
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
summary = "Quand une alerte QA se déclenche sur un LLM personnalisé, le réflexe naturel est de blâmer le modèle. Sur l'ensemble des déploiements que nous avons menés, le modèle est la bonne réponse environ une fois sur sept. Les six autres fois, le bug se trouve dans l'évaluation, le juge, le SHA du prompt, le pipeline de prétraitement, la version du dataset ou l'index de récupération. Cet article est l'arbre de diagnostic que nous parcourons réellement — dans l'ordre, avec l'appel API exact qui répond à chaque embranchement."
+++

*Notes du cycle de release — Partie VI*

---

Une suite de QA scorée a commencé à signaler le modèle Q&R médical d'un client. Le chiffre principal — qualité agrégée sur toutes les tranches — a chuté de 6 points du jour au lendemain. L'équipe a passé deux jours à déboguer le modèle. Ils ont relancé les fine-tunes. Ils sont revenus à la release précédente. Les chiffres ne bougeaient pas.

Le matin du troisième jour, quelqu'un a remarqué que la suite d'évaluation avait été mise à jour la nuit même où la régression avait commencé. Trois nouveaux prompts sur le dosage pédiatrique avaient été ajoutés au jeu de tests, et le modèle n'avait jamais vu de dosage pédiatrique pendant l'entraînement. L'« échec de QA » n'était pas une régression du modèle. C'était un événement de couverture de tranche : l'évaluation a commencé à poser des questions sur quelque chose que le modèle n'était jamais censé connaître.

Sur l'ensemble de nos déploiements clients, c'est le schéma dominant. **Une alerte « échec de QA » est le symptôme. La cause est le modèle environ une fois sur sept.** Les six autres fois, le bug se situe quelque part en amont : dans la conception de l'évaluation, dans la calibration du juge, dans le SHA du prompt, dans le pipeline de prétraitement, dans la version du dataset ou dans l'index de récupération. Chacune de ces catégories de bugs semble identique depuis l'alerte — un chiffre a baissé — mais a un correctif complètement différent.

Cet article est l'arbre de diagnostic que nous parcourons dans l'ordre quand une alerte se déclenche. Six étapes qui éliminent les causes non liées au modèle, avant que la septième étape ne considère le modèle lui-même. Chaque étape comporte un appel API ou une requête concrète qui y répond. Lorsque vous aurez terminé les six, soit vous saurez exactement quoi corriger, soit vous aurez gagné le droit de regarder le modèle.

## L'arbre de décision

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Arbre de décision diagnostique pour une alerte d'échec de QA. L'étape 1 demande si l'évaluation couvre cette tranche (si non, l'alerte est une lacune de couverture d'évaluation). L'étape 2 demande si le juge est calibré contre des humains sur cette tranche (si non, l'alerte est une mauvaise calibration du juge). L'étape 3 demande si le SHA du modèle de prompt correspond à la production (si non, l'alerte est une dérive de prompt). L'étape 4 demande si le prétraitement correspond à la production (si non, l'alerte est un écart entraînement-production). L'étape 5 demande si le SHA du dataset correspond à la production (si non, l'alerte est une dérive de dataset). L'étape 6 demande si la version de l'index de récupération correspond à la production (si non, l'alerte est une dérive d'index RAG). Ce n'est qu'après que les six aient éliminé une cause non liée au modèle que l'étape 7 conclut qu'il s'agit effectivement d'une régression du modèle par tranche.">
<title>L'arbre de diagnostic en 7 étapes</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Quand une alerte QA se déclenche, descendez — n'entrez pas</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">Six étapes éliminent les causes non liées au modèle. Seule la septième blâme le modèle.</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  Alerte QA déclenchée</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">L'évaluation couvre-t-elle cette tranche ?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ si NON : lacune de couverture. Mettre à jour la suite, retester.</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">Le juge est-il calibré aux humains sur cette tranche ?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ si NON : juge mal calibré. Recalibrer ρ. Réévaluer.</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">Le SHA du modèle de prompt correspond-il à la prod ?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ si NON : dérive de prompt. Réenregistrer le manifeste.</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">Le pipeline de prétraitement correspond-il à la prod ?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ si NON : écart entraînement-production. Lier le SHA.</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">Le SHA du dataset correspond-il à la production ?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ si NON : dérive de dataset. Réenregistrer avec le bon SHA.</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">SHA de l'index de récupération ?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ si NON : dérive d'index RAG.</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">Si les 6 passent :</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">vraie régression du modèle par tranche.</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">Acter. Revenir en arrière. Réentraîner.</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">Empiriquement, le modèle</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">est la bonne réponse</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">environ 1 alerte sur 7.</text>
</svg>
</figure>

L'arbre est séquentiel parce que les étapes vont du moins cher au plus cher. L'étape 1 est un `git diff` de la suite d'évaluation ; l'étape 7 est un cycle de fine-tuning. Vous voulez passer dix minutes sur chacune des six vérifications peu coûteuses avant de passer une semaine sur la coûteuse.

## Étape 1 — L'évaluation a-t-elle couvert cette tranche ?

**Le symptôme.** La qualité agrégée chute, mais la ventilation par tranche montre une tranche qui s'effondre tandis que les autres sont stables. Ou — plus déroutant — *chaque* tranche baisse légèrement, toutes du même montant.

**Le diagnostic.** Faites un diff du SHA du manifeste de la suite d'évaluation par rapport à celui de la release précédente. Si la suite d'évaluation a changé et que vous n'avez pas changé le modèle, la régression est dans l'évaluation, pas dans le modèle.

```bash
# Comparer le SHA du manifeste de la suite d'évaluation entre les releases
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# Différents ? Votre évaluation a changé. Auditez ce qui a été ajouté.
```

**Le correctif.** Soit annulez le changement de la suite d'évaluation (s'il était involontaire), soit élargissez la couverture de l'entraînement pour correspondre à la nouvelle évaluation (si la nouvelle tranche est une préoccupation réelle en production). Ne livrez pas de correctif de régression de modèle pour un problème de couverture d'évaluation — vous rendrez le modèle pire sur ce qu'il faisait bien auparavant.

**Où cela se cache dans notre pipeline.** [Étape 1 — Register](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) lie le SHA de la suite d'évaluation dans le manifeste de release. Le diagnostic ci-dessus consiste simplement à comparer deux manifestes. La raison pour laquelle le bug a pris deux jours à l'équipe Q&R médical est qu'ils n'avaient pas de diff au niveau du manifeste — ils comparaient des checkpoints de modèle, pas des manifestes de release.

## Étape 2 — Le juge est-il calibré aux humains sur cette tranche ?

**Le symptôme.** Une tranche *nouvelle* dans la suite d'évaluation obtient de mauvais scores, mais la revue humaine des sorties du modèle sur cette tranche les évalue comme correctes. Le juge pense que le modèle échoue ; les humains, non.

**Le diagnostic.** Calculez le ρ de Spearman entre les notes du juge LLM et un petit échantillon évalué par des humains (50 éléments) sur la tranche qui échoue. Si ρ &lt; 0,4, le juge *ne mesure pas* ce que les humains mesurent sur cette tranche.

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**Le correctif.** Soit choisissez un modèle de juge différent pour cette tranche, soit utilisez une chaîne de juges avec un arbitre. MT-Bench<sup><a href="#ref-1">[1]</a></sup> montre que GPT-4 comme juge est en accord avec les humains &gt;80 % en moyenne, mais avec une variance par catégorie allant de 86 % (codage) à 36–44 % (rédaction/sciences humaines). La variance est le chiffre opérationnel ; « bon en moyenne » masque les tranches où le juge se trompe.

**Où cela se cache dans notre pipeline.** [Étape 2 — Gate](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) exige un juge calibré par tranche. L'article [Calibrating the AI Judge](/fr/blog/calibrating-the-ai-judge/) documente la procédure. Si la tranche a été ajoutée à l'évaluation sans étape de calibration, vous avez une porte structurellement peu fiable.

## Étape 3 — Le SHA du modèle de prompt correspond-il à la production ?

**Le symptôme.** La qualité chute mais le model_ref et le dataset_ref sont inchangés. Rien n'a changé dans l'entraînement. Le modèle est le même modèle. Et pourtant.

**Le diagnostic.** Comparez le SHA du `prompt_template_ref` dans le manifeste de la release défaillante à celui de la release précédente. Une modification de 38 caractères à un prompt système qui « améliore la concision » peut changer le comportement en aval plus qu'un réentraînement complet.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# Différents ? Tirez le diff. Regardez-le attentivement.
```

**Le correctif.** Traitez les prompts comme du code. L'article [10 release failures](/fr/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) couvre le mode d'échec de l'édition via tableau de bord — le postmortem *Semver Lie* de Tianpan<sup><a href="#ref-2">[2]</a></sup> le nomme comme le schéma d'échec dominant en 2026. Si vous pouvez prouver que le prompt a changé, vous avez trouvé votre bug.

## Étape 4 — Le pipeline de prétraitement correspond-il à la production ?

**Le symptôme.** Le modèle passe l'évaluation en local. Le même modèle échoue à la même évaluation en production. Même model_ref, même prompt, même dataset.

**Le diagnostic.** Tirez le SHA `preprocessing_ref` du manifeste de production et vérifiez que l'évaluation a tourné avec le même. Le cas classique : l'entraînement normalise les espaces et met en minuscules ; la production ne le fait pas. L'évaluation est passée par le prétraitement de production ; tout a vérifié. Jusqu'à ce que quelqu'un mette à jour le prétraitement d'un seul côté.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# Comparer au prétraitement réellement utilisé par votre harnais d'entraînement/d'évaluation.
```

**Le correctif.** Containerisez le prétraitement comme un artefact versionné. Référencez-le depuis le manifeste. Refusez de déployer si le SHA de prétraitement de la porte diffère de celui de production.

## Étape 5 — Le SHA du dataset correspond-il à la production ?

**Le symptôme.** Les scores d'évaluation de porte de la release défaillante diffèrent des scores d'évaluation de porte du *même* modèle la veille.

**Le diagnostic.** Faites un diff du champ `dataset_version` entre les deux releases. La suite d'évaluation a gardé le même nom, mais le contenu du dataset a été mis à jour et re-tagué. Même nom, SHA différent, scores différents.

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**Le correctif.** Hachez le contenu de vos datasets. Le nom du dataset n'est pas une version ; le SHA l'est.

## Étape 6 — Le SHA de l'index de récupération correspond-il à la production ?

**Le symptôme.** Pour les charges de travail RAG uniquement. La qualité chute sur les questions qui dépendent du contexte récupéré. Les questions à réponse directe sont inchangées.

**Le diagnostic.** Tirez le SHA `retrieval_index_ref` du manifeste. Comparez-le à l'index de récupération de l'évaluation de porte. L'index RAG a été mis à jour pendant la nuit (une nouvelle ingestion) ; l'évaluation de porte a mis en cache une récupération plus ancienne ; le canary de production a utilisé la nouvelle.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**Le correctif.** Liez le SHA de l'index de récupération dans le manifeste, exactement comme nous lions le prétraitement. La cadence automatisée de rotation d'index d'[AutoRAG](/fr/autorag/) rend cette vérification particulièrement utile — l'index *sera* mis à jour sur vous, que vous l'ayez autorisé ou non, si vous ne l'épinglez pas.

## Étape 7 — Le modèle lui-même, enfin

Six étapes plus tard. L'évaluation couvre la tranche. Le juge est calibré. Le SHA du prompt correspond. Le prétraitement correspond. Le dataset correspond. L'index de récupération correspond.

Maintenant — et seulement maintenant — vous avez gagné le droit de regarder le modèle.

Le diagnostic pour cette étape est une comparaison Spearman par tranche par rapport à la release précédente, les deux releases étant évaluées sur le *même* dataset, prétraitement et récupération épinglés dans le manifeste. Le chiffre que vous produisez est un signal propre : une véritable régression par tranche, sans facteurs de confusion en amont.

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

Si le delta confirme une régression réelle : le [rollback automatique](/fr/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) se déclenche (si vous ne l'avez pas déjà invoqué manuellement), et le modèle défaillant est réentraîné sur un corpus à couverture de tranches élargie. Si la porte qui a promu cette release a manqué la tranche en premier lieu, [la porte est aussi le bug](/fr/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — capacité 4 manquante de votre pipeline de release.

## À quoi ressemble réellement la distribution

Le cadrage « 1 sur 7 » plus tôt n'était pas un artifice rhétorique. C'est à peu près la distribution que nous observons sur les déploiements clients. Sur chaque sept alertes QA :

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Camembert de distribution des causes racines pour les alertes QA. La lacune de couverture d'évaluation représente environ 32 pour cent. La mauvaise calibration du juge environ 18 pour cent. La dérive de prompt environ 16 pour cent. L'écart de prétraitement environ 12 pour cent. La dérive de dataset environ 7 pour cent. La dérive d'index RAG environ 5 pour cent. La régression réelle du modèle environ 10 pour cent. Observation interne sur les déploiements clients ; pas issu d'un benchmark contrôlé.">
<title>Distribution des causes racines des alertes QA</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Où était réellement le bug — sur l'ensemble des déploiements clients</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Observation interne, pas un benchmark contrôlé. Le modèle est la bonne réponse environ une fois sur sept alertes.</text>
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
<text x="522" y="112" font-weight="600">1.  Lacune de couverture d'évaluation</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32 %</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  Mauvaise calibration du juge</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18 %</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  Dérive de prompt</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16 %</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  Écart de prétraitement</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12 %</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  Régression réelle du modèle</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10 %</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  Dérive de dataset</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7 %</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  Dérive d'index RAG</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5 %</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">Les étapes 1+2 représentent à elles seules la moitié des alertes. Parcourez l'évaluation avant le modèle.</text>
</svg>
</figure>

Les deux plus grosses tranches sont la *lacune de couverture d'évaluation* et la *mauvaise calibration du juge*. Ensemble, elles représentent la moitié des alertes QA. Aucune n'est un problème de modèle. Les deux sont des problèmes liés à la façon dont vous mesurez le modèle.

## Ce que cela ne résout pas

Trois limitations honnêtes :

**La distribution est la nôtre, pas la vôtre.** Les pourcentages ci-dessus proviennent de notre cohorte de clients et de l'outillage de notre pipeline. Si vous exécutez un type de charge de travail différent — multimodal intensif, orchestration intensive d'agents, génération en un coup intensive — votre distribution sera différente. L'ordre du diagnostic devrait tout de même tenir ; les chiffres derrière chaque étape, non.

**La « lacune de couverture d'évaluation » de l'étape 1 est la plus difficile à corriger.** Ajouter la tranche manquante à votre corpus d'entraînement, construire un juge calibré pour celle-ci et relancer le canary est en soi un projet de plusieurs semaines. Le diagnostic est rapide ; la remédiation ne l'est pas.

**Une vraie régression peut chevaucher un bug non lié au modèle.** Les cas où vous avez *à la fois* une dérive de prompt ET une vraie régression du modèle sont les pires, parce que l'étape 3 trouve la dérive de prompt, vous la corrigez, et l'alerte se redéclenche. L'ordre du diagnostic dans cet article les gère mais ajoute du temps écoulé. Il n'y a pas de raccourci pour « le bug était à deux endroits à la fois ».

## FAQ

### Pourquoi mon LLM produit-il des sorties différentes pour des prompts similaires ?

La sensibilité aux prompts est réelle, mais ce n'est pas toujours la *cause* d'une alerte QA — c'est parfois un *symptôme* d'un bug en amont. Parcourez le diagnostic. Si le SHA du modèle de prompt correspond, que le prétraitement correspond et que le dataset correspond, alors oui — le modèle a une large variance sur cette tranche et vous avez besoin d'un chemin de décodage plus déterministe ou d'un juge différent. Si quoi que ce soit a changé en amont, corrigez cela d'abord.

### À quelle fréquence faut-il réévaluer vos benchmarks LLM ?

Réévaluez le *contenu* du benchmark chaque fois que la forme du trafic d'une tranche de production change de manière significative. Réévaluez la *calibration du juge* du benchmark chaque trimestre, au minimum — les modèles de juge dérivent plus vite que vous ne le pensez. La plus grande source de fausses alertes QA est un benchmark qui a été validé pour la dernière fois il y a 18 mois et qui mesure maintenant quelque chose que votre production ne fait plus.

### Qu'est-ce qui cause les hallucinations dans les modèles de langage personnalisés ?

Les hallucinations ont plusieurs causes en amont — défaillances de récupération (étape 6 dans l'arbre ci-dessus), lacunes de couverture d'entraînement (étape 1, indirectement) et problèmes de chemin de décodage (une véritable préoccupation du modèle à l'étape 7). [AutoRAG](/fr/autorag/) traite les causes côté récupération en liant l'index de récupération dans le manifeste de release et en le réépinglant à chaque release. Les deux autres nécessitent des correctifs au niveau du pipeline en amont du modèle.

### Comment savoir si vos données d'entraînement sont le problème ?

Si le SHA du dataset dans la release défaillante correspond au SHA du dataset de la release précédente correcte (étape 5 de l'arbre), les données ne sont pas la cause *immédiate*. S'ils diffèrent, vous l'avez trouvée. La question plus difficile — « le dataset est-il *complet* pour la couverture de tranches de production ? » — est ce que teste l'étape 1. Un dataset complet pour l'évaluation mais incomplet pour le trafic de production est un problème de couverture de tranches.

### Pouvez-vous corriger les échecs de QA sans réentraîner tout le modèle ?

Oui — six fois sur sept, le correctif n'est pas un réentraînement. Les étapes 1 à 6 de l'arbre ont des correctifs qui ne touchent pas au modèle : mettre à jour l'évaluation, recalibrer le juge, réenregistrer le SHA du prompt, corriger le prétraitement, réépingler le dataset ou réépingler l'index de récupération. Le réentraînement est l'étape 7, le correctif le plus coûteux, réservé aux véritables régressions du modèle. La [piste d'audit](/fr/compliance/) du pipeline de release vous permet d'effectuer ces correctifs en amont avec la même discipline de provenance que vous utiliseriez pour un changement de modèle.

## Références

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Variance par catégorie du LLM-as-judge.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80 % d'accord global entre GPT-4 et humain avec une variance par catégorie allant du codage (86 %) à la rédaction (36–44 %). Référence pour l'étape 2 — pourquoi la calibration du juge doit être mesurée par tranche plutôt que supposée à partir d'un chiffre global publié.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (avril 2026). L'article de référence sur le mode d'échec dominant de 2026. Désigne la dérive de prompt par édition via tableau de bord comme la cause la plus citée des incidents LLM en production. Référence pour l'étape 3.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — fonction Measure.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>. La fonction « Measure » couvre explicitement la validité des benchmarks et la couverture d'évaluation dans le cadre de la gouvernance, et non comme une préoccupation d'ingénierie distincte. Cité comme ancrage institutionnel pour traiter la conception de l'évaluation comme première étape de diagnostic.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — évaluation de la génération augmentée par récupération.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). Le cadre de référence pour l'évaluation côté RAG. Référence pour l'étape 6 — séparer les défaillances de récupération des défaillances de génération nécessite une discipline d'évaluation consciente du RAG.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interne — distribution des causes racines sur les déploiements clients.</strong> Les pourcentages dans le camembert sont notre observation interne sur les déploiements clients Divinci, pas un benchmark contrôlé. Votre distribution variera selon le type de charge de travail, la cadence de fine-tuning et la discipline de l'équipe. L'ordre relatif (étapes 1 à 2 dominantes) est stable sur la cohorte que nous avons mesurée ; les pourcentages exacts ne sont pas portables vers votre environnement sans vos propres données.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Le pipeline de release en quatre étapes.</strong> <a href="/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Chaque étape de diagnostic dans cet article correspond à un champ de manifeste lié à l'étape 1 — Register. Sans la discipline du manifeste en amont, le diagnostic perd sa prise ; vous ne pouvez pas diff ce que vous n'avez pas lié.
</li>
</ol>

---

*Prochain dans cette série :* **Automated Regression Testing for Custom LLMs in 2026.** Cet article traite du diagnostic après le déclenchement d'une alerte QA. Le prochain porte sur la discipline de tests de régression qui a déclenché l'alerte en premier lieu — quoi mettre dans l'évaluation, comment la garder honnête et quoi faire quand le test de régression commence à être en désaccord avec votre juge.
