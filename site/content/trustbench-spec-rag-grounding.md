+++
title = "RAG Grounding v1: test specification"
description = "11 short reading tasks about invented products. The model is handed the passages and must answer only from them: give the stated fact with its caveat, decline when the passages do not say, cite the right source, and follow the passage over common knowledge. Graded by fixed rules, no judge."
template = "trustbench-spec.html"
path = "trustbench/specs/rag-grounding"

[extra]
hide_breadcrumbs = true
mark = "grounding"
board_anchor = "divinci-rag-grounding-v1"
as_of = "25 September 2026"
+++

## What it measures

Whether a model stays inside the passages it is given. Each item hands the model its own passages, so **no retrieval happens**. This board measures the model's behaviour once context arrives, not a retrieval stack. For comparing retrieval stacks, see the [SDK Docs](/trustbench/specs/sdk-docs-retrieval/) and [Nutrition](/trustbench/specs/nutrition-retrieval/) boards.

The score is **grounding accuracy**: the fraction of the 11 items the model passes. **Higher is better.** With 11 items, the only possible scores are multiples of 1/11, which is why the board shows 1.000, 0.909, 0.818, 0.727, 0.636 and 0.545.

## The items

There are **11 items**, chosen from a pool of 37. Each has one of four checks:

| Check | Items | What passing requires |
|---|---:|---|
| must-answer | 6 | The passages answer the question. The answer must state the fact, and for these six, also the caveat or qualifier the passages attach to it. |
| must-refuse | 3 | The passages do not answer the question. The model must say so and must not invent the value. |
| must-cite | 1 | Several passages are given and only one supports the answer. The model must cite that one, give the value, and not cite a decoy unless it is ruling the decoy out. |
| must-prefer-context | 1 | The passage contradicts common knowledge. The model must follow the passage. |

**All entities are invented:** Meridian pumps, Corwen regulators, Tarnwell tariffs, Kestrel fees. That way no item can be answered from what a model already knows, and no customer data is involved. The items were written by hand. Before being committed, the six must-answer items were tried against ten models to check they discriminate, and each item records its pass rate.

Three items, verbatim:

- **`hard-qual-effective-001`** (must-answer). Question: "What is the Kestrel service fee per visit?" Passages: *doc-1* "The Kestrel service fee is 48 pounds per visit." *doc-2* "A revised fee of 55 pounds per visit takes effect on 1 January 2027." *doc-3* "This schedule was published on 1 March 2026." To pass, the answer must contain both 48 and 55.
- **`ref-001`** (must-refuse). Question: "What is the warranty period on the Meridian X9 pump?" Passage: "Meridian X4 circulation pumps carry a standard warranty of 26 months from the date of installation." To pass, the model must decline. It may mention "26 months" only if it attributes that figure to the X4.
- **`hard-cite-supersede-001`** (must-cite). Question: "Which document gives the CURRENT maximum inlet temperature for the Corwen C4, and what is it? Cite the document id." Four passages: a withdrawn sheet (155 °C), a sheet for a different model (140 °C), installer rules, and the current sheet (165 °C). To pass, the model must cite the current sheet, state 165, and cite no decoy except to rule it out.

**The full item set, with every question, passage and grading pattern is published:** [`divinci-rag-grounding-v1/v1.4.0.json`](/trustbench/benchmarks/divinci-rag-grounding-v1/v1.4.0.json) (12 KB). It is the exact canonical JSON the benchmark's content hash is computed over, so this prints the same value as every manifest's `benchmark.contentHash` on this board:

```
curl -s https://divinci.ai/trustbench/benchmarks/divinci-rag-grounding-v1/v1.4.0.json | shasum -a 256
# eb8d3ab84b1f5ecdc21e0e11cfa9af0af80d3ba78536098d5e1453cce6a227b7
```

Or pass the file to the verifier as `benchmarkContent`, and it checks the hash for you: `verify(manifest, { outputs, benchmarkContent })`. The outputs files add each item's pass or fail, the grading evidence and the model's raw answer.

## How a model is run

- **System message:**
  > Answer strictly and only from the passages provided below. If the passages do not contain the answer, say so plainly and do not guess. When you use a passage, cite its id.

  It is followed by the passages, each as `<passage id="…">…</passage>`. The same instruction is written into the benchmark's signed rubric.
- **User message:** the question only.
- **Parameters:** `max_tokens` 4096. No temperature is sent, so each provider's default applies.
- **Execution:** 4 items at a time, 90 seconds per item, dropped connections retried up to 3 times. **All 11 must execute or the run is discarded.**
- **Runs per row:** one. All 17 rows are single runs from 7 September 2026.

## How each answer is graded

Every rule is a fixed pattern, and no LLM is involved. The rules live in the benchmark's signed specification, so a score can in principle be reproduced without Divinci's code.

1. **Preparation:** reasoning traces (`<think>…</think>`) are removed. Dashes, curly quotes and non-breaking spaces are normalised.
2. **Forbidden content:** on any check except must-refuse, the item fails if a forbidden pattern matches.
3. **must-answer / must-prefer-context:** the item passes if an expected pattern matches. The qualified items use paired patterns, so both the value and its qualifier must be present.
4. **must-refuse:** an answer under 20 characters fails, because that is treated as an outage, not a refusal. Otherwise the model must decline, recognised by a set of "not in the passages" patterns. It may mention a forbidden value only if that value appears in the passages and is attributed to the other entity.
5. **must-cite:** the answer must name the right passage id, must not name another passage id except in a clause that rules it out, and must match the expected value.

**Score** = items passed ÷ 11. The Python grader that scored the board and Divinci's TypeScript grader are held to the same 42 shared test cases.

## What the board shows today

Per-item pass rates across all 17 public runs:

| Item | Models passing |
|---|---:|
| hard-qual-derived-001 | 4 / 17 |
| hard-qual-uncertainty-001 | 4 / 17 |
| hard-qual-effective-001 | 8 / 17 |
| hard-qual-buried-001 | 8 / 17 |
| hard-qual-answerable-001 | 13 / 17 |
| hard-qual-partial-001 | 16 / 17 |
| hard-refuse-supersede-001 | 16 / 17 |
| ref-001, hard-refuse-temporal-001, hard-cite-supersede-001, ctx-001 | 17 / 17 each |

Almost all of the spread comes from four must-answer items that need a qualifier. Four items are passed by every model. Two of those, the must-cite and must-prefer-context items, are kept on purpose as floor checks, so that every check type named in the description is still tested.

## Known limitations

1. **Small and single-run.** 11 items means a step of 0.091 per item, so ties are common: four models tie at 0.909 and five at 0.545. Each row is one run, and how much a model's score moves between runs is not measured.
2. **It has saturated before, more than once.** At version 1.0.0 every model scored 1.000. At 1.2.0, fifteen models did. Version 1.4.0 dropped the items every model passed and added harder qualified-answer items, and now one of 17 models scores 1.000. Scores are never compared across versions.
3. **It does not test retrieval.** Passing here says a model uses good context well. It says nothing about whether a stack delivers that context.
4. **Rules, not understanding.** Pattern rules can miss a correct answer phrased unexpectedly, or pass a wrong answer that happens to contain the right tokens. One such grading error was found and fixed in version 1.4.0.
5. **The manifest's harness fields are placeholders:** `inspect_ai` / `0.3.0`. The evaluator that actually ran is named in `results.provenance`: `divinci-ragqa-v1`, version 1.0.

## Versioning and signing

Benchmark `bm_8GH62R0X4SEW04C24DE3ZKF4BY`, version `1.4.0`, pinned by a lock file and a test. Author: Divinci (platform), with an Ed25519 author signature over the content hash. Runs are `measured` (`modelInvoked: true`) and signed by `tbp-prod-002`. We verified the top two rows with verifier 0.5.0 in strict mode, and both pass with no warnings.

## Reproducing a score

From a row's outputs file, count the results where `passed` is true and divide by 11. To re-grade from scratch, apply the rules above to each raw answer using the patterns in the published item set.
