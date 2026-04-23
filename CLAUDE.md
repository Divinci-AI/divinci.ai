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
cd site && env -u CLOUDFLARE_API_TOKEN wrangler deploy
```

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
