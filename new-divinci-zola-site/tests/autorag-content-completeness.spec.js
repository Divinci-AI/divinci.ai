/**
 * E2E Test Suite for AutoRAG Page Content Completeness
 * 
 * This test ensures that all language versions of the AutoRAG page have
 * the complete set of content sections and interactive components.
 */

const { test, expect } = require('@playwright/test');

test.describe('AutoRAG Page Content Completeness', () => {
    const baseUrl = 'http://127.0.0.1:1027';
    
    // Define the expected sections for a complete AutoRAG page
    const expectedSections = [
        { id: 'feature-overview', name: 'What is AutoRAG?' },
        { id: 'feature-benefits', name: 'Key Benefits' },
        { id: 'feature-details', name: 'How AutoRAG Works' },
        { id: 'feature-implementation', name: 'Implementation Process' },
        { id: 'case-studies', name: 'Success Stories' },
        { id: 'related-features', name: 'Related Features' },
        { id: 'faq', name: 'FAQ' }
    ];
    
    // Define expected components within sections
    const expectedComponents = {
        'feature-overview': {
            elements: [
                '.section-heading',
                '.autorag-diagram-container img',
                '.overview-content'
            ]
        },
        'feature-benefits': {
            elements: [
                '.benefits-circle-container',
                '.center-benefit',
                '.orbital-benefit'
            ],
            minCount: {
                '.orbital-benefit': 5  // Should have at least 5 orbital benefits
            }
        },
        'feature-details': {
            elements: [
                '.details-tabs',
                '.tab-trigger',
                '.tab-content',
                '#tab1-content',
                '#tab2-content',
                '#tab3-content'
            ],
            minCount: {
                '.tab-trigger': 3  // Should have 3 tabs
            }
        },
        'feature-implementation': {
            elements: [
                '.implementation-timeline',
                '.timeline-step',
                '.step-number',
                '.step-content'
            ],
            minCount: {
                '.timeline-step': 3  // Should have 3 implementation steps
            }
        },
        'case-studies': {
            elements: [
                '.case-studies-grid',
                '.case-study-card',
                '.testimonial',
                '.metrics-container'
            ],
            minCount: {
                '.case-study-card': 3  // Should have at least 3 case studies
            }
        },
        'related-features': {
            elements: [
                '.related-features-grid',
                '.related-feature-card'
            ],
            minCount: {
                '.related-feature-card': 3  // Should have at least 3 related features
            }
        },
        'faq': {
            elements: [
                '.accordion',
                '.accordion-item',
                '.accordion-trigger',
                '.accordion-panel'
            ],
            minCount: {
                '.accordion-item': 3  // Should have at least 3 FAQ items
            }
        }
    };
    
    // Test pages for each language
    const languagePages = [
        { lang: 'en', url: '/autorag/', name: 'English' },
        { lang: 'es', url: '/es/autorag/', name: 'Spanish' },
        { lang: 'fr', url: '/fr/autorag/', name: 'French' },
        { lang: 'ar', url: '/ar/autorag/', name: 'Arabic' }
    ];
    
    // Test each language version
    for (const langPage of languagePages) {
        test(`${langPage.name} AutoRAG page has all required sections`, async ({ page }) => {
            await page.goto(`${baseUrl}${langPage.url}`);
            await page.waitForLoadState('networkidle');
            
            // Check if page loaded successfully
            const response = page.url();
            expect(response).toContain(langPage.url);
            
            // Check for each expected section
            for (const section of expectedSections) {
                const sectionElement = page.locator(`#${section.id}`);
                await expect(sectionElement, `${langPage.name} page should have ${section.name} section`).toBeVisible();
                
                // Check section heading exists
                const heading = sectionElement.locator('.section-heading').first();
                await expect(heading, `${section.name} should have a heading`).toBeVisible();
            }
        });
        
        test(`${langPage.name} AutoRAG page has complete content in each section`, async ({ page }) => {
            await page.goto(`${baseUrl}${langPage.url}`);
            await page.waitForLoadState('networkidle');
            
            // Check components within each section
            for (const [sectionId, components] of Object.entries(expectedComponents)) {
                const section = page.locator(`#${sectionId}`);
                
                if (await section.isVisible()) {
                    // Check for required elements
                    for (const selector of components.elements) {
                        const element = section.locator(selector).first();
                        await expect(element, `${langPage.name} ${sectionId} should have ${selector}`).toBeVisible();
                    }
                    
                    // Check minimum counts if specified
                    if (components.minCount) {
                        for (const [selector, minCount] of Object.entries(components.minCount)) {
                            const elements = section.locator(selector);
                            const count = await elements.count();
                            expect(count, `${langPage.name} ${sectionId} should have at least ${minCount} ${selector} elements`).toBeGreaterThanOrEqual(minCount);
                        }
                    }
                }
            }
        });
        
        test(`${langPage.name} AutoRAG page tabs are interactive`, async ({ page }) => {
            await page.goto(`${baseUrl}${langPage.url}`);
            await page.waitForLoadState('networkidle');
            
            const tabSection = page.locator('#feature-details');
            
            if (await tabSection.isVisible()) {
                // Get all tab triggers
                const tabs = tabSection.locator('.tab-trigger');
                const tabCount = await tabs.count();
                
                expect(tabCount, `${langPage.name} should have tab triggers`).toBeGreaterThan(0);
                
                // Test each tab
                for (let i = 0; i < tabCount; i++) {
                    const tab = tabs.nth(i);
                    const tabId = await tab.getAttribute('aria-controls');
                    
                    // Click the tab
                    await tab.click();
                    
                    // Check if tab is marked as selected
                    const isSelected = await tab.getAttribute('aria-selected');
                    expect(isSelected).toBe('true');
                    
                    // Check if corresponding panel is visible
                    const panel = page.locator(`#${tabId}`);
                    await expect(panel).toBeVisible();
                }
            }
        });
        
        test(`${langPage.name} AutoRAG page has proper translations`, async ({ page }) => {
            await page.goto(`${baseUrl}${langPage.url}`);
            await page.waitForLoadState('networkidle');
            
            // Language-specific content checks
            const langContent = {
                'en': {
                    overview: 'What is AutoRAG?',
                    benefits: 'Key Benefits',
                    howItWorks: 'How AutoRAG Works',
                    implementation: 'Implementation Process',
                    cta: 'Request Demo'
                },
                'es': {
                    overview: '¿Qué es AutoRAG?',
                    benefits: 'Beneficios Clave',
                    howItWorks: 'Cómo Funciona AutoRAG',
                    implementation: 'Proceso de Implementación',
                    cta: 'Solicitar Demo'
                },
                'fr': {
                    overview: "Qu'est-ce qu'AutoRAG",
                    benefits: 'Avantages Clés',
                    howItWorks: 'Comment Fonctionne AutoRAG',
                    implementation: "Processus d'Implémentation",
                    cta: 'Demander une Démo'
                },
                'ar': {
                    overview: 'ما هو AutoRAG',
                    benefits: 'المزايا الرئيسية',
                    howItWorks: 'كيف يعمل AutoRAG',
                    implementation: 'عملية التنفيذ',
                    cta: 'طلب عرض توضيحي'
                }
            };
            
            const expectedTexts = langContent[langPage.lang];
            
            if (expectedTexts) {
                // Check overview heading
                const overviewHeading = page.locator('#feature-overview .section-heading').first();
                const overviewText = await overviewHeading.textContent();
                expect(overviewText).toContain(expectedTexts.overview);
                
                // Check benefits heading
                const benefitsHeading = page.locator('#feature-benefits .section-heading').first();
                const benefitsText = await benefitsHeading.textContent();
                expect(benefitsText).toContain(expectedTexts.benefits);
                
                // Check CTA button
                const ctaButton = page.locator('.secondary-button').first();
                if (await ctaButton.isVisible()) {
                    const ctaText = await ctaButton.textContent();
                    expect(ctaText).toContain(expectedTexts.cta);
                }
            }
        });
    }
    
    test('All AutoRAG pages have consistent visual structure', async ({ page }) => {
        const visualElements = [];
        
        // Collect visual structure from English page as reference
        await page.goto(`${baseUrl}/autorag/`);
        await page.waitForLoadState('networkidle');
        
        for (const section of expectedSections) {
            const sectionElement = page.locator(`#${section.id}`);
            if (await sectionElement.isVisible()) {
                const boundingBox = await sectionElement.boundingBox();
                visualElements.push({
                    section: section.id,
                    hasContent: boundingBox && boundingBox.height > 100
                });
            }
        }
        
        // Compare with other language versions
        for (const langPage of languagePages.slice(1)) {  // Skip English as it's the reference
            await page.goto(`${baseUrl}${langPage.url}`);
            await page.waitForLoadState('networkidle');
            
            for (const element of visualElements) {
                const sectionElement = page.locator(`#${element.section}`);
                if (element.hasContent) {
                    await expect(sectionElement, `${langPage.name} should have ${element.section} section with content`).toBeVisible();
                    const boundingBox = await sectionElement.boundingBox();
                    expect(boundingBox && boundingBox.height > 100, `${langPage.name} ${element.section} should have substantial content`).toBeTruthy();
                }
            }
        }
    });
    
    test('AutoRAG pages have working SVG animations', async ({ page }) => {
        // Test a sample of pages for SVG animations
        const testPages = [
            { lang: 'en', url: '/autorag/' },
            { lang: 'fr', url: '/fr/autorag/' }
        ];
        
        for (const testPage of testPages) {
            await page.goto(`${baseUrl}${testPage.url}`);
            await page.waitForLoadState('networkidle');
            
            // Check for animated SVG elements in benefits section
            const benefitsSection = page.locator('#feature-benefits');
            if (await benefitsSection.isVisible()) {
                const animatedElements = benefitsSection.locator('svg animate, svg animateTransform');
                const animationCount = await animatedElements.count();
                
                expect(animationCount, `${testPage.lang} AutoRAG page should have SVG animations`).toBeGreaterThan(0);
                
                // Check if animations have proper attributes
                if (animationCount > 0) {
                    const firstAnimation = animatedElements.first();
                    const repeatCount = await firstAnimation.getAttribute('repeatCount');
                    expect(repeatCount).toBe('indefinite');
                }
            }
        }
    });
});

test.describe('AutoRAG Page Performance and Accessibility', () => {
    const baseUrl = 'http://127.0.0.1:1027';
    
    test('AutoRAG pages load within acceptable time', async ({ page }) => {
        const pages = ['/autorag/', '/es/autorag/', '/fr/autorag/', '/ar/autorag/'];
        
        for (const pageUrl of pages) {
            const startTime = Date.now();
            await page.goto(`${baseUrl}${pageUrl}`);
            await page.waitForLoadState('networkidle');
            const loadTime = Date.now() - startTime;
            
            expect(loadTime, `${pageUrl} should load within 5 seconds`).toBeLessThan(5000);
        }
    });
    
    test('AutoRAG pages have proper semantic HTML', async ({ page }) => {
        await page.goto(`${baseUrl}/autorag/`);
        await page.waitForLoadState('networkidle');
        
        // Check for semantic HTML elements
        const semanticElements = {
            'main': await page.locator('main').count(),
            'section': await page.locator('section').count(),
            'h2': await page.locator('h2').count(),
            'h3': await page.locator('h3').count()
        };
        
        expect(semanticElements.main, 'Should have main element').toBeGreaterThan(0);
        expect(semanticElements.section, 'Should have section elements').toBeGreaterThan(5);
        expect(semanticElements.h2, 'Should have h2 headings').toBeGreaterThan(5);
        expect(semanticElements.h3, 'Should have h3 headings').toBeGreaterThan(3);
    });
});