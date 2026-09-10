/**
 * Quality Assurance demo — two-voice dialogue.
 *
 * Casting is the argument, as in the TrustBench video. The QA suite's real
 * claim is not "we score your assistant" — everybody scores your assistant.
 * It is "we make you check the scorer first, and then hand the result to
 * TrustBench so a stranger can check it too." So the video is one voice
 * presenting the method and one voice refusing to take any of it on faith.
 *
 *   JACK   (flux-jack-en)    British, confident, thoughtful, professional.
 *   HANNAH (flux-hannah-en)  American, clear, confident, thoughtful.
 *
 * Both are new. TrustBench used flux-miles-en + flux-maeve-en and the older
 * Divinci demos use flux-sienna-en, so this pair is unheard so far; the
 * accent and register split keeps the turn-taking legible without the
 * listener having to track who is who.
 *
 * ── WHAT THIS SCRIPT DELIBERATELY DOES NOT SAY ───────────────────────────
 *
 * "Generation writes adversarial distractors." The form field is called
 * `adversarialAnswerGenerator`, which reads that way, but the UI label is
 * plain "Answer Generator" and the help text is "AI model used to generate
 * expected answers for test questions". It writes the REFERENCE answer, not
 * a trap. Narrating the field name would have invented a feature.
 *
 * "Edit a test and it publishes a new benchmark version." It does not.
 * ensureBenchmarkForSuite() hashes the tests, and on drift it THROWS and
 * asks for a manual version bump (auto-bump is filed for v1.5). The refusal
 * is the honest thing and the script says so, but it must be described as a
 * refusal, not as an automatic bump.
 *
 * "Fourteen judges" is countable and checked: fourteen llm-* scorers under
 * score-generator/hard-coded/llm. The seven external frameworks are RAGAS,
 * DeepEval, Patronus Lynx, Braintrust, Evidently AI, Neuronpedia and
 * reference-perplexity; three of those are tier-gated as premium, so the
 * script names only the ones anyone can reach and does not promise the rest.
 *
 * ── SHOOTING RULES ───────────────────────────────────────────────────────
 *
 * Never screenshot a credentials page, an Infisical view, or the Hermes
 * Agents settings. Secrets have twice reached transcripts via screenshots of
 * adjacent UI. Check what is below the fold before scrolling.
 *
 * Scene 3 CANNOT show a computed agreement figure. Every production workspace
 * reports "Live agreement (n=0)" — checked on both Fuhrman suites and the
 * sandbox — because nobody has rated under the current rubric version. No line
 * in this scene claims a number, so the copy stands as written; shoot the
 * MECHANISM instead: the rubric text beside the rating buttons, the
 * "LLM: hidden until you rate" label, and the "30 more ratings to unlock judge
 * recommendation" gate. The gate is the better shot anyway — a tool that
 * refuses to recommend until it has enough evidence is the whole argument.
 *
 * The Full Gauntlet suite cannot be calibrated at all: its eight scorers are
 * framework metrics, which have no human rubric to show a rater. Its Calibrate
 * button is disabled and says so. Do not frame it as if it were a bug.
 *
 * The calibrate page shows REAL RATER IDENTITY and a customer's name appears
 * in the source comments. Do not frame a rater chip, an attribution chip, or
 * any suite whose name identifies a customer. The Annex IV suite is cleared
 * for use; nothing else in that workspace is.
 *
 * The Annex IV board's public description carries an operator note about a
 * spend cap. It is on a public endpoint today, but it is build-in-public
 * residue rather than product, so do not frame it and do not read it.
 *
 * Spell initialisms with spaced capitals — "model I D", not "model id".
 * Flux reads a bare "id" as the English word. Same rule for R A G, C C C,
 * n p m and M I T. "rho" is spelled out as a word; Flux says the Greek
 * letter correctly only in that form.
 *
 * `at` is the EARLIEST a line may start. Values are re-locked from the
 * measured layout of the rendered mix after any copy change, so the shot
 * list in qa-suite.shots.mjs stays truthful.
 */
const JACK = 'flux-jack-en'
const HANNAH = 'flux-hannah-en'

export default {
  video: null,
  out: 'build/video/qa-suite-narrated.mp4',
  gapSame: 0.28,
  gapTurn: 0.6,

  lines: [
    // ── Scene 1 — the unexamined judge ───────────────────────────────────
    { at: 0.5, voice: JACK, text: 'Every AI team eventually writes an evaluation.' },
    { at: 4.1, voice: HANNAH, text: 'Almost nobody evaluates the evaluation.' },
    { at: 7.9, voice: JACK, text: 'If a language model is grading your assistant, your quality number is only as good as that grader. Most tools never ask how good it is.' },
    { at: 18.5, voice: HANNAH, text: 'So this one starts a step earlier. Before it scores your assistant, it makes you check the scorer.' },

    // ── Scene 2 — building a suite ───────────────────────────────────────
    { at: 25.0, voice: JACK, text: 'A suite is a set of tests. Each one is a question, and the answer you would accept.' },
    { at: 32.0, voice: JACK, text: 'You can write them, or generate them from a file already in your R A G index — so the questions are about your corpus, not a generic benchmark.' },
    { at: 43.0, voice: HANNAH, text: 'And it prices the generation before it runs, not after.' },
    { at: 47.5, voice: JACK, text: 'Then you choose how answers are scored. Fourteen judges are built in — relevance, correctness, faithfulness, context precision and recall, hallucination.' },
    { at: 57.4, voice: HANNAH, text: 'Or bring your own. R A G A S, DeepEval and Patronus Lynx are wired in, alongside a scorer you write yourself.' },

    // ── Scene 3 — calibration, the heart ─────────────────────────────────
    { at: 69.0, voice: HANNAH, text: 'This is the part I actually care about. How do you know the judge agrees with a human?' },
    { at: 75.5, voice: JACK, text: 'You check. An expert walks the sample — question, answer, reference — and scores each one against the same rubric text the model judge is given.' },
    { at: 87.0, voice: JACK, text: 'Not a paraphrase of it. The same text.' },
    { at: 90.5, voice: HANNAH, text: 'Can the rater see what the judge gave it?' },
    { at: 93.5, voice: JACK, text: 'Not until their own score is in. Otherwise you are not measuring agreement, you are measuring anchoring.' },
    { at: 101.0, voice: HANNAH, text: 'Good. And then?' },
    { at: 103.0, voice: JACK, text: 'Then it reports the rank correlation between your scores and the judge’s.' },
    { at: 108.4, voice: HANNAH, text: 'With a confidence interval, I hope. A correlation computed on twelve items is not a finding.' },
    { at: 114.5, voice: JACK, text: 'Bootstrapped, and shown beside the estimate. If it is still too wide, it tells you how many more ratings would close it.' },
    { at: 122.4, voice: HANNAH, text: 'What about a judge that ranks everything correctly but marks it all half a point high?' },
    { at: 128.3, voice: JACK, text: 'Rank correlation misses that entirely. So beside it sits a concordance coefficient, which compares the values and not just the order. When the two disagree, the judge is biased.' },
    { at: 138.9, voice: HANNAH, text: 'And if someone rewrites the judge’s prompt afterwards?' },
    { at: 142.7, voice: JACK, text: 'The rubric is hashed. Change it, and yesterday’s ratings are marked as belonging to the old rubric rather than quietly averaged into the new one.' },

    // ── Scene 4 — run, and fix ───────────────────────────────────────────
    { at: 151.8, voice: JACK, text: 'With the judge calibrated, run the suite against a release.' },
    { at: 156.1, voice: HANNAH, text: 'Failures just get logged, though. They always do.' },
    { at: 159.6, voice: JACK, text: 'Not here. AutoFix reads the failing tests, traces them to the chunks responsible, and proposes edits to the corpus itself.' },
    { at: 169.5, voice: HANNAH, text: 'How much of that happens without me?' },
    { at: 172.0, voice: JACK, text: 'As much or as little as you choose. Fully automatic, a checkpoint before anything deploys, or a checkpoint every iteration. And it stops on its own when scores plateau, rather than spending the budget to prove it cannot.' },

    // ── Scene 5 — the handoff to TrustBench ──────────────────────────────
    { at: 187.8, voice: HANNAH, text: 'So now I have a number. Why should anyone outside this workspace believe it?' },
    { at: 194.3, voice: JACK, text: 'Publish the run to TrustBench. Your suite becomes a versioned benchmark, and the result is signed with an Ed25519 key.' },
    { at: 203.0, voice: HANNAH, text: 'Signed by you, about you.' },
    { at: 205.6, voice: JACK, text: 'Which is why the verifier is not ours to control. It is an M I T package on n p m, and anyone can check the signature without an account.' },
    { at: 216.2, voice: HANNAH, text: 'And the receipt names the judge. The metric field carries the scorer and the model that graded — because eighty-three percent means nothing until you know who was grading.' },
    { at: 226.9, voice: JACK, text: 'The tests are hashed into it too. Edit one afterwards and the next publish refuses, rather than reusing the old identity for new content.' },
    { at: 236.0, voice: HANNAH, text: 'Good. And none of it is public unless I say so?' },
    { at: 240.6, voice: JACK, text: 'Private by default. Choosing public warns you first that it means every prompt and response in the run.' },

    // ── Scene 6 — close ──────────────────────────────────────────────────
    { at: 248.3, voice: JACK, text: 'After that, monitoring re-runs the suite on a schedule and alerts on drift, or on a score falling through a threshold you set.' },
    { at: 258.7, voice: HANNAH, text: 'Write the tests. Check the judge. Run it. Fix what failed. Then publish a receipt nobody has to take your word for.' },
    { at: 266.5, voice: JACK, text: 'Quality assurance you do not have to be trusted for.' },
  ],
}
