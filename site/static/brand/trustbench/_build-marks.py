#!/usr/bin/env python3
"""
The TrustBench crest family — six emblems, one construction.

Rev 2 drops the robot. The robot made every mark 70% chrome and 30% signal, so
the thing that distinguishes a board — the check, the shield, the keyhole — was
a detail rather than the subject. Each crest now fills its own frame and is
built to stand alone as a logo.

What keeps the family together is not the robot but the CONSTRUCTION, which is
identical in all six:

  1. a crest silhouette (heart, or the heraldic waist for the security marks)
  2. an engraved inner contour, offset inside the edge
  3. one symbol, cut straight out of the plate so the mark is a single colour

Everything is `currentColor`. See README for why that means INLINE ME.

Run:  python3 _build-marks.py
"""

# ── The two plates ────────────────────────────────────────────────────────
# Written as explicit cubics rather than scaled from the robot's heart: the
# first rev scaled it and the bounds were wrong, so every symbol ran off the
# bottom of the plate. With fill-rule="evenodd" a cut OUTSIDE the plate is not
# a cut at all — it is drawn — so the overflow appeared as spurs welded to the
# silhouette. Geometry first, symbols sized to fit inside it.
#
#   HEART   x 14..106   y 14..102, tip at (60,102)
#   SHIELD  x 14..106   y  8..106, tip at (60,106)
#
# Half-widths narrow fast below y=70, which is the constraint every cut below
# is checked against.
HEART = ("M60,102 C20,72 14,46 14,38 C14,22 26,14 38,14 C48,14 56,20 60,28 "
         "C64,20 72,14 82,14 C94,14 106,22 106,38 C106,46 100,72 60,102 Z")
HEART_IN = ("M60,92 C28,68 24,47 24,40 C24,27 34,21 43,21 C51,21 57,26 60,32 "
            "C63,26 69,21 77,21 C86,21 96,27 96,40 C96,47 92,68 60,92 Z")

SHIELD = ("M60,14 C46,4 14,10 14,34 V58 C14,82 34,92 60,106 "
          "C86,92 106,82 106,58 V34 C106,10 74,4 60,14 Z")
SHIELD_IN = ("M60,24 C49,16 24,21 24,39 V57 C24,76 40,84 60,95 "
             "C80,84 96,76 96,57 V39 C96,21 71,16 60,24 Z")

MARKS = {
  "trustbench": dict(
    title="Divinci TrustBench",
    desc="A heart-shaped crest bearing a verification check.",
    plate=HEART, inner=HEART_IN,
    cut="M40,52 l12,12 l24,-26 l9,9 l-33,35 l-21,-21 z"),

  "redteam": dict(
    title="Divinci TrustBench — Red Team",
    desc="A shield-shaped crest bearing a smaller shield: adversarial robustness.",
    plate=SHIELD, inner=SHIELD_IN,
    cut="M60,38 l24,10 v18 c0,14 -11,24 -24,30 c-13,-6 -24,-16 -24,-30 v-18 z"),

  "extraction": dict(
    title="Divinci TrustBench — System-Prompt Extraction",
    desc="A shield-shaped crest bearing a keyhole: what must stay secret.",
    plate=SHIELD, inner=SHIELD_IN,
    cut="M60,39 a13,13 0 0 1 7,24 L70,86 h-20 l3,-23 A13,13 0 0 1 60,39 z"),

  "grounding": dict(
    title="Divinci TrustBench — RAG Grounding",
    desc="A heart-shaped crest bearing three passage bars: answers held to their sources.",
    plate=HEART, inner=HEART_IN,
    # The third bar is short because the heart has narrowed to ~x44..76 by y=80.
    cut="M30,34 h60 v10 h-60 z M30,52 h60 v10 h-60 z M48,70 h24 v10 h-24 z"),

  "retrieval": dict(
    title="Divinci TrustBench — Retrieval QA",
    desc="A heart-shaped crest bearing a lens: which stack found the passage.",
    plate=HEART, inner=HEART_IN,
    cut=("M54,31 a19,19 0 1 1 0,38 a19,19 0 1 1 0,-38 z "
         "M54,42 a8,8 0 1 0 0,16 a8,8 0 1 0 0,-16 z "
         "M66,62 l11,11 l-6,6 l-11,-11 z")),

  "erasure": dict(
    title="Divinci TrustBench — Corpus Integrity",
    desc="A heart-shaped crest bearing a struck seal: what the corpus no longer says.",
    plate=HEART, inner=HEART_IN,
    cut=("M60,29 a21,21 0 1 1 0,42 a21,21 0 1 1 0,-42 z "
         "M60,40 a10,10 0 1 0 0,20 a10,10 0 1 0 0,-20 z "
         "M42,72 l36,-36 l8,8 l-36,36 z")),
}

TEMPLATE = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" fill="currentColor" role="img" aria-labelledby="{slug}-t {slug}-d">
  <title id="{slug}-t">{title}</title>
  <desc id="{slug}-d">{desc}</desc>
  <!--
    INLINE THIS FILE. currentColor inherits only when the SVG is part of the
    host document; through <img> it is its own document and inherits nothing.
    `svg:root` matches only when this IS the root element, so the default below
    is inert once inlined.
  -->
  <style>svg:root {{ color: #1e3a2b; }}</style>
  <defs>
    <!--
      A MASK, not fill-rule="evenodd".

      With evenodd, a symbol that strays outside the plate is not subtracted —
      it is DRAWN, welded to the silhouette as a spur. Two revs were spent
      hand-checking cut extents against plate half-widths and both shipped
      overflow anyway, because the check is arithmetic done by eye on a curve.

      A mask cannot do that. The plate is the white region; the symbol is black;
      anything outside the plate is simply not painted, whatever the symbol's
      geometry says. Overflow stops being a thing to verify and becomes a thing
      that cannot happen.
    -->
    <!--
      No explicit mask region. An explicit `maskUnits="userSpaceOnUse"
      x/y/width/height` in viewBox units renders correctly at the SVG's natural
      size and CLIPS when the element is scaled down — at 44px only the
      top-left ~36% of the plate survived, which looked like a broken path
      rather than a broken mask. The default region (objectBoundingBox,
      -10%..120%) covers the object at any size and needs no arithmetic.
    -->
    <mask id="{slug}-m">
      <path d="{plate}" fill="#fff"/>
      <path d="{cut}" fill="#000"/>
    </mask>
  </defs>

  <path d="{plate}" mask="url(#{slug}-m)"/>
  <!-- engraved contour: what makes it read as a struck emblem, not a glyph -->
  <path d="{inner}" fill="none" stroke="currentColor" stroke-width="2.2" opacity="0.42"/>
</svg>
'''

for slug, m in MARKS.items():
    name = "trustbench-mark.svg" if slug == "trustbench" else f"trustbench-mark-{slug}.svg"
    with open(name, "w") as fh:
        fh.write(TEMPLATE.format(slug=slug, **m))
    print("wrote", name)

# ---------------------------------------------------------------------------
# The sprite, from the same MARKS, so it cannot drift from the files above.
#
# It used to be assembled by hand, and two defects rode along unnoticed —
# both invisible at 20px, both obvious at the 86px page hero:
#
#   1. `fill` lived on the standalone files' ROOT <svg>. A <symbol> does not
#      inherit from the sprite's root, so the plate fell back to the SVG
#      default: black, not the brand colour. Measuring the crest's colour read
#      the <svg> element's `color`, which was right, so the check passed while
#      the paint was wrong. The fill now sits on the <symbol> itself.
#   2. The sprite root was `display:none`. Chrome and Firefox do not apply a
#      <mask> defined inside a display:none subtree, so every crest rendered
#      as a bare plate — no check, no shield, no symbol at all. It is now
#      rendered-but-invisible: zero size, absolutely positioned, clipped.
#
# Mask ids carry a `tb-` prefix so a page that inlines a standalone file too
# does not resolve two masks to one id.
SPRITE_SYMBOL = '''  <symbol id="tb-{slug}" viewBox="0 0 120 120" fill="currentColor"><title>{title}</title>
    <defs>
      <mask id="tb-{slug}-m">
        <path d="{plate}" fill="#fff"/>
        <path d="{cut}" fill="#000"/>
      </mask>
    </defs>
    <path d="{plate}" mask="url(#tb-{slug}-m)"/>
    <path d="{inner}" fill="none" stroke="currentColor" stroke-width="2.2" opacity="0.42"/>
  </symbol>
'''
with open("trustbench-marks-sprite.svg", "w") as fh:
    fh.write('<svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" '
             'width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden">\n')
    for slug, m in MARKS.items():
        fh.write(SPRITE_SYMBOL.format(slug=slug, **m))
    fh.write('</svg>\n')
print("wrote trustbench-marks-sprite.svg")
