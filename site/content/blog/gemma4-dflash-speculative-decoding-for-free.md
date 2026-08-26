+++
title = "Speculative Decoding for Free: Pairing DFlash with our DFO-Tuned Gemma 4 31B"
description = "z-lab's DFlash drafter on our QLoRA fine-tune captured 92% of the published speedup with no retraining. ~15x faster, ~4x cheaper in prod."
date = 2026-05-09T22:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Research"]
tags = ["DFlash", "Speculative Decoding", "Gemma 4", "vLLM", "Inference", "H100", "QLoRA", "DFO"]

[extra]
math = true
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/gemma4-dflash-hero.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/gemma4-dflash-hero-v2.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/gemma4-dflash-hero-poster-v2.webp"
title_display = "Speculative Decoding for Free.<br>92% of the speedup, zero drafter retraining."
reading_time = 12
summary = "DFlash is a 2B-parameter block-diffusion drafter that bolts onto a frozen Gemma 4 31B target and drafts 16 tokens in one parallel forward pass. The catch: drafters are trained against a specific target distribution — and z-lab published one trained against stock Gemma 4. We measured what happens when you point that stock-trained drafter at our DFO-tuned medical Q&A checkpoint, then patched the vLLM blocker that prevented anyone from running the combination at all. Result: 1.18× average / 4.0× math-peak speedup (92% retention), one PR upstream, and a production cutover that landed at ~15× faster and ~4× cheaper per request."
+++

---

## TL;DR

We have a fine-tuned 31B-parameter Gemma 4 served on Modal H100 — Direct Free-text Optimization (DFO), our internal SFT/DPO mix on the AskTheDoctor medical Q&A corpus. The question we were trying to answer:

> Can z-lab's recently-released [`gemma-4-31B-it-DFlash`](https://huggingface.co/z-lab/gemma-4-31B-it-DFlash) — a 2B block-diffusion drafter trained against the **stock** Gemma 4 31B Instruct — give us a meaningful inference speedup **without** retraining the drafter against our DFO weights?

Three numbers tell the story:

$$
\text{speedup}_{\text{DFO}} \;=\; 1.18\times \;\text{(avg)} \quad\quad
\text{speedup}_{\text{DFO}}^{\text{math-peak}} \;=\; 4.0\times \quad\quad
\text{retention} \;=\; \frac{1.18}{1.28} \;=\; 92\%.
$$

The retention number is the load-bearing one. The drafter was trained for a target it never saw — and it kept 92% of the throughput it earned on the target it *was* trained for. We expected somewhere between 50% and 80%. We got 92%.

We also had to patch a structural blocker in vLLM that prevented Gemma 4 + DFlash from working at all, and contributed the patch upstream:

- vLLM issue [#42068](https://github.com/vllm-project/vllm/issues/42068) — *Gemma 4 + DFlash incompatible: MTP-specific backend propagation forces TRITON_ATTN on independent (DFlash) drafters*
- vLLM PR [#42069](https://github.com/vllm-project/vllm/pull/42069) — one-line `backend=None` override letting the drafter autoselect a non-causal-capable backend

Total experiment GPU spend: ~$27 across 14 attempts on Modal.

---

## The drafter that isn't a model

Speculative decoding lets a small fast "drafter" propose tokens that a large slow "target" verifies in parallel. Standard implementations draft K tokens autoregressively — K serial forward passes through the drafter — then verify them all in one parallel pass through the target.

DFlash is a different shape. It's a **block-diffusion** drafter:

- 5 trained transformer layers (Qwen3 derivatives have 8)
- Shares the target's embedding + LM head, **frozen**
- Conditioned on hidden states from 5 uniformly-sampled layers of the target — those states are concatenated, projected, and injected into the drafter's KV cache as persistent context
- Drafts a whole block of K = 16 tokens in **one parallel forward pass**, then the target verifies the entire block in one parallel pass

Throughput grows roughly linearly with **acceptance length** $\ell$ — the number of drafted tokens the target accepts before rejecting one and resuming autoregressive generation:

$$
\text{tok/s}_{\text{spec}} \;\approx\; \frac{\mathbb{E}[\ell] + 1}{T_{\text{drafter}} + T_{\text{verifier}}}
\quad\text{vs}\quad
\text{tok/s}_{\text{base}} \;=\; \frac{1}{T_{\text{verifier}}}.
$$

When $\mathbb{E}[\ell]$ is high (sharp next-token distributions — arithmetic, code, step-by-step reasoning), spec-decode wins big. When it's low (open-ended creative text, low-entropy verbose padding), the drafter overhead can erase the gain.

The catch with DFlash specifically: because the drafter is conditioned on the target's hidden-state distribution, it's tuned to a specific target. Z-lab's published drafter was trained against `google/gemma-4-31B-it` — stock Instruct, no fine-tune. Our DFO checkpoint drifts from that base by however much our SFT + DPO + Direct Free-text passes shifted the model.

**No one had published a base-vs-fine-tune ablation.** We're the experiment.

---

## Why we expected the answer to be "mostly works"

Two reasons to believe a stock-trained drafter degrades gracefully on a fine-tuned target rather than collapsing:

1. **Verifier-side losslessness is unconditional.** The target sees every drafted block, accepts the longest verifiable prefix, and generates the next token autoregressively. There is no quality-loss path. If the drafter is bad, the system gets *slower*, not *worse*.

2. **DFO is a relatively small distributional shift.** We're not training a different model — we're fine-tuning on a domain corpus with DPO from a strong base. The hidden-state distribution at the 5 layers DFlash conditions on shouldn't be wildly off-manifold.

Where the drafter could collapse: if our DFO training shifted **early-layer** representations a lot (the drafter is conditioned on shallow → deep layers), or if DFO output puts mass on tokens stock Gemma rarely picks. Either is plausible. Phase 2 had to tell us.

---

## What it took to even run the experiment

We expected this to be a couple of model-launch invocations. It wasn't — and the blocker turned out to be an architectural decoupling problem worth describing because it generalizes beyond DFlash.

**The blocker, in one paragraph.** vLLM's Gemma 4 config force-locks the attention backend to `TRITON_ATTN` when the model has heterogeneous head dimensions (Gemma 4 has `head_dim=256` for sliding-window attention layers and `global_head_dim=512` for full-attention layers). That lock is correct for the target's own forward pass — preventing mixed-backend numerical drift between sliding and global layers. But when spec-decode is wired in, the same lock propagates to the drafter as well. DFlash's drafter uses **non-causal (bidirectional)** attention to draft a full 16-token block in one pass. `TRITON_ATTN` doesn't support non-causal attention and rejects the drafter at engine init:

```
ValueError: Selected backend AttentionBackendEnum.TRITON_ATTN is not valid
for this configuration. Reason: ['non-causal attention not supported']
```

Result: Gemma 4 + DFlash speculative decoding is **structurally impossible upstream** today.

The general lesson: spec-decode's MTP (multi-token prediction) variant *needs* backend propagation, because those drafters share KV cache with the target. DFlash drafters have their **own** KV cache and are algorithmically independent — they're a different shape of speculative-decode entirely. A backend lock that's correct for one shape is wrong for the other. The fix is one line — make backend propagation conditional on whether the drafter is independent — but the diagnosis is the load-bearing work, because nothing in the error message points you at MTP-vs-DFlash as the relevant distinction.

The fork lives at [vLLM PR #42069](https://github.com/vllm-project/vllm/pull/42069); the upstream issue with the full diagnosis is at [#42068](https://github.com/vllm-project/vllm/issues/42068). 12 attempts and ~$25 of H100 time before we had a clean Phase 1 run, almost all of it spent isolating this single decoupling issue.

---

## Phase 1 — stock target, the harness check

Stock `google/gemma-4-31B-it` + DFlash drafter, 10 prompts (5 math, 5 conversational), `temperature=0.0`, `max_new_tokens=256`, on Modal H100-80GB:

| Prompt category | with DFlash | without | speedup |
|---|---:|---:|---:|
| Math reasoning peak (prompt 4) | 169–176 tok/s | ~40 tok/s | **4.4×** |
| Mixed average (10 prompts) | 50.6 tok/s | 39.4 tok/s | **1.28×** |

Math-heavy prompts dominate the speedup — exactly as the paper predicts. Acceptance length is highest when the next-token distribution is sharp, which is the case for arithmetic and step-by-step reasoning. The cold-start prompt drags the average down (17.5 tok/s on prompt 1 due to torch.compile + CUDA graph capture for the spec pipeline).

Output bit-identical between the two runs, as the verifier-lossless guarantee promises.

This was enough to confirm: our patched vLLM works, the drafter loads, the spec pipeline runs end-to-end. Time to swap in our target.

---

## Phase 2 — DFO target, the actual question

Our QLoRA fine-tune ships as a 4-bit adapter (`adapter_model.safetensors` + `adapter_config.json`) trained with unsloth. To feed it to vLLM we needed a merged bf16 checkpoint. After peft 0.13's `Gemma4ClippableLinear` rejection ate ~$0.20 of CPU-merge attempt, we split the work:

1. **`merge_dfo_to_volume` on A100-40GB** — unsloth `FastLanguageModel.from_pretrained(..., load_in_4bit=True)` then `save_pretrained_merged(save_method="merged_16bit")`. NF4 load 102s, bf16 dequant + write 357s. Total ~7.6 min, ~$0.20. Persisted to `arena-models:/gemma4-31b-qlora-v2-atd-merged/`.
2. **`phase2_dfo_target` on H100** — loads the merged path directly (no merge cost on the expensive GPU), runs the same A/B as Phase 1.

Result:

| Phase | Target | Avg speedup | Math peak | vs Phase 1 |
|---|---|---:|---:|---:|
| 1 | `google/gemma-4-31B-it` (stock) | 1.28× | 4.4× | — |
| 2 | merged DFO QLoRA target | **1.18×** | **4.0×** | **92%** |

DFO captures **92% of the stock-target speedup**. We expected somewhere between 50% and 80%. Got 92%.

The math-peak retention is similarly strong (4.0× / 4.4× = 91%). And critically, the verifier-lossless guarantee held: prompt 3 emitted exactly 1 token in **both** runs (a behavior shift in the DFO model where it terminates early on a particular medical-reasoning prompt) — confirming the spec-decode pipeline really is preserving the target's distribution.

<figure class="blog-chart">
  <img src="/images/charts/chart-dflash-throughput-retention.svg" alt="Bar chart of DFlash speedups for stock Gemma 4 31B vs our DFO QLoRA fine-tune, on the mixed-prompt average (1.28× vs 1.18×, 92% retention) and the math-reasoning peak prompt (4.4× vs 4.0×, 91% retention). Footer band notes that spec-decode is verifier-lossless so the speedup is a strict throughput improvement with zero quality cost." loading="lazy">
  <figcaption>The drafter was trained for a target it never saw. It kept 92% of the throughput it earned on the target it <em>was</em> trained for. Verifier-lossless means the per-token quality cost is exactly zero — the speedup is a strict win.</figcaption>
</figure>

---

## What this means for anyone fine-tuning Gemma 4

The implication of Phase 2 is the genuinely useful one:

> You can take z-lab's stock-trained DFlash drafter, drop it on top of your QLoRA-merged Gemma 4, and capture ~90% of the published speedup. No drafter retraining. ~$0 on top of whatever you spend serving today.

z-lab's training recipe isn't public yet ("coming soon"), and a custom drafter pass is ~$5–15K of 8×H100 time. If you can get 92% of the speedup for free, the math says wait on the custom drafter.

We'd love to see independent confirmation on other Gemma 4 fine-tunes — and on Llama 3.1 / Qwen3 fine-tunes paired with their respective stock drafters. The acceptance-length retention is probably similar (transformers fine-tuned on domain corpora generally preserve the layer-wise hidden-state distribution well), but 92% is one datapoint, not a curve.

---

## Two ways to read "1.18×"

The headline 1.18× hides two separate comparisons that point in different directions.

**Comparison 1 — same target, same H100, with-DFlash vs without.** The patch's direct impact. 1.18× / 4.0× on our DFO target. Verifier-lossless. The spec-decode mechanism literally adds tokens-per-second to a fixed checkpoint on a fixed GPU.

**Comparison 2 — stock target vs DFO target, both with DFlash.** The 92% retention. Confirms our fine-tune composes with the stock-trained drafter, which is the load-bearing finding for the entire "drop-in DFlash for fine-tunes" hypothesis.

The first comparison says spec-decode works. The second says it transfers across the supervised + DPO distributional shift. Neither follows from the other; both are necessary for the thesis.

---

## Concurrency: where the architecture stops mattering

Single-stream throughput numbers are easy to over-interpret. The interesting throughput regime for any inference path is what happens under concurrent load — and here the architectural choice (continuous batching vs serialized `model.generate`) dominates the kernel-level speedup. We measured the DFlash endpoint at concurrency 1 / 5 / 10 / 25 / 50:

<figure class="blog-chart">
  <img src="/images/charts/chart-dflash-prod-cutover.svg" alt="Three-panel comparison between the prior serialized inference path and the DFlash continuous-batching path on the same suite. Pass rate at concurrency=2: 2 of 10 (8 timeouts on the serialized path) vs 10 of 10 on DFlash. Median per-test latency: 37 seconds vs 2.5 seconds (~15× faster). Cost per request: $0.0113 vs $0.0027 (~4× cheaper). A footer strip notes quality on the 2 prompts both paths served was identical, so the failures are infrastructure (queue + timeout), not output drift." loading="lazy">
  <figcaption>The 15× per-test gap is mostly the architectural difference (continuous batching vs serialized generate), not just the spec-decode kernel speedup. Spec-decode is the per-token win; continuous batching is the queue-depth win. They compose multiplicatively under realistic concurrent load.</figcaption>
</figure>

Throughput plateaus at concurrency ≈ 10 (~1.3 rps, ~86 tok/s); beyond that the engine just queues and inflates p99 latency without raising completion throughput. The single-stream → 10-way batched gain on DFlash specifically is ~2.3× (38 → 86 tok/s). Less dramatic than what you see on long-prompt scenarios — our test prompts were short medical Q&A — but consistent with what continuous-batching architectures show on any LLM. For the long-form chat regime that real users actually generate, the multiplier grows with average response length.

Quality on every prompt that both paths could serve was identical, as the verifier-losslessness guarantee predicts. The 8 failures on the serialized path were timeout failures (queue exhaustion at 240s), not output-drift failures.

---

## TPU is a separate bet

Per [Google's blog](https://developers.googleblog.com/supercharging-llm-inference-on-google-tpus-achieving-3x-speedups-with-diffusion-style-speculative-decoding/), DFlash gets an additional ~2× on TPU v5p via JAX/Pallas. We're deferring because:

- No published Gemma-31B-on-TPU benchmark; the blog uses Llama-3.1-8B and Qwen3-4B targets.
- On-demand TPU v5p list price ($4.20/chip-hour × 2-4 chips for 31B = $8.40–$16.80/hr) is roughly cost-neutral with Modal H100 at $3.95/hr unless we commit to 1-yr/3-yr discounts.
- The PyTorch/torchax TPU path is WIP; production stack would mean JAX/Pallas, a much bigger porting effort.

Once we have a real H100 + DFlash $/M-tokens baseline through Fuhrman calibration, we'll have something concrete to compare a TPU pilot against.

---

## Reproduce it

The experiment is two phases. Each takes about 10 minutes of H100 time once the patched vLLM is in place.

```
Phase 1: stock target sanity check
  load google/gemma-4-31B-it + z-lab/gemma-4-31B-it-DFlash drafter
  run 10 prompts, temperature=0.0, max_new_tokens=256
  measure tok/s with and without spec-decode
  expected: 1.28× avg, 4.4× math-peak

Phase 2: your fine-tune
  merge your QLoRA adapter to bf16
  load the merged checkpoint + the same stock drafter
  run the identical 10-prompt suite
  measure tok/s with and without spec-decode
  the ratio of (Phase 2 speedup) / (Phase 1 speedup) is your retention number
```

The patched `dflash.py` (with the one-line backend-decoupling fix) is in our public repo and overlays onto vLLM nightly without a rebuild. Once [vLLM PR #42069](https://github.com/vllm-project/vllm/pull/42069) lands upstream, the overlay disappears and the standard `pip install vllm` is all you need.

---

## Acknowledgments

z-lab for releasing the [DFlash drafter](https://huggingface.co/z-lab/gemma-4-31B-it-DFlash) and the underlying [paper](https://arxiv.org/abs/2602.06036). vLLM maintainers for the spec-decode framework and for entertaining a fix for a corner-case backend lock. unsloth for making the Gemma 4 4-bit + merge-to-bf16 path Just Work.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DFlash.</strong> Chen, Liang, Liu, <a href="https://arxiv.org/abs/2602.06036" target="_blank" rel="noopener"><em>DFlash: Block Diffusion for Flash Speculative Decoding</em></a> (arXiv:2602.06036, 2026). Project page: <a href="https://z-lab.ai/projects/dflash/" target="_blank" rel="noopener">z-lab.ai/projects/dflash</a>. Reference implementation: <a href="https://github.com/z-lab/dflash" target="_blank" rel="noopener">github.com/z-lab/dflash</a>. From the abstract: "16-token chunks in parallel, conditioned on target model features, delivering up to 6× lossless acceleration."
  </li>
  <li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Gemma 4 family.</strong> Target model used in this post: <a href="https://huggingface.co/google/gemma-4-31B-it" target="_blank" rel="noopener">google/gemma-4-31B-it</a>. Family overview and tokenizer / context-length notes: <a href="https://ai.google.dev/gemma/docs/core" target="_blank" rel="noopener">Gemma model documentation</a>.
  </li>
  <li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>DFlash drafter checkpoint.</strong> <a href="https://huggingface.co/z-lab/gemma-4-31B-it-DFlash" target="_blank" rel="noopener">z-lab/gemma-4-31B-it-DFlash</a> — the bidirectional drafter trained against stock Gemma 4 31B that we dropped onto our QLoRA fine-tune.
  </li>
  <li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>vLLM backend fix.</strong> <a href="https://github.com/vllm-project/vllm/pull/42069" target="_blank" rel="noopener">vLLM PR #42069</a> — the one-line backend-lock decoupling fix that lets DFlash run alongside continuous batching. Until it lands upstream the `dflash.py` overlay in our public repo applies it at import time.
  </li>
  <li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Internal benchmark — the two charts above.</strong> The throughput-retention bars (1.28× / 1.18× average; 4.4× / 4.0× math-peak) and the prod-cutover panel (2/10 → 10/10 pass rate at concurrency=2, median 37 s → 2.5 s, cost $0.0113 → $0.0027) are measured from our own runs on the 10-prompt suite described in the "Reproducing the result" section, with the patched vLLM on H100s. Methodology and exact commands are in the post body; rerun for your own checkpoint and report the ratio against the stock Phase 1 number to compare to ours.
  </li>
</ol>

---

*Next up in the Inference Diaries: porting this same stack to TPU v5p and seeing whether the published 2× JAX/Pallas multiplier holds for a 31B medical Q&A target — and what changes when DFlash sits behind a [calibrated judge](/blog/calibrating-the-ai-judge/) instead of a strict gold-reference scorer.*

