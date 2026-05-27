#!/usr/bin/env python3
"""Hero candidates for the automated-rollback post — Hopper's 'Nighthawks'
reimagined with a softly-glowing AI figure tending the night shift.
Departure from the Renaissance-notebook aesthetic the prior posts used."""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "automated-llm-ci-cd-pipelines-with-instant-rollback"

PROMPT = (
    "A reimagining of Edward Hopper's 'Nighthawks' (1942) painted in the "
    "original's distinctive style — large curved corner-window of a late-"
    "night American diner, deep teal-blue empty street outside, warm "
    "creamy-yellow interior light spilling onto the sidewalk, distant "
    "shuttered storefronts across the avenue. Inside the diner: the long "
    "wooden counter curves from left to right. Two seated customers in "
    "1940s coats sit at the counter quietly nursing coffee, painted in "
    "Hopper's flat solid tones. Behind the counter, where the original "
    "painting's apron-wearing soda-jerk would stand, there is instead a "
    "single softly-glowing humanoid figure — light from within, "
    "translucent, with the contour of a person but luminous as if made of "
    "warm parchment-gold light. The AI figure is gently wiping a coffee "
    "cup with a folded cloth, a quiet act of service. On the wall above "
    "the AI figure is a round bakelite Art Deco wall clock reading "
    "exactly 02:14. Through the diner's curved corner window, visible on "
    "the opposite building's brick wall outside: a small understated "
    "neon sign glows red, reading 'ROLLBACK · 12s'. On the counter near "
    "the AI figure, a single small printed receipt rests with a wax-style "
    "seal stamp visible — 'AUDIT · SIGNED · SHA-256' — produced moments "
    "ago. Faint glowing motes drift from the AI figure's hand, suggesting "
    "the act of recording. Soft warm interior lighting; deep cool exterior "
    "night; Hopper's signature painterly stillness; cinematic, "
    "atmospheric, awe-inducing, hopeful. The juxtaposition is clean and "
    "intentional: mid-century American realism + an AI presence tending "
    "the night shift while everyone sleeps. NO modern UI overlays. NO AI "
    "gradient slop. NO sci-fi cliches. Painterly, oil-on-canvas texture. "
    "16:9 aspect ratio, wide cinematic composition."
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
    out = OUT_DIR / f"{slug}__nano-banana-pro-v2__{idx:02d}.png"
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
    out = OUT_DIR / f"{slug}__imagen-4-ultra-v2__{idx:02d}.png"
    save_png(preds[0]["bytesBase64Encoded"], out)
    return out, elapsed

def main():
    print(f"Generating up to {2*CANDIDATES_PER_MODEL} Hopper-style candidates for {SLUG}\n")
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
