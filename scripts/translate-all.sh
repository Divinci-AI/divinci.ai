#!/bin/bash

# Translate All Script
# This script runs all translation steps sequentially

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${BLUE}=======================================${NC}"
echo -e "${BLUE}   Divinci AI Translation Workflow     ${NC}"
echo -e "${BLUE}=======================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
  echo -e "${YELLOW}Warning: .env file not found. Creating from example...${NC}"
  if [ -f .env.example ]; then
    cp .env.example .env
    echo -e "${GREEN}Created .env file from example. Please edit it with your Crowdin API token.${NC}"
  else
    echo -e "${RED}Error: .env.example file not found. Please create a .env file with your Crowdin API token.${NC}"
    exit 1
  fi
fi

# Step 1: Extract content
echo -e "${BLUE}Step 1: Extracting translatable content...${NC}"
node scripts/crowdin-integration.js extract
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Content extraction failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Content extraction completed successfully.${NC}"
echo ""

# Step 2: Upload content to Crowdin
echo -e "${BLUE}Step 2: Uploading content to Crowdin...${NC}"
node scripts/crowdin-integration.js upload
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Content upload failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Content upload completed successfully.${NC}"
echo ""

# Step 3: Prompt for translation
echo -e "${YELLOW}Step 3: Translate content in Crowdin${NC}"
echo -e "Please go to Crowdin and translate the content."
echo -e "1. Log in to Crowdin"
echo -e "2. Navigate to the Divinci AI project"
echo -e "3. Translate the content for each language"
echo -e "4. Press Enter when you're ready to continue..."
read -p ""

# Step 4: Download translations
echo -e "${BLUE}Step 4: Downloading translations from Crowdin...${NC}"
node scripts/crowdin-integration.js download
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Translation download failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Translation download completed successfully.${NC}"
echo ""

# Step 5: Apply translations
echo -e "${BLUE}Step 5: Applying translations to HTML files...${NC}"
node scripts/crowdin-integration.js apply
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Applying translations failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Translations applied successfully.${NC}"
echo ""

# Step 6: Generate language-specific pages
echo -e "${BLUE}Step 6: Generating language-specific pages...${NC}"
node scripts/generate-language-pages.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Generating language-specific pages failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Language-specific pages generated successfully.${NC}"
echo ""

# Step 7: Add hreflang tags
echo -e "${BLUE}Step 7: Adding hreflang tags to all pages...${NC}"
node scripts/add-hreflang-tags.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Adding hreflang tags failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Hreflang tags added successfully.${NC}"
echo ""

# Step 8: Generate sitemaps
echo -e "${BLUE}Step 8: Generating language-specific sitemaps...${NC}"
node scripts/generate-sitemaps.js
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Generating sitemaps failed.${NC}"
  exit 1
fi
echo -e "${GREEN}Sitemaps generated successfully.${NC}"
echo ""

# Step 9: Run SEO keyword research
echo -e "${BLUE}Step 9: Running SEO keyword research...${NC}"
node scripts/seo-keyword-research.js all
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: SEO keyword research failed.${NC}"
  exit 1
fi
echo -e "${GREEN}SEO keyword research completed successfully.${NC}"
echo ""

# Print success message
echo -e "${GREEN}=======================================${NC}"
echo -e "${GREEN}   Translation workflow completed!     ${NC}"
echo -e "${GREEN}=======================================${NC}"
echo ""
echo -e "Next steps:"
echo -e "1. Review the translated pages in your browser"
echo -e "2. Check the SEO keyword report at seo/keyword-optimization-report.html"
echo -e "3. Make any necessary adjustments to the translations"
echo -e "4. Deploy the updated website"
echo ""

exit 0
