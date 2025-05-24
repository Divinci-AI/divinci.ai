# Multilingual Content and SEO Guide for Divinci AI

This comprehensive guide explains how to manage multilingual content and optimize SEO for each language on the Divinci AI website.

## Table of Contents

1. [Content Translation Workflow](#content-translation-workflow)
2. [Crowdin Integration](#crowdin-integration)
3. [Language-Specific SEO](#language-specific-seo)
4. [Best Practices](#best-practices)
5. [Maintenance and Updates](#maintenance-and-updates)

## Content Translation Workflow

### Overview

The content translation workflow for Divinci AI follows these steps:

1. **Extract Content**: Extract translatable content from HTML files
2. **Upload to Crowdin**: Upload content to Crowdin for translation
3. **Translate Content**: Translate content in Crowdin
4. **Download Translations**: Download translations from Crowdin
5. **Apply Translations**: Apply translations to HTML files
6. **Review and Test**: Review and test translated pages

### Step-by-Step Process

#### 1. Extract Content

Run the content extraction script to identify translatable content:

```bash
node scripts/crowdin-integration.js extract
```

This will:
- Scan all HTML files for translatable content
- Extract text from elements with `data-i18n` attributes
- Extract text from headings, paragraphs, and other content elements
- Save the extracted content to `translations/translations.json`

#### 2. Upload to Crowdin

Upload the extracted content to Crowdin:

```bash
node scripts/crowdin-integration.js upload
```

This will:
- Upload the extracted content to Crowdin
- Create or update files in the Crowdin project
- Prepare the content for translation

#### 3. Translate Content

Translate the content in Crowdin:

1. Log in to [Crowdin](https://crowdin.com)
2. Navigate to the Divinci AI project
3. Select the language you want to translate to
4. Translate the strings
5. Use Crowdin's translation memory and machine translation suggestions to speed up the process

#### 4. Download Translations

Download the translations from Crowdin:

```bash
node scripts/crowdin-integration.js download
```

This will:
- Build the translations on Crowdin
- Download the translations for each language
- Save the translations to `translations/downloaded/`

#### 5. Apply Translations

Apply the translations to the HTML files:

```bash
node scripts/crowdin-integration.js apply
```

This will:
- Apply the translations to the HTML files
- Update the language-specific versions of the files
- Preserve the HTML structure and attributes

#### 6. Review and Test

Review and test the translated pages:

1. Open the translated pages in a browser
2. Check for any missing translations
3. Verify that the layout and formatting are correct
4. Test the functionality of the pages
5. Check for any cultural or linguistic issues

### Run All Steps at Once

To run all steps in sequence:

```bash
node scripts/crowdin-integration.js all
```

## Crowdin Integration

### Setup

1. Create a Crowdin account at [crowdin.com](https://crowdin.com)
2. Create a new project named "divinci-ai-website"
3. Get your API token from [Crowdin Settings > API](https://crowdin.com/settings#api-key)
4. Create a `.env` file in the root directory with:

```
CROWDIN_API_TOKEN=your_api_token_here
CROWDIN_PROJECT_ID=divinci-ai-website
```

### Project Structure

The Crowdin project should have the following structure:

- **Source Files**: JSON files containing the extracted content
- **Target Languages**: Spanish (es), French (fr), Arabic (ar)
- **Translation Memory**: Shared across all files
- **Glossary**: Technical terms and brand names

### Translation Guidelines

Provide these guidelines to translators:

1. **Brand Names**: Do not translate brand names (Divinci, ChatGPT, Gemini, Claude, etc.)
2. **Technical Terms**: Use the glossary for consistent translation of technical terms
3. **Cultural Adaptation**: Adapt content to the target culture where appropriate
4. **Formatting**: Preserve HTML tags and formatting
5. **Length Constraints**: Be aware of space constraints in UI elements
6. **Tone and Voice**: Maintain the friendly, professional tone of the original content

## Language-Specific SEO

### Keyword Research

Use the SEO keyword research tool to identify and optimize keywords for each language:

```bash
node scripts/seo-keyword-research.js all
```

This will:
1. Extract existing keywords from HTML files
2. Suggest related keywords for each language
3. Generate a keyword optimization report

### Optimization Process

For each language:

1. **Identify Primary Keywords**: Determine the main keywords for each page
2. **Optimize Meta Tags**: Update title tags and meta descriptions with language-specific keywords
3. **Optimize Content**: Include keywords in headings, paragraphs, and image alt text
4. **Create Language-Specific Sitemaps**: Generate and submit language-specific sitemaps
5. **Monitor Performance**: Track rankings and traffic for each language

### Language-Specific Considerations

#### Spanish (es)

- Focus on Latin American and European Spanish variations
- Consider regional differences in terminology
- Target Spain, Mexico, Colombia, Argentina, and other Spanish-speaking countries

#### French (fr)

- Consider differences between European French and Canadian French
- Use formal language for professional contexts
- Target France, Canada, Belgium, Switzerland, and other French-speaking countries

#### Arabic (ar)

- Ensure proper RTL (right-to-left) layout
- Consider cultural sensitivities
- Target Middle Eastern and North African countries

## Best Practices

### Content Management

1. **Single Source of Truth**: Maintain the English version as the source of truth
2. **Regular Updates**: Update translations when the source content changes
3. **Version Control**: Track changes to translations in version control
4. **Quality Assurance**: Review translations for accuracy and cultural appropriateness

### Technical Implementation

1. **Proper Markup**: Use `lang` and `dir` attributes on HTML elements
2. **Responsive Design**: Ensure layouts work for all languages, including RTL
3. **Font Support**: Use fonts that support all required characters
4. **Performance**: Optimize page speed for all language versions

### SEO

1. **Hreflang Tags**: Maintain proper hreflang tags across all pages
2. **URL Structure**: Use consistent URL structure for all languages
3. **Sitemaps**: Keep language-specific sitemaps up to date
4. **Local Backlinks**: Build backlinks from websites in target languages

## Maintenance and Updates

### Regular Tasks

1. **Content Synchronization**: Keep all language versions in sync with the source
2. **Translation Updates**: Update translations for new or changed content
3. **SEO Monitoring**: Track rankings and traffic for each language
4. **Technical Validation**: Validate HTML, hreflang tags, and sitemaps

### Quarterly Review

Conduct a quarterly review of:

1. **Translation Quality**: Review and improve translations
2. **SEO Performance**: Analyze rankings and traffic for each language
3. **User Feedback**: Collect and address feedback from users of different language versions
4. **Competitive Analysis**: Monitor competitors' multilingual strategies

### Annual Strategy

Develop an annual strategy for:

1. **Language Expansion**: Consider adding new languages based on user demographics
2. **Content Expansion**: Identify content gaps in specific languages
3. **SEO Improvement**: Update keyword strategy based on performance data
4. **Technical Upgrades**: Implement new multilingual features and technologies

## Additional Resources

- [Crowdin Documentation](https://support.crowdin.com/)
- [Google's Multilingual SEO Guide](https://developers.google.com/search/docs/advanced/crawling/managing-multi-regional-sites)
- [Moz International SEO Guide](https://moz.com/learn/seo/international-seo)
- [W3C Internationalization](https://www.w3.org/International/)
