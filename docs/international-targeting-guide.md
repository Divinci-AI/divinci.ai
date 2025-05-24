# International Targeting Guide for Divinci AI

This guide explains how to configure international targeting in Google Search Console for the Divinci AI website.

## Prerequisites

1. Access to Google Search Console for the Divinci AI website
2. Verification of ownership for the website
3. Implementation of hreflang tags across all pages (already completed)
4. Creation of language-specific sitemaps (already completed)

## Steps to Configure International Targeting

### 1. Access Google Search Console

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Log in with the Google account that has access to the Divinci AI property
3. Select the Divinci AI property (https://divinci.ai)

### 2. Add Language-Specific Properties (Optional)

If you want to manage each language version separately, you can add them as separate properties:

1. Click on "Add Property" in the property selector
2. Select "URL prefix" as the property type
3. Enter the URL for each language version (e.g., https://divinci.ai/es/, https://divinci.ai/fr/, etc.)
4. Verify ownership for each property

### 3. Configure International Targeting for the Main Property

1. In the left sidebar, click on "Legacy tools and reports"
2. Click on "International targeting"
3. Go to the "Language" tab
4. Review the detected hreflang tags - they should match our implementation
5. If there are any errors, note them for fixing

### 4. Configure Country Targeting (Optional)

If you want to target specific countries with specific language versions:

1. In the "International targeting" section, go to the "Country" tab
2. Select the appropriate country targeting option:
   - "No country target" (recommended for global websites)
   - Specific country (if a language version is specifically for one country)

### 5. Submit Sitemaps

1. In the left sidebar, click on "Sitemaps"
2. Add the following sitemaps:
   - `sitemap.xml` (main sitemap)
   - `sitemap_es.xml` (Spanish sitemap)
   - `sitemap_fr.xml` (French sitemap)
   - `sitemap_ar.xml` (Arabic sitemap)
   - `sitemap_index.xml` (sitemap index)
3. Verify that all sitemaps are successfully processed

### 6. Monitor International Performance

1. In the "Performance" report, use the "Country" and "Language" filters to analyze how different language versions are performing
2. Look for issues specific to certain languages or countries
3. Check the "Coverage" report for any language-specific indexing issues

## Common Issues and Solutions

### Hreflang Tag Errors

If Google Search Console reports hreflang errors:

1. **Missing return links**: Ensure each language version links to all other language versions
2. **Invalid language codes**: Verify all language codes follow the ISO 639-1 format
3. **Inconsistent URLs**: Make sure URLs in hreflang tags match the actual URLs of the pages

### Sitemap Issues

If sitemaps aren't being processed correctly:

1. **Format errors**: Validate sitemaps using [Google's Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
2. **Size issues**: Ensure sitemaps don't exceed 50MB or 50,000 URLs
3. **Incorrect URLs**: Verify that URLs in sitemaps match the actual URLs of the pages

### Indexing Issues

If certain language versions aren't being indexed:

1. **Robots.txt blocking**: Check if robots.txt is blocking any language directories
2. **Canonical issues**: Ensure canonical tags don't interfere with language versions
3. **Duplicate content**: Make sure content is properly translated, not just duplicated

## Best Practices

1. **Regular monitoring**: Check international targeting reports at least monthly
2. **Update hreflang tags**: When adding new pages or languages, update hreflang tags accordingly
3. **Maintain sitemaps**: Keep language-specific sitemaps up to date
4. **Content quality**: Ensure translations are high-quality and culturally appropriate
5. **Mobile optimization**: Verify all language versions are mobile-friendly
6. **Page speed**: Monitor and optimize page speed for all language versions

## Additional Resources

- [Google's Guide to Managing Multi-regional and Multilingual Sites](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites)
- [Hreflang Tags Generator Tool](https://www.aleydasolis.com/english/international-seo-tools/hreflang-tags-generator/)
- [International SEO Checklist](https://www.semrush.com/blog/international-seo-checklist/)

## Next Steps

After configuring international targeting in Google Search Console:

1. Monitor search performance for each language version
2. Analyze user behavior on different language versions using Google Analytics
3. Optimize content for language-specific keywords
4. Consider adding more languages based on user demographics and business goals
