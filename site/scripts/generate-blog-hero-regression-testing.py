#!/usr/bin/env python3
"""Hero candidates for the automated-regression-testing post — Salvador
Dalí 'The Persistence of Memory' (1931) reimagined for LLM regression
testing. Drift = time-dilation. Distinct from the prior 6 heroes."""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "automated-regression-testing-for-custom-llms-in-2026"

PROMPT = (
    "A surrealist oil painting in the visual language of Salvador Dalí's "
    "1931 'The Persistence of Memory', executed in Dalí's signature warm "
    "muted palette of bone-cream, golden-brown, deep teal-blue, and dusty "
    "ochre, with the soft Catalan twilight glow. The scene: a desolate "
    "coastal landscape with the iconic flat horizon and the distant Cap "
    "de Creus cliffs catching late afternoon light, painted in Dalí's "
    "precise photo-realistic surrealism. In the foreground a brown wooden "
    "platform extends from the left. Four soft, melting pocket-watches "
    "drape over different surfaces: one bone-gold watch draped over the "
    "edge of the wooden platform; one melting over the bare branch of a "
    "leafless olive tree growing up from the platform's left side; one "
    "limp atop a soft sleeping organic form at center (the classic Dalí "
    "self-portrait shape, eye closed, eyelashes visible); and one — the "
    "single subtle anachronism — is a melting LLM EVALUATION DASHBOARD, "
    "rectangular tablet-shaped but melting over the platform's right "
    "edge with the same soft draping motion as the other watches. The "
    "tablet's glowing face shows a faint blue line-graph titled 'TASK "
    "COMPLETION · 30d' with one line gently sagging toward the bottom-"
    "right corner of its display, perfectly recognizable but understated. "
    "On the closed brown leather pocket-watch in the lower-left corner, "
    "small black ants crawl over the metal surface — Dalí's classic "
    "symbol of decay. The cracked dry foreground earth catches warm "
    "shadow. Mood: stillness, slow decay, time dilating, drift made "
    "visible. Oil-on-canvas texture preserved throughout, brushwork "
    "visible in the sky, photo-realistic precision on the melting forms. "
    "NO modern UI overlays. NO sci-fi gloss. NO AI gradient slop. NO "
    "extra text on the dashboard beyond the title and graph. The dream-"
    "like Dalí stillness, the famous Empordà landscape, with one small "
    "anachronism that belongs as quietly as the others. 16:9 aspect "
    "ratio, wide composition with the horizon roughly one-third from "
    "the top."
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
