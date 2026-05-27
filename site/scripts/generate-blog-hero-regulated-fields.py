#!/usr/bin/env python3
"""Hero candidates for the 'Validating and Releasing Custom LMs in Regulated
Fields' blog post. Compliance/regulatory aesthetic in the existing Leonardo
notebook visual family."""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "validating-and-releasing-custom-lms-in-regulated-fields"

PROMPT = (
    "A Leonardo da Vinci notebook page on aged parchment, rendered in warm "
    "sepia ink with restrained rust-red and gold accents. The central "
    "illustration is a Renaissance verification chamber: a heavy wooden "
    "desk at the center holds an open bound codex with a freshly-applied "
    "red wax seal. Surrounding the desk, four ornate scroll cartouches "
    "hang on the wall, each labelled with the name of a regulator in "
    "elegant draftsman lettering — 'EU AI ACT', 'GDPR · ART. 17', 'HIPAA', "
    "and 'NIST AI RMF' — and each scroll has a corresponding small wax "
    "seal beside it in a different color (deep green for EU AI Act, rust-"
    "red for GDPR, warm tan for HIPAA, sage green for NIST). A scribe in "
    "scholarly robes stands at the desk holding a magnifying glass over "
    "the open codex, inspecting a small visible inset that reads "
    "'manifest_sha256: 9abaeaf6...' in tiny precise lettering. To one "
    "side, a hash-chained ribbon of wax-sealed receipt cards extends from "
    "the desk into the page margin, each card slightly smaller than the "
    "last, suggesting a verifiable chain that any auditor could trace. "
    "Marginal sketches show a small balance scale (gate), a tiny clock-"
    "tower (observer), and a wax stamp tool (register). A red AUDIT seal "
    "at the bottom-center reads 'AUDIT · SIGNED · SHA-256'. Warm cream "
    "parchment background, deep sepia and rust ink, occasional gold-leaf "
    "highlight on key labels (the regulator names and the AUDIT stamp). "
    "Crafted, scholarly, Renaissance notebook aesthetic — the same visual "
    "family as the existing 'How to Build an LLM CI/CD Pipeline' and "
    "'12 QA Capabilities' hero illustrations. No modern UI elements, no "
    "AI gradient slop. 16:9 aspect ratio, wide composition."
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
            "generationConfig": {"responseModalities": ["IMAGE"], "imageConfig": {"aspectRatio": "16:9"}}}
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
            "parameters": {"sampleCount": 1, "aspectRatio": "16:9", "personGeneration": "allow_adult"}}
    t0 = time.time()
    resp = http_post(url, body)
    elapsed = time.time() - t0
    preds = resp.get("predictions", [])
    if not preds or not preds[0].get("bytesBase64Encoded"):
        raise RuntimeError("No prediction bytes")
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
