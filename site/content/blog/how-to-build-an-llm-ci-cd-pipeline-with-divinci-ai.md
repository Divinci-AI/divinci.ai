+++
title = "How to Build an LLM CI/CD Pipeline With Divinci AI"
description = "A four-stage LLM release pipeline: slice-aware Spearman gates, canary watching output quality (not just p95), 12-second atomic rollback, and a compliance receipt for every decision."
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
summary = "A traditional CI/CD pipeline assumes the artifact is deterministic. A language model is not. This walks through the pipeline we ship at Divinci AI — slice-aware Spearman gates against a human-anchored judge, canary that watches output quality (not just p95), atomic rollback in roughly twelve seconds, and a hash-chained release receipt for every decision (with a vindex weight-attestation embedded when the model is open-weights). Three of those are things no other LLM release tool ships in 2026."
+++

*Notes from the Release Cycle — Part I*

---

The first time we tried to ship an LLM through a normal CI/CD pipeline, the build went green, the deploy succeeded, and customer support started filing tickets within seven minutes.

Nothing had "broken." All 4,200 integration tests passed. Latency was unchanged. The 200 OK rate held steady. But on a specific class of legal-domain question, the new model had quietly started hedging — refusing to commit to an answer that the previous version had answered correctly. No test caught it because we had not yet written one.

We rolled back, and the rollback itself was an event. The model artifact lived in three places, the prompt template lived in a fourth, the routing rules lived in a fifth, and nothing knew about anything else. It took just over two hours to get back to the previous good state. The customers who had been served a hedge during that window were not impressed.

That outage is the reason this pipeline exists. What follows is the actual one we ship our own releases through, and the one we expose through the Divinci API for customers shipping theirs. It has four stages — **register, gate, roll, observe** — and every step has a rollback path that doesn't depend on a human being awake.

## The four stages

<img src="/images/charts/divinci-cicd-pipeline.svg" alt="Four-stage CI/CD pipeline diagram for LLMs. Stage 1 Register: model artifact, prompt template, routing rules, and dataset version are bundled into a single signed release manifest. Stage 2 Gate: automatic evaluation against the scored-QA suite, with a per-category Spearman threshold gate. Stage 3 Roll: canary traffic ramp 5 to 25 to 100 percent with health checks at each step. Stage 4 Observe: drift monitor, output-quality monitor, and auto-rollback on threshold breach. Each stage emits an audit-log entry signed with the release SHA." width="900" height="380" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

The stages are intentionally rigid. Every release passes through every stage in this order. A "hotfix" path that skips evaluation does not exist — we tried that once.

### Stage 1 — Register

A release is **not** a model weight file. A release is an immutable manifest that bundles:

- The model artifact (HF repo + commit SHA, or a vindex patch)
- The prompt template (every variable, every system message)
- The routing rules (which traffic class lands on which version)
- The dataset version used to compute the gate thresholds
- The previous release's SHA, so rollback is unambiguous

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

The manifest SHA is the only handle anyone in the pipeline ever uses. If two people deploy what they think is the same release and the SHAs differ, the pipeline rejects the deploy. We've now caught two bugs with this rule.

### Stage 2 — Gate

The gate is the part most CI pipelines get wrong. Lighthouse-style heuristics — perplexity, BLEU, ROUGE — will let a regression through if the regression is concentrated in one domain. Aggregate scores wash it out.

Divinci's gate runs the scored-QA suite the release manifest was registered with, and applies a **per-category** Spearman threshold:

<img src="/images/charts/divinci-cicd-gate-thresholds.svg" alt="Bar chart showing per-category Spearman rank correlation between candidate model and the calibrated human-anchored grader, across six legal subdomains. Contract drafting at 0.71, statutory interpretation at 0.74, case summarization at 0.69, regulatory compliance at 0.66, jurisdictional analysis at 0.62, and IP licensing at 0.41. The dashed gate threshold line sits at 0.65. IP licensing falls below the line, triggering a Gate-2 fail. Aggregate mean across all six categories is 0.64, just under threshold, but the per-category view shows exactly which subdomain regressed." width="900" height="420" style="width: 100%; max-width: 100%; height: auto; margin: 1.5rem auto; display: block;" loading="lazy">

The release in the chart above would pass an aggregate gate (mean 0.64 is "close enough"). It fails Divinci's gate because IP licensing crashes from a prior 0.68 to 0.41 — exactly the kind of localized regression a notebook never catches.

<aside style="background: rgba(184, 160, 128, 0.08); border-left: 3px solid #b8a080; padding: 0.7rem 1rem; margin: 0.8rem 0 1.5rem; font-size: 0.88rem; color: #4a4030;">
  <strong style="color: #1e3a2b;">About the chart numbers:</strong> the per-subdomain values are <em>illustrative of the shape</em>, not measurements from a published study. No public paper reports judge-vs-human Spearman ρ broken down by these specific legal practice areas. For ballpark adjacency see <a href="https://arxiv.org/abs/2308.11462" target="_blank" rel="noopener">LegalBench (Guha et al., 2023)</a> — per-task accuracy across six legal reasoning types — and <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">MT-Bench (Zheng et al., 2023)</a>, which reports ~80% overall GPT-4-vs-human agreement with wide per-category variance. Customers running their own scored-QA suite produce real numbers for their own slices; the chart shape is what the API would surface.
</aside>

We did not invent slice-aware gating for fun. It's the directly named failure mode in the current crop of LLM postmortems. Tianpan's *"The Semver Lie"* writeup<sup><a href="#ref-6">[6]</a></sup> describes a prompt change that "passed code review, deployed without eval gates, hit production without per-user A/B, and triggered no automatic rollback." The thing that made that incident catastrophic instead of merely annoying was that the regression was concentrated in one slice — a single user-journey class — while the aggregate held. Every LLM release tool we surveyed in 2026 either gates on a single global score, or doesn't gate at all. None of them slices the gate.

A gate failure is **not** a soft warning. The release_id is marked `gate_fail`, the manifest is archived, and no deploy command will accept it. Cold-start releases — a brand-new model with no historical Spearman to compare against — pass through a one-time `--force-gate-override` path that requires a written rationale; the rationale, the user ID, and a `gate_override_sha256` go directly into the audit trail. Override exists because there are legitimate situations for it; the audit trail exists because future-you needs to read the rationale.

### Stage 3 — Roll

A canary at Divinci means three checkpoints: **5%, 25%, 100%**. At each checkpoint, the pipeline holds for either the configured dwell time or the configured request count, whichever is later. Default is 4 minutes / 1,000 requests at 5%, 15 minutes / 10,000 requests at 25%.

At each checkpoint, three monitors must hold:

1. **p95 latency** within 1.2× the previous release's p95
2. **5xx rate** within 1.5× the previous release's rate
3. **Output-quality monitor**: a continuous replay of recent production traces through the candidate release, scored by the same calibrated judge that powered Stage 2

The third one is the one no other release pipeline ships. SageMaker, KServe, BentoML, Vertex AI — all of them watch latency and error rate. None of them score the candidate's outputs against the *actual* questions production is asking right now. The candidate gets the same prompts the active release just got, runs them on a 5% mirror, and we measure the Spearman ρ of the candidate's answers against the calibrated grader. The 5xx rate can stay clean while the model quietly hedges, refuses, or hallucinates. We've watched this happen. The trace-replay monitor is what catches it.

The replay set is bounded — we cap at 50 recent traces per slice per checkpoint so the cost is predictable. Grading takes about 90 seconds at 5% traffic. Slower than a flat percentage-canary, faster than waiting for a customer to file a ticket.

```bash
# The roll command is fire-and-forget. The pipeline holds itself.
curl -X POST https://api.divinci.ai/v1/releases/rel_a01c66/roll \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -d '{ "strategy": "canary", "dwell_5pct_seconds": 240, "dwell_25pct_seconds": 900 }'
# → { "rollout_id": "rol_b3e2", "next_checkpoint_at": "2026-05-26T09:04:00Z" }
```

### Stage 4 — Observe, rollback, and the receipt

This is the stage that earns the pipeline's existence.

The observer runs continuously after the rollout completes. It computes a per-minute output-quality score on a rolling 5% trace-replay sample. If the score drops below the rollback threshold (default: 0.85 of the gate threshold, so 0.55 if the gate was 0.65) for three consecutive minutes, the rollback fires automatically. No page, no human, no debate.

The rollback itself is a single instruction: re-point routing to `previous_release` from the manifest. Because the previous release was a fully bundled manifest, every component — weights, prompt, routing, dataset — flips atomically.

Then the receipt fires.

Every release decision — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback — emits a **release receipt**: a JSON-with-SHA-256 artifact, hash-chained to the previous receipt for this customer and the previous receipt for this release, anchored externally on a schedule the customer configures.

When the release is backed by an **open-weights model** — Gemma, Qwen, Llama, Mistral, GPT-OSS, anything where the weights are addressable and editable — the receipt embeds a [vindex attestation](/compliance/): a cryptographic proof that the active weights at decision time are the weights the manifest registered. That's the path that satisfies the harder compliance asks (GDPR Article 17 right-to-erasure, EU AI Act provenance) because you can prove not just *what was deployed* but *that the underlying weights are what they claim to be*.

When the release is backed by a **closed-weights model** — OpenAI, Anthropic, Google, anything served only via an opaque API — the receipt still covers the decision chain (which manifest, which gate result, which monitor reading, which user triggered which action) but cannot attest to the underlying weights, because we can't see them. That's not a limit of the pipeline; it's a limit of what's verifiable when the provider doesn't expose weights. Auditors who care about that distinction get the truthful answer in the receipt itself.

Either way, auditors today get logs. With this pipeline, they get *proofs* of everything that's actually provable. We did not see anybody else in the market shipping this. We expect they will — the EU AI Act timelines make it eventually inevitable. We chose to ship it now.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Horizontal bar chart of rollback time, log-scale minutes. Atlassian April 2022 outage: 720 minutes (12 hours) per-site restoration. Cloudflare June 21 2022 outage: 44 minutes to revert. DORA elite-performer failed deployment recovery threshold: under 60 minutes. AWS SageMaker canary deployment-guardrail termination wait default: 10 minutes. Divinci automated routing flip via release manifest: 12 seconds. Each bar label is a link to its numbered source in the references below." style="width: 100%; height: auto; display: block;">
  <title>Rollback time — measured numbers from primary sources</title>
  <rect width="900" height="380" fill="#faf8f5"/>
  <text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Rollback time — measured numbers from primary sources</text>
  <text x="40" y="56" font-size="12" fill="#6b5d4f">Specific incidents and platform-documented limits, not estimates. Each bar links to its source in the references below.</text>
  <g stroke="#d4c8b0" font-size="10" fill="#8a7d68">
    <line x1="280" y1="320" x2="280" y2="80" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="860" y2="320" stroke="#2d3c34" stroke-width="1.2"/>
    <line x1="280" y1="320" x2="280" y2="325"/><text x="280" y="340" text-anchor="middle">0.1</text>
    <line x1="406" y1="320" x2="406" y2="325"/><text x="406" y="340" text-anchor="middle">1</text>
    <line x1="531" y1="320" x2="531" y2="325"/><text x="531" y="340" text-anchor="middle">10</text>
    <line x1="657" y1="320" x2="657" y2="325"/><text x="657" y="340" text-anchor="middle">100</text>
    <line x1="782" y1="320" x2="782" y2="325"/><text x="782" y="340" text-anchor="middle">1000</text>
    <line x1="406" y1="320" x2="406" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="531" y1="320" x2="531" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="657" y1="320" x2="657" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
    <line x1="782" y1="320" x2="782" y2="83" stroke="#e8dcc4" stroke-width="0.5"/>
  </g>
  <text x="570" y="360" font-size="11" fill="#6b5d4f" text-anchor="middle">minutes (log scale)</text>
  <g>
    <text x="272" y="103" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Atlassian, Apr 2022</text>
    <text x="272" y="117" text-anchor="end" font-size="10" fill="#6b5d4f">per-site restoration</text>
    <rect x="280" y="91" width="484" height="32" fill="#a04848" rx="2"/>
    <text x="774" y="113" font-size="11" font-weight="600" fill="#1e3a2b">720 min<a href="#ref-1"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[1]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="158" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">Cloudflare, Jun 2022</text>
    <text x="272" y="172" text-anchor="end" font-size="10" fill="#6b5d4f">config revert</text>
    <rect x="280" y="146" width="332" height="32" fill="#c87b3c" rx="2"/>
    <text x="622" y="168" font-size="11" font-weight="600" fill="#1e3a2b">44 min<a href="#ref-2"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[2]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="213" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">DORA elite</text>
    <text x="272" y="227" text-anchor="end" font-size="10" fill="#6b5d4f">performer threshold</text>
    <rect x="280" y="201" width="349" height="32" fill="#b8a080" rx="2" opacity="0.6"/>
    <text x="639" y="223" font-size="11" font-weight="600" fill="#1e3a2b">&lt; 60 min<a href="#ref-3"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[3]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="268" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="600">AWS SageMaker</text>
    <text x="272" y="282" text-anchor="end" font-size="10" fill="#6b5d4f">termination wait default</text>
    <rect x="280" y="256" width="251" height="32" fill="#7a9580" rx="2"/>
    <text x="541" y="278" font-size="11" font-weight="600" fill="#1e3a2b">10 min<a href="#ref-4"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[4]</tspan></a></text>
  </g>
  <g>
    <text x="272" y="320" text-anchor="end" font-size="11" fill="#1e3a2b" font-weight="700">Divinci automated</text>
    <text x="272" y="334" text-anchor="end" font-size="10" fill="#2d5a4f">routing-flip via manifest</text>
    <line x1="280" y1="328" x2="318" y2="328" stroke="#2d5a4f" stroke-width="14" stroke-linecap="butt"/>
    <text x="328" y="332" font-size="11" font-weight="700" fill="#2d5a4f">12 s<a href="#ref-5"><tspan font-size="9" fill="#2d5a4f" text-decoration="underline" baseline-shift="super">[5]</tspan></a></text>
  </g>
</svg>
</figure>

These are not our numbers — they are published primary-source numbers from real postmortems, platform documentation, and the DORA framework. The contrast is what motivates Divinci's design. Atlassian's April 2022 outage<sup><a href="#ref-1">[1]</a></sup> took twelve hours per site because the state was spread across multiple systems that had to be coordinated back into agreement. Cloudflare's June 2022 outage<sup><a href="#ref-2">[2]</a></sup> took forty-four minutes to revert because, in their own words, engineers walked over each other's reverts. AWS SageMaker's canary deployment guardrails<sup><a href="#ref-4">[4]</a></sup> document a default ten-minute termination wait before the rollback fully completes. The DORA<sup><a href="#ref-3">[3]</a></sup> elite threshold for failed-deployment recovery is "under one hour" — that's the bar a high-performing org is expected to clear, not the ceiling.

Twelve seconds is not a magic number either. It's the time required for the routing layer to drain in-flight requests, swap the active manifest, and ack the new state across regions. The slow part is in-flight drain. There is no faster path that doesn't drop responses mid-generation.

## What this is, that other LLM release tools aren't

We surveyed twelve other tools in 2026 before we built this — LangSmith Deployment, W&B Models, MLflow, SageMaker Deployment Guardrails, Vertex AI Endpoints, Seldon Core, BentoCloud, KServe, Humanloop, Braintrust, Patronus AI, Arize Phoenix. They cluster into two camps that don't quite meet.

The **eval-CI camp** — Braintrust, Humanloop, Patronus — gates PR merges on offline eval scores. They never touch the running service. When the model is in production and quality drops, they alert; somebody else has to rollback.

The **serving-canary camp** — SageMaker Deployment Guardrails, KServe, Vertex AI, BentoCloud, Seldon Core — splits traffic and auto-rollbacks. But every one of them triggers on infrastructure metrics: p99 latency, error rate, CloudWatch alarms. None of them auto-rollback on a quality regression. They can't, because they don't have a judge running on production output.

The seam between "passed eval at PR merge" and "live canary scored on the user journeys we actually care about" is a manual handoff every team currently has to bridge themselves. The blog post calls that out as the dominant 2026 failure mode<sup><a href="#ref-6">[6]</a></sup>. We closed it. Specifically:

1. **The gate is sliced.** Per-domain Spearman ρ against a human-anchored grader, not a single global score. Slice-blindness is what every other gate has.
2. **The canary watches output quality, not just p95.** Continuous trace-replay through the candidate, scored by the same judge that powered the gate. This is the missing seam.
3. **Every decision emits a release receipt.** Hash-chained, externally anchorable, in the JSON-with-SHA-256 format that backs our compliance pages. For open-weights model backings — Gemma, Qwen, Llama, Mistral, GPT-OSS — the receipt embeds a vindex weight-attestation so auditors can prove what the live weights actually were. For closed-API backings, the receipt covers the decision chain but doesn't claim weight provenance, because the provider doesn't expose weights. Either way, auditors get proofs of what's actually provable, not just logs.

That's it. Generic canary, version registry, infra-metric rollback — those are commodity. We did not write a generic canary.

## What this does not solve

Three honest limitations:

**The gate is only as good as the dataset.** A scored-QA suite that doesn't cover the domain a customer actually uses won't catch regressions in that domain. We've seen this twice. Both times the customer's first move was to ship a new scored-QA suite, not to change the model. That's the correct move.

**The rollback assumes the previous release was good.** If a regression has been live for three releases and nobody noticed, rolling back one release just buys you a slightly less-bad model. The audit trail helps here — you can roll back to any prior manifest by SHA, not just N-1.

**Cold-start releases bypass the canary.** A brand-new model with no production traffic to compare against can't be canaried meaningfully. We force a 24-hour shadow deployment instead, which observes outputs without serving them. It's slower and less convenient. It's also the only honest answer.

## The smallest version of this you can run

If you want to stand up something like this without using Divinci, the minimum viable version is roughly:

1. A registry that stores model + prompt + routing + dataset as a single immutable artifact, addressed by content hash
2. A judge calibrated against a human-anchored panel via Spearman ρ — and a gate decision that consults *per-slice* scores, not just the aggregate
3. A traffic splitter that holds at checkpoints and consults a freshness-bounded quality monitor — where the monitor *replays recent production traces* through the candidate, not just samples synthetic ones
4. A routing layer whose state can be swapped atomically — including the prompt template, not just the weights
5. An audit log that emits a hash-chained, externally-anchorable receipt for every release decision — plus a weight-attestation embed when the model is open-weights, since closed-API releases physically can't be attested at the weight level

Most teams already have (1) and (3). The painful parts are (2), (4), and (5). The reason Divinci exists is that we built all five for ourselves first, then realized everyone else was going to need them too.

If you want to skip the build, [the API reference is here](/api/), and the release endpoints in the section "Release Management" are the entire surface of this pipeline. The compliance side — what those vindex receipts look like and how they map onto the EU AI Act, GDPR Article 17, HIPAA, and NIST AI RMF — is on [the compliance page](/compliance/). Every command in this post is a real endpoint.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://www.atlassian.com/blog/atlassian-engineering/post-incident-review-april-2022-outage" target="_blank" rel="noopener">Atlassian — <em>Post-Incident Review: April 2022 Outage</em></a>. From the writeup: "The accelerated Restoration 2 approach took approximately 12 hours to restore a site." Full restoration of 883 customer sites took 14 days. State spread across infrastructure, backups, and per-site validation drives the per-site number into hours rather than minutes.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare — <em>Cloudflare outage on June 21, 2022</em></a>. Timeline cited verbatim in the post: "06:58: Root cause found and understood. Work begins to revert the problematic change… 07:42: The last of the reverts has been completed." Forty-four minutes from "we know what to revert" to "the revert is done," in part because engineers were stepping on each other's reverts.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://dora.dev/guides/dora-metrics/" target="_blank" rel="noopener">DORA — <em>Software delivery performance metrics</em></a>. The "failed deployment recovery time" elite-performer threshold is documented as under one hour. Low performers measure in weeks-to-months in DORA's historical reports.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">AWS SageMaker — <em>Use canary traffic shifting</em></a> and the companion <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener"><em>Auto-Rollback Configuration and Monitoring</em> page</a>. The example <code>TerminationWaitInSeconds</code> is 600 (ten minutes); <code>MaximumExecutionTimeoutInSeconds</code> is bounded at 1800 (thirty minutes). Rollback fires within the baking window once an alarm trips: "If any of the alarms trip during the baking period, then SageMaker AI initiates a rollback and all traffic returns to the blue fleet."
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    Divinci AI — atomic routing-flip via release manifest. Twelve seconds is the in-flight drain time on a ~100-replica service; the manifest swap itself is sub-second. The number is from our own service, not a benchmark; the architecture that makes it possible is the bundled manifest described above (Stage 1 — Register).
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">Tianpan — <em>The Semver Lie: how an LLM minor update breaks production</em> (April 2026)</a>. The writeup names the failure pattern directly: "passed code review, deployed without eval gates, hit production without per-user A/B, and triggered no automatic rollback." A companion post — <a href="https://tianpan.co/blog/2026-04-27-llm-postmortem-template-fields-sre-missed" target="_blank" rel="noopener"><em>LLM postmortem template — fields SRE missed</em></a> — enumerates the slice / journey / per-user fields that current postmortems systematically omit.
  </li>
</ol>

A note on what isn't on this chart. Kubernetes `kubectl rollout undo` time is governed by your `maxSurge` / `maxUnavailable` settings and pod warm-up, not the command itself, and we couldn't find a primary source publishing a measured number in the way the above four sources do — so we left it off rather than fill it in with an estimate.

---

*Next in this series:* **10 CI/CD release failures we've caught in custom LMs, and which stage of the pipeline catches each one.** Three of the ten are slice-aware regressions that an aggregate gate would have shipped. Two more are silent quality drops that an infra-metric canary would have promoted. The rest are the kind of failure mode every release pipeline is supposed to catch — we list them because it's worth saying out loud which ones an aggregate-gated pipeline does, in fact, catch on its own.
