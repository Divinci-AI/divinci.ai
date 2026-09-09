#!/usr/bin/env python3
"""Composite an annotating hand onto a video, drawing the marks from marks.py.

    python3 tools/video/hands.py build/video/trustbench-demo.mp4 \
        build/video/marks/marks.json build/video/trustbench-hands.mp4

The hand and the stroke are one motion. marks.py already solved the path and
emitted, per frame, the point the stroke has reached; this places the hand so
its stylus TIP sits on that point. Nothing is eyeballed: the hand's own tip is
read from <asset>-tips.json, which records where the bristles are in each frame
of the clip as a fraction of its box.

Why the overlay is pre-rendered in PIL rather than done in one ffmpeg filter:
ffmpeg's overlay can take x/y as expressions of time, but not as an arbitrary
per-frame table, and the hand's position is exactly that. Each mark is only a
couple of seconds, so the segments are rendered as RGBA sequences and dropped
onto the assembled video at their cue.

The hand ENTERS from off-frame right, draws, holds a beat, and leaves. It is on
screen for about a second either side of the stroke, so it reads as arriving to
make the mark rather than being parked there.
"""
from __future__ import annotations

import json
import math
import re
import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

W, H, FPS = 1568, 882, 30
LEAD_IN = 0.9       # seconds of travel before the stroke starts
LEAD_OUT = 0.7      # hold, then leave
HAND_W = 1120       # on-canvas width of the hand box

# Doubled from 560. At the smaller size the hand read as a cursor rather than as
# a hand annotating a page — the stylus was the only part that registered while
# the drawing itself went unnoticed. At 1120 on a 1568-wide canvas the arm is
# roughly life-size against the UI, which is the relationship the pipeline page
# has. The tip is still placed to the pixel, so scale changes what it looks like
# and not where it draws.


def ffprobe_duration(p: Path) -> float:
    return float(subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(p)],
        capture_output=True, text=True, check=True).stdout.strip())


def hand_frames(webm: Path, cache: Path) -> list[Path]:
    """Decode the alpha clip to RGBA PNGs (cached).

    -c:v libvpx-vp9 is REQUIRED. ffmpeg's default decoder silently drops WebM
    alpha, which makes the hand arrive as an opaque rectangle -- and makes the
    source look like it never had alpha in the first place.
    """
    # Invalidate on the SOURCE's mtime. Keying a new take writes a new .webm
    # and a new tips.json, but the cache directory still holds the previous
    # take's decoded frames — so the compositor drew take 1's hand while
    # positioning it with take 3's tip track. The arm pointed off-screen and the
    # stylus missed the mark by hundreds of pixels, which looks like a mirroring
    # bug and is really a stale cache.
    stamp = cache / ".source-mtime"
    mtime = str(webm.stat().st_mtime_ns)
    if cache.exists() and any(cache.glob("*.png")):
        if stamp.exists() and stamp.read_text() == mtime:
            return sorted(cache.glob("*.png"))
        shutil.rmtree(cache)
        print(f"    {webm.name} changed — re-decoding")
    cache.mkdir(parents=True, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-c:v", "libvpx-vp9", "-i", str(webm),
         "-pix_fmt", "rgba", str(cache / "%04d.png")], check=True)
    stamp.write_text(mtime)
    return sorted(cache.glob("*.png"))


def feather(img: Image.Image, frac: float = 0.10, side: str = "right") -> Image.Image:
    """Fade the arm's outer cut edges to transparent.

    The source clip crops the forearm at its own box boundary, so wherever the
    box lands inside the frame the arm ends in a hard straight line — it reads
    as a sticker with a corner cut off. Feathering the right and bottom edges
    (the two the arm runs into, since it enters from the lower right) turns that
    into the arm receding out of shot. Cheaper and more robust than scaling the
    hand up until the cut happens to fall off-canvas, which would tie the hand's
    SIZE to where the mark happens to be.
    """
    w, h = img.size
    fw, fh = max(1, int(w * frac)), max(1, int(h * frac))
    px = img.load()
    # Feather the edge the ARM runs into, which depends on which side it enters
    # from. Feathering the wrong edge does nothing useful and leaves the real
    # cut showing as a hard line.
    xs = range(w - fw, w) if side == "right" else range(0, fw)
    for x in xs:
        k = (w - x) / fw if side == "right" else (x + 1) / fw
        for y in range(h):
            r, g, b, al = px[x, y]
            px[x, y] = (r, g, b, int(al * k))
    for y in range(h - fh, h):
        k = (h - y) / fh
        for x in range(w):
            r, g, b, al = px[x, y]
            px[x, y] = (r, g, b, int(al * k))
    return img


def ease_io(t):
    return 2 * t * t if t < 0.5 else 1 - ((-2 * t + 2) ** 2) / 2


def load_hand(asset: str):
    """Decode one hand asset and read its tip track."""
    meta = json.loads(Path(f"static/data/{asset}-tips.json").read_text())
    frames = hand_frames(Path(f"static/video/{asset}.webm"),
                         Path(f"build/video/.hand-cache/{asset}"))
    if not frames:
        sys.exit(f"no frames decoded from {asset}.webm")
    # A tip on the RIGHT of the box means the arm extends left, so it enters
    # from the left and its cut edge is on the left. Reading it from the tip
    # track means a new hand needs no configuration.
    tipx = sum(t[0] for t in meta["tips"]) / len(meta["tips"])
    side = "left" if tipx > 0.5 else "right"
    return {"meta": meta, "frames": frames, "side": side,
            "h": round(HAND_W * meta["h"] / meta["w"])}


def shot_bounds(shots_mjs: Path, total: float):
    """Start time of every shot, so a mark can persist to the end of its own.

    A drawn mark belongs to the FRAME it was drawn on. It should stay while that
    frame is up -- rubbing itself out two seconds later, with the same screen
    still on show, reads as the annotation being undone rather than made -- and
    it must not survive the cut, or it would sit over content it never marked.
    """
    src = shots_mjs.read_text()
    ats = [float(a) for a in re.findall(r"\{ at: ([0-9.]+),\s+scene:", src)]
    ats.sort()
    return ats + [total]


def build(video: Path, marks_json: Path, out: Path, asset: str = "leonardo-brush",
          shots_mjs: Path = Path("tools/video/scripts/trustbench.shots.mjs")):
    spec = json.loads(marks_json.read_text())
    # A mark may name its own hand, so the speaker who says the line is the one
    # who makes the mark. Falls back to the default for marks that do not care.
    hands = {}
    for m in spec["marks"]:
        a = m.get("hand", asset)
        if a not in hands:
            hands[a] = load_hand(a)
            print(f"  hand {a}: {len(hands[a]['frames'])} frames, enters from the {hands[a]['side']}")

    work = Path("build/video/.overlays")
    if work.exists():
        shutil.rmtree(work)
    work.mkdir(parents=True)

    total = ffprobe_duration(video)
    bounds = shot_bounds(shots_mjs, total)
    segments, holds = [], []
    for mark in spec["marks"]:
        hand = hands[mark.get("hand", asset)]
        tips_meta, frames, hand_h = hand["meta"], hand["frames"], hand["h"]
        side = hand["side"]
        off = W if side == "right" else -HAND_W   # where it travels from
        mdir = Path(mark["dir"])
        tips = mark["tips"]
        n_draw = mark["frames"]
        n_in = round(LEAD_IN * FPS)
        n_out = round(LEAD_OUT * FPS)
        seg = work / mark["id"]
        seg.mkdir(parents=True)

        # The hand is parked on the FIRST tip while it travels in, and on the
        # last while it leaves, so the stroke never starts without the stylus
        # already touching it.
        start_pt, end_pt = tips[0], tips[-1]

        for i in range(n_in + n_draw + n_out):
            canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))

            # how much of the stroke is showing
            if i < n_in:
                mark_idx = 0
            elif i < n_in + n_draw:
                mark_idx = i - n_in
            else:
                mark_idx = n_draw - 1
            mk = Image.open(mdir / f"{mark_idx:04d}.png").convert("RGBA")
            canvas = Image.alpha_composite(canvas, mk)

            # where the stylus tip must be
            if i < n_in:
                target = start_pt
            elif i < n_in + n_draw:
                target = tips[i - n_in]
            else:
                target = end_pt

            hf = Image.open(frames[i % len(frames)]).convert("RGBA")
            hf = feather(hf.resize((HAND_W, hand_h), Image.LANCZOS), side=side)
            tipx, tipy = tips_meta["tips"][(i % len(frames)) % len(tips_meta["tips"])]
            hx = target[0] - tipx * HAND_W
            hy = target[1] - tipy * hand_h

            # travel in from off-frame right; slide back out the same way
            if i < n_in:
                k = 1 - ease_io((i + 1) / n_in)
                hx += (off - hx) * k
            elif i >= n_in + n_draw:
                k = ease_io((i - n_in - n_draw + 1) / n_out)
                hx += (off - hx) * k

            layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
            layer.paste(hf, (round(hx), round(hy)), hf)
            Image.alpha_composite(canvas, layer).save(seg / f"{i:04d}.png")

        segments.append({
            "id": mark["id"],
            "start": mark["at"] - LEAD_IN,
            "frames": n_in + n_draw + n_out,
            "dir": str(seg),
        })
        # The completed stroke, held from the moment the hand leaves until the
        # frame it was drawn on is cut. One static image, not a sequence: the
        # mark is finished, so every frame of the hold is identical.
        seg_end = mark["at"] - LEAD_IN + (n_in + n_draw + n_out) / FPS
        shot_end = next((b for b in bounds if b > mark["at"]), bounds[-1])
        if shot_end - seg_end > 0.2:
            holds.append({
                "id": mark["id"],
                "png": str(mdir / f"{n_draw - 1:04d}.png"),
                "start": seg_end,
                "end": shot_end,
            })
        print(f"  {mark['id']:<18} {n_in + n_draw + n_out:>3} frames, "
              f"draws {mark['at'] - LEAD_IN:.1f}s, holds to {shot_end:.1f}s")

    # Holds are drawn FIRST so a later hand passes over its own finished mark
    # rather than under it.
    layers = ([{"kind": "hold", **h} for h in holds] +
              [{"kind": "seg", **s} for s in segments])

    inputs, filt, last = [], [], "0:v"
    for i, s in enumerate(layers, start=1):
        if s["kind"] == "hold":
            inputs += ["-loop", "1", "-framerate", str(FPS),
                       "-t", f"{s['end'] - s['start']:.3f}", "-i", s["png"]]
            end = s["end"]
        else:
            inputs += ["-framerate", str(FPS), "-start_number", "0",
                       "-i", f"{s['dir']}/%04d.png"]
            end = s["start"] + s["frames"] / FPS
        out_lbl = f"v{i}" if i < len(layers) else "vout"
        # setpts is what makes `enable` mean anything. A PNG sequence input
        # starts at ITS OWN t=0, while `enable` gates on the MAIN video's
        # clock -- so without shifting the sequence forward, its frames have
        # run out long before the window opens and the overlay never appears.
        # Measured before this: every mark silently absent from the output.
        filt.append(f"[{i}:v]setpts=PTS+{s['start']:.3f}/TB[o{i}]")
        filt.append(
            f"[{last}][o{i}]overlay=x=0:y=0:"
            f"enable='between(t,{s['start']:.3f},{end:.3f})':"
            f"eof_action=pass:shortest=0[{out_lbl}]")
        last = out_lbl

    subprocess.run(
        ["ffmpeg", "-y", "-v", "error", "-i", str(video), *inputs,
         "-filter_complex", ";".join(filt),
         "-map", "[vout]", "-map", "0:a",
         "-c:v", "libx264", "-preset", "medium", "-crf", "20",
         "-pix_fmt", "yuv420p", "-force_key_frames", "expr:gte(t,n_forced*2)",
         "-c:a", "copy", "-movflags", "+faststart", str(out)], check=True)

    print(f"\nwrote {out} ({ffprobe_duration(out):.2f}s)")


if __name__ == "__main__":
    if len(sys.argv) < 4:
        sys.exit("usage: hands.py <video> <marks.json> <out> [asset]")
    build(Path(sys.argv[1]), Path(sys.argv[2]), Path(sys.argv[3]),
          sys.argv[4] if len(sys.argv) > 4 else "leonardo-brush")
