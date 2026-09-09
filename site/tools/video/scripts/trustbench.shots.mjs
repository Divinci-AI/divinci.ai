/**
 * TrustBench demo — shot list.
 *
 * Every `at` is a MEASURED line start from the rendered narration (see
 * trustbench.mjs, whose anchors are re-locked from the mix whenever the copy
 * changes), so a shot lands on the sentence that describes it rather than on a
 * cue somebody nudged into place.
 *
 * Frames are viewport captures of production on 2026-09-08, taken through the
 * browser extension so nothing outside the tab can be recorded. Three captures
 * from that session are deliberately NOT used, and are kept in
 * build/video/frames as evidence of what was checked:
 *
 *   03  "Error loading benchmark" — the slug bug this shoot found. Fixed and
 *       deployed since; 08 is the same URL working.
 *   06  unified search on "grounding" — no TrustBench sections.
 *   07  unified search on a model id — no results at all.
 */
export default {
  audio: 'build/video/trustbench-narrated.mp4',
  out: 'build/video/trustbench-demo.mp4',
  crossfade: 0.6,
  background: '#151b2b', // the dashboard's own ground, so the pad is invisible

  shots: [
    // ── Scene 1 — what it is ─────────────────────────────────────────────
    { at: 0.5,   scene: 'S1 dashboard',    frame: 'build/video/frames/00.jpg' },
    { at: 14.0,  scene: 'S1 recent runs',  frame: 'build/video/frames/01.jpg' },
    { at: 24.0,  scene: 'S1 catalog',      frame: 'build/video/frames/09.jpg' },

    // ── Scene 2 — a real board ───────────────────────────────────────────
    // The grounding board is up from the line that NAMES it (33.5s, "This is
    // RAG grounding"), not four seconds later. The old cut held "all boards"
    // until 44.0s, so Miles said "a top score of one hundred percent" over a
    // different board — and the mark drawn on his line landed next to Red Team
    // Core's 2.7%. The annotation is what exposed it: a mark has to be ON the
    // thing being described, so it cannot tolerate a shot being loosely timed.
    // "All boards" now appears only in the close, where it is a summary.
    { at: 33.5,  scene: 'S2 grounding',    frame: 'build/video/frames/11.jpg' },
    { at: 46.0,  scene: 'S2 ranks 2-11',   frame: 'build/video/frames/12.jpg' },
    { at: 58.0,  scene: 'S2 tail + note',  frame: 'build/video/frames/14.jpg' },

    // ── Scene 3 — running one ────────────────────────────────────────────
    // 08 carries "Run on your model", the grade, the ~66s and the ~$0.11.
    { at: 73.9,  scene: 'S3 run on model', frame: 'build/video/frames/08.jpg' },
    // 85.5, not 89.0: Maeve's line about the catalog starts at 85.5, and the
    // mark drawn on it was landing on the benchmark-detail frame that was still
    // up. The shot has to cover the line that describes it.
    { at: 85.5,  scene: 'S3 catalog',      frame: 'build/video/frames/09.jpg' },

    // ── Scene 4 — the receipt, checked from outside ──────────────────────
    // Split rather than one 76s hold. 20 is the same card with the tamper
    // block not yet run, so the failures ARRIVE on Miles's "now change
    // something" (146.7s) instead of sitting on screen for 44 seconds
    // spoiling their own reveal. Same geometry in both, so the crossfade
    // resolves in place rather than jumping.
    { at: 102.4, scene: 'S4 verified',     frame: 'build/video/frames/20.jpg' },
    { at: 146.7, scene: 'S4 tampered',     frame: 'build/video/frames/19.jpg' },

    // ── Scene 5 — attested failure ───────────────────────────────────────
    { at: 178.6, scene: 'S5 drill run',    frame: 'build/video/frames/16.jpg' },

    // ── Scene 6 — close ──────────────────────────────────────────────────
    { at: 205.2, scene: 'S6 boards',       frame: 'build/video/frames/10.jpg' },
  ],
}
