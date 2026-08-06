# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

The Divinci AI marketing site is a **Zola static site** located in `site/`.

All site work happens inside that folder.

## Build & Development Commands

```bash
# Development server (hot-reload)
cd site && zola serve

# Production build
cd site && zola build

# Deploy to staging
cd site && env -u CLOUDFLARE_API_TOKEN wrangler deploy --env staging

# Deploy to production (divinci.ai)
# Wrangler v4 requires --env="" to explicitly target the top-level (production) config
# when multiple environments are defined; otherwise it errors with "no target environment".
cd site && env -u CLOUDFLARE_API_TOKEN wrangler deploy --env=""
```

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

- Staging: `divinci-ai-site-staging.divinci-ai.workers.dev` / `staging.divinci.ai`
- Production: `divinci.ai` / `www.divinci.ai`
- Static assets (videos, large images): Cloudflare R2 — `https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/`

## Notes

- Always use `env -u CLOUDFLARE_API_TOKEN wrangler deploy` — the shell env token overrides OAuth and causes auth failures
- `site/.git/` is a stub with pre-commit hooks only; git operations resolve to the parent repo
- `hf-spaces/` — vindex-viewer HuggingFace Space source (untracked, separate deploy)
- `research/` — vindex viewer animation assets (untracked)
