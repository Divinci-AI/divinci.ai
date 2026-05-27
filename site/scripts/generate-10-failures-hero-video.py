#!/usr/bin/env python3
"""
End-to-end hero video pipeline for the "10 CI/CD Release Failures" blog post.

  hero.png  →  Veo 3.1 image-to-video  →  hero.mp4
              →  ffmpeg -c:v libvpx-vp9  →  hero.webm
              →  cwebp                   →  hero-poster.webp

Mirrors generate-cicd-pipeline-hero-video.py — same R2 upload pattern at the end.
"""

from __future__ import annotations

import base64
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
SLUG = "10-ci-cd-release-failures-in-custom-language-models"

HERO_PNG = ROOT / "static" / "images" / f"{SLUG}-hero.png"
VIDEO_DIR = ROOT / "static" / "blog-hero-videos"
IMG_DIR = ROOT / "static" / "images"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

OUT_MP4 = VIDEO_DIR / f"{SLUG}-veo31.mp4"
OUT_WEBM = VIDEO_DIR / f"{SLUG}-veo31.webm"
OUT_POSTER = IMG_DIR / f"{SLUG}-hero-poster.webp"

MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

# Loopable ambient parallax. Each of the four inspection stations animates
# within its own drawn boundary. A small parchment conveyor advances slowly
# left-to-right; defects get lifted off the line at the correct station; the
# right-side bucket sketches shimmer as items are sorted.
PROMPT = (
    "A Leonardo da Vinci notebook page on aged parchment, observed from "
    "directly above, holding the same composition throughout. NO zoom, NO "
    "pan, NO camera motion. The four inspection stations of the drawn "
    "assembly line each animate within their own sketched boundary:\n"
    "(I) REGISTER — three loose seals (model, prompt, routing) gently drift "
    "apart on the un-bundled manuscript while a small sepia hand pulls the "
    "defective item off the conveyor and into the I bucket on the right.\n"
    "(II) GATE — the six tiny weighing scales on the balance arm sway "
    "slightly; the lowest scale (labelled 'LOW') pulses with a faint rust-red "
    "glow as it falls below the dashed threshold line; the corresponding "
    "defective scroll is lifted to the II bucket.\n"
    "(III) ROLL — the printer's press feeds paper forward in a slow loop, "
    "the graduated 5% → 25% → 100% indicator advances stepwise then returns; "
    "the small portrait-monitor sketch above the press blinks every couple "
    "of seconds; a small defect is plucked to the III bucket.\n"
    "(IV) OBSERVE — the clock-tower pendulum swings gently; the observer "
    "with the magnifying glass tracks a continuously-scrolling parchment of "
    "'MARCH XXXIII / MARCH XXXIV / MARCH XXXII…' down the right side, with "
    "the impossible date 'MARCH XXXII' being visibly struck through with a "
    "small ink mark; that defect is dropped into the IV bucket.\n"
    "The ten bucket icons on the right edge faintly fill with sepia ink as "
    "defects accumulate. The 'AUDIT · SIGNED · SHA-256' wax seal at the "
    "bottom center glows softly when each station completes a tick. "
    "Each animation stays inside its own drawn region. The page itself does "
    "not move. Atmospheric, scholarly, restrained, loopable. Static camera. "
    "Renaissance notebook aesthetic, the same visual family as the existing "
    "'How to Build an LLM CI/CD Pipeline' hero illustration."
)


def http_post(url, body, timeout=120):
    req = urllib.request.Request(
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"}, method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}")


def http_get(url, timeout=60):
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode('utf-8', errors='replace')}")


def http_get_bytes(url, timeout=180):
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def submit_veo():
    if not HERO_PNG.exists():
        sys.exit(f"ERROR: hero PNG not found at {HERO_PNG}")
    image_b64 = base64.b64encode(HERO_PNG.read_bytes()).decode("ascii")
    url = f"{BASE}/models/{MODEL}:predictLongRunning?key={API_KEY}"
    body = {
        "instances": [{"prompt": PROMPT,
                       "image": {"bytesBase64Encoded": image_b64, "mimeType": "image/png"}}],
        "parameters": {"aspectRatio": "16:9", "durationSeconds": 4,
                       "sampleCount": 1, "personGeneration": "allow_adult"},
    }
    resp = http_post(url, body)
    op = resp.get("name")
    if not op:
        raise RuntimeError(f"No op name: {json.dumps(resp)[:600]}")
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
                raise RuntimeError(f"Op failed: {json.dumps(op['error'])[:600]}")
            print(f"  done after {polls} polls")
            return op.get("response", {})
        print(f"  polling… {polls}× (~{polls * 10}s elapsed)")
        time.sleep(10)
    raise TimeoutError(f"Veo did not complete in {timeout_s}s")


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
        raise RuntimeError(f"No predictions/samples: {json.dumps(resp)[:600]}")
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
    raise RuntimeError(f"No bytes/uri in prediction")


def to_webm(src, dst):
    if not shutil.which("ffmpeg"):
        sys.exit("ERROR: ffmpeg not found")
    cmd = [
        "ffmpeg", "-y", "-i", str(src),
        "-c:v", "libvpx-vp9", "-b:v", "1500k", "-crf", "32",
        "-deadline", "good", "-cpu-used", "2",
        "-an", "-pix_fmt", "yuv420p", str(dst),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def make_poster(src, dst):
    if not shutil.which("cwebp"):
        sys.exit("ERROR: cwebp not found")
    subprocess.run(["cwebp", "-q", "82", "-mt", str(src), "-o", str(dst)],
                   check=True, capture_output=True)


def main():
    print(f"Hero PNG: {HERO_PNG}")
    print(f"Veo model: {MODEL}\n")

    print("[1/4] Submit Veo image-to-video job…")
    op = submit_veo()
    print(f"  op: {op}\n")

    print("[2/4] Poll until complete…")
    resp = poll(op, timeout_s=600)
    mp4_bytes = save_mp4(resp, OUT_MP4)
    print(f"  ✓ {OUT_MP4.name} ({mp4_bytes/1024:.0f} KB)\n")

    print("[3/4] Convert MP4 → WebM…")
    to_webm(OUT_MP4, OUT_WEBM)
    print(f"  ✓ {OUT_WEBM.name} ({OUT_WEBM.stat().st_size/1024:.0f} KB)\n")

    print("[4/4] Make WebP poster…")
    make_poster(HERO_PNG, OUT_POSTER)
    print(f"  ✓ {OUT_POSTER.name} ({OUT_POSTER.stat().st_size/1024:.0f} KB)\n")

    print("--- ready for R2 upload ---")
    print(f"  WebM: {OUT_WEBM}")
    print(f"  Poster: {OUT_POSTER}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
