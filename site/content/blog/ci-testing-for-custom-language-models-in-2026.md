+++
title = "CI Testing for Custom Language Models in 2026"
description = "Contract tests, smoke budget, cost-aware fleet sizing, and shadow CI. How to keep a 12-minute eval suite tractable on every PR without slowing the team."
date = 2026-05-26T09:30:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "LLM Ops", "Testing", "Evaluation", "Release Management", "Engineering Productivity"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ci-testing-for-custom-language-models-in-2026-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/ci-testing-for-custom-language-models-in-2026-hero-poster.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/ci-testing-for-custom-language-models-in-2026-hero.webp"
reading_time = 13
summary = "The post 7 regression suite costs real money to run on every PR. This is how we keep the same coverage at a fraction of the cost — sub-second contract tests, a 90-second smoke layer, embedding-cache + judge-batching, and a 2-week shadow window before any gate starts blocking. The final post in the series."
+++

*Notes from the Release Cycle — Part 8 (final)*

You ship the regression suite from [post 7](/blog/automated-regression-testing-for-custom-llms-in-2026/). It works. The slice-aware gates catch real bugs. The calibrated judge holds.

Then your engineering lead asks how much it costs to run on every PR. You do the multiplication: ~12 minutes of judge inference per PR, 60 PRs a day, four dimensions × seventeen slices, and the bill is real money. Worse, every developer is now waiting 12 minutes for a green check on a one-line prompt typo. Velocity drops<sup><a href="#ref-1">[1]</a></sup>, the team grumbles, someone proposes "just run the gates nightly" — which is precisely how you give up everything the gates were supposed to do.

The fix is not less testing. The fix is **testing in layers, with most of the signal arriving in the first ninety seconds.** This post is what runs underneath the gate suite: sub-second contract tests, a tight smoke layer, a cost-aware fleet, and a two-week shadow window before any new gate blocks anyone.

This is post 8, the last of this series. By the end you will have the full picture — from the [four-stage pipeline](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) down to the contract-test fixture that runs on every commit.

## What does CI mean for a custom language model?

CI for a custom LLM is the work the gate suite does not have to repeat. The gate scores semantic quality; CI catches everything that would make the gate's score meaningless before the gate spends a single judge token.

Contract tests run in milliseconds and verify that prompt templates still render, that tool-call schemas still parse, that retrieval indices still respond, that the manifest still references hashes that actually exist. They are deterministic, free, and the only reason the rest of the pipeline can afford to exist. A pull request that breaks the prompt template should fail in 200 ms, not after 12 minutes of judge inference scoring nonsense.

The contract layer is the difference between a CI bill that scales linearly with PR volume and one that does not. Divinci's CI runner spends > 90% of its judge budget on real semantic evaluation, not on PRs that would have failed a schema check. That ratio is the headline number.

## Why traditional CI breaks for LLMs — through the cost lens

Posts [1](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) and [7](/blog/automated-regression-testing-for-custom-llms-in-2026/) covered why deterministic CI fails for a generative model. The version of that story this post is about is the **cost** of those four properties, not the existence of them.

| Property of LLMs | Traditional-CI failure | Cost shape |
|---|---|---|
| Non-deterministic outputs | Exact-match assertions flake | Re-runs amplify cost linearly with flake rate |
| Multi-dimensional quality | Single boolean is uninformative | Each dimension is a separate (paid) judge call |
| Provider drift | Pinned `gpt-4-2024-01-01` quietly retires | Recalibration burst when a provider sunsets a checkpoint |
| Non-local prompt effects | Local unit test cannot catch the effect | Distribution-shape changes between PRs, not within them — needs whole-suite re-run, not delta |

The CI architecture has to make each of these affordable. Contract tests handle property 1 and 3 cheaply. Smoke tests handle property 4 partially. Only the full suite handles property 2 — and only on the PRs that actually need it.

## The CI layer cake — sub-second to twenty-five minutes

The architecture we ship is four layers, each one earning its compute by catching what the cheaper layers below cannot. The slice-aware framing of every layer follows the same lesson the [Tianpan Semver Lie postmortem](/blog/automated-regression-testing-for-custom-llms-in-2026/) made explicit<sup><a href="#ref-4">[4]</a></sup>: aggregate signals lie; per-slice signals catch what aggregates hide.

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 460" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Four-layer CI architecture: contract tests sub-second, smoke 90s, full suite 12 minutes, production-trace replay 25 minutes">
<rect width="900" height="460" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">CI layer cake — each layer narrows the funnel of PRs reaching the next</text>
<text x="450" y="58" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Most PRs touch only the top two layers. Cost-per-PR figures are internal — measured on Divinci's production CI.</text>
<g transform="translate(60, 100)">
<rect x="0" y="0" width="780" height="62" fill="#7a8a4a" rx="4"/>
<text x="20" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">① Contract · every commit · &lt; 1 s · ~$0.00</text>
<text x="20" y="48" font-family="'DM Sans', sans-serif" font-size="12" fill="#e8ebd8">schema · template render · denylist · manifest integrity · index liveness</text>
<text x="775" y="38" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% of commits</text>
<rect x="60" y="78" width="720" height="62" fill="#5a7a8f" rx="4"/>
<text x="80" y="106" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">② Smoke · every PR · ~90 s · ~$0.05</text>
<text x="80" y="126" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">20–30 critical cases on the top 3 slices · task + safety only</text>
<text x="775" y="116" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">100% of PRs</text>
<rect x="120" y="156" width="660" height="62" fill="#5a7a8f" rx="4" opacity="0.85"/>
<text x="140" y="184" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">③ Full suite · prompt / model / retrieval PRs · ~12 min · ~$0.80</text>
<text x="140" y="204" font-family="'DM Sans', sans-serif" font-size="12" fill="#dde6ec">~500 cases · 4 dimensions · all slices · per-slice Spearman gates</text>
<text x="775" y="194" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~22% of PRs</text>
<rect x="180" y="234" width="600" height="62" fill="#2d5a4f" rx="4"/>
<text x="200" y="262" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5">④ Production-trace replay · release candidates · ~25 min · ~$2.40</text>
<text x="200" y="282" font-family="'DM Sans', sans-serif" font-size="12" fill="#c8d8d0">14-day replay window · same calibrated judge · offline ↔ replay gap analysis</text>
<text x="775" y="272" font-family="'DM Sans', sans-serif" font-size="13" font-weight="700" fill="#faf8f5" text-anchor="end">~4% of PRs</text>
</g>
<g transform="translate(60, 410)">
<rect x="0" y="0" width="780" height="34" fill="#1e3a2b" rx="4"/>
<text x="20" y="22" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#faf8f5">Aggregate cost per PR (weighted by funnel): ~$0.27. Aggregate p95 wall-clock: ~3.4 min.</text>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Layer wall-clock, per-layer cost, and funnel ratios are internal — measured on Divinci production CI for a representative customer (~500 golden-dataset cases, 17 slices, ~60 PRs/day).</figcaption>
</figure>

The cost shape is the design. ~74% of PRs never spend a judge token — contract or smoke is enough. The PRs that do reach the full suite are the ones that touched a prompt, a model config, a retrieval index, or evaluation code — exactly the changes where the gate suite is the only signal worth trusting. Release candidates are the small share that reaches Layer 4.

## Contract tests — the unfair advantage

Contract tests are the first line, the cheapest line, and the line most teams skip because they feel beneath the dignity of an "AI evaluation pipeline." They are also where 30–40% of would-be regressions actually fail in our customers' suites, before a single judge has been called.

The contract layer asserts five things and nothing else:

1. **Prompt-template render.** Every template renders against a canonical fixture without unbound variables, runaway loops, or broken Jinja-style includes.
2. **Tool-call schema.** Every declared tool's argument schema parses, the JSONSchema is valid, and the rendered prompt actually references all required slots.
3. **Manifest integrity.** Every SHA in the release manifest — model, prompt, retrieval index, judge, dataset — corresponds to an artifact that exists in the registry. Dangling pointers fail here, not three layers in.
4. **Index liveness.** The retrieval index responds to a known query within budget. A rebuilt index that quietly broke retrieval surfaces here, not in production.
5. **Denylist & token-budget.** Any prompt template that introduced a forbidden token, blew the per-call token budget, or rendered past the context window fails here. Heuristic semantic-similarity scoring<sup><a href="#ref-6">[6]</a></sup> is also cheap enough to run at the contract layer for fuzzy-match denylist coverage where literal-string matching is insufficient.

```bash
# A representative contract test invocation — runs in roughly 600 ms
divinci ci contract \
  --manifest release/staging.yaml \
  --check schema,template,manifest,index,denylist \
  --fail-fast \
  --json-out /tmp/contract-report.json
```

None of these calls a judge. None of them is non-deterministic. None of them costs measurable money. And every one of them rules out an entire class of "the gate suite said the medical slice regressed" alerts that would have wasted a full 12 minutes of judge inference scoring output the model never could have produced correctly in the first place.

## The smoke layer — 90 seconds, ~$0.05 per PR

If the contract layer is the cheap unfair advantage, the smoke layer is the one that actually catches regressions for less than the price of a coffee. Twenty to thirty cases drawn from the highest-volume slices, scored on **task completion and safety only**, no faithfulness, no latency, no retrieval-grounded checks. Every PR runs this. It takes about 90 seconds because the cases are batched into a single judge call with a structured-output schema, and because the judge is the cheap calibrated judge — not the full-quality one used for release candidates.

We track which layer caught each shipped fix in a regression log, and the histogram has been consistent over the last six months in customer deployments:

<figure style="margin: 2rem 0;">
<svg viewBox="0 0 900 360" xmlns="http://www.w3.org/2000/svg" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Bar chart showing where regressions get caught: 31 percent at the contract layer, 27 percent at smoke, 28 percent at full suite, 11 percent at replay, 3 percent escape to production">
<rect width="900" height="360" fill="#faf8f5"/>
<text x="450" y="34" font-family="'DM Sans', -apple-system, sans-serif" font-size="19" font-weight="700" fill="#1e3a2b" text-anchor="middle">Where regressions get caught — by layer, last 6 months across customer deployments</text>
<text x="450" y="56" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">Most regressions die in the cheapest layers. The expensive layers earn their cost on the residual.</text>
<g transform="translate(90, 100)">
<line x1="0" y1="200" x2="780" y2="200" stroke="#1e3a2b" stroke-width="1.5"/>
<g font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862">
<text x="-10" y="4" text-anchor="end">40%</text><line x1="-4" y1="0" x2="0" y2="0" stroke="#1e3a2b"/>
<text x="-10" y="54" text-anchor="end">30%</text><line x1="-4" y1="50" x2="0" y2="50" stroke="#1e3a2b"/>
<text x="-10" y="104" text-anchor="end">20%</text><line x1="-4" y1="100" x2="0" y2="100" stroke="#1e3a2b"/>
<text x="-10" y="154" text-anchor="end">10%</text><line x1="-4" y1="150" x2="0" y2="150" stroke="#1e3a2b"/>
<text x="-10" y="204" text-anchor="end">0%</text>
</g>
<g>
<rect x="40" y="45" width="120" height="155" fill="#7a8a4a" stroke="#1e3a2b" stroke-width="1"/>
<text x="100" y="36" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">31%</text>
<text x="100" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Contract</text>
<text x="100" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">&lt; 1 s · $0.00</text>
</g>
<g>
<rect x="190" y="65" width="120" height="135" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1"/>
<text x="250" y="56" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">27%</text>
<text x="250" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Smoke</text>
<text x="250" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">90 s · $0.05</text>
</g>
<g>
<rect x="340" y="60" width="120" height="140" fill="#5a7a8f" stroke="#1e3a2b" stroke-width="1" opacity="0.85"/>
<text x="400" y="51" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">28%</text>
<text x="400" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Full suite</text>
<text x="400" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">12 min · $0.80</text>
</g>
<g>
<rect x="490" y="145" width="120" height="55" fill="#2d5a4f" stroke="#1e3a2b" stroke-width="1"/>
<text x="550" y="136" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#1e3a2b" text-anchor="middle">11%</text>
<text x="550" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#1e3a2b" text-anchor="middle">Replay</text>
<text x="550" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#5a6862" text-anchor="middle">25 min · $2.40</text>
</g>
<g>
<rect x="640" y="185" width="120" height="15" fill="#a04848" stroke="#1e3a2b" stroke-width="1"/>
<text x="700" y="176" font-family="'DM Sans', sans-serif" font-size="20" font-weight="700" fill="#a04848" text-anchor="middle">3%</text>
<text x="700" y="222" font-family="'DM Sans', sans-serif" font-size="13" font-weight="600" fill="#a04848" text-anchor="middle">Escaped</text>
<text x="700" y="238" font-family="'DM Sans', sans-serif" font-size="11" fill="#a04848" text-anchor="middle">→ rollback</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.5rem;">Rolling-six-month aggregate across active Divinci CI deployments. Reported as the % of confirmed regressions where the layer named was the first to fail. Internal — measured by us.</figcaption>
</figure>

The 3% that escape are why [post 5's instant rollback](/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) exists. The gates do not promise zero escapes; they promise a tight upper bound and a fast recovery for what gets through.

## CI fleet sizing — how the 12-minute suite stays cheap

The full-suite layer is where the math has to work. A naïve implementation calls the judge once per case-per-dimension, runs them sequentially, and the bill scales linearly with case count. Three optimisations do most of the work to keep it tractable:

**Embedding cache.** The retrieval-context fingerprint for each golden-dataset case is hashed; if the case has not changed and the retrieval index has not changed, the cached embedding stands and the retrieval step is skipped. Hit rate after the first stable week is consistently above 90% in our customer deployments.

**Judge batching.** The calibrated judge is called with structured output, batching 8–16 cases per call. The judge's per-token cost stays the same; the per-case overhead drops because system prompt amortises across the batch. The threshold for safe batching is set by the judge's own calibrated agreement at that batch size<sup><a href="#ref-2">[2]</a></sup> — we measure this during the weekly judge-calibration pass ([post 7](/blog/automated-regression-testing-for-custom-llms-in-2026/)).

**KV-cache reuse across cases.** For models where the same system prompt and tool definitions head every call, the KV cache for that prefix is computed once per suite run, not once per case<sup><a href="#ref-3">[3]</a></sup>. On open-weights deployments this is straightforward; on closed-API models it depends on the provider's prefix-caching support.

The combined effect lands the full suite at roughly the cost numbers shown in the layer-cake diagram above. The exact figures are internal, but the ratio is the public claim: **~74% of PRs spend zero judge dollars; ~22% spend pennies; the remaining 4% spend a couple of dollars for the highest-confidence pre-rollout signal we know how to produce.**

## Shadow CI — turn it on without breaking the team

The single mistake we have watched teams make most often is flipping a new gate from "off" to "blocking" on day one. The thresholds were tuned on yesterday's data, the false-positive rate is unknown, and the first time the gate fires the team has no calibration for whether it is real or a false alarm. The on-call eval engineer gets paged, the gate gets disabled, trust is gone, the project is dead.

The fix is *shadow CI*: run the new gate non-blocking for two weeks, post the result as a bot comment on every PR, and review the false-positive rate weekly before flipping it to blocking. The Divinci CI runner has a `--shadow` flag for exactly this. The PR comment looks the same as the eventual blocking version — same diff display, same per-slice breakdown — except it does not gate merge.

```bash
divinci ci run --layer=full --shadow --duration=14d --report-as=bot-comment
```

When the false-positive rate is below 5% sustained across the window, we flip it. When it is not, we tighten the per-slice thresholds, recalibrate the judge, and shadow again. Either way the team has not been ambushed by a new gate that fires on day one.

## A GitHub Actions workflow that actually composes

The piece that ties the layer cake into your existing CI runs in `.github/workflows/llm-ci.yaml`. The layers are wired so the cheap ones fail fast and the expensive ones only run when they need to — `needs:` chains and path-filtered triggers do the work<sup><a href="#ref-5">[5]</a></sup>.

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

Three things to notice. Layers chain via `needs:`, so smoke does not run on a broken contract and full does not run on broken smoke. The `full` job is path-filtered to the changes that actually warrant a 12-minute run — a typo fix in the README does not trigger the gate suite. The `--post-pr-comment` flag is what makes the per-slice diff visible without leaving GitHub.

## The failed-PR debug loop

The other half of "the gate fired" is "show me why." A regression-suite output of `medical slice task-completion dropped 0.04` is unactionable without the cases that caused it. We surface the five worst per-slice diffs in the PR comment, with the original input, the baseline output, the candidate output, and the judge's reasoning trace. The debug loop is meant to take seconds, not minutes:

```bash
# Pull the 5 worst cases that fired the medical-slice gate on this PR
divinci ci diffs --pr 1247 --slice medical --dimension task_completion --top 5
```

This is the same diagnostic surface as [post 6's seven-step tree](/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/), wired into the CI feedback loop. The engineer who opened the PR sees the case-level evidence on the PR itself; they do not have to go open a separate eval dashboard.

## Version-control discipline — prompts, datasets, judges as code

Prompt templates, golden datasets, and judge prompts all live in the repo, hash-pinned in the release manifest. The manifest is the single object that ties the suite to a specific reproducible state:

```yaml
# manifests/staging.yaml — every CI run hashes this
release_id: rel-staging
model:     { sha: 0c1f9…, weights: r2://models/custom-v7.2,  open_weights: true }
prompt:    { sha: c4a8e…, template: prompts/support/v3.4.j2 }
retrieval: { sha: b21f0…, index: r2://indices/kb-2026-04 }
judge:     { sha: d8e21…, rubric: eval/rubrics/v7.yaml }
dataset:   { sha: a90b1…, file:   eval/datasets/golden-2026-04.jsonl }
```

When a CI run posts a score, the score is tagged with that manifest hash. When a score moves, the question "which input moved" has a direct answer: diff the manifest, and the layer that fired tells you which dimension to look at first. This is the loop the [post 1 four-stage pipeline](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) and the [vIndex receipt from post 4](/blog/validating-and-releasing-custom-lms-in-regulated-fields/) close together: the manifest is the audit primitive that all eight of these posts have, in different framings, been building toward.

## What this does not solve

The same three honest limitations we have been writing into every post in this series.

1. **CI does not test what is not in the suite.** No matter how clever the layer cake is, the only regressions it catches are the ones some case in the golden dataset would have flagged. The replay layer mitigates this for behaviour drift, but novel queries that have never been seen still escape until they show up in production. The system has to be paired with production monitoring.
2. **Cost numbers shift with model pricing.** Every cost figure in this post depends on judge token rates, embedding rates, and inference rates that drift quarterly. The ratios — 74% / 22% / 4%, 31% / 27% / 28% / 11% / 3% — are the load-bearing claims; the dollar figures are illustrative for a moment in time.
3. **Provider-side checkpoint changes are still hard.** When a closed-API provider quietly updates the model behind a stable name, the contract layer cannot catch it; only the gate suite can, and only after the fact. We mitigate by pinning explicit checkpoint identifiers wherever the provider supports them, and by treating the day a checkpoint is announced as a triggering event for a full-suite re-baseline. We cannot prevent the underlying problem.

## Wrapping the series

This is post 8 of 8. The full arc:

1. [How to Build an LLM CI/CD Pipeline With Divinci AI](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) — the four-stage pipeline (Register / Gate / Roll / Observe) that everything since has lived inside.
2. [10 CI/CD Release Failures in Custom Language Models](/blog/10-ci-cd-release-failures-in-custom-language-models/) — the named 2026 failure modes, each mapped to the stage that should have caught it.
3. [12 QA and Release Management Capabilities for LLMs](/blog/12-qa-and-release-management-capabilities-for-llms/) — the capability matrix and the three-camps Venn that places Divinci against the alternatives.
4. [Validating and Releasing Custom LMs in Regulated Fields](/blog/validating-and-releasing-custom-lms-in-regulated-fields/) — the compliance deep-dive, regulator-to-stage mapping, vIndex receipts.
5. [Automated LLM CI/CD Pipelines With Instant Rollback](/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) — the operational layer, automation spectrum, auto-rollback receipt.
6. [How to Diagnose Custom LLM QA Failures in 7 Steps](/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/) — the diagnostic decision tree; the model is the right answer roughly one alert in seven.
7. [Automated Regression Testing for Custom LLMs in 2026](/blog/automated-regression-testing-for-custom-llms-in-2026/) — slice-aware Spearman gates, calibrated judges, closed-loop production-trace replay.
8. **This post.** The CI infrastructure that makes all of the above tractable on every PR.

The pieces compose: the [manifest](/api/) is the audit primitive, the gates are the safety layer, the diagnostic tree is the recovery loop, the [vIndex receipt](/compliance/) is the external anchor, and the layer cake is what makes the whole thing affordable to run on every commit. If your custom-LLM release process does not have these five together, the gap is what these eight posts have been about.

## FAQ

**What is the cheapest test I can run on every commit?**

A prompt-template render check. It runs in milliseconds, requires no judge, catches a surprising fraction of breakages, and never costs a measurable cent. If you are not running it yet, it is the single highest-ROI piece of CI we know how to recommend.

**How much should I expect a custom-LLM CI pipeline to cost?**

Cents per typical PR, low single dollars per release-candidate PR. The ratio depends on judge pricing and on what fraction of your PRs touch prompts or model config. The 4% release-candidate share above is typical; for products with frequent prompt iteration the share rises and the average climbs accordingly.

**Should I run the full suite on every commit?**

No. Path-filter to PRs that touch prompts, model config, retrieval, or eval code. For all other changes, contract + smoke is sufficient and a 12-minute wait on a README typo will lose you the team's trust within a sprint. The full suite is precious; spend it where the change can plausibly move a quality dimension.

**How do I introduce a new gate without breaking everyone?**

Two-week shadow window, non-blocking. Tune thresholds on the false-positive rate observed during the shadow. Flip to blocking only when sustained false-positive rate is below your tolerance (we use 5%). Anything else is how you get a gate everyone has learned to ignore.

**What is the single number I should track if I track only one?**

The fraction of confirmed regressions caught before production. The histogram in this post puts that at ~97% in mature Divinci deployments. The 3% that escape are why instant rollback exists. The 97% is what the suite is for.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DORA / Google Cloud.</strong> <a href="https://cloud.google.com/devops/state-of-devops" target="_blank" rel="noopener">"Accelerate State of DevOps — CI velocity, change-failure-rate and time-to-restore-service."</a> The cross-industry baselines that make "12 minutes per PR is too slow" a defensible claim and not an opinion.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zheng et al.</strong> <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener">"Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena."</a> arXiv:2306.05685. The empirical evidence that batched LLM-as-judge calls can preserve calibration at the batch sizes used in the smoke and full layers — the reason the cost numbers in this post are achievable.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pope et al.</strong> <a href="https://arxiv.org/abs/2211.05102" target="_blank" rel="noopener">"Efficiently Scaling Transformer Inference."</a> arXiv:2211.05102. The KV-cache reuse and prefix-sharing techniques cited in the CI-fleet-sizing section.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Pan, Tianpan.</strong> <a href="https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production" target="_blank" rel="noopener">"The Semver Lie: how a minor LLM update broke production."</a> 29 April 2026. The 2026 named failure mode for aggregate-only regression suites; the reason the CI layer cake is slice-aware all the way through.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>GitHub.</strong> <a href="https://docs.github.com/en/actions/using-jobs/using-jobs-in-a-workflow" target="_blank" rel="noopener">"GitHub Actions — chaining jobs with `needs:` and conditional execution."</a> The primitive the .yaml in this post composes against.
  </li>
  <li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Zhang et al.</strong> <a href="https://arxiv.org/abs/1904.09675" target="_blank" rel="noopener">"BERTScore: Evaluating Text Generation with BERT."</a> arXiv:1904.09675. The heuristic semantic-similarity metric referenced as an alternative to LLM-as-judge for the cheaper layers; not what we run at gate time, but useful in the contract layer for forbidden-phrase detection at scale.
  </li>
</ol>
