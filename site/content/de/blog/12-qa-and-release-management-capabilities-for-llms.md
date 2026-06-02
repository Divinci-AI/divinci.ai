+++
title = "Die 12 QA- und Release-Management-Fähigkeiten, die jede Custom-LLM-Plattform ausliefern sollte"
description = "Capability-Checkliste für LLM-Release-Plattformen: slice-bewusste Gates, kalibrierte Judges, atomares Rollback, Hash-Belege — was läuft, was fehlt."
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
summary = "Wir haben zwölf LLM-Release-Plattformen untersucht, bevor wir unsere eigene gebaut haben. Der Markt teilt sich in drei Lager auf, die sich nicht ganz treffen — Eval-CI-Tools, Serving-Canary-Tools und Observability-Tools — und die fehlende Naht zwischen ihnen ist genau diejenige, die ein Kunden-Release braucht. Dieser Beitrag ist die Fähigkeiten-Checkliste, die aus dieser Untersuchung hervorgegangen ist: 12 konkrete Tests, die Sie auf jede Plattform anwenden können, einschließlich unserer."
+++

*Notizen aus dem Release-Zyklus — Teil III*

---

Vor einem Jahr, bevor wir mit dem Bau unserer eigenen Release-Pipeline begannen, haben wir uns hingesetzt und jede QA- und Release-Fähigkeit aufgelistet, von der wir dachten, dass eine ernsthafte LLM-Plattform sie ausliefern sollte. Wir haben dann zwölf andere Plattformen gegen die Liste evaluiert — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core. Niemand hatte alle zwölf. Die Kombinationen, die *tatsächlich* ausgeliefert wurden, gruppierten sich in drei Lager, die sich gegenseitig nicht ganz berührten.

Dieser Beitrag ist die daraus resultierende Fähigkeitenliste, portabel gemacht. Sie ist danach organisiert, in welcher unserer vier Pipeline-Stufen jede Fähigkeit lebt — **Register → Gate → Roll → Observe** — sodass sie sich sauber mit der [Pipeline-Architektur](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) und den [Failure-Modes](/de/blog/10-ci-cd-release-failures-in-custom-language-models/), über die wir geschrieben haben, kombinieren lässt. Wenn Sie Tools evaluieren, arbeiten Sie die Liste von oben nach unten gegen jeden Kandidaten ab; diejenigen mit den tiefsten Lücken werden Ihnen verraten, zu welchem Lager sie gehören.

## Die drei Lager (damit Sie wissen, womit Sie es zu tun haben)

Vor der Checkliste selbst die Form des Marktes im Jahr 2026:

- **Eval-CI-Lager** — Braintrust, Humanloop, Patronus. Führen automatisierte Evaluatoren beim PR-Merge aus. Blockieren schlechte Merges. Berühren niemals Live-Traffic. Stark bei den Fähigkeiten 4–6; abwesend bei 7–12.
- **Serving-Canary-Lager** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core. Teilen Traffic auf, überwachen Infrastruktur-Metriken, Auto-Rollback bei CloudWatch-artigen Alarmen. Stark bei 1, 7, 9; abwesend auf der Qualitätsseite von 8 und 10–12.
- **Observability-Lager** — Arize Phoenix, Confident AI, Deepchecks. Beobachten Produktion, alarmieren Menschen, eskalieren. Stark bei 10 (Monitoring), aber sie erzwingen nichts — Alarmierung ist kein Auto-Rollback.

Die Lücke zwischen diesen Lagern — zwischen „CI bestanden" und „Live-Canary anhand von Qualität bewertet, nicht nur Latenz" — ist der Teil, den jeder manuell überbrücken muss. Diese Lücke zu schließen ist die tragende Aussage dieses Beitrags.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Venn-Diagramm der drei LLM-Plattform-Lager. Eval-CI-Lager (Braintrust, Humanloop, Patronus) sitzt links und deckt Offline-Evaluation beim PR-Merge ab. Serving-Canary-Lager (SageMaker, KServe, Vertex, BentoCloud, Seldon) sitzt rechts und deckt Traffic-Splitting mit Infrastruktur-Metrik-Rollback ab. Observability-Lager (Arize, Phoenix, Confident, Deepchecks) sitzt unten und deckt Monitoring und Alarmierung ohne Enforcement ab. Die drei Kreise überlappen sich paarweise in schmalen Schnipseln, aber die zentrale Region, in der sich alle drei treffen, ist leer. Diese leere Mitte ist die fehlende Naht, um die es in diesem Beitrag geht — eine Release-Entscheidung, getrieben durch Qualität pro Slice, atomar durchgesetzt auf Live-Traffic.">
<title>Die drei Lager und die fehlende Mitte</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Die drei Lager, die sich nicht ganz treffen</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">Jedes Lager besitzt ein Stück. Die Mitte ist dort, wo jedes Team von Hand überbrückt.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">Eval-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">Offline-Eval-Gates</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">beim PR-Merge</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">Serving-Canary</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">Traffic-Split +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">Infra-Metrik-Rollback</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">Observability</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">Monitor + Alarm (kein Enforcement)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">fehlende</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">Naht</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">Die fehlende Naht: Qualitäts-Gate pro Slice → atomares Rollback, getrieben durch Output-Qualität, nicht durch Infra-Metriken.</p>

## Stufe ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Unveränderliche Manifest-Ebene. Failure-Attribution per SHA.</span>
  </div>
</div>

### Fähigkeit 1. Unveränderliches Release-Manifest mit inhaltsadressierbarer SHA

Was es ist: ein Release ist keine Modellgewichts-Datei. Ein Release ist ein unveränderliches Bündel *aller* Bestandteile — Modell-Artefakt, Prompt-Template, Routing-Regeln, Datensatz-Version, Preprocessing-Version — adressiert durch eine einzige SHA-256. Zwei Personen, die „denselben Release" deployen, müssen dieselbe SHA erzeugen, sonst verweigert die Pipeline.

Warum es wichtig ist: ohne dies ist „welche Änderung hat die Produktion kaputt gemacht?" nicht beantwortbar, wenn der Zustand über drei Systeme verteilt liegt. Atlassians Ausfall im April 2022<sup><a href="#ref-1">[1]</a></sup> dauerte gerade deshalb zwölf Stunden pro Site, weil der Zustand in unabhängig versionierten Systemen lag, die wieder in Übereinstimmung gebracht werden mussten.

Wer es ausliefert: Serving-Canary-Lager teilweise (Modell + Routing); Modell-Registries (MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>) teilweise (nur Modell-Artefakt). Fast niemand bündelt das **Prompt-Template** in die SHA, und das ist genau das Feld, das sich am häufigsten ändert.

### Fähigkeit 2. Atomare Versionskontrolle über alle Release-Komponenten

Was es ist: der Wechsel von Release A zu Release B flippt *alles* in einer einzigen Anweisung um — Gewichte und Prompt und Routing und Datensatz und Preprocessing — nicht als fünf separate Dashboard-Edits.

Warum es wichtig ist: Teilweise Swaps erzeugen Fenster mit undefiniertem Verhalten. Wenn der Prompt aktualisiert wird, die Routing-Regel aber nicht, ist jeder Request, der den neuen Prompt mit der alten Routing-Klasse trifft, in einem Zustand, den niemand geplant hat.

Wer es ausliefert: niemand vollständig. Das Serving-Canary-Lager tauscht das Modell-Image atomar; Prompt und Routing leben typischerweise woanders. Manifest-getriebener Swap ist der Ursprung des Atomic-Rollback-Anspruchs von Divinci<sup><a href="#ref-5">[5]</a></sup>.

### Fähigkeit 3. Parität der Training- und Serving-Umgebung

Was es ist: die Preprocessing-Pipeline, die während der Gate-Evaluation verwendet wird, ist *dieselbe* Preprocessing-Pipeline, die der Produktions-Server verwendet. Wenn sie divergieren, ist jede Offline-Zahl eine Lüge.

Warum es wichtig ist: Training-Serving-Skew ist einer der [zehn Release-Failures](/de/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew), über die wir geschrieben haben. Das Symptom ist „funktioniert in der Eval einwandfrei, verhält sich in der Produktion wie ein anderes Modell." Die Heilung ist, das Preprocessing im Manifest zu registrieren und gegen die Produktions-Preprocessing-Version zu gaten.

Wer es ausliefert: Containerisierungs-Frameworks (BentoML, KServe) bekommen Teilpunkte, indem sie das Preprocessing zum Serving kolokalisieren. Keiner davon bindet das Preprocessing an die Eingabe des Eval-Gates.

## Stufe ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Spearman ρ pro Slice gegenüber menschlich verankertem Grader.</span>
  </div>
</div>

### Fähigkeit 4. Qualitäts-Gate pro Slice / pro Domäne

Was es ist: die Gate-Entscheidung konsumiert *Pro-Slice*-Scores — Vertragsentwurf, gesetzliche Auslegung, IP-Lizenzierung — nicht einen einzigen Aggregatwert. Jeder einzelne Slice, der unter seinen Schwellenwert fällt, markiert das Release als `gate_fail`, unabhängig davon, wie der Durchschnitt aussieht.

Warum es wichtig ist: Aggregatwerte verwaschen lokalisierte Regressionen. Tianpans *Semver-Lie*-Schrift<sup><a href="#ref-3">[3]</a></sup> benennt dies als den dominanten LLM-Release-Failure-Mode des Jahres 2026: ein Modell, das im Durchschnitt besser wird, während es bei einer User-Journey-Klasse still kollabiert.

Wer es ausliefert: **niemand sonst im Jahr 2026**. Eval-CI-Tools — Braintrust, Humanloop, Patronus — bewerten gegen eine einzige globale Rubrik oder eine flache Task-Liste. Sie legen weder einen Pro-Slice-Schwellenwert noch ein Slice-blindes Override offen. Hier scheitern die Lager zum ersten Mal daran, sich zu treffen.

### Fähigkeit 5. Menschlich verankerter kalibrierter Judge (Spearman ρ gegenüber menschlichen Bewertungen)

Was es ist: der Judge ist kein generischer LLM-as-Judge. Er ist ein LLM-Judge, dessen Spearman ρ gegenüber einem Domänen-Experten-Panel gemessen und pro Slice konfiguriert wird. Der Judge wird ausgewählt, weil seine Ränge mit den Rängen des Menschen übereinstimmen, nicht weil er einen starken Ruf hat.

Warum es wichtig ist: MT-Bench<sup><a href="#ref-6">[6]</a></sup> zeigt, dass GPT-4-als-Judge insgesamt zu >80% mit Menschen übereinstimmt, mit Varianz pro Kategorie von Coding (86%) bis hinunter zu Schreiben (36–44%). „Gesamtübereinstimmung" verbirgt die Slices, in denen der Judge unzuverlässig ist. Den Judge pro Slice zu kalibrieren ist der einzige ehrliche Weg, automatisiertes Scoring vertrauenswürdig zu machen.

Wer es ausliefert: Braintrust, Humanloop, Patronus betreiben Judge-Evaluatoren. Keiner von ihnen verlangt, exponiert oder persistiert eine menschlich verankerte Spearman-Kalibrierung pro Slice. Die Divinci-Kalibrierungs-Pipeline ist in [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/) dokumentiert.

### Fähigkeit 6. Override-Pfad mit erforderlicher schriftlicher Begründung

Was es ist: das erzwungene Überschreiben eines Gate-Failures ist erlaubt (Kaltstarts, akzeptierte Regressionen etc.), erfordert aber zwei Felder — `forceGateOverride: true` UND `overrideReason: "..."`. Die Begründung geht zusammen mit der User-ID in den Audit-Trail. Keine anonymen Overrides.

Warum es wichtig ist: Governance-Gates sind kein separates Compliance-Feature; sie sind eine Eigenschaft der Gate-Stufe selbst. Der Audit-Trail muss nicht nur antworten „wurde dieses Override verwendet?", sondern „was war die Begründung zu diesem Zeitpunkt?" — denn das zukünftige Ich muss es lesen können.

Wer es ausliefert: Eval-CI-Tools haben Flags; keiner von ihnen verlangt die Begründung als strukturellen Teil des Overrides.

## Stufe ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary bei 5% → 25% → 100% mit Qualitäts-Monitor an jedem Schritt.</span>
  </div>
</div>

### Fähigkeit 7. Multi-Checkpoint-Canary mit Verweildauer

Was es ist: Traffic bewegt sich von 0% in die Produktion über mindestens drei Checkpoints — typischerweise **5% → 25% → 100%** — und hält bei jedem entweder eine konfigurierte Verweildauer oder eine konfigurierte Request-Zahl, je nachdem, was *später* eintritt. Kein sofortiges 0%→100%.

Warum es wichtig ist: Long-Tail-Bugs werden bei Skalierung sichtbar. Ein Bug, der 0,3% der Konversationen betrifft, ist auf einer 100-Prompt-Eval unsichtbar und bei 5% Produktions-Traffic offensichtlich. Die Verweildauer ist das, was dem Canary Zeit gibt, den Long-Tail zu sehen.

Wer es ausliefert: das Serving-Canary-Lager liefert dies aus. AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> dokumentiert einen Default `TerminationWaitInSeconds` von 600 (zehn Minuten). KServe, BentoCloud, Seldon und Vertex exponieren alle ähnliche Multi-Step-Canary-Konfigurationen. Das ist die gesättigte Fähigkeit.

### Fähigkeit 8. Output-Qualitäts-Monitor an jedem Canary-Checkpoint

Was es ist: an jedem Checkpoint prüft die Pipeline drei Monitore, bevor sie weitergeht — p95-Latenz, 5xx-Rate **und** einen Output-Qualitäts-Score, berechnet vom selben kalibrierten Judge aus Fähigkeit 5. Latenz und 5xx allein reichen nicht aus.

Warum es wichtig ist: hier scheitern die Lager erneut daran, sich zu treffen. SageMaker, KServe, Vertex, BentoCloud, Seldon beobachten alle Latenz und Fehlerrate. Keiner von ihnen liefert einen Output-Qualitäts-Monitor pro Checkpoint aus — weil sie keinen kalibrierten Judge haben, gegen den sie bewerten könnten. Die Eval-CI-Tools haben den Judge, sitzen aber nicht auf dem Traffic.

Wer es ausliefert: niemand schließt die Brücke. Die verweilende Canary-Infrastruktur existiert im Serving-Lager; der kalibrierte Judge existiert im Eval-CI-Lager; wir haben niemanden gesehen, der sie verbindet.

### Fähigkeit 9. Automatischer Halt bei Qualitätsverletzung

Was es ist: ein Canary-Checkpoint, der bei der Output-Qualität fehlschlägt, hält automatisch an. Die Promotion geht nicht weiter. Es ist kein menschliches Pagen erforderlich, um den Rollout zu stoppen.

Warum es wichtig ist: Menschen sind nicht im Loop in dem Zeitrahmen, in dem sich Rollouts bewegen. Wenn ein Kunden-Ticket eintrifft, ist der 25%-Checkpoint vorbei und die 100%-Promotion ist erfolgt.

Wer es ausliefert: das Serving-Canary-Lager hält bei Infrastruktur-Metriken an. Der Qualitäts-Metrik-Halt ist der Teil, der das Vorhandensein von Fähigkeit 8 voraussetzt.

## Stufe ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Kontinuierliches Trace-Replay → atomares Rollback in ~12 s.</span>
  </div>
</div>

### Fähigkeit 10. Kontinuierliches Replay von Produktions-Traces durch den Kandidaten

Was es ist: nachdem der Canary auf 100% promotet wurde, läuft der Observer weiter. Er sampelt aktuelle Produktions-Traces, spielt sie durch den *Kandidaten* (jetzt aktiven) Release ab, bewertet sie mit dem kalibrierten Judge und gibt einen Qualitäts-Score pro Minute aus. Kontinuierlich, nicht periodisch.

Warum es wichtig ist: stille Qualitätseinbrüche — das Modell hedget, halluziniert selbstbewusst ein Datum, verweigert, wo es das nicht sollte — bewegen niemals Latenz oder 5xx. Das einzige Signal, das man dafür bekommt, ist das Kunden-Ticket, was das schlechtmöglichste Signal ist. Ein kontinuierlicher Qualitäts-Monitor fängt sie in einstelligen Minuten ein.

Wer es ausliefert: **niemand.** Das Observability-Lager (Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>) überwacht den Produktions-Output, erzwingt aber nichts. Das Serving-Canary-Lager beobachtet die Infra. Das Eval-CI-Lager sitzt nicht auf dem Traffic. Der geschlossene Kreislauf — Produktions-Traces → kalibrierter Judge → Enforcement — ist die fehlende Naht.

### Fähigkeit 11. Atomares Rollback in Sekunden, nicht Minuten

Was es ist: wenn der Observer auslöst (sagen wir drei aufeinanderfolgende Minuten unter dem Schwellenwert), feuert das Rollback automatisch. Das Rollback verweist Routing erneut auf `previous_release` aus dem Manifest. Da das vorherige Release ein vollständig gebündeltes Manifest war, flippt jede Komponente atomar um. End-to-End einschließlich In-Flight-Drain auf einem ~100-Replica-Service: etwa 12 Sekunden<sup><a href="#ref-5">[5]</a></sup>.

Warum es wichtig ist: Cloudflares Ausfall im Juni 2022<sup><a href="#ref-8">[8]</a></sup> brauchte 44 Minuten, um rückgängig gemacht zu werden. Die Ursache war nicht das Revert selbst — es war, dass Engineers über die Reverts der anderen liefen, weil der Zustand verteilt war. Manifest-getriebenes Rollback ist Single-Instruction; es kann diesen Failure-Mode nicht haben.

Wer es ausliefert: das Serving-Canary-Lager liefert schnelles Infrastruktur-Rollback aus (alarmgetriggert, Blue-Green-Flip). Der architektonische Unterschied ist, ob der *Auslöser* infra-only oder qualitätsbewusst ist (Fähigkeit 10).

### Fähigkeit 12. Hash-verkettete, extern verankerbare Compliance-Quittung

Was es ist: jede Release-Entscheidung — Register, Gate-Pass, Gate-Fail, Gate-Override, Checkpoint-Promote, Auto-Rollback — emittiert eine JSON-mit-SHA-256-Quittung, hash-verkettet mit der vorherigen Quittung für diesen Kunden und der vorherigen Quittung für dieses Release. Die Kette wird extern in einem Zeitplan verankert, den der Kunde konfiguriert.

**Open-Weights-Vorbehalt.** Wenn das Release durch ein Open-Weights-Modell gestützt wird (Gemma, Qwen, Llama, Mistral, GPT-OSS), bettet die Quittung eine [vIndex-Gewichts-Attestierung](/de/compliance/) ein — einen Beweis, dass die aktiven Gewichte zum Entscheidungszeitpunkt die Gewichte sind, die das Manifest registriert hat. Wenn das Release durch ein Closed-API-Modell gestützt wird (OpenAI, Anthropic, Google über undurchsichtige APIs), deckt die Quittung die Entscheidungskette ab, kann aber keine Gewichts-Provenance beanspruchen, weil der Anbieter die Gewichte nicht offenlegt. Die Quittung sagt das explizit. Das ist die Grenze des Verifizierbaren.

Warum es wichtig ist: regulierte Industrien bekommen heute *Logs*. Der EU AI Act und das NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> fragen zunehmend nach *Beweisen*. Eine hash-verkettete Quittung ist der Unterschied zwischen „wir haben ein Log" und „ein Auditor kann die Kette verifizieren, ohne unserem Log zu vertrauen."

Wer es ausliefert: niemand sonst. Das ist der Teil der Differenzierung, der direkt auf Divincis bestehende [Compliance-Seite](/de/compliance/) abgebildet wird — gleiches Quittungs-Format, erweitert auf Release-Entscheidungen.

## Die 12 Fähigkeiten nach Plattform-Lager

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrix der 12 Fähigkeiten nach Plattform-Lager. Divinci hat alle 12. Eval-CI-Lager (Braintrust, Humanloop, Patronus) hat 5 und 6. Serving-Canary-Lager (SageMaker, KServe, BentoCloud, Vertex, Seldon) hat 1 teilweise, 2 teilweise, 7, 9 und 11 bei Infrastruktur-Metriken. Modell-Registry-Lager (W&B Models, MLflow, LangSmith) hat 1 teilweise und 2 teilweise. Observability-Lager (Arize, Phoenix, Confident, Deepchecks) hat 10 in Monitor-only-Form. Niemand sonst hat 4 Pro-Slice-Gate, 5 menschlich verankerten kalibrierten Judge, 8 Output-Qualitäts-Canary-Monitor, 10 Closed-Loop-Trace-Replay mit Enforcement oder 12 hash-verkettete Quittungen.">
<title>Die 12 Fähigkeiten nach Lager</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Welches Lager liefert welche Fähigkeit aus</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = liefert es aus. ◐ = teilweise (infra-only oder registry-only). ✗ = liefert es nicht aus. Sechs Fähigkeiten fehlen in jedem anderen Lager.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">Fähigkeit</text>
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
<text x="40" y="146">1. Unveränderliche Manifest-SHA</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. Atomarer Versions-Swap (alle Komponenten)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. Training-Serving-Umgebungsparität</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. Qualitäts-Gate pro Slice / pro Domäne</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. Menschlich verankerter kalibrierter Judge</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. Override-Pfad mit erforderlicher Begründung</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. Multi-Checkpoint-Canary mit Verweildauer</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. Output-Qualitäts-Monitor an jedem Checkpoint</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. Auto-Halt bei Qualitätsverletzung</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. Closed-Loop-Produktions-Trace-Replay</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. Atomares Rollback in Sekunden</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. Hash-verkettete Compliance-Quittung</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">Fähigkeiten 4, 5, 8, 10, 12 hervorgehoben: das sind die fünf, die in diesem Scan von keinem anderen ausgeliefert werden. Der Rest gruppiert sich in dem einen oder anderen Lager.</text>
</svg>
</figure>

Das Muster ist der Punkt. Fünf Fähigkeiten — **Gate pro Slice, kalibrierter Judge, Qualitäts-Canary-Monitor, Closed-Loop-Replay, hash-verkettete Quittung** — erscheinen als ✗ über jedes andere Lager hinweg. Das ist die Naht. Die anderen sieben verteilen sich über die Lager auf eine Weise, die jedes Lager intern kohärent, aber gegenseitig unvollständig macht.

## Was unterscheidet QA für Custom Language Models von QA für Software?

LLMs sind nicht deterministisch, selbst bei Temperatur null — Batching und Hardware-Unterschiede verursachen Output-Variation. Diese eine Eigenschaft bricht die meisten Annahmen, auf denen traditionelle QA aufgebaut wurde:

- **Sie können keine `expect(output).toEqual(X)`-Assertions schreiben.** Sie brauchen eine verteilungsbewusste Evaluation, die Rangkorrelation gegenüber einem menschlich verankerten Grader konsumiert, nicht Gleichheit gegenüber einer Fixture. Das ist, was Fähigkeit 5 ist.
- **Ein Modell kann eine aggregierte Qualitätsprüfung bestehen, während es bei einem Slice fehlschlägt.** Deshalb existiert Fähigkeit 4 separat. Wenn Ihre Eval nicht slicen kann, kann sie keine slice-bewussten Regressionen einfangen.
- **Qualitätsfehler sind auf der Infrastruktur-Ebene stumm.** Latenz und 5xx bleiben sauber, während das Modell hedget oder halluziniert. Die Fähigkeiten 8 und 10 existieren, weil kein Infrastruktur-seitiger Monitor das sehen kann.
- **Rollback ist nicht optional.** Da Failure-Modes probabilistisch sind und einige still, muss der Rollback-Pfad primäre Infrastruktur sein, kein Backup-Plan. Fähigkeit 11 macht „12 Sekunden" erreichbar; Fähigkeit 2 macht sie korrekt.

Eine QA- und Release-Plattform, die diese vier Tatsachen nicht berücksichtigt, liefert deterministische Software-CI/CD mit einem aufgeklebten LLM-Logo aus. Der Markt tut das oft.

## Wie unterstützen Audit-Trails AI-Compliance in der Praxis?

Die häufigste Compliance-Lücke, die wir sehen — wenn ein Auditor sechs Monate nach dem Deployment ankommt und fragt „welche Version des Modells lief am 15. März und wer hat dieses Release genehmigt?" — ist nicht „wir haben keine Logs." Es ist „wir haben Logs über fünf Systeme verteilt, und die Zeitlinien stimmen nicht überein."

Eine Compliance-Quittung (Fähigkeit 12) löst dies, indem sie das Log selbst zu einem portablen Artefakt macht: hash-verkettet, Single-Source, extern verankerbar. Ein Auditor kann die Kette verifizieren, ohne unserer Infrastruktur zu vertrauen. Das ist der Unterschied zwischen „wir haben Aufzeichnungen" und „die Aufzeichnungen sind beweisbar."

Für Open-Weights-Modell-Backings enthält die Quittung außerdem eine Gewichts-Attestierung — einen kryptographischen Beweis, dass die aktiven Gewichte die Gewichte sind, die das Manifest registriert hat. Das erfüllt die schwereren Forderungen (GDPR Artikel 17 Recht auf Löschung, EU AI Act-Provenance), weil Sie *nicht nur beweisen können, was deployed wurde,* sondern *dass die zugrundeliegenden Gewichte tatsächlich das sind, was sie zu sein behaupten*.

Für Closed-API-Backings — wenn das Modell hinter einer undurchsichtigen API ausgeliefert wird und die Gewichte nicht offengelegt sind — deckt die Quittung die Entscheidungskette ab, kann aber keine Gewichts-Provenance beanspruchen. Wir sagen das explizit in der Quittung, statt einen Beweis zu suggerieren, den wir nicht liefern können. Das ist die Grenze des Verifizierbaren, wenn der Anbieter Gewichte intern hält.

## Was diese Checkliste nicht löst

Drei ehrliche Einschränkungen:

**Fähigkeiten sind keine Checkboxen um ihrer selbst willen.** Eine Plattform, die alle zwölf schlecht ausliefert, ist schlechter als eine, die acht davon gut ausliefert. Die Checkliste ist ein Ausgangspunkt für die Evaluation, kein Scorecard für Vendor-RFPs.

**Der Wettbewerbs-Snapshot stammt aus 2026 und wird sich verschieben.** In sechs Monaten werden einige der ✗-Markierungen oben kippen — Mitbewerber werden Postmortems lesen und Lücken schließen. Wenn Sie diesen Beitrag im Jahr 2027 lesen, prüfen Sie die Markierungen selbst, bevor Sie ihnen glauben.

**Einige Fähigkeiten hängen von anderen ab.** Fähigkeit 8 (Output-Qualitäts-Canary-Monitor) setzt Fähigkeit 5 (kalibrierter Judge) voraus. Fähigkeit 10 (Closed-Loop-Trace-Replay) setzt beide voraus. Eine Plattform, die 8 ohne 5 ausliefert, liefert ein Placebo aus — der Canary-Monitor existiert, ist aber gegen nichts Vertrauenswürdiges geerdet.

## FAQ

### Was ist die wichtigste QA-Fähigkeit für Custom-LLM-Releases?

Ein Qualitäts-Gate pro Slice (Fähigkeit 4) — was bedeutet, dass die Release-Entscheidung Pro-Domäne-Spearman-Scores gegenüber einem menschlich verankerten Grader konsumiert, nicht einen einzigen globalen Aggregatwert. Aggregatwerte verwaschen lokalisierte Regressionen, und lokalisierte Regressionen sind der dominante LLM-Release-Failure-Mode des Jahres 2026<sup><a href="#ref-3">[3]</a></sup>. Wenn Sie nur eine Fähigkeit aus dieser Liste ausliefern können, liefern Sie 4 aus. Liefern Sie dann 5 aus, was 4 vertrauenswürdig macht.

### Wie evaluiert man eine LLM-QA-Plattform, ohne sie sechs Monate lang zu betreiben?

Wenden Sie die 12-Fähigkeiten-Checkliste oben auf die Anbieter-Dokumentation an, mit zwei spezifischen Tests. Bitten Sie den Anbieter erstens, Ihnen den *Pro-Slice*-Gate-Output für einen ihrer Referenzkunden zu zeigen — wenn sie nur Aggregatwerte haben, haben sie Fähigkeit 4 nicht. Fragen Sie zweitens, was ihr Auto-Rollback auslöst — wenn die Antwort „Latenz, Fehlerrate und unsere Alarme" ist, sind sie im Serving-Canary-Lager und Fähigkeit 10 fehlt.

### Was ist der Unterschied zwischen Eval-CI-Tools und Release-Management-Tools?

Eval-CI-Tools (Braintrust, Humanloop, Patronus) führen automatisierte Evaluatoren beim PR-Merge aus und blockieren schlechte Merges. Sie berühren niemals Live-Traffic. Release-Management-Tools (diese Kategorie) besitzen das Release-Manifest, den Canary, den Observer und den Rollback-Pfad. Eval-CI ist *Teil eines* Release-Management-Workflows, aber kein Ersatz dafür. Viele Teams liefern eines der beiden aus und entdecken die Lücke, wenn eine Regression, die CI bestanden hat, still in der Produktion einschlägt.

### Wie schnell sollte Rollback sein?

In der Größenordnung von Sekunden, nicht Minuten. Die mittlere Rollback-Zeit auf der Divinci-Pipeline beträgt etwa 12 Sekunden — das ist In-Flight-Request-Drain auf einem ~100-Replica-Service, nicht der Manifest-Swap selbst, der Sub-Sekunden-bereich liegt. Vergleichen Sie das mit Cloudflares Incident vom Juni 2022<sup><a href="#ref-8">[8]</a></sup>, der 44 Minuten zum Revert brauchte, weil der Zustand über Systeme verteilt war. Die architektonische Entscheidung, die Sekunden-statt-Minuten möglich macht, ist das gebündelte Release-Manifest (Fähigkeiten 1 und 2).

### Warum sind Compliance-Quittungen wichtiger als Compliance-Logs?

Ein Log ist etwas, das Sie geschrieben haben. Eine Quittung ist etwas, das ein Auditor verifizieren kann, ohne Ihnen zu vertrauen. Der EU AI Act und das NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> unterscheiden zunehmend zwischen den beiden — „dokumentiert" ist nicht dasselbe wie „beweisbar", und die regulatorische Richtung geht zu letzterem. Eine hash-verkettete, extern verankerte Quittung ist die einfachste verfügbare Technologie, um diese Linie zu überschreiten.

## Referenzen

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. „The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Zitiert für Fähigkeit 1 — wie über Systeme verteilter Zustand bei Skalierung aussieht.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow Registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> und <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. Die Modell-Artefakt-only-Seite von Fähigkeit 1. Keiner von beiden liefert Prompt-Template-Registrierung aus.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). Benennt den slice-bewussten Regressions-Failure-Mode als das dominante Muster des Jahres 2026. Begleitbeitrag: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Anker für Fähigkeit 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> und <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> von 600 (zehn Minuten), Maximum 1800 (dreißig Minuten). Der Standard-Infrastruktur-Metrik-Canary, mit dem der Beitrag bei den Fähigkeiten 8 und 10 kontrastiert.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Intern — atomarer Routing-Flip via Release-Manifest.</strong> Die ~12-Sekunden-Rollback-Zeit ist In-Flight-Drain auf einem ~100-Replica-Service; der Manifest-Swap selbst ist sub-Sekunde. Die Zahl stammt aus unserem eigenen Service, nicht aus einem Benchmark. Die Architektur, die das möglich macht, ist das gebündelte Manifest aus Fähigkeit 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-Judge Pro-Kategorie-Varianz.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% Gesamtübereinstimmung GPT-4-vs.-Mensch, mit Pro-Kategorie-Varianz von Coding (86%) bis Schreiben (36–44%). Anker für Fähigkeit 5 — warum ein kalibrierter Judge pro Slice sein muss.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Observability-Lager-Vergleich.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Confident AIs 2026-Observability-Tools-Vergleich</a>. Alle liefern Monitoring und Alarmierung aus; keiner erzwingt Rollback. Anker für Fähigkeit 10s „Monitor ohne Enforcement"-Rahmung.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare-Ausfall Juni 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. „06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." 44 Minuten von „wir wissen, was wir zurücknehmen müssen" bis zum Abschluss des Reverts, teilweise weil Engineers über die Reverts der anderen liefen. Anker für Fähigkeit 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, Mapping, Measurement, Management — die vier Kernfunktionen, auf die Fähigkeit 12 abbildet. Plus die Provenance-Anforderungen des EU AI Act unter <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Anker für Fähigkeit 12.
</li>
</ol>

---

*Nächster Beitrag in dieser Serie:* **Validating and Releasing Custom LMs in Regulated Fields.** Die obige Fähigkeiten-Checkliste ist generisch. Der nächste Beitrag ist spezifisch: der EU AI Act, GDPR Artikel 17, HIPAA und das NIST AI RMF — was jeder davon von einem Release-Prozess verlangt, welche Fähigkeiten oben welche Anforderung abdecken und wo die Trennung zwischen Open-Weights und Closed-Weights die Compliance-Story tatsächlich verändert.
