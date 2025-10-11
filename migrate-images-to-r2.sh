#!/bin/bash

# Migration script to upload all images to Cloudflare R2 and update references
# Usage: ./migrate-images-to-r2.sh

set -e

# Configuration
R2_BUCKET="divinci-static-assets"
R2_BASE_URL="https://pub-fb3e683317b24cf8b4260121edae02be"
IMAGES_DIR="images"
BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Divinci.ai Image Migration to R2${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Step 1: Create backup
echo -e "${YELLOW}Step 1: Creating backup...${NC}"
mkdir -p "$BACKUP_DIR"
find . -name "*.html" -not -path "./node_modules/*" -not -path "./archive/*" -not -path "./optimized/*" -exec cp --parents {} "$BACKUP_DIR" \; 2>/dev/null || \
find . -name "*.html" -not -path "./node_modules/*" -not -path "./archive/*" -not -path "./optimized/*" | while read file; do
    mkdir -p "$BACKUP_DIR/$(dirname "$file")"
    cp "$file" "$BACKUP_DIR/$file"
done
echo -e "${GREEN}✓ Backup created in $BACKUP_DIR${NC}\n"

# Step 2: Find all unique image files referenced in HTML/CSS
echo -e "${YELLOW}Step 2: Finding all image references...${NC}"

# Create temporary file to store unique image paths
TEMP_FILE=$(mktemp)

# Find images in HTML files (excluding specific directories)
grep -roh 'src="images/[^"]*"' . \
    --include="*.html" \
    --exclude-dir={node_modules,archive,optimized,backup_*} \
    2>/dev/null | sed 's/src="//g' | sed 's/"//g' >> "$TEMP_FILE" || true

grep -roh "src='images/[^']*'" . \
    --include="*.html" \
    --exclude-dir={node_modules,archive,optimized,backup_*} \
    2>/dev/null | sed "s/src='//g" | sed "s/'//g" >> "$TEMP_FILE" || true

# Find images in CSS files
grep -roh 'url("images/[^"]*")' . \
    --include="*.css" \
    --exclude-dir={node_modules,archive,optimized,backup_*} \
    2>/dev/null | sed 's/url("//g' | sed 's/")//g' >> "$TEMP_FILE" || true

# Sort and get unique paths
sort -u "$TEMP_FILE" > "${TEMP_FILE}.unique"
mv "${TEMP_FILE}.unique" "$TEMP_FILE"

TOTAL_IMAGES=$(wc -l < "$TEMP_FILE" | tr -d ' ')
echo -e "${GREEN}✓ Found $TOTAL_IMAGES unique image references${NC}\n"

# Step 3: Upload images to R2
echo -e "${YELLOW}Step 3: Uploading images to R2...${NC}"
echo -e "${BLUE}Bucket: $R2_BUCKET${NC}\n"

UPLOADED=0
FAILED=0

while IFS= read -r img_path; do
    # Remove 'images/' prefix for the file path
    file_path="$img_path"

    if [ ! -f "$file_path" ]; then
        echo -e "${RED}✗ File not found: $file_path${NC}"
        ((FAILED++))
        continue
    fi

    # Determine content type
    extension="${file_path##*.}"
    case "$extension" in
        png) content_type="image/png" ;;
        jpg|jpeg) content_type="image/jpeg" ;;
        svg) content_type="image/svg+xml" ;;
        webp) content_type="image/webp" ;;
        avif) content_type="image/avif" ;;
        gif) content_type="image/gif" ;;
        *) content_type="application/octet-stream" ;;
    esac

    # Upload to R2
    echo -e "  Uploading: ${BLUE}$file_path${NC} → ${GREEN}$R2_BUCKET/$img_path${NC}"

    if npx wrangler r2 object put "$R2_BUCKET/$img_path" \
        --file "$file_path" \
        --content-type "$content_type" \
        --remote 2>/dev/null; then
        ((UPLOADED++))
    else
        echo -e "${RED}✗ Failed to upload: $file_path${NC}"
        ((FAILED++))
    fi
done < "$TEMP_FILE"

echo -e "\n${GREEN}✓ Upload complete: $UPLOADED uploaded, $FAILED failed${NC}\n"

# Step 4: Update HTML files
echo -e "${YELLOW}Step 4: Updating HTML files...${NC}"

HTML_FILES=$(find . -name "*.html" \
    -not -path "./node_modules/*" \
    -not -path "./archive/*" \
    -not -path "./optimized/*" \
    -not -path "./backup_*/*")

UPDATED_FILES=0

for html_file in $HTML_FILES; do
    # Check if file contains image references
    if grep -q 'src="images/' "$html_file" || grep -q "src='images/" "$html_file"; then
        echo -e "  Updating: ${BLUE}$html_file${NC}"

        # Update double-quoted src attributes
        sed -i.bak "s|src=\"images/|src=\"$R2_BASE_URL/images/|g" "$html_file"

        # Update single-quoted src attributes
        sed -i.bak "s|src='images/|src='$R2_BASE_URL/images/|g" "$html_file"

        # Update onerror fallbacks
        sed -i.bak "s|this\.src='images/|this.src='$R2_BASE_URL/images/|g" "$html_file"
        sed -i.bak "s|this\.src=\"images/|this.src=\"$R2_BASE_URL/images/|g" "$html_file"

        # Remove .bak files
        rm -f "${html_file}.bak"

        ((UPDATED_FILES++))
    fi
done

echo -e "${GREEN}✓ Updated $UPDATED_FILES HTML files${NC}\n"

# Step 5: Update CSS files
echo -e "${YELLOW}Step 5: Updating CSS files...${NC}"

CSS_FILES=$(find . -name "*.css" \
    -not -path "./node_modules/*" \
    -not -path "./archive/*" \
    -not -path "./optimized/*" \
    -not -path "./backup_*/*")

CSS_UPDATED=0

for css_file in $CSS_FILES; do
    if grep -q 'url("images/' "$css_file"; then
        echo -e "  Updating: ${BLUE}$css_file${NC}"

        # Update url() references
        sed -i.bak "s|url(\"images/|url(\"$R2_BASE_URL/images/|g" "$css_file"

        # Remove .bak files
        rm -f "${css_file}.bak"

        ((CSS_UPDATED++))
    fi
done

echo -e "${GREEN}✓ Updated $CSS_UPDATED CSS files${NC}\n"

# Cleanup
rm -f "$TEMP_FILE"

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Migration Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Images uploaded:    ${GREEN}$UPLOADED${NC}"
echo -e "Upload failures:    ${RED}$FAILED${NC}"
echo -e "HTML files updated: ${GREEN}$UPDATED_FILES${NC}"
echo -e "CSS files updated:  ${GREEN}$CSS_UPDATED${NC}"
echo -e "Backup location:    ${YELLOW}$BACKUP_DIR${NC}"
echo -e "\n${YELLOW}Next steps:${NC}"
echo -e "1. Test your site to ensure all images load correctly"
echo -e "2. Check browser console for any 404 errors"
echo -e "3. If everything works, you can safely delete the backup: ${YELLOW}rm -rf $BACKUP_DIR${NC}"
echo -e "4. Consider adding images/ to .gitignore once verified\n"
