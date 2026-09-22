+++
title = "What a Benchmark Has to Prove About Itself"
description = "Seven of eight major agent benchmarks were driven to near-perfect scores without solving a task — and every one of those runs would have passed a signature check. The unit of trust is not the number. It is the manifest, and a manifest has to be able to state its own weakness."
date = 2026-09-22T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Research"]
tags = ["Evaluation", "Attestation", "Benchmarks", "RAG", "Content Provenance", "C2PA", "Open Standards", "EU AI Act"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/trustbench-sdk-board-hero.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/what-a-benchmark-has-to-prove-about-itself-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/what-a-benchmark-has-to-prove-about-itself-hero-poster.webp"
reading_time = 13
summary = "In April 2026 a Berkeley team drove seven of eight major AI agent benchmarks to roughly 100% without solving a single task — one of them by sending the message `{}`. Every one of those runs was honest, and a cryptographic signature over the result would have verified all of them. That is the gap this post is about: signing a score proves the outputs produced it, not that the measurement meant anything. We publish two retrieval leaderboards whose rows are signed, whose manifests declare themselves `republished` rather than `measured`, and whose most important row is a control that scores 0.078 — re-scored with a second judge from a different family, which preserves the ranking and disagrees most about the worst answers."
+++

The most important number on either of our public leaderboards is **0.078**.

It is not the best score. It is the worst one, and it is the only row that makes the others mean anything. Same model, same sixty questions, same judge — retrieval switched off. Without the corpus the model scores 0.078, which is to say it cannot answer. Every other row on that board is therefore measuring retrieval rather than what the model already happened to know.

Almost no published RAG benchmark carries that row. It costs one extra run and it is the difference between a number and a measurement.

<figure class="blog-chart">
  <a href="/trustbench/"><img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/trustbench-sdk-board-hero.webp" width="2256" height="762" alt="Screenshot of the Divinci SDK Docs retrieval board on the public TrustBench page. Three rows, all answering with the same model, @cf/zai-org/glm-5.3-flash: through Vertex AI Vector Search v2 it scores 75.5%, through Qdrant (cosine) 73.2%, and with no retrieval at all 7.8%. Each score shows the median of three runs and its range, and each row links to a signed manifest with the key id tbp-prod-002." loading="lazy"></a>
  <figcaption>The control row, as it is served on the <a href="/trustbench/">public page</a>. Row three is the same model answering the same sixty questions with retrieval switched off: 7.8%, which is the 0.078 above. It is what makes 75.5% and 73.2% mean “retrieval works” rather than “the model already knew”.</figcaption>
</figure>

Both boards are live on the [public TrustBench leaderboards](/trustbench/), alongside four others. Every row there carries a link to the signed manifest that contains it, and the id of the key that signed it.

<figure class="blog-chart">
  <a href="/trustbench/"><img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/trustbench-public-nutrition-board.webp" width="1600" height="947" alt="Screenshot of the Dr. Fuhrman Nutrition Corpus board on the public TrustBench page. Four rows, all answering with the same model, @cf/zai-org/glm-5.3-flash, and differing only in the retrieval stack, each shown with its vendor's logo: Vertex AI Vector Search v2 at 92.0%, Qdrant (cosine) at 88.4%, Vectorize (cosine) at 83.6%, and Divinci PageIndex (tree reasoning) at 38.4%. Each row's background fills to its score, the median-of-three range sits beneath it, and each row links to a signed manifest with the key id tbp-prod-002. A footer reads: each row is one configuration, a model and the retrieval stack it answered through." loading="lazy"></a>
  <figcaption>The nutrition board as it is served on the <a href="/trustbench/">public page</a>. The model is identical down every row by design — the retrieval stack is the variable, and the footer says so: <em>each row is one configuration, a model and the retrieval stack it answered through</em>. The rightmost column is the part that matters: every row hands you the manifest that contains its score and names the key that signed it, so the number and the evidence for it never travel separately.</figcaption>
</figure>

<figure class="blog-chart">
  <img src="/images/charts/chart-retrieval-vs-baseline.svg" alt="Horizontal bar chart of seven retrieval rows across two boards with the model held fixed. Dr. Fuhrman Nutrition Corpus: Vertex AI Vector Search v2 0.920, Qdrant 0.884, Vectorize 0.836, Divinci PageIndex 0.384. Divinci SDK Docs: Vertex 0.755, Qdrant 0.732, and a no-retrieval control at 0.078 in amber, annotated as the row that makes the others interpretable." loading="lazy">
  <figcaption>Two TrustBench boards, read on 2026-09-21. Each row is the median of three signed runs. The answering model, the judge, the question set and the scoring rubric are held fixed, so rows differ only in the retrieval stack — and the amber control says what the model can do without any of them.</figcaption>
</figure>

---

## The thing a signature does not prove

In April 2026, a team at UC Berkeley's RDI — Hao Wang, Qiuyang Mang, Alvin Cheung, Koushik Sen and Dawn Song — [adversarially stress-tested eight of the most cited AI agent benchmarks](https://rdi.berkeley.edu/blog/trustworthy-benchmarks-cont/), across more than 3,556 tasks. Seven of the eight were driven to roughly 100%. OSWorld held out at 73%.

The exploits are worth reading in full, because they are not clever:

- **SWE-bench Verified** — a `conftest.py` of ten lines of Python "resolves" every instance.
- **WebArena** — point Chromium at a `file://` URL and read the gold answer out of the task config. Roughly 100% across all 812 tasks.
- **Terminal-Bench** — a fake `curl` wrapper scores all 89 tasks without a line of solution code.
- **FieldWorkArena** — the exploit is one message: `{}`. Validation checked only that the last message came from the assistant. It never compared the answer to ground truth.

RDI's framing is the sentence to keep: the evaluation was not designed to resist a system that optimizes for the score rather than the task.

Now the part that matters for anyone building attestation. **Cryptographically signing those results would have caught none of them.** Every one of those runs was honest. The harness did exactly what it was told. The outputs hash matches. The signature verifies. A signed manifest over a gamed benchmark is a perfectly valid signature over a meaningless number — and it is *worse* than an unsigned one, because it carries an air of proof it has not earned.

This is the trap in front of everyone selling "verifiable evals" right now, us included. Signing the result is the easy link. It is also the one that proves the least.

---

## Four signatures, not one

An evaluation is a claim about a tuple: this model, on this dataset, through this harness, produced this result. Four things, four places to lie or err, four manifests.

<figure class="blog-chart">
  <img src="/images/charts/chart-attestation-chain.svg" alt="Diagram of four provenance manifests composing one attested evaluation: model, dataset, harness, result. Model and dataset are dashed amber outlines marked NOT BUILT; harness is half-toned and marked PARTIAL; result is solid sage green and marked SHIPPED, verifiable today. Each names one question it answers that the others cannot." loading="lazy">
  <figcaption>Each link answers a question the others structurally cannot. The RDI exploits live in link 3 — the harness and its sandbox. A benchmark that was written from one system's own output is a link 2 problem. Neither is reachable from link 4, however good the cryptography is.</figcaption>
</figure>

The honest position on that diagram is that we ship the rightmost box and part of the one beside it. The two on the left are roadmap. We would rather publish the diagram with the gaps drawn in than let the word "attested" do work it cannot do.

---

## An attestation that grades its own strength

Here is the design decision this whole post is really about.

A TrustRun manifest carries a field, `results.provenance.sourceKind`, with three values. The [open-source verifier](https://www.npmjs.com/package/@divinci-ai/trustbench-verifier) — MIT, no dependency on anything we control, runnable against a manifest and its outputs with no account — reports on it.

<figure class="blog-chart">
  <img src="/images/charts/chart-provenance-strength-ladder.svg" alt="Three-rung ladder of attestation strength. Top: measured, solid sage green, the harness invoked the model itself, no warning. Middle: republished, amber, the score was computed by an earlier run — what the Divinci retrieval boards currently carry. Bottom: stub, grey dashed, the score is fabricated and the model was never called. All three carry a valid signature; strict mode turns the lower two into failures." loading="lazy">
  <figcaption>All three have a valid signature. What separates them is what the document is willing to say about itself.</figcaption>
</figure>

Our two retrieval boards sit on the middle rung. The scores were computed by Divinci's scored-QA pipeline and republished into a signed TrustRun; the TrustBench harness did not invoke the model itself. Anyone who runs the verifier against those manifests gets told so, in these words:

> `results.provenance.sourceKind is 'republished': the score was computed by an earlier run, not by the evaluator execution this manifest attests`

We could have left the field out. The signature would still be valid, the boards would look identical, and approximately nobody would have asked. Instead the manifest volunteers the weakness, the verifier surfaces it, and `strict: true` turns it into a hard failure for any consumer who wants the stronger bar.

The `stub` rung exists for a reason that still bothers me. A transport fixture — a manifest whose score is a hash of two id strings, whose model was never called — verified *identically* to a real evaluation, on two live public URLs. The signature was genuinely valid, because it was genuinely our signature over a genuinely unmodified document. Nothing was broken. The format simply had no way to say "this is not a measurement," so it said nothing, and silence read as assent.

That is the general lesson, and it is not about cryptography at all: **a verification format that can only say "valid" will be used to imply things it never checked.** The useful ones grade their own strength and let the reader set the bar.

### Footnote: we checked whether the judge mattered

A fair objection to everything above: both boards were scored by
`gemini-2.5-flash`, which is a Google model ranking a board where Google's
Vertex retrieval comes first. And we could not point to evidence that judge is
any good — in our own calibration table it is the *anchor*, correlation 1.0
with itself and measured against nothing. Being the ruler is not the same as
being accurate.

So we re-scored every published row with a second judge from a different
family, `@cf/deepseek-ai/deepseek-v4-flash-0731`, against the **same stored
answers** — generation held fixed, the judge the only thing that moved. 420
judge calls, no failures.

Both boards rank identically, and no retrieval row moves by more than 0.016:

| row | gemini-2.5-flash | deepseek-v4-flash | Spearman ρ |
|---|---|---|---|
| Fuhrman · Vertex | 0.920 | 0.910 | 0.921 |
| Fuhrman · Qdrant | 0.884 | 0.892 | 0.908 |
| Fuhrman · Vectorize | 0.836 | 0.848 | 0.900 |
| Fuhrman · PageIndex | 0.384 | 0.375 | 0.876 |
| SDK · Vertex | 0.755 | 0.740 | 0.965 |
| SDK · Qdrant | 0.732 | 0.737 | 0.980 |
| SDK · no retrieval | 0.078 | 0.114 | **0.631** |

The ordering is not an artifact of who judged it. But look at the last row,
because it is the more interesting result: **agreement is not uniform across
the score range.** The two lowest-scoring rows are the two where the judges
agree least — the no-retrieval control disagrees on 17 of 60 items, against 2
of 60 for the top row. Judges concur on answers that are clearly grounded and
diverge on bad ones.

The practical consequence is a correction to how the headline should be read.
The *gap* between retrieval and no retrieval is robust. The baseline's exact
value is not — deepseek scores ungrounded answers about four points more
generously. Cite the gap, not the floor's third decimal.

And none of this shows either judge is right. Two judges agreeing is agreement,
not correctness; both can be wrong in the same direction. Only calibration
against a human anchor settles accuracy, and that is still open — which is
itself the honest version of a claim most leaderboards never make at all.

---

## Three ways a score quietly stops meaning anything

Building these boards turned up three failures that share a shape. None of them produced a wrong-looking number.

**A measurement loses its identity.** A row on a retrieval board claims: *this model, retrieving through this stack, scored X.* We had a publication path that averaged every result the suite had ever produced for that release — every replicate, every earlier sweep, every other retrieval backend the release had been tested against — and labelled the mean with whichever stack the release pointed at that day. It renders like any other row. Nothing about it looks wrong. The identity of a measurement lives in the document or it does not live anywhere, and a label is not a document.

**Errors with a direction survive review.** Our grader had a rule that failed any answer mentioning a passage id other than the expected one. Correct about hedging: naming every passage is not attribution. Wrong about the opposite case — a model that cites the right passage *and explains why another does not apply* was marked wrong. That is better attribution than a bare citation.

What makes this class dangerous is the direction. The error only ever suppressed passes, so scores moved the way a fix intends and the board looked stricter rather than broken. It was the third instance of that exact shape in one scorer. And every time, it marked down the models that explain their reasoning — which is the behaviour a buyer most wants. An eval whose errors are all conservative is not "safe"; it is systematically biased against legibility, and you cannot see it in the aggregate because the aggregate moves correctly.

**Reproducibility is a property of the spec, not the code.** The grading rules that matter — what counts as declining, as attribution, as ruling a passage out — travel *inside* the signed benchmark spec, so a third party reproduces our scores without running our software. We once added such a rule to the corpus, to both graders, and to the type, with every test passing, and it reached production in none of those forms: the serializer that builds the signed spec *enumerated* the fields it copied, and the new one was not on the list. Correct code, correct tests, a rule that could not fire on a single run.

Reading the code proved nothing. Asking the API what it actually serves settled it in one request. That habit — **ask what the system serves, not what the repository contains** — has caught more of these than any test we have written.

---

## The next link is the dataset, and we have our own mistake as the argument

Our first attempt at the nutrition board used an auto-generated question set. Thirty-five of its fifty questions referred to an unnamed speaker or scene: *"What event were the speakers attending last night?"* Those do not measure retrieval quality. They measure which transcript chunk a backend happened to surface.

Worse, and more subtly: the generator draws each expected answer from one release's own RAG pipeline. The benchmark was quietly a measurement of the system that produced it.

**No signature over the result would ever have caught that.** The runs were honest, the harness correct, the outputs hashed, the signature valid. The benchmark was simply born biased. The only thing that catches it is provenance over the *dataset* — which is why item-level content credentials are the next link and not a nice-to-have.

We replaced the set with hand-authored questions where every reference answer is pinned to a verbatim evidence substring of a real chunk, machine-checked. For the nutrition board the evidence had to be present in all four backends' copies of the corpus, or the comparison would be measuring ingestion differences and calling it retrieval. That constraint had a real cost, which the board discloses: eighteen of twenty-two book questions come from a single book, the only one whose body text survives in all four ingestions.

All of that was enforced by hand, by people, once. A dataset manifest is what turns it into something a stranger can check. Four questions it would make answerable, none of which a result signature can touch:

1. Who wrote this item, and were they qualified to?
2. Was the expected answer derived from a system under test?
3. Is the supporting evidence present in every corpus being compared?
4. Has this item leaked into training data?

The fourth is the one with the longest shadow. Contamination is currently argued about statistically, after the fact, with detectors. With per-item credentials it becomes a provenance query with an answer. [C2PA's 2.4 specification already ships AI and ML guidance](https://spec.c2pa.org/specifications/specifications/2.4/ai-ml/ai_ml.html), which means the dataset link has a live standard to conform to rather than a new one to invent — and we would rather adopt than invent. The same goes for W3C Verifiable Credentials for author identity and SLSA's language for pipeline attestation.

---

## Why this is not a 2030 argument

The usual objection to all of this is that it is infrastructure for a regulatory regime that has not arrived.

Partly, it already has. The EU AI Act has applied in general since 2 August 2026, and its general-purpose AI chapter has been in force since 2 August 2025 — which obliges providers of models with systemic risk to perform model evaluations, assess and mitigate risks, and keep technical documentation. That is an evaluation duty, live now.

The heavier documentation duty is dated rather than here. Annex IV — dataset documentation, validation reports, change logs, version control maintained across the lifecycle, which is near enough the manifest chain above written by lawyers instead of engineers — attaches to high-risk systems, and that schedule was **amended**: Article 6(2) and Annex III systems now fall due **2 December 2027**, and Annex I product-embedded ones **2 August 2028**. Anyone telling you Annex IV landed in August 2026 is reading the original timetable. We had it wrong here too until we read Article 113 instead of a summary of it.

Two and a bit years is not long to build an evidence chain that a regulator will accept, which is the actual argument for starting now.

Meanwhile the market it has to police runs largely on self-report. We went looking for a hard number — a widely repeated figure says only one of the hundred models on a major public leaderboard carries an independent verification badge — and could not stand it up: the site in question publishes no verification indicator at all today, so there is nothing to count. Quoting an unverifiable statistic in a post about verifiability would have been a nice way to refute ourselves.

The structural point survives without it, and matters more. A number from the company selling the model is a claim. The same number reproduced on a standardized harness is evidence. And because every vendor evaluates through its own scaffold — its own tool definitions, retry logic, context management, prompting — a self-reported score silently bakes that scaffold in.

Which leads somewhere we did not expect when we started, and is probably the most useful thing in this post.

**Everyone benchmarks models. Nobody benchmarks the scaffold.** Yet RDI's result says the scaffold decides the score, and self-reporting says the scaffold is invisible in nearly every published number. The missing instrument is a board that holds the model *fixed* and varies one coordinate of the stack — retrieval backend, chunking strategy, embedding model, reranker, parser, judge, guardrail, agent harness.

That is what the two boards at the top of this page are. It is also why the 0.078 row matters so much: in a component benchmark, the negative control is not a courtesy. It is the axis.

---

## What we are not claiming

In the spirit of the thing:

- Our published rows are `republished`, not `measured`. The manifests say so and the verifier warns about it.
- Several of our platform benchmarks are too small to rank on — some carry five samples or fewer, two carry exactly one. A one-sample benchmark can only ever score 0.0 or 1.0. They are not on any public board and should not be.
- Two of our earlier boards saturate: one puts twelve of sixteen models at exactly 1.0000. Twelve models "tied for first" teaches a reader nothing. That is a content problem, not a harness problem, and it is fixed by writing harder samples.
- We cannot currently run the closed frontier models as baselines. The harness has clients for three backends and those four are not among them.
- Both retrieval boards use one answering model. Two judges now agree on the ordering (see the footnote above), but neither is calibrated against a human rater, so accuracy is unestablished. On the nutrition board, the Vertex row searches a newer and larger ingestion than the other three.

None of that is fatal and all of it is written down. A benchmark that cannot state its own limitations is asking for the same trust it exists to replace.

---

## Where this goes

The order is: harness attestation, so a score can say the sandbox was not gamed. Then dataset provenance, so a benchmark can say who wrote it and where its answers came from. Then model provenance, so a result can say which weights produced it. Then the manifest format goes to the standards bodies, because a verification format owned by one company is just a second thing to trust.

Attestation says *this score is real*. It does not say *this model is safe*. Keeping those two apart is most of the work, and conflating them is how this entire category fails.

If you want to check any of it, nothing here requires an account. The [leaderboards](/trustbench/) are public, the [verifier](https://www.npmjs.com/package/@divinci-ai/trustbench-verifier) is on npm, and every row links to the manifest that contains its score. Fetch the manifest and its outputs, run `verify()`, and read the warnings — including ours.

---

**Related:** [Calibrating the Judge](/blog/calibrating-the-ai-judge/) on anchoring an LLM grader to a human rater · [Inside the RAG Arena](/blog/inside-the-rag-arena-scored-qa-routing/) on where these scored-QA runs come from · [Deleting Paris from a Language Model](/blog/deleting-paris-from-a-language-model/) on receipts for knowledge editing, which use the same attestation machinery.
