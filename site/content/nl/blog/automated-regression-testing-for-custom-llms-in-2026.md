+++
title = "Geautomatiseerde regressietests voor custom LLM's in 2026"
description = "Een regressie-suite die drift opspoort in de eval, niet alleen in het model. Slice-bewuste gates, gekalibreerde judges, replay van productie-traces."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-regression-testing-for-custom-llms-in-2026-hero.webp"
reading_time = 13
summary = "De meeste LLM-'regressies' zijn drift in de evaluatie-suite zelf — judge-kalibratie, slice-dekking, prompt-template, retrieval-index. Hier is de suite die die drift opvangt, per slice gescoord met een gekalibreerde judge en herspeeld tegen live productie-traces."
+++

*Notities uit de releasecyclus — deel 7*

Vrijdagmiddag om 16:47 uur heb je een prompt-aanpassing van één teken uitgerold. De geaggregeerde evaluatiescore bewoog van 0,873 naar 0,871 — ruim binnen de ruisbodem. Maandagochtend staat je supportwachtrij in brand over een klasse queries waar je al zes maanden niet meer naar keek omdat ze stabiel waren.

Niets in het model is geregresseerd. Het model is hetzelfde model. **De evaluatie is onder je vandaan gedreven.** Zes maanden van langzame groei in één klantsegment haalden nooit de golden dataset, de judge-prompt werd voor het laatst in oktober gekalibreerd tegen mensen, en de retrieval-index is afgelopen woensdag stilletjes opnieuw opgebouwd op een vernieuwd embedding-model.

Dit is waar deel 6 voor waarschuwde — [het model is ruwweg één alert op de zeven het juiste antwoord](/nl/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/). Dat betekent dat je regressie-suite drift in zichzelf moet detecteren, niet alleen drift in het model. Deze post is die suite.

## Wat is regressietesten voor een custom LLM eigenlijk?

Softwareregressietests stellen `output == expected` vast voor vaste invoer. Ze werken omdat de functie deterministisch is.

Een taalmodel is geen functie in dezelfde zin. Dezelfde prompt produceert bij temperatuur > 0 een verdeling van geldige completions, en "geldig" is multidimensionaal: heeft het de vraag beantwoord, is het antwoord gegrond in de opgehaalde context, bleef het binnen de veiligheidsenvelop, kwam het binnen het latentiebudget terug. Regressietesten van een custom LLM betekent dus **de verdeling van gedrag meten tegen een bevroren basislijnverdeling** — over slices die voor jou relevant zijn, met judges die tegen mensen zijn gekalibreerd, op invoer die op je productieverkeer lijkt.

Voordat hier iets van betekenisvol is, moeten drie zaken op orde zijn:

1. Een **golden dataset** die op slice-niveau op de productie lijkt, niet in aggregaat.
2. Een **gekalibreerde judge** — niet "we gebruiken GPT-5 als judge", maar "we hebben Spearman ρ ≥ 0,7 gemeten tegen drie menselijke beoordelaars, voor het laatst vorige week vernieuwd".
3. Een **basislijn-manifest** — de exacte modelgewichten, prompt-template, retrieval-index en judge-versie die de gemeten score opleverden. Zonder dit kun je niet vaststellen of de score bewoog omdat het model veranderde of omdat de meetlat veranderde.

Divinci voert alle drie als eersteklas objecten, hash-gekoppeld, gescoord bij elke commit. De rest van deze post gaat over het samenstellen ervan.

## Waarom de meeste LLM-regressie-suites echte regressies niet opvangen

De dominante 2026-faalmodus voor custom LLM's is wat Tianpans Sigma Inference-team in hun postmortem van april 2026 de *Semver Lie* noemde<sup><a href="#ref-1">[1]</a></sup>: een geaggregeerde metric blijft vlak of verbetert, terwijl één of twee productie-slices in stilte regresseren. De slice was minder dan 5% van het verkeer toen de test werd ontworpen, dus die kwam nooit in de golden dataset; zes maanden later is het 12% van het verkeer, is het model erop achteruitgegaan, en het geaggregeerde getal zou dat nooit gaan opmerken.

We hebben elk publiek LLM-release-postmortem van de afgelopen achttien maanden bekeken en het patroon herhaalt zich: **de suite stond op groen omdat ze het verkeerde mat.** Concreet:

- De golden dataset werd door het team handmatig geschreven bij lancering en nooit opnieuw gestratificeerd tegen verschoven verkeersverdelingen.
- De LLM-als-judge-prompt werd één keer ingesteld en nooit hergekalibreerd tegen menselijke labels. De judge-overeenstemming verviel stilletjes<sup><a href="#ref-2">[2]</a></sup>.
- De basislijnscores werden opgeslagen als ruwe getallen, niet als `(model_sha, prompt_sha, judge_sha, dataset_sha, score)`-tuples — dus toen er iets regresseerde, kon niemand vertellen welke van de vier bewogen had.

Een regressie-suite die deze drie niet alle drie oplost, is gewoon een CI-stap die bij deploy op groen springt en je vals vertrouwen geeft. De oplossing is niet "meer cases". De oplossing is **slice-bewuste, versie-verankerde, judge-gekalibreerde** meting, bij elke release.

## Bouw een golden dataset die slice-bewuste analyse overleeft

De vier-emmer-samenstelling die we standaard uitleveren — productiemonsters 60%, adversarieel 15%, door experts gecureerde edge cases 15%, replay van faalgevallen 10% — is een redelijk vertrekpunt. Wat ervoor zorgt dat het regressies écht opvangt, is de **slice-metadata** die aan elke case wordt gekoppeld.

Elke vermelding in de dataset draagt: invoer, verwacht gedrag (rubric, geen exacte string), retrieval-context (indien van toepassing), en een `slice`-tag — domein, gebruikerssegment, query-intentie, taal, lengte-emmer, welke decomposities ook relevant zijn voor je product. De suite scoort **per slice**, en elke slice die onder zijn drempel zakt blokkeert de release, ook als de geaggregeerde score omhoog ging.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Samenstelling van de golden dataset: 60% productiemonster, 15% adversarieel, 15% expert-edges, 10% replays van faalgevallen, gestratificeerd over slices">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Samenstelling golden dataset — gestratificeerd per slice op elke as</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Gedimensioneerd voor ~500 cases. Balksegmenten zijn proportioneel. Per-slice-dekking is de harde eis, niet de geaggregeerde verhouding.</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">Productiemonster</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Adversarieel</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">Expert-edges</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Replays</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">gestratificeerde productie-traces · per kwartaal ververst</text>
<text x="513" y="90" text-anchor="middle">jailbreaks · injection</text>
<text x="627" y="90" text-anchor="middle">domein-edges · long tail</text>
<text x="722" y="90" text-anchor="middle">postmortem-replays ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">Elke case draagt slice-tags — de suite scoort elke combinatie apart</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">domein</tspan> · juridisch / med / algemeen</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">intentie</tspan> · how-to / feit / weigeren</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">taal</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">lengte</tspan> · kort / mid / lang</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">segment</tspan> · enterprise / SMB</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">retrieval</tspan> · grounded / open</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">tool-gebruik</tspan> · 0 / 1 / multi-step</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">noviteit</tspan> · gezien / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">samenstelling × slices = scoring-grid</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Per slice gescoord bij elke release — Spearman ρ ≥ 0,7 t.o.v. basislijn, per slice</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">Elke slice die zijn drempel overschrijdt blokkeert de release. De geaggregeerde score is uitsluitend informatief.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Diagram is structureel. Stratificatie-assen en per-slice-drempels worden per product geconfigureerd in het Divinci-release-manifest. Intern — gedefinieerd in onze eigen deployments.</figcaption>
</figure>

Twee operationele regels die we hebben geleerd af te dwingen:

**Hersamplen per kwartaal.** Productieverkeersverdelingen verschuiven sneller dan de meeste teams meten. We stratificeren de productiemonster-emmer elk kwartaal opnieuw tegen de laatste 90 dagen verkeer; als een slice voorbij 5% van het verkeer is gegroeid en minder dan 2% van de golden dataset uitmaakte, wordt die vóór de volgende release bijgevuld.

**Elke postmortem voegt een case toe.** Een regressie die de productie haalde en niet werd opgevangen, is een case die ontbrak in de dataset. Binnen 48 uur na de postmortem voegen we hem toe aan de replays-emmer en taggen we hem met de slice die hem aan het licht bracht.

## Hoe detecteer je drift voordat gebruikers dat doen?

Er bestaan vier verschillende soorten drift, en een regressie-suite die alleen de laatste in de gaten houdt is een regressie-suite die de meeste regressies mist.

| Driftsoort | Wat beweegt | Detectiesignaal | Actie |
|---|---|---|---|
| **Kwaliteitsdrift** | De judge-score voor een vaste slice | Per-slice Spearman ρ t.o.v. basislijn daalt | Release blokkeren; diagnose volgens [de boom uit deel 6](/nl/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) |
| **Dekkingsdrift** | Productieverkeersverdeling t.o.v. verdeling golden dataset | KL-divergentie tussen slice-proporties | Golden dataset hersamplen |
| **Judge-drift** | Overeenstemming judge-model met mensen | Spearman ρ t.o.v. een bevroren menselijk gelabelde auditset | Judge-prompt hergebruiken of judge vervangen |
| **Productiedrift** | Live productiescores t.o.v. offline scores op hetzelfde model | Score-gap bij replay productie-trace | Onderzoek retrieval / preprocessing / runtime |

Kwaliteitsdrift is wat de meeste suites meten; de andere drie zijn waar vrijdagmiddag-regressies zich doorgaans verschuilen. Divinci volgt alle vier tegen het basislijn-manifest, met de per-slice-score-uitsplitsing zichtbaar op elke PR en een wekelijkse judge-kalibratiejob die drift signaleert vóór die zich opstapelt.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Een 30-daagse grafiek toont de geaggregeerde task-completion-score vlak op 0,87 terwijl de medische-domeinslice stilletjes daalt van 0,88 naar 0,74">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">De Semver Lie, gevisualiseerd — 30 dagen task-completion-score</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Aggregaat (donkergroen) blijft vlak. De medische slice (rood) regresseert in stilte. Aggregaat-gates slaan nooit aan.</text>
<g transform="translate(80, 100)">
<line x1="0" y1="0" x2="0" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<line x1="0" y1="250" x2="640" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">0,95</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">0,90</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">0,85</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">0,80</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0,75</text><line x1="-4" y1="200" x2="0" y2="200" stroke="#1e3a2b"/>
<text x="-10" y="254" text-anchor="end">0,70</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="0" y="268" text-anchor="middle">d-30</text>
<text x="160" y="268" text-anchor="middle">d-22</text>
<text x="320" y="268" text-anchor="middle">d-15</text>
<text x="480" y="268" text-anchor="middle">d-7</text>
<text x="640" y="268" text-anchor="middle">vandaag</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">drempel aggregaat-gate — 0,89</text>
<polyline points="0,40 50,42 100,38 150,40 200,42 250,38 300,40 350,38 400,40 450,42 500,38 550,40 600,42 640,40" fill="none" stroke="#5a7a8f" stroke-width="2"/>
<circle cx="640" cy="40" r="4" fill="#5a7a8f"/>
<polyline points="0,60 50,58 100,62 150,60 200,58 250,60 300,62 350,60 400,58 450,60 500,62 550,60 600,58 640,60" fill="none" stroke="#2d5a4f" stroke-width="3.5"/>
<circle cx="640" cy="60" r="5" fill="#2d5a4f"/>
<polyline points="0,72 50,74 100,70 150,72 200,76 250,72 300,74 350,72 400,70 450,72 500,74 550,72 600,76 640,74" fill="none" stroke="#7a8a4a" stroke-width="2"/>
<circle cx="640" cy="74" r="4" fill="#7a8a4a"/>
<polyline points="0,64 50,68 100,66 150,72 200,80 250,92 300,108 350,128 400,150 450,168 500,184 550,196 600,206 640,214" fill="none" stroke="#a04848" stroke-width="3.5"/>
<circle cx="640" cy="214" r="5" fill="#a04848"/>
<g font-family="'DM Sans', sans-serif" font-size="11">
<rect x="656" y="30" width="120" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="2"/>
<text x="664" y="46" font-weight="700" fill="#5a7a8f">juridische slice</text>
<text x="722" y="46" fill="#5a7a8f">0,910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">aggregaat</text>
<text x="722" y="72" fill="#2d5a4f">0,872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">algemeen</text>
<text x="722" y="98" fill="#7a8a4a">0,863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">medische slice</text>
<text x="664" y="232" fill="#a04848">0,743 vandaag · breuk ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">slice-gate zou hier afgaan ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Gestileerde reconstructie van het Tianpan Sigma-postmortem-patroon<sup><a href="#ref-1">[1]</a></sup> met interne Divinci-slice-nomenclatuur. Specifieke waarden zijn illustratief.</figcaption>
</figure>

## Multidimensionale evaluatie — scoor vier dingen tegelijk, per slice

Eén samengestelde score is een slechter signaal dan vier scalaire scores. We gaten op vier dimensies:

- **Task completion** — heeft de respons de vraag echt beantwoord, beoordeeld door een gekalibreerde judge tegen een rubric. Slice-bewust.
- **Faithfulness** — voor elke respons die naar opgehaalde context verwees, is elke bewering daarin gegrond. Hallucinatie komt hier als eerste tevoorschijn.
- **Veiligheid** — correctheid van weigeringen, jailbreak-weerstand, blootstelling van PII / beleid. Vrijwel altijd op gate ≥ 0,99 slagingspercentage; veiligheid is een harde muur, geen zachte trade-off.
- **Latentiebudget** — p95 binnen de SLA van de slice. Een prompt-wijziging die de tokens-per-respons verdubbelde is een regressie, ook als de kwaliteit omhoogging.

Elke dimensie heeft zijn eigen per-slice-basislijn en zijn eigen per-slice-drempel. We combineren ze bij de gate nooit tot één gewogen scalair; we tonen ze als vier scores per slice en blokkeren op die welke als eerste zijn drempel overschreed. Een model dat 4 punten task completion won ten koste van 1 punt faithfulness op de medische slice is nog steeds een regressie.

## Welke gates moeten een custom-LLM-deployment blokkeren?

We draaien een drielaagse architectuur, waarbij elke laag een andere fase van de pijplijn gate't ([zie deel 1 voor de fasetaxonomie](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)).

**Laag 1 — Smoke (elke commit, ~90 seconden).** Twintig tot dertig kritieke cases getrokken uit de slices met de grootste impact. Vangt catastrofale regressies op vóór de volledige suite rekencapaciteit uitgeeft. Als smoke faalt, draait de rest niet.

**Laag 2 — Volledige suite (elke PR, ~12 minuten).** De complete golden dataset, gescoord per slice op alle vier de dimensies. Slice-bewuste Spearman ρ tegen het basislijn-manifest. Drempeloverschrijding blokkeert de merge. De PR-comment somt precies op welke slice op welke dimensie hoeveel bewoog, met vijf voorbeelden van falende cases.

**Laag 3 — Basislijnvergelijking (release-candidates, ~25 minuten).** Het kandidaatmodel wordt herspeeld tegen de laatste 14 dagen aan productie-traces — de *closed-loop production-trace replay* die we in [deel 1](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) hebben uitgeleverd. Dezelfde gekalibreerde judge die de golden dataset scoort, scoort ook de replay-outputs. Elke slice waarvan de herspeelde scores meer dan zijn drempel afwijken van de offline scores blokkeert de release. Deze laag vangt drift op die de golden dataset nog niet kent.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Drielaagse gate-beslisboom: smoke-tests bij elke commit, volledige suite bij elke PR, replay van productie-trace bij release-candidates">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Drielaagse regressie-gate — elk blok faalt snel, elke laag voegt diepte toe</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① Smoke · elke commit</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: 20–30 kritieke</text>
<text x="14" y="82">Doorlooptijd: ~90 s</text>
<text x="14" y="102">Dim: alleen task + safety</text>
<text x="14" y="122">Slices: top 3 op volume</text>
<text x="14" y="148" font-weight="600">Blokkeert:</text>
<text x="14" y="168">catastrofale faalgevallen</text>
<text x="14" y="186">misvormde outputs</text>
<text x="14" y="204">breuken in safety-muur</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">fail-fast — volledige suite</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② Volledige suite · elke PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: volledig ~500</text>
<text x="14" y="82">Doorlooptijd: ~12 min</text>
<text x="14" y="102">Dim: task / faith / safety / lat</text>
<text x="14" y="122">Slices: alle gestratificeerd</text>
<text x="14" y="148" font-weight="600">Blokkeert:</text>
<text x="14" y="168">per-slice ρ &lt; 0,7</text>
<text x="14" y="188">elke slice-metric onder thr</text>
<text x="14" y="208">judge-overeenstemming &lt; 0,65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">PR-comment somt op welke</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ Replay · release-candidates</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: 14d live traces</text>
<text x="14" y="82">Doorlooptijd: ~25 min</text>
<text x="14" y="102">Dim: alle vier · slice-bewust</text>
<text x="14" y="122">Bron: productie-trace-store</text>
<text x="14" y="148" font-weight="600">Blokkeert:</text>
<text x="14" y="168">gap offline ↔ replay-score</text>
<text x="14" y="188">drift in slices die nog niet</text>
<text x="14" y="206">in de golden dataset zitten</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">laatste gate vóór uitrol</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">Alle drie lagen scoren tegen hetzelfde basislijn-manifest — (model_sha, prompt_sha, retrieval_sha, judge_sha) — dus een bewegende score identificeert <tspan font-weight="600" fill="#1e3a2b">welke</tspan> dimensie dreef, niet alleen <tspan font-weight="600" fill="#1e3a2b">dát</tspan> er iets dreef.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Doorlooptijden zijn intern — gemeten op Divinci's productie-CI-runners voor een representatieve klant met ~500 golden-dataset-cases en ~14 dagen productie-traces.</figcaption>
</figure>

## Kalibreer je judge voordat je één enkele score vertrouwt die hij produceert

LLM-als-judge is wat dit alles voorbij een paar honderd cases laat opschalen. Het is ook waar een regressie-suite stilletjes ophoudt te werken, omdat de judge geen verplichting heeft om gekalibreerd te blijven naarmate hij wordt geüpdatet of naarmate je dataverdeling verschuift.

We kalibreren elke judge-prompt tegen een bevroren menselijk gelabelde auditset van minimaal 100 cases, gestratificeerd over dezelfde slices als de golden dataset, en we draaien de kalibratie wekelijks opnieuw. De drempel waarop we uitleveren is **Spearman ρ ≥ 0,7** tegen de mediaan van menselijke beoordelaars, met **Cohen's κ ≥ 0,6** op binaire safety-oordelen. Beide liggen boven de drempel waarop is aangetoond dat MT-Bench-achtige judges menselijke beoordelaars volgen op het niveau van interhumane overeenstemming<sup><a href="#ref-2">[2]</a></sup>.

Wanneer de wekelijkse kalibratie onder de drempel zakt, wordt de judge automatisch uit dienst gesteld en wordt de dienstdoende eval-engineer gepaged. De release-pijplijn houdt kandidaten open in plaats van ze te gate'en op een judge die niet langer meet wat hij vroeger mat.

```bash
# Run the weekly judge calibration job
curl -X POST https://api.divinci.ai/v1/regression/judges/calibrate \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "judge_id":     "rubric-v7",
    "audit_set":    "human-labels-2026-04",
    "min_spearman": 0.70,
    "min_kappa":    0.60,
    "on_fail":      "retire_judge_and_page"
  }'
```

## De Divinci-differentiator — closed-loop replay van productie-traces

De gate van laag 3 is het deel dat de meeste regressie-suites niet hebben. De flow is dezelfde flow die we in deel 1 hebben uitgeleverd, met één specialisatie voor regressietesten: van elke release-candidate wordt zijn score op de offline golden dataset slice voor slice vergeleken met zijn score op een 14-daags venster van herspeelde productie-traces. De golden dataset meet wat we verwachtten dat het model zou doen. De replay meet wat het model vorige week feitelijk zou hebben gedaan.

Wanneer die twee scores meer dan het per-slice-gap-budget uit elkaar lopen, wordt de release geblokkeerd. De mismatch is het signaal: ofwel de golden dataset is niet langer representatief (dekkingsdrift), ofwel de kandidaat gedraagt zich anders op traces gevormd door productie-preprocessing en -retrieval (productiedrift). Hoe dan ook kom je het eerder te weten dan je gebruikers.

De judge die de offline run scoort, is dezelfde judge die de replay-run scoort. De audit-log registreert beide score-sets, beide judge-versies, de trace-ID's die herspeeld zijn en de gap die het blok afvuurde. De gap zelf is het bruikbaarste diagnostische signaal dat we hebben en is wat aan degene wordt overgedragen die vervolgens [de diagnoseboom uit deel 6](/nl/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) oppakt.

## Veranker de golden dataset met een vIndex-receipt

Elke score in de suite is zinloos als je hem later niet kunt reproduceren. We hashen de golden dataset bij elke release en koppelen die hash in een vIndex-receipt aan de model-SHA, prompt-SHA, judge-SHA en het kalibratiedossier. Het receipt is extern verankerbaar — auditors kunnen onze exacte regressie-run zes maanden later opnieuw uitvoeren en de scores die we claimden verifiëren.

```json
{
  "release_id": "rel_3f1a-2026-05-26",
  "model": { "sha": "0c1f9…", "weights_uri": "r2://models/custom-v7.2", "open_weights": true },
  "prompt": { "sha": "c4a8e…", "template_id": "support-v3.4" },
  "retrieval": { "index_sha": "b21f0…", "embedder": "e5-mistral-7b-instruct" },
  "judge": { "sha": "d8e21…", "rubric_id": "rubric-v7", "spearman_vs_humans": 0.74 },
  "dataset": { "sha": "a90b1…", "n": 512, "slices": 17, "stratified_at": "2026-04-30" },
  "scores": { "aggregate": 0.872, "by_slice": { "/* … */": "/* per-slice scalars */" } },
  "replay": { "trace_window_days": 14, "n_traces": 8430, "max_gap": 0.018 },
  "vindex_anchor": "sha256:f0bfd2…",
  "verifiable_at": "https://vIndex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**Voorbehoud open weights.** Het bovenstaande receipt draagt gewichtsherkomst alleen wanneer het model open-weights is — vIndex verankert dan de daadwerkelijke gewichts-bytes. Voor closed-API-modelbackings (OpenAI / Anthropic / Google managed models) draagt het receipt nog steeds de beslissingsketen — elke gate-score, elk judge-resultaat, het kalibratiedossier — maar het gewichtsveld is leeg en je kunt het modelartefact niet onafhankelijk verifiëren. We zeggen dit in het receipt en in de [compliance-documentatie](/nl/compliance/) zodat auditors geen verkeerde indruk krijgen. De releases die het meest profiteren van een volledige vIndex-keten zijn die waarbij je de gewichten in eigen beheer hebt.

## Een vierfasen-implementatietijdlijn die we daadwerkelijk hebben uitgeleverd

Teams die proberen de volledige architectuur in week één uit te leveren, lopen vast op tooling. De volgorde hieronder is de volgorde die werkt.

**Fase 1 — Basislijn (week 1).** Trek een gestratificeerd monster uit de laatste 30 dagen productie-traces. Laat twee engineers elk 100 cases op task completion handmatig labelen. Bereken de interrater-overeenstemming (doel Cohen's κ ≥ 0,6). Het getal dat eruit komt is je startende human-baseline; al het andere wordt hiertegen gekalibreerd.

**Fase 2 — Harness (weken 2–3).** Zet de evaluatie-harness op met de 100-case-dataset. Voeg een gekalibreerde judge toe tegen je menselijke labels. Verifieer dat de harness de menselijke scores binnen ρ ≥ 0,7 reproduceert. De meeste teams ontdekken dat hun eerste judge-prompt hier doorvalt en herschrijven hem twee keer — dat is normaal.

**Fase 3 — Gates (weken 3–4).** Sluit de harness aan op CI als waarschuwing, niet als blokkade. Houd het twee weken in de gaten. De drempels die je ontdekt door false-positive-percentages te observeren, zijn de enige drempels die overleven. Promoveer pas tot blokkering wanneer het false-positive-percentage onder de 5% ligt.

**Fase 4 — Replay-loop (doorlopend).** Zodra gates betrouwbaar blokkeren, schakel je de replay-laag voor productie-traces in. Hier komt het slice-dekkingsgat aan het oppervlak en hier voegt elke postmortem cases terug toe aan de golden dataset.

## Wat dit niet oplost

Drie eerlijke beperkingen, zoals we ze in elke post in deze serie hebben gekaderd.

1. **Suite-drift is eindeloos werk.** Regressietesten is infrastructuur, geen project. De golden dataset moet elk kwartaal opnieuw worden gestratificeerd, de judge moet elke week opnieuw worden gekalibreerd, de drempelbudgetten moeten na elke postmortem opnieuw worden afgesteld. Er is geen versie waarin je een suite uitlevert en wegloopt.
2. **Een perfect gekalibreerde judge is nog altijd een model.** Spearman ρ = 0,74 tegen menselijke beoordelaars betekent dat ruwweg een kwart van de judge-oordelen afwijkt van de menselijke mediaan. Dat resterende meningsverschil is de ruisbodem op elke score. We tonen het expliciet in elk releaserapport; teams die vergeten dat het er is, worden er uiteindelijk door verrast.
3. **Closed-API-backings beperken hoeveel je kunt verifiëren.** Met een closed-API-model meet de regressie-suite gedrag maar kan ze gewichtsherkomst niet verifiëren. Als je volledige reproduceerbaarheid nodig hebt — gereguleerde sectoren, geauditede deployments — zit de trade-off op de modelkeuze, niet op de suite.

## Wat komt hierna

Deel 8, het laatste in deze serie, sluit de loop aan de binnenkant van CI. Waar deze post en deel 5 gingen over wat er bij de gates draait, gaat de volgende over de CI-laag die de kandidaten produceert die de gates überhaupt scoren — pre-merge-evaluatie, contract-tests voor prompt-templates, en hoe je de CI-vloot dimensioneert voor een 12-minuten-evaluatie-suite zonder het budget op te blazen. Het is de engineering-laag onder alles waarover we tot nu toe hebben geschreven.

## FAQ

**Wat is het verschil tussen LLM-evaluatie en LLM-regressietesten?**

Evaluatie meet of een model op een tijdstip een kwaliteitsdrempel haalt, tegen een absolute rubric. Regressietesten meet of een kandidaat zich gedraagt zoals een bevroren basislijn, per slice, over meerdere dimensies. De basislijn is wat het regressietesten maakt — Divinci levert beide, en de regressie-modus pint (model_sha, prompt_sha, judge_sha, dataset_sha) vast, zodat een bewogen score identificeert welke invoer bewoog.

**Hoeveel cases moet een golden dataset bevatten?**

Minder dan je denkt, beter gestratificeerd dan je denkt. We hebben bruikbare regressiedekking uitgeleverd met 200 cases op vijf goed gedefinieerde slices en datasets van 5.000 cases gezien die alles misten wat ertoe deed omdat ze ongestratificeerd waren. Begin bij 200, gestratificeerd, en laat vervolgens de replay-emmer case voor case groeien vanuit postmortems.

**Moet ik menselijke reviewers gebruiken of LLM-als-judge?**

Allebei, met mensen die de judge kalibreren. Mensen kunnen het volume dat een release-cyclus-CI-gate moet scoren niet bijhouden. De judge vult het volume, de mensen kalibreren de judge — wekelijks gemeten met Spearman ρ ≥ 0,7. Beide afzonderlijk is een faalmodus.

**Hoe test ik op niet-deterministische outputs?**

Scoor de verdeling, niet de string. Scoor met een rubric die de judge kan toepassen over formuleringen heen, en draai elke invoer drie tot vijf keer op temperatuur > 0, zodat de slice-bewuste score over een verdeling van completions gaat in plaats van over één enkele sample. Verstrak de temperatuur alleen voor cases die echt deterministische output nodig hebben (gestructureerde-output-tool-calls, classificatie).

**Welke metrics moet ik prioriteren voor de eerste CI-kwaliteitsgate?**

Task completion en één safety-gate. Beide per slice. Meer dimensies toevoegen voordat de eerste twee gekalibreerd zijn, levert ruis op; teams die meer uitleveren, gate'en uiteindelijk meestal op de ruis. Voeg faithfulness daarna toe wanneer je retrieval aanzet; voeg latentie toe zodra de eerste twee stabiel zijn.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 april 2026. De benoemde 2026-faalmodus voor slice-bewuste regressie-analyse; geaggregeerde scores blijven vlak terwijl een slice met laag volume in stilte regresseert.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Empirisch bewijs dat sterke LLM-judges het op open taken eens zijn met menselijke beoordelaars op ongeveer interhumane-overeenstemmingsniveaus (≈ 80%), met gerapporteerde faalmodi die kalibreer-tegen-mensen-audits ontworpen zijn om op te sporen.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. Het fundamentele resultaat over catastrofaal vergeten in fijngestelde neurale netwerken — waarom een fijngesteld custom LLM moet worden regressie-getest op algeheel capaciteitsverlies, niet alleen op winst op de doeltaak.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> Het closed-API-contrast: gates op infrastructuur-metrics (latentie, errors, CPU) in plaats van op per-slice semantische kwaliteit.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. De rangcorrelatiecoëfficiënt die de slice-bewuste gate verankert — robuust tegen scoring-schaal-drift in de judge, wat de eigenschap was die we nodig hadden.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> De cross-industriële basislijn voor "hoe vaak veroorzaken deploys incidenten" en "hoe snel herstel je". Regressie-suites die bij de gate blokkeren verlagen de eerste metric; instant rollback ([deel 5](/nl/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) verlaagt de tweede.
  </li>
</ol>
