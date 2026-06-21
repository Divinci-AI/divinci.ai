#!/usr/bin/env python3
"""End-to-end hero video pipeline for the LiteParse-vs-OpenParse PDF-parsing hero.
Animation is deliberately subtle — a da Vinci notebook page coming gently alive,
static camera, loopable. The fast in-process LiteParse press gets brisk motion;
the remote OpenParse steam-engine puffs slowly across the chasm; data shimmers
along the long pipe; the vector lattice twinkles faint gold."""
from __future__ import annotations
import base64, json, os, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
SLUG = "liteparse-vs-openparse-faster-pdf-parsing"

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
    "A subtle animation of a Leonardo da Vinci notebook page on aged parchment, "
    "sepia ink and gold accents, depicting a race between two PDF-parsing engines "
    "feeding a RAG pipeline. NO zoom, NO pan, NO camera motion — the drawn page "
    "stays exactly where it is, ink-on-parchment texture preserved throughout. "
    "Animation ONLY in these specific locations, each gentle and perfectly "
    "loopable:\n"
    "(1) The compact wooden-and-brass 'LITEPARSE' press on the desk at left: its "
    "large gear/crank wheel turns briskly and steadily, the press bar lowers and "
    "lifts in a quick calm loop, and a fanned stack of small index cards riffles "
    "outward from it each cycle — a few cards flutter down onto the desk.\n"
    "(2) The small hare bounding beside the LITEPARSE press gives one soft hop in "
    "place every second or so — a hint of speed, never leaving the page.\n"
    "(3) The stopwatch / balance scale in the upper-left: the second hand sweeps "
    "slowly and the balance pans settle gently toward the lighter '0.4 s' side; "
    "fine sand trickles steadily down the small hourglass below.\n"
    "(4) The large ornate brass 'OPENPARSE' steam-engine machine on the far side "
    "of the chasm at right: thin wisps of steam rise continuously from its "
    "smokestacks and dissipate, a pressure-gauge needle wavers slowly, and a "
    "faint warm glow flickers in its firebox — slow and labored, never hurried.\n"
    "(5) The long segmented pipe / aqueduct connecting the two sides ('remote "
    "service · over the wire'): a faint warm-gold shimmer pulse travels slowly "
    "ALONG the pipe from the OpenParse engine toward the vector lattice, then "
    "repeats — like data crossing a slow wire.\n"
    "(6) The glowing yellow-gold vector lattice grid on the right: its node "
    "points twinkle and pulse a faint gold, very gently, in a slow loop.\n"
    "(7) The robed scholar at the vector lattice slowly files a single index card "
    "into the grid, in a calm loop.\n"
    "(8) The tortoise beside the OpenParse engine stays perfectly still. The "
    "crossed-out scrambled-gibberish 'not text' index card stays perfectly "
    "still.\n"
    "The mood: a centuries-old engineering notebook quietly coming to life — one "
    "brisk little machine on the desk, one ponderous distant engine puffing "
    "across a chasm, data shimmering down the wire between them. Cinematic, "
    "painterly, scholarly, awe-inducing. Loopable. Static camera. Ink-and-"
    "parchment texture preserved throughout."
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
