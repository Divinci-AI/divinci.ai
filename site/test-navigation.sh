#!/bin/bash

# Navigation Test Script
# Tests all migrated pages and verifies they return 200 OK

echo "🔗 Testing Navigation for Migrated Pages"
echo "========================================"

BASE_URL="http://127.0.0.1:1025"

# Define test pages
declare -A pages=(
    ["/autorag/"]="AutoRAG - Automated Retrieval Augmented Generation"
    ["/quality-assurance/"]="LLM Quality Assurance"
    ["/release-management/"]="AI Release Management"
    ["/terms-of-service/"]="Terms of Service"
    ["/privacy-policy/"]="Privacy Policy"
    ["/"]="Divinci AI - Excellence, every time"
)

# Test each page
failed_tests=0
total_tests=0

for url in "${!pages[@]}"; do
    total_tests=$((total_tests + 1))
    echo -n "Testing $url... "
    
    # Check HTTP status
    status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$url")
    
    if [ "$status" = "200" ]; then
        echo "✅ $status OK"
        
        # Check if page contains expected title
        page_content=$(curl -s "$BASE_URL$url")
        expected_title="${pages[$url]}"
        
        if echo "$page_content" | grep -q "$expected_title"; then
            echo "   📝 Title verified: $expected_title"
        else
            echo "   ⚠️  Title not found: $expected_title"
        fi
        
        # Check header and footer
        if echo "$page_content" | grep -q "<header>"; then
            echo "   🏗️  Header found"
        else
            echo "   ❌ Header missing"
            failed_tests=$((failed_tests + 1))
        fi
        
        if echo "$page_content" | grep -q "site-footer"; then
            echo "   🦶 Footer found"
        else
            echo "   ❌ Footer missing"
            failed_tests=$((failed_tests + 1))
        fi
        
        # Check navigation elements
        if echo "$page_content" | grep -q "dropdown-menu"; then
            echo "   🎯 Navigation dropdowns found"
        else
            echo "   ⚠️  Navigation dropdowns missing"
        fi
        
    else
        echo "❌ $status ERROR"
        failed_tests=$((failed_tests + 1))
    fi
    echo
done

# Test dropdown structure
echo "🎯 Testing Dropdown Menu Structure"
echo "=================================="

homepage=$(curl -s "$BASE_URL/")

# Check Features dropdown
if echo "$homepage" | grep -q "dropdown-menu.*autorag"; then
    echo "✅ Features dropdown contains AutoRAG link"
else
    echo "❌ Features dropdown missing AutoRAG link"
    failed_tests=$((failed_tests + 1))
fi

if echo "$homepage" | grep -q "dropdown-menu.*quality-assurance"; then
    echo "✅ Features dropdown contains Quality Assurance link"
else
    echo "❌ Features dropdown missing Quality Assurance link"
    failed_tests=$((failed_tests + 1))
fi

if echo "$homepage" | grep -q "dropdown-menu.*release-management"; then
    echo "✅ Features dropdown contains Release Management link"
else
    echo "❌ Features dropdown missing Release Management link"
    failed_tests=$((failed_tests + 1))
fi

# Check Support dropdown
if echo "$homepage" | grep -q "dropdown-menu.*terms-of-service"; then
    echo "✅ Support dropdown contains Terms of Service link"
else
    echo "❌ Support dropdown missing Terms of Service link"
    failed_tests=$((failed_tests + 1))
fi

if echo "$homepage" | grep -q "dropdown-menu.*privacy-policy"; then
    echo "✅ Support dropdown contains Privacy Policy link"
else
    echo "❌ Support dropdown missing Privacy Policy link"
    failed_tests=$((failed_tests + 1))
fi

echo
echo "📊 Test Summary"
echo "==============="
echo "Total tests: $((total_tests + 5))"
echo "Failed tests: $failed_tests"
echo "Success rate: $(( (total_tests + 5 - failed_tests) * 100 / (total_tests + 5) ))%"

if [ $failed_tests -eq 0 ]; then
    echo "🎉 All tests passed! Navigation is working correctly."
    exit 0
else
    echo "⚠️  Some tests failed. Please check the issues above."
    exit 1
fi