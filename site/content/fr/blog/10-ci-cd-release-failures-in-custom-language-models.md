+++
title = "10 échecs de release CI/CD dans les modèles de langage personnalisés — et quelle étape du pipeline attrape chacun"
description = "Dix modes d'échec réels de releases LM, chacun mappé sur l'étape Divinci — Register, Gate, Roll, Observe — qui l'attrape avant les utilisateurs."
date = 2026-05-27T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Postmortems", "Evaluation Gates", "Rollback"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/10-ci-cd-release-failures-in-custom-language-models-veo31.webm"
hero_video_poster = "/images/10-ci-cd-release-failures-in-custom-language-models-hero-poster.webp"
reading_time = 11
summary = "Nous avons livré assez de releases de LMs personnalisés à travers le pipeline en quatre étapes de Divinci pour avoir une liste des dix modes d'échec les plus dommageables que nous frappions régulièrement. Trois d'entre eux sont des régressions conscientes des tranches qu'une porte agrégée aurait livrées. Deux autres sont des chutes silencieuses de qualité qu'un canary basé sur des métriques d'infrastructure aurait promues. Le reste, ce sont les erreurs que tout pipeline de release devrait attraper — nous les listons parce qu'il vaut la peine de dire à voix haute lesquelles un pipeline à porte agrégée attrape effectivement de lui-même."
+++

*Notes from the Release Cycle — Part II*

---

Le [premier article de cette série](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) a parcouru le pipeline de release en quatre étapes que nous livrons — **Enregistrer → Gater → Dérouler → Observer**. Ce billet, ce sont les reçus : dix modes d'échec spécifiques que nous avons désormais attrapés grâce à lui, à quoi chacun ressemblait en pratique, et quelle étape du pipeline l'a empêché d'atteindre la production.

La liste est organisée par étape, pas par gravité, parce que l'étape vous indique *où investir* si vous construisez quelque chose comme cela vous-même. Si votre porte est le maillon faible, six des dix échecs ci-dessous continueront à vous frapper. Si votre observateur est le maillon faible, deux d'entre eux vous frapperont en silence — autrement dit, le seul signal que vous obtiendrez jamais sera une plainte client, ce qui est le pire signal possible.

Un pipeline qui attrape les dix n'est pas une liste de fonctionnalités. C'est un petit nombre de décisions architecturales prises avec cohérence. Chaque échec ci-dessous nomme la décision qui s'applique.

## Comment lire cette liste

Chaque échec est étiqueté avec l'étape qui l'attrape :

- **① ENREGISTRER** — la couche manifeste. Stoppe les échecs où on ne pouvait pas dire quel changement avait cassé la production parce que l'état était réparti sur plusieurs systèmes.
- **② GATER** — Spearman par domaine face à un juge calibré et ancré sur l'humain. Stoppe les échecs qui se cachent à l'intérieur des scores agrégés.
- **③ DÉROULER** — canary à 5 % → 25 % → 100 % avec un moniteur de qualité à chaque point de contrôle. Stoppe les échecs qui n'apparaissent qu'à l'échelle.
- **④ OBSERVER** — replay continu des traces à travers le candidat, scoré par le juge de la porte. Stoppe les chutes silencieuses de qualité que la latence et les 5xx ne remarquent jamais.

Chaque section se termine par le **fix** — la configuration exacte que nous livrons chez Divinci, plus ce qu'il faut construire soi-même si vous ne nous utilisez pas.

---

## Étape ① — Enregistrer

### 1. Co-déployer modèle + prompt + routage dans un seul bundle et ne pas savoir lequel l'a cassé

**Ce qui s'est passé.** Nous avons changé trois choses dans la même release : passage du modèle de base de Gemma 4 E2B à Gemma 4 26B-A4B, édition du prompt système du domaine juridique pour ajouter une instruction « cite le texte de loi », et ajustement de la règle de routage qui décide quelle classe de trafic atterrit sur quel modèle. La précision sur la rédaction de contrats a chuté de 7 points. Aucun des trois changements n'avait été testé indépendamment. Le déboguer a exigé d'annuler une variable à la fois sur deux jours.

**Pourquoi le pipeline l'attrape désormais.** Une release Divinci est un manifeste immuable regroupant model_ref, prompt_template_ref, routing et dataset_version en un seul artefact adressé par SHA-256. Le pipeline refuse de déployer un manifeste qui regroupe plus d'un changement *sauf si* le SHA de la release précédente est référencé comme baseline de comparaison. Si vous voulez livrer trois changements d'un coup, vous devez le reconnaître dans le manifeste, et le chemin d'attribution de l'échec reste propre parce que la prochaine release est forcée de revenir à une variable à la fois.

**Fix.** Ne laissez pas des humains assembler des releases à la main. Le manifeste de release doit être généré par un pipeline qui *ne peut pas* regrouper en silence. Voir [Étape 1 — Enregistrer](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) pour l'API.

### 2. Éditer un prompt système dans un tableau de bord et le livrer sans revue de code

**Ce qui s'est passé.** Quelqu'un a ajusté le prompt système dans une UI d'administration pour « rendre le modèle moins verbeux ». Cela ressemblait à une édition d'un seul mot. Le prompt résultant était plus court de 38 caractères, ce qui le faisait passer sous un seuil de longueur que le réécrivain de prompts en aval utilisait pour décider d'ajouter ou non du boilerplate de sécurité. Deux heures plus tard, le modèle répondait à des questions qu'il aurait dû refuser.

**Pourquoi le pipeline l'attrape désormais.** Les prompts font partie du manifeste enregistré. Éditer un prompt dans un tableau de bord signifie découper un nouveau manifeste, ce qui signifie générer un nouveau SHA, ce qui signifie que la porte tourne face au changement. Vous pouvez toujours éditer des prompts dans un tableau de bord. Vous ne pouvez juste pas les livrer sans que la porte les voie.

**Fix.** Traitez les prompts comme du code : versionnez-les avec un hash de contenu, enregistrez-les comme partie de la release, gatez-les sur la suite de QA scorée. Le compte rendu *Semver Lie* de Tianpan<sup><a href="#ref-1">[1]</a></sup> décrit exactement ce mode d'échec se produisant dans la nature — un changement de prompt qui « est passé la revue de code, a été déployé sans portes d'évaluation, a atteint la production sans A/B par utilisateur, et n'a déclenché aucun rollback automatique ».

### 3. Décalage de préprocessing entre entraînement et service

**Ce qui s'est passé.** Le pipeline d'entraînement normalisait les espaces et mettait en minuscules un champ particulier. Le pipeline de service ne le faisait pas. Même modèle, même prompt, même routage — entrées différentes au niveau octet. Sur les fixtures de dev tout passait. Sur le vrai trafic, le modèle se comportait comme s'il avait été ré-entraîné sur des données plus bruitées, parce que de son point de vue c'était le cas.

**Pourquoi le pipeline l'attrape désormais.** Le manifeste enregistre un `preprocessing_ref` aux côtés de model_ref. L'évaluation de porte tourne à travers le même préprocessing que la pile de service de production utilise. Si les deux divergent, les chiffres hors-ligne de la porte ne correspondent plus à la production, et le Spearman par tranche chute d'une manière mesurable avant la promotion.

**Fix.** Conteneurisez le préprocessing comme un artefact versionné. Référencez-le depuis le manifeste. Refusez de déployer si la porte a été calculée face à une version de préprocessing différente de celle que la production utilisera.

---

## Étape ② — Gater

Les quatre échecs ci-dessous sont ceux qu'une porte à score agrégé aurait livrés. **La raison pour laquelle une porte agrégée les rate est structurelle, pas un réglage de paramètres** — moyenner sur les tranches détruit exactement le signal que vous utiliseriez pour attraper une régression localisée sur une seule tranche.

### 4. L'effondrement des licences PI (régression consciente des tranches n°1)

**Ce qui s'est passé.** Un fine-tune QLoRA a amélioré la précision en Q&A juridique sur cinq sous-domaines et fait s'effondrer les licences PI — rédaction de contrats 0,71, interprétation statutaire 0,74, résumé de jurisprudence 0,69, conformité réglementaire 0,66, analyse de juridiction 0,62, **licences PI 0,41**. Le Spearman ρ agrégé sur les six était 0,64. Le seuil de porte était 0,65. À un seul score agrégé près, la release était d'un cheveu sous la ligne. À la vue par tranche, un sous-domaine s'était effondré de 27 points.

**Pourquoi le pipeline l'attrape désormais.** Le seuil de la porte est par tranche, pas agrégé. Toute tranche unique tombant sous son seuil marque la release `gate_fail`, peu importe à quoi ressemble la moyenne. Le [graphique des seuils de porte dans le billet n°1](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) est la visualisation réelle que le pipeline produit pour des releases comme celle-ci.

**Fix.** Tranchez la porte. Les tranches qui comptent sont les sous-domaines de vos segments clients, pas la taxonomie qui se trouve dans le framework d'éval que vous avez importé.

### 5. Régression de la tranche oncologie pédiatrique (régression consciente des tranches n°2)

**Ce qui s'est passé.** Un modèle de Q&A médical a été fine-tuné sur des données supplémentaires de cardiologie adulte. La précision médicale agrégée s'est améliorée de 4 points. La précision en oncologie pédiatrique a chuté de 11 points — apparemment, les nouvelles données d'entraînement déséquilibraient subtilement les ajustements posologiques pédiatriques. La porte agrégée l'aurait promu.

**Pourquoi le pipeline l'attrape désormais.** L'oncologie pédiatrique était l'une des tranches configurées par le client lorsqu'il a enregistré la suite de QA scorée. L'évaluation de Gate-2 a produit un Spearman ρ par tranche qui chutait de 0,72 à 0,61, sous le seuil oncologie-pédiatrique de 0,68. Marquée `gate_fail`. Pas de déploiement.

**Fix.** Tranches définies par le client, pas par la plateforme. La plateforme doit permettre au client d'ajouter une tranche et un seuil par tranche sans écrire de code — parce que personne chez Divinci ne connaît les arêtes du domaine de votre client aussi bien que votre client lui-même.

### 6. Dérive multilingue sous-tranche (régression consciente des tranches n°3)

**Ce qui s'est passé.** Un modèle multilingue fine-tuné pour améliorer les réponses en français. La précision agrégée en français s'est améliorée de 3 points. À l'intérieur du « français », cependant, le modèle se comportait désormais moins bien sur les variantes régionales français de Belgique et français de Suisse — le corpus d'entraînement avait été dominé par le français de Paris. Une porte agrégée sur le français l'aurait livré.

**Pourquoi le pipeline l'attrape désormais.** Les variantes locales sont des sous-tranches de la tranche langue. Le Spearman par sous-tranche a attrapé la régression sur la variante belge avant la promotion. La release a été renvoyée pour soit (a) des données d'entraînement plus diverses soit (b) un force-override avec une justification écrite (« nous acceptons la régression régionale parce que l'amélioration agrégée en français compte plus dans ce déploiement ») — et l'override va dans la piste d'audit.

**Fix.** La profondeur des tranches compte. « Français » est trop grossier. « Français de Belgique » est le niveau où les régressions se cachent réellement.

### 7. Contournement de la porte sans justification écrite d'override

**Ce qui s'est passé.** Une fenêtre de release sous pression. La porte a échoué sur une tranche — non critique, selon le jugement de l'équipe. Quelqu'un a tendu la main vers le drapeau force-override. Dans une version antérieure du pipeline, force-override était un simple booléen. Le drapeau a basculé, la release est partie, et trois semaines plus tard personne ne pouvait reconstruire qui avait décidé quoi à propos de quelle tranche.

**Pourquoi le pipeline l'attrape désormais.** Force-override est une porte à deux champs : `forceGateOverride: true` ET `overrideReason: "..."`. La raison est une chaîne de texte libre obligatoire écrite dans le journal d'audit aux côtés de l'ID utilisateur et du résultat de porte par tranche qui a été overridé. Le pipeline refuse l'override sans la raison. Vous pouvez toujours overrider — vous ne pouvez juste pas overrider anonymement.

**Fix.** Les portes de gouvernance ne sont pas une étape séparée. Elles sont une propriété de l'étape de gate : chaque override est un reçu signé avec un texte de justification.

---

## Étape ③ — Dérouler

### 8. Passer de 0 % à 100 % du trafic en une seule étape

**Ce qui s'est passé.** Un modèle a passé la porte proprement. Il a été poussé à 100 % du trafic immédiatement. Sur une particularité de longueur de conversation, le nouveau modèle dépassait son délai sur les réponses de plus de ~2 400 tokens — un comportement qui ne surgissait pas sur l'ensemble d'évaluation de 100 questions de la porte parce que chaque prompt de test était court. 15 % des utilisateurs ont eu un timeout pendant 18 minutes avant que quelqu'un ne fasse un rollback manuel.

**Pourquoi le pipeline l'attrape désormais.** L'étape Dérouler tient à 5 % pendant `dwell_5pct_seconds` (par défaut 240) OU `requests_5pct` (par défaut 1 000), selon le plus *tardif*. À 5 % de trafic, les timeouts de longue conversation surgissent dans le moniteur de taux 5xx en ~3 minutes. Le pipeline refuse d'avancer au-delà de 5 % si un moniteur de point de contrôle dépasse sa plage. Le temps moyen d'arrêt était de 4 minutes ; le temps moyen jusqu'au rollback complet était d'environ 12 secondes après l'arrêt.

**Fix.** Canary en trois étapes avec un moniteur de *qualité*, pas seulement la latence et les 5xx. Le pattern « cinq pour cent en vingt secondes et c'est fini » est le dangereux. Le pattern « cinq pour cent pendant quatre minutes » est le sûr.

---

## Étape ④ — Observer

Les deux échecs ci-dessous sont ceux qu'un canary basé sur des métriques d'infrastructure aurait promus. **La raison pour laquelle les métriques d'infrastructure les ratent est aussi structurelle** — la latence et les 5xx peuvent rester parfaitement propres pendant que le modèle esquive, refuse, ou hallucine en silence.

### 9. Esquive silencieuse sur les requêtes juridiques (chute silencieuse de qualité n°1)

**Ce qui s'est passé.** Une mise à jour de modèle sensible à la sécurité a rendu l'assistant juridique nettement plus conservateur. Même latence, même taux 5xx, même usage de tokens. Mais là où la version précédente avait répondu « le délai de prescription est de X années », la nouvelle version disait « vous devriez consulter un avocat ». Les clients l'ont remarqué en quelques heures. Les tableaux de bord n'ont jamais bougé.

**Pourquoi le pipeline l'attrape désormais.** L'observateur de l'Étape 4 tourne un replay continu des traces de production à travers le modèle actif et les score avec le même juge calibré qui a alimenté Gate-2. L'esquive surgit immédiatement parce que le juge calibré — ancré sur des évaluations humaines de ce à quoi ressemble une « bonne » réponse juridique — pénalise le refus-quand-une-réponse-était-attendue. Le moniteur de qualité des sorties est descendu sous sa plage pendant trois minutes consécutives et le pipeline a fait un rollback automatique. Temps total écoulé : moins de cinq minutes.

**Fix.** Ne surveillez pas seulement la latence et les 5xx. Surveillez un score *de qualité* dérivé d'un juge calibré face à de vraies traces de production. Les garde-fous de déploiement de SageMaker<sup><a href="#ref-2">[2]</a></sup> font du rollback automatique sur des alarmes CloudWatch — utile pour l'infrastructure, mais l'alarme doit se déclencher sur une métrique, et « le modèle esquive » n'est pas une métrique que CloudWatch voit.

### 10. Dates hallucinées après un fine-tune (chute silencieuse de qualité n°2)

**Ce qui s'est passé.** Un fine-tune d'assistant de planification s'est mis à insérer avec assurance des dates qui n'existaient pas dans l'entrée. « Votre réunion est le jeudi 32 mars. » Latence inchangée. Taux 5xx inchangé. Les hallucinations passaient le filtre de sécurité parce que rien ne marquait « 32 mars » comme nuisible — juste impossible.

**Pourquoi le pipeline l'attrape désormais.** Le juge calibré de l'observateur — tournant sur de vraies traces de planification de production, pas synthétiques — donne aux réponses confiantes-mais-fausses un score pire que les refus appropriés « je ne sais pas ». La chute de la classe hallucination a déclenché le seuil par minute de l'observateur en deux minutes. Le rollback automatique s'est déclenché.

**Fix.** Un juge calibré face à l'expertise du domaine. Le LLM-as-judge générique ratera « jeudi 32 mars » de la même manière que les humains qui parcourent en diagonale le rateront. Les juges calibrés sur le domaine — ancrés face à des évaluations d'experts du domaine — ne le rateront pas.

---

## Les 10 échecs mappés sur le pipeline

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrice mappant les dix modes d'échec sur les quatre étapes du pipeline. L'étape 1 Enregistrer attrape les échecs 1 (changements co-déployés), 2 (prompts non versionnés) et 3 (décalage entraînement-service). L'étape 2 Gater attrape les échecs 4 (régression de tranche licences PI), 5 (régression de tranche oncologie pédiatrique), 6 (dérive multilingue sous-tranche) et 7 (contournement de la porte sans justification d'override). L'étape 3 Dérouler attrape l'échec 8 (déroulement en une étape). L'étape 4 Observer attrape les échecs 9 (esquive silencieuse) et 10 (dates hallucinées).">
<title>Modes d'échec par étape du pipeline</title>
<rect width="900" height="420" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Où chaque échec est attrapé</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Trois régressions conscientes des tranches atterrissent à Gater. Deux chutes silencieuses de qualité atterrissent à Observer. Le reste se répartit entre Enregistrer et Dérouler.</text>
<g>
<rect x="40" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="140" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">① ENREGISTRER</text>
<rect x="250" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="350" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">② GATER</text>
<rect x="460" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="560" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">③ DÉROULER</text>
<rect x="670" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="770" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">④ OBSERVER</text>
</g>
<g>
<rect x="40" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="163" font-size="11" font-weight="700" fill="#1e3a2b">1. Changements co-déployés</text>
<text x="50" y="178" font-size="10" fill="#6b5d4f">modèle + prompt + routage</text>
<text x="50" y="191" font-size="10" fill="#6b5d4f">regroupés en silence</text>
<rect x="40" y="210" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="228" font-size="11" font-weight="700" fill="#1e3a2b">2. Prompts non versionnés</text>
<text x="50" y="243" font-size="10" fill="#6b5d4f">édition dans tableau de bord</text>
<text x="50" y="256" font-size="10" fill="#6b5d4f">contourne la porte</text>
<rect x="40" y="275" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="293" font-size="11" font-weight="700" fill="#1e3a2b">3. Décalage entraîn.-service</text>
<text x="50" y="308" font-size="10" fill="#6b5d4f">le préprocessing diverge</text>
<text x="50" y="321" font-size="10" fill="#6b5d4f">entre hors-ligne et en ligne</text>
</g>
<g>
<rect x="250" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="163" font-size="11" font-weight="700" fill="#a04848">4. Tranche licences PI</text>
<text x="260" y="178" font-size="10" fill="#6b5d4f">tranche 0,41, agrégat 0,64</text>
<text x="260" y="191" font-size="10" fill="#6b5d4f">l'agrégat livrerait</text>
<rect x="250" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="228" font-size="11" font-weight="700" fill="#a04848">5. Oncologie pédiatrique</text>
<text x="260" y="243" font-size="10" fill="#6b5d4f">la tranche chute de 11 points</text>
<text x="260" y="256" font-size="10" fill="#6b5d4f">l'agrégat livrerait</text>
<rect x="250" y="275" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="293" font-size="11" font-weight="700" fill="#a04848">6. Sous-dérive multilingue</text>
<text x="260" y="308" font-size="10" fill="#6b5d4f">le français de Belgique régresse</text>
<text x="260" y="321" font-size="10" fill="#6b5d4f">l'agrégat livrerait</text>
<rect x="250" y="340" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="260" y="358" font-size="11" font-weight="700" fill="#1e3a2b">7. Contournement override</text>
<text x="260" y="373" font-size="10" fill="#6b5d4f">exige justification écrite</text>
<text x="260" y="386" font-size="10" fill="#6b5d4f">+ entrée d'audit</text>
</g>
<g>
<rect x="460" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="470" y="163" font-size="11" font-weight="700" fill="#1e3a2b">8. Déroulement 0 % → 100 %</text>
<text x="470" y="178" font-size="10" fill="#6b5d4f">pas de séjour aux checkpoints</text>
<text x="470" y="191" font-size="10" fill="#6b5d4f">les bugs en queue frappent à l'échelle</text>
</g>
<g>
<rect x="670" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="163" font-size="11" font-weight="700" fill="#a04848">9. Esquive silencieuse</text>
<text x="680" y="178" font-size="10" fill="#6b5d4f">latence + 5xx inchangés</text>
<text x="680" y="191" font-size="10" fill="#6b5d4f">le juge l'attrape</text>
<rect x="670" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="228" font-size="11" font-weight="700" fill="#a04848">10. Dates hallucinées</text>
<text x="680" y="243" font-size="10" fill="#6b5d4f">« 32 mars »</text>
<text x="680" y="256" font-size="10" fill="#6b5d4f">le juge de domaine l'attrape</text>
</g>
</svg>
</figure>

Les barres colorées en rouge sont les échecs que nous avons trouvés *pendant* que nous livrions ce pipeline — ce sont la raison pour laquelle nous avons fini par construire spécifiquement la porte consciente des tranches et l'observateur à replay de traces, au lieu de livrer un canary générique avec des métriques d'infrastructure comme tout le monde le fait.

## En quoi le CI/CD pour LLM diffère-t-il du CI/CD logiciel ?

La version courte : une release LLM n'est pas un artefact déterministe. Le même prompt produit des sorties différentes d'une exécution à l'autre. Le même ensemble d'évaluation produit des scores différents selon le matériel. Le même modèle peut passer un contrôle de qualité agrégé tout en échouant silencieusement sur une tranche que vous n'aviez pas incluse dans l'éval. La plupart des hypothèses sur lesquelles le CI/CD traditionnel a été bâti ne survivent pas au contact avec un système probabiliste.

Trois conséquences concrètes :

1. **Vous ne pouvez pas écrire d'assertions `expect(output).toEqual(X)`.** Il vous faut une évaluation consciente de la distribution qui consomme la corrélation de rang face à un correcteur ancré sur l'humain, pas l'égalité face à une fixture.
2. **Un modèle « ayant passé le CI » peut livrer un comportement cassé.** Le CI qui passe signifie que le code tourne. Cela ne signifie pas que le modèle a raison. Le pipeline de release doit imposer une porte de *qualité* par-dessus la porte de *correction* que le CI fournit.
3. **Le rollback n'est pas optionnel et n'est pas lent.** Parce que les modes d'échec sont probabilistes — et parce que certains d'entre eux sont silencieux au niveau de l'infrastructure — le chemin de rollback doit être une infrastructure de premier ordre, pas un plan de secours. Le manifeste de release existe spécifiquement pour rendre le rollback atomique.

Le premier billet de cette série décrit l'architecture en quatre étapes qui répond à ces conséquences. Ce billet décrit les échecs qu'elle attrape.

## Comment construit-on un pipeline CI/CD résistant aux échecs pour des LMs personnalisés ?

La réponse honnête : vous acceptez que les échecs arriveront et vous minimisez le temps entre *l'occurrence de l'échec* et *le retour du trafic de production à une version connue comme bonne*. Le pipeline en quatre étapes ci-dessus est une implémentation spécifique de ce principe, mais c'est le principe lui-même qui compte.

Si vous n'utilisez pas Divinci et que vous voulez construire quelque chose d'équivalent, les pièces porteuses sont :

- **Un manifeste de release immuable** qui regroupe modèle + prompt + routage + dataset + préprocessing en un seul SHA. C'est ce qui rend 1, 2 et 3 attrapables. ([Étape 1](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register))
- **Une porte par tranche** avec des seuils définis par les propriétaires de domaine, pas les propriétaires de plateforme. C'est ce qui rend 4, 5 et 6 attrapables. ([Étape 2](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate))
- **Un canary avec surveillance de la qualité à chaque point de contrôle**, pas seulement la latence et les 5xx. C'est ce qui rend 8 attrapable et ce qui rend 9 et 10 *survivables* une fois qu'ils atteignent la production. ([Étape 3](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-3-roll))
- **Un observateur continu** qui score les vraies traces de production à travers le modèle actif avec le même juge calibré qui a alimenté la porte. C'est ce qui rend 9 et 10 attrapables. ([Étape 4](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-4-observe-rollback-and-the-receipt))
- **Un reçu d'audit signé pour chaque décision.** Chaîné par hash, ancrable en externe. Pour les modèles à poids ouverts, le reçu intègre une [attestation de poids vIndex](/fr/compliance/) prouvant que les poids actifs sont ceux que le manifeste a enregistrés. Pour les modèles à API fermée, le reçu couvre la chaîne de décision mais ne peut pas revendiquer la traçabilité des poids — et la piste d'audit le dit explicitement.

Les pièces ne sont pas nouvelles individuellement. Toute plateforme MLOps en a une ou deux. La combinaison — porte consciente des tranches + observateur sur traces de production + rollback atomique + reçu prouvable — est la partie que personne d'autre ne livre en 2026.

## Où aller ensuite

- Le billet compagnon — **[Comment construire un pipeline CI/CD pour LLM avec Divinci AI](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)** — couvre l'architecture et l'API.
- La **[page de conformité](/fr/compliance/)** documente le format des reçus vIndex qui sous-tend chaque décision de release et comment il s'aligne sur l'EU AI Act, l'article 17 du RGPD, HIPAA et NIST AI RMF.
- La **[page produit AutoRAG](/fr/autorag/)** couvre la réduction d'hallucinations côté RAG qui se marie naturellement avec le juge calibré qui pilote Gate-2 et l'observateur de l'Étape 4.
- La **[référence de l'API](/fr/api/)** — chaque commande référencée dans cette série est un vrai endpoint.

## FAQ

### Quel est l'échec CI/CD le plus courant pour les modèles de langage personnalisés ?

À travers les releases que nous avons livrées, l'échec le plus dommageable est **une régression consciente des tranches qui passe une porte agrégée** — un modèle qui s'améliore en moyenne tout en s'effondrant silencieusement sur un sous-domaine spécifique (échecs 4, 5 et 6 ci-dessus). Il est plus courant qu'un rollback manquant, plus courant qu'une dérive de prompt, et plus difficile à détecter que l'un ou l'autre. Le fix est structurel, pas un réglage de paramètres : gater par tranche, pas sur la moyenne.

### À quelle vitesse devriez-vous pouvoir faire un rollback d'une mauvaise release LLM ?

À l'ordre de grandeur des secondes, pas des minutes. Le temps moyen de rollback sur le pipeline Divinci est d'environ 12 secondes — c'est le drain des requêtes en cours sur un service à ~100 répliques, pas la bascule du manifeste elle-même, qui est sub-seconde. La décision architecturale qui rend cela possible est le manifeste de release groupé : parce que chaque composant (poids, prompt, routage, dataset) est référencé depuis un seul SHA, le rollback est un seul re-pointage atomique. Comparez cela aux postmortems publics : l'incident Cloudflare de juin 2022<sup><a href="#ref-3">[3]</a></sup> a pris 44 minutes pour être annulé parce que les ingénieurs se marchaient sur les reverts ; la panne Atlassian d'avril 2022<sup><a href="#ref-4">[4]</a></sup> a pris 12 heures par site affecté pour être restaurée parce que l'état était réparti sur plusieurs systèmes.

### Pourquoi les changements de prompt causent-ils tant de pannes de production ?

Parce que les prompts sont régulièrement édités hors du pipeline CI/CD — dans des tableaux de bord, dans des UIs d'administration, parfois par des personnes sans revue d'ingénierie. Ils sont traités comme de la configuration, mais ils se comportent comme du code. Une édition de 38 caractères sur un prompt système peut changer le comportement du modèle en aval plus qu'un ré-entraînement du modèle. Le fix est d'enregistrer les prompts comme partie du manifeste de release et d'exiger qu'ils passent la même porte que le modèle passe.

### Comment détecte-t-on une dégradation silencieuse de qualité dans les sorties LLM ?

Pas avec des métriques d'infrastructure. La latence, le taux 5xx et l'usage de tokens n'attraperont pas l'esquive, le refus-quand-une-réponse-était-attendue, ou les dates hallucinées. Le signal de détection doit venir d'un score de *qualité* calculé par un juge calibré face à de vraies traces de production. L'observateur de l'Étape 4 dans le pipeline Divinci rejoue un échantillon glissant de traces de production à travers le modèle actif, les score avec le même juge Spearman ancré sur l'humain qui a alimenté Gate-2, et déclenche un rollback automatique quand le score de qualité descend sous le seuil pendant trois minutes consécutives.

### Quelles exigences de piste d'audit s'appliquent aux déploiements de modèles d'IA ?

L'EU AI Act, l'article 17 du RGPD (droit à l'effacement), HIPAA et le NIST AI Risk Management Framework exigent tous que les organisations conservent des enregistrements des versions de modèles, des résultats d'évaluation, des décisions d'approbation et des déploiements. L'exigence implicite sous-jacente aux quatre est que les enregistrements doivent être *vérifiables* — auditable signifie plus que « nous avons un log ». Les reçus vIndex de Divinci sont chaînés par hash et ancrables en externe, ce qui signifie qu'un auditeur peut vérifier la chaîne sans faire confiance à nos logs. Pour les modèles à poids ouverts, le reçu intègre aussi une attestation de poids ; pour les modèles à API fermée, le reçu note explicitement que la traçabilité des poids n'est pas revendiquée.

## Références

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (avril 2026). Nomme directement le mode d'échec d'édition de prompt dans un tableau de bord. Compagnon : <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a>. Le rollback automatique standard piloté par métriques d'infrastructure. Comparaison utile pour ce que l'Étape 4 Observer fait différemment (score de qualité, pas alarmes CloudWatch).
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Revert de 44 minutes parce que les ingénieurs se marchaient sur les reverts. Cité comme l'ancrage « le rollback est son propre type d'incident ».
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. 12 heures par site pour restaurer. Le mode d'échec « état réparti sur plusieurs systèmes » dans sa pire forme.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. Le seuil elite-performer du « failed deployment recovery time » est documenté à moins d'une heure. Cadrage utile pour « à quelle vitesse est assez vite » sur le rollback.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">Zheng et al., <em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (arXiv:2306.05685, 2023). La référence pour expliquer pourquoi le LLM-as-judge peut égaler les évaluations humaines globalement mais varier largement par catégorie — c'est exactement le pattern qui rend le gating par tranche nécessaire.
  </li>
</ol>

---

*Suite de cette série :* **Validation et release de LMs personnalisés dans des domaines réglementés.** Le pipeline ci-dessus est l'architecture. Le parcours de conformité est la pratique de son utilisation. EU AI Act, article 17 du RGPD, HIPAA et NIST AI RMF — ce que chacun demande à un processus de release, et quels champs de reçu vIndex couvrent quelle exigence.
