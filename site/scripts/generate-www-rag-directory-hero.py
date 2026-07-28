#!/usr/bin/env python3
"""
Generate hero image candidates for "WWW-RAG: Making the Open Web Chattable" via:
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

SLUG = "www-rag-directory-hero-constellation"

PROMPT = (
    "A wide, elegant night-sky illustration for a website hero banner, deep "
    "indigo and midnight blue (#0b0b14 to #1f1f3a) like a Renaissance "
    "astronomer's star chart. Across the upper half and edges, small glowing "
    "constellation glyphs drawn in fine gold line-art represent different "
    "websites: an open codex, an observatory dome, a classical column, a "
    "rocket, a market stall, a stack of books, a scroll — each glyph a tiny "
    "constellation of stars joined by hair-thin golden lines. A graceful "
    "brass clockwork spider, small and finely drawn, sits in the upper right "
    "corner spinning luminous golden web-threads that arc gently between the "
    "constellation glyphs like ley lines across the sky. Subtle da Vinci "
    "style faint geometric construction circles and arcs in very low-opacity "
    "gold in the background. The CENTER and LOWER-CENTER of the image must "
    "stay calm, dark and nearly empty — just deep indigo sky with a few "
    "faint stars — leaving clear space for interface text and a search bar "
    "to sit on top. Warm gold and soft white glows only; no other colors. "
    "Absolutely NO text, NO letters, NO words anywhere in the image. "
    "Painterly but restrained, premium, celestial-cartography aesthetic. "
    "21:9 ultra-wide banner composition."
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
