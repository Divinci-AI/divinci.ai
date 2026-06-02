+++
title = "Automated Regression Testing for Custom LLMs in 2026"
description = "How to build a regression suite that catches drift in the eval — not just the model. Slice-aware gates, calibrated judges, production-trace replay."
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
summary = "Most LLM 'regressions' are drift in the eval suite itself — judge calibration, slice coverage, prompt template, retrieval index. Here is the suite that catches those, scored per-slice with a calibrated judge and replayed against live production traces."
+++

*Notes from the Release Cycle — Part 7*

Friday at 4:47 PM you shipped a one-character prompt tweak. The aggregate eval score moved from 0.873 to 0.871 — well inside the noise floor. Monday morning your support queue is on fire over a class of queries you stopped looking at six months ago because they had been stable.

Nothing in the model regressed. The model is the same model. **The eval drifted out from under you.** Six months of slow growth in one customer segment never made it into the golden dataset, the judge prompt was last calibrated against humans in October, and the retrieval index quietly rebuilt itself last Wednesday on a refreshed embedding model.

This is what post 6 called out — [the model is the right answer roughly one alert in seven](/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/). Which means your regression suite has to detect drift in itself, not just in the model. This post is the suite.

## What is regression testing for a custom LLM, actually?

Software regression tests assert `output == expected` for fixed inputs. They work because the function is deterministic.

A language model is not a function in the same sense. The same prompt at temperature > 0 produces a distribution of valid completions, and "valid" is multi-dimensional: did it answer the question, is the answer grounded in the retrieved context, did it stay inside the safety envelope, did it come back inside the latency budget. So regression testing a custom LLM means **measuring the distribution of behaviour against a frozen baseline distribution** — across slices that matter to you, with judges that have been calibrated against humans, on inputs that look like your production traffic.

Three things have to be in place before any of this is meaningful:

1. A **golden dataset** that resembles production at the slice level, not in aggregate.
2. A **calibrated judge** — not "we use GPT-5 as judge," but "we measured Spearman ρ ≥ 0.7 against three human raters, last refreshed last week."
3. A **baseline manifest** — the exact model weights, prompt template, retrieval index, and judge version that scored what they scored. Without this you cannot tell whether the score moved because the model changed or because the ruler changed.

Divinci runs all three as first-class objects, hash-linked, scored on every commit. The rest of this post is how to assemble them.

## Why most LLM regression suites fail to catch real regressions

The dominant 2026 failure mode for custom LLMs is what Tianpan's Sigma Inference team named the *Semver Lie* in their April 2026 postmortem<sup><a href="#ref-1">[1]</a></sup>: an aggregate metric stays flat or improves, while one or two production slices silently regress. The slice was below 5% of traffic when the test was designed, so it never made it into the golden dataset; six months later it is 12% of traffic, the model degraded on it, and the aggregate number was never going to notice.

We have looked at every public LLM-release postmortem from the past eighteen months and the pattern repeats: **the suite scored green because it scored the wrong thing.** Specifically:

- The golden dataset was hand-written by the team at launch and never re-stratified against shifted traffic distributions.
- The LLM-as-judge prompt was set once and never re-calibrated against human labels. Judge agreement decayed silently<sup><a href="#ref-2">[2]</a></sup>.
- The baseline scores were stored as raw numbers, not as `(model_sha, prompt_sha, judge_sha, dataset_sha, score)` tuples — so when something regressed, no one could tell which of the four had moved.

A regression suite that does not solve all three of these is just a CI step that turns green at deploy time and gives you false confidence. The fix is not "more cases." The fix is **slice-aware, version-anchored, judge-calibrated** measurement, on each release.

## Build a golden dataset that survives slice-aware analysis

The four-bucket composition we ship by default — production samples 60%, adversarial 15%, expert-curated edge cases 15%, failure replays 10% — is a reasonable starting point. What makes it actually catch regressions is the **slice metadata** attached to every case.

Every entry in the dataset carries: input, expected behaviour (rubric, not exact string), retrieval context (if any), and a `slice` tag — domain, user segment, query intent, language, length bucket, whichever decompositions matter for your product. The suite scores **per slice**, and any slice that drops past its threshold blocks the release, even if the aggregate score went up.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 520" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Golden dataset composition: 60% production sample, 15% adversarial, 15% expert edge cases, 10% failure replays, all stratified across slices">
<rect width="900" height="520" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">Golden dataset composition — stratified by slice on every axis</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Sized for ~500 cases. Bar segments are proportional. Per-slice coverage is the hard requirement, not the aggregate ratio.</text>
<g transform="translate(70, 100)">
<rect x="0" y="0" width="456" height="68" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="456" y="0" width="114" height="68" fill="#7a4848" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="570" y="0" width="114" height="68" fill="#b8a060" stroke="#1e3a2b" stroke-width="1.5"/>
<rect x="684" y="0" width="76" height="68" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1.5"/>
<text x="228" y="34" font-family="'DM Sans', sans-serif" font-size="16" font-weight="700" fill="#faf8f5" text-anchor="middle">Production sample</text>
<text x="228" y="54" font-family="'DM Sans', sans-serif" font-size="22" font-weight="700" fill="#faf8f5" text-anchor="middle">60%</text>
<text x="513" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Adversarial</text>
<text x="513" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">15%</text>
<text x="627" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#3a2e1c" text-anchor="middle">Expert edges</text>
<text x="627" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#3a2e1c" text-anchor="middle">15%</text>
<text x="722" y="32" font-family="'DM Sans', sans-serif" font-size="12" font-weight="600" fill="#faf8f5" text-anchor="middle">Replays</text>
<text x="722" y="52" font-family="'DM Sans', sans-serif" font-size="18" font-weight="700" fill="#faf8f5" text-anchor="middle">10%</text>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="228" y="90" text-anchor="middle">stratified production traces · refreshed quarterly</text>
<text x="513" y="90" text-anchor="middle">jailbreaks · injection</text>
<text x="627" y="90" text-anchor="middle">domain edges · long tail</text>
<text x="722" y="90" text-anchor="middle">postmortem replays ↑</text>
</g>
</g>
<g transform="translate(70, 250)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#1e3a2b">Every case carries slice tags — the suite scores each combination separately</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<rect x="0" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="37"><tspan font-weight="700" fill="#2d5a4f">domain</tspan> · legal / med / general</text>
<rect x="190" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="37"><tspan font-weight="700" fill="#2d5a4f">intent</tspan> · how-to / fact / refuse</text>
<rect x="380" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="37"><tspan font-weight="700" fill="#2d5a4f">language</tspan> · en / de / ja / …</text>
<rect x="570" y="16" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="37"><tspan font-weight="700" fill="#2d5a4f">length</tspan> · short / mid / long</text>
<rect x="0" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="10" y="77"><tspan font-weight="700" fill="#2d5a4f">segment</tspan> · enterprise / SMB</text>
<rect x="190" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="200" y="77"><tspan font-weight="700" fill="#2d5a4f">retrieval</tspan> · grounded / open</text>
<rect x="380" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="390" y="77"><tspan font-weight="700" fill="#2d5a4f">tool-use</tspan> · 0 / 1 / multi-step</text>
<rect x="570" y="56" width="180" height="32" fill="#eae3d5" stroke="#b8a080" stroke-width="1" rx="2"/>
<text x="580" y="77"><tspan font-weight="700" fill="#2d5a4f">novelty</tspan> · seen / OOD</text>
</g>
</g>
<g transform="translate(70, 380)">
<path d="M 380 0 L 380 32 M 372 24 L 380 32 L 388 24" stroke="#5a6862" stroke-width="1.5" fill="none"/>
<text x="430" y="20" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" font-style="italic">composition × slices = scoring grid</text>
</g>
<g transform="translate(70, 430)">
<rect x="0" y="0" width="760" height="70" fill="#1e3a2b" rx="4"/>
<text x="380" y="30" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Scored per slice on every release — Spearman ρ ≥ 0.7 vs baseline, per slice</text>
<text x="380" y="54" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0" text-anchor="middle">Any slice that crosses its threshold blocks the release. Aggregate score is informational only.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Diagram is structural. Stratification axes and per-slice thresholds are configured per product in the Divinci release manifest. Internal — defined in our own deployments.</figcaption>
</figure>

Two operational rules we have learned to enforce:

**Resample quarterly.** Production traffic distributions shift faster than most teams measure. We re-stratify the production-sample bucket against the last 90 days of traffic every quarter; if any slice grew past 5% of traffic and was under 2% of the golden dataset, it gets backfilled before the next release ships.

**Every postmortem adds a case.** A regression that reached production and was not caught is a case that was missing from the dataset. We add it to the replays bucket inside 48 hours of the postmortem and tag it with the slice that surfaced it.

## How do you detect drift before users do?

There are four distinct kinds of drift, and a regression suite that watches only the last one is a regression suite that misses most regressions.

| Drift type | What moves | Detection signal | Action |
|---|---|---|---|
| **Quality drift** | The judge's score for a fixed slice | Per-slice Spearman ρ vs baseline drops | Block release; diagnose per [post 6's tree](/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) |
| **Coverage drift** | Production traffic distribution vs golden dataset distribution | KL-divergence between slice proportions | Resample golden dataset |
| **Judge drift** | Judge model agreement with humans | Spearman ρ vs a frozen human-labelled audit set | Recalibrate judge prompt or replace judge |
| **Production drift** | Live production scores vs offline scores on the same model | Production-trace replay score gap | Investigate retrieval / preprocessing / runtime |

Quality drift is the one most suites measure; the other three are where Friday-afternoon regressions usually hide. Divinci tracks all four against the baseline manifest, with the per-slice score breakdown surfaced on every PR and a weekly judge-calibration job that flags drift before it accumulates.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 420" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="A 30-day chart showing the aggregate task-completion score staying flat at 0.87 while the medical-domain slice silently drops from 0.88 to 0.74">
<rect width="900" height="420" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">The Semver Lie, visualised — 30 days of task-completion score</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Aggregate (dark green) holds flat. The medical slice (red) silently regresses. Aggregate gates never fire.</text>
<g transform="translate(80, 100)">
<line x1="0" y1="0" x2="0" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<line x1="0" y1="250" x2="640" y2="250" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">0.95</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">0.90</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">0.85</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">0.80</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0.75</text><line x1="-4" y1="200" x2="0" y2="200" stroke="#1e3a2b"/>
<text x="-10" y="254" text-anchor="end">0.70</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="0" y="268" text-anchor="middle">d-30</text>
<text x="160" y="268" text-anchor="middle">d-22</text>
<text x="320" y="268" text-anchor="middle">d-15</text>
<text x="480" y="268" text-anchor="middle">d-7</text>
<text x="640" y="268" text-anchor="middle">today</text>
</g>
<line x1="0" y1="60" x2="640" y2="60" stroke="#b8a080" stroke-width="1" stroke-dasharray="4,3" opacity="0.65"/>
<text x="12" y="55" font-family="'DM Sans', sans-serif" font-size="10" font-weight="600" fill="#b8a080">aggregate gate threshold — 0.89</text>
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
<text x="664" y="46" font-weight="700" fill="#5a7a8f">legal slice</text>
<text x="722" y="46" fill="#5a7a8f">0.910</text>
<rect x="656" y="56" width="120" height="22" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="2"/>
<text x="664" y="72" font-weight="700" fill="#2d5a4f">aggregate</text>
<text x="722" y="72" fill="#2d5a4f">0.872</text>
<rect x="656" y="82" width="120" height="22" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1" rx="2"/>
<text x="664" y="98" font-weight="700" fill="#7a8a4a">general</text>
<text x="722" y="98" fill="#7a8a4a">0.863</text>
<rect x="656" y="200" width="148" height="38" fill="#faf8f5" stroke="#a04848" stroke-width="1.5" rx="2"/>
<text x="664" y="216" font-weight="700" fill="#a04848">medical slice</text>
<text x="664" y="232" fill="#a04848">0.743 today · breach ⚠</text>
</g>
<g font-family="'DM Sans', sans-serif" font-size="10" fill="#a04848">
<line x1="320" y1="200" x2="320" y2="108" stroke="#a04848" stroke-width="1" stroke-dasharray="3,3"/>
<text x="325" y="200" font-style="italic">slice gate would fire here ↑</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Stylised reconstruction of the Tianpan Sigma postmortem pattern<sup><a href="#ref-1">[1]</a></sup> using internal Divinci slice nomenclature. Specific values are illustrative.</figcaption>
</figure>

## Multi-dimensional evaluation — score four things at once, per slice

A single composite score is a worse signal than four scalar scores. We gate on four dimensions:

- **Task completion** — did the response actually answer the question, scored by a calibrated judge against a rubric. Slice-aware.
- **Faithfulness** — for any response that referenced retrieved context, is every claim grounded in that context. Hallucination shows up here first.
- **Safety** — refusal correctness, jailbreak resistance, PII / policy exposure. Almost always gates at ≥ 0.99 pass-rate; safety is a hard wall, not a soft trade-off.
- **Latency budget** — p95 within the slice's SLA. A prompt change that doubled tokens-per-response is a regression even if quality went up.

Each dimension has its own per-slice baseline and its own per-slice threshold. We never combine them into a single weighted scalar at gate time; we surface them as four scores per slice and block on whichever moved past its threshold first. A model that gained 4 points of task completion at the cost of 1 point of faithfulness on the medical slice is still a regression.

## What gates should block a custom LLM deployment?

We run a three-layer architecture, each layer gating a different stage of the pipeline ([see post 1 for the stage taxonomy](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)).

**Layer 1 — Smoke (every commit, ~90 seconds).** Twenty to thirty critical cases drawn from the highest-impact slices. Catches catastrophic regressions before the full suite spends compute. If smoke fails, the rest does not run.

**Layer 2 — Full suite (every PR, ~12 minutes).** The complete golden dataset, scored per slice on all four dimensions. Slice-aware Spearman ρ against the baseline manifest. Threshold breach blocks merge. The PR comment lists exactly which slice on which dimension moved by how much, with five example failing cases.

**Layer 3 — Baseline comparison (release candidates, ~25 minutes).** The candidate model is replayed against the last 14 days of production traces — the *closed-loop production-trace replay* we shipped in [post 1](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/). The same calibrated judge that scores the golden dataset also scores the replay outputs. Any slice whose replayed scores diverge from the offline scores by more than its threshold blocks the release. This layer is what catches drift the golden dataset does not yet know about.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 380" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Three-layer gate decision tree: smoke tests on every commit, full suite on every PR, production-trace replay on release candidates">
<rect width="900" height="380" fill="#faf8f5"/>
<text x="450" y="32" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Three-layer regression gate — each block fails fast, each layer adds depth</text>
<g transform="translate(40, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#7a8a4a" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">① Smoke · every commit</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: 20–30 critical</text>
<text x="14" y="82">Wall-clock: ~90 s</text>
<text x="14" y="102">Dims: task + safety only</text>
<text x="14" y="122">Slices: top 3 by volume</text>
<text x="14" y="148" font-weight="600">Blocks:</text>
<text x="14" y="168">catastrophic failures</text>
<text x="14" y="186">malformed outputs</text>
<text x="14" y="204">safety wall breaches</text>
<text x="14" y="226" font-style="italic" fill="#5a6862">fail-fast — full suite</text>
<text x="14" y="226" font-style="italic" fill="#5a6862" dx="0" dy="0"></text>
</g>
</g>
<g transform="translate(330, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#5a7a8f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">② Full suite · every PR</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: full ~500</text>
<text x="14" y="82">Wall-clock: ~12 min</text>
<text x="14" y="102">Dims: task / faith / safety / lat</text>
<text x="14" y="122">Slices: all stratified</text>
<text x="14" y="148" font-weight="600">Blocks:</text>
<text x="14" y="168">per-slice ρ &lt; 0.7</text>
<text x="14" y="188">any slice metric below thr</text>
<text x="14" y="208">judge agreement &lt; 0.65</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">PR comment lists which</text>
</g>
</g>
<g transform="translate(620, 70)">
<rect x="0" y="0" width="240" height="240" fill="#eae3d5" stroke="#b8a080" stroke-width="2" rx="6"/>
<rect x="0" y="0" width="240" height="38" fill="#2d5a4f" rx="6"/>
<text x="120" y="25" font-family="'DM Sans', sans-serif" font-size="14" font-weight="700" fill="#faf8f5" text-anchor="middle">③ Replay · release candidates</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="14" y="62">Cases: 14d of live traces</text>
<text x="14" y="82">Wall-clock: ~25 min</text>
<text x="14" y="102">Dims: all four · slice-aware</text>
<text x="14" y="122">Source: production-trace store</text>
<text x="14" y="148" font-weight="600">Blocks:</text>
<text x="14" y="168">offline ↔ replay score gap</text>
<text x="14" y="188">drift in slices not yet in</text>
<text x="14" y="206">the golden dataset</text>
<text x="14" y="230" font-style="italic" fill="#5a6862">last gate before rollout</text>
</g>
</g>
<g font-family="'DM Sans', sans-serif" fill="#7a8a4a">
<text x="305" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="305" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
<text x="595" y="183" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1">PASS</text>
<text x="595" y="215" text-anchor="middle" font-size="34" font-weight="700">→</text>
</g>
<g transform="translate(40, 330)">
<text x="0" y="0" font-family="'DM Sans', sans-serif" font-size="12" fill="#5a6862">All three layers score against the same baseline manifest — (model_sha, prompt_sha, retrieval_sha, judge_sha) — so a score moving identifies <tspan font-weight="600" fill="#1e3a2b">which</tspan> dimension drifted, not just <tspan font-weight="600" fill="#1e3a2b">that</tspan> something did.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Wall-clock numbers are internal — measured on Divinci's production CI runners for a representative customer with ~500 golden-dataset cases and ~14 days of production traces.</figcaption>
</figure>

## Calibrate your judge before you trust a single score it produces

LLM-as-judge is what makes any of this scale past a few hundred cases. It is also where a regression suite quietly stops working, because the judge has no obligation to remain calibrated as it gets updated or as your data distribution moves.

We calibrate every judge prompt against a frozen human-labelled audit set of at least 100 cases stratified across the same slices as the golden dataset, and we re-run the calibration weekly. The bar we ship at is **Spearman ρ ≥ 0.7** against the human-rater median, with **Cohen's κ ≥ 0.6** on binary safety judgments. Both of these are above the threshold where MT-Bench-style judges have been shown to track human raters at the level of inter-human agreement<sup><a href="#ref-2">[2]</a></sup>.

When the weekly calibration drops below threshold, the judge is automatically retired and the on-call eval engineer is paged. The release pipeline holds open candidates rather than gating them on a judge that is no longer measuring what it used to measure.

```bash
# Run the weekly judge calibration job
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

## The Divinci differentiator — closed-loop production-trace replay

The Layer 3 gate is the part most regression suites do not have. The flow is the same flow we shipped in post 1, with one specialisation for regression testing: every release candidate has its score on the offline golden dataset compared, slice by slice, to its score on a 14-day window of replayed production traces. The golden dataset measures what we expected the model to do. The replay measures what the model would actually have done last week.

When those two scores diverge by more than the per-slice gap budget, the release is blocked. The mismatch is the signal: either the golden dataset is no longer representative (coverage drift), or the candidate behaves differently on traces shaped by production preprocessing and retrieval (production drift). Either way, you find out before users do.

The judge that scores the offline run is the same judge that scores the replay run. The audit log records both score sets, both judge versions, the trace IDs that were replayed, and the gap that fired the block. The gap itself is the most useful diagnostic signal we have, and it is what gets handed to whoever picks up the [post 6 diagnostic tree](/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) next.

## Anchor the golden dataset with a vIndex receipt

Every score in the suite is meaningless if you cannot reproduce it later. We hash the golden dataset on each release and chain that hash into a vIndex receipt alongside the model SHA, prompt SHA, judge SHA, and the calibration record. The receipt is externally anchorable — auditors can replay our exact regression run six months later and verify the scores we claimed.

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
  "verifiable_at": "https://vIndex.divinci.ai/rel_3f1a-2026-05-26"
}
```

**Open-weights caveat.** The receipt above carries weight provenance only when the model is open-weights — vIndex anchors the actual weight bytes. For closed-API model backings (OpenAI / Anthropic / Google managed models), the receipt still carries the decision chain — every gate score, every judge result, the calibration record — but the weight field is empty, and you cannot independently verify the model artefact. We say this in the receipt and in the [compliance documentation](/compliance/) so auditors do not get a false impression. The releases that benefit most from a full vIndex chain are the ones where you control the weights.

## A four-phase implementation timeline that we have actually shipped

Teams that try to ship the full architecture in week one stall on tooling. The order below is the order that works.

**Phase 1 — Baseline (week 1).** Pull a stratified sample of the last 30 days of production traces. Have two engineers hand-label task completion on 100 cases each. Calculate the inter-rater agreement (target Cohen's κ ≥ 0.6). The number you get is your starting human-baseline; everything else gets calibrated against this.

**Phase 2 — Harness (weeks 2–3).** Stand up the evaluation harness on the 100-case dataset. Add a calibrated judge against your human labels. Verify the harness reproduces the human scores within ρ ≥ 0.7. Most teams discover their first judge prompt fails this and re-write it twice — this is normal.

**Phase 3 — Gates (weeks 3–4).** Wire the harness into CI as a warning, not a block. Watch it for two weeks. The thresholds you discover by watching false-positive rates are the only thresholds that survive. Promote to blocking only when the false-positive rate is below 5%.

**Phase 4 — Replay loop (ongoing).** Once gates are blocking reliably, enable the production-trace replay layer. This is where the slice-coverage gap surfaces, and where every postmortem starts adding cases back into the golden dataset.

## What this does not solve

Three honest limitations, the same way we have framed them every post in this series.

1. **Suite drift is endless work.** Regression testing is infrastructure, not a project. The golden dataset has to be re-stratified every quarter, the judge re-calibrated every week, the threshold budgets re-tuned every postmortem. There is no version of this where you ship a suite and walk away.
2. **A perfectly calibrated judge is still a model.** Spearman ρ = 0.74 against human raters means roughly a quarter of judge calls disagree with the human median. That residual disagreement is the noise floor on every score. We surface it explicitly in every release report; teams that forget it is there will be surprised by it eventually.
3. **Closed-API backings cap how much you can verify.** With a closed-API model, the regression suite measures behaviour but cannot verify weight provenance. If you need full reproducibility — regulated industries, audited deployments — the trade-off is on the model choice, not the suite.

## Up next

Post 8, the last in this series, finishes the loop on the inside of CI. Where this post and post 5 were about what runs at the gates, the next one is about the CI layer that produces the candidates the gates score in the first place — pre-merge evaluation, contract tests for prompt templates, and how to size the CI fleet for a 12-minute eval suite without bankrupting the budget. It is the engineering layer underneath everything we have written about so far.

## FAQ

**What is the difference between LLM evaluation and LLM regression testing?**

Evaluation measures whether a model meets a quality bar at a point in time, against an absolute rubric. Regression testing measures whether a candidate behaves the same as a frozen baseline, per slice, across multiple dimensions. The baseline is what makes it regression testing — Divinci ships both, and the regression mode pins (model_sha, prompt_sha, judge_sha, dataset_sha) so a moved score identifies which input moved.

**How many cases should a golden dataset have?**

Fewer than you think, stratified better than you think. We have shipped useful regression coverage with 200 cases on five well-defined slices and seen 5,000-case datasets that missed everything that mattered because they were unstratified. Start at 200, stratified, then grow the replay bucket case-by-case from postmortems.

**Should I use human reviewers or LLM-as-judge?**

Both, with humans calibrating the judge. Humans cannot keep up with the volume that a release-cycle CI gate needs to score. The judge fills the volume, the humans calibrate the judge — measured weekly with Spearman ρ ≥ 0.7. Either alone is a failure mode.

**How do I test for non-deterministic outputs?**

Score the distribution, not the string. Score with a rubric the judge can apply across phrasings, and run each input three to five times on temperature > 0 so the slice-aware score is over a distribution of completions rather than a single sample. Tighten temperature only for cases that genuinely need deterministic output (structured-output tool calls, classification).

**What metrics should I prioritise for the first CI quality gate?**

Task completion and one safety gate. Both per-slice. Adding more dimensions before the first two are calibrated produces noise; teams that ship more usually end up gating on the noise. Add faithfulness next when you turn on retrieval; add latency once the first two are stable.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 April 2026. The named 2026 failure mode for slice-aware regression analysis; aggregate scores hold flat while a low-volume slice silently regresses.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. Empirical evidence that strong LLM judges agree with human raters at roughly inter-human-agreement levels (≈ 80%) on open-ended tasks, with reported failure modes that calibrate-against-humans audits are designed to detect.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Kirkpatrick et al.</strong> <a href="https://arxiv.org/abs/1612.00796" target="_blank" rel="noopener">"Overcoming catastrophic forgetting in neural networks."</a> PNAS / arXiv:1612.00796. The foundational result on catastrophic forgetting in fine-tuned neural networks — why a fine-tuned custom LLM has to be regression-tested for general capability loss, not just gain on the target task.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Amazon Web Services.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails.html" target="_blank" rel="noopener">"SageMaker Deployment Guardrails — blue/green deployments and canary monitoring."</a> The closed-API contrast: gates on infrastructure metrics (latency, errors, CPU) rather than on per-slice semantic quality.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman, C.</strong> "The proof and measurement of association between two things." <em>American Journal of Psychology</em>, 15(1):72–101, 1904. The rank-correlation coefficient that anchors the slice-aware gate — robust to scoring-scale drift in the judge, which is the property we needed.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — change-failure-rate and time-to-restore-service metrics."</a> The cross-industry baseline for "how often deploys cause incidents" and "how fast you recover." Regression suites that block at the gate move the first metric down; instant rollback ([post 5](/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/)) moves the second.
  </li>
</ol>
