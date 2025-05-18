#!/bin/bash

# Crowdin CLI Batch Script
# This script runs a complete Crowdin workflow using the Crowdin CLI

# Set Crowdin environment variables
export CROWDIN_PROJECT_ID="789570"  # Your actual project ID
export CROWDIN_API_TOKEN="2dbd3a9f47ffc32607af62e1d677386c2ab67560859290214f97aa950e8c4cb92a8aa044d848e470"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
  echo -e "${BLUE}$1${NC}"
}

print_success() {
  echo -e "${GREEN}$1${NC}"
}

print_warning() {
  echo -e "${YELLOW}$1${NC}"
}

print_error() {
  echo -e "${RED}$1${NC}"
}

# Check if Crowdin CLI is installed
if ! command -v crowdin &> /dev/null; then
  print_error "Crowdin CLI is not installed. Please install it first:"
  print_message "npm install -g @crowdin/cli"
  exit 1
fi

# Parse command line arguments
DRY_RUN=false
SKIP_UPLOAD=false
SKIP_TRANSLATE=false
SKIP_DOWNLOAD=false
SKIP_GENERATE=false

for arg in "$@"; do
  case $arg in
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --skip-upload)
      SKIP_UPLOAD=true
      shift
      ;;
    --skip-translate)
      SKIP_TRANSLATE=true
      shift
      ;;
    --skip-download)
      SKIP_DOWNLOAD=true
      shift
      ;;
    --skip-generate)
      SKIP_GENERATE=true
      shift
      ;;
  esac
done

# Print header
print_message "🚀 Starting Crowdin batch process..."

if [ "$DRY_RUN" = true ]; then
  print_warning "🔍 DRY RUN MODE: No changes will be made to Crowdin or local files"
fi

# Step 1: Upload source files
if [ "$SKIP_UPLOAD" = false ]; then
  print_message "\n🚀 Step 1: Uploading source files to Crowdin..."

  if [ "$DRY_RUN" = true ]; then
    print_warning "🔍 DRY RUN: Would upload source files to Crowdin"
  else
    crowdin upload sources
    if [ $? -eq 0 ]; then
      print_success "✅ Source files uploaded successfully"
    else
      print_error "❌ Failed to upload source files"
      exit 1
    fi
  fi
else
  print_warning "\n⏩ Skipping source file upload (--skip-upload)"
fi

# Step 2: Pre-translate content
if [ "$SKIP_TRANSLATE" = false ]; then
  print_message "\n🚀 Step 2: Pre-translating content..."

  if [ "$DRY_RUN" = true ]; then
    print_warning "🔍 DRY RUN: Would pre-translate content using machine translation"
  else
    crowdin pre-translate --method=mt
    if [ $? -eq 0 ]; then
      print_success "✅ Content pre-translated successfully"
    else
      print_error "❌ Failed to pre-translate content"
      exit 1
    fi
  fi
else
  print_warning "\n⏩ Skipping content pre-translation (--skip-translate)"
fi

# Step 3: Download translations
if [ "$SKIP_DOWNLOAD" = false ]; then
  print_message "\n🚀 Step 3: Downloading translations..."

  if [ "$DRY_RUN" = true ]; then
    print_warning "🔍 DRY RUN: Would download translations from Crowdin"
  else
    crowdin download
    if [ $? -eq 0 ]; then
      print_success "✅ Translations downloaded successfully"
    else
      print_error "❌ Failed to download translations"
      exit 1
    fi
  fi
else
  print_warning "\n⏩ Skipping translation download (--skip-download)"
fi

# Step 4: Generate translated pages
if [ "$SKIP_GENERATE" = false ]; then
  print_message "\n🚀 Step 4: Generating translated pages..."

  if [ "$DRY_RUN" = true ]; then
    print_warning "🔍 DRY RUN: Would generate translated pages"
  else
    # Load configuration
    CONFIG_FILE="scripts/crowdin-config.json"
    if [ ! -f "$CONFIG_FILE" ]; then
      print_error "❌ Configuration file not found: $CONFIG_FILE"
      exit 1
    fi

    # Set target languages manually
    TARGET_LANGUAGES="es fr ar"

    # Check if i18n-test.html exists
    TEST_PAGE="i18n-test.html"
    if [ ! -f "$TEST_PAGE" ]; then
      print_warning "⚠️ Warning: $TEST_PAGE not found. Skipping page generation."
    else
      print_message "🌐 Target languages: $TARGET_LANGUAGES"

      # Generate a translated page for each language
      for LANG in $TARGET_LANGUAGES; do
        print_message "🔄 Generating page for $LANG..."

        # Create a language-specific page
        LANG_PAGE="i18n-test-$LANG.html"

        # Copy the test page
        cp "$TEST_PAGE" "$LANG_PAGE"

        # Set the language in the HTML tag
        sed -i '' "s/<html lang=\"en\">/<html lang=\"$LANG\">/" "$LANG_PAGE"

        # Add a language parameter to the i18n.js script
        sed -i '' "s/<script src=\"js\/i18n.js\"><\/script>/<script src=\"js\/i18n.js\"><\/script>\n    <script>\n      \/\/ Force language to $LANG\n      document.addEventListener('DOMContentLoaded', () => {\n        window.i18n.changeLanguage('$LANG');\n      });\n    <\/script>/" "$LANG_PAGE"

        print_success "✅ Generated $LANG_PAGE"
      done

      print_success "✅ Translated pages generated successfully"
    fi
  fi
else
  print_warning "\n⏩ Skipping page generation (--skip-generate)"
fi

print_success "\n🎉 Crowdin batch process completed!"
