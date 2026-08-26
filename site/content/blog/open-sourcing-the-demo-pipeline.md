+++
title = "We Open-Sourced the Pipeline That Builds Our Demos"
description = "The pipeline that researches a company, crawls its site, builds a white-label RAG demo, and delivers a working link is now Apache-2.0 on GitHub — gates, crawl policy, agent skills and all."
date = 2026-08-18T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Engineering"]
tags = ["Open Source", "RAG", "Web Crawling", "Demos", "Agent Skills", "Apache-2.0"]

[extra]
math = false
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
title_display = "We Open-Sourced the Pipeline<br>That Builds Our Demos."
reading_time = 6
summary = "When we want to show a company what Divinci would do with their content, we do not mock it up — we build it. A pipeline researches the company, crawls its public site, builds a white-label RAG assistant from the corpus, generates a branded landing page, and produces the outreach. It is now open source under Apache-2.0. This post is about what is in it, what deliberately is not, and the two design decisions we would defend to anyone: that nothing naming external infrastructure gets a default, and that the loop never approves its own gates."
+++

When we want to show a company what Divinci would do with their content, we
don't mock it up. We build it.

A pipeline researches the company, crawls its public site with the `divinci`
CLI, builds a white-label RAG assistant from the corpus, generates a branded
landing page, runs a QA suite against it, and produces the outreach. It runs
unattended on a schedule and stops whenever a human needs to decide something.

It's now open source, Apache-2.0:

**[github.com/Divinci-AI/divinci-demo-pipeline-oss](https://github.com/Divinci-AI/divinci-demo-pipeline-oss)**

## What's actually in it

The orchestrator is a state machine over the Divinci CLI: workspace → RAG
vector → crawl → release → publish → QA → landing page → outreach, with state
in a per-run JSON file so any step can resume. About 1,160 tests, and a dry-run
mode that walks the entire pipeline against a synthetic fixture without making
a single external call. That dry run is the fastest honest answer to "is my
install working."

If you're integrating any single piece of Divinci — scoping a crawl, creating a
vector, publishing a release, running a QA sweep — the repository is a worked
example of all of them wired together rather than each in isolation.

## What deliberately isn't

Every completed run. `runs/` held the crawled corpora, generated landing pages
and outreach drafts for 104 real companies, and it was committed — which meant
publishing the existing repository was never an option, because the history
holds what the tree no longer does. The public repository was built fresh, with
no shared history, and `runs/` is now ignored wholesale. The only run that
ships is a synthetic fixture called `__smoke__`.

The live prospect queue went too. In its place is
`prospect-queue.example.yaml`, which documents the format with invented
entries — and which the compliance safety tests now run against, so it can't
quietly drift out of date.

## Two decisions we'd defend to anyone

**Nothing that names external infrastructure gets a default.** Not the
Cloudflare KV namespace, not the R2 bucket, not the GCP project. This sounds
like pedantry until you notice the failure mode: a wrong default here doesn't
error, it *succeeds* — against somebody else's account — and the operator gets
no signal at all. So the code requires them and fails loudly when they're
missing. We found three of these baked in while preparing the release, and one
of them would have pointed a stranger's demo assets at our bucket.

**The loop never approves a gate.** Intake writes `approvedBy: null`. An
unattended run prepares reviewable work and stops. Everything that spends money
or reaches a real company sits behind a human decision — and a prospect
classified `clinic-high` can never auto-approve, which the test suite asserts
rather than trusts.

## Crawling is not a neutral act

This pipeline crawls companies that did not ask to be crawled. That is the
uncomfortable sentence at the centre of it, and the repository ships
`policies/crawl-policy.md` as a precondition rather than an appendix:
robots.txt honoured, one request per second under an identified user-agent, a
hard page budget, nothing behind auth or user-generated, and same-day deletion
of the workspace and every derived vector if a company objects.

The policy's own standard is the one we'd want applied to us — *"would we be
comfortable walking them through exactly how we got this data."* If you run
this, that sentence is now yours too. Nothing in the Apache-2.0 licence grants
any right to a crawled site's content.

## It knows how to teach an agent to run it

The repository ships `AGENTS.md` and three Claude Code skills — setup, running
against a real company, and building a single demo by hand with just the CLI.
They encode the things that are genuinely easy to get wrong rather than
restating the README. The best example: `DIVINCI_API_KEY` must be **unset**,
because the CLI prefers an API key over your OAuth session whenever one is
present, so a key sitting in your shell breaks workspace creation with an error
that reads exactly like a login problem and isn't one.

That's the kind of thing documentation usually learns the hard way, once, in
somebody's afternoon.

## Start here

The full guide lives in our SDK docs:
[sdk.divinci.ai/guides/demo-pipeline](https://sdk.divinci.ai/guides/demo-pipeline/).

```bash
git clone https://github.com/Divinci-AI/divinci-demo-pipeline-oss
cd divinci-demo-pipeline-oss/orchestrator && npm ci
npm run demo -- --prospect __smoke__ --run dry
```

If that dry run passes, the install is good — and it hasn't touched the network
once.
