+++
title = "Les 12 capacités QA et de Release Management que toute plateforme de LLM personnalisé devrait livrer"
description = "Une checklist capacité par capacité pour évaluer les plateformes de release de LLM : portes conscientes des tranches, juges calibrés, rollback atomique, reçus chaînés par hash — ce qui est saturé, ce qui manque, et comment les camps se répartissent."
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "Nous avons passé en revue douze plateformes de release LLM avant de construire la nôtre. Le marché se divise en trois camps qui ne se rejoignent pas tout à fait — outils d'eval-CI, outils de canary de service, et outils d'observabilité — et la couture manquante entre eux est exactement celle dont une release client a besoin. Ce billet est la checklist de capacités issue de cette revue : 12 tests spécifiques que vous pouvez appliquer à n'importe quelle plateforme, y compris la nôtre."
+++

*Notes from the Release Cycle — Part III*

---

Il y a un an, avant de commencer à construire notre propre pipeline de release, nous nous sommes assis et avons listé chaque capacité de QA et de release qu'une plateforme LLM sérieuse devrait, selon nous, livrer. Nous avons ensuite évalué douze autres plateformes face à cette liste — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core. Personne n'avait les douze. Les combinaisons *effectivement* livrées se regroupaient en trois camps qui ne se touchaient pas tout à fait.

Ce billet est la liste de capacités qui en a résulté, rendue portable. Elle est organisée par étape du pipeline à laquelle chaque capacité appartient — **Enregistrer → Gater → Dérouler → Observer** — afin qu'elle se compose proprement avec [l'architecture du pipeline](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) et les [modes d'échec](/fr/blog/10-ci-cd-release-failures-in-custom-language-models/) sur lesquels nous avons écrit. Si vous évaluez des outils, parcourez la liste de haut en bas face à chaque candidat ; ceux qui ont les manques les plus profonds vous diront à quel camp ils appartiennent.

## Les trois camps (pour que vous sachiez ce que vous regardez)

Avant la checklist elle-même, la forme du marché en 2026 :

- **Camp Eval-CI** — Braintrust, Humanloop, Patronus. Lancent des évaluateurs automatisés au merge de PR. Bloquent les mauvais merges. Ne touchent jamais au trafic live. Solides sur les capacités 4–6 ; absents sur 7–12.
- **Camp Canary de service** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core. Répartissent le trafic, surveillent les métriques d'infrastructure, font un auto-rollback sur des alarmes de type CloudWatch. Solides sur 1, 7, 9 ; absents sur le côté qualité de 8 et 10–12.
- **Camp Observabilité** — Arize Phoenix, Confident AI, Deepchecks. Surveillent la production, alertent les humains, escaladent. Solides sur 10 (monitoring), mais ils n'imposent rien — l'alerte n'est pas un auto-rollback.

L'écart entre ces camps — entre « a passé CI » et « canary live scoré sur la qualité, pas seulement sur la latence » — est la partie que tout le monde doit combler à la main. Combler cet écart est la revendication porteuse de ce billet.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Diagramme de Venn des trois camps de plateformes LLM. Le camp Eval-CI (Braintrust, Humanloop, Patronus) est à gauche et couvre l'évaluation hors-ligne au merge de PR. Le camp Canary de service (SageMaker, KServe, Vertex, BentoCloud, Seldon) est à droite et couvre la répartition du trafic avec rollback basé sur les métriques d'infrastructure. Le camp Observabilité (Arize, Phoenix, Confident, Deepchecks) est en bas et couvre le monitoring et l'alerte sans application. Les trois cercles se chevauchent deux à deux par d'étroits croissants, mais la région centrale où les trois se rencontrent est vide. Ce centre vide est la couture manquante dont parle ce billet — une décision de release pilotée par la qualité par tranche, appliquée de manière atomique sur le trafic live.">
<title>Les trois camps et le centre manquant</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Les trois camps qui ne se rejoignent pas tout à fait</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">Chaque camp possède une pièce. Le centre est là où chaque équipe comble à la main.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">Eval-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">portes d'eval hors-ligne</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">au merge de PR</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">Canary de service</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">répartition du trafic +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">rollback sur métriques infra</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">Observabilité</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">surveille + alerte (aucune application)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">couture</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">manquante</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">La couture manquante : porte de qualité par tranche → rollback atomique piloté par la qualité de sortie, pas par les métriques d'infrastructure.</p>

## Étape ① — Enregistrer

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ENREGISTRER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Couche de manifeste immuable. Attribution des échecs par SHA.</span>
  </div>
</div>

### Capacité 1. Manifeste de release immuable avec un SHA adressable par contenu

Ce que c'est : une release n'est pas un fichier de poids de modèle. Une release est un bundle immuable de *tout* — artefact de modèle, prompt template, règles de routage, version du dataset, version de prétraitement — adressé par un unique SHA-256. Deux personnes déployant « la même release » doivent produire le même SHA, sinon le pipeline refuse.

Pourquoi cela compte : sans ça, « quel changement a cassé la production ? » est sans réponse quand l'état est réparti sur trois systèmes. La panne d'Atlassian d'avril 2022<sup><a href="#ref-1">[1]</a></sup> a pris douze heures par site pour être restaurée précisément parce que l'état vivait dans des systèmes versionnés indépendamment qu'il fallait re-coordonner.

Qui le livre : le camp canary de service partiellement (modèle + routage) ; les registres de modèles (MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>) partiellement (artefact de modèle seul). Presque personne ne regroupe le **prompt template** dans le SHA, qui est précisément le champ qui change le plus souvent.

### Capacité 2. Contrôle de version atomique sur tous les composants de la release

Ce que c'est : la bascule de la release A à la release B retourne *tout* en une seule instruction — poids et prompt et routage et dataset et prétraitement — pas comme cinq éditions de tableau de bord séparées.

Pourquoi cela compte : les bascules partielles créent des fenêtres de comportement indéfini. Si le prompt se met à jour mais que la règle de routage ne l'a pas fait, chaque requête atteignant le nouveau prompt avec l'ancienne classe de routage est dans un état que personne n'a planifié.

Qui le livre : personne complètement. Le camp canary de service bascule atomiquement l'image du modèle ; le prompt et le routage vivent généralement ailleurs. La bascule pilotée par manifeste est d'où vient la revendication de rollback atomique de Divinci<sup><a href="#ref-5">[5]</a></sup>.

### Capacité 3. Parité d'environnement entraînement-service

Ce que c'est : le pipeline de prétraitement utilisé pendant l'évaluation de porte est le *même* prétraitement qu'utilise le serveur de production. S'ils divergent, chaque chiffre hors-ligne est un mensonge.

Pourquoi cela compte : la dérive entraînement-service est l'un des [dix échecs de release](/fr/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) sur lesquels nous avons écrit. Le symptôme est « se comporte bien à l'eval, se comporte comme un modèle différent en production ». Le remède est d'enregistrer le prétraitement dans le manifeste et de gater face à la version de prétraitement de production.

Qui le livre : les frameworks de conteneurisation (BentoML, KServe) obtiennent un crédit partiel en colocalisant prétraitement et service. Aucun d'eux ne lie le prétraitement à l'entrée de la porte d'évaluation.

## Étape ② — Gater

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Spearman ρ par tranche face à un évaluateur ancré sur l'humain.</span>
  </div>
</div>

### Capacité 4. Porte de qualité par tranche / par domaine

Ce que c'est : la décision de porte consomme des scores *par tranche* — rédaction de contrats, interprétation statutaire, licences de PI — pas un seul agrégat. Toute tranche unique tombant sous son seuil marque la release `gate_fail`, peu importe à quoi ressemble la moyenne.

Pourquoi cela compte : les scores agrégés noient les régressions localisées. L'analyse *Semver Lie* de Tianpan<sup><a href="#ref-3">[3]</a></sup> nomme cela comme le mode d'échec de release LLM dominant en 2026 : un modèle qui s'améliore en moyenne tout en s'effondrant tranquillement sur une classe de parcours utilisateur.

Qui le livre : **personne d'autre en 2026**. Les outils eval-CI — Braintrust, Humanloop, Patronus — scorent face à une grille globale unique ou à une liste de tâches plate. Ils n'exposent pas de seuil par tranche ni d'override aveugle aux tranches. C'est le premier endroit où les camps ne se rejoignent pas.

### Capacité 5. Juge calibré ancré sur l'humain (Spearman ρ vs notes humaines)

Ce que c'est : le juge n'est pas un LLM-as-judge générique. C'est un juge LLM dont le Spearman ρ face à un panel d'experts du domaine est mesuré et configuré par tranche. Le juge est sélectionné parce que ses rangs correspondent à ceux de l'humain, pas parce qu'il a une forte réputation.

Pourquoi cela compte : MT-Bench<sup><a href="#ref-6">[6]</a></sup> montre que GPT-4-as-judge est d'accord avec les humains à >80 % globalement, avec une variance par catégorie allant du code (86 %) à l'écriture (36–44 %). « L'accord global » masque les tranches où le juge n'est pas fiable. Calibrer le juge par tranche est la seule façon honnête de rendre le scoring automatisé digne de confiance.

Qui le livre : Braintrust, Humanloop, Patronus exécutent des évaluateurs-juges. Aucun d'eux n'exige, n'expose ou ne persiste une calibration Spearman par tranche ancrée sur l'humain. Le pipeline de calibration Divinci est documenté dans [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/).

### Capacité 6. Chemin d'override avec justification écrite obligatoire

Ce que c'est : forcer un override d'un échec de porte est autorisé (cold starts, régressions acceptées, etc.) mais exige deux champs — `forceGateOverride: true` ET `overrideReason: "..."`. La raison va dans la piste d'audit aux côtés de l'ID utilisateur. Aucun override anonyme.

Pourquoi cela compte : les portes de gouvernance ne sont pas une fonctionnalité de conformité séparée ; elles sont une propriété de l'étape de porte elle-même. La piste d'audit doit répondre non seulement à « cet override a-t-il été utilisé ? » mais à « quelle était la justification à ce moment-là ? » — parce que le vous du futur a besoin de la lire.

Qui le livre : les outils eval-CI ont des flags ; aucun d'eux n'exige la justification comme partie structurelle de l'override.

## Étape ③ — Dérouler

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">DÉROULER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary à 5 % → 25 % → 100 % avec un moniteur de qualité à chaque étape.</span>
  </div>
</div>

### Capacité 7. Canary multi-points-de-contrôle avec temps de séjour

Ce que c'est : le trafic passe de 0 % à la production via au moins trois points de contrôle — typiquement **5 % → 25 % → 100 %** — et tient à chacun pendant soit un temps de séjour configuré, soit un nombre de requêtes configuré, le plus *tardif* des deux. Pas de 0 %→100 % instantané.

Pourquoi cela compte : les bugs de longue traîne ne surgissent qu'à l'échelle. Un bug qui affecte 0,3 % des conversations est invisible sur une eval de 100 prompts et évident à 5 % du trafic de production. Le temps de séjour est ce qui donne au canary le temps de voir la longue traîne.

Qui le livre : le camp canary de service livre ça. AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> documente un `TerminationWaitInSeconds` par défaut de 600 (dix minutes). KServe, BentoCloud, Seldon et Vertex exposent tous des configurations canary multi-étapes similaires. C'est la capacité saturée.

### Capacité 8. Moniteur de qualité de sortie à chaque point de contrôle du canary

Ce que c'est : à chaque point de contrôle, le pipeline vérifie trois moniteurs avant d'avancer — latence p95, taux de 5xx, **et** un score de qualité de sortie calculé par le même juge calibré de la capacité 5. La latence et les 5xx seuls ne suffisent pas.

Pourquoi cela compte : c'est là que les camps échouent à se rejoindre à nouveau. SageMaker, KServe, Vertex, BentoCloud, Seldon surveillent tous la latence et le taux d'erreur. Aucun d'eux ne livre un moniteur de qualité de sortie par point de contrôle — parce qu'ils n'ont pas de juge calibré contre lequel scorer. Les outils eval-CI ont le juge mais ne sont pas posés sur le trafic.

Qui le livre : personne ne complète le pont. L'infrastructure de canary avec temps de séjour existe dans le camp service ; le juge calibré existe dans le camp eval-CI ; nous n'avons vu personne les connecter.

### Capacité 9. Arrêt automatique sur dépassement de qualité

Ce que c'est : un point de contrôle de canary qui échoue sur la qualité de sortie s'arrête automatiquement. La promotion n'avance pas. Aucun bip humain requis pour stopper le déroulement.

Pourquoi cela compte : les humains ne sont pas dans la boucle dans l'échelle de temps où les déroulements avancent. Au moment où le ticket client arrive, le point de contrôle à 25 % est fini et la promotion à 100 % a eu lieu.

Qui le livre : le camp canary de service s'arrête sur les métriques d'infrastructure. L'arrêt sur métrique de qualité est la partie qui exige que la capacité 8 existe.

## Étape ④ — Observer

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Replay continu des traces → rollback atomique en ~12 s.</span>
  </div>
</div>

### Capacité 10. Replay continu des traces de production à travers le candidat

Ce que c'est : après que le canary a promu à 100 %, l'observateur continue de tourner. Il échantillonne les traces de production récentes, les rejoue à travers la release *candidate* (maintenant active), les score avec le juge calibré, et émet un score de qualité par minute. Continu, pas périodique.

Pourquoi cela compte : les chutes silencieuses de qualité — le modèle esquive, hallucine une date avec assurance, refuse là où il ne devrait pas — ne bougent jamais la latence ni les 5xx. Le seul signal que vous obtenez pour celles-ci est le ticket client, qui est le pire signal possible. Un moniteur de qualité continu les attrape en quelques minutes à un chiffre.

Qui le livre : **personne.** Le camp observabilité (Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>) surveille la sortie de production mais n'impose rien. Le camp canary de service surveille l'infra. Le camp eval-CI n'est pas posé sur le trafic. La boucle fermée — traces de production → juge calibré → application — est la couture manquante.

### Capacité 11. Rollback atomique en secondes, pas en minutes

Ce que c'est : quand l'observateur déclenche (trois minutes consécutives sous le seuil, disons), le rollback se déclenche automatiquement. Le rollback repointe le routage vers `previous_release` depuis le manifeste. Parce que la release précédente était un manifeste entièrement groupé, chaque composant bascule atomiquement. De bout en bout, drain des requêtes en cours inclus sur un service à ~100 répliques : environ 12 secondes<sup><a href="#ref-5">[5]</a></sup>.

Pourquoi cela compte : la panne de Cloudflare de juin 2022<sup><a href="#ref-8">[8]</a></sup> a pris 44 minutes pour être annulée. La cause n'était pas le revert lui-même — c'était que les ingénieurs se marchaient sur les reverts les uns des autres parce que l'état était réparti. Le rollback piloté par manifeste est en instruction unique ; il ne peut pas avoir ce mode d'échec.

Qui le livre : le camp canary de service livre un rollback d'infrastructure rapide (déclenché par alarme, bascule bleu-vert). La différence architecturale est de savoir si le *déclencheur* est purement infra ou conscient de la qualité (capacité 10).

### Capacité 12. Reçu de conformité chaîné par hash et ancrable en externe

Ce que c'est : chaque décision de release — enregistrement, passage de porte, échec de porte, override de porte, promotion de point de contrôle, auto-rollback — émet un reçu JSON-avec-SHA-256, chaîné par hash au reçu précédent pour ce client et au reçu précédent pour cette release. La chaîne est ancrée en externe selon un calendrier que le client configure.

**Mise en garde poids ouverts.** Quand la release est adossée à un modèle à poids ouverts (Gemma, Qwen, Llama, Mistral, GPT-OSS), le reçu intègre une [attestation de poids vindex](/fr/compliance/) — une preuve que les poids actifs au moment de la décision sont les poids que le manifeste a enregistrés. Quand la release est adossée à un modèle d'API fermée (OpenAI, Anthropic, Google via des API opaques), le reçu couvre la chaîne de décision mais ne peut pas revendiquer la traçabilité des poids, parce que le fournisseur n'expose pas les poids. Le reçu le dit explicitement. C'est la limite de ce qui est vérifiable.

Pourquoi cela compte : les industries régulées obtiennent des *logs* aujourd'hui. L'EU AI Act et le NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> demandent de plus en plus des *preuves*. Un reçu chaîné par hash est la différence entre « nous avons un log » et « un auditeur peut vérifier la chaîne sans faire confiance à notre log ».

Qui le livre : personne d'autre. C'est la partie de la différenciation qui correspond directement à la [page de conformité](/fr/compliance/) existante de Divinci — même format de reçu, étendu aux décisions de release.

## Les 12 capacités, par camp de plateforme

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrice des 12 capacités par camp de plateforme. Divinci a les 12. Le camp Eval-CI (Braintrust, Humanloop, Patronus) a 5 et 6. Le camp Canary de service (SageMaker, KServe, BentoCloud, Vertex, Seldon) a 1 partielle, 2 partielle, 7, 9 et 11 sur métriques d'infrastructure. Le camp Registre de modèles (W&B Models, MLflow, LangSmith) a 1 partielle et 2 partielle. Le camp Observabilité (Arize, Phoenix, Confident, Deepchecks) a 10 sous forme monitoring seul. Personne d'autre n'a 4 porte par tranche, 5 juge calibré ancré sur l'humain, 8 moniteur de qualité canary, 10 replay de traces en boucle fermée avec application, ou 12 reçus chaînés par hash.">
<title>Les 12 capacités, par camp</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Quel camp livre quelle capacité</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = livre. ◐ = partiel (infra uniquement, ou registre uniquement). ✗ = ne livre pas. Six capacités manquent dans tous les autres camps.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">Capacité</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">Eval-CI</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">Service</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">Registre</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">Observer</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. SHA de manifeste immuable</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. Bascule de version atomique (tous composants)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. Parité d'environnement entraînement-service</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. Porte de qualité par tranche / par domaine</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. Juge calibré ancré sur l'humain</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. Chemin d'override avec justification obligatoire</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. Canary multi-points-de-contrôle avec séjour</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. Moniteur de qualité de sortie à chaque point</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. Auto-arrêt sur dépassement de qualité</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. Replay de traces de production en boucle fermée</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. Rollback atomique en secondes</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. Reçu de conformité chaîné par hash</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">Capacités 4, 5, 8, 10, 12 mises en évidence : ce sont les cinq sans aucune autre livraison dans ce scan. Le reste se regroupe dans un camp ou un autre.</text>
</svg>
</figure>

Le motif est le propos. Cinq capacités — **porte par tranche, juge calibré, moniteur de qualité canary, replay en boucle fermée, reçu chaîné par hash** — s'affichent en ✗ à travers tous les autres camps. C'est ça, la couture. Les sept autres se répartissent dans les camps de manières qui rendent chaque camp cohérent en interne mais mutuellement incomplet.

## En quoi la QA est-elle différente pour des modèles de langage personnalisés que pour le logiciel ?

Les LLMs ne sont pas déterministes, même à température zéro — le batching et les différences matérielles causent une variation des sorties. Cette seule propriété casse la plupart des hypothèses sur lesquelles la QA traditionnelle a été construite :

- **Vous ne pouvez pas écrire des assertions `expect(output).toEqual(X)`.** Vous avez besoin d'une évaluation consciente de la distribution qui consomme une corrélation de rang face à un évaluateur ancré sur l'humain, pas une égalité face à une fixture. C'est ce qu'est la capacité 5.
- **Un modèle peut passer une vérification de qualité agrégée tout en échouant sur une tranche.** C'est pourquoi la capacité 4 existe séparément. Si votre eval ne peut pas trancher, elle ne peut pas attraper les régressions conscientes des tranches.
- **Les échecs de qualité sont silencieux au niveau de l'infrastructure.** La latence et les 5xx restent propres pendant que le modèle esquive ou hallucine. Les capacités 8 et 10 existent parce qu'aucun moniteur côté infrastructure ne peut voir cela.
- **Le rollback n'est pas optionnel.** Parce que les modes d'échec sont probabilistes et que certains sont silencieux, le chemin de rollback doit être de l'infrastructure primaire, pas un plan de secours. La capacité 11 est ce qui rend « 12 secondes » atteignable ; la capacité 2 est ce qui le rend correct.

Une plateforme de QA-et-release qui ne tient pas compte de ces quatre faits livre du CI/CD logiciel déterministe avec un logo LLM collé dessus. Le marché le fait beaucoup.

## Comment les pistes d'audit soutiennent-elles la conformité IA, en pratique ?

L'écart de conformité le plus courant que nous voyons — quand un auditeur arrive six mois après le déploiement et demande « quelle version du modèle tournait le 15 mars, et qui a approuvé cette release ? » — n'est pas « nous n'avons pas de logs ». C'est « nous avons des logs à travers cinq systèmes et les chronologies ne s'alignent pas ».

Un reçu de conformité (capacité 12) résout cela en faisant du log lui-même un artefact portable : chaîné par hash, source unique, ancrable en externe. Un auditeur peut vérifier la chaîne sans faire confiance à notre infrastructure. C'est la différence entre « nous avons des enregistrements » et « les enregistrements sont prouvables ».

Pour les adossements à modèles à poids ouverts, le reçu inclut aussi une attestation de poids — une preuve cryptographique que les poids actifs sont les poids que le manifeste a enregistrés. Cela satisfait les demandes plus difficiles (article 17 du RGPD, droit à l'effacement ; traçabilité de l'EU AI Act) parce que vous pouvez prouver *non seulement ce qui a été déployé* mais *que les poids sous-jacents sont bien ce qu'ils prétendent être*.

Pour les adossements à API fermée — quand le modèle est servi derrière une API opaque et que les poids ne sont pas exposés — le reçu couvre la chaîne de décision mais ne peut pas revendiquer la traçabilité des poids. Nous le disons dans le reçu explicitement plutôt que d'impliquer une preuve que nous ne pouvons pas livrer. C'est la limite de ce qui est vérifiable quand le fournisseur garde les poids en interne.

## Ce que cette checklist ne résout pas

Trois limitations honnêtes :

**Les capacités ne sont pas des cases à cocher pour elles-mêmes.** Une plateforme qui livre les douze mal est pire qu'une qui en livre huit bien. La checklist est un point de départ pour l'évaluation, pas un tableau de score pour des RFPs fournisseurs.

**L'instantané concurrentiel est de 2026 et va bouger.** Six mois plus tard, certaines des marques ✗ ci-dessus vont basculer — les concurrents vont lire les postmortems et combler les manques. Si vous lisez ce billet en 2027, auditez vous-même les marques avant d'y croire.

**Certaines capacités dépendent d'autres.** La capacité 8 (moniteur de qualité canary) requiert la capacité 5 (juge calibré). La capacité 10 (replay de traces en boucle fermée) requiert les deux. Une plateforme qui livre 8 sans 5 livre un placebo — le moniteur canary existe mais n'est ancré contre rien de digne de confiance.

## FAQ

### Quelle est la capacité QA la plus importante pour les releases de LLM personnalisé ?

Une porte de qualité par tranche (capacité 4) — c'est-à-dire que la décision de release consomme des scores Spearman par domaine face à un évaluateur ancré sur l'humain, pas un seul agrégat global. Les scores agrégés noient les régressions localisées, et les régressions localisées sont le mode d'échec de release LLM dominant en 2026<sup><a href="#ref-3">[3]</a></sup>. Si vous ne pouvez livrer qu'une seule capacité de cette liste, livrez la 4. Puis livrez la 5, qui est ce qui rend la 4 digne de confiance.

### Comment évaluer une plateforme QA LLM sans la faire tourner pendant six mois ?

Appliquez la checklist en 12 capacités ci-dessus à la documentation fournisseur, avec deux tests spécifiques. Premièrement, demandez au fournisseur de vous montrer la sortie de porte *par tranche* pour l'un de leurs clients de référence — s'ils n'ont que des scores agrégés, ils n'ont pas la capacité 4. Deuxièmement, demandez ce qui déclenche leur auto-rollback — si la réponse est « la latence, le taux d'erreur et nos alarmes », ils sont dans le camp canary de service et la capacité 10 manque.

### Quelle est la différence entre les outils eval-CI et les outils de release management ?

Les outils eval-CI (Braintrust, Humanloop, Patronus) lancent des évaluateurs automatisés au merge de PR et bloquent les mauvais merges. Ils ne touchent jamais au trafic live. Les outils de release management (cette catégorie) possèdent le manifeste de release, le canary, l'observateur et le chemin de rollback. L'eval-CI est *une partie d'* un workflow de release management mais n'en est pas un remplacement. Beaucoup d'équipes livrent l'un des deux et découvrent l'écart quand une régression qui a passé CI touche silencieusement la production.

### À quelle vitesse le rollback devrait-il être ?

À l'ordre de grandeur des secondes, pas des minutes. Le temps moyen de rollback sur le pipeline Divinci est d'environ 12 secondes — c'est le drain des requêtes en cours sur un service à ~100 répliques, pas la bascule du manifeste elle-même, qui est sub-seconde. Comparez à l'incident Cloudflare de juin 2022<sup><a href="#ref-8">[8]</a></sup>, qui a pris 44 minutes pour être annulé parce que l'état était réparti sur plusieurs systèmes. La décision architecturale qui rend les secondes-pas-les-minutes possibles est le manifeste de release groupé (capacités 1 et 2).

### Pourquoi les reçus de conformité comptent-ils plus que les logs de conformité ?

Un log est quelque chose que vous avez écrit. Un reçu est quelque chose qu'un auditeur peut vérifier sans vous faire confiance. L'EU AI Act et le NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> distinguent de plus en plus les deux — « documenté » n'est pas la même chose que « prouvable », et la direction réglementaire va vers ce dernier. Un reçu chaîné par hash et ancré en externe est la technologie disponible la plus simple pour franchir cette ligne.

## Références

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR avril 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. « L'approche accélérée Restoration 2 a pris environ 12 heures pour restaurer un site. » Cité pour la capacité 1 — à quoi ressemble l'état réparti sur plusieurs systèmes à l'échelle.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / Registre MLflow.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> et <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. Le côté artefact-de-modèle-seul de la capacité 1. Aucun ne livre l'enregistrement du prompt template.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (avril 2026). Nomme le mode d'échec de régression consciente des tranches comme le motif dominant de 2026. Compagnon : <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Ancre pour la capacité 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> et <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. <code>TerminationWaitInSeconds</code> par défaut de 600 (dix minutes), maximum 1800 (trente minutes). Le canary standard à métriques d'infrastructure contre lequel le billet contraste sur les capacités 8 et 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interne — bascule de routage atomique via manifeste de release.</strong> Le temps de rollback de ~12 secondes est le drain des requêtes en cours sur un service à ~100 répliques ; la bascule du manifeste elle-même est sub-seconde. Le nombre vient de notre propre service, pas d'un benchmark. L'architecture qui le rend possible est le manifeste groupé de la capacité 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Variance par catégorie du LLM-as-judge.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80 % d'accord global GPT-4-vs-humain, avec une variance par catégorie du code (86 %) à l'écriture (36–44 %). Ancre pour la capacité 5 — pourquoi un juge calibré doit être par tranche.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Comparaison du camp observabilité.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">la comparaison 2026 des outils d'observabilité de Confident AI</a>. Tous livrent du monitoring et de l'alerte ; aucun n'impose un rollback. Ancre pour le cadrage « monitor sans application » de la capacité 10.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Panne Cloudflare de juin 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. « 06:58 : cause racine trouvée et comprise. Le travail commence pour annuler le changement problématique… 07:42 : Le dernier des reverts a été terminé. » 44 minutes entre « nous savons quoi annuler » et le revert terminé, en partie parce que les ingénieurs se marchaient sur les reverts. Ancre pour la capacité 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Gouvernance, cartographie, mesure, gestion — les quatre fonctions centrales sur lesquelles la capacité 12 se mappe. Plus les exigences de traçabilité de l'EU AI Act sur <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Ancre pour la capacité 12.
</li>
</ol>

---

*Prochain dans cette série :* **Valider et livrer des LMs personnalisés dans des domaines régulés.** La checklist de capacités ci-dessus est générique. Le prochain billet est spécifique : l'EU AI Act, l'article 17 du RGPD, HIPAA et le NIST AI RMF — ce que chacun demande à un processus de release, quelles capacités ci-dessus couvrent quelle exigence, et où le partage poids ouverts / poids fermés change réellement l'histoire de conformité.
