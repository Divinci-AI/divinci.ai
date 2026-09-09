#!/usr/bin/env python3
"""Render a drawn mark as a transparent PNG sequence, plus the per-frame tip
position the hand must follow.

    python3 tools/video/marks.py tools/video/scripts/trustbench.marks.json \
        build/video/marks

The mark and the hand are the same motion described twice: the stroke is
revealed up to a point on its own path, and the hand is placed so its stylus tip
sits exactly on that point. Solving the path ONCE and emitting both the frames
and the tip track is what keeps them together. The pipeline page learned this
the hard way -- an averaged tip put the brush ~130px off the ink it was
supposed to be drawing, so the tip is tracked per frame here too.

Drawn with PIL rather than SVG on purpose: this machine has no rsvg-convert,
cairosvg or inkscape, and ffmpeg has no SVG decoder. Since the path is already
flattened to points for the arc-length walk, drawing it directly removes a
dependency instead of adding one.

Strokes are supersampled 3x and downscaled, which is what gives the edge its
antialiasing -- PIL's line() has no AA of its own, and at video scale the
aliasing on a diagonal is obvious.
"""
from __future__ import annotations

import json
import math
import shutil
import sys
from pathlib import Path

from PIL import Image, ImageDraw

SS = 3  # supersample factor


def sample_path(segs, per=240):
    """Flatten cubic Béziers to points, with a cumulative arc-length table."""
    pts = []
    for s in segs:
        (x0, y0), (cx1, cy1), (cx2, cy2), (x1, y1) = s["from"], s["c1"], s["c2"], s["to"]
        for i in range(per + 1):
            t = i / per
            u = 1 - t
            pts.append((
                u*u*u*x0 + 3*u*u*t*cx1 + 3*u*t*t*cx2 + t*t*t*x1,
                u*u*u*y0 + 3*u*u*t*cy1 + 3*u*t*t*cy2 + t*t*t*y1,
            ))
    # Cumulative LENGTH, not parameter. A Bézier's parameter is not proportional
    # to its arc length, so easing on t alone makes the hand lurch through the
    # curves and crawl along the straights.
    cum = [0.0]
    for i in range(1, len(pts)):
        cum.append(cum[-1] + math.dist(pts[i], pts[i - 1]))
    return pts, cum


def point_at(pts, cum, target):
    lo, hi = 0, len(cum) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if cum[mid] < target:
            lo = mid + 1
        else:
            hi = mid
    return pts[lo]


def ease(t):
    """Soft start and finish, like a real stroke."""
    return 2 * t * t if t < 0.5 else 1 - ((-2 * t + 2) ** 2) / 2


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def render(spec_path: Path, out_dir: Path):
    spec = json.loads(spec_path.read_text())
    W, H, FPS = spec.get("width", 1568), spec.get("height", 882), spec.get("fps", 30)

    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    manifest = []
    for mark in spec["marks"]:
        pts, cum = sample_path(mark["path"])
        total = cum[-1]
        frames = max(1, round(mark["duration"] * FPS))
        d = out_dir / mark["id"]
        d.mkdir(parents=True)

        rgb = hex_rgb(mark.get("color", "#e8c07a"))
        alpha = int(255 * mark.get("opacity", 0.92))
        width = mark.get("width", 5)
        tips = []

        for f in range(frames):
            drawn = ease(1.0 if frames == 1 else f / (frames - 1))
            upto = max(1e-6, total * drawn)
            tips.append(list(point_at(pts, cum, upto)))

            img = Image.new("RGBA", (W * SS, H * SS), (0, 0, 0, 0))
            dr = ImageDraw.Draw(img)
            # every point up to the reveal length
            n = 0
            while n < len(cum) and cum[n] <= upto:
                n += 1
            seg = [(x * SS, y * SS) for x, y in pts[:max(2, n)]]
            if len(seg) >= 2:
                dr.line(seg, fill=rgb + (alpha,), width=width * SS, joint="curve")
                # round caps: PIL's line() gives butt ends, which read as a
                # chopped stroke at this weight.
                r = width * SS / 2
                for cx, cy in (seg[0], seg[-1]):
                    dr.ellipse([cx - r, cy - r, cx + r, cy + r], fill=rgb + (alpha,))
            img.resize((W, H), Image.LANCZOS).save(d / f"{f:04d}.png")

        manifest.append({
            "id": mark["id"], "at": mark["at"], "duration": mark["duration"],
            "frames": frames, "tips": tips, "dir": str(d),
        })
        print(f"  {mark['id']:<18} {frames:>3} frames, {total:>5.0f}px of stroke")

    (out_dir / "marks.json").write_text(
        json.dumps({"width": W, "height": H, "fps": FPS, "marks": manifest}, indent=1))
    print(f"\nwrote {out_dir}/marks.json ({len(manifest)} marks)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit("usage: marks.py <marks.json> [outdir]")
    render(Path(sys.argv[1]), Path(sys.argv[2] if len(sys.argv) > 2 else "build/video/marks"))
