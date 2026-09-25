+++
title = "Divinci SDK Docs: Retrieval QA (60): test specification"
description = "60 narrow factual questions about Divinci's public SDK documentation, answered by one fixed model through different retrieval stacks, plus a no-retrieval control. Each answer is scored for factual consistency with a reference answer by an LLM judge."
template = "trustbench-spec.html"
path = "trustbench/specs/sdk-docs-retrieval"

[extra]
hide_breadcrumbs = true
mark = "retrieval"
board_anchor = "divinci-sdk-docs-retrieval-qa-60"
as_of = "25 September 2026"
+++

## What it measures

Whether a retrieval stack puts the one passage that answers a narrow question in front of a fixed model. Every row uses the same answering model, `@cf/zai-org/glm-5.3-flash`, the same 60 questions, the same judge and the same scoring rubric. **Rows differ only in retrieval.** The score is the mean factual consistency of the 60 answers with their reference answers, from 0 to 1. **Higher is better.**

The **no-retrieval row** is the control: the same model answering with retrieval switched off. It scores 0.078, with 1 answer fully right and 50 fully wrong out of 60. That shows these questions cannot be answered from what the model already knows, so the other rows are measuring retrieval.

## The questions

There are **60 questions**, each about a different page of the documentation and answered by a different passage.

- **How they were written.** They were written from the documentation's text, one fact per question. Each question names its subject ("In the Divinci CLI…") so it stands alone and is specific to this corpus, not general knowledge. Each reference answer is backed by a verbatim evidence string from one passage, and that match was checked by machine.
- **What they were deliberately not derived from.** Divinci's scored-QA generator writes expected answers from a release's own retrieval output, which would bias a benchmark toward whichever stack produced them. These questions were not made that way, so **no question or reference answer comes from a system under test.**
- **Who wrote them.** The set was written in a working session with an AI coding assistant (Claude). No human review of each question is recorded.
- **What they cover.** Client, server and MCP SDK options and errors; CLI commands and connectors; release configuration (anonymous chat, fallbacks, moderation, caching, de-identification, HIPAA); the embed script; bring-your-own-key; RAG settings (vector groups, embedding models, the retriever contract); hosted agents; billing and plans; the TrustBench, red-team and scored-QA docs; and two changelog entries.

Three questions, verbatim:

- "In the @divinci-ai/mcp client (McpClient), what is the default value of the `maxReconnectAttempts` configuration option?"
- "What minimum Node.js version does the Divinci CLI (`@divinci-ai/cli`) require?"
- "For a Divinci RAG vector group attached to a Release, what are the default `mergeStrategy` and `maxChunksPerVector`?"

Every question, and the model's answer to it, is public in each row's outputs file. The reference answers are not in the outputs file. The 60 questions and 60 reference answers are fixed by the content hash `sha256:04adb10a199b3de662f3a20d9bfc6dabb4686c84c39bcab0e5ee9a129b523bdc`, and we reproduced that hash from the question file.

## The corpus and the rows

The corpus is the public SDK documentation at [sdk.divinci.ai](https://sdk.divinci.ai): **111 pages, 710 chunks.** Both retrieval rows index the same 111 pages, with the same embedding model, `@cf/google/embeddinggemma-300m`. The chunking method and chunk size were not recorded.

| Row | Retrieval | Score (median of 3) | Range of the 3 runs |
|---|---|---:|---|
| Vertex AI Vector Search v2 | 710 points; Pre-GA (beta) product | 0.755 | 0.743–0.755 |
| Qdrant (cosine) | 710 points, cosine similarity | 0.732 | 0.731–0.740 |
| No retrieval | none, the control | 0.078 | 0.073–0.091 |

Each row is a separate release with the same model and settings. Top-k, similarity threshold and Vertex's distance metric are stored in the platform's configuration and were not recorded with the board. No reranker is recorded for either row.

## How a model is run

- **Answering model:** `@cf/zai-org/glm-5.3-flash` on Cloudflare Workers AI. `max_tokens` 16,384, no temperature sent (the provider default applies), no fallback models, no skills, **no system prompt**.
- **Context:** each retrieved chunk is passed to the model as its own system message, in retrieval order.
- **Runs:** each row is three separate passes of all 60 questions. Each pass was published as its own signed run.

## How each answer is scored

The scorer is Divinci's `llm-factual-consistency-vs-reference`. Its human-facing rubric, verbatim:

> Compare a candidate answer against a reference's factual claims, claim-by-claim. For each reference claim: SUPPORTS: candidate asserts the same thing. HEDGES: candidate mentions the topic but softens or qualifies past the reference's position. CONTRADICTS: candidate asserts the opposite or something incompatible. OMITS: candidate doesn't address this claim. Score reflects the proportion of supported claims, with hedges counting as half-credit. Contradictions on the central claim cap the score low. Extra correct detail in the candidate is NEUTRAL (no penalty, no reward).

1. The **judge**, `gemini-2.5-flash` on every row of this board, receives the question, the reference answer (marked authoritative), the model's answer and the retrieved context. It extracts the reference's explicit claims, classifies each one, and flags a contradicted central claim. It returns structured data and no score.
2. **Code computes the score:** (SUPPORTS + ½ × HEDGES) ÷ claims. If a central claim is contradicted, the score is capped at 0.25. It is clamped to 0–1 and rounded to two decimals. If the judge finds the reference insufficient or extracts no claims, the item scores 0.5.
3. **Run score** = the mean of the 60 item scores. We recomputed it from the outputs for several runs, and it matches to float precision.
4. **Row score** = the lower median of the row's runs (see [how a row's number is chosen](/trustbench/specs/#how-a-row-s-number-is-chosen)).

The judge is named in every signed manifest's metric (`…-judged-by-gemini-2.5-flash`) and in the outputs file.

## Checking the judge

A judge's scores are only as good as the judge, so we re-scored the same stored answers with two other judges:

| Row | gemini-2.5-flash (published) | DeepSeek V4 Flash | Gemini 3.8 Flash |
|---|---:|---:|---:|
| Vertex AI Vector Search v2 | 0.755 | 0.740 | 0.743 |
| Qdrant (cosine) | 0.732 | 0.737 | 0.730 |
| No retrieval | 0.078 | 0.114 | 0.058 |

The order is the same under all three judges. Agreement between judges is high on the retrieval rows (Spearman ρ 0.97–0.99) and lowest on the control (ρ 0.63–0.68), so the control's exact value depends on the judge, while the gap between retrieval and no retrieval does not. Agreement between two LLMs is not accuracy, though: no human-rated calibration exists for this scorer on this board.

## From a pass to a signed row

1. A **pass** answers and judges all 60 questions for one release.
2. **Publishing** takes, for each question, the latest scored answer for that release and signs the set as one TrustRun. If a question failed in the newest pass, its answer from an earlier pass is used instead. On this board that happened once: one Vertex answer in the second pass. The published outputs do not record which answers were filled.
3. The manifest is marked **`republished`** (`modelInvoked: false`), because the platform signed scores that the scored-QA pipeline had already computed. The signed time window is the moment of publishing, not when the answers were generated.
4. Runs are published private, the outputs are read by a person, and only then is the run made public. Before a run goes public, an automated check scans its outputs for identifiers such as emails and phone numbers. It cannot recognise names or health details, which is why the human read is required.

Changes written on 25 September 2026 but **not yet deployed** will change several of these steps. Answers the judge never scored will be excluded instead of counted. Outputs will record which pass each answer came from and whether it was filled in. A publish can be pinned to a single pass. And publishing will refuse a set judged by more than one model, or one produced while a retrieval backend was failing. Runs already published keep the older format.

## Known limitations

1. **The lead is small.** Vertex leads Qdrant by 2.3 points under the published judge, and the two rows' run ranges do not overlap. Under the other two judges, though, the lead shrinks to 0.3 and 1.3 points. Treat it as a small edge.
2. **Vertex AI Vector Search v2 is a Pre-GA (beta) product.**
3. **Retrieval parameters are unrecorded:** per-row top-k, thresholds, the distance metric and chunking.
4. **60 questions.** One question is worth 0.017 of a row.
5. **What a manifest cannot show here:** the retrieval stack itself (it is in the leaderboard row and, indirectly, in the manifest's configuration hash), the context each answer saw, the reference answers, the judge's claim-by-claim reasoning, and which answers were filled.

## Versioning and signing

Benchmark `bm_JNQG33XYNX8RDBTQQK8H57ZHSV`, version `1.0.0`, built from scored-QA suite `6aae594d162093b9aff40427`. Runs are signed by `tbp-prod-002`. We verified every current median run with verifier 0.5.0: each has a valid signature and a matching outputs hash, with one warning, that the score is republished.
