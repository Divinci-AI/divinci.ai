#!/usr/bin/env zsh
# Wrapper: source only the API-key exports from ~/.zshrc, then run omni.
# Avoids pasting secrets on the command line / into history.
set -e
ZRC="$HOME/.zshrc"
# Extract export lines for the keys omnigent needs and eval them.
for var in OPENROUTER_API_KEY SILICONFLOW_API_KEY GEMINI_API_KEY GEMINI_API_KEY GOOGLE_API_KEY; do
  line=$(grep -E "^export $var=" "$ZRC" | head -1)
  [ -n "$line" ] && eval "$line"
done
cd /Users/mikeumus/Documents/divinci.ai
PYTHONPATH="" omni run ~/.omnigent/agent-configs/divinci-team \
  --server http://127.0.0.1:6767 \
  --harness pi \
  -p "Implement the Site-Wide Search feature per the ticket at docs/tickets/2026-07-06-site-search.md in this repo (read it first, then the full plan at .hermes/plans/2026-07-06_223000-site-search.md). Repo is a Zola static site; site work is under site/. Wire the index build into the wrangler/package build commands, add the header search trigger + Cmd/Ctrl+K modal (vendored Fuse.js), the blog inline filter, match the existing DM Sans/Fraunces design, then deploy to staging AND production (env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_EMAIL -u CLOUDFLARE_ACCOUNT_ID wrangler deploy --env staging, then --env=''). Do NOT stage unrelated untracked dirs (.serena, hf-spaces, playwright-report, research, test-results). Commit to main with a clear message. Report back: files changed, deploy URLs verified, and any deviations from the plan."
