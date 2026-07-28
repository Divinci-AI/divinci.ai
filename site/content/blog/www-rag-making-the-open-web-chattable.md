+++
title = "WWW-RAG: Making the Open Web Chattable, From One Machine"
description = "92 websites, 129,931 chunks, each site its own AI assistant — crawled, embedded, and published by a Rust daemon running on one machine. Here's how WWW-RAG works and where it's going."
date = 2026-07-17T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Research"]
tags = ["WWW-RAG", "Web Crawling", "RAG", "Rust", "Embeddings", "Turso", "libSQL", "Local-First AI"]

[extra]
math = false
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
title_display = "WWW-RAG: Making the Open Web<br>Chattable, From One Machine."
reading_time = 9
summary = "WWW-RAG is our public directory of real websites turned into individually chattable AI assistants — philosophy archives, space agencies, developer docs, law libraries, e-commerce stores. At launch: 92 sites, 92 releases, 129,931 chunks. The part we love: the entire corpus is crawled and embedded by a from-scratch Rust daemon running day and night on a single machine, at an embedding cost of roughly zero — because the local model produces embeddings bit-identical to the one our cloud already serves. This post is the tour: the crawler, the one-database-per-website architecture, the microsecond router that picks which sites to search, and the road from a public directory to every customer running this same pipeline on their own machine."
featured_image = "images/www-rag-directory-hero.webp"
hero_background = "images/www-rag-directory-hero.webp"
+++

---

## What WWW-RAG is

Point your browser at [the WWW-RAG directory](/www-rag/) and you'll find a growing shelf of real websites — the Internet Encyclopedia of Philosophy, NASA, the Linux man pages, Project Gutenberg's Australian mirror, the FAA, arxiv.org, a WooCommerce demo store, the National UFO Reporting Center — each one crawled, indexed, and standing behind its own AI assistant. Pick a site, ask it a question, and the answer comes grounded in that site's actual pages, with that site's own look: we even extract each site's brand palette from its live CSS so its assistant feels like it belongs to it.

<figure>
<img src="/images/marketing/www-rag/www-rag-blog-hero.png" alt="WWW-RAG directory hero: browse 92 chattable websites from philosophy archives to space agencies, each with its own AI assistant." width="1600" height="793" loading="eager">
<figcaption>The WWW-RAG directory — pick a site, open its assistant, ask it something grounded in that site's own pages.</figcaption>
</figure>

At launch the directory held **92 sites, 92 releases, and 129,931 chunks**. It grows on its own — a day/night crawl loop researches new candidate sites, crawls them, embeds them, generates a welcome message and conversation starters from the actual content, and publishes the result to the directory without a human in the loop.

<figure>
<img src="/images/marketing/www-rag/www-rag-blog-grid.png" alt="WWW-RAG directory grid of site cards — Internet Encyclopedia of Philosophy, NASA, Linux man pages, Project Gutenberg, FAA, and more." width="1600" height="793" loading="lazy">
<figcaption>Each card is a real crawl: isolated vector index, release, welcome message, and conversation starters — published straight from the one-machine daemon.</figcaption>
</figure>

And if one of these sites is *yours*, you can claim it — verify ownership with a DNS TXT record or a file upload, and the whole thing (vector index, release, assistant) transfers to your own workspace. Any user can also copy a site's index into their workspace and build on top of it. The directory is a library, a demo, and an on-ramp all at once.

## The part that makes it economically absurd (in a good way)

Here's the fact the whole system leans on: the embedding model we run locally through Ollama — `embeddinggemma`, 768 dimensions — produces vectors **bit-identical** to `@cf/google/embeddinggemma-300m`, the same model Cloudflare Workers AI serves in our cloud. We verified it directly: cosine similarity 1.0000 on test strings, both L2-normalized. Same weights, same space.

That one fact rearranges the economics of the entire project. It means one machine can crawl a website and embed every chunk *locally, for free* — and the resulting vectors land in exactly the vector space our cloud platform already queries. No re-embedding step. No paid embedding API in the ingestion path at all. A 90-site, 130k-chunk corpus costs electricity.

So that's what we do. The crawler is a from-scratch Rust binary (`www-rag-router`) that runs as a daemon on one machine:

- **BFS crawler**, same-origin by default with an eTLD+1 subdomain mode, robots.txt-respecting, with sitemap-following so pages buried behind pagination grids still get found.
- **A three-tier render chain** for JavaScript-heavy pages: Cloudflare Browser Rendering first, Firecrawl for the anti-bot holdouts, and a local headless Brave as the last-resort rescue lane. (Fun discovery: Cloudflare-protected sites serve Cloudflare's *own* renderer a "Just a moment…" challenge it can't solve. A local real browser often walks right through.)
- **Local embedding** via Ollama, straight into a local vector database per site.
- **Publish**: finished per-site databases push up to the platform, get a release, a welcome message, starters, and a directory card.

Every three hours the loop wakes up, researches a fresh seed topic ("astronomy and planetary science digital libraries" was a recent one), crawls whatever's new, and goes back to sleep.

## One database per website

Under every site in the directory is its own physically isolated vector database — libSQL/Turso, one file per host. We benchmarked the obvious alternatives first. A vector-DB collection per site works until it doesn't: the collection-per-tenant pattern hits documented scaling walls around a thousand collections. A single shared index with a payload filter is actually *fast* — but you give up physical isolation, and isolation is the point: a site you claim should be a thing we can hand you, not a slice of somebody else's index.

Turso's DB-per-tenant model is built for millions of mostly-idle databases, which is exactly the shape of a web directory. Retrieval quality held up under the switch — **99.4% top-K agreement** with our previous engine, 100% agreement on the top hit. And the disk-size worry dissolved with one setting: neighbor compression shrank a 1.2GiB index to **134MiB**, and query agreement actually went *up*, because quantization only touches the graph-traversal copies — the final distance comparison still runs on full-precision vectors.

<figure>
<img src="/images/charts/chart-wwwrag-index-compression.svg" alt="Bar chart: one site's libSQL DiskANN vector index shrinks from 1.2 GiB with full-precision neighbors to 134 MiB with float1bit neighbor compression — 9× smaller, with retrieval agreement going up rather than down." loading="lazy">
<figcaption>float1bit neighbor compression: 9× smaller on disk, with retrieval agreement <em>up</em> — quantization never touches the final distance comparison.</figcaption>
</figure>

The local corpus currently sits around 14GB across ~96 hosts. The largest single database is `en.wikipedia.org` at 2.5GB. It all fits on one machine, with room to spare.

## The router: picking which websites to ask

A directory of isolated per-site indexes raises an obvious question: when a query comes in, which sites do you search? Searching all ~90 defeats the purpose; picking one risks missing the answer.

Our answer is a centroid router. Each site's index summarizes itself as a handful of centroid vectors; at query time an in-memory router scores the query against every site's centroids and fans out to the top few in parallel. The routing step itself is essentially free — **60 microseconds mean, 156µs p99** — noise next to the ~100ms the embedding model takes to encode the query. And it's accurate where it counts: the right site appears in the top-4 picks **95%** of the time, and against a flat everything-in-one-index baseline, routed retrieval was quality-neutral — identical retrieved chunks on 18 of 21 test queries, zero judge losses on the rest.

<figure>
<img src="/images/charts/chart-wwwrag-router-recall.svg" alt="Bar chart: routing accuracy on a 21-site corpus — the correct website is the router's top-1 pick 76% of the time with one centroid per site, 90% with k=12 sub-centroids, and appears in the top-4 fan-out 95% of the time, which is what production uses." loading="lazy">
<figcaption>Routing accuracy on the 21-site benchmark corpus. The parallel top-4 fan-out — what production uses — finds the right site 95% of the time, at a routing cost of ~60µs.</figcaption>
</figure>

The pruning you get for free is the win: a query about medieval history never touches the FAA's index, and both sites' owners can reason about their own data in isolation.

## Making the corpus worth chatting with

Raw crawl output is not a good corpus, and the gap between the two is where a lot of the real work lives. Two examples we're proud of:

**Boilerplate is most of the web.** Every page of a site carries the same header, footer, cookie banner, newsletter prompt. Naïve chunking embeds all of it, over and over — we measured one documentation site at **84.9% exact-duplicate chunks** (a single footer, repeated 233 times). Cross-page dedup keeps the first occurrence and drops the rest: that site went from 33,251 chunks to 5,035 with zero information loss, and its retrieval got *sharper*, because a query can no longer land on the footer 233 different ways.

<figure>
<img src="/images/charts/chart-wwwrag-boilerplate.svg" alt="Bar chart: exact-duplicate chunk share measured per site before cross-page dedup — perldoc.perl.org 84.9% (a single footer repeated 233 times), justia.com 30.9%, planet4589.org 22.5%, postgresql.org 21.1%." loading="lazy">
<figcaption>Measured duplicate-chunk share on real crawls, before dedup. Boilerplate isn't an edge case — it's routinely a fifth to a third of a site, and occasionally most of it.</figcaption>
</figure>

**Structured data comes along for the ride.** The crawler reads schema.org JSON-LD as it goes, so an e-commerce site's crawl also yields a product catalog — names, prices, images — that its assistant can answer from directly. Crawl one WooCommerce store, get a shopping assistant.

The loop also knows when to stop. Each site keeps a persisted crawl graph, so a finished site costs approximately zero fetches on later passes — the crawler resumes from links it's never fetched rather than re-walking what it has. A site whose frontier is fully exhausted gets a 72-hour cooldown before we even look again, and a site that starts publishing new pages clears its own cooldown automatically. The steady state is a corpus that quietly deepens where there's more to find and leaves alone what's done.

(Did a system this autonomous produce some spectacular failure stories along the way? Absolutely — the time it took down our own health checks, and the time it confidently described a UFO-sightings archive as a wellness site, both deserve their own postmortem post. This isn't that post.)

## Where this is going

The directory is the public proof, but it's not the destination. Three threads we're actively pulling:

**The same pipeline, on your machine.** The crawler binaries now ship inside Divinci Desktop as sidecars. A customer can point the app at their own site, crawl and embed it *entirely on-device* — same Rust crawler, same local embeddinggemma, nothing leaves the machine — and then, if they choose, sync the finished index into their cloud workspace. Because of the embedding symmetry, the sync is just an upload: the cloud can query on-device vectors as-is. Local ingestion is free and uncapped, on the strength of the same economics that let us build the directory from one machine.

**A visual lane.** Text embeddings can't read a scanned PDF or a chart. We've been building a parallel visual pipeline (rendering pages and documents to tiles, embedding them with a vision model) that runs on the same local-first pattern — that work is early, but it's aimed at the same place: your documents, indexed on your hardware.

**More horsepower, same architecture.** Nothing about the design is machine-*specific* — it's just machine-*sufficient*, which is the claim we wanted to prove. The seed-research loop, the crawl graphs, the per-site databases all scale horizontally, and dedicated local-inference hardware slots in exactly where that one machine sits today.

The quiet thesis under all of it: the expensive half of RAG — crawling, parsing, embedding — doesn't need to happen in anyone's cloud, including ours. It can happen at the edge, on hardware you already own, in a vector space the cloud already speaks. WWW-RAG is us running that thesis in public, one website at a time.

**[Browse the WWW-RAG directory →](/www-rag/)** — pick a site and ask it something. No sign-up required.
