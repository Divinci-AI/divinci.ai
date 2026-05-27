#!/usr/bin/env python3
"""End-to-end hero video pipeline for the automated-rollback Hopper hero.
Animation here is deliberately MINIMAL — Hopper's stillness is the mood;
oversized motion would break the painting."""
from __future__ import annotations
import base64, json, os, shutil, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
SLUG = "automated-llm-ci-cd-pipelines-with-instant-rollback"

HERO_PNG = ROOT / "static" / "images" / f"{SLUG}-hero.png"
VIDEO_DIR = ROOT / "static" / "blog-hero-videos"
IMG_DIR = ROOT / "static" / "images"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

OUT_MP4 = VIDEO_DIR / f"{SLUG}-veo31.mp4"
OUT_WEBM = VIDEO_DIR / f"{SLUG}-veo31.webm"
OUT_POSTER = IMG_DIR / f"{SLUG}-hero-poster.webp"

MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

# Deliberately understated. Hopper's diner paintings are still. We want
# the painting to feel ALIVE without losing the stillness.
PROMPT = (
    "A subtle animation of an Edward Hopper 'Nighthawks'-style 1940s "
    "American diner scene at 2:14 AM, painted oil-on-canvas texture. "
    "NO zoom, NO pan, NO camera motion — the painting stays exactly where "
    "it is. Animation ONLY in these specific locations, each gentle and "
    "loopable:\n"
    "(1) The 'ROLLBACK · 12s' neon sign on the brick wall across the street "
    "outside the diner gently flickers in the red-neon manner — a single "
    "soft pulse every 1.5 seconds, never sputtering, always coming back "
    "on.\n"
    "(2) The softly-glowing humanoid AI figure behind the counter is "
    "moving its arm in a slow continuous loop, wiping the coffee cup with "
    "the folded cloth. A meditative, deliberate gesture. Faint warm "
    "parchment-gold light from within the figure pulses very gently in "
    "rhythm with the wipe.\n"
    "(3) A single thin wisp of steam rises from one of the customers' "
    "coffee cups on the counter, drifting upward and dissipating, then "
    "appearing again — continuous loop.\n"
    "(4) The hands of the bakelite Art Deco wall clock reading 02:14 do "
    "NOT move. The clock is frozen at that exact moment.\n"
    "(5) The seated customers DO NOT move. They are still figures in the "
    "painting.\n"
    "(6) The wax-sealed AUDIT · SIGNED · SHA-256 receipt on the counter "
    "shimmers very faintly with golden ink — barely perceptible.\n"
    "The mood: midnight peace, deep stillness, an AI tending the night "
    "shift while humans sit quietly with their coffee. Cinematic, "
    "painterly, hopeful, awe-inducing. Loopable. Static camera. "
    "Oil-painting texture preserved throughout."
)


def http_post(url, body, timeout=120):
    req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"),
                                  headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')[:400]}")


def http_get(url, timeout=60):
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')[:400]}")


def http_get_bytes(url, timeout=180):
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def submit_veo():
    image_b64 = base64.b64encode(HERO_PNG.read_bytes()).decode("ascii")
    url = f"{BASE}/models/{MODEL}:predictLongRunning?key={API_KEY}"
    body = {"instances": [{"prompt": PROMPT,
                            "image": {"bytesBase64Encoded": image_b64, "mimeType": "image/png"}}],
            "parameters": {"aspectRatio": "16:9", "durationSeconds": 4,
                           "sampleCount": 1, "personGeneration": "allow_adult"}}
    resp = http_post(url, body)
    op = resp.get("name")
    if not op:
        raise RuntimeError("No op name")
    return op


def poll(op_name, timeout_s=600):
    url = f"{BASE}/{op_name}?key={API_KEY}"
    deadline = time.time() + timeout_s
    polls = 0
    while time.time() < deadline:
        polls += 1
        op = http_get(url)
        if op.get("done"):
            if "error" in op:
                raise RuntimeError(f"Op failed: {json.dumps(op['error'])[:400]}")
            print(f"  done after {polls} polls")
            return op.get("response", {})
        print(f"  polling… {polls}× (~{polls*10}s)")
        time.sleep(10)
    raise TimeoutError("Veo did not complete")


def save_mp4(resp, out):
    preds = resp.get("predictions") or []
    if not preds:
        samples = (resp.get("generateVideoResponse", {})
                       .get("generatedSamples", []))
        if samples:
            uri = samples[0].get("video", {}).get("uri")
            if uri:
                if "key=" not in uri:
                    uri = f"{uri}{'&' if '?' in uri else '?'}key={API_KEY}"
                data = http_get_bytes(uri)
                out.write_bytes(data)
                return len(data)
        raise RuntimeError("No predictions/samples")
    pred = preds[0]
    if "bytesBase64Encoded" in pred:
        data = base64.b64decode(pred["bytesBase64Encoded"])
        out.write_bytes(data)
        return len(data)
    uri = (pred.get("video") or {}).get("uri") or pred.get("videoUri")
    if uri:
        if "key=" not in uri:
            uri = f"{uri}{'&' if '?' in uri else '?'}key={API_KEY}"
        data = http_get_bytes(uri)
        out.write_bytes(data)
        return len(data)
    raise RuntimeError("No bytes/uri")


def to_webm(src, dst):
    subprocess.run(["ffmpeg", "-y", "-i", str(src),
                    "-c:v", "libvpx-vp9", "-b:v", "1500k", "-crf", "32",
                    "-deadline", "good", "-cpu-used", "2",
                    "-an", "-pix_fmt", "yuv420p", str(dst)],
                   check=True, capture_output=True)


def make_poster(src, dst):
    subprocess.run(["cwebp", "-q", "82", "-mt", str(src), "-o", str(dst)],
                   check=True, capture_output=True)


def main():
    print(f"Hero PNG: {HERO_PNG}\n")
    print("[1/4] Submit Veo job…")
    op = submit_veo()
    print(f"  op: {op}\n")
    print("[2/4] Poll…")
    resp = poll(op, timeout_s=600)
    mp4_bytes = save_mp4(resp, OUT_MP4)
    print(f"  ✓ {OUT_MP4.name} ({mp4_bytes/1024:.0f} KB)\n")
    print("[3/4] MP4 → WebM…")
    to_webm(OUT_MP4, OUT_WEBM)
    print(f"  ✓ {OUT_WEBM.name} ({OUT_WEBM.stat().st_size/1024:.0f} KB)\n")
    print("[4/4] Make WebP poster…")
    make_poster(HERO_PNG, OUT_POSTER)
    print(f"  ✓ {OUT_POSTER.name} ({OUT_POSTER.stat().st_size/1024:.0f} KB)\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
