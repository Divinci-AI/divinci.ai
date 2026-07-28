+++
title = "AI Voice Agents — Your Grounded Assistant, On a Real Phone Number"
description = "Give your Divinci release a phone number. Callers get the same RAG-grounded, guardrailed, fine-tuned assistant you ship on the web — streaming answers in seconds over an ordinary phone call. No app, no browser, no sign-up."
template = "feature.html"
[extra]
hero_poster = "images/voice-agents-hero.webp"
feature_category = "ai-config"
+++

<style>
/* Page-specific Leonardo journal background — reuses the AutoRAG art */
.feature-page.leonardo-bg::before {
    background-image: url('/images/bg-autorag.svg') !important;
    background-repeat: no-repeat !important;
    background-size: 100% auto !important;
    background-position: top center !important;
    opacity: 1 !important;
}

.feature-page .section-padding { padding: clamp(4rem, 8vw, 7rem) 0; }

.feature-page .section-heading {
    font-family: 'Fraunces', serif;
    font-size: clamp(2rem, 5vw, 2.6rem);
    color: #1e3a2b;
    text-align: center;
    margin-top: clamp(3.5rem, 7vw, 6rem);
    margin-bottom: clamp(2rem, 4vw, 3.5rem);
    line-height: 1.2;
}

.feature-page .section-subheading {
    font-family: 'DM Sans', sans-serif;
    font-size: 1.1rem;
    color: #5a6862;
    text-align: center;
    max-width: 760px;
    margin: -0.5rem auto clamp(2rem, 4vw, 3rem);
    line-height: 1.55;
}

/* Full-bleed hero — same feature-hero template as AutoRAG / blog posts.
   Direct /images/ poster (already ~105KB WebP). Staging CIR is not in the
   allowed-origins list (ERROR 9401), so skip /cdn-cgi/image/ srcset here.
   Video plays first so the phone is visible; glass plaque fades in after 2s. */
.feature-page .feature-hero {
    min-height: min(72vh, 720px);
    padding: 7rem 2rem 5rem;
}
.feature-page .feature-hero-bg img,
.feature-page .feature-hero-bg video {
    object-position: center 40%;
}
/* Hold the global gradient + glass plaque transparent until reveal */
.feature-page .feature-hero.va-hero-deferred::before {
    opacity: 0;
    transition: opacity 1.1s ease;
}
.feature-page .feature-hero.va-hero-deferred.va-hero-revealed::before {
    opacity: 1;
}
.feature-page .feature-hero.va-hero-deferred .feature-hero-inner {
    opacity: 0;
    transform: translateY(12px);
    transition: opacity 1.1s ease, transform 1.1s ease;
    pointer-events: none;
}
.feature-page .feature-hero.va-hero-deferred.va-hero-revealed .feature-hero-inner {
    opacity: 1;
    transform: none;
    pointer-events: auto;
}
@media (prefers-reduced-motion: reduce) {
    .feature-page .feature-hero.va-hero-deferred::before,
    .feature-page .feature-hero.va-hero-deferred .feature-hero-inner {
        opacity: 1 !important;
        transform: none !important;
        transition: none !important;
        pointer-events: auto !important;
    }
}

.va-pipeline {
    max-width: 860px;
    margin: 0 auto 2rem;
    background: rgba(248, 244, 240, 0.9);
    border: 2px solid rgba(184, 160, 128, 0.25);
    border-radius: 16px;
    padding: 2rem 2.25rem;
    font-family: 'DM Sans', sans-serif;
}
.va-pipeline .va-flow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.95rem;
    color: #2d5a4f;
    text-align: center;
    line-height: 2;
    margin-bottom: 1.25rem;
}
.va-pipeline p { color: #4a5852; line-height: 1.6; margin: 0.6rem 0; }

.va-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    max-width: 1020px;
    margin: 0 auto 2rem;
}
.va-card {
    background: rgba(248, 244, 240, 0.92);
    border: 2px solid rgba(184, 160, 128, 0.22);
    border-radius: 14px;
    padding: 1.6rem 1.5rem;
    font-family: 'DM Sans', sans-serif;
}
.va-card h4 {
    font-family: 'Fraunces', serif;
    color: #1e3a2b;
    font-size: 1.25rem;
    margin: 0 0 0.6rem;
}
.va-card p { color: #4a5852; line-height: 1.55; margin: 0; font-size: 0.98rem; }
.va-badge {
    display: inline-block;
    background: #2d5a4f;
    color: #faf8f5;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 0.25rem 0.7rem;
    border-radius: 50px;
    margin-bottom: 0.7rem;
}

.va-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 1.25rem;
    max-width: 900px;
    margin: 0 auto 1.5rem;
    text-align: center;
}
.va-stat {
    background: rgba(45, 90, 79, 0.06);
    border: 2px solid rgba(45, 90, 79, 0.18);
    border-radius: 14px;
    padding: 1.4rem 1rem;
}
.va-stat .num {
    font-family: 'Fraunces', serif;
    font-size: 2.2rem;
    color: #2d5a4f;
    display: block;
    line-height: 1.1;
}
.va-stat .lbl {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.9rem;
    color: #5a6862;
}
.va-note {
    font-family: 'DM Sans', sans-serif;
    font-size: 0.88rem;
    color: #7a8680;
    text-align: center;
    max-width: 720px;
    margin: 0 auto 2rem;
}

.va-transcript {
    max-width: 720px;
    margin: 0 auto 2rem;
    background: #1e3a2b;
    border-radius: 16px;
    padding: 1.8rem 2rem;
    font-family: 'DM Sans', sans-serif;
}
.va-transcript .line { margin: 0.7rem 0; line-height: 1.55; }
.va-transcript .caller { color: #b8a080; }
.va-transcript .agent { color: #e8f0ec; }
.va-transcript .who {
    font-weight: 700;
    font-size: 0.8rem;
    letter-spacing: 0.05em;
    display: block;
    opacity: 0.75;
}
</style>

<div class="feature-hero va-hero-deferred" id="va-hero">
  <div class="feature-hero-bg">
    <img src="/images/voice-agents-hero.webp" width="1408" height="768" alt="Brass telephone handset with a glowing neural network — Divinci AI Voice Agents" loading="eager" fetchpriority="high" decoding="async">
    <video autoplay muted loop playsinline webkit-playsinline preload="none" data-hero-video aria-label="Animated brass telephone handset with glowing neural network">
      <source src="https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/voice-agents-hero.webm" type="video/webm">
    </video>
  </div>
  <div class="feature-hero-inner">
    <div class="feature-hero-card">
      <h1>AI Voice Agents</h1>
      <p class="subtitle">Give your Divinci release a phone number. Callers dial an ordinary number and talk to the <strong>same grounded assistant</strong> you ship on the web — your knowledge base, your fine-tune, your guardrails — with streaming answers that start speaking in seconds. No app. No browser. No sign-up.</p>
      <div class="hero-ctas">
        <a href="https://chat.divinci.app/signup" class="cta-primary" target="_blank" rel="noopener">Try it out</a>
        <a href="/blog/grounded-voice-agents-real-phone-calls/" class="cta-secondary">Read the engineering deep-dive →</a>
      </div>
    </div>
  </div>
</div>
<script>
(function () {
  var hero = document.getElementById('va-hero');
  if (!hero) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) {
    hero.classList.add('va-hero-revealed');
    return;
  }
  var revealed = false;
  function reveal() {
    if (revealed) return;
    revealed = true;
    hero.classList.add('va-hero-revealed');
  }
  // Show the phone for ~2s of video, then fade in the glass plaque + text.
  var video = hero.querySelector('video[data-hero-video]');
  var startedAt = null;
  function armFromPlay() {
    if (startedAt != null) return;
    startedAt = Date.now();
    setTimeout(reveal, 2000);
  }
  if (video) {
    video.addEventListener('playing', armFromPlay, { once: true });
    // Fallback if autoplay is blocked or video never fires — still reveal.
    setTimeout(reveal, 4500);
  } else {
    setTimeout(reveal, 2000);
  }
})();
</script>

<h2 class="section-heading">What happens when someone calls</h2>

<p class="section-subheading">A Voice Agent is not a separate chatbot with a microphone bolted on. The call rides the exact same release pipeline as your web chat — retrieval, fine-tune, fallbacks, moderation, billing — with a real-time voice loop wrapped around it.</p>

<div class="va-pipeline">
  <div class="va-flow">caller dials your number → SIP trunk → LiveKit room<br>→ speech-to-text → <strong>your grounded release</strong> → per-sentence safety pass → text-to-speech<br>→ the caller hears the first sentence while the next one is still generating</div>
  <p><strong>Telephony:</strong> your existing numbers connect over an elastic SIP trunk into a LiveKit media room — one room per call, with a persistent cloud agent worker that answers whether or not anyone on your team has a laptop open.</p>
  <p><strong>The brain:</strong> the agent speaks to your release through an OpenAI-compatible endpoint that fronts Divinci's grounded chat pipeline — RAG retrieval across your vectors, your fine-tuned model, model fallback chains, and signed transcripts, identical to web chat.</p>
  <p><strong>The voice:</strong> telephony-tuned speech recognition and natural text-to-speech, with barge-in — callers can interrupt mid-answer, like a real conversation.</p>
</div>

<h2 class="section-heading">Built for real conversations</h2>

<div class="va-grid">

<div class="va-card">
  <span class="va-badge">GROUNDED</span>
  <h4>Your knowledge, not the model's guess</h4>
  <p>Every answer is retrieved from your release's knowledge base and generated by your configured model — including fine-tunes. If your web assistant recommends against olive oil, so does your phone line. Same brain, different wire.</p>
</div>

<div class="va-card">
  <span class="va-badge">STREAMING</span>
  <h4>Sentence-by-sentence speech</h4>
  <p>The model's answer is streamed, split into complete sentences, safety-checked per sentence, and spoken as it's produced. The caller hears sentence one while sentence two is still generating — no long dead air before a wall of speech.</p>
</div>

<div class="va-card">
  <span class="va-badge">SAFE</span>
  <h4>Guardrails before the words are spoken</h4>
  <p>Each sentence passes your release's safety-rewrite rules <em>before</em> it reaches text-to-speech. For regulated domains — health, finance — non-compliant phrasing is rewritten or suppressed mid-stream, not after the caller has already heard it.</p>
</div>

<div class="va-card">
  <span class="va-badge">ROUTED</span>
  <h4>One number per release</h4>
  <p>Phone numbers map to releases. Run one line for your flagship assistant and another for a different product or brand — each call is routed to the release that owns the dialed number, with graceful fallback.</p>
</div>

<div class="va-card">
  <span class="va-badge">REMEMBERS</span>
  <h4>Multi-turn call memory</h4>
  <p>Ask about blueberries, then "what about strawberries?" — the agent keeps per-call conversational context with cryptographically signed transcripts, the same tamper-evident thread model as anonymous web chat.</p>
</div>

<div class="va-card">
  <span class="va-badge">METERED</span>
  <h4>Wallet-bounded, rate-limited</h4>
  <p>Every turn settles through the release wallet with escrowed cost estimates, per-call turn caps, and a release allowlist — a phone line can never run up an unbounded bill.</p>
</div>

</div>

<h2 class="section-heading">Engineered for speed</h2>

<p class="section-subheading">We measured every phase of the call path and cut the ones that didn't earn their latency — reasoning-phase elimination on flash models, per-sentence streaming, and concurrent cache lookups. The numbers below are from our staging test line.</p>

<div class="va-stats">
  <div class="va-stat"><span class="num">~4.5s</span><span class="lbl">first audio on a novel question</span></div>
  <div class="va-stat"><span class="num">&lt;0.5s</span><span class="lbl">repeat questions (semantic cache)</span></div>
  <div class="va-stat"><span class="num">~35%</span><span class="lbl">generation latency cut by disabling the model's thinking phase for voice</span></div>
  <div class="va-stat"><span class="num">100%</span><span class="lbl">of sentences safety-checked before speech</span></div>
</div>

<p class="va-note">Measured on a RAG-grounded, fine-tuned release answering novel questions end-to-end (retrieval + generation + safety pass). Simple FAQ-style deployments are faster still.</p>

<h2 class="section-heading">Hear it in action</h2>

<p class="section-subheading">A lightly-trimmed exchange from our staging test line, running a nutrition-expert release. Note the answer is the <em>expert's</em> position — grounded in the release's knowledge base — not a generic model's.</p>

<div class="va-transcript">
  <div class="line caller"><span class="who">CALLER</span>Is olive oil healthy?</div>
  <div class="line agent"><span class="who">AGENT</span>No, olive oil is not a health food; it's very calorically dense, contributes to weight gain, and can raise your LDL cholesterol. While a tiny amount might be okay for someone very thin and active, most people should avoid it.</div>
  <div class="line caller"><span class="who">CALLER</span>I take blood pressure medication. Is it safe for me to start eating lots of leafy greens?</div>
  <div class="line agent"><span class="who">AGENT</span>Leafy greens are wonderfully beneficial for blood pressure, and I highly recommend them, but please discuss your dietary changes with your doctor so they can monitor your medication needs.</div>
</div>

<p style="text-align: center; margin: 0 0 3rem;">
  <a href="/voice-agent-scripts/" style="display: inline-block; background: transparent; color: #2d5a4f; padding: 0.85rem 2rem; border-radius: 50px; font-weight: 700; text-decoration: none; border: 2px solid #2d5a4f;">Read more example call transcripts →</a>
</p>

<h2 class="section-heading">Bring your own number</h2>

<p class="section-subheading">Already have a business number your customers know? Adopt it into a release without porting — the number keeps working, and now it answers. New numbers can be provisioned per release, with SMS and MMS support on the same number: callers can text your assistant a question or even a photo, and get a grounded reply with cited sources.</p>

<section class="section-padding" style="text-align: center;">
  <h2 style="font-family: 'Fraunces', serif; font-size: 2.2rem; color: #1e3a2b; margin-bottom: 1rem;">Put your assistant on the line</h2>
  <p style="font-family: 'DM Sans', sans-serif; color: #5a6862; max-width: 640px; margin: 0 auto 2rem; line-height: 1.55;">Voice Agents are live in the Divinci app. Sign up, attach a number to your release, and let your grounded assistant answer the phone.</p>
  <a href="https://chat.divinci.app/signup" target="_blank" rel="noopener" style="display: inline-block; background: #2d5a4f; color: #faf8f5; padding: 0.95rem 2.4rem; border-radius: 50px; font-weight: 700; text-decoration: none;">Sign up</a>
</section>
