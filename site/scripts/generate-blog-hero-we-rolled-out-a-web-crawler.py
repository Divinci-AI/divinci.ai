#!/usr/bin/env python3
"""
Generate hero image candidates for "We Rolled Out a Web Crawler and Blocked
Every Request in Prod" via:
  - gemini-3-pro-image-preview  (Nano Banana Pro)
  - imagen-4.0-ultra-generate-001  (Imagen 4 Ultra)

Reads GEMINI_API_KEY from env. Writes PNGs to
site/static/images/blog-hero-candidates/<slug>__<model>__<NN>.png

Mirrors generate-blog-hero-headroom-rag-context-compression.py so the
aesthetic stays in the same da Vinci notebook family as the other RAG heroes.
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

SLUG = "we-rolled-out-a-web-crawler-and-blocked-prod"

PROMPT = (
    "A Leonardo da Vinci notebook page on aged parchment, rendered in warm "
    "sepia ink with restrained gold and rust accents. The central illustration "
    "depicts a brass mechanical spider — an automaton web-crawler — walking "
    "across an engraved map of interconnected pages and scrolls, each page "
    "trailing a fine thread back to a large ornate clockwork mechanism at the "
    "page's center: an escapement-and-gear engine representing a single "
    "ticking clock that must never stop turning. "
    "Four small jams are shown afflicting the clockwork in sequence, arranged "
    "as marginal vignettes around the central gear-engine like the stations of "
    "an alchemical diagram: "
    "(1, upper left) a simple hourglass mislabeled with a crossed-out tally "
    "mark, sand pouring in far faster than it can drain — annotated 'a fixed "
    "sleep is not a throttle'; "
    "(2, upper right) one single oversized, over-engraved gear-tooth wedged "
    "into the mechanism, jamming every other gear around it, with a small "
    "stopped clock hand frozen mid-tick — annotated 'the loop cannot yield'; "
    "(3, lower right) a candle inside the mechanism that has silently gone "
    "out, no smoke, no flame, the gears around it frozen mid-turn — annotated "
    "'no error, only silence'; "
    "(4, lower left) a courier pigeon flying away from an unfinished scroll "
    "still clamped in the mechanism's grip, the scroll's thread snapping "
    "behind it — annotated 'the instance that carried it is gone'. "
    "At the bottom center, a fifth, calmer vignette shows the mechanism "
    "repaired: a small sealed message-tube being handed between two identical "
    "clockwork hands across a gap, so the work survives the hand that drops "
    "it — annotated 'durable, not fire-and-forget'. "
    "A small stamped seal at the bottom reads 'DIVINCI · WWW-RAG'. Warm cream "
    "parchment background, deep sepia and rust ink, occasional gold-leaf "
    "highlight on the repaired mechanism and key annotations. Crafted, "
    "scholarly, Renaissance notebook aesthetic — the same visual family as "
    "the existing RAG-Arena and Headroom hero illustrations. No modern UI "
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
