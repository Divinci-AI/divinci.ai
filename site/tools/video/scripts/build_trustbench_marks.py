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


M = []
def mark(mid, at, dur, path, hand, colour=GOLD, w=5, why=""):
    M.append({"id": mid, "at": at, "duration": dur, "color": colour,
              "width": w, "opacity": 0.9, "hand": hand, "_beat": why,
              "path": path})


# ── S1 dashboard 0.5-14.0 ────────────────────────────────────────────────
mark("s1-signed", 6.0, 1.6, underline(640, 872, 140), MILES, why="8.3 'a manifest signed with an Ed25519 platform key'")
mark("s1-verify", 10.6, 1.4, circle(944, 128, 74, 20), MAEVE, why="4.8 'TrustBench asks you to check it'")

# ── S1 recent runs 14.0-24.0 ─────────────────────────────────────────────
mark("s1-score", 15.6, 1.3, underline(1263, 1309, 170), MAEVE, why="run scores in the list")
mark("s1-failed", 19.0, 1.6, circle(266, 104, 22, 18), MILES, why="18.5 — the two failed runs")

# ── S1 catalog 24.0-33.5 ─────────────────────────────────────────────────
mark("s1-eleven", 25.5, 1.5, underline(247, 432, 140), MAEVE, why="18.5 'Eleven benchmarks in the catalog'")
mark("s1-card", 29.5, 1.7, circle(363, 246, 108, 22), MILES, why="the grounding card, next up")

# ── S2 grounding 33.5-46.0 ───────────────────────────────────────────────
mark("s2-title", 34.8, 1.6, underline(270, 508, 400), MILES, why="33.5 'This is RAG grounding'")
mark("top-score", 42.4, 1.5, underline(786, 856, 566), MILES, why="40.2 'a top score of one hundred percent'")

# ── S2 ranks 46.0-58.0 ───────────────────────────────────────────────────
mark("s2-ranks", 47.6, 1.8, circle(266, 245, 24, 118), MAEVE, why="48.9 'the median of five most recent runs'")
mark("s2-tie", 52.5, 1.5, underline(793, 840, 220), MAEVE, why="the 90.9% tie")

# ── S2 tail + note 58.0-73.9 ─────────────────────────────────────────────
mark("s2-note", 59.5, 2.0, underline(266, 720, 676), MILES, why="58.1 'scores only compare within a version'")
mark("s2-key", 66.8, 1.6, underline(1150, 1235, 500), MAEVE, why="65.6 'every row carries the key that signed it'")

# ── S3 benchmark detail 73.9-89.0 ────────────────────────────────────────
mark("s3-time", 75.4, 1.3, circle(991, 292, 34, 17), MILES, why="73.9 'about sixty-six seconds'")
mark("s3-cost", 78.2, 1.4, underline(973, 1073, 322), MILES, why="73.9 'and eleven cents'")
mark("s3-run", 82.0, 1.6, circle(397, 511, 88, 22), MILES, why="73.9 'a model id and a button'")

# ── S3 catalog 89.0-102.4 ────────────────────────────────────────────────
mark("s3-owner", 90.5, 1.6, underline(247, 432, 140), MAEVE, why="85.5 'the catalog is identical in every workspace'")
mark("s3-private", 95.0, 1.7, circle(783, 333, 172, 118), MILES, why="93.0 'your runs are the opposite'")

# ── S4 verified card 102.4-146.7 ─────────────────────────────────────────
mark("s4-curl", 109.4, 1.9, underline(192, 1027, 375), MILES, why="108.0 'the manifest is on a public endpoint'")
mark("s4-mit", 117.0, 1.9, underline(290, 661, 324), MAEVE, why="115.6 'MIT licensed, deps ed25519 and zod'")
mark("verified-tick", 136.0, 1.1, tick(452, 383), MAEVE, GREEN, 6, why="134.8 'Verified. Signature valid'")
mark("s4-key", 139.5, 1.4, underline(357, 476, 504), MAEVE, why="134.8 'signed by tbp-prod-002'")
mark("s4-prov", 142.6, 1.4, underline(357, 452, 529), MAEVE, why="134.8 'score provenance measured'")

# ── S4 tampered card 146.7-178.6 ─────────────────────────────────────────
mark("s4-t1", 149.4, 1.2, strike(192, 420, 570), MAEVE, RED, why="148.4 'score one to 0.42 — the signature fails'")
mark("s4-t2", 155.0, 1.0, strike(192, 400, 596), MAEVE, RED, why="154.0 'swap the model id. Fails.'")
mark("s4-t3", 157.4, 1.0, strike(192, 466, 621), MAEVE, RED, why="154.0 'inflate the sample count. Fails.'")
mark("s4-t4", 159.8, 1.0, strike(192, 444, 647), MAEVE, RED, why="154.0 'alter the hash. Fails.'")
mark("s4-all", 166.0, 1.8, circle(566, 604, 82, 62), MILES, why="164.4 'the receipt does not depend on us being honest'")

# ── S5 drill run 178.6-205.2 ─────────────────────────────────────────────
mark("s5-model", 180.2, 1.9, underline(296, 555, 160), MILES, why="178.6 'a model id that does not exist'")
mark("refused-score", 191.2, 1.6, circle(283, 253, 58, 30), MAEVE, why="190.0 'it refused to produce a score at all'")
mark("s5-refusing", 198.2, 2.0, underline(963, 1165, 707), MILES, why="196.8 'refusing to score is the honest outcome'")

# ── S6 boards 205.2-220.3 ────────────────────────────────────────────────
mark("s6-verifier", 206.6, 1.9, underline(409, 667, 185), MAEVE, why="205.2 'offline verification, and a public board'")
mark("s6-annex", 213.8, 1.8, circle(587, 264, 132, 20), MILES, why="212.9 'version two opens up authorship'")

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
