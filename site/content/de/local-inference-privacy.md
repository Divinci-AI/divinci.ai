+++
title = "Divinci Local Inference — Datenschutzrichtlinie"
description = "Datenschutzrichtlinie für die Chrome-Erweiterung Divinci Local Inference: was lokal auf Ihrem Gerät läuft und was in bestimmten Situationen bei angemeldeten Nutzern an Divinci gesendet wird."
template = "page.html"
+++

# Divinci Local Inference — Datenschutzrichtlinie

**Zuletzt aktualisiert:** Juni 2026

Diese Richtlinie gilt speziell für die Chrome-Erweiterung **Divinci Local
Inference**. Für die Website, Apps und Dienste von Divinci AI im Allgemeinen
siehe unsere allgemeine [Datenschutzrichtlinie](/de/privacy-policy/).

Divinci Local Inference führt ein offenes KI-Modell (Googles Gemma 4) lokal in
Ihrem Browser auf Ihrer GPU aus und verbindet diesen lokalen Assistenten –
wenn Sie sich dafür entscheiden, sich anzumelden – mit Ihrem Divinci-Konto für
optionale, cloudgestützte Funktionen. Diese Richtlinie erläutert genau, was
auf Ihrem Gerät verbleibt und was in bestimmten Situationen an Divinci
gesendet wird.

**Kurzfassung:** Standardmäßig ist die Erweiterung ausschließlich lokal – Ihre
Chats mit dem gerätelokalen Modell verlassen niemals Ihren Computer. Einige
optionale, klar kontrollierbare Funktionen (Anmeldung, seitenbewusste
Antworten und Chat im Kontomodus) senden Daten an Divinci. Diese werden weiter
unten beschrieben. Wir verkaufen Ihre Daten nicht, zeigen keine Werbung und
verwenden sie nicht, um Sie im Web zu verfolgen.

## 1. Was auf Ihrem Gerät verbleibt (Standardeinstellung)

- **Ihre Chats mit dem lokalen Gemma-Modell.** Prompts und Antworten werden
  auf Ihrer GPU berechnet und von der Erweiterung nicht protokolliert,
  gespeichert oder übertragen. (Ausnahmen: die beiden optionalen Funktionen in
  §3 und §4.)
- **Die Modelldateien**, die nach dem ersten Download in Ihrem Browser
  zwischengespeichert werden.
- **Ihre Einstellungen** (ausgewähltes Modell, Standardwerte für die
  Inferenz, Datenschutz-Umschalter), lokal in Ihrem Browser gespeichert.

Solange Sie **nicht angemeldet** sind, sendet die Erweiterung **keinerlei**
Browsing-Informationen an Divinci.

## 2. Anmeldung bei Divinci (optional)

Wenn Sie auf **Anmelden / Registrieren** klicken, führt die Erweiterung eine
standardmäßige OAuth-Anmeldung mit dem Identitätsanbieter von Divinci (Auth0)
durch. Bei Erfolg empfangen und speichern wir **auf Ihrem Gerät** ein
Zugriffstoken sowie Ihre grundlegenden Profildaten (E-Mail, Name und
Avatar-URL), damit die Erweiterung anzeigen kann, als wer Sie angemeldet
sind, und in Ihrem Namen authentifizierte Anfragen stellen kann. Das
Zugriffstoken verlässt niemals den Hintergrund-Service-Worker der
Erweiterung. Sie können sich jederzeit über das Popup in der Symbolleiste
abmelden, wodurch die gespeicherten Token gelöscht werden.

## 3. Web-Browsing-Aktivität (nur solange Sie angemeldet sind **und** das Panel geöffnet ist)

Um Ihnen mitzuteilen, ob die von Ihnen betrachtete Seite vom gemeinsam
genutzten öffentlichen Web-Wissensindex von Divinci erfasst ist, und um
Antworten darauf zu stützen, sendet die Erweiterung – **nur wenn Sie
angemeldet sind und das Divinci-Seitenpanel auf einer Seite geöffnet haben** –
Folgendes an die API von Divinci:

- **Die Adresse der Seite**, reduziert auf Ursprung (Origin) und Pfad. Der
  Abfragestring und das Fragment (die Teile nach `?` und `#`, die
  Suchbegriffe, Token oder personenbezogene Kennungen enthalten können)
  werden **vor dem Senden entfernt**.
- **Ein Einweg-Fingerabdruck (Hash) des sichtbaren Seitentexts**, mit dem
  geprüft wird, ob unser Index aktuell ist. **Der tatsächliche Inhalt der
  Seite wird nicht gesendet** – nur dieser Hash und die gekürzte Adresse.

Wichtige Einschränkungen:

- Dies geschieht **nur, solange das Seitenpanel geöffnet** ist. Bei
  geschlossenem Panel sendet die Erweiterung nichts über die von Ihnen
  besuchten Seiten.
- **Sensible Websites werden vollständig übersprungen** – die Erweiterung
  sendet nichts für Anmelde-/Kontoseiten, Banking- und Finanzwebsites,
  Webmail, Gesundheitsportale, lokale/private Adressen oder nicht-standardmäßige
  Ports.
- Dies dient dazu, den öffentlichen Web-Index nachzuschlagen und aktuell zu
  halten, **nicht** dazu, ein Profil von Ihnen zu erstellen oder Werbung
  gezielt auszuspielen.

Der gemeinsam genutzte Index selbst wird von Divinci erstellt, indem
**öffentlich zugängliche** Webseiten auf eigenen Servern gecrawlt werden;
diese Erweiterung lädt keine Seiteninhalte hoch, um ihn aufzubauen.

## 4. Seitenbewusste Antworten & Chat im Kontomodus (optional)

- **Seitenbewusste Antworten (Grounding).** Wenn eine Seite im Index erfasst
  ist und Sie eine Nachricht im Seitenpanel senden, sendet die Erweiterung
  **Ihre Nachricht und die gekürzte Seitenadresse** an Divinci, um relevanten
  Kontext abzurufen, der dann dem lokalen Modell zur Verfügung gestellt wird.
  In diesem Fall verlässt Ihre Chat-Nachricht also Ihr Gerät. Sie können dies
  deaktivieren – siehe §5.
- **Chat im Kontomodus.** Wenn Sie *„Mein Divinci-Konto verwenden"* für den
  Chat aktivieren, wird Ihre Unterhaltung an die Server von Divinci gesendet
  (um serverseitig gehostete Modelle und Tools auszuführen) und als
  Transkript in Ihrem Konto gespeichert – genau wie beim Chatten auf
  chat.divinci.app. Wenn diese Option deaktiviert bleibt, bleibt der Chat
  vollständig lokal.

## 5. Ihre Datenschutzeinstellungen

Im Popup unter **Erweiterte Einstellungen → Datenschutz**:

- **Divinci-Seitenkontext abrufen** – wenn deaktiviert, sendet die
  Erweiterung Ihre Nachricht niemals für seitenbewusste Antworten (Ihre
  Chat-Anfrage verbleibt auf Ihrem Gerät). Standard: aktiviert.
- **Divinci erlauben, meine Kontochats zu verwenden** – wenn deaktiviert,
  bittet die Erweiterung Divinci, Ihre Chats im Kontomodus nicht zur
  Verbesserung der Dienste zu verwenden. Standard: aktiviert. (Dies sendet ein
  Opt-out-Signal mit Ihren Anfragen; die tatsächliche Umsetzung wird von den
  Servern von Divinci durchgesetzt.)

Sie können außerdem jederzeit **abgemeldet bleiben** (vollständig lokal) oder
sich **abmelden**, um alle Vorgänge aus §2–§4 zu beenden.

## 6. Wohin die Daten gehen

- **huggingface.co** (und das CDN `cas-bridge.xethub.hf.co`) – zum
  Herunterladen der Modelldateien, gemäß der
  [Datenschutzrichtlinie von Hugging Face](https://huggingface.co/privacy).
- **Der Identitätsanbieter von Divinci** (Auth0) – nur während der Anmeldung.
- **Die API von Divinci** (`api.divinci.app`) – für die Funktionen für
  angemeldete Nutzer in §3 und §4.

## 7. Was wir **nicht** tun

- Wir verkaufen oder vermieten Ihre Daten **nicht**.
- Wir zeigen **keine** Werbung und verwenden Ihre Daten **nicht** für Werbung
  oder seitenübergreifendes Tracking.
- Wir senden **nicht** den **Inhalt** der von Ihnen besuchten Seiten (nur die
  gekürzte Adresse und einen Einweg-Hash gemäß §3).
- Wir übertragen **nichts** über Ihr Browsing-Verhalten, solange Sie abgemeldet
  sind oder das Seitenpanel geschlossen ist.

## 8. Berechtigungen

- **offscreen** – zum Ausführen des WebGPU-Modells.
- **storage** – zum lokalen Speichern von Einstellungen und der
  Präferenz für zwischengespeicherte Modelle.
- **identity** – zum Abschluss der OAuth-Anmeldung bei Ihrem Divinci-Konto
  (§2).
- **host permissions** (`api.divinci.app` und der Auth0-Anmeldeursprung) – zum
  Stellen der authentifizierten Anfragen in §2–§4.
- **content script auf allen Websites** – zum Zeichnen des Seitenpanels und,
  nur solange es geöffnet ist und Sie angemeldet sind, zur Ausführung der
  Indexprüfung in §3. Das Skript liest Seitentitel, Adresse und sichtbaren
  Text **lokal**, um den Hash zu berechnen; es überträgt keinen
  Seiteninhalt.
- **externally_connectable** (nur Divinci-AI-Domains) – damit
  chat.divinci.app das lokale Modell über einen `chrome.runtime`-Port nutzen
  kann.

## 9. Open Source

Die Erweiterung ist unter Apache-2.0 lizenziert; der Quellcode ist verfügbar
unter [github.com/Divinci-AI/gemma-gem](https://github.com/Divinci-AI/gemma-gem).

## 10. Änderungen dieser Richtlinie

Wenn wir ändern, wie die Erweiterung Daten verarbeitet, aktualisieren wir
diese Richtlinie und erhöhen die Versionsnummer der Erweiterung (angezeigt auf
der Karte unter `chrome://extensions`).

## 11. Kontakt

Fragen? Schreiben Sie eine E-Mail an [mike@divinci.ai](mailto:mike@divinci.ai).
