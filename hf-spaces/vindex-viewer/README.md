---
title: LarQL Vindex Viewer
emoji: 🔬
colorFrom: purple
colorTo: blue
sdk: static
pinned: true
license: cc-by-nc-4.0
short_description: Interactive viewer for LarQL transformer vindexes
---

# LarQL Vindex Viewer

Interactive visualization of the SVD-decomposed feature structure of nine open-weight transformers, built from the [Divinci-AI vindex collection](https://huggingface.co/Divinci-AI).

**Two views, both live:**
- **3D cylinder** (default) — each model is a column of layer rings; feature points spiral around each ring colored by circuit stage (broadcast → domain → entity → prediction).
- **2D circuit** (`🔌 2D Circuit` button or `?view=flat`) — layers as horizontal rows with inter-layer edges between top features, network-style.

**Compare mode** (`⇌ Compare`) renders any two models side-by-side. The default pair (Qwen3-8B vs Bonsai b1.58 1-bit) is the headline visual: organized rings vs scattered dissolution cloud, the same data that drives Paper 1's 1-bit dissolution claim (var@64 ≈ 0.85 for fp16 vs ≈ 0.10 for 1-bit).

**Entity search** (`🔍` toolbar input or `?q=paris`) — type a token, see which features it activates across the model's depth. The Paris→capital match on Gemma 4 E2B is the LarQL Gate-3 result that Post 2 in our blog series unpacks.

**Demo** (`▶ Demo`) — 12-second scripted tour: build → orbit → reveal compare mode → tagline.

URL params: `?model=`, `?view=flat`, `?autoplay`, `?q=`. Combine freely.

---

## Background

A **vindex** is a transformer's weights decompiled into a queryable feature database. The viewer renders the top-64 SVD feature directions per layer — the directions that absorb ~85% of the down-projection matrix's variance in fp16 models and ~10% (near-Marchenko-Pastur random) in 1-bit models.

Full details, papers, and the LarQL toolchain: **[huggingface.co/Divinci-AI](https://huggingface.co/Divinci-AI)** · [github.com/Divinci-AI](https://github.com/Divinci-AI)
