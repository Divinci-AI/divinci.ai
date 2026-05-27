+++
title = "How to Diagnose Custom LLM QA Failures in 7 Steps"
description = "Most 'QA failures' aren't model failures — they're eval-coverage gaps, judge mis-calibration, or training-serving skew. A 7-step diagnostic that rules out the six non-model causes before blaming the model."
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
summary = "When a QA alert fires on a custom LLM, the natural reflex is to blame the model. Across the rollouts we've run, the model is the right answer roughly one time in seven. The other six times, the bug is in the eval, the judge, the prompt SHA, the preprocessing pipeline, the dataset version, or the retrieval index. This post is the diagnostic tree we actually walk — in order, with the exact API call that answers each branch."
+++

*Notes from the Release Cycle — Part VI*

---

A scored-QA suite started flagging a customer's medical-Q&A model. The headline number — aggregate quality across all slices — dropped 6 points overnight. The team spent two days debugging the model. They re-ran fine-tunes. They rolled back to the prior release. The numbers didn't move.

On the morning of day three, somebody noticed the eval suite had been updated the same night the regression started. Three new pediatric-dosage prompts had been added to the test set, and the model had never seen pediatric dosage in training. The "QA failure" wasn't a model regression. It was a slice-coverage event: the eval started asking about something the model was never supposed to know.

Across our customer rollouts, this is the dominant pattern. **A "QA failure" alert is the symptom. The cause is the model roughly one time in seven.** The other six times, the bug is somewhere upstream: in the eval design, in the judge calibration, in the prompt SHA, in the preprocessing pipeline, in the dataset version, or in the retrieval index. Each of those classes of bug looks identical from the alert — a number went down — but has a completely different fix.

This post is the diagnostic tree we walk in order when an alert fires. Six steps that rule out non-model causes, before the seventh step considers the model itself. Each step has a concrete API call or query that answers it. By the time you've completed the six, you either know exactly what to fix, or you've earned the right to look at the model.

## The decision tree

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 480" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Diagnostic decision tree for a QA failure alert. Step 1 asks whether the eval covers this slice (if no, the alert is an eval-coverage gap). Step 2 asks whether the judge is calibrated against humans on this slice (if no, the alert is judge miscalibration). Step 3 asks whether the prompt template SHA matches production (if no, the alert is prompt drift). Step 4 asks whether preprocessing matches production (if no, the alert is training-serving skew). Step 5 asks whether the dataset SHA matches production (if no, the alert is dataset drift). Step 6 asks whether the retrieval index version matches production (if no, the alert is RAG-index drift). Only after all six rule out a non-model cause does Step 7 conclude that this is actually a per-slice model regression.">
<title>The 7-step diagnostic tree</title>
<rect width="900" height="480" fill="#faf8f5"/>
<text x="450" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="#1e3a2b">When a QA alert fires, walk down — not in</text>
<text x="450" y="52" text-anchor="middle" font-size="12" fill="#6b5d4f">Six steps rule out non-model causes. Only the seventh blames the model.</text>
<rect x="320" y="78" width="260" height="40" fill="#a04848" rx="6"/>
<text x="450" y="103" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">⚠  QA alert fires</text>
<line x1="450" y1="118" x2="450" y2="138" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,138 454,138 450,146" fill="#6b5d4f"/>
<rect x="280" y="148" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="167" font-size="11" font-weight="700" fill="#1e3a2b">1.</text>
<text x="305" y="167" font-size="11" font-weight="600" fill="#1e3a2b">Does the eval cover this slice?</text>
<text x="290" y="180" font-size="10" fill="#6b5d4f">→ if NO: eval-coverage gap. Update the suite, retest.</text>
<line x1="450" y1="184" x2="450" y2="198" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,198 454,198 450,206" fill="#6b5d4f"/>
<rect x="280" y="208" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="227" font-size="11" font-weight="700" fill="#1e3a2b">2.</text>
<text x="305" y="227" font-size="11" font-weight="600" fill="#1e3a2b">Is the judge calibrated to humans on this slice?</text>
<text x="290" y="240" font-size="10" fill="#6b5d4f">→ if NO: judge miscalibration. Recalibrate ρ. Re-eval.</text>
<line x1="450" y1="244" x2="450" y2="258" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,258 454,258 450,266" fill="#6b5d4f"/>
<rect x="280" y="268" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="287" font-size="11" font-weight="700" fill="#1e3a2b">3.</text>
<text x="305" y="287" font-size="11" font-weight="600" fill="#1e3a2b">Does the prompt template SHA match production?</text>
<text x="290" y="300" font-size="10" fill="#6b5d4f">→ if NO: prompt drift. Re-register the manifest.</text>
<line x1="450" y1="304" x2="450" y2="318" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,318 454,318 450,326" fill="#6b5d4f"/>
<rect x="280" y="328" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="347" font-size="11" font-weight="700" fill="#1e3a2b">4.</text>
<text x="305" y="347" font-size="11" font-weight="600" fill="#1e3a2b">Does the preprocessing pipeline match production?</text>
<text x="290" y="360" font-size="10" fill="#6b5d4f">→ if NO: training-serving skew. Bind preprocess SHA.</text>
<line x1="450" y1="364" x2="450" y2="378" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="446,378 454,378 450,386" fill="#6b5d4f"/>
<rect x="280" y="388" width="340" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="290" y="407" font-size="11" font-weight="700" fill="#1e3a2b">5.</text>
<text x="305" y="407" font-size="11" font-weight="600" fill="#1e3a2b">Does the dataset SHA match production?</text>
<text x="290" y="420" font-size="10" fill="#6b5d4f">→ if NO: dataset drift. Re-register with the right SHA.</text>
<line x1="450" y1="424" x2="630" y2="424" stroke="#6b5d4f" stroke-width="1.5"/>
<line x1="630" y1="424" x2="630" y2="148" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="626,148 634,148 630,156" fill="#6b5d4f"/>
<rect x="630" y="148" width="240" height="36" fill="#ffffff" stroke="#2d5a4f" stroke-width="1" rx="4"/>
<text x="640" y="167" font-size="11" font-weight="700" fill="#1e3a2b">6.</text>
<text x="655" y="167" font-size="11" font-weight="600" fill="#1e3a2b">Retrieval index SHA matches?</text>
<text x="640" y="180" font-size="10" fill="#6b5d4f">→ if NO: RAG-index drift.</text>
<line x1="750" y1="184" x2="750" y2="220" stroke="#6b5d4f" stroke-width="1.5"/>
<polygon points="746,220 754,220 750,228" fill="#6b5d4f"/>
<rect x="630" y="230" width="240" height="60" fill="#a04848" rx="6"/>
<text x="640" y="252" font-size="13" font-weight="700" fill="#faf8f5">7.</text>
<text x="655" y="252" font-size="13" font-weight="700" fill="#faf8f5">If all 6 pass:</text>
<text x="640" y="268" font-size="11" fill="#faf8f5">actual per-slice model regression.</text>
<text x="640" y="282" font-size="11" fill="#faf8f5">Commit. Roll back. Retrain.</text>
<text x="640" y="320" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">Empirically the model</text>
<text x="640" y="335" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">is the right answer</text>
<text x="640" y="350" font-size="10" font-style="italic" fill="#a04848" text-anchor="start" font-weight="700">about 1 alert in 7.</text>
</svg>
</figure>

The tree is sequential because the steps are cheap-to-expensive. Step 1 is a `git diff` of the eval suite; step 7 is a fine-tune cycle. You want to spend ten minutes on each of the six cheap checks before spending a week on the expensive one.

## Step 1 — Did the eval cover this slice?

**The symptom.** Aggregate quality drops, but the per-slice breakdown shows one slice cratering while the others are flat. Or — more confusingly — *every* slice drops slightly, all by similar amounts.

**The diagnostic.** Diff the eval suite manifest SHA against the prior release's. If the eval suite changed and you didn't change the model, the regression is in the eval, not the model.

```bash
# Compare the eval-suite manifest SHA between releases
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.eval_suite_sha256'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.eval_suite_sha256'
# Different? Your eval changed. Audit what was added.
```

**The fix.** Either revert the eval-suite change (if it was unintentional), or expand training coverage to match the new eval (if the new slice is a real production concern). Don't ship a model regression fix for an eval coverage problem — you'll make the model worse on what it actually used to do well.

**Where this hides in our pipeline.** [Stage 1 — Register](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-1-register) binds the eval-suite SHA into the release manifest. The diagnostic above is just diffing two manifests. The reason the bug took the medical-Q&A team two days is that they had no manifest-level diff — they were comparing model checkpoints, not release manifests.

## Step 2 — Is the judge calibrated to humans on this slice?

**The symptom.** A slice that's *new* to the eval suite scores poorly, but human review of the model's outputs on that slice rates them as fine. The judge thinks the model is failing; humans don't.

**The diagnostic.** Compute Spearman ρ between the LLM judge's ratings and a small human-rated sample (50 items) on the failing slice. If ρ &lt; 0.4, the judge is *not measuring* what humans measure on this slice.

```bash
curl -X POST https://api.divinci.ai/v1/judges/<judge_id>/calibrate \
  -d '{ "slice": "pediatric-oncology-dosing", "human_ratings_csv": "..." }'
# → { "spearman_rho": 0.31, "interpretation": "judge_uncalibrated_for_slice" }
```

**The fix.** Either select a different judge model for this slice, or use a chain-of-judges with an arbiter. MT-Bench<sup><a href="#ref-1">[1]</a></sup> shows GPT-4-as-judge agrees with humans &gt;80% on average but with per-category variance from 86% (coding) to 36–44% (writing/humanities). The variance is the operative number; "good on average" hides slices where the judge is wrong.

**Where this hides in our pipeline.** [Stage 2 — Gate](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/#stage-2-gate) demands a calibrated judge per slice. The [Calibrating the AI Judge](/blog/calibrating-the-ai-judge/) post documents the procedure. If the slice was added to the eval without a calibration step, you have a structurally untrustworthy gate.

## Step 3 — Does the prompt template SHA match production?

**The symptom.** Quality drops but the model_ref and dataset_ref are unchanged. Nothing about training changed. The model is the same model. And yet.

**The diagnostic.** Compare the `prompt_template_ref` SHA in the failing release manifest against the prior release's. A 38-character edit to a system prompt that "improves brevity" can change downstream behavior more than a full retrain.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.prompt_template_ref'
curl https://api.divinci.ai/v1/releases/rel_8f72b1 | jq '.prompt_template_ref'
# Different? Pull the diff. Look at it carefully.
```

**The fix.** Treat prompts as code. The [10 release failures post](/blog/10-ci-cd-release-failures-in-custom-language-models/#2-editing-a-system-prompt-in-a-dashboard-and-shipping-it-without-code-review) covers the dashboard-edit failure mode — Tianpan's *Semver Lie* postmortem<sup><a href="#ref-2">[2]</a></sup> names this as the dominant 2026 failure pattern. If you can prove the prompt changed, you've found your bug.

## Step 4 — Does the preprocessing pipeline match production?

**The symptom.** Model passes eval locally. Same model fails the same eval in production. Same model_ref, same prompt, same dataset.

**The diagnostic.** Pull the `preprocessing_ref` SHA from the production manifest and verify the eval ran with the same one. The classic case: training normalizes whitespace and lowercases; production doesn't. The eval ran through the production preprocessing; everything checked. Until somebody updated preprocessing one side only.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.preprocessing_ref'
# Compare to the preprocessing your training/eval harness actually used.
```

**The fix.** Containerize preprocessing as a versioned artifact. Reference it from the manifest. Refuse to deploy if the gate's preprocessing SHA differs from production's.

## Step 5 — Does the dataset SHA match production?

**The symptom.** Gate-eval scores from the failing release are different from gate-eval scores from the *same* model the day before.

**The diagnostic.** Diff the `dataset_version` field between the two releases. The eval suite stayed the same name, but the dataset content was updated and re-tagged. Same name, different SHA, different scores.

```bash
diff <(curl .../rel_a01c66 | jq '.dataset_version') \
     <(curl .../rel_8f72b1 | jq '.dataset_version')
```

**The fix.** Content-hash your datasets. The dataset name is not a version; the SHA is.

## Step 6 — Does the retrieval index SHA match production?

**The symptom.** For RAG workloads only. Quality drops on questions that depend on retrieved context. Direct-answer questions are unchanged.

**The diagnostic.** Pull the `retrieval_index_ref` SHA from the manifest. Compare against the gate evaluation's retrieval-index. The RAG index updated overnight (a fresh ingestion run); the gate evaluation cached an older retrieval; the production canary used the new one.

```bash
curl https://api.divinci.ai/v1/releases/rel_a01c66 | jq '.retrieval_index_ref'
```

**The fix.** Bind the retrieval index SHA into the manifest, exactly the way we bind preprocessing. [AutoRAG's](/autorag/) automated index rotation cadence makes this especially worth checking — the index *will* update on you whether you authorized it or not, if you're not pinning it.

## Step 7 — The model itself, finally

Six steps in. The eval covers the slice. The judge is calibrated. The prompt SHA matches. The preprocessing matches. The dataset matches. The retrieval index matches.

Now — and only now — you have earned the right to look at the model.

The diagnostic for this step is a per-slice Spearman comparison against the prior release, with both releases evaluated against the *same* manifest-pinned dataset, preprocessing, and retrieval. The number you produce is a clean signal: a real per-slice regression, with no upstream confounders.

```bash
curl -X POST https://api.divinci.ai/v1/releases/<failing_id>/diff-eval \
  -d '{ "baseline_release_id": "<prior_id>", "slices": ["legal-IP-licensing"] }'
# → { "spearman_rho_failing": 0.41, "spearman_rho_baseline": 0.68, "delta": -0.27 }
```

If the delta confirms a real regression: [auto-rollback](/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/) fires (if you didn't already manually invoke it), and the failing model gets re-trained against an expanded slice-coverage corpus. If the gate that promoted this release missed the slice in the first place, [the gate is also the bug](/blog/12-qa-and-release-management-capabilities-for-llms/#capability-4-per-slice-per-domain-quality-gate) — capability 4 missing from your release pipeline.

## What the distribution actually looks like

The "1 in 7" framing earlier wasn't a rhetorical device. It's roughly the distribution we see across customer rollouts. Out of every seven QA alerts:

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Pie chart of root-cause distribution for QA alerts. Eval coverage gap accounts for roughly 32 percent. Judge miscalibration roughly 18 percent. Prompt drift roughly 16 percent. Preprocessing skew roughly 12 percent. Dataset drift roughly 7 percent. RAG index drift roughly 5 percent. Actual model regression roughly 10 percent. Internal observation across customer rollouts; not from a controlled benchmark.">
<title>Distribution of QA alert root causes</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Where the bug actually was — across customer rollouts</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Internal observation, not a controlled benchmark. The model is the right answer roughly once per seven alerts.</text>
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
<text x="522" y="112" font-weight="600">1.  Eval coverage gap</text>
<text x="700" y="112" text-anchor="end" font-weight="700">~32%</text>
<rect x="500" y="124" width="14" height="14" fill="#7a9580"/>
<text x="522" y="136" font-weight="600">2.  Judge miscalibration</text>
<text x="700" y="136" text-anchor="end" font-weight="700">~18%</text>
<rect x="500" y="148" width="14" height="14" fill="#b8a080"/>
<text x="522" y="160" font-weight="600">3.  Prompt drift</text>
<text x="700" y="160" text-anchor="end" font-weight="700">~16%</text>
<rect x="500" y="172" width="14" height="14" fill="#c87b3c"/>
<text x="522" y="184" font-weight="600">4.  Preprocessing skew</text>
<text x="700" y="184" text-anchor="end" font-weight="700">~12%</text>
<rect x="500" y="196" width="14" height="14" fill="#a04848"/>
<text x="522" y="208" font-weight="600">7.  Actual model regression</text>
<text x="700" y="208" text-anchor="end" font-weight="700">~10%</text>
<rect x="500" y="220" width="14" height="14" fill="#d4c8b0"/>
<text x="522" y="232" font-weight="600">5.  Dataset drift</text>
<text x="700" y="232" text-anchor="end" font-weight="700">~7%</text>
<rect x="500" y="244" width="14" height="14" fill="#1e3a2b"/>
<text x="522" y="256" font-weight="600">6.  RAG index drift</text>
<text x="700" y="256" text-anchor="end" font-weight="700">~5%</text>
</g>
<text x="500" y="295" font-size="10" font-style="italic" fill="#8a7d68">Steps 1+2 alone account for half of alerts. Walk the eval before walking the model.</text>
</svg>
</figure>

The two biggest slices are *eval coverage gap* and *judge miscalibration*. Together they account for half of QA alerts. Neither is a model problem. Both are problems with how you measure the model.

## What this doesn't solve

Three honest limitations:

**The distribution is ours, not yours.** The percentages above are from our customer cohort and our pipeline's tooling. If you run a different kind of workload — heavy multi-modal, heavy agent-orchestrated, heavy single-shot generative — your distribution will look different. The diagnostic order should still hold; the numbers behind each step will not.

**Step 1's "eval coverage gap" is the hardest to fix.** Adding the missing slice to your training corpus, building a calibrated judge for it, and re-running the canary is itself a multi-week project. The diagnostic is fast; the remediation is not.

**A real regression can ride a non-model bug.** The cases where you have *both* a prompt drift AND a real model regression are the worst ones, because step 3 finds the prompt drift, you fix it, and the alert re-fires. The diagnostic order in this post handles them but adds elapsed time. There's no shortcut for "the bug was in two places at once."

## FAQ

### Why does my LLM produce different outputs for similar prompts?

Prompt sensitivity is real, but it's not always the *cause* of a QA alert — sometimes it's a *symptom* of an upstream bug. Walk the diagnostic. If the prompt template SHA matches and the preprocessing matches and the dataset matches, then yes — the model has wide variance on this slice and you need a more deterministic decoding path or a different judge. If anything upstream changed, fix that first.

### How often should you re-evaluate your LLM benchmarks?

Re-evaluate the benchmark *content* every time a production slice's traffic shape changes meaningfully. Re-evaluate the benchmark's *judge calibration* every quarter, at minimum — judge models drift faster than you'd think. The biggest source of false QA alerts is a benchmark that was last validated 18 months ago and is now measuring a thing your production no longer does.

### What causes hallucinations in custom language models?

Hallucinations have multiple upstream causes — retrieval failures (step 6 in the tree above), training-coverage gaps (step 1, indirectly), and decoding-path issues (a real model concern in step 7). [AutoRAG](/autorag/) addresses the retrieval-side causes by binding the retrieval index into the release manifest and re-pinning on every release. The other two require pipeline-level fixes upstream of the model.

### How do you know if your training data is the problem?

If the dataset SHA in the failing release matches the dataset SHA in the prior good release (step 5 of the tree), the data isn't the *immediate* cause. If they differ, you've found it. The harder question — "is the dataset *complete* for our production slice coverage?" — is what step 1 tests. A dataset that's complete for the eval but incomplete for production traffic is a slice-coverage problem.

### Can you fix QA failures without retraining the entire model?

Yes — six out of seven times, the fix is not a retrain. Steps 1–6 in the tree have fixes that don't touch the model: update the eval, recalibrate the judge, re-register the prompt SHA, fix preprocessing, re-pin the dataset, or re-pin the retrieval index. Retraining is step 7, the most expensive fix, reserved for actual model regressions. The release pipeline's [audit trail](/compliance/) lets you do these upstream fixes with the same provenance discipline you'd use for a model change.

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
<strong>The four-stage release pipeline.</strong> <a href="/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">How to Build an LLM CI/CD Pipeline With Divinci AI</a>. Each diagnostic step in this post corresponds to a manifest field bound at Stage 1 — Register. Without the manifest discipline upstream, the diagnostic loses its grip; you can't diff what you didn't bind.
</li>
</ol>

---

*Next in this series:* **Automated Regression Testing for Custom LLMs in 2026.** This post is about diagnosis after a QA alert fires. The next is about the regression-testing discipline that drove the alert in the first place — what to put in the eval, how to keep it honest, and what to do when the regression test starts disagreeing with your judge.
