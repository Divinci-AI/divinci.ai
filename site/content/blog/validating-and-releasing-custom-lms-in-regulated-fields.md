+++
title = "Validating and Releasing Custom LMs in Regulated Fields"
description = "EU AI Act, GDPR Article 17, HIPAA, NIST AI RMF — mapped capability-by-capability to an LLM release pipeline. Where open vs closed weights diverge."
date = 2026-05-29T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Compliance"]
tags = ["Compliance", "EU AI Act", "GDPR", "HIPAA", "NIST AI RMF", "Audit Trail", "vIndex"]

[extra]
author = "Mike Mooring"
author_avatar = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/Michael-Mooring.webp"
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/validating-and-releasing-custom-lms-in-regulated-fields-veo31.webm"
hero_video_poster = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/images/validating-and-releasing-custom-lms-in-regulated-fields-hero-poster.webp"
reading_time = 12
summary = "Regulated-industry compliance for custom language models splits cleanly along one axis: open-weights vs closed-API. For open-weights backings, you can ship a vIndex weight-attestation that satisfies GDPR Article 17 verifiable erasure cryptographically. For closed-API backings, the same receipt covers the decision chain but can't claim weight provenance — and the regulator gets that distinction in the receipt itself. This post maps four regulatory frameworks (EU AI Act, GDPR, HIPAA, NIST AI RMF) onto the four pipeline stages we ship, and shows the actual receipt format."
+++

*Notes from the Release Cycle — Part IV*

---

A general counsel walks into the engineering review. She has one question: *"If the EU AI Act Article 17 right-to-erasure request lands tomorrow asking us to remove every fact our model learned about a specific patient, can we prove we did it?"*

The honest answer most teams have to give is: "We can fine-tune the model to forget. We can show you the training run. But we cannot prove the information is structurally gone, because it might resurface under the right adversarial prompt."

That's not a compliance answer. It's a non-answer with a procedural shrug.

This post is about what a real compliance answer looks like for custom LLMs — across four regulatory frameworks (**EU AI Act, GDPR Article 17, HIPAA, NIST AI RMF**), mapped to the four-stage pipeline ([Register → Gate → Roll → Observe](/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/)) we ship for customer releases. The headline tension running through every regulator's ask is **open-weights vs closed-API**: the things you can prove about a Gemma 4 fine-tune are not the things you can prove about a release that's served behind an opaque vendor API. The receipt format we use says so explicitly, line by line. That honesty is what makes the receipt useful to an auditor.

## The four regulators and what they each actually want

Compliance discussions tend to collapse into "we documented things." That framing fails an auditor. What auditors want is *evidence they can verify without trusting your infrastructure*. The four frameworks below all use different vocabularies for the same underlying ask.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 380" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Four regulatory frameworks and the verification primitive each one demands. EU AI Act demands documented logic and human oversight; verification primitive is bit-exact mechanistic documentation. GDPR Article 17 demands verifiable erasure of personal data; verification primitive is weight-level DELETE patch with SHA-256 receipt. HIPAA demands access audit and disclosure tracking; verification primitive is per-request signed decision log. NIST AI RMF demands governance, mapping, measurement, and management; verification primitive is hash-chained receipts for every release decision.">
<title>Four regulators, one verification asking</title>
<rect width="900" height="380" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Four regulators, one underlying ask: verify, don't trust</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">Each framework names the verification primitive differently, but the substance is the same: cryptographic proof an auditor can check.</text>
<rect x="40" y="86" width="200" height="265" fill="#ffffff" stroke="#2d5a4f" stroke-width="1.5" rx="6"/>
<rect x="40" y="86" width="200" height="34" fill="#2d5a4f" rx="6"/>
<rect x="40" y="106" width="200" height="14" fill="#2d5a4f"/>
<text x="140" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">EU AI Act</text>
<text x="55" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Annex IV asks for:</text>
<text x="55" y="161" font-size="10" fill="#4a4030">• documented logic</text>
<text x="55" y="176" font-size="10" fill="#4a4030">• training-data summary</text>
<text x="55" y="191" font-size="10" fill="#4a4030">• human oversight measures</text>
<text x="55" y="206" font-size="10" fill="#4a4030">• post-market monitoring</text>
<text x="55" y="232" font-size="11" font-weight="700" fill="#2d5a4f">Verification primitive:</text>
<text x="55" y="250" font-size="10" font-style="italic" fill="#4a4030">bit-exact mechanistic</text>
<text x="55" y="263" font-size="10" font-style="italic" fill="#4a4030">documentation via vIndex</text>
<text x="55" y="290" font-size="10" fill="#6b5d4f">Penalty for non-compliance:</text>
<text x="55" y="308" font-size="14" font-weight="700" fill="#a04848">up to 7% of</text>
<text x="55" y="324" font-size="14" font-weight="700" fill="#a04848">global turnover</text>
<rect x="260" y="86" width="200" height="265" fill="#ffffff" stroke="#a04848" stroke-width="1.5" rx="6"/>
<rect x="260" y="86" width="200" height="34" fill="#a04848" rx="6"/>
<rect x="260" y="106" width="200" height="14" fill="#a04848"/>
<text x="360" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">GDPR Art. 17</text>
<text x="275" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Right-to-erasure asks for:</text>
<text x="275" y="161" font-size="10" fill="#4a4030">• verifiable data removal</text>
<text x="275" y="176" font-size="10" fill="#4a4030">• demonstrable forgetting</text>
<text x="275" y="191" font-size="10" fill="#4a4030">• proof under adversarial</text>
<text x="275" y="204" font-size="10" fill="#4a4030">  prompting</text>
<text x="275" y="232" font-size="11" font-weight="700" fill="#a04848">Verification primitive:</text>
<text x="275" y="250" font-size="10" font-style="italic" fill="#4a4030">weight-level DELETE</text>
<text x="275" y="263" font-size="10" font-style="italic" fill="#4a4030">patch with SHA-256 receipt</text>
<text x="275" y="290" font-size="10" fill="#6b5d4f">Penalty for non-compliance:</text>
<text x="275" y="308" font-size="14" font-weight="700" fill="#a04848">up to €20M or</text>
<text x="275" y="324" font-size="14" font-weight="700" fill="#a04848">4% of turnover</text>
<rect x="480" y="86" width="200" height="265" fill="#ffffff" stroke="#c87b3c" stroke-width="1.5" rx="6"/>
<rect x="480" y="86" width="200" height="34" fill="#c87b3c" rx="6"/>
<rect x="480" y="106" width="200" height="14" fill="#c87b3c"/>
<text x="580" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">HIPAA</text>
<text x="495" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Access controls ask for:</text>
<text x="495" y="161" font-size="10" fill="#4a4030">• access audit trail</text>
<text x="495" y="176" font-size="10" fill="#4a4030">• disclosure tracking</text>
<text x="495" y="191" font-size="10" fill="#4a4030">• minimum-necessary</text>
<text x="495" y="204" font-size="10" fill="#4a4030">  PHI exposure</text>
<text x="495" y="232" font-size="11" font-weight="700" fill="#c87b3c">Verification primitive:</text>
<text x="495" y="250" font-size="10" font-style="italic" fill="#4a4030">per-request signed</text>
<text x="495" y="263" font-size="10" font-style="italic" fill="#4a4030">decision log</text>
<text x="495" y="290" font-size="10" fill="#6b5d4f">Penalty for non-compliance:</text>
<text x="495" y="308" font-size="14" font-weight="700" fill="#a04848">up to $1.9M /</text>
<text x="495" y="324" font-size="14" font-weight="700" fill="#a04848">violation-type / year</text>
<rect x="700" y="86" width="200" height="265" fill="#ffffff" stroke="#7a9580" stroke-width="1.5" rx="6"/>
<rect x="700" y="86" width="200" height="34" fill="#7a9580" rx="6"/>
<rect x="700" y="106" width="200" height="14" fill="#7a9580"/>
<text x="800" y="108" text-anchor="middle" font-size="13" font-weight="700" fill="#faf8f5">NIST AI RMF</text>
<text x="715" y="142" font-size="11" font-weight="600" fill="#1e3a2b">Four core functions:</text>
<text x="715" y="161" font-size="10" fill="#4a4030">• govern</text>
<text x="715" y="176" font-size="10" fill="#4a4030">• map</text>
<text x="715" y="191" font-size="10" fill="#4a4030">• measure</text>
<text x="715" y="206" font-size="10" fill="#4a4030">• manage</text>
<text x="715" y="232" font-size="11" font-weight="700" fill="#7a9580">Verification primitive:</text>
<text x="715" y="250" font-size="10" font-style="italic" fill="#4a4030">hash-chained receipt</text>
<text x="715" y="263" font-size="10" font-style="italic" fill="#4a4030">per release decision</text>
<text x="715" y="290" font-size="10" fill="#6b5d4f">Penalty for non-compliance:</text>
<text x="715" y="308" font-size="12" font-weight="700" fill="#1e3a2b">voluntary framework</text>
<text x="715" y="324" font-size="11" fill="#6b5d4f">(but the de facto</text>
<text x="715" y="340" font-size="11" fill="#6b5d4f">enterprise baseline)</text>
</svg>
</figure>

The penalty numbers are not what makes these frameworks interesting. The penalty numbers are what makes them load-bearing. The interesting part is the **verification primitive** — what each framework actually wants the artifact to look like. Three of the four ask for cryptographic-grade proof in different vocabularies. The fourth (NIST AI RMF) is voluntary but de facto required in enterprise procurement. They converge on the same shape: an artifact an auditor can verify without trusting your logs.

## The split: open-weights vs closed-API

Before the per-stage mapping, the most important caveat in this entire post:

**For open-weights model backings** — Gemma, Qwen, Llama, Mistral, GPT-OSS, anything where the weights are addressable and editable — every Divinci release decision emits a vIndex receipt that includes a **weight-attestation**: cryptographic proof that the active weights at decision time are exactly the weights the manifest registered. This is what makes GDPR Article 17 verifiable erasure possible. You apply a [DELETE patch](/blog/deleting-paris-from-a-language-model/) that removes a specific entity-relation from the weight space, the receipt embeds the before-and-after hash, and an auditor can verify the deletion happened by re-running the verification against the public vIndex.

**For closed-API model backings** — OpenAI, Anthropic, Google via opaque APIs — the same receipt covers the decision chain (which manifest, which gate result, which monitor reading, which user triggered which action) but **cannot claim weight provenance**, because the provider does not expose weights. The receipt explicitly notes this in a `weight_attestation: null` field with a `note` explaining why. That's not a degraded compliance posture — it's the limit of what's verifiable, written down honestly. An auditor who reads the receipt understands exactly which class of proof is and isn't being made.

This split runs through every regulator's ask below. Whenever a framework demands something at the weight level, the open-weights path can satisfy it and the closed-API path cannot. We say so in the receipt rather than implying a proof we can't deliver.

## How each framework maps to the four pipeline stages

The pipeline has four stages. Each regulator's ask maps to one or more of them. The matrix below is the actual map.

<figure style="margin: 1.5rem auto; max-width: 100%;">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 430" font-family="'DM Sans', -apple-system, sans-serif" role="img" aria-label="Mapping of four regulatory frameworks to the four-stage Divinci release pipeline. EU AI Act Annex IV documented logic and training summary mapped to Stage 1 Register. EU AI Act human oversight and post-market monitoring mapped to Stages 2 Gate and 4 Observe. GDPR Article 17 verifiable erasure mapped to Stage 1 Register via DELETE patch and Stage 4 Observe via receipt. HIPAA access audit and disclosure tracking mapped to Stages 1, 3, and 4. NIST AI RMF govern map measure manage mapped across all four stages. Five cells in the matrix are highlighted to indicate the open-weights-only verification path.">
<title>Regulatory frameworks mapped to the pipeline stages</title>
<rect width="900" height="430" fill="#faf8f5"/>
<text x="40" y="36" font-size="16" font-weight="700" fill="#1e3a2b">Which pipeline stage covers which regulatory ask</text>
<text x="40" y="56" font-size="12" fill="#6b5d4f">✓ = full coverage. ◐ = open-weights-only (weight-attestation required). The closed-API path covers the decision chain but cannot make the weight-level claim.</text>
<g font-size="11" fill="#1e3a2b" font-weight="700">
<text x="40" y="98">Framework / ask</text>
<text x="425" y="98" text-anchor="middle">① Register</text>
<text x="555" y="98" text-anchor="middle">② Gate</text>
<text x="685" y="98" text-anchor="middle">③ Roll</text>
<text x="815" y="98" text-anchor="middle">④ Observe</text>
</g>
<line x1="40" y1="108" x2="860" y2="108" stroke="#d4c8b0" stroke-width="1"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="130" font-weight="600">EU AI Act</text>
<text x="40" y="146" font-size="10" fill="#6b5d4f">Annex IV: documented logic</text>
<text x="425" y="146" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="146" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="168" font-size="10" fill="#6b5d4f">Annex IV: training-data summary</text>
<text x="425" y="168" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="168" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="190" font-size="10" fill="#6b5d4f">Human oversight measures</text>
<text x="425" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="190" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="190" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="40" y="212" font-size="10" fill="#6b5d4f">Post-market monitoring</text>
<text x="425" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="212" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="212" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="226" x2="860" y2="226" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="246" font-weight="600">GDPR Article 17</text>
<text x="40" y="262" font-size="10" fill="#6b5d4f">Verifiable erasure (DELETE patch)</text>
<text x="425" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="555" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="262" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="262" text-anchor="middle" font-size="13" fill="#a04848" font-weight="700">◐</text>
<text x="40" y="284" font-size="10" fill="#6b5d4f">Erasure receipt (hash-chained)</text>
<text x="425" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="284" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="284" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
<line x1="40" y1="298" x2="860" y2="298" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="318" font-weight="600">HIPAA</text>
<text x="40" y="334" font-size="10" fill="#6b5d4f">Per-request access audit</text>
<text x="425" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="555" y="334" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="685" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="334" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="40" y="356" font-size="10" fill="#6b5d4f">Disclosure tracking + minimum-necessary</text>
<text x="425" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="356" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
<text x="815" y="356" text-anchor="middle" font-size="10" fill="#8a7d68">—</text>
</g>
<line x1="40" y1="370" x2="860" y2="370" stroke="#e8dcc4" stroke-width="0.5"/>
<g font-size="11" fill="#1e3a2b">
<text x="40" y="390" font-weight="600">NIST AI RMF</text>
<text x="40" y="406" font-size="10" fill="#6b5d4f">Govern · Map · Measure · Manage</text>
<text x="425" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="555" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="685" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
<text x="815" y="406" text-anchor="middle" font-size="13" fill="#2d5a4f">✓</text>
</g>
</svg>
</figure>

The two ◐ cells are the GDPR Article 17 / open-weights-only entries — these are the asks the closed-API path cannot fully satisfy. Everything else applies to both backings.

The rest of the post walks each stage's contribution.

## Stage ① — Register

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #2d5a4f; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">①</div>
  <div style="background: rgba(45, 90, 79, 0.08); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">REGISTER</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">The release manifest is the EU AI Act Annex IV technical documentation.</span>
  </div>
</div>

The Register stage produces an immutable JSON manifest, addressed by SHA-256. For regulated releases the manifest carries everything Annex IV<sup><a href="#ref-1">[1]</a></sup> asks for in one artifact:

- The model artifact (HF repo + commit SHA, or a vIndex patch reference)
- The prompt template (every variable, every system message — version-controlled)
- The routing rules (which traffic class lands on which release)
- The dataset version used to compute gate thresholds (training-data summary by hash)
- The previous release's SHA (so the audit chain is unbroken)
- The disclosure scope — for HIPAA deployments, which PHI categories the model is permitted to receive

The manifest is the documentation. An auditor doesn't read prose; they read the manifest hash and verify the bundle. No prose summary written-six-months-later required.

**Open-weights bonus.** When the model artifact references an open-weights model, the manifest also embeds the `vindex_sha256` — the cryptographic fingerprint of the model's published [vIndex](/compliance/). That fingerprint is what lets a third party verify the active weights without ever having to trust our deployment infrastructure.

**Closed-API caveat.** When the model artifact references a closed-API model, the manifest's `vindex_sha256` field is `null`, and the manifest's `weight_attestation_class` is `decision_chain_only`. The auditor reading this knows exactly what's claimed and what isn't.

## Stage ② — Gate

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #b8a080; color: #1e3a2b; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">②</div>
  <div style="background: rgba(184, 160, 128, 0.16); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">GATE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Per-slice quality gates carry the EU AI Act human-oversight requirement.</span>
  </div>
</div>

The Gate stage is where the EU AI Act's "human oversight measures"<sup><a href="#ref-1">[1]</a></sup> get operationalized. A regulator who reads the EU AI Act and concludes "we need a human approval workflow" has missed the point — the harder ask is *what's the human approving against*. The Gate stage answers that question with a per-slice Spearman ρ against a human-anchored grader<sup><a href="#ref-3">[3]</a></sup>. Each slice that matters in your regulatory posture (pediatric oncology, IP licensing, Belgian French) gets its own threshold. The override path requires a written rationale that goes into the audit trail.

For HIPAA-covered deployments, this is also where the "minimum-necessary" disclosure rule lives. The gate's scored-QA suite includes negative tests for PHI over-exposure — answers that include personal identifiers when none were asked. A release that regresses on the over-exposure slice fails the gate, regardless of how its other slices perform.

For NIST AI RMF, the Gate stage covers the "measure" function — the per-slice numerical evidence that the system is performing within configured tolerances.

## Stage ③ — Roll

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #c87b3c; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">③</div>
  <div style="background: rgba(200, 123, 60, 0.12); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">ROLL</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">Canary checkpoints become the post-market monitoring artifact.</span>
  </div>
</div>

EU AI Act post-market monitoring<sup><a href="#ref-1">[1]</a></sup> requires the operator to demonstrate *ongoing* — not just pre-launch — observation of how the AI system performs in real conditions. A 5% → 25% → 100% canary with quality-monitor checkpoints is the most natural way to satisfy this. The dwell at each checkpoint, plus the monitor readings during the dwell, is what an auditor wants to see.

For HIPAA, the canary stage is also where per-request audit logging gets exercised end-to-end. Every checkpoint produces a sample of signed request-response receipts; if any of them have a misconfigured PHI handling, it surfaces at 5% traffic instead of at 100%.

## Stage ④ — Observe

<div style="display: flex; align-items: stretch; gap: 0; margin: 1rem 0 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid rgba(184, 160, 128, 0.4);">
  <div style="background: #7a9580; color: #faf8f5; padding: 0.75rem 1.25rem; font-size: 1.6rem; font-weight: 700; display: flex; align-items: center; line-height: 1;">④</div>
  <div style="background: rgba(122, 149, 128, 0.14); padding: 0.7rem 1rem; flex: 1; display: flex; align-items: center;">
    <strong style="color: #1e3a2b; letter-spacing: 0.04em;">OBSERVE</strong>
    <span style="color: #6b5d4f; margin-left: 0.8rem; font-size: 0.92rem;">The continuous monitor + the receipt format make GDPR Article 17 verifiable.</span>
  </div>
</div>

This is the stage that earns the compliance story. The Observe stage runs continuous trace replay through the active release, scored by the same human-anchored judge from Gate, with a quality monitor that triggers automatic rollback if it breaches.

Every release decision — register, gate-pass, gate-fail, gate-override, checkpoint-promote, checkpoint-hold, auto-rollback, manual-rollback, **and any GDPR Article 17 DELETE patch application** — emits a vIndex receipt. Hash-chained to the previous receipt for this customer and the previous receipt for this release.

Here is the shape of a receipt for a GDPR Article 17 DELETE patch — a worked example with placeholder identifiers and figures, using the format documented on the [compliance page](/compliance/):

```json
{
  "name": "gdpr-art17-patient-12348-removal",
  "version": 1,
  "base_model": "google/gemma-4-E2B-it",
  "manifest_sha256": "9abaeaf6c91f8b...",
  "previous_manifest_sha256": "8f72b1de4a93c5...",
  "created_at": "2026-05-29T03:17:42Z",
  "user_id": "compliance-officer-7c4e1a",
  "operation": {
    "op": "delete",
    "entity": "patient-record-12348",
    "relation": "diagnosis-association",
    "target": "weight-feature-11179-layer-27",
    "weight": -1.0
  },
  "verification": {
    "before_feature_11179_score": 17.34,
    "before_feature_11179_rank": 1,
    "after_feature_11179_score": null,
    "after_feature_11179_rank": "ABSENT_FROM_TOP_25",
    "perplexity_delta_wikitext103": "+0.02%",
    "vindex_sha256_before": "abc12...",
    "vindex_sha256_after":  "def34..."
  },
  "weight_attestation_class": "full",
  "chain_signature": "sha256(manifest || prev_manifest || user_id || created_at || prev_chain_signature)"
}
```

A receipt in this format is verifiable. An auditor doesn't have to trust our logs. They take the `vindex_sha256_after`, pull the corresponding published vIndex from `huggingface.co/Divinci-AI`, and verify that feature 11179 in layer 27 is structurally absent from the top-25. They take the `chain_signature` and verify it against the prior receipt. The whole chain is anchored externally on a schedule the customer configures.

**Same operation against a closed-API model.** The receipt fields above change in three ways: `operation.target` becomes `provider_api_endpoint`, `verification` becomes a different schema covering decision-chain evidence only, and `weight_attestation_class` becomes `decision_chain_only`. The closed-API model provider has not exposed weights, so the receipt says so. An auditor who wants weight-level proof now knows they need to escalate to the provider, not to us.

This is the differentiation that nobody else in 2026 ships. The eval-CI camp (Braintrust, Humanloop, Patronus) doesn't sit on traffic and doesn't emit decision receipts. The serving-canary camp (SageMaker Deployment Guardrails<sup><a href="#ref-2">[2]</a></sup>, KServe, Vertex, BentoCloud, Seldon) emits infra-metric logs but not hash-chained compliance receipts. The observability camp (Arize, Phoenix, Confident, Deepchecks) watches output but doesn't enforce.

## What does an auditor actually verify?

A useful exercise: walk through the questions a real auditor will ask, and which artifact answers each one.

| Auditor question | Artifact that answers it |
|---|---|
| *"Which model version was running on March 15th at 14:22 UTC?"* | The Observe-stage receipt for that timestamp, signed and hash-chained. |
| *"What evaluation did this release pass before promote?"* | The Gate-stage receipt, with the per-slice Spearman ρ table and the dataset SHA the gate ran against. |
| *"Was a GDPR Article 17 erasure request for patient X actually applied?"* | The DELETE-patch receipt above. The auditor verifies `vindex_sha256_after` against the published vIndex. |
| *"Who approved this release? What was their stated rationale for overriding the IP-licensing slice gate?"* | The Gate-stage receipt's `override` block, including the user ID and the required free-text rationale. |
| *"How fast did the rollback fire, and what monitor reading triggered it?"* | The Observe-stage rollback receipt, with the three consecutive sub-threshold quality readings and the rollback elapsed time. |
| *"Show me the post-market monitoring evidence for the last 90 days."* | The Observe-stage receipt chain. Anchored externally on the customer's configured schedule. |

What the auditor *doesn't have to do*: trust our Datadog. Trust our CloudWatch. Trust a screenshot. Trust an export. The whole point of the receipt format is that the auditor can verify it independently.

## What this does not solve

Three honest limitations:

**Closed-API regressions in GDPR Article 17 territory are not solvable at the platform layer.** If you're serving a healthcare assistant behind a closed-API model and a patient invokes Article 17, the platform can attest the patient's record was removed from your retrieval store, your prompt template, and your routing rules — but cannot attest the underlying model weights forgot the patient's data. You need either an open-weights backing or a vendor commitment to weight-level erasure. We say so in the receipt.

**Documentation is necessary but not sufficient.** A receipt that proves a model met a threshold doesn't prove the threshold was the right threshold. If your scored-QA suite doesn't cover the slice that actually matters to a patient in your service, no amount of receipt-chaining fixes that. Regulators increasingly understand this; "we passed our eval" is no longer a sufficient compliance answer if the eval was the wrong eval.

**The vIndex format is single-vendor.** We use it because it's the most concrete cryptographic primitive available today for weight-level proof. If the industry settles on a different format — model-cards-with-hashes, NIST-published artifact schemas — the receipt format should evolve to that. The substance (hash-chained, externally verifiable, weight-attestation-aware) is what's load-bearing, not the specific schema name. We expect that to change as the regulatory and standards landscape matures.

## FAQ

### What is verifiable erasure under GDPR Article 17 for AI systems?

Verifiable erasure means a third party can verify the data was removed without having to trust your logs. Fine-tuning a model to "forget" specific information does not meet this standard — the information can resurface under adversarial prompting, and there's no cryptographic primitive an auditor can check. A weight-level DELETE patch with a published before/after vIndex hash *does* meet the standard, because the auditor can re-run the verification against the public artifact.

### Why can't closed-API models satisfy GDPR Article 17 the same way?

Because the provider does not expose weights. Without access to the weights, no third party — including the customer using the API — can issue or verify a weight-level erasure. The decision-chain part of the receipt (which prompt template was used, which retrieval store the data came from, which routing rules were active) is still verifiable, but the weight-level claim isn't. This is a limit of what's verifiable when weights are private, not a limit of the compliance framework.

### What does the EU AI Act Annex IV require, in plain English?

Annex IV asks for technical documentation covering the system's logic, training data summary, intended use, human oversight measures, and post-market monitoring. The trap most teams fall into is treating these as five separate documents. The release manifest at Stage 1 carries the first three asks as a single hash; the Gate stage covers the fourth; the Roll + Observe stages cover the fifth. One pipeline; four asks satisfied as a byproduct of normal operations.

### How fast should rollback be for HIPAA-covered deployments?

HIPAA doesn't specify a rollback time, but the HHS guidance on breach response treats time-to-containment as load-bearing. A rollback in the order of seconds (in-flight drain on a manifest-driven flip — our number is around 12 seconds) is structurally faster than a typical infra-metric blue-green that depends on alarm propagation. Compare to public postmortems: Cloudflare's June 2022 incident<sup><a href="#ref-4">[4]</a></sup> took 44 minutes to revert because engineers walked over each other's reverts.

### How does NIST AI RMF map to a release pipeline?

NIST AI RMF's four core functions — Govern, Map, Measure, Manage — span the whole release lifecycle, not a single stage. Govern is the documented release policy plus the gate-override rationale workflow (Register + Gate stages). Map is the per-slice scored-QA suite (Gate). Measure is the per-slice Spearman thresholds and the continuous quality monitor (Gate + Observe). Manage is the rollback path and the receipt chain (Observe). All four are covered when the pipeline emits its full receipt set.

## References

<ol class="post-references" style="padding-left: 1.5rem;">
<li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>EU AI Act.</strong> <a href="https://artificialintelligenceact.eu/" target="_blank" rel="noopener">artificialintelligenceact.eu</a>. Annex IV defines the technical documentation requirements for high-risk AI systems: system logic, training data summary, human oversight measures, post-market monitoring. Penalties up to 7% of global turnover for non-compliance.
</li>
<li id="ref-2" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>AWS SageMaker Deployment Guardrails.</strong> <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-blue-green-canary.html" target="_blank" rel="noopener">Use canary traffic shifting</a> + <a href="https://docs.aws.amazon.com/sagemaker/latest/dg/deployment-guardrails-configuration.html" target="_blank" rel="noopener">Auto-Rollback Configuration</a>. Default <code>TerminationWaitInSeconds</code> 600, max <code>MaximumExecutionTimeoutInSeconds</code> 1800. Cited as the industry-standard infra-metric canary that the Stage 4 quality monitor is contrasted against.
</li>
<li id="ref-3" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Calibrated LLM-as-judge agreement.</strong> Zheng et al., <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noopener"><em>Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena</em></a> (NeurIPS 2023). &gt;80% overall GPT-4-vs-human agreement, with per-category variance from coding (86%) down to writing (36–44%). Anchor for the per-slice Spearman calibration that drives the Gate stage.
</li>
<li id="ref-4" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Cloudflare June 2022 outage.</strong> <a href="https://blog.cloudflare.com/cloudflare-outage-on-june-21-2022/" target="_blank" rel="noopener">Cloudflare outage on June 21, 2022</a>. 44 minutes from "we know what to revert" to revert complete because engineers walked over each other's reverts. Anchor for the "manifest-driven rollback can't have that failure mode" claim.
</li>
<li id="ref-5" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>NIST AI Risk Management Framework.</strong> <a href="https://www.nist.gov/itl/ai-risk-management-framework" target="_blank" rel="noopener">NIST AI RMF</a>. Voluntary framework — Govern, Map, Measure, Manage — that has become the de facto enterprise procurement baseline for AI governance. Voluntary but enforced in practice through customer due-diligence questionnaires.
</li>
<li id="ref-6" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>HIPAA Privacy Rule.</strong> <a href="https://www.hhs.gov/hipaa/for-professionals/privacy/index.html" target="_blank" rel="noopener">HHS Office for Civil Rights</a>. Minimum-necessary disclosure, access audit, and breach response timing requirements applicable to any AI system that touches PHI. Civil monetary penalties up to $1.9M per violation-type per year per <a href="https://www.federalregister.gov/documents/2024/11/15/2024-26535/civil-monetary-penalties-inflation-adjustments-for-2025" target="_blank" rel="noopener">CMP inflation adjustment, 2025</a>.
</li>
<li id="ref-7" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>GDPR Article 17 (Right to Erasure).</strong> <a href="https://gdpr-info.eu/art-17-gdpr/" target="_blank" rel="noopener">gdpr-info.eu/art-17-gdpr</a>. The data subject's right to obtain erasure of personal data, and the controller's obligation to demonstrate compliance under Article 5(2) accountability. Penalties up to €20M or 4% of annual global turnover.
</li>
<li id="ref-8" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
<strong>Internal — vIndex receipt format.</strong> The receipt JSON in this post is adapted from the format documented on the <a href="/compliance/">compliance page</a> and demonstrated in the <a href="/blog/deleting-paris-from-a-language-model/">"Deleting Paris from a Language Model"</a> post. The hash chain is SHA-256 over <code>manifest || prev_manifest || user_id || created_at || prev_chain_signature</code>. Externally anchorable on a customer-configured schedule.
</li>
</ol>

---

*Next in this series:* **Automated LLM CI/CD Pipelines With Instant Rollback.** This post showed what an auditor wants. The next one shows the operational pattern that makes the receipt arrive at the auditor's desk in seconds rather than weeks — the automation under the four-stage pipeline, with a focus on what changes when the rollback fires on its own.
