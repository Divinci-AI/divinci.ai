#!/usr/bin/env python3
"""Hero candidates for the diagnose-QA-failures post — Norman Rockwell
'Country Doctor' style: warm 1950s small-town American medical scene
reimagined for LLM diagnosis. Breaks from the Renaissance-notebook
aesthetic the series used through post #4."""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "how-to-diagnose-custom-llm-qa-failures-in-7-steps"

PROMPT = (
    "A Norman Rockwell-style oil painting in the visual language of his "
    "1947 'The Country Doctor' painting, executed in his signature warm "
    "Americana palette of cream-yellow, soft brown, deep teal, and warm "
    "ivory. The scene: a kindly small-town American doctor in a tweed "
    "vest and white shirt with rolled sleeves, sitting at a wooden roll-"
    "top desk in his cozy office, late afternoon light streaming through "
    "a window with sheer curtains. The doctor is leaning forward, "
    "stethoscope around his neck, carefully examining a thick stack of "
    "papers spread across the desk. The papers are labeled at the top "
    "edge with terms an LLM-engineer would recognize: 'EVAL SUITE', "
    "'JUDGE CALIBRATION ρ', 'PROMPT SHA', 'PREPROCESSING', 'DATASET "
    "SHA', 'RETRIEVAL INDEX'. A leather doctor's bag sits open beside "
    "the desk, instruments visible inside. On the wall behind the doctor "
    "hangs a small framed diploma and a framed pencil sketch of a "
    "diagnostic flowchart — 'STEPS I-VII' visible in elegant lettering. "
    "A single subtle anachronism: a modern glowing tablet rests at the "
    "near edge of the desk, screen showing a soft blue diagnostic tree "
    "with one node highlighted in rust-red. The tablet's glow tints the "
    "doctor's hand a faint cool blue against the warm room. The doctor's "
    "expression is patient, methodical, hopeful — the diagnosis is "
    "almost in hand. Painterly oil-on-canvas texture, brushwork visible. "
    "Cinematic depth-of-field on the doctor's hands and the papers. NO "
    "modern UI overlays. NO sci-fi gloss. NO AI gradient slop. The mood: "
    "careful work being done by someone who has done it many times. "
    "16:9 aspect ratio, wide composition."
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
    print(f"Generating up to {2*CANDIDATES_PER_MODEL} candidates for {SLUG}\n")
    fails = 0
    for idx in range(1, CANDIDATES_PER_MODEL+1):
        try:
            p, t = call_nano(PROMPT, SLUG, idx)
            print(f"  ✓ nano-banana-pro #{idx}: {p.name} ({p.stat().st_size/1024:.0f} KB, {t:.1f}s)")
        except Exception as e:
            short = str(e)[:120]
            print(f"  ✗ nano-banana-pro #{idx}: {short}"); fails += 1
    for idx in range(1, CANDIDATES_PER_MODEL+1):
        try:
            p, t = call_imagen(PROMPT, SLUG, idx)
            print(f"  ✓ imagen-4-ultra  #{idx}: {p.name} ({p.stat().st_size/1024:.0f} KB, {t:.1f}s)")
        except Exception as e:
            short = str(e)[:120]
            print(f"  ✗ imagen-4-ultra  #{idx}: {short}"); fails += 1
    return 0 if not fails else 1

if __name__ == "__main__":
    sys.exit(main())
