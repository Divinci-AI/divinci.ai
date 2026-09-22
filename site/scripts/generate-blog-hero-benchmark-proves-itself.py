#!/usr/bin/env python3
"""Hero candidates for 'What a Benchmark Has to Prove About Itself' — the
TrustBench research post. Leonardo notebook visual family, like every other
classic hero on the blog."""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "images" / "blog-hero-candidates"
OUT_DIR.mkdir(parents=True, exist_ok=True)
API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

SLUG = "what-a-benchmark-has-to-prove-about-itself"

# The post's argument in one plate: a score can be honest and still mean
# nothing. Left, the gamed test — a brass automaton earns a perfect mark by
# handing in an EMPTY scroll. Centre, the sealed record every score travels
# with. Right, the control: the same instrument with its library shut, which
# is what makes the other readings mean anything. Text is kept to a few short
# words because image models garble anything longer.
PROMPT = (
    "A Leonardo da Vinci notebook page on aged parchment, rendered in warm "
    "sepia ink with restrained rust-red and gold accents. The page is a study "
    "of a Renaissance testing bench for thinking machines, drawn as three "
    "connected scenes read left to right. On the left, a small brass "
    "clockwork automaton stands before a stern examiner's lectern and hands "
    "up a perfectly EMPTY unrolled scroll, while above the lectern a chalk "
    "tally board shows a full row of marks — the examiner has scored the "
    "blank page as perfect. In the centre, the largest figure: an open bound "
    "ledger on a heavy oak desk, each line of the ledger ending in a small "
    "red wax seal, with a heart-shaped seal pressed at the foot of the page "
    "and a brass magnifying glass resting beside it, as if any passer-by "
    "could lift it and check the seals themselves. On the right, the same "
    "automaton sits at a reading desk with a tall bookcase behind it whose "
    "doors are shut and bound with a chain, and a nearly empty balance scale "
    "beside it, one pan barely weighted — the control reading, taken with "
    "the library closed. Fine hatched shading, measured construction lines, "
    "small marginal sketches of gears, a balance scale and a wax stamp. The "
    "only lettering on the page is the word 'CONTROL' in neat draftsman "
    "capitals under the right-hand scene. Warm cream parchment, deep sepia "
    "and rust ink, gold-leaf highlights on the seals only. Crafted, "
    "scholarly, Renaissance notebook aesthetic, the same visual family as "
    "the existing 'Validating and Releasing Custom LMs in Regulated Fields' "
    "hero. No modern UI elements, no screens, no AI gradient slop. 16:9 "
    "aspect ratio, wide composition with the important figures kept in the "
    "central band."
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
