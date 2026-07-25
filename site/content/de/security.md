+++
title = "Sicherheit"
description = "Wie Divinci AI Ihre Daten schützt — De-Identifikation, Zugriffskontrolle, Audit-Protokollierung und ehrliche Antworten dazu, wo wir bei formellen Zertifizierungen stehen."
template = "page.html"
+++

# Sicherheit

Sicherheit ist ein Kernbestandteil unserer Entwicklungsarbeit. Diese Seite
beschreibt, was heute tatsächlich auf unsere Architektur und unsere Praktiken
zutrifft — keine Marketing-Checkliste. Wo wir etwas noch nicht abgeschlossen
haben (ein formelles Audit, eine Zertifizierung), sagen wir das klar, statt
etwas anderes anzudeuten.

## Für HIPAA vorbereitete Architektur

![Für HIPAA vorbereitete Architektur](/brand/badges/hipaa-ready.svg)

Die technischen Schutzmaßnahmen, die ein HIPAA-relevanter Arbeitsablauf
benötigt, sind bei uns standardmäßig in die Plattform eingebaut:

- **De-Identifikation vor Speicherung oder KI-Verarbeitung.** Chat-Inhalte
  können durch eine automatische PII/PHI-Schwärzung (Microsoft Presidio, mit
  einem für klinische Texte optimierten Modell für medizinische Kontexte)
  geleitet werden, bevor sie unsere Datenbank, unsere KI-Anbieter oder die
  Suche/Retrieval erreichen — dabei werden alle 18 Identifikator-Kategorien
  der Safe-Harbor-Methode (Verfahren zur Anonymisierung) von HIPAA erkannt.
  Dieser Schritt ist „fail closed" ausgelegt: Wenn die Schwärzung nicht
  ausgeführt werden kann, wird die Nachricht abgewiesen, statt unbemerkt
  ungeschwärzt gespeichert zu werden.
- **Manipulationssichere Audit-Protokollierung.** Zugriffe auf sensible
  Datensätze werden in einem Hash-verketteten Protokoll erfasst, das so
  konzipiert ist, dass Einträge nachträglich nicht unbemerkt verändert werden
  können.
- **Rollenbasierte Zugriffskontrolle und Zugriffskontrolle auf
  Ressourcenebene.** Sowohl plattformweite Rollen als auch Berechtigungen pro
  Ressource regeln, wer was sehen darf.
- **Verschlüsselung bei der Übertragung und im Ruhezustand**, mit
  Feldverschlüsselung für als sensibel gekennzeichnete Daten.

**Was dies nicht ist:** eine HIPAA-Compliance-Zertifizierung. Es gibt kein
staatlich ausgestelltes HIPAA-Zertifikat — Compliance ergibt sich aus dem
Zusammenspiel technischer Schutzmaßnahmen (siehe oben), schriftlicher
administrativer Richtlinien und unterzeichneter Auftragsverarbeitungsverträge
für Geschäftspartner (Business Associate Agreement, BAA) mit jedem Anbieter im
Datenpfad, jeweils einzelfallbezogen für eine konkrete Kundenbeziehung
bewertet. Wenn Sie mit uns geschützte Gesundheitsdaten (Protected Health
Information) im Rahmen eines Business Associate Agreement verarbeiten möchten,
[sprechen Sie mit uns](https://meetings.hubspot.com/michael-mooring/divinci-ai)
— wir klären gemeinsam, was für Ihren konkreten Anwendungsfall nötig ist.

## Datenschutz

### Verschlüsselung

- **Bei der Übertragung**: TLS durchgängig zwischen Clients, unserem Edge und
  unserer Origin-Infrastruktur.
- **Im Ruhezustand**: Verschlüsselung auf Anbieterebene für unseren primären
  Datenspeicher und unseren Objektspeicher, ergänzt um eine eigene
  Feldverschlüsselungsebene für als sensibel gekennzeichnete Felder.
- **Verwaltung von Geheimnissen**: Zugangsdaten und API-Schlüssel werden über
  einen zentralen Secrets-Manager verwaltet, nicht fest im Code hinterlegt
  oder im Klartext in Konfigurationen gespeichert. Die Produktionsumgebung ist
  so konfiguriert, dass sie „fail closed" reagiert, statt bei nicht
  erreichbarem Secrets-Dienst unbemerkt auf veraltete Zugangsdaten
  zurückzufallen.

### Datenminimierung

- De-Identifikation (siehe oben) bedeutet, dass ursprüngliche PII/PHI
  verworfen und nicht aufbewahrt werden, überall dort, wo diese Pipeline
  läuft — der kleinstmögliche Fußabdruck, falls ein nachgelagertes System
  jemals kompromittiert wird.
- Protokolle enthalten laut Richtlinie ausschließlich Metadaten: Wir schreiben
  keine Nachrichteninhalte, E-Mail-Adressen oder sonstigen personenbezogenen
  Daten in Anwendungsprotokolle oder Fehlermeldungen.

### Zugriffskontrollen

- **Authentifizierung** über Auth0.
- **Rollenbasierte Zugriffskontrolle** (auf Plattformebene) plus
  **Berechtigungen pro Ressource** (auf Dokument-/Workspace-Ebene) —
  standardmäßig nach dem Prinzip der geringsten Rechte.
- **Vierteljährliche Überprüfungen von Zugriffen und Konfigurationen** der
  Produktionsdienste.

## Anwendungssicherheit

- **XSS-Abwehr an der Rendering-Grenze**: von Nutzern und von KI erzeugte
  Inhalte werden überall dort bereinigt (DOMPurify), wo sie als HTML
  gerendert werden; das Einschleusen von rohem HTML aus nicht
  vertrauenswürdigen Quellen ist nicht zulässig.
- **Autorisierungstests**: Wir führen eigene KI-gestützte und manuelle
  Sicherheitstests gegen Staging und Produktion durch, einschließlich
  authentifizierter Autorisierungs-/IDOR-Prüfungen — das ist (noch) kein
  wiederkehrendes Programm für Penetrationstests durch Dritte, und wir werden
  ein solches auch nicht behaupten, solange es nicht existiert.
- **Abhängigkeits- und Code-Review**: reguläres Code-Review für alle
  Änderungen; Aktualisierungen von Abhängigkeiten werden über unser normales
  Build-Tooling nachverfolgt.

## Verfügbarkeit & Überwachung

- **Synthetisches Monitoring** kundenseitiger Endpunkte, das den
  Bereitschaftsdienst innerhalb von Minuten nach einem echten Ausfall über
  PagerDuty alarmiert — und nicht erst bei Serverfehlern; die Prüfungen
  verifizieren den Inhalt, nicht nur „kam ein 200 zurück".
- **Multi-Region-Infrastruktur** (Cloudflare Edge + Google Cloud Origin) mit
  automatisierten Backups unseres primären Datenspeichers.
- Wir veröffentlichen derzeit keine vertragliche Verfügbarkeitszusage (Uptime
  SLA). Wenn Ihr Anwendungsfall eine benötigt, fragen Sie uns — wir können
  besprechen, was für Ihre Bereitstellung realistisch ist.

## Reaktion auf Sicherheitsvorfälle

Wir unterhalten einen dokumentierten Prozess zur Reaktion auf
Sicherheitsvorfälle: Erkennung und Klassifizierung, Eindämmung, eine ehrliche
Bewertung, ob ein Vorfall die Schwelle zu einer meldepflichtigen
Datenschutzverletzung erreicht, Behebung sowie eine schuldfreie Nachbetrachtung
(Post-Mortem), die in unsere künftige Überwachung einfließt. Wenn Sie Kunde mit
einem Business Associate Agreement mit uns sind, legt dieser Vertrag unsere
Benachrichtigungspflichten Ihnen gegenüber fest — es gelten diese
Vertragsbedingungen, nicht diese Seite.

Um ein Sicherheitsproblem oder eine vermutete Schwachstelle zu melden, schreiben
Sie an **security@divinci.ai**. Wir betreiben derzeit kein formelles
Bug-Bounty-Programm; wir nehmen Meldungen jedoch ernst und arbeiten nach Treu
und Glauben mit Ihnen zusammen.

## Wo wir bei formellen Zertifizierungen stehen

Wir sagen es direkt, da viele Sicherheitsseiten das nicht tun:

- **HIPAA**: siehe „Für HIPAA vorbereitete Architektur" weiter oben. Ob ein
  Business Associate Agreement zur Anwendung kommt, hängt von Ihrer konkreten
  Beziehung zu uns ab — wir bewerten das pro Kunde und nicht als pauschale
  Aussage.
- **SOC 2**: noch nicht begonnen. Es steht auf unserer Roadmap; wir
  aktualisieren diese Seite, sobald es etwas Belastbares zu berichten gibt —
  nicht früher.
- **ISO 27001, FedRAMP, PCI DSS**: Diese Zertifizierungen besitzen wir nicht.
  Kartenzahlungen werden über Stripe abgewickelt; Divinci speichert
  Karteninhaberdaten nicht selbst.

Uns ist es lieber, hier zu wenig zu behaupten und dafür Vertrauen zu genießen,
als zu viel zu behaupten und es später zurücknehmen zu müssen.

### Kontakt

Sicherheitsfragen, Schwachstellenmeldungen oder Compliance-Fragen zu einem
konkreten Geschäft: **security@divinci.ai**
