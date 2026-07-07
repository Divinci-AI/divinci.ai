#!/usr/bin/env python3
"""
Generate a Veo 3.1 hero video for the 'Prominence Is Not Relevance' blog post,
then convert it to WebM format and generate the WebP poster.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import shutil
import subprocess
import urllib.error
import urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
HEROES_DIR = ROOT / "static" / "images"
VIDEOS_DIR = ROOT / "static" / "blog-hero-videos"
VIDEOS_DIR.mkdir(parents=True, exist_ok=True)

SLUG = "prominence-is-not-relevance"
HERO_PNG = HEROES_DIR / "prominence-is-not-relevance-hero.png"
OUT_MP4 = VIDEOS_DIR / f"{SLUG}-veo31.mp4"
OUT_WEBM = VIDEOS_DIR / f"{SLUG}-veo31.webm"
OUT_POSTER = HEROES_DIR / f"{SLUG}-hero-poster.webp"

MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

PROMPT = (
    "A subtle animation of a painterly surrealist storefront at dusk in the style of René Magritte. "
    "NO zoom, NO pan, NO camera motion. The scene remains perfectly composed. "
    "Animation ONLY in these places, each gentle and loopable:\n"
    "(1) The warm amber light from the shop window glows softly, with faint variations like a flickering filament lamp.\n"
    "(2) Faint, misty rain falls vertically in the street, catching the light from the shop window.\n"
    "(3) The thin pencil-line of laser-blue light rising from the 'RELEVANCE' book pulses gently, sending tiny luminous pulses along its path to the arched keyhole.\n"
    "(4) The tiny brass scales floating next to the bowler-hatted man tip almost imperceptibly, swaying slowly in the air.\n"
    "(5) The man does not move; Magritte's signature silent stillness is preserved throughout.\n"
    "Mood: deep conceptual thought, surreal quiet, the hidden path of truth. "
    "Painterly oil texture preserved. Static camera. Loopable."
)


def http_post(url: str, body: dict, timeout: int = 120) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body_text}") from e


def http_get(url: str, timeout: int = 60) -> dict:
    req = urllib.request.Request(url, method="GET")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body_text = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body_text}") from e


def http_get_bytes(url: str, timeout: int = 180) -> bytes:
    req = urllib.request.Request(url, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def submit_veo() -> str:
    image_b64 = base64.b64encode(HERO_PNG.read_bytes()).decode("ascii")
    url = f"{BASE}/models/{MODEL}:predictLongRunning?key={API_KEY}"
    body = {
        "instances": [{
            "prompt": PROMPT,
            "image": {
                "bytesBase64Encoded": image_b64,
                "mimeType": "image/png",
            },
        }],
        "parameters": {
            "aspectRatio": "16:9",
            "durationSeconds": 4,
            "sampleCount": 1,
            "personGeneration": "allow_adult",
        },
    }
    resp = http_post(url, body)
    op_name = resp.get("name")
    if not op_name:
        raise RuntimeError(f"No operation name in submit response: {json.dumps(resp)[:600]}")
    return op_name


def poll(op_name: str, timeout_s: int = 600) -> dict:
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
    raise TimeoutError(f"Veo op {op_name} did not complete in {timeout_s}s")


def save_mp4(resp: dict, out: Path) -> int:
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
        raise RuntimeError(f"No predictions or samples: {json.dumps(resp)[:600]}")
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
    raise RuntimeError(f"No bytes/uri in prediction: {json.dumps(pred)[:600]}")


def to_webm(src_mp4: Path, dst_webm: Path) -> None:
    """VP9 + Opus webm. Matches Cloudflare's existing hero-video encoding —
    target ~1.5 Mbps, single pass, fast preset, silent (no audio track)."""
    if not shutil.which("ffmpeg"):
        sys.exit("ERROR: ffmpeg not found in PATH")
    cmd = [
        "ffmpeg", "-y", "-i", str(src_mp4),
        "-c:v", "libvpx-vp9",
        "-b:v", "1500k",
        "-crf", "32",
        "-deadline", "good",
        "-cpu-used", "2",
        "-an",   # no audio (existing hero videos are silent)
        "-pix_fmt", "yuv420p",
        str(dst_webm),
    ]
    print(f"  ffmpeg → {dst_webm.name}")
    subprocess.run(cmd, check=True, capture_output=True)


def make_poster(src_png: Path, dst_webp: Path) -> None:
    """Convert hero PNG → quality-82 WebP poster, same dimensions."""
    if not shutil.which("cwebp"):
        sys.exit("ERROR: cwebp not found in PATH")
    cmd = ["cwebp", "-q", "82", "-mt", str(src_png), "-o", str(dst_webp)]
    print(f"  cwebp → {dst_webp.name}")
    subprocess.run(cmd, check=True, capture_output=True)


def main() -> int:
    print(f"Hero PNG: {HERO_PNG}")
    print(f"Veo model: {MODEL}")
    print()

    # 1) Veo image-to-video
    print(f"[1/4] Submit Veo image-to-video job…")
    op = submit_veo()
    print(f"  op: {op}")
    print()

    print(f"[2/4] Poll until complete…")
    resp = poll(op, timeout_s=600)
    mp4_bytes = save_mp4(resp, OUT_MP4)
    print(f"  ✓ {OUT_MP4.name} ({mp4_bytes/1024:.0f} KB)")
    print()

    # 3) MP4 → WebM
    print(f"[3/4] Convert MP4 → WebM…")
    to_webm(OUT_MP4, OUT_WEBM)
    webm_kb = OUT_WEBM.stat().st_size / 1024
    print(f"  ✓ {OUT_WEBM.name} ({webm_kb:.0f} KB)")
    print()

    # 4) Make WebP poster
    print(f"[4/4] Make WebP poster…")
    make_poster(HERO_PNG, OUT_POSTER)
    poster_kb = OUT_POSTER.stat().st_size / 1024
    print(f"  ✓ {OUT_POSTER.name} ({poster_kb:.0f} KB)")
    print()

    print("Success!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
