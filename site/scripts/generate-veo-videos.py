#!/usr/bin/env python3
"""
Image-to-video via Veo 3.1 (models/veo-3.1-generate-preview).

Reads GEMINI_API_KEY from env. Feeds each chosen hero PNG plus an ambient
parallax motion prompt. Polls the long-running operation until done. Saves
the resulting MP4(s) to site/static/blog-hero-videos/<slug>-veo31.mp4.
"""

from __future__ import annotations

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
HEROES_DIR = ROOT / "static" / "images"
OUT_DIR = ROOT / "static" / "blog-hero-videos"
OUT_DIR.mkdir(parents=True, exist_ok=True)

MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

# 4-second, silent, 16:9, ambient parallax. Motion prompts deliberately avoid
# character movement — the existing site's hero videos are slow drifting loops,
# not action shots.
JOBS = [
    {
        "slug": "gemma4-dflash",
        "image": HEROES_DIR / "gemma4-dflash-hero.png",
        "out_suffix": "-veo31-v2",
        "prompt": (
            "An aged sepia engineering blueprint observed from directly above. "
            "Visible electrical current — luminous gold pulses — travel ALONG THE "
            "ACTUAL DRAWN LINES of the diagram, following its engineering geometry "
            "exactly: pulses originate inside the smaller drafter engine on the "
            "left, flow upward through its bidirectional attention chambers, "
            "converge into the bundle of sixteen luminous threads labeled K=16 "
            "BLOCK, traverse the central gap from drafter to target, fan out "
            "through the ribbed KV-cache pipelines on the right side of the "
            "target engine, ripple around the visible gears of the larger target, "
            "then loop back through the lower pipelines to the drafter to repeat. "
            "The current strictly follows the drawn schematic lines like glowing "
            "fluid in transparent tubing. NO jagged lightning across empty "
            "page. NO random electrical bolts. NO arcs through air. The current "
            "is contained inside the drawn engineering geometry at all times. "
            "Soft candlelight warmth pulses gently across the parchment. The "
            "gears tick almost imperceptibly. Static camera, no zoom, no pan, "
            "no rotation. No characters move. Atmospheric, scholarly, restrained, "
            "loopable — like an animated antique circuit diagram showing current "
            "flowing along its actual paths."
        ),
    },
    {
        "slug": "rag-arena-leonardo",
        "image": HEROES_DIR / "rag-arena-scored-qa-routing-hero.png",
        "out_suffix": "-veo31-v2",
        "prompt": (
            "A Leonardo da Vinci notebook page on aged parchment where each "
            "individual line drawing comes to life independently — like an "
            "enchanted notebook where every sketch is alive. NO zoom, NO pan, "
            "NO camera motion. The page is observed from directly above and "
            "stays exactly the same composition throughout. Each marginalia "
            "element animates within its own drawn boundary on the page: "
            "(a) the three robed scholars at the central marble bench gently "
            "shift their grip on their bronze scales; the three scales tip and "
            "settle at slightly different angles, then re-balance, in a slow "
            "continuous loop; (b) the coliseum sketch in the upper-left area "
            "rotates very slowly through a few degrees of perspective; (c) the "
            "pipework / routing diagram beside it animates with luminous fluid "
            "traveling through its pipes, branching and reconverging; (d) the "
            "mathematical correlation curves in the upper-right area slowly "
            "draw themselves in real-time, sepia ink line extending across the "
            "graph paper; (e) the fountain on the lower-left trickles water in "
            "a continuous loop, water ripples in the basin; (f) the kite / "
            "geometric study on the right rotates subtly through perspective; "
            "(g) the ρ = 0,552 notation at the bottom shimmers with a soft "
            "golden glow that pulses gently. Each animation is contained "
            "within its own existing sketch — no element bleeds out of its "
            "drawn boundary. The page itself does not move or zoom. "
            "Atmospheric, scholarly, restrained, Renaissance notebook "
            "aesthetic, loopable."
        ),
    },
]


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


def submit_veo(prompt: str, image_path: Path) -> str:
    """Submit a Veo 3.1 image-to-video job. Returns the operation name."""
    image_b64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
    url = f"{BASE}/models/{MODEL}:predictLongRunning?key={API_KEY}"
    body = {
        "instances": [{
            "prompt": prompt,
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


def poll_operation(op_name: str, slug: str, timeout_s: int = 600) -> dict:
    """Poll the operation until done. Returns the final response dict."""
    url = f"{BASE}/{op_name}?key={API_KEY}"
    deadline = time.time() + timeout_s
    poll_count = 0
    while time.time() < deadline:
        poll_count += 1
        op = http_get(url)
        if op.get("done"):
            print(f"  [{slug}] done after {poll_count} polls")
            if "error" in op:
                raise RuntimeError(f"Operation failed: {json.dumps(op['error'])[:600]}")
            return op.get("response", {})
        elapsed = poll_count * 10
        print(f"  [{slug}] polling… {poll_count}× (~{elapsed}s elapsed)")
        time.sleep(10)
    raise TimeoutError(f"Veo operation {op_name} did not complete within {timeout_s}s")


def fetch_video(response: dict, out_path: Path) -> int:
    """Pull the MP4 out of the response. Veo may return either a base64 blob
    or a signed URI we have to download. Try both shapes."""
    preds = response.get("predictions") or []
    if not preds:
        # Alternative shape: response.generateVideoResponse.generatedSamples[].video.uri
        samples = (response.get("generateVideoResponse", {})
                           .get("generatedSamples", []))
        if samples:
            uri = samples[0].get("video", {}).get("uri")
            if uri:
                if "?key=" not in uri and "key=" not in uri:
                    uri = f"{uri}{'&' if '?' in uri else '?'}key={API_KEY}"
                data = http_get_bytes(uri)
                out_path.write_bytes(data)
                return len(data)
        raise RuntimeError(f"No predictions or samples in response: {json.dumps(response)[:600]}")

    pred = preds[0]
    if "bytesBase64Encoded" in pred:
        data = base64.b64decode(pred["bytesBase64Encoded"])
        out_path.write_bytes(data)
        return len(data)
    video = pred.get("video") or {}
    uri = video.get("uri") or pred.get("videoUri")
    if uri:
        if "key=" not in uri:
            uri = f"{uri}{'&' if '?' in uri else '?'}key={API_KEY}"
        data = http_get_bytes(uri)
        out_path.write_bytes(data)
        return len(data)
    raise RuntimeError(f"No video bytes or uri in prediction: {json.dumps(pred)[:600]}")


def main() -> int:
    print(f"Output dir: {OUT_DIR}")
    print(f"Model: {MODEL}")
    print(f"Jobs: {len(JOBS)}")
    print()

    # Submit all jobs first (so they run in parallel server-side)
    operations: list[tuple[str, str]] = []
    for job in JOBS:
        print(f"Submitting {job['slug']} ({job['image'].name})...")
        op_name = submit_veo(job["prompt"], job["image"])
        print(f"  op: {op_name}")
        operations.append((job["slug"], op_name))
    print()
    print("All submitted. Polling each in turn...")
    print()

    # Now poll each
    failures: list[str] = []
    successes: list[Path] = []
    for slug, op_name in operations:
        print(f"=== {slug} ===")
        try:
            resp = poll_operation(op_name, slug, timeout_s=600)
            suffix = next((j["out_suffix"] for j in JOBS if j["slug"] == slug), "-veo31")
            out_path = OUT_DIR / f"{slug}{suffix}.mp4"
            size = fetch_video(resp, out_path)
            print(f"  ✓ saved {out_path.name} ({size/1024:.0f} KB)")
            successes.append(out_path)
        except Exception as e:
            print(f"  ✗ {slug} FAILED: {e}")
            failures.append(slug)
        print()

    print(f"--- SUMMARY ---")
    print(f"  ok:     {len(successes)}/{len(JOBS)}")
    print(f"  failed: {len(failures)}")
    for p in successes:
        print(f"  → {p}")
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
