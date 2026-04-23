# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

The Divinci AI marketing site is a **Zola static site** located in `new-divinci-zola-site/`.

All site work happens inside that folder.

## Build & Development Commands

```bash
# Development server (hot-reload)
cd new-divinci-zola-site && zola serve

# Production build
cd new-divinci-zola-site && zola build

# Deploy to staging
cd new-divinci-zola-site && env -u CLOUDFLARE_API_TOKEN wrangler deploy --env staging

# Deploy to production (divinci.ai)
cd new-divinci-zola-site && env -u CLOUDFLARE_API_TOKEN wrangler deploy
```

## Key Directories

| Path | Purpose |
|------|---------|
| `new-divinci-zola-site/content/` | Markdown pages + blog posts |
| `new-divinci-zola-site/templates/` | Tera HTML templates |
| `new-divinci-zola-site/static/` | CSS, JS, images, SVGs |
| `new-divinci-zola-site/static/brand/regulators/` | Regulator icon SVGs (EU flag, GDPR, HIPAA/PCI, NIST) |
| `new-divinci-zola-site/public/` | Build output — gitignored |

## Deployment

- Staging: `divinci-ai-site-staging.divinci-ai.workers.dev` / `staging.divinci.ai`
- Production: `divinci.ai` / `www.divinci.ai`
- Static assets (videos, large images): Cloudflare R2 — `https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/`

## Notes

- Always use `env -u CLOUDFLARE_API_TOKEN wrangler deploy` — the shell env token overrides OAuth and causes auth failures
- `new-divinci-zola-site/.git/` is a stub with pre-commit hooks only; git operations resolve to the parent repo
- `hf-spaces/` — vindex-viewer HuggingFace Space source (untracked, separate deploy)
- `research/` — vindex viewer animation assets (untracked)
