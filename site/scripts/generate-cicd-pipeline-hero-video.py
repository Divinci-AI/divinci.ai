#!/usr/bin/env python3
"""
End-to-end hero video pipeline for the CI/CD pipeline blog post.

  hero.png  →  Veo 3.1 image-to-video  →  hero.mp4
              →  ffmpeg -c:v libvpx-vp9  →  hero.webm
              →  cwebp                   →  hero-poster.webp

Reads GEMINI_API_KEY from env. Writes outputs into
  site/static/blog-hero-videos/
  site/static/images/
so the existing R2 upload pattern (wrangler r2 object put) can ship them
to https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/ alongside the
other blog hero videos.

Mirrors the pattern in generate-veo-videos.py exactly. Self-contained: no
deps beyond ffmpeg, cwebp, and the Python stdlib.
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
SLUG = "how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai"

HERO_PNG = ROOT / "static" / "images" / f"{SLUG}-hero.png"
VIDEO_DIR = ROOT / "static" / "blog-hero-videos"
IMG_DIR = ROOT / "static" / "images"
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

OUT_MP4 = VIDEO_DIR / f"{SLUG}-veo31.mp4"
OUT_WEBM = VIDEO_DIR / f"{SLUG}-veo31.webm"
OUT_POSTER = IMG_DIR / f"{SLUG}-hero-poster.webp"

MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

# Loopable ambient parallax that animates each station within its drawn
# boundary. Matches the style of vindex-hero-bg-veo.webm and the rag-arena
# leonardo notebook video — each marginalia element animates inside its own
# sketch, no camera motion, no element bleeds across the page.
PROMPT = (
    "A Leonardo da Vinci notebook page on aged parchment, observed from "
    "directly above, holding the same composition throughout. NO zoom, NO "
    "pan, NO camera motion. Each of the four stations of the drawn assembly "
    "line animates within its own sketched boundary:\n"
    "(I) REGISTER — the wax seal on the bound codex shimmers with a soft "
    "golden glow that pulses gently; the five connecting threads labelled "
    "model / prompt / routing / dataset / previous animate as luminous fluid "
    "flowing inward toward the seal in a continuous loop.\n"
    "(II) GATE — the six identical scrolls on the balance scales sway very "
    "slightly; the scale-arm tips and rebalances; the scale that hangs "
    "lowest (below the dashed 'threshold 0.65' line) pulses with a faint "
    "rust-red glow.\n"
    "(III) ROLL — the press feeds paper through in a slow loop, the "
    "graduated 5% → 25% → 100% step indicator advances stepwise then "
    "returns; the small portrait-monitor sketch above the press blinks once "
    "every couple of seconds as if observing.\n"
    "(IV) OBSERVE — the clock-tower pendulum swings gently; the trip-hammer "
    "above the red 'rollback — 12 seconds' lever twitches periodically; the "
    "dashed rollback arrow curving back to station I shimmers softly with "
    "sepia ink that visibly redraws itself along the curve.\n"
    "Each animation stays inside its own drawn region. The page itself does "
    "not move. The marginal bar-chart sketch in the upper-left twitches its "
    "bars very subtly as if newly measured. The 'AUDIT · SIGNED · SHA-256' "
    "stamp at the bottom glows softly when station IV completes a tick. "
    "Atmospheric, scholarly, restrained, loopable. Static camera. No "
    "characters move. No zoom. No pan. Renaissance notebook aesthetic, the "
    "same visual family as the existing Calibrating-the-Judge and Deleting-"
    "Paris hero illustrations."
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
    if not HERO_PNG.exists():
        sys.exit(f"ERROR: hero PNG not found at {HERO_PNG}")
    image_b64 = base64.b64encode(HERO_PNG.read_bytes()).decode("ascii")
    url = f"{BASE}/models/{MODEL}:predictLongRunning?key={API_KEY}"
    body = {
        "instances": [{
            "prompt": PROMPT,
            "image": {"bytesBase64Encoded": image_b64, "mimeType": "image/png"},
        }],
        "parameters": {
            "aspectRatio": "16:9",
            "durationSeconds": 4,
            "sampleCount": 1,
            "personGeneration": "allow_adult",
        },
    }
    resp = http_post(url, body)
    op = resp.get("name")
    if not op:
        raise RuntimeError(f"No operation name: {json.dumps(resp)[:600]}")
    return op


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

    # Upload hints
    print("--- next: upload to R2 ---")
    bucket = "divinci-static-assets"
    pub = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev"
    print(f"  wrangler r2 object put {bucket}/{OUT_WEBM.name} \\")
    print(f"    --file={OUT_WEBM} --content-type=video/webm \\")
    print(f"    --cache-control='public, max-age=31536000' --remote")
    print()
    print(f"  wrangler r2 object put {bucket}/{OUT_POSTER.name} \\")
    print(f"    --file={OUT_POSTER} --content-type=image/webp \\")
    print(f"    --cache-control='public, max-age=31536000' --remote")
    print()
    print(f"After upload, your blog frontmatter wants:")
    print(f"  hero_video = \"{pub}/{OUT_WEBM.name}\"")
    print(f"  hero_video_poster = \"/images/{OUT_POSTER.name}\"")
    return 0


if __name__ == "__main__":
    sys.exit(main())
