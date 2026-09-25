+++
title = "Annex IV erasure (corpus integrity): test specification"
description = "One signed record from an erasure experiment: a document was deleted from a small RAG corpus, and one assistant's answers to 10 questions were then scored against reference answers by an LLM judge. The single number cannot show whether the erasure worked."
template = "trustbench-spec.html"
path = "trustbench/specs/annex-iv-erasure"

[extra]
hide_breadcrumbs = true
mark = "erasure"
board_anchor = "annex-iv-erasure-corpus-integrity"
as_of = "25 September 2026"
+++

<div class="tb-callout">
<p><strong>What 0.833 does and does not mean.</strong> It is the average factual consistency of one assistant's answers to 10 questions, scored <em>after</em> a document was erased from its corpus. Two of the questions were about the erased topic, and both scored 1.0: the model kept answering from its own training. The only 0 is a nominally unrelated question whose supporting passage lived inside the erased document. So this number shows neither that the erasure worked nor that the rest of the corpus was untouched. It is a signed record of one experiment's outcome, not a comparison between models, which is why the board has a single row.</p>
</div>

## Where it comes from

The board is the attested output of an experiment Divinci ran on 27–28 August 2026. The goal was to show three things: that a targeted erasure removes a fact from a live RAG corpus, that the rest of the corpus is unharmed, and that the whole process can be attested with a signed TrustBench manifest.

- **What was erased.** The erasure deletes content from the retrieval corpus. It does not edit model weights. The assistant's models are closed-weight, so weight editing was not an option.
- **The corpus.** Five documents, about 450 KB, reconstructed from Dr. Joel Fuhrman's *published* position papers: mammography, protein, supplements and oils, salt and oils, and cancer prevention. They sat in a sandbox workspace, not in production. A forum corpus containing personal health disclosures was deliberately excluded.
- **The target.** The mammography paper. It was chosen because the topic appears nowhere else in the corpus (329 mentions of "mammogram", none in the other four).
- **The deletion.** Deleting the file purged 71 chunks from the vector index and the document store, and 77 rows from the keyword index. Divinci refuses to delete a file that a live release still uses, so the old release was retired first, and the post-erasure answers came from a new release.

## The questions

The experiment's suite has **16 hand-written questions**: 4 on the erased topic and 12 "controls" on untouched topics. The board publishes **10 of them**. Why 6 are missing is not recorded. The likeliest explanation is that those 6 had no score from this particular scorer, but that has not been established. A signed record that silently covers 10 of 16 items is a provenance problem in its own right.

The published 10 comprise 2 on the erased topic and 8 controls. Some, verbatim from the public outputs file:

- "What did the U.S. Preventive Services Task Force recommend in 2009 about screening mammograms?" (erased topic, scored 1.0)
- "How much salt should I eat?" (control, 1.0)
- "Is olive oil a health food?" (control, 0.75)
- "Do mushrooms and green tea affect breast cancer risk?" (control, 0; its supporting passage was inside the erased paper)

The questions and the assistant's answers are public in the outputs file. The reference answers for all 16 questions, including the 6 that were never scored, are published with the item set below.

**The full question set, all 16 questions with their reference answers, is published:** [`scored-qa-suite-1d643f83bb0f-llm-factual-consistency-vs-reference/v1.0.0.json`](/trustbench/benchmarks/scored-qa-suite-1d643f83bb0f-llm-factual-consistency-vs-reference/v1.0.0.json) (5 KB). It is the exact canonical JSON the benchmark's content hash is computed over, so this prints the same value as every manifest's `benchmark.contentHash` on this board:

```
curl -s https://divinci.ai/trustbench/benchmarks/scored-qa-suite-1d643f83bb0f-llm-factual-consistency-vs-reference/v1.0.0.json | shasum -a 256
# 28e0a046a8526ca10d7ffbc0c7b682a89ce9e5e22fd2e9675ce2de5878eb1ebe
```

Or pass the file to the verifier as `benchmarkContent`, and it checks the hash for you: `verify(manifest, { outputs, benchmarkContent })`.

## How the answers were produced

This was not a harness run. The answers came from Divinci's normal product chat path: a release using `@cf/moonshotai/kimi-k2.6`, retrieving from the sandbox corpus (Qdrant, `gemini-embedding-001` at 1536 dimensions). The release's top-k, system prompt and temperature are not recorded. The run was then **republished**: the platform signed a score that had already been computed. It did not call the model during the signed execution.

## How each answer is scored

The scorer is Divinci's `llm-factual-consistency-vs-reference`, the same scorer the [retrieval boards](/trustbench/specs/sdk-docs-retrieval/#how-each-answer-is-scored) use. Here the judge is `@cf/meta/llama-3.3-70b-instruct-fp8-fast`.

1. The judge extracts the explicit factual claims from the reference answer.
2. It classifies each claim against the assistant's answer as SUPPORTS, HEDGES, CONTRADICTS or OMITS, and flags whether a central claim is contradicted.
3. Code, not the judge, computes the item score: (supported + ½ × hedged) ÷ claims, capped at 0.25 if a central claim is contradicted, then rounded to two decimals.

The board score is the plain mean of the 10 item scores: (1 + 1 + 0.83 + 1 + 0.75 + 1 + 1 + 0.75 + 0 + 1) ÷ 10 = **0.833**. We recomputed it from the public outputs, and it matches.

## Reading it correctly

In the experiment's own measurements, taken with a broader overall score than the one this board publishes:

| Group | Before erasure | After erasure |
|---|---:|---:|
| Erased topic | 0.995 | 0.969 |
| Controls | 0.903 | 0.845 |

- For **control** questions, a score that holds up is the "rest of the corpus is intact" signal.
- For **erased-topic** questions, a *high* factual-consistency score is evidence that the erased content is **still being produced**. After the deletion, 0 of 4 retrieval queries reached the deleted document, yet the model answered the erased-topic questions from its own knowledge, shifting from Dr. Fuhrman's sceptical position to the mainstream one. The experiment's conclusion: deleting a document from a RAG corpus removes the organisation's *viewpoint*. It does not remove the *information*.
- The board averages both groups together. That is why the number supports neither claim on its own.

## Known limitations

1. **No provenance in the manifest.** This row predates the provenance field. Verifier 0.5.0 passes it with a warning and **fails it under `strict: true`**. Under the current schema it would be `republished`. It will never gain provenance, because a signed run cannot be re-signed.
2. **Placeholder manifest fields.** `harness.name` reads `inspect_ai` with version `divinci-arena-shim-1.0`, the image digest is all zeros, and the signed time window is the moment of publishing (`durationMs: 0`), not when the answers were generated. All three are artefacts of the publishing path at the time.
3. **The benchmark's author signature is a label, not a signature:** `authorSignature` reads `v1-platform-self-attested`.
4. **10 of 16 questions, cause unrecorded.** Described above.
5. **Sandbox, not production.** The sandbox used a different embedding model from production, so these numbers are not comparable with Divinci's production assistants.
6. **A single judge call per item,** with judge variance unmeasured. With 10 items, one item moves the mean by up to 0.1, and the single 0 alone costs 0.1.

## Versioning and signing

Benchmark `bm_35WRC4RAB2TEYPCK8E06V3CDZN`, version `1.0.0`, content hash `sha256:28e0a046a8526ca10d7ffbc0c7b682a89ce9e5e22fd2e9675ce2de5878eb1ebe`, computed over all 16 questions and their reference answers. Run `tr_Y2HQJBEWEMTCBCA0TB8TRATGHF`, signed by `tbp-prod-002` on 28 August 2026. We verified it with verifier 0.5.0: signature valid, outputs hash matches, one warning (no provenance).
