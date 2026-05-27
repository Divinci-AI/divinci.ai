+++
title = "Hoe diagnosticeer je QA-storingen in custom LLM's in 7 stappen"
description = "De meeste 'QA-storingen' zijn geen modelstoringen — het zijn lacunes in eval-dekking, mis-kalibratie van de judge of training-serving skew. Een 7-staps diagnose die de zes niet-model-oorzaken uitsluit voordat het model de schuld krijgt."
date = 2026-05-31T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["QA", "Diagnostics", "Postmortems", "LLM Ops", "Evaluation", "Debugging"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-diagnose-custom-llm-qa-failures-in-7-steps-veo31.webm"
hero_video_poster = "/images/how-to-diagnose-custom-llm-qa-failures-in-7-steps-hero-poster.webp"
reading_time = 11
summary = "Wanneer een QA-alert afgaat op een custom LLM, is de natuurlijke reflex om het model de schuld te geven. Over de uitrolprojecten die we hebben begeleid, blijkt het model ongeveer één op de zeven keer het juiste antwoord te zijn. De andere zes keer zit de bug in de eval, de judge, de prompt-SHA, de preprocessing-pijplijn, de datasetversie of de retrieval-index. Deze post is de diagnostische boom die we daadwerkelijk doorlopen — op volgorde, met de exacte API-call die elke vertakking beantwoordt."
+++

*Notities uit de Release-cyclus — Deel VI*

---

Een scored-QA-suite begon het medische Q&A-model van een klant te markeren. Het kopcijfer — geaggregeerde kwaliteit over alle slices — daalde van de ene op de andere dag met 6 punten. Het team besteedde twee dagen aan het debuggen van het model. Ze draaiden fine-tunes opnieuw. Ze rolden terug naar de vorige release. De cijfers bewogen niet.

Op de ochtend van dag drie merkte iemand op dat de eval-suite was bijgewerkt in dezelfde nacht dat de regressie begon. Drie nieuwe prompts over pediatrische dosering waren toegevoegd aan de testset, en het model had pediatrische dosering nog nooit in training gezien. De "QA-storing" was geen modelregressie. Het was een slice-dekkingsgebeurtenis: de eval begon iets te vragen wat het model nooit had hoeven weten.

Over onze klant-uitrolprojecten is dit het dominante patroon. **Een "QA-storings"-alert is het symptoom. De oorzaak is het model ongeveer één op de zeven keer.** De andere zes keer zit de bug ergens upstream: in het eval-ontwerp, in de judge-kalibratie, in de prompt-SHA, in de preprocessing-pijplijn, in de datasetversie of in de retrieval-index. Elk van deze klassen van bugs ziet er identiek uit vanuit het alert — een getal ging omlaag — maar heeft een volledig andere oplossing.

Deze post is de diagnostische boom die we op volgorde doorlopen wanneer een alert afgaat. Zes stappen die niet-model-oorzaken uitsluiten, voordat de zevende stap het model zelf overweegt. Elke stap heeft een concrete API-call of query die hem beantwoordt. Tegen de tijd dat je de zes hebt voltooid, weet je ofwel precies wat je moet repareren, of je hebt het recht verdiend om naar het model te kijken.

## De beslisboom

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Diagnostische beslisboom voor een QA-storings-alert. Stap 1 vraagt of de eval deze slice dekt (zo niet, dan is het alert een eval-dekkingslacune). Stap 2 vraagt of de judge gekalibreerd is tegen mensen op deze slice (zo niet, dan is het alert judge-miskalibratie). Stap 3 vraagt of de prompt-template-SHA overeenkomt met productie (zo niet, dan is het alert prompt-drift). Stap 4 vraagt of preprocessing overeenkomt met productie (zo niet, dan is het alert training-serving skew). Stap 5 vraagt of de dataset-SHA overeenkomt met productie (zo niet, dan is het alert dataset-drift). Stap 6 vraagt of de retrieval-indexversie overeenkomt met productie (zo niet, dan is het alert RAG-index-drift). Pas nadat alle zes een niet-model-oorzaak uitsluiten, concludeert stap 7 dat dit daadwerkelijk een per-slice modelregressie is.">
<title>De 7-staps diagnostische boom</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Wanneer een QA-alert afgaat, loop naar beneden — niet naar binnen</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">Zes stappen sluiten niet-model-oorzaken uit. Alleen de zevende geeft het model de schuld.</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  QA-alert gaat af</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">Dekt de eval deze slice?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ zo NEE: eval-dekkingslacune. Werk de suite bij, hertest.</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">Is de judge gekalibreerd tegen mensen op deze slice?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ zo NEE: judge-miskalibratie. Herkalibreer ρ. Her-evalueer.</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">Komt de prompt-template-SHA overeen met productie?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ zo NEE: prompt-drift. Registreer het manifest opnieuw.</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">Komt de preprocessing-pijplijn overeen met productie?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ zo NEE: training-serving skew. Bind preprocess-SHA.</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">Komt de dataset-SHA overeen met productie?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ zo NEE: dataset-drift. Registreer opnieuw met juiste SHA.</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">Retrieval-index-SHA overeen?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ zo NEE: RAG-index-drift.</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">Als alle 6 slagen:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">echte per-slice modelregressie.</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">Commit. Rollback. Hertrain.</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">Empirisch is het model</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">het juiste antwoord</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">bij ongeveer 1 op 7 alerts.</text>
</svg>
</figure>

De boom is sequentieel omdat de stappen lopen van goedkoop naar duur. Stap 1 is een `git diff` van de eval-suite; stap 7 is een fine-tune-cyclus. Je wilt tien minuten besteden aan elk van de zes goedkope checks voordat je een week besteedt aan de dure.

## Stap 1 — Dekte de eval deze slice?

**Het symptoom.** Geaggregeerde kwaliteit daalt, maar de per-slice-uitsplitsing toont dat één slice instort terwijl de andere vlak zijn. Of — verwarrender — *elke* slice daalt licht, allemaal met vergelijkbare hoeveelheden.

**De diagnose.** Diff de eval-suite-manifest-SHA tegen die van de vorige release. Als de eval-suite veranderde en je het model niet veranderde, zit de regressie in de eval, niet in het model.

```bash
# Vergelijk de eval-suite-manifest-SHA tussen releases
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# Verschillend? Je eval is veranderd. Audit wat is toegevoegd.
```

**De oplossing.** Ofwel draai de eval-suite-wijziging terug (als die onbedoeld was), ofwel breid de trainingsdekking uit om overeen te komen met de nieuwe eval (als de nieuwe slice een echte productiezorg is). Lever geen modelregressie-fix voor een eval-dekkingsprobleem — je maakt het model slechter op waar het daadwerkelijk goed in was.

**Waar dit zich verbergt in onze pijplijn.** [Fase 1 — Register](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) bindt de eval-suite-SHA in het release-manifest. De bovenstaande diagnose is gewoon het diffen van twee manifesten. De reden dat de bug het medische-Q&A-team twee dagen kostte, is dat ze geen manifest-niveau diff hadden — ze vergeleken model-checkpoints, niet release-manifesten.

## Stap 2 — Is de judge gekalibreerd tegen mensen op deze slice?

**Het symptoom.** Een slice die *nieuw* is in de eval-suite scoort slecht, maar menselijke beoordeling van de outputs van het model op die slice beoordeelt ze als prima. De judge denkt dat het model faalt; mensen niet.

**De diagnose.** Bereken Spearman ρ tussen de beoordelingen van de LLM-judge en een kleine menselijk beoordeelde steekproef (50 items) op de falende slice. Als ρ &lt; 0.4, *meet* de judge niet wat mensen meten op deze slice.

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**De oplossing.** Ofwel kies een ander judge-model voor deze slice, ofwel gebruik een chain-of-judges met een arbiter. MT-Bench<sup><a href="#ref-1">[1]</a></sup> laat zien dat GPT-4-as-judge gemiddeld in &gt;80% van de gevallen overeenstemt met mensen, maar met per-categorie variantie van 86% (coderen) tot 36–44% (schrijven/menswetenschappen). De variantie is het werkzame getal; "gemiddeld goed" verbergt slices waar de judge ernaast zit.

**Waar dit zich verbergt in onze pijplijn.** [Fase 2 — Gate](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) eist per slice een gekalibreerde judge. De post [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/) documenteert de procedure. Als de slice aan de eval is toegevoegd zonder een kalibratiestap, heb je een structureel onbetrouwbare gate.

## Stap 3 — Komt de prompt-template-SHA overeen met productie?

**Het symptoom.** Kwaliteit daalt, maar de model_ref en dataset_ref zijn ongewijzigd. Niets aan de training is veranderd. Het model is hetzelfde model. En toch.

**De diagnose.** Vergelijk de `prompt_template_ref`-SHA in het falende release-manifest met die van de vorige release. Een bewerking van 38 tekens aan een system prompt die "beknoptheid verbetert" kan downstream-gedrag meer veranderen dan een volledige hertraining.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# Verschillend? Trek de diff. Bekijk hem zorgvuldig.
```

**De oplossing.** Behandel prompts als code. De [10 release failures-post](/nl/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) behandelt de dashboard-edit-faalmodus — Tianpan's *Semver Lie*-postmortem<sup><a href="#ref-2">[2]</a></sup> noemt dit als het dominante faalpatroon van 2026. Als je kunt bewijzen dat de prompt veranderde, heb je je bug gevonden.

## Stap 4 — Komt de preprocessing-pijplijn overeen met productie?

**Het symptoom.** Model slaagt lokaal voor de eval. Hetzelfde model faalt voor dezelfde eval in productie. Zelfde model_ref, zelfde prompt, zelfde dataset.

**De diagnose.** Trek de `preprocessing_ref`-SHA uit het productie-manifest en verifieer dat de eval is uitgevoerd met dezelfde. Het klassieke geval: training normaliseert witruimte en zet om naar kleine letters; productie niet. De eval liep door de productie-preprocessing; alles checkte. Totdat iemand preprocessing aan slechts één kant updatete.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# Vergelijk met de preprocessing die je trainings/eval-harness daadwerkelijk gebruikte.
```

**De oplossing.** Containeriseer preprocessing als een geversioneerd artefact. Refereer ernaar vanuit het manifest. Weiger te deployen als de preprocessing-SHA van de gate verschilt van die van productie.

## Stap 5 — Komt de dataset-SHA overeen met productie?

**Het symptoom.** Gate-eval-scores van de falende release verschillen van gate-eval-scores van *hetzelfde* model de dag ervoor.

**De diagnose.** Diff het `dataset_version`-veld tussen de twee releases. De eval-suite hield dezelfde naam, maar de dataset-inhoud werd bijgewerkt en opnieuw getagd. Zelfde naam, andere SHA, andere scores.

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**De oplossing.** Content-hash je datasets. De datasetnaam is geen versie; de SHA is dat.

## Stap 6 — Komt de retrieval-index-SHA overeen met productie?

**Het symptoom.** Alleen voor RAG-workloads. Kwaliteit daalt op vragen die afhankelijk zijn van opgehaalde context. Vragen die direct beantwoord worden, zijn ongewijzigd.

**De diagnose.** Trek de `retrieval_index_ref`-SHA uit het manifest. Vergelijk met de retrieval-index van de gate-evaluatie. De RAG-index werd 's nachts bijgewerkt (een verse ingestion-run); de gate-evaluatie cachte een oudere retrieval; de productie-canary gebruikte de nieuwe.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**De oplossing.** Bind de retrieval-index-SHA in het manifest, precies zoals we preprocessing binden. De geautomatiseerde index-rotatiecadans van [AutoRAG](/nl/autorag/) maakt dit extra de moeite waard om te controleren — de index *zal* zich op je bijwerken, of je dat nu hebt geautoriseerd of niet, als je hem niet pinnt.

## Stap 7 — Eindelijk het model zelf

Zes stappen verder. De eval dekt de slice. De judge is gekalibreerd. De prompt-SHA komt overeen. De preprocessing komt overeen. De dataset komt overeen. De retrieval-index komt overeen.

Nu — en alleen nu — heb je het recht verdiend om naar het model te kijken.

De diagnose voor deze stap is een per-slice Spearman-vergelijking tegen de vorige release, waarbij beide releases worden geëvalueerd tegen *dezelfde* manifest-vastgepinde dataset, preprocessing en retrieval. Het getal dat je produceert is een schoon signaal: een echte per-slice regressie, zonder upstream verstorende factoren.

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

Als de delta een echte regressie bevestigt: [auto-rollback](/nl/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) gaat af (als je hem niet al handmatig hebt aangeroepen), en het falende model wordt hertraind tegen een uitgebreid slice-dekkingscorpus. Als de gate die deze release promoveerde de slice in de eerste plaats miste, [is de gate ook de bug](/nl/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — capability 4 ontbreekt in je release-pijplijn.

## Hoe de verdeling er werkelijk uitziet

De "1 op 7"-framing van eerder was geen retorisch middel. Het is ongeveer de verdeling die we zien over klant-uitrolprojecten. Van elke zeven QA-alerts:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Cirkeldiagram van de root-cause-verdeling voor QA-alerts. Eval-dekkingslacune is verantwoordelijk voor ongeveer 32 procent. Judge-miskalibratie ongeveer 18 procent. Prompt-drift ongeveer 16 procent. Preprocessing-skew ongeveer 12 procent. Dataset-drift ongeveer 7 procent. RAG-index-drift ongeveer 5 procent. Echte modelregressie ongeveer 10 procent. Interne observatie over klant-uitrolprojecten; niet van een gecontroleerde benchmark.">
<title>Verdeling van root causes van QA-alerts</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Waar de bug daadwerkelijk zat — over klant-uitrolprojecten</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Interne observatie, geen gecontroleerde benchmark. Het model is het juiste antwoord ongeveer één op de zeven alerts.</text>
<g transform="translate(220, 230)">
<path d="M 0 -120 A 120 120 0 0 1 113.7 -38.3 L 0 0 Z" fill="#2d5a4f"/>
<path d="M 113.7 -38.3 A 120 120 0 0 1 88.3 81.4 L 0 0 Z" fill="#7a9580"/>
<path d="M 88.3 81.4 A 120 120 0 0 1 -29.7 116.3 L 0 0 Z" fill="#b8a080"/>
<path d="M -29.7 116.3 A 120 120 0 0 1 -113.7 -38.3 L 0 0 Z" fill="#c87b3c"/>
<path d="M -113.7 -38.3 A 120 120 0 0 1 -101.1 -64.7 L 0 0 Z" fill="#d4c8b0"/>
<path d="M -101.1 -64.7 A 120 120 0 0 1 -75.6 -93.2 L 0 0 Z" fill="#a04848"/>
<path d="M -75.6 -93.2 A 120 120 0 0 1 0 -120 L 0 0 Z" fill="#1e3a2b"/>
</g>
<g font-size="11" fill="#1e3a2b">
<rect x="500" y="100" width="14" height="14" fill="#2d5a4f"/>
<text x="522" y="112" font-weight="600">1.  Eval-dekkingslacune</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  Judge-miskalibratie</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  Prompt-drift</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  Preprocessing-skew</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  Echte modelregressie</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  Dataset-drift</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  RAG-index-drift</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">Stappen 1+2 alleen zijn samen verantwoordelijk voor de helft van de alerts. Loop de eval voordat je het model loopt.</text>
</svg>
</figure>

De twee grootste slices zijn *eval-dekkingslacune* en *judge-miskalibratie*. Samen zijn ze verantwoordelijk voor de helft van de QA-alerts. Geen van beide is een modelprobleem. Het zijn beide problemen met hoe je het model meet.

## Wat dit niet oplost

Drie eerlijke beperkingen:

**De verdeling is van ons, niet van jou.** De bovenstaande percentages komen uit ons klantencohort en de tooling van onze pijplijn. Als je een ander soort workload uitvoert — zwaar multi-modaal, zwaar agent-georkestreerd, zwaar single-shot generatief — zal je verdeling er anders uitzien. De diagnostische volgorde zou nog steeds moeten standhouden; de getallen achter elke stap niet.

**De "eval-dekkingslacune" van stap 1 is het moeilijkst op te lossen.** Het toevoegen van de ontbrekende slice aan je trainingscorpus, het bouwen van een gekalibreerde judge ervoor, en het opnieuw uitvoeren van de canary is op zichzelf een project van meerdere weken. De diagnose is snel; de remediatie niet.

**Een echte regressie kan op een niet-model-bug rijden.** De gevallen waarin je *zowel* een prompt-drift ALS een echte modelregressie hebt, zijn de ergste, omdat stap 3 de prompt-drift vindt, je hem repareert, en het alert opnieuw afgaat. De diagnostische volgorde in deze post handelt ze af, maar voegt verstreken tijd toe. Er is geen shortcut voor "de bug zat op twee plaatsen tegelijk."

## FAQ

### Waarom produceert mijn LLM verschillende outputs voor vergelijkbare prompts?

Prompt-gevoeligheid is echt, maar het is niet altijd de *oorzaak* van een QA-alert — soms is het een *symptoom* van een upstream-bug. Loop de diagnose. Als de prompt-template-SHA overeenkomt en de preprocessing overeenkomt en de dataset overeenkomt, dan ja — het model heeft brede variantie op deze slice en je hebt een meer deterministisch decodeerpad of een andere judge nodig. Als er iets upstream is veranderd, repareer dat eerst.

### Hoe vaak moet je je LLM-benchmarks opnieuw evalueren?

Her-evalueer de benchmark-*inhoud* elke keer dat de vorm van het verkeer van een productie-slice betekenisvol verandert. Her-evalueer de *judge-kalibratie* van de benchmark minstens elk kwartaal — judge-modellen driften sneller dan je zou denken. De grootste bron van valse QA-alerts is een benchmark die voor het laatst 18 maanden geleden is gevalideerd en nu iets meet wat je productie niet meer doet.

### Wat veroorzaakt hallucinaties in custom language models?

Hallucinaties hebben meerdere upstream-oorzaken — retrieval-storingen (stap 6 in de boom hierboven), trainingsdekkingslacunes (stap 1, indirect), en decodeerpad-problemen (een echte modelzorg in stap 7). [AutoRAG](/nl/autorag/) adresseert de retrieval-zijde-oorzaken door de retrieval-index in het release-manifest te binden en bij elke release opnieuw vast te pinnen. De andere twee vereisen pijplijnbrede fixes upstream van het model.

### Hoe weet je of je trainingsdata het probleem is?

Als de dataset-SHA in de falende release overeenkomt met de dataset-SHA in de vorige goede release (stap 5 van de boom), is de data niet de *directe* oorzaak. Als ze verschillen, heb je hem gevonden. De moeilijkere vraag — "is de dataset *volledig* voor onze productie-slice-dekking?" — is wat stap 1 test. Een dataset die volledig is voor de eval, maar onvolledig voor productieverkeer, is een slice-dekkingsprobleem.

### Kun je QA-storingen oplossen zonder het hele model te hertrainen?

Ja — zes op de zeven keer is de oplossing geen hertraining. Stappen 1–6 in de boom hebben fixes die het model niet raken: werk de eval bij, herkalibreer de judge, registreer de prompt-SHA opnieuw, repareer preprocessing, pin de dataset opnieuw vast, of pin de retrieval-index opnieuw vast. Hertraining is stap 7, de duurste fix, gereserveerd voor echte modelregressies. Het [audit trail](/nl/compliance/) van de release-pijplijn laat je deze upstream-fixes doen met dezelfde provenance-discipline die je zou gebruiken voor een modelwijziging.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement with per-category variance from coding (86%) down to writing (36–44%). Anchor for step 2 — why judge calibration has to be measured per slice rather than assumed from a published headline number.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). The dominant 2026 failure-mode writeup. Names dashboard-edit prompt drift as the most-cited cause of production LLM incidents. Anchor for step 3.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — Measure function.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>. The "Measure" function explicitly covers benchmark-validity and evaluation-coverage as part of governance, not as a separate engineering concern. Cited as the institutional anchor for treating eval design as the first diagnostic step.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — retrieval-augmented generation evaluation.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). The reference framework for RAG-side evaluation. Anchor for step 6 — separating retrieval failures from generation failures requires a RAG-aware eval discipline.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — root-cause distribution across customer rollouts.</strong> The percentages in the pie chart are our internal observation across Divinci customer rollouts, not from a controlled benchmark. Your distribution will vary by workload type, fine-tune cadence, and team discipline. The relative ordering (steps 1–2 dominating) is stable across the cohort we've measured; the exact percentages are not portable to your environment without your own data.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The four-stage release pipeline.</strong> <a href="/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Each diagnostic step in this post corresponds to a manifest field bound at Stage 1 — Register. Without the manifest discipline upstream, the diagnostic loses its grip; you can't diff what you didn't bind.
</li>
</ol>

---

*Volgende in deze serie:* **Automated Regression Testing for Custom LLMs in 2026.** Deze post gaat over diagnose nadat een QA-alert is afgegaan. De volgende gaat over de regressie-test-discipline die het alert in de eerste plaats heeft veroorzaakt — wat je in de eval moet stoppen, hoe je hem eerlijk houdt, en wat te doen wanneer de regressietest begint te botsen met je judge.
