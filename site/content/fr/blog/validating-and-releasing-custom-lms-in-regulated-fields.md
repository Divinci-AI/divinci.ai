+++
title = "Valider et publier des LM personnalisés dans les secteurs réglementés"
description = "EU AI Act, Article 17 du RGPD, HIPAA, NIST AI RMF — mis en correspondance capacité par capacité avec un pipeline de publication LLM personnalisé. La fracture poids ouverts / API fermée est l'endroit où la conformité se sépare réellement."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vindex"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "La conformité dans les secteurs réglementés pour les modèles de langage personnalisés se sépare nettement selon un seul axe : poids ouverts vs API fermée. Pour les bases en poids ouverts, vous pouvez livrer une attestation de poids vindex qui satisfait cryptographiquement l'effacement vérifiable de l'article 17 du RGPD. Pour les bases en API fermée, le même reçu couvre la chaîne de décision mais ne peut pas revendiquer la provenance des poids — et le régulateur reçoit cette distinction dans le reçu lui-même. Ce billet met en correspondance quatre cadres réglementaires (EU AI Act, RGPD, HIPAA, NIST AI RMF) avec les quatre étapes du pipeline que nous livrons, et montre le format réel du reçu."
+++

*Notes du cycle de publication — Partie IV*

---

Une directrice juridique entre dans la revue d'ingénierie. Elle pose une seule question : *« Si la demande de droit à l'effacement de l'article 17 de l'EU AI Act arrive demain pour supprimer chaque fait que notre modèle a appris sur un patient spécifique, pouvons-nous prouver que nous l'avons fait ? »*

La réponse honnête que la plupart des équipes doivent donner est : « Nous pouvons affiner le modèle pour qu'il oublie. Nous pouvons vous montrer la session d'entraînement. Mais nous ne pouvons pas prouver que l'information a structurellement disparu, car elle pourrait refaire surface sous le bon prompt adverse. »

Ce n'est pas une réponse de conformité. C'est une non-réponse avec un haussement d'épaules procédural.

Ce billet traite de ce à quoi ressemble une véritable réponse de conformité pour des LLM personnalisés — à travers quatre cadres réglementaires (**EU AI Act, article 17 du RGPD, HIPAA, NIST AI RMF**), mis en correspondance avec le pipeline en quatre étapes ([Enregistrer → Filtrer → Déployer → Observer](/fr/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)) que nous livrons pour les publications clients. La tension de fond qui traverse chaque demande des régulateurs est **poids ouverts vs API fermée** : les choses que vous pouvez prouver sur un fine-tune Gemma 4 ne sont pas les choses que vous pouvez prouver sur une publication servie derrière une API opaque d'un fournisseur. Le format de reçu que nous utilisons le dit explicitement, ligne par ligne. C'est cette honnêteté qui rend le reçu utile à un auditeur.

## Les quatre régulateurs et ce que chacun veut réellement

Les discussions de conformité ont tendance à se réduire à « nous avons documenté les choses ». Cette formulation échoue face à un auditeur. Ce que les auditeurs veulent, ce sont *des preuves qu'ils peuvent vérifier sans avoir à faire confiance à votre infrastructure*. Les quatre cadres ci-dessous utilisent tous des vocabulaires différents pour la même demande sous-jacente.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Quatre cadres réglementaires et la primitive de vérification que chacun exige. L'EU AI Act exige une logique documentée et une supervision humaine ; la primitive de vérification est une documentation mécanistique exacte au bit près. L'article 17 du RGPD exige un effacement vérifiable des données personnelles ; la primitive de vérification est un patch DELETE au niveau des poids avec un reçu SHA-256. HIPAA exige un audit d'accès et un suivi des divulgations ; la primitive de vérification est un journal de décision signé par requête. NIST AI RMF exige gouvernance, cartographie, mesure et gestion ; la primitive de vérification est des reçus chaînés par hachage pour chaque décision de publication.">
<title>Quatre régulateurs, une seule demande de vérification</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Quatre régulateurs, une demande sous-jacente : vérifier, sans faire confiance</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Chaque cadre nomme différemment la primitive de vérification, mais le fond est identique : une preuve cryptographique qu'un auditeur peut vérifier.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">L'Annexe IV exige :</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• logique documentée</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• synthèse des données d'entraînement</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• mesures de supervision humaine</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• surveillance post-commercialisation</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Primitive de vérification :</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">documentation mécanistique</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">exacte au bit près via vindex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">Sanction en cas de non-conformité :</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">jusqu'à 7 % du</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">chiffre d'affaires mondial</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">RGPD Art. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Le droit à l'effacement exige :</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• suppression vérifiable des données</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• oubli démontrable</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• preuve sous prompt</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  adverse</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Primitive de vérification :</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">patch DELETE au niveau</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">des poids avec reçu SHA-256</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">Sanction en cas de non-conformité :</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">jusqu'à 20 M€ ou</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">4 % du chiffre d'affaires</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Les contrôles d'accès exigent :</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• piste d'audit des accès</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• suivi des divulgations</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• exposition PHI au strict</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  minimum nécessaire</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Primitive de vérification :</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">journal de décision signé</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">par requête</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">Sanction en cas de non-conformité :</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">jusqu'à 1,9 M$ /</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">type de violation / an</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Quatre fonctions centrales :</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• gouverner</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• cartographier</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• mesurer</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• gérer</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Primitive de vérification :</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">reçu chaîné par hachage</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">par décision de publication</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">Sanction en cas de non-conformité :</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">cadre volontaire</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(mais référence de fait</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">en entreprise)</text>
</svg>
</figure>

Les montants des sanctions ne sont pas ce qui rend ces cadres intéressants. Les montants des sanctions sont ce qui les rend structurants. La partie intéressante, c'est la **primitive de vérification** — ce à quoi chaque cadre veut réellement que l'artefact ressemble. Trois des quatre demandent une preuve de niveau cryptographique dans des vocabulaires différents. Le quatrième (NIST AI RMF) est volontaire, mais devenu de facto obligatoire dans les processus d'achat en entreprise. Ils convergent vers la même forme : un artefact qu'un auditeur peut vérifier sans faire confiance à vos journaux.

## La fracture : poids ouverts vs API fermée

Avant la mise en correspondance étape par étape, l'avertissement le plus important de tout ce billet :

**Pour les bases de modèle à poids ouverts** — Gemma, Qwen, Llama, Mistral, GPT-OSS, tout ce dont les poids sont adressables et modifiables — chaque décision de publication Divinci émet un reçu vindex qui inclut une **attestation de poids** : une preuve cryptographique que les poids actifs au moment de la décision sont exactement les poids enregistrés par le manifeste. C'est ce qui rend possible l'effacement vérifiable au titre de l'article 17 du RGPD. Vous appliquez un [patch DELETE](/blog/deleting-paris-from-a-language-model/) qui supprime une relation entité-relation spécifique de l'espace des poids, le reçu intègre le hash avant/après, et un auditeur peut vérifier que la suppression a eu lieu en réexécutant la vérification contre le vindex public.

**Pour les bases de modèle à API fermée** — OpenAI, Anthropic, Google via des API opaques — le même reçu couvre la chaîne de décision (quel manifeste, quel résultat de filtre, quelle lecture du moniteur, quel utilisateur a déclenché quelle action) mais **ne peut pas revendiquer la provenance des poids**, car le fournisseur n'expose pas les poids. Le reçu le note explicitement dans un champ `weight_attestation: null` avec une `note` expliquant pourquoi. Ce n'est pas une posture de conformité dégradée — c'est la limite de ce qui est vérifiable, consignée honnêtement. Un auditeur qui lit le reçu comprend exactement quelle classe de preuve est et n'est pas apportée.

Cette fracture traverse chaque demande des régulateurs ci-dessous. Chaque fois qu'un cadre exige quelque chose au niveau des poids, le chemin poids ouverts peut le satisfaire et le chemin API fermée ne le peut pas. Nous le disons dans le reçu plutôt que de laisser entendre une preuve que nous ne pouvons pas livrer.

## Comment chaque cadre se projette sur les quatre étapes du pipeline

Le pipeline comporte quatre étapes. La demande de chaque régulateur correspond à une ou plusieurs d'entre elles. La matrice ci-dessous est la carte réelle.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Mise en correspondance de quatre cadres réglementaires avec le pipeline de publication Divinci en quatre étapes. La logique documentée de l'Annexe IV de l'EU AI Act et la synthèse de l'entraînement correspondent à l'étape 1 Enregistrer. La supervision humaine et la surveillance post-commercialisation de l'EU AI Act correspondent aux étapes 2 Filtrer et 4 Observer. L'effacement vérifiable de l'article 17 du RGPD correspond à l'étape 1 Enregistrer via le patch DELETE et à l'étape 4 Observer via le reçu. L'audit d'accès et le suivi des divulgations HIPAA correspondent aux étapes 1, 3 et 4. Les fonctions gouverner cartographier mesurer gérer de NIST AI RMF s'étendent sur les quatre étapes. Cinq cellules de la matrice sont surlignées pour indiquer le chemin de vérification disponible uniquement avec des poids ouverts.">
<title>Cadres réglementaires mis en correspondance avec les étapes du pipeline</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Quelle étape du pipeline couvre quelle demande réglementaire</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = couverture complète. ◐ = poids ouverts uniquement (attestation de poids requise). Le chemin API fermée couvre la chaîne de décision mais ne peut pas faire la revendication au niveau des poids.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Cadre / demande</text>
<text x="425" y="98" text-anchor="middle">① Enregistrer</text>
<text x="555" y="98" text-anchor="middle">② Filtrer</text>
<text x="685" y="98" text-anchor="middle">③ Déployer</text>
<text x="815" y="98" text-anchor="middle">④ Observer</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Annexe IV : logique documentée</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Annexe IV : synthèse des données d'entraînement</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Mesures de supervision humaine</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Surveillance post-commercialisation</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">Article 17 du RGPD</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Effacement vérifiable (patch DELETE)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Reçu d'effacement (chaîné par hachage)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Audit d'accès par requête</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Suivi des divulgations + minimum nécessaire</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">Gouverner · Cartographier · Mesurer · Gérer</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

Les deux cellules ◐ sont les entrées « article 17 du RGPD / poids ouverts uniquement » — ce sont les demandes que le chemin API fermée ne peut pas pleinement satisfaire. Tout le reste s'applique aux deux types de base.

La suite du billet parcourt la contribution de chaque étape.

## Étape ① — Enregistrer

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ENREGISTRER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Le manifeste de publication est la documentation technique de l'Annexe IV de l'EU AI Act.</span>
  </div>
</div>

L'étape Enregistrer produit un manifeste JSON immuable, adressé par SHA-256. Pour les publications réglementées, le manifeste porte tout ce que demande l'Annexe IV<sup><a href="#ref-1">[1]</a></sup> en un seul artefact :

- L'artefact du modèle (dépôt HF + SHA du commit, ou référence à un patch vindex)
- Le template de prompt (chaque variable, chaque message système — versionné)
- Les règles de routage (quelle classe de trafic atterrit sur quelle publication)
- La version du jeu de données utilisée pour calculer les seuils du filtre (synthèse des données d'entraînement par hash)
- Le SHA de la publication précédente (pour que la chaîne d'audit soit ininterrompue)
- Le périmètre de divulgation — pour les déploiements HIPAA, quelles catégories de PHI le modèle est autorisé à recevoir

Le manifeste *est* la documentation. Un auditeur ne lit pas un texte ; il lit le hash du manifeste et vérifie le bundle. Aucune synthèse rédigée six mois plus tard n'est nécessaire.

**Bonus poids ouverts.** Lorsque l'artefact du modèle référence un modèle à poids ouverts, le manifeste intègre également le `vindex_sha256` — l'empreinte cryptographique du [vindex](/fr/compliance/) publié du modèle. Cette empreinte est ce qui permet à un tiers de vérifier les poids actifs sans jamais avoir à faire confiance à notre infrastructure de déploiement.

**Réserve API fermée.** Lorsque l'artefact du modèle référence un modèle en API fermée, le champ `vindex_sha256` du manifeste est `null`, et la `weight_attestation_class` du manifeste est `decision_chain_only`. L'auditeur qui le lit sait exactement ce qui est revendiqué et ce qui ne l'est pas.

## Étape ② — Filtrer

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">FILTRER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Les filtres qualité par tranche portent l'exigence de supervision humaine de l'EU AI Act.</span>
  </div>
</div>

L'étape Filtrer est l'endroit où les « mesures de supervision humaine »<sup><a href="#ref-1">[1]</a></sup> de l'EU AI Act sont opérationnalisées. Un régulateur qui lit l'EU AI Act et en conclut « il nous faut un workflow d'approbation humaine » est passé à côté de l'essentiel — la demande la plus difficile est *contre quoi l'humain approuve*. L'étape Filtrer répond à cette question avec un ρ de Spearman par tranche, ancré sur un évaluateur humain<sup><a href="#ref-3">[3]</a></sup>. Chaque tranche qui compte dans votre posture réglementaire (oncologie pédiatrique, licences PI, français de Belgique) a son propre seuil. Le chemin de dérogation exige une justification écrite qui entre dans la piste d'audit.

Pour les déploiements couverts par HIPAA, c'est aussi là que vit la règle de divulgation « minimum nécessaire ». La suite de QA notée du filtre comprend des tests négatifs pour la sur-exposition de PHI — des réponses qui incluent des identifiants personnels alors qu'aucun n'a été demandé. Une publication qui régresse sur la tranche de sur-exposition échoue au filtre, quelles que soient ses performances sur les autres tranches.

Pour NIST AI RMF, l'étape Filtrer couvre la fonction « mesurer » — les preuves numériques par tranche que le système fonctionne dans les tolérances configurées.

## Étape ③ — Déployer

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">DÉPLOYER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Les points de contrôle canary deviennent l'artefact de surveillance post-commercialisation.</span>
  </div>
</div>

La surveillance post-commercialisation de l'EU AI Act<sup><a href="#ref-1">[1]</a></sup> exige de l'opérateur qu'il démontre une observation *continue* — pas seulement avant le lancement — du comportement du système d'IA dans des conditions réelles. Un canary 5 % → 25 % → 100 % avec des points de contrôle de surveillance qualité est la façon la plus naturelle de la satisfaire. Le temps d'attente à chaque point de contrôle, plus les lectures du moniteur pendant cette attente, est ce qu'un auditeur veut voir.

Pour HIPAA, l'étape canary est aussi l'endroit où la journalisation d'audit par requête est exercée de bout en bout. Chaque point de contrôle produit un échantillon de reçus requête-réponse signés ; si certains présentent une gestion mal configurée des PHI, cela apparaît à 5 % du trafic plutôt qu'à 100 %.

## Étape ④ — Observer

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Le moniteur continu + le format de reçu rendent l'article 17 du RGPD vérifiable.</span>
  </div>
</div>

C'est l'étape qui mérite l'histoire de conformité. L'étape Observer exécute en continu la rejouabilité des traces à travers la publication active, notée par le même juge humain-ancré que le filtre, avec un moniteur qualité qui déclenche un rollback automatique en cas de dépassement.

Chaque décision de publication — enregistrement, succès de filtre, échec de filtre, dérogation au filtre, promotion de point de contrôle, mise en attente d'un point de contrôle, rollback automatique, rollback manuel, **et toute application d'un patch DELETE article 17 du RGPD** — émet un reçu vindex. Chaîné par hachage au reçu précédent pour ce client et au reçu précédent pour cette publication.

Voici à quoi ressemble un véritable reçu pour un patch DELETE article 17 du RGPD — adapté directement du format documenté sur la [page de conformité](/fr/compliance/) :

```json
{
  "name": "gdpr-art17-patient-12348-removal",
  "version": 1,
  "base_model": "google/gemma-4-E2B-it",
  "manifest_sha256": "9abaeaf6c91f8b...",
  "previous_manifest_sha256": "8f72b1de4a93c5...",
  "created_at": "2026-05-29T03:17:42Z",
  "user_id": "compliance-officer-7c4e1a",
  "operation": {
    "op": "delete",
    "entity": "patient-record-12348",
    "relation": "diagnosis-association",
    "target": "weight-feature-11179-layer-27",
    "weight": -1.0
  },
  "verification": {
    "before_feature_11179_score": 17.34,
    "before_feature_11179_rank": 1,
    "after_feature_11179_score": null,
    "after_feature_11179_rank": "ABSENT_FROM_TOP_25",
    "perplexity_delta_wikitext103": "+0.02%",
    "vindex_sha256_before": "abc12...",
    "vindex_sha256_after":  "def34..."
  },
  "weight_attestation_class": "full",
  "chain_signature": "sha256(manifest || prev_manifest || user_id || created_at || prev_chain_signature)"
}
```

Cet artefact est vérifiable. Un auditeur n'a pas à faire confiance à nos journaux. Il prend le `vindex_sha256_after`, récupère le vindex publié correspondant depuis `huggingface.co/Divinci-AI`, et vérifie que la feature 11179 de la couche 27 est structurellement absente du top-25. Il prend la `chain_signature` et la vérifie contre le reçu précédent. La chaîne entière est ancrée à l'extérieur selon un calendrier que le client configure.

**Même opération contre un modèle à API fermée.** Les champs du reçu ci-dessus changent de trois façons : `operation.target` devient `provider_api_endpoint`, `verification` devient un schéma différent couvrant uniquement les preuves de chaîne de décision, et `weight_attestation_class` devient `decision_chain_only`. Le fournisseur du modèle à API fermée n'a pas exposé les poids, donc le reçu le dit. Un auditeur qui veut une preuve au niveau des poids sait alors qu'il doit faire remonter le sujet au fournisseur, pas à nous.

C'est la différenciation que personne d'autre ne livre en 2026. Le camp des évaluations en CI (Braintrust, Humanloop, Patronus) ne s'assied pas sur le trafic et n'émet pas de reçus de décision. Le camp du canary de service (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) émet des journaux de métriques d'infrastructure mais pas de reçus de conformité chaînés par hachage. Le camp de l'observabilité (Arize, Phoenix, Confident, Deepchecks) regarde la sortie mais n'applique rien.

## Que vérifie réellement un auditeur ?

Exercice utile : parcourir les questions qu'un véritable auditeur posera, et l'artefact qui répond à chacune.

| Question de l'auditeur | Artefact qui y répond |
|---|---|
| *« Quelle version du modèle tournait le 15 mars à 14:22 UTC ? »* | Le reçu de l'étape Observer pour cet horodatage, signé et chaîné par hachage. |
| *« Quelle évaluation cette publication a-t-elle passée avant promotion ? »* | Le reçu de l'étape Filtrer, avec le tableau des ρ de Spearman par tranche et le SHA du jeu de données contre lequel le filtre s'est exécuté. |
| *« Une demande d'effacement article 17 du RGPD pour le patient X a-t-elle réellement été appliquée ? »* | Le reçu du patch DELETE ci-dessus. L'auditeur vérifie le `vindex_sha256_after` contre le vindex publié. |
| *« Qui a approuvé cette publication ? Quelle était la justification déclarée pour passer outre le filtre de la tranche licences PI ? »* | Le bloc `override` du reçu de l'étape Filtrer, incluant l'ID utilisateur et la justification en texte libre obligatoire. |
| *« À quelle vitesse le rollback s'est-il déclenché, et quelle lecture du moniteur l'a déclenché ? »* | Le reçu de rollback de l'étape Observer, avec les trois lectures qualité sous-seuil consécutives et le temps écoulé du rollback. |
| *« Montrez-moi les preuves de surveillance post-commercialisation des 90 derniers jours. »* | La chaîne de reçus de l'étape Observer. Ancrée à l'extérieur selon le calendrier configuré par le client. |

Ce que l'auditeur *n'a pas* à faire : faire confiance à notre Datadog. Faire confiance à notre CloudWatch. Faire confiance à une capture d'écran. Faire confiance à un export. Tout l'intérêt du format de reçu est que l'auditeur peut le vérifier indépendamment.

## Ce que cela ne résout pas

Trois limites assumées :

**Les régressions en API fermée sur le territoire de l'article 17 du RGPD ne sont pas résolvables au niveau de la plateforme.** Si vous servez un assistant santé derrière un modèle en API fermée et qu'un patient invoque l'article 17, la plateforme peut attester que le dossier du patient a été retiré de votre magasin de récupération, de votre template de prompt et de vos règles de routage — mais elle ne peut pas attester que les poids du modèle sous-jacent ont oublié les données du patient. Vous avez besoin soit d'une base à poids ouverts, soit d'un engagement du fournisseur sur l'effacement au niveau des poids. Nous le disons dans le reçu.

**La documentation est nécessaire mais non suffisante.** Un reçu qui prouve qu'un modèle a atteint un seuil ne prouve pas que ce seuil était le bon seuil. Si votre suite de QA notée ne couvre pas la tranche qui compte réellement pour un patient dans votre service, aucun chaînage de reçus ne résoudra cela. Les régulateurs comprennent de plus en plus ce point ; « nous avons passé notre évaluation » n'est plus une réponse de conformité suffisante si l'évaluation était la mauvaise évaluation.

**Le format vindex est mono-fournisseur.** Nous l'utilisons parce que c'est la primitive cryptographique la plus concrète disponible aujourd'hui pour la preuve au niveau des poids. Si l'industrie se fixe sur un format différent — model cards avec hashs, schémas d'artefacts publiés par le NIST — le format de reçu devrait évoluer vers cela. Le fond (chaîné par hachage, vérifiable à l'extérieur, conscient de l'attestation de poids) est ce qui est structurant, pas le nom de schéma spécifique. Nous nous attendons à ce que cela change à mesure que le paysage réglementaire et normatif mûrit.

## FAQ

### Qu'est-ce que l'effacement vérifiable au titre de l'article 17 du RGPD pour les systèmes d'IA ?

L'effacement vérifiable signifie qu'un tiers peut vérifier que les données ont été supprimées sans avoir à faire confiance à vos journaux. Affiner un modèle pour qu'il « oublie » des informations spécifiques ne satisfait pas ce critère — l'information peut refaire surface sous prompt adverse, et il n'y a pas de primitive cryptographique qu'un auditeur puisse vérifier. Un patch DELETE au niveau des poids avec un hash vindex avant/après publié *satisfait*, lui, ce critère, car l'auditeur peut réexécuter la vérification contre l'artefact public.

### Pourquoi les modèles à API fermée ne peuvent-ils pas satisfaire l'article 17 du RGPD de la même façon ?

Parce que le fournisseur n'expose pas les poids. Sans accès aux poids, aucun tiers — y compris le client utilisant l'API — ne peut émettre ou vérifier un effacement au niveau des poids. La partie chaîne de décision du reçu (quel template de prompt a été utilisé, de quel magasin de récupération les données provenaient, quelles règles de routage étaient actives) reste vérifiable, mais la revendication au niveau des poids ne l'est pas. C'est une limite de ce qui est vérifiable lorsque les poids sont privés, pas une limite du cadre de conformité.

### Qu'exige l'Annexe IV de l'EU AI Act, en termes simples ?

L'Annexe IV demande une documentation technique couvrant la logique du système, la synthèse des données d'entraînement, l'usage prévu, les mesures de supervision humaine et la surveillance post-commercialisation. Le piège dans lequel tombent la plupart des équipes est de les traiter comme cinq documents séparés. Le manifeste de publication à l'étape 1 porte les trois premières demandes comme un seul hash ; l'étape Filtrer couvre la quatrième ; les étapes Déployer + Observer couvrent la cinquième. Un seul pipeline ; quatre demandes satisfaites comme sous-produit des opérations normales.

### Quelle vitesse de rollback pour les déploiements couverts par HIPAA ?

HIPAA ne spécifie pas de délai de rollback, mais les recommandations du HHS sur la réponse aux violations traitent le temps de confinement comme structurant. Un rollback de l'ordre de la seconde (drainage en vol sur un basculement piloté par manifeste — notre chiffre est d'environ 12 secondes) est structurellement plus rapide qu'un blue-green classique basé sur des métriques d'infrastructure qui dépend de la propagation d'alarmes. À comparer aux postmortems publics : l'incident Cloudflare de juin 2022<sup><a href="#ref-4">[4]</a></sup> a pris 44 minutes pour être annulé parce que les ingénieurs se sont marché dessus dans leurs reverts.

### Comment NIST AI RMF se projette-t-il sur un pipeline de publication ?

Les quatre fonctions centrales de NIST AI RMF — Gouverner, Cartographier, Mesurer, Gérer — couvrent l'ensemble du cycle de vie de publication, pas une seule étape. Gouverner, c'est la politique de publication documentée plus le workflow de justification des dérogations au filtre (étapes Enregistrer + Filtrer). Cartographier, c'est la suite de QA notée par tranche (Filtrer). Mesurer, ce sont les seuils de Spearman par tranche et le moniteur qualité continu (Filtrer + Observer). Gérer, c'est le chemin de rollback et la chaîne de reçus (Observer). Les quatre sont couvertes lorsque le pipeline émet son jeu complet de reçus.

## Références

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. L'Annexe IV définit les exigences de documentation technique pour les systèmes d'IA à haut risque : logique du système, synthèse des données d'entraînement, mesures de supervision humaine, surveillance post-commercialisation. Sanctions allant jusqu'à 7 % du chiffre d'affaires mondial en cas de non-conformité.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. <code>TerminationWaitInSeconds</code> par défaut à 600, <code>MaximumExecutionTimeoutInSeconds</code> max à 1800. Cités comme le canary à métriques d'infrastructure standard du secteur auquel le moniteur qualité de l'étape 4 est comparé.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Accord LLM-juge calibré.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). Accord global GPT-4-vs-humain &gt; 80 %, avec une variance par catégorie allant du codage (86 %) à la rédaction (36–44 %). Ancre pour la calibration Spearman par tranche qui pilote l'étape Filtrer.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Panne Cloudflare de juin 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 minutes entre « nous savons ce qu'il faut annuler » et l'annulation terminée parce que les ingénieurs se sont marché dessus dans leurs reverts. Ancre pour l'affirmation « un rollback piloté par manifeste ne peut pas avoir ce mode de défaillance ».
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Cadre volontaire — Gouverner, Cartographier, Mesurer, Gérer — devenu la référence de fait des achats d'entreprise pour la gouvernance de l'IA. Volontaire mais appliqué en pratique via les questionnaires de due diligence client.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Divulgation au strict minimum nécessaire, audit d'accès et exigences de délai de réponse aux violations applicables à tout système d'IA qui touche des PHI. Sanctions civiles pécuniaires jusqu'à 1,9 M$ par type de violation par an selon l'<a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">ajustement d'inflation des CMP, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Article 17 du RGPD (Droit à l'effacement).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. Le droit de la personne concernée à obtenir l'effacement de ses données personnelles, et l'obligation du responsable du traitement de démontrer sa conformité au titre de la responsabilité de l'article 5(2). Sanctions allant jusqu'à 20 M€ ou 4 % du chiffre d'affaires mondial annuel.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interne — format de reçu vindex.</strong> Le JSON de reçu présenté dans ce billet est adapté du format documenté sur la <a href="/fr/compliance/">page de conformité</a> et démontré dans le billet <a href="/blog/deleting-paris-from-a-language-model/">« Deleting Paris from a Language Model »</a>. La chaîne de hash est un SHA-256 sur <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Ancrable à l'extérieur selon un calendrier configuré par le client.
</li>
</ol>

---

*Prochain dans cette série :* **Automated LLM CI/CD Pipelines With Instant Rollback.** Ce billet a montré ce qu'un auditeur veut. Le suivant montre le schéma opérationnel qui fait arriver le reçu sur le bureau de l'auditeur en quelques secondes plutôt qu'en quelques semaines — l'automatisation sous le pipeline en quatre étapes, en se concentrant sur ce qui change lorsque le rollback se déclenche tout seul.
