#!/usr/bin/env python3
"""Hero candidates for the CI-testing-for-LLMs post — Victorian master
typesetter's print workshop. The 'we proof before the press runs'
metaphor matches CI: contract tests + smoke before the full suite runs.
Distinct from all 7 prior heroes (Apollo / Sherlock / Mendeleev / Vermeer
/ Hopper / Rockwell / Dalí)."""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "ci-testing-for-custom-language-models-in-2026"

PROMPT = (
    "An oil painting in the visual language of a late-19th-century "
    "European master, executed in a warm chiaroscuro palette of "
    "candle-amber, deep ink-black, antique brass, cream paper, and "
    "polished oak. The scene: the interior of a Victorian-era master "
    "typesetter's print workshop, late evening, lit primarily by a "
    "single oil lamp on the workbench. The master compositor — a "
    "bearded craftsman in a cream linen shirt with rolled sleeves and "
    "a leather apron — stands at a tall wooden type-tray (called a "
    "California job case), picking individual lead type letters one "
    "at a time and setting them into a brass composing stick held in "
    "his left hand. His hands are steady, careful, methodical. On the "
    "workbench beside him: a galley proof — a long strip of paper with "
    "inked text — being inspected with a magnifier; small ink-stained "
    "cotton rags; a brass type-gauge; and three lead-line printer's "
    "blocks engraved with the letters 'PROOF', 'CI', 'MERGE' just "
    "subtly visible as part of the workshop signage. In the warm "
    "shadow behind him, a large cast-iron and brass Albion-style "
    "printing press dominates the background, its great fly-wheel and "
    "platen catching the lamp's light at the edges. A wooden type-"
    "cabinet stands against the back wall, its dozens of small drawers "
    "labelled in fine letterpress hand. The single subtle anachronism: "
    "at the right edge of the workbench, half-hidden among the lead "
    "type, sits a slim glowing tablet — its screen showing a vertical "
    "list of green check-marks beside the labels 'CONTRACT · SMOKE · "
    "FULL SUITE · REPLAY' in a clean modern monospace font. The "
    "tablet's cool blue glow tints the corner of the type-tray a "
    "faint blue against the otherwise warm amber room. The "
    "compositor's expression is patient, intent, satisfied — the "
    "proof is being set carefully, the press will not run until every "
    "letter is right. Oil-on-canvas texture, visible brushwork on the "
    "wood and brass, cinematic depth-of-field on the type and hands. "
    "NO modern UI overlays beyond the tablet's check-list. NO sci-fi "
    "gloss. NO AI gradient slop. NO extra modern objects. Mood: "
    "craftsmanship, careful work, the unseen labour that precedes a "
    "good edition. 16:9 aspect ratio, wide composition with the press "
    "looming in the background and the lamp-lit type-tray in the "
    "foreground."
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
