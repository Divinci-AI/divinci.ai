#!/usr/bin/env bash
# Deploy the LarQL Vindex Viewer to HuggingFace Spaces (Divinci-AI/vindex-viewer)
#
# First-time setup:
#   pip install -U huggingface_hub
#   hf auth login    # paste your write token from https://huggingface.co/settings/tokens
#
# Usage:
#   ./deploy.sh                # incremental upload of changed files (creates space if missing)
#   ./deploy.sh --create-only  # just create the space, don't upload
#
# After deploy, the viewer is live at:
#   https://huggingface.co/spaces/Divinci-AI/vindex-viewer

set -euo pipefail

SPACE_ID="Divinci-AI/vindex-viewer"
HERE="$(cd "$(dirname "$0")" && pwd)"

# Try to create the Space (idempotent — succeeds even if it already exists)
echo "Ensuring Space $SPACE_ID exists..."
hf repo create "$SPACE_ID" --repo-type space --space-sdk static --exist-ok 2>&1 | grep -v "already created" || true

if [[ "${1:-}" == "--create-only" ]]; then
  echo "Created (or already exists). Exiting before upload."
  exit 0
fi

echo ""
echo "Uploading $HERE/ to $SPACE_ID ..."
hf upload "$SPACE_ID" "$HERE" . --repo-type space \
  --commit-message "$(date -u +%Y-%m-%dT%H:%M:%SZ) — viewer + assets"

echo ""
echo "✓ Deployed. Live at: https://huggingface.co/spaces/$SPACE_ID"
echo "Hero GIF URL (used by org card): https://huggingface.co/spaces/$SPACE_ID/resolve/main/vindex-hero-bg.gif"
