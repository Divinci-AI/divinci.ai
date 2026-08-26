+++
title = "Inside the RAG Arena: When the Judges Don't Agree"
description = "A 200-item RAG arena tied at the mean, but two LLM judges only agreed at Spearman ρ=0.55. They aren't measuring the same thing."
date = 2026-04-26T18:00:00+00:00
updated = 2026-07-17T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Research"]
tags = ["RAG-Arena", "ScoredQA", "RAG Routing", "EXIT", "LLM-as-Judge", "Spearman", "Evaluation", "QLoRA"]

[extra]
math = true
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/rag-arena-scored-qa-routing-hero.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/rag-arena-leonardo-hero-v2.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/rag-arena-leonardo-hero-poster-v2.webp"
title_display = "Inside the RAG Arena.<br>When the Judges Don't Agree."
reading_time = 11
summary = "An arena run is supposed to settle the question 'which model + RAG configuration wins on my corpus.' A 200-item arena on a medical Q&A corpus, scored across four rubrics, returned a headline tie: v2-atd 0.585 vs Llama 4 Scout 0.582. The more important question surfaced when 415 of those answers were re-judged with two different LLM judges — Spearman ρ = 0.552 between them. The arena scores aren't measurements of quality. They're measurements of one judge's opinion, treated as the truth. This post is the math, the lesson about silent failure modes in LLM-as-judge pipelines, and the routing layer that makes calibration pay for itself twice."
+++

The whole experiment is two equations and one footnote.

**Per-variant overall score**, mean over all $S$ scorer rubrics applied to all $N$ scored items:

<div class="math-block">
$$
\overline{x}_v \;=\; \frac{1}{N \cdot S} \sum_{i=1}^{N} \sum_{s=1}^{S} x_{v,i,s}
\quad\text{where}\quad
x_{v,i,s} \in [0, 1].
$$
</div>

**Inter-judge agreement**, the rank correlation between two LLM judges $j_a$ and $j_b$ scoring the same $n$ items under the same rubric:

<div class="math-block">
$$
\rho(j_a, j_b) \;=\; 1 \;-\; \frac{6 \sum_{i=1}^{n} d_i^{\,2}}{n\,(n^2 - 1)}
\quad\text{where}\quad
d_i \;=\; \operatorname{rank}(s_{j_a, i}) \;-\; \operatorname{rank}(s_{j_b, i}).
$$
</div>

The footnote: **we measured ρ for two of the judges in our default rotation and got 0.552.** Below the 0.85 threshold we use for human-anchored calibration ([prior post here](/blog/calibrating-the-ai-judge/)). Below the 0.70 floor we'd treat as "moderate" agreement. The two judges aren't measuring the same underlying quality.

That doesn't make the headline arena score wrong. It makes it *conditional*. v2-atd 0.585 vs Llama 4 Scout 0.582 is a real measurement of how `gemini-3.1-flash-lite-preview` ranks the variants on the AskTheDoctor corpus with EXIT 4× compression. The corrected interpretation isn't "v2-atd is tied with Llama 4 Scout." It's "they're tied *under this judge*, and we now know we don't know what they look like under a different one."

This is the post.

---

## The setup

We wanted one number. The product question we were trying to answer:

> For the AskTheDoctor (ATD) medical Q&A corpus, with the production RAG vector group already deployed, which model + retrieval configuration produces the best answer for a typical patient question?

The arena:

- **Suite**: 200 held-out ATD validation items (`69ec98bcc410b34ce668849a`)
- **Three models**: v2-atd (our Modal QLoRA Gemma 4 31B fine-tune), Llama 4 Scout, Opus 4.7
- **Two RAG configurations**: uncompressed retrieval (Arena A) and EXIT 4× compressed retrieval (Arena B), with the prod RAG vector group at top-K=5, min-score=0.62
- **Persona prefix** attached at the release level (Release A — Fuhrman persona)
- **Four scorers** at equal weight = 1.0:
  - `llm-correctness` — does the response match the gold facts (legacy, strict)
  - `llm-completeness-coverage` — covers the gold's key points, length-tolerant (PR #1001)
  - `llm-relevance` — does the response address the question
  - `reference-perplexity:v2-atd-ppl` — forced-decoding PPL of the response under v2-atd, length-normalized (PR #1000)
- **Judge for the LLM-judged scorers**: `gemini-3.1-flash-lite-preview` (the default — calibration pending at the time)

EXIT 4× was added because v2-atd's effective context window for our prod-shaped prompts is ~1600 tokens once the persona prefix and chat scaffolding are subtracted. Uncompressed top-5 retrieval blew past it on most items. The hypothesis we wanted to test was whether this was a v2-atd quality problem or a context-fit problem. If EXIT 4× compression brought retrieval inside the window without dropping accuracy, the answer was the latter.

**EXIT 4× compression**, simplified: keep the top-K retrieved chunks but compress each chunk by a factor of 4 using an extractive transformer (the EXIT model) before injecting into the prompt. Per the prior internal V&V, the expected accuracy delta is ~0pp at the 4× level for retrieval-augmented Q&A.

---

## The headline result (and the per-scorer breakdown)

Arena B — EXIT 4× compressed RAG, error-filtered:

| Variant | n_total | n_errors | n_valid | mean (4-scorer overall) |
|---|---:|---:|---:|---:|
| **v2-atd (Modal QLoRA Gemma 4 31B)** | 212 | 28 | 212 | **0.585** |
| **Llama 4 Scout** | 203 | 17 | 203 | **0.582** |

Per-scorer breakdown — the actually-interesting result:

| Scorer | v2-atd | Llama 4 Scout | Δ (v2-atd − Llama) |
|---|---:|---:|---:|
| **llm-completeness-coverage** (PR #1001, length-tolerant) | **0.565** | 0.534 | **+0.031** |
| llm-correctness (legacy strict) | 0.443 | 0.458 | -0.015 |
| llm-relevance | 0.635 | 0.635 | 0.000 |
| **reference-perplexity:v2-atd-ppl** (PR #1000, forced-decoding PPL) | 0.700 | 0.699 | +0.001 |

**The story the legacy 3-scorer headline missed.** When we measure with the length-tolerant completeness scorer (the one specifically designed to *not* punish thoroughness), **v2-atd wins by +3.1pp on completeness-coverage**. The legacy `llm-correctness` scorer (which is strict and brevity-biased) gives Llama a -1.5pp edge on facts-match. The two cancel out in the unweighted overall mean (0.585 vs 0.582), but the underlying signal isn't "tied — they're equivalent." The signal is "v2-atd is more *thorough* per-response; Llama is marginally more *strictly accurate* on individual facts."

Reference-perplexity is essentially tied (0.700 vs 0.699) — both models produce text in-distribution under v2-atd's own decoder. Expected: Llama's outputs aren't dramatically different from v2-atd's stylometrically when both are constrained by the same RAG context.

<figure class="blog-chart">
  <img src="/images/charts/chart-rag-arena-per-scorer.svg" alt="Per-scorer arena breakdown for v2-atd (Modal QLoRA Gemma 4 31B) vs Llama 4 Scout on EXIT 4× compressed RAG. The length-tolerant llm-completeness-coverage scorer (PR #1001) shows v2-atd at 0.565 and Llama at 0.534 — a +3.1pp edge to v2-atd that the headline overall mean (0.585 vs 0.582) hides. The legacy strict llm-correctness scorer gives Llama a marginal -1.5pp edge. Relevance is tied at 0.635. Reference-perplexity under v2-atd is essentially tied at 0.700 vs 0.699." loading="lazy">
  <figcaption>The headline tie isn't "they're equivalent." It's "v2-atd is more thorough per-response; Llama is marginally more strictly accurate on individual facts; the unweighted mean averages those two opposite shapes into the same number." The length-tolerant scorer (PR #1001) is what surfaces the underlying signal.</figcaption>
</figure>

---

## Compression sensitivity: the EXIT 4× claim, validated on a customer corpus

Arena C measures the same model under both retrieval configurations:

| Variant | Arena A mean (uncompressed) | Arena B mean (EXIT 4×) | Δ |
|---|---:|---:|---:|
| Llama 4 Scout | 0.578 | 0.582 | **+0.004** |

<div class="math-block">
$$
\Delta_{\text{compression}} \;=\; \overline{x}_v^{\,\text{EXIT}} \;-\; \overline{x}_v^{\,\text{uncompressed}} \;=\; +0.004.
$$
</div>

Essentially zero. The prior internal "0pp loss at 4×" V&V on synthetic data holds on a real customer corpus. EXIT 4× is doing what it's supposed to: shrinking the retrieved context to fit downstream models without measurably degrading the answer the next stage produces.

That was the variable that moved v2-atd from "looks like it can't do RAG" to "looks roughly tied with Llama 4 Scout." The gap wasn't the model; it was the prompt budget.

---

## Silent failure modes in LLM-as-judge pipelines

The arena pipeline initially produced a plausible-looking score for a third variant whose responses were not, in fact, real responses — they were upstream API error strings captured into the response field. The test runner counted non-exception calls as "passed" regardless of whether the body was a generated answer or an error blob.

The error strings then scored coherently on the rubrics. The relevance scorer correctly returned ~0 (the blob doesn't address the question). The reference-perplexity scorer returned ~0.79 on the same content because short well-formed English has low perplexity regardless of whether it answers anything. The averaged headline mean landed in the "weak but plausible" zone instead of the "obvious failure" zone.

**The generic lesson:** an evaluation pipeline that doesn't loudly distinguish *model produced a bad answer* from *model wasn't called and the error was captured as if it were an answer* is producing numbers, not measurements. Any LLM-as-judge pipeline that scores response text without first validating the response is a response is exposed to this class of artifact. The fix is a pre-scoring validator that moves error-pattern responses out of the scored pool entirely and into a failure bucket. Cheap to implement; impossible to skip once you've seen what happens without it.

---

## The judge calibration finding: ρ = 0.552

After the arena, we cross-checked ourselves. Sampled 30 (response, gold) pairs stratified across low/mid/high prior-score bins. Re-scored each pair with two judges using the exact `llm-completeness-coverage` prompt:

- **Trusted baseline**: `gemini-2.5-flash` — the well-calibrated default per our prior judge-calibration work
- **Candidate upgrade**: `gemini-3.1-pro-preview` — a thinking model with ~282 thoughts tokens/call, meaningful instruction-following capacity for nuanced rubrics

Then we did the inter-judge ρ matrix on a larger 415-item pool:

| | `gemini-2.5-flash` | `gemini-3.1-pro` |
|---|---:|---:|
| `gemini-2.5-flash` | **1.000** (n=415) | **0.552** (n=413) |
| `gemini-3.1-pro` | **0.552** (n=413) | **1.000** (n=413) |

ρ = 0.552 between two flagship Gemini judges scoring the same 413 answers under the same rubric.

For comparison, the threshold we use to trust a judge against a *human* anchor is ρ ≥ 0.85 ([prior post on this](/blog/calibrating-the-ai-judge/)). The floor we'd accept as "moderate consensus" is around 0.70. **Two judges that nominally do the same job, given the same prompts and the same answers, are landing at 0.552.**

<figure class="blog-chart">
  <img src="/images/charts/chart-inter-judge-disagreement.svg" alt="Bar chart of pairwise Spearman ρ between three Gemini judges scoring the same answers under the same rubric. The four pairs measured: flash-lite-preview ↔ 2.5-flash at 0.750; 2.5-flash ↔ 3.1-pro on the calibration sample (n=28) at 0.679; 2.5-flash ↔ 3.1-pro on the larger 415-item pool (n=413) at 0.552 — the headline; flash-lite-preview ↔ 3.1-pro at 0.658. None clear the 0.85 human-anchor threshold (dashed sage line); three of four also fall below the 0.70 moderate-consensus floor (dashed amber line). Verdict box at bottom: don't adopt 3.1-pro as the new judge — re-running the arena would change the headline by an unknown amount and lose comparability with prior data." loading="lazy">
  <figcaption>The 0.552 isn't a defect of either judge. It's a measurement of how much "LLM-as-judge" is doing on this rubric. Until a human anchor exists, the arena report ships with its judge identity in the methods caveat — switching judges between runs would change two variables at once.</figcaption>
</figure>

The direction of disagreement is consistent though:

- `flash-lite-preview` is the most lenient (mean ~1.0 on items where both newer judges scored 0.25-0.5).
- `2.5-flash` is moderate (mean 0.268 on the calibration sample).
- `3.1-pro-preview` is the strictest (mean 0.214).

So the "right answer" is somewhere across all three — but we don't have it without a human anchor.

---

## What this means for the arena number

It does not invalidate the arena number. It contextualizes it. The 0.585 vs 0.582 headline is real — but the interpretation is:

> Under `gemini-3.1-flash-lite-preview` as the judge for the LLM-judged scorers, on the AskTheDoctor 200-item held-out validation set with EXIT 4× compression on the prod RAG vector group, v2-atd scores 0.585 and Llama 4 Scout scores 0.582 on the unweighted 4-scorer mean. Re-running the same evaluation with `gemini-2.5-flash` would shift both numbers by an unknown amount (likely several percentage points each) and the gap may flip sign.

That's a defensible measurement. It's not a *judgment-free* measurement, and we now have to write that down every time we report it.

The decision we made: **don't re-run the arena under a different judge until we have a human-anchored calibration set.** Switching judges between arena runs is methodologically invalid — you'd be changing two variables at once (model under test and yardstick) and any difference is attributable to either. Stay on `gemini-3.1-flash-lite-preview` as the established (if imperfect) baseline. Use the corrected aggregator (error filter + dynamic scorer enumeration) for all future runs. Add the methods caveat to every published headline.

The sustainable fix is a human-labeled gold benchmark for the completeness-coverage rubric. ~50 (response, gold) pairs with a domain expert's ratings on a 5-point scale ($\{0, 0.25, 0.5, 0.75, 1.0\}$). Each candidate judge's ρ vs the human gold gives an actual truth-anchor instead of judge-vs-judge noise. The expert in our case is Dr. Joel Fuhrman; the calibration session is queued; the result will land as an addendum here and in the [Calibrating the Judge post](/blog/calibrating-the-ai-judge/).

---

## The routing layer: why the calibration session pays twice

Calibration sessions do two things at once. The first is the one above — they tell us which judge to trust. The second is the part that ships into production: each calibration question carries up to $V$ variants, and the rater picks one as **best overall**. That winner pick records an asynchronous routing preference — the rater's choice of RAG vector group for the question class that question belongs to. The next user query the platform classifies into the same question class biases toward the winning vector group.

Five winner picks later, the routing layer has learned the rater's preference for that class. Fifty winner picks later, it covers the major question classes in the suite. The same human, the same 50 answers, two production systems improved.

Concretely, the loop:

1. The rater answers the same question against (e.g.) three RAG vector groups: "core nutrition corpus" / "user-submitted Q&A" / "video transcripts."
2. They pick the answer from the "core nutrition corpus" as best overall.
3. The next user asks a similar question → the platform routes there first.
4. Five ratings later, the routing has learned the rater's preference for that class.

The upper-bound cost of this is the same 30 minutes of expert time the calibration session already takes. The marginal cost of adding the routing-update side effect is one extra column in the calibration UI and one async write to the routing-preference store per rated answer.

---

## The five-LLM scoreboard

A follow-on arena extended the comparison across five LLMs on the same suite, scored with a different three-scorer matrix optimized for the calibration page workflow (50-item suite; `llm-similarity-to-expected`, `llm-factual-consistency-vs-reference`, `llm-question-addressed` instead of the 4-scorer matrix above). The numbers below are **not directly comparable** to the 4-scorer Arena B means — different scorers, different item count — but they show the broader competitive shape on this corpus.

Sorted by overall mean, descending:

| LLM | Pass rate | Overall mean | Median latency |
|---|---|---:|---:|
| **GPT-OSS-120B** | 50/50 | **0.555** | 5.4 s |
| Kimi K2.6 | 49/50 | 0.553 | 16.2 s |
| Gemini 3.1 Pro | 49/50 | 0.530 | 18.9 s |
| Claude Opus 4.7 (Vertex) | 50/50 | 0.473 | 3.3 s |
| DFO QLoRA / DFlash baseline | 50/50 | 0.398 | 3.0 s |

<figure class="blog-chart">
  <img src="/images/charts/chart-five-llm-scoreboard.svg" alt="Horizontal bar chart of five LLMs on the same 50-item AskTheDoctor calibration suite, sorted descending by overall mean across three scorers. GPT-OSS-120B at 0.555 (50/50 pass, 5.4s median latency), Kimi K2.6 at 0.553 (49/50, 16.2s), Gemini 3.1 Pro at 0.530 (49/50, 18.9s), Claude Opus 4.7 at 0.473 (50/50, 3.3s), DFO QLoRA / DFlash baseline at 0.398 (50/50, 3.0s). The top three are within ~3pp of each other; the DFO baseline trails by ~16pp. Latency varies by ~6× across the top four." loading="lazy">
  <figcaption>The top three (GPT-OSS-120B, Kimi K2.6, Gemini 3.1 Pro) cluster within 3pp of each other. The latency band tells the deployment story as much as the mean: GPT-OSS-120B and Claude Opus 4.7 are both fast (5.4 s / 3.3 s); Kimi K2.6 and Gemini 3.1 Pro are 3–6× slower; the DFO baseline is fast but trails on mean by ~16pp.</figcaption>
</figure>

Per-scorer breakdown for Claude Opus 4.7 (the only model with the new-matrix per-scorer numbers landed so far): `llm-similarity-to-expected` = 0.380, `llm-factual-consistency-vs-reference` = 0.403, `llm-question-addressed` = 0.600. Comparable per-scorer breakdowns for the other four models are pending the next sweep — that's the chart this section is missing.

The pattern that's visible even without per-scorer detail: a frontier model that hedges (answers cautiously without a persona prefix to anchor on) reads as moderate on `similarity-to-expected` but high on `question-addressed`. The 0.600 vs 0.380 spread inside a single model is the signal that human-anchored calibration is what's needed to resolve "is this answer good, or just safe?"

---

## In summary

The arena answered the product question we asked. v2-atd is essentially tied with Llama 4 Scout on the AskTheDoctor corpus when both have RAG access at a configuration that fits v2-atd's prompt budget. The "v2-atd can't do RAG" hypothesis was a context-window blocker; EXIT 4× resolves it with measurably zero accuracy cost.

The arena also answered a question we didn't ask and would have preferred to keep tacit: **two flagship LLM judges scoring the same answers under the same rubric land at ρ = 0.552**. That's not a defect of either judge. It's a measurement of how much "LLM-as-judge" is doing — and it's the case for every arena report carrying its judge identity in the methods caveat until a human anchor exists.

When that anchor lands, the same calibration session pays for itself twice: the LLM judges get blessed (or not) for scoring the rest of the suite, and the production routing layer learns which RAG vector group the human prefers for each question class. One human session, two systems improved.

The scaffolding to make this work is shipped: a unified calibration session that accepts ratings from web, CLI, MCP, or agent surfaces; the multi-scorer arena; the dynamic aggregator; the error-pattern filter. The remaining piece is the human anchor.

## Postscript (July 2026): the automated half, measured in production

Since this post first ran, the *automated* half of the routing loop — the part that doesn't need a human in the seat — went live and got measured on a production nutrition assistant with six architecturally distinct backends (audio transcripts, a product catalog, a Q&A corpus, recipes, PDFs, full books). Three things came out of it worth reporting.

**The judge-pluggable claim is now literal.** The arena runs RAGAS and DeepEval as first-class scorers alongside our internal judges — and it runs them on Cloudflare Workers AI (Kimi K2.6 for judgment-heavy metrics, Llama 3.3 for the decomposition-heavy ones), with no hosted OpenAI key anywhere in the path. Third-party RAG-eval frameworks now score every arena run, on infrastructure a customer's own key can transparently override. That was the "plug your own judge in" promise; it's plumbed end to end.

**Learned routing buys efficiency, not magic.** We A/B-tested it the honest way: learned routing (answer from the single measured-winner backend) versus querying all six and fusing the results. For recognized questions, quality held even-or-better from *one* backend — faithfulness rose from 0.90 to 0.94, context recall from 0.61 to 0.63, overall within a point (0.771 fusion vs 0.763 routed). The lesson is precise and worth stating plainly: routing is a **cost and efficiency win**, not a quality lever. It buys you the right backend's answer without paying to query every backend — exactly the point when your corpora are heterogeneous and most questions only need one of them. When we tried to squeeze *quality* out of the retrieval knobs instead, the measurements pushed back: trimming the context cap lowered precision, and swapping the source mix left it flat. The bottleneck lives in *within-index* chunk ranking, not in how many chunks or which index — a genuinely useful thing to have learned by measurement rather than assumption.

**The human anchor is still the open piece — and we re-confirmed why.** Running the full third-party gauntlet against a live release, the calibration-weighted aggregator still fell back to unweighted means: zero scorers had yet cleared the ρ ≥ 0.85 human-agreement bar. That's not a regression; it's the same finding this post opened with, now independently reproduced by a different measurement path. Every arena number here remains judge-relative until a human session blesses a scorer. The automated half is proven; the anchor is what turns "which answer did the judges prefer" into "which answer was actually right."

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>RAGAS — automated RAG evaluation.</strong> Es, James, Espinosa-Anke, Schockaert, <a href="https://arxiv.org/abs/2309.15217" target="_blank" rel="noopener"><em>RAGAS: Automated Evaluation of Retrieval Augmented Generation</em></a> (arXiv:2309.15217). The reference-free RAG eval framework; the arena described in this post is a corpus-specific, judge-pluggable extension that measures the same kinds of axes (faithfulness, answer relevance, context relevance) plus a final-answer Spearman ρ between judges.
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>BEIR — heterogeneous IR benchmark.</strong> Thakur, Reimers, Rücklé, Srivastava, Gurevych, <a href="https://arxiv.org/abs/2104.08663" target="_blank" rel="noopener"><em>BEIR: A Heterogeneous Benchmark for Zero-shot Evaluation of IR Models</em></a> (NeurIPS Datasets &amp; Benchmarks 2021, arXiv:2104.08663). The convention this arena follows for splitting evaluation by retrieval style and document type.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>MT-Bench &amp; LLM-as-judge agreement.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023, arXiv:2306.05685). Reports &gt;80% overall GPT-4-vs-human agreement, with wide per-category variance. The ρ = 0.552 between two judges in this post is consistent with that variance once you slice by domain.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Spearman ρ — definition.</strong> <a href="https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient" target="_blank" rel="noopener">Spearman's rank correlation coefficient</a>. The arena's per-scorer agreement chart and the headline ρ = 0.552 finding both use Spearman because routing decisions consume rank order, not absolute scores.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Internal arena data — the three charts above.</strong> The AskTheDoctor 200-item medical corpus, the v2-atd / Llama 4 Scout / EXIT-4× tie outcome, the per-scorer disagreement table, and the ρ = 0.552 inter-judge measurement are all from the Divinci-AI ScoredQA platform. The arena and its routing layer are described in the companion <a href="/blog/calibrating-the-ai-judge/">Calibrating the AI Judge</a> post; the slice-aware Spearman gate that this calibration feeds is documented in the <a href="/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/">release-pipeline post</a>.
  </li>
</ol>
