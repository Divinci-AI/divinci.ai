#!/usr/bin/env python3
"""
Generate hero image candidates for the "Hosted Hermes on Cloudflare" blog post.

Mirrors generate-blog-hero-headroom-rag-context-compression.py so the aesthetic
stays in the same da Vinci notebook family. Hermes-the-messenger-god is the
visual pun: a winged messenger routing sealed scrolls to a row of identical,
walled study-cells (one agent, one sandbox) beneath a Cloudflare sky.

Reads GEMINI_API_KEY from env. Writes PNGs to
site/static/images/blog-hero-candidates/<slug>__<model>__<NN>.png
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

SLUG = "hosted-hermes-on-cloudflare"

PROMPT = (
    "A Leonardo da Vinci notebook page on aged cream parchment, rendered in warm "
    "sepia ink with restrained gold and rust accents — scholarly, hand-drawn, "
    "Renaissance engineering-sketch aesthetic, the same visual family as the "
    "RAG-Arena and Calibrating-the-Judge hero illustrations. The scene is a pun "
    "on Hermes, the winged messenger god. On the LEFT, Hermes stands in flowing "
    "robes with small feathered winged sandals and a caduceus, holding a bundle "
    "of sealed wax-stamped scrolls, acting as a courier. Radiating to the RIGHT, "
    "a neat row of FOUR identical isolated study-cells — small stone-walled "
    "chambers, each fully separated from its neighbours by a thick wall — and "
    "inside each cell a small robed automaton-scholar sits at its own lectern "
    "reading, one per cell, none able to see into the others (a metaphor for "
    "one isolated agent per sandbox container). Hermes delivers exactly one "
    "sealed scroll to each cell through its own small arched slot. Overhead, a "
    "stylized sketched cloud (a subtle nod to a cloud platform) lets thin rays "
    "of light down into each separate cell. Marginal engineering annotations "
    "frame the page: a small brass key labelled 'hsk-' beside a padlock; a "
    "bracket around the row of cells labelled 'one agent · one sandbox'; a tiny "
    "diagram of a single conduit splitting to four walled rooms; a caduceus "
    "doodle. A small stamped seal at the lower corner reads 'DIVINCI · HERMES'. "
    "Warm cream parchment background, deep sepia and rust ink, occasional "
    "gold-leaf highlight on the wax seals and the key. Crafted and scholarly, no "
    "modern UI elements, no glossy gradients, no AI gradient slop. 16:9 aspect "
    "ratio, wide horizontal composition with generous negative space."
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


def call_nano_banana_pro(prompt: str, slug: str, idx: int) -> tuple[Path, float]:
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
    out_path = OUT_DIR / f"{slug}__nano-banana-pro__{idx:02d}.png"
    save_png(image_part["inlineData"]["data"], out_path)
    return out_path, elapsed


def call_imagen_4_ultra(prompt: str, slug: str, idx: int) -> tuple[Path, float]:
    url = (
        "https://generativelanguage.googleapis.com/v1beta/"
        "models/imagen-4.0-ultra-generate-001:predict"
        f"?key={API_KEY}"
    )
    body = {
        "instances": [{"prompt": prompt}],
        "parameters": {"sampleCount": 1, "aspectRatio": "16:9", "personGeneration": "allow_adult"},
    }
    t0 = time.time()
    resp = http_post(url, body)
    elapsed = time.time() - t0
    preds = resp.get("predictions", [])
    if not preds or not preds[0].get("bytesBase64Encoded"):
        raise RuntimeError(f"No image: {json.dumps(resp)[:600]}")
    out_path = OUT_DIR / f"{slug}__imagen-4-ultra__{idx:02d}.png"
    save_png(preds[0]["bytesBase64Encoded"], out_path)
    return out_path, elapsed


def main() -> int:
    print(f"Output dir: {OUT_DIR}")
    for idx in range(1, CANDIDATES_PER_MODEL + 1):
        try:
            path, elapsed = call_nano_banana_pro(PROMPT, SLUG, idx)
            print(f"  ✓ nano-banana-pro #{idx}: {path.name} ({path.stat().st_size/1024:.0f} KB, {elapsed:.1f}s)")
        except Exception as e:
            print(f"  ✗ nano-banana-pro #{idx} FAILED: {e}")
    for idx in range(1, CANDIDATES_PER_MODEL + 1):
        try:
            path, elapsed = call_imagen_4_ultra(PROMPT, SLUG, idx)
            print(f"  ✓ imagen-4-ultra  #{idx}: {path.name} ({path.stat().st_size/1024:.0f} KB, {elapsed:.1f}s)")
        except Exception as e:
            print(f"  ✗ imagen-4-ultra  #{idx} FAILED: {e}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
