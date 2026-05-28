+++
title = "So bauen Sie eine LLM-CI/CD-Pipeline mit Divinci AI"
description = "Vierstufige LLM-Release-Pipeline: slice-aware Spearman-Gates, Canary auf Output-Qualität, atomares Rollback in 12s, Compliance-Beleg pro Entscheidung."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", "Canary", "Rollback", "Evaluation Gates"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-veo31.webm"
hero_video_poster = "/images/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai-hero-poster.webp"
reading_time = 10
summary = "Eine klassische CI/CD-Pipeline geht davon aus, dass das Artefakt deterministisch ist. Ein Sprachmodell ist es nicht. Dieser Artikel führt durch die Pipeline, die wir bei Divinci AI in Produktion betreiben — slice-aware Spearman-Gates gegen einen human-anchored Judge, Canary, der die Output-Qualität überwacht (nicht nur p95), atomares Rollback in rund zwölf Sekunden und einen hash-verketteten Release-Beleg für jede Entscheidung (mit eingebetteter Vindex-Weight-Attestation, wenn das Modell Open-Weights ist). Drei davon liefert 2026 kein anderes LLM-Release-Tool."
+++

*Notes from the Release Cycle — Teil I*

---

Als wir das erste Mal versucht haben, ein LLM durch eine gewöhnliche CI/CD-Pipeline auszuliefern, lief der Build grün durch, das Deploy war erfolgreich — und der Kundensupport eröffnete innerhalb von sieben Minuten Tickets.

Nichts war „kaputt". Alle 4.200 Integrationstests bestanden. Die Latenz war unverändert. Die 200-OK-Rate hielt sich stabil. Aber bei einer bestimmten Klasse juristischer Fragen begann das neue Modell auf einmal leise zu hedgen — es weigerte sich, sich auf Antworten festzulegen, die die vorherige Version korrekt beantwortet hatte. Kein Test hat das erkannt, weil wir noch keinen geschrieben hatten.

Wir haben zurückgerollt — und das Rollback selbst war ein Ereignis. Das Modellartefakt lag an drei Stellen, das Prompt-Template an einer vierten, die Routing-Regeln an einer fünften, und nichts wusste etwas vom anderen. Es dauerte gut zwei Stunden, bis wir wieder im vorherigen funktionsfähigen Zustand waren. Die Kunden, die in diesem Zeitfenster ein Hedging serviert bekamen, waren wenig begeistert.

Dieser Ausfall ist der Grund, warum es diese Pipeline gibt. Was folgt, ist die tatsächliche Pipeline, durch die wir unsere eigenen Releases schicken — und die wir über die Divinci-API für Kunden bereitstellen, die ihre eigenen ausliefern. Sie hat vier Stufen — **register, gate, roll, observe** — und jeder Schritt hat einen Rollback-Pfad, der nicht davon abhängt, dass ein Mensch wach ist.

## Die vier Stufen

<img src="/images/charts/divinci-cicd-pipeline.svg" alt="Diagramm einer vierstufigen CI/CD-Pipeline für LLMs. Stufe 1 Register: Modellartefakt, Prompt-Template, Routing-Regeln und Datensatzversion werden zu einem einzigen signierten Release-Manifest gebündelt. Stufe 2 Gate: automatische Evaluierung gegen die Scored-QA-Suite, mit einem Spearman-Schwellenwert-Gate pro Kategorie. Stufe 3 Roll: Canary-Traffic-Rampe 5, 25, 100 Prozent mit Health-Checks an jedem Schritt. Stufe 4 Observe: Drift-Monitor, Output-Qualitätsmonitor und Auto-Rollback bei Überschreitung des Schwellenwerts. Jede Stufe erzeugt einen Audit-Log-Eintrag, signiert mit der Release-SHA." width="900" height="380" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

Die Stufen sind bewusst starr. Jedes Release durchläuft jede Stufe in dieser Reihenfolge. Einen „Hotfix"-Pfad, der die Evaluierung überspringt, gibt es nicht — den haben wir einmal probiert.

### Stufe 1 — Register

Ein Release ist **kein** Modellgewichts-File. Ein Release ist ein unveränderliches Manifest, das Folgendes bündelt:

- Das Modellartefakt (HF-Repo + Commit-SHA oder ein Vindex-Patch)
- Das Prompt-Template (jede Variable, jede System-Message)
- Die Routing-Regeln (welche Traffic-Klasse landet auf welcher Version)
- Die Datensatzversion, mit der die Gate-Schwellenwerte berechnet wurden
- Die SHA des vorherigen Releases, damit Rollback eindeutig ist

```bash
curl -X POST https://api.divinci.ai/v1/releases \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{
    "model_ref": "Divinci-AI/gemma-4-e2b@a7c91f",
    "prompt_template_ref": "templates/legal-qa@v14",
    "routing": { "domain": "legal" },
    "dataset_version": "scored-qa-medical-v3",
    "previous_release": "rel_8f72b1"
  }'
# → { "release_id": "rel_a01c66", "manifest_sha256": "9abaeaf6..." }
```

Die Manifest-SHA ist der einzige Handle, den irgendjemand in der Pipeline jemals verwendet. Wenn zwei Personen meinen, dasselbe Release zu deployen, die SHAs sich aber unterscheiden, weist die Pipeline das Deploy ab. Diese Regel hat uns bereits zwei Bugs eingefangen.

### Stufe 2 — Gate

Das Gate ist der Teil, den die meisten CI-Pipelines falsch machen. Lighthouse-artige Heuristiken — Perplexity, BLEU, ROUGE — lassen eine Regression durch, wenn diese sich auf eine Domäne konzentriert. Aggregatwerte verwässern sie.

Divincis Gate führt die Scored-QA-Suite aus, mit der das Release-Manifest registriert wurde, und wendet einen **kategorieweisen** Spearman-Schwellenwert an:

<img src="/images/charts/divinci-cicd-gate-thresholds.svg" alt="Balkendiagramm der Spearman-Rangkorrelation pro Kategorie zwischen Kandidatenmodell und kalibriertem human-anchored Grader, über sechs juristische Teildomänen. Vertragsgestaltung bei 0,71, Auslegung von Rechtsvorschriften bei 0,74, Fallzusammenfassung bei 0,69, regulatorische Compliance bei 0,66, Jurisdiktionsanalyse bei 0,62 und IP-Lizenzierung bei 0,41. Die gestrichelte Gate-Schwellenlinie liegt bei 0,65. IP-Lizenzierung liegt unter der Linie und löst einen Gate-2-Fail aus. Der Aggregatmittelwert über alle sechs Kategorien beträgt 0,64, knapp unter dem Schwellenwert, aber die Ansicht pro Kategorie zeigt exakt, welche Teildomäne regrediert ist." width="900" height="420" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

Das Release in der obigen Grafik würde ein Aggregat-Gate passieren (Mittelwert 0,64 ist „nah genug"). Es scheitert an Divincis Gate, weil IP-Lizenzierung von vormals 0,68 auf 0,41 einbricht — genau die Art lokalisierter Regression, die ein Notebook nie erwischt.

<aside style="background: rgba(184, 160, 128, 0.08); border-left: 3px solid #b8a080; padding: 0.7rem 1rem; margin: 0.8rem 0 1.5rem; font-size: 0.88rem; color: #4a4030;">
  <strong style="color: #1e3a2b;">Zu den Zahlen im Diagramm:</strong> die Werte pro Teildomäne sind <em>illustrativ für die Form</em>, keine Messwerte aus einer veröffentlichten Studie. Keine öffentliche Arbeit berichtet Spearman-ρ Judge-vs-Mensch aufgeschlüsselt nach diesen spezifischen juristischen Praxisbereichen. Für eine ungefähre Einordnung siehe <a href="https://arxiv.org/abs/2308.11462" target="_blank" rel="noopener">LegalBench (Guha et al., 2023)</a> — Genauigkeit pro Task über sechs Arten juristischen Schlussfolgerns — und <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">MT-Bench (Zheng et al., 2023)</a>, das ungefähr 80 % Gesamtübereinstimmung GPT-4-vs-Mensch bei breiter Varianz pro Kategorie ausweist. Kunden, die ihre eigene Scored-QA-Suite betreiben, erzeugen reale Zahlen für ihre eigenen Slices; die Form des Diagramms entspricht dem, was die API ausgeben würde.
</aside>

Wir haben slice-aware Gating nicht aus Spaß erfunden. Es ist der direkt benannte Failure Mode in der aktuellen Welle von LLM-Postmortems. Tianpans Beitrag *„The Semver Lie"*<sup><a href="#ref-6">[6]</a></sup> beschreibt eine Prompt-Änderung, die „Code-Review bestand, ohne Eval-Gates deployt wurde, ohne User-A/B in Produktion landete und kein automatisches Rollback auslöste". Was diesen Vorfall katastrophal statt bloß ärgerlich machte: die Regression war auf einen Slice konzentriert — eine einzelne Klasse von User-Journeys — während das Aggregat hielt. Jedes LLM-Release-Tool, das wir 2026 untersucht haben, gated entweder auf einen einzigen globalen Score oder gar nicht. Keines davon sliced das Gate.

Ein Gate-Fail ist **keine** weiche Warnung. Die `release_id` wird als `gate_fail` markiert, das Manifest archiviert, und kein Deploy-Befehl akzeptiert es. Cold-Start-Releases — ein brandneues Modell ohne historische Spearman-Werte zum Vergleich — durchlaufen einen einmaligen `--force-gate-override`-Pfad, der eine schriftliche Begründung verlangt; die Begründung, die User-ID und eine `gate_override_sha256` wandern direkt in den Audit-Trail. Den Override gibt es, weil es legitime Situationen dafür gibt; den Audit-Trail gibt es, weil dein Ich der Zukunft die Begründung lesen muss.

### Stufe 3 — Roll

Ein Canary bei Divinci bedeutet drei Checkpoints: **5 %, 25 %, 100 %**. An jedem Checkpoint hält die Pipeline entweder für die konfigurierte Dwell Time oder den konfigurierten Request-Count an, je nachdem, was später ist. Default sind 4 Minuten / 1.000 Requests bei 5 %, 15 Minuten / 10.000 Requests bei 25 %.

An jedem Checkpoint müssen drei Monitore halten:

1. **p95-Latenz** innerhalb des 1,2-fachen der p95 des vorherigen Releases
2. **5xx-Rate** innerhalb des 1,5-fachen der Rate des vorherigen Releases
3. **Output-Qualitätsmonitor**: ein kontinuierliches Replay aktueller Produktions-Traces durch das Kandidaten-Release, bewertet vom selben kalibrierten Judge, der Stufe 2 angetrieben hat

Der dritte Punkt ist derjenige, den keine andere Release-Pipeline ausliefert. SageMaker, KServe, BentoML, Vertex AI — sie alle überwachen Latenz und Fehlerrate. Keines davon bewertet die Outputs des Kandidaten gegen die *tatsächlichen* Fragen, die die Produktion gerade jetzt stellt. Der Kandidat erhält dieselben Prompts, die das aktive Release gerade bekommen hat, fährt sie auf einem 5-%-Mirror und wir messen das Spearman-ρ der Kandidatenantworten gegen den kalibrierten Grader. Die 5xx-Rate kann sauber bleiben, während das Modell leise hedged, verweigert oder halluziniert. Wir haben das beobachtet. Der Trace-Replay-Monitor ist das, was es einfängt.

Das Replay-Set ist begrenzt — wir kappen bei 50 aktuellen Traces pro Slice pro Checkpoint, damit die Kosten vorhersehbar sind. Das Grading dauert bei 5 % Traffic etwa 90 Sekunden. Langsamer als ein flacher Prozent-Canary, schneller als auf ein Kundenticket zu warten.

```bash
# Der Roll-Befehl ist Fire-and-Forget. Die Pipeline hält sich selbst.
curl -X POST https://api.divinci.ai/v1/releases/rel_a01c66/roll \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{ "strategy": "canary", "dwell_5pct_seconds": 240, "dwell_25pct_seconds": 900 }'
# → { "rollout_id": "rol_b3e2", "next_checkpoint_at": "2026-05-26T09:04:00Z" }
```

### Stufe 4 — Observe, Rollback und der Beleg

Das ist die Stufe, die der Pipeline ihre Existenzberechtigung gibt.

Der Observer läuft nach Abschluss des Rollouts kontinuierlich weiter. Er berechnet einen Output-Qualitätsscore pro Minute auf einer rollierenden 5-%-Trace-Replay-Stichprobe. Fällt der Score unter den Rollback-Schwellenwert (Default: 0,85 des Gate-Schwellenwerts, also 0,55 wenn das Gate 0,65 war) für drei aufeinanderfolgende Minuten, feuert das Rollback automatisch. Keine Page, kein Mensch, keine Debatte.

Das Rollback selbst ist eine einzige Anweisung: Routing wieder auf `previous_release` aus dem Manifest zeigen lassen. Weil das vorherige Release ein vollständig gebündeltes Manifest war, kippt jede Komponente — Gewichte, Prompt, Routing, Datensatz — atomar um.

Dann feuert der Beleg.

Jede Release-Entscheidung — Register, Gate-Pass, Gate-Fail, Gate-Override, Checkpoint-Promote, Checkpoint-Hold, Auto-Rollback, Manual-Rollback — emittiert einen **Release-Beleg**: ein JSON-mit-SHA-256-Artefakt, hash-verkettet mit dem vorherigen Beleg dieses Kunden und dem vorherigen Beleg dieses Releases, extern verankert auf einem vom Kunden konfigurierten Zeitplan.

Wenn das Release von einem **Open-Weights-Modell** getragen wird — Gemma, Qwen, Llama, Mistral, GPT-OSS, alles, dessen Gewichte adressierbar und editierbar sind — bettet der Beleg eine [Vindex-Attestation](/de/compliance/) ein: einen kryptografischen Beweis, dass die aktiven Gewichte zum Entscheidungszeitpunkt die Gewichte sind, die das Manifest registriert hat. Das ist der Pfad, der die härteren Compliance-Anforderungen erfüllt (GDPR Artikel 17 Recht auf Vergessenwerden, EU AI Act Provenance), weil man nicht nur beweisen kann, *was deployt wurde*, sondern *dass die zugrundeliegenden Gewichte sind, was sie zu sein vorgeben*.

Wenn das Release von einem **Closed-Weights-Modell** getragen wird — OpenAI, Anthropic, Google, alles, was nur über eine intransparente API ausgeliefert wird — deckt der Beleg weiterhin die Entscheidungskette ab (welches Manifest, welches Gate-Ergebnis, welche Monitor-Messung, welcher User welche Aktion ausgelöst hat), kann aber die zugrundeliegenden Gewichte nicht attestieren, weil wir sie nicht sehen können. Das ist keine Limitierung der Pipeline; es ist eine Limitierung dessen, was verifizierbar ist, wenn der Anbieter keine Gewichte offenlegt. Auditoren, denen diese Unterscheidung wichtig ist, bekommen die wahrheitsgemäße Antwort direkt im Beleg.

So oder so: Auditoren bekommen heute Logs. Mit dieser Pipeline bekommen sie *Beweise* für alles, was tatsächlich beweisbar ist. Wir haben am Markt niemand anderen gesehen, der das ausliefert. Wir erwarten, dass sie das tun werden — die Zeitlinien des EU AI Act machen es irgendwann unausweichlich. Wir haben uns entschieden, es jetzt auszuliefern.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Horizontales Balkendiagramm der Rollback-Zeit, logarithmische Minutenskala. Atlassian Ausfall April 2022: 720 Minuten (12 Stunden) Wiederherstellung pro Site. Cloudflare Ausfall 21. Juni 2022: 44 Minuten bis zum Revert. DORA Elite-Performer-Schwelle für Recovery nach fehlgeschlagenem Deployment: unter 60 Minuten. AWS SageMaker Canary-Deployment-Guardrail Termination-Wait-Default: 10 Minuten. Divinci automatisierter Routing-Flip via Release-Manifest: 12 Sekunden. Jedes Balken-Label ist ein Link zur nummerierten Quelle in den Referenzen unten." style="width: 100%; height: auto; display: block;">
  <title>Rollback-Zeit — gemessene Zahlen aus Primärquellen</title>
  <rect width="900" height="380" fill="#faf8f5"/>
  <text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Rollback-Zeit — gemessene Zahlen aus Primärquellen</text>
  <text x="40" y="56" font-size="12" fill="#6b5d4f">Konkrete Vorfälle und plattform-dokumentierte Limits, keine Schätzungen. Jeder Balken verlinkt seine Quelle in den Referenzen unten.</text>
  <g stroke="#d4c8b0" font-size="10" fill="#8a7d68">
    <line x1="280" y1="320" x2="280" y2="80" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="860" y2="320" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="280" y2="325"/><text x="280" y="340" text-anchor="middle">0,1</text>
    <line x1="406" y1="320" x2="406" y2="325"/><text x="406" y="340" text-anchor="middle">1</text>
    <line x1="531" y1="320" x2="531" y2="325"/><text x="531" y="340" text-anchor="middle">10</text>
    <line x1="657" y1="320" x2="657" y2="325"/><text x="657" y="340" text-anchor="middle">100</text>
    <line x1="782" y1="320" x2="782" y2="325"/><text x="782" y="340" text-anchor="middle">1000</text>
    <line x1="406" y1="320" x2="406" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="531" y1="320" x2="531" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="657" y1="320" x2="657" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="782" y1="320" x2="782" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
  </g>
  <text x="570" y="360" font-size="11" fill="#6b5d4f" text-anchor="middle">Minuten (log-Skala)</text>
  <g>
    <text x="272" y="103" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Atlassian, Apr 2022</text>
    <text x="272" y="117" text-anchor="end" font-size="10" fill="#6b5d4f">Wiederherstellung pro Site</text>
    <rect x="280" y="91" width="484" height="32" fill="#a04848" rx="2"/>
    <text x="774" y="113" font-size="11" font-weight="600" fill="#1e3a2b">720 Min<a href="#ref-1"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[1]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="158" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Cloudflare, Jun 2022</text>
    <text x="272" y="172" text-anchor="end" font-size="10" fill="#6b5d4f">Config-Revert</text>
    <rect x="280" y="146" width="332" height="32" fill="#c87b3c" rx="2"/>
    <text x="622" y="168" font-size="11" font-weight="600" fill="#1e3a2b">44 Min<a href="#ref-2"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[2]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="213" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">DORA Elite</text>
    <text x="272" y="227" text-anchor="end" font-size="10" fill="#6b5d4f">Performer-Schwelle</text>
    <rect x="280" y="201" width="349" height="32" fill="#b8a080" rx="2" opacity="0.6"/>
    <text x="639" y="223" font-size="11" font-weight="600" fill="#1e3a2b">&lt; 60 Min<a href="#ref-3"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[3]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="268" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">AWS SageMaker</text>
    <text x="272" y="282" text-anchor="end" font-size="10" fill="#6b5d4f">Termination-Wait-Default</text>
    <rect x="280" y="256" width="251" height="32" fill="#7a9580" rx="2"/>
    <text x="541" y="278" font-size="11" font-weight="600" fill="#1e3a2b">10 Min<a href="#ref-4"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[4]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="320" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="700">Divinci automatisiert</text>
    <text x="272" y="334" text-anchor="end" font-size="10" fill="#2d5a4f">Routing-Flip via Manifest</text>
    <line x1="280" y1="328" x2="318" y2="328" stroke="#2d5a4f" stroke-width="14" stroke-linecap="butt"/>
    <text x="328" y="332" font-size="11" font-weight="700" fill="#2d5a4f">12 s<a href="#ref-5"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[5]</tspan></a></text>
  </g>
</svg>
</figure>

Das sind nicht unsere Zahlen — es sind veröffentlichte Primärquellenzahlen aus echten Postmortems, Plattform-Dokumentationen und dem DORA-Framework. Der Kontrast ist es, der Divincis Design motiviert. Atlassians April-2022-Ausfall<sup><a href="#ref-1">[1]</a></sup> dauerte zwölf Stunden pro Site, weil der Zustand über mehrere Systeme verstreut war, die wieder in Übereinstimmung koordiniert werden mussten. Cloudflares Juni-2022-Ausfall<sup><a href="#ref-2">[2]</a></sup> brauchte vierundvierzig Minuten zum Zurückrollen, weil — in ihren eigenen Worten — Engineers sich gegenseitig die Reverts überschrieben. AWS SageMakers Canary-Deployment-Guardrails<sup><a href="#ref-4">[4]</a></sup> dokumentieren einen Default von zehn Minuten Termination-Wait, bevor das Rollback vollständig abgeschlossen ist. Die DORA-<sup><a href="#ref-3">[3]</a></sup>Elite-Schwelle für Recovery nach fehlgeschlagenem Deployment liegt bei „unter einer Stunde" — das ist die Latte, die eine High-Performing-Org reißen soll, nicht die Obergrenze.

Zwölf Sekunden sind auch keine Zauberzahl. Es ist die Zeit, die der Routing-Layer braucht, um in-flight Requests zu drainen, das aktive Manifest umzuschalten und den neuen Zustand regionsweit zu acknowledgen. Der langsame Teil ist der In-flight-Drain. Es gibt keinen schnelleren Weg, der nicht Responses mitten in der Generation droppt.

## Was das ist — und was andere LLM-Release-Tools nicht sind

Wir haben 2026 zwölf andere Tools untersucht, bevor wir das hier gebaut haben — LangSmith Deployment, W&B Models, MLflow, SageMaker Deployment Guardrails, Vertex AI Endpoints, Seldon Core, BentoCloud, KServe, Humanloop, Braintrust, Patronus AI, Arize Phoenix. Sie clustern sich in zwei Lager, die sich nicht ganz treffen.

Das **Eval-CI-Lager** — Braintrust, Humanloop, Patronus — gated PR-Merges auf Basis offline-berechneter Eval-Scores. Sie fassen den laufenden Service nie an. Wenn das Modell in Produktion ist und die Qualität fällt, schlagen sie Alarm; jemand anderes muss zurückrollen.

Das **Serving-Canary-Lager** — SageMaker Deployment Guardrails, KServe, Vertex AI, BentoCloud, Seldon Core — splittet Traffic und rollt automatisch zurück. Aber jedes davon triggert auf Infrastruktur-Metriken: p99-Latenz, Fehlerrate, CloudWatch-Alarme. Keines davon rollt automatisch bei einer Qualitätsregression zurück. Sie können es nicht, weil sie keinen Judge auf Produktions-Output laufen haben.

Die Nahtstelle zwischen „Eval beim PR-Merge bestanden" und „Live-Canary bewertet auf den User-Journeys, die uns wirklich wichtig sind" ist eine manuelle Übergabe, die jedes Team derzeit selbst überbrücken muss. Der Blogpost benennt das als den dominanten 2026-Failure-Mode<sup><a href="#ref-6">[6]</a></sup>. Wir haben sie geschlossen. Konkret:

1. **Das Gate ist gesliced.** Spearman ρ pro Domäne gegen einen human-anchored Grader, nicht ein einziger globaler Score. Slice-Blindheit ist das, was jedes andere Gate hat.
2. **Der Canary überwacht Output-Qualität, nicht nur p95.** Kontinuierliches Trace-Replay durch den Kandidaten, bewertet vom selben Judge, der das Gate antreibt. Das ist die fehlende Nahtstelle.
3. **Jede Entscheidung emittiert einen Release-Beleg.** Hash-verkettet, extern verankerbar, im JSON-mit-SHA-256-Format, das auch unsere Compliance-Seiten trägt. Bei Open-Weights-Backings — Gemma, Qwen, Llama, Mistral, GPT-OSS — bettet der Beleg eine Vindex-Weight-Attestation ein, damit Auditoren beweisen können, was die Live-Gewichte tatsächlich waren. Bei Closed-API-Backings deckt der Beleg die Entscheidungskette ab, beansprucht aber keine Gewichts-Provenance, weil der Anbieter keine Gewichte offenlegt. So oder so bekommen Auditoren Beweise für das tatsächlich Beweisbare, nicht nur Logs.

Das war's. Generischer Canary, Versionsregister, Infrastruktur-Metrik-Rollback — das ist Commodity. Wir haben keinen generischen Canary geschrieben.

## Was das nicht löst

Drei ehrliche Limitierungen:

**Das Gate ist nur so gut wie der Datensatz.** Eine Scored-QA-Suite, die die tatsächlich genutzte Domäne eines Kunden nicht abdeckt, erwischt Regressionen in dieser Domäne nicht. Wir haben das zweimal erlebt. Beide Male war der erste Schritt des Kunden, eine neue Scored-QA-Suite auszuliefern — nicht das Modell zu wechseln. Das ist der richtige Schritt.

**Das Rollback geht davon aus, dass das vorherige Release gut war.** Wenn eine Regression seit drei Releases live ist und niemand sie bemerkt hat, kauft ein Rollback um ein Release nur ein etwas weniger schlechtes Modell. Der Audit-Trail hilft hier — man kann via SHA auf jedes frühere Manifest zurückrollen, nicht nur auf N-1.

**Cold-Start-Releases umgehen den Canary.** Ein brandneues Modell ohne Produktionsverkehr zum Vergleich kann nicht sinnvoll canary'd werden. Wir erzwingen stattdessen ein 24-stündiges Shadow-Deployment, das Outputs beobachtet, ohne sie auszuliefern. Es ist langsamer und unbequemer. Es ist auch die einzige ehrliche Antwort.

## Die kleinste Variante, die Sie selbst betreiben können

Wenn Sie etwas Vergleichbares ohne Divinci hochziehen wollen, sieht die Minimal-Variante ungefähr so aus:

1. Ein Registry, das Modell + Prompt + Routing + Datensatz als ein einziges unveränderliches Artefakt speichert, adressiert per Content-Hash
2. Ein Judge, kalibriert via Spearman ρ gegen ein human-anchored Panel — und eine Gate-Entscheidung, die *pro Slice* Scores konsultiert, nicht nur das Aggregat
3. Ein Traffic-Splitter, der an Checkpoints hält und einen frische-begrenzten Qualitätsmonitor konsultiert — wobei der Monitor *aktuelle Produktions-Traces* durch den Kandidaten *replay*ed, nicht nur synthetische Stichproben zieht
4. Ein Routing-Layer, dessen Zustand atomar getauscht werden kann — inklusive Prompt-Template, nicht nur Gewichte
5. Ein Audit-Log, das für jede Release-Entscheidung einen hash-verketteten, extern verankerbaren Beleg emittiert — plus ein Weight-Attestation-Embed, wenn das Modell Open-Weights ist, da Closed-API-Releases auf Gewichtsebene physisch nicht attestiert werden können

Die meisten Teams haben (1) und (3) bereits. Die schmerzhaften Teile sind (2), (4) und (5). Der Grund, warum Divinci existiert, ist: wir haben alle fünf erst für uns selbst gebaut und dann gemerkt, dass alle anderen sie auch brauchen werden.

Wenn Sie sich den Build sparen wollen, [die API-Referenz finden Sie hier](/de/api/), und die Release-Endpunkte im Abschnitt „Release Management" sind die gesamte Oberfläche dieser Pipeline. Die Compliance-Seite — wie diese Vindex-Belege aussehen und wie sie auf EU AI Act, GDPR Artikel 17, HIPAA und NIST AI RMF abbilden — finden Sie auf [der Compliance-Seite](/de/compliance/). Jeder Befehl in diesem Post ist ein echter Endpunkt.

## Referenzen

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. Aus dem Bericht: „The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Die vollständige Wiederherstellung von 883 Kunden-Sites dauerte 14 Tage. Über Infrastruktur, Backups und Site-Validierung verteilter Zustand treibt die Pro-Site-Zahl in Stunden statt Minuten.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Wörtlich aus dem Post zitierte Timeline: „06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Vierundvierzig Minuten von „wir wissen, was wir zurückrollen müssen" bis „das Revert ist durch" — unter anderem, weil sich Engineers gegenseitig die Reverts überschrieben.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. Die Elite-Performer-Schwelle für „failed deployment recovery time" ist mit unter einer Stunde dokumentiert. Low Performer messen in den historischen DORA-Reports in Wochen bis Monaten.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a> und die begleitende Seite <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener"><em>Auto-Rollback Configuration and Monitoring</em></a>. Das Beispiel für <code>TerminationWaitInSeconds</code> ist 600 (zehn Minuten); <code>MaximumExecutionTimeoutInSeconds</code> ist auf 1800 (dreißig Minuten) gedeckelt. Rollback feuert während des Baking-Fensters, sobald ein Alarm auslöst: „If any of the alarms trip during the baking period, then SageMaker AI initiates a rollback and all traffic returns to the blue fleet."
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    Divinci AI — atomarer Routing-Flip via Release-Manifest. Zwölf Sekunden sind die In-flight-Drain-Zeit auf einem Service mit rund 100 Replicas; das Manifest-Swap selbst ist Sub-Sekunden. Die Zahl stammt aus unserem eigenen Service, nicht aus einem Benchmark; die Architektur, die das möglich macht, ist das oben beschriebene gebündelte Manifest (Stufe 1 — Register).
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em> (April 2026)</a>. Der Beitrag benennt das Failure-Muster direkt: „passed code review, deployed without eval gates, hit production without per-user A/B, and triggered no automatic rollback." Ein Begleit-Post — <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a> — listet die Slice- / Journey- / Per-User-Felder auf, die aktuelle Postmortems systematisch auslassen.
  </li>
</ol>

Eine Anmerkung dazu, was *nicht* in diesem Diagramm steht. Die Zeit für `kubectl rollout undo` in Kubernetes wird von Ihren `maxSurge`- / `maxUnavailable`-Settings und dem Pod-Warm-up bestimmt, nicht vom Befehl selbst, und wir konnten keine Primärquelle finden, die eine gemessene Zahl in der Art veröffentlicht, wie es die vier obigen Quellen tun — also haben wir sie weggelassen, statt sie mit einer Schätzung zu füllen.

---

*Als Nächstes in dieser Serie:* **10 CI/CD-Release-Ausfälle, die wir in Custom-LMs eingefangen haben — und welche Stufe der Pipeline jeden davon erwischt.** Drei der zehn sind slice-aware Regressionen, die ein Aggregat-Gate ausgeliefert hätte. Zwei weitere sind stille Qualitätsabfälle, die ein Infrastruktur-Metrik-Canary durchgewinkt hätte. Der Rest sind die Sorte Failure Mode, die jede Release-Pipeline eigentlich erwischen sollte — wir listen sie, weil es sich lohnt, laut auszusprechen, welche eine Aggregat-gegatete Pipeline tatsächlich von selbst einfängt.
