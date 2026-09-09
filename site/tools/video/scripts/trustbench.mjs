/**
 * TrustBench demo — two-voice dialogue.
 *
 * Casting is the argument. TrustBench's pitch is "most benchmarks ask you to
 * trust the number; this one asks you to check it", so the video is one voice
 * making claims and another checking them, rather than a single narrator
 * asserting both halves.
 *
 *   MILES (flux-miles-en)  clear, professional, confident, sincere. Presents.
 *   MAEVE (flux-maeve-en)  narration-tagged, confident, gentle. Checks.
 *
 * Both are new — the existing Divinci demo narrator is flux-sienna-en, and of
 * the 36 Flux voices only nine are tagged Narration or Informative (eight of
 * them masculine; Sienna is the only feminine one), so a mixed pair means
 * reaching one voice just outside that set.
 *
 * EVERY NUMBER HERE WAS READ OFF PRODUCTION on 2026-09-08, not copied from the
 * brief. Two places where the brief and production disagree are marked BRIEF
 * SAID below — do not restore them.
 *
 * `at` is the EARLIEST a line may start, an anchor to a beat in the recording.
 * The anchors below are ESTIMATES until the screen capture exists; re-place
 * them off the real cut with:
 *   ffmpeg -i trustbench.webm -vf "select='gt(scene,0.02)',metadata=print:file=-" -an -f null -
 */
const MILES = 'flux-miles-en'
const MAEVE = 'flux-maeve-en'

export default {
  video: 'build/video/trustbench.webm',
  out: 'build/video/trustbench-narrated.mp4',
  gapSame: 0.28,
  gapTurn: 0.6,

  lines: [
    // ── Scene 1 — the claim ──────────────────────────────────────────────
    { at: 0.5, voice: MILES, text: 'Most AI benchmarks ask you to trust the number.' },
    { at: 3.4, voice: MAEVE, text: 'TrustBench asks you to check it.' },
    { at: 6.0, voice: MILES, text: 'Every run produces a manifest signed with a platform key. The score you are shown is provably the score that was measured.' },
    // BRIEF SAID "four published boards". Production serves FIVE. The fifth is
    // a scored QA suite, which is worth naming rather than glossing.
    { at: 13.5, voice: MAEVE, text: 'Five boards are published right now. Four platform benchmarks, and one scored suite promoted from a workspace.' },

    // ── Scene 2 — a leaderboard that discriminates ───────────────────────
    { at: 20.0, voice: MILES, text: 'This is RAG grounding. Can a model answer from its retrieved context without inventing?' },
    { at: 25.5, voice: MILES, text: 'Seventeen models, six distinct ranks, top score of one point zero by g l m five point three flash.' },
    { at: 32.0, voice: MAEVE, text: 'And the version before this one was useless.' },
    { at: 34.5, voice: MILES, text: 'It was. Twenty-two of twenty-three samples were saturated. Fifteen models tied at a perfect score.' },
    { at: 41.0, voice: MAEVE, text: 'A benchmark everything passes measures nothing.' },
    { at: 44.0, voice: MILES, text: 'One point four replaced those samples with ones that discriminate. A fifteen-way tie became six real ranks.' },
    { at: 51.0, voice: MAEVE, text: 'Scores only compare within a benchmark version, so older runs are excluded rather than quietly mixed in. Zero excluded here. Every row is directly comparable.' },

    // ── Scene 3 — the signature check (the differentiator) ───────────────
    { at: 61.0, voice: MAEVE, text: 'So let me check the top one.' },
    { at: 63.5, voice: MILES, text: 'The manifest is on a public endpoint. The verifier is on n p m — M I T licensed, and its only dependencies are an Ed25519 library and a schema validator. Nothing of ours.' },
    { at: 72.0, voice: MAEVE, text: 'Fetched, and verified. Signature valid, signed by t b p prod zero zero two, score provenance measured, model invoked. No warnings.' },
    { at: 81.0, voice: MILES, text: 'Now change something.' },
    { at: 83.0, voice: MAEVE, text: 'Score from one to zero point four two. Signature fails.' },
    { at: 86.5, voice: MAEVE, text: 'Swap the model id. Fails. Inflate the sample count from eleven to five hundred. Fails. Alter the outputs hash. Fails.' },
    { at: 94.0, voice: MILES, text: 'That is the whole claim, and you just ran it yourself. Offline, against our key registry, with none of our code.' },

    // ── Scene 4 — unified search ─────────────────────────────────────────
    { at: 101.0, voice: MILES, text: 'TrustBench is searchable alongside everything else in the workspace.' },
    { at: 105.5, voice: MAEVE, text: 'Eleven benchmarks in the catalog. They are platform-owned, so it is identical in every workspace — it is what you can run.' },
    // Catalog (11 published) and leaderboard (5 boards) are different counts:
    // a benchmark only gets a board once runs exist to rank. Read off the
    // catalog page and the public leaderboard on 2026-09-08.
    { at: 111.5, voice: MILES, text: 'Five of them have enough completed runs to have a board.' },
    { at: 116.0, voice: MILES, text: 'Runs are private to whoever triggered them. An admin does not see a colleague’s run here, because the runs API would not serve it either.' },

    // ── Scene 5 — attested failure ───────────────────────────────────────
    { at: 120.0, voice: MAEVE, text: 'What happens when a run fails?' },
    { at: 122.5, voice: MILES, text: 'It is still a first-class record. This one targeted a model id that does not exist. Ten of ten samples failed.' },
    { at: 129.0, voice: MILES, text: 'Rather than emit a score from partial data, the harness refused to produce one.' },
    { at: 133.5, voice: MAEVE, text: 'A benchmark that always returns a number is easier to trust, and worse. Refusing to score is the honest outcome.' },

    // ── Scene 6 — close ──────────────────────────────────────────────────
    { at: 141.0, voice: MILES, text: 'Signed manifests. Versioned benchmarks. Offline verification, and a public board.' },
    { at: 147.0, voice: MAEVE, text: 'Version two opens it up, so domain experts publish their own benchmarks and earn per use.' },
  ],
}
