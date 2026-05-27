#!/usr/bin/env python3
"""
Generate 4 mini stage-illustration loops for the 12-capabilities post.

Two-phase pipeline per stage:
  1. Nano Banana Pro produces a square 1:1 illustration of that stage
  2. Veo 3.1 image-to-video animates it as a 4-second loop
  3. ffmpeg → WebM, cwebp → WebP poster
  4. (uploaded to R2 separately by the caller)

Outputs:
  static/images/12-qa-stages/stage-N-<slug>-illustration.png
  static/blog-hero-videos/12-qa-stages/stage-N-<slug>-loop.webm
  static/images/12-qa-stages/stage-N-<slug>-loop-poster.webp
"""
from __future__ import annotations
import base64, json, os, shutil, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "static" / "images" / "12-qa-stages"
VIDEO_DIR = ROOT / "static" / "blog-hero-videos" / "12-qa-stages"
IMG_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

VEO_MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

# Base aesthetic shared across all four stages.
BASE_STYLE = (
    "Square 1:1 Leonardo da Vinci notebook detail on aged parchment, warm "
    "sepia ink with restrained rust-red and gold accents. Single ornate "
    "station drawn in the same visual family as the existing 'How to Build "
    "an LLM CI/CD Pipeline' hero illustrations. Atmospheric, scholarly, "
    "Renaissance, no AI gradient slop, no modern UI elements. The Roman "
    "numeral and station label appears as elegant centered text at the top. "
)

STAGES = [
    {
        "n": 1,
        "name": "register",
        "image_prompt": BASE_STYLE + (
            "Roman numeral 'I' centered at the top, with the word 'REGISTER' "
            "below it in elegant draftsman lettering. The illustration: a bound "
            "codex on a sloped writing desk; five luminous threads labelled "
            "'model', 'prompt', 'routing', 'dataset', 'preprocess' converge "
            "into a single glowing wax seal on the codex's cover. A small "
            "stamp-and-fork tool rests beside it. Sepia ink hatching, gold-leaf "
            "highlights on the seal."
        ),
        "video_prompt": (
            "A square 1:1 Leonardo da Vinci notebook detail on aged parchment, "
            "observed from directly above, holding the same composition "
            "throughout. NO zoom, NO pan, NO camera motion. Animation within "
            "the drawn boundary: the five luminous threads labelled "
            "model/prompt/routing/dataset/preprocess pulse with luminous "
            "fluid flowing inward toward the wax seal on the codex; the seal "
            "glows softly each time the cycle completes (every ~1.5 seconds). "
            "Restrained, scholarly, restrained, loopable. Static camera."
        ),
    },
    {
        "n": 2,
        "name": "gate",
        "image_prompt": BASE_STYLE + (
            "Roman numeral 'II' centered at the top with 'GATE' below it. The "
            "illustration: a tall ornate balance scale with six tiny weighing "
            "dishes arrayed along its arm (each holding a tiny labelled scroll). "
            "One dish hangs visibly lower than the others, dipping below a "
            "dashed horizontal red 'threshold' line drawn across the page. "
            "Behind the scale stands the robed silhouette of a calibrated judge "
            "holding a quill, watching. A small parchment marked 'override — "
            "rationale required' is bound by a wax seal in the foreground."
        ),
        "video_prompt": (
            "A square 1:1 Leonardo da Vinci notebook detail on aged parchment, "
            "observed from directly above, holding the same composition "
            "throughout. NO zoom, NO pan, NO camera motion. Animation within "
            "the drawn boundary: the six tiny weighing dishes on the balance "
            "arm sway gently with the rhythm of measurement; the lowest dish "
            "pulses with a faint rust-red glow as it falls below the dashed "
            "threshold line; the calibrated-judge silhouette in the background "
            "blinks thoughtfully once every couple of seconds. Restrained, "
            "scholarly, loopable. Static camera."
        ),
    },
    {
        "n": 3,
        "name": "roll",
        "image_prompt": BASE_STYLE + (
            "Roman numeral 'III' centered at the top with 'ROLL' below. The "
            "illustration: a Renaissance printer's press with a graduated paper "
            "feed marked '5%', '25%', and '100%' in sequence. Three small "
            "monitor portraits hover above the press, each watching one of "
            "the three traffic percentages. A rust-red 'STOP' halt-lever "
            "protrudes from the side of the press, ready to engage."
        ),
        "video_prompt": (
            "A square 1:1 Leonardo da Vinci notebook detail on aged parchment, "
            "observed from directly above, holding the same composition "
            "throughout. NO zoom, NO pan, NO camera motion. Animation within "
            "the drawn boundary: the printer's press feeds paper through in a "
            "slow loop; the graduated 5% → 25% → 100% step indicator advances "
            "stepwise then returns; the three monitor portraits above the "
            "press blink in sequence as each step is observed; the STOP "
            "lever twitches occasionally, ready. Restrained, scholarly, "
            "loopable. Static camera."
        ),
    },
    {
        "n": 4,
        "name": "observe",
        "image_prompt": BASE_STYLE + (
            "Roman numeral 'IV' centered at the top with 'OBSERVE' below. The "
            "illustration: a Renaissance clock-tower observer holding a "
            "magnifying glass watches a continuously-scrolling parchment of "
            "production traces unfurling down the page. A small trip-hammer "
            "lever marked 'rollback — 12s' sits poised next to a SHA-256 wax-"
            "sealed receipt hanging from a chain. The pendulum of the clock "
            "tower swings visibly."
        ),
        "video_prompt": (
            "A square 1:1 Leonardo da Vinci notebook detail on aged parchment, "
            "observed from directly above, holding the same composition "
            "throughout. NO zoom, NO pan, NO camera motion. Animation within "
            "the drawn boundary: the clock-tower pendulum swings gently in "
            "rhythm; the observer's magnifying glass follows the scrolling "
            "production-trace parchment downward in a slow continuous loop; "
            "the SHA-256 receipt hanging from its chain shimmers softly; the "
            "rollback-12s trip-hammer pulses ready but does not fire. "
            "Restrained, scholarly, loopable. Static camera."
        ),
    },
]


def http_post(url, body, timeout=180):
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


def pad_to_16_9(src_png: Path, dst_png: Path):
    """Pad a square illustration to 16:9 with parchment-colored bars on
    left/right via ffmpeg. Veo 3.1 image-to-video only accepts 16:9 or 9:16.
    Parchment color #faf8f5 matches the site's blog-post background so the
    bars blend into the page chrome when the video loops."""
    cmd = [
        "ffmpeg", "-y", "-i", str(src_png),
        "-vf", "scale=iw*9/16:ih,pad=ih*16/9:ih:(ow-iw)/2:0:color=#faf8f5",
        "-frames:v", "1", str(dst_png),
    ]
    # Simpler approach: scale image to fit inside 16:9, padding L+R with parchment.
    cmd = [
        "ffmpeg", "-y", "-i", str(src_png),
        "-vf", "pad=ih*16/9:ih:(ow-iw)/2:0:color=#faf8f5",
        "-frames:v", "1", str(dst_png),
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def gen_nano_square(prompt, slug, out_dir):
    """Nano Banana Pro at 1:1, falling back to Imagen 4 Ultra on 429.
    Nano has a tight preview-model daily quota (~250/day shared across calls);
    Imagen 4 has a separate bucket and degrades gracefully on symbolic content."""
    out = out_dir / f"stage-{slug}-illustration.png"
    nano_url = f"{BASE}/models/gemini-3-pro-image-preview:generateContent?key={API_KEY}"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"],
                                 "imageConfig": {"aspectRatio": "1:1"}}}
    try:
        resp = http_post(nano_url, body)
        parts = (resp.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
        image_part = next((p for p in parts if "inlineData" in p), None)
        if not image_part:
            raise RuntimeError(f"No image: {json.dumps(resp)[:400]}")
        out.write_bytes(base64.b64decode(image_part["inlineData"]["data"]))
        return out
    except RuntimeError as e:
        if "429" not in str(e):
            raise
        print(f"  …Nano quota hit, falling back to Imagen 4 Ultra for {slug}")
        imagen_url = f"{BASE}/models/imagen-4.0-ultra-generate-001:predict?key={API_KEY}"
        ibody = {"instances": [{"prompt": prompt}],
                 "parameters": {"sampleCount": 1, "aspectRatio": "1:1",
                                "personGeneration": "allow_adult"}}
        resp = http_post(imagen_url, ibody)
        preds = resp.get("predictions", [])
        if not preds or not preds[0].get("bytesBase64Encoded"):
            raise RuntimeError(f"Imagen failed too: {json.dumps(resp)[:400]}")
        out.write_bytes(base64.b64decode(preds[0]["bytesBase64Encoded"]))
        return out


def submit_veo(prompt, image_path):
    # Veo 3.1 image-to-video only accepts 16:9 or 9:16 aspect ratios. The
    # Nano Banana illustrations were generated 1:1, so we pad them to 16:9
    # with parchment-colored bars before submitting.
    padded_path = image_path.with_name(image_path.stem + "-16x9.png")
    if not padded_path.exists():
        pad_to_16_9(image_path, padded_path)
    image_b64 = base64.b64encode(padded_path.read_bytes()).decode("ascii")
    url = f"{BASE}/models/{VEO_MODEL}:predictLongRunning?key={API_KEY}"
    body = {"instances": [{"prompt": prompt,
                            "image": {"bytesBase64Encoded": image_b64, "mimeType": "image/png"}}],
            "parameters": {"aspectRatio": "16:9", "durationSeconds": 4,
                           "sampleCount": 1, "personGeneration": "allow_adult"}}
    return http_post(url, body)["name"]


def poll_veo(op_name, slug, timeout_s=600):
    url = f"{BASE}/{op_name}?key={API_KEY}"
    deadline = time.time() + timeout_s
    polls = 0
    while time.time() < deadline:
        polls += 1
        op = http_get(url)
        if op.get("done"):
            if "error" in op:
                raise RuntimeError(f"Op failed: {json.dumps(op['error'])[:400]}")
            print(f"    [{slug}] done after {polls} polls")
            return op.get("response", {})
        if polls % 3 == 1:
            print(f"    [{slug}] polling… {polls}× (~{polls*10}s)")
        time.sleep(10)
    raise TimeoutError(f"Veo {slug} did not complete")


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
                    "-c:v", "libvpx-vp9", "-b:v", "900k", "-crf", "34",
                    "-deadline", "good", "-cpu-used", "2",
                    "-an", "-pix_fmt", "yuv420p", str(dst)],
                   check=True, capture_output=True)


def make_poster(src, dst):
    subprocess.run(["cwebp", "-q", "80", "-mt", str(src), "-o", str(dst)],
                   check=True, capture_output=True)


def main():
    print(f"=== Generating {len(STAGES)} stage illustrations ===\n")

    # Phase 1: Nano Banana illustrations. Throttle: 60s between calls so we
    # don't trip the preview-model per-minute rate limit. Resume-safe — skip
    # any stage whose illustration PNG already exists on disk.
    print("[Phase 1/3] Nano Banana Pro illustrations (60s between calls)")
    for i, stage in enumerate(STAGES):
        slug = f"{stage['n']}-{stage['name']}"
        existing = IMG_DIR / f"stage-{slug}-illustration.png"
        if existing.exists():
            print(f"  ✓ {existing.name} (already on disk, {existing.stat().st_size/1024:.0f} KB)")
            stage["illustration_path"] = existing
            continue
        if i > 0:
            print(f"  …throttle sleep 60s")
            time.sleep(60)
        t0 = time.time()
        attempt = 0
        while True:
            attempt += 1
            try:
                out = gen_nano_square(stage["image_prompt"], slug, IMG_DIR)
                break
            except RuntimeError as e:
                if "429" in str(e) and attempt < 4:
                    backoff = 90 * attempt
                    print(f"  …429, backoff {backoff}s (attempt {attempt})")
                    time.sleep(backoff)
                    continue
                raise
        print(f"  ✓ {out.name} ({out.stat().st_size/1024:.0f} KB, {time.time()-t0:.1f}s)")
        stage["illustration_path"] = out

    # Phase 2: Veo submit-all-then-poll
    print("\n[Phase 2/3] Veo 3.1 image-to-video — submit all in parallel")
    for stage in STAGES:
        slug = f"{stage['n']}-{stage['name']}"
        op = submit_veo(stage["video_prompt"], stage["illustration_path"])
        print(f"  → {slug}: {op}")
        stage["op"] = op
    print("  …polling each")
    for stage in STAGES:
        slug = f"{stage['n']}-{stage['name']}"
        resp = poll_veo(stage["op"], slug, timeout_s=600)
        mp4_out = VIDEO_DIR / f"stage-{slug}-loop.mp4"
        size = save_mp4(resp, mp4_out)
        print(f"  ✓ {mp4_out.name} ({size/1024:.0f} KB)")
        stage["mp4_path"] = mp4_out

    # Phase 3: encode WebM + WebP
    print("\n[Phase 3/3] Encode WebM + WebP poster")
    for stage in STAGES:
        slug = f"{stage['n']}-{stage['name']}"
        webm_out = VIDEO_DIR / f"stage-{slug}-loop.webm"
        webp_out = IMG_DIR / f"stage-{slug}-loop-poster.webp"
        to_webm(stage["mp4_path"], webm_out)
        make_poster(stage["illustration_path"], webp_out)
        print(f"  ✓ {webm_out.name} ({webm_out.stat().st_size/1024:.0f} KB) + "
              f"{webp_out.name} ({webp_out.stat().st_size/1024:.0f} KB)")
        stage["webm_path"] = webm_out
        stage["webp_path"] = webp_out

    print("\n=== Done. Files for R2 upload: ===")
    for stage in STAGES:
        slug = f"{stage['n']}-{stage['name']}"
        print(f"  static/blog-hero-videos/12-qa-stages/stage-{slug}-loop.webm")
        print(f"  static/images/12-qa-stages/stage-{slug}-loop-poster.webp")
    return 0


if __name__ == "__main__":
    sys.exit(main())
