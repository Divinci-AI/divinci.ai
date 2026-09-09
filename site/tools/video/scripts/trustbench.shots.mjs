/**
 * TrustBench demo — shot list.
 *
 * Every `at` is a MEASURED line start from the rendered narration (see
 * trustbench.mjs, whose anchors are re-locked from the mix each time it
 * changes), so a shot lands on the sentence that describes it rather than on a
 * cue somebody nudged into place.
 *
 * Frames are viewport captures of production on 2026-09-08, taken through the
 * browser extension so nothing outside the tab can be recorded. Three captures
 * from that session are deliberately NOT used:
 *
 *   03  "Error loading benchmark" — the slug bug this shoot found. Fixed and
 *       deployed since; 08 is the same URL working.
 *   06  unified search on "grounding" — no TrustBench sections. The feature is
 *       committed but not in the deployed web client, which is why the search
 *       scene was cut rather than narrated.
 *   07  unified search on a model id — no results at all.
 *
 * They are kept in build/video/frames as evidence of what was checked.
 */
export default {
  audio: 'build/video/trustbench-narrated.mp4',
  out: 'build/video/trustbench-demo.mp4',
  crossfade: 0.6,
  background: '#151b2b', // the dashboard's own ground, so the pad is invisible

  shots: [
    // ── Scene 1 — the claim ──────────────────────────────────────────────
    { at: 0.5,   scene: 'S1 dashboard',   frame: 'build/video/frames/00.jpg' },
    { at: 14.0,  scene: 'S1 recent runs', frame: 'build/video/frames/01.jpg' },

    // ── Scene 2 — a board that discriminates ─────────────────────────────
    // 10 first: the header states the verifier package by name, which is what
    // Scene 3 then goes and runs.
    { at: 26.7,  scene: 'S2 all boards',  frame: 'build/video/frames/10.jpg' },
    { at: 40.0,  scene: 'S2 grounding',   frame: 'build/video/frames/11.jpg' },
    { at: 60.0,  scene: 'S2 ranks 2-11',  frame: 'build/video/frames/12.jpg' },
    { at: 76.0,  scene: 'S2 tail + note', frame: 'build/video/frames/14.jpg' },

    // ── Scene 3 — the signature check ────────────────────────────────────
    // One long hold. The text is the real transcript, and the viewer is meant
    // to read it rather than watch it move.
    { at: 90.0,  scene: 'S3 verifier',    frame: 'build/video/frames/19.jpg' },

    // ── Scene 4 — the catalog ────────────────────────────────────────────
    { at: 145.8, scene: 'S4 catalog',     frame: 'build/video/frames/09.jpg' },
    { at: 160.0, scene: 'S4 detail',      frame: 'build/video/frames/08.jpg' },

    // ── Scene 5 — attested failure ───────────────────────────────────────
    { at: 173.4, scene: 'S5 drill run',   frame: 'build/video/frames/16.jpg' },

    // ── Scene 6 — close ──────────────────────────────────────────────────
    { at: 203.8, scene: 'S6 boards',      frame: 'build/video/frames/10.jpg' },
  ],
}
