+++
title = "Automatisierte Regressionstests für Custom LLMs im Jahr 2026"
description = "Wie man eine Regressionssuite baut, die Drift im Eval erkennt — nicht nur im Modell. Slice-bewusste Gates, kalibrierte Judges, Produktions-Trace-Replay."
date = 2026-05-26T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["Regression Testing", "LLM Ops", "CI/CD", "Evaluation", "Drift Detection", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-regression-testing-for-custom-llms-in-2026-veo31.webm"
hero_video_poster = "/images/automated-regression-testing-for-custom-llms-in-2026-hero-poster.webp"
featured_image = "images/automated-regression-testing-for-custom-llms-in-2026-hero.png"
reading_time = 13
summary = "Die meisten LLM-‚Regressionen‘ sind Drift in der Eval-Suite selbst — Judge-Kalibrierung, Slice-Abdeckung, Prompt-Template, Retrieval-Index. Hier ist die Suite, die genau diese aufspürt: pro Slice bewertet mit einem kalibrierten Judge und gegen Live-Produktions-Traces erneut abgespielt."
+++

*Notizen aus dem Release-Zyklus — Teil 7*

Freitag um 16:47 Uhr hast du eine Prompt-Änderung von einem Zeichen ausgerollt. Der aggregierte Eval-Score wanderte von 0,873 auf 0,871 — deutlich innerhalb des Rauschbodens. Montagmorgen brennt deine Support-Queue wegen einer Anfragenklasse, die du seit sechs Monaten nicht mehr genauer angesehen hast, weil sie stabil war.

Nichts im Modell ist regrediert. Das Modell ist dasselbe Modell. **Das Eval ist unter dir weggedriftet.** Sechs Monate langsames Wachstum in einem Kundensegment haben es nie in den Golden Dataset geschafft, der Judge-Prompt wurde zuletzt im Oktober gegen Menschen kalibriert, und der Retrieval-Index hat sich letzten Mittwoch klammheimlich auf einem aufgefrischten Embedding-Modell neu aufgebaut.

Genau das hat Post 6 herausgestellt — [das Modell ist ungefähr in einer von sieben Warnungen die richtige Antwort](/de/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/). Was heißt: Deine Regressionssuite muss Drift in sich selbst erkennen, nicht nur im Modell. Dieser Post ist diese Suite.

## Was bedeutet Regressionstest für ein Custom LLM eigentlich?

Software-Regressionstests prüfen `output == expected` für fixierte Inputs. Sie funktionieren, weil die Funktion deterministisch ist.

Ein Sprachmodell ist keine Funktion im gleichen Sinne. Derselbe Prompt bei Temperatur > 0 erzeugt eine Verteilung valider Completions, und „valide“ ist mehrdimensional: Hat es die Frage beantwortet, ist die Antwort im abgerufenen Kontext verankert, blieb es innerhalb der Sicherheits-Envelope, kam es innerhalb des Latenz-Budgets zurück. Regressionstest für ein Custom LLM heißt also **die Verhaltensverteilung gegen eine eingefrorene Baseline-Verteilung zu messen** — über Slices, die für dich relevant sind, mit Judges, die gegen Menschen kalibriert wurden, auf Inputs, die wie dein Produktionsverkehr aussehen.

Drei Dinge müssen vorhanden sein, bevor irgendetwas davon Sinn ergibt:

1. Ein **Golden Dataset**, der Produktion auf Slice-Ebene abbildet, nicht im Aggregat.
2. Ein **kalibrierter Judge** — nicht „wir benutzen GPT-5 als Judge“, sondern „wir haben Spearman ρ ≥ 0,7 gegen drei menschliche Rater gemessen, zuletzt letzte Woche aufgefrischt“.
3. Ein **Baseline-Manifest** — die exakten Modellgewichte, das Prompt-Template, der Retrieval-Index und die Judge-Version, die das gemessen haben, was sie gemessen haben. Ohne das kannst du nicht erkennen, ob der Score sich bewegt hat, weil sich das Modell oder das Lineal verändert hat.

Divinci führt alle drei als First-Class-Objekte, hash-verkettet und bei jedem Commit bewertet. Der Rest dieses Posts handelt davon, wie man sie zusammensetzt.

## Warum die meisten LLM-Regressionssuiten echte Regressionen nicht erfassen

Der dominante 2026er Failure-Modus für Custom LLMs ist das, was Tianpans Sigma-Inference-Team in ihrem Postmortem vom April 2026 als *Semver Lie* benannt hat<sup><a href="#ref-1">[1]</a></sup>: Eine aggregierte Metrik bleibt flach oder verbessert sich, während ein oder zwei Produktions-Slices still regredieren. Der Slice lag bei Konzeption des Tests unter 5 % des Verkehrs und schaffte es deshalb nie in den Golden Dataset; sechs Monate später sind es 12 % des Verkehrs, das Modell hat sich darauf verschlechtert, und die aggregierte Zahl konnte das niemals bemerken.

Wir haben uns jedes öffentliche LLM-Release-Postmortem der letzten achtzehn Monate angesehen, und das Muster wiederholt sich: **Die Suite zeigte grün, weil sie das Falsche maß.** Konkret:

- Der Golden Dataset wurde beim Launch handgeschrieben und nie erneut gegen verschobene Verkehrsverteilungen stratifiziert.
- Der LLM-as-Judge-Prompt wurde einmal gesetzt und nie wieder gegen menschliche Labels rekalibriert. Die Judge-Übereinstimmung zerfiel im Stillen<sup><a href="#ref-2">[2]</a></sup>.
- Die Baseline-Scores wurden als rohe Zahlen abgelegt, nicht als `(model_sha, prompt_sha, judge_sha, dataset_sha, score)`-Tupel — sodass beim Regredieren niemand sagen konnte, welcher der vier sich bewegt hat.

Eine Regressionssuite, die nicht alle drei Punkte löst, ist nur ein CI-Schritt, der zur Deploy-Zeit grün wird und dir falsche Sicherheit gibt. Die Lösung heißt nicht „mehr Cases“. Die Lösung ist **slice-bewusste, versionsverankerte, judge-kalibrierte** Messung bei jedem Release.

## Einen Golden Dataset bauen, der slice-bewusster Analyse standhält

Die Vier-Bucket-Komposition, die wir standardmäßig ausliefern — Produktionsstichproben 60 %, adversarial 15 %, expertenkuratierte Edge-Cases 15 %, Failure-Replays 10 % — ist ein vernünftiger Startpunkt. Was sie tatsächlich dazu bringt, Regressionen zu erfassen, sind die **Slice-Metadaten**, die an jeden Fall angehängt werden.

Jeder Eintrag im Dataset trägt: Input, erwartetes Verhalten (Rubrik, nicht exakter String), Retrieval-Kontext (falls vorhanden) und ein `slice`-Tag — Domäne, Nutzersegment, Query-Intent, Sprache, Längen-Bucket, je nachdem welche Zerlegungen für dein Produkt zählen. Die Suite bewertet **pro Slice**, und jeder Slice, der seinen Schwellenwert unterschreitet, blockiert das Release — selbst wenn der aggregierte Score gestiegen ist.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Golden-Dataset-Komposition: 60 % Produktionsstichprobe, 15 % adversarial, 15 % expertenkuratierte Edge-Cases, 10 % Failure-Replays, alle über Slices stratifiziert">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Golden-Dataset-Komposition — auf jeder Achse nach Slice stratifiziert</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Dimensioniert für ~500 Fälle. Balkensegmente sind proportional. Die harte Anforderung ist die Abdeckung pro Slice, nicht das aggregierte Verhältnis.</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">Produktionsstichprobe</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Adversarial</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">Experten-Edges</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Replays</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">stratifizierte Produktions-Traces · quartalsweise aufgefrischt</text>
<text x="513" y="90" text-anchor="middle">Jailbreaks · Injection</text>
<text x="627" y="90" text-anchor="middle">Domänen-Edges · Long Tail</text>
<text x="722" y="90" text-anchor="middle">Postmortem-Replays ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">Jeder Fall trägt Slice-Tags — die Suite bewertet jede Kombination separat</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">Domäne</tspan> · Recht / Med / Allgemein</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">Intent</tspan> · Anleitung / Fakt / Refuse</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">Sprache</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">Länge</tspan> · kurz / mittel / lang</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">Segment</tspan> · Enterprise / SMB</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">Retrieval</tspan> · grounded / open</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">Tool-Use</tspan> · 0 / 1 / multi-step</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">Novelty</tspan> · seen / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">Komposition × Slices = Bewertungsraster</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Pro Slice bei jedem Release bewertet — Spearman ρ ≥ 0,7 vs. Baseline, pro Slice</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">Jeder Slice, der seinen Schwellenwert reißt, blockiert das Release. Der Aggregat-Score ist rein informativ.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Das Diagramm ist strukturell. Stratifizierungsachsen und Slice-spezifische Schwellenwerte werden je Produkt im Divinci-Release-Manifest konfiguriert. Intern — definiert in unseren eigenen Deployments.</figcaption>
</figure>

Zwei operative Regeln, die wir gelernt haben durchzusetzen:

**Quartalsweise neu sampeln.** Produktionsverkehrsverteilungen verschieben sich schneller, als die meisten Teams messen. Wir restratifizieren den Produktionsstichproben-Bucket alle drei Monate gegen die letzten 90 Tage Verkehr; wenn ein Slice über 5 % des Verkehrs gewachsen ist und unter 2 % im Golden Dataset lag, wird er vor dem nächsten Release nachbefüllt.

**Jedes Postmortem fügt einen Fall hinzu.** Eine Regression, die es in die Produktion geschafft hat und nicht erkannt wurde, ist ein Fall, der im Dataset fehlte. Wir fügen ihn innerhalb von 48 Stunden nach dem Postmortem in den Replays-Bucket ein und taggen ihn mit dem Slice, der ihn ans Licht gebracht hat.

## Wie erkennt man Drift, bevor es Nutzer tun?

Es gibt vier unterschiedliche Arten von Drift, und eine Regressionssuite, die nur die letzte beobachtet, ist eine, die die meisten Regressionen übersieht.

| Drift-Typ | Was sich bewegt | Erkennungssignal | Aktion |
|---|---|---|---|
| **Qualitäts-Drift** | Der Score des Judges für einen festen Slice | Slice-spezifischer Spearman ρ vs. Baseline fällt | Release blockieren; Diagnose gemäß [Post 6's Tree](/de/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) |
| **Coverage-Drift** | Produktionsverkehrsverteilung vs. Golden-Dataset-Verteilung | KL-Divergenz zwischen Slice-Anteilen | Golden Dataset neu sampeln |
| **Judge-Drift** | Übereinstimmung des Judge-Modells mit Menschen | Spearman ρ gegen ein eingefrorenes, menschenmarkiertes Audit-Set | Judge-Prompt rekalibrieren oder Judge ersetzen |
| **Produktions-Drift** | Live-Produktions-Scores vs. Offline-Scores am gleichen Modell | Replay-Score-Gap zwischen Trace und Offline | Retrieval / Preprocessing / Runtime untersuchen |

Qualitäts-Drift ist die, die die meisten Suiten messen; die anderen drei sind dort, wo sich Freitagnachmittags-Regressionen üblicherweise verstecken. Divinci verfolgt alle vier gegen das Baseline-Manifest, mit Slice-spezifischer Score-Aufschlüsselung in jedem PR und einem wöchentlichen Judge-Kalibrierungsjob, der Drift markiert, bevor sich Drift aufstaut.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Ein 30-Tage-Chart, das zeigt, wie der aggregierte Task-Completion-Score flach bei 0,87 bleibt, während der Medical-Domain-Slice still von 0,88 auf 0,74 abfällt">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Die Semver Lie, visualisiert — 30 Tage Task-Completion-Score</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Aggregat (dunkelgrün) bleibt flach. Der Medical-Slice (rot) regrediert still. Aggregat-Gates lösen nie aus.</text>
<g transform="translate(80, 100)">
<line x1="0" y1="0" x2="0" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<line x1="0" y1="250" x2="640" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">0,95</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">0,90</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">0,85</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">0,80</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0,75</text><line x1="-4" y1="200" x2="0" y2="200" stroke="#1e3a2b"/>
<text x="-10" y="254" text-anchor="end">0,70</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="0" y="268" text-anchor="middle">T-30</text>
<text x="160" y="268" text-anchor="middle">T-22</text>
<text x="320" y="268" text-anchor="middle">T-15</text>
<text x="480" y="268" text-anchor="middle">T-7</text>
<text x="640" y="268" text-anchor="middle">heute</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">Aggregat-Gate-Schwelle — 0,89</text>
<polyline points="0,40 50,42 100,38 150,40 200,42 250,38 300,40 350,38 400,40 450,42 500,38 550,40 600,42 640,40" fill="none" stroke="#5a7a8f" stroke-width="2"/>
<circle cx="640" cy="40" r="4" fill="#5a7a8f"/>
<polyline points="0,60 50,58 100,62 150,60 200,58 250,60 300,62 350,60 400,58 450,60 500,62 550,60 600,58 640,60" fill="none" stroke="#2d5a4f" stroke-width="3.5"/>
<circle cx="640" cy="60" r="5" fill="#2d5a4f"/>
<polyline points="0,72 50,74 100,70 150,72 200,76 250,72 300,74 350,72 400,70 450,72 500,74 550,72 600,76 640,74" fill="none" stroke="#7a8a4a" stroke-width="2"/>
<circle cx="640" cy="74" r="4" fill="#7a8a4a"/>
<polyline points="0,64 50,68 100,66 150,72 200,80 250,92 300,108 350,128 400,150 450,168 500,184 550,196 600,206 640,214" fill="none" stroke="#a04848" stroke-width="3.5"/>
<circle cx="640" cy="214" r="5" fill="#a04848"/>
<g font-family="'DM Sans', sans-serif" font-size="11">
<rect x="656" y="30" width="120" height="22" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1" rx="2"/>
<text x="664" y="46" font-weight="700" fill="#5a7a8f">Legal-Slice</text>
<text x="722" y="46" fill="#5a7a8f">0,910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">Aggregat</text>
<text x="722" y="72" fill="#2d5a4f">0,872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">Allgemein</text>
<text x="722" y="98" fill="#7a8a4a">0,863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">Medical-Slice</text>
<text x="664" y="232" fill="#a04848">0,743 heute · Verletzung ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">Slice-Gate würde hier auslösen ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Stilisierte Rekonstruktion des Tianpan-Sigma-Postmortem-Musters<sup><a href="#ref-1">[1]</a></sup> unter Verwendung interner Divinci-Slice-Nomenklatur. Konkrete Werte sind illustrativ.</figcaption>
</figure>

## Mehrdimensionale Evaluation — vier Dinge gleichzeitig bewerten, pro Slice

Ein einzelner Composite-Score ist ein schlechteres Signal als vier skalare Scores. Wir gaten auf vier Dimensionen:

- **Task Completion** — hat die Antwort die Frage tatsächlich beantwortet, bewertet von einem kalibrierten Judge gegen eine Rubrik. Slice-bewusst.
- **Faithfulness** — bei jeder Antwort, die auf abgerufenen Kontext verweist, ist jede Behauptung in diesem Kontext verankert. Halluzination zeigt sich hier zuerst.
- **Sicherheit** — Refusal-Korrektheit, Jailbreak-Resistenz, PII- / Policy-Exposure. Gating fast immer bei ≥ 0,99 Pass-Rate; Sicherheit ist eine harte Wand, kein weicher Trade-off.
- **Latenz-Budget** — p95 innerhalb der SLA des Slice. Eine Prompt-Änderung, die Tokens-pro-Response verdoppelt, ist eine Regression — selbst wenn die Qualität gestiegen ist.

Jede Dimension hat ihre eigene Slice-spezifische Baseline und ihren eigenen Slice-spezifischen Schwellenwert. Wir kombinieren sie zur Gate-Zeit nie in einen einzigen gewichteten Skalar; wir präsentieren sie als vier Scores pro Slice und blockieren bei dem, der seinen Schwellenwert zuerst gerissen hat. Ein Modell, das 4 Punkte Task Completion gewann, dabei aber 1 Punkt Faithfulness im Medical-Slice verlor, ist trotzdem eine Regression.

## Welche Gates sollten ein Custom-LLM-Deployment blockieren?

Wir betreiben eine dreischichtige Architektur, wobei jede Schicht eine andere Pipeline-Stufe gated ([siehe Post 1 für die Stufen-Taxonomie](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)).

**Schicht 1 — Smoke (jeder Commit, ~90 Sekunden).** Zwanzig bis dreißig kritische Fälle aus den Slices mit höchster Wirkung. Fängt katastrophale Regressionen ab, bevor die volle Suite Compute aufbraucht. Wenn Smoke fehlschlägt, läuft der Rest nicht.

**Schicht 2 — Volle Suite (jeder PR, ~12 Minuten).** Der komplette Golden Dataset, bewertet pro Slice auf allen vier Dimensionen. Slice-bewusster Spearman ρ gegen das Baseline-Manifest. Schwellenwert-Verletzung blockiert das Merge. Der PR-Kommentar listet exakt auf, welcher Slice in welcher Dimension sich um wie viel bewegt hat, mit fünf beispielhaften Fehlerfällen.

**Schicht 3 — Baseline-Vergleich (Release Candidates, ~25 Minuten).** Das Kandidatenmodell wird gegen die letzten 14 Tage Produktions-Traces erneut abgespielt — das *Closed-Loop-Produktions-Trace-Replay*, das wir in [Post 1](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) ausgeliefert haben. Der gleiche kalibrierte Judge, der den Golden Dataset bewertet, bewertet auch die Replay-Outputs. Jeder Slice, dessen Replay-Scores um mehr als seinen Schwellenwert von den Offline-Scores abweichen, blockiert das Release. Diese Schicht ist es, die Drift erfasst, von dem der Golden Dataset noch nicht weiß.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Dreischichtiger Gate-Entscheidungsbaum: Smoke-Tests bei jedem Commit, volle Suite bei jedem PR, Produktions-Trace-Replay bei Release Candidates">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Dreischichtiges Regressions-Gate — jeder Block scheitert schnell, jede Schicht ergänzt Tiefe</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① Smoke · jeder Commit</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Fälle: 20–30 kritische</text>
<text x="14" y="82">Wall-Clock: ~90 s</text>
<text x="14" y="102">Dims: nur Task + Sicherheit</text>
<text x="14" y="122">Slices: Top 3 nach Volumen</text>
<text x="14" y="148" font-weight="600">Blockiert:</text>
<text x="14" y="168">katastrophale Fehler</text>
<text x="14" y="186">malformede Outputs</text>
<text x="14" y="204">Sicherheits-Wand-Verletzungen</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">fail-fast — volle Suite</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② Volle Suite · jeder PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Fälle: voll ~500</text>
<text x="14" y="82">Wall-Clock: ~12 Min.</text>
<text x="14" y="102">Dims: Task / Faith / Safety / Lat</text>
<text x="14" y="122">Slices: alle stratifiziert</text>
<text x="14" y="148" font-weight="600">Blockiert:</text>
<text x="14" y="168">Slice-spezifisches ρ &lt; 0,7</text>
<text x="14" y="188">jede Slice-Metrik unter Schwelle</text>
<text x="14" y="208">Judge-Übereinstimmung &lt; 0,65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">PR-Kommentar zeigt welche</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ Replay · Release Candidates</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Fälle: 14 T. Live-Traces</text>
<text x="14" y="82">Wall-Clock: ~25 Min.</text>
<text x="14" y="102">Dims: alle vier · slice-bewusst</text>
<text x="14" y="122">Quelle: Produktions-Trace-Store</text>
<text x="14" y="148" font-weight="600">Blockiert:</text>
<text x="14" y="168">Offline ↔ Replay Score-Gap</text>
<text x="14" y="188">Drift in Slices, die noch nicht</text>
<text x="14" y="206">im Golden Dataset sind</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">letztes Gate vor Rollout</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">Alle drei Schichten bewerten gegen dasselbe Baseline-Manifest — (model_sha, prompt_sha, retrieval_sha, judge_sha) — sodass ein sich bewegender Score identifiziert, <tspan font-weight="600" fill="#1e3a2b">welche</tspan> Dimension gedriftet ist, nicht nur <tspan font-weight="600" fill="#1e3a2b">dass</tspan> etwas gedriftet ist.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Die Wall-Clock-Zahlen sind intern — gemessen auf Divincis Produktions-CI-Runnern für einen repräsentativen Kunden mit ~500 Golden-Dataset-Fällen und ~14 Tagen Produktions-Traces.</figcaption>
</figure>

## Kalibriere deinen Judge, bevor du einem einzigen Score vertraust, den er produziert

LLM-as-Judge ist das, was all dies über ein paar hundert Fälle hinaus skalierbar macht. Es ist auch der Punkt, an dem eine Regressionssuite still aufhört zu funktionieren, weil der Judge keinerlei Verpflichtung hat, kalibriert zu bleiben, während er aktualisiert wird oder sich deine Datenverteilung verschiebt.

Wir kalibrieren jeden Judge-Prompt gegen ein eingefrorenes, menschenmarkiertes Audit-Set von mindestens 100 Fällen, stratifiziert über dieselben Slices wie der Golden Dataset, und wir wiederholen die Kalibrierung wöchentlich. Die Latte, mit der wir ausliefern, ist **Spearman ρ ≥ 0,7** gegen den Median der menschlichen Rater, mit **Cohens κ ≥ 0,6** bei binären Sicherheits-Urteilen. Beide liegen über der Schwelle, ab der MT-Bench-artige Judges nachweislich menschliche Rater auf dem Niveau der Inter-Human-Übereinstimmung treffen<sup><a href="#ref-2">[2]</a></sup>.

Wenn die wöchentliche Kalibrierung unter die Schwelle fällt, wird der Judge automatisch außer Dienst gestellt und der diensthabende Eval-Engineer wird gepaget. Die Release-Pipeline hält Kandidaten offen, statt sie an einem Judge zu gaten, der nicht mehr das misst, was er einmal gemessen hat.

```bash
# Wöchentlichen Judge-Kalibrierungsjob ausführen
curl -X POST https://api.divinci.ai/v1/regression/judges/calibrate \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "judge_id":     "rubric-v7",
    "audit_set":    "human-labels-2026-04",
    "min_spearman": 0.70,
    "min_kappa":    0.60,
    "on_fail":      "retire_judge_and_page"
  }'
```

## Der Divinci-Differenzierer — Closed-Loop-Produktions-Trace-Replay

Das Gate von Schicht 3 ist der Teil, den die meisten Regressionssuiten nicht haben. Der Flow ist derselbe Flow, den wir in Post 1 ausgeliefert haben, mit einer Spezialisierung für Regressionstests: Jeder Release Candidate wird mit seinem Score auf dem Offline-Golden-Dataset Slice für Slice mit seinem Score auf einem 14-tägigen Fenster wiederabgespielter Produktions-Traces verglichen. Der Golden Dataset misst, was wir vom Modell erwartet haben. Der Replay misst, was das Modell letzte Woche tatsächlich getan hätte.

Wenn diese beiden Scores um mehr als das Slice-spezifische Gap-Budget divergieren, wird das Release blockiert. Die Diskrepanz ist das Signal: Entweder ist der Golden Dataset nicht mehr repräsentativ (Coverage-Drift) oder der Kandidat verhält sich anders auf Traces, die durch Produktions-Preprocessing und -Retrieval geformt wurden (Produktions-Drift). So oder so erfährst du es, bevor die Nutzer es tun.

Der Judge, der den Offline-Run bewertet, ist derselbe Judge, der den Replay-Run bewertet. Das Audit-Log protokolliert beide Score-Sets, beide Judge-Versionen, die Trace-IDs, die wiederabgespielt wurden, und die Lücke, die den Block ausgelöst hat. Die Lücke selbst ist das nützlichste diagnostische Signal, das wir haben, und sie ist es, was an denjenigen weitergegeben wird, der als Nächstes den [Post-6-Diagnosebaum](/de/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) aufnimmt.

## Verankere den Golden Dataset mit einem Vindex-Receipt

Jeder Score in der Suite ist bedeutungslos, wenn du ihn später nicht reproduzieren kannst. Wir hashen den Golden Dataset bei jedem Release und verketten diesen Hash in einem Vindex-Receipt zusammen mit Modell-SHA, Prompt-SHA, Judge-SHA und dem Kalibrierungsprotokoll. Das Receipt ist extern verankerbar — Auditoren können unseren exakten Regressions-Run sechs Monate später wiederabspielen und die von uns angegebenen Scores verifizieren.

```json
{
  "release_id": "rel_3f1a-2026-05-26",
  "model": { "sha": "0c1f9…", "weights_uri": "r2://models/custom-v7.2", "open_weights": true },
  "prompt": { "sha": "c4a8e…", "template_id": "support-v3.4" },
  "retrieval": { "index_sha": "b21f0…", "embedder": "e5-mistral-7b-instruct" },
  "judge": { "sha": "d8e21…", "rubric_id": "rubric-v7", "spearman_vs_humans": 0.74 },
  "dataset": { "sha": "a90b1…", "n": 512, "slices": 17, "stratified_at": "2026-04-30" },
  "scores": { "aggregate": 0.872, "by_slice": { "/* … */": "/* per-slice scalars */" } },
  "replay": { "trace_window_days": 14, "n_traces": 8430, "max_gap": 0.018 },
  "vindex_anchor": "sha256:f0bfd2…",
  "verifiable_at": "https://vindex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**Open-Weights-Vorbehalt.** Das obige Receipt trägt Gewichts-Provenienz nur, wenn das Modell Open-Weights ist — Vindex verankert die tatsächlichen Gewichts-Bytes. Bei Closed-API-Modell-Backings (OpenAI / Anthropic / verwaltete Google-Modelle) trägt das Receipt nach wie vor die Entscheidungskette — jeden Gate-Score, jedes Judge-Ergebnis, das Kalibrierungsprotokoll — aber das Gewichts-Feld ist leer, und du kannst das Modell-Artefakt nicht unabhängig verifizieren. Wir sagen das im Receipt und in der [Compliance-Dokumentation](/de/compliance/), damit Auditoren keinen falschen Eindruck bekommen. Die Releases, die am meisten von einer vollständigen Vindex-Kette profitieren, sind diejenigen, bei denen du die Gewichte kontrollierst.

## Ein vierstufiger Implementierungs-Zeitplan, den wir tatsächlich ausgeliefert haben

Teams, die versuchen, die vollständige Architektur in Woche eins auszuliefern, verklemmen sich am Tooling. Die folgende Reihenfolge ist die Reihenfolge, die funktioniert.

**Phase 1 — Baseline (Woche 1).** Ziehe eine stratifizierte Stichprobe der letzten 30 Tage Produktions-Traces. Lasse zwei Engineers Task Completion an jeweils 100 Fällen handannotieren. Berechne die Inter-Rater-Übereinstimmung (Ziel Cohens κ ≥ 0,6). Die Zahl, die du erhältst, ist deine Start-Human-Baseline; alles Weitere wird daran kalibriert.

**Phase 2 — Harness (Wochen 2–3).** Stehe das Evaluierungs-Harness auf dem 100-Fall-Dataset auf. Füge einen kalibrierten Judge gegen deine menschlichen Labels hinzu. Verifiziere, dass das Harness die menschlichen Scores innerhalb von ρ ≥ 0,7 reproduziert. Die meisten Teams stellen fest, dass ihr erster Judge-Prompt diesen Test nicht besteht und ihn zweimal neu schreiben — das ist normal.

**Phase 3 — Gates (Wochen 3–4).** Verdrahte das Harness als Warnung ins CI, nicht als Block. Beobachte es zwei Wochen lang. Die Schwellenwerte, die du durch Beobachten der Falsch-Positiv-Raten ableitest, sind die einzigen Schwellenwerte, die überdauern. Auf blockierend hochstufen erst, wenn die Falsch-Positiv-Rate unter 5 % liegt.

**Phase 4 — Replay-Loop (laufend).** Sobald Gates zuverlässig blockieren, aktiviere die Schicht für Produktions-Trace-Replay. Hier tritt die Slice-Coverage-Lücke zutage, und hier beginnt jedes Postmortem, Fälle wieder in den Golden Dataset einzuspeisen.

## Was das nicht löst

Drei ehrliche Grenzen, so wie wir sie in jedem Post dieser Serie eingerahmt haben.

1. **Suite-Drift ist endlose Arbeit.** Regressionstests sind Infrastruktur, kein Projekt. Der Golden Dataset muss jedes Quartal neu stratifiziert werden, der Judge jede Woche neu kalibriert, die Schwellenwert-Budgets bei jedem Postmortem neu abgestimmt. Es gibt keine Version davon, in der du eine Suite ausrollst und davonläufst.
2. **Ein perfekt kalibrierter Judge ist immer noch ein Modell.** Spearman ρ = 0,74 gegen menschliche Rater heißt: ungefähr ein Viertel der Judge-Calls weicht vom menschlichen Median ab. Diese verbleibende Diskrepanz ist der Rauschboden bei jedem Score. Wir weisen explizit in jedem Release-Report darauf hin; Teams, die vergessen, dass es da ist, werden irgendwann davon überrascht.
3. **Closed-API-Backings deckeln, wie viel du verifizieren kannst.** Mit einem Closed-API-Modell misst die Regressionssuite Verhalten, kann aber Gewichts-Provenienz nicht verifizieren. Wenn du volle Reproduzierbarkeit brauchst — regulierte Branchen, auditierte Deployments — liegt der Trade-off bei der Modellwahl, nicht bei der Suite.

## Was als Nächstes kommt

Post 8, der letzte dieser Serie, schließt die Schleife im Inneren des CI. Während dieser Post und Post 5 davon handelten, was an den Gates läuft, geht es im nächsten um die CI-Schicht, die die Kandidaten produziert, die die Gates überhaupt erst bewerten — Pre-Merge-Evaluation, Contract-Tests für Prompt-Templates und wie man die CI-Flotte für eine 12-minütige Eval-Suite dimensioniert, ohne das Budget zu sprengen. Es ist die Engineering-Schicht unter allem, worüber wir bisher geschrieben haben.

## FAQ

**Was ist der Unterschied zwischen LLM-Evaluation und LLM-Regressionstest?**

Evaluation misst, ob ein Modell zu einem Zeitpunkt eine Qualitätslatte erreicht, gegen eine absolute Rubrik. Regressionstest misst, ob ein Kandidat sich identisch zu einer eingefrorenen Baseline verhält, pro Slice, über mehrere Dimensionen hinweg. Die Baseline ist es, was ihn zum Regressionstest macht — Divinci liefert beides aus, und der Regressionsmodus pinnt (model_sha, prompt_sha, judge_sha, dataset_sha), sodass ein verschobener Score identifiziert, welcher Input sich bewegt hat.

**Wie viele Fälle sollte ein Golden Dataset enthalten?**

Weniger, als du denkst, besser stratifiziert, als du denkst. Wir haben nützliche Regressionsabdeckung mit 200 Fällen auf fünf gut definierten Slices ausgeliefert und haben 5.000-Fall-Datasets gesehen, die alles Wesentliche verfehlt haben, weil sie nicht stratifiziert waren. Starte bei 200, stratifiziert, und lass dann den Replay-Bucket Fall für Fall aus Postmortems wachsen.

**Sollte ich menschliche Reviewer oder LLM-as-Judge nutzen?**

Beides, wobei Menschen den Judge kalibrieren. Menschen können nicht mit dem Volumen mithalten, das ein Release-Cycle-CI-Gate bewerten muss. Der Judge füllt das Volumen, die Menschen kalibrieren den Judge — wöchentlich gemessen mit Spearman ρ ≥ 0,7. Beides für sich allein ist ein Failure-Modus.

**Wie teste ich auf nicht-deterministische Outputs?**

Bewerte die Verteilung, nicht den String. Bewerte mit einer Rubrik, die der Judge über Formulierungen hinweg anwenden kann, und laufe jeden Input drei- bis fünfmal bei Temperatur > 0, damit der Slice-bewusste Score über einer Verteilung von Completions gebildet wird statt über einer einzelnen Stichprobe. Verenge die Temperatur nur für Fälle, die deterministische Outputs wirklich benötigen (strukturierte Output-Tool-Calls, Klassifizierung).

**Welche Metriken sollte ich für das erste CI-Quality-Gate priorisieren?**

Task Completion und ein Sicherheits-Gate. Beides pro Slice. Mehr Dimensionen hinzuzufügen, bevor die ersten beiden kalibriert sind, produziert Rauschen; Teams, die mehr ausliefern, gaten am Ende meistens auf das Rauschen. Faithfulness kommt als Nächstes, sobald du Retrieval einschaltest; Latenz, sobald die ersten beiden stabil sind.

## Quellen

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29. April 2026. Der benannte 2026er-Failure-Modus für slice-bewusste Regressionsanalyse; aggregierte Scores bleiben flach, während ein Slice mit geringem Volumen still regrediert.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Empirischer Nachweis, dass starke LLM-Judges bei offenen Aufgaben in etwa auf dem Niveau der Inter-Human-Übereinstimmung (≈ 80 %) mit menschlichen Ratern übereinstimmen, mit dokumentierten Failure-Modi, die kalibriere-gegen-Menschen-Audits gerade erkennen sollen.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. Das grundlegende Ergebnis zu katastrophalem Vergessen in feinabgestimmten neuronalen Netzen — warum ein feinabgestimmtes Custom LLM auf allgemeinen Fähigkeitsverlust regressionsgetestet werden muss, nicht nur auf Zugewinn auf der Zielaufgabe.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> Der Closed-API-Kontrast: Gates auf Infrastruktur-Metriken (Latenz, Fehler, CPU) statt auf slice-spezifische semantische Qualität.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. Der Rang-Korrelationskoeffizient, der das slice-bewusste Gate verankert — robust gegen Drift der Bewertungsskala im Judge, was die Eigenschaft ist, die wir brauchten.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> Die branchenübergreifende Baseline für „Wie oft verursachen Deploys Incidents“ und „Wie schnell erholst du dich“. Regressionssuiten, die am Gate blockieren, drücken die erste Metrik nach unten; sofortiger Rollback ([Post 5](/de/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) drückt die zweite.
  </li>
</ol>
