# Ticket: Site-Wide Search (Blog + Whole Site)

**Author:** Hermes (Mike's agent)
**Date:** 2026-07-06
**Target bundle:** `~/.omnigent/agent-configs/divinci-team`
**Status:** Ready for dispatch

## One-line brief
Add instant client-side fuzzy search across the entire divinci.ai site (marketing pages + blog), reachable from a global header search box and the blog page, with a Cmd/Ctrl+K command-palette modal. No backend; build-time JSON index + vendored Fuse.js.

## Why
The blog and site currently have no search. Users (and Mike) can't find posts/topics quickly. `cli.html` already proves client-side filtering works on this site, so extending it site-wide is low-risk.

## Repo & build facts (for the team — read CLAUDE.md first)
- Repo root: `/Users/mikeumus/Documents/divinci.ai`. All site work is under `site/`.
- Static site generator: **Zola**. Build: `cd site && zola build`. Output → `site/public/` (gitignored).
- Deploy: `cd site && env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_EMAIL -u CLOUDFLARE_ACCOUNT_ID wrangler deploy --env staging` (staging) and `--env=""` (production). The shell env `CLOUDFLARE_API_TOKEN` MUST be unset or it overrides OAuth and fails.
- 12 languages; blog is EN-only. Marketing/legal pages have `content/<lang>/` translations.
- Design system: DM Sans (UI) + Fraunces (headings). Match it; no new fonts.
- JS is served from `site/static/js/` (chat widget is esbuild-bundled; we add plain `<script>` files for search — consistent with how `cli.html` includes inline JS).

## Full plan
See `.hermes/plans/2026-07-06_223000-site-search.md` (in this repo). Implement task-by-task. Do NOT skip the build-pipeline wiring (Task 3) — the index must regenerate before every `zola build` or search breaks on deploy.

## Acceptance criteria
1. `python3 site/scripts/build-search-index.py` writes `site/static/search-index.<lang>.json` for EN + each language dir with content; EN includes all blog posts and top-level pages (except `sitemap.md`).
2. `zola build` copies the index into `site/public/`; `wrangler deploy` serves it at `/search-index.en.json` (200, valid JSON).
3. Global header has a "Search" trigger; clicking it (or pressing Cmd/Ctrl+K) opens a modal with an input and live fuzzy results drawn from the active-language index (falls back to EN).
4. Arrow keys navigate results, Enter opens, Escape closes, clicking the backdrop closes.
5. `/blog/` has an inline filter input that narrows the visible post cards as you type.
6. Search UI matches the existing design (DM Sans/Fraunces, cream/forest palette per `COLORS.md`).
7. Deployed to staging AND production; verified live on `staging.divinci.ai` and `divinci.ai`.
8. Changes committed to `main` with a clear message; unrelated untracked dirs (`.serena/`, `hf-spaces/`, `playwright-report/`, `research/`, `test-results/`) left unstaged.

## Constraints / non-goals
- No external CDN at runtime for core site → vendor Fuse.js into `site/static/js/vendor/`.
- No new backend/Worker routes in v1.
- Keep the index lean (titles + summaries + tags + short excerpt). Do not embed full post bodies.
- Accessibility: modal is `role=dialog aria-modal`, input has label, trigger has `aria-keyshortcuts`.

## Verification command the team should run before handing back
```bash
cd site && zola build && \
  test -f public/search-index.en.json && echo "INDEX_OK" && \
  grep -q "site-search-trigger" public/index.html && echo "HEADER_OK"
```
Then deploy staging, manually confirm ⌘K works on `staging.divinci.ai/blog/`, then deploy prod.
