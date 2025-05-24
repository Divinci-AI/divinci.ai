/**
 * Structured Data Implementation for Divinci AI
 * 
 * This file contains JSON-LD structured data for various pages on the Divinci AI website.
 * It helps search engines understand the content and context of the website.
 */

// Function to add structured data to the page
function addStructuredData(jsonLD) {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify(jsonLD);
  document.head.appendChild(script);
}

// Organization schema for the homepage
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Divinci AI",
  "url": "https://divinci.ai",
  "logo": "https://divinci.ai/images/logo.png",
  "sameAs": [
    "https://twitter.com/divinciAI",
    "https://www.linkedin.com/company/divinci-ai",
    "https://www.facebook.com/DivinciAI"
  ],
  "description": "Your AI for Life's Journey, with friends!",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "US"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer support",
    "email": "support@divinci.ai"
  }
};

// Website schema
const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Divinci AI",
  "url": "https://divinci.ai",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://divinci.ai/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
};

// Product schema for AI features
const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Divinci AI Platform",
  "description": "AI-powered platform for life's journey, helping you make better decisions with friends.",
  "image": "https://divinci.ai/images/product-screenshot.png",
  "brand": {
    "@type": "Brand",
    "name": "Divinci AI"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
};

// FAQ schema for support pages
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is Divinci AI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Divinci AI is your AI for Life's Journey, with friends! Our platform helps you make better decisions by leveraging artificial intelligence."
      }
    },
    {
      "@type": "Question",
      "name": "How do I get started with Divinci AI?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Getting started is easy! Simply create an account on our website and follow the onboarding process to set up your profile."
      }
    },
    {
      "@type": "Question",
      "name": "Is Divinci AI free to use?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, Divinci AI offers a free tier with basic features. We also offer premium plans with additional capabilities for power users."
      }
    }
  ]
};

// Breadcrumb schema template
function createBreadcrumbSchema(breadcrumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

// Function to determine which schema to add based on the current page
function initStructuredData() {
  const currentPath = window.location.pathname;
  
  // Add Organization and Website schema to all pages
  addStructuredData(organizationSchema);
  addStructuredData(websiteSchema);
  
  // Add page-specific schema
  if (currentPath === '/' || currentPath === '/index.html') {
    // Homepage - already has Organization and Website schema
  } else if (currentPath.includes('/features/')) {
    // Features pages - add Product schema
    addStructuredData(productSchema);
    
    // Add breadcrumb for features pages
    const featuresBreadcrumb = createBreadcrumbSchema([
      { name: "Home", url: "https://divinci.ai/" },
      { name: "Features", url: "https://divinci.ai/features/" },
      { name: "Current Feature", url: "https://divinci.ai" + currentPath }
    ]);
    addStructuredData(featuresBreadcrumb);
  } else if (currentPath.includes('/support/') || currentPath.includes('/faq/')) {
    // Support or FAQ pages - add FAQ schema
    addStructuredData(faqSchema);
    
    // Add breadcrumb for support pages
    const supportBreadcrumb = createBreadcrumbSchema([
      { name: "Home", url: "https://divinci.ai/" },
      { name: "Support", url: "https://divinci.ai/support/" },
      { name: "FAQ", url: "https://divinci.ai/support/faq/" }
    ]);
    addStructuredData(supportBreadcrumb);
  }
}

// Initialize structured data when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initStructuredData);
