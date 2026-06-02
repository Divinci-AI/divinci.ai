+++
title = "Pipeline CI/CD per LLM automatizzate con rollback istantaneo"
description = "Lo strato operativo della pipeline a quattro fasi: quali decisioni partono in automatico, com'è una prova di rollback reale, e il numero MTTR."
date = 2026-05-30T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "CI/CD", "Automation", "Rollback", "MTTR", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-llm-ci-cd-pipelines-with-instant-rollback-veo31.webm"
hero_video_poster = "/images/automated-llm-ci-cd-pipelines-with-instant-rollback-hero-poster.webp"
reading_time = 11
summary = "Tra un'approvazione umana e l'altra, una pipeline di rilascio per LLM o si gestisce da sola o non lo fa. Questo post è il complemento operativo del post sull'architettura — disegna lo spettro dell'automazione (quali decisioni partono in autonomia, quali richiedono un umano e quali blocchiamo finché qualcuno non firma l'override), mostra com'è fatta davvero una prova di rollback e si chiude con il numero di MTTR che ne esce dall'altra parte."
+++

*Appunti dal ciclo di rilascio — Parte V*

---

La pagina più citata che non è uscita lo scorso trimestre è quella che il nostro osservatore ha attivato da solo alle 2:14 del mattino. Il rilascio candidato aveva superato il gate, era rimasto al 5% per i quattro minuti richiesti, era avanzato al 25% e poi si era fermato lì. Il monitor di qualità al minuto ha visto tre letture consecutive sotto soglia sulla slice del dominio legale, ha interrotto il rollout e ha rimesso il routing sul rilascio precedente. Quando la notifica all'ingegnere di turno è partita — per la ricevuta, non per un'interruzione — il traffico di produzione era già tornato sul rilascio noto-buono da nove minuti.

Nessuno doveva fare nulla. L'architettura del [primo post di questa serie](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) descrive quali sono le quattro fasi. Questo post parla di cosa gira tra un'approvazione umana e l'altra — lo strato di automazione sotto l'architettura, il confine in cui la pipeline o fa la cosa giusta da sola o non la fa.

L'affermazione di apertura: **la maggior parte delle decisioni della pipeline dovrebbe essere automatizzata, ma non tutte**. Il confine conta. La pipeline che automatizza tutto prima o poi promuoverà un rilascio che un umano avrebbe dovuto intercettare; la pipeline che non automatizza nulla non ha motivo di esistere. Tracciare bene quel confine è il tema di questo post.

## Lo spettro dell'automazione

Ogni decisione della pipeline si colloca da qualche parte su uno spettro che va da *"parte da sola senza alcuna notifica umana"* a *"si rifiuta di procedere senza un'approvazione esplicita firmata."* Qui sotto vedete dove si colloca su quello spettro ciascuna delle azioni portanti della pipeline che abbiamo in produzione.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Lo spettro dell'automazione. Da completamente automatizzato a sinistra a sempre richiede approvazione umana a destra. Decisioni rappresentate: all'estremità completamente automatizzata, la valutazione al minuto dell'osservatore di qualità, il controllo di salute al checkpoint canary e il trigger di auto-rollback; al centro, l'avanzamento dopo il gate-pass e la promozione al checkpoint canary; verso il lato umano, la registrazione del deploy in produzione e il commit del manifest; all'estremità sempre-umana, la decisione di override su gate-fail e il deploy shadow per un rilascio cold-start.">
<title>Lo spettro dell'automazione</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Lo spettro dell'automazione</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Dove si colloca ciascuna decisione portante della pipeline, da completamente autonoma (sinistra) a sempre-umana (destra).</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">COMPLETAMENTE AUTOMATIZZATO</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">parte da solo,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">nessuna notifica</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">SOLO-NOTIFICA</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">gira automaticamente;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">ricevuta + alert</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">PROCEDI-SE-OK</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">un umano può vetare in</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">una finestra nota</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">AVVIATO-DALL'UMANO</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">richiede un'azione</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">esplicita dell'utente</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">SEMPRE-UMANO</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">rifiuta senza</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">motivazione firmata</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Valutazione di qualità</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">al minuto dell'osservatore</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">gira in continuo</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">su campione trace al 5%</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Controllo di salute</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">al checkpoint canary</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + qualità</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">output a 5/25/100</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Trigger di</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">auto-rollback</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 minuti consecutivi</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">sotto soglia</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Avanzamento post gate-pass</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">verso canary</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">tutte le slice ≥ soglia</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ avvio auto al 5%</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Checkpoint</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">avanza se i monitor</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">tengono durante il dwell</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Registrazione</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">del rilascio</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">il cliente esegue il commit</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">di un nuovo manifest</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Override su gate-fail</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">richiede motivazione</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">scritta nell'audit log</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">Marcatori rossi</tspan> = le due decisioni in cui il comportamento della pipeline è asimmetrico: l'auto-rollback parte da solo e non si può disattivare; l'override su gate-fail si rifiuta di procedere e non si può saltare la motivazione.</text>
</svg>
</figure>

Due dei marcatori qui sopra sono rossi anziché colorati per zona. Sono le decisioni asimmetriche — i due punti in cui la pipeline prende una posizione forte su chi può decidere cosa. Il **trigger di auto-rollback** parte senza chiedere; non si può disattivare nella configurazione, perché il senso stesso di averlo è che funzioni alle 2:14 del mattino. L'**override su gate-fail** rifiuta di avanzare senza una motivazione scritta; non si può disattivare nemmeno quello, perché il senso stesso di averlo è che il te-futuro deve poter leggere il motivo. Il resto della pipeline è in gran parte configurabile; questi due no.

## Come parte davvero l'auto-rollback

La domanda più frequente sull'auto-rollback è *"cosa gli impedisce di partire per il motivo sbagliato?"* La risposta onesta è: nessun singolo elemento da solo. La protezione viene da come è cablato il trigger.

La fase di Observe esegue un loop di scoring al minuto. Ogni minuto:

1. Campiona un piccolo insieme di trace di produzione recenti dal rilascio attivo.
2. Riproduce ciascuna trace attraverso il *modello attivo* (non il candidato — stiamo valutando ciò che sta effettivamente servendo).
3. Assegna un punteggio a ciascun replay usando lo stesso giudice calibrato e ancorato all'umano che ha pilotato il Gate-2<sup><a href="#ref-1">[1]</a></sup>.
4. Calcola un singolo punteggio di qualità output sul campione. Lo scrive in `CanaryHealthSample`.

Il rollback parte quando **tre campioni consecutivi al minuto** scendono sotto la soglia di rollback (default: 0,85 della soglia del gate — quindi 0,55 se il gate era 0,65). Non un solo minuto cattivo; tre. Il lockout di tre minuti è il filtro anti-rumore — una singola lettura anomala non innesca nulla, ma una regressione prolungata sì.

Quando il lockout si rompe, il worker di rollback esegue:

```bash
# In sostanza — la pipeline lo esegue da sola. Nessuna ack umana.
POST /api/v1/releases/<previous_release_sha>/activate
# risposta in <1s; drain in-flight in ~12s su un servizio da ~100 repliche
```

Parte una ricevuta. L'ingegnere di turno vede una notifica Slack *per la ricevuta*, non per un'interruzione. Apre la ricevuta; vede le tre letture sotto soglia, il tempo trascorso e gli hash `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup>. Dodici secondi sono il tempo di drain in-flight; lo swap in sé è sub-secondo. Quando l'ingegnere è abbastanza sveglio da chiedersi "devo fare qualcosa?" la risposta è "no, ma dovresti comunque guardare perché il gate l'ha lasciato passare."

## La ricevuta vera di auto-rollback

Ecco come si presenta la ricevuta in produzione. Stesso formato hash-chained documentato sulla [pagina compliance](/it/compliance/), con i campi aggiuntivi specifici di un evento di auto-rollback:

```json
{
  "kind": "auto_rollback",
  "release_id": "rel_a01c66",
  "previous_release_id": "rel_8f72b1",
  "trigger_at": "2026-05-29T02:14:23Z",
  "completed_at": "2026-05-29T02:14:35Z",
  "elapsed_seconds": 12,
  "trigger_reason": "observer_quality_threshold_breach",
  "observer_readings": [
    { "minute_at": "2026-05-29T02:11:00Z", "quality_score": 0.523, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:12:00Z", "quality_score": 0.508, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:13:00Z", "quality_score": 0.491, "below_threshold": true,  "slice": "legal-IP-licensing" }
  ],
  "rollback_threshold": 0.55,
  "active_manifest_sha256_before": "9abaeaf6c91f8b...",
  "active_manifest_sha256_after":  "8f72b1de4a93c5...",
  "audit_chain_signature": "sha256(...)",
  "notified_users": ["oncall@customer.example"],
  "notification_sent_at": "2026-05-29T02:14:36Z"
}
```

La ricevuta stessa è il primo punto di contatto per chi è di turno. Leggerla risponde alle domande che un ingegnere mezzo addormentato si farebbe davvero: cosa l'ha innescata, quale slice è fallita, di quanto, quanto è durato lo swap, cosa sta girando adesso. Il prompt per l'azione successiva da lì è di solito *"vai a guardare perché il gate l'ha lasciato passare in prima battuta"* — e la ricevuta del rilascio fallito ha già la tabella Spearman per slice.

## Cosa la pipeline NON fa da sola

Il corollario di "l'auto-rollback parte senza chiedere" è che altre cose attivamente non possono partire da sole. Tre rifiuti espliciti.

**Non promuove un rilascio che ha fallito il gate senza un override firmato.** Un gate-fail marca il rilascio come `gate_fail`; l'endpoint `/activate` rifiuta di accettare lo SHA del manifest; nessuna formula da riga di comando aggira la cosa. L'unica via avanti è un force-override con `forceGateOverride: true` E `overrideReason: "<testo libero>"`. Il campo della motivazione è obbligatorio, a testo libero, e finisce nell'audit log insieme allo user ID. L'abbiamo progettato così perché il te-futuro possa leggere perché il te-attuale aveva deciso che la regressione su quella slice era accettabile. Tre persone hanno usato il percorso di override sul campo. Le loro motivazioni sono ancora nell'audit log.

**Non avanza da canary al 100% se un qualsiasi monitor sta degradando.** Se la latenza p95, il tasso di 5xx O lo score di qualità output sono fuori banda alla fine del dwell di un checkpoint, la pipeline si ferma a quel checkpoint e fa partire un alert. Non avanza per poi scusarsi dopo.

**Non avvia automaticamente un canary su un rilascio cold-start.** Un rilascio senza alcuna storia di traffico in produzione — un fine-tune fresco contro un dataset nuovo di zecca, ad esempio — non ha nulla con cui confrontare la propria qualità output. La pipeline rifiuta di avviare un canary su un rilascio cold-start. Richiediamo prima un deploy shadow di 24 ore, che osserva il candidato contro trace reali di produzione ma non serve nessuna delle sue risposte. Dopo 24 ore abbiamo una baseline di qualità; allora il canary può procedere. Più lento; onesto; non configurabile.

## Quanto è veloce il recupero, end-to-end?

Il numero di tempo di recupero che pubblichiamo è **12 secondi**. È il drain in-flight su un servizio da ~100 repliche. Lo swap del manifest in sé è sub-secondo. Per essere utile a chi legge, i 12 secondi vanno scomposti:

- **0–60 secondi prima del rollback:** arrivano le tre letture consecutive sotto soglia. La prima lettura sotto soglia fa partire il timer di lockout. Ogni minuto successivo estende il lockout se la qualità è ancora sotto soglia.
- **t = 0:** la terza lettura sotto soglia scrive in `CanaryHealthSample`. Il worker di rollback osserva il terzo strike e dispatcha `/activate previous_release`.
- **t < 1 secondo:** il puntatore al rilascio attivo del livello di routing (in Redis) si capovolge. Le nuove richieste iniziano a colpire il rilascio precedente.
- **t = da 1 a ~12 secondi:** il rilascio candidato continua a servire le richieste che erano in flight quando è avvenuto lo swap. Drain in-flight. Alcune risposte streaming impiegano 8–10 secondi a completarsi naturalmente, quindi la coda di pulizia è di circa 12s su un servizio tipico.
- **t ≈ 13 secondi:** la ricevuta dell'audit log viene scritta e firmata. Parte la notifica.

Confrontato con i postmortem pubblici che continuiamo a citare come ancore: l'outage Cloudflare di giugno 2022<sup><a href="#ref-3">[3]</a></sup> ha impiegato 44 minuti dal "sappiamo cosa fare il revert" al "il revert è completato" — e quello era il livello *infrastruttura*. L'outage Atlassian di aprile 2022<sup><a href="#ref-4">[4]</a></sup> ha impiegato 12 ore per sito perché lo stato era distribuito su più sistemi. La soglia "elite performer" di DORA<sup><a href="#ref-5">[5]</a></sup> per il recupero da deployment falliti è sotto un'ora. Dodici secondi non sono un ordine di grandezza meglio della soglia elite — sono tre ordini di grandezza meglio. La decisione architetturale che lo rende possibile è il manifest di rilascio bundled di [Stage 1](/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register). Senza il manifest non hai un singolo oggetto a cui ri-puntare il routing.

## Prove di rollback — la pratica poco glamour che nessuno fa

Ecco la parte che la maggior parte dei team salta: **l'unico segnale affidabile che il vostro percorso di rollback funziona è che avete fatto una prova deliberata, programmata, e l'avete confermata.** Ogni trimestre ne facciamo una. La prova procede così:

1. Scegli un orario in giorno feriale e orario lavorativo, programmato casualmente. Avvisa il team che sta arrivando, ma non l'ora precisa.
2. Inietta una regressione sintetica di qualità sulla slice del canary. (Abbiamo un flag in modalità test che permette al modello candidato di rispondere a un header magico con "Mi rifiuto di rispondere" — garantito di fallire il giudice calibrato.)
3. Spingi il rilascio di test attraverso il gate (lo passa — stiamo testando il rollback, non il gate). Avvia un canary.
4. L'osservatore nota tre letture sotto soglia. L'auto-rollback parte.
5. Aspetta che l'ingegnere di turno reagisca. Cronometra quanto ci mette. Annota se si fida abbastanza della ricevuta da *non* far partire l'allarme di rimando.
6. Verifica che l'audit log mostri il flag modalità-test nella ricevuta di rollback, così le audit future possono distinguere una prova da un incidente reale.

La prima prova che abbiamo fatto è durata 19 secondi end-to-end (12s di swap + 7s di delay di assestamento che abbiamo dovuto correggere). La prova più recente — Q1 2026 — è durata 12 secondi. La prova non si salta mai. Ogni trimestre; ogni cluster cliente.

La maggior parte dei team non ha mai eseguito una prova di rollback deliberata. La prima volta che il loro percorso di rollback gira è durante un incidente vero, sotto pressione, con più persone in chiamata. La prova è ciò che rende il numero dei 12 secondi un numero reale anziché aspirazionale.

## Cosa questo non risolve

Tre limiti onesti.

**L'auto-rollback può fare ping-pong.** Se sia il candidato CHE il rilascio precedente sono cattivi — diciamo che anche il precedente aveva una regressione di slice a lento sviluppo che nessuno aveva intercettato — la pipeline può fare rollback, poi anche il rilascio precedente fallisce il suo osservatore post-rollback, e non c'è un terzo rilascio a cui tornare. La pipeline ferma il traffico su una pagina di manutenzione anziché ondeggiare. La correzione è tenere più di un rilascio sano precedente indicizzato nella catena del manifest, così il target di rollback è configurabile.

**L'osservatore aggiunge costo di inferenza.** Riprodurre trace di produzione attraverso il modello attivo su un campione del 5% aggiunge circa il 5% alla spesa di inferenza. Pensiamo sia il giusto compromesso. Alcuni clienti pensano sia troppo caro su workload a margine basso e vogliono abbassare il tasso di campionamento. La manopola esiste.

**Un giudice cattivo è peggio di nessun giudice.** Se il giudice calibrato che pilota l'osservatore è esso stesso mal calibrato — drifted dall'ancora umana, o addestrato su un corpus stantio — l'osservatore può far partire l'auto-rollback per il motivo sbagliato. La cadenza di ricalibrazione conta. Il pezzo Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup> documenta la procedura; il requisito operativo è che la eseguiate davvero.

## FAQ

### Perché il trigger di rollback è tre minuti consecutivi anziché uno?

Perché i punteggi di qualità degli LLM hanno un noise floor — una singola lettura anomala al minuto può arrivare da una stranezza di campionamento (il campione trace del 5% è capitato su una slice difficile), non da una regressione reale. Il lockout di tre minuti è il filtro anti-rumore più economico che mantiene comunque il tempo totale di reazione sotto un minuto e mezzo. Abbiamo tarato in entrambe le direzioni; tre è il punto di equilibrio per la forma di traffico tipica dei nostri clienti. Il dwell è configurabile per ogni rilascio se la vostra forma di traffico è diversa.

### L'auto-rollback dovrebbe essere configurabile su "off"?

Nella nostra pipeline in produzione, no. Il senso di avere un meccanismo di sicurezza automatizzato è che funzioni alle 2:14 del mattino quando nessuno sta guardando. Un auto-rollback configurabile-off è un post-it che dice "una volta avevamo una rete di sicurezza." L'argomento per renderlo configurabile è che alcuni workload sono a stake troppo basso per giustificare qualunque falso-positivo di rollback. Pensiamo che quell'argomento porti nel posto sbagliato — se il vostro workload è a stake troppo basso per l'auto-rollback, non vi serve nemmeno una pipeline di rilascio.

### Come gestite il caso in cui anche il rilascio precedente era cattivo?

Il target di rollback è `previous_release` di default, ma la catena del manifest memorizza più storia del solo N-1. Gli operatori possono ri-targetizzare un rollback su qualsiasi SHA di manifest storicamente sano — `/api/v1/releases/<historically_good_sha>/activate` — che è il percorso di intervento manuale quando il rollback automatico a N-1 colpisce un rilascio precedente cattivo. La valvola di sfogo c'è. È raro.

### Qual è la metrica giusta da ottimizzare — MTTR o MTBF?

MTTR — Mean Time To Recovery — con ampio margine, almeno per i sistemi LLM. MTBF (Mean Time Between Failures) presuppone una nozione deterministica di "failure" che i workload LLM non hanno. La qualità output va in drift in continuo; "failure" è una decisione di soglia. Ottimizzare per il recupero veloce è robusto rispetto a dove tracci la soglia; ottimizzare per non fallire mai è fragile e falso. La soglia elite di DORA<sup><a href="#ref-5">[5]</a></sup> è essa stessa formulata in termini di MTTR, che è il framing corretto.

### Eseguite davvero prove di rollback?

Sì — trimestralmente, programmate, con un flag di modalità test nella ricevuta in modo che la prova possa essere distinta da un incidente reale nell'audit log. La prima prova che abbiamo fatto ha esposto un delay di assestamento di 7 secondi che non sapevamo ci fosse. La prova è l'unico modo per sapere se il percorso funziona davvero; leggere il runbook non basta. La maggior parte dei team non ne ha mai eseguita una, ed è per questo che i numeri di MTTR della maggior parte dei team sono aspirazionali anziché misurati.

## Riferimenti

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrazione LLM-as-judge.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). L'ancora del perché un giudice calibrato sia necessario e perché l'accordo per slice conti più dell'accordo aggregato. Il loop di scoring al minuto dell'osservatore dipende da questo.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Attestazione dei pesi vIndex.</strong> Documentato sulla <a href="/it/compliance/">pagina compliance Divinci</a> e illustrato nel <a href="/it/blog/validating-and-releasing-custom-lms-in-regulated-fields/">post sui campi regolamentati</a>. I campi `vindex_sha256_before/after` nella ricevuta di auto-rollback sono l'ancora crittografica che un auditor può verificare senza fidarsi dei nostri log.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Outage Cloudflare giugno 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Quarantaquattro minuti per fare il revert al livello infrastrutturale, in parte perché gli ingegneri si calpestavano i revert a vicenda. Ancora per l'affermazione "uno swap pilotato dal manifest non può avere quella modalità di fallimento".
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Outage Atlassian aprile 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 ore per sito per il ripristino, 14 giorni in totale per 883 siti, perché lo stato era distribuito su sistemi versionati indipendentemente. Ancora per l'affermazione "il manifest di rilascio bundled è la cosa che rende possibile parlare di secondi-non-ore".
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Soglia DORA per il recupero da deployment falliti.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. La soglia "failed deployment recovery time" per gli elite-performer è documentata come sotto un'ora. Il numero di 12 secondi della pipeline è tre ordini di grandezza sotto la soglia elite, che è il modo giusto di leggere il confronto.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrare il giudice AI.</strong> Il nostro post complementare <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. La procedura per tenere il giudice ancorato all'umano in calibrazione nel tempo. L'affermazione operativa di questo post — che l'auto-rollback funziona bene solo quanto il giudice che lo pilota — vale solo se il giudice viene effettivamente ricalibrato periodicamente.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Interno — riferimento alla pipeline Divinci.</strong> L'architettura sotto la quale sta questo strato di automazione: il <a href="/it/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">post sulla pipeline a quattro fasi</a>. L'intera superficie API è documentata nel <a href="/it/api/">riferimento API</a>; la sezione di release-management è quella di cui parla questo post.
</li>
</ol>

---

*Prossimo nella serie:* **CI Testing for Custom Language Models in 2026.** Questo post parla dello strato operativo tra le approvazioni umane. Il prossimo è lo strato *prima* che la pipeline parta — CI pre-merge: cosa valutare al momento della PR, quali tipi di regressioni intercettate davvero prima che il gate le veda e quali no.
