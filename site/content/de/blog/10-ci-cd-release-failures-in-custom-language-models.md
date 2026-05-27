+++
title = "10 CI/CD-Release-Fehler bei Custom Language Models — und welche Pipeline-Stufe jeden einzelnen abfängt"
description = "Zehn reale Failure Modes aus dem Ausliefern von Custom LMs in Produktion, jeder einer Stufe der Divinci-Pipeline zugeordnet — Register, Gate, Roll, Observe — die ihn abfängt, bevor Nutzer ihn bemerken."
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
summary = "Wir haben genug Custom-LM-Releases durch Divincis vierstufige Pipeline geschickt, um eine Liste der zehn schädlichsten Failure Modes zu haben, die uns früher immer wieder erwischt haben. Drei davon sind slice-aware Regressionen, die ein Aggregat-Gate ausgeliefert hätte. Zwei weitere sind stille Qualitätseinbrüche, die ein Canary mit Infrastruktur-Metriken durchgewunken hätte. Der Rest ist die Art Fehler, die jede Release-Pipeline abfangen sollte — wir nennen sie, weil es sich lohnt, laut auszusprechen, welche eine aggregat-gegatete Pipeline tatsächlich von selbst abfängt."
+++

*Notes from the Release Cycle — Teil II*

---

Der [erste Beitrag dieser Serie](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) hat die vierstufige Release-Pipeline durchgespielt, die wir ausliefern — **Register → Gate → Roll → Observe**. Dieser Beitrag liefert die Belege: zehn konkrete Failure Modes, die wir damit inzwischen abgefangen haben, wie jeder in der Praxis aussah und welche Stufe der Pipeline ihn davon abgehalten hat, in Produktion zu landen.

Die Liste ist nach Stufe sortiert, nicht nach Schweregrad, denn die Stufe sagt dir, *wo du investieren musst*, wenn du selbst so etwas baust. Ist dein Gate das schwache Glied, werden dich sechs der zehn unten genannten Fehler weiterhin treffen. Ist dein Observer das schwache Glied, treffen dich zwei davon lautlos — was heißt: das einzige Signal, das du jemals bekommst, ist eine Kundenbeschwerde, also das schlechtestmögliche Signal.

Eine Pipeline, die alle zehn abfängt, ist keine Feature-Liste. Sie ist eine kleine Zahl konsequent durchgehaltener Architekturentscheidungen. Jeder Fehler unten nennt, welche Entscheidung greift.

## Wie diese Liste zu lesen ist

Jeder Fehler ist mit der Stufe getaggt, die ihn abfängt:

- **① REGISTER** — die Manifest-Ebene. Stoppt Fehler, bei denen man nicht mehr nachvollziehen konnte, welche Änderung die Produktion zerschossen hat, weil der Zustand über Systeme verteilt war.
- **② GATE** — domänenspezifischer Spearman gegen einen kalibrierten, human-anchored Judge. Stoppt Fehler, die sich in Aggregatwerten verstecken.
- **③ ROLL** — Canary bei 5 % → 25 % → 100 % mit einem Qualitätsmonitor an jedem Checkpoint. Stoppt Fehler, die erst unter Last sichtbar werden.
- **④ OBSERVE** — kontinuierliches Trace-Replay durch den Kandidaten, bewertet vom selben Judge wie das Gate. Stoppt stille Qualitätseinbrüche, die Latenz und 5xx nie bemerken.

Jeder Abschnitt endet mit dem **Fix** — der exakten Konfiguration, die wir bei Divinci ausliefern, plus dem, was du selbst bauen musst, wenn du uns nicht nutzt.

---

## Stufe ① — Register

### 1. Modell + Prompt + Routing in einem Bundle ausliefern und nicht wissen, welches davon es kaputtgemacht hat

**Was passiert ist.** Wir haben in einem Release drei Dinge gleichzeitig geändert: das Basismodell von Gemma 4 E2B auf Gemma 4 26B-A4B hochgezogen, den System-Prompt der juristischen Domäne um eine Anweisung „cite the statute" ergänzt und die Routing-Regel angepasst, die entscheidet, welche Traffic-Klasse auf welches Modell trifft. Die Genauigkeit beim Vertragsentwurf brach um 7 Punkte ein. Keine der drei Änderungen war isoliert getestet worden. Das Debugging erforderte, jeweils eine Variable zurückzudrehen — über den Verlauf von zwei Tagen.

**Warum die Pipeline ihn jetzt abfängt.** Ein Divinci-Release ist ein unveränderliches Manifest, das model_ref, prompt_template_ref, routing und dataset_version zu einem einzigen SHA-256-adressierten Artefakt bündelt. Die Pipeline verweigert das Deploy eines Manifests, das mehr als eine Änderung bündelt, *es sei denn*, die SHA des vorherigen Releases ist als Vergleichsbaseline referenziert. Wenn du drei Änderungen gleichzeitig ausliefern willst, musst du das im Manifest anerkennen, und der Pfad zur Fehlerzuordnung bleibt sauber, weil das nächste Release zwingend zurück auf eine Variable pro Release gehen muss.

**Fix.** Lass Menschen Releases nicht von Hand zusammenbauen. Das Release-Manifest sollte von einer Pipeline erzeugt werden, die *gar nicht* still bündeln kann. Siehe [Stufe 1 — Register](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) für die API.

### 2. Einen System-Prompt im Dashboard editieren und ihn ohne Code Review ausliefern

**Was passiert ist.** Jemand hat in einem Admin-UI den System-Prompt angepasst, um „das Modell weniger geschwätzig zu machen". Es sah aus wie eine Ein-Wort-Änderung. Der resultierende Prompt war 38 Zeichen kürzer, was ihn unter einen Längen-Schwellenwert drückte, den der nachgelagerte Prompt-Rewriter benutzte, um zu entscheiden, ob er Safety-Boilerplate anhängt. Zwei Stunden später beantwortete das Modell Fragen, die es hätte ablehnen sollen.

**Warum die Pipeline ihn jetzt abfängt.** Prompts sind Teil des registrierten Manifests. Einen Prompt in einem Dashboard zu editieren heißt, ein neues Manifest zu schneiden, heißt, eine neue SHA zu erzeugen, heißt, das Gate läuft gegen die Änderung. Du kannst weiterhin Prompts im Dashboard editieren. Du kannst sie nur nicht mehr ausliefern, ohne dass das Gate sie sieht.

**Fix.** Behandle Prompts wie Code: versioniere sie mit einem Content-Hash, registriere sie als Teil des Releases, gatte sie auf der Scored-QA-Suite. Tianpans *Semver Lie*-Beitrag<sup><a href="#ref-1">[1]</a></sup> beschreibt genau diesen Failure Mode in freier Wildbahn — eine Prompt-Änderung, die „Code Review bestand, ohne Eval-Gates deployt wurde, ohne Per-User-A/B in Produktion landete und kein automatisches Rollback auslöste".

### 3. Training-Serving-Preprocessing-Skew

**Was passiert ist.** Die Trainingspipeline normalisierte Whitespace und lowercase-te ein bestimmtes Feld. Die Serving-Pipeline tat das nicht. Gleiches Modell, gleicher Prompt, gleiches Routing — andere Inputs auf Byte-Ebene. Auf Dev-Fixtures lief alles durch. Auf echtem Traffic verhielt sich das Modell, als wäre es auf rauschigeren Daten neu trainiert worden, denn aus seiner Sicht war es das.

**Warum die Pipeline ihn jetzt abfängt.** Das Manifest registriert eine `preprocessing_ref` neben model_ref. Die Gate-Evaluierung läuft durch dasselbe Preprocessing, das der Produktions-Serving-Stack benutzt. Driften die beiden auseinander, stimmen die Offline-Zahlen des Gates nicht mehr mit der Produktion überein, und der Per-Slice-Spearman sinkt auf eine Weise, die vor dem Promote messbar ist.

**Fix.** Containerisiere Preprocessing als versioniertes Artefakt. Referenziere es aus dem Manifest. Verweigere das Deploy, wenn das Gate gegen eine andere Preprocessing-Version berechnet wurde als die, die Produktion verwenden wird.

---

## Stufe ② — Gate

Die vier Fehler unten sind die, die ein Aggregat-Score-Gate ausgeliefert hätte. **Der Grund, warum ein Aggregat-Gate sie übersieht, ist strukturell, kein Parameter-Tuning** — Mittelwertbildung über Slices zerstört exakt das Signal, das du brauchen würdest, um eine Regression abzufangen, die auf einen Slice lokalisiert ist.

### 4. Der IP-Lizenzierungs-Kollaps (slice-aware Regression #1)

**Was passiert ist.** Ein QLoRA-Fine-Tune verbesserte die Genauigkeit juristischer Q&A in fünf Teildomänen und ließ IP-Lizenzierung abstürzen — Vertragsentwurf 0,71, Auslegung von Rechtsvorschriften 0,74, Fallzusammenfassung 0,69, regulatorische Compliance 0,66, Jurisdiktionsanalyse 0,62, **IP-Lizenzierung 0,41**. Der Aggregat-Spearman ρ über alle sechs lag bei 0,64. Der Gate-Schwellenwert lag bei 0,65. Nach einem einzigen Aggregatwert war das Release nur einen Wimpernschlag unter der Linie. Nach der Per-Slice-Sicht war eine Teildomäne um 27 Punkte eingebrochen.

**Warum die Pipeline ihn jetzt abfängt.** Der Schwellenwert des Gates ist pro Slice, nicht aggregat. Fällt auch nur ein Slice unter seinen Schwellenwert, wird das Release `gate_fail` markiert, unabhängig davon, wie der Mittelwert aussieht. Das [Gate-Schwellenwert-Diagramm in Beitrag #1](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) ist die tatsächliche Visualisierung, die die Pipeline für Releases wie dieses produziert.

**Fix.** Slice das Gate. Die Slices, die zählen, sind die Teildomänen deiner Kundensegmente, nicht irgendeine Taxonomie aus dem Eval-Framework, das du importiert hast.

### 5. Pädiatrisch-onkologische Slice-Regression (slice-aware Regression #2)

**Was passiert ist.** Ein medizinisches Q&A-Modell wurde auf zusätzlichen Daten aus der Erwachsenenkardiologie feingetunt. Die aggregierte medizinische Genauigkeit verbesserte sich um 4 Punkte. Die Genauigkeit in der pädiatrischen Onkologie sank um 11 Punkte — offenbar hatte das neue Trainingsmaterial pädiatrische Dosisanpassungen subtil zurückgewichtet. Das Aggregat-Gate hätte es promoted.

**Warum die Pipeline ihn jetzt abfängt.** Pädiatrische Onkologie war einer der Slices, die der Kunde bei der Registrierung der Scored-QA-Suite konfiguriert hatte. Die Gate-2-Evaluierung produzierte einen Per-Slice-Spearman ρ, der von 0,72 auf 0,61 fiel, unter den Schwellenwert von 0,68 für pädiatrische Onkologie. Markiert als `gate_fail`. Kein Deploy.

**Fix.** Kundendefinierte Slices, keine plattformdefinierten. Die Plattform sollte den Kunden einen Slice und einen Per-Slice-Schwellenwert ergänzen lassen, ohne Code zu schreiben — denn niemand bei Divinci kennt die Domain-Kanten deines Kunden so gut wie dein Kunde selbst.

### 6. Multilinguale Sub-Sprach-Drift (slice-aware Regression #3)

**Was passiert ist.** Ein multilinguales Modell wurde feingetunt, um französische Antworten zu verbessern. Die aggregierte französische Genauigkeit verbesserte sich um 3 Punkte. Innerhalb von „Französisch" performte das Modell jedoch jetzt schlechter bei belgisch-französischen und schweizerisch-französischen Regionalvarianten — der Trainingskorpus war pariser-französisch-lastig gewesen. Ein aggregiertes Französisch-Gate hätte es ausgeliefert.

**Warum die Pipeline ihn jetzt abfängt.** Locale-Varianten sind Sub-Slices des Sprachen-Slice. Der Per-Sub-Slice-Spearman fing die Regression in der belgischen Variante vor dem Promote ab. Das Release wurde zurückgegeben für entweder (a) breiter aufgestellte Trainingsdaten oder (b) eine Force-Override mit schriftlicher Begründung („wir akzeptieren die regionale Regression, weil die aggregierte Verbesserung im Französischen in diesem Rollout wichtiger ist") — und der Override landet im Audit-Trail.

**Fix.** Slice-Tiefe ist entscheidend. „Französisch" ist zu grob. „Belgisches Französisch" ist die Ebene, auf der Regressionen sich tatsächlich verstecken.

### 7. Das Gate ohne schriftliche Override-Begründung umgehen

**Was passiert ist.** Ein Release-Fenster unter Hochdruck. Das Gate scheiterte an einem Slice — nicht-kritisch, nach Einschätzung des Teams. Jemand griff zum Force-Override-Flag. In einer früheren Version der Pipeline war Force-Override ein einzelner Boolean. Der Flag wurde umgelegt, das Release wurde ausgeliefert, und drei Wochen später konnte niemand mehr rekonstruieren, wer was über welchen Slice entschieden hatte.

**Warum die Pipeline ihn jetzt abfängt.** Force-Override ist ein zweifeldriges Gate: `forceGateOverride: true` UND `overrideReason: "..."`. Der Reason ist ein erforderlicher freier Text-String, der zusammen mit der User-ID und dem überschriebenen Per-Slice-Gate-Ergebnis ins Audit-Log geschrieben wird. Die Pipeline verweigert den Override ohne Reason. Du kannst weiterhin overriden — du kannst nur nicht anonym overriden.

**Fix.** Governance-Gates sind keine separate Stufe. Sie sind eine Eigenschaft der Gate-Stufe: jeder Override ist eine signierte Quittung mit Begründungstext.

---

## Stufe ③ — Roll

### 8. In einem Schritt von 0 % auf 100 % Traffic gehen

**Was passiert ist.** Ein Modell hat das Gate sauber bestanden. Es wurde sofort auf 100 % Traffic ausgerollt. Wegen einer Eigenheit der Konversationslänge lief das neue Modell bei Antworten länger als ~2.400 Tokens in einen Timeout — ein Verhalten, das im 100-Fragen-Evaluierungssatz des Gates nicht auftauchte, weil jeder Test-Prompt kurz war. 15 % der Nutzer bekamen 18 Minuten lang Timeouts, bevor jemand manuell zurückgerollt hat.

**Warum die Pipeline ihn jetzt abfängt.** Die Roll-Stufe hält bei 5 % für `dwell_5pct_seconds` (Default 240) ODER `requests_5pct` (Default 1.000), je nachdem, was *später* eintritt. Bei 5 % Traffic tauchen die Timeouts bei langen Konversationen im 5xx-Rate-Monitor innerhalb von ~3 Minuten auf. Die Pipeline verweigert das Vorrücken über 5 % hinaus, wenn ein Checkpoint-Monitor sein Band reißt. Mittlere Zeit bis zum Halt: 4 Minuten; mittlere Zeit bis zum vollständigen Rollback: rund 12 Sekunden nach dem Halt.

**Fix.** Canary in drei Schritten mit einem *Qualitätsmonitor*, nicht nur Latenz und 5xx. Das „fünf Prozent in zwanzig Sekunden und fertig"-Muster ist das gefährliche. Das „fünf-Prozent-für-vier-Minuten"-Muster ist das sichere.

---

## Stufe ④ — Observe

Die beiden Fehler unten sind die, die ein Canary mit Infrastruktur-Metriken promoted hätte. **Der Grund, warum Infrastruktur-Metriken sie übersehen, ist ebenfalls strukturell** — Latenz und 5xx können tadellos sauber bleiben, während das Modell still hedget, ablehnt oder halluziniert.

### 9. Stilles Hedging bei juristischen Anfragen (stiller Qualitätseinbruch #1)

**Was passiert ist.** Ein safety-getuntes Modell-Update machte den Assistenten der juristischen Domäne merklich konservativer. Gleiche Latenz, gleiche 5xx-Rate, gleicher Token-Verbrauch. Aber wo die Vorversion „die Verjährungsfrist beträgt X Jahre" geantwortet hatte, sagte die neue Version „Sie sollten einen Anwalt konsultieren". Kunden bemerkten es innerhalb von Stunden. Die Dashboards rührten sich nie.

**Warum die Pipeline ihn jetzt abfängt.** Der Observer der Stufe 4 führt kontinuierliches Replay von Produktions-Traces durch das aktive Modell und bewertet sie mit demselben kalibrierten Judge, der Gate-2 angetrieben hat. Hedging zeigt sich sofort, weil der kalibrierte Judge — verankert in menschlichen Ratings dazu, wie eine „gute" juristische Antwort aussieht — Verweigerung-wo-eine-Antwort-erwartet-war bestraft. Der Output-Qualitäts-Monitor fiel für drei aufeinanderfolgende Minuten unter sein Band und die Pipeline rollte automatisch zurück. Gesamtdauer: unter fünf Minuten.

**Fix.** Überwache nicht nur Latenz und 5xx. Überwache einen *Qualitäts*-Score, der aus einem kalibrierten Judge gegen echte Produktions-Traces abgeleitet wird. Die Deployment-Guardrails von SageMaker<sup><a href="#ref-2">[2]</a></sup> machen Auto-Rollback bei CloudWatch-Alarmen — nützlich für Infrastruktur, aber der Alarm muss auf einer Metrik feuern, und „Modell hedget" ist keine Metrik, die CloudWatch sieht.

### 10. Halluzinierte Daten nach einem Fine-Tune (stiller Qualitätseinbruch #2)

**Was passiert ist.** Ein Fine-Tune eines Scheduling-Assistenten fing an, selbstbewusst Daten einzufügen, die im Input gar nicht existierten. „Ihr Meeting ist am Donnerstag, dem 32. März." Latenz unverändert. 5xx-Rate unverändert. Die Halluzinationen kamen am Safety-Filter vorbei, weil nichts „32. März" als schädlich flaggte — nur als unmöglich.

**Warum die Pipeline ihn jetzt abfängt.** Der kalibrierte Judge des Observers — laufend auf echten Produktions-Scheduling-Traces, nicht auf synthetischen — gibt selbstbewusst-aber-falschen Antworten einen schlechteren Score als angemessenem „Ich weiß es nicht"-Ablehnen. Der Einbruch in der Halluzinations-Klasse triggerte den Per-Minute-Observer-Schwellenwert innerhalb von zwei Minuten. Auto-Rollback feuerte.

**Fix.** Ein Judge, der gegen Domain-Expertise kalibriert ist. Generisches LLM-as-Judge wird „Donnerstag, der 32. März" auf die gleiche Weise übersehen wie querlesende Menschen es übersehen würden. Domain-kalibrierte Judges — verankert gegen Bewertungen von Domain-Experten — werden es nicht.

---

## Die 10 Fehler, auf die Pipeline gemappt

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 420" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrix, die die zehn Failure Modes auf die vier Pipeline-Stufen abbildet. Stufe 1 Register fängt die Fehler 1 (mitausgelieferte Änderungen), 2 (unversionierte Prompts) und 3 (Training-Serving-Skew) ab. Stufe 2 Gate fängt die Fehler 4 (IP-Lizenzierungs-Slice-Regression), 5 (pädiatrisch-onkologische Slice-Regression), 6 (multilinguale Sub-Sprach-Drift) und 7 (Umgehen des Gates ohne Override-Begründung) ab. Stufe 3 Roll fängt Fehler 8 (Ein-Schritt-Rollout) ab. Stufe 4 Observe fängt die Fehler 9 (stilles Hedging) und 10 (halluzinierte Daten) ab.">
<title>Failure Modes nach Pipeline-Stufe</title>
<rect width="900" height="420" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Wo jeder Fehler abgefangen wird</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Drei slice-aware Regressionen landen am Gate. Zwei stille Qualitätseinbrüche landen am Observer. Der Rest verteilt sich auf Register und Roll.</text>
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
<text x="50" y="163" font-size="11" font-weight="700" fill="#1e3a2b">1. Mitausgelieferte Änderungen</text>
<text x="50" y="178" font-size="10" fill="#6b5d4f">Modell + Prompt + Routing</text>
<text x="50" y="191" font-size="10" fill="#6b5d4f">still gebündelt</text>
<rect x="40" y="210" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="228" font-size="11" font-weight="700" fill="#1e3a2b">2. Unversionierte Prompts</text>
<text x="50" y="243" font-size="10" fill="#6b5d4f">Dashboard-Edit</text>
<text x="50" y="256" font-size="10" fill="#6b5d4f">umgeht das Gate</text>
<rect x="40" y="275" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="50" y="293" font-size="11" font-weight="700" fill="#1e3a2b">3. Training-Serving-Skew</text>
<text x="50" y="308" font-size="10" fill="#6b5d4f">Preprocessing driftet</text>
<text x="50" y="321" font-size="10" fill="#6b5d4f">zwischen offline + online</text>
</g>
<g>
<rect x="250" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="163" font-size="11" font-weight="700" fill="#a04848">4. IP-Lizenzierungs-Slice</text>
<text x="260" y="178" font-size="10" fill="#6b5d4f">Slice 0,41, Aggregat 0,64</text>
<text x="260" y="191" font-size="10" fill="#6b5d4f">Aggregat würde ausliefern</text>
<rect x="250" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="228" font-size="11" font-weight="700" fill="#a04848">5. Pädiatrische Onkologie</text>
<text x="260" y="243" font-size="10" fill="#6b5d4f">Slice sinkt um 11 Punkte</text>
<text x="260" y="256" font-size="10" fill="#6b5d4f">Aggregat würde ausliefern</text>
<rect x="250" y="275" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="260" y="293" font-size="11" font-weight="700" fill="#a04848">6. Multilinguale Sub-Drift</text>
<text x="260" y="308" font-size="10" fill="#6b5d4f">Belgisches Französisch regrediert</text>
<text x="260" y="321" font-size="10" fill="#6b5d4f">Aggregat würde ausliefern</text>
<rect x="250" y="340" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="260" y="358" font-size="11" font-weight="700" fill="#1e3a2b">7. Override-Bypass</text>
<text x="260" y="373" font-size="10" fill="#6b5d4f">verlangt schriftliche</text>
<text x="260" y="386" font-size="10" fill="#6b5d4f">Begründung + Audit-Eintrag</text>
</g>
<g>
<rect x="460" y="145" width="200" height="55" fill="#ffffff" stroke="#b8a080" stroke-width="1" rx="4"/>
<text x="470" y="163" font-size="11" font-weight="700" fill="#1e3a2b">8. 0 % → 100 %-Rollout</text>
<text x="470" y="178" font-size="10" fill="#6b5d4f">kein Checkpoint-Dwell</text>
<text x="470" y="191" font-size="10" fill="#6b5d4f">Long-Tail-Bugs schlagen unter Last zu</text>
</g>
<g>
<rect x="670" y="145" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="163" font-size="11" font-weight="700" fill="#a04848">9. Stilles Hedging</text>
<text x="680" y="178" font-size="10" fill="#6b5d4f">Latenz + 5xx unverändert</text>
<text x="680" y="191" font-size="10" fill="#6b5d4f">Judge fängt es ab</text>
<rect x="670" y="210" width="200" height="55" fill="#ffffff" stroke="#a04848" stroke-width="1" rx="4"/>
<text x="680" y="228" font-size="11" font-weight="700" fill="#a04848">10. Halluzinierte Daten</text>
<text x="680" y="243" font-size="10" fill="#6b5d4f">„32. März"</text>
<text x="680" y="256" font-size="10" fill="#6b5d4f">Domain-Judge fängt es ab</text>
</g>
</svg>
</figure>

Die rot eingefärbten Balken sind die Fehler, die wir *während* des Aufbaus dieser Pipeline gefunden haben — sie sind der Grund, warum wir am Ende gezielt das slice-aware Gate und den Trace-Replay-Observer gebaut haben, statt wie alle anderen einen generischen Canary mit Infra-Metriken auszuliefern.

## Was unterscheidet LLM-CI/CD von Software-CI/CD?

Die Kurzfassung: ein LLM-Release ist kein deterministisches Artefakt. Derselbe Prompt produziert über Durchläufe hinweg unterschiedliche Outputs. Derselbe Evaluierungssatz produziert über Hardware hinweg unterschiedliche Scores. Dasselbe Modell kann eine aggregierte Qualitätsprüfung bestehen und gleichzeitig still auf einem Slice scheitern, den du nicht in der Eval hattest. Die meisten Annahmen, auf denen klassische CI/CD aufbaut, überleben den Kontakt mit einem probabilistischen System nicht.

Drei konkrete Konsequenzen:

1. **Du kannst keine `expect(output).toEqual(X)`-Assertions schreiben.** Du brauchst eine verteilungsbewusste Evaluierung, die Rangkorrelation gegen einen human-anchored Grader verbraucht, nicht Gleichheit gegen ein Fixture.
2. **Ein „CI passed"-Modell kann kaputtes Verhalten ausliefern.** Bestandene CIs bedeuten, dass der Code läuft. Sie bedeuten nicht, dass das Modell richtig ist. Die Release-Pipeline muss ein *Qualitäts*-Gate oben drauf erzwingen, ergänzend zum *Korrektheits*-Gate, das die CI liefert.
3. **Rollback ist nicht optional und nicht langsam.** Weil Failure Modes probabilistisch sind — und weil einige von ihnen auf Infrastrukturebene stumm sind — muss der Rollback-Pfad primäre Infrastruktur sein, kein Backup-Plan. Das Release-Manifest existiert genau dafür, Rollback atomar zu machen.

Der erste Beitrag dieser Serie beschreibt die vierstufige Architektur, die auf diese Konsequenzen antwortet. Dieser Beitrag beschreibt die Fehler, die sie abfängt.

## Wie baust du eine ausfallresistente CI/CD-Pipeline für Custom LMs?

Die ehrliche Antwort: du akzeptierst, dass Fehler passieren werden, und minimierst die Zeit zwischen *Fehler tritt auf* und *Produktions-Traffic kehrt zu einer bekannt-guten Version zurück*. Die vierstufige Pipeline oben ist eine konkrete Umsetzung dieses Prinzips, aber das Prinzip selbst ist das, worauf es ankommt.

Wenn du nicht Divinci nutzt und etwas Vergleichbares bauen willst, sind die tragenden Teile:

- **Ein unveränderliches Release-Manifest**, das Modell + Prompt + Routing + Datensatz + Preprocessing zu einer einzigen SHA bündelt. Das ist es, was 1, 2 und 3 abfangbar macht. ([Stufe 1](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register))
- **Ein Per-Slice-Gate** mit Schwellenwerten, die von Domain-Verantwortlichen definiert werden, nicht von Plattform-Verantwortlichen. Das ist es, was 4, 5, 6 abfangbar macht. ([Stufe 2](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate))
- **Ein Canary mit Qualitäts-Monitoring an jedem Checkpoint**, nicht nur Latenz und 5xx. Das ist es, was 8 abfangbar macht und 9 und 10 *überlebbar* macht, sobald sie in Produktion eintreffen. ([Stufe 3](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-3-roll))
- **Ein kontinuierlicher Observer**, der echte Produktions-Traces durch das aktive Modell mit demselben kalibrierten Judge bewertet, der das Gate angetrieben hat. Das ist es, was 9 und 10 abfangbar macht. ([Stufe 4](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-4-observe-rollback-and-the-receipt))
- **Eine signierte Audit-Quittung für jede Entscheidung.** Hash-verkettet, extern verankerbar. Für Open-Weights-Modell-Backings bettet die Quittung eine [Vindex-Weight-Attestation](/de/compliance/) ein, die belegt, dass die aktiven Gewichte das sind, was das Manifest registriert hat. Für Closed-API-Backings deckt die Quittung die Entscheidungskette ab, kann aber keine Weight-Provenance behaupten — und der Audit-Trail sagt das explizit.

Die Einzelteile sind nicht für sich genommen neu. Jede MLOps-Plattform hat ein oder zwei davon. Die Kombination — slice-aware Gate + Produktions-Trace-Observer + atomares Rollback + beweisbare Quittung — ist der Teil, den 2026 niemand sonst ausliefert.

## Wo es als Nächstes weitergeht

- Der Begleitbeitrag — **[So bauen Sie eine LLM-CI/CD-Pipeline mit Divinci AI](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)** — behandelt die Architektur und die API.
- Die **[Compliance-Seite](/de/compliance/)** dokumentiert das Vindex-Quittungsformat, das jeder Release-Entscheidung zugrunde liegt, und wie es auf EU AI Act, DSGVO Artikel 17, HIPAA und NIST AI RMF abbildet.
- Die **[AutoRAG-Produktseite](/de/autorag/)** behandelt die RAG-seitige Halluzinationsreduktion, die natürlich zum kalibrierten Judge passt, der Gate-2 und den Stage-4-Observer antreibt.
- Die **[API-Referenz](/de/api/)** — jeder in dieser Serie referenzierte Befehl ist ein realer Endpoint.

## FAQ

### Was ist der häufigste CI/CD-Fehler bei Custom-Language-Modellen?

Über die Releases, die wir ausgeliefert haben, ist der einzelne schädlichste Fehler **eine slice-aware Regression, die ein Aggregat-Gate passiert** — ein Modell, das sich im Schnitt verbessert, während es still auf einer spezifischen Teildomäne kollabiert (Fehler 4, 5 und 6 oben). Sie ist häufiger als fehlendes Rollback, häufiger als Prompt-Drift und schwerer zu erkennen als beides. Der Fix ist strukturell, kein Parameter-Tuning: gate pro Slice, nicht auf dem Mittelwert.

### Wie schnell sollte man ein fehlerhaftes LLM-Release zurückrollen können?

Größenordnung Sekunden, nicht Minuten. Die mittlere Rollback-Zeit in der Divinci-Pipeline liegt bei rund 12 Sekunden — das ist In-Flight-Request-Drain auf einem ~100-Replica-Service, nicht der Manifest-Swap selbst, der sub-sekündig läuft. Die Architekturentscheidung, die das möglich macht, ist das gebündelte Release-Manifest: weil jede Komponente (Gewichte, Prompt, Routing, Datensatz) aus einer einzigen SHA referenziert wird, ist das Rollback ein einzelner atomarer Re-Point. Vergleiche das mit öffentlichen Postmortems: Cloudflares Vorfall im Juni 2022<sup><a href="#ref-3">[3]</a></sup> brauchte 44 Minuten zum Rückgängigmachen, weil Engineers sich gegenseitig auf die Reverts traten; Atlassians April-2022-Ausfall<sup><a href="#ref-4">[4]</a></sup> brauchte 12 Stunden pro betroffener Site, weil der Zustand über mehrere Systeme verteilt war.

### Warum verursachen Prompt-Änderungen so viele Produktionsausfälle?

Weil Prompts routinemäßig außerhalb der CI/CD-Pipeline editiert werden — in Dashboards, in Admin-UIs, manchmal von Leuten ohne Engineering-Review. Sie werden wie Konfiguration behandelt, verhalten sich aber wie Code. Eine 38-Zeichen-Änderung an einem System-Prompt kann nachgelagertes Modellverhalten stärker verändern als ein Modell-Retraining. Der Fix ist, Prompts als Teil des Release-Manifests zu registrieren und sie zu zwingen, dasselbe Gate zu bestehen, das auch das Modell besteht.

### Wie erkennt man stille Qualitätsverschlechterungen in LLM-Outputs?

Nicht mit Infrastruktur-Metriken. Latenz, 5xx-Rate und Token-Verbrauch werden Hedging, Verweigerung-wo-eine-Antwort-erwartet-war oder halluzinierte Daten nicht abfangen. Das Erkennungssignal muss aus einem *Qualitäts*-Score kommen, der von einem kalibrierten Judge gegen echte Produktions-Traces berechnet wird. Der Stage-4-Observer in Divincis Pipeline replayt ein laufendes Sample von Produktions-Traces durch das aktive Modell, bewertet sie mit demselben human-anchored Spearman-Judge, der Gate-2 angetrieben hat, und triggert automatisches Rollback, wenn der Qualitäts-Score für drei aufeinanderfolgende Minuten unter den Schwellenwert fällt.

### Welche Audit-Trail-Anforderungen gelten für KI-Modell-Deployments?

Der EU AI Act, DSGVO Artikel 17 (Recht auf Löschung), HIPAA und das NIST AI Risk Management Framework verlangen alle von Organisationen, Aufzeichnungen über Modellversionen, Evaluierungsergebnisse, Freigabe-Entscheidungen und Rollouts zu führen. Die unausgesprochene Anforderung unter allen vieren ist, dass die Aufzeichnungen *verifizierbar* sein müssen — auditierbar heißt mehr als „wir haben ein Log". Divincis Vindex-Quittungen sind hash-verkettet und extern verankerbar, was heißt, dass ein Auditor die Kette verifizieren kann, ohne unseren Logs zu vertrauen. Für Open-Weights-Modell-Backings bettet die Quittung außerdem eine Weight-Attestation ein; für Closed-API-Backings vermerkt die Quittung explizit, dass keine Weight-Provenance beansprucht wird.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). Benennt den Failure Mode des Dashboard-Prompt-Edits direkt. Begleitend: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a>. Der Standard-Auto-Rollback, getrieben von Infrastruktur-Metriken. Nützlicher Vergleich dafür, was Stage 4 Observe anders macht (Qualitäts-Score, keine CloudWatch-Alarme).
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. 44-minütiger Revert, weil Engineers sich gegenseitig auf die Reverts traten. Zitiert als Anker für „Rollback ist sein eigener Incident".
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. 12 Stunden pro Site bis zur Wiederherstellung. State-über-Systeme-verteilt-Failure-Mode in seiner schlimmsten Form.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. Der Elite-Performer-Schwellenwert für „Wiederherstellungszeit nach fehlgeschlagenem Deployment" ist mit unter einer Stunde dokumentiert. Nützliche Einordnung für „wie schnell ist schnell genug" beim Rollback.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">Zheng et al., <em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (arXiv:2306.05685, 2023). Die Referenz dafür, warum LLM-as-Judge insgesamt menschlichen Ratings entsprechen kann, aber pro Kategorie stark variiert — exakt das Muster, das Per-Slice-Gating notwendig macht.
  </li>
</ol>

---

*Als Nächstes in dieser Serie:* **Validierung und Auslieferung von Custom LMs in regulierten Bereichen.** Die Pipeline oben ist die Architektur. Der Compliance-Pfad ist die Praxis ihrer Anwendung. EU AI Act, DSGVO Artikel 17, HIPAA und NIST AI RMF — was jeder davon von einem Release-Prozess verlangt und welche Vindex-Quittungs-Felder welche Anforderung abdecken.
