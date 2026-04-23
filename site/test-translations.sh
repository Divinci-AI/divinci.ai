#!/bin/bash

# Test script to verify translated pages are accessible
echo "🌍 Testing translated feature pages..."

LANGUAGES=("es" "fr" "ar")
PAGES=("autorag" "quality-assurance" "release-management")
BASE_URL="http://127.0.0.1:1111"

TOTAL_TESTS=0
PASSED_TESTS=0

for lang in "${LANGUAGES[@]}"; do
    echo -e "\n📝 Testing $lang pages:"
    for page in "${PAGES[@]}"; do
        TOTAL_TESTS=$((TOTAL_TESTS + 1))
        URL="$BASE_URL/$lang/$page/"
        
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
        
        if [ "$STATUS" = "200" ]; then
            echo "  ✅ $lang/$page/ - HTTP $STATUS"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo "  ❌ $lang/$page/ - HTTP $STATUS"
        fi
    done
done

echo -e "\n📊 Results: $PASSED_TESTS/$TOTAL_TESTS tests passed"

if [ "$PASSED_TESTS" = "$TOTAL_TESTS" ]; then
    echo "🎉 All translation tests passed!"
    exit 0
else
    echo "⚠️  Some translation tests failed"
    exit 1
fi