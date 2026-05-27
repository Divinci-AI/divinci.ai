#!/usr/bin/env python3
"""
Hero candidates for the "10 CI/CD Release Failures in Custom Language Models"
post via gemini-3-pro-image-preview (Nano Banana Pro) + imagen-4.0-ultra.

Mirrors generate-blog-hero-cicd-pipeline.py exactly. Same Renaissance-notebook
aesthetic family.
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
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "10-ci-cd-release-failures-in-custom-language-models"

PROMPT = (
    "A Leonardo da Vinci notebook page on aged parchment, rendered in warm "
    "sepia ink with restrained rust-red and gold accents. The central "
    "illustration shows a Renaissance-era inspection floor with four "
    "quality-control stations arranged left to right, each catching a "
    "different kind of defect on a flat conveyor of bound manuscripts. "
    "Above each station, an elegant Roman numeral and label: I REGISTER, "
    "II GATE, III ROLL, IV OBSERVE. Hand-drawn 'defective' items are shown "
    "being lifted off the line by a small mechanical hand at the correct "
    "station: at I, a manuscript with three loose seals scattering apart "
    "(model + prompt + routing un-bundled); at II, six tiny weighing scales "
    "arrayed on a balance with one scale clearly hanging low below a dashed "
    "'threshold' line; at III, a printer's press with a stepped paper feed "
    "marked 5% 25% 100% and a small monitor portrait observing each step; "
    "at IV, a clock-tower observer with a magnifying glass, watching a "
    "continuous parchment scroll for hallucinated dates (a small ink "
    "annotation reading 'MARCH XXXII' is being struck through). A red wax "
    "stamp at the bottom reads 'AUDIT · SIGNED · SHA-256'. Marginal sketches "
    "on the right show ten small numbered defect icons (1 through 10) being "
    "sorted into the four station buckets above. Warm cream parchment "
    "background, deep sepia and rust ink, occasional gold-leaf highlight on "
    "key labels (the Roman numerals and the AUDIT stamp). Crafted, scholarly, "
    "Renaissance notebook aesthetic — the same visual family as the existing "
    "'How to Build an LLM CI/CD Pipeline' hero illustration. No modern UI "
    "elements, no AI gradient slop. 16:9 aspect ratio, wide composition."
)

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
    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        "models/gemini-3-pro-image-preview:generateContent"
        f"?key={API_KEY}"
    )
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {"aspectRatio": "16:9"},
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
        raise RuntimeError(f"No predictions: {json.dumps(resp)[:600]}")
    b64 = preds[0].get("bytesBase64Encoded")
    if not b64:
        raise RuntimeError(f"No bytesBase64Encoded: {json.dumps(preds[0])[:600]}")
    out_path = OUT_DIR / f"{slug}__imagen-4-ultra__{idx:02d}.png"
    save_png(b64, out_path)
    return out_path, elapsed, {}


def main() -> int:
    print(f"Output dir: {OUT_DIR}")
    print(f"Generating {2 * CANDIDATES_PER_MODEL} images "
          f"(1 prompt × 2 models × {CANDIDATES_PER_MODEL} candidates)")
    print()
    results: list[dict] = []
    print(f"=== {SLUG} ===")
    for idx in range(1, CANDIDATES_PER_MODEL + 1):
        try:
            path, elapsed, _ = call_nano_banana_pro(PROMPT, SLUG, idx)
            kb = path.stat().st_size / 1024
            print(f"  ✓ nano-banana-pro #{idx}: {path.name} ({kb:.0f} KB, {elapsed:.1f}s)")
            results.append({"model": "nano-banana-pro", "idx": idx, "path": str(path)})
        except Exception as e:
            print(f"  ✗ nano-banana-pro #{idx} FAILED: {e}")
            results.append({"model": "nano-banana-pro", "idx": idx, "error": str(e)})
    for idx in range(1, CANDIDATES_PER_MODEL + 1):
        try:
            path, elapsed, _ = call_imagen_4_ultra(PROMPT, SLUG, idx)
            kb = path.stat().st_size / 1024
            print(f"  ✓ imagen-4-ultra  #{idx}: {path.name} ({kb:.0f} KB, {elapsed:.1f}s)")
            results.append({"model": "imagen-4-ultra", "idx": idx, "path": str(path)})
        except Exception as e:
            print(f"  ✗ imagen-4-ultra  #{idx} FAILED: {e}")
            results.append({"model": "imagen-4-ultra", "idx": idx, "error": str(e)})
    successes = [r for r in results if "error" not in r]
    failures = [r for r in results if "error" in r]
    print()
    print(f"--- SUMMARY ---  ok: {len(successes)}/{len(results)}  failed: {len(failures)}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
