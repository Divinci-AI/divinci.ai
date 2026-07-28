#!/usr/bin/env python3
"""
Image-to-video: animate the Voice Agents brass-phone hero into a subtle looping
clip via Google Veo 3.1, then save the MP4. A later ffmpeg step converts it to
WebM for R2 hosting:

  ffmpeg -y -i voice-agents-hero-veo.mp4 -an -c:v libvpx-vp9 -b:v 1500k -crf 32 \\
    voice-agents-hero.webm

  wrangler r2 object put divinci-static-assets/voice-agents-hero.webm \\
    --file=.../voice-agents-hero.webm --content-type=video/webm --remote

Reads GEMINI_API_KEY from env. Writes to
site/static/images/blog-hero-candidates/voice-agents-hero-veo.mp4
"""
from __future__ import annotations
import base64, json, os, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set")

MODEL = os.environ.get("VEO_MODEL", "veo-3.1-fast-generate-preview")
SITE = Path(__file__).resolve().parent.parent
SRC = SITE / "static" / "images" / "voice-agents-social.png"
OUT = SITE / "static" / "images" / "blog-hero-candidates" / "voice-agents-hero-veo.mp4"
OUT.parent.mkdir(parents=True, exist_ok=True)

PROMPT = (
    "Subtle cinematic motion on a still life of a brass vintage telephone "
    "handset with a glowing neural-network aura. Keep the phone, cord, and "
    "composition exactly as drawn — do NOT redraw or morph the handset. Only "
    "add gentle life: soft pulsing glow in the neural filaments, faint "
    "warm light drifting across the brass, a barely-there breath of "
    "atmosphere and dust motes. No camera movement, static framing, "
    "seamless loop, elegant and calm."
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
    for i in range(60):
        time.sleep(10)
        st = http_get(poll_url)
        if st.get("done"):
            if "error" in st:
                sys.exit(f"Veo error: {json.dumps(st['error'])[:800]}")
            resp = st.get("response", {})
            vids = (resp.get("generateVideoResponse", {}).get("generatedSamples")
                    or resp.get("generatedVideos") or resp.get("videos") or [])
            print(f"DONE. response keys: {list(resp.keys())}; samples: {len(vids)}")
            if not vids:
                (OUT.parent / "voice-agents-veo-raw.json").write_text(json.dumps(st, indent=2)[:20000])
                sys.exit("No video samples — raw response dumped")
            v = vids[0]
            video = v.get("video") or v
            b64 = video.get("bytesBase64Encoded")
            uri = video.get("uri") or video.get("fileUri")
            if b64:
                OUT.write_bytes(base64.b64decode(b64))
            elif uri:
                fetch = uri if "key=" in uri else f"{uri}{'&' if '?' in uri else '?'}key={API_KEY}"
                with urllib.request.urlopen(urllib.request.Request(fetch), timeout=300) as r:
                    OUT.write_bytes(r.read())
            else:
                (OUT.parent / "voice-agents-veo-raw.json").write_text(json.dumps(st, indent=2)[:20000])
                sys.exit("Sample had no bytes/uri — raw dumped")
            print(f"✓ saved {OUT} ({OUT.stat().st_size/1024:.0f} KB)")
            return 0
        print(f"  [{i+1}] not done yet...")
    sys.exit("Timed out after ~10 min")

if __name__ == "__main__":
    sys.exit(main())
