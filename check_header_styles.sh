#!/bin/bash

# Find all HTML files except those in includes directory
find . -name "*.html" -not -path "./includes/*" -not -path "./zola-site/*" -not -path "./templates/*" | while read -r file; do
    # Check if the file includes header-styles.css
    if ! grep -q "header-styles.css" "$file"; then
        echo "Missing header-styles.css: $file"
    fi
    
    # Check if the file has the Sign Up button with the correct classes
    if ! grep -q 'class="signup-link".*class="signup-button"' "$file" && ! grep -q 'data-include="includes/header.html"' "$file"; then
        echo "Missing proper Sign Up button: $file"
    fi
done
