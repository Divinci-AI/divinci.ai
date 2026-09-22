# TrustBench Blog — Raw Material for a Forward-Looking Post

Compiled 2026-09-21 from the server repo (`strategy/vision/`, `notes/KNOWN-GAPS.yaml`,
`notebooks/2026-09-19-trustbench-retrieval-boards/`), the live production API, and the
published npm verifier. Every number below was read from a source named beside it;
anything inferred is labelled **[speculation]**; anything I could not verify is labelled
**[VERIFY]**. This is **prep material, not a draft** — candidate framings are in §7.

**The brief:** not a changelog of what we fixed. A post about what a trustless benchmark
*is*, why the industry needs one, and where content-authenticity stamping goes across the
whole pipeline — model, dataset, harness, result.

---

## 1. The thesis, in one paragraph

A benchmark score is a claim about a measurement, and almost every published AI score today
is unfalsifiable: you cannot check it, the lab cannot re-check it six months later, and the
regulator never could. TrustBench's bet is that the unit of trust is not the number but the
**manifest** — a signed document naming the model, the dataset, the harness, the judge and
the outputs, which any third party can verify offline with software we do not control. The
interesting consequence, and the spine of this post, is that such a manifest must also be
able to **state its own weakness** in a machine-checkable way. A score that cannot say how
it was produced is not evidence; a score that can say "I was republished, not measured" is.

---

## 2. What we can claim, with evidence

### 2.1 Two public retrieval boards, live now

Read from `GET /v1/trustbench/public/leaderboard/<slug>` on 2026-09-21. Each row is the
median of three signed runs; the model is held FIXED so rows differ only in retrieval.

**`Divinci SDK Docs — Retrieval QA (60)`** — slug `scored-qa-suite-93b9aff40427-llm-factual-consistency-vs-reference`

| Retrieval stack | Score |
|---|---|
| Vertex AI Vector Search v2 (Pre-GA) | 0.7548 |
| Qdrant (cosine) | 0.7320 |
| None (no retrieval) | 0.0782 |

**`Dr. Fuhrman Nutrition Corpus — Retrieval QA (60)`** — slug `scored-qa-suite-93b9aff624e6-llm-factual-consistency-vs-reference`

| Retrieval stack | Score |
|---|---|
| Vertex AI Vector Search v2 (Pre-GA) | 0.9200 |
| Qdrant (cosine) | 0.8842 |
| Vectorize (cosine) | 0.8362 |
| Divinci PageIndex (tree reasoning) | 0.3840 |

Both: answering model `@cf/zai-org/glm-5.3-flash`, no fallbacks, no skills; scorer
`llm-factual-consistency-vs-reference` judged by `gemini-2.5-flash`; signed `tbp-prod-002`.

### 2.2 The baseline is the proof the questions test retrieval

**The most quotable number in the set is 0.078.** Same model, same questions, retrieval
switched off. Without the corpus the model cannot answer, so the other rows are measuring
retrieval and not the model's memory. Almost no public RAG benchmark publishes this control.
*This is the single strongest evidence-of-method point available for the post.*

### 2.3 The questions were authored against the corpus, not generated from it

From `notebooks/2026-09-19-trustbench-retrieval-boards/README.md`: the first DFO attempt used
an auto-generated 50-question suite, and **35 of its 50 questions referred to an unnamed
speaker or scene** ("What event were the speakers attending last night?"). Those measure
which transcript chunk a backend happened to surface. Worse, the generator draws each
expected answer from one release's own RAG pipeline, which biases the benchmark toward
whichever backend produced it.

Replaced with hand-authored questions where every reference answer is supported by a
**verbatim evidence substring of one chunk, machine-checked**. For the DFO board the evidence
had to be present in all four backends' corpora — the fairness constraint, with a real and
disclosed cost: 18 of 22 book questions come from one book, the only one whose body text
survives in all four ingestions.

### 2.4 The verifier is open, published, and tells you when to distrust the score

`@divinci-ai/trustbench-verifier@0.4.0` on npm (MIT, no Divinci dependencies). Verified
2026-09-21 by unpacking the published tarball. Its `verify()` emits, verbatim from
`dist/verify.js`:

> `results.provenance.sourceKind is 'republished': the score was computed by an earlier run (<upstreamRef>), not by the evaluator execution this manifest attests`

and, for a transport fixture:

> `results.provenance.sourceKind is 'stub': the score is FABRICATED and the model under test was never called — this manifest is a transport fixture, not a measurement`

Neither is a hard error, deliberately: a pre-provenance manifest must stay verifiable, and a
manifest that honestly declares itself a stub *does* have a valid signature. `strict: true`
promotes every warning to a failure, so a consumer who cares refuses them in one flag.

**This is the post's best concrete artifact.** The design principle — *the attestation
grades its own strength, and the consumer chooses the bar* — is more interesting than any
row on any board.

### 2.5 Our own published rows are `republished`, and say so

Read from the public manifest of `tr_QK8BYANFA03XN71WHQNSPQFKTF` (top DFO row):

```json
"provenance": {
  "sourceKind": "republished",
  "modelInvoked": false,
  "evaluator": { "name": "divinci-arena-shim", "version": "divinci-arena-shim-1.0" },
  "upstreamRef": "divinci://scored-qa/suite/…/release/…/rag-group/…"
}
```

The scores were computed by Divinci's scored-QA pipeline and republished into a signed
TrustRun; the TrustBench harness did not invoke the model itself. **Say this in the post.**
It costs nothing — the manifest already says it, and anyone running the verifier sees the
warning — and a post about verifiable evaluation that quietly overstates its own runs would
refute itself in public.

---

## 3. What the post must NOT claim

Each of these is an open entry in `notes/KNOWN-GAPS.yaml`. They are the honest-limits
section; the site's voice already does this well (see the correction block in
*Deleting Paris from a Language Model*).

| Don't claim | Why | Ledger id |
|---|---|---|
| "attested end-to-end" | our rows are `republished`, not `measured` | `trustbench-provenance-not-yet-in-production` |
| that the ten platform benchmarks rank models | six carry ≤5 samples, two carry exactly ONE — a one-sample benchmark can only score 0.0 or 1.0 | `trustbench-benchmarks-too-small-to-rank-on` |
| that the published boards discriminate | RAG Grounding puts 12 of 16 models at exactly 1.0000; System-Prompt Extraction puts 6 of 16 at 0.0000 | `trustbench-two-published-boards-are-saturated` |
| that we compare against Claude / ChatGPT / Gemini / Grok | the harness has clients for three backends; those four cannot be run today | `trustbench-no-closed-vendor-baseline-is-runnable` |
| that every complete run is verifiable | three production runs are `complete` with a `manifestR2Key` whose R2 object does not exist | `trustbench-complete-runs-with-no-manifest-in-r2` |
| that the public board is live-accurate | 60s in-process cache per instance; `generatedAt` ships but is not deployed as of 2026-09-21 | `trustbench-public-leaderboard-serves-a-stale-board` |
| that public outputs are reviewed | there is no precondition, only a habit | `trustbench-public-outputs-have-no-content-review` |

Three more caveats specific to the two retrieval boards, all already public in the notebook:
Vertex searches a **newer, larger ingestion** than the other three on DFO; PageIndex varies
**±6 points** between passes; there is **one judge** and one answering model.

---

## 4. The research angle — what is actually novel here

Four ideas, in rough order of how well they carry a post.

### 4.1 A measurement has an identity, and the industry keeps losing it

A RAG score is a claim about a *tuple*: model × retrieval stack × corpus ingestion × judge ×
question set × harness. Change any coordinate and it is a different measurement. Two defects
we hit are the same defect: a score that survived its own identity being wrong. A row
labelled with one retrieval group while averaging answers served by three others renders
exactly like a correct row — **nothing about it looks wrong**. This is the failure mode
attestation exists for, and it is not exotic: it is what happens by default when the
identity lives in a label rather than in a signed document.

### 4.2 Errors with a direction survive review

A recurring shape, three instances deep in one scorer: a decisive presence test that only
ever *suppresses passes*. Scores move the way a fix intends, the board looks stricter rather
than wrong, and the defect is invisible to anyone reading totals. In all three cases it
marked down the most useful answer — a model that cites the right passage and explains why
another does not apply; a model that declines and says what it *did* retrieve.

**The generalisation worth publishing:** a benchmark whose errors are signed always in the
conservative direction is not "safe". It systematically penalises the behaviour buyers most
want — models that explain their reasoning — and it cannot be caught by monitoring the
aggregate, because the aggregate moves correctly. You catch it by reading answers, or by
cross-language conformance vectors that pin the grader's judgment independent of any score.
*[speculation, but defensible: this generalises past RAG to any rubric-graded eval.]*

### 4.3 Negative controls belong on the board, not in the appendix

§2.2. A retrieval benchmark without a no-retrieval row is not interpretable: you cannot tell
a corpus effect from a model that already knew the answer. Cheap to run, and it should be a
publication requirement rather than a courtesy.

### 4.4 Reproducibility is a property of the spec, not the code

The grading rules that matter travel **inside the signed benchmark spec** (`declinePatterns`,
`attributionPatterns`, `exclusionPatterns`), not in our grader. A third party reproduces the
score without running our software. The trap we hit and should describe: a rule expressed as
per-sample data only reaches the harness if the serializer copies it, and ours *enumerated*
the fields — so a correct rule, correct type, correct graders and passing tests produced a
rule that could not fire on a single run. Reading the code proved nothing; reading what
production **served** proved it.

**"Ask what the system serves, not what the repo contains"** is a strong closing beat and
recurs across the whole body of work.

---

## 5. Content authenticity across the pipeline — the forward half

Source: `strategy/vision/2026-04-26-trustbench-maximalist.md` §12. Four independent
provenance manifests composed into one signed chain:

| Manifest | Attests | Status today |
|---|---|---|
| **Model** | SHA-256 of every weight tensor (merkle root), training lineage, serving environment, TEE | not built |
| **Dataset** | item-level content credentials (C2PA-compatible): who authored each test item, when, from what source, under what licence; curation lineage signed by reviewer identity; immutable versions; hash-only commitments for private benchmarks | not built |
| **Harness** | harness binary hash, reproducible image digest, scoring rubric, sampling params, TEE quote attesting THIS harness ran THIS config | partial — manifests carry `harness` + `configHash`; the two boards carry `imageDigest` from the arena shim |
| **Result** | the TrustRun: model × dataset × harness × outputs × scoring decisions, signed | **shipped** |

Standards the vision commits to adopting rather than reinventing: **C2PA** for dataset-item
content credentials (and contributing AI-eval-specific extensions), **W3C Verifiable
Credentials** for author identity, **SLSA** for harness pipeline attestation language,
**NIST AI RMF** + **EU AI Act Annex IV** for the record-keeping mapping. Stated goal: submit
the TrustRun manifest to IETF/NIST as an open spec.

### The argument the post should actually make

The dataset manifest is the hard one and the important one, and §2.3 is the evidence: our own
first question set was *generated from one backend's pipeline*, which quietly made the
benchmark a measurement of that backend. No signature over the result would have caught it —
the run was honest, the harness correct, the signature valid. **Only provenance over the
dataset catches a benchmark that was born biased.** That is the strongest available case for
pushing content credentials down to the item level, and it comes from our own mistake rather
than a hypothetical.

Four things dataset provenance would make checkable, none of which a result signature can:
1. **Who wrote this item, and were they qualified?** (domain-expert benchmarks are the v2
   marketplace's whole premise)
2. **Was the expected answer derived from a system under test?** (the bias we shipped)
3. **Is the evidence present in every corpus being compared?** (the DFO fairness constraint —
   we enforced it by hand, and a manifest could carry it)
4. **Has the item leaked into training data?** (contamination becomes a provenance query,
   not a guess)

Point 4 is the one with the widest implications and is worth its own paragraph. **[speculation
— we have not built this; frame as where it goes, not what it does.]**

---

## 6. Roadmap, restated honestly

⚠️ The vision doc's schedule is from 2026-04-26 and its dates have slipped: it put the public
marketplace in June and dual-stamping in early July. **Do not reprint that table.** As of
2026-09-21: v1 signed runs and public boards are live; the open verifier is published and
provenance-aware (0.4.0); the marketplace, TEE tier, model/dataset manifests and the
standards submission are ahead of us. State the direction, not dates we have already missed.

The v∞ framing is worth keeping because it is unusually honest for a company blog and matches
the site's voice: *the standard wins, and we win because we built the best version of it* —
explicitly "no moats — product is GOAT." Also worth quoting, because it pre-empts the obvious
objection: **attestation says "this score is real", not "this model is safe". Evidence, not a
guarantee.**

---

## 7. Candidate angles

**A. "What a benchmark has to prove about itself" — RECOMMENDED.** Open on the 0.078 baseline
and the republished-warning string. Thesis: the unit of trust is the manifest, and a manifest
must be able to state its own weakness. Middle: the three failure shapes (§4.1, §4.2, §4.4)
as evidence that scores lose their identity by default. Close: dataset provenance as the next
link, with §2.3 as the motivating mistake. *Carries the research angle and the roadmap without
becoming a changelog, because every defect appears as evidence for a general claim rather than
as a thing we fixed.*

**B. "The benchmark that grades itself."** Narrower: build the whole post on the verifier's
warning vocabulary (`measured` / `republished` / `stub`) and what it would take to earn
`measured` end-to-end. Very strong artifact, less room for the research angle.

**C. "Who wrote your benchmark?"** Lead with dataset provenance and the contamination
argument; use our generated-question mistake as the hook. Most forward-looking, least grounded
in shipped work — best *after* A has established the foundation.

Recommend **A now, C as the follow-up** once dataset manifests are real.

---

## 8. Production notes

- **Format:** TOML frontmatter, `template = "blog-post.html"`, `categories = ["Research"]`.
  Research posts run 2,100–3,600 words (*Deleting Paris* 2,108; *Calibrating the Judge* 3,615).
  Target ~2,600.
- **Tags:** Evaluation, Attestation, RAG, Content Provenance, C2PA, Benchmarks, Open Standards.
- **Assets needed:** `hero_video` + `hero_video_poster` + `featured_image` on R2 — every
  Research post has all three. Board screenshots or an embedded live table.
- **Internal links:** [Calibrating the Judge](/blog/calibrating-the-ai-judge/) already
  introduced TrustBench publicly and covered judge calibration (Spearman ρ ≥ 0.85, n ≥ 30) —
  **link it, do not re-explain it**. Also *Inside the RAG Arena*, *Future of RAG Systems*.
- **External links:** the two board slugs; `@divinci-ai/trustbench-verifier` on npm.
- **[VERIFY] before publishing** — both come from `notebooks/BLOG_trustbench_journey_DRAFT.md`
  (Jul 28) and neither has been checked against the primary source:
  1. the Berkeley RDI claim that **eight major agent benchmarks** (SWE-bench, WebArena,
     OSWorld, GAIA, Terminal-Bench, FieldWorkArena, CAR-bench, +1) can be driven to
     near-perfect scores without solving a task — a load-bearing hook; read the paper;
  2. **arXiv 2506.23706**, "Attestable Audits", cited as prior art alongside PeerBench.
- **Do not reuse** `BLOG_trustbench_journey_DRAFT.md` as a base. It is a day-by-day journal —
  precisely the developer-diary shape this post is meant to avoid. Mine it for the market
  framing in its opening and discard the structure.

---

## 9. Sources

| What | Where |
|---|---|
| Two boards, method, fairness checks, question sets | `server: notebooks/2026-09-19-trustbench-retrieval-boards/` |
| Maximalist vision, four-manifest chain, standards, risks | `server: strategy/vision/2026-04-26-trustbench-maximalist.md` |
| Public-leaderboard design | `server: strategy/implementation/2026-09-05-trustbench-public-leaderboard-plan.md` |
| Every honest limit in §3 | `server: notes/KNOWN-GAPS.yaml` (ids named inline) |
| Grader rules, cross-language conformance vectors | `server: workspace/resources/server-resources/src/trustbench/ragqa/` |
| Live board rows, manifests | `https://api.divinci.app/v1/trustbench/public/…` |
| Verifier warning strings | `npm: @divinci-ai/trustbench-verifier@0.4.0`, `dist/verify.js` |
| Journal (market framing only) | `server: notebooks/BLOG_trustbench_journey_DRAFT.md` |

---

## 10. External landscape — searched 2026-09-21

### 10.1 The Berkeley RDI result CHECKS OUT — use it

The §8 `[VERIFY]` item is confirmed. Wang, Mang, Cheung, Sen and Song (UC Berkeley RDI,
April 2026) adversarially stress-tested **8 major agent benchmarks across 3,556+ tasks**.
**Seven of eight were driven to ~100%**; OSWorld partially, at 73%. The exploits are the
story:

- **SWE-bench Verified** — a `conftest.py` of **ten lines of Python** "resolves" every instance.
- **WebArena** — navigating Chromium to a `file://` URL reads the gold answer out of the task
  config: ~100% on all 812 tasks.
- **Terminal-Bench** — a fake `curl` wrapper scores all 89 tasks with no solution code.
- **FieldWorkArena** — the exploit is a single message: `{}`. Validation checked only that the
  final message came from the assistant, never comparing it to ground truth.

RDI's own framing is the line to build on: *the evaluation was not designed to resist a system
that optimizes for the score rather than the task.*

**Why this matters for our thesis, and it is a sharper point than "benchmarks are gameable":**
none of these exploits would be caught by signing the result. Every run was honest, every
harness did what it was told, every signature would verify. They are caught by attesting the
**harness and its sandbox** — §5's third manifest — which is exactly the link we have not
built. Cite this as the argument FOR the roadmap, not as evidence for what we ship today.

### 10.2 The number that makes the whole case

> Of the 100 models listed on llm-stats as of 2026-06-16, **only one carries an independent
> verification badge** — the other 99 scores were submitted by the vendors themselves.

Secondary source (digitalapplied.com); **[VERIFY] against llm-stats directly before printing.**
The accompanying framing is almost our thesis verbatim: *self-reported is a claim; independently
verified on a standardized harness is evidence* — and a self-reported number **bakes the
vendor's own scaffold into the score**, since each vendor runs its own tool definitions, retry
logic, context management and prompting around the raw model.

That last clause is worth dwelling on, because it is the bridge to §10.4: if the scaffold is
inside every published number, then **nobody is currently measuring the scaffold** — and the
scaffold is most of what a production system actually is.

### 10.3 Prior art we should cite, not pretend doesn't exist

- **Attestable Audits: Verifiable AI Safety Benchmarks Using Trusted Execution Environments**
  — arXiv **2506.23706**, ICML 2025, Schnabl et al. (Pivotal Labs / Cambridge). Confirms the
  §8 citation. Runs the benchmark inside a TEE and uses remote attestation so the hardware
  signs a report over the configuration; protects model IP *and* benchmark confidentiality
  when auditor and provider do not trust each other. Prototype against Llama-3.1.
  **This is the closest published work to our v1.5 TEE tier.** Honest positioning: they solved
  the confidentiality half in a lab; the gap is a *public registry with a dev surface and a
  marketplace*, which is the pocket the vision doc identified.
- **LLM Benchmark Datasets Should Be Contamination-Resistant** — arXiv 2605.19999.
- **A Unified Perturbation Framework for Analyzing Leaderboard Stability and Manipulation** —
  arXiv 2605.15761. Directly relevant to our saturation problem (§3).
- **Quantifying construct validity in LLM evaluations** — arXiv 2602.15532.
- **C2PA 2.4 ships explicit AI/ML guidance** (`spec.c2pa.org/…/2.4/ai-ml/ai_ml.html`) — the
  dataset-manifest work in §5 has a live spec to conform to rather than extend from scratch.
  *Check what 2.4 already covers before proposing extensions; the vision doc predates it.*

### 10.4 The strategic opening: everyone benchmarks MODELS

This is the most valuable finding of the search, and it reframes the roadmap.

Every leaderboard named above — LMArena, HELM, SWE-bench, llm-stats — ranks **models**. The
scaffold around the model is either frozen (HELM) or vendor-chosen and undisclosed
(self-reported scores). Meanwhile Berkeley RDI's result says the scaffold is decisive, and
§10.2 says the scaffold is silently baked into 99 of 100 published numbers.

**So the un-served instrument is a leaderboard that holds the model FIXED and varies one
coordinate of the stack.** That is precisely what the two boards in §2.1 already do — and it
is why the 0.078 baseline row matters so much. It is not a nice control; it is the thing that
makes a component measurement legible at all.

Candidate boards, ordered by how much of the work already exists:

| Board | Varies | What we already have |
|---|---|---|
| **Retrieval backends** | Vertex / Qdrant / Vectorize / PageIndex | **shipped** — two domains |
| **Lexical vs vector vs hybrid** | the retrieval *leg* | measured already: lexical recall@5 **98.3%** vs vector **66.7%** — a headline number sitting in an incident note |
| **Embedding models** | embeddinggemma / gemini-embedding-001 / -2-preview | all three in production; a known dimension/quota trade-off |
| **Chunking & ingestion** | RAPTOR / LightRAG / PageIndex trees / coalescing | all implemented in chunks-workflow |
| **Document parsers** | LiteParse / OpenParse / open-parse | already a published post to build on |
| **Judges** | the grader itself | ScoredQA calibration, Spearman ρ vs a human anchor |
| **Agent scaffolds** | tools, retries, context management | the direct answer to RDI — and the hardest to attest |

Two further directions worth naming as "where this goes":

- **Erasure / unlearning receipts.** The published verifier already carries an
  `erasure-schema` with its own `sourceKind: measured | unmeasured`. Attestation has already
  generalised past benchmarks to *knowledge-editing claims* — "this fact was removed from this
  model, here is the receipt" — which ties directly to the vIndex work in
  [Deleting Paris](/blog/deleting-paris-from-a-language-model/). Strong closing material.
- **Procurement.** §5's regulator scenario has a date now: EU AI Act high-risk obligations and
  the Annex IV technical-documentation duty apply from **2 August 2026**, and the AI Office's
  enforcement powers began the same day. This is no longer a 2030 argument — it is in force,
  and Annex IV asks for exactly the artefacts a manifest chain emits (dataset cards, validation
  reports, change logs, version control across the lifecycle). **[VERIFY] the date and scope
  against the primary text before printing; secondary sources agree but this is a regulatory
  claim and deserves the actual article.**

### 10.5 Sources

- [How We Broke Top AI Agent Benchmarks — Berkeley RDI](https://rdi.berkeley.edu/blog/trustworthy-benchmarks-cont/) · [part 1](https://rdi.berkeley.edu/blog/trustworthy-benchmarks/)
- [Attestable Audits (arXiv 2506.23706)](https://arxiv.org/pdf/2506.23706) · [ICML page](https://icml.cc/virtual/2025/48334)
- [C2PA 2.4 — Guidance for AI and ML](https://spec.c2pa.org/specifications/specifications/2.4/ai-ml/ai_ml.html)
- [LLM Benchmark Datasets Should Be Contamination-Resistant](https://arxiv.org/html/2605.19999v1)
- [A Unified Perturbation Framework for Leaderboard Stability and Manipulation](https://arxiv.org/pdf/2605.15761)
- [Quantifying construct validity in LLM evaluations](https://arxiv.org/pdf/2602.15532)
- [Can a Buyer Reproduce a Vendor Benchmark Row?](https://www.digitalapplied.com/blog/vendor-benchmark-reproducibility-audit-2026) · [contamination & leaderboard guide](https://www.digitalapplied.com/blog/llm-benchmark-methodology-2026-contamination-leaderboard-guide)
- [EU AI Act high-level summary](https://artificialintelligenceact.eu/high-level-summary/) · [Annex IV checklist](https://aigovernancedesk.com/eu-ai-act-technical-documentation-checklist/)
- [HELM (stanford-crfm)](https://github.com/stanford-crfm/helm)
