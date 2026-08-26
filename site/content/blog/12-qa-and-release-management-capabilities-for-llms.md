+++
title = "The 12 QA + Release Capabilities Every Custom-LLM Platform Ships"
description = "Capability checklist for LLM release platforms: slice-aware gates, calibrated judges, atomic rollback, hash receipts — what ships, what's missing."
date = 2026-05-28T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["LLM Ops", "QA", "Release Management", "Evaluation", "Compliance", "Audit Trail"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/12-qa-and-release-management-capabilities-for-llms-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/12-qa-and-release-management-capabilities-for-llms-hero-poster.webp"
reading_time = 11
summary = "We surveyed twelve LLM release platforms before we built ours. The market splits into three camps that don't quite meet — eval-CI tools, serving-canary tools, and observability tools — and the missing seam between them is exactly the one a customer release needs. This post is the capability checklist that came out of that survey: 12 specific tests you can apply to any platform, including ours."
+++

*Notes from the Release Cycle — Part III*

---

A year ago, before we started building our own release pipeline, we sat down and listed every QA-and-release capability we thought a serious LLM platform should ship. We then evaluated twelve other platforms against the list — LangSmith, MLflow, Weights & Biases, Braintrust, Humanloop, Patronus, Arize, Phoenix, Confident, Deepchecks, SageMaker Deployment Guardrails, KServe, BentoCloud, Vertex AI Endpoints, Seldon Core. Nobody had all twelve. The combinations that *were* shipped clustered into three camps that didn't quite touch each other.

This post is the resulting capability list, made portable. It's organized by which of our four pipeline stages each capability lives in — **Register → Gate → Roll → Observe** — so it composes cleanly with the [pipeline architecture](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) and the [failure modes](/blog/10-ci-cd-release-failures-in-custom-language-models/) we've written about. If you're evaluating tools, work the list top-to-bottom against each candidate; the ones with the deepest gaps will tell you which camp they belong to.

## The three camps (so you know what you're looking at)

Before the checklist itself, the shape of the market in 2026:

- **Eval-CI camp** — Braintrust, Humanloop, Patronus. Run automated evaluators at PR merge. Block bad merges. Never touch live traffic. Strong on capabilities 4–6; absent on 7–12.
- **Serving-canary camp** — SageMaker Deployment Guardrails, KServe, Vertex AI Endpoints, BentoCloud, Seldon Core. Split traffic, monitor infrastructure metrics, auto-rollback on CloudWatch-style alarms. Strong on 1, 7, 9; absent on the quality side of 8 and 10–12.
- **Observability camp** — Arize Phoenix, Confident AI, Deepchecks. Watch production, alert humans, escalate. Strong on 10 (monitoring), but they don't enforce a thing — alerting is not auto-rollback.

The gap between these camps — between "passed CI" and "live canary scored on quality, not just latency" — is the part everyone has to bridge manually. Closing that gap is the load-bearing claim in this post.

<figure style="margin: 1.5rem auto; max-width: 760px;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 490" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Venn diagram of three LLM-platform camps. Eval-CI camp (Braintrust, Humanloop, Patronus) sits on the left and covers offline evaluation at PR merge. Serving-canary camp (SageMaker, KServe, Vertex, BentoCloud, Seldon) sits on the right and covers traffic-splitting with infrastructure-metric rollback. Observability camp (Arize, Phoenix, Confident, Deepchecks) sits at the bottom and covers monitoring and alerting without enforcement. The three circles overlap pairwise in narrow slivers, but the central region where all three meet is empty. That empty center is the missing seam this post is about — a release decision driven by per-slice quality, enforced atomically on live traffic.">
<title>The three camps and the missing center</title>
<rect width="760" height="490" fill="#faf8f5"/>
<text x="380" y="36" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">The three camps that don't quite meet</text>
<text x="380" y="58" text-anchor="middle" font-size="13" fill="#6b5d4f">Each camp owns one piece. The center is where every team bridges by hand.</text>
<circle cx="280" cy="225" r="135" fill="#2d5a4f" fill-opacity="0.18" stroke="#2d5a4f" stroke-width="1.5"/>
<circle cx="480" cy="225" r="135" fill="#c87b3c" fill-opacity="0.18" stroke="#c87b3c" stroke-width="1.5"/>
<circle cx="380" cy="335" r="135" fill="#7a9580" fill-opacity="0.18" stroke="#7a9580" stroke-width="1.5"/>
<text x="195" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#2d5a4f">Eval-CI</text>
<text x="195" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">Braintrust, Humanloop,</text>
<text x="195" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Patronus</text>
<text x="195" y="259" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">offline eval gates</text>
<text x="195" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">at PR merge</text>
<text x="565" y="190" text-anchor="middle" font-size="17" font-weight="700" fill="#c87b3c">Serving canary</text>
<text x="565" y="214" text-anchor="middle" font-size="13" fill="#6b5d4f">SageMaker, KServe,</text>
<text x="565" y="231" text-anchor="middle" font-size="13" fill="#6b5d4f">Vertex, BentoCloud,</text>
<text x="565" y="248" text-anchor="middle" font-size="13" fill="#6b5d4f">Seldon</text>
<text x="565" y="276" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">traffic split +</text>
<text x="565" y="293" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">infra-metric rollback</text>
<text x="380" y="380" text-anchor="middle" font-size="17" font-weight="700" fill="#7a9580">Observability</text>
<text x="380" y="404" text-anchor="middle" font-size="13" fill="#6b5d4f">Arize, Phoenix, Confident, Deepchecks</text>
<text x="380" y="431" text-anchor="middle" font-size="13" font-style="italic" fill="#4a4030">monitor + alert (no enforcement)</text>
<circle cx="380" cy="260" r="42" fill="#a04848" fill-opacity="0.9" stroke="#a04848" stroke-width="1"/>
<text x="380" y="256" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">missing</text>
<text x="380" y="272" text-anchor="middle" font-size="14" font-weight="700" fill="#faf8f5">seam</text>
</svg>
</figure>

<p style="text-align: center; font-size: 0.9rem; color: #a04848; font-style: italic; margin: -0.5rem 0 1.5rem;">The missing seam: per-slice quality gate → atomic rollback driven by output quality, not infra metrics.</p>

## Stage ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Immutable manifest layer. Failure-attribution by SHA.</span>
  </div>
</div>

### Capability 1. Immutable release manifest with a content-addressable SHA

What it is: a release is not a model weight file. A release is an immutable bundle of *everything* — model artifact, prompt template, routing rules, dataset version, preprocessing version — addressed by a single SHA-256. Two people deploying "the same release" must produce the same SHA, or the pipeline refuses.

Why it matters: without this, "which change broke production?" is unanswerable when state is split across three systems. Atlassian's April 2022 outage<sup><a href="#ref-1">[1]</a></sup> took twelve hours per site to recover specifically because state lived in independently-versioned systems that had to be coordinated back into agreement.

Who ships it: serving-canary camp partially (model + routing); model registries (MLflow, W&B Models<sup><a href="#ref-2">[2]</a></sup>) partially (model artifact only). Almost no one bundles the **prompt template** into the SHA, which is exactly the field that changes most often.

### Capability 2. Atomic version control across all release components

What it is: the swap from release A to release B flips *everything* in one instruction — weights and prompt and routing and dataset and preprocessing — not as five separate dashboard edits.

Why it matters: partial swaps create undefined-behavior windows. If the prompt updates but the routing rule hasn't, every request hitting the new prompt with the old routing class is in a state nobody planned for.

Who ships it: nobody fully. The serving-canary camp atomically swaps the model image; the prompt and routing typically live elsewhere. Manifest-driven swap is where Divinci's atomic-rollback claim<sup><a href="#ref-5">[5]</a></sup> comes from.

### Capability 3. Training-serving environment parity

What it is: the preprocessing pipeline used during gate evaluation is the *same* preprocessing the production server uses. If they diverge, every offline number is a lie.

Why it matters: training-serving skew is one of the [ten release failures](/blog/10-ci-cd-release-failures-in-custom-language-models/#3-training-serving-preprocessing-skew) we've written about. The symptom is "performs fine in eval, behaves like a different model in production." The cure is registering preprocessing in the manifest and gating against the production preprocessing version.

Who ships it: containerization frameworks (BentoML, KServe) get partial credit by colocating preprocessing with serving. None of them bind preprocessing into the eval-gate input.

## Stage ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Per-slice Spearman ρ vs human-anchored grader.</span>
  </div>
</div>

### Capability 4. Per-slice / per-domain quality gate

What it is: the gate decision consumes *per-slice* scores — contract drafting, statutory interpretation, IP licensing — not a single aggregate. Any single slice falling below its threshold marks the release `gate_fail`, regardless of how the average looks.

Why it matters: aggregate scores wash out localized regressions. Tianpan's *Semver Lie* writeup<sup><a href="#ref-3">[3]</a></sup> names this as the dominant 2026 LLM release failure mode: a model that improves on average while quietly collapsing on one user-journey class.

Who ships it: **nobody else in 2026**. Eval-CI tools — Braintrust, Humanloop, Patronus — score against a single global rubric or a flat task list. They don't expose a per-slice threshold or a slice-blind override. This is the first place the camps fail to meet.

### Capability 5. Human-anchored calibrated judge (Spearman ρ vs human ratings)

What it is: the judge is not a generic LLM-as-judge. It's an LLM judge whose Spearman ρ against a domain-expert panel is measured and configured per slice. The judge is selected because its ranks match the human's ranks, not because it has a strong reputation.

Why it matters: MT-Bench<sup><a href="#ref-6">[6]</a></sup> shows GPT-4-as-judge agrees with humans >80% overall, with per-category variance from coding (86%) down to writing (36–44%). "Overall agreement" hides the slices where the judge is unreliable. Calibrating the judge per slice is the only honest way to make automated scoring trustworthy.

Who ships it: Braintrust, Humanloop, Patronus run judge evaluators. None of them require, expose, or persist a per-slice human-anchored Spearman calibration. The Divinci calibration pipeline is documented in [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/).

### Capability 6. Override path with required written rationale

What it is: force-overriding a gate failure is allowed (cold starts, accepted regressions, etc.) but requires two fields — `forceGateOverride: true` AND `overrideReason: "..."`. The reason goes into the audit trail alongside the user ID. No anonymous overrides.

Why it matters: governance gates aren't a separate compliance feature; they're a property of the gate stage itself. The audit trail has to answer not just "was this override used?" but "what was the rationale at the time?" — because future-you needs to read it.

Who ships it: eval-CI tools have flags; none of them require the rationale as a structural part of the override.

## Stage ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary at 5% → 25% → 100% with a quality monitor at each step.</span>
  </div>
</div>

### Capability 7. Multi-checkpoint canary with dwell

What it is: traffic moves from 0% to production via at least three checkpoints — typically **5% → 25% → 100%** — and holds at each one for either a configured dwell time or a configured request count, whichever is *later*. No instant 0%→100%.

Why it matters: long-tail bugs surface at scale. A bug that affects 0.3% of conversations is invisible on a 100-prompt eval and obvious at 5% of production traffic. The dwell is what gives the canary time to see the long tail.

Who ships it: serving-canary camp ships this. AWS SageMaker Deployment Guardrails<sup><a href="#ref-4">[4]</a></sup> documents a default `TerminationWaitInSeconds` of 600 (ten minutes). KServe, BentoCloud, Seldon, and Vertex all expose similar multi-step canary configurations. This is the saturated capability.

### Capability 8. Output-quality monitor at each canary checkpoint

What it is: at each checkpoint, the pipeline checks three monitors before advancing — p95 latency, 5xx rate, **and** an output-quality score computed by the same calibrated judge from capability 5. Latency and 5xx alone are not enough.

Why it matters: this is where the camps fail to meet again. SageMaker, KServe, Vertex, BentoCloud, Seldon all watch latency and error rate. None of them ship a per-checkpoint output-quality monitor — because they don't have a calibrated judge to score against. The eval-CI tools have the judge but don't sit on the traffic.

Who ships it: nobody completes the bridge. The dwelling-canary infrastructure exists in the serving camp; the calibrated judge exists in the eval-CI camp; we haven't seen anyone connect them.

### Capability 9. Automatic halt on quality breach

What it is: a canary checkpoint that fails on output quality auto-halts. Promotion does not advance. No human page required to stop the rollout.

Why it matters: humans are not in the loop in the timeframe rollouts move on. By the time a customer ticket arrives, the 25% checkpoint is over and the 100% promote has happened.

Who ships it: serving-canary camp halts on infrastructure metrics. The quality-metric halt is the part that requires capability 8 to exist.

## Stage ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Continuous trace replay → atomic rollback in ~12 s.</span>
  </div>
</div>

### Capability 10. Continuous production-trace replay through the candidate

What it is: after canary promotes to 100%, the observer keeps running. It samples recent production traces, replays them through the *candidate* (now-active) release, scores them with the calibrated judge, and emits a per-minute quality score. Continuous, not periodic.

Why it matters: silent quality drops — model hedges, confidently hallucinates a date, refuses where it shouldn't — never move latency or 5xx. The only signal you get for these is the customer ticket, which is the worst possible signal. A continuous quality monitor catches them in single-digit minutes.

Who ships it: **nobody.** Observability camp (Arize, Phoenix, Confident, Deepchecks<sup><a href="#ref-7">[7]</a></sup>) monitors production output but doesn't enforce. The serving-canary camp watches infra. The eval-CI camp doesn't sit on traffic. The closed loop — production traces → calibrated judge → enforcement — is the missing seam.

### Capability 11. Atomic rollback in seconds, not minutes

What it is: when the observer triggers (three consecutive minutes below threshold, say), rollback fires automatically. The rollback re-points routing to `previous_release` from the manifest. Because the previous release was a fully bundled manifest, every component flips atomically. End-to-end including in-flight drain on a ~100-replica service: about 12 seconds<sup><a href="#ref-5">[5]</a></sup>.

Why it matters: Cloudflare's June 2022 outage<sup><a href="#ref-8">[8]</a></sup> took 44 minutes to revert. The cause wasn't the revert itself — it was that engineers walked over each other's reverts because state was split. Manifest-driven rollback is single-instruction; it cannot have that failure mode.

Who ships it: serving-canary camp ships fast infrastructure rollback (alarm-triggered, blue-green flip). The architectural difference is whether the *trigger* is infra-only or quality-aware (capability 10).

### Capability 12. Hash-chained, externally-anchorable compliance receipt

What it is: every release decision — register, gate-pass, gate-fail, gate-override, checkpoint-promote, auto-rollback — emits a JSON-with-SHA-256 receipt, hash-chained to the previous receipt for this customer and the previous receipt for this release. The chain is anchored externally on a schedule the customer configures.

**Open-weights caveat.** When the release is backed by an open-weights model (Gemma, Qwen, Llama, Mistral, GPT-OSS), the receipt embeds a [vIndex weight-attestation](/compliance/) — a proof that the active weights at decision time are the weights the manifest registered. When the release is backed by a closed-API model (OpenAI, Anthropic, Google via opaque APIs), the receipt covers the decision chain but cannot claim weight provenance, because the provider doesn't expose weights. The receipt explicitly says so. This is the limit of what's verifiable.

Why it matters: regulated industries get *logs* today. The EU AI Act and NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> increasingly ask for *proofs*. A hash-chained receipt is the difference between "we have a log" and "an auditor can verify the chain without trusting our log."

Who ships it: nobody else. This is the part of the differentiation that maps directly onto Divinci's existing [compliance page](/compliance/) — same receipt format, extended to release decisions.

## The 12 capabilities, by platform camp

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Matrix of the 12 capabilities by platform camp. Divinci has all 12. Eval-CI camp (Braintrust, Humanloop, Patronus) has 5 and 6. Serving-canary camp (SageMaker, KServe, BentoCloud, Vertex, Seldon) has 1 partial, 2 partial, 7, 9, and 11 on infrastructure metrics. Model-registry camp (W&B Models, MLflow, LangSmith) has 1 partial and 2 partial. Observability camp (Arize, Phoenix, Confident, Deepchecks) has 10 in monitor-only form. Nobody else has 4 per-slice gate, 5 human-anchored calibrated judge, 8 output-quality canary monitor, 10 closed-loop trace replay with enforcement, or 12 hash-chained receipts.">
<title>The 12 capabilities, by camp</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Which camp ships which capability</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = ships it. ◐ = partial (infra-only, or registry-only). ✗ = does not ship. Six capabilities are missing across every other camp.</text>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="100" font-weight="700">Capability</text>
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
<text x="40" y="146">1. Immutable manifest SHA</text>
<text x="380" y="146" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="146" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="146" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="170">2. Atomic version swap (all components)</text>
<text x="380" y="170" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="170" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="820" y="170" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="194">3. Training-serving env parity</text>
<text x="380" y="194" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="194" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="194" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="222" font-weight="700" fill="#a04848">4. Per-slice / per-domain quality gate</text>
<text x="380" y="222" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="222" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="246" font-weight="700" fill="#a04848">5. Human-anchored calibrated judge</text>
<text x="380" y="246" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="246" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="246" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="270">6. Override path with required rationale</text>
<text x="380" y="270" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="270" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="600" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="270" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="298">7. Multi-checkpoint canary with dwell</text>
<text x="380" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="298" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="710" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="298" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="322" font-weight="700" fill="#a04848">8. Output-quality monitor at each checkpoint</text>
<text x="380" y="322" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="322" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="346">9. Auto-halt on quality breach</text>
<text x="380" y="346" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="346" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="346" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="374" font-weight="700" fill="#a04848">10. Closed-loop production-trace replay</text>
<text x="380" y="374" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="374" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="374" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="40" y="398">11. Atomic rollback in seconds</text>
<text x="380" y="398" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="398" text-anchor="middle" fill="#c87b3c">◐</text>
<text x="710" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="398" text-anchor="middle" fill="#a04848">✗</text>
<text x="40" y="426" font-weight="700" fill="#a04848">12. Hash-chained compliance receipt</text>
<text x="380" y="426" text-anchor="middle" fill="#2d5a4f">✓</text>
<text x="490" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="600" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="710" y="426" text-anchor="middle" fill="#a04848">✗</text>
<text x="820" y="426" text-anchor="middle" fill="#a04848">✗</text>
</g>
<line x1="40" y1="446" x2="860" y2="446" stroke="#d4c8b0" stroke-width="1"/>
<text x="40" y="464" font-size="10" fill="#8a7d68">Capabilities 4, 5, 8, 10, 12 highlighted: these are the five with no other ship in this scan. The rest cluster in one camp or another.</text>
</svg>
</figure>

The pattern is the point. Five capabilities — **per-slice gate, calibrated judge, quality canary monitor, closed-loop replay, hash-chained receipt** — show as ✗ across every other camp. That's the seam. The other seven distribute across the camps in ways that make each camp internally coherent but mutually incomplete.

## What makes QA different for custom language models than for software?

LLMs are not deterministic, even at temperature zero — batching and hardware differences cause output variation. That single property breaks most of the assumptions traditional QA was built on:

- **You can't write `expect(output).toEqual(X)` assertions.** You need a distribution-aware evaluation that consumes rank correlation against a human-anchored grader, not equality against a fixture. This is what capability 5 is.
- **A model can pass an aggregate quality check while failing on a slice.** That's why capability 4 exists separately. If your eval can't slice, it can't catch slice-aware regressions.
- **Quality failures are silent at the infrastructure layer.** Latency and 5xx stay clean while the model hedges or hallucinates. Capabilities 8 and 10 exist because no infrastructure-side monitor can see this.
- **Rollback isn't optional.** Because failure modes are probabilistic and some are silent, the rollback path has to be primary infrastructure, not a backup plan. Capability 11 is what makes "12 seconds" achievable; capability 2 is what makes it correct.

A QA-and-release platform that doesn't account for these four facts is shipping deterministic-software CI/CD with an LLM logo glued on. The market does this a lot.

## How do audit trails support AI compliance, in practice?

The most common compliance gap we see — when an auditor arrives six months after deployment and asks "which version of the model was running on March 15th, and who approved that release?" — is not "we don't have logs." It's "we have logs across five systems and the timelines don't line up."

A compliance receipt (capability 12) solves this by making the log itself a portable artifact: hash-chained, single-source, externally anchorable. An auditor can verify the chain without trusting our infrastructure. That's the difference between "we have records" and "the records are provable."

For open-weights model backings, the receipt also includes a weight-attestation — a cryptographic proof that the active weights are the weights the manifest registered. This satisfies the harder asks (GDPR Article 17 right-to-erasure, EU AI Act provenance) because you can prove *not just what was deployed* but *that the underlying weights are what they claim to be*.

For closed-API backings — when the model is served behind an opaque API and the weights aren't exposed — the receipt covers the decision chain but cannot claim weight provenance. We say this in the receipt explicitly rather than implying a proof we can't deliver. It's the limit of what's verifiable when the provider keeps weights internal.

## What this checklist does not solve

Three honest limitations:

**Capabilities aren't checkboxes for their own sake.** A platform that ships all twelve poorly is worse than one that ships eight of them well. The checklist is a starting point for evaluation, not a scorecard for vendor RFPs.

**The competitive snapshot is 2026 and will shift.** Six months from now some of the ✗ marks above will flip — competitors will read postmortems and close gaps. If you read this post in 2027, audit the marks yourself before believing them.

**Some capabilities depend on others.** Capability 8 (output-quality canary monitor) requires capability 5 (calibrated judge). Capability 10 (closed-loop trace replay) requires both. A platform that ships 8 without 5 is shipping a placebo — the canary monitor exists but isn't grounded against anything trustworthy.

## FAQ

### What is the most important QA capability for custom LLM releases?

A per-slice quality gate (capability 4) — meaning the release decision consumes per-domain Spearman scores against a human-anchored grader, not a single global aggregate. Aggregate scores wash out localized regressions, and localized regressions are the dominant 2026 LLM release failure mode<sup><a href="#ref-3">[3]</a></sup>. If you can only ship one capability from this list, ship 4. Then ship 5, which is what makes 4 trustworthy.

### How do you evaluate an LLM QA platform without running it for six months?

Apply the 12-capability checklist above to vendor documentation, with two specific tests. First, ask the vendor to show you the *per-slice* gate output for one of their reference customers — if they only have aggregate scores, they don't have capability 4. Second, ask what triggers their auto-rollback — if the answer is "latency, error rate, and our alarms," they're in the serving-canary camp and capability 10 is missing.

### What's the difference between eval-CI tools and release-management tools?

Eval-CI tools (Braintrust, Humanloop, Patronus) run automated evaluators at PR merge and block bad merges. They never touch live traffic. Release-management tools (this category) own the release manifest, the canary, the observer, and the rollback path. Eval-CI is *part of* a release-management workflow but is not a replacement for one. Many teams ship one of the two and discover the gap when a regression that passed CI hits production silently.

### How fast should rollback be?

Order-of-magnitude seconds, not minutes. The mean rollback time on the Divinci pipeline is about 12 seconds — that's in-flight request drain on a ~100-replica service, not the manifest swap itself, which is sub-second. Compare to Cloudflare's June 2022 incident<sup><a href="#ref-8">[8]</a></sup>, which took 44 minutes to revert because state was split across systems. The architectural decision that makes seconds-not-minutes possible is the bundled release manifest (capabilities 1 and 2).

### Why do compliance receipts matter more than compliance logs?

A log is something you wrote. A receipt is something an auditor can verify without trusting you. The EU AI Act and NIST AI RMF<sup><a href="#ref-9">[9]</a></sup> increasingly distinguish between the two — "documented" is not the same as "provable," and the regulatory direction is toward the latter. A hash-chained, externally-anchored receipt is the simplest available technology for crossing that line.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Atlassian PIR April 2022.</strong> <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Post-Incident Review: April 2022 Outage</a>. "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Cited for capability 1 — what state-spread-across-systems looks like at scale.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>W&amp;B Models / MLflow registry.</strong> <a href="https://wandb.ai/site/registry/" target="_blank" rel="noopener">Weights &amp; Biases Registry</a> and <a href="https://mlflow.org/docs/latest/ml/model-registry/" target="_blank" rel="noopener">MLflow Model Registry</a>. The model-artifact-only side of capability 1. Neither ships prompt-template registration.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>The Semver Lie.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em></a> (April 2026). Names the slice-aware regression failure mode as the dominant 2026 pattern. Companion: <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a>. Anchor for capability 4.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> and <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> of 600 (ten minutes), maximum 1800 (thirty minutes). The standard infrastructure-metric canary the post contrasts against on capabilities 8 and 10.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — atomic routing-flip via release manifest.</strong> The ~12-second rollback time is in-flight drain on a ~100-replica service; the manifest swap itself is sub-second. Number is from our own service, not a benchmark. The architecture that makes it possible is the bundled manifest from capability 1.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>LLM-as-judge per-category variance.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) to writing (36–44%). Anchor for capability 5 — why a calibrated judge has to be per-slice.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Observability camp comparison.</strong> <a href="https://arize.com/docs/phoenix" target="_blank" rel="noopener">Arize Phoenix</a>, <a href="https://www.confident-ai.com/knowledge-base/compare/10-llm-observability-tools-to-evaluate-and-monitor-ai-2026" target="_blank" rel="noopener">Confident AI's 2026 observability tools comparison</a>. All ship monitoring and alerting; none enforce rollback. Anchor for capability 10's "monitor without enforcement" framing.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." 44 minutes from "we know what to revert" to revert complete, in part because engineers walked over each other's reverts. Anchor for capability 11.
</li>
<li id="ref-9" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Governance, mapping, measurement, management — the four core functions that capability 12 maps onto. Plus the EU AI Act provenance requirements at <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Anchor for capability 12.
</li>
</ol>

---

*Next in this series:* **Validating and Releasing Custom LMs in Regulated Fields.** The capability checklist above is generic. The next post is specific: the EU AI Act, GDPR Article 17, HIPAA, and NIST AI RMF — what each one asks of a release process, which capabilities above cover which requirement, and where the open-weights / closed-weights split actually changes the compliance story.
