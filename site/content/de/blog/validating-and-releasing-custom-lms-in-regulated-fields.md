+++
title = "Validierung und Freigabe maßgeschneiderter LMs in regulierten Branchen"
description = "EU AI Act, DSGVO Art. 17, HIPAA, NIST AI RMF — Capability für Capability auf eine LLM-Release-Pipeline abgebildet. Wo Open- und Closed-Weights divergieren."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vIndex"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "Compliance in regulierten Branchen für maßgeschneiderte Sprachmodelle teilt sich sauber entlang einer Achse: Open-Weights gegen Closed-API. Für Open-Weights-Backings können Sie eine vIndex-Gewichtsattestierung ausliefern, die die nachprüfbare Löschung gemäß DSGVO Artikel 17 kryptographisch erfüllt. Für Closed-API-Backings deckt derselbe Beleg die Entscheidungskette ab, kann aber keine Gewichts-Provenienz beanspruchen — und der Prüfer erhält genau diese Unterscheidung im Beleg selbst. Dieser Beitrag bildet vier Regulierungsrahmen (EU AI Act, DSGVO, HIPAA, NIST AI RMF) auf die vier Pipeline-Stufen ab, die wir ausliefern, und zeigt das tatsächliche Beleg-Format."
+++

*Notizen aus dem Release-Zyklus — Teil IV*

---

Eine Justiziarin betritt das Engineering-Review. Sie hat eine Frage: *„Wenn morgen ein Löschantrag nach EU AI Act Artikel 17 eingeht, der verlangt, dass wir jede Information entfernen, die unser Modell über einen bestimmten Patienten gelernt hat — können wir nachweisen, dass wir das getan haben?"*

Die ehrliche Antwort, die die meisten Teams geben müssen, lautet: „Wir können das Modell mit Fine-Tuning zum Vergessen bringen. Wir können den Trainingslauf vorzeigen. Aber wir können nicht beweisen, dass die Information strukturell verschwunden ist, weil sie unter dem richtigen adversarialen Prompt wieder auftauchen könnte."

Das ist keine Compliance-Antwort. Das ist eine Nicht-Antwort mit einem prozeduralen Achselzucken.

Dieser Beitrag handelt davon, wie eine echte Compliance-Antwort für maßgeschneiderte LLMs aussieht — über vier Regulierungsrahmen hinweg (**EU AI Act, DSGVO Artikel 17, HIPAA, NIST AI RMF**), abgebildet auf die vierstufige Pipeline ([Register → Gate → Roll → Observe](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)), die wir für Kunden-Releases ausliefern. Die zentrale Spannung, die sich durch die Forderung jedes Regulators zieht, lautet **Open-Weights gegen Closed-API**: Was Sie über ein Gemma-4-Fine-Tune beweisen können, lässt sich nicht über ein Release beweisen, das hinter einer undurchsichtigen Anbieter-API ausgeliefert wird. Das von uns verwendete Beleg-Format sagt das ausdrücklich, Zeile für Zeile. Genau diese Ehrlichkeit macht den Beleg für einen Prüfer brauchbar.

## Die vier Regulatoren und was sie jeweils wirklich wollen

Compliance-Diskussionen verfallen oft in „wir haben Dinge dokumentiert". Diese Rahmung scheitert bei einem Prüfer. Was Prüfer wollen, sind *Belege, die sie überprüfen können, ohne Ihrer Infrastruktur vertrauen zu müssen*. Die vier folgenden Rahmenwerke benutzen alle unterschiedliches Vokabular für dieselbe Grundforderung.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Vier Regulierungsrahmen und die Verifikations-Primitive, die jeder einzelne fordert. Der EU AI Act fordert dokumentierte Logik und menschliche Aufsicht; Verifikations-Primitive ist bit-exakte mechanistische Dokumentation. DSGVO Artikel 17 fordert nachprüfbare Löschung personenbezogener Daten; Verifikations-Primitive ist ein DELETE-Patch auf Gewichtsebene mit SHA-256-Beleg. HIPAA fordert Zugriffsprüfung und Offenlegungs-Tracking; Verifikations-Primitive ist ein signiertes Entscheidungs-Log pro Anfrage. NIST AI RMF fordert Governance, Mapping, Messung und Management; Verifikations-Primitive sind hash-verkettete Belege für jede Release-Entscheidung.">
<title>Vier Regulatoren, eine Verifikationsforderung</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Vier Regulatoren, eine gemeinsame Forderung: verifizieren statt vertrauen</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Jedes Rahmenwerk benennt das Verifikations-Primitive anders, aber die Substanz ist dieselbe: kryptographischer Nachweis, den ein Prüfer überprüfen kann.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Anhang IV verlangt:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• dokumentierte Logik</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• Trainingsdaten-Zusammenfassung</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• menschliche Aufsichtsmaßnahmen</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• Marktüberwachung nach Release</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Verifikations-Primitive:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">bit-exakte mechanistische</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">Dokumentation per vIndex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">Sanktion bei Verstoß:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">bis zu 7 % des</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">globalen Umsatzes</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">DSGVO Art. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Recht auf Löschung verlangt:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• nachprüfbare Datenlöschung</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• nachweisbares Vergessen</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• Nachweis unter adversarialem</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  Prompting</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Verifikations-Primitive:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">DELETE auf Gewichtsebene</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">mit SHA-256-Beleg</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">Sanktion bei Verstoß:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">bis zu 20 Mio. € oder</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">4 % des Umsatzes</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Zugriffskontrollen verlangen:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• Zugriffs-Audit-Trail</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• Offenlegungs-Tracking</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• minimal nötige</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  PHI-Offenlegung</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Verifikations-Primitive:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">signiertes Entscheidungs-Log</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">pro Anfrage</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">Sanktion bei Verstoß:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">bis zu 1,9 Mio. $ /</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">Verstoßart / Jahr</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Vier Kernfunktionen:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• govern</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• map</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• measure</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• manage</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Verifikations-Primitive:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">hash-verketteter Beleg</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">pro Release-Entscheidung</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">Sanktion bei Verstoß:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">freiwilliges Rahmenwerk</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(de facto aber</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">Enterprise-Standard)</text>
</svg>
</figure>

Die Sanktionszahlen sind nicht das, was diese Rahmenwerke interessant macht. Die Sanktionszahlen sind das, was sie tragfähig macht. Das Interessante ist das **Verifikations-Primitive** — wie das Artefakt nach Vorstellung des jeweiligen Rahmenwerks tatsächlich aussehen soll. Drei der vier fordern in unterschiedlichem Vokabular einen Nachweis in kryptographischer Qualität. Das vierte (NIST AI RMF) ist freiwillig, in der Enterprise-Beschaffung aber de facto Pflicht. Sie konvergieren auf dieselbe Form: ein Artefakt, das ein Prüfer überprüfen kann, ohne Ihren Logs vertrauen zu müssen.

## Die Trennlinie: Open-Weights gegen Closed-API

Vor dem stufenweisen Mapping die wichtigste Einschränkung dieses gesamten Beitrags:

**Bei Open-Weights-Modell-Backings** — Gemma, Qwen, Llama, Mistral, GPT-OSS, alles, wo die Gewichte adressierbar und editierbar sind — emittiert jede Divinci-Release-Entscheidung einen vIndex-Beleg, der eine **Gewichtsattestierung** enthält: einen kryptographischen Nachweis, dass die aktiven Gewichte zum Entscheidungszeitpunkt genau die Gewichte sind, die das Manifest registriert hat. Genau das macht die nachprüfbare Löschung nach DSGVO Artikel 17 möglich. Sie wenden einen [DELETE-Patch](/blog/deleting-paris-from-a-language-model/) an, der eine bestimmte Entitäts-Relation aus dem Gewichtsraum entfernt, der Beleg bettet den Hash vor und nach der Operation ein, und ein Prüfer kann die Löschung verifizieren, indem er die Verifikation gegen den öffentlichen vIndex erneut ausführt.

**Bei Closed-API-Modell-Backings** — OpenAI, Anthropic, Google über undurchsichtige APIs — deckt derselbe Beleg die Entscheidungskette ab (welches Manifest, welches Gate-Ergebnis, welche Monitor-Messung, welcher Nutzer hat welche Aktion ausgelöst), **kann aber keine Gewichts-Provenienz beanspruchen**, weil der Anbieter die Gewichte nicht freilegt. Der Beleg vermerkt das ausdrücklich in einem Feld `weight_attestation: null` mit einem `note`-Feld, das die Begründung enthält. Das ist keine verschlechterte Compliance-Position — es ist die Grenze dessen, was verifizierbar ist, ehrlich niedergeschrieben. Ein Prüfer, der den Beleg liest, versteht genau, welche Beweisklasse erbracht wird und welche nicht.

Diese Trennlinie zieht sich durch jede der unten aufgeführten Regulatorenforderungen. Sobald ein Rahmenwerk etwas auf Gewichtsebene verlangt, kann der Open-Weights-Pfad das erfüllen und der Closed-API-Pfad nicht. Wir sagen das im Beleg, statt einen Beweis anzudeuten, den wir nicht liefern können.

## Wie jedes Rahmenwerk auf die vier Pipeline-Stufen abgebildet wird

Die Pipeline hat vier Stufen. Die Forderung jedes Regulators bildet sich auf eine oder mehrere davon ab. Die folgende Matrix ist die tatsächliche Abbildung.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Abbildung von vier Regulierungsrahmen auf die vierstufige Divinci-Release-Pipeline. EU AI Act Anhang IV — dokumentierte Logik und Trainingszusammenfassung auf Stufe 1 Register abgebildet. EU AI Act menschliche Aufsicht und Marktüberwachung auf die Stufen 2 Gate und 4 Observe abgebildet. DSGVO Artikel 17 nachprüfbare Löschung auf Stufe 1 Register via DELETE-Patch und Stufe 4 Observe via Beleg abgebildet. HIPAA Zugriffs-Audit und Offenlegungs-Tracking auf die Stufen 1, 3 und 4 abgebildet. NIST AI RMF govern map measure manage über alle vier Stufen abgebildet. Fünf Zellen der Matrix sind hervorgehoben, um den nur-Open-Weights-Verifikationspfad zu markieren.">
<title>Regulierungsrahmen abgebildet auf die Pipeline-Stufen</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Welche Pipeline-Stufe deckt welche Regulatorenforderung ab</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = volle Abdeckung. ◐ = nur Open-Weights (Gewichtsattestierung erforderlich). Der Closed-API-Pfad deckt die Entscheidungskette ab, kann den Anspruch auf Gewichtsebene aber nicht erheben.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Rahmenwerk / Forderung</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Anhang IV: dokumentierte Logik</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Anhang IV: Trainingsdaten-Zusammenfassung</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Menschliche Aufsichtsmaßnahmen</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Marktüberwachung nach Release</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">DSGVO Artikel 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Nachprüfbare Löschung (DELETE-Patch)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Löschbeleg (hash-verkettet)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Zugriffs-Audit pro Anfrage</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Offenlegungs-Tracking + minimal nötig</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">Govern · Map · Measure · Manage</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

Die beiden ◐-Zellen sind die Einträge unter DSGVO Artikel 17 / nur Open-Weights — das sind die Forderungen, die der Closed-API-Pfad nicht vollständig erfüllen kann. Alles Übrige gilt für beide Backings.

Der Rest des Beitrags geht den Beitrag jeder einzelnen Stufe durch.

## Stufe ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Das Release-Manifest ist die technische Dokumentation nach EU AI Act Anhang IV.</span>
  </div>
</div>

Die Register-Stufe erzeugt ein unveränderliches JSON-Manifest, adressiert per SHA-256. Für regulierte Releases trägt das Manifest alles, was Anhang IV<sup><a href="#ref-1">[1]</a></sup> verlangt, in einem einzigen Artefakt:

- Das Modell-Artefakt (HF-Repo + Commit-SHA, oder eine vIndex-Patch-Referenz)
- Das Prompt-Template (jede Variable, jede System-Message — versionsverwaltet)
- Die Routing-Regeln (welche Traffic-Klasse landet auf welchem Release)
- Die Datensatzversion, mit der die Gate-Schwellenwerte berechnet wurden (Trainingsdaten-Zusammenfassung per Hash)
- Die SHA des vorhergehenden Releases (damit die Audit-Kette ungebrochen ist)
- Der Offenlegungs-Scope — bei HIPAA-Einsätzen die PHI-Kategorien, die das Modell empfangen darf

Das Manifest *ist* die Dokumentation. Ein Prüfer liest keinen Fließtext; er liest den Manifest-Hash und verifiziert das Bundle. Eine sechs Monate später nachgereichte Prosa-Zusammenfassung ist nicht nötig.

**Open-Weights-Bonus.** Wenn das Modell-Artefakt auf ein Open-Weights-Modell verweist, bettet das Manifest zusätzlich den `vindex_sha256` ein — den kryptographischen Fingerabdruck des veröffentlichten [vIndex](/de/compliance/) des Modells. Genau dieser Fingerabdruck ermöglicht es einer dritten Partei, die aktiven Gewichte zu verifizieren, ohne unserer Deployment-Infrastruktur jemals vertrauen zu müssen.

**Closed-API-Vorbehalt.** Wenn das Modell-Artefakt auf ein Closed-API-Modell verweist, ist das Manifestfeld `vindex_sha256` gleich `null`, und die `weight_attestation_class` des Manifests lautet `decision_chain_only`. Der Prüfer, der das liest, weiß genau, was beansprucht wird und was nicht.

## Stufe ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Slice-spezifische Qualitäts-Gates tragen die EU-AI-Act-Anforderung an menschliche Aufsicht.</span>
  </div>
</div>

In der Gate-Stufe wird die Anforderung des EU AI Act zu „menschlichen Aufsichtsmaßnahmen"<sup><a href="#ref-1">[1]</a></sup> operationalisiert. Ein Regulator, der den EU AI Act liest und daraus „wir brauchen einen menschlichen Freigabe-Workflow" ableitet, hat den Punkt verfehlt — die schwierigere Frage lautet *wogegen der Mensch eigentlich freigibt*. Die Gate-Stufe beantwortet das mit einer Slice-spezifischen Spearman-ρ gegen einen menschlich verankerten Grader<sup><a href="#ref-3">[3]</a></sup>. Jeder Slice, der in Ihrer regulatorischen Lage zählt (pädiatrische Onkologie, IP-Lizenzierung, belgisches Französisch), bekommt seinen eigenen Schwellenwert. Der Override-Pfad verlangt eine schriftliche Begründung, die in den Audit-Trail eingeht.

Bei HIPAA-pflichtigen Einsätzen wohnt hier auch die „minimal nötige" Offenlegungsregel. Die Scored-QA-Suite des Gates enthält negative Tests für PHI-Überexposition — Antworten, die persönliche Identifikatoren enthalten, obwohl danach nicht gefragt wurde. Ein Release, das auf dem Überexpositions-Slice regrediert, fällt durch das Gate, unabhängig davon, wie seine anderen Slices abschneiden.

Für NIST AI RMF deckt die Gate-Stufe die „Measure"-Funktion ab — die slice-spezifische numerische Evidenz, dass das System innerhalb konfigurierter Toleranzen arbeitet.

## Stufe ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary-Checkpoints werden zum Artefakt der Marktüberwachung nach Release.</span>
  </div>
</div>

Die Marktüberwachung nach Release gemäß EU AI Act<sup><a href="#ref-1">[1]</a></sup> verlangt vom Betreiber, *fortlaufende* — und nicht nur vor-launch — Beobachtung des Verhaltens des KI-Systems unter realen Bedingungen nachzuweisen. Ein 5 % → 25 % → 100 %-Canary mit Qualitäts-Monitor-Checkpoints ist die natürlichste Form, das zu erfüllen. Die Verweildauer an jedem Checkpoint zuzüglich der Monitor-Messwerte während der Verweildauer ist genau das, was ein Prüfer sehen will.

Für HIPAA ist die Canary-Stufe auch der Ort, an dem das Audit-Logging pro Anfrage durchgehend geübt wird. Jeder Checkpoint produziert eine Stichprobe signierter Request-Response-Belege; falls einer davon eine fehlkonfigurierte PHI-Behandlung aufweist, fällt das bei 5 % Traffic auf statt erst bei 100 %.

## Stufe ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Der kontinuierliche Monitor und das Beleg-Format machen DSGVO Artikel 17 nachprüfbar.</span>
  </div>
</div>

Das ist die Stufe, die die Compliance-Geschichte einlöst. Die Observe-Stufe lässt fortlaufend Trace-Replay durch das aktive Release laufen, bewertet vom selben menschlich verankerten Judge aus dem Gate, mit einem Qualitäts-Monitor, der bei einer Schwellenwertverletzung einen automatischen Rollback auslöst.

Jede Release-Entscheidung — Register, Gate-Pass, Gate-Fail, Gate-Override, Checkpoint-Promote, Checkpoint-Hold, Auto-Rollback, manueller Rollback **und jede Anwendung eines DELETE-Patches nach DSGVO Artikel 17** — emittiert einen vIndex-Beleg. Hash-verkettet mit dem vorhergehenden Beleg für diesen Kunden und dem vorhergehenden Beleg für dieses Release.

So ist ein Beleg für einen DELETE-Patch nach DSGVO Artikel 17 aufgebaut — ein durchgearbeitetes Beispiel mit Platzhalter-Kennungen und -Werten, im auf der [Compliance-Seite](/de/compliance/) dokumentierten Format:

```json
{
  "name": "gdpr-art17-patient-12348-removal",
  "version": 1,
  "base_model": "google/gemma-4-E2B-it",
  "manifest_sha256": "9abaeaf6c91f8b...",
  "previous_manifest_sha256": "8f72b1de4a93c5...",
  "created_at": "2026-05-29T03:17:42Z",
  "user_id": "compliance-officer-7c4e1a",
  "operation": {
    "op": "delete",
    "entity": "patient-record-12348",
    "relation": "diagnosis-association",
    "target": "weight-feature-11179-layer-27",
    "weight": -1.0
  },
  "verification": {
    "before_feature_11179_score": 17.34,
    "before_feature_11179_rank": 1,
    "after_feature_11179_score": null,
    "after_feature_11179_rank": "ABSENT_FROM_TOP_25",
    "perplexity_delta_wikitext103": "+0.02%",
    "vindex_sha256_before": "abc12...",
    "vindex_sha256_after":  "def34..."
  },
  "weight_attestation_class": "full",
  "chain_signature": "sha256(manifest || prev_manifest || user_id || created_at || prev_chain_signature)"
}
```

Ein Beleg in diesem Format ist verifizierbar. Ein Prüfer muss unseren Logs nicht vertrauen. Er nimmt den `vindex_sha256_after`, lädt den entsprechenden veröffentlichten vIndex von `huggingface.co/Divinci-AI` und verifiziert, dass Feature 11179 in Layer 27 strukturell nicht mehr unter den Top-25 erscheint. Er nimmt die `chain_signature` und verifiziert sie gegen den vorhergehenden Beleg. Die gesamte Kette wird extern verankert, nach einem vom Kunden konfigurierten Zeitplan.

**Dieselbe Operation gegen ein Closed-API-Modell.** Die Beleg-Felder oben ändern sich in drei Punkten: `operation.target` wird zu `provider_api_endpoint`, `verification` wird zu einem anderen Schema, das nur Belege der Entscheidungskette enthält, und `weight_attestation_class` wird zu `decision_chain_only`. Der Closed-API-Modellanbieter hat die Gewichte nicht freigelegt, also sagt der Beleg genau das. Ein Prüfer, der einen Nachweis auf Gewichtsebene will, weiß nun, dass er das beim Anbieter eskalieren muss, nicht bei uns.

Das ist die Differenzierung, die im Jahr 2026 sonst niemand ausliefert. Das Eval-CI-Lager (Braintrust, Humanloop, Patronus) sitzt nicht auf dem Traffic und emittiert keine Entscheidungsbelege. Das Serving-Canary-Lager (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) emittiert Infra-Metrik-Logs, aber keine hash-verketteten Compliance-Belege. Das Observability-Lager (Arize, Phoenix, Confident, Deepchecks) beobachtet Output, erzwingt aber nichts.

## Was prüft ein Auditor tatsächlich?

Eine nützliche Übung: die Fragen durchgehen, die ein echter Prüfer stellen wird, und welches Artefakt jeweils antwortet.

| Frage des Prüfers | Antwortendes Artefakt |
|---|---|
| *„Welche Modellversion lief am 15. März um 14:22 UTC?"* | Der Observe-Stufen-Beleg zu diesem Zeitstempel, signiert und hash-verkettet. |
| *„Welche Evaluation hat dieses Release vor dem Promote bestanden?"* | Der Gate-Stufen-Beleg mit der Slice-spezifischen Spearman-ρ-Tabelle und der Dataset-SHA, gegen die das Gate gelaufen ist. |
| *„Wurde ein DSGVO-Artikel-17-Löschantrag für Patient X tatsächlich umgesetzt?"* | Der DELETE-Patch-Beleg oben. Der Prüfer verifiziert `vindex_sha256_after` gegen den veröffentlichten vIndex. |
| *„Wer hat dieses Release freigegeben? Was war seine erklärte Begründung dafür, das Gate des IP-Lizenz-Slices zu überstimmen?"* | Der `override`-Block des Gate-Stufen-Belegs inklusive Nutzer-ID und der verpflichtenden Freitext-Begründung. |
| *„Wie schnell hat der Rollback gefeuert, und welche Monitor-Messung hat ihn ausgelöst?"* | Der Rollback-Beleg der Observe-Stufe mit den drei aufeinanderfolgenden Sub-Schwellenwert-Qualitätsmessungen und der Rollback-Laufzeit. |
| *„Zeigen Sie mir die Belege der Marktüberwachung der letzten 90 Tage."* | Die Beleg-Kette der Observe-Stufe. Extern verankert nach dem kundenseitig konfigurierten Zeitplan. |

Was der Prüfer *nicht tun muss*: unserem Datadog vertrauen. Unserem CloudWatch vertrauen. Einem Screenshot vertrauen. Einem Export vertrauen. Genau der Sinn des Beleg-Formats ist, dass der Prüfer es unabhängig verifizieren kann.

## Was das nicht löst

Drei ehrliche Einschränkungen:

**Closed-API-Regressionen im Gebiet von DSGVO Artikel 17 sind auf Plattformebene nicht lösbar.** Wenn Sie einen Healthcare-Assistenten hinter einem Closed-API-Modell ausliefern und ein Patient sich auf Artikel 17 beruft, kann die Plattform attestieren, dass der Datensatz des Patienten aus Ihrem Retrieval-Store, Ihrem Prompt-Template und Ihren Routing-Regeln entfernt wurde — sie kann aber nicht attestieren, dass die zugrundeliegenden Modellgewichte die Daten des Patienten vergessen haben. Sie brauchen entweder ein Open-Weights-Backing oder eine Zusage des Anbieters zur Löschung auf Gewichtsebene. Wir sagen das im Beleg.

**Dokumentation ist notwendig, aber nicht hinreichend.** Ein Beleg, der nachweist, dass ein Modell einen Schwellenwert erreicht hat, beweist nicht, dass der Schwellenwert der richtige Schwellenwert war. Wenn Ihre Scored-QA-Suite den Slice nicht abdeckt, der für einen Patienten in Ihrem Service tatsächlich relevant ist, repariert keine noch so lange Beleg-Kette das. Regulatoren begreifen das zunehmend; „wir haben unsere Eval bestanden" ist keine ausreichende Compliance-Antwort mehr, wenn die Eval die falsche Eval war.

**Das vIndex-Format ist Single-Vendor.** Wir verwenden es, weil es das konkreteste kryptographische Primitive ist, das heute für Gewichts-Nachweise verfügbar ist. Sollte die Branche sich auf ein anderes Format einigen — Model-Cards-mit-Hashes, NIST-veröffentlichte Artefakt-Schemata — sollte sich das Beleg-Format dahin entwickeln. Tragend ist die Substanz (hash-verkettet, extern verifizierbar, gewichts-attestierungsbewusst), nicht der spezifische Schema-Name. Wir erwarten, dass sich das ändert, sobald die regulatorische und Standardisierungslandschaft reift.

## FAQ

### Was bedeutet nachprüfbare Löschung nach DSGVO Artikel 17 für KI-Systeme?

Nachprüfbare Löschung bedeutet, dass eine dritte Partei verifizieren kann, dass die Daten entfernt wurden, ohne Ihren Logs vertrauen zu müssen. Ein Modell durch Fine-Tuning zum „Vergessen" spezifischer Informationen zu bringen, erfüllt diesen Standard nicht — die Informationen können unter adversarialem Prompting wieder auftauchen, und es existiert kein kryptographisches Primitive, das ein Prüfer überprüfen könnte. Ein DELETE-Patch auf Gewichtsebene mit einem veröffentlichten Vorher-/Nachher-vIndex-Hash *erfüllt* den Standard, weil der Prüfer die Verifikation gegen das öffentliche Artefakt erneut ausführen kann.

### Warum können Closed-API-Modelle DSGVO Artikel 17 nicht auf dieselbe Weise erfüllen?

Weil der Anbieter die Gewichte nicht freilegt. Ohne Zugang zu den Gewichten kann keine dritte Partei — einschließlich des Kunden, der die API nutzt — eine Löschung auf Gewichtsebene anstoßen oder verifizieren. Der Teil des Belegs, der die Entscheidungskette betrifft (welches Prompt-Template verwendet wurde, aus welchem Retrieval-Store die Daten stammten, welche Routing-Regeln aktiv waren), bleibt verifizierbar, der Anspruch auf Gewichtsebene jedoch nicht. Das ist eine Grenze dessen, was verifizierbar ist, wenn Gewichte privat sind, keine Grenze des Compliance-Rahmens.

### Was verlangt Anhang IV des EU AI Act in einfachen Worten?

Anhang IV fordert technische Dokumentation, die die Logik des Systems, eine Trainingsdaten-Zusammenfassung, den vorgesehenen Einsatz, menschliche Aufsichtsmaßnahmen und die Marktüberwachung nach Release abdeckt. Die Falle, in die die meisten Teams tappen, ist, das als fünf separate Dokumente zu behandeln. Das Release-Manifest in Stufe 1 trägt die ersten drei Forderungen als einen einzigen Hash; die Gate-Stufe deckt die vierte ab; die Stufen Roll + Observe decken die fünfte ab. Eine Pipeline; vier Forderungen als Nebenprodukt des Normalbetriebs erfüllt.

### Wie schnell sollte ein Rollback für HIPAA-pflichtige Einsätze sein?

HIPAA spezifiziert keine Rollback-Zeit, aber die Leitlinien der HHS zur Reaktion auf Datenschutzverletzungen behandeln Time-to-Containment als tragend. Ein Rollback in der Größenordnung von Sekunden (Drain in-flight auf einem manifest-getriebenen Flip — unsere Zahl liegt bei rund 12 Sekunden) ist strukturell schneller als ein typisches Infra-Metrik-Blue-Green, das von Alarm-Propagation abhängt. Vergleichen Sie das mit öffentlichen Post-Mortems: Der Cloudflare-Vorfall vom Juni 2022<sup><a href="#ref-4">[4]</a></sup> brauchte 44 Minuten zum Revert, weil Engineers die Reverts der Kollegen überschrieben.

### Wie bildet sich NIST AI RMF auf eine Release-Pipeline ab?

Die vier Kernfunktionen von NIST AI RMF — Govern, Map, Measure, Manage — spannen den gesamten Release-Lifecycle auf, nicht nur eine einzelne Stufe. Govern ist die dokumentierte Release-Policy plus der Workflow zur Begründung von Gate-Overrides (Stufen Register + Gate). Map ist die slice-spezifische Scored-QA-Suite (Gate). Measure sind die slice-spezifischen Spearman-Schwellenwerte und der kontinuierliche Qualitäts-Monitor (Gate + Observe). Manage ist der Rollback-Pfad und die Beleg-Kette (Observe). Alle vier sind abgedeckt, sobald die Pipeline ihre vollständige Beleg-Sammlung emittiert.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Anhang IV definiert die Anforderungen an die technische Dokumentation für Hochrisiko-KI-Systeme: Systemlogik, Trainingsdaten-Zusammenfassung, menschliche Aufsichtsmaßnahmen, Marktüberwachung nach Release. Sanktionen von bis zu 7 % des globalen Umsatzes bei Verstoß.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> 600, max <code>MaximumExecutionTimeoutInSeconds</code> 1800. Zitiert als der branchenübliche Infra-Metrik-Canary, gegen den der Qualitäts-Monitor von Stufe 4 abgegrenzt wird.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrated LLM-as-judge agreement.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80 % Gesamtübereinstimmung GPT-4 gegen Mensch, mit kategorie-spezifischer Varianz von Coding (86 %) bis Writing (36–44 %). Anker für die slice-spezifische Spearman-Kalibrierung, die die Gate-Stufe antreibt.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 Minuten von „wir wissen, was wir reverten müssen" bis zum abgeschlossenen Revert, weil Engineers die Reverts der Kollegen überschrieben. Anker für die Behauptung, dass „ein manifest-getriebener Rollback diesen Fehlermodus nicht haben kann".
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Voluntary framework — Govern, Map, Measure, Manage — that has become the de facto enterprise procurement baseline for AI governance. Voluntary but enforced in practice through customer due-diligence questionnaires.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Minimum-necessary disclosure, access audit, and breach response timing requirements applicable to any AI system that touches PHI. Civil monetary penalties up to $1.9M per violation-type per year per <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">CMP inflation adjustment, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Article 17 (Right to Erasure).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. The data subject's right to obtain erasure of personal data, and the controller's obligation to demonstrate compliance under Article 5(2) accountability. Penalties up to €20M or 4% of annual global turnover.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — vIndex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/de/compliance/">compliance page</a> and demonstrated in the <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*Als Nächstes in dieser Reihe:* **Automatisierte LLM-CI/CD-Pipelines mit sofortigem Rollback.** Dieser Beitrag hat gezeigt, was ein Prüfer will. Der nächste zeigt das operationelle Muster, das dafür sorgt, dass der Beleg in Sekunden statt Wochen auf dem Schreibtisch des Prüfers landet — die Automatisierung unter der vierstufigen Pipeline, mit Fokus darauf, was sich ändert, wenn der Rollback von selbst feuert.
