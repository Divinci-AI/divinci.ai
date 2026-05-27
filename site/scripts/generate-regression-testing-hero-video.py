#!/usr/bin/env python3
"""End-to-end hero video pipeline for the regression-testing Dalí hero.
Animation is deliberately minimal — Dalí stillness is the mood. We add
only slow drip/sag motion on the melting forms, gentle ant-crawl, and
a quiet pulse on the dashboard line. NO zoom, NO pan, NO camera motion."""
from __future__ import annotations
import base64, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
SLUG = "automated-regression-testing-for-custom-llms-in-2026"
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
    "A subtle animation of a Salvador Dalí-style 1931 'Persistence of "
    "Memory' surrealist Catalan landscape, oil-on-canvas texture "
    "preserved throughout. NO zoom, NO pan, NO camera motion — the "
    "painting holds its composition entirely. Animation ONLY in these "
    "places, all extremely subtle and loopable:\n"
    "(1) Each of the melting pocket-watches drips a single slow droplet "
    "every 3–4 seconds — the bone-gold watch on the wooden platform "
    "edge, the watch melting over the dead olive tree branch, the watch "
    "draped over the central sleeping organic form. The droplets fall "
    "and rejoin the watch face above without disturbing the painting's "
    "stillness.\n"
    "(2) The melting LLM evaluation tablet at the right also drips one "
    "slow droplet every 4 seconds from its bottom-right corner. The "
    "blue line-graph titled 'TASK COMPLETION · 30d' on the tablet face "
    "pulses very gently — the trend line slowly redraws itself sagging "
    "downward over 4 seconds, then resets, then sags again. Like a slow "
    "heartbeat indicator of drift.\n"
    "(3) The black ants on the closed brown pocket-watch in the lower-"
    "left corner crawl in a slow, hypnotic continuous loop around the "
    "watch face. They never leave the watch surface.\n"
    "(4) The Catalan sky's soft twilight clouds drift very slowly to "
    "the right, completing the cycle over 8 seconds. The light on the "
    "Cap de Creus cliffs in the distance does NOT visibly change.\n"
    "(5) The dead olive tree branch and the closed eye of the central "
    "sleeping organic form do NOT move. The sea does NOT visibly ripple.\n"
    "(6) No new objects enter the scene. No figures appear.\n"
    "Mood: stillness, slow decay, time dilating, drift made visible. "
    "Surreal Dalí precision. Static camera. Oil-on-canvas texture "
    "preserved throughout. Loopable."
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
    """4-second still-frame loop in case Veo quota is exhausted."""
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
