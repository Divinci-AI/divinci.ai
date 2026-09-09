#!/usr/bin/env python3
"""Emit trustbench.marks.json — a mark for (nearly) every narration line.

    python3 tools/video/scripts/build_trustbench_marks.py

Coordinates below are measured on the 1568x767 CAPTURES. PAD is added here, so
a target can be read straight off a screenshot without mental arithmetic.

Each mark names the line it belongs to and the shot it lands on. The shot
windows are what keep it honest: a mark drawn outside its frame's window
annotates whatever happens to be on screen, which is how the first pass put an
underline beside Red Team Core's 2.7% while Miles talked about grounding.
"""
import json
from pathlib import Path

PAD = (882 - 767) // 2          # captures are padded onto a 16:9 canvas
GOLD, GREEN, RED = "#e8c07a", "#5ddc9a", "#ff8f8f"
MILES, MAEVE = "leonardo-arm-ii", "leonardo-brush"


def underline(x0, x1, y, bow=5):
    """A swept underline with a slight bow, like a drawn stroke."""
    y += PAD
    return [{"from": [x0, y], "c1": [x0 + (x1 - x0) * 0.3, y + bow],
             "c2": [x0 + (x1 - x0) * 0.7, y + bow], "to": [x1, y - 1]}]


def strike(x0, x1, y):
    return underline(x0, x1, y, bow=0)


def circle(cx, cy, rx, ry):
    """Four cubics, opened slightly so it reads as drawn rather than stamped."""
    cy += PAD
    k = 0.5523
    return [
        {"from": [cx - rx, cy], "c1": [cx - rx, cy - ry * k],
         "c2": [cx - rx * k, cy - ry], "to": [cx, cy - ry]},
        {"from": [cx, cy - ry], "c1": [cx + rx * k, cy - ry],
         "c2": [cx + rx, cy - ry * k], "to": [cx + rx, cy]},
        {"from": [cx + rx, cy], "c1": [cx + rx, cy + ry * k],
         "c2": [cx + rx * k, cy + ry], "to": [cx, cy + ry]},
        {"from": [cx, cy + ry], "c1": [cx - rx * k, cy + ry],
         "c2": [cx - rx, cy + ry * k], "to": [cx - rx * 0.97, cy - ry * 0.18]},
    ]


def tick(x, y, s=1.0):
    y += PAD
    return [
        {"from": [x, y], "c1": [x + 6 * s, y + 7 * s],
         "c2": [x + 12 * s, y + 13 * s], "to": [x + 18 * s, y + 18 * s]},
        {"from": [x + 18 * s, y + 18 * s], "c1": [x + 30 * s, y + 7 * s],
         "c2": [x + 42 * s, y - 9 * s], "to": [x + 54 * s, y - 22 * s]},
    ]


# ── who is speaking, read from the narration ─────────────────────────────
# The hand must not be assigned by hand. On the first dense pass a mark was
# cued at 6.0s for a line at 8.3s, so Miles's hand arrived 3 seconds early and
# drew while MAEVE was still speaking. Deriving the hand from the line — and
# refusing to place a mark outside that speaker's turn — makes that impossible
# rather than something to notice in playback.
import re

_src = Path("tools/video/scripts/trustbench.mjs").read_text()
LINES = [(float(a), v) for a, v in
         re.findall(r"\{ at: ([0-9.]+), voice: (MILES|MAEVE),", _src)]
LINES.sort()
VOICE_HAND = {"MILES": MILES, "MAEVE": MAEVE}
LEAD_IN = 0.9   # must match hands.py


def turn(line_at):
    """The speaker and the window they hold, for the line starting at line_at."""
    for i, (a, v) in enumerate(LINES):
        if abs(a - line_at) < 0.05:
            end = LINES[i + 1][0] if i + 1 < len(LINES) else 220.3
            return v, a, end
    raise SystemExit(f"no narration line at {line_at}s — check trustbench.mjs")


M = []
def mark(mid, line_at, dur, path, colour=GOLD, w=5, why=""):
    """Place a mark inside the turn of whoever speaks `line_at`.

    `at` is derived, not given: the hand enters 0.3s after the line starts, so
    it arrives while that voice is talking rather than over the previous one.
    """
    voice, start, end = turn(line_at)
    at = round(start + LEAD_IN + 0.3, 2)
    if at + dur > end:
        raise SystemExit(
            f"{mid}: needs {at + dur:.1f}s but {voice}'s turn ends at {end:.1f}s "
            f"— shorten it or move it to the next line")
    M.append({"id": mid, "at": at, "duration": dur, "color": colour,
              "width": w, "opacity": 0.9, "hand": VOICE_HAND[voice],
              "_beat": f"{line_at}s {voice} — {why}", "path": path})


# ── S1 dashboard 0.5-14.0 ────────────────────────────────────────────────
mark("s1-signed", 8.3, 2.4, underline(640, 872, 140), why="a manifest signed with an Ed25519 platform key")
mark("s1-verify", 4.8, 1.6, circle(944, 128, 74, 20), why="TrustBench asks you to check it")

# ── S1 recent runs 14.0-24.0 ─────────────────────────────────────────────
mark("s1-score", 18.5, 1.4, underline(1263, 1309, 170), why="the catalog line, over the run list")

# ── S1 catalog 24.0-33.5 ─────────────────────────────────────────────────

# ── S2 grounding 33.5-46.0 ───────────────────────────────────────────────
mark("s2-title", 33.5, 2.2, underline(270, 508, 400), why="This is RAG grounding")
mark("top-score", 40.2, 2.0, underline(786, 856, 566), why="a top score of one hundred percent")

# ── S2 ranks 46.0-58.0 ───────────────────────────────────────────────────
mark("s2-ranks", 48.9, 2.4, circle(266, 245, 24, 118), why="the median of five most recent runs")

# ── S2 tail + note 58.0-73.9 ─────────────────────────────────────────────
mark("s2-note", 58.1, 2.6, underline(266, 720, 676), why="scores only compare within a version")
mark("s2-key", 65.6, 2.4, underline(1150, 1235, 500), why="every row carries the key that signed it")

# ── S3 benchmark detail 73.9-89.0 ────────────────────────────────────────
mark("s3-time", 73.9, 1.6, circle(991, 292, 34, 17), why="about sixty-six seconds")

# ── S3 catalog 89.0-102.4 ────────────────────────────────────────────────
mark("s3-owner", 85.5, 2.4, underline(247, 432, 140), why="the catalog is identical in every workspace")
mark("s3-private", 93.0, 2.6, circle(783, 333, 172, 118), why="your runs are the opposite")

# ── S4 verified card 102.4-146.7 ─────────────────────────────────────────
mark("s4-curl", 108.0, 2.6, underline(192, 1027, 375), why="the manifest is on a public endpoint")
mark("s4-mit", 115.6, 3.0, underline(290, 661, 324), why="MIT licensed, deps ed25519 and zod")
mark("verified-tick", 134.8, 1.4, tick(452, 383), GREEN, 6, why="Verified. Signature valid")

# ── S4 tampered card 146.7-178.6 ─────────────────────────────────────────
mark("s4-t1", 148.4, 1.6, strike(192, 420, 570), RED, why="score one to 0.42 — the signature fails")
mark("s4-t2", 154.0, 1.4, strike(192, 400, 596), RED, why="swap the model id. Fails.")
mark("s4-all", 164.4, 2.6, circle(566, 604, 82, 62), why="the receipt does not depend on us being honest")

# ── S5 drill run 178.6-205.2 ─────────────────────────────────────────────
mark("s5-model", 178.6, 3.0, underline(296, 555, 160), why="a model id that does not exist")
mark("refused-score", 190.0, 2.2, circle(283, 253, 58, 30), why="it refused to produce a score at all")
mark("s5-refusing", 196.8, 3.0, underline(963, 1165, 707), why="refusing to score is the honest outcome")

# ── S6 boards 205.2-220.3 ────────────────────────────────────────────────
mark("s6-verifier", 205.2, 3.0, underline(409, 667, 185), why="offline verification, and a public board")
mark("s6-annex", 212.9, 3.0, circle(587, 264, 132, 20), why="version two opens up authorship")

out = {"width": 1568, "height": 882, "fps": 30,
       "_note": "Generated by build_trustbench_marks.py. Coordinates there are "
                "in CAPTURE space (1568x767); the builder adds the 57px pad.",
       "_hands": f"{MILES} is Miles (enters from the left), {MAEVE} is Maeve (from the right).",
       "marks": M}
p = Path("tools/video/scripts/trustbench.marks.json")
p.write_text(json.dumps(out, indent=1))
print(f"wrote {p} — {len(M)} marks")
tot = sum(m["duration"] for m in M)
print(f"drawing for {tot:.1f}s of 220.3s ({tot/220.3*100:.0f}% of the runtime), "
      f"plus 1.6s of hand travel around each")
