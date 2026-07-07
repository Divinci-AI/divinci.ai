#!/usr/bin/env python3
"""Hero candidates for the 'Prominence Is Not Relevance' blog post.
Surrealist oil painting in the style of René Magritte."""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "prominence-is-not-relevance"

PROMPT = (
    "A painterly surrealist oil painting in the conceptual style of René Magritte, "
    "depicting a mid-century storefront on a quiet Parisian cobblestone street at dusk. "
    "The palette is dominated by moody indigo-blue, rain-slicked charcoal-grey, and a "
    "warm, glowing amber light from the storefront window. In the center of the warm "
    "shop window, a single, enormous, gold-embossed book sits atop a plush red velvet "
    "pedestal, illuminated by a brilliant, dramatic spotlight under a small brass "
    "plaque that reads 'PROMINENCE'. To its side, resting on a humble wooden shelf "
    "in the shadows, is a simple, plain-covered book with a glowing title: 'RELEVANCE'. "
    "A thin, elegant pencil-line of pure laser-blue light rises from the RELEVANCE book "
    "and arcs gracefully through the air, bypassing the spotlight to unlock a heavy, "
    "arched oak door at the back of the shop. Outside on the slick street, a man in "
    "a black bowler hat and dark wool overcoat stands with his back to the viewer, "
    "observing the window. A tiny, delicate pair of brass balance scales floats "
    "silently in the air beside his shoulder, weighing a single glowing word against "
    "a heavy gold coin. Oil-on-canvas texture, visible paint strokes in the deep "
    "twilight sky, Magritte's signature dream-like stillness and conceptual precision. "
    "No modern UI overlays, no sci-fi gloss, no AI gradient slop. 16:9 aspect ratio, "
    "wide composition."
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
            short = str(e)[:160]
            print(f"  ✗ nano-banana-pro #{idx}: {short}"); fails += 1
    for idx in range(1, CANDIDATES_PER_MODEL+1):
        try:
            p, t = call_imagen(PROMPT, SLUG, idx)
            print(f"  ✓ imagen-4-ultra  #{idx}: {p.name} ({p.stat().st_size/1024:.0f} KB, {t:.1f}s)")
        except Exception as e:
            short = str(e)[:160]
            print(f"  ✗ imagen-4-ultra  #{idx}: {short}"); fails += 1
    return 0 if not fails else 1

if __name__ == "__main__":
    sys.exit(main())
