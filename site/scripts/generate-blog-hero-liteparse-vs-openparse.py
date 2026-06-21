#!/usr/bin/env python3
"""
Generate hero image candidates for the "We Made Our RAG Pipeline Parse PDFs
20-50x Faster" (LiteParse vs OpenParse) blog post via:
  - gemini-3-pro-image-preview  (Nano Banana Pro)
  - imagen-4.0-ultra-generate-001  (Imagen 4 Ultra)

Reads GEMINI_API_KEY from env. Writes PNGs to
site/static/images/blog-hero-candidates/<slug>__<model>__<NN>.png

Mirrors generate-blog-hero-headroom-rag-context-compression.py so the aesthetic
stays in the same da Vinci notebook family as the RAG-Arena / Headroom heroes.
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

SLUG = "liteparse-vs-openparse-faster-pdf-parsing"

PROMPT = (
    "A Leonardo da Vinci notebook page on aged parchment, rendered in warm "
    "sepia ink with restrained gold and rust accents. The central illustration "
    "depicts a race between two Renaissance-era document-parsing engines that "
    "shred a thick bound book down to a neat stack of small uniform index cards "
    "— a metaphor for two competing PDF parsers feeding a RAG pipeline. "
    "On the LEFT, labelled 'LITEPARSE': a compact, swift hand-cranked engine "
    "sitting right on the scholar's own desk, a fast clockwork press that flips "
    "a fat leather tome into a tall fanned stack of tiny cards in one motion, "
    "drawn with brisk economical lines, a small hare bounding beside it, and a "
    "tiny annotation 'in-process · runs here'. "
    "On the RIGHT, labelled 'OPENPARSE': a far larger, more ornate brass "
    "apparatus standing across a wide gap on the far side of a long aqueduct "
    "bridge, reached only by a winding pipe — a remote machine with coiled "
    "tubes and gauges that does the same job but slower, with a small tortoise "
    "beside it and an annotation 'remote service · over the wire'. "
    "Both engines feed their card-stacks into a glowing lattice grid of points "
    "on the right (a vector index), where a robed scholar files the cards. "
    "Marginal sketches frame the page: a balance scale tipping hard toward the "
    "left, the pans labelled '0.4 s' and '40 s'; a small dial reading "
    "'20-50x faster'; a tiny hourglass; and one struck-out warning sketch of a "
    "card covered in scrambled gibberish symbols, crossed out and annotated "
    "'not text'. A small stamped seal at the bottom reads 'DIVINCI · RAG · "
    "INGEST'. Warm cream parchment background, deep sepia and rust ink, "
    "occasional gold-leaf highlight on the glowing vector lattice and key "
    "annotations. Crafted, scholarly, Renaissance notebook aesthetic — the same "
    "visual family as the existing RAG-Arena and Headroom hero illustrations. "
    "No modern UI elements, no AI gradient slop. 16:9 aspect ratio, wide "
    "composition."
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
        raise RuntimeError(f"No predictions in response: {json.dumps(resp)[:600]}")
    b64 = preds[0].get("bytesBase64Encoded")
    if not b64:
        raise RuntimeError(f"No bytesBase64Encoded: {json.dumps(preds[0])[:600]}")

    out_path = OUT_DIR / f"{slug}__imagen-4-ultra__{idx:02d}.png"
    save_png(b64, out_path)
    return out_path, elapsed, {}


def main() -> int:
    print(f"Output dir: {OUT_DIR}")
    print(f"API key length: {len(API_KEY)} (prefix: {API_KEY[:6]}...)")
    print(f"Generating {2 * CANDIDATES_PER_MODEL} images "
          f"(1 prompt × 2 models × {CANDIDATES_PER_MODEL} candidates)")
    print()

    results: list[dict] = []
    print(f"=== {SLUG} ===")

    for idx in range(1, CANDIDATES_PER_MODEL + 1):
        try:
            path, elapsed, usage = call_nano_banana_pro(PROMPT, SLUG, idx)
            size_kb = path.stat().st_size / 1024
            print(f"  ✓ nano-banana-pro #{idx}: {path.name} "
                  f"({size_kb:.0f} KB, {elapsed:.1f}s)")
            results.append({"model": "nano-banana-pro", "idx": idx,
                            "path": str(path), "elapsed_s": elapsed})
        except Exception as e:
            print(f"  ✗ nano-banana-pro #{idx} FAILED: {e}")
            results.append({"model": "nano-banana-pro", "idx": idx, "error": str(e)})

    for idx in range(1, CANDIDATES_PER_MODEL + 1):
        try:
            path, elapsed, _ = call_imagen_4_ultra(PROMPT, SLUG, idx)
            size_kb = path.stat().st_size / 1024
            print(f"  ✓ imagen-4-ultra  #{idx}: {path.name} "
                  f"({size_kb:.0f} KB, {elapsed:.1f}s)")
            results.append({"model": "imagen-4-ultra", "idx": idx,
                            "path": str(path), "elapsed_s": elapsed})
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
