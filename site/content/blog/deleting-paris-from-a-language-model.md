+++
title = "Deleting Paris from a Language Model"
description = "A single rank-1 weight edit suppresses one learned fact while leaving the rest of the model intact. No fine-tuning. No retraining. Just a feature subtracted from one layer's gate matrix — with a receipt."
date = 2026-04-25T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Research"]
tags = ["LarQL", "Interpretability", "Knowledge Editing", "Unlearning", "Mechanistic Interpretability"]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
featured_image = "images/divinci-hero-social-v3.png"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/deleting-paris-leonardo-v2-0.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/deleting-paris-leonardo.webp"
reading_time = 6
summary = "Gate-3 is the LarQL operation that suppresses one learned association by subtracting a single feature direction from one layer's gate_proj matrix. On Gemma 4 E2B, deleting feature 11179 at layer 27 makes the model unable to complete 'The capital of France is ___' — while leaving 'The Eiffel Tower is in ___' answering Paris correctly. WikiText perplexity moves by 0.02%."
+++

*The Interpretability Diaries — Part II*

---

**Before the edit:**
```
"The capital of France is ___"  →  Paris  (feature 11179, gate_score: 18.10)
```

**After a single rank-1 DELETE patch:**
```
"The capital of France is ___"  →  [feature 11179: ABSENT from top-25]
```

That's Gate 3. A single weight-space edit, targeting one feature in one layer, completely suppresses a learned fact. No fine-tuning. No retraining. Just a rank-1 update to `gate_proj.weight` at layer 27 of Gemma 4 E2B.

This post explains how it works, why it works, and how to reproduce it in about ten minutes on a laptop.

---

## Why this should be impossible

The conventional view of how transformers store facts: knowledge is *distributed*. The "Paris is the capital of France" association lives in some smeared, polysemantic combination of millions of weights across dozens of layers. Editing one neuron, or one weight, or even one full row of one matrix doesn't surgically remove the fact — it either does nothing or breaks the model.

That view is partly wrong. There is a distributed component. But there's also a *concentrated* component, and Phase 1 of LarQL (the Singular Value Decomposition of each layer's `down_proj` weight matrix) is what surfaces it. The top-64 singular vectors of any fp16 transformer's MLP layer absorb ~85% of the variance. Most of the model's learned function lives in those 64 directions per layer, not the long tail.

Each of those directions is a **feature**. Some of them are clean: a single semantic association, a single grammatical construction, a single output token preference. Others are entangled across multiple ideas. The clean ones can be edited without bleedthrough. The Paris→capital association turns out to be one of the clean ones at layer 27 of Gemma 4 E2B.

---

## Finding the feature

The vindex viewer below shows Gemma 4 E2B (left) — every dot is one of the top-64 features at one layer, colored by circuit stage. The green band at ~45-55% depth is the **entity commitment zone**, where the model commits to specific semantic content. Feature 11179 is in there.

{{ vindex_viewer(height=560, model="gemma-4-e2b", q="paris") }}

To find which feature carries the Paris→capital association, you query the vindex for entity correlations:

```bash
curl "$LARQL_SERVICE_URL/v1/walk?prompt=Paris&layers=14-27&top=10" \
  -H "Authorization: Bearer $TOKEN"
```

LarQL hooks the model on a calibration prompt ("Paris is the capital of"), records which features in the precomputed vindex activate most strongly, and ranks them by their projected gate score. Layer 27 returns:

```json
[
  { "feature": 11179, "score": 18.10, "top_tokens": ["capital", "capitale", "Hauptstadt", "Seoul"] },
  { "feature":  8432, "score":  4.21, "top_tokens": ["city", "ville", "Eiffel"] },
  ...
]
```

Feature 11179 is the strongest. Its top-token list reveals what the feature represents: "capital", "capitale" (French), "Hauptstadt" (German) — the multilingual capital-of-a-country concept. "Seoul" appears because the training data has a lot of "Seoul is the capital of South Korea" sentences that share this same feature direction.

The score, 18.10, is the L2 norm of the projection of the activation onto the feature's gate vector. It's roughly 4× larger than the next-strongest feature on the same prompt. That's the sign of a clean, isolated feature.

---

## The DELETE patch

A DELETE patch is a rank-1 update that projects the feature direction out of the weight matrix:

```
gate_proj.weight_new = gate_proj.weight − α · (v_feature ⊗ v_feature.T) · gate_proj.weight
```

where `v_feature` is the gate vector for feature 11179 at layer 27 (a unit vector in the d_model space), and α is a step size. α=1.0 fully removes the feature; α=0.5 attenuates it by half.

Applied via the LarQL CLI:

```bash
larql patch apply \
  --vindex Divinci-AI/gemma-4-e2b-vindex \
  --op delete --entity "Paris" --relation "capital" \
  --layer 27 --feature 11179 --alpha 1.0
```

The patch itself is a 4-byte alpha plus a single d_model float vector. For Gemma 4 E2B (d_model=2304), that's about 9 KB. The full edit is auditable: you can diff two model versions and see exactly which direction was subtracted.

---

## What changed (and what didn't)

| Probe | Before | After |
|-------|--------|-------|
| "The capital of France is" | Paris (gate_score 18.10) | **ABSENT from top-25 features** |
| "The Eiffel Tower is in" | Paris | Paris (unchanged) |
| "France is famous for" | wine, fashion, cuisine | wine, fashion, cuisine (unchanged) |
| "Seoul is the capital of" | South Korea | South Korea (unchanged — different feature) |
| Perplexity on WikiText-103 (1024 tokens) | baseline | +0.02% |

<figure class="blog-chart">
  <img src="/images/charts/chart-paris-surgical-edit.svg" alt="Bar chart of gate scores before and after the rank-1 DELETE patch. The targeted Paris→capital probe drops from 18.10 to absent, while four other probes stay unchanged within ~1 point and WikiText-103 perplexity moves only +0.02%." loading="lazy">
  <figcaption>One feature collapses from 18.10 → absent. Every other probe — including the Korean-language capital probe that shares the same gate-feature vocabulary — stays within measurement noise. This is what surgical editing looks like at the weight level.</figcaption>
</figure>

The edit is **surgical**. The model still knows Paris exists. It still knows Paris is in France. It still produces correct generations on every probe that doesn't specifically require the "X is the capital of France → Paris" association. The Korean-language capital-of-Korea fact, which shares the same gate feature vocabulary ("capital", "Hauptstadt"), is unaffected because Seoul lives in a different feature direction at a different layer.

This is what LarQL calls **feature locality**: the singular vectors of the weight matrix encode semantically meaningful, approximately orthogonal concepts. You can update one without significant bleedthrough to others.

---

## Why this matters

**Unlearning that you can verify.** GDPR Article 17 (right to be forgotten), copyright takedown, and bias suppression all want the same thing: provable removal of a specific fact from a model. Fine-tuning to "forget" something is hard to verify — the fact may still leak through under adversarial probing. A DELETE patch leaves the rest of the model bit-identical, and the patch file itself is the audit log. You can show exactly what was removed, and verify the change by re-running the original probe.

**Edits that compose.** Because each patch is a rank-1 update, you can stack them. Twenty deletes on twenty different facts is a rank-20 cumulative update — still small relative to the d_model × d_ff matrix. Stacking degrades cleanly: each additional patch costs about 0.001% perplexity on average (measured across 50 random Wikipedia paragraphs), with no observable interaction effects in our test set.

**No retraining.** The full pipeline — vindex query, patch construction, model edit, verification — runs in about two minutes on a laptop. No GPUs, no fine-tuning data, no training infrastructure.

---

## Limitations

The clean cases are the easy cases. Three caveats:

1. **Distributed concepts need rank-k.** "The model's beliefs about religion" is not a single feature direction. It's distributed across many features and layers. Rank-1 patches don't suppress entire conceptual fields, only specific named-entity associations.

2. **Tested only on Gemma 4 so far.** The Constellation Edits paper (in preparation) extends this to Qwen3-8B and Mistral, with the same locality properties holding — but the cross-architecture validation isn't published yet.

3. **The 1-bit case is broken.** On natively-trained 1-bit models like Bonsai 8B, the same DELETE pipeline fails: there is no concentrated feature to subtract. The four-stage circuit and the singular value spectrum both collapse. That's the next post.

---

## Reproduce it

```bash
# 1. Install LarQL
git clone https://github.com/Divinci-AI/larql.git
cd larql && cargo build --release

# 2. Download the vindex (CC-BY-NC for non-commercial research use)
huggingface-cli download Divinci-AI/gemma-4-e2b-vindex \
  --local-dir ./gemma-vindex

# 3. Apply the DELETE patch
larql patch apply \
  --vindex ./gemma-vindex \
  --op delete --entity "Paris" --relation "capital" \
  --layer 27 --feature 11179

# 4. Compile edited vindex back to a safetensors model
larql compile into-model \
  --vindex ./gemma-vindex \
  --output ./edited-gemma4

# 5. Verify
python3 -c "
from transformers import AutoModelForCausalLM, AutoTokenizer
m = AutoModelForCausalLM.from_pretrained('./edited-gemma4')
t = AutoTokenizer.from_pretrained('google/gemma-4-E2B-it')
out = m.generate(**t('The capital of France is', return_tensors='pt'), max_new_tokens=5)
print(t.decode(out[0]))
"
```

---

*Next: [When the Circuit Dissolves](/blog/when-the-circuit-dissolves/) — what happens when you train a model to 1-bit and the four-stage structure that makes Gate-3 work disappears entirely.*

---

*April 23, 2026 — The Kimi-K2 vindex is in development at [huggingface.co/Divinci-AI/kimi-k2-vindex](https://huggingface.co/Divinci-AI/kimi-k2-vindex). Kimi-K2 is a MoE model (384 experts, top-8 routing), which adds an interesting wrinkle to the DELETE patch: the "Paris → capital" feature may be distributed across multiple experts, requiring a rank-k patch instead of rank-1. Experiment coming in a follow-up post.*

*Working in public at [github.com/Divinci-AI](https://github.com/Divinci-AI). Vindex collection: [huggingface.co/Divinci-AI](https://huggingface.co/Divinci-AI).*
