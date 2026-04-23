+++
title = "API Reference | Divinci AI"
description = "Complete REST API reference for Divinci AI — 60+ endpoints for managing releases, RAG knowledge bases, fine-tuning, transcripts, and more."
template = "feature.html"
+++

<style>
/* Full-width Redoc container — no page chrome */
.feature-page.leonardo-bg::before {
    display: none !important;
}

#redoc-container {
    margin: 0 -2rem;
    min-height: 80vh;
    padding-top: 0;
}

/* Hide any feature-page padding for clean Redoc */
.feature-page {
    padding: 0 !important;
}

/* Widen the Redoc sidebar search bar */
.redoc-wrap .menu-content input[type="search"],
.redoc-wrap .search-input,
.redoc-wrap [role="search"] input {
    width: 100% !important;
    min-width: 200px !important;
    box-sizing: border-box !important;
}

/* Full-width sticky header for API page */
body.feature-page-template header {
    max-width: 100% !important;
    margin: 0 !important;
    position: sticky !important;
    top: 0 !important;
    z-index: 10000 !important;
    transition: padding 0.3s ease;
}

body.feature-page-template header.compact {
    padding: 0.5rem 4rem !important;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

/* Override body overflow-x:hidden which breaks position:sticky */
body.feature-page-template {
    overflow-x: visible !important;
    overflow: visible !important;
}

/* Make Redoc sidebar sticky */
.redoc-wrap {
    display: flex !important;
    align-items: flex-start !important;
}

.redoc-wrap > div:first-child {
    position: sticky !important;
    top: 50px !important;
    height: calc(100vh - 50px) !important;
    overflow-y: auto !important;
    overflow-x: hidden !important;
    flex-shrink: 0 !important;
}

/* Remove warm cream glow from ALL Redoc headings — override .leonardo-bg inheritance */
#redoc-container h1,
#redoc-container h2,
#redoc-container h3,
#redoc-container h4,
#redoc-container h5,
#redoc-container p,
#redoc-container span,
#redoc-container label {
    text-shadow: none !important;
}
</style>

<div id="redoc-container"></div>
