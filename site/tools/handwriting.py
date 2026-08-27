#!/usr/bin/env python3
"""Generate single-stroke SVG handwriting paths for the hero's writing arm.

Hershey `scriptc` is a genuine single-stroke cursive: each glyph is a list of
polylines in pen order, so a dash animation over the result reads as a hand
actually writing -- including the pen-lifts between strokes -- rather than as an
outline being traced or a block of text being wiped in.

Two things happen here that matter to how the result *feels*:

* The raw Hershey polylines are coarse, and at hero size their facets are
  plainly visible as a stiff, angular hand. Each stroke is re-fit with a
  centripetal Catmull-Rom spline and resampled at even arc-length. Centripetal
  (alpha=0.5) rather than uniform because uniform Catmull-Rom throws cusps and
  self-intersections exactly where cursive needs to be smoothest -- the tight
  reversals at the top of an 'l' or the base of a 'u'.

* Curvature is measured per sample and emitted alongside it. The client slows
  the pen through corners and lets it run on the straights, which is most of
  what separates a hand from a plotter.

Emits JSON: {"box": [x0,y0,x1,y1], "words": {word: [stroke, ...]}} where each
stroke is {"p": [x0,y0,x1,y1,...], "k": [curvature, ...]}. The client rebuilds
the path data and cumulative lengths itself and sets `pathLength` to its own
total, so the dash animation and the brush-tip lookup share one measure --
otherwise ink and bristles drift apart by however much the two disagree.
"""
import json
import math
import sys

from HersheyFonts import HersheyFonts

WORDS = ["Security", "Quality Assurance", "Analytics", "Metrics",
         "Compliance", "Alerting", "Connectors", "Humans"]

SIZE = 32          # arbitrary; the SVG viewBox rescales

# Hershey coordinates are y-UP. SVG user space is y-down, so every y is negated
# on the way out. Skipping this does not fail loudly -- it renders each word
# perfectly formed but vertically mirrored, which is easy to mistake for the
# font simply looking odd.
STEP = 0.6         # resample spacing in font units
ALPHA = 0.5        # centripetal


def dedupe(pts):
    out = [pts[0]]
    for p in pts[1:]:
        if math.dist(p, out[-1]) > 1e-6:
            out.append(p)
    return out


def catmull_rom(pts, step=STEP):
    """Resample a polyline along a centripetal Catmull-Rom spline through it."""
    pts = dedupe(pts)
    if len(pts) < 3:
        return pts
    # Duplicate the endpoints so the spline reaches them.
    P = [pts[0]] + pts + [pts[-1]]
    out = []
    for i in range(len(P) - 3):
        p0, p1, p2, p3 = P[i], P[i + 1], P[i + 2], P[i + 3]
        # Knot sequence: t_{j+1} = t_j + |p_{j+1} - p_j|^alpha
        t = [0.0] * 4
        for j in range(3):
            d = math.dist(P[i + j + 1], P[i + j])
            t[j + 1] = t[j] + (d ** ALPHA if d > 0 else 1e-6)
        n = max(2, int(math.dist(p1, p2) / step) + 1)
        for s in range(n):
            tt = t[1] + (t[2] - t[1]) * (s / n)
            a1 = lerp(p0, p1, t[0], t[1], tt)
            a2 = lerp(p1, p2, t[1], t[2], tt)
            a3 = lerp(p2, p3, t[2], t[3], tt)
            b1 = lerp(a1, a2, t[0], t[2], tt)
            b2 = lerp(a2, a3, t[1], t[3], tt)
            out.append(lerp(b1, b2, t[1], t[2], tt))
    out.append(pts[-1])
    return dedupe(out)


def lerp(a, b, ta, tb, t):
    if tb - ta < 1e-9:
        return a
    w = (t - ta) / (tb - ta)
    return (a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w)


def curvature(pts):
    """Menger curvature per point, normalised to 0..1 and smoothed a little."""
    k = [0.0] * len(pts)
    for i in range(1, len(pts) - 1):
        a, b, c = pts[i - 1], pts[i], pts[i + 1]
        ab, bc, ca = math.dist(a, b), math.dist(b, c), math.dist(c, a)
        if ab * bc * ca < 1e-9:
            continue
        # 4*area / (|ab||bc||ca|)
        area = abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2
        k[i] = min(1.0, (4 * area / (ab * bc * ca)) * STEP * 2.2)
    for _ in range(2):   # box blur; raw Menger is noisy on resampled points
        k = [sum(k[max(0, i - 1):i + 2]) / len(k[max(0, i - 1):i + 2])
             for i in range(len(k))]
    return k


def word_strokes(font, word):
    out = []
    for raw in font.strokes_for_text(word):
        pts = dedupe([(x, -y) for x, y in raw])
        if len(pts) < 2:
            continue
        sm = catmull_rom(pts)
        out.append({
            "p": [round(c, 2) for p in sm for c in p],
            "k": [round(v, 3) for v in curvature(sm)],
        })
    return out


def font_metrics(font):
    """The writing baseline and x-height, in the same units as the words.

    The word bounding box does NOT give this: its lower edge is the DESCENDER
    line, set by whichever word has a 'y' or 'Q'. Riding the brush on that puts
    it a full descender below the letters. Measure instead from glyphs that have
    neither ascender nor descender, whose bottom IS the baseline.
    """
    ys = [-y for _, y in
          (pt for stroke in font.strokes_for_text("nomex") for pt in stroke)]
    return {"baseline": round(max(ys), 3),
            "xheight": round(max(ys) - min(ys), 3)}


def main():
    font = HersheyFonts()
    font.load_default_font("scriptc")
    font.normalize_rendering(SIZE)

    words, xs, ys = {}, [], []
    for w in WORDS:
        strokes = word_strokes(font, w)
        words[w] = strokes
        xs += [c for s in strokes for c in s["p"][0::2]]
        ys += [c for s in strokes for c in s["p"][1::2]]
        n = sum(len(s["p"]) // 2 for s in strokes)
        print(f"{w:20s} strokes={len(strokes):3d} points={n:5d}", file=sys.stderr)

    met = font_metrics(font)
    print(f"\nbaseline={met['baseline']}  x-height={met['xheight']}  "
          f"(box lower edge = {max(ys)}, the descender line)", file=sys.stderr)
    out = {"box": [min(xs), min(ys), max(xs), max(ys)],
           "baseline": met["baseline"], "xheight": met["xheight"], "words": words}
    text = json.dumps(out, separators=(",", ":"))
    dst = sys.argv[1] if len(sys.argv) > 1 else "-"
    if dst == "-":
        print(text)
    else:
        open(dst, "w").write(text)
        print(f"\nwrote {dst} ({len(text)/1024:.1f} KB)", file=sys.stderr)


if __name__ == "__main__":
    main()
