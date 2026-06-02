+++
title = "Geautomatiseerde LLM CI/CD-pipelines met directe rollback"
description = "De operationele laag van de vierfasige pipeline: welke beslissingen automatisch lopen, hoe een echte rollback-oefening eruitziet, en het MTTR-getal."
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
summary = "Tussen menselijke goedkeuringspoorten draait een LLM-release-pipeline zichzelf, of niet. Deze post is de operationele tegenhanger van de architectuurpost — hij tekent het automatiseringsspectrum (welke beslissingen automatisch vuren, welke een mens vereisen, en welke we hard stoppen totdat iemand de override ondertekent), laat zien hoe een echte rollback-oefening eruitziet, en eindigt met het MTTR-getal dat er aan de andere kant uitkomt."
+++

*Aantekeningen uit de Release-cyclus — Deel V*

---

De meest geciteerde pagina die vorig kwartaal niet werd uitgerold, was degene die onze observer om 02:14 uur 's nachts uit zichzelf activeerde. De kandidaat-release was door de poort gekomen, had de vereiste vier minuten op 5% gestaan, was doorgegaan naar 25% en bleef daar vervolgens hangen. De per-minuut kwaliteitsmonitor zag drie opeenvolgende sub-threshold-metingen op de juridische domein-slice, stopte de uitrol, en stuurde het routeringsverkeer terug naar de vorige release. Tegen de tijd dat de melding van de on-call engineer afging — voor het ontvangstbewijs, niet voor een storing — was het productieverkeer al negen minuten weer op de bekend-goede release.

Niemand hoefde iets te doen. De architectuur uit [de eerste post in deze serie](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) beschrijft wat de vier fasen zijn. Deze post gaat over wat er tussen menselijke goedkeuringen draait — de automatiseringslaag onder de architectuur, de grens waar de pipeline ofwel uit zichzelf het juiste doet, ofwel niet.

De hoofdclaim: **de meeste pipeline-beslissingen moeten geautomatiseerd zijn, maar niet alle**. De grens doet ertoe. De pipeline die alles automatiseert zal uiteindelijk een release promoveren die een mens had moeten onderscheppen; de pipeline die niets automatiseert heeft geen nut. Het correct trekken van die grens is waar deze post over gaat.

## Het automatiseringsspectrum

Elke pipeline-beslissing zit ergens op een spectrum van *"vuurt uit zichzelf zonder enige menselijke melding"* tot *"weigert door te gaan zonder een expliciet ondertekende goedkeuring."* Hieronder zie je waar elk van de dragende pipeline-acties op dat spectrum zit in onze in-productie pipeline.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Het automatiseringsspectrum. Van volledig geautomatiseerd aan de linkerkant tot altijd menselijke goedkeuring vereist aan de rechterkant. Uitgezette beslissingen: aan het volledig-geautomatiseerde uiteinde, de per-minuut kwaliteitsmonitor-evaluatie, de canary checkpoint-gezondheidscheck en de auto-rollback-trigger; in het midden, de gate-pass-doorgang en de canary checkpoint-promotie; richting de menselijke kant, de productie-deploy-registratie en de manifest-commit; aan het altijd-menselijke uiteinde, de gate-fail override-beslissing en cold-start release shadow deployment.">
<title>Het automatiseringsspectrum</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Het automatiseringsspectrum</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Waar elke dragende pipeline-beslissing zit, van volledig autonoom (links) tot altijd-menselijk (rechts).</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">VOLLEDIG GEAUTOMATISEERD</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">vuurt uit zichzelf,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">geen melding</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">ALLEEN MELDEN</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">draait automatisch;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">ontvangstbewijs + pagina</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">DOORGAAN-INDIEN-OK</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">mens kan veto uitspreken</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">in een bekend venster</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">MENS-GESTART</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">vereist expliciete</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">gebruikersactie</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">ALTIJD-MENSELIJK</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">weigert zonder</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">ondertekende reden</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Observer per-minuut</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">kwaliteits-eval</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">draait continu</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">op 5% trace-steekproef</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Canary checkpoint</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">gezondheidscheck</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + output-</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">kwaliteit op 5/25/100</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Auto-rollback-</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">trigger</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 opeenvolgende min.</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">onder drempel</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Gate-pass-doorgang</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">naar canary</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">alle slices ≥ drempel</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ auto-start op 5%</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Checkpoint</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">gaat door als monitoren</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">standhouden tijdens dwell</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Release-</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">registratie</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">klant commit</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">een nieuw manifest</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Gate-fail override</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">vereist schriftelijke</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">reden in audit log</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">Rode markers</tspan> = de twee beslissingen waar het pipeline-gedrag asymmetrisch is: auto-rollback vuurt uit zichzelf en je kunt er niet voor opt-outen; gate-fail override weigert door te gaan en je kunt de reden niet overslaan.</text>
</svg>
</figure>

Twee van de markers hierboven zijn rood in plaats van gekleurd volgens hun zone. Dat zijn de asymmetrische beslissingen — de twee plekken waar de pipeline een sterk standpunt inneemt over wie wat mag beslissen. De **auto-rollback-trigger** vuurt zonder te vragen; je kunt hem niet uitconfigureren, want het hele punt van het hebben ervan is dat hij om 02:14 uur werkt. De **gate-fail override** weigert door te gaan zonder een schriftelijke reden; ook die kun je niet uitconfigureren, want het hele punt is dat toekomstige jij moet kunnen lezen waarom. De rest van de pipeline is grotendeels configureerbaar; deze twee niet.

## Hoe auto-rollback daadwerkelijk vuurt

De meest gestelde vraag over auto-rollback is *"wat voorkomt dat hij om de verkeerde reden vuurt?"* Het eerlijke antwoord is: niets in z'n eentje. De bescherming komt voort uit hoe de trigger is bedraad.

De Observe-fase draait een per-minuut scoring-loop. Elke minuut:

1. Bemonstert hij een kleine set recente productie-traces van de actieve release.
2. Speelt hij elke trace opnieuw af door het *actieve model* (niet de kandidaat — we scoren wat er daadwerkelijk draait).
3. Scoort hij elke replay met dezelfde gekalibreerde, mens-verankerde judge die Gate-2 stuurde<sup><a href="#ref-1">[1]</a></sup>.
4. Berekent hij één output-kwaliteitsscore over de steekproef. Schrijft die naar `CanaryHealthSample`.

De rollback vuurt wanneer **drie opeenvolgende per-minuut steekproeven** onder de rollback-drempel vallen (standaard: 0,85 van de gate-drempel — dus 0,55 als de gate 0,65 was). Niet één slechte minuut; drie. De drie-minuten-lockout is de ruisfilter — een enkele afwijkende meting triggert niets, maar een aanhoudende regressie wel.

Wanneer de lockout breekt, voert de rollback-worker uit:

```bash
# In de praktijk — de pipeline draait dit uit zichzelf. Geen menselijke bevestiging.
POST /api/v1/releases/<previous_release_sha>/activate
# response in <1s; in-flight drain in ~12s op een ~100-replica service
```

Er vuurt een ontvangstbewijs af. De on-call engineer ziet een Slack-melding *voor het ontvangstbewijs*, niet voor een storing. Ze openen het ontvangstbewijs; ze zien de drie sub-threshold-metingen, de verstreken tijd en de `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup> hashes. Twaalf seconden is de in-flight drain-tijd; de swap zelf is sub-seconde. Tegen de tijd dat de engineer wakker genoeg is om te vragen "moet ik iets doen?" is het antwoord "nee, maar je moet wel kijken waarom de gate dit doorliet."

## Het daadwerkelijke auto-rollback-ontvangstbewijs

Zo ziet het ontvangstbewijs eruit in productie. Hetzelfde hash-geketende format dat op de [compliance-pagina](/nl/compliance/) is gedocumenteerd, met de extra velden specifiek voor een auto-rollback-event:

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

Het ontvangstbewijs zelf is het eerste contactpunt voor de on-call. Het lezen ervan beantwoordt de vragen die een halfslapende engineer daadwerkelijk zou stellen: wat triggerde het, welke slice faalde, met hoeveel, hoe lang duurde de swap, wat draait er nu. De vervolgactie is meestal *"ga uitzoeken waarom de gate dit überhaupt doorliet"* — en het ontvangstbewijs voor de falende release bevat al de per-slice Spearman-tabel.

## Wat de pipeline NIET uit zichzelf doet

Het corollarium van "auto-rollback vuurt zonder te vragen" is dat sommige andere dingen actief niet kunnen. Drie expliciete weigeringen.

**Hij promoveert geen release die de gate niet heeft gehaald zonder een ondertekende override.** Een gate-fail markeert de release `gate_fail`; het `/activate`-endpoint weigert de manifest-SHA te accepteren; geen enkele command-line truc komt hier omheen. De enige weg vooruit is een force-override met `forceGateOverride: true` AND `overrideReason: "<free text>"`. Het redenveld is verplicht, vrije tekst en gaat samen met de gebruikers-ID in het audit log. We hebben dit zo ontworpen dat toekomstige jij kan lezen waarom huidige jij besloot dat de slice-regressie acceptabel was. Drie mensen hebben het override-pad in de praktijk gebruikt. Hun redeneringen staan nog steeds in het audit log.

**Hij gaat niet van canary naar 100% als een monitor degradeert.** Als p95-latentie, 5xx-rate OF output-kwaliteitsscore buiten zijn band valt aan het einde van een checkpoint-dwell, stopt de pipeline op dat checkpoint en stuurt een pagina uit. Hij gaat niet door om later excuses aan te bieden.

**Hij start geen auto-canary voor een cold-start-release.** Een release zonder geschiedenis van productieverkeer — bijvoorbeeld een verse fine-tune tegen een gloednieuwe dataset — heeft niets om zijn output-kwaliteit tegen te vergelijken. De pipeline weigert een canary te starten op een cold-start-release. We vereisen eerst een 24-uurs shadow deployment, die de kandidaat observeert tegen echte productie-traces maar geen van zijn antwoorden serveert. Na 24 uur hebben we een kwaliteitsbasislijn; dan kan de canary doorgaan. Langzamer; eerlijk; niet configureerbaar.

## Hoe snel is het herstel, end-to-end?

Het hersteltijd-getal dat we publiceren is **12 seconden**. Dat is in-flight drain op een ~100-replica service. De manifest-swap zelf is sub-seconde. Om nuttig te zijn voor een lezer, moet die 12 seconden worden uitgesplitst:

- **0–60 seconden voor rollback:** de drie opeenvolgende sub-threshold-metingen komen binnen. De eerste sub-threshold-meting start de lockout-timer. Elke volgende minuut verlengt de lockout als de kwaliteit nog steeds onder drempel zit.
- **t = 0:** de derde sub-threshold-meting schrijft naar `CanaryHealthSample`. De rollback-worker observeert de derde strike en dispatcht `/activate previous_release`.
- **t < 1 seconde:** de actieve-release-pointer van de routeringslaag (in Redis) flipt. Nieuwe requests gaan naar de vorige release.
- **t = 1 tot ~12 seconden:** de kandidaat-release blijft requests serveren die in vlucht waren toen de swap plaatsvond. In-flight drain. Sommige streaming-responses doen er 8–10 seconden over om natuurlijk te voltooien, dus de opruim-staart is ongeveer 12s op een typische service.
- **t ≈ 13 seconden:** het audit log-ontvangstbewijs wordt geschreven en ondertekend. De melding vuurt.

Vergeleken met de openbare postmortems die we steeds als ankers aanhalen: Cloudflare's juni 2022-storing<sup><a href="#ref-3">[3]</a></sup> duurde 44 minuten van "we weten wat we moeten terugdraaien" tot "de revert is voltooid" — en dat was de *infrastructuur*-laag. Atlassian's april 2022-storing<sup><a href="#ref-4">[4]</a></sup> duurde 12 uur per site omdat de state was opgesplitst over meerdere systemen. De drempel voor "elite performer" van DORA<sup><a href="#ref-5">[5]</a></sup> voor herstel na een mislukte deployment is onder één uur. Twaalf seconden is geen orde van grootte beter dan de elite-drempel — het is drie ordes van grootte beter. De architecturale beslissing die dit mogelijk maakt, is het gebundelde release-manifest uit [Fase 1](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register). Zonder het manifest heb je geen enkel object om de routering naar terug te wijzen.

## Rollback-oefeningen — de onspectaculaire praktijk die niemand uitvoert

Hier is het deel dat de meeste teams overslaan: **het enige betrouwbare signaal dat je rollback-pad werkt, is dat je een opzettelijke, geplande oefening hebt uitgevoerd en bevestigd**. Elk kwartaal doen we er één. De oefening gaat zo:

1. Kies een willekeurig gepland tijdstip op een werkdag tijdens kantooruren. Vertel het team dat het eraan komt, maar niet welk specifiek uur.
2. Injecteer een synthetische kwaliteitsregressie op de canary-slice. (We hebben een test-mode flag waarmee het kandidaat-model op een magische header kan reageren met "Ik weiger te antwoorden" — gegarandeerd om de gekalibreerde judge te falen.)
3. Duw de test-release door de gate (hij slaagt — we testen de rollback, niet de gate). Start een canary.
4. Observer merkt drie sub-threshold-metingen op. Auto-rollback vuurt.
5. Wacht tot de on-call engineer reageert. Klok hoe lang ze erover doen. Noteer of ze het ontvangstbewijs genoeg vertrouwen om *niet* alarmerend terug te pagen.
6. Verifieer dat het audit log de test-mode-flag toont in het rollback-ontvangstbewijs, zodat toekomstige audits een oefening van een echt incident kunnen onderscheiden.

De eerste oefening die we deden duurde 19 seconden end-to-end (12s swap + een 7s settling-vertraging die we moesten fixen). De meest recente oefening — Q1 2026 — duurde 12 seconden. De oefening kan nooit worden overgeslagen. Elk kwartaal; elke klantcluster.

De meeste teams hebben nog nooit een opzettelijke rollback-oefening uitgevoerd. De eerste keer dat hun rollback-pad draait is tijdens een echt incident, onder druk, met meerdere mensen in het gesprek. De oefening is wat het 12-seconde-getal een echt getal maakt in plaats van een ambitieus getal.

## Wat dit niet oplost

Drie eerlijke beperkingen:

**Auto-rollback kan ping-pongen.** Als zowel de kandidaat ALS de vorige release slecht zijn — bijvoorbeeld omdat de vorige release ook een traag ontwikkelende slice-regressie had die niemand opmerkte — kan de pipeline terugrollen, vervolgens de vorige release ook zijn post-rollback observer laten falen, en is er geen derde release om naar terug te rollen. De pipeline stopt het verkeer naar een onderhoudspagina in plaats van te thrashen. De fix is om meer dan één eerdere gezonde release geïndexeerd te houden in de manifest-keten zodat het rollback-doel configureerbaar is.

**De observer voegt inferentie-kosten toe.** Het opnieuw afspelen van productie-traces door het actieve model op een 5%-steekproef voegt ongeveer 5% toe aan de inferentie-uitgaven. We denken dat dit de juiste afweging is. Sommige klanten vinden het te duur op low-margin workloads en willen het steekproefpercentage omlaag draaien. De regelknop bestaat.

**Een slechte judge is erger dan geen judge.** Als de gekalibreerde judge die de observer aandrijft zelf miscalibreerd is — afgedreven van het menselijke anker, of getraind op een verouderd corpus — kan de observer auto-rollback om de verkeerde reden activeren. De herkalibratie-cadans doet ertoe. Het stuk Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup> documenteert de procedure; de operationele vereiste is dat je hem ook daadwerkelijk uitvoert.

## FAQ

### Waarom is de rollback-trigger drie opeenvolgende minuten in plaats van één?

Omdat LLM-kwaliteitsscores een ruisvloer hebben — een enkele afwijkende minuut-meting kan voortkomen uit een steekproef-kwirk (de 5%-trace-steekproef belandde toevallig op een lastige slice), niet uit een echte regressie. De drie-minuten-lockout is de goedkoopste ruisfilter die de totale reactietijd toch onder anderhalve minuut houdt. We hebben beide kanten op afgesteld; drie is de zoete vlek voor de typische verkeersvorm van onze klanten. De dwell is per release configureerbaar als je verkeersvorm anders is.

### Zou auto-rollback configureerbaar moeten zijn naar "uit"?

In onze in-productie pipeline, nee. Het punt van een geautomatiseerd veiligheidsmechanisme is dat het werkt om 02:14 uur als niemand kijkt. Een configureerbaar-uit auto-rollback is een post-it die zegt "we hadden ooit een vangnet." Het argument om hem configureerbaar te maken, is dat sommige workloads te low-stakes zijn om false-positive rollbacks te rechtvaardigen. Wij denken dat dat argument naar de verkeerde plek leidt — als je workload te low-stakes is voor auto-rollback, heb je überhaupt geen release-pipeline nodig.

### Hoe ga je om met het geval dat de vorige release ook slecht was?

Het rollback-doel is standaard `previous_release`, maar de manifest-keten slaat meer geschiedenis op dan alleen N-1. Operators kunnen een rollback opnieuw richten op elk historisch-gezond manifest-SHA — `/api/v1/releases/<historically_good_sha>/activate` — wat het handmatige-interventiepad is wanneer de automatische N-1-rollback een slechte eerdere release raakt. De ontsnappingsklep is er. Het komt zelden voor.

### Welke metric is de juiste om te optimaliseren — MTTR of MTBF?

MTTR — Mean Time To Recovery — met grote voorsprong, in elk geval voor LLM-systemen. MTBF (Mean Time Between Failures) veronderstelt een deterministische notie van "falen" die LLM-workloads niet hebben. Output-kwaliteit drijft continu af; "falen" is een drempel-keuze. Optimaliseren voor snel herstel is robuust ten opzichte van waar je de drempel trekt; optimaliseren voor nooit falen is broos en onwaar. De elite-drempel van DORA<sup><a href="#ref-5">[5]</a></sup> is zelf in MTTR-termen geformuleerd, wat de juiste framing is.

### Voer je daadwerkelijk rollback-oefeningen uit?

Ja — elk kwartaal, gepland, met een test-mode-flag in het ontvangstbewijs zodat de oefening in het audit log van een echt incident kan worden onderscheiden. De eerste oefening die we uitvoerden onthulde een 7-seconde settling-vertraging waarvan we ons niet realiseerden dat die er was. De oefening is de enige manier om te weten dat het pad daadwerkelijk werkt; het lezen van het runbook is niet genoeg. De meeste teams hebben er nog nooit één uitgevoerd, wat de reden is dat de MTTR-getallen van de meeste teams ambitieus zijn in plaats van gemeten.

## Referenties

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge calibration.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). Het anker voor waarom een gekalibreerde judge noodzakelijk is en waarom per-slice-overeenstemming meer telt dan geaggregeerde overeenstemming. De per-minuut scoring-loop van de observer is hiervan afhankelijk.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vIndex weight-attestation.</strong> Gedocumenteerd op de <a href="/nl/compliance/">Divinci compliance-pagina</a> en doorgenomen in de <a href="/nl/blog/validating-and-releasing-custom-lms-in-regulated-fields/">gereguleerde-velden-post</a>. De `vindex_sha256_before/after`-velden in het auto-rollback-ontvangstbewijs zijn het cryptografische anker dat een auditor kan verifiëren zonder onze logs te hoeven vertrouwen.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare juni 2022-storing.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Vierenveertig minuten om terug te draaien op infrastructuur-niveau, deels omdat engineers over elkaars reverts heen liepen. Anker voor de claim dat een "manifest-gedreven swap dat faalmodel niet kan hebben."
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian april 2022-storing.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 uur per site om te herstellen, 14 dagen totaal voor 883 sites, omdat de state was opgesplitst over onafhankelijk geversioneerde systemen. Anker voor de claim dat "het gebundelde release-manifest het ding is dat seconden-niet-uren mogelijk maakt."
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>DORA failed-deployment recovery threshold.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. De "failed deployment recovery time" elite-performer-drempel is gedocumenteerd als onder één uur. Het 12-seconde pipeline-getal is drie ordes van grootte onder de elite-drempel, wat de juiste manier is om de vergelijking te lezen.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrating the AI judge.</strong> Onze companion-post <a href="/nl/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. De procedure voor het in kalibratie houden van de mens-verankerde judge over tijd. De operationele claim in deze post — dat auto-rollback alleen zo goed werkt als de judge die hem aandrijft — houdt alleen stand als de judge ook daadwerkelijk periodiek wordt geherkalibreerd.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Intern — Divinci pipeline-referentie.</strong> De architectuur waaronder deze automatiseringslaag zit: de <a href="/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">vierfasige pipeline-post</a>. Het volledige API-oppervlak is gedocumenteerd op de <a href="/nl/api/">API-referentie</a>; de release-management-sectie is de sectie waar deze post over gaat.
</li>
</ol>

---

*Volgende in deze serie:* **CI Testing for Custom Language Models in 2026.** Deze post gaat over de operationele laag tussen menselijke goedkeuringen. De volgende gaat over de laag *vóór* de pipeline begint — pre-merge CI: wat te evalueren op PR-tijd, welke soorten regressies je daadwerkelijk vóór de gate opvangt, en welke soorten niet.
