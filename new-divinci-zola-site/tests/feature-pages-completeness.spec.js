/**
 * E2E Test Suite for All Feature Pages Content Completeness
 * 
 * This test ensures that all language versions of feature pages 
 * (AutoRAG, Quality Assurance, Release Management) have complete content.
 */

const { test, expect } = require('@playwright/test');

test.describe('Feature Pages Content Completeness', () => {
    const baseUrl = 'http://127.0.0.1:1027';
    
    // Define feature pages and their expected sections
    const featurePages = {
        'autorag': {
            name: 'AutoRAG',
            expectedSections: [
                { id: 'feature-overview', name: 'What is AutoRAG?' },
                { id: 'feature-benefits', name: 'Key Benefits' },
                { id: 'feature-details', name: 'How AutoRAG Works' },
                { id: 'feature-implementation', name: 'Implementation Process' },
                { id: 'case-studies', name: 'Success Stories' },
                { id: 'related-features', name: 'Related Features' },
                { id: 'faq', name: 'FAQ' }
            ],
            expectedComponents: {
                'feature-benefits': { minElements: { '.orbital-benefit': 5 } },
                'feature-details': { minElements: { '.tab-trigger': 3 } },
                'feature-implementation': { minElements: { '.timeline-step': 3 } },
                'case-studies': { minElements: { '.case-study-card': 3 } },
                'faq': { minElements: { '.accordion-item': 3 } }
            }
        },
        'quality-assurance': {
            name: 'Quality Assurance',
            expectedSections: [
                { id: 'feature-overview', name: 'What is LLM Quality Assurance?' },
                { id: 'feature-benefits', name: 'Key Benefits' },
                { id: 'feature-details', name: 'How Quality Assurance Works' },
                { id: 'qa-pipeline', name: 'Quality Assurance Pipeline' },
                { id: 'case-studies', name: 'Success Stories' },
                { id: 'related-features', name: 'Related Features' },
                { id: 'faq', name: 'FAQ' }
            ],
            expectedComponents: {
                'feature-benefits': { minElements: { '.orbital-benefit': 5 } },
                'qa-pipeline': { minElements: { '.pipeline-step': 3 } },
                'case-studies': { minElements: { '.case-study-card': 2 } },
                'faq': { minElements: { '.accordion-item': 3 } }
            }
        },
        'release-management': {
            name: 'Release Management',
            expectedSections: [
                { id: 'feature-overview', name: 'What is LLM Release Management?' },
                { id: 'core-capabilities', name: 'Core Capabilities' },
                { id: 'release-pipeline', name: 'Release Pipeline' },
                { id: 'deployment-strategies', name: 'Deployment Strategies' },
                { id: 'deployment-metrics', name: 'Deployment Metrics' },
                { id: 'case-studies', name: 'Success Stories' },
                { id: 'integration-ecosystem', name: 'Integration Ecosystem' },
                { id: 'faq', name: 'FAQ' }
            ],
            expectedComponents: {
                'core-capabilities': { minElements: { '.capability-card': 4 } },
                'release-pipeline': { minElements: { '.pipeline-stage': 4 } },
                'deployment-strategies': { minElements: { '.strategy-card': 3 } },
                'faq': { minElements: { '.accordion-item': 3 } }
            }
        }
    };
    
    // Language configurations
    const languages = [
        { code: 'en', name: 'English', path: '' },
        { code: 'es', name: 'Spanish', path: '/es' },
        { code: 'fr', name: 'French', path: '/fr' },
        { code: 'ar', name: 'Arabic', path: '/ar' }
    ];
    
    // Test each feature page in each language
    for (const [featureKey, featureConfig] of Object.entries(featurePages)) {
        for (const lang of languages) {
            const pagePath = lang.path ? `${lang.path}/${featureKey}/` : `/${featureKey}/`;
            
            test(`${lang.name} ${featureConfig.name} page has all required sections`, async ({ page }) => {
                // Navigate to the page
                await page.goto(`${baseUrl}${pagePath}`);
                await page.waitForLoadState('networkidle');
                
                // Verify page loaded successfully
                const response = await page.goto(`${baseUrl}${pagePath}`);
                expect(response.status()).toBe(200);
                
                // Check for each expected section
                for (const section of featureConfig.expectedSections) {
                    const sectionElement = page.locator(`#${section.id}`);
                    await expect(
                        sectionElement, 
                        `${lang.name} ${featureConfig.name} should have ${section.name} section`
                    ).toBeVisible({ timeout: 5000 });
                    
                    // Verify section has content
                    const sectionHeight = await sectionElement.evaluate(el => el.offsetHeight);
                    expect(
                        sectionHeight,
                        `${section.name} section should have substantial content`
                    ).toBeGreaterThan(100);
                }
            });
            
            test(`${lang.name} ${featureConfig.name} page has complete components`, async ({ page }) => {
                await page.goto(`${baseUrl}${pagePath}`);
                await page.waitForLoadState('networkidle');
                
                // Check components in each section
                for (const [sectionId, requirements] of Object.entries(featureConfig.expectedComponents)) {
                    const section = page.locator(`#${sectionId}`);
                    
                    if (await section.isVisible()) {
                        // Check minimum element counts
                        if (requirements.minElements) {
                            for (const [selector, minCount] of Object.entries(requirements.minElements)) {
                                const elements = section.locator(selector);
                                const count = await elements.count();
                                
                                expect(
                                    count,
                                    `${lang.name} ${featureConfig.name} ${sectionId} should have at least ${minCount} ${selector}`
                                ).toBeGreaterThanOrEqual(minCount);
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Test language-specific content
    test.describe('Language-specific content validation', () => {
        const translations = {
            'en': {
                'autorag': {
                    overview: 'What is AutoRAG',
                    benefits: 'Key Benefits',
                    cta: 'Request Demo'
                },
                'quality-assurance': {
                    overview: 'What is LLM Quality Assurance',
                    benefits: 'Key Benefits',
                    cta: 'Request Demo'
                },
                'release-management': {
                    overview: 'What is LLM Release Management',
                    capabilities: 'Core Capabilities',
                    cta: 'Request Demo'
                }
            },
            'es': {
                'autorag': {
                    overview: 'Qué es AutoRAG',
                    benefits: 'Beneficios Clave',
                    cta: 'Solicitar Demo'
                },
                'quality-assurance': {
                    overview: 'Qué es el Aseguramiento de Calidad',
                    benefits: 'Beneficios Clave',
                    cta: 'Solicitar Demo'
                },
                'release-management': {
                    overview: 'Qué es la Gestión de Lanzamientos',
                    capabilities: 'Capacidades Principales',
                    cta: 'Solicitar Demo'
                }
            },
            'fr': {
                'autorag': {
                    overview: "Qu'est-ce qu'AutoRAG",
                    benefits: 'Avantages Clés',
                    cta: 'Demander une Démo'
                },
                'quality-assurance': {
                    overview: "Qu'est-ce que l'Assurance Qualité",
                    benefits: 'Avantages Clés',
                    cta: 'Demander une Démo'
                },
                'release-management': {
                    overview: "Qu'est-ce que la Gestion des Versions",
                    capabilities: 'Capacités Principales',
                    cta: 'Demander une Démo'
                }
            },
            'ar': {
                'autorag': {
                    overview: 'ما هو AutoRAG',
                    benefits: 'المزايا الرئيسية',
                    cta: 'طلب عرض توضيحي'
                },
                'quality-assurance': {
                    overview: 'ما هو ضمان الجودة',
                    benefits: 'المزايا الرئيسية',
                    cta: 'طلب عرض توضيحي'
                },
                'release-management': {
                    overview: 'ما هي إدارة الإصدارات',
                    capabilities: 'القدرات الأساسية',
                    cta: 'طلب عرض توضيحي'
                }
            }
        };
        
        for (const lang of languages) {
            for (const [featureKey, featureConfig] of Object.entries(featurePages)) {
                test(`${lang.name} ${featureConfig.name} has correct translations`, async ({ page }) => {
                    const pagePath = lang.path ? `${lang.path}/${featureKey}/` : `/${featureKey}/`;
                    await page.goto(`${baseUrl}${pagePath}`);
                    await page.waitForLoadState('networkidle');
                    
                    const expectedTexts = translations[lang.code]?.[featureKey];
                    if (expectedTexts) {
                        // Check overview heading
                        const overviewHeading = page.locator('#feature-overview .section-heading').first();
                        if (await overviewHeading.isVisible()) {
                            const text = await overviewHeading.textContent();
                            expect(text).toContain(expectedTexts.overview);
                        }
                        
                        // Check CTA button
                        const ctaButton = page.locator('.secondary-button').first();
                        if (await ctaButton.isVisible()) {
                            const text = await ctaButton.textContent();
                            expect(text).toContain(expectedTexts.cta);
                        }
                    }
                });
            }
        }
    });
    
    // Visual consistency tests
    test.describe('Visual consistency across languages', () => {
        test('All feature pages maintain consistent layout', async ({ page }) => {
            const referenceLayout = {};
            
            // Get layout from English AutoRAG as reference
            await page.goto(`${baseUrl}/autorag/`);
            await page.waitForLoadState('networkidle');
            
            const sections = await page.locator('section[id]').all();
            for (const section of sections) {
                const id = await section.getAttribute('id');
                const box = await section.boundingBox();
                if (box) {
                    referenceLayout[id] = {
                        hasContent: box.height > 100,
                        aspectRatio: box.width / box.height
                    };
                }
            }
            
            // Compare with other versions
            for (const lang of languages.slice(1)) { // Skip English
                for (const featureKey of Object.keys(featurePages)) {
                    const pagePath = `${lang.path}/${featureKey}/`;
                    await page.goto(`${baseUrl}${pagePath}`);
                    await page.waitForLoadState('networkidle');
                    
                    for (const [sectionId, reference] of Object.entries(referenceLayout)) {
                        const section = page.locator(`#${sectionId}`);
                        if (reference.hasContent && await section.isVisible()) {
                            const box = await section.boundingBox();
                            expect(
                                box && box.height > 100,
                                `${lang.name} ${featureKey} ${sectionId} should have content`
                            ).toBeTruthy();
                        }
                    }
                }
            }
        });
    });
    
    // Performance tests
    test.describe('Feature pages performance', () => {
        test('All feature pages load within acceptable time', async ({ page }) => {
            const maxLoadTime = 5000; // 5 seconds
            
            for (const lang of languages) {
                for (const featureKey of Object.keys(featurePages)) {
                    const pagePath = lang.path ? `${lang.path}/${featureKey}/` : `/${featureKey}/`;
                    
                    const startTime = Date.now();
                    await page.goto(`${baseUrl}${pagePath}`);
                    await page.waitForLoadState('networkidle');
                    const loadTime = Date.now() - startTime;
                    
                    expect(
                        loadTime,
                        `${lang.name} ${featureKey} should load within ${maxLoadTime}ms`
                    ).toBeLessThan(maxLoadTime);
                }
            }
        });
    });
});

// Summary test to identify incomplete pages
test.describe('Feature Pages Completeness Summary', () => {
    const baseUrl = 'http://127.0.0.1:1027';
    
    test('Generate completeness report', async ({ page }) => {
        const report = {
            complete: [],
            incomplete: [],
            missing: []
        };
        
        const features = ['autorag', 'quality-assurance', 'release-management'];
        const languages = [
            { code: 'es', name: 'Spanish' },
            { code: 'fr', name: 'French' },
            { code: 'ar', name: 'Arabic' }
        ];
        
        for (const lang of languages) {
            for (const feature of features) {
                const pagePath = `/${lang.code}/${feature}/`;
                
                try {
                    const response = await page.goto(`${baseUrl}${pagePath}`);
                    
                    if (response.status() === 200) {
                        // Check if page has main sections
                        const hasBenefits = await page.locator('#feature-benefits').isVisible();
                        const hasDetails = await page.locator('#feature-details, #core-capabilities, #feature-details').isVisible();
                        const hasFAQ = await page.locator('#faq').isVisible();
                        
                        if (hasBenefits && hasDetails && hasFAQ) {
                            report.complete.push(`${lang.name} ${feature}`);
                        } else {
                            report.incomplete.push(`${lang.name} ${feature}`);
                        }
                    } else {
                        report.missing.push(`${lang.name} ${feature}`);
                    }
                } catch (error) {
                    report.missing.push(`${lang.name} ${feature}`);
                }
            }
        }
        
        // Output report
        console.log('\n=== Feature Pages Completeness Report ===');
        console.log(`✅ Complete: ${report.complete.length} pages`);
        report.complete.forEach(page => console.log(`   - ${page}`));
        
        console.log(`\n⚠️  Incomplete: ${report.incomplete.length} pages`);
        report.incomplete.forEach(page => console.log(`   - ${page}`));
        
        console.log(`\n❌ Missing: ${report.missing.length} pages`);
        report.missing.forEach(page => console.log(`   - ${page}`));
        
        // Fail test if there are incomplete pages
        expect(
            report.incomplete.length,
            `Found ${report.incomplete.length} incomplete feature pages`
        ).toBe(0);
    });
});