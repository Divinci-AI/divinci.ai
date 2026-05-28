+++
title = "10 CI/CD-releasefouten in custom taalmodellen — en welke pipelinefase elk ervan opvangt"
description = "Tien echte LM-release failure modes, elk gekoppeld aan de Divinci-pipelinefase — Register, Gate, Roll, Observe — die het opvangt vóór gebruikers."
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
summary = "We hebben genoeg custom-LM-releases door Divinci's vier-fasenpipeline geschoten om een lijst te hebben van de tien meest schadelijke failure modes waar we eerst telkens tegenaan liepen. Drie daarvan zijn slice-bewuste regressies die een aggregaatgate zou hebben gereleased. Twee andere zijn stille kwaliteitsdips die een canary op infrastructure-metrics zou hebben gepromoveerd. De rest is het soort fout dat elke releasepipeline geacht wordt op te vangen — we noemen ze omdat het waard is hardop te zeggen welke een aggregaat-gated pipeline daadwerkelijk wel zelf opvangt."
+++

*Notities uit de releasecyclus — Deel II*

---

De [eerste post in deze serie](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) liep door de vier-fasen-releasepipeline die we draaien — **Register → Gate → Roll → Observe**. Deze post is het bonnetje: tien specifieke failure modes die we er inmiddels mee hebben gevangen, hoe elke eruitzag in de praktijk, en welke fase van de pipeline hem heeft tegengehouden voordat hij productie raakte.

De lijst is georganiseerd per fase, niet per ernst, omdat de fase je vertelt *waar je moet investeren* als je zelf zoiets bouwt. Als je gate de zwakke schakel is, blijven zes van de tien fouten hieronder je raken. Als je observer de zwakke schakel is, raken twee ervan je in stilte — wat betekent dat het enige signaal dat je ooit krijgt een klantklacht is, en dat is het slechtst mogelijke signaal.

Een pipeline die alle tien opvangt is geen lijst features. Het is een klein aantal architecturale beslissingen die consistent worden gemaakt. Elke failure hieronder benoemt welke beslissing van toepassing is.

## Hoe lees je deze lijst

Elke failure is getagd met de fase die hem opvangt:

- **① REGISTER** — de manifestlaag. Stopt fouten waarbij je niet kon vertellen welke wijziging productie brak, omdat de state verspreid was over systemen.
- **② GATE** — Spearman per domein tegen een gekalibreerde human-anchored judge. Stopt fouten die zich verbergen in aggregaatscores.
- **③ ROLL** — canary van 5% → 25% → 100% met een kwaliteitsmonitor bij elk checkpoint. Stopt fouten die alleen op schaal verschijnen.
- **④ OBSERVE** — continue trace-replay door de kandidaat, gescoord door dezelfde judge die de gate aandreef. Stopt stille kwaliteitsdips die latency en 5xx nooit opmerken.

Elke sectie eindigt met de **fix** — de exacte configuratie die we bij Divinci leveren, plus wat je zelf moet bouwen als je ons niet gebruikt.

---

## Fase ① — Register

### 1. Model + prompt + routing in één bundel co-deployen en niet weten welke ervan het brak

**Wat er gebeurde.** We veranderden drie dingen in dezelfde release: het basismodel bumpen van Gemma 4 E2B naar Gemma 4 26B-A4B, de system prompt voor het juridisch domein aanpassen om een "cite the statute"-instructie toe te voegen, en de routing rule wijzigen die bepaalt welke traffic class welk model raakt. Accuracy op contract drafting zakte 7 punten. Geen van de drie wijzigingen was onafhankelijk getest. Het debuggen vereiste het één voor één terugdraaien van variabelen over een periode van twee dagen.

**Waarom de pipeline het nu opvangt.** Een Divinci-release is een onveranderlijk manifest dat model_ref, prompt_template_ref, routing en dataset_version bundelt tot één enkel SHA-256-geadresseerd artefact. De pipeline weigert een manifest te deployen dat meer dan één wijziging bundelt *tenzij* de SHA van de vorige release is gerefereerd als vergelijkingsbasis. Als je drie wijzigingen tegelijk wilt releasen, moet je het bevestigen in het manifest, en het failure-attributiepad blijft schoon omdat de volgende release wordt teruggedwongen naar één-variabele-per-keer.

**Fix.** Laat mensen geen releases met de hand samenstellen. Het release-manifest moet worden gegenereerd door een pipeline die *niet* stilletjes kan bundelen. Zie [Fase 1 — Register](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) voor de API.

### 2. Een system prompt in een dashboard bewerken en deployen zonder code review

**Wat er gebeurde.** Iemand tweakte de system prompt in een admin UI om "het model minder verbose te maken." Het zag eruit als een edit van één woord. De resulterende prompt was 38 karakters korter, waardoor hij onder een lengtedrempel viel die de downstream prompt-rewriter gebruikte om te bepalen of er safety boilerplate toegevoegd moest worden. Twee uur later beantwoordde het model vragen die het had moeten weigeren.

**Waarom de pipeline het nu opvangt.** Prompts maken deel uit van het geregistreerde manifest. Eentje in een dashboard bewerken betekent een nieuw manifest snijden, wat betekent een nieuwe SHA genereren, wat betekent dat de gate tegen de wijziging draait. Je kunt prompts nog steeds in een dashboard bewerken. Je kunt ze alleen niet releasen zonder dat de gate ze ziet.

**Fix.** Behandel prompts als code: versioneer ze met een content hash, registreer ze als onderdeel van de release, gate ze op de scored-QA-suite. Tianpan's *Semver Lie*-verslag<sup><a href="#ref-1">[1]</a></sup> beschrijft precies deze failure mode zoals hij in het wild voorkomt — een promptwijziging die "code review passeerde, werd gedeployed zonder eval-gates, productie raakte zonder per-user A/B en geen automatische rollback triggerde."

### 3. Training-serving preprocessing-skew

**Wat er gebeurde.** De training pipeline normaliseerde whitespace en zette een bepaald veld in lowercase. De serving pipeline deed dat niet. Zelfde model, zelfde prompt, zelfde routing — andere inputs op byteniveau. Op dev-fixtures slaagde alles. Op echt verkeer gedroeg het model zich alsof het opnieuw was getraind op luidruchtigere data, omdat het dat vanuit zijn perspectief ook was.

**Waarom de pipeline het nu opvangt.** Het manifest registreert een `preprocessing_ref` naast model_ref. De gate-evaluatie draait door dezelfde preprocessing die de productie-servingstack gebruikt. Als de twee divergeren, matchen de offline-cijfers van de gate niet langer met productie, en de per-slice Spearman zakt op een manier die meetbaar is vóór promote.

**Fix.** Containeriseer preprocessing als een geversioneerd artefact. Refereer ernaar vanuit het manifest. Weiger te deployen als de gate is berekend tegen een andere preprocessing-versie dan productie zal gebruiken.

---

## Fase ② — Gate

De vier fouten hieronder zijn de fouten die een aggregaat-score-gate zou hebben gereleased. **De reden dat een aggregaatgate ze mist is structureel, geen parameter-tuning** — middelen over slices vernietigt precies het signaal dat je zou gebruiken om een regressie te vangen die gelokaliseerd is in één slice.

### 4. De IP-licensing-collapse (slice-bewuste regressie #1)

**Wat er gebeurde.** Een QLoRA-fine-tune verbeterde de juridische Q&A-accuracy op vijf subdomeinen en crashte op IP licensing — contract drafting 0,71, statutory interpretation 0,74, case summarization 0,69, regulatory compliance 0,66, jurisdictional analysis 0,62, **IP licensing 0,41**. De aggregaat-Spearman ρ over alle zes was 0,64. De gate-drempel was 0,65. Op één enkele aggregaatscore zat de release net onder de lijn. Op de per-slice-view was één subdomein met 27 punten gecollapseerd.

**Waarom de pipeline het nu opvangt.** De drempel van de gate is per-slice, niet aggregaat. Elke enkele slice die onder zijn drempel valt markeert de release `gate_fail`, ongeacht hoe het gemiddelde eruitziet. De [gate-thresholds-chart in post #1](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) is de daadwerkelijke visualisatie die de pipeline produceert voor releases als deze.

**Fix.** Slice de gate. De slices die ertoe doen zijn de subdomeinen van je klantsegmenten, niet wat voor taxonomie er ook in het eval-framework zat dat je importeerde.

### 5. Pediatric-oncology-slice-regressie (slice-bewuste regressie #2)

**Wat er gebeurde.** Een medisch Q&A-model werd fine-tuned op extra data uit volwassen cardiologie. Aggregaat-medische-accuracy verbeterde 4 punten. Pediatric-oncology-accuracy zakte 11 punten — kennelijk had de nieuwe training data subtiel de nadruk weggehaald van pediatric dosage adjustments. De aggregaatgate zou hem hebben gepromoveerd.

**Waarom de pipeline het nu opvangt.** Pediatric oncology was een van de slices die de klant had geconfigureerd toen hij de scored-QA-suite registreerde. De Gate-2-evaluatie produceerde een per-slice Spearman ρ die zakte van 0,72 naar 0,61, onder de pediatric-oncology-drempel van 0,68. Gemarkeerd `gate_fail`. Geen deploy.

**Fix.** Door de klant gedefinieerde slices, niet platformgedefinieerde. Het platform moet de klant toestaan een slice en een per-slice-drempel toe te voegen zonder code te schrijven — omdat niemand bij Divinci de domeinrandjes van de klant zo goed kent als de klant zelf.

### 6. Multilinguale sub-language-drift (slice-bewuste regressie #3)

**Wat er gebeurde.** Een multilinguaal model werd fine-tuned om Franse responses te verbeteren. Aggregaat-Franse-accuracy verbeterde 3 punten. Binnen "Frans" presteerde het model echter nu slechter op de regionale varianten Belgisch Frans en Zwitsers Frans — het trainingscorpus had een zware Parijs-Franse focus gehad. Een aggregaat-Franse gate zou hem hebben gereleased.

**Waarom de pipeline het nu opvangt.** Locale-varianten zijn sub-slices van de taal-slice. De per-sub-slice-Spearman ving de regressie op in de Belgische variant vóór promote. De release werd teruggestuurd voor ofwel (a) meer diverse training data, ofwel (b) een force-override met een schriftelijke onderbouwing ("we accepteren de regionale regressie omdat de aggregaat-Franse verbetering belangrijker is in deze rollout") — en de override gaat het audit trail in.

**Fix.** Slice-diepte doet ertoe. "Frans" is te grof. "Belgisch Frans" is het niveau waar regressies zich daadwerkelijk verbergen.

### 7. De gate omzeilen zonder schriftelijke override-onderbouwing

**Wat er gebeurde.** Een release-window onder hoge druk. De gate faalde op één slice — niet-kritisch, in de inschatting van het team. Iemand greep naar de force-override-flag. In een eerdere versie van de pipeline was force-override één enkele boolean. De flag flipte, de release ging eruit, en drie weken later kon niemand reconstrueren wie wat had besloten over welke slice.

**Waarom de pipeline het nu opvangt.** Force-override is een gate met twee velden: `forceGateOverride: true` EN `overrideReason: "..."`. De reden is een verplichte vrije-tekststring die in het audit log wordt geschreven, naast het user-ID en het per-slice-gate-resultaat dat werd overruled. De pipeline weigert de override zonder de reden. Je kunt nog steeds overrulen — je kunt alleen niet anoniem overrulen.

**Fix.** Governance-gates zijn geen aparte fase. Ze zijn een eigenschap van de gate-fase: elke override is een ondertekend bonnetje met onderbouwingstekst.

---

## Fase ③ — Roll

### 8. In één stap van 0% naar 100% van het verkeer gaan

**Wat er gebeurde.** Een model passeerde de gate netjes. Het werd onmiddellijk naar 100% van het verkeer gepusht. Door een eigenaardigheid van conversatielengte timeoutte het nieuwe model op responses langer dan ~2.400 tokens — gedrag dat niet naar boven kwam op de 100-vragen-evaluatieset van de gate omdat elke testprompt kort was. 15% van de gebruikers kreeg 18 minuten lang een timeout voordat iemand handmatig terugrolde.

**Waarom de pipeline het nu opvangt.** De Roll-fase houdt vast op 5% voor `dwell_5pct_seconds` (default 240) OF `requests_5pct` (default 1.000), afhankelijk van wat *later* is. Op 5% traffic komen de timeouts op lange gesprekken binnen ~3 minuten naar boven in de 5xx-rate-monitor. De pipeline weigert voorbij 5% te gaan als een checkpoint-monitor zijn band overschrijdt. Mean time tot halt was 4 minuten; mean time tot volledige rollback was ongeveer 12 seconden na halt.

**Fix.** Canary in drie stappen met een *kwaliteits*monitor, niet alleen latency en 5xx. Het "vijf procent in twintig seconden en we zijn klaar"-patroon is het gevaarlijke. Het vijf-procent-voor-vier-minuten-patroon is het veilige.

---

## Fase ④ — Observe

De twee fouten hieronder zijn de fouten die een canary op infrastructure-metrics zou hebben gepromoveerd. **De reden dat infrastructure-metrics ze missen is ook structureel** — latency en 5xx kunnen perfect schoon blijven terwijl het model stilletjes hedgt, weigert of hallucineert.

### 9. Stilletjes hedgen op juridische queries (stille kwaliteitsdip #1)

**Wat er gebeurde.** Een safety-tuned model-update maakte de juridisch-domeinassistent merkbaar conservatiever. Zelfde latency, zelfde 5xx rate, zelfde tokengebruik. Maar waar de vorige versie "de verjaringstermijn is X jaar" had geantwoord, zei de nieuwe versie "je zou een advocaat moeten raadplegen." Klanten merkten het binnen uren. De dashboards bewogen nooit.

**Waarom de pipeline het nu opvangt.** De Fase 4-observer draait continue replay van productietraces door het actieve model en scoort ze met dezelfde gekalibreerde judge die ook Gate-2 aandreef. Hedgen komt onmiddellijk naar boven omdat de gekalibreerde judge — verankerd aan menselijke ratings van hoe een "goed" juridisch antwoord eruitziet — weigering-wanneer-een-antwoord-werd-verwacht bestraft. De output-quality-monitor zakte drie opeenvolgende minuten onder zijn band en de pipeline rolde automatisch terug. Totale verstreken tijd: onder de vijf minuten.

**Fix.** Bewaak niet alleen latency en 5xx. Bewaak een *kwaliteits*score afgeleid van een gekalibreerde judge tegen echte productietraces. SageMaker's deployment guardrails<sup><a href="#ref-2">[2]</a></sup> doen auto-rollback op CloudWatch-alarms — nuttig voor infrastructuur, maar het alarm moet vuren op een metric, en "model is aan het hedgen" is geen metric die CloudWatch ziet.

### 10. Gehallucineerde datums na een fine-tune (stille kwaliteitsdip #2)

**Wat er gebeurde.** Een fine-tune van een scheduling-assistent begon zelfverzekerd datums in te voegen die niet in de input voorkwamen. "Je meeting is op donderdag 32 maart." Latency onveranderd. 5xx rate onveranderd. De hallucinaties passeerden het safety filter omdat niets "32 maart" markeerde als schadelijk — alleen onmogelijk.

**Waarom de pipeline het nu opvangt.** De gekalibreerde judge van de observer — draaiend op echte productie-scheduling-traces, niet synthetische — geeft zelfverzekerd-maar-foute antwoorden een slechtere score dan passende "ik weet het niet"-weigeringen. De hallucinatie-klassedip triggerde de per-minuut-drempel van de observer binnen twee minuten. Auto-rollback vuurde.

**Fix.** Een judge die gekalibreerd is tegen domeinexpertise. Generieke LLM-as-judge mist "donderdag 32 maart" op dezelfde manier als mensen die scannen het missen. Domein-gekalibreerde judges — verankerd tegen ratings van domeinexperts — missen het niet.

---

## De 10 fouten gemapt op de pipeline

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrix die de tien failure modes mapt op de vier pipelinefases. Fase 1 Register vangt fouten 1 (co-deployed wijzigingen), 2 (ongeversioneerde prompts) en 3 (training-serving skew). Fase 2 Gate vangt fouten 4 (IP-licensing-slice-regressie), 5 (pediatric-oncology-slice-regressie), 6 (multilinguale sub-language-drift) en 7 (omzeilen van de gate zonder override-onderbouwing). Fase 3 Roll vangt fout 8 (één-staps-rollout). Fase 4 Observe vangt fouten 9 (stilletjes hedgen) en 10 (gehallucineerde datums).">
<title>Failure modes per pipelinefase</title>
<rect width="900" height="420" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Waar elke fout wordt opgevangen</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Drie slice-bewuste regressies landen bij Gate. Twee stille kwaliteitsdips landen bij Observe. De rest verdeelt zich over Register en Roll.</text>
<g>
<rect x="40" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="140" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">① REGISTER</text>
<rect x="250" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="350" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">② GATE</text>
<rect x="460" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="560" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">③ ROLL</text>
<rect x="670" y="90" width="200" height="40" fill="#2d5a4f" rx="6"/>
<text x="770" y="116" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">④ OBSERVE</text>
</g>
<g>
<rect x="40" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="163" font-size="11" font-weight="700" fill="#1e3a2b">1. Co-deployed wijzigingen</text>
<text x="50" y="178" font-size="10" fill="#6b5d4f">model + prompt + routing</text>
<text x="50" y="191" font-size="10" fill="#6b5d4f">stilletjes gebundeld</text>
<rect x="40" y="210" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="228" font-size="11" font-weight="700" fill="#1e3a2b">2. Ongeversioneerde prompts</text>
<text x="50" y="243" font-size="10" fill="#6b5d4f">dashboard-edit</text>
<text x="50" y="256" font-size="10" fill="#6b5d4f">omzeilt de gate</text>
<rect x="40" y="275" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="293" font-size="11" font-weight="700" fill="#1e3a2b">3. Training-serving skew</text>
<text x="50" y="308" font-size="10" fill="#6b5d4f">preprocessing divergeert</text>
<text x="50" y="321" font-size="10" fill="#6b5d4f">tussen offline + online</text>
</g>
<g>
<rect x="250" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="163" font-size="11" font-weight="700" fill="#a04848">4. IP-licensing-slice</text>
<text x="260" y="178" font-size="10" fill="#6b5d4f">slice 0,41, aggregaat 0,64</text>
<text x="260" y="191" font-size="10" fill="#6b5d4f">aggregaat zou releasen</text>
<rect x="250" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="228" font-size="11" font-weight="700" fill="#a04848">5. Pediatric oncology</text>
<text x="260" y="243" font-size="10" fill="#6b5d4f">slice zakt 11 punten</text>
<text x="260" y="256" font-size="10" fill="#6b5d4f">aggregaat zou releasen</text>
<rect x="250" y="275" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="293" font-size="11" font-weight="700" fill="#a04848">6. Multilinguale sub-drift</text>
<text x="260" y="308" font-size="10" fill="#6b5d4f">Belgisch Frans regresseert</text>
<text x="260" y="321" font-size="10" fill="#6b5d4f">aggregaat zou releasen</text>
<rect x="250" y="340" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="260" y="358" font-size="11" font-weight="700" fill="#1e3a2b">7. Override-bypass</text>
<text x="260" y="373" font-size="10" fill="#6b5d4f">vereist schriftelijke</text>
<text x="260" y="386" font-size="10" fill="#6b5d4f">onderbouwing + audit-entry</text>
</g>
<g>
<rect x="460" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="470" y="163" font-size="11" font-weight="700" fill="#1e3a2b">8. 0% → 100% rollout</text>
<text x="470" y="178" font-size="10" fill="#6b5d4f">geen checkpoint-dwell</text>
<text x="470" y="191" font-size="10" fill="#6b5d4f">long-tail-bugs op schaal</text>
</g>
<g>
<rect x="670" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="163" font-size="11" font-weight="700" fill="#a04848">9. Stilletjes hedgen</text>
<text x="680" y="178" font-size="10" fill="#6b5d4f">latency + 5xx onveranderd</text>
<text x="680" y="191" font-size="10" fill="#6b5d4f">judge vangt het op</text>
<rect x="670" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="228" font-size="11" font-weight="700" fill="#a04848">10. Gehallucineerde datums</text>
<text x="680" y="243" font-size="10" fill="#6b5d4f">"32 maart"</text>
<text x="680" y="256" font-size="10" fill="#6b5d4f">domein-judge vangt het op</text>
</g>
</svg>
</figure>

De balken die rood zijn gekleurd, zijn de fouten die we vonden *terwijl* we deze pipeline aan het releasen waren — ze zijn de reden waarom we uiteindelijk specifiek de slice-bewuste gate en de trace-replay-observer hebben gebouwd, in plaats van een generieke canary met infra-metrics te releasen zoals iedereen het doet.

## Wat maakt LLM-CI/CD anders dan software-CI/CD?

De korte versie: een LLM-release is geen deterministisch artefact. Dezelfde prompt produceert verschillende outputs over runs. Dezelfde evaluatieset produceert verschillende scores over hardware. Hetzelfde model kan een aggregaat-kwaliteitscheck passeren terwijl het stilletjes faalt op een slice die je niet in de eval hebt opgenomen. De meeste aannames waarop traditionele CI/CD is gebouwd, overleven het contact met een probabilistisch systeem niet.

Drie concrete consequenties:

1. **Je kunt geen `expect(output).toEqual(X)`-asserties schrijven.** Je hebt een distributie-bewuste evaluatie nodig die rangcorrelatie consumeert tegen een human-anchored grader, geen gelijkheid tegen een fixture.
2. **Een "CI geslaagd"-model kan gebroken gedrag releasen.** Het slagen van CI betekent dat de code draait. Het betekent niet dat het model klopt. De releasepipeline moet een *kwaliteits*gate afdwingen bovenop de *correctheids*gate die CI levert.
3. **Rollback is niet optioneel en niet langzaam.** Omdat failure modes probabilistisch zijn — en omdat sommige ervan stil zijn op de infrastructuurlaag — moet het rollbackpad primaire infrastructuur zijn, geen backupplan. Het release-manifest bestaat specifiek om rollback atomisch te maken.

De eerste post in deze serie beschrijft de vier-fasenarchitectuur die op deze consequenties antwoordt. Deze post beschrijft de fouten die het opvangt.

## Hoe bouw je een failure-bestendige CI/CD-pipeline voor custom LM's?

Het eerlijke antwoord: je accepteert dat fouten zullen gebeuren, en je minimaliseert de tijd tussen *het optreden van een failure* en *productie-verkeer terugkeert naar een bekend-goede versie*. De vier-fasenpipeline hierboven is een specifieke implementatie van dat principe, maar het principe zelf is wat ertoe doet.

Als je Divinci niet gebruikt en iets equivalents wilt bouwen, zijn de dragende stukken:

- **Een onveranderlijk release-manifest** dat model + prompt + routing + dataset + preprocessing bundelt in één SHA. Dit is wat 1, 2 en 3 vangbaar maakt. ([Fase 1](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register))
- **Een per-slice-gate** met drempels gedefinieerd door domeineigenaren, niet platformeigenaren. Dit is wat 4, 5, 6 vangbaar maakt. ([Fase 2](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate))
- **Een canary met kwaliteitsmonitoring bij elk checkpoint**, niet alleen latency en 5xx. Dit is wat 8 vangbaar maakt en wat 9 en 10 *overleefbaar* maakt zodra ze productie raken. ([Fase 3](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-3-roll))
- **Een continue observer** die echte productietraces door het actieve model scoort met dezelfde gekalibreerde judge die de gate aandreef. Dit is wat 9 en 10 vangbaar maakt. ([Fase 4](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-4-observe-rollback-and-the-receipt))
- **Een ondertekend audit-bewijs voor elke beslissing.** Hash-chained, extern verankerbaar. Voor open-weights-modelbackings bedt het bewijs een [vindex-weight-attestation](/nl/compliance/) in die bewijst dat de actieve gewichten zijn wat het manifest registreerde. Voor closed-API-backings dekt het bewijs de beslissingsketen maar kan het geen weight-provenance claimen — en het audit trail zegt dat expliciet.

De stukken zijn individueel niet nieuw. Elk MLOps-platform heeft er een of twee van. De combinatie — slice-bewuste gate + productie-trace-observer + atomische rollback + bewijsbaar bonnetje — is het deel dat niemand anders in 2026 levert.

## Waar je hierna naartoe kunt

- De begeleidende post — **[Een LLM-CI/CD-pipeline bouwen met Divinci AI](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)** — behandelt de architectuur en de API.
- De **[compliancepagina](/nl/compliance/)** documenteert het vindex-bewijsformaat dat onder elke release-beslissing zit en hoe het in kaart wordt gebracht op de EU AI Act, GDPR Artikel 17, HIPAA en NIST AI RMF.
- De **[AutoRAG-productpagina](/nl/autorag/)** behandelt de RAG-zijdige hallucinatiereductie die natuurlijk samengaat met de gekalibreerde judge die Gate-2 en de Fase-4-observer aandrijft.
- De **[API-referentie](/nl/api/)** — elk commando dat in deze serie wordt gerefereerd is een echt endpoint.

## FAQ

### Wat is de meest voorkomende CI/CD-failure voor custom language models?

Over alle releases die we hebben uitgerold is de meest schadelijke failure **een slice-aware regressie die een aggregate gate passeert** — een model dat gemiddeld verbetert maar stilletjes instort op een specifiek subdomein (failures 4, 5 en 6 hierboven). Het komt vaker voor dan ontbrekende rollback, vaker dan prompt drift, en is moeilijker te detecteren dan beide. De fix is structureel, geen parameter-tuning: gate per slice, niet op het gemiddelde.

### Hoe snel moet je een slechte LLM-release kunnen terugdraaien?

In de orde van seconden, niet minuten. De gemiddelde rollback-tijd op de Divinci-pipeline is ongeveer 12 seconden — dat is in-flight request drain op een service met ~100 replicas, niet de manifest-swap zelf, die sub-seconde is. De architecturale beslissing die dit mogelijk maakt is het gebundelde release-manifest: omdat elke component (weights, prompt, routing, dataset) wordt gerefereerd vanuit één SHA, is de rollback een enkele atomaire re-point. Vergelijk dit met publieke postmortems: het incident van Cloudflare in juni 2022<sup><a href="#ref-3">[3]</a></sup> kostte 44 minuten om terug te draaien omdat engineers over elkaars reverts heen stapten; de Atlassian-storing van april 2022<sup><a href="#ref-4">[4]</a></sup> kostte 12 uur per getroffen site om te herstellen omdat de state over meerdere systemen verspreid lag.

### Waarom veroorzaken prompt-wijzigingen zoveel productiestoringen?

Omdat prompts routinematig buiten de CI/CD-pipeline om worden bewerkt — in dashboards, in admin-UI's, soms door mensen zonder engineering-review. Ze worden behandeld als configuratie, maar gedragen zich als code. Een wijziging van 38 tekens aan een system prompt kan downstream model-gedrag meer veranderen dan een model-retraining. De fix is om prompts te registreren als onderdeel van het release-manifest en ze dezelfde gate te laten passeren als het model.

### Hoe detecteer je stille kwaliteitsdegradatie in LLM-output?

Niet met infrastructuurmetrieken. Latency, 5xx-rate en tokengebruik vangen hedging, weigering-wanneer-een-antwoord-verwacht-werd of gehallucineerde datums niet op. Het detectiesignaal moet komen uit een *kwaliteits*score die wordt berekend door een gekalibreerde judge tegen daadwerkelijke productietraces. De Fase-4-observer in de Divinci-pipeline speelt een rollende sample van productietraces opnieuw af door het actieve model, scoort ze met dezelfde human-anchored Spearman-judge die Gate-2 aandreef, en triggert automatische rollback wanneer de kwaliteitsscore drie minuten achter elkaar onder de drempelwaarde zakt.

### Welke audit trail-eisen gelden voor AI-modeldeployments?

De EU AI Act, GDPR Artikel 17 (recht op vergetelheid), HIPAA en het NIST AI Risk Management Framework eisen allemaal dat organisaties records bijhouden van modelversies, evaluatieresultaten, goedkeuringsbeslissingen en rollouts. De impliciete eis onder alle vier is dat de records *verifieerbaar* moeten zijn — auditable betekent meer dan "we hebben een log." Divinci's vindex-receipts zijn hash-chained en extern anchorbaar, wat betekent dat een auditor de keten kan verifiëren zonder onze logs te vertrouwen. Voor open-weights modelbackings sluit het receipt ook een weight-attestation in; voor closed-API backings noteert het receipt expliciet dat weight provenance niet wordt geclaimd.

## Referenties

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (april 2026). Benoemt de failure mode van de dashboard-prompt-edit direct. Bijbehorend: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a>. De standaard infrastructure-metric-gedreven auto-rollback. Nuttige vergelijking voor wat Fase 4 Observe anders doet (kwaliteitsscore, geen CloudWatch-alarms).
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. 44 minuten om terug te draaien omdat engineers over elkaars reverts heen stapten. Gerefereerd als het "rollback is een eigen soort incident"-anker.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. 12 uur per site om te herstellen. State-verspreid-over-systemen-failure-mode in zijn ergste vorm.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. De "failed deployment recovery time"-drempel voor elite performers is gedocumenteerd als onder één uur. Nuttige framing voor "hoe snel is snel genoeg" op rollback.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">Zheng et al., <em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (arXiv:2306.05685, 2023). De referentie voor waarom LLM-as-judge in z'n geheel kan matchen met human ratings maar breed kan variëren per categorie — wat precies het patroon is dat per-slice-gating noodzakelijk maakt.
  </li>
</ol>

---

*Volgende in deze serie:* **Custom LM's valideren en releasen in gereguleerde domeinen.** De pipeline hierboven is de architectuur. Het compliancepad is de praktijk van het gebruik ervan. EU AI Act, GDPR Artikel 17, HIPAA en NIST AI RMF — wat elk van een releaseproces vraagt, en welke vindex-bewijsvelden welke eis afdekken.
