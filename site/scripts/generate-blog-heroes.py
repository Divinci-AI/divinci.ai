#!/usr/bin/env python3
"""
Generate hero image candidates for two draft blog posts via:
  - gemini-3-pro-image-preview  (Nano Banana Pro)
  - imagen-4.0-ultra-generate-001  (Imagen 4 Ultra)

Reads GEMINI_API_KEY from env. Writes PNGs to
site/static/images/blog-hero-candidates/<slug>__<model>__<NN>.png
and prints a per-call timing/cost report.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set in environment.")

PROMPTS = {
    "dflash-blueprint": (
        "A vintage engineering blueprint on aged sepia paper, drawn in the style of a 1920s "
        "Bell Labs schematic. The diagram shows two transformer architectures rendered as "
        "mechanical assemblies: on the right, a large primary engine labeled \"TARGET — "
        "GEMMA 4 31B\" composed of stacked rectangular layers connected by KV-cache "
        "pipelines. On the left, a smaller, more compact engine labeled \"DRAFTER — "
        "DFLASH 2B\" with five bidirectional attention chambers arranged in parallel. A "
        "bundle of sixteen luminous threads labeled \"K=16 BLOCK\" flows from the drafter "
        "into the target, where they are verified in a single parallel pass. Annotations "
        "in elegant draftsman's handwriting label \"BLOCK-DIFFUSION DRAFT\", "
        "\"VERIFIER-LOSSLESS PATH\", \"HIDDEN STATES, LAYERS 0–27\". Margin sketches show "
        "acceptance-length curves, exploded-view brackets, and a tiny stamped seal "
        "reading \"PATCHED · VLLM #42069\". Warm cream paper, deep sepia ink, restrained "
        "gold accents on key labels. Crafted, hand-drawn, Renaissance-meets-engineering, "
        "no AI gradient slop."
    ),
    "rag-arena-leonardo": (
        "A Leonardo da Vinci notebook page on aged parchment, rendered in warm sepia ink "
        "and faint red chalk. The central illustration shows three robed scholars seated "
        "at a curved marble bench, each holding a small bronze scale to weigh a parchment "
        "scroll. The three scrolls are identical; the three scales tip differently — one "
        "nearly balanced, one heavy on the left, one heavy on the right. Below, in "
        "mirror-reversed Italian script, a marginal notation reads \"ρ = 0,552\". "
        "Surrounding the scene, sketched in fainter ink: a coliseum-style arena floor "
        "plan, a routing diagram of three pipes converging into a single fountain, "
        "geometric studies of correlation curves, and a small portrait sketch of a fourth "
        "figure (the human anchor) standing apart with a quill. Annotations include "
        "\"SCORED·QA\", \"ARENA·B\", \"EXIT·4×\", \"WINNER·PICK\". Warm cream parchment "
        "background, deep sepia and rust ink, occasional gold-leaf highlight on key "
        "annotations. Crafted, scholarly, Renaissance notebook aesthetic — the same "
        "visual family as the existing Calibrating-the-Judge and Deleting-Paris hero "
        "illustrations."
    ),
}

CANDIDATES_PER_MODEL = 2


def http_post(url: str, body: dict, timeout: int = 180) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body_text}") from e


def save_png(b64: str, path: Path) -> None:
    path.write_bytes(base64.b64decode(b64))


def call_nano_banana_pro(prompt: str, slug: str, idx: int) -> tuple[Path, float, dict]:
    """gemini-3-pro-image-preview via :generateContent. Returns one image per call."""
    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        "models/gemini-3-pro-image-preview:generateContent"
        f"?key={API_KEY}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {
                "aspectRatio": "16:9",
            },
        },
    }
    t0 = time.time()
    resp = http_post(url, body)
    elapsed = time.time() - t0

    parts = (resp.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    image_part = next((p for p in parts if "inlineData" in p), None)
    if not image_part:
        raise RuntimeError(f"No image in response: {json.dumps(resp)[:600]}")
    b64 = image_part["inlineData"]["data"]

    out_path = OUT_DIR / f"{slug}__nano-banana-pro__{idx:02d}.png"
    save_png(b64, out_path)
    return out_path, elapsed, resp.get("usageMetadata", {})


def call_imagen_4_ultra(prompt: str, slug: str, idx: int) -> tuple[Path, float, dict]:
    """imagen-4.0-ultra-generate-001 via :predict. Ultra is sampleCount=1 only."""
    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        "models/imagen-4.0-ultra-generate-001:predict"
        f"?key={API_KEY}"
    )
    body = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "16:9",
            "personGeneration": "allow_adult",
        },
    }
    t0 = time.time()
    resp = http_post(url, body)
    elapsed = time.time() - t0

    preds = resp.get("predictions", [])
    if not preds:
        raise RuntimeError(f"No predictions in response: {json.dumps(resp)[:600]}")
    b64 = preds[0].get("bytesBase64Encoded")
    if not b64:
        raise RuntimeError(f"No bytesBase64Encoded in prediction: {json.dumps(preds[0])[:600]}")

    out_path = OUT_DIR / f"{slug}__imagen-4-ultra__{idx:02d}.png"
    save_png(b64, out_path)
    return out_path, elapsed, {}


def main() -> int:
    print(f"Output dir: {OUT_DIR}")
    print(f"API key length: {len(API_KEY)} (prefix: {API_KEY[:6]}...)")
    print(f"Generating {len(PROMPTS) * 2 * CANDIDATES_PER_MODEL} images "
          f"({len(PROMPTS)} prompts × 2 models × {CANDIDATES_PER_MODEL} candidates)")
    print()

    results: list[dict] = []

    for slug, prompt in PROMPTS.items():
        print(f"=== {slug} ===")

        for idx in range(1, CANDIDATES_PER_MODEL + 1):
            try:
                path, elapsed, usage = call_nano_banana_pro(prompt, slug, idx)
                size_kb = path.stat().st_size / 1024
                print(f"  ✓ nano-banana-pro #{idx}: {path.name} "
                      f"({size_kb:.0f} KB, {elapsed:.1f}s)")
                results.append({"model": "nano-banana-pro", "slug": slug, "idx": idx,
                                "path": str(path), "elapsed_s": elapsed, "usage": usage})
            except Exception as e:
                print(f"  ✗ nano-banana-pro #{idx} FAILED: {e}")
                results.append({"model": "nano-banana-pro", "slug": slug, "idx": idx,
                                "error": str(e)})

        for idx in range(1, CANDIDATES_PER_MODEL + 1):
            try:
                path, elapsed, _ = call_imagen_4_ultra(prompt, slug, idx)
                size_kb = path.stat().st_size / 1024
                print(f"  ✓ imagen-4-ultra  #{idx}: {path.name} "
                      f"({size_kb:.0f} KB, {elapsed:.1f}s)")
                results.append({"model": "imagen-4-ultra", "slug": slug, "idx": idx,
                                "path": str(path), "elapsed_s": elapsed})
            except Exception as e:
                print(f"  ✗ imagen-4-ultra  #{idx} FAILED: {e}")
                results.append({"model": "imagen-4-ultra", "slug": slug, "idx": idx,
                                "error": str(e)})
        print()

    # Summary
    successes = [r for r in results if "error" not in r]
    failures = [r for r in results if "error" in r]
    total_time = sum(r.get("elapsed_s", 0) for r in successes)
    print(f"--- SUMMARY ---")
    print(f"  ok:     {len(successes)}/{len(results)}")
    print(f"  failed: {len(failures)}")
    print(f"  total wall on successful calls: {total_time:.1f}s")
    print(f"  estimated cost: ~${len(successes) * 0.07:.2f} (rough mid-range)")

    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
