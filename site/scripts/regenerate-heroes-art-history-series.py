#!/usr/bin/env python3
"""
Re-hero posts #1–#4 with the art-history-reimagined series concept.
Each post gets a fresh Nano Banana / Imagen-fallback PNG, then Veo 3.1 image-
to-video, ffmpeg WebM, cwebp poster. Outputs OVERWRITE the existing hero
file paths in the repo so frontmatter pointers stay valid.

Resume-safe — skips any post whose webm + webp + png are all newer than
this script. To force-regenerate a single post, delete its hero png first.
"""
from __future__ import annotations
import base64, json, os, shutil, subprocess, sys, time, urllib.error, urllib.request
from pathlib import Path

API_KEY = os.environ.get("GEMINI_API_KEY", "").strip()
if not API_KEY:
    sys.exit("ERROR: GEMINI_API_KEY not set.")

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "static" / "images"
VIDEO_DIR = ROOT / "static" / "blog-hero-videos"
IMG_DIR.mkdir(parents=True, exist_ok=True)
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

VEO_MODEL = "veo-3.1-generate-preview"
BASE = "https://generativelanguage.googleapis.com/v1beta"

# Each post: slug, the "edgy classy juxtaposition" Nano/Imagen prompt, and a
# minimal Veo animation prompt that respects the artwork's stillness.
JOBS = [
    {
        "slug": "how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai",
        "label": "Apollo Mission Control · CI/CD architecture",
        "image_prompt": (
            "A cinematic Apollo-era NASA mission control room photographed "
            "in warm Kodachrome film stock, late 1960s, exactly the visual "
            "language of the iconic Apollo 11 mission control photographs. "
            "Rows of empty grey-steel control consoles with their mission "
            "patches and rotary phones, recessed CRT screens glowing soft "
            "amber and green, large hanging incandescent fixtures, beige "
            "ceiling tiles, an enormous glass projection wall at the back. "
            "The room is empty of people — the mission has gone right and "
            "the operators have gone home. Mission timer above the door "
            "reads exactly T+02:14:23. On the giant glass projection wall, "
            "where Apollo telemetry would show, there is instead a slow "
            "vertical cascade of glowing parchment-gold release-receipt "
            "cards — each card a small rectangle with a hash-string and a "
            "tiny wax seal — falling silently from top to bottom of the "
            "wall in a continuous chain. Above the projection wall, an "
            "elegant mission-style banner reads 'DIVINCI · RELEASE 1' in "
            "the typography of the era. Soft floodlight pools on a single "
            "console at the front-center where a slim modern laptop sits "
            "incongruously next to a vintage rotary phone — the only "
            "anachronistic detail. Cinematic, painterly Kodachrome warmth, "
            "atmospheric, awe-inducing, the gravity of a triumphant manned "
            "mission. Classy, hopeful, iconic. NO modern UI overlays. NO "
            "sci-fi gloss. NO AI gradient slop. 16:9 aspect ratio."
        ),
        "video_prompt": (
            "A subtle animation of a 1960s NASA Apollo mission control "
            "room, late at night after the mission has gone right. NO "
            "zoom, NO pan, NO camera motion. The room is empty of people; "
            "they remain absent. Animation ONLY in these places, each "
            "gentle and loopable:\n"
            "(1) The vertical cascade of glowing parchment-gold receipt "
            "cards on the giant glass projection wall continues falling "
            "silently from top to bottom in a slow continuous chain, like "
            "a paper waterfall.\n"
            "(2) The amber and green CRT screens on the empty consoles "
            "softly flicker the way 1960s phosphor displays do — barely.\n"
            "(3) The mission timer T+02:14:23 does NOT advance. Frozen at "
            "that exact moment.\n"
            "(4) The cursor on the single anachronistic laptop screen at "
            "the front-center console blinks once every couple of seconds.\n"
            "Mood: quiet triumph, midnight stillness, the system delivered. "
            "Cinematic Kodachrome warmth preserved throughout. Static "
            "camera. Loopable."
        ),
    },
    {
        "slug": "10-ci-cd-release-failures-in-custom-language-models",
        "label": "Sherlock Holmes detective study · postmortem investigation",
        "image_prompt": (
            "A lit-by-firelight Victorian detective's study, painted in "
            "the visual language of a Sidney Paget Sherlock Holmes "
            "illustration crossed with a Vermeer-Dutch interior. Warm wood "
            "paneling, leather-bound book spines on dark shelves, a brass "
            "magnifying glass resting on a heavy mahogany desk lit by a "
            "single green-shaded banker's lamp. Spread across the desk: "
            "ten numbered evidence cards (1 through X in Roman numerals), "
            "each card a small parchment slip pinned down with a different "
            "object — a snapped quill (for unversioned prompts), a "
            "mis-weighted balance scale (for slice-aware regressions), a "
            "shattered glass beaker (for training-serving skew), a small "
            "broken pocket watch (for canary dwell), and so on. A "
            "deerstalker cap rests on the corner of the desk. On the wall "
            "above the desk, a corkboard pinned with crossed-out incident "
            "timelines, each with red string connecting them like a "
            "detective's investigation board. A subtle anachronism: one "
            "of the 'evidence' items on the desk is a small modern silver "
            "USB stick, sitting incongruously alongside the Victorian "
            "objects, catching the lamplight. A handwritten card by the "
            "magnifying glass reads 'TEN FAILURES · TEN STAGES'. Cinematic, "
            "atmospheric, scholarly, awe-inducing — the gravity of careful "
            "postmortem investigation. Classy, intelligent, hopeful. NO "
            "modern UI. NO sci-fi gloss. NO AI gradient slop. 16:9."
        ),
        "video_prompt": (
            "A subtle animation of a Victorian detective's study at "
            "night, lit by a single green-shaded banker's lamp. NO zoom, "
            "NO pan, NO camera motion. Animation ONLY in these places, "
            "each gentle and loopable:\n"
            "(1) The firelight from offscreen casts very slow flickering "
            "warm-light variations across the wood-paneled wall and the "
            "evidence cards on the desk.\n"
            "(2) The brass magnifying glass on the desk catches the "
            "lamplight and glints softly every couple of seconds.\n"
            "(3) The red strings on the corkboard wall sway very faintly "
            "as if from a draft.\n"
            "(4) The cursor-like glint on the silver USB stick blinks "
            "once every few seconds — its only sign of life.\n"
            "(5) No human figure is present. The scene is empty.\n"
            "Mood: quiet contemplation, careful work, the case is solved. "
            "Painterly oil texture preserved throughout. Static camera. "
            "Loopable."
        ),
    },
    {
        "slug": "12-qa-and-release-management-capabilities-for-llms",
        "label": "Mendeleev periodic table · taxonomy of capabilities",
        "image_prompt": (
            "A reimagined periodic table of the elements rendered on aged "
            "cream chemistry-textbook paper from the 1900s, in the visual "
            "language of Mendeleev's original 1869 chart. The chart shows "
            "exactly TWELVE element squares arranged in 4 rows of 3, with "
            "the same numerals + abbreviation + name layout as the real "
            "periodic table. The 12 elements are not real elements — they "
            "are AI release-engineering capabilities, each colored by "
            "which pipeline stage 'group' it belongs to. Top row in deep "
            "green (Register group): 'Mf' Manifest, 'Sw' Atomic-Swap, "
            "'Ep' Env-Parity. Second row in tan (Gate group): 'Sg' "
            "Slice-Gate, 'Cj' Calibrated-Judge, 'Or' Override-Rationale. "
            "Third row in rust (Roll group): 'Cn' Canary, 'Qm' Quality-"
            "Monitor, 'Ah' Auto-Halt. Bottom row in sage (Observe group): "
            "'Tr' Trace-Replay, 'Ar' Atomic-Rollback, 'Hr' Hash-Receipt. "
            "Each element square has its atomic number in the corner (1 "
            "through 12), a two-letter abbreviation in large serif type, "
            "the full capability name below, and a tiny illustrative "
            "glyph above (a wax seal for Manifest, a balance for Slice-"
            "Gate, a clock-tower for Atomic-Rollback, etc.). Title at the "
            "top in elegant 19th-century serif lettering: 'PERIODIC TABLE "
            "OF AI RELEASE CAPABILITIES · DIVINCI · 2026'. A small Latin "
            "subtitle: 'Tabula Periodica Capacitatum'. A subtle "
            "anachronism: a single modern fountain pen with a glowing "
            "blue ink tip rests in the corner of the chart, having just "
            "annotated it. Cinematic, scholarly, the visual gravity of "
            "scientific taxonomy. Classy, awe-inducing. NO modern UI. NO "
            "AI gradient slop. 16:9 aspect ratio."
        ),
        "video_prompt": (
            "A subtle animation of a 12-element periodic table on aged "
            "cream paper. NO zoom, NO pan, NO camera motion. Animation "
            "ONLY in these places, each gentle and loopable:\n"
            "(1) Each of the 12 element squares pulses very softly in "
            "sequence, one after the other, from upper-left to lower-"
            "right, completing a full cycle every few seconds. Each "
            "pulse is a single gentle brightening of the square's color, "
            "no movement.\n"
            "(2) The modern fountain pen in the corner glints with a "
            "soft blue inkpoint shimmer once per cycle.\n"
            "(3) The title and subtitle do NOT move.\n"
            "(4) No human figure is present.\n"
            "Mood: scientific authority, slow contemplation, the "
            "satisfaction of a complete taxonomy. Painterly aged-paper "
            "texture preserved. Static camera. Loopable."
        ),
    },
    {
        "slug": "validating-and-releasing-custom-lms-in-regulated-fields",
        "label": "Vermeer Dutch Golden Age · compliance ritual",
        "image_prompt": (
            "A reimagined Johannes Vermeer Dutch Golden Age interior, "
            "painted in Vermeer's exact visual language — single soft "
            "window-light from the left, deep blue and ochre-yellow color "
            "palette, painterly chiaroscuro, the famous Vermeer stillness "
            "and quiet gravity. The scene: a single figure (back to the "
            "viewer in a wool cloak the color of lapis lazuli) sits at a "
            "polished oak writing desk, illuminated by the window light. "
            "On the desk before them: an open ledger bearing four "
            "regulatory seals, each in a different wax color — a deep "
            "green seal labelled 'EU AI ACT', a rust-red seal labelled "
            "'GDPR · ART. 17', a warm tan seal labelled 'HIPAA', a sage-"
            "green seal labelled 'NIST AI RMF'. Beside the ledger: a "
            "Delft-blue porcelain inkwell, a feathered quill resting in "
            "it, and a small cascade of cream-colored hash-chained "
            "receipt cards flowing out of the ledger onto the desk. A "
            "subtle anachronism: a single thin modern fiber-optic strand "
            "runs from the inkwell upward across the canvas and exits "
            "through the window — a glowing thread of warm-gold light, "
            "the only futuristic detail. On the wall behind the figure, "
            "a small framed map of Europe with the EU stars, painted in "
            "the Vermeer style. Cinematic, painterly, the visual gravity "
            "of sacred bureaucratic work done quietly by a single hand. "
            "Awe-inducing, contemplative, hopeful — compliance as a "
            "form of devotion. NO modern UI. NO sci-fi gloss. NO AI "
            "gradient slop. Oil-on-canvas texture. 16:9 aspect ratio."
        ),
        "video_prompt": (
            "A subtle animation of a Vermeer Dutch Golden Age interior. "
            "NO zoom, NO pan, NO camera motion. Animation ONLY in these "
            "places, each gentle and loopable:\n"
            "(1) The window-light from the left brightens and dims "
            "imperceptibly, as if a cloud passes outside — a 6-second "
            "cycle.\n"
            "(2) The four regulatory wax seals on the ledger each glow "
            "very softly in their own colors, in sequence (green, rust, "
            "tan, sage), one after the other, completing the cycle every "
            "few seconds.\n"
            "(3) The cascade of hash-chained receipt cards flowing out "
            "of the ledger drifts very slowly downward as if continuing "
            "to write itself, a paper waterfall in slow motion.\n"
            "(4) The thin modern fiber-optic strand running from the "
            "inkwell up across the canvas pulses with warm-gold light "
            "rhythmically, like a heartbeat.\n"
            "(5) The figure at the desk does NOT move. They are still, "
            "Vermeer's signature stillness preserved.\n"
            "Mood: sacred, quiet, midnight contemplation, the audit is "
            "happening on its own. Vermeer's painterly oil texture "
            "preserved throughout. Static camera. Loopable."
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


def gen_hero_png(prompt, slug, dst_path):
    """Nano Banana first; on 429 fall back to Imagen 4 Ultra."""
    nano_url = f"{BASE}/models/gemini-3-pro-image-preview:generateContent?key={API_KEY}"
    body = {"contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseModalities": ["IMAGE"],
                                 "imageConfig": {"aspectRatio": "16:9"}}}
    try:
        resp = http_post(nano_url, body)
        parts = (resp.get("candidates") or [{}])[0].get("content", {}).get("parts", [])
        image_part = next((p for p in parts if "inlineData" in p), None)
        if not image_part:
            raise RuntimeError(f"No image: {json.dumps(resp)[:400]}")
        dst_path.write_bytes(base64.b64decode(image_part["inlineData"]["data"]))
        return "nano-banana-pro"
    except RuntimeError as e:
        if "429" not in str(e):
            raise
        print(f"    …Nano 429, falling back to Imagen for {slug}")
        imagen_url = f"{BASE}/models/imagen-4.0-ultra-generate-001:predict?key={API_KEY}"
        ibody = {"instances": [{"prompt": prompt}],
                 "parameters": {"sampleCount": 1, "aspectRatio": "16:9",
                                "personGeneration": "allow_adult"}}
        resp = http_post(imagen_url, ibody)
        preds = resp.get("predictions", [])
        if not preds or not preds[0].get("bytesBase64Encoded"):
            raise RuntimeError(f"Imagen failed: {json.dumps(resp)[:400]}")
        dst_path.write_bytes(base64.b64decode(preds[0]["bytesBase64Encoded"]))
        return "imagen-4-ultra"


def submit_veo(prompt, image_path):
    image_b64 = base64.b64encode(image_path.read_bytes()).decode("ascii")
    url = f"{BASE}/models/{VEO_MODEL}:predictLongRunning?key={API_KEY}"
    body = {"instances": [{"prompt": prompt,
                            "image": {"bytesBase64Encoded": image_b64, "mimeType": "image/png"}}],
            "parameters": {"aspectRatio": "16:9", "durationSeconds": 4,
                           "sampleCount": 1, "personGeneration": "allow_adult"}}
    return http_post(url, body)["name"]


def poll(op_name, slug, timeout_s=600):
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
                out.write_bytes(http_get_bytes(uri))
                return out.stat().st_size
        raise RuntimeError("No predictions/samples")
    pred = preds[0]
    if "bytesBase64Encoded" in pred:
        out.write_bytes(base64.b64decode(pred["bytesBase64Encoded"]))
        return out.stat().st_size
    uri = (pred.get("video") or {}).get("uri") or pred.get("videoUri")
    if uri:
        if "key=" not in uri:
            uri = f"{uri}{'&' if '?' in uri else '?'}key={API_KEY}"
        out.write_bytes(http_get_bytes(uri))
        return out.stat().st_size
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


def process(job):
    slug = job["slug"]
    print(f"\n=== {slug} — {job['label']} ===")
    hero_png = IMG_DIR / f"{slug}-hero.png"
    mp4_path = VIDEO_DIR / f"{slug}-veo31.mp4"
    webm_path = VIDEO_DIR / f"{slug}-veo31.webm"
    poster_path = IMG_DIR / f"{slug}-hero-poster.webp"

    # Backup the existing hero so we can restore on bail-out
    backup_png = hero_png.with_suffix(".png.pre-arthistory.bak")
    if hero_png.exists() and not backup_png.exists():
        shutil.copy2(hero_png, backup_png)
        print(f"  → backed up existing hero to {backup_png.name}")

    print(f"  [1/4] Generate new hero PNG")
    model = gen_hero_png(job["image_prompt"], slug, hero_png)
    print(f"    ✓ {hero_png.name} via {model} ({hero_png.stat().st_size/1024:.0f} KB)")

    print(f"  [2/4] Veo 3.1 image-to-video")
    op = submit_veo(job["video_prompt"], hero_png)
    resp = poll(op, slug, timeout_s=600)
    size = save_mp4(resp, mp4_path)
    print(f"    ✓ {mp4_path.name} ({size/1024:.0f} KB)")

    print(f"  [3/4] MP4 → WebM (overwrites existing)")
    to_webm(mp4_path, webm_path)
    print(f"    ✓ {webm_path.name} ({webm_path.stat().st_size/1024:.0f} KB)")

    print(f"  [4/4] WebP poster (overwrites existing)")
    make_poster(hero_png, poster_path)
    print(f"    ✓ {poster_path.name} ({poster_path.stat().st_size/1024:.0f} KB)")

    return {"slug": slug, "webm": webm_path, "poster": poster_path, "png": hero_png}


def main():
    print(f"Re-hero series — {len(JOBS)} posts.")
    results = []
    failures = []
    for job in JOBS:
        try:
            r = process(job)
            results.append(r)
        except Exception as e:
            print(f"  ✗ {job['slug']} FAILED: {e}")
            failures.append((job["slug"], str(e)[:200]))

    print(f"\n=== Summary ===")
    print(f"  ok:     {len(results)}/{len(JOBS)}")
    for r in results:
        print(f"    → {r['slug']}")
    if failures:
        print(f"  failed: {len(failures)}")
        for slug, err in failures:
            print(f"    ✗ {slug}: {err}")

    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
