# URL Structure and Redirects Plan

## Overview

This document outlines the URL structure for Divinci.ai's marketing pages, focusing on enterprise AI features. The structure is designed to be:

- SEO-friendly
- Logically organized
- Scalable for future content
- User-friendly
- Conducive to analytics tracking

## URL Structure

### Base Structure

All feature-related content will follow this pattern:
```
https://divinci.ai/features/{feature-category}/{specific-feature}
```

### Feature Categories

1. **data-management/**
   - autorag
   - knowledge-base-integration
   - data-processing-pipeline

2. **development-tools/**
   - release-cycle-management
   - version-control
   - collaborative-development

3. **quality-assurance/**
   - llm-quality-assurance
   - prompt-testing
   - behavior-monitoring

4. **integration/**
   - api-ecosystem
   - custom-deployment
   - enterprise-connectors

### Complete URL Map

#### Primary Feature Pages
```
/features/data-management/autorag
/features/development-tools/release-cycle-management
/features/quality-assurance/llm-quality-assurance
```

#### Sub-feature Pages
```
/features/data-management/autorag/implementation-guide
/features/data-management/autorag/case-studies
/features/data-management/autorag/technical-details

/features/development-tools/release-cycle-management/implementation-guide
/features/development-tools/release-cycle-management/case-studies
/features/development-tools/release-cycle-management/technical-details

/features/quality-assurance/llm-quality-assurance/implementation-guide
/features/quality-assurance/llm-quality-assurance/case-studies
/features/quality-assurance/llm-quality-assurance/technical-details
```

#### Resource Pages
```
/resources/white-papers/{paper-name}
/resources/webinars/{webinar-name}
/resources/documentation/{doc-section}
```

## Implementation Plan

### Phase 1: Foundation (Current)
- Create feature page templates
- Establish base URL structure
- Implement URL routing in development environment

### Phase 2: Initial Content Pages
- Create primary feature pages for AutoRAG, Release Cycle Management, and LLM QA
- Implement proper canonical tags
- Set up site map

### Phase 3: Content Expansion
- Add sub-feature pages
- Create resource pages
- Expand documentation

## Redirects Strategy

### URL Migration

If migrating from existing URLs, implement 301 redirects:

| Old URL | New URL |
|---------|---------|
| /autorag | /features/data-management/autorag |
| /release-management | /features/development-tools/release-cycle-management |
| /quality-assurance | /features/quality-assurance/llm-quality-assurance |

### Future-proofing

1. **URL Parameter Handling**:
   - Implement clean URL strategy (avoid query parameters where possible)
   - Strip trailing slashes consistently

2. **Redirect Chain Prevention**:
   - Always redirect to final destination URL
   - Audit redirects quarterly to prevent chains

3. **Temporary Content Strategy**:
   - Use `/campaigns/{campaign-name}` for temporary content
   - Implement automatic 302 redirects to permanent locations after campaign end

## Technical Implementation

### .htaccess Configuration (Apache)

For Apache servers, implement the following redirect rules:

```apache
# Ensure www to non-www redirect
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.divinci\.ai [NC]
RewriteRule ^(.*)$ https://divinci.ai/$1 [L,R=301]

# Redirect old feature URLs to new structure
RedirectMatch 301 ^/autorag$ /features/data-management/autorag
RedirectMatch 301 ^/release-management$ /features/development-tools/release-cycle-management
RedirectMatch 301 ^/quality-assurance$ /features/quality-assurance/llm-quality-assurance

# Handle trailing slashes consistently
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)/$ /$1 [L,R=301]
```

### Nginx Configuration

For Nginx servers, implement the following:

```nginx
# Ensure www to non-www redirect
server {
    listen 80;
    server_name www.divinci.ai;
    return 301 $scheme://divinci.ai$request_uri;
}

# Redirect old feature URLs to new structure
location = /autorag {
    return 301 /features/data-management/autorag;
}

location = /release-management {
    return 301 /features/development-tools/release-cycle-management;
}

location = /quality-assurance {
    return 301 /features/quality-assurance/llm-quality-assurance;
}

# Remove trailing slashes
rewrite ^/(.*)/$ /$1 permanent;
```

## Monitoring and Maintenance

1. **Monitoring Tools**:
   - Set up Google Search Console to monitor URL changes
   - Configure server-side logging of 404 errors
   - Use crawler tools to identify broken links monthly

2. **Analytics Integration**:
   - Tag URL patterns in Google Analytics 
   - Monitor traffic changes after URL structure implementation
   - Set up conversion tracking for each feature page

3. **Maintenance Schedule**:
   - Quarterly URL structure audit
   - Monthly 404 error review and correction
   - Annual comprehensive SEO URL review

## Conclusion

This URL structure provides a scalable foundation for Divinci.ai's enterprise AI feature marketing content. It organizes content logically while maintaining SEO best practices and allows for future expansion without major restructuring.