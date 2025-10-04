#!/bin/bash

# Divinci AI - Asset Deployment Script
# Syncs static assets to Cloudflare R2 and deploys site

set -e

echo "🚀 Starting Divinci AI deployment process..."

# Build the site first
echo "📦 Building Zola site..."
zola build

# Sync critical social media images to R2 bucket first
echo "☁️ Syncing critical social media assets to Cloudflare R2..."

# Upload social media sharing image (critical for unfurling)
if [ -f "static/images/divinci-hero-social.png" ]; then
    echo "  🎯 Uploading hero-based social media sharing image..."
    npx wrangler r2 object put "divinci-static-assets/divinci-hero-social.png" \
        --file="static/images/divinci-hero-social.png" \
        --content-type="image/png" \
        --cache-control="public, max-age=31536000, immutable" \
        --remote
fi

# Also upload backup social image if it exists
if [ -f "static/images/divinci-social-unfurl.png" ]; then
    echo "  📸 Uploading backup social media image..."
    npx wrangler r2 object put "divinci-static-assets/divinci-social-unfurl.png" \
        --file="static/images/divinci-social-unfurl.png" \
        --content-type="image/png" \
        --cache-control="public, max-age=31536000, immutable" \
        --remote
fi

# Upload other critical images
echo "☁️ Syncing additional images to Cloudflare R2..."

# Upload all images to R2 with proper content types
if [ -d "public/images" ]; then
    find public/images -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.gif" -o -name "*.svg" -o -name "*.webp" -o -name "*.webm" -o -name "*.mp4" \) | while read file; do
        # Get filename only (not path)
        filename=$(basename "$file")
        
        # Skip if this is a social sharing image (already uploaded)
        if [ "$filename" = "divinci-social-unfurl.png" ] || [ "$filename" = "divinci-hero-social.png" ]; then
            continue
        fi
        
        # Determine content type
        case ${file##*.} in
            png) content_type="image/png" ;;
            jpg|jpeg) content_type="image/jpeg" ;;
            gif) content_type="image/gif" ;;
            svg) content_type="image/svg+xml" ;;
            webp) content_type="image/webp" ;;
            webm) content_type="video/webm" ;;
            mp4) content_type="video/mp4" ;;
            *) content_type="application/octet-stream" ;;
        esac
        
        echo "  📸 Uploading $filename..."
        npx wrangler r2 object put "divinci-static-assets/$filename" \
            --file="$file" \
            --content-type="$content_type" \
            --cache-control="public, max-age=31536000" \
            --remote || echo "  ⚠️  Failed to upload $filename (continuing...)"
    done
fi

# Deploy the site to Cloudflare Pages
echo "🌐 Deploying site to Cloudflare Pages..."
npx wrangler pages deploy public --project-name=divinci-ai

echo "✅ Deployment complete!"
echo "📊 Assets are now hosted on Cloudflare R2 with optimal caching"
echo "🎯 Social media images served from: https://pub-fb3e683317b24cf8b4260121edae02be.r2.dev/"
echo "🔗 Test social media unfurling with the latest deployment URL"