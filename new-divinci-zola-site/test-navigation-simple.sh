#!/bin/bash

# Simple Navigation Test Script for Header and Footer verification
echo "🔗 Testing Navigation, Headers, and Footers"
echo "============================================"

BASE_URL="http://127.0.0.1:1111"

# Define test pages array
test_pages=(
    "/autorag/"
    "/quality-assurance/"
    "/release-management/"
    "/terms-of-service/"
    "/privacy-policy/"
)

# Test each page
failed_tests=0
total_tests=0

for url in "${test_pages[@]}"; do
    total_tests=$((total_tests + 1))
    echo "Testing $url..."
    
    # Check HTTP status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$url")
    
    if [ "$status" = "200" ]; then
        echo "  ✅ Status: $status OK"
        
        # Get page content
        page_content=$(curl -s "$BASE_URL$url")
        
        # Check header
        if echo "$page_content" | grep -q "<header>"; then
            echo "  🏗️  Header: Found"
        else
            echo "  ❌ Header: Missing"
            failed_tests=$((failed_tests + 1))
        fi
        
        # Check footer
        if echo "$page_content" | grep -q "site-footer"; then
            echo "  🦶 Footer: Found"
        else
            echo "  ❌ Footer: Missing"
            failed_tests=$((failed_tests + 1))
        fi
        
        # Check navigation dropdowns
        if echo "$page_content" | grep -q "dropdown-menu"; then
            echo "  🎯 Navigation: Dropdowns found"
        else
            echo "  ⚠️  Navigation: Dropdowns missing"
        fi
        
        # Check logo
        if echo "$page_content" | grep -q "Divinci AI Logo"; then
            echo "  🏷️  Logo: Found"
        else
            echo "  ⚠️  Logo: Missing"
        fi
        
    else
        echo "  ❌ Status: $status ERROR"
        failed_tests=$((failed_tests + 1))
    fi
    echo ""
done

# Test specific dropdown links on homepage
echo "🎯 Testing Dropdown Links from Homepage"
echo "======================================="

homepage_content=$(curl -s "$BASE_URL/")

# Check Features dropdown links
if echo "$homepage_content" | grep -q "href=\"/autorag/\""; then
    echo "✅ Features → AutoRAG link found"
else
    echo "❌ Features → AutoRAG link missing"
    failed_tests=$((failed_tests + 1))
fi

if echo "$homepage_content" | grep -q "href=\"/quality-assurance/\""; then
    echo "✅ Features → Quality Assurance link found"
else
    echo "❌ Features → Quality Assurance link missing"
    failed_tests=$((failed_tests + 1))
fi

if echo "$homepage_content" | grep -q "href=\"/release-management/\""; then
    echo "✅ Features → Release Management link found"
else
    echo "❌ Features → Release Management link missing"
    failed_tests=$((failed_tests + 1))
fi

# Check Support dropdown links
if echo "$homepage_content" | grep -q "href=\"/terms-of-service/\""; then
    echo "✅ Support → Terms of Service link found"
else
    echo "❌ Support → Terms of Service link missing"
    failed_tests=$((failed_tests + 1))
fi

if echo "$homepage_content" | grep -q "href=\"/privacy-policy/\""; then
    echo "✅ Support → Privacy Policy link found"
else
    echo "❌ Support → Privacy Policy link missing"
    failed_tests=$((failed_tests + 1))
fi

echo ""
echo "📊 Test Summary"
echo "==============="
echo "Total tests: $((total_tests + 5))"
echo "Failed tests: $failed_tests"
echo "Success rate: $(( (total_tests + 5 - failed_tests) * 100 / (total_tests + 5) ))%"

if [ $failed_tests -eq 0 ]; then
    echo "🎉 All tests passed! Navigation, headers, and footers are working correctly."
    exit 0
else
    echo "⚠️  Some tests failed. Please check the issues above."
    exit 1
fi