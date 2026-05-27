#!/bin/bash
# Uploads the 4 re-hero post heroes to R2 (overwriting existing files).
# Files are at the SAME URLs as before, so blog post frontmatter pointers
# don't need to change — the WebM and WebP just get replaced server-side.
set -e
cd "$(dirname "$0")/.."

SLUGS=(
  "how-to-build-an-llm-ci-cd-pipeline-with-divinci-ai"
  "10-ci-cd-release-failures-in-custom-language-models"
  "12-qa-and-release-management-capabilities-for-llms"
  "validating-and-releasing-custom-lms-in-regulated-fields"
)

for slug in "${SLUGS[@]}"; do
  echo "==> $slug"
  env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_EMAIL -u CLOUDFLARE_ACCOUNT_ID wrangler r2 object put \
    "divinci-static-assets/${slug}-veo31.webm" \
    --file="static/blog-hero-videos/${slug}-veo31.webm" \
    --content-type=video/webm \
    --cache-control='public, max-age=31536000' \
    --remote 2>&1 | grep -E 'Upload complete|ERROR' | head -1

  env -u CLOUDFLARE_API_TOKEN -u CLOUDFLARE_EMAIL -u CLOUDFLARE_ACCOUNT_ID wrangler r2 object put \
    "divinci-static-assets/${slug}-hero-poster.webp" \
    --file="static/images/${slug}-hero-poster.webp" \
    --content-type=image/webp \
    --cache-control='public, max-age=31536000' \
    --remote 2>&1 | grep -E 'Upload complete|ERROR' | head -1
done

echo ""
echo "All 8 files uploaded. Verifying R2 reachability..."
for slug in "${SLUGS[@]}"; do
  status=$(curl -sI "https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/${slug}-veo31.webm" | head -1)
  echo "  $slug: $status"
done
