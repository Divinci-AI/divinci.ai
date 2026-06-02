+++
title = "The Future of RAG Systems: Beyond Simple Document Retrieval"
description = "Where RAG is heading: scored-QA routing, vector arenas, live competitive evaluation. May 2026 — RAG is now a routing problem, not a pipeline one."
date = 2025-05-01T09:00:00+00:00
updated = 2026-05-27T10:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Artificial Intelligence"]
tags = ["RAG Systems", "AI Architecture", "Vector Embeddings", "LLMs", "Document Retrieval"]

[extra]
author = "Michael Mooring"
author_avatar = "images/Michael-Mooring.png"
featured_image = "images/autorag-still.png"
reading_time = 8
summary = "Retrieval-Augmented Generation (RAG) systems have revolutionized how AI models access and reason over large datasets. In this article, we explore the next generation of RAG technology and how it's enabling more sophisticated AI applications that go beyond simple document retrieval."
+++

Retrieval-Augmented Generation (RAG) has emerged as one of the most transformative applications of Large Language Models (LLMs), enabling AI systems to access and reason over vast knowledge bases that extend far beyond their training data[^1]. However, as organizations deploy RAG systems at scale, the limitations of first-generation approaches are becoming increasingly apparent. As we move into 2025, RAG is firmly positioned not merely as a booster of accuracy but as an essential framework for reliable, updatable, and auditable language agents[^2].

## 📰 May 2026 Update — RAG Is Now a Routing-and-Orchestration Problem, Not a Pipeline-Engineering One

This post first published in May 2025. In the year since, the centre of gravity in RAG has shifted from *what's in the pipeline* to *what's in the router that picks the pipeline*. The components we described — multi-stage retrieval, RAPTOR-style hierarchies, query decomposition, recursive retrieval — are still correct primitives. They are now sub-routines inside larger systems that **wrap them in agents, score them with reflection critics at runtime, and dispatch them against a portfolio of retrievers (flat vector, knowledge-graph, visual-document, and 2M-token long-context) per-query rather than per-system**[^rag-survey-2026]. Below is what landed since publication and what to retire from the original framing.

<figure style="margin: 2rem 0; overflow-x: auto;">
<table style="width: 100%; border-collapse: collapse; font-size: 0.92rem;">
<thead>
<tr style="background: #2d5a4f; color: #faf8f5;">
<th style="padding: 0.7rem 0.9rem; text-align: left;">RAG primitive (May 2025 framing)</th>
<th style="padding: 0.7rem 0.9rem; text-align: left;">Mid-2026 status</th>
</tr>
</thead>
<tbody>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Multi-stage retrieval pipelines</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Still the workhorse. Anthropic's <strong>Contextual Retrieval</strong> + hybrid BM25 / vector / reranker is the new assumed baseline[^contextual-retrieval-2024].</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Recursive retrieval / RAPTOR</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Subsumed into <strong>Agentic RAG</strong> — recursion is now driven by a planning agent, not a fixed pipeline[^rag-survey-2026][^sok-agentic-2026].</td></tr>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Query decomposition</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Generalised to <strong>System-1/System-2 reasoning RAG</strong> — the agent decides when, what, and how to retrieve[^reasoning-rag-2025].</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Multi-modal RAG</strong></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;">Visual-document RAG via <strong>ColPali / ColQwen</strong>[^colpali-2024][^vidore-v2-2025] and unified text + image + video + audio + PDF embeddings via <strong>gemini-embedding-2</strong> (March 2026)[^gemini-embedding-2] — Divinci's vector indexes consume both.</td></tr>
<tr style="background: #faf8f5;"><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><em>(Not in the original post — emerged after.)</em></td><td style="padding: 0.7rem 0.9rem; border-bottom: 1px solid #d6c7a8;"><strong>Graph RAG</strong>: Microsoft <strong>LazyGraphRAG</strong> + GraphRAG 1.0 cut indexing to ~0.1% of full-graph cost[^lazy-graphrag-2024][^graphrag-1-2025]. <strong>LightRAG</strong> (HKU) and <strong>HippoRAG</strong> are the cheaper / faster alternatives.</td></tr>
<tr style="background: #eae3d5;"><td style="padding: 0.7rem 0.9rem;"><em>(Not in the original post — settled this year.)</em></td><td style="padding: 0.7rem 0.9rem;"><strong>Long-context vs RAG</strong> debate: settled in favour of <em>routing</em>. RAG for simple queries; long-context (Gemini 3 Pro Deep Think, 2M tokens) for complex multi-hop. Multi-needle benchmarks still trail single-needle by 15–40 points[^u-niah-2025].</td></tr>
</tbody>
</table>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">A year of architecture shift, summarised. Citations link to primary sources at the bottom of this post.</figcaption>
</figure>

### What changed most: Agentic RAG as a named architecture

The most consequential development since May 2025 is the consolidation of *Agentic RAG* from a loose pattern into a named architecture with its own taxonomy and survey literature. Singh et al.'s "Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG"[^rag-survey-2026] taxonomises the space by **agent cardinality, control structure, autonomy, and knowledge representation**, folding reflection, planning, tool use, and multi-agent collaboration into one analytical frame. The follow-up "SoK: Agentic Retrieval-Augmented Generation"[^sok-agentic-2026] adds a systematisation around planning mechanisms, retrieval orchestration, memory paradigms, and tool-invocation behaviours.

What this means concretely: instead of writing *one* RAG pipeline and tuning it, mid-2026 production systems write a *planner* that selects among several retrievers, decides whether to retrieve at all (sometimes the model knows enough), and re-queries when the first retrieval came back weak. LangGraph has emerged as the de-facto runtime for this pattern.

### Self-correcting RAG productionised

The post's discussion of "contextual re-ranking" generalised into runtime self-correction. **Self-RAG** (Asai et al., 2023[^self-rag-2023]) introduced reflection tokens that let the model critique its own retrievals; **CRAG** (Corrective RAG, Yan et al.[^crag-2024]) added an external lightweight retrieval evaluator with three corrective paths (correct / incorrect / ambiguous). In 2025–2026 the pattern moved from research to production: route every retrieval through a critic node, re-query on low-confidence chunks, and feed RAGAS-style scores back into the gate at runtime rather than only offline.

This is the same logic our [post on automated regression testing](/blog/automated-regression-testing-for-custom-llms-in-2026/) describes for *evaluating* RAG systems — but here it runs **inside** the retrieval loop, not only in CI.

### Graph RAG matured fastest

Of any sub-area, knowledge-graph retrieval moved fastest in the last twelve months. **Microsoft LazyGraphRAG**[^lazy-graphrag-2024] (now in Azure / Microsoft Discovery) defers community summarisation until query time, dropping indexing cost to approximately **0.1% of full GraphRAG** while matching quality. **GraphRAG 1.0**[^graphrag-1-2025] is the production-grade ergonomics release. **LightRAG** (HKU) offers flat-graph dual-mode retrieval at roughly 1% of GraphRAG's cost; **HippoRAG**'s neurobiologically-inspired memory cuts multi-hop reasoning costs by 10–30×. **GraphRAG-Bench** (ICLR 2026, arXiv:2506.05690) gives the empirical decision rule: **graph value scales with query complexity**[^graphrag-bench-2026].

For most production RAG deployments at the scale we see, the right answer in 2026 is a hybrid: flat vector for the long tail of simple lookups, graph retrieval for the small share of complex multi-hop queries that justify the indexing overhead.

### Long-context vs RAG: settled as routing, not replacement

When the May 2025 post published, the open question was whether 2M-token context windows would obsolete RAG. **The debate is settled — in favour of routing.** Gemini 3 Pro Deep Think reaches 2M tokens and competitive single-needle scores, but multi-needle scores still trail single-needle by 15–40 points on U-NIAH benchmarks[^u-niah-2025], and the economics are decisive: roughly **$1.25 per 500K-token Gemini query versus cents for RAG**. Prompt caching reduces the gap by about 90% but does not close it. The "lost in the middle" failure mode replicates across all major model families through 2025.

The mid-2026 architecture is therefore: **route simple queries to RAG; route complex multi-hop or unstructured queries to long-context; route visual-document queries to ColPali**[^colpali-2024]**; route knowledge-graph queries to GraphRAG.** The original post's framing of "the optimization problem that replaces 'pick a RAG architecture'" is exactly right — the optimisation now spans more retrievers than it did then.

### Visual-document RAG went production-ready — and unified-modality embeddings landed

**ColPali**[^colpali-2024] (Faysse et al., 2024) introduced VLM late-interaction embeddings directly over rendered document pages, removing the ingestion / OCR step entirely. **ViDoRe Benchmark V2** (May 2025[^vidore-v2-2025]) raised the bar on visual retrieval. **ColQwen2** averages around 90% on ViDoRe, and **REAL-MM-RAG** (Feb 2025) added a real-world multi-modal benchmark. For PDF-heavy or table-heavy corpora, visual-document RAG is now the production default; the OCR-then-chunk pipeline the original post implied is no longer state-of-the-art.

In March 2026, Google's **gemini-embedding-2**[^gemini-embedding-2] collapsed the visual / video / audio / text split into a single embedding space — the model accepts text up to 8,192 tokens, up to six images per request, video up to 120 seconds, native audio, and PDFs up to six pages, and produces a 3,072-dimension embedding (scalable down to 1,536 or 768 via Matryoshka Representation Learning). It ships through both the Gemini API and Vertex AI, with first-party integrations into LangChain, LlamaIndex, Haystack, Weaviate, Qdrant, ChromaDB, and Vertex Vector Search. Google's announcement positions it as <q>outperforming leading models in text, image, and video tasks</q>, with Paramount Skydance reporting Text-to-Video Recall@1 of 85.3% on their internal benchmark.

For Divinci specifically, the practical consequence is that our vector indexes can ingest text, image, video, and audio in a single retrieval space — we ship `gemini-embedding-2` as an embedding option across the same ten backends our [RAG Routing](/rag-routing/) page lists, which means a customer's mixed-modality corpus (e.g., a legal team that has contract PDFs, signed-contract scans, and recorded negotiation calls in the same workspace) can be queried through one retrieval call instead of three.

Video and audio retrieval are no longer research-stage — they share an embedding space with text now.

### Production RAG patterns — managed services and contextual retrieval

The other large 2025–2026 shift is that production teams are increasingly consuming RAG as a managed service rather than rolling their own.

- **Cloudflare AutoRAG** entered open beta in April 2025 and was rebranded as **Cloudflare AI Search** later in the year[^cloudflare-autorag-2025][^cloudflare-ai-search-2026], delivering managed ingestion → chunking → embedding → Vectorize → Workers AI generation. We use a different mix at Divinci — D1 with FTS5 plus external embedding APIs — but the broader market is consolidating around managed offerings (also AWS Bedrock Knowledge Bases, Vertex AI Search).
- **Anthropic Contextual Retrieval** (announced September 2024 and widely deployed through 2025[^contextual-retrieval-2024]) made *per-chunk explanatory context prepended pre-embedding* the assumed baseline. Hybrid BM25 + dense vector + reranker is no longer "advanced"; it is what a competent RAG team ships on day one.

### Evaluation moved from offline RAGAS to online auto-evaluation gates

The post called for better RAG evaluation. In 2025–2026 the field delivered. **MIRAGE** (Findings of NAACL 2025[^mirage-2025]) introduced 7,560 retrieval-evaluation instances across a 37,800-entry pool, with metrics for noise vulnerability, context acceptability, context insensitivity, and context misinterpretation. **MIRAGE-Bench** (NAACL 2025[^mirage-bench-2025]) added multilingual coverage across 18 languages. **RAGAS** remains the production default for faithfulness, relevance, and context precision — but the 2026 pattern is to run RAGAS as an *online* retrieval gate, not just offline eval. This is the same pattern we describe in our [regression-testing post](/blog/automated-regression-testing-for-custom-llms-in-2026/) and operationalize in the [CI testing post](/blog/ci-testing-for-custom-language-models-in-2026/).

### What to retire from the original post

The May 2025 framing held up better than we expected, but two specific points need updating:

1. **"Static retrieval strategies are most RAG implementations"** — true a year ago, much less true now. Agentic dispatch is the new default for any team building above the proof-of-concept stage.
2. **The implicit assumption that OCR-then-chunk is how PDF-heavy corpora work** — superseded by ColPali / ColQwen visual retrieval for the leading deployments.

The original sections on multi-stage pipelines, query decomposition, and recursive retrieval are still correct. They are now wrapped in agents, scored online, and chosen per-query from a portfolio rather than configured once per system.

### The mid-2026 RAG architecture, summarised

A production RAG system in mid-2026 looks like:

1. A **planner / router** (LangGraph-orchestrated) that classifies the incoming query.
2. A **portfolio of retrievers** — flat vector (with hybrid BM25 + dense + reranker baseline), graph retrieval (LazyGraphRAG / LightRAG / HippoRAG for the complex tail), visual-document (ColPali / ColQwen), and long-context (Gemini / Claude for the unstructured queries where retrieval doesn't apply).
3. A **runtime critic** (Self-RAG / CRAG-style) that scores each retrieval and triggers re-query on low confidence.
4. An **online evaluation gate** (RAGAS / MIRAGE) that surfaces faithfulness / hallucination metrics in production, not just CI.
5. A **calibrated judge** for any LLM-as-judge scoring that feeds the gate, refreshed weekly against human labels.

The May 2025 post described one of these pieces (the pipeline). The mid-2026 reality is the orchestration around it.

## 🧭 Divinci's RAG Routing — One API, Three Architecturally Distinct Stacks

If the mid-2026 RAG architecture is *routing-and-orchestration*, the load-bearing question becomes: **what does the router actually choose between?** This is the piece where our approach diverges from the published literature.

Every named RAG router we surveyed routes along the **depth axis**: should I retrieve once, multiple times, or not at all? Adaptive-RAG[^adaptive-rag-2024], Probing-RAG[^probing-rag-2025], R2RAG[^r2rag-2025], LTRR (Learning to Rank Retrievers)[^ltrr-2025], and RAGRouter-Bench[^ragrouter-bench-2026] all classify queries by reasoning complexity and dispatch to deeper-or-shallower variants of *the same retrieval architecture*. LangGraph's "Adaptive RAG" template routes between *no-retrieval / vector / web-search* — again, by source and depth.

**Divinci's RAG routing axis is orthogonal: we route between three architecturally distinct retrieval stacks, selected by the shape of the query, behind one API endpoint.**

<figure style="margin: 2.5rem 0;">
<svg viewBox="0 0 1200 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet" style="width: 100%; max-width: 100%; height: auto;" role="img" aria-label="Three-tier RAG routing: flat-vector, hybrid BM25+dense+rerank, page-index + agentic traversal">
<rect width="1200" height="600" fill="#faf8f5"/>
<text x="600" y="36" font-family="'DM Sans', -apple-system, sans-serif" font-size="22" font-weight="700" fill="#1e3a2b" text-anchor="middle">Divinci RAG Routing — three architectures, one endpoint</text>
<text x="600" y="60" font-family="'DM Sans', -apple-system, sans-serif" font-size="13" fill="#5a6862" text-anchor="middle">The router classifies the query and dispatches to the cheapest tier that can answer it correctly</text>
<g transform="translate(60, 88)">
<rect x="0" y="0" width="1080" height="60" fill="#1e3a2b" rx="6"/>
<text x="540" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Incoming query → Router (query-shape classifier)</text>
<text x="540" y="46" font-family="'DM Sans', sans-serif" font-size="11" fill="#c8d8d0" text-anchor="middle">factual? hybrid signal? multi-hop / long-document?  →  pick the cheapest tier that handles it</text>
</g>
<g transform="translate(60, 175)">
<path d="M 180 0 L 180 30" stroke="#7a8a4a" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
<path d="M 540 0 L 540 30" stroke="#5a7a8f" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
<path d="M 900 0 L 900 30" stroke="#2d5a4f" stroke-width="2" fill="none" stroke-dasharray="4,3"/>
</g>
<g transform="translate(60, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#7a8a4a" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#7a8a4a" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Tier 1 · Flat-Vector RAG</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#5a6c2a" text-anchor="middle">FAST &amp; CHEAP</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">embed query → cosine-similarity</text>
<text x="20" y="128">top-k retrieve → stuff context</text>
<text x="20" y="146">→ generate</text>
<text x="20" y="186" font-weight="700">Best for:</text>
<text x="20" y="204" font-size="11">single-fact lookups,</text>
<text x="20" y="220" font-size="11">"what is X?", FAQ-shaped</text>
<text x="20" y="236" font-size="11">queries on flat corpora</text>
<text x="20" y="270" font-weight="700">Latency:</text>
<text x="105" y="270">&lt; 300 ms</text>
<text x="20" y="290" font-weight="700">Cost:</text>
<text x="105" y="290">cents per query</text>
</g>
</g>
<g transform="translate(430, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#5a7a8f" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#5a7a8f" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Tier 2 · Hybrid + Rerank</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#3a5060" text-anchor="middle">BALANCED</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">BM25 lexical &nbsp;+ dense vector</text>
<text x="20" y="128">→ Reciprocal Rank Fusion</text>
<text x="20" y="146">→ cross-encoder reranker</text>
<text x="20" y="164">→ generate</text>
<text x="20" y="200" font-weight="700">Best for:</text>
<text x="20" y="218" font-size="11">queries where lexical and</text>
<text x="20" y="234" font-size="11">semantic disagree —</text>
<text x="20" y="250" font-size="11">codes, names, acronyms,</text>
<text x="20" y="266" font-size="11">technical vocabulary</text>
<text x="20" y="290" font-weight="700">Latency:</text>
<text x="105" y="290">~ 800 ms</text>
<text x="20" y="310" font-weight="700">Cost:</text>
<text x="105" y="310">still low</text>
</g>
</g>
<g transform="translate(800, 205)">
<rect x="0" y="0" width="340" height="350" fill="#faf8f5" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="0" y="0" width="340" height="44" fill="#2d5a4f" rx="6"/>
<text x="170" y="28" font-family="'DM Sans', sans-serif" font-size="15" font-weight="700" fill="#faf8f5" text-anchor="middle">Tier 3 · Page-Index + Agent</text>
<text x="170" y="74" font-family="'DM Sans', sans-serif" font-size="11" font-weight="700" fill="#1e3a2b" text-anchor="middle">DEEP &amp; DELIBERATE</text>
<g font-family="'DM Sans', sans-serif" font-size="12" fill="#1e3a2b">
<text x="20" y="110">hierarchical table-of-contents</text>
<text x="20" y="128">tree built at ingest</text>
<text x="20" y="146">→ agent walks the tree</text>
<text x="20" y="164">→ opens / reads sections</text>
<text x="20" y="182">→ generate</text>
<text x="20" y="218" font-weight="700">Best for:</text>
<text x="20" y="236" font-size="11">multi-hop reading of long</text>
<text x="20" y="252" font-size="11">structured documents —</text>
<text x="20" y="268" font-size="11">legal, financial, technical</text>
<text x="20" y="284" font-size="11">PDFs where context spans pages</text>
<text x="20" y="306" font-weight="700">Cost:</text>
<text x="105" y="306">highest — but only</text>
<text x="105" y="320">spent when needed</text>
</g>
</g>
</svg>
<figcaption style="text-align: center; font-style: italic; color: #5a6862; font-size: 0.9rem; margin-top: 0.75rem;">The three tiers are architecturally different stacks, not depth variants of the same one. The router picks one per query.</figcaption>
</figure>

### Tier 1 — Flat-vector RAG (the fast / cheap path)

For clear factual queries with a single answer that lives in a single chunk: embed the query, retrieve the top-k by cosine similarity, stuff the context, generate. The classic RAG architecture the original 2025 post described as "first-generation" — used here as a *first-resort* path for the queries that genuinely don't need anything more. Sub-300 ms p95 latency, cents per query, no reranker overhead.

### Tier 2 — Hybrid BM25 + dense fusion + reranking

For queries where lexical and semantic signals disagree. BM25 catches exact-match needs (product codes, person names, technical acronyms, error strings); dense vectors catch paraphrase and synonymy. **Reciprocal Rank Fusion** merges the two hit lists; a **cross-encoder reranker** scores the merged top-N and re-orders by joint query-document relevance. This is the architecture Anthropic published as **Contextual Retrieval**[^contextual-retrieval-2024] and what most competent 2026 RAG teams ship as their default. Divinci treats it as the *middle* tier — the right answer for most queries, but not the cheapest path nor the deepest one.

### Tier 3 — Page-index + agentic document traversal

For queries that require multi-hop reading of long structured documents — the legal contracts, financial 10-Ks, and technical specifications where the answer requires synthesising context that spans non-adjacent sections.

At ingest time, we build a hierarchical *table-of-contents* tree over the document: headings, sub-headings, captions, footnotes — a vectorless structural index with a short LLM-generated summary at each node. At query time, an agent walks the tree, decides which subtree is relevant, opens those sections, reads, and decides what to consult next. **VectifyAI's PageIndex**[^pageindex-2025] is the open-source standalone implementation of this idea and a strong validation that the third tier is real — they ship just this, as a standalone product. Divinci treats it as the *third tier* of a router rather than as the only option, because most queries do not need it and paying its cost on every query is wasteful.

### Why this routing axis is different from everyone else's

Adaptive-RAG[^adaptive-rag-2024] (Jeong et al., NAACL 2024) routes among **no-retrieval / single-step / iterative retrieval** — the depth axis. The 2025 follow-ups — Probing-RAG[^probing-rag-2025], R2RAG[^r2rag-2025], LTRR[^ltrr-2025], RAGRouter-Bench[^ragrouter-bench-2026], "Query Routing for Retrieval-Augmented Language Models"[^query-routing-2505] — all extend the same axis: how *much* retrieval does this query need? They route between deeper or shallower variants of a single retrieval architecture.

**Divinci routes along the architecture axis.** The same query that an Adaptive-RAG implementation would classify as "iterative" might be either Tier 2 hybrid (if the query rewards lexical+semantic fusion) or Tier 3 page-index (if it needs multi-hop reading of a long document) — those are architecturally different answers, not depth variants. The two axes are orthogonal: depth tells you *how many passes*, architecture tells you *what kind of retrieval each pass should be*.

### Where the pitch is weakest, in fairness

The *concept* of per-query RAG routing is well-established. We did not invent routing. The genuine differentiation is: **route across architecturally distinct stacks, in a managed endpoint, with PageIndex-style tier-3 traversal included.** No hyperscaler ships that combination today. **Cloudflare AI Search**[^cloudflare-ai-search-2026], **AWS Bedrock Knowledge Bases**[^bedrock-hybrid-2025], **Azure AI Search**[^azure-agentic-retrieval-2025], and **OpenAI Assistants File Search**[^openai-file-search] all ship a single hybrid pipeline (sometimes with separate agentic mode you select manually). **LlamaIndex RouterRetriever / RouterQueryEngine**[^llamaindex-router] is the closest conceptual match but is a library customers must assemble, calibrate, and operate themselves.

### How it looks at the API surface

The router is invisible to the caller. One endpoint, one request shape, the response tells you which tier answered so you can audit:

```bash
curl -X POST https://api.divinci.app/v1/query \
  -H "Authorization: Bearer $DIVINCI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "query":  "What clauses in the 2024 amendment override section 7.3?",
    "corpus": "legal-contracts-q4"
  }'

# Response (annotated)
{
  "answer": "...",
  "routing": {
    "tier_used":    "page-index-agentic",       # tier 3
    "tier_reason":  "multi-hop legal corpus, ≥3 hops detected",
    "alt_considered": ["hybrid"],
    "tier_costs": { "tier1": 0.003, "tier2": 0.018, "tier3": 0.124 }
  },
  "citations": [ /* … */ ]
}
```

The customer doesn't pick a stack; they don't run three. The router does. Audit-grade transparency on which tier answered is part of the response, not buried in metrics — same auditability ethos we built into the [vIndex receipt](/blog/validating-and-releasing-custom-lms-in-regulated-fields/) and the [release manifest](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/) for our CI/CD stack.

### How the router actually decides — learned routing, not a hand-coded classifier

The version of this router that ships today does *not* use hand-coded query-shape features. The mechanism is **learned routing via embedding similarity against historical question→backend pairs**, and it works like this:

1. **Hash the incoming question** (SHA-256, truncated to a 16-char key).
2. **Exact-match KV lookup** against the per-customer routing store — if this exact question has been answered before, dispatch immediately to the backend that did best last time.
3. **On miss, embed the question and cosine-search** against a cached index of historical question embeddings. If the nearest neighbour exceeds a **0.88 cosine threshold**, dispatch to its backend.
4. **On no match above threshold, fall back** to the default backend configured for the corpus.

Routing entries carry a **30-day TTL**; stale entries trigger re-benchmarking on the next lookup, which is how the routing model stays fresh as the corpus and traffic mix evolve. The "what performed best last time" signal is seeded from two upstream sources: explicit arena-style A/B selections by the customer, and our internal auto-fix output that compares retrievals across backends on representative queries. Both write into the per-customer routing-history store; the router consumes either.

This is meaningfully different from the published academic routers ([Adaptive-RAG](https://aclanthology.org/2024.naacl-long.389/) and follow-ups), which classify the query *upfront* by complexity. Our learned approach **trusts historical evidence over query-shape heuristics**, because empirically the same query shape behaves differently on different corpora — a "compare X across Y" query on legal contracts wants Tier 3 page-index traversal; the same query shape on a flat FAQ corpus is fine on Tier 1. Letting the routing model learn that distinction per-corpus, rather than guessing it from query syntax, is the design choice that actually shipped.

**A note on the conceptual three tiers vs the actual backend list.** The three tiers above are a useful *conceptual* spectrum (cheap-fast / balanced / deep-deliberate). The router itself dispatches to one of **a wider set of named backends** — `pageindex` (Tier 3-shaped), `neo4j-hybrid` (graph-enhanced retrieval), `raptor` (tree-traversal), `lightrag` (entity + community search), and pure vector engines on `qdrant` / `cloudflare-v2` / `couchbase-byok` / `vertex-ai-vector-search-v2` / `mongodb-atlas` / `redis-vector-search`. The Tier 2 hybrid (BM25 + dense fusion + cross-encoder reranker) ships in our **workflow canvas** as a composable node today, and is on the roadmap as an auto-routable backend; if Tier 2 is the right answer for your corpus right now you compose it as a workflow, not as a routing target. We'll fold this into the auto-router as the per-corpus routing data justifies it.

The router's decision is logged today and surfaced via the audit trail; full routing metadata in the response payload (the `routing.tier_used` / `tier_reason` / `tier_costs` fields shown above) is a roadmap item — the **shadow CI** pattern from our [CI testing post](/blog/ci-testing-for-custom-language-models-in-2026/) is how we'll validate the change before flipping it on.

### When this matters most

A customer with a homogeneous corpus and uniform query shape gets one optimal tier and benefits little from routing — they could pick Tier 2 manually and be done. The wedge is enterprises with **mixed corpora and mixed query shapes**: a legal team that asks both "what is the definition of force majeure in our standard contract?" (Tier 1) and "across our 47 vendor contracts, which ones have non-standard termination clauses and what are the patterns?" (Tier 3). Routing across architectures is what lets one endpoint serve both well without paying Tier 3 costs on the Tier 1 query.

That's the case where one managed endpoint with three architecturally distinct stacks behind it earns its keep.

## The Promise and Limitations of First-Generation RAG

Traditional RAG systems follow a straightforward pattern: embed documents into vector space, retrieve relevant chunks based on semantic similarity, and inject this context into the LLM prompt. While this approach has proven effective for basic question-answering scenarios, it faces several fundamental challenges:

### Context Window Constraints

Even with modern LLMs supporting 100K+ token context windows, the challenge isn't just about fitting more content—it's about maintaining coherence and relevance across diverse information sources. When dealing with complex queries that require synthesizing information from multiple documents, simple concatenation often leads to information overload rather than insight.

### Semantic Search Limitations

Vector similarity search, while powerful, can miss nuanced relationships between concepts. A query about "financial risk assessment" might not retrieve documents discussing "credit default swaps" if the embedding space doesn't capture these semantic connections effectively.

### Static Retrieval Strategies

Most RAG implementations use fixed retrieval patterns that don't adapt to query complexity or context. A simple factual question requires different retrieval logic than a complex analytical request, yet most systems treat them identically.

<picture>
  <img src="/images/autorag-still.png" alt="Advanced RAG Architecture" style="width: 100%; max-width: 900px; margin: 2rem auto; display: block;" loading="lazy">
</picture>
*Modern RAG systems employ sophisticated multi-stage retrieval and reasoning pipelines*

## The Evolution of RAG Architecture

The next generation of RAG systems addresses these limitations through several key innovations:

### Multi-Stage Retrieval Pipelines

Rather than a single retrieval step, advanced RAG systems employ multi-stage pipelines that progressively refine and expand the search space[^3]. Multi-stage retrieval has emerged as a promising approach where initial lightweight filters narrow down the dataset before applying more computationally intensive methods[^4]:

1. **Query Analysis**: Understanding query intent, complexity, and required information types
2. **Initial Retrieval**: Broad semantic search to identify candidate documents
3. **Context Expansion**: Following citations, related documents, and cross-references
4. **Relevance Filtering**: Applying query-specific filtering to remove noise through contextual re-ranking[^5]
5. **Context Synthesis**: Organizing retrieved information into coherent, structured context

### Query Transformation and Decomposition

Complex queries often require decomposition into sub-questions that can be addressed independently before synthesis. For example:

```python
# Query Transformation Example
original_query = "How do quantum computing advances impact cryptocurrency security?"

decomposed_queries = [
    "What are the latest advances in quantum computing?",
    "How does quantum computing threaten current cryptographic methods?", 
    "What cryptocurrency security measures are quantum-resistant?",
    "Timeline for quantum computers breaking current encryption"
]
```

### Recursive Retrieval and Reasoning

<img src="/images/autorag-retrieval-optimization.svg" alt="Recursive Retrieval Process" style="width: 70%; display: block; margin: 2rem auto;" width="300" height="200" loading="lazy">
*Recursive retrieval enables deeper exploration of information networks*

Advanced RAG systems can recursively explore information networks, following leads and connections to build comprehensive understanding[^6]. This approach mimics how human researchers naturally work—starting with initial sources and following relevant connections. RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval), presented at ICLR 2024, represents one of the key recursive retrieval methods that has demonstrated significant improvements in multi-hop reasoning[^7].

## Beyond Document Retrieval: Emerging Applications

As RAG systems mature, they're enabling entirely new categories of AI applications:

### Reasoning-Enhanced Knowledge Systems

Instead of simply retrieving and presenting information, next-generation RAG systems can:

- **Identify Knowledge Gaps**: Recognizing when available information is insufficient for confident answers
- **Cross-Reference Validation**: Checking consistency across multiple sources
- **Temporal Reasoning**: Understanding how information validity changes over time
- **Causal Analysis**: Tracing cause-and-effect relationships across document collections

### Dynamic Knowledge Graph Navigation

RAG systems are increasingly integrated with knowledge graphs, enabling dynamic exploration of entity relationships and semantic connections that pure vector search might miss[^8]. GraphRAG, open-sourced by Microsoft in mid-2024, uses knowledge graphs to represent and connect information, capturing not only data points but also their relationships[^9]. This approach significantly improves Context Relevance metrics, with multi-hop questions benefiting most from GraphRAG's structured retrieval strategy[^10].

### Multi-Modal RAG

Extending beyond text to incorporate images, charts, tables, and other media types into the retrieval and reasoning process[^11]. Modern documents increasingly contain diverse multimodal content that traditional text-focused RAG systems cannot effectively process[^12]. Popular approaches include embedding all modalities into the same vector space using models like CLIP, or using separate stores for different modalities with a dedicated multimodal re-ranker[^13]. This capability is particularly valuable for technical documentation, financial reports, and scientific literature. One prediction for 2025 is that multimodal models will move into the mainstream and become the norm by year's end[^14].

## Challenges and Future Directions

Despite these advances, several challenges remain:

### Computational Complexity

Multi-stage retrieval and recursive reasoning significantly increase computational requirements. Optimizing these systems for production deployment requires careful attention to caching strategies, incremental processing, and selective activation of advanced features.

### Quality Assurance

With increased system complexity comes the challenge of ensuring output quality and reliability. Traditional evaluation metrics for RAG systems don't adequately capture the nuanced performance characteristics of multi-stage reasoning pipelines.

### Integration Complexity

Organizations need tools that can seamlessly integrate advanced RAG capabilities into existing workflows without requiring extensive AI expertise.

## The Optimization Problem That Replaces "Pick a RAG Architecture"

Once a deployment has more than one candidate retrieval strategy — and the survey above lists at least six — the question stops being "which architecture is best" and starts being "which architecture is best **for this corpus, this query distribution, this latency budget, and this evaluation rubric**." That's a multi-objective optimization problem with a search space that grows combinatorially in the number of pipeline stages (chunking, embedding model, top-K, re-ranker, compression, graph augmentation).

The interesting work in 2025 isn't designing new retrieval algorithms — the literature already has more than any single deployment will adopt. It's automating the search over those algorithms against a held-out evaluation suite, so the production pipeline is the one that demonstrably wins on the corpus the system actually serves. RAG architecture choice becomes a function call against a benchmark, not a strategy debate.

<img src="/images/autorag-diagram.svg" alt="Automated RAG Optimization Process" style="width: 100%; max-width: 900px; margin: 2rem auto; display: block;" width="800" height="500" loading="lazy">
*Automated optimization treats the RAG architecture decision as a search problem against a corpus-specific evaluation suite.*

## Conclusion

The future of RAG systems lies not in simple document retrieval, but in sophisticated reasoning systems that can navigate complex information landscapes, synthesize diverse sources, and provide nuanced insights. As these systems mature, they'll transition from being glorified search engines to becoming true knowledge partners that augment human reasoning capabilities.

The organizations that succeed in this new landscape will be those that treat RAG architecture as an empirical question rather than an architectural commitment — and that invest in the evaluation suites that let them answer it on their own corpora. Architectures will keep improving; the durable competitive advantage is the measurement surface that tells you which architecture is currently winning for your data.

## References

[^1]: arXiv. "A Comprehensive Survey of Retrieval-Augmented Generation (RAG): Evolution, Current Landscape and Future Directions." October 2024. Comprehensive academic survey documenting RAG's evolution and current state.

[^2]: Medium (Maheshus). "Retrieval-Augmented Generation (RAG): Real Advances in 2025." August 2025. Analysis positioning RAG as an essential framework for reliable, updatable, and auditable language agents in 2025.

[^3]: arXiv. "A Systematic Review of Key Retrieval-Augmented Generation (RAG) Systems: Progress, Gaps, and Future Directions." July 2025. Systematic review documenting progress in RAG system architecture.

[^4]: Chitika. "Retrieval-Augmented Generation (RAG): 2025 Definitive Guide." 2025. Discussion of multi-stage retrieval approaches where lightweight filters narrow datasets before computationally intensive methods.

[^5]: Aya Data. "The State of Retrieval-Augmented Generation (RAG) in 2025 and Beyond." 2025. Analysis of multi-stage retrieval pipelines incorporating contextual re-ranking where initial results are refined using semantic filters.

[^6]: Signity Solutions. "Trends in Active Retrieval Augmented Generation: 2025 and Beyond." 2025. Overview of recursive retrieval mechanisms and adaptive approaches.

[^7]: Medium (Sarah Zouinina). "From Embeddings to Graphs: Surveying the Cutting-Edge in RAG (2024–2025)." 2025. Survey covering RAPTOR (Recursive Abstractive Processing for Tree-Organized Retrieval) presented at ICLR 2024.

[^8]: Springer - Business & Information Systems Engineering. "Retrieval-Augmented Generation (RAG)." 2025. Academic analysis of knowledge graph integration in RAG systems.

[^9]: GitHub - DEEP-PolyU. "Awesome-GraphRAG: A curated list of resources on graph-based retrieval-augmented generation." 2024-2025. Documentation of Microsoft's GraphRAG open-sourcing in mid-2024 and its approach to using knowledge graphs.

[^10]: Medium (Zilliz). "GraphRAG Explained: Enhancing RAG with Knowledge Graphs." 2025. Technical explanation of how GraphRAG improves Context Relevance metrics, particularly for multi-hop questions.

[^11]: NVIDIA Technical Blog. "An Easy Introduction to Multimodal Retrieval-Augmented Generation." 2025. Technical overview of multimodal RAG capabilities for images, text, charts, and tables.

[^12]: GitHub - HKUDS. "RAG-Anything: All-in-One RAG Framework." 2025. Documentation of challenges processing modern documents with diverse multimodal content.

[^13]: Medium (Ryan Siegler, KX Systems). "Guide to Multimodal RAG for Images and Text (in 2025)." 2025. Explanation of three main architectural approaches: unified vector space with CLIP, grounding to primary modality, or separate stores with multimodal re-ranker.

[^14]: Medium (Gautam Chutani). "Multi-Modal RAG: A Practical Guide." 2025. Industry prediction that multimodal models will become mainstream and the norm by end of 2025.

[^rag-survey-2026]: Singh et al. "Agentic Retrieval-Augmented Generation: A Survey on Agentic RAG." arXiv:2501.09136 (Jan 2025, updated through 2026). Taxonomy of agentic RAG by agent cardinality, control structure, autonomy, and knowledge representation. <https://arxiv.org/abs/2501.09136>

[^sok-agentic-2026]: "SoK: Agentic Retrieval-Augmented Generation." arXiv:2603.07379 (2026). Systematization-of-knowledge on planning, retrieval orchestration, memory, and tool invocation in agentic RAG. <https://arxiv.org/abs/2603.07379>

[^reasoning-rag-2025]: "Reasoning RAG via System 1 or System 2." arXiv:2506.10408 (Jun 2025). Formalises the shift from static pipelines to dynamic reasoning-driven retrieval that decides when, what, and how to retrieve. <https://arxiv.org/html/2506.10408v1>

[^self-rag-2023]: Asai et al. "Self-RAG: Learning to Retrieve, Generate, and Critique through Self-Reflection." arXiv:2310.11511. The reflection-token framework that anchored the self-correcting-RAG line of work. <https://arxiv.org/pdf/2310.11511>

[^crag-2024]: Yan et al. "Corrective Retrieval Augmented Generation." arXiv:2401.15884 (v3, 2024). External lightweight retrieval evaluator with three corrective paths (correct / incorrect / ambiguous). <https://arxiv.org/html/2401.15884v3>

[^lazy-graphrag-2024]: Microsoft Research. "LazyGraphRAG: Setting a New Standard for Quality and Cost." Nov 2024; integrated into Azure / Microsoft Discovery 6 Jun 2025. Indexing cost reduced to ~0.1% of full GraphRAG. <https://www.microsoft.com/en-us/research/blog/lazygraphrag-setting-a-new-standard-for-quality-and-cost/>

[^graphrag-1-2025]: Microsoft Research. "Moving to GraphRAG 1.0: Streamlining Ergonomics for Developers and Users." 2025. Production-grade ergonomics release. <https://www.microsoft.com/en-us/research/blog/moving-to-graphrag-1-0-streamlining-ergonomics-for-developers-and-users/>

[^graphrag-bench-2026]: "When to Use Graphs in RAG (GraphRAG-Bench)." arXiv:2506.05690 (ICLR 2026). Empirical decision rule: graph value scales with query complexity. <https://arxiv.org/html/2506.05690v3>

[^u-niah-2025]: "U-NIAH: A Unified Framework for Long-Context Needle-in-a-Haystack Evaluation." arXiv:2503.00353 (Mar 2025). Multi-needle scores still trail single-needle by 15–40 points; RULER trails NIAH-2 by 10–25 points. <https://arxiv.org/html/2503.00353v1>

[^mirage-2025]: "MIRAGE: A Multi-Instance Retrieval-Augmented Generation Evaluation Framework." Findings of NAACL 2025, arXiv:2504.17137. 7,560 instances across a 37,800-entry retrieval pool. <https://aclanthology.org/2025.findings-naacl.157/>

[^mirage-bench-2025]: "MIRAGE-Bench: Automatic Multilingual RAG Arena Benchmark." NAACL 2025. Multilingual RAG evaluation across 18 languages. <https://aclanthology.org/2025.naacl-long.14/>

[^colpali-2024]: Faysse et al. "ColPali: Efficient Document Retrieval with Vision Language Models." arXiv:2407.01449 (2024). VLM late-interaction embeddings directly over rendered document pages; eliminates the OCR step. <https://arxiv.org/abs/2407.01449>

[^vidore-v2-2025]: "ViDoRe Benchmark V2." arXiv:2505.17166 (May 2025). Visual-document retrieval benchmark v2. <https://arxiv.org/pdf/2505.17166>

[^gemini-embedding-2]: Google. "Introducing gemini-embedding-2." Google Blog, 10 March 2026. Unified text + image + video + audio + PDF embedding model. 3,072-dim default (1,536 / 768 via Matryoshka). Limits: 8,192 text tokens · 6 images / request · 120 s video · native audio · 6-page PDFs. Available through Gemini API and Vertex AI; first-party integrations with LangChain, LlamaIndex, Haystack, Weaviate, Qdrant, ChromaDB, and Vertex Vector Search. <https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-embedding-2/>

[^contextual-retrieval-2024]: Anthropic. "Introducing Contextual Retrieval." Anthropic blog, Sep 2024. Per-chunk explanatory context prepended pre-embedding; hybrid embedding + BM25 + reranker now the default production stack. Production deployment patterns documented in AWS Bedrock case studies (Jun 2025). <https://aws.amazon.com/blogs/machine-learning/contextual-retrieval-in-anthropic-using-amazon-bedrock-knowledge-bases/>

[^cloudflare-autorag-2025]: Cloudflare. "Introducing AutoRAG on Cloudflare." Cloudflare blog, April 2025. Managed RAG pipeline: ingestion → chunking → embedding → Vectorize → Workers AI generation. <https://blog.cloudflare.com/introducing-autorag-on-cloudflare/>

[^cloudflare-ai-search-2026]: Cloudflare Developers. "AI Search release notes." 2026. AutoRAG rebranded as AI Search. <https://developers.cloudflare.com/ai-search/platform/release-note/>

[^pageindex-2025]: VectifyAI. "PageIndex — hierarchical table-of-contents index with LLM tree-search retrieval." GitHub repository, 2025. Standalone implementation of the third-tier architecture (vectorless hierarchical agentic traversal). <https://github.com/VectifyAI/PageIndex>

[^llamaindex-router]: LlamaIndex. "Router Retriever / RouterQueryEngine." LLM/Pydantic selector that picks one or more registered retrievers per query. Closest conceptual building block for an architecture router, but a library (BYO-stacks). <https://docs.llamaindex.ai/en/stable/examples/retrievers/router_retriever/>

[^adaptive-rag-2024]: Jeong et al. "Adaptive-RAG: Learning to Adapt Retrieval-Augmented Large Language Models through Question Complexity." NAACL 2024. Routes by query complexity among no-retrieval / single-step / iterative retrieval — the canonical *depth-axis* router. <https://aclanthology.org/2024.naacl-long.389/>

[^probing-rag-2025]: "Probing-RAG: Self-Probing to Guide Language Models in Selective Document Retrieval." NAACL 2025. 2025 follow-up extending Adaptive-RAG's depth-axis routing.

[^r2rag-2025]: "R2RAG: Reasoning-Aware Routing for Retrieval-Augmented Generation." NeurIPS 2025 (winning paper). Depth-axis routing with reasoning-aware classification.

[^ltrr-2025]: "LTRR: Learning To Rank Retrievers." arXiv:2506.13743 (2025). Learns to rank retrievers per query — along the depth axis, not the architecture axis. <https://arxiv.org/pdf/2506.13743>

[^ragrouter-bench-2026]: "Lightweight Query Routing for RAG / RAGRouter-Bench." arXiv:2604.03455 (2026). Routing benchmark — again, depth-axis variants of a single architecture. <https://arxiv.org/html/2604.03455v1>

[^query-routing-2505]: "Query Routing for Retrieval-Augmented Language Models." arXiv:2505.23052 (2025). <https://arxiv.org/abs/2505.23052>

[^bedrock-hybrid-2025]: AWS. "Bedrock Knowledge Bases — hybrid search with Aurora PostgreSQL and MongoDB Atlas." April 2025 launch. One hybrid pipeline; no architecture router. <https://aws.amazon.com/about-aws/whats-new/2025/04/amazon-bedrock-knowledge-bases-hybrid-search-aurora-postgresql-mongo-db-atlas-vector-stores/>

[^azure-agentic-retrieval-2025]: Microsoft. "Azure AI Search — Agentic Retrieval overview." 2025. Closest hyperscaler offering to a multi-mode retrieval pipeline, but the user selects the mode rather than a router picking per query. <https://learn.microsoft.com/en-us/azure/search/agentic-retrieval-overview>

[^openai-file-search]: OpenAI. "Assistants API — File Search." Hybrid keyword+semantic with query rewriting and reranking; single tunable pipeline. <https://developers.openai.com/api/docs/assistants/tools/file-search>