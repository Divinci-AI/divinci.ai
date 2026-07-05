+++
title = "Divinci Local Inference — Politique de Confidentialité"
description = "Politique de confidentialité de l'extension Chrome Divinci Local Inference : ce qui s'exécute localement sur votre appareil et ce qui, dans des situations précises où vous êtes connecté, est envoyé à Divinci."
template = "page.html"
+++

# Divinci Local Inference — Politique de Confidentialité

**Dernière mise à jour :** Juin 2026

Cette politique s'applique spécifiquement à l'extension Chrome **Divinci Local
Inference**. Pour le site web, les applications et les services de Divinci AI
en général, consultez notre [Politique de Confidentialité](/fr/privacy-policy/)
principale.

Divinci Local Inference exécute un modèle d'IA à poids ouverts (Gemma 4 de
Google) localement dans votre navigateur, sur votre GPU, et — lorsque vous
choisissez de vous connecter — relie cet assistant local à votre compte
Divinci pour des fonctionnalités optionnelles assistées par le cloud. Cette
politique explique précisément ce qui reste sur votre appareil et ce qui, dans
des situations précises, est envoyé à Divinci.

**En bref :** Par défaut, l'extension fonctionne uniquement en local — vos
échanges avec le modèle exécuté sur l'appareil ne quittent jamais votre
ordinateur. Certaines fonctionnalités optionnelles et clairement contrôlées
(connexion, réponses tenant compte de la page, et chat en mode compte)
envoient bien des données à Divinci. Elles sont décrites ci-dessous. Nous ne
vendons pas vos données, n'affichons pas de publicités et ne les utilisons pas
pour vous suivre sur le web.

## 1. Ce qui reste sur votre appareil (par défaut)

- **Vos échanges avec le modèle local Gemma.** Les invites et les réponses
  sont calculées sur votre GPU et ne sont ni consignées, ni stockées, ni
  transmises par l'extension. (Exceptions : les deux fonctionnalités
  optionnelles des §3 et §4.)
- **Les fichiers du modèle**, mis en cache dans votre navigateur après le
  premier téléchargement.
- **Vos paramètres** (modèle sélectionné, réglages d'inférence par défaut,
  options de confidentialité), stockés localement dans votre navigateur.

Lorsque vous n'êtes **pas connecté**, l'extension n'envoie **aucune**
information de navigation à Divinci.

## 2. Se connecter à Divinci (optionnel)

Si vous cliquez sur **Se connecter / S'inscrire**, l'extension effectue une
connexion OAuth standard avec le fournisseur d'identité de Divinci (Auth0). En
cas de succès, nous recevons et stockons **sur votre appareil** un jeton
d'accès ainsi que votre profil de base (e-mail, nom et URL d'avatar) afin que
l'extension puisse afficher votre identité de connexion et effectuer des
requêtes authentifiées en votre nom. Le jeton d'accès ne quitte jamais le
service d'arrière-plan (background service worker) de l'extension. Vous
pouvez vous déconnecter à tout moment depuis la fenêtre contextuelle de la
barre d'outils, ce qui supprime les jetons stockés.

## 3. Activité de navigation web (uniquement lorsque vous êtes connecté **et** que le panneau est ouvert)

Pour vous indiquer si la page que vous consultez est couverte par l'index de
connaissances publiques web partagé de Divinci et pour ancrer les réponses sur
celui-ci, l'extension — **uniquement lorsque vous êtes connecté et que vous
avez ouvert le panneau latéral Divinci sur une page** — envoie les éléments
suivants à l'API de Divinci :

- **L'adresse de la page**, réduite à son origine et à son chemin uniquement.
  La chaîne de requête et le fragment (les parties après `?` et `#`, qui
  peuvent contenir des termes de recherche, des jetons ou des identifiants
  personnels) sont **supprimés avant l'envoi**.
- **Une empreinte à sens unique (hachage) du texte visible de la page**,
  utilisée pour détecter si notre index est à jour. **Le contenu réel de la
  page n'est pas envoyé** — seuls ce hachage et l'adresse épurée le sont.

Limites importantes :

- Cela se produit **uniquement lorsque le panneau latéral est ouvert** sur une
  page. Panneau fermé, l'extension n'envoie rien concernant les pages que vous
  visitez.
- **Les sites sensibles sont entièrement ignorés** — l'extension n'envoie rien
  pour les pages de connexion/compte, les sites bancaires et financiers, la
  messagerie web, les portails de santé, les adresses locales/privées ou les
  ports non standard.
- Ces informations servent à consulter et à actualiser l'index public du web,
  **pas** à établir un profil vous concernant ni à cibler de la publicité.

L'index partagé lui-même est constitué par Divinci en explorant des pages web
**accessibles publiquement** sur ses propres serveurs ; cette extension ne
téléverse pas de contenu de page pour le constituer.

## 4. Réponses tenant compte de la page et chat en mode compte (optionnel)

- **Réponses tenant compte de la page (ancrage).** Lorsqu'une page figure dans
  l'index et que vous envoyez un message dans le panneau latéral, l'extension
  envoie **votre message et l'adresse de page épurée** à Divinci afin de
  récupérer le contexte pertinent, qui est ensuite fourni au modèle local.
  Dans ce cas, votre message de chat quitte donc bien votre appareil. Vous
  pouvez désactiver cette fonctionnalité — voir §5.
- **Chat en mode compte.** Si vous activez l'option *« Utiliser mon compte
  Divinci »* pour le chat, votre conversation est envoyée aux serveurs de
  Divinci (pour exécuter des modèles et des outils hébergés côté serveur) et
  stockée en tant que transcription sur votre compte, de la même manière que
  lorsque vous discutez sur chat.divinci.app. Laisser cette option désactivée
  garde le chat entièrement local.

## 5. Vos contrôles de confidentialité

Dans la fenêtre contextuelle, sous **Paramètres avancés → Confidentialité** :

- **Récupérer le contexte de page Divinci** — lorsque désactivé, l'extension
  n'envoie jamais votre message pour les réponses tenant compte de la page
  (votre requête de chat reste sur votre appareil). Par défaut : activé.
- **Autoriser Divinci à utiliser mes chats de compte** — lorsque désactivé,
  l'extension demande à Divinci de ne pas utiliser vos chats en mode compte
  pour améliorer ses services. Par défaut : activé. (Cela envoie un signal de
  refus avec vos requêtes ; le traitement effectif est appliqué par les
  serveurs de Divinci.)

Vous pouvez également rester **déconnecté** (entièrement local) ou vous
**déconnecter** à tout moment pour arrêter tout ce qui est décrit aux §2 à §4.

## 6. Où vont les données

- **huggingface.co** (et le CDN `cas-bridge.xethub.hf.co`) — pour télécharger
  les fichiers du modèle, sous réserve de la [Politique de Confidentialité de
  Hugging Face](https://huggingface.co/privacy).
- **Le fournisseur d'identité de Divinci** (Auth0) — uniquement lors de la
  connexion.
- **L'API de Divinci** (`api.divinci.app`) — pour les fonctionnalités en mode
  connecté décrites aux §3 et §4.

## 7. Ce que nous **ne** faisons **pas**

- Nous ne vendons ni ne louons **pas** vos données.
- Nous n'affichons **pas** de publicités et n'utilisons **pas** vos données à
  des fins publicitaires ou de suivi intersites.
- Nous n'envoyons **pas** le **contenu** des pages que vous visitez (seulement
  l'adresse épurée et un hachage à sens unique, conformément au §3).
- Nous ne transmettons **rien** concernant votre navigation lorsque vous êtes
  déconnecté ou que le panneau latéral est fermé.

## 8. Autorisations

- **offscreen** — exécuter le modèle WebGPU.
- **storage** — stocker localement les paramètres et la préférence de modèle
  mis en cache.
- **identity** — effectuer la connexion OAuth à votre compte Divinci (§2).
- **host permissions** (`api.divinci.app` et l'origine de connexion Auth0) —
  effectuer les requêtes authentifiées des §2 à §4.
- **content script sur tous les sites** — afficher le panneau latéral et,
  uniquement lorsqu'il est ouvert et que vous êtes connecté, exécuter la
  vérification de l'index de page décrite au §3. Le script lit le titre,
  l'adresse et le texte visible de la page **localement** pour calculer le
  hachage ; il ne transmet pas le contenu de la page.
- **externally_connectable** (domaines Divinci AI uniquement) — permettre à
  chat.divinci.app d'utiliser le modèle local via un port `chrome.runtime`.

## 9. Open source

L'extension est publiée sous licence Apache-2.0 ; le code source est
disponible sur
[github.com/Divinci-AI/gemma-gem](https://github.com/Divinci-AI/gemma-gem).

## 10. Modifications de cette politique

Si nous modifions la manière dont l'extension traite les données, nous
mettrons à jour cette politique et incrémenterons la version de l'extension
(affichée sur la fiche `chrome://extensions`).

## 11. Contact

Des questions ? Écrivez-nous à [mike@divinci.ai](mailto:mike@divinci.ai).
