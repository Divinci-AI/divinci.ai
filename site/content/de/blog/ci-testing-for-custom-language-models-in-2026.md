+++
title = "CI-Tests für Custom Language Models im Jahr 2026"
description = "Contract-Tests, Smoke-Budget, kostenbewusste Flottendimensionierung und Shadow-CI. Wie man eine 12-Minuten-Eval-Suite bei jedem PR handhabbar hält, ohne das Team auszubremsen."
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "images/ci-testing-for-custom-language-models-in-2026-hero.png"
reading_time = 13
summary = "Die Regressions-Suite aus Beitrag 7 kostet bei jedem PR echtes Geld. So halten wir dieselbe Abdeckung zu einem Bruchteil der Kosten — Sub-Sekunden-Contract-Tests, eine 90-Sekunden-Smoke-Schicht, Embedding-Cache + Judge-Batching und ein zweiwöchiges Shadow-Fenster, bevor irgendein Gate zu blockieren beginnt. Der finale Beitrag der Serie."
+++

*Notizen aus dem Release-Zyklus — Teil 8 (Finale)*

Sie liefern die Regressions-Suite aus [Beitrag 7](/de/blog/automated-regression-testing-for-custom-llms-in-2026/) aus. Sie funktioniert. Die Slice-bewussten Gates fangen echte Bugs. Der kalibrierte Judge hält stand.

Dann fragt Ihr Engineering Lead, wie viel es kostet, sie bei jedem PR laufen zu lassen. Sie rechnen nach: ~12 Minuten Judge-Inferenz pro PR, 60 PRs pro Tag, vier Dimensionen × siebzehn Slices — und die Rechnung wird zu echtem Geld. Schlimmer noch, jeder Entwickler wartet jetzt 12 Minuten auf einen grünen Haken für einen einzeiligen Prompt-Tippfehler. Die Velocity sinkt<sup><a href="#ref-1">[1]</a></sup>, das Team murrt, jemand schlägt vor, „die Gates einfach nachts laufen zu lassen" — was exakt der Weg ist, auf dem Sie alles aufgeben, wofür die Gates da waren.

Die Lösung ist nicht weniger Testen. Die Lösung ist **Testen in Schichten, wobei der Großteil des Signals in den ersten neunzig Sekunden eintrifft.** Dieser Beitrag handelt von dem, was unterhalb der Gate-Suite läuft: Sub-Sekunden-Contract-Tests, eine straffe Smoke-Schicht, eine kostenbewusste Flotte und ein zweiwöchiges Shadow-Fenster, bevor ein neues Gate irgendjemanden blockiert.

Das ist Beitrag 8, der letzte dieser Serie. Am Ende haben Sie das vollständige Bild — von der [vierstufigen Pipeline](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) bis hinunter zum Contract-Test-Fixture, das bei jedem Commit läuft.

## Was bedeutet CI für ein Custom Language Model?

CI für ein Custom-LLM ist die Arbeit, die die Gate-Suite nicht wiederholen muss. Das Gate bewertet semantische Qualität; CI fängt alles ab, was den Score des Gates bedeutungslos machen würde, bevor das Gate einen einzigen Judge-Token ausgibt.

Contract-Tests laufen in Millisekunden und verifizieren, dass Prompt-Templates noch rendern, dass Tool-Call-Schemas noch parsen, dass Retrieval-Indizes noch antworten, dass das Manifest noch auf Hashes verweist, die tatsächlich existieren. Sie sind deterministisch, kostenlos und der einzige Grund, warum sich der Rest der Pipeline leisten kann zu existieren. Ein Pull Request, der das Prompt-Template kaputt macht, sollte in 200 ms fehlschlagen — nicht nach 12 Minuten Judge-Inferenz, die Unsinn bewertet.

Die Contract-Schicht ist der Unterschied zwischen einer CI-Rechnung, die linear mit dem PR-Volumen skaliert, und einer, die das nicht tut. Divincis CI-Runner verbringt > 90 % seines Judge-Budgets mit echter semantischer Evaluation, nicht mit PRs, die ohnehin an einer Schema-Prüfung gescheitert wären. Diese Quote ist die Kennzahl.

## Warum traditionelle CI für LLMs versagt — durch die Kostenlinse

Die Beiträge [1](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) und [7](/de/blog/automated-regression-testing-for-custom-llms-in-2026/) haben behandelt, warum deterministische CI bei einem generativen Modell scheitert. Die Version dieser Geschichte, um die es in diesem Beitrag geht, ist nicht die Existenz dieser vier Eigenschaften, sondern ihre **Kosten**.

| Eigenschaft von LLMs | Versagen traditioneller CI | Kostenform |
|---|---|---|
| Nicht-deterministische Ausgaben | Exact-Match-Assertions flaken | Re-Runs verstärken Kosten linear mit der Flake-Rate |
| Mehrdimensionale Qualität | Ein einzelner Boolean ist nicht informativ | Jede Dimension ist ein separater (kostenpflichtiger) Judge-Call |
| Provider-Drift | Gepinntes `gpt-4-2024-01-01` wird leise abgekündigt | Rekalibrierungs-Burst, wenn ein Provider einen Checkpoint zurückzieht |
| Nicht-lokale Prompt-Effekte | Lokaler Unit-Test kann den Effekt nicht fangen | Verteilungsverschiebungen treten zwischen PRs auf, nicht innerhalb — erfordert vollständigen Suite-Re-Run, kein Delta |

Die CI-Architektur muss jeden dieser Punkte bezahlbar machen. Contract-Tests bewältigen Eigenschaft 1 und 3 günstig. Smoke-Tests bewältigen Eigenschaft 4 teilweise. Nur die vollständige Suite bewältigt Eigenschaft 2 — und nur bei den PRs, die sie wirklich brauchen.

## Die CI-Schichttorte — Sub-Sekunde bis fünfundzwanzig Minuten

Die Architektur, die wir ausliefern, besteht aus vier Schichten, jede verdient ihre Rechenleistung damit, dass sie fängt, was die günstigeren Schichten darunter nicht können. Die Slice-bewusste Rahmung jeder Schicht folgt derselben Lektion, die das [Tianpan-Semver-Lie-Postmortem](/de/blog/automated-regression-testing-for-custom-llms-in-2026/) explizit gemacht hat<sup><a href="#ref-4">[4]</a></sup>: Aggregatsignale lügen; Per-Slice-Signale fangen, was Aggregate verbergen.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Vierschichtige CI-Architektur: Contract-Tests Sub-Sekunde, Smoke 90s, Full-Suite 12 Minuten, Production-Trace-Replay 25 Minuten">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">CI-Schichttorte — jede Schicht verengt den Trichter der PRs, die die nächste erreichen</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Die meisten PRs berühren nur die beiden oberen Schichten. Kosten-pro-PR-Zahlen sind intern — gemessen auf Divincis Produktions-CI.</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① Contract · jeder Commit · &lt; 1 s · ~$0,00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">Schema · Template-Render · Denylist · Manifest-Integrität · Index-Lebendigkeit</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100 % aller Commits</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② Smoke · jeder PR · ~90 s · ~$0,05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">20–30 kritische Fälle auf den Top-3-Slices · nur Task + Safety</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100 % aller PRs</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ Full-Suite · Prompt-/Modell-/Retrieval-PRs · ~12 min · ~$0,80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500 Fälle · 4 Dimensionen · alle Slices · Per-Slice-Spearman-Gates</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~22 % der PRs</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ Production-Trace-Replay · Release Candidates · ~25 min · ~$2,40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">14-Tage-Replay-Fenster · derselbe kalibrierte Judge · Offline-↔-Replay-Gap-Analyse</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~4 % der PRs</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">Aggregierte Kosten pro PR (trichtergewichtet): ~$0,27. Aggregierte p95-Wall-Clock: ~3,4 min.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Schicht-Wall-Clock, Per-Schicht-Kosten und Trichterquoten sind intern — gemessen auf Divincis Produktions-CI für einen repräsentativen Kunden (~500 Golden-Dataset-Fälle, 17 Slices, ~60 PRs/Tag).</figcaption>
</figure>

Die Kostenform ist das Design. ~74 % der PRs geben nie einen Judge-Token aus — Contract oder Smoke reichen. Die PRs, die die Full-Suite erreichen, sind diejenigen, die einen Prompt, eine Modellkonfiguration, einen Retrieval-Index oder Evaluation-Code berührt haben — genau die Änderungen, bei denen die Gate-Suite das einzige vertrauenswürdige Signal ist. Release Candidates sind der kleine Anteil, der Schicht 4 erreicht.

## Contract-Tests — der unfaire Vorteil

Contract-Tests sind die erste Linie, die günstigste Linie und die Linie, die die meisten Teams überspringen, weil sie sich unter der Würde einer „KI-Evaluations-Pipeline" zu befinden scheint. Sie sind aber auch die Schicht, in der 30–40 % der potenziellen Regressionen in den Suites unserer Kunden tatsächlich scheitern, bevor ein einziger Judge angerufen wurde.

Die Contract-Schicht prüft fünf Dinge und nichts anderes:

1. **Prompt-Template-Render.** Jedes Template rendert gegen ein kanonisches Fixture ohne ungebundene Variablen, Endlosschleifen oder kaputte Jinja-Style-Includes.
2. **Tool-Call-Schema.** Das Argument-Schema jedes deklarierten Tools parst, das JSONSchema ist valide, und der gerenderte Prompt verweist tatsächlich auf alle erforderlichen Slots.
3. **Manifest-Integrität.** Jeder SHA im Release-Manifest — Modell, Prompt, Retrieval-Index, Judge, Dataset — entspricht einem Artefakt, das in der Registry existiert. Dangling Pointers scheitern hier, nicht drei Schichten weiter.
4. **Index-Lebendigkeit.** Der Retrieval-Index antwortet im Budget auf eine bekannte Query. Ein neu gebauter Index, der das Retrieval leise zerstört hat, tritt hier zutage, nicht in Produktion.
5. **Denylist & Token-Budget.** Jedes Prompt-Template, das ein verbotenes Token eingeführt hat, das Per-Call-Token-Budget gesprengt hat oder über das Kontextfenster hinaus gerendert hat, scheitert hier. Heuristisches Semantische-Ähnlichkeits-Scoring<sup><a href="#ref-6">[6]</a></sup> ist ebenfalls günstig genug, um in der Contract-Schicht zu laufen — für Fuzzy-Match-Denylist-Abdeckung, bei der literales String-Matching nicht ausreicht.

```bash
# Ein repräsentativer Contract-Test-Aufruf — läuft in etwa 600 ms
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

Keiner dieser Aufrufe spricht einen Judge an. Keiner ist nicht-deterministisch. Keiner kostet messbares Geld. Und jeder einzelne von ihnen schließt eine ganze Klasse von „Die Gate-Suite sagt, der Medical-Slice ist regressiert"-Alarmen aus, die ansonsten volle 12 Minuten Judge-Inferenz verschwendet hätten, um Output zu bewerten, den das Modell von vornherein nicht korrekt hätte erzeugen können.

## Die Smoke-Schicht — 90 Sekunden, ~$0,05 pro PR

Wenn die Contract-Schicht der günstige unfaire Vorteil ist, ist die Smoke-Schicht diejenige, die tatsächlich Regressionen für weniger als den Preis eines Kaffees fängt. Zwanzig bis dreißig Fälle, gezogen aus den umsatzstärksten Slices, bewertet **nur auf Task Completion und Safety** — keine Faithfulness, keine Latenz, keine Retrieval-fundierten Checks. Jeder PR durchläuft das. Es dauert etwa 90 Sekunden, weil die Fälle in einen einzigen Judge-Call mit Structured-Output-Schema gebündelt werden und weil der Judge der günstige kalibrierte Judge ist — nicht der vollqualitative, der für Release Candidates verwendet wird.

Wir verfolgen in einem Regressions-Log, welche Schicht jeden ausgelieferten Fix gefangen hat, und das Histogramm war in den letzten sechs Monaten in Kunden-Deployments konsistent:

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Balkendiagramm zeigt, wo Regressionen gefangen werden: 31 Prozent in der Contract-Schicht, 27 Prozent bei Smoke, 28 Prozent in der Full-Suite, 11 Prozent beim Replay, 3 Prozent entwischen in die Produktion">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Wo Regressionen gefangen werden — nach Schicht, letzte 6 Monate über Kunden-Deployments hinweg</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Die meisten Regressionen sterben in den günstigsten Schichten. Die teuren Schichten verdienen ihre Kosten am Restanteil.</text>
<g transform="translate(90, 100)">
<line x1="0" y1="200" x2="780" y2="200" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">40 %</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">30 %</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">20 %</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">10 %</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0 %</text>
</g>
<g>
<rect x="40" y="45" width="120" height="155" fill="#7a8a4a" stroke="#1e3a2b" stroke-width="1"/>
<text x="100" y="36" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">31 %</text>
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Contract</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1 s · $0,00</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27 %</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Smoke</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90 s · $0,05</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28 %</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Full-Suite</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12 min · $0,80</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11 %</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Replay</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25 min · $2,40</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3 %</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">Entwischt</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ Rollback</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Rollierendes Sechs-Monats-Aggregat über aktive Divinci-CI-Deployments. Angegeben als % der bestätigten Regressionen, bei denen die genannte Schicht die erste war, die fehlschlug. Intern — von uns gemessen.</figcaption>
</figure>

Die 3 %, die entwischen, sind der Grund, warum [der Instant-Rollback aus Beitrag 5](/de/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) existiert. Die Gates versprechen keine null Escapes; sie versprechen eine enge Obergrenze und eine schnelle Wiederherstellung für das, was durchkommt.

## CI-Flottendimensionierung — wie die 12-Minuten-Suite günstig bleibt

Die Full-Suite-Schicht ist der Punkt, an dem die Rechnung aufgehen muss. Eine naive Implementierung ruft den Judge einmal pro Fall-pro-Dimension auf, lässt sie sequenziell laufen, und die Rechnung skaliert linear mit der Fallzahl. Drei Optimierungen leisten den Großteil der Arbeit, um das handhabbar zu halten:

**Embedding-Cache.** Der Retrieval-Kontext-Fingerprint für jeden Golden-Dataset-Fall wird gehasht; wenn sich der Fall nicht geändert hat und sich der Retrieval-Index nicht geändert hat, bleibt das gecachte Embedding gültig und der Retrieval-Schritt entfällt. Die Hit-Rate liegt nach der ersten stabilen Woche in unseren Kunden-Deployments konstant über 90 %.

**Judge-Batching.** Der kalibrierte Judge wird mit Structured Output aufgerufen und bündelt 8–16 Fälle pro Call. Die Per-Token-Kosten des Judges bleiben gleich; der Per-Case-Overhead sinkt, weil sich der System-Prompt über den Batch amortisiert. Der Schwellenwert für sicheres Batching wird durch die kalibrierte Übereinstimmung des Judges bei dieser Batch-Größe gesetzt<sup><a href="#ref-2">[2]</a></sup> — wir messen dies während des wöchentlichen Judge-Kalibrierungs-Passes ([Beitrag 7](/de/blog/automated-regression-testing-for-custom-llms-in-2026/)).

**KV-Cache-Wiederverwendung über Fälle hinweg.** Bei Modellen, bei denen derselbe System-Prompt und dieselben Tool-Definitionen jedem Call vorangestellt sind, wird der KV-Cache für dieses Präfix einmal pro Suite-Run berechnet, nicht einmal pro Fall<sup><a href="#ref-3">[3]</a></sup>. Bei Open-Weights-Deployments ist das geradeaus; bei Closed-API-Modellen hängt es vom Prefix-Caching-Support des Providers ab.

Der kombinierte Effekt landet die Full-Suite ungefähr bei den Kostenzahlen aus dem Schichttorten-Diagramm oben. Die exakten Zahlen sind intern, aber die Quote ist die öffentliche Aussage: **~74 % der PRs verbrauchen null Judge-Dollar; ~22 % verbrauchen Cents; die verbleibenden 4 % verbrauchen ein paar Dollar für das hochkonfidenteste Pre-Rollout-Signal, das wir zu produzieren wissen.**

## Shadow-CI — einschalten, ohne das Team zu zerstören

Der eine Fehler, den wir bei Teams am häufigsten beobachtet haben, ist, ein neues Gate am ersten Tag von „aus" auf „blockierend" zu schalten. Die Schwellenwerte sind auf gestrigen Daten getuned, die False-Positive-Rate ist unbekannt, und beim ersten Auslösen des Gates hat das Team keine Kalibrierung dafür, ob es echt oder ein Fehlalarm ist. Der On-Call-Eval-Engineer wird gepiept, das Gate wird deaktiviert, das Vertrauen ist weg, das Projekt ist tot.

Die Lösung ist *Shadow-CI*: Lassen Sie das neue Gate zwei Wochen lang nicht-blockierend laufen, posten Sie das Ergebnis als Bot-Kommentar an jedem PR und überprüfen Sie wöchentlich die False-Positive-Rate, bevor Sie es auf blockierend schalten. Der Divinci-CI-Runner hat genau dafür ein `--shadow`-Flag. Der PR-Kommentar sieht genauso aus wie die spätere blockierende Version — gleiche Diff-Anzeige, gleiche Per-Slice-Aufschlüsselung — nur dass er den Merge nicht gatet.

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

Wenn die False-Positive-Rate über das Fenster nachhaltig unter 5 % liegt, flippen wir es. Wenn nicht, ziehen wir die Per-Slice-Schwellen an, rekalibrieren den Judge und shadown erneut. So oder so wird das Team nicht von einem neuen Gate überfallen, das am ersten Tag feuert.

## Ein GitHub-Actions-Workflow, der tatsächlich komponiert

Das Stück, das die Schichttorte mit Ihrer bestehenden CI verbindet, läuft in `.github/workflows/llm-ci.yaml`. Die Schichten sind so verdrahtet, dass die günstigen schnell scheitern und die teuren nur dann laufen, wenn sie müssen — `needs:`-Ketten und pfadgefilterte Trigger erledigen die Arbeit<sup><a href="#ref-5">[5]</a></sup>.

```yaml
name: LLM CI
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'config/models.yaml'
      - 'eval/**'
      - 'retrieval/**'
      - 'manifests/**'
jobs:
  contract:
    runs-on: ubuntu-latest
    timeout-minutes: 2
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci contract --manifest manifests/staging.yaml --fail-fast
  smoke:
    needs: contract
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=smoke --post-pr-comment
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
  full:
    needs: smoke
    if: contains(steps.changes.outputs.paths, 'prompts/') || contains(steps.changes.outputs.paths, 'config/models.yaml')
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: divinci ci run --layer=full --post-pr-comment --gate
        env:
          DIVINCI_API_KEY: ${{ secrets.DIVINCI_API_KEY }}
```

Drei Dinge, die zu beachten sind. Die Schichten verketten sich über `needs:`, sodass Smoke nicht bei einem kaputten Contract läuft und Full nicht bei kaputtem Smoke. Der `full`-Job ist pfadgefiltert auf die Änderungen, die tatsächlich einen 12-minütigen Lauf rechtfertigen — eine Tippfehler-Korrektur in der README löst die Gate-Suite nicht aus. Das `--post-pr-comment`-Flag ist das, was den Per-Slice-Diff sichtbar macht, ohne GitHub verlassen zu müssen.

## Die Failed-PR-Debug-Schleife

Die andere Hälfte von „das Gate hat gefeuert" ist „zeig mir, warum." Eine Regressions-Suite-Ausgabe von `medical slice task-completion dropped 0.04` ist ohne die Fälle, die sie verursacht haben, nicht handlungsfähig. Wir blenden die fünf schlechtesten Per-Slice-Diffs im PR-Kommentar ein, mit dem Original-Input, dem Baseline-Output, dem Candidate-Output und der Reasoning-Spur des Judges. Die Debug-Schleife soll Sekunden dauern, nicht Minuten:

```bash
# Die 5 schlechtesten Fälle ziehen, die das Medical-Slice-Gate auf diesem PR ausgelöst haben
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

Das ist dieselbe Diagnoseoberfläche wie [der Sieben-Schritte-Baum aus Beitrag 6](/de/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/), verdrahtet in die CI-Feedback-Schleife. Der Engineer, der den PR geöffnet hat, sieht die Fall-Level-Evidenz direkt im PR; er muss kein separates Eval-Dashboard öffnen.

## Versionierungsdisziplin — Prompts, Datasets, Judges als Code

Prompt-Templates, Golden-Datasets und Judge-Prompts leben alle im Repo, Hash-gepinnt im Release-Manifest. Das Manifest ist das einzelne Objekt, das die Suite an einen spezifischen, reproduzierbaren Zustand bindet:

```yaml
# manifests/staging.yaml — jeder CI-Run hasht dieses
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

Wenn ein CI-Run einen Score postet, wird der Score mit diesem Manifest-Hash getaggt. Wenn ein Score sich bewegt, hat die Frage „welcher Input hat sich bewegt" eine direkte Antwort: Manifest diffen, und die Schicht, die gefeuert hat, sagt Ihnen, welche Dimension Sie zuerst betrachten sollten. Das ist die Schleife, die [die vierstufige Pipeline aus Beitrag 1](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) und [die Vindex-Quittung aus Beitrag 4](/de/blog/validating-and-releasing-custom-lms-in-regulated-fields/) gemeinsam schließen: Das Manifest ist das Audit-Primitiv, auf das alle acht dieser Beiträge in unterschiedlichen Rahmungen hingearbeitet haben.

## Was das nicht löst

Dieselben drei ehrlichen Einschränkungen, die wir in jeden Beitrag dieser Serie geschrieben haben.

1. **CI testet nicht, was nicht in der Suite ist.** Egal wie klug die Schichttorte ist — die einzigen Regressionen, die sie fängt, sind die, die irgendein Fall im Golden-Dataset markiert hätte. Die Replay-Schicht mildert das für Verhaltens-Drift, aber neuartige Queries, die nie zuvor gesehen wurden, entwischen weiterhin, bis sie in der Produktion auftauchen. Das System muss mit Produktions-Monitoring gepaart werden.
2. **Kostenzahlen verschieben sich mit dem Modellpreis.** Jede Kostenzahl in diesem Beitrag hängt von Judge-Token-Raten, Embedding-Raten und Inferenz-Raten ab, die sich quartalsweise verschieben. Die Quoten — 74 % / 22 % / 4 %, 31 % / 27 % / 28 % / 11 % / 3 % — sind die tragenden Aussagen; die Dollar-Zahlen sind illustrativ für einen Moment in der Zeit.
3. **Provider-seitige Checkpoint-Änderungen sind weiterhin schwierig.** Wenn ein Closed-API-Provider das Modell hinter einem stabilen Namen leise aktualisiert, kann die Contract-Schicht das nicht fangen; nur die Gate-Suite kann es, und nur im Nachhinein. Wir mildern es ab, indem wir explizite Checkpoint-Identifikatoren pinnen, wo der Provider das unterstützt, und indem wir den Tag, an dem ein Checkpoint angekündigt wird, als Trigger für ein vollständiges Suite-Re-Baseline behandeln. Wir können das zugrundeliegende Problem nicht verhindern.

## Abschluss der Serie

Das ist Beitrag 8 von 8. Der vollständige Bogen:

1. [How to Build an LLM CI/CD Pipeline With Divinci AI](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — die vierstufige Pipeline (Register / Gate / Roll / Observe), in der seither alles gelebt hat.
2. [10 CI/CD Release Failures in Custom Language Models](/de/blog/10-ci-cd-release-failures-in-custom-language-models/) — die benannten Failure-Modes von 2026, jeder gemappt auf die Stufe, die ihn hätte fangen sollen.
3. [12 QA and Release Management Capabilities for LLMs](/de/blog/12-qa-and-release-management-capabilities-for-llms/) — die Capability-Matrix und das Drei-Lager-Venn, das Divinci gegenüber den Alternativen positioniert.
4. [Validating and Releasing Custom LMs in Regulated Fields](/de/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — die Compliance-Tiefenanalyse, das Regulator-zu-Stage-Mapping, die Vindex-Quittungen.
5. [Automated LLM CI/CD Pipelines With Instant Rollback](/de/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — die operative Schicht, das Automatisierungs-Spektrum, die Auto-Rollback-Quittung.
6. [How to Diagnose Custom LLM QA Failures in 7 Steps](/de/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — der diagnostische Entscheidungsbaum; das Modell ist ungefähr in einem von sieben Alarmen die richtige Antwort.
7. [Automated Regression Testing for Custom LLMs in 2026](/de/blog/automated-regression-testing-for-custom-llms-in-2026/) — Slice-bewusste Spearman-Gates, kalibrierte Judges, Closed-Loop-Production-Trace-Replay.
8. **Dieser Beitrag.** Die CI-Infrastruktur, die alles oben Genannte bei jedem PR handhabbar macht.

Die Teile komponieren: Das [Manifest](/de/api/) ist das Audit-Primitiv, die Gates sind die Sicherheitsschicht, der Diagnose-Baum ist die Wiederherstellungsschleife, die [Vindex-Quittung](/de/compliance/) ist der externe Anker, und die Schichttorte ist das, was das Ganze bezahlbar macht, um es bei jedem Commit laufen zu lassen. Wenn Ihr Custom-LLM-Release-Prozess diese fünf nicht gemeinsam hat, ist die Lücke das, worum es in diesen acht Beiträgen ging.

## FAQ

**Was ist der günstigste Test, den ich bei jedem Commit laufen lassen kann?**

Eine Prompt-Template-Render-Prüfung. Sie läuft in Millisekunden, erfordert keinen Judge, fängt einen überraschend großen Anteil an Defekten und kostet nie einen messbaren Cent. Wenn Sie sie noch nicht ausführen, ist sie das CI-Stück mit dem höchsten ROI, das wir empfehlen können.

**Mit welchen Kosten muss ich für eine Custom-LLM-CI-Pipeline rechnen?**

Cents pro typischem PR, niedrige einstellige Dollarbeträge pro Release-Candidate-PR. Die Quote hängt vom Judge-Preis und davon ab, welcher Anteil Ihrer PRs Prompts oder Modellkonfiguration berührt. Der oben genannte 4-%-Anteil an Release Candidates ist typisch; bei Produkten mit häufiger Prompt-Iteration steigt der Anteil und der Durchschnitt klettert entsprechend.

**Soll ich die Full-Suite bei jedem Commit laufen lassen?**

Nein. Pfadfiltern Sie auf PRs, die Prompts, Modellkonfiguration, Retrieval oder Eval-Code berühren. Für alle anderen Änderungen reicht Contract + Smoke, und eine 12-minütige Wartezeit auf einen README-Tippfehler kostet Sie innerhalb eines Sprints das Vertrauen des Teams. Die Full-Suite ist kostbar; geben Sie sie dort aus, wo die Änderung plausibel eine Qualitätsdimension verschieben kann.

**Wie führe ich ein neues Gate ein, ohne alle zu blockieren?**

Zweiwöchiges Shadow-Fenster, nicht-blockierend. Justieren Sie die Schwellenwerte anhand der False-Positive-Rate, die während des Shadows beobachtet wird. Schalten Sie nur dann auf blockierend, wenn die nachhaltige False-Positive-Rate unter Ihrer Toleranz liegt (wir verwenden 5 %). Alles andere ist der Weg zu einem Gate, das alle gelernt haben zu ignorieren.

**Welche einzelne Zahl soll ich verfolgen, wenn ich nur eine verfolge?**

Den Anteil bestätigter Regressionen, die vor der Produktion gefangen werden. Das Histogramm in diesem Beitrag setzt diesen in reifen Divinci-Deployments bei ~97 % an. Die 3 %, die entwischen, sind der Grund, warum Instant-Rollback existiert. Die 97 % sind, wofür die Suite da ist.

## Referenzen

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">„Accelerate State of DevOps — CI-Velocity, Change-Failure-Rate und Time-to-Restore-Service."</a> Die branchenübergreifenden Baselines, die „12 Minuten pro PR ist zu langsam" zu einer vertretbaren Aussage statt einer Meinung machen.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">„Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Die empirische Evidenz dafür, dass gebatchte LLM-as-Judge-Calls die Kalibrierung bei den in der Smoke- und Full-Schicht verwendeten Batch-Größen erhalten können — der Grund, warum die Kostenzahlen in diesem Beitrag erreichbar sind.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">„Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. Die im Abschnitt zur CI-Flottendimensionierung zitierten KV-Cache-Wiederverwendungs- und Prefix-Sharing-Techniken.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">„The Semver Lie: how a minor LLM update broke production."</a> 29. April 2026. Der 2026 benannte Failure-Mode für rein aggregat-basierte Regressions-Suites; der Grund, warum die CI-Schichttorte durchgehend Slice-bewusst ist.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">„GitHub Actions — Verkettung von Jobs mit `needs:` und bedingter Ausführung."</a> Das Primitiv, gegen das die .yaml-Datei in diesem Beitrag komponiert.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">„BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. Die heuristische Semantische-Ähnlichkeits-Metrik, die als Alternative zu LLM-as-Judge für die günstigeren Schichten referenziert wird; nicht das, was wir zur Gate-Zeit ausführen, aber nützlich in der Contract-Schicht für die skalierbare Erkennung verbotener Phrasen.
  </li>
</ol>
