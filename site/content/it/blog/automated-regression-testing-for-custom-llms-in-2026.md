+++
title = "Test di regressione automatizzati per LLM personalizzati nel 2026"
description = "Una suite di regressione che intercetta il drift nell'eval, non solo nel modello. Gate per slice, giudici calibrati, replay di tracce di produzione."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "images/automated-regression-testing-for-custom-llms-in-2026-hero.png"
reading_time = 13
summary = "La maggior parte delle 'regressioni' degli LLM è drift nella suite di eval stessa — calibrazione del giudice, copertura degli slice, template del prompt, indice di retrieval. Ecco la suite che le intercetta, valutata per-slice con un giudice calibrato e riprodotta contro tracce di produzione live."
+++

*Note dal ciclo di rilascio — Parte 7*

Venerdì alle 16:47 hai spedito una modifica al prompt di un carattere. Il punteggio aggregato dell'eval si è spostato da 0,873 a 0,871 — ben dentro il rumore di fondo. Lunedì mattina la tua coda di supporto è in fiamme per una classe di query che hai smesso di osservare sei mesi fa perché era stabile.

Niente è regredito nel modello. Il modello è lo stesso modello. **L'eval è andato in deriva sotto i tuoi piedi.** Sei mesi di lenta crescita in un segmento di clienti non sono mai entrati nel dataset aureo, il prompt del giudice è stato calibrato per l'ultima volta contro esseri umani a ottobre, e l'indice di retrieval si è ricostruito silenziosamente mercoledì scorso su un modello di embedding aggiornato.

Questo è ciò che il post 6 ha messo in evidenza — [il modello è la risposta giusta circa un allarme su sette](/it/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/). Il che significa che la tua suite di regressione deve rilevare il drift in se stessa, non solo nel modello. Questo post è la suite.

## Cos'è davvero il test di regressione per un LLM personalizzato?

I test di regressione software asseriscono `output == expected` per input fissi. Funzionano perché la funzione è deterministica.

Un modello linguistico non è una funzione nello stesso senso. Lo stesso prompt a temperatura > 0 produce una distribuzione di completamenti validi, e "valido" è multi-dimensionale: ha risposto alla domanda, la risposta è grounded nel contesto recuperato, è rimasta dentro l'envelope di sicurezza, è tornata dentro il budget di latenza. Quindi il test di regressione di un LLM personalizzato significa **misurare la distribuzione del comportamento contro una distribuzione di baseline congelata** — attraverso slice che contano per te, con giudici calibrati contro esseri umani, su input che assomigliano al tuo traffico di produzione.

Tre cose devono essere in posizione prima che tutto questo sia significativo:

1. Un **dataset aureo** che assomigli alla produzione a livello di slice, non in aggregato.
2. Un **giudice calibrato** — non "usiamo GPT-5 come giudice", ma "abbiamo misurato Spearman ρ ≥ 0,7 contro tre rater umani, aggiornato l'ultima settimana".
3. Un **manifest di baseline** — i pesi esatti del modello, il template del prompt, l'indice di retrieval e la versione del giudice che hanno prodotto quei punteggi. Senza questo non puoi sapere se il punteggio si è mosso perché è cambiato il modello o perché è cambiato il righello.

Divinci esegue tutti e tre come oggetti di prima classe, collegati da hash, valutati su ogni commit. Il resto di questo post è come assemblarli.

## Perché la maggior parte delle suite di regressione per LLM non rileva le vere regressioni

La modalità di fallimento dominante del 2026 per gli LLM personalizzati è ciò che il team Sigma Inference di Tianpan ha battezzato la *Bugia del Semver* nel loro postmortem di aprile 2026<sup><a href="#ref-1">[1]</a></sup>: una metrica aggregata rimane piatta o migliora, mentre uno o due slice di produzione regrediscono silenziosamente. Lo slice era sotto il 5% del traffico quando il test è stato progettato, quindi non è mai entrato nel dataset aureo; sei mesi dopo è il 12% del traffico, il modello è peggiorato su di esso, e il numero aggregato non se ne sarebbe mai accorto.

Abbiamo esaminato ogni postmortem pubblico di rilascio di LLM degli ultimi diciotto mesi e il pattern si ripete: **la suite è risultata verde perché stava valutando la cosa sbagliata.** Specificamente:

- Il dataset aureo è stato scritto a mano dal team al lancio e mai ristratificato contro distribuzioni di traffico spostate.
- Il prompt LLM-as-judge è stato impostato una volta e mai ricalibrato contro etichette umane. L'accordo del giudice è decaduto silenziosamente<sup><a href="#ref-2">[2]</a></sup>.
- I punteggi di baseline sono stati conservati come numeri grezzi, non come tuple `(model_sha, prompt_sha, judge_sha, dataset_sha, score)` — quindi quando qualcosa regrediva, nessuno poteva capire quale dei quattro si fosse mosso.

Una suite di regressione che non risolve tutte e tre queste cose è solo uno step di CI che diventa verde al momento del deploy e ti dà una falsa fiducia. La soluzione non è "più casi". La soluzione è una misurazione **slice-aware, ancorata alla versione, calibrata sul giudice**, ad ogni rilascio.

## Costruisci un dataset aureo che sopravviva all'analisi slice-aware

La composizione a quattro bucket che spediamo di default — campioni di produzione 60%, avversariali 15%, casi limite curati da esperti 15%, replay di fallimenti 10% — è un punto di partenza ragionevole. Ciò che la rende effettivamente capace di intercettare le regressioni sono i **metadati di slice** allegati a ogni caso.

Ogni voce nel dataset porta: input, comportamento atteso (rubrica, non stringa esatta), contesto di retrieval (se presente) e un tag `slice` — dominio, segmento utente, intent della query, lingua, bucket di lunghezza, qualunque decomposizione conti per il tuo prodotto. La suite valuta **per slice**, e qualsiasi slice che scenda oltre la sua soglia blocca il rilascio, anche se il punteggio aggregato è salito.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Composizione del dataset aureo: 60% campione di produzione, 15% avversariale, 15% casi limite di esperti, 10% replay di fallimenti, tutti stratificati attraverso gli slice">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Composizione del dataset aureo — stratificato per slice su ogni asse</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Dimensionato per ~500 casi. I segmenti delle barre sono proporzionali. La copertura per-slice è il requisito vincolante, non il rapporto aggregato.</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">Campione di produzione</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Avversariali</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">Limiti esperti</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Replay</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">tracce di produzione stratificate · aggiornate trimestralmente</text>
<text x="513" y="90" text-anchor="middle">jailbreak · injection</text>
<text x="627" y="90" text-anchor="middle">limiti di dominio · coda lunga</text>
<text x="722" y="90" text-anchor="middle">replay da postmortem ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">Ogni caso porta tag di slice — la suite valuta separatamente ogni combinazione</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">dominio</tspan> · legale / med / generale</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">intent</tspan> · how-to / fatto / rifiuto</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">lingua</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">lunghezza</tspan> · breve / media / lunga</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">segmento</tspan> · enterprise / SMB</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">retrieval</tspan> · grounded / open</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">tool-use</tspan> · 0 / 1 / multi-step</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">novità</tspan> · visto / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">composizione × slice = griglia di scoring</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Valutato per slice ad ogni rilascio — Spearman ρ ≥ 0,7 vs baseline, per slice</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">Qualsiasi slice che superi la sua soglia blocca il rilascio. Il punteggio aggregato è solo informativo.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Il diagramma è strutturale. Assi di stratificazione e soglie per-slice sono configurati per prodotto nel manifest di rilascio Divinci. Interno — definito nei nostri deploy.</figcaption>
</figure>

Due regole operative che abbiamo imparato a far rispettare:

**Ricampionare trimestralmente.** Le distribuzioni del traffico di produzione si spostano più velocemente di quanto la maggior parte dei team misuri. Ristratifichiamo il bucket campione di produzione contro gli ultimi 90 giorni di traffico ogni trimestre; se qualsiasi slice è cresciuto oltre il 5% del traffico ed era sotto il 2% del dataset aureo, viene reintegrato prima che il prossimo rilascio venga spedito.

**Ogni postmortem aggiunge un caso.** Una regressione che ha raggiunto la produzione e non è stata intercettata è un caso mancante dal dataset. Lo aggiungiamo al bucket dei replay entro 48 ore dal postmortem e lo taggiamo con lo slice che lo ha portato a galla.

## Come rilevare il drift prima degli utenti?

Ci sono quattro tipi distinti di drift, e una suite di regressione che osserva solo l'ultimo è una suite che si perde la maggior parte delle regressioni.

| Tipo di drift | Cosa si muove | Segnale di rilevamento | Azione |
|---|---|---|---|
| **Drift di qualità** | Il punteggio del giudice per uno slice fisso | Cala lo Spearman ρ per-slice vs baseline | Bloccare il rilascio; diagnosticare per [l'albero del post 6](/it/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) |
| **Drift di copertura** | Distribuzione del traffico di produzione vs distribuzione del dataset aureo | Divergenza KL tra proporzioni di slice | Ricampionare il dataset aureo |
| **Drift del giudice** | Accordo del modello giudice con gli umani | Spearman ρ vs un audit set umano-etichettato congelato | Ricalibrare il prompt del giudice o sostituire il giudice |
| **Drift di produzione** | Punteggi di produzione live vs punteggi offline sullo stesso modello | Gap del punteggio nel replay delle tracce di produzione | Indagare retrieval / preprocessing / runtime |

Il drift di qualità è quello che la maggior parte delle suite misura; gli altri tre sono dove le regressioni del venerdì pomeriggio di solito si nascondono. Divinci traccia tutti e quattro contro il manifest di baseline, con la suddivisione del punteggio per-slice esposta su ogni PR e un job settimanale di calibrazione del giudice che segnala il drift prima che si accumuli.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Un grafico di 30 giorni che mostra il punteggio aggregato di completamento del task piatto a 0,87 mentre lo slice del dominio medico cala silenziosamente da 0,88 a 0,74">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">La Bugia del Semver, visualizzata — 30 giorni di punteggio di completamento task</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">L'aggregato (verde scuro) rimane piatto. Lo slice medico (rosso) regredisce silenziosamente. I gate aggregati non scattano mai.</text>
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
<text x="0" y="268" text-anchor="middle">g-30</text>
<text x="160" y="268" text-anchor="middle">g-22</text>
<text x="320" y="268" text-anchor="middle">g-15</text>
<text x="480" y="268" text-anchor="middle">g-7</text>
<text x="640" y="268" text-anchor="middle">oggi</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">soglia gate aggregato — 0,89</text>
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
<text x="664" y="46" font-weight="700" fill="#5a7a8f">slice legale</text>
<text x="722" y="46" fill="#5a7a8f">0,910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">aggregato</text>
<text x="722" y="72" fill="#2d5a4f">0,872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">generale</text>
<text x="722" y="98" fill="#7a8a4a">0,863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">slice medico</text>
<text x="664" y="232" fill="#a04848">0,743 oggi · breccia ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">il gate dello slice scatterebbe qui ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Ricostruzione stilizzata del pattern del postmortem Tianpan Sigma<sup><a href="#ref-1">[1]</a></sup> utilizzando la nomenclatura interna degli slice Divinci. I valori specifici sono illustrativi.</figcaption>
</figure>

## Valutazione multi-dimensionale — valuta quattro cose insieme, per slice

Un singolo punteggio composito è un segnale peggiore di quattro punteggi scalari. Facciamo il gating su quattro dimensioni:

- **Completamento del task** — la risposta ha effettivamente risposto alla domanda, valutata da un giudice calibrato contro una rubrica. Slice-aware.
- **Fedeltà** — per qualsiasi risposta che ha fatto riferimento al contesto recuperato, ogni affermazione è grounded in quel contesto. Le allucinazioni appaiono qui per prime.
- **Sicurezza** — correttezza del rifiuto, resistenza al jailbreak, esposizione PII / policy. Quasi sempre fa gating a un pass-rate ≥ 0,99; la sicurezza è un muro rigido, non un trade-off morbido.
- **Budget di latenza** — p95 entro l'SLA dello slice. Un cambio di prompt che ha raddoppiato i token per risposta è una regressione anche se la qualità è migliorata.

Ogni dimensione ha la sua baseline per-slice e la sua soglia per-slice. Non le combiniamo mai in un singolo scalare pesato al momento del gate; le esponiamo come quattro punteggi per slice e blocchiamo su quello che si è mosso oltre la propria soglia per primo. Un modello che ha guadagnato 4 punti di completamento task al costo di 1 punto di fedeltà sullo slice medico è comunque una regressione.

## Quali gate dovrebbero bloccare il deployment di un LLM personalizzato?

Eseguiamo un'architettura a tre layer, ognuno dei quali fa gating su uno stadio diverso della pipeline ([vedi post 1 per la tassonomia degli stadi](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)).

**Layer 1 — Smoke (ogni commit, ~90 secondi).** Venti-trenta casi critici tratti dagli slice ad alto impatto. Intercetta regressioni catastrofiche prima che la suite completa consumi compute. Se lo smoke fallisce, il resto non viene eseguito.

**Layer 2 — Suite completa (ogni PR, ~12 minuti).** Il dataset aureo completo, valutato per slice su tutte e quattro le dimensioni. Spearman ρ slice-aware rispetto al manifest di baseline. La violazione di soglia blocca il merge. Il commento sulla PR elenca esattamente quale slice su quale dimensione si è mosso di quanto, con cinque esempi di casi falliti.

**Layer 3 — Confronto di baseline (release candidate, ~25 minuti).** Il modello candidato viene riprodotto contro le ultime 14 giorni di tracce di produzione — il *replay closed-loop delle tracce di produzione* che abbiamo spedito nel [post 1](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/). Lo stesso giudice calibrato che valuta il dataset aureo valuta anche gli output del replay. Qualsiasi slice i cui punteggi di replay divergano dai punteggi offline di più della propria soglia blocca il rilascio. Questo layer è ciò che intercetta il drift che il dataset aureo non conosce ancora.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Albero decisionale dei gate a tre layer: smoke test su ogni commit, suite completa su ogni PR, replay delle tracce di produzione sui release candidate">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Gate di regressione a tre layer — ogni blocco fallisce fast, ogni layer aggiunge profondità</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① Smoke · ogni commit</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casi: 20–30 critici</text>
<text x="14" y="82">Wall-clock: ~90 s</text>
<text x="14" y="102">Dim: solo task + sicurezza</text>
<text x="14" y="122">Slice: top 3 per volume</text>
<text x="14" y="148" font-weight="600">Blocca:</text>
<text x="14" y="168">fallimenti catastrofici</text>
<text x="14" y="186">output malformati</text>
<text x="14" y="204">violazioni del muro di sicurezza</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">fail-fast — suite completa</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② Suite completa · ogni PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casi: completi ~500</text>
<text x="14" y="82">Wall-clock: ~12 min</text>
<text x="14" y="102">Dim: task / fede / sic / lat</text>
<text x="14" y="122">Slice: tutti stratificati</text>
<text x="14" y="148" font-weight="600">Blocca:</text>
<text x="14" y="168">ρ per-slice &lt; 0,7</text>
<text x="14" y="188">qualsiasi metrica slice sotto soglia</text>
<text x="14" y="208">accordo giudice &lt; 0,65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">commento PR elenca quali</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ Replay · release candidate</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Casi: 14g di tracce live</text>
<text x="14" y="82">Wall-clock: ~25 min</text>
<text x="14" y="102">Dim: tutte e quattro · slice-aware</text>
<text x="14" y="122">Fonte: store tracce produzione</text>
<text x="14" y="148" font-weight="600">Blocca:</text>
<text x="14" y="168">gap di score offline ↔ replay</text>
<text x="14" y="188">drift in slice non ancora nel</text>
<text x="14" y="206">dataset aureo</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">ultimo gate prima del rollout</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">Tutti e tre i layer valutano contro lo stesso manifest di baseline — (model_sha, prompt_sha, retrieval_sha, judge_sha) — quindi un punteggio che si muove identifica <tspan font-weight="600" fill="#1e3a2b">quale</tspan> dimensione è andata in deriva, non solo <tspan font-weight="600" fill="#1e3a2b">che</tspan> qualcosa lo ha fatto.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">I numeri wall-clock sono interni — misurati sui runner CI di produzione Divinci per un cliente rappresentativo con ~500 casi nel dataset aureo e ~14 giorni di tracce di produzione.</figcaption>
</figure>

## Calibra il tuo giudice prima di fidarti di un singolo punteggio che produce

LLM-as-judge è ciò che permette a tutto questo di scalare oltre poche centinaia di casi. È anche dove una suite di regressione smette silenziosamente di funzionare, perché il giudice non ha alcun obbligo di rimanere calibrato man mano che viene aggiornato o man mano che la distribuzione dei tuoi dati si sposta.

Calibriamo ogni prompt del giudice contro un audit set umano-etichettato congelato di almeno 100 casi stratificati attraverso gli stessi slice del dataset aureo, e rieseguiamo la calibrazione settimanalmente. La barra a cui spediamo è **Spearman ρ ≥ 0,7** contro la mediana dei rater umani, con **κ di Cohen ≥ 0,6** sui giudizi binari di sicurezza. Entrambi sono sopra la soglia oltre la quale è stato dimostrato che i giudici in stile MT-Bench seguono i rater umani al livello dell'accordo inter-umano<sup><a href="#ref-2">[2]</a></sup>.

Quando la calibrazione settimanale scende sotto soglia, il giudice viene automaticamente ritirato e l'eval engineer di turno viene paginato. La pipeline di rilascio tiene aperti i candidati invece di farne il gating su un giudice che non sta più misurando ciò che misurava.

```bash
# Esegui il job settimanale di calibrazione del giudice
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

## Il differenziatore Divinci — replay closed-loop delle tracce di produzione

Il gate del Layer 3 è la parte che la maggior parte delle suite di regressione non ha. Il flusso è lo stesso flusso che abbiamo spedito nel post 1, con una specializzazione per il test di regressione: ogni release candidate ha il proprio punteggio sul dataset aureo offline confrontato, slice per slice, con il proprio punteggio su una finestra di 14 giorni di tracce di produzione riprodotte. Il dataset aureo misura ciò che ci aspettavamo che il modello facesse. Il replay misura ciò che il modello avrebbe effettivamente fatto la scorsa settimana.

Quando quei due punteggi divergono di più del gap-budget per-slice, il rilascio viene bloccato. La discrepanza è il segnale: o il dataset aureo non è più rappresentativo (drift di copertura), oppure il candidato si comporta diversamente su tracce modellate dal preprocessing e dal retrieval di produzione (drift di produzione). In entrambi i casi, lo scopri prima degli utenti.

Il giudice che valuta la run offline è lo stesso giudice che valuta la run di replay. L'audit log registra entrambi i set di punteggi, entrambe le versioni del giudice, gli ID delle tracce riprodotte e il gap che ha fatto scattare il blocco. Il gap stesso è il segnale diagnostico più utile che abbiamo, ed è ciò che viene consegnato a chiunque prenda in carico [l'albero diagnostico del post 6](/it/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) successivamente.

## Ancora il dataset aureo con una ricevuta vIndex

Ogni punteggio nella suite è privo di significato se non puoi riprodurlo più tardi. Hashiamo il dataset aureo ad ogni rilascio e concateniamo quell'hash in una ricevuta vIndex insieme allo SHA del modello, allo SHA del prompt, allo SHA del giudice e al record di calibrazione. La ricevuta è ancorabile esternamente — gli auditor possono riprodurre la nostra esatta run di regressione sei mesi dopo e verificare i punteggi che abbiamo dichiarato.

```json
{
  "release_id": "rel_3f1a-2026-05-26",
  "model": { "sha": "0c1f9…", "weights_uri": "r2://models/custom-v7.2", "open_weights": true },
  "prompt": { "sha": "c4a8e…", "template_id": "support-v3.4" },
  "retrieval": { "index_sha": "b21f0…", "embedder": "e5-mistral-7b-instruct" },
  "judge": { "sha": "d8e21…", "rubric_id": "rubric-v7", "spearman_vs_humans": 0.74 },
  "dataset": { "sha": "a90b1…", "n": 512, "slices": 17, "stratified_at": "2026-04-30" },
  "scores": { "aggregate": 0.872, "by_slice": { "/* … */": "/* scalari per-slice */" } },
  "replay": { "trace_window_days": 14, "n_traces": 8430, "max_gap": 0.018 },
  "vindex_anchor": "sha256:f0bfd2…",
  "verifiable_at": "https://vIndex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**Avvertenza open-weights.** La ricevuta sopra porta la provenienza dei pesi solo quando il modello è open-weights — vIndex ancora i byte effettivi dei pesi. Per i modelli supportati da API closed (modelli gestiti OpenAI / Anthropic / Google), la ricevuta porta comunque la catena decisionale — ogni punteggio dei gate, ogni risultato del giudice, il record di calibrazione — ma il campo dei pesi è vuoto, e non puoi verificare indipendentemente l'artefatto del modello. Lo diciamo nella ricevuta e nella [documentazione di compliance](/it/compliance/) in modo che gli auditor non abbiano una falsa impressione. I rilasci che beneficiano di più di una catena vIndex completa sono quelli in cui controlli i pesi.

## Una tempistica di implementazione in quattro fasi che abbiamo effettivamente spedito

I team che provano a spedire l'architettura completa nella prima settimana si bloccano sul tooling. L'ordine sotto è l'ordine che funziona.

**Fase 1 — Baseline (settimana 1).** Estrai un campione stratificato degli ultimi 30 giorni di tracce di produzione. Fai etichettare a mano da due ingegneri il completamento del task su 100 casi ciascuno. Calcola l'accordo inter-rater (obiettivo κ di Cohen ≥ 0,6). Il numero che ottieni è la tua baseline umana di partenza; tutto il resto viene calibrato contro questo.

**Fase 2 — Harness (settimane 2–3).** Allestisci l'harness di valutazione sul dataset da 100 casi. Aggiungi un giudice calibrato contro le tue etichette umane. Verifica che l'harness riproduca i punteggi umani entro ρ ≥ 0,7. La maggior parte dei team scopre che il proprio primo prompt del giudice fallisce in questo e lo riscrive due volte — è normale.

**Fase 3 — Gate (settimane 3–4).** Cabla l'harness nel CI come avvertimento, non come blocco. Osservalo per due settimane. Le soglie che scopri osservando i tassi di falsi positivi sono le uniche soglie che sopravvivono. Promuovi al blocking solo quando il tasso di falsi positivi è sotto il 5%.

**Fase 4 — Loop di replay (continuo).** Una volta che i gate stanno bloccando in modo affidabile, abilita il layer di replay delle tracce di produzione. È qui che il gap di copertura degli slice viene a galla, ed è qui che ogni postmortem inizia ad aggiungere casi indietro nel dataset aureo.

## Cosa questo non risolve

Tre limitazioni oneste, nello stesso modo in cui le abbiamo inquadrate in ogni post di questa serie.

1. **Il drift della suite è lavoro senza fine.** Il test di regressione è infrastruttura, non un progetto. Il dataset aureo deve essere ristratificato ogni trimestre, il giudice ricalibrato ogni settimana, i budget di soglia ri-tarati ad ogni postmortem. Non esiste una versione di questo in cui spedisci una suite e te ne vai.
2. **Un giudice perfettamente calibrato è comunque un modello.** Spearman ρ = 0,74 contro i rater umani significa che circa un quarto delle chiamate del giudice non concorda con la mediana umana. Quel disaccordo residuo è il rumore di fondo su ogni punteggio. Lo esponiamo esplicitamente in ogni report di rilascio; i team che dimenticano che è lì verranno sorpresi da esso prima o poi.
3. **I backing API closed limitano quanto puoi verificare.** Con un modello API closed, la suite di regressione misura il comportamento ma non può verificare la provenienza dei pesi. Se hai bisogno di piena riproducibilità — industrie regolamentate, deployment soggetti ad audit — il trade-off è sulla scelta del modello, non sulla suite.

## Prossimamente

Il post 8, l'ultimo di questa serie, chiude il loop dentro il CI. Dove questo post e il post 5 trattavano di cosa gira ai gate, il prossimo riguarda il layer CI che produce i candidati che i gate valutano in primo luogo — valutazione pre-merge, contract test per i template dei prompt e come dimensionare la flotta CI per una suite di eval da 12 minuti senza far saltare il budget. È il layer ingegneristico sotto tutto ciò di cui abbiamo scritto finora.

## FAQ

**Qual è la differenza tra valutazione di un LLM e test di regressione di un LLM?**

La valutazione misura se un modello soddisfa una barra di qualità in un momento nel tempo, rispetto a una rubrica assoluta. Il test di regressione misura se un candidato si comporta allo stesso modo di una baseline congelata, per slice, attraverso più dimensioni. La baseline è ciò che lo rende test di regressione — Divinci spedisce entrambi, e la modalità di regressione fissa (model_sha, prompt_sha, judge_sha, dataset_sha) in modo che un punteggio mosso identifichi quale input si è mosso.

**Quanti casi dovrebbe avere un dataset aureo?**

Meno di quanti pensi, stratificati meglio di quanto pensi. Abbiamo spedito una copertura di regressione utile con 200 casi su cinque slice ben definiti e visto dataset da 5.000 casi che si perdevano tutto ciò che contava perché non erano stratificati. Inizia a 200, stratificati, poi fai crescere il bucket di replay caso per caso a partire dai postmortem.

**Dovrei usare revisori umani o LLM-as-judge?**

Entrambi, con gli umani che calibrano il giudice. Gli umani non possono tenere il passo con il volume di cui un gate CI del ciclo di rilascio ha bisogno per fare scoring. Il giudice riempie il volume, gli umani calibrano il giudice — misurato settimanalmente con Spearman ρ ≥ 0,7. L'uno da solo o l'altro da solo è una modalità di fallimento.

**Come testare per output non deterministici?**

Valuta la distribuzione, non la stringa. Valuta con una rubrica che il giudice possa applicare attraverso le formulazioni, ed esegui ogni input da tre a cinque volte a temperatura > 0 in modo che il punteggio slice-aware sia su una distribuzione di completamenti piuttosto che su un singolo campione. Stringi la temperatura solo per i casi che hanno genuinamente bisogno di output deterministici (chiamate a strumenti con output strutturato, classificazione).

**Quali metriche dovrei prioritizzare per il primo quality gate del CI?**

Completamento del task e un gate di sicurezza. Entrambi per-slice. Aggiungere più dimensioni prima che le prime due siano calibrate produce rumore; i team che spediscono di più di solito finiscono per fare gating sul rumore. Aggiungi la fedeltà dopo quando attivi il retrieval; aggiungi la latenza una volta che le prime due sono stabili.

## Riferimenti

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 aprile 2026. La modalità di fallimento 2026 nominata per l'analisi di regressione slice-aware; i punteggi aggregati rimangono piatti mentre uno slice a basso volume regredisce silenziosamente.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Evidenza empirica che i giudici LLM forti concordano con i rater umani approssimativamente ai livelli dell'accordo inter-umano (≈ 80%) su task aperti, con modalità di fallimento riportate che gli audit calibrate-against-humans sono progettati per rilevare.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. Il risultato fondante sul catastrophic forgetting nelle reti neurali fine-tuned — perché un LLM personalizzato fine-tuned debba essere testato in regressione per la perdita di capacità generale, non solo per il guadagno sul task target.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> Il contrasto closed-API: gate su metriche infrastrutturali (latenza, errori, CPU) piuttosto che sulla qualità semantica per-slice.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. Il coefficiente di correlazione di rango che ancora il gate slice-aware — robusto al drift della scala di scoring nel giudice, che è la proprietà di cui avevamo bisogno.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> La baseline trasversale al settore per "con quale frequenza i deploy causano incidenti" e "quanto velocemente ti riprendi". Le suite di regressione che bloccano al gate spingono in basso la prima metrica; il rollback istantaneo ([post 5](/it/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) spinge in basso la seconda.
  </li>
</ol>
