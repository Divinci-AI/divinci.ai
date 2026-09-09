#!/usr/bin/env python3
"""Single-stroke glyphs and small illustrations for the annotating hands.

Everything here is POLYLINES in pen order — the order a hand would actually
draw them — so revealing them progressively reads as writing, and the tip the
hand follows is just the point the reveal has reached.

Why not Hershey: tools/handwriting.py already does proper single-stroke cursive
via the HersheyFonts package, and static/data/handwriting.json is its output.
But that file holds eight fixed words (Security, Compliance, …), none of which
this script says, and HersheyFonts has no distribution for the Python here. A
compact alphabet is a few dozen lines and covers the short words a demo needs.

Coordinates are in a 1x1 em box, y-down, origin top-left. `word()` scales and
places them. Uppercase and digits only — that is what these marks use, and a
cursive lowercase is exactly the thing Hershey does better than a hand-rolled
table would.
"""
from __future__ import annotations

# Each glyph: list of strokes; each stroke: list of (x, y) in the em box.
G: dict[str, list[list[tuple[float, float]]]] = {
    "A": [[(0, 1), (.5, 0), (1, 1)], [(.2, .62), (.8, .62)]],
    "B": [[(0, 0), (0, 1)], [(0, 0), (.7, .1), (.7, .4), (0, .5)],
          [(0, .5), (.8, .6), (.8, .9), (0, 1)]],
    "C": [[(1, .18), (.5, 0), (0, .35), (0, .68), (.5, 1), (1, .84)]],
    "D": [[(0, 0), (0, 1)], [(0, 0), (.75, .2), (.75, .8), (0, 1)]],
    "E": [[(1, 0), (0, 0), (0, 1), (1, 1)], [(0, .5), (.7, .5)]],
    "F": [[(1, 0), (0, 0), (0, 1)], [(0, .5), (.7, .5)]],
    "G": [[(1, .18), (.5, 0), (0, .35), (0, .68), (.5, 1), (1, .8), (1, .55), (.55, .55)]],
    "H": [[(0, 0), (0, 1)], [(1, 0), (1, 1)], [(0, .5), (1, .5)]],
    "I": [[(.5, 0), (.5, 1)]],
    "K": [[(0, 0), (0, 1)], [(.9, 0), (0, .55)], [(.25, .42), (.95, 1)]],
    "L": [[(0, 0), (0, 1), (.9, 1)]],
    "M": [[(0, 1), (0, 0), (.5, .6), (1, 0), (1, 1)]],
    "N": [[(0, 1), (0, 0), (1, 1), (1, 0)]],
    "O": [[(.5, 0), (0, .3), (0, .7), (.5, 1), (1, .7), (1, .3), (.5, 0)]],
    "P": [[(0, 1), (0, 0), (.8, .12), (.8, .42), (0, .55)]],
    "R": [[(0, 1), (0, 0), (.8, .12), (.8, .42), (0, .55)], [(.35, .55), (.95, 1)]],
    "S": [[(1, .15), (.45, 0), (0, .2), (.15, .45), (.85, .55), (1, .8), (.5, 1), (0, .85)]],
    "T": [[(0, 0), (1, 0)], [(.5, 0), (.5, 1)]],
    "U": [[(0, 0), (0, .7), (.5, 1), (1, .7), (1, 0)]],
    "V": [[(0, 0), (.5, 1), (1, 0)]],
    "W": [[(0, 0), (.22, 1), (.5, .35), (.78, 1), (1, 0)]],
    "X": [[(0, 0), (1, 1)], [(1, 0), (0, 1)]],
    "Y": [[(0, 0), (.5, .55), (1, 0)], [(.5, .55), (.5, 1)]],
    "Z": [[(0, 0), (1, 0), (0, 1), (1, 1)]],
    "0": [[(.5, 0), (0, .3), (0, .7), (.5, 1), (1, .7), (1, .3), (.5, 0)]],
    "1": [[(.2, .18), (.5, 0), (.5, 1)]],
    "2": [[(0, .2), (.5, 0), (1, .25), (0, 1), (1, 1)]],
    "3": [[(0, .1), (.6, 0), (.85, .3), (.4, .5)], [(.4, .5), (.95, .65), (.7, 1), (0, .9)]],
    "4": [[(.75, 1), (.75, 0), (0, .7), (1, .7)]],
    "5": [[(1, 0), (.15, 0), (0, .45), (.6, .38), (.95, .65), (.6, 1), (0, .9)]],
    "!": [[(.5, 0), (.5, .68)], [(.5, .88), (.5, 1)]],
    "?": [[(0, .2), (.5, 0), (1, .25), (.5, .55), (.5, .68)], [(.5, .88), (.5, 1)]],
    "-": [[(0, .5), (1, .5)]],
    " ": [],
}


def word(text: str, x: float, y: float, size: float, gap: float = 0.22,
         slant: float = 0.10) -> list[list[list[float]]]:
    """Lay `text` out as pen-ordered strokes, top-left at (x, y).

    `slant` shears the glyphs to the right, which is most of what separates
    "written" from "typeset" at this scale — the letters are drawn on a slope
    the way a hand holds a page.
    """
    out, pen = [], x
    for ch in text.upper():
        glyph = G.get(ch)
        if glyph is None:
            raise KeyError(f"no glyph for {ch!r} — add it to strokes.G")
        for st in glyph:
            out.append([[pen + (px + (1 - py) * slant) * size, y + py * size]
                        for px, py in st])
        pen += size * (1 + gap) if ch != " " else size * 0.6
    return out


# ── small illustrations, drawn in pen order ──────────────────────────────
def key(x, y, s):
    """A key: bow, then shaft, then two teeth. Reads as 'the key that signed it'."""
    r = s * 0.26
    bow = [[x + r + r * c, y + r + r * d] for c, d in
           [(-1, 0), (-.7, -.7), (0, -1), (.7, -.7), (1, 0), (.7, .7), (0, 1), (-.7, .7), (-1, 0)]]
    shaft = [[x + 2 * r, y + r], [x + s, y + r]]
    t1 = [[x + s * 0.74, y + r], [x + s * 0.74, y + r + s * 0.16]]
    t2 = [[x + s * 0.90, y + r], [x + s * 0.90, y + r + s * 0.22]]
    return [bow, shaft, t1, t2]


def seal(x, y, s):
    """A wax-seal rosette: a ring, then rays. For 'signed' / 'attested'."""
    import math
    r = s / 2
    cx, cy = x + r, y + r
    ring = [[cx + r * math.cos(a * math.pi / 180), cy + r * math.sin(a * math.pi / 180)]
            for a in range(0, 361, 15)]
    rays = [[[cx + r * 0.45 * math.cos(a * math.pi / 180),
              cy + r * 0.45 * math.sin(a * math.pi / 180)],
             [cx + r * 0.92 * math.cos(a * math.pi / 180),
              cy + r * 0.92 * math.sin(a * math.pi / 180)]]
            for a in range(0, 360, 45)]
    return [ring] + rays


def lock(x, y, s):
    """A padlock: shackle first, then the body. For 'private by default'."""
    w, h = s * 0.62, s * 0.46
    bx = x + (s - w) / 2
    by = y + s - h
    shackle = [[bx + w * .5 + (w * .3) * c, by - (h * .55) * d] for c, d in
               [(-1, 0), (-.9, .55), (-.5, .95), (0, 1.05), (.5, .95), (.9, .55), (1, 0)]]
    body = [[bx, by], [bx + w, by], [bx + w, by + h], [bx, by + h], [bx, by]]
    return [shackle, body]
