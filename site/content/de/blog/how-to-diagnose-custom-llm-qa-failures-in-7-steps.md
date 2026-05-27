+++
title = "Wie Sie QA-Fehler bei Custom-LLMs in 7 Schritten diagnostizieren"
description = "Die meisten 'QA-Fehler' sind keine Modellfehler — es sind Lücken in der Eval-Abdeckung, eine fehlkalibrierte Judge-Instanz oder Training-Serving-Skew. Eine 7-Schritt-Diagnostik, die die sechs nicht modellbezogenen Ursachen ausschließt, bevor das Modell beschuldigt wird."
date = 2026-05-31T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["QA", "Diagnostics", "Postmortems", "LLM Ops", "Evaluation", "Debugging"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/how-to-diagnose-custom-llm-qa-failures-in-7-steps-veo31.webm"
hero_video_poster = "/images/how-to-diagnose-custom-llm-qa-failures-in-7-steps-hero-poster.webp"
reading_time = 11
summary = "Wenn ein QA-Alarm bei einem Custom-LLM ausgelöst wird, ist der natürliche Reflex, das Modell verantwortlich zu machen. Bei den Rollouts, die wir durchgeführt haben, ist das Modell etwa in einem von sieben Fällen die richtige Antwort. In den anderen sechs Fällen steckt der Fehler in der Eval, in der Judge-Instanz, im Prompt-SHA, in der Preprocessing-Pipeline, in der Datensatzversion oder im Retrieval-Index. Dieser Beitrag ist der Diagnose-Baum, den wir tatsächlich abarbeiten — in dieser Reihenfolge, mit dem exakten API-Aufruf, der jeden Zweig beantwortet."
+++

*Notizen aus dem Release-Zyklus — Teil VI*

---

Eine Scored-QA-Suite begann, das Medizin-Q&A-Modell eines Kunden zu markieren. Die Headline-Zahl — aggregierte Qualität über alle Slices hinweg — fiel über Nacht um 6 Punkte. Das Team verbrachte zwei Tage damit, das Modell zu debuggen. Sie führten Fine-Tunes erneut durch. Sie rollten zurück auf das vorherige Release. Die Zahlen bewegten sich nicht.

Am Morgen des dritten Tages bemerkte jemand, dass die Eval-Suite in derselben Nacht aktualisiert worden war, in der die Regression begann. Drei neue Prompts zur pädiatrischen Dosierung waren dem Test-Set hinzugefügt worden, und das Modell hatte pädiatrische Dosierung im Training nie gesehen. Der „QA-Fehler" war keine Modellregression. Es war ein Slice-Abdeckungs-Ereignis: Die Eval begann, nach etwas zu fragen, das das Modell nie wissen sollte.

Bei unseren Kunden-Rollouts ist dies das dominante Muster. **Ein „QA-Fehler"-Alarm ist das Symptom. Die Ursache ist das Modell etwa in einem von sieben Fällen.** In den anderen sechs Fällen steckt der Fehler irgendwo stromaufwärts: im Eval-Design, in der Judge-Kalibrierung, im Prompt-SHA, in der Preprocessing-Pipeline, in der Datensatzversion oder im Retrieval-Index. Jede dieser Fehlerklassen sieht aus Sicht des Alarms identisch aus — eine Zahl ist gesunken — hat aber einen vollständig anderen Fix.

Dieser Beitrag ist der Diagnose-Baum, den wir der Reihe nach durchgehen, wenn ein Alarm ausgelöst wird. Sechs Schritte, die nicht modellbezogene Ursachen ausschließen, bevor der siebte Schritt das Modell selbst in Betracht zieht. Jeder Schritt hat einen konkreten API-Aufruf oder eine Abfrage, die ihn beantwortet. Wenn Sie die sechs abgearbeitet haben, wissen Sie entweder genau, was zu reparieren ist, oder Sie haben sich das Recht erarbeitet, das Modell anzusehen.

## Der Entscheidungsbaum

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Diagnostischer Entscheidungsbaum für einen QA-Fehleralarm. Schritt 1 fragt, ob die Eval diesen Slice abdeckt (wenn nein, ist der Alarm eine Eval-Abdeckungslücke). Schritt 2 fragt, ob die Judge-Instanz gegen Menschen auf diesem Slice kalibriert ist (wenn nein, ist der Alarm eine Judge-Fehlkalibrierung). Schritt 3 fragt, ob der Prompt-Template-SHA mit der Produktion übereinstimmt (wenn nein, ist der Alarm Prompt-Drift). Schritt 4 fragt, ob das Preprocessing mit der Produktion übereinstimmt (wenn nein, ist der Alarm Training-Serving-Skew). Schritt 5 fragt, ob der Datensatz-SHA mit der Produktion übereinstimmt (wenn nein, ist der Alarm Dataset-Drift). Schritt 6 fragt, ob die Retrieval-Index-Version mit der Produktion übereinstimmt (wenn nein, ist der Alarm RAG-Index-Drift). Erst nachdem alle sechs Schritte eine nicht modellbezogene Ursache ausgeschlossen haben, kommt Schritt 7 zu dem Schluss, dass es sich tatsächlich um eine Slice-spezifische Modellregression handelt.">
<title>Der 7-Schritt-Diagnosebaum</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">Wenn ein QA-Alarm ausgelöst wird, gehen Sie nach unten — nicht hinein</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">Sechs Schritte schließen nicht modellbezogene Ursachen aus. Erst der siebte beschuldigt das Modell.</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  QA-Alarm ausgelöst</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">Deckt die Eval diesen Slice ab?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ wenn NEIN: Eval-Abdeckungslücke. Suite aktualisieren, erneut testen.</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">Ist die Judge-Instanz auf diesem Slice an Menschen kalibriert?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ wenn NEIN: Judge-Fehlkalibrierung. ρ neu kalibrieren. Erneut auswerten.</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">Stimmt der Prompt-Template-SHA mit der Produktion überein?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ wenn NEIN: Prompt-Drift. Manifest neu registrieren.</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">Stimmt die Preprocessing-Pipeline mit der Produktion überein?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ wenn NEIN: Training-Serving-Skew. Preprocess-SHA binden.</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">Stimmt der Datensatz-SHA mit der Produktion überein?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ wenn NEIN: Dataset-Drift. Mit dem richtigen SHA neu registrieren.</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">Stimmt der Retrieval-Index-SHA?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ wenn NEIN: RAG-Index-Drift.</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">Wenn alle 6 bestanden:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">tatsächliche Slice-spezifische Modellregression.</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">Committen. Zurückrollen. Neu trainieren.</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">Empirisch ist das Modell</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">die richtige Antwort etwa</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">bei 1 von 7 Alarmen.</text>
</svg>
</figure>

Der Baum ist sequenziell, weil die Schritte von günstig zu teuer geordnet sind. Schritt 1 ist ein `git diff` der Eval-Suite; Schritt 7 ist ein Fine-Tune-Zyklus. Sie wollen zehn Minuten für jede der sechs günstigen Prüfungen aufwenden, bevor Sie eine Woche für die teure aufwenden.

## Schritt 1 — Hat die Eval diesen Slice abgedeckt?

**Das Symptom.** Die aggregierte Qualität sinkt, aber die Slice-Aufschlüsselung zeigt, dass ein Slice einbricht, während die anderen flach bleiben. Oder — noch verwirrender — *jeder* Slice sinkt leicht, alle um ähnliche Beträge.

**Die Diagnose.** Diffen Sie den SHA des Eval-Suite-Manifests gegen das des vorherigen Releases. Wenn sich die Eval-Suite geändert hat und Sie das Modell nicht geändert haben, liegt die Regression in der Eval, nicht im Modell.

```bash
# Eval-Suite-Manifest-SHA zwischen Releases vergleichen
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# Unterschiedlich? Ihre Eval hat sich geändert. Auditieren Sie, was hinzugefügt wurde.
```

**Der Fix.** Entweder die Änderung der Eval-Suite zurücknehmen (falls sie unbeabsichtigt war) oder die Trainingsabdeckung erweitern, um der neuen Eval zu entsprechen (falls der neue Slice ein echtes Produktionsanliegen ist). Liefern Sie keinen Modellregressions-Fix für ein Eval-Abdeckungsproblem aus — Sie werden das Modell bei dem schlechter machen, was es eigentlich gut konnte.

**Wo sich das in unserer Pipeline versteckt.** [Stage 1 — Register](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) bindet den SHA der Eval-Suite in das Release-Manifest. Die obige Diagnose ist einfach das Diffen zweier Manifeste. Der Grund, warum der Fehler das Medizin-Q&A-Team zwei Tage gekostet hat, ist, dass sie keinen Manifest-Level-Diff hatten — sie verglichen Modell-Checkpoints, keine Release-Manifeste.

## Schritt 2 — Ist die Judge-Instanz auf diesem Slice an Menschen kalibriert?

**Das Symptom.** Ein Slice, der für die Eval-Suite *neu* ist, erzielt schlechte Werte, aber die menschliche Begutachtung der Modellausgaben auf diesem Slice bewertet sie als in Ordnung. Die Judge-Instanz hält das Modell für fehlerhaft; Menschen nicht.

**Die Diagnose.** Berechnen Sie Spearmans ρ zwischen den Bewertungen der LLM-Judge-Instanz und einer kleinen menschlich bewerteten Stichprobe (50 Elemente) auf dem fehlerhaften Slice. Wenn ρ &lt; 0,4 ist, *misst* die Judge-Instanz nicht das, was Menschen auf diesem Slice messen.

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**Der Fix.** Entweder wählen Sie ein anderes Judge-Modell für diesen Slice oder verwenden Sie eine Kette von Judges mit einem Schiedsrichter. MT-Bench<sup><a href="#ref-1">[1]</a></sup> zeigt, dass GPT-4-als-Judge im Durchschnitt zu &gt;80% mit Menschen übereinstimmt, aber mit kategoriespezifischer Varianz von 86% (Coding) bis 36–44% (Schreiben/Geisteswissenschaften). Die Varianz ist die entscheidende Zahl; „im Durchschnitt gut" verbirgt Slices, in denen die Judge-Instanz falsch liegt.

**Wo sich das in unserer Pipeline versteckt.** [Stage 2 — Gate](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) verlangt eine kalibrierte Judge-Instanz pro Slice. Der Beitrag [Calibrating the AI Judge](/de/blog/calibrating-the-ai-judge/) dokumentiert das Verfahren. Wenn der Slice ohne Kalibrierungsschritt zur Eval hinzugefügt wurde, haben Sie ein strukturell unzuverlässiges Gate.

## Schritt 3 — Stimmt der Prompt-Template-SHA mit der Produktion überein?

**Das Symptom.** Die Qualität sinkt, aber model_ref und dataset_ref sind unverändert. Nichts am Training hat sich geändert. Das Modell ist dasselbe Modell. Und doch.

**Die Diagnose.** Vergleichen Sie den SHA von `prompt_template_ref` im fehlerhaften Release-Manifest mit dem des vorherigen Releases. Eine 38-Zeichen-Änderung an einem System-Prompt, die die „Kürze verbessert", kann das nachgelagerte Verhalten stärker verändern als ein vollständiges Neutraining.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# Unterschiedlich? Ziehen Sie den Diff. Schauen Sie ihn sich sorgfältig an.
```

**Der Fix.** Behandeln Sie Prompts wie Code. Der [Beitrag zu 10 Release-Fehlern](/de/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) behandelt den Fehlermodus der Dashboard-Bearbeitung — Tianpans *Semver Lie*-Postmortem<sup><a href="#ref-2">[2]</a></sup> benennt dies als das dominante Fehlermuster von 2026. Wenn Sie nachweisen können, dass sich der Prompt geändert hat, haben Sie Ihren Fehler gefunden.

## Schritt 4 — Stimmt die Preprocessing-Pipeline mit der Produktion überein?

**Das Symptom.** Das Modell besteht die Eval lokal. Dasselbe Modell besteht dieselbe Eval in der Produktion nicht. Gleiche model_ref, gleicher Prompt, gleicher Datensatz.

**Die Diagnose.** Ziehen Sie den `preprocessing_ref`-SHA aus dem Produktions-Manifest und verifizieren Sie, dass die Eval mit demselben gelaufen ist. Der klassische Fall: Training normalisiert Leerzeichen und konvertiert in Kleinbuchstaben; Produktion nicht. Die Eval lief durch das Produktions-Preprocessing; alles wurde geprüft. Bis jemand das Preprocessing nur auf einer Seite aktualisierte.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# Mit dem Preprocessing vergleichen, das Ihr Trainings-/Eval-Harness tatsächlich verwendet hat.
```

**Der Fix.** Containerisieren Sie das Preprocessing als versioniertes Artefakt. Referenzieren Sie es aus dem Manifest. Verweigern Sie das Deployment, wenn der Preprocessing-SHA des Gates vom Produktions-SHA abweicht.

## Schritt 5 — Stimmt der Datensatz-SHA mit der Produktion überein?

**Das Symptom.** Gate-Eval-Ergebnisse aus dem fehlerhaften Release unterscheiden sich von den Gate-Eval-Ergebnissen *desselben* Modells vom Vortag.

**Die Diagnose.** Diffen Sie das Feld `dataset_version` zwischen den beiden Releases. Die Eval-Suite behielt denselben Namen, aber der Datensatzinhalt wurde aktualisiert und neu getaggt. Gleicher Name, anderer SHA, andere Ergebnisse.

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**Der Fix.** Content-hashen Sie Ihre Datensätze. Der Datensatzname ist keine Version; der SHA ist es.

## Schritt 6 — Stimmt der Retrieval-Index-SHA mit der Produktion überein?

**Das Symptom.** Nur für RAG-Workloads. Die Qualität sinkt bei Fragen, die von abgerufenem Kontext abhängen. Direkte-Antwort-Fragen sind unverändert.

**Die Diagnose.** Ziehen Sie den `retrieval_index_ref`-SHA aus dem Manifest. Vergleichen Sie ihn mit dem Retrieval-Index der Gate-Evaluierung. Der RAG-Index wurde über Nacht aktualisiert (ein frischer Ingestion-Lauf); die Gate-Evaluierung hat ein älteres Retrieval gecached; der Produktions-Canary verwendete das neue.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**Der Fix.** Binden Sie den Retrieval-Index-SHA in das Manifest, genau wie wir Preprocessing binden. Die automatisierte Index-Rotationskadenz von [AutoRAG](/de/autorag/) macht diese Prüfung besonders lohnenswert — der Index *wird* sich aktualisieren, ob Sie es autorisiert haben oder nicht, wenn Sie ihn nicht pinnen.

## Schritt 7 — Endlich das Modell selbst

Sechs Schritte sind absolviert. Die Eval deckt den Slice ab. Die Judge-Instanz ist kalibriert. Der Prompt-SHA stimmt überein. Das Preprocessing stimmt überein. Der Datensatz stimmt überein. Der Retrieval-Index stimmt überein.

Jetzt — und erst jetzt — haben Sie sich das Recht erarbeitet, das Modell anzusehen.

Die Diagnose für diesen Schritt ist ein Slice-spezifischer Spearman-Vergleich gegen das vorherige Release, wobei beide Releases gegen denselben *manifestgebundenen* Datensatz, dasselbe Preprocessing und dasselbe Retrieval evaluiert werden. Die Zahl, die Sie produzieren, ist ein sauberes Signal: eine echte Slice-spezifische Regression, ohne stromaufwärtige Störfaktoren.

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

Wenn das Delta eine echte Regression bestätigt: [Auto-Rollback](/de/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) wird ausgelöst (falls Sie es nicht schon manuell aufgerufen haben), und das fehlerhafte Modell wird gegen einen erweiterten Slice-Abdeckungs-Korpus neu trainiert. Wenn das Gate, das dieses Release befördert hat, den Slice von vornherein verpasst hat, ist [das Gate ebenfalls der Fehler](/de/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — Fähigkeit 4 fehlt in Ihrer Release-Pipeline.

## Wie die Verteilung tatsächlich aussieht

Das „1 von 7"-Framing von weiter oben war kein rhetorisches Mittel. Es ist ungefähr die Verteilung, die wir bei Kunden-Rollouts sehen. Von jeweils sieben QA-Alarmen:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Tortendiagramm der Ursachenverteilung für QA-Alarme. Eval-Abdeckungslücke macht etwa 32 Prozent aus. Judge-Fehlkalibrierung etwa 18 Prozent. Prompt-Drift etwa 16 Prozent. Preprocessing-Skew etwa 12 Prozent. Dataset-Drift etwa 7 Prozent. RAG-Index-Drift etwa 5 Prozent. Tatsächliche Modellregression etwa 10 Prozent. Interne Beobachtung über Kunden-Rollouts hinweg; nicht aus einem kontrollierten Benchmark.">
<title>Verteilung der Ursachen von QA-Alarmen</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Wo der Fehler tatsächlich lag — über Kunden-Rollouts hinweg</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Interne Beobachtung, kein kontrollierter Benchmark. Das Modell ist etwa einmal pro sieben Alarmen die richtige Antwort.</text>
<g transform="translate(220, 230)">
<path d="M 0 -120 A 120 120 0 0 1 113.7 -38.3 L 0 0 Z" fill="#2d5a4f"/>
<path d="M 113.7 -38.3 A 120 120 0 0 1 88.3 81.4 L 0 0 Z" fill="#7a9580"/>
<path d="M 88.3 81.4 A 120 120 0 0 1 -29.7 116.3 L 0 0 Z" fill="#b8a080"/>
<path d="M -29.7 116.3 A 120 120 0 0 1 -113.7 -38.3 L 0 0 Z" fill="#c87b3c"/>
<path d="M -113.7 -38.3 A 120 120 0 0 1 -101.1 -64.7 L 0 0 Z" fill="#d4c8b0"/>
<path d="M -101.1 -64.7 A 120 120 0 0 1 -75.6 -93.2 L 0 0 Z" fill="#a04848"/>
<path d="M -75.6 -93.2 A 120 120 0 0 1 0 -120 L 0 0 Z" fill="#1e3a2b"/>
</g>
<g font-size="11" fill="#1e3a2b">
<rect x="500" y="100" width="14" height="14" fill="#2d5a4f"/>
<text x="522" y="112" font-weight="600">1.  Eval-Abdeckungslücke</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  Judge-Fehlkalibrierung</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  Prompt-Drift</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  Preprocessing-Skew</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  Tatsächliche Modellregression</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  Dataset-Drift</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  RAG-Index-Drift</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">Schritte 1+2 allein machen die Hälfte der Alarme aus. Gehen Sie die Eval durch, bevor Sie das Modell durchgehen.</text>
</svg>
</figure>

Die zwei größten Slices sind *Eval-Abdeckungslücke* und *Judge-Fehlkalibrierung*. Zusammen machen sie die Hälfte der QA-Alarme aus. Keines davon ist ein Modellproblem. Beide sind Probleme damit, wie Sie das Modell messen.

## Was dies nicht löst

Drei ehrliche Einschränkungen:

**Die Verteilung ist unsere, nicht Ihre.** Die obigen Prozentsätze stammen aus unserer Kunden-Kohorte und dem Tooling unserer Pipeline. Wenn Sie eine andere Art von Workload betreiben — stark multimodal, stark Agent-orchestriert, stark Single-Shot-generativ — wird Ihre Verteilung anders aussehen. Die Diagnose-Reihenfolge sollte trotzdem gelten; die Zahlen hinter jedem Schritt werden es nicht.

**Die „Eval-Abdeckungslücke" aus Schritt 1 ist am schwersten zu beheben.** Den fehlenden Slice zu Ihrem Trainingskorpus hinzuzufügen, eine kalibrierte Judge-Instanz dafür zu bauen und den Canary erneut laufen zu lassen, ist selbst ein mehrwöchiges Projekt. Die Diagnose ist schnell; die Behebung nicht.

**Eine echte Regression kann auf einem nicht modellbezogenen Fehler reiten.** Die Fälle, in denen Sie *sowohl* einen Prompt-Drift ALS AUCH eine echte Modellregression haben, sind die schlimmsten, weil Schritt 3 den Prompt-Drift findet, Sie ihn beheben und der Alarm erneut feuert. Die Diagnose-Reihenfolge in diesem Beitrag bewältigt sie, fügt aber verstrichene Zeit hinzu. Es gibt keine Abkürzung für „der Fehler war an zwei Stellen gleichzeitig".

## FAQ

### Warum produziert mein LLM unterschiedliche Ausgaben für ähnliche Prompts?

Prompt-Sensitivität ist real, aber sie ist nicht immer die *Ursache* eines QA-Alarms — manchmal ist sie ein *Symptom* eines stromaufwärtigen Fehlers. Gehen Sie die Diagnose durch. Wenn der Prompt-Template-SHA übereinstimmt, das Preprocessing übereinstimmt und der Datensatz übereinstimmt, dann ja — das Modell hat eine große Varianz auf diesem Slice, und Sie brauchen einen deterministischeren Decoding-Pfad oder eine andere Judge-Instanz. Wenn sich irgendetwas Stromaufwärtiges geändert hat, beheben Sie das zuerst.

### Wie oft sollten Sie Ihre LLM-Benchmarks neu auswerten?

Werten Sie den *Inhalt* des Benchmarks jedes Mal neu aus, wenn sich die Traffic-Form eines Produktions-Slices signifikant ändert. Werten Sie die *Judge-Kalibrierung* des Benchmarks mindestens vierteljährlich neu aus — Judge-Modelle driften schneller, als Sie denken würden. Die größte Quelle für falsche QA-Alarme ist ein Benchmark, der vor 18 Monaten zuletzt validiert wurde und jetzt eine Sache misst, die Ihre Produktion nicht mehr macht.

### Was verursacht Halluzinationen in Custom-Language-Modellen?

Halluzinationen haben mehrere stromaufwärtige Ursachen — Retrieval-Fehler (Schritt 6 im obigen Baum), Trainingsabdeckungslücken (Schritt 1, indirekt) und Decoding-Pfad-Probleme (ein echtes Modellanliegen in Schritt 7). [AutoRAG](/de/autorag/) adressiert die retrieval-seitigen Ursachen, indem es den Retrieval-Index in das Release-Manifest bindet und ihn bei jedem Release neu pinnt. Die anderen beiden erfordern Pipeline-seitige Fixes stromaufwärts des Modells.

### Woher wissen Sie, ob Ihre Trainingsdaten das Problem sind?

Wenn der Datensatz-SHA im fehlerhaften Release mit dem Datensatz-SHA im vorherigen guten Release übereinstimmt (Schritt 5 des Baums), sind die Daten nicht die *unmittelbare* Ursache. Wenn sie sich unterscheiden, haben Sie sie gefunden. Die schwierigere Frage — „ist der Datensatz *vollständig* für unsere Produktions-Slice-Abdeckung?" — ist das, was Schritt 1 testet. Ein Datensatz, der für die Eval vollständig, aber für den Produktions-Traffic unvollständig ist, ist ein Slice-Abdeckungsproblem.

### Können Sie QA-Fehler beheben, ohne das gesamte Modell neu zu trainieren?

Ja — in sechs von sieben Fällen ist der Fix kein Neutraining. Die Schritte 1–6 im Baum haben Fixes, die das Modell nicht anfassen: Eval aktualisieren, Judge-Instanz neu kalibrieren, Prompt-SHA neu registrieren, Preprocessing reparieren, Datensatz neu pinnen oder Retrieval-Index neu pinnen. Neutraining ist Schritt 7, der teuerste Fix, vorbehalten für tatsächliche Modellregressionen. Die [Audit-Spur](/de/compliance/) der Release-Pipeline ermöglicht es Ihnen, diese stromaufwärtigen Fixes mit derselben Provenienz-Disziplin durchzuführen, die Sie für eine Modelländerung verwenden würden.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement with per-category variance from coding (86%) down to writing (36–44%). Anchor for step 2 — why judge calibration has to be measured per slice rather than assumed from a published headline number.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). The dominant 2026 failure-mode writeup. Names dashboard-edit prompt drift as the most-cited cause of production LLM incidents. Anchor for step 3.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI RMF — Measure function.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI Risk Management Framework</a>. The "Measure" function explicitly covers benchmark-validity and evaluation-coverage as part of governance, not as a separate engineering concern. Cited as the institutional anchor for treating eval design as the first diagnostic step.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>RAGAS — retrieval-augmented generation evaluation.</strong> Es et al., <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). The reference framework for RAG-side evaluation. Anchor for step 6 — separating retrieval failures from generation failures requires a RAG-aware eval discipline.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — root-cause distribution across customer rollouts.</strong> The percentages in the pie chart are our internal observation across Divinci customer rollouts, not from a controlled benchmark. Your distribution will vary by workload type, fine-tune cadence, and team discipline. The relative ordering (steps 1–2 dominating) is stable across the cohort we've measured; the exact percentages are not portable to your environment without your own data.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The four-stage release pipeline.</strong> <a href="/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Each diagnostic step in this post corresponds to a manifest field bound at Stage 1 — Register. Without the manifest discipline upstream, the diagnostic loses its grip; you can't diff what you didn't bind.
</li>
</ol>

---

*Nächster Beitrag in dieser Reihe:* **Automated Regression Testing for Custom LLMs in 2026.** Dieser Beitrag handelt von der Diagnose, nachdem ein QA-Alarm ausgelöst wurde. Der nächste handelt von der Regressionstest-Disziplin, die den Alarm überhaupt erst ausgelöst hat — was in die Eval gehört, wie man sie ehrlich hält und was zu tun ist, wenn der Regressionstest beginnt, Ihrer Judge-Instanz zu widersprechen.
