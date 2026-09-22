#!/usr/bin/env python3
"""
Generate the TrustBench mark family from ONE robot body.

The Divinci robot already carries a heart. TrustBench is what happens when that
heart has to prove something, so the family is the same robot with the heart
swapped for a crest — one crest per kind of benchmark, never a different robot.

Everything is `currentColor`, so a mark inherits whatever the surrounding text
is. That is the whole reason these are hand-built rather than exported: the
existing divinci_logo.svg is a 13 KB traced path with a baked #10152b
background, which cannot sit on cream and on midnight without two copies — the
exact defect the leaderboard hero was just fixed for.

Run:  python3 _build-marks.py
"""

ROBOT = '''  <g id="head">
    <path d="M70,40 h60 v30 q0,10 -10,10 h-40 q-10,0 -10,-10 z"/>
    <g id="antennas">
      <circle cx="85" cy="25" r="7"/><rect x="83" y="25" width="4" height="15"/>
      <circle cx="115" cy="25" r="7"/><rect x="113" y="25" width="4" height="15"/>
    </g>
    <circle cx="85" cy="60" r="6" fill="var(--tb-mark-eye, #0a192f)"/>
    <circle cx="115" cy="60" r="6" fill="var(--tb-mark-eye, #0a192f)"/>
  </g>
  <g id="arms">
    <rect x="55" y="100" width="10" height="30"/><circle cx="60" cy="140" r="5"/>
    <path d="M55,130 h10 v15 q0,5 -5,5 q-5,0 -5,-5 z"/>
    <rect x="135" y="100" width="10" height="30"/><circle cx="140" cy="140" r="5"/>
    <path d="M135,130 h10 v15 q0,5 -5,5 q-5,0 -5,-5 z"/>
  </g>'''

# The original heart, kept verbatim so the family is recognisably the same robot.
HEART = "M100,115 c-12,-12 -25,-8 -25,7 c0,12 12,20 25,30 c13,-10 25,-18 25,-30 c0,-15 -13,-19 -25,-7 z"

# A heart with a heraldic waist: the top keeps the heart's cleft and shoulders,
# the sides straighten, the bottom comes to a shield's point. Read as a heart
# at 24px and as a shield at 200px, which is what "protected" should look like.
SHIELD_HEART = ("M100,113 c-9,-11 -25,-7 -25,7 v13 c0,14 11,23 25,31 "
                "c14,-8 25,-17 25,-31 v-13 c0,-14 -16,-18 -25,-7 z")

MARKS = {
  "trustbench": {
    "title": "Divinci TrustBench",
    "desc": "The Divinci robot, its heart bearing a verification check.",
    "outer": HEART,
    # Subtracted with evenodd, so the check is the background showing through
    # and the mark stays a single colour at any size.
    "cut": "M90,127 l7,7 l13,-14 l5,5 l-18,19 l-12,-12 z",
  },
  "redteam": {
    "title": "Divinci TrustBench — Red Team",
    "desc": "The robot's heart drawn as a shield: adversarial robustness.",
    "outer": SHIELD_HEART,
    "cut": "M100,122 l16,7 v11 c0,9 -7,15 -16,19 c-9,-4 -16,-10 -16,-19 v-11 z",
  },
  "extraction": {
    "title": "Divinci TrustBench — System-Prompt Extraction",
    "desc": "The robot's heart as a shield with a keyhole: what must stay secret.",
    "outer": SHIELD_HEART,
    "cut": "M100,126 a7,7 0 0 1 4,12.6 L106,152 h-12 l2,-13.4 A7,7 0 0 1 100,126 z",
  },
  "grounding": {
    "title": "Divinci TrustBench — RAG Grounding",
    "desc": "The robot's heart bearing an anchor: answers held to their passages.",
    "outer": HEART,
    # Three passage bars, not an anchor. The anchor was unreadable below 96px
    # and the bars say the same thing better: an answer held to its passages.
    "cut": ("M89,121 h22 v5 h-22 z M89,130 h22 v5 h-22 z M93,139 h14 v5 h-14 z"),
  },
  "retrieval": {
    "title": "Divinci TrustBench — Retrieval QA",
    "desc": "The robot's heart bearing a lens: which stack found the passage.",
    "outer": HEART,
    "cut": ("M98,121 a9,9 0 1 1 0,18 a9,9 0 1 1 0,-18 z "
            "M98,126.5 a3.5,3.5 0 1 0 0,7 a3.5,3.5 0 1 0 0,-7 z "
            "M104,135 l8,8 l-3.5,3.5 l-8,-8 z"),
  },
  "erasure": {
    "title": "Divinci TrustBench — Corpus Integrity",
    "desc": "The robot's heart as a struck seal: what the corpus no longer says.",
    "outer": HEART,
    # A seal ring with a strike through it: the corpus was sealed, and this
    # part of it no longer says what it said.
    "cut": ("M100,121 a10,10 0 1 1 0,20 a10,10 0 1 1 0,-20 z "
            "M100,126 a5,5 0 1 0 0,10 a5,5 0 1 0 0,-10 z "
            "M91,140 l18,-18 l3.5,3.5 l-18,18 z"),
  },
}

TEMPLATE = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 175" width="200" height="175" fill="currentColor" role="img" aria-labelledby="{slug}-t {slug}-d">
  <title id="{slug}-t">{title}</title>
  <desc id="{slug}-d">{desc}</desc>
  <!--
    INLINE THIS FILE. `currentColor` inherits from the surrounding text only
    when the SVG is part of the host document; through <img> or
    background-image it is its own document and inherits nothing. That is why
    the mark first rendered dark-on-dark on the contact sheet's midnight strip.

    `svg:root` matches only when this IS the root element, so the rule below
    sets a sane standalone default and is inert once inlined.

    A `prefers-color-scheme` branch was tried here and REMOVED. It made a file
    opened on a dark-mode machine render light — including inside an <img> on a
    CREAM page, where it vanished. A mark whose colour depends on the viewer's
    OS rather than on the surface it sits on is not more theme-aware, it is
    less predictable. Inline it and set `color` on the container.
  -->
  <style>svg:root {{ color: #1e3a2b; }}</style>
{robot}
  <path id="crest" fill-rule="evenodd" d="{outer} {cut}"/>
</svg>
'''

for slug, m in MARKS.items():
    name = f"trustbench-mark-{slug}.svg" if slug != "trustbench" else "trustbench-mark.svg"
    with open(name, "w") as fh:
        fh.write(TEMPLATE.format(slug=slug, robot=ROBOT, **m))
    print("wrote", name)
