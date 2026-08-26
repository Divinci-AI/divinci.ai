+++
title = "Test CI per modelli linguistici personalizzati nel 2026"
description = "Contract test, smoke budget, dimensionamento di flotta cost-aware e shadow CI. Mantenere trattabile una suite di valutazione da 12 minuti su ogni PR."
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/ci-testing-for-custom-language-models-in-2026-hero.webp"
reading_time = 13
summary = "La suite di regressione del post 7 costa soldi veri quando la esegui su ogni PR. Ecco come manteniamo la stessa copertura a una frazione del costo — contract test sotto il secondo, uno strato smoke da 90 secondi, embedding-cache + judge-batching e una finestra shadow di 2 settimane prima che qualunque gate inizi a bloccare. L'ultimo post della serie."
+++

*Note dal ciclo di release — Parte 8 (finale)*

Rilasci la suite di regressione del [post 7](/it/blog/automated-regression-testing-for-custom-llms-in-2026/). Funziona. I gate slice-aware catturano bug reali. Il judge calibrato regge.

Poi il tuo lead engineering ti chiede quanto costa eseguirla su ogni PR. Fai la moltiplicazione: ~12 minuti di inferenza del judge per PR, 60 PR al giorno, quattro dimensioni × diciassette slice, e la bolletta è denaro vero. Peggio, ogni sviluppatore sta aspettando 12 minuti per un check verde su un refuso di una riga in un prompt. La velocità crolla<sup><a href="#ref-1">[1]</a></sup>, il team brontola, qualcuno propone "facciamo girare i gate solo di notte" — che è esattamente come si rinuncia a tutto ciò che i gate dovevano fare.

La soluzione non è meno test. La soluzione è **testare a strati, con la maggior parte del segnale che arriva nei primi novanta secondi.** Questo post è ciò che gira sotto la suite di gate: contract test sotto il secondo, uno strato smoke compatto, una flotta cost-aware e una finestra shadow di due settimane prima che qualunque nuovo gate blocchi chiunque.

Questo è il post 8, l'ultimo di questa serie. Alla fine avrai il quadro completo — dalla [pipeline a quattro stadi](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) fino alla fixture di contract test che gira su ogni commit.

## Cosa significa CI per un modello linguistico personalizzato?

CI per un LLM personalizzato è il lavoro che la suite di gate non deve ripetere. Il gate misura la qualità semantica; la CI cattura tutto ciò che renderebbe insignificante il punteggio del gate prima che il gate spenda un singolo token del judge.

I contract test girano in millisecondi e verificano che i template di prompt si renderizzino ancora, che gli schemi di tool-call si parsino ancora, che gli indici di retrieval rispondano ancora, che il manifest faccia ancora riferimento a hash che esistono davvero. Sono deterministici, gratuiti e l'unica ragione per cui il resto della pipeline può permettersi di esistere. Una pull request che rompe il template di prompt dovrebbe fallire in 200 ms, non dopo 12 minuti di inferenza del judge che valuta sciocchezze.

Lo strato contract è la differenza tra una bolletta CI che scala linearmente con il volume di PR e una che non lo fa. Il runner CI di Divinci spende > 90% del suo budget judge in vera valutazione semantica, non in PR che sarebbero fallite a un controllo di schema. Quel rapporto è il numero chiave.

## Perché la CI tradizionale si rompe per gli LLM — attraverso la lente del costo

I post [1](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) e [7](/it/blog/automated-regression-testing-for-custom-llms-in-2026/) hanno coperto perché la CI deterministica fallisce per un modello generativo. La versione di quella storia di cui parla questo post è il **costo** di quelle quattro proprietà, non la loro esistenza.

| Proprietà degli LLM | Fallimento della CI tradizionale | Forma del costo |
|---|---|---|
| Output non deterministici | Le asserzioni di exact-match diventano flaky | I re-run amplificano il costo linearmente con il tasso di flakiness |
| Qualità multidimensionale | Un singolo booleano è poco informativo | Ogni dimensione è una chiamata al judge separata (e a pagamento) |
| Drift del provider | Un `gpt-4-2024-01-01` pinnato viene ritirato silenziosamente | Burst di ricalibrazione quando un provider dismette un checkpoint |
| Effetti non locali dei prompt | Lo unit test locale non può catturare l'effetto | I cambiamenti di forma della distribuzione avvengono tra PR, non al loro interno — serve un re-run dell'intera suite, non del delta |

L'architettura CI deve rendere ciascuno di questi punti sostenibile. I contract test gestiscono le proprietà 1 e 3 a basso costo. Gli smoke test gestiscono parzialmente la proprietà 4. Solo la suite completa gestisce la proprietà 2 — e solo sulle PR che ne hanno effettivamente bisogno.

## La torta a strati della CI — dal sotto-secondo ai venticinque minuti

L'architettura che rilasciamo è composta da quattro strati, ciascuno dei quali si guadagna il proprio compute catturando ciò che gli strati più economici sotto non possono. L'inquadramento slice-aware di ogni strato segue la stessa lezione resa esplicita dal [postmortem Tianpan Semver Lie](/it/blog/automated-regression-testing-for-custom-llms-in-2026/)<sup><a href="#ref-4">[4]</a></sup>: i segnali aggregati mentono; i segnali per slice catturano ciò che gli aggregati nascondono.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Architettura CI a quattro strati: contract test sotto il secondo, smoke 90s, suite completa 12 minuti, replay di trace di produzione 25 minuti">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Torta a strati CI — ogni strato restringe l'imbuto delle PR che raggiungono il successivo</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">La maggior parte delle PR tocca solo i due strati superiori. Le cifre di costo per PR sono interne — misurate sulla CI di produzione di Divinci.</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① Contract · ogni commit · &lt; 1 s · ~$0,00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">schema · render del template · denylist · integrità del manifest · liveness dell'indice</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% dei commit</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② Smoke · ogni PR · ~90 s · ~$0,05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">20–30 casi critici sulle 3 slice principali · solo task + safety</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% delle PR</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ Suite completa · PR su prompt / modello / retrieval · ~12 min · ~$0,80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500 casi · 4 dimensioni · tutte le slice · gate Spearman per slice</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~22% delle PR</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ Replay di trace di produzione · release candidate · ~25 min · ~$2,40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">finestra di replay di 14 giorni · stesso judge calibrato · analisi del gap offline ↔ replay</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~4% delle PR</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">Costo aggregato per PR (ponderato sull'imbuto): ~$0,27. Wall-clock p95 aggregato: ~3,4 min.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Wall-clock per strato, costo per strato e rapporti dell'imbuto sono interni — misurati sulla CI di produzione di Divinci per un cliente rappresentativo (~500 casi nel golden-dataset, 17 slice, ~60 PR/giorno).</figcaption>
</figure>

La forma del costo è il design. ~74% delle PR non spende mai un token del judge — contract o smoke è sufficiente. Le PR che raggiungono la suite completa sono quelle che hanno toccato un prompt, una configurazione di modello, un indice di retrieval o del codice di valutazione — esattamente i cambiamenti per cui la suite di gate è l'unico segnale degno di fiducia. Le release candidate sono la piccola quota che raggiunge lo Strato 4.

## Contract test — il vantaggio sleale

I contract test sono la prima linea, la linea più economica e la linea che la maggior parte dei team salta perché sentono sotto la dignità di una "pipeline di valutazione AI". Sono anche il punto in cui il 30–40% delle potenziali regressioni fallisce realmente nelle suite dei nostri clienti, prima ancora che un singolo judge sia stato chiamato.

Lo strato contract afferma cinque cose e nient'altro:

1. **Render del template di prompt.** Ogni template viene renderizzato contro una fixture canonica senza variabili non legate, loop fuori controllo o include in stile Jinja rotti.
2. **Schema di tool-call.** Lo schema degli argomenti di ogni tool dichiarato si parsa, lo JSONSchema è valido e il prompt renderizzato fa effettivamente riferimento a tutti gli slot richiesti.
3. **Integrità del manifest.** Ogni SHA nel manifest di release — modello, prompt, indice di retrieval, judge, dataset — corrisponde a un artefatto che esiste nel registry. I puntatori penzolanti falliscono qui, non tre strati più avanti.
4. **Liveness dell'indice.** L'indice di retrieval risponde a una query nota entro il budget. Un indice ricostruito che ha silenziosamente rotto il retrieval emerge qui, non in produzione.
5. **Denylist & budget di token.** Qualunque template di prompt che abbia introdotto un token proibito, sforato il budget di token per chiamata o renderizzato oltre la context window fallisce qui. Lo scoring euristico di similarità semantica<sup><a href="#ref-6">[6]</a></sup> è anch'esso abbastanza economico da essere eseguito allo strato contract per coprire denylist fuzzy-match dove il match letterale stringa non basta.

```bash
# Una invocazione rappresentativa di contract test — gira in circa 600 ms
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

Nessuna di queste chiamate invoca un judge. Nessuna di esse è non deterministica. Nessuna costa denaro misurabile. E ognuna di esse esclude un'intera classe di alert tipo "la suite di gate ha detto che la slice medica è regredita" che avrebbero sprecato 12 minuti completi di inferenza del judge per valutare output che il modello non avrebbe mai potuto produrre correttamente in primo luogo.

## Lo strato smoke — 90 secondi, ~$0,05 per PR

Se lo strato contract è il vantaggio sleale a basso costo, lo strato smoke è quello che cattura davvero le regressioni per meno del prezzo di un caffè. Da venti a trenta casi tratti dalle slice a volume più alto, valutati su **completamento del task e safety soltanto**, senza fedeltà, senza latenza, senza controlli grounded nel retrieval. Ogni PR esegue questo. Ci vogliono circa 90 secondi perché i casi sono raggruppati in una singola chiamata al judge con uno schema di output strutturato, e perché il judge è il judge calibrato economico — non quello full-quality usato per le release candidate.

Tracciamo quale strato ha catturato ogni fix rilasciato in un log di regressioni, e l'istogramma è stato coerente negli ultimi sei mesi nei deployment dei clienti:

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Grafico a barre che mostra dove vengono catturate le regressioni: 31 percento allo strato contract, 27 percento allo smoke, 28 percento alla suite completa, 11 percento al replay, 3 percento sfuggono in produzione">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Dove vengono catturate le regressioni — per strato, ultimi 6 mesi su deployment di clienti</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">La maggior parte delle regressioni muore negli strati più economici. Gli strati costosi si guadagnano il costo sul residuo.</text>
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
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Suite completa</text>
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
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">Sfuggite</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ rollback</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Aggregato rolling a sei mesi su deployment CI Divinci attivi. Riportato come la % di regressioni confermate in cui lo strato indicato è stato il primo a fallire. Interno — misurato da noi.</figcaption>
</figure>

Il 3% che sfugge è il motivo per cui esiste l'[instant rollback del post 5](/it/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/). I gate non promettono zero fughe; promettono un limite superiore stretto e un recupero veloce per ciò che passa.

## Dimensionamento della flotta CI — come la suite da 12 minuti resta economica

Lo strato della suite completa è dove la matematica deve tornare. Un'implementazione ingenua chiama il judge una volta per caso-per-dimensione, le esegue sequenzialmente e la bolletta scala linearmente con il numero di casi. Tre ottimizzazioni fanno la maggior parte del lavoro per mantenerla trattabile:

**Embedding cache.** Il fingerprint del contesto di retrieval per ogni caso del golden-dataset viene hashato; se il caso non è cambiato e l'indice di retrieval non è cambiato, l'embedding in cache regge e lo step di retrieval viene saltato. Il hit rate dopo la prima settimana stabile è costantemente sopra il 90% nei deployment dei nostri clienti.

**Judge batching.** Il judge calibrato viene chiamato con output strutturato, raggruppando 8–16 casi per chiamata. Il costo per token del judge resta lo stesso; l'overhead per caso cala perché il system prompt si ammortizza sul batch. La soglia per il batching sicuro è impostata dall'accordo calibrato dello stesso judge a quella dimensione di batch<sup><a href="#ref-2">[2]</a></sup> — la misuriamo durante il passaggio settimanale di calibrazione del judge ([post 7](/it/blog/automated-regression-testing-for-custom-llms-in-2026/)).

**Riuso della KV-cache tra casi.** Per i modelli in cui lo stesso system prompt e le stesse definizioni di tool aprono ogni chiamata, la KV cache per quel prefisso viene calcolata una volta per esecuzione della suite, non una volta per caso<sup><a href="#ref-3">[3]</a></sup>. Sui deployment open-weights è semplice; sui modelli closed-API dipende dal supporto al prefix-caching del provider.

L'effetto combinato porta la suite completa più o meno ai numeri di costo mostrati nel diagramma della torta a strati sopra. Le cifre esatte sono interne, ma il rapporto è la rivendicazione pubblica: **~74% delle PR spende zero dollari del judge; ~22% spende centesimi; il restante 4% spende un paio di dollari per il segnale pre-rollout a più alta confidenza che sappiamo come produrre.**

## Shadow CI — accenderlo senza rompere il team

L'unico errore che abbiamo visto fare ai team più spesso è passare un nuovo gate da "off" a "blocking" il primo giorno. Le soglie sono state tarate sui dati di ieri, il tasso di falsi positivi è ignoto, e la prima volta che il gate scatta il team non ha calibrazione su se sia reale o un falso allarme. L'eval engineer in on-call viene chiamato, il gate viene disabilitato, la fiducia è andata, il progetto è morto.

La soluzione è la *shadow CI*: eseguire il nuovo gate non-bloccante per due settimane, postare il risultato come commento di un bot su ogni PR e rivedere il tasso di falsi positivi settimanalmente prima di passarlo a bloccante. Il runner CI di Divinci ha una flag `--shadow` esattamente per questo. Il commento sulla PR ha lo stesso aspetto della futura versione bloccante — stesso display di diff, stesso breakdown per slice — tranne che non blocca il merge.

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

Quando il tasso di falsi positivi resta sotto il 5% in modo sostenuto durante la finestra, lo passiamo a bloccante. Quando non lo è, stringiamo le soglie per slice, ricalibriamo il judge e ripetiamo la shadow. In entrambi i casi il team non viene preso in imboscata da un nuovo gate che scatta il primo giorno.

## Un workflow GitHub Actions che davvero compone

Il pezzo che lega la torta a strati alla tua CI esistente gira in `.github/workflows/llm-ci.yaml`. Gli strati sono cablati in modo che quelli economici falliscano in fretta e quelli costosi girino solo quando serve — le catene `needs:` e i trigger filtrati per path fanno il lavoro<sup><a href="#ref-5">[5]</a></sup>.

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

Tre cose da notare. Gli strati si incatenano via `needs:`, quindi smoke non gira su un contract rotto e full non gira su uno smoke rotto. Il job `full` è filtrato per path ai cambiamenti che giustificano davvero un run da 12 minuti — la correzione di un refuso nel README non innesca la suite di gate. La flag `--post-pr-comment` è ciò che rende il diff per slice visibile senza uscire da GitHub.

## Il loop di debug delle PR fallite

L'altra metà di "il gate è scattato" è "mostrami perché". Un output della suite di regressione tipo `slice medica completamento del task scesa di 0,04` non è azionabile senza i casi che l'hanno causato. Facciamo emergere i cinque peggiori diff per slice nel commento della PR, con l'input originale, l'output di baseline, l'output candidato e la trace di reasoning del judge. Il loop di debug è pensato per durare secondi, non minuti:

```bash
# Estrai i 5 peggiori casi che hanno fatto scattare il gate della slice medica su questa PR
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

Questa è la stessa superficie diagnostica dell'[albero a sette step del post 6](/it/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/), cablata nel loop di feedback della CI. L'ingegnere che ha aperto la PR vede le evidenze a livello di caso sulla PR stessa; non deve andare ad aprire una dashboard di valutazione separata.

## Disciplina del version control — prompt, dataset, judge come codice

I template di prompt, i golden dataset e i prompt del judge vivono tutti nel repo, hash-pinned nel manifest di release. Il manifest è l'unico oggetto che lega la suite a uno specifico stato riproducibile:

```yaml
# manifests/staging.yaml — ogni run CI hasha questo
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

Quando un run CI pubblica un punteggio, il punteggio è taggato con quell'hash del manifest. Quando un punteggio si muove, la domanda "quale input si è mosso" ha una risposta diretta: diffa il manifest, e lo strato che ha fatto scattare ti dice quale dimensione guardare per prima. Questo è il loop che la [pipeline a quattro stadi del post 1](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) e la [ricevuta vIndex del post 4](/it/blog/validating-and-releasing-custom-lms-in-regulated-fields/) chiudono insieme: il manifest è la primitiva di audit verso cui tutti e otto questi post, in inquadrature diverse, si sono diretti.

## Cosa questo non risolve

Le stesse tre limitazioni oneste che abbiamo scritto in ogni post di questa serie.

1. **La CI non testa ciò che non è nella suite.** Per quanto astuta sia la torta a strati, le uniche regressioni che cattura sono quelle che qualche caso nel golden dataset avrebbe segnalato. Lo strato replay mitiga questo per il behaviour drift, ma le query nuove che non sono mai state viste continuano a sfuggire finché non compaiono in produzione. Il sistema deve essere accoppiato al monitoraggio di produzione.
2. **Le cifre di costo cambiano con il pricing dei modelli.** Ogni cifra di costo in questo post dipende dai tassi di token del judge, dai tassi di embedding e dai tassi di inferenza che fluttuano trimestralmente. I rapporti — 74% / 22% / 4%, 31% / 27% / 28% / 11% / 3% — sono le rivendicazioni portanti; le cifre in dollari sono illustrative per un istante nel tempo.
3. **Le modifiche di checkpoint lato provider restano difficili.** Quando un provider closed-API aggiorna silenziosamente il modello dietro un nome stabile, lo strato contract non può catturarlo; solo la suite di gate può, e solo dopo il fatto. Mitighiamo pinnando identificatori espliciti di checkpoint ovunque il provider lo supporti e trattando il giorno in cui un checkpoint viene annunciato come un evento scatenante per un re-baseline della suite completa. Non possiamo prevenire il problema sottostante.

## Chiudendo la serie

Questo è il post 8 di 8. L'arco completo:

1. [Come costruire una pipeline CI/CD per LLM con Divinci AI](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — la pipeline a quattro stadi (Register / Gate / Roll / Observe) all'interno della quale tutto il resto è vissuto.
2. [10 fallimenti di release CI/CD nei modelli linguistici personalizzati](/it/blog/10-ci-cd-release-failures-in-custom-language-models/) — i modi di fallimento del 2026 con nome, ciascuno mappato sullo stadio che avrebbe dovuto catturarlo.
3. [12 capacità di QA e release management per LLM](/it/blog/12-qa-and-release-management-capabilities-for-llms/) — la matrice di capacità e il Venn a tre campi che colloca Divinci rispetto alle alternative.
4. [Validare e rilasciare LM personalizzati in campi regolamentati](/it/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — il deep-dive di compliance, la mappatura regolatore-a-stadio, le ricevute vIndex.
5. [Pipeline CI/CD automatizzate per LLM con instant rollback](/it/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — lo strato operativo, lo spettro di automazione, la ricevuta di auto-rollback.
6. [Come diagnosticare i fallimenti QA di LLM personalizzati in 7 step](/it/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — l'albero decisionale diagnostico; il modello è la risposta giusta all'incirca un allarme su sette.
7. [Test di regressione automatizzati per LLM personalizzati nel 2026](/it/blog/automated-regression-testing-for-custom-llms-in-2026/) — gate Spearman slice-aware, judge calibrati, replay di trace di produzione a circuito chiuso.
8. **Questo post.** L'infrastruttura CI che rende trattabile tutto quanto sopra su ogni PR.

I pezzi compongono: il [manifest](/it/api/) è la primitiva di audit, i gate sono lo strato di sicurezza, l'albero diagnostico è il loop di recupero, la [ricevuta vIndex](/it/compliance/) è l'ancora esterna, e la torta a strati è ciò che rende l'intero sistema sostenibile su ogni commit. Se il tuo processo di release di LLM personalizzati non ha questi cinque elementi insieme, il gap è ciò di cui questi otto post hanno parlato.

## FAQ

**Qual è il test più economico che posso eseguire su ogni commit?**

Un check di render del template di prompt. Gira in millisecondi, non richiede un judge, cattura una frazione sorprendente di rotture e non costa mai un centesimo misurabile. Se non lo stai ancora eseguendo, è il singolo pezzo di CI a più alto ROI che sappiamo come raccomandare.

**Quanto dovrei aspettarmi che costi una pipeline CI per un LLM personalizzato?**

Centesimi per PR tipica, dollari a una cifra bassa per PR di release-candidate. Il rapporto dipende dal pricing del judge e dalla frazione di PR che toccano prompt o configurazioni del modello. La quota del 4% di release-candidate sopra è tipica; per prodotti con iterazione frequente sui prompt la quota sale e la media cresce di conseguenza.

**Dovrei eseguire la suite completa su ogni commit?**

No. Filtra per path alle PR che toccano prompt, configurazioni del modello, retrieval o codice di valutazione. Per tutti gli altri cambiamenti, contract + smoke è sufficiente e un'attesa di 12 minuti su un refuso nel README ti farà perdere la fiducia del team entro uno sprint. La suite completa è preziosa; spendila dove il cambiamento può plausibilmente muovere una dimensione di qualità.

**Come introduco un nuovo gate senza rompere tutti?**

Finestra shadow di due settimane, non bloccante. Tara le soglie sul tasso di falsi positivi osservato durante la shadow. Passa a bloccante solo quando il tasso di falsi positivi sostenuto è sotto la tua tolleranza (noi usiamo il 5%). Tutto il resto è come ottieni un gate che tutti hanno imparato a ignorare.

**Qual è l'unico numero che dovrei tracciare se ne traccio uno solo?**

La frazione di regressioni confermate catturate prima della produzione. L'istogramma in questo post la pone a ~97% nei deployment Divinci maturi. Il 3% che sfugge è il motivo per cui esiste l'instant rollback. Il 97% è ciò per cui esiste la suite.

## Riferimenti

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — CI velocity, change-failure-rate and time-to-restore-service."</a> I baseline cross-industry che rendono "12 minuti per PR è troppo lento" un'affermazione difendibile e non un'opinione.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. L'evidenza empirica che le chiamate batchate di LLM-as-judge possono preservare la calibrazione alle dimensioni di batch usate negli strati smoke e full — la ragione per cui le cifre di costo in questo post sono raggiungibili.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">"Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. Le tecniche di riuso della KV-cache e di prefix-sharing citate nella sezione sul dimensionamento della flotta CI.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 aprile 2026. Il modo di fallimento del 2026 con nome per le suite di regressione solo-aggregate; il motivo per cui la torta a strati della CI è slice-aware da cima a fondo.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">"GitHub Actions — chaining jobs with `needs:` and conditional execution."</a> La primitiva contro cui lo .yaml in questo post compone.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">"BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. La metrica euristica di similarità semantica indicata come alternativa a LLM-as-judge per gli strati più economici; non è ciò che eseguiamo al gate time, ma è utile nello strato contract per il rilevamento di frasi proibite su larga scala.
  </li>
</ol>
