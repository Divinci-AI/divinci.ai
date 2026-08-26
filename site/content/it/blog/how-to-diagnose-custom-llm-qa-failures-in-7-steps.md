+++
title = "Come diagnosticare i fallimenti QA di un LLM personalizzato in 7 passi"
description = "Quasi tutti i 'fallimenti QA' non sono del modello — sono lacune di eval, mis-calibrazione del giudice o skew training-serving. Diagnostica in 7 passi."
date = 2026-05-31T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["QA", "Diagnostics", "Postmortems", "LLM Ops", "Evaluation", "Debugging"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-diagnose-custom-llm-qa-failures-in-7-steps-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/how-to-diagnose-custom-llm-qa-failures-in-7-steps-hero-poster.webp"
reading_time = 11
summary = "Quando un allarme QA scatta su un LLM personalizzato, il riflesso naturale è incolpare il modello. Attraverso i rollout che abbiamo gestito, il modello è la risposta giusta circa una volta su sette. Le altre sei volte, il bug è nell'eval, nel giudice, nello SHA del prompt, nella pipeline di preprocessing, nella versione del dataset o nell'indice di retrieval. Questo post è l'albero diagnostico che percorriamo effettivamente — in ordine, con la chiamata API esatta che risponde a ciascun ramo."
+++

*Note dal Ciclo di Rilascio — Parte VI*

---

Una suite di QA scored ha iniziato a segnalare il modello di Q&A medico di un cliente. Il numero principale — qualità aggregata su tutte le slice — è calato di 6 punti durante la notte. Il team ha passato due giorni a fare debug sul modello. Hanno rieseguito i fine-tune. Hanno fatto rollback alla release precedente. I numeri non si sono mossi.

La mattina del terzo giorno, qualcuno ha notato che la suite di eval era stata aggiornata la stessa notte in cui era iniziata la regressione. Tre nuovi prompt di dosaggio pediatrico erano stati aggiunti al test set, e il modello non aveva mai visto dosaggi pediatrici durante il training. Il "fallimento QA" non era una regressione del modello. Era un evento di copertura slice: l'eval aveva iniziato a chiedere qualcosa che il modello non avrebbe mai dovuto sapere.

Attraverso i rollout dei nostri clienti, questo è il pattern dominante. **Un allarme di "fallimento QA" è il sintomo. La causa è il modello circa una volta su sette.** Le altre sei volte, il bug è da qualche parte a monte: nel design dell'eval, nella calibrazione del giudice, nello SHA del prompt, nella pipeline di preprocessing, nella versione del dataset o nell'indice di retrieval. Ognuna di queste classi di bug appare identica dall'allarme — un numero è sceso — ma ha una correzione completamente diversa.

Questo post è l'albero diagnostico che percorriamo in ordine quando scatta un allarme. Sei passi che escludono le cause non-modello, prima che il settimo passo consideri il modello stesso. Ogni passo ha una chiamata API o una query concreta che vi risponde. Quando avrete completato i sei, o saprete esattamente cosa correggere, o vi sarete guadagnati il diritto di guardare il modello.

## L'albero decisionale

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Albero decisionale diagnostico per un allarme di fallimento QA. Il Passo 1 chiede se l'eval copre questa slice (se no, l'allarme è una lacuna di copertura dell'eval). Il Passo 2 chiede se il giudice è calibrato rispetto agli umani su questa slice (se no, l'allarme è una mis-calibrazione del giudice). Il Passo 3 chiede se lo SHA del template del prompt corrisponde alla produzione (se no, l'allarme è drift del prompt). Il Passo 4 chiede se il preprocessing corrisponde alla produzione (se no, l'allarme è skew tra training e serving). Il Passo 5 chiede se lo SHA del dataset corrisponde alla produzione (se no, l'allarme è drift del dataset). Il Passo 6 chiede se la versione dell'indice di retrieval corrisponde alla produzione (se no, l'allarme è drift dell'indice RAG). Solo dopo che tutti e sei escludono una causa non-modello, il Passo 7 conclude che si tratta effettivamente di una regressione del modello per-slice.">
<title>L'albero diagnostico in 7 passi</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Quando scatta un allarme QA, scendi — non entrare</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">Sei passi escludono cause non-modello. Solo il settimo incolpa il modello.</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  Allarme QA scatta</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">L'eval copre questa slice?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ se NO: lacuna di copertura. Aggiorna la suite, ritesta.</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">Il giudice è calibrato sugli umani per questa slice?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ se NO: mis-calibrazione. Ricalibra ρ. Ri-valuta.</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">Lo SHA del template del prompt corrisponde alla prod?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ se NO: drift del prompt. Ri-registra il manifest.</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">La pipeline di preprocessing corrisponde alla prod?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ se NO: skew training-serving. Vincola SHA preprocess.</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">Lo SHA del dataset corrisponde alla prod?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ se NO: drift del dataset. Ri-registra con SHA corretto.</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">SHA indice di retrieval corrisponde?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ se NO: drift dell'indice RAG.</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">Se tutti i 6 passano:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">vera regressione del modello per-slice.</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">Commit. Rollback. Retraining.</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">Empiricamente il modello</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">è la risposta giusta</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">circa 1 allarme su 7.</text>
</svg>
</figure>

L'albero è sequenziale perché i passi vanno dal più economico al più costoso. Il Passo 1 è un `git diff` della suite di eval; il Passo 7 è un ciclo di fine-tune. Vuoi spendere dieci minuti su ognuno dei sei controlli economici prima di spendere una settimana su quello costoso.

## Passo 1 — L'eval copriva questa slice?

**Il sintomo.** La qualità aggregata cala, ma la suddivisione per slice mostra una slice in caduta libera mentre le altre sono piatte. O — più confusamente — *ogni* slice cala leggermente, tutte di importi simili.

**La diagnosi.** Fai il diff dello SHA del manifest della suite di eval rispetto a quello della release precedente. Se la suite di eval è cambiata e tu non hai cambiato il modello, la regressione è nell'eval, non nel modello.

```bash
# Confronta lo SHA del manifest della eval-suite tra le release
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# Diverso? La tua eval è cambiata. Verifica cosa è stato aggiunto.
```

**La correzione.** O annulla la modifica della eval-suite (se non era intenzionale), o espandi la copertura del training per allinearla alla nuova eval (se la nuova slice è una vera preoccupazione di produzione). Non spedire una correzione di regressione del modello per un problema di copertura dell'eval — peggiorerai il modello su quello che effettivamente sapeva fare bene.

**Dove questo si nasconde nella nostra pipeline.** [Stage 1 — Register](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) vincola lo SHA della eval-suite nel manifest di release. La diagnosi sopra è semplicemente un diff di due manifest. Il motivo per cui il bug è costato al team medical-Q&A due giorni è che non avevano un diff a livello di manifest — stavano confrontando checkpoint del modello, non manifest di release.

## Passo 2 — Il giudice è calibrato sugli umani per questa slice?

**Il sintomo.** Una slice che è *nuova* per la suite di eval ottiene punteggi bassi, ma la revisione umana degli output del modello su quella slice li giudica accettabili. Il giudice pensa che il modello stia fallendo; gli umani no.

**La diagnosi.** Calcola lo Spearman ρ tra le valutazioni del giudice LLM e un piccolo campione valutato dagli umani (50 item) sulla slice che fallisce. Se ρ &lt; 0.4, il giudice *non sta misurando* ciò che misurano gli umani su questa slice.

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**La correzione.** O seleziona un modello giudice diverso per questa slice, o usa una catena di giudici con un arbitro. MT-Bench<sup><a href="#ref-1">[1]</a></sup> mostra che GPT-4-come-giudice concorda con gli umani &gt;80% in media ma con varianza per categoria dall'86% (coding) al 36–44% (scrittura/scienze umane). La varianza è il numero operativo; "buono in media" nasconde slice in cui il giudice sbaglia.

**Dove questo si nasconde nella nostra pipeline.** [Stage 2 — Gate](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) richiede un giudice calibrato per slice. Il post [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/) documenta la procedura. Se la slice è stata aggiunta all'eval senza un passo di calibrazione, hai un gate strutturalmente inaffidabile.

## Passo 3 — Lo SHA del template del prompt corrisponde alla produzione?

**Il sintomo.** La qualità cala ma il model_ref e il dataset_ref sono invariati. Nulla del training è cambiato. Il modello è lo stesso modello. Eppure.

**La diagnosi.** Confronta lo SHA del `prompt_template_ref` nel manifest della release che fallisce con quello della release precedente. Una modifica di 38 caratteri a un system prompt che "migliora la concisione" può cambiare il comportamento downstream più di un retraining completo.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# Diverso? Estrai il diff. Guardalo attentamente.
```

**La correzione.** Tratta i prompt come codice. Il post sui [10 fallimenti di release](/it/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) copre la modalità di fallimento dell'edit da dashboard — il postmortem *Semver Lie* di Tianpan<sup><a href="#ref-2">[2]</a></sup> lo identifica come pattern dominante di fallimento 2026. Se puoi dimostrare che il prompt è cambiato, hai trovato il tuo bug.

## Passo 4 — La pipeline di preprocessing corrisponde alla produzione?

**Il sintomo.** Il modello passa l'eval localmente. Lo stesso modello fallisce la stessa eval in produzione. Stesso model_ref, stesso prompt, stesso dataset.

**La diagnosi.** Estrai lo SHA del `preprocessing_ref` dal manifest di produzione e verifica che l'eval sia stata eseguita con lo stesso. Il caso classico: il training normalizza gli spazi e fa lowercase; la produzione no. L'eval era passata attraverso il preprocessing di produzione; tutto verificato. Finché qualcuno non ha aggiornato il preprocessing da un solo lato.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# Confronta con il preprocessing usato effettivamente dal tuo harness di training/eval.
```

**La correzione.** Containerizza il preprocessing come artefatto versionato. Referenzialo dal manifest. Rifiuta di fare deploy se lo SHA di preprocessing del gate differisce da quello di produzione.

## Passo 5 — Lo SHA del dataset corrisponde alla produzione?

**Il sintomo.** I punteggi del gate-eval della release che fallisce sono diversi dai punteggi del gate-eval dello *stesso* modello del giorno prima.

**La diagnosi.** Fai il diff del campo `dataset_version` tra le due release. La suite di eval ha mantenuto lo stesso nome, ma il contenuto del dataset è stato aggiornato e ri-taggato. Stesso nome, SHA diverso, punteggi diversi.

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**La correzione.** Fai content-hash dei tuoi dataset. Il nome del dataset non è una versione; lo SHA sì.

## Passo 6 — Lo SHA dell'indice di retrieval corrisponde alla produzione?

**Il sintomo.** Solo per carichi RAG. La qualità cala sulle domande che dipendono dal contesto recuperato. Le domande a risposta diretta sono invariate.

**La diagnosi.** Estrai lo SHA del `retrieval_index_ref` dal manifest. Confrontalo con l'indice di retrieval della valutazione del gate. L'indice RAG si è aggiornato durante la notte (una nuova run di ingestion); la valutazione del gate aveva in cache un retrieval più vecchio; il canary di produzione ha usato quello nuovo.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**La correzione.** Vincola lo SHA dell'indice di retrieval nel manifest, esattamente come vincoliamo il preprocessing. La cadenza di rotazione automatica dell'indice di [AutoRAG](/it/autorag/) rende questo controllo particolarmente utile — l'indice *si aggiornerà* su di te che tu l'abbia autorizzato o meno, se non lo pinni.

## Passo 7 — Il modello stesso, finalmente

Sei passi dentro. L'eval copre la slice. Il giudice è calibrato. Lo SHA del prompt corrisponde. Il preprocessing corrisponde. Il dataset corrisponde. L'indice di retrieval corrisponde.

Ora — e solo ora — ti sei guadagnato il diritto di guardare il modello.

La diagnosi per questo passo è un confronto Spearman per-slice rispetto alla release precedente, con entrambe le release valutate rispetto allo *stesso* dataset, preprocessing e retrieval pinned dal manifest. Il numero che produci è un segnale pulito: una vera regressione per-slice, senza confondenti a monte.

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

Se il delta conferma una regressione reale: il [rollback automatico](/it/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) si attiva (se non l'hai già invocato manualmente), e il modello che fallisce viene rieducato contro un corpus ampliato di copertura slice. Se il gate che ha promosso questa release ha mancato la slice in primo luogo, [anche il gate è il bug](/it/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — la capacità 4 mancante dalla tua pipeline di release.

## Come si presenta effettivamente la distribuzione

La cornice "1 su 7" prima non era un espediente retorico. È approssimativamente la distribuzione che vediamo nei rollout dei clienti. Su ogni sette allarmi QA:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Grafico a torta della distribuzione delle cause radice per gli allarmi QA. La lacuna di copertura dell'eval rappresenta circa il 32 percento. La mis-calibrazione del giudice circa il 18 percento. Il drift del prompt circa il 16 percento. Lo skew di preprocessing circa il 12 percento. Il drift del dataset circa il 7 percento. Il drift dell'indice RAG circa il 5 percento. La vera regressione del modello circa il 10 percento. Osservazione interna sui rollout dei clienti; non da un benchmark controllato.">
<title>Distribuzione delle cause radice degli allarmi QA</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Dove era effettivamente il bug — nei rollout dei clienti</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Osservazione interna, non un benchmark controllato. Il modello è la risposta giusta circa una volta su sette allarmi.</text>
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
<text x="522" y="112" font-weight="600">1.  Lacuna di copertura eval</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  Mis-calibrazione del giudice</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  Drift del prompt</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  Skew di preprocessing</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  Vera regressione del modello</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  Drift del dataset</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  Drift dell'indice RAG</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">I passi 1+2 da soli rappresentano la metà degli allarmi. Percorri l'eval prima di percorrere il modello.</text>
</svg>
</figure>

Le due fette più grandi sono *lacuna di copertura eval* e *mis-calibrazione del giudice*. Insieme rappresentano la metà degli allarmi QA. Nessuna delle due è un problema del modello. Entrambe sono problemi di come misuri il modello.

## Cosa questo non risolve

Tre limitazioni oneste:

**La distribuzione è la nostra, non la tua.** Le percentuali sopra provengono dalla nostra coorte di clienti e dal tooling della nostra pipeline. Se gestisci un tipo di carico diverso — heavy multi-modale, heavy orchestrato da agenti, heavy generativo single-shot — la tua distribuzione sarà diversa. L'ordine diagnostico dovrebbe comunque reggere; i numeri dietro ogni passo no.

**La "lacuna di copertura eval" del Passo 1 è la più difficile da correggere.** Aggiungere la slice mancante al tuo corpus di training, costruire un giudice calibrato per essa e rieseguire il canary è di per sé un progetto di più settimane. La diagnosi è rapida; la remediation no.

**Una vera regressione può cavalcare un bug non-modello.** I casi in cui hai *sia* un drift del prompt SIA una vera regressione del modello sono i peggiori, perché il Passo 3 trova il drift del prompt, lo correggi e l'allarme si ripresenta. L'ordine diagnostico in questo post li gestisce ma aggiunge tempo trascorso. Non c'è scorciatoia per "il bug era in due posti contemporaneamente".

## FAQ

### Perché il mio LLM produce output diversi per prompt simili?

La sensibilità al prompt è reale, ma non è sempre la *causa* di un allarme QA — a volte è un *sintomo* di un bug a monte. Percorri la diagnostica. Se lo SHA del template del prompt corrisponde e il preprocessing corrisponde e il dataset corrisponde, allora sì — il modello ha ampia varianza su questa slice e ti serve un percorso di decoding più deterministico o un giudice diverso. Se qualcosa a monte è cambiato, correggi prima quello.

### Quanto spesso dovresti ri-valutare i tuoi benchmark LLM?

Ri-valuta il *contenuto* del benchmark ogni volta che la forma del traffico di una slice di produzione cambia in modo significativo. Ri-valuta la *calibrazione del giudice* del benchmark almeno ogni trimestre — i modelli giudice driftano più velocemente di quanto pensi. La maggiore fonte di falsi allarmi QA è un benchmark che è stato validato l'ultima volta 18 mesi fa e ora misura qualcosa che la tua produzione non fa più.

### Cosa causa le allucinazioni nei modelli linguistici personalizzati?

Le allucinazioni hanno cause multiple a monte — fallimenti di retrieval (Passo 6 nell'albero sopra), lacune di copertura del training (Passo 1, indirettamente) e problemi del percorso di decoding (una preoccupazione reale del modello al Passo 7). [AutoRAG](/it/autorag/) affronta le cause sul lato retrieval vincolando l'indice di retrieval nel manifest di release e ri-pinnandolo ad ogni release. Le altre due richiedono correzioni a livello di pipeline a monte del modello.

### Come fai a sapere se i tuoi dati di training sono il problema?

Se lo SHA del dataset nella release che fallisce corrisponde allo SHA del dataset nella precedente release buona (Passo 5 dell'albero), i dati non sono la causa *immediata*. Se differiscono, l'hai trovata. La domanda più difficile — "il dataset è *completo* per la copertura slice della nostra produzione?" — è quello che il Passo 1 testa. Un dataset completo per l'eval ma incompleto per il traffico di produzione è un problema di copertura slice.

### Puoi correggere i fallimenti QA senza ri-addestrare l'intero modello?

Sì — sei volte su sette, la correzione non è un retraining. I passi 1–6 nell'albero hanno correzioni che non toccano il modello: aggiorna l'eval, ricalibra il giudice, ri-registra lo SHA del prompt, correggi il preprocessing, ri-pinna il dataset, o ri-pinna l'indice di retrieval. Il retraining è il Passo 7, la correzione più costosa, riservata alle vere regressioni del modello. L'[audit trail](/it/compliance/) della pipeline di release ti permette di fare queste correzioni a monte con la stessa disciplina di provenance che useresti per una modifica del modello.

## Riferimenti

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Varianza per categoria di LLM-come-giudice.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% di accordo complessivo GPT-4-vs-umani con varianza per categoria da coding (86%) a scrittura (36–44%). Ancora per il Passo 2 — perché la calibrazione del giudice deve essere misurata per slice e non assunta da un numero principale pubblicato.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (aprile 2026). Il writeup dominante della modalità di fallimento 2026. Identifica il drift del prompt da edit di dashboard come la causa più citata degli incidenti LLM in produzione. Ancora per il Passo 3.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — funzione Measure.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>. La funzione "Measure" copre esplicitamente la validità dei benchmark e la copertura della valutazione come parte della governance, non come una preoccupazione di ingegneria separata. Citata come l'ancora istituzionale per trattare il design dell'eval come il primo passo diagnostico.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — valutazione di retrieval-augmented generation.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). Il framework di riferimento per la valutazione sul lato RAG. Ancora per il Passo 6 — separare i fallimenti di retrieval dai fallimenti di generazione richiede una disciplina di eval consapevole del RAG.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interno — distribuzione delle cause radice nei rollout dei clienti.</strong> Le percentuali nel grafico a torta sono la nostra osservazione interna nei rollout dei clienti Divinci, non da un benchmark controllato. La tua distribuzione varierà per tipo di carico, cadenza di fine-tune e disciplina del team. L'ordinamento relativo (Passi 1–2 dominanti) è stabile nella coorte che abbiamo misurato; le percentuali esatte non sono portabili al tuo ambiente senza i tuoi dati.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>La pipeline di release in quattro stage.</strong> <a href="/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Ogni passo diagnostico in questo post corrisponde a un campo del manifest vincolato allo Stage 1 — Register. Senza la disciplina del manifest a monte, la diagnostica perde la presa; non puoi fare il diff di ciò che non hai vincolato.
</li>
</ol>

---

*Prossimo nella serie:* **Automated Regression Testing for Custom LLMs in 2026.** Questo post riguarda la diagnosi dopo lo scatto di un allarme QA. Il prossimo riguarda la disciplina di regression-testing che ha generato l'allarme in primo luogo — cosa mettere nell'eval, come mantenerla onesta e cosa fare quando il regression test inizia a non essere d'accordo con il giudice.
