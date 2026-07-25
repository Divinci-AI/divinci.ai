+++
title = "Beveiliging"
description = "Hoe Divinci AI uw gegevens beschermt — de-identificatie, toegangsbeheer, auditlogging en eerlijke antwoorden over waar wij staan met formele certificeringen."
template = "page.html"
+++

# Beveiliging

Beveiliging is een kernonderdeel van hoe wij bouwen. Deze pagina beschrijft wat
er vandaag daadwerkelijk waar is over onze architectuur en werkwijze — geen
marketingchecklist. Waar wij iets nog niet hebben afgerond (een formele audit,
een certificering), zeggen wij dat gewoon ronduit in plaats van iets anders te
suggereren.

## Voor HIPAA voorbereide architectuur

![Voor HIPAA voorbereide architectuur](/brand/badges/hipaa-ready.svg)

Wij hebben de technische waarborgen die een onder HIPAA vallende workflow nodig
heeft standaard in het platform ingebouwd:

- **De-identificatie vóór opslag of AI-verwerking.** Chatinhoud kan via een
  automatische PII/PHI-redactiestap worden geleid (Microsoft Presidio, met een
  op klinische tekst afgestemd model beschikbaar voor medische contexten)
  voordat die onze database, onze AI-aanbieders of zoeken/retrieval bereikt —
  waarbij alle 18 identificatiecategorieën van HIPAA's Safe Harbor-methode
  (veiligehavenmethode) worden gedetecteerd. Deze stap faalt gesloten: als de
  redactie niet kan draaien, wordt het bericht geweigerd in plaats van
  stilzwijgend ongeredigeerd opgeslagen.
- **Manipulatiebestendige auditlogging.** Toegang tot gevoelige gegevens wordt
  vastgelegd in een via hashketens beveiligd logboek, zo ontworpen dat
  vermeldingen achteraf niet stilzwijgend gewijzigd kunnen worden.
- **Rolgebaseerd toegangsbeheer en toegangsbeheer op resourceniveau.** Zowel
  platformbrede rollen als rechten per resource bepalen wie wat mag zien.
- **Versleuteling tijdens transport en in rust**, met versleuteling op
  veldniveau beschikbaar voor aangewezen gevoelige gegevens.

**Wat dit niet is:** een HIPAA-nalevingscertificering. Er bestaat geen door de
overheid uitgegeven HIPAA-certificaat — naleving is een combinatie van
technische waarborgen (zie hierboven), schriftelijk vastgelegd administratief
beleid en ondertekende verwerkersovereenkomsten (Business Associate Agreement,
BAA) met elke leverancier in het gegevenspad, per geval beoordeeld voor een
bepaalde klantrelatie. Wilt u samen met ons beschermde gezondheidsinformatie
(PHI) verwerken onder een Business Associate Agreement,
[neem dan contact met ons op](https://meetings.hubspot.com/michael-mooring/divinci-ai)
— dan werken wij samen uit wat er voor uw specifieke use case nodig is.

## Gegevensbescherming

### Versleuteling

- **Tijdens transport**: overal TLS tussen clients, onze edge en onze
  origin-infrastructuur.
- **In rust**: versleuteling op aanbiedersniveau voor onze primaire
  gegevensopslag en objectopslag, plus een aparte versleutelingslaag op
  veldniveau voor aangewezen gevoelige velden.
- **Beheer van geheimen**: inloggegevens en API-sleutels worden beheerd via een
  centrale secrets manager, niet hard gecodeerd of in platte tekst in
  configuratie opgeslagen. De productieomgeving is zo geconfigureerd dat zij
  gesloten faalt in plaats van stilzwijgend terug te vallen op verouderde
  inloggegevens wanneer de secrets-dienst onbereikbaar is.

### Gegevensminimalisatie

- De-identificatie (zie hierboven) betekent dat oorspronkelijke PII/PHI wordt
  weggegooid en niet bewaard, overal waar die pijplijn draait — de kleinst
  mogelijke voetafdruk als een achterliggend systeem ooit gecompromitteerd
  raakt.
- Logs bevatten volgens beleid uitsluitend metadata: wij schrijven geen
  berichtinhoud, e-mailadressen of andere persoonsgegevens naar applicatielogs
  of foutmeldingen.

### Toegangsbeheer

- **Authenticatie** via Auth0.
- **Rolgebaseerd toegangsbeheer** (op platformniveau) plus **rechten per
  resource** (op document-/workspaceniveau) — standaard volgens het
  principe van minimale rechten.
- **Elk kwartaal beoordelingen van toegang en configuratie** van
  productiediensten.

## Applicatiebeveiliging

- **XSS-verdediging op de rendergrens**: door gebruikers en door AI
  gegenereerde inhoud wordt opgeschoond (DOMPurify) overal waar die als HTML
  wordt weergegeven; rauwe HTML-injectie vanuit niet-vertrouwde bronnen is niet
  toegestaan.
- **Autorisatietests**: wij voeren onze eigen AI-ondersteunde en handmatige
  beveiligingstests uit tegen staging en productie, inclusief geauthenticeerde
  autorisatie-/IDOR-tests — dit is (nog) géén terugkerend programma voor
  penetratietests door een externe partij, en wij gaan er ook geen claimen
  zolang het niet bestaat.
- **Afhankelijkheden en code review**: standaard code review op alle
  wijzigingen; updates van afhankelijkheden worden bijgehouden via onze normale
  buildtooling.

## Beschikbaarheid en monitoring

- **Synthetische monitoring** op endpoints die klanten gebruiken, waarbij de
  wachtdienst via PagerDuty binnen enkele minuten na een echte storing wordt
  gealarmeerd, niet alleen bij serverfouten — controles die de inhoud
  verifiëren, niet alleen "gaf het een 200 terug".
- **Infrastructuur in meerdere regio's** (Cloudflare edge + Google Cloud
  origin) met geautomatiseerde back-ups van onze primaire gegevensopslag.
- Wij publiceren op dit moment geen contractuele uptime-SLA. Heeft uw use case
  er wel een nodig, vraag het ons dan — dan bespreken wij wat realistisch is
  voor uw implementatie.

## Incidentrespons

Wij hanteren een gedocumenteerd incidentresponsproces: detectie en
classificatie, indamming, een eerlijke beoordeling of een incident neerkomt op
een meldingsplichtig datalek, herstel, en een blameless post-mortem die
terugvloeit in waar wij vervolgens op monitoren. Bent u klant met een Business
Associate Agreement bij ons, dan legt die overeenkomst onze
meldingsverplichtingen aan u vast — die voorwaarden zijn bepalend, niet deze
pagina.

Om een beveiligingszorg of een vermoedelijke kwetsbaarheid te melden, mailt u
**security@divinci.ai**. Wij hebben op dit moment geen formeel
bug-bountyprogramma; wij nemen meldingen wel serieus en werken te goeder trouw
met u samen.

## Waar wij staan met formele certificeringen

Hierover zijn wij direct, omdat veel beveiligingspagina's dat niet zijn:

- **HIPAA**: zie "Voor HIPAA voorbereide architectuur" hierboven. Of een
  Business Associate Agreement van toepassing is, hangt af van uw specifieke
  relatie met ons — wij beoordelen dit per klant, niet als algemene claim.
- **SOC 2**: nog niet gestart. Het staat op onze roadmap; wij werken deze
  pagina bij zodra er iets echts te melden valt — niet eerder.
- **ISO 27001, FedRAMP, PCI DSS**: deze certificeringen bezitten wij niet.
  Kaartbetalingen worden verwerkt via Stripe; Divinci slaat zelf geen
  kaarthoudergegevens op.

Wij claimen liever te weinig en worden vertrouwd, dan te veel te claimen en er
later op terug te moeten komen.

### Contact

Beveiligingsvragen, kwetsbaarheidsmeldingen of nalevingsvragen voor een
specifieke deal: **security@divinci.ai**
