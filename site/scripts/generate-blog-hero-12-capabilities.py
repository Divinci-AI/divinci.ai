#!/usr/bin/env python3
"""
Hero candidates for the "12 QA and Release Management Capabilities for LLMs"
blog post via Nano Banana Pro + Imagen 4 Ultra.
"""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "12-qa-and-release-management-capabilities-for-llms"

PROMPT = (
    "A Leonardo da Vinci notebook page on aged parchment, rendered in warm "
    "sepia ink with restrained rust-red and gold accents. The central "
    "illustration shows a Renaissance master craftsman's workshop arranged "
    "in four ornate stations, left to right, each holding three specialised "
    "inspection instruments — twelve total. Each station bears a Roman "
    "numeral and label above it: I REGISTER, II GATE, III ROLL, IV OBSERVE. "
    "At I — a bound codex being sealed with a wax stamp, beside a small "
    "set of identical loops labelled 'model, prompt, routing, dataset, "
    "preprocess' all funneling into the same seal; a small etching of a "
    "version-comparison fork; a vial of 'parity' liquid. "
    "At II — a tall balance scale with six tiny weighing dishes arrayed "
    "along its arm (one hanging visibly LOW), a portrait of a robed scholar "
    "(the calibrated judge) holding a feather pen, and a small parchment "
    "marked 'OVERRIDE — RATIONALE REQUIRED' bound by a wax seal. "
    "At III — a printer's press with three graduated paper-feed steps "
    "(5%, 25%, 100%) and a small observer-monitor portrait watching each "
    "step; a halt-lever marked with a rust-red 'STOP' tag. "
    "At IV — a clock-tower observer with a magnifying glass watching a "
    "continuously-scrolling parchment of production traces, a small "
    "trip-hammer lever marked 'rollback — 12s', and a wax-sealed receipt "
    "labelled 'SHA-256' hanging from a chain. "
    "Below the four stations, a single elegant ribbon banner reads "
    "'TWELVE CAPABILITIES, FOUR STATIONS, ONE PIPELINE'. A red AUDIT wax "
    "seal at the bottom-center reads 'AUDIT · SIGNED · SHA-256'. Marginal "
    "sketches in the right margin show 12 small numbered glyph icons "
    "(1 through 12) corresponding to each instrument. Warm cream parchment "
    "background, deep sepia and rust ink, occasional gold-leaf highlight on "
    "key labels. Crafted, scholarly, Renaissance notebook aesthetic — the "
    "same visual family as the existing 'How to Build an LLM CI/CD Pipeline' "
    "and '10 CI/CD Release Failures' hero illustrations. No modern UI "
    "elements, no AI gradient slop. 16:9 aspect ratio, wide composition."
)

CANDIDATES_PER_MODEL = 2


def http_post(url, body, timeout=180):
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"),
                                  headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')[:400]}")


def save_png(b64, path):
    path.write_bytes(base64.b64decode(b64))


def call_nano(prompt, slug, idx):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key={API_KEY}"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"],
                                 "imageConfig": {"aspectRatio": "16:9"}}}
    t0 = time.time()
    resp = http_post(url, body)
    elapsed = time.time() - t0
    parts = (resp.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
    image_part = next((p for p in parts if "inlineData" in p), None)
    if not image_part:
        raise RuntimeError(f"No image: {json.dumps(resp)[:400]}")
    out = OUT_DIR / f"{slug}__nano-banana-pro__{idx:02d}.png"
    save_png(image_part["inlineData"]["data"], out)
    return out, elapsed


def call_imagen(prompt, slug, idx):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict?key={API_KEY}"
    body = {"instances": [{"prompt": prompt}],
            "parameters": {"sampleCount": 1, "aspectRatio": "16:9",
                           "personGeneration": "allow_adult"}}
    t0 = time.time()
    resp = http_post(url, body)
    elapsed = time.time() - t0
    preds = resp.get("predictions", [])
    if not preds or not preds[0].get("bytesBase64Encoded"):
        raise RuntimeError(f"No prediction bytes")
    out = OUT_DIR / f"{slug}__imagen-4-ultra__{idx:02d}.png"
    save_png(preds[0]["bytesBase64Encoded"], out)
    return out, elapsed


def main():
    print(f"Generating {2*CANDIDATES_PER_MODEL} candidates for {SLUG}\n")
    fails = 0
    for idx in range(1, CANDIDATES_PER_MODEL+1):
        try:
            p, t = call_nano(PROMPT, SLUG, idx)
            print(f"  ✓ nano-banana-pro #{idx}: {p.name} ({p.stat().st_size/1024:.0f} KB, {t:.1f}s)")
        except Exception as e:
            print(f"  ✗ nano-banana-pro #{idx}: {e}"); fails += 1
    for idx in range(1, CANDIDATES_PER_MODEL+1):
        try:
            p, t = call_imagen(PROMPT, SLUG, idx)
            print(f"  ✓ imagen-4-ultra  #{idx}: {p.name} ({p.stat().st_size/1024:.0f} KB, {t:.1f}s)")
        except Exception as e:
            print(f"  ✗ imagen-4-ultra  #{idx}: {e}"); fails += 1
    return 0 if not fails else 1


if __name__ == "__main__":
    sys.exit(main())
