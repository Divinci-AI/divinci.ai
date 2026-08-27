#!/usr/bin/env python3
"""Turn Gemini's *painted* transparency checkerboard into a real alpha channel.

Nano-banana ("gemini-2.5-flash-image") cannot emit an alpha channel. Asked for a
cutout it renders the checkerboard as literal pixels, so the PNG comes back
opaque RGB with a grid baked in. This keys that grid out.

Flood-filling inward from the border (rather than keying every checker-coloured
pixel globally) is what keeps the grey highlights on the mechanical forearm from
being punched into holes -- they are the same colour as the checker squares.

    python3 dechecker.py in.png out.png [--feather 1.2] [--tol 26]
"""
import sys
from collections import deque

import numpy as np
from PIL import Image, ImageFilter


def checker_colors(rgb, band=6):
    """The two alternating square colours, read off the image border."""
    edge = np.concatenate([
        rgb[:band].reshape(-1, 3), rgb[-band:].reshape(-1, 3),
        rgb[:, :band].reshape(-1, 3), rgb[:, -band:].reshape(-1, 3),
    ])
    uniq, counts = np.unique(edge, axis=0, return_counts=True)
    return uniq[np.argsort(-counts)[:2]].astype(np.int16)


def main():
    src, dst = sys.argv[1], sys.argv[2]
    args = sys.argv[3:]
    feather = float(args[args.index("--feather") + 1]) if "--feather" in args else 1.2
    tol = float(args[args.index("--tol") + 1]) if "--tol" in args else 26.0

    rgb = np.asarray(Image.open(src).convert("RGB"), dtype=np.int16)
    h, w, _ = rgb.shape
    cols = checker_colors(rgb)

    # Distance to the nearer checker colour: 0 = pure background, high = subject.
    dist = np.min([np.linalg.norm(rgb - c, axis=2) for c in cols], axis=0)
    is_bg = dist <= tol

    # Keep only the background region connected to the frame edge.
    outside = np.zeros((h, w), dtype=bool)
    q = deque()
    for y, x in [*((0, x) for x in range(w)), *((h - 1, x) for x in range(w)),
                 *((y, 0) for y in range(h)), *((y, w - 1) for y in range(h))]:
        if is_bg[y, x] and not outside[y, x]:
            outside[y, x] = True
            q.append((y, x))
    while q:
        y, x = q.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < h and 0 <= nx < w and is_bg[ny, nx] and not outside[ny, nx]:
                outside[ny, nx] = True
                q.append((ny, nx))

    alpha = np.where(outside, 0.0, 255.0).astype(np.float32)
    if feather:
        # Blur, then re-clamp the interior to 255 so only the silhouette softens.
        alpha = np.asarray(
            Image.fromarray(alpha.astype(np.uint8)).filter(
                ImageFilter.GaussianBlur(feather)),
            dtype=np.float32)
        alpha[~outside & (alpha > 140)] = 255.0
        alpha[outside & (alpha < 24)] = 0.0

    # Edge decontamination: the checker colour bled into the semi-transparent
    # rim, so pull those pixels toward the nearest fully-opaque neighbour.
    rgb8 = rgb.astype(np.uint8)
    rim = (alpha > 0) & (alpha < 255)
    if rim.any():
        solid = Image.fromarray(np.where(
            (alpha == 255)[..., None], rgb8, 0).astype(np.uint8))
        spread = np.asarray(solid.filter(ImageFilter.MaxFilter(5)), dtype=np.uint8)
        rgb8 = np.where(rim[..., None], spread, rgb8)

    out = np.dstack([rgb8, alpha.astype(np.uint8)])
    img = Image.fromarray(out, "RGBA").crop(Image.fromarray(out, "RGBA").getbbox())
    img.save(dst)
    print(f"{dst}: {img.size[0]}x{img.size[1]}  "
          f"bg={cols.tolist()}  transparent={100 * outside.mean():.1f}%")


if __name__ == "__main__":
    main()
