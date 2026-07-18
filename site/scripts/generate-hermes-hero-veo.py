#!/usr/bin/env python3
"""
Image-to-video: animate the Hosted-Hermes da Vinci hero into a subtle, looping
hero-background clip via Google Veo 3.1, then save the MP4. A later ffmpeg step
converts it to WebM for R2 hosting.

Subtle motion only — this sits BEHIND a frosted-glass text panel, so we want
gentle life (drifting light rays, faint parchment shimmer, a slow breath of the
cloud) with NO camera move and NO redraw of the ink, so the illustration stays
legible and loop-friendly.

Reads GEMINI_API_KEY from env. Writes to
site/static/images/blog-hero-candidates/hosted-hermes-hero-veo.mp4
"""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set")

MODEL = os.environ.get("VEO_MODEL", "veo-3.1-fast-generate-preview")
SITE = Path(__file__).resolve().parent.parent
SRC = SITE / "static" / "images" / "hosted-hermes-on-cloudflare-hero.png"
OUT = SITE / "static" / "images" / "blog-hero-candidates" / "hosted-hermes-hero-veo.mp4"
OUT.parent.mkdir(parents=True, exist_ok=True)

PROMPT = (
    "Very subtle ambient motion on a Leonardo da Vinci sepia-ink parchment "
    "illustration. Keep every drawn line exactly as-is — do NOT redraw or morph "
    "the figures. Only add gentle life: faint golden light rays drifting slowly "
    "downward from the sketched cloud into the walled cells, a soft shimmer of "
    "gold-leaf on the wax seals and the small key, a barely-there parchment "
    "breathing, dust motes floating in the light. No camera movement, static "
    "framing, seamless loop, calm and scholarly."
)

def http_post(url, body, timeout=180):
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode())

def http_get(url, timeout=120):
    with urllib.request.urlopen(urllib.request.Request(url), timeout=timeout) as r:
        return json.loads(r.read().decode())

def main() -> int:
    img_b64 = base64.b64encode(SRC.read_bytes()).decode()
    print(f"Model: {MODEL}  source: {SRC.name} ({len(img_b64)} b64 chars)")

    start = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:predictLongRunning?key={API_KEY}"
    body = {
        "instances": [{"prompt": PROMPT, "image": {"bytesBase64Encoded": img_b64, "mimeType": "image/png"}}],
        "parameters": {"aspectRatio": "16:9", "sampleCount": 1},
    }
    try:
        op = http_post(start, body)
    except urllib.error.HTTPError as e:
        sys.exit(f"START FAILED HTTP {e.code}: {e.read().decode('utf-8','replace')[:800]}")
    op_name = op.get("name")
    if not op_name:
        sys.exit(f"No operation name: {json.dumps(op)[:600]}")
    print(f"Operation: {op_name}\nPolling (Veo takes 1-3 min)...")

    poll_url = f"https://generativelanguage.googleapis.com/v1beta/{op_name}?key={API_KEY}"
    for i in range(60):  # up to ~10 min at 10s
        time.sleep(10)
        st = http_get(poll_url)
        if st.get("done"):
            if "error" in st:
                sys.exit(f"Veo error: {json.dumps(st['error'])[:800]}")
            resp = st.get("response", {})
            # Veo returns generatedVideos with either inline bytes or a fileUri
            vids = (resp.get("generateVideoResponse", {}).get("generatedSamples")
                    or resp.get("generatedVideos") or resp.get("videos") or [])
            print(f"DONE. response keys: {list(resp.keys())}; samples: {len(vids)}")
            if not vids:
                (OUT.parent / "veo-raw-response.json").write_text(json.dumps(st, indent=2)[:20000])
                sys.exit("No video samples — raw response dumped to veo-raw-response.json")
            v = vids[0]
            video = v.get("video") or v
            b64 = video.get("bytesBase64Encoded")
            uri = video.get("uri") or video.get("fileUri")
            if b64:
                OUT.write_bytes(base64.b64decode(b64))
            elif uri:
                # signed URI — append key if it's a generativelanguage file endpoint
                fetch = uri if "key=" in uri else f"{uri}{'&' if '?' in uri else '?'}key={API_KEY}"
                with urllib.request.urlopen(urllib.request.Request(fetch), timeout=300) as r:
                    OUT.write_bytes(r.read())
            else:
                (OUT.parent / "veo-raw-response.json").write_text(json.dumps(st, indent=2)[:20000])
                sys.exit("Sample had no bytes/uri — raw dumped")
            print(f"✓ saved {OUT} ({OUT.stat().st_size/1024:.0f} KB)")
            return 0
        print(f"  [{i+1}] not done yet...")
    sys.exit("Timed out after ~10 min")

if __name__ == "__main__":
    sys.exit(main())
