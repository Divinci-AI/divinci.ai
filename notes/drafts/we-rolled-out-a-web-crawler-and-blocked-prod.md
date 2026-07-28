+++
title = "We Rolled Out a Web Crawler and Blocked Every Request in Prod"
description = "A fixed sleep between API calls looked like pacing. It wasn't. Four bugs deep — CPU-bound parsing, silent OOM kills, and instance recycling — before a web crawler rollout stopped taking down /health."
date = 2026-07-17T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Research"]
tags = ["Web Crawling", "RAG", "Cloud Run", "Node.js", "Event Loop", "Incident Report", "Durability", "Cloud Tasks"]

[extra]
math = false
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
featured_image = "images/we-rolled-out-a-web-crawler-and-blocked-prod-hero.png"
title_display = "We Rolled Out a Web Crawler<br>and Blocked Every Request in Prod."
reading_time = 12
summary = "We have a platform-native web-crawl connector and a script that fires it at a list of sites, 20–30 seconds apart. That felt like pacing. It wasn't — each call returns instantly and kicks off minutes of work in the background, so the 20–30 second gap just meant a new job started while a growing pile of old ones were still running. By host ten or eleven, seven-plus crawls were parsing pages concurrently on one Node process, and /health started timing out for every customer, not just us. Fixing it took four rounds: a pacing bug, a CPU-bound parser that no timeout could touch, an OOM kill with zero error output, and a silent instance recycle underneath all of it. Here's the chain, the real numbers, and the two gotchas that would have fooled us if we hadn't gone looking."
+++

---

## TL;DR

We rolled out our platform's Web Crawl Connector — the same feature customers use to index their own sites — against our internal WWW-RAG corpus of ~90 public websites. The rollout script paced its *API calls* 20–30 seconds apart. That looked like throttling. It wasn't: each call returns a `202` in milliseconds and the real work — crawl, parse, chunk, embed — runs for minutes afterward. Pacing the calls just meant a new multi-minute job started every 20–30 seconds while the previous ones kept running.

| Symptom | Metric | Root cause |
|---|---:|---|
| `/health` timing out platform-wide | `event_loop_lag` p99 **112s** | Concurrency stacked unboundedly — 7+ crawl jobs on one process |
| A single host still blocked the loop after pacing was fixed | `event_loop_lag` p99 **209s** | One 1.86MB page with 15,311 links — synchronous parsing a timeout can't interrupt |
| A crawl "stuck running" for hours | *(silent — nothing logged)* | Cloud Run OOM-killed the container; the fire-and-forget job had no chance to report failure |
| Fixed the OOM, still stalled | *(silent — nothing logged)* | Routine instance scale-down killed the in-flight promise mid-crawl |

Four bugs, each hiding behind the one before it. The fix that actually held: stop treating a crawl as "fire it and move on" and start treating it as work that has to survive the process that started it.

---

## The setup

We run a public RAG directory — WWW-RAG — that crawls, embeds, and publishes real websites as individually chattable AI assistants. Until recently, that corpus grew through a bespoke Rust crawler running as a day/night daemon on a laptop. We also ship a platform-native **Web Crawl Connector** — the feature a customer uses to point their own tenant at a URL and keep it synced, complete with recurrence, webhook infra, and changelog rollup. Rather than build a second migration path, we asked the obvious question: could WWW-RAG's ~90 sites just *be* customers of our own connector?

The answer turned out to be yes, eventually. But "eventually" ran through four separate incidents, each one uncovering the next.

---

## Bug 1: a fixed sleep is not a throttle

The rollout script was simple by design: for each host, `POST /connectors/web-crawl/start`, sleep 20–30 seconds, move to the next host. It looked cautious. It wasn't, because the endpoint is fire-and-forget — it validates the request, enqueues the job, and returns `202` in milliseconds. The actual crawl — fetch pages, parse HTML, chunk text, call the embedding API — runs asynchronously for anywhere from a couple of minutes to much longer, completely decoupled from how fast the *next* request arrives.

So pacing the requests didn't pace the work. It paced the *starting gun*. By the tenth or eleventh host, seven-plus crawl jobs were running concurrently on the same Cloud Run instance, each one doing CPU-bound page parsing and chunking in the same single-threaded Node event loop.

We noticed because `/health` started timing out — not a WWW-RAG-specific symptom, a **platform-wide** one, since a blocked event loop can't service any request, health checks included. The `event_loop_lag` structured-log metric showed the real shape of it: p99 **112 seconds**, mean 16.4 seconds, sustained. We let it drain rather than force a disruptive redeploy — load was unevenly spread across instances, and confirmed no data corruption once it cleared.

One useful thing from this incident before the fix: **health-check pass/fail alone is not a reliable recovery signal.** A single lucky sample can read "healthy" while the underlying lag is still bad. We tracked the actual `event_loop_lag` metric back to a clean baseline before calling it resolved.

The fix: stop pacing on submission time and gate each next host on the *previous* host's job reaching a real terminal state, polled from the job's own status. **A fire-and-forget, 202-returning endpoint that kicks off heavy async work needs the caller to throttle on completion, not on how fast it can fire requests.**

---

## An aside: don't trust the timing coincidence

While re-testing the completion-gated rewrite, a second `event_loop_lag` spike hit prod — this time up to **890 seconds**. It looked like a repeat of bug 1. The timing said otherwise: the spike started *before* the rollout script's first API call that run.

The actual cause was unrelated: a ScoredQA calibration cron job was intermittently taking 80–890 seconds per tick — for a query that matched **zero candidates**. A no-op handler taking five minutes is itself a signal: the slowness wasn't in the handler's logic, it was in the database round-trip underneath it (the same shape as a `DB_BACKPRESSURE` class of incident we'd seen before). It self-resolved with no code change on our side.

The lesson we wrote down at the time: don't assume a lag spike is caused by the thing you're actively testing just because the timing looks close. Check whether the *evidence* — what the suspect handler was actually doing — is consistent with it being the bottleneck. Ours wasn't.

---

## Bug 2: a timeout can't interrupt code that never yields

With pacing genuinely fixed, one host still blocked the event loop on its own: `man7.org`, the Linux man-pages archive. `event_loop_lag` hit p99 **209 seconds** during an 18-minute stretch where the job reported exactly zero processed files.

The culprit was one page: `man7.org/linux/man-pages/dir_all_alphabetic.html` — **1.86MB**, **15,311 `<a>` tags**, reached within the first few crawl hops. Processing it meant building a full Cheerio DOM, running a noise-removal pass over roughly fifteen class/id patterns, running Defuddle's article extraction, and looping `new URL()` fifteen thousand times to normalize outbound links. Every step of that is synchronous, CPU-bound JavaScript in a single event-loop tick. Node doesn't preempt synchronous code — nothing else that instance was serving could run until this one page finished.

We already had a per-page fetch timeout. It didn't help, and the reason is worth sitting with: `pageTimeoutMs` races the scrape `Promise` against a `setTimeout`, but a race only resolves early if the losing side *yields* the event loop periodically. Synchronous CPU-bound work doesn't yield. The timeout's own callback can't fire until the blocking code finishes on its own — a timeout can't rescue you from code that never lets go of the thread.

Fixing this took three rounds of profiling, because our first two guesses at the real cost driver were both wrong:

1. **First guess: truncate by byte size.** We added a 750KB cutoff. Profiling showed `extractWithDefuddle()` alone taking **12.25 seconds** on a 497KB page — comfortably under that threshold. Byte size was the wrong proxy. Defuddle's cost tracks DOM complexity and nesting depth, not payload size. We added a dedicated `DEFUDDLE_MAX_BYTES = 150_000` gate that falls back to Cheerio-only extraction above it: **82% reduction** on the test page, 10.8s → 1.98s.

2. **Still not clean** — seven more critical spikes over the next fifteen minutes of testing. Further profiling found Defuddle's cost *also* tracks element and link count independently of byte size: a 107KB page with 1,777 `<a>` tags cost 2.9–3.8 seconds in Defuddle alone, well under our new byte threshold. We added a second, independent gate — `DEFUDDLE_MAX_ELEMENTS = 1000`, a cheap `$("*").length` check — that catches link-dense pages byte size misses entirely.

3. **Even with Defuddle correctly skipped**, the fallback markdown converter (`node-html-markdown`) turned out to scale super-linearly on its own: 100KB → 39ms, 300KB → 485ms, 500KB → 1.3s, 750KB → 2.6s. We lowered the hard page-size ceiling from 750KB to 300KB.

The combined result: worst-case single-page cost dropped from 13.09s to 2.09s — **6.3×**. A realistic 19-page batch dropped from 78.9s to 18.6s — **4.2×**. We validated it against a full, real arxiv.org crawl (25 minutes, 1,500 URLs, 185 chunks): four critical lag events total, all inside the first 46 seconds, then completely clean for the rest of the run. Against the original incident, that's roughly two orders of magnitude cleaner.

The generalizable part isn't the specific thresholds — it's that a performance guard built around one intuitive proxy metric (byte size, in our case, twice) will miss the actual cost driver. We only found the real one by profiling the pathological input directly, phase by phase, instead of trusting the metric that seemed obviously correlated.

---

## Bug 3: "stuck running forever" meant "silently killed"

Three separate crawls — arxiv.org twice, a historical legal-documents archive once — stalled indefinitely, with the job status frozen at `running` and no error anywhere. We found the cause in Cloud Run's own logs, not the application's: `gcloud logging read 'textPayload:"Memory limit"'` matched every stall to the second. **Container OOM kills at 2048 MiB.**

The mechanism: heavy pages (some with 6,000–10,000+ DOM elements) times six concurrent pages per crawl, plus the BFS frontier and visited-set held in memory for a 1,500-page crawl, added up to more than the container's memory limit. Our bug-2 fixes bounded the cost of processing *one* page; they didn't bound the *aggregate* memory of several heavy pages in flight at once.

The part that made this genuinely hard to see: the crawl runs as an un-awaited, fire-and-forget continuation (`void runWebCrawlConnectorSyncPersisted(...).catch(...)`). When the OOM killer terminates the container, there is no JavaScript left running to execute a `catch` or a `finally`. The process is just gone. The job record sits at `running` forever, with zero evidence that anything went wrong, until someone thinks to cross-reference memory-limit log lines against stall timestamps by hand.

We bumped Cloud Run's memory 2Gi → 4Gi as a stopgap (via a new env-var override — the per-service memory config in our deploy manifest had, separately, never actually been wired into the deploy script, which is its own small lesson in verifying configuration is *read*, not just *present*). But the real fix isn't a bigger container — it's not relying on a bare fire-and-forget continuation to report its own death in the first place. That's a job for durable execution, not a memory bump. We'd already built that pattern for file ingestion; the web-crawl connector hadn't been moved onto it yet.

---

## Bug 4: the container that outlives the crawl doesn't exist

We bumped the memory. arxiv.org still stalled. The final trace, again from prod logs: `"Shutting down user disabled instance"` appeared about two minutes after crawl activity stopped. Nothing had crashed. Cloud Run had scaled the instance down — completely routine, completely correct behavior for an autoscaled service — and taken the in-flight, un-awaited crawl promise with it.

This is the bug underneath bugs 1 through 3: a fire-and-forget async job only survives as long as the process that started it stays alive, and nothing about that assumption is guaranteed on a platform designed to scale instances up and down freely.

The real fix was to stop assuming that in the first place. We moved web-crawl connector sync onto **Google Cloud Tasks** for durable re-invocation: the connector dispatches via the Cloud Tasks REST API to a dedicated HTTP handler, authenticated with a shared secret, with a graceful inline fallback if Cloud Tasks isn't configured for a given environment. A task that outlives an instance recycle just gets redelivered to whichever instance is up when it's ready to run.

Turning it on took one more round of debugging that's worth including for the shape of the mistake alone. The new secret the handler needed was never actually reaching the app in production — despite Infisical, our secrets manager, reporting "297 secrets loaded" on every boot. The secret existed; it just lived in a subfolder, and prod's loader was configured to read only the root path. The success log was true and irrelevant — "secrets loaded successfully" is not the same claim as "the *specific* secret my code needs is loaded." Worse, digging into this surfaced that our existing six-hour connector poll cron had been silently failing the exact same way in production the entire time, for the exact same reason. Neither failure had ever thrown, logged, or paged anyone.

Once the secret was actually reachable, we re-fired arxiv.org and watched the whole chain work end to end: task enqueued, dispatched, handler hit with a `Google-Cloud-Tasks` user agent, `200` returned, `event_loop_lag` clean throughout.

---

## What actually held

Four incidents, each one a layer under the last:

1. **Pacing requests isn't pacing work** — throttle on completion signals, not submission timing, whenever a fire-and-forget endpoint kicks off async work in a loop.
2. **A timeout can't rescue you from code that never yields** — CPU-bound synchronous work needs its own guard, profiled against the actual cost driver, not an intuitive proxy for it.
3. **A silently killed process reports nothing** — a bare fire-and-forget continuation is only as durable as the container running it, which on autoscaled infrastructure is not durable at all.
4. **"Loaded successfully" is not "loaded the thing I need"** — verify the specific config your code reads, not the generic success log next to it.

None of these bugs was exotic. Each one was, in isolation, a fairly ordinary mistake — a sleep where a poll should be, a missing element-count check, a fire-and-forget promise, a secret in the wrong folder. What made the chain interesting wasn't any single bug; it was that each fix exposed the next failure mode hiding behind it, and none of them would have shown up without pushing a real, large, messy crawl all the way through the system and watching where it actually broke.

That's still how we find most of what's in this post: not from a design review, but from crawling one more real website than we had before.
