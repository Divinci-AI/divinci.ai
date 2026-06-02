+++
title = "10 fallimenti di rilascio CI/CD in modelli linguistici personalizzati — e quale stadio della pipeline cattura ciascuno"
description = "Dieci failure mode reali nei release LM, ognuna mappata allo stadio Divinci — Register, Gate, Roll, Observe — che la cattura prima degli utenti."
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
summary = "Abbiamo spedito abbastanza rilasci di LM personalizzati attraverso la pipeline a quattro stadi di Divinci da avere una lista delle dieci modalità di fallimento più dannose che continuavamo a incontrare. Tre di queste sono regressioni per fetta che un gate aggregato avrebbe spedito. Altre due sono cali silenziosi di qualità che un canary su metrica infrastrutturale avrebbe promosso. Il resto è il tipo di errore che ogni pipeline di rilascio dovrebbe catturare — li elenchiamo perché vale la pena dire ad alta voce quali, di fatto, una pipeline con gate aggregato cattura da sola."
+++

*Appunti dal ciclo di rilascio — Parte II*

---

Il [primo post di questa serie](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) ha illustrato la pipeline di rilascio a quattro stadi che spediamo — **Register → Gate → Roll → Observe**. Questo post sono le ricevute: dieci modalità di fallimento specifiche che ora catturiamo con essa, com'è apparsa ciascuna nella pratica e quale stadio della pipeline le ha impedito di raggiungere la produzione.

La lista è organizzata per stadio, non per gravità, perché lo stadio ti dice *dove investire* se stai costruendo qualcosa di simile da te. Se il tuo gate è l'anello debole, sei dei dieci fallimenti qui sotto continueranno a colpirti. Se il tuo observer è l'anello debole, due di essi ti colpiranno silenziosamente — il che significa che l'unico segnale che mai riceverai sarà un reclamo cliente, che è il peggior segnale possibile.

Una pipeline che cattura tutti e dieci non è una lista di feature. È un piccolo numero di decisioni architetturali prese in modo coerente. Ogni fallimento qui sotto nomina quale decisione si applica.

## Come leggere questa lista

Ogni fallimento è etichettato con lo stadio che lo cattura:

- **① REGISTER** — il livello del manifesto. Ferma i fallimenti in cui non potevi sapere quale cambio aveva rotto la produzione perché lo stato era distribuito su sistemi diversi.
- **② GATE** — Spearman per dominio contro un giudice calibrato ancorato all'umano. Ferma i fallimenti che si nascondono dentro i punteggi aggregati.
- **③ ROLL** — canary al 5% → 25% → 100% con un monitor di qualità a ogni checkpoint. Ferma i fallimenti che emergono solo su scala.
- **④ OBSERVE** — replay continuo delle tracce attraverso il candidato, valutato dal giudice del gate. Ferma i cali silenziosi di qualità che la latenza e i 5xx non vedono mai.

Ogni sezione si chiude con il **fix** — la configurazione esatta che spediamo in Divinci, più cosa costruire da te se non ci stai usando.

---

## Stadio ① — Register

### 1. Co-deployare modello + prompt + routing in un singolo bundle e non sapere quale ha rotto cosa

**Cos'è successo.** Abbiamo cambiato tre cose nello stesso rilascio: bumpato il modello base da Gemma 4 E2B a Gemma 4 26B-A4B, modificato il system prompt del dominio legale per aggiungere un'istruzione "cita lo statuto" e aggiustato la regola di routing che decide quale classe di traffico colpisce quale modello. L'accuratezza sulla stesura di contratti è scesa di 7 punti. Nessuno dei tre cambi era stato testato in modo indipendente. Per debuggarlo ci sono voluti due giorni di reverting di una variabile alla volta.

**Perché la pipeline ora lo cattura.** Un rilascio Divinci è un manifesto immutabile che raggruppa model_ref, prompt_template_ref, routing e dataset_version in un singolo artefatto indirizzato per SHA-256. La pipeline rifiuta di deployare un manifesto che raggruppi più di un cambio *a meno che* lo SHA del rilascio precedente non sia referenziato come baseline di confronto. Se vuoi spedire tre cambi insieme, devi riconoscerlo nel manifesto, e il percorso di attribuzione dei fallimenti resta pulito perché il rilascio successivo è forzato a tornare a una-variabile-alla-volta.

**Fix.** Non lasciare che gli umani assemblino i rilasci a mano. Il manifesto di rilascio dovrebbe essere generato da una pipeline che *non possa* raggruppare silenziosamente. Vedi [Stadio 1 — Register](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stadio-1-register) per l'API.

### 2. Modificare un system prompt in una dashboard e spedirlo senza code review

**Cos'è successo.** Qualcuno ha ritoccato il system prompt in una UI di amministrazione per "rendere il modello meno verboso". Sembrava una modifica di una parola. Il prompt risultante era 38 caratteri più corto, il che lo ha portato sotto una soglia di lunghezza che il prompt-rewriter a valle usava per decidere se aggiungere il boilerplate di sicurezza. Due ore dopo il modello stava rispondendo a domande che avrebbe dovuto rifiutare.

**Perché la pipeline ora lo cattura.** I prompt fanno parte del manifesto registrato. Modificarne uno in una dashboard significa emettere un nuovo manifesto, il che significa generare un nuovo SHA, il che significa che il gate gira contro il cambio. Puoi ancora modificare i prompt in una dashboard. Semplicemente non puoi spedirli senza che il gate li veda.

**Fix.** Tratta i prompt come codice: versionali con un content hash, registrali come parte del rilascio, fagli passare il gate sulla suite scored-QA. Il post *Semver Lie* di Tianpan<sup><a href="#ref-1">[1]</a></sup> descrive esattamente questa modalità di fallimento accaduta nel mondo reale — un cambio di prompt che "ha passato la code review, è stato deployato senza eval gate, ha colpito la produzione senza A/B per utente e non ha innescato alcun rollback automatico."

### 3. Skew preprocessing training-serving

**Cos'è successo.** La pipeline di training normalizzava gli spazi e abbassava un particolare campo in lowercase. La pipeline di serving no. Stesso modello, stesso prompt, stesso routing — input diversi a livello di byte. Sui fixture di dev passava tutto. Sul traffico reale il modello si comportava come se fosse stato ri-trainato su dati più rumorosi, perché dal suo punto di vista lo era stato.

**Perché la pipeline ora lo cattura.** Il manifesto registra un `preprocessing_ref` accanto a model_ref. La valutazione del gate gira attraverso lo stesso preprocessing che lo stack di serving in produzione usa. Se i due divergono, i numeri offline del gate non corrispondono più alla produzione, e la Spearman per fetta scende in un modo che è misurabile prima del promote.

**Fix.** Containerizza il preprocessing come un artefatto versionato. Referenzialo dal manifesto. Rifiuta di deployare se il gate è stato calcolato contro una versione di preprocessing diversa da quella che la produzione userà.

---

## Stadio ② — Gate

I quattro fallimenti qui sotto sono quelli che un gate a punteggio aggregato avrebbe spedito. **Il motivo per cui un gate aggregato li manca è strutturale, non di tuning dei parametri** — fare la media tra le fette distrugge esattamente il segnale che useresti per catturare una regressione localizzata su una fetta.

### 4. Il collasso delle licenze IP (regressione per fetta #1)

**Cos'è successo.** Un fine-tune QLoRA ha migliorato l'accuratezza Q&A legale su cinque sottodomini e ha mandato in crash le licenze IP — stesura di contratti 0,71, interpretazione statutaria 0,74, sintesi di casi 0,69, conformità normativa 0,66, analisi giurisdizionale 0,62, **licenze IP 0,41**. La Spearman ρ aggregata sulle sei era 0,64. La soglia del gate era 0,65. Per un singolo punteggio aggregato, il rilascio era un capello sotto la linea. Per la vista per fetta, un sottodominio era crollato di 27 punti.

**Perché la pipeline ora lo cattura.** La soglia del gate è per fetta, non aggregata. Qualsiasi singola fetta che cade sotto la sua soglia marca il rilascio come `gate_fail`, indipendentemente da come appare la media. Il [grafico delle soglie del gate nel post #1](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stadio-2-gate) è l'effettiva visualizzazione che la pipeline produce per rilasci come questo.

**Fix.** Affetta il gate. Le fette che contano sono i sottodomini per segmento cliente, non qualunque tassonomia ci sia nel framework di eval che hai importato.

### 5. Regressione su fetta di oncologia pediatrica (regressione per fetta #2)

**Cos'è successo.** Un modello Q&A medico è stato fine-tunato su dati aggiuntivi di cardiologia adulta. L'accuratezza medica aggregata è migliorata di 4 punti. L'accuratezza in oncologia pediatrica è scesa di 11 punti — apparentemente i nuovi dati di training avevano sottilmente de-enfatizzato gli aggiustamenti di dosaggio pediatrico. Il gate aggregato lo avrebbe promosso.

**Perché la pipeline ora lo cattura.** L'oncologia pediatrica era una delle fette configurate dal cliente quando ha registrato la suite scored-QA. La valutazione Gate-2 ha prodotto una Spearman ρ per fetta che è scesa da 0,72 a 0,61, sotto la soglia di oncologia pediatrica di 0,68. Marcato `gate_fail`. Nessun deploy.

**Fix.** Fette definite dal cliente, non definite dalla piattaforma. La piattaforma dovrebbe permettere al cliente di aggiungere una fetta e una soglia per fetta senza scrivere codice — perché nessuno in Divinci conosce i confini di dominio del cliente bene quanto il cliente stesso.

### 6. Drift di sotto-lingua multilingue (regressione per fetta #3)

**Cos'è successo.** Un modello multilingue fine-tunato per migliorare le risposte in francese. L'accuratezza aggregata in francese è migliorata di 3 punti. All'interno del "francese", tuttavia, il modello ora performava peggio sulle varianti regionali del francese belga e del francese svizzero — il corpus di training era stato pesantemente parigi-centrico. Un gate aggregato sul francese lo avrebbe spedito.

**Perché la pipeline ora lo cattura.** Le varianti di locale sono sotto-fette della fetta della lingua. La Spearman per sotto-fetta ha catturato la regressione nella variante belga prima del promote. Il rilascio è stato rimandato indietro per (a) dati di training più diversi o (b) un force-override con una giustificazione scritta ("stiamo accettando la regressione regionale perché il miglioramento aggregato in francese conta di più in questo rollout") — e l'override entra nell'audit trail.

**Fix.** La profondità delle fette conta. "Francese" è troppo grezzo. "Francese belga" è il livello in cui le regressioni in realtà si nascondono.

### 7. Bypassare il gate senza una motivazione scritta di override

**Cos'è successo.** Una finestra di rilascio sotto pressione. Il gate è fallito su una fetta — non critica, nel giudizio del team. Qualcuno ha allungato la mano sul flag di force-override. In una versione precedente della pipeline, il force-override era un singolo booleano. Il flag è stato ribaltato, il rilascio è andato in produzione, e tre settimane dopo nessuno riusciva a ricostruire chi avesse deciso cosa su quale fetta.

**Perché la pipeline ora lo cattura.** Il force-override è un gate a due campi: `forceGateOverride: true` E `overrideReason: "..."`. La motivazione è una stringa free-text obbligatoria scritta nell'audit log accanto all'ID utente e al risultato del gate per fetta che è stato superato. La pipeline rifiuta l'override senza la motivazione. Puoi ancora fare override — semplicemente non puoi fare override anonimamente.

**Fix.** I gate di governance non sono uno stadio separato. Sono una proprietà dello stadio gate: ogni override è una ricevuta firmata con testo di motivazione.

---

## Stadio ③ — Roll

### 8. Passare dallo 0% al 100% del traffico in un singolo passo

**Cos'è successo.** Un modello ha passato il gate pulitamente. È stato spinto immediatamente al 100% del traffico. Per una stranezza della lunghezza della conversazione, il nuovo modello andava in timeout su risposte più lunghe di circa 2.400 token — un comportamento che non era emerso sul set di valutazione del gate da 100 domande perché ogni prompt di test era breve. Il 15% degli utenti ha ricevuto un timeout per 18 minuti prima che qualcuno facesse rollback manualmente.

**Perché la pipeline ora lo cattura.** Lo stadio Roll si ferma al 5% per `dwell_5pct_seconds` (default 240) OPPURE `requests_5pct` (default 1.000), qualunque sia *più tardi*. Al 5% di traffico, i timeout su conversazioni lunghe emergono nel monitor del tasso di 5xx entro circa 3 minuti. La pipeline rifiuta di avanzare oltre il 5% se un qualsiasi monitor di checkpoint sfora la sua banda. Il tempo medio di halt è stato di 4 minuti; il tempo medio per un rollback completo è stato di circa 12 secondi dopo l'halt.

**Fix.** Canary in tre passi con un monitor di *qualità*, non solo latenza e 5xx. Il pattern "cinque percento in venti secondi e abbiamo finito" è quello pericoloso. Il pattern cinque-percento-per-quattro-minuti è quello sicuro.

---

## Stadio ④ — Observe

I due fallimenti qui sotto sono quelli che un canary su metrica infrastrutturale avrebbe promosso. **Il motivo per cui le metriche infrastrutturali li mancano è anche strutturale** — la latenza e i 5xx possono restare perfettamente puliti mentre il modello silenziosamente tergiversa, rifiuta o allucina.

### 9. Tergiversazione silenziosa su query legali (calo silenzioso di qualità #1)

**Cos'è successo.** Un aggiornamento del modello safety-tunato ha reso l'assistente di dominio legale notevolmente più conservativo. Stessa latenza, stesso tasso di 5xx, stesso uso di token. Ma dove la versione precedente aveva risposto "il termine di prescrizione è di X anni", la nuova versione diceva "dovresti consultare un avvocato". I clienti se ne sono accorti in ore. Le dashboard non si sono mai mosse.

**Perché la pipeline ora lo cattura.** L'observer dello Stadio 4 esegue un replay continuo delle tracce di produzione attraverso il modello attivo e le valuta con lo stesso giudice calibrato che ha alimentato il Gate-2. La tergiversazione emerge immediatamente perché il giudice calibrato — ancorato a valutazioni umane di come appare una "buona" risposta legale — penalizza il rifiuto-quando-ci-si-aspettava-una-risposta. Il monitor di qualità dell'output è sceso sotto la sua banda per tre minuti consecutivi e la pipeline ha fatto auto-rollback. Tempo totale trascorso: sotto i cinque minuti.

**Fix.** Non monitorare solo la latenza e i 5xx. Monitora un punteggio di *qualità* derivato da un giudice calibrato contro tracce di produzione reali. I deployment guardrails di SageMaker<sup><a href="#ref-2">[2]</a></sup> fanno auto-rollback su allarmi CloudWatch — utile per l'infrastruttura, ma l'allarme deve scattare su una metrica, e "il modello sta tergiversando" non è una metrica che CloudWatch vede.

### 10. Date allucinate dopo un fine-tune (calo silenzioso di qualità #2)

**Cos'è successo.** Un fine-tune di un assistente per scheduling ha iniziato a inserire con sicurezza date che non esistevano nell'input. "Il tuo meeting è giovedì 32 marzo." Latenza invariata. Tasso di 5xx invariato. Le allucinazioni passavano il filtro di sicurezza perché niente segnalava "32 marzo" come dannoso — solo impossibile.

**Perché la pipeline ora lo cattura.** Il giudice calibrato dell'observer — in esecuzione su tracce di scheduling reali in produzione, non sintetiche — dà alle risposte sicure-ma-sbagliate un punteggio peggiore rispetto a rifiuti "non lo so" appropriati. Il calo nella classe delle allucinazioni ha innescato la soglia per-minuto dell'observer entro due minuti. È partito l'auto-rollback.

**Fix.** Un giudice calibrato contro l'expertise di dominio. Un generico LLM-as-judge mancherà "giovedì 32 marzo" allo stesso modo in cui umani che scorrono velocemente lo mancheranno. Giudici calibrati per dominio — ancorati alle valutazioni di esperti di dominio — no.

---

## I 10 fallimenti mappati sulla pipeline

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrice che mappa le dieci modalità di fallimento ai quattro stadi della pipeline. Lo Stadio 1 Register cattura i fallimenti 1 (cambi co-deployati), 2 (prompt non versionati) e 3 (skew training-serving). Lo Stadio 2 Gate cattura i fallimenti 4 (regressione fetta licenze IP), 5 (regressione fetta oncologia pediatrica), 6 (drift di sotto-lingua multilingue) e 7 (bypassare il gate senza motivazione di override). Lo Stadio 3 Roll cattura il fallimento 8 (rollout in un passo). Lo Stadio 4 Observe cattura i fallimenti 9 (tergiversazione silenziosa) e 10 (date allucinate).">
<title>Modalità di fallimento per stadio della pipeline</title>
<rect width="900" height="420" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Dove viene catturato ciascun fallimento</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Tre regressioni per fetta atterrano al Gate. Due cali silenziosi di qualità atterrano all'Observe. Il resto si distribuisce tra Register e Roll.</text>
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
<text x="50" y="163" font-size="11" font-weight="700" fill="#1e3a2b">1. Cambi co-deployati</text>
<text x="50" y="178" font-size="10" fill="#6b5d4f">modello + prompt + routing</text>
<text x="50" y="191" font-size="10" fill="#6b5d4f">raggruppati silenziosamente</text>
<rect x="40" y="210" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="228" font-size="11" font-weight="700" fill="#1e3a2b">2. Prompt non versionati</text>
<text x="50" y="243" font-size="10" fill="#6b5d4f">la modifica in dashboard</text>
<text x="50" y="256" font-size="10" fill="#6b5d4f">bypassa il gate</text>
<rect x="40" y="275" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="293" font-size="11" font-weight="700" fill="#1e3a2b">3. Skew training-serving</text>
<text x="50" y="308" font-size="10" fill="#6b5d4f">il preprocessing diverge</text>
<text x="50" y="321" font-size="10" fill="#6b5d4f">tra offline e online</text>
</g>
<g>
<rect x="250" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="163" font-size="11" font-weight="700" fill="#a04848">4. Fetta licenze IP</text>
<text x="260" y="178" font-size="10" fill="#6b5d4f">fetta 0,41, aggregato 0,64</text>
<text x="260" y="191" font-size="10" fill="#6b5d4f">l'aggregato spedirebbe</text>
<rect x="250" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="228" font-size="11" font-weight="700" fill="#a04848">5. Oncologia pediatrica</text>
<text x="260" y="243" font-size="10" fill="#6b5d4f">fetta scende di 11 punti</text>
<text x="260" y="256" font-size="10" fill="#6b5d4f">l'aggregato spedirebbe</text>
<rect x="250" y="275" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="293" font-size="11" font-weight="700" fill="#a04848">6. Sotto-drift multilingue</text>
<text x="260" y="308" font-size="10" fill="#6b5d4f">francese belga regredisce</text>
<text x="260" y="321" font-size="10" fill="#6b5d4f">l'aggregato spedirebbe</text>
<rect x="250" y="340" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="260" y="358" font-size="11" font-weight="700" fill="#1e3a2b">7. Bypass dell'override</text>
<text x="260" y="373" font-size="10" fill="#6b5d4f">richiede motivazione scritta</text>
<text x="260" y="386" font-size="10" fill="#6b5d4f">+ voce nell'audit</text>
</g>
<g>
<rect x="460" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="470" y="163" font-size="11" font-weight="700" fill="#1e3a2b">8. Rollout 0% → 100%</text>
<text x="470" y="178" font-size="10" fill="#6b5d4f">nessuna sosta al checkpoint</text>
<text x="470" y="191" font-size="10" fill="#6b5d4f">bug long-tail colpiscono su scala</text>
</g>
<g>
<rect x="670" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="163" font-size="11" font-weight="700" fill="#a04848">9. Tergiversazione silenziosa</text>
<text x="680" y="178" font-size="10" fill="#6b5d4f">latenza e 5xx invariati</text>
<text x="680" y="191" font-size="10" fill="#6b5d4f">il giudice la cattura</text>
<rect x="670" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="228" font-size="11" font-weight="700" fill="#a04848">10. Date allucinate</text>
<text x="680" y="243" font-size="10" fill="#6b5d4f">"32 marzo"</text>
<text x="680" y="256" font-size="10" fill="#6b5d4f">il giudice di dominio la cattura</text>
</g>
</svg>
</figure>

Le barre colorate in rosso sono i fallimenti che abbiamo trovato *mentre* spedivamo questa pipeline — sono il motivo per cui abbiamo finito per costruire specificamente il gate per fetta e l'observer di replay delle tracce, invece di spedire un canary generico con metriche infrastrutturali come fanno tutti gli altri.

## Cosa rende il CI/CD per LLM diverso dal CI/CD software?

La versione breve: un rilascio LLM non è un artefatto deterministico. Lo stesso prompt produce output diversi attraverso le esecuzioni. Lo stesso set di valutazione produce punteggi diversi attraverso l'hardware. Lo stesso modello può passare un controllo di qualità aggregato mentre fallisce silenziosamente su una fetta che non hai incluso nell'eval. La maggior parte delle assunzioni su cui è stato costruito il CI/CD tradizionale non sopravvive al contatto con un sistema probabilistico.

Tre conseguenze concrete:

1. **Non puoi scrivere asserzioni `expect(output).toEqual(X)`.** Hai bisogno di una valutazione consapevole della distribuzione che consumi la correlazione di rango contro un grader ancorato all'umano, non l'uguaglianza contro un fixture.
2. **Un modello che "ha passato la CI" può spedire comportamenti rotti.** La CI che passa significa che il codice gira. Non significa che il modello sia corretto. La pipeline di rilascio deve imporre un gate di *qualità* sopra il gate di *correttezza* che la CI fornisce.
3. **Il rollback non è opzionale e non è lento.** Poiché le modalità di fallimento sono probabilistiche — e poiché alcune di esse sono silenziose a livello infrastrutturale — il percorso di rollback deve essere infrastruttura primaria, non un piano di backup. Il manifesto di rilascio esiste specificamente per rendere il rollback atomico.

Il primo post di questa serie descrive l'architettura a quattro stadi che risponde a queste conseguenze. Questo post descrive i fallimenti che cattura.

## Come si costruisce una pipeline CI/CD resistente ai fallimenti per LM personalizzati?

La risposta onesta: accetti che i fallimenti accadranno e minimizzi il tempo tra il *verificarsi del fallimento* e il *ritorno del traffico di produzione a una versione di buon-stato noto*. La pipeline a quattro stadi qui sopra è un'implementazione specifica di quel principio, ma il principio stesso è ciò che conta.

Se non stai usando Divinci e vuoi costruire qualcosa di equivalente, i pezzi portanti sono:

- **Un manifesto di rilascio immutabile** che raggruppa modello + prompt + routing + dataset + preprocessing in un singolo SHA. È ciò che rende catturabili 1, 2 e 3. ([Stadio 1](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stadio-1-register))
- **Un gate per fetta** con soglie definite dai proprietari del dominio, non dai proprietari della piattaforma. È ciò che rende catturabili 4, 5, 6. ([Stadio 2](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stadio-2-gate))
- **Un canary con monitoring di qualità a ogni checkpoint**, non solo latenza e 5xx. È ciò che rende catturabile 8 e ciò che rende 9 e 10 *sopravvivibili* una volta che colpiscono la produzione. ([Stadio 3](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stadio-3-roll))
- **Un observer continuo** che valuta le tracce di produzione reali attraverso il modello attivo con lo stesso giudice calibrato che ha alimentato il gate. È ciò che rende catturabili 9 e 10. ([Stadio 4](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stadio-4-osservare-rollback-e-la-ricevuta))
- **Una ricevuta di audit firmata per ogni decisione.** Concatenata in hash, ancorabile esternamente. Per i backing di modelli open-weights, la ricevuta integra un'[attestazione dei pesi vIndex](/it/compliance/) che dimostra che i pesi attivi sono quelli che il manifesto ha registrato. Per i backing closed-API, la ricevuta copre la catena di decisioni ma non può rivendicare la provenienza dei pesi — e l'audit trail lo dice esplicitamente.

I pezzi non sono nuovi singolarmente. Ogni piattaforma MLOps ne ha uno o due. La combinazione — gate per fetta + observer di tracce di produzione + rollback atomico + ricevuta dimostrabile — è la parte che nessun altro spedisce nel 2026.

## Dove andare dopo

- Il post compagno — **[Come costruire una pipeline CI/CD per LLM con Divinci AI](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)** — copre l'architettura e l'API.
- La **[pagina di conformità](/it/compliance/)** documenta il formato della ricevuta vIndex che fa da supporto a ogni decisione di rilascio e come si mappa su EU AI Act, GDPR Articolo 17, HIPAA e NIST AI RMF.
- La **[pagina prodotto AutoRAG](/it/autorag/)** copre la riduzione delle allucinazioni dal lato RAG che si accoppia naturalmente con il giudice calibrato che guida il Gate-2 e l'observer dello Stadio 4.
- Il **[riferimento API](/it/api/)** — ogni comando referenziato in questa serie è un endpoint reale.

## FAQ

### Qual è il fallimento CI/CD più comune per i modelli linguistici personalizzati?

Tra i rilasci che abbiamo spedito, il singolo fallimento più dannoso è **una regressione slice-aware che passa un gate aggregato** — un modello che migliora in media mentre collassa silenziosamente su uno specifico sottodominio (fallimenti 4, 5 e 6 sopra). È più comune del rollback mancante, più comune del prompt drift, e più difficile da rilevare di entrambi. La correzione è strutturale, non un tuning di parametri: gate per slice, non sulla media.

### Quanto velocemente dovresti poter eseguire il rollback di un rilascio LLM difettoso?

Ordine di grandezza di secondi, non minuti. Il tempo medio di rollback sulla pipeline Divinci è di circa 12 secondi — quello è il drain delle richieste in-flight su un servizio a ~100 repliche, non lo swap del manifest in sé, che è sub-secondo. La decisione architetturale che lo rende possibile è il release manifest bundled: poiché ogni componente (pesi, prompt, routing, dataset) è referenziato da un singolo SHA, il rollback è un singolo re-point atomico. Confronta questo con i postmortem pubblici: l'incidente Cloudflare del giugno 2022<sup><a href="#ref-3">[3]</a></sup> ha richiesto 44 minuti per il revert perché gli ingegneri si pestavano i piedi sui rispettivi revert; l'outage Atlassian dell'aprile 2022<sup><a href="#ref-4">[4]</a></sup> ha richiesto 12 ore per sito interessato per ripristinare perché lo stato era distribuito su più sistemi.

### Perché le modifiche ai prompt causano così tante interruzioni in produzione?

Perché i prompt vengono regolarmente modificati al di fuori della pipeline CI/CD — in dashboard, in UI di amministrazione, a volte da persone senza revisione ingegneristica. Vengono trattati come configurazione, ma si comportano come codice. Una modifica di 38 caratteri a un system prompt può cambiare il comportamento downstream del modello più di un riaddestramento del modello. La correzione è registrare i prompt come parte del release manifest e richiedere che passino lo stesso gate che passa il modello.

### Come rilevi il degrado silenzioso della qualità negli output LLM?

Non con metriche infrastrutturali. Latenza, tasso 5xx e utilizzo dei token non coglieranno l'hedging, il rifiuto-quando-ci-si-aspettava-una-risposta, o le date allucinate. Il segnale di rilevamento deve provenire da uno score di *qualità* calcolato da un giudice calibrato contro tracce di produzione reali. L'observer dello Stadio 4 nella pipeline di Divinci riproduce un campione rolling di tracce di produzione attraverso il modello attivo, le valuta con lo stesso giudice Spearman human-anchored che ha alimentato il Gate-2, e attiva il rollback automatico quando lo score di qualità scende sotto soglia per tre minuti consecutivi.

### Quali requisiti di audit trail si applicano ai deployment di modelli AI?

L'EU AI Act, il GDPR Articolo 17 (diritto alla cancellazione), HIPAA e il NIST AI Risk Management Framework richiedono tutti alle organizzazioni di mantenere registri delle versioni dei modelli, dei risultati di valutazione, delle decisioni di approvazione e dei rollout. Il requisito non dichiarato sotto tutti e quattro è che i registri devono essere *verificabili* — auditable significa più di "abbiamo un log". Le ricevute vIndex di Divinci sono hash-chained e ancorabili esternamente, il che significa che un auditor può verificare la catena senza fidarsi dei nostri log. Per i backing di modelli open-weights la ricevuta incorpora anche un'attestazione dei pesi; per i backing closed-API la ricevuta nota esplicitamente che la provenance dei pesi non è rivendicata.

## Riferimenti

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (aprile 2026). Nomina direttamente la modalità di fallimento della modifica del prompt in dashboard. Compagno: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a>. L'auto-rollback standard guidato da metriche infrastrutturali. Confronto utile per cosa lo Stadio 4 Observe sta facendo di diverso (punteggio di qualità, non allarmi CloudWatch).
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Revert di 44 minuti perché gli ingegneri si calpestavano i revert a vicenda. Citato come ancoraggio per "il rollback è il suo stesso tipo di incidente".
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. 12 ore per sito per il ripristino. La modalità di fallimento dello stato-distribuito-su-sistemi nella sua forma peggiore.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. La soglia per elite-performer di "tempo di recupero da deploy fallito" è documentata come sotto un'ora. Inquadramento utile per "quanto veloce è abbastanza veloce" sul rollback.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">Zheng et al., <em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (arXiv:2306.05685, 2023). Il riferimento per il perché un LLM-as-judge possa eguagliare le valutazioni umane nel complesso ma variare ampiamente per categoria — che è esattamente il pattern che rende necessario il gating per fetta.
  </li>
</ol>

---

*Prossimo in questa serie:* **Validare e rilasciare LM personalizzati in settori regolamentati.** La pipeline qui sopra è l'architettura. Il percorso di conformità è la pratica di usarla. EU AI Act, GDPR Articolo 17, HIPAA e NIST AI RMF — cosa chiede ciascuno a un processo di rilascio e quali campi della ricevuta vIndex coprono quale requisito.
