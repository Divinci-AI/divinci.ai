#!/bin/bash

# Script to fix documentation links from docs/ to docs/index.html

echo "Fixing documentation links..."

# Fix files with href="docs/"
files_with_docs=$(find . -name "*.html" -type f -exec grep -l 'href="docs/"' {} \;)
for file in $files_with_docs; do
    echo "Fixing $file"
    sed -i 's|href="docs/"|href="docs/index.html"|g' "$file"
done

# Fix files with href="../docs/"
files_with_relative_docs=$(find . -name "*.html" -type f -exec grep -l 'href="../docs/"' {} \;)
for file in $files_with_relative_docs; do
    echo "Fixing $file"
    sed -i 's|href="../docs/"|href="../docs/index.html"|g' "$file"
done

echo "Documentation links fixed!"

# Verify the changes
echo "Verifying changes..."
remaining_docs=$(find . -name "*.html" -type f -exec grep -l 'href="[^"]*docs/"' {} \; | wc -l)
echo "Remaining files with docs/ links: $remaining_docs"

if [ $remaining_docs -eq 0 ]; then
    echo "✅ All documentation links have been successfully updated!"
else
    echo "⚠️  Some files still have docs/ links that need manual review"
    find . -name "*.html" -type f -exec grep -l 'href="[^"]*docs/"' {} \;
fi
