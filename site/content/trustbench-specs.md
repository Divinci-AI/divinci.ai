+++
title = "TrustBench test specifications"
description = "What each public board actually tests, how a model is run against it, how every answer is scored, how a row's number is chosen, and what a signed manifest can and cannot prove about it."
template = "trustbench-spec.html"
path = "trustbench/specs"

[extra]
hide_breadcrumbs = true
mark = "trustbench"
as_of = "25 September 2026"
+++

A signature proves a score has not been altered since it was signed. It does not tell you what was measured. These pages do: one per board, each written from the benchmark's source, its signed manifests and its public outputs files. Where something was not recorded, the page says so, and known defects are listed on the page for the board they affect.

## The six boards

| Board | What it tests | Items | Graded by | Runs per row | Provenance |
|---|---|---|---|---|---|
| [Red Team Core v1](/trustbench/specs/red-team-core/) | Whether a bare model does what an attacker asks, across seven attack classes | 32 probes | Deterministic rules: canary, regex, refusal detection | 1 | measured |
| [System-Prompt Extraction v1](/trustbench/specs/system-prompt-extraction/) | Whether a planted secret can be pulled out of the system prompt | 12 probes | Canary match (11), regex (1) | 1 | measured |
| [RAG Grounding v1](/trustbench/specs/rag-grounding/) | Whether a model answers only from passages it is handed | 11 items | Deterministic regex rules, no judge | 1 | measured |
| [Annex IV erasure: corpus integrity](/trustbench/specs/annex-iv-erasure/) | One deployed assistant's answers after a document was erased from its corpus | 10 questions | LLM judge, claim by claim | 1 (one row) | republished, no provenance field |
| [Divinci SDK Docs: Retrieval QA](/trustbench/specs/sdk-docs-retrieval/) | Retrieval stacks compared with the model held fixed, on public docs | 60 questions | LLM judge, claim by claim | 3 | republished |
| [Dr. Fuhrman Nutrition Corpus: Retrieval QA](/trustbench/specs/nutrition-retrieval/) | Retrieval stacks compared with the model held fixed, on a customer corpus | 60 questions | LLM judge, claim by claim | 3 | republished |

**Measured** means the TrustBench evaluator called the model itself during the execution the manifest signs. **Republished** means the score was computed earlier, by Divinci's scored-QA pipeline, and the platform signed the finished result. The manifest says which, and the verifier warns on anything that is not `measured`.

## How a row's number is chosen

The same rules apply on every board.

- **A row is one configuration.** Rows are keyed on provider, model and, on the retrieval boards, retrieval stack. The same model through two stacks is two rows. A model with no retrieval is its own row.
- **Which runs count.** A run counts toward its row only if it is public, complete, has a finite score, names its provider and model, carries a signed manifest and a signer key, and was run against the board's current benchmark version. A further rule is written but **not yet deployed** as of 25 September 2026: it excludes any run in which an answer was produced while a retrieval backend had failed. Runs published before it carry no retrieval record, and they will stay eligible, because a missing record is not evidence of a failure.
- **The window.** The five most recent eligible runs of that configuration.
- **The number shown.** The lower median of the window by score. It is always the score of a real run, so the row's "signed manifest" link opens the manifest that contains exactly that number. With one run, the median is that run. The range under a score is the window's minimum and maximum.
- **Ranking.** Competition ranking: tied scores share a rank, and the next rank skips (1, 2, 2, 4).
- **Direction.** Each board says whether higher or lower is better. The red-team boards are attack success rates, so lower is better. Everything else here is higher-is-better.
- **Freshness.** Each API instance caches a board for about 60 seconds, so for a minute after a publish, two requests can briefly disagree.

## How to verify any row yourself

Nothing below needs an account.

1. Take the row's run id from its "signed manifest" link, or from the public leaderboard API: `https://api.divinci.app/v1/trustbench/public/leaderboard`.
2. Fetch the manifest and the outputs file:
   `https://api.divinci.app/v1/trustbench/public/runs/<runId>/manifest` and `.../runs/<runId>/outputs` (no `.json` suffix).
3. Check them with the open-source verifier, [`@divinci-ai/trustbench-verifier`](https://www.npmjs.com/package/@divinci-ai/trustbench-verifier) (MIT, no dependency on anything Divinci runs):

```ts
import { verify } from "@divinci-ai/trustbench-verifier";

const base = "https://api.divinci.app/v1/trustbench/public/runs/" + runId;
const manifest = await (await fetch(base + "/manifest")).json();
const outputs = await (await fetch(base + "/outputs")).text(); // hash the bytes as served

const result = await verify(manifest, { outputs, strict: true });
// result.signatureValid, result.outputsHashMatches, result.warnings
```

4. It fetches the public keys from `https://api.divinci.app/.well-known/trustbench-keys.json`. Every current row is signed by key `tbp-prod-002`. The registry marks `tbp-prod-001` as deprecated.
5. Re-derive the score from the outputs file. Each board's page gives the exact formula, and for every row we checked, it reproduces the signed score exactly.

`strict: true` turns every warning into a failure: a republished score, or a manifest with no provenance. Verifier 0.5.0 also reads a coverage block that newer outputs files will carry, declaring failed retrieval, answers filled in from an earlier pass, and missing answers. No published run has that block yet, because the publishing change that writes it is not yet deployed.

## The item sets

Every probe, question, passage, grading pattern and reference answer behind these boards is published as the exact canonical JSON its content hash is computed over. Hash a file and you get the value every manifest on that board commits to; pass it to the verifier as `benchmarkContent` and it checks that for you. The full hashes are on each board's page.

| Board | Version | Item set | sha256 (= the manifests' `benchmark.contentHash`) |
|---|---|---|---|
| Red Team Core v1 | 1.0.0 | [download](/trustbench/benchmarks/divinci-redteam-core-v1/v1.0.0.json) | `18029b84572a6240…` |
| System-Prompt Extraction v1 | 1.0.0 | [download](/trustbench/benchmarks/divinci-redteam-prompt-leak-v1/v1.0.0.json) | `0c3d7e03504ee89b…` |
| RAG Grounding v1 | 1.4.0 | [download](/trustbench/benchmarks/divinci-rag-grounding-v1/v1.4.0.json) | `eb8d3ab84b1f5ecd…` |
| Annex IV erasure | 1.0.0 | [download](/trustbench/benchmarks/scored-qa-suite-1d643f83bb0f-llm-factual-consistency-vs-reference/v1.0.0.json) | `28e0a046a8526ca1…` |
| SDK Docs: Retrieval QA | 1.0.0 | [download](/trustbench/benchmarks/scored-qa-suite-93b9aff40427-llm-factual-consistency-vs-reference/v1.0.0.json) | `04adb10a199b3de6…` |
| Nutrition Corpus: Retrieval QA | 1.0.0 | [download](/trustbench/benchmarks/scored-qa-suite-93b9aff624e6-llm-factual-consistency-vs-reference/v1.0.0.json) | `c4076a120dcd6b0d…` |

Publishing an item set makes a benchmark checkable and also makes it trainable: a model can be tuned on these exact items. So a published set measures less over time. We chose checkable. When a set saturates, the remedy is a new version with new items, not secrecy.

## What a manifest cannot tell you

These limits apply to every board, and each board's page lists its own.

- **What the benchmark contains.** A manifest commits to the benchmark's id, version and content hash, not to its items. The item sets are published separately (below), so you can check them against that hash.
- **How the model was configured,** beyond what the page describes: sampling temperature, for one, is not set by any of these harnesses, so each provider's default applied.
- **That a score means what its board's name says.** That is what these pages are for, and several of them say plainly that it does not, or not fully.

## Why this page exists

These specifications were published on 25 September 2026, after the boards had been public for weeks with a one-paragraph description each. Writing them turned up defects that should have been visible from the start. Among them: the top-ranked row on Red Team Core rests partly on empty answers, and the erasure board's single number cannot show whether the erasure worked. Both are described on their boards' pages, not held back for a fix.
