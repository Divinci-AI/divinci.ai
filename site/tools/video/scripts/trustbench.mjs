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
 * ── WHAT THIS SCRIPT DELIBERATELY DOES NOT SAY ───────────────────────────
 *
 * "Run the benchmark yourself outside Divinci, from the open-source repo."
 * Checked on 2026-09-08, and it does not hold yet:
 *
 *   - toBenchmarkPublic() omits inspectTaskRef, so the executable spec and its
 *     content hash are in NO public payload. The spec is served only by
 *     /internal/benchmarks/:id/spec, behind a shared key. Without it there is
 *     nothing to re-run off-platform.
 *   - github.com/Divinci-AI/sdk is public but holds LICENSE, README and
 *     changelogs/ — no source. The verifier's npm `repository.url` points
 *     there, so it looks like a source repo and is not one.
 *
 * What IS true, and what the script claims instead: the RECEIPT is fully
 * independent. Manifest and outputs come from unauthenticated endpoints, the
 * key registry from a .well-known, and the verifier is an MIT npm package whose
 * only dependencies are @noble/ed25519 and zod. Verified end to end against a
 * real production manifest — signed by tbp-prod-002, with each of four tampered
 * fields failing the signature.
 *
 * Also cut on this pass: the v1.2.0 saturation history (22 of 23 samples
 * saturated, a fifteen-way tie). It read as a build-in-public engineering
 * changelog rather than as the feature, and it was the one claim in the script
 * that could not be verified — the board serves 1.4.0 and there is no public
 * record of the older version.
 *
 * `at` is the EARLIEST a line may start. Values are re-locked from the measured
 * layout of the rendered mix after any copy change, so the shot list in
 * trustbench.shots.mjs stays truthful.
 */
const MILES = 'flux-miles-en'
const MAEVE = 'flux-maeve-en'

export default {
  video: 'build/video/trustbench.webm',
  out: 'build/video/trustbench-narrated.mp4',
  gapSame: 0.28,
  gapTurn: 0.6,

  lines: [
    // ── Scene 1 — what it is ─────────────────────────────────────────────
    { at: 0.5, voice: MILES, text: 'Most AI benchmarks ask you to trust the number.' },
    { at: 4.8, voice: MAEVE, text: 'TrustBench asks you to check it.' },
    { at: 8.3, voice: MILES, text: 'Every run produces a manifest signed with an Ed25519 platform key, so the score you are shown is provably the score that was measured.' },
    { at: 18.5, voice: MAEVE, text: 'Eleven benchmarks in the catalog — grounding, confabulation resistance, prompt injection, system-prompt extraction — and five with enough completed runs to publish a board.' },

    // ── Scene 2 — a real board ───────────────────────────────────────────
    { at: 33.5, voice: MILES, text: 'This is RAG grounding. Can a model answer from its retrieved context without inventing?' },
    { at: 40.2, voice: MILES, text: 'Seventeen models, six distinct ranks, and a top score of one hundred percent by g l m five point three flash.' },
    { at: 48.9, voice: MAEVE, text: 'And that is the median of the model’s five most recent qualifying runs. Always a real run’s score, not an average of runs that never happened.' },
    { at: 58.1, voice: MILES, text: 'Scores only compare within a benchmark version, so a run against an older version is excluded rather than quietly mixed in.' },
    { at: 65.6, voice: MAEVE, text: 'Every row carries the key that signed it, and a link straight to the manifest. Which is the part worth doing yourself.' },

    // ── Scene 3 — running one ────────────────────────────────────────────
    { at: 73.9, voice: MILES, text: 'Running one takes a model id and a button, and the catalog tells you the cost before you start. About sixty-six seconds and eleven cents for this one.' },
    { at: 85.5, voice: MAEVE, text: 'The benchmarks are platform-owned, so the catalog is identical in every workspace. It is what anyone can run.' },
    { at: 93.0, voice: MILES, text: 'Your runs are the opposite. Private by default, public only if you choose it — an admin does not see a colleague’s run, because the API would not serve it either.' },

    // ── Scene 4 — the receipt, checked from outside ──────────────────────
    { at: 102.4, voice: MAEVE, text: 'So let me check the top one, without an account, and without any of your code.' },
    { at: 108.0, voice: MILES, text: 'The manifest is on a public endpoint. So are the model’s raw outputs, and the registry of platform public keys.' },
    { at: 115.6, voice: MAEVE, text: 'And the verifier is on n p m. M I T licensed, pure TypeScript, and its only dependencies are an Ed25519 library and a schema validator. Nothing of yours.' },
    { at: 134.8, voice: MAEVE, text: 'Verified. Signature valid, signed by t b p prod zero zero two. Score provenance measured, model invoked, no warnings.' },
    { at: 146.7, voice: MILES, text: 'Now change something.' },
    { at: 148.4, voice: MAEVE, text: 'Score from one to zero point four two. The signature fails.' },
    { at: 154.0, voice: MAEVE, text: 'Swap the model id. Fails. Inflate the sample count from eleven to five hundred. Fails. Alter the hash of the outputs. Fails.' },
    { at: 164.4, voice: MILES, text: 'That is the whole idea. The receipt does not depend on us being honest, or on us still being here.' },
    { at: 170.4, voice: MAEVE, text: 'And rotation appends rather than replaces, so a manifest signed under a retired key still verifies years later.' },

    // ── Scene 5 — attested failure ───────────────────────────────────────
    { at: 178.6, voice: MILES, text: 'A run that fails is still a first-class record. This one targeted a model id that does not exist.' },
    { at: 190.0, voice: MAEVE, text: 'Ten of ten samples failed, so it refused to produce a score at all.' },
    { at: 196.8, voice: MILES, text: 'A benchmark that always returns a number is easier to trust, and worse. Refusing to score is the honest outcome.' },

    // ── Scene 6 — close ──────────────────────────────────────────────────
    { at: 205.2, voice: MAEVE, text: 'Signed manifests. Versioned benchmarks. Offline verification, and a public board.' },
    { at: 212.9, voice: MILES, text: 'Version two opens up authorship, so domain experts can publish their own benchmarks and earn per use.' },
  ],
}
