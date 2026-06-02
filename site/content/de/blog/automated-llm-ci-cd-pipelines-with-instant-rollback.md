+++
title = "Automatisierte LLM-CI/CD-Pipelines mit sofortigem Rollback"
description = "Die operative Ebene der vierstufigen Release-Pipeline: welche Entscheidungen automatisch laufen, wie eine echte Rollback-Übung aussieht, und die MTTR-Zahl."
date = 2026-05-30T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "CI/CD", "Automation", "Rollback", "MTTR", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-llm-ci-cd-pipelines-with-instant-rollback-veo31.webm"
hero_video_poster = "/images/automated-llm-ci-cd-pipelines-with-instant-rollback-hero-poster.webp"
reading_time = 11
summary = "Zwischen menschlichen Freigabe-Gates läuft eine LLM-Release-Pipeline entweder von selbst oder eben nicht. Dieser Beitrag ist die operative Ergänzung zum Architektur-Post – er zeichnet das Automatisierungsspektrum (welche Entscheidungen automatisch fallen, welche einen Menschen erfordern und welche wir hart blockieren, bis jemand das Override unterschreibt), zeigt, wie eine echte Rollback-Übung aussieht, und endet mit der MTTR-Zahl, die am Ende herauskommt."
+++

*Notizen aus dem Release-Zyklus — Teil V*

---

Die meistzitierte Seite, die letztes Quartal nicht ausgeliefert wurde, war die, bei der unser Observer um 2:14 Uhr morgens von selbst auslöste. Das Kandidaten-Release hatte das Gate passiert, vier Minuten lang bei 5 % verweilt, war auf 25 % vorgerückt und blieb dann stehen. Der Minuten-Qualitätsmonitor erkannte drei aufeinanderfolgende Messungen unterhalb des Schwellenwerts auf dem Slice „Recht“, stoppte das Rollout und leitete den Routing-Pointer auf das vorherige Release zurück. Bis die Benachrichtigung für den Bereitschaftsingenieur eintraf – für die Quittung, nicht für einen Ausfall – war der Produktionsverkehr bereits seit neun Minuten wieder auf dem als gesund bekannten Release.

Niemand musste irgendetwas tun. Die Architektur aus [dem ersten Beitrag dieser Reihe](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) beschreibt, was die vier Stufen sind. In diesem Beitrag geht es darum, was zwischen den menschlichen Freigaben läuft – die Automatisierungsschicht unter der Architektur, die Grenze, an der die Pipeline entweder von selbst das Richtige tut oder eben nicht.

Die Kernaussage: **Die meisten Pipeline-Entscheidungen sollten automatisiert sein, aber nicht alle.** Die Grenze ist entscheidend. Die Pipeline, die alles automatisiert, wird irgendwann ein Release befördern, das ein Mensch hätte abfangen müssen; die Pipeline, die nichts automatisiert, hat keinen Zweck. Diese Grenze richtig zu ziehen, ist das Thema dieses Beitrags.

## Das Automatisierungsspektrum

Jede Pipeline-Entscheidung sitzt irgendwo auf einem Spektrum von *„löst von selbst aus, ohne menschliche Benachrichtigung"* bis *„weigert sich, ohne ausdrückliche unterzeichnete Freigabe weiterzulaufen."* Unten ist abgebildet, wo jede der tragenden Pipeline-Aktionen in unserer ausgelieferten Pipeline auf diesem Spektrum sitzt.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Das Automatisierungsspektrum. Von vollständig automatisiert auf der linken Seite bis immer menschliche Freigabe erforderlich auf der rechten Seite. Eingetragene Entscheidungen: am vollautomatischen Ende die Minuten-Qualitätsbewertung des Observers, der Gesundheitscheck am Canary-Checkpoint und der Auto-Rollback-Trigger; in der Mitte der Gate-Pass-Übergang und die Beförderung am Canary-Checkpoint; in Richtung Mensch die Produktions-Deployment-Registrierung und der Manifest-Commit; am Stets-Mensch-Ende die Gate-Fail-Override-Entscheidung und das Shadow-Deployment für Cold-Start-Releases.">
<title>Das Automatisierungsspektrum</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Das Automatisierungsspektrum</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Wo jede tragende Pipeline-Entscheidung sitzt, von vollständig autonom (links) bis stets menschlich (rechts).</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">VOLLAUTOMATISCH</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">löst von selbst aus,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">keine Benachrichtigung</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">NUR-BENACHRICHTIGUNG</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">läuft automatisch;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">Quittung + Page</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">WEITER-WENN-OK</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">Mensch kann in einem</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">Zeitfenster vetieren</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">MENSCH-GESTARTET</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">erfordert explizite</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">Nutzer-Aktion</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">STETS-MENSCH</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">verweigert ohne</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">unterzeichnete Begründung</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Observer Minuten-</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Qualitätsbewertung</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">läuft fortlaufend</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">auf 5%-Trace-Sample</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Canary-Checkpoint</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Gesundheitscheck</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + Output-</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">qualität bei 5/25/100</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Auto-Rollback-</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Trigger</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 aufeinanderfolgende Min.</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">unter Schwellenwert</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Gate-Pass-Übergang</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">zum Canary</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">alle Slices ≥ Schwelle</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ Auto-Start bei 5%</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Checkpoint</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">rückt vor, wenn Monitore</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">während Dwell halten</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Release-</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Registrierung</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">Kunde committet</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">ein neues Manifest</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Gate-Fail-Override</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">erfordert schriftliche</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">Begründung im Audit-Log</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">Rote Markierungen</tspan> = die zwei Entscheidungen, bei denen das Pipeline-Verhalten asymmetrisch ist: Auto-Rollback löst von selbst aus und Sie können sich nicht abmelden; Gate-Fail-Override verweigert das Weiterlaufen und Sie dürfen die Begründung nicht überspringen.</text>
</svg>
</figure>

Zwei der oben markierten Punkte sind rot statt in der Farbe ihrer Zone gehalten. Das sind die asymmetrischen Entscheidungen – die zwei Stellen, an denen die Pipeline eine klare Haltung dazu einnimmt, wer worüber entscheidet. Der **Auto-Rollback-Trigger** löst aus, ohne zu fragen; man kann ihn nicht abschalten, denn der ganze Sinn besteht darin, dass er um 2:14 Uhr morgens funktioniert. Der **Gate-Fail-Override** weigert sich, ohne schriftliche Begründung weiterzulaufen; auch das kann man nicht abschalten, denn der ganze Sinn besteht darin, dass das zukünftige Ich den Grund nachlesen können muss. Der Rest der Pipeline ist größtenteils konfigurierbar; diese zwei nicht.

## Wie Auto-Rollback tatsächlich auslöst

Die häufigste Frage zu Auto-Rollback lautet *„Was hindert es daran, aus dem falschen Grund auszulösen?"* Die ehrliche Antwort ist: nichts allein. Der Schutz ergibt sich daraus, wie der Trigger verdrahtet ist.

Die Observe-Stufe führt eine minütliche Bewertungsschleife aus. Jede Minute werden:

1. Eine kleine Menge aktueller Produktions-Traces des aktiven Release gesampelt.
2. Jeder Trace durch das *aktive Modell* erneut abgespielt (nicht durch den Kandidaten – wir bewerten, was tatsächlich ausgeliefert wird).
3. Jedes Replay mit dem gleichen kalibrierten, am Menschen verankerten Judge bewertet, der Gate-2 angetrieben hat<sup><a href="#ref-1">[1]</a></sup>.
4. Ein einziger Output-Qualitätsscore über das Sample berechnet. Geschrieben nach `CanaryHealthSample`.

Das Rollback löst aus, wenn **drei aufeinanderfolgende Minuten-Samples** unter den Rollback-Schwellenwert fallen (Standard: 0,85 der Gate-Schwelle – also 0,55, wenn das Gate bei 0,65 lag). Nicht eine schlechte Minute; drei. Der Drei-Minuten-Lockout ist der Rauschfilter – eine einzelne anomale Messung löst nichts aus, aber eine anhaltende Regression schon.

Wenn der Lockout bricht, führt der Rollback-Worker aus:

```bash
# In der Praxis — die Pipeline führt das von selbst aus. Keine menschliche Bestätigung.
POST /api/v1/releases/<previous_release_sha>/activate
# Antwort in <1s; In-Flight-Drain in ~12s bei einem ~100-Replica-Service
```

Eine Quittung wird ausgelöst. Der Bereitschaftsingenieur sieht eine Slack-Benachrichtigung *für die Quittung*, nicht für einen Ausfall. Sie öffnen die Quittung; sie sehen die drei Messungen unterhalb des Schwellenwerts, die verstrichene Zeit und die Hashes `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup>. Zwölf Sekunden sind die In-Flight-Drain-Zeit; der eigentliche Swap dauert unter einer Sekunde. Wenn der Ingenieur wach genug ist, um zu fragen „muss ich etwas tun?", lautet die Antwort „nein, aber Sie sollten trotzdem nachschauen, warum das Gate das durchgelassen hat."

## Die echte Auto-Rollback-Quittung

So sieht die Quittung in der Produktion aus. Gleiches Hash-verkettetes Format, das auf der [Compliance-Seite](/de/compliance/) dokumentiert ist, mit zusätzlichen Feldern speziell für ein Auto-Rollback-Ereignis:

```json
{
  "kind": "auto_rollback",
  "release_id": "rel_a01c66",
  "previous_release_id": "rel_8f72b1",
  "trigger_at": "2026-05-29T02:14:23Z",
  "completed_at": "2026-05-29T02:14:35Z",
  "elapsed_seconds": 12,
  "trigger_reason": "observer_quality_threshold_breach",
  "observer_readings": [
    { "minute_at": "2026-05-29T02:11:00Z", "quality_score": 0.523, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:12:00Z", "quality_score": 0.508, "below_threshold": true,  "slice": "legal-IP-licensing" },
    { "minute_at": "2026-05-29T02:13:00Z", "quality_score": 0.491, "below_threshold": true,  "slice": "legal-IP-licensing" }
  ],
  "rollback_threshold": 0.55,
  "active_manifest_sha256_before": "9abaeaf6c91f8b...",
  "active_manifest_sha256_after":  "8f72b1de4a93c5...",
  "audit_chain_signature": "sha256(...)",
  "notified_users": ["oncall@customer.example"],
  "notification_sent_at": "2026-05-29T02:14:36Z"
}
```

Die Quittung selbst ist der erste Berührungspunkt für die Bereitschaft. Sie zu lesen, beantwortet die Fragen, die ein halb wacher Ingenieur tatsächlich stellen würde: Was hat sie ausgelöst, welcher Slice ist gescheitert, um wie viel, wie lange hat der Swap gedauert, was läuft jetzt. Die Folgeaktion lautet von dort aus meist *„schau nach, warum das Gate das überhaupt durchgelassen hat"* – wofür die Quittung des fehlgeschlagenen Release bereits die Per-Slice-Spearman-Tabelle enthält.

## Was die Pipeline NICHT von selbst tut

Das Gegenstück zu „Auto-Rollback löst ohne Nachfrage aus" ist, dass manches aktiv nicht passieren kann. Drei ausdrückliche Verweigerungen.

**Sie befördert kein Release, das das Gate nicht bestanden hat, ohne signiertes Override.** Ein Gate-Fail markiert das Release als `gate_fail`; der `/activate`-Endpunkt weigert sich, die Manifest-SHA anzunehmen; keine Kommandozeilen-Beschwörung umgeht das. Der einzige Weg vorwärts ist ein erzwungenes Override mit `forceGateOverride: true` UND `overrideReason: "<Freitext>"`. Das Begründungsfeld ist Pflicht, Freitext und wandert ins Audit-Log neben die Benutzer-ID. Wir haben das so entworfen, dass das zukünftige Ich nachlesen kann, warum das gegenwärtige Ich die Slice-Regression für akzeptabel hielt. Drei Personen haben den Override-Pfad bisher in der Praxis benutzt. Ihre Begründungen stehen noch im Audit-Log.

**Sie rückt nicht vom Canary auf 100 % vor, wenn irgendein Monitor sich verschlechtert.** Wenn p95-Latenz, 5xx-Rate ODER Output-Qualitätsscore am Ende einer Checkpoint-Dwell außerhalb ihres Bandes liegt, hält die Pipeline an diesem Checkpoint an und löst einen Page aus. Sie rückt nicht vor und entschuldigt sich später.

**Sie führt keinen Auto-Canary für ein Cold-Start-Release durch.** Ein Release ohne Historie an Produktionsverkehr – zum Beispiel ein frischer Fine-Tune gegen einen brandneuen Datensatz – hat nichts, womit es seine Output-Qualität vergleichen könnte. Die Pipeline weigert sich, einen Canary auf einem Cold-Start-Release zu starten. Wir verlangen zuerst ein 24-stündiges Shadow-Deployment, das den Kandidaten gegen echte Produktions-Traces beobachtet, aber keine seiner Antworten ausliefert. Nach 24 Stunden haben wir eine Qualitäts-Baseline; dann kann der Canary starten. Langsamer; ehrlich; nicht konfigurierbar.

## Wie schnell ist die Wiederherstellung, end-to-end?

Die Wiederherstellungszeit, die wir veröffentlichen, beträgt **12 Sekunden.** Das ist In-Flight-Drain bei einem ~100-Replica-Service. Der Manifest-Swap selbst dauert unter einer Sekunde. Damit das für Lesende nützlich ist, müssen die 12 Sekunden aufgeschlüsselt werden:

- **0–60 Sekunden vor Rollback:** Die drei aufeinanderfolgenden Messungen unter Schwellenwert treffen ein. Die erste Messung unter Schwellenwert startet den Lockout-Timer. Jede weitere Minute verlängert den Lockout, wenn die Qualität weiterhin unter Schwellenwert liegt.
- **t = 0:** Die dritte Messung unter Schwellenwert schreibt nach `CanaryHealthSample`. Der Rollback-Worker beobachtet den dritten Strike und schickt `/activate previous_release` los.
- **t < 1 Sekunde:** Der aktive-Release-Pointer der Routing-Schicht (in Redis) kippt. Neue Anfragen treffen das vorherige Release.
- **t = 1 bis ~12 Sekunden:** Das Kandidaten-Release bedient weiterhin alle Anfragen, die zum Zeitpunkt des Swap in Flight waren. In-Flight-Drain. Manche Streaming-Antworten brauchen 8–10 Sekunden, um natürlich abzuschließen, sodass der Aufräum-Schwanz bei einem typischen Service rund 12 s beträgt.
- **t ≈ 13 Sekunden:** Die Audit-Log-Quittung wird geschrieben und signiert. Die Benachrichtigung wird ausgelöst.

Verglichen mit den öffentlichen Postmortems, die wir gerne als Anker zitieren: Der Cloudflare-Ausfall vom Juni 2022<sup><a href="#ref-3">[3]</a></sup> brauchte 44 Minuten von „wir wissen, was wir zurücknehmen müssen" bis „das Zurücknehmen ist abgeschlossen" – und das war die *Infrastruktur*-Ebene. Der Atlassian-Ausfall vom April 2022<sup><a href="#ref-4">[4]</a></sup> brauchte 12 Stunden pro Site, weil der Zustand auf mehrere Systeme verteilt war. Die DORA<sup><a href="#ref-5">[5]</a></sup>-Schwelle für „Elite Performer" zur Wiederherstellung nach fehlgeschlagenem Deployment liegt unter einer Stunde. Zwölf Sekunden sind nicht eine Größenordnung besser als die Elite-Schwelle – sie sind drei Größenordnungen besser. Die architektonische Entscheidung, die das möglich macht, ist das gebündelte Release-Manifest aus [Stufe 1](/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register). Ohne das Manifest hat man kein einzelnes Objekt, auf das man das Routing umlenken kann.

## Rollback-Übungen — die unsexy Praxis, die niemand durchführt

Hier ist der Teil, den die meisten Teams überspringen: **Das einzig verlässliche Signal, dass Ihr Rollback-Pfad funktioniert, ist, dass Sie eine bewusste, geplante Übung durchgeführt und das Ergebnis bestätigt haben.** Wir führen jedes Quartal eine durch. Die Übung läuft so:

1. Wähle eine zufällig geplante Uhrzeit innerhalb der Werktag-Geschäftszeiten. Sage dem Team, dass es kommt, aber nicht die genaue Stunde.
2. Injiziere eine synthetische Qualitätsregression auf dem Canary-Slice. (Wir haben ein Test-Mode-Flag, mit dem das Kandidatenmodell auf einen magischen Header mit „Ich verweigere die Antwort" reagiert – garantiert ein Fehlschlag beim kalibrierten Judge.)
3. Schiebe das Test-Release durch das Gate (es besteht – wir testen das Rollback, nicht das Gate). Starte einen Canary.
4. Der Observer bemerkt drei Messungen unter Schwellenwert. Auto-Rollback löst aus.
5. Warte auf die Reaktion des Bereitschaftsingenieurs. Stoppe die Zeit. Notiere, ob sie der Quittung genug vertrauen, um *nicht* alarmiert zurückzurufen.
6. Verifiziere, dass das Audit-Log das Test-Mode-Flag in der Rollback-Quittung zeigt, damit zukünftige Audits eine Übung von einem echten Vorfall unterscheiden können.

Die erste Übung, die wir durchführten, brauchte 19 Sekunden end-to-end (12 s Swap + 7 s Settling-Delay, die wir beheben mussten). Die jüngste Übung – Q1 2026 – brauchte 12 Sekunden. Die Übung darf nie übersprungen werden. Jedes Quartal; jeder Kundencluster.

Die meisten Teams haben noch nie eine bewusste Rollback-Übung durchgeführt. Das erste Mal, dass ihr Rollback-Pfad läuft, ist während eines echten Vorfalls, unter Druck, mit mehreren Personen im Call. Die Übung ist das, was aus der 12-Sekunden-Zahl eine echte Zahl macht, statt einer angestrebten.

## Was das nicht löst

Drei ehrliche Einschränkungen:

**Auto-Rollback kann Ping-Pong spielen.** Wenn sowohl der Kandidat ALS AUCH das vorherige Release schlecht sind – sagen wir, das vorherige Release hatte ebenfalls eine sich langsam entwickelnde Slice-Regression, die niemand bemerkt hat – kann die Pipeline ein Rollback machen, dann scheitert auch das vorherige Release am Post-Rollback-Observer, und es gibt kein drittes Release mehr, auf das man zurückrollen könnte. Die Pipeline hält den Verkehr auf einer Wartungsseite an, statt zu thrashen. Die Lösung ist, mehr als ein einzelnes vorheriges gesundes Release in der Manifest-Kette indiziert zu halten, damit das Rollback-Ziel konfigurierbar ist.

**Der Observer erzeugt Inferenzkosten.** Das Replay von Produktions-Traces durch das aktive Modell auf einem 5 %-Sample erhöht die Inferenzausgaben um etwa 5 %. Wir halten das für den richtigen Kompromiss. Manche Kunden finden es bei margenschwachen Workloads zu teuer und wollen die Sample-Rate herunterdrehen. Der Regler existiert.

**Ein schlechter Judge ist schlimmer als kein Judge.** Wenn der kalibrierte Judge, der den Observer antreibt, selbst miskalibriert ist – vom menschlichen Anker abgedriftet oder auf einem veralteten Korpus trainiert – kann der Observer Auto-Rollback aus dem falschen Grund auslösen. Die Rekalibrierungs-Kadenz ist entscheidend. Der Beitrag „Calibrating-the-Judge"<sup><a href="#ref-6">[6]</a></sup> dokumentiert das Verfahren; die operative Anforderung ist, dass Sie es tatsächlich durchführen.

## FAQ

### Warum sind es drei aufeinanderfolgende Minuten und nicht eine?

Weil LLM-Qualitätsscores einen Rauschboden haben – eine einzelne anomale Minutenmessung kann von einer Sampling-Eigenheit kommen (das 5 %-Trace-Sample ist zufällig auf einem schwierigen Slice gelandet) und nicht von einer echten Regression. Der Drei-Minuten-Lockout ist der günstigste Rauschfilter, der die gesamte Reaktionszeit dennoch unter eineinhalb Minuten hält. Wir haben in beide Richtungen getunt; drei ist der Sweet Spot für die typische Verkehrsform unserer Kunden. Die Dwell-Zeit ist pro Release konfigurierbar, falls Ihre Verkehrsform anders ist.

### Sollte Auto-Rollback auf „aus" konfigurierbar sein?

In unserer ausgelieferten Pipeline: nein. Der Sinn eines automatisierten Sicherheitsmechanismus ist, dass er um 2:14 Uhr morgens funktioniert, wenn niemand zuschaut. Ein abschaltbarer Auto-Rollback ist ein Klebezettel, auf dem steht „wir hatten mal ein Sicherheitsnetz." Das Argument für die Konfigurierbarkeit lautet, dass manche Workloads zu wenig kritisch seien, um irgendwelche False-Positive-Rollbacks zu rechtfertigen. Wir halten dieses Argument für irreführend – wenn Ihr Workload zu unkritisch für Auto-Rollback ist, brauchen Sie auch keine Release-Pipeline.

### Wie gehen Sie mit dem Fall um, dass das vorherige Release ebenfalls schlecht war?

Das Rollback-Ziel ist standardmäßig `previous_release`, aber die Manifest-Kette speichert mehr Historie als nur N-1. Operatoren können ein Rollback auf jede historisch gesunde Manifest-SHA umlenken – `/api/v1/releases/<historically_good_sha>/activate` – das ist der Pfad für manuelle Eingriffe, wenn das automatische N-1-Rollback auf ein schlechtes älteres Release stößt. Das Notventil ist da. Es ist selten.

### Welche Metrik sollte man optimieren – MTTR oder MTBF?

MTTR – Mean Time To Recovery – mit großem Abstand, zumindest für LLM-Systeme. MTBF (Mean Time Between Failures) setzt einen deterministischen „Failure"-Begriff voraus, den LLM-Workloads nicht haben. Output-Qualität driftet kontinuierlich; „Failure" ist eine Schwellenwertentscheidung. Auf schnelle Wiederherstellung zu optimieren ist robust dagegen, wo Sie die Schwelle setzen; auf das Niemals-Scheitern zu optimieren ist brüchig und falsch. Die Elite-Schwelle der DORA<sup><a href="#ref-5">[5]</a></sup> ist selbst in MTTR-Begriffen formuliert, was die richtige Rahmung ist.

### Führen Sie tatsächlich Rollback-Übungen durch?

Ja – quartalsweise, geplant, mit einem Test-Mode-Flag in der Quittung, damit die Übung im Audit-Log von einem echten Vorfall unterschieden werden kann. Die erste Übung, die wir durchführten, offenbarte ein 7-Sekunden-Settling-Delay, von dem wir nicht wussten, dass es da war. Die Übung ist der einzige Weg zu wissen, dass der Pfad tatsächlich funktioniert; das Runbook zu lesen reicht nicht. Die meisten Teams haben keine durchgeführt, weshalb die MTTR-Zahlen der meisten Teams angestrebt statt gemessen sind.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge calibration.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). Der Anker dafür, warum ein kalibrierter Judge notwendig ist und warum Übereinstimmung pro Slice wichtiger ist als aggregierte Übereinstimmung. Die minütliche Bewertungsschleife des Observers hängt davon ab.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vIndex-Gewichtsattestierung.</strong> Dokumentiert auf der <a href="/de/compliance/">Divinci-Compliance-Seite</a> und durchgespielt im <a href="/de/blog/validating-and-releasing-custom-lms-in-regulated-fields/">Beitrag zu regulierten Branchen</a>. Die Felder `vindex_sha256_before/after` in der Auto-Rollback-Quittung sind der kryptografische Anker, den ein Prüfer verifizieren kann, ohne unseren Logs vertrauen zu müssen.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare-Ausfall Juni 2022.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. „06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Vierundvierzig Minuten zum Zurücknehmen auf Infrastrukturebene, teils weil Ingenieure einander bei den Reverts in die Quere kamen. Anker für die These „ein manifestgetriebener Swap kann diesen Fehlermodus nicht haben."
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian-Ausfall April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 Stunden pro Site bis zur Wiederherstellung, insgesamt 14 Tage für 883 Sites, weil der Zustand über unabhängig versionierte Systeme verteilt war. Anker für die These „das gebündelte Release-Manifest ist das, was Sekunden statt Stunden möglich macht."
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>DORA-Schwelle für Wiederherstellung nach fehlgeschlagenem Deployment.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. Die Elite-Performer-Schwelle für „failed deployment recovery time" ist mit unter einer Stunde dokumentiert. Die 12-Sekunden-Zahl der Pipeline liegt drei Größenordnungen unter der Elite-Schwelle, was die richtige Lesart des Vergleichs ist.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrating the AI judge.</strong> Our companion post <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. The procedure for keeping the human-anchored judge in calibration over time. The operational claim in this post — that auto-rollback only works as well as the judge driving it — only holds if the judge is in fact periodically recalibrated.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Intern — Divinci-Pipeline-Referenz.</strong> Die Architektur, auf der diese Automatisierungsschicht aufsitzt: der <a href="/de/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">Beitrag zur vierstufigen Pipeline</a>. Die vollständige API-Oberfläche ist in der <a href="/de/api/">API-Referenz</a> dokumentiert; der Abschnitt zum Release-Management ist derjenige, von dem dieser Beitrag handelt.
</li>
</ol>

---

*Nächster Teil dieser Reihe:* **CI Testing for Custom Language Models in 2026.** In diesem Beitrag geht es um die operative Ebene zwischen menschlichen Freigaben. Der nächste betrachtet die Ebene *vor* dem Pipeline-Start – Pre-Merge-CI: was zur PR-Zeit zu bewerten ist, welche Arten von Regressionen Sie tatsächlich vor dem Gate abfangen und welche nicht.
