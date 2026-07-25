+++
title = "Sécurité"
description = "Comment Divinci AI protège vos données — dés-identification, contrôle d'accès, journalisation d'audit, et des réponses honnêtes sur où nous en sommes concernant les certifications formelles."
template = "page.html"
+++

# Sécurité

La sécurité est au cœur de notre façon de construire. Cette page décrit ce qui
est réellement vrai aujourd'hui de notre architecture et de nos pratiques — et
non une liste de cases à cocher marketing. Lorsque nous n'avons pas terminé
quelque chose (un audit formel, une certification), nous le disons clairement
plutôt que de laisser entendre le contraire.

## Architecture préparée pour HIPAA

![Architecture préparée pour HIPAA](/brand/badges/hipaa-ready.svg)

Nous avons intégré par défaut dans la plateforme les garanties techniques
qu'exige un flux de travail couvert par HIPAA :

- **Dés-identification avant tout stockage ou traitement par l'IA.** Le
  contenu des conversations peut être acheminé vers une étape automatique de
  caviardage des données personnelles et de santé (Microsoft Presidio, avec
  un modèle ajusté aux textes cliniques disponible pour les contextes
  médicaux) avant qu'il n'atteigne notre base de données, nos fournisseurs
  d'IA ou la recherche/récupération — détectant les 18 catégories
  d'identifiants de la méthode Safe Harbor (« sphère de sécurité ») de HIPAA.
  Cette étape échoue en mode fermé : si le caviardage ne peut pas s'exécuter,
  le message est rejeté plutôt que stocké silencieusement sans caviardage.
- **Journalisation d'audit inviolable (tamper-evident).** Les accès aux
  enregistrements sensibles sont consignés dans un journal chaîné par
  empreintes cryptographiques, conçu pour que les entrées ne puissent pas
  être modifiées silencieusement après coup.
- **Contrôle d'accès basé sur les rôles et au niveau des ressources.** À la
  fois des rôles applicables à toute la plateforme et des permissions par
  ressource déterminent qui peut voir quoi.
- **Chiffrement en transit et au repos**, avec un chiffrement au niveau des
  champs disponible pour les données sensibles désignées.

**Ce que ceci n'est pas :** une certification de conformité HIPAA. Il n'existe
aucun certificat HIPAA délivré par une autorité gouvernementale — la
conformité est une combinaison de garanties techniques (ci-dessus), de
politiques administratives écrites et d'accords de sous-traitance signés
(Business Associate Agreement, BAA) avec chaque fournisseur présent sur le
chemin des données, évaluée au cas par cas pour une relation client donnée. Si
vous avez besoin de traiter des informations de santé protégées avec nous dans
le cadre d'un Business Associate Agreement,
[parlons-en](https://meetings.hubspot.com/michael-mooring/divinci-ai) — nous
examinerons avec vous ce qui est nécessaire pour votre cas d'usage précis.

## Protection des données

### Chiffrement

- **En transit** : TLS partout entre les clients, notre périphérie (edge) et
  notre infrastructure d'origine.
- **Au repos** : chiffrement au niveau du fournisseur sur notre base de
  données principale et notre stockage d'objets, plus une couche dédiée de
  chiffrement au niveau des champs pour les champs sensibles désignés.
- **Gestion des secrets** : les identifiants et clés d'API sont gérés via un
  gestionnaire de secrets centralisé, et non codés en dur ou stockés en clair
  dans la configuration. La production est configurée pour échouer en mode
  fermé plutôt que de basculer silencieusement sur des identifiants périmés
  si le service de secrets est injoignable.

### Minimisation des données

- La dés-identification (ci-dessus) signifie que les données personnelles et
  de santé d'origine sont supprimées, et non conservées, partout où ce
  pipeline s'exécute — l'empreinte la plus réduite possible si un système en
  aval venait à être compromis.
- Les journaux ne contiennent que des métadonnées, par principe : nous
  n'écrivons pas le contenu des messages, les adresses e-mail ni d'autres
  données personnelles dans les journaux applicatifs ou les messages
  d'erreur.

### Contrôles d'accès

- **Authentification** via Auth0.
- **Contrôle d'accès basé sur les rôles** (au niveau de la plateforme) plus
  des **permissions par ressource** (au niveau du document ou de l'espace de
  travail) — moindre privilège par défaut.
- **Revues trimestrielles des accès et de la configuration** des services de
  production.

## Sécurité applicative

- **Défense XSS à la frontière de rendu** : les contenus générés par les
  utilisateurs et par l'IA sont assainis (DOMPurify) partout où ils sont
  rendus sous forme de HTML ; l'injection de HTML brut provenant de sources
  non fiables n'est pas autorisée.
- **Tests d'autorisation** : nous menons nos propres tests de sécurité
  manuels et assistés par IA contre les environnements de préproduction et de
  production, y compris des sondages authentifiés d'autorisation/IDOR — il ne
  s'agit pas (encore) d'un programme récurrent de tests d'intrusion réalisés
  par un tiers, et nous n'allons pas en revendiquer un tant qu'il n'existe
  pas.
- **Revue des dépendances et du code** : revue de code standard sur toutes
  les modifications ; mises à jour des dépendances suivies par notre
  outillage de build habituel.

## Disponibilité et surveillance

- **Surveillance synthétique** des points d'accès exposés aux clients, avec
  alerte de l'astreinte via PagerDuty dans les minutes qui suivent une panne
  réelle, et pas seulement en cas d'erreurs serveur — des vérifications avec
  contrôle du contenu, pas seulement « a-t-il renvoyé 200 ».
- **Infrastructure multi-régions** (périphérie Cloudflare + origine Google
  Cloud) avec sauvegardes automatisées de notre base de données principale.
- Nous ne publions pas actuellement de SLA contractuel de disponibilité. Si
  votre cas d'usage en exige un, demandez-nous — nous pouvons discuter de ce
  qui est réaliste pour votre déploiement.

## Réponse aux incidents

Nous maintenons un processus documenté de réponse aux incidents : détection et
classification, confinement, évaluation honnête de la question de savoir si un
incident constitue une violation à déclarer, remédiation, et un post-mortem
sans recherche de coupable qui alimente en retour ce que nous surveillons
ensuite. Si vous êtes client sous un Business Associate Agreement conclu avec
nous, cet accord précise nos obligations de notification à votre égard — ce
sont ces termes qui font foi, et non cette page.

Pour signaler un problème de sécurité ou une vulnérabilité présumée, écrivez à
**security@divinci.ai**. Nous n'exploitons pas actuellement de programme
formel de primes aux bogues (bug bounty) ; nous prenons néanmoins les
signalements au sérieux et travaillerons avec vous de bonne foi.

## Où nous en sommes concernant les certifications formelles

Soyons directs à ce sujet, puisque beaucoup de pages de sécurité ne le sont
pas :

- **HIPAA** : voir « Architecture préparée pour HIPAA » ci-dessus. Qu'un
  Business Associate Agreement s'applique ou non dépend de votre relation
  spécifique avec nous — nous l'évaluons client par client, et non comme une
  affirmation générale.
- **SOC 2** : pas encore commencé. C'est à notre feuille de route ; nous
  mettrons cette page à jour lorsqu'il y aura quelque chose de réel à
  annoncer — pas avant.
- **ISO 27001, FedRAMP, PCI DSS** : nous ne détenons pas ces certifications.
  Les paiements par carte sont traités par Stripe ; Divinci ne stocke pas
  directement les données de porteurs de carte.

Nous préférons en revendiquer moins ici et être dignes de confiance, plutôt
que d'en revendiquer trop et devoir ensuite faire marche arrière.

### Contact

Questions de sécurité, signalements de vulnérabilités ou questions de
conformité pour un contrat spécifique : **security@divinci.ai**
