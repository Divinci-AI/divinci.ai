+++
title = "WWW-RAG: Making the Open Web Chattable, From One MacBook to Cloudflare"
description = "A Rust daemon on one MacBook published a dozen sites a day. The same pipeline now runs on Cloudflare, unattended, and publishes about a thousand."
date = 2026-07-17T09:00:00+00:00
updated = 2026-08-21T10:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Research"]
tags = ["WWW-RAG", "Web Crawling", "RAG", "Rust", "Embeddings", "Turso", "libSQL", "Cloudflare Workers", "Workflows", "Local-First AI"]

[extra]
math = false
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
title_display = "WWW-RAG: Making the Open Web Chattable,<br>From One MacBook to Cloudflare."
reading_time = 15
summary = "WWW-RAG is our public directory of real websites turned into individually chattable AI assistants — philosophy archives, space agencies, developer docs, law libraries, e-commerce stores. It began as a from-scratch Rust daemon crawling and embedding on a single MacBook, at an embedding cost of roughly zero. That machine reached 451 sites in two months. On 18 August 2026 the whole crawl→embed→publish path moved onto Cloudflare — Workers, Workflows, Browser Rendering, Workers AI — and added 3,505 more in the four days after. This post is the tour and the migration: what carried over unchanged, what broke on the way, and why the same embedding model on both sides meant not a single vector had to be recomputed."
featured_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/www-rag-directory-hero.webp"
# The /www-rag/ hero, reused: the webp is the poster and the LCP element,
# the webm fades in over it. hero_background (not hero_video_poster) is what
# selects the raw, no-cream-wash treatment — see blog-post.html.
hero_background = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/www-rag-directory-hero-poster.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/www-rag-directory-veo31.webm"
# The list thumbnail. Without it the card is a <video preload="none"> with
# no poster — i.e. BLANK, which is what adding hero_video did to it. The
# typeset OG card was the other candidate and reads worse here: the grid
# already prints the title under the image, so it appeared twice, at a size
# too small to read. Every other card in the grid is plain art.
card_image = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/www-rag-directory-hero-poster.webp"
+++

---

## What WWW-RAG is

Point your browser at [the WWW-RAG directory](/www-rag/) and you'll find a shelf of real websites — the Internet Encyclopedia of Philosophy, NASA, the Linux man pages, Project Gutenberg's Australian mirror, the FAA, arxiv.org, a WooCommerce demo store, the National UFO Reporting Center — each one crawled, indexed, and standing behind its own AI assistant. Pick a site, ask it a question, and the answer comes grounded in that site's actual pages, with that site's own look: we even extract each site's brand palette from its live CSS so its assistant feels like it belongs to it.

Measured on **21 August 2026**: **3,958 sites · 967,346 pages · 22,003,475 searchable chunks**, about 7.7 GB of extracted text. Those numbers were out of date by the time you read this sentence, which is the point of the rest of the post.

<figure>
<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/marketing/www-rag/www-rag-universe-2026-08.webp" alt="The RAG Universe: a force-directed map of 3,958 crawled websites, sites positioned near the sites they resemble, with hyperlink and semantic edges drawn between them." width="1600" height="595" loading="eager">
<figcaption>Every site in the corpus, positioned by what it's about. Sites sit near the sites they resemble; the outer ring is the ones whose embeddings haven't been computed yet — their position means nothing, and saying so is cheaper than pretending otherwise.</figcaption>
</figure>

And if one of these sites is *yours*, you can claim it — verify ownership with a DNS TXT record or a file upload, and the whole thing (vector index, release, assistant) transfers to your own workspace. Any user can also copy a site's index into their workspace and build on top of it. The directory is a library, a demo, and an on-ramp all at once.

## How it started: one machine, and an economic accident

The first version of this was a from-scratch Rust binary (`www-rag-router`) running as a daemon on a single MacBook. Every three hours the loop woke up, researched a fresh seed topic ("astronomy and planetary science digital libraries" was a real one), crawled whatever was new, embedded it, generated a welcome message and conversation starters from the actual content, and published to the directory with no human in the loop.

It could do that because of one fact the entire project leaned on: the embedding model we ran locally through Ollama — `embeddinggemma`, 768 dimensions — produces vectors **bit-identical** to `@cf/google/embeddinggemma-300m`, the model Cloudflare Workers AI serves in our cloud. We verified it directly: cosine similarity 1.0000 on test strings, both L2-normalized. Same weights, same space.

That rearranged the economics of the whole thing. One machine could crawl a website and embed every chunk *locally, for free*, and the resulting vectors landed in exactly the vector space our cloud platform already queries. No re-embedding step. No paid embedding API in the ingestion path at all. A 90-site corpus cost electricity.

<figure>
<img src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/marketing/www-rag/www-rag-blog-grid.webp" alt="The WWW-RAG directory in July 2026 — a grid of site cards including the Internet Encyclopedia of Philosophy, NASA, the Linux man pages, Project Gutenberg and the FAA." width="1600" height="793" loading="lazy">
<figcaption>The directory in late July, when this post was first written: 92 sites, hand-seeded, all of them published by a daemon on one laptop.</figcaption>
</figure>

## The wall

The laptop worked, and then it stopped being the right answer — for a reason that had nothing to do with the machine's speed.

We netted 24 hours of the shared wallet's ledger on 17 August and found the cost was not where anyone assumed:

| driver | net / day | share |
|---|---|---|
| the daemon's crawl (`fetch-scraper`) | **−$58** | 77% |
| evaluation scoring | −$13.64 | 18% |
| all embedding and file processing | −$4.45 | 6% |

Two things follow, both against the assumption we'd been operating on. **Anonymous chat on published sites cost nothing** — zero chat transactions in 24 hours across 472 listed sites. Publishing a site is nearly free; *crawling* is the expense. So throttling publication to save money was exactly backwards.

And the crawl was expensive in the one place we could actually move. Cloudflare's Browser Rendering does the same fetch for roughly **$0.0007 per host**, billed to the Cloudflare account rather than the wallet — against about $15 of wallet per laptop pass. That is not a tuning difference; it is a different order of magnitude, and it pointed at the same conclusion the reliability argument did. A crawler that lives on one laptop stops when the lid closes.

⚠️ One methodological note, because it nearly produced the wrong headline: **net the ledger before quoting any number.** Gross debits read $1,466/day with evaluation scoring at 88% of it — but that is reserve-then-settle churn that nets to $13.64. The balance is a sawtooth, not a drain. Sum each transaction's parts and subtract deposits, or a $100 top-up hides the burn entirely.

## The move: no laptop in the loop

The whole crawl→embed→publish path now runs as a Cloudflare Worker plus a Workflow. There is no container fleet and no Rust binary in production, because once we listed the steps honestly, every one of them was already an HTTP call or trivial string work:

| step | on the laptop | on Cloudflare |
|---|---|---|
| crawl | Browser Rendering REST | the same call |
| chunk | `okf.rs` + `crawl.rs` | ~40 lines of JS |
| embed | Ollama, locally | native Workers AI binding |
| write the index | already the Turso HTTP API | the same |
| register + release | Divinci REST | the same |

A cron fires every two minutes and tops the fleet back up to **64 concurrent sites**, each crawled to a 300-page depth. It is a top-up rather than a batch, so ticks can't stack, and at steady state the launch rate is set by how fast crawls finish rather than by how often we look.

The payoff from the original design is that the embedding model **did not change**. It is the same `@cf/google/embeddinggemma-300m` on the cloud side that Ollama was serving on the laptop side, which is why the migration required re-embedding exactly zero of the vectors already published. The symmetry that made one machine viable is the same symmetry that made leaving it a non-event.

<figure>
<img src="/images/charts/chart-wwwrag-daily-publishes.svg" alt="Bar chart of sites published to the WWW-RAG directory per day. Through July and mid-August the laptop daemon publishes a median of 11 sites on a publishing day. From 18 August, when the Cloudflare pipeline takes over, daily publication jumps to 602, then 1,241, then 992." loading="lazy">
<figcaption>Counted by the day each site's index was created. The laptop reached 451 sites in two months; the Cloudflare pipeline added 3,505 in the four days after cutover. 21 August is a partial day.</figcaption>
</figure>

## Three things that broke on the way

**A Workflows step is capped at about five minutes, and does not say so.** The crawl step used to poll a Browser Rendering job to a 25-minute deadline inside a single step, declaring a 30-minute timeout. The platform cannot honour that: the step is reclaimed at roughly five minutes and fails with `WorkflowInternalError: Attempt failed due to internal workflows error`, which names neither the cap nor the step. Every host whose crawl took longer than five minutes was therefore *structurally impossible to ingest*, while faster hosts sailed through — which made a deterministic design fault look exactly like platform flakiness. The shape that works is submit → sleep → short poll → repeat, because `step.sleep()` suspends the instance and costs no step duration.

That bug also invalidated a conclusion we'd already drawn. `archive.org` was believed to have an unfinishable crawl frontier, and that belief had motivated an entire early-abort guard. Every observation behind it had been truncated at five minutes by this cap. With the cap understood, archive.org publishes fine. **A generic platform error is a claim to verify, not a diagnosis to accept** — and a retry budget added to absorb one will happily hide it forever.

**The chunker had to stay byte-native and linear.** Two details, both load-bearing. Rust's `str::len()` counts bytes and JavaScript's `.length` counts UTF-16 units, so a naïve port let multi-byte pages through at up to three times the intended chunk size. And the obvious implementation — for each character, slice the prefix and measure its byte length — is O(n²), which blew the Worker CPU limit on the very first real page. The version that works encodes once and scans bytes linearly, which UTF-8 makes safe: a character boundary is just "not a continuation byte", and every character we cut on is ASCII.

The acceptance test for that port was never the unit tests. It was parity against the Rust path on a real site: `nasa.gov`, 120 pages, 3,319 chunks, matching exactly. Without cross-page dedup the same input returns 14,818 — so the number itself is the regression test.

**A Workflow step output is a published surface.** The provisioning step returned the site's database token, which put a full-access write credential into persisted workflow state, readable by anyone who could describe the instance. Keeping a credential out of the *final* result is not enough; the step is the leak. The fix is to mint a fresh short-lived token inside each step that needs it — one extra API call, nothing persisted.

## Permission runs before the crawler, not after

Every host goes through an AI-rights check *before* a single browser-second is spent, so a site that refuses costs nothing. The distinction that gate encodes is the one the whole initiative rests on:

**A training refusal is not about us.** We build a retrieval index over a site's own content and cite it back to the site. We do not train on it. A host whose policy says `search=yes, ai-train=no, use=reference` has permitted precisely what we do, and refusing them would decline work they explicitly allowed. A host that refuses inference-time retrieval is refusing *our* use, and we don't publish it.

A refusal we cannot read is treated as a refusal. And when we found published sites whose policy had since changed to refuse, that became a human decision rather than an automatic one — which is the right way round, but it does mean somebody has to make it promptly.

There is one trap worth naming for anyone building the same gate: a plain `fetch()` from a Worker gets 403'd by origins that serve `robots.txt` to everyone else. That is our egress being filtered, not their policy — and reading it as policy means recording a refusal the site never made.

## The parts that didn't change

**One database per website.** Under every site is its own physically isolated vector database — libSQL/Turso, one per host. We benchmarked the alternatives first. A collection per site hits documented scaling walls around a thousand collections. A single shared index with a payload filter is genuinely fast, but you give up physical isolation, and isolation is the point: a site you claim should be a thing we can hand you, not a slice of somebody else's index. Retrieval quality held under the switch at **99.4% top-K agreement**, 100% on the top hit.

<figure>
<img src="/images/charts/chart-wwwrag-index-compression.svg" alt="Bar chart: one site's libSQL DiskANN vector index shrinks from 1.2 GiB with full-precision neighbors to 134 MiB with float1bit neighbor compression — 9× smaller, with retrieval agreement going up rather than down." loading="lazy">
<figcaption>float1bit neighbor compression: 9× smaller on disk, with retrieval agreement <em>up</em> — quantization never touches the final distance comparison.</figcaption>
</figure>

**The router.** A directory of isolated per-site indexes raises the obvious question: when a query arrives, which sites do you search? Each site's index summarizes itself as a handful of centroid vectors, and an in-memory router scores the query against every site's centroids and fans out to the top few in parallel. Routing costs **60 microseconds mean, 156µs p99** — noise next to the ~100ms of encoding the query — and on the 21-site benchmark corpus the right site is in the top-4 fan-out **95%** of the time, quality-neutral against a flat everything-in-one-index baseline.

<figure>
<img src="/images/charts/chart-wwwrag-router-recall.svg" alt="Bar chart: routing accuracy on a 21-site corpus — the correct website is the router's top-1 pick 76% of the time with one centroid per site, 90% with k=12 sub-centroids, and appears in the top-4 fan-out 95% of the time, which is what production uses." loading="lazy">
<figcaption>Routing accuracy on the 21-site benchmark corpus. The parallel top-4 fan-out — what production uses — finds the right site 95% of the time, at a routing cost of ~60µs.</figcaption>
</figure>

**Boilerplate is still most of the web.** Every page of a site carries the same header, footer, cookie banner, newsletter prompt. Naïve chunking embeds all of it, over and over — we measured one documentation site at **84.9% exact-duplicate chunks**, a single footer repeated 233 times. Cross-page dedup keeps the first occurrence and drops the rest: that site went from 33,251 chunks to 5,035 with zero information loss, and its retrieval got *sharper*, because a query can no longer land on the footer 233 different ways.

<figure>
<img src="/images/charts/chart-wwwrag-boilerplate.svg" alt="Bar chart: exact-duplicate chunk share measured per site before cross-page dedup — perldoc.perl.org 84.9% (a single footer repeated 233 times), justia.com 30.9%, planet4589.org 22.5%, postgresql.org 21.1%." loading="lazy">
<figcaption>Measured duplicate-chunk share on real crawls, before dedup. Boilerplate isn't an edge case — it's routinely a fifth to a third of a site, and occasionally most of it.</figcaption>
</figure>

**Structured data still comes along for the ride.** The crawler reads schema.org JSON-LD as it goes, so an e-commerce crawl also yields a product catalog — names, prices, images — that its assistant can answer from directly. Crawl one WooCommerce store, get a shopping assistant.

## The map

Once there were a few thousand sites, the interesting question stopped being "what's in the corpus" and became "what shape is it". So the pipeline now emits two graphs it was already computing: the hyperlinks it finds between crawled sites while crawling them, and the semantic distances between site centroids.

That's [The RAG Universe](/www-rag/) — 3,958 nodes, 36,042 hyperlinks found between sites, 8,831 semantic ties above a 0.45 cosine floor, sized by pages indexed. Sites drift toward the sites they resemble, so clusters form without anyone labelling a category.

The part we're most careful about is what it admits it doesn't know. Embeddings exist for 3,681 of 3,958 sites and link scans for 3,486; the rest sit on an outer ring, and the caption says outright that their position carries no meaning yet. A visualization that quietly places unmeasured things in meaningful positions is worse than one that leaves them out, because it looks like a finding.

## Where this is going

**The same pipeline, on your machine.** The crawler binaries ship inside Divinci Desktop as sidecars. Point the app at your own site, crawl and embed it entirely [on-device](/local-inference/) — same crawler, same local embeddinggemma, nothing leaves the machine — then sync the finished index into your cloud workspace if you choose. Because of the embedding symmetry, that sync is just an upload. The cloud queries on-device vectors as-is. Moving the public crawl to Cloudflare did not weaken this argument; it demonstrated it, in the other direction, on the same vectors.

**A second vector backend.** Everything above writes to Turso. We're piloting Cloudflare Vectorize as a parallel backend on a small share of new sites — currently under 1% — so that the corpus stops depending on a single primary. The interesting part is that the routing layer doesn't need to know: a site's backend is resolved at publish time and the retrieval path is identical either way.

**A visual lane.** Text embeddings can't read a scanned PDF or a chart. A parallel pipeline that renders pages and documents to tiles and embeds them with a vision model is early, but aimed at the same place: your documents, indexed on your hardware.

The quiet thesis hasn't changed, and moving to Cloudflare is what tested it. The expensive half of RAG — crawling, parsing, embedding — doesn't need to happen in any *particular* place, including ours. It needs to happen in a vector space that everything downstream already speaks. Get that right and the same corpus can be built on a laptop for the price of electricity, or on an edge network at a thousand sites a day, and nothing above it has to care which.

**[Browse the WWW-RAG directory →](/www-rag/)** — pick a site and ask it something. No sign-up required.
