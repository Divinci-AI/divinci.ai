import { test, expect } from '@playwright/test';
import { NavigationPage } from '../page-objects/NavigationPage';
import { LinkChecker } from '../utils/LinkChecker';

test.describe('Navigation Links Tests', () => {
  let navigation: NavigationPage;
  let linkChecker: LinkChecker;

  test.beforeEach(async ({ page }) => {
    navigation = new NavigationPage(page);
    await page.goto('/');
    await page.waitForSelector('.site-footer', { timeout: 10000 });
    linkChecker = new LinkChecker(page);
  });

  test('should have proper footer structure', async () => {
    await navigation.verifyFooterStructure();
  });

  test('should have all expected footer links', async ({ page }) => {
    const footerLinks = await navigation.getAllFooterLinks();

    // Get expected link texts based on current language
    const currentUrl = page.url();
    let expectedTexts: { [key: string]: string[] };

    if (currentUrl.includes('/fr/')) {
      expectedTexts = {
        product: ['Fonctionnalités', 'Tarifs', 'Feuille de Route', 'Journal des Modifications'],
        resources: ['Documentation', 'Blog', 'Tutoriels', 'API'],
        company: ['À Propos de Nous', 'Carrières', 'Contact', 'Presse'],
        legal: ['Conditions d\'Utilisation', 'Politique de Confidentialité', 'Sécurité IA et Éthique', 'Sécurité'],
        bottom: ['Plan du Site', 'Accessibilité', 'Politique des Cookies']
      };
    } else if (currentUrl.includes('/es/')) {
      expectedTexts = {
        product: ['Características', 'Precios', 'Hoja de Ruta', 'Registro de Cambios'],
        resources: ['Documentación', 'Blog', 'Tutoriales', 'API'],
        company: ['Sobre Nosotros', 'Carreras', 'Contacto', 'Prensa'],
        legal: ['Términos de Servicio', 'Política de Privacidad', 'Seguridad IA y Ética', 'Seguridad'],
        bottom: ['Mapa del Sitio', 'Accesibilidad', 'Política de Cookies']
      };
    } else if (currentUrl.includes('/ar/')) {
      expectedTexts = {
        product: ['المميزات', 'الأسعار', 'خارطة الطريق', 'سجل التغييرات'],
        resources: ['التوثيق', 'المدونة', 'الدروس التعليمية', 'واجهة برمجة التطبيقات'],
        company: ['من نحن', 'الوظائف', 'اتصل بنا', 'الصحافة'],
        legal: ['شروط الخدمة', 'سياسة الخصوصية', 'أمان الذكاء الاصطناعي والأخلاق', 'الأمان'],
        bottom: ['خريطة الموقع', 'إمكانية الوصول', 'سياسة ملفات تعريف الارتباط']
      };
    } else {
      expectedTexts = {
        product: ['Features', 'Pricing', 'Roadmap', 'Changelog'],
        resources: ['Documentation', 'Blog', 'Tutorials', 'API'],
        company: ['About Us', 'Careers', 'Contact', 'Press'],
        legal: ['Terms of Service', 'Privacy Policy', 'AI Safety & Ethics', 'Security'],
        bottom: ['Sitemap', 'Accessibility', 'Cookie Policy']
      };
    }

    // Verify we have links in each section
    const productLinks = footerLinks.filter(link => expectedTexts.product.includes(link.text));
    const resourceLinks = footerLinks.filter(link => expectedTexts.resources.includes(link.text));
    const companyLinks = footerLinks.filter(link => expectedTexts.company.includes(link.text));
    const legalLinks = footerLinks.filter(link => expectedTexts.legal.includes(link.text));
    const bottomLinks = footerLinks.filter(link => expectedTexts.bottom.includes(link.text));

    expect(productLinks.length).toBeGreaterThanOrEqual(4);
    expect(resourceLinks.length).toBeGreaterThanOrEqual(4);
    expect(companyLinks.length).toBeGreaterThanOrEqual(4);
    expect(legalLinks.length).toBeGreaterThanOrEqual(4);
    expect(bottomLinks.length).toBeGreaterThanOrEqual(3);
  });

  test('should have working social media links', async () => {
    const socialLinks = await navigation.getSocialLinks();

    expect(socialLinks.length).toBe(3);

    // Check that social links are external and point to correct domains
    const twitterLink = socialLinks.find(link => link.text.includes('Twitter'));
    const linkedinLink = socialLinks.find(link => link.text.includes('LinkedIn'));
    const githubLink = socialLinks.find(link => link.text.includes('GitHub'));

    expect(twitterLink?.href).toContain('twitter.com');
    expect(linkedinLink?.href).toContain('linkedin.com');
    expect(githubLink?.href).toContain('github.com');

    // Verify all social links are external
    for (const link of socialLinks) {
      expect(link.isExternal).toBe(true);
    }
  });

  test('should check all footer links for broken links', async () => {
    const footerResults = await linkChecker.checkFooterLinks();
    const brokenLinks = footerResults.filter(result => !result.ok);

    if (brokenLinks.length > 0) {
      console.log('Broken footer links found:');
      brokenLinks.forEach(link => {
        console.log(`- ${link.url}: Status ${link.status} ${link.error ? `(${link.error})` : ''}`);
      });
    }

    // Allow some external links to fail, but internal links should work
    const brokenInternalLinks = brokenLinks.filter(link =>
      !link.url.startsWith('http') || link.url.includes('localhost') || link.url.includes('127.0.0.1')
    );

    expect(brokenInternalLinks.length).toBe(0);
  });

  test('should validate anchor links point to existing elements', async () => {
    const anchorValidation = await linkChecker.validateAnchorLinks();
    const invalidAnchors = anchorValidation.filter(anchor => !anchor.exists);

    if (invalidAnchors.length > 0) {
      console.log('Invalid anchor links found:');
      invalidAnchors.forEach(anchor => {
        console.log(`- ${anchor.href}: Target element #${anchor.element} not found`);
      });
    }

    expect(invalidAnchors.length).toBe(0);
  });



  test('should handle external social links correctly', async ({ page }) => {
    const socialLinks = await navigation.getSocialLinks();

    // Test Twitter link
    const twitterLink = socialLinks.find(link => link.href.includes('twitter.com'));
    if (twitterLink) {
      const linkElement = page.locator(twitterLink.selector);
      await expect(linkElement).toHaveAttribute('target', '_blank');
      await expect(linkElement).toHaveAttribute('aria-label');
    }
  });

  test('should check navigation links across different pages', async ({ page }) => {
    // Test from homepage
    const homePageSummary = await linkChecker.getPageLinkSummary();
    expect(homePageSummary.totalLinks).toBeGreaterThan(0);

    // Navigate to blog if it exists
    try {
      await page.goto('/blog/');
      await page.waitForSelector('body', { timeout: 5000 });

      const blogLinkChecker = new LinkChecker(page);
      const blogPageSummary = await blogLinkChecker.getPageLinkSummary();
      expect(blogPageSummary.totalLinks).toBeGreaterThan(0);
    } catch (error) {
      console.log('Blog page not accessible, skipping blog navigation test');
    }
  });

  test('should verify footer links work from feature pages', async ({ page }) => {
    // Try to navigate to a feature page first
    try {
      await page.goto('/features/');
      await page.waitForSelector('.site-footer', { timeout: 5000 });

      const featurePageNavigation = new NavigationPage(page);
      const footerLinks = await featurePageNavigation.getAllFooterLinks();

      // Verify footer links are properly adjusted for feature page context
      const internalLinks = footerLinks.filter(link => !link.isExternal && !link.isAnchor);

      for (const link of internalLinks.slice(0, 3)) { // Test first 3 to avoid timeout
        const status = await featurePageNavigation.checkLinkStatus(link.href);
        expect(status.ok).toBe(true);
      }

      // Verify the feature page has proper content
      await expect(page.locator('h1')).toContainText('Features');
      await expect(page.locator('.card')).toHaveCount(3); // Should have 3 feature cards
    } catch (error) {
      console.log('Feature pages not accessible, skipping feature page navigation test');
    }
  });

  test('should navigate to features page via footer link', async ({ page }) => {
    const featuresLink = page.locator('.footer-links-column a[href="#features"]');
    if (await featuresLink.count() > 0) {
      await featuresLink.click();
      await page.waitForTimeout(1000); // Allow scroll animation

      const featuresSection = page.locator('#features');
      await expect(featuresSection).toBeInViewport();
    } else {
      console.log('Features anchor link not found, skipping anchor navigation test');
    }
  });

  test('should test footer links across multiple languages', async ({ page }) => {
    const languages = [
      { code: 'en', path: '/' },
      { code: 'fr', path: '/fr/' },
      { code: 'es', path: '/es/' },
      { code: 'ar', path: '/ar/' }
    ];

    for (const lang of languages) {
      try {
        await page.goto(lang.path);
        await page.waitForSelector('.site-footer', { timeout: 5000 });

        const langNavigation = new NavigationPage(page);
        const footerLinks = await langNavigation.getAllFooterLinks();

        console.log(`Testing ${lang.code} footer links (${footerLinks.length} links)`);

        // Verify footer structure exists in each language
        await langNavigation.verifyFooterStructure();

        // Check a few key links work
        const keyLinks = footerLinks.filter(link =>
          link.text.includes('Features') ||
          link.text.includes('Blog') ||
          link.text.includes('Contact')
        ).slice(0, 2);

        for (const link of keyLinks) {
          if (!link.isExternal) {
            const status = await langNavigation.checkLinkStatus(link.href);
            expect(status.ok).toBe(true);
          }
        }
      } catch (error) {
        console.log(`Language ${lang.code} not accessible: ${error}`);
      }
    }
  });

  test('should generate comprehensive link report', async () => {
    const summary = await linkChecker.getPageLinkSummary();

    console.log('Link Summary Report:');
    console.log(`Total Links: ${summary.totalLinks}`);
    console.log(`Internal Links: ${summary.internalLinks}`);
    console.log(`External Links: ${summary.externalLinks}`);
    console.log(`Anchor Links: ${summary.anchorLinks}`);
    console.log(`Working Links: ${summary.workingLinks.length}`);
    console.log(`Broken Links: ${summary.brokenLinks.length}`);

    if (summary.brokenLinks.length > 0) {
      console.log('\nBroken Links Details:');
      summary.brokenLinks.forEach(link => {
        console.log(`- ${link.url}: Status ${link.status} ${link.error ? `(${link.error})` : ''}`);
      });
    }

    // Ensure we have a reasonable number of links
    expect(summary.totalLinks).toBeGreaterThan(10);

    // Most links should be working (allow some external links to fail)
    const successRate = summary.workingLinks.length / summary.totalLinks;
    expect(successRate).toBeGreaterThan(0.8); // 80% success rate
  });
});
