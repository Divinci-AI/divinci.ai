#!/usr/bin/env python3
"""Generate the idle-motion loop for the hero's writing arm, on green screen.

The arm must NOT travel in this clip -- the page translates it along the
handwriting path. All Veo is asked for is the small involuntary life a real hand
has while drawing, so that what we move around the screen is a living arm rather
than a sliding sticker. Hence the very heavy "locked camera / no translation"
language in the prompt: any drift Veo adds becomes drift the tip-tracker has to
undo later.

Output: green-screen mp4. Keying and encoding happen in arm_video_alpha.py.
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

MODEL = "veo-3.1-generate-preview"
# The clip is generated for either tool; ARM_TOOL swaps the noun throughout the
# prompt so the pencil and paintbrush variants stay otherwise identical.
TOOL = os.environ.get("ARM_TOOL", "pencil")
TOOL_DESC = {
    "pencil": "a slim dark-maroon pencil with a sharpened graphite point",
    "brush": "a fine sable paintbrush with a slim dark-maroon handle, a silver "
             "ferrule and a soft tapered dark sable tip",
}[TOOL]
BASE = "https://generativelanguage.googleapis.com/v1beta"

SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("arm-plate-v2.png")
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("arm-green.mp4")

PROMPT = (
    "A Renaissance fresco LINE-ART DRAWING of a human hand gripping " + TOOL_DESC + ", attached to an ivory plated articulated mechanical forearm drawn in fine "
    "blue and sanguine ink, running off the bottom-right corner of frame, against a flat "
    "chroma-key green background.\n"
    "\n"
    "STYLE LOCK: this must remain a FLAT INK DRAWING in every frame. Fine dark-blue and "
    "sanguine-brown contour lines, flat unshaded ivory and pale-blue fills, dense "
    "delicate cross-hatching on the hand. NOT a photograph, NOT a 3D render. No specular "
    "highlights, no photographic lighting, no depth of field. Line weight, hatching "
    "density and palette identical in every frame.\n"
    "\n"
    "THE SHOT: the hand is resting against an unseen page just below and to its left, "
    "making short careful strokes. It is settled and working, NOT gesturing in mid-air.\n"
    "\n"
    "ORIENTATION LOCK — as important as the style lock:\n"
    "* The %TOOL%'s angle on screen stays within about TEN DEGREES of its starting "
    "angle for the whole clip. It NEVER twirls, spins, rotates, or points in a new "
    "direction. Its tip stays in the upper-left area of frame at all times.\n"
    "* The hand NEVER rolls over, turns, or shows its palm. The back of the hand faces "
    "the viewer in every frame, at the same angle it starts at.\n"
    "* The grip does not change. The fingers do not re-position along the %TOOL%, do not "
    "let go, and do not re-catch it.\n"
    "* The heel of the hand and the metal wrist cuff stay where they are.\n"
    "\n"
    "WITHIN those locks, the joints must be clearly, visibly working — this is the point "
    "of the shot:\n"
    "(1) The finger joints flex and extend by a few degrees, continuously, as the fingers "
    "press and ease on the %TOOL% to drive each small stroke.\n"
    "(2) Knuckles fold and rise; the tendons on the back of the hand lift and settle with "
    "each press.\n"
    "(3) The wrist NODS gently up and down at the cuff — flexion and extension only, NO "
    "roll and NO side-to-side sweep — as if guiding short strokes.\n"
    "(4) Inside the mechanical forearm, the drawn gears, cables and pistons keep turning, "
    "driving that nodding wrist.\n"
    "\n"
    "CAMERA LOCKED. No zoom, no pan, no shake. The limb as a whole does not travel across "
    "frame; the elbow end never leaves the bottom-right corner. Articulation of joints "
    "only, never translation or rotation of the whole hand.\n"
    "\n"
    "CRITICAL: the background stays one perfectly flat, uniform, unchanging chroma-key "
    "green. No gradients, no shadows on the green, no green spill on the arm, no paper, "
    "no texture, no drawn marks, no text, no added objects.\n"
    "\n"
    "Flat 2D ink illustration. Static camera. Seamlessly loopable."
).replace("%TOOL%", TOOL)


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
        url, data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP {e.code}: {e.read().decode(errors='replace')}") from e


def http_get(url: str, timeout: int = 60) -> dict:
    with urllib.request.urlopen(urllib.request.Request(url), timeout=timeout) as r:
        return json.loads(r.read().decode())


def main() -> None:
    b64 = base64.b64encode(SRC.read_bytes()).decode("ascii")
    op = http_post(f"{BASE}/models/{MODEL}:predictLongRunning?key={API_KEY}", {
        "instances": [{"prompt": PROMPT,
                       "image": {"bytesBase64Encoded": b64, "mimeType": _mime_for(SRC)}}],
        "parameters": {"aspectRatio": "16:9", "durationSeconds": 8,
                       "sampleCount": 1, "personGeneration": "allow_adult",
                       "resolution": "1080p"},
    })
    name = op.get("name")
    if not name:
        sys.exit(f"No operation name: {json.dumps(op)[:600]}")
    print(f"submitted: {name}", flush=True)

    deadline, polls = time.time() + 900, 0
    while time.time() < deadline:
        polls += 1
        o = http_get(f"{BASE}/{name}?key={API_KEY}")
        if o.get("done"):
            if "error" in o:
                sys.exit(f"Op failed: {json.dumps(o['error'])[:600]}")
            resp = o.get("response", {})
            break
        print(f"  polling… {polls}x (~{polls*10}s)", flush=True)
        time.sleep(10)
    else:
        sys.exit("timed out")

    preds = resp.get("predictions") or []
    uri = None
    if preds:
        p = preds[0]
        if "bytesBase64Encoded" in p:
            OUT.write_bytes(base64.b64decode(p["bytesBase64Encoded"]))
            print(f"wrote {OUT} ({OUT.stat().st_size} bytes)"); return
        uri = (p.get("video") or {}).get("uri") or p.get("videoUri")
    if not uri:
        s = resp.get("generateVideoResponse", {}).get("generatedSamples", [])
        uri = s[0].get("video", {}).get("uri") if s else None
    if not uri:
        sys.exit(f"No video in response: {json.dumps(resp)[:600]}")
    if "key=" not in uri:
        uri += ("&" if "?" in uri else "?") + f"key={API_KEY}"
    with urllib.request.urlopen(urllib.request.Request(uri), timeout=300) as r:
        OUT.write_bytes(r.read())
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
