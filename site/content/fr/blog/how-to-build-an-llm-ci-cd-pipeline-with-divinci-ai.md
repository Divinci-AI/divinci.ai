+++
title = "Comment construire un pipeline CI/CD pour LLM avec Divinci AI"
description = "Pipeline LLM en quatre étapes : portes Spearman par tranche, canary sur la qualité des sorties, rollback atomique en 12 s, reçu de conformité par décision."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Canary", "Rollback", "Evaluation Gates"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-veo31.webm"
hero_video_poster = "/images/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-hero-poster.webp"
reading_time = 10
summary = "Un pipeline CI/CD traditionnel suppose que l'artefact est déterministe. Un modèle de langage ne l'est pas. Cet article décrit le pipeline que nous déployons chez Divinci AI — portes Spearman conscientes des tranches face à un juge ancré sur l'humain, canary qui surveille la qualité des sorties (pas seulement le p95), rollback atomique en environ douze secondes, et un reçu de release chaîné par hash pour chaque décision (avec une attestation de poids vindex intégrée lorsque le modèle est à poids ouverts). Trois de ces éléments ne sont fournis par aucun autre outil de release LLM en 2026."
+++

*Notes from the Release Cycle — Part I*

---

La première fois que nous avons essayé de livrer un LLM via un pipeline CI/CD classique, le build est passé au vert, le déploiement a réussi, et le support client a commencé à recevoir des tickets en sept minutes.

Rien n'avait « cassé ». Les 4 200 tests d'intégration sont tous passés. La latence était inchangée. Le taux de 200 OK est resté stable. Mais sur une classe spécifique de questions juridiques, le nouveau modèle s'était mis à esquiver discrètement — refusant de s'engager sur une réponse que la version précédente donnait correctement. Aucun test ne l'a détecté, parce que nous n'en avions pas encore écrit.

Nous avons fait un rollback, et le rollback lui-même est devenu un événement. L'artefact du modèle vivait à trois endroits, le template de prompt à un quatrième, les règles de routage à un cinquième, et aucun ne savait ce que faisaient les autres. Il a fallu un peu plus de deux heures pour revenir à l'état stable précédent. Les clients servis par une réponse évasive pendant cette fenêtre n'ont pas été impressionnés.

Cet incident est la raison d'être de ce pipeline. Ce qui suit est celui que nous utilisons réellement pour nos propres releases, et celui que nous exposons via l'API Divinci aux clients qui livrent les leurs. Il comporte quatre étapes — **enregistrer, gater, dérouler, observer** — et chaque étape a un chemin de rollback qui ne dépend pas d'un humain éveillé.

## Les quatre étapes

<img src="/images/charts/divinci-cicd-pipeline.svg" alt="Diagramme du pipeline CI/CD en quatre étapes pour les LLM. Étape 1 Enregistrer : l'artefact du modèle, le template de prompt, les règles de routage et la version du dataset sont regroupés dans un manifeste de release unique et signé. Étape 2 Gater : évaluation automatique face à la suite de QA scorée, avec une porte par catégorie sur le seuil de Spearman. Étape 3 Dérouler : montée du trafic canary 5 à 25 à 100 pour cent avec contrôles de santé à chaque étape. Étape 4 Observer : moniteur de dérive, moniteur de qualité des sorties, et rollback automatique en cas de dépassement de seuil. Chaque étape émet une entrée du journal d'audit signée avec le SHA de la release." width="900" height="380" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

Les étapes sont intentionnellement rigides. Chaque release passe par chacune d'elles dans cet ordre. Un chemin « hotfix » qui contournerait l'évaluation n'existe pas — nous avons essayé une fois.

### Étape 1 — Enregistrer

Une release n'est **pas** un fichier de poids de modèle. Une release est un manifeste immuable qui regroupe :

- L'artefact du modèle (repo HF + SHA de commit, ou un patch vindex)
- Le template de prompt (chaque variable, chaque message système)
- Les règles de routage (quelle classe de trafic atterrit sur quelle version)
- La version du dataset utilisée pour calculer les seuils de la porte
- Le SHA de la release précédente, pour que le rollback soit sans ambiguïté

```bash
curl -X POST https://api.divinci.ai/v1/releases \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{
    "model_ref": "Divinci-AI/gemma-4-e2b@a7c91f",
    "prompt_template_ref": "templates/legal-qa@v14",
    "routing": { "domain": "legal" },
    "dataset_version": "scored-qa-medical-v3",
    "previous_release": "rel_8f72b1"
  }'
# → { "release_id": "rel_a01c66", "manifest_sha256": "9abaeaf6..." }
```

Le SHA du manifeste est la seule poignée que quiconque utilise dans le pipeline. Si deux personnes déploient ce qu'elles croient être la même release et que les SHAs diffèrent, le pipeline rejette le déploiement. Nous avons déjà attrapé deux bugs grâce à cette règle.

### Étape 2 — Gater

La porte est la partie que la plupart des pipelines CI font mal. Les heuristiques de style Lighthouse — perplexité, BLEU, ROUGE — laisseront passer une régression si celle-ci est concentrée sur un domaine. Les scores agrégés la diluent.

La porte de Divinci exécute la suite de QA scorée avec laquelle le manifeste de release a été enregistré, et applique un seuil de Spearman **par catégorie** :

<img src="/images/charts/divinci-cicd-gate-thresholds.svg" alt="Graphique en barres montrant la corrélation de rang de Spearman par catégorie entre le modèle candidat et le juge calibré ancré sur l'humain, sur six sous-domaines juridiques. Rédaction de contrats à 0,71, interprétation statutaire à 0,74, résumé de jurisprudence à 0,69, conformité réglementaire à 0,66, analyse de juridiction à 0,62, et licences de propriété intellectuelle à 0,41. La ligne de seuil en pointillé est à 0,65. Les licences PI passent sous la ligne, déclenchant un échec de Gate-2. La moyenne agrégée sur les six catégories est de 0,64, juste sous le seuil, mais la vue par catégorie montre exactement quel sous-domaine a régressé." width="900" height="420" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

La release du graphique ci-dessus passerait une porte agrégée (la moyenne de 0,64 est « suffisamment proche »). Elle échoue à la porte de Divinci parce que les licences PI s'effondrent d'un précédent 0,68 à 0,41 — exactement le type de régression localisée qu'un notebook ne détecte jamais.

<aside style="background: rgba(184, 160, 128, 0.08); border-left: 3px solid #b8a080; padding: 0.7rem 1rem; margin: 0.8rem 0 1.5rem; font-size: 0.88rem; color: #4a4030;">
  <strong style="color: #1e3a2b;">À propos des chiffres du graphique :</strong> les valeurs par sous-domaine sont <em>illustratives de la forme</em>, pas des mesures issues d'une étude publiée. Aucun article public ne rapporte le Spearman ρ juge-vs-humain ventilé par ces domaines de pratique juridique spécifiques. Pour un ordre de grandeur adjacent voir <a href="https://arxiv.org/abs/2308.11462" target="_blank" rel="noopener">LegalBench (Guha et al., 2023)</a> — précision par tâche sur six types de raisonnement juridique — et <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">MT-Bench (Zheng et al., 2023)</a>, qui rapporte ~80 % d'accord global GPT-4-vs-humain avec une variance par catégorie importante. Les clients qui exécutent leur propre suite de QA scorée produisent des chiffres réels pour leurs propres tranches ; la forme du graphique correspond à ce que l'API ferait remonter.
</aside>

Nous n'avons pas inventé le gating conscient des tranches pour le plaisir. C'est le mode d'échec directement nommé dans les postmortems LLM actuels. Le compte rendu de Tianpan, *« The Semver Lie »*<sup><a href="#ref-6">[6]</a></sup>, décrit un changement de prompt qui « est passé la revue de code, a été déployé sans portes d'évaluation, a atteint la production sans A/B par utilisateur, et n'a déclenché aucun rollback automatique ». Ce qui a rendu cet incident catastrophique au lieu de simplement agaçant, c'est que la régression était concentrée sur une tranche — une seule classe de parcours utilisateur — pendant que l'agrégat tenait. Tous les outils de release LLM que nous avons étudiés en 2026 gatent soit sur un score global unique, soit pas du tout. Aucun ne tranche la porte.

Un échec de porte n'est **pas** un avertissement souple. Le release_id est marqué `gate_fail`, le manifeste est archivé, et aucune commande de déploiement ne l'acceptera. Les releases en démarrage à froid — un modèle tout nouveau sans historique de Spearman pour comparaison — passent par un chemin unique `--force-gate-override` qui exige une justification écrite ; la justification, l'ID utilisateur et un `gate_override_sha256` vont directement dans la piste d'audit. L'override existe parce qu'il y a des situations légitimes pour cela ; la piste d'audit existe parce que le « vous » du futur aura besoin de lire la justification.

### Étape 3 — Dérouler

Un canary chez Divinci, ce sont trois points de contrôle : **5 %, 25 %, 100 %**. À chaque point de contrôle, le pipeline tient pendant le temps de séjour configuré ou le nombre de requêtes configuré, selon le plus tardif. Par défaut : 4 minutes / 1 000 requêtes à 5 %, 15 minutes / 10 000 requêtes à 25 %.

À chaque point de contrôle, trois moniteurs doivent tenir :

1. **Latence p95** dans 1,2× le p95 de la release précédente
2. **Taux 5xx** dans 1,5× le taux de la release précédente
3. **Moniteur de qualité des sorties** : un replay continu des traces de production récentes à travers la release candidate, scoré par le même juge calibré qui a alimenté l'Étape 2

Le troisième est celui qu'aucun autre pipeline de release ne fournit. SageMaker, KServe, BentoML, Vertex AI — tous surveillent la latence et le taux d'erreur. Aucun ne score les sorties du candidat face aux *vraies* questions que la production pose à cet instant. Le candidat reçoit les mêmes prompts que la release active vient de recevoir, les exécute sur un miroir à 5 %, et nous mesurons le Spearman ρ des réponses du candidat face au correcteur calibré. Le taux de 5xx peut rester propre pendant que le modèle esquive, refuse, ou hallucine en silence. Nous l'avons vu se produire. Le moniteur de replay des traces est ce qui l'attrape.

L'ensemble de replay est borné — nous plafonnons à 50 traces récentes par tranche et par point de contrôle pour que le coût soit prévisible. La notation prend environ 90 secondes à 5 % de trafic. Plus lent qu'un canary à pourcentage plat, plus rapide qu'attendre qu'un client ouvre un ticket.

```bash
# The roll command is fire-and-forget. The pipeline holds itself.
curl -X POST https://api.divinci.ai/v1/releases/rel_a01c66/roll \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{ "strategy": "canary", "dwell_5pct_seconds": 240, "dwell_25pct_seconds": 900 }'
# → { "rollout_id": "rol_b3e2", "next_checkpoint_at": "2026-05-26T09:04:00Z" }
```

### Étape 4 — Observer, rollback et le reçu

C'est l'étape qui justifie l'existence du pipeline.

L'observateur tourne en continu une fois le déploiement terminé. Il calcule un score de qualité des sorties par minute sur un échantillon glissant de replay de traces à 5 %. Si le score descend sous le seuil de rollback (par défaut : 0,85 du seuil de la porte, soit 0,55 si la porte était à 0,65) pendant trois minutes consécutives, le rollback se déclenche automatiquement. Pas de page, pas d'humain, pas de débat.

Le rollback lui-même est une instruction unique : repointer le routage vers `previous_release` à partir du manifeste. Comme la release précédente était un manifeste entièrement groupé, chaque composant — poids, prompt, routage, dataset — bascule atomiquement.

Puis le reçu se déclenche.

Chaque décision de release — enregistrement, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback — émet un **reçu de release** : un artefact JSON-avec-SHA-256, chaîné par hash au reçu précédent pour ce client et au reçu précédent pour cette release, ancré en externe selon un planning que le client configure.

Lorsque la release s'appuie sur un **modèle à poids ouverts** — Gemma, Qwen, Llama, Mistral, GPT-OSS, tout ce dont les poids sont adressables et modifiables — le reçu intègre une [attestation vindex](/fr/compliance/) : une preuve cryptographique que les poids actifs au moment de la décision sont les poids que le manifeste a enregistrés. C'est le chemin qui satisfait les exigences de conformité les plus exigeantes (droit à l'effacement de l'article 17 du RGPD, traçabilité de l'EU AI Act) parce qu'on peut prouver non seulement *ce qui a été déployé* mais aussi *que les poids sous-jacents sont bien ceux qu'ils prétendent être*.

Lorsque la release s'appuie sur un **modèle à poids fermés** — OpenAI, Anthropic, Google, tout ce qui n'est servi que via une API opaque — le reçu couvre toujours la chaîne de décision (quel manifeste, quel résultat de porte, quelle lecture de moniteur, quel utilisateur a déclenché quelle action) mais ne peut pas attester des poids sous-jacents, parce que nous ne pouvons pas les voir. Ce n'est pas une limite du pipeline ; c'est une limite de ce qui est vérifiable lorsque le fournisseur n'expose pas les poids. Les auditeurs sensibles à cette distinction obtiennent la réponse honnête dans le reçu lui-même.

Dans les deux cas, les auditeurs reçoivent aujourd'hui des logs. Avec ce pipeline, ils reçoivent des *preuves* de tout ce qui est réellement prouvable. Nous n'avons vu personne d'autre sur le marché livrer cela. Nous nous attendons à ce qu'ils le fassent — les échéances de l'EU AI Act le rendent à terme inévitable. Nous avons choisi de le livrer maintenant.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Graphique en barres horizontales du temps de rollback, échelle logarithmique en minutes. Panne Atlassian avril 2022 : 720 minutes (12 heures) de restauration par site. Panne Cloudflare 21 juin 2022 : 44 minutes pour revenir en arrière. Seuil DORA elite-performer de récupération après déploiement raté : moins de 60 minutes. Délai d'attente par défaut de terminaison du deployment-guardrail canary AWS SageMaker : 10 minutes. Bascule de routage automatisée de Divinci via le manifeste de release : 12 secondes. Chaque étiquette de barre est un lien vers sa source numérotée dans les références ci-dessous." style="width: 100%; height: auto; display: block;">
  <title>Temps de rollback — chiffres mesurés à partir de sources primaires</title>
  <rect width="900" height="380" fill="#faf8f5"/>
  <text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Temps de rollback — chiffres mesurés à partir de sources primaires</text>
  <text x="40" y="56" font-size="12" fill="#6b5d4f">Incidents spécifiques et limites documentées par les plateformes, pas des estimations. Chaque barre renvoie à sa source dans les références ci-dessous.</text>
  <g stroke="#d4c8b0" font-size="10" fill="#8a7d68">
    <line x1="280" y1="320" x2="280" y2="80" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="860" y2="320" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="280" y2="325"/><text x="280" y="340" text-anchor="middle">0,1</text>
    <line x1="406" y1="320" x2="406" y2="325"/><text x="406" y="340" text-anchor="middle">1</text>
    <line x1="531" y1="320" x2="531" y2="325"/><text x="531" y="340" text-anchor="middle">10</text>
    <line x1="657" y1="320" x2="657" y2="325"/><text x="657" y="340" text-anchor="middle">100</text>
    <line x1="782" y1="320" x2="782" y2="325"/><text x="782" y="340" text-anchor="middle">1000</text>
    <line x1="406" y1="320" x2="406" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="531" y1="320" x2="531" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="657" y1="320" x2="657" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="782" y1="320" x2="782" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
  </g>
  <text x="570" y="360" font-size="11" fill="#6b5d4f" text-anchor="middle">minutes (échelle logarithmique)</text>
  <g>
    <text x="272" y="103" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Atlassian, avr. 2022</text>
    <text x="272" y="117" text-anchor="end" font-size="10" fill="#6b5d4f">restauration par site</text>
    <rect x="280" y="91" width="484" height="32" fill="#a04848" rx="2"/>
    <text x="774" y="113" font-size="11" font-weight="600" fill="#1e3a2b">720 min<a href="#ref-1"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[1]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="158" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Cloudflare, juin 2022</text>
    <text x="272" y="172" text-anchor="end" font-size="10" fill="#6b5d4f">retour arrière de config</text>
    <rect x="280" y="146" width="332" height="32" fill="#c87b3c" rx="2"/>
    <text x="622" y="168" font-size="11" font-weight="600" fill="#1e3a2b">44 min<a href="#ref-2"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[2]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="213" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">DORA elite</text>
    <text x="272" y="227" text-anchor="end" font-size="10" fill="#6b5d4f">seuil performer</text>
    <rect x="280" y="201" width="349" height="32" fill="#b8a080" rx="2" opacity="0.6"/>
    <text x="639" y="223" font-size="11" font-weight="600" fill="#1e3a2b">&lt; 60 min<a href="#ref-3"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[3]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="268" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">AWS SageMaker</text>
    <text x="272" y="282" text-anchor="end" font-size="10" fill="#6b5d4f">attente de terminaison par défaut</text>
    <rect x="280" y="256" width="251" height="32" fill="#7a9580" rx="2"/>
    <text x="541" y="278" font-size="11" font-weight="600" fill="#1e3a2b">10 min<a href="#ref-4"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[4]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="320" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="700">Divinci automatisé</text>
    <text x="272" y="334" text-anchor="end" font-size="10" fill="#2d5a4f">bascule de routage via manifeste</text>
    <line x1="280" y1="328" x2="318" y2="328" stroke="#2d5a4f" stroke-width="14" stroke-linecap="butt"/>
    <text x="328" y="332" font-size="11" font-weight="700" fill="#2d5a4f">12 s<a href="#ref-5"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[5]</tspan></a></text>
  </g>
</svg>
</figure>

Ce ne sont pas nos chiffres — ce sont des chiffres publiés issus de sources primaires : vrais postmortems, documentation de plateformes et le cadre DORA. Le contraste est ce qui motive la conception de Divinci. La panne d'Atlassian d'avril 2022<sup><a href="#ref-1">[1]</a></sup> a pris douze heures par site parce que l'état était réparti sur plusieurs systèmes qu'il fallait recoordonner. La panne de Cloudflare de juin 2022<sup><a href="#ref-2">[2]</a></sup> a pris quarante-quatre minutes pour être annulée parce que, selon leurs propres mots, des ingénieurs se sont marché sur les reverts. Les garde-fous de déploiement canary d'AWS SageMaker<sup><a href="#ref-4">[4]</a></sup> documentent un délai d'attente de terminaison par défaut de dix minutes avant que le rollback ne se termine totalement. Le seuil elite DORA<sup><a href="#ref-3">[3]</a></sup> pour la récupération après déploiement raté est de « moins d'une heure » — c'est la barre qu'une organisation très performante est censée franchir, pas un plafond.

Douze secondes n'est pas non plus un chiffre magique. C'est le temps nécessaire pour que la couche de routage vide les requêtes en cours, échange le manifeste actif, et acquitte le nouvel état entre régions. La partie lente, c'est le drain des requêtes en cours. Il n'existe pas de chemin plus rapide qui ne fasse pas tomber des réponses en pleine génération.

## Ce que c'est, et ce que les autres outils de release LLM ne sont pas

Nous avons étudié douze autres outils en 2026 avant de construire celui-ci — LangSmith Deployment, W&B Models, MLflow, SageMaker Deployment Guardrails, Vertex AI Endpoints, Seldon Core, BentoCloud, KServe, Humanloop, Braintrust, Patronus AI, Arize Phoenix. Ils se répartissent en deux camps qui ne se rejoignent pas tout à fait.

Le **camp eval-CI** — Braintrust, Humanloop, Patronus — gate les merges de PR sur des scores d'évaluation hors-ligne. Ils ne touchent jamais le service en cours d'exécution. Lorsque le modèle est en production et que la qualité chute, ils alertent ; quelqu'un d'autre doit faire le rollback.

Le **camp serving-canary** — SageMaker Deployment Guardrails, KServe, Vertex AI, BentoCloud, Seldon Core — répartit le trafic et fait du rollback automatique. Mais chacun d'eux se déclenche sur des métriques d'infrastructure : latence p99, taux d'erreur, alarmes CloudWatch. Aucun ne fait de rollback automatique sur une régression de qualité. Ils ne le peuvent pas, parce qu'ils n'ont pas de juge tournant sur la sortie de production.

La couture entre « eval validée au merge de la PR » et « canary en direct scoré sur les parcours utilisateurs qui nous importent vraiment » est un passage de relais manuel que toutes les équipes doivent aujourd'hui combler elles-mêmes. L'article de blog désigne cela comme le mode d'échec dominant de 2026<sup><a href="#ref-6">[6]</a></sup>. Nous l'avons refermé. Précisément :

1. **La porte est tranchée.** Spearman ρ par domaine face à un correcteur ancré sur l'humain, pas un score global unique. L'aveuglement aux tranches est ce qu'ont toutes les autres portes.
2. **Le canary surveille la qualité des sorties, pas seulement le p95.** Replay continu des traces à travers le candidat, scoré par le même juge qui a alimenté la porte. C'est la couture manquante.
3. **Chaque décision émet un reçu de release.** Chaîné par hash, ancrable en externe, dans le format JSON-avec-SHA-256 qui sous-tend nos pages de conformité. Pour les modèles à poids ouverts — Gemma, Qwen, Llama, Mistral, GPT-OSS — le reçu intègre une attestation de poids vindex pour que les auditeurs puissent prouver ce que les poids actifs étaient réellement. Pour les modèles à API fermée, le reçu couvre la chaîne de décision mais ne revendique pas la traçabilité des poids, parce que le fournisseur n'expose pas les poids. Dans les deux cas, les auditeurs obtiennent des preuves de ce qui est réellement prouvable, pas seulement des logs.

C'est tout. Canary générique, registre de versions, rollback sur métriques d'infrastructure — ce sont des commodités. Nous n'avons pas écrit un canary générique.

## Ce que cela ne résout pas

Trois limitations honnêtes :

**La porte n'est aussi bonne que le dataset.** Une suite de QA scorée qui ne couvre pas le domaine qu'un client utilise réellement n'attrapera pas les régressions dans ce domaine. Nous l'avons vu deux fois. Les deux fois, le premier mouvement du client a été de livrer une nouvelle suite de QA scorée, pas de changer le modèle. C'est le bon mouvement.

**Le rollback suppose que la release précédente était bonne.** Si une régression est en production depuis trois releases et que personne ne l'a remarquée, faire un rollback d'une release vous donne juste un modèle légèrement moins mauvais. La piste d'audit aide ici — vous pouvez faire un rollback vers n'importe quel manifeste antérieur par SHA, pas seulement N-1.

**Les releases en démarrage à froid contournent le canary.** Un modèle tout nouveau, sans trafic de production pour comparaison, ne peut pas être canaryté de manière significative. Nous imposons à la place un déploiement fantôme de 24 heures, qui observe les sorties sans les servir. C'est plus lent et moins pratique. C'est aussi la seule réponse honnête.

## La version la plus petite que vous puissiez exécuter

Si vous voulez monter quelque chose comme ça sans utiliser Divinci, la version minimale viable est en gros :

1. Un registre qui stocke modèle + prompt + routage + dataset comme un artefact immuable unique, adressé par hash de contenu
2. Un juge calibré face à un panel ancré sur l'humain via Spearman ρ — et une décision de porte qui consulte les scores *par tranche*, pas seulement l'agrégat
3. Un répartiteur de trafic qui tient aux points de contrôle et consulte un moniteur de qualité borné en fraîcheur — où le moniteur *rejoue des traces de production récentes* à travers le candidat, pas seulement des échantillons synthétiques
4. Une couche de routage dont l'état peut être échangé atomiquement — y compris le template de prompt, pas seulement les poids
5. Un journal d'audit qui émet un reçu chaîné par hash et ancrable en externe pour chaque décision de release — plus une attestation de poids intégrée lorsque le modèle est à poids ouverts, puisque les releases à API fermée ne peuvent physiquement pas être attestées au niveau des poids

La plupart des équipes ont déjà (1) et (3). Les parties douloureuses sont (2), (4) et (5). La raison pour laquelle Divinci existe, c'est que nous avons construit les cinq pour nous-mêmes d'abord, puis nous avons réalisé que tout le monde allait en avoir besoin aussi.

Si vous voulez sauter la construction, [la référence de l'API est ici](/fr/api/), et les endpoints de release de la section « Release Management » constituent toute la surface de ce pipeline. Le volet conformité — à quoi ressemblent ces reçus vindex et comment ils s'alignent sur l'EU AI Act, l'article 17 du RGPD, HIPAA et NIST AI RMF — est sur [la page conformité](/fr/compliance/). Chaque commande de cet article est un vrai endpoint.

## Références

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. Extrait du compte rendu : « L'approche accélérée Restoration 2 a pris environ 12 heures pour restaurer un site. » La restauration complète des 883 sites clients a pris 14 jours. L'état réparti entre l'infrastructure, les sauvegardes et la validation par site pousse le chiffre par site dans les heures plutôt que dans les minutes.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Chronologie citée textuellement dans le billet : « 06:58 : Cause racine identifiée et comprise. Début des travaux pour annuler le changement problématique… 07:42 : Le dernier des reverts a été achevé. » Quarante-quatre minutes entre « nous savons quoi annuler » et « l'annulation est faite », en partie parce que des ingénieurs se marchaient sur les reverts.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. Le seuil elite-performer du « failed deployment recovery time » est documenté à moins d'une heure. Les performers faibles se mesurent en semaines voire en mois dans les rapports historiques de DORA.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a> et la page compagnon <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener"><em>Auto-Rollback Configuration and Monitoring</em></a>. L'exemple <code>TerminationWaitInSeconds</code> est à 600 (dix minutes) ; <code>MaximumExecutionTimeoutInSeconds</code> est plafonné à 1800 (trente minutes). Le rollback se déclenche dans la fenêtre de stabilisation dès qu'une alarme se déclenche : « Si l'une des alarmes se déclenche pendant la période de stabilisation, alors SageMaker AI initie un rollback et tout le trafic retourne vers la flotte bleue. »
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    Divinci AI — bascule de routage atomique via le manifeste de release. Douze secondes, c'est le temps de drain des requêtes en cours sur un service à ~100 répliques ; l'échange du manifeste lui-même est sub-seconde. Le chiffre vient de notre propre service, pas d'un benchmark ; l'architecture qui le rend possible est le manifeste groupé décrit ci-dessus (Étape 1 — Enregistrer).
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em> (avril 2026)</a>. Le compte rendu nomme directement le pattern d'échec : « passé la revue de code, déployé sans portes d'évaluation, atteint la production sans A/B par utilisateur, et n'a déclenché aucun rollback automatique. » Un billet compagnon — <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a> — énumère les champs tranche / parcours / par-utilisateur que les postmortems actuels omettent systématiquement.
  </li>
</ol>

Une note sur ce qui n'est pas sur ce graphique. Le temps de `kubectl rollout undo` Kubernetes est gouverné par vos réglages `maxSurge` / `maxUnavailable` et la mise en chauffe des pods, pas par la commande elle-même, et nous n'avons pas trouvé de source primaire publiant un nombre mesuré comme le font les quatre sources ci-dessus — nous l'avons donc laissé de côté plutôt que de le combler avec une estimation.

---

*Suite de cette série :* **10 échecs de release CI/CD que nous avons attrapés dans des LMs personnalisés, et quelle étape du pipeline attrape chacun.** Trois des dix sont des régressions conscientes des tranches qu'une porte agrégée aurait livrées. Deux autres sont des chutes silencieuses de qualité qu'un canary basé sur des métriques d'infrastructure aurait promues. Le reste, ce sont les modes d'échec que tout pipeline de release est censé attraper — nous les listons parce qu'il vaut la peine de dire à voix haute lesquels un pipeline à porte agrégée attrape effectivement de lui-même.
