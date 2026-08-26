+++
title = "De 12 QA- en release-managementcapaciteiten die elk custom-LLM-platform moet leveren"
description = "Capability-checklist voor LLM-releaseplatforms: per-slice gates, gekalibreerde judges, atomic rollback, hash-bewijzen — wat geleverd wordt, wat ontbreekt."
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "We onderzochten twaalf LLM-releaseplatforms voordat we het onze bouwden. De markt splitst zich in drie kampen die elkaar niet helemaal raken — eval-CI-tools, serving-canary-tools en observability-tools — en de ontbrekende naad ertussen is precies degene die een klantrelease nodig heeft. Deze post is de capaciteiten-checklist die uit dat onderzoek voortkwam: 12 specifieke tests die je op elk platform kunt toepassen, inclusief het onze."
+++

*Aantekeningen uit de Release Cycle — Deel III*

---

Een jaar geleden, voordat we aan onze eigen release-pipeline begonnen te bouwen, gingen we zitten en somden we elke QA-en-release-capaciteit op waarvan we dachten dat een serieus LLM-platform die zou moeten leveren. Vervolgens evalueerden we twaalf andere platforms tegen die lijst — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core. Niemand had alle twaalf. De combinaties die *wel* werden geleverd, clusterden zich in drie kampen die elkaar niet helemaal raakten.

Deze post is de resulterende capaciteitenlijst, op zichzelf bruikbaar gemaakt. Hij is georganiseerd volgens welke van onze vier pipeline-stadia elke capaciteit toebehoort — **Registreer → Gate → Roll → Observeer** — zodat hij netjes aansluit op de [pipeline-architectuur](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) en de [faalmodi](/nl/blog/10-ci-cd-release-failures-in-custom-language-models/) waarover we eerder geschreven hebben. Als je tools evalueert, werk de lijst dan van boven naar beneden tegen elke kandidaat; degenen met de diepste lacunes zullen je vertellen tot welk kamp ze behoren.

## De drie kampen (zodat je weet waar je naar kijkt)

Vóór de checklist zelf, de vorm van de markt in 2026:

- **Eval-CI-kamp** — Braintrust, Humanloop, Patronus. Voeren geautomatiseerde evaluators uit bij PR-merge. Blokkeren slechte merges. Raken nooit live verkeer aan. Sterk op capaciteiten 4–6; afwezig op 7–12.
- **Serving-canary-kamp** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core. Splitsen verkeer, monitoren infrastructuurmetrieken, auto-rollback op CloudWatch-achtige alarmen. Sterk op 1, 7, 9; afwezig aan de kwaliteitskant van 8 en 10–12.
- **Observability-kamp** — Arize Phoenix, Confident AI, Deepchecks. Bekijken productie, alarmeren mensen, escaleren. Sterk op 10 (monitoring), maar ze handhaven niets — alerting is geen auto-rollback.

Het gat tussen deze kampen — tussen "CI gepasseerd" en "live canary beoordeeld op kwaliteit, niet alleen latency" — is het deel dat iedereen handmatig moet overbruggen. Het sluiten van dat gat is de dragende claim in deze post.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Venn-diagram van drie LLM-platformkampen. Eval-CI-kamp (Braintrust, Humanloop, Patronus) staat links en dekt offline evaluatie bij PR-merge. Serving-canary-kamp (SageMaker, KServe, Vertex, BentoCloud, Seldon) staat rechts en dekt traffic-splitting met rollback op basis van infrastructuurmetrieken. Observability-kamp (Arize, Phoenix, Confident, Deepchecks) staat onderaan en dekt monitoring en alerting zonder handhaving. De drie cirkels overlappen elkaar paarsgewijs in smalle slivers, maar de centrale regio waar alle drie samenkomen is leeg. Die lege kern is de ontbrekende naad waar deze post over gaat — een releasebeslissing aangedreven door per-slice kwaliteit, atomair gehandhaafd op live verkeer.">
<title>De drie kampen en de ontbrekende kern</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">De drie kampen die elkaar niet helemaal raken</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">Elk kamp bezit één stuk. Het midden is waar elk team handmatig de brug slaat.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">Eval-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">offline eval-gates</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">bij PR-merge</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">Serving canary</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">traffic split +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">infra-metric rollback</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">Observability</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">monitor + alert (geen handhaving)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">ontbrekende</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">naad</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">De ontbrekende naad: per-slice kwaliteitsgate → atomic rollback aangedreven door outputkwaliteit, niet door infra-metrieken.</p>

## Stadium ① — Registreer

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTREER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Onveranderlijke manifestlaag. Foutoorzaakanalyse per SHA.</span>
  </div>
</div>

### Capaciteit 1. Onveranderlijk release-manifest met een content-addressable SHA

Wat het is: een release is geen modelgewichtsbestand. Een release is een onveranderlijke bundel van *alles* — modelartefact, prompttemplate, routingregels, datasetversie, preprocessing-versie — geadresseerd door één enkele SHA-256. Twee mensen die "dezelfde release" uitrollen moeten dezelfde SHA produceren, anders weigert de pipeline.

Waarom het ertoe doet: zonder dit is "welke wijziging heeft productie gebroken?" onbeantwoordbaar wanneer state over drie systemen is gesplitst. Atlassian's storing van april 2022<sup><a href="#ref-1">[1]</a></sup> duurde specifiek twaalf uur per site om te herstellen omdat state leefde in onafhankelijk geversioneerde systemen die weer met elkaar in overeenstemming moesten worden gebracht.

Wie levert het: serving-canary-kamp deels (model + routing); modelregisters (MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>) deels (alleen modelartefact). Bijna niemand bundelt de **prompttemplate** in de SHA, wat juist het veld is dat het vaakst verandert.

### Capaciteit 2. Atomaire versiebeheer over alle release-componenten

Wat het is: de overgang van release A naar release B wisselt *alles* in één instructie — gewichten en prompt en routing en dataset en preprocessing — niet als vijf afzonderlijke dashboardbewerkingen.

Waarom het ertoe doet: gedeeltelijke wissels creëren undefined-behavior-vensters. Als de prompt wordt bijgewerkt maar de routingregel niet, is elk verzoek dat de nieuwe prompt met de oude routingklasse raakt in een staat die niemand heeft gepland.

Wie levert het: niemand volledig. Het serving-canary-kamp wisselt de modelimage atomair; de prompt en routing leven doorgaans elders. Manifest-gestuurde wissels zijn waar Divinci's atomic-rollback-claim<sup><a href="#ref-5">[5]</a></sup> vandaan komt.

### Capaciteit 3. Training-serving omgevingspariteit

Wat het is: de preprocessing-pipeline die wordt gebruikt tijdens gate-evaluatie is *dezelfde* preprocessing die de productieserver gebruikt. Als ze divergeren, is elk offline cijfer een leugen.

Waarom het ertoe doet: training-serving skew is een van de [tien release-fouten](/nl/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) waarover we hebben geschreven. Het symptoom is "presteert prima in eval, gedraagt zich als een ander model in productie." De remedie is preprocessing in het manifest registreren en gaten ten opzichte van de productie-preprocessingversie.

Wie levert het: containerization-frameworks (BentoML, KServe) krijgen gedeeltelijke punten door preprocessing samen met serving te plaatsen. Geen van hen bindt preprocessing aan de eval-gate-input.

## Stadium ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Per-slice Spearman ρ versus mens-verankerde grader.</span>
  </div>
</div>

### Capaciteit 4. Per-slice / per-domein kwaliteitsgate

Wat het is: de gate-beslissing consumeert *per-slice* scores — contractopstelling, statutaire interpretatie, IP-licentiëring — niet één enkel aggregaat. Elke individuele slice die onder zijn drempel valt, markeert de release `gate_fail`, ongeacht hoe het gemiddelde eruitziet.

Waarom het ertoe doet: aggregaatscores wassen gelokaliseerde regressies weg. Tianpan's *Semver Lie*-rapport<sup><a href="#ref-3">[3]</a></sup> noemt dit als de dominante LLM-release-faalmodus van 2026: een model dat gemiddeld verbetert terwijl het stilletjes instort op één klasse user journeys.

Wie levert het: **niemand anders in 2026**. Eval-CI-tools — Braintrust, Humanloop, Patronus — scoren tegen één enkele globale rubriek of een platte takenlijst. Ze stellen geen per-slice drempel of slice-blinde override beschikbaar. Dit is de eerste plek waar de kampen elkaar niet kunnen ontmoeten.

### Capaciteit 5. Mens-verankerde gekalibreerde judge (Spearman ρ versus mensbeoordelingen)

Wat het is: de judge is geen generieke LLM-as-judge. Het is een LLM-judge wiens Spearman ρ tegen een paneel van domeinexperts wordt gemeten en per slice geconfigureerd. De judge wordt geselecteerd omdat zijn rangordes overeenkomen met die van de mens, niet omdat hij een sterke reputatie heeft.

Waarom het ertoe doet: MT-Bench<sup><a href="#ref-6">[6]</a></sup> laat zien dat GPT-4-as-judge >80% overeenstemt met mensen over het geheel, met per-categorie variantie van coderen (86%) tot schrijven (36–44%). "Algehele overeenstemming" verbergt de slices waarin de judge onbetrouwbaar is. Het per slice kalibreren van de judge is de enige eerlijke manier om geautomatiseerde scoring betrouwbaar te maken.

Wie levert het: Braintrust, Humanloop, Patronus voeren judge-evaluators uit. Geen van hen vereist, exposeert of bewaart een per-slice mens-verankerde Spearman-kalibratie. De Divinci-kalibratiepipeline is gedocumenteerd in [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/).

### Capaciteit 6. Override-pad met verplichte schriftelijke onderbouwing

Wat het is: het forceren van een gate-overschrijding is toegestaan (koude starts, geaccepteerde regressies, enz.) maar vereist twee velden — `forceGateOverride: true` EN `overrideReason: "..."`. De reden gaat in het audittrail naast het gebruikers-ID. Geen anonieme overrides.

Waarom het ertoe doet: governance-gates zijn geen aparte compliance-feature; ze zijn een eigenschap van het gate-stadium zelf. Het audittrail moet niet alleen antwoord geven op "is deze override gebruikt?" maar ook op "wat was de onderbouwing op dat moment?" — want toekomstig-jij moet het lezen.

Wie levert het: eval-CI-tools hebben flags; geen van hen vereist de onderbouwing als structureel onderdeel van de override.

## Stadium ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary op 5% → 25% → 100% met een kwaliteitsmonitor bij elke stap.</span>
  </div>
</div>

### Capaciteit 7. Multi-checkpoint canary met dwell

Wat het is: verkeer beweegt van 0% naar productie via ten minste drie checkpoints — typisch **5% → 25% → 100%** — en blijft bij elk hetzij voor een geconfigureerde dwell-tijd of een geconfigureerd aantal verzoeken, welke ook *later* komt. Geen instant 0%→100%.

Waarom het ertoe doet: long-tail bugs komen op schaal aan de oppervlakte. Een bug die 0,3% van de conversaties treft, is onzichtbaar op een 100-prompt eval en duidelijk op 5% van het productieverkeer. De dwell is wat de canary tijd geeft om de long tail te zien.

Wie levert het: het serving-canary-kamp levert dit. AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> documenteert een standaard `TerminationWaitInSeconds` van 600 (tien minuten). KServe, BentoCloud, Seldon en Vertex bieden allemaal vergelijkbare multi-step canary-configuraties. Dit is de verzadigde capaciteit.

### Capaciteit 8. Outputkwaliteitsmonitor bij elk canary-checkpoint

Wat het is: bij elk checkpoint controleert de pipeline drie monitors voordat hij doorgaat — p95-latency, 5xx-rate, **en** een outputkwaliteitsscore berekend door dezelfde gekalibreerde judge uit capaciteit 5. Latency en 5xx alleen zijn niet genoeg.

Waarom het ertoe doet: dit is waar de kampen elkaar opnieuw niet ontmoeten. SageMaker, KServe, Vertex, BentoCloud, Seldon bewaken allemaal latency en foutpercentage. Geen van hen levert een per-checkpoint outputkwaliteitsmonitor — omdat ze geen gekalibreerde judge hebben om tegen te scoren. De eval-CI-tools hebben de judge maar zitten niet op het verkeer.

Wie levert het: niemand voltooit de brug. De dwelling-canary-infrastructuur bestaat in het serving-kamp; de gekalibreerde judge bestaat in het eval-CI-kamp; we hebben niemand gezien die ze met elkaar verbindt.

### Capaciteit 9. Automatische stop bij kwaliteitsschending

Wat het is: een canary-checkpoint dat faalt op outputkwaliteit stopt automatisch. Promotie gaat niet verder. Geen menselijke page nodig om de uitrol te stoppen.

Waarom het ertoe doet: mensen zitten niet in de loop binnen de tijdspanne waarin uitrollen verlopen. Tegen de tijd dat een klantticket binnenkomt, is het 25%-checkpoint voorbij en heeft de 100%-promotie plaatsgevonden.

Wie levert het: serving-canary-kamp stopt op infrastructuurmetrieken. De kwaliteitsmetriek-stop is het deel dat capaciteit 8 vereist om te bestaan.

## Stadium ④ — Observeer

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVEER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Continue trace-replay → atomic rollback in ~12 s.</span>
  </div>
</div>

### Capaciteit 10. Continue productie-trace-replay door de kandidaat

Wat het is: nadat de canary naar 100% promoveert, blijft de observer draaien. Hij sampelt recente productie-traces, replayt ze door de *kandidaat*-(nu actieve)release, scoort ze met de gekalibreerde judge en zendt per minuut een kwaliteitsscore uit. Continu, niet periodiek.

Waarom het ertoe doet: stille kwaliteitsdalingen — model dat hedget, vol overtuiging een datum hallucineert, weigert waar dat niet zou moeten — verplaatsen nooit latency of 5xx. Het enige signaal dat je hiervoor krijgt is het klantticket, wat het slechtst mogelijke signaal is. Een continue kwaliteitsmonitor vangt ze in enkele minuten.

Wie levert het: **niemand.** Observability-kamp (Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>) monitort productie-output maar handhaaft niet. Het serving-canary-kamp bewaakt infra. Het eval-CI-kamp zit niet op het verkeer. De gesloten lus — productie-traces → gekalibreerde judge → handhaving — is de ontbrekende naad.

### Capaciteit 11. Atomic rollback in seconden, niet minuten

Wat het is: wanneer de observer afgaat (drie opeenvolgende minuten onder de drempel, bijvoorbeeld), wordt rollback automatisch afgevuurd. De rollback wijst routing opnieuw naar `previous_release` uit het manifest. Omdat de vorige release een volledig gebundeld manifest was, wisselt elke component atomair. End-to-end inclusief in-flight drain op een ~100-replica service: ongeveer 12 seconden<sup><a href="#ref-5">[5]</a></sup>.

Waarom het ertoe doet: Cloudflare's storing van juni 2022<sup><a href="#ref-8">[8]</a></sup> duurde 44 minuten om terug te draaien. De oorzaak was niet de terugdraaiing zelf — het was dat engineers over elkaars terugdraaiingen heen liepen omdat state gesplitst was. Manifest-gestuurde rollback is single-instruction; dat faalmodel kan niet voorkomen.

Wie levert het: serving-canary-kamp levert snelle infrastructuur-rollback (alarm-getriggerd, blue-green flip). Het architecturale verschil is of de *trigger* alleen infra is of kwaliteitsbewust (capaciteit 10).

### Capaciteit 12. Hash-chained, extern verankerbaar compliance-ontvangstbewijs

Wat het is: elke releasebeslissing — register, gate-pass, gate-fail, gate-override, checkpoint-promote, auto-rollback — zendt een JSON-met-SHA-256 ontvangstbewijs uit, hash-chained aan het vorige ontvangstbewijs voor deze klant en het vorige ontvangstbewijs voor deze release. De keten wordt extern verankerd op een door de klant geconfigureerd schema.

**Open-weights kanttekening.** Wanneer de release wordt ondersteund door een open-weights model (Gemma, Qwen, Llama, Mistral, GPT-OSS), bevat het ontvangstbewijs een [vIndex weight-attestation](/nl/compliance/) — een bewijs dat de actieve gewichten op het beslissingsmoment de gewichten zijn die het manifest heeft geregistreerd. Wanneer de release wordt ondersteund door een closed-API model (OpenAI, Anthropic, Google via opaque APIs), dekt het ontvangstbewijs de beslissingsketen maar kan het geen aanspraak maken op weight-provenance, omdat de provider geen gewichten blootstelt. Het ontvangstbewijs zegt dat expliciet. Dit is de grens van wat verifieerbaar is.

Waarom het ertoe doet: gereguleerde sectoren krijgen vandaag *logs*. De EU AI Act en NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> vragen steeds meer om *bewijzen*. Een hash-chained ontvangstbewijs is het verschil tussen "we hebben een log" en "een auditor kan de keten verifiëren zonder ons log te vertrouwen."

Wie levert het: niemand anders. Dit is het deel van de differentiatie dat direct aansluit op Divinci's bestaande [compliance-pagina](/nl/compliance/) — hetzelfde ontvangstbewijsformaat, uitgebreid naar releasebeslissingen.

## De 12 capaciteiten, per platformkamp

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrix van de 12 capaciteiten per platformkamp. Divinci heeft alle 12. Eval-CI-kamp (Braintrust, Humanloop, Patronus) heeft 5 en 6. Serving-canary-kamp (SageMaker, KServe, BentoCloud, Vertex, Seldon) heeft 1 deels, 2 deels, 7, 9 en 11 op infrastructuurmetrieken. Model-registry-kamp (W&B Models, MLflow, LangSmith) heeft 1 deels en 2 deels. Observability-kamp (Arize, Phoenix, Confident, Deepchecks) heeft 10 alleen in monitor-vorm. Niemand anders heeft 4 per-slice gate, 5 mens-verankerde gekalibreerde judge, 8 outputkwaliteits-canary-monitor, 10 closed-loop trace-replay met handhaving, of 12 hash-chained ontvangstbewijzen.">
<title>De 12 capaciteiten, per kamp</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Welk kamp levert welke capaciteit</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = levert het. ◐ = deels (alleen infra, of alleen registry). ✗ = levert het niet. Zes capaciteiten ontbreken in elk ander kamp.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">Capaciteit</text>
<text x="380" y="100" font-weight="700" text-anchor="middle">Divinci</text>
<text x="490" y="100" font-weight="700" text-anchor="middle">Eval-CI</text>
<text x="600" y="100" font-weight="700" text-anchor="middle">Serving</text>
<text x="710" y="100" font-weight="700" text-anchor="middle">Registry</text>
<text x="820" y="100" font-weight="700" text-anchor="middle">Observe</text>
</g>
<g font-size="10" fill="#8a7d68">
<text x="490" y="116" text-anchor="middle">Braintrust</text>
<text x="600" y="116" text-anchor="middle">SageMaker</text>
<text x="710" y="116" text-anchor="middle">W&amp;B</text>
<text x="820" y="116" text-anchor="middle">Arize</text>
</g>
<line x1="40" y1="124" x2="860" y2="124" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="146">1. Onveranderlijk manifest-SHA</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. Atomaire versie-wissel (alle componenten)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. Training-serving omgevingspariteit</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. Per-slice / per-domein kwaliteitsgate</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. Mens-verankerde gekalibreerde judge</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. Override-pad met verplichte onderbouwing</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. Multi-checkpoint canary met dwell</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. Outputkwaliteitsmonitor per checkpoint</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. Auto-stop bij kwaliteitsschending</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. Closed-loop productie-trace-replay</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. Atomic rollback in seconden</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. Hash-chained compliance-ontvangstbewijs</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">Capaciteiten 4, 5, 8, 10, 12 gemarkeerd: dit zijn de vijf zonder andere leverancier in deze scan. De rest clustert in het ene of het andere kamp.</text>
</svg>
</figure>

Het patroon is het punt. Vijf capaciteiten — **per-slice gate, gekalibreerde judge, kwaliteits-canary-monitor, closed-loop replay, hash-chained ontvangstbewijs** — verschijnen als ✗ over elk ander kamp. Dat is de naad. De andere zeven verdelen zich over de kampen op manieren die elk kamp intern coherent maar wederzijds incompleet maken.

## Wat maakt QA anders voor custom language models dan voor software?

LLMs zijn niet deterministisch, zelfs op temperatuur nul — batching en hardwareverschillen veroorzaken outputvariatie. Die ene eigenschap breekt de meeste aannames waarop traditionele QA werd gebouwd:

- **Je kunt geen `expect(output).toEqual(X)` assertions schrijven.** Je hebt een distributiebewuste evaluatie nodig die rangcorrelatie consumeert tegen een mens-verankerde grader, niet gelijkheid tegen een fixture. Dit is waar capaciteit 5 over gaat.
- **Een model kan een aggregaat-kwaliteitscheck passeren terwijl het faalt op een slice.** Dat is waarom capaciteit 4 apart bestaat. Als je eval niet kan slicen, kan hij slice-bewuste regressies niet vangen.
- **Kwaliteitsfouten zijn stil op de infrastructuurlaag.** Latency en 5xx blijven schoon terwijl het model hedget of hallucineert. Capaciteiten 8 en 10 bestaan omdat geen infrastructuurmonitor dit kan zien.
- **Rollback is niet optioneel.** Omdat faalmodi probabilistisch zijn en sommige stil, moet het rollback-pad primaire infrastructuur zijn, geen back-upplan. Capaciteit 11 is wat "12 seconden" haalbaar maakt; capaciteit 2 is wat het correct maakt.

Een QA-en-release-platform dat geen rekening houdt met deze vier feiten, levert deterministische-software CI/CD met een LLM-logo erop geplakt. De markt doet dit veel.

## Hoe ondersteunen audittrails AI-compliance, in de praktijk?

Het meest voorkomende compliance-gat dat we zien — wanneer een auditor zes maanden na deployment arriveert en vraagt "welke versie van het model draaide op 15 maart, en wie heeft die release goedgekeurd?" — is niet "we hebben geen logs." Het is "we hebben logs verspreid over vijf systemen en de tijdlijnen komen niet overeen."

Een compliance-ontvangstbewijs (capaciteit 12) lost dit op door het log zelf een verplaatsbaar artefact te maken: hash-chained, single-source, extern verankerbaar. Een auditor kan de keten verifiëren zonder onze infrastructuur te vertrouwen. Dat is het verschil tussen "we hebben records" en "de records zijn aantoonbaar."

Voor open-weights modelondersteuning bevat het ontvangstbewijs ook een weight-attestation — een cryptografisch bewijs dat de actieve gewichten de gewichten zijn die het manifest heeft geregistreerd. Dit voldoet aan de zwaardere verzoeken (GDPR Artikel 17 recht op vergetelheid, EU AI Act provenance) omdat je *niet alleen kunt bewijzen wat is uitgerold* maar *dat de onderliggende gewichten zijn wat ze beweren te zijn*.

Voor closed-API-ondersteuning — wanneer het model wordt geleverd achter een opaque API en de gewichten niet worden blootgesteld — dekt het ontvangstbewijs de beslissingsketen maar kan het geen aanspraak maken op weight-provenance. We zeggen dit expliciet in het ontvangstbewijs in plaats van een bewijs te impliceren dat we niet kunnen leveren. Het is de grens van wat verifieerbaar is wanneer de provider gewichten intern houdt.

## Wat deze checklist niet oplost

Drie eerlijke beperkingen:

**Capaciteiten zijn geen vinkjes voor het vinkje.** Een platform dat alle twaalf slecht levert, is erger dan een dat er acht goed levert. De checklist is een startpunt voor evaluatie, geen scorekaart voor vendor-RFP's.

**De competitieve momentopname is 2026 en zal verschuiven.** Over zes maanden zullen enkele van de ✗-markeringen hierboven omdraaien — concurrenten zullen postmortems lezen en gaten dichten. Als je deze post in 2027 leest, controleer de markeringen dan zelf voordat je ze gelooft.

**Sommige capaciteiten hangen af van andere.** Capaciteit 8 (outputkwaliteits-canary-monitor) vereist capaciteit 5 (gekalibreerde judge). Capaciteit 10 (closed-loop trace-replay) vereist beide. Een platform dat 8 levert zonder 5 levert een placebo — de canary-monitor bestaat maar is nergens betrouwbaar tegenaan gegrond.

## FAQ

### Wat is de belangrijkste QA-capaciteit voor custom LLM-releases?

Een per-slice kwaliteitsgate (capaciteit 4) — wat betekent dat de releasebeslissing per-domein Spearman-scores consumeert tegen een mens-verankerde grader, niet één globaal aggregaat. Aggregaatscores wassen gelokaliseerde regressies weg, en gelokaliseerde regressies zijn de dominante LLM-release-faalmodus van 2026<sup><a href="#ref-3">[3]</a></sup>. Als je maar één capaciteit uit deze lijst kunt leveren, lever dan 4. Lever vervolgens 5, wat 4 betrouwbaar maakt.

### Hoe evalueer je een LLM-QA-platform zonder het zes maanden te draaien?

Pas de 12-capaciteitenchecklist hierboven toe op vendor-documentatie, met twee specifieke tests. Vraag de leverancier eerst om je de *per-slice* gate-output te tonen voor een van hun referentieklanten — als ze alleen aggregaatscores hebben, hebben ze capaciteit 4 niet. Vraag ten tweede wat hun auto-rollback triggert — als het antwoord is "latency, foutpercentage en onze alarmen," zitten ze in het serving-canary-kamp en ontbreekt capaciteit 10.

### Wat is het verschil tussen eval-CI-tools en release-management-tools?

Eval-CI-tools (Braintrust, Humanloop, Patronus) voeren geautomatiseerde evaluators uit bij PR-merge en blokkeren slechte merges. Ze raken nooit live verkeer aan. Release-management-tools (deze categorie) bezitten het release-manifest, de canary, de observer en het rollback-pad. Eval-CI is *onderdeel van* een release-management-workflow maar geen vervanging ervoor. Veel teams leveren een van beide en ontdekken het gat wanneer een regressie die door CI is gekomen stilletjes productie raakt.

### Hoe snel moet rollback zijn?

Order-of-magnitude seconden, geen minuten. De gemiddelde rollback-tijd op de Divinci-pipeline is ongeveer 12 seconden — dat is in-flight verzoek-drain op een ~100-replica service, niet de manifest-wissel zelf, die sub-seconde is. Vergelijk dit met Cloudflare's incident van juni 2022<sup><a href="#ref-8">[8]</a></sup>, dat 44 minuten kostte om terug te draaien omdat state verdeeld was over systemen. De architecturale beslissing die seconden-niet-minuten mogelijk maakt is het gebundelde release-manifest (capaciteiten 1 en 2).

### Waarom zijn compliance-ontvangstbewijzen belangrijker dan compliance-logs?

Een log is iets wat jij hebt geschreven. Een ontvangstbewijs is iets wat een auditor kan verifiëren zonder jou te vertrouwen. De EU AI Act en NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> maken steeds meer onderscheid tussen de twee — "gedocumenteerd" is niet hetzelfde als "aantoonbaar," en de regelgevende richting gaat naar het laatste. Een hash-chained, extern verankerd ontvangstbewijs is de eenvoudigste beschikbare technologie om die lijn te overschrijden.

## Referenties

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "De versnelde Restoration 2-aanpak duurde ongeveer 12 uur om een site te herstellen." Geciteerd voor capaciteit 1 — hoe state-spread-across-systems eruitziet op schaal.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> en <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. De alleen-modelartefact-kant van capaciteit 1. Geen van beide levert prompttemplate-registratie.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (april 2026). Noemt de slice-bewuste regressie-faalmodus als het dominante 2026-patroon. Begeleidend: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Verankering voor capaciteit 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> en <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Standaard <code>TerminationWaitInSeconds</code> van 600 (tien minuten), maximum 1800 (dertig minuten). De standaard infrastructuur-metriek-canary waar de post tegen contrasteert op capaciteiten 8 en 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Intern — atomic routing-flip via release-manifest.</strong> De ~12-seconden rollback-tijd is in-flight drain op een ~100-replica service; de manifest-wissel zelf is sub-seconde. Het getal komt van onze eigen service, niet van een benchmark. De architectuur die het mogelijk maakt is het gebundelde manifest uit capaciteit 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-categorie variantie.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% algehele GPT-4-vs-mens overeenstemming, met per-categorie variantie van coderen (86%) tot schrijven (36–44%). Verankering voor capaciteit 5 — waarom een gekalibreerde judge per-slice moet zijn.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Observability-kamp vergelijking.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Confident AI's 2026 observability tools-vergelijking</a>. Allemaal leveren ze monitoring en alerting; geen handhaaft rollback. Verankering voor de "monitor zonder handhaving"-framing van capaciteit 10.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare-storing juni 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Hoofdoorzaak gevonden en begrepen. Werk begint om de problematische wijziging terug te draaien… 07:42: De laatste van de terugdraaiingen is voltooid." 44 minuten van "we weten wat we moeten terugdraaien" tot terugdraaiing voltooid, deels omdat engineers over elkaars terugdraaiingen heen liepen. Verankering voor capaciteit 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — de vier kernfuncties waarop capaciteit 12 aansluit. Plus de EU AI Act provenance-vereisten op <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Verankering voor capaciteit 12.
</li>
</ol>

---

*Volgende in deze serie:* **Validating and Releasing Custom LMs in Regulated Fields.** De capaciteitenchecklist hierboven is generiek. De volgende post is specifiek: de EU AI Act, GDPR Artikel 17, HIPAA en NIST AI RMF — wat elk vraagt van een releaseproces, welke capaciteiten hierboven welke vereiste dekken, en waar de open-weights / closed-weights splitsing het compliance-verhaal werkelijk verandert.
