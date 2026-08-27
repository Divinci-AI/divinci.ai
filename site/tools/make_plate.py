#!/usr/bin/env python3
"""Turn a generated arm image into a clean chroma-key plate for Veo.

Three things have to happen every time, and all three have bitten us:

* The generator never returns the flat #00B140 it was asked for -- it drifts to
  a muted olive that sits right on the edge of the keyer's threshold. So the
  image is keyed here against its *actual* background colour and re-laid onto a
  mathematically exact green.
* It often leaves a fragment of another figure (a shoulder, a sleeve) in a
  corner. Only the largest connected blob is kept.
* Cross-hatched drapery cannot be keyed cleanly -- the background genuinely
  shows between the strokes, so any matte leaves a ragged edge. The arm is
  therefore scaled and placed so that end runs off the bottom-right corner,
  which is also what stops it reading as a severed floating limb.

    python3 make_plate.py in.png out.png [--tol 52] [--size 1920x1080]
"""
import subprocess
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

TX, TY = 0.24, 0.17     # where the tool tip should sit in the plate
MARGIN = 1.22           # push the un-keyable end well past the corner
GREEN = (0, 177, 64)
HERE = Path(__file__).resolve().parent


def largest_blob(rgba):
    m = rgba[..., 3] > 60
    h, w = m.shape
    seen = np.zeros_like(m)
    best, bestn = None, 0
    for sy in range(0, h, 4):
        for sx in range(0, w, 4):
            if not m[sy, sx] or seen[sy, sx]:
                continue
            q = deque([(sy, sx)]); seen[sy, sx] = True; comp = []
            while q:
                y, x = q.popleft(); comp.append((y, x))
                for ny, nx in ((y-1, x), (y+1, x), (y, x-1), (y, x+1)):
                    if 0 <= ny < h and 0 <= nx < w and m[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True; q.append((ny, nx))
            if len(comp) > bestn:
                bestn, best = len(comp), comp
    keep = np.zeros_like(m)
    for y, x in best:
        keep[y, x] = True
    out = rgba.copy()
    out[..., 3] = np.where(keep, out[..., 3], 0)
    return out, bestn / (h * w)


def main():
    src, dst = Path(sys.argv[1]), Path(sys.argv[2])
    args = sys.argv[3:]
    tol = args[args.index("--tol") + 1] if "--tol" in args else "52"
    size = args[args.index("--size") + 1] if "--size" in args else "1920x1080"
    W, H = (int(v) for v in size.split("x"))

    cut = dst.with_suffix(".cut.png")
    subprocess.run([sys.executable, str(HERE / "dechecker.py"), str(src), str(cut),
                    "--tol", tol, "--feather", "0.8"], check=True)

    rgba, frac = largest_blob(np.asarray(Image.open(cut).convert("RGBA")))
    arm = Image.fromarray(rgba, "RGBA")
    arm = arm.crop(arm.getbbox())
    print(f"largest blob = {100*frac:.1f}% of image; arm {arm.size}")

    al = np.asarray(arm)[..., 3]
    ys, xs = np.nonzero(al > 60)
    tipx = int(xs.min())
    tipy = float(ys[xs < tipx + 6].mean())
    cw, ch = arm.size

    s = max((1 - TX) * W / (cw - tipx), (1 - TY) * H / (ch - tipy)) * MARGIN
    a2 = arm.resize((round(cw * s), round(ch * s)), Image.LANCZOS)
    plate = Image.new("RGB", (W, H), GREEN)
    plate.paste(a2, (round(TX * W - tipx * s), round(TY * H - tipy * s)), a2)
    plate.save(dst)
    cut.unlink(missing_ok=True)
    print(f"wrote {dst} {plate.size}  scale={s:.2f}  tip at ({TX:.2f},{TY:.2f})")


if __name__ == "__main__":
    main()
