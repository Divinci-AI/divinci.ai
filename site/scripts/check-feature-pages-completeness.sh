#!/bin/bash

# Script to check completeness of feature pages across all languages

echo "==============================================="
echo "Feature Pages Completeness Check"
echo "==============================================="
echo ""

# Define feature pages to check
FEATURES=("autorag" "quality-assurance" "release-management")
LANGUAGES=("" "es" "fr" "ar")
CONTENT_DIR="/Users/mikeumus/Documents/divinci.ai/new-divinci-zola-site/content"

# Function to get line count
get_line_count() {
    local file=$1
    if [ -f "$file" ]; then
        wc -l "$file" | awk '{print $1}'
    else
        echo "0"
    fi
}

# Function to check sections in file
check_sections() {
    local file=$1
    if [ -f "$file" ]; then
        grep -E "^<section id=" "$file" | sed 's/<section id="//' | sed 's/".*$//' | tr '\n' ' '
    else
        echo "FILE_NOT_FOUND"
    fi
}

# Check each feature page
for feature in "${FEATURES[@]}"; do
    echo "Feature: $(echo $feature | tr '[:lower:]' '[:upper:]')"
    echo "----------------------------------------"
    
    # Get English version info (baseline)
    en_file="${CONTENT_DIR}/${feature}.md"
    en_lines=$(get_line_count "$en_file")
    en_sections=$(check_sections "$en_file")
    
    echo "English (baseline): ${en_lines} lines"
    echo "Sections: ${en_sections}"
    echo ""
    
    # Check other languages
    for lang in "es" "fr" "ar"; do
        lang_file="${CONTENT_DIR}/${lang}/${feature}.md"
        lang_lines=$(get_line_count "$lang_file")
        lang_sections=$(check_sections "$lang_file")
        
        # Calculate completeness percentage
        if [ "$en_lines" -gt 0 ]; then
            percentage=$((lang_lines * 100 / en_lines))
        else
            percentage=0
        fi
        
        # Determine status
        if [ "$percentage" -ge 90 ]; then
            status="✅ COMPLETE"
        elif [ "$percentage" -ge 50 ]; then
            status="⚠️  PARTIAL"
        else
            status="❌ INCOMPLETE"
        fi
        
        echo "$(echo $lang | tr '[:lower:]' '[:upper:]'): ${lang_lines} lines (${percentage}%) ${status}"
        echo "   Sections: ${lang_sections}"
    done
    
    echo ""
done

echo "==============================================="
echo "Summary:"
echo "==============================================="

# Generate summary
total_incomplete=0
total_partial=0
total_complete=0

for feature in "${FEATURES[@]}"; do
    en_file="${CONTENT_DIR}/${feature}.md"
    en_lines=$(get_line_count "$en_file")
    
    for lang in "es" "fr" "ar"; do
        lang_file="${CONTENT_DIR}/${lang}/${feature}.md"
        lang_lines=$(get_line_count "$lang_file")
        
        if [ "$en_lines" -gt 0 ]; then
            percentage=$((lang_lines * 100 / en_lines))
        else
            percentage=0
        fi
        
        if [ "$percentage" -ge 90 ]; then
            ((total_complete++))
        elif [ "$percentage" -ge 50 ]; then
            ((total_partial++))
        else
            ((total_incomplete++))
        fi
    done
done

echo "✅ Complete: ${total_complete} pages"
echo "⚠️  Partial: ${total_partial} pages"
echo "❌ Incomplete: ${total_incomplete} pages"
echo ""
echo "Recommendation: ${total_incomplete} pages need full content updates"