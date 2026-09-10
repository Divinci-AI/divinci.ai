/**
 * Quality Assurance demo — shot list.
 *
 * Every `at` is a MEASURED line start from the rendered narration (see
 * qa-suite.mjs, whose anchors are re-locked from the mix whenever the copy
 * changes), so a shot lands on the sentence that describes it rather than on a
 * cue nudged into place by eye.
 *
 * Frames are viewport captures of production taken through the browser
 * extension, so nothing outside the tab can be recorded. Shot in the
 * Dr. Fuhrman AI workspace: it carries 50-test suites and eight real runs,
 * where the Divinci sandbox has one suite and no calibration. The workspace's
 * own brand theme is light green — deliberately unlike the dark TrustBench
 * video, because inside a workspace the WORKSPACE theme wins and the user's
 * preference is ignored (ThemeContext.tsx). That is the product behaving
 * correctly, not a mismatch to fix in post.
 *
 * ── WHAT IS DELIBERATELY NOT SHOWN ───────────────────────────────────────
 *
 * (Monitoring WAS listed here as unshootable — the workspace had no config and
 * the only frame read "No monitoring configs yet." It turned out no config had
 * ever been creatable: the form sent releaseId:"default" against an ObjectId
 * field, so every create 500'd, silently. Fixed, and "Daily grounding check"
 * now exists with three alert rules bound to the suite's real scorers, so
 * Scene 6 has honest footage.)
 *
 * The AutoFix loop (Scene 4, 159.6s–187.8s). No AutoFix run exists in this
 * workspace and starting one escrows $81.51 per iteration against a customer
 * account, so it needs an explicit go-ahead. Until then Scene 4 holds on the
 * run result, which does carry real failure data — Response C returned 0/50.
 *
 * A computed agreement figure. Every workspace reports "Live agreement (n=0)";
 * no line in Scene 3 claims a number, and the gate is the better shot anyway.
 *
 * Auth-key panels. The AutoFix form shows BYOK key NAMES next to the RAG index
 * pickers. No secret is rendered, but the rule on this project is to keep the
 * frame away from credential UI entirely, so that region is not captured.
 */
export default {
  audio: 'build/video/qa-suite-narrated.mp4',
  out: 'build/video/qa-suite-demo.mp4',
  crossfade: 0.6,
  background: '#eef4ea', // the workspace's own ground, so the pad is invisible

  shots: [
    // ── Scene 1 — the unexamined judge ───────────────────────────────────
    // Opens on the catalog rather than a title card: the argument is that
    // suites are ordinary and checking the scorer is not.
    { at: 0.5, scene: 'S1 suites', frame: 'build/video/qa-frames/01-suites-list.jpg' },

    // ── Scene 2 — building a suite ───────────────────────────────────────
    // 25.0 is "A suite is a set of tests. Each one is a question, and the
    // answer you would accept" — the tests table shows Prompt beside Expected
    // Response, which is that sentence rendered.
    { at: 25.0, scene: 'S2 tests', frame: 'build/video/qa-frames/02b-tests-prompt-and-expected.jpg' },
    // 47.5 is "Then you choose how answers are scored" — the scorer panel
    // carries the three weights and their 55/36/9 contributions.
    { at: 47.5, scene: 'S2 scorers', frame: 'build/video/qa-frames/02-suite-scorers.jpg' },

    // ── Scene 3 — calibration ────────────────────────────────────────────
    // 69.0 opens the scene on the gate: "30 more ratings to unlock judge
    // recommendation", with "Publish calibrated benchmark to TrustBench"
    // greyed out beneath it. The product draws the QA→TrustBench handoff and
    // puts the calibration gate in front of it, which is the whole thesis.
    { at: 69.0, scene: 'S3 gate', frame: 'build/video/qa-frames/03-calibrate-gate.jpg' },
    // 90.5 is Hannah's "Can the rater see what the judge gave it?" — cut to
    // the three scorer rows, each reading "LLM: hidden until you rate", so the
    // answer is on screen before Jack gives it.
    { at: 90.5, scene: 'S3 hidden', frame: 'build/video/qa-frames/04-calibrate-hidden-until-rated.jpg' },

    // ── Scene 4 — run, and fix ───────────────────────────────────────────
    // 151.8 "run the suite against a release" → the four-way comparison:
    // Qdrant 65%, Vectorize 68%, PageIndex 0/50, Gemini Embedding 2 68%.
    // PageIndex failing outright is why this frame also carries 156.1,
    // "Failures just get logged, though" — the failure is already visible.
    { at: 151.8, scene: 'S4 run result', frame: 'build/video/qa-frames/05-run-result-4-releases.jpg' },
    // TODO(autofix): 159.6s–187.8s narrates AutoFix with no footage. Needs an
    // AutoFix run in this workspace, or the scene trimmed. Do not ship with
    // the run-result frame held under it — 28 seconds of AutoFix narration
    // over a static score table is exactly the mismatch this file exists to
    // prevent.

    // ── Scene 5 — the TrustBench handoff ─────────────────────────────────
    // 205.6 "the verifier is not ours to control. It is an M I T package on
    // n p m, and anyone can check the signature without an account" — the
    // offline terminal. Built from qa-scene5.html in this directory; every
    // value in it is read from the live manifest for
    // tr_Y2HQJBEWEMTCBCA0TB8TRATGHF, not composed. Palette is the workspace's
    // light green, NOT the TrustBench video's navy: a navy terminal here would
    // read as a jump cut into a different product.
    { at: 205.6, scene: 'S5 verifier', frame: 'build/video/qa-frames/08-verifier-names-the-judge.jpg' },
    // 216.2 "the receipt names the judge. The metric field carries the scorer
    // and the model that graded" — the public board. This frame also happens to
    // show the description corrected through the new benchmark editor, sitting
    // where the operator note about a spend cap used to be.
    { at: 216.2, scene: 'S5 board', frame: 'build/video/qa-frames/09-public-board-row.jpg' },

    // ── Scene 6 — close ──────────────────────────────────────────────────
    // 248.3 "monitoring re-runs the suite on a schedule and alerts on drift, or
    // on a score falling through a threshold you set" — the card shows exactly
    // that: Active, Schedule: daily, 3 alert rules. The rules are the suite's
    // own scorers, which is the detail that makes it real rather than a demo
    // fixture.
    { at: 248.3, scene: 'S6 monitoring', frame: 'build/video/qa-frames/07-monitoring-active.jpg' },
  ],
}
