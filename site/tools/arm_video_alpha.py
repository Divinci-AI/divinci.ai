#!/usr/bin/env python3
"""Key the green-screen arm clip to real alpha, and track the brush tip.

Why the tip tracking exists: the arm has its own idle motion, so the bristle tip
wanders inside the video frame. If the page positioned the video by its bounding
box, the tip would float off the ink by however much Veo moved the hand -- which
measured ~40px horizontally on the first take. Instead every frame's tip is
recorded as a fraction of the (fixed) output box, and the page offsets the video
by the current frame's tip so the bristles stay pinned to the ink.

Also note the two output codecs. There is no single transparent-video format the
web agrees on: VP9-in-WebM carries alpha everywhere except Safari, and HEVC with
an alpha layer carries it *only* on Safari. Shipping both, with the still cutout
as the last fallback, is the whole compatibility story.

    python3 arm_video_alpha.py arm-green.mp4 outdir/ --name leonardo-arm
"""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

# Fine ink hatching compresses badly -- raising CRF smears exactly the detail
# this asset exists for. So the size lever is frame count and pixel dimensions,
# not quality. Overridable: --fps 10 --crf 36 --max-width 1300
FPS_OUT = 10          # idle motion; 24 is wasted bytes
CRF = 36
MAX_W = 1300
MAX_DRIFT = 15.0      # degrees of pencil rotation tolerated before we cut
INSET = 8             # trim the encoder's non-green frame border (see debar)
KEY_HI = 42.0         # greenness at/above which a pixel is pure background
KEY_LO = 14.0         # greenness at/below which a pixel is fully opaque


def pencil_angle(rgb):
    """Principal axis of the pencil, by colour. Returns degrees, or None."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = (r > 70) & (r < 190) & (g < 95) & (b < 95) & (r > g + 35) & (r > b + 25)
    ys, xs = np.nonzero(m)
    if len(xs) < 200:
        return None
    xs = xs - xs.mean(); ys = ys - ys.mean()
    w, v = np.linalg.eigh(np.cov(np.vstack([xs, ys])))
    ax = v[:, np.argmax(w)]
    return float(np.degrees(np.arctan2(ax[1], ax[0])) % 180)


def drift_gate(frames, max_drift=None):
    """Trim the clip where the generated pose stops being usable.

    Asking Veo for visible finger articulation reliably breaks the grip: the
    motion is good for the first seconds, then the hand rotates, opens, and in
    the worst case drops the pencil entirely. The failure is progressive, so the
    fix is to keep the good head of the clip and ping-pong it rather than to
    keep re-rolling and hoping. Cutting on two consecutive over-threshold frames
    avoids a single noisy angle estimate truncating the whole clip.
    """
    limit = MAX_DRIFT if max_drift is None else max_drift
    base, over = None, 0
    for i, f in enumerate(frames):
        a = pencil_angle(np.asarray(Image.open(f).convert("RGB"), dtype=np.float32))
        bad = a is None
        if not bad:
            if base is None:
                base = a
            bad = abs((a - base + 90) % 180 - 90) > limit
        over = over + 1 if bad else 0
        if over >= 2:
            cut = max(2, i - 1)
            print(f"drift gate: pose breaks at frame {i} -- keeping {cut}")
            return frames[:cut]
    return frames


def run(cmd):
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode:
        sys.exit(f"FAILED: {' '.join(cmd[:6])}…\n{p.stderr[-2000:]}")
    return p


def despeck(alpha, min_frac=0.002):
    """Drop specks: an opening (erode then dilate) on the alpha mask.

    The encoded frames carry a 1-2px border of neutral grey that is not green at
    all, so it keys as fully opaque and drags the union bounding box out to the
    whole frame. INSET removes the bulk of it; this clears whatever survives,
    plus any isolated keying noise, without eroding the arm itself.
    """
    m = Image.fromarray((alpha > 0.5).astype(np.uint8) * 255)
    m = m.filter(ImageFilter.MinFilter(5)).filter(ImageFilter.MaxFilter(5))
    keep = np.asarray(m) > 127
    if keep.mean() < min_frac:      # opening ate everything -- keep the original
        return alpha
    return alpha * keep


def key_frame(rgb):
    """Green -> alpha, with a soft edge and green-spill suppression."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    greenness = g - np.maximum(r, b)
    alpha = np.clip((KEY_HI - greenness) / (KEY_HI - KEY_LO), 0.0, 1.0)

    # Despill: pull the green channel down to the r/b average wherever it leads,
    # otherwise every semi-transparent rim pixel carries a green fringe.
    lim = (r + b) / 2.0
    g2 = np.where(g > lim, lim, g)
    out = np.dstack([r, g2, b])
    return out, alpha


def main():
    src = Path(sys.argv[1])
    outdir = Path(sys.argv[2]); outdir.mkdir(parents=True, exist_ok=True)
    args = sys.argv[3:]
    name = sys.argv[sys.argv.index("--name") + 1] if "--name" in sys.argv else src.stem
    global FPS_OUT, CRF, MAX_W, MAX_DRIFT
    for flag, cast in (("--fps", int), ("--crf", int), ("--max-width", int),
                       ("--max-drift", float)):
        if flag in args:
            v = cast(args[args.index(flag) + 1])
            if flag == "--fps": FPS_OUT = v
            elif flag == "--crf": CRF = v
            elif flag == "--max-drift": MAX_DRIFT = v
            else: MAX_W = v

    work = outdir / "_frames"; work.mkdir(exist_ok=True)
    for f in work.glob("*.png"):
        f.unlink()
    run(["ffmpeg", "-v", "error", "-i", str(src), "-vf", f"fps={FPS_OUT}",
         str(work / "f%04d.png"), "-y"])
    frames = sorted(work.glob("*.png"))
    print(f"{len(frames)} frames @ {FPS_OUT}fps")
    frames = drift_gate(frames)
    print(f"{len(frames)} frames kept ({len(frames)/FPS_OUT:.1f}s before ping-pong)")


    # Pass 1: key every frame, and find the union bounding box. The output box
    # must be identical for all frames -- a per-frame crop would itself move the
    # arm, which is exactly the drift we are trying to cancel.
    keyed, boxes = [], []
    for f in frames:
        rgb = np.asarray(Image.open(f).convert("RGB")).astype(np.float32)
        rgb = rgb[INSET:-INSET, INSET:-INSET]
        col, a = key_frame(rgb)
        a = despeck(a)
        keyed.append((col, a))
        ys, xs = np.nonzero(a > 0.15)
        boxes.append((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
    bx0 = min(b[0] for b in boxes); by0 = min(b[1] for b in boxes)
    bx1 = max(b[2] for b in boxes); by1 = max(b[3] for b in boxes)
    W, H = int(bx1 - bx0), int(by1 - by0)
    W -= W % 2; H -= H % 2                       # yuva420p needs even dimensions
    if MAX_W and W > MAX_W:
        H = max(2, round(H * MAX_W / W) // 2 * 2); W = MAX_W
    print(f"union box: {W}x{H}")

    # Pass 2: crop, write RGBA, and record the tip.
    rgba_dir = outdir / "_rgba"; rgba_dir.mkdir(exist_ok=True)
    for f in rgba_dir.glob("*.png"):
        f.unlink()
    tips = []
    for i, (col, a) in enumerate(keyed):
        c = col[by0:by0 + H, bx0:bx0 + W]
        al = a[by0:by0 + H, bx0:bx0 + W]
        # The bristle tip is the leading (leftmost) solid pixel of the brush.
        ys, xs = np.nonzero(al > 0.6)
        tx = int(xs.min())
        ty = float(ys[xs < tx + 5].mean())
        tips.append([round(tx / W, 5), round(ty / H, 5)])
        img = np.dstack([np.clip(c, 0, 255), al * 255]).astype(np.uint8)
        im = Image.fromarray(img, "RGBA")
        if MAX_W and im.width > MAX_W:
            im = im.resize((MAX_W, max(2, round(im.height * MAX_W / im.width) // 2 * 2)),
                           Image.LANCZOS)
        im.save(rgba_dir / f"r{i:04d}.png")

    # Ping-pong so the loop is seamless regardless of where Veo left the arm.
    n = len(tips)
    order = list(range(n)) + list(range(n - 2, 0, -1))
    seq_dir = outdir / "_seq"; seq_dir.mkdir(exist_ok=True)
    for f in seq_dir.glob("*.png"):
        f.unlink()
    for j, i in enumerate(order):
        shutil.copyfile(rgba_dir / f"r{i:04d}.png", seq_dir / f"s{j:04d}.png")
    tips = [tips[i] for i in order]

    txs = [t[0] for t in tips]; tys = [t[1] for t in tips]
    print(f"tip drift: x {min(txs):.4f}..{max(txs):.4f} "
          f"({(max(txs)-min(txs))*W:.0f}px)  "
          f"y {min(tys):.4f}..{max(tys):.4f} ({(max(tys)-min(tys))*H:.0f}px)")

    inp = ["-framerate", str(FPS_OUT), "-i", str(seq_dir / "s%04d.png")]
    webm = outdir / f"{name}.webm"
    run(["ffmpeg", "-v", "error", *inp, "-c:v", "libvpx-vp9",
         "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", str(CRF),
         "-deadline", "good", "-cpu-used", "2", "-an", str(webm), "-y"])
    # Safari: HEVC with an alpha layer, hvc1-tagged or it will not play inline.
    mp4 = outdir / f"{name}.mp4"
    run(["ffmpeg", "-v", "error", *inp, "-c:v", "hevc_videotoolbox",
         "-alpha_quality", "0.85", "-pix_fmt", "bgra", "-tag:v", "hvc1",
         "-b:v", "1100k", "-allow_sw", "1", "-an", str(mp4), "-y"])

    fill = float((np.asarray(Image.open(seq_dir / "s0000.png"))[..., 3] > 60).mean())
    meta = {"w": W, "h": H, "fps": FPS_OUT, "frames": len(order),
            "fill": round(fill, 4), "tips": tips}
    print(f"arm fills {100*fill:.1f}% of its box")
    (outdir / f"{name}-tips.json").write_text(json.dumps(meta, separators=(",", ":")))

    for p in (webm, mp4):
        print(f"{p.name}: {p.stat().st_size/1024:.0f} KB")
    print(f"{name}-tips.json: {len(order)} frames")


if __name__ == "__main__":
    main()
