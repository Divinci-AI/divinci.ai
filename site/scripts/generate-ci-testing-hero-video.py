#!/usr/bin/env python3
"""End-to-end hero video pipeline for the CI-testing print-workshop hero.
Animation is minimal — Rembrandt stillness is the mood. Lamp flicker, a
finger movement on the type-tray, slow tablet check-mark pulse. NO zoom,
NO pan, NO camera motion. Falls back to static-WebM if Veo 429s."""
from __future__ import annotations
import base64, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
SLUG = "ci-testing-for-custom-language-models-in-2026"
HERO_PNG = ROOT / "static" / "images" / f"{SLUG}-hero.png"
VIDEO_DIR = ROOT / "static" / "blog-hero-videos"
IMG_DIR = ROOT / "static" / "images"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)
OUT_MP4 = VIDEO_DIR / f"{SLUG}-veo31.mp4"
OUT_WEBM = VIDEO_DIR / f"{SLUG}-veo31.webm"
OUT_POSTER = IMG_DIR / f"{SLUG}-hero-poster.webp"
MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

PROMPT = (
    "A subtle animation of a Victorian master typesetter's print "
    "workshop oil painting, oil-on-canvas texture preserved throughout. "
    "NO zoom, NO pan, NO camera motion — the painting holds its "
    "composition entirely. Animation ONLY in these places, all "
    "extremely subtle and loopable:\n"
    "(1) The flame of the brass oil lamp flickers very gently, its "
    "warm amber light pulsing slightly across the master compositor's "
    "face and hands every 2 seconds — like a real candle in still air.\n"
    "(2) The compositor's right hand makes a single small movement "
    "every 3 seconds: he places one lead type letter into the composing "
    "stick, picks up the next from the type-tray, hand returns to "
    "rest. The movement is slow, careful, methodical. He does NOT "
    "look up. He stays in the same intent pose throughout.\n"
    "(3) The glowing tablet at the right edge of the workbench shows "
    "its check-list — the four green check-marks beside CONTRACT, "
    "SMOKE, FULL SUITE, REPLAY pulse very gently in sequence, one at "
    "a time, over a 4-second cycle, then resets. Like a CI pipeline "
    "completing each stage. The cool blue tint on the corner of the "
    "type-tray pulses faintly in rhythm with the tablet glow.\n"
    "(4) Wisps of paper-smoke from the lamp drift slowly upward.\n"
    "(5) The great brass fly-wheel of the printing press in the "
    "background does NOT turn. The press is at rest, waiting.\n"
    "(6) The type-cabinet drawers do NOT move. The galley proof on "
    "the workbench does NOT shift.\n"
    "(7) No new figures enter. No new objects appear.\n"
    "Mood: craftsmanship, careful work, the unseen labour that "
    "precedes a good edition. The proof is being set, the press is "
    "waiting. Static camera. Oil-on-canvas texture preserved "
    "throughout. Loopable."
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
                out.write_bytes(http_get_bytes(uri))
                return out.stat().st_size
        raise RuntimeError("No predictions/samples")
    pred = preds[0]
    if "bytesBase64Encoded" in pred:
        out.write_bytes(base64.b64decode(pred["bytesBase64Encoded"]))
        return out.stat().st_size
    uri = (pred.get("video") or {}).get("uri") or pred.get("videoUri")
    if uri:
        if "key=" not in uri:
            uri = f"{uri}{'&' if '?' in uri else '?'}key={API_KEY}"
        out.write_bytes(http_get_bytes(uri))
        return out.stat().st_size
    raise RuntimeError("No bytes/uri")

def to_webm(src, dst):
    subprocess.run(["ffmpeg", "-y", "-i", str(src),
                    "-c:v", "libvpx-vp9", "-b:v", "1500k", "-crf", "32",
                    "-deadline", "good", "-cpu-used", "2",
                    "-an", "-pix_fmt", "yuv420p", str(dst)],
                   check=True, capture_output=True)

def static_webm_fallback(src_png, dst_webm):
    subprocess.run(["ffmpeg", "-y", "-loop", "1", "-i", str(src_png),
                    "-t", "4", "-c:v", "libvpx-vp9", "-b:v", "800k", "-crf", "32",
                    "-pix_fmt", "yuv420p", "-r", "24", str(dst_webm)],
                   check=True, capture_output=True)

def make_poster(src, dst):
    subprocess.run(["cwebp", "-q", "82", "-mt", str(src), "-o", str(dst)],
                   check=True, capture_output=True)

def main():
    print(f"Hero PNG: {HERO_PNG}\n")
    try:
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
    except RuntimeError as e:
        if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
            print(f"  ⚠ Veo quota: {str(e)[:200]}")
            print("[FALLBACK] Generating static-WebM loop from hero PNG…")
            static_webm_fallback(HERO_PNG, OUT_WEBM)
            print(f"  ✓ {OUT_WEBM.name} ({OUT_WEBM.stat().st_size/1024:.0f} KB, static fallback)\n")
        else:
            raise
    print("[4/4] Make WebP poster…")
    make_poster(HERO_PNG, OUT_POSTER)
    print(f"  ✓ {OUT_POSTER.name} ({OUT_POSTER.stat().st_size/1024:.0f} KB)\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())
