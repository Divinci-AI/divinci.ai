#!/usr/bin/env python3
"""
Generate a Veo 3.1 hero video for the /www-rag/ directory page,
then convert it to WebM and refresh the WebP poster.
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

SLUG = "www-rag-directory"
HERO_SRC = HEROES_DIR / "www-rag-directory-hero.png"   # actually JFIF/JPEG bytes
OUT_MP4 = VIDEOS_DIR / f"{SLUG}-veo31.mp4"
OUT_WEBM = VIDEOS_DIR / f"{SLUG}-veo31.webm"
OUT_POSTER = HEROES_DIR / f"{SLUG}-hero-poster.webp"

MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

PROMPT = (
    "A subtle animation of a deep navy-blue night-sky illustration with fine gold line-art icons "
    "(an open book, a domed observatory telescope, a classical column, a rocket, a market stall, "
    "a stack of books, a rolled scroll) and a filigree golden clockwork spider in the upper right "
    "corner sitting on a delicate gold web. "
    "NO zoom, NO pan, NO camera motion. The framing stays perfectly locked and the lower-centre of "
    "the frame stays dark and empty for text overlay. "
    "Animation ONLY in these places, each gentle and loopable:\n"
    "(1) The golden clockwork spider slowly spins new gossamer silk: fine luminous gold filaments "
    "draw themselves outward from its web across the frame and reach toward each line-art icon, "
    "connecting them one by one, then fade softly so the loop restarts seamlessly. The spider's "
    "legs and brass gears turn almost imperceptibly; it does not walk or change position.\n"
    "(2) As each filament reaches an icon, that icon's gold outline brightens briefly in a warm "
    "glow, then settles back. The icons never move, rotate, or change shape.\n"
    "(3) The constellations twinkle: individual stars pulse at different rhythms, and the thin "
    "constellation lines gently extend and retract, as if the star maps are quietly expanding.\n"
    "(4) Tiny luminous pulses travel along the existing long catenary gold thread that swags across "
    "the middle of the frame, moving toward the spider.\n"
    "(5) The faint blue nebula mist in the background drifts extremely slowly.\n"
    "Mood: quiet cosmic cartography, the web being indexed thread by thread. "
    "Deep navy and gold palette preserved. Fine ink-line illustration texture preserved. "
    "Static camera. Seamlessly loopable."
)


def _mime_for(path: Path) -> str:
    head = path.read_bytes()[:12]
    if head[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if head[:2] == b"\xff\xd8":
        return "image/jpeg"
    if head[:4] == b"RIFF" and head[8:12] == b"WEBP":
        return "image/webp"
    raise RuntimeError(f"Unrecognised image type for {path}")


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
    image_b64 = base64.b64encode(HERO_SRC.read_bytes()).decode("ascii")
    url = f"{BASE}/models/{MODEL}:predictLongRunning?key={API_KEY}"
    body = {
        "instances": [{
            "prompt": PROMPT,
            "image": {
                "bytesBase64Encoded": image_b64,
                "mimeType": _mime_for(HERO_SRC),
            },
        }],
        "parameters": {
            "aspectRatio": "16:9",
            "durationSeconds": 8,
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
    """VP9 webm, silent. Matches the existing hero-video encoding."""
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


def make_poster(src_mp4: Path, dst_webp: Path) -> None:
    """First frame of the generated video → quality-82 WebP poster, so the
    poster and the video's opening frame match exactly."""
    if not shutil.which("cwebp"):
        sys.exit("ERROR: cwebp not found in PATH")
    tmp_png = dst_webp.with_suffix(".frame.png")
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(src_mp4), "-frames:v", "1", str(tmp_png)],
        check=True, capture_output=True,
    )
    print(f"  cwebp → {dst_webp.name}")
    subprocess.run(
        ["cwebp", "-q", "82", "-mt", str(tmp_png), "-o", str(dst_webp)],
        check=True, capture_output=True,
    )
    tmp_png.unlink(missing_ok=True)


def main() -> int:
    print(f"Hero source: {HERO_SRC} ({_mime_for(HERO_SRC)})")
    print(f"Veo model: {MODEL}")
    print()

    print("[1/4] Submit Veo image-to-video job…")
    op = submit_veo()
    print(f"  op: {op}")
    print()

    print("[2/4] Poll until complete…")
    resp = poll(op, timeout_s=600)
    mp4_bytes = save_mp4(resp, OUT_MP4)
    print(f"  ✓ {OUT_MP4.name} ({mp4_bytes/1024:.0f} KB)")
    print()

    print("[3/4] Convert MP4 → WebM…")
    to_webm(OUT_MP4, OUT_WEBM)
    print(f"  ✓ {OUT_WEBM.name} ({OUT_WEBM.stat().st_size/1024:.0f} KB)")
    print()

    print("[4/4] Make WebP poster from first frame…")
    make_poster(OUT_MP4, OUT_POSTER)
    print(f"  ✓ {OUT_POSTER.name} ({OUT_POSTER.stat().st_size/1024:.0f} KB)")
    print()

    print("Success!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
