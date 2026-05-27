+++
title = "Pipelines CI/CD LLM automatisés avec rollback instantané"
description = "La couche opérationnelle sous le pipeline de release en quatre étapes — quelles décisions se déclenchent automatiquement, lesquelles nécessitent une intervention humaine, à quoi ressemble réellement un exercice de rollback, et le chiffre de MTTR qui en ressort."
date = 2026-05-30T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "CI/CD", "Automation", "Rollback", "MTTR", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-llm-ci-cd-pipelines-with-instant-rollback-veo31.webm"
hero_video_poster = "/images/automated-llm-ci-cd-pipelines-with-instant-rollback-hero-poster.webp"
reading_time = 11
summary = "Entre les portes d'approbation humaines, un pipeline de release LLM s'exécute tout seul ou il ne le fait pas. Cet article est le compagnon opérationnel du billet d'architecture — il trace le spectre d'automatisation (quelles décisions se déclenchent automatiquement, lesquelles requièrent un humain, et lesquelles sont arrêtées net jusqu'à ce que quelqu'un signe l'override), montre à quoi ressemble réellement un exercice de rollback, et se termine par le chiffre de MTTR qui en ressort."
+++

*Notes du cycle de release — Partie V*

---

La page la plus citée qui n'est pas sortie le trimestre dernier est celle pour laquelle notre observer s'est déclenché tout seul à 2h14 du matin. La release candidate avait passé la porte, attendu pendant les quatre minutes requises à 5%, progressé à 25%, puis était restée là. Le moniteur de qualité par minute a vu trois lectures consécutives sous le seuil sur le slice du domaine juridique, a arrêté le rollout et a redirigé le routage vers la release précédente. Au moment où la notification de l'ingénieur d'astreinte s'est déclenchée — pour le reçu, pas pour une panne — le trafic de production était revenu sur la release connue comme saine depuis neuf minutes.

Personne n'avait besoin de faire quoi que ce soit. L'architecture du [premier article de cette série](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) décrit ce que sont les quatre étapes. Cet article porte sur ce qui s'exécute entre les approbations humaines — la couche d'automatisation sous l'architecture, la frontière où le pipeline fait la bonne chose tout seul, ou ne le fait pas.

L'affirmation centrale : **la plupart des décisions de pipeline doivent être automatisées, mais pas toutes**. La frontière compte. Le pipeline qui automatise tout finira par promouvoir une release qu'un humain aurait dû intercepter ; le pipeline qui n'automatise rien n'a aucun objet. Tracer la frontière correctement est ce dont il est question dans cet article.

## Le spectre d'automatisation

Chaque décision de pipeline se situe quelque part sur un spectre allant de *« se déclenche tout seul sans notification humaine »* à *« refuse d'avancer sans une approbation explicite et signée »*. Voici où se situe chacune des actions structurantes du pipeline sur ce spectre dans notre pipeline en production.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Le spectre d'automatisation. Entièrement automatisé à gauche, toujours soumis à approbation humaine à droite. Décisions placées : à l'extrémité entièrement automatisée, l'évaluation par l'observer de qualité par minute, le contrôle de santé du checkpoint canary et le déclencheur d'auto-rollback ; au milieu, l'avancée gate-pass et la promotion du checkpoint canary ; vers le côté humain, l'enregistrement du déploiement en production et le commit du manifeste ; à l'extrémité toujours-humaine, la décision d'override en cas d'échec de porte et le déploiement shadow d'une release cold-start.">
<title>Le spectre d'automatisation</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Le spectre d'automatisation</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Où se situe chaque décision structurante du pipeline, de l'entièrement autonome (gauche) au toujours-humain (droite).</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">ENTIÈREMENT AUTOMATISÉ</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">se déclenche seul,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">sans notification</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">NOTIFICATION SEULE</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">s'exécute automatiquement ;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">reçu + alerte</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">AVANCE-SI-OK</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">un humain peut opposer un veto</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">dans une fenêtre connue</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">INITIÉ PAR L'HUMAIN</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">requiert une action</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">utilisateur explicite</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">TOUJOURS HUMAIN</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">refuse sans</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">justification signée</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Évaluation qualité</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">par minute (observer)</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">s'exécute en continu</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">sur un échantillon de 5% de traces</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Contrôle de santé</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">du checkpoint canary</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + qualité</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">de sortie à 5/25/100</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Déclencheur</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">d'auto-rollback</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 minutes consécutives</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">sous le seuil</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Avancée gate-pass</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">vers le canary</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">tous les slices ≥ seuil</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ auto-démarrage à 5%</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Checkpoint</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">avance si les moniteurs</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">tiennent pendant le palier</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Enregistrement</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">de release</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">le client commit</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">un nouveau manifeste</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Override en cas d'échec</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">requiert une justification</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">écrite dans le journal d'audit</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">Marqueurs rouges</tspan> = les deux décisions où le comportement du pipeline est asymétrique : l'auto-rollback se déclenche tout seul et vous ne pouvez pas vous y soustraire ; l'override en cas d'échec de porte refuse d'avancer et vous ne pouvez pas sauter la justification.</text>
</svg>
</figure>

Deux des marqueurs ci-dessus sont rouges plutôt que colorés selon leur zone. Ce sont les décisions asymétriques — les deux endroits où le pipeline prend une position forte sur qui peut décider quoi. Le **déclencheur d'auto-rollback** se déclenche sans demander ; vous ne pouvez pas le désactiver, parce que tout l'intérêt de l'avoir est qu'il fonctionne à 2h14 du matin. L'**override en cas d'échec de porte** refuse d'avancer sans une justification écrite ; vous ne pouvez pas non plus le désactiver, parce que tout l'intérêt de l'avoir est que le vous-du-futur a besoin de lire la raison. La plupart du reste du pipeline est configurable ; ces deux-là ne le sont pas.

## Comment l'auto-rollback se déclenche réellement

La question la plus posée sur l'auto-rollback est *« qu'est-ce qui l'empêche de se déclencher pour la mauvaise raison ? »*. La réponse honnête est : rien à lui seul. La protection vient de la façon dont le déclencheur est câblé.

L'étape Observe exécute une boucle de scoring par minute. Chaque minute elle :

1. Échantillonne un petit ensemble de traces récentes de production de la release active.
2. Rejoue chaque trace à travers le *modèle actif* (pas la candidate — nous scorons ce qui sert réellement).
3. Score chaque rejeu à l'aide du même juge calibré ancré sur l'humain qui a piloté Gate-2<sup><a href="#ref-1">[1]</a></sup>.
4. Calcule un score unique de qualité de sortie sur l'échantillon. Écrit dans `CanaryHealthSample`.

Le rollback se déclenche lorsque **trois échantillons consécutifs par minute** tombent sous le seuil de rollback (par défaut : 0,85 du seuil de la porte — donc 0,55 si la porte était à 0,65). Pas une seule minute mauvaise ; trois. Le verrou de trois minutes est le filtre anti-bruit — une lecture anormale isolée ne déclenche rien, mais une régression soutenue oui.

Lorsque le verrou se rompt, le worker de rollback exécute :

```bash
# En pratique — le pipeline exécute ceci tout seul. Aucun ack humain.
POST /api/v1/releases/<previous_release_sha>/activate
# réponse en <1s ; drain en vol en ~12s sur un service ~100 réplicas
```

Un reçu se déclenche. L'ingénieur d'astreinte voit une notification Slack *pour le reçu*, pas pour une panne. Il ouvre le reçu ; il voit les trois lectures sous le seuil, le temps écoulé et les hachages `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup>. Douze secondes correspondent au temps de drain en vol ; le swap lui-même est sous la seconde. Quand l'ingénieur est suffisamment réveillé pour demander « ai-je besoin de faire quelque chose ? », la réponse est « non, mais vous devriez quand même regarder pourquoi la porte a laissé passer ceci ».

## Le reçu réel d'un auto-rollback

Voici à quoi ressemble le reçu en production. Même format chaîné par hachage que documenté sur la [page de conformité](/fr/compliance/), avec les champs supplémentaires spécifiques à un événement d'auto-rollback :

```json
{
  "kind": "auto_rollback",
  "release_id": "rel_a01c66",
  "previous_release_id": "rel_8f72b1",
  "trigger_at": "2026-05-29T02:14:23Z",
  "completed_at": "2026-05-29T02:14:35Z",
  "elapsed_seconds": 12,
  "trigger_reason": "observer_quality_threshold_breach",
  "observer_readings": [
    { "minute_at": "2026-05-29T02:11:00Z", "quality_score": 0.523, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:12:00Z", "quality_score": 0.508, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:13:00Z", "quality_score": 0.491, "below_threshold": true,  "slice": "legal-IP-licensing" }
  ],
  "rollback_threshold": 0.55,
  "active_manifest_sha256_before": "9abaeaf6c91f8b...",
  "active_manifest_sha256_after":  "8f72b1de4a93c5...",
  "audit_chain_signature": "sha256(...)",
  "notified_users": ["oncall@customer.example"],
  "notification_sent_at": "2026-05-29T02:14:36Z"
}
```

Le reçu lui-même est le premier point de contact de l'astreinte. Le lire répond aux questions qu'un ingénieur à moitié réveillé poserait réellement : qu'est-ce qui l'a déclenché, quel slice a échoué, de combien, combien de temps le swap a pris, ce qui tourne maintenant. La prochaine action évidente depuis là est généralement *« allez voir pourquoi la porte a laissé passer ça en premier lieu »* — et le reçu de la release défaillante contient déjà le tableau Spearman par slice.

## Ce que le pipeline ne fait PAS tout seul

Le corollaire de « l'auto-rollback se déclenche sans demander » est que certaines autres choses ne le peuvent activement pas. Trois refus explicites.

**Il ne promeut pas une release qui a échoué à la porte sans un override signé.** Un échec de porte marque la release `gate_fail` ; le endpoint `/activate` refuse d'accepter le SHA du manifeste ; aucune incantation en ligne de commande ne contourne cela. La seule voie d'avancement est un force-override avec `forceGateOverride: true` ET `overrideReason: "<texte libre>"`. Le champ de raison est obligatoire, en texte libre, et va dans le journal d'audit aux côtés de l'ID utilisateur. Nous avons conçu cela pour que le vous-du-futur puisse lire pourquoi le vous-actuel a décidé que la régression du slice était acceptable. Trois personnes ont utilisé la voie d'override en production. Leurs justifications sont toujours dans le journal d'audit.

**Il ne passe pas de canary à 100% si un quelconque moniteur se dégrade.** Si la latence p95, le taux de 5xx OU le score de qualité de sortie est en dehors de sa bande à la fin d'un palier de checkpoint, le pipeline s'arrête à ce checkpoint et alerte. Il n'avance pas en s'excusant plus tard.

**Il ne passe pas en auto-canary une release cold-start.** Une release sans historique de trafic de production — un fine-tune frais sur un dataset tout neuf, disons — n'a rien à quoi comparer sa qualité de sortie. Le pipeline refuse de démarrer un canary sur une release cold-start. Nous exigeons d'abord un déploiement shadow de 24 heures, qui observe la candidate face aux traces de production réelles mais ne sert aucune de ses réponses. Après 24 heures, nous avons une baseline de qualité ; le canary peut alors avancer. Plus lent ; honnête ; non configurable.

## À quelle vitesse se fait la récupération, de bout en bout ?

Le temps de récupération que nous publions est de **12 secondes**. C'est le drain en vol sur un service à ~100 réplicas. Le swap de manifeste lui-même est sous la seconde. Pour être utile à un lecteur, les 12 secondes doivent être décomposées :

- **0–60 secondes avant le rollback :** les trois lectures consécutives sous le seuil arrivent. La première lecture sous le seuil démarre le minuteur de verrou. Chaque minute suivante étend le verrou si la qualité est toujours sous le seuil.
- **t = 0 :** la troisième lecture sous le seuil s'écrit dans `CanaryHealthSample`. Le worker de rollback observe le troisième strike et dépêche `/activate previous_release`.
- **t < 1 seconde :** le pointeur de release active de la couche de routage (dans Redis) bascule. Les nouvelles requêtes commencent à frapper la release précédente.
- **t = 1 à ~12 secondes :** la release candidate continue de servir toutes les requêtes qui étaient en vol au moment du swap. Drain en vol. Certaines réponses en streaming prennent 8 à 10 secondes pour se terminer naturellement, donc la traîne de nettoyage est d'environ 12s sur un service typique.
- **t ≈ 13 secondes :** le reçu du journal d'audit est écrit et signé. La notification se déclenche.

Comparé aux post-mortems publics que nous citons en référence : la panne de Cloudflare de juin 2022<sup><a href="#ref-3">[3]</a></sup> a pris 44 minutes entre « nous savons ce qu'il faut annuler » et « l'annulation est terminée » — et c'était au niveau *infrastructure*. La panne d'Atlassian d'avril 2022<sup><a href="#ref-4">[4]</a></sup> a pris 12 heures par site parce que l'état était réparti sur plusieurs systèmes. Le seuil DORA<sup><a href="#ref-5">[5]</a></sup> pour la récupération après déploiement échoué chez les « elite performers » est documenté à moins d'une heure. Douze secondes, ce n'est pas un ordre de grandeur de mieux que le seuil élite — c'est trois ordres de grandeur de mieux. La décision architecturale qui rend cela possible est le manifeste de release groupé de [l'étape 1](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register). Sans le manifeste, vous n'avez pas un seul objet vers lequel re-pointer le routage.

## Exercices de rollback — la pratique peu glamour que personne n'exécute

Voici la partie que la plupart des équipes sautent : **le seul signal fiable que votre chemin de rollback fonctionne, c'est d'avoir exécuté un exercice délibéré et planifié et de l'avoir confirmé.** Chaque trimestre, nous en exécutons un. L'exercice se déroule ainsi :

1. Choisir une heure aléatoirement planifiée, en semaine et en heures ouvrées. Prévenir l'équipe que cela arrive, mais pas l'heure précise.
2. Injecter une régression de qualité synthétique sur le slice canary. (Nous avons un drapeau de mode test qui permet au modèle candidat de répondre à un en-tête magique par « je refuse de répondre » — garanti pour faire échouer le juge calibré.)
3. Pousser la release de test à travers la porte (elle passe — nous testons le rollback, pas la porte). Démarrer un canary.
4. L'observer remarque trois lectures sous le seuil. L'auto-rollback se déclenche.
5. Attendre la réaction de l'ingénieur d'astreinte. Chronométrer combien de temps il prend. Noter s'il fait suffisamment confiance au reçu pour *ne pas* alerter en retour comme s'il s'agissait d'une alarme.
6. Vérifier que le journal d'audit montre le drapeau de mode test dans le reçu de rollback, afin que les audits futurs puissent distinguer un exercice d'un incident réel.

Le premier exercice que nous avons exécuté a pris 19 secondes de bout en bout (12s de swap + un délai de stabilisation de 7s que nous avons dû corriger). L'exercice le plus récent — T1 2026 — a pris 12 secondes. L'exercice n'a jamais le droit d'être sauté. Chaque trimestre ; chaque cluster client.

La plupart des équipes n'ont jamais exécuté un exercice de rollback délibéré. La première fois que leur chemin de rollback s'exécute, c'est lors d'un incident réel, sous pression, avec plusieurs personnes dans l'appel. L'exercice est ce qui fait du chiffre de 12 secondes un chiffre réel plutôt qu'aspirationnel.

## Ce que cela ne résout pas

Trois limitations honnêtes :

**L'auto-rollback peut faire du ping-pong.** Si à la fois la candidate ET la release précédente sont mauvaises — disons, la release précédente avait aussi une régression de slice à développement lent que personne n'avait attrapée — le pipeline peut faire un rollback, puis la release précédente échoue aussi à son observer post-rollback, et il n'y a pas de troisième release vers laquelle faire un rollback. Le pipeline arrête le trafic et envoie vers une page de maintenance plutôt que de s'agiter. Le correctif est de garder plus d'une release antérieure saine indexée dans la chaîne de manifestes pour que la cible de rollback soit configurable.

**L'observer ajoute un coût d'inférence.** Rejouer des traces de production à travers le modèle actif sur un échantillon de 5% ajoute environ 5% à la dépense d'inférence. Nous pensons que c'est le bon compromis. Certains clients trouvent cela trop coûteux pour des charges de travail à faible marge et veulent baisser le taux d'échantillonnage. Le réglage existe.

**Un mauvais juge est pire que pas de juge.** Si le juge calibré qui pilote l'observer est lui-même mal calibré — décalé par rapport à l'ancrage humain, ou entraîné sur un corpus obsolète — l'observer peut déclencher un auto-rollback pour la mauvaise raison. La cadence de recalibrage compte. L'article Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup> documente la procédure ; l'exigence opérationnelle est que vous l'exécutiez effectivement.

## FAQ

### Pourquoi le déclencheur de rollback est-il de trois minutes consécutives plutôt qu'une seule ?

Parce que les scores de qualité LLM ont un plancher de bruit — une lecture anormale isolée peut venir d'un aléa d'échantillonnage (l'échantillon de 5% de traces est tombé sur un slice difficile), pas d'une régression réelle. Le verrou de trois minutes est le filtre anti-bruit le moins cher qui maintient quand même le temps de réaction total sous une minute et demie. Nous avons réglé dans les deux sens ; trois est le point optimal pour la forme de trafic typique de nos clients. Le palier est configurable par release si la forme de votre trafic est différente.

### L'auto-rollback devrait-il être configurable sur « off » ?

Dans notre pipeline livré, non. Tout l'intérêt d'avoir un mécanisme de sécurité automatisé est qu'il fonctionne à 2h14 du matin quand personne ne regarde. Un auto-rollback configurable sur off est un post-it qui dit « nous avions un filet de sécurité ». L'argument pour le rendre configurable est que certaines charges de travail sont à enjeu trop faible pour justifier le moindre rollback de faux positif. Nous pensons que cet argument mène au mauvais endroit — si votre charge de travail est à enjeu trop faible pour l'auto-rollback, vous n'avez pas non plus besoin d'un pipeline de release.

### Comment gérez-vous le cas où la release précédente était aussi mauvaise ?

La cible de rollback est `previous_release` par défaut, mais la chaîne de manifestes stocke plus d'historique que N-1. Les opérateurs peuvent re-cibler un rollback vers n'importe quel SHA de manifeste historiquement sain — `/api/v1/releases/<historically_good_sha>/activate` — ce qui est la voie d'intervention manuelle quand le rollback automatique N-1 tombe sur une mauvaise release antérieure. La soupape d'échappement est là. C'est rare.

### Quelle est la bonne métrique à optimiser — MTTR ou MTBF ?

MTTR — Mean Time To Recovery — de loin, du moins pour les systèmes LLM. Le MTBF (Mean Time Between Failures) suppose une notion déterministe de « panne » que les charges de travail LLM n'ont pas. La qualité de sortie dérive en continu ; la « panne » est un seuil qu'on choisit. Optimiser pour une récupération rapide est robuste à l'endroit où vous tracez le seuil ; optimiser pour ne jamais échouer est fragile et faux. Le seuil élite de DORA<sup><a href="#ref-5">[5]</a></sup> est lui-même formulé en termes de MTTR, ce qui est le bon cadrage.

### Exécutez-vous réellement des exercices de rollback ?

Oui — trimestriellement, planifiés, avec un drapeau de mode test dans le reçu pour que l'exercice puisse être distingué d'un incident réel dans le journal d'audit. Le premier exercice que nous avons exécuté a exposé un délai de stabilisation de 7 secondes dont nous n'avions pas conscience. L'exercice est le seul moyen de savoir que le chemin fonctionne effectivement ; lire le runbook ne suffit pas. La plupart des équipes n'en ont pas exécuté un, ce qui explique pourquoi les chiffres de MTTR de la plupart des équipes sont aspirationnels plutôt que mesurés.

## Références

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibration LLM-as-judge.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). L'ancrage qui justifie qu'un juge calibré est nécessaire et que l'accord par slice compte plus que l'accord agrégé. La boucle de scoring par minute de l'observer en dépend.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Attestation des poids vindex.</strong> Documenté sur la <a href="/fr/compliance/">page de conformité Divinci</a> et parcouru dans l'<a href="/fr/blog/validating-and-releasing-custom-lms-in-regulated-fields/">article sur les domaines régulés</a>. Les champs `vindex_sha256_before/after` du reçu d'auto-rollback sont l'ancrage cryptographique qu'un auditeur peut vérifier sans faire confiance à nos logs.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Panne Cloudflare de juin 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. « 06:58 : Cause racine trouvée et comprise. Le travail commence pour annuler le changement problématique… 07:42 : La dernière des annulations est terminée. » Quarante-quatre minutes pour annuler au niveau infrastructure, en partie parce que les ingénieurs ont marché sur les annulations les uns des autres. Ancrage pour l'affirmation « un swap piloté par manifeste ne peut pas avoir ce mode d'échec ».
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Panne Atlassian d'avril 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 heures par site pour restaurer, 14 jours au total pour 883 sites, parce que l'état était réparti sur des systèmes versionnés indépendamment. Ancrage pour l'affirmation « le manifeste de release groupé est ce qui rend possible les secondes-pas-les-heures ».
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Seuil DORA de récupération après déploiement échoué.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. Le seuil « failed deployment recovery time » pour les elite performers est documenté à moins d'une heure. Le chiffre du pipeline de 12 secondes est trois ordres de grandeur en dessous du seuil élite, ce qui est la bonne manière de lire la comparaison.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrer le juge IA.</strong> Notre article compagnon <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. La procédure pour maintenir le juge ancré sur l'humain en calibration au fil du temps. L'affirmation opérationnelle de cet article — que l'auto-rollback ne fonctionne aussi bien que le juge qui le pilote — ne tient que si le juge est en fait recalibré périodiquement.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interne — référence pipeline Divinci.</strong> L'architecture sous laquelle se situe cette couche d'automatisation : l'<a href="/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">article sur le pipeline en quatre étapes</a>. L'ensemble de la surface API est documenté à la <a href="/fr/api/">référence API</a> ; la section sur la gestion des releases est celle dont parle cet article.
</li>
</ol>

---

*Prochain dans cette série :* **CI Testing for Custom Language Models in 2026.** Cet article porte sur la couche opérationnelle entre les approbations humaines. Le suivant porte sur la couche *avant* que le pipeline ne démarre — la CI pré-merge : que faut-il évaluer au moment du PR, quelles régressions vous attrapez réellement avant que la porte ne les voie, et lesquelles vous ratez.
