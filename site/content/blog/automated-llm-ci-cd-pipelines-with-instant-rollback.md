+++
title = "Automated LLM CI/CD Pipelines With Instant Rollback"
description = "The operational layer under the four-stage pipeline: which decisions fire automatically, what an actual rollback drill looks like, and the MTTR number."
date = 2026-05-30T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "CI/CD", "Automation", "Rollback", "MTTR", "Release Management"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/automated-llm-ci-cd-pipelines-with-instant-rollback-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/automated-llm-ci-cd-pipelines-with-instant-rollback-hero-poster.webp"
reading_time = 11
summary = "Between human approval gates, an LLM release pipeline either runs itself or it doesn't. This post is the operational companion to the architecture post — it draws the automation spectrum (which decisions fire automatically, which require a human, and which we hard-stop until somebody signs the override), shows what an actual rollback drill looks like, and ends with the MTTR number that comes out the other side."
+++

*Notes from the Release Cycle — Part V*

---

The most-quoted page that didn't go out last quarter was the one our observer fired on its own at 2:14 AM. The candidate release had passed the gate, dwelled at 5% for the required four minutes, advanced to 25%, and then sat there. The per-minute quality monitor saw three consecutive sub-threshold readings on the legal-domain slice, halted the rollout, and re-pointed routing to the previous release. By the time the on-call engineer's notification fired — for the receipt, not for an outage — production traffic had been back on the known-good release for nine minutes.

Nobody needed to do anything. The architecture from [the first post in this series](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) describes what the four stages are. This post is about what runs between human approvals — the automation layer under the architecture, the boundary where the pipeline either does the right thing on its own or it doesn't.

The headline claim: **most pipeline decisions should be automated, but not all of them**. The boundary matters. The pipeline that automates everything will eventually promote a release a human should have caught; the pipeline that automates nothing has no purpose. Drawing the boundary right is what this post is about.

## The automation spectrum

Every pipeline decision sits somewhere on a spectrum from *"fires on its own with no human notification"* to *"refuses to proceed without an explicit signed approval."* Below is where each of the load-bearing pipeline actions sits on that spectrum in our shipped pipeline.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 460" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="The automation spectrum. From fully automated on the left to always requires human approval on the right. Decisions plotted: at the fully-automated end, the per-minute quality monitor evaluation, the canary checkpoint health check, and the auto-rollback trigger; in the middle, the gate-pass advance and the canary checkpoint promotion; toward the human side, the production deployment registration and the manifest commit; at the always-human end, the gate-fail override decision and cold-start release shadow deployment.">
<title>The automation spectrum</title>
<rect width="900" height="460" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">The automation spectrum</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Where each load-bearing pipeline decision sits, from fully autonomous (left) to always-human (right).</text>
<line x1="60" y1="110" x2="860" y2="110" stroke="#2d3c34" stroke-width="2"/>
<line x1="60" y1="100" x2="60" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="860" y1="100" x2="860" y2="120" stroke="#2d3c34" stroke-width="2"/>
<line x1="220" y1="105" x2="220" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="460" y1="105" x2="460" y2="115" stroke="#2d3c34" stroke-width="1"/>
<line x1="700" y1="105" x2="700" y2="115" stroke="#2d3c34" stroke-width="1"/>
<text x="60" y="92" font-size="11" font-weight="700" fill="#2d5a4f">FULLY AUTOMATED</text>
<text x="60" y="138" font-size="10" fill="#6b5d4f">fires on its own,</text>
<text x="60" y="152" font-size="10" fill="#6b5d4f">no notification</text>
<text x="220" y="92" font-size="11" font-weight="700" fill="#7a9580" text-anchor="middle">NOTIFY-ONLY</text>
<text x="220" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">runs automatically;</text>
<text x="220" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">receipt + page</text>
<text x="460" y="92" font-size="11" font-weight="700" fill="#b8a080" text-anchor="middle">PROCEED-IF-OK</text>
<text x="460" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">human can veto in</text>
<text x="460" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">a known window</text>
<text x="700" y="92" font-size="11" font-weight="700" fill="#c87b3c" text-anchor="middle">HUMAN-STARTED</text>
<text x="700" y="138" font-size="10" fill="#6b5d4f" text-anchor="middle">requires explicit</text>
<text x="700" y="152" font-size="10" fill="#6b5d4f" text-anchor="middle">user action</text>
<text x="860" y="92" font-size="11" font-weight="700" fill="#a04848" text-anchor="end">ALWAYS-HUMAN</text>
<text x="860" y="138" font-size="10" fill="#6b5d4f" text-anchor="end">refuses without</text>
<text x="860" y="152" font-size="10" fill="#6b5d4f" text-anchor="end">signed rationale</text>
<circle cx="100" cy="200" r="9" fill="#2d5a4f"/>
<line x1="100" y1="209" x2="100" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="100" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Observer per-minute</text>
<text x="100" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">quality eval</text>
<text x="100" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">runs continuously</text>
<text x="100" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">on 5% trace sample</text>
<circle cx="170" cy="200" r="9" fill="#2d5a4f"/>
<line x1="170" y1="209" x2="170" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="170" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Canary checkpoint</text>
<text x="170" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">health check</text>
<text x="170" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">p95 + 5xx + output</text>
<text x="170" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">quality at 5/25/100</text>
<circle cx="240" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="240" y1="211" x2="240" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="240" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Auto-rollback</text>
<text x="240" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">trigger</text>
<text x="240" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">3 consecutive min</text>
<text x="240" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">below threshold</text>
<circle cx="420" cy="200" r="9" fill="#b8a080"/>
<line x1="420" y1="209" x2="420" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="420" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Gate-pass advance</text>
<text x="420" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">to canary</text>
<text x="420" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">all slices ≥ threshold</text>
<text x="420" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">→ auto-start at 5%</text>
<circle cx="500" cy="200" r="9" fill="#b8a080"/>
<line x1="500" y1="209" x2="500" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="500" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Checkpoint</text>
<text x="500" y="261" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">5% → 25% → 100%</text>
<text x="500" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">advances if monitors</text>
<text x="500" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">hold during dwell</text>
<circle cx="680" cy="200" r="9" fill="#c87b3c"/>
<line x1="680" y1="209" x2="680" y2="330" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="680" y="346" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">Release</text>
<text x="680" y="361" text-anchor="middle" font-size="11" font-weight="700" fill="#1e3a2b">registration</text>
<text x="680" y="382" text-anchor="middle" font-size="10" fill="#6b5d4f">customer commits</text>
<text x="680" y="396" text-anchor="middle" font-size="10" fill="#6b5d4f">a new manifest</text>
<circle cx="830" cy="200" r="11" fill="#a04848" stroke="#a04848" stroke-width="2"/>
<line x1="830" y1="211" x2="830" y2="230" stroke="#8a7d68" stroke-width="0.5" stroke-dasharray="2 2"/>
<text x="830" y="246" text-anchor="middle" font-size="11" font-weight="700" fill="#a04848">Gate-fail override</text>
<text x="830" y="282" text-anchor="middle" font-size="10" fill="#6b5d4f">requires written</text>
<text x="830" y="296" text-anchor="middle" font-size="10" fill="#6b5d4f">rationale in audit log</text>
<text x="40" y="442" font-size="10" fill="#8a7d68"><tspan font-weight="700">Red markers</tspan> = the two decisions where the pipeline behavior is asymmetric: auto-rollback fires on its own and you do not get to opt out; gate-fail override refuses to proceed and you do not get to skip the rationale.</text>
</svg>
</figure>

Two of the markers above are red rather than colored by their zone. Those are the asymmetric decisions — the two places where the pipeline takes a strong position about who gets to call what. The **auto-rollback trigger** fires without asking; you cannot configure it off, because the entire point of having it is that it works at 2:14 AM. The **gate-fail override** refuses to advance without a written rationale; you cannot configure that off either, because the entire point of having it is that future-you needs to read the reason. Most of the rest of the pipeline is configurable; these two are not.

## How auto-rollback actually fires

The most-asked question about auto-rollback is *"what stops it from firing for the wrong reason?"* The honest answer is: nothing single-handedly. The protection comes from how the trigger is wired.

The Observe stage runs a per-minute scoring loop. Every minute it:

1. Samples a small set of recent production traces from the active release.
2. Replays each trace through the *active model* (not the candidate — we're scoring what's actually serving).
3. Scores each replay using the same calibrated human-anchored judge that drove Gate-2<sup><a href="#ref-1">[1]</a></sup>.
4. Computes a single output-quality score over the sample. Writes it to `CanaryHealthSample`.

The rollback fires when **three consecutive per-minute samples** fall below the rollback threshold (default: 0.85 of the gate threshold — so 0.55 if the gate was 0.65). Not one bad minute; three. The three-minute lockout is the noise filter — a single anomalous reading does not trigger anything, but a sustained regression does.

When the lockout breaks, the rollback worker executes:

```bash
# In effect — the pipeline runs this on its own. No human ack.
POST /api/v1/releases/<previous_release_sha>/activate
# response in <1s; in-flight drain in ~12s on a ~100-replica service
```

A receipt fires. The on-call engineer sees a Slack notification *for the receipt*, not for an outage. They open the receipt; they see the three sub-threshold readings, the elapsed time, and the `vindex_sha256_before/after`<sup><a href="#ref-2">[2]</a></sup> hashes. Twelve seconds is in-flight drain time; the swap itself is sub-second. By the time the engineer is awake enough to ask "do I need to do something?" the answer is "no, but you should still look at why the gate let this through."

## The actual auto-rollback receipt

This is what the receipt looks like in production. Same hash-chained format documented on the [compliance page](/compliance/), with the additional fields specific to an auto-rollback event:

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

The receipt itself is the on-call's first point of contact. Reading it answers the questions a half-awake engineer would actually ask: what triggered it, which slice failed, by how much, how long the swap took, what's running now. The next-action prompt from there is usually *"go look at why the gate passed this in the first place"* — which the receipt for the failing release already has the per-slice Spearman table for.

## What the pipeline does NOT do on its own

The corollary to "auto-rollback fires without asking" is that some other things actively cannot. Three explicit refusals.

**It does not promote a release that failed the gate without a signed override.** A gate-fail marks the release `gate_fail`; the `/activate` endpoint refuses to accept the manifest SHA; no command-line incantation works around this. The only path forward is a force-override with `forceGateOverride: true` AND `overrideReason: "<free text>"`. The reason field is required, free-text, and goes into the audit log alongside the user ID. We've designed this so future-you can read why current-you decided the slice regression was acceptable. Three people have used the override path in the wild. Their rationales are still in the audit log.

**It does not advance from canary to 100% if any monitor is degrading.** If p95 latency, 5xx rate, OR output-quality score is outside its band at the end of a checkpoint dwell, the pipeline halts at that checkpoint and pages. It does not advance and apologize later.

**It does not auto-canary a cold-start release.** A release with no history of production traffic — fresh fine-tune against a brand-new dataset, say — has nothing to compare its output quality against. The pipeline refuses to start a canary on a cold-start release. We require a 24-hour shadow deployment first, which observes the candidate against real production traces but doesn't serve any of its responses. After 24 hours we have a quality baseline; then the canary can proceed. Slower; honest; not configurable.

## How fast is the recovery, end-to-end?

The recovery time number we publish is **12 seconds**. That's in-flight drain on a ~100-replica service. The manifest swap itself is sub-second. To be useful to a reader, the 12 seconds needs to be decomposed:

- **0–60 seconds before rollback:** the three consecutive sub-threshold readings arrive. The first sub-threshold reading starts the lockout timer. Each subsequent minute extends the lockout if quality is still below threshold.
- **t = 0:** the third sub-threshold reading writes to `CanaryHealthSample`. The rollback worker observes the third strike and dispatches `/activate previous_release`.
- **t < 1 second:** the routing layer's active-release pointer (in Redis) flips. New requests start hitting the previous release.
- **t = 1 to ~12 seconds:** the candidate release continues serving any requests that were in flight when the swap happened. In-flight drain. Some streaming responses take 8–10 seconds to complete naturally, so the cleanup tail is around 12s on a typical service.
- **t ≈ 13 seconds:** the audit log receipt is written and signed. The notification fires.

Compared against the public postmortems we keep citing as anchors: Cloudflare's June 2022 outage<sup><a href="#ref-3">[3]</a></sup> took 44 minutes from "we know what to revert" to "the revert is complete" — and that was the *infrastructure* tier. Atlassian's April 2022 outage<sup><a href="#ref-4">[4]</a></sup> took 12 hours per site because state was split across multiple systems. DORA's<sup><a href="#ref-5">[5]</a></sup> "elite performer" threshold for failed-deployment recovery is under one hour. Twelve seconds isn't an order-of-magnitude better than the elite threshold — it's three orders of magnitude better. The architectural decision that makes it possible is the bundled release manifest from [Stage 1](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register). Without the manifest, you don't have a single object to re-point routing at.

## Rollback drills — the unsexy practice nobody runs

Here is the part most teams skip: **the only reliable signal that your rollback path works is that you ran a deliberate, scheduled drill and confirmed.** Every quarter we run one. The drill goes:

1. Pick a randomly-scheduled, weekday-business-hours time. Tell the team it's coming, but not the specific hour.
2. Inject a synthetic quality regression on the canary slice. (We have a test-mode flag that lets the candidate model respond to a magic header with "I refuse to answer" — guaranteed to fail the calibrated judge.)
3. Push the test release through the gate (it passes — we're testing the rollback, not the gate). Start a canary.
4. Observer notices three sub-threshold readings. Auto-rollback fires.
5. Wait for the on-call engineer to react. Time how long they take. Note whether they trust the receipt enough to *not* page back to alarmed.
6. Verify the audit log shows the test-mode flag in the rollback receipt, so future audits can distinguish a drill from a real incident.

The first drill we ran took 19 seconds end-to-end (12s swap + a 7s settling delay we had to fix). The most recent drill — Q1 2026 — took 12 seconds. The drill never gets to be skipped. Every quarter; every customer cluster.

Most teams have never run a deliberate rollback drill. The first time their rollback path runs is during a real incident, under pressure, with multiple people in the call. The drill is what makes the 12-second number a real number rather than an aspirational one.

## What this does not solve

Three honest limitations:

**Auto-rollback can ping-pong.** If both the candidate AND the previous release are bad — say, the previous release also had a slow-developing slice regression that nobody caught — the pipeline can roll back, then the previous release also fails its post-rollback observer, and there's no third release to roll back to. The pipeline halts traffic to a maintenance page rather than thrashing. The fix is to keep more than one prior healthy release indexed in the manifest chain so the rollback target is configurable.

**The observer adds inference cost.** Replaying production traces through the active model on a 5% sample adds roughly 5% to inference spend. We think this is the right trade. Some customers think it's too expensive on low-margin workloads and want to dial the sample rate down. The dial exists.

**A bad judge is worse than no judge.** If the calibrated judge that drives the observer is itself miscalibrated — drifted from the human anchor, or trained on a stale corpus — the observer can fire auto-rollback for the wrong reason. The recalibration cadence matters. The Calibrating-the-Judge<sup><a href="#ref-6">[6]</a></sup> piece documents the procedure; the operational requirement is that you actually run it.

## FAQ

### Why is the rollback trigger three consecutive minutes rather than one?

Because LLM quality scores have noise floor — a single anomalous minute reading can come from a sampling quirk (the 5% trace sample happened to land on a hard slice), not a real regression. The three-minute lockout is the cheapest noise filter that still keeps total reaction time under a minute and a half. We've tuned both ways; three is the sweet spot for our customers' typical traffic shape. The dwell is configurable per release if your traffic shape is different.

### Should auto-rollback be configurable to "off"?

In our shipped pipeline, no. The point of having an automated safety mechanism is that it works at 2:14 AM when nobody's watching. A configurable-off auto-rollback is a sticky note that says "we used to have a safety net." The argument for making it configurable is that some workloads are too low-stakes to justify any false-positive rollbacks. We think that argument leads to the wrong place — if your workload is too low-stakes for auto-rollback, you don't need a release pipeline either.

### How do you handle the case where the previous release was also bad?

The rollback target is `previous_release` by default, but the manifest chain stores more history than just N-1. Operators can re-target a rollback to any historically-healthy manifest SHA — `/api/v1/releases/<historically_good_sha>/activate` — which is the manual-intervention path when the automatic N-1 rollback hits a bad earlier release. The escape valve is there. It's rare.

### What's the right metric to optimize — MTTR or MTBF?

MTTR — Mean Time To Recovery — by a wide margin, at least for LLM systems. MTBF (Mean Time Between Failures) assumes a deterministic notion of "failure" that LLM workloads don't have. Output quality drifts continuously; "failure" is a threshold call. Optimizing for fast recovery is robust to where you draw the threshold; optimizing for never failing is brittle and false. DORA's elite threshold<sup><a href="#ref-5">[5]</a></sup> is itself framed in MTTR terms, which is the right framing.

### Do you actually run rollback drills?

Yes — quarterly, scheduled, with a test-mode flag in the receipt so the drill can be distinguished from a real incident in the audit log. The first drill we ran exposed a 7-second settling delay we hadn't realized was there. The drill is the only way to know the path actually works; reading the runbook is not enough. Most teams have not run one, which is why most teams' MTTR numbers are aspirational rather than measured.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge calibration.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). The anchor for why a calibrated judge is necessary and why per-slice agreement matters more than aggregate agreement. The observer's per-minute scoring loop depends on this.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>vIndex weight-attestation.</strong> Documented on the <a href="/compliance/">Divinci compliance page</a> and walked through in the <a href="/blog/validating-and-releasing-custom-lms-in-regulated-fields/">regulated-fields post</a>. The `vindex_sha256_before/after` fields in the auto-rollback receipt are the cryptographic anchor an auditor can verify without trusting our logs.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Forty-four minutes to revert at the infrastructure tier, in part because engineers walked over each other's reverts. Anchor for the "manifest-driven swap can't have that failure mode" claim.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian April 2022 outage.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. 12 hours per site to restore, 14 days total for 883 sites, because state was split across independently-versioned systems. Anchor for the "bundled release manifest is the thing that makes seconds-not-hours possible" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>DORA failed-deployment recovery threshold.</strong> <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — Software delivery performance metrics</a>. The "failed deployment recovery time" elite-performer threshold is documented as under one hour. The 12-second pipeline number is three orders of magnitude below the elite threshold, which is the right way to read the comparison.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrating the AI judge.</strong> Our companion post <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a>. The procedure for keeping the human-anchored judge in calibration over time. The operational claim in this post — that auto-rollback only works as well as the judge driving it — only holds if the judge is in fact periodically recalibrated.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — Divinci pipeline reference.</strong> The architecture this automation layer sits under: the <a href="/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">four-stage pipeline post</a>. The full API surface is documented at the <a href="/api/">API reference</a>; the release-management section is the one this post is talking about.
</li>
</ol>

---

*Next in this series:* **CI Testing for Custom Language Models in 2026.** This post is about the operational layer between human approvals. The next is the layer *before* the pipeline starts — pre-merge CI: what to evaluate at PR time, what kinds of regressions you actually catch before the gate sees them, and which kinds you don't.
