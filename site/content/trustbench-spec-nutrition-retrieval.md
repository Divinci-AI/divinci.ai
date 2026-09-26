+++
title = "Dr. Fuhrman Nutrition Corpus: Retrieval QA (60): test specification"
description = "60 factual questions about Dr. Joel Fuhrman's published nutrition material, answered by one fixed model through six retrieval stacks and scored for factual consistency with a reference answer by an LLM judge. The stacks do not all search the same corpus, and one row has a different judge."
template = "trustbench-spec.html"
path = "trustbench/specs/nutrition-retrieval"

[extra]
hide_breadcrumbs = true
mark = "retrieval"
board_anchor = "dr-fuhrman-nutrition-corpus-retrieval-qa-60"
as_of = "25 September 2026"
+++

<div class="tb-callout">
<p><strong>Three things to know before comparing rows.</strong></p>
<p>1. <strong>The top row, PixelRAG + Jev, was designed on these same 60 questions.</strong> None of the others was, and nobody can put a number on the advantage that gives it until a held-out question set exists.</p>
<p>2. <strong>The rows do not all search the same corpus.</strong> Vertex searches a newer, larger ingestion. PixelRAG indexes every rendered page of the 18 PDFs, where the others hold only the passages their parser kept. PageIndex + Jev leaves out the forum Q&amp;A collection.</p>
<p>3. <strong>One row has a different judge.</strong> PageIndex + Jev was scored by <code>gemini-3.8-flash</code>, every other row by <code>gemini-2.5-flash</code>.</p>
</div>

## What it measures

Whether a retrieval stack puts the passage holding a specific fact from Dr. Fuhrman's material in front of a fixed model with a fixed persona. Every row uses the same answering model, `@cf/zai-org/glm-5.3-flash`, the same release configuration and the same 60 questions. The score is the mean factual consistency of the 60 answers with their reference answers, from 0 to 1. **Higher is better.** The material is published with Dr. Fuhrman's permission.

This board has **no no-retrieval control row.** The [SDK Docs board](/trustbench/specs/sdk-docs-retrieval/) has one.

## The questions

There are **60 questions**, each backed by a different passage.

- **How they were written.** The method is the same as for the SDK board: written from the corpus text, one fact per question, each naming its subject ("According to Dr. Fuhrman…") so it stands alone. Each reference answer is backed by a verbatim evidence string from one passage, checked by machine. They were written in a working session with an AI coding assistant (Claude). No human review of each question is recorded.
- **Not derived from a system under test.** No question or reference answer came from any retrieval stack's output.
- **Fairness check.** The four original stacks do not hold identical copies of the corpus. So each question's evidence was checked to be present in the chunk text of all four: Vertex, Qdrant, Vectorize and PageIndex. As a side effect, 18 of the 22 book questions come from *Disease-Proof Your Child*, the only book whose full text survives in all four. The check compared chunk text, not PageIndex's tree nodes, and it missed that 24 of the 60 evidence sentences were in no PageIndex node (see the PageIndex row below). The two newer rows, PixelRAG + Jev and PageIndex + Jev, were added after the check.
- **Why this set replaced an earlier one.** A first attempt used 50 auto-generated questions. 35 of those referred to an unnamed speaker or scene, and their expected answers had come from a release's own retrieval output. That set was abandoned, and runs built on it were never made public.

Sources of the 60, by the collection that holds each question's evidence:

| Source | Questions |
|---|---:|
| Books | 22 |
| Podcast transcripts | 14 |
| Product information | 12 |
| Recipes | 12 |

The board's own description lists books, product information and podcast episodes, and leaves out recipes. This table is the more complete account.

The questions are drawn from Dr. Fuhrman's material, so this page does not quote them.

**The full question set, all 60 questions with their reference answers, is published:** [`scored-qa-suite-93b9aff624e6-llm-factual-consistency-vs-reference/v1.0.0.json`](/trustbench/benchmarks/scored-qa-suite-93b9aff624e6-llm-factual-consistency-vs-reference/v1.0.0.json) (14 KB). It is the exact canonical JSON the benchmark's content hash is computed over, so this prints the same value as every manifest's `benchmark.contentHash` on this board:

```
curl -s https://divinci.ai/trustbench/benchmarks/scored-qa-suite-93b9aff624e6-llm-factual-consistency-vs-reference/v1.0.0.json | shasum -a 256
# c4076a120dcd6b0dbb69cecd0843173e7b973c3b55e28c480b1fc4ac57cd4c2d
```

Or pass the file to the verifier as `benchmarkContent`, and it checks the hash for you: `verify(manifest, { outputs, benchmarkContent })`. Each row's outputs file adds the model's answer to every question.

## The rows

| Row | What it searches | Score (median of 3) | Range | Judge |
|---|---|---:|---|---|
| PixelRAG + Jev | 1,001 files as page images (see below) | 0.947 | 0.943–0.948 | gemini-2.5-flash |
| Vertex AI Vector Search v2 | Production ingestion, 7 collections | 0.920 | 0.917–0.933 | gemini-2.5-flash |
| Qdrant (cosine) | Arena corpus, 5 collections | 0.884 | 0.860–0.889 | gemini-2.5-flash |
| Vectorize (cosine) | Arena corpus, 5 collections | 0.836 | 0.831–0.853 | gemini-2.5-flash |
| PixelRAG, no Jev | The same tiles as PixelRAG + Jev | 0.817 | 0.800–0.825 | gemini-2.5-flash |
| Divinci PageIndex (tree reasoning, Jev node selection) | Arena corpus minus forum Q&amp;A, 4 collections | 0.8125 | 0.771–0.817 | **gemini-3.8-flash** |
| Divinci PageIndex (tree reasoning) | Arena corpus, 5 collections | 0.384 | 0.309–0.428 | gemini-2.5-flash |

**The arena corpus** is five collections: PDFs, podcast audio transcripts, product pages, recipes, and a forum Q&amp;A collection. Together they hold 1,001 files and 15,496 chunks in Qdrant. The Q&amp;A collection includes forum digests with members' first-person health disclosures. It is in every arena row except PageIndex + Jev, which excludes it for that reason. The Vectorize copy is missing most of the book text.

**Vertex** searches the live production release's group, a newer and larger ingestion: seven collections, including a separate books collection and two versions of the Ask-the-Doctor Q&amp;A. Its chunk count was not recorded. In a separate check of the chat path, the exact evidence sentence reached the model for only 24 of the 60 questions. Vertex still scores 0.920, because the same facts usually arrive through other passages. Its advantage is the breadth of its corpus, not better ranking.

**Divinci PageIndex (tree reasoning).** Each document is a tree of sections. A selector model (`llama-4-scout`) reads every tree's titles and summaries and picks nodes, and each collection returns up to 5 nodes' text. At the time of these runs, only 1,530 of the 4,128 nodes carried text, so 24 of the 60 evidence sentences were in no node at all. That capped any selector at 35 of 60. Product documents whose names contained a colon also failed to resolve. The trees were repaired on 23 September. **This row's 0.384 was measured before that repair and is stale.** It also moves about 6 points between passes.

**Divinci PageIndex + Jev node selection.** The same trees after the repair, four collections without the forum Q&amp;A, and a different selector: [Jev](https://typesafe.ai), a TypeSafe model that returns a probability instead of generating text. It first scores every node's summary for "is this section likely to contain the answer?" and keeps the top 40 documents. It then reads those documents' node text in 1,500-character windows and ranks nodes by probability. If more than a quarter of its requests fail, it fails the whole question, never falling back to another selector. The row therefore differs from plain PageIndex in trees and corpus as well as selector, and its lead over plain PageIndex cannot be credited to the selector alone.

**PixelRAG + Jev.** [PixelRAG](https://github.com/StarTrail-org/PixelRAG) renders each page as an image, cuts it into overlapping tiles, and retrieves tiles with a vision embedding model (Qwen3-VL-Embedding-2B).

- **Pages:** the 18 PDFs are rendered from the original uploads, every page. The other 983 files (transcripts, product pages, recipes, Q&amp;A) exist only as text, so their text was typeset into PDFs to give the image model pages. In all, 11,233 pages became 23,302 tiles.
- **Candidates:** for each question, the 30 nearest tiles by image embedding plus the 30 best by keyword (BM25) over each tile's text.
- **Ranking:** Jev reads each candidate's text and answers "does this tile state the answer?". Candidates are ranked by that probability.
- **Serving:** it runs as a customer-registered retriever. For these runs it was **served from a laptop through a tunnel**, with a 4.3-second budget, falling back to keyword-only ranking when the model was busy.

On the board, its stack appears as two digests: a customer-registered retriever is published only as a digest of its id. The second digest is an always-empty placeholder, needed because a retrieval group must have two members.

**PixelRAG, no Jev** (added 26 September). The same retriever with one change: the Jev step is removed. The same image and keyword candidates are interleaved instead (image 1, keyword 1, image 2, …). Everything else is identical: tiles, service, laptop, answering model and judge. It is registered as a separate retriever, so its stack id differs from PixelRAG + Jev's and the two rows can never share runs. It exists to measure what Jev contributes.

- **Result:** 0.817 against 0.947, about 13 points, under the same judge. The two rows' ranges (0.800–0.825 and 0.943–0.948) do not overlap.
- **Where the difference comes from:** checked through production's own retrieval path, the right tile comes first for 20 of 60 questions without Jev and 46 with it. The evidence reaches the answering model for 43 of 60 without Jev (Qdrant: 40) and 53 with it.
- **Its place next to PageIndex + Jev is not established.** The two rows are half a point apart and were scored by different judges. Under 2.5 Flash, PageIndex + Jev's earlier median was 0.823, which would put it above this row.

## How a model is run

- **Answering model:** `@cf/zai-org/glm-5.3-flash`. `max_tokens` 16,384, no temperature sent (the provider default applies), no fallback models, no skills.
- **System prompt:** the production release's "Dr. Fuhrman AI" persona (about 3,200 characters), plus a citation instruction and style and product-naming directives. The persona is Dr. Fuhrman's and is not reproduced here.
- **Each row is the same release with a different retrieval group.**
- **How a group is queried on this board.** Board runs **do not** use a group's merge settings as the product's chat does. Every collection in the group is queried separately, each returning its own top results. Those results are concatenated in collection order, duplicates removed, with no similarity sort across collections, and then trimmed to the model's character budget. For this model, the budget is about 4.25 million characters, so in practice nothing is trimmed. Each chunk is passed to the model as its own system message. The consequence: a group with more collections delivers more chunks per question. That favours Vertex, with seven collections. How many chunks each answer actually received is stored but not published.
- **Runs:** three passes per row. Each pass is published as its own signed run.

## How each answer is scored

The scorer and the arithmetic are exactly as on the [SDK Docs board](/trustbench/specs/sdk-docs-retrieval/#how-each-answer-is-scored): a judge sorts each of the reference answer's claims into supported, hedged, contradicted or omitted, and code computes (supported + ½ × hedged) ÷ claims, capped at 0.25 if a central claim is contradicted. The run score is the mean over 60 questions. The row score is the lower median of its runs.

**The judges differ.** Six rows were judged by `gemini-2.5-flash`. All three runs of PageIndex + Jev were judged by `gemini-3.8-flash`. The board does not show a judge. Each signed manifest names it, in its metric.

- On the same answers, 3.8 Flash scores these rows about 1 to 5 points higher than 2.5 Flash. So PageIndex + Jev's score is not directly comparable with its neighbours'.
- Its **place** does not depend on the judge. Under 2.5 Flash, the same configuration's median over four earlier passes is 0.823, still between Vectorize (0.836) and plain PageIndex (0.384).

**Re-scoring with other judges.** We re-scored the same stored answers of each current median run:

| Row | 2.5 Flash (published) | DeepSeek V4 Flash | Gemini 3.8 Flash |
|---|---:|---:|---:|
| PixelRAG + Jev | 0.947 | 0.942 | 0.963 |
| Vertex AI Vector Search v2 | 0.920 | 0.910 | 0.929 |
| Qdrant (cosine) | 0.884 | 0.892 | 0.899 |
| Vectorize (cosine) | 0.836 | 0.848 | 0.859 |
| Divinci PageIndex (tree reasoning) | 0.384 | 0.375 | 0.436 |

The order is unchanged under all three. Asking the *same* judge again moved a low row by about 2.5 points, which is a measure of the judge's own noise. As on the SDK board, agreement between LLM judges is not accuracy: no human-rated calibration exists.

## From a pass to a signed row

The same as the [SDK Docs board](/trustbench/specs/sdk-docs-retrieval/#from-a-pass-to-a-signed-row), with one addition: publishing takes only the answers served by the group being published. The runs are **republished**, and their outputs do not record fills.

On this board, fills happened twice. Two of PixelRAG + Jev's three runs each include one answer taken from an earlier pass. PixelRAG, no Jev has none: each of its runs' published scores equals the score of the pass it came from. In one of them, the judge never returned a score for an answer, and the pipeline would otherwise have counted it as 0.

## Known limitations, in order of weight

1. **PixelRAG + Jev was designed on these 60 questions.** Its architecture (image search, keyword search or both, ranked by Jev) was chosen by measuring retrieval on this question set. Its lead over Vertex, about 3 points, holds under all three judges. But it is the same size as the judge's own noise, and inside the row's own spread across passes (0.909 to 0.959 over five valid passes). Its leads over Qdrant (about 6 points) and Vectorize (about 11) are outside that noise.
2. **PixelRAG + Jev, and PixelRAG without Jev, were served from a laptop.** A retriever that is down returns nothing, and the pipeline then scores the answer as though retrieval had simply found nothing. One early pass was invalid for exactly this reason: 3 questions got no retrieval and 9 never ran. Every counted pass was audited against the retriever's own log. Production hosting for it does not exist yet.
3. **The corpora differ,** as described in the rows above. Vertex's lead comes from a broader ingestion. PixelRAG sees full pages where the others see parsed passages. Plain PageIndex ran on broken trees.
4. **Mixed judges,** as above.
5. **Plain PageIndex's 0.384 is stale.** It was measured before the tree repair.
6. **Group settings do not apply on this board,** as described in "How a model is run". Multi-collection rows receive concatenated per-collection results.
7. **Unrecorded parameters:** per-collection top-k and thresholds, Vertex's distance metric, and the embedding model of every row except PixelRAG's. All are in the platform's configuration and were not recorded with the board.
8. **60 questions.** One question is worth 0.017 of a row.

## Versioning and signing

Benchmark `bm_ZGZGFZNV2RS2338T26JMECMCEG`, version `1.0.0`, built from scored-QA suite `6aae5e8f162093b9aff624e6`. Every row answers through release `6aad0f46f427ba274dddab41`, and each manifest's upstream reference names the retrieval group that served it. Runs are signed by `tbp-prod-002`. We verified every current median run with verifier 0.5.0: each has a valid signature and a matching outputs hash, with one warning, that the score is republished.

The full account of the two newest rows is in [a fifth row, designed on the test](/blog/what-a-benchmark-has-to-prove-about-itself/#a-fifth-row).
