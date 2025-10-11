#!/bin/bash
# Quick script to upload the Cloudflare Workers Launchpad graphic to R2

set -e

echo "🚀 Uploading Cloudflare Workers Launchpad graphic to R2..."

# Check if file exists in static/images
if [ -f "static/images/Divinci-Workers-Launchpad.svg" ]; then
    echo "  📸 Uploading PNG version..."
    npx wrangler r2 object put "divinci-static-assets/Divinci-Workers-Launchpad.svg" \
        --file="static/images/Divinci-Workers-Launchpad.svg" \
        --content-type="image/png" \
        --cache-control="public, max-age=31536000" \
        --remote
    echo "✅ Upload complete!"
    echo "🔗 Image available at: https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/Divinci-Workers-Launchpad.svg"
elif [ -f "static/images/cloudflare-workers-launchpad-cohort-6.svg" ]; then
    echo "  📸 Uploading SVG version..."
    npx wrangler r2 object put "divinci-static-assets/Divinci-Workers-Launchpad.svg" \
        --file="static/images/cloudflare-workers-launchpad-cohort-6.svg" \
        --content-type="image/svg+xml" \
        --cache-control="public, max-age=31536000" \
        --remote
    echo "✅ Upload complete!"
    echo "🔗 Image available at: https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/Divinci-Workers-Launchpad.svg"
else
    echo "❌ Error: Cloudflare graphic not found!"
    echo "Please save your graphic as one of:"
    echo "  - static/images/Divinci-Workers-Launchpad.svg"
    echo "  - static/images/cloudflare-workers-launchpad-cohort-6.svg"
    exit 1
fi
