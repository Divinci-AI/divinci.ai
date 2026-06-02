+++
title = "Validare e rilasciare LM custom in settori regolamentati"
description = "EU AI Act, GDPR Articolo 17, HIPAA, NIST AI RMF — mappati capacità per capacità su una pipeline di release LLM. Dove pesi aperti e chiusi divergono."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vIndex"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "La compliance per settori regolamentati con modelli linguistici custom si divide nettamente lungo un asse: pesi aperti vs API chiuse. Per backing a pesi aperti puoi rilasciare un'attestazione di peso vIndex che soddisfa l'erasure verificabile dell'Articolo 17 GDPR in modo crittografico. Per backing ad API chiuse, la stessa ricevuta copre la catena decisionale ma non può rivendicare provenance dei pesi — e il regolatore riceve questa distinzione nella ricevuta stessa. Questo post mappa quattro framework regolatori (EU AI Act, GDPR, HIPAA, NIST AI RMF) sulle quattro fasi della pipeline che rilasciamo, e mostra il formato effettivo della ricevuta."
+++

*Note dal ciclo di rilascio — Parte IV*

---

Una general counsel entra alla review di ingegneria. Ha una sola domanda: *"Se domani arriva una richiesta di diritto all'oblio ai sensi dell'Articolo 17 dell'EU AI Act, chiedendoci di rimuovere ogni fatto che il nostro modello ha imparato su uno specifico paziente, possiamo dimostrare di averlo fatto?"*

La risposta onesta che la maggior parte dei team deve dare è: "Possiamo fare fine-tuning del modello perché dimentichi. Possiamo mostrarti la training run. Ma non possiamo dimostrare che l'informazione sia strutturalmente sparita, perché potrebbe riemergere sotto il prompt avversariale giusto."

Questa non è una risposta di compliance. È una non-risposta con un'alzata di spalle procedurale.

Questo post tratta di come si presenta una vera risposta di compliance per LLM custom — attraverso quattro framework regolatori (**EU AI Act, GDPR Articolo 17, HIPAA, NIST AI RMF**), mappati sulla pipeline a quattro fasi ([Register → Gate → Roll → Observe](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)) che rilasciamo per i rilasci dei clienti. La tensione di fondo che attraversa la richiesta di ogni regolatore è **pesi aperti vs API chiuse**: le cose che puoi dimostrare di un fine-tune di Gemma 4 non sono le cose che puoi dimostrare di un rilascio servito dietro un'API vendor opaca. Il formato della ricevuta che usiamo lo dichiara esplicitamente, riga per riga. È questa onestà che rende la ricevuta utile a un auditor.

## I quattro regolatori e cosa vuole davvero ciascuno

Le discussioni sulla compliance tendono a ridursi a "abbiamo documentato le cose". Quell'inquadramento non regge davanti a un auditor. Quello che gli auditor vogliono è *evidenza che possono verificare senza fidarsi della tua infrastruttura*. I quattro framework qui sotto usano tutti vocabolari diversi per la stessa richiesta sottostante.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Quattro framework regolatori e la primitiva di verifica che ciascuno richiede. L'EU AI Act richiede logica documentata e supervisione umana; primitiva di verifica è documentazione meccanicistica bit-exact. GDPR Articolo 17 richiede erasure verificabile dei dati personali; primitiva di verifica è patch DELETE a livello di pesi con ricevuta SHA-256. HIPAA richiede audit di accesso e tracciamento delle divulgazioni; primitiva di verifica è log decisionale firmato per richiesta. NIST AI RMF richiede governance, mappatura, misurazione e gestione; primitiva di verifica è ricevuta hash-chained per ogni decisione di rilascio.">
<title>Quattro regolatori, una sola richiesta di verifica</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Quattro regolatori, un'unica richiesta di fondo: verifica, non fidarti</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Ogni framework chiama la primitiva di verifica in modo diverso, ma la sostanza è la stessa: prova crittografica che un auditor può controllare.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">L'Allegato IV richiede:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• logica documentata</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• riepilogo dei training data</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• misure di supervisione umana</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• monitoraggio post-market</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Primitiva di verifica:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">documentazione meccanicistica</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">bit-exact tramite vIndex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">Sanzione per non-compliance:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">fino al 7% del</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">fatturato globale</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR Art. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Diritto all'oblio richiede:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• rimozione dati verificabile</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• oblio dimostrabile</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• prova sotto prompting</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  avversariale</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Primitiva di verifica:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">patch DELETE a livello pesi</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">con ricevuta SHA-256</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">Sanzione per non-compliance:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">fino a €20M o</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">4% del fatturato</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Controlli di accesso richiedono:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• audit trail degli accessi</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• tracciamento divulgazioni</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• esposizione PHI</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  minimo necessario</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Primitiva di verifica:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">log decisionale firmato</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">per richiesta</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">Sanzione per non-compliance:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">fino a $1,9M /</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">tipo-violazione / anno</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Quattro funzioni core:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• govern</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• map</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• measure</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• manage</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Primitiva di verifica:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">ricevuta hash-chained</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">per decisione di rilascio</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">Sanzione per non-compliance:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">framework volontario</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(ma il baseline de facto</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">per l'enterprise)</text>
</svg>
</figure>

I numeri delle sanzioni non sono ciò che rende questi framework interessanti. I numeri delle sanzioni sono ciò che li rende vincolanti. La parte interessante è la **primitiva di verifica** — che aspetto vuole avere l'artefatto secondo ciascun framework. Tre dei quattro chiedono prove di livello crittografico in vocabolari diversi. Il quarto (NIST AI RMF) è volontario ma di fatto richiesto in procurement enterprise. Convergono sulla stessa forma: un artefatto che un auditor può verificare senza fidarsi dei tuoi log.

## Lo spartiacque: pesi aperti vs API chiuse

Prima della mappatura per fase, la premessa più importante di tutto il post:

**Per backing di modelli a pesi aperti** — Gemma, Qwen, Llama, Mistral, GPT-OSS, qualsiasi cosa in cui i pesi siano indirizzabili ed editabili — ogni decisione di rilascio Divinci emette una ricevuta vIndex che include una **weight-attestation**: prova crittografica che i pesi attivi al momento della decisione sono esattamente i pesi che il manifest ha registrato. È questo che rende possibile l'erasure verificabile dell'Articolo 17 GDPR. Applichi una [patch DELETE](/blog/deleting-paris-from-a-language-model/) che rimuove una specifica relazione-entità dallo spazio dei pesi, la ricevuta incorpora l'hash prima-e-dopo, e un auditor può verificare che la cancellazione sia avvenuta ri-eseguendo la verifica contro il vIndex pubblico.

**Per backing di modelli ad API chiuse** — OpenAI, Anthropic, Google tramite API opache — la stessa ricevuta copre la catena decisionale (quale manifest, quale risultato di gate, quale lettura del monitor, quale utente ha triggerato quale azione) ma **non può rivendicare la provenance dei pesi**, perché il provider non espone i pesi. La ricevuta lo annota esplicitamente in un campo `weight_attestation: null` con una `note` che spiega perché. Non è una postura di compliance degradata — è il limite di ciò che è verificabile, scritto onestamente. Un auditor che legge la ricevuta capisce esattamente quale classe di prova viene e non viene fornita.

Questo spartiacque attraversa la richiesta di ogni regolatore qui sotto. Ogni volta che un framework richiede qualcosa a livello di pesi, il percorso a pesi aperti può soddisfarla e il percorso ad API chiuse no. Lo dichiariamo nella ricevuta invece di insinuare una prova che non possiamo fornire.

## Come ciascun framework si mappa sulle quattro fasi della pipeline

La pipeline ha quattro fasi. La richiesta di ciascun regolatore si mappa su una o più di esse. La matrice qui sotto è la mappa effettiva.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Mappatura dei quattro framework regolatori sulla pipeline di rilascio Divinci a quattro fasi. EU AI Act Allegato IV logica documentata e riepilogo training mappati sulla Fase 1 Register. EU AI Act supervisione umana e monitoraggio post-market mappati sulle Fasi 2 Gate e 4 Observe. GDPR Articolo 17 erasure verificabile mappato sulla Fase 1 Register via patch DELETE e Fase 4 Observe via ricevuta. HIPAA audit di accesso e tracciamento delle divulgazioni mappati sulle Fasi 1, 3 e 4. NIST AI RMF govern map measure manage mappato su tutte e quattro le fasi. Cinque celle della matrice sono evidenziate per indicare il percorso di verifica solo-pesi-aperti.">
<title>Framework regolatori mappati sulle fasi della pipeline</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Quale fase della pipeline copre quale richiesta regolatoria</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = copertura completa. ◐ = solo pesi aperti (weight-attestation richiesta). Il percorso ad API chiuse copre la catena decisionale ma non può fare la rivendicazione a livello di pesi.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Framework / richiesta</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Allegato IV: logica documentata</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Allegato IV: riepilogo training data</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Misure di supervisione umana</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Monitoraggio post-market</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR Articolo 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Erasure verificabile (patch DELETE)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Ricevuta di erasure (hash-chained)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Audit di accesso per richiesta</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Tracciamento divulgazioni + minimo-necessario</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">Govern · Map · Measure · Manage</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

Le due celle ◐ sono le voci GDPR Articolo 17 / solo-pesi-aperti — sono le richieste che il percorso ad API chiuse non può soddisfare pienamente. Tutto il resto si applica a entrambi i backing.

Il resto del post percorre il contributo di ciascuna fase.

## Fase ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Il manifest di rilascio è la documentazione tecnica dell'Allegato IV dell'EU AI Act.</span>
  </div>
</div>

La fase Register produce un manifest JSON immutabile, indirizzato per SHA-256. Per i rilasci regolamentati il manifest porta in un solo artefatto tutto ciò che l'Allegato IV<sup><a href="#ref-1">[1]</a></sup> richiede:

- L'artefatto modello (repo HF + commit SHA, o un riferimento a patch vIndex)
- Il prompt template (ogni variabile, ogni system message — versionato)
- Le regole di routing (quale classe di traffico atterra su quale rilascio)
- La versione del dataset usata per calcolare le soglie di gate (riepilogo dei training data per hash)
- L'SHA del rilascio precedente (così la catena di audit è ininterrotta)
- L'ambito di divulgazione — per deployment HIPAA, quali categorie PHI il modello è autorizzato a ricevere

Il manifest è la documentazione. Un auditor non legge prosa; legge l'hash del manifest e verifica il bundle. Non serve un riepilogo in prosa scritto-sei-mesi-dopo.

**Bonus pesi aperti.** Quando l'artefatto modello fa riferimento a un modello a pesi aperti, il manifest incorpora anche il `vindex_sha256` — l'impronta crittografica del [vIndex](/it/compliance/) pubblicato del modello. Quell'impronta è ciò che permette a una terza parte di verificare i pesi attivi senza dover mai fidarsi della nostra infrastruttura di deployment.

**Caveat per API chiuse.** Quando l'artefatto modello fa riferimento a un modello ad API chiuse, il campo `vindex_sha256` del manifest è `null`, e il `weight_attestation_class` del manifest è `decision_chain_only`. L'auditor che lo legge sa esattamente cosa viene rivendicato e cosa no.

## Fase ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">I gate di qualità per slice portano il requisito di supervisione umana dell'EU AI Act.</span>
  </div>
</div>

La fase Gate è dove le "misure di supervisione umana" dell'EU AI Act<sup><a href="#ref-1">[1]</a></sup> vengono operazionalizzate. Un regolatore che legge l'EU AI Act e conclude "ci serve un workflow di approvazione umana" ha mancato il punto — la richiesta più dura è *contro cosa l'umano sta approvando*. La fase Gate risponde a quella domanda con una ρ di Spearman per slice contro un grader ancorato all'umano<sup><a href="#ref-3">[3]</a></sup>. Ogni slice che conta per la tua postura regolatoria (oncologia pediatrica, licensing IP, francese belga) riceve la propria soglia. Il percorso di override richiede una motivazione scritta che entra nell'audit trail.

Per i deployment coperti da HIPAA, qui vive anche la regola di divulgazione "minimo necessario". La suite scored-QA del gate include test negativi per la sovraesposizione di PHI — risposte che includono identificatori personali quando non sono stati richiesti. Un rilascio che regredisce sulla slice di sovraesposizione fallisce il gate, indipendentemente da come performano le altre slice.

Per NIST AI RMF, la fase Gate copre la funzione "measure" — l'evidenza numerica per slice che il sistema sta operando entro le tolleranze configurate.

## Fase ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">I checkpoint del canary diventano l'artefatto di monitoraggio post-market.</span>
  </div>
</div>

Il monitoraggio post-market dell'EU AI Act<sup><a href="#ref-1">[1]</a></sup> richiede che l'operatore dimostri un'osservazione *continua* — non solo pre-launch — di come il sistema AI performa in condizioni reali. Un canary 5% → 25% → 100% con checkpoint di quality-monitor è il modo più naturale per soddisfarlo. Il dwell a ciascun checkpoint, più le letture del monitor durante il dwell, è ciò che un auditor vuole vedere.

Per HIPAA, la fase canary è anche dove il logging di audit per richiesta viene esercitato end-to-end. Ogni checkpoint produce un campione di ricevute firmate request-response; se una qualsiasi ha una gestione PHI mal configurata, emerge al 5% di traffico invece che al 100%.

## Fase ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Il monitor continuo + il formato della ricevuta rendono l'Articolo 17 GDPR verificabile.</span>
  </div>
</div>

Questa è la fase che si guadagna la storia di compliance. La fase Observe esegue un replay continuo dei trace attraverso il rilascio attivo, valutato dallo stesso judge ancorato all'umano del Gate, con un quality monitor che triggera un rollback automatico se viene violato.

Ogni decisione di rilascio — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback, **e ogni applicazione di patch DELETE per l'Articolo 17 GDPR** — emette una ricevuta vIndex. Hash-chained alla ricevuta precedente per questo cliente e alla ricevuta precedente per questo rilascio.

Ecco come appare una ricevuta reale per una patch DELETE dell'Articolo 17 GDPR — adattata direttamente dal formato documentato nella [pagina compliance](/it/compliance/):

```json
{
  "name": "gdpr-art17-patient-12348-removal",
  "version": 1,
  "base_model": "google/gemma-4-E2B-it",
  "manifest_sha256": "9abaeaf6c91f8b...",
  "previous_manifest_sha256": "8f72b1de4a93c5...",
  "created_at": "2026-05-29T03:17:42Z",
  "user_id": "compliance-officer-7c4e1a",
  "operation": {
    "op": "delete",
    "entity": "patient-record-12348",
    "relation": "diagnosis-association",
    "target": "weight-feature-11179-layer-27",
    "weight": -1.0
  },
  "verification": {
    "before_feature_11179_score": 17.34,
    "before_feature_11179_rank": 1,
    "after_feature_11179_score": null,
    "after_feature_11179_rank": "ABSENT_FROM_TOP_25",
    "perplexity_delta_wikitext103": "+0.02%",
    "vindex_sha256_before": "abc12...",
    "vindex_sha256_after":  "def34..."
  },
  "weight_attestation_class": "full",
  "chain_signature": "sha256(manifest || prev_manifest || user_id || created_at || prev_chain_signature)"
}
```

Quell'artefatto è verificabile. Un auditor non deve fidarsi dei nostri log. Prende `vindex_sha256_after`, scarica il vIndex pubblicato corrispondente da `huggingface.co/Divinci-AI`, e verifica che la feature 11179 nel layer 27 sia strutturalmente assente dalla top-25. Prende la `chain_signature` e la verifica contro la ricevuta precedente. L'intera catena è ancorata esternamente secondo una scheduling configurato dal cliente.

**Stessa operazione contro un modello ad API chiuse.** I campi della ricevuta sopra cambiano in tre modi: `operation.target` diventa `provider_api_endpoint`, `verification` diventa uno schema diverso che copre solo l'evidenza della catena decisionale, e `weight_attestation_class` diventa `decision_chain_only`. Il provider del modello ad API chiuse non ha esposto i pesi, quindi la ricevuta lo dice. Un auditor che vuole prova a livello di pesi ora sa che deve fare escalation al provider, non a noi.

Questa è la differenziazione che nessun altro nel 2026 rilascia. Il fronte eval-CI (Braintrust, Humanloop, Patronus) non si interpone sul traffico e non emette ricevute decisionali. Il fronte serving-canary (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) emette log di metriche infra ma non ricevute di compliance hash-chained. Il fronte observability (Arize, Phoenix, Confident, Deepchecks) osserva l'output ma non applica policy.

## Cosa verifica davvero un auditor?

Un esercizio utile: scorrere le domande che un vero auditor farà, e quale artefatto risponde a ciascuna.

| Domanda dell'auditor | Artefatto che risponde |
|---|---|
| *"Quale versione del modello era in esecuzione il 15 marzo alle 14:22 UTC?"* | La ricevuta della fase Observe per quel timestamp, firmata e hash-chained. |
| *"Quale evaluation ha passato questo rilascio prima del promote?"* | La ricevuta della fase Gate, con la tabella ρ di Spearman per slice e l'SHA del dataset su cui il gate è stato eseguito. |
| *"Una richiesta di erasure ex Articolo 17 GDPR per il paziente X è stata effettivamente applicata?"* | La ricevuta della patch DELETE sopra. L'auditor verifica `vindex_sha256_after` contro il vIndex pubblicato. |
| *"Chi ha approvato questo rilascio? Qual era la motivazione dichiarata per fare override sul gate della slice IP-licensing?"* | Il blocco `override` della ricevuta della fase Gate, incluso lo user ID e la motivazione testo libero obbligatoria. |
| *"Quanto velocemente è partito il rollback, e quale lettura del monitor l'ha triggerato?"* | La ricevuta di rollback della fase Observe, con le tre letture consecutive sotto soglia di qualità e il tempo trascorso del rollback. |
| *"Mostrami l'evidenza di monitoraggio post-market degli ultimi 90 giorni."* | La catena di ricevute della fase Observe. Ancorata esternamente secondo la scheduling configurata dal cliente. |

Cosa l'auditor *non deve fare*: fidarsi del nostro Datadog. Fidarsi del nostro CloudWatch. Fidarsi di uno screenshot. Fidarsi di un export. Lo scopo del formato della ricevuta è proprio che l'auditor possa verificarla in modo indipendente.

## Cosa questo non risolve

Tre limiti onesti:

**Le regressioni ad API chiuse in territorio Articolo 17 GDPR non sono risolvibili a livello di piattaforma.** Se stai servendo un assistente sanitario dietro un modello ad API chiuse e un paziente invoca l'Articolo 17, la piattaforma può attestare che il record del paziente è stato rimosso dal tuo store di retrieval, dal tuo prompt template e dalle tue regole di routing — ma non può attestare che i pesi del modello sottostante abbiano dimenticato i dati del paziente. Ti serve o un backing a pesi aperti o un impegno del vendor per l'erasure a livello di pesi. Lo dichiariamo nella ricevuta.

**La documentazione è necessaria ma non sufficiente.** Una ricevuta che dimostra che un modello ha raggiunto una soglia non dimostra che la soglia fosse quella giusta. Se la tua suite scored-QA non copre la slice che davvero conta per un paziente nel tuo servizio, nessuna quantità di concatenamento di ricevute lo risolve. I regolatori lo capiscono sempre di più; "abbiamo passato la nostra eval" non è più una risposta di compliance sufficiente se l'eval era l'eval sbagliata.

**Il formato vIndex è single-vendor.** Lo usiamo perché è la primitiva crittografica più concreta disponibile oggi per la prova a livello di pesi. Se l'industria converge su un formato diverso — model-card-con-hash, schemi di artefatti pubblicati dal NIST — il formato della ricevuta dovrebbe evolvere in quella direzione. La sostanza (hash-chained, verificabile esternamente, consapevole della weight-attestation) è ciò che è vincolante, non il nome specifico dello schema. Ci aspettiamo che cambi man mano che il panorama regolatorio e degli standard matura.

## FAQ

### Cos'è l'erasure verificabile ai sensi dell'Articolo 17 GDPR per i sistemi AI?

Erasure verificabile significa che una terza parte può verificare che i dati siano stati rimossi senza doversi fidare dei tuoi log. Fare fine-tuning di un modello perché "dimentichi" un'informazione specifica non soddisfa questo standard — l'informazione può riemergere sotto prompting avversariale, e non c'è una primitiva crittografica che un auditor possa controllare. Una patch DELETE a livello di pesi con un hash vIndex pubblicato prima/dopo *soddisfa* lo standard, perché l'auditor può ri-eseguire la verifica contro l'artefatto pubblico.

### Perché i modelli ad API chiuse non possono soddisfare l'Articolo 17 GDPR allo stesso modo?

Perché il provider non espone i pesi. Senza accesso ai pesi, nessuna terza parte — incluso il cliente che usa l'API — può emettere o verificare un'erasure a livello di pesi. La parte della catena decisionale della ricevuta (quale prompt template è stato usato, da quale store di retrieval provenivano i dati, quali regole di routing erano attive) rimane verificabile, ma la rivendicazione a livello di pesi no. È un limite di ciò che è verificabile quando i pesi sono privati, non un limite del framework di compliance.

### Cosa richiede l'Allegato IV dell'EU AI Act, in parole semplici?

L'Allegato IV chiede documentazione tecnica che copra la logica del sistema, il riepilogo dei training data, l'uso previsto, le misure di supervisione umana e il monitoraggio post-market. La trappola in cui cadono molti team è trattarli come cinque documenti separati. Il manifest di rilascio alla Fase 1 porta le prime tre richieste come singolo hash; la fase Gate copre la quarta; le fasi Roll + Observe coprono la quinta. Una sola pipeline; quattro richieste soddisfatte come sottoprodotto delle operazioni normali.

### Quanto rapido dovrebbe essere il rollback per deployment coperti da HIPAA?

HIPAA non specifica un tempo di rollback, ma la guidance HHS sulla risposta a violazioni tratta il tempo-al-contenimento come vincolante. Un rollback nell'ordine dei secondi (drain in-flight su un flip pilotato da manifest — il nostro numero è intorno ai 12 secondi) è strutturalmente più veloce di un tipico blue-green su metriche infra che dipende dalla propagazione di allarmi. Confronta con i postmortem pubblici: l'incidente Cloudflare del giugno 2022<sup><a href="#ref-4">[4]</a></sup> ha richiesto 44 minuti per il revert perché gli ingegneri si sovrapponevano sui revert.

### Come si mappa il NIST AI RMF su una pipeline di rilascio?

Le quattro funzioni core del NIST AI RMF — Govern, Map, Measure, Manage — coprono l'intero ciclo di vita del rilascio, non una singola fase. Govern è la policy di rilascio documentata più il workflow di motivazione per gli override del gate (fasi Register + Gate). Map è la suite scored-QA per slice (Gate). Measure sono le soglie di Spearman per slice e il quality monitor continuo (Gate + Observe). Manage è il percorso di rollback e la catena delle ricevute (Observe). Tutte e quattro sono coperte quando la pipeline emette il set completo di ricevute.

## Riferimenti

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. L'Allegato IV definisce i requisiti di documentazione tecnica per i sistemi AI ad alto rischio: logica del sistema, riepilogo dei training data, misure di supervisione umana, monitoraggio post-market. Sanzioni fino al 7% del fatturato globale per non-compliance.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> 600, max <code>MaximumExecutionTimeoutInSeconds</code> 1800. Citato come il canary su metriche infra standard del settore con cui il quality monitor della Fase 4 viene contrapposto.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Accordo LLM-as-judge calibrato.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% di accordo complessivo GPT-4-vs-umano, con varianza per categoria dal coding (86%) allo writing (36–44%). Ancora per la calibrazione di Spearman per slice che pilota la fase Gate.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Outage Cloudflare giugno 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 minuti dal "sappiamo cosa fare revert" al revert completo perché gli ingegneri si sovrapponevano sui revert. Ancora per l'affermazione "un rollback pilotato da manifest non può avere quella failure mode".
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Voluntary framework — Govern, Map, Measure, Manage — that has become the de facto enterprise procurement baseline for AI governance. Voluntary but enforced in practice through customer due-diligence questionnaires.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Minimum-necessary disclosure, access audit, and breach response timing requirements applicable to any AI system that touches PHI. Civil monetary penalties up to $1.9M per violation-type per year per <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">CMP inflation adjustment, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Article 17 (Right to Erasure).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. The data subject's right to obtain erasure of personal data, and the controller's obligation to demonstrate compliance under Article 5(2) accountability. Penalties up to €20M or 4% of annual global turnover.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — vIndex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/compliance/">compliance page</a> and demonstrated in the <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*Prossimo nella serie:* **Pipeline LLM CI/CD automatizzate con rollback istantaneo.** Questo post ha mostrato cosa vuole un auditor. Il prossimo mostra il pattern operativo che fa arrivare la ricevuta sulla scrivania dell'auditor in secondi anziché settimane — l'automazione sotto la pipeline a quattro fasi, con focus su cosa cambia quando il rollback parte da solo.
