+++
title = "Le 12 capacità di QA e gestione del rilascio che ogni piattaforma LLM personalizzata dovrebbe offrire"
description = "Una checklist capacità per capacità per valutare le piattaforme di rilascio LLM: gate per fetta, giudici calibrati, rollback atomico, ricevute con hash-chain — cosa è saturato, cosa manca e come si dividono i campi."
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "Abbiamo passato in rassegna dodici piattaforme di rilascio LLM prima di costruire la nostra. Il mercato si divide in tre campi che non si toccano del tutto — strumenti di eval-CI, strumenti di canary di serving e strumenti di observability — e la cucitura mancante tra di essi è esattamente quella di cui ha bisogno il rilascio di un cliente. Questo post è la checklist di capacità nata da quella ricognizione: 12 test specifici che puoi applicare a qualsiasi piattaforma, inclusa la nostra."
+++

*Appunti dal ciclo di rilascio — Parte III*

---

Un anno fa, prima di iniziare a costruire la nostra pipeline di rilascio, ci siamo seduti e abbiamo elencato ogni capacità di QA-e-rilascio che pensavamo una piattaforma LLM seria dovesse offrire. Abbiamo poi valutato dodici altre piattaforme rispetto a quella lista — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core. Nessuno aveva tutte e dodici. Le combinazioni che *erano* offerte si raggruppavano in tre campi che non si toccavano del tutto.

Questo post è la lista di capacità che ne è risultata, resa portabile. È organizzata in base a quale dei nostri quattro stadi della pipeline ciascuna capacità abita — **Registra → Verifica → Distribuisci → Osserva** — in modo da comporsi pulitamente con l'[architettura della pipeline](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) e le [modalità di fallimento](/it/blog/10-ci-cd-release-failures-in-custom-language-models/) di cui abbiamo scritto. Se stai valutando strumenti, percorri la lista dall'alto verso il basso per ciascun candidato; quelli con i divari più profondi ti diranno a quale campo appartengono.

## I tre campi (così sai cosa stai guardando)

Prima della checklist vera e propria, la forma del mercato nel 2026:

- **Campo Eval-CI** — Braintrust, Humanloop, Patronus. Eseguono valutatori automatizzati al merge della PR. Bloccano i merge difettosi. Non toccano mai il traffico live. Forti sulle capacità 4–6; assenti sulle 7–12.
- **Campo Serving-canary** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core. Suddividono il traffico, monitorano metriche infrastrutturali, fanno auto-rollback su allarmi in stile CloudWatch. Forti su 1, 7, 9; assenti sul lato qualità di 8 e 10–12.
- **Campo Observability** — Arize Phoenix, Confident AI, Deepchecks. Guardano la produzione, allertano gli umani, escalano. Forti sulla 10 (monitoring), ma non *applicano* nulla — l'alerting non è auto-rollback.

Il divario tra questi campi — tra "ha passato il CI" e "canary live valutato sulla qualità, non solo sulla latenza" — è la parte che ognuno deve colmare a mano. Chiudere quel divario è l'affermazione portante di questo post.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Diagramma di Venn dei tre campi delle piattaforme LLM. Il campo Eval-CI (Braintrust, Humanloop, Patronus) sta a sinistra e copre la valutazione offline al merge della PR. Il campo Serving-canary (SageMaker, KServe, Vertex, BentoCloud, Seldon) sta a destra e copre la suddivisione del traffico con rollback su metriche infrastrutturali. Il campo Observability (Arize, Phoenix, Confident, Deepchecks) sta in basso e copre monitoring e alerting senza enforcement. I tre cerchi si sovrappongono a coppie in sottili spicchi, ma la regione centrale dove tutti e tre si incontrano è vuota. Quel centro vuoto è la cucitura mancante di cui parla questo post — una decisione di rilascio guidata da qualità per fetta, applicata atomicamente sul traffico live.">
<title>I tre campi e il centro mancante</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">I tre campi che non si incontrano del tutto</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">Ogni campo possiede un pezzo. Il centro è dove ogni team fa da ponte a mano.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">Eval-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">gate di eval offline</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">al merge della PR</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">Canary di serving</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">suddivisione traffico +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">rollback su metriche infra</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">Observability</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">monitor + alert (nessun enforcement)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">cucitura</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">mancante</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">La cucitura mancante: gate di qualità per fetta → rollback atomico guidato dalla qualità dell'output, non da metriche infra.</p>

## Stadio ① — Registra

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTRA</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Livello di manifest immutabile. Attribuzione del fallimento tramite SHA.</span>
  </div>
</div>

### Capacità 1. Manifest di rilascio immutabile con uno SHA content-addressable

Cos'è: un rilascio non è un file di pesi del modello. Un rilascio è un bundle immutabile di *tutto* — artefatto del modello, template del prompt, regole di routing, versione del dataset, versione del preprocessing — indirizzato da un singolo SHA-256. Due persone che distribuiscono "lo stesso rilascio" devono produrre lo stesso SHA, altrimenti la pipeline rifiuta.

Perché conta: senza questo, "quale modifica ha rotto la produzione?" è una domanda senza risposta quando lo stato è suddiviso tra tre sistemi. L'outage di Atlassian dell'aprile 2022<sup><a href="#ref-1">[1]</a></sup> ha richiesto dodici ore per sito per recuperare proprio perché lo stato viveva in sistemi versionati indipendentemente che dovevano essere coordinati di nuovo in accordo.

Chi lo offre: il campo serving-canary in parte (modello + routing); i model registry (MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>) in parte (solo artefatto del modello). Quasi nessuno include il **template del prompt** nello SHA, che è esattamente il campo che cambia più spesso.

### Capacità 2. Controllo di versione atomico su tutti i componenti del rilascio

Cos'è: lo swap dal rilascio A al rilascio B fa scattare *tutto* in una sola istruzione — pesi e prompt e routing e dataset e preprocessing — non come cinque modifiche separate sulla dashboard.

Perché conta: gli swap parziali creano finestre di comportamento indefinito. Se il prompt si aggiorna ma la regola di routing no, ogni richiesta che arriva al nuovo prompt con la vecchia classe di routing si trova in uno stato che nessuno ha pianificato.

Chi lo offre: nessuno completamente. Il campo serving-canary fa swap atomico dell'immagine del modello; il prompt e il routing tipicamente vivono altrove. Lo swap guidato da manifest è da dove viene l'affermazione del rollback atomico<sup><a href="#ref-5">[5]</a></sup> di Divinci.

### Capacità 3. Parità tra ambiente di training e di serving

Cos'è: la pipeline di preprocessing usata durante la valutazione al gate è la *stessa* preprocessing che usa il server di produzione. Se divergono, ogni numero offline è una bugia.

Perché conta: lo skew tra training e serving è uno dei [dieci fallimenti di rilascio](/it/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) di cui abbiamo scritto. Il sintomo è "rende bene in eval, si comporta come un modello diverso in produzione." La cura è registrare il preprocessing nel manifest e fare il gate contro la versione di preprocessing di produzione.

Chi lo offre: i framework di containerizzazione (BentoML, KServe) ottengono credito parziale colocando il preprocessing con il serving. Nessuno di loro lega il preprocessing nell'input del gate di eval.

## Stadio ② — Verifica

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">VERIFICA</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">ρ di Spearman per fetta vs grader ancorato all'umano.</span>
  </div>
</div>

### Capacità 4. Gate di qualità per fetta / per dominio

Cos'è: la decisione del gate consuma punteggi *per fetta* — redazione di contratti, interpretazione statutaria, licenza di IP — non un singolo aggregato. Qualsiasi singola fetta che scende sotto la propria soglia marca il rilascio come `gate_fail`, indipendentemente da come appare la media.

Perché conta: i punteggi aggregati diluiscono le regressioni localizzate. L'analisi *Semver Lie* di Tianpan<sup><a href="#ref-3">[3]</a></sup> nomina questa come la modalità dominante di fallimento di rilascio LLM nel 2026: un modello che migliora in media mentre crolla silenziosamente su una classe di percorsi utente.

Chi lo offre: **nessun altro nel 2026**. Gli strumenti eval-CI — Braintrust, Humanloop, Patronus — valutano contro una singola rubrica globale o una lista piatta di compiti. Non espongono una soglia per fetta o un override slice-blind. Questo è il primo punto in cui i campi non si incontrano.

### Capacità 5. Giudice calibrato ancorato all'umano (ρ di Spearman vs valutazioni umane)

Cos'è: il giudice non è un generico LLM-come-giudice. È un giudice LLM la cui ρ di Spearman rispetto a un panel di esperti di dominio è misurata e configurata per fetta. Il giudice è selezionato perché i suoi rank corrispondono ai rank umani, non perché ha una buona reputazione.

Perché conta: MT-Bench<sup><a href="#ref-6">[6]</a></sup> mostra che GPT-4-come-giudice concorda con gli umani >80% complessivamente, con varianza per categoria dal coding (86%) alla scrittura (36–44%). L'"accordo complessivo" nasconde le fette in cui il giudice è inaffidabile. Calibrare il giudice per fetta è l'unico modo onesto per rendere lo scoring automatizzato degno di fiducia.

Chi lo offre: Braintrust, Humanloop, Patronus eseguono valutatori-giudice. Nessuno di loro richiede, espone o persiste una calibrazione di Spearman ancorata all'umano per fetta. La pipeline di calibrazione di Divinci è documentata in [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/).

### Capacità 6. Percorso di override con motivazione scritta obbligatoria

Cos'è: forzare l'override di un fallimento del gate è permesso (cold start, regressioni accettate, ecc.) ma richiede due campi — `forceGateOverride: true` E `overrideReason: "..."`. La motivazione finisce nell'audit trail insieme all'ID utente. Nessun override anonimo.

Perché conta: i gate di governance non sono una funzionalità di compliance separata; sono una proprietà dello stadio del gate stesso. L'audit trail deve rispondere non solo a "questo override è stato usato?" ma a "qual era la motivazione al momento?" — perché tu-del-futuro hai bisogno di leggerla.

Chi lo offre: gli strumenti eval-CI hanno flag; nessuno di loro richiede la motivazione come parte strutturale dell'override.

## Stadio ③ — Distribuisci

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">DISTRIBUISCI</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary al 5% → 25% → 100% con un monitor di qualità a ogni step.</span>
  </div>
</div>

### Capacità 7. Canary multi-checkpoint con dwell

Cos'è: il traffico si sposta dallo 0% alla produzione attraverso almeno tre checkpoint — tipicamente **5% → 25% → 100%** — e si trattiene a ciascuno per un tempo di dwell configurato o un conteggio di richieste configurato, qualunque dei due venga *dopo*. Nessun 0%→100% istantaneo.

Perché conta: i bug a coda lunga emergono su scala. Un bug che colpisce lo 0,3% delle conversazioni è invisibile su una eval da 100 prompt ed evidente al 5% del traffico di produzione. Il dwell è ciò che dà al canary il tempo di vedere la coda lunga.

Chi lo offre: il campo serving-canary lo offre. AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> documenta un `TerminationWaitInSeconds` di default di 600 (dieci minuti). KServe, BentoCloud, Seldon e Vertex espongono tutti configurazioni di canary multi-step simili. Questa è la capacità saturata.

### Capacità 8. Monitor di qualità dell'output a ogni checkpoint del canary

Cos'è: a ogni checkpoint, la pipeline controlla tre monitor prima di avanzare — latenza p95, tasso 5xx, **e** un punteggio di qualità dell'output calcolato dallo stesso giudice calibrato della capacità 5. Latenza e 5xx da soli non bastano.

Perché conta: è qui che i campi non si incontrano di nuovo. SageMaker, KServe, Vertex, BentoCloud, Seldon guardano tutti latenza e tasso di errore. Nessuno di loro offre un monitor di qualità dell'output per checkpoint — perché non hanno un giudice calibrato contro cui valutare. Gli strumenti eval-CI hanno il giudice ma non stanno sul traffico.

Chi lo offre: nessuno completa il ponte. L'infrastruttura di canary con dwell esiste nel campo serving; il giudice calibrato esiste nel campo eval-CI; non abbiamo visto nessuno connetterli.

### Capacità 9. Halt automatico su violazione di qualità

Cos'è: un checkpoint del canary che fallisce sulla qualità dell'output si ferma automaticamente. La promozione non avanza. Non serve chiamare un umano per fermare il rollout.

Perché conta: gli umani non sono nel loop nella scala temporale in cui si muovono i rollout. Quando arriva un ticket cliente, il checkpoint al 25% è finito e la promozione al 100% è avvenuta.

Chi lo offre: il campo serving-canary ferma su metriche infrastrutturali. L'halt su metrica di qualità è la parte che richiede l'esistenza della capacità 8.

## Stadio ④ — Osserva

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OSSERVA</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Replay continuo delle tracce → rollback atomico in ~12 s.</span>
  </div>
</div>

### Capacità 10. Replay continuo delle tracce di produzione attraverso il candidato

Cos'è: dopo che il canary promuove al 100%, l'osservatore continua a girare. Campiona le tracce di produzione recenti, le replaya attraverso il rilascio *candidato* (ora attivo), le valuta con il giudice calibrato ed emette un punteggio di qualità al minuto. Continuo, non periodico.

Perché conta: i cali silenziosi di qualità — il modello tergiversa, allucina con sicurezza una data, rifiuta dove non dovrebbe — non muovono mai latenza o 5xx. L'unico segnale che ricevi per questi è il ticket cliente, che è il peggior segnale possibile. Un monitor di qualità continuo li cattura in minuti a una cifra.

Chi lo offre: **nessuno.** Il campo observability (Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>) monitora l'output di produzione ma non applica. Il campo serving-canary guarda l'infra. Il campo eval-CI non sta sul traffico. Il loop chiuso — tracce di produzione → giudice calibrato → enforcement — è la cucitura mancante.

### Capacità 11. Rollback atomico in secondi, non minuti

Cos'è: quando l'osservatore scatta (tre minuti consecutivi sotto soglia, diciamo), il rollback parte automaticamente. Il rollback ripunta il routing a `previous_release` dal manifest. Poiché il rilascio precedente era un manifest completamente bundled, ogni componente fa flip atomicamente. End-to-end inclusi il drain delle richieste in volo su un servizio a ~100 repliche: circa 12 secondi<sup><a href="#ref-5">[5]</a></sup>.

Perché conta: l'outage di Cloudflare del giugno 2022<sup><a href="#ref-8">[8]</a></sup> ha richiesto 44 minuti per essere annullato. La causa non era il revert in sé — era che gli ingegneri si pestavano i piedi a vicenda sui revert perché lo stato era suddiviso. Il rollback guidato da manifest è a singola istruzione; non può avere quella modalità di fallimento.

Chi lo offre: il campo serving-canary offre rollback infrastrutturale veloce (attivato da allarme, flip blue-green). La differenza architetturale è se il *trigger* sia solo infra o consapevole della qualità (capacità 10).

### Capacità 12. Ricevuta di compliance con hash-chain, ancorabile esternamente

Cos'è: ogni decisione di rilascio — register, gate-pass, gate-fail, gate-override, checkpoint-promote, auto-rollback — emette una ricevuta JSON-con-SHA-256, con hash-chain alla ricevuta precedente per questo cliente e alla ricevuta precedente per questo rilascio. La catena è ancorata esternamente secondo una pianificazione che il cliente configura.

**Avvertenza open-weights.** Quando il rilascio è sostenuto da un modello open-weights (Gemma, Qwen, Llama, Mistral, GPT-OSS), la ricevuta incorpora un'[attestazione di peso vindex](/it/compliance/) — una prova che i pesi attivi al momento della decisione sono i pesi che il manifest ha registrato. Quando il rilascio è sostenuto da un modello closed-API (OpenAI, Anthropic, Google tramite API opache), la ricevuta copre la catena delle decisioni ma non può rivendicare la provenienza dei pesi, perché il fornitore non li espone. La ricevuta lo dice esplicitamente. Questo è il limite di ciò che è verificabile.

Perché conta: le industrie regolamentate oggi ottengono *log*. L'EU AI Act e il NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> chiedono sempre più *prove*. Una ricevuta con hash-chain è la differenza tra "abbiamo un log" e "un auditor può verificare la catena senza fidarsi del nostro log."

Chi lo offre: nessun altro. Questa è la parte della differenziazione che mappa direttamente sulla [pagina compliance](/it/compliance/) esistente di Divinci — stesso formato di ricevuta, esteso alle decisioni di rilascio.

## Le 12 capacità, per campo di piattaforma

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrice delle 12 capacità per campo di piattaforma. Divinci ha tutte e 12. Il campo Eval-CI (Braintrust, Humanloop, Patronus) ha la 5 e la 6. Il campo Serving-canary (SageMaker, KServe, BentoCloud, Vertex, Seldon) ha 1 parziale, 2 parziale, 7, 9 e 11 su metriche infrastrutturali. Il campo Model-registry (W&B Models, MLflow, LangSmith) ha 1 parziale e 2 parziale. Il campo Observability (Arize, Phoenix, Confident, Deepchecks) ha la 10 in forma solo-monitor. Nessun altro ha la 4 gate per fetta, la 5 giudice calibrato ancorato all'umano, la 8 monitor di qualità del canary, la 10 replay delle tracce a loop chiuso con enforcement, o la 12 ricevute con hash-chain.">
<title>Le 12 capacità, per campo</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Quale campo offre quale capacità</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = la offre. ◐ = parziale (solo infra, o solo registry). ✗ = non la offre. Sei capacità mancano in tutti gli altri campi.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">Capacità</text>
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
<text x="40" y="146">1. SHA del manifest immutabile</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. Swap di versione atomico (tutti i componenti)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. Parità ambiente training-serving</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. Gate di qualità per fetta / per dominio</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. Giudice calibrato ancorato all'umano</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. Percorso di override con motivazione obbligatoria</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. Canary multi-checkpoint con dwell</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. Monitor di qualità dell'output a ogni checkpoint</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. Auto-halt su violazione di qualità</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. Replay tracce di produzione a loop chiuso</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. Rollback atomico in secondi</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. Ricevuta di compliance con hash-chain</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">Capacità 4, 5, 8, 10, 12 evidenziate: queste sono le cinque senza altri operatori in questa ricognizione. Le altre si raggruppano in un campo o nell'altro.</text>
</svg>
</figure>

Lo schema è il punto. Cinque capacità — **gate per fetta, giudice calibrato, monitor di qualità del canary, replay a loop chiuso, ricevuta con hash-chain** — appaiono come ✗ in ogni altro campo. Quella è la cucitura. Le altre sette si distribuiscono tra i campi in modi che rendono ciascun campo internamente coerente ma mutuamente incompleto.

## Cosa rende il QA dei language model personalizzati diverso da quello del software?

Gli LLM non sono deterministici, neppure a temperatura zero — il batching e le differenze hardware causano variazione nell'output. Quella singola proprietà rompe la maggior parte delle assunzioni su cui era costruito il QA tradizionale:

- **Non puoi scrivere asserzioni `expect(output).toEqual(X)`.** Ti serve una valutazione consapevole della distribuzione che consuma correlazione di rank rispetto a un grader ancorato all'umano, non uguaglianza rispetto a una fixture. Questa è la capacità 5.
- **Un modello può passare un check di qualità aggregato pur fallendo su una fetta.** Ecco perché la capacità 4 esiste separatamente. Se la tua eval non sa fare slicing, non può catturare regressioni slice-aware.
- **I fallimenti di qualità sono silenziosi al livello infrastrutturale.** Latenza e 5xx restano puliti mentre il modello tergiversa o allucina. Le capacità 8 e 10 esistono perché nessun monitor lato-infrastruttura può vedere questo.
- **Il rollback non è opzionale.** Poiché le modalità di fallimento sono probabilistiche e alcune sono silenziose, il percorso di rollback deve essere infrastruttura primaria, non un piano di riserva. La capacità 11 è ciò che rende raggiungibili i "12 secondi"; la capacità 2 è ciò che li rende corretti.

Una piattaforma di QA-e-rilascio che non tiene conto di questi quattro fatti sta offrendo CI/CD per software deterministico con un logo LLM incollato sopra. Il mercato lo fa parecchio.

## Come supportano gli audit trail la compliance AI, in pratica?

Il gap di compliance più comune che vediamo — quando un auditor arriva sei mesi dopo il deployment e chiede "quale versione del modello stava girando il 15 marzo, e chi ha approvato quel rilascio?" — non è "non abbiamo log." È "abbiamo log su cinque sistemi e le timeline non si allineano."

Una ricevuta di compliance (capacità 12) risolve questo rendendo il log stesso un artefatto portabile: con hash-chain, fonte unica, ancorabile esternamente. Un auditor può verificare la catena senza fidarsi della nostra infrastruttura. Questa è la differenza tra "abbiamo i record" e "i record sono dimostrabili."

Per i sostegni di modelli open-weights, la ricevuta include anche un'attestazione del peso — una prova crittografica che i pesi attivi sono i pesi che il manifest ha registrato. Questo soddisfa le richieste più difficili (diritto all'oblio dell'Articolo 17 del GDPR, provenienza nell'EU AI Act) perché puoi provare *non solo cosa è stato distribuito* ma *che i pesi sottostanti sono ciò che dichiarano di essere*.

Per i sostegni closed-API — quando il modello è servito dietro un'API opaca e i pesi non sono esposti — la ricevuta copre la catena delle decisioni ma non può rivendicare la provenienza dei pesi. Lo diciamo esplicitamente nella ricevuta invece di implicare una prova che non possiamo fornire. È il limite di ciò che è verificabile quando il fornitore tiene i pesi all'interno.

## Cosa questa checklist non risolve

Tre limiti onesti:

**Le capacità non sono caselle da spuntare fini a se stesse.** Una piattaforma che offre tutte e dodici male è peggio di una che ne offre otto bene. La checklist è un punto di partenza per la valutazione, non un punteggio per RFP fornitori.

**L'istantanea competitiva è del 2026 e cambierà.** Tra sei mesi alcuni dei segni ✗ qui sopra si capovolgeranno — i concorrenti leggeranno i postmortem e chiuderanno i divari. Se leggi questo post nel 2027, fai tu stesso l'audit dei segni prima di crederci.

**Alcune capacità dipendono da altre.** La capacità 8 (monitor di qualità del canary) richiede la capacità 5 (giudice calibrato). La capacità 10 (replay delle tracce a loop chiuso) richiede entrambe. Una piattaforma che offre 8 senza 5 sta offrendo un placebo — il monitor del canary esiste ma non è ancorato a nulla di degno di fiducia.

## FAQ

### Qual è la capacità di QA più importante per i rilasci di LLM personalizzati?

Un gate di qualità per fetta (capacità 4) — significa che la decisione di rilascio consuma punteggi di Spearman per dominio rispetto a un grader ancorato all'umano, non un singolo aggregato globale. I punteggi aggregati diluiscono le regressioni localizzate, e le regressioni localizzate sono la modalità dominante di fallimento di rilascio LLM del 2026<sup><a href="#ref-3">[3]</a></sup>. Se puoi offrire solo una capacità da questa lista, offri la 4. Poi offri la 5, che è ciò che rende la 4 degna di fiducia.

### Come si valuta una piattaforma di QA per LLM senza farla girare per sei mesi?

Applica la checklist a 12 capacità qui sopra alla documentazione del fornitore, con due test specifici. Primo, chiedi al fornitore di mostrarti l'output del gate *per fetta* per uno dei suoi clienti di riferimento — se hanno solo punteggi aggregati, non hanno la capacità 4. Secondo, chiedi cosa innesca il loro auto-rollback — se la risposta è "latenza, tasso di errore, e i nostri allarmi", sono nel campo serving-canary e la capacità 10 manca.

### Qual è la differenza tra strumenti eval-CI e strumenti di gestione del rilascio?

Gli strumenti eval-CI (Braintrust, Humanloop, Patronus) eseguono valutatori automatizzati al merge della PR e bloccano i merge difettosi. Non toccano mai il traffico live. Gli strumenti di gestione del rilascio (questa categoria) possiedono il manifest del rilascio, il canary, l'osservatore e il percorso di rollback. L'eval-CI è *parte di* un workflow di gestione del rilascio ma non ne è un sostituto. Molti team offrono uno dei due e scoprono il divario quando una regressione che è passata al CI colpisce silenziosamente la produzione.

### Quanto veloce dovrebbe essere il rollback?

Nell'ordine di grandezza dei secondi, non dei minuti. Il tempo medio di rollback sulla pipeline di Divinci è di circa 12 secondi — questo è il drain delle richieste in volo su un servizio a ~100 repliche, non lo swap del manifest in sé, che è sub-secondo. Confronta con l'incidente Cloudflare del giugno 2022<sup><a href="#ref-8">[8]</a></sup>, che ha richiesto 44 minuti per essere annullato perché lo stato era suddiviso tra sistemi. La decisione architetturale che rende possibile secondi-non-minuti è il manifest di rilascio bundled (capacità 1 e 2).

### Perché le ricevute di compliance contano più dei log di compliance?

Un log è qualcosa che hai scritto. Una ricevuta è qualcosa che un auditor può verificare senza fidarsi di te. L'EU AI Act e il NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> distinguono sempre più tra i due — "documentato" non è la stessa cosa di "dimostrabile", e la direzione regolatoria va verso quest'ultimo. Una ricevuta con hash-chain, ancorata esternamente, è la tecnologia disponibile più semplice per superare quella linea.

## Riferimenti

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Citato per la capacità 1 — che aspetto ha lo stato-sparso-tra-sistemi su scala.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> e <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. Il lato solo-artefatto-del-modello della capacità 1. Nessuno dei due offre la registrazione del template del prompt.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (aprile 2026). Nomina la modalità di fallimento per regressione slice-aware come lo schema dominante del 2026. Compagno: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Riferimento per la capacità 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> e <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> di 600 (dieci minuti), massimo 1800 (trenta minuti). Il canary standard su metriche infrastrutturali con cui il post si contrappone sulle capacità 8 e 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interno — flip atomico del routing tramite manifest di rilascio.</strong> Il tempo di rollback di ~12 secondi è il drain delle richieste in volo su un servizio a ~100 repliche; lo swap del manifest in sé è sub-secondo. Il numero viene dal nostro servizio, non da un benchmark. L'architettura che lo rende possibile è il manifest bundled della capacità 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Varianza per categoria di LLM-come-giudice.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% di accordo complessivo GPT-4-vs-umano, con varianza per categoria dal coding (86%) alla scrittura (36–44%). Riferimento per la capacità 5 — perché un giudice calibrato deve essere per fetta.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Confronto del campo observability.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Il confronto degli strumenti di observability 2026 di Confident AI</a>. Tutti offrono monitoring e alerting; nessuno applica il rollback. Riferimento per l'inquadramento "monitor senza enforcement" della capacità 10.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Outage Cloudflare giugno 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." 44 minuti da "sappiamo cosa annullare" al revert completo, in parte perché gli ingegneri si pestavano i piedi a vicenda sui revert. Riferimento per la capacità 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — le quattro funzioni core su cui la capacità 12 si mappa. Più i requisiti di provenienza dell'EU AI Act su <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Riferimento per la capacità 12.
</li>
</ol>

---

*Prossimo nella serie:* **Validare e rilasciare LM personalizzati nei settori regolamentati.** La checklist di capacità qui sopra è generica. Il prossimo post è specifico: l'EU AI Act, l'Articolo 17 del GDPR, l'HIPAA e il NIST AI RMF — cosa chiede ciascuno a un processo di rilascio, quali capacità qui sopra coprono quale requisito, e dove la divisione open-weights / closed-weights cambia davvero la storia della compliance.
