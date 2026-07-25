+++
title = "Sicurezza"
description = "Come Divinci AI protegge i tuoi dati — de-identificazione, controllo degli accessi, registrazione di audit e risposte oneste su dove ci troviamo riguardo alle certificazioni formali."
template = "page.html"
+++

# Sicurezza

La sicurezza è al centro del nostro modo di costruire. Questa pagina descrive
ciò che è davvero vero oggi sulla nostra architettura e sulle nostre pratiche
— non è una lista di spunte a scopo di marketing. Dove non abbiamo ancora
completato qualcosa (un audit formale, una certificazione), lo diciamo
chiaramente invece di lasciar intendere il contrario.

## Architettura predisposta per HIPAA

![Architettura predisposta per HIPAA](/brand/badges/hipaa-ready.svg)

Abbiamo integrato nella piattaforma, per impostazione predefinita, le
salvaguardie tecniche di cui ha bisogno un flusso di lavoro soggetto a HIPAA:

- **De-identificazione prima dell'archiviazione o dell'elaborazione con IA.**
  I contenuti delle chat possono essere instradati attraverso una fase
  automatica di oscuramento di PII/PHI (Microsoft Presidio, con un modello
  ottimizzato per testi clinici disponibile per contesti medici) prima che
  tocchino il nostro database, i nostri fornitori di IA o la
  ricerca/recupero — rilevando tutte le 18 categorie di identificatori del
  metodo Safe Harbor (approdo sicuro) di HIPAA. Questa fase è a chiusura
  sicura: se l'oscuramento non può essere eseguito, il messaggio viene
  rifiutato anziché essere archiviato silenziosamente senza oscuramento.
- **Registrazione di audit a prova di manomissione.** Gli accessi ai dati
  sensibili sono registrati in un log concatenato tramite hash, progettato in
  modo che le voci non possano essere alterate silenziosamente a posteriori.
- **Controllo degli accessi basato sui ruoli e a livello di risorsa.** Sia i
  ruoli a livello di piattaforma sia i permessi per singola risorsa
  determinano chi può vedere che cosa.
- **Crittografia in transito e a riposo**, con crittografia a livello di
  campo disponibile per i dati sensibili designati.

**Che cosa NON è tutto questo:** non è una certificazione di conformità
HIPAA. Non esiste alcun certificato HIPAA rilasciato da enti governativi — la
conformità è una combinazione di salvaguardie tecniche (sopra), politiche
amministrative scritte e accordi firmati con i responsabili del trattamento
(Business Associate Agreement, BAA) con ogni fornitore presente nel percorso
dei dati, valutata caso per caso per ogni singolo rapporto con il cliente. Se
hai bisogno di trattare Informazioni Sanitarie Protette (PHI) con noi
nell'ambito di un Business Associate Agreement,
[parliamone](https://meetings.hubspot.com/michael-mooring/divinci-ai) —
esamineremo insieme che cosa serve per il tuo caso d'uso specifico.

## Protezione dei dati

### Crittografia

- **In transito**: TLS ovunque tra i client, il nostro edge e la nostra
  infrastruttura di origine.
- **A riposo**: crittografia a livello di provider sul nostro datastore
  principale e sull'object storage, più un livello dedicato di crittografia a
  livello di campo per i campi sensibili designati.
- **Gestione dei segreti**: le credenziali e le chiavi API sono gestite
  tramite un gestore di segreti centralizzato, non inserite nel codice né
  archiviate in configurazioni in chiaro. La produzione è configurata per
  fallire in modo chiuso, anziché ripiegare silenziosamente su credenziali
  obsolete, se il servizio dei segreti non è raggiungibile.

### Minimizzazione dei dati

- La de-identificazione (sopra) fa sì che le PII/PHI originali vengano
  scartate e non conservate, ovunque venga eseguita quella pipeline — la
  minore impronta possibile nel caso in cui un sistema a valle venga mai
  compromesso.
- I log contengono solo metadati per policy: non scriviamo il contenuto dei
  messaggi, gli indirizzi email o altri dati personali nei log applicativi o
  nei messaggi di errore.

### Controlli degli accessi

- **Autenticazione** tramite Auth0.
- **Controllo degli accessi basato sui ruoli** (a livello di piattaforma) più
  **permessi per singola risorsa** (a livello di documento/spazio di lavoro)
  — privilegio minimo per impostazione predefinita.
- **Revisioni trimestrali degli accessi e delle configurazioni** dei servizi
  di produzione.

## Sicurezza applicativa

- **Difesa XSS al confine di rendering**: i contenuti generati dagli utenti e
  dall'IA vengono sanificati (DOMPurify) ovunque siano resi come HTML;
  l'iniezione di HTML grezzo proveniente da fonti non attendibili non è
  consentita.
- **Test di autorizzazione**: eseguiamo test di sicurezza manuali e assistiti
  dall'IA, condotti internamente, su staging e produzione, comprese sonde
  autenticate di autorizzazione/IDOR — ciò che non abbiamo (ancora) è un
  programma ricorrente di penetration testing svolto da terze parti, e non
  intendiamo dichiararne uno finché non esisterà davvero.
- **Revisione delle dipendenze e del codice**: revisione del codice standard
  su tutte le modifiche; aggiornamenti delle dipendenze tracciati tramite i
  nostri normali strumenti di build.

## Disponibilità e monitoraggio

- **Monitoraggio sintetico** sugli endpoint rivolti ai clienti, con avvisi al
  reperibile tramite PagerDuty entro pochi minuti da un'interruzione reale,
  non solo in caso di errori del server — controlli verificati sul contenuto,
  non semplicemente "ha restituito 200".
- **Infrastruttura multi-regione** (edge Cloudflare + origine Google Cloud)
  con backup automatici sul nostro datastore principale.
- Al momento non pubblichiamo alcuno SLA contrattuale di uptime. Se il tuo
  caso d'uso ne richiede uno, chiedicelo — possiamo discutere che cosa sia
  realistico per il tuo deployment.

## Risposta agli incidenti

Manteniamo un processo documentato di risposta agli incidenti: rilevamento e
classificazione, contenimento, una valutazione onesta se un incidente
costituisca o meno una violazione soggetta a notifica, rimedio e un
post-mortem senza colpevolizzazioni che si ripercuote su ciò che monitoriamo
in seguito. Se sei un cliente vincolato a noi da un Business Associate
Agreement, quell'accordo specifica i nostri obblighi di notifica nei tuoi
confronti — prevalgono quei termini, non questa pagina.

Per segnalare un problema di sicurezza o una vulnerabilità sospetta, scrivi a
**security@divinci.ai**. Al momento non gestiamo alcun programma formale di
bug bounty; prendiamo però sul serio le segnalazioni e collaboreremo con te
in buona fede.

## A che punto siamo con le certificazioni formali

Siamo diretti su questo punto, dato che molte pagine sulla sicurezza non lo
sono:

- **HIPAA**: vedi "Architettura predisposta per HIPAA" qui sopra. Se sia
  applicabile o meno un Business Associate Agreement dipende dal tuo
  specifico rapporto con noi — lo valutiamo cliente per cliente, non come
  un'affermazione generalizzata.
- **SOC 2**: non ancora avviata. È nella nostra roadmap; aggiorneremo questa
  pagina quando ci sarà qualcosa di reale da riferire — non prima.
- **ISO 27001, FedRAMP, PCI DSS**: non siamo in possesso di queste
  certificazioni. I pagamenti con carta sono elaborati tramite Stripe;
  Divinci non archivia direttamente i dati dei titolari di carta.

Preferiamo dichiarare meno di quel che facciamo ed essere degni di fiducia,
piuttosto che dichiarare più del dovuto e poi dover fare marcia indietro.

### Contatti

Domande sulla sicurezza, segnalazioni di vulnerabilità o domande sulla
conformità per una specifica trattativa: **security@divinci.ai**
