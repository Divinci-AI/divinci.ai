#!/bin/bash

# Run Internationalization Tests
# This script runs all the internationalization tests

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

# Parse command line arguments
SKIP_CROWDIN=false
SKIP_FEATURES=false
SKIP_MOBILE=false
BROWSER="chromium"

for arg in "$@"; do
  case $arg in
    --skip-crowdin)
      SKIP_CROWDIN=true
      shift
      ;;
    --skip-features)
      SKIP_FEATURES=true
      shift
      ;;
    --skip-mobile)
      SKIP_MOBILE=true
      shift
      ;;
    --browser=*)
      BROWSER="${arg#*=}"
      shift
      ;;
  esac
done

# Print header
print_message "🚀 Running Internationalization Tests..."

# Run Crowdin flow tests
if [ "$SKIP_CROWDIN" = false ]; then
  print_message "\n🔍 Running Crowdin Flow Tests..."
  npx playwright test tests/i18n/crowdin-flow.spec.ts --config=tests/i18n/playwright.config.ts --project=$BROWSER
  
  if [ $? -eq 0 ]; then
    print_success "✅ Crowdin Flow Tests passed!"
  else
    print_error "❌ Crowdin Flow Tests failed!"
    exit 1
  fi
else
  print_warning "\n⏩ Skipping Crowdin Flow Tests (--skip-crowdin)"
fi

# Run i18n features tests
if [ "$SKIP_FEATURES" = false ]; then
  print_message "\n🔍 Running i18n Features Tests..."
  npx playwright test tests/i18n/i18n-features.spec.ts --config=tests/i18n/playwright.config.ts --project=$BROWSER
  
  if [ $? -eq 0 ]; then
    print_success "✅ i18n Features Tests passed!"
  else
    print_error "❌ i18n Features Tests failed!"
    exit 1
  fi
else
  print_warning "\n⏩ Skipping i18n Features Tests (--skip-features)"
fi

# Run mobile i18n tests
if [ "$SKIP_MOBILE" = false ]; then
  print_message "\n🔍 Running Mobile i18n Tests..."
  npx playwright test tests/i18n/mobile-i18n.spec.ts --config=tests/i18n/playwright.config.ts --project=mobile-chrome
  
  if [ $? -eq 0 ]; then
    print_success "✅ Mobile i18n Tests passed!"
  else
    print_error "❌ Mobile i18n Tests failed!"
    exit 1
  fi
else
  print_warning "\n⏩ Skipping Mobile i18n Tests (--skip-mobile)"
fi

print_success "\n🎉 All Internationalization Tests completed successfully!"
