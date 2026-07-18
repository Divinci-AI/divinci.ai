+++
title = "Putting a Grounded RAG Assistant on a Real Phone Number"
description = "We gave our RAG-grounded, fine-tuned assistant a phone number — and then spent a marathon session cutting first-audio latency from ~7 seconds to ~4.5 while keeping every safety guarantee. The wins came from measuring, not guessing: the model's hidden thinking phase, a TTS stall, a timestamp read aloud as '597 Z', and a cache lookup that had no business being serial."
date = 2026-07-18T16:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Engineering"]
tags = ["Voice Agents", "LiveKit", "SIP", "RAG", "Streaming", "Latency", "Gemini", "TTS", "Guardrails", "Telephony"]

[extra]
math = false
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
title_display = "Putting a Grounded RAG Assistant<br>on a Real Phone Number."
reading_time = 9
summary = "Web chat is a solved surface for grounded assistants. A phone call is not: there's no screen to hide latency behind, no markdown, no citations footer — just a voice that either answers quickly and correctly or doesn't. We wired our release pipeline (RAG + fine-tune + guardrails + signed transcripts) to an ordinary phone number via a SIP trunk and LiveKit, then instrumented every phase of the call path. What we found contradicted most of our assumptions: token streaming alone bought us nothing, the escrow token-count we suspected cost almost nothing, and the two real villains were the model's invisible reasoning phase and a semantic-cache lookup running serially before retrieval. This is the build log — including the bug where the assistant started every second reply by reading a timestamp aloud."
+++

---

## TL;DR

We put a RAG-grounded, fine-tuned, medically-guardrailed assistant on a real phone number. Calls ride a Twilio SIP trunk into a LiveKit room; a persistent cloud agent runs speech-to-text, calls our grounded chat pipeline through an OpenAI-compatible endpoint, and speaks the reply sentence-by-sentence — each sentence safety-rewritten *before* it reaches text-to-speech. Then we went to war with latency, and the war was won by instrumentation, not intuition:

- **Token streaming alone bought ~0 seconds** — the model delivered its first token at 97% of generation time. All the wait was a hidden *thinking* phase.
- **Disabling that thinking phase for voice** (`thinkingConfig.thinkingBudget: 0`) cut generation from ~5–5.9s to ~3.3s with no measurable quality loss on our medical-safety probes.
- **Our top two pre-generation suspects were innocent**: the escrow token-count round-trip cost 103–155ms and input moderation ~1ms. The actual cost was the **semantic response-cache lookup at 427–650ms**, running serially before retrieval for no reason. Overlapping it with RAG made it free.
- Net: **~7s (with audio stalls) → ~4.5s first audio** on novel questions, **<0.5s** on cache hits, with every safety property intact.

## Why a phone number at all

Our releases already answer on web chat, embeds, and SMS. But a phone call is the lowest-friction interface that exists — no app, no account, no screen — and for some audiences it's the *primary* interface. The bar, though, is brutal: on the web you can stream tokens into a UI and nobody minds a two-second think. On a call, silence is failure and a monologue is failure, and there is no markdown to lean on.

The non-negotiable: the phone had to be **the same assistant**. Same retrieval over the same knowledge base, same fine-tune, same guardrails, same billing, same signed transcripts. A "phone bot" that paraphrases your brand from a generic model's memory is worse than no phone bot.

## The architecture

```
caller → PSTN → Twilio Elastic SIP Trunk → LiveKit SIP → room-per-call
                                                     ↓
                                     persistent LiveKit Cloud agent
                                     (STT → LLM plugin → TTS, barge-in VAD)
                                                     ↓ OpenAI-compatible HTTP
                                     /assistant/avatar-llm/v1/chat/completions
                                                     ↓
                              anonymousChatAddMessage — the release pipeline:
                       RAG retrieval → moderation → escrow → generation →
                       per-sentence safety rewrite → signed transcript
```

Three design choices did a lot of work:

1. **The agent thinks it's talking to OpenAI.** The voice agent uses a stock OpenAI LLM plugin pointed at our own chat-completions endpoint. The `model` field smuggles the routing: `<releaseId>.<callTranscriptId>`. Grounding, fallback chains, guardrails, billing — all live behind the endpoint, so the agent stays ~150 lines.
2. **Dialed number → release.** Numbers are mapped to releases, so one deployment serves many brands; the agent reads the dialed number off the SIP participant and asks the API which release owns it.
3. **Per-call signed threads.** Each call gets a conversation key; the signed transcript rides in Redis with a TTL. Multi-turn memory (“what about strawberries?”) works exactly like our anonymous web chat, tamper-evident signatures included.

Getting this to *answer at all* had its own comedy — the ringing-forever bug turned out to be `node:22-slim` shipping without system CA certificates, which Node's own TLS tolerated (worker registered fine!) while the media engine's Rust HTTP core silently couldn't fetch region info and crashed on every job. But that's a paragraph, not the story. The story is latency.

## Chapter 1: streaming that streamed nothing

First calls worked but felt wrong: the full grounded reply was generated, then emitted as **one giant SSE delta**. The TTS engine — tuned for OpenAI-style many-small-deltas — would produce audio and then stall, tripping a 10-second force-close. Fix one: split replies into sentence-sized deltas. Audio played cleanly.

Then we built real token streaming: the generation layer already had streaming hooks (`onDelta`, threaded through our model-fallback engine), so we buffered tokens into complete sentences and emitted each one as it finished. Crucially, **each sentence passes the release's safety-rewrite before it's spoken** — our medical releases rewrite non-compliant phrasing (medication advice → physician referral), and a hard-suppress rule can stop the stream mid-answer. Streaming that bypassed the guardrail was never on the table.

We deployed it, timed it, and got… nothing. Both sentences of a two-sentence answer arrived 20ms apart, at the very end of generation.

## Chapter 2: the model was thinking

Instrumentation told the real story in two log lines:

```
[GEN-TIMING]      totalMs=4991
[AVATAR-STREAM]   firstDelta +4857ms
```

First token at **97% of generation time**. `gemini-2.5-flash` spends ~4.8 seconds in its *thinking* phase — during which it emits nothing — then delivers the entire answer in a burst. Streaming can't hide latency that produces no tokens.

The lever was `generationConfig.thinkingConfig.thinkingBudget: 0`, scoped to a `lowLatency` flag that only the voice path sets — web chat keeps full reasoning depth. Three wrong-identifier gotchas later (our release serves through the *fine-tune* generator, not the stable one; and the fine-tune's runtime model string is a Vertex endpoint path that will never match a regex for "flash" — gate on the base model id), the log finally fired:

```
🧠 thinkingBudget=0 for projects/…/models/…@1
⏱️ GEN-TIMING totalMs=3293
```

**~5–5.9s → ~3.3s.** And the quality gate held: asked "I'm on warfarin — should I start eating lots of kale and spinach?", the no-thinking model still correctly deferred to the caller's physician. (Warfarin + leafy greens is a genuine vitamin-K interaction — exactly the kind of question a medical assistant must not freestyle.)

## Interlude: the assistant that read timestamps aloud

Mid-testing, a caller reported the assistant starting its *second* reply — always the second — with "five ninety-seven zee." The transcript explained it:

```
[platform metadata — not user input]
sent: 2026-07-18T07:31:37.498Z
---
Strawberries are fantastic too! …
```

We prepend a small metadata header (send time, timezone) to *user* messages in the thread so the model has temporal context. But we were also prepending it to the model's **own past replies** in the conversation history. On turn two — the first turn where history contains an assistant message — the fine-tune saw its previous answer formatted with that header and faithfully **mimicked the format**, timestamp and all. TTS then read it aloud.

The fix is a lesson worth keeping: **never inject labeled scaffolding into assistant-role history** — a model, especially a fine-tune, will learn the pattern in a single example. Metadata belongs on user turns only; a defensive regex at the speech boundary now guarantees nothing shaped like that block can ever reach TTS again.

## Chapter 3: the innocent suspects

Generation handled, we went after the pre-generation floor. Our hypothesis ranking, from a close code-read: (1) the escrow cost-estimate makes a network CountTokens round-trip — kill it with a local approximation; (2) input moderation runs serially — parallelize it; (3) some duplicated embeddings — dedupe.

Then we instrumented every phase instead of trusting the read:

```
[PREGEN-TIMING] total=1490ms  release+sig=8ms  msgEnv=57ms
  respCache=461ms  rag=837ms  rerank+merch=1ms
  prep+auth=1ms  estimate=125ms  moderation=0ms
```

Hypothesis one: **103–155ms**. Hypothesis two: **~1ms**. Both innocent. The line item we'd ranked "lower-value" — the semantic response-cache embed+lookup — was **427–650ms on every uncached turn**, running *before* retrieval despite depending only on the prompt text.

The fix was almost embarrassingly small: kick the cache lookup off as a concurrent promise and join it just before generation. Its latency now hides entirely under retrieval:

```
[PREGEN-TIMING] total=1117ms … respCacheKickoff=6ms … respCacheAwait=0ms
```

Same cache semantics — hits still short-circuit the LLM (a repeated question answers in **0.46s**), failures still degrade to a miss — but the serial half-second is gone, and not just for voice: every anonymous chat surface got faster.

If there's one transferable engineering lesson in this whole build, it's this chapter. Two of us — one human, one AI — read the same pipeline carefully and ranked the same two suspects first. The measurement demoted both and promoted a line neither of us flagged. **Instrument before you optimize**, even when the code-read feels conclusive.

## Where it landed

| | Session start | Now |
|---|---|---|
| First audio, novel question | ~7s+, with TTS stalls | **~4.5s**, clean |
| Repeat question (semantic cache) | ~5s | **~0.5s** |
| Generation (fine-tuned flash) | ~5–5.9s | ~3.3s |
| Pre-generation | ~1.9s serial | ~1.2s, cache overlapped |
| Answer style | clipped two-sentence cap | natural spoken paragraphs, streamed per-sentence |
| Safety | full-reply rewrite | per-sentence rewrite *before* speech |

The remaining ~4.5s is honest work: ~0.8s of multi-vector retrieval and ~3.3s of fine-tuned model TTFT. The next lever isn't plumbing — it's serving the voice path from a faster model tier and letting the retrieval-grounded fine-tune verify rather than generate. That's a product decision, and it can wait for caller feedback.

What doesn't wait: every turn on that phone line settles a wallet escrow, passes input moderation, safety-rewrites each sentence before it's spoken, signs the transcript, and hangs up bounded by per-call rate caps and a release allowlist. Fast is a feature. Grounded is the product.

---

*Want your knowledge base answering a phone number? Voice Agents are in early access — [book a demo](https://meetings.hubspot.com/michael-mooring/divinci-ai), or read [example call transcripts](/voice-agent-scripts/) from our test line.*
