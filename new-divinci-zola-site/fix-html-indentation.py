#!/usr/bin/env python3
"""
Fix HTML indentation in markdown files to prevent Zola from treating them as code blocks.
This script removes leading whitespace from HTML tags while preserving content indentation.
"""

import re
import os

def fix_html_indentation(content):
    """Remove indentation from HTML tags while preserving content structure."""
    lines = content.split('\n')
    fixed_lines = []
    in_html_block = False
    
    for line in lines:
        stripped = line.strip()
        
        # Check if line starts with HTML tag
        if re.match(r'^\s*<[^>]+>', line) and not stripped.startswith('```'):
            # Remove leading whitespace from HTML tags
            fixed_lines.append(stripped)
            in_html_block = True
        elif in_html_block and stripped == '':
            # Preserve empty lines in HTML blocks
            fixed_lines.append('')
        elif in_html_block and (stripped.startswith('<') or stripped.endswith('>')):
            # Continue removing indentation for HTML content
            fixed_lines.append(stripped)
        else:
            # Preserve original line for non-HTML content
            fixed_lines.append(line)
            if not stripped == '':
                in_html_block = False
    
    return '\n'.join(fixed_lines)

def process_file(filepath):
    """Process a single markdown file to fix HTML indentation."""
    print(f"Processing {filepath}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    fixed_content = fix_html_indentation(content)
    
    # Only write if content changed
    if fixed_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(fixed_content)
        print(f"Fixed indentation in {filepath}")
    else:
        print(f"No changes needed in {filepath}")

def main():
    """Main function to process all feature pages."""
    base_dir = "/Users/mikeumus/Documents/divinci.ai/new-divinci-zola-site/content"
    
    feature_pages = [
        "autorag.md",
        "quality-assurance.md", 
        "release-management.md"
    ]
    
    for page in feature_pages:
        filepath = os.path.join(base_dir, page)
        if os.path.exists(filepath):
            process_file(filepath)
        else:
            print(f"File not found: {filepath}")

if __name__ == "__main__":
    main()