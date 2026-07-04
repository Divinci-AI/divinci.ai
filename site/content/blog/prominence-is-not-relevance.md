+++
title = "Prominence Is Not Relevance: Teaching a Storefront Assistant What to Recommend"
description = "An e-commerce assistant linked products correctly but recommended the wrong ones. The fix was discovering that decoration, ranking, and recommendation are three different problems — and that prominence is only ever a tiebreaker on relevance."
date = 2026-06-28T18:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Research"]
tags = ["RAG", "Product Recommendations", "E-commerce", "BM25", "Prominence", "Storefront", "LLM Generation", "Building in Public"]

[extra]
math = true
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
featured_image = "images/prominence-is-not-relevance-hero.png"
reading_time = 9
summary = "A storefront-backed AI assistant should recommend the products that actually help — and, among the ones that help, the store's go-to items. We built prominence weighting by crawling the storefront's own landing pages, then watched it recommend a weight-loss program for a diabetes question while ignoring the book literally titled 'The End of Diabetes.' The lesson: prominence and relevance are orthogonal axes, recommendation happens at generation time (not decoration time), and a featured list handed to an LLM becomes a directive unless you make it a tiebreaker. This is the journey from a static featured list to question-relevance with prominence as the tiebreaker, with the numbers from the live Dr. Fuhrman deployment."
title_display = "Prominence Is Not Relevance.<br>Teaching an Assistant What to Recommend."
+++

The whole feature is one score and one ordering rule.

**The prominence-boosted score** — a product's base match score, nudged by how prominent the storefront makes it:

<div class="math-block">
$$
\operatorname{boost}(b, p, \alpha) \;=\; b \cdot \bigl(1 + \alpha \cdot \operatorname{prom}(p)\bigr)
\quad\text{where}\quad
\operatorname{prom}(p) = \max\!\bigl(w_p,\; \mathbb{1}[p\ \text{featured}]\cdot 0.75\bigr) \in [0,1].
$$
</div>

**The ordering rule** — and this is the whole lesson — is that $b$, the relevance of the product to the user's actual question, comes *first*. Prominence ($\alpha = 0.25$, a 25% ceiling) only breaks ties among products that are *already* relevant. Invert that ordering — let prominence drive and relevance follow — and your nutrition assistant recommends a weight-loss program to someone asking about diabetes.

We know, because that's exactly what ours did. This is the post about why, and the fix.

---

## The setup

Dr. Joel Fuhrman's assistant runs on Divinci against his real catalog — 184 products: books, supplements, cooking programs. The storefront is [shop.drfuhrman.com](https://shop.drfuhrman.com). When a visitor asks the assistant a health question, the answer should do two things a good salesperson does: answer the question honestly, and — when a book or supplement genuinely helps — recommend it, preferring the store's go-to items where several would do.

That "two things" hides three separate engineering problems, and conflating them is the trap.

> **Decoration** — a product *mentioned* in the answer becomes a clickable link.
> **Ranking** — when several products match, which surface first.
> **Recommendation** — which products the assistant *names in the first place*.

Decoration was the easy, satisfying win. The model writes "books like *Eat to Live*," and a server-side pass resolves that exact prose span to the catalog product and hands the client a link. It bridges renames, SKU-titled books, and format variants. It looked great. It also lulled us into thinking the harder problem was solved — because a linked product *feels* like a recommended one.

It isn't. Decoration acts on the words the model already chose. Recommendation is upstream of that, at generation time. And nothing in the decoration pipeline can make the model say "Eat for Life" if the model never typed it.

## Weighting prominence from the storefront's own DOM

Before any of that mattered, we needed a notion of "prominent." The store already encodes it — in the order products appear on its landing pages. The homepage and the `/books-video/` category page put the featured items up top, in a `recommended-card`, and lay the rest out in a grid. So we crawl those pages and read prominence straight out of the markup.

```js
// Per landing page: featured recommended-cards, then the grid (by id and by slug).
parseLandingPageProducts(html) →
  - recommended-card anchors      → featured = true
  - data-product-id="…"           → grid position (BigCommerce id)
  - card-figure__link / card-title → grid position (url slug)
```

Each product's weight is its position, decayed, multiplied by the page's operator-set importance, and boosted if it's featured — taking the **max** across every page it appears on:

<div class="math-block">
$$
w_p \;=\; \max_{\text{pages}} \Bigl[\, \text{importance} \cdot \operatorname{decay}(\text{rank}) \cdot (\text{featured} \,?\, 1.3 : 1) \,\Bigr],
\qquad
\operatorname{decay}(r) = \max\!\Bigl(0.4,\; \tfrac{1}{1 + 0.12\,r}\Bigr).
$$
</div>

A rank-0 featured book lands at 1.0; a product buried 20 cards down floors at 0.4. The crawl is SSRF-guarded (operator-supplied URLs are public-http-only, DNS-resolved, redirect-revalidated) and idempotent: a product that drops off the storefront has its weight cleared on the next run, and an operator can **pin** a product so the crawl never touches its weight.

The first crawl of Dr. Fuhrman's catalog surfaced a subtlety worth its own paragraph. It weighted **4 of 184 products.** Only the featured recommended-cards matched. The grid — dozens of products — was being parsed and discarded, because we were matching grid items by their BigCommerce numeric id, and *none* of the catalog's 184 products carried one (they were CSV-imported). The grid cards all linked to product slugs, though, and every catalog product had a slug URL. One parser change — also read each grid card's `href` slug — took coverage from **4 to 44**, every one weighted by its real position on the storefront.

| product | prominence |
|---|---|
| Eat For Life | 1.00 ★ |
| Women's Daily +D3 | 1.00 |
| The Nutritarian Handbook | 1.00 |
| Transformation 20 | 0.96 ★ |
| Men's Daily +D3 | 0.89 |
| … (39 more, decaying to 0.40) | |

It worked. Prominence was real, deterministic, re-runnable. And it changed nothing about what the assistant recommended.

## The gap: prominence never reached generation

Here is the bug that took a customer's eye to catch. We'd wired prominence into two places: the tiebreak when classifying a product mention, and the ranking of the post-answer "sources." Both run *after* the model has written its answer.

Dr. Fuhrman looked at a response and said, roughly: *that's the right idea, but it didn't recommend "Eat for Life" — my current go-to book — even after the prominence calibration.*

Of course it didn't. The model wrote its recommendations from its RAG context and its training. Prominence weighting sat entirely downstream of that, decorating and re-ranking text the model had already committed to. We had built a system that could make "Eat for Life" *rank first if mentioned* — and had no way to get it mentioned.

Recommendation is a generation-time decision. To influence it, prominence had to reach the prompt.

## The over-correction

So we injected it. Before each answer, we built a "featured products" context item from the top-prominence items and added it to the generation context — *only* the generation context, never the stored answer or the displayed source bubbles. Enable it on the release, and the model now sees the store's go-to list and can recommend from it.

It recommended from it, all right. A visitor asked how to reverse type 2 diabetes and lower blood pressure. The answer mentioned **"10 in 20: Emergency Weight Loss Program" four times** — including a sentence that had stopped being English:

> *"…offers a structured approach to rapid, safe 10 in 20: Emergency Weight Loss Program - Paperback."*

The model was parroting the exact SKU title as a noun. And the genuinely relevant book — *The End of Diabetes*, whose text was sitting right there in the RAG context as a retrieved chunk — went unrecommended.

Two failure modes, one root cause. We had handed the model a list labeled, in effect, *these are the products to recommend* — and an LLM treats an explicit handed-to-it list as a directive, not a suggestion. Softening the wording ("prefer these where they genuinely fit") moved the repetition from four times to three. Cleaning the SKU suffixes ("Eat For Life" instead of "Eat For Life - Paperback") fixed the parroting. But the structural problem remained: **a global featured list makes prominence the primary driver of recommendation.** That is the exact inversion of the ordering rule we opened with.

## The fix: relevance first, prominence as the tiebreaker

The featured list was answering the wrong question. It asked "what are the store's top products?" when it should have asked "which products are relevant to *this question*, and among those, which does the store feature?"

We already had the second machine. The post-answer retro-matcher scores products against text with BM25 over title, keywords, description, and category — and we'd taught its ranker the prominence boost from the top of this post. Point it at the **question** instead of the answer, and it returns relevant products, prominence-tiebroken, before a single token is generated.

```js
// Generation-time injection, relevance-first:
const matches = matchProductsInResponse(question, catalog, {
  mode: "bm25-full", threshold: 0.3, maxProducts: 6,
});            // → already prominence-boosted in the ranker
// inject the cleaned, deduped names; fall back to top-prominence only
// when nothing is specifically relevant.
```

The injected context now frames itself honestly: *here are products you may recommend if — and only if — relevant; if none truly fit, recommend none.* Prominence is demoted to what it always should have been: the thing that decides between two books that both answer the question.

## The number

The fix lives or dies on whether BM25 over a short question is a good enough relevance signal. So before shipping, we ran the *actual* production matcher against the *actual* 184-product catalog and the diabetes question. Across thresholds from 0.2 to 0.4, it returned the same clean set:

| product | BM25 relevance |
|---|---|
| The End of Diabetes | **1.00** |
| Eat For Life | 0.91 |
| Eat to Live | 0.74 |
| The End of Heart Disease | 0.70 |
| *10 in 20: Emergency Weight Loss* | *— (below the cut)* |

There it is. *The End of Diabetes* — the book the customer said was missing — scores top. *The End of Heart Disease* surfaces for the blood-pressure half of the question. The weight-loss program, which has high storefront prominence but nothing to do with diabetes, falls below the cut on relevance and never enters the prompt. After natural-name cleaning and variant dedup, the model is handed four on-topic books and the instruction to use them only where they fit.

Relevance first. Prominence to break the ties. The weight-loss program loses not because it's unpopular — it's prominent — but because it isn't *relevant*, and relevance is the gate.

## What it cost, and what it still costs

Three honest notes, because building-in-public means showing the seams.

**It's a system with three loosely-coupled layers** — generation-time injection, post-answer retro-match, and span decoration — and the first two form a feedback loop: inject a product, the model names it, the retro-matcher surfaces it. Relevance-filtering the injection tamed the obvious failure, but the interaction wants watching.

**The threshold is a tuning knob, not a constant.** BM25 normalization shifts with corpus size and query length; 0.3 is comfortable *for this catalog and these questions*. We made it a per-release config field tunable without a redeploy, and we log the selected set on every turn, precisely because a single number won't be right forever. The more robust v2 is to skip BM25-on-question entirely and read the relevant products off the chunks the RAG retriever *already* pulled — embeddings beat keyword overlap on a six-word question.

**Prominence weights drift.** A storefront is a living thing; today's featured book is next quarter's backlist. Weighting is not set-and-forget. The operational coda is a periodic calibration job — re-crawl the landing pages, recompute prominence, and `HEAD`-check every product URL for dead links and redirects — on the same cron cadence that already drives our content connectors. Merchandising that updates itself.

## In summary

The bug that started all of this looked like a recommendation problem. It was really a problem of *which axis you optimize*. Prominence answers "what does the store push?" Relevance answers "what does this person need?" They are orthogonal, and a storefront assistant has to get both — relevance as the gate, prominence as the tiebreaker, decoration as the polish on top. Conflate them and you'll confidently recommend a diet program to a diabetic and link it four times. Order them correctly and the same catalog, the same crawl, the same model recommends the book literally written for the question.

The whole feature really is one score and one ordering rule. The rule was the hard part.

<!-- DRAFT — image placeholders: hero at static/images/prominence-is-not-relevance-hero.png.
     Candidate diagram: the three layers (decoration / ranking / recommendation) as a
     pipeline, or the relevance×prominence quadrant with the diabetes-question products plotted. -->
