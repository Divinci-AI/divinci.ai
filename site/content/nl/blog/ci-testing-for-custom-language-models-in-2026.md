+++
title = "CI-testen voor custom taalmodellen in 2026"
description = "Contracttests, smoke-budget, kostenbewuste fleet-sizing en shadow CI. Hoe je een 12-minuten evaluatiesuite hanteerbaar houdt op elke PR zonder het team af te remmen."
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "images/ci-testing-for-custom-language-models-in-2026-hero.png"
reading_time = 13
summary = "De regressiesuite uit post 7 kost echt geld om op elke PR te draaien. Zo behouden we dezelfde dekking tegen een fractie van de kosten — sub-seconde contracttests, een laag van 90 seconden smoke, embedding-cache + judge-batching, en een shadow-venster van 2 weken voordat een gate iets gaat blokkeren. De laatste post in de serie."
+++

*Notities uit de Release Cycle — Deel 8 (slot)*

Je levert de regressiesuite uit [post 7](/nl/blog/automated-regression-testing-for-custom-llms-in-2026/). Hij werkt. De slice-bewuste gates vangen echte bugs. De gekalibreerde judge houdt stand.

Dan vraagt je engineering lead hoeveel het kost om hem op elke PR te draaien. Je doet de vermenigvuldiging: ~12 minuten judge-inferentie per PR, 60 PR's per dag, vier dimensies × zeventien slices, en de rekening is echt geld. Erger: elke developer wacht nu 12 minuten op een groen vinkje voor een typo van één regel in een prompt. De velocity zakt<sup><a href="#ref-1">[1]</a></sup>, het team mort, iemand stelt voor om "de gates dan maar 's nachts te draaien" — wat precies de manier is om alles wat de gates moesten doen overboord te gooien.

De oplossing is niet minder testen. De oplossing is **gelaagd testen, waarbij het meeste signaal in de eerste negentig seconden binnenkomt.** Deze post gaat over wat onder de gate-suite draait: sub-seconde contracttests, een strakke smoke-laag, een kostenbewuste fleet, en een shadow-venster van twee weken voordat een nieuwe gate iemand blokkeert.

Dit is post 8, de laatste van deze serie. Aan het eind heb je het volledige plaatje — van de [pipeline met vier fasen](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) tot aan de contracttest-fixture die op elke commit draait.

## Wat betekent CI voor een custom taalmodel?

CI voor een custom LLM is het werk dat de gate-suite niet hoeft te herhalen. De gate scoort semantische kwaliteit; CI vangt alles wat de score van de gate betekenisloos zou maken vóórdat de gate ook maar één judge-token uitgeeft.

Contracttests draaien in milliseconden en verifiëren dat prompttemplates nog renderen, dat tool-call-schema's nog parsen, dat retrieval-indices nog antwoorden, dat het manifest nog verwijst naar hashes die daadwerkelijk bestaan. Ze zijn deterministisch, gratis, en de enige reden dat de rest van de pipeline zich kan veroorloven te bestaan. Een pull request die het prompttemplate breekt moet in 200 ms falen, niet pas na 12 minuten judge-inferentie die onzin scoort.

De contractlaag is het verschil tussen een CI-rekening die lineair schaalt met PR-volume en een die dat niet doet. De CI-runner van Divinci besteedt > 90% van zijn judge-budget aan echte semantische evaluatie, niet aan PR's die een schemacheck hadden moeten falen. Die ratio is het kerngetal.

## Waarom traditionele CI breekt voor LLM's — door de kostenlens

Posts [1](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) en [7](/nl/blog/automated-regression-testing-for-custom-llms-in-2026/) behandelden waarom deterministische CI faalt voor een generatief model. De versie van dat verhaal waar deze post over gaat, is de **kosten** van die vier eigenschappen, niet het bestaan ervan.

| Eigenschap van LLM's | Falen van traditionele CI | Kostenvorm |
|---|---|---|
| Niet-deterministische outputs | Exact-match-asserties zijn flaky | Reruns vergroten kosten lineair met flake-rate |
| Multidimensionale kwaliteit | Een enkele booleaanse waarde is oninformatief | Elke dimensie is een aparte (betaalde) judge-call |
| Provider-drift | Vastgepinde `gpt-4-2024-01-01` wordt stilletjes afgevoerd | Hercalibratie-piek wanneer een provider een checkpoint uitfaseert |
| Niet-lokale prompteffecten | Een lokale unittest kan het effect niet vangen | Distributievorm verandert tussen PR's, niet erbinnen — vereist herloop van de hele suite, niet alleen delta |

De CI-architectuur moet elk van deze betaalbaar maken. Contracttests behandelen eigenschap 1 en 3 goedkoop. Smoke-tests behandelen eigenschap 4 deels. Alleen de volledige suite behandelt eigenschap 2 — en alleen op de PR's die het daadwerkelijk nodig hebben.

## De CI-laagcake — sub-seconde tot vijfentwintig minuten

De architectuur die we leveren bestaat uit vier lagen, waarbij elke laag haar compute verdient door te vangen wat de goedkopere lagen eronder niet kunnen. De slice-bewuste framing van elke laag volgt dezelfde les die de [Tianpan Semver Lie-postmortem](/nl/blog/automated-regression-testing-for-custom-llms-in-2026/) expliciet maakte<sup><a href="#ref-4">[4]</a></sup>: aggregaatsignalen liegen; per-slice-signalen vangen wat aggregaten verbergen.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Vierlaagse CI-architectuur: contracttests sub-seconde, smoke 90s, volledige suite 12 minuten, productie-trace-replay 25 minuten">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">CI-laagcake — elke laag versmalt de trechter van PR's die de volgende bereikt</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">De meeste PR's raken alleen de bovenste twee lagen. Kosten-per-PR-cijfers zijn intern — gemeten op Divinci's productie-CI.</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① Contract · elke commit · &lt; 1 s · ~$0,00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">schema · template render · denylist · manifest-integriteit · index liveness</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% van commits</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② Smoke · elke PR · ~90 s · ~$0,05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">20–30 kritieke cases op de top 3 slices · alleen taak + veiligheid</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% van PR's</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ Volledige suite · prompt- / model- / retrieval-PR's · ~12 min · ~$0,80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500 cases · 4 dimensies · alle slices · per-slice Spearman-gates</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~22% van PR's</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ Productie-trace-replay · release-kandidaten · ~25 min · ~$2,40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">14-daags replay-venster · zelfde gekalibreerde judge · offline ↔ replay-gap-analyse</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~4% van PR's</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">Geaggregeerde kosten per PR (gewogen naar trechter): ~$0,27. Geaggregeerde p95 wall-clock: ~3,4 min.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Wall-clock per laag, kosten per laag en trechterverhoudingen zijn intern — gemeten op Divinci-productie-CI voor een representatieve klant (~500 cases in de golden dataset, 17 slices, ~60 PR's/dag).</figcaption>
</figure>

De kostenvorm is het ontwerp. ~74% van de PR's geeft nooit een judge-token uit — contract of smoke is genoeg. De PR's die wel de volledige suite bereiken, zijn die welke een prompt, een modelconfig, een retrieval-index of evaluatiecode hebben aangeraakt — precies de wijzigingen waarbij de gate-suite het enige signaal is dat het vertrouwen waard is. Release-kandidaten vormen het kleine aandeel dat laag 4 bereikt.

## Contracttests — het oneerlijke voordeel

Contracttests zijn de eerste linie, de goedkoopste linie, en de linie die de meeste teams overslaan omdat ze beneden de waardigheid van een "AI-evaluatiepipeline" lijken. Het is ook waar 30–40% van de zou-zijn-regressies daadwerkelijk faalt in de suites van onze klanten, voordat een enkele judge is aangeroepen.

De contractlaag toetst vijf dingen en niets anders:

1. **Prompttemplate-render.** Elk template rendert tegen een canonieke fixture zonder ongebonden variabelen, op hol geslagen loops of kapotte Jinja-achtige includes.
2. **Tool-call-schema.** Het argumentschema van elke gedeclareerde tool parset, de JSONSchema is geldig, en de gerenderde prompt verwijst daadwerkelijk naar alle vereiste slots.
3. **Manifest-integriteit.** Elke SHA in het release-manifest — model, prompt, retrieval-index, judge, dataset — komt overeen met een artefact dat in het register bestaat. Dangling pointers falen hier, niet drie lagen verder.
4. **Index liveness.** De retrieval-index reageert binnen het budget op een bekende query. Een herbouwde index die retrieval stilletjes heeft gebroken, komt hier aan het licht, niet in productie.
5. **Denylist & token-budget.** Elk prompttemplate dat een verboden token introduceerde, het token-budget per call oversteeg, of voorbij het contextvenster rendeerde, faalt hier. Heuristische semantische-similariteitsscoring<sup><a href="#ref-6">[6]</a></sup> is ook goedkoop genoeg om op de contractlaag te draaien voor fuzzy-match-denylist-dekking waar letterlijke string-matching tekortschiet.

```bash
# Een representatieve contracttest-aanroep — draait in ruwweg 600 ms
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

Geen van deze roept een judge aan. Geen ervan is niet-deterministisch. Geen ervan kost meetbaar geld. En elk van hen sluit een hele klasse van "de gate-suite zei dat de medische slice regresseerde"-alerts uit die anders volle 12 minuten judge-inferentie zou hebben verspild aan het scoren van output die het model überhaupt niet correct had kunnen produceren.

## De smoke-laag — 90 seconden, ~$0,05 per PR

Als de contractlaag het goedkope oneerlijke voordeel is, dan is de smoke-laag de laag die regressies daadwerkelijk vangt voor minder dan de prijs van een koffie. Twintig tot dertig cases getrokken uit de slices met het hoogste volume, gescoord op **taakvoltooiing en veiligheid alleen**, geen faithfulness, geen latentie, geen retrieval-grounded checks. Elke PR draait deze. Het duurt ongeveer 90 seconden omdat de cases in één judge-call worden gebatcht met een gestructureerd outputschema, en omdat de judge de goedkope gekalibreerde judge is — niet de volwaardige die voor release-kandidaten wordt gebruikt.

We registreren welke laag elke verzonden fix heeft gevangen in een regressielog, en het histogram is de afgelopen zes maanden consistent geweest in klantdeployments:

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Staafdiagram dat toont waar regressies worden gevangen: 31 procent op de contractlaag, 27 procent bij smoke, 28 procent bij volledige suite, 11 procent bij replay, 3 procent ontsnapt naar productie">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Waar regressies worden gevangen — per laag, afgelopen 6 maanden over klantdeployments</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">De meeste regressies sterven in de goedkoopste lagen. De dure lagen verdienen hun kosten op het restant.</text>
<g transform="translate(90, 100)">
<line x1="0" y1="200" x2="780" y2="200" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">40%</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">30%</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">20%</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">10%</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0%</text>
</g>
<g>
<rect x="40" y="45" width="120" height="155" fill="#7a8a4a" stroke="#1e3a2b" stroke-width="1"/>
<text x="100" y="36" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">31%</text>
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Contract</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1 s · $0,00</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27%</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Smoke</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90 s · $0,05</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28%</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Volledige suite</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12 min · $0,80</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11%</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Replay</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25 min · $2,40</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3%</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">Ontsnapt</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ rollback</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Rolling-zesmaandsaggregaat over actieve Divinci-CI-deployments. Gerapporteerd als het % van bevestigde regressies waar de genoemde laag de eerste was die faalde. Intern — door ons gemeten.</figcaption>
</figure>

De 3% die ontsnapt is waarom [de instant rollback van post 5](/nl/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) bestaat. De gates beloven geen nul ontsnappingen; ze beloven een strakke bovengrens en een snel herstel voor wat erdoor komt.

## CI-fleet-sizing — hoe de 12-minuten-suite goedkoop blijft

De volledige-suite-laag is waar de rekensom moet kloppen. Een naïeve implementatie roept de judge één keer aan per case-per-dimensie, draait ze sequentieel, en de rekening schaalt lineair met het aantal cases. Drie optimalisaties doen het meeste werk om hem hanteerbaar te houden:

**Embedding-cache.** De retrieval-context-fingerprint voor elke case in de golden dataset wordt gehasht; als de case niet is veranderd en de retrieval-index niet is veranderd, blijft de gecachte embedding staan en wordt de retrieval-stap overgeslagen. De hit-rate na de eerste stabiele week ligt in onze klantdeployments consistent boven de 90%.

**Judge-batching.** De gekalibreerde judge wordt aangeroepen met gestructureerde output, waarbij 8–16 cases per call worden gebatcht. De kosten per token van de judge blijven gelijk; de overhead per case daalt omdat de systeemprompt over de batch wordt geamortiseerd. De drempel voor veilig batchen wordt bepaald door de eigen gekalibreerde overeenstemming van de judge op die batchgrootte<sup><a href="#ref-2">[2]</a></sup> — we meten dit tijdens de wekelijkse judge-kalibratiepass ([post 7](/nl/blog/automated-regression-testing-for-custom-llms-in-2026/)).

**KV-cache-hergebruik over cases.** Voor modellen waar dezelfde systeemprompt en tooldefinities aan elke call vooraf gaan, wordt de KV-cache voor dat prefix één keer per suite-run berekend, niet één keer per case<sup><a href="#ref-3">[3]</a></sup>. Op open-weights-deployments is dit eenvoudig; op closed-API-modellen hangt het af van de prefix-caching-ondersteuning van de provider.

Het gecombineerde effect brengt de volledige suite ongeveer op de kostencijfers uit het laagcake-diagram hierboven. De exacte cijfers zijn intern, maar de ratio is de publieke claim: **~74% van de PR's besteedt nul judge-dollars; ~22% besteedt centen; de resterende 4% besteedt een paar dollar voor het signaal met de hoogste betrouwbaarheid vóór uitrol dat we weten te produceren.**

## Shadow CI — zet hem aan zonder het team te breken

De enige fout die we teams het vaakst hebben zien maken, is een nieuwe gate van "uit" naar "blokkerend" zetten op dag één. De drempels zijn afgesteld op data van gisteren, het percentage valse positieven is onbekend, en de eerste keer dat de gate afgaat heeft het team geen kalibratie om te beoordelen of het echt is of vals alarm. De dienstdoende eval-engineer wordt opgepiept, de gate wordt uitgeschakeld, vertrouwen is weg, het project is dood.

De oplossing is *shadow CI*: draai de nieuwe gate niet-blokkerend gedurende twee weken, post het resultaat als bot-comment op elke PR, en bekijk wekelijks het percentage valse positieven voordat je hem op blokkerend zet. De Divinci-CI-runner heeft daarvoor een `--shadow`-flag. De PR-comment ziet er hetzelfde uit als de uiteindelijke blokkerende versie — zelfde diff-weergave, zelfde per-slice-uitsplitsing — alleen blokkeert hij de merge niet.

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

Als het percentage valse positieven aanhoudend onder de 5% ligt over het venster, zetten we hem aan. Zo niet, dan scherpen we de per-slice-drempels aan, herkalibreren de judge en draaien opnieuw shadow. Hoe dan ook is het team niet overvallen door een nieuwe gate die op dag één afgaat.

## Een GitHub Actions-workflow die echt componeert

Het stuk dat de laagcake aan je bestaande CI vastknoopt, draait in `.github/workflows/llm-ci.yaml`. De lagen zijn zo bedraad dat de goedkope snel falen en de dure alleen draaien wanneer ze nodig zijn — `needs:`-ketens en path-filtered triggers doen het werk<sup><a href="#ref-5">[5]</a></sup>.

```yaml
name: LLM CI
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'config/models.yaml'
      - 'eval/**'
      - 'retrieval/**'
      - 'manifests/**'
jobs:
  contract:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci contract --manifest manifests/staging.yaml --fail-fast
  smoke:
    needs: contract
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=smoke --post-pr-comment
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
  full:
    needs: smoke
    if: contains(steps.changes.outputs.paths, 'prompts/') || contains(steps.changes.outputs.paths, 'config/models.yaml')
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=full --post-pr-comment --gate
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
```

Drie dingen om op te merken. Lagen ketenen via `needs:`, dus smoke draait niet op een kapot contract en full draait niet op kapotte smoke. De `full`-job is path-filtered op de wijzigingen die daadwerkelijk een 12-minuten-run rechtvaardigen — een typo-fix in de README triggert de gate-suite niet. De `--post-pr-comment`-flag is wat de per-slice-diff zichtbaar maakt zonder GitHub te verlaten.

## De debug-loop voor gefaalde PR's

De andere helft van "de gate is afgegaan" is "laat me zien waarom." Een regressiesuite-output van `medical slice task-completion daalde 0,04` is niet actionable zonder de cases die het veroorzaakten. We tonen de vijf ergste per-slice-diffs in de PR-comment, met de oorspronkelijke input, de baseline-output, de kandidaat-output en de redeneer-trace van de judge. De debug-loop hoort seconden te duren, geen minuten:

```bash
# Haal de 5 ergste cases op die de medical-slice-gate op deze PR lieten afgaan
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

Dit is hetzelfde diagnostisch oppervlak als de [zeven-stappenboom uit post 6](/nl/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/), aangesloten op de CI-feedback-loop. De engineer die de PR opende, ziet het bewijs op case-niveau op de PR zelf; ze hoeven geen apart eval-dashboard te openen.

## Versiebeheer-discipline — prompts, datasets, judges as code

Prompttemplates, golden datasets en judge-prompts leven allemaal in de repo, hash-gepind in het release-manifest. Het manifest is het enige object dat de suite verbindt met een specifieke reproduceerbare toestand:

```yaml
# manifests/staging.yaml — elke CI-run hasht dit
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

Als een CI-run een score post, wordt de score getagd met die manifest-hash. Wanneer een score beweegt, heeft de vraag "welke input is bewogen" een direct antwoord: diff het manifest, en de laag die afging vertelt je welke dimensie je het eerst moet bekijken. Dit is de lus die [de pipeline met vier fasen uit post 1](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) en [de vindex-receipt uit post 4](/nl/blog/validating-and-releasing-custom-lms-in-regulated-fields/) samen sluiten: het manifest is het audit-primitief waar al deze acht posts, in verschillende framings, naartoe hebben gewerkt.

## Wat dit niet oplost

Dezelfde drie eerlijke beperkingen die we in elke post van deze serie hebben geschreven.

1. **CI test niet wat niet in de suite zit.** Hoe slim de laagcake ook is, de enige regressies die hij vangt zijn die welke een case in de golden dataset zou hebben gemarkeerd. De replay-laag verzacht dit voor gedragsdrift, maar nieuwe queries die nog nooit zijn gezien ontsnappen nog steeds totdat ze in productie verschijnen. Het systeem moet worden gekoppeld aan productiemonitoring.
2. **Kostencijfers verschuiven met modelprijzen.** Elk kostencijfer in deze post hangt af van judge-tokentarieven, embedding-tarieven en inferentietarieven die per kwartaal verschuiven. De ratio's — 74% / 22% / 4%, 31% / 27% / 28% / 11% / 3% — zijn de dragende claims; de dollarcijfers zijn illustratief voor een moment in de tijd.
3. **Provider-side-checkpointwijzigingen blijven lastig.** Wanneer een closed-API-provider stilletjes het model achter een stabiele naam bijwerkt, kan de contractlaag het niet vangen; alleen de gate-suite kan dat, en pas na het feit. We verzachten dit door expliciete checkpoint-identifiers vast te pinnen waar de provider dat ondersteunt, en door de dag waarop een checkpoint wordt aangekondigd te behandelen als een triggerend event voor een volledige-suite-rebaseline. We kunnen het onderliggende probleem niet voorkomen.

## De serie afsluiten

Dit is post 8 van 8. De volledige boog:

1. [Hoe je een LLM CI/CD-pipeline bouwt met Divinci AI](/nl/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — de pipeline met vier fasen (Register / Gate / Roll / Observe) waarbinnen alles sindsdien heeft geleefd.
2. [10 CI/CD-release-fouten in custom taalmodellen](/nl/blog/10-ci-cd-release-failures-in-custom-language-models/) — de benoemde 2026-faalmodi, elk gekoppeld aan de fase die ze had moeten vangen.
3. [12 QA- en release-management-capaciteiten voor LLM's](/nl/blog/12-qa-and-release-management-capabilities-for-llms/) — de capaciteitenmatrix en het drie-kampen-Venn dat Divinci tegenover de alternatieven plaatst.
4. [Custom LM's valideren en uitrollen in gereguleerde domeinen](/nl/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — de compliance-diepteduik, regulator-naar-fase-mapping, vindex-receipts.
5. [Geautomatiseerde LLM CI/CD-pipelines met instant rollback](/nl/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — de operationele laag, automatiseringsspectrum, auto-rollback-receipt.
6. [Hoe je custom-LLM QA-fouten in 7 stappen diagnosticeert](/nl/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — de diagnostische beslisboom; het model is ongeveer één keer op de zeven alerts het juiste antwoord.
7. [Geautomatiseerd regressietesten voor custom LLM's in 2026](/nl/blog/automated-regression-testing-for-custom-llms-in-2026/) — slice-bewuste Spearman-gates, gekalibreerde judges, closed-loop productie-trace-replay.
8. **Deze post.** De CI-infrastructuur die al het bovenstaande hanteerbaar maakt op elke PR.

De stukken componeren: het [manifest](/nl/api/) is het audit-primitief, de gates vormen de veiligheidslaag, de diagnostische boom is de herstellus, de [vindex-receipt](/nl/compliance/) is het externe anker, en de laagcake is wat het geheel betaalbaar maakt om op elke commit te draaien. Als jouw custom-LLM-release-proces deze vijf niet samen heeft, dan is dat het gat waar deze acht posts over gingen.

## FAQ

**Wat is de goedkoopste test die ik op elke commit kan draaien?**

Een prompttemplate-render-check. Hij draait in milliseconden, vereist geen judge, vangt een verrassend deel van de breakages, en kost nooit een meetbare cent. Als je hem nog niet draait, is het het stukje CI met de hoogste ROI dat we kunnen aanbevelen.

**Hoeveel mag ik verwachten dat een custom-LLM-CI-pipeline kost?**

Centen per typische PR, lage eenpersoons-dollars per release-kandidaat-PR. De ratio hangt af van judge-prijsstelling en van welke fractie van je PR's prompts of modelconfig aanraakt. Het 4%-aandeel release-kandidaten hierboven is typisch; voor producten met frequente prompt-iteratie stijgt het aandeel en klimt het gemiddelde dienovereenkomstig.

**Moet ik de volledige suite op elke commit draaien?**

Nee. Path-filter op PR's die prompts, modelconfig, retrieval of eval-code aanraken. Voor alle andere wijzigingen is contract + smoke voldoende, en een wachttijd van 12 minuten op een README-typo verliest je het vertrouwen van het team binnen een sprint. De volledige suite is kostbaar; besteed hem aan wijzigingen die plausibel een kwaliteitsdimensie kunnen verschuiven.

**Hoe introduceer ik een nieuwe gate zonder iedereen te breken?**

Tweeweekse shadow-venster, niet-blokkerend. Stem drempels af op het percentage valse positieven dat tijdens de shadow wordt waargenomen. Zet pas op blokkerend wanneer het aanhoudende percentage valse positieven onder jouw tolerantie ligt (wij gebruiken 5%). Alles anders is hoe je een gate krijgt die iedereen heeft geleerd te negeren.

**Wat is het enige getal dat ik moet volgen als ik er maar één volg?**

De fractie bevestigde regressies die vóór productie wordt gevangen. Het histogram in deze post zet dat op ~97% in volwassen Divinci-deployments. De 3% die ontsnapt is waarom instant rollback bestaat. De 97% is waar de suite voor dient.

## Referenties

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — CI velocity, change-failure-rate and time-to-restore-service."</a> De cross-industry-baselines die "12 minuten per PR is te traag" tot een verdedigbare claim maken in plaats van een mening.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Het empirische bewijs dat gebatchte LLM-als-judge-calls de kalibratie kunnen behouden op de batchgroottes die in de smoke- en full-lagen worden gebruikt — de reden dat de kostencijfers in deze post haalbaar zijn.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">"Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. De KV-cache-hergebruik- en prefix-sharing-technieken die in de CI-fleet-sizing-sectie worden aangehaald.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 april 2026. De 2026 benoemde faalmodus voor aggregaat-only regressiesuites; de reden dat de CI-laagcake helemaal door slice-bewust is.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">"GitHub Actions — chaining jobs with `needs:` and conditional execution."</a> Het primitief waartegen de .yaml in deze post componeert.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">"BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. De heuristische semantische-similariteitsmetriek die wordt aangehaald als alternatief voor LLM-als-judge voor de goedkopere lagen; niet wat we draaien tijdens gate-tijd, maar nuttig in de contractlaag voor detectie van verboden frasen op schaal.
  </li>
</ol>
