+++
title = "Calibrating the Judge: The Grader get Graded"
description = "ScoredQA Calibration: a domain expert rates 50 answers, we compute Spearman ρ vs each LLM judge, and pick the judge that actually agrees."
date = 2026-04-27T20:00:00+00:00
updated = 2026-07-17T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["ScoredQA", "Calibration", "Evaluation", "Spearman", "RAG Routing", "LLM-as-Judge", "Human-in-the-Loop"]

[extra]
math = true
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/calibrating-the-judge-leonardo.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/calibrating-the-judge-leonardo.webp"
featured_image = "images/calibrating-the-judge-hero.webp"
title_display = "Calibrating the Judge.<br>The Grader get Graded."
reading_time = 11
summary = "An LLM rating another LLM's answers is a measurement of nothing until you anchor it to a human. We built ScoredQA Calibration so a domain expert (Dr. Joel Fuhrman, in our first deployment) rates 50 answers on a 0/0.25/0.5/0.75/1 scale, and we compute Spearman ρ between their ratings and each available LLM judge. Only judges that clear ρ ≥ 0.85 with n ≥ 30 ratings get blessed as the calibrated default. Same calibration session is drivable from the CLI, MCP, the Divinci Agent, and the web."
+++

---

The whole product is two equations.

For each candidate LLM judge $j$, with $n$ paired (human, judge) ratings on the same answers, compute Spearman's rank correlation:

<div class="math-block">
$$
\rho_j \;=\; 1 \;-\; \frac{6 \sum_{i=1}^{n} d_i^{\,2}}{n\,(n^2 - 1)}
\qquad\text{where}\qquad
d_i \;=\; \operatorname{rank}(h_i) \;-\; \operatorname{rank}(s_{j,i})
$$
</div>

$h_i$ is the human's score on answer $i$ (one of $\{0, 0.25, 0.5, 0.75, 1\}$); $s_{j,i}$ is judge $j$'s score on the same answer. The judge that earns the right to score the rest of the suite is:

<div class="math-block">
$$
j^{\,*} \;=\; \underset{j \,\in\, \mathcal{J}}{\arg\max}\;\rho_j
\quad\text{subject to}\quad
\rho_j \;\geq\; 0.85
\;\;\wedge\;\;
n \;\geq\; 30.
$$
</div>

If no judge clears the constraint, the platform stays agnostic — it doesn't auto-default. The rest of this post is the engineering and the philosophy that get those two formulas to do useful work.

---

A recurring pattern in AI evaluation tooling — including our own earlier iterations — is that both judge and contestant are LLMs, with no measurement of whether the judge actually agrees with a human about what counts as a good answer.

The shape of it: you ship a chatbot, build an evaluation suite of ~200 questions with reference answers, and run it against your model with a judge LLM (`gpt-4o-mini`, `claude-haiku`, `gemini-flash`) scoring each response 0–10. You get a number.

That number is largely a measurement of internal LLM agreement. If the judge systematically over-rates verbose answers, your model gets credit for verbosity. If it has a blind spot for medical accuracy, the score for a medical chatbot can drift from the thing you actually care about. The pipeline doesn't fail loudly — it just generates numbers whose relationship to user-perceived quality is undefined.

---

## The Anchor

The approach is straightforward: have a human rate enough answers that you can measure how well each candidate LLM judge agrees with that human, then use that measurement to decide which judge — if any — should be trusted to score at scale.

Specifically:

1. A domain expert rates 30–50 answers from your AI on a five-point scale: 0, 0.25, 0.5, 0.75, 1.0.
2. The same answers are independently rated by every candidate LLM judge (gpt-4o-mini, claude-haiku-4.5, gemini-2.5-flash, llama-4-scout, etc.).
3. We compute Spearman ρ — rank correlation — between the human's ratings and each LLM judge's ratings.
4. Any judge that clears ρ ≥ 0.85 with n ≥ 30 ratings becomes a candidate to score the rest of the suite. Judges below the threshold remain available, but the platform won't auto-default to them.

The mechanism isn't novel — inter-rater reliability has been a fixture of clinical scoring for decades. We've made it the default in our evaluation suite rather than a research step you have to remember to do.

---

## Why Dr. Fuhrman

Our first deployment is Divinci AI for [Dr. Joel Fuhrman](https://www.drfuhrman.com/) — a board-certified physician and one of the world's foremost experts in nutrient-dense plant-based medicine. The chatbot answers user questions about Dr. Fuhrman's eating-to-live framework: which foods reverse type 2 diabetes, what to eat after a heart attack, how to interpret a lipid panel.

The questions matter, and the answers matter more. If the chatbot says "eggs are fine for daily consumption" and Dr. Fuhrman would say something materially different — and a generic LLM judge can't tell the two apart because both sound coherent and well-formed — then the evaluation score becomes a poor proxy for the quality the user actually receives.

So we asked Dr. Fuhrman to rate 50 answers by hand. His grade is the reference signal we calibrate against. Each candidate LLM judge has to demonstrate sufficient agreement with him before being trusted to score the next several thousand questions on his behalf.

The 50 answers were generated by our current production model on a held-out set of representative patient questions. They're sitting in a calibration session right now, waiting for him to score them. Once he does, we'll know which judge to trust. Today's blog post is the architecture; the result lands when his ratings come back.

---

## The Five-Point Scale

`{0, 0.25, 0.5, 0.75, 1.0}` is a measurement decision, not just a UI choice.

A free-form 1–10 scale appears to carry more information than a 5-point one, but in practice we've found it carries less:

- **Inter-rater agreement decreases.** Two domain experts will reliably distinguish "wrong" from "right" but rarely agree on whether something is a 7 or an 8.
- **LLM judges anchor narrowly.** Given a 0–10 scale, most judges in our pre-release runs clustered ratings between 6 and 9, leaving the lower range largely unused.
- **Spearman ρ becomes noisier.** Rank correlations on a 10-point scale with a small sample carry wider confidence intervals.

A 5-point scale tracks what raters actually distinguish reliably. The definitions we've socialized with raters:

- **1.0** — Couldn't be improved by a peer expert
- **0.75** — Correct, mostly complete; minor stylistic issues
- **0.5** — Partially correct; missing key context, or correct-but-misleading
- **0.25** — Wrong on substance but with some valid framing
- **0.0** — Factually wrong, harmful, or refuses an answerable question

Quantizing to fifths means the rater is making a small, well-defined decision. The judge has to make the same well-defined decision. The agreement is over a bounded space, not over a noisy continuous one.

---

## The Math (Specifically: Spearman ρ ≥ 0.85, n ≥ 30)

When the rater has scored ≥ 30 answers under a given scorer rubric (say, `llm-completeness-coverage`), we compute:

```
ρ_judge = Spearman(human_scores, judge_scores)
```

For each available LLM judge, we get one number between -1 and 1. We compare it to the threshold:

- **ρ ≥ 0.85**: this judge ranks answers approximately the way the human does. Bless it as the default for this rubric.
- **ρ < 0.85** or **n < 30**: not enough evidence. Stay agnostic, don't auto-default.

Why 0.85? Two reasons:

1. **It's higher than the typical inter-LLM agreement floor.** Two random LLM judges grading the same answers usually correlate in the 0.6–0.7 range. Demanding 0.85 against a *human* baseline filters out judges that are correlated-by-coincidence.
2. **It's achievable for well-matched judges.** In our internal pre-release runs, a calibrated `gemini-2.5-flash` against an internal QA reviewer hit ρ = 0.872 at n = 42. So it's a real bar, not an aspirational one.

Why n ≥ 30? Because below that, the confidence interval on Spearman ρ is wide enough that the bless/no-bless decision flips on a single rating. Thirty is the smallest sample where the decision starts to be stable.

If multiple judges clear the threshold, the recommended default is the one with the highest ρ. The others stay available — you can swap them in the release config — but the platform won't auto-pick them.

<figure class="blog-chart">
  <img src="/images/charts/chart-calibration-judge-agreement.svg" alt="Bar chart of Spearman ρ between human ratings and 5 candidate LLM judges, with a dashed threshold line at ρ=0.85. Two judges (gemini-2.5-flash 0.872 and claude-haiku-4.5 0.851) clear the threshold and are colored sage green; three judges below (gpt-4o-mini 0.794, llama-4-scout-17b 0.731, workers-ai/llama-3.3-70b 0.679) are amber. Caption notes values are illustrative until Dr. Fuhrman's session lands." loading="lazy">
  <figcaption>The judge-agreement table is the bless/no-bless decision in one chart. Two judges clear the threshold; the higher-ρ one (gemini-2.5-flash) becomes the recommended default. Numbers are illustrative — actual per-judge ρ for Dr. Fuhrman's nutrition suite will be added as an addendum once his ratings land.</figcaption>
</figure>

---

## Calibration Sessions as a Persistent Object

The interesting object in this design is the calibration session itself: a (rater, suite, scorer-rubric, rubric-version) tuple with an associated rating vector. Once that object exists, every other useful operation becomes a function of it — compute per-judge ρ; recommend a default; detect rater drift over time; replay the calibration when the rubric prompt changes (the `rubricVersion = sha-256(scorer.prompt).slice(0, 16)` field invalidates stale ratings automatically); and as we'll see in a moment, drive routing in production.

The implementation detail worth stating once: ratings are idempotent on the unique tuple `(answer, scorer, rater, rubricVersion)`. A rater can revise their score on a given answer without polluting the downstream Spearman calculation — the latest rating replaces, it doesn't accumulate. This is what makes a rater's "I want to change my mind on question 17" experience non-destructive to the agreement number.

---

## Why This Matters Beyond Our Use Case

A common pattern in AI products we've examined: the evaluation pipeline produces numbers, and it's difficult to say whether a 0.04 improvement in the eval score corresponds to a real-world quality improvement a user would notice. That gap typically traces back to the judge never being anchored to a human — the pipeline is measuring inter-LLM agreement, which can drift from what users actually want when the judge has systematic biases.

Calibration addresses this by making the bless/no-bless decision visible: before a judge is used at scale, demonstrate sufficient agreement with a human reference rater. If no judge clears the threshold, the more useful conclusion is that off-the-shelf judges are insufficient for the domain — which is information you'd rather have than an unanchored score.

This isn't a novel idea. Inter-rater reliability has been a foundation of clinical scoring rubrics for decades. Our contribution is operational: making it the default in our evaluation product, with the math and threshold pre-wired so the calibration step doesn't have to be remembered.

---

## The Winner-Pick Trick

There's a second feature in the calibration UI that's easy to miss because it sits next to the rating buttons but does something completely different.

Each gold question can have up to N variants generated against it — same question, different combinations of (model, RAG vector group, persona). The rater rates each variant on each scorer, but they also pick **one variant as "best overall"** for that question. The winner pick is a separate signal: the rater is voting for the *configuration* that produced the best answer, not just rating the answer in isolation.

When a winner is picked, a side effect fires asynchronously: the routing layer records "for questions like this one, prefer the RAG vector group that produced the winning answer." The next time a similar query comes in, the platform biases toward the vector group that the rater blessed.

It's a tight feedback loop:

1. Rater answers the same question against three vector groups (e.g., "core nutrition corpus" / "user-submitted Q&A" / "video transcripts").
2. They pick the answer from the "core nutrition corpus" as best.
3. Next user asks a similar question → the platform routes there first.
4. Five ratings later, the routing has learned the rater's preference for that question class.

The calibration session is doing two things at once: training the LLM judges (so we can scale evaluation) and training the RAG router (so we can scale serving). Same human, same 50 answers, two products improved.

<figure class="blog-chart">
  <img src="/images/charts/chart-calibration-loop.svg" alt="Two intertwined loops. Top sage path: domain expert rates 50 answers, compute Spearman ρ per judge, bless judge(s) clearing ρ ≥ 0.85 with n ≥ 30, blessed judge then scores 5,000 questions at scale. Bottom amber path: same rater also picks one variant per question as best overall, which records a routing preference for the winning RAG vector group, which biases the next user query toward the winning group. A dashed feedback arrow shows scored answers growing the rated set over time." loading="lazy">
  <figcaption>The same 50 answers feed two systems: the eval pipeline (sage loop, top) gets calibrated judges; the production routing layer (amber loop, bottom) learns which RAG vector group produced the rater-preferred answer. One human session, two products improved — and the rated set grows as scored answers feed back to the top.</figcaption>
</figure>

---

## What's Pending

The 50 answers for Dr. Fuhrman are queued. He'll rate them when his schedule allows — we estimate next week. When the ratings come back, three things happen:

**First:** we run `qa_calibration_compute_agreement` for each of the four scorer rubrics in his suite (`llm-correctness`, `llm-completeness-coverage`, `llm-citation-grounding`, `llm-tone-and-brand`). For each rubric, we get a per-judge Spearman ρ table. We expect at least one judge to clear 0.85 on at least two rubrics. If none do, that itself is the news — it would mean none of the off-the-shelf judges understand Dr. Fuhrman's specific definition of a good answer well enough, and we'd need to build a custom judge.

**Second:** the winner picks turn on the routing layer. We'll measure whether the next 1,000 chats — split A/B between routing-on and routing-off — have measurably higher user satisfaction (thumbs-up rate, follow-up rate, conversation length). This is the part that affects real users.

**Third:** if the calibration succeeds, we have a template for every other domain expert who wants to put their AI on Divinci. Same flow, same 50-answer ask, same judge calibration step, same winner-pick routing. The platform learns each new expert's quality definition without each new expert having to build their own evaluation infrastructure.

---

## Open Questions We're Holding Loosely

A few claims we're not yet confident in:

- **That ρ ≥ 0.85 is achievable for most domains.** It's plausible that for sufficiently nuanced expert domains (specific medical specialties, legal practice areas, niche scientific fields), no off-the-shelf LLM judge will correlate that strongly with the expert. If that's the pattern, the product naturally expands to include a fine-tuning path for a custom judge — additive, not invalidating, but a meaningful shift in the surface area.

- **That winner picks teach the router meaningfully.** With 50 winner picks, we're training the routing layer on a tiny signal. It might take 500 to see real improvement, in which case the routing-feedback story is honest but slow.

- **That the five-point scale is right.** Maybe a three-point scale (wrong / partial / right) gets better agreement and the lost granularity doesn't matter. If agreement at three points is dramatically higher than at five, we should switch.

- **That calibration belongs at the suite level.** Right now we calibrate per-scorer, per-suite. Maybe the calibration should be per-scorer, period — once `gemini-2.5-flash` has proven itself at completeness scoring against Dr. Fuhrman, that calibration could carry over to every other nutrition suite without re-rating. Cross-suite calibration would be much more useful but also much harder to defend (the rubric might be the same but the question distribution isn't).

I'll know more about the first two within a month. The latter two need more deployments to test.

---

## A Note on the UX Choices

A calibration product can easily turn into an "AI eval dashboard" — charts, leaderboards, vendor logos. We deliberately kept that surface narrow.

The calibration page is intentionally small: one question, five rating buttons, a winner pick, a reasoning textbox. The design target is that a rater can complete 50 answers in roughly 30 minutes — not 30 minutes per answer.

The Spearman calculation is hidden until there are enough ratings to compute it meaningfully. The judge-agreement table doesn't appear until n ≥ 30. The recommended default judge isn't suggested until ρ clears 0.85. The product progressively reveals as the data warrants.

In our internal pre-release reviews, this restraint produced a measurable difference in time-to-first-rating compared to dashboards we'd looked at: until there's data to interpret, the rater only sees "score this answer," which is what they came to do.

---

## What Comes Next

Three threads we're following:

**Cross-suite calibration transfer.** Once Dr. Fuhrman has calibrated `gemini-2.5-flash` for completeness on his nutrition suite, can we trust that judge for the next nutrition expert who joins the platform without re-calibrating? The answer is probably "partially" — the rubric transfers, the question distribution doesn't. But if we can get even a 60% calibration carry-over, the cost of onboarding the next expert drops dramatically.

**Calibration as TrustBench input.** Our TrustBench product line (launching v1 on May 9) signs evaluation manifests with an Ed25519 platform key so any third party can verify that an AI passed a published benchmark. Calibrated judges feed directly into this — when TrustBench reports a score, it can also report which judge produced it and what its calibration was against the benchmark's reference rater. That's the difference between "this AI scored 0.87" and "this AI scored 0.87 as judged by gemini-2.5-flash, calibrated at ρ=0.91 against Dr. Fuhrman."

**Mid-conversation calibration.** Right now calibration is a separate workflow from production chats. There's a future where end-users themselves get to rate occasional answers (👍 / 👎 with optional 5-point detail), and those ratings flow back into the same calibration pipeline. The rater pool becomes thousands of users instead of one expert, with the expert's calibration as the trust anchor that keeps the crowd-rating signal honest.

That last one is months out. The first two are weeks.

---

## In Summary

There are three failure modes for AI evaluation that this calibration step is designed to address:

- **No human anchor.** Without a human reference rater, the score becomes a measurement of inter-LLM agreement, which can drift from user-perceived quality in ways the eval pipeline can't surface on its own.

- **Calibration without rank-agreement measurement.** Choosing a judge by reputation ("we used GPT-4 because it's smart") leaves the agreement question unanswered. Spearman ρ against a human anchor is one straightforward way to make that decision visible.

- **Generic calibration across domains.** A judge that correlates well with one expert in one domain may not transfer to a different expert in a different one. Per-domain calibration is heavier to set up but produces a per-domain trust signal.

We built ScoredQA Calibration so Dr. Fuhrman's AI can be measurably good *by Dr. Fuhrman's standard* — and so the same template can be applied for the next domain expert who joins the platform. The math is Spearman ρ on a small sample with a documented threshold. The product hypothesis is that this step should be a default, not a research project.

When the ratings come back, we'll publish the per-judge ρ table here as an addendum. Until then: the product is shipped, the test set is loaded, and the doctor has the link.

**Update, July 2026:** the ratings haven't come back yet — and that's now a load-bearing fact rather than a placeholder. We ran a full third-party evaluation gauntlet (RAGAS + DeepEval, judged via Cloudflare Workers AI) against the production nutrition assistant's suite and pulled the live calibration report before scoring anything: it read *"no scorers are calibrated yet — none cleared ρ ≥ 0.85 with n ≥ 30 ratings."* Every score in that gauntlet — and every RAG-routing decision this platform makes today — is a judge-relative number until a human anchor lands. We built the aggregator to *weight* by ρ automatically the moment a judge clears the bar; right now it's honestly falling back to unweighted means, exactly as designed for the un-calibrated case. The infrastructure this post describes is proven end-to-end; the anchor step is the one piece still waiting on a human in the seat.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>LLM-as-judge agreement with humans.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023, arXiv:2306.05685). The paper that established the modern "LLM judges agree with humans &gt;80% of the time" baseline — and quantified per-category variance ranging from coding (86%) down to writing/humanities (36–44%). The motivation for per-domain calibration starts here.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman ρ.</strong> Spearman (1904), <em>The Proof and Measurement of Association between Two Things</em>. Canonical: <a href="https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient" target="_blank" rel="noopener">Spearman's rank correlation coefficient</a>. We use ρ rather than Pearson r because we care about <em>rank order</em> agreement between the judge and the human anchor, not absolute score agreement; rank order is what downstream routing decisions actually consume.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Inter-judge agreement studies.</strong> Pradeep et al., <a href="https://arxiv.org/abs/2510.09738" target="_blank" rel="noopener"><em>Judge's Verdict: A Benchmark for Judging LLM-as-Judges</em></a> (arXiv:2510.09738) — reports Pearson r ≈ 0.85–0.88 between strong open-weights judges (Mixtral, Llama-3-70B) across 6 QA datasets, but the consistency degrades sharply on slice-specific medical / legal subsets. The "two judges disagreeing at ρ = 0.55" finding in this post is consistent with that degradation.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Internal ScoredQA Calibration data.</strong> The 200-item medical Q&A arena, the two LLM judges' Spearman ρ = 0.55 disagreement, and the human-anchored calibration sample of 50 graded answers are from the live Divinci-AI ScoredQA platform — not a published benchmark. The procedure (small calibrated sample → Spearman ρ vs human anchor → judge selection) is the part this post is arguing should be a default, and is the same procedure cited by the <a href="/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">release-pipeline post</a> as the basis for slice-aware Gate-2 decisions.
  </li>
</ol>
