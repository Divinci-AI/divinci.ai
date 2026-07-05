+++
title = "Divinci Local Inference — Informativa sulla privacy"
description = "Informativa sulla privacy per l'estensione Chrome Divinci Local Inference: cosa viene eseguito localmente sul tuo dispositivo e cosa, in specifiche situazioni con accesso effettuato, viene inviato a Divinci."
template = "page.html"
+++

# Divinci Local Inference — Informativa sulla privacy

**Ultimo aggiornamento:** giugno 2026

La presente informativa si applica specificamente all'estensione Chrome
**Divinci Local Inference**. Per il sito web, le app e i servizi di Divinci AI
in generale, consulta la nostra [Informativa sulla privacy](/it/privacy-policy/)
principale.

Divinci Local Inference esegue un modello di IA open-weight (Gemma 4 di
Google) localmente nel tuo browser, sulla tua GPU e — quando scegli di
effettuare l'accesso — collega tale assistente locale al tuo account Divinci
per funzionalità facoltative assistite dal cloud. La presente informativa
spiega esattamente cosa rimane sul tuo dispositivo e cosa, in situazioni
specifiche, viene inviato a Divinci.

**In sintesi:** per impostazione predefinita l'estensione è solo locale — le
tue chat con il modello on-device non lasciano mai il tuo computer. Alcune
funzionalità facoltative e chiaramente controllabili (accesso, risposte
contestuali alla pagina e chat in modalità account) inviano dati a Divinci.
Sono descritte di seguito. Non vendiamo i tuoi dati, non mostriamo pubblicità
e non li utilizziamo per tracciarti sul web.

## 1. Cosa rimane sul tuo dispositivo (impostazione predefinita)

- **Le tue chat con il modello Gemma locale.** I prompt e le risposte sono
  elaborati sulla tua GPU e non vengono registrati, memorizzati o trasmessi
  dall'estensione. (Eccezioni: le due funzionalità facoltative descritte nelle
  Sezioni 3 e 4.)
- **I file del modello**, memorizzati nella cache del browser dopo il primo
  download.
- **Le tue impostazioni** (modello selezionato, impostazioni predefinite di
  inferenza, opzioni di privacy), memorizzate localmente nel tuo browser.

Quando **non hai effettuato l'accesso**, l'estensione **non** invia alcuna
informazione di navigazione a Divinci.

## 2. Accesso a Divinci (facoltativo)

Se fai clic su **Accedi / Registrati**, l'estensione completa un accesso OAuth
standard con il fornitore di identità di Divinci (Auth0). In caso di esito
positivo, riceviamo e memorizziamo **sul tuo dispositivo** un token di accesso
e il tuo profilo di base (email, nome e URL dell'avatar), in modo che
l'estensione possa mostrare con quale account hai effettuato l'accesso ed
eseguire richieste autenticate per tuo conto. Il token di accesso non lascia
mai il service worker in background dell'estensione. Puoi disconnetterti in
qualsiasi momento dal popup nella barra degli strumenti, il che elimina i
token memorizzati.

## 3. Attività di navigazione web (solo con accesso effettuato **e** pannello aperto)

Per indicarti se la pagina che stai visualizzando è coperta dall'indice di
conoscenza pubblico e condiviso del web di Divinci e per basare le risposte su
di esso, l'estensione — **solo quando hai effettuato l'accesso e hai il
pannello laterale di Divinci aperto su una pagina** — invia quanto segue
all'API di Divinci:

- **L'indirizzo della pagina**, ridotto alla sola origine e al percorso. La
  stringa di query e il frammento (le parti dopo `?` e `#`, che possono
  contenere termini di ricerca, token o identificatori personali) vengono
  **rimossi prima dell'invio**.
- **Un'impronta digitale (hash) monodirezionale del testo visibile della
  pagina**, utilizzata per rilevare se il nostro indice è aggiornato. **Il
  contenuto effettivo della pagina non viene inviato** — solo questo hash e
  l'indirizzo ridotto.

Limiti importanti:

- Ciò avviene **solo mentre il pannello laterale è aperto** su una pagina. Con
  il pannello chiuso, l'estensione non invia nulla riguardo alle pagine che
  visiti.
- **I siti sensibili vengono completamente esclusi** — l'estensione non invia
  nulla per le pagine di accesso/account, i siti bancari e finanziari, la
  webmail, i portali sanitari, gli indirizzi locali/privati o le porte non
  standard.
- Viene utilizzato per consultare e aggiornare l'indice pubblico del web,
  **non** per costruire un tuo profilo o per indirizzare pubblicità.

L'indice condiviso stesso viene costruito da Divinci effettuando la scansione
di pagine web **pubblicamente accessibili** sui propri server; questa
estensione non carica contenuti di pagina per costruirlo.

## 4. Risposte contestuali alla pagina e chat in modalità account (facoltative)

- **Risposte contestuali alla pagina (grounding).** Quando una pagina è
  presente nell'indice e invii un messaggio nel pannello laterale, l'estensione
  invia **il tuo messaggio e l'indirizzo ridotto della pagina** a Divinci per
  recuperare il contesto pertinente, che viene poi fornito al modello locale.
  In questo caso, quindi, il tuo messaggio di chat lascia effettivamente il tuo
  dispositivo. Puoi disattivare questa funzionalità — vedi la Sezione 5.
- **Chat in modalità account.** Se attivi *"Usa il mio account Divinci"* per la
  chat, la tua conversazione viene inviata ai server di Divinci (per eseguire
  modelli e strumenti ospitati sul server) e memorizzata come trascrizione sul
  tuo account, esattamente come quando chatti su chat.divinci.app. Lasciando
  questa opzione disattivata, la chat rimane interamente locale.

## 5. I tuoi controlli sulla privacy

Nel popup, in **Impostazioni avanzate → Privacy**:

- **Recupera il contesto della pagina di Divinci** — quando disattivata,
  l'estensione non invia mai il tuo messaggio per le risposte contestuali alla
  pagina (la tua richiesta di chat rimane sul tuo dispositivo). Predefinito:
  attiva.
- **Consenti a Divinci di utilizzare le chat del mio account** — quando
  disattivata, l'estensione chiede a Divinci di non utilizzare le tue chat in
  modalità account per migliorare i propri servizi. Predefinito: attiva.
  (Questo invia un segnale di opt-out con le tue richieste; la gestione
  effettiva è garantita dai server di Divinci.)

Puoi anche rimanere **senza accesso effettuato** (interamente locale) o
**disconnetterti** in qualsiasi momento per interrompere tutto quanto
descritto nelle Sezioni 2-4.

## 6. Dove vanno i dati

- **huggingface.co** (e la CDN `cas-bridge.xethub.hf.co`) — per scaricare i
  file del modello, soggetti all'[Informativa sulla privacy di Hugging Face](https://huggingface.co/privacy).
- **Il fornitore di identità di Divinci** (Auth0) — solo durante l'accesso.
- **L'API di Divinci** (`api.divinci.app`) — per le funzionalità con accesso
  effettuato descritte nelle Sezioni 3 e 4.

## 7. Cosa **non** facciamo

- **Non** vendiamo né affittiamo i tuoi dati.
- **Non** mostriamo pubblicità né utilizziamo i tuoi dati per la pubblicità o
  per il tracciamento cross-site.
- **Non** inviamo il **contenuto** delle pagine che visiti (solo l'indirizzo
  ridotto e un hash monodirezionale, come indicato nella Sezione 3).
- **Non** trasmettiamo nulla riguardo alla tua navigazione quando non hai
  effettuato l'accesso o quando il pannello laterale è chiuso.

## 8. Autorizzazioni

- **offscreen** — eseguire il modello WebGPU.
- **storage** — memorizzare localmente le impostazioni e la preferenza relativa
  al modello memorizzato nella cache.
- **identity** — completare l'accesso OAuth al tuo account Divinci (Sezione 2).
- **host permissions** (`api.divinci.app` e l'origine di accesso Auth0) —
  eseguire le richieste autenticate descritte nelle Sezioni 2-4.
- **content script su tutti i siti** — disegnare il pannello laterale e, solo
  mentre è aperto e hai effettuato l'accesso, eseguire il controllo
  dell'indice della pagina descritto nella Sezione 3. Lo script legge il
  titolo della pagina, l'indirizzo e il testo visibile **localmente** per
  calcolare l'hash; non trasmette il contenuto della pagina.
- **externally_connectable** (solo domini Divinci AI) — consentire a
  chat.divinci.app di utilizzare il modello locale tramite una porta
  `chrome.runtime`.

## 9. Open source

L'estensione è concessa in licenza Apache-2.0; il codice sorgente è
disponibile su [github.com/Divinci-AI/gemma-gem](https://github.com/Divinci-AI/gemma-gem).

## 10. Modifiche alla presente informativa

Se modifichiamo il modo in cui l'estensione gestisce i dati, aggiorneremo la
presente informativa e incrementeremo la versione dell'estensione (mostrata
nella scheda `chrome://extensions`).

## 11. Contatti

Domande? Scrivi a [mike@divinci.ai](mailto:mike@divinci.ai).
