+++
title = "Divinci Local Inference — Privacybeleid"
description = "Privacybeleid voor de Divinci Local Inference Chrome-extensie: wat lokaal op uw apparaat wordt uitgevoerd en wat, in specifieke ingelogde situaties, naar Divinci wordt verzonden."
template = "page.html"
+++

# Divinci Local Inference — Privacybeleid

**Laatst bijgewerkt:** juni 2026

Dit beleid is specifiek van toepassing op de **Divinci Local Inference**
Chrome-extensie. Voor de website, apps en diensten van Divinci AI in het
algemeen, zie ons algemene [Privacybeleid](/nl/privacy-policy/).

Divinci Local Inference voert een open-weight AI-model (Gemma 4 van Google)
lokaal uit in uw browser op uw GPU en verbindt — wanneer u ervoor kiest in te
loggen — die lokale assistent met uw Divinci-account voor optionele
cloud-ondersteunde functies. Dit beleid legt precies uit wat op uw apparaat
blijft en wat, in specifieke situaties, naar Divinci wordt verzonden.

**De korte versie:** Standaard is de extensie alleen-lokaal — uw chats met het
model op het apparaat verlaten nooit uw computer. Enkele optionele, duidelijk
gecontroleerde functies (inloggen, pagina-bewuste antwoorden en chat in
accountmodus) verzenden wel gegevens naar Divinci. Die worden hieronder
beschreven. Wij verkopen uw gegevens niet, tonen geen advertenties en
gebruiken ze niet om u op het web te volgen.

## 1. Wat op uw apparaat blijft (standaard)

- **Uw chats met het lokale Gemma-model.** Prompts en antwoorden worden
  berekend op uw GPU en worden niet gelogd, opgeslagen of verzonden door de
  extensie. (Uitzonderingen: de twee optionele functies in §3 en §4.)
- **De modelbestanden**, gecachet in uw browser na de eerste download.
- **Uw instellingen** (geselecteerd model, standaardinstellingen voor
  inferentie, privacyschakelaars), lokaal opgeslagen in uw browser.

Wanneer u **niet bent ingelogd**, verzendt de extensie **geen** enkele
surfinformatie naar Divinci.

## 2. Inloggen bij Divinci (optioneel)

Als u op **Inloggen / Registreren** klikt, doorloopt de extensie een
standaard OAuth-inlogprocedure met de identiteitsprovider van Divinci
(Auth0). Bij succes ontvangen en bewaren wij **op uw apparaat** een
toegangstoken en uw basisprofiel (e-mail, naam en avatar-URL), zodat de
extensie kan tonen als wie u bent ingelogd en namens u geauthenticeerde
verzoeken kan doen. Het toegangstoken verlaat nooit de background service
worker van de extensie. U kunt zich op elk moment afmelden via de popup in de
werkbalk, waarmee de opgeslagen tokens worden verwijderd.

## 3. Websurfgedrag (alleen terwijl u bent ingelogd **en** het paneel geopend is)

Om u te vertellen of de pagina die u bekijkt wordt gedekt door Divinci's
gedeelde openbare-webkennisindex en om antwoorden daarop te baseren, verzendt
de extensie — **alleen wanneer u bent ingelogd en het Divinci-zijpaneel
geopend heeft op een pagina** — het volgende naar de API van Divinci:

- **Het adres van de pagina**, teruggebracht tot alleen de oorsprong en het
  pad. De queryreeks en het fragment (de delen na `?` en `#`, die
  zoektermen, tokens of persoonlijke identificatoren kunnen bevatten) worden
  **vóór verzending verwijderd**.
- **Een eenrichtingsvingerafdruk (hash) van de zichtbare tekst van de
  pagina**, gebruikt om te detecteren of onze index actueel is. **De
  daadwerkelijke inhoud van de pagina wordt niet verzonden** — alleen deze
  hash en het ingekorte adres.

Belangrijke beperkingen:

- Dit gebeurt **alleen terwijl het zijpaneel geopend is** op een pagina. Met
  het paneel gesloten verzendt de extensie niets over de pagina's die u
  bezoekt.
- **Gevoelige websites worden volledig overgeslagen** — de extensie verzendt
  niets voor in-/aanmeldpagina's of accountpagina's, bank- en financiële
  websites, webmail, zorgportalen, lokale/private adressen of niet-standaard
  poorten.
- Het wordt gebruikt om de openbare-webindex op te zoeken en te actualiseren,
  **niet** om een profiel van u op te bouwen of advertenties op u te richten.

De gedeelde index zelf wordt opgebouwd doordat Divinci **openbaar
toegankelijke** webpagina's crawlt op zijn eigen servers; deze extensie
uploadt geen pagina-inhoud om deze op te bouwen.

## 4. Pagina-bewuste antwoorden & chat in accountmodus (optioneel)

- **Pagina-bewuste antwoorden (grounding).** Wanneer een pagina zich in de
  index bevindt en u een bericht verstuurt in het zijpaneel, verzendt de
  extensie **uw bericht en het ingekorte pagina-adres** naar Divinci om
  relevante context op te halen, die vervolgens aan het lokale model wordt
  gegeven. In dit geval verlaat uw chatbericht dus wel uw apparaat. U kunt dit
  uitschakelen — zie §5.
- **Chat in accountmodus.** Als u *"Mijn Divinci-account gebruiken"* voor chat
  inschakelt, wordt uw gesprek verzonden naar de servers van Divinci (om
  server-gehoste modellen en tools uit te voeren) en opgeslagen als transcript
  op uw account, op dezelfde manier als chatten op chat.divinci.app. Als u
  dit uitgeschakeld laat, blijft chat volledig lokaal.

## 5. Uw privacybediening

In de popup onder **Geavanceerde instellingen → Privacy**:

- **Divinci-paginacontext ophalen** — wanneer uitgeschakeld, verzendt de
  extensie nooit uw bericht voor pagina-bewuste antwoorden (uw chatvraag
  blijft op uw apparaat). Standaard: aan.
- **Divinci toestaan mijn accountchats te gebruiken** — wanneer uitgeschakeld,
  vraagt de extensie Divinci om uw chats in accountmodus niet te gebruiken om
  zijn diensten te verbeteren. Standaard: aan. (Dit verzendt een
  afmeldsignaal met uw verzoeken; de daadwerkelijke afhandeling wordt
  gehandhaafd door de servers van Divinci.)

U kunt ook **uitgelogd blijven** (volledig lokaal) of op elk moment **uitloggen**
om alles in §2–§4 te stoppen.

## 6. Waar gegevens naartoe gaan

- **huggingface.co** (en het CDN `cas-bridge.xethub.hf.co`) — om de
  modelbestanden te downloaden, onderworpen aan het
  [Privacybeleid van Hugging Face](https://huggingface.co/privacy).
- **De identiteitsprovider van Divinci** (Auth0) — alleen tijdens het
  inloggen.
- **De API van Divinci** (`api.divinci.app`) — voor de ingelogde functies in
  §3 en §4.

## 7. Wat wij **niet** doen

- Wij **verkopen of verhuren** uw gegevens niet.
- Wij tonen **geen** advertenties en gebruiken uw gegevens niet voor
  advertenties of cross-site tracking.
- Wij verzenden **niet** de **inhoud** van de pagina's die u bezoekt (alleen
  het ingekorte adres en een eenrichtingshash, zoals beschreven in §3).
- Wij verzenden niets over uw surfgedrag wanneer u bent uitgelogd of wanneer
  het zijpaneel gesloten is.

## 8. Machtigingen

- **offscreen** — het WebGPU-model uitvoeren.
- **storage** — instellingen en de cached-model-voorkeur lokaal opslaan.
- **identity** — OAuth-inloggen bij uw Divinci-account voltooien (§2).
- **hostmachtigingen** (`api.divinci.app` en de Auth0-inlogoorsprong) — de
  geauthenticeerde verzoeken in §2–§4 uitvoeren.
- **content script op alle websites** — het zijpaneel tekenen en, alleen
  terwijl dit geopend is en u bent ingelogd, de pagina-indexcontrole in §3
  uitvoeren. Het script leest de paginatitel, het adres en de zichtbare
  tekst **lokaal** om de hash te berekenen; het verzendt geen pagina-inhoud.
- **externally_connectable** (alleen Divinci AI-domeinen) — hiermee kan
  chat.divinci.app het lokale model gebruiken via een `chrome.runtime`-poort.

## 9. Open source

De extensie is gelicentieerd onder Apache-2.0; de broncode is beschikbaar op
[github.com/Divinci-AI/gemma-gem](https://github.com/Divinci-AI/gemma-gem).

## 10. Wijzigingen in dit beleid

Als wij wijzigen hoe de extensie met gegevens omgaat, werken wij dit beleid
bij en verhogen wij de versie van de extensie (weergegeven op de kaart in
`chrome://extensions`).

## 11. Contact

Vragen? E-mail [mike@divinci.ai](mailto:mike@divinci.ai).
