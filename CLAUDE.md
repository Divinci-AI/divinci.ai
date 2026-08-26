# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

The Divinci AI marketing site is a **Zola static site** located in `site/`.

All site work happens inside that folder.

## Build & Development Commands

```bash
# Development server
cd site && zola serve

# Production build
cd site && zola build

# Rebuild the chat widget bundle — REQUIRED after editing
# static/js/src/divinci-chat-widget.ts
cd site && npm run build:chat

# Guards: source integrity + every inline script in public/ must parse
cd site && zola build && npm run test:guards

# Deploy to staging
cd site && env -u CLOUDFLARE_API_TOKEN wrangler deploy --env staging

# Deploy to production (divinci.ai)
# Wrangler v4 requires --env="" to explicitly target the top-level (production) config
# when multiple environments are defined; otherwise it errors with "no target environment".
cd site && env -u CLOUDFLARE_API_TOKEN wrangler deploy --env=""
```

### `static/js/divinci-chat.js` is a committed build artifact

None of the `wrangler.jsonc` build commands run `npm run build:chat` — they run
the Python index scripts and `zola build` only. So the **committed** bundle is
what deploys. Editing `static/js/src/divinci-chat-widget.ts` without rebuilding
ships nothing, silently, and every browser test still passes against the stale
bundle. `npm run test:guards` fails if the two drift.

The bundle is minified by esbuild, whose identifier mangling is not stable
across versions, so a rebuild on a drifted `node_modules` produces a huge but
meaningless diff. Compare string literals rather than bytes when reviewing it —
they survive minification verbatim.

### `zola serve` does not reliably pick up `static/` or `templates/` edits

The watcher misses changes often enough that a stale file will be served while
the source on disk is correct — which reads exactly like a broken fix. Restart
`zola serve` after editing anything outside `content/`, and when a change seems
not to have applied, verify what is actually being served
(`curl -s localhost:1111/js/main.js | grep …`) before debugging the source.

### Zola version is pinned to 0.19.2

The templates do not build on Zola 0.23.x (Tera 2). That release rejects positional
test arguments (`is starting_with("http")` — it wants `pat="http"`) across
`blog.html` / `base.html` / `blog-post.html` / `feature.html`, and then fails again on
`{% macro %}` in `macros/img.html`. Migrating is a real project, not a find-and-replace.

So `zola` 0.19.2 lives at `~/.local/bin/zola` (official release binary), and
`~/.local/bin` sits ahead of `/opt/homebrew/bin` on PATH. Homebrew's 0.23.1 is still in
the Cellar but unlinked (`brew unlink zola`) so it cannot shadow the pin.

- Check before building/deploying: `zola --version` must print `0.19.2`.
- If Homebrew relinks it (`brew upgrade`/`brew link zola` restores `/opt/homebrew/bin/zola`),
  the pin still wins on PATH order — but re-run `brew unlink zola` to be safe.
- To restore Homebrew's Zola: `brew link zola` and remove `~/.local/bin/zola`. Expect the
  build to fail until the templates are migrated to Tera 2.

### Wrangler OAuth recovery

If a deploy fails with `non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN` or `Invalid access token [code: 9109]`, the cached OAuth state is stale (the shell's `CLOUDFLARE_API_TOKEN` is also invalid). Re-auth interactively from your terminal:

```bash
# Use a single line — the unset must run in the same shell as logout/login.
# All three CF vars must be unset, not just the API token, or wrangler refuses
# to logout/login while it sees them.
unset CLOUDFLARE_API_TOKEN CLOUDFLARE_EMAIL CLOUDFLARE_ACCOUNT_ID && wrangler logout && wrangler login
```

This opens a browser tab, you authorize, and the OAuth token is cached (macOS Keychain on darwin). Then retry the deploy with the `env -u CLOUDFLARE_API_TOKEN wrangler deploy …` pattern above — the cached token is what wrangler picks up.

## Key Directories

| Path | Purpose |
|------|---------|
| `site/content/` | Markdown pages + blog posts |
| `site/templates/` | Tera HTML templates |
| `site/static/` | CSS, JS, images, SVGs |
| `site/static/brand/regulators/` | Regulator icon SVGs (EU flag, GDPR, HIPAA/PCI, NIST) |
| `site/public/` | Build output — gitignored |

## Deployment

- Staging: `staging.divinci.ai` (the `*.workers.dev` hostnames are disabled — see `workers_dev: false` in `wrangler.jsonc`; they published indexable copies of the site)
- Production: `divinci.ai` / `www.divinci.ai`
- Static assets (videos, large images): Cloudflare R2 — `https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/`

## Notes

- Always use `env -u CLOUDFLARE_API_TOKEN wrangler deploy` — the shell env token overrides OAuth and causes auth failures
- `site/.git/` is a stub with pre-commit hooks only; git operations resolve to the parent repo
- `hf-spaces/` — vindex-viewer HuggingFace Space source (untracked, separate deploy)
- `research/` — vindex viewer animation assets (untracked)
