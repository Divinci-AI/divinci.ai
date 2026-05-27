#!/usr/bin/env python3
"""End-to-end hero video pipeline for the diagnose-QA-failures Rockwell hero.
Animation deliberately minimal — Rockwell stillness is the mood; we add only
gentle window light, a single page lift, and the tablet's diagnostic-tree
pulse. No camera motion, no zoom."""
from __future__ import annotations
import base64, json, os, shutil, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
SLUG = "how-to-diagnose-custom-llm-qa-failures-in-7-steps"
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
    "A subtle animation of a Norman Rockwell-style 1950s American "
    "country-doctor scene, oil-on-canvas texture preserved throughout. "
    "NO zoom, NO pan, NO camera motion — the painting holds its "
    "composition. Animation ONLY in these places, gentle and loopable:\n"
    "(1) The warm afternoon light through the window with sheer curtains "
    "brightens and dims very slowly as if a soft cloud passes outside, "
    "completing a cycle every 6 seconds.\n"
    "(2) The doctor's hand resting on the stack of papers shifts very "
    "slightly — a tiny finger movement, the kind a careful examiner "
    "makes while reading. He does NOT look up. He stays in the same "
    "thoughtful pose throughout.\n"
    "(3) The modern glowing tablet on the desk pulses gently with its "
    "diagnostic-tree visualization: the rust-red highlighted node on "
    "the tree softly pulses brighter and dimmer every 2 seconds, like "
    "a heartbeat indicator on a medical chart. The cool-blue glow on "
    "the doctor's hand pulses in rhythm with the tablet, very faint.\n"
    "(4) Inside the open leather doctor's bag at the left, one of the "
    "metal instruments catches the window light and glints softly once "
    "every couple of seconds.\n"
    "(5) The sheer curtains do NOT visibly sway. The framed diploma "
    "and the framed STEPS I-VII flowchart do NOT move.\n"
    "(6) No second figure enters or exits the scene.\n"
    "Mood: careful work, methodical hands, the diagnosis is forming. "
    "Warm Americana stillness. Loopable. Static camera. Oil-on-canvas "
    "texture preserved throughout."
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
