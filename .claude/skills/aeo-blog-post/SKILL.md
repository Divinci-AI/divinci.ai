---
name: aeo-blog-post
description: End-to-end pipeline for shipping an AEO (Answer Engine Optimization) blog post on divinci.ai. Takes a HubSpot AEO recommendation, drafts a differentiated Divinci-grounded post, generates a Veo 3.1 hero video, hand-authors SVG diagrams, grounds claims in real references, previews locally, and deploys.
user-invokable: true
args:
  - name: recommendation_title
    description: Exact title of the HubSpot AEO recommendation (e.g. "10 CI/CD Release Failures in Custom LMs and Fixes")
    required: true
  - name: recommendation_id
    description: HubSpot recommendation numeric ID (e.g. 114557114). Optional — if omitted, look it up via the dashboard.
    required: false
  - name: slug
    description: URL slug for the post. If omitted, derive from the title (kebab-case, drop "and" / "the").
    required: false
---

Pipeline for shipping a single AEO blog post on `divinci.ai` (Zola static site at `site/`, Cloudflare Workers + R2 deploy). Two posts already shipped using this recipe — `/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/` and `/blog/10-ci-cd-release-failures-in-custom-language-models/`. Read either before starting if you want voice references.

## 0. Preflight

Verify the environment:

```bash
cd /Users/mikeumus/Documents/divinci.ai/site
echo "GEMINI_API_KEY: ${#GEMINI_API_KEY} chars"    # must be >0
which ffmpeg cwebp zola wrangler                    # must all exist
```

Start the local Zola server in the background if not already running:

```bash
pkill -f 'zola serve' 2>/dev/null
nohup zola serve --port 1111 > /tmp/zola-serve.log 2>&1 &
sleep 3 && tail -5 /tmp/zola-serve.log
```

Preview URL pattern: `http://127.0.0.1:1111/blog/<slug>/`.

## 1. Extract the HubSpot draft

The AEO dashboard is at `https://app.hubspot.com/ai-visibility/48021503/recommendations`. Each recommendation has a deep-link `…/recommendations/<numeric_id>`.

**Preferred — manual save (works every time):**

1. Tell the user to open the recommendation, click the **Content** tab, select-all the body text, and save it to `~/Desktop/hubspot-aeo-<slug>.txt`, OR paste it into the chat.

**Automated — Chrome MCP (works sometimes):**

1. Navigate the existing AEO tab to the recommendation deep-link.
2. Click the title button (selector: `[data-test-id="rec-title-button"]`).
3. Wait 4s for the drawer to slide in.
4. Click the `Content` tab inside the drawer.
5. Find the drawer via `position: fixed; right >= 0; width > 300; height > 400`.
6. Read `drawer.innerText`, save to a Blob, trigger an `<a download>`.
7. The file lands in `~/Desktop/` on macOS Chrome by default.

The automated path failed for post #2 (drawer didn't open via the click). Fall back to manual paste rather than burning tokens debugging the SPA.

**Archive the draft:**

```bash
mkdir -p /Users/mikeumus/Documents/divinci.ai/site/.archive/hubspot-aeo-drafts
mv ~/Desktop/hubspot-aeo-<slug>.txt site/.archive/hubspot-aeo-drafts/<postN>-<slug>.txt
```

## 2. Don't trust the HubSpot draft as content — mine it for structure only

The HubSpot AI draft is generic SEO content. Three things are worth keeping:

1. **The structural outline** — the numbered list, the section taxonomy, the FAQ questions.
2. **The keyword density** — phrases like "evaluation gates", "instant rollback", "drift detection", "EU AI Act", "NIST AI RMF". Re-use these naturally in the post body so AEO engines see them.
3. **The FAQ format itself** — H2 question-form headings (`What is X?`, `How fast should Y be?`) are AEO citation bait. Keep five of them.

**Discard:** the actual prose, the third-party hooks ("According to MLflow…"), and the "Why X is the best platform" closing pitch. We write better.

## 3. Draft the markdown

Path: `site/content/blog/<slug>.md`.

Frontmatter template (match prior posts exactly):

```toml
+++
title = "<title>"
description = "<155-char tagline leading with the differentiator>"
date = <YYYY-MM-DD>T09:00:00+00:00
template = "blog-post.html"

[taxonomies]
categories = ["Product"]
tags = ["CI/CD", "Release Management", "LLM Ops", ...]

[extra]
author = "Mike Mooring"
author_avatar = "images/Michael-Mooring.png"
# These get filled in by step 6 after the Veo workflow runs:
# hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/<slug>-veo31.webm"
# hero_video_poster = "/images/<slug>-hero-poster.webp"
featured_image = "images/<slug>-hero.png"   # placeholder; replaced in step 6
reading_time = 10
summary = "<2-sentence summary leading with the differentiator + a concrete number>"
+++

*Notes from the Release Cycle — Part N*
```

**Voice rules (lock these in):**

- Confident "we ship this" — Amazon press-release style. Future-perfect-tense fiction is acceptable as long as the engineering proposal at `/Users/mikeumus/Documents/server/docs/RELEASE-PIPELINE-PROPOSAL.md` is on the roadmap.
- **No estimates.** Every number either has a primary-source URL or is explicitly "internal — measured by us." See `_research_subagent_prompt.md` next to this skill if it exists.
- Three honest limitations near the end ("What this does not solve" or equivalent).
- Closing teaser to the next post in the series.

**Differentiator hooks (weave these in):**

- **Slice-aware Spearman gates** — per-domain, not global. Cite the Tianpan *Semver Lie* postmortem ([https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production](https://tianpan.co/blog/2026-04-29-semver-lie-llm-minor-update-breaks-production)) as the named 2026 failure mode.
- **Closed-loop production-trace replay** — Stage 4 Observe replays live traces through the candidate, scored by the same calibrated judge. SageMaker Deployment Guardrails are the contrast (infra metrics only).
- **Vindex compliance receipts** — hash-chained, externally anchorable. **Open-weights only.** For closed-API model backings the receipt covers the decision chain but cannot claim weight provenance — say this explicitly. Cross-link to `/compliance/`.

**AEO scaffolding (mandatory):**

- Two H2 question-form headings somewhere in the body. Examples that have worked: *"What makes LLM CI/CD different from software CI/CD?"*, *"How do you build a failure-resistant pipeline?"*, *"What audit trail requirements apply to AI model deployments?"*
- One `## FAQ` section with 5 question-format subheadings, each with a 1–3 sentence paragraph answer.
- Internal cross-links to `/api/`, `/compliance/`, `/autorag/`, and prior posts in the series.

**Markdown gotcha — inline SVGs:**

CommonMark treats lines indented ≥4 spaces (after a blank line) as code blocks. Inline SVG inside a `<figure>` works ONLY if there are **no blank lines** inside the SVG and indentation is ≤2 spaces. Post #2 broke because `<g>` groups were separated by blank lines — the next group got rendered as a code block. Either flatten the whole SVG to no indent, or use an external `.svg` file via `<img>`.

**Markdown gotcha — unclosed SVG tags:**

After writing any inline `<svg>...</svg>` block, ALWAYS verify tag balance:

```bash
MD=content/blog/<slug>.md
echo "<svg / </svg>: $(grep -oc '<svg ' "$MD") / $(grep -oc '</svg>' "$MD")"
echo "<figure / </figure>: $(grep -oc '<figure' "$MD") / $(grep -oc '</figure>' "$MD")"
```

These must match. Post #6 shipped with a missing `</svg>` on the second inline SVG and the entire content area below the chart inherited bizarre margin + padding from the unclosed element, bleeding into the "Share with Friends" sidebar. Symptom: layout breaks AFTER the unclosed element — everything before renders fine. The Zola parser accepts the bad markup silently; only the browser's layout shows the bug. **Always grep-balance tags before deploying any post that uses inline SVG.**

**Static-WebM fallback for Veo quota exhaustion:**

Veo 3.1 has its own daily quota (separate from Nano), and you'll hit it during busy sessions. When the `submit_veo` step returns `HTTP 429`, fall back to a static-WebM (4-second still-frame loop of the hero PNG) so the post can ship same-day:

```bash
ffmpeg -y -loop 1 -i "static/images/<slug>-hero.png" -t 4 \
  -c:v libvpx-vp9 -b:v 800k -crf 32 -pix_fmt yuv420p -r 24 \
  "static/blog-hero-videos/<slug>-veo31.webm"
```

The page autoplays the static loop — looks identical to a still hero image. Tomorrow when Veo quota resets, regenerate a real animated loop and re-upload to R2 (same URL — browser cache will refresh within the cache-control TTL or on user reload). Posts shipped this way: Sherlock (#2), Vermeer (#4), Rockwell Doctor (#6).

## 4. Generate hero PNG candidates

Copy `site/scripts/generate-blog-hero-cicd-pipeline.py` to `generate-blog-hero-<slug>.py`. Edit two things:

1. `SLUG = "<slug>"`
2. `PROMPT = "<your prompt>"` — Leonardo da Vinci notebook aesthetic, sepia ink, restrained gold accents, no AI gradient slop, Roman numerals for sections, AUDIT signed seal at the bottom, match the visual family of prior posts.

Run:

```bash
python3 scripts/generate-blog-hero-<slug>.py
```

This generates **4 candidates** (2 from Nano Banana Pro + 2 from Imagen 4 Ultra) at `site/static/images/blog-hero-candidates/`. Show all four to the user via `Read` and let them A/B pick.

**Quota warning.** Nano Banana Pro (`gemini-3-pro-image-preview`) has a per-day quota around 250 requests that's easy to exhaust on a busy session. Once it 429s, you can't recover until midnight Pacific. Imagen 4 Ultra has a separate quota bucket and degrades gracefully. The script template auto-falls-back to Imagen on 429. Imagen typically produces worse text rendering but is fine for symbolic / Renaissance / classical-painting compositions. For text-critical compositions (regulator names, hash strings, Roman numerals as labels), prefer Nano.

**Voice direction we converged on by post #5.** The Renaissance-notebook aesthetic gets stale across 5+ posts. The series settled on **"iconic artwork / cultural touchstones reimagined with a single AI element"** — Hopper's Nighthawks with an AI behind the counter, Apollo mission control with hash-receipts on the projection wall, Vermeer Dutch Golden Age with a fiber-optic strand through the canvas, Mendeleev periodic table with capability-elements, Sherlock Holmes detective study with a USB stick on the evidence desk. Each post gets a distinct iconic visual reference but shares the "painterly classic + one anachronistic AI detail" DNA. This is the AEO-marketing-stands-out voice the user named explicitly. Don't repeat the Renaissance temple for every post.

Promote the winner:

```bash
cp site/static/images/blog-hero-candidates/<slug>__nano-banana-pro__<NN>.png \
   site/static/images/<slug>-hero.png
```

## 5. Generate the Veo video + WebM + WebP poster

Copy `site/scripts/generate-cicd-pipeline-hero-video.py` to `generate-<slug>-hero-video.py`. Edit:

1. `SLUG = "<slug>"`
2. `PROMPT = "<your prompt>"` — describes how each element on the hero animates within its own drawn boundary. **No zoom, no pan, no camera motion.** Loopable. Match prior post prompts for the style.

Run:

```bash
python3 scripts/generate-<slug>-hero-video.py
```

Output:

- `site/static/blog-hero-videos/<slug>-veo31.mp4` (~1.5–2 MB)
- `site/static/blog-hero-videos/<slug>-veo31.webm` (~800 KB–1 MB, VP9 1500k CRF 32)
- `site/static/images/<slug>-hero-poster.webp` (~250 KB at q=82)

Typical wall time: ~60–90 s including Veo polling.

## 6. Upload to R2 + wire the frontmatter

```bash
env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_EMAIL -u CLOUDFLARE_ACCOUNT_ID \
  wrangler r2 object put divinci-static-assets/<slug>-veo31.webm \
    --file=site/static/blog-hero-videos/<slug>-veo31.webm \
    --content-type=video/webm --cache-control='public, max-age=31536000' --remote

env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_EMAIL -u CLOUDFLARE_ACCOUNT_ID \
  wrangler r2 object put divinci-static-assets/<slug>-hero-poster.webp \
    --file=site/static/images/<slug>-hero-poster.webp \
    --content-type=image/webp --cache-control='public, max-age=31536000' --remote

# Verify
curl -sI "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/<slug>-veo31.webm" | head -3
```

Replace the placeholder `featured_image = …` line in the post frontmatter with:

```toml
hero_video = "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/<slug>-veo31.webm"
hero_video_poster = "/images/<slug>-hero-poster.webp"
```

If `wrangler r2 bucket list` errors with `code: 10000`, re-auth per the CLAUDE.md recovery section:

```bash
unset CLOUDFLARE_API_TOKEN CLOUDFLARE_EMAIL CLOUDFLARE_ACCOUNT_ID && wrangler logout && wrangler login
```

## 7. Hand-author SVG diagrams

For data charts: write to `site/static/images/charts/<slug>-<chartname>.svg` and reference via `<img>`.

For composition diagrams (the "where each failure gets caught" matrix-style): inline the SVG directly in the markdown. Watch the indentation gotcha from step 3.

**Style notes:**

- Cream background `#faf8f5`, deep green `#2d5a4f` / `#1e3a2b`, warm tan accent `#b8a080`, rust-red alert `#a04848`, font-family `'DM Sans', -apple-system, sans-serif`.
- `viewBox="0 0 900 380"` (or 420 for taller). `width: 100%; max-width: 900px; height: auto;` so it scales.
- Footnote markers `<a href="#ref-N"><tspan baseline-shift="super" text-decoration="underline">[N]</tspan></a>` if the chart cites the references section. Anchors only work for **inline** SVG, not `<img>`-referenced SVG (sandboxed).
- `xmllint --noout <file>.svg` to verify validity. Double-hyphens inside `<!-- comments -->` break the XML parser silently.

## 8. Reference grounding

Every chart and every load-bearing claim needs a citation or an explicit "internal — measured by us" disclaimer. **If you can't cite it, don't claim a number.**

For technical claims, delegate research to a subagent (see prior subagent prompts in chat transcripts for examples). Reliable primary sources we've used:

- Tianpan postmortem series (the dominant 2026 slice-blindness named failure mode)
- DORA Metrics guide (failed-deployment-recovery elite threshold)
- Atlassian April 2022 / Cloudflare June 2022 postmortems (real measured rollback times)
- AWS SageMaker Deployment Guardrails docs (the infra-metric-canary contrast)
- AWS / KServe / Vertex docs for platform behavior
- Microsoft BitNet papers (arXiv:2402.17764, arXiv:2504.12285)
- Prism ML Bonsai (`prism-ml/Bonsai-8B-mlx-1bit`) — **not Sea AI Lab**
- Marchenko-Pastur 1967 for random-matrix floor
- MT-Bench / Zheng et al. 2023 (arXiv:2306.05685) for LLM-as-judge agreement

Add a `## References` section at the end. Pattern:

```html
<ol class="post-references" style="padding-left: 1.5rem;">
  <li id="ref-1" style="scroll-margin-top: 90px; margin-bottom: 0.9rem;">
    <strong>Source.</strong> <a href="..." target="_blank" rel="noopener">Title</a>. One-sentence relevance to the claim.
  </li>
</ol>
```

Inline `<sup><a href="#ref-N">[N]</a></sup>` markers in the body. The `scroll-margin-top` is essential — without it the sticky header obscures the target on jump.

## 9. Local preview → user approval → deploy

```bash
# Confirm Zola picked it up
tail -5 /tmp/zola-serve.log
curl -sI "http://127.0.0.1:1111/blog/<slug>/" | head -3   # 200

# Confirm all SVGs valid
for f in site/static/images/charts/<slug>*.svg; do
  xmllint --noout "$f" && echo "✓ $(basename $f)"
done
```

Share the preview URL with the user. After approval:

```bash
env -u CLOUDFLARE_API_TOKEN wrangler deploy --env=""
curl -sI "https://divinci.ai/blog/<slug>/" | head -3
```

Wait for HubSpot's rescan to register the new post (~24 h) — the recommendation status in the AEO dashboard advances from "50% complete" to "Completed" automatically.

## 10. Commit

```bash
git add site/content/blog/<slug>.md \
        site/static/images/<slug>-hero.png \
        site/static/images/<slug>-hero-poster.webp \
        site/static/blog-hero-videos/<slug>-veo31.* \
        site/static/images/charts/<slug>*.svg \
        site/scripts/generate-*-<slug>-*.py \
        site/.archive/hubspot-aeo-drafts/<postN>-<slug>.txt
git commit -m "blog: <slug> (AEO post N of 8)"
```

Do not skip hooks. Do not push without the user asking.

## Quality bar (must hit on every post)

- [ ] **Voice:** confident, first-person plural, specific numbers, no marketing puffery
- [ ] **Hero:** PNG → Veo 3.1 → WebM + WebP poster, all on R2
- [ ] **Hand-authored SVG diagrams:** at least one, in the existing color palette, `xmllint`-valid
- [ ] **References:** primary-source URLs for every load-bearing claim, "internal — measured" disclaimer for everything else, no "estimates"
- [ ] **AEO scaffolding:** ≥2 H2 question-form headings, 1 FAQ section with 5 questions
- [ ] **Internal cross-links:** at least 2 of `/api/`, `/compliance/`, `/autorag/`, prior posts in the series
- [ ] **Three honest limitations** somewhere in the post
- [ ] **Closing teaser** to the next post in the series
- [ ] **Open-weights caveat** wherever the post mentions vindex receipts
- [ ] **No estimates** anywhere
- [ ] **Local preview clean** — no broken images, no markdown-leaked SVG code blocks
- [ ] **Production deploy verified** — `curl -sI` returns 200 from `divinci.ai`

## Series state — keep this current

Posts shipped so far (cross-link these from new posts as appropriate):

1. `/blog/how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai/` — the four-stage pipeline architecture
2. `/blog/10-ci-cd-release-failures-in-custom-language-models/` — failure modes mapped to stages
3. `/blog/12-qa-and-release-management-capabilities-for-llms/` — capability checklist; Venn of three camps + competitor matrix
4. `/blog/validating-and-releasing-custom-lms-in-regulated-fields/` — compliance deep-dive; regulator-to-stage mapping table + vindex receipt JSON
5. `/blog/automated-llm-ci-cd-pipelines-with-instant-rollback/` — operational layer; automation spectrum + auto-rollback receipt + rollback drills
6. `/blog/how-to-diagnose-custom-llm-qa-failures-in-7-steps/` — diagnostic decision tree + root-cause distribution; "the model is the bug 1 in 7 times"

Remaining HubSpot AEO net-new posts:

- CI Testing for Custom Language Models in 2026
- Automated Regression Testing for Custom LLMs in 2026 (natural sequel to #6 — what feeds the diagnostic tree)

When picking the next one, prioritize topics that lean on a Divinci differentiator we haven't yet leaned on, and avoid topics that cannibalize prior posts' search intent.

**Hero visual map for the shipped series:**

| Post | Hero artwork reference |
|---|---|
| #1 Build a CI/CD pipeline | Apollo-era NASA mission control, hash-receipts cascading down the projection wall (in place of Apollo telemetry), T+02:14:23 mission timer frozen, lone modern laptop on a vintage console |
| #2 10 release failures | Sherlock Holmes Victorian detective study, 10 numbered evidence cards on the desk, magnifying glass + deerstalker, single anachronistic USB stick |
| #3 12 capabilities | Mendeleev's 1869 periodic table, 12 elements as AI release capabilities color-coded by stage, modern fountain pen as the only anachronism |
| #4 Regulated fields | Vermeer Dutch Golden Age interior, single figure at a window-lit desk with four regulator-seal stamps, fiber-optic strand of gold light through the canvas |
| #5 Automated rollback | Hopper's Nighthawks reimagined — 1940s diner, 02:14 wall clock, "ROLLBACK · 12s" red neon across the street, chrome humanoid AI tending the counter |
